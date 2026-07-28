import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import { ProjectStatuses } from "../../projects/domain/projectTypes";
import {
  getWorkSubmissionStatusLabel,
  type WorkRecord,
} from "../domain/workTypes";
import {
  getUniversityWorkAsync,
  reviewFinalWorkByUniversityAsync,
  updateTrainingProgressAsync,
} from "../infrastructure/workApi";

export default function UniversityTrainingPage() {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [completedHours, setCompletedHours] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getUniversityWorkAsync();
      setRecords(data);
      const selectedRecord =
        data.find((item) => item.applicationId === selectedId) ?? data[0] ?? null;
      setSelectedId(selectedRecord?.applicationId ?? null);
      if (selectedRecord) {
        setCompletedHours(String(selectedRecord.completedTrainingHours));
        setProgressNotes(selectedRecord.universityProgressNotes ?? "");
        setEvaluation(selectedRecord.universityEvaluation ?? "");
        setFeedback("");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load supervised training.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const record = useMemo(
    () => records.find((item) => item.applicationId === selectedId) ?? null,
    [records, selectedId],
  );
  const canUpdateProgress =
    record?.projectStatus === ProjectStatuses.InProgress &&
    record.workStatus !== WorkSubmissionStatuses.Approved;

  function selectRecord(item: WorkRecord) {
    setSelectedId(item.applicationId);
    setCompletedHours(String(item.completedTrainingHours));
    setProgressNotes(item.universityProgressNotes ?? "");
    setEvaluation(item.universityEvaluation ?? "");
    setFeedback("");
  }

  async function runAction(action: string, callback: () => Promise<unknown>) {
    setBusyAction(action);
    setError("");
    setMessage("");
    try {
      await callback();
      setMessage("Training record updated.");
      await load();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update training.",
      );
    } finally {
      setBusyAction("");
    }
  }

  async function saveProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record) return;
    await runAction("progress", () =>
      updateTrainingProgressAsync(
        record.applicationId,
        Number(completedHours),
        progressNotes.trim(),
      ),
    );
  }

  return (
    <section className="page university-training-page">
      <PageHeader title="Supervised training" />

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error && records.length > 0 ? (
        <div className="notice notice-error">{error}</div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={records.length === 0 ? error : ""}
        empty={!isLoading && !error && records.length === 0}
        emptyTitle="No students assigned"
        emptyDescription="Assigned University Training records will appear here."
      />

      {record ? (
        <div className="university-training-layout">
          <aside className="university-training-list">
            {records.map((item) => (
              <button
                type="button"
                className={item.applicationId === record.applicationId ? "active" : ""}
                key={item.applicationId}
                onClick={() => selectRecord(item)}
              >
                <span>{item.jobSeekerName}</span>
                <strong>{item.projectTitle}</strong>
                <small>{item.companyName}</small>
              </button>
            ))}
          </aside>

          <main className="university-training-record">
            <header>
              <div>
                <span>Training record #{record.applicationId}</span>
                <h2>{record.projectTitle}</h2>
                <p>{record.jobSeekerName}</p>
              </div>
              <StatusBadge
                tone={
                  record.workStatus === WorkSubmissionStatuses.Approved
                    ? "green"
                    : "amber"
                }
              >
                {getWorkSubmissionStatusLabel(record.workStatus)}
              </StatusBadge>
            </header>

            <div className="university-training-meta">
              <article>
                <Building2 size={18} aria-hidden="true" />
                <span>Provider</span>
                <strong>{record.companyName}</strong>
              </article>
              <article>
                <Clock3 size={18} aria-hidden="true" />
                <span>Required hours</span>
                <strong>{record.requiredTrainingHours ?? "Not set"}</strong>
              </article>
              <article>
                <GraduationCap size={18} aria-hidden="true" />
                <span>Completed hours</span>
                <strong>{record.completedTrainingHours}</strong>
              </article>
            </div>

            <form className="university-progress-form" onSubmit={saveProgress}>
              <h3>Progress monitoring</h3>
              <label className="field">
                <span>Completed training hours</span>
                <input
                  type="number"
                  min="0"
                  max={record.requiredTrainingHours ?? 2000}
                  value={completedHours}
                  required
                  disabled={!canUpdateProgress}
                  onChange={(event) => setCompletedHours(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Progress and academic notes</span>
                <textarea
                  value={progressNotes}
                  maxLength={3000}
                  required
                  disabled={!canUpdateProgress}
                  onChange={(event) => setProgressNotes(event.target.value)}
                />
              </label>
              <Button
                type="submit"
                disabled={!canUpdateProgress}
                isLoading={busyAction === "progress"}
              >
                Save progress
              </Button>
            </form>

            {record.finalSubmissionNote ? (
              <section className="university-final-review">
                <h3>Final training result</h3>
                <p>{record.finalSubmissionNote}</p>
                {record.finalDeliverableUrl ? (
                  <a
                    href={record.finalDeliverableUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open deliverable <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}
                {record.evaluationResult ? (
                  <div className="notice">
                    <strong>Company evaluation</strong>
                    <span>{record.evaluationResult}</span>
                  </div>
                ) : null}
              </section>
            ) : null}

            {record.workStatus ===
            WorkSubmissionStatuses.AwaitingUniversityApproval ? (
              <section className="university-approval-form">
                <h3>University approval</h3>
                <label className="field">
                  <span>Academic evaluation</span>
                  <textarea
                    value={evaluation}
                    minLength={10}
                    required
                    onChange={(event) => setEvaluation(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Feedback when requesting changes</span>
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                  />
                </label>
                <div>
                  <Button
                    type="button"
                    disabled={evaluation.trim().length < 10}
                    isLoading={busyAction === "approve"}
                    onClick={() =>
                      void runAction("approve", () =>
                        reviewFinalWorkByUniversityAsync(record.applicationId, {
                          isApproved: true,
                          evaluationResult: evaluation.trim(),
                        }),
                      )
                    }
                  >
                    <CheckCircle2 size={17} aria-hidden="true" />
                    Approve training
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      evaluation.trim().length < 10 || !feedback.trim()
                    }
                    isLoading={busyAction === "return"}
                    onClick={() =>
                      void runAction("return", () =>
                        reviewFinalWorkByUniversityAsync(record.applicationId, {
                          isApproved: false,
                          evaluationResult: evaluation.trim(),
                          feedback: feedback.trim(),
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
          </main>
        </div>
      ) : null}
    </section>
  );
}
