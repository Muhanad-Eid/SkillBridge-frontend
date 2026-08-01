import type {
  CriterionEvaluation,
  WorkRecord,
} from "./workTypes";

export type CriterionDraft = {
  rating: number;
  note: string;
};

export function parseEvaluationCriteria(value?: string | null) {
  const criteria = (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^[-*\u2022]\s*/, ""))
    .filter(Boolean);

  return criteria.length > 0
    ? [...new Set(criteria)].slice(0, 12)
    : ["Completion of the defined opportunity requirements"];
}

export function buildCriterionDrafts(
  record: Pick<WorkRecord, "evaluationCriteria" | "criterionEvaluations">,
): Record<string, CriterionDraft> {
  const savedEvaluations = new Map(
    (record.criterionEvaluations ?? [])
      .filter(
        (item): item is CriterionEvaluation =>
          Boolean(item?.criterion?.trim()),
      )
      .map((item) => [item.criterion.trim().toLowerCase(), item]),
  );

  return Object.fromEntries(
    parseEvaluationCriteria(record.evaluationCriteria).map((criterion) => {
      const saved = savedEvaluations.get(criterion.toLowerCase());
      return [
        criterion,
        {
          rating: saved?.rating ?? 0,
          note: saved?.note ?? "",
        },
      ];
    }),
  );
}
