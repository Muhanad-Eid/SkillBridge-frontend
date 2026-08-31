import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileLock2,
  Fingerprint,
  GitBranch,
  History,
  Route,
  Scale,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import {
  EvidenceCardStatuses,
  getEvidenceCardStatusLabel,
  type EvidenceTraceEntry,
  type PublicEvidenceCard,
} from "../domain/evidenceTypes";
import ClaimBoundaryPanel from "./ClaimBoundaryPanel";
import EvidencePassport from "./EvidencePassport";
import styles from "./EvidenceProofRoom.module.scss";

type TracePresentation = {
  label: string;
  description: string;
  Icon: LucideIcon;
};

const tracePresentations: Array<{
  matches: (sourceType: string) => boolean;
  presentation: TracePresentation;
}> = [
  {
    matches: (value) => value.includes("opportunity"),
    presentation: {
      label: "Opportunity",
      description: "The practical-work context in which the evidence was produced.",
      Icon: BriefcaseBusiness,
    },
  },
  {
    matches: (value) => value.includes("contract"),
    presentation: {
      label: "Contract version",
      description: "The requirements and criterion rules accepted before the work began.",
      Icon: FileCheck2,
    },
  },
  {
    matches: (value) => value.includes("participation") || value.includes("application"),
    presentation: {
      label: "Participation",
      description: "The participant-specific record pinned to the accepted contract version.",
      Icon: UserRoundCheck,
    },
  },
  {
    matches: (value) => value.includes("submission") || value.includes("deliverable"),
    presentation: {
      label: "Submission",
      description: "The protected work record evaluated for this evidence claim.",
      Icon: FileLock2,
    },
  },
  {
    matches: (value) => value.includes("contribution"),
    presentation: {
      label: "Contribution",
      description: "The resolved participant attribution used when the work was collaborative.",
      Icon: GitBranch,
    },
  },
  {
    matches: (value) => value.includes("evaluation") || value.includes("criterion"),
    presentation: {
      label: "Evaluation",
      description: "Criterion-level results recorded against the governing contract rules.",
      Icon: Scale,
    },
  },
  {
    matches: (value) => value.includes("approval"),
    presentation: {
      label: "Approval",
      description: "The accountable approval route required for this opportunity type.",
      Icon: ClipboardCheck,
    },
  },
  {
    matches: (value) => value.includes("card") || value.includes("evidence"),
    presentation: {
      label: "Evidence card",
      description: "The protected result created only after the issuance conditions passed.",
      Icon: BadgeCheck,
    },
  },
];

function getTracePresentation(entry: EvidenceTraceEntry): TracePresentation {
  const normalized = entry.sourceType.toLowerCase();
  return (
    tracePresentations.find(({ matches }) => matches(normalized))?.presentation ?? {
      label: entry.sourceType,
      description: "A protected source record included in this evidence lineage.",
      Icon: CheckCircle2,
    }
  );
}

function getReferenceNumber(trace: EvidenceTraceEntry[], sourceType: string) {
  const reference = trace.find((entry) =>
    entry.sourceType.toLowerCase().includes(sourceType.toLowerCase()),
  )?.sourceReference;
  return reference?.match(/\d+/)?.[0] ?? null;
}

function getStatusTone(status: number) {
  if (status === EvidenceCardStatuses.Revoked) return "revoked" as const;
  if (status === EvidenceCardStatuses.Superseded) return "pending" as const;
  return "approved" as const;
}

export default function EvidenceProofRoom({ card }: { card: PublicEvidenceCard }) {
  const orderedTrace = useMemo(
    () => [...card.trace].sort((left, right) => left.sortOrder - right.sortOrder),
    [card.trace],
  );
  const [selectedTraceIndex, setSelectedTraceIndex] = useState(0);
  const selectedEntry = orderedTrace[selectedTraceIndex] ?? null;
  const selectedPresentation = selectedEntry
    ? getTracePresentation(selectedEntry)
    : null;
  const contractVersion = getReferenceNumber(card.trace, "contract");
  const submissionRevision = getReferenceNumber(card.trace, "submission");
  const isActive = card.status === EvidenceCardStatuses.Active;

  return (
    <article className={styles.room} aria-labelledby={`proof-room-${card.cardId}`}>
      <header className={styles.roomHeader}>
        <div>
          <span className={styles.recordReference}>
            SB-EV-{String(card.cardId).padStart(6, "0")}
          </span>
          <h2 id={`proof-room-${card.cardId}`}>{card.opportunityTitle}</h2>
          <p>{card.participantName} · {card.providerName}</p>
        </div>
        <div className={styles.recordStatus}>
          <SbBadge tone={getStatusTone(card.status)}>
            {getEvidenceCardStatusLabel(card.status)}
          </SbBadge>
          <span>{card.issuedAt ? `Issued ${new Date(card.issuedAt).toLocaleDateString()}` : "Issue date unavailable"}</span>
        </div>
      </header>

      <section className={styles.verificationReceipt} aria-label="Evidence verification receipt">
        <div className={styles.receiptSeal} data-active={isActive ? "true" : "false"}>
          <ShieldCheck size={28} aria-hidden="true" />
          <div>
            <span>Verification receipt</span>
            <strong>{card.proofReceipt ? "Evidence issuance checks passed" : isActive ? "Issuance checks passed" : "Historical evidence record"}</strong>
          </div>
        </div>
        <dl>
          <div><dt>Governing contract</dt><dd>{contractVersion ? `Version ${contractVersion}` : "Recorded in trace"}</dd></div>
          <div><dt>Submission</dt><dd>{submissionRevision ? `Revision ${submissionRevision}` : "Protected record"}</dd></div>
          <div><dt>Supported claims</dt><dd>{card.claimBoundary.supportedCriteria.length}</dd></div>
          <div><dt>Verified checks</dt><dd>{card.proofReceipt ? `${card.proofReceipt.verifiedCheckpoints}/${card.proofReceipt.totalCheckpoints}` : orderedTrace.length}</dd></div>
        </dl>
      </section>
      {card.proofReceipt ? (
        <section className={styles.proofFingerprint} aria-label="Evidence issuance receipt fingerprint">
          <Fingerprint size={18} aria-hidden="true" />
          <div>
            <span>Immutable evidence receipt · RUN-{String(card.proofReceipt.runId).padStart(6, "0")}</span>
            <code>{card.proofReceipt.fingerprint}</code>
          </div>
          <small>{new Date(card.proofReceipt.runAt).toLocaleString()}</small>
        </section>
      ) : null}

      <nav className={styles.roomNav} aria-label="Evidence record sections">
        <span>Review this record</span>
        <a href={`#proof-trace-${card.cardId}`}><Route size={15} aria-hidden="true" /> Trace</a>
        <a href={`#proof-claims-${card.cardId}`}><Scale size={15} aria-hidden="true" /> Claim boundary</a>
        <a href={`#proof-passport-${card.cardId}`}><BadgeCheck size={15} aria-hidden="true" /> Passport</a>
        {card.statusHistory.length > 0 ? (
          <a href={`#proof-lifecycle-${card.cardId}`}><History size={15} aria-hidden="true" /> Lifecycle</a>
        ) : null}
      </nav>

      <section id={`proof-trace-${card.cardId}`} className={styles.lineageSection} aria-labelledby={`lineage-${card.cardId}`}>
        <header>
          <div>
            <span>Interactive source lineage</span>
            <h3 id={`lineage-${card.cardId}`}>Follow the proof, step by step</h3>
          </div>
          <p>Select a checkpoint to inspect the share-safe source facts behind this card.</p>
        </header>

        {orderedTrace.length > 0 ? (
          <>
            <ol className={styles.lineageMap} aria-label="Evidence verification path">
              {orderedTrace.map((entry, index) => {
                const presentation = getTracePresentation(entry);
                const Icon = presentation.Icon;
                const selected = index === selectedTraceIndex;
                return (
                  <li key={`${entry.sortOrder}-${entry.sourceType}`}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedTraceIndex(index)}
                    >
                      <span className={styles.nodeNumber}>{String(index + 1).padStart(2, "0")}</span>
                      <span className={styles.nodeIcon}><Icon size={18} aria-hidden="true" /></span>
                      <strong>{presentation.label}</strong>
                      <small>{entry.status}</small>
                    </button>
                  </li>
                );
              })}
            </ol>

            {selectedEntry && selectedPresentation ? (
              <section className={styles.sourceInspector} aria-live="polite">
                <div className={styles.inspectorIndex}>
                  <selectedPresentation.Icon size={23} aria-hidden="true" />
                  <span>Checkpoint {String(selectedTraceIndex + 1).padStart(2, "0")}</span>
                </div>
                <div className={styles.inspectorBody}>
                  <span>{selectedPresentation.label}</span>
                  <h4>{selectedEntry.sourceReference}</h4>
                  <p>{selectedPresentation.description}</p>
                </div>
                <dl>
                  <div><dt>Responsible role</dt><dd>{selectedEntry.actorRole}</dd></div>
                  <div><dt>Recorded state</dt><dd>{selectedEntry.status}</dd></div>
                  <div><dt>Recorded on</dt><dd>{new Date(selectedEntry.occurredAt).toLocaleDateString()}</dd></div>
                </dl>
              </section>
            ) : null}
          </>
        ) : (
          <p className={styles.emptyTrace}>No share-safe trace checkpoints are available for this record.</p>
        )}
      </section>

      <section id={`proof-claims-${card.cardId}`} className={styles.claimSection}>
        <div className={styles.claimLead}>
          <Route size={21} aria-hidden="true" />
          <span>Interpretation boundary</span>
          <h3>The evidence says exactly this much.</h3>
          <p>SkillBridge preserves context so a specific evaluated result is not mistaken for unlimited or universal mastery.</p>
          <div>
            <span><CheckCircle2 size={15} /> {card.claimBoundary.supportedCriteria.length} supported</span>
            <span><Scale size={15} /> {card.claimBoundary.unsupportedOptionalCriteria.length} not supported</span>
          </div>
        </div>
        <ClaimBoundaryPanel boundary={card.claimBoundary} />
      </section>

      <section id={`proof-passport-${card.cardId}`} className={styles.passportSection}>
        <header>
          <span>Protected evidence identity</span>
          <h3>Card passport</h3>
        </header>
        <EvidencePassport
          cardId={card.cardId}
          title={card.opportunityTitle}
          participantName={card.participantName}
          providerName={card.providerName}
          status={card.status}
          issuedAt={card.issuedAt}
          supportedCriteriaCount={card.claimBoundary.supportedCriteria.length}
          contractVersionId={contractVersion ? Number(contractVersion) : null}
          submissionRevision={submissionRevision ? Number(submissionRevision) : 0}
        />
      </section>

      <section className={styles.privacyNote}>
        <FileLock2 size={18} aria-hidden="true" />
        <div>
          <strong>Share-safe by design</strong>
          <p>This room exposes permitted evidence facts only. Protected submissions and confidential source files are never available through this public route.</p>
        </div>
      </section>

      {card.statusHistory.length > 0 ? (
        <section id={`proof-lifecycle-${card.cardId}`} className={styles.lifecycle}>
          <header>
            <History size={19} aria-hidden="true" />
            <div><span>Correction history</span><h3>Evidence lifecycle</h3></div>
          </header>
          <ol>
            {card.statusHistory.map((event) => (
              <li key={`${event.occurredAt}-${event.newStatus}`}>
                <span className={styles.lifecycleMarker} />
                <div>
                  <SbBadge tone={getStatusTone(event.newStatus)}>{getEvidenceCardStatusLabel(event.newStatus)}</SbBadge>
                  <strong>{event.reason}</strong>
                  <small>{event.actorName} · {new Date(event.occurredAt).toLocaleString()}</small>
                  {event.replacementCardId ? <small>Replacement SB-EV-{String(event.replacementCardId).padStart(6, "0")}</small> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}
