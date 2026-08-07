import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { NormalizedApiError } from "@/types";

/**
 * A `VALIDATION_ERROR` from the backend carries per-field detail. SPEC.md §6 does
 * not fix the shape of `details`, so this tolerates the common ones and returns
 * the fields it understood — anything it can't read stays a toast.
 */
function readDetail(
  detail: unknown
): { field: string; message: string } | null {
  if (typeof detail !== "object" || detail === null) return null;

  const record = detail as Record<string, unknown>;
  const rawField = record.field ?? record.property ?? record.path;

  const field = Array.isArray(rawField)
    ? rawField.filter((part) => typeof part === "string").join(".")
    : typeof rawField === "string"
      ? rawField
      : null;
  if (!field) return null;

  const rawMessage =
    record.message ??
    (Array.isArray(record.constraints) ? record.constraints[0] : undefined) ??
    (Array.isArray(record.messages) ? record.messages[0] : undefined);

  const message =
    typeof rawMessage === "string"
      ? rawMessage
      : record.constraints && typeof record.constraints === "object"
        ? Object.values(record.constraints as Record<string, unknown>).find(
            (value): value is string => typeof value === "string"
          )
        : undefined;

  return message ? { field, message } : null;
}

/**
 * Applies server field errors to the form. Returns true when at least one landed,
 * so the caller can skip the toast and let the inline errors speak.
 */
export function applyServerFieldErrors<TValues extends FieldValues>(
  error: NormalizedApiError,
  setError: UseFormSetError<TValues>,
  knownFields: readonly Path<TValues>[]
): boolean {
  if (error.code !== "VALIDATION_ERROR") return false;

  let applied = false;

  for (const detail of error.details) {
    const parsed = readDetail(detail);
    if (!parsed) continue;

    const field = knownFields.find((known) => known === parsed.field);
    if (!field) continue;

    setError(field, { type: "server", message: parsed.message });
    applied = true;
  }

  return applied;
}

/** Type guard for the error RTK Query hands back after normalisation. */
export function isNormalizedApiError(
  error: unknown
): error is NormalizedApiError {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    Array.isArray(candidate.details)
  );
}

/**
 * A query hook's `error` is `NormalizedApiError | SerializedError` — the latter
 * appears when something throws inside the query lifecycle rather than coming
 * back from the API. Collapses both into one displayable shape.
 */
export function toDisplayError(error: unknown): NormalizedApiError | undefined {
  if (error === undefined || error === null) return undefined;
  if (isNormalizedApiError(error)) return error;

  if (typeof error === "object") {
    const candidate = error as { message?: unknown; code?: unknown };
    return {
      code: typeof candidate.code === "string" ? candidate.code : "UNKNOWN",
      message:
        typeof candidate.message === "string"
          ? candidate.message
          : "Something went wrong. Please try again.",
      details: [],
    };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong. Please try again.",
    details: [],
  };
}
