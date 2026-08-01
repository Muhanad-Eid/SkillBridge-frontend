import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Star,
  UserRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  isJobSeekerProfileComplete,
  type JobSeekerProfile,
} from "../../features/profiles/domain/profileTypes";
import { getMyJobSeekerProfileAsync } from "../../features/profiles/infrastructure/profileApi";
import { getUnreadMessageCountAsync } from "../../features/messages/infrastructure/messageApi";
import { getUnreadNotificationCountAsync } from "../../features/notifications/infrastructure/notificationApi";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import ThemeToggle from "../../shared/components/ThemeToggle";
import useSidebarPreference from "../../shared/hooks/useSidebarPreference";
import useVisibilityPolling from "../../shared/hooks/useVisibilityPolling";

type JobSeekerNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "messages" | "notifications";
};

const jobSeekerNavItems: JobSeekerNavItem[] = [
  { label: "Overview", to: "/job-seeker/dashboard", icon: LayoutDashboard },
  { label: "Discover", to: "/job-seeker/opportunities", icon: Search },
  { label: "Freelance", to: "/job-seeker/freelance", icon: CircleDollarSign },
  { label: "Applications", to: "/job-seeker/applications", icon: FileCheck2 },
  { label: "Work", to: "/job-seeker/work", icon: ListChecks },
  { label: "Skills", to: "/job-seeker/skills", icon: Wrench },
  { label: "Portfolio", to: "/job-seeker/portfolio", icon: FolderKanban },
  { label: "Reviews", to: "/job-seeker/reviews", icon: Star },
  {
    label: "Messages",
    to: "/job-seeker/messages",
    icon: MessageSquare,
    badge: "messages",
  },
  {
    label: "Notifications",
    to: "/job-seeker/notifications",
    icon: Bell,
    badge: "notifications",
  },
  { label: "Profile", to: "/job-seeker/profile", icon: UserRound },
  { label: "Change password", to: "/job-seeker/security", icon: KeyRound },
];

export default function JobSeekerPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useSidebarPreference("job-seeker");

  const refreshProfileCompletion = useCallback(async () => {
    setIsCheckingProfile(true);
    setProfileError("");

    try {
      setProfile(await getMyJobSeekerProfileAsync());
    } catch (caughtError) {
      setProfile(null);
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to check your job seeker profile.",
      );
    } finally {
      setIsCheckingProfile(false);
    }
  }, []);

  const refreshBadges = useCallback(async () => {
    const [messageResult, notificationResult] = await Promise.allSettled([
      getUnreadMessageCountAsync(user?.userId),
      getUnreadNotificationCountAsync(),
    ]);

    if (messageResult.status === "fulfilled") {
      setUnreadMessages(messageResult.value);
    }

    if (notificationResult.status === "fulfilled") {
      setUnreadNotifications(notificationResult.value);
    }
  }, [user?.userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(refreshProfileCompletion, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshProfileCompletion]);

  useVisibilityPolling(refreshBadges, 30000, { runImmediately: true });

  useEffect(() => {
    if (!isSidebarOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSidebarOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const profileIsComplete = isJobSeekerProfileComplete(profile);
  const isProfileRoute = location.pathname === "/job-seeker/profile";
  const isSecurityRoute = location.pathname === "/job-seeker/security";
  const isAccountSetupRoute = isProfileRoute || isSecurityRoute;
  const navItems = profileIsComplete
    ? jobSeekerNavItems
    : jobSeekerNavItems.filter(
        (item) =>
          item.to === "/job-seeker/profile" || item.to === "/job-seeker/security",
      );

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
    navigate("/login", { replace: true });
  }

  if (!isCheckingProfile && !profileIsComplete && !isAccountSetupRoute) {
    return (
      <Navigate
        to="/job-seeker/profile?required=1"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <div
      className={`jobseeker-portal jobseeker-portal-v2 ${
        isSidebarCollapsed ? "is-sidebar-collapsed" : ""
      }`}
    >
      <aside
        className={`jobseeker-sidebar ${isSidebarOpen ? "is-mobile-open" : ""}`}
        id="jobseeker-sidebar"
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
        <Link
          className="jobseeker-brand"
          to={profileIsComplete ? "/job-seeker/dashboard" : "/job-seeker/profile"}
          onClick={() => setIsSidebarOpen(false)}
        >
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Job seeker portal</small>
          </span>
        </Link>

        <nav className="jobseeker-sidebar-nav" aria-label="Job seeker navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.badge === "messages"
                ? unreadMessages
                : item.badge === "notifications"
                  ? unreadNotifications
                  : 0;

            return (
              <NavLink key={item.to} to={item.to} onClick={() => setIsSidebarOpen(false)}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                {badgeCount > 0 ? (
                  <strong className="jobseeker-nav-badge">{badgeCount}</strong>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="jobseeker-sidebar-footer">
          <div>
            <BriefcaseBusiness size={17} aria-hidden="true" />
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
            className="jobseeker-logout-button"
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

      <div className="jobseeker-workspace">
        <main className="jobseeker-content">
          {isSidebarCollapsed ? (
            <button
              className="portal-desktop-sidebar-open"
              type="button"
              aria-label="Open navigation"
              title="Open navigation"
              aria-controls="jobseeker-sidebar"
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          ) : null}
          <button
            className="portal-mobile-menu-button portal-content-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-controls="jobseeker-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          {isCheckingProfile ? (
            <div className="notice">Checking job seeker profile...</div>
          ) : profileError && !isAccountSetupRoute ? (
            <div className="notice notice-error">{profileError}</div>
          ) : (
            <Outlet
              context={{
                profile,
                profileIsComplete,
                refreshProfileCompletion,
                refreshBadges,
              }}
            />
          )}
        </main>
      </div>
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Log out?"
        description="You will need to sign in again to access your portal."
        confirmLabel="Log out"
        onCancel={closeLogoutDialog}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
