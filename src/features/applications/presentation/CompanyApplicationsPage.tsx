import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
} from "../domain/applicationTypes";
import {
  getCompanyApplicationsAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    setIsLoading(true);
    try {
      setApplications(await getCompanyApplicationsAsync());
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

    if (!value) {
      return applications;
    }

    return applications.filter((application) => {
      return (
        application.projectTitle.toLowerCase().includes(value) ||
        application.jobSeekerName.toLowerCase().includes(value)
      );
    });
  }, [applications, search]);

  async function handleStatus(
    application: Application,
    status: typeof ApplicationStatuses.Accepted | typeof ApplicationStatuses.Rejected,
  ) {
    await updateApplicationStatusAsync(application.id, { status });
    await loadApplications();
  }

  return (
    <section className="page company-applications-page">
      <PageHeader
        eyebrow="Company"
        title="Application pipeline"
        description="Review every applicant across your company opportunities."
      />

      <div className="toolbar company-toolbar">
        <input
          aria-label="Search applications"
          placeholder="Search by project or applicant"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredApplications.length === 0}
        emptyTitle="No applications"
        emptyDescription="Applications will appear here when job seekers apply to your opportunities."
      />

      <div className="table-card company-pipeline-table">
        {filteredApplications.map((application) => (
          <div className="table-row" key={application.id}>
            <div>
              <strong>{application.jobSeekerName}</strong>
              <span>{application.projectTitle}</span>
              <span>{application.coverLetter ?? "No cover letter"}</span>
            </div>
            <StatusBadge>
              {getApplicationStatusLabel(application.status)}
            </StatusBadge>
            <div className="actions-row">
              <Button
                variant="secondary"
                onClick={() => handleStatus(application, ApplicationStatuses.Accepted)}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleStatus(application, ApplicationStatuses.Rejected)}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
