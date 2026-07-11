import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  Play,
  Search,
  Star,
  Trash2,
  UserRoundSearch,
  UsersRound,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getPublicJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import {
  getProjectStatusLabel,
  ProjectStatuses,
  type Project,
  type ProjectStatus,
} from "../../projects/domain/projectTypes";
import {
  getMyCompanyProjectsAsync,
  updateProjectStatusAsync,
} from "../../projects/infrastructure/projectApi";
import type { Review } from "../../reviews/domain/reviewTypes";
import {
  createReviewAsync,
  deleteReviewAsync,
  getMyCompanyReviewsAsync,
} from "../../reviews/infrastructure/reviewApi";
import ApplicantProfilePanel from "./ApplicantProfilePanel";
import {
  ApplicationStatuses,
  getApplicationStatusLabel,
  type Application,
  type ApplicationStatus,
} from "../domain/applicationTypes";
import {
  getProjectApplicationsAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";

const projectTabs: Array<{ label: string; value: "All" | ApplicationStatus }> = [
  { label: "All", value: "All" },
  { label: "Applicants", value: ApplicationStatuses.Pending },
  { label: "Workers", value: ApplicationStatuses.Accepted },
  { label: "Rejected", value: ApplicationStatuses.Rejected },
  { label: "Withdrawn", value: ApplicationStatuses.Withdrawn },
];

function getApplicationTone(status: ApplicationStatus) {
  if (status === ApplicationStatuses.Accepted) return "green";
  if (status === ApplicationStatuses.Pending) return "amber";
  if (status === ApplicationStatuses.Rejected) return "red";
  return "neutral";
}

function getProjectTone(status: ProjectStatus) {
  if (status === ProjectStatuses.Open) return "green";
  if (status === ProjectStatuses.InProgress) return "blue";
  if (status === ProjectStatuses.Cancelled) return "red";
  return "neutral";
}

export default function CompanyProjectApplicationsPage() {
  const { projectId } = useParams();
  const numericProjectId = Number(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [selectedProfile, setSelectedProfile] =
    useState<JobSeekerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | ApplicationStatus>("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<number | null>(null);
  const [isProjectUpdating, setIsProjectUpdating] = useState(false);
  const [reviewingApplication, setReviewingApplication] =
    useState<Application | null>(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [message, setMessage] = useState("");

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [projectData, applicationData, reviewData] = await Promise.all([
        getMyCompanyProjectsAsync(),
        getProjectApplicationsAsync(numericProjectId),
        getMyCompanyReviewsAsync(),
      ]);
      setProject(projectData.find((item) => item.id === numericProjectId) ?? null);
      setApplications(applicationData);
      setReviews(reviewData.filter((review) => review.projectId === numericProjectId));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load opportunity team.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [numericProjectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (Number.isInteger(numericProjectId) && numericProjectId > 0) {
        loadWorkspace();
      } else {
        setError("The opportunity ID is invalid.");
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspace, numericProjectId]);

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
      const matchesTab = activeTab === "All" || application.status === activeTab;
      const matchesSearch =
        !value ||
        application.jobSeekerName.toLowerCase().includes(value) ||
        application.coverLetter?.toLowerCase().includes(value);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, applications, search]);

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

  async function changeStatus(
    application: Application,
    status: typeof ApplicationStatuses.Accepted | typeof ApplicationStatuses.Rejected,
  ) {
    setBusyApplicationId(application.id);
    setError("");
    setMessage("");

    try {
      await updateApplicationStatusAsync(application.id, { status });
      setSelectedApplication((current) =>
        current?.id === application.id ? { ...current, status } : current,
      );
      setMessage(
        `${application.jobSeekerName} was ${
          status === ApplicationStatuses.Accepted ? "accepted" : "rejected"
        }.`,
      );
      await loadWorkspace();
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

  async function updateProjectStatus(status: ProjectStatus) {
    if (!project) return;

    if (
      status === ProjectStatuses.Cancelled &&
      !window.confirm(`Cancel "${project.title}"?`)
    ) {
      return;
    }

    setIsProjectUpdating(true);
    setError("");
    setMessage("");

    try {
      await updateProjectStatusAsync(project.id, status);
      setMessage(`Opportunity moved to ${getProjectStatusLabel(status)}.`);
      await loadWorkspace();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the opportunity.",
      );
    } finally {
      setIsProjectUpdating(false);
    }
  }

  function startReview(application: Application) {
    setReviewingApplication(application);
    setReviewRating("5");
    setReviewComment("");
    setError("");
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewingApplication) return;

    setIsReviewSaving(true);
    setError("");
    setMessage("");

    try {
      await createReviewAsync({
        jobSeekerId: reviewingApplication.jobSeekerId,
        projectId: reviewingApplication.projectId,
        rating: Number(reviewRating),
        comment: reviewComment.trim() || undefined,
      });
      setMessage(`Review submitted for ${reviewingApplication.jobSeekerName}.`);
      setReviewingApplication(null);
      await loadWorkspace();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit the review.",
      );
    } finally {
      setIsReviewSaving(false);
    }
  }

  async function removeReview(review: Review) {
    if (!window.confirm(`Delete the review for ${review.jobSeekerName}?`)) return;

    setError("");
    try {
      await deleteReviewAsync(review.id);
      setMessage("Review deleted.");
      await loadWorkspace();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to delete review.",
      );
    }
  }

  return (
    <section className="page company-project-team-page">
      <Button
        to="/company/projects"
        variant="ghost"
        className="company-back-link button-with-icon"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Opportunities
      </Button>

      <PageHeader
        eyebrow={project ? `Opportunity #${project.id}` : "Opportunity"}
        title={project?.title ?? "Opportunity team"}
        description="Review applicants, manage accepted workers, and submit reviews after completed work."
        actions={
          project ? (
            <div className="company-project-header-actions">
              <StatusBadge tone={getProjectTone(project.status)}>
                {getProjectStatusLabel(project.status)}
              </StatusBadge>
              {project.status === ProjectStatuses.Open ? (
                <Button
                  type="button"
                  disabled={isProjectUpdating || counts[ApplicationStatuses.Accepted] === 0}
                  title={
                    counts[ApplicationStatuses.Accepted] === 0
                      ? "Accept at least one applicant first"
                      : "Start opportunity"
                  }
                  className="button-with-icon"
                  onClick={() => updateProjectStatus(ProjectStatuses.InProgress)}
                >
                  <Play size={16} aria-hidden="true" />
                  Start work
                </Button>
              ) : null}
              {project.status === ProjectStatuses.InProgress ? (
                <Button
                  type="button"
                  disabled={isProjectUpdating}
                  onClick={() => updateProjectStatus(ProjectStatuses.Completed)}
                >
                  Complete work
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}

      <DataState
        isLoading={isLoading}
        error=""
        empty={false}
        emptyTitle=""
        emptyDescription=""
      />

      {!isLoading && project ? (
        <>
          <div className="company-team-summary">
            <article><span>Total applications</span><strong>{counts.All}</strong></article>
            <article><span>Waiting</span><strong>{counts[ApplicationStatuses.Pending]}</strong></article>
            <article><span>Accepted workers</span><strong>{counts[ApplicationStatuses.Accepted]}</strong></article>
            <article><span>Reviews submitted</span><strong>{reviews.length}</strong></article>
          </div>

          <div className="company-pipeline-tabs" role="tablist" aria-label="Opportunity team status">
            {projectTabs.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                className={activeTab === tab.value ? "active" : ""}
                key={tab.label}
                onClick={() => setActiveTab(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{counts[tab.value]}</strong>
              </button>
            ))}
          </div>

          <label className="company-search-field company-team-search">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search this opportunity's applicants"
              placeholder="Search applicants"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          {filteredApplications.length === 0 ? (
            <div className="company-empty-panel">
              <UsersRound size={24} aria-hidden="true" />
              <strong>No people in this view</strong>
              <span>Choose another status or adjust the search.</span>
            </div>
          ) : (
            <div className="company-team-list">
              {filteredApplications.map((application) => {
                const isPending = application.status === ApplicationStatuses.Pending;
                const review = reviews.find(
                  (item) => item.jobSeekerId === application.jobSeekerId,
                );

                return (
                  <article key={application.id}>
                    <button
                      type="button"
                      className="company-candidate-name"
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
                    <p>{application.coverLetter ?? "No cover letter provided."}</p>
                    <StatusBadge tone={getApplicationTone(application.status)}>
                      {getApplicationStatusLabel(application.status)}
                    </StatusBadge>
                    <div className="company-team-actions">
                      {isPending ? (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            className="company-accept-button"
                            aria-label={`Accept ${application.jobSeekerName}`}
                            title="Accept applicant"
                            disabled={busyApplicationId === application.id}
                            onClick={() =>
                              changeStatus(application, ApplicationStatuses.Accepted)
                            }
                          >
                            <Check size={17} aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="company-reject-button"
                            aria-label={`Reject ${application.jobSeekerName}`}
                            title="Reject applicant"
                            disabled={busyApplicationId === application.id}
                            onClick={() =>
                              changeStatus(application, ApplicationStatuses.Rejected)
                            }
                          >
                            <X size={17} aria-hidden="true" />
                          </Button>
                        </>
                      ) : null}

                      {application.status === ApplicationStatuses.Accepted &&
                      project.status === ProjectStatuses.Completed ? (
                        review ? (
                          <div className="company-review-summary">
                            <span><Star size={15} /> {review.rating}/5</span>
                            <Button
                              type="button"
                              variant="ghost"
                              className="company-icon-action company-danger-icon"
                              aria-label={`Delete review for ${application.jobSeekerName}`}
                              title="Delete review"
                              onClick={() => removeReview(review)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            className="button-with-icon"
                            onClick={() => startReview(application)}
                          >
                            <Star size={16} aria-hidden="true" />
                            Review work
                          </Button>
                        )
                      ) : null}

                      <Button
                        type="button"
                        variant="ghost"
                        className="company-icon-action"
                        aria-label={`View ${application.jobSeekerName}`}
                        title="View profile"
                        onClick={() => openApplicantProfile(application)}
                      >
                        <UserRoundSearch size={18} aria-hidden="true" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : null}

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
          actions={
            selectedApplication.status === ApplicationStatuses.Pending ? (
              <>
                <Button
                  type="button"
                  className="button-with-icon"
                  disabled={busyApplicationId === selectedApplication.id}
                  onClick={() =>
                    changeStatus(selectedApplication, ApplicationStatuses.Accepted)
                  }
                >
                  <Check size={17} aria-hidden="true" />
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="button-with-icon company-reject-text-button"
                  disabled={busyApplicationId === selectedApplication.id}
                  onClick={() =>
                    changeStatus(selectedApplication, ApplicationStatuses.Rejected)
                  }
                >
                  <X size={17} aria-hidden="true" />
                  Reject
                </Button>
              </>
            ) : null
          }
        />
      ) : null}

      {reviewingApplication ? (
        <div className="company-drawer-backdrop" role="presentation">
          <section
            className="company-review-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-review-title"
          >
            <header>
              <div>
                <span>Completed work</span>
                <h2 id="company-review-title">Review {reviewingApplication.jobSeekerName}</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="company-icon-action"
                aria-label="Close review form"
                title="Close"
                onClick={() => setReviewingApplication(null)}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </header>
            <form onSubmit={submitReview}>
              <label className="field">
                <span>Rating</span>
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(event.target.value)}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Needs improvement</option>
                  <option value="1">1 - Unsatisfactory</option>
                </select>
              </label>
              <label className="field">
                <span>Review comment</span>
                <textarea
                  value={reviewComment}
                  maxLength={1500}
                  placeholder="Describe the quality, communication, and outcome of the completed work."
                  onChange={(event) => setReviewComment(event.target.value)}
                />
              </label>
              <div className="company-drawer-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReviewingApplication(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isReviewSaving}>
                  Submit review
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
