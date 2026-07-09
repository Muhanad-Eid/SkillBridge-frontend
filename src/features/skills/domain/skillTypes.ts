export type Skill = {
  id: number;
  name: string;
};

export type AddSkillRequest = {
  skillId?: number;
  skillName?: string;
};
