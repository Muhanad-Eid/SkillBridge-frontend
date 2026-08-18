import { CheckCircle2, CircleDashed } from "lucide-react";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import type { CriterionEvidenceCoverage } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

export default function CriterionCoveragePanel({
  coverage,
}: {
  coverage: CriterionEvidenceCoverage;
}) {
  return (
    <section className={styles.panel} aria-labelledby="criterion-coverage-title">
      <header className={styles.panelHeader}>
        <div>
          <h3 id="criterion-coverage-title">Your evidence for this opportunity</h3>
          <p>
            Compared with Evidence Contract version{" "}
            {coverage.contractVersionNumber ?? "not available"}.
          </p>
        </div>
        <SbBadge tone="info">Context only</SbBadge>
      </header>
      <div className={styles.coverage}>
        {coverage.criteria.map((criterion) => {
          const Icon = criterion.isSupported ? CheckCircle2 : CircleDashed;
          return (
            <div key={criterion.criterionId}>
              <Icon size={18} aria-hidden="true" />
              <div>
                <strong>{criterion.title}</strong>
                <span>{criterion.isRequired ? "Required" : "Optional"}</span>
              </div>
              <SbBadge tone={criterion.isSupported ? "approved" : "neutral"}>
                {criterion.isSupported ? "Supported" : "Not supported"}
              </SbBadge>
            </div>
          );
        })}
      </div>
      <p className={styles.limitation}>{coverage.comparisonMethod}</p>
    </section>
  );
}
