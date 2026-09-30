import { defaultFilter } from "cmdk";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { Alert, AlertAction, AlertDescription } from "../components/alert";
import { Button } from "../components/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandShortcut,
} from "../components/command";
import {
  getModifierKey,
  KbdShortcut,
  shortcutKeys,
  useFormatShortcut,
  type ModifierKey,
} from "../components/kbd";
import { announce } from "../lib/announce";
import { CommandKeys } from "../lib/command-keys";
import { useLedgerLocale } from "../lib/locale";

/* The ⌘K palette: a field at the top, commands under headings, a shortcut at the end of the ones that have one,
   the chosen command run and the palette gone. The commands are plain objects the caller
   supplies, so the palette stays presentational and every page can reuse it. */

export type PaletteCommand = {
  /** Unique command identity; labels and group headings may repeat. Never shown and never matched, so an internal id such as a UUID is safe here. */
  id: string;
  /** Commands with the same group, in sequence, share a heading. Matched. */
  group: string;
  /** A verb and its object: "Record an assessment", "Export the SSP". Matched first. */
  label: string;
  /**
   * The keys that run the command from the page, written once for every platform: "Mod+E",
   * "Shift+E". Drawn at the end in the platform's glyphs and given to the row as
   * `aria-keyshortcuts`, so the row's name stays its label.
   */
  shortcut?: string | undefined;
  /** Other words at the end, read with the label: a count, a state. A shortcut goes in `shortcut`. Matched. */
  hint?: string | undefined;
  run: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  /** In the order they show, grouped by `group`. The page's verbs first, the places after. */
  commands: PaletteCommand[];
  /** The field's placeholder. "Type a command…" by default. */
  placeholder?: string | undefined;
  /** The dialog's name and the field's. "Command palette" by default. */
  title?: string | undefined;
  /** Read after the name when the palette opens. "Search for a command to run." by default. */
  description?: string | undefined;
  /** What the list says when the query matches no command. "No commands match." by default. */
  noResults?: ReactNode;
  /** What Enter does, in the footer. "to run" by default. */
  chooseHint?: string | undefined;
  /** Commands still arriving. Commands already listed stay usable, with Searching… under them, and the palette never says nothing matched while they load. */
  loading?: boolean | undefined;
  /** The commands could not load: `true` for the default message, or the words to show. It shows above any commands listed, with Retry when `onRetry` is given. */
  error?: ReactNode;
  /** Loads the commands again. Focus returns to the field. */
  onRetry?: (() => void) | undefined;
};

/** A dialog the reader is already in: the shortcut never opens the palette over it. */
const OPEN_DIALOG = '[role="dialog"][data-open], [role="alertdialog"][data-open]';

/** The modifiers and the key of a shortcut such as "Mod+K", as a test for a keydown. */
function shortcutMatcher(shortcut: string, modifier: ModifierKey) {
  const mods = { Control: false, Alt: false, Shift: false, Meta: false };
  let key = "";
  for (const { aria } of shortcutKeys(shortcut, { modifier })) {
    if (Object.hasOwn(mods, aria)) mods[aria as keyof typeof mods] = true;
    else key = aria;
  }
  const lower = key.toLowerCase();
  // With Option held a Mac types another character, so a letter or a digit also matches its code.
  const code = /^[a-z]$/.test(lower)
    ? `Key${lower.toUpperCase()}`
    : /^[0-9]$/.test(lower)
      ? `Digit${lower}`
      : undefined;
  return (event: KeyboardEvent) =>
    event.ctrlKey === mods.Control &&
    event.altKey === mods.Alt &&
    event.shiftKey === mods.Shift &&
    event.metaKey === mods.Meta &&
    (event.key.toLowerCase() === lower || (code !== undefined && event.code === code));
}

export type UseCommandPaletteOptions = {
  /** The shortcut that toggles the palette, written once for every platform: "Mod+K" by default, ⌘K on Apple platforms and Ctrl+K elsewhere. `null` for none. */
  shortcut?: string | null | undefined;
};

/**
 * The palette's open state, toggled by its shortcut (⌘K on Apple platforms, Ctrl+K elsewhere)
 * anywhere on the page. The shortcut is ignored on key repeat, with another modifier held, while
 * composing text, when a handler has already taken the key, and while another dialog is open.
 */
export function useCommandPalette({ shortcut = "Mod+K" }: UseCommandPaletteOptions = {}) {
  const [open, setOpen] = useState(false);
  const isOpen = useRef(open);
  useLayoutEffect(() => {
    isOpen.current = open;
  });
  useEffect(() => {
    if (!shortcut) return;
    const matches = shortcutMatcher(shortcut, getModifierKey());
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (!matches(event)) return;
      // Over another dialog, a second modal would stack on its task, a draft among them.
      if (!isOpen.current && document.querySelector(OPEN_DIALOG)) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);
  return { open, setOpen };
}

/**
 * Scores a command on its label, then its heading and hint, never its id: an id's letters would
 * let a short query match every command.
 */
const byLabel = (_id: string, search: string, keywords?: string[]) => {
  const [label = "", ...rest] = keywords ?? [];
  return defaultFilter(label, search, rest);
};

/**
 * A ⌘K palette over a page or a record. The commands are plain objects the caller supplies, so
 * the palette stays presentational and every page can reuse it; choosing one closes the palette
 * and runs it. It runs a command; finding a record is the SearchDialog.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder,
  title,
  description,
  noResults,
  chooseHint,
  loading = false,
  error,
  onRetry,
}: CommandPaletteProps) {
  const { t } = useLedgerLocale();
  const format = useFormatShortcut();
  const name = title ?? t("commandPaletteTitle");
  const failed = error !== undefined && error !== null && error !== false;
  const field = useRef<HTMLInputElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const errorId = useId();
  // A failure interrupts: it is said at once, assertively, each time one arrives.
  useEffect(() => {
    if (!open || !failed) return;
    const text = alert.current?.textContent?.trim();
    if (text) announce(text, { politeness: "assertive" });
  }, [open, failed, error]);

  const groups: [string, PaletteCommand[]][] = [];
  for (const c of commands) {
    const last = groups[groups.length - 1];
    if (last && last[0] === c.group) last[1].push(c);
    else groups.push([c.group, [c]]);
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={name}
      description={description ?? t("commandPaletteDescription")}
    >
      <Command label={name} filter={byLabel}>
        <CommandInput
          ref={field}
          placeholder={placeholder ?? t("commandPalettePlaceholder")}
          hint={null}
        />
        {failed ? (
          <div className="px-075 pt-075">
            {/* Said through the Announcer, which reaches the reader inside the modal once. */}
            <Alert tone="danger" role={undefined} data-slot="command-palette-error">
              <AlertDescription ref={alert} id={errorId}>
                {error === true ? t("commandFailed") : error}
              </AlertDescription>
              {onRetry ? (
                <AlertAction>
                  <Button
                    size="small"
                    aria-describedby={errorId}
                    onClick={() => {
                      field.current?.focus();
                      onRetry();
                    }}
                  >
                    {t("retry")}
                  </Button>
                </AlertAction>
              ) : null}
            </Alert>
          </div>
        ) : null}
        <CommandList aria-busy={loading || undefined}>
          {groups.map(([group, items]) => (
            <CommandGroup key={items[0]!.id} value={items[0]!.id} heading={group}>
              {items.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  keywords={[c.label, c.group, c.hint ?? ""]}
                  aria-keyshortcuts={c.shortcut ? format(c.shortcut, "aria") : undefined}
                  onSelect={() => {
                    onClose();
                    c.run();
                  }}
                >
                  {c.label}
                  {c.hint || c.shortcut ? (
                    <span className="ms-auto flex shrink-0 items-center gap-100">
                      {c.hint ? (
                        <span
                          data-slot="command-palette-hint"
                          className="font-body-xsmall text-subtle"
                        >
                          {c.hint}
                        </span>
                      ) : null}
                      {c.shortcut ? (
                        // Hidden, beside the hint: the row's aria-keyshortcuts says the keys.
                        <CommandShortcut className="flex items-center">
                          <KbdShortcut keys={c.shortcut} />
                        </CommandShortcut>
                      ) : null}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        {loading ? <CommandLoading /> : null}
        {failed && !commands.length ? null : (
          <CommandEmpty>{noResults ?? t("commandNoMatches")}</CommandEmpty>
        )}
        <CommandFooter>
          <CommandKeys choose={chooseHint ?? t("keyHintRun")} />
        </CommandFooter>
      </Command>
    </CommandDialog>
  );
}
