import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

export type ScrollerOrientation = "vertical" | "horizontal";
export type ScrollerEdge = "start" | "end";
export type ScrollerSurface = "default" | "overlay" | "raised";
export type ScrollerActivation = "hover" | "click";

type Edges = { overflows: boolean; atStart: boolean; atEnd: boolean };
const noEdges: Edges = { overflows: false, atStart: true, atEnd: true };
// The innermost Scroller owns focus reveal; a containing Scroller must not move it again.
const revealedFocusEvents = new WeakSet<FocusEvent>();

type ScrollerContextValue = {
  orientation: ScrollerOrientation;
  scrollOn: ScrollerActivation;
  surface: ScrollerSurface;
  hoverable: boolean;
  viewport: HTMLElement | null;
  setViewport: (element: HTMLElement | null) => void;
  edges: Edges;
};

const ScrollerContext = createContext<ScrollerContextValue | null>(null);

function useScroller(part: string) {
  const context = useContext(ScrollerContext);
  if (!context) throw new Error(`${part} must be rendered inside Scroller.`);
  return context;
}

/** Arrows are a hover affordance: they never appear where the pointer cannot hover. */
const hoverQuery = "(hover: hover) and (pointer: fine)";
function useHoverable() {
  const [hoverable, setHoverable] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(hoverQuery);
    const sync = () => setHoverable(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return hoverable;
}

function readEdges(element: HTMLElement, orientation: ScrollerOrientation): Edges {
  const vertical = orientation === "vertical";
  const size = vertical ? element.clientHeight : element.clientWidth;
  const scroll = vertical ? element.scrollHeight : element.scrollWidth;
  // RTL horizontal scrollers count into the negative; the distance is what matters.
  const position = Math.abs(vertical ? element.scrollTop : element.scrollLeft);
  return {
    overflows: scroll - size > 1,
    atStart: position <= 1,
    atEnd: position + size >= scroll - 1,
  };
}

const sameEdges = (a: Edges, b: Edges) =>
  a.overflows === b.overflows && a.atStart === b.atStart && a.atEnd === b.atEnd;

/** The arrow's thickness; the viewport keeps this much clear when arrows show. */
const arrowSize = "var(--ds-space-300)";

/** Hover scrolling in pixels per second; a click steps this share of the viewport. */
const hoverSpeed = 480;
const clickShare = 0.8;

export const scrollerArrowVariants = cva(
  "absolute z-10 flex select-none items-center justify-center text-subtle outline-none [&_svg]:size-icon-small",
  {
    variants: {
      orientation: { vertical: "inset-x-0 h-300", horizontal: "inset-y-0 w-300" },
      edge: { start: "", end: "" },
      surface: {
        default: "bg-surface",
        overlay: "bg-surface-overlay",
        raised: "bg-surface-raised",
      },
      /* A hover zone is quiet; a click arrow reads as a button: pointer, hover tint, an inner hairline. */
      scrollOn: {
        hover: "cursor-default",
        click:
          "cursor-pointer border-default transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused",
      },
    },
    compoundVariants: [
      { orientation: "vertical", edge: "start", className: "top-0" },
      { orientation: "vertical", edge: "end", className: "bottom-0" },
      { orientation: "horizontal", edge: "start", className: "start-0" },
      { orientation: "horizontal", edge: "end", className: "end-0" },
      /* The hover tint is an opaque surface, so the content under the arrow never shows through. */
      { scrollOn: "click", surface: "default", className: "hover:bg-surface-hovered" },
      { scrollOn: "click", surface: "overlay", className: "hover:bg-surface-overlay-hovered" },
      { scrollOn: "click", surface: "raised", className: "hover:bg-surface-raised-hovered" },
      { scrollOn: "click", orientation: "vertical", edge: "start", className: "border-b" },
      { scrollOn: "click", orientation: "vertical", edge: "end", className: "border-t" },
      { scrollOn: "click", orientation: "horizontal", edge: "start", className: "border-e" },
      { scrollOn: "click", orientation: "horizontal", edge: "end", className: "border-s" },
    ],
    defaultVariants: {
      orientation: "vertical",
      edge: "start",
      surface: "default",
      scrollOn: "hover",
    },
  },
);

export type ScrollerProps = ComponentProps<"div"> & {
  /** Which axis scrolls. Vertical unsaid. */
  orientation?: ScrollerOrientation | undefined;
  /**
   * How an arrow scrolls: hovering scrolls continuously (a menu), clicking steps a page (a tab
   * strip). Unsaid, vertical scrollers hover and horizontal ones click.
   */
  scrollOn?: ScrollerActivation | undefined;
  /** The surface the arrows sit on, so they cover the content they scroll. */
  surface?: ScrollerSurface | undefined;
  /**
   * The element that scrolls when it is not a ScrollerViewport child, such as a ScrollArea's
   * viewport. Pass a state-held element, not a ref.
   */
  viewport?: HTMLElement | null | undefined;
};

/**
 * A bounded scrolling region with edge arrows. The arrows appear only when the viewport
 * overflows, only at an edge that can still scroll, and only where the pointer can hover; touch
 * readers swipe. Compose ScrollerViewport (or pass `viewport`) and one ScrollerArrow per edge.
 */
export function Scroller({
  orientation = "vertical",
  scrollOn,
  surface = "default",
  viewport: externalViewport,
  className,
  ...props
}: ScrollerProps) {
  const [ownViewport, setViewport] = useState<HTMLElement | null>(null);
  const viewport = externalViewport ?? ownViewport;
  const hoverable = useHoverable();
  const [edges, setEdges] = useState<Edges>(noEdges);

  useEffect(() => {
    if (!viewport) {
      setEdges(noEdges);
      return undefined;
    }
    const update = () =>
      setEdges((previous) => {
        const next = readEdges(viewport, orientation);
        return sameEdges(previous, next) ? previous : next;
      });
    const revealFocus = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        target === viewport ||
        revealedFocusEvents.has(event)
      ) {
        return;
      }
      revealedFocusEvents.add(event);
      const vertical = orientation === "vertical";
      const bounds = viewport.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const style = getComputedStyle(viewport);
      const start =
        (vertical ? bounds.top + viewport.clientTop : bounds.left + viewport.clientLeft) +
        (parseFloat(vertical ? style.scrollPaddingTop : style.scrollPaddingLeft) || 0);
      const end =
        (vertical
          ? bounds.top + viewport.clientTop + viewport.clientHeight
          : bounds.left + viewport.clientLeft + viewport.clientWidth) -
        (parseFloat(vertical ? style.scrollPaddingBottom : style.scrollPaddingRight) || 0);
      const itemStart = vertical ? item.top : item.left;
      const itemEnd = vertical ? item.bottom : item.right;
      // An item larger than the visible region cannot expose both edges; keep its position.
      if (itemStart < start && itemEnd > end) return;
      const distance = itemStart < start ? itemStart - start : itemEnd > end ? itemEnd - end : 0;
      if (distance) {
        viewport.scrollBy(vertical ? { top: distance } : { left: distance });
      }
    };
    const sizes = new ResizeObserver(update);
    const observeChildren = () => {
      sizes.disconnect();
      sizes.observe(viewport);
      for (const child of Array.from(viewport.children)) sizes.observe(child);
    };
    const children = new MutationObserver(() => {
      observeChildren();
      update();
    });
    update();
    observeChildren();
    children.observe(viewport, { childList: true });
    viewport.addEventListener("scroll", update, { passive: true });
    viewport.addEventListener("focusin", revealFocus);
    return () => {
      viewport.removeEventListener("scroll", update);
      viewport.removeEventListener("focusin", revealFocus);
      sizes.disconnect();
      children.disconnect();
    };
  }, [viewport, orientation]);

  // While the arrows are in play they replace the native scrollbar (scroller.css), and the
  // viewport keeps their thickness clear so a focused or highlighted item scrolls out from under.
  useEffect(() => {
    if (!viewport) return undefined;
    const property = orientation === "vertical" ? "scrollPaddingBlock" : "scrollPaddingInline";
    const active = edges.overflows && hoverable;
    viewport.style[property] = active ? arrowSize : "";
    if (active) viewport.setAttribute("data-scroller-arrows", "");
    else viewport.removeAttribute("data-scroller-arrows");
    return () => {
      viewport.style[property] = "";
      viewport.removeAttribute("data-scroller-arrows");
    };
  }, [viewport, orientation, edges.overflows, hoverable]);

  const value = useMemo<ScrollerContextValue>(
    () => ({
      orientation,
      scrollOn: scrollOn ?? (orientation === "vertical" ? "hover" : "click"),
      surface,
      hoverable,
      viewport,
      setViewport,
      edges,
    }),
    [orientation, scrollOn, surface, hoverable, viewport, edges],
  );

  return (
    <ScrollerContext.Provider value={value}>
      <div
        {...props}
        data-slot="scroller"
        data-orientation={orientation}
        data-arrows={edges.overflows && hoverable ? "" : undefined}
        className={cn(
          "group/scroller relative flex min-h-0 min-w-0 data-[orientation=vertical]:flex-col",
          className,
        )}
      />
    </ScrollerContext.Provider>
  );
}

export type ScrollerViewportProps = useRender.ComponentProps<"div">;

/** The element that scrolls. `render` substitutes another scrolling element, such as a list. */
export function ScrollerViewport({ className, render, ...props }: ScrollerViewportProps) {
  const { orientation, setViewport } = useScroller("ScrollerViewport");
  return useRender({
    defaultTagName: "div",
    ref: setViewport,
    props: mergeProps<"div">(
      {
        className: cn(
          "min-h-0 min-w-0 flex-1 outline-none",
          orientation === "vertical"
            ? "overflow-x-hidden overflow-y-auto"
            : "overflow-x-auto overflow-y-hidden",
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: "scroller-viewport" },
  });
}

export type ScrollerArrowProps = ComponentProps<"button"> & {
  /** The edge this arrow scrolls toward. */
  edge: ScrollerEdge;
};

/**
 * One edge's arrow. Hover mode renders a hidden-from-assistive-technology hover zone; click mode
 * renders a labelled button outside the tab order (arrow keys already reach the content).
 */
export function ScrollerArrow({
  edge,
  className,
  onPointerEnter,
  onPointerLeave,
  onClick,
  children,
  ...props
}: ScrollerArrowProps) {
  const { orientation, scrollOn, surface, hoverable, viewport, edges } =
    useScroller("ScrollerArrow");
  const { t } = useLedgerLocale();
  const frame = useRef<number | null>(null);
  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const visible = hoverable && edges.overflows && !(edge === "start" ? edges.atStart : edges.atEnd);
  useEffect(() => {
    if (!visible) stop();
  }, [visible, stop]);
  if (!visible || !viewport) return null;

  const vertical = orientation === "vertical";
  // The viewport's own writing direction decides which way "forward" scrolls.
  const sign = () =>
    (edge === "start" ? -1 : 1) *
    (!vertical && getComputedStyle(viewport).direction === "rtl" ? -1 : 1);
  const scrollBy = (amount: number, behavior: ScrollBehavior) =>
    viewport.scrollBy(
      vertical ? { top: sign() * amount, behavior } : { left: sign() * amount, behavior },
    );
  const start = () => {
    stop();
    let last = performance.now();
    const step = (now: number) => {
      scrollBy(((now - last) / 1000) * hoverSpeed, "auto");
      last = now;
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const icon = vertical ? (
    edge === "start" ? (
      <ChevronUp aria-hidden />
    ) : (
      <ChevronDown aria-hidden />
    )
  ) : edge === "start" ? (
    <ChevronLeft aria-hidden className="rtl:rotate-180" />
  ) : (
    <ChevronRight aria-hidden className="rtl:rotate-180" />
  );
  const classes = cn(scrollerArrowVariants({ orientation, edge, surface, scrollOn }), className);

  if (scrollOn === "hover") {
    const zoneProps = props as ComponentProps<"div">;
    return (
      <div
        {...zoneProps}
        aria-hidden
        data-slot="scroller-arrow"
        data-edge={edge}
        className={classes}
        onPointerEnter={(event) => {
          (onPointerEnter as ComponentProps<"div">["onPointerEnter"])?.(event);
          if (event.pointerType === "mouse") start();
        }}
        onPointerLeave={(event) => {
          (onPointerLeave as ComponentProps<"div">["onPointerLeave"])?.(event);
          stop();
        }}
      >
        {children ?? icon}
      </div>
    );
  }
  const label = vertical
    ? t(edge === "start" ? "scrollUp" : "scrollDown")
    : t(edge === "start" ? "scrollBack" : "scrollForward");
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      {...props}
      data-slot="scroller-arrow"
      data-edge={edge}
      className={classes}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const size = vertical ? viewport.clientHeight : viewport.clientWidth;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        scrollBy(size * clickShare, reduced ? "auto" : "smooth");
      }}
    >
      {children ?? icon}
    </button>
  );
}
