import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** SPEC §11: amounts are NGN, stored as a plain number. */
const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return NGN.format(amount);
}

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** e.g. "13 Jul 2026" */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy") : "—";
}

/** e.g. "13 Jul 2026, 09:00" — the absolute timestamp for audit entries. */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy, HH:mm") : "—";
}

/** e.g. "3 days ago" — shown beside the absolute timestamp, never instead of it. */
export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  return date ? `${formatDistanceToNow(date)} ago` : "";
}

/** For the date input's `value` / `max` attributes. */
export function toDateInputValue(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "Chidi Nwosu" -> "CN" */
export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Turns SNAKE_CASE enum values into "Snake case" for anything without a label map. */
export function humanizeEnum(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
