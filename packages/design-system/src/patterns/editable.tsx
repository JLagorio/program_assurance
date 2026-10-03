import { AlertCircle, Calendar as CalendarIcon, Check, Pencil, X } from "lucide-react";
import {
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { useLedgerLocale } from "../lib/locale";
import { dateToDay, formatIsoDay, parseIsoDay } from "../lib/locale-format";

import { cn } from "../lib/cn";
import { useTouch } from "../lib/touch";
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
import {
  DayPopup,
  dayFormat,
  useDayConstraints,
  useIsoDay,
  type DatePickerProps,
  type DayConstraintProps,
} from "../components/date-picker";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/input-group";
import { Popover, PopoverTrigger } from "../components/popover";
import { token } from "../generated/tokens";
import { Absent } from "../components/typography";
import { dueStateLook, useDueState } from "../components/date-time";

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
  onValueChange?: ((next: T) => void) | undefined;
  /**
   * @deprecated Use `onValueChange`, called with the same values. `onChange` is still called, for
   * one version, when `onValueChange` is not given.
   */
  onChange?: ((next: T) => void) | undefined;
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

/**
 * The native props of the box that holds the value, its message and its recovery: an id, a test
 * id, a style, `className` and `ref` reach it. `onChange` is the deprecated value callback, and the
 * value is the Editable's own, so the box takes neither `onChange` nor `defaultValue`.
 */
type EditableRootProps = Omit<
  ComponentProps<"div">,
  "children" | "onChange" | "defaultValue" | "defaultChecked"
>;

/** Each of the Editable's own props, named once, so the rest of the caller's props are the box's. */
const editableKeys = {
  label: true,
  value: true,
  onValueChange: true,
  onChange: true,
  validate: true,
  save: true,
  onEditingChange: true,
  onDraftChange: true,
  onCancel: true,
  lockedReason: true,
} satisfies Record<keyof EditableProps<string>, true>;

/** The caller's props without the Editable's own: what the box takes. */
function boxProps<P extends object>(props: P) {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props))
    if (!Object.prototype.hasOwnProperty.call(editableKeys, key)) rest[key] = value;
  return rest as Omit<P, keyof EditableProps<string>>;
}

/** Hands an element to a caller's ref, a callback or an object. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** The shared save engine: one save at a time, safe against races and unmount, the refused value kept. */
function useOptimisticCommit<T extends string>({
  value,
  onValueChange,
  onChange,
  validate,
  save,
}: EditableProps<T>) {
  const { t } = useLedgerLocale();
  // The deprecated onChange reports only where onValueChange is not given, so a caller part-way
  // through the rename never hears a value twice.
  const report = (next: T) => (onValueChange ?? onChange)?.(next);
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
      report(next);
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
          report(previous);
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
   not scrollable overflow and lines the value up with the plain values around it: a KeyValue
   whose value is an Editable does not clip it, and a table cell's padding holds it. */
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

export type EditableTextProps = EditableProps<string> &
  EditableRootProps & {
    /** What to add, as a noun, shown in the field while it is empty and at rest in place of the dash: "Unassigned", "Add next action". */
    placeholder?: string | undefined;
    /** A paragraph: the value wraps at rest as text the reader can select, with an Edit button beside it, and edits in a textarea with Cancel and Save. Enter adds a line; Ctrl/Cmd+Enter saves. */
    multiline?: boolean | undefined;
  };

/**
 * Text edited in place. Click or Enter opens the field; Enter or leaving commits; Escape or Cancel
 * puts the old value back. Leaving the window keeps the field open with its draft. A refused save
 * keeps the draft: the row offers Try again and Discard, and reopening shows the draft. The
 * caller's native `div` props, `className` and `ref` reach the box around the value, its message
 * and its recovery, as on every Editable.
 */
export function EditableText({
  placeholder,
  multiline = false,
  className,
  ref,
  onBlur,
  ...props
}: EditableTextProps) {
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
  // Where any pointer is coarse (a touch screen, which has no Escape key) the field shows its
  // Cancel and Save.
  const coarse = useTouch();

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

  const native = boxProps(props);

  return (
    <div
      {...native}
      ref={ref}
      className={cn(root, className)}
      onBlur={(event) => {
        onBlur?.(event);
        if (editing) leave(event);
      }}
      data-slot="editable"
    >
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

export type EditableSelectProps<T extends string> = EditableProps<T> &
  EditableRootProps & {
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
  className,
  ref,
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
  const native = boxProps(props);
  return (
    <div {...native} ref={ref} className={cn(root, className)} data-slot="editable">
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
          <ComboboxContent
            aria-label={label}
            align="start"
            style={{ width: token("dimension.part.editableCombobox") }}
            className="p-0"
          >
            <div className="p-100">
              <ComboboxInput aria-label={label} placeholder={t("search")} showTrigger={false} />
            </div>
            <ComboboxEmpty>{t("noMatches")}</ComboboxEmpty>
            <ComboboxList style={{ maxHeight: token("dimension.part.editableComboboxList") }}>
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
            style={{ width: token("dimension.part.editableSelect") }}
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

export type EditableDateProps = EditableProps<string> &
  EditableRootProps &
  DayConstraintProps & {
    /** What goes here, as a noun, shown at rest in `color.text.subtlest` while there is no day: "No due date". Unsaid, the muted dash. */
    placeholder?: string | undefined;
    /** The month's own options, as on DatePicker: the year dropdown, the months it reaches, week numbers. */
    calendarProps?: DatePickerProps["calendarProps"];
    /**
     * The day is a due date. At rest the row says where it stands beside the day, as DateLabel
     * does: Overdue, Due today, Due tomorrow or Due in 2 days, with its icon and tone, judged
     * against the reader's today. The words are part of the row's name ("Due: Oct 1, 2026,
     * Overdue").
     */
    due?: boolean | undefined;
    /** The work is done: a `due` day shows plainly, with no state. */
    complete?: boolean | undefined;
  };

/**
 * A calendar day edited in place. The value is an ISO day ("2026-10-14"), shown in the reader's
 * locale ("Oct 14, 2026"). Click or Enter opens a field that reads a typed day, with a button
 * (or Alt+Down) that opens the month; Enter or leaving commits the typed day, a day chosen in the
 * month commits at once, and Escape or Cancel puts the old one back. An empty field clears the
 * day. Text that is not a day, or a day `min`, `max` or `isDateUnavailable` refuse, keeps the field
 * open with what fixes it. Saving, a refused save, the lock and the draft callbacks are those of
 * Editable.Text. With `due`, the resting row says where the day stands, as DateLabel does.
 */
export function EditableDate({
  placeholder,
  min,
  max,
  isDateUnavailable,
  calendarProps,
  due = false,
  complete = false,
  className,
  ref,
  onBlur,
  ...props
}: EditableDateProps) {
  const { t, formatDay, parseDay } = useLedgerLocale();
  const { label, lockedReason } = props;
  const { state, error, refused, commit, discard } = useOptimisticCommit(props);
  const day = useIsoDay(props.value, "Editable.Date");
  const standing = useDueState(due && day ? formatIsoDay(day) : null, {
    complete,
    part: "Editable.Date",
  });
  const constraints = useDayConstraints({ min, max, isDateUnavailable }, "Editable.Date");
  /** A stored day as the field shows it; "" for none. */
  const shownOf = (value: string) => {
    const parsed = value ? parseIsoDay(value) : null;
    return parsed ? formatDay(parsed, dayFormat) : "";
  };
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  // What the last try to commit was refused for: text that is not a day, a day the constraints
  // or `validate` refuse. It goes as the reader types.
  const [attempt, setAttempt] = useState<string | null>(null);
  const [stranded, setStranded] = useState(false);
  const [explain, setExplain] = useState(false);
  const [month, setMonth] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // The box is the Editable's own, for the month's outside presses, and the caller's.
  const setRoot = useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element;
      assignRef(ref, element);
    },
    [ref],
  );
  const opener = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const returnFocus = useRef(false);
  const monthOpen = useRef(false);
  monthOpen.current = month;
  const messageId = useId();
  const lockId = `${messageId}-lock`;
  const coarse = useTouch();

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    opener.current?.focus();
  }, [editing]);

  if (explain && !lockedReason) setExplain(false);

  /** The typed text read as a day: its ISO day, "" for an empty field, or what is wrong with it. */
  const read = (raw: string): { value: string } | { error: string } => {
    const typed = raw.trim();
    if (!typed) return { value: "" };
    const today = dateToDay(new Date());
    const parsed = parseDay(typed, today);
    if (!parsed) return { error: t("dateInvalid", { example: formatDay(today, dayFormat) }) };
    const problem = constraints.entryError(parsed);
    return problem ? { error: problem } : { value: formatIsoDay(parsed) };
  };
  const typed = editing ? read(text) : null;
  // The unsaved draft, for a host's guard: the day the text reads as while it differs from the
  // value (the text itself while it reads as no day), or a refused day kept for another try.
  const typedDraft =
    !typed || text === shownOf(props.value)
      ? null
      : "error" in typed
        ? text
        : typed.value === props.value
          ? null
          : typed.value;
  useReport(editing, editing ? typedDraft : (refused?.value ?? null), props);
  // The month opens on the day the text reads as, else on the value's.
  const typedDay = typed && "value" in typed && typed.value ? parseIsoDay(typed.value) : null;

  const isOpen = useRef(false);
  isOpen.current = editing;
  const close = (focusRow: boolean) => {
    isOpen.current = false;
    returnFocus.current = focusRow;
    setStranded(false);
    setMonth(false);
    setAttempt(null);
    setEditing(false);
  };
  const start = () => {
    if (lockedReason) {
      setExplain(true);
      return;
    }
    if (state === "saving") return;
    setText(shownOf(refused ? refused.value : props.value));
    setAttempt(null);
    setEditing(true);
  };
  const cancel = () => {
    setText(shownOf(props.value));
    discard();
    props.onCancel?.();
    close(true);
  };
  /** Commits a day, or says why it cannot: the field stays open with the message. */
  const settle = (next: { value: string } | { error: string }, focusRow: boolean) => {
    const problem = "error" in next ? next.error : (props.validate?.(next.value) ?? null);
    if (problem || "error" in next) {
      setAttempt(problem);
      return false;
    }
    const ok = commit(next.value);
    if (ok) close(focusRow);
    return ok;
  };
  const confirm = (focusRow: boolean) => settle(read(field.current?.value ?? text), focusRow);
  const pick = (date: Date | undefined) => {
    const value = date ? formatIsoDay(dateToDay(date)) : "";
    setText(shownOf(value));
    setMonth(false);
    if (!settle({ value }, true)) field.current?.focus();
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
  /** Focus left the field, its month and its buttons. Leaving the window is not leaving the field. */
  const leave = (event: FocusEvent<HTMLDivElement>) => {
    // The month is the field's own: focus moving into it, or between its days, is not leaving.
    if (!isOpen.current || monthOpen.current) return;
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    const doc = event.currentTarget.ownerDocument;
    if (!doc.hasFocus() || doc.visibilityState === "hidden") return;
    if (!confirm(false)) setStranded(true);
  };

  const liveError = editing
    ? (attempt ?? (refused && text === shownOf(refused.value) ? error : null))
    : error;
  const rowDescription = describedBy(error && messageId, lockedReason && lockId);
  const actions = coarse || stranded;
  const shown = day ? (
    <time dateTime={formatIsoDay(day)}>{formatDay(day, dayFormat)}</time>
  ) : (
    (placeholder ?? <Absent />)
  );

  const native = boxProps(props);

  return (
    <div
      {...native}
      ref={setRoot}
      className={cn(root, className)}
      onBlur={(event) => {
        onBlur?.(event);
        if (editing) leave(event);
      }}
      data-slot="editable"
    >
      {editing ? (
        <Bleed inline="space.050">
          <Popover
            open={month}
            onOpenChange={(next, details) => {
              setMonth(next);
              // A press outside the month and the field, or focus leaving them both, is leaving:
              // the typed day commits.
              if (next || (details.reason !== "outside-press" && details.reason !== "focus-out"))
                return;
              const event = details.event;
              const to = event instanceof FocusEvent ? event.relatedTarget : event.target;
              if (to instanceof Node && rootRef.current?.contains(to)) return;
              if (!confirm(false)) setStranded(true);
            }}
          >
            <InputGroup data-slot="editable-date-field" className="h-control-xsmall rounded-small">
              <InputGroupInput
                ref={field}
                autoFocus
                aria-label={label}
                aria-invalid={liveError ? true : undefined}
                aria-describedby={describedBy(liveError && messageId)}
                value={text}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  setText(event.target.value);
                  setAttempt(null);
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                  if (event.altKey && event.key === "ArrowDown") {
                    event.preventDefault();
                    setMonth(true);
                    return;
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!confirm(true)) event.stopPropagation();
                  }
                  if (event.key === "Escape") {
                    // The field consumes Escape, so a Dialog, Sheet or Popover around it stays open.
                    event.preventDefault();
                    event.stopPropagation();
                    cancel();
                  }
                }}
                className="px-050"
              />
              <InputGroupAddon align="inline-end" className="pe-025">
                <PopoverTrigger
                  render={
                    <IconButton
                      size="xxsmall"
                      variant="subtle"
                      icon={<CalendarIcon />}
                      label={t("editableChooseDateNamed", { label })}
                      isTooltipDisabled
                    />
                  }
                />
              </InputGroupAddon>
            </InputGroup>
            <DayPopup
              day={typedDay ?? day}
              constraints={constraints}
              calendarProps={calendarProps}
              onPick={pick}
              label={t("editableChooseDateNamed", { label })}
              align="end"
              returnTo={() => field.current ?? opener.current}
            />
          </Popover>
        </Bleed>
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
          <span className="relative flex min-w-0 flex-wrap items-center gap-x-050 gap-y-025">
            <span className={cn("min-w-0 truncate tabular-nums", !day && "text-subtlest")}>
              {shown}
            </span>
            {standing?.words ? (
              <span
                data-slot="editable-date-state"
                data-state={standing.state}
                className={cn(
                  "inline-flex shrink-0 items-center gap-050 rounded-small px-075 font-body-small font-medium whitespace-nowrap [&>svg]:size-icon-small [&>svg]:shrink-0",
                  dueStateLook[standing.state].className,
                )}
              >
                {dueStateLook[standing.state].icon}
                <span className="sr-only">, </span>
                {standing.words}
              </span>
            ) : null}
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
    </div>
  );
}

/** The Editables, as `Editable.Text`, `Editable.Select` and `Editable.Date`; each is exported by name too. */
export const Editable = { Text: EditableText, Select: EditableSelect, Date: EditableDate } as {
  Text: typeof EditableText;
  Select: typeof EditableSelect;
  Date: typeof EditableDate;
};
