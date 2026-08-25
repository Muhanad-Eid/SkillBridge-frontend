import { httpClient } from "../../../shared/api/httpClient";
import { ApplicationStatuses } from "../../applications/domain/applicationTypes";
import type { PagedResult } from "../../projects/domain/projectTypes";
import type {
  AdminAuditEvent,
  AdminCompany,
  AdminApplication,
  AdminJobSeeker,
  AdminProject,
  AdminQueueSummary,
  AdminReview,
  AdminSkill,
  AdminUser,
  CreateAdminProjectRequest,
  CreateAdminSkillRequest,
  CreateAdminUserRequest,
  UpdateAdminCompanyRequest,
  UpdateAdminJobSeekerRequest,
  UpdateAdminProjectRequest,
  UpdateAdminReviewRequest,
  UpdateAdminSkillRequest,
  UpdateAdminUserRequest,
} from "../domain/adminTypes";

let queueSummaryEndpointSupported = true;

const DEFAULT_PAGE_SIZE = 50;

function buildPagedQuery(
  page: number,
  pageSize: number,
  search?: string,
): string {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search?.trim()) {
    query.set("search", search.trim());
  }

  return query.toString();
}

export function getAdminUsersAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminUser>>(
    `/api/admin/users?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminCompaniesAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminCompany>>(
    `/api/admin/companies?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminJobSeekersAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminJobSeeker>>(
    `/api/admin/job-seekers?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminProjectsAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminProject>>(
    `/api/admin/projects?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminApplicationsAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminApplication>>(
    `/api/admin/applications?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminReviewsAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminReview>>(
    `/api/admin/reviews?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminSkillsAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminSkill>>(
    `/api/admin/skills?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export function getAdminAuditEventsAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return httpClient<PagedResult<AdminAuditEvent>>(
    `/api/admin/audit?${buildPagedQuery(page, pageSize, search)}`,
  );
}

export async function getAdminQueueSummaryAsync() {
  if (queueSummaryEndpointSupported) {
    try {
      return await httpClient<AdminQueueSummary>("/api/admin/queues");
    } catch {
      queueSummaryEndpointSupported = false;
    }
  }

  const [companies, applications, reviews] = await Promise.all([
    getAdminCompaniesAsync(1, DEFAULT_PAGE_SIZE),
    getAdminApplicationsAsync(1, DEFAULT_PAGE_SIZE),
    getAdminReviewsAsync(1, DEFAULT_PAGE_SIZE),
  ]);

  return {
    pendingCompanies: companies.items.filter(
      (company) => !company.isVerified,
    ).length,
    pendingApplications: applications.items.filter(
      (application) => application.status === ApplicationStatuses.Pending,
    ).length,
    flaggedReviews: reviews.items.filter((review) => review.rating <= 2).length,
  };
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

export function setUserStatusAsync(userId: string, isActive: boolean) {
  return httpClient<void>(`/api/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  });
}

export function setUserRoleAsync(userId: string, role: string) {
  return httpClient<void>(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export function verifyCompanyAsync(
  companyId: number,
  request?: { note?: string },
) {
  return httpClient<void>(`/api/admin/companies/${companyId}/verify`, {
    method: "PUT",
    body: JSON.stringify(request?.note ? { note: request.note } : {}),
  });
}

export function unverifyCompanyAsync(
  companyId: number,
  request: { note: string },
) {
  return httpClient<void>(`/api/admin/companies/${companyId}/unverify`, {
    method: "PUT",
    body: JSON.stringify({ note: request.note }),
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
