import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  UserRound,
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
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import BrandIcon from "../../shared/components/BrandIcon";
import useSidebarPreference from "../../shared/hooks/useSidebarPreference";
import {
  isCompanyProfileComplete,
  type CompanyProfile,
} from "../../features/profiles/domain/profileTypes";
import { getMyCompanyProfileAsync } from "../../features/profiles/infrastructure/profileApi";
import { getMyMessagesAsync } from "../../features/messages/infrastructure/messageApi";
import { getMyNotificationsAsync } from "../../features/notifications/infrastructure/notificationApi";

type CompanyNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "messages" | "notifications";
};

const companyNavItems: CompanyNavItem[] = [
  { label: "Overview", to: "/company/dashboard", icon: LayoutDashboard },
  { label: "Opportunities", to: "/company/projects", icon: BriefcaseBusiness },
  { label: "Applications", to: "/company/applications", icon: ClipboardList },
  {
    label: "Messages",
    to: "/company/messages",
    icon: MessageSquare,
    badge: "messages",
  },
  {
    label: "Notifications",
    to: "/company/notifications",
    icon: Bell,
    badge: "notifications",
  },
  { label: "Company profile", to: "/company/profile", icon: Building2 },
  { label: "Change password", to: "/company/security", icon: KeyRound },
];

export default function CompanyPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useSidebarPreference("company");

  const refreshProfileCompletion = useCallback(async () => {
    setIsCheckingProfile(true);
    setProfileError("");

    try {
      setProfile(await getMyCompanyProfileAsync());
    } catch (caughtError) {
      setProfile(null);
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to check your company profile.",
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

  const profileIsComplete = isCompanyProfileComplete(profile);
  const isCompanyVerified = Boolean(profile?.isVerified);
  const isProfileRoute = location.pathname === "/company/profile";
  const isSecurityRoute = location.pathname === "/company/security";
  const isAccountSetupRoute = isProfileRoute || isSecurityRoute;
  const navItems = profileIsComplete
    ? companyNavItems
    : companyNavItems.filter(
        (item) => item.to === "/company/profile" || item.to === "/company/security",
      );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!isCheckingProfile && !profileIsComplete && !isAccountSetupRoute) {
    return (
      <Navigate
        to="/company/profile?required=1"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <div
      className={`company-portal company-portal-v2 ${
        isSidebarCollapsed ? "is-sidebar-collapsed" : ""
      }`}
    >
      <aside
        className={`company-sidebar ${isSidebarOpen ? "is-mobile-open" : ""}`}
        id="company-sidebar"
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
          className="company-brand"
          to={profileIsComplete ? "/company/dashboard" : "/company/profile"}
          onClick={() => setIsSidebarOpen(false)}
        >
          <BrandIcon />
          <span>
            <strong>SkillBridge</strong>
            <small>Company workspace</small>
          </span>
        </Link>

        <div className="company-account-summary">
          <span className="company-account-icon" aria-hidden="true">
            <Building2 size={19} />
          </span>
          <div>
            <strong>{profile?.companyName || user?.fullName || "Company"}</strong>
            <small>
              {isCompanyVerified ? "Verified company" : "Verification pending"}
            </small>
          </div>
          {isCompanyVerified ? <ShieldCheck size={18} aria-label="Verified" /> : null}
        </div>

        <nav className="company-sidebar-nav" aria-label="Company navigation">
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
                  <strong className="company-nav-badge">{badgeCount}</strong>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="company-sidebar-footer">
          <div>
            <UserRound size={17} aria-hidden="true" />
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
            className="company-logout-button"
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

      <div className="company-workspace">
        {!isCheckingProfile &&
        profileIsComplete &&
        !isCompanyVerified &&
        !isAccountSetupRoute ? (
          <div className="company-verification-banner" role="status">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <strong>Admin verification is required to publish.</strong>
              <span>
                You can review your workspace while your company profile is pending.
              </span>
            </div>
            <Button to="/company/profile" variant="secondary">
              Review profile
            </Button>
          </div>
        ) : null}

        <main className="company-content">
          {isSidebarCollapsed ? (
            <button
              className="portal-desktop-sidebar-open"
              type="button"
              aria-label="Open navigation"
              title="Open navigation"
              aria-controls="company-sidebar"
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          ) : null}
          <button
            className="portal-mobile-menu-button portal-content-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-controls="company-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          {isCheckingProfile ? (
            <div className="notice">Checking company profile...</div>
          ) : profileError && !isAccountSetupRoute ? (
            <div className="notice notice-error">{profileError}</div>
          ) : (
            <Outlet
              context={{
                profile,
                profileIsComplete,
                isCompanyVerified,
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
