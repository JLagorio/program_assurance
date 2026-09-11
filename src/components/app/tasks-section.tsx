import {
  FieldLabel,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Box,
  Button,
  Combobox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  Grid,
  IconButton,
  Inline,
  Section,
  Stack,
} from "@ledger/design-system";
import { MoreHorizontal, Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { SubjectLink } from "@/components/app/subject-link";
import { Task } from "@/components/app/task";
import { TaskDialog } from "@/components/app/task-dialog";
import { programPresets, TaskTable } from "@/components/app/task-table";
import { type Subject } from "@/lib/activity";
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
          onSelect={() => setEditing({ task: t })}
          due={dueLabel(t)}
          dueDateTime={t.due ?? undefined}
          overdue={isOverdue(t)}
          waitingOn={t.waitingOn ?? undefined}
          subject={
            showSubject ? <SubjectLink subject={t.subject} program={t.program} /> : undefined
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
  const fieldId = useId();

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

  const stateItems = (["Open", "Waiting", "Blocked", "Done"] as TaskState[]).map((s) => ({
    value: s,
    label: s,
  }));
  const assigneeItems = options;
  const waitingOnItems = options;
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <Box className="flex items-center gap-100 pb-025">{task.title}</Box>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <Stack space="space.150">
            <Grid
              gap="space.150"
              templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
            >
              <Field>
                <FieldLabel id={`${fieldId}-assignee-1-label`} htmlFor={`${fieldId}-assignee-1`}>
                  {"Assignee"}
                </FieldLabel>
                <div className={"w-full"} style={{ width: 300, maxWidth: "100%" }}>
                  <Combobox<(typeof assigneeItems)[number]>
                    items={assigneeItems}

                    isItemEqualToValue={(item, selected) => item.value === selected.value}
                    filter={(item, query) =>
                      [item.label, item.value, "keywords" in item ? item.keywords : ""]
                        .join(" ")
                        .toLocaleLowerCase()
                        .includes(query.toLocaleLowerCase())
                    }
                    value={assigneeItems.find((item) => item.value === assignee) ?? null}
                    onValueChange={(item) => setAssignee(item?.value ?? "")}
                  >
                    <ComboboxInput
                      id={`${fieldId}-assignee-1`}
                      aria-labelledby={`${fieldId}-assignee-1-label`}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                      <ComboboxList aria-labelledby={`${fieldId}-assignee-1-label`}>
                        {(item) => (
                          <ComboboxItem
                            key={item.value}
                            value={item}
                            disabled={"disabled" in item && Boolean(item.disabled)}
                          >
                            <span className="min-w-0 flex-1">{item.label}</span>
                            {"meta" in item && item.meta ? (
                              <span className="text-subtle font-body-small">
                                {String(item.meta)}
                              </span>
                            ) : null}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-due-2-label`} htmlFor={`${fieldId}-due-2`}>
                  {"Due"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-due-2`}
                  aria-labelledby={`${fieldId}-due-2-label`}
                  value={due}
                  onChange={setDue}
                  placeholder="Choose a day"
                />
              </Field>
            </Grid>
            <Grid
              gap="space.150"
              templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
            >
              <Field>
                <FieldLabel id={`${fieldId}-state-3-label`} htmlFor={`${fieldId}-state-3`}>
                  {"State"}
                </FieldLabel>
                <Select<string>
                  items={stateItems}
                  value={state}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return setState(value as TaskState);
                  }}
                >
                  <SelectTrigger id={`${fieldId}-state-3`} className="w-full" aria-label="State">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-state-3-label`}>
                    {stateItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {state === "Waiting" ? (
                <Field>
                  <FieldLabel
                    id={`${fieldId}-waiting-on-4-label`}
                    htmlFor={`${fieldId}-waiting-on-4`}
                  >
                    {"Waiting on"}
                  </FieldLabel>
                  <div className={"w-full"} style={{ width: 300, maxWidth: "100%" }}>
                    <Combobox<(typeof waitingOnItems)[number]>
                      items={waitingOnItems}

                      isItemEqualToValue={(item, selected) => item.value === selected.value}
                      filter={(item, query) =>
                        [item.label, item.value, "keywords" in item ? item.keywords : ""]
                          .join(" ")
                          .toLocaleLowerCase()
                          .includes(query.toLocaleLowerCase())
                      }
                      value={waitingOnItems.find((item) => item.value === waitingOn) ?? null}
                      onValueChange={(item) => setWaitingOn(item?.value ?? "")}
                    >
                      <ComboboxInput
                        id={`${fieldId}-waiting-on-4`}
                        aria-labelledby={`${fieldId}-waiting-on-4-label`}
                        placeholder="Choose a person"
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                        <ComboboxList aria-labelledby={`${fieldId}-waiting-on-4-label`}>
                          {(item) => (
                            <ComboboxItem
                              key={item.value}
                              value={item}
                              disabled={"disabled" in item && Boolean(item.disabled)}
                            >
                              <span className="min-w-0 flex-1">{item.label}</span>
                              {"meta" in item && item.meta ? (
                                <span className="text-subtle font-body-small">
                                  {String(item.meta)}
                                </span>
                              ) : null}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                </Field>
              ) : null}
            </Grid>
          </Stack>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
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
  const visible = showDone ? [...open, ...done] : open;

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
        <Task.List empty={extra ? undefined : "No open tasks."}>
          {extra}
          {visible.length ? <TaskRows tasks={visible} me={me} /> : null}
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
