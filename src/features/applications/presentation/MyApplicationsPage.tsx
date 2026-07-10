import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
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

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Rejected) return "red";
  if (status === ApplicationStatuses.Withdrawn) return "neutral";
  return "amber";
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadApplications() {
    setIsLoading(true);
    setError("");

    try {
      setApplications(await getMyApplicationsAsync());
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
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const value = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "All" || application.status === Number(statusFilter);
      const matchesSearch =
        !value ||
        application.projectTitle.toLowerCase().includes(value) ||
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

  async function handleWithdraw(application: Application) {
    const confirmed = window.confirm(
      `Withdraw your application for "${application.projectTitle}"?`,
    );

    if (!confirmed) {
      return;
    }

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
    }
  }

  return (
    <section className="page jobseeker-applications-page">
      <PageHeader
        eyebrow="Job seeker"
        title="My applications"
        description="Track decisions, filter your pipeline, and withdraw pending applications."
        actions={
          <Button to="/job-seeker/opportunities" variant="primary">
            Browse opportunities
          </Button>
        }
      />

      <div className="portal-list-stats jobseeker-list-stats">
        <article>
          <span>Total</span>
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

      <div className="toolbar">
        <input
          aria-label="Search applications"
          placeholder="Search by project or cover letter"
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

      {message ? <div className="notice">{message}</div> : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredApplications.length === 0}
        emptyTitle="No applications yet"
        emptyDescription="Browse opportunities and apply when you find a good match."
      />

      <div className="card-grid">
        {filteredApplications.map((application) => (
          <Card
            key={application.id}
            title={application.projectTitle}
            description={application.coverLetter ?? "No cover letter"}
            actions={
              <StatusBadge tone={getApplicationTone(application.status)}>
                {getApplicationStatusLabel(application.status)}
              </StatusBadge>
            }
          >
            <div className="detail-list compact-detail-list">
              <span>Application ID</span>
              <strong>{application.id}</strong>
              <span>Project ID</span>
              <strong>{application.projectId}</strong>
            </div>

            <div className="actions-row">
              <Button
                to={`/job-seeker/opportunities/${application.projectId}`}
                variant="secondary"
              >
                View opportunity
              </Button>

              {application.status === ApplicationStatuses.Pending ? (
                <Button
                  variant="secondary"
                  onClick={() => handleWithdraw(application)}
                >
                  Withdraw
                </Button>
              ) : null}

              {application.status === ApplicationStatuses.Accepted ? (
                <Button to="/job-seeker/portfolio" variant="primary">
                  Add proof
                </Button>
              ) : null}
            </div>

            {application.status === ApplicationStatuses.Accepted ? (
              <p>
                This application was accepted. Add portfolio proof when the work
                is ready.
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
