import { type FormEvent, useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { CompanyProfile } from "../domain/profileTypes";
import {
  getMyCompanyProfileAsync,
  updateMyCompanyProfileAsync,
} from "../infrastructure/profileApi";

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMyCompanyProfileAsync();
        setProfile(data);
        setCompanyName(data.companyName);
        setDescription(data.description ?? "");
        setWebsite(data.website ?? "");
        setCity(data.city ?? "");
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
      await updateMyCompanyProfileAsync({
        companyName: companyName.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        city: city.trim() || undefined,
      });
      setMessage("Company profile updated.");
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
        title="Company profile"
        description="Help job seekers understand who you are and why your opportunities are credible."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={!profile}
        emptyTitle="Company profile not found"
        emptyDescription="The API did not return a company profile."
      />

      {profile ? (
        <Card
          title={profile.companyName}
          actions={
            <StatusBadge tone={profile.isVerified ? "green" : "amber"}>
              {profile.isVerified ? "Verified" : "Not verified"}
            </StatusBadge>
          }
        >
          <form className="stack" onSubmit={handleSubmit}>
            <Input
              label="Company name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <Input
              label="Website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} />
            {message ? <div className="notice">{message}</div> : null}
            <Button type="submit" isLoading={isSaving}>
              Save company
            </Button>
          </form>
        </Card>
      ) : null}
    </section>
  );
}
