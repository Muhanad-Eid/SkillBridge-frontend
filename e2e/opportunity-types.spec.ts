import { demoAccounts, demoPassword } from "./support/accounts";
import { expect, test } from "./support/fixtures";

let createdProjectIds: number[] = [];

test.afterEach(async ({ request }) => {
  if (createdProjectIds.length === 0) return;

  const login = await request.post("/api/auth/login", {
    data: {
      email: demoAccounts.provider.email,
      password: demoPassword,
    },
  });
  expect(login.ok(), "The E2E cleanup provider could not sign in.").toBeTruthy();
  const { token } = (await login.json()) as { token: string };

  for (const projectId of createdProjectIds) {
    const response = await request.put(`/api/projects/${projectId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 3 },
    });
    expect(response.ok(), `The E2E opportunity ${projectId} could not be cancelled.`).toBeTruthy();
  }

  createdProjectIds = [];
});

test("a provider can create and publish every canonical opportunity type", async ({ request }, testInfo) => {
  test.setTimeout(120_000);
  const runId = `${Date.now()}-${testInfo.workerIndex}`;
  const login = await request.post("/api/auth/login", {
    data: {
      email: demoAccounts.provider.email,
      password: demoPassword,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = (await login.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const base = {
    description: "A scoped evidence-backed delivery for the local workflow test.",
    requirements: "Use clear implementation notes and accessible behavior.",
    deliverables: "A working deliverable and a concise completion summary.",
    evaluationCriteria: "The completed work meets the stated criteria.",
    milestonePlan: "Plan, complete, and verify the work.",
    applicationTask: "Describe the approach you would take to complete this work.",
    workMode: 0,
    experienceLevel: 0,
    positionsAvailable: 1,
    durationWeeks: 2,
    requiredSkillNames: ["React"],
    preferredSkillNames: ["Testing"],
    evidenceCriteria: [
      {
        title: "Verified delivery",
        description: "The submitted work is complete and reviewable.",
        evaluationType: 0,
        minimumRating: 2,
        isRequired: true,
        sortOrder: 0,
      },
    ],
  };

  const opportunities = [
    {
      name: "Professional Project",
      data: {
        ...base,
        title: `E2E professional project ${runId}`,
        type: 0,
        milestones: [{ title: "Implementation", dueAfterDays: 10 }],
      },
    },
    {
      name: "University Training",
      data: {
        ...base,
        title: `E2E university training ${runId}`,
        type: 1,
        requiredTrainingHours: 40,
        academicRequirements: "Record learning outcomes and supervised hours.",
        milestones: [{ title: "Training plan", dueAfterDays: 7 }],
      },
    },
    {
      name: "Industry Micro-Task",
      data: {
        ...base,
        title: `E2E industry micro-task ${runId}`,
        type: 2,
        budget: 250,
        freelancePricingType: 1,
        freelanceDeliveryDays: 10,
        includedRevisions: 1,
        milestones: [],
      },
    },
    {
      name: "Skill Challenge",
      data: {
        ...base,
        title: `E2E skill challenge ${runId}`,
        type: 3,
        milestones: [],
      },
    },
    {
      name: "Team Project",
      data: {
        ...base,
        title: `E2E team project ${runId}`,
        type: 4,
        positionsAvailable: 2,
        milestones: [{ title: "Shared delivery", dueAfterDays: 10 }],
      },
    },
  ];

  for (const opportunity of opportunities) {
    const create = await request.post("/api/projects", {
      headers,
      data: opportunity.data,
    });
    const createBody = await create.text();
    expect(
      create.ok(),
      `${opportunity.name} could not be created: ${create.status()} ${createBody}`,
    ).toBeTruthy();
    const project = JSON.parse(createBody) as { id: number };
    createdProjectIds.push(project.id);

    const publish = await request.post(`/api/projects/${project.id}/publish`, {
      headers,
    });
    expect(publish.ok(), `${opportunity.name} could not be published.`).toBeTruthy();
  }
});
