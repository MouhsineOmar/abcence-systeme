import { useState } from "react";
import Container from "../components/Container";
import { Card, CardContent, CardHeader } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";
import api from "../services/api";

export default function ExportPage() {
  const [groupId, setGroupId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setErr(null); setMsg(null); setLoading(true);
    try {
      const params: any = {};
      if (sessionId) params.session_id = sessionId;
      else if (groupId) params.group_id = groupId;
      else throw new Error("session_id ou group_id requis");

      const res = await api.get("/attendance/export", { params, responseType: "blob" });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers["content-disposition"] as string | undefined;
      const match = cd?.match(/filename=([^;]+)/i);
      a.download = match ? match[1].replace(/"/g, "") : "attendance.xlsx";

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMsg("Téléchargement lancé ✅");
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || "Erreur export";
      setErr(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1 className="text-3xl font-semibold tracking-tight">Export Excel</h1>
      <p className="mt-1 text-zinc-400">
        Si tu donnes <b>session_id</b> → export pour 1 séance. Sinon <b>group_id</b> → toutes les séances du groupe.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Paramètres" subtitle="Choisis session_id ou group_id" />
          <CardContent className="space-y-4">
            {err ? <Toast type="error" message={err} /> : null}
            {msg ? <Toast type="success" message={msg} /> : null}

            <Input label="Session ID (prioritaire)" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="ex: 2" />
            <Input label="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="ex: 1" />

            <Button className="w-full" variant="primary" onClick={download} disabled={loading}>
              {loading ? "Export..." : "Télécharger Excel"}
            </Button>

            <div className="text-xs text-zinc-500">Endpoint: <code>/api/v1/attendance/export</code></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Conseils" subtitle="Pour éviter les erreurs" />
          <CardContent className="space-y-2 text-sm text-zinc-400">
            <p>✅ Assure-toi d'être connecté (token JWT). Sinon, tu auras 401/403.</p>
            <p>✅ Vérifie que session_id / group_id existent.</p>
            <p>✅ Les absents sont calculés : (étudiants du groupe - présents).</p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
