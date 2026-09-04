import type { AuthResponse } from "../../features/auth/domain/authTypes";

const DEV_ALLOWED_API_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

function resolveConfiguredApiBaseUrl() {
  const configuredUrl = (
    import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? ""
  )
    .trim();

  if (!configuredUrl) {
    return "";
  }

  try {
    const apiUrl = new URL(configuredUrl);

    if (import.meta.env.DEV && !DEV_ALLOWED_API_HOSTNAMES.has(apiUrl.hostname)) {
      console.warn(
        "Ignoring remote VITE_API_URL in local development; using same-origin /api proxy instead.",
      );
      return "";
    }

    return apiUrl.origin;
  } catch {
    return configuredUrl.replace(/\/$/, "");
  }
}

export const API_BASE_URL =
  resolveConfiguredApiBaseUrl() ||
  (import.meta.env.DEV ? "" : window.location.origin);

export const API_HEALTH_URL = `${API_BASE_URL.replace(/\/$/, "")}/health/ready`;
const SESSION_LOST_STATUSES = new Set([401]);
const API_UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

export const AUTH_STORAGE_KEY = "skillbridge_auth";
export const AUTH_EXPIRED_EVENT = "skillbridge:auth-expired";

type HttpOptions = RequestInit & {
  skipAuth?: boolean;
  retries?: number;
  retryDelayMs?: number;
  validateResponse?: (payload: unknown, response: Response) => void;
};

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly traceId?: string;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;

    if (details && typeof details === "object") {
      if ("code" in details && details.code) this.code = String(details.code);
      if ("traceId" in details && details.traceId) {
        this.traceId = String(details.traceId);
      }
    }
  }
}

export async function httpClient<T>(
  endpoint: string,
  options: HttpOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const auth = getStoredAuth();

    if (auth?.token) {
      headers.set("Authorization", `Bearer ${auth.token}`);
    }
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  const maxRetries = Math.max(0, options.retries ?? 2);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);

  let response: Response;

  try {
    response = await fetchWithRetry(
      `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
      requestOptions,
      0,
      maxRetries,
      retryDelayMs,
    );
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.name === "AbortError") {
      throw caughtError;
    }

    throw new Error(
      caughtError instanceof Error
        ? "SkillBridge is temporarily unavailable. Please try again."
        : "Unable to reach the API.",
      { cause: caughtError },
    );
  }

  const data = await readResponse(response);

  if (options.validateResponse) {
    options.validateResponse(data, response);
  }

  if (!response.ok) {
    if (
      SESSION_LOST_STATUSES.has(response.status) &&
      !options.skipAuth
    ) {
      expireAuthSession();
    }

    throw new HttpError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  return data as T;
}

export async function httpDownload(endpoint: string) {
  const headers = new Headers();
  const auth = getStoredAuth();

  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
      { headers },
    );
  } catch (caughtError) {
    throw new Error(
      caughtError instanceof Error
        ? "SkillBridge is temporarily unavailable. Please try again."
        : "Unable to reach the API.",
      { cause: caughtError },
    );
  }

  if (!response.ok) {
    const data = await readResponse(response);

    if (SESSION_LOST_STATUSES.has(response.status)) {
      expireAuthSession();
    }

    throw new HttpError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  return {
    blob: await response.blob(),
    fileName: getDownloadFileName(response.headers.get("Content-Disposition")),
  };
}

function getPreferredStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getFallbackStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredRawAuth(): string | null {
  const preferred = getPreferredStorage();
  const fallback = getFallbackStorage();

  const preferredValue = preferred?.getItem(AUTH_STORAGE_KEY);
  if (preferredValue) {
    return preferredValue;
  }

  const fallbackValue = fallback?.getItem(AUTH_STORAGE_KEY);
  if (fallbackValue) {
    preferred?.setItem(AUTH_STORAGE_KEY, fallbackValue);
    fallback?.removeItem(AUTH_STORAGE_KEY);
    return fallbackValue;
  }

  return null;
}

export function saveAuth(auth: AuthResponse) {
  const payload = JSON.stringify(auth);
  const preferred = getPreferredStorage();
  const fallback = getFallbackStorage();

  if (preferred) {
    preferred.setItem(AUTH_STORAGE_KEY, payload);
  }

  if (fallback && fallback !== preferred) {
    fallback.removeItem(AUTH_STORAGE_KEY);
  }

  if (!preferred && fallback) {
    fallback.setItem(AUTH_STORAGE_KEY, payload);
  }
}

export function getStoredAuth(): AuthResponse | null {
  const raw = readStoredRawAuth();

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
  const preferred = getPreferredStorage();
  const fallback = getFallbackStorage();

  preferred?.removeItem(AUTH_STORAGE_KEY);
  fallback?.removeItem(AUTH_STORAGE_KEY);
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

async function fetchWithRetry(
  url: string,
  requestOptions: RequestInit,
  attempt: number,
  maxRetries: number,
  retryDelayMs: number,
): Promise<Response> {
  const signal = requestOptions.signal ?? undefined;
  const safeRequestOptions: RequestInit = {
    ...requestOptions,
    signal,
  };

  try {
    const response = await fetch(url, safeRequestOptions);

    if (shouldRetryResponse(response, attempt, maxRetries)) {
      await delayRetry(retryDelayMs, signal);
      return fetchWithRetry(url, safeRequestOptions, attempt + 1, maxRetries, retryDelayMs);
    }

    return response;
  } catch (caughtError) {
    if (shouldRetryError(caughtError, attempt, maxRetries, signal)) {
      await delayRetry(retryDelayMs, signal);
      return fetchWithRetry(url, safeRequestOptions, attempt + 1, maxRetries, retryDelayMs);
    }

    throw caughtError;
  }
}

function shouldRetryResponse(
  response: Response,
  attempt: number,
  maxRetries: number,
): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  return response.status === 408 || response.status === 429 ||
    response.status === 500 || response.status === 502 ||
    response.status === 503 || response.status === 504;
}

function shouldRetryError(
  caughtError: unknown,
  attempt: number,
  maxRetries: number,
  signal?: AbortSignal,
): boolean {
  if (signal?.aborted) {
    return false;
  }

  if (attempt >= maxRetries) {
    return false;
  }

  return (
    caughtError instanceof TypeError ||
    (caughtError instanceof Error && caughtError.name === "TimeoutError") ||
    (caughtError instanceof Error && caughtError.message.includes("fetch"))
  );
}

async function delayRetry(delayMs: number, signal?: AbortSignal) {
  if (delayMs <= 0) {
    return;
  }

  const currentSignal = signal;

  await new Promise<void>((resolve, reject) => {
    if (currentSignal?.aborted) {
      reject(currentSignal.reason ?? new DOMException("The operation was aborted.", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      currentSignal?.removeEventListener("abort", abortHandler);
      resolve();
    }, delayMs);

    const abortHandler = () => {
      window.clearTimeout(timeoutId);
      reject(currentSignal?.reason ?? new DOMException("The operation was aborted.", "AbortError"));
    };

    currentSignal?.addEventListener("abort", abortHandler, { once: true });
  });
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

function getDownloadFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return "skillbridge-download";
  }

  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (encodedName?.[1]) {
    return decodeURIComponent(encodedName[1]);
  }

  const plainName = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainName?.[1] ?? "skillbridge-download";
}

function getErrorMessage(data: unknown, status: number) {
  if (API_UNAVAILABLE_STATUSES.has(status)) {
    return "SkillBridge is temporarily unavailable. Please try again.";
  }

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
