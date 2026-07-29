import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
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
} from "../infrastructure/adminApi";

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Rejected) return "red";
  if (status === ApplicationStatuses.Withdrawn) return "neutral";
  return "amber";
}

export default function AdminApplicationsPage() {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") === "pending"
      ? String(ApplicationStatuses.Pending)
      : "All",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    setIsLoading(true);
    setError("");

    try {
      setApplications(await getAdminApplicationsAsync());
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
    const confirmed = window.confirm(
      `Delete ${application.jobSeekerName}'s application for "${application.projectTitle}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteApplicationAsync(application.id);
      await loadApplications();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete application.",
      );
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        title="Applications"
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
    </section>
  );
}
