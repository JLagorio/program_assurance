import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { classes } from "../lib/base-ui";
import {
  Button,
  IconButton,
  buttonVariants,
  type ButtonProps,
  type IconButtonProps,
} from "./button";

export type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done";
export type AttachmentSize = "xsmall" | "small" | "medium";
export type AttachmentProps = ComponentProps<"div"> & {
  /** Caller-owned lifecycle. Changes appearance and aria-busy; performs no file operations. */
  state?: AttachmentState | undefined;
  /** Padding, typography and media size. Does not hide metadata or shrink action targets. */
  size?: AttachmentSize | undefined;
  /** Media beside the content, or above it. */
  orientation?: "horizontal" | "vertical" | undefined;
};
export type AttachmentMediaProps = ComponentProps<"div"> & {
  /** An icon container or a cropped image preview. Supply the media and its alternative text. */
  variant?: "icon" | "image" | undefined;
};
export type AttachmentContentProps = ComponentProps<"div">;
export type AttachmentTitleProps = ComponentProps<"span"> & {
  /**
   * Where a name too long for the card is cut. `middle`, the default, keeps the end of a plain-text
   * name in view (its extension and the ten characters before it), so
   * `scan-report-2026-09-01.pdf` and `scan-report-2026-09-15.pdf` stay apart; `end` cuts at the
   * end. A name composed of elements always cuts at the end. Either way the whole name is read.
   */
  truncate?: "middle" | "end" | undefined;
};
export type AttachmentDescriptionProps = ComponentProps<"span">;
export type AttachmentActionsProps = ComponentProps<"div">;
/** IconButton's required label, tooltip, loading, disabled and render composition. */
export type AttachmentActionProps = IconButtonProps;
type TriggerProps<Props> = Props extends unknown
  ? Omit<
      Props,
      "variant" | "size" | "iconBefore" | "iconAfter" | "isSelected" | "isFullWidth" | "isLoading"
    >
  : never;
/** A card-wide action button. Supply aria-label or aria-labelledby; the overlay has no visible label. */
export type AttachmentTriggerProps = TriggerProps<ButtonProps>;
/**
 * A card-wide link: an anchor, or a router link through `render`, with the Trigger's overlay.
 * Supply `aria-label` ("Download quarterly-report.pdf"); the overlay has no visible label. `href`,
 * `download`, `target` and `rel` are the anchor's own.
 */
export type AttachmentLinkProps = useRender.ComponentProps<"a">;
export type AttachmentGroupProps = ComponentProps<"div">;

const sizes: Record<AttachmentSize, string> = {
  xsmall: "gap-075 p-075 font-body-small",
  small: "gap-100 p-100 font-body-small",
  medium: "gap-150 p-150 font-body",
};

/* The card answers its card-wide action: the raised hover surface while the Trigger or Link is
   hovered (a pointer that can hover only, so a tap does not leave it lit), the pressed surface while
   it is pressed, and nothing for a disabled Trigger. An action in Actions sits above the overlay,
   so hovering it leaves the card at rest. */
const answersOverlay = [
  "[@media(hover:hover)]:has-[[data-slot=attachment-trigger]:not([data-disabled]):hover]:bg-surface-raised-hovered",
  "has-[[data-slot=attachment-trigger]:not([data-disabled]):active]:bg-surface-raised-pressed",
  "[@media(hover:hover)]:has-[[data-slot=attachment-link]:hover]:bg-surface-raised-hovered",
  "has-[[data-slot=attachment-link]:active]:bg-surface-raised-pressed",
];

function AttachmentRoot({
  state = "done",
  size = "medium",
  orientation = "horizontal",
  className,
  ...props
}: AttachmentProps) {
  return (
    <div
      aria-busy={state === "uploading" || state === "processing" ? true : undefined}
      {...props}
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={cn(
        "group/attachment relative isolate flex max-w-full min-w-0 shrink-0 rounded-medium border border-default bg-surface-raised text-default transition-colors duration-fast ease-standard motion-reduce:transition-none",
        "data-[state=idle]:border-dashed data-[state=error]:border-danger",
        answersOverlay,
        sizes[size],
        orientation === "vertical" ? "w-layout-rail flex-col" : "w-fit items-center",
        className,
      )}
    />
  );
}

function AttachmentMedia({ variant = "icon", className, ...props }: AttachmentMediaProps) {
  return (
    <div
      {...props}
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(
        "flex aspect-square size-500 shrink-0 items-center justify-center overflow-hidden rounded-small bg-surface-sunken icon-subtle",
        "group-data-[size=small]/attachment:size-400 group-data-[size=xsmall]/attachment:size-300",
        "group-data-[orientation=vertical]/attachment:h-auto group-data-[orientation=vertical]/attachment:w-full",
        "group-data-[state=error]/attachment:icon-danger [&>svg]:size-icon-medium [&>svg]:shrink-0",
        variant === "image" && "[&>img]:size-full [&>img]:object-cover",
        className,
      )}
    />
  );
}

function AttachmentContent({ className, ...props }: AttachmentContentProps) {
  return (
    <div
      {...props}
      data-slot="attachment-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-025", className)}
    />
  );
}

/** How much of the end of a name the middle cut keeps: the extension and ten characters before it, never more than half. */
function splitName(name: string): [head: string, tail: string] {
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 && name.length - dot <= 10 ? name.length - dot : 0;
  const keep = Math.min(extension + 10, Math.floor(name.length / 2));
  return [name.slice(0, name.length - keep), name.slice(name.length - keep)];
}

function AttachmentTitle({
  truncate = "middle",
  className,
  children,
  ...props
}: AttachmentTitleProps) {
  if (truncate === "end" || typeof children !== "string")
    return (
      <span
        {...props}
        data-slot="attachment-title"
        className={cn("block min-w-0 truncate font-medium", className)}
      >
        {children}
      </span>
    );
  const [head, tail] = splitName(children);
  const { onCopy } = props;
  // The eye gets the name in two pieces, the start cut with an ellipsis and the end kept whole;
  // assistive technology gets it once, unbroken. `dir="auto"` keeps a name's own direction, so the
  // kept end stays at the end of an English name on a right-to-left page. The spoken copy is not
  // selectable, so a selection holds the name once, from the visible pieces.
  return (
    <span
      {...props}
      data-slot="attachment-title"
      data-truncate="middle"
      className={cn("flex min-w-0 font-medium", className)}
      onCopy={(event) => {
        onCopy?.(event);
        if (event.defaultPrevented) return;
        // The pieces are flex items, so the browser's copy puts a line break between them. A
        // selection that stays inside the title copies the name as it is written.
        const title = event.currentTarget;
        const selection = title.ownerDocument.getSelection();
        if (!selection || selection.isCollapsed) return;
        if (!title.contains(selection.anchorNode) || !title.contains(selection.focusNode)) return;
        event.preventDefault();
        event.clipboardData.setData("text/plain", selection.toString().replace(/\n/g, ""));
      }}
    >
      <span className="sr-only select-none">{children}</span>
      <span aria-hidden="true" dir="auto" className="flex min-w-0">
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-pre">{head}</span>
        <span className="shrink-0 whitespace-pre">{tail}</span>
      </span>
    </span>
  );
}

function AttachmentDescription({ className, ...props }: AttachmentDescriptionProps) {
  return (
    <span
      {...props}
      data-slot="attachment-description"
      className={cn(
        "block min-w-0 break-words font-body-small text-subtle group-data-[state=error]/attachment:text-danger",
        className,
      )}
    />
  );
}

function AttachmentActions({ className, ...props }: AttachmentActionsProps) {
  return (
    <div
      {...props}
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 flex-wrap items-center gap-050 group-data-[orientation=vertical]/attachment:self-end",
        className,
      )}
    />
  );
}

function AttachmentAction({ variant = "subtle", size = "small", ...props }: AttachmentActionProps) {
  return <IconButton variant={variant} size={size} {...props} data-slot="attachment-action" />;
}

/** The overlay a card-wide Trigger or Link draws: the whole card, above the content, below Actions. */
const overlay =
  "absolute inset-0 z-10 h-full w-full rounded-medium bg-transparent p-0 hover:bg-transparent active:bg-transparent";

function AttachmentTrigger({ className, ...props }: AttachmentTriggerProps) {
  return (
    <Button
      variant="subtle"
      {...props}
      data-slot="attachment-trigger"
      className={classes(overlay, className)}
    />
  );
}

function AttachmentLink({ render, className, ref, ...props }: AttachmentLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    state: { slot: "attachment-link" },
    props: mergeProps<"a">(props, {
      className: buttonVariants({ variant: "subtle", className: cn(overlay, className) }),
    }),
  });
}

function AttachmentGroup({ className, ...props }: AttachmentGroupProps) {
  return (
    <div
      {...props}
      data-slot="attachment-group"
      className={cn(
        "flex min-w-0 snap-x snap-proximity scroll-px-050 gap-150 overflow-x-auto p-050 focus-visible:outline-focused",
        "[&>[data-slot=attachment]]:flex-none [&>[data-slot=attachment]]:snap-start",
        className,
      )}
    />
  );
}

export {
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentLink,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};

/** One file's presentation. Compose media, metadata and independent controls; selection, upload and preview remain caller-owned. */
export const Attachment = Object.assign(AttachmentRoot, {
  Media: AttachmentMedia,
  Content: AttachmentContent,
  Title: AttachmentTitle,
  Description: AttachmentDescription,
  Actions: AttachmentActions,
  Action: AttachmentAction,
  Trigger: AttachmentTrigger,
  Link: AttachmentLink,
  Group: AttachmentGroup,
});

const sizeUnits = ["kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"] as const;

export type FormatFileSizeOptions = {
  /** BCP 47 locale. en-US by default, never the host's; pass `useLedgerLocale().locale` in a component. */
  locale?: string | undefined;
};

/**
 * A byte count as a reader says it: "512 bytes", "840 kB", "2.4 MB". Decimal units (1 kB is 1,000
 * bytes), as the units' names mean and as macOS and iOS report sizes, with at most one decimal, in
 * the locale's numerals. Express a limit in the same units (`50_000_000` for 50 MB) so a message
 * and a hint agree.
 */
export function formatFileSize(bytes: number, { locale = "en-US" }: FormatFileSizeOptions = {}) {
  const count = Number.isFinite(bytes) ? Math.max(0, Math.round(bytes)) : 0;
  if (count < 1000)
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(count);
  let value = count / 1000;
  let unit = 0;
  // Step up while the rounded value would read 1,000 of this unit.
  while (Math.round(value * 10) / 10 >= 1000 && unit < sizeUnits.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: sizeUnits[unit],
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}
