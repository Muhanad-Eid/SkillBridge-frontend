import { httpClient, httpDownload } from "../../../shared/api/httpClient";
import type {
  ApproveFinalWorkRequest,
  DeclareContributionRequest,
  ContributionReviewTask,
  CreateWorkMilestoneRequest,
  ReviewMilestoneRequest,
  ReviewContributionRequest,
  ResolveContributionRequest,
  ReviewTrainingReportRequest,
  SubmitFinalWorkRequest,
  SubmitMilestoneRequest,
  SubmitTrainingReportRequest,
  TrainingReport,
  UpdateContributionResponsibilitiesRequest,
  UpdateTrainingSupervisionRequest,
  UniversitySupervisor,
  WorkMilestone,
  WorkRecord,
} from "../domain/workTypes";

export function getMyWorkAsync() {
  return httpClient<WorkRecord[]>("/api/work/mine");
}

export function getProjectWorkAsync(projectId: number) {
  return httpClient<WorkRecord[]>(`/api/work/projects/${projectId}`);
}

export function getUniversityWorkAsync() {
  return httpClient<WorkRecord[]>("/api/work/university");
}

export async function downloadApprovedTrainingExportAsync() {
  const download = await httpDownload(
    "/api/university/exports/approved-training.csv",
  );
  const url = URL.createObjectURL(download.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = download.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
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

export function uploadFinalDeliverableAsync(
  applicationId: number,
  deliverable: File,
) {
  const formData = new FormData();
  formData.append("deliverable", deliverable);

  return httpClient<void>(
    `/api/work/applications/${applicationId}/final-deliverable`,
    {
      method: "PUT",
      body: formData,
    },
  );
}

export async function downloadFinalDeliverableAsync(applicationId: number) {
  const download = await httpDownload(
    `/api/work/applications/${applicationId}/final-deliverable`,
  );
  const url = URL.createObjectURL(download.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = download.fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
  academicRequirementsMet: boolean,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/training-progress`,
    {
      method: "PUT",
      body: JSON.stringify({
        completedHours,
        progressNotes,
        academicRequirementsMet,
      }),
    },
  );
}

export function submitTrainingReportAsync(
  applicationId: number,
  request: SubmitTrainingReportRequest,
) {
  return httpClient<TrainingReport>(
    `/api/work/applications/${applicationId}/training-reports`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function reviseTrainingReportAsync(
  reportId: number,
  request: SubmitTrainingReportRequest,
) {
  return httpClient<void>(`/api/work/training-reports/${reportId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function reviewTrainingReportAsync(
  reportId: number,
  request: ReviewTrainingReportRequest,
) {
  return httpClient<void>(
    `/api/work/training-reports/${reportId}/review`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}

export function updateTrainingSupervisionAsync(
  applicationId: number,
  request: UpdateTrainingSupervisionRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/training-supervision`,
    {
      method: "PUT",
      body: JSON.stringify(request),
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

export function declareContributionAsync(
  applicationId: number,
  request: DeclareContributionRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/contribution/declaration`,
    { method: "PUT", body: JSON.stringify(request) },
  );
}

export function getContributionReviewQueueAsync() {
  return httpClient<ContributionReviewTask[]>(
    "/api/work/contributions/review-queue",
  );
}

export function reviewContributionAsync(
  applicationId: number,
  request: ReviewContributionRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/contribution/review`,
    { method: "PUT", body: JSON.stringify(request) },
  );
}

export function resolveContributionAsync(
  applicationId: number,
  request: ResolveContributionRequest,
) {
  return httpClient<void>(
    `/api/work/applications/${applicationId}/contribution/resolve`,
    { method: "PUT", body: JSON.stringify(request) },
  );
}
