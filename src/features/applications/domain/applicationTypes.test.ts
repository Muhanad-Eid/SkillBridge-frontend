import { describe, expect, it } from "vitest";
import { OpportunityTypes } from "../../projects/domain/projectTypes";
import {
  ApplicationStatuses,
  getApplicationStatusLabelForOpportunity,
} from "./applicationTypes";

describe("getApplicationStatusLabelForOpportunity", () => {
  it("uses proposal language for freelance tasks", () => {
    expect(
      getApplicationStatusLabelForOpportunity(
        ApplicationStatuses.Pending,
        OpportunityTypes.FreelanceTask,
      ),
    ).toBe("Proposal sent");
    expect(
      getApplicationStatusLabelForOpportunity(
        ApplicationStatuses.Accepted,
        OpportunityTypes.FreelanceTask,
      ),
    ).toBe("Proposal accepted");
  });

  it("keeps application language for other opportunity types", () => {
    expect(
      getApplicationStatusLabelForOpportunity(
        ApplicationStatuses.Pending,
        OpportunityTypes.ProfessionalProject,
      ),
    ).toBe("Pending");
  });
});
