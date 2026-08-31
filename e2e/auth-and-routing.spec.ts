import { demoAccounts } from "./support/accounts";
import { clearAuth, expect, loginAs, test } from "./support/fixtures";

test("each seeded role reaches its authorized portal", async ({ page }) => {
  const journeys = [
    { account: demoAccounts.participant, heading: "Overview" },
    { account: demoAccounts.provider, heading: "Overview" },
    { account: demoAccounts.university, heading: "University Training" },
    { account: demoAccounts.admin, heading: "Overview" },
  ] as const;

  for (const journey of journeys) {
    await clearAuth(page);
    await loginAs(page, journey.account);
    await expect(page.getByRole("heading", { name: journey.heading, exact: true })).toBeVisible();
  }
});

test("role guards keep a participant out of the admin portal", async ({ page }) => {
  await loginAs(page, demoAccounts.participant);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/job-seeker\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
});

test("@mobile participant portal remains navigable on a phone", async ({ page }) => {
  await loginAs(page, demoAccounts.participant);
  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.locator("#job-seeker-portal-navigation");
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL(/\/job-seeker\/work(?:\/\d+)?$/);
  await expect(page.getByRole("heading", { name: "Work", exact: true })).toBeVisible();
});
