export type AuthRole = "Admin" | "Company" | "JobSeeker";

export function normalizeAuthRole(role: unknown): AuthRole | null {
  const normalized = String(role ?? "")
    .replace(/[\s_-]/g, "")
    .toLowerCase();

  if (normalized === "1" || normalized === "admin") {
    return "Admin";
  }

  if (normalized === "2" || normalized === "company") {
    return "Company";
  }

  if (normalized === "3" || normalized === "jobseeker") {
    return "JobSeeker";
  }

  return null;
}

export const RegisterRoles = {
  Company: 2,
  JobSeeker: 3,
} as const;

export type RegisterRole = (typeof RegisterRoles)[keyof typeof RegisterRoles];

export type LoginRequest = {
  email: string;
  password: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  userId: string;
  token: string;
  newPassword: string;
};

export type AuthMessageResponse = {
  message: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RegisterRole;
  companyName?: string;
};

export type AuthResponse = {
  userId: string;
  fullName: string;
  email: string;
  role: AuthRole;
  token: string;
};
