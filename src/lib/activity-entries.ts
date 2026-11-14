import type { Row, TableName } from "./models";
import { productRecordNoun } from "./product-records";
import { labelFor } from "./records";
import { serverRead } from "./server-table";

/*
 * What an activity feed says of the events it lists: the Portfolio's Recent activity and a
 * program's Activity. An event is one recorded change (activity_events); consecutive edits of one
 * requirement by one person are one entry, and every other event is its own, its title the person
 * and what they did. An event names its program, the one record of it the event is about, or both:
 * a publication of assessment results names the program and the campaign, so the program's
 * Activity lists it and the entry links to the campaign.
 */

/** The columns an activity entry draws: who did what, when, to which record, and what was said. */
export const ACTIVITY_COLUMNS = [
  "id",
  "occurred_at",
  "event_type",
  "actor_party_id",
  "program_id",
  "requirement_revision_id",
  "description",
  "changes",
  "task_id",
  "risk_id",
  "issue_id",
  "poam_item_id",
  "assessment_campaign_id",
  "package_id",
  "evidence_artifact_id",
] as const;

/** An activity event as an entry reads it. */
export type ActivityEvent = Pick<Row<"activity_events">, (typeof ACTIVITY_COLUMNS)[number]>;

/** How many of the workspace's latest events the Portfolio reads to make its handful of entries. */
export const RECENT_ACTIVITY_EVENTS = 50;

/**
 * The workspace's latest events, newest first, a page of `RECENT_ACTIVITY_EVENTS` with the columns
 * an entry draws. A write to a record whose changes are recorded marks it stale: a publication of
 * assessment results among them.
 */
export const recentActivityRead = serverRead({
  source: "activity_events",
  models: [
    "tasks",
    "risks",
    "risk_revisions",
    "operational_issues",
    "poam_items",
    "requirement_revisions",
    "evidence_artifacts",
    "assessment_campaigns",
    "assessment_results_revisions",
    "authorization_packages",
  ],
  columns: ACTIVITY_COLUMNS,
  order: [{ column: "occurred_at", ascending: false }],
});

/** The records an event may name, each by its own column. */
type EventTargets = Partial<
  Pick<
    ActivityEvent,
    | "task_id"
    | "risk_id"
    | "issue_id"
    | "poam_item_id"
    | "assessment_campaign_id"
    | "package_id"
    | "evidence_artifact_id"
  >
>;

/** The record an event names, when it has a page of its own. */
export function eventRecord(event: EventTargets): { table: TableName; id: string } | null {
  const targets: [TableName, string | null | undefined][] = [
    ["tasks", event.task_id],
    ["risks", event.risk_id],
    ["operational_issues", event.issue_id],
    ["poam_items", event.poam_item_id],
    ["assessment_campaigns", event.assessment_campaign_id],
    ["authorization_packages", event.package_id],
    ["evidence_artifacts", event.evidence_artifact_id],
  ];
  const found = targets.find(([, id]) => !!id);
  return found ? { table: found[0], id: found[1]! } : null;
}

/** A requirement edit's changed fields, in the reader's words. */
const changeLabels: Record<string, string> = {
  title: "title",
  statement: "statement",
  acceptanceCriteria: "acceptance criteria",
  rationale: "rationale",
  requirementType: "requirement type",
  ownerPartyId: "owner",
};

/** The fields a requirement edit changed, in the reader's words. */
export function changedFields(event: Pick<ActivityEvent, "changes">): string[] {
  const changes = event.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];
  return Object.entries(changes)
    .filter(([, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const change = value as Record<string, unknown>;
      return change["before"] !== change["after"];
    })
    .map(([field]) => changeLabels[field] ?? labelFor(field).toLowerCase());
}

/** The requirement an event's revision belongs to, when the reader can name it. */
export type EntryRequirement = { id: string; code: string; programId: string | null };

/** An entry: one event, or consecutive edits of one requirement by one person, newest first. */
export type ActivityEntry = {
  events: ActivityEvent[];
  actor: string | null;
  requirement: EntryRequirement | null;
};

/**
 * The entries of events, newest first: a requirement's creation is its own entry, and consecutive
 * edits of one requirement by one person share one. `limit` stops at that many entries.
 */
export function activityEntries(
  events: readonly ActivityEvent[],
  requirementOf: (revisionId: string) => EntryRequirement | undefined,
  limit = Number.POSITIVE_INFINITY,
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const newest = [...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  for (const event of newest) {
    const requirement = event.requirement_revision_id
      ? (requirementOf(event.requirement_revision_id) ?? null)
      : null;
    const previous = entries.at(-1);
    if (
      requirement &&
      event.event_type !== "created" &&
      previous?.requirement?.id === requirement.id &&
      previous.actor === event.actor_party_id
    )
      previous.events.push(event);
    else if (entries.length < limit)
      entries.push({ events: [event], actor: event.actor_party_id, requirement });
    else break;
  }
  return entries;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** A noun with its indefinite article: "a task", "an operational issue". */
const withArticle = (noun: string) => `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;

/**
 * What an event that is not a requirement's says: the deed after the person who did it, and what
 * was said, if anything. A recorded verb phrase ("assigned …", "published assessment results of
 * Continuous monitoring FY2027") is the deed, and the lines after it what was said ("Interim
 * results: 20 findings."). A line that names a record by its code before what changed in it
 * ("X800-C-CUSB: took version 2 of X800 Missile.") is the event's kind of that record ("updated
 * X800-C-CUSB") over what changed ("Took version 2 of X800 Missile."), never the bare kind. Any
 * other text is what was said, under the kind of event and the kind of record it names ("updated a
 * task"), so the title still says who did what to what.
 */
export function eventWords(
  event: Pick<ActivityEvent, "event_type" | "description"> & EventTargets,
): { deed: string; said: string | undefined } {
  const [first = "", ...rest] = (event.description ?? "").split("\n");
  const line = first.trim();
  const after = rest.join(" ").trim();
  if (/^[a-z]/.test(line)) return { deed: line, said: after || undefined };
  const kind = labelFor(event.event_type).toLowerCase();
  const coded = /^([A-Z0-9][\w.-]*): ([a-z].*)$/.exec(line);
  if (coded)
    return {
      deed: `${kind} ${coded[1]}`,
      said: [capitalize(coded[2]!), after].filter(Boolean).join(" "),
    };
  const record = eventRecord(event);
  return {
    deed: record ? `${kind} ${withArticle(productRecordNoun(record.table))}` : kind,
    said: [line, after].filter(Boolean).join(" ") || undefined,
  };
}
