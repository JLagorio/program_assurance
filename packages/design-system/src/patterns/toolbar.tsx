import { InputGroupAddon, InputGroupInput, InputGroup } from "../components/input-group";
import { Button } from "../components/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../components/popover";
import { useLedgerLocale } from "../lib/locale";
import { MoreHorizontal, Search } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

export type ToolbarProps = {
  search?: string | undefined;
  onSearch?: ((value: string) => void) | undefined;
  placeholder?: string | undefined;
  /** Permanent view controls, such as saved views, grouping, columns and settings. */
  children?: ReactNode;
  /** Filters alone move into More when the available width cannot fit the row. */
  filters?: ReactNode;
  /** Permanent actions at the end of the row. */
  actions?: ReactNode;
  className?: string | undefined;
};

/** A single row. Measure its container, including when a shell panel opens beside it. */
export function Toolbar({
  search,
  onSearch,
  placeholder,
  children,
  filters,
  actions,
  className,
}: ToolbarProps) {
  const { t } = useLedgerLocale();
  const root = useRef<HTMLDivElement>(null);
  const filterRow = useRef<HTMLDivElement>(null);
  const permanent = useRef<HTMLDivElement>(null);
  const filtersWidth = useRef(0);
  const [constrained, setConstrained] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [open, setOpen] = useState(false);
  // Keep the popup mounted if its parent grows while the user is working inside it.
  const compact = constrained || open;
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const intrinsicWidth = (row: HTMLElement | null) => {
      if (!row) return 0;
      const items = Array.from(row.children).filter((child) => child.getClientRects().length);
      const gap = parseFloat(getComputedStyle(row).columnGap) || 8;
      return (
        items.reduce((width, child) => width + child.getBoundingClientRect().width, 0) +
        gap * Math.max(0, items.length - 1)
      );
    };
    const measure = () => {
      const gap = parseFloat(getComputedStyle(element).columnGap) || 8;
      if (filterRow.current) filtersWidth.current = intrinsicWidth(filterRow.current);
      const fixedWidth = intrinsicWidth(permanent.current);
      const searchWidth = onSearch ? 160 + gap : 0;
      const remaining = element.clientWidth - fixedWidth - (fixedWidth ? gap : 0);
      setConstrained(!!filters && remaining < filtersWidth.current + searchWidth);
      // At phone widths, give search its own line rather than hiding permanent controls.
      setStacked(!!onSearch && remaining < searchWidth + (filters ? 80 : 0));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (filterRow.current) observer.observe(filterRow.current);
    if (permanent.current) observer.observe(permanent.current);
    return () => observer.disconnect();
  }, [compact, onSearch, filters, children, actions]);
  return (
    <div
      ref={root}
      data-slot="toolbar"
      className={cn("flex min-w-0 items-center gap-100", stacked && "flex-wrap", className)}
    >
      {onSearch ? (
        <InputGroup
          className="min-w-0 flex-1"
          style={{ maxWidth: stacked ? undefined : 240, flexBasis: stacked ? "100%" : undefined }}
        >
          <InputGroupInput
            type="search"
            size="small"
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder ?? t("search")}
            aria-label={placeholder ?? t("search")}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      ) : null}
      {filters ? (
        compact ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button
                  size="small"
                  iconBefore={<MoreHorizontal />}
                  aria-label="More filters"
                  className="shrink-0"
                />
              }
            >
              More
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="overflow-y-auto"
              style={{ maxHeight: "var(--available-height)" }}
            >
              <PopoverTitle>Filters</PopoverTitle>
              <div className="flex flex-col items-stretch gap-100">{filters}</div>
            </PopoverContent>
          </Popover>
        ) : (
          <div
            ref={filterRow}
            className="flex items-center gap-100"
            style={{ minWidth: "max-content" }}
          >
            {filters}
          </div>
        )
      ) : null}
      {children || actions ? (
        <div
          ref={permanent}
          className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-100"
        >
          {children}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
