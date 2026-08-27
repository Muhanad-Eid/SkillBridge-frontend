import {
  BadgeCheck,
  CalendarDays,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
} from "lucide-react";
import {
  EvidenceCardStatuses,
  getEvidenceCardStatusLabel,
  type EvidenceCardStatus,
} from "../domain/evidenceTypes";
import styles from "./EvidencePassport.module.scss";

type EvidencePassportProps = {
  cardId: number;
  title: string;
  participantName: string;
  providerName: string;
  status: EvidenceCardStatus;
  issuedAt: string | null;
  contractVersionId?: number | null;
  submissionRevision?: number | null;
  supportedCriteriaCount: number;
};

function statusClass(status: EvidenceCardStatus) {
  if (status === EvidenceCardStatuses.Revoked) return styles.revoked;
  if (status === EvidenceCardStatuses.Superseded) return styles.superseded;
  return styles.active;
}

export default function EvidencePassport({
  cardId,
  title,
  participantName,
  providerName,
  status,
  issuedAt,
  contractVersionId,
  submissionRevision,
  supportedCriteriaCount,
}: EvidencePassportProps) {
  const reference = `SB-EV-${String(cardId).padStart(6, "0")}`;

  return (
    <section className={`${styles.passport} ${statusClass(status)}`} aria-label={`Skill Evidence Card ${reference}`}>
      <div className={styles.rail} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.brandMark} aria-hidden="true">
          <BadgeCheck size={22} />
        </div>
        <div>
          <span>SkillBridge evidence passport</span>
          <strong>{reference}</strong>
        </div>
        <div className={styles.status}>
          <i aria-hidden="true" />
          {getEvidenceCardStatusLabel(status)}
        </div>
      </header>
      <div className={styles.body}>
        <div>
          <span className={styles.eyebrow}>Protected evidence record</span>
          <h3>{title}</h3>
          <p>{participantName} · {providerName}</p>
        </div>
        <div className={styles.stamp} aria-hidden="true">
          <Fingerprint size={28} />
          <span>TRACEABLE</span>
        </div>
      </div>
      <dl className={styles.meta}>
        <div>
          <FileCheck2 size={16} aria-hidden="true" />
          <dt>Supported criteria</dt>
          <dd>{supportedCriteriaCount}</dd>
        </div>
        <div>
          <CalendarDays size={16} aria-hidden="true" />
          <dt>Issued</dt>
          <dd>{issuedAt ? new Date(issuedAt).toLocaleDateString() : "Recorded"}</dd>
        </div>
        <div>
          <LockKeyhole size={16} aria-hidden="true" />
          <dt>Source facts</dt>
          <dd>Protected</dd>
        </div>
      </dl>
      <footer>
        <span>Contract {contractVersionId ? `v${contractVersionId}` : "recorded"}</span>
        <span>Submission {submissionRevision ? `r${submissionRevision}` : "recorded"}</span>
      </footer>
    </section>
  );
}
