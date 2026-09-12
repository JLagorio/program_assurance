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
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // Structural tracks keep a long title shrinkable beside an intrinsic-width action.
        // eslint-disable-next-line ledger/no-arbitrary-value
        "grid auto-rows-min items-start gap-x-200 gap-y-025 border-default px-200 [&.border-b]:pb-200 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] group-data-[size=sm]/card:px-150 group-data-[size=sm]/card:[&.border-b]:pb-150",
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
      className={cn("min-w-0 font-heading-xsmall text-default", className)}
      {...props}
    />
  );
}

export type CardDescriptionProps = ComponentProps<"div">;
export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn("min-w-0 font-body text-subtle", className)}
      {...props}
    />
  );
}

export type CardActionProps = ComponentProps<"div">;
export function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 flex shrink-0 items-center justify-self-end gap-100",
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
