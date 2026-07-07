import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell dashboard-shell">
      <header className="site-header">
        <Link className="brand" to="/login">
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>{user?.role ?? "Workspace"}</small>
          </span>
        </Link>

        <div className="dashboard-user">
          <span>{user?.fullName}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
