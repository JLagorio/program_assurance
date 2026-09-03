import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { toneClasses } from "./badge";

export type BannerTone = "information" | "warning" | "danger";

const icons: Record<BannerTone, ComponentType<{ className?: string | undefined }>> = {
  information: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export type BannerProps = {
  tone?: BannerTone | undefined;
  /** Replaces the tone's icon. */
  icon?: ComponentType<{ className?: string | undefined }> | undefined;
  /** One link or button, rendered in the banner's own colour: an anchor, a button, or the router's Link. */
  action?: ReactElement<{ className?: string | undefined }> | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * A site-wide message at the top of the screen, in the shell's Banner area: the loss of data or a
 * function, or something about the whole site that changes what the reader can do. One at a time,
 * never dismissible, gone when no longer true. It truncates rather than wraps, so it is one line.
 */
export function Banner({ tone = "warning", icon, action, className, children }: BannerProps) {
  const Icon = icon ?? icons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex h-layout-banner items-center justify-center gap-100 px-200 font-body font-medium",
        toneClasses[tone].bold,
        className,
      )}
    >
      <Icon className="size-icon-small shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
      {action && isValidElement(action)
        ? cloneElement(action, {
            className: cn(
              action.props.className,
              "shrink-0 rounded-xsmall underline underline-offset-2 outline-none focus-visible:outline-focused",
              tone === "warning" ? "text-warning-inverse" : "text-inverse",
            ),
          })
        : null}
    </div>
  );
}
