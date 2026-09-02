import type { ReactNode } from "react";

import { Badge, Indicator } from "../primitives/badge";
import { Button } from "../primitives/button";
import { Id } from "../primitives/id";
import type { Tone } from "../primitives/tone";

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
  states: ActionBarState[];
  actions?: ActionBarAction[];
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
            <Id className="text-muted-foreground">{id}</Id>
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
                    <Indicator tone={s.tone}>{s.value}</Indicator>
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
