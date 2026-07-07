import type { AuthRole } from "../../auth/domain/authTypes";

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
  city: string | null;
  website: string | null;
  isVerified: boolean;
};
