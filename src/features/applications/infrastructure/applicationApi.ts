import {
  httpClient,
  httpDownload,
} from "../../../shared/api/httpClient";
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationShortlistRequest,
  UpdateApplicationStatusRequest,
} from "../domain/applicationTypes";
import type { PagedResult } from "../../projects/domain/projectTypes";
import { normalizePagedResult } from "../../../shared/api/pagedResult";

const DEFAULT_PAGE_SIZE = 50;

export function applyToProjectAsync(
  projectId: number,
  request: CreateApplicationRequest,
  cvFile?: File | null,
) {
  const formData = new FormData();

  if (request.coverLetter) {
    formData.append("coverLetter", request.coverLetter);
  }
  if (request.workSampleUrl) {
    formData.append("workSampleUrl", request.workSampleUrl);
  }
  if (request.shortTaskResponse) {
    formData.append("shortTaskResponse", request.shortTaskResponse);
  }
  if (request.proposedBudget !== undefined) {
    formData.append("proposedBudget", String(request.proposedBudget));
  }
  if (request.proposedDeliveryDays !== undefined) {
    formData.append(
      "proposedDeliveryDays",
      String(request.proposedDeliveryDays),
    );
  }
  if (cvFile) {
    formData.append("cv", cvFile, cvFile.name);
  }

  return httpClient<Application>(`/api/applications/projects/${projectId}`, {
    method: "POST",
    body: formData,
  });
}

export function getMyApplicationsAsync(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  return httpClient<PagedResult<Application>>(
    `/api/applications/my?page=${page}&pageSize=${pageSize}`,
  ).then(normalizePagedResult<Application>);
}

export function getCompanyApplicationsAsync(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  return httpClient<PagedResult<Application>>(
    `/api/applications/company?page=${page}&pageSize=${pageSize}`,
  ).then(normalizePagedResult<Application>);
}

export function getProjectApplicationsAsync(
  projectId: number,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  return httpClient<PagedResult<Application>>(
    `/api/applications/projects/${projectId}?page=${page}&pageSize=${pageSize}`,
  ).then(normalizePagedResult<Application>);
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

export function updateApplicationShortlistAsync(
  applicationId: number,
  request: UpdateApplicationShortlistRequest,
) {
  return httpClient<void>(`/api/applications/${applicationId}/shortlist`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function withdrawApplicationAsync(applicationId: number) {
  return httpClient<void>(`/api/applications/${applicationId}/withdraw`, {
    method: "PUT",
  });
}

export async function downloadApplicationCvAsync(applicationId: number) {
  const { blob, fileName } = await httpDownload(
    `/api/applications/${applicationId}/cv`,
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
