import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Bleed } from "../primitives/bleed";
import { DropdownMenu } from "./dropdown-menu";
import { Spinner } from "./spinner";
import { Absent } from "./typography";

/* A value edited where it sits: the reader clicks it, changes it, and it saves. It commits
   optimistically, rolls back when the save fails, and shows the save state beside the value. At
   rest the value sits flush on the text column and the hover tint reaches space.050 past it, so
   an editable value lines up with the plain values around it; editing, the field's box reaches the
   same distance. One line, 24px, the height of a rail's row and a table's cell. */

type SaveState = "idle" | "saving" | "saved" | "error";

export type EditableProps<T extends string> = {
  /** The field's name, for a screen reader: "Owner", "Status". The KeyValue or the column shows the visible one; this names the control. */
  label: string;
  /** The committed value, shown at rest. */
  value: T;
  /** Called with the next value at once, before the save settles, and with the old one again if the save fails. */
  onChange: (next: T) => void;
  /** Return a message to block the commit, or null when the value is valid. It runs as the reader types and again at the commit. */
  validate?: ((next: string) => string | null) | undefined;
  /** Saves the value. A rejected promise rolls the value back and shows the error's message under it. */
  save: (next: T) => Promise<unknown>;
};

function useOptimisticCommit<T extends string>({
  value,
  onChange,
  validate,
  save,
}: EditableProps<T>) {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const commit = (next: T) => {
    const message = validate?.(next) ?? null;
    if (message) {
      setError(message);
      setState("error");
      return false;
    }
    if (next === value) {
      setError(null);
      setState("idle");
      return true;
    }
    const previous = value;
    setError(null);
    setState("saving");
    onChange(next);
    save(next)
      .then(() => {
        setState("saved");
        timer.current = setTimeout(() => setState("idle"), 1400);
      })
      .catch((e: unknown) => {
        onChange(previous);
        setError(e instanceof Error ? e.message : "Could not save");
        setState("error");
      });
    return true;
  };

  return { state, error, setError, setState, commit };
}

function StateIcon({ state }: { state: SaveState }) {
  if (state === "saving") return <Spinner label="Saving" />;
  if (state === "saved") return <Check aria-hidden className="size-150 icon-success" />;
  if (state === "error") return <AlertCircle aria-hidden className="size-150 icon-danger" />;
  return null;
}

/** The message under the value and what a screen reader hears when a save lands. */
function Message({ id, state, error }: { id: string; state: SaveState; error: string | null }) {
  return (
    <>
      {error ? (
        <p id={id} className="font-body-xsmall text-danger">
          {error}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {state === "saved" ? "Saved" : state === "error" ? "Not saved" : ""}
      </span>
    </>
  );
}

const resting =
  "relative flex w-full items-center gap-075 rounded-small py-025 text-left outline-none focus-visible:outline-focused before:absolute before:-inset-x-050 before:inset-y-0 before:rounded-small before:transition-colors before:duration-fast before:ease-standard hover:before:bg-neutral-subtle-hovered active:before:bg-neutral-subtle-pressed";

export type EditableTextProps = EditableProps<string> & {
  /** What to add, as a noun, shown in the field while it is empty and at rest in place of the dash: "Unassigned", "Add next action". */
  placeholder?: string | undefined;
};

/** One line of text edited in place. Click or Enter opens the field; Enter or leaving commits; Escape puts the old value back. */
function EditableText({ placeholder, ...props }: EditableTextProps) {
  const { state, error, setError, setState, commit } = useOptimisticCommit(props);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.value);
  const button = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const messageId = useId();

  useEffect(() => {
    if (!editing) setDraft(props.value);
  }, [props.value, editing]);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    button.current?.focus();
  }, [editing]);

  const liveError = editing ? (props.validate?.(draft) ?? null) : error;

  return (
    <div className="flex min-w-0 flex-col gap-025">
      {editing ? (
        <Bleed inline="space.050">
          <input
            autoFocus
            aria-label={props.label}
            aria-invalid={liveError ? true : undefined}
            aria-describedby={liveError ? messageId : undefined}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (commit(draft)) setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const ok = commit(draft);
                returnFocus.current = ok;
                if (ok) setEditing(false);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                returnFocus.current = true;
                setDraft(props.value);
                setError(null);
                setState("idle");
                setEditing(false);
              }
            }}
            className={cn(
              "h-control-xsmall w-full rounded-small border bg-input px-050 font-body text-default outline-none focus-visible:outline-focused",
              liveError ? "border-danger" : "border-input focus-visible:border-focused",
            )}
          />
        </Bleed>
      ) : (
        <button ref={button} type="button" onClick={() => setEditing(true)} className={resting}>
          <span className="sr-only">{props.label}: </span>
          <span className={cn("relative min-w-0 truncate", !props.value && "text-subtlest")}>
            {props.value || placeholder || <Absent />}
          </span>
          <span className="relative ms-auto flex shrink-0 items-center">
            <StateIcon state={state} />
          </span>
        </button>
      )}
      <Message id={messageId} state={state} error={liveError} />
    </div>
  );
}

export type EditableSelectProps<T extends string> = EditableProps<T> & {
  /** The values on offer, in the order they show. */
  options: readonly T[];
  /** Draws a value: a Badge for a status, a Person for an owner. Unsaid, the value as text. */
  render?: ((value: T) => ReactNode) | undefined;
};

/** One of a fixed set, edited in place: the row opens a menu of the options with the current one marked, and choosing commits. */
function EditableSelect<T extends string>({ options, render, ...props }: EditableSelectProps<T>) {
  const { state, error, commit } = useOptimisticCommit(props);
  const messageId = useId();
  return (
    <div className="flex min-w-0 flex-col gap-025">
      <DropdownMenu
        align="start"
        width={220}
        trigger={
          <button
            type="button"
            aria-describedby={error ? messageId : undefined}
            className={cn(resting, error && "before:border before:border-danger")}
          >
            <span className="sr-only">{props.label}: </span>
            <span className="relative min-w-0 truncate">
              {render ? render(props.value) : props.value}
            </span>
            <span className="relative ms-auto flex shrink-0 items-center gap-050">
              <StateIcon state={state} />
              <ChevronDown aria-hidden className="size-150 icon-subtle" />
            </span>
          </button>
        }
      >
        <DropdownMenu.Label>{props.label}</DropdownMenu.Label>
        {options.map((o) => (
          <DropdownMenu.Item key={o} isSelected={o === props.value} onSelect={() => commit(o)}>
            {render ? render(o) : o}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu>
      <Message id={messageId} state={state} error={error} />
    </div>
  );
}

export const Editable = { Text: EditableText, Select: EditableSelect } as {
  Text: typeof EditableText;
  Select: typeof EditableSelect;
};
