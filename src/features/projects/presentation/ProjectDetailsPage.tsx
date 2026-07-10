import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { useAuth } from "../../../shared/auth/AuthContext";
import { applyToProjectAsync } from "../../applications/infrastructure/applicationApi";
import type { CompanyProfile } from "../../profiles/domain/profileTypes";
import { getPublicCompanyProfileAsync } from "../../profiles/infrastructure/profileApi";
import {
  getOpportunityTypeLabel,
  getProjectStatusLabel,
  ProjectStatuses,
  type Project,
} from "../domain/projectTypes";
import { getProjectAsync } from "../infrastructure/projectApi";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null,
  );
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const data = await getProjectAsync(Number(projectId));
        const companyData = await getPublicCompanyProfileAsync(
          data.companyProfileId,
        );

        if (isMounted) {
          setProject(data);
          setCompanyProfile(companyData);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load opportunity.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const companyMessagePath =
    project && companyProfile
      ? `/job-seeker/messages?${new URLSearchParams({
          receiverId: companyProfile.userId,
          receiverName: project.companyName,
          projectId: String(project.id),
          projectTitle: project.title,
        })}`
      : "";

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || project.status !== ProjectStatuses.Open) return;

    setIsApplying(true);
    setMessage("");

    try {
      await applyToProjectAsync(project.id, {
        coverLetter: coverLetter.trim() || undefined,
      });
      setCoverLetter("");
      setMessage("Application submitted.");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to apply.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section className="page">
      <DataState
        isLoading={isLoading}
        error={error}
        empty={!project}
        emptyTitle="Opportunity not found"
        emptyDescription="The opportunity may have been removed."
      />

      {project ? (
        <>
          <PageHeader
            eyebrow={getOpportunityTypeLabel(project.type)}
            title={project.title}
            description={`${project.companyName} - ${project.durationWeeks} weeks`}
            actions={
              <StatusBadge
                tone={project.status === ProjectStatuses.Open ? "green" : "neutral"}
              >
                {getProjectStatusLabel(project.status)}
              </StatusBadge>
            }
          />

          <div className="two-column">
            <Card title="Opportunity details">
              <p>{project.description}</p>
              <div className="detail-list">
                <span>Company</span>
                <strong>{project.companyName}</strong>
                <span>Company status</span>
                <strong>
                  {companyProfile?.isVerified ? "Verified" : "Not verified yet"}
                </strong>
                <span>City</span>
                <strong>{companyProfile?.city ?? "Not provided"}</strong>
                <span>Budget</span>
                <strong>{project.budget ? `$${project.budget}` : "Not listed"}</strong>
                <span>Duration</span>
                <strong>{project.durationWeeks} weeks</strong>
              </div>
              {user?.role === "JobSeeker" && companyMessagePath ? (
                <div className="actions-row">
                  <Button to={companyMessagePath} variant="secondary">
                    Message company
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card
              title="Apply"
              description="Send a focused cover letter that connects your skills to the work."
            >
              {user?.role === "JobSeeker" ? (
                <form className="stack" onSubmit={handleApply}>
                  <label className="field">
                    <span>Cover letter</span>
                    <textarea
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                      placeholder="Tell the company why this opportunity fits you."
                    />
                  </label>
                  {message ? <div className="notice">{message}</div> : null}
                  <div className="actions-row">
                    <Button
                      type="submit"
                      isLoading={isApplying}
                      disabled={project.status !== ProjectStatuses.Open}
                    >
                      Apply now
                    </Button>
                    {message === "Application submitted." ? (
                      <Button to="/job-seeker/applications" variant="secondary">
                        View my applications
                      </Button>
                    ) : null}
                  </div>
                </form>
              ) : user ? (
                <p>Only job seekers can apply to opportunities.</p>
              ) : (
                <p>
                  <Link className="text-link" to="/login">
                    Log in as a job seeker
                  </Link>{" "}
                  to apply for this opportunity.
                </p>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
