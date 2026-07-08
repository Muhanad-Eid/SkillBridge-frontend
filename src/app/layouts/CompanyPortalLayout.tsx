import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";

const companyNavItems = [
  { label: "Overview", to: "/company/dashboard" },
  { label: "Opportunities", to: "/company/projects" },
  { label: "Applications", to: "/company/applications" },
  { label: "Reviews", to: "/company/reviews" },
  { label: "Messages", to: "/company/messages" },
  { label: "Notifications", to: "/company/notifications" },
  { label: "Profile", to: "/company/profile" },
];

export default function CompanyPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="company-portal">
      <header className="company-topbar">
        <Link className="portal-brand" to="/company/dashboard">
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Company portal</small>
          </span>
        </Link>

        <nav className="company-tabs" aria-label="Company navigation">
          {companyNavItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="company-user">
          <span>{user?.fullName}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <section className="company-hero-strip">
        <div>
          <span>Hiring and training workspace</span>
          <strong>Post work. Review applicants. Build talent.</strong>
        </div>
        <Button to="/company/projects" variant="primary">
          Manage opportunities
        </Button>
      </section>

      <main className="company-content">
        <section className="portal-identity company-identity">
          <span>Company Portal</span>
          <strong>Opportunities, applicants, and company operations</strong>
        </section>
        <Outlet />
      </main>
    </div>
  );
}
