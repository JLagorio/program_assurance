/**
 * One log for every record.
 *
 * Every mutation in the product is an entry here: a note, a comment, a task
 * asked and closed, a request to a person, a link to evidence, a field changed,
 * a stage moved, an owner taken. A record's feed is the log filtered by its
 * subject; a person's queue is the log filtered by their mentions; a program's
 * Activity tab is the log filtered by program. Nothing is edited or removed:
 * the trail is how "two weeks later" is answered.
 *
 * Mentions are written `@[Full Name]` in a body, the way the product's Composer
 * writes them, and parsed with the product's `parseMentions`.
 */
import { useSyncExternalStore } from "react";

import { parseMentions } from "@/lib/mentions";
import { datasetNow } from "@/lib/dataset-clock";

export type SubjectKind =
  | "program"
  | "node"
  | "control"
  | "requirement"
  | "task"
  | "evidence"
  | "finding"
  | "scope"
  | "person";

/** What an entry is about: the record it sits on. */
export type Subject = {
  kind: SubjectKind;
  id: string;
  /** How the record reads beside its id: "Account management". */
  label?: string | undefined;
};

export type ActivityKind =
  | "note"
  | "comment"
  | "task"
  | "request"
  | "link"
  | "change"
  | "stage"
  | "assign"
  | "done"
  | "created";

export type ActivityEntry = {
  id: string; // ACT-
  /** ISO stamp. */
  at: string;
  program: string | null;
  /** Who did it, by full name; "System" when the platform did. */
  actor: string;
  kind: ActivityKind;
  /** The sentence after the name, past tense: "asked Joel Barrantes for the account review procedure". */
  summary: string;
  /** What was said or sent, mentions as `@[Full Name]`. */
  body?: string | undefined;
  subject: Subject;
  /** A second record the entry touches: the task a request opened, the evidence a link points at. */
  about?: Subject | undefined;
  mentions: string[];
  field?: string | undefined;
  before?: string | undefined;
  after?: string | undefined;
};

/* ------------------------------------------------------------------ Clock */

const booted = Date.now();

/** Now, on the dataset's clock: the seeded day plus the time this session has run. */
export function clockNow(): Date {
  return new Date(datasetNow.getTime() + (Date.now() - booted));
}

/* ------------------------------------------------------------------ Store */

const entries: ActivityEntry[] = [];
const listeners = new Set<() => void>();
let version = 0;
let seq = 0;

function bump() {
  version += 1;
  for (const cb of listeners) cb();
}

export function subscribeActivity(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useActivityVersion(): number {
  return useSyncExternalStore(
    subscribeActivity,
    () => version,
    () => version,
  );
}

export type RecordInput = Omit<ActivityEntry, "id" | "at" | "mentions"> & {
  at?: string | undefined;
  mentions?: string[] | undefined;
};

/** Append one entry. The mentions are parsed from the body unless given. */
export function record(input: RecordInput): ActivityEntry {
  seq += 1;
  const entry: ActivityEntry = {
    ...input,
    id: `ACT-${String(seq).padStart(4, "0")}`,
    at: input.at ?? clockNow().toISOString(),
    mentions: input.mentions ?? (input.body ? parseMentions(input.body) : []),
  };
  entries.push(entry);
  bump();
  return entry;
}

export function subjectKey(s: Pick<Subject, "kind" | "id">): string {
  return `${s.kind}:${s.id}`;
}

function newestFirst(a: ActivityEntry, b: ActivityEntry) {
  return a.at < b.at ? 1 : a.at > b.at ? -1 : b.id.localeCompare(a.id);
}

/** The record's feed, newest first: entries on it, and entries that are about it. */
export function activityFor(subject: Pick<Subject, "kind" | "id">): ActivityEntry[] {
  const key = subjectKey(subject);
  return entries
    .filter((e) => subjectKey(e.subject) === key || (e.about && subjectKey(e.about) === key))
    .sort(newestFirst);
}

export function activityForProgram(programId: string): ActivityEntry[] {
  return entries.filter((e) => e.program === programId).sort(newestFirst);
}

export function activityByActor(name: string): ActivityEntry[] {
  return entries.filter((e) => e.actor === name).sort(newestFirst);
}

/** Entries that call the person out by name, newest first. */
export function mentionsOf(name: string): ActivityEntry[] {
  return entries.filter((e) => e.mentions.includes(name) && e.actor !== name).sort(newestFirst);
}

export function allActivity(): ActivityEntry[] {
  return entries.slice().sort(newestFirst);
}

/* ------------------------------------------------------------- Formatting */

const dayMs = 86_400_000;

function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "just now", "12m ago", "2h ago", "yesterday", "Wed", "27 Aug", "27 Aug 2025". */
export function relativeTime(iso: string, now: Date = clockNow()): string {
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < dayMs && startOfDay(then) === startOfDay(now))
    return `${Math.floor(diff / 3_600_000)}h ago`;
  const daysBetween = Math.round((startOfDay(now) - startOfDay(then)) / dayMs);
  if (daysBetween === 1) return "yesterday";
  if (daysBetween < 7) return days[then.getUTCDay()]!;
  if (then.getUTCFullYear() === now.getUTCFullYear())
    return `${then.getUTCDate()} ${months[then.getUTCMonth()]}`;
  return `${then.getUTCDate()} ${months[then.getUTCMonth()]} ${then.getUTCFullYear()}`;
}

/** "2026-08-30 10:04", the tooltip behind a relative time. */
export function fullStamp(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${hh}:${mm}`;
}

/** Today · Yesterday · This week · then the month, as the reader would group them. */
export function groupByWhen<T extends { at: string }>(
  items: T[],
  now: Date = clockNow(),
): { label: string; items: T[] }[] {
  const today = startOfDay(now);
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const then = new Date(item.at);
    const d = Math.round((today - startOfDay(then)) / dayMs);
    const label =
      d <= 0
        ? "Today"
        : d === 1
          ? "Yesterday"
          : d < 7
            ? "This week"
            : then.getUTCFullYear() === now.getUTCFullYear()
              ? `${months[then.getUTCMonth()]}`
              : `${months[then.getUTCMonth()]} ${then.getUTCFullYear()}`;
    const list = groups.get(label) ?? [];
    list.push(item);
    groups.set(label, list);
  }
  return [...groups].map(([label, list]) => ({ label, items: list }));
}

/** "Aug 27, 2026" (the dataset's own stamps) to an ISO stamp at nine in the morning. */
export function isoFromDatasetDate(value: string, hour = 9, minute = 0): string {
  const t = Date.parse(`${value} UTC`);
  const d = Number.isNaN(t) ? datasetNow : new Date(t);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute),
  ).toISOString();
}
