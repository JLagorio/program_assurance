import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Heading } from "../primitives/heading";
import { VisuallyHidden } from "../primitives/visually-hidden";
import { toneClasses, type Tone } from "./badge";
import { Skeleton } from "./skeleton";

export type StatProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the number counts, in small subtle text: "Open findings". */
  label: string;
  /** The number, or a short string such as "80%" or "41/80". A number is written in the reader's locale (1,234 in en-US); a string shows as given. Zero reads muted. */
  value: ReactNode;
  /** A colour only when the number is a status: overdue in `danger`, verified in `success`. Most numbers stay `neutral`. */
  tone?: Tone | undefined;
  /** The number is on its way: a Skeleton holds its place, the part is `aria-busy`, and a screen reader hears "Loading" after the label. The label stays. */
  isLoading?: boolean | undefined;
};

export type StatTileProps = StatProps & {
  /** One line under the number: what it is out of, the oldest, the next. */
  note?: string | undefined;
  /** A link element (a router's Link, or `<a href>`) that fills the tile: the whole tile opens it, with a hover surface and an inset focus ring, and its name is the label, the number and the note. For a count that opens the register it counts. A linked tile holds no other control. */
  link?:
    | ReactElement<{
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Beside the number, `space.150` from it: a Chart.Sparkline of the same count over time. The number stays the value, so zero still reads muted. */
  trend?: ReactNode;
};

export type StatGridProps = ComponentProps<"div"> & {
  /** The most columns across, shown when the grid has room. The grid takes its columns from its own width, not the window's: each tile keeps at least 128px, so as the grid narrows six and five fold to three, every count folds to two (in a 320px panel and on a 320px phone), and it is one column below 257px. */
  cols?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** `card` frames the row with a border and rounded corners; `band` runs edge to edge between two rules. */
  frame?: "card" | "band" | undefined;
  /** Stat.Tile cells. */
  children: ReactNode;
};

const isZero = (value: ReactNode) => value === 0 || value === "0";

/** The figure: a Heading at `page` (20/26 semibold) as a div, since a number is not a title, with
    tabular numerals. Zero reads muted; a tone colours a number that is a status. */
function Figure({ value, tone, children }: { value: ReactNode; tone: Tone; children: ReactNode }) {
  return (
    <Heading
      size="page"
      as="div"
      className={cn(
        "tabular-nums",
        isZero(value)
          ? "text-subtlest"
          : tone === "neutral"
            ? "text-default"
            : toneClasses[tone].text,
      )}
    >
      {children}
    </Heading>
  );
}

/** The value slot's contents: the number in the reader's locale, or the placeholder while it loads. */
function useStatValue(value: ReactNode, isLoading: boolean | undefined) {
  const { formatNumber, t } = useLedgerLocale();
  // Inline in the number's line, so the line keeps the number's height and nothing moves when the
  // number arrives.
  if (isLoading)
    return (
      <>
        <Skeleton shape="heading" width={48} className="inline-block align-middle" />
        <VisuallyHidden>{t("loading")}</VisuallyHidden>
      </>
    );
  return typeof value === "number" && Number.isFinite(value) ? formatNumber(value) : value;
}

/** One cell of a Stat.Grid: label, big tabular number, one-line note. Zero reads muted. With `link`, the whole tile opens the register it counts. */
export function StatTile({
  label,
  value,
  note,
  tone = "neutral",
  isLoading,
  link,
  trend,
  className,
  ...props
}: StatTileProps) {
  const shown = useStatValue(value, isLoading);
  const number = (
    <Figure value={value} tone={tone}>
      {shown}
    </Figure>
  );
  const content = (
    <>
      <div
        className={cn(
          "font-body-small text-subtle",
          link && "group-hover/stat-link:underline group-focus-visible/stat-link:underline",
        )}
      >
        {label}
      </div>
      {trend ? (
        <div className="flex min-w-0 items-center gap-150">
          {number}
          <span data-slot="stat-trend" className="flex min-w-0 items-center">
            {trend}
          </span>
        </div>
      ) : (
        number
      )}
      {note ? <div className="font-body-small text-subtle">{note}</div> : null}
    </>
  );
  // The link fills the tile rather than wrapping it, so the tile stays the grid's child (sized by
  // stat.css) and the frame's overflow cannot clip the ring, which is drawn inside the edge.
  const linked = useRender({
    defaultTagName: "a",
    render: link,
    enabled: Boolean(link),
    props: {
      className:
        "group/stat-link flex flex-1 flex-col gap-025 px-200 py-150 outline-none transition-colors duration-fast ease-standard hover:bg-surface-hovered active:bg-surface-pressed focus-visible:outline-field-focused motion-reduce:transition-none",
      children: content,
      ...{ "data-slot": "stat-link" },
    },
  });
  return (
    <div
      {...props}
      aria-busy={isLoading ? true : props["aria-busy"]}
      data-slot="stat-tile"
      className={cn(
        "flex flex-col bg-surface-current animate-rise",
        !link && "gap-025 px-200 py-150",
        className,
      )}
    >
      {link ? linked : content}
    </div>
  );
}

/** Bare number over its label, for an unframed summary row. */
function StatRoot({ label, value, tone = "neutral", isLoading, className, ...props }: StatProps) {
  const shown = useStatValue(value, isLoading);
  return (
    <div
      {...props}
      aria-busy={isLoading ? true : props["aria-busy"]}
      data-slot="stat"
      className={cn("flex flex-col gap-050 py-100", className)}
    >
      <Figure value={value} tone={tone}>
        {shown}
      </Figure>
      <div className="font-body-small text-subtle">{label}</div>
    </div>
  );
}

// stat.css: the columns asked for when they fit, folding in balanced steps by the grid's own width.
const gridCols: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "stat-grid-2",
  3: "stat-grid-3",
  4: "stat-grid-4",
  5: "stat-grid-5",
  6: "stat-grid-6",
};

/** A row of Stat.Tile cells separated by hairlines. `card` frames it; `band` runs edge to edge between two rules. The gutter is painted with the border token, and with the text colour in forced colours. Its columns follow its own width, so it reads the same in a page, an aside or a panel. A parent that sizes it to its content (an items-start Stack, an Inline, a popover) makes it as wide as all its tiles side by side, up to the room it has: up to `cols` tiles that is one row, but more tiles than `cols` fold into `cols` wider tiles, so give that grid a width. */
export function StatGrid({
  cols = 4,
  frame = "card",
  children,
  className,
  ...props
}: StatGridProps) {
  return (
    <div
      {...props}
      data-slot="stat-grid"
      className={cn(
        "stat-grid stagger-children",
        frame === "card"
          ? "overflow-hidden rounded-large border border-default"
          : "border-y border-default",
        gridCols[cols],
        className,
      )}
    >
      {children}
    </div>
  );
}

export const Stat = Object.assign(StatRoot, { Tile: StatTile, Grid: StatGrid });
