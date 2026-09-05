import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

/**
 * Status colour, said once. Every component that paints a status (Badge, Dot, Indicator, Count,
 * later Meter and the bars) reads this table, so a tone is one decision: the subtlest fill with
 * the tone's text on it, the bold fill with inverse text, the icon colour for a 6px dot, and the
 * fill for a bar (Progress, Stacked). Neutral's fill is neutral.bold, as Atlassian's ProgressBar.
 * The names are the token names (information, not info) so a tone reads straight through to
 * `color.background.<tone>` and `color.text.<tone>`.
 */
export type Tone = "neutral" | "information" | "success" | "warning" | "danger";

export const tones = ["neutral", "information", "success", "warning", "danger"] as const;

export const toneClasses: Record<
  Tone,
  { subtle: string; bold: string; text: string; icon: string; fill: string }
> = {
  neutral: {
    subtle: "bg-neutral text-subtle",
    bold: "bg-neutral-bold text-inverse",
    text: "text-subtle",
    icon: "icon-subtlest",
    fill: "bg-neutral-bold",
  },
  information: {
    subtle: "bg-information text-information",
    bold: "bg-information-bold text-inverse",
    text: "text-information",
    icon: "icon-information",
    fill: "bg-information-bold",
  },
  success: {
    subtle: "bg-success text-success",
    bold: "bg-success-bold text-inverse",
    text: "text-success",
    icon: "icon-success",
    fill: "bg-success-bold",
  },
  warning: {
    subtle: "bg-warning text-warning",
    bold: "bg-warning-bold text-warning-inverse",
    text: "text-warning",
    icon: "icon-warning",
    fill: "bg-warning-bold",
  },
  danger: {
    subtle: "bg-danger text-danger",
    bold: "bg-danger-bold text-inverse",
    text: "text-danger",
    icon: "icon-danger",
    fill: "bg-danger-bold",
  },
};

const badgeSizes = {
  xsmall: "h-200 gap-050 px-050 font-body-xsmall",
  small: "h-250 gap-050 px-075 font-body-small",
} as const;

export type BadgeProps = {
  /** The status the word carries, from the tone table. `neutral` is the default, and a category or a kind is always neutral. */
  tone?: Tone | undefined;
  /** `subtle` is the tinted fill with the tone's text (the Stripe badge, the Linear tag); `bold` is the solid fill for the one status that must win. */
  appearance?: "subtle" | "bold";
  /** `small` is 20px, the default; `xsmall` is 16px, for a table row or a tab. */
  size?: keyof typeof badgeSizes;
  /** A 12px icon before the word, rarely: when the word alone is ambiguous. */
  icon?: ReactNode;
  /** One or two words in sentence case: the state. */
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** A short status word in a soft fill: the state of a record. Atlassian calls this a Lozenge, Carbon a read-only Tag. */
export function Badge({
  tone = "neutral",
  appearance = "subtle",
  size = "small",
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-small font-medium",
        badgeSizes[size],
        toneClasses[tone][appearance],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

const countAppearances = {
  default: "bg-neutral text-subtle",
  primary: "bg-brand-bold text-inverse",
  important: "bg-danger-bold text-inverse",
  added: "bg-success text-success",
  removed: "bg-danger text-danger",
} as const;

export type CountProps = {
  /** The number. Anything above `max` renders as `max+`; a string renders as given. */
  value: number | string;
  /** The ceiling, 99 by default: the pill never grows past three characters and a plus. */
  max?: number;
  /** `default` is the neutral pill; `primary` the brand fill for the one count that must be seen; `important` the danger fill for what needs attention now; `added` and `removed` for a diff. */
  appearance?: keyof typeof countAppearances;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** A number in a pill: unread items, rows in a group, results behind a filter. It is named by the label beside it. Atlassian calls this a Badge. */
export function Count({ value, max = 99, appearance = "default", className, ...rest }: CountProps) {
  const text = typeof value === "number" && value > max ? `${max}+` : String(value);
  return (
    <span
      className={cn(
        "inline-flex h-250 min-w-250 shrink-0 items-center justify-center rounded-full px-075 font-body-small font-medium tabular-nums",
        countAppearances[appearance],
        className,
      )}
      {...rest}
    >
      {text}
    </span>
  );
}

export type DotProps = {
  tone?: Tone | undefined;
  /** What the dot says when no text sits beside it: the status as a word ("Suspect", "No supplier attestation on file"). With it the dot is an image named by the label; without it the dot is hidden and the text beside it carries the status. */
  label?: string | undefined;
  className?: string | undefined;
};

/** A 6px status dot. It is an icon, so it takes the tone's icon colour, which is tuned to read at small sizes. */
export function Dot({ tone = "neutral", label, className }: DotProps) {
  return (
    <svg
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      viewBox="0 0 8 8"
      className={cn(
        "inline-block size-075 shrink-0 align-middle",
        toneClasses[tone].icon,
        className,
      )}
    >
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
}

export type IndicatorProps = {
  /** The severity or the health the Dot carries. `neutral` mutes the text as well: the lowest rung. */
  tone?: Tone | undefined;
  /** The word beside the Dot: "High", "Healthy", "Obligation not stated". It truncates when the row is narrower than it. */
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** Severity or health as a Dot plus text. Never a pill, so the status column stays the only pill in a row. */
export function Indicator({ tone = "neutral", className, children, ...rest }: IndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-075 whitespace-nowrap font-body",
        tone === "neutral" ? "text-subtle" : "text-default",
        className,
      )}
      {...rest}
    >
      <Dot tone={tone} />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
