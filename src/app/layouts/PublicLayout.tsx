import { Link, NavLink, Outlet } from "react-router-dom";
import { getRoleHomePath, useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="app-shell public-shell">
      <header className="site-header">
        <Link className="brand" to="/login">
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Internships, training, projects</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/login">Log in</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>

        {user ? (
          <Button to={getRoleHomePath(user.role)} variant="primary">
            Dashboard
          </Button>
        ) : (
          <Button to="/register" variant="primary">
            Join now
          </Button>
        )}
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <strong>SkillBridge</strong>
        <nav aria-label="Footer navigation">
          <a href="/login">Login</a>
          <a href="/register">Register</a>
          <a href="/register">Companies</a>
        </nav>
      </footer>
    </div>
  );
}
