import { type FormEvent, useEffect, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type {
  AdminCompany,
  UpdateAdminCompanyRequest,
} from "../domain/adminTypes";
import {
  deleteCompanyAsync,
  getAdminCompaniesAsync,
  unverifyCompanyAsync,
  updateAdminCompanyAsync,
  verifyCompanyAsync,
} from "../infrastructure/adminApi";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(
    null,
  );
  const [form, setForm] = useState<UpdateAdminCompanyRequest>({
    companyName: "",
    description: "",
    city: "",
    website: "",
    isVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCompanies() {
    setIsLoading(true);
    setError("");

    try {
      setCompanies(await getAdminCompaniesAsync());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load companies.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return companies;
    }

    return companies.filter((company) => {
      return (
        company.companyName.toLowerCase().includes(value) ||
        (company.description ?? "").toLowerCase().includes(value) ||
        (company.city ?? "").toLowerCase().includes(value) ||
        (company.website ?? "").toLowerCase().includes(value)
      );
    });
  }, [companies, search]);

  function startEdit(company: AdminCompany) {
    setEditingCompany(company);
    setForm({
      companyName: company.companyName,
      description: company.description ?? "",
      city: company.city ?? "",
      website: company.website ?? "",
      isVerified: company.isVerified,
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

  async function toggleVerify(company: AdminCompany) {
    setError("");

    try {
      if (company.isVerified) {
        await unverifyCompanyAsync(company.id);
      } else {
        await verifyCompanyAsync(company.id);
      }

      await loadCompanies();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update company verification.",
      );
    }
  }

  async function handleDelete(company: AdminCompany) {
    const confirmed = window.confirm(
      `Delete company account for ${company.companyName}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteCompanyAsync(company.id);
      await loadCompanies();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete company.",
      );
    }
  }

  return (
    <section className="page admin-list-page">
      <PageHeader
        eyebrow="Admin"
        title="Companies"
        description="Review company profiles, edit details, verify trusted companies, or delete bad accounts."
      />

      <div className="toolbar admin-toolbar">
        <input
          aria-label="Search companies"
          placeholder="Search by company, city, website, or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
            </div>
            <StatusBadge tone={company.isVerified ? "green" : "amber"}>
              {company.isVerified ? "Verified" : "Not verified"}
            </StatusBadge>
            <div className="admin-row-actions">
              <Button variant="secondary" onClick={() => startEdit(company)}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => toggleVerify(company)}>
                {company.isVerified ? "Unverify" : "Verify"}
              </Button>
              <Button
                variant="secondary"
                className="button-danger"
                onClick={() => handleDelete(company)}
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
