import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
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
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";
import { Button, IconButton } from "./button";
import { LinkButton, LinkIconButton } from "./link-button";

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
/** True inside EmptyHeader, where EmptyMedia does not belong. */
const InHeader = createContext(false);

const warned = new Set<string>();
/** A composition mistake said once in the console, never thrown: the Empty still renders. */
function useWarnOnce(when: boolean, message: string) {
  useEffect(() => {
    if (!when || warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [when, message]);
}

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
        {...props}
        data-slot="empty"
        data-size={size}
        data-frame={size === "compact" ? "none" : frame}
        className={cn(
          "group/empty min-w-0",
          size === "compact"
            ? // Structural tracks let text shrink beside intrinsic-width media.
              "grid items-center gap-x-150 gap-y-025 has-data-[slot=empty-icon]:grid-cols-[auto_minmax(0,1fr)]"
            : "flex flex-col items-center justify-center gap-300 px-300 py-600 text-center",
          size !== "compact" &&
            frame === "dashed" &&
            "rounded-large border border-dashed border-default",
          className,
        )}
      />
    </EmptyContext.Provider>
  );
}

/** The measure of the centred message, `dimension.part.emptyMeasure`, so a description wraps at a
    readable width. */
const MESSAGE_MEASURE = token("dimension.part.emptyMeasure");

export type EmptyHeaderProps = ComponentProps<"div">;
/** The title and its description. EmptyMedia is its sibling, before it, never inside it. */
export function EmptyHeader({ className, style, ...props }: EmptyHeaderProps) {
  const { size } = useEmpty();
  return (
    <InHeader.Provider value>
      <div
        {...props}
        data-slot="empty-header"
        className={cn(
          "flex min-w-0 flex-col",
          size === "compact" ? "gap-025" : "w-full items-center gap-100",
          className,
        )}
        style={size === "compact" ? style : { maxWidth: MESSAGE_MEASURE, ...style }}
      />
    </InHeader.Provider>
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
/** The picture: an EmptyIllustration, an icon in the neutral circle (`variant="icon"`), an avatar, anything. It is Empty's child, before EmptyHeader: inside the header it would sit `space.100` above the title instead of the Empty's gap, or share the message's column in compact. */
export function EmptyMedia({ variant = "default", className, ...props }: EmptyMediaProps) {
  useWarnOnce(
    useContext(InHeader),
    "Ledger: an EmptyMedia inside EmptyHeader sits space.100 above the title, not at the Empty's gap, and takes the message's column in compact. Make it the Empty's child, before EmptyHeader.",
  );
  return (
    <div
      {...props}
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
    />
  );
}

export type EmptyTitleProps = useRender.ComponentProps<"h2">;
/** What is missing, in the reader's words. In the default size it is a heading at the contextual level (an h2 outside every HeadingLevelProvider, an h3 in a titled Section), so a page whose content is an Empty keeps it in the outline; in compact, a rail's row, it is body text in a div. `render` sets another element outright: `render={<h1 />}` where the Empty is the page's only content, `render={<div />}` for none. */
/* An unbroken code or hash breaks where it must, so it wraps inside the message's measure instead
   of widening the centred block past both edges of its frame. */
const WRAP = { overflowWrap: "anywhere" } as const;

export function EmptyTitle({ render, ref, className, style, ...props }: EmptyTitleProps) {
  const { size } = useEmpty();
  const level = useHeadingLevel();
  return useRender({
    defaultTagName: size === "compact" ? "div" : headingTag(level ?? 2),
    render,
    ref,
    state: { slot: "empty-title" },
    props: mergeProps<"h2">(props, {
      ...{ "data-slot": "empty-title" },
      style: { ...WRAP, ...style },
      className: cn(
        "max-w-full text-default",
        size === "compact" ? "font-body font-medium" : "font-heading-page font-medium text-balance",
        className,
      ),
    }),
  });
}

export type EmptyDescriptionProps = ComponentProps<"div">;
export function EmptyDescription({ className, style, ...props }: EmptyDescriptionProps) {
  const { size } = useEmpty();
  return (
    <div
      {...props}
      data-slot="empty-description"
      style={{ ...WRAP, ...style }}
      className={cn(
        "max-w-full text-subtle",
        size === "compact" ? "font-body-small" : "font-body text-pretty",
        className,
      )}
    />
  );
}

/* The hero's actions are medium. A collection hands its Empty the toolbar's create action as it
   is, a small primary Button or a split ButtonGroup of a small primary and its menu's IconButton,
   so a row that holds a small primary draws every small kit button in it at medium: the buttons
   themselves, a ButtonGroup's members and a trigger's `render` element. A row without one keeps
   its sizes: the suggestions' small secondary buttons, an icon Empty's one small action. */
type ControlProps = { size?: unknown; variant?: unknown; render?: unknown; children?: ReactNode };
const labelled = new Set<unknown>([Button, LinkButton]);
const square = new Set<unknown>([IconButton, LinkIconButton]);

/** A kit button at the small size: Button's and LinkButton's default is medium, IconButton's small. */
function isSmall(element: ReactElement<ControlProps>) {
  const { size } = element.props;
  if (labelled.has(element.type)) return size === "small";
  return square.has(element.type) && (size === undefined || size === "small");
}

/** Whether `test` holds for an element in `node`, through children and `render` elements. */
function holds(node: ReactNode, test: (element: ReactElement<ControlProps>) => boolean): boolean {
  if (Array.isArray(node)) return node.some((child) => holds(child, test));
  if (!isValidElement<ControlProps>(node)) return false;
  const { render, children } = node.props;
  return test(node) || (isValidElement(render) && holds(render, test)) || holds(children, test);
}

/** `node` with every small kit button in it at medium; the same node where nothing changes. */
function heroSized(node: ReactNode): ReactNode {
  if (Array.isArray(node)) {
    const next = node.map(heroSized);
    return next.some((child, index) => child !== node[index]) ? next : node;
  }
  if (!isValidElement<ControlProps>(node)) return node;
  const { render, children } = node.props;
  const changes: ControlProps = isSmall(node) ? { size: "medium" } : {};
  const renderSized = isValidElement(render) ? heroSized(render) : render;
  if (renderSized !== render) changes.render = renderSized;
  const childrenSized = heroSized(children);
  if (childrenSized === children)
    return Object.keys(changes).length ? cloneElement(node, changes) : node;
  // As arguments, so siblings written side by side need no keys; a list keeps its own.
  return Array.isArray(childrenSized)
    ? cloneElement(node, changes, ...childrenSized)
    : cloneElement(node, changes, childrenSized);
}

export type EmptyContentProps = ComponentProps<"div">;
/**
 * The actions, or anything after the message: a row that wraps, centred under the message by
 * default. Use it twice for a second row, such as suggested searches. In the default size a row
 * that holds a small primary kit button (a toolbar's create action, a split ButtonGroup) draws
 * every small kit button in it at medium, the hero's size; a row without one keeps its sizes.
 */
export function EmptyContent({ className, children, ...props }: EmptyContentProps) {
  const { size } = useEmpty();
  const hero =
    size !== "compact" &&
    holds(children, (element) => isSmall(element) && element.props.variant === "primary");
  return (
    <div
      {...props}
      data-slot="empty-content"
      className={cn(
        "flex min-w-0 flex-wrap items-center",
        size === "compact"
          ? "gap-150 pt-075 group-has-data-[slot=empty-icon]/empty:col-start-2"
          : "justify-center gap-100",
        className,
      )}
    >
      {hero ? Children.map(children, heroSized) : children}
    </div>
  );
}

/*
 * The kit's pictures, drawn from the surface tokens so they follow the mode. Each is a scene of
 * ghost records, the shape of what the region will hold, sometimes with a badge that says why it
 * is empty. Every scene is drawn in its own box of 64 by 42 units, a viewBox: the picture is a
 * container as wide as `dimension.part.emptyIllustration` (128px, so a unit is 2px and the scene
 * 84px tall, and every empty state sits at one height), and every length inside it is a number of
 * units, so the scene scales with that one width and no step of the spacing scale resizes it.
 * Colours, borders, corners and shadows stay the tokens'. Its front surface carries
 * `data-part="front"` and paints over everything behind it.
 */

/** The scene's box, in units: 64 across and 42 down. */
const BOX = { width: 64, height: 42 } as const;
/** A length of `n` units, each a 64th of the picture's width (the picture is the container). */
const unit = (n: number) => `calc(${n} * 100cqw / ${BOX.width})`;
/** A square `n` units on a side. */
const squareOf = (n: number): CSSProperties => ({ width: unit(n), height: unit(n) });
/** A move of `x` units across and `y` down. */
const shift = (x: number, y = 0): CSSProperties => ({ translate: `${unit(x)} ${unit(y)}` });

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

/** The picture: the token's width, its height from the box. */
const PICTURE: CSSProperties = {
  width: token("dimension.part.emptyIllustration"),
  aspectRatio: `${BOX.width} / ${BOX.height}`,
};
const SCENE: CSSProperties = { width: unit(BOX.width), height: unit(BOX.height) };
const STACK: CSSProperties = { width: unit(64), gridTemplateRows: `${unit(5)} ${unit(5)} auto` };
const STACK_BACK: CSSProperties = { width: "76%" };
const STACK_MIDDLE: CSSProperties = { width: "88%" };
const RECORD: CSSProperties = { gap: unit(4), padding: unit(6) };
const THUMB: CSSProperties = squareOf(14);
const LINES: CSSProperties = { gap: unit(3) };
const LINE_HEIGHT: CSSProperties = { height: unit(3) };
const LINE: CSSProperties = { ...LINE_HEIGHT, width: "72%" };
const LINE_SHORT: CSSProperties = { ...LINE_HEIGHT, width: "48%" };
const PAGE: CSSProperties = { width: unit(34), height: unit(42), gap: unit(4), padding: unit(6) };
const PAGE_BACK: CSSProperties = { width: unit(34), height: unit(42), ...shift(-4, -3) };
const PAGE_HEADING: CSSProperties = { height: unit(4) };
const CARD: CSSProperties = { width: unit(58), height: unit(42) };
const CHECKLIST: CSSProperties = { ...CARD, gap: unit(4), paddingInline: unit(6) };
const CHECK_ROW: CSSProperties = { gap: unit(4) };
const CHECKBOX: CSSProperties = squareOf(6);
const PERSON: CSSProperties = squareOf(24);
const PERSON_ICON: CSSProperties = squareOf(8);
const NODE: CSSProperties = { width: unit(18), height: unit(11) };
const BRANCH: CSSProperties = { width: unit(32) };
const STEM: CSSProperties = { height: unit(4) };
const BARS = [36, 58, 44, 76];
const PLOT: CSSProperties = {
  ...CARD,
  gap: unit(6),
  paddingInline: unit(8),
  paddingBlockStart: unit(8),
  paddingBlockEnd: unit(6),
};
const MONTH_HEADER: CSSProperties = { height: unit(8), gap: unit(2), paddingInline: unit(4) };
const MONTH_DAYS: CSSProperties = { paddingInline: unit(4), paddingBlock: unit(2) };
const DOT: CSSProperties = squareOf(3);
const BADGE: CSSProperties = squareOf(16);
const BADGE_ICON: CSSProperties = squareOf(7);
/** A badge at the front record's trailing corner, half out of it. */
const BADGE_CORNER: CSSProperties = { ...BADGE, ...shift(4, 4) };
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
        "flex items-center justify-center rounded-full shadow-raised",
        badge.className,
        className,
      )}
      style={BADGE_CORNER}
    >
      <badge.Icon style={BADGE_ICON} />
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
        data-part="front"
        className={cn("col-start-1 row-start-3 flex w-full items-center shadow-raised", SURFACE)}
        style={RECORD}
      >
        <div className="shrink-0 rounded-small bg-neutral" style={THUMB} />
        <div className="flex grow flex-col" style={LINES}>
          <div className={GHOST} style={LINE} />
          <div className="rounded-full bg-skeleton-subtle" style={LINE_SHORT} />
        </div>
      </div>
      {badge ? (
        <BadgeMark badge={badge} className="col-start-1 row-start-3 self-end justify-self-end" />
      ) : null}
    </div>
  );
}

/** A page of lines, another behind it. The back page is translated, which makes it a positioned
    layer; the front page is `relative`, a positioned layer after it, so it paints on top. */
function Document({ badge }: { badge?: Badge | undefined }) {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div
        className="col-start-1 row-start-1 rounded-medium border border-default bg-surface-sunken"
        style={PAGE_BACK}
      />
      <div
        data-part="front"
        className={cn("relative col-start-1 row-start-1 flex flex-col shadow-raised", SURFACE)}
        style={PAGE}
      >
        <div className="w-1/2 rounded-small bg-neutral" style={PAGE_HEADING} />
        <div className={cn("w-full", GHOST)} style={LINE_HEIGHT} />
        <div className={cn("w-full", GHOST)} style={LINE_HEIGHT} />
        <div className="w-2/3 rounded-full bg-skeleton-subtle" style={LINE_HEIGHT} />
      </div>
      {badge ? (
        <BadgeMark badge={badge} className="col-start-1 row-start-1 self-end justify-self-end" />
      ) : null}
    </div>
  );
}

/** A card of rows, each with a box to tick. */
function Checklist() {
  return (
    <div className="grid items-center justify-items-center" style={SCENE}>
      <div
        data-part="front"
        className={cn("flex flex-col justify-center shadow-raised", SURFACE)}
        style={CHECKLIST}
      >
        {[LINE, LINE_SHORT, LINE].map((line, i) => (
          <div key={i} className="flex items-center" style={CHECK_ROW}>
            <div
              className="shrink-0 rounded-xsmall border border-bold bg-surface"
              style={CHECKBOX}
            />
            <div className={GHOST} style={line} />
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
      <div
        className="col-start-1 row-start-1 flex items-center justify-center rounded-full bg-neutral icon-subtle"
        style={{ ...PERSON, ...shift(-8) }}
      >
        <User style={PERSON_ICON} />
      </div>
      <div
        data-part="front"
        className="col-start-1 row-start-1 flex items-center justify-center rounded-full border border-default bg-surface-raised icon-subtle shadow-raised"
        style={{ ...PERSON, ...shift(8) }}
      >
        <User style={PERSON_ICON} />
      </div>
    </div>
  );
}

/** A parent with two parts under it. */
function Tree() {
  return (
    <div className="flex flex-col items-center justify-center" style={SCENE}>
      <div data-part="front" className={cn("shadow-raised", SURFACE)} style={NODE} />
      <div className="border-s border-bold" style={STEM} />
      <div
        className="border-t border-x border-bold rounded-t-small"
        style={{ ...BRANCH, ...STEM }}
      />
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
      <div data-part="front" className={cn("flex items-end shadow-raised", SURFACE)} style={PLOT}>
        {BARS.map((height, i) => (
          <div
            key={i}
            className={cn(
              "grow rounded-t-small",
              i === BARS.length - 1 ? "bg-neutral" : "bg-skeleton",
            )}
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
      <div
        data-part="front"
        className={cn("flex flex-col overflow-hidden shadow-raised", SURFACE)}
        style={CARD}
      >
        <div className="flex shrink-0 items-center bg-neutral" style={MONTH_HEADER}>
          <div className="rounded-full bg-neutral-bold" style={DOT} />
          <div className="rounded-full bg-neutral-bold" style={DOT} />
        </div>
        <div className="grid grow grid-cols-7 place-items-center" style={MONTH_DAYS}>
          {Array.from({ length: 21 }, (_, i) => (
            <div
              key={i}
              className={cn("rounded-full", i % 5 === 3 ? "bg-skeleton" : "bg-skeleton-subtle")}
              style={DOT}
            />
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

/** A picture for the empty state, on the surface tokens. Decorative: always hidden from assistive technology. It belongs to the default size; a compact Empty, a rail's row, takes an icon (`EmptyMedia variant="icon"`). */
export function EmptyIllustration({
  kind = "records",
  className,
  style,
  ...props
}: EmptyIllustrationProps) {
  useWarnOnce(
    useEmpty().size === "compact",
    `Ledger: an EmptyIllustration (kind "${kind}") in a compact Empty is a 128×84 scene in a row drawn for an icon. Use EmptyMedia variant="icon" with a Lucide icon there.`,
  );
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
      {...props}
      data-slot="empty-illustration"
      data-kind={kind}
      aria-hidden
      className={cn("@container flex shrink-0 items-end justify-center select-none", className)}
      style={{ ...PICTURE, ...style }}
    >
      {scene}
    </div>
  );
}
