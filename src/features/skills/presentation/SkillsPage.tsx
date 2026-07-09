import { type FormEvent, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
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
  const [skillName, setSkillName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load skills.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  const availableSkills = useMemo(() => {
    const selectedNames = new Set(
      mySkills.map((skill) => skill.name.trim().toLowerCase()),
    );

    return allSkills.filter(
      (skill) => !selectedNames.has(skill.name.trim().toLowerCase()),
    );
  }, [allSkills, mySkills]);

  async function handleAddSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedSkillName = skillName.trim();

    if (!trimmedSkillName) {
      setError("Write a skill before adding it.");
      return;
    }

    const alreadyAdded = mySkills.some(
      (skill) =>
        skill.name.trim().toLowerCase() === trimmedSkillName.toLowerCase(),
    );

    if (alreadyAdded) {
      setError("This skill is already added.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await addSkillAsync({ skillName: trimmedSkillName });
      setSkillName("");
      setMessage("Skill added.");
      await loadSkills();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to add skill.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveSkill(skillId: number) {
    setError("");
    setMessage("");

    try {
      await removeSkillAsync(skillId);
      setMessage("Skill removed.");
      await loadSkills();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to remove skill.",
      );
    }
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Skills"
        title="My skills"
        description="Write the skills companies should see on your profile."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle=""
        emptyDescription=""
      />

      <div className="two-column">
        <Card
          title="Add skill"
          description="Type a skill name. Existing skills appear as suggestions, but you can add a new one."
        >
          <form className="stack" onSubmit={handleAddSkill}>
            <Input
              label="Skill"
              list="skill-suggestions"
              placeholder="React, SQL, UI design, QA automation"
              value={skillName}
              onChange={(event) => setSkillName(event.target.value)}
              required
            />
            <datalist id="skill-suggestions">
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.name} />
              ))}
            </datalist>
            {message ? <div className="notice">{message}</div> : null}
            <Button type="submit" isLoading={isSaving}>
              Add skill
            </Button>
          </form>
        </Card>

        <Card title="Selected skills">
          {mySkills.length === 0 ? (
            <p>No skills added yet.</p>
          ) : (
            <div className="chip-list">
              {mySkills.map((skill) => (
                <button
                  key={skill.id}
                  className="chip"
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                >
                  {skill.name} x
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
