import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getPublicJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import ApplicantProfilePanel from "./ApplicantProfilePanel";
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
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [selectedProfile, setSelectedProfile] =
    useState<JobSeekerProfile | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");

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
    setSelectedApplication((current) =>
      current?.id === application.id ? { ...current, status } : current,
    );
    await loadApplications();
  }

  async function openApplicantProfile(application: Application) {
    setSelectedApplication(application);
    setSelectedProfile(null);
    setProfileError("");
    setIsProfileLoading(true);

    try {
      setSelectedProfile(
        await getPublicJobSeekerProfileAsync(application.jobSeekerId),
      );
    } catch (caughtError) {
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load applicant profile.",
      );
    } finally {
      setIsProfileLoading(false);
    }
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

      {selectedApplication ? (
        <ApplicantProfilePanel
          application={selectedApplication}
          error={profileError}
          isLoading={isProfileLoading}
          onClose={() => {
            setSelectedApplication(null);
            setSelectedProfile(null);
            setProfileError("");
          }}
          profile={selectedProfile}
        />
      ) : null}

      <div className="table-card company-pipeline-table">
        {filteredApplications.map((application) => (
          <div className="table-row" key={application.id}>
            <div>
              <button
                className="text-link-button"
                type="button"
                onClick={() => openApplicantProfile(application)}
              >
                {application.jobSeekerName}
              </button>
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
