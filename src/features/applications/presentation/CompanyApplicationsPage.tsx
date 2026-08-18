import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, UserRoundSearch, X } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
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
  type ApplicationStatus,
} from "../domain/applicationTypes";
import {
  getCompanyApplicationsAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";
import ApplicationDecisionDialog from "./ApplicationDecisionDialog";

const pipelineTabs: Array<{ label: string; value: "All" | ApplicationStatus }> = [
  { label: "All", value: "All" },
  { label: "Pending", value: ApplicationStatuses.Pending },
  { label: "Accepted", value: ApplicationStatuses.Accepted },
  { label: "Rejected", value: ApplicationStatuses.Rejected },
  { label: "Withdrawn", value: ApplicationStatuses.Withdrawn },
];

type CompanyPortalContext = {
  isCompanyVerified: boolean;
};

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Pending) return "amber";
  if (status === ApplicationStatuses.Rejected) return "red";
  return "neutral";
}

export default function CompanyApplicationsPage() {
  const { isCompanyVerified } = useOutletContext<CompanyPortalContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [selectedProfile, setSelectedProfile] =
    useState<JobSeekerProfile | null>(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ApplicationStatus>(
    initialStatus !== null && Number.isInteger(Number(initialStatus))
      ? (Number(initialStatus) as ApplicationStatus)
      : "All",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<number | null>(null);
  const [decision, setDecision] = useState<{
    application: Application;
    status:
      | typeof ApplicationStatuses.Accepted
      | typeof ApplicationStatuses.Rejected;
  } | null>(null);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const profileQueryApplicationIdRef = useRef<number | null>(null);

  const loadApplications = useCallback(async () => {
    if (!isCompanyVerified) {
      setApplications([]);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

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
  }, [isCompanyVerified]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadApplications, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadApplications]);

  const projects = useMemo(() => {
    const projectMap = new Map<number, string>();
    applications.forEach((application) => {
      projectMap.set(application.projectId, application.projectTitle);
    });
    return Array.from(projectMap, ([id, title]) => ({ id, title })).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [applications]);

  const counts = useMemo(
    () => ({
      All: applications.length,
      [ApplicationStatuses.Pending]: applications.filter(
        (application) => application.status === ApplicationStatuses.Pending,
      ).length,
      [ApplicationStatuses.Accepted]: applications.filter(
        (application) => application.status === ApplicationStatuses.Accepted,
      ).length,
      [ApplicationStatuses.Rejected]: applications.filter(
        (application) => application.status === ApplicationStatuses.Rejected,
      ).length,
      [ApplicationStatuses.Withdrawn]: applications.filter(
        (application) => application.status === ApplicationStatuses.Withdrawn,
      ).length,
    }),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const value = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !value ||
        application.projectTitle.toLowerCase().includes(value) ||
        application.jobSeekerName.toLowerCase().includes(value) ||
        application.coverLetter?.toLowerCase().includes(value);
      const matchesProject =
        projectFilter === "All" || application.projectId === Number(projectFilter);
      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [applications, projectFilter, search, statusFilter]);

  const openApplicantProfile = useCallback(async (application: Application) => {
    profileQueryApplicationIdRef.current = application.id;
    setSelectedApplication(application);
    setSelectedProfile(null);
    setProfileError("");
    if (application.jobSeekerId === null) {
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("application", String(application.id));
      return next;
    }, { replace: true });

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
  }, [setSearchParams]);

  useEffect(() => {
    const applicationId = Number(searchParams.get("application"));

    const timeoutId = window.setTimeout(() => {
      if (applicationId <= 0) {
        profileQueryApplicationIdRef.current = null;
        return;
      }

      if (
        !isLoading &&
        profileQueryApplicationIdRef.current !== applicationId
      ) {
        const application = applications.find((item) => item.id === applicationId);
        if (application) {
          openApplicantProfile(application);
        }
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    applications,
    isLoading,
    openApplicantProfile,
    searchParams,
  ]);

  function closeApplicantProfile() {
    profileQueryApplicationIdRef.current = selectedApplication?.id ?? null;
    setSelectedApplication(null);
    setSelectedProfile(null);
    setProfileError("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("application");
      return next;
    }, { replace: true });
  }

  async function handleStatus(
    application: Application,
    status: typeof ApplicationStatuses.Accepted | typeof ApplicationStatuses.Rejected,
    decisionNote?: string,
  ) {
    setBusyApplicationId(application.id);
    setError("");
    setActionMessage("");

    try {
      await updateApplicationStatusAsync(application.id, {
        status,
        decisionNote,
      });
      const updatedApplication = { ...application, status };
      setSelectedApplication((current) =>
        current?.id === application.id ? updatedApplication : current,
      );
      setActionMessage(
        `${application.jobSeekerName} was ${
          status === ApplicationStatuses.Accepted ? "accepted" : "rejected"
        } for ${application.projectTitle}.`,
      );
      await loadApplications();
      setDecision(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the application.",
      );
    } finally {
      setBusyApplicationId(null);
    }
  }

  if (!isCompanyVerified) {
    return (
      <section className="page company-pipeline-page">
        <PageHeader title="Applications" />
        <DataState
          isLoading={false}
          error=""
          empty
          emptyTitle="Company verification required"
          emptyDescription="Applications will become available after an administrator verifies your company."
        />
      </section>
    );
  }

  return (
    <section className="page company-pipeline-page">
      <PageHeader
        title="Applications"
      />

      {actionMessage ? <div className="notice notice-success">{actionMessage}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="company-pipeline-tabs" role="tablist" aria-label="Application status">
        {pipelineTabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === tab.value}
            className={statusFilter === tab.value ? "active" : ""}
            key={tab.label}
            onClick={() => {
              setStatusFilter(tab.value);
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                if (tab.value === "All") next.delete("status");
                else next.set("status", String(tab.value));
                return next;
              }, { replace: true });
            }}
          >
            <span>{tab.label}</span>
            <strong>{counts[tab.value]}</strong>
          </button>
        ))}
      </div>

      <div className="company-list-toolbar company-pipeline-toolbar">
        <label className="company-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search applications"
            placeholder="Search applicants or opportunities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter by opportunity"
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
        >
          <option value="All">All opportunities</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>
      </div>

      <DataState
        isLoading={isLoading}
        error=""
        empty={!isLoading && filteredApplications.length === 0}
        emptyTitle="No applications in this view"
        emptyDescription={
          applications.length === 0
            ? "Applications will appear after job seekers apply."
            : "Adjust the status, opportunity, or search filters."
        }
      />

      {!isLoading && filteredApplications.length > 0 ? (
        <div className="company-candidate-table">
          <div className="company-candidate-table-head" aria-hidden="true">
            <span>Applicant</span>
            <span>Opportunity</span>
            <span>Cover letter</span>
            <span>Status</span>
            <span>Decision</span>
          </div>
          {filteredApplications.map((application) => {
            const isPending = application.status === ApplicationStatuses.Pending;
            const isBusy = busyApplicationId === application.id;

            return (
              <article key={application.id}>
                <button
                  className="company-candidate-name"
                  type="button"
                  onClick={() => openApplicantProfile(application)}
                >
                  <span className="company-avatar" aria-hidden="true">
                    {application.jobSeekerName.charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <strong>{application.jobSeekerName}</strong>
                    <small>Applicant #{application.jobSeekerId}</small>
                  </span>
                </button>
                <div>
                  <strong>{application.projectTitle}</strong>
                  <span>
                    Project #{application.projectId}
                    {application.acceptedEvidenceContractVersionNumber
                      ? ` · Contract v${application.acceptedEvidenceContractVersionNumber}`
                      : ""}
                  </span>
                </div>
                <p>{application.coverLetter ?? "No cover letter provided."}</p>
                <StatusBadge tone={getApplicationTone(application.status)}>
                  {getApplicationStatusLabel(application.status)}
                </StatusBadge>
                <div className="company-decision-actions">
                  {isPending ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="company-accept-button"
                        disabled={isBusy}
                        aria-label={`Accept ${application.jobSeekerName}`}
                        title="Accept applicant"
                        onClick={() =>
                          setDecision({
                            application,
                            status: ApplicationStatuses.Accepted,
                          })
                        }
                      >
                        <Check size={17} aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="company-reject-button"
                        disabled={isBusy}
                        aria-label={`Reject ${application.jobSeekerName}`}
                        title="Reject applicant"
                        onClick={() =>
                          setDecision({
                            application,
                            status: ApplicationStatuses.Rejected,
                          })
                        }
                      >
                        <X size={17} aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      to={
                        application.jobSeekerId
                          ? `/company/talent/${application.jobSeekerId}`
                          : undefined
                      }
                      type={application.jobSeekerId ? undefined : "button"}
                      variant="ghost"
                      className="company-icon-action"
                      aria-label={`View ${application.jobSeekerName}`}
                      title="View profile"
                      onClick={
                        application.jobSeekerId
                          ? undefined
                          : () => openApplicantProfile(application)
                      }
                    >
                      <UserRoundSearch size={18} aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {selectedApplication ? (
        <ApplicantProfilePanel
          application={selectedApplication}
          error={profileError}
          isLoading={isProfileLoading}
          onClose={closeApplicantProfile}
          profile={selectedProfile}
          actions={
            selectedApplication.status === ApplicationStatuses.Pending ? (
              <>
                <Button
                  type="button"
                  className="button-with-icon"
                  disabled={busyApplicationId === selectedApplication.id}
                  onClick={() => {
                    setDecision({
                      application: selectedApplication,
                      status: ApplicationStatuses.Accepted,
                    });
                    closeApplicantProfile();
                  }}
                >
                  <Check size={17} aria-hidden="true" />
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="button-with-icon company-reject-text-button"
                  disabled={busyApplicationId === selectedApplication.id}
                  onClick={() => {
                    setDecision({
                      application: selectedApplication,
                      status: ApplicationStatuses.Rejected,
                    });
                    closeApplicantProfile();
                  }}
                >
                  <X size={17} aria-hidden="true" />
                  Reject
                </Button>
              </>
            ) : null
          }
        />
      ) : null}

      {decision ? (
        <ApplicationDecisionDialog
          application={decision.application}
          isLoading={busyApplicationId === decision.application.id}
          status={decision.status}
          onCancel={() => setDecision(null)}
          onConfirm={(decisionNote) =>
            handleStatus(
              decision.application,
              decision.status,
              decisionNote,
            )
          }
        />
      ) : null}
    </section>
  );
}
