import { type FormEvent, useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
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

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyJobSeekerProfileAsync();
        setProfile(data);
        setBio(data.bio ?? "");
        setCity(data.city ?? "");
        setLinkedInUrl(data.linkedInUrl ?? "");
        setGitHubUrl(data.gitHubUrl ?? "");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load profile.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
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

      const nextProfile = profile
        ? {
            ...profile,
            bio: trimmedBio,
            city: trimmedCity,
            linkedInUrl: linkedInUrl.trim() || null,
            gitHubUrl: gitHubUrl.trim() || null,
          }
        : null;

      setProfile(nextProfile);
      await portalContext.refreshProfileCompletion?.();

      if (isRequiredFlow && isJobSeekerProfileComplete(nextProfile)) {
        navigate(returnPath, { replace: true });
        return;
      }

      setMessage("Profile updated.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Profile"
        title="Job seeker profile"
        description={
          isRequiredFlow
            ? "Complete the required fields before using applications, skills, portfolio, and messages."
            : "Keep your career profile useful for companies reviewing your applications."
        }
      />

      {isRequiredFlow ? (
        <div className="notice">
          Complete your profile first. Bio and city are required.
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
        <Card title={profile.fullName} description={`Profile ID ${profile.id}`}>
          <form className="stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Bio</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                required
              />
            </label>
            <Input
              label="City"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
            />
            <Input
              label="LinkedIn URL"
              value={linkedInUrl}
              onChange={(event) => setLinkedInUrl(event.target.value)}
            />
            <Input
              label="GitHub URL"
              value={gitHubUrl}
              onChange={(event) => setGitHubUrl(event.target.value)}
            />
            {message ? <div className="notice">{message}</div> : null}
            <Button type="submit" isLoading={isSaving}>
              {isRequiredFlow ? "Complete profile" : "Save profile"}
            </Button>
          </form>
        </Card>
      ) : null}
    </section>
  );
}
