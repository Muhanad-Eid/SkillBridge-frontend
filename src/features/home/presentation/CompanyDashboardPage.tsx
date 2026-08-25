import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardClock,
  LoaderCircle,
  MessageSquare,
  Plus,
  UsersRound,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Button from "../../../shared/components/Button";
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
import styles from "./CompanyDashboardPage.module.scss";

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
      setIsLoading(true);
      setError("");

      try {
        const [projectData, applicationData] = await Promise.all([
          getMyCompanyProjectsAsync(),
          isCompanyVerified
            ? getCompanyApplicationsAsync()
            : Promise.resolve(null),
        ]);

        if (isMounted) {
          setProjects(projectData.items);
          setApplications(applicationData?.items ?? []);
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
  }, [isCompanyVerified]);

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
    <section className={`${styles.root} ${styles.companyDashboardRoot}`}>
      <header className={styles.top}>
        <div className={styles.topCopy}>
          <p className={styles.eyebrow}>Company workspace</p>
          <h1>Overview</h1>
          <p>Manage practical opportunities, review applicants, and keep every work outcome moving forward.</p>
        </div>
        <div>
          {isCompanyVerified ? (
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
          )}
        </div>
      </header>

      {isLoading ? (
        <section className={styles.loading} role="status">
          <LoaderCircle size={20} aria-hidden="true" /> Loading your company workspace
        </section>
      ) : error ? (
        <div className={styles.error} role="alert">{error}</div>
      ) : (
        <>
          <div className={styles.stats} aria-label="Company summary">
            <article className={`${styles.stat} ${styles.blue}`}>
              <span className={styles.statLabel}>
                <BriefcaseBusiness size={19} aria-hidden="true" />
                Active opportunities
              </span>
              <div>
                <strong>{workspace.activeProjects.length}</strong>
                <small>{projects.length} total</small>
              </div>
            </article>
            <article className={`${styles.stat} ${styles.amber}`}>
              <span className={styles.statLabel}>
                <ClipboardClock size={19} aria-hidden="true" />
                Awaiting review
              </span>
              <div>
                <strong>{workspace.pending.length}</strong>
                <small>{applications.length} applications</small>
              </div>
            </article>
            <article className={`${styles.stat} ${styles.mint}`}>
              <span className={styles.statLabel}>
                <UsersRound size={19} aria-hidden="true" />
                Accepted workers
              </span>
              <div>
                <strong>{workspace.accepted.length}</strong>
                <small>{workspace.conversion}% acceptance rate</small>
              </div>
            </article>
            <article className={`${styles.stat} ${styles.slate}`}>
              <span className={styles.statLabel}>
                <CheckCircle2 size={19} aria-hidden="true" />
                Completed
              </span>
              <div>
                <strong>{workspace.completedProjects}</strong>
                <small>opportunities</small>
              </div>
            </article>
          </div>

          <div className={styles.workspaceGrid}>
            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <div className={styles.panelHeading}>
                  <h2>Pending applications</h2>
                  <p>Review the people waiting for a decision.</p>
                </div>
                <Button to="/company/applications?status=0" variant="secondary">
                  View applications
                </Button>
              </header>

              {workspace.pending.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}><CheckCircle2 size={21} aria-hidden="true" /></span>
                  <strong>No applications waiting</strong>
                  <span>New applicants will appear here.</span>
                </div>
              ) : (
                <div className={styles.applicationList}>
                  {workspace.pending.slice(0, 5).map((application) => (
                    <article className={styles.application} key={application.id}>
                      <span className={styles.avatar} aria-hidden="true">
                        {application.jobSeekerName.charAt(0).toUpperCase()}
                      </span>
                      <div className={styles.applicationCopy}>
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
                        className={styles.rowAction}
                      >
                        <ArrowRight size={18} aria-hidden="true" />
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className={styles.actionPanel}>
              <header className={styles.panelHeader}>
                <div className={styles.panelHeading}>
                  <h2>Quick actions</h2>
                  <p>Keep the work moving.</p>
                </div>
              </header>
              <div className={styles.actionList}>
              {isCompanyVerified ? (
                <Button
                  to="/company/projects?create=1"
                  variant="secondary"
                  className={styles.action}
                >
                  <span className={styles.actionIcon}><Plus size={18} aria-hidden="true" /></span>
                  <span className={styles.actionCopy}>
                    <strong>Create opportunity</strong>
                    <small>Publish a new listing</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.action}
                  disabled
                  title="Company verification is required"
                >
                  <span className={styles.actionIcon}><Plus size={18} aria-hidden="true" /></span>
                  <span className={styles.actionCopy}>
                    <strong>Create opportunity</strong>
                    <small>Verification required</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Button>
              )}
              <Button
                to="/company/applications"
                variant="secondary"
                className={styles.action}
              >
                <span className={styles.actionIcon}><UsersRound size={18} aria-hidden="true" /></span>
                <span className={styles.actionCopy}>
                  <strong>Review applicants</strong>
                  <small>{workspace.pending.length} waiting</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button
                to="/company/messages"
                variant="secondary"
                className={styles.action}
              >
                <span className={styles.actionIcon}><MessageSquare size={18} aria-hidden="true" /></span>
                <span className={styles.actionCopy}>
                  <strong>Open messages</strong>
                  <small>Continue candidate conversations</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              </div>
            </aside>
          </div>

          <section className={styles.opportunities}>
            <header className={styles.panelHeader}>
              <div className={styles.panelHeading}>
                <h2>Opportunities</h2>
                <p>Current provider-managed opportunity records.</p>
              </div>
              <Button to="/company/projects" variant="secondary">
                View all
              </Button>
            </header>

            {projects.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}><BriefcaseBusiness size={21} aria-hidden="true" /></span>
                <strong>No opportunities yet</strong>
                <span>Create your first listing after company verification.</span>
              </div>
            ) : (
              <div className={styles.opportunityTable}>
                <div className={styles.tableHead} aria-hidden="true">
                  <span>Opportunity</span>
                  <span>Status</span>
                  <span>Applications</span>
                  <span>Duration</span>
                  <span />
                </div>
                {projects.slice(0, 5).map((project) => (
                  <article className={styles.opportunityRow} key={project.id}>
                    <div className={styles.opportunityTitle}>
                      <strong>{project.title}</strong>
                      <span>Project #{project.id}</span>
                    </div>
                    <StatusBadge tone={getStatusTone(project)}>
                      {getProjectDisplayStatusLabel(project)}
                    </StatusBadge>
                    <strong className={styles.opportunityCount}>{project.applicationsCount}</strong>
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
                      className={styles.rowAction}
                    >
                      <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
