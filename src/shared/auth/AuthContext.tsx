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
  AUTH_EXPIRED_EVENT,
  AUTH_STORAGE_KEY,
  clearStoredAuth,
  expireAuthSession,
  getStoredAuth,
  getTokenExpiresAt,
  isTokenExpired,
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

    if (!storedAuth || !role || isTokenExpired(storedAuth.token)) {
      clearStoredAuth();
      return null;
    }

    return { ...storedAuth, role };
  });

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      const storedAuth = getStoredAuth();
      const role = normalizeAuthRole(storedAuth?.role);

      if (!storedAuth || !role || isTokenExpired(storedAuth.token)) {
        expireAuthSession();
        return;
      }

      setUser({ ...storedAuth, role });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!user?.token) {
      return;
    }

    const token = user.token;
    const expiresAt = getTokenExpiresAt(token);

    if (expiresAt === null) {
      return;
    }

    const expirationTime = expiresAt;
    let timeoutId = 0;

    function checkExpiration() {
      if (isTokenExpired(token)) {
        expireAuthSession();
        return;
      }

      const remaining = Math.max(0, expirationTime - Date.now());
      timeoutId = window.setTimeout(
        checkExpiration,
        Math.min(remaining, 2_147_000_000),
      );
    }

    timeoutId = window.setTimeout(
      checkExpiration,
      Math.min(Math.max(0, expirationTime - Date.now()), 2_147_000_000),
    );

    return () => window.clearTimeout(timeoutId);
  }, [user?.token]);

  useEffect(() => {
    const token = user?.token;

    if (!token) {
      return;
    }

    function checkStoredSession() {
      const storedAuth = getStoredAuth();

      if (!storedAuth || storedAuth.token !== token || isTokenExpired(token)) {
        expireAuthSession();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkStoredSession();
      }
    }

    window.addEventListener("focus", checkStoredSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", checkStoredSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.token]);

  function setAuth(nextUser: AuthResponse) {
    const role = normalizeAuthRole(nextUser.role);

    if (!role || !nextUser.token || isTokenExpired(nextUser.token)) {
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
        isAuthenticated: Boolean(
          user?.token && !isTokenExpired(user.token),
        ),
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
