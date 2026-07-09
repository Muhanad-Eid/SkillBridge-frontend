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
  isJobSeekerProfileComplete,
  type JobSeekerProfile,
} from "../../features/profiles/domain/profileTypes";
import { getMyJobSeekerProfileAsync } from "../../features/profiles/infrastructure/profileApi";

const jobSeekerNavItems = [
  { label: "Home", to: "/job-seeker/dashboard" },
  { label: "Browse opportunities", to: "/job-seeker/opportunities" },
  { label: "My applications", to: "/job-seeker/applications" },
  { label: "Skills", to: "/job-seeker/skills" },
  { label: "Portfolio", to: "/job-seeker/portfolio" },
  { label: "Messages", to: "/job-seeker/messages" },
  { label: "Notifications", to: "/job-seeker/notifications" },
  { label: "Profile", to: "/job-seeker/profile" },
];

export default function JobSeekerPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const refreshProfileCompletion = useCallback(async () => {
    setIsCheckingProfile(true);
    setProfileError("");

    try {
      const data = await getMyJobSeekerProfileAsync();
      setProfile(data);
    } catch (caughtError) {
      setProfile(null);
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to check your profile.",
      );
    } finally {
      setIsCheckingProfile(false);
    }
  }, []);

  useEffect(() => {
    refreshProfileCompletion();
  }, [refreshProfileCompletion]);

  const profileIsComplete = isJobSeekerProfileComplete(profile);
  const isProfileRoute = location.pathname === "/job-seeker/profile";
  const navItems = profileIsComplete
    ? jobSeekerNavItems
    : jobSeekerNavItems.filter((item) => item.to === "/job-seeker/profile");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!isCheckingProfile && !profileIsComplete && !isProfileRoute) {
    return (
      <Navigate
        to="/job-seeker/profile?required=1"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <div className="jobseeker-portal">
      <header className="jobseeker-topbar">
        <Link
          className="portal-brand"
          to={profileIsComplete ? "/job-seeker/dashboard" : "/job-seeker/profile"}
        >
          <span className="brand-mark">SB</span>
          <span>
            <strong>SkillBridge</strong>
            <small>Job seeker portal</small>
          </span>
        </Link>

        <div className="jobseeker-actions">
          {profileIsComplete ? (
            <Button to="/job-seeker/opportunities" variant="primary">
              Browse
            </Button>
          ) : null}
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="jobseeker-layout">
        <aside className="jobseeker-panel">
          <div className="career-card">
            <span>{profileIsComplete ? "Career profile" : "Profile required"}</span>
            <strong>{user?.fullName}</strong>
            <p>
              {profileIsComplete
                ? "Apply to opportunities and build portfolio proof from real work."
                : "Complete your profile before using the job seeker portal."}
            </p>
          </div>

          <nav className="jobseeker-nav" aria-label="Job seeker navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="jobseeker-content">
          <section className="portal-identity jobseeker-identity">
            <span>Job Seeker Portal</span>
            <strong>
              {profileIsComplete
                ? "Applications, skills, and portfolio proof"
                : "Complete your profile to continue"}
            </strong>
          </section>
          {isCheckingProfile ? (
            <div className="notice">Checking profile...</div>
          ) : profileError && !isProfileRoute ? (
            <div className="notice notice-error">{profileError}</div>
          ) : (
            <Outlet context={{ refreshProfileCompletion, profileIsComplete }} />
          )}
        </main>
      </div>
    </div>
  );
}
