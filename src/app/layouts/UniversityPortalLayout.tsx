import { useCallback, useState } from "react";
import {
  Bell,
  GraduationCap,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import ThemeToggle from "../../shared/components/ThemeToggle";
import useSidebarPreference from "../../shared/hooks/useSidebarPreference";

const navItems = [
  {
    label: "Supervised training",
    to: "/university/training",
    icon: GraduationCap,
  },
  {
    label: "Messages",
    to: "/university/messages",
    icon: MessageSquare,
  },
  {
    label: "Notifications",
    to: "/university/notifications",
    icon: Bell,
  },
  {
    label: "Change password",
    to: "/university/security",
    icon: KeyRound,
  },
];

export default function UniversityPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useSidebarPreference("university");
  const closeLogout = useCallback(() => setIsLogoutOpen(false), []);

  function confirmLogout() {
    closeLogout();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={`company-portal company-portal-v2 university-portal ${
        isSidebarCollapsed ? "is-sidebar-collapsed" : ""
      }`}
    >
      <aside
        className={`company-sidebar ${isSidebarOpen ? "is-mobile-open" : ""}`}
        id="university-sidebar"
      >
        <button
          className="portal-desktop-sidebar-close"
          type="button"
          aria-label="Collapse navigation"
          onClick={() => setIsSidebarCollapsed(true)}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <button
          className="portal-sidebar-close"
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={20} aria-hidden="true" />
        </button>
        <Link className="company-brand" to="/university/training">
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>University portal</small>
          </span>
        </Link>
        <div className="company-account-summary">
          <span className="company-account-icon" aria-hidden="true">
            <GraduationCap size={19} />
          </span>
          <div>
            <strong>{user?.fullName}</strong>
            <small>University supervisor</small>
          </div>
        </div>
        <nav className="company-sidebar-nav" aria-label="University navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="company-sidebar-footer">
          <ThemeToggle className="portal-theme-toggle" />
          <Button
            type="button"
            variant="ghost"
            aria-label="Log out"
            onClick={() => setIsLogoutOpen(true)}
          >
            <LogOut size={18} aria-hidden="true" />
          </Button>
        </div>
      </aside>

      {isSidebarOpen ? (
        <button
          className="portal-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <div className="company-workspace">
        <main className="company-content">
          {isSidebarCollapsed ? (
            <button
              className="portal-desktop-sidebar-open"
              type="button"
              aria-label="Open navigation"
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          ) : null}
          <button
            className="portal-mobile-menu-button portal-content-menu-button"
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutOpen}
        title="Log out?"
        description="You will need to sign in again to access supervised training."
        confirmLabel="Log out"
        onCancel={closeLogout}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
