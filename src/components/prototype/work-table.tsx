import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  defineColumns,
  Inline,
  Stack,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";
import { QueryState } from "./work-common";
import { CreateTaskDialog } from "./create-task-dialog";
import { displayDate, statusTone } from "./work-format";

type TaskRow = Row<"tasks"> & {
  program: string;
  assignees: string;
  state: string;
  due: string;
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
          due: displayDate(task.due_at),
          role: mine ? "Assigned to you" : "Other tasks",
          priorityLabel: task.priority ? labelFor(task.priority) : "Not recorded",
        };
      }),
    [tasks.data, assignments.data, parties.data, programs.data, workspace.userId],
  );
  const columns = useMemo(
    () =>
      defineColumns<TaskRow>((c) => [
        c.text("title", { header: "Task", width: 330, hideable: false }),
        c.status("state", { header: "State", width: 130, tone: (row) => statusTone(row.status) }),
        c.text("assignees", { header: "Assigned to", width: 180 }),
        ...(programId ? [] : [c.text("program", { header: "Program", width: 180 })]),
        c.text("due", { header: "Due", width: 135 }),
        c.text("priorityLabel", { header: "Priority", width: 110 }),
        c.text("role", { header: "Assignment", width: 160 }),
      ]),
    [programId],
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
      <QueryState queries={[tasks, assignments, parties, programs]}>
        <DataTable
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
                  Add task
                </Button>
              ) : undefined,
          }}
          toolbar={
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <DataTable.Search table={table} placeholder="Find tasks" />
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
                    filters: [
                      { id: "state", value: ["Open", "In progress", "Waiting", "Blocked"] },
                    ],
                  },
                  { id: "done", label: "Done", filters: [{ id: "state", value: ["Done"] }] },
                ]}
              />
              <DataTable.Filter table={table} column="state" />
              <DataTable.Filter table={table} column="assignees" />
              <Inline className="ml-auto" space="space.100" alignBlock="center">
                <DataTable.Columns table={table} />
                <DataTable.Settings table={table} />
                {workspace.role !== "viewer" && (
                  <Button
                    size="small"
                    variant="primary"
                    iconBefore={<Plus />}
                    disabled={adding}
                    onClick={() => setAdding(true)}
                  >
                    Add task
                  </Button>
                )}
              </Inline>
            </Inline>
          }
        />
      </QueryState>
    </Stack>
  );
}
