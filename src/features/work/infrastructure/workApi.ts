import { httpClient } from "../../../shared/api/httpClient";
import type {
  ApproveFinalWorkRequest,
  CreateWorkMilestoneRequest,
  ReviewMilestoneRequest,
  SubmitFinalWorkRequest,
  SubmitMilestoneRequest,
  UpdateContributionResponsibilitiesRequest,
  UniversitySupervisor,
  WorkMilestone,
  WorkRecord,
} from "../domain/workTypes";

export function getProjectWorkAsync(projectId: number) {
  return httpClient<WorkRecord[]>(`/api/work/projects/${projectId}`);
}

export function getUniversityWorkAsync() {
  return httpClient<WorkRecord[]>("/api/work/university");
}

export function getUniversitySupervisorsAsync() {
  return httpClient<UniversitySupervisor[]>(
    "/api/work/university-supervisors",
  );
}

export function createWorkMilestoneAsync(
  applicationId: number,
  request: CreateWorkMilestoneRequest,
) {
  return httpClient<WorkMilestone>(
    `/api/work/applications/${applicationId}/milestones`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function submitMilestoneAsync(
  milestoneId: number,
  request: SubmitMilestoneRequest,
) {
  return httpClient<void>(`/api/work/milestones/${milestoneId}/submit`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function reviewMilestoneAsync(
  milestoneId: number,
  request: ReviewMilestoneRequest,
) {
  return httpClient<void>(`/api/work/milestones/${milestoneId}/review`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function submitFinalWorkAsync(
  applicationId: number,
  request: SubmitFinalWorkRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/final-submission`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}

export function reviewFinalWorkByCompanyAsync(
  applicationId: number,
  request: ApproveFinalWorkRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/company-review`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}

export function reviewFinalWorkByUniversityAsync(
  applicationId: number,
  request: ApproveFinalWorkRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/university-review`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}

export function assignUniversitySupervisorAsync(
  applicationId: number,
  universitySupervisorId: number,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/university-supervisor`,
    {
      method: "PUT",
      body: JSON.stringify({ universitySupervisorId }),
    },
  );
}

export function updateTrainingProgressAsync(
  applicationId: number,
  completedHours: number,
  progressNotes: string,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/training-progress`,
    {
      method: "PUT",
      body: JSON.stringify({ completedHours, progressNotes }),
    },
  );
}

export function updateContributionResponsibilitiesAsync(
  applicationId: number,
  request: UpdateContributionResponsibilitiesRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/responsibilities`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}
