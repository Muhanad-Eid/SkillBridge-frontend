import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";

const navigationByRole = {
  Company: [
    { label: "Dashboard", to: "/company/dashboard" },
    { label: "Opportunities", to: "/company/projects" },
    { label: "Applications", to: "/company/applications" },
    { label: "Reviews", to: "/company/reviews" },
    { label: "Messages", to: "/company/messages" },
    { label: "Notifications", to: "/company/notifications" },
    { label: "Profile", to: "/company/profile" },
  ],
  JobSeeker: [
    { label: "Dashboard", to: "/job-seeker/dashboard" },
    { label: "Browse", to: "/opportunities" },
    { label: "Applications", to: "/job-seeker/applications" },
    { label: "Skills", to: "/job-seeker/skills" },
    { label: "Portfolio", to: "/job-seeker/portfolio" },
    { label: "Messages", to: "/job-seeker/messages" },
    { label: "Notifications", to: "/job-seeker/notifications" },
    { label: "Profile", to: "/job-seeker/profile" },
  ],
  Admin: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Users", to: "/admin/users" },
    { label: "Companies", to: "/admin/companies" },
    { label: "Messages", to: "/admin/messages" },
    { label: "Notifications", to: "/admin/notifications" },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems =
    user?.role === "Company" ||
    user?.role === "JobSeeker" ||
    user?.role === "Admin"
      ? navigationByRole[user.role]
      : [];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell dashboard-shell">
      <header className="site-header dashboard-topbar">
        <Link className="brand" to={getRoleHomePath(user?.role)}>
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

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
