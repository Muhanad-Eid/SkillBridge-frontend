import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  MessageSquare,
  Search,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  WorkSubmissionStatuses,
} from "../../applications/domain/applicationTypes";
import {
  getOpportunityTypeLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import {
  MilestoneStatuses,
  TrainingReportStatuses,
  getWorkSubmissionStatusLabel,
  type WorkRecord,
} from "../domain/workTypes";
import { getMyWorkAsync } from "../infrastructure/workApi";

type WorkView = "all" | "active" | "attention" | "review" | "completed";

const workViews: Array<{ label: string; value: WorkView }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Needs action", value: "attention" },
  { label: "Under review", value: "review" },
  { label: "Completed", value: "completed" },
];

function getWorkView(record: WorkRecord, isCompany: boolean): WorkView {
  if (
    record.workStatus === WorkSubmissionStatuses.Approved ||
    record.hasEvidenceCard
  ) {
    return "completed";
  }

  const hasSubmittedMilestone = record.milestones.some(
    (milestone) => milestone.status === MilestoneStatuses.Submitted,
  );
  const hasReturnedMilestone = record.milestones.some(
    (milestone) => milestone.status === MilestoneStatuses.ChangesRequested,
  );
  const hasSubmittedTrainingReport = record.trainingReports.some(
    (report) => report.status === TrainingReportStatuses.Submitted,
  );
  const hasReturnedTrainingReport = record.trainingReports.some(
    (report) => report.status === TrainingReportStatuses.ChangesRequested,
  );

  if (
    (isCompany &&
      (record.workStatus === WorkSubmissionStatuses.Submitted ||
        hasSubmittedMilestone ||
        hasSubmittedTrainingReport)) ||
    (!isCompany &&
      (record.workStatus === WorkSubmissionStatuses.ChangesRequested ||
        hasReturnedMilestone ||
        hasReturnedTrainingReport))
  ) {
    return "attention";
  }

  if (
    record.workStatus === WorkSubmissionStatuses.Submitted ||
    record.workStatus === WorkSubmissionStatuses.AwaitingUniversityApproval
  ) {
    return "review";
  }

  return "active";
}

function getProgress(record: WorkRecord) {
  if (
    record.workStatus === WorkSubmissionStatuses.Approved ||
    record.hasEvidenceCard
  ) {
    return 100;
  }

  if (
    record.opportunityType === OpportunityTypes.UniversityTraining &&
    record.requiredTrainingHours
  ) {
    const hoursProgress = Math.min(
      80,
      Math.round(
        (record.completedTrainingHours / record.requiredTrainingHours) * 80,
      ),
    );
    return Math.max(
      hoursProgress,
      record.workStatus === WorkSubmissionStatuses.Submitted ||
        record.workStatus ===
          WorkSubmissionStatuses.AwaitingUniversityApproval
        ? 90
        : 10,
    );
  }

  if (record.milestones.length > 0) {
    const approved = record.milestones.filter(
      (milestone) => milestone.status === MilestoneStatuses.Approved,
    ).length;
    const milestoneProgress = Math.round(
      (approved / record.milestones.length) * 80,
    );
    return Math.max(
      milestoneProgress,
      record.workStatus === WorkSubmissionStatuses.Submitted ? 90 : 10,
    );
  }

  return record.workStatus === WorkSubmissionStatuses.Submitted ? 90 : 20;
}

function getStatusPresentation(view: WorkView, isCompany: boolean) {
  if (view === "completed") {
    return { label: "Completed", tone: "green" as const };
  }
  if (view === "attention") {
    return {
      label: isCompany ? "Ready for review" : "Needs your update",
      tone: "amber" as const,
    };
  }
  if (view === "review") {
    return { label: "Under review", tone: "blue" as const };
  }
  return { label: "In progress", tone: "neutral" as const };
}

function getNextAction(view: WorkView, isCompany: boolean) {
  if (view === "completed") return "View completed work";
  if (view === "attention") {
    return isCompany ? "Review the latest submission" : "Address the feedback";
  }
  if (view === "review") return "Follow the approval status";
  return isCompany ? "Manage delivery" : "Continue your work";
}

function getWorkIcon(type: number) {
  if (type === OpportunityTypes.UniversityTraining) return GraduationCap;
  if (type === OpportunityTypes.FreelanceTask) return CircleDollarSign;
  if (type === OpportunityTypes.TeamProject) return UsersRound;
  return BriefcaseBusiness;
}

export default function WorkOverviewPage() {
  const { user } = useAuth();
  const isCompany = user?.role === "Company";
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [view, setView] = useState<WorkView>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadWork() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMyWorkAsync();
        if (isMounted) setRecords(data);
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load active work.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadWork();
    return () => {
      isMounted = false;
    };
  }, []);

  const recordViews = useMemo(
    () =>
      new Map(
        records.map((record) => [
          record.applicationId,
          getWorkView(record, isCompany),
        ]),
      ),
    [isCompany, records],
  );

  const counts = useMemo(
    () => ({
      total: records.length,
      active: records.filter(
        (record) => recordViews.get(record.applicationId) === "active",
      ).length,
      attention: records.filter(
        (record) => recordViews.get(record.applicationId) === "attention",
      ).length,
      completed: records.filter(
        (record) => recordViews.get(record.applicationId) === "completed",
      ).length,
    }),
    [recordViews, records],
  );

  const availableTypes = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.opportunityType))).sort(
        (left, right) => left - right,
      ),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const value = search.trim().toLowerCase();

    return records.filter((record) => {
      const recordView = recordViews.get(record.applicationId);
      const matchesView = view === "all" || recordView === view;
      const matchesType =
        typeFilter === "all" ||
        record.opportunityType === Number(typeFilter);
      const counterpart = isCompany
        ? record.jobSeekerName
        : record.companyName;
      const matchesSearch =
        !value ||
        record.projectTitle.toLowerCase().includes(value) ||
        counterpart.toLowerCase().includes(value);

      return matchesView && matchesType && matchesSearch;
    });
  }, [isCompany, recordViews, records, search, typeFilter, view]);

  function buildMessagePath(record: WorkRecord) {
    const params = new URLSearchParams({
      receiverId: isCompany
        ? record.jobSeekerUserId
        : record.companyUserId,
      receiverName: isCompany
        ? record.jobSeekerName
        : record.companyName,
      projectId: String(record.projectId),
      projectTitle: record.projectTitle,
    });

    return `/${isCompany ? "company" : "job-seeker"}/messages?${params.toString()}`;
  }

  return (
    <section className="page work-overview-page">
      <PageHeader title="Work" />

      <div className="work-overview-summary" aria-label="Work summary">
        <article>
          <span>Total engagements</span>
          <strong>{counts.total}</strong>
        </article>
        <article>
          <span>In progress</span>
          <strong>{counts.active}</strong>
        </article>
        <article className={counts.attention > 0 ? "has-attention" : ""}>
          <span>Needs action</span>
          <strong>{counts.attention}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{counts.completed}</strong>
        </article>
      </div>

      <div className="work-overview-controls">
        <div className="work-overview-tabs" role="tablist" aria-label="Work status">
          {workViews.map((item) => {
            const count =
              item.value === "all"
                ? records.length
                : records.filter(
                    (record) =>
                      recordViews.get(record.applicationId) === item.value,
                  ).length;

            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={view === item.value}
                className={view === item.value ? "active" : ""}
                onClick={() => setView(item.value)}
              >
                {item.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="work-overview-filters">
          <label>
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search work"
              placeholder={
                isCompany
                  ? "Search opportunity or participant"
                  : "Search opportunity or company"
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter by opportunity type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All opportunity types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {getOpportunityTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        empty={!isLoading && !error && filteredRecords.length === 0}
        emptyTitle={records.length === 0 ? "No accepted work yet" : "No work matches this view"}
        emptyDescription={
          records.length === 0
            ? isCompany
              ? "Accepted applicants will appear here when delivery begins."
              : "Accepted opportunities will appear here with their milestones and approvals."
            : "Change the status, type, or search filter."
        }
      />

      {filteredRecords.length > 0 ? (
        <div className="work-overview-list">
          {filteredRecords.map((record) => {
            const recordView =
              recordViews.get(record.applicationId) ?? "active";
            const presentation = getStatusPresentation(recordView, isCompany);
            const progress = getProgress(record);
            const Icon = getWorkIcon(record.opportunityType);
            const approvedMilestones = record.milestones.filter(
              (milestone) => milestone.status === MilestoneStatuses.Approved,
            ).length;
            const workPath = isCompany
              ? `/company/projects/${record.projectId}/work`
              : `/job-seeker/work/${record.projectId}`;

            return (
              <article className="work-overview-row" key={record.applicationId}>
                <div className="work-overview-identity">
                  <span className="work-overview-type-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <small>{getOpportunityTypeLabel(record.opportunityType)}</small>
                    <h2>{record.projectTitle}</h2>
                    <p>
                      {isCompany
                        ? `Participant: ${record.jobSeekerName}`
                        : record.companyName}
                    </p>
                  </div>
                </div>

                <div className="work-overview-progress">
                  <div>
                    <span>Progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <span
                    className="work-overview-progress-track"
                    role="progressbar"
                    aria-label={`${record.projectTitle} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </span>
                  <small>
                    {record.opportunityType ===
                      OpportunityTypes.UniversityTraining &&
                    record.requiredTrainingHours
                      ? `${record.completedTrainingHours} of ${record.requiredTrainingHours} hours approved`
                      : record.milestones.length > 0
                        ? `${approvedMilestones} of ${record.milestones.length} milestones approved`
                        : getWorkSubmissionStatusLabel(record.workStatus)}
                  </small>
                </div>

                <div className="work-overview-state">
                  <StatusBadge tone={presentation.tone}>
                    {presentation.label}
                  </StatusBadge>
                  <span>
                    {recordView === "completed" ? (
                      <CheckCircle2 size={15} aria-hidden="true" />
                    ) : (
                      <Clock3 size={15} aria-hidden="true" />
                    )}
                    {getNextAction(recordView, isCompany)}
                  </span>
                </div>

                <div className="work-overview-actions">
                  <Button to={workPath} variant="primary">
                    Open work
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    to={buildMessagePath(record)}
                    variant="secondary"
                    aria-label={`Message ${
                      isCompany ? record.jobSeekerName : record.companyName
                    }`}
                    title="Message"
                  >
                    <MessageSquare size={17} aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
