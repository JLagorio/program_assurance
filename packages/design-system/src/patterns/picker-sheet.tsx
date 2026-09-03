import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../components/button";
import { Input } from "../components/controls";
import { InputGroup } from "../components/input-group";
import { Sheet } from "../components/sheet";

/**
 * Choosing many from hundreds: the association panel. A Sheet whose toolbar is a search field and the
 * filters, whose body is a Table with sortable headers and Table.Selection, and whose footer names what is
 * chosen and the one thing to do with it. Selection survives search and filters. When the chosen rows need
 * fields of their own, a second frame of the same sheet shows them as a compact table with Editable cells
 * and a default applied to all; `onBack` returns to the first frame. The kit owns the frame; the caller
 * owns the columns, the rows and the selection.
 */
export function PickerSheet({
  open,
  onClose,
  onBack,
  title,
  subtitle,
  search,
  filters,
  toolbar,
  selected,
  total,
  onClear,
  action,
  secondary,
  width = 760,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Back to the choosing frame from the details frame. */
  onBack?: (() => void) | undefined;
  title: ReactNode;
  /** What the chosen rows will be attached to: "Flight computer · 14 allocated today". */
  subtitle?: ReactNode;
  search?:
    | { value: string; onChange: (value: string) => void; placeholder?: string | undefined }
    | undefined;
  /** FilterChips after the search field. */
  filters?: ReactNode;
  /** A row under search and filters that does not scroll: a default applied to every chosen row. */
  toolbar?: ReactNode;
  /** How many rows are chosen. The footer reads it out and the action waits for it. */
  selected: number;
  /** How many rows are on offer after search and filters. */
  total?: number | undefined;
  onClear?: (() => void) | undefined;
  /** The one thing the footer does, named in full: "Allocate 12 to Flight computer". */
  action: { label: ReactNode; onClick: () => void; disabled?: boolean | undefined };
  /** A second, lesser button before Cancel: "Continue without details". */
  secondary?: ReactNode;
  width?: number | undefined;
  children: ReactNode;
}) {
  const summary =
    selected === 0
      ? total !== undefined
        ? `${total} to choose from`
        : "Nothing chosen yet"
      : `${selected} chosen${total !== undefined ? ` of ${total}` : ""}`;
  const hasToolbar = Boolean(search || filters || toolbar);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      onBack={onBack}
      width={width}
      title={title}
      subtitle={subtitle}
      toolbar={
        hasToolbar ? (
          <div className="flex flex-col gap-100">
            {search || filters ? (
              <div className="flex flex-wrap items-center gap-100">
                {search ? (
                  <InputGroup leading={<Search />} width={240}>
                    <Input
                      value={search.value}
                      onChange={(e) => search.onChange(e.target.value)}
                      placeholder={search.placeholder ?? "Search"}
                      className="h-control-small"
                    />
                  </InputGroup>
                ) : null}
                {filters}
              </div>
            ) : null}
            {toolbar}
          </div>
        ) : undefined
      }
      footer={
        <div className="flex w-full items-center justify-between gap-150">
          <span className="flex items-center gap-100 font-body-small text-subtle">
            <span className="tabular-nums">{summary}</span>
            {selected > 0 && onClear ? (
              <Button variant="link" size="small" onClick={onClear}>
                Clear
              </Button>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-100">
            {secondary}
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={selected === 0 || Boolean(action.disabled)}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </span>
        </div>
      }
    >
      {children}
    </Sheet>
  );
}
