import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminPortalLayout from "./layouts/AdminPortalLayout";
import CompanyPortalLayout from "./layouts/CompanyPortalLayout";
import JobSeekerPortalLayout from "./layouts/JobSeekerPortalLayout";
import PublicLayout from "./layouts/PublicLayout";
import RequireRole from "../shared/auth/RequireRole";
import AdminDashboard from "../features/admin/presentation/AdminDashboard";
import AdminProjectsPage from "../features/admin/presentation/AdminProjectsPage";
import CompaniesPage from "../features/admin/presentation/CompaniesPage";
import JobSeekersPage from "../features/admin/presentation/JobSeekersPage";
import UsersPage from "../features/admin/presentation/UsersPage";
import AdminLoginPage from "../features/auth/presentation/AdminLoginPage";
import LoginPage from "../features/auth/presentation/LoginPage";
import RegisterPage from "../features/auth/presentation/RegisterPage";
import CompanyApplicationsPage from "../features/applications/presentation/CompanyApplicationsPage";
import CompanyProjectApplicationsPage from "../features/applications/presentation/CompanyProjectApplicationsPage";
import MyApplicationsPage from "../features/applications/presentation/MyApplicationsPage";
import CompanyDashboardPage from "../features/home/presentation/CompanyDashboardPage";
import HomePage from "../features/home/presentation/HomePage";
import JobSeekerDashboardPage from "../features/home/presentation/JobSeekerDashboardPage";
import MessagesPage from "../features/messages/presentation/MessagesPage";
import NotificationsPage from "../features/notifications/presentation/NotificationsPage";
import PortfolioPage from "../features/portfolio/presentation/PortfolioPage";
import CompanyProfilePage from "../features/profiles/presentation/CompanyProfilePage";
import JobSeekerProfilePage from "../features/profiles/presentation/JobSeekerProfilePage";
import CompanyProjectsPage from "../features/projects/presentation/CompanyProjectsPage";
import ProjectDetailsPage from "../features/projects/presentation/ProjectDetailsPage";
import ProjectsPage from "../features/projects/presentation/ProjectsPage";
import ReviewsPage from "../features/reviews/presentation/ReviewsPage";
import SkillsPage from "../features/skills/presentation/SkillsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "portal/login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "opportunities", element: <ProjectsPage /> },
      { path: "opportunities/:projectId", element: <ProjectDetailsPage /> },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
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
      { path: "projects", element: <CompanyProjectsPage /> },
      {
        path: "projects/:projectId/applications",
        element: <CompanyProjectApplicationsPage />,
      },
      { path: "applications", element: <CompanyApplicationsPage /> },
      { path: "profile", element: <CompanyProfilePage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "reviews", element: <ReviewsPage /> },
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
      { path: "opportunities", element: <ProjectsPage /> },
      { path: "opportunities/:projectId", element: <ProjectDetailsPage /> },
      { path: "applications", element: <MyApplicationsPage /> },
      { path: "profile", element: <JobSeekerProfilePage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "portfolio", element: <PortfolioPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
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
    ],
  },
  { path: "*", element: <Navigate to="/opportunities" replace /> },
]);
