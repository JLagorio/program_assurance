import { AlertCircle, Check } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { useLedgerLocale } from "../lib/locale";

import { cn } from "../lib/cn";
import { Bleed } from "../primitives/bleed";

import { Input } from "../components/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../components/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "../components/combobox";
import { Spinner } from "../components/spinner";
import { Absent } from "../components/typography";

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
  const { t } = useLedgerLocale();
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const latestValue = useRef(value);
  latestValue.current = value;
  const mounted = useRef(true);
  const operation = useRef(0);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      operation.current += 1;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const commit = (next: T) => {
    if (busy.current) return false;
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
    const request = ++operation.current;
    busy.current = true;
    if (timer.current) clearTimeout(timer.current);
    const owns = () => mounted.current && operation.current === request;
    setError(null);
    setState("saving");
    latestValue.current = next;
    onChange(next);
    let pending: Promise<unknown>;
    try {
      pending = save(next);
    } catch (error) {
      pending = Promise.reject(error);
    }
    pending
      .then(() => {
        if (!owns()) return;
        busy.current = false;
        if (latestValue.current !== next) {
          setState("idle");
          return;
        }
        setState("saved");
        timer.current = setTimeout(() => {
          if (owns()) setState("idle");
        }, 1400);
      })
      .catch((e: unknown) => {
        if (!owns()) return;
        busy.current = false;
        if (latestValue.current !== next) {
          setState("idle");
          return;
        }
        onChange(previous);
        setError(e instanceof Error ? e.message : t("saveFailed"));
        setState("error");
      });
    return true;
  };

  return { state, error, setError, setState, commit };
}

function StateIcon({ state }: { state: SaveState }) {
  const { t } = useLedgerLocale();
  if (state === "saving") return <Spinner label={t("saving")} />;
  if (state === "saved") return <Check aria-hidden className="size-150 icon-success" />;
  if (state === "error") return <AlertCircle aria-hidden className="size-150 icon-danger" />;
  return null;
}

/** The message under the value and what a screen reader hears when a save lands. */
function Message({ id, state, error }: { id: string; state: SaveState; error: string | null }) {
  const { t } = useLedgerLocale();
  return (
    <>
      {error ? (
        <p id={id} className="font-body-xsmall text-danger">
          {error}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {state === "saved" ? t("saved") : state === "error" ? t("notSaved") : ""}
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
          <Input
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
            className="h-control-xsmall rounded-small px-050"
          />
        </Bleed>
      ) : (
        <button
          ref={button}
          type="button"
          aria-disabled={state === "saving" || undefined}
          onClick={() => {
            if (state !== "saving") setEditing(true);
          }}
          className={resting}
        >
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
  /** Draws a value: a Badge for a status, a Person for an owner. Unsaid, the value as text. The searchable list shows the values as words. */
  render?: ((value: T) => ReactNode) | undefined;
  /** A list worth searching: a search field at the top, the options as plain words under it. On by itself past eight options. */
  searchable?: boolean | undefined;
};

/** Over eight options the list is searched rather than scanned. */
const SEARCH_FROM = 8;

/**
 * One of a fixed set, edited in place: the row opens the options with the current one marked, and
 * choosing commits. A short set uses Select; a long one uses a searchable Combobox popup.
 * Nothing but the values shows in either: the row's label is for the screen reader.
 */
function EditableSelect<T extends string>({
  options,
  render,
  searchable = options.length > SEARCH_FROM,
  ...props
}: EditableSelectProps<T>) {
  const { t } = useLedgerLocale();
  const { state, error, commit } = useOptimisticCommit(props);
  const messageId = useId();
  const triggerProps = {
    "aria-labelledby": `${messageId}-label ${messageId}-value`,
    "aria-describedby": error ? messageId : undefined,
    "aria-invalid": error ? true : undefined,
    "aria-disabled": state === "saving" || undefined,
    className: cn(
      resting,
      "h-auto w-full justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent focus-visible:bg-transparent data-readonly:bg-transparent data-readonly:hover:bg-transparent",
      error && "before:border before:border-danger",
    ),
  };
  const triggerContent = (
    <>
      <span id={`${messageId}-label`} className="sr-only">
        {props.label}:
      </span>
      <span id={`${messageId}-value`} className="relative min-w-0 truncate">
        {render ? render(props.value) : props.value}
      </span>
      <span className="relative ms-auto flex shrink-0 items-center gap-050">
        <StateIcon state={state} />
      </span>
    </>
  );
  return (
    <div className="flex min-w-0 flex-col gap-025">
      {searchable ? (
        <Combobox<T>
          items={options}
          value={props.value}
          readOnly={state === "saving"}
          onValueChange={(next, details) => {
            if (next === null || !commit(next)) details.cancel();
          }}
        >
          <ComboboxTrigger {...triggerProps}>{triggerContent}</ComboboxTrigger>
          <ComboboxContent
            aria-label={props.label}
            align="start"
            style={{ width: 240 }}
            className="p-0"
          >
            <div className="p-100">
              <ComboboxInput
                aria-label={props.label}
                placeholder={t("search")}
                showTrigger={false}
              />
            </div>
            <ComboboxEmpty>{t("noMatches")}</ComboboxEmpty>
            <ComboboxList style={{ maxHeight: 260 }}>
              {(option: T) => (
                <ComboboxItem key={option} value={option}>
                  {option}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ) : (
        <Select<T>
          items={options.map((option) => ({ value: option, label: option }))}
          value={props.value}
          readOnly={state === "saving"}
          onValueChange={(next, details) => {
            if (next === null || !commit(next)) details.cancel();
          }}
        >
          <SelectTrigger {...triggerProps}>{triggerContent}</SelectTrigger>
          <SelectContent
            aria-label={props.label}
            align="start"
            alignItemWithTrigger={false}
            style={{ width: 220 }}
          >
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {render ? render(option) : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Message id={messageId} state={state} error={error} />
    </div>
  );
}

export const Editable = { Text: EditableText, Select: EditableSelect } as {
  Text: typeof EditableText;
  Select: typeof EditableSelect;
};
