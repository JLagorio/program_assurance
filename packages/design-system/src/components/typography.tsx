import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

/* Small text parts that recur across rails, headers and cards. For body copy and titles, the
   Text and Heading primitives. */

export type EyebrowProps = {
  /** One to three words, set in uppercase by the component: a section's name, a record's kind, a callout's label. */
  children: ReactNode;
  /** A colour for a callout's label; `neutral`, the default, is the subtle text colour. */
  tone?: Tone | undefined;
  /** The element: `div` by default; `h3` or `h4` when the eyebrow heads a section, `dt` when it labels a value. */
  as?: "div" | "span" | "p" | "h2" | "h3" | "h4" | "dt" | undefined;
  /** An id, so a list can be labelled by its eyebrow. */
  id?: string | undefined;
  className?: string | undefined;
};

/** Uppercase micro-label on the xxsmall heading token. A tone colours it for a callout. */
export function Eyebrow({ children, tone = "neutral", as = "div", id, className }: EyebrowProps) {
  const Comp = as;
  return (
    <Comp
      id={id}
      className={cn(
        "font-heading-xxsmall uppercase",
        tone === "neutral" ? "text-subtle" : toneClasses[tone].text,
        className,
      )}
    >
      {children}
    </Comp>
  );
}

/** The absent value: a muted dash where a value would be. */
export function Absent() {
  return <span className="text-subtlest">—</span>;
}

export type ProseProps = {
  /** The paragraph's name, as an Eyebrow: "Rationale", "Condition". */
  label: string;
  /** Colours the label for a callout. */
  tone?: Tone | undefined;
  /** The paragraph. */
  children: ReactNode;
  className?: string | undefined;
};

/** Labelled paragraph for a rail or detail body: an Eyebrow over body text. */
export function Prose({ label, tone = "neutral", children, className }: ProseProps) {
  return (
    <div className={cn("flex flex-col gap-050 pt-075", className)}>
      <Eyebrow tone={tone}>{label}</Eyebrow>
      <p className="font-body text-default">{children}</p>
    </div>
  );
}

export type FactProps = {
  /** The fact's name, one or two words: "Owner", "Frequency". */
  label: string;
  /** The value: a word, a number, a Person, a Badge, an Absent. */
  children: ReactNode;
};

/** Inline `label value` pair. Renders dt/dd; a row of them is a Fact.Group. */
function FactRoot({ label, children }: FactProps) {
  return (
    <div className="flex min-w-0 items-baseline gap-075">
      <dt className="shrink-0 font-body-small text-subtle">{label}</dt>
      <dd className="min-w-0 font-body font-medium text-default">{children}</dd>
    </div>
  );
}

export type FactGroupProps = {
  /** Fact children, the ones the reader acts on. At most six under a header. */
  children: ReactNode;
  className?: string | undefined;
};

/** The facts strip: a wrapping row of Facts on one baseline. Under a record header it holds at most six; the rest belong in the rail. */
export function FactGroup({ children, className }: FactGroupProps) {
  return (
    <dl className={cn("flex flex-wrap items-baseline gap-x-300 gap-y-075", className)}>
      {children}
    </dl>
  );
}

export const Fact = Object.assign(FactRoot, { Group: FactGroup });
