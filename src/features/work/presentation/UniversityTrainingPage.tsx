import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileDown,
  GraduationCap,
  MessageSquare,
  Printer,
  RotateCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { WorkSubmissionStatuses } from "../../applications/domain/applicationTypes";
import type { EvidenceReadiness } from "../../evidence/domain/evidenceTypes";
import { getEvidenceReadinessAsync } from "../../evidence/infrastructure/evidenceApi";
import EvidenceReadinessPanel from "../../evidence/presentation/EvidenceReadinessPanel";
import { ProjectStatuses } from "../../projects/domain/projectTypes";
import {
  getMilestoneStatusLabel,
  getWorkSubmissionStatusLabel,
  MilestoneStatuses,
  TrainingReportStatuses,
  type WorkRecord,
} from "../domain/workTypes";
import {
  getUniversityWorkAsync,
  downloadApprovedTrainingExportAsync,
  reviewFinalWorkByUniversityAsync,
  updateTrainingProgressAsync,
} from "../infrastructure/workApi";
import TrainingReportsPanel from "./TrainingReportsPanel";

export default function UniversityTrainingPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const [progressNotes, setProgressNotes] = useState("");
  const [academicRequirementsMet, setAcademicRequirementsMet] =
    useState(false);
  const [evaluation, setEvaluation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [readiness, setReadiness] = useState<EvidenceReadiness | null>(null);
  const [readinessError, setReadinessError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getUniversityWorkAsync();
      setRecords(data);
      const selectedRecord =
        data.find(
          (item) => item.applicationId === selectedIdRef.current,
        ) ?? data[0] ?? null;
      selectedIdRef.current = selectedRecord?.applicationId ?? null;
      setSelectedId(selectedRecord?.applicationId ?? null);
      if (selectedRecord) {
        setProgressNotes(selectedRecord.universityProgressNotes ?? "");
        setAcademicRequirementsMet(
          selectedRecord.academicRequirementsMet,
        );
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
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const record = useMemo(
    () => records.find((item) => item.applicationId === selectedId) ?? null,
    [records, selectedId],
  );
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((item) =>
      [
        item.jobSeekerName,
        item.projectTitle,
        item.companyName,
        item.studentNumber ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [records, search]);
  const pendingReportCount = records.reduce(
    (total, item) =>
      total +
      item.trainingReports.filter(
        (report) =>
          report.status === TrainingReportStatuses.Submitted,
      ).length,
    0,
  );
  const canUpdateProgress =
    record?.projectStatus === ProjectStatuses.InProgress &&
    record.workStatus !== WorkSubmissionStatuses.Approved;

  useEffect(() => {
    if (!record) return;

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await getEvidenceReadinessAsync(record.applicationId);
        if (active) {
          setReadiness(result);
          setReadinessError("");
        }
      } catch (caughtError) {
        if (active) {
          setReadiness(null);
          setReadinessError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load evidence readiness.",
          );
        }
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [record]);

  function selectRecord(item: WorkRecord) {
    selectedIdRef.current = item.applicationId;
    setSelectedId(item.applicationId);
    setProgressNotes(item.universityProgressNotes ?? "");
    setAcademicRequirementsMet(item.academicRequirementsMet);
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
        record.completedTrainingHours,
        progressNotes.trim(),
        academicRequirementsMet,
      ),
    );
  }

  function openConversation(
    receiverId: string,
    receiverName: string,
    projectId: number,
    projectTitle: string,
  ) {
    const params = new URLSearchParams({
      receiverId,
      receiverName,
      projectId: String(projectId),
      projectTitle,
    });
    navigate(`/university/messages?${params.toString()}`);
  }

  return (
    <section className="page university-training-page">
      <PageHeader
        title="Supervised training"
        actions={
          record ? (
            <div className="page-header-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void runAction("export", downloadApprovedTrainingExportAsync)}
                isLoading={busyAction === "export"}
              >
                <FileDown size={17} aria-hidden="true" />
                Export approved CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.print()}
              >
                <Printer size={17} aria-hidden="true" />
                Print training record
              </Button>
            </div>
          ) : null
        }
      />

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
        <>
          <section className="university-training-kpis">
            <article>
              <span>Assigned students</span>
              <strong>{records.length}</strong>
            </article>
            <article>
              <span>Reports awaiting company review</span>
              <strong>{pendingReportCount}</strong>
            </article>
            <article>
              <span>Awaiting university approval</span>
              <strong>
                {
                  records.filter(
                    (item) =>
                      item.workStatus ===
                      WorkSubmissionStatuses.AwaitingUniversityApproval,
                  ).length
                }
              </strong>
            </article>
          </section>
          <div className="university-training-toolbar">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search students, companies, or training"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="university-training-layout">
          <aside className="university-training-list">
            {visibleRecords.map((item) => (
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
            {visibleRecords.length === 0 ? (
              <p>No training records match this search.</p>
            ) : null}
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
                <span>Student university</span>
                <strong>{record.studentUniversityName ?? "Not provided"}</strong>
                <small>{record.studentNumber ?? "No student number"}</small>
              </article>
              <article>
                <Clock3 size={18} aria-hidden="true" />
                <span>Completed hours</span>
                <strong>{record.completedTrainingHours}</strong>
              </article>
            </div>

            <div className="notice">
              <strong>
                Accepted Evidence Contract version{" "}
                {record.acceptedEvidenceContractVersionNumber ?? "not pinned"}
              </strong>
              <span>
                Final submission revision {record.finalSubmissionRevision || "not submitted"}
              </span>
            </div>

            {record.evaluationIsStale || record.approvalIsStale ? (
              <div className="notice notice-error" role="status">
                <strong>Re-evaluation required</strong>
                <span>
                  This work was resubmitted. Previous evaluation or approval no
                  longer authorizes evidence issuance.
                </span>
              </div>
            ) : null}

            {readiness ? <EvidenceReadinessPanel readiness={readiness} /> : null}
            {readinessError ? (
              <div className="notice notice-error">{readinessError}</div>
            ) : null}

            {record.academicRequirements ? (
              <section className="university-training-requirements">
                <h3>Academic requirements</h3>
                <p>{record.academicRequirements}</p>
              </section>
            ) : null}

            <section className="university-milestone-summary">
              <header>
                <div>
                  <span>Work progress</span>
                  <h3>Milestones and submissions</h3>
                </div>
                <strong>
                  {
                    record.milestones.filter(
                      (milestone) =>
                        milestone.status === MilestoneStatuses.Approved,
                    ).length
                  }
                  /{record.milestones.length}
                </strong>
              </header>
              {record.milestones.length === 0 ? (
                <p>No milestones have been added to this training record.</p>
              ) : (
                <div>
                  {record.milestones.map((milestone, index) => (
                    <article key={milestone.id}>
                      <span>{index + 1}</span>
                      <div>
                        <header>
                          <strong>{milestone.title}</strong>
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
                        <small>
                          {milestone.dueDate
                            ? `Due ${milestone.dueDate}`
                            : "No due date"}
                        </small>
                        {milestone.description ? (
                          <p>{milestone.description}</p>
                        ) : null}
                        {milestone.submissionNote ? (
                          <p>
                            <strong>Student submission:</strong>{" "}
                            {milestone.submissionNote}
                          </p>
                        ) : null}
                        {milestone.feedback ? (
                          <p>
                            <strong>Provider feedback:</strong>{" "}
                            {milestone.feedback}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <TrainingReportsPanel
              mode="university"
              record={record}
              onUpdated={load}
            />

            <div className="university-training-contact-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  openConversation(
                    record.jobSeekerUserId,
                    record.jobSeekerName,
                    record.projectId,
                    record.projectTitle,
                  )
                }
              >
                <MessageSquare size={17} aria-hidden="true" />
                Message student
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  openConversation(
                    record.companyUserId,
                    record.companyName,
                    record.projectId,
                    record.projectTitle,
                  )
                }
              >
                <MessageSquare size={17} aria-hidden="true" />
                Message provider
              </Button>
            </div>

            <form className="university-progress-form" onSubmit={saveProgress}>
              <h3>Academic monitoring</h3>
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
              <label className="training-academic-confirmation">
                <input
                  type="checkbox"
                  checked={academicRequirementsMet}
                  disabled={!canUpdateProgress}
                  onChange={(event) =>
                    setAcademicRequirementsMet(event.target.checked)
                  }
                />
                <span>
                  Academic requirements and learning outcomes have been met
                </span>
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
                {!record.academicRequirementsMet ||
                record.completedTrainingHours <
                  (record.requiredTrainingHours ?? 0) ? (
                  <div className="notice notice-error">
                    Confirm the academic requirements and required approved
                    hours before final approval.
                  </div>
                ) : null}
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
                    disabled={
                      evaluation.trim().length < 10 ||
                      !record.academicRequirementsMet ||
                      record.completedTrainingHours <
                        (record.requiredTrainingHours ?? 0)
                    }
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
        </>
      ) : null}
    </section>
  );
}
