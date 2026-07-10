import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Sparkles, Wrench, X } from "lucide-react";
import Button from "../../../shared/components/Button";
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
  const [skillName, setSkillName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSkills() {
    setIsLoading(true);
    setError("");

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
    const timeoutId = window.setTimeout(loadSkills, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const availableSkills = useMemo(() => {
    const selectedNames = new Set(
      mySkills.map((skill) => skill.name.trim().toLowerCase()),
    );

    return allSkills.filter(
      (skill) => !selectedNames.has(skill.name.trim().toLowerCase()),
    );
  }, [allSkills, mySkills]);

  const suggestions = useMemo(() => {
    const value = skillName.trim().toLowerCase();
    return availableSkills
      .filter((skill) => !value || skill.name.toLowerCase().includes(value))
      .slice(0, 8);
  }, [availableSkills, skillName]);

  async function addSkill(skill: string) {
    const trimmedSkillName = skill.trim();

    if (!trimmedSkillName) {
      setError("Write a skill before adding it.");
      return;
    }

    if (
      mySkills.some(
        (item) => item.name.trim().toLowerCase() === trimmedSkillName.toLowerCase(),
      )
    ) {
      setError("This skill is already on your profile.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await addSkillAsync({ skillName: trimmedSkillName });
      setSkillName("");
      setMessage(`${trimmedSkillName} added to your profile.`);
      await loadSkills();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to add skill.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addSkill(skillName);
  }

  async function handleRemoveSkill(skill: Skill) {
    setRemovingId(skill.id);
    setError("");
    setMessage("");

    try {
      await removeSkillAsync(skill.id);
      setMessage(`${skill.name} removed.`);
      await loadSkills();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to remove skill.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  const profileStrength = Math.min(100, Math.round((mySkills.length / 5) * 100));

  return (
    <section className="page jobseeker-skills-page">
      <PageHeader
        eyebrow="Profile proof"
        title="Skills profile"
        description="Add the tools, technologies, and capabilities you can confidently use. Companies see these when they review you."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={false}
        emptyTitle=""
        emptyDescription=""
      />

      <div className="jobseeker-skills-layout">
        <section className="jobseeker-skill-editor">
          <header>
            <span className="jobseeker-section-icon"><Wrench size={20} /></span>
            <div>
              <span>Add a skill</span>
              <h2>What can you do?</h2>
              <p>Type any skill. Existing platform skills appear as quick suggestions.</p>
            </div>
          </header>

          <form onSubmit={handleAddSkill}>
            <label className="jobseeker-skill-input">
              <Search size={19} aria-hidden="true" />
              <input
                aria-label="Skill name"
                placeholder="Try React, SQL, Figma, or QA automation"
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                maxLength={80}
              />
            </label>
            <Button type="submit" isLoading={isSaving} disabled={!skillName.trim()}>
              <Plus size={17} aria-hidden="true" />
              Add skill
            </Button>
          </form>

          {suggestions.length > 0 ? (
            <div className="jobseeker-skill-suggestions">
              <span>Suggestions</span>
              <div>
                {suggestions.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    disabled={isSaving}
                    onClick={() => addSkill(skill.name)}
                  >
                    <Plus size={14} aria-hidden="true" />
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <div className="notice notice-error">{error}</div> : null}
          {message ? <div className="notice">{message}</div> : null}
        </section>

        <aside className="jobseeker-skill-summary">
          <div className="jobseeker-skill-strength">
            <span><Sparkles size={18} aria-hidden="true" />Profile signal</span>
            <strong>{mySkills.length} skill{mySkills.length === 1 ? "" : "s"}</strong>
            <p>A focused set of 3 to 8 skills is easier for companies to review.</p>
            <div aria-hidden="true"><b style={{ width: `${profileStrength}%` }} /></div>
          </div>

          <div className="jobseeker-selected-skills">
            <header>
              <h2>Your skills</h2>
              <span>{mySkills.length}</span>
            </header>
            {mySkills.length === 0 ? (
              <div className="jobseeker-empty-panel compact">
                <strong>No skills added yet</strong>
                <p>Add your strongest practical skill first.</p>
              </div>
            ) : (
              <div>
                {mySkills.map((skill) => (
                  <span key={skill.id}>
                    {skill.name}
                    <button
                      type="button"
                      title={`Remove ${skill.name}`}
                      aria-label={`Remove ${skill.name}`}
                      disabled={removingId === skill.id}
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
