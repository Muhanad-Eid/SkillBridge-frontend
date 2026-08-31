export const demoPassword = "DemoPass123!";

export const demoAccounts = {
  admin: {
    email: "demo.admin@skillbridge.local",
    homePath: "/admin/dashboard",
    loginPath: "/admin/login",
  },
  participant: {
    email: "demo.participant@skillbridge.local",
    homePath: "/job-seeker/dashboard",
    loginPath: "/login",
  },
  provider: {
    email: "demo.provider@skillbridge.local",
    homePath: "/company/dashboard",
    loginPath: "/login",
  },
  university: {
    email: "demo.supervisor@skillbridge.local",
    homePath: "/university/training",
    loginPath: "/login",
  },
} as const;

export const publicShareToken =
  "d3e5c7a9b1f24a6680c2e4f6a8b0d2c4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6";

export type DemoAccount = (typeof demoAccounts)[keyof typeof demoAccounts];
