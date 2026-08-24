import { useEffect, useMemo, useState } from "react";
import { FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { EvidenceContractVersion } from "../domain/projectTypes";
import { getEvidenceContractVersionsAsync } from "../infrastructure/projectApi";

type EvidenceContractPanelProps = {
  projectId: number;
  currentVersionNumber: number | null;
  governingVersionNumber?: number | null;
  canInspectHistory: boolean;
  className?: string;
};

export default function EvidenceContractPanel({
  projectId,
  currentVersionNumber,
  governingVersionNumber,
  canInspectHistory,
  className,
}: EvidenceContractPanelProps) {
  const [versions, setVersions] = useState<EvidenceContractVersion[]>([]);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<
    number | null
  >(governingVersionNumber ?? currentVersionNumber);

  useEffect(() => {
    if (!canInspectHistory) return;
    let cancelled = false;
    void getEvidenceContractVersionsAsync(projectId)
      .then((result) => { if (!cancelled) setVersions(result); })
      .catch(() => { if (!cancelled) setVersions([]); });
    return () => { cancelled = true; };
  }, [canInspectHistory, projectId]);

  const governing = governingVersionNumber ?? currentVersionNumber;
  const selectedVersion = useMemo(
    () =>
      versions.find((version) => version.versionNumber === selectedVersionNumber) ??
      versions.find((version) => version.versionNumber === governing) ??
      null,
    [governing, selectedVersionNumber, versions],
  );
  return (
    <section
      className={`evidence-contract-panel ${className ?? ""}`}
      aria-labelledby="evidence-contract-title"
    >
      <header>
        <span className="evidence-contract-icon"><FileCheck2 size={18} aria-hidden="true" /></span>
        <div>
          <h2 id="evidence-contract-title">Evidence Contract</h2>
          <p>Requirements and evaluation rules defined before the work begins.</p>
        </div>
      </header>
      <div className="evidence-contract-summary">
        <article>
          <span>Current opportunity version</span>
          <strong>v{currentVersionNumber ?? "-"}</strong>
        </article>
        <article>
          <span>Version governing this participation</span>
          <strong>{governing ? `v${governing}` : "Assigned after acceptance"}</strong>
        </article>
      </div>
      {governingVersionNumber ? (
        <p className="evidence-contract-pin"><LockKeyhole size={15} aria-hidden="true" /> This participation remains evaluated against v{governingVersionNumber}, even if the provider later publishes a newer opportunity version.</p>
      ) : null}
      {canInspectHistory && versions.length > 0 ? (
        <>
          <div
            className="evidence-contract-history"
            role="tablist"
            aria-label="Evidence Contract versions"
          >
            {versions.map((version) => {
              const isSelected = version.versionNumber === selectedVersion?.versionNumber;
              const isCurrent = version.versionNumber === currentVersionNumber;
              const isGoverning = version.versionNumber === governingVersionNumber;
              return (
                <button
                  key={version.id}
                  type="button"
                  className={isSelected ? "is-selected" : ""}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedVersionNumber(version.versionNumber)}
                >
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>v{version.versionNumber}</span>
                  <small>
                    {isGoverning
                      ? "Governing version"
                      : isCurrent
                        ? "Current version"
                        : "Historical version"}
                  </small>
                </button>
              );
            })}
          </div>

          {selectedVersion ? (
            <section className="evidence-contract-detail" aria-live="polite">
              <header>
                <div>
                  <span>Selected Evidence Contract</span>
                  <h3>Version {selectedVersion.versionNumber}</h3>
                </div>
                <small>
                  {selectedVersion.publishedAt
                    ? `Published ${new Date(selectedVersion.publishedAt).toLocaleDateString()}`
                    : "Drafted version"}
                </small>
              </header>
              <dl>
                <div>
                  <dt>Requirements</dt>
                  <dd>{selectedVersion.requirements}</dd>
                </div>
                <div>
                  <dt>Deliverables</dt>
                  <dd>{selectedVersion.deliverables}</dd>
                </div>
                <div>
                  <dt>Milestones</dt>
                  <dd>{selectedVersion.milestonePlan}</dd>
                </div>
                {selectedVersion.confidentialitySummary ? (
                  <div>
                    <dt>Confidentiality</dt>
                    <dd>{selectedVersion.confidentialitySummary}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="evidence-contract-approvals">
                <span>Approval route</span>
                <strong>
                  {selectedVersion.requiresProviderApproval ? "Provider" : ""}
                  {selectedVersion.requiresProviderApproval &&
                  selectedVersion.requiresUniversityApproval
                    ? " and university"
                    : selectedVersion.requiresUniversityApproval
                      ? "University"
                      : "No approval route configured"}
                </strong>
              </div>
              <div className="evidence-contract-criteria">
                <span>Criterion rules</span>
                <ul>
                  {selectedVersion.criteria.map((criterion) => (
                    <li key={criterion.id}>
                      <strong>{criterion.title}</strong>
                      <small>
                        {criterion.evaluationType === 1 ? "Pass / fail" : "Rating"}
                        {" - "}
                        minimum {criterion.minimumRating}
                        {" - "}
                        {criterion.isRequired ? "Required" : "Optional"}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
