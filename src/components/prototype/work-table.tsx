import { ProductCollection } from "./product-collection";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RecordLink, useDisplayedRecords, useEndOnHide } from "./record-preview";
import {
  useServerCollection,
  useServerPresetCounts,
  vocabularyOptions,
} from "./collection-question";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DataTable,
  defineColumns,
  Stack,
  type FilterOption,
  type Preset,
} from "@ledger/design-system";
import { ListTodo, Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { useWorkspace } from "@/components/app/workspace";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { taskPriorities, taskStatuses } from "@/lib/status";
import { CreateTaskDialog } from "./create-task-dialog";
import { DueDate } from "./work-common";

/**
 * A task as the task registers read it: every column its preview's Edit seeds the form from, its
 * program by name, the people assigned by name in the order they were assigned, and whether the
 * reader is one of them.
 */
type TaskRecord = ServerRow<
  "task_rows",
  | "id"
  | "tenant_id"
  | "program_id"
  | "workstream_id"
  | "title"
  | "description"
  | "status"
  | "priority"
  | "due_on"
  | "completed_at"
  | "revision"
  | "updated_at"
  | "program_name"
  | "assignees"
  | "assignment",
  | "tenant_id"
  | "program_id"
  | "title"
  | "status"
  | "revision"
  | "updated_at"
  | "assignees"
  | "assignment"
>;
type TaskRow = TaskRecord & {
  /** The program's name; null when the reader cannot see it, so the cell says Absent. */
  program: string | null;
  /** The day the task is due, an ISO day; overdue once it is before the reader's today. */
  due: string | undefined;
  /** Whether the reader is assigned, in the Assignment column's words. */
  role: string;
};

/** Each task of a page as the register draws it. */
const taskRows = (page: TaskRecord[]): TaskRow[] =>
  page.map((task) => ({
    ...task,
    program: task.program_name,
    due: task.due_on ?? undefined,
    role: task.assignment,
  }));

const ASSIGNED_TO_YOU = "Assigned to you";
/** The Assigned to facet's value for a task nobody holds. */
const UNASSIGNED = "Unassigned";
const mineFilter = [{ id: "role", value: [ASSIGNED_TO_YOU] }];

/**
 * When a task is due, and where it stands: overdue, due today and due soon say so beside the date
 * while the task is open; a done task's date reads plainly, and a cancelled task's has no state.
 */
function TaskDue({ task }: { task: TaskRow }) {
  return (
    <DueDate
      value={task.due}
      done={task.status === "done"}
      cancelled={task.status === "cancelled"}
    />
  );
}

/**
 * The task register's columns, one list for every render: the preview is the table's, so stepping
 * through tasks never rebuilds them. A program's own tasks leave out the Program column.
 */
const taskColumns = (inProgram: boolean) =>
  defineColumns<TaskRow>((c) => [
    c.text("title", {
      header: "Task",
      // Its 180 minimum and the status's 120 fit a phone's row together, so the status stays
      // beside the name; past it the name shares the spare width.
      minWidth: 180,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="tasks" record={row}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.status("status", { header: "Status", width: 120, priority: 1, statuses: taskStatuses }),
    // Each person on their own in the facet, counted per task, and a task matches when it holds
    // anyone chosen: never the pairs the rows hold. The search finds a task by any of its people.
    c.list("assignees", {
      header: "Assigned to",
      width: 180,
      items: (row) => row.assignees.map((name, index) => ({ key: `${index}`, label: name })),
      empty: () => <Absent label={UNASSIGNED} />,
      emptyLabel: UNASSIGNED,
      searchable: true,
    }),
    ...(inProgram
      ? []
      : [
          c.text("program", {
            header: "Program",
            width: 180,
            cell: (row) => row.program ?? <Absent label="Not available" />,
          }),
        ]),
    // Wide enough for the day and where it stands ("Oct 4, 2026 · Due in 2 days") on one line.
    c.date("due", {
      header: "Due",
      priority: 2,
      minWidth: 200,
      cell: (row) => <TaskDue task={row} />,
    }),
    c.status("priority", {
      header: "Priority",
      width: 110,
      statuses: taskPriorities,
      cell: (row) => <LevelIndicator levels={taskPriorities} value={row.priority} />,
    }),
    c.text("role", { header: "Assignment", width: 160 }),
  ]);
const registerColumns = taskColumns(false);
const programColumns = taskColumns(true);

/**
 * The tasks of a program, of one of its workstreams, or of the whole workspace (My work), a page
 * at a time from the server, newest change first: the people assigned and whether the reader is
 * one of them come from the view, where the search, the sort and the filters reach them too.
 */
const taskRead = (programId: string | undefined, workstreamId: string | undefined) =>
  serverRead({
    source: "task_rows",
    model: "tasks",
    // An assignment changes who holds a task, and whether the reader does.
    models: ["task_assignments"],
    columns: [
      "id",
      "tenant_id",
      "program_id",
      "workstream_id",
      "title",
      "description",
      "status",
      "priority",
      "due_on",
      "completed_at",
      "revision",
      "updated_at",
      "program_name",
      "assignees",
      "assignment",
    ],
    scope: {
      ...(programId ? { program_id: programId } : {}),
      ...(workstreamId ? { workstream_id: workstreamId } : {}),
    },
    search: ["title", "program_name", "assignee_names"],
    fields: {
      status: { labels: taskStatuses, sort: "status_rank" },
      priority: { labels: taskPriorities, sort: "priority_rank" },
      // A task holds anyone chosen; one nobody holds is Unassigned. It sorts by the names in turn.
      assignees: { filter: "list", emptyLabel: UNASSIGNED, sort: "assignee_names" },
      program: { column: "program_name", filter: false },
      due: { column: "due_on", filter: "range" },
      role: { column: "assignment" },
    },
    order: [{ column: "updated_at", ascending: false }],
  });

const presets: Preset[] = [
  { id: "all", label: "All tasks" },
  { id: "mine", label: ASSIGNED_TO_YOU, filters: mineFilter },
  {
    id: "open",
    label: "Open",
    filters: [{ id: "status", value: ["open", "in_progress", "waiting", "blocked"] }],
  },
  { id: "done", label: "Done", filters: [{ id: "status", value: ["done"] }] },
];

export function WorkTable({
  programId,
  workstreamId,
  mineOnly = false,
  fill,
}: {
  programId?: string;
  workstreamId?: string;
  mineOnly?: boolean;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  // The people a task can be assigned to, by name, for the Assigned to filter: the server's rows
  // are one page, so their names are not every name there is.
  const people = useRows("parties", { party_type: "person" }, { columns: ["id", "name"] });
  const assigneeOptions = useMemo<FilterOption[]>(
    () => [
      ...[...new Set((people.data ?? []).map((person) => person.name))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value })),
      { value: UNASSIGNED },
    ],
    [people.data],
  );
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<TaskRow | null>(null);
  useEndOnHide(() => setPreview(null));
  const tablePreview = useMemo(
    () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
    [preview?.id],
  );
  const read = useMemo(() => taskRead(programId, workstreamId), [programId, workstreamId]);
  const collection = useServerCollection<TaskRow, TaskRecord>(read, {
    columns: programId ? programColumns : registerColumns,
    rows: taskRows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.title,
    preview: tablePreview,
    label: "Tasks",
    view: `tasks-${workstreamId ?? programId ?? "my-work"}`,
    resizable: true,
    reorderable: true,
    initialState: { columnFilters: mineOnly ? mineFilter : [] },
  });
  const { table } = collection;
  const presetCounts = useServerPresetCounts(read, presets);
  const displayed = useDisplayedRecords(table);
  const region = useRef<HTMLElement>(null);
  /** Everyone's tasks: the filter goes, and focus goes to the search, since the button goes too. */
  const showAll = () => {
    table.setColumnFilters([]);
    requestAnimationFrame(() =>
      region.current?.querySelector<HTMLInputElement>("input[type='search']")?.focus(),
    );
  };
  // The reader's own tasks are a saved question, not a search: with nothing assigned, the register
  // says so and offers everyone's tasks, not "Nothing matches".
  const onlyMine =
    !String(table.state.globalFilter ?? "") &&
    JSON.stringify(table.state.columnFilters) === JSON.stringify(mineFilter);
  const open = () => {
    if (!adding) setAdding(true);
  };
  const create = (size: "small" | "medium") =>
    workspace.role !== "viewer" ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={open}>
        Create task
      </Button>
    ) : undefined;
  return (
    <Stack space="space.200" ref={region}>
      {adding && (
        <CreateTaskDialog
          programId={programId}
          workstreamId={workstreamId}
          onClose={() => setAdding(false)}
          onCreated={({ taskId }) => navigate({ to: "/tasks/$taskId", params: { taskId } })}
        />
      )}
      <ProductCollection
        {...collection}
        // The people's names list the Assigned to filter's values.
        queries={[...collection.queries, people]}
        fill={fill}
        noun={{ one: "task", other: "tasks" }}
        // Inside a record or a program tab, beside other sections, the tasks are a few rows.
        compact={!fill}
        onRowClick={(row) => void navigate({ to: "/tasks/$taskId", params: { taskId: row.id } })}
        empty={{
          illustration: "tasks",
          icon: <ListTodo />,
          title: "No tasks yet",
          description: "Create a task and assign a person to start tracking work.",
          action: create(fill ? "medium" : "small"),
          ...(onlyMine
            ? {
                filtered: {
                  illustration: "inbox",
                  title: "Nothing assigned to you",
                  description: "Tasks assigned to you appear here.",
                  action: <Button onClick={showAll}>Show all tasks</Button>,
                },
              }
            : {}),
        }}
        searchLabel="Find tasks"
        views={
          <DataTable.Presets table={table} variant="menu" presets={presets} counts={presetCounts} />
        }
        filters={
          <>
            <DataTable.Filter
              table={table}
              column="status"
              options={vocabularyOptions(taskStatuses)}
            />
            <DataTable.Filter table={table} column="assignees" options={assigneeOptions} />
          </>
        }
        action={create("small")}
      />
      {preview && (
        <RecordSummaryPreview
          model="tasks"
          // The page's copy, once a refresh brings it, else the row the reader opened.
          record={displayed.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge statuses={taskStatuses} value={row.status} />,
            },
            {
              key: "assignees",
              label: "Assigned to",
              render: (row) =>
                row.assignees.length ? row.assignees.join(", ") : <Absent label={UNASSIGNED} />,
            },
            {
              key: "program",
              label: "Program",
              render: (row) => row.program ?? <Absent label="Not available" />,
            },
            {
              key: "due",
              label: "Due",
              // The day and where it stands, as the Due column reads it.
              render: (row) => <TaskDue task={row} />,
            },
            {
              key: "priority",
              label: "Priority",
              render: (row) => <LevelIndicator levels={taskPriorities} value={row.priority} />,
            },
          ]}
        />
      )}
    </Stack>
  );
}
