import { describe, expect, it } from "vitest";
import { HttpError, getTokenExpiresAt, isTokenExpired } from "./httpClient";

function createToken(expiresAtSeconds?: number) {
  const payload =
    expiresAtSeconds === undefined ? {} : { exp: expiresAtSeconds };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `header.${encoded}.signature`;
}

describe("JWT session expiration", () => {
  it("reads the expiration time from a JWT", () => {
    expect(getTokenExpiresAt(createToken(2_000_000_000))).toBe(
      2_000_000_000_000,
    );
  });

  it("detects an expired JWT", () => {
    expect(isTokenExpired(createToken(100), 100_001)).toBe(true);
  });

  it("keeps a JWT active before its expiration", () => {
    expect(isTokenExpired(createToken(100), 99_999)).toBe(false);
  });

  it("lets the API validate tokens without an expiration claim", () => {
    expect(isTokenExpired(createToken(), 100_000)).toBe(false);
  });

  it("handles malformed tokens without throwing", () => {
    expect(getTokenExpiresAt("not-a-jwt")).toBeNull();
    expect(isTokenExpired("not-a-jwt")).toBe(false);
  });
});

describe("HttpError", () => {
  it("retains response metadata for endpoint compatibility decisions", () => {
    const error = new HttpError("Not found", 404, {
      code: "route_missing",
      traceId: "trace-123",
    });

    expect(error.status).toBe(404);
    expect(error.code).toBe("route_missing");
    expect(error.traceId).toBe("trace-123");
  });
});
