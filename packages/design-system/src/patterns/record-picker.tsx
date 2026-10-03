import { useEffect, useId, useRef, type ReactNode } from "react";
import { Alert, AlertAction, AlertDescription } from "../components/alert";
import { Badge, type Tone } from "../components/badge";
import { Button } from "../components/button";
import {
  Command,
  CommandCount,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "../components/command";
import { Id } from "../components/id";
import { Truncate } from "../components/truncate";
import { token } from "../generated/tokens";
import { announce } from "../lib/announce";
import { CommandKeys } from "../lib/command-keys";
import { useLedgerLocale } from "../lib/locale";

/* Finds one record by name and shows the key beside it, with its status, as a CommandDialog: the
   code, the title with its meta under it, one badge at the end, the count of matches in the field
   and a footer of keys. It picks one and closes; choosing many by attribute is the PickerSheet. */

export type PickerRecord = {
  /** The record's key: what `onPick` hands back. Shown before the title when there is no `code`. */
  id: string;
  /** The identifier a person reads, before the title: "EV-0412". The `id` unsaid; give it whenever `id` is a database key. */
  code?: string | undefined;
  /** The line a person reads. */
  title: string;
  /** Under it: kind, source, date. */
  meta?: string | undefined;
  /** Right-aligned: state, freshness, severity. */
  badge?: { label: string; tone?: Tone | undefined } | undefined;
  /** Matched against the query, never shown. */
  keywords?: string | undefined;
};

export type RecordPickerProps = {
  open: boolean;
  onClose: () => void;
  /** The chosen record. The picker closes itself after. */
  onPick: (record: PickerRecord) => void;
  /** The records on offer, already narrowed by the caller to the ones that may be picked. */
  records: PickerRecord[];
  /** The dialog's name, the task: "Link evidence", "Assign to". */
  title: string;
  /** The field's placeholder, what the reader types: "Search evidence…". */
  placeholder: string;
  /** Read after the title as the picker opens. "Find a record by its name or its identifier." unsaid. */
  description?: string | undefined;
  /** What to say when the query matches nothing. "Nothing matches" unsaid. */
  emptyHint?: string | undefined;
  /** What to say when there are no records at all, before any query. "Nothing to choose from" unsaid. */
  empty?: string | undefined;
  /** Records still arriving: the ones listed stay usable with Searching… under them, and the picker never says nothing matched while they load. */
  loading?: boolean | undefined;
  /** The records could not load: `true` for the default words, or the words to show. Above any records listed, with Try again when `onRetry` is given. */
  error?: ReactNode;
  /** Loads the records again. Focus returns to the field. */
  onRetry?: (() => void) | undefined;
};

/**
 * Pick one record from a list: evidence to link, a requirement to derive from, a person to
 * assign. Presentational: the caller supplies the records and gets the chosen one back. For
 * choosing many by attribute, use PickerSheet.
 */
export function RecordPicker({
  open,
  onClose,
  onPick,
  records,
  title,
  placeholder,
  description,
  emptyHint,
  empty,
  loading = false,
  error,
  onRetry,
}: RecordPickerProps) {
  const { t } = useLedgerLocale();
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
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description={description ?? t("searchDescription")}
      style={{ maxWidth: token("dimension.part.recordSearch") }}
    >
      <Command label={title}>
        {/* The first field takes focus as the dialog opens, and focus goes back to the opener on close. */}
        {/* A load that failed with nothing listed has no count: "0 matches" would say the query missed. */}
        <CommandInput
          ref={field}
          placeholder={placeholder}
          hint={failed && !records.length ? null : <CommandCount />}
        />
        {failed ? (
          <div data-slot="record-picker-error" className="px-075 pt-075">
            {/* Said through the Announcer, which reaches the reader inside the modal once. */}
            <Alert tone="danger" role={undefined}>
              <AlertDescription ref={alert} id={errorId}>
                {error === true ? t("recordPickerFailed") : error}
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
        <CommandList style={{ maxHeight: "46vh" }} aria-busy={loading || undefined}>
          {records.map((r) => {
            const code = r.code ?? r.id;
            return (
              <CommandItem
                key={r.id}
                value={r.id}
                keywords={[r.code ?? "", r.title, r.meta ?? "", r.keywords ?? ""]}
                className="h-auto py-100"
                onSelect={() => {
                  onPick(r);
                  onClose();
                }}
              >
                {/* Bounded, so a long identifier truncates before the name does. */}
                <Id
                  className="min-w-0 truncate text-subtle"
                  style={{ maxWidth: "40%" }}
                  title={code}
                >
                  {code}
                </Id>
                {/* The name takes the rest of the row; a cut name or meta shows whole on hover. */}
                <span className="min-w-0 flex-1">
                  <Truncate>{r.title}</Truncate>
                  {r.meta ? (
                    <Truncate className="font-body-xsmall text-subtle">{r.meta}</Truncate>
                  ) : null}
                </span>
                {r.badge ? (
                  <Badge variant="secondary" size="xsmall" tone={r.badge.tone ?? "neutral"}>
                    {r.badge.label}
                  </Badge>
                ) : null}
              </CommandItem>
            );
          })}
        </CommandList>
        {loading ? <CommandLoading /> : null}
        {failed && !records.length ? null : (
          <CommandEmpty noMatch={emptyHint ?? t("noMatches")}>
            {empty ?? t("recordPickerEmpty")}
          </CommandEmpty>
        )}
        <CommandFooter>
          <CommandKeys />
        </CommandFooter>
      </Command>
    </CommandDialog>
  );
}
