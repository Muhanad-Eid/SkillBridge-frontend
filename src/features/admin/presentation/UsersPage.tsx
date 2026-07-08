import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import type { AdminUser } from "../domain/adminTypes";
import { deleteUserAsync, getAdminUsersAsync } from "../infrastructure/adminApi";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setIsLoading(true);
    try {
      setUsers(await getAdminUsersAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load users.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(userId: string) {
    await deleteUserAsync(userId);
    await loadUsers();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Review registered users and remove accounts when needed."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={users.length === 0}
        emptyTitle="No users"
        emptyDescription="Registered users will appear here."
      />

      <div className="table-card">
        {users.map((user) => (
          <div className="table-row" key={user.id}>
            <div>
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span>{user.email}</span>
            </div>
            <span>{user.role}</span>
            <Button variant="secondary" onClick={() => handleDelete(user.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
