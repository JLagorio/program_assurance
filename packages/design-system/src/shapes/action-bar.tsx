import type { ReactNode } from "react";

import { Badge, Indicator, type Tone } from "../components/badge";
import { Button } from "../components/button";
import { Id } from "../components/id";

export type ActionBarState = {
  label: string;
  value: string;
  tone: Tone;
  /** Rendered as a control when the viewer may change it. */
  control?: ReactNode;
};

export type ActionBarAction = {
  label: string;
  onSelect: () => void;
  primary?: boolean | undefined;
  /** Non-null disables the action and explains why on hover and inline. */
  blocked?: string | null | undefined;
};

/** Identity, current state, and what you can do about it, pinned above the work. A blocked action carries its reason rather than hiding it. */
export function ActionBar({ breadcrumb, id, title, context, states, actions, tabs }: { breadcrumb?: ReactNode; id: ReactNode; title: ReactNode; context?: ReactNode; states: ActionBarState[]; actions?: ActionBarAction[] | undefined; tabs?: ReactNode }) {
  const blockedReason = actions?.find((a) => a.blocked)?.blocked;
  const anyAllowed = actions?.some((a) => !a.blocked);
  return (
    <div className="sticky top-0 z-20 flex flex-col gap-100 border-b border-default bg-surface-current pt-050">
      {breadcrumb ? <div>{breadcrumb}</div> : null}
      <div className="flex items-start justify-between gap-300">
        <div className="flex min-w-0 flex-col gap-050">
          <div className="flex flex-wrap items-baseline gap-x-150 gap-y-050">
            <Id className="font-body text-subtle">{id}</Id>
            <h1 className="font-heading-xsmall font-semibold text-default">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-200 gap-y-050">
            {context ? <span className="font-body-small text-subtle">{context}</span> : null}
            {states.map((s, i) => (
              <span key={s.label} className="flex items-center gap-075">
                <span className="font-body-small text-subtle">{s.label}</span>
                {s.control ?? (i === 0 ? <Badge size="xsmall" tone={s.tone}>{s.value}</Badge> : <Indicator tone={s.tone}>{s.value}</Indicator>)}
              </span>
            ))}
          </div>
        </div>
        {actions?.length ? (
          <div className="flex shrink-0 flex-col items-end gap-050">
            <div className="flex items-center gap-100">
              {actions.map((a) => (
                <Button key={a.label} variant={a.primary ? "primary" : "secondary"} onClick={a.onSelect} disabled={Boolean(a.blocked)} title={a.blocked ?? undefined}>
                  {a.label}
                </Button>
              ))}
            </div>
            {!anyAllowed && blockedReason ? <span className="font-body-xsmall text-subtle">{blockedReason}</span> : null}
          </div>
        ) : null}
      </div>
      {tabs ? <div>{tabs}</div> : <div className="pb-100" />}
    </div>
  );
}
