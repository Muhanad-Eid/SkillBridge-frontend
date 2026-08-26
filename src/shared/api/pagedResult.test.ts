import { describe, expect, it } from "vitest";
import { normalizePagedResult } from "./pagedResult";

describe("normalizePagedResult", () => {
  it("preserves a valid paged response", () => {
    expect(
      normalizePagedResult<number>({
        items: [1, 2],
        page: 2,
        pageSize: 2,
        totalCount: 5,
        totalPages: 3,
      }),
    ).toEqual({
      items: [1, 2],
      page: 2,
      pageSize: 2,
      totalCount: 5,
      totalPages: 3,
    });
  });

  it("adapts a legacy array response without crashing pages", () => {
    expect(normalizePagedResult<number>([1, 2])).toEqual({
      items: [1, 2],
      page: 1,
      pageSize: 2,
      totalCount: 2,
      totalPages: 1,
    });
  });

  it("returns an empty result for malformed payloads", () => {
    expect(normalizePagedResult<number>({ items: null })).toEqual({
      items: [],
      page: 1,
      pageSize: 1,
      totalCount: 0,
      totalPages: 1,
    });
  });
});
