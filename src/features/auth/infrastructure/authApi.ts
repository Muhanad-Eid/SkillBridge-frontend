import { httpClient } from "../../../shared/api/httpClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../domain/authTypes";

export function loginAsync(request: LoginRequest) {
  return httpClient<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
    skipAuth: true,
  });
}

export function registerAsync(request: RegisterRequest) {
  return httpClient<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
    skipAuth: true,
  });
}
