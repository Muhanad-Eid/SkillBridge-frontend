import { type FormEvent, useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import type { JobSeekerProfile } from "../domain/profileTypes";
import {
  getMyJobSeekerProfileAsync,
  updateMyJobSeekerProfileAsync,
} from "../infrastructure/profileApi";

export default function JobSeekerProfilePage() {
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await updateMyJobSeekerProfileAsync({
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
        gitHubUrl: gitHubUrl.trim() || undefined,
      });
      setMessage("Profile updated.");
    } catch (caughtError) {
      setMessage(
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
        description="Keep your career profile useful for companies reviewing your applications."
      />

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
              <textarea value={bio} onChange={(event) => setBio(event.target.value)} />
            </label>
            <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} />
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
              Save profile
            </Button>
          </form>
        </Card>
      ) : null}
    </section>
  );
}
