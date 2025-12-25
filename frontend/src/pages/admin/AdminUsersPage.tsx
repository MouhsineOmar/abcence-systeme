import { useEffect, useRef, useState } from "react";
import Container from "../../components/Container";
import { Card, CardContent, CardHeader } from "../../components/Card";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import Toast from "../../components/Toast";
import api from "../../services/api";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  is_active: boolean;
};

type CamTest = {
  secureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  permission?: PermissionState | "unknown";
  devices?: { kind: string; label: string }[];
  lastError?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("STUDENT");
  const [password, setPassword] = useState("");

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [registerTargetId, setRegisterTargetId] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  // Tests
  const [testing, setTesting] = useState(false);
  const [camTest, setCamTest] = useState<CamTest | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ---------- load users
  const load = async () => {
    setError(null);
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Impossible de charger (admin only ?)");
    }
  };

  useEffect(() => {
    load();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- create user
  const create = async () => {
    setError(null);
    setInfo(null);
    try {
      const res = await api.post("/users/", {
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        password: password || null,
      });

      setInfo(`Utilisateur créé: id=${res.data.id}`);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole("STUDENT");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur création user");
    }
  };

  // ✅ IMPORTANT: on attache le stream au <video> ici, pas dans startCamera()
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!cameraOpen) return;
    if (!video) return;
    if (!stream) return;

    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    video.srcObject = stream;

    const onLoaded = () => {
      video.play().catch(() => {
        setCameraError("Autoplay bloqué. Clique sur la vidéo puis réessaie.");
      });
    };

    video.addEventListener("loadedmetadata", onLoaded);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [cameraOpen]);

  // ---------- camera tests
  const runCameraTests = async () => {
    setTesting(true);
    setCameraError(null);

    const result: CamTest = {
      secureContext: window.isSecureContext,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      permission: "unknown",
      devices: [],
    };

    try {
      if ((navigator as any).permissions?.query) {
        try {
          const p = await (navigator as any).permissions.query({ name: "camera" });
          result.permission = p.state;
        } catch {
          result.permission = "unknown";
        }
      }

      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        result.devices = devices
          .filter((d) => d.kind === "videoinput" || d.kind === "audioinput")
          .map((d) => ({ kind: d.kind, label: d.label || "(label masqué — autorise caméra)" }));
      }

      if (navigator.mediaDevices?.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        s.getTracks().forEach((t) => t.stop());
      } else {
        result.lastError = "getUserMedia indisponible";
      }
    } catch (e: any) {
      result.lastError = `${e?.name || "Erreur"}: ${e?.message || "?"}`;
    }

    setCamTest(result);
    setTesting(false);
  };

  // ---------- start / stop camera
  const startCamera = async (studentId: number) => {
    setCameraError(null);
    setInfo(null);
    setError(null);

    try {
      stopCamera();

      if (!window.isSecureContext) {
        setCameraError("Contexte non sécurisé. Utilise http://localhost:5173 (pas IP) ou HTTPS.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("getUserMedia non supporté par ce navigateur.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      setRegisterTargetId(studentId);
      setCameraOpen(true); // ✅ le <video> sera rendu, puis useEffect attachera le stream
    } catch (err: any) {
      if (err?.name === "NotAllowedError") setCameraError("Permission caméra refusée.");
      else if (err?.name === "NotFoundError") setCameraError("Aucune caméra détectée.");
      else if (err?.name === "NotReadableError") setCameraError("Caméra occupée par une autre app.");
      else setCameraError(err?.message || "Impossible d'accéder à la caméra.");
      setCameraOpen(false);
      setRegisterTargetId(null);
    }
  };

  const stopCamera = () => {
    try {
      const video = videoRef.current;
      if (video) {
        video.pause();
        (video as any).srcObject = null;
      }
    } catch {}

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setCameraOpen(false);
    setRegisterTargetId(null);
  };

  // ---------- capture
  const captureAsBlob = async (): Promise<Blob> => {
    const video = videoRef.current;
    if (!video) throw new Error("Video not ready");

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    ctx.drawImage(video, 0, 0, w, h);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.92
      );
    });
  };

  // ---------- register face
  const registerFaceFromCamera = async () => {
    if (!registerTargetId) {
      setCameraError("Sélectionne un étudiant d'abord.");
      return;
    }

    setRegistering(true);
    setCameraError(null);
    setError(null);
    setInfo(null);

    try {
      const blob = await captureAsBlob();
      const fd = new FormData();
      fd.append("file", blob, "capture.jpg");

      const res = await api.post(`/face/register/${registerTargetId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInfo(res.data?.message || "Visage enregistré");
      stopCamera();
    } catch (e: any) {
      setCameraError(e?.response?.data?.detail || "Erreur lors de l'enregistrement du visage");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Container>
      <h1 className="text-3xl font-semibold tracking-tight">Admin · Utilisateurs</h1>
      <p className="mt-1 text-zinc-400">Créer profs/étudiants + scanner visage via caméra.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* LEFT */}
        <Card>
          <CardHeader title="Créer un utilisateur" subtitle="POST /users (admin)" />
          <CardContent className="space-y-4">
            {error ? <Toast type="error" message={error} /> : null}
            {info ? <Toast type="success" message={info} /> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>

            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>

              <Input
                label="Mot de passe (optionnel)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={create}>
              Créer
            </Button>

            {/* CAMERA PANEL */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-zinc-200">Enregistrer visage (caméra)</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Clique “Scanner” sur un étudiant → puis “Capturer & Enregistrer”.
                  </div>
                </div>
                <Button variant="secondary" onClick={runCameraTests} disabled={testing}>
                  {testing ? "Test..." : "Tester caméra"}
                </Button>
              </div>

              {cameraError ? (
                <div className="mt-3">
                  <Toast type="error" message={cameraError} />
                </div>
              ) : null}

              {camTest ? (
                <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-300 space-y-1">
                  <div><span className="text-zinc-400">secureContext:</span> {String(camTest.secureContext)}</div>
                  <div><span className="text-zinc-400">mediaDevices:</span> {String(camTest.hasMediaDevices)}</div>
                  <div><span className="text-zinc-400">getUserMedia:</span> {String(camTest.hasGetUserMedia)}</div>
                  <div><span className="text-zinc-400">permission:</span> {String(camTest.permission)}</div>
                  <div className="mt-2 text-zinc-400">devices:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {(camTest.devices || []).map((d, idx) => (
                      <li key={idx}>{d.kind} — {d.label}</li>
                    ))}
                  </ul>
                  {camTest.lastError ? (
                    <div className="mt-2 text-red-300">
                      <span className="text-red-200">lastError:</span> {camTest.lastError}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* ✅ on garde le <video> dans le DOM dès que cameraOpen=true */}
              {cameraOpen ? (
                <div className="mt-3 space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                    <video
                      ref={videoRef}
                      className="w-full h-[280px] object-cover"
                      playsInline
                      autoPlay
                      muted
                      onClick={() => videoRef.current?.play().catch(() => {})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={registerFaceFromCamera} disabled={registering}>
                      {registering ? "Enregistrement..." : "Capturer & Enregistrer"}
                    </Button>
                    <Button variant="secondary" onClick={stopCamera} disabled={registering}>
                      Annuler
                    </Button>
                  </div>

                  <div className="text-xs text-zinc-500">
                    Astuce: visage centré, bonne lumière. Clique sur la vidéo si autoplay bloque.
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-500">Caméra fermée.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT */}
        <Card>
          <CardHeader title="Liste" subtitle="GET /users (admin)" />
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-zinc-400">{users.length} utilisateur(s)</div>
              <Button variant="secondary" onClick={load}>Rafraîchir</Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/60 text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Rôle</th>
                    <th className="px-3 py-2 text-left">Visage</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                      <td className="px-3 py-2 text-zinc-200">{u.id}</td>
                      <td className="px-3 py-2">{u.first_name} {u.last_name}</td>
                      <td className="px-3 py-2 text-zinc-300">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {u.role === "STUDENT" ? (
                          <Button variant="secondary" onClick={() => startCamera(u.id)}>
                            Scanner
                          </Button>
                        ) : (
                          <span className="text-xs text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!users.length ? (
                    <tr><td className="px-3 py-4 text-zinc-500" colSpan={5}>Aucun utilisateur.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Si tu vois 403: connecte-toi en ADMIN (admin@example.com / admin123).
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
