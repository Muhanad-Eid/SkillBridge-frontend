import { type FormEvent, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldCheck,
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

  function applyProfile(data: CompanyProfile) {
    setProfile(data);
    setCompanyName(data.companyName);
    setDescription(data.description ?? "");
    setWebsite(data.website ?? "");
    setCity(data.city ?? "");
  }

  useEffect(() => {
    async function loadProfile() {
      setError("");

      try {
        applyProfile(await getMyCompanyProfileAsync());
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load company profile.",
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
      setError("Company name, description, and city are required.");
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

      const refreshedProfile = await getMyCompanyProfileAsync();
      applyProfile(refreshedProfile);
      await portalContext.refreshProfileCompletion?.();

      if (isRequiredFlow && isCompanyProfileComplete(refreshedProfile)) {
        navigate(returnPath, { replace: true });
        return;
      }

      setMessage(
        refreshedProfile.isVerified
          ? "Company profile updated."
          : "Company profile saved and ready for admin verification.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const profileComplete = isCompanyProfileComplete(profile);

  return (
    <section className="page company-profile-page-v2">
      <PageHeader
        title="Company profile"
        actions={
          profile?.website ? (
            <a
              className="button button-secondary button-with-icon"
              href={profile.website}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Open website
            </a>
          ) : null
        }
      />

      {isRequiredFlow ? (
        <div className="company-profile-required" role="status">
          <Building2 size={20} aria-hidden="true" />
          <div>
            <strong>Complete your profile to open the company workspace.</strong>
            <span>Company name, description, and city are required.</span>
          </div>
        </div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={profile ? "" : error}
        empty={!isLoading && !error && !profile}
        emptyTitle="Company profile not found"
        emptyDescription="The account does not have a company profile."
      />

      {!isLoading && profile ? (
        <>
          <section className="company-verification-panel">
            <div className="company-verification-state">
              <span className={profile.isVerified ? "verified" : "pending"}>
                {profile.isVerified ? (
                  <ShieldCheck size={24} aria-hidden="true" />
                ) : (
                  <Clock3 size={24} aria-hidden="true" />
                )}
              </span>
              <div>
                <StatusBadge tone={profile.isVerified ? "green" : "amber"}>
                  {profile.isVerified ? "Verified company" : "Pending verification"}
                </StatusBadge>
                <h2>
                  {profile.isVerified
                    ? "Your company can publish opportunities"
                    : "An admin must verify this profile"}
                </h2>
                <p>
                  {profile.isVerified
                    ? "Changing company identity details will require admin verification again."
                    : "You can use the workspace while waiting, but publishing and reopening opportunities are disabled."}
                </p>
              </div>
            </div>

            <div className="company-verification-steps" aria-label="Verification progress">
              <div className={profileComplete ? "complete" : "current"}>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Profile complete</span>
              </div>
              <div className={profile.isVerified ? "complete" : "current"}>
                {profile.isVerified ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <Clock3 size={18} aria-hidden="true" />
                )}
                <span>Admin review</span>
              </div>
              <div className={profile.isVerified ? "complete" : ""}>
                <BriefcaseStatusIcon />
                <span>Publishing enabled</span>
              </div>
            </div>
          </section>

          <section className="company-profile-form-panel">
            <header>
              <div>
                <span>Company ID #{profile.id}</span>
                <h2>Public company details</h2>
              </div>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="company-form-grid">
                <Input
                  label="Company name"
                  value={companyName}
                  maxLength={120}
                  required
                  onChange={(event) => setCompanyName(event.target.value)}
                />
                <Input
                  label="City"
                  value={city}
                  maxLength={120}
                  required
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>
              <Input
                label="Website"
                type="url"
                placeholder="https://company.example"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
              <label className="field">
                <span>Company description</span>
                <textarea
                  value={description}
                  maxLength={2000}
                  required
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              {message ? <div className="notice notice-success">{message}</div> : null}
              {error ? <div className="notice notice-error">{error}</div> : null}

              <div className="company-profile-form-actions">
                <Button type="submit" isLoading={isSaving}>
                  {isRequiredFlow ? "Complete company profile" : "Save profile"}
                </Button>
              </div>
            </form>
          </section>
        </>
      ) : null}
    </section>
  );
}

function BriefcaseStatusIcon() {
  return <Building2 size={18} aria-hidden="true" />;
}
