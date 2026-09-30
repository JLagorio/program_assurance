import { Check, X } from "lucide-react";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import type { LedgerMessages } from "../lib/locale-format";
import { Scroller, ScrollerArrow, ScrollerViewport } from "./scroller";
import { Truncate } from "./truncate";

/* Progress along an ordered path. The list knows each step's place and its
   neighbour's state, so a step draws its own rails: in the success colour behind every completed
   step, hairline ahead. One button per step, marker and label together, so a step is one tab stop
   and one name: its state, then its label. While any step can be moved to, the current step stays
   a button too, so the element the reader activated is still there once it becomes current. */

export type StepState = "done" | "current" | "upcoming" | "blocked";

export type StepperOrientation = "horizontal" | "vertical";

type Slot = {
  index: number;
  count: number;
  prevDone: boolean;
  numbered: boolean;
  /** Some step in the list takes `onSelect`. */
  interactive: boolean;
};

const StepperContext = createContext<Slot | null>(null);

export type StepperProps = ComponentProps<"ol"> & {
  /** `horizontal` puts labels under markers on one line, for a header; `vertical` stacks them down the left, preferred wherever it fits: a wizard's rail, a panel. */
  orientation?: StepperOrientation | undefined;
  /** Markers show the step's number in place of the dot; done and blocked keep their icon: numbers make the order plain. The number is drawn, not read: the list already says "3 of 6". */
  numbered?: boolean | undefined;
  /** The list's accessible name: "RMF steps", "Program setup". */
  label?: string | undefined;
  /** Stepper.Item rows, in order. */
  children: ReactNode;
};

/**
 * The strip's viewport. The Scroller makes it a tab stop only while it overflows and holds no
 * button; then it is a group named after the list: "RMF steps, scrolls".
 */
export function StripViewport({
  name,
  children,
}: {
  name?: string | undefined;
  children: ReactNode;
}) {
  const { t } = useLedgerLocale();
  return (
    <ScrollerViewport
      render={(viewportProps) => (
        <div
          {...viewportProps}
          {...(name && viewportProps.tabIndex === 0
            ? { "aria-label": t("namedContentScrolls", { label: name }) }
            : {})}
        />
      )}
    >
      {children}
    </ScrollerViewport>
  );
}

/** Progress through an ordered path: milestones, RMF steps, a wizard. One step is `current`; `blocked` is the step that failed. */
function StepperRoot({
  orientation = "horizontal",
  numbered = false,
  label,
  children,
  className,
  style,
  ...props
}: StepperProps) {
  const items = Children.toArray(children);
  const steps = items.map((child) =>
    isValidElement(child) ? (child.props as { state?: StepState; onSelect?: unknown }) : {},
  );
  const states = steps.map((step) => step.state ?? "upcoming");
  const interactive = steps.some((step) => typeof step.onSelect === "function");
  const name = props["aria-label"] ?? label;
  const list = (
    <ol
      {...props}
      // A list with its markers removed keeps the list role in WebKit only when it says so.
      role="list"
      aria-label={name}
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        "group/stepper",
        orientation === "horizontal" ? "flex items-start" : "flex flex-col",
        className,
      )}
      style={
        orientation === "horizontal" ? { minWidth: token("dimension.part.steps"), ...style } : style
      }
    >
      {items.map((child, i) => (
        <StepperContext.Provider
          key={i}
          value={{
            index: i,
            count: items.length,
            prevDone: i > 0 && states[i - 1] === "done",
            numbered,
            interactive,
          }}
        >
          {child}
        </StepperContext.Provider>
      ))}
    </ol>
  );
  if (orientation !== "horizontal") return list;
  // Four steps need about `dimension.part.steps`, 420px; narrower than that the strip scrolls:
  // arrows where a pointer can hover, a swipe on touch, and the arrow keys once a step or the
  // strip has focus.
  return (
    <Scroller orientation="horizontal" className="w-full">
      <StripViewport name={name}>{list}</StripViewport>
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}

const marker: Record<StepState, string> = {
  done: "border-success bg-success-bold text-inverse",
  current: "border-w-selected border-selected bg-surface text-selected",
  upcoming: "border-bold bg-surface text-subtle",
  blocked: "border-danger bg-danger-bold text-inverse",
};

/** Each state's words, read before the label: "Completed: Categorize". */
const spoken: Record<StepState, keyof LedgerMessages> = {
  done: "stepDone",
  current: "stepCurrent",
  upcoming: "stepUpcoming",
  blocked: "stepBlocked",
};

export type StepperItemProps = Omit<ComponentProps<"li">, "onSelect"> & {
  /** `done`, `current`, `upcoming`, or `blocked` for the step that failed. */
  state: StepState;
  /** One or two words, sentence case: "Categorize", "Select controls". Sixteen characters at most. A longer label is cut to one line and shows whole on hover and while its step has keyboard focus. */
  label: ReactNode;
  /** Helper text under the label: a date, who has it, why it is blocked. It may wrap. */
  meta?: ReactNode;
  /** Makes the step a button the reader can move to. Without it the step only reports, except the current step of a list where some step takes `onSelect`: it stays a button, which does nothing. */
  onSelect?: (() => void) | undefined;
  /** Under the label, when the rail is a list of milestones rather than a wizard's: a Collapsible with the owner and the open task, a sentence, a Badge. Anything interactive in it is its own stop beside the step's button. */
  children?: ReactNode;
};

/** One step. It reads its place and its neighbour from the list, so it draws its own rails. */
export function StepperItem({
  state,
  label,
  meta,
  onSelect,
  children,
  className,
  ...props
}: StepperItemProps) {
  const slot = useContext(StepperContext);
  const { t } = useLedgerLocale();
  const index = slot?.index ?? 0;
  const count = slot?.count ?? 1;
  const first = index === 0;
  const last = index === count - 1;
  const numbered = slot?.numbered ?? false;
  const doneBehind = slot?.prevDone ?? false;
  const doneAhead = state === "done";
  // The current step of a path the reader moves along stays a button, so activating a step never
  // replaces the element that has focus.
  const asButton = Boolean(onSelect) || (state === "current" && (slot?.interactive ?? false));
  const [before = "", after = ""] = t(spoken[state]).split("{label}");

  const circle = (
    <span
      aria-hidden
      data-slot="stepper-marker"
      data-state={state}
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
  const rail = (dir: "h" | "v", hidden: boolean, done: boolean) => (
    <span
      aria-hidden
      className={cn(
        "flex-1",
        dir === "h" ? "h-0 border-t" : "w-0 border-s",
        done ? "border-success" : "border-default",
        hidden && "invisible",
      )}
    />
  );
  const text = (
    <>
      <span
        data-slot="stepper-label"
        className={cn(
          "block min-w-0 max-w-full font-body-small",
          state === "current" ? "font-semibold text-default" : "font-medium",
          state === "upcoming" && "text-subtle",
          state === "blocked" && "text-danger",
          onSelect && "group-hover/step:underline",
        )}
      >
        {before ? <span className="sr-only">{before}</span> : null}
        {/* Cut to one line, and shown whole on hover and on keyboard focus of the step while cut. */}
        <Truncate>{label}</Truncate>
        {after ? <span className="sr-only start-0 top-0">{after}</span> : null}
      </span>
      {meta ? (
        <span className="max-w-full font-body-xsmall text-subtle tabular-nums">{meta}</span>
      ) : null}
    </>
  );
  const Tag = asButton ? "button" : "span";
  const tagProps = asButton
    ? {
        type: "button" as const,
        "aria-current": state === "current" ? ("step" as const) : undefined,
        onClick: (event: MouseEvent<HTMLButtonElement>) => {
          if (!event.defaultPrevented) onSelect?.();
        },
      }
    : {};
  return (
    <li
      {...props}
      aria-current={state === "current" && !asButton ? "step" : undefined}
      data-slot="stepper-item"
      data-state={state}
      className={cn(
        "group/step relative flex min-w-0 flex-1 flex-col items-center text-center",
        "group-data-[orientation=vertical]/stepper:flex-none group-data-[orientation=vertical]/stepper:flex-row group-data-[orientation=vertical]/stepper:items-stretch group-data-[orientation=vertical]/stepper:gap-150 group-data-[orientation=vertical]/stepper:text-start",
        className,
      )}
    >
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
            asButton &&
              "cursor-pointer text-start after:absolute after:inset-0 after:rounded-medium focus-visible:after:outline-focused",
            // Down the page the step's ring stops short of the gap under it, so it never crosses
            // the next step's marker.
            asButton && "group-data-[orientation=vertical]/stepper:after:bottom-100",
            asButton && !onSelect && "cursor-default",
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
    </li>
  );
}

export const Stepper = Object.assign(StepperRoot, { Item: StepperItem });
