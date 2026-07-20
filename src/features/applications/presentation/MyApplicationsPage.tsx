import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileCheck2, FolderKanban, Search, XCircle } from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { Project } from "../../projects/domain/projectTypes";
import { getProjectsAsync } from "../../projects/infrastructure/projectApi";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
  type ApplicationStatus,
} from "../domain/applicationTypes";
import {
  getMyApplicationsAsync,
  withdrawApplicationAsync,
} from "../infrastructure/applicationApi";

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: String(ApplicationStatuses.Pending) },
  { label: "Accepted", value: String(ApplicationStatuses.Accepted) },
  { label: "Rejected", value: String(ApplicationStatuses.Rejected) },
  { label: "Withdrawn", value: String(ApplicationStatuses.Withdrawn) },
];

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Rejected) return "red";
  if (status === ApplicationStatuses.Withdrawn) return "neutral";
  return "amber";
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadApplications() {
    setIsLoading(true);
    setError("");

    try {
      const [applicationData, projectData] = await Promise.all([
        getMyApplicationsAsync(),
        getProjectsAsync(),
      ]);
      setApplications(applicationData);
      setProjects(projectData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadApplications, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const filteredApplications = useMemo(() => {
    const value = search.trim().toLowerCase();

    return applications.filter((application) => {
      const project = projectsById.get(application.projectId);
      const matchesStatus =
        statusFilter === "all" || application.status === Number(statusFilter);
      const matchesSearch =
        !value ||
        application.projectTitle.toLowerCase().includes(value) ||
        project?.companyName.toLowerCase().includes(value) ||
        (application.coverLetter ?? "").toLowerCase().includes(value);

      return matchesStatus && matchesSearch;
    });
  }, [applications, projectsById, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter(
        (application) => application.status === ApplicationStatuses.Pending,
      ).length,
      accepted: applications.filter(
        (application) => application.status === ApplicationStatuses.Accepted,
      ).length,
      closed: applications.filter(
        (application) =>
          application.status === ApplicationStatuses.Rejected ||
          application.status === ApplicationStatuses.Withdrawn,
      ).length,
    }),
    [applications],
  );

  async function handleWithdraw(application: Application) {
    if (!window.confirm(`Withdraw your application for "${application.projectTitle}"?`)) {
      return;
    }

    setWithdrawingId(application.id);
    setMessage("");
    setError("");

    try {
      await withdrawApplicationAsync(application.id);
      setMessage("Application withdrawn.");
      await loadApplications();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to withdraw application.",
      );
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <section className="page jobseeker-applications-page">
      <PageHeader
        eyebrow="Pipeline"
        title="Application tracker"
        description="Follow every application, review company decisions, and continue accepted work into your portfolio."
        actions={
          <Button to="/job-seeker/opportunities" variant="primary">
            <Search size={17} aria-hidden="true" />
            Find opportunities
          </Button>
        }
      />

      <div className="jobseeker-application-stats">
        <article><span>Total applications</span><strong>{stats.total}</strong></article>
        <article><span>Awaiting decision</span><strong>{stats.pending}</strong></article>
        <article><span>Accepted</span><strong>{stats.accepted}</strong></article>
        <article><span>Closed</span><strong>{stats.closed}</strong></article>
      </div>

      <div className="jobseeker-application-controls">
        <div className="jobseeker-status-tabs" role="tablist" aria-label="Application status">
          {statusTabs.map((tab) => {
            const count =
              tab.value === "all"
                ? applications.length
                : applications.filter(
                    (application) => application.status === Number(tab.value),
                  ).length;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                className={statusFilter === tab.value ? "active" : ""}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}<span>{count}</span>
              </button>
            );
          })}
        </div>
        <label className="jobseeker-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search applications"
            placeholder="Search project or company"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {message ? <div className="notice">{message}</div> : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredApplications.length === 0}
        emptyTitle="No applications in this view"
        emptyDescription="Change the filter or browse open opportunities to start a new application."
      />

      {filteredApplications.length > 0 ? (
        <div className="jobseeker-application-table">
          <div className="jobseeker-application-table-head" aria-hidden="true">
            <span>Opportunity</span>
            <span>Application</span>
            <span>Status</span>
            <span>Next action</span>
          </div>
          {filteredApplications.map((application) => {
            const project = projectsById.get(application.projectId);

            return (
              <article key={application.id}>
                <div className="jobseeker-application-project">
                  <span><FileCheck2 size={18} aria-hidden="true" /></span>
                  <div>
                    <strong>{application.projectTitle}</strong>
                    <small>{project?.companyName ?? `Project #${application.projectId}`}</small>
                  </div>
                </div>
                <div className="jobseeker-application-reference">
                  <strong>#{application.id}</strong>
                  <small>{project ? `${project.durationWeeks} weeks` : "Submitted"}</small>
                </div>
                <StatusBadge tone={getApplicationTone(application.status)}>
                  {getApplicationStatusLabel(application.status)}
                </StatusBadge>
                <div className="jobseeker-application-actions">
                  <Button
                    to={`/job-seeker/opportunities/${application.projectId}`}
                    variant="secondary"
                  >
                    View
                    <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                  {application.status === ApplicationStatuses.Pending ? (
                    <Button
                      variant="ghost"
                      title="Withdraw application"
                      aria-label={`Withdraw application for ${application.projectTitle}`}
                      isLoading={withdrawingId === application.id}
                      onClick={() => handleWithdraw(application)}
                    >
                      <XCircle size={17} aria-hidden="true" />
                    </Button>
                  ) : null}
                  {application.status === ApplicationStatuses.Accepted ? (
                    <Button
                      to={`/job-seeker/work/${application.projectId}`}
                      variant="primary"
                    >
                      <FolderKanban size={16} aria-hidden="true" />
                      Open work
                    </Button>
                  ) : null}
                </div>
                {application.coverLetter ? (
                  <details className="jobseeker-cover-letter">
                    <summary>Cover letter</summary>
                    <p>{application.coverLetter}</p>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
