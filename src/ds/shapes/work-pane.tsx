import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Id } from "../primitives/id";
import type { Tone } from "../primitives/tone";

/**
 * Master–detail. The list is the navigation; selecting never leaves the page.
 *
 * Replaces the click-in / click-back loop that made working through controls
 * feel like poking: you lose your place, your filter and your scroll position
 * on every item. Here the list holds still and only the right side changes.
 */
function WorkPaneRoot({
  list,
  detail,
  listLabel,
  empty,
}: {
  list: ReactNode;
  detail: ReactNode;
  listLabel?: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-190px)] grid-cols-1 gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-140px)] lg:self-start lg:overflow-y-auto lg:border-r lg:border-border lg:pr-4">
        {listLabel ? (
          <div className="sticky top-0 z-10 bg-background pb-2 pt-0.5">{listLabel}</div>
        ) : null}
        {list}
      </aside>
      <div className="min-w-0 lg:pl-6">{detail ?? empty}</div>
    </div>
  );
}

/** One row in a WorkPane list. Dense, selectable, no chrome. */
function WorkPaneRow({
  id,
  title,
  meta,
  tone,
  active,
  onSelect,
}: {
  id: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  tone?: Tone;
  active?: boolean;
  onSelect: () => void;
}) {
  const dot: Record<Tone, string> = {
    neutral: "bg-muted-foreground/40",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-primary",
  };
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
        active ? "bg-primary-soft" : "hover:bg-surface-hover",
      )}
    >
      <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", dot[tone ?? "neutral"])} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-foreground">{title}</span>
        <span className="mt-0.5 flex items-baseline gap-2 text-[11.5px] text-muted-foreground">
          <Id>{id}</Id>
          {meta ? <span className="truncate">{meta}</span> : null}
        </span>
      </span>
    </button>
  );
}

export const WorkPane = Object.assign(WorkPaneRoot, { Row: WorkPaneRow });
