import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Upload,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { CriterionEvidenceCoverage } from "../../evidence/domain/evidenceTypes";
import { getCriterionEvidenceCoverageAsync } from "../../evidence/infrastructure/evidenceApi";
import CriterionCoveragePanel from "../../evidence/presentation/CriterionCoveragePanel";
import {
  getApplicationStatusLabelForOpportunity,
  type Application,
} from "../../applications/domain/applicationTypes";
import {
  applyToProjectAsync,
  getMyApplicationsAsync,
} from "../../applications/infrastructure/applicationApi";
import type { CompanyProfile } from "../../profiles/domain/profileTypes";
import { getPublicCompanyProfileAsync } from "../../profiles/infrastructure/profileApi";
import {
  FreelancePricingTypes,
  getExperienceLevelLabel,
  getFreelancePricingLabel,
  getOpportunityTypeLabel,
  getWorkModeLabel,
  isProjectAcceptingApplications,
  OpportunityTypes,
  type Project,
} from "../domain/projectTypes";
import { getProjectAsync, getProjectsAsync } from "../infrastructure/projectApi";
import EvidenceContractPanel from "./EvidenceContractPanel";
import type { ProofBrief } from "../../proof-briefs/domain/proofBriefTypes";
import { getProofBriefAsync } from "../../proof-briefs/infrastructure/proofBriefApi";
import ProofBriefPack from "../../proof-briefs/presentation/ProofBriefPack";

const MAX_CV_SIZE = 5 * 1024 * 1024;

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [criterionCoverage, setCriterionCoverage] =
    useState<CriterionEvidenceCoverage | null>(null);
  const [proofBrief, setProofBrief] = useState<ProofBrief | null>(null);
  const [includeProofBrief, setIncludeProofBrief] = useState(false);
  const [proofBriefApproach, setProofBriefApproach] = useState("");
  const [proofBriefTradeoffs, setProofBriefTradeoffs] = useState("");
  const [proofBriefReflection, setProofBriefReflection] = useState("");
  const [proofBriefArtifactUrl, setProofBriefArtifactUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [workSampleUrl, setWorkSampleUrl] = useState("");
  const [shortTaskResponse, setShortTaskResponse] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [proposedDeliveryDays, setProposedDeliveryDays] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isJobSeeker = user?.role === "JobSeeker";
  const isFreelanceRoute = location.pathname.includes("/freelance/");
  const browsePath = isJobSeeker
    ? isFreelanceRoute
      ? "/job-seeker/freelance"
      : "/job-seeker/opportunities"
    : isFreelanceRoute
      ? "/freelance"
      : "/opportunities";

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const projectData = await getProjectAsync(Number(projectId));
        const [companyData, applicationData, projectDataList, coverageData, proofBriefData] = await Promise.all([
          getPublicCompanyProfileAsync(projectData.companyProfileId),
          isJobSeeker ? getMyApplicationsAsync() : Promise.resolve(null),
          getProjectsAsync({ pageSize: 12 }).catch(() => null),
          isJobSeeker
            ? getCriterionEvidenceCoverageAsync(projectData.id).catch(() => null)
            : Promise.resolve(null),
          projectData.proofBrief?.isAvailable
            ? getProofBriefAsync(projectData.id).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (isMounted) {
          setProject(projectData);
          setCompanyProfile(companyData);
          setExistingApplication(
            (applicationData?.items ?? []).find(
              (application) => application.projectId === projectData.id,
            ) ?? null,
          );
          setCriterionCoverage(coverageData);
          setProofBrief(proofBriefData);
          const otherOpenProjects = (projectDataList?.items ?? []).filter(
            (candidate) =>
              candidate.id !== projectData.id &&
              isProjectAcceptingApplications(candidate) &&
              (projectData.type === OpportunityTypes.FreelanceTask
                ? candidate.type === OpportunityTypes.FreelanceTask
                : candidate.type !== OpportunityTypes.FreelanceTask),
          );
          const companyProjects = otherOpenProjects.filter(
            (candidate) =>
              candidate.companyProfileId === projectData.companyProfileId,
          );
          const similarProjects = otherOpenProjects.filter(
            (candidate) =>
              candidate.companyProfileId !== projectData.companyProfileId &&
              candidate.type === projectData.type,
          );
          setRelatedProjects(
            [...companyProjects, ...similarProjects].slice(0, 3),
          );
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load opportunity.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [isFreelanceRoute, isJobSeeker, projectId]);

  const companyMessagePath =
    project && companyProfile
      ? `/job-seeker/messages?${new URLSearchParams({
          receiverId: companyProfile.userId,
          receiverName: project.companyName,
          projectId: String(project.id),
          projectTitle: project.title,
        })}`
      : "";
  const isAcceptingApplications = project
    ? isProjectAcceptingApplications(project)
    : false;

  function handleCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setMessage("");

    if (!file) {
      setCvFile(null);
      return;
    }

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") &&
      (!file.type || file.type === "application/pdf");

    if (!isPdf) {
      setCvFile(null);
      event.currentTarget.value = "";
      setMessage("Choose a PDF file for your CV.");
      return;
    }

    if (file.size > MAX_CV_SIZE) {
      setCvFile(null);
      event.currentTarget.value = "";
      setMessage("The CV must be 5 MB or smaller.");
      return;
    }

    setCvFile(file);
  }

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !isAcceptingApplications || existingApplication) return;

    if (
      project.type === OpportunityTypes.FreelanceTask &&
      coverLetter.trim().length < 40
    ) {
      setMessage(
        "Write a short proposal explaining how you will complete the work.",
      );
      return;
    }

    if (!workSampleUrl.trim() && !shortTaskResponse.trim() && !includeProofBrief) {
      setMessage("Add a work sample, complete the short application task, or include the available Proof Brief.");
      return;
    }

    if (includeProofBrief && (!proofBrief || proofBriefApproach.trim().length < 30 || proofBriefTradeoffs.trim().length < 30 || proofBriefReflection.trim().length < 20)) {
      setMessage("Complete the Proof Brief approach, trade-offs, and reflection before applying.");
      return;
    }

    const proposalBudget = Number(proposedBudget);
    const proposalDeliveryDays = Number(proposedDeliveryDays);
    if (
      project.type === OpportunityTypes.FreelanceTask &&
      ((!Number.isFinite(proposalBudget) || proposalBudget <= 0) ||
        !Number.isInteger(proposalDeliveryDays) ||
        proposalDeliveryDays < 1 ||
        proposalDeliveryDays > 365)
    ) {
      setMessage("Add a valid price and delivery time to your proposal.");
      return;
    }

    setIsApplying(true);
    setMessage("");

    try {
      const application = await applyToProjectAsync(
        project.id,
        {
          coverLetter: coverLetter.trim() || undefined,
          workSampleUrl: workSampleUrl.trim() || undefined,
          shortTaskResponse: shortTaskResponse.trim() || undefined,
          proposedBudget:
            project.type === OpportunityTypes.FreelanceTask
              ? proposalBudget
              : undefined,
          proposedDeliveryDays:
            project.type === OpportunityTypes.FreelanceTask
              ? proposalDeliveryDays
              : undefined,
          proofBrief: includeProofBrief && proofBrief
            ? {
                proofBriefVersionId: proofBrief.currentVersionId!,
                proofBriefApproach: proofBriefApproach.trim(),
                proofBriefTradeoffs: proofBriefTradeoffs.trim(),
                proofBriefReflection: proofBriefReflection.trim(),
                proofBriefArtifactUrl: proofBriefArtifactUrl.trim() || undefined,
              }
            : undefined,
        },
        cvFile,
      );
      setExistingApplication(application);
      setCoverLetter("");
      setWorkSampleUrl("");
      setShortTaskResponse("");
      setProposedBudget("");
      setProposedDeliveryDays("");
      setIncludeProofBrief(false);
      setProofBriefApproach("");
      setProofBriefTradeoffs("");
      setProofBriefReflection("");
      setProofBriefArtifactUrl("");
      setCvFile(null);
      if (cvInputRef.current) {
        cvInputRef.current.value = "";
      }
      setMessage(
        project.type === OpportunityTypes.FreelanceTask
          ? "Proposal sent successfully."
          : "Application submitted successfully.",
      );
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to apply.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section className="page jobseeker-opportunity-details-page">
      <DataState
        isLoading={isLoading}
        error={error}
        empty={!project}
        emptyTitle="Opportunity not found"
        emptyDescription="The opportunity may have been removed or is no longer public."
      />

      {project ? (
        <>
          <Button
            to={browsePath}
            variant="ghost"
            className="jobseeker-back-link"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {isFreelanceRoute ? "Back to freelance tasks" : "Back to opportunities"}
          </Button>

          <header className="jobseeker-opportunity-header">
            <div className="jobseeker-opportunity-mark" aria-hidden="true">
              {project.companyName.trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="jobseeker-opportunity-labels">
                <StatusBadge tone="blue">{getOpportunityTypeLabel(project.type)}</StatusBadge>
                <StatusBadge tone={isAcceptingApplications ? "green" : "neutral"}>
                  {project.type === OpportunityTypes.FreelanceTask
                    ? isAcceptingApplications
                      ? "Accepting proposals"
                      : "Proposals closed"
                    : isAcceptingApplications
                      ? "Accepting applications"
                      : "Applications closed"}
                </StatusBadge>
              </div>
              <h1>{project.title}</h1>
              <p>{project.companyName}</p>
            </div>
          </header>

          <div className="jobseeker-opportunity-details-grid">
            <main className="jobseeker-opportunity-main">
              <section>
                <h2>
                  {project.type === OpportunityTypes.FreelanceTask
                    ? "About the task"
                    : "About the opportunity"}
                </h2>
                <p>{project.description}</p>
              </section>

              <section>
                <h2>Requirements</h2>
                <p>{project.requirements}</p>
                <div className="project-requirement-groups">
                  <div>
                    <strong>Required skills</strong>
                    <div className="project-skill-tags">
                      {project.skills.filter((skill) => skill.isRequired).map((skill) => (
                        <span className="required" key={skill.id}>{skill.name}</span>
                      ))}
                    </div>
                  </div>
                  {project.skills.some((skill) => !skill.isRequired) ? (
                    <div>
                      <strong>Preferred skills</strong>
                      <div className="project-skill-tags">
                        {project.skills.filter((skill) => !skill.isRequired).map((skill) => (
                          <span className="preferred" key={skill.id}>{skill.name}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {(!isJobSeeker || existingApplication) && project.applicationTask?.trim() ? (
                <section>
                  <h2>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Client question"
                      : "Application task"}
                  </h2>
                  <p>{project.applicationTask}</p>
                </section>
              ) : null}

              {project.deliverables?.trim() ? (
                <section>
                <h2>Deliverables</h2>
                <p>{project.deliverables}</p>
                </section>
              ) : null}

              {project.type === OpportunityTypes.FreelanceTask ? (
                <section>
                  <h2>Freelance terms</h2>
                  <div className="jobseeker-opportunity-facts freelance-opportunity-terms">
                    <article>
                      <CircleDollarSign size={19} aria-hidden="true" />
                      <span>{getFreelancePricingLabel(project.freelancePricingType)}</span>
                      <strong>
                        {project.budget ? `$${project.budget}` : "Not set"}
                        {project.freelancePricingType ===
                          FreelancePricingTypes.Hourly && project.budget
                          ? " / hour"
                          : ""}
                      </strong>
                    </article>
                    <article>
                      <Clock3 size={19} aria-hidden="true" />
                      <span>Expected delivery</span>
                      <strong>
                        {project.freelanceDeliveryDays ??
                          project.durationWeeks * 7}{" "}
                        days
                      </strong>
                    </article>
                    <article>
                      <RotateCcw size={19} aria-hidden="true" />
                      <span>Included revisions</span>
                      <strong>{project.includedRevisions ?? 1}</strong>
                    </article>
                  </div>
                </section>
              ) : null}

              {project.milestones.length > 0 ||
              project.milestonePlan?.trim() ? (
                <section>
                  <h2>Work milestones</h2>
                  {project.milestones.length > 0 ? (
                    <ol className="opportunity-milestone-plan">
                      {project.milestones.map((milestone) => (
                        <li key={milestone.id}>
                          <span>{milestone.sortOrder + 1}</span>
                          <div>
                            <strong>{milestone.title}</strong>
                            <small>Due by day {milestone.dueAfterDays}</small>
                            {milestone.description ? (
                              <p>{milestone.description}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>{project.milestonePlan}</p>
                  )}
                </section>
              ) : null}

              <EvidenceContractPanel
                projectId={project.id}
                currentVersionNumber={project.currentEvidenceContractVersionNumber}
                governingVersionNumber={existingApplication?.acceptedEvidenceContractVersionNumber}
                canInspectHistory
              />

              {project.evaluationCriteria?.trim() ||
              project.requiredTrainingHours ? (
                <section>
                <h2>How the work will be evaluated</h2>
                {project.evaluationCriteria?.trim() ? (
                  <p>{project.evaluationCriteria}</p>
                ) : null}
                {project.requiredTrainingHours ? (
                  <p>
                    <strong>{project.requiredTrainingHours} training hours</strong>
                    {project.academicRequirements
                      ? ` · ${project.academicRequirements}`
                      : ""}
                  </p>
                ) : null}
                </section>
              ) : null}

              {existingApplication && criterionCoverage ? (
                <CriterionCoveragePanel coverage={criterionCoverage} />
              ) : null}

              <section>
                <h2>
                  {project.type === OpportunityTypes.FreelanceTask
                    ? "Task details"
                    : "Commitment and details"}
                </h2>
                <div className="jobseeker-opportunity-facts">
                  {project.type !== OpportunityTypes.FreelanceTask ? (
                    <>
                      <article>
                        <Clock3 size={19} />
                        <span>Duration</span>
                        <strong>{project.durationWeeks} weeks</strong>
                      </article>
                      <article>
                        <BriefcaseBusiness size={19} />
                        <span>Budget</span>
                        <strong>
                          {project.budget
                            ? `$${project.budget}`
                            : project.type ===
                                OpportunityTypes.UniversityTraining
                              ? "Unpaid training"
                              : "No payment listed"}
                        </strong>
                      </article>
                    </>
                  ) : null}
                  <article><MapPin size={19} /><span>Work mode</span><strong>{getWorkModeLabel(project.workMode)}{project.location ? ` - ${project.location}` : ""}</strong></article>
                  <article><Wrench size={19} /><span>Experience</span><strong>{getExperienceLevelLabel(project.experienceLevel)}</strong></article>
                  <article>
                    <UsersRound size={19} />
                    <span>
                      {project.type === OpportunityTypes.FreelanceTask
                        ? "Freelancers needed"
                        : "Open positions"}
                    </span>
                    <strong>{project.positionsAvailable}</strong>
                  </article>
                  <article>
                    <CalendarDays size={19} />
                    <span>
                      {project.type === OpportunityTypes.FreelanceTask
                        ? "Submit by"
                        : "Apply by"}
                    </span>
                    <strong>
                      {project.applicationDeadline ?? "Open until filled"}
                    </strong>
                  </article>
                </div>
              </section>

              <section className="jobseeker-company-panel">
                <div className="jobseeker-opportunity-mark" aria-hidden="true">
                  {project.companyName.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <span>About the provider</span>
                  <h2>{project.companyName}</h2>
                  <p>{companyProfile?.description ?? "The provider has not added a public description."}</p>
                  <div>
                    {companyProfile?.city ? <span><MapPin size={14} />{companyProfile.city}</span> : null}
                    {companyProfile?.isVerified ? <span><ShieldCheck size={14} />Verified by SkillBridge</span> : null}
                  </div>
                  {isJobSeeker && companyMessagePath ? (
                    <div className="jobseeker-company-actions">
                      <Button to={companyMessagePath} variant="secondary">
                        <MessageSquare size={16} aria-hidden="true" />
                        Chat with provider
                      </Button>
                    </div>
                  ) : null}
                </div>
              </section>
            </main>

            <aside className="jobseeker-apply-panel">
              {existingApplication ? (
                <div className="jobseeker-applied-state">
                  <CheckCircle2 size={30} aria-hidden="true" />
                  <span>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Proposal sent"
                      : "Application submitted"}
                  </span>
                  <h2>
                    {getApplicationStatusLabelForOpportunity(
                      existingApplication.status,
                      existingApplication.opportunityType,
                    )}
                  </h2>
                  <p>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "The provider can now review your proposed price, delivery time, and evidence."
                      : "Your application was sent to the provider. Follow its status from Applications."}
                  </p>
                  <Button
                    to={
                      project.type === OpportunityTypes.FreelanceTask
                        ? "/job-seeker/freelance/proposals"
                        : "/job-seeker/applications"
                    }
                    variant="primary"
                  >
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Track proposal"
                      : "Track application"}
                  </Button>
                </div>
              ) : !isAcceptingApplications ? (
                <div className="jobseeker-applied-state">
                  <CalendarDays size={30} aria-hidden="true" />
                  <span>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Proposals closed"
                      : "Applications closed"}
                  </span>
                  <h2>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "This task is no longer accepting proposals"
                      : "The application window has ended"}
                  </h2>
                  <p>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "The client has closed the proposal window."
                      : "This opportunity is no longer accepting new applications."}
                  </p>
                </div>
              ) : isJobSeeker ? (
                <form onSubmit={handleApply}>
                  <span>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Freelance proposal"
                      : "Apply to this opportunity"}
                  </span>
                  <h2>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Send your proposal"
                      : "Introduce your fit"}
                  </h2>
                  <p>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Outline your approach, price, and delivery time."
                      : "Tell the provider why you fit this work."}
                  </p>
                  {project.type === OpportunityTypes.FreelanceTask ? (
                    <div className="freelance-brief-reference">
                      <span>
                        <small>Client budget</small>
                        <strong>
                          {project.budget
                            ? `$${project.budget}${
                                project.freelancePricingType ===
                                FreelancePricingTypes.Hourly
                                  ? " / hour"
                                  : ""
                              }`
                            : "Not set"}
                        </strong>
                      </span>
                      <span>
                        <small>Target delivery</small>
                        <strong>
                          {project.freelanceDeliveryDays ??
                            project.durationWeeks * 7}{" "}
                          days
                        </strong>
                      </span>
                      <span>
                        <small>Revision rounds</small>
                        <strong>{project.includedRevisions ?? 1}</strong>
                      </span>
                    </div>
                  ) : null}
                  <label className="field">
                    <span>
                      {project.type === OpportunityTypes.FreelanceTask
                        ? "How you will deliver the work"
                        : "Cover letter"}
                    </span>
                    <textarea
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                      placeholder={
                        project.type === OpportunityTypes.FreelanceTask
                          ? "Describe your approach, what you will deliver, and any important assumptions."
                          : "What can you contribute, and what do you want to learn?"
                      }
                      required={
                        project.type === OpportunityTypes.FreelanceTask
                      }
                      minLength={
                        project.type === OpportunityTypes.FreelanceTask
                          ? 40
                          : undefined
                      }
                      maxLength={1500}
                    />
                    <small>{coverLetter.length}/1500 characters</small>
                  </label>
                  {project.type === OpportunityTypes.FreelanceTask ? (
                    <fieldset className="freelance-proposal-terms">
                      <legend>Your offer</legend>
                      <div className="freelance-proposal-fields">
                        <label className="field">
                          <span>
                            {project.freelancePricingType ===
                            FreelancePricingTypes.Hourly
                              ? "Hourly rate (USD)"
                              : "Total price (USD)"}
                          </span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={proposedBudget}
                            onChange={(event) =>
                              setProposedBudget(event.target.value)
                            }
                            required
                          />
                        </label>
                        <label className="field">
                          <span>Delivery time (days)</span>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={proposedDeliveryDays}
                            onChange={(event) =>
                              setProposedDeliveryDays(event.target.value)
                            }
                            required
                          />
                        </label>
                      </div>
                    </fieldset>
                  ) : null}
                  <label className="field">
                    <span>
                      {project.type === OpportunityTypes.FreelanceTask
                        ? "Relevant work link"
                        : "Work sample link"}
                    </span>
                    <input
                      type="url"
                      value={workSampleUrl}
                      onChange={(event) => setWorkSampleUrl(event.target.value)}
                      placeholder="https://github.com/you/project"
                      maxLength={500}
                    />
                  </label>
                  <label className="application-cv-upload">
                    <span className="application-cv-copy">
                      <FileText size={20} aria-hidden="true" />
                      <span>
                        <strong>CV (optional)</strong>
                        <small>PDF only, up to 5 MB</small>
                      </span>
                    </span>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleCvChange}
                    />
                    <span className="application-cv-picker">
                      <Upload size={16} aria-hidden="true" />
                      {cvFile?.name ?? "Choose PDF"}
                    </span>
                  </label>
                  <label className="field">
                    <span>Short application task</span>
                    <p className="application-task-prompt">
                      {project.applicationTask}
                    </p>
                    <textarea
                      value={shortTaskResponse}
                      onChange={(event) =>
                        setShortTaskResponse(event.target.value)
                      }
                      placeholder="Write your response to the provider's task."
                      maxLength={3000}
                    />
                    <small>
                      Add a work sample or complete this short task. You do not
                      need both.
                    </small>
                  </label>
                  {proofBrief ? (
                    <ProofBriefPack
                      brief={proofBrief}
                      enabled={includeProofBrief}
                      approach={proofBriefApproach}
                      tradeoffs={proofBriefTradeoffs}
                      reflection={proofBriefReflection}
                      artifactUrl={proofBriefArtifactUrl}
                      onEnabledChange={setIncludeProofBrief}
                      onApproachChange={setProofBriefApproach}
                      onTradeoffsChange={setProofBriefTradeoffs}
                      onReflectionChange={setProofBriefReflection}
                      onArtifactUrlChange={setProofBriefArtifactUrl}
                    />
                  ) : null}
                  {message ? <div className="notice">{message}</div> : null}
                  {project.type === OpportunityTypes.FreelanceTask &&
                  proposedBudget &&
                  proposedDeliveryDays ? (
                    <div className="freelance-proposal-review">
                      <span>Proposal total</span>
                      <strong>
                        ${Number(proposedBudget).toLocaleString()}
                        {project.freelancePricingType ===
                        FreelancePricingTypes.Hourly
                          ? " / hour"
                          : ""}
                      </strong>
                      <small>{proposedDeliveryDays} days to deliver</small>
                    </div>
                  ) : null}
                  <Button
                    type="submit"
                    isLoading={isApplying}
                    disabled={!isAcceptingApplications}
                  >
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Send proposal"
                      : "Submit application"}
                  </Button>
                </form>
              ) : user ? (
                <div className="jobseeker-applied-state">
                  <h2>Job seeker access required</h2>
                  <p>Only job seeker accounts can apply to opportunities.</p>
                </div>
              ) : (
                <div className="jobseeker-applied-state">
                  <h2>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Ready to send a proposal?"
                      : "Ready to apply?"}
                  </h2>
                  <p>
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "Log in or create a job seeker profile to propose your price and delivery time."
                      : "Log in or create a job seeker profile to submit an application."}
                  </p>
                  <Link className="button button-primary" to="/login">Log in</Link>
                  <Link className="button button-secondary" to="/register">Register</Link>
                </div>
              )}
            </aside>
          </div>

          {relatedProjects.length > 0 ? (
            <section className="jobseeker-related-opportunities">
              <header>
                <div>
                  <span>Keep exploring</span>
                  <h2>Related opportunities</h2>
                </div>
                <Button
                  to={browsePath}
                  variant="ghost"
                >
                  View all
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </header>
              <div>
                {relatedProjects.map((relatedProject) => (
                  <article key={relatedProject.id}>
                    <div className="jobseeker-opportunity-labels">
                      <StatusBadge tone="blue">
                        {getOpportunityTypeLabel(relatedProject.type)}
                      </StatusBadge>
                      {relatedProject.companyProfileId === project.companyProfileId ? (
                        <StatusBadge tone="amber">Same company</StatusBadge>
                      ) : null}
                    </div>
                    <h3>{relatedProject.title}</h3>
                    <p>{relatedProject.companyName}</p>
                    <div className="jobseeker-related-meta">
                      <span>
                        <Clock3 size={15} aria-hidden="true" />
                        {relatedProject.durationWeeks} weeks
                      </span>
                      <span>
                        <MapPin size={15} aria-hidden="true" />
                        {getWorkModeLabel(relatedProject.workMode)}
                      </span>
                    </div>
                    <Button
                      to={`${browsePath}/${relatedProject.id}`}
                      variant="secondary"
                    >
                      View details
                      <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
