import { type FormEvent, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { AdminSkill } from "../domain/adminTypes";
import {
  createAdminSkillAsync,
  deleteSkillAsync,
  getAdminSkillsAsync,
  updateAdminSkillAsync,
} from "../infrastructure/adminApi";

type FormMode = "create" | "edit";

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<FormMode | null>(null);
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSkills() {
    setIsLoading(true);
    setError("");

    try {
      setSkills(await getAdminSkillsAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load skills.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadSkills, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredSkills = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return skills;
    }

    return skills.filter((skill) => skill.name.toLowerCase().includes(value));
  }, [search, skills]);

  const skillStats = useMemo(() => {
    return {
      total: skills.length,
      usedByJobSeekers: skills.filter((skill) => skill.jobSeekersCount > 0).length,
      usedByProjects: skills.filter((skill) => skill.projectsCount > 0).length,
      unused: skills.filter(
        (skill) => skill.jobSeekersCount === 0 && skill.projectsCount === 0,
      ).length,
    };
  }, [skills]);

  function startCreate() {
    setMode("create");
    setEditingSkill(null);
    setName("");
    setError("");
  }

  function startEdit(skill: AdminSkill) {
    setMode("edit");
    setEditingSkill(skill);
    setName(skill.name);
    setError("");
  }

  function closeForm() {
    setMode(null);
    setEditingSkill(null);
    setName("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      if (mode === "create") {
        await createAdminSkillAsync({ name: name.trim() });
      } else if (mode === "edit" && editingSkill) {
        await updateAdminSkillAsync(editingSkill.id, { name: name.trim() });
      }

      closeForm();
      await loadSkills();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save skill.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(skill: AdminSkill) {
    const confirmed = window.confirm(`Delete skill "${skill.name}"?`);

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteSkillAsync(skill.id);
      await loadSkills();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to delete skill.",
      );
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        title="Skills catalog"
        actions={
          <Button type="button" onClick={startCreate}>
            Add skill
          </Button>
        }
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search skills"
          placeholder="Search by skill name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Total skills</span>
          <strong>{skillStats.total}</strong>
        </article>
        <article>
          <span>Used by people</span>
          <strong>{skillStats.usedByJobSeekers}</strong>
        </article>
        <article>
          <span>Used by projects</span>
          <strong>{skillStats.usedByProjects}</strong>
        </article>
        <article>
          <span>Unused</span>
          <strong>{skillStats.unused}</strong>
        </article>
      </div>

      {mode ? (
        <form className="admin-edit-card" onSubmit={handleSave}>
          <div>
            <span>{mode === "create" ? "Add skill" : "Edit skill"}</span>
            <strong>{mode === "create" ? "Create skill" : editingSkill?.name}</strong>
          </div>
          <label className="field">
            <span>Skill name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <div className="admin-edit-actions">
            <Button type="submit" isLoading={isSaving}>
              {mode === "create" ? "Create skill" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredSkills.length === 0}
        emptyTitle="No skills"
        emptyDescription="Skill catalog items will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredSkills.map((skill) => (
          <div className="table-row" key={skill.id}>
            <div>
              <strong>{skill.name}</strong>
              <span>
                {skill.jobSeekersCount} job seekers / {skill.projectsCount} projects
              </span>
            </div>
            <span>{skill.jobSeekersCount + skill.projectsCount} total uses</span>
            <div className="admin-row-actions">
              <Button variant="secondary" onClick={() => startEdit(skill)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => handleDelete(skill)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
