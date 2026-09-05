import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Dot, toneClasses, type Tone } from "./badge";

export type AlertProps = {
  /** The status the message carries: it sets the fill, the text and the Dot. `warning` is the default. */
  tone?: Tone | undefined;
  /** One line in the tone's colour after the Dot: what is wrong or what changed. Omit it for a one-sentence note. */
  title?: ReactNode;
  /** The body, one or two sentences: what it means and what to do. */
  children?: ReactNode;
  /** The one thing that resolves it, under the body: a TextLink or a link Button, drawn in the alert's own colour and underlined, as the Banner draws its action. */
  action?: ReactElement<{ className?: string | undefined }> | undefined;
  className?: string | undefined;
};

/**
 * A tinted callout in a rail or above a table: a Dot, a title in the tone's colour, an optional
 * body and one action. It loads with the page and is not dismissed; it goes when it is no longer
 * true. Feedback after an act is a toast, and a message about the whole site is a Banner.
 */
export function Alert({ tone = "warning", title, children, action, className }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-075 rounded-medium px-150 py-100 font-body",
        toneClasses[tone].subtle,
        className,
      )}
    >
      {title ? (
        <div className="flex items-start gap-100 font-medium">
          <span className="flex h-250 items-center">
            <Dot tone={tone} />
          </span>
          <span className="min-w-0">{title}</span>
        </div>
      ) : null}
      {children ? <div>{children}</div> : null}
      {action && isValidElement(action) ? (
        <div className="flex items-center gap-150">
          {cloneElement(action, {
            className: cn(action.props.className, toneClasses[tone].text, "underline"),
          })}
        </div>
      ) : null}
    </div>
  );
}
