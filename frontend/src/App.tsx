import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Topbar from "./components/Topbar";
import { logout } from "./services/auth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RealtimeAttendancePage from "./pages/RealtimeAttendancePage";
import ExportPage from "./pages/ExportPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminGroupsPage from "./pages/admin/AdminGroupsPage";
import AdminSessionsPage from "./pages/admin/AdminSessionsPage";

function isAuthed() {
  return Boolean(localStorage.getItem("token"));
}

export default function App() {
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen">
      <Topbar onLogout={handleLogout} isAuthed={isAuthed()} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/attendance/realtime" element={<RealtimeAttendancePage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/groups" element={<AdminGroupsPage />} />
        <Route path="/admin/sessions" element={<AdminSessionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
