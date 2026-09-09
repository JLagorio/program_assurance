import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

export type AlertProps = ComponentProps<"div"> & {
  variant?: "default" | "destructive" | undefined;
  /** Ledger visual meaning; overrides the variant's neutral/danger tone. */
  tone?: Tone | undefined;
};

/** Inline feedback. Compose content explicitly; override role for a passive note or status update. */
export function Alert({ className, variant = "default", tone, ...props }: AlertProps) {
  const resolvedTone = tone ?? (variant === "destructive" ? "danger" : "neutral");
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-tone={resolvedTone}
      role="alert"
      className={cn(
        // eslint-disable-next-line ledger/no-arbitrary-value -- The icon column sizes to content; it is structural, not a design-token dimension.
        "group/alert relative grid min-w-0 gap-075 rounded-medium px-150 py-100 text-start font-body has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-100 [&>svg]:row-span-2 [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-icon-medium",
        toneClasses[resolvedTone].subtle,
        className,
      )}
      {...props}
    />
  );
}

export type AlertTitleProps = ComponentProps<"div">;
export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "flex min-w-0 items-start gap-100 break-words font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export type AlertDescriptionProps = ComponentProps<"div">;
export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "min-w-0 break-words group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

/** Ledger keeps actions in normal flow so long recovery links fit narrow panels. */
export type AlertActionProps = ComponentProps<"div">;
export function AlertAction({ className, ...props }: AlertActionProps) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-100 group-has-[>svg]/alert:col-start-2",
        className,
      )}
      {...props}
    />
  );
}
