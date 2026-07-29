import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  CircleDollarSign,
  Columns3,
  Clock3,
  Eye,
  Play,
  RotateCcw,
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
  getProjectDisplayStatusLabel,
  getFreelancePricingLabel,
  getProjectStatusLabel,
  isApplicationDeadlinePassed,
  OpportunityTypes,
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
  getApplicationStatusLabelForOpportunity,
  type Application,
  type ApplicationStatus,
} from "../domain/applicationTypes";
import {
  getProjectApplicationsAsync,
  updateApplicationShortlistAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";
import ApplicationDecisionDialog from "./ApplicationDecisionDialog";

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

function getProjectTone(
  project: Pick<Project, "status" | "applicationDeadline">,
) {
  if (
    project.status === ProjectStatuses.Open &&
    isApplicationDeadlinePassed(project.applicationDeadline)
  ) {
    return "amber";
  }
  if (project.status === ProjectStatuses.Open) return "green";
  if (project.status === ProjectStatuses.InProgress) return "blue";
  if (project.status === ProjectStatuses.Cancelled) return "red";
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
  const [proposalSort, setProposalSort] = useState<
    "Newest" | "Shortlisted" | "LowestPrice" | "FastestDelivery"
  >("Newest");
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const [comparedApplicationIds, setComparedApplicationIds] = useState<
    number[]
  >([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<number | null>(null);
  const [isProjectUpdating, setIsProjectUpdating] = useState(false);
  const [decision, setDecision] = useState<{
    application: Application;
    status:
      | typeof ApplicationStatuses.Accepted
      | typeof ApplicationStatuses.Rejected;
  } | null>(null);
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
    const filtered = applications.filter((application) => {
      const matchesTab = activeTab === "All" || application.status === activeTab;
      const matchesShortlist =
        project?.type !== OpportunityTypes.FreelanceTask ||
        !showShortlistedOnly ||
        application.isShortlisted;
      const matchesSearch =
        !value ||
        application.jobSeekerName.toLowerCase().includes(value) ||
        application.coverLetter?.toLowerCase().includes(value) ||
        application.shortTaskResponse?.toLowerCase().includes(value);
      return matchesTab && matchesShortlist && matchesSearch;
    });

    if (project?.type !== OpportunityTypes.FreelanceTask) {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      if (proposalSort === "Shortlisted") {
        return Number(right.isShortlisted) - Number(left.isShortlisted);
      }

      if (proposalSort === "LowestPrice") {
        return (
          (left.proposedBudget ?? Number.POSITIVE_INFINITY) -
          (right.proposedBudget ?? Number.POSITIVE_INFINITY)
        );
      }

      if (proposalSort === "FastestDelivery") {
        return (
          (left.proposedDeliveryDays ?? Number.POSITIVE_INFINITY) -
          (right.proposedDeliveryDays ?? Number.POSITIVE_INFINITY)
        );
      }

      return Date.parse(right.submittedAt) - Date.parse(left.submittedAt);
    });
  }, [
    activeTab,
    applications,
    project?.type,
    proposalSort,
    search,
    showShortlistedOnly,
  ]);

  const comparedApplications = useMemo(
    () =>
      comparedApplicationIds
        .map((applicationId) =>
          applications.find((application) => application.id === applicationId),
        )
        .filter((application): application is Application =>
          Boolean(application),
        ),
    [applications, comparedApplicationIds],
  );

  const shortlistedCount = applications.filter(
    (application) => application.isShortlisted,
  ).length;

  async function openApplicantProfile(application: Application) {
    setSelectedApplication(application);
    setSelectedProfile(null);
    setProfileError("");

    if (application.isIdentityHidden || application.jobSeekerId === null) {
      setIsProfileLoading(false);
      return;
    }

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

  async function toggleShortlist(application: Application) {
    setBusyApplicationId(application.id);
    setError("");
    setMessage("");

    try {
      const isShortlisted = !application.isShortlisted;
      await updateApplicationShortlistAsync(application.id, {
        isShortlisted,
      });
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, isShortlisted }
            : item,
        ),
      );
      setSelectedApplication((current) =>
        current?.id === application.id
          ? { ...current, isShortlisted }
          : current,
      );
      setMessage(
        isShortlisted
          ? "Proposal added to the shortlist."
          : "Proposal removed from the shortlist.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the shortlist.",
      );
    } finally {
      setBusyApplicationId(null);
    }
  }

  function toggleProposalComparison(applicationId: number) {
    setError("");
    const isAlreadySelected =
      comparedApplicationIds.includes(applicationId);

    if (!isAlreadySelected && comparedApplicationIds.length >= 3) {
      setError("Compare up to three proposals at a time.");
      return;
    }

    setComparedApplicationIds((current) =>
      isAlreadySelected
        ? current.filter((item) => item !== applicationId)
        : [...current, applicationId],
    );
  }

  async function changeStatus(
    application: Application,
    status: typeof ApplicationStatuses.Accepted | typeof ApplicationStatuses.Rejected,
    decisionNote?: string,
  ) {
    setBusyApplicationId(application.id);
    setError("");
    setMessage("");

    try {
      await updateApplicationStatusAsync(application.id, {
        status,
        decisionNote,
      });
      setSelectedApplication((current) =>
        current?.id === application.id
          ? { ...current, status, isShortlisted: false }
          : current,
      );
      setComparedApplicationIds((current) =>
        current.filter((item) => item !== application.id),
      );
      setMessage(
        project?.type === OpportunityTypes.FreelanceTask
          ? `${application.jobSeekerName}'s proposal was ${
              status === ApplicationStatuses.Accepted ? "accepted" : "declined"
            }.`
          : `${application.jobSeekerName} was ${
              status === ApplicationStatuses.Accepted ? "accepted" : "rejected"
            }.`,
      );
      await loadWorkspace();
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
    if (!reviewingApplication || reviewingApplication.jobSeekerId === null) {
      setError("The participant identity is unavailable.");
      return;
    }

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
        title={project?.title ?? "Opportunity team"}
        actions={
          project ? (
            <div className="company-project-header-actions">
              <StatusBadge tone={getProjectTone(project)}>
                {getProjectDisplayStatusLabel(project)}
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
          {project.type === OpportunityTypes.FreelanceTask ? (
            <section className="company-freelance-brief">
              <div>
                <span>Freelance brief</span>
                <strong>{getFreelancePricingLabel(project.freelancePricingType)}</strong>
              </div>
              <div>
                <CircleDollarSign size={18} aria-hidden="true" />
                <span>Client budget</span>
                <strong>
                  {project.budget ? `$${project.budget}` : "Not set"}
                </strong>
              </div>
              <div>
                <Clock3 size={18} aria-hidden="true" />
                <span>Target delivery</span>
                <strong>
                  {project.freelanceDeliveryDays ?? project.durationWeeks * 7} days
                </strong>
              </div>
              <div>
                <RotateCcw size={18} aria-hidden="true" />
                <span>Included revisions</span>
                <strong>{project.includedRevisions ?? 1}</strong>
              </div>
            </section>
          ) : null}

          <div className="company-team-summary">
            <article>
              <span>
                {project.type === OpportunityTypes.FreelanceTask
                  ? "Total proposals"
                  : "Total applications"}
              </span>
              <strong>{counts.All}</strong>
            </article>
            <article>
              <span>Awaiting decision</span>
              <strong>{counts[ApplicationStatuses.Pending]}</strong>
            </article>
            <article>
              <span>
                {project.type === OpportunityTypes.FreelanceTask
                  ? "Accepted freelancers"
                  : "Accepted workers"}
              </span>
              <strong>{counts[ApplicationStatuses.Accepted]}</strong>
            </article>
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
                <span>
                  {project.type === OpportunityTypes.FreelanceTask &&
                  tab.value === ApplicationStatuses.Pending
                    ? "Proposals"
                    : project.type === OpportunityTypes.FreelanceTask &&
                        tab.value === ApplicationStatuses.Accepted
                      ? "Freelancers"
                      : tab.label}
                </span>
                <strong>{counts[tab.value]}</strong>
              </button>
            ))}
          </div>

          <div className="company-team-controls">
            <label className="company-search-field company-team-search">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label={
                  project.type === OpportunityTypes.FreelanceTask
                    ? "Search this task's proposals"
                    : "Search this opportunity's applicants"
                }
                placeholder={
                  project.type === OpportunityTypes.FreelanceTask
                    ? "Search proposals"
                    : "Search applicants"
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {project.type === OpportunityTypes.FreelanceTask ? (
              <div className="company-proposal-controls">
                <button
                  type="button"
                  className={showShortlistedOnly ? "active" : ""}
                  aria-pressed={showShortlistedOnly}
                  onClick={() => setShowShortlistedOnly((current) => !current)}
                >
                  <BookmarkCheck size={17} aria-hidden="true" />
                  Shortlisted
                  <strong>{shortlistedCount}</strong>
                </button>
                <label className="company-proposal-sort">
                  <ArrowDownUp size={17} aria-hidden="true" />
                  <select
                    aria-label="Sort proposals"
                    value={proposalSort}
                    onChange={(event) =>
                      setProposalSort(
                        event.target.value as
                          | "Newest"
                          | "Shortlisted"
                          | "LowestPrice"
                          | "FastestDelivery",
                      )
                    }
                  >
                    <option value="Newest">Newest first</option>
                    <option value="Shortlisted">Shortlisted first</option>
                    <option value="LowestPrice">Lowest price</option>
                    <option value="FastestDelivery">Fastest delivery</option>
                  </select>
                </label>
              </div>
            ) : null}
          </div>

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
                  <article
                    className={[
                      application.opportunityType ===
                      OpportunityTypes.FreelanceTask
                        ? "company-freelance-proposal-row"
                        : "",
                      application.isShortlisted ? "is-shortlisted" : "",
                      comparedApplicationIds.includes(application.id)
                        ? "is-compared"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={application.id}
                  >
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
                        <small>
                          {application.isIdentityHidden
                            ? "Identity hidden for first review"
                            : `Application #${application.id}`}
                        </small>
                      </span>
                    </button>
                    <p>
                      {application.coverLetter ??
                        application.shortTaskResponse ??
                        "Work sample provided in the application."}
                    </p>
                    {application.opportunityType ===
                    OpportunityTypes.FreelanceTask ? (
                      <div className="freelance-proposal-inline">
                        <span>
                          <CircleDollarSign size={15} aria-hidden="true" />
                          <small>Proposal</small>
                          <strong>
                            {getFreelancePricingLabel(
                              application.freelancePricingType,
                            )}
                            {" - "}
                            {application.proposedBudget
                              ? `$${application.proposedBudget}`
                              : "Not set"}
                          </strong>
                        </span>
                        <span>
                          <Clock3 size={15} aria-hidden="true" />
                          <small>Delivery</small>
                          <strong>{application.proposedDeliveryDays} days</strong>
                        </span>
                      </div>
                    ) : null}
                    <div className="company-proposal-statuses">
                      {application.isShortlisted ? (
                        <StatusBadge tone="blue">Shortlisted</StatusBadge>
                      ) : null}
                      <StatusBadge tone={getApplicationTone(application.status)}>
                        {getApplicationStatusLabelForOpportunity(
                          application.status,
                          application.opportunityType,
                        )}
                      </StatusBadge>
                    </div>
                    <div className="company-team-actions">
                      {isPending ? (
                        project.type === OpportunityTypes.FreelanceTask ? (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              className="company-icon-action"
                              aria-label={
                                application.isShortlisted
                                  ? `Remove ${application.jobSeekerName} from shortlist`
                                  : `Shortlist ${application.jobSeekerName}`
                              }
                              title={
                                application.isShortlisted
                                  ? "Remove from shortlist"
                                  : "Add to shortlist"
                              }
                              disabled={busyApplicationId === application.id}
                              onClick={() => toggleShortlist(application)}
                            >
                              {application.isShortlisted ? (
                                <BookmarkCheck size={17} aria-hidden="true" />
                              ) : (
                                <Bookmark size={17} aria-hidden="true" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="company-icon-action"
                              aria-label={`${
                                comparedApplicationIds.includes(application.id)
                                  ? "Remove"
                                  : "Add"
                              } ${application.jobSeekerName} ${
                                comparedApplicationIds.includes(application.id)
                                  ? "from"
                                  : "to"
                              } comparison`}
                              title={
                                comparedApplicationIds.includes(application.id)
                                  ? "Remove from comparison"
                                  : "Compare proposal"
                              }
                              onClick={() =>
                                toggleProposalComparison(application.id)
                              }
                            >
                              <Columns3 size={17} aria-hidden="true" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              className="company-accept-button"
                              aria-label={`Accept ${application.jobSeekerName}`}
                              title="Accept applicant"
                              disabled={busyApplicationId === application.id}
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
                              aria-label={`Reject ${application.jobSeekerName}`}
                              title="Reject applicant"
                              disabled={busyApplicationId === application.id}
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
                        )
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
                        variant={
                          project.type === OpportunityTypes.FreelanceTask
                            ? "secondary"
                            : "ghost"
                        }
                        className={
                          project.type === OpportunityTypes.FreelanceTask
                            ? "button-with-icon company-view-proposal"
                            : "company-icon-action"
                        }
                        aria-label={`View ${
                          project.type === OpportunityTypes.FreelanceTask
                            ? "proposal from"
                            : ""
                        } ${application.jobSeekerName}`}
                        title={
                          project.type === OpportunityTypes.FreelanceTask
                            ? "View proposal"
                            : "View profile"
                        }
                        onClick={() => openApplicantProfile(application)}
                      >
                        {project.type === OpportunityTypes.FreelanceTask ? (
                          <>
                            <Eye size={17} aria-hidden="true" />
                            View proposal
                          </>
                        ) : (
                          <UserRoundSearch size={18} aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {project.type === OpportunityTypes.FreelanceTask &&
          comparedApplications.length > 0 ? (
            <div className="company-proposal-compare-tray">
              <div>
                <Columns3 size={18} aria-hidden="true" />
                <span>
                  <strong>{comparedApplications.length}</strong> selected
                </span>
                <small>Select two or three proposals to compare.</small>
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setComparedApplicationIds([])}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  className="button-with-icon"
                  disabled={comparedApplications.length < 2}
                  onClick={() => setIsCompareOpen(true)}
                >
                  <Columns3 size={17} aria-hidden="true" />
                  Compare proposals
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {isCompareOpen && comparedApplications.length > 1 ? (
        <div className="company-drawer-backdrop" role="presentation">
          <section
            className="company-proposal-compare-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="proposal-compare-title"
          >
            <header>
              <div>
                <span>Freelance proposals</span>
                <h2 id="proposal-compare-title">Compare terms and evidence</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="company-icon-action"
                aria-label="Close proposal comparison"
                title="Close"
                onClick={() => setIsCompareOpen(false)}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </header>
            <div className="company-proposal-compare-table">
              <table>
                <thead>
                  <tr>
                    <th>Proposal</th>
                    <th>Price</th>
                    <th>Delivery</th>
                    <th>Evidence</th>
                    <th>Approach</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {comparedApplications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <strong>{application.jobSeekerName}</strong>
                        <small>
                          {application.isShortlisted
                            ? "Shortlisted"
                            : `Proposal #${application.id}`}
                        </small>
                      </td>
                      <td>
                        <strong>
                          {application.proposedBudget
                            ? `$${application.proposedBudget}`
                            : "Not set"}
                        </strong>
                        <small>
                          {getFreelancePricingLabel(
                            application.freelancePricingType,
                          )}
                        </small>
                      </td>
                      <td>
                        <strong>
                          {application.proposedDeliveryDays ?? "-"} days
                        </strong>
                      </td>
                      <td>
                        <span>
                          {application.workSampleUrl
                            ? "Work sample"
                            : "Task response"}
                        </span>
                        {application.hasCv ? <small>CV attached</small> : null}
                      </td>
                      <td>
                        <p>
                          {application.coverLetter ??
                            "No proposal approach provided."}
                        </p>
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="secondary"
                          className="company-icon-action"
                          aria-label={`Open proposal from ${application.jobSeekerName}`}
                          title="Open proposal"
                          onClick={() => {
                            setIsCompareOpen(false);
                            void openApplicantProfile(application);
                          }}
                        >
                          <Eye size={17} aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer>
              <small>
                Price is one factor. Review the approach and relevant evidence
                before accepting a proposal.
              </small>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCompareOpen(false)}
              >
                Close
              </Button>
            </footer>
          </section>
        </div>
      ) : null}

      {decision ? (
        <ApplicationDecisionDialog
          application={decision.application}
          includedRevisions={project?.includedRevisions}
          isLoading={busyApplicationId === decision.application.id}
          status={decision.status}
          onCancel={() => setDecision(null)}
          onConfirm={(decisionNote) =>
            changeStatus(
              decision.application,
              decision.status,
              decisionNote,
            )
          }
        />
      ) : null}

      {selectedApplication ? (
        <ApplicantProfilePanel
          application={selectedApplication}
          includedRevisions={project?.includedRevisions}
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
                {project?.type === OpportunityTypes.FreelanceTask ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="button-with-icon"
                    disabled={busyApplicationId === selectedApplication.id}
                    onClick={() => toggleShortlist(selectedApplication)}
                  >
                    {selectedApplication.isShortlisted ? (
                      <BookmarkCheck size={17} aria-hidden="true" />
                    ) : (
                      <Bookmark size={17} aria-hidden="true" />
                    )}
                    {selectedApplication.isShortlisted
                      ? "Remove shortlist"
                      : "Shortlist"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="button-with-icon"
                  disabled={busyApplicationId === selectedApplication.id}
                  onClick={() => {
                    setDecision({
                      application: selectedApplication,
                      status: ApplicationStatuses.Accepted,
                    });
                    setSelectedApplication(null);
                  }}
                >
                  <Check size={17} aria-hidden="true" />
                  {project?.type === OpportunityTypes.FreelanceTask
                    ? "Accept proposal"
                    : "Accept"}
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
                    setSelectedApplication(null);
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
