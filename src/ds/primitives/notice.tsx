import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Dot } from "./badge";
import { toneClasses } from "./tone";
import type { Tone } from "./tone";

/** Tinted callout in a rail or above a table: Dot, a title in the tone colour, optional body. */
export function Notice({
  tone = "warning",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2.5 text-[12.5px] leading-snug",
        toneClasses[tone].soft,
        toneClasses[tone].text,
        className,
      )}
    >
      {title ? (
        <div className="flex items-start gap-2 font-medium">
          <span className="pt-1.5">
            <Dot tone={tone} />
          </span>
          <span className="min-w-0">{title}</span>
        </div>
      ) : null}
      {children ? <div className={title ? "pt-1.5" : ""}>{children}</div> : null}
    </div>
  );
}

/* Families export one root with their parts hung off it: <Table.Cell>, <Id.List>, <Stat.Tile>. */
