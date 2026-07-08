import { type ReactNode } from "react";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "neutral";
};

export default function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
