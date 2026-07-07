import type { AuthResponse } from "../../features/auth/domain/authTypes";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AUTH_STORAGE_KEY = "skillbridge_auth";

type HttpOptions = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function httpClient<T>(
  endpoint: string,
  options: HttpOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = getStoredToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data), response.status, data);
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
    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getStoredToken() {
  return getStoredAuth()?.token;
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown) {
  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object" && "message" in data) {
    return String((data as { message: unknown }).message);
  }

  if (data && typeof data === "object" && "errors" in data) {
    const errors = (data as { errors: Record<string, string[]> }).errors;
    const messages = Object.values(errors).flat();

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Request failed. Please try again.";
}
