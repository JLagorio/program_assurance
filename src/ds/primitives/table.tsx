import { ChevronDown, Eye } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Id } from "./id";

function TableRoot({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[13px]", className)} {...props} />
    </div>
  );
}

function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 h-8 whitespace-nowrap border-b border-border bg-background px-3 text-12 font-medium text-muted-foreground first:pl-3 last:pr-3",
        className,
      )}
      {...props}
    />
  );
}

function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "h-10 max-w-0 truncate whitespace-nowrap px-3 align-middle first:pl-3 last:pr-3",
        className,
      )}
      {...props}
    />
  );
}

function Tr({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "group/row border-b border-border-subtle transition-colors duration-100 last:border-0 hover:bg-surface-hover",
        className,
      )}
      {...props}
    />
  );
}

/* One pattern everywhere: the row itself opens the record page; the eye button
   that appears on hover opens the same row in the preview rail. */

function IdCell({
  id,
  onPreview,
  active,
  tone = "primary",
}: {
  id: ReactNode;
  onPreview?: () => void;
  active?: boolean;
  tone?: "primary" | "muted";
}) {
  return (
    <Table.Cell className="max-w-none">
      <span className="flex items-center gap-1.5">
        <Id
          className={cn(
            "transition-colors duration-100",
            active ? "text-primary" : null,
            tone === "primary" && !active ? "group-hover/row:text-primary" : null,
          )}
        >
          {id}
        </Id>
        {onPreview ? (
          <button
            type="button"
            aria-label="Preview row"
            title="Preview"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className={cn(
              "ml-auto inline-flex size-5 shrink-0 items-center justify-center rounded transition-colors focus-visible:opacity-100 focus-visible:outline-none",
              active
                ? "bg-primary-soft text-primary opacity-100"
                : "text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover/row:opacity-100",
            )}
          >
            <Eye className="size-3.5" />
          </button>
        ) : null}
      </span>
    </Table.Cell>
  );
}

/* A band of rows under one heading that opens and closes: a control family,
   a component, a phase. The heading row spans every column; `title` is the
   caller's composition (an Id, a name) and `trailing` its counts and bars.
   Renders a <tbody>, so several groups stack inside one Table. */
function TableGroup({
  colSpan,
  open,
  onToggle,
  title,
  count,
  trailing,
  children,
}: {
  colSpan: number;
  open: boolean;
  onToggle: () => void;
  title: ReactNode;
  count?: number | string | null;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <tbody className="border-t border-border">
      <tr
        className="cursor-pointer bg-subtle/60 transition-colors duration-100 hover:bg-surface-hover"
        onClick={onToggle}
      >
        <td colSpan={colSpan} className="px-2 py-1.5">
          <span className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex shrink-0 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform",
                  open ? "" : "-rotate-90",
                )}
              />
            </button>
            <span className="flex min-w-0 flex-1 items-center gap-3 text-[12.5px] font-medium">
              {title}
            </span>
            {count !== undefined && count !== null && count !== 0 ? (
              <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                {count}
              </span>
            ) : null}
            {trailing ? <span className="flex shrink-0 items-center gap-3">{trailing}</span> : null}
          </span>
        </td>
      </tr>
      {open ? children : null}
    </tbody>
  );
}
export const Table = Object.assign(TableRoot, {
  Row: Tr,
  Cell: Td,
  Header: Th,
  Id: IdCell,
  Group: TableGroup,
});
