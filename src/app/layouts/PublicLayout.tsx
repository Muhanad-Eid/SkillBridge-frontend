import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { getRoleHomePath, useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import ThemeToggle from "../../shared/components/ThemeToggle";

export default function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
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

        <button
          className="public-mobile-menu"
          type="button"
          aria-label={isMobileNavigationOpen ? "Close main navigation" : "Open main navigation"}
          aria-expanded={isMobileNavigationOpen}
          aria-controls="public-main-navigation"
          onClick={() => setIsMobileNavigationOpen((value) => !value)}
        >
          {isMobileNavigationOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>

        <nav id="public-main-navigation" className={`site-nav ${isMobileNavigationOpen ? "site-nav-mobile-open" : ""}`} aria-label="Main navigation">
          <NavLink className="site-nav-home" to="/" onClick={() => setIsMobileNavigationOpen(false)}>
            About
          </NavLink>
          <NavLink className="site-nav-opportunities" to="/opportunities" onClick={() => setIsMobileNavigationOpen(false)}>
            Opportunities
          </NavLink>
          <NavLink className="site-nav-freelance" to="/freelance" onClick={() => setIsMobileNavigationOpen(false)}>
            Freelance
          </NavLink>
          {!user ? (
            <>
              <NavLink to="/portal/login" onClick={() => setIsMobileNavigationOpen(false)}>Log in</NavLink>
              <NavLink className="site-register-link" to="/register" onClick={() => setIsMobileNavigationOpen(false)}>
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
            <div className="landing-footer-inner">
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

              <nav className="landing-footer-column" aria-label="Quick links">
                <h2>Quick links</h2>
                <Link to="/#how-it-works">How SkillBridge works</Link>
                <Link to="/opportunities">Opportunities</Link>
                <Link to="/freelance">Freelance</Link>
              </nav>

              <nav className="landing-footer-column" aria-label="Get started">
                <h2>Get started</h2>
                <Link to="/register">Create an account</Link>
                <Link to="/portal/login">Sign in</Link>
                <Link to="/register">For providers</Link>
              </nav>

              <nav className="landing-footer-column" aria-label="Contact and policies">
                <h2>Contact us</h2>
                <a href="mailto:contact@skillbridge.com">contact@skillbridge.com</a>
                <Link to="/contact">Support for every role</Link>
                <Link to="/contact">Contact page</Link>
              </nav>
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
