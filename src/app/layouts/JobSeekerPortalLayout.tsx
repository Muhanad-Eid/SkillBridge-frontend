import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Search,
  Star,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  Navigate,
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
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import useVisibilityPolling from "../../shared/hooks/useVisibilityPolling";
import PortalShell from "../../shared/layout/PortalShell";

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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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
    <PortalShell
      role="job-seeker"
      portalLabel="Job seeker portal"
      homePath={profileIsComplete ? "/job-seeker/dashboard" : "/job-seeker/profile"}
      userName={user?.fullName}
      userEmail={user?.email}
      profilePath="/job-seeker/profile"
      onLogout={handleLogout}
      navItems={navItems.map((item) => ({
        label: item.label,
        to: item.to,
        icon: item.icon,
        badgeCount:
          item.badge === "messages"
            ? unreadMessages
            : item.badge === "notifications"
              ? unreadNotifications
              : undefined,
      }))}
    >
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
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Log out?"
        description="You will need to sign in again to access your portal."
        confirmLabel="Log out"
        onCancel={closeLogoutDialog}
        onConfirm={confirmLogout}
      />
    </PortalShell>
  );
}
