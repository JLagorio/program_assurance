import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { toneClasses } from "./tone";
import type { Tone } from "./tone";

export type StepState = "done" | "current" | "upcoming" | "blocked";

/* Progress through an ordered path: milestones, RMF steps, a pipeline.
   Horizontal by default with the label under each marker; vertical stacks
   marker, label and meta down the left. One step is `current`; `blocked` is
   the step that failed. `onSelect` makes a step a button. */
function StepperRoot({
  orientation = "horizontal",
  children,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  children: ReactNode;
  className?: string;
}) {
  return (
    <ol
      data-orientation={orientation}
      className={cn(
        "group/stepper",
        orientation === "horizontal" ? "flex min-w-[420px] items-start" : "flex flex-col",
        className,
      )}
    >
      {children}
    </ol>
  );
}

const marker: Record<StepState, string> = {
  done: "border-success bg-success text-primary-foreground",
  current: "border-current bg-background ring-2 ring-current/20",
  upcoming: "border-border bg-background",
  blocked: "border-danger bg-danger text-primary-foreground",
};

function StepperItem({
  state,
  tone = "info",
  label,
  meta,
  title,
  first,
  last,
  onSelect,
}: {
  state: StepState;
  /** Colours the `current` marker and label; done and blocked have their own. */
  tone?: Tone;
  label: ReactNode;
  meta?: ReactNode;
  title?: string;
  /** Set on the first and last steps so the rail does not run past them. */
  first?: boolean;
  last?: boolean;
  onSelect?: () => void;
}) {
  const circle = (
    <span
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-100",
        marker[state],
        state === "current" && toneClasses[tone].text,
      )}
    >
      {state === "done" ? <Check className="size-2.5" style={{ strokeWidth: 3 }} /> : null}
      {state === "blocked" ? <X className="size-2.5" style={{ strokeWidth: 3 }} /> : null}
    </span>
  );
  const text = (
    <>
      <span
        className={cn(
          "truncate text-12",
          state === "current" ? "font-semibold text-foreground" : "font-medium",
          state === "upcoming" && "text-muted-foreground",
          state === "blocked" && "text-danger",
          onSelect && "group-hover/step:underline",
        )}
      >
        {label}
      </span>
      {meta ? <span className="tnum truncate text-11 text-muted-foreground">{meta}</span> : null}
    </>
  );
  const Tag = onSelect ? "button" : "span";
  const tagProps = onSelect ? { type: "button" as const, onClick: onSelect } : {};

  return (
    <li
      title={title}
      className="group/step relative flex min-w-0 flex-1 flex-col group-data-[orientation=vertical]/stepper:flex-row group-data-[orientation=vertical]/stepper:flex-none group-data-[orientation=vertical]/stepper:gap-3"
    >
      {/* horizontal: rail — marker — rail, label centred beneath */}
      <span className="flex items-center group-data-[orientation=vertical]/stepper:hidden">
        <span aria-hidden className={cn("h-px flex-1", first ? "bg-transparent" : "bg-border")} />
        <Tag {...tagProps} className="rounded-full">
          {circle}
        </Tag>
        <span aria-hidden className={cn("h-px flex-1", last ? "bg-transparent" : "bg-border")} />
      </span>
      <Tag
        {...tagProps}
        className="mt-1.5 flex min-w-0 flex-col items-center px-1 text-center group-data-[orientation=vertical]/stepper:hidden"
      >
        {text}
      </Tag>

      {/* vertical: marker over a rail, text to the right */}
      <span className="hidden flex-col items-center group-data-[orientation=vertical]/stepper:flex">
        <Tag {...tagProps} className="mt-0.5 rounded-full">
          {circle}
        </Tag>
        <span aria-hidden className={cn("w-px flex-1", last ? "bg-transparent" : "bg-border")} />
      </span>
      <Tag
        {...tagProps}
        className="hidden min-w-0 flex-col items-start pb-4 text-left group-data-[orientation=vertical]/stepper:flex"
      >
        {text}
      </Tag>
    </li>
  );
}

export const Stepper = Object.assign(StepperRoot, { Item: StepperItem });
