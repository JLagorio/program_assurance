/**
 * Tasks: the atom of the work.
 *
 * A task is a verb and an object, a name and a date, asked on a record. It is
 * listed on that record, in the assignee's queue and on the program. It closes
 * by hand, or by artifact when it was born from a control's gate: the gate is
 * met, so the task is done, and the log says so.
 *
 * A request is a task that waits on someone, usually a person who never opens
 * the platform. It stays Waiting until the asker logs what came back.
 */
import { useSyncExternalStore } from "react";

import { clockNow, isoFromDatasetDate, record, type Subject } from "@/lib/activity";

export type TaskState = "Open" | "Waiting" | "Done" | "Blocked";

export type TaskGate = { scope: string; control: string; key: string };

export type Task = {
  id: string; // TSK-
  program: string;
  /** The ask, as a verb and an object. */
  title: string;
  subject: Subject;
  assignee: string;
  requester: string;
  /** ISO date, or null when undated. */
  due: string | null;
  state: TaskState;
  /** Who it waits on, when Waiting. */
  waitingOn: string | null;
  note: string;
  createdAt: string;
  doneAt: string | null;
  /** The control gate that closes it, when it was born from one. */
  gate: TaskGate | null;
};

const tasks: Task[] = [];
const listeners = new Set<() => void>();
let version = 0;
let seq = 0;

function bump() {
  version += 1;
  for (const cb of listeners) cb();
}

export function useTasksVersion(): number {
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}

export type CreateTaskInput = {
  program: string;
  title: string;
  subject: Subject;
  assignee: string;
  requester: string;
  due?: string | null | undefined;
  note?: string | undefined;
  waitingOn?: string | null | undefined;
  gate?: TaskGate | null | undefined;
  /** Log the act. A request logs its own entry and passes false. */
  log?: boolean | undefined;
  createdAt?: string | undefined;
};

export function createTask(input: CreateTaskInput): Task {
  seq += 1;
  const task: Task = {
    id: `TSK-${String(seq).padStart(4, "0")}`,
    program: input.program,
    title: input.title.trim(),
    subject: input.subject,
    assignee: input.assignee,
    requester: input.requester,
    due: input.due ?? null,
    state: input.waitingOn ? "Waiting" : "Open",
    waitingOn: input.waitingOn ?? null,
    note: input.note?.trim() ?? "",
    createdAt: input.createdAt ?? clockNow().toISOString(),
    doneAt: null,
    gate: input.gate ?? null,
  };
  tasks.push(task);
  if (input.log !== false) {
    record({
      at: task.createdAt,
      program: task.program,
      actor: task.requester,
      kind: "task",
      summary:
        task.assignee === task.requester
          ? `added the task "${task.title}"`
          : `assigned "${task.title}" to ${task.assignee}`,
      body: task.note || undefined,
      subject: task.subject,
      about: { kind: "task", id: task.id, label: task.title },
    });
  }
  bump();
  return task;
}

export function taskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function completeTask(id: string, actor: string, reason?: string) {
  const t = taskById(id);
  if (!t || t.state === "Done") return;
  t.state = "Done";
  t.doneAt = clockNow().toISOString();
  record({
    program: t.program,
    actor,
    kind: "done",
    summary: reason ? `closed "${t.title}": ${reason}` : `closed "${t.title}"`,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
  });
  bump();
}

export function reopenTask(id: string, actor: string) {
  const t = taskById(id);
  if (!t || t.state !== "Done") return;
  t.state = t.waitingOn ? "Waiting" : "Open";
  t.doneAt = null;
  record({
    program: t.program,
    actor,
    kind: "change",
    summary: `reopened "${t.title}"`,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
  });
  bump();
}

export function setTaskState(
  id: string,
  state: TaskState,
  actor: string,
  waitingOn?: string | null,
) {
  const t = taskById(id);
  if (!t) return;
  if (state === "Done") return completeTask(id, actor);
  const before = t.state === "Waiting" && t.waitingOn ? `Waiting on ${t.waitingOn}` : t.state;
  t.state = state;
  t.waitingOn = state === "Waiting" ? (waitingOn ?? t.waitingOn) : null;
  t.doneAt = null;
  const after = t.state === "Waiting" && t.waitingOn ? `Waiting on ${t.waitingOn}` : t.state;
  record({
    program: t.program,
    actor,
    kind: "change",
    summary: `marked "${t.title}" ${after.toLowerCase()}`,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
    field: "state",
    before,
    after,
  });
  bump();
}

export function reassignTask(id: string, assignee: string, actor: string) {
  const t = taskById(id);
  if (!t || t.assignee === assignee) return;
  const before = t.assignee;
  t.assignee = assignee;
  record({
    program: t.program,
    actor,
    kind: "assign",
    summary: `reassigned "${t.title}" from ${before} to ${assignee}`,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
    field: "assignee",
    before,
    after: assignee,
  });
  bump();
}

export function setTaskDue(id: string, due: string | null, actor: string) {
  const t = taskById(id);
  if (!t || t.due === due) return;
  const before = t.due ?? "undated";
  t.due = due;
  record({
    program: t.program,
    actor,
    kind: "change",
    summary: `moved "${t.title}" to ${due ?? "undated"}`,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
    field: "due",
    before,
    after: due ?? "undated",
  });
  bump();
}

/* ---------------------------------------------------------------- Queries */

const stateOrder: Record<TaskState, number> = { Open: 0, Waiting: 1, Blocked: 2, Done: 3 };

/** Open first, then waiting, blocked, done; within a state the soonest due first, undated last. */
export function sortTasks(list: Task[]): Task[] {
  return list.slice().sort((a, b) => {
    const s = stateOrder[a.state] - stateOrder[b.state];
    if (s) return s;
    if (a.state === "Done") return (b.doneAt ?? "") < (a.doneAt ?? "") ? -1 : 1;
    if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    if (a.due) return -1;
    if (b.due) return 1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}

export function tasksFor(subject: Pick<Subject, "kind" | "id">): Task[] {
  return sortTasks(
    tasks.filter((t) => t.subject.kind === subject.kind && t.subject.id === subject.id),
  );
}

export function tasksForProgram(programId: string): Task[] {
  return sortTasks(tasks.filter((t) => t.program === programId));
}

export function tasksAssignedTo(name: string): Task[] {
  return sortTasks(tasks.filter((t) => t.assignee === name));
}

/** What the person asked of others and is still waiting for. */
export function tasksWaitingOn(name: string): Task[] {
  return sortTasks(
    tasks.filter((t) => t.requester === name && t.assignee !== name && t.state !== "Done"),
  );
}

export function openTasks(list: Task[]): Task[] {
  return list.filter((t) => t.state !== "Done");
}

export function isOverdue(task: Task, now: Date = clockNow()): boolean {
  if (!task.due || task.state === "Done") return false;
  return task.due < now.toISOString().slice(0, 10);
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Today", "Tomorrow", "Fri 4 Sep", "3d overdue", "Done Aug 27". */
export function dueLabel(task: Task, now: Date = clockNow()): string | null {
  if (task.state === "Done") {
    if (!task.doneAt) return null;
    const d = new Date(task.doneAt);
    return `Done ${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;
  }
  if (!task.due) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [y, m, d] = task.due.split("-").map(Number);
  const due = Date.UTC(y!, m! - 1, d!);
  const days = Math.round((due - today) / 86_400_000);
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  const date = new Date(due);
  if (days < 7)
    return `${dayNames[date.getUTCDay()]} ${date.getUTCDate()} ${monthNames[date.getUTCMonth()]}`;
  return `${date.getUTCDate()} ${monthNames[date.getUTCMonth()]}`;
}

/* --------------------------------------------------------- Gates and asks */

const gateAsks: Record<string, string> = {
  owner: "Take ownership",
  narrative: "Write the implementation statement",
  contributor: "Map a requirement to this control",
  evidence: "Link evidence",
  determination: "Record a determination",
};

/** The imperative ask behind an unmet gate. */
export function askFor(gateKey: string): string {
  return gateAsks[gateKey] ?? "Resolve the gate";
}

/** Open tasks born from a gate close when the gate is met: done by artifact, not by a tick. */
export function resolveGateTasks(
  scope: string,
  control: string,
  gates: { key: string; met: boolean; label: string }[],
) {
  for (const t of tasks) {
    if (t.state === "Done" || !t.gate) continue;
    if (t.gate.scope !== scope || t.gate.control !== control) continue;
    const g = gates.find((x) => x.key === t.gate!.key);
    if (g?.met) completeTask(t.id, "System", g.label.toLowerCase());
  }
}

export function gateTaskFor(scope: string, control: string, key: string): Task | undefined {
  return tasks.find(
    (t) =>
      t.state !== "Done" &&
      t.gate?.scope === scope &&
      t.gate.control === control &&
      t.gate.key === key,
  );
}

/* ------------------------------------------------------------------- Seed */

const day = (dataset: string, hour = 9, minute = 0) => isoFromDatasetDate(dataset, hour, minute);

const seeds: CreateTaskInput[] = [
  {
    program: "PRG-1041",
    title: "Confirm which privileged functions the ground segment logs",
    subject: { kind: "control", id: "AC-6(9)", label: "Log use of privileged functions" },
    assignee: "Joel Barrantes",
    requester: "Priya Raghavan",
    due: "2026-09-04",
    waitingOn: "Joel Barrantes",
    createdAt: day("Aug 27, 2026", 15, 12),
    log: false,
  },
  {
    program: "PRG-1041",
    title: "Write the implementation statement",
    subject: { kind: "control", id: "AC-6(9)", label: "Log use of privileged functions" },
    assignee: "Priya Raghavan",
    requester: "Priya Raghavan",
    due: "2026-09-02",
    gate: { scope: "SYS-0001", control: "AC-6(9)", key: "narrative" },
    createdAt: day("Aug 27, 2026", 15, 20),
  },
  {
    program: "PRG-1041",
    title: "Link the boot integrity test evidence",
    subject: {
      kind: "control",
      id: "SI-7",
      label: "Software, firmware, and information integrity",
    },
    assignee: "Marcus Ryde",
    requester: "Priya Raghavan",
    due: "2026-08-27",
    createdAt: day("Aug 20, 2026", 10, 0),
  },
  {
    program: "PRG-1041",
    title: "Map REQ-0042.4 to the objectives it satisfies",
    subject: { kind: "requirement", id: "REQ-0042.4", label: "Rollback fuse floor" },
    assignee: "Priya Raghavan",
    requester: "Priya Raghavan",
    due: "2026-09-07",
    createdAt: day("Aug 28, 2026", 11, 30),
  },
  {
    program: "PRG-1041",
    title: "Confirm keycloak-idp enforces the session lock on the ground segment",
    subject: { kind: "node", id: "CN-0220", label: "keycloak-idp" },
    assignee: "Victor Amsel",
    requester: "Priya Raghavan",
    due: "2026-09-03",
    waitingOn: "Victor Amsel",
    createdAt: day("Aug 26, 2026", 14, 5),
    log: false,
  },
  {
    program: "PRG-1041",
    title: "Record the determination note for the tactical link",
    subject: { kind: "control", id: "AC-4", label: "Information flow enforcement" },
    assignee: "Sarah Chen",
    requester: "Sarah Chen",
    due: "2026-08-28",
    createdAt: day("Aug 25, 2026", 16, 0),
  },
  {
    program: "PRG-1041",
    title: "Re-baseline the CP-9 backup evidence after the August change",
    subject: { kind: "control", id: "CP-9", label: "System backup" },
    assignee: "Priya Raghavan",
    requester: "Marcus Ryde",
    due: "2026-09-11",
    createdAt: day("Aug 29, 2026", 9, 45),
  },
  {
    program: "PRG-1041",
    title: "Review the Tactical edge tailoring proposal",
    subject: { kind: "program", id: "PRG-1041", label: "Atlas payments platform" },
    assignee: "Priya Raghavan",
    requester: "Dan Whitfield",
    due: "2026-09-01",
    createdAt: day("Aug 29, 2026", 8, 30),
  },
  {
    program: "PRG-1041",
    title: "Confirm the ATO package reviewers",
    subject: { kind: "program", id: "PRG-1041", label: "Atlas payments platform" },
    assignee: "Dan Whitfield",
    requester: "Priya Raghavan",
    due: "2026-09-15",
    createdAt: day("Aug 21, 2026", 13, 0),
  },
];

for (const s of seeds) createTask(s);

const blocked = taskById("TSK-0009");
if (blocked) {
  blocked.state = "Blocked";
}

const done = createTask({
  program: "PRG-1041",
  title: "Take ownership of AC-2",
  subject: { kind: "control", id: "AC-2", label: "Account management" },
  assignee: "Priya Raghavan",
  requester: "Priya Raghavan",
  due: "2026-07-14",
  createdAt: day("Jul 14, 2026", 9, 0),
  log: false,
});
done.state = "Done";
done.doneAt = day("Jul 14, 2026", 9, 30);

/* ------------------------------------------------------------ Log seeds */

const ac69 = { kind: "control" as const, id: "AC-6(9)", label: "Log use of privileged functions" };
const si7 = {
  kind: "control" as const,
  id: "SI-7",
  label: "Software, firmware, and information integrity",
};
const program = { kind: "program" as const, id: "PRG-1041", label: "Atlas payments platform" };

const logSeeds: Parameters<typeof record>[0][] = [
  {
    at: day("Aug 20, 2026", 10, 0),
    program: "PRG-1041",
    actor: "Dan Whitfield",
    kind: "stage",
    summary: "moved the program from Select to Implement",
    subject: program,
    field: "stage",
    before: "Select",
    after: "Implement",
  },
  {
    at: day("Aug 25, 2026", 16, 0),
    program: "PRG-1041",
    actor: "Sarah Chen",
    kind: "note",
    summary: "added a note",
    body: "Two flow enforcement points sampled; the tactical link had none. The determination stands until the config lands.",
    subject: { kind: "control", id: "AC-4", label: "Information flow enforcement" },
  },
  {
    at: day("Aug 26, 2026", 14, 5),
    program: "PRG-1041",
    actor: "Priya Raghavan",
    kind: "request",
    summary: "asked Victor Amsel for the session lock behaviour on keycloak-idp",
    body: "Does keycloak-idp enforce the 15-minute session lock for the ground segment operators, or does the console do it?",
    subject: { kind: "node", id: "CN-0220", label: "keycloak-idp" },
    about: { kind: "task", id: "TSK-0005" },
    mentions: ["Victor Amsel"],
  },
  {
    at: day("Aug 27, 2026", 15, 12),
    program: "PRG-1041",
    actor: "Priya Raghavan",
    kind: "request",
    summary: "asked Joel Barrantes for the privileged functions the ground segment logs",
    body: "Which privileged functions does the ground segment log today, and where do the records land? I need it for AC-6(9) before Friday.",
    subject: ac69,
    about: { kind: "task", id: "TSK-0001" },
    mentions: ["Joel Barrantes"],
  },
  {
    at: day("Aug 28, 2026", 9, 20),
    program: "PRG-1041",
    actor: "Joel Barrantes",
    kind: "comment",
    summary: "replied",
    body: "@[Priya Raghavan] sudo, service restarts and key loads all go to the audit sink; config changes on the switches do not yet. I will pull the list.",
    subject: ac69,
  },
  {
    at: day("Aug 28, 2026", 11, 0),
    program: "PRG-1041",
    actor: "Victor Amsel",
    kind: "comment",
    summary: "commented",
    body: "Rollback fuses are blown at station 4 and the release record carries the SVN. @[Priya Raghavan] which objective does this map to?",
    subject: { kind: "requirement", id: "REQ-0042.4", label: "Rollback fuse floor" },
  },
  {
    at: day("Aug 29, 2026", 8, 30),
    program: "PRG-1041",
    actor: "Dan Whitfield",
    kind: "comment",
    summary: "mentioned Priya Raghavan",
    body: "@[Priya Raghavan] the Tactical edge tailoring proposal needs your review before Tuesday's gate.",
    subject: program,
  },
  {
    at: day("Aug 29, 2026", 10, 5),
    program: "PRG-1041",
    actor: "Priya Raghavan",
    kind: "comment",
    summary: "mentioned Marcus Ryde",
    body: "Switch config changes are the gap. @[Marcus Ryde] is the syslog relay change in CHG-0447 covering them?",
    subject: ac69,
  },
  {
    at: day("Aug 29, 2026", 16, 40),
    program: "PRG-1041",
    actor: "Marcus Ryde",
    kind: "comment",
    summary: "replied",
    body: "@[Priya Raghavan] the boot test evidence is the ceremony log from WS-0103; linking it once the ceremony completes.",
    subject: si7,
  },
];

for (const entry of logSeeds) record(entry);

/* ----------------------------------------------------------- Table edits */

export function renameTask(id: string, title: string, actor: string) {
  const t = taskById(id);
  const next = title.trim();
  if (!t || !next || t.title === next) return;
  const before = t.title;
  t.title = next;
  record({
    program: t.program,
    actor,
    kind: "change",
    summary: `renamed "${before}" to "${next}"`,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
    field: "title",
    before,
    after: next,
  });
  bump();
}

export function setTaskNote(id: string, note: string, actor: string) {
  const t = taskById(id);
  const next = note.trim();
  if (!t || t.note === next) return;
  t.note = next;
  record({
    program: t.program,
    actor,
    kind: "note",
    summary: next ? `noted on "${t.title}"` : `cleared the note on "${t.title}"`,
    body: next || undefined,
    subject: t.subject,
    about: { kind: "task", id: t.id, label: t.title },
  });
  bump();
}

/* --------------------------------------------------------------- Buckets */

export type DueBucket = "Overdue" | "Today" | "This week" | "Later" | "No due date" | "Done";

export const dueBuckets: readonly DueBucket[] = [
  "Overdue",
  "Today",
  "This week",
  "Later",
  "No due date",
  "Done",
];

/** Which band of a table grouped by when. The seven days from today are the week. */
export function dueBucket(task: Task, now: Date = clockNow()): DueBucket {
  if (task.state === "Done") return "Done";
  if (!task.due) return "No due date";
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [y, m, d] = task.due.split("-").map(Number);
  const days = Math.round((Date.UTC(y!, m! - 1, d!) - today) / 86_400_000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days < 7) return "This week";
  return "Later";
}

export const dueBucketRank = (bucket: DueBucket) => dueBuckets.indexOf(bucket);

/** "27 Aug 2026", from an ISO stamp or day. */
export function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const gateCloseWords: Record<string, string> = {
  owner: "the control has an owner",
  narrative: "the implementation statement is written",
  contributor: "a requirement is mapped to the control",
  evidence: "evidence is linked",
  determination: "a determination is recorded",
};

/** What closes a gate-born task, in words. */
export function gateCloses(key: string): string {
  return gateCloseWords[key] ?? "the gate is met";
}
