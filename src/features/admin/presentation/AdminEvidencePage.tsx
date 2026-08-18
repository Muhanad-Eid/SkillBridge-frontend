import { useCallback, useEffect, useMemo, useState } from "react";
import { History, RefreshCw, ShieldAlert } from "lucide-react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import {
  EvidenceCardStatuses,
  getEvidenceCardStatusLabel,
  type EvidenceCardSummary,
  type EvidenceDetails,
} from "../../evidence/domain/evidenceTypes";
import {
  getEvidenceCardsAsync,
  getEvidenceDetailsAsync,
  revokeEvidenceAsync,
  supersedeEvidenceAsync,
} from "../../evidence/infrastructure/evidenceApi";
import ClaimBoundaryPanel from "../../evidence/presentation/ClaimBoundaryPanel";
import EvidenceTrace from "../../evidence/presentation/EvidenceTrace";
import styles from "./AdminEvidencePage.module.scss";

export default function AdminEvidencePage() {
  const [cards, setCards] = useState<EvidenceCardSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<EvidenceDetails | null>(null);
  const [reason, setReason] = useState("");
  const [replacementId, setReplacementId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getEvidenceCardsAsync();
      setCards(result);
      setSelectedId((current) =>
        result.some((card) => card.cardId === current)
          ? current
          : result[0]?.cardId ?? null,
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load evidence.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    void getEvidenceDetailsAsync(selectedId)
      .then((result) => { if (!cancelled) setDetails(result); })
      .catch((caughtError: unknown) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Unable to inspect evidence.");
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  const selected = useMemo(
    () => cards.find((card) => card.cardId === selectedId) ?? null,
    [cards, selectedId],
  );
  const replacements = cards.filter((card) =>
    card.cardId !== selectedId &&
    card.status === EvidenceCardStatuses.Active &&
    card.participantName === selected?.participantName,
  );

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try {
      await action();
      setMessage("Evidence lifecycle updated and recorded in history.");
      setReason(""); setReplacementId("");
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update evidence.");
    } finally { setBusy(false); }
  }

  return (
    <section className="page">
      <PageHeader title="Evidence controls" />
      {message ? <div className="notice notice-success">{message}</div> : null}
      <DataState
        isLoading={isLoading}
        error={error && cards.length === 0 ? error : ""}
        empty={!isLoading && !error && cards.length === 0}
        emptyTitle="No issued evidence"
        emptyDescription="Issued Skill Evidence Cards will appear here."
      />
      {cards.length > 0 ? (
        <div className={styles.layout}>
          <aside className={styles.list} aria-label="Issued evidence records">
            {cards.map((card) => (
              <button
                type="button"
                key={card.cardId}
                aria-current={card.cardId === selectedId}
                onClick={() => setSelectedId(card.cardId)}
              >
                <span>SB-EV-{String(card.cardId).padStart(6, "0")}</span>
                <strong>{card.opportunityTitle}</strong>
                <small>{card.participantName} · {getEvidenceCardStatusLabel(card.status)}</small>
              </button>
            ))}
          </aside>
          <main className={styles.detail}>
            {selected && details?.cardId === selected.cardId ? (
              <>
                <header>
                  <SbBadge tone={selected.status === 0 ? "approved" : "revoked"}>
                    {getEvidenceCardStatusLabel(selected.status)}
                  </SbBadge>
                  <h2>{selected.opportunityTitle}</h2>
                  <p>{selected.participantName} · {selected.providerName}</p>
                </header>
                <ClaimBoundaryPanel boundary={details.claimBoundary} />
                <EvidenceTrace trace={details.trace} />
                <section>
                  <h3><History size={18} /> Status history</h3>
                  <ul>
                    {details.statusHistory.map((event) => (
                      <li key={`${event.occurredAt}-${event.newStatus}`}>
                        {new Date(event.occurredAt).toLocaleString()}: {event.reason}
                      </li>
                    ))}
                  </ul>
                </section>
                {selected.status === EvidenceCardStatuses.Active ? (
                  <section className={styles.actions}>
                    <h3><ShieldAlert size={18} /> Authorized correction</h3>
                    <label className="field">
                      <span>Reason</span>
                      <textarea value={reason} minLength={10} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Replacement evidence (for supersession)</span>
                      <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)}>
                        <option value="">Select an active replacement</option>
                        {replacements.map((card) => (
                          <option key={card.cardId} value={card.cardId}>{card.opportunityTitle} · SB-EV-{card.cardId}</option>
                        ))}
                      </select>
                    </label>
                    <div className={styles.actionButtons}>
                      <Button variant="danger" disabled={reason.trim().length < 10} isLoading={busy} onClick={() => void run(() => revokeEvidenceAsync(selected.cardId, reason.trim()))}>
                        Revoke evidence
                      </Button>
                      <Button variant="secondary" disabled={reason.trim().length < 10 || !replacementId} isLoading={busy} onClick={() => void run(() => supersedeEvidenceAsync(selected.cardId, reason.trim(), Number(replacementId)))}>
                        Supersede with replacement
                      </Button>
                    </div>
                  </section>
                ) : null}
              </>
            ) : <Button variant="ghost" onClick={() => void load()}><RefreshCw size={16} /> Reload</Button>}
          </main>
        </div>
      ) : null}
    </section>
  );
}
