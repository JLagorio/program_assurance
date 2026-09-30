import { AlertCircle, Check, Pencil, X } from "lucide-react";
import {
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useLedgerLocale } from "../lib/locale";

import { cn } from "../lib/cn";
import { Bleed } from "../primitives/bleed";

import { Button, IconButton } from "../components/button";
import { Textarea } from "../components/textarea";
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
   optimistically, rolls back when the save fails, keeps the refused value for another try, and
   shows the save state beside the value. At rest the value sits flush on the text column and the
   hover tint reaches space.050 past it, so an editable value lines up with the plain values around
   it; editing, the field's box reaches the same distance. One line, 24px, the height of the field
   that replaces it, so opening the editor does not move the rows around it. */

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
  /** Saves the value. A rejected promise rolls the value back, shows the error's message under it and keeps the refused value, with Try again and Discard. */
  save: (next: T) => Promise<unknown>;
  /** Called with `true` when the editor opens (Text's field, Select's options) and `false` when it closes. */
  onEditingChange?: ((editing: boolean) => void) | undefined;
  /**
   * Called with the unsaved draft whenever it changes: the text being typed while it differs from
   * the value, or a refused value kept for another try; `null` once it is saved, put back or
   * discarded, and when the Editable unmounts. A host feeds its draft guard (a route blocker,
   * `beforeunload`) from it rather than from the field's DOM events.
   */
  onDraftChange?: ((draft: T | null) => void) | undefined;
  /** Called when the reader drops an edit without saving: Escape or Cancel in Text's field, or Discard after a refused save on either. Closing a Select's options without a choice changes nothing, so it is not a cancel. */
  onCancel?: (() => void) | undefined;
  /**
   * A temporary lock with its reason, while the value may not change for now: "Wait for the change
   * to Title to finish saving." The row stays in place and focusable, is `aria-disabled`, is
   * described by the reason, and shows the reason when the reader tries to edit. A field already
   * open keeps its draft, and its save stays the host's to refuse. A value that never changes is
   * plain text instead, and a whole form is never disabled around a save.
   */
  lockedReason?: string | undefined;
};

/** The shared save engine: one save at a time, safe against races and unmount, the refused value kept. */
function useOptimisticCommit<T extends string>({
  value,
  onChange,
  validate,
  save,
}: EditableProps<T>) {
  const { t } = useLedgerLocale();
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  /** What a refused save tried to commit, kept for Try again until the reader discards it. */
  const [refused, setRefused] = useState<{ value: T } | null>(null);
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
      setRefused(null);
      return true;
    }
    const previous = value;
    const request = ++operation.current;
    busy.current = true;
    if (timer.current) clearTimeout(timer.current);
    const owns = () => mounted.current && operation.current === request;
    setError(null);
    setRefused(null);
    setState("saving");
    latestValue.current = next;
    let pending: Promise<unknown>;
    try {
      onChange(next);
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
        try {
          onChange(previous);
        } catch {
          // A store may reject the rollback too; still release the editor and show the error.
        }
        setError(e instanceof Error && e.message ? e.message : t("saveFailed"));
        setState("error");
        setRefused({ value: next });
      });
    return true;
  };

  /** Drops the refused value and the message: the committed value is what shows. */
  const discard = () => {
    setRefused(null);
    setError(null);
    setState("idle");
  };

  return { state, error, refused, commit, discard };
}

/** Tells the host when the editor opens and closes and what the unsaved draft is, and clears both on unmount. */
function useReport<T extends string>(
  editing: boolean,
  draft: T | null,
  { onEditingChange, onDraftChange }: Pick<EditableProps<T>, "onEditingChange" | "onDraftChange">,
) {
  const latest = useRef({ onEditingChange, onDraftChange });
  latest.current = { onEditingChange, onDraftChange };
  const reported = useRef<{ editing: boolean; draft: T | null }>({ editing: false, draft: null });
  useEffect(() => {
    if (reported.current.editing === editing) return;
    reported.current.editing = editing;
    latest.current.onEditingChange?.(editing);
  }, [editing]);
  useEffect(() => {
    if (reported.current.draft === draft) return;
    reported.current.draft = draft;
    latest.current.onDraftChange?.(draft);
  }, [draft]);
  useEffect(() => {
    const said = reported.current;
    const callbacks = latest;
    return () => {
      if (said.editing) callbacks.current.onEditingChange?.(false);
      if (said.draft !== null) callbacks.current.onDraftChange?.(null);
      said.editing = false;
      said.draft = null;
    };
  }, []);
}

/* Where any pointer is coarse (a touch screen, which has no Escape key) the field shows its Cancel
   and Save. */
const COARSE = "(any-pointer: coarse)";
const canMatch = () => typeof window !== "undefined" && typeof window.matchMedia === "function";
const subscribeCoarse = (change: () => void) => {
  if (!canMatch()) return () => {};
  const query = window.matchMedia(COARSE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};
const useCoarsePointer = () =>
  useSyncExternalStore(
    subscribeCoarse,
    () => canMatch() && window.matchMedia(COARSE).matches,
    () => false,
  );

function StateIcon({ state }: { state: SaveState }) {
  const { t } = useLedgerLocale();
  if (state === "saving") return <Spinner label={t("saving")} />;
  if (state === "saved") return <Check aria-hidden className="size-150 icon-success" />;
  if (state === "error") return <AlertCircle aria-hidden className="size-150 icon-danger" />;
  return null;
}

/* A line under the value wraps: a value that truncates (a KeyValue's, a table cell's) sets
   nowrap for its own line, and a reason cut at the rail's edge would not be read. */
const note = (tone: string) => cn("whitespace-normal break-words font-body-xsmall", tone);

/**
 * The message under the value and what a screen reader hears when a save lands: "Saved", or "Not
 * saved: " and the reason. `error` is the message shown now, which follows the draft as the reader
 * types; `reason` is what the last commit was refused for, so the status says it once and does not
 * change on every keystroke. The announcer is sr-only, so absolutely positioned: the Editable's
 * wrapper is `relative`, which keeps it inside a table that scrolls sideways instead of widening
 * the page.
 */
function Message({
  id,
  state,
  error,
  reason,
}: {
  id: string;
  state: SaveState;
  error: string | null;
  reason: string | null;
}) {
  const { t } = useLedgerLocale();
  const said =
    state === "saved"
      ? t("saved")
      : state === "error"
        ? reason
          ? t("editableNotSavedReason", { reason })
          : t("notSaved")
        : "";
  return (
    <>
      {error ? (
        <p id={id} className={note("text-danger")}>
          {error}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}

/** After a refused save: another try with the refused value, or back to the committed one. */
function Recovery({
  label,
  messageId,
  onRetry,
  onDiscard,
}: {
  label: string;
  messageId: string;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  const { t } = useLedgerLocale();
  return (
    <div data-slot="editable-recovery" className="flex flex-wrap items-center gap-050">
      <Button
        size="xsmall"
        variant="secondary"
        aria-label={t("editableRetryNamed", { label })}
        aria-describedby={messageId}
        onClick={onRetry}
      >
        {t("retry")}
      </Button>
      <Button
        size="xsmall"
        variant="subtle"
        aria-label={t("editableDiscardNamed", { label })}
        onClick={onDiscard}
      >
        {t("editableDiscard")}
      </Button>
    </div>
  );
}

/** The lock's reason: always the row's description, and shown once the reader tries to edit. */
function LockReason({ id, reason, shown }: { id: string; reason: string; shown: boolean }) {
  return (
    <p id={id} hidden={!shown} className={note("text-subtle")}>
      {reason}
    </p>
  );
}

const describedBy = (...ids: (string | false | null | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

/* The Editable's own box. The tint, the field and the focus ring reach space.050 past the value on
   both sides; the box keeps that reach inside it at the end (pe-050), so the Editable never
   overflows the value it sits in, and a KeyValue or a cell that truncates does not take it for
   cut text and reveal it in a tooltip. At the start the reach passes the text column, which is
   not scrollable overflow and lines the value up with the plain values around it. */
const root = "relative flex min-w-0 flex-col gap-025 pe-050";

/* ::before is the hover tint. On a touch screen ::after is the hit area, the shared band on ::after
   (touch-target-block-after): the value's width and at least 24px tall, centred. The row is the
   field's height, dimension.control.xsmall, so the rail does not move when the field opens. */
const resting = cn(
  "relative flex min-h-control-xsmall w-full items-center gap-075 rounded-small py-025 text-start outline-none focus-visible:outline-focused before:absolute before:-inset-x-050 before:inset-y-0 before:rounded-small before:transition-colors before:duration-fast before:ease-standard hover:before:bg-neutral-subtle-hovered active:before:bg-neutral-subtle-pressed aria-disabled:hover:before:bg-transparent",
  "touch-target-block-after",
);

/** A press on the field's own Cancel or Save keeps focus in the field, so leaving it does not commit first. */
const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();

export type EditableTextProps = EditableProps<string> & {
  /** What to add, as a noun, shown in the field while it is empty and at rest in place of the dash: "Unassigned", "Add next action". */
  placeholder?: string | undefined;
  /** A paragraph: the value wraps at rest as text the reader can select, with an Edit button beside it, and edits in a textarea with Cancel and Save. Enter adds a line; Ctrl/Cmd+Enter saves. */
  multiline?: boolean | undefined;
};

/**
 * Text edited in place. Click or Enter opens the field; Enter or leaving commits; Escape or Cancel
 * puts the old value back. Leaving the window keeps the field open with its draft. A refused save
 * keeps the draft: the row offers Try again and Discard, and reopening shows the draft.
 */
export function EditableText({ placeholder, multiline = false, ...props }: EditableTextProps) {
  const { t } = useLedgerLocale();
  const { label, lockedReason } = props;
  const { state, error, refused, commit, discard } = useOptimisticCommit(props);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.value);
  // A blur the validation refused: the field stays open with its message, and shows Cancel.
  const [stranded, setStranded] = useState(false);
  const [explain, setExplain] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const returnFocus = useRef(false);
  const messageId = useId();
  const lockId = `${messageId}-lock`;
  const hintId = `${messageId}-hint`;
  const coarse = useCoarsePointer();

  useEffect(() => {
    if (!editing) setDraft(props.value);
  }, [props.value, editing]);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    opener.current?.focus();
  }, [editing]);

  if (explain && !lockedReason) setExplain(false);

  useReport(
    editing,
    editing ? (draft !== props.value ? draft : null) : (refused?.value ?? null),
    props,
  );

  // Whether the field is open now, ahead of the render that closes it: a field removed while it
  // has focus can report a blur, which must not commit what was just put back or saved.
  const isOpen = useRef(false);
  isOpen.current = editing;
  const close = (focusRow: boolean) => {
    isOpen.current = false;
    returnFocus.current = focusRow;
    setStranded(false);
    setEditing(false);
  };
  const start = () => {
    if (lockedReason) {
      setExplain(true);
      return;
    }
    if (state === "saving") return;
    setDraft(refused ? refused.value : props.value);
    setEditing(true);
  };
  const cancel = () => {
    setDraft(props.value);
    discard();
    props.onCancel?.();
    close(true);
  };
  const confirm = (focusRow: boolean) => {
    const ok = commit(draft);
    if (ok) close(focusRow);
    return ok;
  };
  const retry = () => {
    if (!refused) return;
    opener.current?.focus();
    commit(refused.value);
  };
  const drop = () => {
    opener.current?.focus();
    discard();
    props.onCancel?.();
  };
  /** Focus left the field and its buttons. Leaving the window is not leaving the field. */
  const leave = (event: FocusEvent<HTMLDivElement>) => {
    if (!isOpen.current) return;
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    const doc = event.currentTarget.ownerDocument;
    if (!doc.hasFocus() || doc.visibilityState === "hidden") return;
    if (!confirm(false)) setStranded(true);
  };

  const liveError = editing
    ? (props.validate?.(draft) ?? (refused && draft === refused.value ? error : null))
    : error;
  const Editor = multiline ? Textarea : Input;
  const shown = props.value || placeholder || <Absent />;
  const rowDescription = describedBy(error && messageId, lockedReason && lockId);
  const actions = multiline || coarse || stranded;

  return (
    <div data-slot="editable" className={root} onBlur={editing ? leave : undefined}>
      {editing ? (
        <Bleed inline="space.050">
          <Editor
            ref={field}
            autoFocus
            aria-label={label}
            aria-invalid={liveError ? true : undefined}
            aria-describedby={describedBy(liveError && messageId, multiline && hintId)}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!confirm(true)) e.stopPropagation();
              }
              if (e.key === "Escape") {
                // The field consumes Escape, so a Dialog, Sheet or Popover around it stays open.
                e.preventDefault();
                e.stopPropagation();
                cancel();
              }
            }}
            className={cn("rounded-small px-050", !multiline && "h-control-xsmall")}
            style={multiline ? { fieldSizing: "content" } : undefined}
          />
        </Bleed>
      ) : multiline ? (
        <div className="flex min-w-0 items-start gap-075">
          <span
            className={cn(
              "min-w-0 flex-1 whitespace-pre-wrap break-words py-025",
              !props.value && "text-subtlest",
            )}
          >
            {shown}
          </span>
          <span className="flex shrink-0 items-center gap-050">
            <StateIcon state={state} />
            <Button
              ref={opener}
              size="xsmall"
              variant="subtle"
              iconBefore={<Pencil />}
              aria-label={t("editLabel", { label })}
              aria-describedby={rowDescription}
              // Only while locked: an explicit undefined would override the aria-disabled the
              // Button sets while saving.
              {...(lockedReason ? { "aria-disabled": true } : {})}
              disabled={state === "saving"}
              focusableWhenDisabled
              onClick={start}
              onBlur={explain ? () => setExplain(false) : undefined}
            >
              {t("editableEdit")}
            </Button>
          </span>
        </div>
      ) : (
        <button
          ref={opener}
          type="button"
          aria-disabled={state === "saving" || lockedReason ? true : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={rowDescription}
          onClick={start}
          onBlur={explain ? () => setExplain(false) : undefined}
          className={resting}
        >
          <span className="sr-only">{label}: </span>
          <span className={cn("relative min-w-0 truncate", !props.value && "text-subtlest")}>
            {shown}
          </span>
          <span className="relative ms-auto flex shrink-0 items-center">
            <StateIcon state={state} />
          </span>
        </button>
      )}
      <Message id={messageId} state={state} error={liveError} reason={error} />
      {editing && actions ? (
        <div
          data-slot="editable-actions"
          className="flex flex-wrap items-center justify-end gap-050"
        >
          {/* Icons named by the action and the field, their words in a tooltip: the field sits in
              a value that may truncate, and a truncated value reveals its text. */}
          <IconButton
            size="xsmall"
            variant="subtle"
            icon={<X />}
            label={t("editableCancelNamed", { label })}
            onMouseDown={keepFocus}
            onClick={cancel}
          />
          <IconButton
            size="xsmall"
            variant="primary"
            icon={<Check />}
            label={t("editableSaveNamed", { label })}
            onMouseDown={keepFocus}
            onClick={() => {
              if (!confirm(true)) field.current?.focus();
            }}
          />
        </div>
      ) : null}
      {!editing && refused ? (
        <Recovery label={label} messageId={messageId} onRetry={retry} onDiscard={drop} />
      ) : null}
      {lockedReason && !editing ? (
        <LockReason id={lockId} reason={lockedReason} shown={explain} />
      ) : null}
      {multiline && editing ? (
        <span id={hintId} className="sr-only">
          {t("editableMultilineHint")}
        </span>
      ) : null}
    </div>
  );
}

/** One of an Editable.Select's choices: the stored value and the words the reader sees, searches and hears. */
export type EditableOption<T extends string> = { value: T; label: string };

export type EditableSelectProps<T extends string> = EditableProps<T> & {
  /** The choices, in the order they show: the values themselves, or `{ value, label }` when the stored value is an id and the reader needs a name. The list searches and announces the label and commits the value. */
  options: readonly (T | EditableOption<T>)[];
  /** Draws a value, given its label too: a Badge for a status, a Person for an owner. Used for the committed value and every option, including searchable lists. Unsaid, the label as text. */
  render?: ((value: T, label: string) => ReactNode) | undefined;
  /** A list worth searching: a search field above the same rendered options. On by itself past eight options. */
  searchable?: boolean | undefined;
  /** Offers a first choice that clears the value, named by this: "Unassigned", "No owner". Choosing it commits the empty string. */
  emptyLabel?: string | undefined;
  /** Shown at rest in `color.text.subtlest` while the value is empty, as a noun: "Unassigned". Unsaid, the `emptyLabel`, else the muted dash. */
  placeholder?: string | undefined;
};

/** Over eight options the list is searched rather than scanned. */
const SEARCH_FROM = 8;

const optionOf = <T extends string>(option: T | EditableOption<T>): EditableOption<T> =>
  typeof option === "string" ? { value: option, label: option } : option;

/**
 * One of a fixed set, edited in place: the row opens the options with the current one marked, and
 * choosing commits. A short set uses Select; a long one uses a searchable Combobox popup. Nothing
 * but the values shows in either: the row's label is for the screen reader.
 */
export function EditableSelect<T extends string>({
  options,
  render,
  searchable: searchableProp,
  emptyLabel,
  placeholder,
  ...props
}: EditableSelectProps<T>) {
  const { t } = useLedgerLocale();
  const { label, lockedReason } = props;
  const { state, error, refused, commit, discard } = useOptimisticCommit(props);
  const [open, setOpen] = useState(false);
  const [explain, setExplain] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const messageId = useId();
  const lockId = `${messageId}-lock`;
  const listed = options.map(optionOf);
  // The empty choice leads, once: an empty option of the caller's own gives way to it.
  const choices =
    emptyLabel === undefined
      ? listed
      : [{ value: "" as T, label: emptyLabel }, ...listed.filter((choice) => choice.value !== "")];
  const searchable = searchableProp ?? choices.length > SEARCH_FROM;
  const labelOf = (value: T) => choices.find((choice) => choice.value === value)?.label ?? value;
  const draw = (value: T) =>
    value === "" && emptyLabel !== undefined
      ? emptyLabel
      : render
        ? render(value, labelOf(value))
        : labelOf(value) || <Absent />;

  if (explain && !lockedReason) setExplain(false);

  useReport(open, refused?.value ?? null, props);

  const locked = Boolean(lockedReason);
  const tryToOpen = () => {
    if (lockedReason) setExplain(true);
  };
  const empty = props.value === "";
  const triggerProps = {
    ref: trigger,
    "aria-labelledby": `${messageId}-label ${messageId}-value`,
    "aria-describedby": describedBy(error && messageId, lockedReason && lockId),
    "aria-invalid": error ? true : undefined,
    "aria-disabled": state === "saving" || locked || undefined,
    onClick: tryToOpen,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) tryToOpen();
    },
    onBlur: explain ? () => setExplain(false) : undefined,
    className: cn(
      resting,
      "h-auto w-full justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent focus-visible:bg-transparent data-readonly:bg-transparent data-readonly:hover:bg-transparent",
      error && "before:border before:border-danger",
    ),
  };
  const triggerContent = (
    <>
      <span id={`${messageId}-label`} className="sr-only">
        {label}:
      </span>
      <span
        id={`${messageId}-value`}
        className={cn("relative min-w-0 truncate", empty && "text-subtlest")}
      >
        {empty ? (placeholder ?? emptyLabel ?? <Absent />) : draw(props.value)}
      </span>
      <span className="relative ms-auto flex shrink-0 items-center gap-050">
        <StateIcon state={state} />
      </span>
    </>
  );
  const choose = (next: T | null, details: { cancel: () => void }) => {
    if (next === null || !commit(next)) details.cancel();
  };
  const readOnly = state === "saving" || locked;
  return (
    <div data-slot="editable" className={root}>
      {searchable ? (
        <Combobox<T>
          items={choices.map((choice) => choice.value)}
          itemToStringLabel={labelOf}
          value={props.value}
          readOnly={readOnly}
          onOpenChange={setOpen}
          onValueChange={choose}
        >
          <ComboboxTrigger {...triggerProps}>{triggerContent}</ComboboxTrigger>
          <ComboboxContent aria-label={label} align="start" style={{ width: 240 }} className="p-0">
            <div className="p-100">
              <ComboboxInput aria-label={label} placeholder={t("search")} showTrigger={false} />
            </div>
            <ComboboxEmpty>{t("noMatches")}</ComboboxEmpty>
            <ComboboxList style={{ maxHeight: 260 }}>
              {(option: T) => (
                <ComboboxItem key={`option:${option}`} value={option} aria-label={labelOf(option)}>
                  {draw(option)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ) : (
        <Select<T>
          items={choices}
          value={props.value}
          readOnly={readOnly}
          onOpenChange={setOpen}
          onValueChange={choose}
        >
          <SelectTrigger {...triggerProps}>{triggerContent}</SelectTrigger>
          <SelectContent
            aria-label={label}
            align="start"
            alignItemWithTrigger={false}
            style={{ width: 220 }}
          >
            {choices.map((choice) => (
              <SelectItem
                key={`option:${choice.value}`}
                value={choice.value}
                label={choice.label}
                aria-label={choice.label}
              >
                {draw(choice.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Message id={messageId} state={state} error={error} reason={error} />
      {refused ? (
        <Recovery
          label={label}
          messageId={messageId}
          onRetry={() => {
            trigger.current?.focus();
            commit(refused.value);
          }}
          onDiscard={() => {
            trigger.current?.focus();
            discard();
            props.onCancel?.();
          }}
        />
      ) : null}
      {lockedReason ? <LockReason id={lockId} reason={lockedReason} shown={explain} /> : null}
    </div>
  );
}

/** The two Editables, as `Editable.Text` and `Editable.Select`; each is exported by name too. */
export const Editable = { Text: EditableText, Select: EditableSelect } as {
  Text: typeof EditableText;
  Select: typeof EditableSelect;
};
