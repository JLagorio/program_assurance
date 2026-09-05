import { Badge, type Tone } from "../components/badge";
import { Command } from "../components/command";
import { Id } from "../components/id";
import { CommandKeys } from "../lib/command-keys";

/* Finds one record by name and shows the key beside it, with its status, as a Command.Dialog: the id, the title with its meta under it, one badge at the end, the count of
   matches in the field and a footer of keys. It picks one and closes; choosing many by attribute
   is the PickerSheet. */

export type PickerRecord = {
  id: string;
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
  /** What to say when nothing matches. "Nothing matches." by default. */
  emptyHint?: string | undefined;
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
  emptyHint,
}: RecordPickerProps) {
  return (
    <Command.Dialog open={open} onClose={onClose} label={title} width="large">
      <Command.Input placeholder={placeholder} hint={<Command.Count />} autoFocus />
      <Command.List style={{ maxHeight: "46vh" }}>
        <Command.Empty>{emptyHint ?? "Nothing matches."}</Command.Empty>
        {records.map((r) => (
          <Command.Item
            key={r.id}
            value={`${r.id} ${r.title} ${r.meta ?? ""} ${r.keywords ?? ""}`}
            className="h-auto py-100"
            onSelect={() => {
              onPick(r);
              onClose();
            }}
          >
            <Id className="text-subtle">{r.id}</Id>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{r.title}</span>
              {r.meta ? (
                <span className="block truncate font-body-xsmall text-subtle">{r.meta}</span>
              ) : null}
            </span>
            {r.badge ? (
              <Badge size="xsmall" tone={r.badge.tone ?? "neutral"}>
                {r.badge.label}
              </Badge>
            ) : null}
          </Command.Item>
        ))}
      </Command.List>
      <Command.Footer>
        <CommandKeys />
      </Command.Footer>
    </Command.Dialog>
  );
}
