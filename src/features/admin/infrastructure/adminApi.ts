import { httpClient } from "../../../shared/api/httpClient";
import type {
  AdminCompany,
  AdminApplication,
  AdminJobSeeker,
  AdminProject,
  AdminReview,
  AdminSkill,
  AdminUser,
  CreateAdminProjectRequest,
  CreateAdminSkillRequest,
  CreateAdminUserRequest,
  UpdateAdminCompanyRequest,
  UpdateAdminApplicationStatusRequest,
  UpdateAdminJobSeekerRequest,
  UpdateAdminProjectRequest,
  UpdateAdminReviewRequest,
  UpdateAdminSkillRequest,
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

export function getAdminApplicationsAsync() {
  return httpClient<AdminApplication[]>("/api/admin/applications");
}

export function getAdminReviewsAsync() {
  return httpClient<AdminReview[]>("/api/admin/reviews");
}

export function getAdminSkillsAsync() {
  return httpClient<AdminSkill[]>("/api/admin/skills");
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

export function createAdminSkillAsync(request: CreateAdminSkillRequest) {
  return httpClient<AdminSkill>("/api/admin/skills", {
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

export function updateAdminApplicationStatusAsync(
  applicationId: number,
  request: UpdateAdminApplicationStatusRequest,
) {
  return httpClient<void>(`/api/admin/applications/${applicationId}/status`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function updateAdminSkillAsync(
  skillId: number,
  request: UpdateAdminSkillRequest,
) {
  return httpClient<void>(`/api/admin/skills/${skillId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function updateAdminReviewAsync(
  reviewId: number,
  request: UpdateAdminReviewRequest,
) {
  return httpClient<void>(`/api/admin/reviews/${reviewId}`, {
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

export function deleteApplicationAsync(applicationId: number) {
  return httpClient<void>(`/api/admin/applications/${applicationId}`, {
    method: "DELETE",
  });
}

export function deleteReviewAsync(reviewId: number) {
  return httpClient<void>(`/api/admin/reviews/${reviewId}`, {
    method: "DELETE",
  });
}

export function deleteSkillAsync(skillId: number) {
  return httpClient<void>(`/api/admin/skills/${skillId}`, {
    method: "DELETE",
  });
}
