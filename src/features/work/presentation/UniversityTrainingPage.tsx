import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileDown,
  GraduationCap,
  MessageSquare,
  Printer,
  RotateCcw,
  Search,
  Workflow,
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
import EvidenceCaseNavigator from "./EvidenceCaseNavigator";
import styles from "./UniversityTrainingPage.module.scss";

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
  const awaitingUniversityCount = records.filter(
    (item) =>
      item.workStatus === WorkSubmissionStatuses.AwaitingUniversityApproval,
  ).length;
  const incompleteAcademicCount = records.filter(
    (item) => !item.academicRequirementsMet,
  ).length;
  const approvedTrainingCount = records.filter(
    (item) => item.workStatus === WorkSubmissionStatuses.Approved,
  ).length;
  const canUpdateProgress =
    record?.projectStatus === ProjectStatuses.InProgress &&
    record.workStatus !== WorkSubmissionStatuses.Approved;
  const requiredHours = record?.requiredTrainingHours ?? 0;
  const completedHours = record?.completedTrainingHours ?? 0;
  const hoursPercent =
    requiredHours > 0
      ? Math.min(100, Math.round((completedHours / requiredHours) * 100))
      : 0;
  const approvedMilestones =
    record?.milestones.filter(
      (milestone) => milestone.status === MilestoneStatuses.Approved,
    ).length ?? 0;
  const selectedPendingReportCount =
    record?.trainingReports.filter(
      (report) => report.status === TrainingReportStatuses.Submitted,
    ).length ?? 0;
  const nextAction = useMemo(() => {
    if (!record) return null;

    if (record.evaluationIsStale || record.approvalIsStale) {
      return {
        eyebrow: "Integrity check",
        title: "Re-evaluation is required",
        description:
          "The participant resubmitted work, so earlier evaluation or approval can no longer authorize evidence.",
        targetId: "evidence-readiness",
        tone: "danger",
      } as const;
    }

    if (
      record.workStatus === WorkSubmissionStatuses.AwaitingUniversityApproval
    ) {
      return {
        eyebrow: "Your next action",
        title: "Complete university approval",
        description:
          "Review the final result, confirmed hours, learning outcomes, and academic requirements.",
        targetId: "university-approval",
        tone: "academic",
      } as const;
    }

    if (requiredHours > 0 && completedHours < requiredHours) {
      return {
        eyebrow: "Training progress",
        title: `${requiredHours - completedHours} approved hours remaining`,
        description:
          "Training hours increase only when the company approves submitted reports.",
        targetId: "training-reports",
        tone: "attention",
      } as const;
    }

    if (!record.academicRequirementsMet) {
      return {
        eyebrow: "Academic monitoring",
        title: "Confirm learning outcomes",
        description:
          "Record progress notes and confirm the academic requirements when the evidence supports them.",
        targetId: "academic-monitoring",
        tone: "attention",
      } as const;
    }

    if (!record.companyApprovedAt) {
      return {
        eyebrow: "Approval route",
        title: "Waiting for company approval",
        description:
          "The provider must evaluate and approve the final work before university approval becomes available.",
        targetId: "evidence-case-workspace",
        tone: "neutral",
      } as const;
    }

    if (record.workStatus === WorkSubmissionStatuses.Approved) {
      return {
        eyebrow: "Training complete",
        title: "Academic approval recorded",
        description:
          "The training record is approved. Review its issuance readiness and resulting evidence status.",
        targetId: "evidence-readiness",
        tone: "complete",
      } as const;
    }

    return {
      eyebrow: "Participant action",
      title: "Waiting for final submission",
      description:
        "Continue monitoring reports and milestones while the participant completes the final work.",
      targetId: "training-reports",
      tone: "neutral",
    } as const;
  }, [completedHours, record, requiredHours]);

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
    setReadiness(null);
    setReadinessError("");
  }

  function scrollToSection(targetId: string) {
    const universityTarget =
      targetId === "training-record"
        ? "university-approval"
        : targetId === "final-submission"
          ? "training-reports"
          : targetId;
    const target =
      document.getElementById(universityTarget) ??
      document.getElementById("evidence-case-workspace");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resolveReadinessCondition(code: string) {
    const targetByCode: Record<string, string> = {
      FinalSubmissionMissing: "training-reports",
      WorkIncomplete: "training-reports",
      CriterionEvaluationMissing: "evidence-case-workspace",
      RequiredCriterionUnsatisfied: "evidence-case-workspace",
      CompanyApprovalMissing: "evidence-case-workspace",
      UniversityApprovalMissing: "university-approval",
    };
    const target = targetByCode[code];
    if (target) {
      scrollToSection(target);
      return;
    }
    setReadinessError(
      "This condition is governed by the accepted Evidence Contract or the protected issuance policy.",
    );
  }

  async function runAction(action: string, callback: () => Promise<unknown>) {
    setBusyAction(action);
    setError("");
    setMessage("");
    try {
      await callback();
      setMessage("Training record updated.");
      setReadiness(null);
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
    <section className={`page university-training-page ${styles.root}`}>
      <PageHeader
        title="University Training Passport"
        eyebrow="Academic oversight"
        description="Keep workplace evidence and academic approval connected in one supervised training record."
        actions={
          record ? (
            <div className="page-header-actions">
              <Button
                to={`/university/proof-engine/${record.applicationId}`}
                variant="secondary"
              >
                <Workflow size={17} aria-hidden="true" />
                Open Proof Engine
              </Button>
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
              <span>Needs academic monitoring</span>
              <strong>{incompleteAcademicCount}</strong>
            </article>
            <article>
              <span>Awaiting university approval</span>
              <strong>{awaitingUniversityCount}</strong>
            </article>
            <article>
              <span>Approved training</span>
              <strong>{approvedTrainingCount}</strong>
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
                <span className="university-training-list-heading">
                  <strong>{item.jobSeekerName}</strong>
                  <StatusBadge
                    tone={
                      item.workStatus === WorkSubmissionStatuses.Approved
                        ? "green"
                        : item.workStatus ===
                            WorkSubmissionStatuses.AwaitingUniversityApproval
                          ? "blue"
                          : "amber"
                    }
                  >
                    {item.workStatus ===
                    WorkSubmissionStatuses.AwaitingUniversityApproval
                      ? "University review"
                      : getWorkSubmissionStatusLabel(item.workStatus)}
                  </StatusBadge>
                </span>
                <span>{item.projectTitle}</span>
                <small>{item.companyName}</small>
                <span className="university-training-list-progress">
                  <i
                    aria-hidden="true"
                    style={{
                      width: `${
                        (item.requiredTrainingHours ?? 0) > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (item.completedTrainingHours /
                                  (item.requiredTrainingHours ?? 1)) *
                                  100,
                              ),
                            )
                          : 0
                      }%`,
                    }}
                  />
                </span>
                <small>
                  {item.completedTrainingHours} / {item.requiredTrainingHours ?? "?"} approved hours
                </small>
              </button>
            ))}
            {visibleRecords.length === 0 ? (
              <p>No training records match this search.</p>
            ) : null}
          </aside>

          <div className="university-training-record">
            <header>
              <div>
                <span>University Training Passport #{record.applicationId}</span>
                <h2>{record.projectTitle}</h2>
                <dl className="university-case-meta">
                  <div>
                    <dt>Participant</dt>
                    <dd>{record.jobSeekerName}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>{record.companyName}</dd>
                  </div>
                  <div>
                    <dt>Contract</dt>
                    <dd>
                      {record.acceptedEvidenceContractVersionNumber
                        ? `Version ${record.acceptedEvidenceContractVersionNumber}`
                        : "Not pinned"}
                    </dd>
                  </div>
                  <div>
                    <dt>Submission</dt>
                    <dd>
                      {record.finalSubmissionRevision
                        ? `Revision ${record.finalSubmissionRevision}`
                        : "Not submitted"}
                    </dd>
                  </div>
                </dl>
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

            <div
              className="university-evidence-case"
              id="evidence-case-workspace"
            >
              <EvidenceCaseNavigator
                record={record}
                readiness={readiness}
                isCompany={false}
                isUniversitySupervisor
                onNavigate={scrollToSection}
              />
            </div>

            {nextAction ? (
              <section
                className={`university-next-action university-next-action-${nextAction.tone}`}
              >
                <div>
                  <span>{nextAction.eyebrow}</span>
                  <h3>{nextAction.title}</h3>
                  <p>{nextAction.description}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => scrollToSection(nextAction.targetId)}
                >
                  Review now
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </section>
            ) : null}

            <nav
              className="university-case-sections"
              aria-label="Training case sections"
            >
              <span>Case sections</span>
              <button type="button" onClick={() => scrollToSection("case-overview")}>
                Overview
              </button>
              <button type="button" onClick={() => scrollToSection("training-reports")}>
                Reports <small>{record.trainingReports.length}</small>
              </button>
              <button type="button" onClick={() => scrollToSection("academic-monitoring")}>
                Academic monitoring
              </button>
              <button type="button" onClick={() => scrollToSection("university-approval")}>
                Decision
              </button>
              <button type="button" onClick={() => scrollToSection("evidence-readiness")}>
                Readiness
              </button>
            </nav>

            <section className="university-training-overview" id="case-overview">
              <div className="university-hours-progress">
                <header>
                  <div>
                    <span>Approved training hours</span>
                    <strong>
                      {completedHours}
                      <small> / {requiredHours || "?"} hours</small>
                    </strong>
                  </div>
                  <b>{hoursPercent}%</b>
                </header>
                <div
                  className="university-hours-track"
                  role="progressbar"
                  aria-label="Approved training hours"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(requiredHours || 100, completedHours)}
                  aria-valuenow={completedHours}
                >
                  <span style={{ width: `${hoursPercent}%` }} />
                </div>
                <p>
                  {selectedPendingReportCount > 0
                    ? `${selectedPendingReportCount} submitted report${selectedPendingReportCount === 1 ? " is" : "s are"} awaiting company review for this training record.`
                    : "Approved reports contribute to the completed-hours total."}
                </p>
              </div>

              <dl className="university-training-identity">
                <div>
                  <dt><Building2 size={16} aria-hidden="true" /> Provider</dt>
                  <dd>{record.companyName}</dd>
                </div>
                <div>
                  <dt><GraduationCap size={16} aria-hidden="true" /> University</dt>
                  <dd>{record.studentUniversityName ?? "Not provided"}</dd>
                  <small>{record.studentNumber ?? "No student number"}</small>
                </div>
                <div>
                  <dt><BookOpenCheck size={16} aria-hidden="true" /> Milestones</dt>
                  <dd>{approvedMilestones} / {record.milestones.length} approved</dd>
                </div>
              </dl>
            </section>

            <div className="notice" id="evidence-contract">
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
                <AlertTriangle size={18} aria-hidden="true" />
                <strong>Re-evaluation required</strong>
                <span>
                  This work was resubmitted. Previous evaluation or approval no
                  longer authorizes evidence issuance.
                </span>
              </div>
            ) : null}

            {record.academicRequirements ? (
              <section className="university-training-requirements">
                <h3>Academic requirements</h3>
                <p>{record.academicRequirements}</p>
              </section>
            ) : null}

            <section className="university-milestone-summary" id="work-milestones">
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

            <div id="training-reports">
              <TrainingReportsPanel
                mode="university"
                record={record}
                onUpdated={load}
              />
            </div>

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

            <form className="university-progress-form" id="academic-monitoring" onSubmit={saveProgress}>
              <header>
                <span>University supervision</span>
                <h3>Academic monitoring</h3>
                <p>Record academic progress independently from the provider's workplace evaluation.</p>
              </header>
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
              <div className="university-form-actions">
                <Button
                  type="submit"
                  disabled={!canUpdateProgress}
                  isLoading={busyAction === "progress"}
                >
                  Save academic monitoring
                </Button>
                {!canUpdateProgress ? <small>This training record is no longer editable.</small> : null}
              </div>
            </form>

            {record.finalSubmissionNote ? (
              <section className="university-final-review" id="final-review">
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
              <section className="university-approval-form" id="university-approval">
                <header>
                  <span>Final academic decision</span>
                  <h3>University approval</h3>
                  <p>This is the second required approval. Company approval alone cannot issue University Training evidence.</p>
                </header>
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

            <section id="evidence-readiness" className="university-readiness-section">
              <header>
                <span>Evidence issuance</span>
                <h3>Issuance readiness</h3>
                <p>The card can be created only when the complete training lineage and both approvals satisfy the protocol.</p>
              </header>
              {readiness ? (
                <EvidenceReadinessPanel
                  readiness={readiness}
                  onResolveCondition={resolveReadinessCondition}
                />
              ) : null}
              {readinessError ? (
                <div className="notice notice-error">{readinessError}</div>
              ) : null}
            </section>
          </div>
        </div>
        </>
      ) : null}
    </section>
  );
}
