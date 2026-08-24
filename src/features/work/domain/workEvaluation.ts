import type {
  CriterionEvaluation,
  WorkRecord,
} from "./workTypes";
import type { EvidenceCriterion } from "../../projects/domain/projectTypes";

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

export function getCriterionDraftKey(
  criterion: Pick<EvidenceCriterion, "id">,
  index: number,
) {
  return criterion.id > 0 ? `criterion:${criterion.id}` : `legacy:${index}`;
}

export function buildCriterionDrafts(
  record: Pick<WorkRecord, "evaluationCriteria" | "criterionEvaluations">,
  criteria?: EvidenceCriterion[],
): Record<string, CriterionDraft> {
  const savedById = new Map(
    (record.criterionEvaluations ?? [])
      .filter((item): item is CriterionEvaluation => item?.criterionId != null)
      .map((item) => [item.criterionId!, item]),
  );
  const savedByLegacyTitle = new Map(
    (record.criterionEvaluations ?? [])
      .filter(
        (item): item is CriterionEvaluation =>
          item?.criterionId == null && Boolean(item?.criterion?.trim()),
      )
      .map((item) => [item.criterion.trim().toLowerCase(), item]),
  );
  const effectiveCriteria = criteria?.length
    ? criteria
    : parseEvaluationCriteria(record.evaluationCriteria).map((title, index) => ({
        id: -(index + 1),
        title,
        description: null,
        evaluationType: 0 as const,
        minimumRating: 2 as const,
        isRequired: true,
        sortOrder: index,
      }));

  return Object.fromEntries(
    effectiveCriteria.map((criterion, index) => {
      const saved = criterion.id > 0
        ? savedById.get(criterion.id)
        : savedByLegacyTitle.get(criterion.title.trim().toLowerCase());
      return [
        getCriterionDraftKey(criterion, index),
        { rating: saved?.rating ?? 0, note: saved?.note ?? "" },
      ];
    }),
  );
}
