import { useEffect, useState } from "react";
import { FileWarning, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import DataState from "../../../shared/components/DataState";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import {
  getEvidenceCardStatusLabel,
  type PublicEvidenceShare,
} from "../domain/evidenceTypes";
import { getPublicEvidenceShareAsync } from "../infrastructure/evidenceApi";
import ClaimBoundaryPanel from "./ClaimBoundaryPanel";
import EvidenceTrace from "./EvidenceTrace";
import styles from "./PublicEvidenceSharePage.module.scss";

export default function PublicEvidenceSharePage() {
  const { token = "" } = useParams();
  const [share, setShare] = useState<PublicEvidenceShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>{share.ownerName}'s evidence</h1>
          <p>Selected, share-safe SkillBridge evidence records.</p>
        </div>
        <SbBadge tone="approved"><ShieldCheck size={15} /> Process-traceable</SbBadge>
      </header>
      {share.cards.length === 0 ? (
        <DataState
          isLoading={false}
          error=""
          empty
          emptyTitle="No active evidence in this share"
          emptyDescription="The selected cards may have been hidden or corrected."
        />
      ) : (
        <div className={styles.cards}>
          {share.cards.map((card) => (
            <article className={styles.card} key={card.cardId}>
              <header className={styles.cardHeader}>
                <div>
                  <p>SB-EV-{String(card.cardId).padStart(6, "0")}</p>
                  <h2>{card.opportunityTitle}</h2>
                  <p>{card.providerName} · {card.participantName}</p>
                </div>
                <SbBadge tone="approved">
                  {getEvidenceCardStatusLabel(card.status)}
                </SbBadge>
              </header>
              <div className={styles.details}>
                <ClaimBoundaryPanel boundary={card.claimBoundary} />
                <EvidenceTrace trace={card.trace} />
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="sr-only"><FileWarning /> Protected source files are not included.</p>
    </main>
  );
}
