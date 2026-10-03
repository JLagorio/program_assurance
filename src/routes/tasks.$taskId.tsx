import { ProgramCollection } from "@/components/prototype/program-shared";
import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Composer,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Editable,
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
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { useSetTaskDue } from "@/lib/due-dates";
import { usePostTaskComment } from "@/lib/task-comments";
import { labelFor, type DataRecord } from "@/lib/records";
import { taskPriorities, taskStatuses } from "@/lib/status";
import { useRecordTitle } from "@/components/app/browser-title";
import { Page, RecordPending } from "@/components/app/shell";
import { useWorkspace } from "@/components/app/workspace";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { RelationName } from "@/components/prototype/record-tools";
import {
  DetailFacts,
  DueDate,
  MissingRecord,
  ModelForm,
  QueryState,
  type FormTarget,
} from "@/components/prototype/work-common";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskRoute,
  head: () => ({ meta: [{ title: "Task — Program Assurance" }] }),
  pendingComponent: RecordPending,
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

/**
 * The task's comment, written in place and posted as the reader. A failed post keeps the draft
 * with the reason under the field, and sending it again never posts it twice: the same words keep
 * the id of their first try. A draft, or a post on its way, is asked about before the page is
 * left, as a form's is.
 */
function TaskCommentComposer({ taskId }: { taskId: string }) {
  const post = usePostTaskComment();
  const [draft, setDraft] = useState("");
  const attempt = useRef<{ body: string; id: string } | null>(null);
  const guard = useDraftGuard({
    dirty: draft.trim() !== "",
    // The composer stays on the page; nothing closes it.
    onClose: () => {},
    description: "The comment you were writing will be lost.",
  });
  async function send(body: string) {
    const id = attempt.current?.body === body ? attempt.current.id : crypto.randomUUID();
    attempt.current = { body, id };
    // The composer itself refuses a second send while one is on its way.
    guard.start();
    try {
      await post.mutateAsync({ id, taskId, body });
      attempt.current = null;
    } finally {
      guard.finish();
    }
  }
  return (
    <>
      <Composer
        label="Comment on this task"
        submitLabel="Comment"
        value={draft}
        onValueChange={setDraft}
        onSubmit={send}
        errorMessage={(error) => {
          const reason = error instanceof Error && error.message ? error.message : "";
          const sentence = /[.!?]$/.test(reason)
            ? reason
            : `${reason || "The comment was not posted"}.`;
          return `${sentence} Sending it again will not post it twice.`;
        }}
      />
      {guard.confirmation}
    </>
  );
}

/**
 * The task's Due, edited in place in its Details: a calendar day, saved as the task's next
 * revision. A viewer reads the day and where it stands (overdue, due today, due soon) while the
 * task is open. An unsaved day is asked about before the page is left, as a form's draft is.
 */
function TaskDueEditor({
  task,
  canEdit,
  lockedReason,
  onSave,
}: {
  task: Row<"tasks">;
  canEdit: boolean;
  /** Why the day waits for now: another save of the task is on its way. */
  lockedReason: string | undefined;
  /** Saves the ISO day, "" for none; a refusal keeps the day for Try again. */
  onSave: (day: string) => Promise<unknown>;
}) {
  const [due, setDueDay] = useState(task.due_on ?? "");
  const [draft, setDraft] = useState<string | null>(null);
  // A newer revision of the task (this save's own, read back, or another session's) shows its day.
  const [shown, setShown] = useState(task.revision);
  if (task.revision !== shown) {
    setShown(task.revision);
    setDueDay(task.due_on ?? "");
  }
  const guard = useDraftGuard({
    dirty: draft !== null,
    // The day stays on the page; nothing closes it.
    onClose: () => {},
    description: "The due date you were changing will be lost.",
  });
  if (!canEdit)
    return (
      <DueDate
        value={task.due_on}
        done={task.status === "done"}
        cancelled={task.status === "cancelled"}
      />
    );
  return (
    <>
      <Editable.Date
        label="Due"
        value={due}
        due={task.status !== "cancelled"}
        complete={task.status === "done"}
        placeholder="No due date"
        lockedReason={lockedReason}
        onValueChange={setDueDay}
        onDraftChange={setDraft}
        save={onSave}
      />
      {guard.confirmation}
    </>
  );
}

function TaskDetail({ taskId }: { taskId: string }) {
  const workspace = useWorkspace();
  const eventTime = useEventTime();
  const taskQuery = useRow("tasks", taskId);
  const task = taskQuery.data;
  useRecordTitle("Task", task?.title);
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  const comments = useRows("comments", { task_id: taskId });
  const activity = useRows("activity_events", { task_id: taskId });
  const save = useModelSave("tasks");
  const setDue = useSetTaskDue();
  const [form, setForm] = useState<FormTarget | null>(null);
  const [error, setError] = useState("");
  // The revision of this page's last save, until the task read back carries it: the next save
  // (Complete, a new due day) is made at it, not at the revision the page last read.
  const savedRevision = useRef(0);
  const revision = () => Math.max(task?.revision ?? 0, savedRevision.current);
  const saved = (row: Row<"tasks">) => {
    savedRevision.current = Math.max(savedRevision.current, row.revision);
  };
  const canEdit = workspace.role !== "viewer";
  // While Complete or Reopen or the due day saves, the task's revision is about to change: an edit
  // opened now would carry the old one and fail as a stale write, so the menu items wait and say
  // why, and so does the due day.
  const saving = save.isPending || setDue.isPending;
  const pending = saving ? { disabledReason: "The task is being saved." } : {};
  function open(target: FormTarget) {
    // The trigger stays enabled while its dialog is open; a second press opens nothing new.
    if (!form) setForm(target);
  }
  async function toggleDone() {
    if (!task || saving) return;
    const completing = task.status !== "done";
    setError("");
    try {
      const row = await save.mutateAsync({
        id: task.id,
        revision: revision(),
        values: {
          status: completing ? "done" : "open",
          completed_at: completing ? new Date().toISOString() : null,
        },
      });
      saved(row);
      toast.add({ title: completing ? "Task completed" : "Task reopened", type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Try again in a moment.");
    }
  }
  return (
    <Page>
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      {/* The page is one failure region: an outage of the task, its assignments, its comments and
          its activity reads as one alert at the top, whose Retry reloads all of them. */}
      <QueryState queries={[taskQuery]} region>
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
            {/* The Details: a rail beside the body, or on a phone a Details disclosure here, under
                the title, whose row carries the task's status. */}
            <Shell.Aside
              label="Task details"
              summary={<StatusBadge statuses={taskStatuses} value={task.status} />}
            >
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
                    [
                      "Due",
                      // A calendar day, set in place. A viewer reads where it stands while the
                      // task is open: overdue, due today or due soon, as My work's Due column does.
                      <TaskDueEditor
                        task={task}
                        canEdit={canEdit}
                        lockedReason={
                          save.isPending ? "Wait for the task to finish saving." : undefined
                        }
                        onSave={async (day) =>
                          saved(
                            await setDue.mutateAsync({ id: task.id, revision: revision(), day }),
                          )
                        }
                      />,
                    ],
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
              {/* One of the record's collections: the compact shape, under its own heading. */}
              <ProgramCollection
                name="task_assignments"
                title="Assignments"
                section
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
              <Section title="Comments">
                <Stack space="space.200">
                  {/* Written here, above the feed: a posted comment lands at the top, under it. */}
                  {canEdit && <TaskCommentComposer taskId={task.id} />}
                  <QueryState queries={[comments]}>
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
                              ? "Write the first comment to share an update about this task."
                              : "Comments about this task will appear here."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                  </QueryState>
                </Stack>
              </Section>
              <Section title="Activity">
                <QueryState queries={[activity]}>
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
          </>
        ) : (
          <MissingRecord backTo="/work" kind="Task" />
        )}
      </QueryState>
    </Page>
  );
}
