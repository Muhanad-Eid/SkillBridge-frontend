import { useCallback, useEffect, useState } from "react";
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
import {
  isCompanyProfileComplete,
  type CompanyProfile,
} from "../../features/profiles/domain/profileTypes";
import { getMyCompanyProfileAsync } from "../../features/profiles/infrastructure/profileApi";

const companyNavItems = [
  { label: "Overview", to: "/company/dashboard" },
  { label: "Opportunities", to: "/company/projects" },
  { label: "Applications", to: "/company/applications" },
  { label: "Messages", to: "/company/messages" },
  { label: "Notifications", to: "/company/notifications" },
  { label: "Profile", to: "/company/profile" },
];

export default function CompanyPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const refreshProfileCompletion = useCallback(async () => {
    setIsCheckingProfile(true);
    setProfileError("");

    try {
      const data = await getMyCompanyProfileAsync();
      setProfile(data);
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

  useEffect(() => {
    refreshProfileCompletion();
  }, [refreshProfileCompletion]);

  const profileIsComplete = isCompanyProfileComplete(profile);
  const isProfileRoute = location.pathname === "/company/profile";
  const navItems = profileIsComplete
    ? companyNavItems
    : companyNavItems.filter((item) => item.to === "/company/profile");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!isCheckingProfile && !profileIsComplete && !isProfileRoute) {
    return (
      <Navigate
        to="/company/profile?required=1"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <div className="company-portal">
      <header className="company-topbar">
        <Link
          className="portal-brand"
          to={profileIsComplete ? "/company/dashboard" : "/company/profile"}
        >
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Company portal</small>
          </span>
        </Link>

        <nav className="company-tabs" aria-label="Company navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="company-user">
          <span>{user?.fullName}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <section className="company-hero-strip">
        <div>
          <span>
            {profileIsComplete
              ? "Hiring and training workspace"
              : "Company profile required"}
          </span>
          <strong>
            {profileIsComplete
              ? "Post work. Review applicants. Build talent."
              : "Complete your company profile before using the portal."}
          </strong>
        </div>
        {profileIsComplete ? (
          <Button to="/company/projects" variant="primary">
            Manage opportunities
          </Button>
        ) : (
          <Button to="/company/profile" variant="primary">
            Complete profile
          </Button>
        )}
      </section>

      <main className="company-content">
        <section className="portal-identity company-identity">
          <span>Company Portal</span>
          <strong>
            {profileIsComplete
              ? "Opportunities, applicants, and company operations"
              : "Complete your company profile to continue"}
          </strong>
        </section>
        {isCheckingProfile ? (
          <div className="notice">Checking company profile...</div>
        ) : profileError && !isProfileRoute ? (
          <div className="notice notice-error">{profileError}</div>
        ) : (
          <Outlet context={{ refreshProfileCompletion, profileIsComplete }} />
        )}
      </main>
    </div>
  );
}
