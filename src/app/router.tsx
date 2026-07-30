import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireGuest from "../shared/auth/RequireGuest";
import RequireRole from "../shared/auth/RequireRole";
import {
  AdminApplicationsPage,
  AdminDashboard,
  AdminLoginPage,
  AdminPortalLayout,
  AdminProjectsPage,
  AdminReviewsPage,
  AdminSkillsPage,
  ChangePasswordPage,
  CompaniesPage,
  CompanyApplicationsPage,
  CompanyDashboardPage,
  CompanyPortalLayout,
  CompanyProfilePage,
  CompanyProjectApplicationsPage,
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
  PublicPortfolioPage,
  RegisterPage,
  ResetPasswordPage,
  SkillsPage,
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
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/admin/login",
    element: (
      <RequireGuest>
        <AdminLoginPage />
      </RequireGuest>
    ),
  },
  {
    path: "/company",
    element: (
      <RequireRole allowedRoles={["Company"]}>
        <CompanyPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/company/dashboard" replace /> },
      { path: "dashboard", element: <CompanyDashboardPage /> },
      { path: "work", element: <WorkOverviewPage /> },
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
        path: "projects/:projectId/applications",
        element: <CompanyProjectApplicationsPage />,
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
    element: (
      <RequireRole allowedRoles={["JobSeeker"]}>
        <JobSeekerPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/job-seeker/dashboard" replace /> },
      { path: "dashboard", element: <JobSeekerDashboardPage /> },
      { path: "work", element: <WorkOverviewPage /> },
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
      { path: "freelance/:projectId", element: <ProjectDetailsPage /> },
      { path: "work/:projectId", element: <WorkHubPage /> },
      { path: "profile", element: <JobSeekerProfilePage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "portfolio", element: <PortfolioPage /> },
      { path: "reviews", element: <JobSeekerReviewsPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "security", element: <ChangePasswordPage /> },
    ],
  },
  {
    path: "/university",
    element: (
      <RequireRole allowedRoles={["UniversitySupervisor"]}>
        <UniversityPortalLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/university/training" replace /> },
      { path: "training", element: <UniversityTrainingPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "security", element: <ChangePasswordPage /> },
    ],
  },
  {
    path: "/admin",
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
      { path: "applications", element: <AdminApplicationsPage /> },
      { path: "reviews", element: <AdminReviewsPage /> },
      { path: "skills", element: <AdminSkillsPage /> },
      { path: "security", element: <ChangePasswordPage /> },
    ],
  },
]);
