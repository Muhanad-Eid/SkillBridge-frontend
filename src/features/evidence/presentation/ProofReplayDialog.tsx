import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDashed,
  FileCheck2,
  Fingerprint,
  ShieldAlert,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { EvidenceProofRun, EvidenceReadiness } from "../domain/evidenceTypes";
import type { CircuitStage } from "./proofCircuit";
import styles from "./ProofReplayDialog.module.scss";

type ProofReplayDialogProps = {
  circuit: CircuitStage[];
  latestRun: EvidenceProofRun | null;
  readiness: EvidenceReadiness;
  participant: string;
  provider: string;
  contractVersion: number | null;
  actionOwner: string;
  actionDetail: string;
  actionLabel: string;
  actionTarget: string | null;
  onClose: () => void;
};

function stateLabel(state: CircuitStage["state"]) {
  return state === "Complete" ? "Verified" : state === "Missing" ? "Waiting" : state === "Failed" ? "Failed" : "Inconsistent";
}

export default function ProofReplayDialog({
  circuit,
  latestRun,
  readiness,
  participant,
  provider,
  contractVersion,
  actionOwner,
  actionDetail,
  actionLabel,
  actionTarget,
  onClose,
}: ProofReplayDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selected = circuit[selectedIndex] ?? circuit[0];
  const verifiedCount = useMemo(() => circuit.filter((stage) => stage.state === "Complete").length, [circuit]);
  const supportedCriteria = readiness.criteria.filter((criterion) => criterion.isSupported);
  const unsupportedCriteria = readiness.criteria.filter((criterion) => !criterion.isSupported);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const focusTimeout = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimeout);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setSelectedIndex((current) => {
        if (current >= circuit.length - 1) {
          window.clearInterval(interval);
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 850);
    return () => window.clearInterval(interval);
  }, [circuit.length, isPlaying]);

  if (!selected) return null;

  const StateIcon = selected.state === "Complete" ? Check : selected.state === "Inconsistent" ? ShieldAlert : CircleDashed;
  const conditions = selected.conditions.length
    ? selected.conditions
    : [{ code: "RecordedWorkflow", state: selected.state, message: "This checkpoint is represented by the protected evidence lineage.", criterionId: null }];

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="proof-replay-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <span>SkillBridge Evidence Replay</span>
            <h2 id="proof-replay-title">Proof Replay</h2>
            <p>Inspect the exact decision record without changing a single workflow record.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.playButton} onClick={() => { setSelectedIndex(0); setIsPlaying(true); }} disabled={isPlaying}>
              <ArrowRight size={16} aria-hidden="true" /> {isPlaying ? "Replaying proof" : "Replay proof"}
            </button>
            <button ref={closeButtonRef} type="button" className={styles.closeButton} aria-label="Close Proof Replay" onClick={onClose}><X size={19} /></button>
          </div>
        </header>

        <section className={styles.context} aria-label="Evidence context">
          <div><span>Participant</span><strong>{participant}</strong></div>
          <div><span>Provider</span><strong>{provider}</strong></div>
          <div><span>Contract</span><strong>Version {contractVersion ?? "not pinned"}</strong></div>
          <div><span>Verified stages</span><strong>{verifiedCount}/{circuit.length}</strong></div>
        </section>

        <section className={styles.circuitPanel} aria-label="Proof replay circuit">
          <div className={styles.circuitLine} aria-hidden="true" />
          <ol className={styles.circuit}>
            {circuit.map((stage, index) => {
              const complete = stage.state === "Complete";
              const active = index === selectedIndex;
              const Icon = complete ? Check : stage.state === "Inconsistent" ? ShieldAlert : CircleDashed;
              return (
                <li key={stage.key} data-state={stage.state.toLowerCase()} data-active={active ? "true" : "false"}>
                  <button type="button" onClick={() => { setIsPlaying(false); setSelectedIndex(index); }} aria-pressed={active}>
                    <span className={styles.step}>{String(index + 1).padStart(2, "0")}</span>
                    <i><Icon size={20} aria-hidden="true" /></i>
                    <strong>{stage.label}</strong>
                    <em>{stateLabel(stage.state)}</em>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.detailGrid} aria-live="polite">
          <article className={styles.inspector}>
            <header>
              <span>Selected checkpoint</span>
              <div><StateIcon size={19} aria-hidden="true" /><h3>{String(selectedIndex + 1).padStart(2, "0")}. {selected.label}</h3></div>
            </header>
            <dl>
              <div><dt>Source record</dt><dd>{selected.source}</dd></div>
              <div><dt>Current state</dt><dd>{stateLabel(selected.state)}</dd></div>
              <div><dt>Evaluation basis</dt><dd>Contract v{contractVersion ?? "not pinned"} · submission r{readiness.submissionRevision || "not submitted"}</dd></div>
              <div><dt>Recorded by</dt><dd>{latestRun ? `${latestRun.triggeredByName} · ${latestRun.triggeredByRole}` : "Live readiness snapshot"}</dd></div>
            </dl>
          </article>

          <article className={styles.conditions}>
            <header><span>Decision record</span><h3>Recorded conditions</h3></header>
            <div>
              {conditions.map((condition) => (
                <section key={`${condition.code}-${condition.criterionId ?? "general"}`} data-state={condition.state.toLowerCase()}>
                  {condition.state === "Complete" ? <BadgeCheck size={17} /> : <ShieldAlert size={17} />}
                  <div><strong>{condition.code.replace(/([A-Z])/g, " $1").trim()}</strong><p>{condition.message}</p></div>
                </section>
              ))}
            </div>
          </article>

          <article className={styles.nextAction}>
            <header><span>Next accountable step</span><h3>{actionOwner}</h3></header>
            <p>{actionDetail}</p>
            {actionTarget ? <Link to={actionTarget}>{actionLabel}<ArrowRight size={15} /></Link> : <div className={styles.noAction}><FileCheck2 size={15} /> {actionLabel}</div>}
          </article>
        </section>

        <section className={styles.claimBoundary} aria-label="Claim Boundary preview">
          <header>
            <div><span>Claim Boundary</span><h3>What this evidence can honestly support</h3></div>
            <small>It does not claim universal mastery outside this recorded context.</small>
          </header>
          <div>
            <article data-kind="supported"><header><BadgeCheck size={17} /><strong>Supported by this evidence</strong><span>{supportedCriteria.length}</span></header>{supportedCriteria.length ? <ul>{supportedCriteria.map((criterion) => <li key={criterion.criterionId}>{criterion.title}</li>)}</ul> : <p>No criterion is currently supported.</p>}</article>
            <article data-kind="limited"><header><ShieldAlert size={17} /><strong>Not supported by this evidence</strong><span>{unsupportedCriteria.length}</span></header>{unsupportedCriteria.length ? <ul>{unsupportedCriteria.map((criterion) => <li key={criterion.criterionId}>{criterion.title}</li>)}</ul> : <p>No evaluated criterion is outside the boundary.</p>}</article>
          </div>
        </section>

        <section className={styles.receipt} aria-label="Verification receipt">
          <header><Fingerprint size={20} aria-hidden="true" /><div><span>Verification receipt</span><h3>{latestRun ? `RUN-${String(latestRun.runId).padStart(6, "0")}` : "Live check"}</h3></div></header>
          <dl>
            <div><dt>Outcome</dt><dd>{latestRun ? (latestRun.ready ? "Ready to issue" : "Blocked") : "Not persisted"}</dd></div>
            <div><dt>Verified</dt><dd>{verifiedCount}/{circuit.length} stages</dd></div>
            <div><dt>Captured</dt><dd>{latestRun ? new Date(latestRun.triggeredAt).toLocaleString() : "Run preflight to retain a receipt"}</dd></div>
          </dl>
          <code>{latestRun?.fingerprint ?? "No immutable receipt yet"}</code>
          <footer><FileCheck2 size={16} aria-hidden="true" /> Protected source files remain private</footer>
        </section>
      </section>
    </div>
  );
}
