import {
  IconButton,
  buttonVariants,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  type DataTableInstance,
} from "@ledger/design-system";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cloneElement, useEffect, type ReactElement, type AnchorHTMLAttributes } from "react";

export type PreviewRow = { id: string; scopeId?: string | undefined };

/** Publish the same filtered, sorted, expanded rows that the table renders. */
export function usePreviewSequence<T extends PreviewRow>(
  table: DataTableInstance<T>,
  onChange?: (rows: PreviewRow[]) => void,
) {
  const sequence = JSON.stringify(
    table
      .getRowModel()
      .rows.filter((row) => !row.getIsGrouped())
      .map(({ original }) => ({
        id: original.id,
        ...(original.scopeId ? { scopeId: original.scopeId } : {}),
      })),
  );
  useEffect(() => {
    onChange?.(JSON.parse(sequence) as PreviewRow[]);
  }, [sequence, onChange]);
}

/** The route supplies native destinations; row navigation never changes collection filters. */
export function PreviewNavigation({
  rows,
  currentId,
  onNavigate,
  openTo,
}: {
  rows: PreviewRow[];
  currentId: string;
  onNavigate: (row: PreviewRow) => void;
  openTo: ReactElement<AnchorHTMLAttributes<HTMLAnchorElement>>;
}) {
  const index = rows.findIndex((row) => row.id === currentId);
  return (
    <div className="flex shrink-0 items-center gap-050">
      <span className="sr-only" role="status">
        {index < 0
          ? "Record outside the current results"
          : `${index + 1} of ${rows.length} records`}
      </span>
      <IconButton
        label="Previous record"
        variant="subtle"
        icon={<ChevronLeft />}
        disabled={index <= 0}
        onClick={() => {
          if (rows[index - 1]) onNavigate(rows[index - 1]!);
        }}
      />
      <IconButton
        label="Next record"
        variant="subtle"
        icon={<ChevronRight />}
        disabled={index < 0 || index >= rows.length - 1}
        onClick={() => {
          if (rows[index + 1]) onNavigate(rows[index + 1]!);
        }}
      />
      <Tooltip>
        <TooltipTrigger
          render={cloneElement(openTo, {
            "aria-label": "Open full record in new tab",
            className: buttonVariants({
              variant: "subtle",
              size: "small",
              className: "size-control-small shrink-0 p-0",
            }),
            children: <ExternalLink aria-hidden className="size-icon-small" />,
          })}
        />
        <TooltipContent>Open full record in new tab</TooltipContent>
      </Tooltip>
    </div>
  );
}
