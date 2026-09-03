import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

/* Small text parts that recur across rails, headers and cards. For body copy and titles, the
   Text and Heading primitives. */

/** Uppercase micro-label on the xxsmall heading token. A tone colours it for a callout. */
export function Eyebrow({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "font-heading-xxsmall uppercase",
        tone === "neutral" ? "text-subtlest" : toneClasses[tone].text,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The absent value: a muted dash where a value would be. */
export function Absent() {
  return <span className="text-subtlest">—</span>;
}

/** Labelled paragraph for a rail or detail body: an Eyebrow over body text. */
export function Prose({
  label,
  tone = "neutral",
  children,
  className,
}: {
  label: string;
  tone?: Tone | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex flex-col gap-050 pt-075", className)}>
      <Eyebrow tone={tone}>{label}</Eyebrow>
      <p className="font-body text-default">{children}</p>
    </div>
  );
}

/** Inline `label value` pair. Renders dt/dd; a row of them is a Fact.Group. */
function FactRoot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-075">
      <dt className="shrink-0 font-body-small text-subtle">{label}</dt>
      <dd className="min-w-0 font-body font-medium text-default">{children}</dd>
    </div>
  );
}

/** The facts strip: a wrapping row of Facts on one baseline. Under a record header it holds at most six; the rest belong in the rail. */
function FactGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <dl className={cn("flex flex-wrap items-baseline gap-x-300 gap-y-075", className)}>
      {children}
    </dl>
  );
}

export const Fact = Object.assign(FactRoot, { Group: FactGroup });
