import type { Tone } from "@ledger/design-system";

export function displayDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  // Date-only values should not shift to the preceding day in western time zones.
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
export function statusTone(value: string): Tone {
  if (["done", "completed", "accepted", "met", "published", "satisfied"].includes(value))
    return "success";
  if (["blocked", "rejected", "not_met", "other_than_satisfied"].includes(value)) return "danger";
  if (["waiting", "needs_revision", "in_progress", "active", "partially_satisfied"].includes(value))
    return "warning";
  return "neutral";
}
