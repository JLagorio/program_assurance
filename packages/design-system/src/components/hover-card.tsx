import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";

export type HoverCardProps<Payload = unknown> = PreviewCardPrimitive.Root.Props<Payload>;

export function HoverCard<Payload = unknown>(props: HoverCardProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <PreviewCardPrimitive.Root {...props} />
    </DirectionProvider>
  );
}

export type HoverCardTriggerProps<Payload = unknown> = PreviewCardPrimitive.Trigger.Props<Payload>;

export function HoverCardTrigger<Payload = unknown>(props: HoverCardTriggerProps<Payload>) {
  return <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

export type HoverCardContentProps = PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

export function HoverCardContent({
  className,
  style,
  dir,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: HoverCardContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const defaults = {
    width: 256,
    maxWidth: "var(--available-width)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
        <PreviewCardPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          className="isolate z-50"
        >
          <PreviewCardPrimitive.Popup
            data-slot="hover-card-content"
            dir={dir ?? direction}
            className={classes(
              "rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none",
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
          />
        </PreviewCardPrimitive.Positioner>
      </PreviewCardPrimitive.Portal>
    </DirectionProvider>
  );
}
