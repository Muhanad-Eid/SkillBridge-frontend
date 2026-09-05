import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Edit3,
  FolderKanban,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import { useConfirmation } from "../../../shared/components/ConfirmationContext";
import DataState from "../../../shared/components/DataState";
import Input from "../../../shared/components/Input";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import useUnsavedChangesGuard from "../../../shared/hooks/useUnsavedChangesGuard";
import type { Skill } from "../../skills/domain/skillTypes";
import { getSkillsAsync } from "../../skills/infrastructure/skillApi";
import {
  ExperienceLevels,
  FreelancePricingTypes,
  getExperienceLevelLabel,
  getFreelancePricingLabel,
  getOpportunityTypeLabel,
  getProjectDisplayStatusLabel,
  getProjectStatusLabel,
  getWorkModeLabel,
  isApplicationDeadlinePassed,
  isProjectAcceptingApplications,
  OpportunityTypes,
  ProjectStatuses,
  WorkModes,
  CriterionEvaluationTypes,
  type EvidenceCriterionInput,
  type ExperienceLevel,
  type FreelancePricingType,
  type OpportunityType,
  type Project,
  type ProjectMilestoneInput,
  type ProjectStatus,
  type WorkMode,
} from "../domain/projectTypes";
import {
  createProjectAsync,
  deleteProjectAsync,
  getMyCompanyProjectsAsync,
  publishProjectAsync,
  updateProjectAsync,
  updateProjectStatusAsync,
} from "../infrastructure/projectApi";
import FreelanceWorkspaceNav from "./FreelanceWorkspaceNav";
import EvidenceContractPanel from "./EvidenceContractPanel";

type FormMode = "create" | "edit";

type MilestoneDraft = ProjectMilestoneInput & {
  key: string;
  description: string;
};

type CriterionDraft = EvidenceCriterionInput & { key: string };

type ProjectForm = {
  title: string;
  description: string;
  requirements: string;
  deliverables: string;
  confidentialitySummary: string;
  evidenceCriteria: CriterionDraft[];
  milestones: MilestoneDraft[];
  applicationTask: string;
  requiredTrainingHours: string;
  academicRequirements: string;
  location: string;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  positionsAvailable: string;
  applicationDeadline: string;
  budget: string;
  freelancePricingType: FreelancePricingType;
  freelanceDeliveryDays: string;
  includedRevisions: string;
  durationWeeks: string;
  type: OpportunityType;
  requiredSkillNames: string[];
  preferredSkillNames: string[];
};

type CompanyPortalContext = {
  isCompanyVerified: boolean;
};

type CompanyProjectsPageProps = {
  mode?: "opportunities" | "freelance";
};

const emptyProjectForm: ProjectForm = {
  title: "",
  description: "",
  requirements: "",
  deliverables: "",
  confidentialitySummary: "",
  evidenceCriteria: [
    {
      key: "criterion-1",
      title: "",
      description: "",
      evaluationType: CriterionEvaluationTypes.Rating,
      minimumRating: 2,
      isRequired: true,
      sortOrder: 0,
    },
  ],
  milestones: [
    {
      key: "milestone-1",
      title: "",
      description: "",
      dueAfterDays: 7,
    },
  ],
  applicationTask: "",
  requiredTrainingHours: "",
  academicRequirements: "",
  location: "",
  workMode: WorkModes.Remote,
  experienceLevel: ExperienceLevels.Beginner,
  positionsAvailable: "1",
  applicationDeadline: "",
  budget: "",
  freelancePricingType: FreelancePricingTypes.FixedPrice,
  freelanceDeliveryDays: "14",
  includedRevisions: "1",
  durationWeeks: "6",
  type: OpportunityTypes.ProfessionalProject,
  requiredSkillNames: [],
  preferredSkillNames: [],
};

function normalizeProjectForm(form: ProjectForm): ProjectForm {
  return {
    ...form,
    evidenceCriteria: form.evidenceCriteria.map((criterion) => ({
      ...criterion,
    })),
    milestones: form.milestones.map((milestone) => ({
      ...milestone,
    })),
    requiredSkillNames: [...form.requiredSkillNames],
    preferredSkillNames: [...form.preferredSkillNames],
  };
}

function createEmptyProjectForm(isFreelanceView: boolean): ProjectForm {
  return {
    ...emptyProjectForm,
    milestones: emptyProjectForm.milestones.map((milestone) => ({
      ...milestone,
    })),
    evidenceCriteria: emptyProjectForm.evidenceCriteria.map((criterion) => ({
      ...criterion,
    })),
    type: isFreelanceView
      ? OpportunityTypes.FreelanceTask
      : OpportunityTypes.ProfessionalProject,
  };
}

function createProjectFormSnapshot(form: ProjectForm): ProjectForm {
  return normalizeProjectForm(form);
}

function isProjectFormDirty(
  currentForm: ProjectForm,
  baselineForm: ProjectForm | null,
): boolean {
  if (!baselineForm) {
    return false;
  }

  return (
    JSON.stringify(normalizeProjectForm(currentForm)) !==
    JSON.stringify(normalizeProjectForm(baselineForm))
  );
}

type EvidenceContractTemplate = {
  id: "professional" | "training" | "team" | "micro-task" | "challenge";
  title: string;
  description: string;
  apply: (base: ProjectForm) => ProjectForm;
};

const evidenceContractTemplates: EvidenceContractTemplate[] = [
  {
    id: "professional",
    title: "Professional Project",
    description: "Structured delivery with milestones, feedback, and final evaluation.",
    apply: (base) => ({
      ...base,
      type: OpportunityTypes.ProfessionalProject,
      title: "Professional delivery project",
      description: "A defined provider project with practical deliverables and reviewable progress.",
      requirements: "Complete the agreed work, respond to feedback, and submit the final delivery for evaluation.",
      deliverables: "Project deliverables, milestone evidence, final submission, and a concise handover note.",
      durationWeeks: "8",
      evidenceCriteria: [
        { key: "template-project-delivery", title: "Required deliverables completed", description: "The completed work satisfies the agreed project deliverables.", evaluationType: CriterionEvaluationTypes.PassFail, minimumRating: 2, isRequired: true, sortOrder: 0 },
        { key: "template-project-quality", title: "Quality of implementation", description: "The work meets the provider's stated quality standard.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: true, sortOrder: 1 },
      ],
      milestones: [
        { key: "template-project-plan", title: "Plan and approach", description: "Confirm the work approach and deliverable plan.", dueAfterDays: 14 },
        { key: "template-project-delivery", title: "Final delivery", description: "Submit completed work for provider evaluation.", dueAfterDays: 56 },
      ],
    }),
  },
  {
    id: "training",
    title: "University Training",
    description: "Hours, reports, learning outcomes, and two approvals.",
    apply: (base) => ({
      ...base,
      type: OpportunityTypes.UniversityTraining,
      title: "Supervised university training",
      description: "A supervised workplace training opportunity with connected company and university review.",
      requirements: "Complete the agreed training hours, submit reports, and demonstrate the stated learning outcomes.",
      deliverables: "Training reports, approved milestones, final deliverable, and learning-outcome evidence.",
      academicRequirements: "University monitoring and final academic approval are required.",
      requiredTrainingHours: "120",
      durationWeeks: "12",
      evidenceCriteria: [
        { key: "template-training-outcomes", title: "Learning outcomes demonstrated", description: "Evidence addresses the approved learning outcomes.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: true, sortOrder: 0 },
        { key: "template-training-work", title: "Workplace deliverables completed", description: "Required deliverables and milestones are complete.", evaluationType: CriterionEvaluationTypes.PassFail, minimumRating: 2, isRequired: true, sortOrder: 1 },
        { key: "template-training-reflection", title: "Professional reflection", description: "The participant explains learning from the training context.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: false, sortOrder: 2 },
      ],
      milestones: [
        { key: "template-training-plan", title: "Training plan agreed", description: "Confirm supervision, hours, and intended outcomes.", dueAfterDays: 7 },
        { key: "template-training-report", title: "Progress report submitted", description: "Submit a report for company review.", dueAfterDays: 42 },
        { key: "template-training-final", title: "Final training record", description: "Complete final work and training evidence.", dueAfterDays: 84 },
      ],
    }),
  },
  {
    id: "team",
    title: "Team Project",
    description: "Participant-specific work with an accountable contribution record.",
    apply: (base) => ({
      ...base,
      type: OpportunityTypes.TeamProject,
      title: "Team delivery project",
      description: "A shared project with individual responsibilities, reviewable contribution, and criterion-level evaluation.",
      requirements: "Complete assigned responsibilities, declare participant-specific contribution, and respond to affected-member review.",
      deliverables: "Team deliverable, attributed work record, final submission, and contribution declaration.",
      durationWeeks: "8",
      positionsAvailable: "2",
      evidenceCriteria: [
        { key: "template-team-delivery", title: "Assigned work delivered", description: "Participant-specific responsibilities are completed to the accepted standard.", evaluationType: CriterionEvaluationTypes.PassFail, minimumRating: 2, isRequired: true, sortOrder: 0 },
        { key: "template-team-contribution", title: "Contribution attribution resolved", description: "Affected-member review and provider resolution are complete.", evaluationType: CriterionEvaluationTypes.PassFail, minimumRating: 2, isRequired: true, sortOrder: 1 },
        { key: "template-team-collaboration", title: "Collaboration practices", description: "Evidence of effective collaboration within the project context.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: false, sortOrder: 2 },
      ],
      milestones: [
        { key: "template-team-scope", title: "Responsibilities agreed", description: "Provider defines participant-specific responsibilities.", dueAfterDays: 7 },
        { key: "template-team-review", title: "Contribution review", description: "Affected members review the declared contribution.", dueAfterDays: 35 },
        { key: "template-team-final", title: "Final team delivery", description: "Submit the final work for evaluation and approval.", dueAfterDays: 56 },
      ],
    }),
  },
  {
    id: "micro-task",
    title: "Industry Micro-Task",
    description: "A concise, evaluated brief with one final delivery.",
    apply: (base) => ({
      ...base,
      type: OpportunityTypes.FreelanceTask,
      title: "Focused industry micro-task",
      description: "A small, practical brief evaluated against clear delivery criteria.",
      requirements: "Respond to the brief, complete the agreed scope, and submit one final deliverable.",
      deliverables: "Final deliverable, concise delivery note, and any agreed revision response.",
      durationWeeks: "2",
      budget: "250",
      freelanceDeliveryDays: "14",
      includedRevisions: "1",
      evidenceCriteria: [
        { key: "template-micro-scope", title: "Brief requirements met", description: "The deliverable satisfies the agreed brief and scope.", evaluationType: CriterionEvaluationTypes.PassFail, minimumRating: 2, isRequired: true, sortOrder: 0 },
        { key: "template-micro-quality", title: "Quality of final delivery", description: "The final work meets the provider's stated quality standard.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: true, sortOrder: 1 },
        { key: "template-micro-communication", title: "Delivery communication", description: "The delivery note explains key decisions and handoff details.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: false, sortOrder: 2 },
      ],
      milestones: [],
    }),
  },
  {
    id: "challenge",
    title: "Skill Challenge",
    description: "A predefined assessed challenge with one focused submission.",
    apply: (base) => ({
      ...base,
      type: OpportunityTypes.SkillDevelopmentChallenge,
      title: "Practical skill challenge",
      description: "A predefined challenge that demonstrates a focused practical skill through one assessed outcome.",
      requirements: "Complete the challenge statement using the stated requirements and submit the expected outcome.",
      deliverables: "One challenge submission with a concise explanation of the approach and result.",
      applicationTask: "Describe how you would approach the challenge requirements.",
      durationWeeks: "2",
      budget: "",
      evidenceCriteria: [
        { key: "template-challenge-outcome", title: "Expected outcome achieved", description: "The submission meets the defined challenge outcome.", evaluationType: CriterionEvaluationTypes.PassFail, minimumRating: 2, isRequired: true, sortOrder: 0 },
        { key: "template-challenge-quality", title: "Solution quality", description: "The submitted solution demonstrates the target skill to the required standard.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: true, sortOrder: 1 },
        { key: "template-challenge-extension", title: "Optional extension", description: "Additional work that strengthens the challenge submission.", evaluationType: CriterionEvaluationTypes.Rating, minimumRating: 2, isRequired: false, sortOrder: 2 },
      ],
      milestones: [],
    }),
  },
];

function mergeSkillNames(...groups: string[][]) {
  const names = new Map<string, string>();

  groups.flat().forEach((rawName) => {
    rawName
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => names.set(name.toLowerCase(), name));
  });

  return [...names.values()];
}

function getStatusTone(
  project: Pick<Project, "status" | "applicationDeadline">,
) {
  if (
    project.status === ProjectStatuses.Open &&
    isApplicationDeadlinePassed(project.applicationDeadline)
  ) {
    return "amber";
  }
  if (project.status === ProjectStatuses.Open) return "green";
  if (project.status === ProjectStatuses.InProgress) return "blue";
  if (project.status === ProjectStatuses.Cancelled) return "red";
  return "neutral";
}

export default function CompanyProjectsPage({
  mode: pageMode = "opportunities",
}: CompanyProjectsPageProps) {
  const confirmAction = useConfirmation();
  const { isCompanyVerified } =
    useOutletContext<CompanyPortalContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const createRequested = searchParams.get("create") === "1";
  const isFreelanceView = pageMode === "freelance";
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [requiredSkillInput, setRequiredSkillInput] = useState("");
  const [preferredSkillInput, setPreferredSkillInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(
    createRequested && isCompanyVerified,
  );
  const [mode, setMode] = useState<FormMode>("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(() =>
    createEmptyProjectForm(isFreelanceView),
  );
  const [draftBaseline, setDraftBaseline] = useState<ProjectForm | null>(
    createProjectFormSnapshot(createEmptyProjectForm(isFreelanceView)),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<number | null>(null);
  const [error, setError] = useState(
    createRequested && !isCompanyVerified
      ? "Your company must be verified before posting opportunities."
      : "",
  );
  const [message, setMessage] = useState("");
  const isFormDirty = isProjectFormDirty(form, draftBaseline);

  useUnsavedChangesGuard({
    isDirty: isFormOpen && isFormDirty,
    message:
      "You have unsaved changes to this opportunity. Leave without saving?",
  });

  async function loadProjects() {
    setIsLoading(true);
    setError("");

    try {
      const [projectData, skillData] = await Promise.all([
        getMyCompanyProjectsAsync(1, 50),
        getSkillsAsync(),
      ]);
      setProjects(projectData.items);
      setAvailableSkills(skillData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load opportunities.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadProjects, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const scopedProjects = useMemo(
    () =>
      projects.filter((project) =>
        isFreelanceView
          ? project.type === OpportunityTypes.FreelanceTask
          : project.type !== OpportunityTypes.FreelanceTask,
      ),
    [isFreelanceView, projects],
  );

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase();

    return scopedProjects.filter((project) => {
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "ApplicationsClosed"
          ? project.status === ProjectStatuses.Open &&
            isApplicationDeadlinePassed(project.applicationDeadline)
          : Number(statusFilter) === ProjectStatuses.Open
            ? isProjectAcceptingApplications(project)
            : project.status === Number(statusFilter));
      const matchesType =
        isFreelanceView ||
        typeFilter === "All" ||
        project.type === Number(typeFilter);
      const matchesSearch =
        !value ||
        project.title.toLowerCase().includes(value) ||
        project.description.toLowerCase().includes(value) ||
        project.requirements.toLowerCase().includes(value) ||
        project.skills.some((skill) => skill.name.toLowerCase().includes(value));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [isFreelanceView, scopedProjects, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: scopedProjects.length,
      open: scopedProjects.filter(isProjectAcceptingApplications).length,
      active: scopedProjects.filter(
        (project) => project.status === ProjectStatuses.InProgress,
      ).length,
      applications: scopedProjects.reduce(
        (total, project) => total + project.applicationsCount,
        0,
      ),
    }),
    [scopedProjects],
  );

  async function confirmDiscardDraft() {
    if (!isFormDirty) {
      return true;
    }

    return confirmAction({
      title: "Discard unsaved changes?",
      description:
        "Your edits to this opportunity have not been saved and will be lost.",
      confirmLabel: "Discard changes",
      variant: "warning",
    });
  }

  async function openCreateForm() {
    setMessage("");
    setError("");

    if (!isCompanyVerified) {
      setError("Your company must be verified before posting opportunities.");
      return;
    }

    if (!(await confirmDiscardDraft())) {
      return;
    }

    const nextForm = createEmptyProjectForm(isFreelanceView);
    setMode("create");
    setEditingProject(null);
    setForm(nextForm);
    setDraftBaseline(createProjectFormSnapshot(nextForm));
    setRequiredSkillInput("");
    setPreferredSkillInput("");
    setIsFormOpen(true);
  }

  async function applyEvidenceContractTemplate(template: EvidenceContractTemplate) {
    if (!(await confirmDiscardDraft())) {
      return;
    }

    const nextForm = template.apply(createEmptyProjectForm(isFreelanceView));
    setForm(nextForm);
    setDraftBaseline(createProjectFormSnapshot(nextForm));
    setRequiredSkillInput("");
    setPreferredSkillInput("");
  }

  async function openEditForm(project: Project) {
    if (!(await confirmDiscardDraft())) {
      return;
    }

    const nextForm = {
      title: project.title,
      description: project.description,
      requirements: project.requirements,
      deliverables: project.deliverables,
      confidentialitySummary: project.confidentialitySummary ?? "",
      evidenceCriteria:
        project.evidenceCriteria.length > 0
          ? project.evidenceCriteria.map((criterion) => ({
              ...criterion,
              key: `criterion-${criterion.id}`,
              description: criterion.description ?? "",
            }))
          : project.evaluationCriteria
              .split(/\r?\n|[,;]/)
              .map((title) => title.trim())
              .filter(Boolean)
              .map((title, index) => ({
                key: `criterion-legacy-${index}`,
                title,
                description: "",
                evaluationType: CriterionEvaluationTypes.Rating,
                minimumRating: 2 as const,
                isRequired: true,
                sortOrder: index,
              })),
      milestones:
        project.milestones.length > 0
          ? project.milestones.map((milestone) => ({
              key: `milestone-${milestone.id}`,
              title: milestone.title,
              description: milestone.description ?? "",
              dueAfterDays: milestone.dueAfterDays,
            }))
          : [
              {
                key: "milestone-existing-plan",
                title: "Complete planned work",
                description: project.milestonePlan,
                dueAfterDays: Math.max(1, project.durationWeeks * 7),
              },
            ],
      applicationTask: project.applicationTask,
      requiredTrainingHours: project.requiredTrainingHours?.toString() ?? "",
      academicRequirements: project.academicRequirements ?? "",
      location: project.location ?? "",
      workMode: project.workMode,
      experienceLevel: project.experienceLevel,
      positionsAvailable: project.positionsAvailable.toString(),
      applicationDeadline: project.applicationDeadline ?? "",
      budget: project.budget?.toString() ?? "",
      freelancePricingType:
        project.freelancePricingType ?? FreelancePricingTypes.FixedPrice,
      freelanceDeliveryDays:
        project.freelanceDeliveryDays?.toString() ?? "14",
      includedRevisions:
        project.includedRevisions?.toString() ?? "1",
      durationWeeks: project.durationWeeks.toString(),
      type: project.type,
      requiredSkillNames: project.skills
        .filter((skill) => skill.isRequired)
        .map((skill) => skill.name),
      preferredSkillNames: project.skills
        .filter((skill) => !skill.isRequired)
        .map((skill) => skill.name),
    };

    setMode("edit");
    setEditingProject(project);
    setForm(nextForm);
    setDraftBaseline(createProjectFormSnapshot(nextForm));
    setRequiredSkillInput("");
    setPreferredSkillInput("");
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  async function closeForm({ confirmDiscard = true }: { confirmDiscard?: boolean } = {}) {
    if (confirmDiscard && !(await confirmDiscardDraft())) {
      return;
    }

    setIsFormOpen(false);
    setMode("create");
    setEditingProject(null);
    const nextForm = createEmptyProjectForm(isFreelanceView);
    setForm(nextForm);
    setDraftBaseline(createProjectFormSnapshot(nextForm));
    setRequiredSkillInput("");
    setPreferredSkillInput("");

    if (searchParams.has("create")) {
      setSearchParams({}, { replace: true });
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const enteredDurationWeeks = Number(form.durationWeeks);
    const positionsAvailable = Number(form.positionsAvailable);
    const budget = form.budget.trim() ? Number(form.budget) : null;
    const freelanceDeliveryDays = Number(form.freelanceDeliveryDays);
    const includedRevisions = Number(form.includedRevisions);
    const durationWeeks =
      form.type === OpportunityTypes.FreelanceTask &&
      Number.isInteger(freelanceDeliveryDays) &&
      freelanceDeliveryDays > 0
        ? Math.max(1, Math.ceil(freelanceDeliveryDays / 7))
        : enteredDurationWeeks;
    const workWindowDays =
      form.type === OpportunityTypes.FreelanceTask
        ? freelanceDeliveryDays
        : durationWeeks * 7;
    const usesDirectSubmission =
      form.type === OpportunityTypes.FreelanceTask ||
      form.type === OpportunityTypes.SkillDevelopmentChallenge;
    const milestones = form.milestones.map((milestone) => ({
      title: milestone.title.trim(),
      description: milestone.description.trim() || null,
      dueAfterDays: Number(milestone.dueAfterDays),
    }));
    const milestonePlan = milestones.length > 0
      ? milestones
          .map(
            (milestone, index) =>
              `${index + 1}. ${milestone.title} (day ${milestone.dueAfterDays})`,
          )
          .join("\n")
      : form.type === OpportunityTypes.SkillDevelopmentChallenge
        ? "Complete one assessed challenge submission."
        : "Complete one focused final task submission.";
    const evidenceCriteria = form.evidenceCriteria.map((criterion, index) => ({
      id: criterion.id ?? null,
      title: criterion.title.trim(),
      description: criterion.description?.trim() || null,
      evaluationType: CriterionEvaluationTypes.Rating,
      minimumRating: criterion.minimumRating,
      isRequired: criterion.isRequired,
      sortOrder: index,
    }));
    const evaluationCriteria = evidenceCriteria
      .map((criterion) => criterion.title)
      .join("\n");
    const requiredSkillNames = mergeSkillNames(
      form.requiredSkillNames,
      [requiredSkillInput],
    );
    const requiredNames = new Set(
      requiredSkillNames.map((name) => name.toLowerCase()),
    );
    const preferredSkillNames = mergeSkillNames(
      form.preferredSkillNames,
      [preferredSkillInput],
    ).filter((name) => !requiredNames.has(name.toLowerCase()));

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.requirements.trim() ||
      !form.deliverables.trim() ||
      evidenceCriteria.length === 0 ||
      evidenceCriteria.some((criterion) => !criterion.title) ||
      !form.applicationTask.trim()
    ) {
      setError(
        "Title, description, requirements, deliverables, application task, and evaluation criteria are required.",
      );
      return;
    }

    const requiredTrainingHours = form.requiredTrainingHours
      ? Number(form.requiredTrainingHours)
      : null;
    if (
      form.type === OpportunityTypes.UniversityTraining &&
      (!requiredTrainingHours ||
        requiredTrainingHours < 1 ||
        !form.academicRequirements.trim())
    ) {
      setError(
        "University Training requires training hours and academic requirements.",
      );
      return;
    }

    if (!Number.isInteger(positionsAvailable) || positionsAvailable < 1) {
      setError("At least one position must be available.");
      return;
    }

    if (form.workMode !== WorkModes.Remote && !form.location.trim()) {
      setError("Location is required for hybrid and on-site opportunities.");
      return;
    }

    if (requiredSkillNames.length === 0) {
      setError("Add at least one required skill.");
      return;
    }

    if (
      form.type !== OpportunityTypes.FreelanceTask &&
      (!Number.isInteger(durationWeeks) || durationWeeks < 1)
    ) {
      setError("Duration must be at least one full week.");
      return;
    }

    if (
      form.type === OpportunityTypes.FreelanceTask &&
      (budget === null ||
        budget <= 0 ||
        !Number.isInteger(freelanceDeliveryDays) ||
        freelanceDeliveryDays < 1 ||
        freelanceDeliveryDays > 365 ||
        !Number.isInteger(includedRevisions) ||
        includedRevisions < 0 ||
        includedRevisions > 20)
    ) {
      setError(
        "Add a valid budget, delivery time, and number of revision rounds.",
      );
      return;
    }

    if (
      (!usesDirectSubmission && milestones.length === 0) ||
      milestones.some(
        (milestone) =>
          !milestone.title ||
          !Number.isInteger(milestone.dueAfterDays) ||
          milestone.dueAfterDays < 1 ||
          milestone.dueAfterDays > workWindowDays,
      )
    ) {
      setError(
        `Add at least one milestone and set each due day between 1 and ${workWindowDays}.`,
      );
      return;
    }

    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
      setError("Budget must be zero or greater.");
      return;
    }

    setIsSaving(true);

    try {
      if (mode === "create") {
        await createProjectAsync({
          title: form.title.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          deliverables: form.deliverables.trim(),
          evaluationCriteria,
          confidentialitySummary: form.confidentialitySummary.trim() || null,
          evidenceCriteria,
          milestonePlan,
          milestones,
          applicationTask: form.applicationTask.trim(),
          requiredTrainingHours,
          academicRequirements:
            form.type === OpportunityTypes.UniversityTraining
              ? form.academicRequirements.trim()
              : null,
          location: form.location.trim() || null,
          workMode: form.workMode,
          experienceLevel: form.experienceLevel,
          positionsAvailable,
          applicationDeadline: form.applicationDeadline || null,
          budget,
          freelancePricingType:
            form.type === OpportunityTypes.FreelanceTask
              ? form.freelancePricingType
              : null,
          freelanceDeliveryDays:
            form.type === OpportunityTypes.FreelanceTask
              ? freelanceDeliveryDays
              : null,
          includedRevisions:
            form.type === OpportunityTypes.FreelanceTask
              ? includedRevisions
              : null,
          durationWeeks,
          type: form.type,
          requiredSkillNames,
          preferredSkillNames,
        });
        setMessage(
          "Opportunity saved as a draft. Publish it from the opportunity list when it is ready.",
        );
      } else if (editingProject) {
        await updateProjectAsync(editingProject.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          deliverables: form.deliverables.trim(),
          evaluationCriteria,
          confidentialitySummary: form.confidentialitySummary.trim() || null,
          evidenceCriteria,
          milestonePlan,
          milestones,
          applicationTask: form.applicationTask.trim(),
          requiredTrainingHours,
          academicRequirements:
            form.type === OpportunityTypes.UniversityTraining
              ? form.academicRequirements.trim()
              : null,
          location: form.location.trim() || null,
          workMode: form.workMode,
          experienceLevel: form.experienceLevel,
          positionsAvailable,
          applicationDeadline: form.applicationDeadline || null,
          budget,
          freelancePricingType:
            form.type === OpportunityTypes.FreelanceTask
              ? form.freelancePricingType
              : null,
          freelanceDeliveryDays:
            form.type === OpportunityTypes.FreelanceTask
              ? freelanceDeliveryDays
              : null,
          includedRevisions:
            form.type === OpportunityTypes.FreelanceTask
              ? includedRevisions
              : null,
          durationWeeks,
          type: form.type,
          requiredSkillNames,
          preferredSkillNames,
          status: editingProject.status,
        });
        setMessage("Opportunity details updated.");
      }

      await closeForm({ confirmDiscard: false });
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save opportunity.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish(project: Project) {
    setBusyProjectId(project.id);
    setMessage("");
    setError("");

    try {
      await publishProjectAsync(project.id);
      setMessage(`"${project.title}" is now published on the board.`);
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to publish opportunity.",
      );
    } finally {
      setBusyProjectId(null);
    }
  }

  async function updateStatus(project: Project, status: ProjectStatus) {
    if (
      status === ProjectStatuses.Cancelled &&
      !(await confirmAction({
        title: "Cancel this opportunity?",
        description: `"${project.title}" will stop accepting applications and cannot return to active delivery.`,
        confirmLabel: "Cancel opportunity",
        variant: "warning",
      }))
    ) {
      return;
    }

    setBusyProjectId(project.id);
    setMessage("");
    setError("");

    try {
      await updateProjectStatusAsync(project.id, status);
      setMessage(`"${project.title}" is now ${getProjectStatusLabel(status)}.`);
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update opportunity status.",
      );
    } finally {
      setBusyProjectId(null);
    }
  }

  async function handleDelete(project: Project) {
    if (!(await confirmAction({
      title: "Delete this opportunity?",
      description: `"${project.title}" will be permanently removed. This is available only when no protected workflow records depend on it.`,
      confirmLabel: "Delete opportunity",
      variant: "danger",
    }))) {
      return;
    }

    setBusyProjectId(project.id);
    setMessage("");
    setError("");

    try {
      await deleteProjectAsync(project.id);
      setMessage("Opportunity deleted.");
      await loadProjects();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete opportunity.",
      );
    } finally {
      setBusyProjectId(null);
    }
  }

  function addSkillNames(
    level: "required" | "preferred",
    value: string,
  ) {
    const targetKey = level === "required"
      ? "requiredSkillNames"
      : "preferredSkillNames";
    const otherKey = level === "required"
      ? "preferredSkillNames"
      : "requiredSkillNames";
    const names = mergeSkillNames([value]);

    if (names.length === 0) return;

    const normalizedNames = new Set(names.map((name) => name.toLowerCase()));

    setForm((current) => ({
      ...current,
      [targetKey]: mergeSkillNames(current[targetKey], names),
      [otherKey]: current[otherKey].filter(
        (name) => !normalizedNames.has(name.toLowerCase()),
      ),
    }));

    if (level === "required") setRequiredSkillInput("");
    else setPreferredSkillInput("");
  }

  function removeSkillName(level: "required" | "preferred", name: string) {
    const targetKey = level === "required"
      ? "requiredSkillNames"
      : "preferredSkillNames";

    setForm((current) => ({
      ...current,
      [targetKey]: current[targetKey].filter(
        (skillName) => skillName.toLowerCase() !== name.toLowerCase(),
      ),
    }));
  }

  function handleSkillKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
    level: "required" | "preferred",
  ) {
    if (event.key !== "Enter" && event.key !== ",") return;

    event.preventDefault();
    addSkillNames(level, event.currentTarget.value);
  }

  return (
    <section
      className={`page company-opportunities-page ${
        isFreelanceView ? "company-freelance-page" : ""
      }`}
    >
      <PageHeader
        eyebrow={isFreelanceView ? "Flexible delivery" : "Opportunity management"}
        title={isFreelanceView ? "Industry micro-tasks" : "Opportunities"}
        description={
          isFreelanceView
            ? "Create focused paid tasks, compare proposals, and manage the resulting contracts."
            : "Publish structured work, monitor applications, and manage each opportunity through completion."
        }
        actions={
          <Button
            type="button"
            onClick={openCreateForm}
            disabled={!isCompanyVerified}
            className="button-with-icon"
            title={
              isCompanyVerified
                ? isFreelanceView
                  ? "Create freelance task"
                  : "Create opportunity"
                : "Verification required"
            }
          >
            <Plus size={17} aria-hidden="true" />
            {isFreelanceView ? "New micro-task" : "New opportunity"}
          </Button>
        }
      />

      {isFreelanceView ? <FreelanceWorkspaceNav /> : null}

      {message ? <div className="notice notice-success">{message}</div> : null}
      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="company-kpi-grid company-opportunity-kpis">
        <article>
          <span className="company-kpi-icon kpi-neutral">
            <BriefcaseBusiness size={19} aria-hidden="true" />
          </span>
          <div>
            <span>{isFreelanceView ? "Total tasks" : "Total"}</span>
            <strong>{stats.total}</strong>
          </div>
        </article>
        <article>
          <span className="company-kpi-icon kpi-green">
            <BriefcaseBusiness size={19} aria-hidden="true" />
          </span>
          <div>
            <span>{isFreelanceView ? "Accepting proposals" : "Open"}</span>
            <strong>{stats.open}</strong>
          </div>
        </article>
        <article>
          <span className="company-kpi-icon kpi-blue">
            <Clock3 size={19} aria-hidden="true" />
          </span>
          <div>
            <span>{isFreelanceView ? "Active contracts" : "In progress"}</span>
            <strong>{stats.active}</strong>
          </div>
        </article>
        <article>
          <span className="company-kpi-icon kpi-amber">
            <UsersRound size={19} aria-hidden="true" />
          </span>
          <div>
            <span>{isFreelanceView ? "Proposals" : "Applications"}</span>
            <strong>{stats.applications}</strong>
          </div>
        </article>
      </div>

      <div className="company-list-toolbar">
        <label className="company-search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={
              isFreelanceView
                ? "Search company industry micro-tasks"
                : "Search company opportunities"
            }
            placeholder={isFreelanceView ? "Search industry micro-tasks" : "Search opportunities"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter opportunities by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value={ProjectStatuses.Open}>
            {isFreelanceView ? "Accepting proposals" : "Open"}
          </option>
          <option value="ApplicationsClosed">
            {isFreelanceView ? "Proposals closed" : "Applications closed"}
          </option>
          <option value={ProjectStatuses.InProgress}>
            {isFreelanceView ? "Active contracts" : "In progress"}
          </option>
          <option value={ProjectStatuses.Completed}>Completed</option>
          <option value={ProjectStatuses.Cancelled}>Cancelled</option>
        </select>
        {!isFreelanceView ? (
          <select
            aria-label="Filter opportunities by type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="All">All types</option>
            <option value={OpportunityTypes.ProfessionalProject}>
              Professional projects
            </option>
            <option value={OpportunityTypes.UniversityTraining}>
              University training
            </option>
            <option value={OpportunityTypes.SkillDevelopmentChallenge}>
              Skill-development challenges
            </option>
            <option value={OpportunityTypes.TeamProject}>Team projects</option>
          </select>
        ) : null}
      </div>

      <DataState
        isLoading={isLoading}
        error=""
        empty={!isLoading && filteredProjects.length === 0}
        emptyTitle={isFreelanceView ? "No industry micro-tasks found" : "No opportunities found"}
        emptyDescription={
          scopedProjects.length === 0
            ? isFreelanceView
              ? "Create your first freelance task after company verification."
              : "Create your first opportunity after company verification."
            : "Adjust the search or filters."
        }
        emptyAction={
          scopedProjects.length === 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={!isCompanyVerified}
              onClick={openCreateForm}
            >
              <Plus size={16} aria-hidden="true" />
              {isFreelanceView ? "Create micro-task" : "Create opportunity"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setTypeFilter("All");
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Clear filters
            </Button>
          )
        }
      />

      <div className="company-opportunity-list-v2">
        {filteredProjects.map((project) => {
          const isBusy = busyProjectId === project.id;
          const isAcceptingApplications =
            isProjectAcceptingApplications(project);
          const deadlinePassed = isApplicationDeadlinePassed(
            project.applicationDeadline,
          );

          return (
            <article className="company-opportunity-row" key={project.id}>
              <div className="company-opportunity-main">
                <div className="company-opportunity-title-row">
                  <div>
                    <span>{getOpportunityTypeLabel(project.type)} · #{project.id}</span>
                    <h2>{project.title}</h2>
                  </div>
                  <StatusBadge tone={getStatusTone(project)}>
                    {getProjectDisplayStatusLabel(project)}
                  </StatusBadge>
                </div>
                <p>{project.description}</p>
                <div className="company-opportunity-facts">
                  <span>
                    <UsersRound size={16} /> {project.applicationsCount}{" "}
                    {project.type === OpportunityTypes.FreelanceTask
                      ? "proposals"
                      : "applications"}
                  </span>
                  <span>
                    <Clock3 size={16} />{" "}
                    {project.type === OpportunityTypes.FreelanceTask
                      ? `${project.freelanceDeliveryDays ?? project.durationWeeks * 7} days delivery`
                      : `${project.durationWeeks} weeks`}
                  </span>
                  <span><MapPin size={16} /> {getWorkModeLabel(project.workMode)}</span>
                  <span><Wrench size={16} /> {getExperienceLevelLabel(project.experienceLevel)}</span>
                  {project.applicationDeadline ? (
                    <span>
                      <CalendarDays size={16} />
                      {deadlinePassed ? "Closed" : "Apply by"}{" "}
                      {project.applicationDeadline}
                    </span>
                  ) : null}
                  <span>
                    <CircleDollarSign size={16} />
                    {project.budget !== null ? `$${project.budget}` : "No budget"}
                    {project.type === OpportunityTypes.FreelanceTask
                      ? ` · ${getFreelancePricingLabel(
                          project.freelancePricingType,
                        ).toLowerCase()}`
                      : ""}
                  </span>
                  {project.type === OpportunityTypes.FreelanceTask ? (
                    <span>
                      <RotateCcw size={16} />
                      {project.includedRevisions ?? 1} included{" "}
                      {(project.includedRevisions ?? 1) === 1
                        ? "revision"
                        : "revisions"}
                    </span>
                  ) : null}
                </div>
                <div className="project-skill-tags">
                  {project.skills.slice(0, 6).map((skill) => (
                    <span className={skill.isRequired ? "required" : "preferred"} key={skill.id}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="company-opportunity-controls">
                {project.status !== ProjectStatuses.Cancelled &&
                (!isFreelanceView ||
                  project.status !== ProjectStatuses.Open) ? (
                  <Button
                    to={`/company/projects/${project.id}/work`}
                    variant={
                      isAcceptingApplications ? "secondary" : "primary"
                    }
                    className="button-with-icon"
                  >
                    <FolderKanban size={17} aria-hidden="true" />
                    {isFreelanceView ? "Manage contract" : "Work hub"}
                  </Button>
                ) : null}
                <Button
                  to={`/company/projects/${project.id}/applications`}
                  variant={
                    isAcceptingApplications ? "primary" : "secondary"
                  }
                  className="button-with-icon"
                >
                  <UsersRound size={17} aria-hidden="true" />
                  {project.type === OpportunityTypes.FreelanceTask
                    ? project.status === ProjectStatuses.Open
                      ? "Proposals"
                      : "Work & proposals"
                    : project.status === ProjectStatuses.Open
                      ? "Applicants"
                      : "Team & applicants"}
                </Button>

                {project.status === ProjectStatuses.Draft ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy || !isCompanyVerified}
                    title={
                      isCompanyVerified
                        ? "Publish this draft to the public board"
                        : "Your company must be verified before publishing"
                    }
                    onClick={() => void handlePublish(project)}
                  >
                    Publish
                  </Button>
                ) : null}

                {project.status === ProjectStatuses.Open ? (
                  <>
                    {!isFreelanceView ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isBusy || !isCompanyVerified}
                        onClick={() =>
                          updateStatus(project, ProjectStatuses.InProgress)
                        }
                      >
                        Start work
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => updateStatus(project, ProjectStatuses.Cancelled)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : null}

                {project.status === ProjectStatuses.InProgress ? (
                  <>
                    {!isFreelanceView ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(project, ProjectStatuses.Completed)
                        }
                      >
                        Complete
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => updateStatus(project, ProjectStatuses.Cancelled)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : null}

                {project.status === ProjectStatuses.Cancelled ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy || !isCompanyVerified}
                    onClick={() => updateStatus(project, ProjectStatuses.Open)}
                  >
                    Reopen
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="company-icon-action"
                  aria-label={`Edit ${project.title}`}
                  title="Edit opportunity"
                  disabled={isBusy}
                  onClick={() => openEditForm(project)}
                >
                  <Edit3 size={17} aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="company-icon-action company-danger-icon"
                  aria-label={`Delete ${project.title}`}
                  title={
                    project.applicationsCount > 0
                      ? "This task has activity and must be cancelled instead"
                      : "Delete opportunity"
                  }
                  disabled={isBusy || project.applicationsCount > 0}
                  onClick={() => void handleDelete(project)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {isFormOpen ? (
        <div className="company-drawer-backdrop" role="presentation">
          <section
            className="company-opportunity-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-opportunity-form-title"
          >
            <header>
              <div>
                <span>{mode === "create" ? "New listing" : `Project #${editingProject?.id}`}</span>
                <h2 id="company-opportunity-form-title">
                  {mode === "create"
                    ? isFreelanceView
                      ? "Create freelance task"
                      : "Create opportunity"
                    : isFreelanceView
                      ? "Edit freelance task"
                      : "Edit opportunity"}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="company-icon-action"
                aria-label="Close form"
                title="Close"
                onClick={() => void closeForm()}
              >
                <X size={19} aria-hidden="true" />
              </Button>
            </header>

            {mode === "edit" && editingProject ? (
              <EvidenceContractPanel
                projectId={editingProject.id}
                currentVersionNumber={editingProject.currentEvidenceContractVersionNumber}
                governingVersionNumber={null}
                canInspectHistory
                className="company-contract-history"
              />
            ) : null}

            {mode === "create" ? (
              <section className="evidence-contract-template-picker" aria-labelledby="contract-template-title">
                <header>
                  <div>
                    <span>What kind of opportunity are you creating?</span>
                    <strong id="contract-template-title">Choose a type to start with the right work and evidence structure</strong>
                  </div>
                  <small>All fields remain editable before publishing.</small>
                </header>
                <div>
                  {evidenceContractTemplates.map((template) => (
                    <button
                      type="button"
                      key={template.id}
                      onClick={() => void applyEvidenceContractTemplate(template)}
                    >
                      <strong>{template.title}</strong>
                      <span>{template.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <form onSubmit={handleSave}>
              <nav className="company-opportunity-form-map" aria-label="Opportunity form sections">
                <a href="#opportunity-basics"><span>01</span><strong>Brief</strong></a>
                <a href="#opportunity-plan"><span>02</span><strong>Work plan</strong></a>
                <a href="#opportunity-evidence"><span>03</span><strong>Evidence</strong></a>
                <a href="#opportunity-terms"><span>04</span><strong>Terms</strong></a>
              </nav>

              <section id="opportunity-basics" className="company-opportunity-form-section">
                <header>
                  <span>01 / Brief</span>
                  <div>
                    <h3>Define the opportunity</h3>
                    <p>Give applicants enough context to understand the work and respond meaningfully.</p>
                  </div>
                </header>
              <Input
                label="Title"
                value={form.title}
                maxLength={120}
                required
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
              <label className="field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  maxLength={2000}
                  required
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Requirements</span>
                <textarea
                  value={form.requirements}
                  maxLength={3000}
                  required
                  placeholder="Experience, responsibilities, and other entry requirements"
                  onChange={(event) =>
                    setForm({ ...form, requirements: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Short application task</span>
                <textarea
                  value={form.applicationTask}
                  maxLength={3000}
                  required
                  placeholder="A short task applicants can answer instead of linking previous work"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      applicationTask: event.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Expected deliverables</span>
                <textarea
                  value={form.deliverables}
                  maxLength={3000}
                  required
                  placeholder="What must be submitted or completed"
                  onChange={(event) =>
                    setForm({ ...form, deliverables: event.target.value })
                  }
                />
              </label>
              </section>

              <section id="opportunity-plan" className="company-opportunity-form-section">
                <header>
                  <span>02 / Work plan</span>
                  <div>
                    <h3>{form.type === OpportunityTypes.FreelanceTask || form.type === OpportunityTypes.SkillDevelopmentChallenge ? "Set the submission expectations" : "Set the delivery sequence"}</h3>
                    <p>{form.type === OpportunityTypes.FreelanceTask || form.type === OpportunityTypes.SkillDevelopmentChallenge ? "This opportunity has one direct submission instead of a milestone sequence." : "Milestones become the shared progress record for every accepted participant."}</p>
                  </div>
                </header>
              {form.type === OpportunityTypes.FreelanceTask || form.type === OpportunityTypes.SkillDevelopmentChallenge ? (
                <div className="notice" role="status">
                  <strong>One direct submission</strong>
                  <span>The participant completes the task or challenge, then submits it once for criterion-level evaluation.</span>
                </div>
              ) : (
              <fieldset className="company-milestone-builder">
                <legend>Work milestones</legend>
                <p>
                  Define the stages once. They will be added to every accepted
                  participant when the opportunity starts.
                </p>
                <div className="company-milestone-builder-list">
                  {form.milestones.map((milestone, index) => (
                    <article key={milestone.key}>
                      <header>
                        <strong>Milestone {index + 1}</strong>
                        {form.milestones.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="company-icon-action company-danger-icon"
                            aria-label={`Remove milestone ${index + 1}`}
                            title="Remove milestone"
                            onClick={() =>
                              setForm({
                                ...form,
                                milestones: form.milestones.filter(
                                  (item) => item.key !== milestone.key,
                                ),
                              })
                            }
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
                        ) : null}
                      </header>
                      <div className="company-form-grid">
                        <Input
                          label="Title"
                          value={milestone.title}
                          maxLength={150}
                          required
                          onChange={(event) =>
                            setForm({
                              ...form,
                              milestones: form.milestones.map((item) =>
                                item.key === milestone.key
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <Input
                          label="Due after (days)"
                          type="number"
                          min="1"
                          max={Math.max(7, Number(form.durationWeeks || 1) * 7)}
                          value={milestone.dueAfterDays}
                          required
                          onChange={(event) =>
                            setForm({
                              ...form,
                              milestones: form.milestones.map((item) =>
                                item.key === milestone.key
                                  ? {
                                      ...item,
                                      dueAfterDays: Number(event.target.value),
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      </div>
                      <label className="field">
                        <span>Description</span>
                        <textarea
                          value={milestone.description}
                          maxLength={1500}
                          placeholder="What should be completed at this stage"
                          onChange={(event) =>
                            setForm({
                              ...form,
                              milestones: form.milestones.map((item) =>
                                item.key === milestone.key
                                  ? { ...item, description: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </label>
                    </article>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={form.milestones.length >= 20}
                  onClick={() =>
                    setForm({
                      ...form,
                      milestones: [
                        ...form.milestones,
                        {
                          key: `milestone-${Date.now()}`,
                          title: "",
                          description: "",
                          dueAfterDays: Math.min(
                            Math.max(1, Number(form.durationWeeks || 1) * 7),
                            (form.milestones.at(-1)?.dueAfterDays ?? 0) + 7,
                          ),
                        },
                      ],
                    })
                  }
                >
                  <Plus size={16} aria-hidden="true" />
                  Add milestone
                </Button>
              </fieldset>
              )}
              </section>

              <section id="opportunity-evidence" className="company-opportunity-form-section">
                <header>
                  <span>03 / Evidence</span>
                  <div>
                    <h3>Define what can be proven</h3>
                    <p>Criteria and confidentiality terms become the boundary for evaluation and public claims.</p>
                  </div>
                </header>
              <fieldset className="company-milestone-builder evidence-criteria-builder">
                <legend>Evidence criteria</legend>
                <p>
                  Every criterion is evaluated. Required criteria block evidence
                  issuance when they fall below the selected standard; optional
                  criteria remain visible as not supported.
                </p>
                <div className="company-milestone-list">
                  {form.evidenceCriteria.map((criterion, index) => (
                    <article key={criterion.key}>
                      <header>
                        <strong>Criterion {index + 1}</strong>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Remove criterion ${index + 1}`}
                          title="Remove criterion"
                          disabled={form.evidenceCriteria.length === 1}
                          onClick={() =>
                            setForm({
                              ...form,
                              evidenceCriteria: form.evidenceCriteria.filter(
                                (item) => item.key !== criterion.key,
                              ),
                            })
                          }
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </header>
                      <div className="company-form-grid">
                        <Input
                          label="Criterion title"
                          value={criterion.title}
                          maxLength={250}
                          required
                          placeholder="API security"
                          onChange={(event) =>
                            setForm({
                              ...form,
                              evidenceCriteria: form.evidenceCriteria.map((item) =>
                                item.key === criterion.key
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <label className="field">
                          <span>Evaluation type</span>
                          <select
                            value={criterion.evaluationType}
                            onChange={(event) => {
                              const evaluationType = Number(event.target.value) as
                                (typeof CriterionEvaluationTypes)[keyof typeof CriterionEvaluationTypes];
                              setForm({
                                ...form,
                                evidenceCriteria: form.evidenceCriteria.map((item) =>
                                  item.key === criterion.key
                                    ? {
                                        ...item,
                                        evaluationType,
                                        minimumRating:
                                          evaluationType === CriterionEvaluationTypes.PassFail
                                            ? 2
                                            : item.minimumRating,
                                      }
                                    : item,
                                ),
                              });
                            }}
                          >
                            <option value={CriterionEvaluationTypes.Rating}>
                              Rating scale
                            </option>
                            <option value={CriterionEvaluationTypes.PassFail}>
                              Pass / fail
                            </option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Minimum supported result</span>
                          <select
                            value={criterion.minimumRating}
                            disabled={
                              criterion.evaluationType ===
                              CriterionEvaluationTypes.PassFail
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                evidenceCriteria: form.evidenceCriteria.map((item) =>
                                  item.key === criterion.key
                                    ? {
                                        ...item,
                                        minimumRating: Number(event.target.value) as 1 | 2 | 3,
                                      }
                                    : item,
                                ),
                              })
                            }
                          >
                            {criterion.evaluationType ===
                            CriterionEvaluationTypes.PassFail ? (
                              <option value="2">Pass</option>
                            ) : (
                              <>
                                <option value="1">Needs improvement</option>
                                <option value="2">Meets standard</option>
                                <option value="3">Exceeds standard</option>
                              </>
                            )}
                          </select>
                        </label>
                      </div>
                      <label className="field">
                        <span>Evaluation guidance (optional)</span>
                        <textarea
                          value={criterion.description ?? ""}
                          maxLength={1000}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              evidenceCriteria: form.evidenceCriteria.map((item) =>
                                item.key === criterion.key
                                  ? { ...item, description: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </label>
                      <label className="evidence-required-toggle">
                        <input
                          type="checkbox"
                          checked={criterion.isRequired}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              evidenceCriteria: form.evidenceCriteria.map((item) =>
                                item.key === criterion.key
                                  ? { ...item, isRequired: event.target.checked }
                                  : item,
                              ),
                            })
                          }
                        />
                        <span>Required for evidence issuance</span>
                      </label>
                    </article>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={form.evidenceCriteria.length >= 20}
                  onClick={() =>
                    setForm({
                      ...form,
                      evidenceCriteria: [
                        ...form.evidenceCriteria,
                        {
                          key: `criterion-${Date.now()}`,
                          title: "",
                          description: "",
                          evaluationType: CriterionEvaluationTypes.Rating,
                          minimumRating: 2,
                          isRequired: true,
                          sortOrder: form.evidenceCriteria.length,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={16} aria-hidden="true" />
                  Add criterion
                </Button>
              </fieldset>
              <label className="field">
                <span>Confidentiality conditions (optional)</span>
                <textarea
                  value={form.confidentialitySummary}
                  maxLength={2000}
                  placeholder="Describe what may be summarized publicly and what must remain private."
                  onChange={(event) =>
                    setForm({ ...form, confidentialitySummary: event.target.value })
                  }
                />
              </label>
              </section>

              <section id="opportunity-terms" className="company-opportunity-form-section">
                <header>
                  <span>04 / Terms</span>
                  <div>
                    <h3>Set participation terms</h3>
                    <p>Choose the opportunity type, access conditions, timing, capacity, and skills.</p>
                  </div>
                </header>
              {!isFreelanceView ? (
                <label className="field">
                  <span>Opportunity type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: Number(event.target.value) as OpportunityType,
                      })
                    }
                  >
                    <option value={OpportunityTypes.ProfessionalProject}>
                      Professional project
                    </option>
                    <option value={OpportunityTypes.UniversityTraining}>
                      University training
                    </option>
                    <option value={OpportunityTypes.SkillDevelopmentChallenge}>
                      Skill-development challenge
                    </option>
                    <option value={OpportunityTypes.TeamProject}>Team project</option>
                  </select>
                </label>
              ) : null}
              {form.type === OpportunityTypes.UniversityTraining ? (
                <div className="company-form-grid">
                  <Input
                    label="Required training hours"
                    type="number"
                    min="1"
                    max="2000"
                    value={form.requiredTrainingHours}
                    required
                    onChange={(event) =>
                      setForm({
                        ...form,
                        requiredTrainingHours: event.target.value,
                      })
                    }
                  />
                  <label className="field">
                    <span>Academic requirements</span>
                    <textarea
                      value={form.academicRequirements}
                      maxLength={2000}
                      required
                      onChange={(event) =>
                        setForm({
                          ...form,
                          academicRequirements: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              ) : null}
              {form.type === OpportunityTypes.FreelanceTask ? (
                <fieldset className="freelance-terms-fields">
                  <legend>
                    <CircleDollarSign size={16} aria-hidden="true" />
                    Micro-task terms
                  </legend>
                  <div className="company-form-grid">
                    <label className="field">
                      <span>Pricing</span>
                      <select
                        value={form.freelancePricingType}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            freelancePricingType: Number(
                              event.target.value,
                            ) as FreelancePricingType,
                          })
                        }
                      >
                        <option value={FreelancePricingTypes.FixedPrice}>
                          Fixed price
                        </option>
                        <option value={FreelancePricingTypes.Hourly}>
                          Hourly
                        </option>
                      </select>
                    </label>
                    <Input
                      label={
                        form.freelancePricingType ===
                        FreelancePricingTypes.Hourly
                          ? "Suggested hourly rate"
                          : "Budget"
                      }
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.budget}
                      required
                      onChange={(event) =>
                        setForm({ ...form, budget: event.target.value })
                      }
                    />
                  </div>
                  <div className="company-form-grid">
                    <Input
                      label="Expected delivery days"
                      type="number"
                      min="1"
                      max="365"
                      value={form.freelanceDeliveryDays}
                      required
                      onChange={(event) =>
                        setForm({
                          ...form,
                          freelanceDeliveryDays: event.target.value,
                        })
                      }
                    />
                    <Input
                      label="Included revisions"
                      type="number"
                      min="0"
                      max="20"
                      value={form.includedRevisions}
                      required
                      onChange={(event) =>
                        setForm({
                          ...form,
                          includedRevisions: event.target.value,
                        })
                      }
                    />
                  </div>
                </fieldset>
              ) : null}
              <div className="company-form-grid">
                <label className="field">
                  <span>Work mode</span>
                  <select
                    value={form.workMode}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        workMode: Number(event.target.value) as WorkMode,
                      })
                    }
                  >
                    <option value={WorkModes.Remote}>Remote</option>
                    <option value={WorkModes.Hybrid}>Hybrid</option>
                    <option value={WorkModes.OnSite}>On-site</option>
                  </select>
                </label>
                <label className="field">
                  <span>Experience level</span>
                  <select
                    value={form.experienceLevel}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        experienceLevel: Number(event.target.value) as ExperienceLevel,
                      })
                    }
                  >
                    <option value={ExperienceLevels.Beginner}>Beginner</option>
                    <option value={ExperienceLevels.Intermediate}>Intermediate</option>
                    <option value={ExperienceLevels.Advanced}>Advanced</option>
                  </select>
                </label>
              </div>
              <Input
                label={form.workMode === WorkModes.Remote ? "Location (optional)" : "Location"}
                value={form.location}
                maxLength={150}
                required={form.workMode !== WorkModes.Remote}
                placeholder="City, country, or office location"
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
              <div className="company-form-grid">
                {form.type === OpportunityTypes.FreelanceTask ? (
                  <div className="company-field-readout">
                    <span>Work window</span>
                    <strong>
                      {Number(form.freelanceDeliveryDays) > 0
                        ? `${form.freelanceDeliveryDays} days`
                        : "Set delivery above"}
                    </strong>
                    <small>
                      The project duration is calculated from the delivery
                      target.
                    </small>
                  </div>
                ) : (
                  <Input
                    label="Duration in weeks"
                    type="number"
                    min="1"
                    max="104"
                    value={form.durationWeeks}
                    required
                    onChange={(event) =>
                      setForm({ ...form, durationWeeks: event.target.value })
                    }
                  />
                )}
                {form.type !== OpportunityTypes.FreelanceTask ? (
                  <Input
                    label="Budget (optional)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={(event) =>
                      setForm({ ...form, budget: event.target.value })
                    }
                  />
                ) : null}
              </div>
              <div className="company-form-grid">
                <Input
                  label="Positions available"
                  type="number"
                  min="1"
                  max="100"
                  value={form.positionsAvailable}
                  required
                  onChange={(event) =>
                    setForm({ ...form, positionsAvailable: event.target.value })
                  }
                />
                <Input
                  label="Application deadline (optional)"
                  type="date"
                  value={form.applicationDeadline}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    setForm({ ...form, applicationDeadline: event.target.value })
                  }
                />
              </div>
              <fieldset className="project-skill-picker">
                <legend><Wrench size={16} /> Skills</legend>
                <p>Type a skill and press Enter or comma. Existing skills are suggested, but you can add any skill the opportunity needs.</p>
                <datalist id="company-skill-suggestions">
                  {availableSkills.map((skill) => (
                    <option key={skill.id} value={skill.name} />
                  ))}
                </datalist>

                <div className="project-skill-entry">
                  <label htmlFor="required-skill-input">Required skills</label>
                  <div>
                    <input
                      id="required-skill-input"
                      list="company-skill-suggestions"
                      value={requiredSkillInput}
                      maxLength={100}
                      placeholder="React, SQL, communication..."
                      onChange={(event) => setRequiredSkillInput(event.target.value)}
                      onKeyDown={(event) => handleSkillKeyDown(event, "required")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!requiredSkillInput.trim()}
                      onClick={() => addSkillNames("required", requiredSkillInput)}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                  <div className="project-skill-tags editable">
                    {form.requiredSkillNames.map((name) => (
                      <span className="required" key={name.toLowerCase()}>
                        {name}
                        <button
                          type="button"
                          aria-label={`Remove ${name}`}
                          onClick={() => removeSkillName("required", name)}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="project-skill-entry">
                  <label htmlFor="preferred-skill-input">Preferred skills</label>
                  <div>
                    <input
                      id="preferred-skill-input"
                      list="company-skill-suggestions"
                      value={preferredSkillInput}
                      maxLength={100}
                      placeholder="Testing, Figma, documentation..."
                      onChange={(event) => setPreferredSkillInput(event.target.value)}
                      onKeyDown={(event) => handleSkillKeyDown(event, "preferred")}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!preferredSkillInput.trim()}
                      onClick={() => addSkillNames("preferred", preferredSkillInput)}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                  <div className="project-skill-tags editable">
                    {form.preferredSkillNames.map((name) => (
                      <span className="preferred" key={name.toLowerCase()}>
                        {name}
                        <button
                          type="button"
                          aria-label={`Remove ${name}`}
                          onClick={() => removeSkillName("preferred", name)}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </fieldset>
              </section>
              <div className="company-drawer-actions">
                <Button type="button" variant="secondary" onClick={() => void closeForm()}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  {mode === "create" ? "Save opportunity" : "Save changes"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
