import { Link, NavLink, Outlet } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="app-shell public-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Internships, training, projects</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/">About</NavLink>
          <NavLink to="/portal/login">Log in</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>

        {user ? (
          <Button to={getRoleHomePath(user.role)} variant="primary">
            Dashboard
          </Button>
        ) : null}
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-brand">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Real opportunities, cleaner applicant proof.</small>
          </span>
        </div>
        <small>2026 SkillBridge</small>
      </footer>
    </div>
  );
}
