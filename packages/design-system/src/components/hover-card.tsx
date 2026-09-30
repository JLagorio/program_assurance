import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { token } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { overlaySurface } from "./overlay";

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

/** The link that opens the card. It draws the kit's focus ring; compose TextLink for link styling. */
export function HoverCardTrigger<Payload = unknown>({
  className,
  ...props
}: HoverCardTriggerProps<Payload>) {
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      className={classes("rounded-xsmall focus-visible:outline-focused", className)}
      {...props}
    />
  );
}

export type HoverCardContentProps = PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
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
 * The card, with its portal and positioner, centred under its trigger. Beside the four placement
 * props it takes the positioner's `anchor`, `collisionPadding`, `collisionBoundary`,
 * `collisionAvoidance`, `sticky` and `positionMethod`. It is capped at the height the window leaves
 * on its side, and scrolls within it.
 */
export function HoverCardContent({
  className,
  style,
  dir,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  anchor,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding,
  positionMethod,
  sticky,
  ...props
}: HoverCardContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  // The overlay surface is recorded as the current one, so a child that matches its surface
  // (a sticky header, a pinned cell) paints the popup's colour.
  const defaults = {
    ...overlaySurface,
    width: token("dimension.part.hoverCard"),
    maxWidth: "var(--available-width)",
    maxHeight: "var(--available-height)",
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
          anchor={anchor}
          collisionAvoidance={collisionAvoidance}
          collisionBoundary={collisionBoundary}
          collisionPadding={collisionPadding}
          positionMethod={positionMethod}
          sticky={sticky}
          className="isolate z-50"
        >
          <PreviewCardPrimitive.Popup
            data-slot="hover-card-content"
            dir={dir ?? direction}
            className={classes(
              "overflow-y-auto rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none",
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
