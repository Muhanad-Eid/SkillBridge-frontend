import type { AuthResponse } from "../../features/auth/domain/authTypes";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080";

const AUTH_STORAGE_KEY = "skillbridge_auth";

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

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function getStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  return raw ? JSON.parse(raw) : null;
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
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
