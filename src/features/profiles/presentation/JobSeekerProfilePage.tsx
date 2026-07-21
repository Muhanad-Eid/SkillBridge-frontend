import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Code2, Link2, MapPin, UserRound } from "lucide-react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import {
  isJobSeekerProfileComplete,
  type JobSeekerProfile,
} from "../domain/profileTypes";
import {
  getMyJobSeekerProfileAsync,
  updateMyJobSeekerProfileAsync,
} from "../infrastructure/profileApi";

type JobSeekerPortalContext = {
  refreshProfileCompletion?: () => Promise<void>;
};

export default function JobSeekerProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const portalContext = useOutletContext<JobSeekerPortalContext>();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isRequiredFlow = searchParams.get("required") === "1";

  const stateFrom = (location.state as { from?: unknown } | null)?.from;
  const returnPath =
    typeof stateFrom === "string" && stateFrom !== "/job-seeker/profile"
      ? stateFrom
      : "/job-seeker/dashboard";

  function applyProfile(data: JobSeekerProfile) {
    setProfile(data);
    setBio(data.bio ?? "");
    setCity(data.city ?? "");
    setLinkedInUrl(data.linkedInUrl ?? "");
    setGitHubUrl(data.gitHubUrl ?? "");
  }

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await getMyJobSeekerProfileAsync();
        if (isMounted) applyProfile(data);
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load profile.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      isRequiredFlow &&
      !isLoading &&
      profile &&
      isJobSeekerProfileComplete(profile)
    ) {
      navigate(returnPath, { replace: true });
    }
  }, [isLoading, isRequiredFlow, navigate, profile, returnPath]);

  const completionItems = useMemo(
    () => [
      { label: "Professional bio", done: Boolean(bio.trim()) },
      { label: "Current city", done: Boolean(city.trim()) },
      { label: "LinkedIn profile", done: Boolean(linkedInUrl.trim()) },
      { label: "GitHub profile", done: Boolean(gitHubUrl.trim()) },
    ],
    [bio, city, linkedInUrl, gitHubUrl],
  );

  const completion = Math.round(
    (completionItems.filter((item) => item.done).length / completionItems.length) * 100,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedBio = bio.trim();
    const trimmedCity = city.trim();

    if (!trimmedBio || !trimmedCity) {
      setError("Bio and city are required before you can use the portal.");
      return;
    }

    setIsSaving(true);

    try {
      await updateMyJobSeekerProfileAsync({
        bio: trimmedBio,
        city: trimmedCity,
        linkedInUrl: linkedInUrl.trim() || undefined,
        gitHubUrl: gitHubUrl.trim() || undefined,
      });

      const refreshedProfile = await getMyJobSeekerProfileAsync();
      applyProfile(refreshedProfile);
      await portalContext.refreshProfileCompletion?.();

      if (isRequiredFlow && isJobSeekerProfileComplete(refreshedProfile)) {
        navigate(returnPath, { replace: true });
        return;
      }

      setMessage("Profile updated successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page jobseeker-profile-page">
      <PageHeader
        title={isRequiredFlow ? "Complete your profile to continue" : "Profile and public details"}
      />

      {isRequiredFlow ? (
        <div className="jobseeker-required-banner" role="status">
          <UserRound size={20} aria-hidden="true" />
          <div>
            <strong>Profile setup is required</strong>
            <span>Add your professional bio and city to unlock the job seeker portal.</span>
          </div>
        </div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={!profile}
        emptyTitle="Profile not found"
        emptyDescription="The API did not return a job seeker profile."
      />

      {profile ? (
        <div className="jobseeker-profile-layout">
          <aside className="jobseeker-profile-summary">
            <div className="jobseeker-profile-avatar" aria-hidden="true">
              {profile.fullName.trim().charAt(0).toUpperCase()}
            </div>
            <h2>{profile.fullName}</h2>
            <span><MapPin size={15} aria-hidden="true" />{city || "City not added"}</span>
            <p>{bio || "Add a short professional bio to introduce your experience and goals."}</p>

            <div className="jobseeker-profile-strength">
              <div><span>Profile details</span><strong>{completion}%</strong></div>
              <div aria-hidden="true"><b style={{ width: `${completion}%` }} /></div>
            </div>

            <div className="jobseeker-profile-signals">
              <div><strong>{profile.skills?.length ?? 0}</strong><span>Skills</span></div>
              <div><strong>{profile.portfolioItemsCount ?? 0}</strong><span>Portfolio</span></div>
              <div><strong>{profile.reviewsCount ?? 0}</strong><span>Reviews</span></div>
            </div>

            <div className="jobseeker-profile-checklist">
              {completionItems.map((item) => (
                <div key={item.label} className={item.done ? "done" : ""}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="jobseeker-profile-form-panel">
            <header>
              <div>
                <span>Public profile</span>
                <h2>Professional details</h2>
              </div>
              <small>Profile ID #{profile.id}</small>
            </header>

            <form className="stack" onSubmit={handleSubmit}>
              <label className="field">
                <span>Professional bio *</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Describe your focus, strongest experience, and the work you want to do."
                  maxLength={1500}
                  required
                />
                <small>{bio.length}/1500 characters</small>
              </label>

              <div className="jobseeker-profile-form-grid">
                <Input
                  label="City *"
                  placeholder="Amman"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                />
                <Input
                  label="LinkedIn URL"
                  type="url"
                  placeholder="https://linkedin.com/in/your-name"
                  value={linkedInUrl}
                  onChange={(event) => setLinkedInUrl(event.target.value)}
                />
                <Input
                  label="GitHub URL"
                  type="url"
                  placeholder="https://github.com/your-name"
                  value={gitHubUrl}
                  onChange={(event) => setGitHubUrl(event.target.value)}
                />
              </div>

              <div className="jobseeker-profile-link-preview">
                <Link2 size={18} aria-hidden="true" />
                <span>{linkedInUrl || "LinkedIn profile not added"}</span>
                <Code2 size={18} aria-hidden="true" />
                <span>{gitHubUrl || "GitHub profile not added"}</span>
              </div>

              {error ? <div className="notice notice-error">{error}</div> : null}
              {message ? <div className="notice">{message}</div> : null}

              <div className="jobseeker-profile-actions">
                <Button type="submit" isLoading={isSaving}>
                  {isRequiredFlow ? "Complete profile" : "Save profile"}
                </Button>
                {!isRequiredFlow ? (
                  <Button to="/job-seeker/skills" variant="secondary">
                    Manage skills
                  </Button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
