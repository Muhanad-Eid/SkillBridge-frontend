import { CheckCircle2, CircleDot, Route } from "lucide-react";
import type { EvidenceTraceEntry } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

export default function EvidenceTrace({ trace }: { trace: EvidenceTraceEntry[] }) {
  return (
    <section
      className={`${styles.panel} ${styles.tracePanel}`}
      aria-labelledby="evidence-trace-title"
    >
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.traceKicker}>Protected source lineage</span>
          <h3 id="evidence-trace-title">Evidence Trace</h3>
          <p>A chronological verification path from the governing work definition to this card.</p>
        </div>
        <span className={styles.traceCount}>
          <Route size={15} aria-hidden="true" />
          {trace.length} recorded steps
        </span>
      </header>
      <ol className={styles.trace}>
        {[...trace].sort((left, right) => left.sortOrder - right.sortOrder).map((entry, index) => (
          <li key={`${entry.sortOrder}-${entry.sourceType}`}>
            <span className={styles.traceStep}>{index + 1}</span>
            <div>
              <header>
                <strong>{entry.sourceType}</strong>
                <CheckCircle2 size={15} aria-label={entry.status} />
              </header>
              <span>{entry.sourceReference}</span>
              <small>{entry.actorRole} · {entry.status}</small>
              <small>{new Date(entry.occurredAt).toLocaleDateString()}</small>
            </div>
          </li>
        ))}
      </ol>
      <p className={styles.traceFootnote}>
        <CircleDot size={14} aria-hidden="true" />
        Source facts remain protected and cannot be rewritten by the card owner.
      </p>
    </section>
  );
}
