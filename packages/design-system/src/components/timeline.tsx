import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { parseInstant, parseIsoDay } from "../lib/locale-format";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";
import { ScrollerArrow, Scroller } from "./scroller";
import { StripViewport } from "./stepper";
import { Dot, toneClasses, type Tone } from "./badge";
import { RelativeTime } from "./date-time";
import { Truncate } from "./truncate";
import { Eyebrow } from "./typography";

/* Events in order along one rail: activity, history, an audit trail, a run
   of releases. The anatomy follows Item, so a row that opens
   is its title stretched over the row, with the marker on the rail. Down the page the list is one
   grid the rows share (time · marker · body), and every row draws its own piece of the rail in the
   marker column, so the rail runs through the markers' centre whatever the size and wherever the
   time sits. Across, events share the Stepper's geometry. */

export type TimelineOrientation = "vertical" | "horizontal";

export type TimelineSize = "small" | "medium" | "large";

export type TimelineTimePosition = "end" | "start" | "above" | "below";

export type TimelineAlign = "center" | "start";

export type TimelineItemWidth = "equal" | "rail";

const columns = "auto auto minmax(0, 1fr)";

const sizes = {
  small: {
    col: "w-200",
    box: "h-250",
    line: "min-h-250",
    pad: "py-050",
    top: "h-050",
    disc: "size-200",
    icon: "size-150",
  },
  medium: {
    col: "w-250",
    box: "h-250",
    line: "min-h-250",
    pad: "py-075",
    top: "h-075",
    disc: "size-250",
    icon: "size-150",
  },
  large: {
    col: "w-300",
    box: "h-300",
    line: "min-h-300",
    pad: "py-100",
    top: "h-100",
    disc: "size-300",
    icon: "size-200",
  },
} as const;

type Ctx = {
  orientation: TimelineOrientation;
  size: TimelineSize;
  timePosition: TimelineTimePosition;
  align: TimelineAlign;
  wrap: boolean;
};

const TimelineContext = createContext<Ctx>({
  orientation: "vertical",
  size: "medium",
  timePosition: "end",
  align: "center",
  wrap: false,
});

/** Where a group sits in the list, so its first and last rows know which rail ends to hide. */
const GroupContext = createContext<{ first: boolean; last: boolean } | null>(null);

export type TimelineProps = Omit<ComponentProps<"ol">, "children" | "className"> & {
  /** The list's accessible name, required so the events are never an unnamed list: "Activity", "History", "Releases". An `aria-label` overrides it. */
  label: string;
  /** `vertical`, the default, reads down with the rail on the left: a feed, a history. `horizontal` reads across with the rail on top: releases, a journey. Groups are vertical only. */
  orientation?: TimelineOrientation | undefined;
  /** The marker's scale, and with it the row. `medium` (20px) is the default: a ring holding a Dot, a disc with an icon, an `xsmall` Avatar. `small` (16px) is a bare Dot for a dense log. `large` (24px) is a `small` Avatar or a disc for a feed of people and a workflow's stages. */
  size?: TimelineSize | undefined;
  /** Where the time sits. Down the page: `end` of the title's line, the default; `above` the title as a dated line; `below` in the footer with the badges; `start` in a column before the rail. Across: `above` the marker, the default, or `below` it. */
  timePosition?: TimelineTimePosition | undefined;
  /** Titles wrap onto more lines instead of truncating: a feed, where the sentence names a task or a file; across, a stage whose name is long. */
  wrap?: boolean | undefined;
  /** Across only. `center`, the default, puts the marker mid-column with the rail either side, for a line of releases; `start` puts it at the column's start with the text under it, for stages with a body. */
  align?: TimelineAlign | undefined;
  /** Across only. `equal`, the default, gives every event an equal share of the list, which is `dimension.part.steps` (420px) wide at least; `rail` gives each event at least a rail's width (`dimension.layout.rail`), for stages whose title and date must stay readable, and the strip scrolls past that. */
  itemWidth?: TimelineItemWidth | undefined;
  /** Timeline.Item rows, or Timeline.Group sections of them. */
  children: ReactNode;
  className?: string | undefined;
};

/** Events in order along one rail. Group items under sticky labels with Timeline.Group. Native `ol` props and the ref reach the list; across, it sits inside a scroller. */
function TimelineRoot({
  label,
  orientation = "vertical",
  size = "medium",
  timePosition,
  align = "center",
  wrap = false,
  itemWidth = "equal",
  children,
  className,
  style,
  ...props
}: TimelineProps) {
  const horizontal = orientation === "horizontal";
  const position: TimelineTimePosition = horizontal
    ? timePosition === "below"
      ? "below"
      : "above"
    : (timePosition ?? "end");
  const items = Children.toArray(children);
  const name = props["aria-label"] ?? label;
  // Four stages need about `dimension.part.steps`, 420px; `rail` keeps a rail's width for each.
  const minWidth =
    itemWidth === "rail"
      ? `calc(${items.length} * ${token("dimension.layout.rail")})`
      : token("dimension.part.steps");
  const list = (
    <ol
      aria-label={label}
      {...props}
      // A list with its markers removed keeps the list role in WebKit only when it says so.
      role="list"
      data-slot="timeline"
      data-orientation={orientation}
      data-size={size}
      className={cn(horizontal ? "flex items-start" : "grid", className)}
      style={{ ...(horizontal ? { minWidth } : { gridTemplateColumns: columns }), ...style }}
    >
      {items.map((child, i) => (
        <GroupContext.Provider key={i} value={{ first: i === 0, last: i === items.length - 1 }}>
          {child}
        </GroupContext.Provider>
      ))}
    </ol>
  );
  return (
    <TimelineContext.Provider value={{ orientation, size, timePosition: position, align, wrap }}>
      {horizontal ? (
        // Four stages need about `dimension.part.steps`, 420px; narrower than that the strip
        // scrolls: arrows where a pointer can hover, a swipe on touch, and the arrow keys once an
        // event or the strip has focus.
        <Scroller orientation="horizontal" className="w-full">
          <StripViewport name={name}>{list}</StripViewport>
          <ScrollerArrow edge="start" />
          <ScrollerArrow edge="end" />
        </Scroller>
      ) : (
        list
      )}
    </TimelineContext.Provider>
  );
}

export type TimelineGroupProps = Omit<ComponentProps<"li">, "children"> & {
  /** The period or the kind: "This week", "August". An eyebrow that sticks to the top as the list scrolls, and a heading at the contextual level: an h3 outside every HeadingLevelProvider. */
  label: ReactNode;
  /** How many events are under it. */
  count?: number | undefined;
  /** Timeline.Item rows. */
  children: ReactNode;
};

/** A run of events under one sticky label. Vertical timelines only. Native `li` props and the ref reach the group's row. */
export function TimelineGroup({ label, count, children, className, ...props }: TimelineGroupProps) {
  const id = useId();
  const edge = useContext(GroupContext);
  // The heading takes the level where the timeline sits: an h3 outside every provider.
  const heading = headingTag(useHeadingLevel() ?? 3);
  return (
    <li
      {...props}
      data-slot="timeline-group"
      className={cn("col-span-full grid grid-cols-subgrid list-none", className)}
    >
      {/* Above the rows' marker column, which is raised over the rail, so markers pass under it. */}
      <div className="sticky top-0 z-20 col-span-full grid grid-cols-subgrid bg-surface-current">
        <span />
        <span />
        <span
          className={cn(
            "flex items-baseline gap-075 ps-100 pb-050",
            edge && !edge.first ? "pt-150" : "pt-050",
          )}
        >
          {/* Eyebrow types h2 to h4; a group deeper in the outline takes h5 or h6 the same way. */}
          <Eyebrow as={heading as "h3"} id={id}>
            {label}
          </Eyebrow>
          {typeof count === "number" ? (
            <span className="font-body-xsmall font-medium text-subtle tabular-nums">{count}</span>
          ) : null}
        </span>
      </div>
      <ol role="list" aria-labelledby={id} className="col-span-full grid grid-cols-subgrid">
        <GroupContext.Provider value={edge}>{children}</GroupContext.Provider>
      </ol>
    </li>
  );
}

export type TimelineItemProps = Omit<ComponentProps<"li">, "title" | "children" | "onSelect"> & {
  /** Replaces the marker entirely: an Avatar, anything the size's slot holds (16, 20 or 24px). */
  marker?: ReactNode;
  /** The colour of the default marker: the event's kind. A dot in a ring, or the disc behind `icon`. */
  tone?: Tone | undefined;
  /** An icon in the marker, passed bare: a check for done, a cross for failed, a play for running. The marker becomes a disc in the tone with the icon on it. */
  icon?: ReactElement<{ className?: string | undefined }> | undefined;
  /** What happened, one line. It truncates, and shows whole on hover and on keyboard focus of the row while it is cut. On a row that opens, this is the link or button, stretched over the row. A Badge may sit inside it; a name may lead it. */
  title: ReactNode;
  /** Under the title, subtle: who, and the kind. One line that shows whole on hover while it is cut; it wraps where the list's titles wrap and on a row that opens. */
  meta?: ReactNode;
  /** Under the meta, `font.body.small`, wrapping: what the event amounts to, in a sentence. */
  description?: ReactNode;
  /** When, as the reader would say it: "2h ago", "28 Aug". Where it sits is the list's `timePosition`. A stamp longer than its place truncates. Left out beside `dateTime`, it is the relative words ("5 minutes ago", "yesterday") in the reader's locale, kept current. */
  time?: ReactNode;
  /** The full stamp: "2026-09-02 14:10". A screen reader hears it after `time`, and it is the time's tooltip on hover. Left out beside an ISO `dateTime`, it is that moment in full in the reader's locale and time zone. */
  timeTitle?: string | undefined;
  /** The machine-readable stamp, an ISO day or instant, which makes the time a `<time>` element. */
  dateTime?: string | undefined;
  /** A link element (a router's Link) that becomes the title and stretches over the row. Leave it empty to use title; supplied children override the link text. */
  link?:
    | ReactElement<{
        id?: string | undefined;
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Makes the title a button that stretches over the row. */
  onSelect?: (() => void) | undefined;
  /** The event that is open beside the list: the selected fill, and `aria-current` on the row's link or button. */
  isActive?: boolean | undefined;
  /** An event the reader has not seen: the title in weight 500, and "Unread" read before it. */
  isUnread?: boolean | undefined;
  /** The title in weight 500, for the current event, where its words already say why (a Current badge, "running"). An unread event is `isUnread`. */
  emphasis?: boolean | undefined;
  /** At the end of the title's line, beside the row's link or button: an unread Count, a chevron, a menu button. */
  trailing?: ReactNode;
  /** Under the description: the note, the diff, what was said, an attachment, a collapsible detail. */
  children?: ReactNode;
  /** The last line: Badges for the kind and the state, or who did it. The time joins it when the list's `timePosition` is `below`. */
  footer?: ReactNode;
  className?: string | undefined;
};

/** One event on the rail. Native `li` props, a `className` and the ref reach the event's row. */
export function TimelineItem({
  marker,
  tone = "neutral",
  icon,
  title,
  meta,
  description,
  time,
  timeTitle,
  dateTime,
  link,
  onSelect,
  isActive,
  isUnread,
  emphasis,
  trailing,
  children,
  footer,
  className,
  ...props
}: TimelineItemProps) {
  const { orientation, size, timePosition, align, wrap } = useContext(TimelineContext);
  const edge = useContext(GroupContext);
  const { t, formatDate, formatDay, timeZone } = useLedgerLocale();
  const horizontal = orientation === "horizontal";
  const s = sizes[size];
  const generatedTitleId = useId();
  const titleId = link?.props.id ?? generatedTitleId;
  const clickable = Boolean(link || onSelect);
  const strong = Boolean(emphasis || isUnread);
  const [unreadBefore = "", unreadAfter = ""] = isUnread
    ? t("timelineUnread").split("{title}")
    : [];

  const mark =
    marker ??
    (icon ? (
      <span
        className={cn(
          // The transparent edge is drawn in forced colours, which drop the fill, so the disc stays.
          "flex items-center justify-center rounded-full border border-transparent",
          s.disc,
          tone === "neutral" ? "bg-neutral text-subtle" : toneClasses[tone].bold,
        )}
      >
        {cloneElement(icon, { className: cn(s.icon, icon.props.className) })}
      </span>
    ) : size === "small" ? (
      <Dot tone={tone} className="size-100" />
    ) : (
      <span
        className={cn(
          "flex items-center justify-center rounded-full border border-default bg-surface-raised",
          size === "large" ? "size-200" : "size-150",
        )}
      >
        <Dot tone={tone} className={size === "large" ? "size-100" : undefined} />
      </span>
    ));

  const titleText = cn("font-body text-default", strong && "font-medium");
  const text = (
    <>
      {unreadBefore ? <span className="sr-only">{unreadBefore}</span> : null}
      {wrap ? (
        <span className={cn("block min-w-0 break-words", titleText)}>{title}</span>
      ) : (
        // Cut across only, so a link inside the title keeps its focus ring above and below.
        <Truncate className={titleText}>{title}</Truncate>
      )}
      {unreadAfter ? <span className="sr-only">{unreadAfter}</span> : null}
    </>
  );
  const titleClass = cn(
    "block min-w-0 outline-none",
    horizontal && "max-w-full",
    // `static` keeps the overlay stretched over the row when the link is a positioned part (TextLink).
    clickable &&
      "static after:absolute after:inset-0 after:rounded-medium focus-visible:after:outline-focused",
  );
  const centred = horizontal && align === "center";
  const current = isActive ? ("true" as const) : undefined;
  const titleLink = useRender({
    defaultTagName: "a",
    enabled: Boolean(link),
    render: link,
    props: { id: titleId, className: titleClass, "aria-current": current, children: text },
  });
  const titleEl = link ? (
    titleLink
  ) : onSelect ? (
    <button
      type="button"
      id={titleId}
      aria-current={current}
      onClick={onSelect}
      className={cn(titleClass, "cursor-pointer", centred ? "text-center" : "text-start")}
    >
      {text}
    </button>
  ) : (
    <span id={titleId} className={titleClass}>
      {text}
    </span>
  );

  // The stamp: the caller's words, or the relative words for `dateTime`, and the full stamp, the
  // caller's or `dateTime` in full. It truncates where its place is too narrow, with the full
  // stamp as the reveal, and a screen reader hears the full stamp after the words.
  const day = dateTime ? parseIsoDay(dateTime) : null;
  const instant = dateTime && !day ? parseInstant(dateTime, timeZone) : null;
  const full =
    timeTitle ??
    (day
      ? formatDay(day, { dateStyle: "medium" })
      : instant !== null
        ? formatDate(instant, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })
        : undefined);
  const relative = time === undefined && (day || instant !== null);
  const words = relative ? (
    <RelativeTime value={dateTime} isTooltipDisabled focusable={false} />
  ) : (
    time
  );
  const heard = full && full !== words ? full : undefined;
  const stampContent = (
    <>
      {words}
      {/* Pinned to the row's corner: the stamp clips across, and a hidden label left where the
          text runs on would sit past the end of a cut stamp. */}
      {heard ? <span className="sr-only start-0 top-0">{`, ${heard}`}</span> : null}
    </>
  );
  const stampClass = "max-w-full font-body-xsmall text-subtle tabular-nums";
  const stamp = words ? (
    <Truncate
      {...(heard ? { title: heard } : {})}
      // RelativeTime is a <time> of its own.
      render={dateTime && !relative ? <time dateTime={dateTime} /> : <span />}
      className={stampClass}
      style={
        !horizontal && timePosition === "end"
          ? // Beside the title it takes at most half the line, so the title keeps the rest.
            { flexShrink: 0, maxWidth: "50%" }
          : !horizontal && timePosition === "start"
            ? // In the column before the rail a stamp is at most 160px, so the rows keep their body.
              { maxWidth: `calc(2 * ${token("space.1000")})` }
            : undefined
      }
    >
      {stampContent}
    </Truncate>
  ) : null;

  const interactiveClass = cn(
    "relative rounded-medium",
    clickable && "transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered",
    isActive && "bg-selected hover:bg-selected-hovered",
  );
  // One line that shows whole on hover while it is cut. Where titles wrap it wraps too, and so it
  // does on a row that opens, whose stretched link lies over it and would take the hover.
  const metaClass = "max-w-full font-body-xsmall text-subtle";
  const metaEl = meta ? (
    wrap || clickable ? (
      <span className={cn("block break-words", metaClass)}>{meta}</span>
    ) : (
      <Truncate className={metaClass}>{meta}</Truncate>
    )
  ) : null;
  const descriptionEl = description ? (
    <span className="block max-w-full break-words font-body-small text-subtle">{description}</span>
  ) : null;
  const bodyEl = children ? (
    <span className="relative block max-w-full pt-025 font-body text-default">{children}</span>
  ) : null;
  const stampBelow = !horizontal && timePosition === "below";
  const footerEl =
    footer || (stampBelow && stamp) ? (
      <span
        className={cn(
          "flex max-w-full flex-wrap items-center gap-075 pt-025 font-body-xsmall text-subtle",
          centred && "justify-center",
        )}
      >
        {stampBelow ? stamp : null}
        {footer}
      </span>
    ) : null;
  // A row that does not open carries the current state itself.
  const rowState = isActive
    ? { ...(clickable ? {} : { "aria-current": current }), "data-active": "" }
    : {};

  if (horizontal) {
    const rail = (edge: "start" | "end") => (
      <span
        aria-hidden
        className={cn(
          "h-0 flex-1 border-t border-default",
          edge === "start" ? "group-first/event:invisible" : "group-last/event:invisible",
        )}
      />
    );
    const markerEl = (
      <span
        data-slot="timeline-marker"
        className={cn("relative z-10 flex shrink-0 items-center justify-center", s.col, s.box)}
      >
        {mark}
      </span>
    );
    return (
      <li
        {...props}
        {...rowState}
        data-slot="timeline-item"
        className={cn("group/event flex min-w-0 flex-1 list-none", className)}
      >
        <div
          className={cn(
            interactiveClass,
            "flex w-full min-w-0 flex-col",
            centred ? "items-center text-center" : "items-start text-start",
            s.pad,
          )}
        >
          {timePosition === "above" ? (
            <span className={cn("flex h-200 max-w-full items-end", !centred && "ps-050")}>
              {stamp}
            </span>
          ) : null}
          <span className={cn("flex w-full items-center", timePosition === "above" && "pt-050")}>
            {centred ? (
              rail("start")
            ) : (
              // At the start, the marker and the text keep `space.050` from the column's edge, so
              // the focus ring drawn inside the strip passes beside them; the rail runs on to it.
              <span
                aria-hidden
                className="h-0 w-050 shrink-0 border-t border-default group-first/event:invisible"
              />
            )}
            {markerEl}
            {rail("end")}
          </span>
          <span
            className={cn(
              "flex min-w-0 max-w-full flex-col gap-025 pt-075",
              centred ? "items-center px-050" : "items-start ps-050 pe-150",
            )}
          >
            {timePosition === "below" ? stamp : null}
            {titleEl}
            {metaEl}
            {descriptionEl}
            {bodyEl}
            {footerEl}
            {trailing ? (
              <span className="relative flex items-center pt-050">{trailing}</span>
            ) : null}
          </span>
        </div>
      </li>
    );
  }

  const hideTop = !edge || edge.first;
  const hideBottom = !edge || edge.last;
  const start = timePosition === "start";
  return (
    <li
      {...props}
      {...rowState}
      data-slot="timeline-item"
      className={cn(
        interactiveClass,
        "group/event col-span-full grid grid-cols-subgrid list-none px-050",
        className,
      )}
    >
      <span className={cn("flex items-start justify-end", s.pad, start && "pe-150")}>
        {start ? <span className={cn("flex min-w-0 items-center", s.line)}>{stamp}</span> : null}
      </span>
      <span className={cn("relative z-10 flex flex-col items-center", s.col)}>
        <span
          aria-hidden
          className={cn(
            "w-0 flex-none border-s border-default",
            s.top,
            hideTop && "group-first/event:invisible",
          )}
        />
        <span
          data-slot="timeline-marker"
          className={cn("flex items-center justify-center", s.col, s.box)}
        >
          {mark}
        </span>
        <span
          aria-hidden
          className={cn(
            "w-0 flex-1 border-s border-default",
            hideBottom && "group-last/event:invisible",
          )}
        />
      </span>
      <span className={cn("flex min-w-0 flex-col gap-025 ps-100", s.pad)}>
        {timePosition === "above" ? (
          <span className="flex min-w-0 items-center">{stamp}</span>
        ) : null}
        <span className={cn("flex items-center", s.line)}>
          <span className="flex min-w-0 flex-1 items-baseline justify-between gap-150">
            {titleEl}
            {timePosition === "end" ? stamp : null}
          </span>
          {trailing ? (
            <span className="relative flex h-250 shrink-0 items-center ps-100">{trailing}</span>
          ) : null}
        </span>
        {metaEl}
        {descriptionEl}
        {bodyEl}
        {footerEl}
      </span>
    </li>
  );
}

export const Timeline = Object.assign(TimelineRoot, { Item: TimelineItem, Group: TimelineGroup });
