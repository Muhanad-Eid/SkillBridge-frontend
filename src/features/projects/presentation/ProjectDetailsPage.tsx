import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { useAuth } from "../../../shared/auth/AuthContext";
import { applyToProjectAsync } from "../../applications/infrastructure/applicationApi";
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
        if (isMounted) setProject(data);
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

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;

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
            description={`${project.companyName} · ${project.durationWeeks} weeks`}
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
                <span>Budget</span>
                <strong>{project.budget ? `$${project.budget}` : "Not listed"}</strong>
                <span>Duration</span>
                <strong>{project.durationWeeks} weeks</strong>
              </div>
            </Card>

            <Card title="Apply">
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
                  <Button type="submit" isLoading={isApplying}>
                    Apply now
                  </Button>
                </form>
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
