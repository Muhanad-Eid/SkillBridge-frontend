import { type ReactNode, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileDown,
  MapPin,
  MessageSquare,
  RotateCcw,
  Star,
  X,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getPublicPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import PortfolioGallery from "../../portfolio/presentation/PortfolioGallery";
import {
  getFreelancePricingLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import {
  getApplicationStatusLabelForOpportunity,
  type Application,
} from "../domain/applicationTypes";
import { downloadApplicationCvAsync } from "../infrastructure/applicationApi";

type ApplicantProfilePanelProps = {
  application: Application;
  error: string;
  isLoading: boolean;
  onClose: () => void;
  profile: JobSeekerProfile | null;
  includedRevisions?: number | null;
  actions?: ReactNode;
};

function getApplicantMessagePath(
  application: Application,
  profile: JobSeekerProfile,
) {
  const params = new URLSearchParams({
    receiverId: profile.userId,
    receiverName: application.jobSeekerName,
    projectId: String(application.projectId),
    projectTitle: application.projectTitle,
  });

  return `/company/messages?${params}`;
}

export default function ApplicantProfilePanel({
  application,
  error,
  isLoading,
  onClose,
  profile,
  includedRevisions,
  actions,
}: ApplicantProfilePanelProps) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioError, setPortfolioError] = useState("");
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [isCvDownloading, setIsCvDownloading] = useState(false);
  const [cvError, setCvError] = useState("");

  async function downloadCv() {
    setIsCvDownloading(true);
    setCvError("");

    try {
      await downloadApplicationCvAsync(application.id);
    } catch (caughtError) {
      setCvError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to download the CV.",
      );
    } finally {
      setIsCvDownloading(false);
    }
  }

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsPortfolioLoading(true);
      setPortfolioError("");

      try {
        const items = await getPublicPortfolioAsync(profile.id);
        if (!cancelled) setPortfolio(items);
      } catch (caughtError) {
        if (!cancelled) {
          setPortfolioError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load portfolio items.",
          );
        }
      } finally {
        if (!cancelled) setIsPortfolioLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [profile]);

  return (
    <div className="company-applicant-backdrop" role="presentation">
      <aside
        className="company-applicant-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-profile-title"
      >
        <header className="company-applicant-header">
          <div className="company-applicant-identity">
            <span className="company-avatar company-avatar-large" aria-hidden="true">
              {application.jobSeekerName.charAt(0).toUpperCase()}
            </span>
            <div>
              <span>Application #{application.id}</span>
              <h2 id="applicant-profile-title">{application.jobSeekerName}</h2>
              <p>{application.projectTitle}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="company-icon-action"
            aria-label="Close applicant profile"
            title="Close"
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </header>

        <div className="company-applicant-status-row">
          {application.isShortlisted ? (
            <StatusBadge tone="blue">Shortlisted</StatusBadge>
          ) : null}
          <StatusBadge>
            {getApplicationStatusLabelForOpportunity(
              application.status,
              application.opportunityType,
            )}
          </StatusBadge>
          <span>Application #{application.id}</span>
          <span>Project #{application.projectId}</span>
        </div>

        <div className="company-applicant-content">
          <section>
            <h3>
              {application.opportunityType === OpportunityTypes.FreelanceTask
                ? "Proposal and evidence"
                : "Application evidence"}
            </h3>
            <p>{application.coverLetter ?? "No introduction provided."}</p>
            {application.opportunityType === OpportunityTypes.FreelanceTask ? (
              <div className="freelance-proposal-summary">
                <div>
                  <CircleDollarSign size={18} aria-hidden="true" />
                  <span>
                    {getFreelancePricingLabel(
                      application.freelancePricingType,
                    )}
                  </span>
                  <strong>
                    {application.proposedBudget
                      ? `$${application.proposedBudget}`
                      : "Not set"}
                  </strong>
                </div>
                <div>
                  <Clock3 size={18} aria-hidden="true" />
                  <span>Delivery</span>
                  <strong>{application.proposedDeliveryDays} days</strong>
                </div>
                <div>
                  <RotateCcw size={18} aria-hidden="true" />
                  <span>Included revisions</span>
                  <strong>{includedRevisions ?? 1}</strong>
                </div>
              </div>
            ) : null}
            {application.shortTaskResponse ? (
              <>
                <strong>Short task response</strong>
                <p>{application.shortTaskResponse}</p>
              </>
            ) : null}
            {application.workSampleUrl ? (
              <a
                className="button button-secondary"
                href={application.workSampleUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Open work sample
              </a>
            ) : null}
            {application.hasCv && application.canViewCv ? (
              <Button
                type="button"
                variant="secondary"
                className="button-with-icon"
                isLoading={isCvDownloading}
                onClick={downloadCv}
              >
                <FileDown size={16} aria-hidden="true" />
                Download CV
              </Button>
            ) : null}
            {application.hasCv && !application.canViewCv ? (
              <div className="notice">
                The CV stays hidden during the initial blind review.
              </div>
            ) : null}
            {cvError ? (
              <div className="notice notice-error">{cvError}</div>
            ) : null}
          </section>
          {application.isIdentityHidden ? (
            <div className="notice">
              Personal details stay hidden during this first review. The
              profile is revealed after the decision is recorded.
            </div>
          ) : null}
        </div>

        {isLoading ? <div className="notice">Loading profile...</div> : null}
        {error ? <div className="notice notice-error">{error}</div> : null}

        {!isLoading && !error && profile ? (
          <div className="company-applicant-content">
            <section className="company-applicant-summary-grid">
              <article>
                <MapPin size={18} aria-hidden="true" />
                <span>Location</span>
                <strong>{profile.city ?? "Not provided"}</strong>
              </article>
              <article>
                <BriefcaseBusiness size={18} aria-hidden="true" />
                <span>Portfolio items</span>
                <strong>{profile.portfolioItemsCount} items</strong>
              </article>
              <article>
                <Star size={18} aria-hidden="true" />
                <span>Work rating</span>
                <strong>
                  {profile.averageRating !== null
                    ? `${profile.averageRating.toFixed(1)} / 5`
                    : "No reviews"}
                </strong>
              </article>
            </section>

            <section>
              <h3>About</h3>
              <p>{profile.bio ?? "No bio provided."}</p>
            </section>

            <section>
              <h3>Skills</h3>
              {profile.skills.length > 0 ? (
                <div className="company-skill-list">
                  {profile.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              ) : (
                <p>No skills added yet.</p>
              )}
            </section>

            <section className="company-applicant-portfolio">
              <div className="company-applicant-section-heading">
                <h3>Verified portfolio work</h3>
                <span>{portfolio.length} items</span>
              </div>
              {isPortfolioLoading ? (
                <div className="notice">Loading portfolio...</div>
              ) : null}
              {portfolioError ? (
                <div className="notice notice-error">{portfolioError}</div>
              ) : null}
              {!isPortfolioLoading && !portfolioError ? (
                <PortfolioGallery
                  items={portfolio}
                  emptyDescription="This applicant has not added completed SkillBridge work yet."
                />
              ) : null}
            </section>

            <section>
              <h3>Links</h3>
              <div className="company-profile-links">
                {profile.linkedInUrl ? (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    LinkedIn
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}
                {profile.gitHubUrl ? (
                  <a href={profile.gitHubUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={17} aria-hidden="true" />
                    GitHub
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}
                {!profile.linkedInUrl && !profile.gitHubUrl ? (
                  <p>No external links provided.</p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        <footer className="company-applicant-actions">
          {actions}
          {profile ? (
            <Button
              to={getApplicantMessagePath(application, profile)}
              variant="secondary"
              className="button-with-icon"
            >
              <MessageSquare size={17} aria-hidden="true" />
              Message
            </Button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}
