import { describe, expect, it } from "vitest";
import {
  buildCriterionDrafts,
  parseEvaluationCriteria,
} from "./workEvaluation";

describe("work evaluation criteria", () => {
  it("creates empty drafts when an older work record has no saved evaluations", () => {
    expect(
      buildCriterionDrafts({
        evaluationCriteria: "Code quality\nTesting",
        criterionEvaluations: undefined,
      }),
    ).toEqual({
      "Code quality": { rating: 0, note: "" },
      Testing: { rating: 0, note: "" },
    });
  });

  it("restores saved evaluations without depending on criterion casing", () => {
    expect(
      buildCriterionDrafts({
        evaluationCriteria: "Code quality",
        criterionEvaluations: [
          {
            criterion: "code QUALITY",
            rating: 3,
            note: "Clear structure and naming.",
          },
        ],
      }),
    ).toEqual({
      "Code quality": {
        rating: 3,
        note: "Clear structure and naming.",
      },
    });
  });

  it("provides an approval criterion for older opportunities with no criteria", () => {
    expect(parseEvaluationCriteria(undefined)).toEqual([
      "Completion of the defined opportunity requirements",
    ]);
  });
});
