import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  FileCheck2,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Sparkles,
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
import { getMyMessagesAsync } from "../../features/messages/infrastructure/messageApi";
import { getMyNotificationsAsync } from "../../features/notifications/infrastructure/notificationApi";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import useSidebarPreference from "../../shared/hooks/useSidebarPreference";

type JobSeekerNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "messages" | "notifications";
};

const jobSeekerNavItems: JobSeekerNavItem[] = [
  { label: "Overview", to: "/job-seeker/dashboard", icon: LayoutDashboard },
  { label: "Discover", to: "/job-seeker/opportunities", icon: Search },
  { label: "Applications", to: "/job-seeker/applications", icon: FileCheck2 },
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
      getMyMessagesAsync(),
      getMyNotificationsAsync(),
    ]);

    if (messageResult.status === "fulfilled") {
      setUnreadMessages(
        messageResult.value.filter(
          (message) => !message.isRead && message.receiverId === user?.userId,
        ).length,
      );
    }

    if (notificationResult.status === "fulfilled") {
      setUnreadNotifications(
        notificationResult.value.filter((notification) => !notification.isRead)
          .length,
      );
    }
  }, [user?.userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(refreshProfileCompletion, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshProfileCompletion]);

  useEffect(() => {
    const timeoutId = window.setTimeout(refreshBadges, 0);
    const intervalId = window.setInterval(refreshBadges, 5000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [refreshBadges]);

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

  const profileInitial = (profile?.fullName || user?.fullName || "J")
    .trim()
    .charAt(0)
    .toUpperCase();

  function handleLogout() {
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
            <small>Career workspace</small>
          </span>
        </Link>

        <div className="jobseeker-account-summary">
          <span className="jobseeker-avatar" aria-hidden="true">
            {profileInitial}
          </span>
          <div>
            <strong>{profile?.fullName || user?.fullName || "Job seeker"}</strong>
            <small>{profile?.city || "Complete your profile"}</small>
          </div>
          {profileIsComplete ? <Sparkles size={17} aria-label="Profile ready" /> : null}
        </div>

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
    </div>
  );
}
