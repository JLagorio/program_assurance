import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { useOverlayContainer } from "./_overlay-focus";

export type TooltipProviderProps = TooltipPrimitive.Provider.Props;

export function TooltipProvider({ delay = 0, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

export type TooltipProps<Payload = unknown> = TooltipPrimitive.Root.Props<Payload>;

export function Tooltip<Payload = unknown>(props: TooltipProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <TooltipPrimitive.Root {...props} />
    </DirectionProvider>
  );
}

export type TooltipTriggerProps<Payload = unknown> = TooltipPrimitive.Trigger.Props<Payload>;

export function TooltipTrigger<Payload = unknown>(props: TooltipTriggerProps<Payload>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

export function TooltipContent({
  className,
  style,
  dir,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const portal = useOverlayContainer();
  const defaults = {
    maxWidth: "min(320px, var(--available-width))",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <span hidden ref={portal.ref} />
      <TooltipPrimitive.Portal data-slot="tooltip-portal" container={portal.container}>
        <TooltipPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          positionMethod={portal.container ? "fixed" : undefined}
          className="isolate z-50"
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip-content"
            dir={dir ?? direction}
            className={classes(
              "inline-flex w-fit items-center gap-075 rounded-medium bg-neutral-bold px-100 py-050 font-body-small text-inverse shadow-overlay data-open:animate-fade-in data-closed:animate-fade-out data-instant:animate-none motion-reduce:animate-none",
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
          >
            {children}
            <TooltipPrimitive.Arrow
              data-slot="tooltip-arrow"
              className="size-100 rotate-45 rounded-xsmall bg-neutral-bold data-[side=top]:-bottom-025 data-[side=bottom]:-top-025 data-[side=left]:-right-025 data-[side=right]:-left-025 data-[side=inline-start]:-end-025 data-[side=inline-end]:-start-025"
            />
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </DirectionProvider>
  );
}
