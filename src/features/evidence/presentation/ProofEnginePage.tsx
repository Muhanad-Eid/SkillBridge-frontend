import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDashed,
  Fingerprint,
  FileCheck2,
  GitCompareArrows,
  History,
  Play,
  RotateCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import type { EvidenceCardSummary, EvidenceProofRun, EvidenceReadiness } from "../domain/evidenceTypes";
import { createEvidenceProofRunAsync, getEvidenceCardsAsync, getEvidenceProofRunsAsync, getEvidenceReadinessAsync } from "../infrastructure/evidenceApi";
import { getMyWorkAsync, getUniversityWorkAsync } from "../../work/infrastructure/workApi";
import type { WorkRecord } from "../../work/domain/workTypes";
import styles from "./ProofEnginePage.module.scss";
import { buildProofCircuit } from "./proofCircuit";
import ProofReplayDialog from "./ProofReplayDialog";

type ProofRecord = {
  applicationId: number;
  projectId: number;
  title: string;
  participant: string;
  provider: string;
};

type RunChange = {
  label: string;
  message: string;
  state: "resolved" | "open";
};

type CheckpointAction = {
  owner: string;
  detail: string;
  label: string;
  canResolve: boolean;
};

function toProofRecord(item: WorkRecord): ProofRecord {
  return {
    applicationId: item.applicationId,
    projectId: item.projectId,
    title: item.projectTitle,
    participant: item.jobSeekerName,
    provider: item.companyName,
  };
}

function fromCard(item: EvidenceCardSummary): ProofRecord {
  return {
    applicationId: item.applicationId,
    projectId: 0,
    title: item.opportunityTitle,
    participant: item.participantName,
    provider: item.providerName,
  };
}

function describeRunChanges(
  latest: EvidenceProofRun | null,
  previous: EvidenceProofRun | null,
): RunChange[] {
  if (!latest || !previous) return [];

  const earlier = new Map(
    previous.readiness.conditions.map((condition) => [
      `${condition.code}:${condition.criterionId ?? "general"}`,
      condition,
    ]),
  );

  return latest.readiness.conditions.flatMap<RunChange>((condition): RunChange[] => {
    const key = `${condition.code}:${condition.criterionId ?? "general"}`;
    const before = earlier.get(key);
    const label = condition.code.replace(/([A-Z])/g, " $1").trim();
    const wasBlocked = before && before.state !== "Complete";
    const isBlocked = condition.state !== "Complete";

    if (wasBlocked && !isBlocked) {
      return [{ label, message: "Now satisfied", state: "resolved" as const }];
    }

    if (isBlocked && (!before || before.state !== condition.state)) {
      return [{ label, message: condition.message, state: "open" as const }];
    }

    return [];
  });
}

function getCheckpointAction(
  stage: string | undefined,
  role: string | undefined,
  ready: boolean,
  existingCardId: number | null,
): CheckpointAction {
  if (ready && existingCardId) {
    return {
      owner: "Evidence protocol",
      detail: "This lineage has passed every mandatory gate and already has one active Evidence Card.",
      label: "Evidence card active",
      canResolve: false,
    };
  }

  if (role === "Admin") {
    return {
      owner: "Workflow owners",
      detail: "Administration can inspect the proof, lifecycle, and source conditions without bypassing the recorded workflow.",
      label: "Inspect evidence record",
      canResolve: true,
    };
  }

  if (stage === "work") {
    return {
      owner: "Participant",
      detail: "A current final submission and any required milestones must be recorded before evaluation can remain valid.",
      label: "Complete current work",
      canResolve: true,
    };
  }

  if (stage === "evaluation") {
    return {
      owner: role === "Company" ? "Provider" : "Provider evaluation workflow",
      detail: "Every required criterion must be evaluated against the pinned Evidence Contract version.",
      label: "Complete criterion evaluation",
      canResolve: true,
    };
  }

  if (stage === "approvals") {
    const university = role === "UniversitySupervisor";
    return {
      owner: university ? "University supervisor" : "Provider / company",
      detail: university
        ? "University approval is a separate mandatory gate. Company approval alone cannot issue University Training evidence."
        : "Record the current provider approval after the final submission and criteria are complete.",
      label: university ? "Record university approval" : "Record company approval",
      canResolve: true,
    };
  }

  if (stage === "attribution") {
    return {
      owner: role === "Company" ? "Provider" : "Affected team members",
      detail: "Contribution declarations, reviews, disputes, and provider resolution must settle before team attribution can be locked.",
      label: "Review contribution evidence",
      canResolve: true,
    };
  }

  return {
    owner: "Recorded workflow",
    detail: "Open the relevant work record to resolve this exact evidence condition without changing the evaluation basis.",
    label: "Resolve in workflow",
    canResolve: true,
  };
}

export default function ProofEnginePage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ProofRecord[]>([]);
  const [readiness, setReadiness] = useState<EvidenceReadiness | null>(null);
  const [runs, setRuns] = useState<EvidenceProofRun[]>([]);
  const [selectedStage, setSelectedStage] = useState("approvals");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [error, setError] = useState("");
  const numericApplicationId = Number(applicationId);
  const basePath = user?.role === "Company" ? "/company" : user?.role === "JobSeeker" ? "/job-seeker" : user?.role === "UniversitySupervisor" ? "/university" : "/admin";

  const loadRecords = useCallback(async () => {
    if (user?.role === "Admin") {
      const cards = await getEvidenceCardsAsync();
      return cards.map(fromCard).filter((item, index, all) => all.findIndex((candidate) => candidate.applicationId === item.applicationId) === index);
    }
    const work = user?.role === "UniversitySupervisor" ? await getUniversityWorkAsync() : await getMyWorkAsync();
    return work.map(toProofRecord);
  }, [user?.role]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const recordData = await loadRecords();
      setRecords(recordData);
      const selectedId = Number.isInteger(numericApplicationId) && numericApplicationId > 0
        ? numericApplicationId
        : recordData[0]?.applicationId;
      if (!selectedId) {
        setReadiness(null);
        setRuns([]);
        return;
      }
      if (!applicationId) {
        navigate(`${basePath}/proof-engine/${selectedId}`, { replace: true });
      }
      const [readinessData, runData] = await Promise.all([
        getEvidenceReadinessAsync(selectedId),
        getEvidenceProofRunsAsync(selectedId),
      ]);
      setReadiness(readinessData);
      setRuns(runData);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load evidence checks.");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, basePath, loadRecords, navigate, numericApplicationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const selectedRecord = records.find((record) => record.applicationId === numericApplicationId) ?? records[0] ?? null;
  const latestRun = runs[0] ?? null;
  const previousRun = runs[1] ?? null;
  const circuit = useMemo(() => readiness ? buildProofCircuit(readiness) : [], [readiness]);
  const activeStage = circuit.find((stage) => stage.key === selectedStage) ?? circuit[0];
  const blockedCount = readiness?.conditions.filter((condition) => condition.state !== "Complete").length ?? 0;
  const runChanges = describeRunChanges(latestRun, previousRun);
  const workTarget = user?.role === "Company"
    ? `/company/projects/${selectedRecord?.projectId}/work`
    : user?.role === "JobSeeker"
      ? `/job-seeker/work/${selectedRecord?.projectId}`
      : user?.role === "UniversitySupervisor"
        ? "/university/training"
        : "/admin/evidence";
  const checkpointAction = getCheckpointAction(
    activeStage?.key,
    user?.role,
    readiness?.ready ?? false,
    readiness?.existingCardId ?? null,
  );

  async function runPreflight() {
    if (!selectedRecord) return;
    setIsRunning(true);
    setError("");
    try {
      await createEvidenceProofRunAsync(selectedRecord.applicationId);
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to run evidence preflight.");
    } finally {
      setIsRunning(false);
    }
  }

  if (isLoading) {
    return <section className={styles.page}><DataState isLoading error="" empty={false} emptyTitle="" emptyDescription="" /></section>;
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span>SkillBridge integrity workspace</span>
          <h1>Evidence checks</h1>
          <p>Follow every source that turns completed work into a bounded, verifiable claim.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.replayButton} onClick={() => setIsReplayOpen(true)} disabled={!selectedRecord}>
            <Sparkles size={16} /> Open Proof Replay
          </button>
          <Button className={styles.runButton} isLoading={isRunning} onClick={() => void runPreflight()} disabled={!selectedRecord}>
            <Play size={16} /> Run preflight
          </Button>
        </div>
      </header>

      {error ? <div className="notice notice-error">{error}</div> : null}
      <DataState isLoading={false} error="" empty={records.length === 0} emptyTitle="No evidence journeys yet" emptyDescription="Accepted work records will appear here when an evidence lineage exists." />

      {selectedRecord && readiness ? (
        <>
          <section className={styles.identityStrip}>
            <label>
              <span>Evidence journey</span>
              <select value={selectedRecord.applicationId} onChange={(event) => navigate(`${basePath}/proof-engine/${event.target.value}`)}>
                {records.map((record) => <option key={record.applicationId} value={record.applicationId}>{record.title} · {record.participant}</option>)}
              </select>
            </label>
            <div><span>Participant</span><strong>{selectedRecord.participant}</strong></div>
            <div><span>Provider</span><strong>{selectedRecord.provider}</strong></div>
            <div><span>Contract</span><strong>Version {readiness.acceptedContractVersionNumber ?? "not pinned"}</strong></div>
            <div className={readiness.ready ? styles.ready : styles.blocked}>
              <span>Current gate</span>
              <strong>{readiness.ready ? "READY TO ISSUE" : `${blockedCount} BLOCKER${blockedCount === 1 ? "" : "S"}`}</strong>
            </div>
          </section>

          <section className={styles.engine}>
            <div className={styles.circuit} aria-label="Evidence integrity circuit">
              {circuit.map((stage, index) => {
                const StateIcon = stage.state === "Complete" ? Check : stage.state === "Inconsistent" ? ShieldAlert : stage.state === "Failed" ? AlertTriangle : CircleDashed;
                return (
                  <button key={stage.key} type="button" className={`${styles[stage.state.toLowerCase()]} ${stage.key === "card" && stage.state === "Complete" ? styles.finalComplete : ""}`} data-selected={stage.key === activeStage?.key} onClick={() => setSelectedStage(stage.key)}>
                    <span className={styles.connector} aria-hidden="true" />
                    <i><StateIcon size={18} /></i>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    <strong>{stage.label}</strong>
                    <em>{stage.state === "Complete" ? "SATISFIED" : stage.state.toUpperCase()}</em>
                  </button>
                );
              })}
            </div>

            {activeStage ? (
              <aside className={styles.inspector}>
                <header>
                  <div><span>Selected checkpoint</span><h2>{activeStage.label}</h2></div>
                  <b data-state={activeStage.state.toLowerCase()}>{activeStage.state === "Complete" ? "SATISFIED" : activeStage.state.toUpperCase()}</b>
                </header>
                <dl>
                  <div><dt>Source record</dt><dd>{activeStage.source}</dd></div>
                  <div><dt>Proof basis</dt><dd>Contract v{readiness.acceptedContractVersionNumber ?? "not pinned"} · revision {readiness.submissionRevision || "none"}</dd></div>
                  <div><dt>Last evaluated</dt><dd>{latestRun ? new Date(latestRun.triggeredAt).toLocaleString() : "Live readiness snapshot"}</dd></div>
                  <div><dt>Actor</dt><dd>{latestRun ? `${latestRun.triggeredByName} · ${latestRun.triggeredByRole}` : "Not persisted yet"}</dd></div>
                </dl>
                <div className={styles.conditionList}>
                  {(activeStage.conditions.length ? activeStage.conditions : [{ code: "NotRequired", state: "Complete" as const, message: activeStage.key === "card" ? "No active card has been issued from this lineage yet." : "This checkpoint does not require an additional record for this opportunity type.", criterionId: null }]).map((condition) => (
                    <article key={`${condition.code}-${condition.criterionId ?? "general"}`}>
                      {condition.state === "Complete" ? <BadgeCheck size={17} /> : <AlertTriangle size={17} />}
                      <div><strong>{condition.code.replace(/([A-Z])/g, " $1").trim()}</strong><p>{condition.message}</p></div>
                    </article>
                  ))}
                </div>
                <div className={styles.resolutionPanel}>
                  <span>Next accountable step</span>
                  <strong>{checkpointAction.owner}</strong>
                  <p>{checkpointAction.detail}</p>
                  {checkpointAction.canResolve ? (
                    <Link className={styles.resolveLink} to={`${workTarget}#evidence-readiness`}>
                      {checkpointAction.label}
                      <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <div className={styles.activeOutcome}><FileCheck2 size={15} /> {checkpointAction.label}</div>
                  )}
                </div>
              </aside>
            ) : null}
          </section>

          <section className={styles.lowerGrid}>
            <div className={styles.runHistory}>
              <header><div><History size={18} /><h2>Proof run history</h2></div><span>{runs.length} immutable run{runs.length === 1 ? "" : "s"}</span></header>
              {latestRun ? (
                <>
                  <div className={styles.runCompare}>
                    <div><span>Latest run</span><strong>RUN-{String(latestRun.runId).padStart(6, "0")}</strong><small>{new Date(latestRun.triggeredAt).toLocaleString()}</small></div>
                    <GitCompareArrows size={20} />
                    <div><span>Previous run</span><strong>{previousRun ? `RUN-${String(previousRun.runId).padStart(6, "0")}` : "No earlier run"}</strong><small>{previousRun ? new Date(previousRun.triggeredAt).toLocaleString() : "Run preflight again after resolving blockers"}</small></div>
                  </div>
                  {previousRun ? (
                    <div className={styles.changeSummary}>
                      <header>
                        <span>What changed since your last proof run</span>
                        <small>{runChanges.length ? `${runChanges.length} material change${runChanges.length === 1 ? "" : "s"}` : "No readiness changes"}</small>
                      </header>
                      {runChanges.length ? (
                        <div>
                          {runChanges.map((change) => (
                            <article key={`${change.state}-${change.label}`} data-state={change.state}>
                              {change.state === "resolved" ? <BadgeCheck size={16} /> : <AlertTriangle size={16} />}
                              <strong>{change.label}</strong>
                              <span>{change.message}</span>
                            </article>
                          ))}
                        </div>
                      ) : <p>Run history is preserved, but no issuance condition changed between these two snapshots.</p>}
                    </div>
                  ) : null}
                  <div className={styles.receipt}><Fingerprint size={19} /><div><span>Receipt fingerprint</span><code>{latestRun.fingerprint}</code></div></div>
                </>
              ) : <div className={styles.noRuns}><RotateCw size={22} /><p>Run the first preflight to preserve this readiness state as an immutable receipt.</p></div>}
            </div>

            <div className={styles.claimBoundary}>
              <header><span>Claim Boundary</span><h2>What this evidence can honestly support</h2></header>
              {readiness.criteria.length === 0 ? (
                <div className={styles.emptyBoundary}>
                  <CircleDashed size={22} />
                  <div><strong>No evaluated criteria yet</strong><p>This boundary becomes specific after the provider records criterion-level evidence. Until then, no skill claim is issued from this journey.</p></div>
                </div>
              ) : (
                <div className={styles.claimColumns}>
                  <section><h3><BadgeCheck size={17} /> Supported by this evidence</h3>{readiness.criteria.filter((item) => item.isSupported).map((item) => <p key={item.criterionId}>{item.title}</p>)}{readiness.criteria.every((item) => !item.isSupported) ? <p>No criterion is currently supported by this evidence.</p> : null}</section>
                  <section><h3><ShieldAlert size={17} /> Not supported by this evidence</h3>{readiness.criteria.filter((item) => !item.isSupported).map((item) => <p key={item.criterionId}>{item.title}</p>)}{readiness.criteria.every((item) => item.isSupported) ? <p>No evaluated criterion is currently outside the boundary.</p> : null}</section>
                </div>
              )}
              <small>This does not claim general mastery, absolute authorship, or performance outside the recorded context.</small>
            </div>
          </section>
        </>
      ) : null}
      {isReplayOpen && selectedRecord && readiness ? (
        <ProofReplayDialog
          circuit={circuit}
          latestRun={latestRun}
          readiness={readiness}
          participant={selectedRecord.participant}
          provider={selectedRecord.provider}
          contractVersion={readiness.acceptedContractVersionNumber}
          actionOwner={checkpointAction.owner}
          actionDetail={checkpointAction.detail}
          actionLabel={checkpointAction.label}
          actionTarget={checkpointAction.canResolve ? `${workTarget}#evidence-readiness` : null}
          onClose={() => setIsReplayOpen(false)}
        />
      ) : null}
    </section>
  );
}
