import { httpClient } from "../../../shared/api/httpClient";
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationStatusRequest,
} from "../domain/applicationTypes";

export function applyToProjectAsync(
  projectId: number,
  request: CreateApplicationRequest,
) {
  return httpClient<Application>(`/api/applications/projects/${projectId}`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getMyApplicationsAsync() {
  return httpClient<Application[]>("/api/applications/my");
}

export function getProjectApplicationsAsync(projectId: number) {
  return httpClient<Application[]>(`/api/applications/projects/${projectId}`);
}

export function updateApplicationStatusAsync(
  applicationId: number,
  request: UpdateApplicationStatusRequest,
) {
  return httpClient<void>(`/api/applications/${applicationId}/status`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function withdrawApplicationAsync(applicationId: number) {
  return httpClient<void>(`/api/applications/${applicationId}/withdraw`, {
    method: "PUT",
  });
}
