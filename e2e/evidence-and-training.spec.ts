import { demoAccounts, publicShareToken } from "./support/accounts";
import { expect, loginAs, test } from "./support/fixtures";

test("participant can inspect active work and issued evidence", async ({ page }) => {
  await loginAs(page, demoAccounts.participant);
  await page.goto("/job-seeker/work");
  await expect(page.getByRole("heading", { name: "Work", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "University training passport", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revision and feedback exercise", exact: true })).toBeVisible();

  await page.goto("/job-seeker/portfolio");
  await expect(page.getByRole("heading", { name: /Evidence Portfolio$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence-ready product brief", exact: true })).toBeVisible();
});

test("university training exposes company and university as separate approval gates", async ({ page }) => {
  await loginAs(page, demoAccounts.university);
  await expect(page.getByRole("heading", { name: "University Training", exact: true })).toBeVisible();
  await expect(page.getByText("Company approval", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("University approval", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("This is the second required approval.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Complete university approval", exact: true })).toBeVisible();
});

test("an anonymous reviewer can verify the public proof and claim boundary", async ({ page }) => {
  await page.goto(`/evidence/share/${publicShareToken}`);
  await expect(page.getByRole("heading", { name: /verified work$/i })).toBeVisible();
  await expect(page.getByText("SkillBridge Proof Room", { exact: true })).toBeVisible();
  await expect(page.getByText("Supported by this evidence", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evaluated but not supported" })).toBeVisible();
  await expect(page.getByText("Issuance checks passed", { exact: true })).toBeVisible();
});
