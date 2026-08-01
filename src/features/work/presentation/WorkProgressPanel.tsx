import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Plus,
  RotateCcw,
  Send,
  UserRoundCheck,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import StatusBadge from "../../../shared/components/StatusBadge";
import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import {
  FreelancePricingTypes,
  getFreelancePricingLabel,
  OpportunityTypes,
  ProjectStatuses,
} from "../../projects/domain/projectTypes";
import {
  CriterionRatings,
  getMilestoneStatusLabel,
  getWorkSubmissionStatusLabel,
  MilestoneStatuses,
  TrainingReportStatuses,
  type UniversitySupervisor,
  type WorkRecord,
} from "../domain/workTypes";
import {
  buildCriterionDrafts,
  parseEvaluationCriteria,
} from "../domain/workEvaluation";
import {
  assignUniversitySupervisorAsync,
  createWorkMilestoneAsync,
  getProjectWorkAsync,
  getUniversitySupervisorsAsync,
  reviewFinalWorkByCompanyAsync,
  reviewMilestoneAsync,
  submitFinalWorkAsync,
  submitMilestoneAsync,
  updateContributionResponsibilitiesAsync,
} from "../infrastructure/workApi";
import TrainingReportsPanel from "./TrainingReportsPanel";

type WorkProgressPanelProps = {
  isCompany: boolean;
  projectId: number;
};

export default function WorkProgressPanel({
  isCompany,
  projectId,
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
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [workData, supervisorData] = await Promise.all([
        getProjectWorkAsync(projectId),
        isCompany
          ? getUniversitySupervisorsAsync().catch(
              () => [] as UniversitySupervisor[],
            )
          : Promise.resolve([] as UniversitySupervisor[]),
      ]);
      setRecords(workData);
      setSupervisors(supervisorData);
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
      setIsLoading(false);
    }
  }, [isCompany, projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

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

  async function runAction(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    resetMessages();
    try {
      await action();
      setMessage("Work record updated.");
      await load();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the work record.",
      );
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

    await runAction("final-submit", () =>
      submitFinalWorkAsync(record.applicationId, {
        submissionNote: finalNote.trim(),
        deliverableUrl: finalUrl.trim() || undefined,
        contributionSummary: contribution.trim() || undefined,
      }),
    );
    setFinalNote("");
    setFinalUrl("");
    setContribution("");
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

  const isWorkActive = record.projectStatus === ProjectStatuses.InProgress;
  const canEditMilestones =
    record.workStatus === WorkSubmissionStatuses.NotSubmitted ||
    record.workStatus === WorkSubmissionStatuses.ChangesRequested;
  const canSubmitFinal =
    !isCompany &&
    isWorkActive &&
    canEditMilestones &&
    record.milestones.every(
      (milestone) => milestone.status === MilestoneStatuses.Approved,
    ) &&
    (record.opportunityType !== OpportunityTypes.UniversityTraining ||
      (record.trainingReports.every(
        (report) => report.status === TrainingReportStatuses.Approved,
      ) &&
        record.completedTrainingHours >=
          (record.requiredTrainingHours ?? 0)));
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
  const evaluationCriteria = parseEvaluationCriteria(
    record.evaluationCriteria,
  );
  const criterionDrafts =
    criterionDraftsByApplication[record.applicationId] ??
    buildCriterionDrafts(record);
  const criterionEvaluations = evaluationCriteria.map((criterion) => ({
    criterion,
    rating: criterionDrafts[criterion]?.rating ?? 0,
    note: criterionDrafts[criterion]?.note.trim() ?? "",
  }));
  const criteriaComplete = criterionEvaluations.every(
    (item) => item.rating > 0 && item.note.length >= 3,
  );
  const criteriaMeetApprovalStandard =
    criteriaComplete &&
    criterionEvaluations.every(
      (item) => item.rating !== CriterionRatings.NeedsImprovement,
    );

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
                setDemonstratedSkillIds([]);
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
          <section className="training-supervision-summary">
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
            onUpdated={load}
          />
        </>
      ) : null}

      {record.opportunityType === OpportunityTypes.TeamProject ? (
        <section className="team-responsibility-record">
          <header>
            <span>Individual contribution record</span>
            <strong>Assigned responsibilities</strong>
          </header>
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
        </section>
      ) : null}

      <div className="work-milestone-list">
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
              <article className="work-milestone" key={milestone.id}>
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

      {!isCompany && canSubmitFinal ? (
        <form className="work-final-form" onSubmit={handleFinalSubmission}>
          <div>
            <strong>Submit final work</strong>
            <p>
              This submission becomes an Evidence Card only after the required
              approval.
            </p>
          </div>
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
          <Button type="submit" isLoading={busyKey === "final-submit"}>
            <Send size={16} aria-hidden="true" />
            Submit final work
          </Button>
        </form>
      ) : null}

      {isCompany &&
      record.workStatus === WorkSubmissionStatuses.Submitted ? (
        <section className="work-final-review">
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
              {evaluationCriteria.map((criterion, index) => (
                <section key={criterion}>
                  <header>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{criterion}</strong>
                  </header>
                  <label className="field">
                    <span>Result</span>
                    <select
                      value={criterionDrafts[criterion]?.rating ?? 0}
                      required
                      onChange={(event) =>
                        setCriterionDraftsByApplication((current) => ({
                          ...current,
                          [record.applicationId]: {
                            ...criterionDrafts,
                            [criterion]: {
                            rating: Number(event.target.value),
                              note: criterionDrafts[criterion]?.note ?? "",
                            },
                          },
                        }))
                      }
                    >
                      <option value={0}>Choose a result</option>
                      <option value={CriterionRatings.NeedsImprovement}>
                        Needs improvement
                      </option>
                      <option value={CriterionRatings.MeetsStandard}>
                        Meets the standard
                      </option>
                      <option value={CriterionRatings.ExceedsStandard}>
                        Exceeds the standard
                      </option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Evidence note</span>
                    <textarea
                      value={criterionDrafts[criterion]?.note ?? ""}
                      minLength={3}
                      maxLength={1000}
                      required
                      placeholder="Point to the part of the submission that supports this result."
                      onChange={(event) =>
                        setCriterionDraftsByApplication((current) => ({
                          ...current,
                          [record.applicationId]: {
                            ...criterionDrafts,
                            [criterion]: {
                              rating: criterionDrafts[criterion]?.rating ?? 0,
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
                    criterionEvaluations: criterionEvaluations.map((item) => ({
                      ...item,
                      rating: item.rating as
                        | typeof CriterionRatings.NeedsImprovement
                        | typeof CriterionRatings.MeetsStandard
                        | typeof CriterionRatings.ExceedsStandard,
                    })),
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
                    criterionEvaluations: criterionEvaluations.map((item) => ({
                      ...item,
                      rating: item.rating as
                        | typeof CriterionRatings.NeedsImprovement
                        | typeof CriterionRatings.MeetsStandard
                        | typeof CriterionRatings.ExceedsStandard,
                    })),
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
            The Evidence Card has been created privately in the participant's
            portfolio.
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
