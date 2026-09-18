import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from "react";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Scroller, ScrollerArrow } from "./scroller";

const TabsLayoutContext = createContext<{
  orientation: "horizontal" | "vertical";
  direction: "ltr" | "rtl";
}>({ orientation: "horizontal", direction: "ltr" });

export type TabsProps = TabsPrimitive.Root.Props;

export function Tabs({ className, orientation = "horizontal", dir, ...props }: TabsProps) {
  const { direction } = useLedgerLocale();
  const resolvedDirection = dir === "ltr" || dir === "rtl" ? dir : direction;
  return (
    <DirectionProvider direction={resolvedDirection}>
      <TabsLayoutContext.Provider value={{ orientation, direction: resolvedDirection }}>
        <TabsPrimitive.Root
          data-slot="tabs"
          dir={dir ?? direction}
          orientation={orientation}
          {...props}
          className={classes(
            "group/tabs flex min-w-0 gap-100 data-[orientation=horizontal]:flex-col",
            className,
          )}
        />
      </TabsLayoutContext.Provider>
    </DirectionProvider>
  );
}

export const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit max-w-full shrink-0 items-center justify-center rounded-medium p-050 text-subtle data-[orientation=horizontal]:h-control-medium data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col",
  {
    variants: {
      variant: {
        default: "bg-neutral",
        line: "gap-300 rounded-none border-default bg-transparent p-0 data-[orientation=horizontal]:h-auto data-[orientation=horizontal]:w-full data-[orientation=horizontal]:min-w-max data-[orientation=horizontal]:flex-nowrap data-[orientation=horizontal]:justify-start data-[orientation=horizontal]:border-b data-[orientation=vertical]:border-e data-[orientation=vertical]:gap-100",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;

export function TabsList({ className, variant = "default", children, ...props }: TabsListProps) {
  const { orientation, direction } = useContext(TabsLayoutContext);
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const list = (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
      className={classes(tabsListVariants({ variant }), className)}
    >
      {children}
      <TabsPrimitive.Indicator data-slot="tabs-indicator" />
    </TabsPrimitive.List>
  );
  if (variant !== "line" || orientation !== "horizontal") return list;
  return (
    <Scroller orientation="horizontal" viewport={viewport} className="w-full shrink-0">
      <ScrollArea
        data-slot="tabs-scroll-area"
        dir={direction}
        className="w-full min-w-0 shrink-0 data-[has-overflow-x]:pb-100"
        viewportProps={{
          ref: setViewport,
          tabIndex: -1,
          onFocusCapture: (event) => {
            // Base UI's roving focus prevents native scrolling; reveal it in our viewport,
            // clear of the Scroller's arrows (its scroll padding).
            const element = event.currentTarget;
            const style = getComputedStyle(element);
            const viewport = element.getBoundingClientRect();
            const focused = event.target.getBoundingClientRect();
            const left = viewport.left + (parseFloat(style.scrollPaddingLeft) || 0);
            const right = viewport.right - (parseFloat(style.scrollPaddingRight) || 0);
            if (focused.left < left) {
              element.scrollBy({ left: focused.left - left });
            } else if (focused.right > right) {
              element.scrollBy({ left: focused.right - right });
            }
          },
        }}
      >
        {list}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <ScrollerArrow edge="start" className="border-b border-default" />
      <ScrollerArrow edge="end" className="border-b border-default" />
    </Scroller>
  );
}

export type TabsTriggerProps = TabsPrimitive.Tab.Props;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      {...props}
      className={classes(
        "relative z-10 inline-flex h-full min-h-control-small flex-1 shrink-0 items-center justify-center gap-075 whitespace-nowrap rounded-small px-100 font-body font-medium text-subtle outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused data-active:text-default data-disabled:pointer-events-none data-disabled:text-disabled group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[variant=line]/tabs-list:h-control-medium group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-050 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-medium",
        className,
      )}
    />
  );
}

export type TabsContentProps = TabsPrimitive.Panel.Props;

export function TabsContent({ className, value, ref, ...props }: TabsContentProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const previousValue = useRef(value);
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      panel.current = node;
      if (typeof ref === "function") {
        const cleanup = ref(node);
        if (cleanup)
          return () => {
            panel.current = null;
            cleanup();
          };
      } else if (ref) ref.current = node;
      return undefined;
    },
    [ref],
  );
  useLayoutEffect(() => {
    const changed = !Object.is(previousValue.current, value);
    previousValue.current = value;
    const element = panel.current;
    if (!changed || !element || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    // Controlled routes may reuse one panel for changing values. Replay only the entrance;
    // preserve the same element, child state, refs and scroll position.
    const animationName = element.style.animationName;
    element.style.animationName = "none";
    void element.offsetWidth;
    element.style.animationName = animationName;
  }, [value]);
  return (
    <TabsPrimitive.Panel
      ref={mergedRef}
      data-slot="tabs-content"
      value={value}
      {...props}
      className={classes(
        "flex-1 outline-none focus-visible:outline-focused [&[hidden]]:hidden",
        className,
      )}
    />
  );
}
