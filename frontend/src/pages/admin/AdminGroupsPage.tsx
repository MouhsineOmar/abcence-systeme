import { useEffect, useState } from "react";
import Container from "../../components/Container";
import { Card, CardContent, CardHeader } from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Toast from "../../components/Toast";
import api from "../../services/api";

type Group = { id: number; name: string };

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await api.get("/groups/");
      setGroups(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Impossible de charger (admin only ?)");
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setError(null); setInfo(null);
    try {
      const res = await api.post("/groups/", { name });
      setInfo(`Groupe créé: id=${res.data.id}`);
      setName("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur création groupe");
    }
  };

  const addStudent = async () => {
    setError(null); setInfo(null);
    try {
      const res = await api.post(`/groups/${groupId}/add-student/${studentId}`);
      setInfo(res.data?.message || "OK");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur add-student");
    }
  };

  return (
    <Container>
      <h1 className="text-3xl font-semibold tracking-tight">Admin · Groupes</h1>
      <p className="mt-1 text-zinc-400">Créer des groupes et ajouter des étudiants.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Créer un groupe" subtitle="POST /groups (admin)" />
          <CardContent className="space-y-4">
            {error ? <Toast type="error" message={error} /> : null}
            {info ? <Toast type="success" message={info} /> : null}

            <Input label="Nom du groupe" value={name} onChange={(e) => setName(e.target.value)} placeholder="GI-2 / SMI-1 ..." />
            <Button className="w-full" onClick={create}>Créer</Button>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-sm font-medium">Ajouter un étudiant à un groupe</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input label="group_id" value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="ex: 1" />
                <Input label="student_id" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="ex: 2" />
              </div>
              <Button className="mt-3 w-full" variant="secondary" onClick={addStudent}>Ajouter</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Liste des groupes" subtitle="GET /groups (admin)" />
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-zinc-400">{groups.length} groupe(s)</div>
              <Button variant="secondary" onClick={load}>Rafraîchir</Button>
            </div>

            <div className="space-y-2">
              {groups.map((g) => (
                <div key={g.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{g.name}</div>
                    <div className="text-xs text-zinc-500">ID: {g.id}</div>
                  </div>
                  <div className="text-xs text-zinc-500">Use group_id in sessions/export</div>
                </div>
              ))}
              {!groups.length ? <div className="text-sm text-zinc-500">Aucun groupe.</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
