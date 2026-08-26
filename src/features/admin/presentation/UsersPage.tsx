import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import { useAuth } from "../../../shared/auth/AuthContext";
import { normalizeAuthRole } from "../../auth/domain/authTypes";
import type {
  AdminUser,
  AdminUserRole,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from "../domain/adminTypes";
import { AdminUserRoles } from "../domain/adminTypes";
import {
  createAdminUserAsync,
  deleteUserAsync,
  getAdminUsersAsync,
  setUserRoleAsync,
  setUserStatusAsync,
  updateAdminUserAsync,
} from "../infrastructure/adminApi";

type FormMode = "create" | "edit";

type UserForm = UpdateAdminUserRequest & {
  password: string;
  role: AdminUserRole;
  companyName: string;
  providerType: 0 | 1;
  universityName: string;
  department: string;
};

const emptyForm: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: AdminUserRoles.JobSeeker,
  companyName: "",
  providerType: 0,
  universityName: "",
  department: "",
};

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [mode, setMode] = useState<FormMode | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.userId;

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAdminUsersAsync(page, pageSize, debouncedSearch);
      setUsers(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load users.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadUsers, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (searchParams.get("action") !== "create") {
      return;
    }

    const requestedRole = searchParams.get("role");
    const role =
      requestedRole === "Company"
        ? AdminUserRoles.Company
        : requestedRole === "Admin"
          ? AdminUserRoles.Admin
          : requestedRole === "UniversitySupervisor"
            ? AdminUserRoles.UniversitySupervisor
            : AdminUserRoles.JobSeeker;

    const timeoutId = window.setTimeout(() => {
      setMode("create");
      setEditingUser(null);
      setForm({ ...emptyForm, role });
      setError("");
      setSearchParams({}, { replace: true });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams, setSearchParams]);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return users.filter((user) => {
      const role = normalizeAuthRole(user.role) ?? String(user.role);
      const matchesRole = roleFilter === "All" || role === roleFilter;
      const matchesSearch =
        !value ||
        user.firstName.toLowerCase().includes(value) ||
        user.lastName.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        role.toLowerCase().includes(value);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const userStats = useMemo(() => {
    return users.reduce(
      (stats, user) => {
        const role = normalizeAuthRole(user.role);

        if (role === "Admin") stats.admins += 1;
        if (role === "Company") stats.companies += 1;
        if (role === "JobSeeker") stats.jobSeekers += 1;
        if (role === "UniversitySupervisor") stats.universitySupervisors += 1;

        return stats;
      },
      {
        total: users.length,
        admins: 0,
        companies: 0,
        jobSeekers: 0,
        universitySupervisors: 0,
      },
    );
  }, [users]);

  function startCreate() {
    setMode("create");
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
  }

  function startEdit(user: AdminUser) {
    const normalizedRole = normalizeAuthRole(user.role);
    const numericRole =
      normalizedRole === "Admin"
        ? AdminUserRoles.Admin
        : normalizedRole === "Company"
          ? AdminUserRoles.Company
          : normalizedRole === "UniversitySupervisor"
            ? AdminUserRoles.UniversitySupervisor
            : AdminUserRoles.JobSeeker;

    setMode("edit");
    setEditingUser(user);
    setForm({
      ...emptyForm,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: numericRole,
    });
    setError("");
  }

  function closeForm() {
    setMode(null);
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");

    try {
      if (mode === "create") {
        const request: CreateAdminUserRequest = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          companyName:
            form.role === AdminUserRoles.Company
              ? form.companyName.trim()
              : undefined,
          providerType:
            form.role === AdminUserRoles.Company
              ? form.providerType
              : undefined,
          universityName:
            form.role === AdminUserRoles.UniversitySupervisor
              ? form.universityName.trim()
              : undefined,
          department:
            form.role === AdminUserRoles.UniversitySupervisor
              ? form.department.trim() || undefined
              : undefined,
        };

        await createAdminUserAsync(request);
      } else if (mode === "edit" && editingUser) {
        const previousRole = normalizeAuthRole(editingUser.role);
        const nextRole = normalizeAuthRole(form.role);

        await updateAdminUserAsync(editingUser.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        });

        if (previousRole !== nextRole) {
          if (editingUser.id === currentUserId) {
            setError("You cannot change the role of your own account.");
            setIsSaving(false);
            return;
          }

          if (!nextRole) {
            setError("Select a valid role.");
            setIsSaving(false);
            return;
          }

          await setUserRoleAsync(editingUser.id, nextRole);
        }
      }

      closeForm();
      await loadUsers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save user.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    const confirmed = window.confirm(
      `Deactivate the account for ${user.firstName} ${user.lastName}? ` +
        "They will be signed out and unable to sign in until reactivated.",
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteUserAsync(user.id);
      await loadUsers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to deactivate user.",
      );
    }
  }

  async function handleStatusToggle(user: AdminUser) {
    const nextActive = !(user.isActive ?? true);

    if (nextActive === false && user.id === currentUserId) {
      setError("You cannot deactivate your own account.");
      return;
    }

    setError("");

    try {
      await setUserStatusAsync(user.id, nextActive);
      await loadUsers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update account status.",
      );
    }
  }

  const isCompanyForm = form.role === AdminUserRoles.Company;
  const isUniversityForm =
    form.role === AdminUserRoles.UniversitySupervisor;

  return (
    <section className="page admin-list-page">
      <PageHeader
        title="Users"
        actions={
          <Button type="button" onClick={startCreate}>
            Add user
          </Button>
        }
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search users"
          placeholder="Search by name, email, or role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter users by role"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="All">All roles</option>
          <option value="Admin">Admins</option>
          <option value="Company">Companies</option>
          <option value="JobSeeker">Job seekers</option>
          <option value="UniversitySupervisor">University supervisors</option>
        </select>
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Total users</span>
          <strong>{userStats.total}</strong>
        </article>
        <article>
          <span>Admins</span>
          <strong>{userStats.admins}</strong>
        </article>
        <article>
          <span>Companies</span>
          <strong>{userStats.companies}</strong>
        </article>
        <article>
          <span>Job seekers</span>
          <strong>{userStats.jobSeekers}</strong>
        </article>
        <article>
          <span>University supervisors</span>
          <strong>{userStats.universitySupervisors}</strong>
        </article>
      </div>

      {mode ? (
        <form className="admin-edit-card" onSubmit={handleSave}>
          <div>
            <span>{mode === "create" ? "Add user" : "Edit user"}</span>
            <strong>
              {mode === "create"
                ? "Create a platform account"
                : `${editingUser?.firstName} ${editingUser?.lastName}`}
            </strong>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>First name</span>
              <input
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Last name</span>
              <input
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
            </label>
            {mode === "edit" && editingUser ? (
              <label className="field">
                <span>
                  {editingUser.id === currentUserId
                    ? "Role (cannot change your own)"
                    : "Role"}
                </span>
                <select
                  value={String(form.role)}
                  disabled={editingUser.id === currentUserId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: Number(event.target.value) as AdminUserRole,
                    }))
                  }
                >
                  <option value={AdminUserRoles.JobSeeker}>Job seeker</option>
                  <option value={AdminUserRoles.Company}>Company</option>
                  <option value={AdminUserRoles.UniversitySupervisor}>
                    University supervisor
                  </option>
                  <option value={AdminUserRoles.Admin}>Admin</option>
                </select>
              </label>
            ) : null}
            {mode === "create" ? (
              <>
                <label className="field">
                  <span>Password</span>
                  <input
                    minLength={8}
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Role</span>
                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: Number(event.target.value) as AdminUserRole,
                        companyName:
                          Number(event.target.value) === AdminUserRoles.Company
                            ? current.companyName
                            : "",
                        universityName:
                          Number(event.target.value) ===
                          AdminUserRoles.UniversitySupervisor
                            ? current.universityName
                            : "",
                      }))
                    }
                  >
                    <option value={AdminUserRoles.JobSeeker}>Job seeker</option>
                    <option value={AdminUserRoles.Company}>Company</option>
                    <option value={AdminUserRoles.UniversitySupervisor}>
                      University supervisor
                    </option>
                    <option value={AdminUserRoles.Admin}>Admin</option>
                  </select>
                </label>
                {isCompanyForm ? (
                  <>
                    <label className="field">
                      <span>Organization name</span>
                      <input
                        value={form.companyName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            companyName: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Organization type</span>
                      <select
                        value={form.providerType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            providerType: Number(event.target.value) as 0 | 1,
                          }))
                        }
                      >
                        <option value={0}>Company</option>
                        <option value={1}>Training provider</option>
                      </select>
                    </label>
                  </>
                ) : null}
                {isUniversityForm ? (
                  <>
                    <label className="field">
                      <span>University name</span>
                      <input
                        value={form.universityName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            universityName: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Department</span>
                      <input
                        value={form.department}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            department: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="admin-edit-actions">
            <Button type="submit" isLoading={isSaving}>
              {mode === "create" ? "Create user" : "Save changes"}
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
        empty={filteredUsers.length === 0}
        emptyTitle="No users"
        emptyDescription="Registered users will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredUsers.map((user) => {
          const isActive = user.isActive ?? true;

          return (
            <div className="table-row" key={user.id}>
              <div>
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span>
                  {normalizeAuthRole(user.role) ?? user.role} · {user.email}
                </span>
              </div>
              <StatusBadge tone={isActive ? "green" : "red"}>
                {isActive ? "Active" : "Deactivated"}
              </StatusBadge>
              <div className="admin-row-actions">
                <Button variant="secondary" onClick={() => startEdit(user)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleStatusToggle(user)}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="secondary"
                  className="button-danger"
                  onClick={() => handleDelete(user)}
                >
                  Deactivate
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </section>
  );
}




