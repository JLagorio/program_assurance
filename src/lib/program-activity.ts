/**
 * A single activity stream for a program, composed from the records that
 * already exist. Every entry carries a real timestamp so the timeline can
 * group chronologically, filter by date range, and track read state.
 */

import { gatesForProgram, programTimeline, type Program } from "@/lib/grc-data";
import { poamItems } from "@/lib/register";
import { personById, workstreamsForProgram } from "@/lib/people";
import { parseGateDate } from "@/lib/program-stage";
import type { Tone } from "@/ds/primitives";

export const activityKinds = ["Assessment", "POA&M", "Gates", "Workstreams"] as const;
export type ActivityKind = (typeof activityKinds)[number];

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  tone: Tone;
  title: string;
  actor: string;
  /** Human label kept from the source record (e.g. "Aug 27, 2026"). */
  when: string;
  /** Epoch ms, the single source of truth for ordering and grouping. */
  at: number;
  /** Extra lines shown in the activity detail drawer. */
  details?: { label: string; value: string }[];
  /** Optional deep link to the record the event is about. */
  to?: string;
  params?: Record<string, string>;
};

const gateTone: Record<string, Tone> = {
  Blocked: "danger",
  "At risk": "warning",
  "In progress": "info",
  Complete: "success",
  Planned: "neutral",
};

const monthIndex: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** "Aug 27, 10:12" — a same-year timestamped entry. */
function parseShortStamp(value: string, year: number): number | null {
  const m = /^([A-Z][a-z]{2})\s(\d{1,2}),\s(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const month = monthIndex[m[1]!];
  if (month === undefined) return null;
  return Date.UTC(year, month, Number(m[2]), Number(m[3]), Number(m[4]));
}

function timestamp(value: string, fallback: number): number {
  const full = parseGateDate(value);
  if (full) return full.getTime();
  const short = parseShortStamp(value, new Date().getUTCFullYear());
  return short ?? fallback;
}

export function programActivity(program: Program, now = Date.now()): ActivityEvent[] {
  const out: ActivityEvent[] = [];

  programTimeline.forEach((e, i) => {
    out.push({
      id: `tl-${i}`,
      kind: "Assessment",
      tone: e.tone,
      title: e.title,
      actor: e.actor,
      when: e.time,
      at: timestamp(e.time, now - i * 86_400_000),
      details: [{ label: "Source", value: "Assessment log" }],
    });
  });

  for (const g of gatesForProgram(program.id)) {
    out.push({
      id: `gate-${g.id}`,
      kind: "Gates",
      tone: gateTone[g.status] ?? "neutral",
      title: `${g.id} ${g.name} — ${g.status.toLowerCase()}${
        g.artifact && g.artifact !== "—" ? ` · ${g.artifact}` : ""
      }`,
      actor: g.owner ?? program.owner,
      when: g.planned,
      at: timestamp(g.planned, now),
      details: [
        { label: "Gate", value: `${g.id} ${g.name}` },
        { label: "Status", value: g.status },
        { label: "Planned", value: g.planned },
        { label: "Artifact", value: g.artifact ?? "—" },
      ],
    });
  }

  for (const p of poamItems.filter((x) => x.program === program.id)) {
    out.push({
      id: `poam-${p.id}`,
      kind: "POA&M",
      tone: p.status === "Completed" ? "success" : "warning",
      title: `${p.id} ${p.title} — ${p.status.toLowerCase()}`,
      actor: p.owner,
      when: p.scheduledCompletion,
      at: timestamp(p.scheduledCompletion, now),
      details: [
        { label: "Item", value: p.id },
        { label: "Status", value: p.status },
        { label: "Owner", value: p.owner },
        { label: "Scheduled completion", value: p.scheduledCompletion },
      ],
      to: "/register/poam/$poamId",
      params: { poamId: p.id },
    });
  }

  for (const w of workstreamsForProgram(program.id)) {
    const lead = personById.get(w.lead)?.name ?? w.lead;
    out.push({
      id: `ws-${w.id}`,
      kind: "Workstreams",
      tone: w.status === "Blocked" ? "danger" : w.status === "Done" ? "success" : "info",
      title: `${w.id} ${w.title} — ${w.status.toLowerCase()}`,
      actor: lead,
      when: w.due,
      at: timestamp(w.due, now),
      details: [
        { label: "Workstream", value: w.id },
        { label: "Status", value: w.status },
        { label: "Lead", value: lead },
        { label: "Due", value: w.due },
      ],
      to: "/workstreams/$workstreamId",
      params: { workstreamId: w.id },
    });
  }

  return out.sort((a, b) => b.at - a.at);
}

export function activityCounts(events: ActivityEvent[]): Record<string, number> {
  const counts: Record<string, number> = { All: events.length };
  for (const k of activityKinds) counts[k] = events.filter((e) => e.kind === k).length;
  return counts;
}

export function activityActors(events: ActivityEvent[]): string[] {
  return [...new Set(events.map((e) => e.actor))].sort((a, b) => a.localeCompare(b));
}

/* ------------------------------------------------------ chronology helpers */

export const dateRanges = [
  "All time",
  "Last 7 days",
  "Last 30 days",
  "This quarter",
  "Upcoming",
] as const;
export type DateRange = (typeof dateRanges)[number];

export function inRange(at: number, range: DateRange, now = Date.now()): boolean {
  const day = 86_400_000;
  switch (range) {
    case "Last 7 days":
      return at <= now && at >= now - 7 * day;
    case "Last 30 days":
      return at <= now && at >= now - 30 * day;
    case "This quarter":
      return at <= now && at >= now - 92 * day;
    case "Upcoming":
      return at > now;
    default:
      return true;
  }
}

const dayFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function absoluteStamp(at: number): string {
  return `${dayFmt.format(at)} · ${timeFmt.format(at)} UTC`;
}

export function relativeStamp(at: number, now = Date.now()): string {
  const diff = now - at;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const hr = Math.round(abs / 3_600_000);
  const d = Math.round(abs / 86_400_000);
  const label =
    min < 1
      ? "now"
      : min < 60
        ? `${min}m`
        : hr < 24
          ? `${hr}h`
          : d < 30
            ? `${d}d`
            : `${Math.round(d / 30)}mo`;
  if (label === "now") return "just now";
  return diff >= 0 ? `${label} ago` : `in ${label}`;
}

function startOfUtcDay(ms: number) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Chronological buckets, newest first: Upcoming → Today → … → month names. */
export function groupActivity(
  events: ActivityEvent[],
  now = Date.now(),
): { key: string; label: string; items: ActivityEvent[] }[] {
  const today = startOfUtcDay(now);
  const day = 86_400_000;
  const groups = new Map<string, { key: string; label: string; items: ActivityEvent[] }>();

  const bucket = (at: number) => {
    const d = startOfUtcDay(at);
    if (d > today) return { key: "upcoming", label: "Upcoming" };
    if (d === today) return { key: "today", label: "Today" };
    if (d === today - day) return { key: "yesterday", label: "Yesterday" };
    if (d > today - 7 * day) return { key: "week", label: "Earlier this week" };
    if (d > today - 30 * day) return { key: "month", label: "Earlier this month" };
    const label = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(at);
    return { key: label, label };
  };

  for (const e of events) {
    const b = bucket(e.at);
    const existing = groups.get(b.key);
    if (existing) existing.items.push(e);
    else groups.set(b.key, { ...b, items: [e] });
  }
  return [...groups.values()];
}
