import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthResponse } from "../../features/auth/domain/authTypes";
import {
  clearStoredAuth,
  getStoredAuth,
  saveAuth,
} from "../api/httpClient";

type AuthContextValue = {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() => getStoredAuth());

  function setAuth(nextUser: AuthResponse) {
    saveAuth(nextUser);
    setUser(nextUser);
  }

  function logout() {
    clearStoredAuth();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user?.token),
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export function getRoleHomePath(role?: string) {
  if (role === "Company") {
    return "/company/dashboard";
  }

  if (role === "JobSeeker") {
    return "/job-seeker/dashboard";
  }

  if (role === "Admin") {
    return "/admin/dashboard";
  }

  return "/login";
}
