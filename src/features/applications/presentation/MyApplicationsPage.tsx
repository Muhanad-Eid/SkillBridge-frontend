import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  FileDown,
  FileCheck2,
  FolderKanban,
  MessageSquareText,
  Search,
  XCircle,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import { useConfirmation } from "../../../shared/components/ConfirmationContext";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getFreelancePricingLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import { getProjectsAsync } from "../../projects/infrastructure/projectApi";
import FreelanceWorkspaceNav from "../../projects/presentation/FreelanceWorkspaceNav";
import {
  ApplicationStatuses,
  getApplicationStatusLabelForOpportunity,
  type Application,
  type ApplicationStatus,
} from "../domain/applicationTypes";
import {
  downloadApplicationCvAsync,
  getMyApplicationsAsync,
  withdrawApplicationAsync,
} from "../infrastructure/applicationApi";
import styles from "./MyApplicationsPage.module.scss";

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: String(ApplicationStatuses.Pending) },
  { label: "Accepted", value: String(ApplicationStatuses.Accepted) },
  { label: "Rejected", value: String(ApplicationStatuses.Rejected) },
  { label: "Withdrawn", value: String(ApplicationStatuses.Withdrawn) },
];
const emptyApplications: Application[] = [];
const emptyProjects = [] as const;

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Rejected) return "red";
  if (status === ApplicationStatuses.Withdrawn) return "neutral";
  return "amber";
}

type MyApplicationsPageProps = {
  mode?: "applications" | "freelance";
};

export default function MyApplicationsPage({
  mode = "applications",
}: MyApplicationsPageProps) {
  const confirmAction = useConfirmation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingCvId, setDownloadingCvId] = useState<number | null>(null);
  const [cvError, setCvError] = useState("");
  const [message, setMessage] = useState("");
  const isFreelanceView = mode === "freelance";

  const applicationsQuery = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: ({ signal }) => getMyApplicationsAsync(1, 50, { signal }),
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", "public", "all"],
    queryFn: ({ signal }) => getProjectsAsync({ pageSize: 50 }, { signal }),
  });
  const withdrawMutation = useMutation({
    mutationFn: withdrawApplicationAsync,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
    },
  });
  const applications = applicationsQuery.data?.items ?? emptyApplications;
  const projects = projectsQuery.data?.items ?? emptyProjects;
  const isLoading = applicationsQuery.isPending || projectsQuery.isPending;
  const queryError =
    applicationsQuery.error ?? projectsQuery.error ?? withdrawMutation.error;
  const error =
    queryError instanceof Error ? queryError.message : queryError ? "Unable to load applications." : "";

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const scopedApplications = useMemo(
    () =>
      applications.filter((application) =>
        isFreelanceView
          ? application.opportunityType === OpportunityTypes.FreelanceTask
          : application.opportunityType !== OpportunityTypes.FreelanceTask,
      ),
    [applications, isFreelanceView],
  );

  const filteredApplications = useMemo(() => {
    const value = search.trim().toLowerCase();

    return scopedApplications.filter((application) => {
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
  }, [projectsById, scopedApplications, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: scopedApplications.length,
      pending: scopedApplications.filter(
        (application) => application.status === ApplicationStatuses.Pending,
      ).length,
      accepted: scopedApplications.filter(
        (application) => application.status === ApplicationStatuses.Accepted,
      ).length,
      closed: scopedApplications.filter(
        (application) =>
          application.status === ApplicationStatuses.Rejected ||
          application.status === ApplicationStatuses.Withdrawn,
      ).length,
    }),
    [scopedApplications],
  );
  const activeApplication = scopedApplications.find(
    (application) => application.status === ApplicationStatuses.Accepted,
  );

  async function handleWithdraw(application: Application) {
    const submissionLabel = isFreelanceView ? "proposal" : "application";
    if (!(await confirmAction({
      title: `Withdraw this ${submissionLabel}?`,
      description: `Your ${submissionLabel} for "${application.projectTitle}" will leave the provider's active review queue.`,
      confirmLabel: `Withdraw ${submissionLabel}`,
      variant: "warning",
    }))) {
      return;
    }

    setMessage("");
    withdrawMutation.reset();

    try {
      await withdrawMutation.mutateAsync(application.id);
      setMessage(isFreelanceView ? "Proposal withdrawn." : "Application withdrawn.");
    } catch {
      // The mutation error is rendered through the shared page state.
    }
  }

  async function handleDownloadCv(application: Application) {
    setDownloadingCvId(application.id);
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
      setDownloadingCvId(null);
    }
  }

  return (
    <section
      className={`page jobseeker-applications-page ${
        isFreelanceView ? "freelance-proposals-page" : ""
      } ${styles.root}`}
    >
      <PageHeader
        eyebrow={isFreelanceView ? "Proposal pipeline" : "Opportunity pipeline"}
        title={isFreelanceView ? "Freelance proposals" : "Applications"}
        description={
          isFreelanceView
            ? "Track every proposal from provider review through contract handoff."
            : "Follow each application from decision through accepted work and evidence."
        }
        actions={
          <Button
            to={
              isFreelanceView
                ? "/job-seeker/freelance"
                : "/job-seeker/opportunities"
            }
            variant="primary"
          >
            <Search size={17} aria-hidden="true" />
            {isFreelanceView ? "Find industry micro-tasks" : "Find opportunities"}
          </Button>
        }
      />

      {isFreelanceView ? (
        <FreelanceWorkspaceNav />
      ) : null}

      <div className="jobseeker-application-stats">
        <article>
          <span>{isFreelanceView ? "Total proposals" : "Total applications"}</span>
          <strong>{stats.total}</strong>
        </article>
        <article><span>Awaiting decision</span><strong>{stats.pending}</strong></article>
        <article>
          <span>{isFreelanceView ? "Hired" : "Accepted"}</span>
          <strong>{stats.accepted}</strong>
        </article>
        <article><span>Rejected / withdrawn</span><strong>{stats.closed}</strong></article>
      </div>

      {activeApplication ? (
        <section className={styles.activeHandoff} aria-label="Active work handoff">
          <span className={styles.activeHandoffIcon}><FolderKanban size={20} aria-hidden="true" /></span>
          <div>
            <span>Accepted record</span>
            <h2>{activeApplication.projectTitle}</h2>
            <p>
              Your application is accepted. Continue in the Work Hub to manage delivery, evidence, and approval.
            </p>
          </div>
          <StatusBadge tone="green">Active work</StatusBadge>
          <Button to={`/job-seeker/work/${activeApplication.projectId}`} variant="primary">
            Open Work Hub
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </section>
      ) : null}

      <div className="jobseeker-application-controls">
        <div
          className="jobseeker-status-tabs"
          role="tablist"
          aria-label={isFreelanceView ? "Proposal status" : "Application status"}
        >
          {statusTabs.map((tab) => {
            const count =
              tab.value === "all"
                ? scopedApplications.length
                : scopedApplications.filter(
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
                {isFreelanceView && tab.label === "Accepted"
                  ? "Hired"
                  : tab.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
        <label className="jobseeker-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={isFreelanceView ? "Search proposals" : "Search applications"}
            placeholder={
              isFreelanceView ? "Search task or client" : "Search project or company"
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {message ? <div className="notice">{message}</div> : null}
      {cvError ? <div className="notice notice-error">{cvError}</div> : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredApplications.length === 0}
        emptyTitle={
          isFreelanceView ? "No proposals in this view" : "No applications in this view"
        }
        emptyDescription={
          isFreelanceView
            ? "Change the filter or browse open industry micro-tasks to send a proposal."
            : "Change the filter or browse open opportunities to start a new application."
        }
      />

      {filteredApplications.length > 0 ? (
        <div className="jobseeker-application-table">
          <div className="jobseeker-application-table-head" aria-hidden="true">
            <span>{isFreelanceView ? "Industry micro-task" : "Opportunity"}</span>
            <span>{isFreelanceView ? "Proposal" : "Application"}</span>
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
                  <small>
                    {application.acceptedEvidenceContractVersionNumber
                      ? `Evidence Contract v${application.acceptedEvidenceContractVersionNumber}`
                      : project
                      ? application.opportunityType ===
                        OpportunityTypes.FreelanceTask
                        ? `${project.freelanceDeliveryDays ?? project.durationWeeks * 7} day target`
                        : `${project.durationWeeks} weeks`
                      : "Submitted"}
                  </small>
                </div>
                <StatusBadge tone={getApplicationTone(application.status)}>
                  {getApplicationStatusLabelForOpportunity(
                    application.status,
                    application.opportunityType,
                  )}
                </StatusBadge>
                <div className="jobseeker-application-actions">
                  <Button
                    to={
                      application.opportunityType ===
                      OpportunityTypes.FreelanceTask
                        ? `/job-seeker/freelance/${application.projectId}`
                        : `/job-seeker/opportunities/${application.projectId}`
                    }
                    variant="secondary"
                  >
                    {application.opportunityType ===
                    OpportunityTypes.FreelanceTask
                      ? "View task"
                      : "View"}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                  {application.hasCv && application.canViewCv ? (
                    <Button
                      type="button"
                      variant="ghost"
                      title={application.cvFileName ?? "Download CV"}
                      aria-label={`Download CV for ${application.projectTitle}`}
                      isLoading={downloadingCvId === application.id}
                      onClick={() => handleDownloadCv(application)}
                    >
                      <FileDown size={17} aria-hidden="true" />
                    </Button>
                  ) : null}
                  {application.status === ApplicationStatuses.Pending ? (
                    <Button
                      variant="ghost"
                      title={
                        application.opportunityType ===
                        OpportunityTypes.FreelanceTask
                          ? "Withdraw proposal"
                          : "Withdraw application"
                      }
                      aria-label={`Withdraw ${
                        application.opportunityType ===
                        OpportunityTypes.FreelanceTask
                          ? "proposal"
                          : "application"
                      } for ${application.projectTitle}`}
                      isLoading={
                        withdrawMutation.isPending &&
                        withdrawMutation.variables === application.id
                      }
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
                    <summary>
                      {application.opportunityType ===
                      OpportunityTypes.FreelanceTask
                        ? "Proposal message"
                        : "Cover letter"}
                    </summary>
                    <p>{application.coverLetter}</p>
                  </details>
                ) : null}
                {application.decisionNote ? (
                  <div className="jobseeker-application-decision-note">
                    <MessageSquareText size={18} aria-hidden="true" />
                    <div>
                      <strong>Provider feedback</strong>
                      <p>{application.decisionNote}</p>
                      {application.decidedAt ? (
                        <small>
                          Decision recorded{" "}
                          {new Date(application.decidedAt).toLocaleDateString()}
                        </small>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {application.opportunityType ===
                OpportunityTypes.FreelanceTask ? (
                  <div className="freelance-proposal-inline freelance-proposal-inline-self">
                    <span>
                      <CircleDollarSign size={15} aria-hidden="true" />
                      <small>Your proposal</small>
                      <strong>
                        {application.proposedBudget
                          ? `$${application.proposedBudget}`
                          : "Not set"}{" "}
                        ·{" "}
                        {getFreelancePricingLabel(
                          application.freelancePricingType,
                        ).toLowerCase()}
                      </strong>
                    </span>
                    <span>
                      <Clock3 size={15} aria-hidden="true" />
                      <small>Delivery</small>
                      <strong>{application.proposedDeliveryDays} days</strong>
                    </span>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
