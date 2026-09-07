import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { Button, IconButton, type ButtonProps, type IconButtonProps } from "./button";

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
export type AttachmentTitleProps = ComponentProps<"span">;
export type AttachmentDescriptionProps = ComponentProps<"span">;
export type AttachmentActionsProps = ComponentProps<"div">;
/** IconButton's required label, tooltip, loading, disabled and slotted-element behavior. */
export type AttachmentActionProps = IconButtonProps;
type TriggerProps<Props> = Props extends unknown
  ? Omit<
      Props,
      "variant" | "size" | "iconBefore" | "iconAfter" | "isSelected" | "isFullWidth" | "isLoading"
    >
  : never;
/** A button, or asChild around a link. Supply aria-label or aria-labelledby; the overlay has no visible label. */
export type AttachmentTriggerProps = TriggerProps<ButtonProps>;
export type AttachmentGroupProps = ComponentProps<"div">;

const sizes: Record<AttachmentSize, string> = {
  xsmall: "gap-075 p-075 font-body-small",
  small: "gap-100 p-100 font-body-small",
  medium: "gap-150 p-150 font-body",
};

function AttachmentRoot({
  state = "done",
  size = "medium",
  orientation = "horizontal",
  className,
  ...props
}: AttachmentProps) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      aria-busy={state === "uploading" || state === "processing" ? true : undefined}
      className={cn(
        "group/attachment relative isolate flex max-w-full min-w-0 shrink-0 rounded-medium border border-default bg-surface-raised text-default",
        "data-[state=idle]:border-dashed data-[state=error]:border-danger",
        sizes[size],
        orientation === "vertical" ? "w-layout-rail flex-col" : "w-fit items-center",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentMedia({ variant = "icon", className, ...props }: AttachmentMediaProps) {
  return (
    <div
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
      {...props}
    />
  );
}

function AttachmentContent({ className, ...props }: AttachmentContentProps) {
  return (
    <div
      data-slot="attachment-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-025", className)}
      {...props}
    />
  );
}

function AttachmentTitle({ className, ...props }: AttachmentTitleProps) {
  return (
    <span
      data-slot="attachment-title"
      className={cn("block min-w-0 truncate font-medium", className)}
      {...props}
    />
  );
}

function AttachmentDescription({ className, ...props }: AttachmentDescriptionProps) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        "block min-w-0 break-words font-body-small text-subtle group-data-[state=error]/attachment:text-danger",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentActions({ className, ...props }: AttachmentActionsProps) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 flex-wrap items-center gap-050 group-data-[orientation=vertical]/attachment:self-end",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentAction({ variant = "subtle", size = "small", ...props }: AttachmentActionProps) {
  return <IconButton data-slot="attachment-action" variant={variant} size={size} {...props} />;
}

function AttachmentTrigger({ className, ...props }: AttachmentTriggerProps) {
  return (
    <Button
      data-slot="attachment-trigger"
      variant="subtle"
      className={cn(
        "absolute inset-0 z-10 h-full w-full rounded-medium bg-transparent p-0 hover:bg-transparent active:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentGroup({ className, ...props }: AttachmentGroupProps) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        "flex min-w-0 snap-x snap-proximity scroll-px-050 gap-150 overflow-x-auto p-050 focus-visible:outline-focused",
        "[&>[data-slot=attachment]]:flex-none [&>[data-slot=attachment]]:snap-start",
        className,
      )}
      {...props}
    />
  );
}

/** One file's presentation. Compose media, metadata and independent controls; selection, upload and preview remain caller-owned. */
export const Attachment = Object.assign(AttachmentRoot, {
  Media: AttachmentMedia,
  Content: AttachmentContent,
  Title: AttachmentTitle,
  Description: AttachmentDescription,
  Actions: AttachmentActions,
  Action: AttachmentAction,
  Trigger: AttachmentTrigger,
  Group: AttachmentGroup,
});
