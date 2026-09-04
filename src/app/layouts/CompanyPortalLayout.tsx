import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  ShieldCheck,
  Workflow,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import {
  isCompanyProfileComplete,
  type CompanyProfile,
} from "../../features/profiles/domain/profileTypes";
import { getMyCompanyProfileAsync } from "../../features/profiles/infrastructure/profileApi";
import { getUnreadMessageCountAsync } from "../../features/messages/infrastructure/messageApi";
import { getUnreadNotificationCountAsync } from "../../features/notifications/infrastructure/notificationApi";
import useVisibilityPolling from "../../shared/hooks/useVisibilityPolling";
import { subscribeToPortalBadgeChanges } from "../../shared/events/portalEvents";
import PortalShell from "../../shared/layout/PortalShell";

type CompanyNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "messages" | "notifications";
};

const companyNavItems: CompanyNavItem[] = [
  { label: "Overview", to: "/company/dashboard", icon: LayoutDashboard },
  { label: "Opportunities", to: "/company/projects", icon: BriefcaseBusiness },
  { label: "Freelance", to: "/company/freelance", icon: CircleDollarSign },
  { label: "Applications", to: "/company/applications", icon: ClipboardList },
  { label: "Work", to: "/company/work", icon: ListChecks },
  { label: "Evidence checks", to: "/company/proof-engine", icon: Workflow },
  { label: "Evidence requests", to: "/company/evidence-requests", icon: ClipboardList },
  { label: "Find talent", to: "/company/talent", icon: UserRoundSearch },
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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

  useEffect(
    () => subscribeToPortalBadgeChanges(() => void refreshBadges()),
    [refreshBadges],
  );

  const profileIsComplete = isCompanyProfileComplete(profile);
  const isCompanyVerified = Boolean(profile?.isVerified);
  const isTrainingProvider = profile?.providerType === 1;
  const providerLabel = isTrainingProvider ? "Training provider" : "Company";
  const providerLabelLower = providerLabel.toLowerCase();
  const isProfileRoute = location.pathname === "/company/profile";
  const isSecurityRoute = location.pathname === "/company/security";
  const isAccountSetupRoute = isProfileRoute || isSecurityRoute;
  const availableNavItems = companyNavItems.map((item) =>
    item.to === "/company/profile"
      ? { ...item, label: `${providerLabel} profile` }
      : item,
  );
  const navItems = profileIsComplete
    ? availableNavItems
    : availableNavItems.filter(
        (item) => item.to === "/company/profile" || item.to === "/company/security",
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
        to="/company/profile?required=1"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <PortalShell
      role="company"
      portalLabel={`${providerLabel} portal`}
      homePath={profileIsComplete ? "/company/dashboard" : "/company/profile"}
      userName={profile?.companyName || user?.fullName}
      userEmail={user?.email}
      profilePath="/company/profile"
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
      banner={
        !isCheckingProfile &&
        profileIsComplete &&
        !isCompanyVerified &&
        !isAccountSetupRoute ? (
          <div className="company-verification-banner" role="status">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <strong>Admin verification is required to publish.</strong>
              <span>
                You can view your account while your {providerLabelLower} profile
                is pending.
              </span>
            </div>
            <Button to="/company/profile" variant="secondary">
              Review profile
            </Button>
          </div>
        ) : null
      }
    >
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
            isTrainingProvider,
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
        variant="logout"
        onCancel={closeLogoutDialog}
        onConfirm={confirmLogout}
      />
    </PortalShell>
  );
}
