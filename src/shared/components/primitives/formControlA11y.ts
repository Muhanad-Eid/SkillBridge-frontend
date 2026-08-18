export function getDescribedBy(
  describedBy: string | undefined,
  errorId: string | undefined,
) {
  return [describedBy, errorId].filter(Boolean).join(" ") || undefined;
}
