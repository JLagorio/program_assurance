import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { toneClasses } from "./tone";
import type { Tone } from "./tone";

/** Uppercase micro-label: 11px, weight 500, 0.06em. Tone colours it for a callout. */
export function Eyebrow({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.06em]",
        tone === "neutral" ? "text-muted-foreground" : toneClasses[tone].text,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The absent value: a muted dash where a value would be. */
export function Absent() {
  return <span className="text-muted-foreground">—</span>;
}

/** Labelled paragraph for a rail or detail body: Label over 12.5px relaxed prose. */
export function Prose({
  label,
  tone = "neutral",
  children,
  className,
}: {
  label: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pt-1.5", className)}>
      <Eyebrow tone={tone}>{label}</Eyebrow>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

/** Inline `label value` pair for the facts strip under a RecordHeader. Renders dt/dd; wrap a row of them in a <dl>. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] font-medium">{children}</dd>
    </div>
  );
}
