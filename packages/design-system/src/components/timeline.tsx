import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { Dot, toneClasses, type Tone } from "./badge";
import { Eyebrow } from "./typography";

/* Reference material. Events in order along one rail: activity, history, an audit trail, a run
   of releases. None of the three references has one; the anatomy follows Item, so a row that opens
   is its title stretched over the row, with the marker on the rail. Down the page the list is one
   grid the rows share (time · marker · body), and every row draws its own piece of the rail in the
   marker column, so the rail runs through the markers' centre whatever the size and wherever the
   time sits. Across, events share the Stepper's geometry. */

export type TimelineOrientation = "vertical" | "horizontal";

export type TimelineSize = "small" | "medium" | "large";

export type TimelineTimePosition = "end" | "start" | "above" | "below";

export type TimelineAlign = "center" | "start";

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
};

const TimelineContext = createContext<Ctx>({
  orientation: "vertical",
  size: "medium",
  timePosition: "end",
  align: "center",
});

/** Where a group sits in the list, so its first and last rows know which rail ends to hide. */
const GroupContext = createContext<{ first: boolean; last: boolean } | null>(null);

export type TimelineProps = {
  /** The list's accessible name: "Activity", "History", "Releases". */
  label?: string | undefined;
  /** `vertical`, the default, reads down with the rail on the left: a feed, a history. `horizontal` reads across with the rail on top: releases, a journey. Groups are vertical only. */
  orientation?: TimelineOrientation | undefined;
  /** The marker's scale, and with it the row. `medium` (20px) is the default: a ring holding a Dot, a disc with an icon, an `xsmall` Avatar. `small` (16px) is a bare Dot for a dense log. `large` (24px) is a `small` Avatar or a disc for a feed of people and a workflow's stages. */
  size?: TimelineSize | undefined;
  /** Where the time sits. Down the page: `end` of the title's line, the default; `above` the title as a dated line; `below` in the footer with the badges; `start` in a column before the rail. Across: `above` the marker, the default, or `below` it. */
  timePosition?: TimelineTimePosition | undefined;
  /** Across only. `center`, the default, puts the marker mid-column with the rail either side, for a line of releases; `start` puts it at the column's start with the text under it, for stages with a body. */
  align?: TimelineAlign | undefined;
  /** Timeline.Item rows, or Timeline.Group sections of them. */
  children: ReactNode;
  className?: string | undefined;
};

/** Events in order along one rail. Group items under sticky labels with Timeline.Group. */
function TimelineRoot({
  label,
  orientation = "vertical",
  size = "medium",
  timePosition,
  align = "center",
  children,
  className,
}: TimelineProps) {
  const horizontal = orientation === "horizontal";
  const position: TimelineTimePosition = horizontal
    ? timePosition === "below"
      ? "below"
      : "above"
    : (timePosition ?? "end");
  const items = Children.toArray(children);
  return (
    <TimelineContext.Provider value={{ orientation, size, timePosition: position, align }}>
      <ol
        aria-label={label}
        data-orientation={orientation}
        data-size={size}
        className={cn(horizontal ? "flex items-start" : "grid", className)}
        style={horizontal ? { minWidth: 420 } : { gridTemplateColumns: columns }}
      >
        {items.map((child, i) => (
          <GroupContext.Provider key={i} value={{ first: i === 0, last: i === items.length - 1 }}>
            {child}
          </GroupContext.Provider>
        ))}
      </ol>
    </TimelineContext.Provider>
  );
}

export type TimelineGroupProps = {
  /** The period or the kind: "This week", "August". An eyebrow that sticks to the top as the list scrolls. */
  label: ReactNode;
  /** How many events are under it. */
  count?: number | undefined;
  /** Timeline.Item rows. */
  children: ReactNode;
};

/** A run of events under one sticky label. Vertical timelines only. */
export function TimelineGroup({ label, count, children }: TimelineGroupProps) {
  const id = useId();
  const edge = useContext(GroupContext);
  return (
    <li className="col-span-full grid grid-cols-subgrid list-none">
      <div className="sticky top-0 z-10 col-span-full grid grid-cols-subgrid bg-surface-current">
        <span />
        <span />
        <span
          className={cn(
            "flex items-baseline gap-075 ps-100 pb-050",
            edge && !edge.first ? "pt-150" : "pt-050",
          )}
        >
          <Eyebrow as="h3" id={id}>
            {label}
          </Eyebrow>
          {typeof count === "number" ? (
            <span className="font-body-xsmall font-medium text-subtle tabular-nums">{count}</span>
          ) : null}
        </span>
      </div>
      <ol aria-labelledby={id} className="col-span-full grid grid-cols-subgrid">
        <GroupContext.Provider value={edge}>{children}</GroupContext.Provider>
      </ol>
    </li>
  );
}

export type TimelineItemProps = {
  /** Replaces the marker entirely: an Avatar, anything the size's slot holds (16, 20 or 24px). */
  marker?: ReactNode;
  /** The colour of the default marker: the event's kind. A dot in a ring, or the disc behind `icon`. */
  tone?: Tone | undefined;
  /** An icon in the marker, passed bare: a check for done, a cross for failed, a play for running. The marker becomes a disc in the tone with the icon on it. */
  icon?: ReactElement<{ className?: string | undefined }> | undefined;
  /** What happened, one line. It truncates. On a row that opens, this is the link or button, stretched over the row. A Badge may sit inside it; a name may lead it. */
  title: ReactNode;
  /** Under the title, one line, subtle: who, and the kind. */
  meta?: ReactNode;
  /** Under the meta, `font.body.small`, wrapping: what the event amounts to, in a sentence. */
  description?: ReactNode;
  /** When, as the reader would say it: "2h ago", "28 Aug". Where it sits is the list's `timePosition`. */
  time?: ReactNode;
  /** The full stamp as the time's tooltip: "2026-09-02 14:10". */
  timeTitle?: string | undefined;
  /** The machine-readable stamp, which makes the time a `<time>` element. */
  dateTime?: string | undefined;
  /** A link element (a router's Link) that becomes the title and stretches over the row. */
  link?:
    | ReactElement<{
        id?: string | undefined;
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Makes the title a button that stretches over the row. */
  onSelect?: (() => void) | undefined;
  /** The event that is open beside the list. */
  isActive?: boolean | undefined;
  /** Unread or current: the title reads in weight 500. */
  emphasis?: boolean | undefined;
  /** At the end of the title's line, beside the row's link or button: an unread Count, a chevron, a menu button. */
  trailing?: ReactNode;
  /** Under the description: the note, the diff, what was said, an attachment, a collapsible detail. */
  children?: ReactNode;
  /** The last line: Badges for the kind and the state, or who did it. The time joins it when the list's `timePosition` is `below`. */
  footer?: ReactNode;
};

/** One event on the rail. */
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
  emphasis,
  trailing,
  children,
  footer,
}: TimelineItemProps) {
  const { orientation, size, timePosition, align } = useContext(TimelineContext);
  const edge = useContext(GroupContext);
  const horizontal = orientation === "horizontal";
  const s = sizes[size];
  const titleId = useId();
  const clickable = Boolean(link || onSelect);

  const mark =
    marker ??
    (icon ? (
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
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

  const text = (
    <span className={cn("block truncate font-body text-default", emphasis && "font-medium")}>
      {title}
    </span>
  );
  const titleClass = cn(
    "block min-w-0 outline-none",
    horizontal && "max-w-full",
    clickable &&
      "after:absolute after:inset-0 after:rounded-medium focus-visible:after:outline-focused",
  );
  const centred = horizontal && align === "center";
  const titleEl = link ? (
    cloneElement(link, {
      id: titleId,
      className: cn(titleClass, link.props.className),
      children: text,
    })
  ) : onSelect ? (
    <button
      type="button"
      id={titleId}
      onClick={onSelect}
      className={cn(titleClass, "cursor-pointer", centred ? "text-center" : "text-left")}
    >
      {text}
    </button>
  ) : (
    <span id={titleId} className={titleClass}>
      {text}
    </span>
  );

  const stampClass = "shrink-0 font-body-xsmall text-subtle tabular-nums";
  const stamp = time ? (
    dateTime ? (
      <time dateTime={dateTime} title={timeTitle} className={stampClass}>
        {time}
      </time>
    ) : (
      <span title={timeTitle} className={stampClass}>
        {time}
      </span>
    )
  ) : null;

  const interactiveClass = cn(
    "relative rounded-medium",
    clickable && "transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered",
    isActive && "bg-selected hover:bg-selected-hovered",
  );
  const metaEl = meta ? (
    <span className="block max-w-full truncate font-body-xsmall text-subtle">{meta}</span>
  ) : null;
  const descriptionEl = description ? (
    <span className="block font-body-small text-subtle">{description}</span>
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
      <span className={cn("relative z-10 flex shrink-0 items-center justify-center", s.col, s.box)}>
        {mark}
      </span>
    );
    return (
      <li className="group/event flex min-w-0 flex-1 list-none">
        <div
          className={cn(
            interactiveClass,
            "flex w-full min-w-0 flex-col",
            centred ? "items-center text-center" : "items-start text-left",
            s.pad,
          )}
        >
          {timePosition === "above" ? (
            <span className={cn("flex h-200 items-end", !centred && "ps-050")}>{stamp}</span>
          ) : null}
          <span className={cn("flex w-full items-center", timePosition === "above" && "pt-050")}>
            {centred ? rail("start") : null}
            {markerEl}
            {rail("end")}
          </span>
          <span
            className={cn(
              "flex min-w-0 max-w-full flex-col gap-025 pt-075",
              centred ? "items-center px-050" : "items-start pe-150",
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
      className={cn(
        interactiveClass,
        "group/event col-span-full grid grid-cols-subgrid list-none px-050",
      )}
    >
      <span className={cn("flex items-start justify-end", s.pad, start && "pe-150")}>
        {start ? <span className={cn("flex items-center", s.line)}>{stamp}</span> : null}
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
        <span className={cn("flex items-center justify-center", s.col, s.box)}>{mark}</span>
        <span
          aria-hidden
          className={cn(
            "w-0 flex-1 border-s border-default",
            hideBottom && "group-last/event:invisible",
          )}
        />
      </span>
      <span className={cn("flex min-w-0 flex-col gap-025 ps-100", s.pad)}>
        {timePosition === "above" ? <span className="flex items-center">{stamp}</span> : null}
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
