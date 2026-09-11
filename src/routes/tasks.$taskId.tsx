import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
  Inline,
  PageHeader,
  Shell,
  Stack,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  Badge,
  Box,
  BreadcrumbLink,
  Button,
  Editable,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Inspector,
  Section,
} from "@ledger/design-system";

import { RecordActivity } from "@/components/app/record-activity";
import { stateTone, TaskProperties } from "@/components/app/task-table";
import { useActivityVersion } from "@/lib/activity";
import { currentSession } from "@/lib/control-work";
import { programs } from "@/lib/grc-data";
import { mentionablePeople } from "@/lib/people";
import {
  completeTask,
  renameTask,
  reopenTask,
  setTaskNote,
  taskById,
  tasksRestored,
  useTasksVersion,
} from "@/lib/tasks";

/**
 * The task record: the full page behind the panel. Header is the trail, the title and Complete;
 * the rail is the properties, every one edited in place; the body is the note and the task's own log.
 */
export const Route = createFileRoute("/tasks/$taskId")({
  loader: ({ params }) => {
    // Browser-saved tasks are restored after mount; the server cannot decide
    // whether a well-formed task ID exists in this user's workspace.
    if (!/^TSK-\d+$/.test(params.taskId)) throw notFound();
  },
  head: ({ params }) => ({ meta: [{ title: `${params.taskId} — Equinox` }] }),
  component: TaskPage,
});

const noop = () => undefined;

function TaskPage() {
  const { taskId } = Route.useParams();
  useTasksVersion();
  useActivityVersion();
  const task = taskById(taskId);
  const me = currentSession().name;
  const people = useMemo(
    () => mentionablePeople(task?.program).map((p) => p.name),
    [task?.program],
  );
  if (!task)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{tasksRestored() ? "Task not found" : "Loading task"}</EmptyTitle>
          <EmptyDescription>
            {tasksRestored()
              ? "This task is not available in this workspace."
              : "Restoring your saved tasks."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  const program = programs.find((p) => p.id === task.program);
  const done = task.state === "Done";

  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <Breadcrumb className="col-span-full">
          <BreadcrumbList>
            <>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/work" />}>My work</BreadcrumbLink>
              </BreadcrumbItem>
              {program ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link
                          to="/programs/$programId"
                          params={{ programId: program.id }}
                          search={{ tab: "Schedule", scheduleView: "Tasks", peek: undefined }}
                        />
                      }
                    >
                      {program.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              ) : null}
            </>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Id>{task.id}</Id>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="min-w-0">
          <PageHeader.Title>
            <Editable.Text
              label="Title"
              value={task.title}
              onChange={noop}
              save={async (next) => renameTask(task.id, next, me)}
            />
          </PageHeader.Title>
          <Inline
            space="space.100"
            alignBlock="center"
            shouldWrap
            className="pt-050 font-body-small text-subtle"
          >
            <Badge variant="secondary" tone={stateTone(task.state)}>
              {task.state}
            </Badge>
          </Inline>
        </div>
        <PageHeader.Actions>
          <Button
            variant={done ? "secondary" : "primary"}
            onClick={() => (done ? reopenTask(task.id, me) : completeTask(task.id, me))}
          >
            {done ? "Reopen" : "Complete"}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <Stack space="space.300" className="min-w-0 pt-200">
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
      <Shell.Aside label="Record properties">
        <Inspector.Group title="Details">
          <TaskProperties task={task} me={me} people={people} />
        </Inspector.Group>
      </Shell.Aside>
    </Stack>
  );
}
