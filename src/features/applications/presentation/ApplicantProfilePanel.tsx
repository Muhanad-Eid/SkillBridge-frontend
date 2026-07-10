import { type ReactNode } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  MessageSquare,
  Star,
  X,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import {
  getApplicationStatusLabel,
  type Application,
} from "../domain/applicationTypes";

type ApplicantProfilePanelProps = {
  application: Application;
  error: string;
  isLoading: boolean;
  onClose: () => void;
  profile: JobSeekerProfile | null;
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
  actions,
}: ApplicantProfilePanelProps) {
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
              <span>Applicant #{application.jobSeekerId}</span>
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
          <StatusBadge>
            {getApplicationStatusLabel(application.status)}
          </StatusBadge>
          <span>Application #{application.id}</span>
          <span>Project #{application.projectId}</span>
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
                <span>Portfolio proof</span>
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

            <section>
              <h3>Cover letter</h3>
              <p>{application.coverLetter ?? "No cover letter provided."}</p>
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
