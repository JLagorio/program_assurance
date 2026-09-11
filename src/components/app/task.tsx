import type { ReactElement, ReactNode } from "react";

import {
  Box,
  Person,
  Badge,
  TaskRow as SharedTaskRow,
  Item,
  type ItemSize,
  cn,
} from "@ledger/design-system";

/* A task is the atom of the work: a verb, an object, a name and a date. It is asked on a record,
   listed on that record and in the assignee's queue, and it closes when what it asked for exists.
   A row is one line: the box, the title, then who has it, when it is due and whether it is waiting
   on someone. Done is the absence of a badge and a line through the title. */

export type TaskState = "open" | "waiting" | "blocked" | "done";

export type TaskProps = {
  /** The ask, as a verb and an object: "Confirm the account review procedure". Text, so the box can name it. */
  title: string;
  /** `open`, the default; `waiting` on someone outside; `blocked`; `done`. */
  state?: TaskState | undefined;
  /** The box. Called with true to complete and false to reopen. Without it there is no box: a list the reader only reads. */
  onDoneChange?: ((done: boolean) => void) | undefined;
  /** Who has it, by full name. */
  assignee?: string | undefined;
  /** When it is due, as the reader would say it: "Fri 4 Sep", "Today", "3d overdue". */
  due?: ReactNode;
  /** The machine-readable due date, for the `<time>` element. */
  dueDateTime?: string | undefined;
  /** Past due and not done: the due reads in the danger colour. */
  overdue?: boolean | undefined;
  /** Who it waits on, by full name, when `waiting`. */
  waitingOn?: string | undefined;
  /** Where it sits, when the list spans records: the record's id and name. Inline after the title. */
  subject?: ReactNode;
  /** A link element (a router's Link) that becomes the title and stretches over the row. */
  link?:
    | ReactElement<{
        id?: string | undefined;
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Makes the title a button that stretches over the row. */
  onSelect?: (() => void) | undefined;
  /** Buttons at the end of the row: reassign, a menu. */
  actions?: ReactNode;
  className?: string | undefined;
};

/** One task on one line: the box, the ask, where it sits, then who has it, when, and what it waits on. */
function ProductTaskRow({
  title,
  state = "open",
  onDoneChange,
  assignee,
  due,
  dueDateTime,
  overdue,
  waitingOn,
  subject,
  link,
  onSelect,
  actions,
  className,
}: TaskProps) {
  const done = state === "done";
  const badge =
    state === "waiting" ? (
      <Badge variant="secondary" size="xsmall" tone="information">
        Waiting{waitingOn ? <span className="hidden sm:inline"> on {waitingOn}</span> : null}
      </Badge>
    ) : state === "blocked" ? (
      <Badge variant="secondary" size="xsmall" tone="danger">
        Blocked
      </Badge>
    ) : null;
  return (
    <SharedTaskRow
      title={title}
      completed={done}
      onCompletedChange={onDoneChange}
      assignee={
        assignee ? (
          <Person name={assignee} className="hidden font-body-small text-subtle sm:flex" />
        ) : undefined
      }
      due={
        due ? (
          <Box
            as="span"
            className={cn(overdue && !done ? "font-medium text-danger" : "text-subtle")}
          >
            {due}
          </Box>
        ) : undefined
      }
      dueDateTime={dueDateTime}
      status={badge}
      meta={subject ? <span className="hidden md:inline">{subject}</span> : undefined}
      actions={actions}
      link={link}
      onSelect={onSelect}
      className={className}
    />
  );
}

export type TaskListProps = {
  /** Task rows. */
  children?: ReactNode;
  /** A heading over the rows: "Tasks", "Waiting on others". */
  title?: ReactNode;
  /** A Count after the title. */
  count?: number | undefined;
  /** At the end of the heading's line: "Add task". */
  action?: ReactNode;
  /** What to say when there are none. A string is a compact Empty's title. */
  empty?: ReactNode;
  /** `compact` tightens the rows, for a rail. */
  size?: ItemSize | undefined;
  /** The id of a heading outside the list that names it. */
  labelledBy?: string | undefined;
  /** Rows run edge to edge of the card they sit in. */
  flush?: boolean | undefined;
  className?: string | undefined;
};

/** The rows stacked, with the empty state when there are none. */
function TaskList({
  children,
  title,
  count,
  action,
  empty = "No tasks",
  size,
  labelledBy,
  flush,
  className,
}: TaskListProps) {
  return (
    <Item.Group
      title={title}
      count={count}
      trailing={action}
      empty={empty}
      size={size}
      labelledBy={labelledBy}
      flush={flush}
      className={className}
    >
      {children}
    </Item.Group>
  );
}

export const Task = Object.assign(ProductTaskRow, { List: TaskList });
