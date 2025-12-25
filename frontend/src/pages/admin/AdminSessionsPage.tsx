import { useEffect, useState } from "react";
import Container from "../../components/Container";
import { Card, CardContent, CardHeader } from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Toast from "../../components/Toast";
import api from "../../services/api";

type Session = {
  id: number;
  group_id: number;
  teacher_id: number | null;
  start_time: string;
  end_time: string;
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [groupId, setGroupId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const load = async () => {
    setError(null);
    try {
      const res = await api.get("/sessions/");
      setSessions(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Impossible de charger (admin only ?)");
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setError(null); setInfo(null);
    try {
      const payload: any = {
        group_id: Number(groupId),
        teacher_id: teacherId ? Number(teacherId) : null,
        start_time: startTime,
        end_time: endTime,
      };
      const res = await api.post("/sessions/", payload);
      setInfo(`Séance créée: id=${res.data.id}`);
      setGroupId(""); setTeacherId(""); setStartTime(""); setEndTime("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur création séance");
    }
  };

  return (
    <Container>
      <h1 className="text-3xl font-semibold tracking-tight">Admin · Séances</h1>
      <p className="mt-1 text-zinc-400">
        Crée des séances liées à un groupe. Le prof utilise le <b>session_id</b> dans la page Caméra.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Créer une séance" subtitle="POST /sessions (admin)" />
          <CardContent className="space-y-4">
            {error ? <Toast type="error" message={error} /> : null}
            {info ? <Toast type="success" message={info} /> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="group_id" value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="ex: 1" />
              <Input label="teacher_id (optionnel)" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="ex: 3" />
            </div>

            <Input label="start_time (ISO)" hint="ex: 2025-12-22T10:00:00" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label="end_time (ISO)" hint="ex: 2025-12-22T12:00:00" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

            <Button className="w-full" onClick={create}>Créer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Liste des séances" subtitle="GET /sessions (admin)" />
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-zinc-400">{sessions.length} séance(s)</div>
              <Button variant="secondary" onClick={load}>Rafraîchir</Button>
            </div>

            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Session #{s.id}</div>
                    <div className="text-xs text-zinc-500">group_id: {s.group_id}</div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    start: {s.start_time}<br />
                    end: {s.end_time}<br />
                    teacher_id: {s.teacher_id ?? "null"}
                  </div>
                </div>
              ))}
              {!sessions.length ? <div className="text-sm text-zinc-500">Aucune séance.</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
