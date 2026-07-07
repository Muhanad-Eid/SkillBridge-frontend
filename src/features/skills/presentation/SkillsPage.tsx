import { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { Skill } from "../domain/skillTypes";
import {
  addSkillAsync,
  getMySkillsAsync,
  getSkillsAsync,
  removeSkillAsync,
} from "../infrastructure/skillApi";

export default function SkillsPage() {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSkills() {
    setIsLoading(true);
    try {
      const [skills, profileSkills] = await Promise.all([
        getSkillsAsync(),
        getMySkillsAsync(),
      ]);
      setAllSkills(skills);
      setMySkills(profileSkills);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load skills.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  const availableSkills = useMemo(() => {
    const selectedIds = new Set(mySkills.map((skill) => skill.id));
    return allSkills.filter((skill) => !selectedIds.has(skill.id));
  }, [allSkills, mySkills]);

  async function handleAddSkill() {
    if (!selectedSkillId) return;
    await addSkillAsync({ skillId: Number(selectedSkillId) });
    setSelectedSkillId("");
    await loadSkills();
  }

  async function handleRemoveSkill(skillId: number) {
    await removeSkillAsync(skillId);
    await loadSkills();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Skills"
        title="My skills"
        description="Choose skills that companies can use to match you with opportunities."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle=""
        emptyDescription=""
      />

      <div className="two-column">
        <Card title="Add skill">
          <div className="stack">
            <label className="field">
              <span>Skill</span>
              <select
                value={selectedSkillId}
                onChange={(event) => setSelectedSkillId(event.target.value)}
              >
                <option value="">Select a skill</option>
                {availableSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={handleAddSkill}>Add skill</Button>
          </div>
        </Card>

        <Card title="Selected skills">
          {mySkills.length === 0 ? (
            <p>No skills selected yet.</p>
          ) : (
            <div className="chip-list">
              {mySkills.map((skill) => (
                <button
                  key={skill.id}
                  className="chip"
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                >
                  {skill.name} ×
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
