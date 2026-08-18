import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { getRoleHomePath, useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import ThemeToggle from "../../shared/components/ThemeToggle";

export default function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="app-shell public-shell">
      <header
        className={`site-header ${isLandingPage ? "site-header-landing" : ""}`}
      >
        <Link className="brand" to="/">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Internships, training, projects</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink className="site-nav-home" to="/">
            About
          </NavLink>
          <NavLink className="site-nav-opportunities" to="/opportunities">
            Opportunities
          </NavLink>
          <NavLink className="site-nav-freelance" to="/freelance">
            Freelance
          </NavLink>
          {!user ? (
            <>
              <NavLink to="/portal/login">Log in</NavLink>
              <NavLink className="site-register-link" to="/register">
                Register
              </NavLink>
            </>
          ) : null}
        </nav>

        <ThemeToggle className="public-theme-toggle" />

        {user ? (
          <Button to={getRoleHomePath(user.role)} variant="primary">
            <LayoutDashboard size={18} aria-hidden="true" />
            <span>Open portal</span>
          </Button>
        ) : null}
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer
        className={`site-footer ${isLandingPage ? "site-footer-landing" : ""}`}
      >
        <div className="site-footer-brand">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Internships, training, and projects</small>
          </span>
        </div>
        <small>@2026 SkillBridge</small>
      </footer>
    </div>
  );
}
