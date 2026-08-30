import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AdminPortalOutletContext } from "../../../app/layouts/AdminPortalLayout";
import Button from "../../../shared/components/Button";
import { useConfirmation } from "../../../shared/components/ConfirmationContext";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type ApplicationStatus,
} from "../../applications/domain/applicationTypes";
import type { AdminApplication } from "../domain/adminTypes";
import {
  deleteApplicationAsync,
  getAdminApplicationsAsync,
  updateAdminApplicationStatusAsync,
} from "../infrastructure/adminApi";

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Rejected) return "red";
  if (status === ApplicationStatuses.Withdrawn) return "neutral";
  return "amber";
}

export default function AdminApplicationsPage() {
  const confirmAction = useConfirmation();
  const { refreshQueues } = useOutletContext<AdminPortalOutletContext>();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") === "pending"
      ? String(ApplicationStatuses.Pending)
      : "All",
  );
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<{
    application: AdminApplication;
    status:
      | typeof ApplicationStatuses.Accepted
      | typeof ApplicationStatuses.Rejected;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAdminApplicationsAsync(page, pageSize, debouncedSearch);
      setApplications(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadApplications, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadApplications]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const filteredApplications = useMemo(() => {
    const value = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "All" || application.status === Number(statusFilter);
      const matchesSearch =
        !value ||
        application.projectTitle.toLowerCase().includes(value) ||
        application.companyName.toLowerCase().includes(value) ||
        application.jobSeekerName.toLowerCase().includes(value) ||
        (application.coverLetter ?? "").toLowerCase().includes(value);

      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const applicationStats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter(
        (application) => application.status === ApplicationStatuses.Pending,
      ).length,
      accepted: applications.filter(
        (application) => application.status === ApplicationStatuses.Accepted,
      ).length,
      rejected: applications.filter(
        (application) => application.status === ApplicationStatuses.Rejected,
      ).length,
    };
  }, [applications]);

  async function handleDelete(application: AdminApplication) {
    const confirmed = await confirmAction({
      title: "Delete this application?",
      description: `${application.jobSeekerName}'s application for "${application.projectTitle}" will be permanently removed.`,
      confirmLabel: "Delete application",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteApplicationAsync(application.id);
      await loadApplications();
      await refreshQueues();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete application.",
      );
    }
  }

  function openDecision(
    application: AdminApplication,
    status:
      | typeof ApplicationStatuses.Accepted
      | typeof ApplicationStatuses.Rejected,
  ) {
    setDecision({ application, status });
    setDecisionNote("");
    setError("");
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      await updateAdminApplicationStatusAsync(decision.application.id, {
        status: decision.status,
        decisionNote:
          decision.status === ApplicationStatuses.Rejected
            ? decisionNote.trim()
            : undefined,
      });
      setDecision(null);
      await loadApplications();
      await refreshQueues();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the application.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        eyebrow="Application governance"
        title="Applications"
        description="Inspect participation decisions and their downstream work and evidence state."
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search applications"
          placeholder="Search by project, company, applicant, or cover letter"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter applications by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value={ApplicationStatuses.Pending}>Pending</option>
          <option value={ApplicationStatuses.Accepted}>Accepted</option>
          <option value={ApplicationStatuses.Rejected}>Rejected</option>
          <option value={ApplicationStatuses.Withdrawn}>Withdrawn</option>
        </select>
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Total applications</span>
          <strong>{applicationStats.total}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{applicationStats.pending}</strong>
        </article>
        <article>
          <span>Accepted</span>
          <strong>{applicationStats.accepted}</strong>
        </article>
        <article>
          <span>Rejected</span>
          <strong>{applicationStats.rejected}</strong>
        </article>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredApplications.length === 0}
        emptyTitle="No applications"
        emptyDescription="Applications submitted by job seekers will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredApplications.map((application) => (
          <div className="table-row" key={application.id}>
            <div>
              <strong>{application.projectTitle}</strong>
              <span>
                {application.companyName} - {application.jobSeekerName}
              </span>
              <span>{application.coverLetter ?? "No cover letter"}</span>
            </div>
            <div className="admin-status-stack">
              <StatusBadge tone={getApplicationTone(application.status)}>
                {getApplicationStatusLabel(application.status)}
              </StatusBadge>
              <span>Application #{application.id}</span>
            </div>
            <div className="admin-row-actions">
              {application.status === ApplicationStatuses.Pending ? (
                <>
                  <Button
                    variant="secondary"
                    className="button-success"
                    title={`Accept ${application.jobSeekerName}`}
                    onClick={() =>
                      openDecision(application, ApplicationStatuses.Accepted)
                    }
                  >
                    <Check size={16} aria-hidden="true" />
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    className="button-danger"
                    title={`Reject ${application.jobSeekerName}`}
                    onClick={() =>
                      openDecision(application, ApplicationStatuses.Rejected)
                    }
                  >
                    <X size={16} aria-hidden="true" />
                    Reject
                  </Button>
                </>
              ) : null}
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => handleDelete(application)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {decision ? (
        <div className="confirm-dialog-backdrop" role="presentation">
          <form className="confirm-dialog" onSubmit={submitDecision}>
            <span className="confirm-dialog-icon" aria-hidden="true">
              {decision.status === ApplicationStatuses.Accepted ? (
                <Check size={22} />
              ) : (
                <X size={22} />
              )}
            </span>
            <h2>
              {decision.status === ApplicationStatuses.Accepted
                ? "Accept application?"
                : "Reject application?"}
            </h2>
            <p>
              {decision.status === ApplicationStatuses.Accepted
                ? `${decision.application.jobSeekerName} will be accepted for ${decision.application.projectTitle}. The accepted Evidence Contract version will be pinned.`
                : `Provide ${decision.application.jobSeekerName} with a useful reason for rejecting this application.`}
            </p>
            {decision.status === ApplicationStatuses.Rejected ? (
              <label className="field">
                <span>Decision reason</span>
                <textarea
                  autoFocus
                  required
                  minLength={10}
                  maxLength={1000}
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                />
              </label>
            ) : null}
            <footer>
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => setDecision(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={
                  decision.status === ApplicationStatuses.Rejected
                    ? "button-danger"
                    : "button-success"
                }
                isLoading={isSaving}
              >
                {decision.status === ApplicationStatuses.Accepted
                  ? "Accept application"
                  : "Reject application"}
              </Button>
            </footer>
          </form>
        </div>
      ) : null}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </section>
  );
}




