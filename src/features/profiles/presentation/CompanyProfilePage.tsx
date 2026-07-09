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
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  isCompanyProfileComplete,
  type CompanyProfile,
} from "../domain/profileTypes";
import {
  getMyCompanyProfileAsync,
  updateMyCompanyProfileAsync,
} from "../infrastructure/profileApi";

type CompanyPortalContext = {
  refreshProfileCompletion?: () => Promise<void>;
};

export default function CompanyProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const portalContext = useOutletContext<CompanyPortalContext>();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isRequiredFlow = searchParams.get("required") === "1";

  const stateFrom = (location.state as { from?: unknown } | null)?.from;
  const returnPath =
    typeof stateFrom === "string" && stateFrom !== "/company/profile"
      ? stateFrom
      : "/company/dashboard";

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

  useEffect(() => {
    if (
      isRequiredFlow &&
      !isLoading &&
      profile &&
      isCompanyProfileComplete(profile)
    ) {
      navigate(returnPath, { replace: true });
    }
  }, [isLoading, isRequiredFlow, navigate, profile, returnPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedCompanyName = companyName.trim();
    const trimmedDescription = description.trim();
    const trimmedCity = city.trim();

    if (!trimmedCompanyName || !trimmedDescription || !trimmedCity) {
      setError(
        "Company name, description, and city are required before you can use the portal.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await updateMyCompanyProfileAsync({
        companyName: trimmedCompanyName,
        description: trimmedDescription,
        website: website.trim() || undefined,
        city: trimmedCity,
      });

      const nextProfile = profile
        ? {
            ...profile,
            companyName: trimmedCompanyName,
            description: trimmedDescription,
            website: website.trim() || null,
            city: trimmedCity,
          }
        : null;

      setProfile(nextProfile);
      await portalContext.refreshProfileCompletion?.();

      if (isRequiredFlow && isCompanyProfileComplete(nextProfile)) {
        navigate(returnPath, { replace: true });
        return;
      }

      setMessage("Company profile updated.");
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
        title="Company profile"
        description={
          isRequiredFlow
            ? "Complete the required fields before using opportunities, applications, messages, and notifications."
            : "Help job seekers understand who you are and why your opportunities are credible."
        }
      />

      {isRequiredFlow ? (
        <div className="notice">
          Complete your company profile first. Company name, description, and
          city are required.
        </div>
      ) : null}

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
          description={`Company ID ${profile.id}`}
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
                required
              />
            </label>
            <Input
              label="Website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <Input
              label="City"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
            />
            {message ? <div className="notice">{message}</div> : null}
            <Button type="submit" isLoading={isSaving}>
              {isRequiredFlow ? "Complete company profile" : "Save company"}
            </Button>
          </form>
        </Card>
      ) : null}
    </section>
  );
}
