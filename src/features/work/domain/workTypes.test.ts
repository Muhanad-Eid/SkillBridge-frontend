import { describe, expect, it } from "vitest";
import {
  getMilestoneStatusLabel,
  getTrainingReportStatusLabel,
  getWorkSubmissionStatusLabel,
  MilestoneStatuses,
  TrainingReportStatuses,
} from "./workTypes";

describe("getWorkSubmissionStatusLabel", () => {
  it("renders the dual-approval state for University Training", () => {
    // Status 3 is AwaitingUniversityApproval: the provider has approved but
    // the record cannot become issuance-ready until the university approves.
    expect(getWorkSubmissionStatusLabel(3)).toBe("University approval");
  });

  it("labels every participant-visible submission state", () => {
    expect(getWorkSubmissionStatusLabel(0)).toBe("Not submitted");
    expect(getWorkSubmissionStatusLabel(1)).toBe("Submitted");
    expect(getWorkSubmissionStatusLabel(2)).toBe("Needs changes");
    expect(getWorkSubmissionStatusLabel(4)).toBe("Approved");
  });
});

describe("training lifecycle labels", () => {
  it("labels milestone states used by the completion gate", () => {
    expect(getMilestoneStatusLabel(MilestoneStatuses.Planned)).toBe("Planned");
    expect(getMilestoneStatusLabel(MilestoneStatuses.Submitted)).toBe(
      "Submitted",
    );
    expect(getMilestoneStatusLabel(MilestoneStatuses.ChangesRequested)).toBe(
      "Needs changes",
    );
    expect(getMilestoneStatusLabel(MilestoneStatuses.Approved)).toBe(
      "Approved",
    );
  });

  it("labels training report review outcomes", () => {
    // A submitted report is reviewed by the provider before its hours count.
    expect(getTrainingReportStatusLabel(TrainingReportStatuses.Submitted)).toBe(
      "Awaiting company review",
    );
    expect(
      getTrainingReportStatusLabel(TrainingReportStatuses.ChangesRequested),
    ).toBe("Needs changes");
    expect(getTrainingReportStatusLabel(TrainingReportStatuses.Approved)).toBe(
      "Approved",
    );
  });
});
