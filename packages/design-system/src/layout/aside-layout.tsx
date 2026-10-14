import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";

import { tokenValue, type TokenName } from "../generated/tokens";
import { cn } from "../lib/cn";
import { desktopQuery, mergeRefs } from "./shell/context";
import { AsideLayoutContext, type AsideDisplay } from "./slots";

export type AsideLayoutProps = Omit<ComponentProps<"div">, "children"> & {
  /** The Details the body belongs with: a Shell.Aside holding an Inspector. Without it, or with an Aside that has nothing to show, the body takes the whole width. */
  aside?: ReactNode | undefined;
  /** The work beside the Details: a record's body, or its Overview tab's. */
  children?: ReactNode | undefined;
};

/** The narrowest an AsideLayout shows the rail at: a list column of body, the gap, and the rail. */
function railWidth(node: HTMLElement) {
  const px = (name: TokenName) => Number.parseFloat(tokenValue(name, node)) || 0;
  return (
    px("dimension.layout.list") + px("space.300") + px("dimension.layout.rail") + px("space.300")
  );
}

/** The display the last layout measured, which the next one mounted on the client starts from. */
let measured: AsideDisplay | null = null;
const subscribeToNothing = () => () => {};

/*
 * The display from the layout's own width, before the first paint and whenever it changes: the rail
 * from the large breakpoint while the body keeps a list column beside it, else the disclosure. The
 * rail, once shown, stays until the layout is `space.300` narrower than that: a page scrollbar the
 * rail brings or takes away moves the width by less, so the two displays never trade places for
 * ever. A layout with no width (a hidden tab's panel) keeps the display it had, so a tab shown again
 * never flashes the other one. While hydrating it starts as the disclosure, the narrow display, so
 * the page rendered on the server and the first client render agree; a layout mounted later (the
 * next record, a remount for another version) starts from the display the last one measured, so at
 * a desktop width its first commit is already the rail, and an effect that focuses a control in the
 * Details as it mounts finds the control shown rather than inside a closed disclosure.
 */
function useAsideDisplay(layout: RefObject<HTMLDivElement | null>) {
  const hydrating = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
  const [display, setDisplay] = useState<AsideDisplay>(
    () => (hydrating ? null : measured) ?? "disclosure",
  );
  useLayoutEffect(() => {
    measured = display;
  }, [display]);
  useLayoutEffect(() => {
    const node = layout.current;
    if (!node) return;
    const large = window.matchMedia(desktopQuery());
    const update = () => {
      const width = node.getBoundingClientRect().width;
      if (width === 0) return;
      const rail = railWidth(node);
      const allowance = Number.parseFloat(tokenValue("space.300", node)) || 0;
      setDisplay((current) =>
        large.matches && (width >= rail || (current === "rail" && width >= rail - allowance))
          ? "rail"
          : "disclosure",
      );
    };
    update();
    large.addEventListener("change", update);
    if (typeof ResizeObserver === "undefined")
      return () => large.removeEventListener("change", update);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      large.removeEventListener("change", update);
      observer.disconnect();
    };
  }, [layout]);
  return display;
}

/**
 * A body and the Details it belongs with, the `aside`: on a tabbed record, the Overview tab's panel;
 * on a record without tabs, everything under the PageHeader. From the large breakpoint, while the
 * layout leaves the body a list column (`dimension.layout.list`) beside the rail, the Details are
 * the rail at the body's end: a column `dimension.layout.rail` wide and `space.300` from the body,
 * its rule running the pair's height, its content staying in view under the shell's header as the
 * page scrolls and scrolling inside itself when it is taller than the window. Narrower, they are the
 * Details disclosure above the body, closed, its row carrying the record's state. The layout decides
 * from its own width, so an open panel or a wide side nav narrows it as a phone does. The Details are
 * first in the document at every width, rendered once in place: a change of display mounts nothing
 * again and moves nothing, so a draft in an Editable and focus survive it. Native `div` props and
 * the ref reach the layout's root.
 */
export function AsideLayout({ aside, children, className, ref, ...props }: AsideLayoutProps) {
  const own = useRef<HTMLDivElement>(null);
  const layoutRef = useMemo(() => mergeRefs(ref, own), [ref]);
  const display = useAsideDisplay(own);
  return (
    <div
      {...props}
      ref={layoutRef}
      data-slot="aside-layout"
      data-display={display}
      className={cn("min-w-0", className)}
    >
      <div data-slot="aside-layout-aside">
        <AsideLayoutContext.Provider value={display}>{aside}</AsideLayoutContext.Provider>
      </div>
      <div data-slot="aside-layout-body">{children}</div>
    </div>
  );
}
