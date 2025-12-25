import { Link } from "react-router-dom";
import Container from "../components/Container";
import { Card, CardContent, CardHeader } from "../components/Card";
import Button from "../components/Button";

export default function DashboardPage() {
  return (
    <Container>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Démarre une séance, lance la caméra, marque la présence, puis exporte en Excel.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Présence en temps réel" subtitle="Caméra → frames → /face/mark-attendance/{session_id}" />
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-400">
              Ouvre la webcam et envoie une image toutes les ~2 secondes au backend.
            </p>
            <Link to="/attendance/realtime">
              <Button className="w-full" variant="primary">Ouvrir la caméra</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Export Excel" subtitle="Présents + absents calculés" />
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-400">Télécharge un fichier Excel par séance ou par groupe.</p>
            <Link to="/export">
              <Button className="w-full" variant="secondary">Exporter</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Admin" subtitle="Users / Groups / Sessions" />
          <CardContent className="space-y-2">
            <Link to="/admin/users"><Button className="w-full" variant="ghost">Gérer utilisateurs</Button></Link>
            <Link to="/admin/groups"><Button className="w-full" variant="ghost">Gérer groupes</Button></Link>
            <Link to="/admin/sessions"><Button className="w-full" variant="ghost">Gérer séances</Button></Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
        <div className="font-medium text-zinc-200">Checklist</div>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Créer groupe + étudiants, puis ajouter étudiants au groupe.</li>
          <li>Créer une séance (session) pour ce groupe.</li>
          <li>Enregistrer le visage de chaque étudiant (upload photo).</li>
          <li>Dans “Caméra”, entrer le <code>session_id</code> et démarrer.</li>
        </ul>
      </div>
    </Container>
  );
}
