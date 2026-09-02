import { Eye } from "lucide-react";
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

export const Table = Object.assign(TableRoot, { Row: Tr, Cell: Td, Header: Th, Id: IdCell });
