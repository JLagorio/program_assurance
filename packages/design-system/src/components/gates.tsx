import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Dot, type Tone } from "./badge";

/**
 * The conditions an action waits on, what a record still needs, the entry and exit criteria of a
 * phase. A list, not a score: a met gate is a check and its label, muted; an unmet gate is a Dot in
 * its tone, the label, the reason under it and the action that meets it. The reason belongs to the
 * unmet gate; a met one carries it only when the reason is a finding worth reading.
 */

function GatesRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <ul className={cn("flex flex-col gap-050", className)}>{children}</ul>;
}

function GateItem({
  met,
  tone = "warning",
  label,
  reason,
  action,
}: {
  met: boolean;
  /** The unmet colour. Warning is the default; danger for a gate nothing else can move. */
  tone?: Tone | undefined;
  label: ReactNode;
  /** One short sentence: what is missing, or the finding. */
  reason?: ReactNode;
  /** The one thing that meets it: a link Button. */
  action?: ReactNode;
}) {
  return (
    <li className="flex items-start gap-100">
      <span className="flex size-200 shrink-0 items-center justify-center">
        {met ? (
          <Check aria-label="Met" className="size-icon-small icon-success" />
        ) : (
          <Dot tone={tone} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-025">
        <span className={cn("font-body-small", met ? "text-subtle" : "text-default")}>{label}</span>
        {reason ? <span className="font-body-xsmall text-subtle">{reason}</span> : null}
      </span>
      {action ? <span className="flex shrink-0 items-center">{action}</span> : null}
    </li>
  );
}

export const Gates = Object.assign(GatesRoot, { Item: GateItem });
