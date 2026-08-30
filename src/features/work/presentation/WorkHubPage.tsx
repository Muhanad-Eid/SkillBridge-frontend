import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  MapPin,
  MessageSquare,
  Play,
  Star,
  Upload,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import { useConfirmation } from "../../../shared/components/ConfirmationContext";
import DataState from "../../../shared/components/DataState";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  ApplicationStatuses,
  WorkSubmissionStatuses,
  type Application,
} from "../../applications/domain/applicationTypes";
import {
  getMyApplicationsAsync,
  getProjectApplicationsAsync,
} from "../../applications/infrastructure/applicationApi";
import type { PortfolioItem } from "../../portfolio/domain/portfolioTypes";
import { getMyPortfolioAsync } from "../../portfolio/infrastructure/portfolioApi";
import type {
  CompanyProfile,
  JobSeekerProfile,
} from "../../profiles/domain/profileTypes";
import {
  getMyJobSeekerProfileAsync,
  getPublicCompanyProfileAsync,
  getPublicJobSeekerProfileAsync,
} from "../../profiles/infrastructure/profileApi";
import {
  getExperienceLevelLabel,
  getFreelancePricingLabel,
  getOpportunityTypeLabel,
  getProjectDisplayStatusLabel,
  getProjectStatusLabel,
  getWorkModeLabel,
  isApplicationDeadlinePassed,
  OpportunityTypes,
  ProjectStatuses,
  type Project,
  type ProjectStatus,
} from "../../projects/domain/projectTypes";
import {
  getMyCompanyProjectsAsync,
  getProjectAsync,
  updateProjectStatusAsync,
} from "../../projects/infrastructure/projectApi";
import type { Review } from "../../reviews/domain/reviewTypes";
import {
  getJobSeekerReviewsAsync,
  getMyCompanyReviewsAsync,
} from "../../reviews/infrastructure/reviewApi";
import WorkProgressPanel from "./WorkProgressPanel";
import styles from "./WorkHubPage.module.scss";

type WorkerRecord = {
  application: Application;
  profile: JobSeekerProfile | null;
};

type TimelineStep = {
  label: string;
  detail: string;
  done: boolean;
  icon: LucideIcon;
};

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

function buildConversationUrl(
  portal: "company" | "job-seeker",
  receiverId: string,
  receiverName: string,
  project: Project,
) {
  const params = new URLSearchParams({
    receiverId,
    receiverName,
    projectId: String(project.id),
    projectTitle: project.title,
  });

  return `/${portal}/messages?${params.toString()}`;
}

export default function WorkHubPage() {
  const confirmAction = useConfirmation();
  const { projectId } = useParams();
  const { user } = useAuth();
  const numericProjectId = Number(projectId);
  const role = user?.role;
  const isCompany = role === "Company";
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null,
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<"delivery" | "details">(
    "delivery",
  );

  const loadWorkHub = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setAccessDenied(false);
    setError("");

    try {
      if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
        throw new Error("The opportunity ID is invalid.");
      }

      if (role === "Company") {
        const [projectData, applicationData, reviewData] = await Promise.all([
          getMyCompanyProjectsAsync(),
          getProjectApplicationsAsync(numericProjectId),
          getMyCompanyReviewsAsync(),
        ]);
        const ownedProject =
          projectData.items.find((item) => item.id === numericProjectId) ?? null;

        if (!ownedProject) {
          throw new Error("This opportunity was not found in your company.");
        }

        const acceptedApplications = applicationData.items.filter(
          (application) =>
            application.status === ApplicationStatuses.Accepted,
        );
        const workerData = await Promise.all(
          acceptedApplications.map(async (application) => {
            try {
              return {
                application,
                profile: await getPublicJobSeekerProfileAsync(
                  application.jobSeekerId!,
                ),
              };
            } catch {
              return { application, profile: null };
            }
          }),
        );

        setProject(ownedProject);
        setApplications(applicationData.items);
        setWorkers(workerData);
        setReviews(
          reviewData.filter((review) => review.projectId === numericProjectId),
        );
        setCompanyProfile(null);
        setPortfolioItems([]);
        return;
      }

      if (role === "JobSeeker") {
        const [projectData, applicationData, profileData, portfolioData] =
          await Promise.all([
            getProjectAsync(numericProjectId),
            getMyApplicationsAsync(),
            getMyJobSeekerProfileAsync(),
            getMyPortfolioAsync(),
          ]);
        const acceptedApplication = applicationData.items.find(
          (application) =>
            application.projectId === numericProjectId &&
            application.status === ApplicationStatuses.Accepted,
        );

        setProject(projectData);
        setApplications(acceptedApplication ? [acceptedApplication] : []);
        setPortfolioItems(portfolioData);
        setWorkers([]);

        if (!acceptedApplication) {
          setAccessDenied(true);
          setCompanyProfile(null);
          setReviews([]);
          return;
        }

        const [companyData, reviewData] = await Promise.all([
          getPublicCompanyProfileAsync(projectData.companyProfileId),
          getJobSeekerReviewsAsync(profileData.id),
        ]);
        setCompanyProfile(companyData);
        setReviews(
          reviewData.filter((review) => review.projectId === numericProjectId),
        );
        return;
      }

      throw new Error("Your account cannot open this work hub.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load this work hub.",
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [numericProjectId, role]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWorkHub();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWorkHub]);

  const acceptedApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === ApplicationStatuses.Accepted,
      ),
    [applications],
  );
  const projectReview = reviews.find(
    (review) => review.projectId === numericProjectId,
  );
  const portfolioItem = portfolioItems.find(
    (item) => item.projectId === numericProjectId,
  );
  const isFreelanceContract =
    project?.type === OpportunityTypes.FreelanceTask;
  const allWorkersReviewed =
    acceptedApplications.length > 0 &&
    acceptedApplications.every((application) =>
      reviews.some(
        (review) =>
          review.projectId === numericProjectId &&
          review.jobSeekerId === application.jobSeekerId,
      ),
    );
  const allFinalWorkApproved =
    acceptedApplications.length > 0 &&
    acceptedApplications.every(
      (application) =>
        application.workStatus === WorkSubmissionStatuses.Approved,
    );
  const participantWorkStatus = acceptedApplications[0]?.workStatus;
  const canParticipantSubmitFinal =
    participantWorkStatus === WorkSubmissionStatuses.NotSubmitted ||
    participantWorkStatus === WorkSubmissionStatuses.ChangesRequested;

  function focusFinalSubmission() {
    setActiveSection("delivery");
    window.requestAnimationFrame(() => {
      const form = document.getElementById("final-submission");
      if (!form) {
        setError(
          "Final submission is not available until the opportunity is active and every required milestone is approved.",
        );
        return;
      }

      form.scrollIntoView({ behavior: "smooth", block: "start" });
      form.querySelector<HTMLElement>("textarea, input, button")?.focus({
        preventScroll: true,
      });
    });
  }

  const timeline = useMemo<TimelineStep[]>(() => {
    if (!project) return [];

    const workStarted =
      project.status === ProjectStatuses.InProgress ||
      project.status === ProjectStatuses.Completed;
    const workCompleted = project.status === ProjectStatuses.Completed;

    if (isCompany) {
      return [
        {
          label: isFreelanceContract ? "Task posted" : "Opportunity published",
          detail: isFreelanceContract
            ? "The task was published for freelance proposals."
            : "The opportunity is available in your company record.",
          done: true,
          icon: BriefcaseBusiness,
        },
        {
          label: isFreelanceContract ? "Freelancer selected" : "Worker accepted",
          detail:
            acceptedApplications.length > 0
              ? `${acceptedApplications.length} ${
                  isFreelanceContract ? "freelancer" : "worker"
                }${
                  acceptedApplications.length === 1 ? "" : "s"
                } accepted.`
              : "Accept at least one applicant before starting.",
          done: acceptedApplications.length > 0,
          icon: UsersRound,
        },
        {
          label: isFreelanceContract ? "Contract started" : "Work started",
          detail: isFreelanceContract
            ? "The accepted proposal is now an active contract."
            : "The accepted team can now deliver the opportunity.",
          done: workStarted,
          icon: Play,
        },
        {
          label: isFreelanceContract ? "Delivery approved" : "Work completed",
          detail: isFreelanceContract
            ? "Complete the contract after the final delivery is approved."
            : "Mark complete after the expected outcome is delivered.",
          done: workCompleted,
          icon: CheckCircle2,
        },
        {
          label: "Feedback submitted",
          detail: "Review each accepted worker after completion.",
          done: allWorkersReviewed,
          icon: Star,
        },
      ];
    }

    return [
      {
        label: isFreelanceContract ? "Proposal accepted" : "Application accepted",
        detail: isFreelanceContract
          ? "The client accepted your proposal and terms."
          : "The company added you to this opportunity.",
        done: acceptedApplications.length > 0,
        icon: FileCheck2,
      },
      {
        label: isFreelanceContract ? "Contract started" : "Work started",
        detail: isFreelanceContract
          ? "The client has started the freelance contract."
          : "The company has moved the opportunity into active work.",
        done: workStarted,
        icon: Play,
      },
      {
        label: isFreelanceContract ? "Delivery approved" : "Work completed",
        detail: isFreelanceContract
          ? "The client approved the final delivery."
          : "The company has confirmed the opportunity is complete.",
        done: workCompleted,
        icon: CheckCircle2,
      },
      {
        label: "Company feedback",
        detail: "Your review appears after the company submits it.",
        done: Boolean(projectReview),
        icon: Star,
      },
      {
        label: "Evidence Card",
        detail:
          "Approved final work is added to your Evidence Portfolio automatically.",
        done: Boolean(portfolioItem),
        icon: FolderKanban,
      },
    ];
  }, [
    acceptedApplications.length,
    allWorkersReviewed,
    isCompany,
    isFreelanceContract,
    portfolioItem,
    project,
    projectReview,
  ]);

  async function changeProjectStatus(status: ProjectStatus) {
    if (!project) return;

    if (
      status === ProjectStatuses.Completed &&
      !allFinalWorkApproved
    ) {
      setError(
        "Approve the final work for every accepted participant before completing this opportunity.",
      );
      return;
    }

    if (
      status === ProjectStatuses.Completed &&
      !(await confirmAction({
        title: "Complete this opportunity?",
        description: `Final work for "${project.title}" is approved. Completing it closes active delivery and unlocks the review stage.`,
        confirmLabel: "Complete opportunity",
        variant: "warning",
      }))
    ) {
      return;
    }

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      await updateProjectStatusAsync(project.id, status);
      setMessage(`Work moved to ${getProjectStatusLabel(status)}.`);
      await loadWorkHub();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the work status.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const backPath = isFreelanceContract
    ? isCompany
      ? "/company/freelance/work"
      : "/job-seeker/freelance/work"
    : isCompany
      ? "/company/work"
      : "/job-seeker/work";

  return (
    <section className={`page work-hub-page ${styles.root}`}>
      <Button to={backPath} variant="ghost" className="work-hub-back">
        <ArrowLeft size={17} aria-hidden="true" />
        {isFreelanceContract ? "Freelance contracts" : "Work"}
      </Button>

      <header className={styles.masthead}>
        <div>
          <span>Work hub</span>
          <h1>{project?.title ?? "Opportunity work"}</h1>
          <p>
            {project
              ? isCompany
                ? "Keep the delivery, approvals, and evidence route moving from one place."
                : "Complete the delivery and follow the evidence route from submission to approval."
              : "Loading the delivery workspace."}
          </p>
        </div>
        {project ? (
          <StatusBadge tone={getProjectTone(project)}>
            {getProjectDisplayStatusLabel(project)}
          </StatusBadge>
        ) : null}
      </header>

      {message ? <div className="notice notice-success">{message}</div> : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle=""
        emptyDescription=""
      />

      {!isLoading && accessDenied ? (
        <div className="work-hub-access-state">
          <FileCheck2 size={26} aria-hidden="true" />
          <div>
            <strong>Accepted work only</strong>
            <p>
              This hub opens after the company accepts your application for the
              opportunity.
            </p>
          </div>
          <Button to="/job-seeker/applications" variant="secondary">
            View applications
          </Button>
        </div>
      ) : null}

      {!isLoading && !error && !accessDenied && project ? (
        <>
          {project.status === ProjectStatuses.Cancelled ? (
            <div className="notice notice-error">
              This opportunity is cancelled. Its history remains visible, but
              no new work should continue.
            </div>
          ) : null}

          <div className="work-hub-facts" aria-label="Opportunity summary">
            <article>
              <BriefcaseBusiness size={18} aria-hidden="true" />
              <span>Type</span>
              <strong>
                {isFreelanceContract
                  ? "Freelance contract"
                  : getOpportunityTypeLabel(project.type)}
              </strong>
            </article>
            <article>
              <Clock3 size={18} aria-hidden="true" />
              <span>{isFreelanceContract ? "Delivery target" : "Duration"}</span>
              <strong>
                {isFreelanceContract
                  ? `${project.freelanceDeliveryDays ?? project.durationWeeks * 7} days`
                  : `${project.durationWeeks} weeks`}
              </strong>
            </article>
            <article>
              {isFreelanceContract ? (
                <CircleDollarSign size={18} aria-hidden="true" />
              ) : (
                <MapPin size={18} aria-hidden="true" />
              )}
              <span>{isFreelanceContract ? "Pricing" : "Work setup"}</span>
              <strong>
                {isFreelanceContract
                  ? getFreelancePricingLabel(project.freelancePricingType)
                  : getWorkModeLabel(project.workMode)}
                {!isFreelanceContract && project.location
                  ? ` · ${project.location}`
                  : ""}
              </strong>
            </article>
            <article>
              <CircleDollarSign size={18} aria-hidden="true" />
              <span>Budget</span>
              <strong>
                {project.budget !== null
                  ? `$${project.budget}`
                  : isFreelanceContract
                    ? "To be agreed"
                    : "Training"}
              </strong>
            </article>
          </div>

          <div
            className="work-hub-section-tabs"
            role="tablist"
            aria-label="Work hub sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "delivery"}
              aria-controls="work-hub-active-panel"
              className={activeSection === "delivery" ? "active" : ""}
              onClick={() => setActiveSection("delivery")}
            >
              Delivery
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "details"}
              aria-controls="work-hub-active-panel"
              className={activeSection === "details" ? "active" : ""}
              onClick={() => setActiveSection("details")}
            >
              Brief and people
            </button>
          </div>

          <div className={`work-hub-layout work-hub-layout-${activeSection}`}>
            <div
              className="work-hub-main"
              id="work-hub-active-panel"
              role="tabpanel"
              aria-label={
                activeSection === "delivery"
                  ? "Delivery"
                  : "Brief and people"
              }
            >
              {activeSection === "details" ? (
                <>
              <section className="work-hub-panel">
                <header className="work-hub-panel-header">
                  <div>
                    <span>Progress</span>
                    <h2>Opportunity journey</h2>
                  </div>
                  <strong>
                    {timeline.filter((step) => step.done).length}/{timeline.length}
                  </strong>
                </header>
                <ol className="work-hub-timeline">
                  {timeline.map((step) => {
                    const Icon = step.icon;

                    return (
                      <li className={step.done ? "is-done" : ""} key={step.label}>
                        <span className="work-hub-step-marker">
                          {step.done ? (
                            <CheckCircle2 size={21} aria-hidden="true" />
                          ) : (
                            <Circle size={21} aria-hidden="true" />
                          )}
                        </span>
                        <span className="work-hub-step-icon">
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <div>
                          <strong>{step.label}</strong>
                          <p>{step.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {isCompany ? (
                <section className="work-hub-panel">
                  <header className="work-hub-panel-header">
                    <div>
                      <span>Accepted team</span>
                      <h2>People working on this opportunity</h2>
                    </div>
                    <strong>{workers.length}</strong>
                  </header>

                  {workers.length === 0 ? (
                    <div className="work-hub-empty">
                      <UsersRound size={24} aria-hidden="true" />
                      <div>
                        <strong>No accepted workers yet</strong>
                        <p>
                          Review the applicants and accept the right people
                          before starting work.
                        </p>
                      </div>
                      <Button
                        to={`/company/projects/${project.id}/applications`}
                        variant="secondary"
                      >
                        Review applicants
                      </Button>
                    </div>
                  ) : (
                    <div className="work-hub-worker-list">
                      {workers.map(({ application, profile }) => {
                        const review = reviews.find(
                          (item) =>
                            item.jobSeekerId === application.jobSeekerId,
                        );

                        return (
                          <article key={application.id}>
                            <span className="work-hub-avatar" aria-hidden="true">
                              {application.jobSeekerName.charAt(0).toUpperCase()}
                            </span>
                            <div className="work-hub-worker-summary">
                              <strong>{application.jobSeekerName}</strong>
                              <span>
                                Application #{application.id}
                                {profile?.city ? ` · ${profile.city}` : ""}
                              </span>
                              {profile?.skills.length ? (
                                <small>
                                  {profile.skills.slice(0, 4).join(", ")}
                                </small>
                              ) : null}
                            </div>
                            <StatusBadge tone={review ? "green" : "blue"}>
                              {review ? `${review.rating}/5 reviewed` : "Accepted"}
                            </StatusBadge>
                            <div className="work-hub-worker-actions">
                              <Button
                                to={
                                  profile
                                    ? `/company/talent/${profile.id}`
                                    : `/company/applications?application=${application.id}`
                                }
                                variant="secondary"
                              >
                                View profile
                              </Button>
                              <Button
                                to={`/company/evidence-requests?applicationId=${application.id}`}
                                variant="secondary"
                              >
                                <FileCheck2 size={16} aria-hidden="true" />
                                Request evidence
                              </Button>
                              {profile ? (
                                <Button
                                  to={buildConversationUrl(
                                    "company",
                                    profile.userId,
                                    application.jobSeekerName,
                                    project,
                                  )}
                                  variant="ghost"
                                  aria-label={`Message ${application.jobSeekerName}`}
                                  title="Message worker"
                                >
                                  <MessageSquare size={17} aria-hidden="true" />
                                </Button>
                              ) : null}
                              {project.status === ProjectStatuses.Completed &&
                              !review ? (
                                <Button
                                  to={`/company/projects/${project.id}/applications`}
                                  variant="primary"
                                >
                                  <Star size={16} aria-hidden="true" />
                                  Review
                                </Button>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : (
                <section className="work-hub-panel">
                  <header className="work-hub-panel-header">
                    <div>
                      <span>Company contact</span>
                      <h2>{companyProfile?.companyName ?? project.companyName}</h2>
                    </div>
                    {companyProfile?.isVerified ? (
                      <StatusBadge tone="green">Verified</StatusBadge>
                    ) : null}
                  </header>
                  <div className="work-hub-company">
                    <span className="work-hub-company-icon">
                      <Building2 size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <p>
                        {companyProfile?.description ??
                          "Contact the company through the project conversation."}
                      </p>
                      {companyProfile?.city ? (
                        <span>
                          <MapPin size={15} aria-hidden="true" />
                          {companyProfile.city}
                        </span>
                      ) : null}
                    </div>
                    <div className="work-hub-company-actions">
                      {companyProfile ? (
                        <Button
                          to={buildConversationUrl(
                            "job-seeker",
                            companyProfile.userId,
                            companyProfile.companyName,
                            project,
                          )}
                          variant="primary"
                        >
                          <MessageSquare size={17} aria-hidden="true" />
                          Message company
                        </Button>
                      ) : null}
                      {companyProfile?.website ? (
                        <a
                          className="button button-secondary"
                          href={companyProfile.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} aria-hidden="true" />
                          Website
                        </a>
                      ) : null}
                    </div>
                  </div>
                </section>
              )}

              <section className="work-hub-panel work-hub-scope">
                <header className="work-hub-panel-header">
                  <div>
                    <span>Handoff</span>
                    <h2>Scope and expected outcome</h2>
                  </div>
                </header>
                <div className="work-hub-scope-copy">
                  <div>
                    <h3>Description</h3>
                    <p>{project.description}</p>
                  </div>
                  <div>
                    <h3>Requirements</h3>
                    <p>{project.requirements}</p>
                  </div>
                </div>
                <div className="work-hub-skill-list">
                  <span>
                    <Wrench size={16} aria-hidden="true" />
                    {getExperienceLevelLabel(project.experienceLevel)}
                  </span>
                  {project.skills.map((skill) => (
                    <span
                      className={skill.isRequired ? "is-required" : ""}
                      key={skill.id}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </section>
                </>
              ) : (
                <WorkProgressPanel
                  isCompany={isCompany}
                  projectId={project.id}
                  onWorkUpdated={() => loadWorkHub(false)}
                />
              )}
            </div>

            <aside className="work-hub-side">
              <section className="work-hub-next-action">
                <span>Next action</span>

                {isCompany &&
                project.status === ProjectStatuses.Open &&
                acceptedApplications.length === 0 ? (
                  <>
                    <h2>Choose your team</h2>
                    <p>
                      Accept at least one applicant before moving this
                      opportunity into active work.
                    </p>
                    <Button
                      to={`/company/projects/${project.id}/applications`}
                      variant="primary"
                      fullWidth
                    >
                      <UsersRound size={17} aria-hidden="true" />
                      Review applicants
                    </Button>
                  </>
                ) : null}

                {isCompany &&
                project.status === ProjectStatuses.Open &&
                acceptedApplications.length > 0 ? (
                  <>
                    <h2>Start the work</h2>
                    <p>
                      Your accepted team is ready. Start the opportunity when
                      the handoff is complete.
                    </p>
                    <Button
                      type="button"
                      fullWidth
                      isLoading={isUpdating}
                      onClick={() =>
                        changeProjectStatus(ProjectStatuses.InProgress)
                      }
                    >
                      <Play size={17} aria-hidden="true" />
                      Start work
                    </Button>
                  </>
                ) : null}

                {isCompany &&
                project.status === ProjectStatuses.InProgress ? (
                  <>
                    <h2>
                      {allFinalWorkApproved
                        ? "Confirm completion"
                        : "Final approval required"}
                    </h2>
                    <p>
                      {allFinalWorkApproved
                        ? "Every accepted participant has approved final work. The opportunity can now be completed."
                        : "Review and approve the final work for every accepted participant before completing this opportunity."}
                    </p>
                    <Button
                      type="button"
                      fullWidth
                      isLoading={isUpdating}
                      disabled={!allFinalWorkApproved}
                      onClick={() =>
                        changeProjectStatus(ProjectStatuses.Completed)
                      }
                    >
                      <CheckCircle2 size={17} aria-hidden="true" />
                      Complete work
                    </Button>
                  </>
                ) : null}

                {isCompany &&
                project.status === ProjectStatuses.Completed ? (
                  <>
                    <h2>
                      {allWorkersReviewed
                        ? "Work record complete"
                        : "Review the team"}
                    </h2>
                    <p>
                      {allWorkersReviewed
                        ? "Every accepted worker has feedback for this opportunity."
                        : "Submit a review for each worker so their completed work is verified."}
                    </p>
                    <Button
                      to={`/company/projects/${project.id}/applications`}
                      variant={allWorkersReviewed ? "secondary" : "primary"}
                      fullWidth
                    >
                      <Star size={17} aria-hidden="true" />
                      {allWorkersReviewed ? "View reviews" : "Review workers"}
                    </Button>
                  </>
                ) : null}

                {isCompany &&
                project.status === ProjectStatuses.Cancelled ? (
                  <>
                    <h2>Opportunity cancelled</h2>
                    <p>
                      Reopen it only when the company and accepted workers are
                      ready to continue.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      isLoading={isUpdating}
                      onClick={() => changeProjectStatus(ProjectStatuses.Open)}
                    >
                      Reopen opportunity
                    </Button>
                  </>
                ) : null}

                {!isCompany && project.status === ProjectStatuses.Open ? (
                  <>
                    <h2>Wait for the handoff</h2>
                    <p>
                      Your application is accepted. The company will start the
                      opportunity when the team is ready.
                    </p>
                  </>
                ) : null}

                {!isCompany &&
                project.status === ProjectStatuses.InProgress ? (
                  <>
                    <h2>
                      {canParticipantSubmitFinal
                        ? participantWorkStatus ===
                          WorkSubmissionStatuses.ChangesRequested
                          ? "Revision requested"
                          : "Submit your completed work"
                        : participantWorkStatus ===
                            WorkSubmissionStatuses.Submitted ||
                          participantWorkStatus ===
                            WorkSubmissionStatuses.AwaitingUniversityApproval
                        ? "Final work under review"
                        : "Final work approved"}
                    </h2>
                    <p>
                      {canParticipantSubmitFinal
                        ? "Complete the final submission form and send the work to the provider for criterion-level evaluation."
                        : participantWorkStatus ===
                            WorkSubmissionStatuses.Submitted ||
                          participantWorkStatus ===
                            WorkSubmissionStatuses.AwaitingUniversityApproval
                        ? "Your submission is saved. The provider or university must complete the remaining review."
                        : "Your final work has completed the required approval route."}
                    </p>
                    {canParticipantSubmitFinal ? (
                      <Button
                        type="button"
                        fullWidth
                        onClick={focusFinalSubmission}
                      >
                        <Upload size={17} aria-hidden="true" />
                        {participantWorkStatus ===
                        WorkSubmissionStatuses.ChangesRequested
                          ? "Submit revision"
                          : "Submit final work"}
                      </Button>
                    ) : companyProfile ? (
                      <Button
                        to={buildConversationUrl(
                          "job-seeker",
                          companyProfile.userId,
                          companyProfile.companyName,
                          project,
                        )}
                        fullWidth
                      >
                        <MessageSquare size={17} aria-hidden="true" />
                        Open conversation
                      </Button>
                    ) : null}
                  </>
                ) : null}

                {!isCompany &&
                project.status === ProjectStatuses.Completed ? (
                  <>
                    <h2>
                      {acceptedApplications[0]?.workStatus === WorkSubmissionStatuses.Approved
                        ? portfolioItem
                          ? "Evidence card ready"
                          : "Final approval required"
                        : participantWorkStatus === WorkSubmissionStatuses.Submitted ||
                          participantWorkStatus ===
                            WorkSubmissionStatuses.AwaitingUniversityApproval
                        ? "Final work under review"
                        : portfolioItem
                        ? "Evidence card ready (work pending approval)"
                        : "Submit your completed work"}
                    </h2>
                    <p>
                      {acceptedApplications[0]?.workStatus === WorkSubmissionStatuses.Approved
                        ? portfolioItem
                          ? "Choose whether this approved evidence is visible in your shared portfolio."
                          : "Waiting for provider approval."
                        : participantWorkStatus === WorkSubmissionStatuses.Submitted ||
                          participantWorkStatus ===
                            WorkSubmissionStatuses.AwaitingUniversityApproval
                        ? "Your final submission is saved and waiting for the remaining review and approval steps."
                        : portfolioItem
                        ? "Your work is pending provider approval."
                        : "Submit your completed work above. The evidence card is created after the provider approves it."}
                    </p>
                    {canParticipantSubmitFinal ? (
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={focusFinalSubmission}
                      >
                        <Upload size={17} aria-hidden="true" />
                        {participantWorkStatus ===
                        WorkSubmissionStatuses.ChangesRequested
                          ? "Submit revision"
                          : "Submit final work"}
                      </Button>
                    ) : null}
                    {acceptedApplications[0]?.workStatus === WorkSubmissionStatuses.Approved && portfolioItem && (
                      <Button
                        to="/job-seeker/portfolio"
                        variant="secondary"
                        fullWidth
                      >
                        <FolderKanban size={17} aria-hidden="true" />
                        View Evidence Portfolio
                      </Button>
                    )}
                  </>
                ) : null}

                {!isCompany &&
                project.status === ProjectStatuses.Cancelled ? (
                  <>
                    <h2>Work stopped</h2>
                    <p>
                      Contact the company if you need clarification about this
                      cancelled opportunity.
                    </p>
                  </>
                ) : null}
              </section>

              {activeSection === "details" ? (
                <section className="work-hub-reference">
                <span>Reference</span>
                <dl>
                  <div>
                    <dt>Opportunity</dt>
                    <dd>#{project.id}</dd>
                  </div>
                  {!isCompany && applications[0] ? (
                    <div>
                      <dt>Application</dt>
                      <dd>#{applications[0].id}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Positions</dt>
                    <dd>{project.positionsAvailable}</dd>
                  </div>
                  <div>
                    <dt>Accepted team</dt>
                    <dd>{acceptedApplications.length}</dd>
                  </div>
                </dl>
                <Button
                  to={
                    isCompany
                      ? `/company/projects/${project.id}/applications`
                      : `/job-seeker/opportunities/${project.id}`
                  }
                  variant="secondary"
                  fullWidth
                >
                  {isCompany ? "Team and applicants" : "Opportunity details"}
                </Button>
                </section>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}
