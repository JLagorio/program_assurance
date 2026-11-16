import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { MoreHorizontal } from "lucide-react";
import {
  useId,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Avatar, AvatarFallback, avatarHue, avatarInitials } from "../components/avatar";
import { Button, IconButton } from "../components/button";
import {
  DateTime,
  dueStateLook,
  RelativeTime,
  useDueState,
  type DateLabelKind,
  type DateTimeValue,
} from "../components/date-time";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { LinkButton } from "../components/link-button";
import { Skeleton } from "../components/skeleton";
import { Absent } from "../components/typography";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import type { LedgerMessages } from "../lib/locale-format";
import { toneClasses, type Tone } from "../lib/status-tone";
import { Heading } from "../primitives/heading";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";
import { VisuallyHidden } from "../primitives/visually-hidden";

/** Native header props and ref; `render` sets the element. A `div` by default: the page's own header is not a banner landmark, and inside a dialog or a sheet a `header` would become one. */
export type PageHeaderProps = useRender.ComponentProps<"header">;
export type PageHeaderLeadProps = useRender.ComponentProps<"div">;
export type PageHeaderHeadingProps = ComponentProps<"div">;
export type PageHeaderTitleProps = useRender.ComponentProps<"h1">;
export type PageHeaderDescriptionProps = ComponentProps<"p">;
export type PageHeaderActionsProps = ComponentProps<"div">;

/** Page identity and navigation/actions: what names the page, then its actions at the end of the row; when the row cannot give the title its measure beside them, they take the next row. Lead spans the header; Heading holds the Title and what sits under it. Record fields and editors belong in the work area or properties, never the header. A `div`, never a landmark: the page's landmarks are the shell's; `render={<header />}` where a page wants the element. */
function PageHeaderRoot({ render, ref, className, ...props }: PageHeaderProps) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    state: { slot: "page-header" },
    props: mergeProps<"header">(props, {
      ...{ "data-slot": "page-header" },
      className: cn("page-header flex min-w-0 flex-wrap items-start gap-150", className),
    }),
  });
}
/** A line above the title across both columns: a breadcrumb (`render={<Breadcrumb />}`) or a category. */
export function PageHeaderLead({ render, ref, className, ...props }: PageHeaderLeadProps) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    state: { slot: "page-header-lead" },
    props: mergeProps<"div">(props, {
      ...{ "data-slot": "page-header-lead" },
      className: cn("min-w-0", className),
    }),
  });
}
/** The first column: the Title, then a Description or a line of facts. */
export function PageHeaderHeading({ className, ...props }: PageHeaderHeadingProps) {
  return <div {...props} data-slot="page-header-heading" className={cn("min-w-0", className)} />;
}
/** What names the page or the record: a Heading at `page`, 24/30 semibold, an h1 on a page. Inside a HeadingLevelProvider (a preview's body starts at 2) it takes that level, and `render` sets another element outright: `render={<h2 />}`, or a dialog's title part, which keeps the `page` size. */
export function PageHeaderTitle({ render, ref, className, ...props }: PageHeaderTitleProps) {
  const level = useHeadingLevel();
  return useRender({
    render: render ?? <Heading size="page" as={headingTag(level ?? 1)} />,
    ref,
    state: { slot: "page-header-title" },
    props: mergeProps<"h1">(props, {
      ...{ "data-slot": "page-header-title" },
      // The size's class rides along, so a title rendered as another part keeps it.
      className: cn("min-w-0 break-words font-heading-page text-default", className),
    }),
  });
}
export function PageHeaderDescription({ className, ...props }: PageHeaderDescriptionProps) {
  return (
    <p
      {...props}
      data-slot="page-header-description"
      className={cn("break-words pt-050 font-body text-subtle", className)}
    />
  );
}
/** One primary action or an Actions menu, at the end of the title's row. When the row cannot give the title its measure beside them, they take the next row, right-aligned. */
export function PageHeaderActions({ className, ...props }: PageHeaderActionsProps) {
  return (
    <div
      {...props}
      data-slot="page-header-actions"
      className={cn("flex shrink-0 flex-wrap items-center justify-end gap-100", className)}
    />
  );
}

/* ---------- the action slot ---------- */

type SlotAct = {
  /** Runs the act on this page: opens its form or its dialog. */
  onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  link?: undefined;
};
type SlotDestination = {
  /** A link element (a router's Link, or `<a href>`) where the act happens on another page: the act is then a LinkButton. */
  link: ReactElement;
  onAction?: undefined;
};

/** The slot's advance: the reader's own next step, and why it is theirs. */
export type PageHeaderSlotAdvance = (SlotAct | SlotDestination) & {
  /** The act, a verb and its object: "Add evidence". The page's one primary, 36px. */
  label: string;
  /** Why it is the next step, before the act at medium weight: "REQ-064 cites none". The act's description. */
  reason: ReactNode;
  /** A second, smaller line under the reason: "the only requirement". */
  detail?: ReactNode;
  /** The act is under way: Button's `isLoading`. Not for a destination. */
  isLoading?: boolean | undefined;
};

/** The slot's sign: a signature the reader owes, as a Button with `intent="sign"`. */
export type PageHeaderSlotSign = {
  /** What the signature records: "Approve security plan". */
  label: string;
  /** Who signs, the reader, by name: "R. Calloway". */
  signer: string;
  /** In what capacity they sign, said before the button: "Signing as authorizing official". */
  role: string;
  /** Records the signature, or opens the confirmation that does. Command+Enter presses it too. */
  onSign: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The signature is being recorded. */
  isLoading?: boolean | undefined;
};

/** The slot's wait: the record waits on someone else, and since when. */
export type PageHeaderSlotWaiting = {
  /** Who it waits on, by name: "R. Calloway". */
  name: string;
  /** Their role: "authorizing official". */
  role?: string | undefined;
  /** When the wait began, said relative to now ("8d ago"), with the full moment in its tooltip. */
  since: DateTimeValue;
  /** Reminds them. Leave it out where the reader may not. */
  onRemind?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  /** The reminder is on its way. */
  isReminding?: boolean | undefined;
};

/** The record's other commands, behind a subtle 36px icon button at the slot's end. */
export type PageHeaderSlotMore = {
  /** The button's name, which names the record: "More control actions". */
  label: string;
  /** The menu's items: DropdownMenuItem and DropdownMenuLinkItem, Inspect record last. */
  items: ReactNode;
};

/** One of the four forms, or none. */
type SlotForm =
  | { advance: PageHeaderSlotAdvance; sign?: undefined; waitingOn?: undefined }
  | { sign: PageHeaderSlotSign; advance?: undefined; waitingOn?: undefined }
  | { waitingOn: PageHeaderSlotWaiting; advance?: undefined; sign?: undefined }
  | { advance?: undefined; sign?: undefined; waitingOn?: undefined };

export type PageHeaderSlotProps = Omit<ComponentProps<"div">, "children"> &
  SlotForm & {
    /** The record's other commands. Every form may have them; with no form they are the slot. */
    more?: PageHeaderSlotMore | undefined;
  };

/**
 * A record's one slot for what happens next, at the end of the title's row in PageHeader.Actions'
 * place: `advance` (the reader's next step, with why), `sign` (a signature the reader owes),
 * `waitingOn` (who it waits on, since when, and Remind) or none of them. Each form is the slot's
 * own drawing, so no other can be built in it; `more` holds the record's other commands. A slot
 * with no form and no `more` draws nothing.
 */
export function PageHeaderSlot({
  advance,
  sign,
  waitingOn,
  more,
  className,
  ...props
}: PageHeaderSlotProps) {
  const { t } = useLedgerLocale();
  const whyId = useId();
  const form = advance ? "advance" : sign ? "sign" : waitingOn ? "waiting" : "none";
  if (form === "none" && !more) return null;
  return (
    <div
      {...props}
      data-slot="page-header-slot"
      data-form={form}
      className={cn("flex shrink-0 flex-wrap items-center justify-end gap-150", className)}
    >
      {advance ? (
        <>
          <span id={whyId} className="flex min-w-0 flex-col items-end text-end">
            <span className="font-body font-medium text-default">{advance.reason}</span>
            {advance.detail ? (
              <span className="font-body-small text-subtle">{advance.detail}</span>
            ) : null}
          </span>
          {advance.link ? (
            <LinkButton
              variant="primary"
              size="large"
              render={advance.link}
              aria-describedby={whyId}
            >
              {advance.label}
            </LinkButton>
          ) : (
            <Button
              variant="primary"
              size="large"
              onClick={advance.onAction}
              isLoading={advance.isLoading}
              aria-describedby={whyId}
            >
              {advance.label}
            </Button>
          )}
        </>
      ) : null}
      {sign ? (
        <>
          <span id={whyId} className="min-w-0 font-body text-default">
            {t("pageHeaderSigningAs", { role: sign.role })}
          </span>
          <Button
            intent="sign"
            signer={sign.signer}
            onClick={sign.onSign}
            isLoading={sign.isLoading}
            aria-describedby={whyId}
          >
            {sign.label}
          </Button>
        </>
      ) : null}
      {waitingOn ? (
        <>
          <span
            id={whyId}
            data-slot="page-header-slot-wait"
            className="inline-flex min-h-control-large min-w-0 max-w-full items-center gap-100 rounded-full bg-neutral py-050 ps-075 pe-150"
          >
            <Avatar aria-hidden="true" size="xsmall" hue={avatarHue(waitingOn.name)}>
              <AvatarFallback>{avatarInitials(waitingOn.name)}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-100">
              <span className="font-body font-medium text-default">
                {t("pageHeaderWaitingOn", { name: waitingOn.name })}
              </span>
              <span className="font-body-small text-subtle">
                {waitingOn.role ? `${waitingOn.role} · ` : null}
                <RelativeTime value={waitingOn.since} unitStyle="narrow" />
              </span>
            </span>
          </span>
          {waitingOn.onRemind ? (
            <Button
              size="large"
              onClick={waitingOn.onRemind}
              isLoading={waitingOn.isReminding}
              aria-describedby={whyId}
            >
              {t("pageHeaderRemind")}
            </Button>
          ) : null}
        </>
      ) : null}
      {more ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                label={more.label}
                icon={<MoreHorizontal />}
                size="large"
                variant="subtle"
              />
            }
          />
          <DropdownMenuContent align="end">{more.items}</DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/* ---------- the facts line and the standing ---------- */

export type PageHeaderFactsProps = Omit<ComponentProps<"dl">, "children"> & {
  /** Facts and at most one PageHeader.Standing, in the order the reader needs them: four at most. */
  children: ReactNode;
};

/**
 * The header's facts line, under the Title in PageHeader.Heading: a short row of labelled facts in
 * the body size, each a Fact (its label small and subtle, its value at medium weight) or the
 * record's standing (PageHeader.Standing). One line where it has the room; narrower, a phone or a
 * panel, it wraps between facts, so every fact stays whole on its line. A `dl`, as Fact.Group is.
 */
export function PageHeaderFacts({ className, ...props }: PageHeaderFactsProps) {
  return (
    <dl
      {...props}
      data-slot="page-header-facts"
      className={cn("flex min-w-0 flex-wrap items-baseline gap-x-300 gap-y-075 pt-050", className)}
    />
  );
}

/** The standing's most urgent date: a gate due, a decision that expires. */
export type PageHeaderStandingDate = {
  /** The day: an ISO day, compared with the reader's today, or an instant, compared with now in the provider's zone, as DateLabel reads it. */
  value: DateTimeValue;
  /** What falls due on it, before the words: "PDR" reads "PDR 35d late", "PDR due today", "PDR due Dec 4, 2026". Without it the words follow the status alone: "expires Sep 17, 2029". */
  name?: string | undefined;
  /** As DateLabel's: `due` (the default) reads late, due today and due on the day; `expiry`, the day a decision stops holding, reads expired, expires today and expires on the day. */
  kind?: DateLabelKind | undefined;
  /** How many days ahead read as soon, in the warning tone, as DateLabel's: 2 by default. A decision that expires is often flagged a quarter ahead (90). */
  soonWithin?: number | undefined;
  /** The moment the date is judged from; by default the clock at render. */
  now?: Date | number | undefined;
};

export type PageHeaderStandingProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the fact is, heard before its words and not drawn: "Authorization". The status words name themselves, as a status beside a name does. */
  label: string;
  /** Where the record stands, in its own short words: "ATO with conditions". Without it, and not loading, the fact is an Absent. */
  status?: string | undefined;
  /** The tone the status's badge takes, which colours its words. `neutral`, the subtle colour, by default. */
  tone?: Tone | undefined;
  /** The record's most urgent date, after the status: flagged as DateLabel flags a date, with an icon, a tone and words, while it is late, due today or due soon. */
  date?: PageHeaderStandingDate | undefined;
  /** The standing is still being read: a line holds its place and a screen reader hears Loading. */
  isLoading?: boolean | undefined;
};

const DAY_UNIT = { style: "unit", unit: "day" } as const;

/** The standing's date in words, in its state's tone, with its icon while it is flagged. */
function PageHeaderStandingDateWords({ date }: { date: PageHeaderStandingDate }) {
  const { t, formatNumber } = useLedgerLocale();
  const kind = date.kind ?? "due";
  const due = useDueState(date.value, {
    kind,
    soonWithin: date.soonWithin,
    now: date.now,
    part: "PageHeader.Standing",
  });
  if (!due) return null;
  const { state, days } = due;
  const name = date.name ?? "";
  // A day that has passed reads how long ago ("35d late"; a screen reader hears "35 days"); an
  // instant passed earlier today reads due today, in the late tone.
  const late = kind === "due" && state === "overdue" && days < 0;
  const key: keyof LedgerMessages =
    kind === "expiry"
      ? state === "overdue"
        ? "pageHeaderStandingExpired"
        : state === "today"
          ? "pageHeaderStandingExpiresToday"
          : "pageHeaderStandingExpires"
      : late
        ? "pageHeaderStandingLate"
        : state === "overdue" || state === "today"
          ? "pageHeaderStandingDueToday"
          : "pageHeaderStandingDue";
  const words = (unitDisplay: "narrow" | "long") =>
    t(key, { name, duration: formatNumber(-days, { ...DAY_UNIT, unitDisplay }) })
      .replace(/\s{2,}/g, " ")
      .trim();
  const shown = words("narrow");
  const spoken = words("long");
  const [before = "", after = ""] = shown.split("{date}");
  const phrase = shown.includes("{date}") ? (
    <>
      {before}
      {/* A day never needs the line, but a value made long wraps rather than paint past it. */}
      <DateTime value={date.value} format="date" className="whitespace-normal break-words" />
      {after}
    </>
  ) : shown === spoken ? (
    shown
  ) : (
    <>
      <span aria-hidden="true">{shown}</span>
      <VisuallyHidden>{spoken}</VisuallyHidden>
    </>
  );
  const flagged = state === "overdue" || state === "today" || state === "soon";
  return (
    <span
      data-slot="page-header-standing-date"
      data-state={state}
      data-kind={kind}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-050 [&>svg]:size-icon-small [&>svg]:shrink-0",
        state === "overdue"
          ? toneClasses.danger.text
          : flagged
            ? toneClasses.warning.text
            : "text-default",
      )}
    >
      {flagged ? dueStateLook[state].icon : null}
      <span className="min-w-0 self-baseline break-words">{phrase}</span>
    </span>
  );
}

/**
 * Where the record stands, as one fact of PageHeader.Facts: its status in its tone ("ATO with
 * conditions") and, after it, its most urgent date flagged as DateLabel flags one ("PDR 35d
 * late"), never a headline. Its label is heard, not drawn. It reads as one fact and wraps whole.
 */
export function PageHeaderStanding({
  label,
  status,
  tone = "neutral",
  date,
  isLoading,
  className,
  ...props
}: PageHeaderStandingProps) {
  const { t } = useLedgerLocale();
  return (
    <div
      {...props}
      data-slot="page-header-standing"
      data-tone={tone}
      className={cn("flex min-w-0 items-baseline", className)}
    >
      <dt className="sr-only">{label}</dt>
      <dd
        aria-busy={isLoading ? true : undefined}
        className="flex min-w-0 flex-wrap items-baseline gap-x-075 break-words font-body font-medium"
      >
        {isLoading ? (
          <>
            <Skeleton width={160} className="inline-block align-middle" />
            <VisuallyHidden>{t("loading")}</VisuallyHidden>
          </>
        ) : status ? (
          <>
            <span data-slot="page-header-standing-status" className={toneClasses[tone].text}>
              {status}
            </span>
            {date ? (
              <>
                <span aria-hidden="true" className="text-subtle">
                  ·
                </span>
                <PageHeaderStandingDateWords date={date} />
              </>
            ) : null}
          </>
        ) : (
          <Absent />
        )}
      </dd>
    </div>
  );
}

/** Page identity and its actions, with the parts as members and, for docs and imports, by name. */
export const PageHeader = Object.assign(PageHeaderRoot, {
  Lead: PageHeaderLead,
  Heading: PageHeaderHeading,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
  Actions: PageHeaderActions,
  Slot: PageHeaderSlot,
  Facts: PageHeaderFacts,
  Standing: PageHeaderStanding,
});
