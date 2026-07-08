import { httpClient } from "../../../shared/api/httpClient";
import type {
  AuthResponse,
  AuthRole,
  LoginRequest,
  RegisterRequest,
} from "../domain/authTypes";
import { normalizeAuthRole } from "../domain/authTypes";

type RawAuthResponse = Omit<AuthResponse, "role"> & {
  role?: AuthRole | number | string;
  Role?: AuthRole | number | string;
};

export async function loginAsync(request: LoginRequest) {
  const response = await httpClient<RawAuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
    skipAuth: true,
  });

  return normalizeAuthResponse(response);
}

export async function registerAsync(request: RegisterRequest) {
  const response = await httpClient<RawAuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
    skipAuth: true,
  });

  return normalizeAuthResponse(response);
}

function normalizeAuthResponse(response: RawAuthResponse): AuthResponse {
  const rawRole = response.role ?? response.Role;
  const role = normalizeAuthRole(rawRole);

  if (!role) {
    throw new Error(
      `The API returned an unsupported account role: ${String(rawRole)}.`,
    );
  }

  return {
    ...response,
    role,
  };
}
