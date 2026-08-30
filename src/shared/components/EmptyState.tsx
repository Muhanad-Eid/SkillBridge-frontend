import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <section className={`empty-state ${styles.root}`}>
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <Inbox size={22} />}
      </span>
      <div className={styles.copy}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
