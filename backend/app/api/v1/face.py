# app/api/v1/face.py
import io
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import cv2
from PIL import Image, ImageOps
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_teacher_or_admin, require_admin
from app.models.user import User, RoleEnum
from app.models.student_face import StudentFace
from app.models.session import Session as SessionModel
from app.models.user_group import UserGroup
from app.models.attendance import Attendance, AttendanceStatus

router = APIRouter()

# Seuil cosine similarity (plus grand = plus strict)
# 0.35~0.55 selon caméra/qualité. Commence à 0.40 puis ajuste.
COSINE_THRESHOLD = 0.40

# Taille max pour stabilité/perf
MAX_SIZE = 1280

# Project root = .../app/api/v1/face.py -> parents[3] => project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODELS_DIR = PROJECT_ROOT / "models"

YUNET_PATH = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
SFACE_PATH = MODELS_DIR / "face_recognition_sface_2021dec.onnx"

_detector = None
_recognizer = None


def _require_models():
    if not YUNET_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Modèle YuNet introuvable: {YUNET_PATH}. Télécharge face_detection_yunet_2023mar.onnx dans /models.",
        )
    if not SFACE_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Modèle SFace introuvable: {SFACE_PATH}. Télécharge face_recognition_sface_2021dec.onnx dans /models.",
        )


def _load_models_if_needed(img_w: int, img_h: int):
    global _detector, _recognizer
    _require_models()

    if _detector is None:
        # params: model, config, input_size, score_threshold, nms_threshold, top_k
        _detector = cv2.FaceDetectorYN_create(
            str(YUNET_PATH), "", (img_w, img_h), 0.9, 0.3, 5000
        )

    if _recognizer is None:
        _recognizer = cv2.FaceRecognizerSF_create(str(SFACE_PATH), "")

    # important: YuNet doit connaître la taille de l'image courante
    _detector.setInputSize((img_w, img_h))


def _bytes_to_bgr(data: bytes) -> np.ndarray:
    if not data:
        raise HTTPException(status_code=400, detail="Fichier vide")

    try:
        img = Image.open(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Image invalide. Utilise un JPG/PNG standard.")

    img = ImageOps.exif_transpose(img)
    img = img.convert("RGB")

    w, h = img.size
    m = max(w, h)
    if m > MAX_SIZE:
        scale = MAX_SIZE / float(m)
        img = img.resize((int(w * scale), int(h * scale)))

    rgb = np.asarray(img, dtype=np.uint8)
    rgb = np.require(rgb, dtype=np.uint8, requirements=["C_CONTIGUOUS"])

    # OpenCV travaille en BGR
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return bgr


def _detect_faces(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    _load_models_if_needed(w, h)

    # detect returns (retval, faces)
    retval, faces = _detector.detect(bgr)
    if faces is None or len(faces) == 0:
        return np.empty((0, 15), dtype=np.float32)
    return faces


def _extract_feature(bgr: np.ndarray, face_row: np.ndarray) -> np.ndarray:
    """
    face_row: [x, y, w, h, score, l0x,l0y, l1x,l1y, ..., l4x,l4y]
    """
    aligned = _recognizer.alignCrop(bgr, face_row)
    feat = _recognizer.feature(aligned)  # shape (1, 128) float32
    feat = feat.reshape(-1).astype(np.float32)
    return feat


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    na = np.linalg.norm(a) + 1e-8
    nb = np.linalg.norm(b) + 1e-8
    return float(np.dot(a, b) / (na * nb))


@router.get("/status")
def face_status():
    return {
        "backend": "opencv_yunet_sface",
        "models_dir": str(MODELS_DIR),
        "yunet_exists": YUNET_PATH.exists(),
        "sface_exists": SFACE_PATH.exists(),
        "cosine_threshold": COSINE_THRESHOLD,
    }


@router.post("/register/{student_id}")
def register_face(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    student = (
        db.query(User)
        .filter(User.id == student_id, User.role == RoleEnum.STUDENT)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")

    data = file.file.read()
    bgr = _bytes_to_bgr(data)

    faces = _detect_faces(bgr)
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="Aucun visage détecté. Photo de face, bien éclairée.")
    if len(faces) > 1:
        raise HTTPException(status_code=400, detail="Plusieurs visages détectés. Envoie une photo avec un seul visage.")

    feat = _extract_feature(bgr, faces[0])
    enc_json = json.dumps(feat.tolist())

    sf = db.query(StudentFace).filter(StudentFace.user_id == student_id).first()
    if sf:
        sf.encoding = enc_json
    else:
        db.add(StudentFace(user_id=student_id, encoding=enc_json))

    db.commit()
    return {"message": "Visage enregistré (OpenCV SFace)", "student_id": student_id}


@router.post("/mark-attendance/{session_id}")
def mark_attendance(
    session_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
):
    sess = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    student_ids = [
        ug.user_id
        for ug in db.query(UserGroup).filter(UserGroup.group_id == sess.group_id).all()
    ]
    if not student_ids:
        raise HTTPException(status_code=400, detail="Aucun étudiant dans ce groupe")

    face_rows = db.query(StudentFace).filter(StudentFace.user_id.in_(student_ids)).all()
    if not face_rows:
        raise HTTPException(status_code=400, detail="Aucun visage enregistré pour ce groupe")

    known_feats: List[np.ndarray] = []
    known_ids: List[int] = []
    for fr in face_rows:
        try:
            v = np.array(json.loads(fr.encoding), dtype=np.float32)
            if v.ndim != 1:
                continue
            known_feats.append(v)
            known_ids.append(fr.user_id)
        except Exception:
            continue

    if not known_feats:
        raise HTTPException(status_code=400, detail="Encodages invalides en base. Ré-enregistre les visages.")

    data = file.file.read()
    bgr = _bytes_to_bgr(data)

    faces = _detect_faces(bgr)
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="Aucun visage détecté sur l'image envoyée")

    now = datetime.utcnow()
    recognized: List[Dict[str, Any]] = []

    for f in faces:
        feat = _extract_feature(bgr, f)

        # cherche meilleur match
        best_sim = -1.0
        best_uid: Optional[int] = None
        for uid, kfeat in zip(known_ids, known_feats):
            sim = _cosine_sim(feat, kfeat)
            if sim > best_sim:
                best_sim = sim
                best_uid = uid

        if best_uid is not None and best_sim >= COSINE_THRESHOLD:
            recognized.append({"user_id": best_uid, "similarity": best_sim})

            exists = (
                db.query(Attendance)
                .filter(Attendance.session_id == session_id, Attendance.user_id == best_uid)
                .first()
            )
            if not exists:
                db.add(
                    Attendance(
                        session_id=session_id,
                        user_id=best_uid,
                        status=AttendanceStatus.PRESENT,
                        timestamp=now,
                    )
                )

    db.commit()

    if not recognized:
        raise HTTPException(
            status_code=404,
            detail="Aucun étudiant reconnu. (Photo floue/loin, ou seuil trop strict).",
        )

    return {"session_id": session_id, "recognized": recognized, "faces_in_image": int(len(faces))}
