import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  normalizeAuthRole,
  type AuthResponse,
} from "../../features/auth/domain/authTypes";
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
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const storedAuth = getStoredAuth();
    const role = normalizeAuthRole(storedAuth?.role);

    return storedAuth && role ? { ...storedAuth, role } : null;
  });

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
    }

    window.addEventListener("skillbridge:auth-expired", handleExpiredSession);

    return () => {
      window.removeEventListener(
        "skillbridge:auth-expired",
        handleExpiredSession,
      );
    };
  }, []);

  function setAuth(nextUser: AuthResponse) {
    const role = normalizeAuthRole(nextUser.role);

    if (!role) {
      clearStoredAuth();
      setUser(null);
      return;
    }

    const normalizedUser = { ...nextUser, role };

    saveAuth(normalizedUser);
    setUser(normalizedUser);
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

// eslint-disable-next-line react-refresh/only-export-components
export function getRoleHomePath(role?: unknown) {
  const normalizedRole = normalizeAuthRole(role);

  if (normalizedRole === "Company") {
    return "/company/dashboard";
  }

  if (normalizedRole === "JobSeeker") {
    return "/job-seeker/dashboard";
  }

  if (normalizedRole === "Admin") {
    return "/admin/dashboard";
  }

  return "/login";
}
