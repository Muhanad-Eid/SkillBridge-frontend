import { type FormEvent, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileClock,
  Pencil,
  RotateCcw,
  Send,
  UserRoundCheck,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import { ProjectStatuses } from "../../projects/domain/projectTypes";
import {
  getTrainingReportStatusLabel,
  TrainingReportStatuses,
  type SubmitTrainingReportRequest,
  type WorkRecord,
} from "../domain/workTypes";
import {
  reviewTrainingReportAsync,
  reviseTrainingReportAsync,
  submitTrainingReportAsync,
  updateTrainingSupervisionAsync,
} from "../infrastructure/workApi";

type TrainingReportsPanelProps = {
  mode: "student" | "company" | "university";
  record: WorkRecord;
  onUpdated: () => Promise<unknown>;
};

const emptyReport: SubmitTrainingReportRequest = {
  periodStart: "",
  periodEnd: "",
  hours: 1,
  tasksCompleted: "",
  learningOutcomes: "",
  challenges: "",
  evidenceUrl: "",
};

export default function TrainingReportsPanel({
  mode,
  record,
  onUpdated,
}: TrainingReportsPanelProps) {
  const [report, setReport] =
    useState<SubmitTrainingReportRequest>(emptyReport);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<Record<number, string>>(
    {},
  );
  const [supervisorDrafts, setSupervisorDrafts] = useState<
    Record<number, { name: string; email: string }>
  >({});
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supervisorDraft = supervisorDrafts[record.applicationId] ?? {
    name: record.companySupervisorName ?? "",
    email: record.companySupervisorEmail ?? "",
  };
  const approvedReports = record.trainingReports.filter(
    (item) => item.status === TrainingReportStatuses.Approved,
  ).length;
  const pendingReports = record.trainingReports.filter(
    (item) => item.status === TrainingReportStatuses.Submitted,
  ).length;
  const canSubmitReport =
    mode === "student" &&
    record.projectStatus === ProjectStatuses.InProgress &&
    record.workStatus !== WorkSubmissionStatuses.Submitted &&
    record.workStatus !== WorkSubmissionStatuses.AwaitingUniversityApproval &&
    record.workStatus !== WorkSubmissionStatuses.Approved;

  function setReportField<K extends keyof SubmitTrainingReportRequest>(
    field: K,
    value: SubmitTrainingReportRequest[K],
  ) {
    setReport((current) => ({ ...current, [field]: value }));
  }

  function setSupervisorField(field: "name" | "email", value: string) {
    setSupervisorDrafts((current) => ({
      ...current,
      [record.applicationId]: {
        name:
          field === "name"
            ? value
            : current[record.applicationId]?.name ??
              record.companySupervisorName ??
              "",
        email:
          field === "email"
            ? value
            : current[record.applicationId]?.email ??
              record.companySupervisorEmail ??
              "",
      },
    }));
  }

  async function runAction(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage("Training record updated.");
      await onUpdated();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the training record.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = {
      ...report,
      tasksCompleted: report.tasksCompleted.trim(),
      learningOutcomes: report.learningOutcomes.trim(),
      challenges: report.challenges?.trim() || undefined,
      evidenceUrl: report.evidenceUrl?.trim() || undefined,
    };

    await runAction(
      editingReportId ? `revise-${editingReportId}` : "submit-report",
      () =>
        editingReportId
          ? reviseTrainingReportAsync(editingReportId, request)
          : submitTrainingReportAsync(record.applicationId, request),
    );
    setReport(emptyReport);
    setEditingReportId(null);
  }

  function beginRevision(reportId: number) {
    const selected = record.trainingReports.find(
      (item) => item.id === reportId,
    );
    if (!selected) return;
    setEditingReportId(reportId);
    setReport({
      periodStart: selected.periodStart,
      periodEnd: selected.periodEnd,
      hours: selected.hours,
      tasksCompleted: selected.tasksCompleted,
      learningOutcomes: selected.learningOutcomes,
      challenges: selected.challenges ?? "",
      evidenceUrl: selected.evidenceUrl ?? "",
    });
  }

  return (
    <section className="training-report-panel">
      <header>
        <div>
          <span>Training record</span>
          <h3>Reports, hours, and learning outcomes</h3>
        </div>
        <div className="training-report-counts">
          <strong>{record.completedTrainingHours}</strong>
          <span>of {record.requiredTrainingHours ?? "?"} approved hours</span>
        </div>
      </header>

      <div className="training-report-overview">
        <article>
          <FileClock size={18} aria-hidden="true" />
          <span>Reports</span>
          <strong>{record.trainingReports.length}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>Approved</span>
          <strong>{approvedReports}</strong>
        </article>
        <article>
          <FileClock size={18} aria-hidden="true" />
          <span>Awaiting review</span>
          <strong>{pendingReports}</strong>
        </article>
      </div>

      <section className="training-supervisor-card">
        <header>
          <span>Company supervision</span>
          <strong>
            {record.companySupervisorName ?? "Supervisor not assigned"}
          </strong>
          {record.companySupervisorEmail ? (
            <small>{record.companySupervisorEmail}</small>
          ) : null}
        </header>
        {mode === "company" &&
        record.workStatus !== WorkSubmissionStatuses.Approved ? (
          <div className="company-form-grid">
            <label className="field">
              <span>Supervisor name</span>
              <input
                value={supervisorDraft.name}
                maxLength={150}
                onChange={(event) =>
                  setSupervisorField("name", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span>Work email (optional)</span>
              <input
                type="email"
                value={supervisorDraft.email}
                maxLength={254}
                onChange={(event) =>
                  setSupervisorField("email", event.target.value)
                }
              />
            </label>
            <Button
              type="button"
              disabled={supervisorDraft.name.trim().length < 2}
              isLoading={busyKey === "save-company-supervisor"}
              onClick={() =>
                void runAction("save-company-supervisor", () =>
                  updateTrainingSupervisionAsync(record.applicationId, {
                    supervisorName: supervisorDraft.name.trim(),
                    supervisorEmail:
                      supervisorDraft.email.trim() || undefined,
                  }),
                )
              }
            >
              <UserRoundCheck size={16} aria-hidden="true" />
              Save supervisor
            </Button>
          </div>
        ) : null}
      </section>

      {record.trainingReports.length === 0 ? (
        <p className="work-empty-copy">
          No training reports have been submitted yet.
        </p>
      ) : (
        <div className="training-report-list">
          {record.trainingReports.map((item) => (
            <article key={item.id}>
              <header>
                <div>
                  <span>
                    {item.periodStart} to {item.periodEnd}
                  </span>
                  <strong>{item.hours} training hours</strong>
                </div>
                <StatusBadge
                  tone={
                    item.status === TrainingReportStatuses.Approved
                      ? "green"
                      : item.status ===
                          TrainingReportStatuses.ChangesRequested
                        ? "red"
                        : "blue"
                  }
                >
                  {getTrainingReportStatusLabel(item.status)}
                </StatusBadge>
              </header>
              <dl>
                <div>
                  <dt>Tasks completed</dt>
                  <dd>{item.tasksCompleted}</dd>
                </div>
                <div>
                  <dt>Learning outcomes</dt>
                  <dd>{item.learningOutcomes}</dd>
                </div>
                {item.challenges ? (
                  <div>
                    <dt>Challenges and support needed</dt>
                    <dd>{item.challenges}</dd>
                  </div>
                ) : null}
              </dl>
              {item.evidenceUrl ? (
                <a href={item.evidenceUrl} target="_blank" rel="noreferrer">
                  Open supporting evidence
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              {item.companyFeedback ? (
                <div className="notice">
                  <strong>Company feedback</strong>
                  <span>{item.companyFeedback}</span>
                </div>
              ) : null}

              {mode === "company" &&
              item.status === TrainingReportStatuses.Submitted ? (
                <div className="training-report-review">
                  <textarea
                    aria-label={`Feedback for report ${item.id}`}
                    placeholder="Feedback for the student"
                    value={reviewFeedback[item.id] ?? ""}
                    onChange={(event) =>
                      setReviewFeedback((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                  />
                  <div>
                    <Button
                      type="button"
                      isLoading={busyKey === `approve-report-${item.id}`}
                      onClick={() =>
                        void runAction(`approve-report-${item.id}`, () =>
                          reviewTrainingReportAsync(item.id, {
                            isApproved: true,
                            feedback:
                              reviewFeedback[item.id]?.trim() || undefined,
                          }),
                        )
                      }
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Approve report
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!reviewFeedback[item.id]?.trim()}
                      isLoading={busyKey === `return-report-${item.id}`}
                      onClick={() =>
                        void runAction(`return-report-${item.id}`, () =>
                          reviewTrainingReportAsync(item.id, {
                            isApproved: false,
                            feedback: reviewFeedback[item.id].trim(),
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

              {mode === "student" &&
              item.status === TrainingReportStatuses.ChangesRequested ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => beginRevision(item.id)}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Revise report
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {canSubmitReport ? (
        <form className="training-report-form" onSubmit={submitReport}>
          <header>
            <span>{editingReportId ? "Correct report" : "Weekly report"}</span>
            <strong>
              {editingReportId
                ? "Revise the requested details"
                : "Record completed training"}
            </strong>
          </header>
          <div className="company-form-grid">
            <label className="field">
              <span>Period start</span>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={report.periodStart}
                required
                onChange={(event) =>
                  setReportField("periodStart", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span>Period end</span>
              <input
                type="date"
                min={report.periodStart || undefined}
                max={new Date().toISOString().slice(0, 10)}
                value={report.periodEnd}
                required
                onChange={(event) =>
                  setReportField("periodEnd", event.target.value)
                }
              />
            </label>
            <label className="field">
              <span>Hours completed</span>
              <input
                type="number"
                min="1"
                max="168"
                value={report.hours}
                required
                onChange={(event) =>
                  setReportField("hours", Number(event.target.value))
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Tasks completed</span>
            <textarea
              value={report.tasksCompleted}
              minLength={10}
              maxLength={3000}
              required
              onChange={(event) =>
                setReportField("tasksCompleted", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>What did you learn?</span>
            <textarea
              value={report.learningOutcomes}
              minLength={10}
              maxLength={3000}
              required
              onChange={(event) =>
                setReportField("learningOutcomes", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Challenges or support needed (optional)</span>
            <textarea
              value={report.challenges}
              maxLength={2000}
              onChange={(event) =>
                setReportField("challenges", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Supporting link (optional)</span>
            <input
              type="url"
              value={report.evidenceUrl}
              onChange={(event) =>
                setReportField("evidenceUrl", event.target.value)
              }
            />
          </label>
          <div>
            <Button
              type="submit"
              isLoading={
                busyKey === "submit-report" ||
                busyKey === `revise-${editingReportId}`
              }
            >
              <Send size={16} aria-hidden="true" />
              {editingReportId ? "Resubmit report" : "Submit report"}
            </Button>
            {editingReportId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingReportId(null);
                  setReport(emptyReport);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}
    </section>
  );
}
