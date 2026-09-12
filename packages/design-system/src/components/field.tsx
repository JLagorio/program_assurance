import { useMemo, type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";
import { Separator } from "./separator";

export type FieldSetProps = ComponentProps<"fieldset">;
export function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("flex min-w-0 flex-col gap-100", className)}
      {...props}
    />
  );
}

export type FieldLegendProps = ComponentProps<"legend"> & {
  variant?: "legend" | "label" | undefined;
};
export function FieldLegend({ className, variant = "legend", ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "font-medium text-subtle",
        variant === "label" ? "font-body-small" : "font-body",
        className,
      )}
      {...props}
    />
  );
}

export type FieldGroupProps = ComponentProps<"div">;
export function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full min-w-0 flex-col gap-200 data-[slot=checkbox-group]:gap-150",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex min-w-0 gap-050", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal:
        "flex-row items-center gap-100 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto",
      responsive:
        "flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-100 @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

/** Layout only. Associate labels and descriptions with the actual control using native attributes. */
export type FieldProps = ComponentProps<"div"> & VariantProps<typeof fieldVariants>;
export function Field({ className, orientation = "vertical", ...props }: FieldProps) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

export type FieldContentProps = ComponentProps<"div">;
export function FieldContent({ className, ...props }: FieldContentProps) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex min-w-0 flex-1 flex-col gap-025", className)}
      {...props}
    />
  );
}

/** The native label used by shadcn's Base UI Field family. */
export type FieldLabelProps = ComponentProps<"label">;
export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit items-center gap-050 font-body-small font-medium text-subtle group-data-[invalid=true]/field:text-danger group-data-[disabled=true]/field:text-disabled peer-disabled:cursor-not-allowed peer-disabled:text-disabled peer-aria-disabled:cursor-not-allowed peer-aria-disabled:text-disabled",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:items-stretch has-[>[data-slot=field]]:rounded-medium has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-default has-[>[data-slot=field]]:p-150 has-[>[data-slot=field]]:transition-colors has-[>[data-slot=field]]:duration-fast has-[>[data-slot=field]]:ease-standard has-[>[data-slot=field]]:not-has-[:disabled,[aria-disabled=true]]:hover:bg-neutral-subtle-hovered has-[>[data-slot=field]]:has-[:focus-visible]:outline-focused has-[>[data-slot=field]]:has-data-checked:border-selected has-[>[data-slot=field]]:has-data-checked:bg-selected has-[>[data-slot=field]]:has-data-checked:not-has-[:disabled,[aria-disabled=true]]:hover:bg-selected-hovered has-[>[data-slot=field][data-invalid=true]]:border-danger",
        "has-[>[data-slot=field]]:has-[:disabled,[aria-disabled=true]]:border-disabled has-[>[data-slot=field]]:has-[:disabled,[aria-disabled=true]]:bg-disabled has-[>[data-slot=field]]:has-[:disabled,[aria-disabled=true]]:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export type FieldTitleProps = ComponentProps<"div">;
export function FieldTitle({ className, ...props }: FieldTitleProps) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-050 font-body-small font-medium text-subtle group-data-[invalid=true]/field:text-danger group-data-[disabled=true]/field:text-disabled",
        className,
      )}
      {...props}
    />
  );
}

export type FieldDescriptionProps = ComponentProps<"p">;
export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "font-body-small text-subtlest text-start group-has-data-checked/field-label:not-group-data-[disabled=true]/field:text-selected [&>a]:underline [&>a]:underline-offset-2 [&>a:hover]:text-default",
        className,
      )}
      {...props}
    />
  );
}

export type FieldSeparatorProps = ComponentProps<"div">;
export function FieldSeparator({ children, className, ...props }: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn("flex min-h-250 items-center gap-100 font-body-small", className)}
      {...props}
    >
      <Separator isDecorative className="min-w-0 flex-1" />
      {children && (
        <span data-slot="field-separator-content" className="min-w-0 text-center text-subtlest">
          {children}
        </span>
      )}
      {children && <Separator isDecorative className="min-w-0 flex-1" />}
    </div>
  );
}

export type FieldErrorProps = ComponentProps<"div"> & {
  errors?: Array<{ message?: string | undefined } | undefined> | undefined;
};
export function FieldError({ className, children, errors, ...props }: FieldErrorProps) {
  const content = useMemo(() => {
    if (children) return children;
    const messages = [...new Set(errors?.map((error) => error?.message).filter(Boolean))];
    if (!messages.length) return null;
    if (messages.length === 1) return messages[0];
    return (
      <ul className="flex list-disc flex-col gap-025 ps-200">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    );
  }, [children, errors]);
  if (!content) return null;
  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("font-body-small text-danger", className)}
      {...props}
    >
      {content}
    </div>
  );
}
