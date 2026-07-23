import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardClock,
  MessageSquare,
  Plus,
  UsersRound,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
} from "../../applications/domain/applicationTypes";
import { getCompanyApplicationsAsync } from "../../applications/infrastructure/applicationApi";
import {
  getProjectDisplayStatusLabel,
  isApplicationDeadlinePassed,
  ProjectStatuses,
  type Project,
} from "../../projects/domain/projectTypes";
import { getMyCompanyProjectsAsync } from "../../projects/infrastructure/projectApi";

type CompanyPortalContext = {
  isCompanyVerified: boolean;
};

function getStatusTone(
  project: Pick<Project, "status" | "applicationDeadline">,
) {
  if (
    project.status === ProjectStatuses.Open &&
    isApplicationDeadlinePassed(project.applicationDeadline)
  ) {
    return "amber";
  }
  if (project.status === ProjectStatuses.Open) return "green";
  if (project.status === ProjectStatuses.InProgress) return "blue";
  if (project.status === ProjectStatuses.Cancelled) return "red";
  return "neutral";
}

export default function CompanyDashboardPage() {
  const { isCompanyVerified } = useOutletContext<CompanyPortalContext>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyWorkspace() {
      setError("");

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
              : "Unable to load the company dashboard.",
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

  const workspace = useMemo(() => {
    const pending = applications.filter(
      (application) => application.status === ApplicationStatuses.Pending,
    );
    const accepted = applications.filter(
      (application) => application.status === ApplicationStatuses.Accepted,
    );
    const activeProjects = projects.filter(
      (project) =>
        project.status === ProjectStatuses.Open ||
        project.status === ProjectStatuses.InProgress,
    );

    return {
      pending,
      accepted,
      activeProjects,
      completedProjects: projects.filter(
        (project) => project.status === ProjectStatuses.Completed,
      ).length,
      conversion:
        applications.length === 0
          ? 0
          : Math.round((accepted.length / applications.length) * 100),
    };
  }, [applications, projects]);

  return (
    <section className="page company-overview-page">
      <PageHeader
        title="Overview"
        actions={
          isCompanyVerified ? (
            <Button
              to="/company/projects?create=1"
              variant="primary"
              className="button-with-icon"
            >
              <Plus size={17} aria-hidden="true" />
              New opportunity
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="button-with-icon"
              disabled
              title="Company verification is required"
            >
              <Plus size={17} aria-hidden="true" />
              New opportunity
            </Button>
          )
        }
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle=""
        emptyDescription=""
      />

      {!isLoading && !error ? (
        <>
          <div className="company-kpi-grid">
            <article>
              <span className="company-kpi-icon kpi-blue">
                <BriefcaseBusiness size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Active opportunities</span>
                <strong>{workspace.activeProjects.length}</strong>
                <small>{projects.length} total</small>
              </div>
            </article>
            <article>
              <span className="company-kpi-icon kpi-amber">
                <ClipboardClock size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Awaiting review</span>
                <strong>{workspace.pending.length}</strong>
                <small>{applications.length} applications</small>
              </div>
            </article>
            <article>
              <span className="company-kpi-icon kpi-green">
                <UsersRound size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Accepted workers</span>
                <strong>{workspace.accepted.length}</strong>
                <small>{workspace.conversion}% acceptance rate</small>
              </div>
            </article>
            <article>
              <span className="company-kpi-icon kpi-neutral">
                <CheckCircle2 size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Completed</span>
                <strong>{workspace.completedProjects}</strong>
                <small>opportunities</small>
              </div>
            </article>
          </div>

          <div className="company-dashboard-grid">
            <section className="company-panel company-attention-panel">
              <header className="company-panel-header">
                <div>
                  <h2>Pending applications</h2>
                </div>
                <Button to="/company/applications?status=0" variant="secondary">
                  View applications
                </Button>
              </header>

              {workspace.pending.length === 0 ? (
                <div className="company-empty-panel">
                  <CheckCircle2 size={24} aria-hidden="true" />
                  <strong>No applications waiting</strong>
                  <span>New applicants will appear here.</span>
                </div>
              ) : (
                <div className="company-application-list">
                  {workspace.pending.slice(0, 5).map((application) => (
                    <article key={application.id}>
                      <span className="company-avatar" aria-hidden="true">
                        {application.jobSeekerName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>{application.jobSeekerName}</strong>
                        <span>{application.projectTitle}</span>
                      </div>
                      <StatusBadge tone="amber">
                        {getApplicationStatusLabel(application.status)}
                      </StatusBadge>
                      <Button
                        to={`/company/applications?application=${application.id}`}
                        variant="ghost"
                        aria-label={`Review ${application.jobSeekerName}`}
                        title="Review applicant"
                        className="company-row-icon-button"
                      >
                        <ArrowRight size={18} aria-hidden="true" />
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="company-quick-actions">
              <header className="company-panel-header">
                <div>
                  <h2>Quick actions</h2>
                </div>
              </header>
              {isCompanyVerified ? (
                <Button
                  to="/company/projects?create=1"
                  variant="secondary"
                  className="company-action-link"
                >
                  <Plus size={19} aria-hidden="true" />
                  <span>
                    <strong>Create opportunity</strong>
                    <small>Publish a new listing</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="company-action-link"
                  disabled
                  title="Company verification is required"
                >
                  <Plus size={19} aria-hidden="true" />
                  <span>
                    <strong>Create opportunity</strong>
                    <small>Verification required</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Button>
              )}
              <Button
                to="/company/applications"
                variant="secondary"
                className="company-action-link"
              >
                <UsersRound size={19} aria-hidden="true" />
                <span>
                  <strong>Review applicants</strong>
                  <small>{workspace.pending.length} waiting</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button
                to="/company/messages"
                variant="secondary"
                className="company-action-link"
              >
                <MessageSquare size={19} aria-hidden="true" />
                <span>
                  <strong>Open messages</strong>
                  <small>Continue candidate conversations</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </aside>
          </div>

          <section className="company-panel">
            <header className="company-panel-header">
              <div>
                <h2>Opportunities</h2>
              </div>
              <Button to="/company/projects" variant="secondary">
                View all
              </Button>
            </header>

            {projects.length === 0 ? (
              <div className="company-empty-panel">
                <BriefcaseBusiness size={24} aria-hidden="true" />
                <strong>No opportunities yet</strong>
                <span>Create your first listing after company verification.</span>
              </div>
            ) : (
              <div className="company-project-table">
                <div className="company-project-table-head" aria-hidden="true">
                  <span>Opportunity</span>
                  <span>Status</span>
                  <span>Applications</span>
                  <span>Duration</span>
                  <span />
                </div>
                {projects.slice(0, 5).map((project) => (
                  <article key={project.id}>
                    <div>
                      <strong>{project.title}</strong>
                      <span>Project #{project.id}</span>
                    </div>
                    <StatusBadge tone={getStatusTone(project)}>
                      {getProjectDisplayStatusLabel(project)}
                    </StatusBadge>
                    <strong>{project.applicationsCount}</strong>
                    <span>{project.durationWeeks} weeks</span>
                    <Button
                      to={
                        project.status === ProjectStatuses.Open
                          ? `/company/projects/${project.id}/applications`
                          : `/company/projects/${project.id}/work`
                      }
                      variant="ghost"
                      aria-label={`Open ${project.title}`}
                      title={
                        project.status === ProjectStatuses.Open
                          ? "Open applicants"
                          : "Open work hub"
                      }
                      className="company-row-icon-button"
                    >
                      <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
