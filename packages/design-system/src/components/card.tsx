import type { ComponentProps, CSSProperties } from "react";

import { cn } from "../lib/cn";

/** The surface read by children such as sticky table headers. */
export const raisedSurface = {
  "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-raised)",
} as CSSProperties;

export type CardProps = ComponentProps<"div"> & { size?: "default" | "sm" | undefined };

export function Card({ className, style, size = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex min-w-0 flex-col gap-200 overflow-hidden rounded-large border border-default bg-surface-raised py-200 data-[size=sm]:gap-150 data-[size=sm]:py-150",
        className,
      )}
      style={{ ...raisedSurface, ...style }}
      {...props}
    />
  );
}

export type CardHeaderProps = ComponentProps<"div">;
/** The title, then the description, with a CardAction at the end of the title's row. The header reads its own width, not the window's: the action sits beside the title while the header has 16rem inside its inset, that is while the card is about 18rem wide or more (about 17.5rem at `size="sm"`), as a full-width card on a 340px phone is. In a narrower card, such as one in a rail or a full-width card on a 320px phone, the action takes its own row after the description, at the end. */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // Structural tracks keep a long title shrinkable beside an intrinsic-width action. Only a
        // header with an action is a container, so a header without one keeps its intrinsic width.
        // eslint-disable-next-line ledger/no-arbitrary-value
        "grid auto-rows-min items-start gap-x-200 gap-y-025 border-default px-200 [&.border-b]:pb-200 has-data-[slot=card-action]:@container/card-header has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] group-data-[size=sm]/card:px-150 group-data-[size=sm]/card:[&.border-b]:pb-150",
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = ComponentProps<"div">;
export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "col-span-full min-w-0 break-words font-heading-xsmall text-default @3xs/card-header:col-auto",
        className,
      )}
      {...props}
    />
  );
}

export type CardDescriptionProps = ComponentProps<"div">;
export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "col-span-full min-w-0 font-body text-subtle @3xs/card-header:col-auto",
        className,
      )}
      {...props}
    />
  );
}

export type CardActionProps = ComponentProps<"div">;
/** At the end of the title's row while the card is about 18rem wide or more (about 17.5rem at `size="sm"`); in a narrower card, such as one in a rail, its own row after the description, at the end. Several controls wrap rather than overflow. */
export function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-span-full flex max-w-full flex-wrap items-center justify-end justify-self-end gap-100 pt-100 @3xs/card-header:col-start-2 @3xs/card-header:row-span-2 @3xs/card-header:row-start-1 @3xs/card-header:pt-0",
        className,
      )}
      {...props}
    />
  );
}

export type CardContentProps = ComponentProps<"div">;
export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0 px-200 group-data-[size=sm]/card:px-150", className)}
      {...props}
    />
  );
}

export type CardFooterProps = ComponentProps<"div">;
export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-100 border-default px-200 [&.border-t]:pt-200 group-data-[size=sm]/card:px-150 group-data-[size=sm]/card:[&.border-t]:pt-150",
        className,
      )}
      {...props}
    />
  );
}
