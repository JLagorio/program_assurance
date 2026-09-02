import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Dot, type Tone } from "./badge";

/** Events in order along one rail: activity, history, an audit trail. Group items under sticky labels with Timeline.Group. */
function TimelineRoot({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <ol className={cn("relative", className)}>
      <span aria-hidden className="absolute bottom-100 top-100 w-0 border-s border-default" style={{ insetInlineStart: 10 }} />
      {children}
    </ol>
  );
}

function TimelineGroup({ label, count, children }: { label: ReactNode; count?: number | undefined; children: ReactNode }) {
  return (
    <li className="list-none pt-100 first:pt-0">
      <div className="sticky top-0 z-10 flex items-baseline gap-075 bg-surface-current py-050 ps-600 font-heading-xxsmall uppercase text-subtlest">
        {label}
        {typeof count === "number" ? <span className="font-medium normal-case text-subtlest tabular-nums">{count}</span> : null}
      </div>
      <ol>{children}</ol>
    </li>
  );
}

export type TimelineItemProps = {
  /** Replaces the default ring-and-dot: an Avatar, an icon. Sized 20px. */
  marker?: ReactNode;
  tone?: Tone | undefined;
  title: ReactNode;
  meta?: ReactNode;
  time?: ReactNode;
  timeTitle?: string | undefined;
  onSelect?: (() => void) | undefined;
  isActive?: boolean | undefined;
  /** Unread or current: the title reads in weight 500. */
  emphasis?: boolean | undefined;
  /** Right of the time: an unread dot, a chevron. */
  trailing?: ReactNode;
  children?: ReactNode;
};

function TimelineItem({ marker, tone = "neutral", title, meta, time, timeTitle, onSelect, isActive, emphasis, trailing, children }: TimelineItemProps) {
  const mark = marker ?? (
    <span className="flex size-150 items-center justify-center rounded-full border border-default bg-surface-raised">
      <Dot tone={tone} />
    </span>
  );
  const inner = (
    <>
      <span className="relative z-10 flex size-250 shrink-0 items-center justify-center">{mark}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-025">
        <span className="flex items-baseline justify-between gap-150">
          <span className={cn("min-w-0 truncate font-body text-default", emphasis && "font-medium")}>{title}</span>
          {time ? (
            <span title={timeTitle} className="shrink-0 font-body-xsmall text-subtle tabular-nums">
              {time}
            </span>
          ) : null}
        </span>
        {meta ? <span className="block truncate font-body-xsmall text-subtle">{meta}</span> : null}
        {children ? <span className="block font-body text-default">{children}</span> : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center pt-050">{trailing}</span> : null}
    </>
  );
  const rowClass = cn(
    "flex w-full items-start gap-100 px-050 py-075 text-left outline-none",
    onSelect && "rounded-medium transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused",
    isActive && "bg-selected hover:bg-selected-hovered",
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
