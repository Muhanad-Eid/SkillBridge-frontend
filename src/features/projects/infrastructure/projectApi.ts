import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreateProjectRequest,
  Project,
  ProjectStatus,
  UpdateProjectRequest,
} from "../domain/projectTypes";

export function getProjectsAsync() {
  return httpClient<Project[]>("/api/projects", { skipAuth: true });
}

export function getMyCompanyProjectsAsync() {
  return httpClient<Project[]>("/api/projects/my");
}

export function getProjectAsync(projectId: number) {
  return httpClient<Project>(`/api/projects/${projectId}`, {
    skipAuth: true,
  });
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
