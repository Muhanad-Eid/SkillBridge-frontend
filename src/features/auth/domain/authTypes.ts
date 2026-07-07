export type AuthRole = "Admin" | "Company" | "JobSeeker";

export const RegisterRoles = {
  Company: 2,
  JobSeeker: 3,
} as const;

export type RegisterRole = (typeof RegisterRoles)[keyof typeof RegisterRoles];

export type LoginRequest = {
  email: string;
  password: string;
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
