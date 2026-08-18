import { type ReactNode } from "react";
import SbBadge, { type SbBadgeTone } from "./primitives/SbBadge/SbBadge";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "neutral";
};

export default function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  const toneMap: Record<NonNullable<StatusBadgeProps["tone"]>, SbBadgeTone> = {
    blue: "info",
    green: "approved",
    amber: "pending",
    red: "rejected",
    neutral: "neutral",
  };

  return (
    <SbBadge className={`status-badge status-${tone}`} tone={toneMap[tone]}>
      {children}
    </SbBadge>
  );
}
