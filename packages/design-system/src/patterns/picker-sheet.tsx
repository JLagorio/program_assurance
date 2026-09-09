import { ChevronLeft, Search } from "lucide-react";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/sheet";

import { Button } from "../components/button";
import { Input } from "../components/controls";
import { InputGroup } from "../components/input-group";

/**
 * Choosing many from hundreds: the association panel. A Sheet whose toolbar is a search field and the
 * filters, whose body is a Table with sortable headers and Table.Selection, and whose footer names what is
 * chosen and the one thing to do with it. Selection survives search and filters. When the chosen rows need
 * fields of their own, a second frame of the same sheet shows them as a compact table with Editable cells
 * and a default applied to all; `onBack` returns to the first frame. The kit owns the frame; the caller
 * owns the columns, the rows and the selection.
 */
export type PickerSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Back to the choosing frame from the details frame. */
  onBack?: (() => void) | undefined;
  /** The task, a verb and its object: "Allocate requirements". */
  title: ReactNode;
  /** What the chosen rows will be attached to: "Flight computer · 14 allocated today". */
  subtitle?: ReactNode;
  /** The search field in the toolbar; the caller filters the rows. */
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
  /** Clears the selection; a link in the footer beside the count. */
  onClear?: (() => void) | undefined;
  /** The one thing the footer does, named in full: "Allocate 12 to Flight computer". */
  action: { label: ReactNode; onClick: () => void; disabled?: boolean | undefined };
  /** A second, lesser button before Cancel: "Continue without details". */
  secondary?: ReactNode;
  /** Pixels, 760 by default: room for a table of four columns. */
  width?: number | undefined;
  /** Frame one: a DataTable with a selection. Frame two: a DataTable of the chosen rows with editable cells. */
  children: ReactNode;
};

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
}: PickerSheetProps) {
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
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: width }}>
        <SheetHeader>
          <div className="flex items-start gap-100">
            <Button
              aria-label="Back"
              variant="subtle"
              size="small"
              className="size-control-small p-0"
              onClick={onBack}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-025">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{subtitle}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="shrink-0 border-b border-default px-200 py-100">
          {hasToolbar ? (
            <div className="flex flex-col gap-100">
              {search || filters ? (
                <div className="flex flex-wrap items-center gap-100">
                  {search ? (
                    <InputGroup leading={<Search />} width={240}>
                      <Input
                        value={search.value}
                        onChange={(e) => search.onChange(e.target.value)}
                        placeholder={search.placeholder ?? "Search"}
                        aria-label={search.placeholder ?? "Search"}
                        className="h-control-small"
                      />
                    </InputGroup>
                  ) : null}
                  {filters}
                </div>
              ) : null}
              {toolbar}
            </div>
          ) : undefined}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          {children}
        </div>
        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
