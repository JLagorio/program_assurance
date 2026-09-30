import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Dot, type Tone } from "../components/badge";
import { VisuallyHidden } from "../primitives/visually-hidden";

export type GatesProps = {
  /** Gates.Item rows, in the order they are checked. */
  children: ReactNode;
  /** The list's name when no heading shows it: "Submit gates". */
  "aria-label"?: string | undefined;
  /** The id of the heading that names the list, when one shows above it ("Submit gates", "Exit criteria"). A screen reader then announces the list by that name. */
  "aria-labelledby"?: string | undefined;
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
  /** The one thing that meets it, at the end of the row: a link Button or a TextLink named for the gate ("Add success criterion"). */
  action?: ReactNode;
};

/**
 * The conditions an action waits on, what a record still needs, the entry and exit criteria of a
 * phase. A list, not a score: a met gate is a check and its label, muted; an unmet gate is a Dot in
 * its tone, the label, the reason under it and the action that meets it. The reason belongs to the
 * unmet gate; a met one carries it only when the reason is a finding worth reading.
 */
function GatesRoot({
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
}: GatesProps) {
  return (
    // `role="list"` keeps the list, and its count, in WebKit, which drops it from a list without markers.
    <ul
      role="list"
      data-slot="gates"
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn("flex flex-col gap-050", className)}
    >
      {children}
    </ul>
  );
}

/** One gate. The state is drawn and also spoken, in the locale's words: "Met: Owner", "Not met: Success criterion". */
export function GateItem({ met, tone = "warning", label, reason, action }: GateItemProps) {
  const { t } = useLedgerLocale();
  // The template keeps the translated word order; the words around the label are spoken, not drawn.
  const [before = "", after = ""] = t(met ? "gateMet" : "gateNotMet").split("{label}");
  return (
    <li data-slot="gate" className="flex items-start gap-100">
      <span className="flex size-200 shrink-0 items-center justify-center">
        {met ? <Check aria-hidden className="size-icon-small icon-success" /> : <Dot tone={tone} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-025">
        <span className={cn("break-words font-body-small", met ? "text-subtle" : "text-default")}>
          {before ? <VisuallyHidden>{before}</VisuallyHidden> : null}
          {label}
          {after ? <VisuallyHidden>{after}</VisuallyHidden> : null}
        </span>
        {reason ? <span className="break-words font-body-xsmall text-subtle">{reason}</span> : null}
      </span>
      {action ? <span className="flex shrink-0 items-center">{action}</span> : null}
    </li>
  );
}

export const Gates = Object.assign(GatesRoot, { Item: GateItem });
