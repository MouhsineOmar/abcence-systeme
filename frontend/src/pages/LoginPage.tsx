import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { Card, CardContent, CardHeader } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";
import { login } from "../services/auth";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      nav("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-zinc-400">
            Connecte-toi (prof/admin) pour gérer la présence en temps réel et exporter les rapports Excel.
          </p>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-300">
            <div className="font-medium text-zinc-200">API</div>
            <div className="mt-1">
              Base URL: <span className="text-zinc-100">{import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1"}</span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Astuce: crée un fichier <code>.env</code> et mets <code>VITE_API_URL</code>.
            </div>
          </div>
        </div>

        <Card>
          <CardHeader title="Compte" subtitle="JWT via /auth/login (x-www-form-urlencoded)" />
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              {error ? <Toast type="error" message={error} /> : null}
              <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prof@example.com" />
              <Input label="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
