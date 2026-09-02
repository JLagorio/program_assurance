import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

/*
 * Status colour, said once. Every component that paints a status (Badge, Dot, Indicator, Count,
 * later Meter and the bars) reads this table, so a tone is one decision: the subtlest fill with
 * the tone's text on it, the bold fill with inverse text, the icon colour for a 6px dot, and the
 * fill for a bar (Progress, Stacked). Neutral's fill is neutral.bold, as Atlassian's ProgressBar.
 * The names are the token names (information, not info) so a tone reads straight through to
 * `color.background.<tone>` and `color.text.<tone>`.
 */
export type Tone = "neutral" | "information" | "success" | "warning" | "danger";

export const tones = ["neutral", "information", "success", "warning", "danger"] as const;

export const toneClasses: Record<Tone, { subtle: string; bold: string; text: string; icon: string; fill: string }> = {
  neutral: { subtle: "bg-neutral text-subtle", bold: "bg-neutral-bold text-inverse", text: "text-subtle", icon: "icon-subtlest", fill: "bg-neutral-bold" },
  information: { subtle: "bg-information text-information", bold: "bg-information-bold text-inverse", text: "text-information", icon: "icon-information", fill: "bg-information-bold" },
  success: { subtle: "bg-success text-success", bold: "bg-success-bold text-inverse", text: "text-success", icon: "icon-success", fill: "bg-success-bold" },
  warning: { subtle: "bg-warning text-warning", bold: "bg-warning-bold text-warning-inverse", text: "text-warning", icon: "icon-warning", fill: "bg-warning-bold" },
  danger: { subtle: "bg-danger text-danger", bold: "bg-danger-bold text-inverse", text: "text-danger", icon: "icon-danger", fill: "bg-danger-bold" },
};

const badgeSizes = {
  xsmall: "h-200 gap-050 px-050 font-body-xsmall",
  small: "h-250 gap-050 px-075 font-body-small",
} as const;

export type BadgeProps = {
  tone?: Tone | undefined;
  /** `subtle` is the tinted fill with the tone's text (the Stripe badge, the Linear tag); `bold` is the solid fill for the one status that must win. */
  appearance?: "subtle" | "bold";
  size?: keyof typeof badgeSizes;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** A short status word in a soft fill. Atlassian calls this a Lozenge. */
export function Badge({ tone = "neutral", appearance = "subtle", size = "small", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-small font-medium", badgeSizes[size], toneClasses[tone][appearance], className)}
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
  /** The number. Anything above `max` renders as `max+`. */
  value: number;
  max?: number;
  appearance?: keyof typeof countAppearances;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** A number in a pill: unread items, rows in a group, results behind a filter. Atlassian calls this a Badge. */
export function Count({ value, max = 99, appearance = "default", className, ...rest }: CountProps) {
  const text = value > max ? `${max}+` : String(value);
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

/** A 6px status dot. It is an icon, so it takes the tone's icon colour, which is tuned to read at small sizes. */
export function Dot({ tone = "neutral", className }: { tone?: Tone | undefined; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 8 8" className={cn("inline-block size-075 shrink-0 align-middle", toneClasses[tone].icon, className)}>
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
}

export type IndicatorProps = {
  tone?: Tone | undefined;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** Severity as a Dot plus text. Never a pill, so the status column stays the only pill in a row. */
export function Indicator({ tone = "neutral", className, children, ...rest }: IndicatorProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-075 whitespace-nowrap font-body", tone === "neutral" ? "text-subtle" : "text-default", className)}
      {...rest}
    >
      <Dot tone={tone} />
      {children}
    </span>
  );
}
