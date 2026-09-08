import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  Badge,
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Button,
  Editable,
  Empty,
  Inspector,
  RecordHeader,
  Section,
  ShowPage,
} from "@ledger/design-system";

import { RecordActivity } from "@/components/app/record-activity";
import { Shell } from "@/components/app/shell";
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
      <Shell>
        <Empty
          title={tasksRestored() ? "Task not found" : "Loading task"}
          description={
            tasksRestored()
              ? "This task is not available in this workspace."
              : "Restoring your saved tasks."
          }
        />
      </Shell>
    );
  const program = programs.find((p) => p.id === task.program);
  const done = task.state === "Done";

  return (
    <Shell>
      <ShowPage
        rail={
          <Inspector.Group title="Details">
            <TaskProperties task={task} me={me} people={people} />
          </Inspector.Group>
        }
        header={
          <RecordHeader
            crumbs={
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
            }
            id={task.id}
            title={
              <Editable.Text
                label="Title"
                value={task.title}
                onChange={noop}
                save={async (next) => renameTask(task.id, next, me)}
              />
            }
            meta={
              <Badge variant="secondary" tone={stateTone(task.state)}>
                {task.state}
              </Badge>
            }
            actions={
              <Button
                variant={done ? "secondary" : "primary"}
                onClick={() => (done ? reopenTask(task.id, me) : completeTask(task.id, me))}
              >
                {done ? "Reopen" : "Complete"}
              </Button>
            }
          />
        }
      >
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
      </ShowPage>
    </Shell>
  );
}
