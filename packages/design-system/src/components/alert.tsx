import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Dot, toneClasses, type Tone } from "./badge";

export type AlertProps = Omit<ComponentProps<"div">, "title"> & {
  /** Visual meaning only. Defaults to warning; use role/aria-live to choose announcement behavior explicitly. */
  tone?: Tone | undefined;
  /** Optional shorthand for Alert.Title. Omit title/action to compose the parts directly. */
  title?: ReactNode;
  /** Shorthand action content, rendered unchanged in Alert.Action. Buttons and links keep their own styles and handlers. */
  action?: ReactNode;
  /** Decorative mark beside a shorthand title. Defaults to Dot; null removes it. In compound usage, compose a mark into Alert.Title. */
  icon?: ReactNode;
};

/** Native div props and ref target the title. Use role="heading" and aria-level when it belongs in the page outline. */
export type AlertTitleProps = ComponentProps<"div">;
/** Native div props and ref target the description; supports paragraphs, lists and links. */
export type AlertDescriptionProps = ComponentProps<"div">;
/** Native div props and ref target the action container; children retain their own appearance and behavior. */
export type AlertActionProps = ComponentProps<"div">;

function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      data-slot="alert-title"
      className={cn("flex min-w-0 items-start gap-100 break-words font-medium", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn("min-w-0 break-words", className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: AlertActionProps) {
  return (
    <div
      data-slot="alert-action"
      className={cn("flex min-w-0 flex-wrap items-center gap-100", className)}
      {...props}
    />
  );
}

function AlertRoot({
  tone = "warning",
  title,
  children,
  action,
  icon,
  className,
  role,
  ...props
}: AlertProps) {
  const hasTitle = title !== undefined && title !== null && title !== false;
  const hasBody = children !== undefined && children !== null && children !== false;
  const hasAction = action !== undefined && action !== null && action !== false;
  return (
    <div
      data-slot="alert"
      data-tone={tone}
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn(
        "flex min-w-0 flex-col gap-075 rounded-medium px-150 py-100 font-body",
        toneClasses[tone].subtle,
        className,
      )}
      {...props}
    >
      {hasTitle ? (
        <AlertTitle>
          {icon !== null ? (
            <span aria-hidden="true" className="flex h-250 shrink-0 items-center">
              {icon === undefined ? <Dot tone={tone} /> : icon}
            </span>
          ) : null}
          <span className="min-w-0 break-words">{title}</span>
        </AlertTitle>
      ) : null}
      {hasTitle || hasAction ? (
        hasBody ? (
          <AlertDescription>{children}</AlertDescription>
        ) : null
      ) : (
        children
      )}
      {hasAction ? <AlertAction>{action}</AlertAction> : null}
    </div>
  );
}

/** Inline callout with optional title/action shorthand or explicit Title, Description and Action parts. No dismissal or action state is imposed. Native root attributes and ref are forwarded. */
export const Alert = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Description: AlertDescription,
  Action: AlertAction,
});
