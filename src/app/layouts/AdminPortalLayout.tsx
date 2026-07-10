import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  Gauge,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Star,
  Tags,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ApplicationStatuses } from "../../features/applications/domain/applicationTypes";
import {
  getAdminApplicationsAsync,
  getAdminCompaniesAsync,
  getAdminReviewsAsync,
} from "../../features/admin/infrastructure/adminApi";
import { useAuth } from "../../shared/auth/AuthContext";
import Button from "../../shared/components/Button";
import StatusBadge from "../../shared/components/StatusBadge";

type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "companies" | "applications" | "reviews";
};

const adminNavItems: AdminNavItem[] = [
  { label: "Control center", to: "/admin/dashboard", icon: Gauge },
  { label: "Users", to: "/admin/users", icon: UserCog },
  { label: "Companies", to: "/admin/companies", icon: Building2, badge: "companies" },
  { label: "Job seekers", to: "/admin/job-seekers", icon: GraduationCap },
  { label: "Projects", to: "/admin/projects", icon: BriefcaseBusiness },
  { label: "Applications", to: "/admin/applications", icon: FileCheck2, badge: "applications" },
  { label: "Reviews", to: "/admin/reviews", icon: Star, badge: "reviews" },
  { label: "Skills catalog", to: "/admin/skills", icon: Tags },
];

const sectionTitles: Record<string, string> = {
  "/admin/dashboard": "Platform control center",
  "/admin/users": "User accounts",
  "/admin/companies": "Company verification",
  "/admin/job-seekers": "Job seeker oversight",
  "/admin/projects": "Project governance",
  "/admin/applications": "Application oversight",
  "/admin/reviews": "Review moderation",
  "/admin/skills": "Skills catalog",
};

export default function AdminPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCompanies, setPendingCompanies] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [flaggedReviews, setFlaggedReviews] = useState(0);

  const refreshQueues = useCallback(async () => {
    const [companyResult, applicationResult, reviewResult] = await Promise.allSettled([
      getAdminCompaniesAsync(),
      getAdminApplicationsAsync(),
      getAdminReviewsAsync(),
    ]);

    if (companyResult.status === "fulfilled") {
      setPendingCompanies(companyResult.value.filter((company) => !company.isVerified).length);
    }

    if (applicationResult.status === "fulfilled") {
      setPendingApplications(
        applicationResult.value.filter(
          (application) => application.status === ApplicationStatuses.Pending,
        ).length,
      );
    }

    if (reviewResult.status === "fulfilled") {
      setFlaggedReviews(reviewResult.value.filter((review) => review.rating <= 2).length);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(refreshQueues, 0);
    const intervalId = window.setInterval(refreshQueues, 10000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [refreshQueues]);

  const currentSection = useMemo(
    () => sectionTitles[location.pathname] ?? "Administration",
    [location.pathname],
  );

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-portal admin-portal-v2">
      <aside className="admin-sidebar-v2">
        <Link className="admin-brand-v2" to="/admin/dashboard">
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Administration</small>
          </span>
        </Link>

        <div className="admin-authority-card">
          <span><ShieldCheck size={18} aria-hidden="true" /></span>
          <div>
            <strong>Platform administrator</strong>
            <small>Full governance access</small>
          </div>
          <BadgeCheck size={17} aria-label="Administrator verified" />
        </div>

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
              <NavLink key={item.to} to={item.to}>
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

      <div className="admin-workspace-v2">
        <header className="admin-workspace-header-v2">
          <div>
            <span>Admin portal</span>
            <strong>{currentSection}</strong>
          </div>
          <div className="admin-system-status">
            <span>{pendingCompanies + pendingApplications + flaggedReviews} items need attention</span>
            <StatusBadge tone="green">System online</StatusBadge>
          </div>
        </header>

        <main className="admin-content admin-content-v2">
          <Outlet context={{ refreshQueues }} />
        </main>
      </div>
    </div>
  );
}
