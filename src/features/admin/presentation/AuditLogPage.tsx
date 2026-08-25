import { useEffect, useState } from "react";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { AdminAuditEvent } from "../domain/adminTypes";
import { getAdminAuditEventsAsync } from "../infrastructure/adminApi";

function outcomeTone(outcome: string): "green" | "red" | "neutral" {
  if (outcome === "Success") return "green";
  if (outcome === "Blocked" || outcome === "Failure") return "red";
  return "neutral";
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  async function loadEvents() {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAdminAuditEventsAsync(
        page,
        pageSize,
        debouncedSearch,
      );
      setEvents(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load audit events.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadEvents, 0);
    return () => window.clearTimeout(timeoutId);
  }, [page, debouncedSearch]);

  return (
    <section className="page admin-list-page">
      <PageHeader title="Audit log" />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search audit events"
          placeholder="Search by action, subject, or detail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={events.length === 0}
        emptyTitle="No audit events"
        emptyDescription="Platform actions will appear here as they happen."
      />

      <div className="table-card admin-table-card">
        {events.map((item) => (
          <div className="table-row" key={item.id}>
            <div>
              <strong>{item.action}</strong>
              <span>
                {item.subjectType} #{item.subjectId} · {item.actorName}
              </span>
              {item.detail ? <span>{item.detail}</span> : null}
            </div>
            <StatusBadge tone={outcomeTone(item.outcome)}>
              {item.outcome}
            </StatusBadge>
            <span>
              {new Date(item.occurredAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isLoading={isLoading}
        itemLabel="events"
        onPageChange={setPage}
      />
    </section>
  );
}
