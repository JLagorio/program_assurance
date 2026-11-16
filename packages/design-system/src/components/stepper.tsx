import { Check, X } from "lucide-react";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import type { LedgerMessages } from "../lib/locale-format";
import { Heading } from "../primitives/heading";
import {
  HeadingLevelScope,
  headingTag,
  nextHeadingLevel,
  useHeadingLevel,
} from "../primitives/heading-level";
import { VisuallyHidden } from "../primitives/visually-hidden";
import { Scroller, ScrollerArrow, ScrollerViewport } from "./scroller";
import { Truncate } from "./truncate";

/* Progress along an ordered path. The list knows each step's place and its
   neighbour's state, so a step draws its own rails: in the success colour behind every completed
   step, hairline ahead. One button per step, marker and label together, so a step is one tab stop
   and one name: its state, then its label. While any step can be moved to, the current step stays
   a button too, so the element the reader activated is still there once it becomes current. */

export type StepState = "done" | "current" | "upcoming" | "blocked";

export type StepperOrientation = "horizontal" | "vertical" | "responsive";

/** `steps` is the path the reader moves along; `dated` and `ladder` are a record's path, read down the page. */
export type StepperVariant = "steps" | "dated" | "ladder";

/** A dated path's stop, by its node: a decision (a circle), a gate (a diamond), a piece of work (a small dot) or the path's end (a ring round a dot). */
export type StepNode = "decision" | "gate" | "work" | "end";

/** A stop that is at risk (`warning`) or late (`danger`): its node and its `when` take the tone. */
export type StepTone = "warning" | "danger";

/** The piece of a path's rail on one side of a row: walked (solid), ahead (dotted), or none at the path's ends. */
type Rail = "walked" | "ahead" | undefined;

type Slot = {
  index: number;
  count: number;
  prevDone: boolean;
  numbered: boolean;
  /** Some step in the list takes `onSelect`. */
  interactive: boolean;
  /** The list's variant; a path draws its rows on one grid. */
  variant?: StepperVariant | undefined;
  /** A path's open step: the first current one, whose children are its stage. */
  open?: boolean | undefined;
  /** A path's rail above the row's node and below it. */
  above?: Rail;
  below?: Rail;
};

const StepperContext = createContext<Slot | null>(null);

export type StepperProps = ComponentProps<"ol"> & {
  /** `horizontal` puts labels under markers on one line, for a header; `vertical` stacks them down the start edge, preferred wherever it fits: a wizard's rail, a panel. `responsive` reads its own container: vertical while it is narrower than `@md` (`dimension.container.md`, 448px), horizontal from there, for a wizard whose path sits in a rail beside the form on a wide screen and above it on a narrow one. A dated or ladder path is always read down the page. */
  orientation?: StepperOrientation | undefined;
  /**
   * `steps`, the default, is a path the reader moves along: a wizard, the RMF steps. `dated` and
   * `ladder` are a record's path, down the page: each step's `when` in a column before the rail,
   * its name, what it holds and who holds it on one line, and the first `current` step open with
   * its Stepper.Stage. `dated` stops are days (a gate's day, a decision's) of a `node` each, with a
   * Stepper.Today rule among them: the rail is solid before today and dotted after. `ladder` rungs
   * are numbered, and their `when` is a measure ("10 of 10"), drawn as a figure on the open rung:
   * the rail is solid below a done rung and dotted ahead. Experimental.
   */
  variant?: StepperVariant | undefined;
  /** Markers show the step's number in place of the dot; done and blocked keep their icon: numbers make the order plain. The number is drawn, not read: the list already says "3 of 6". */
  numbered?: boolean | undefined;
  /** The list's accessible name, required so the path is never an unnamed list: "RMF steps", "Program setup". An `aria-label` overrides it. */
  label: string;
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
  variant = "steps",
  numbered = false,
  label,
  children,
  className,
  style,
  ...props
}: StepperProps) {
  if (variant !== "steps")
    return (
      <PathList {...props} variant={variant} label={label} className={className} style={style}>
        {children}
      </PathList>
    );
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
        orientation === "horizontal"
          ? "flex items-start"
          : orientation === "vertical"
            ? "flex flex-col"
            : // Down the page in a container narrower than `@md`, across from there.
              "flex items-start @max-md/stepper:flex-col @max-md/stepper:items-stretch",
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
  if (orientation === "vertical") return list;
  // A responsive path is its own container, and it runs across only where four steps fit
  // (`@md` is wider than `dimension.part.steps`), so it never scrolls.
  if (orientation === "responsive")
    return (
      <div data-slot="stepper-frame" className="@container/stepper w-full min-w-0">
        {list}
      </div>
    );
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
  // The ring is filled with the surface the path sits on: a page, a card, a dialog.
  current: "border-w-selected border-selected bg-surface-current text-selected",
  upcoming: "border-bold bg-surface-current text-subtle",
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
  /** Under the label, when the rail is a list of milestones rather than a wizard's: a Collapsible with the owner and the open task, a sentence, a Badge. Anything interactive in it is its own stop beside the step's button. In a dated or ladder path, the open step's stage, a Stepper.Stage, drawn only while the step is the path's open one. */
  children?: ReactNode;
  /** In a dated or ladder path: the column before the rail. A stop's day ("Sep 18", "After PDR", "3d late"), or a rung's measure ("10 of 10"), which the open rung draws as a figure. Under a narrow container it moves above the name. */
  when?: ReactNode;
  /** In a dated path: what the stop is, which draws its node. `decision` (a circle), the default; `gate` (a diamond); `work` (a small dot); `end` (a ring round a dot). Every done stop is a check, and the open stop is filled. */
  node?: StepNode | undefined;
  /** In a dated or ladder path: `warning` for a stop at risk, `danger` for one that is late. The node of a stop ahead and its `when` take the tone; the words that say why (at risk, 3d late) are the caller's, in `when` or `meta`. */
  tone?: StepTone | undefined;
  /** In a dated or ladder path: a done stop someone signed or published (an authorization decision, published results, a satisfied rung), its check on the success fill. Other done stops are a check in ink. */
  signed?: boolean | undefined;
  /** In a dated or ladder path: at the end of the stop's line, who holds it: a Person, an EmptySeat, a role. */
  end?: ReactNode;
};

/** One step. It reads its place and its neighbour from the list, so it draws its own rails. */
export function StepperItem({
  state,
  label,
  meta,
  onSelect,
  children,
  when,
  node,
  tone,
  signed,
  end,
  className,
  ...props
}: StepperItemProps) {
  const slot = useContext(StepperContext);
  const { t } = useLedgerLocale();
  if (slot?.variant && slot.variant !== "steps")
    return (
      <PathStep
        {...props}
        place={slot}
        state={state}
        label={label}
        meta={meta}
        when={when}
        node={node}
        tone={tone}
        signed={signed}
        end={end}
        className={className}
      >
        {children}
      </PathStep>
    );
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
        // A responsive path in a container narrower than `@md` is drawn down the page, as above.
        "@max-md/stepper:flex-none @max-md/stepper:flex-row @max-md/stepper:items-stretch @max-md/stepper:gap-150 @max-md/stepper:text-start",
        className,
      )}
    >
      <span className="flex w-full items-center group-data-[orientation=vertical]/stepper:hidden @max-md/stepper:hidden">
        {rail("h", first, doneBehind)}
        {circle}
        {rail("h", last, doneAhead)}
      </span>
      <span className="hidden flex-col items-center group-data-[orientation=vertical]/stepper:flex @max-md/stepper:flex">
        {circle}
        {rail("v", last, doneAhead)}
      </span>
      <span
        className={cn(
          "flex min-w-0 max-w-full flex-col items-center px-050 pt-075",
          "group-data-[orientation=vertical]/stepper:flex-1 group-data-[orientation=vertical]/stepper:items-start group-data-[orientation=vertical]/stepper:px-0 group-data-[orientation=vertical]/stepper:pb-200 group-data-[orientation=vertical]/stepper:pt-0",
          "@max-md/stepper:flex-1 @max-md/stepper:items-start @max-md/stepper:px-0 @max-md/stepper:pb-200 @max-md/stepper:pt-0",
        )}
      >
        <Tag
          {...tagProps}
          className={cn(
            "flex max-w-full flex-col items-center outline-none group-data-[orientation=vertical]/stepper:items-start @max-md/stepper:items-start",
            asButton &&
              "cursor-pointer text-start after:absolute after:inset-0 after:rounded-medium focus-visible:after:outline-focused",
            // Down the page the step's ring stops short of the gap under it, so it never crosses
            // the next step's marker.
            asButton &&
              "group-data-[orientation=vertical]/stepper:after:bottom-100 @max-md/stepper:after:bottom-100",
            asButton && !onSelect && "cursor-default",
          )}
        >
          {text}
        </Tag>
        {children ? (
          <span className="relative block w-full pt-100 group-data-[orientation=vertical]/stepper:pt-075 @max-md/stepper:pt-075">
            {children}
          </span>
        ) : null}
      </span>
    </li>
  );
}

/* ---------- a record's path: dated or laddered, read down the page ----------
   One grid the rows share, as a vertical Timeline is (when · node · body), so the rail runs through
   the nodes' centres whatever a row holds. Each row draws its own piece of the rail above its node
   and below it: walked (solid) before Stepper.Today, or below a done rung where there is no today,
   and dotted ahead. The first current step is open: its children are its stage, the surface's one
   tray, and the other steps' children are not drawn, so one stage is open at a time. The paint is
   in src/styles/stepper.css. */

/** Whether an element is a Stepper.Today rule. */
const isToday = (child: unknown) => isValidElement(child) && child.type === StepperToday;
/** Whether an element is a Stepper.Stage. */
const isStage = (child: unknown) => isValidElement(child) && child.type === StepperStage;

type PathListProps = Omit<StepperProps, "orientation" | "numbered" | "variant"> & {
  variant: Exclude<StepperVariant, "steps">;
};

function PathList({ variant, label, children, className, ...props }: PathListProps) {
  const rows = Children.toArray(children);
  const states = rows.map((child) =>
    isValidElement(child) && !isToday(child)
      ? ((child.props as { state?: StepState }).state ?? "upcoming")
      : null,
  );
  const todayAt = rows.findIndex(isToday);
  const openAt = states.indexOf("current");
  const count = states.filter((state) => state !== null).length;
  // The piece of rail between row `i` and the row after it.
  const segment = (i: number): Rail =>
    i < 0 || i >= rows.length - 1
      ? undefined
      : todayAt >= 0
        ? i < todayAt
          ? "walked"
          : "ahead"
        : states[i] === "done"
          ? "walked"
          : "ahead";
  let step = 0;
  const slots = rows.map((_, i): Slot => {
    const index = states[i] === null ? step : step++;
    return {
      index,
      count,
      prevDone: i > 0 && states[i - 1] === "done",
      numbered: variant === "ladder",
      interactive: false,
      variant,
      open: i === openAt,
      above: segment(i - 1),
      below: segment(i),
    };
  });
  return (
    // A path reads its own container: under `@md` its `when` column moves above each name.
    <div data-slot="stepper-frame" className="@container/stepper w-full min-w-0">
      <ol
        {...props}
        // A list with its markers removed keeps the list role in WebKit only when it says so.
        role="list"
        aria-label={props["aria-label"] ?? label}
        data-slot="stepper"
        data-orientation="vertical"
        data-variant={variant}
        className={cn("grid", className)}
      >
        {rows.map((child, i) => (
          <StepperContext.Provider key={i} value={slots[i] ?? null}>
            {child}
          </StepperContext.Provider>
        ))}
      </ol>
    </div>
  );
}

/** The rail's two pieces and the node between them, in the row's node column. */
function PathRail({
  slot,
  today = false,
  children,
}: {
  slot: Slot;
  today?: boolean | undefined;
  children?: ReactNode;
}) {
  return (
    <span
      aria-hidden
      data-slot="stepper-rail"
      data-above={slot.above}
      data-below={slot.below}
      data-today={today ? "" : undefined}
      className="col-start-2 flex justify-center"
    >
      <span data-slot="stepper-node-box" className="flex size-300 items-center justify-center">
        {children}
      </span>
    </span>
  );
}

const whenText = (tone: StepTone | undefined) =>
  tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-subtle";

type StageContextValue = {
  label: ReactNode;
  meta: ReactNode;
  end: ReactNode;
};

/** What a stage reads from the step it opens: its name, what it holds and who holds it. */
const StageContext = createContext<StageContextValue | null>(null);

function PathStep({
  place: slot,
  state,
  label,
  meta,
  when,
  node = "decision",
  tone,
  signed = false,
  end,
  children,
  className,
  ...props
}: Omit<StepperItemProps, "onSelect"> & { place: Slot }) {
  const { t } = useLedgerLocale();
  const ladder = slot.variant === "ladder";
  const open = slot.open ?? false;
  const kids = Children.toArray(children);
  const staged = open && kids.some(isStage);
  const [before = "", after = ""] = t(spoken[state]).split("{label}");
  const glyph =
    state === "done" ? (
      <Check className="size-150" strokeWidth={3} />
    ) : state === "blocked" ? (
      <X className="size-150" strokeWidth={3} />
    ) : ladder ? (
      slot.index + 1
    ) : null;
  // The open rung's measure is the figure the reader came for.
  const loud = ladder && state === "current";
  const whenEl = when ? (
    <span
      data-slot="stepper-when"
      className={cn(
        "tabular-nums",
        loud ? "font-figure text-default" : cn("font-body-small", whenText(tone)),
      )}
    >
      {when}
    </span>
  ) : null;
  const words = (
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
      data-slot="stepper-item"
      data-state={state}
      data-open={open ? "" : undefined}
      data-staged={staged ? "" : undefined}
      className={cn("col-span-full grid grid-cols-subgrid", className)}
    >
      <span
        data-slot="stepper-when-cell"
        className="col-start-1 flex min-h-300 items-start justify-end pe-150 text-end @max-md/stepper:hidden"
      >
        {whenEl ? <span className="flex min-h-300 items-center">{whenEl}</span> : null}
      </span>
      <PathRail slot={slot}>
        <span
          data-slot="stepper-node"
          data-node={ladder ? "rung" : node}
          data-state={state}
          data-tone={state === "upcoming" ? tone : undefined}
          data-signed={signed && state === "done" ? "" : undefined}
        >
          {glyph}
        </span>
      </PathRail>
      <div className="col-start-3 flex min-w-0 flex-col gap-050 pb-200 ps-150">
        {/* Under a narrow container the `when` sits above the name, and its column is empty. */}
        {whenEl ? <span className="hidden @max-md/stepper:flex">{whenEl}</span> : null}
        {staged ? (
          <StageContext.Provider value={{ label: words, meta, end }}>{kids}</StageContext.Provider>
        ) : (
          <>
            <span className="flex min-h-300 min-w-0 items-start gap-150">
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-100 gap-y-025 pt-025">
                <span
                  data-slot="stepper-label"
                  className={cn(
                    "min-w-0 break-words font-body text-default",
                    open ? "font-semibold" : "font-medium",
                  )}
                >
                  {words}
                </span>
                {meta ? (
                  <span className="min-w-0 break-words font-body-small text-subtle">{meta}</span>
                ) : null}
              </span>
              {end ? (
                <span
                  data-slot="stepper-end"
                  className="flex min-w-0 shrink-0 items-center gap-075 pt-025 font-body-small text-subtle"
                  style={{ maxWidth: "50%" }}
                >
                  {end}
                </span>
              ) : null}
            </span>
            {open && kids.length > 0 ? kids : null}
          </>
        )}
      </div>
    </li>
  );
}

export type StepperTodayProps = Omit<ComponentProps<"li">, "children"> & {
  /** The words in the `when` column, and at the rule's end under a narrow container. The locale's "Today" when unsaid; a day may follow it ("Today · Nov 16"). */
  label?: ReactNode;
};

/**
 * Today, as a rule across a dated path between the last stop behind it and the first ahead: the
 * rail above it is solid and below it dotted. One a path. Native `li` props and the ref reach its row.
 */
export function StepperToday({ label, className, ...props }: StepperTodayProps) {
  const slot = useContext(StepperContext);
  const { t } = useLedgerLocale();
  const words = label ?? t("today");
  return (
    <li
      {...props}
      data-slot="stepper-today"
      className={cn("col-span-full grid grid-cols-subgrid", className)}
    >
      <span className="col-start-1 flex min-h-300 items-center justify-end pe-150 font-body-small font-medium text-default @max-md/stepper:hidden">
        {words}
      </span>
      {slot ? <PathRail slot={slot} today /> : <span className="col-start-2" />}
      <span className="col-start-3 flex min-w-0 flex-col pb-200">
        <span className="flex min-h-300 min-w-0 items-center gap-100">
          <span aria-hidden data-slot="stepper-today-rule" className="flex-1" />
          <span className="hidden font-body-small font-medium text-default @max-md/stepper:block">
            {words}
          </span>
        </span>
      </span>
    </li>
  );
}

export type StepperStageProps = Omit<ComponentProps<"div">, "children" | "role"> & {
  /** At the end of the stage's head, beside the name: a Meter of its checks, a count. */
  figure?: ReactNode;
  /** What closes it: a Gates list of its checks, or what the step needs, as a list. */
  children?: ReactNode;
  /** Under the checks: who the stage waits on, then what the reader may do about it, a secondary Button (Remind). Never a filled button: the page's one primary is the header's. */
  foot?: ReactNode;
};

/**
 * The open stop of a dated or ladder path, and the surface's one tray: the step's name as a
 * heading, what it holds and who holds it, what closes it and who it waits on. It goes in the
 * current step's children and reads the step's `label`, `meta` and `end`; the path draws it only
 * while that step is the open one. A named group, never a landmark. Native `div` props and the ref
 * reach the stage.
 */
export function StepperStage({ figure, foot, children, className, ...props }: StepperStageProps) {
  const step = useContext(StageContext);
  const titleId = useId();
  const level = useHeadingLevel() ?? 2;
  return (
    <div
      {...props}
      role="group"
      aria-labelledby={step ? titleId : undefined}
      data-slot="stepper-stage"
      className={cn("flex min-w-0 flex-col rounded-large bg-current-default", className)}
    >
      {step ? (
        <div
          data-slot="stepper-stage-head"
          className="flex min-w-0 flex-wrap items-center gap-x-150 gap-y-050 px-200 pt-150 pb-100"
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-100 gap-y-025">
            <Heading
              size="section"
              as={headingTag(level)}
              id={titleId}
              className="min-w-0 break-words text-default"
            >
              {step.label}
            </Heading>
            {step.meta ? (
              <span className="min-w-0 break-words font-body-small text-subtle">{step.meta}</span>
            ) : null}
          </span>
          {figure || step.end ? (
            <span className="flex min-w-0 flex-wrap items-center gap-150 font-body-small text-subtle">
              {figure}
              {step.end}
            </span>
          ) : null}
        </div>
      ) : null}
      {children ? (
        <div data-slot="stepper-stage-body" className="min-w-0 px-200 pt-100 pb-150">
          <HeadingLevelScope level={nextHeadingLevel(level)}>{children}</HeadingLevelScope>
        </div>
      ) : null}
      {foot ? (
        <div
          data-slot="stepper-stage-foot"
          className="flex min-w-0 flex-wrap items-center justify-between gap-x-150 gap-y-075 border-t border-default px-200 py-100 font-body-small text-subtle"
        >
          {foot}
        </div>
      ) : null}
    </div>
  );
}

export const Stepper = Object.assign(StepperRoot, {
  Item: StepperItem,
  Stage: StepperStage,
  Today: StepperToday,
});
