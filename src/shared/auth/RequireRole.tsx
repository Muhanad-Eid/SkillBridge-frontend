import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { AuthRole } from "../../features/auth/domain/authTypes";
import { getRoleHomePath, useAuth } from "./AuthContext";

type RequireRoleProps = {
  allowedRoles: AuthRole[];
  children: ReactNode;
  loginPath?: string;
};

export default function RequireRole({
  allowedRoles,
  children,
  loginPath = "/portal/login",
}: RequireRoleProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />;
  }

  return children;
}
