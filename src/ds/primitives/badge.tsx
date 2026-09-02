import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { toneClasses } from "./tone";
import type { Tone } from "./tone";

/** Soft fill, solid text, no ring: the Stripe badge, the Linear tag. */
export function Badge({
  tone = "neutral",
  size = "sm",
  children,
  icon,
  className,
}: {
  tone?: Tone;
  size?: "xs" | "sm";
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium",
        size === "xs" ? "px-1 py-px text-11" : "px-1.5 py-0.5 text-12 leading-4",
        toneClasses[tone].soft,
        toneClasses[tone].text,
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", toneClasses[tone].dot)} />;
}

/** Severity as a Dot plus text — never a pill, so the status column stays the only pill in a row. */
export function Indicator({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]",
        tone === "neutral" ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      <Dot tone={tone} />
      {children}
    </span>
  );
}
