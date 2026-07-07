import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { AdminCompany } from "../domain/adminTypes";
import {
  getAdminCompaniesAsync,
  unverifyCompanyAsync,
  verifyCompanyAsync,
} from "../infrastructure/adminApi";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCompanies() {
    setIsLoading(true);
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

  async function toggleVerify(company: AdminCompany) {
    if (company.isVerified) {
      await unverifyCompanyAsync(company.id);
    } else {
      await verifyCompanyAsync(company.id);
    }
    await loadCompanies();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Admin"
        title="Companies"
        description="Verify company profiles so job seekers can trust marketplace offers."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        empty={companies.length === 0}
        emptyTitle="No companies"
        emptyDescription="Registered companies will appear here."
      />

      <div className="table-card">
        {companies.map((company) => (
          <div className="table-row" key={company.id}>
            <div>
              <strong>{company.companyName}</strong>
              <span>{company.city ?? "No city"} · {company.website ?? "No website"}</span>
            </div>
            <StatusBadge tone={company.isVerified ? "green" : "amber"}>
              {company.isVerified ? "Verified" : "Not verified"}
            </StatusBadge>
            <Button variant="secondary" onClick={() => toggleVerify(company)}>
              {company.isVerified ? "Unverify" : "Verify"}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
