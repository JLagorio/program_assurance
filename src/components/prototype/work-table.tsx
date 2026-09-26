import { ProductCollection } from "./product-collection";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RecordLink, useDisplayedRecords } from "./record-preview";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DataTable,
  DateTime,
  defineColumns,
  Stack,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { taskPriorities, taskStatuses } from "@/lib/status";
import { CreateTaskDialog } from "./create-task-dialog";

type TaskRow = Row<"tasks"> & {
  program: string;
  assignees: string;
  due: string | undefined;
  role: string;
};

const ASSIGNED_TO_YOU = "Assigned to you";
const mineFilter = [{ id: "role", value: [ASSIGNED_TO_YOU] }];

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
  const tasks = useRows("tasks", {
    ...(programId ? { program_id: programId } : {}),
    ...(workstreamId ? { workstream_id: workstreamId } : {}),
  });
  const assignments = useRows("task_assignments");
  const parties = useRows("parties");
  const programs = useRows("programs");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<TaskRow | null>(null);
  const rows = useMemo<TaskRow[]>(
    () =>
      (tasks.data ?? []).map((task) => {
        const assigned = (assignments.data ?? []).filter((item) => item.task_id === task.id);
        const mine = assigned.some((item) =>
          parties.data?.some(
            (party) => party.id === item.party_id && party.auth_user_id === workspace.userId,
          ),
        );
        return {
          ...task,
          program:
            programs.data?.find((item) => item.id === task.program_id)?.name ?? "Not available",
          assignees:
            assigned
              .map(
                (item) =>
                  parties.data?.find((party) => party.id === item.party_id)?.name ??
                  "Not available",
              )
              .join(", ") || "Unassigned",
          due: task.due_at ?? undefined,
          role: mine ? ASSIGNED_TO_YOU : "Other tasks",
        };
      }),
    [tasks.data, assignments.data, parties.data, programs.data, workspace.userId],
  );
  const columns = useMemo(
    () =>
      defineColumns<TaskRow>((c) => [
        c.id("title", {
          header: "Task",
          // 200 and the status's 120 fit a phone's row together, so the status stays beside the name.
          width: 200,
          minWidth: 180,
          priority: 0,
          preview: setPreview,
          active: (row) => row.id === preview?.id,
          hideable: false,
          cell: (row) => (
            <RecordLink table="tasks" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.status("status", { header: "Status", width: 120, priority: 1, statuses: taskStatuses }),
        c.text("assignees", { header: "Assigned to", width: 180 }),
        ...(programId ? [] : [c.text("program", { header: "Program", width: 180 })]),
        c.date("due", { header: "Due", width: 135, priority: 2 }),
        c.status("priority", {
          header: "Priority",
          width: 110,
          statuses: taskPriorities,
          cell: (row) => <LevelIndicator levels={taskPriorities} value={row.priority} />,
        }),
        c.text("role", { header: "Assignment", width: 160 }),
      ]),
    [programId, preview?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.title,
    label: "Tasks",
    view: `tasks-${workstreamId ?? programId ?? "my-work"}`,
    resizable: true,
    reorderable: true,
    initialState: { columnFilters: mineOnly ? mineFilter : [] },
  });
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
        queries={[tasks, assignments, parties, programs]}
        table={table}
        fill={fill}
        noun={{ one: "task", other: "tasks" }}
        onRowClick={(row) => void navigate({ to: "/tasks/$taskId", params: { taskId: row.id } })}
        empty={{
          illustration: "tasks",
          title: "No tasks yet",
          description: "Create a task and assign a person to start tracking work.",
          action: create("medium"),
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
          <DataTable.Presets
            table={table}
            variant="menu"
            presets={[
              { id: "all", label: "All tasks" },
              { id: "mine", label: ASSIGNED_TO_YOU, filters: mineFilter },
              {
                id: "open",
                label: "Open",
                filters: [{ id: "status", value: ["open", "in_progress", "waiting", "blocked"] }],
              },
              { id: "done", label: "Done", filters: [{ id: "status", value: ["done"] }] },
            ]}
          />
        }
        filters={
          <>
            <DataTable.Filter table={table} column="status" />
            <DataTable.Filter table={table} column="assignees" />
          </>
        }
        action={create("small")}
      />
      {preview && (
        <RecordSummaryPreview
          model="tasks"
          record={rows.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge statuses={taskStatuses} value={row.status} />,
            },
            { key: "assignees", label: "Assigned to" },
            { key: "program", label: "Program" },
            {
              key: "due",
              label: "Due",
              render: (row) =>
                // The day, as the Due column and the task record read it.
                row.due ? (
                  <DateTime value={row.due} format="date" />
                ) : (
                  <Absent label="Not recorded" />
                ),
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
