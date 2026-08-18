import { useCallback, useState } from "react";
import {
  Bell,
  GraduationCap,
  KeyRound,
  MessageSquare,
} from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import PortalShell from "../../shared/layout/PortalShell";

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
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const closeLogout = useCallback(() => setIsLogoutOpen(false), []);

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
      navItems={navItems}
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
        onCancel={closeLogout}
        onConfirm={confirmLogout}
      />
    </PortalShell>
  );
}
