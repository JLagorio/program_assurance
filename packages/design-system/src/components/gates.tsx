import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Dot, type Tone } from "./badge";

export type GatesProps = {
  /** Gates.Item rows, in the order they are checked. */
  children: ReactNode;
  className?: string | undefined;
};

export type GateItemProps = {
  /** Whether the condition holds. A met gate is a check and a muted label; an unmet one a Dot in its tone. */
  met: boolean;
  /** The unmet colour. `warning` is the default; `danger` for a gate nothing on this record can move. */
  tone?: Tone | undefined;
  /** The condition, as a noun phrase: "Owner", "One shall", "Success criterion". */
  label: ReactNode;
  /** One short sentence under the label: what is missing, or the finding. An unmet gate's; a met one carries it only when the finding is worth reading. */
  reason?: ReactNode;
  /** The one thing that meets it, at the end of the row: a link Button or a TextLink. */
  action?: ReactNode;
};

/**
 * The conditions an action waits on, what a record still needs, the entry and exit criteria of a
 * phase. A list, not a score: a met gate is a check and its label, muted; an unmet gate is a Dot in
 * its tone, the label, the reason under it and the action that meets it. The reason belongs to the
 * unmet gate; a met one carries it only when the reason is a finding worth reading.
 */
function GatesRoot({ children, className }: GatesProps) {
  return <ul className={cn("flex flex-col gap-050", className)}>{children}</ul>;
}

/** One gate. The state is drawn and also spoken: "Met" or "Not met" before the label. */
export function GateItem({ met, tone = "warning", label, reason, action }: GateItemProps) {
  return (
    <li className="flex items-start gap-100">
      <span className="flex size-200 shrink-0 items-center justify-center">
        {met ? <Check aria-hidden className="size-icon-small icon-success" /> : <Dot tone={tone} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-025">
        <span className={cn("font-body-small", met ? "text-subtle" : "text-default")}>
          <span className="sr-only">{met ? "Met: " : "Not met: "}</span>
          {label}
        </span>
        {reason ? <span className="font-body-xsmall text-subtle">{reason}</span> : null}
      </span>
      {action ? <span className="flex shrink-0 items-center">{action}</span> : null}
    </li>
  );
}

export const Gates = Object.assign(GatesRoot, { Item: GateItem });
