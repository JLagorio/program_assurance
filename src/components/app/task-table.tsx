import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Absent,
  Badge,
  Box,
  Button,
  Calendar,
  Checkbox,
  cn,
  DataTable,
  defineColumns,
  Editable,
  IconButton,
  Inline,
  KeyValue,
  NativeSelect,
  Person,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PreviewSheet,
  Section,
  Stack,
  useDataTable,
  type ColumnFiltersState,
  type Preset,
  type SortingState,
  type Tone,
} from "@ledger/design-system";

import { RecordActivity } from "@/components/app/record-activity";
import { SubjectWords } from "@/components/app/subject-link";
import { TaskDialog } from "@/components/app/task-dialog";
import type { Subject } from "@/lib/activity";
import { mentionablePeople } from "@/lib/people";
import {
  completeTask,
  dueBucket,
  dueBucketRank,
  dueLabel,
  gateCloses,
  isOverdue,
  reassignTask,
  renameTask,
  reopenTask,
  setTaskDue,
  setTaskNote,
  setTaskState,
  shortDate,
  taskById,
  useTasksVersion,
  type DueBucket,
  type Task,
  type TaskState,
} from "@/lib/tasks";

/*
 * The task table: the program's Tasks tab and My work. Rows band by when, by who, by record or
 * by state; a saved view is a question, chosen from one menu; every cell edits in place; a row
 * opens beside the list and ⌘↑ ⌘↓ step through it. The Done checkbox and the title are pinned,
 * so the rest scrolls under them. The compact list under a record stays what it is (tasks-section).
 */

/* ------------------------------------------------------------------ Rows */

export type TaskRole = "Assigned to you" | "Waiting on others" | "Other";

export type TaskRow = {
  id: string;
  title: string;
  subject: Subject;
  subjectLabel: string;
  program: string;
  assignee: string;
  requester: string;
  due: string | null;
  state: TaskState;
  waitingOn: string;
  bucket: DueBucket;
  role: TaskRole;
};

const roleOf = (t: Task, me: string): TaskRole =>
  t.assignee === me ? "Assigned to you" : t.requester === me ? "Waiting on others" : "Other";

export const toTaskRow = (t: Task, me: string): TaskRow => ({
  id: t.id,
  title: t.title,
  subject: t.subject,
  subjectLabel: [t.subject.id, t.subject.label].filter(Boolean).join(" "),
  program: t.program,
  assignee: t.assignee,
  requester: t.requester,
  due: t.due,
  state: t.state,
  waitingOn: t.waitingOn ?? "",
  bucket: dueBucket(t),
  role: roleOf(t, me),
});

const states: readonly TaskState[] = ["Open", "Waiting", "Blocked", "Done"];
const stateRank: Record<TaskState, number> = { Open: 0, Waiting: 1, Blocked: 2, Done: 3 };
const openStates = ["Open", "Waiting", "Blocked"];

export const stateTone = (s: TaskState): Tone =>
  s === "Done" ? "success" : s === "Blocked" ? "danger" : s === "Waiting" ? "warning" : "neutral";

const noop = () => undefined;

/** Moves a task between states through the store. True when Waiting needs a person named. */
function changeState(id: string, from: TaskState, to: TaskState, me: string): boolean {
  if (from === to) return false;
  if (to === "Done") {
    completeTask(id, me);
    return false;
  }
  if (from === "Done") reopenTask(id, me);
  setTaskState(id, to, me);
  return to === "Waiting" && !taskById(id)?.waitingOn;
}

/* --------------------------------------------------------------- Presets */

/** The program tab's saved views. */
export const programPresets = (me: string): Preset[] => [
  { id: "open", label: "Open", filters: [{ id: "state", value: openStates }] },
  {
    id: "mine",
    label: "Mine",
    filters: [
      { id: "state", value: openStates },
      { id: "assignee", value: [me] },
    ],
  },
  { id: "waiting", label: "Waiting", filters: [{ id: "state", value: ["Waiting"] }] },
  { id: "overdue", label: "Overdue", filters: [{ id: "bucket", value: ["Overdue"] }] },
  { id: "done", label: "Done", filters: [{ id: "state", value: ["Done"] }] },
  { id: "all", label: "All" },
];

/** My work's saved views: yours, what you wait on, what you closed. */
export const myWorkPresets: Preset[] = [
  {
    id: "mine",
    label: "Assigned to you",
    filters: [
      { id: "role", value: ["Assigned to you"] },
      { id: "state", value: openStates },
    ],
  },
  {
    id: "waiting",
    label: "Waiting on others",
    filters: [
      { id: "role", value: ["Waiting on others"] },
      { id: "state", value: openStates },
    ],
  },
  {
    id: "done",
    label: "Done",
    filters: [
      { id: "role", value: ["Assigned to you"] },
      { id: "state", value: ["Done"] },
    ],
  },
  { id: "all", label: "All" },
];

/* ---------------------------------------------------------------- Fields */

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

/** The due day, edited in place: the label at rest, a Calendar on click, Clear under it. */
export function DueField({ task, me }: { task: Task; me: string }) {
  const [open, setOpen] = useState(false);
  const label = dueLabel(task);
  const overdue = isOverdue(task);
  const date = task.due ? dateOf(task.due) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Due: ${task.title}`}
            className={cn(
              "truncate rounded-small text-left tabular-nums outline-none hover:underline focus-visible:outline-focused",
              overdue ? "text-danger" : label ? undefined : "text-subtlest",
            )}
          >
            {label ?? "Add due"}
          </button>
        }
      />
      <PopoverContent
        aria-label={`Due: ${task.title}`}
        align="start"
        className="gap-0 p-0"
        style={{ width: "auto" }}
      >
        <Calendar
          mode="single"
          {...(date ? { selected: date, defaultMonth: date } : {})}
          onSelect={(d) => {
            setTaskDue(task.id, d ? isoOf(d) : null, me);
            setOpen(false);
          }}
        />
        {task.due ? (
          <Box paddingInline="space.150" paddingBlockEnd="space.100">
            <Button
              size="small"
              variant="subtle"
              onClick={() => {
                setTaskDue(task.id, null, me);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </Box>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/** The task's properties as rail rows, every one edited in place. The panel and the record share it. */
export function TaskProperties({
  task,
  me,
  people,
  onNeedsPerson,
}: {
  task: Task;
  me: string;
  people: readonly string[];
  /** Waiting was chosen and nobody is named yet. */
  onNeedsPerson?: (() => void) | undefined;
}) {
  return (
    <Stack space="space.050">
      <KeyValue label="State">
        <Editable.Select<TaskState>
          label="State"
          options={states}
          value={task.state}
          onChange={noop}
          save={async (next) => {
            if (changeState(task.id, task.state, next, me)) onNeedsPerson?.();
          }}
          render={(v) => (
            <Badge variant="secondary" tone={stateTone(v)}>
              {v}
            </Badge>
          )}
        />
      </KeyValue>
      {task.state === "Waiting" ? (
        <KeyValue label="Waiting on">
          <Editable.Select
            label="Waiting on"
            options={people}
            value={task.waitingOn ?? ""}
            onChange={noop}
            save={async (next) => setTaskState(task.id, "Waiting", me, next)}
            render={(v) => (v ? <Person name={v} /> : <Absent />)}
          />
        </KeyValue>
      ) : null}
      <KeyValue label="Assignee">
        <Editable.Select
          label="Assignee"
          options={people}
          value={task.assignee}
          onChange={noop}
          save={async (next) => reassignTask(task.id, next, me)}
          render={(v) => (v ? <Person name={v} /> : <Absent />)}
        />
      </KeyValue>
      <KeyValue label="Due">
        <DueField task={task} me={me} />
      </KeyValue>
      <KeyValue label="Asked by">
        <Person name={task.requester} />
      </KeyValue>
      <KeyValue label="On">
        <SubjectWords subject={task.subject} program={task.program} />
      </KeyValue>
      {task.gate ? (
        <KeyValue label="Closes when" wrap>
          {gateCloses(task.gate.key)}
        </KeyValue>
      ) : null}
      <KeyValue label="Created">{shortDate(task.createdAt)}</KeyValue>
      {task.doneAt ? <KeyValue label="Done">{shortDate(task.doneAt)}</KeyValue> : null}
    </Stack>
  );
}

/* ----------------------------------------------------------------- Panel */

function TaskPanel({
  id,
  open,
  me,
  people,
  onClose,
  onStep,
  hasPrev,
  hasNext,
}: {
  id: string | null;
  open: boolean;
  me: string;
  people: readonly string[];
  onClose: () => void;
  onStep: (delta: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const task = id ? taskById(id) : undefined;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onStep(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onStep(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onStep]);
  if (!task) return null;
  const done = task.state === "Done";
  return (
    <PreviewSheet
      open={open}
      onClose={onClose}
      id={task.id}
      title={
        <Editable.Text
          label="Title"
          value={task.title}
          onChange={noop}
          save={async (next) => renameTask(task.id, next, me)}
        />
      }
      status={
        <Badge variant="secondary" tone={stateTone(task.state)}>
          {task.state}
        </Badge>
      }
      subtitle={<SubjectWords subject={task.subject} program={task.program} />}
      openTo={
        <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
          Open the task
        </Link>
      }
      actions={
        <>
          <IconButton
            label="Previous task (⌘↑)"
            variant="subtle"
            size="small"
            icon={<ChevronUp />}
            disabled={!hasPrev}
            onClick={() => onStep(-1)}
          />
          <IconButton
            label="Next task (⌘↓)"
            variant="subtle"
            size="small"
            icon={<ChevronDown />}
            disabled={!hasNext}
            onClick={() => onStep(1)}
          />
          <Button
            size="small"
            variant={done ? "secondary" : "primary"}
            onClick={() => (done ? reopenTask(task.id, me) : completeTask(task.id, me))}
          >
            {done ? "Reopen" : "Complete"}
          </Button>
        </>
      }
    >
      <Stack space="space.300">
        <TaskProperties task={task} me={me} people={people} />
        <Section title="Note">
          <Box paddingBlockStart="space.100">
            <Editable.Text
              label="Note"
              placeholder="Add a note"
              value={task.note}
              onChange={noop}
              save={async (next) => setTaskNote(task.id, next, me)}
            />
          </Box>
        </Section>
        <RecordActivity
          program={task.program}
          subject={{ kind: "task", id: task.id, label: task.title }}
          me={me}
        />
      </Stack>
    </PreviewSheet>
  );
}

/* ----------------------------------------------------------------- Table */

export type GroupKey = "" | "bucket" | "assignee" | "subject" | "state";

const groupOptions: { value: GroupKey; label: string }[] = [
  { value: "bucket", label: "By due" },
  { value: "assignee", label: "By assignee" },
  { value: "subject", label: "By record" },
  { value: "state", label: "By state" },
  { value: "", label: "No groups" },
];

const sortFor = (g: GroupKey): SortingState => [{ id: g || "bucket", desc: false }];

export type TaskTableProps = {
  tasks: Task[];
  me: string;
  /** The table's accessible name. */
  label: string;
  /** Names the table so the reader's layout persists in this browser. */
  view?: string | undefined;
  /** The list spans records: each row says where it sits. */
  showSubject?: boolean | undefined;
  /** Saved views, as column filters. */
  presets?: Preset[] | undefined;
  defaultPreset?: string | undefined;
  defaultGroup?: GroupKey | undefined;
  /** Add task in the toolbar, on this record. */
  add?: { program: string; subject: Subject } | undefined;
  empty: { title: string; description?: string | undefined };
  /** The task whose panel starts open. For a story. */
  initialOpen?: string | undefined;
};

export function TaskTable({
  tasks,
  me,
  label,
  view,
  showSubject = false,
  presets,
  defaultPreset,
  defaultGroup = "bucket",
  add,
  empty,
  initialOpen,
}: TaskTableProps) {
  const version = useTasksVersion();
  const key = tasks.map((t) => t.id).join(",");
  const rows = useMemo(
    () => tasks.map((t) => toTaskRow(t, me)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, me, key],
  );
  const people = useMemo(() => mentionablePeople(add?.program).map((p) => p.name), [add?.program]);

  const [openId, setOpenId] = useState<string | null>(initialOpen ?? null);
  const [lastId, setLastId] = useState<string | null>(initialOpen ?? null);
  const openTask = useCallback((id: string) => {
    setOpenId(id);
    setLastId(id);
  }, []);
  const openRef = useRef(openTask);
  openRef.current = openTask;
  const activeRef = useRef<string | null>(null);
  activeRef.current = openId;

  const [adding, setAdding] = useState(false);
  const [group, setGroup] = useState<GroupKey>(defaultGroup);
  const [sorting, setSorting] = useState<SortingState>(() => sortFor(defaultGroup));
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    () => presets?.find((p) => p.id === defaultPreset)?.filters ?? [],
  );
  const changeGroup = (g: GroupKey) => {
    setGroup(g);
    setSorting(sortFor(g));
  };

  const columns = useMemo(
    () =>
      defineColumns<TaskRow>((c) => [
        c.custom("done", {
          header: <span className="sr-only">Done</span>,
          width: 40,
          pin: "start",
          hideable: false,
          resizable: false,
          cell: (r) => (
            <Checkbox
              aria-label={`${r.state === "Done" ? "Reopen" : "Complete"}: ${r.title}`}
              checked={r.state === "Done"}
              onCheckedChange={(checked) =>
                checked ? completeTask(r.id, me) : reopenTask(r.id, me)
              }
            />
          ),
        }),
        c.text("title", {
          header: "Task",
          hideable: false,
          width: 320,
          pin: "start",
          cell: (r) => (
            <button
              type="button"
              title={r.title}
              onClick={() => openRef.current(r.id)}
              className={cn(
                "block w-full truncate rounded-small text-left font-medium outline-none hover:underline focus-visible:outline-focused",
                r.state === "Done" && "text-subtle line-through",
              )}
            >
              {r.title}
            </button>
          ),
        }),
        ...(showSubject
          ? [
              c.custom("subject", {
                header: "On",
                width: 240,
                sort: (r) => r.subjectLabel,
                text: (r) => r.subjectLabel,
                cell: (r) => <SubjectWords subject={r.subject} program={r.program} />,
              }),
            ]
          : []),
        c.person("assignee", {
          header: "Assignee",
          width: 190,
          cell: (r) => (
            <Editable.Select
              label={`Assignee: ${r.title}`}
              options={people}
              value={r.assignee}
              onChange={noop}
              save={async (next) => reassignTask(r.id, next, me)}
              render={(v) => (v ? <Person name={v} /> : <Absent />)}
            />
          ),
        }),
        c.date("due", {
          header: "Due",
          width: 130,
          cell: (r) => {
            const task = taskById(r.id);
            return task ? <DueField task={task} me={me} /> : <Absent />;
          },
        }),
        c.status("state", {
          header: "State",
          width: 130,
          sortBy: (r) => stateRank[r.state],
          tone: (r) => stateTone(r.state),
          editable: {
            options: states,
            onChange: noop,
            save: async (r, next) => {
              if (changeState(r.id, r.state, next as TaskState, me)) openRef.current(r.id);
            },
          },
        }),
        c.person("waitingOn", { header: "Waiting on", width: 170 }),
        c.person("requester", { header: "Asked by", width: 170 }),
        c.text("bucket", { header: "When", width: 120, sortBy: (r) => dueBucketRank(r.bucket) }),
        c.text("role", { header: "Relation", width: 150 }),
        c.id("id", {
          header: "ID",
          width: 100,
          tone: "subtle",
          preview: (r) => openRef.current(r.id),
          active: (r) => activeRef.current === r.id,
        }),
        c.actions((r) => [
          { label: "Open", onSelect: () => openRef.current(r.id) },
          ...(r.state !== "Done"
            ? [
                {
                  label: "Waiting on…",
                  onSelect: () => {
                    setTaskState(r.id, "Waiting", me);
                    openRef.current(r.id);
                  },
                },
                {
                  label: r.state === "Blocked" ? "Mark open" : "Mark blocked",
                  onSelect: () =>
                    setTaskState(r.id, r.state === "Blocked" ? "Open" : "Blocked", me),
                },
              ]
            : []),
          {
            label: r.state === "Done" ? "Reopen" : "Complete",
            onSelect: () => (r.state === "Done" ? reopenTask(r.id, me) : completeTask(r.id, me)),
          },
        ]),
      ]),
    [me, people, showSubject],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.id,
    label,
    ...(view ? { view } : {}),
    resizable: true,
    reorderable: true,
    groupBy: group || undefined,
    state: { sorting, columnFilters, grouping: group ? [group] : [] },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: noop,
    initialState: {
      columnVisibility: { waitingOn: false, requester: false, bucket: false, role: false },
    },
  });

  const leaves = table
    .getRowModel()
    .flatRows.filter((r) => !r.getIsGrouped())
    .map((r) => r.id);
  const leavesRef = useRef(leaves);
  leavesRef.current = leaves;
  const index = openId ? leaves.indexOf(openId) : -1;
  const step = useCallback(
    (delta: number) => {
      const list = leavesRef.current;
      const i = list.indexOf(activeRef.current ?? "");
      const next = list[i + delta];
      if (next) openTask(next);
    },
    [openTask],
  );

  const toolbar = (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <DataTable.Search table={table} placeholder="Find a task" />
      {presets ? (
        <DataTable.Presets
          table={table}
          presets={presets}
          variant="menu"
          aria-label="Saved views"
        />
      ) : null}
      <DataTable.Filter table={table} column="assignee" />
      <DataTable.Filter table={table} column="state" />
      <Inline className="ml-auto" space="space.100" alignBlock="center">
        <Box style={{ width: 150 }}>
          <NativeSelect
            size="small"
            aria-label="Group by"
            value={group}
            onChange={(e) => changeGroup(e.target.value as GroupKey)}
          >
            {groupOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Box>
        <DataTable.Columns table={table} />
        <DataTable.Settings table={table} />
        {add ? (
          <Button
            size="small"
            variant="primary"
            iconBefore={<Plus />}
            onClick={() => setAdding(true)}
          >
            Add task
          </Button>
        ) : null}
      </Inline>
    </Inline>
  );

  return (
    <>
      <DataTable table={table} toolbar={toolbar} empty={empty} />
      <TaskPanel
        id={lastId}
        open={openId !== null}
        me={me}
        people={people}
        onClose={() => setOpenId(null)}
        onStep={step}
        hasPrev={index > 0}
        hasNext={index >= 0 && index < leaves.length - 1}
      />
      {add ? (
        <TaskDialog
          open={adding}
          onClose={() => setAdding(false)}
          program={add.program}
          subject={add.subject}
          requester={me}
        />
      ) : null}
    </>
  );
}
