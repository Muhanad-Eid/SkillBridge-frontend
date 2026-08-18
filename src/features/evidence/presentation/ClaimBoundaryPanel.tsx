import type { ClaimBoundary } from "../domain/evidenceTypes";
import styles from "./EvidenceViews.module.scss";

export default function ClaimBoundaryPanel({
  boundary,
}: {
  boundary: ClaimBoundary;
}) {
  return (
    <section className={styles.panel} aria-labelledby="claim-boundary-title">
      <header className={styles.panelHeader}>
        <div>
          <h3 id="claim-boundary-title">Claim Boundary</h3>
          <p>What this evaluated work supports, and where the claim stops.</p>
        </div>
      </header>
      <div className={styles.boundaryIntro}>
        <div><span>Work context</span><p>{boundary.context}</p></div>
        <div><span>Resolved contribution</span><p>{boundary.contribution}</p></div>
        <div><span>Evaluated by</span><p>{boundary.evaluatedBy}</p></div>
        <div><span>Approval context</span><p>{boundary.approvalContext}</p></div>
      </div>
      <div className={styles.boundaryLists}>
        <div className={`${styles.boundaryGroup} ${styles.boundaryGroupSupported}`}>
          <h4>Supported by this evidence</h4>
          <ul>
            {boundary.supportedCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>
        {boundary.unsupportedOptionalCriteria.length > 0 ? (
          <div className={`${styles.boundaryGroup} ${styles.boundaryGroupUnsupported}`}>
            <h4>Evaluated but not supported</h4>
            <ul>
              {boundary.unsupportedOptionalCriteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className={styles.limitation}>{boundary.limitation}</p>
    </section>
  );
}
