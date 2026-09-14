import { Box } from "@ledger/design-system";
import { displayDate } from "@/components/prototype/work-format";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Inline,
  Inspector,
  PageHeader,
  Section,
  Shell,
  Stack,
  Table,
} from "@ledger/design-system";
import { useModelSave, useRow, useRows } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import {
  DetailFacts,
  EmptyState,
  ModelForm,
  QueryState,
  SchemaLink,
  StatusBadge,
  type FormTarget,
} from "@/components/prototype/work-common";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskRoute,
  head: () => ({ meta: [{ title: "Task — Equinox" }] }),
});
function TaskRoute() {
  const { taskId } = Route.useParams();
  return <TaskDetail key={taskId} taskId={taskId} />;
}
function TaskDetail({ taskId }: { taskId: string }) {
  const workspace = useWorkspace();
  const taskQuery = useRow("tasks", taskId);
  const task = taskQuery.data;
  const program = useRow("programs", task?.program_id);
  const workstream = useRow("workstreams", task?.workstream_id);
  const assignments = useRows("task_assignments", { task_id: taskId });
  const parties = useRows("parties");
  const comments = useRows("comments", { task_id: taskId });
  const activity = useRows("activity_events", { task_id: taskId });
  const save = useModelSave("tasks");
  const [form, setForm] = useState<FormTarget | null>(null);
  const [error, setError] = useState("");
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  async function toggleDone() {
    if (!task || save.isPending) return;
    setError("");
    try {
      await save.mutateAsync({
        id: task.id,
        revision: task.revision,
        values: {
          status: task.status === "done" ? "open" : "done",
          completed_at: task.status === "done" ? null : new Date().toISOString(),
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The task could not be saved.");
    }
  }
  return (
    <Stack space="space.200" className="min-w-0">
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      <QueryState queries={[taskQuery]}>
        {task ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/work" />}>My work</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link to="/programs/$programId" params={{ programId: task.program_id }} />
                      }
                    >
                      {program.data?.name ?? "Program"}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{task.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <Box className="min-w-0">
                <PageHeader.Title>{task.title}</PageHeader.Title>
                <Inline className="pt-100">
                  <StatusBadge value={task.status} />
                </Inline>
              </Box>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <>
                    <Button
                      disabled={!!form || save.isPending}
                      onClick={() => setForm({ table: "tasks", existing: task as DataRecord })}
                    >
                      Edit task
                    </Button>
                    <Button
                      variant={task.status === "done" ? "secondary" : "primary"}
                      disabled={save.isPending || !!form}
                      onClick={() => void toggleDone()}
                    >
                      {save.isPending ? "Saving…" : task.status === "done" ? "Reopen" : "Complete"}
                    </Button>
                  </>
                )}
              </PageHeader.Actions>
            </PageHeader>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <Stack space="space.300" className="min-w-0 pt-200">
              <Section title="Note">
                <p className="whitespace-pre-wrap pt-100 text-subtle">
                  {task.description || "No note recorded."}
                </p>
              </Section>
              <Section
                title="Assignments"
                action={
                  workspace.role !== "viewer" ? (
                    <Button
                      size="small"
                      disabled={!!form}
                      onClick={() =>
                        setForm({ table: "task_assignments", initialValues: { task_id: task.id } })
                      }
                    >
                      Assign person
                    </Button>
                  ) : undefined
                }
              >
                <QueryState queries={[assignments, parties]}>
                  {assignments.data?.length ? (
                    <Table>
                      <thead>
                        <tr>
                          <Table.Header>Person</Table.Header>
                          <Table.Header>Role</Table.Header>
                          <Table.Header width={100}>Actions</Table.Header>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.data.map((assignment) => (
                          <Table.Row key={assignment.id}>
                            <Table.Cell>
                              {parties.data?.find((party) => party.id === assignment.party_id)
                                ?.name ?? "Unavailable person"}
                            </Table.Cell>
                            <Table.Cell>{labelFor(assignment.assignment_role)}</Table.Cell>
                            <Table.Cell>
                              {workspace.role !== "viewer" && (
                                <Button
                                  size="small"
                                  variant="subtle"
                                  disabled={!!form}
                                  onClick={() =>
                                    setForm({
                                      table: "task_assignments",
                                      existing: assignment as DataRecord,
                                    })
                                  }
                                >
                                  Edit
                                </Button>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <EmptyState
                      illustration="people"
                      title="Nobody assigned"
                      description="Assign accountable, responsible, consulted, or informed people to this task."
                    />
                  )}
                </QueryState>
              </Section>
              <Section
                title="Comments"
                action={
                  workspace.role !== "viewer" ? (
                    <Button
                      size="small"
                      disabled={!!form}
                      onClick={() =>
                        setForm({
                          table: "comments",
                          initialValues: {
                            task_id: task.id,
                            ...(me ? { author_party_id: me.id } : {}),
                          },
                        })
                      }
                    >
                      Add comment
                    </Button>
                  ) : undefined
                }
              >
                <QueryState queries={[comments, parties]}>
                  {comments.data?.length ? (
                    <Stack space="space.150">
                      {[...comments.data]
                        .sort((a, b) => a.created_at.localeCompare(b.created_at))
                        .map((comment) => (
                          <Box key={comment.id} className="border-b border-default py-150">
                            <p className="font-body-small text-subtle">
                              {parties.data?.find((party) => party.id === comment.author_party_id)
                                ?.name ?? "Unavailable author"}{" "}
                              · {displayDate(comment.created_at)}
                            </p>
                            <p className="whitespace-pre-wrap pt-100">{comment.body}</p>
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      illustration="inbox"
                      title="No comments yet"
                      description="Questions and decisions about this task are kept here."
                    />
                  )}
                </QueryState>
              </Section>
              <Section title="Activity">
                <QueryState queries={[activity]}>
                  {activity.data?.length ? (
                    <Stack space="space.150">
                      {[...activity.data]
                        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
                        .map((event) => (
                          <Box key={event.id} className="border-b border-default py-150">
                            <p>{event.description ?? labelFor(event.event_type)}</p>
                            <p className="font-body-small text-subtle">
                              {displayDate(event.occurred_at)}
                            </p>
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      illustration="inbox"
                      title="No activity yet"
                      description="Changes to this task are logged here as they happen."
                    />
                  )}
                </QueryState>
              </Section>
            </Stack>
            <Shell.Aside label="Record properties">
              <Inspector.Group title="Details">
                <DetailFacts
                  facts={[
                    ["State", <StatusBadge value={task.status} />],
                    ["Priority", task.priority ? labelFor(task.priority) : null],
                    ["Due", displayDate(task.due_at)],
                    ["Completed", displayDate(task.completed_at)],
                    [
                      "Workstream",
                      task.workstream_id ? (
                        <Link
                          to="/workstreams/$workstreamId"
                          params={{ workstreamId: task.workstream_id }}
                        >
                          {workstream.data?.title ?? "Open workstream"}
                        </Link>
                      ) : null,
                    ],
                  ]}
                />
                <Box className="pt-200">
                  <SchemaLink table="tasks" id={task.id} />
                </Box>
              </Inspector.Group>
            </Shell.Aside>
          </>
        ) : (
          <EmptyState
            illustration="search"
            title="Task not found"
            description="This task may have been removed or may not belong to your workspace."
          />
        )}
      </QueryState>
    </Stack>
  );
}
