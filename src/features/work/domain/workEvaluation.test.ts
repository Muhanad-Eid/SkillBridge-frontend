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
      "legacy:0": { rating: 0, note: "" },
      "legacy:1": { rating: 0, note: "" },
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
      "legacy:0": {
        rating: 3,
        note: "Clear structure and naming.",
      },
    });
  });

  it("keeps criteria with identical titles separate through their stable IDs", () => {
    expect(
      buildCriterionDrafts(
        {
          evaluationCriteria: "Testing",
          criterionEvaluations: [
            {
              criterionId: 11,
              criterion: "Testing",
              rating: 3,
              note: "Unit coverage is complete.",
            },
            {
              criterionId: 12,
              criterion: "Testing",
              rating: 1,
              note: "Integration coverage needs work.",
            },
          ],
        },
        [
          {
            id: 11,
            title: "Testing",
            description: null,
            evaluationType: 0,
            minimumRating: 2,
            isRequired: true,
            sortOrder: 0,
          },
          {
            id: 12,
            title: "Testing",
            description: null,
            evaluationType: 0,
            minimumRating: 2,
            isRequired: false,
            sortOrder: 1,
          },
        ],
      ),
    ).toEqual({
      "criterion:11": { rating: 3, note: "Unit coverage is complete." },
      "criterion:12": {
        rating: 1,
        note: "Integration coverage needs work.",
      },
    });
  });

  it("provides an approval criterion for older opportunities with no criteria", () => {
    expect(parseEvaluationCriteria(undefined)).toEqual([
      "Completion of the defined opportunity requirements",
    ]);
  });
});
