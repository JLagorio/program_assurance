import type { ReactNode } from "react";

import { Dot, type Tone } from "../components/badge";
import { Id } from "../components/id";
import { cn } from "../lib/cn";

/** Master-detail. The list is the navigation and holds still; selecting never leaves the page. */
function WorkPaneRoot({ list, detail, listLabel, empty }: { list: ReactNode; detail: ReactNode; listLabel?: ReactNode; empty?: ReactNode }) {
  return (
    <div className="grid min-h-work grid-cols-1 lg:grid-cols-list-detail">
      <aside className="lg:sticky-rail lg:overflow-y-auto lg:border-e lg:border-default lg:pe-200">
        {listLabel ? <div className="sticky top-0 z-10 bg-surface-current pb-100 pt-025">{listLabel}</div> : null}
        {list}
      </aside>
      <div className="min-w-0 lg:ps-300">{detail ?? empty}</div>
    </div>
  );
}

/** One row in a WorkPane list. Dense, selectable, no chrome. */
function WorkPaneRow({ id, title, meta, tone = "neutral", isActive, onSelect }: { id: ReactNode; title: ReactNode; meta?: ReactNode; tone?: Tone | undefined; isActive?: boolean | undefined; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("flex w-full items-start gap-100 rounded-medium px-100 py-075 text-left outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused", isActive ? "bg-selected" : "hover:bg-neutral-subtle-hovered")}
    >
      <span className="flex h-250 items-center">
        <Dot tone={tone} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-025">
        <span className="block truncate font-body text-default">{title}</span>
        <span className="flex items-baseline gap-100 font-body-xsmall text-subtle">
          <Id>{id}</Id>
          {meta ? <span className="truncate">{meta}</span> : null}
        </span>
      </span>
    </button>
  );
}

export const WorkPane = Object.assign(WorkPaneRoot, { Row: WorkPaneRow });
