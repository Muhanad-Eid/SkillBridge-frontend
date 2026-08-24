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
  const isAuthPage = [
    "/login",
    "/portal/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].includes(location.pathname);

  return (
    <div
      className={`app-shell public-shell ${isAuthPage ? "public-shell-auth" : ""}`}
    >
      {!isAuthPage ? (
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
      ) : null}

      <main className="public-main">
        <Outlet />
      </main>

      {!isAuthPage ? (
        isLandingPage ? (
          <footer className="site-footer site-footer-landing">
            <div className="landing-footer-content">
              <div className="landing-footer-intro">
                <Link className="site-footer-brand" to="/">
                  <BrandIcon />
                  <span>
                    <strong>SkillBridge</strong>
                    <small>Internships, training, and projects</small>
                  </span>
                </Link>
                <p>
                  A controlled path from practical work to traceable,
                  evidence-backed achievement.
                </p>
              </div>

              <nav className="landing-footer-group" aria-label="Quick links">
                <h2>Quick links</h2>
                <Link to="/">About SkillBridge</Link>
                <Link to="/opportunities">Opportunities</Link>
                <Link to="/freelance">Freelance</Link>
              </nav>

              <nav className="landing-footer-group" aria-label="Account links">
                <h2>Get started</h2>
                <Link to="/register">Create an account</Link>
                <Link to="/portal/login">Sign in</Link>
                <Link to="/register">For providers</Link>
              </nav>

              <div className="landing-footer-group landing-footer-contact">
                <h2>Contact us</h2>
                <a href="mailto:contact@skillbridge.com">contact@skillbridge.com</a>
                <span>For students, providers, and universities</span>
                <Link to="/contact">Contact page</Link>
              </div>
            </div>

            <div className="landing-footer-bottom">
              <small>© 2026 SkillBridge. All rights reserved.</small>
              <nav aria-label="Legal links">
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
              </nav>
            </div>
          </footer>
        ) : (
          <footer className="site-footer">
            <div className="site-footer-brand">
              <BrandIcon />
              <span>
                <strong>SkillBridge</strong>
                <small>Internships, training, and projects</small>
              </span>
            </div>
            <small className="site-footer-copyright">© 2026 SkillBridge</small>
          </footer>
        )
      ) : null}
    </div>
  );
}
