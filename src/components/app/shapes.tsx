/**
 * Application shapes.
 *
 * `ui.tsx` says every screen is one of two shapes — IndexPage or ShowPage —
 * and that is exactly the problem. A traceability matrix, a work surface, a
 * decision queue and a reference document are different jobs, and pouring all
 * of them into "header, tab strip, stack of Sections containing tables" is why
 * every screen in this product looks the same and none of them feels like a
 * tool. The visual language is fine; the missing layer is shapes that match
 * what a person is doing.
 *
 * Four shapes, each answering a job the two archetypes could not:
 *
 *  - `WorkPane`   — you are working through a list. The list stays.
 *  - `Inspector`  — the facts stay put while the content scrolls.
 *  - `ActionBar`  — state and the actions that change it, pinned, not buried.
 *  - `Disclosure` — reference material is present but closed.
 *
 * None of them takes a `description` prop. That is deliberate: 4,382 words of
 * explanatory prose accumulated across 41 routes because `Section` invited it.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Button, Mono, Severity } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/app/ui";

/* ---------------------------------------------------------------- WorkPane */

/**
 * Master–detail. The list is the navigation; selecting never leaves the page.
 *
 * Replaces the click-in / click-back loop that made working through controls
 * feel like poking: you lose your place, your filter and your scroll position
 * on every item. Here the list holds still and only the right side changes.
 */
export function WorkPane({
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
export function WorkPaneRow({
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
          <Mono>{id}</Mono>
          {meta ? <span className="truncate">{meta}</span> : null}
        </span>
      </span>
    </button>
  );
}

/* --------------------------------------------------------------- ActionBar */

export type BarState = {
  label: string;
  value: string;
  tone: Tone;
  /** Rendered as a control when the viewer may change it. */
  control?: ReactNode;
};

export type BarAction = {
  label: string;
  onSelect: () => void;
  primary?: boolean;
  /** Non-null disables the action and explains why on hover and inline. */
  blocked?: string | null;
};

/**
 * Identity, current state, and what you can do about it — pinned above the
 * work. The single most common failure in this app was a disabled control with
 * no explanation, so a blocked action carries its reason rather than hiding it.
 */
export function ActionBar({
  breadcrumb,
  id,
  title,
  context,
  states,
  actions,
  tabs,
}: {
  /** Where you are. A record page with no trail is a dead end. */
  breadcrumb?: ReactNode;
  id: ReactNode;
  title: ReactNode;
  context?: ReactNode;
  states: BarState[];
  actions?: BarAction[];
  tabs?: ReactNode;
}) {
  const blockedReason = actions?.find((a) => a.blocked)?.blocked;
  const anyAllowed = actions?.some((a) => !a.blocked);

  return (
    <div className="sticky top-0 z-20 -mx-1 border-b border-border bg-background/95 px-1 pt-1 backdrop-blur">
      {breadcrumb ? (
        <div className="pb-1 text-[12px] text-muted-foreground">{breadcrumb}</div>
      ) : null}

      {/* Identity and actions share one row. Letting the actions wrap onto a
          line of their own reads as a detached toolbar belonging to nothing. */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Mono className="text-muted-foreground">{id}</Mono>
            <h1 className="text-[17px] font-semibold leading-tight tracking-[-0.015em]">{title}</h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            {context ? <span className="text-[12px] text-muted-foreground">{context}</span> : null}
            {/* The first state is the headline status and the bar's only pill; the rest read as dot + text. */}
            {states.map((s, i) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className="text-[12px] text-muted-foreground">{s.label}</span>
                {s.control ??
                  (i === 0 ? (
                    <Badge size="xs" tone={s.tone}>
                      {s.value}
                    </Badge>
                  ) : (
                    <Severity tone={s.tone}>{s.value}</Severity>
                  ))}
              </span>
            ))}
          </div>
        </div>

        {actions?.length ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {actions.map((a) => (
                <Button
                  key={a.label}
                  variant={a.primary ? "primary" : "secondary"}
                  onClick={a.onSelect}
                  disabled={!!a.blocked}
                  title={a.blocked ?? undefined}
                >
                  {a.label}
                </Button>
              ))}
            </div>
            {!anyAllowed && blockedReason ? (
              <span className="text-[11.5px] text-muted-foreground">{blockedReason}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {tabs ? <div className="mt-2.5">{tabs}</div> : <div className="pb-3" />}
    </div>
  );
}

/* ---------------------------------------------------------------- Inspector */

export type InspectorRow = { label: string; value: ReactNode };
export type InspectorGroup = { title: string; rows: InspectorRow[] };

/**
 * Facts that stay put.
 *
 * `RailGroup` scrolls away with the page and only renders beside one tab, so
 * the answer to "who owns this" kept ending up below the fold or on another
 * screen. This is sticky and always present.
 */
export function Inspector({ groups, footer }: { groups: InspectorGroup[]; footer?: ReactNode }) {
  return (
    <aside className="lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-140px)] lg:self-start lg:overflow-y-auto">
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.title}>
            <div className="pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/80">
              {g.title}
            </div>
            <dl className="space-y-[3px]">
              {g.rows.map((r) => (
                <div key={r.label} className="flex items-baseline gap-2">
                  <dt className="w-[104px] shrink-0 text-[12px] leading-[1.5] text-muted-foreground">
                    {r.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-[12.5px]">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {footer}
      </div>
    </aside>
  );
}

/* --------------------------------------------------------------- Disclosure */

/**
 * Reference material: present, addressable, closed.
 *
 * The catalog statement, the assessment objectives and the discussion are all
 * things a reader occasionally needs and never needs first. Rendering them
 * expanded is most of why a control page reads as a novel.
 */
export function Disclosure({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number | string | null;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2.5 text-left"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
        <span className="text-[13px] font-medium tracking-[-0.005em]">{title}</span>
        {count !== undefined && count !== null && count !== 0 ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
      </button>
      {open ? <div className="pb-4">{children}</div> : null}
    </section>
  );
}

/**
 * A block of work, always open. The counterpart to `Disclosure` — no
 * description prop, because a heading plus a count is the whole label.
 */
export function Block({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number | string | null;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-2.5">
      <div className="flex min-h-7 items-center gap-2">
        <h2 className="text-[13px] font-medium tracking-[-0.005em]">{title}</h2>
        {count !== undefined && count !== null && count !== 0 ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
        {action ? <span className="ml-auto flex items-center gap-2">{action}</span> : null}
      </div>
      <div className="pb-4">{children}</div>
    </section>
  );
}
