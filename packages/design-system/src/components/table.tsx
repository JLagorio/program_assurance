import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, Eye } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Count } from "./badge";
import { Checkbox } from "./controls";
import { Id } from "./id";
import { Tooltip } from "./tooltip";

function TableRoot({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left font-body", className)} {...props} />
    </div>
  );
}

export type ThProps = ComponentPropsWithoutRef<"th"> & {
  /** Makes the heading a button that reports its direction (aria-sort) and shows the arrow. */
  sort?: "asc" | "desc" | false | undefined;
  onSort?: (() => void) | undefined;
  /** Pins the column to the leading edge of a table that scrolls sideways. */
  sticky?: boolean | undefined;
};

function Th({ className, sort, onSort, sticky, children, ...props }: ThProps) {
  const sortable = sort !== undefined || onSort !== undefined;
  return (
    <th
      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined}
      className={cn("sticky top-0 z-10 h-row-header whitespace-nowrap border-b border-default bg-surface-current px-150 font-body-small font-medium text-subtle", sticky && "start-0 z-20", className)}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn("group/sort inline-flex h-control-xsmall items-center gap-050 rounded-small px-050 outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused", sort && "text-default")}
        >
          {children}
          {sort === "asc" ? <ArrowUp className="size-150" /> : sort === "desc" ? <ArrowDown className="size-150" /> : <ChevronsUpDown className="invisible size-150 icon-subtlest group-hover/sort:visible" />}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function Td({ className, sticky, ...props }: ComponentPropsWithoutRef<"td"> & { sticky?: boolean | undefined }) {
  return <td className={cn("h-row max-w-0 truncate whitespace-nowrap px-150 align-middle", sticky && "sticky start-0 z-10 bg-surface-current group-hover/row:bg-surface-hovered", className)} {...props} />;
}

function Tr({ className, isSelected, ...props }: ComponentPropsWithoutRef<"tr"> & { isSelected?: boolean | undefined }) {
  return (
    <tr
      data-selected={isSelected ? "" : undefined}
      className={cn("group/row border-b border-default transition-colors duration-fast ease-standard last:border-b-0 hover:bg-surface-hovered", isSelected && "bg-selected hover:bg-selected-hovered", className)}
      {...props}
    />
  );
}

/** The id column. The row itself opens the record; the eye that appears on hover opens the same row in the preview rail. */
function IdCell({ id, onPreview, isActive, tone = "brand" }: { id: ReactNode; onPreview?: (() => void) | undefined; isActive?: boolean | undefined; tone?: "brand" | "subtle" | undefined }) {
  return (
    <Td className="max-w-none">
      <span className="flex items-center gap-075">
        <Id className={cn("transition-colors duration-fast ease-standard", isActive ? "text-brand" : null, tone === "brand" && !isActive ? "group-hover/row:text-brand" : null)}>{id}</Id>
        {onPreview ? (
          <Tooltip content="Preview">
            <button
              type="button"
              aria-label="Preview row"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className={cn(
                "ms-auto inline-flex size-250 shrink-0 items-center justify-center rounded-small outline-none transition-colors duration-fast ease-standard focus-visible:visible focus-visible:outline-focused",
                isActive ? "visible bg-selected icon-selected" : "invisible icon-subtle hover:bg-neutral-subtle-hovered hover:icon-default group-hover/row:visible",
              )}
            >
              <Eye className="size-icon-small" />
            </button>
          </Tooltip>
        ) : null}
      </span>
    </Td>
  );
}

/** The checkbox column. In the header it selects every row and reads mixed when only some are; in a row it selects that row. */
function SelectionCell({ header = false, checked, onCheckedChange, label, disabled }: { header?: boolean | undefined; checked: boolean | "indeterminate"; onCheckedChange: (checked: boolean) => void; label: string; disabled?: boolean | undefined }) {
  const box = <Checkbox checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)} aria-label={label} {...(disabled ? { disabled } : {})} onClick={(e) => e.stopPropagation()} />;
  return header ? (
    <Th className="w-400 pe-0">
      <span className="flex items-center">{box}</span>
    </Th>
  ) : (
    <Td className="w-400 max-w-none pe-0">
      <span className="flex items-center">{box}</span>
    </Td>
  );
}

/** A band of rows under one heading that opens and closes. Renders a tbody, so several groups stack inside one Table. */
function TableGroup({ colSpan, open, onToggle, title, count, trailing, children }: { colSpan: number; open: boolean; onToggle: () => void; title: ReactNode; count?: number | null | undefined; trailing?: ReactNode; children?: ReactNode }) {
  return (
    <tbody className="border-t border-default">
      <tr className="cursor-pointer bg-surface-sunken transition-colors duration-fast ease-standard hover:bg-surface-hovered" onClick={onToggle}>
        <td colSpan={colSpan} className="px-100 py-075">
          <span className="flex items-center gap-150">
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex shrink-0 items-center rounded-small outline-none focus-visible:outline-focused"
            >
              <ChevronDown className={cn("size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard", open ? "" : "-rotate-90")} />
            </button>
            <span className="flex min-w-0 flex-1 items-center gap-150 font-body font-medium text-default">{title}</span>
            {count ? <Count value={count} /> : null}
            {trailing ? <span className="flex shrink-0 items-center gap-150">{trailing}</span> : null}
          </span>
        </td>
      </tr>
      {open ? children : null}
    </tbody>
  );
}

export const Table = Object.assign(TableRoot, { Row: Tr, Cell: Td, Header: Th, Id: IdCell, Selection: SelectionCell, Group: TableGroup });
