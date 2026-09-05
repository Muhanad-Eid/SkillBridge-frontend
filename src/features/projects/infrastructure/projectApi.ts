import { httpClient } from "../../../shared/api/httpClient";
import { normalizePagedResult } from "../../../shared/api/pagedResult";
import type {
  CreateProjectRequest,
  EvidenceContractVersion,
  OpportunityType,
  PagedResult,
  Project,
  ProjectStatus,
  UpdateProjectRequest,
} from "../domain/projectTypes";
import { OpportunityTypes } from "../domain/projectTypes";

export type ProjectSearchParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: OpportunityType | null;
  workMode?: number | null;
  experienceLevel?: number | null;
  excludeFreelance?: boolean;
  sort?: string;
};

export function getProjectsAsync(
  params: ProjectSearchParams = {},
  options: Pick<RequestInit, "signal"> = {},
) {
  const search = new URLSearchParams();

  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));

  if (params.search?.trim()) {
    search.set("search", params.search.trim());
  }

  if (params.type !== null && params.type !== undefined) {
    search.set("type", String(params.type));
  }

  if (params.workMode !== null && params.workMode !== undefined) {
    search.set("workMode", String(params.workMode));
  }

  if (params.experienceLevel !== null && params.experienceLevel !== undefined) {
    search.set("experienceLevel", String(params.experienceLevel));
  }

  if (params.excludeFreelance) {
    search.set("excludeFreelance", "true");
  }

  if (params.sort) {
    search.set("sort", params.sort);
  }

  return httpClient<PagedResult<Project>>(`/api/projects?${search}`, {
    skipAuth: true,
    ...options,
  }).then(normalizePagedResult<Project>);
}

export function getMyCompanyProjectsAsync(page = 1, pageSize = 50) {
  return httpClient<PagedResult<Project>>(
    `/api/projects/my?page=${page}&pageSize=${pageSize}`,
  ).then(normalizePagedResult<Project>);
}

export function publishProjectAsync(projectId: number) {
  return httpClient<void>(`/api/projects/${projectId}/publish`, {
    method: "POST",
  });
}

export function getProjectAsync(projectId: number) {
  return httpClient<Project>(`/api/projects/${projectId}`);
}

export function getEvidenceContractVersionsAsync(projectId: number) {
  return httpClient<EvidenceContractVersion[]>(
    `/api/projects/${projectId}/evidence-contracts`,
  );
}

export function createProjectAsync(request: CreateProjectRequest) {
  return httpClient<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateProjectAsync(
  projectId: number,
  request: UpdateProjectRequest,
) {
  return httpClient<void>(`/api/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function updateProjectStatusAsync(
  projectId: number,
  status: ProjectStatus,
) {
  return httpClient<void>(`/api/projects/${projectId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function deleteProjectAsync(projectId: number) {
  return httpClient<void>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

// Re-exported so pages can build type filters without importing enums by value.
export const ProjectFilterTypes = OpportunityTypes;
