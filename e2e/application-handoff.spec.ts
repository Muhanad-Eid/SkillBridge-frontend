import { demoAccounts } from "./support/accounts";
import { expect, loginAs, logout, test } from "./support/fixtures";

let createdProjectId: number | undefined;
let createdParticipantEmail: string | undefined;

test.afterEach(async ({ request }) => {
  if (!createdProjectId && !createdParticipantEmail) return;

  const providerLogin = await request.post("/api/auth/login", {
    data: {
      email: demoAccounts.provider.email,
      password: "DemoPass123!",
    },
  });
  expect(providerLogin.ok(), "The E2E cleanup provider could not sign in.").toBeTruthy();

  if (createdProjectId) {
    const { token } = (await providerLogin.json()) as { token: string };
    const cancelProject = await request.put(`/api/projects/${createdProjectId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 3 },
    });
    expect(cancelProject.ok(), "The E2E opportunity could not be cancelled.").toBeTruthy();
  }

  if (createdParticipantEmail) {
    const adminLogin = await request.post("/api/auth/login", {
      data: {
        email: demoAccounts.admin.email,
        password: "DemoPass123!",
      },
    });
    expect(adminLogin.ok(), "The E2E cleanup administrator could not sign in.").toBeTruthy();

    const { token } = (await adminLogin.json()) as { token: string };
    const headers = { Authorization: `Bearer ${token}` };
    const usersResponse = await request.get("/api/admin/users", {
      headers,
      params: { page: 1, pageSize: 10, search: createdParticipantEmail },
    });
    expect(usersResponse.ok(), "The E2E participant could not be found for cleanup.").toBeTruthy();

    const users = (await usersResponse.json()) as {
      items: Array<{ id: string; email: string }>;
    };
    const participant = users.items.find(
      (user) => user.email.toLowerCase() === createdParticipantEmail?.toLowerCase(),
    );

    if (participant) {
      const deleteParticipant = await request.delete(`/api/admin/users/${participant.id}`, { headers });
      expect(deleteParticipant.ok(), "The E2E participant could not be deactivated.").toBeTruthy();
    }
  }

  createdProjectId = undefined;
  createdParticipantEmail = undefined;
});

test("a participant applies and the provider accepts the application", async ({ page, request }, testInfo) => {
  test.setTimeout(120_000);
  const runId = `${Date.now()}-${testInfo.workerIndex}`;
  const participantName = `E2E Candidate ${runId}`;
  const email = `e2e.candidate.${runId}@skillbridge.local`;
  const opportunityTitle = `E2E evidence placement ${runId}`;
  createdParticipantEmail = email;

  const providerLogin = await request.post("/api/auth/login", {
    data: {
      email: demoAccounts.provider.email,
      password: "DemoPass123!",
    },
  });
  expect(providerLogin.ok()).toBeTruthy();
  const { token } = (await providerLogin.json()) as { token: string };

  const projectResponse = await request.post("/api/projects", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: opportunityTitle,
      description: "Build and validate an accessible evidence workflow.",
      requirements: "Frontend delivery and accessibility testing experience.",
      deliverables: "A tested workflow implementation and concise evidence note.",
      evaluationCriteria: "Accessible behavior and verifiable delivery quality.",
      milestonePlan: "Audit, implement, and verify.",
      applicationTask: "Describe how you would validate the workflow.",
      workMode: 0,
      experienceLevel: 0,
      positionsAvailable: 1,
      durationWeeks: 4,
      type: 0,
      requiredSkillNames: ["React"],
      preferredSkillNames: ["TypeScript"],
      milestones: [
        {
          title: "Verified implementation",
          description: "Deliver and verify the requested workflow.",
          dueAfterDays: 14,
        },
      ],
      evidenceCriteria: [
        {
          title: "Accessible delivery",
          description: "The submitted workflow is usable and testable.",
          evaluationType: 0,
          minimumRating: 2,
          isRequired: true,
          sortOrder: 0,
        },
      ],
    },
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = (await projectResponse.json()) as { id: number };
  createdProjectId = project.id;
  const publishResponse = await request.post(`/api/projects/${project.id}/publish`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(publishResponse.ok()).toBeTruthy();

  await page.goto("/register");
  await page.getByRole("radio", { name: /job seeker/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel("First name").fill("E2E Candidate");
  await page.getByLabel("Last name").fill(runId);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Create password").fill("E2ePass123!");
  await page.getByLabel("Confirm password").fill("E2ePass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/job-seeker\/profile\?required=1$/);
  await page.getByRole("textbox", { name: /professional bio/i }).fill(
    "Frontend engineer focused on accessible systems, testable workflows, and evidence-backed delivery.",
  );
  await page.getByRole("textbox", { name: /^city/i }).fill("Amman");
  await page.getByRole("button", { name: "Complete profile" }).click();
  await expect(page).toHaveURL(/\/job-seeker\/dashboard$/);

  await page.goto("/job-seeker/opportunities");
  await page.getByRole("textbox", { name: "Search opportunities" }).fill(opportunityTitle);
  const opportunity = page.locator("article").filter({ hasText: opportunityTitle });
  await opportunity.getByRole("link", { name: "View details" }).click();
  await expect(page.getByRole("heading", { name: opportunityTitle, exact: true })).toBeVisible();

  const applicationForm = page.locator("form").filter({ hasText: "Apply to this opportunity" });
  await applicationForm.locator("textarea").nth(1).fill(
    "I would audit the component architecture, accessibility behavior, and evidence trace before proposing focused improvements.",
  );
  await applicationForm.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Application submitted", { exact: true })).toBeVisible();

  await logout(page);
  await loginAs(page, demoAccounts.provider);
  await page.goto("/company/applications");
  await page.getByRole("textbox", { name: "Search applications" }).fill(participantName);
  const application = page.locator("article").filter({ hasText: participantName });
  await expect(application).toContainText(opportunityTitle);
  await application.getByRole("button", { name: `Accept ${participantName}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Accept applicant" }).click();
  await expect(page.getByText(`${participantName} was accepted for ${opportunityTitle}.`)).toBeVisible();

  await logout(page);
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill("E2ePass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/job-seeker\/dashboard$/);
  await page.goto("/job-seeker/work");
  await expect(page.getByText(opportunityTitle, { exact: true })).toBeVisible();
});
