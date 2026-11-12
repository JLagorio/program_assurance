import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import type { LedgerMessages } from "../lib/locale-format";
import { VisuallyHidden } from "../primitives/visually-hidden";
import type { StepState } from "./stepper";

export type PhaseBarProps = Omit<ComponentProps<"ol">, "role"> & {
  /** The list's accessible name, required so the bar is never an unnamed list: "Lifecycle gates", "Audit phases". An `aria-label` overrides it. */
  label: string;
  /** PhaseBar.Item segments, in order. */
  children: ReactNode;
};

export type PhaseBarItemProps = Omit<ComponentProps<"li">, "children"> & {
  /** `done`, `current`, `upcoming`, or `blocked` for the phase that failed. */
  state: StepState;
  /** The phase's name under its segment, a word or two: "Preparation", "Observation period". It wraps. */
  label: ReactNode;
  /** One line under the name: a day, a range, who has it. */
  meta?: ReactNode;
  /** The phase's share of the bar, against its neighbours': a three-month period beside one-week phases takes `weight={12}`. Every phase keeps a floor, so a short one stays readable. @default 1 */
  weight?: number | undefined;
  /** How far through a `current` phase the work is, 0 to 1: its segment fills that far. Unsaid, the current segment is filled. */
  progress?: number | undefined;
  /** Makes the phase's name a button that opens what the phase is: a gate's record, a review. Without it the phase only reports. */
  onSelect?: (() => void) | undefined;
};

/** Each state's words, read before the label: "Completed: Preparation". The Stepper's, since a phase is a step. */
const spoken: Record<StepState, keyof LedgerMessages> = {
  done: "stepDone",
  current: "stepCurrent",
  upcoming: "stepUpcoming",
  blocked: "stepBlocked",
};

const fill: Record<StepState, string> = {
  done: "bg-success-bold",
  current: "bg-information-bold",
  upcoming: "",
  blocked: "bg-danger-bold",
};

/**
 * Where a piece of work stands along a few named phases, as one segmented bar: each phase a
 * segment in its state's colour, its name under it. It reports where the work stands; with
 * `onSelect` a phase's name opens what the phase is. A path the reader moves along is a Stepper;
 * how far one task has gone is a Progress.
 */
function PhaseBarRoot({ label, className, children, ...props }: PhaseBarProps) {
  return (
    // `role="list"` keeps the list, and its count, in WebKit, which drops it from a list without markers.
    <ol
      aria-label={label}
      {...props}
      role="list"
      data-slot="phase-bar"
      className={cn("flex min-w-0 flex-wrap gap-x-075 gap-y-150", className)}
    >
      {children}
    </ol>
  );
}

/** One phase: its segment, then its name and one line of meta. Its state is drawn and also spoken, in the locale's words. */
export function PhaseBarItem({
  state,
  label,
  meta,
  weight = 1,
  progress,
  onSelect,
  className,
  style,
  ...props
}: PhaseBarItemProps) {
  const { t } = useLedgerLocale();
  const [before = "", after = ""] = t(spoken[state]).split("{label}");
  const share = Number.isFinite(weight) && weight > 0 ? weight : 1;
  const part =
    state === "current" && progress !== undefined && Number.isFinite(progress)
      ? Math.min(Math.max(progress, 0), 1)
      : undefined;
  const name = (
    <>
      {before ? <VisuallyHidden>{before}</VisuallyHidden> : null}
      {label}
      {after ? <VisuallyHidden>{after}</VisuallyHidden> : null}
    </>
  );
  return (
    <li
      {...props}
      aria-current={state === "current" ? "step" : undefined}
      data-slot="phase-bar-item"
      data-state={state}
      className={cn("flex min-w-1000 basis-0 flex-col gap-075", className)}
      style={{ flexGrow: share, ...style } as CSSProperties}
    >
      <span
        aria-hidden
        data-slot="phase-bar-segment"
        className="flex h-075 w-full overflow-hidden rounded-full bg-neutral"
      >
        {state === "upcoming" ? null : (
          <span
            data-slot="phase-bar-fill"
            className={cn("h-full rounded-full", fill[state])}
            style={{ width: part === undefined ? "100%" : `${part * 100}%` }}
          />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-025">
        <span
          data-slot="phase-bar-label"
          className={cn(
            "min-w-0 break-words font-body-small",
            state === "current" ? "font-semibold text-default" : "font-medium",
            state === "done" && "text-default",
            state === "upcoming" && "text-subtle",
            state === "blocked" && "text-danger",
          )}
        >
          {onSelect ? (
            <button
              type="button"
              data-slot="phase-bar-button"
              onClick={onSelect}
              className="relative cursor-pointer rounded-xsmall text-start outline-none touch-target-block hover:underline focus-visible:outline-focused"
            >
              {name}
            </button>
          ) : (
            name
          )}
        </span>
        {meta ? (
          <span
            data-slot="phase-bar-meta"
            className="min-w-0 break-words font-body-xsmall text-subtle tabular-nums"
          >
            {meta}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export const PhaseBar = Object.assign(PhaseBarRoot, { Item: PhaseBarItem });
