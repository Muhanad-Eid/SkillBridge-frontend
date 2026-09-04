import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
  MessageSquare,
  Workflow,
} from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { getUnreadMessageCountAsync } from "../../features/messages/infrastructure/messageApi";
import { getUnreadNotificationCountAsync } from "../../features/notifications/infrastructure/notificationApi";
import { useAuth } from "../../shared/auth/AuthContext";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import { subscribeToPortalBadgeChanges } from "../../shared/events/portalEvents";
import useVisibilityPolling from "../../shared/hooks/useVisibilityPolling";
import PortalShell from "../../shared/layout/PortalShell";

type UniversityNavItem = {
  label: string;
  to: string;
  icon: typeof GraduationCap;
  badge?: "messages" | "notifications";
};

const universityNavItems: UniversityNavItem[] = [
  {
    label: "Supervised training",
    to: "/university/training",
    icon: GraduationCap,
  },
  {
    label: "Evidence checks",
    to: "/university/proof-engine",
    icon: Workflow,
  },
  {
    label: "Evidence requests",
    to: "/university/evidence-requests",
    icon: ClipboardCheck,
  },
  {
    label: "Messages",
    to: "/university/messages",
    icon: MessageSquare,
    badge: "messages",
  },
  {
    label: "Notifications",
    to: "/university/notifications",
    icon: Bell,
    badge: "notifications",
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
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const closeLogout = useCallback(() => setIsLogoutOpen(false), []);

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

  useVisibilityPolling(refreshBadges, 30000, { runImmediately: true });

  useEffect(
    () => subscribeToPortalBadgeChanges(() => void refreshBadges()),
    [refreshBadges],
  );

  function confirmLogout() {
    closeLogout();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <PortalShell
      role="university"
      portalLabel="University portal"
      homePath="/university/training"
      navItems={universityNavItems.map((item) => ({
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
      userName={user?.fullName}
      userEmail={user?.email}
      onLogout={() => setIsLogoutOpen(true)}
    >
      <Outlet />

      <ConfirmDialog
        isOpen={isLogoutOpen}
        title="Log out?"
        description="You will need to sign in again to access supervised training."
        confirmLabel="Log out"
        variant="logout"
        onCancel={closeLogout}
        onConfirm={confirmLogout}
      />
    </PortalShell>
  );
}
