import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
} from "../domain/applicationTypes";
import {
  getProjectApplicationsAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";

export default function CompanyProjectApplicationsPage() {
  const { projectId } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    setIsLoading(true);
    try {
      setApplications(await getProjectApplicationsAsync(Number(projectId)));
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
  }, [projectId]);

  async function changeStatus(applicationId: number, status: number) {
    await updateApplicationStatusAsync(applicationId, { status });
    await loadApplications();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Company"
        title="Project applications"
        description="Review applicants and move them through the pipeline."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={applications.length === 0}
        emptyTitle="No applications yet"
        emptyDescription="Applications will appear here after job seekers apply."
      />

      <div className="stack">
        {applications.map((application) => (
          <Card
            key={application.id}
            title={application.jobSeekerName}
            description={application.projectTitle}
            actions={
              <StatusBadge>
                {getApplicationStatusLabel(application.status)}
              </StatusBadge>
            }
          >
            <p>{application.coverLetter ?? "No cover letter provided."}</p>
            <div className="actions-row">
              <Button
                variant="secondary"
                onClick={() =>
                  changeStatus(application.id, ApplicationStatuses.Accepted)
                }
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  changeStatus(application.id, ApplicationStatuses.Rejected)
                }
              >
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
