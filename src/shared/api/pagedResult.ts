export type NormalizedPagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function normalizePagedResult<T>(
  value: unknown,
): NormalizedPagedResult<T> {
  if (Array.isArray(value)) {
    return {
      items: value as T[],
      page: 1,
      pageSize: value.length,
      totalCount: value.length,
      totalPages: 1,
    };
  }

  if (!value || typeof value !== "object") {
    return emptyPagedResult<T>();
  }

  const record = value as Record<string, unknown>;
  const items = Array.isArray(record.items) ? (record.items as T[]) : [];
  const page = positiveInteger(record.page, 1);
  const pageSize = positiveInteger(record.pageSize, items.length || 1);
  const totalCount = nonNegativeInteger(record.totalCount, items.length);
  const totalPages = positiveInteger(
    record.totalPages,
    Math.max(1, Math.ceil(totalCount / pageSize)),
  );

  return { items, page, pageSize, totalCount, totalPages };
}

function emptyPagedResult<T>(): NormalizedPagedResult<T> {
  return { items: [], page: 1, pageSize: 1, totalCount: 0, totalPages: 1 };
}

function positiveInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

function nonNegativeInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}
