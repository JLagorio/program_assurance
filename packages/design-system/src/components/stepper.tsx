import { Check, X } from "lucide-react";
import { Children, createContext, useContext, type CSSProperties, type ReactNode } from "react";

import { cn } from "../lib/cn";

/* Reference material. Progress along an ordered path. The list knows each step's place and its
   neighbour's state, so a step draws its own rails: bold behind every completed step, hairline
   ahead. One button per step, marker and label together, so a step is one tab stop and one name:
   its state, then its label. */

export type StepState = "done" | "current" | "upcoming" | "blocked";

export type StepperOrientation = "horizontal" | "vertical";

type Slot = {
  index: number;
  count: number;
  prevDone: boolean;
  numbered: boolean;
};

const StepperContext = createContext<Slot | null>(null);

export type StepperProps = {
  /** `horizontal` puts labels under markers on one line, for a header; `vertical` stacks them down the left, which Carbon prefers wherever it fits: a wizard's rail, a panel. */
  orientation?: StepperOrientation | undefined;
  /** Markers show the step's number in place of the dot; done and blocked keep their icon. Carbon and Base Web both offer it: numbers make the order plain. */
  numbered?: boolean | undefined;
  /** The list's accessible name: "RMF steps", "Program setup". */
  label?: string | undefined;
  /** Stepper.Item rows, in order. */
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
};

/** Progress through an ordered path: milestones, RMF steps, a wizard. One step is `current`; `blocked` is the step that failed. */
function StepperRoot({
  orientation = "horizontal",
  numbered = false,
  label,
  children,
  className,
  style,
}: StepperProps) {
  const items = Children.toArray(children);
  const states = items.map((c) =>
    typeof c === "object" && c !== null && "props" in c
      ? ((c.props as { state?: StepState }).state ?? "upcoming")
      : "upcoming",
  );
  return (
    <ol
      aria-label={label}
      data-orientation={orientation}
      className={cn(
        "group/stepper",
        orientation === "horizontal" ? "flex items-start" : "flex flex-col",
        className,
      )}
      style={orientation === "horizontal" ? { minWidth: 420, ...style } : style}
    >
      {items.map((child, i) => (
        <StepperContext.Provider
          key={i}
          value={{
            index: i,
            count: items.length,
            prevDone: i > 0 && states[i - 1] === "done",
            numbered,
          }}
        >
          {child}
        </StepperContext.Provider>
      ))}
    </ol>
  );
}

const marker: Record<StepState, string> = {
  done: "border-success bg-success-bold text-inverse",
  current: "border-w-selected border-selected bg-surface text-selected",
  upcoming: "border-default bg-surface text-subtle",
  blocked: "border-danger bg-danger-bold text-inverse",
};

const spoken: Record<StepState, string> = {
  done: "Completed: ",
  current: "",
  upcoming: "Not started: ",
  blocked: "Blocked: ",
};

export type StepperItemProps = {
  /** `done`, `current`, `upcoming`, or `blocked` for the step that failed. */
  state: StepState;
  /** One or two words, sentence case: "Categorize", "Select controls". Carbon's limit is sixteen characters. It truncates. */
  label: ReactNode;
  /** Helper text under the label: a date, who has it, why it is blocked. Carbon's helper text; it may wrap. */
  meta?: ReactNode;
  /** The full text as a tooltip when the label truncates. */
  title?: string | undefined;
  /** Makes the step a button the reader can move to. Without it the step only reports. */
  onSelect?: (() => void) | undefined;
  /** Under the label, when the rail is a list of milestones rather than a wizard's: a Collapsible with the owner and the open task, a sentence, a Badge. Anything interactive in it is its own stop beside the step's button. */
  children?: ReactNode;
  /** @deprecated The list knows which step is first; the flag does nothing. */
  first?: boolean | undefined;
  /** @deprecated The list knows which step is last; the flag does nothing. */
  last?: boolean | undefined;
};

/** One step. It reads its place and its neighbour from the list, so it draws its own rails. */
export function StepperItem({ state, label, meta, title, onSelect, children }: StepperItemProps) {
  const slot = useContext(StepperContext);
  const index = slot?.index ?? 0;
  const count = slot?.count ?? 1;
  const first = index === 0;
  const last = index === count - 1;
  const numbered = slot?.numbered ?? false;
  const doneBehind = slot?.prevDone ?? false;
  const doneAhead = state === "done";

  const circle = (
    <span
      className={cn(
        "inline-flex size-200 shrink-0 items-center justify-center rounded-full border font-body-xsmall font-medium tabular-nums transition-colors duration-fast ease-standard",
        marker[state],
      )}
    >
      {state === "done" ? (
        <Check className="size-100" strokeWidth={3} />
      ) : state === "blocked" ? (
        <X className="size-100" strokeWidth={3} />
      ) : numbered ? (
        index + 1
      ) : null}
    </span>
  );
  const rail = (dir: "h" | "v", hidden: boolean, bold: boolean) => (
    <span
      aria-hidden
      className={cn(
        "flex-1",
        dir === "h" ? "h-0 border-t" : "w-0 border-s",
        bold ? "border-selected" : "border-default",
        hidden && "invisible",
      )}
    />
  );
  const text = (
    <>
      <span
        title={title}
        className={cn(
          "max-w-full truncate font-body-small",
          state === "current" ? "font-semibold text-default" : "font-medium",
          state === "upcoming" && "text-subtle",
          state === "blocked" && "text-danger",
          onSelect && "group-hover/step:underline",
        )}
      >
        <span className="sr-only">{spoken[state]}</span>
        {label}
      </span>
      {meta ? (
        <span className="max-w-full font-body-xsmall text-subtle tabular-nums">{meta}</span>
      ) : null}
    </>
  );
  const Tag = onSelect ? "button" : "span";
  const tagProps = onSelect ? { type: "button" as const, onClick: onSelect } : {};
  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className="group/step relative flex min-w-0 flex-1 group-data-[orientation=vertical]/stepper:flex-none"
    >
      <div className="flex w-full min-w-0 flex-col items-center text-center group-data-[orientation=vertical]/stepper:flex-row group-data-[orientation=vertical]/stepper:items-stretch group-data-[orientation=vertical]/stepper:gap-150 group-data-[orientation=vertical]/stepper:text-left">
        <span className="flex w-full items-center group-data-[orientation=vertical]/stepper:hidden">
          {rail("h", first, doneBehind)}
          {circle}
          {rail("h", last, doneAhead)}
        </span>
        <span className="hidden flex-col items-center group-data-[orientation=vertical]/stepper:flex">
          {circle}
          {rail("v", last, doneAhead)}
        </span>
        <span className="flex min-w-0 max-w-full flex-col items-center px-050 pt-075 group-data-[orientation=vertical]/stepper:flex-1 group-data-[orientation=vertical]/stepper:items-start group-data-[orientation=vertical]/stepper:px-0 group-data-[orientation=vertical]/stepper:pb-200 group-data-[orientation=vertical]/stepper:pt-0">
          <Tag
            {...tagProps}
            className={cn(
              "flex max-w-full flex-col items-center outline-none group-data-[orientation=vertical]/stepper:items-start",
              onSelect &&
                "cursor-pointer text-left after:absolute after:inset-0 after:rounded-medium focus-visible:after:outline-focused",
            )}
          >
            {text}
          </Tag>
          {children ? (
            <span className="relative block w-full pt-100 group-data-[orientation=vertical]/stepper:pt-075">
              {children}
            </span>
          ) : null}
        </span>
      </div>
    </li>
  );
}

export const Stepper = Object.assign(StepperRoot, { Item: StepperItem });
