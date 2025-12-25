import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import { Card, CardContent, CardHeader } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";
import api from "../services/api";

type Recognized = { user_id: number; distance: number };

export default function RealtimeAttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [sessionId, setSessionId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [recognized, setRecognized] = useState<Recognized[]>([]);
  const [tickMs, setTickMs] = useState<number>(2000);

  useEffect(() => {
    if (!running) return;

    const start = async () => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Impossible d'accéder à la caméra. Autorise l'accès dans le navigateur.");
        setRunning(false);
      }
    };

    start();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [running]);

  const captureBlob = async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
    );
  };

  const sendFrame = async () => {
    if (!sessionId) {
      setError("Entre un session_id valide.");
      return;
    }
    setError(null);

    const blob = await captureBlob();
    if (!blob) return;

    const form = new FormData();
    form.append("file", blob, "frame.jpg");

    try {
      const res = await api.post(`/face/mark-attendance/${sessionId}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const rec: Recognized[] = res.data?.recognized || [];
      setRecognized(rec);
      setInfo(rec.length ? `Reconnu: ${rec.map((r) => r.user_id).join(", ")}` : "Aucun reconnu");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Erreur lors de la reconnaissance";
      setError(detail);
      setInfo(null);
    }
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => { sendFrame(); }, tickMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, tickMs, sessionId]);

  return (
    <Container>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Présence par caméra</h1>
        <p className="mt-1 text-zinc-400">Envoie une frame régulièrement au backend pour marquer la présence automatiquement.</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Paramètres" subtitle="Choisis la séance et démarre/arrête la capture." />
          <CardContent className="space-y-4">
            {error ? <Toast type="error" message={error} /> : null}
            {info ? <Toast type="info" message={info} /> : null}

            <Input
              label="Session ID"
              hint="Doit exister dans la base"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="ex: 1"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Intervalle (ms)"
                hint="2000 = toutes les 2s"
                type="number"
                value={tickMs}
                onChange={(e) => setTickMs(Number(e.target.value || 2000))}
              />
              <div className="flex items-end gap-2">
                {!running ? (
                  <Button className="w-full" variant="primary" onClick={() => setRunning(true)}>Démarrer</Button>
                ) : (
                  <Button className="w-full" variant="danger" onClick={() => setRunning(false)}>Arrêter</Button>
                )}
              </div>
            </div>

            <Button variant="secondary" onClick={sendFrame} disabled={!running}>Envoyer une frame maintenant</Button>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3 text-sm text-zinc-400">
              <div className="font-medium text-zinc-200">Résultats (dernier appel)</div>
              <div className="mt-2">
                {recognized.length ? (
                  <ul className="space-y-1">
                    {recognized.map((r) => (
                      <li key={r.user_id} className="flex items-center justify-between">
                        <span>Étudiant ID: <span className="text-zinc-100">{r.user_id}</span></span>
                        <span className="text-xs text-zinc-500">dist: {r.distance.toFixed(3)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-zinc-500">Aucun étudiant reconnu.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Caméra" subtitle="Autorise l'accès à la webcam dans ton navigateur." />
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
              <video ref={videoRef} className="w-full aspect-video" autoPlay playsInline muted />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-3 text-xs text-zinc-500">
              Capture côté navigateur → multipart/form-data vers le backend.
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
