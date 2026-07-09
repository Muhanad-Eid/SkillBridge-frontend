import { httpClient } from "../../../shared/api/httpClient";
import type {
  CompanyProfile,
  JobSeekerProfile,
  UpdateCompanyProfileRequest,
  UpdateJobSeekerProfileRequest,
} from "../domain/profileTypes";

export function getMyJobSeekerProfileAsync() {
  return httpClient<JobSeekerProfile>("/api/profiles/job-seeker/me");
}

export function getPublicJobSeekerProfileAsync(jobSeekerId: number) {
  return httpClient<JobSeekerProfile>(
    `/api/profiles/job-seekers/${jobSeekerId}`,
    { skipAuth: true },
  );
}

export function getPublicCompanyProfileAsync(companyId: number) {
  return httpClient<CompanyProfile>(`/api/profiles/companies/${companyId}`, {
    skipAuth: true,
  });
}

export function updateMyJobSeekerProfileAsync(
  request: UpdateJobSeekerProfileRequest,
) {
  return httpClient<void>("/api/profiles/job-seeker/me", {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function getMyCompanyProfileAsync() {
  return httpClient<CompanyProfile>("/api/profiles/company/me");
}

export function updateMyCompanyProfileAsync(
  request: UpdateCompanyProfileRequest,
) {
  return httpClient<void>("/api/profiles/company/me", {
    method: "PUT",
    body: JSON.stringify(request),
  });
}
