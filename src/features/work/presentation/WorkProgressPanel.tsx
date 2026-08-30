import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  Plus,
  RotateCcw,
  Send,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import StatusBadge from "../../../shared/components/StatusBadge";
import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import type { EvidenceReadiness } from "../../evidence/domain/evidenceTypes";
import { getEvidenceReadinessAsync } from "../../evidence/infrastructure/evidenceApi";
import EvidenceReadinessPanel from "../../evidence/presentation/EvidenceReadinessPanel";
import {
  FreelancePricingTypes,
  getFreelancePricingLabel,
  OpportunityTypes,
  ProjectStatuses,
} from "../../projects/domain/projectTypes";
import {
  CriterionRatings,
  ContributionResolutionStatuses,
  ContributionReviewDecisions,
  getMilestoneStatusLabel,
  getWorkSubmissionStatusLabel,
  MilestoneStatuses,
  TrainingReportStatuses,
  type UniversitySupervisor,
  type ContributionReviewTask,
  type CriterionEvaluation,
  type WorkRecord,
} from "../domain/workTypes";
import {
  buildCriterionDrafts,
  getCriterionDraftKey,
  parseEvaluationCriteria,
} from "../domain/workEvaluation";
import { getWorkNextAction } from "../domain/workNextAction";
import {
  assignUniversitySupervisorAsync,
  createWorkMilestoneAsync,
  declareContributionAsync,
  getContributionReviewQueueAsync,
  getProjectWorkAsync,
  getUniversitySupervisorsAsync,
  reviewFinalWorkByCompanyAsync,
  resolveContributionAsync,
  reviewContributionAsync,
  reviewMilestoneAsync,
  downloadFinalDeliverableAsync,
  submitFinalWorkAsync,
  submitMilestoneAsync,
  uploadFinalDeliverableAsync,
  updateContributionResponsibilitiesAsync,
} from "../infrastructure/workApi";
import TrainingReportsPanel from "./TrainingReportsPanel";
import EvidenceCaseNavigator from "./EvidenceCaseNavigator";

type WorkProgressPanelProps = {
  isCompany: boolean;
  projectId: number;
  onWorkUpdated?: () => void | Promise<void>;
};

function toCriterionEvaluationPayload(item: {
  criterionId: number | null;
  criterion: string;
  isRequired: boolean;
  rating: number;
  note: string;
}): CriterionEvaluation {
  return {
    criterionId: item.criterionId,
    criterion: item.criterion,
    isRequired: item.isRequired,
    rating: item.rating as CriterionEvaluation["rating"],
    note: item.note,
  };
}

export default function WorkProgressPanel({
  isCompany,
  projectId,
  onWorkUpdated,
}: WorkProgressPanelProps) {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [supervisors, setSupervisors] = useState<UniversitySupervisor[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(
    null,
  );
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");
  const [milestoneDrafts, setMilestoneDrafts] = useState<
    Record<number, { note: string; url: string; feedback: string }>
  >({});
  const [finalNote, setFinalNote] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [finalDeliverableFile, setFinalDeliverableFile] = useState<File | null>(
    null,
  );
  const [contribution, setContribution] = useState("");
  const [responsibilityDrafts, setResponsibilityDrafts] = useState<
    Record<number, string>
  >({});
  const [evaluation, setEvaluation] = useState("");
  const [finalFeedback, setFinalFeedback] = useState("");
  const [demonstratedSkillIds, setDemonstratedSkillIds] = useState<number[]>([]);
  const [criterionDraftsByApplication, setCriterionDraftsByApplication] =
    useState<
      Record<number, Record<string, { rating: number; note: string }>>
    >({});
  const [readiness, setReadiness] = useState<EvidenceReadiness | null>(null);
  const [contributionReviewQueue, setContributionReviewQueue] = useState<
    ContributionReviewTask[]
  >([]);
  const [contributionResolutionNote, setContributionResolutionNote] = useState("");
  const [contributionReviewComments, setContributionReviewComments] = useState<
    Record<number, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError("");

    try {
      const [workData, supervisorData, contributionTasks] = await Promise.all([
        getProjectWorkAsync(projectId),
        isCompany
          ? getUniversitySupervisorsAsync().catch(
              () => [] as UniversitySupervisor[],
            )
          : Promise.resolve([] as UniversitySupervisor[]),
        !isCompany
          ? getContributionReviewQueueAsync().catch(
              () => [] as ContributionReviewTask[],
            )
          : Promise.resolve([] as ContributionReviewTask[]),
      ]);
      setRecords(workData);
      setSupervisors(supervisorData);
      setContributionReviewQueue(contributionTasks);
      setSelectedApplicationId((current) =>
        workData.some((record) => record.applicationId === current)
          ? current
          : workData[0]?.applicationId ?? null,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load work progress.",
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [isCompany, projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  useEffect(() => {
    if (selectedApplicationId === null) {
      return;
    }

    let cancelled = false;
    void getEvidenceReadinessAsync(selectedApplicationId)
      .then((result) => {
        if (!cancelled) setReadiness(result);
      })
      .catch(() => {
        if (!cancelled) setReadiness(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedApplicationId, records]);

  const record = useMemo(
    () =>
      records.find((item) => item.applicationId === selectedApplicationId) ??
      null,
    [records, selectedApplicationId],
  );

  function resetMessages() {
    setError("");
    setMessage("");
  }

  function setMilestoneDraft(
    milestoneId: number,
    field: "note" | "url" | "feedback",
    value: string,
  ) {
    setMilestoneDrafts((current) => ({
      ...current,
      [milestoneId]: {
        note: current[milestoneId]?.note ?? "",
        url: current[milestoneId]?.url ?? "",
        feedback: current[milestoneId]?.feedback ?? "",
        [field]: value,
      },
    }));
  }

  async function runAction(
    key: string,
    action: () => Promise<unknown>,
    successMessage = "Work record updated.",
  ) {
    setBusyKey(key);
    resetMessages();
    try {
      await action();
      await load(false);
      await onWorkUpdated?.();
      setMessage(successMessage);
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the work record.",
      );
      return false;
    } finally {
      setBusyKey("");
    }
  }

  async function handleCreateMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record) return;

    await runAction("create-milestone", () =>
      createWorkMilestoneAsync(record.applicationId, {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        dueDate: milestoneDueDate || null,
      }),
    );
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneDueDate("");
  }

  async function handleFinalSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record) return;

    const updated = await runAction("final-submit", async () => {
      if (finalDeliverableFile) {
        await uploadFinalDeliverableAsync(
          record.applicationId,
          finalDeliverableFile,
        );
      }

      return submitFinalWorkAsync(record.applicationId, {
        submissionNote: finalNote.trim(),
        deliverableUrl: finalUrl.trim() || undefined,
        contributionSummary: contribution.trim() || undefined,
      });
    }, "Final work submitted. The provider can now evaluate the current submission.");
    if (updated) {
      setFinalNote("");
      setFinalUrl("");
      setFinalDeliverableFile(null);
      setContribution("");
    }
  }

  if (isLoading) {
    return (
      <section className="work-hub-panel">
        <DataState
          isLoading
          error=""
          empty={false}
          emptyTitle=""
          emptyDescription=""
        />
      </section>
    );
  }

  if (error && records.length === 0) {
    return (
      <section className="work-hub-panel">
        <DataState
          isLoading={false}
          error={error}
          empty={false}
          emptyTitle=""
          emptyDescription=""
        />
      </section>
    );
  }

  if (!record) {
    return null;
  }

  const canEditMilestones =
    record.workStatus === WorkSubmissionStatuses.NotSubmitted ||
    record.workStatus === WorkSubmissionStatuses.ChangesRequested;
  const isWorkActive =
    record.projectStatus === ProjectStatuses.InProgress ||
    (record.projectStatus === ProjectStatuses.Completed &&
      canEditMilestones);
  const milestonesApproved = record.milestones.every(
    (milestone) => milestone.status === MilestoneStatuses.Approved,
  );
  const trainingReportsApproved = record.trainingReports.every(
    (report) => report.status === TrainingReportStatuses.Approved,
  );
  const trainingHoursComplete =
    record.completedTrainingHours >= (record.requiredTrainingHours ?? 0);
  const canPrepareFinalSubmission =
    !isCompany && isWorkActive && canEditMilestones;
  const canSubmitFinal =
    canPrepareFinalSubmission &&
    milestonesApproved &&
    (record.opportunityType !== OpportunityTypes.UniversityTraining ||
      (trainingReportsApproved && trainingHoursComplete));
  const finalSubmissionBlocker = !isWorkActive
    ? "This opportunity must be in progress before final work can be submitted."
    : !canEditMilestones
      ? "Your final work is already under review or approved."
      : !milestonesApproved
        ? "Every milestone must be approved before final work can be submitted."
        : record.opportunityType === OpportunityTypes.UniversityTraining &&
            !trainingReportsApproved
          ? "Every training report must be approved before final work can be submitted."
          : record.opportunityType === OpportunityTypes.UniversityTraining &&
              !trainingHoursComplete
            ? "Complete the required approved training hours before final work can be submitted."
            : "";
  const eligibleSupervisors = supervisors.filter(
    (supervisor) =>
      record.studentUniversityName &&
      supervisor.universityName.trim().toLowerCase() ===
        record.studentUniversityName.trim().toLowerCase(),
  );
  const responsibilityDraft =
    responsibilityDrafts[record.applicationId] ??
    record.assignedResponsibilities ??
    "";
  const freelanceRevisionsRemaining = Math.max(
    0,
    (record.agreedRevisions ?? 1) - record.revisionRequestsUsed,
  );
  const evidenceCriteria = record.evidenceCriteria.length > 0
    ? record.evidenceCriteria
    : parseEvaluationCriteria(record.evaluationCriteria).map((title, index) => ({
        id: -(index + 1),
        title,
        description: null,
        evaluationType: 0 as const,
        minimumRating: CriterionRatings.MeetsStandard,
        isRequired: true,
        sortOrder: index,
      }));
  const criterionDrafts =
    criterionDraftsByApplication[record.applicationId] ??
    buildCriterionDrafts(record, evidenceCriteria);
  const criterionEvaluations = evidenceCriteria.map((criterion, index) => ({
    criterionId: criterion.id > 0 ? criterion.id : null,
    criterion: criterion.title,
    isRequired: criterion.isRequired,
    minimumRating: criterion.minimumRating,
    rating:
      criterionDrafts[getCriterionDraftKey(criterion, index)]?.rating ?? 0,
    note:
      criterionDrafts[getCriterionDraftKey(criterion, index)]?.note.trim() ?? "",
  }));
  const criteriaComplete = criterionEvaluations.every(
    (item) => item.rating > 0 && item.note.length >= 3,
  );
  const criteriaMeetApprovalStandard =
    criteriaComplete &&
    criterionEvaluations.every((item) =>
      !item.isRequired ||
      item.rating >= item.minimumRating,
    );
  const projectContributionReviews = contributionReviewQueue.filter(
    (item) => item.projectId === record.projectId,
  );
  const nextAction = getWorkNextAction(record, isCompany, readiness);

  function focusWorkSection(targetId: string) {
    const target = document.getElementById(targetId);
    if (!target) {
      setError("The required workflow control is not available in the current state.");
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target
      .querySelector<HTMLElement>("textarea, input, select, button")
      ?.focus({ preventScroll: true });
  }

  function resolveReadinessCondition(code: string) {
    const targetByCode: Record<string, string> = {
      FinalSubmissionMissing: "final-submission",
      WorkIncomplete: "work-milestones",
      CriterionEvaluationMissing: "final-review",
      RequiredCriterionUnsatisfied: "final-review",
      ContributionUnresolved: "contribution-record",
      CompanyApprovalMissing: "final-review",
      UniversityApprovalMissing: "training-record",
    };

    const target = targetByCode[code];
    if (target) {
      focusWorkSection(target);
      return;
    }

    setError(
      "This integrity condition is controlled by the recorded Evidence Contract or authorization route. Review the condition details before continuing.",
    );
  }

  return (
    <section className="work-hub-panel work-progress-panel">
      <header className="work-hub-panel-header">
        <div>
          <span>Work record</span>
          <h2>Milestones and final approval</h2>
        </div>
        <StatusBadge
          tone={
            record.workStatus === WorkSubmissionStatuses.Approved
              ? "green"
              : record.workStatus === WorkSubmissionStatuses.ChangesRequested
                ? "red"
                : "amber"
          }
        >
          {getWorkSubmissionStatusLabel(record.workStatus)}
        </StatusBadge>
      </header>

      {isCompany && records.length > 1 ? (
        <div className="work-record-tabs" role="tablist" aria-label="Participants">
          {records.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={item.applicationId === record.applicationId}
              className={
                item.applicationId === record.applicationId ? "active" : ""
              }
              key={item.applicationId}
              onClick={() => {
                setSelectedApplicationId(item.applicationId);
                setEvaluation("");
                setFinalFeedback("");
                setDemonstratedSkillIds([]);
                setContributionResolutionNote("");
              }}
            >
              {item.jobSeekerName}
            </button>
          ))}
        </div>
      ) : null}

      <div className="work-record-heading">
        <div>
          <strong>{record.jobSeekerName}</strong>
          <span>Application #{record.applicationId}</span>
        </div>
        {record.hasEvidenceCard ? (
          <span>
            <ClipboardCheck size={16} aria-hidden="true" />
            Evidence card created
          </span>
        ) : null}
      </div>

      {record.acceptedEvidenceContractVersionNumber ? (
        <div id="evidence-contract" className="workflow-policy-note" role="note">
          <ClipboardCheck aria-hidden="true" />
          <span>
            This participation is governed by Evidence Contract version {" "}
            {record.acceptedEvidenceContractVersionNumber}. Later opportunity
            changes do not alter this evaluation basis.
          </span>
        </div>
      ) : null}

      {(record.evaluationIsStale || record.approvalIsStale) ? (
        <div className="notice notice-warning" role="status">
          The submission changed after review. Previous evaluation or approval is
          historical and re-evaluation is required.
        </div>
      ) : null}

      <section className="work-next-action" aria-labelledby="work-next-action-title">
        <div>
          <span>Next required action</span>
          <h3 id="work-next-action-title">{nextAction.label}</h3>
          <p>{nextAction.detail}</p>
        </div>
        {nextAction.targetId && nextAction.actionLabel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => focusWorkSection(nextAction.targetId!)}
          >
            {nextAction.actionLabel}
            <ArrowDown size={16} aria-hidden="true" />
          </Button>
        ) : null}
      </section>

      <EvidenceCaseNavigator
        record={record}
        readiness={
          readiness?.applicationId === record.applicationId ? readiness : null
        }
        isCompany={isCompany}
        onNavigate={focusWorkSection}
      />

      <div id="evidence-readiness">
        <div className="work-proof-engine-launch">
          <div>
            <span>SkillBridge Proof Engine</span>
            <strong>Inspect the complete evidence lineage</strong>
            <p>Run an immutable preflight and open every exact issuance blocker.</p>
          </div>
          <Link className="button button-secondary" to={`/${isCompany ? "company" : "job-seeker"}/proof-engine/${record.applicationId}`}>
            Open in Proof Engine
            <ExternalLink size={15} aria-hidden="true" />
          </Link>
        </div>
        {readiness?.applicationId === record.applicationId ? (
          <EvidenceReadinessPanel
            readiness={readiness}
            onResolveCondition={resolveReadinessCondition}
          />
        ) : null}
      </div>

      {!isCompany && !record.hasEvidenceCard ? (
        canPrepareFinalSubmission ? (
          <form
            id="final-submission"
            className="work-final-form"
            onSubmit={handleFinalSubmission}
          >
            <div>
              <strong>Submit final work</strong>
              <p>
                Add your completed-work summary and an optional protected
                deliverable. The provider will then evaluate the work against
                the accepted Evidence Contract.
              </p>
            </div>
            {!canSubmitFinal ? (
              <div className="work-final-prerequisite" role="status">
                {finalSubmissionBlocker}
              </div>
            ) : null}
            <label className="field">
              <span>Completed work summary</span>
              <textarea
                value={finalNote}
                minLength={20}
                maxLength={3000}
                required
                onChange={(event) => setFinalNote(event.target.value)}
              />
            </label>
            {record.opportunityType === OpportunityTypes.TeamProject ? (
              <label className="field">
                <span>Your responsibilities and completed contribution</span>
                <textarea
                  value={contribution}
                  minLength={20}
                  maxLength={2000}
                  required
                  onChange={(event) => setContribution(event.target.value)}
                />
                <small>
                  Explain what you were responsible for and which parts you completed.
                </small>
              </label>
            ) : null}
            <label className="field">
              <span>Deliverable link (optional)</span>
              <input
                type="url"
                value={finalUrl}
                onChange={(event) => setFinalUrl(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Protected deliverable file (optional)</span>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx,.zip"
                onChange={(event) =>
                  setFinalDeliverableFile(event.target.files?.[0] ?? null)
                }
              />
              <small>
                PDF, DOCX, XLSX, PPTX, or ZIP up to 20 MB. This file remains
                protected and is never shown on a public evidence page.
              </small>
            </label>
            <Button
              type="submit"
              disabled={!canSubmitFinal}
              isLoading={busyKey === "final-submit"}
            >
              <Send size={16} aria-hidden="true" />
              Submit final work
            </Button>
          </form>
        ) : (
          <section className="work-final-unavailable" role="status">
            <strong>Final submission is not available</strong>
            <p>{finalSubmissionBlocker}</p>
          </section>
        )
      ) : null}

      {record.hasProtectedFinalDeliverable ? (
        <section className="workflow-policy-note work-protected-deliverable" aria-label="Protected deliverable">
          <ClipboardCheck aria-hidden="true" />
          <span>
            Protected deliverable: {record.protectedFinalDeliverableFileName}
          </span>
          <Button
            type="button"
            variant="secondary"
            isLoading={busyKey === "download-deliverable"}
            onClick={() => {
              setBusyKey("download-deliverable");
              resetMessages();
              void downloadFinalDeliverableAsync(record.applicationId)
                .catch((caughtError) => {
                  setError(
                    caughtError instanceof Error
                      ? caughtError.message
                      : "Unable to download the protected deliverable.",
                  );
                })
                .finally(() => setBusyKey(""));
            }}
          >
            <Download size={14} aria-hidden="true" />
            Download
          </Button>
        </section>
      ) : null}

      {record.opportunityType === OpportunityTypes.FreelanceTask ? (
        <section className="freelance-agreement">
          <header>
            <span>Accepted proposal</span>
            <strong>Agreed work terms</strong>
          </header>
          <div>
            <article>
              <CircleDollarSign size={18} aria-hidden="true" />
              <span>
                {getFreelancePricingLabel(record.freelancePricingType)}
              </span>
              <strong>
                {record.agreedBudget ? `$${record.agreedBudget}` : "Not set"}
                {record.freelancePricingType ===
                FreelancePricingTypes.Hourly
                  ? " / hour"
                  : ""}
              </strong>
            </article>
            <article>
              <Clock3 size={18} aria-hidden="true" />
              <span>Delivery</span>
              <strong>{record.agreedDeliveryDays} days</strong>
            </article>
            <article>
              <RotateCcw size={18} aria-hidden="true" />
              <span>Revision rounds</span>
              <strong>{freelanceRevisionsRemaining} remaining</strong>
              <small>
                {record.revisionRequestsUsed} of {record.agreedRevisions ?? 1} used
              </small>
            </article>
          </div>
          <small>
            SkillBridge records these terms but does not process payments.
          </small>
        </section>
      ) : null}

      {record.opportunityType === OpportunityTypes.UniversityTraining ? (
        <>
          <section id="training-record" className="training-supervision-summary">
          <div>
            <span>Student university</span>
            <strong>{record.studentUniversityName ?? "Not provided"}</strong>
            <small>
              Student number: {record.studentNumber ?? "Not provided"}
            </small>
          </div>
          <div>
            <span>University supervisor</span>
            <strong>
              {record.universitySupervisorName ?? "Not assigned"}
            </strong>
            <small>{record.universityName ?? "Select a supervisor below"}</small>
          </div>
          <div>
            <span>Academic status</span>
            <strong>
              {record.academicRequirementsMet
                ? "Requirements confirmed"
                : "Awaiting university confirmation"}
            </strong>
            <small>
              {record.universityProgressNotes ?? "No progress note yet"}
            </small>
          </div>
          {isCompany ? (
            <label className="field">
              <span>Assign university supervisor</span>
              <select
                value={record.universitySupervisorId ?? ""}
                disabled={busyKey === "assign-supervisor"}
                onChange={(event) => {
                  const supervisorId = Number(event.target.value);
                  if (!supervisorId) return;
                  void runAction("assign-supervisor", () =>
                    assignUniversitySupervisorAsync(
                      record.applicationId,
                      supervisorId,
                    ),
                  );
                }}
              >
                <option value="">Choose supervisor</option>
                {eligibleSupervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.fullName} - {supervisor.universityName}
                  </option>
                ))}
              </select>
              {eligibleSupervisors.length === 0 ? (
                <small>
                  No supervisor from {record.studentUniversityName} is available.
                </small>
              ) : null}
            </label>
          ) : null}
          {record.academicRequirements ? (
            <div>
              <span>Academic requirements</span>
              <strong>{record.academicRequirements}</strong>
            </div>
          ) : null}
          </section>
          <TrainingReportsPanel
            mode={isCompany ? "company" : "student"}
            record={record}
            onUpdated={async () => {
              await load();
              await onWorkUpdated?.();
            }}
          />
        </>
      ) : null}

      {record.opportunityType === OpportunityTypes.TeamProject ? (
        <section id="contribution-record" className="team-responsibility-record">
          <header>
            <span>Individual contribution record</span>
            <strong>Assigned responsibilities</strong>
          </header>
          <section
            className="contribution-confidence"
            aria-label="Contribution confidence record"
            data-resolution={record.contributionRecord?.status ?? "pending"}
          >
            <header>
              <span>Contribution confidence</span>
              <strong>
                {record.contributionRecord?.status === ContributionResolutionStatuses.Locked
                  ? "Resolved and locked"
                  : "Attribution still in review"}
              </strong>
            </header>
            <div>
              <article className={record.assignedResponsibilities ? "complete" : "pending"}>
                <span>1</span>
                <strong>Responsibilities</strong>
                <small>{record.assignedResponsibilities ? "Provider-defined" : "Awaiting provider definition"}</small>
              </article>
              <article className={record.contributionRecord?.declaration ? "complete" : "pending"}>
                <span>2</span>
                <strong>Participant declaration</strong>
                <small>{record.contributionRecord?.declaration ? "Recorded" : "Not yet recorded"}</small>
              </article>
              <article
                className={
                  record.contributionRecord?.status === ContributionResolutionStatuses.Disputed
                    ? "disputed"
                    : record.contributionRecord?.reviews.length
                      ? "complete"
                      : "pending"
                }
              >
                <span>3</span>
                <strong>Affected-member review</strong>
                <small>{record.contributionRecord?.reviews.length ? `${record.contributionRecord.reviews.length}/${record.contributionRecord.requiredReviewerCount} reviewed` : "Awaiting review"}</small>
              </article>
              <article
                className={
                  record.contributionRecord?.status === ContributionResolutionStatuses.Locked
                    ? "complete"
                    : record.contributionRecord?.status === ContributionResolutionStatuses.Disputed
                      ? "disputed"
                      : "pending"
                }
              >
                <span>4</span>
                <strong>Provider resolution</strong>
                <small>{record.contributionRecord?.status === ContributionResolutionStatuses.Locked ? "Locked for evidence" : "Required before issuance"}</small>
              </article>
            </div>
          </section>
          {isCompany &&
          canEditMilestones &&
          record.projectStatus !== ProjectStatuses.Completed &&
          record.projectStatus !== ProjectStatuses.Cancelled ? (
            <div className="work-inline-form">
              <textarea
                value={responsibilityDraft}
                minLength={10}
                maxLength={2000}
                placeholder={`Define what ${record.jobSeekerName} is responsible for`}
                onChange={(event) =>
                  setResponsibilityDrafts((current) => ({
                    ...current,
                    [record.applicationId]: event.target.value,
                  }))
                }
              />
              <Button
                type="button"
                disabled={responsibilityDraft.trim().length < 10}
                isLoading={busyKey === "save-responsibilities"}
                onClick={() =>
                  void runAction("save-responsibilities", () =>
                    updateContributionResponsibilitiesAsync(
                      record.applicationId,
                      { responsibilities: responsibilityDraft.trim() },
                    ),
                  )
                }
              >
                <ClipboardCheck size={16} aria-hidden="true" />
                Save responsibilities
              </Button>
            </div>
          ) : (
            <p>
              {record.assignedResponsibilities ??
                "The provider has not assigned your responsibilities yet."}
            </p>
          )}
          {record.contributionSummary ? (
            <div className="team-completed-contribution">
              <span>Completed contribution</span>
              <p>{record.contributionSummary}</p>
            </div>
          ) : null}
          {record.contributionRecord ? (
            <div className="team-completed-contribution">
              <span>Attribution status</span>
              <p>
                {record.contributionRecord.status ===
                ContributionResolutionStatuses.Locked
                  ? "Locked for evidence issuance"
                  : record.contributionRecord.status ===
                      ContributionResolutionStatuses.Disputed
                    ? "Disputed; provider resolution required"
                    : "Awaiting member review or provider resolution"}
              </p>
              {record.contributionRecord.resolutionNote ? (
                <small>{record.contributionRecord.resolutionNote}</small>
              ) : null}
            </div>
          ) : null}
          {!isCompany && record.contributionRecord &&
          record.contributionRecord.status !== ContributionResolutionStatuses.Locked ? (
            <div className="work-inline-form">
              <textarea
                value={contribution}
                minLength={20}
                maxLength={3000}
                placeholder="Clarify your participant-specific contribution"
                onChange={(event) => setContribution(event.target.value)}
              />
              <Button
                type="button"
                disabled={contribution.trim().length < 20}
                isLoading={busyKey === "declare-contribution"}
                onClick={() =>
                  void runAction("declare-contribution", () =>
                    declareContributionAsync(record.applicationId, {
                      declaration: contribution.trim(),
                      attributedWork: record.finalDeliverableUrl ?? undefined,
                    }),
                  )
                }
              >
                Update declaration
              </Button>
            </div>
          ) : null}
          {isCompany && record.contributionRecord &&
          record.contributionRecord.status !== ContributionResolutionStatuses.Locked ? (
            <div className="work-inline-form">
              <textarea
                value={contributionResolutionNote}
                minLength={10}
                maxLength={2000}
                placeholder="Record how disputes or non-response were resolved"
                onChange={(event) => setContributionResolutionNote(event.target.value)}
              />
              <Button
                type="button"
                disabled={contributionResolutionNote.trim().length < 10}
                isLoading={busyKey === "resolve-contribution"}
                onClick={() =>
                  void runAction("resolve-contribution", () =>
                    resolveContributionAsync(record.applicationId, {
                      resolutionNote: contributionResolutionNote.trim(),
                    }),
                  )
                }
              >
                Resolve and lock attribution
              </Button>
            </div>
          ) : null}
          {!isCompany && projectContributionReviews.length > 0 ? (
            <div className="contribution-review-queue">
              <strong>Team attribution to review</strong>
              {projectContributionReviews.map((task) => (
                <article key={task.targetApplicationId}>
                  <span>{task.participantName}</span>
                  <p>{task.declaration}</p>
                  {task.attributedWork ? <small>{task.attributedWork}</small> : null}
                  <textarea
                    value={contributionReviewComments[task.targetApplicationId] ?? ""}
                    placeholder="Required when disputing this attribution"
                    onChange={(event) =>
                      setContributionReviewComments((current) => ({
                        ...current,
                        [task.targetApplicationId]: event.target.value,
                      }))
                    }
                  />
                  <div className="work-final-actions">
                    <Button
                      type="button"
                      isLoading={busyKey === `confirm-${task.targetApplicationId}`}
                      onClick={() =>
                        void runAction(`confirm-${task.targetApplicationId}`, () =>
                          reviewContributionAsync(task.targetApplicationId, {
                            decision: ContributionReviewDecisions.Confirmed,
                          }),
                        )
                      }
                    >
                      Confirm attribution
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        (contributionReviewComments[task.targetApplicationId] ?? "")
                          .trim().length < 3
                      }
                      onClick={() =>
                        void runAction(`dispute-${task.targetApplicationId}`, () =>
                          reviewContributionAsync(task.targetApplicationId, {
                            decision: ContributionReviewDecisions.Disputed,
                            comment: contributionReviewComments[
                              task.targetApplicationId
                            ]?.trim(),
                          }),
                        )
                      }
                    >
                      Dispute attribution
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <div id="work-milestones" className="work-milestone-list">
        {record.milestones.length === 0 ? (
          <p className="work-empty-copy">
            No detailed milestones have been added yet.
          </p>
        ) : (
          record.milestones.map((milestone, index) => {
            const draft = milestoneDrafts[milestone.id] ?? {
              note: "",
              url: "",
              feedback: "",
            };
            return (
              <article
                id={`work-milestone-${milestone.id}`}
                className="work-milestone"
                key={milestone.id}
              >
                <div className="work-milestone-index">{index + 1}</div>
                <div>
                  <header>
                    <div>
                      <strong>{milestone.title}</strong>
                      <span>
                        {milestone.dueDate
                          ? `Due ${milestone.dueDate}`
                          : "No due date"}
                      </span>
                    </div>
                    <StatusBadge
                      tone={
                        milestone.status === MilestoneStatuses.Approved
                          ? "green"
                          : milestone.status ===
                              MilestoneStatuses.ChangesRequested
                            ? "red"
                            : "neutral"
                      }
                    >
                      {getMilestoneStatusLabel(milestone.status)}
                    </StatusBadge>
                  </header>
                  {milestone.description ? <p>{milestone.description}</p> : null}
                  {milestone.submissionNote ? (
                    <div className="work-submission-copy">
                      <strong>Submission</strong>
                      <p>{milestone.submissionNote}</p>
                      {milestone.submissionUrl ? (
                        <a
                          href={milestone.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  {milestone.feedback ? (
                    <div className="notice milestone-feedback-notice">
                      <strong>Provider feedback</strong>
                      <span>{milestone.feedback}</span>
                    </div>
                  ) : null}

                  {!isCompany &&
                  isWorkActive &&
                  (milestone.status === MilestoneStatuses.Planned ||
                    milestone.status === MilestoneStatuses.ChangesRequested) ? (
                    <div className="work-inline-form">
                      <textarea
                        aria-label={`Submission note for ${milestone.title}`}
                        placeholder="Describe what you completed"
                        value={draft.note}
                        onChange={(event) =>
                          setMilestoneDraft(
                            milestone.id,
                            "note",
                            event.target.value,
                          )
                        }
                      />
                      <input
                        aria-label={`Submission link for ${milestone.title}`}
                        type="url"
                        placeholder="Deliverable link (optional)"
                        value={draft.url}
                        onChange={(event) =>
                          setMilestoneDraft(
                            milestone.id,
                            "url",
                            event.target.value,
                          )
                        }
                      />
                      <Button
                        type="button"
                        disabled={draft.note.trim().length < 10}
                        isLoading={busyKey === `submit-${milestone.id}`}
                        onClick={() =>
                          void runAction(`submit-${milestone.id}`, () =>
                            submitMilestoneAsync(milestone.id, {
                              submissionNote: draft.note.trim(),
                              submissionUrl: draft.url.trim() || undefined,
                            }),
                          )
                        }
                      >
                        <Send size={16} aria-hidden="true" />
                        Submit milestone
                      </Button>
                    </div>
                  ) : null}

                  {isCompany &&
                  milestone.status === MilestoneStatuses.Submitted ? (
                    <div className="work-inline-form">
                      <textarea
                        aria-label={`Feedback for ${milestone.title}`}
                        placeholder="Feedback for the participant"
                        value={draft.feedback}
                        onChange={(event) =>
                          setMilestoneDraft(
                            milestone.id,
                            "feedback",
                            event.target.value,
                          )
                        }
                      />
                      <div>
                        <Button
                          type="button"
                          isLoading={busyKey === `approve-${milestone.id}`}
                          onClick={() =>
                            void runAction(`approve-${milestone.id}`, () =>
                              reviewMilestoneAsync(milestone.id, {
                                isApproved: true,
                                feedback: draft.feedback.trim() || undefined,
                              }),
                            )
                          }
                        >
                          <Check size={16} aria-hidden="true" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!draft.feedback.trim()}
                          isLoading={busyKey === `return-${milestone.id}`}
                          onClick={() =>
                            void runAction(`return-${milestone.id}`, () =>
                              reviewMilestoneAsync(milestone.id, {
                                isApproved: false,
                                feedback: draft.feedback.trim(),
                              }),
                            )
                          }
                        >
                          <RotateCcw size={16} aria-hidden="true" />
                          Request changes
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>

      {isCompany &&
      canEditMilestones &&
      record.projectStatus !== ProjectStatuses.Completed &&
      record.projectStatus !== ProjectStatuses.Cancelled ? (
        <form className="work-add-milestone" onSubmit={handleCreateMilestone}>
          <strong>Add milestone for {record.jobSeekerName}</strong>
          <div className="company-form-grid">
            <label className="field">
              <span>Title</span>
              <input
                value={milestoneTitle}
                maxLength={150}
                required
                onChange={(event) => setMilestoneTitle(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={milestoneDueDate}
                onChange={(event) => setMilestoneDueDate(event.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              value={milestoneDescription}
              maxLength={1500}
              onChange={(event) => setMilestoneDescription(event.target.value)}
            />
          </label>
          <Button type="submit" isLoading={busyKey === "create-milestone"}>
            <Plus size={16} aria-hidden="true" />
            Add milestone
          </Button>
        </form>
      ) : null}

      {isCompany &&
      record.workStatus === WorkSubmissionStatuses.Submitted ? (
        <section id="final-review" className="work-final-review">
          <section className="work-approval-standard">
            <header>
              <span>Approval standard</span>
              <strong>Review against the original opportunity</strong>
            </header>
            <dl>
              <div>
                <dt>Required deliverables</dt>
                <dd>{record.deliverables}</dd>
              </div>
              <div>
                <dt>Evaluation criteria</dt>
                <dd>{record.evaluationCriteria}</dd>
              </div>
            </dl>
          </section>
          <div>
            <strong>Review final work</strong>
            <p>{record.finalSubmissionNote}</p>
            {record.contributionSummary ? (
              <p>
                <strong>Completed contribution:</strong>{" "}
                {record.contributionSummary}
              </p>
            ) : null}
            {record.assignedResponsibilities ? (
              <p>
                <strong>Assigned responsibilities:</strong>{" "}
                {record.assignedResponsibilities}
              </p>
            ) : null}
            {record.finalDeliverableUrl ? (
              <a
                href={record.finalDeliverableUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open deliverable <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <fieldset className="work-criterion-review">
            <legend>Criterion-by-criterion evaluation</legend>
            <p>
              Record what in the submission supports each decision. Approval is
              blocked while any criterion still needs improvement.
            </p>
            <div className="work-criterion-list">
              {evidenceCriteria.map((criterion, index) => (
                <section key={getCriterionDraftKey(criterion, index)}>
                  <header>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{criterion.title}</strong>
                    <StatusBadge tone={criterion.isRequired ? "blue" : "neutral"}>
                      {criterion.isRequired ? "Required" : "Optional"}
                    </StatusBadge>
                  </header>
                  <label className="field">
                    <span>Result</span>
                    <select
                      value={
                        criterionDrafts[getCriterionDraftKey(criterion, index)]
                          ?.rating ?? 0
                      }
                      required
                      onChange={(event) =>
                        setCriterionDraftsByApplication((current) => ({
                          ...current,
                          [record.applicationId]: {
                            ...criterionDrafts,
                            [getCriterionDraftKey(criterion, index)]: {
                              rating: Number(event.target.value),
                              note:
                                criterionDrafts[
                                  getCriterionDraftKey(criterion, index)
                                ]?.note ?? "",
                            },
                          },
                        }))
                      }
                    >
                      <option value={0}>Choose a result</option>
                      {criterion.evaluationType === 1 ? (
                        <>
                          <option value={CriterionRatings.NeedsImprovement}>
                            Fail
                          </option>
                          <option value={CriterionRatings.MeetsStandard}>
                            Pass
                          </option>
                        </>
                      ) : (
                        <>
                          <option value={CriterionRatings.NeedsImprovement}>
                            Needs improvement
                          </option>
                          <option value={CriterionRatings.MeetsStandard}>
                            Meets the standard
                          </option>
                          <option value={CriterionRatings.ExceedsStandard}>
                            Exceeds the standard
                          </option>
                        </>
                      )}
                    </select>
                  </label>
                  <label className="field">
                    <span>Evidence note</span>
                    <textarea
                      value={
                        criterionDrafts[getCriterionDraftKey(criterion, index)]
                          ?.note ?? ""
                      }
                      minLength={3}
                      maxLength={1000}
                      required
                      placeholder="Point to the part of the submission that supports this result."
                      onChange={(event) =>
                        setCriterionDraftsByApplication((current) => ({
                          ...current,
                          [record.applicationId]: {
                            ...criterionDrafts,
                            [getCriterionDraftKey(criterion, index)]: {
                              rating:
                                criterionDrafts[
                                  getCriterionDraftKey(criterion, index)
                                ]?.rating ?? 0,
                              note: event.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                </section>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Overall evaluation</span>
            <textarea
              value={evaluation}
              minLength={10}
              required
              onChange={(event) => setEvaluation(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Feedback (required when requesting changes)</span>
            <textarea
              value={finalFeedback}
              onChange={(event) => setFinalFeedback(event.target.value)}
            />
          </label>
          {record.availableSkills.length > 0 ? (
            <fieldset className="work-demonstrated-skills">
              <legend>Skills demonstrated in the completed work</legend>
              <p>Select only the skills that this result provides evidence for.</p>
              {record.availableSkills.map((skill) => (
                <label key={skill.id}>
                  <input
                    type="checkbox"
                    checked={demonstratedSkillIds.includes(skill.id)}
                    onChange={(event) =>
                      setDemonstratedSkillIds((current) =>
                        event.target.checked
                          ? [...current, skill.id]
                          : current.filter((id) => id !== skill.id),
                      )
                    }
                  />
                  <span>{skill.name}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
          <div className="work-final-actions">
            <Button
              type="button"
              disabled={
                evaluation.trim().length < 10 ||
                !criteriaMeetApprovalStandard ||
                (record.availableSkills.length > 0 &&
                  demonstratedSkillIds.length === 0)
              }
              isLoading={busyKey === "approve-final"}
              onClick={() =>
                void runAction("approve-final", () =>
                  reviewFinalWorkByCompanyAsync(record.applicationId, {
                    isApproved: true,
                    evaluationResult: evaluation.trim(),
                    feedback: finalFeedback.trim() || undefined,
                    demonstratedSkillIds,
                    criterionEvaluations: criterionEvaluations.map(
                      toCriterionEvaluationPayload,
                    ),
                  }),
                )
              }
            >
              <UserRoundCheck size={17} aria-hidden="true" />
              Approve final work
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={
                evaluation.trim().length < 10 ||
                !criteriaComplete ||
                !finalFeedback.trim()
              }
              isLoading={busyKey === "return-final"}
              onClick={() =>
                void runAction("return-final", () =>
                  reviewFinalWorkByCompanyAsync(record.applicationId, {
                    isApproved: false,
                    evaluationResult: evaluation.trim(),
                    feedback: finalFeedback.trim(),
                    criterionEvaluations: criterionEvaluations.map(
                      toCriterionEvaluationPayload,
                    ),
                  }),
                )
              }
            >
              <RotateCcw size={17} aria-hidden="true" />
              Request changes
            </Button>
          </div>
        </section>
      ) : null}

      {record.workStatus === WorkSubmissionStatuses.ChangesRequested &&
      (record.companyFeedback || record.universityEvaluation) ? (
        <div className="notice notice-error">
          <strong>Changes requested</strong>
          <span>
            {record.universityEvaluation ?? record.companyFeedback}
          </span>
        </div>
      ) : null}
      {record.workStatus ===
      WorkSubmissionStatuses.AwaitingUniversityApproval ? (
        <div className="notice">
          Company approval is complete. The university supervisor must now
          confirm the final training result.
        </div>
      ) : null}
      {record.workStatus === WorkSubmissionStatuses.Approved ? (
        <div className="notice notice-success">
          <strong>Final work approved</strong>
          <span>
            {record.hasEvidenceCard
              ? "The Evidence Card has been created privately in the participant's portfolio."
              : "Approval is complete, but evidence issuance remains blocked until every readiness condition is satisfied."}
          </span>
          {record.demonstratedSkills.length > 0 ? (
            <span>
              Demonstrated skills:{" "}
              {record.demonstratedSkills.map((skill) => skill.name).join(", ")}
            </span>
          ) : null}
        </div>
      ) : null}

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}
    </section>
  );
}
