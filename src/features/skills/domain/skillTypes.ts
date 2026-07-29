export type Skill = {
  id: number;
  name: string;
  evidenceCount: number;
  isEvidenceSupported: boolean;
};

export type AddSkillRequest = {
  skillId?: number;
  skillName?: string;
};
