import { Check, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";

export type StepState = "done" | "current" | "upcoming" | "blocked";

/** Progress through an ordered path: milestones, RMF steps, a pipeline. One step is `current`; `blocked` is the step that failed. */
function StepperRoot({ orientation = "horizontal", children, className, style }: { orientation?: "horizontal" | "vertical" | undefined; children: ReactNode; className?: string | undefined; style?: CSSProperties | undefined }) {
  return (
    <ol data-orientation={orientation} className={cn("group/stepper", orientation === "horizontal" ? "flex items-start" : "flex flex-col", className)} style={orientation === "horizontal" ? { minWidth: 420, ...style } : style}>
      {children}
    </ol>
  );
}

const marker: Record<StepState, string> = {
  done: "border-success bg-success-bold text-inverse",
  current: "border-w-selected border-selected bg-surface text-selected",
  upcoming: "border-default bg-surface",
  blocked: "border-danger bg-danger-bold text-inverse",
};

export type StepperItemProps = {
  state: StepState;
  label: ReactNode;
  meta?: ReactNode;
  title?: string | undefined;
  /** Set on the first and last steps so the rail does not run past them. */
  first?: boolean | undefined;
  last?: boolean | undefined;
  onSelect?: (() => void) | undefined;
};

function StepperItem({ state, label, meta, title, first, last, onSelect }: StepperItemProps) {
  const circle = (
    <span className={cn("grid size-200 shrink-0 place-items-center rounded-full border transition-colors duration-fast ease-standard", marker[state])}>
      {state === "done" ? <Check className="size-100" strokeWidth={3} /> : null}
      {state === "blocked" ? <X className="size-100" strokeWidth={3} /> : null}
    </span>
  );
  const text = (
    <>
      <span className={cn("truncate font-body-small", state === "current" ? "font-semibold text-default" : "font-medium", state === "upcoming" && "text-subtle", state === "blocked" && "text-danger", onSelect && "group-hover/step:underline")}>{label}</span>
      {meta ? <span className="truncate font-body-xsmall text-subtle tabular-nums">{meta}</span> : null}
    </>
  );
  const Tag = onSelect ? "button" : "span";
  const tagProps = onSelect ? { type: "button" as const, onClick: onSelect } : {};
  const rail = (kind: "h" | "v", hidden: boolean) => <span aria-hidden className={cn("flex-1 border-default", kind === "h" ? "h-0 border-t" : "w-0 border-s", hidden && "invisible")} />;

  return (
    <li title={title} className="group/step relative flex min-w-0 flex-1 flex-col group-data-[orientation=vertical]/stepper:flex-none group-data-[orientation=vertical]/stepper:flex-row group-data-[orientation=vertical]/stepper:gap-150">
      <span className="flex items-center group-data-[orientation=vertical]/stepper:hidden">
        {rail("h", Boolean(first))}
        <Tag {...tagProps} className="rounded-full outline-none focus-visible:outline-focused">
          {circle}
        </Tag>
        {rail("h", Boolean(last))}
      </span>
      <Tag {...tagProps} className="flex min-w-0 flex-col items-center px-050 pt-075 text-center outline-none focus-visible:outline-focused group-data-[orientation=vertical]/stepper:hidden">
        {text}
      </Tag>
      <span className="hidden flex-col items-center group-data-[orientation=vertical]/stepper:flex">
        <Tag {...tagProps} className="rounded-full outline-none focus-visible:outline-focused">
          {circle}
        </Tag>
        {rail("v", Boolean(last))}
      </span>
      <Tag {...tagProps} className="hidden min-w-0 flex-col items-start pb-200 text-left outline-none focus-visible:outline-focused group-data-[orientation=vertical]/stepper:flex">
        {text}
      </Tag>
    </li>
  );
}

export const Stepper = Object.assign(StepperRoot, { Item: StepperItem });
