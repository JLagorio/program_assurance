import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type EmptySize = "default" | "compact";
export type EmptyProps = ComponentProps<"div"> & { size?: EmptySize | undefined };

/** An empty region. Compose its message and actions with the exported parts. */
export function Empty({ size = "default", className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      className={cn(
        "group/empty min-w-0",
        size === "compact"
          ? // Structural tracks let text shrink beside intrinsic-width media.
            // eslint-disable-next-line ledger/no-arbitrary-value
            "grid items-center gap-x-150 gap-y-025 has-data-[slot=empty-icon]:grid-cols-[auto_minmax(0,1fr)]"
          : "flex flex-col items-start gap-075 rounded-large border border-dashed border-default px-200 py-300",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyHeaderProps = ComponentProps<"div">;
export function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex min-w-0 flex-col gap-075 group-data-[size=compact]/empty:gap-025",
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center group-data-[size=compact]/empty:row-span-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        icon: "size-500 rounded-full bg-neutral icon-subtle [&_svg:not([class*='size-'])]:size-icon-medium group-data-[size=compact]/empty:size-400 group-data-[size=compact]/empty:[&_svg:not([class*='size-'])]:size-icon-small",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type EmptyMediaProps = ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>;
export function EmptyMedia({ variant = "default", className, ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

export type EmptyTitleProps = ComponentProps<"div">;
export function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  return (
    <div
      data-slot="empty-title"
      className={cn("font-body font-medium text-default", className)}
      {...props}
    />
  );
}

export type EmptyDescriptionProps = ComponentProps<"div">;
export function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <div
      data-slot="empty-description"
      className={cn("font-body-small text-subtle", className)}
      {...props}
    />
  );
}

export type EmptyContentProps = ComponentProps<"div">;
export function EmptyContent({ className, ...props }: EmptyContentProps) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-150 pt-075 group-data-[size=compact]/empty:group-has-data-[slot=empty-icon]/empty:col-start-2",
        className,
      )}
      {...props}
    />
  );
}
