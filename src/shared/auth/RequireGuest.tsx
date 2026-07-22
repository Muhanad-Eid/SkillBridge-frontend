import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRoleHomePath, useAuth } from "./AuthContext";

type RequireGuestProps = {
  children: ReactNode;
};

export default function RequireGuest({ children }: RequireGuestProps) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />;
  }

  return children;
}
