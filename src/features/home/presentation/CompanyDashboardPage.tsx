import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
} from "../../applications/domain/applicationTypes";
import { getCompanyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import {
  getProjectStatusLabel,
  ProjectStatuses,
  type Project,
} from "../../projects/domain/projectTypes";
import { getMyCompanyProjectsAsync } from "../../projects/infrastructure/projectApi";

export default function CompanyDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyWorkspace() {
      try {
        const [projectData, applicationData] = await Promise.all([
          getMyCompanyProjectsAsync(),
          getCompanyApplicationsAsync(),
        ]);

        if (isMounted) {
          setProjects(projectData);
          setApplications(applicationData);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load company workspace.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanyWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  const openProjects = useMemo(() => {
    return projects.filter((project) => project.status === ProjectStatuses.Open);
  }, [projects]);

  const pendingApplications = useMemo(() => {
    return applications.filter(
      (application) => application.status === ApplicationStatuses.Pending,
    );
  }, [applications]);

  const latestApplications = applications.slice(0, 4);

  return (
    <section className="page company-command-page">
      <PageHeader
        eyebrow="Company command center"
        title="Run your opportunities pipeline."
        description="Create work, monitor applications, and move applicants through your company review flow."
        actions={
          <Button to="/company/projects" variant="primary">
            Post opportunity
          </Button>
        }
      />

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="company-metric-strip">
        <article>
          <span>Company opportunities</span>
          <strong>{isLoading ? "-" : projects.length}</strong>
        </article>
        <article>
          <span>Open listings</span>
          <strong>{isLoading ? "-" : openProjects.length}</strong>
        </article>
        <article>
          <span>Total applications</span>
          <strong>{isLoading ? "-" : applications.length}</strong>
        </article>
        <article>
          <span>Pending review</span>
          <strong>{isLoading ? "-" : pendingApplications.length}</strong>
        </article>
      </div>

      <div className="company-command-grid">
        <Card
          className="company-command-primary"
          eyebrow="Operations"
          title="Opportunity control"
          description="Your company portal is built around posted work and applicant review, not browsing."
          actions={
            <Button to="/company/projects" variant="secondary">
              Manage projects
            </Button>
          }
        >
          <div className="company-flow-list">
            <span>Create listing</span>
            <span>Collect applicants</span>
            <span>Accept or reject</span>
          </div>
        </Card>

        <Card
          eyebrow="Review queue"
          title="Latest applications"
          description={
            latestApplications.length === 0
              ? "No applicants yet."
              : "Newest applicant activity across your opportunities."
          }
          actions={
            <Button to="/company/applications" variant="ghost">
              Open pipeline
            </Button>
          }
        >
          {latestApplications.length === 0 ? (
            <p>Applications will appear here after job seekers apply.</p>
          ) : (
            <div className="mini-list">
              {latestApplications.map((application) => (
                <div key={application.id}>
                  <strong>{application.jobSeekerName}</strong>
                  <span>{application.projectTitle}</span>
                  <StatusBadge>
                    {getApplicationStatusLabel(application.status)}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="company-project-strip">
        {projects.slice(0, 3).map((project) => (
          <Card
            key={project.id}
            title={project.title}
            description={`${project.durationWeeks} weeks`}
            actions={
              <StatusBadge>
                {getProjectStatusLabel(project.status)}
              </StatusBadge>
            }
          >
            <p>{project.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
