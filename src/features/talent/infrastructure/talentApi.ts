import { httpClient } from "../../../shared/api/httpClient";
import type { PagedResult } from "../../projects/domain/projectTypes";
import type {
  TalentSearchFilters,
  TalentSearchResult,
} from "../domain/talentTypes";

export type TalentSearchParams = TalentSearchFilters & {
  page?: number;
  pageSize?: number;
};

export function searchTalentAsync({
  query,
  skillId,
  evidenceOnly,
  page = 1,
  pageSize = 20,
}: TalentSearchParams) {
  const searchParams = new URLSearchParams();

  if (query?.trim()) {
    searchParams.set("query", query.trim());
  }

  if (skillId) {
    searchParams.set("skillId", skillId.toString());
  }

  if (evidenceOnly) {
    searchParams.set("evidenceOnly", "true");
  }

  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(pageSize));

  return httpClient<PagedResult<TalentSearchResult>>(
    `/api/profiles/job-seekers/search?${searchParams}`,
  );
}
