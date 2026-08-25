import { httpClient } from "../../../shared/api/httpClient";
import type {
  AuthResponse,
  AuthRole,
  AuthMessageResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
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

export function changePasswordAsync(request: ChangePasswordRequest) {
  return httpClient<void>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function logoutAsync() {
  return httpClient<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function forgotPasswordAsync(request: ForgotPasswordRequest) {
  return httpClient<AuthMessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(request),
    skipAuth: true,
  });
}

export function resetPasswordAsync(request: ResetPasswordRequest) {
  return httpClient<AuthMessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(request),
    skipAuth: true,
  });
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
