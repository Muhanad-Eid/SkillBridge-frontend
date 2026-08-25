import { lazy } from "react";

export const AdminPortalLayout = lazy(
  () => import("./layouts/AdminPortalLayout"),
);
export const CompanyPortalLayout = lazy(
  () => import("./layouts/CompanyPortalLayout"),
);
export const JobSeekerPortalLayout = lazy(
  () => import("./layouts/JobSeekerPortalLayout"),
);
export const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
export const UniversityPortalLayout = lazy(
  () => import("./layouts/UniversityPortalLayout"),
);
export const AdminApplicationsPage = lazy(
  () => import("../features/admin/presentation/AdminApplicationsPage"),
);
export const AdminDashboard = lazy(
  () => import("../features/admin/presentation/AdminDashboard"),
);
export const AdminProjectsPage = lazy(
  () => import("../features/admin/presentation/AdminProjectsPage"),
);
export const AdminEvidencePage = lazy(
  () => import("../features/admin/presentation/AdminEvidencePage"),
);
export const AdminReviewsPage = lazy(
  () => import("../features/admin/presentation/AdminReviewsPage"),
);
export const AdminSkillsPage = lazy(
  () => import("../features/admin/presentation/AdminSkillsPage"),
);
export const AuditLogPage = lazy(
  () => import("../features/admin/presentation/AuditLogPage"),
);
export const CompaniesPage = lazy(
  () => import("../features/admin/presentation/CompaniesPage"),
);
export const JobSeekersPage = lazy(
  () => import("../features/admin/presentation/JobSeekersPage"),
);
export const UsersPage = lazy(
  () => import("../features/admin/presentation/UsersPage"),
);
export const AdminLoginPage = lazy(
  () => import("../features/auth/presentation/AdminLoginPage"),
);
export const ChangePasswordPage = lazy(
  () => import("../features/auth/presentation/ChangePasswordPage"),
);
export const ForgotPasswordPage = lazy(
  () => import("../features/auth/presentation/ForgotPasswordPage"),
);
export const LoginPage = lazy(
  () => import("../features/auth/presentation/LoginPage"),
);
export const RegisterPage = lazy(
  () => import("../features/auth/presentation/RegisterPage"),
);
export const ResetPasswordPage = lazy(
  () => import("../features/auth/presentation/ResetPasswordPage"),
);
export const CompanyApplicationsPage = lazy(
  () =>
    import("../features/applications/presentation/CompanyApplicationsPage"),
);
export const CompanyProjectApplicationsPage = lazy(
  () =>
    import(
      "../features/applications/presentation/CompanyProjectApplicationsPage"
    ),
);
export const MyApplicationsPage = lazy(
  () => import("../features/applications/presentation/MyApplicationsPage"),
);
export const CompanyDashboardPage = lazy(
  () => import("../features/home/presentation/CompanyDashboardPage"),
);
export const HomePage = lazy(
  () => import("../features/home/presentation/HomePage"),
);
export const NotFoundPage = lazy(
  () => import("../features/home/presentation/NotFoundPage"),
);
export const JobSeekerDashboardPage = lazy(
  () => import("../features/home/presentation/JobSeekerDashboardPage"),
);
export const MessagesPage = lazy(
  () => import("../features/messages/presentation/MessagesPage"),
);
export const NotificationsPage = lazy(
  () => import("../features/notifications/presentation/NotificationsPage"),
);
export const PortfolioPage = lazy(
  () => import("../features/portfolio/presentation/PortfolioPage"),
);
export const PublicPortfolioPage = lazy(
  () => import("../features/portfolio/presentation/PublicPortfolioPage"),
);
export const PublicEvidenceSharePage = lazy(
  () => import("../features/evidence/presentation/PublicEvidenceSharePage"),
);
export const CompanyProfilePage = lazy(
  () => import("../features/profiles/presentation/CompanyProfilePage"),
);
export const JobSeekerProfilePage = lazy(
  () => import("../features/profiles/presentation/JobSeekerProfilePage"),
);
export const JobSeekerReviewsPage = lazy(
  () => import("../features/reviews/presentation/JobSeekerReviewsPage"),
);
export const CompanyProjectsPage = lazy(
  () => import("../features/projects/presentation/CompanyProjectsPage"),
);
export const ProjectDetailsPage = lazy(
  () => import("../features/projects/presentation/ProjectDetailsPage"),
);
export const ProjectsPage = lazy(
  () => import("../features/projects/presentation/ProjectsPage"),
);
export const SkillsPage = lazy(
  () => import("../features/skills/presentation/SkillsPage"),
);
export const TalentProfilePage = lazy(
  () => import("../features/talent/presentation/TalentProfilePage"),
);
export const TalentSearchPage = lazy(
  () => import("../features/talent/presentation/TalentSearchPage"),
);
export const WorkHubPage = lazy(
  () => import("../features/work/presentation/WorkHubPage"),
);
export const WorkOverviewPage = lazy(
  () => import("../features/work/presentation/WorkOverviewPage"),
);
export const UniversityTrainingPage = lazy(
  () => import("../features/work/presentation/UniversityTrainingPage"),
);
