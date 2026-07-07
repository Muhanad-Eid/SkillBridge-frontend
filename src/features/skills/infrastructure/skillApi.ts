import { httpClient } from "../../../shared/api/httpClient";
import type { AddSkillRequest, Skill } from "../domain/skillTypes";

export function getSkillsAsync() {
  return httpClient<Skill[]>("/api/skills", { skipAuth: true });
}

export function getMySkillsAsync() {
  return httpClient<Skill[]>("/api/skills/my");
}

export function addSkillAsync(request: AddSkillRequest) {
  return httpClient<void>("/api/skills", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function removeSkillAsync(skillId: number) {
  return httpClient<void>(`/api/skills/${skillId}`, {
    method: "DELETE",
  });
}
