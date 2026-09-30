import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { token } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";

export type TooltipProviderProps = TooltipPrimitive.Provider.Props;

/**
 * Shares hover timing across a group of tooltips: the first waits `delay` (300ms), and one next to
 * it opens at once for `timeout` (300ms) after the last closed. Shell mounts one.
 */
export function TooltipProvider({ delay = 300, timeout = 300, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delay={delay} timeout={timeout} {...props} />;
}

/**
 * What a Tooltip tells its parts: the id of the hidden copy a `describe`d TooltipContent renders,
 * for the trigger to point at, and the root's actions, for the trigger to close it.
 */
const TooltipRootContext = createContext<{
  id: string | undefined;
  set: (id: string | undefined) => void;
  actions: RefObject<TooltipPrimitive.Root.Actions | null>;
} | null>(null);

export type TooltipProps<Payload = unknown> = TooltipPrimitive.Root.Props<Payload>;

export function Tooltip<Payload = unknown>({ actionsRef, ...props }: TooltipProps<Payload>) {
  const { direction } = useLedgerLocale();
  const [id, set] = useState<string | undefined>(undefined);
  const own = useRef<TooltipPrimitive.Root.Actions | null>(null);
  const actions = actionsRef ?? own;
  const root = useMemo(() => ({ id, set, actions }), [id, actions]);
  return (
    <DirectionProvider direction={direction}>
      <TooltipRootContext.Provider value={root}>
        <TooltipPrimitive.Root {...props} actionsRef={actions} />
      </TooltipRootContext.Provider>
    </DirectionProvider>
  );
}

export type TooltipTriggerProps<Payload = unknown> = TooltipPrimitive.Trigger.Props<Payload>;

/**
 * The control the tooltip labels. A `describe`d TooltipContent becomes its accessible description.
 * Escape on an unavailable trigger (`aria-disabled`, such as a Button with `disabledReason`) closes
 * the tooltip and goes no further, as it does on any other trigger, so a dialog around it stays.
 */
export function TooltipTrigger<Payload = unknown>({
  onKeyDownCapture,
  ...props
}: TooltipTriggerProps<Payload>) {
  const root = useContext(TooltipRootContext);
  const describedBy = [props["aria-describedby"], root?.id].filter(Boolean).join(" ") || undefined;
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...props}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event);
        const trigger = event.currentTarget;
        // A disabled control drops the trigger's own key handlers, so Base UI's Escape would reach
        // the dialog around it first and close that too. Close the tooltip here instead.
        if (
          event.key !== "Escape" ||
          !trigger.hasAttribute("data-popup-open") ||
          trigger.getAttribute("aria-disabled") !== "true" ||
          !root
        )
          return;
        event.stopPropagation();
        event.preventDefault();
        root.actions.current?.close();
      }}
    />
  );
}

export type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
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
  > & {
    /**
     * Also say the tooltip's words to assistive technology: a visually hidden copy, always on the
     * page, becomes the trigger's accessible description (`aria-describedby`). For words the
     * trigger's name leaves out, such as a keyboard shortcut; the trigger keeps its own name. A
     * tooltip is visual only without it. @default false
     */
    describe?: boolean | undefined;
  };

/**
 * The popup, with its portal, positioner and arrow. Beside the four placement props it takes the
 * positioner's `anchor`, `collisionPadding`, `collisionBoundary`, `collisionAvoidance`, `sticky`
 * and `positionMethod`.
 */
export function TooltipContent({
  className,
  style,
  dir,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  anchor,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding,
  positionMethod,
  sticky,
  describe = false,
  children,
  ...props
}: TooltipContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const id = useId();
  const set = useContext(TooltipRootContext)?.set;
  useEffect(() => {
    if (!describe || !set) return;
    set(id);
    return () => set(undefined);
  }, [describe, id, set]);
  const defaults = {
    maxWidth: `min(${token("dimension.part.tooltip")}, var(--available-width))`,
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <>
      {describe ? (
        <span id={id} data-slot="tooltip-description" className="sr-only">
          {children}
        </span>
      ) : null}
      <DirectionProvider direction={direction}>
        <TooltipPrimitive.Portal data-slot="tooltip-portal">
          <TooltipPrimitive.Positioner
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
            className="isolate"
            // layer.tooltip, above everything, a toast included, so a toast action's label shows.
            style={{ zIndex: "var(--ds-layer-tooltip)" }}
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
    </>
  );
}
