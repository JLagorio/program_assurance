import { ProgramCollection } from "@/components/prototype/program-shared";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Inspector,
  PageHeader,
  Prose,
  Section,
  Shell,
  Stack,
  TextLink,
  Timeline,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { AlertCircle, ChevronDown, History, MessageSquare } from "lucide-react";
import { useModelSave, useRow, useRows } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { taskPriorities, taskStatuses } from "@/lib/status";
import { useWorkspace } from "@/components/app/workspace";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { RelationName } from "@/components/prototype/record-tools";
import {
  DetailFacts,
  MissingRecord,
  ModelForm,
  QueryState,
  type FormTarget,
} from "@/components/prototype/work-common";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskRoute,
  head: () => ({ meta: [{ title: "Task — Program Assurance" }] }),
});
function TaskRoute() {
  const { taskId } = Route.useParams();
  return <TaskDetail key={taskId} taskId={taskId} />;
}

/**
 * An event's time on a feed: the day and the minute in the reader's zone, so two comments from
 * the same day keep their order, with the full stamp as the tooltip and the ISO value as `<time>`.
 */
function useEventTime() {
  const { formatDate } = useLedgerLocale();
  return (value: string) => {
    const instant = new Date(value);
    return {
      time: formatDate(instant, { dateStyle: "medium", timeStyle: "short" }),
      timeTitle: formatDate(instant, { dateStyle: "full", timeStyle: "long" }),
      dateTime: value,
    };
  };
}

/** An event's recorded sentence as a title, starting with a capital; its kind when it has none. */
function eventTitle(description: string | null, kind: string) {
  const text = description?.trim() || labelFor(kind);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Newest first, as a feed reads down the page. */
function newestFirst<T>(rows: readonly T[], at: (row: T) => string) {
  return [...rows].sort((a, b) => at(b).localeCompare(at(a)));
}

function TaskDetail({ taskId }: { taskId: string }) {
  const workspace = useWorkspace();
  const eventTime = useEventTime();
  const taskQuery = useRow("tasks", taskId);
  const task = taskQuery.data;
  const parties = useRows("parties");
  const comments = useRows("comments", { task_id: taskId });
  const activity = useRows("activity_events", { task_id: taskId });
  const save = useModelSave("tasks");
  const [form, setForm] = useState<FormTarget | null>(null);
  const [error, setError] = useState("");
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  const canEdit = workspace.role !== "viewer";
  // While Complete or Reopen saves, the task's revision is about to change: an edit opened now
  // would carry the old one and fail as a stale write, so both menu items wait and say why.
  const pending = save.isPending ? { disabledReason: "The task is being saved." } : {};
  function open(target: FormTarget) {
    // The trigger stays enabled while its dialog is open; a second press opens nothing new.
    if (!form) setForm(target);
  }
  async function toggleDone() {
    if (!task || save.isPending) return;
    const completing = task.status !== "done";
    setError("");
    try {
      await save.mutateAsync({
        id: task.id,
        revision: task.revision,
        values: {
          status: completing ? "done" : "open",
          completed_at: completing ? new Date().toISOString() : null,
        },
      });
      toast.add({ title: completing ? "Task completed" : "Task reopened", type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Try again in a moment.");
    }
  }
  const commentAction =
    task && canEdit ? (
      <Button
        size="small"
        onClick={() =>
          open({
            table: "comments",
            initialValues: { task_id: task.id, ...(me ? { author_party_id: me.id } : {}) },
          })
        }
      >
        Create comment
      </Button>
    ) : undefined;
  return (
    <Stack space="space.200" className="min-w-0">
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      <QueryState queries={[taskQuery]}>
        {task ? (
          <>
            <PageHeader>
              <RecordTrail current={task.title}>
                <TrailLink to="/work">My work</TrailLink>
                <TrailLink to="/programs/$programId" params={{ programId: task.program_id }}>
                  <RelationName table="programs" id={task.program_id} />
                </TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{task.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button iconAfter={<ChevronDown />}>Actions</Button>}
                  />
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <>
                        <DropdownMenuItem
                          onClick={() => open({ table: "tasks", existing: task as DataRecord })}
                          {...pending}
                        >
                          Edit task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void toggleDone()} {...pending}>
                          {task.status === "done" ? "Reopen task" : "Complete task"}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuLinkItem
                      closeOnClick
                      render={
                        <Link
                          to="/records/$collection/$recordId"
                          params={{ collection: "tasks", recordId: task.id }}
                        />
                      }
                    >
                      Inspect record
                    </DropdownMenuLinkItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PageHeader.Actions>
            </PageHeader>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle aria-hidden />
                <AlertTitle>The task was not saved</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Stack space="space.300" className="min-w-0">
              <Section title="Note">
                {task.description ? (
                  <Box className="max-w-layout-measure">
                    <Prose>{task.description}</Prose>
                  </Box>
                ) : (
                  <Absent label="No note recorded" />
                )}
              </Section>
              <Section title="Assignments">
                <ProgramCollection
                  name="task_assignments"
                  title="Assignments"
                  filters={{ task_id: task.id }}
                  initialValues={{ task_id: task.id }}
                  columns={[
                    {
                      key: "party_id",
                      title: "Person",
                      value: (row) =>
                        parties.data?.find((party) => party.id === row["party_id"])?.name ?? null,
                      render: (row) => (
                        <RelationName table="parties" id={row["party_id"] as string | null} />
                      ),
                    },
                    {
                      key: "assignment_role",
                      title: "Role",
                      value: (row) => labelFor(String(row["assignment_role"])),
                    },
                  ]}
                  empty={{
                    title: "No assignments yet",
                    description: "Assign a person to record their responsibility for this task.",
                    illustration: "people",
                  }}
                />
              </Section>
              <Section title="Comments" action={commentAction}>
                <QueryState queries={[comments]} retryLabel="Retry loading comments">
                  {comments.data?.length ? (
                    <Timeline label="Comments" wrap>
                      {newestFirst(comments.data, (comment) => comment.created_at).map(
                        (comment) => (
                          <Timeline.Item
                            key={comment.id}
                            title={<RelationName table="parties" id={comment.author_party_id} />}
                            {...eventTime(comment.created_at)}
                          >
                            <Prose>{comment.body}</Prose>
                          </Timeline.Item>
                        ),
                      )}
                    </Timeline>
                  ) : (
                    <Empty size="compact">
                      <EmptyMedia variant="icon" aria-hidden>
                        <MessageSquare />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>No comments yet</EmptyTitle>
                        <EmptyDescription>
                          {canEdit
                            ? "Create a comment to share an update about this task."
                            : "Comments about this task will appear here."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </QueryState>
              </Section>
              <Section title="Activity">
                <QueryState queries={[activity]} retryLabel="Retry loading activity">
                  {activity.data?.length ? (
                    <Timeline label="Activity" size="small" wrap>
                      {newestFirst(activity.data, (event) => event.occurred_at).map((event) => (
                        <Timeline.Item
                          key={event.id}
                          title={eventTitle(event.description, event.event_type)}
                          {...(event.actor_party_id
                            ? { meta: <RelationName table="parties" id={event.actor_party_id} /> }
                            : {})}
                          {...eventTime(event.occurred_at)}
                        />
                      ))}
                    </Timeline>
                  ) : (
                    <Empty size="compact">
                      <EmptyMedia variant="icon" aria-hidden>
                        <History />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>No activity yet</EmptyTitle>
                        <EmptyDescription>
                          Recorded changes to this task will appear here.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </QueryState>
              </Section>
            </Stack>
            <Shell.Aside label="Task details">
              <Inspector.Group title="Details">
                <DetailFacts
                  facts={[
                    ["Status", <StatusBadge statuses={taskStatuses} value={task.status} />],
                    [
                      "Priority",
                      task.priority ? (
                        <LevelIndicator levels={taskPriorities} value={task.priority} />
                      ) : null,
                    ],
                    ["Due", task.due_at ? <DateTime value={task.due_at} format="date" /> : null],
                    [
                      "Completed",
                      task.completed_at ? <DateTime value={task.completed_at} /> : null,
                    ],
                    [
                      "Workstream",
                      task.workstream_id ? (
                        <TextLink
                          render={
                            <Link
                              to="/workstreams/$workstreamId"
                              params={{ workstreamId: task.workstream_id }}
                            />
                          }
                        >
                          <RelationName table="workstreams" id={task.workstream_id} />
                        </TextLink>
                      ) : null,
                    ],
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
          </>
        ) : (
          <MissingRecord backTo="/work" kind="Task" />
        )}
      </QueryState>
    </Stack>
  );
}
