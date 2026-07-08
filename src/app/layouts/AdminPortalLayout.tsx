import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";

const adminNavItems = [
  { label: "Control center", to: "/admin/dashboard" },
  { label: "Users", to: "/admin/users" },
  { label: "Companies", to: "/admin/companies" },
  { label: "Job seekers", to: "/admin/job-seekers" },
  { label: "Projects", to: "/admin/projects" },
  { label: "Applications", to: "/admin/applications" },
  { label: "Reviews", to: "/admin/reviews" },
  { label: "Skills", to: "/admin/skills" },
];

export default function AdminPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-portal">
      <aside className="admin-rail">
        <Link className="portal-brand admin-brand" to="/admin/dashboard">
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Admin portal</small>
          </span>
        </Link>

        <div className="admin-rail-card">
          <span>Platform control</span>
          <strong>Trust and access</strong>
          <p>Review accounts, verify companies, and keep SkillBridge organized.</p>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {adminNavItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-stage">
        <header className="admin-topbar">
          <div>
            <span>Signed in as admin</span>
            <strong>{user?.fullName}</strong>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </header>

        <main className="admin-content">
          <section className="portal-identity admin-identity">
            <span>Admin Portal</span>
            <strong>Platform governance and verification</strong>
          </section>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
