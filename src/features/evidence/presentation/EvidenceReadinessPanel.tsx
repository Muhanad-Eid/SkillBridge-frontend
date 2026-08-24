import { AlertTriangle, CheckCircle2, CircleDashed, ShieldAlert } from "lucide-react";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import type { EvidenceReadiness } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

export default function EvidenceReadinessPanel({
  readiness,
}: {
  readiness: EvidenceReadiness;
}) {
  return (
    <section className={styles.panel} aria-labelledby="evidence-readiness-title">
      <header className={styles.panelHeader}>
        <div>
          <h3 id="evidence-readiness-title">Evidence issuance readiness</h3>
          <p>
            Contract version {readiness.acceptedContractVersionNumber ?? "not pinned"}
            {readiness.submissionRevision > 0
              ? ` · submission revision ${readiness.submissionRevision}`
              : ""}
          </p>
        </div>
        <SbBadge tone={readiness.ready ? "approved" : "blocked"}>
          {readiness.ready ? "Ready to issue" : "Issuance blocked"}
        </SbBadge>
      </header>
      <div className={styles.conditions}>
        {readiness.conditions.map((condition) => {
          const stateLabel = condition.state === "Complete"
            ? "Satisfied"
            : condition.state;
          const Icon = condition.state === "Complete"
            ? CheckCircle2
            : condition.state === "Missing"
              ? CircleDashed
              : condition.state === "Inconsistent"
                ? ShieldAlert
                : AlertTriangle;
          return (
            <div
              className={`${styles.condition} ${styles[condition.state.toLowerCase()]}`}
              key={`${condition.code}-${condition.criterionId ?? "general"}`}
            >
              <Icon size={18} aria-hidden="true" />
              <div>
                <div className={styles.conditionTitle}>
                  <strong>{condition.code.replace(/([A-Z])/g, " $1").trim()}</strong>
                  <span>{stateLabel}</span>
                </div>
                <p>{condition.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
