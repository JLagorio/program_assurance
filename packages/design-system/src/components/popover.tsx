import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { ComponentProps } from "react";

import { token } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { overlaySurface } from "./overlay";

export type PopoverProps<Payload = unknown> = PopoverPrimitive.Root.Props<Payload>;

export function Popover<Payload = unknown>(props: PopoverProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <PopoverPrimitive.Root {...props} />
    </DirectionProvider>
  );
}

export type PopoverTriggerProps<Payload = unknown> = PopoverPrimitive.Trigger.Props<Payload>;

export function PopoverTrigger<Payload = unknown>(props: PopoverTriggerProps<Payload>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "anchor"
    | "collisionAvoidance"
    | "collisionBoundary"
    | "collisionPadding"
    | "positionMethod"
    | "sticky"
  >;

/**
 * The popup, with its portal and positioner. Beside the four placement props it takes the
 * positioner's `anchor` (an element, a ref or a virtual point, such as a chart mark), and
 * `collisionPadding`, `collisionBoundary`, `collisionAvoidance`, `sticky` and `positionMethod`.
 * It is capped at the height the window leaves on its side, and scrolls within it.
 */
export function PopoverContent({
  className,
  style,
  dir,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding,
  positionMethod,
  sticky,
  ...props
}: PopoverContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  // The overlay surface is recorded as the current one, so a child that matches its surface
  // (a sticky header, a pinned cell) paints the popup's colour.
  const defaults = {
    ...overlaySurface,
    width: token("dimension.part.popover"),
    maxWidth: "var(--available-width)",
    // Tall content (a calendar, a long list of filters) never opens past the window's edge.
    maxHeight: "var(--available-height)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <PopoverPrimitive.Portal data-slot="popover-portal">
        <PopoverPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          anchor={anchor}
          collisionAvoidance={collisionAvoidance}
          collisionBoundary={collisionBoundary}
          collisionPadding={collisionPadding}
          positionMethod={positionMethod}
          sticky={sticky}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="popover-content"
            dir={dir ?? direction}
            className={classes(
              "flex flex-col gap-100 overflow-y-auto rounded-large border border-default bg-surface-overlay p-150 font-body-small text-default shadow-overlay outline-none data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none",
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
          />
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </DirectionProvider>
  );
}

export type PopoverHeaderProps = ComponentProps<"div">;

export function PopoverHeader({ className, ...props }: PopoverHeaderProps) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-025 font-body-small", className)}
      {...props}
    />
  );
}

export type PopoverTitleProps = PopoverPrimitive.Title.Props;

export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={classes("font-medium", className)}
      {...props}
    />
  );
}

export type PopoverDescriptionProps = PopoverPrimitive.Description.Props;

export function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={classes("text-subtle", className)}
      {...props}
    />
  );
}

export type PopoverCloseProps = PopoverPrimitive.Close.Props;

export function PopoverClose(props: PopoverCloseProps) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}
