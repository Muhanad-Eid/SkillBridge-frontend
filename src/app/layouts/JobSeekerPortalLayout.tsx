import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";

const jobSeekerNavItems = [
  { label: "Home", to: "/job-seeker/dashboard" },
  { label: "Browse opportunities", to: "/job-seeker/opportunities" },
  { label: "My applications", to: "/job-seeker/applications" },
  { label: "Skills", to: "/job-seeker/skills" },
  { label: "Portfolio", to: "/job-seeker/portfolio" },
  { label: "Messages", to: "/job-seeker/messages" },
  { label: "Notifications", to: "/job-seeker/notifications" },
  { label: "Profile", to: "/job-seeker/profile" },
];

export default function JobSeekerPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="jobseeker-portal">
      <header className="jobseeker-topbar">
        <Link className="portal-brand" to="/job-seeker/dashboard">
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Job seeker portal</small>
          </span>
        </Link>

        <div className="jobseeker-actions">
          <Button to="/job-seeker/opportunities" variant="primary">
            Browse
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="jobseeker-layout">
        <aside className="jobseeker-panel">
          <div className="career-card">
            <span>Career profile</span>
            <strong>{user?.fullName}</strong>
            <p>Apply to opportunities and build portfolio proof from real work.</p>
          </div>

          <nav className="jobseeker-nav" aria-label="Job seeker navigation">
            {jobSeekerNavItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="jobseeker-content">
          <section className="portal-identity jobseeker-identity">
            <span>Job Seeker Portal</span>
            <strong>Applications, skills, and portfolio proof</strong>
          </section>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
