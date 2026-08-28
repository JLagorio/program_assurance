import type { Milestone, OscalProp, PoamItem } from "@/lib/grc-data";

/** Signed-in operator recorded as the actor on every POA&M mutation. */
export const currentUser = {
  name: "Grace Hoppel",
  email: "grace.hoppel@equinox.gov",
  role: "ISSO",
};

export type AuditAction = "Created" | "Updated" | "Deleted";

export type FieldChange = {
  /** OSCAL field path, e.g. "scheduled-completion" or "milestone[M-2].status" */
  field: string;
  from: string;
  to: string;
};

export type AuditEntry = {
  uuid: string;
  /** date-time-with-timezone */
  timestamp: string;
  action: AuditAction;
  actor: string;
  actorRole: string;
  /** POA&M item the event belongs to */
  itemUuid: string;
  poamId: string;
  itemTitle: string;
  changes: FieldChange[];
};

export function auditUuid() {
  const hex = "0123456789abcdef";
  const pick = (n: number) =>
    Array.from({ length: n }, () => hex[Math.floor(Math.random() * 16)]).join("");
  return `${pick(8)}-${pick(4)}-4${pick(3)}-a${pick(3)}-${pick(12)}`;
}

const labels: Record<string, string> = {
  title: "title",
  description: "description",
  remarks: "remarks",
  status: "status",
  severity: "severity",
  controls: "props[control]",
  pointOfContact: "responsible-party",
  detectionSource: "props[detection-source]",
  scheduledCompletion: "scheduled-completion",
};

const short = (v: string) => (v.length > 72 ? `${v.slice(0, 71)}…` : v);
const milestoneKey = (m: Milestone) => m.id || m.uuid;
const propKey = (p: OscalProp) => (p.class ? `${p.name}:${p.class}` : p.name);

export function diffPoamItems(prev: PoamItem, next: PoamItem): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const key of Object.keys(labels) as (keyof PoamItem)[]) {
    const a = prev[key];
    const b = next[key];
    const from = Array.isArray(a) ? a.join(", ") : String(a ?? "");
    const to = Array.isArray(b) ? b.join(", ") : String(b ?? "");
    if (from !== to) changes.push({ field: labels[key as string]!, from: short(from), to: short(to) });
  }

  // milestones
  const prevM = new Map(prev.milestones.map((m) => [milestoneKey(m), m]));
  const nextM = new Map(next.milestones.map((m) => [milestoneKey(m), m]));
  for (const [key, m] of nextM) {
    const before = prevM.get(key);
    if (!before) {
      changes.push({ field: `milestone[${key}]`, from: "—", to: `added · ${short(m.title)}` });
      continue;
    }
    if (before.title !== m.title)
      changes.push({ field: `milestone[${key}].title`, from: short(before.title), to: short(m.title) });
    if (before.status !== m.status)
      changes.push({ field: `milestone[${key}].status`, from: before.status, to: m.status });
    if (before.targetDate !== m.targetDate)
      changes.push({
        field: `milestone[${key}].target-date`,
        from: before.targetDate,
        to: m.targetDate,
      });
  }
  for (const [key, m] of prevM) {
    if (!nextM.has(key))
      changes.push({ field: `milestone[${key}]`, from: short(m.title), to: "removed" });
  }

  // props
  const prevP = new Map(prev.props.map((p) => [propKey(p), p.value]));
  const nextP = new Map(next.props.map((p) => [propKey(p), p.value]));
  for (const [key, value] of nextP) {
    const before = prevP.get(key);
    if (before === undefined) changes.push({ field: `prop[${key}]`, from: "—", to: short(value) });
    else if (before !== value)
      changes.push({ field: `prop[${key}]`, from: short(before), to: short(value) });
  }
  for (const [key, value] of prevP) {
    if (!nextP.has(key)) changes.push({ field: `prop[${key}]`, from: short(value), to: "removed" });
  }

  return changes;
}

export function makeAuditEntry(
  action: AuditAction,
  item: PoamItem,
  changes: FieldChange[],
  timestamp: string,
): AuditEntry {
  return {
    uuid: auditUuid(),
    timestamp,
    action,
    actor: currentUser.name,
    actorRole: currentUser.role,
    itemUuid: item.uuid,
    poamId: item.poamId,
    itemTitle: item.title,
    changes,
  };
}
