import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Star,
  Tags,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { getAdminQueueSummaryAsync } from "../../features/admin/infrastructure/adminApi";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import ThemeToggle from "../../shared/components/ThemeToggle";
import useSidebarPreference from "../../shared/hooks/useSidebarPreference";
import useVisibilityPolling from "../../shared/hooks/useVisibilityPolling";

type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "companies" | "applications" | "reviews";
};

const adminNavItems: AdminNavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: UserCog },
  { label: "Companies", to: "/admin/companies", icon: Building2, badge: "companies" },
  { label: "Job seekers", to: "/admin/job-seekers", icon: GraduationCap },
  { label: "Projects", to: "/admin/projects", icon: BriefcaseBusiness },
  { label: "Applications", to: "/admin/applications", icon: FileCheck2, badge: "applications" },
  { label: "Reviews", to: "/admin/reviews", icon: Star, badge: "reviews" },
  { label: "Skills", to: "/admin/skills", icon: Tags },
  { label: "Change password", to: "/admin/security", icon: KeyRound },
];

export default function AdminPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCompanies, setPendingCompanies] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [flaggedReviews, setFlaggedReviews] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useSidebarPreference("admin");

  const refreshQueues = useCallback(async () => {
    try {
      const summary = await getAdminQueueSummaryAsync();
      setPendingCompanies(summary.pendingCompanies);
      setPendingApplications(summary.pendingApplications);
      setFlaggedReviews(summary.flaggedReviews);
    } catch {
      // Management pages display their own loading errors.
    }
  }, []);

  useVisibilityPolling(refreshQueues, 30000, { runImmediately: true });

  useEffect(() => {
    if (!isSidebarOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSidebarOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);
  const closeLogoutDialog = useCallback(
    () => setIsLogoutDialogOpen(false),
    [],
  );

  function handleLogout() {
    setIsLogoutDialogOpen(true);
  }

  function confirmLogout() {
    closeLogoutDialog();
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div
      className={`admin-portal admin-portal-v2 ${
        isSidebarCollapsed ? "is-sidebar-collapsed" : ""
      }`}
    >
      <aside
        className={`admin-sidebar-v2 ${isSidebarOpen ? "is-mobile-open" : ""}`}
        id="admin-sidebar"
      >
        <button
          className="portal-desktop-sidebar-close"
          type="button"
          aria-label="Collapse navigation"
          title="Collapse navigation"
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
        <Link className="admin-brand-v2" to="/admin/dashboard" onClick={() => setIsSidebarOpen(false)}>
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Administration</small>
          </span>
        </Link>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.badge === "companies"
                ? pendingCompanies
                : item.badge === "applications"
                  ? pendingApplications
                  : item.badge === "reviews"
                    ? flaggedReviews
                    : 0;

            return (
              <NavLink key={item.to} to={item.to} onClick={() => setIsSidebarOpen(false)}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                {badgeCount > 0 ? <strong className="admin-nav-badge">{badgeCount}</strong> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div>
            <UserCog size={17} aria-hidden="true" />
            <span>
              <strong>{user?.fullName}</strong>
              <small>{user?.email}</small>
            </span>
          </div>
          <ThemeToggle className="portal-theme-toggle" />
          <Button
            aria-label="Log out"
            title="Log out"
            type="button"
            variant="ghost"
            className="admin-logout-button"
            onClick={handleLogout}
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

      <div className="admin-workspace-v2">
        <main className="admin-content admin-content-v2">
          {isSidebarCollapsed ? (
            <button
              className="portal-desktop-sidebar-open"
              type="button"
              aria-label="Open navigation"
              title="Open navigation"
              aria-controls="admin-sidebar"
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          ) : null}
          <button
            className="portal-mobile-menu-button portal-content-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-controls="admin-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <Outlet context={{ refreshQueues }} />
        </main>
      </div>
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Log out?"
        description="You will need to sign in again to access the admin portal."
        confirmLabel="Log out"
        onCancel={closeLogoutDialog}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
