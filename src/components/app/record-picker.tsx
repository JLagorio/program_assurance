/**
 * Pick one record from a list: evidence to link, a requirement to derive
 * from, a person to assign. Presentational; the caller supplies the records
 * and gets the chosen one back.
 */

import { Badge, Command, Id } from "@ledger/design-system";

export type PickerRecord = {
  id: string;
  /** The line a person actually reads. */
  title: string;
  /** Secondary line: kind, source, date. */
  meta?: string;
  /** Right-aligned chip: state, freshness, severity. */
  badge?: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "information" };
  /** Extra text matched against the query but not displayed. */
  keywords?: string;
};

export function RecordPicker({
  open,
  onClose,
  onPick,
  records,
  title,
  placeholder,
  emptyHint,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (record: PickerRecord) => void;
  records: PickerRecord[];
  title: string;
  placeholder: string;
  emptyHint?: string;
}) {
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
        <span>↑↓ navigate</span>
        <span>↵ link</span>
        <span>esc close</span>
      </Command.Footer>
    </Command.Dialog>
  );
}
