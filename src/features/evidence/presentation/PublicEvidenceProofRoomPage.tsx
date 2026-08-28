import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ClipboardCopy,
  FileCheck2,
  FileWarning,
  GitBranch,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useParams } from "react-router-dom";
import DataState from "../../../shared/components/DataState";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import type { PublicEvidenceShare } from "../domain/evidenceTypes";
import { getPublicEvidenceShareAsync } from "../infrastructure/evidenceApi";
import EvidenceProofRoom from "./EvidenceProofRoom";
import styles from "./PublicEvidenceSharePage.module.scss";

export default function PublicEvidenceProofRoomPage() {
  const { token = "" } = useParams();
  const [share, setShare] = useState<PublicEvidenceShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    void getPublicEvidenceShareAsync(token)
      .then((result) => {
        if (!cancelled) {
          setShare(result);
          setSelectedCardId(result.cards[0]?.cardId ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("This evidence share is invalid, disabled, expired, or no longer available.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const selectedCard = useMemo(
    () => share?.cards.find((card) => card.cardId === selectedCardId) ?? share?.cards[0] ?? null,
    [selectedCardId, share],
  );
  const comparisonCards = useMemo(
    () => share?.cards.filter((card) => comparisonIds.includes(card.cardId)) ?? [],
    [comparisonIds, share],
  );

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2400);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  if (isLoading || error || !share) {
    return (
      <main className={styles.page}>
        <DataState
          isLoading={isLoading}
          error={error}
          empty={!isLoading && !error && !share}
          emptyTitle="Evidence share unavailable"
          emptyDescription="Ask the owner to create a new share link."
        />
      </main>
    );
  }

  function toggleComparisonCard(cardId: number) {
    setComparisonIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : current.length === 2
          ? [current[1], cardId]
          : [...current, cardId],
    );
  }

  async function copyReviewerLink() {
    try {
      const url = window.location.href;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Copy command was rejected.");
      }
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.kicker}>SkillBridge Proof Room</span>
          <h1>{share.ownerName}'s verified work</h1>
          <p>Inspect the protected path from accepted requirements to a bounded evidence claim. No account is required.</p>
        </div>
        <div className={styles.headingActions}>
          <div className={styles.headingSeal}>
            <ShieldCheck size={19} aria-hidden="true" />
            <div><strong>Share-safe verification</strong><span>Protected files remain private</span></div>
          </div>
          <button type="button" className={styles.copyLink} onClick={() => void copyReviewerLink()}>
            {copyState === "copied" ? <Check size={17} aria-hidden="true" /> : <ClipboardCopy size={17} aria-hidden="true" />}
            {copyState === "copied" ? "Link copied" : copyState === "error" ? "Copy unavailable" : "Copy reviewer link"}
          </button>
          <span className="sr-only" aria-live="polite">
            {copyState === "copied" ? "Reviewer link copied to clipboard." : copyState === "error" ? "The reviewer link could not be copied." : ""}
          </span>
        </div>
      </header>

      {share.cards.length === 0 ? (
        <DataState
          isLoading={false}
          error=""
          empty
          emptyTitle="No evidence in this share"
          emptyDescription="The selected cards may have been hidden or the link may have been updated."
        />
      ) : (
        <>
          {selectedCard ? (
            <section className={styles.reviewSummary} aria-label="Evidence review summary">
              <article>
                <span className={styles.summaryIcon}><FileCheck2 size={18} aria-hidden="true" /></span>
                <div><small>Evaluation basis</small><strong>Accepted contract preserved</strong></div>
              </article>
              <article>
                <span className={styles.summaryIcon}><GitBranch size={18} aria-hidden="true" /></span>
                <div><small>Trace coverage</small><strong>{selectedCard.trace.length} source checkpoints</strong></div>
              </article>
              <article>
                <span className={styles.summaryIcon}><BadgeCheck size={18} aria-hidden="true" /></span>
                <div>
                  <small>Bounded outcome</small>
                  <strong>{selectedCard.claimBoundary.supportedCriteria.length} supported · {selectedCard.claimBoundary.unsupportedOptionalCriteria.length} not supported</strong>
                </div>
              </article>
            </section>
          ) : null}

          {share.cards.length > 1 ? (
            <section className={styles.recordRail} aria-label="Shared evidence records">
              <header>
                <div><span>Shared records</span><strong>Choose evidence to verify</strong></div>
                <small>{share.cards.length} cards available</small>
              </header>
              <div>
                {share.cards.map((card) => {
                  const active = selectedCard?.cardId === card.cardId;
                  const comparing = comparisonIds.includes(card.cardId);
                  return (
                    <article key={card.cardId} data-active={active ? "true" : "false"}>
                      <button type="button" onClick={() => setSelectedCardId(card.cardId)}>
                        <span>SB-EV-{String(card.cardId).padStart(6, "0")}</span>
                        <strong>{card.opportunityTitle}</strong>
                        <small>{card.providerName}</small>
                      </button>
                      <button
                        type="button"
                        className={styles.compareButton}
                        aria-pressed={comparing}
                        aria-label={`${comparing ? "Remove" : "Add"} ${card.opportunityTitle} ${comparing ? "from" : "to"} comparison`}
                        onClick={() => toggleComparisonCard(card.cardId)}
                      >
                        {comparing ? <Check size={15} /> : <Scale size={15} />}
                        {comparing ? "Selected" : "Compare"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {comparisonCards.length === 2 ? (
            <section className={styles.comparison} aria-labelledby="evidence-comparison-title">
              <header>
                <div><span>Reviewer comparison</span><h2 id="evidence-comparison-title">Compare claim scope and trace depth</h2></div>
                <button type="button" onClick={() => setComparisonIds([])}>Clear comparison</button>
              </header>
              <div className={styles.comparisonGrid}>
                {comparisonCards.map((card) => (
                  <article key={card.cardId}>
                    <header>
                      <span>SB-EV-{String(card.cardId).padStart(6, "0")}</span>
                      <strong>{card.opportunityTitle}</strong>
                      <small>{card.providerName}</small>
                    </header>
                    <dl>
                      <div><dt>Supported</dt><dd>{card.claimBoundary.supportedCriteria.length} criteria</dd></div>
                      <div><dt>Not supported</dt><dd>{card.claimBoundary.unsupportedOptionalCriteria.length} optional criteria</dd></div>
                      <div><dt>Trace depth</dt><dd>{card.trace.length} checkpoints</dd></div>
                    </dl>
                    <section><span>Claim limit</span><p>{card.claimBoundary.limitation}</p></section>
                    <button type="button" onClick={() => setSelectedCardId(card.cardId)}>Open in Proof Room</button>
                  </article>
                ))}
              </div>
            </section>
          ) : comparisonIds.length === 1 ? (
            <div className={styles.comparisonHint}>
              <Scale size={17} aria-hidden="true" />
              <span>Select one more card to compare its claim boundary and trace depth.</span>
              <SbBadge tone="info">1/2 selected</SbBadge>
            </div>
          ) : null}

          {selectedCard ? <EvidenceProofRoom key={selectedCard.cardId} card={selectedCard} /> : null}
        </>
      )}

      <footer className={styles.shareFooter}>
        <ShieldCheck size={17} aria-hidden="true" />
        <span>Generated from protected SkillBridge records</span>
        <small>{share.expiresAt ? `Share expires ${new Date(share.expiresAt).toLocaleDateString()}` : "Owner-controlled public share"}</small>
      </footer>
      <p className="sr-only"><FileWarning /> Protected source files are not included.</p>
    </main>
  );
}
