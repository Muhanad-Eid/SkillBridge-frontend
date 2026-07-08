import { httpClient } from "../../../shared/api/httpClient";
import type {
  AdminCompany,
  AdminJobSeeker,
  AdminProject,
  AdminUser,
  CreateAdminProjectRequest,
  CreateAdminUserRequest,
  UpdateAdminCompanyRequest,
  UpdateAdminJobSeekerRequest,
  UpdateAdminProjectRequest,
  UpdateAdminUserRequest,
} from "../domain/adminTypes";

export function getAdminUsersAsync() {
  return httpClient<AdminUser[]>("/api/admin/users");
}

export function getAdminCompaniesAsync() {
  return httpClient<AdminCompany[]>("/api/admin/companies");
}

export function getAdminJobSeekersAsync() {
  return httpClient<AdminJobSeeker[]>("/api/admin/job-seekers");
}

export function getAdminProjectsAsync() {
  return httpClient<AdminProject[]>("/api/admin/projects");
}

export function createAdminUserAsync(request: CreateAdminUserRequest) {
  return httpClient<AdminUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function createAdminProjectAsync(request: CreateAdminProjectRequest) {
  return httpClient<AdminProject>("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateAdminUserAsync(
  userId: string,
  request: UpdateAdminUserRequest,
) {
  return httpClient<void>(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function updateAdminCompanyAsync(
  companyId: number,
  request: UpdateAdminCompanyRequest,
) {
  return httpClient<void>(`/api/admin/companies/${companyId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function updateAdminJobSeekerAsync(
  userId: string,
  request: UpdateAdminJobSeekerRequest,
) {
  return httpClient<void>(`/api/admin/job-seekers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function updateAdminProjectAsync(
  projectId: number,
  request: UpdateAdminProjectRequest,
) {
  return httpClient<void>(`/api/admin/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
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

export function deleteCompanyAsync(companyId: number) {
  return httpClient<void>(`/api/admin/companies/${companyId}`, {
    method: "DELETE",
  });
}

export function deleteJobSeekerAsync(userId: string) {
  return httpClient<void>(`/api/admin/job-seekers/${userId}`, {
    method: "DELETE",
  });
}

export function deleteProjectAsync(projectId: number) {
  return httpClient<void>(`/api/admin/projects/${projectId}`, {
    method: "DELETE",
  });
}
