import { CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import type { CriterionEvidenceCoverage } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

export default function CriterionCoveragePanel({
  coverage,
}: {
  coverage: CriterionEvidenceCoverage;
}) {
  return (
    <section
      className={`${styles.panel} ${styles.coveragePanel}`}
      aria-labelledby="criterion-coverage-title"
    >
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.coverageKicker}>Evidence coverage</span>
          <h3 id="criterion-coverage-title">Your evidence for this opportunity</h3>
          <p>
            Compared with Evidence Contract version{" "}
            {coverage.contractVersionNumber ?? "not available"}.
          </p>
        </div>
        <SbBadge tone="info"><ShieldCheck size={14} /> Context only</SbBadge>
      </header>
      <div className={styles.coverage}>
        {coverage.criteria.map((criterion) => {
          const Icon = criterion.isSupported ? CheckCircle2 : CircleDashed;
          return (
            <div key={criterion.criterionId}>
              <Icon size={18} aria-hidden="true" />
              <div>
                <strong>{criterion.title}</strong>
                <span>
                  {criterion.isRequired ? "Required" : "Optional"}
                  {criterion.supportingEvidenceCardIds.length > 0
                    ? ` · linked to ${criterion.supportingEvidenceCardIds.length} active card${criterion.supportingEvidenceCardIds.length === 1 ? "" : "s"}`
                    : " · no active evidence card supports it yet"}
                </span>
              </div>
              <SbBadge tone={criterion.isSupported ? "approved" : "neutral"}>
                {criterion.isSupported ? "Supported" : "Not supported"}
              </SbBadge>
            </div>
          );
        })}
      </div>
      <div className={styles.limitation}>
        <ShieldCheck size={17} aria-hidden="true" />
        <div>
          <strong>Comparison boundary</strong>
          <p>{coverage.comparisonMethod}</p>
        </div>
      </div>
    </section>
  );
}
