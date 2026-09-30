import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { toneClasses } from "./badge";

export type BannerTone = "information" | "warning" | "danger";

const icons: Record<BannerTone, ComponentType<{ className?: string | undefined }>> = {
  information: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export type BannerProps = ComponentProps<"div"> & {
  /** `information` for something that changed, `warning` for something about to, `danger` for something lost. `warning` is the default; there is no success banner. */
  tone?: BannerTone | undefined;
  /** Replaces the tone's icon. */
  icon?: ComponentType<{ className?: string | undefined }> | undefined;
  /** One link or button, rendered in the banner's own colour: an anchor, a button, or the router's Link. */
  action?: ReactElement<{ className?: string | undefined }> | undefined;
  /** The message, one sentence. On a wide bar it is one line and truncates, with the whole message as its title; on a narrow one (a phone) it wraps, with the action after its last word. */
  children: ReactNode;
};

/** Gives the message its whole text as a title while the bar cuts it, and takes the title away when it fits. */
function useCutTitle(ref: RefObject<HTMLSpanElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const sync = () => {
      const cut = el.scrollWidth > el.clientWidth + 1;
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (cut && text) el.setAttribute("title", text);
      else el.removeAttribute("title");
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  });
}

/**
 * A site-wide message at the top of the screen, in the shell's Banner area: the loss of data or a
 * function, or something about the whole site that changes what the reader can do. One at a time,
 * never dismissible, gone when no longer true. On a bar 42rem wide or more it is one 48px line
 * that truncates; narrower, on a phone, the message wraps and the bar grows with it.
 */
export function Banner({
  tone = "warning",
  icon,
  action,
  className,
  children,
  ...props
}: BannerProps) {
  const Icon = icon ?? icons[tone];
  const message = useRef<HTMLSpanElement>(null);
  useCutTitle(message);
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      {...props}
      data-slot="banner"
      className={cn(
        // The bar is its own container: its width, not the window's, decides one line or several.
        "@container/banner w-full px-200 font-body font-medium",
        toneClasses[tone].bold,
        className,
      )}
    >
      <span
        data-slot="banner-bar"
        className="flex min-h-layout-banner items-start gap-100 py-100 @2xl/banner:items-center @2xl/banner:justify-center @2xl/banner:py-0"
      >
        {/* The icon sits on the first line's centre however many lines the message takes. */}
        <span aria-hidden="true" className="flex h-250 shrink-0 items-center">
          <Icon aria-hidden="true" className="size-icon-small shrink-0" />
        </span>
        <span
          data-slot="banner-content"
          className="block min-w-0 @2xl/banner:flex @2xl/banner:items-center @2xl/banner:gap-100"
        >
          <span
            ref={message}
            data-slot="banner-message"
            className="@2xl/banner:block @2xl/banner:min-w-0 @2xl/banner:truncate"
          >
            {children}
          </span>
          {action && isValidElement(action) ? (
            <>
              {" "}
              {cloneElement(action, {
                className: cn(
                  action.props.className,
                  "shrink-0 rounded-xsmall px-050 underline underline-offset-2 outline-none transition-colors duration-fast ease-standard hover:bg-inverse-subtle-hovered active:bg-inverse-subtle-pressed focus-visible:outline-focused",
                  tone === "warning" ? "text-warning-inverse" : "text-inverse",
                ),
              })}
            </>
          ) : null}
        </span>
      </span>
    </div>
  );
}
