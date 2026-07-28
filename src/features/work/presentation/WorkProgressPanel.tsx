import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardCheck,
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
  OpportunityTypes,
  ProjectStatuses,
} from "../../projects/domain/projectTypes";
import {
  getMilestoneStatusLabel,
  getWorkSubmissionStatusLabel,
  MilestoneStatuses,
  type UniversitySupervisor,
  type WorkRecord,
} from "../domain/workTypes";
import {
  assignUniversitySupervisorAsync,
  createWorkMilestoneAsync,
  getProjectWorkAsync,
  getUniversitySupervisorsAsync,
  reviewFinalWorkByCompanyAsync,
  reviewMilestoneAsync,
  submitFinalWorkAsync,
  submitMilestoneAsync,
} from "../infrastructure/workApi";

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
  const [evaluation, setEvaluation] = useState("");
  const [finalFeedback, setFinalFeedback] = useState("");
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
              onClick={() => setSelectedApplicationId(item.applicationId)}
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

      {record.opportunityType === OpportunityTypes.UniversityTraining ? (
        <section className="training-supervision-summary">
          <div>
            <span>University supervisor</span>
            <strong>
              {record.universitySupervisorName ?? "Not assigned"}
            </strong>
            <small>{record.universityName ?? "Select a supervisor below"}</small>
          </div>
          <div>
            <span>Training hours</span>
            <strong>
              {record.completedTrainingHours} /{" "}
              {record.requiredTrainingHours ?? "—"}
            </strong>
            <small>{record.universityProgressNotes ?? "No progress note yet"}</small>
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
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.fullName} · {supervisor.universityName}
                  </option>
                ))}
              </select>
            </label>
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
                    <div className="notice">
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
              <span>Your individual contribution</span>
              <textarea
                value={contribution}
                maxLength={2000}
                required
                onChange={(event) => setContribution(event.target.value)}
              />
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
          <div>
            <strong>Review final work</strong>
            <p>{record.finalSubmissionNote}</p>
            {record.contributionSummary ? (
              <p>
                <strong>Contribution:</strong> {record.contributionSummary}
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
          <label className="field">
            <span>Evaluation result</span>
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
          <div className="work-final-actions">
            <Button
              type="button"
              disabled={evaluation.trim().length < 10}
              isLoading={busyKey === "approve-final"}
              onClick={() =>
                void runAction("approve-final", () =>
                  reviewFinalWorkByCompanyAsync(record.applicationId, {
                    isApproved: true,
                    evaluationResult: evaluation.trim(),
                    feedback: finalFeedback.trim() || undefined,
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
                evaluation.trim().length < 10 || !finalFeedback.trim()
              }
              isLoading={busyKey === "return-final"}
              onClick={() =>
                void runAction("return-final", () =>
                  reviewFinalWorkByCompanyAsync(record.applicationId, {
                    isApproved: false,
                    evaluationResult: evaluation.trim(),
                    feedback: finalFeedback.trim(),
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
            The Evidence Card has been created privately in the participant’s
            portfolio.
          </span>
        </div>
      ) : null}

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}
    </section>
  );
}
