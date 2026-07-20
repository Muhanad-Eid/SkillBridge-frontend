import type { AuthResponse } from "../../features/auth/domain/authTypes";

const CONFIGURED_API_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL = import.meta.env.DEV
  ? ""
  : CONFIGURED_API_URL?.trim() ||
    `${window.location.protocol}//${window.location.hostname}:8080`;
const SESSION_LOST_STATUSES = new Set([401, 502, 503, 504]);

export const AUTH_STORAGE_KEY = "skillbridge_auth";
export const AUTH_EXPIRED_EVENT = "skillbridge:auth-expired";

type HttpOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function httpClient<T>(
  endpoint: string,
  options: HttpOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (!options.skipAuth) {
    const auth = getStoredAuth();

    if (auth?.token) {
      headers.set("Authorization", `Bearer ${auth.token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
      {
        ...options,
        headers,
      },
    );
  } catch (caughtError) {
    if (!options.skipAuth && getStoredAuth()?.token) {
      expireAuthSession();
    }

    throw new Error(
      caughtError instanceof Error
        ? "The API is unavailable. Please log in again when it is running."
        : "Unable to reach the API.",
      { cause: caughtError },
    );
  }

  const data = await readResponse(response);

  if (!response.ok) {
    if (
      SESSION_LOST_STATUSES.has(response.status) &&
      !options.skipAuth
    ) {
      expireAuthSession();
    }

    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function getStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const auth = JSON.parse(raw) as Partial<AuthResponse>;

    if (!auth || typeof auth !== "object" || typeof auth.token !== "string") {
      clearStoredAuth();
      return null;
    }

    return auth as AuthResponse;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getTokenExpiresAt(token: string): number | null {
  const payload = token.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decoded = JSON.parse(atob(padded)) as { exp?: unknown };

    return typeof decoded.exp === "number" && Number.isFinite(decoded.exp)
      ? decoded.exp * 1000
      : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()) {
  const expiresAt = getTokenExpiresAt(token);
  return expiresAt !== null && expiresAt <= now;
}

export function expireAuthSession() {
  clearStoredAuth();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));

  const loginPath = window.location.pathname.startsWith("/admin")
    ? "/admin/login"
    : "/login";

  if (window.location.pathname !== loginPath) {
    window.location.replace(loginPath);
  }
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown, status: number) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (!data || typeof data !== "object") {
    if (status === 401) {
      return "Your session expired. Please log in again.";
    }

    return `Request failed (${status}).`;
  }

  if ("message" in data && data.message) {
    return String(data.message);
  }

  if ("detail" in data && data.detail) {
    return String(data.detail);
  }

  if ("title" in data && data.title) {
    return String(data.title);
  }

  if ("errors" in data && data.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map(String);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return `Request failed (${status}).`;
}
