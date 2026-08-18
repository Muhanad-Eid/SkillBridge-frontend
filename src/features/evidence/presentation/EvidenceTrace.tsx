import type { EvidenceTraceEntry } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

export default function EvidenceTrace({ trace }: { trace: EvidenceTraceEntry[] }) {
  return (
    <section className={styles.panel} aria-labelledby="evidence-trace-title">
      <header className={styles.panelHeader}>
        <div>
          <h3 id="evidence-trace-title">Evidence Trace</h3>
          <p>The permitted source path that produced this evidence record.</p>
        </div>
      </header>
      <ol className={styles.trace}>
        {trace.map((entry) => (
          <li key={`${entry.sortOrder}-${entry.sourceType}`}>
            <strong>{entry.sourceType}</strong>
            <span>{entry.sourceReference}</span>
            <small>{entry.actorRole} · {entry.status}</small>
            <small>{new Date(entry.occurredAt).toLocaleDateString()}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
