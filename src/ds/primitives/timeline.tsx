import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Dot } from "./badge";
import type { Tone } from "./tone";

/* Events in order along one rail: activity, history, an audit trail. Each
   item is a marker on the rail, a title, a line of meta, and a time on the
   right; `onSelect` makes the row a button. Group items under sticky labels
   with Timeline.Group. */
function TimelineRoot({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      <span
        aria-hidden
        className="absolute bottom-2 left-[10px] top-2 w-px -translate-x-1/2 bg-border"
      />
      {children}
    </ol>
  );
}

function TimelineGroup({
  label,
  count,
  children,
}: {
  label: ReactNode;
  count?: number;
  children: ReactNode;
}) {
  return (
    <li className="list-none pt-2 first:pt-0">
      <div className="sticky top-0 z-10 flex items-baseline gap-1.5 bg-background py-1 pl-7 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
        {typeof count === "number" ? (
          <span className="tnum font-medium normal-case opacity-70">{count}</span>
        ) : null}
      </div>
      <ol>{children}</ol>
    </li>
  );
}

function TimelineItem({
  marker,
  tone = "neutral",
  title,
  meta,
  time,
  timeTitle,
  onSelect,
  active,
  emphasis,
  trailing,
  children,
}: {
  /** Replaces the default ring-and-dot: an Avatar, an icon. Sized 20px. */
  marker?: ReactNode;
  tone?: Tone;
  title: ReactNode;
  meta?: ReactNode;
  time?: ReactNode;
  timeTitle?: string;
  onSelect?: () => void;
  active?: boolean;
  /** Unread or current: the title reads in foreground weight 500. */
  emphasis?: boolean;
  /** Right of the time: an unread dot, a chevron. */
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const mark = marker ?? (
    <span className="flex size-2.5 items-center justify-center rounded-full bg-card ring-1 ring-border">
      <Dot tone={tone} />
    </span>
  );
  const inner = (
    <>
      <span className="relative z-10 flex size-5 shrink-0 items-center justify-center">{mark}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "min-w-0 truncate text-[13px]",
              emphasis ? "font-medium text-foreground" : "text-foreground",
            )}
          >
            {title}
          </span>
          {time ? (
            <span title={timeTitle} className="tnum shrink-0 text-[11.5px] text-muted-foreground">
              {time}
            </span>
          ) : null}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{meta}</span>
        ) : null}
        {children ? (
          <span className="mt-1 block text-[12.5px] leading-relaxed text-foreground">
            {children}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="mt-[5px] flex shrink-0 items-center">{trailing}</span> : null}
    </>
  );
  const rowClass = cn(
    "flex w-full items-start gap-2.5 px-1 py-1.5 text-left",
    onSelect &&
      "-mx-1 w-[calc(100%+8px)] rounded-md transition-colors duration-100 hover:bg-surface-hover",
    active && "bg-primary-soft hover:bg-primary-soft",
  );
  return (
    <li className="relative list-none">
      {onSelect ? (
        <button type="button" onClick={onSelect} className={rowClass}>
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  );
}

export const Timeline = Object.assign(TimelineRoot, { Item: TimelineItem, Group: TimelineGroup });
