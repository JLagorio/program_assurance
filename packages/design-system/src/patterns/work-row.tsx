import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  Fragment,
  isValidElement,
  useId,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { Button } from "../components/button";
import { LinkButton } from "../components/link-button";
import { Truncate } from "../components/truncate";
import { cn } from "../lib/cn";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";

/* A desk's rows: open work, one line each, the verb first. Every row is five cells on one grid the
   list shares, so the verbs, the names, the reasons, the people and the days make columns across
   every row and every tier: verb · what · why · who · when. The verb is a button where the reader
   can press it and words where the work waits on someone else. Nothing wraps: a cell narrower than
   its words cuts them with an ellipsis and shows them whole on hover, and on keyboard focus of the
   link or button they sit in. The columns read the list's own width (work-row.css): the when keeps
   its words, and the rest share what is left, the name the most. */

/** Runs the act on this page: opens its form or its dialog. */
type WorkRowAct = {
  label: string;
  onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  link?: undefined;
};
/** Goes where the act is done: a router's Link, or `<a href>`. */
type WorkRowDestination = {
  label: string;
  link: ReactElement;
  onAction?: undefined;
};
/** Work that waits on someone else: the verb is theirs, so it is words, not a button. */
type WorkRowTheirs = {
  label: string;
  onAction?: undefined;
  link?: undefined;
};

/**
 * The verb a row leads with, a verb and no object ("Add security outcomes", "Assign owner"):
 * `onAction` makes it a button, `link` a link-styled button that goes where the act is done, and
 * neither makes it words, for work that waits on someone else ("Publish results").
 */
export type WorkRowVerb = WorkRowAct | WorkRowDestination | WorkRowTheirs;

/** A WorkRow takes its row's native props and `ref` too. `title` is the row's name, not a tooltip. */
export type WorkRowProps = Omit<ComponentProps<"li">, "title" | "children"> & {
  /** What to do. A button where the reader can press it, small and secondary (36px and the one primary on the `isNext` row); words in the subtle colour where the work is someone else's. */
  verb: WorkRowVerb;
  /** What it is done to: the record's name ("PDR", "11 late POA&M items"). One line, at medium weight in the text colour, never coloured. */
  title: ReactNode;
  /** A link element (a router's Link, or `<a href>`) that makes the title a link to the record. */
  link?: ReactElement<{ id?: string | undefined; children?: ReactNode }> | undefined;
  /** Inline after the title, muted: where the record belongs ("WS-X90"). It keeps its words while the title gives way, and is cut, with its reveal, only past half the cell. */
  meta?: ReactNode;
  /** Why it is waiting, in the subtle colour: "no criteria", "maintenance window slipped", or an EmptySeat ("No owner"). */
  reason?: ReactNode;
  /** Who it waits on: a Person, an EmptySeat where nobody holds the role, or a few words ("1 product · 3 programs"). Empty where it waits on the reader. */
  waitingOn?: ReactNode;
  /** When: a DateLabel for a due day, a RelativeTime for how long it has waited. It keeps its words; give it a short form. */
  when?: ReactNode;
  /** The desk's first row, the reader's next act: its verb is the one primary at 36px, its name at the section size, and the row sits in the tray. One a list. */
  isNext?: boolean | undefined;
};

/** One line of open work: the verb, what it is done to, why, who it waits on and when. Rows stack in WorkRow.Group, and their cells make columns across it. */
function WorkRowRoot({
  verb,
  title,
  link,
  meta,
  reason,
  waitingOn,
  when,
  isNext = false,
  className,
  ...props
}: WorkRowProps) {
  const generatedTitleId = useId();
  const titleId = link?.props.id ?? generatedTitleId;
  const metaId = useId();
  const reasonId = useId();
  // The verb is described by what it is done to, so five Assign owner buttons are told apart; the
  // name by where it belongs and why it waits.
  const verbDescription = [titleId, meta ? metaId : null].filter(Boolean).join(" ");
  const titleDescription =
    [meta ? metaId : null, reason ? reasonId : null].filter(Boolean).join(" ") || undefined;
  const name = (
    <Truncate className={isNext ? "font-heading-section" : "font-body font-medium"}>
      {title}
    </Truncate>
  );
  const titleLink = useRender({
    defaultTagName: "a",
    render: link,
    enabled: Boolean(link),
    props: {
      id: titleId,
      className:
        "block min-w-0 rounded-xsmall text-default no-underline outline-none hover:underline focus-visible:outline-focused",
      children: name,
      "aria-describedby": titleDescription,
    },
  });
  const verbSize = isNext ? "large" : "small";
  const verbVariant = isNext ? "primary" : "secondary";
  const verbCell = verb.onAction ? (
    <Button
      variant={verbVariant}
      size={verbSize}
      truncate
      onClick={verb.onAction}
      aria-describedby={verbDescription}
    >
      {verb.label}
    </Button>
  ) : verb.link ? (
    <LinkButton
      variant={verbVariant}
      size={verbSize}
      render={verb.link}
      aria-describedby={verbDescription}
      className="min-w-0 max-w-full"
    >
      <Truncate>{verb.label}</Truncate>
    </LinkButton>
  ) : (
    // Someone else's verb: words, set in from the cell's start as a button's label is.
    <Truncate className="ps-150 font-body text-subtle">{verb.label}</Truncate>
  );
  return (
    <li
      {...props}
      data-slot="work-row"
      data-next={isNext ? "" : undefined}
      className={cn("col-span-full grid list-none grid-cols-subgrid", className)}
    >
      <div
        className={cn(
          "col-span-full grid grid-cols-subgrid items-center px-100 @3xl/work-row:px-150",
          isNext ? "rounded-large bg-surface-tray py-150" : "py-100",
        )}
      >
        <span
          data-slot="work-row-verb"
          className="flex min-h-control-small min-w-0 items-center justify-start"
        >
          {verbCell}
        </span>
        <span data-slot="work-row-title" className="flex min-w-0 items-baseline gap-100">
          {link ? (
            titleLink
          ) : (
            <span id={titleId} className="block min-w-0 text-default">
              {name}
            </span>
          )}
          {meta ? (
            <Truncate
              id={metaId}
              className="shrink-0 font-body text-subtle"
              style={{ maxWidth: "50%" }}
            >
              {meta}
            </Truncate>
          ) : null}
        </span>
        <span data-slot="work-row-reason" className="flex min-w-0 items-center">
          {reason ? (
            <Truncate id={reasonId} className="font-body text-subtle">
              {reason}
            </Truncate>
          ) : null}
        </span>
        <span data-slot="work-row-waiting-on" className="flex min-w-0 items-center">
          {waitingOn ? <Truncate className="font-body text-default">{waitingOn}</Truncate> : null}
        </span>
        <span
          data-slot="work-row-when"
          className="flex items-center justify-end whitespace-nowrap font-body tabular-nums"
        >
          {when}
        </span>
      </div>
    </li>
  );
}

/** A WorkRow.Tier takes its box's native props and `ref` too. `title` is the tier's heading. */
export type WorkRowTierProps = Omit<ComponentProps<"div">, "title" | "children"> & {
  /** The tier's name, a heading over its rows in the eyebrow's small capitals: "Late", "Next", "Waiting on others". It names the tier's list. The heading takes the contextual level, an h3 outside every HeadingLevelProvider. */
  title: ReactNode;
  /** The tier's WorkRows. */
  children?: ReactNode;
};

/** The hairlines: one above every row, the line under a tier's heading included, but none around
    the next row's tray. */
const rules =
  "[&>li]:border-t [&>li]:border-default [&>li[data-next]]:border-t-0 [&>li[data-next]+li]:border-t-0";

/** A ranked part of a desk: a heading ("Late", "Waiting on others") and its rows, on the columns of the WorkRow.Group it sits in. */
export function WorkRowTier({ title, children, className, ...props }: WorkRowTierProps) {
  const headingId = useId();
  const HeadingTag = headingTag(useHeadingLevel() ?? 3);
  return (
    <div
      {...props}
      data-slot="work-row-tier"
      className={cn("group/work-row-tier col-span-full grid grid-cols-subgrid", className)}
    >
      <HeadingTag
        id={headingId}
        className="col-span-full px-100 pb-075 pt-300 font-heading-xxsmall uppercase text-subtle group-first/work-row-tier:pt-0 @3xl/work-row:px-150"
      >
        {title}
      </HeadingTag>
      <ol aria-labelledby={headingId} className={cn("col-span-full grid grid-cols-subgrid", rules)}>
        {children}
      </ol>
    </div>
  );
}

/** A WorkRow.Group takes its outer box's native props and `ref` too. */
export type WorkRowGroupProps = Omit<ComponentProps<"div">, "children"> & {
  /** WorkRows, or WorkRow.Tiers that hold them. Either way their cells share one set of columns. */
  children?: ReactNode;
  /** The list's name when nothing on the page shows it: "Waiting on you". On a group of tiers it names the group, and each tier's heading names its list. */
  "aria-label"?: string | undefined;
  /** The id of a heading that names the list, when the page draws one. */
  "aria-labelledby"?: string | undefined;
};

/** Whether children hold tiers: a group of tiers draws them as they are, a group of rows draws its own list. Fragments are looked into. */
function holdsTiers(children: ReactNode): boolean {
  return Children.toArray(children).some((child) =>
    !isValidElement<{ children?: ReactNode }>(child)
      ? false
      : child.type === Fragment
        ? holdsTiers(child.props.children)
        : child.type === WorkRowTier,
  );
}

/** A desk's work: rows, or tiers of rows, on one grid, so every row's cells line up whatever it carries. It reads its own width: from 48rem the columns stand `space.200` apart, and in less `space.100`. */
export function WorkRowGroup({
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  ...props
}: WorkRowGroupProps) {
  const tiered = holdsTiers(children);
  return (
    <div
      {...props}
      {...(tiered && (ariaLabel || ariaLabelledBy)
        ? { role: "group", "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy }
        : {})}
      data-slot="work-row-group"
      className={cn("@container/work-row min-w-0", className)}
    >
      <div data-slot="work-row-grid" className="grid gap-x-100 @3xl/work-row:gap-x-200">
        {tiered ? (
          children
        ) : (
          <ol
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={cn(
              "col-span-full grid grid-cols-subgrid",
              rules,
              "[&>li:first-child]:border-t-0",
            )}
          >
            {children}
          </ol>
        )}
      </div>
    </div>
  );
}

export const WorkRow = Object.assign(WorkRowRoot, { Group: WorkRowGroup, Tier: WorkRowTier });
