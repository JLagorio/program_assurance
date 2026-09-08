import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { ComponentProps } from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { useOverlayContainer } from "./_overlay-focus";

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
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

export function PopoverContent({
  className,
  style,
  dir,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  const inheritedDirection = useDirection();
  const portal = useOverlayContainer();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const defaults = {
    width: 288,
    maxWidth: "var(--available-width)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <span hidden ref={portal.ref} />
      <PopoverPrimitive.Portal data-slot="popover-portal" container={portal.container}>
        <PopoverPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          positionMethod={portal.container ? "fixed" : undefined}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="popover-content"
            dir={dir ?? direction}
            className={classes(
              "flex flex-col gap-100 rounded-large border border-default bg-surface-overlay p-150 font-body-small text-default shadow-overlay outline-none data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none",
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
