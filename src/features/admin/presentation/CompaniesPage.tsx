import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AdminPortalOutletContext } from "../../../app/layouts/AdminPortalLayout";
import Button from "../../../shared/components/Button";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import Pagination from "../../../shared/components/Pagination";
import StatusBadge from "../../../shared/components/StatusBadge";
import type {
  AdminCompany,
  UpdateAdminCompanyRequest,
} from "../domain/adminTypes";
import {
  getAdminCompaniesAsync,
  setCompanyStatusAsync,
  unverifyCompanyAsync,
  updateAdminCompanyAsync,
  verifyCompanyAsync,
} from "../infrastructure/adminApi";

export default function CompaniesPage() {
  const { refreshQueues } = useOutletContext<AdminPortalOutletContext>();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState(
    searchParams.get("status") === "unverified" ? "Unverified" : "All",
  );
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(
    null,
  );
  const [verificationDecision, setVerificationDecision] = useState<{
    company: AdminCompany;
    mode: "verify" | "unverify";
    note: string;
  } | null>(null);
  const [statusDecision, setStatusDecision] = useState<AdminCompany | null>(null);
  const [form, setForm] = useState<UpdateAdminCompanyRequest>({
    companyName: "",
    description: "",
    city: "",
    website: "",
    isVerified: false,
    providerType: 0,
  });
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getAdminCompaniesAsync(page, pageSize, debouncedSearch);
      // Keep the route usable if an older API instance returns an unexpected
      // shape while the request error is surfaced through the page state.
      const items = Array.isArray(result?.items) ? result.items : [];
      setCompanies(items);
      setTotalCount(typeof result?.totalCount === "number" ? result.totalCount : 0);
      setTotalPages(
        Math.max(
          1,
          typeof result?.totalPages === "number" ? result.totalPages : 1,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load companies.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadCompanies, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCompanies]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const filteredCompanies = useMemo(() => {
    const value = search.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesVerification =
        verificationFilter === "All" ||
        (verificationFilter === "Verified" && company.isVerified) ||
        (verificationFilter === "Unverified" && !company.isVerified);

      const matchesSearch =
        !value ||
        company.companyName.toLowerCase().includes(value) ||
        (company.description ?? "").toLowerCase().includes(value) ||
        (company.city ?? "").toLowerCase().includes(value) ||
        (company.website ?? "").toLowerCase().includes(value);

      return matchesVerification && matchesSearch;
    });
  }, [companies, search, verificationFilter]);

  const companyStats = useMemo(() => {
    const verified = companies.filter((company) => company.isVerified).length;

    return {
      total: companies.length,
      verified,
      unverified: companies.length - verified,
    };
  }, [companies]);

  function startEdit(company: AdminCompany) {
    setEditingCompany(company);
    setForm({
      companyName: company.companyName,
      description: company.description ?? "",
      city: company.city ?? "",
      website: company.website ?? "",
      isVerified: company.isVerified,
      providerType: company.providerType ?? 0,
    });
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCompany) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateAdminCompanyAsync(editingCompany.id, form);
      setEditingCompany(null);
      await loadCompanies();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update company.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitVerificationDecision() {
    if (!verificationDecision || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (verificationDecision.mode === "verify") {
        await verifyCompanyAsync(verificationDecision.company.id, {
          note: verificationDecision.note || undefined,
        });
      } else {
        await unverifyCompanyAsync(verificationDecision.company.id, {
          note: verificationDecision.note,
        });
      }

      setVerificationDecision(null);
      await loadCompanies();
      await refreshQueues();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update company verification.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function applyStatusDecision() {
    if (!statusDecision || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await setCompanyStatusAsync(statusDecision.id, !statusDecision.isActive);
      setStatusDecision(null);
      await loadCompanies();
      await refreshQueues();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the company account status.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        title="Companies"
        actions={
          <Button to="/admin/users?action=create&role=Company" variant="primary">
            <Plus size={16} aria-hidden="true" />Add company
          </Button>
        }
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search companies"
          placeholder="Search by company, city, website, or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter companies by verification"
          value={verificationFilter}
          onChange={(event) => setVerificationFilter(event.target.value)}
        >
          <option value="All">All companies</option>
          <option value="Verified">Verified</option>
          <option value="Unverified">Not verified</option>
        </select>
      </div>

      <div className="admin-list-stats">
        <article>
          <span>Total companies</span>
          <strong>{companyStats.total}</strong>
        </article>
        <article>
          <span>Verified</span>
          <strong>{companyStats.verified}</strong>
        </article>
        <article>
          <span>Not verified</span>
          <strong>{companyStats.unverified}</strong>
        </article>
      </div>

      {editingCompany ? (
        <form className="admin-edit-card" onSubmit={handleSave}>
          <div>
            <span>Edit company</span>
            <strong>{editingCompany.companyName}</strong>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Company name</span>
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
              <span>City</span>
              <input
                value={form.city ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Website</span>
              <input
                value={form.website ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    website: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isVerified: event.target.checked,
                  }))
                }
              />
              <span>Verified company</span>
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <div className="admin-edit-actions">
            <Button type="submit" isLoading={isSaving}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingCompany(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={error}
        empty={filteredCompanies.length === 0}
        emptyTitle="No companies"
        emptyDescription="Registered companies will appear here."
      />

      <div className="table-card admin-table-card">
        {filteredCompanies.map((company) => (
          <div className="table-row" key={company.id}>
            <div>
              <strong>{company.companyName}</strong>
              <span>
                {company.city ?? "No city"} - {company.website ?? "No website"}
              </span>
              <span>{company.description ?? "No company description"}</span>
              {company.verificationNote ? (
                <span>Admin note: {company.verificationNote}</span>
              ) : null}
              <span>
                {company.projectsCount ?? 0} projects / {company.applicationsCount ?? 0} applications
              </span>
            </div>
            <StatusBadge tone={company.isVerified ? "green" : "amber"}>
              {company.isVerified ? "Verified" : "Not verified"}
            </StatusBadge>
            <StatusBadge tone={company.isActive ? "green" : "red"}>
              {company.isActive ? "Active" : "Deactivated"}
            </StatusBadge>
            <div className="admin-row-actions">
              <Button variant="secondary" onClick={() => startEdit(company)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setVerificationDecision({
                    company,
                    mode: company.isVerified ? "unverify" : "verify",
                    note: "",
                  })
                }
              >
                {company.isVerified ? "Unverify" : "Verify"}
              </Button>
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => setStatusDecision(company)}
              >
                {company.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {verificationDecision ? (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setVerificationDecision(null);
            }
          }}
        >
          <form
            className="confirm-dialog admin-verification-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              void submitVerificationDecision();
            }}
          >
            <button
              type="button"
              className="confirm-dialog-close"
              aria-label="Close"
              title="Close"
              onClick={() => setVerificationDecision(null)}
            >
              <X size={19} aria-hidden="true" />
            </button>
            <span className="confirm-dialog-icon" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <div>
              <span>
                {verificationDecision.mode === "verify"
                  ? "Verify provider"
                  : "Remove verification"}
              </span>
              <strong>{verificationDecision.company.companyName}</strong>
            </div>
            <label className="field">
              <span>
                {verificationDecision.mode === "verify"
                  ? "Feedback for the provider (optional)"
                  : "Reason for removing verification (required)"}
              </span>
              <textarea
                value={verificationDecision.note}
                onChange={(event) =>
                  setVerificationDecision({
                    ...verificationDecision,
                    note: event.target.value,
                  })
                }
                required={verificationDecision.mode === "unverify"}
              />
            </label>
            {verificationDecision.mode === "unverify" ? (
              <p className="notice notice-error" role="alert">
                Removing verification blocks the provider from publishing and
                approving work.
              </p>
            ) : null}
            <footer>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVerificationDecision(null)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {verificationDecision.mode === "verify"
                  ? "Confirm verification"
                  : "Confirm removal"}
              </Button>
            </footer>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={statusDecision !== null}
        title={statusDecision?.isActive ? "Deactivate company account?" : "Reactivate company account?"}
        description={
          statusDecision?.isActive
            ? "This blocks the company account from signing in. Its records and evidence remain preserved."
            : "This restores the company account and allows the provider to sign in again."
        }
        confirmLabel={statusDecision?.isActive ? "Deactivate" : "Reactivate"}
        variant={statusDecision?.isActive ? "danger" : "neutral"}
        onCancel={() => setStatusDecision(null)}
        onConfirm={() => void applyStatusDecision()}
      />

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




