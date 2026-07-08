import type { AuthRole } from "../../auth/domain/authTypes";
import type {
  OpportunityType,
  ProjectStatus,
} from "../../projects/domain/projectTypes";

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AuthRole | number;
};

export type AdminCompany = {
  id: number;
  userId: string;
  companyName: string;
  description: string | null;
  city: string | null;
  website: string | null;
  isVerified: boolean;
};

export type AdminJobSeeker = {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  city: string | null;
  bio: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  skillsCount: number;
  applicationsCount: number;
  portfolioItemsCount: number;
};

export type AdminProject = {
  id: number;
  title: string;
  description: string;
  companyName: string;
  companyId: number;
  type: OpportunityType;
  status: ProjectStatus;
  budget: number | null;
  durationWeeks: number;
  applicationsCount: number;
};

export const AdminUserRoles = {
  Admin: 1,
  Company: 2,
  JobSeeker: 3,
} as const;

export type AdminUserRole =
  (typeof AdminUserRoles)[keyof typeof AdminUserRoles];

export type CreateAdminUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AdminUserRole;
  companyName?: string | null;
  isVerified: boolean;
};

export type CreateAdminProjectRequest = {
  companyId: number;
  title: string;
  description: string;
  budget?: number | null;
  durationWeeks: number;
  type: OpportunityType;
  status: ProjectStatus;
};

export type UpdateAdminUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
};

export type UpdateAdminCompanyRequest = {
  companyName: string;
  description?: string | null;
  city?: string | null;
  website?: string | null;
  isVerified: boolean;
};

export type UpdateAdminJobSeekerRequest = {
  bio?: string | null;
  city?: string | null;
  linkedInUrl?: string | null;
  gitHubUrl?: string | null;
};

export type UpdateAdminProjectRequest = {
  title: string;
  description: string;
  budget?: number | null;
  durationWeeks: number;
  type: OpportunityType;
  status: ProjectStatus;
};
