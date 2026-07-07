import { httpClient } from "../../../shared/api/httpClient";
import type { AdminCompany, AdminUser } from "../domain/adminTypes";

export function getAdminUsersAsync() {
  return httpClient<AdminUser[]>("/api/admin/users");
}

export function getAdminCompaniesAsync() {
  return httpClient<AdminCompany[]>("/api/admin/companies");
}

export function verifyCompanyAsync(companyId: number) {
  return httpClient<void>(`/api/admin/companies/${companyId}/verify`, {
    method: "PUT",
  });
}

export function unverifyCompanyAsync(companyId: number) {
  return httpClient<void>(`/api/admin/companies/${companyId}/unverify`, {
    method: "PUT",
  });
}

export function deleteUserAsync(userId: string) {
  return httpClient<void>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}
