import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  getApplicationStatusLabel,
  type Application,
} from "../domain/applicationTypes";
import {
  getMyApplicationsAsync,
  withdrawApplicationAsync,
} from "../infrastructure/applicationApi";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    setIsLoading(true);
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

  async function handleWithdraw(applicationId: number) {
    await withdrawApplicationAsync(applicationId);
    await loadApplications();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Job seeker"
        title="My applications"
        description="Track every opportunity you applied to."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={applications.length === 0}
        emptyTitle="No applications yet"
        emptyDescription="Browse opportunities and apply when you find a good match."
      />

      <div className="card-grid">
        {applications.map((application) => (
          <Card
            key={application.id}
            title={application.projectTitle}
            description={application.coverLetter ?? "No cover letter"}
            actions={
              <StatusBadge>
                {getApplicationStatusLabel(application.status)}
              </StatusBadge>
            }
          >
            <Button
              variant="secondary"
              onClick={() => handleWithdraw(application.id)}
            >
              Withdraw
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
