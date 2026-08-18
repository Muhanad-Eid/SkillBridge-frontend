import type { HTMLAttributes, ReactNode } from "react";
import styles from "./SbBadge.module.scss";

export type SbBadgeTone =
  | "approved"
  | "pending"
  | "blocked"
  | "rejected"
  | "revoked"
  | "info"
  | "neutral";

export type SbBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: SbBadgeTone;
};

export default function SbBadge({
  children,
  tone = "neutral",
  className = "",
  ...props
}: SbBadgeProps) {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(" ");

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
