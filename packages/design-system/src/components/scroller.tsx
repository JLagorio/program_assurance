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

/** `long`: a vertical list too tall to cross by hovering; it keeps the native scrollbar instead. */
type Edges = { overflows: boolean; atStart: boolean; atEnd: boolean; long: boolean };
const noEdges: Edges = { overflows: false, atStart: true, atEnd: true, long: false };
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
    long: vertical && size > 0 && scroll > size * longList,
  };
}

const sameEdges = (a: Edges, b: Edges) =>
  a.overflows === b.overflows &&
  a.atStart === b.atStart &&
  a.atEnd === b.atEnd &&
  a.long === b.long;

/**
 * Past this many viewports of content a vertical list keeps its native scrollbar and shows no
 * arrows: at the hover speed, crossing five viewports of a 300px menu already takes three seconds.
 */
const longList = 5;

/** What the keyboard reaches inside a viewport: a tab stop, or an item a composite moves focus to. */
const reachable = [
  "a[href]",
  "button:not(:disabled)",
  'input:not([type="hidden"]):not(:disabled)',
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "summary",
  "iframe",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
  ...["option", "menuitem", "menuitemcheckbox", "menuitemradio", "treeitem", "tab", "gridcell"].map(
    (role) => `[role="${role}"]`,
  ),
].join(", ");
/** The attributes that change whether something inside can be reached, watched below a viewport. */
const reachability = ["disabled", "tabindex", "href", "contenteditable", "hidden", "inert", "role"];

/** What a strip keeps in view when it narrows: the selected tab, the current step, the pressed view. */
const currentItem =
  '[aria-selected="true"], [aria-current]:not([aria-current="false"]), [aria-pressed="true"]';

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
      /* `default` is the surface the Scroller sits on: the page, or the Card, Dialog or Sheet
         that records itself as the current one. */
      surface: {
        default: "bg-surface-current",
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
  /**
   * The surface the arrows sit on, so they cover the content they scroll. Unsaid, the surface the
   * Scroller sits on (`utility.elevation.surface.current`).
   */
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
    const vertical = orientation === "vertical";
    const update = () =>
      setEdges((previous) => {
        const next = readEdges(viewport, orientation);
        return sameEdges(previous, next) ? previous : next;
      });
    /** Scrolls the viewport the least distance that shows `target` whole, clear of `inset` at each edge. */
    const reveal = (target: HTMLElement, inset = 0) => {
      const bounds = viewport.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const style = getComputedStyle(viewport);
      const start =
        (vertical ? bounds.top + viewport.clientTop : bounds.left + viewport.clientLeft) +
        Math.max(
          inset,
          parseFloat(vertical ? style.scrollPaddingTop : style.scrollPaddingLeft) || 0,
        );
      const end =
        (vertical
          ? bounds.top + viewport.clientTop + viewport.clientHeight
          : bounds.left + viewport.clientLeft + viewport.clientWidth) -
        Math.max(
          inset,
          parseFloat(vertical ? style.scrollPaddingBottom : style.scrollPaddingRight) || 0,
        );
      const itemStart = vertical ? item.top : item.left;
      const itemEnd = vertical ? item.bottom : item.right;
      // An item larger than the visible region cannot expose both edges; keep its position.
      if (itemStart < start && itemEnd > end) return;
      const distance = itemStart < start ? itemStart - start : itemEnd > end ? itemEnd - end : 0;
      if (distance) {
        viewport.scrollBy(vertical ? { top: distance } : { left: distance });
      }
    };
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
      reveal(target);
    };
    // A strip keeps its current item in view: the selected tab, the current step or the pressed
    // view scrolls back in if it ended outside. Until the reader scrolls, wheels, touches, clicks,
    // types or moves focus in the strip, that holds on every change of size, so counts that arrive
    // after the first layout cannot push the current tab out; after that, only a strip that
    // narrows (a window resize, a panel opening beside it) brings it back, and a strip that grows
    // stays where the reader put it. A current item that changes (a tab chosen from outside the
    // strip) always scrolls in. Nothing moves focus.
    const root = viewport.closest<HTMLElement>('[data-slot="scroller"]') ?? viewport;
    let laidOutWidth = 0;
    let readerMoved = false;
    let current: HTMLElement | null = null;
    const findCurrent = () =>
      Array.from(viewport.querySelectorAll<HTMLElement>(currentItem)).find(
        (item) => (item.closest('[data-slot="scroller"]') ?? viewport) === root,
      ) ?? null;
    const keepCurrentInView = () => {
      if (vertical) return;
      const width = viewport.clientWidth;
      const narrowed = width < laidOutWidth - 1;
      laidOutWidth = width;
      const item = findCurrent();
      const changed = item !== current;
      current = item;
      if (!item || !readEdges(viewport, orientation).overflows) return;
      if (readerMoved && !narrowed && !changed) return;
      // The arrows may not have claimed their scroll padding yet on the first layout.
      const arrows = window.matchMedia(hoverQuery).matches
        ? parseFloat(getComputedStyle(viewport).getPropertyValue("--ds-space-300")) || 0
        : 0;
      reveal(item, arrows);
    };
    // Focus inside the strip stays in view when the strip changes size under it (a window resize,
    // a side nav folding to its rail), as it was revealed when it arrived.
    const keepFocusInView = () => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== viewport && viewport.contains(active))
        reveal(active);
    };
    const readerActs = () => {
      readerMoved = true;
    };
    const readerEvents = ["wheel", "pointerdown", "touchstart", "keydown", "focusin"] as const;
    // Measured on the next frame, not inside the observer: a list that shrinks below its height
    // drops the native scrollbar, its items widen by the scrollbar's width, and a second
    // notification in the same frame makes Chromium report a ResizeObserver loop.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        update();
        keepCurrentInView();
        keepFocusInView();
      });
    };
    const sizes = new ResizeObserver(schedule);
    // The viewport and its direct children, the content that grows without a change of size of
    // its own: only the difference is observed as children come and go, so filtering a long list
    // does not observe every item again on each keystroke.
    const sized = new Set<Element>();
    const observeChildren = () => {
      for (const child of sized) {
        if (child.parentElement !== viewport) {
          sizes.unobserve(child);
          sized.delete(child);
        }
      }
      for (const child of Array.from(viewport.children)) {
        if (!sized.has(child)) {
          sizes.observe(child);
          sized.add(child);
        }
      }
    };
    const children = new MutationObserver(() => {
      observeChildren();
      update();
    });
    // A current item chosen from outside the strip, as a record's Overview does for its tabs.
    const selection = new MutationObserver(schedule);
    // Rings inside the viewport are drawn inside their box (scroller.css), since it clips.
    viewport.setAttribute("data-scroller-viewport", orientation);
    update();
    sizes.observe(viewport);
    observeChildren();
    children.observe(viewport, { childList: true });
    if (!vertical) {
      selection.observe(viewport, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-selected", "aria-current", "aria-pressed"],
      });
      for (const type of readerEvents) root.addEventListener(type, readerActs, { passive: true });
    }
    viewport.addEventListener("scroll", update, { passive: true });
    viewport.addEventListener("focusin", revealFocus);
    return () => {
      viewport.removeEventListener("scroll", update);
      viewport.removeEventListener("focusin", revealFocus);
      for (const type of readerEvents) root.removeEventListener(type, readerActs);
      viewport.removeAttribute("data-scroller-viewport");
      cancelAnimationFrame(frame);
      sizes.disconnect();
      children.disconnect();
      selection.disconnect();
    };
  }, [viewport, orientation]);

  // While the arrows are in play they replace the native scrollbar (scroller.css), and the
  // viewport keeps their thickness clear so a focused or highlighted item scrolls out from under.
  useEffect(() => {
    if (!viewport) return undefined;
    const property = orientation === "vertical" ? "scrollPaddingBlock" : "scrollPaddingInline";
    const active = edges.overflows && !edges.long && hoverable;
    viewport.style[property] = active ? arrowSize : "";
    if (active) viewport.setAttribute("data-scroller-arrows", "");
    else viewport.removeAttribute("data-scroller-arrows");
    return () => {
      viewport.style[property] = "";
      viewport.removeAttribute("data-scroller-arrows");
    };
  }, [viewport, orientation, edges.overflows, edges.long, hoverable]);

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
        data-arrows={edges.overflows && !edges.long && hoverable ? "" : undefined}
        className={cn(
          "group/scroller relative flex min-h-0 min-w-0 data-[orientation=vertical]:flex-col",
          className,
        )}
      />
    </ScrollerContext.Provider>
  );
}

export type ScrollerViewportProps = useRender.ComponentProps<"div">;

/**
 * The element that scrolls. `render` substitutes another scrolling element, such as a list.
 *
 * While it overflows and holds nothing the keyboard can reach (no link, button or field, and no
 * item a list, menu or tree moves focus to), it is a tab stop, so the arrow keys can scroll it: a
 * group named "Content, scrolls" unless the caller names it or gives it a role. A caller's own
 * `tabIndex` decides instead; a focusable viewport the caller did not name still takes that name.
 * Its focus ring, and every ring inside it, is drawn inside the box, since the viewport clips.
 */
export function ScrollerViewport({
  className,
  render,
  tabIndex,
  role,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ScrollerViewportProps) {
  const { orientation, setViewport, viewport, edges } = useScroller("ScrollerViewport");
  const { t } = useLedgerLocale();
  const automatic = tabIndex === undefined;
  // Assumed reachable until measured, so the first render adds no stop.
  const [hasReachable, setHasReachable] = useState(true);
  useEffect(() => {
    if (!automatic || !viewport) return undefined;
    const check = () => setHasReachable(viewport.querySelector(reachable) !== null);
    check();
    const observer = new MutationObserver(check);
    observer.observe(viewport, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: reachability,
    });
    return () => observer.disconnect();
  }, [automatic, viewport]);
  const stop = automatic && edges.overflows && !hasReachable;
  const focusable = stop || (tabIndex !== undefined && tabIndex >= 0);
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  return useRender({
    defaultTagName: "div",
    ref: setViewport,
    props: mergeProps<"div">(
      {
        className: cn(
          "min-h-0 min-w-0 flex-1 outline-none focus-visible:outline-focused",
          // A strip keeps the resting ring and shadow its buttons draw outside their box.
          orientation === "vertical"
            ? "overflow-x-hidden overflow-y-auto"
            : "overflow-x-auto overflow-y-hidden p-025",
          className,
        ),
        tabIndex: stop ? 0 : tabIndex,
        role: role ?? (focusable ? "group" : undefined),
        "aria-label": ariaLabel ?? (focusable && !named ? t("contentScrolls") : undefined),
        "aria-labelledby": ariaLabelledBy,
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

  const visible =
    hoverable &&
    edges.overflows &&
    !edges.long &&
    !(edge === "start" ? edges.atStart : edges.atEnd);
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
