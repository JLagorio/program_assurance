import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";

/** The surface read by children such as sticky table headers. */
export const raisedSurface = {
  "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-raised)",
} as CSSProperties;

/** The card's inset, in the words the kit's controls use. */
export type CardSize =
  | "medium"
  | "small"
  /** @deprecated `default` is `medium`, kept for one version. */
  | "default"
  /** @deprecated `sm` is `small`, kept for one version. */
  | "sm";

/** The shadcn spellings the card still accepts, for one version. */
const legacySizes: Record<string, "medium" | "small"> = { default: "medium", sm: "small" };

export type CardProps = ComponentProps<"div"> & {
  /** `medium`, Ledger's standard inset, by default; `small` reduces the inset and the space between parts for a rail or a grid of cards. `default` and `sm` are the deprecated spellings of `medium` and `small`. */
  size?: CardSize | undefined;
};

/** A raised container for a table, chart, form or set of facts. With a CardTitle `link`, the whole card is one link: it takes a hover surface and the ring is drawn inside its edge. */
export function Card({ className, style, size: sizeProp = "medium", ...props }: CardProps) {
  const size = legacySizes[sizeProp] ?? sizeProp;
  return (
    <div
      {...props}
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex min-w-0 flex-col gap-200 overflow-hidden rounded-large border border-default bg-surface-raised py-200 data-[size=small]:gap-150 data-[size=small]:py-150",
        // A linked card: the title's link is stretched over it, so the card is its box and shows
        // the link's hover and press. A card that holds linked cards does not take their hover.
        "has-data-[slot=card-link]:relative has-data-[slot=card-link]:transition-colors has-data-[slot=card-link]:duration-fast has-data-[slot=card-link]:ease-standard motion-reduce:transition-none",
        "[&:has([data-slot=card-link]:hover):not(:has([data-slot=card]_[data-slot=card-link]:hover))]:bg-surface-raised-hovered [&:has([data-slot=card-link]:active):not(:has([data-slot=card]_[data-slot=card-link]:active))]:bg-surface-raised-pressed",
        className,
      )}
      style={{ ...raisedSurface, ...style }}
    />
  );
}

/** The title's readable measure beside an action, as Section.Header keeps it: 12rem, about twenty-five characters a line, or the title's own width when that is shorter. */
const TITLE_MEASURE_REM = 12;

/**
 * Whether the action cannot sit beside the title without cutting into the title's readable
 * measure. The widths it compares do not depend on where the action sits (the title's width on one
 * line, the action's controls side by side), so the answer holds in both arrangements and the
 * header never flips back and forth.
 */
function useActionBelow(ref: RefObject<HTMLDivElement | null>) {
  const [below, setBelow] = useState(false);
  useLayoutEffect(() => {
    const header = ref.current;
    if (!header || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const title = header.querySelector<HTMLElement>(':scope > [data-slot="card-title"]');
      const action = header.querySelector<HTMLElement>(':scope > [data-slot="card-action"]');
      if (!title || !action) return setBelow(false);
      const style = getComputedStyle(header);
      const room =
        header.clientWidth -
        parseFloat(style.paddingInlineStart) -
        parseFloat(style.paddingInlineEnd);
      const controls = [...action.children].filter(
        (child) => child.getBoundingClientRect().width > 0,
      );
      const actionWidth =
        controls.reduce((sum, child) => sum + child.getBoundingClientRect().width, 0) +
        (parseFloat(getComputedStyle(action).columnGap) || 0) * Math.max(0, controls.length - 1);
      // The title's width on one line, read without a paint: the style is restored before the
      // browser draws.
      const width = title.style.width;
      title.style.width = "max-content";
      const titleWidth = title.getBoundingClientRect().width;
      title.style.width = width;
      const rem = parseFloat(getComputedStyle(header.ownerDocument.documentElement).fontSize) || 16;
      const measureWidth = Math.min(TITLE_MEASURE_REM * rem, titleWidth);
      setBelow(room + 0.5 < measureWidth + (parseFloat(style.columnGap) || 0) + actionWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    for (const child of header.children) observer.observe(child);
    return () => observer.disconnect();
  });
  return below;
}

export type CardHeaderProps = ComponentProps<"div">;
/** The title, then the description, with a CardAction at the end of the title's row. The header reads its own width, not the window's, and keeps the title's readable measure beside the action, as Section.Header does: 12rem, or the title's own width when that is shorter. The action sits beside the title while the header holds that measure and the action side by side, and has 16rem inside its inset, that is while the card is about 18rem wide or more (about 17.5rem at `size="small"`), as a full-width card on a 340px phone is. Otherwise, in a rail, in a full-width card on a 320px phone, or beside a wide action, the action takes its own row after the description, at the end, so the title never breaks mid-word beside it. */
export function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const actionBelow = useActionBelow(headerRef);
  return useRender({
    defaultTagName: "div",
    ref: ref ? [ref, headerRef] : headerRef,
    props: mergeProps<"div">(props, {
      ...{ "data-slot": "card-header" },
      className: cn(
        // Structural tracks keep a long title shrinkable beside an intrinsic-width action. Only a
        // header with an action is a container, so a header without one keeps its intrinsic width;
        // one whose action cannot sit beside the title's measure is not one either, so its parts
        // take the narrow arrangement.
        "grid auto-rows-min items-start gap-x-200 gap-y-025 border-default px-200 [&.border-b]:pb-200 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] group-data-[size=small]/card:px-150 group-data-[size=small]/card:[&.border-b]:pb-150",
        !actionBelow && "has-data-[slot=card-action]:@container/card-header",
        className,
      ),
    }),
  });
}

export type CardTitleProps = useRender.ComponentProps<"div"> & {
  /** A link element (a router's Link, or `<a href>`) that becomes the title's text and stretches over the card, so a click anywhere on the card opens it. The link's name is the title. A linked card holds no other control: leave CardAction out, and put nothing that takes a click or focus in its content. */
  link?:
    | ReactElement<{
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
};

/** The card's title. A div by default, which chooses no heading level: set the heading with `render={<h2 />}`, or compose one inside. With `link`, the title's text is the card's one link. */
export function CardTitle({ className, render, ref, link, children, ...props }: CardTitleProps) {
  // `static` keeps the overlay stretched over the card when the link is a positioned part.
  const linked = useRender({
    defaultTagName: "a",
    render: link,
    enabled: Boolean(link),
    props: {
      className:
        "static rounded-xsmall outline-none after:absolute after:inset-0 after:rounded-large hover:underline focus-visible:underline focus-visible:after:outline-field-focused",
      children,
      ...{ "data-slot": "card-link" },
    },
  });
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: mergeProps<"div">(props, {
      ...{ "data-slot": "card-title" },
      className: cn(
        "col-span-full min-w-0 break-words font-heading-xsmall text-default @3xs/card-header:col-auto",
        className,
      ),
      children: link ? linked : children,
    }),
  });
}

export type CardDescriptionProps = ComponentProps<"div">;
export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      {...props}
      data-slot="card-description"
      className={cn(
        "col-span-full min-w-0 font-body text-subtle @3xs/card-header:col-auto",
        className,
      )}
    />
  );
}

export type CardActionProps = ComponentProps<"div">;
/** At the end of the title's row while the card is about 18rem wide or more (about 17.5rem at `size="small"`) and the title keeps its readable measure beside it; in a narrower card, such as one in a rail, or when the action is too wide for that measure, its own row after the description, at the end. Several controls wrap rather than overflow. */
export function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      {...props}
      data-slot="card-action"
      className={cn(
        "col-span-full flex max-w-full flex-wrap items-center justify-end justify-self-end gap-100 pt-100 @3xs/card-header:col-start-2 @3xs/card-header:row-span-2 @3xs/card-header:row-start-1 @3xs/card-header:pt-0",
        className,
      )}
    />
  );
}

export type CardContentProps = ComponentProps<"div">;
export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      {...props}
      data-slot="card-content"
      className={cn("min-w-0 px-200 group-data-[size=small]/card:px-150", className)}
    />
  );
}

export type CardFooterProps = ComponentProps<"div">;
export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      {...props}
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-100 border-default px-200 [&.border-t]:pt-200 group-data-[size=small]/card:px-150 group-data-[size=small]/card:[&.border-t]:pt-150",
        className,
      )}
    />
  );
}
