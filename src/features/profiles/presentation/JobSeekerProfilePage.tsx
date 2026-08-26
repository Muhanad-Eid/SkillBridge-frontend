import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Code2,
  Eye,
  GraduationCap,
  Link2,
  MapPin,
  PencilLine,
  UserRound,
} from "lucide-react";
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
import SkillsPage from "../../skills/presentation/SkillsPage";

type JobSeekerPortalContext = {
  refreshProfileCompletion?: () => Promise<void>;
};

export default function JobSeekerProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const portalContext = useOutletContext<JobSeekerPortalContext>();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isRequiredFlow = searchParams.get("required") === "1";
  const activeTab =
    !isRequiredFlow && searchParams.get("tab") === "skills"
      ? "skills"
      : "details";

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
    setUniversityName(data.universityName ?? "");
    setStudentNumber(data.studentNumber ?? "");
    setIsProfilePublic(data.isProfilePublic ?? false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await getMyJobSeekerProfileAsync();
        if (isMounted) {
          applyProfile(data);
          setIsEditing(
            isRequiredFlow || !isJobSeekerProfileComplete(data),
          );
        }
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
  }, [isRequiredFlow]);

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

  const canCancelEditing =
    !isRequiredFlow && isJobSeekerProfileComplete(profile);

  function handleStartEditing() {
    setError("");
    setMessage("");
    setIsEditing(true);
  }

  function handleCancelEditing() {
    if (profile) applyProfile(profile);
    setError("");
    setMessage("");
    setIsEditing(false);
  }

  function selectTab(tab: "details" | "skills") {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "skills") nextParams.set("tab", "skills");
    else nextParams.delete("tab");
    setSearchParams(nextParams, { replace: true });
  }

  async function handleSkillsChanged() {
    const refreshedProfile = await getMyJobSeekerProfileAsync();
    applyProfile(refreshedProfile);
    await portalContext.refreshProfileCompletion?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEditing) return;

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
        universityName: universityName.trim() || undefined,
        studentNumber: studentNumber.trim() || undefined,
        isProfilePublic,
      });

      const refreshedProfile = await getMyJobSeekerProfileAsync();
      applyProfile(refreshedProfile);
      setIsEditing(false);
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
        title={isRequiredFlow ? "Complete your profile" : "Profile"}
        actions={
          activeTab === "details" && profile && !isEditing ? (
            <>
              <Button
                to="/job-seeker/profile/preview"
                variant="secondary"
                className="button-with-icon"
              >
                <Eye size={16} aria-hidden="true" />
                Preview profile
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="button-with-icon"
                onClick={handleStartEditing}
              >
                <PencilLine size={16} aria-hidden="true" />
                Edit profile
              </Button>
            </>
          ) : null
        }
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

      {!isRequiredFlow ? (
        <div className="jobseeker-profile-tabs" role="tablist" aria-label="Profile sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            className={activeTab === "details" ? "active" : ""}
            onClick={() => selectTab("details")}
          >
            Profile details
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "skills"}
            className={activeTab === "skills" ? "active" : ""}
            onClick={() => selectTab("skills")}
          >
            Skills
          </button>
        </div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={!profile}
        emptyTitle="Profile not found"
        emptyDescription="The API did not return a job seeker profile."
      />

      {profile && activeTab === "details" ? (
        <div className="jobseeker-profile-layout">
          <aside className="jobseeker-profile-summary">
            <div className="jobseeker-profile-avatar" aria-hidden="true">
              {profile.fullName.trim().charAt(0).toUpperCase()}
            </div>
            <h2>{profile.fullName}</h2>
            <span><MapPin size={15} aria-hidden="true" />{city || "City not added"}</span>
            {universityName ? (
              <span>
                <GraduationCap size={15} aria-hidden="true" />
                {universityName}
              </span>
            ) : null}
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

            <form
              className={`stack profile-edit-form ${isEditing ? "is-editing" : "is-read-only"}`}
              onSubmit={handleSubmit}
            >
              <label className="field">
                <span>Professional bio *</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Describe your focus, strongest experience, and the work you want to do."
                  maxLength={1500}
                  required
                  readOnly={!isEditing}
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
                  readOnly={!isEditing}
                />
                <Input
                  label="LinkedIn URL"
                  type="url"
                  placeholder="https://linkedin.com/in/your-name"
                  value={linkedInUrl}
                  onChange={(event) => setLinkedInUrl(event.target.value)}
                  readOnly={!isEditing}
                />
                <Input
                  label="GitHub URL"
                  type="url"
                  placeholder="https://github.com/your-name"
                  value={gitHubUrl}
                  onChange={(event) => setGitHubUrl(event.target.value)}
                  readOnly={!isEditing}
                />
                <Input
                  label="University"
                  placeholder="Required for University Training"
                  value={universityName}
                  onChange={(event) => setUniversityName(event.target.value)}
                  readOnly={!isEditing}
                />
                <Input
                  label="Student number"
                  placeholder="Required for University Training"
                  value={studentNumber}
                  onChange={(event) => setStudentNumber(event.target.value)}
                  readOnly={!isEditing}
                />
              </div>

              <label className="field field-check">
                <input
                  type="checkbox"
                  checked={isProfilePublic}
                  disabled={!isEditing}
                  onChange={(event) =>
                    setIsProfilePublic(event.target.checked)
                  }
                />
                <span>
                  Make my profile and shared evidence publicly viewable
                  (anonymous visitors). When unchecked, only signed-in
                  SkillBridge users you interact with can see your work.
                </span>
              </label>

              <div className="jobseeker-profile-link-preview">
                <Link2 size={18} aria-hidden="true" />
                <span>{linkedInUrl || "LinkedIn profile not added"}</span>
                <Code2 size={18} aria-hidden="true" />
                <span>{gitHubUrl || "GitHub profile not added"}</span>
              </div>

              {error ? <div className="notice notice-error">{error}</div> : null}
              {message ? <div className="notice">{message}</div> : null}

              <div className="jobseeker-profile-actions">
                {isEditing ? (
                  <Button type="submit" isLoading={isSaving}>
                    {isRequiredFlow ? "Complete profile" : "Save changes"}
                  </Button>
                ) : null}
                {isEditing && canCancelEditing ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSaving}
                    onClick={handleCancelEditing}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {profile && activeTab === "skills" ? (
        <SkillsPage embedded onSkillsChanged={handleSkillsChanged} />
      ) : null}
    </section>
  );
}
