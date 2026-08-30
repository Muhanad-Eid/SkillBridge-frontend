import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  ListChecks,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DataState from "../../../shared/components/DataState";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import {
  EvidenceCardStatuses,
  getEvidenceCardStatusLabel,
  type PublicEvidenceShare,
} from "../domain/evidenceTypes";
import { getPublicEvidenceShareAsync } from "../infrastructure/evidenceApi";
import ClaimBoundaryPanel from "./ClaimBoundaryPanel";
import EvidencePassport from "./EvidencePassport";
import EvidenceTrace from "./EvidenceTrace";
import styles from "./PublicEvidenceSharePage.module.scss";

function getStatusTone(status: number) {
  if (status === EvidenceCardStatuses.Revoked) return "revoked" as const;
  if (status === EvidenceCardStatuses.Superseded) return "pending" as const;
  return "approved" as const;
}

function getTraceReferenceNumber(
  trace: PublicEvidenceShare["cards"][number]["trace"],
  sourceType: string,
) {
  const reference = trace.find((entry) => entry.sourceType === sourceType)?.sourceReference;
  const match = reference?.match(/\d+/)?.[0];
  return match ? Number(match) : null;
}

export default function PublicEvidenceSharePage() {
  const { token = "" } = useParams();
  const [share, setShare] = useState<PublicEvidenceShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getPublicEvidenceShareAsync(token)
      .then((result) => {
        if (!cancelled) setShare(result);
      })
      .catch(() => {
        if (!cancelled) {
          setError("This evidence share is invalid, disabled, expired, or no longer available.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <DataState
          isLoading
          error=""
          empty={false}
          emptyTitle=""
          emptyDescription=""
        />
      </main>
    );
  }

  if (error || !share) {
    return (
      <main className={`${styles.page} ${styles.unavailablePage}`}>
        <section className={styles.unavailable} aria-labelledby="evidence-unavailable-title">
          <div className={styles.unavailableMark} aria-hidden="true"><FileWarning size={30} /></div>
          <div>
            <span>Evidence verification</span>
            <h1 id="evidence-unavailable-title">This evidence link is not available.</h1>
            <p>It may have been disabled by its owner, replaced after a correction, revoked, or copied incompletely. Protected source files remain private.</p>
          </div>
          <div className={styles.unavailableActions}>
            <Link to="/opportunities">Browse opportunities <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link to="/">Return to SkillBridge</Link>
          </div>
        </section>
      </main>
    );
  }

  const comparisonCards = share.cards.filter((card) => comparisonIds.includes(card.cardId));
  const toggleComparisonCard = (cardId: number) => {
    setComparisonIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : current.length === 2
          ? [current[1], cardId]
          : [...current, cardId],
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.kicker}>Share-safe evidence record</span>
          <h1>{share.ownerName}'s evidence</h1>
          <p>A protected, reviewer-ready record of evaluated practical work. No account is required to inspect this share.</p>
        </div>
        <SbBadge tone="approved"><ShieldCheck size={15} /> Process-traceable</SbBadge>
      </header>
      {share.cards.length > 1 ? (
        <section className={styles.comparisonIntro} aria-label="Evidence card comparison controls">
          <div>
            <span>Reviewer tool</span>
            <strong>Compare two evidence cards</strong>
            <p>Select two records below to compare their claim boundaries and trace completeness side by side.</p>
          </div>
          <SbBadge tone="info"><Scale size={14} /> {comparisonIds.length}/2 selected</SbBadge>
        </section>
      ) : null}
      {comparisonCards.length === 2 ? (
        <section className={styles.comparison} aria-labelledby="evidence-comparison-title">
          <header>
            <div>
              <span>Evidence card comparison</span>
              <h2 id="evidence-comparison-title">Claims and source-trace completeness</h2>
            </div>
            <button type="button" onClick={() => setComparisonIds([])}>Clear comparison</button>
          </header>
          <div className={styles.comparisonGrid}>
            {comparisonCards.map((card) => (
              <article key={card.cardId}>
                <header>
                  <span>SB-EV-{String(card.cardId).padStart(6, "0")}</span>
                  <strong>{card.opportunityTitle}</strong>
                  <small>{card.participantName} · {card.providerName}</small>
                </header>
                <dl>
                  <div><dt>Supported by this evidence</dt><dd>{card.claimBoundary.supportedCriteria.length} criteria</dd></div>
                  <div><dt>Not supported by this evidence</dt><dd>{card.claimBoundary.unsupportedOptionalCriteria.length} optional criteria</dd></div>
                  <div><dt>Trace completeness</dt><dd>{card.trace.length} protected source records</dd></div>
                </dl>
                <section>
                  <span>Claim limit</span>
                  <p>{card.claimBoundary.limitation}</p>
                </section>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {share.cards.length === 0 ? (
        <DataState
          isLoading={false}
          error=""
          empty
          emptyTitle="No evidence in this share"
          emptyDescription="The selected cards may have been hidden or the link may have been updated."
        />
      ) : (
        <div className={styles.cards}>
          {share.cards.map((card) => (
            <article className={styles.card} key={card.cardId}>
              {share.cards.length > 1 ? (
                <button
                  type="button"
                  className={styles.compareToggle}
                  aria-pressed={comparisonIds.includes(card.cardId)}
                  onClick={() => toggleComparisonCard(card.cardId)}
                >
                  <Scale size={15} aria-hidden="true" />
                  {comparisonIds.includes(card.cardId) ? "Selected for comparison" : "Compare this card"}
                </button>
              ) : null}
              <div className={styles.details}>
                <section className={styles.passportStage} aria-label="Evidence passport">
                  <div className={styles.recordMeta}>
                    <span>Evidence record</span>
                    <strong>One verified work record</strong>
                    <p>Read the claim first, then follow the source trail that produced it.</p>
                    <div>
                      <SbBadge tone={getStatusTone(card.status)}>
                        {getEvidenceCardStatusLabel(card.status)}
                      </SbBadge>
                      <span>Public summary only</span>
                    </div>
                  </div>
                  <EvidencePassport
                    cardId={card.cardId}
                    title={card.opportunityTitle}
                    participantName={card.participantName}
                    providerName={card.providerName}
                    status={card.status}
                    issuedAt={card.issuedAt}
                    supportedCriteriaCount={card.claimBoundary.supportedCriteria.length}
                    contractVersionId={getTraceReferenceNumber(card.trace, "Evidence Contract")}
                    submissionRevision={getTraceReferenceNumber(card.trace, "Final Submission")}
                  />
                </section>
                <section className={styles.quickCheck} aria-label="Reviewer quick check">
                  <header>
                    <div>
                      <span>Start here</span>
                      <h3>Reviewer quick check</h3>
                    </div>
                    <ListChecks size={20} aria-hidden="true" />
                  </header>
                  <dl>
                    <div>
                      <dt>Work context</dt>
                      <dd>{card.claimBoundary.context}</dd>
                    </div>
                    <div>
                      <dt>Contribution</dt>
                      <dd>{card.claimBoundary.contribution || "Recorded in the evidence trace."}</dd>
                    </div>
                    <div>
                      <dt>Evaluator</dt>
                      <dd>{card.claimBoundary.evaluatedBy}</dd>
                    </div>
                    <div>
                      <dt>Supported criteria</dt>
                      <dd>
                        {card.claimBoundary.supportedCriteria.length} {card.claimBoundary.supportedCriteria.length === 1 ? "criterion" : "criteria"} supported
                      </dd>
                    </div>
                    <div>
                      <dt>Claim limit</dt>
                      <dd>{card.claimBoundary.limitation}</dd>
                    </div>
                  </dl>
                  <p>
                    <ShieldCheck size={15} aria-hidden="true" />
                    This public view includes only permitted evidence facts. Protected source files are never shared here.
                  </p>
                </section>
                <div className={styles.reviewGrid}>
                  <ClaimBoundaryPanel boundary={card.claimBoundary} />
                  <aside className={styles.nextStep}>
                    <span>How to read this record</span>
                    <strong>The claim is intentionally bounded.</strong>
                    <p>Supported criteria explain what this work demonstrates. The Evidence Trace shows why that claim can be checked.</p>
                    <ArrowDownRight size={22} aria-hidden="true" />
                  </aside>
                </div>
                <EvidenceTrace trace={card.trace} />
                {card.statusHistory.length > 0 ? (
                  <section className={styles.lifecycle}>
                    <header>
                      <h3>Card lifecycle</h3>
                      <p>Recorded corrections remain visible; source files remain protected.</p>
                    </header>
                    <ol>
                      {card.statusHistory.map((event) => (
                        <li key={`${event.occurredAt}-${event.newStatus}`}>
                          <SbBadge tone={getStatusTone(event.newStatus)}>
                            {getEvidenceCardStatusLabel(event.newStatus)}
                          </SbBadge>
                          <div>
                            <strong>{event.reason}</strong>
                            <span>
                              Recorded by {event.actorName} on {new Date(event.occurredAt).toLocaleDateString()}
                            </span>
                            {event.replacementCardId ? (
                              <span>Replacement record: SB-EV-{String(event.replacementCardId).padStart(6, "0")}</span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="sr-only"><FileWarning /> <CheckCircle2 /> <UserRoundCheck /> Protected source files are not included.</p>
    </main>
  );
}
