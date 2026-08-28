import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireGuest from "../shared/auth/RequireGuest";
import RequireRole from "../shared/auth/RequireRole";
import RouteErrorPage from "../shared/components/RouteErrorPage";
import {
  AdminApplicationsPage,
  AdminDashboard,
  AdminEvidencePage,
  AdminLoginPage,
  AdminPortalLayout,
  AdminProjectsPage,
  AdminReviewsPage,
  AdminSkillsPage,
  AuditLogPage,
  ChangePasswordPage,
  CompaniesPage,
  CompanyApplicationsPage,
  CompanyDashboardPage,
  CompanyPortalLayout,
  CompanyProfilePage,
  CompanyProjectApplicationsPage,
  DecisionRoomPage,
  CompanyProjectsPage,
  ForgotPasswordPage,
  HomePage,
  JobSeekerDashboardPage,
  JobSeekerPortalLayout,
  JobSeekerProfilePage,
  JobSeekerReviewsPage,
  JobSeekersPage,
  LoginPage,
  MessagesPage,
  MyApplicationsPage,
  NotFoundPage,
  NotificationsPage,
  PortfolioPage,
  ProjectDetailsPage,
  ProjectsPage,
  PublicLayout,
  PublicInfoPage,
  PublicEvidenceSharePage,
  PublicEvidenceReviewRequestPage,
  PublicPortfolioPage,
  ProofEnginePage,
  ProofBriefWorkspacePage,
  EvidenceRequestWorkspacePage,
  RegisterPage,
  ResetPasswordPage,
  TalentProfilePage,
  TalentSearchPage,
  UniversityPortalLayout,
  UniversityTrainingPage,
  UsersPage,
  WorkHubPage,
  WorkOverviewPage,
} from "./routeComponents";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "login",
        element: (
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        ),
      },
      {
        path: "portal/login",
        element: (
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        ),
      },
      {
        path: "register",
        element: (
          <RequireGuest>
            <RegisterPage />
          </RequireGuest>
        ),
      },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "contact", element: <PublicInfoPage type="contact" /> },
      { path: "privacy", element: <PublicInfoPage type="privacy" /> },
      { path: "terms", element: <PublicInfoPage type="terms" /> },
      {
        path: "opportunities",
        element: <ProjectsPage key="public-opportunities" />,
      },
      { path: "opportunities/:projectId", element: <ProjectDetailsPage /> },
      {
        path: "freelance",
        element: <ProjectsPage key="public-freelance" mode="freelance" />,
      },
      { path: "freelance/:projectId", element: <ProjectDetailsPage /> },
      {
        path: "portfolio/:jobSeekerId",
        element: <PublicPortfolioPage />,
      },
      {
        path: "evidence/share/:token",
        element: <PublicEvidenceSharePage />,
      },
      {
        path: "evidence/review/:token",
        element: <PublicEvidenceReviewRequestPage />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/admin/login",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireGuest>
        <AdminLoginPage />
      </RequireGuest>
    ),
  },
  {
    path: "/company",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole allowedRoles={["Company"]}>
        <CompanyPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/company/dashboard" replace /> },
      { path: "dashboard", element: <CompanyDashboardPage /> },
      { path: "work", element: <WorkOverviewPage mode="work" /> },
      { path: "proof-engine", element: <ProofEnginePage /> },
      { path: "evidence-requests", element: <EvidenceRequestWorkspacePage /> },
      { path: "proof-engine/:applicationId", element: <ProofEnginePage /> },
      {
        path: "projects",
        element: <CompanyProjectsPage key="company-opportunities" />,
      },
      {
        path: "freelance",
        element: (
          <CompanyProjectsPage key="company-freelance" mode="freelance" />
        ),
      },
      {
        path: "freelance/work",
        element: <WorkOverviewPage mode="freelance" />,
      },
      {
        path: "projects/:projectId/applications",
        element: <CompanyProjectApplicationsPage />,
      },
      {
        path: "projects/:projectId/applications/:applicationId/decision",
        element: <DecisionRoomPage />,
      },
      {
        path: "projects/:projectId/proof-brief",
        element: <ProofBriefWorkspacePage />,
      },
      { path: "projects/:projectId/work", element: <WorkHubPage /> },
      { path: "applications", element: <CompanyApplicationsPage /> },
      { path: "talent", element: <TalentSearchPage /> },
      { path: "talent/:jobSeekerId", element: <TalentProfilePage /> },
      { path: "profile", element: <CompanyProfilePage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "security", element: <ChangePasswordPage /> },
      { path: "reviews", element: <Navigate to="/company/projects" replace /> },
    ],
  },
  {
    path: "/job-seeker",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole allowedRoles={["JobSeeker"]}>
        <JobSeekerPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/job-seeker/dashboard" replace /> },
      { path: "dashboard", element: <JobSeekerDashboardPage /> },
      { path: "work", element: <WorkOverviewPage mode="work" /> },
      { path: "proof-engine", element: <ProofEnginePage /> },
      { path: "evidence-requests", element: <EvidenceRequestWorkspacePage /> },
      { path: "proof-engine/:applicationId", element: <ProofEnginePage /> },
      {
        path: "opportunities",
        element: <ProjectsPage key="job-seeker-opportunities" />,
      },
      { path: "opportunities/:projectId", element: <ProjectDetailsPage /> },
      {
        path: "applications",
        element: <MyApplicationsPage key="job-seeker-applications" />,
      },
      {
        path: "freelance",
        element: <ProjectsPage key="job-seeker-freelance" mode="freelance" />,
      },
      {
        path: "freelance/proposals",
        element: (
          <MyApplicationsPage key="job-seeker-proposals" mode="freelance" />
        ),
      },
      {
        path: "freelance/work",
        element: <WorkOverviewPage mode="freelance" />,
      },
      { path: "freelance/:projectId", element: <ProjectDetailsPage /> },
      { path: "work/:projectId", element: <WorkHubPage /> },
      { path: "profile", element: <JobSeekerProfilePage /> },
      {
        path: "profile/preview",
        element: <TalentProfilePage mode="self-preview" />,
      },
      {
        path: "skills",
        element: <Navigate to="/job-seeker/profile?tab=skills" replace />,
      },
      { path: "portfolio", element: <PortfolioPage /> },
      { path: "reviews", element: <JobSeekerReviewsPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "security", element: <ChangePasswordPage /> },
    ],
  },
  {
    path: "/university",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole allowedRoles={["UniversitySupervisor"]}>
        <UniversityPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/university/training" replace /> },
      { path: "training", element: <UniversityTrainingPage /> },
      { path: "proof-engine", element: <ProofEnginePage /> },
      { path: "evidence-requests", element: <EvidenceRequestWorkspacePage /> },
      { path: "proof-engine/:applicationId", element: <ProofEnginePage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "security", element: <ChangePasswordPage /> },
    ],
  },
  {
    path: "/admin",
    errorElement: <RouteErrorPage />,
    element: (
      <RequireRole allowedRoles={["Admin"]} loginPath="/admin/login">
        <AdminPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <UsersPage /> },
      { path: "companies", element: <CompaniesPage /> },
      { path: "job-seekers", element: <JobSeekersPage /> },
      { path: "projects", element: <AdminProjectsPage /> },
      { path: "evidence", element: <AdminEvidencePage /> },
      { path: "proof-engine", element: <ProofEnginePage /> },
      { path: "evidence-requests", element: <EvidenceRequestWorkspacePage /> },
      { path: "proof-engine/:applicationId", element: <ProofEnginePage /> },
      { path: "applications", element: <AdminApplicationsPage /> },
      { path: "reviews", element: <AdminReviewsPage /> },
      { path: "skills", element: <AdminSkillsPage /> },
      { path: "audit", element: <AuditLogPage /> },
      { path: "security", element: <ChangePasswordPage /> },
    ],
  },
]);
