import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, History, RefreshCw, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import SbBadge from "../../../shared/components/primitives/SbBadge/SbBadge";
import {
  EvidenceCardStatuses,
  getEvidenceCardStatusLabel,
  type EvidenceCardSummary,
  type EvidenceAuditEvent,
  type EvidenceDetails,
} from "../../evidence/domain/evidenceTypes";
import {
  getEvidenceCardsAsync,
  getEvidenceAuditEventsAsync,
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
  const [auditEvents, setAuditEvents] = useState<EvidenceAuditEvent[]>([]);
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
    void Promise.all([
      getEvidenceDetailsAsync(selectedId),
      getEvidenceAuditEventsAsync(selectedId),
    ])
      .then(([detailsResult, auditResult]) => {
        if (!cancelled) {
          setDetails(detailsResult);
          setAuditEvents(auditResult);
        }
      })
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
      <PageHeader
        eyebrow="Evidence lifecycle"
        title="Evidence controls"
        description="Audit issued records, lineage integrity, sharing state, revocation, and supersession."
      />
      {selected ? (
        <div className={styles.proofLaunch}>
          <div>
            <strong>Inspect this card in evidence checks</strong>
            <span>Replay its immutable issuance checks and exact evidence lineage.</span>
          </div>
          <Link className="button button-secondary" to={`/admin/proof-engine/${selected.applicationId}`}>
            Open evidence checks
          </Link>
        </div>
      ) : null}
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
                        <span>{new Date(event.occurredAt).toLocaleString()}</span>
                        <strong>{getEvidenceCardStatusLabel(event.newStatus)}</strong>
                        <span>Recorded by {event.actorName}</span>
                        <p>{event.reason}</p>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className={styles.audit}>
                  <h3><ClipboardList size={18} /> Evidence audit</h3>
                  {auditEvents.length > 0 ? (
                    <ul>
                      {auditEvents.map((event) => (
                        <li key={`${event.occurredAt}-${event.action}`}>
                          <span>{new Date(event.occurredAt).toLocaleString()}</span>
                          <strong>{event.action}</strong>
                          <span>{event.actorName}</span>
                          {event.detail ? <p>{event.detail}</p> : null}
                        </li>
                      ))}
                    </ul>
                  ) : <p>No evidence-affecting audit events have been recorded.</p>}
                </section>
                {selected.status === EvidenceCardStatuses.Active ? (
                  <section className={styles.actions}>
                    <h3><ShieldAlert size={18} /> Authorized correction</h3>
                    <label className="field">
                      <span>Reason</span>
                      <textarea value={reason} minLength={10} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
                    </label>
                    <label className="field" hidden>
                      <span>Replacement evidence (for supersession)</span>
                      <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)}>
                        <option value="">Select an active replacement</option>
                        {replacements.map((card) => (
                          <option key={card.cardId} value={card.cardId}>{card.opportunityTitle} · SB-EV-{card.cardId}</option>
                        ))}
                      </select>
                    </label>
                    <p className={styles.replacementNote}>
                      Supersession creates a controlled replacement from this same participation only after the server rechecks the issuance protocol. The original record remains in the lifecycle history.
                    </p>
                    <div className={styles.actionButtons}>
                      <Button variant="danger" disabled={reason.trim().length < 10} isLoading={busy} onClick={() => void run(() => revokeEvidenceAsync(selected.cardId, reason.trim()))}>
                        Revoke evidence
                      </Button>
                      <Button variant="secondary" disabled={reason.trim().length < 10} isLoading={busy} onClick={() => void run(() => supersedeEvidenceAsync(selected.cardId, reason.trim()))}>
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
