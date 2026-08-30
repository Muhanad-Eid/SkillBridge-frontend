import { useCallback, useState } from "react";
import {
  BriefcaseBusiness,
  ClipboardCheck,
  Building2,
  FileCheck2,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Star,
  ShieldCheck,
  Tags,
  UserCog,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { getAdminQueueSummaryAsync } from "../../features/admin/infrastructure/adminApi";
import { useAuth } from "../../shared/auth/AuthContext";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import useVisibilityPolling from "../../shared/hooks/useVisibilityPolling";
import PortalShell from "../../shared/layout/PortalShell";

type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "companies" | "applications" | "reviews";
};

export type AdminPortalOutletContext = {
  refreshQueues: () => Promise<void>;
};

const adminNavItems: AdminNavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: UserCog },
  { label: "Companies", to: "/admin/companies", icon: Building2, badge: "companies" },
  { label: "Job seekers", to: "/admin/job-seekers", icon: GraduationCap },
  { label: "Projects", to: "/admin/projects", icon: BriefcaseBusiness },
  { label: "Evidence", to: "/admin/evidence", icon: ShieldCheck },
  { label: "Proof Engine", to: "/admin/proof-engine", icon: Workflow },
  { label: "Evidence requests", to: "/admin/evidence-requests", icon: ClipboardCheck },
  { label: "Applications", to: "/admin/applications", icon: FileCheck2, badge: "applications" },
  { label: "Reviews", to: "/admin/reviews", icon: Star, badge: "reviews" },
  { label: "Skills", to: "/admin/skills", icon: Tags },
  { label: "Audit log", to: "/admin/audit", icon: ScrollText },
  { label: "Change password", to: "/admin/security", icon: KeyRound },
];

export default function AdminPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCompanies, setPendingCompanies] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [flaggedReviews, setFlaggedReviews] = useState(0);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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
    <PortalShell
      role="admin"
      portalLabel="Administration"
      homePath="/admin/dashboard"
      userName={user?.fullName}
      userEmail={user?.email}
      onLogout={handleLogout}
      navItems={adminNavItems.map((item) => ({
        label: item.label,
        to: item.to,
        icon: item.icon,
        badgeCount:
          item.badge === "companies"
            ? pendingCompanies
            : item.badge === "applications"
              ? pendingApplications
              : item.badge === "reviews"
                ? flaggedReviews
                : undefined,
      }))}
    >
      <Outlet context={{ refreshQueues } satisfies AdminPortalOutletContext} />
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        title="Log out?"
        description="You will need to sign in again to access the admin portal."
        confirmLabel="Log out"
        variant="logout"
        onCancel={closeLogoutDialog}
        onConfirm={confirmLogout}
      />
    </PortalShell>
  );
}
