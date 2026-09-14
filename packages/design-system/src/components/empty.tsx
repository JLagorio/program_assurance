import { cva, type VariantProps } from "class-variance-authority";
import {
  Check,
  Inbox,
  Lock,
  Paperclip,
  Search,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { createContext, useContext, type ComponentProps, type CSSProperties } from "react";

import { cn } from "../lib/cn";

/*
 * An empty region says why there is nothing and what to do next. The default is the centred
 * hero: a picture, a heading, a line of copy, the actions under it, on a dashed frame or on the
 * surface it sits in (a table, a page). Compact is the rail's row: media beside the message,
 * left-aligned, no frame. The parts read the size from context, so a title is a heading in one
 * and body text in the other without relying on cascade order.
 */

export type EmptySize = "default" | "compact";
export type EmptyFrame = "dashed" | "none";

const EmptyContext = createContext<{ size: EmptySize }>({ size: "default" });
const useEmpty = () => useContext(EmptyContext);

export type EmptyProps = ComponentProps<"div"> & {
  /** `default` centres the message under its media; `compact` puts media beside it, for a rail or a card. */
  size?: EmptySize | undefined;
  /** The dashed border is the default region. `none` for a surface that already bounds it: a table, a page. Compact never has a frame. */
  frame?: EmptyFrame | undefined;
};

/** An empty region. Compose its message and actions with the exported parts. */
export function Empty({ size = "default", frame = "dashed", className, ...props }: EmptyProps) {
  return (
    <EmptyContext.Provider value={{ size }}>
      <div
        data-slot="empty"
        data-size={size}
        data-frame={size === "compact" ? "none" : frame}
        className={cn(
          "group/empty min-w-0",
          size === "compact"
            ? // Structural tracks let text shrink beside intrinsic-width media.
              // eslint-disable-next-line ledger/no-arbitrary-value
              "grid items-center gap-x-150 gap-y-025 has-data-[slot=empty-icon]:grid-cols-[auto_minmax(0,1fr)]"
            : "flex flex-col items-center justify-center gap-300 px-300 py-600 text-center",
          size !== "compact" &&
            frame === "dashed" &&
            "rounded-large border border-dashed border-default",
          className,
        )}
        {...props}
      />
    </EmptyContext.Provider>
  );
}

/** The measure of the centred message, so a description wraps at a readable width. */
const MESSAGE_MEASURE = 400;

export type EmptyHeaderProps = ComponentProps<"div">;
export function EmptyHeader({ className, style, ...props }: EmptyHeaderProps) {
  const { size } = useEmpty();
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex min-w-0 flex-col",
        size === "compact" ? "gap-025" : "w-full items-center gap-100",
        className,
      )}
      style={size === "compact" ? style : { maxWidth: MESSAGE_MEASURE, ...style }}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center group-data-[size=compact]/empty:row-span-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        icon: "size-500 rounded-full bg-neutral icon-subtle [&_svg:not([class*='size-'])]:size-icon-medium group-data-[size=compact]/empty:size-400 group-data-[size=compact]/empty:[&_svg:not([class*='size-'])]:size-icon-small",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type EmptyMediaProps = ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>;
/** The picture: an EmptyIllustration, an icon in the neutral circle (`variant="icon"`), an avatar, anything. */
export function EmptyMedia({ variant = "default", className, ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

export type EmptyTitleProps = ComponentProps<"div">;
export function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  const { size } = useEmpty();
  return (
    <div
      data-slot="empty-title"
      className={cn(
        "text-default",
        size === "compact" ? "font-body font-medium" : "font-heading-small text-balance",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyDescriptionProps = ComponentProps<"div">;
export function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  const { size } = useEmpty();
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-subtle",
        size === "compact" ? "font-body-small" : "font-body text-pretty",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyContentProps = ComponentProps<"div">;
/** The actions, or anything after the message: a row that wraps, centred under the message by default. Use it twice for a second row, such as suggested searches. */
export function EmptyContent({ className, ...props }: EmptyContentProps) {
  const { size } = useEmpty();
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex min-w-0 flex-wrap items-center",
        size === "compact"
          ? "gap-150 pt-075 group-has-data-[slot=empty-icon]/empty:col-start-2"
          : "justify-center gap-100",
        className,
      )}
      {...props}
    />
  );
}

/*
 * The kit's pictures, drawn from the surface tokens so they follow the mode. Each is a scene of
 * ghost records, the shape of what the region will hold, sometimes with a badge that says why it
 * is empty. A scene is 128px wide and 84px tall so every empty state sits at one height.
 */

export type EmptyIllustrationKind =
  | "records"
  | "search"
  | "done"
  | "inbox"
  | "locked"
  | "shield"
  | "document"
  | "tasks"
  | "people"
  | "tree"
  | "chart"
  | "calendar";

const SCENE: CSSProperties = { width: 128, height: 84 };
const STACK: CSSProperties = { width: 128, gridTemplateRows: "10px 10px auto" };
const STACK_BACK: CSSProperties = { width: "76%" };
const STACK_MIDDLE: CSSProperties = { width: "88%" };
const THUMB: CSSProperties = { width: 28, height: 28 };
const LINE: CSSProperties = { width: "72%" };
const LINE_SHORT: CSSProperties = { width: "48%" };
const PAGE: CSSProperties = { width: 68, height: 84 };
const PAGE_BACK: CSSProperties = { width: 68, height: 84 };
const CARD: CSSProperties = { width: 116, height: 84 };
const NODE: CSSProperties = { width: 36, height: 22 };
const BRANCH: CSSProperties = { width: 64 };
const BARS = [36, 58, 44, 76];
const SURFACE = "rounded-medium border border-default bg-surface-raised";
const GHOST = "rounded-full bg-skeleton";

type Badge = { className: string; Icon: LucideIcon };
const badges: Partial<Record<EmptyIllustrationKind, Badge>> = {
  search: { className: "bg-neutral-bold icon-inverse", Icon: Search },
  done: { className: "bg-success-bold icon-inverse", Icon: Check },
  inbox: { className: "bg-neutral-bold icon-inverse", Icon: Inbox },
  locked: { className: "bg-neutral-bold icon-inverse", Icon: Lock },
  shield: { className: "bg-brand-bold icon-inverse", Icon: ShieldCheck },
  document: { className: "bg-neutral-bold icon-inverse", Icon: Paperclip },
};

/** The badge at a scene's trailing corner, saying why the region is empty. */
function BadgeMark({ badge, className }: { badge: Badge; className?: string | undefined }) {
  return (
    <div
      className={cn(
        "flex size-400 items-center justify-center rounded-full shadow-raised [&_svg]:size-icon-small",
        badge.className,
        className,
      )}
    >
      <badge.Icon />
    </div>
  );
}

/** Three records in a stack, the front one with a line of content. */
function Stack({ badge }: { badge?: Badge | undefined }) {
  return (
    <div className="grid justify-items-center" style={STACK}>
      <div
        className="col-start-1 row-start-1 row-end-4 rounded-medium border border-default bg-surface-sunken"
        style={STACK_BACK}
      />
      <div className={cn("col-start-1 row-start-2 row-end-4", SURFACE)} style={STACK_MIDDLE} />
      <div
        className={cn(
          "col-start-1 row-start-3 flex w-full items-center gap-100 px-150 py-150 shadow-raised",
          SURFACE,
        )}
      >
        <div className="shrink-0 rounded-small bg-neutral" style={THUMB} />
        <div className="flex grow flex-col gap-075">
          <div className={cn("h-075", GHOST)} style={LINE} />
          <div className="h-075 rounded-full bg-skeleton-subtle" style={LINE_SHORT} />
        </div>
      </div>
      {badge ? (
        <BadgeMark
          badge={badge}
          className="col-start-1 row-start-3 translate-x-100 translate-y-100 self-end justify-self-end"
        />
      ) : null}
    </div>
  );
}

/** A page of lines, another behind it. */
function Document({ badge }: { badge?: Badge | undefined }) {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div
        className="col-start-1 row-start-1 -translate-x-100 -translate-y-075 rounded-medium border border-default bg-surface-sunken"
        style={PAGE_BACK}
      />
      <div
        className={cn("col-start-1 row-start-1 flex flex-col gap-100 px-150 py-150 shadow-raised", SURFACE)}
        style={PAGE}
      >
        <div className="h-100 w-1/2 rounded-small bg-neutral" />
        <div className={cn("h-075 w-full", GHOST)} />
        <div className={cn("h-075 w-full", GHOST)} />
        <div className="h-075 w-2/3 rounded-full bg-skeleton-subtle" />
      </div>
      {badge ? (
        <BadgeMark
          badge={badge}
          className="col-start-1 row-start-1 translate-x-100 translate-y-100 self-end justify-self-end"
        />
      ) : null}
    </div>
  );
}

/** A card of rows, each with a box to tick. */
function Checklist() {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div className={cn("flex flex-col justify-center gap-100 px-150 shadow-raised", SURFACE)} style={CARD}>
        {[LINE, LINE_SHORT, LINE].map((width, i) => (
          <div key={i} className="flex items-center gap-100">
            <div className="size-150 shrink-0 rounded-xsmall border border-bold bg-surface" />
            <div className={cn("h-075", GHOST)} style={width} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Two people, one behind the other. */
function People() {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div className="col-start-1 row-start-1 flex size-600 -translate-x-200 items-center justify-center rounded-full bg-neutral icon-subtle [&_svg]:size-icon-medium">
        <User />
      </div>
      <div className="col-start-1 row-start-1 flex size-600 translate-x-200 items-center justify-center rounded-full border border-default bg-surface-raised icon-subtle shadow-raised [&_svg]:size-icon-medium">
        <User />
      </div>
    </div>
  );
}

/** A parent with two parts under it. */
function Tree() {
  return (
    <div className="flex flex-col items-center justify-center" style={SCENE}>
      <div className={cn("shadow-raised", SURFACE)} style={NODE} />
      <div className="h-100 border-l border-bold" />
      <div className="h-100 border-t border-l border-r border-bold rounded-t-small" style={BRANCH} />
      <div className="flex justify-between" style={BRANCH}>
        <div className={cn("-translate-x-1/2", SURFACE)} style={NODE} />
        <div className={cn("translate-x-1/2", SURFACE)} style={NODE} />
      </div>
    </div>
  );
}

/** Bars on a baseline, none of them measured. */
function Chart() {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div className={cn("flex items-end gap-150 px-200 pt-200 pb-150 shadow-raised", SURFACE)} style={CARD}>
        {BARS.map((height, i) => (
          <div
            key={i}
            className={cn("grow rounded-t-small", i === BARS.length - 1 ? "bg-neutral" : "bg-skeleton")}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** A month with nothing in it. */
function Calendar() {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div className={cn("flex flex-col overflow-hidden shadow-raised", SURFACE)} style={CARD}>
        <div className="flex h-200 shrink-0 items-center gap-050 bg-neutral px-100">
          <div className="size-075 rounded-full bg-neutral-bold" />
          <div className="size-075 rounded-full bg-neutral-bold" />
        </div>
        <div className="grid grow grid-cols-7 place-items-center px-100 py-050">
          {Array.from({ length: 21 }, (_, i) => (
            <div key={i} className={cn("size-075 rounded-full", i % 5 === 3 ? "bg-skeleton" : "bg-skeleton-subtle")} />
          ))}
        </div>
      </div>
    </div>
  );
}

export type EmptyIllustrationProps = Omit<ComponentProps<"div">, "children"> & {
  /** Which scene. `records` by default. */
  kind?: EmptyIllustrationKind | undefined;
};

/** A picture for the empty state, on the surface tokens. Decorative: always hidden from assistive technology. */
export function EmptyIllustration({
  kind = "records",
  className,
  style,
  ...props
}: EmptyIllustrationProps) {
  const badge = badges[kind];
  const scene =
    kind === "document" ? (
      <Document badge={badge} />
    ) : kind === "tasks" ? (
      <Checklist />
    ) : kind === "people" ? (
      <People />
    ) : kind === "tree" ? (
      <Tree />
    ) : kind === "chart" ? (
      <Chart />
    ) : kind === "calendar" ? (
      <Calendar />
    ) : (
      <Stack badge={badge} />
    );
  return (
    <div
      data-slot="empty-illustration"
      data-kind={kind}
      aria-hidden
      className={cn("flex shrink-0 items-end justify-center select-none", className)}
      style={{ ...SCENE, ...style }}
      {...props}
    >
      {scene}
    </div>
  );
}
