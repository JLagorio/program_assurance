import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Search } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { token } from "../generated/tokens";
import { announce } from "../lib/announce";
import { useLedgerLocale } from "../lib/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
  type DialogProps,
} from "./dialog";

import { cn } from "../lib/cn";
import { KbdShortcut, useFormatShortcut } from "./kbd";
import { menuItem, menuSeparator } from "./menu";
import { Spinner } from "./spinner";

/* A list the reader filters from the keyboard: the ⌘K palette, a record picker. cmdk underneath
   for the filtering, the arrow keys, the typeahead and the roles; the kit owns the look, which is
   the floating list's, so a palette's row and a menu's row are one row, and it owns what cmdk
   leaves out: an active descendant that follows the selection, the count spoken as it settles,
   and an empty sentence that waits while rows load. */

/** How long the results must hold still before their count is spoken, so typing is not interrupted. */
const ANNOUNCE_DELAY = 600;

type CommandContextValue = { loading: boolean; register: () => () => void };
/** Whether a CommandLoading is showing, so the empty sentence and the count wait for the rows. */
const CommandContext = createContext<CommandContextValue>({
  loading: false,
  register: () => () => {},
});

/**
 * Says the count of matching rows, or the empty sentence, through the page's Announcer once the
 * query holds still. Nothing is said before a query or while rows load.
 */
function CommandStatus() {
  const { t, messages, formatPlural } = useLedgerLocale();
  const { loading } = useContext(CommandContext);
  const search = useCommandState((s) => s.search);
  const count = useCommandState((s) => s.filtered.count);
  const marker = useRef<HTMLSpanElement>(null);
  const query = search.trim();
  useEffect(() => {
    if (!query || loading) return;
    const timer = setTimeout(() => {
      const empty = marker.current
        ?.closest("[cmdk-root]")
        ?.querySelector("[cmdk-empty]")
        ?.textContent?.trim();
      announce(
        count > 0
          ? formatPlural(count, {
              one: messages.commandMatchOne,
              other: messages.commandMatchOther,
            })
          : empty || t("commandNoMatches"),
      );
    }, ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [query, count, loading, formatPlural, messages, t]);
  return <span ref={marker} hidden data-slot="command-status" />;
}

/**
 * The list and its field. Give it a `label`, which names the field. While the reader types, the
 * count of matching rows (or the empty sentence) is spoken once the query holds still, through the
 * page's Announcer.
 */
export function Command({
  className,
  children,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  const [loaders, setLoaders] = useState(0);
  const register = useCallback(() => {
    setLoaders((n) => n + 1);
    return () => setLoaders((n) => n - 1);
  }, []);
  const context = useMemo(() => ({ loading: loaders > 0, register }), [loaders, register]);
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xxlarge bg-surface-overlay text-default",
        className,
      )}
      {...props}
      data-slot="command"
    >
      <CommandContext.Provider value={context}>
        <CommandStatus />
        {children}
      </CommandContext.Provider>
    </CommandPrimitive>
  );
}

export type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input> & {
  /** At the end of the field: the Escape key by default, which is decoration; `null` for none; a `CommandCount` for a picker, which the field is described by. */
  hint?: ReactNode;
};

/**
 * The field at the top: a search icon, the input, and at the end a hint. The field's
 * `aria-activedescendant` names the row Enter would choose, on open, after every keystroke and
 * after every arrow. The row draws the field's focus ring while the field has focus.
 */
export function CommandInput({ className, hint, ref, ...props }: CommandInputProps) {
  const own = useRef<HTMLInputElement | null>(null);
  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      own.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  // Every change that can move the selection re-renders the field, so the attribute follows.
  useCommandState((s) => s.value);
  useCommandState((s) => s.selectedItemId);
  useCommandState((s) => s.search);
  useCommandState((s) => s.filtered.count);
  // cmdk resolves the selected row before the rows have rendered, so its own attribute is empty
  // on open and stale after a filter; the row that is selected in the document is the answer.
  // cmdk sets the attribute on the listbox too, where a filter can leave it naming a row that is
  // gone: the listbox names the same row as the field, or none.
  useLayoutEffect(() => {
    const input = own.current;
    if (!input) return;
    const root = input.closest("[cmdk-root]");
    const selected = root?.querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]');
    for (const element of [input, root?.querySelector<HTMLElement>("[cmdk-list]")]) {
      if (!element) continue;
      if (selected?.id) element.setAttribute("aria-activedescendant", selected.id);
      else element.removeAttribute("aria-activedescendant");
    }
  });
  const hintId = useId();
  const described = hint !== undefined && hint !== null && hint !== false;
  const describedBy =
    [props["aria-describedby"], described ? hintId : undefined].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div
      data-slot="command-input"
      className="flex h-control-large shrink-0 items-center gap-100 rounded-t-xxlarge border-b border-default px-150 focus-within:outline-field-focused"
    >
      <Search aria-hidden className="size-icon-medium shrink-0 icon-subtle" />
      <CommandPrimitive.Input
        ref={setRef}
        className={cn(
          "h-full w-full min-w-0 bg-surface-overlay font-body text-default outline-none placeholder:text-subtlest disabled:cursor-not-allowed disabled:text-disabled",
          className,
        )}
        {...props}
        aria-describedby={describedBy}
      />
      {hint === undefined ? (
        <span aria-hidden="true" className="flex shrink-0 items-center">
          <KbdShortcut keys="Escape" />
        </span>
      ) : described ? (
        <span id={hintId} data-slot="command-input-hint" className="flex shrink-0 items-center">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The rows, scrolling inside themselves past 340px; pass `style` for another cap. `label` names the
 * listbox, "Results" by default. A listbox must hold an option, so while no row shows and nothing
 * loads (a query that matches nothing, a list with no rows) the list is a plain container around
 * CommandEmpty's sentence, with no role and no name; its id stays, so the field still controls it.
 */
export function CommandList({
  className,
  label,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) {
  // The caller's ref, which setRef joins to the list's own; the spread's ref is replaced by it.
  const ref = props.ref;
  const { t } = useLedgerLocale();
  const { loading } = useContext(CommandContext);
  const name = label ?? t("commandListLabel");
  const rows = useCommandState((s) => s.filtered.count) > 0;
  // A busy listbox may be empty: its options are on their way.
  const busy = loading || props["aria-busy"] === true || props["aria-busy"] === "true";
  const own = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      own.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  // cmdk writes role="listbox" and the name whatever the list holds, and React writes them again
  // only when they change, so the list's own role and name are set after it on every render.
  useLayoutEffect(() => {
    const list = own.current;
    if (!list) return;
    if (rows || busy) {
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", name);
    } else {
      list.removeAttribute("role");
      list.removeAttribute("aria-label");
    }
  });
  return (
    <CommandPrimitive.List
      style={{ maxHeight: token("dimension.part.commandList") }}
      label={name}
      className={cn("overflow-y-auto overflow-x-hidden overscroll-none p-075", className)}
      {...props}
      ref={setRef}
    />
  );
}

export type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty> & {
  /** What to say when a query matches nothing, where `children` says the list has no rows before any query. `children` serves both by default. */
  noMatch?: ReactNode;
};

/** What the list says when no row shows. cmdk shows it only then, and never while a CommandLoading is showing: a load in progress is not an empty list. */
export function CommandEmpty({ className, noMatch, children, ...props }: CommandEmptyProps) {
  const { loading } = useContext(CommandContext);
  const search = useCommandState((s) => s.search);
  if (loading) return null;
  return (
    <CommandPrimitive.Empty
      className={cn("px-100 py-300 text-center font-body-small text-subtle", className)}
      {...props}
    >
      {search.trim() && noMatch !== undefined ? noMatch : children}
    </CommandPrimitive.Empty>
  );
}

/** Place alongside CommandList while rows are fetched: the kit's Spinner and a word, "Searching…" by default. cmdk marks it a progressbar named by `label`. While it shows, CommandEmpty and the spoken count wait. */
export function CommandLoading({
  label,
  className,
  children,
  ...props
}: ComponentProps<typeof CommandPrimitive.Loading>) {
  const { t } = useLedgerLocale();
  const { register } = useContext(CommandContext);
  // Before the first paint, so the empty sentence never shows for a frame while rows load.
  useLayoutEffect(() => register(), [register]);
  return (
    <CommandPrimitive.Loading
      label={label ?? t("loading")}
      className={cn(
        "flex items-center justify-center gap-100 px-100 py-300 font-body-small text-subtle",
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-100">
        <Spinner size="small" />
        <span>{children ?? t("searching")}</span>
      </span>
    </CommandPrimitive.Loading>
  );
}

/** Rows under a heading; the heading goes when every row under it is filtered out. */
export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "[&_[cmdk-group-heading]]:px-100 [&_[cmdk-group-heading]]:pb-050 [&_[cmdk-group-heading]]:pt-100 [&_[cmdk-group-heading]]:font-heading-xxsmall [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-subtlest",
        className,
      )}
      {...props}
    />
  );
}

export type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item> & {
  /**
   * The keys that run the same command from the page, written once for every platform: "Mod+E",
   * "Shift+D". They are drawn at the end of the row and given to it as `aria-keyshortcuts`, so the
   * row's name stays its label. Give the row a `value` when it has a shortcut.
   */
  shortcut?: string | undefined;
};

/**
 * One row: the label, an icon before it if the rows are of kinds, and children such as
 * CommandShortcut at the end. The selected row tints as a menu's does; while the field has focus it
 * also draws the field's focus outline, since focus stays in the field and the row is its active
 * descendant. The row under the pointer keeps the tint alone.
 */
export function CommandItem({ className, children, shortcut, ...props }: CommandItemProps) {
  const format = useFormatShortcut();
  return (
    <CommandPrimitive.Item
      aria-keyshortcuts={shortcut ? format(shortcut, "aria") : undefined}
      className={cn(
        menuItem,
        "min-h-control-medium",
        "data-[selected=true]:bg-neutral-subtle-hovered data-[disabled=true]:pointer-events-none data-[disabled=true]:text-disabled",
        "in-[[cmdk-root]:has([cmdk-input]:focus)]:data-[selected=true]:[&:not(:hover)]:outline-field-focused",
        className,
      )}
      {...props}
    >
      {children}
      {shortcut ? (
        <CommandShortcut>
          <KbdShortcut keys={shortcut} />
        </CommandShortcut>
      ) : null}
    </CommandPrimitive.Item>
  );
}

/** A rule between groups. cmdk hides it when the groups beside it are filtered out; the role is presentational because a listbox may not contain a separator. */
export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator {...props} asChild>
      <div role="presentation" className={cn(menuSeparator, className)} />
    </CommandPrimitive.Separator>
  );
}

export type CommandFooterProps = ComponentProps<"div">;

/** The hint row under the list: keys and what they do, and the count at the end. */
export function CommandFooter({ className, ...props }: CommandFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-150 border-t border-default bg-surface-sunken px-150 py-100 font-body-xsmall text-subtle",
        className,
      )}
      {...props}
      data-slot="command-footer"
    />
  );
}

export type CommandCountProps = Omit<ComponentProps<"span">, "children"> & {
  /** The word after the number when one row matches: "record". The locale's "match" by default. */
  one?: string | undefined;
  /** The word after the number for any other count: "records". The locale's "matches" by default. */
  many?: string | undefined;
};

/**
 * "12 matches": the live count of rows that match, in the locale's words and plural rules.
 * Renders inside a Command, in the field's hint (which describes the field) or the footer. `one`
 * and `many` put other words after the number: "record", "records".
 */
export function CommandCount({ one, many, className, ...props }: CommandCountProps) {
  const { formatPlural, messages } = useLedgerLocale();
  const count = useCommandState((s) => s.filtered.count);
  // A caller's word follows the number; a word it leaves out is the locale's, in its plural rules.
  const text = formatPlural(count, {
    one: one === undefined ? messages.commandMatchOne : `{count} ${one}`,
    other: many === undefined ? messages.commandMatchOther : `{count} ${many}`,
  });
  return (
    <span
      className={cn("shrink-0 font-body-xsmall text-subtle tabular-nums", className)}
      {...props}
      data-slot="command-count"
    >
      {text}
    </span>
  );
}

export type CommandDialogProps<Payload = unknown> = Omit<DialogProps<Payload>, "children"> & {
  /** The dialog's name, "Command palette" by default. Name the task: "Link evidence". */
  title?: string | undefined;
  /** Read after the name. "Search for a command to run." with the default title, and nothing with any other, since the sentence is the palette's. */
  description?: string | undefined;
  className?: string | undefined;
  showCloseButton?: boolean | undefined;
  finalFocus?: DialogContentProps["finalFocus"];
  style?: DialogContentProps["style"];
  children: ReactNode;
};

/** The top inset: 80px, or a tenth of the window where that is less, so a short window keeps its rows. */
const commandDialogTop = "min(var(--ds-space-1000), 10dvh)";

export function CommandDialog<Payload = unknown>({
  title,
  description,
  className,
  showCloseButton = false,
  finalFocus,
  style,
  children,
  ...props
}: CommandDialogProps<Payload>) {
  const { t } = useLedgerLocale();
  const name = title ?? t("commandPaletteTitle");
  const sentence =
    description ?? (title === undefined ? t("commandPaletteDescription") : undefined);
  const defaults = {
    top: commandDialogTop,
    maxWidth: token("dimension.part.command"),
    maxHeight: `calc(100dvh - ${commandDialogTop} - var(--ds-space-200))`,
  };
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn("translate-y-0", className)}
        style={
          typeof style === "function"
            ? (state) => ({ ...defaults, ...style(state) })
            : { ...defaults, ...style }
        }
        showCloseButton={showCloseButton}
        finalFocus={finalFocus}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{name}</DialogTitle>
          {sentence ? <DialogDescription>{sentence}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export type CommandShortcutProps = ComponentProps<"span">;
/**
 * A shortcut's keys at the end of a row, hidden from assistive technology so the row's name is its
 * label: CommandItem's `shortcut` draws one and says it as `aria-keyshortcuts`. Content at the end
 * that is not a shortcut, such as a count, passes `aria-hidden={false}`.
 */
export function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("ms-auto shrink-0 font-body-xsmall text-subtle", className)}
      {...props}
      data-slot="command-shortcut"
    />
  );
}
