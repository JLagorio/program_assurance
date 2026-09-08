import { MoreHorizontal, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Field,
  IconButton,
  NativeSelect,
  Section,
} from "@ledger/design-system";
import { Box, Grid, Inline, Stack } from "@ledger/design-system";

import { Task } from "@/components/app/task";
import { SubjectWords } from "@/components/app/subject-link";
import { TaskDialog } from "@/components/app/task-dialog";
import { programPresets, TaskTable } from "@/components/app/task-table";
import type { Subject } from "@/lib/activity";
import { mentionablePeople } from "@/lib/people";
import {
  completeTask,
  dueLabel,
  isOverdue,
  openTasks,
  reassignTask,
  reopenTask,
  setTaskDue,
  setTaskState,
  tasksFor,
  tasksForProgram,
  useTasksVersion,
  type Task as TaskRecord,
  type TaskState,
} from "@/lib/tasks";

/* The subject links live in subject-link.tsx; re-exported for the records that import them here. */
export { SubjectLink, SubjectWords } from "@/components/app/subject-link";

/* ------------------------------------------------------------------ Rows */

const stateOf = (t: TaskRecord) =>
  t.state === "Done"
    ? "done"
    : t.state === "Waiting"
      ? "waiting"
      : t.state === "Blocked"
        ? "blocked"
        : "open";

/** Task rows over the records in `tasks`: the box completes, the menu edits. */
export function TaskRows({
  tasks,
  me,
  showSubject = false,
}: {
  tasks: TaskRecord[];
  me: string;
  showSubject?: boolean | undefined;
}) {
  const [editing, setEditing] = useState<{ task: TaskRecord; state?: TaskState } | null>(null);
  return (
    <>
      {tasks.map((t) => (
        <Task
          key={t.id}
          title={t.title}
          state={stateOf(t)}
          onDoneChange={(done) => (done ? completeTask(t.id, me) : reopenTask(t.id, me))}
          assignee={t.assignee}
          due={dueLabel(t)}
          dueDateTime={t.due ?? undefined}
          overdue={isOverdue(t)}
          waitingOn={t.waitingOn ?? undefined}
          subject={
            showSubject ? <SubjectWords subject={t.subject} program={t.program} /> : undefined
          }
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <IconButton
                    label={`Actions for "${t.title}"`}
                    variant="subtle"
                    size="small"
                    icon={<MoreHorizontal />}
                  />
                }
              />
              <DropdownMenuContent align="end" style={{ width: 200 }}>
                <DropdownMenuItem
                  onClick={() => {
                    setEditing({ task: t });
                  }}
                >
                  Edit task
                </DropdownMenuItem>
                {t.state !== "Done" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing({ task: t, state: "Waiting" });
                    }}
                  >
                    Waiting on…
                  </DropdownMenuItem>
                ) : null}
                {t.state !== "Done" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setTaskState(t.id, t.state === "Blocked" ? "Open" : "Blocked", me);
                    }}
                  >
                    {t.state === "Blocked" ? "Mark open" : "Mark blocked"}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() => {
                    if (t.state === "Done") reopenTask(t.id, me);
                    else completeTask(t.id, me);
                  }}
                >
                  {t.state === "Done" ? "Reopen" : "Complete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      ))}
      {editing ? (
        <TaskEditDialog
          task={editing.task}
          startState={editing.state}
          me={me}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function TaskEditDialog({
  task,
  startState,
  me,
  onClose,
}: {
  task: TaskRecord;
  startState?: TaskState | undefined;
  me: string;
  onClose: () => void;
}) {
  const [assignee, setAssignee] = useState(task.assignee);
  const [state, setState] = useState<TaskState>(startState ?? task.state);
  const [waitingOn, setWaitingOn] = useState(task.waitingOn ?? "");
  const [due, setDue] = useState(task.due ?? "");
  const people = mentionablePeople(task.program);
  const options = people.map((p) => ({ value: p.name, label: p.name, meta: p.meta }));

  const save = () => {
    if (assignee !== task.assignee) reassignTask(task.id, assignee, me);
    if ((due || null) !== task.due) setTaskDue(task.id, due || null, me);
    if (state !== task.state || (state === "Waiting" && waitingOn !== task.waitingOn)) {
      setTaskState(task.id, state, me, state === "Waiting" ? waitingOn || null : null);
    }
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit task"
      eyebrow={task.title}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Grid
          gap="space.150"
          templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
        >
          <Field label="Assignee">
            <Combobox
              value={assignee}
              onChange={setAssignee}
              options={options}
              width={300}
              className="w-full"
            />
          </Field>
          <Field label="Due">
            <DatePicker value={due} onChange={setDue} placeholder="Choose a day" />
          </Field>
        </Grid>
        <Grid
          gap="space.150"
          templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
        >
          <Field label="State">
            <NativeSelect
              value={state}
              onChange={(e) => setState(e.target.value as TaskState)}
              aria-label="State"
            >
              {(["Open", "Waiting", "Blocked", "Done"] as TaskState[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {state === "Waiting" ? (
            <Field label="Waiting on">
              <Combobox
                value={waitingOn}
                onChange={setWaitingOn}
                options={options}
                placeholder="Choose a person"
                width={300}
                className="w-full"
              />
            </Field>
          ) : null}
        </Grid>
      </Stack>
    </Dialog>
  );
}

/* --------------------------------------------------------------- Section */

/** A record's tasks: open first, done folded, Add task in the heading. */
export function TasksSection({
  program,
  subject,
  me,
  title = "Tasks",
  extra,
}: {
  program: string;
  subject: Subject;
  me: string;
  title?: string | undefined;
  /** Rows before the tasks: the asks a control's gates make. */
  extra?: ReactNode;
}) {
  useTasksVersion();
  const all = tasksFor(subject, program);
  const open = all.filter((t) => t.state !== "Done");
  const done = all.filter((t) => t.state === "Done");
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <Section
      title={title}
      count={open.length || null}
      action={
        <Button size="small" iconBefore={<Plus />} onClick={() => setAdding(true)}>
          Add task
        </Button>
      }
    >
      <Stack space="space.100" className="pt-100">
        <Task.List empty={extra ? undefined : "No tasks. Ask for something from the log bar."}>
          {extra}
          <TaskRows tasks={showDone ? [...open, ...done] : open} me={me} />
        </Task.List>
        {done.length ? (
          <Inline>
            <Button size="small" variant="subtle" onClick={() => setShowDone((s) => !s)}>
              {showDone ? "Hide done" : `Show done (${done.length})`}
            </Button>
          </Inline>
        ) : null}
      </Stack>
      <TaskDialog
        open={adding}
        onClose={() => setAdding(false)}
        program={program}
        subject={subject}
        requester={me}
      />
    </Section>
  );
}

/* --------------------------------------------------------- Program tab */

/** The program's tasks across every record: a table banded by when, a saved view per question, every cell edited in place, a row opening beside the list. */
export function ProgramTasks({ programId, me }: { programId: string; me: string }) {
  useTasksVersion();
  const all = tasksForProgram(programId);
  return (
    <Section title="Tasks" count={openTasks(all).length || null}>
      <Box paddingBlockStart="space.100">
        <TaskTable
          tasks={all}
          me={me}
          label="Program tasks"
          view="program-tasks"
          showSubject
          presets={programPresets(me)}
          defaultPreset="open"
          add={{ program: programId, subject: { kind: "program", id: programId } }}
          empty={{ title: "No tasks match", description: "Change the view or the filters." }}
        />
      </Box>
    </Section>
  );
}
