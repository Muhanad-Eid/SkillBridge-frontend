import { describe, expect, it } from "vitest";
import {
  getNotificationDestination,
  type Notification,
} from "./notificationTypes";

function createNotification(
  values: Partial<Notification> = {},
): Notification {
  return {
    id: 1,
    userId: "user-1",
    title: "Update",
    message: "Something changed.",
    type: 1,
    actionUrl: null,
    isRead: false,
    createdAt: "2026-07-23T12:00:00Z",
    ...values,
  };
}

describe("notification destinations", () => {
  it("uses a safe destination supplied by the API", () => {
    const notification = createNotification({
      actionUrl: "/job-seeker/work/42",
    });

    expect(getNotificationDestination(notification, "JobSeeker")).toBe(
      "/job-seeker/work/42",
    );
  });

  it("falls back to the relevant portal section for older notifications", () => {
    expect(
      getNotificationDestination(createNotification({ type: 3 }), "JobSeeker"),
    ).toBe("/job-seeker/reviews");

    expect(
      getNotificationDestination(createNotification({ type: 1 }), "Company"),
    ).toBe("/company/applications");
  });

  it("does not use external or protocol-relative destinations", () => {
    expect(
      getNotificationDestination(
        createNotification({ actionUrl: "//example.com" }),
        "Company",
      ),
    ).toBe("/company/applications");

    expect(
      getNotificationDestination(
        createNotification({ actionUrl: "https://example.com" }),
        "JobSeeker",
      ),
    ).toBe("/job-seeker/applications");
  });
});
