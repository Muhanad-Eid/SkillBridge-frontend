import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import RequireRole from "../shared/auth/RequireRole";
import EmptyState from "../shared/components/EmptyState";
import LoginPage from "../features/auth/presentation/LoginPage";
import RegisterPage from "../features/auth/presentation/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: "/company",
    element: (
      <RequireRole allowedRoles={["Company"]}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <EmptyState
            title="Company dashboard"
            description="Your company workspace is ready. Next we will add opportunity posting and applicant review."
          />
        ),
      },
    ],
  },
  {
    path: "/job-seeker",
    element: (
      <RequireRole allowedRoles={["JobSeeker"]}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <EmptyState
            title="Job seeker dashboard"
            description="Your applicant workspace is ready. Next we will add opportunities, applications, and portfolio."
          />
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireRole allowedRoles={["Admin"]}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <EmptyState
            title="Admin dashboard"
            description="Admin routing is ready for users, companies, and platform controls."
          />
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
