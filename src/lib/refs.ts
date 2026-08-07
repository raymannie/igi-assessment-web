import type { Ref } from "@/types";

/**
 * Mongo references arrive either populated or as a bare id string, depending on
 * the endpoint. These two helpers keep that branch out of components.
 */

/** The id of a reference, populated or not. */
export function refId<T extends { _id: string }>(ref: Ref<T>): string;
export function refId<T extends { _id: string }>(
  ref: Ref<T> | null | undefined
): string | null;
export function refId<T extends { _id: string }>(
  ref: Ref<T> | null | undefined
): string | null {
  if (ref == null) return null;
  return typeof ref === "string" ? ref : ref._id;
}

/** The populated document, or `null` when the backend only sent an id. */
export function deref<T extends { _id: string }>(
  ref: Ref<T> | null | undefined
): T | null {
  if (ref == null || typeof ref === "string") return null;
  return ref;
}

/** True when `ref` points at `id`, whether populated or not. */
export function refIs<T extends { _id: string }>(
  ref: Ref<T> | null | undefined,
  id: string | null | undefined
): boolean {
  if (!id) return false;
  return refId(ref) === id;
}
