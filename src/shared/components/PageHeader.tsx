import { type ReactNode } from "react";
import styles from "./PageHeader.module.scss";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <header className={`page-header ${styles.root}`}>
      <div className={styles.copy}>
        {eyebrow ? <p className={`page-header-eyebrow ${styles.eyebrow}`}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={`page-actions ${styles.actions}`}>{actions}</div> : null}
    </header>
  );
}
