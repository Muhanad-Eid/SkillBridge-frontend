import { expect, test as base, type Page } from "@playwright/test";
import { demoPassword, type DemoAccount } from "./accounts";

export async function loginAs(page: Page, account: DemoAccount) {
  await page.goto(account.loginPath);
  const isAdminLogin = account.loginPath === "/admin/login";
  await (isAdminLogin
    ? page.getByLabel("Admin email")
    : page.getByPlaceholder("Email address")
  ).fill(account.email);
  await (isAdminLogin
    ? page.locator('input[name="password"]')
    : page.getByPlaceholder("Password")
  ).fill(demoPassword);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(new RegExp(`${account.homePath.replaceAll("/", "\\/")}$`));
}

export async function logout(page: Page) {
  const accountMenuButton = page.getByRole("button", { name: /open account menu/i });
  if (await accountMenuButton.isVisible()) {
    await accountMenuButton.click();
  }
  await page.getByRole("button", { name: /^Log out$/i }).first().click();
  await page.getByRole("alertdialog", { name: "Log out?" }).getByRole("button", { name: /^Log out$/i }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function clearAuth(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload();
}

export const test = base.extend<{ consoleHealth: void }>({
  consoleHealth: [
    async ({ page }, use) => {
      const failures: string[] = [];
      page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() === "error") failures.push(`console: ${message.text()}`);
      });

      await use();
      expect(failures, "The browser emitted runtime errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
