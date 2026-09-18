import { ProductCollection } from "./product-collection";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RecordLink, useDisplayedRecords } from "./record-preview";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  Toolbar,
  defineColumns,
  Stack,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";
import { QueryState } from "./work-common";
import { CreateTaskDialog } from "./create-task-dialog";
import { statusTone } from "./work-format";

type TaskRow = Row<"tasks"> & {
  program: string;
  assignees: string;
  state: string;
  due: string | undefined;
  role: string;
  priorityLabel: string;
};
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
            programs.data?.find((item) => item.id === task.program_id)?.name ??
            "Unavailable program",
          assignees:
            assigned
              .map(
                (item) =>
                  parties.data?.find((party) => party.id === item.party_id)?.name ??
                  "Unavailable person",
              )
              .join(", ") || "Unassigned",
          state: labelFor(task.status),
          due: task.due_at ?? undefined,
          role: mine ? "Assigned to you" : "Other tasks",
          priorityLabel: task.priority ? labelFor(task.priority) : "Not recorded",
        };
      }),
    [tasks.data, assignments.data, parties.data, programs.data, workspace.userId],
  );
  const columns = useMemo(
    () =>
      defineColumns<TaskRow>((c) => [
        c.id("title", {
          header: "Task",
          width: 220,
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
        c.status("state", { header: "State", width: 130, tone: (row) => statusTone(row.status) }),
        c.text("assignees", { header: "Assigned to", width: 180 }),
        ...(programId ? [] : [c.text("program", { header: "Program", width: 180 })]),
        c.date("due", { header: "Due", width: 135 }),
        c.text("priorityLabel", { header: "Priority", width: 110 }),
        c.text("role", { header: "Assignment", width: 160 }),
      ]),
    [programId, preview?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Tasks",
    view: `tasks-${workstreamId ?? programId ?? "my-work"}`,
    resizable: true,
    reorderable: true,
    initialState: { columnFilters: mineOnly ? [{ id: "role", value: ["Assigned to you"] }] : [] },
  });
  const displayed = useDisplayedRecords(table);
  return (
    <Stack space="space.200">
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
        onRowClick={(row) => void navigate({ to: "/tasks/$taskId", params: { taskId: row.id } })}
        empty={{
          illustration: "tasks",
          title: "No tasks yet",
          description: "Create a task and assign a person to start tracking work.",
          action:
            workspace.role !== "viewer" ? (
              <Button
                variant="primary"
                iconBefore={<Plus />}
                disabled={adding}
                onClick={() => setAdding(true)}
              >
                Create task
              </Button>
            ) : undefined,
        }}
        searchLabel="Find tasks"
        views={
          <>
            <DataTable.Presets
              table={table}
              variant="menu"
              presets={[
                { id: "all", label: "All tasks" },
                {
                  id: "mine",
                  label: "Assigned to you",
                  filters: [{ id: "role", value: ["Assigned to you"] }],
                },
                {
                  id: "open",
                  label: "Open",
                  filters: [{ id: "state", value: ["Open", "In progress", "Waiting", "Blocked"] }],
                },
                { id: "done", label: "Done", filters: [{ id: "state", value: ["Done"] }] },
              ]}
            />
          </>
        }
        filters={
          <>
            <DataTable.Filter table={table} column="state" />
            <DataTable.Filter table={table} column="assignees" />
          </>
        }
        action={
          <>
            {workspace.role !== "viewer" && (
              <Button
                size="small"
                variant="primary"
                iconBefore={<Plus />}
                disabled={adding}
                onClick={() => setAdding(true)}
              >
                Create task
              </Button>
            )}
          </>
        }
      />
      {preview && (
        <RecordSummaryPreview
          model="tasks"
          record={rows.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            { key: "state", label: "State" },
            { key: "assignees", label: "Assigned to" },
            { key: "program", label: "Program" },
            { key: "due", label: "Due" },
            { key: "priorityLabel", label: "Priority" },
          ]}
        />
      )}
    </Stack>
  );
}
