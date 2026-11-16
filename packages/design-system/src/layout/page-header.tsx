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
import { RelativeTime, type DateTimeValue } from "../components/date-time";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { LinkButton } from "../components/link-button";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toneClasses, type Tone } from "../lib/status-tone";
import { Heading } from "../primitives/heading";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";

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

/* ---------- the standing headline ---------- */

/** One beat of a standing: a count out of a total, or a few words. */
export type PageHeaderStandingBeat = {
  /** The figure or the words: 42, "ATO with conditions". A number is written in the reader's locale, in tabular figures. */
  value: number | string;
  /** What the figure is out of, in the subtle weight after it: 61 reads "42 of 61". */
  total?: number | undefined;
  /** What the figure counts, after it: "satisfied", "to review". */
  label?: string | undefined;
  /** A colour only when the beat is a judgement: late in `danger`. Most beats stay `neutral`, the text colour. */
  tone?: Tone | undefined;
};

export type PageHeaderStandingProps = Omit<ComponentProps<"div">, "children"> & {
  /** One beat, or two in reading order: where the record stands, then what needs doing ("42 of 61 satisfied", "2 to review"). */
  beats:
    readonly [PageHeaderStandingBeat] | readonly [PageHeaderStandingBeat, PageHeaderStandingBeat];
};

/**
 * Where the record stands, in the display size: one line under the name and the slot, of two
 * beats at most, each a count out of a total or a few words. It reads its own width: under 32rem,
 * a phone or a narrow panel, each beat takes a line of its own. Not a heading: the name stays the
 * h1, and a beat is never a link.
 */
export function PageHeaderStanding({ beats, className, ...props }: PageHeaderStandingProps) {
  const { formatNumber, t } = useLedgerLocale();
  return (
    <div
      {...props}
      data-slot="page-header-standing"
      className={cn("@container/standing min-w-0", className)}
    >
      <div className="flex flex-wrap items-baseline gap-x-300 @max-lg/standing:flex-col @max-lg/standing:items-start">
        {beats.map((beat, index) => {
          const figure = typeof beat.value === "number" ? formatNumber(beat.value) : beat.value;
          const [before = "", after = ""] =
            beat.total === undefined
              ? []
              : t("pageHeaderStandingOf", { total: formatNumber(beat.total) }).split("{value}");
          const tone = beat.tone ?? "neutral";
          return (
            <Heading
              // A beat's place is its identity: there are one or two, in reading order.
              key={index}
              size="display"
              as="div"
              data-slot="page-header-standing-beat"
              data-tone={tone}
              className={cn(
                "min-w-0 break-words tabular-nums",
                tone === "neutral" ? "text-default" : toneClasses[tone].text,
              )}
            >
              {before ? <span className="font-regular text-subtle">{before}</span> : null}
              {figure}
              {after ? <span className="font-regular text-subtle">{after}</span> : null}
              {beat.label ? ` ${beat.label}` : null}
            </Heading>
          );
        })}
      </div>
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
  Standing: PageHeaderStanding,
});
