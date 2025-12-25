import { Link, useLocation } from "react-router-dom";
import Button from "./Button";
import Lottie from "lottie-react";
import logoAnim from "../assets/lottie/face.json"; // adapte le chemin


function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={[
        "rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-900 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function Topbar({ onLogout, isAuthed }: { onLogout: () => void; isAuthed: boolean }) {
  return (
    <div className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link to="/" className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center border border-white/10 overflow-hidden">
                        <Lottie
                                animationData={logoAnim}
                                loop
                                autoplay
                                style={{ width: 30, height: 30 }}
                         />
        </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Auto-Absence</div>
            <div className="text-xs text-zinc-500">Présence temps réel</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" label="Dashboard" />
          <NavLink to="/attendance/realtime" label="Caméra" />
          <NavLink to="/export" label="Export Excel" />
          <NavLink to="/admin/users" label="Admin Users" />
          <NavLink to="/admin/groups" label="Admin Groups" />
          <NavLink to="/admin/sessions" label="Admin Sessions" />
        </div>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Button variant="secondary" onClick={onLogout}>Déconnexion</Button>
          ) : (
            <Link to="/login"><Button variant="primary">Connexion</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
