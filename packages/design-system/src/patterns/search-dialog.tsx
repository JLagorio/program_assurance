import { Autocomplete } from "@base-ui/react/autocomplete";
import { Search } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

import { Alert, AlertAction, AlertDescription } from "../components/alert";
import { Button } from "../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
} from "../components/dialog";
import { Id } from "../components/id";
import {
  menuItem,
  menuItemDescription,
  menuItemDisabled,
  menuItemHighlighted,
  menuLabel,
} from "../components/menu";
import { Spinner } from "../components/spinner";
import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { CommandKeys } from "../lib/command-keys";
import { useLedgerLocale } from "../lib/locale";

/* Finds a record across the product's record types: a field at the top, the results under their
   type, each row the record's identifier, its name with a line of meta under it and one badge at
   the end, and the keys in the footer. Base UI's Autocomplete, rendered inline in a Dialog, owns
   the listbox, the arrow keys and the active descendant, which follows the highlighted row as the
   results change. The caller owns the records and the query: it hands over every record and lets
   the dialog match them, or runs the search itself and hands over the results. */

export type SearchResult = {
  /** Unique identity: the row's key and what `onSelect` hands back. Never shown and never matched, so an internal id such as a UUID is safe here. */
  id: string;
  /** The line a person reads: the record's name. */
  title: string;
  /** The identifier people know the record by, shown before the title: "PRG-014", "RSK-0412". Matched. */
  identifier?: string | undefined;
  /** Under the title, in a few words: the type, the owner, a date. Matched. */
  meta?: string | undefined;
  /** At the end: the one status the choice turns on, usually a Badge. */
  badge?: ReactNode;
  /** The heading over the row, usually the record type. Results with the same group, in sequence, share one heading. Matched. */
  group?: string | undefined;
  /** Matched against the query and never shown: other names, codes, tags. */
  keywords?: string | undefined;
  /** A row that is listed but cannot be opened. The arrows still reach it; prefer `disabledReason`, which says why. */
  disabled?: boolean | undefined;
  /** Why the record cannot be opened now. It disables the row and shows the reason under the meta, as the row's description. An empty string is no reason. */
  disabledReason?: string | undefined;
};

export type SearchDialogProps = {
  /** Whether the dialog is open. TopNav.Search's `onOpen` opens it. */
  open: boolean;
  /** Called with `false` on Escape, a press outside, the footer's close and after a choice. */
  onOpenChange: (open: boolean) => void;
  /** The records to search, which the dialog matches against the query; with `filter={null}`, the results of the caller's own search for `query`. */
  results: SearchResult[];
  /** The chosen record. The dialog closes first, then this runs, so a navigation or a dialog it opens does not stack on the search. */
  onSelect: (result: SearchResult) => void;
  /** What the dialog lists before anything is typed: recent or suggested records. Without them it shows the prompt. */
  initialResults?: SearchResult[] | undefined;
  /** The query, controlled. Pair it with `onQueryChange`; a remote search runs from here. */
  query?: string | undefined;
  /** The query on open, uncontrolled. The query empties when the dialog has closed. */
  defaultQuery?: string | undefined;
  /** Every change to the query, as typed. Debounce a remote search here. */
  onQueryChange?: ((query: string) => void) | undefined;
  /**
   * Which results match the query. By default every word of the query must appear, ignoring case
   * and accents, in the title, the identifier, the meta, the group or the keywords (never the id).
   * `null` matches nothing itself: `results` are already the caller's results for the query.
   */
  filter?: ((result: SearchResult, query: string) => boolean) | null | undefined;
  /** A search in flight. Results already listed stay usable; with none, the dialog says it is searching instead of saying nothing matched. */
  loading?: boolean | undefined;
  /** The search failed: `true` for the default message, or the words to show. It shows above any results already listed, with Retry when `onRetry` is given. */
  error?: ReactNode;
  /** Runs the search again. Focus returns to the field. */
  onRetry?: (() => void) | undefined;
  /** The dialog's name and the field's, "Search" by default. */
  title?: string | undefined;
  /** Read after the name when the dialog opens. "Find a record by its name or its identifier." by default. */
  description?: string | undefined;
  /** What to type, in the field: "Search programs, risks and findings". "Type a name or an identifier" by default. */
  placeholder?: string | undefined;
  /** What the dialog says before anything is typed, when there are no `initialResults`. The description by default. */
  prompt?: ReactNode;
  /** What the dialog says when the query finds nothing. By default "No results for “…”" and a hint. */
  noResults?: ReactNode;
  /** Where focus goes when the dialog closes: the element that opened it by default. */
  finalFocus?: DialogContentProps["finalFocus"];
  /** On the dialog's surface, for its width. */
  className?: string | undefined;
  /** On the dialog's surface. The width is 640px at most by default. */
  style?: CSSProperties | undefined;
  /** The dialog's surface. */
  ref?: Ref<HTMLDivElement> | undefined;
};

type Group = { key: string; label: string | undefined; items: SearchResult[] };

/** Consecutive results with the same group share a heading, so a heading may repeat further down. */
function groupResults(rows: SearchResult[]): Group[] {
  const groups: Group[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.label === row.group) last.items.push(row);
    else
      groups.push({ key: `${groups.length}:${row.group ?? ""}`, label: row.group, items: [row] });
  }
  return groups;
}

/** How long the results must hold still before their count is spoken, so typing is not interrupted. */
const ANNOUNCE_DELAY = 600;

/** The top inset: 80px, or a tenth of the window where that is less, so a short window keeps room for the results. */
const dialogTop = "min(var(--ds-space-1000), 10dvh)";

/**
 * A search across the product's records, opened from the top nav's search (TopNav.Search) or ⌘K.
 * Rows show each record's identity: its identifier, its name, a line of meta and one badge. It
 * says when it is searching, when the search failed (with Retry), what to type before a query, and
 * when a query finds nothing; the count of results is spoken through the page's Announcer. It
 * finds a record; running a command is the CommandPalette, and picking a record for a field or a
 * link is the RecordPicker.
 */
export function SearchDialog({
  open,
  onOpenChange,
  results,
  onSelect,
  initialResults,
  query,
  defaultQuery,
  onQueryChange,
  filter,
  loading = false,
  error,
  onRetry,
  title,
  description,
  placeholder,
  prompt,
  noResults,
  finalFocus,
  className,
  style,
  ref,
}: SearchDialogProps) {
  const { t, locale, messages, formatPlural } = useLedgerLocale();
  const [draft, setDraft] = useState(defaultQuery ?? "");
  const current = query ?? draft;
  const setQuery = (next: string) => {
    if (query === undefined) setDraft(next);
    onQueryChange?.(next);
  };
  const trimmed = current.trim();

  const { contains } = Autocomplete.useFilter({ locale, sensitivity: "base" });
  const rows = useMemo(() => {
    if (!trimmed) return initialResults ?? [];
    if (filter === null) return results;
    const words = trimmed.split(/\s+/);
    const matches =
      filter ??
      ((result: SearchResult) => {
        const fields = [
          result.title,
          result.identifier,
          result.meta,
          result.group,
          result.keywords,
        ].filter((field): field is string => Boolean(field));
        return words.every((word) => fields.some((field) => contains(field, word)));
      });
    return results.filter((result) => matches(result, trimmed));
  }, [trimmed, initialResults, filter, results, contains]);
  const groups = useMemo(() => groupResults(rows), [rows]);
  // Each row's place in the whole list, across the headings, for Base UI's keyboard order.
  const position = useMemo(() => new Map(rows.map((result, i) => [result, i])), [rows]);

  const failed = error !== undefined && error !== null && error !== false;
  const count =
    trimmed && rows.length
      ? formatPlural(rows.length, {
          one: messages.searchResultOne,
          other: messages.searchResultOther,
        })
      : "";

  const input = useRef<HTMLInputElement>(null);
  const message = useRef<HTMLDivElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const errorId = useId();

  // A failure interrupts: it is said at once, assertively, each time one arrives.
  useEffect(() => {
    if (!open || !failed) return;
    const text = alert.current?.textContent?.trim();
    if (text) announce(text, { politeness: "assertive" });
  }, [open, failed]);
  // The results are said once they hold still: the count, or what the dialog says instead.
  const settled = open && !failed && !loading && trimmed !== "";
  const nothing = noResults === undefined ? t("searchNoResults", { query: trimmed }) : undefined;
  useEffect(() => {
    if (!settled) return;
    const timer = setTimeout(() => {
      const text = count || nothing || message.current?.textContent?.trim();
      if (text) announce(text);
    }, ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [settled, trimmed, count, nothing]);

  const unavailable = (result: SearchResult) => Boolean(result.disabled || result.disabledReason);
  const choose = (result: SearchResult) => {
    if (unavailable(result)) return;
    onOpenChange(false);
    onSelect(result);
  };
  const rowsId = useId();
  const row = (result: SearchResult) => {
    const index = position.get(result) ?? 0;
    const reasonId = `${rowsId}-${index}-reason`;
    return (
      <Autocomplete.Item
        key={result.id}
        value={result}
        index={index}
        disabled={unavailable(result)}
        onClick={() => choose(result)}
        aria-describedby={result.disabledReason ? reasonId : undefined}
        data-slot="search-dialog-result"
        className={cn(
          menuItem,
          menuItemHighlighted,
          menuItemDisabled,
          "h-auto items-start py-100 forced-colors:data-[highlighted]:outline-field-focused",
        )}
      >
        {result.identifier ? <Id className="shrink-0 text-subtle">{result.identifier}</Id> : null}
        <span className="min-w-0 flex-1">
          <span className="block break-words">{result.title}</span>
          {result.meta ? (
            <span className="block break-words font-body-xsmall text-subtle">{result.meta}</span>
          ) : null}
          {result.disabledReason ? (
            // Hidden from the name; aria-describedby still reads it, as in DropdownMenuItem.
            <span
              id={reasonId}
              aria-hidden
              data-slot="search-dialog-result-reason"
              className={menuItemDescription}
            >
              {result.disabledReason}
            </span>
          ) : null}
        </span>
        {result.badge ? <span className="flex shrink-0 items-center">{result.badge}</span> : null}
      </Autocomplete.Item>
    );
  };

  const name = title ?? t("search");
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen && query === undefined) setDraft(defaultQuery ?? "");
      }}
    >
      <DialogContent
        ref={ref}
        showCloseButton={false}
        initialFocus={input}
        finalFocus={finalFocus}
        className={cn("translate-y-0", className)}
        style={{
          top: dialogTop,
          maxWidth: 640,
          maxHeight: `calc(100dvh - ${dialogTop} - var(--ds-space-200))`,
          ...style,
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{description ?? t("searchDescription")}</DialogDescription>
        </DialogHeader>
        <div data-slot="search-dialog" className="flex min-h-0 flex-1 flex-col">
          <Autocomplete.Root
            inline
            open
            items={groups}
            filter={null}
            locale={locale}
            value={current}
            onValueChange={(next, details) => {
              // Choosing a row would write its title into the field; the dialog closes instead.
              if (details.reason === "item-press") return;
              setQuery(next);
            }}
            itemToStringValue={(result) => result.title}
            autoHighlight="always"
            keepHighlight
          >
            <div
              data-slot="search-dialog-field"
              className="flex h-control-large shrink-0 items-center gap-100 rounded-t-xxlarge border-b border-default px-150 focus-within:outline-field-focused"
            >
              <Search aria-hidden className="size-icon-medium shrink-0 icon-subtle" />
              <Autocomplete.Input
                ref={input}
                aria-label={name}
                placeholder={placeholder ?? t("searchPlaceholder")}
                className="h-full w-full min-w-0 bg-surface-overlay font-body text-default outline-none placeholder:text-subtlest"
              />
              {loading ? <Spinner isDecorative /> : null}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-075 overflow-y-auto overflow-x-hidden overscroll-none p-075">
              {failed ? (
                <Alert
                  tone="danger"
                  // Said through the Announcer, which reaches the reader inside the modal once.
                  role={undefined}
                  data-slot="search-dialog-error"
                >
                  <AlertDescription ref={alert} id={errorId}>
                    {error === true ? t("searchFailed") : error}
                  </AlertDescription>
                  {onRetry ? (
                    <AlertAction>
                      <Button
                        size="small"
                        aria-describedby={errorId}
                        onClick={() => {
                          input.current?.focus();
                          onRetry();
                        }}
                      >
                        {t("retry")}
                      </Button>
                    </AlertAction>
                  ) : null}
                </Alert>
              ) : null}
              <Autocomplete.List aria-busy={loading || undefined} className="outline-none">
                {groups.map((group) =>
                  group.label ? (
                    <Autocomplete.Group
                      key={group.key}
                      items={group.items}
                      className="flex flex-col"
                    >
                      <Autocomplete.GroupLabel className={menuLabel}>
                        {group.label}
                      </Autocomplete.GroupLabel>
                      {group.items.map(row)}
                    </Autocomplete.Group>
                  ) : (
                    group.items.map(row)
                  ),
                )}
              </Autocomplete.List>
              {rows.length || failed ? null : (
                <div
                  ref={message}
                  data-slot="search-dialog-message"
                  className="flex flex-col items-center gap-050 px-100 py-300 text-center font-body-small text-subtle"
                >
                  {!trimmed ? (
                    (prompt ?? t("searchDescription"))
                  ) : loading ? (
                    <span className="inline-flex items-center gap-100">
                      <Spinner isDecorative />
                      {t("searching")}
                    </span>
                  ) : (
                    (noResults ?? (
                      <>
                        <span className="font-body text-default">
                          {t("searchNoResults", { query: trimmed })}
                        </span>
                        <span>{t("searchNoResultsHint")}</span>
                      </>
                    ))
                  )}
                </div>
              )}
            </div>
            <div
              data-slot="search-dialog-footer"
              className="flex shrink-0 flex-wrap items-center gap-x-150 gap-y-050 border-t border-default bg-surface-sunken px-150 py-100 font-body-xsmall text-subtle"
            >
              <CommandKeys choose={t("keyHintOpen")} />
              {count ? <span className="ms-auto shrink-0 tabular-nums">{count}</span> : null}
            </div>
          </Autocomplete.Root>
        </div>
      </DialogContent>
    </Dialog>
  );
}
