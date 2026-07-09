import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
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
}: ApplicantProfilePanelProps) {
  return (
    <Card
      className="applicant-profile-panel"
      eyebrow="Applicant profile"
      title={application.jobSeekerName}
      description={application.projectTitle}
      actions={
        <>
          {profile ? (
            <Button to={getApplicantMessagePath(application, profile)}>
              Message applicant
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {isLoading ? <div className="notice">Loading profile...</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}

      {!isLoading && !error && profile ? (
        <div className="stack">
          <div className="detail-list">
            <span>Applicant ID</span>
            <strong>{profile.id}</strong>

            <span>Status</span>
            <strong>
              <StatusBadge>
                {getApplicationStatusLabel(application.status)}
              </StatusBadge>
            </strong>

            <span>City</span>
            <strong>{profile.city ?? "Not provided"}</strong>

            <span>LinkedIn</span>
            <strong>
              {profile.linkedInUrl ? (
                <a className="text-link" href={profile.linkedInUrl}>
                  Open LinkedIn
                </a>
              ) : (
                "Not provided"
              )}
            </strong>

            <span>GitHub</span>
            <strong>
              {profile.gitHubUrl ? (
                <a className="text-link" href={profile.gitHubUrl}>
                  Open GitHub
                </a>
              ) : (
                "Not provided"
              )}
            </strong>
          </div>

          <div>
            <h4>Bio</h4>
            <p>{profile.bio ?? "No bio provided."}</p>
          </div>

          <div>
            <h4>Cover letter</h4>
            <p>{application.coverLetter ?? "No cover letter provided."}</p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
