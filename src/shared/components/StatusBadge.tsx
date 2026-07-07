type StatusBadgeProps = {
  children: string;
  tone?: "blue" | "green" | "amber" | "red" | "neutral";
};

export default function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
