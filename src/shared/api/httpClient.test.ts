import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError, httpClient, getTokenExpiresAt, isTokenExpired } from "./httpClient";

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

describe("httpClient request reliability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries transient server failures before succeeding", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "temporary outage" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await httpClient<{ ok: boolean }>("/api/test", {
      retries: 1,
      retryDelayMs: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it("surfaces a user cancellation when the request is aborted", async () => {
    const controller = new AbortController();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      controller.abort();
      return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
    });

    await expect(
      httpClient("/api/test", {
        signal: controller.signal,
        retries: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow("The operation was aborted.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
