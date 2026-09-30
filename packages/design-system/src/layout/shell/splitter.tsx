import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { MAIN, mainMinWidth, PANEL, PANEL_MIN } from "./context";

/** A width within an area's bounds: never under its minimum, never over `max` (half the viewport unless given). */
export const clampWidth = (width: number, min: number, max = window.innerWidth / 2) =>
  Math.round(Math.max(min, Math.min(width, max)));

const shown = (el: HTMLElement | null | undefined): el is HTMLElement =>
  !!el && el.getClientRects().length > 0;

/**
 * The widest `area` may be now: half the viewport, and never so wide that Main falls under its
 * minimum. It may take what Main has beyond that minimum; the side nav may also take what an open
 * panel has beyond the panel's own minimum, because the panel's column gives way to it (shell.css).
 */
export function maxAreaWidth(area: HTMLElement, min: number) {
  const half = window.innerWidth / 2;
  const root = area.closest<HTMLElement>('[data-slot="shell"]');
  const main = root?.querySelector<HTMLElement>(MAIN);
  if (!root || !shown(main)) return Math.max(min, Math.round(half));
  let room =
    area.getBoundingClientRect().width + main.getBoundingClientRect().width - mainMinWidth(root);
  const panel = root.querySelector<HTMLElement>(PANEL);
  if (area.dataset["shellArea"] === "sidenav" && shown(panel))
    room += Math.max(0, panel.getBoundingClientRect().width - PANEL_MIN);
  return Math.max(min, Math.round(Math.min(half, room)));
}

/* ---------- splitter ---------- */

export type ShellSplitterProps = {
  /** The accessible name; the handle is visually blank. Each splitter has a default. */
  label?: string | undefined;
  /** A resize begins: a drag that moves sideways, or a key that changes the width. */
  onResizeStart?: ((args: { initialWidth: number }) => void) | undefined;
  /** A resize ends: the pointer lets go, or the key's width is set. A key that changes nothing (Home at the minimum) reports neither. */
  onResizeEnd?: ((args: { initialWidth: number; finalWidth: number }) => void) | undefined;
};

/** One arrow press, `space.200`; with Shift, or Page Up and Page Down, four of them. */
const STEP = 16;
const LARGE_STEP = 64;

/** A drag handle on an area's inner edge. `direction` is which way a drag grows the area: 1 for the side nav, -1 for the panel. */
export function Splitter({
  label,
  min,
  direction,
  edge,
  setWidth,
  onResizeStart,
  onResizeEnd,
  onDoubleClick,
  inScroller,
}: ShellSplitterProps & {
  label: string;
  min: number;
  direction: 1 | -1;
  edge: "start" | "end";
  setWidth: (w: number) => void;
  /** Collapses the area: on a double-click and on Enter, the window-splitter pattern's optional key (the side nav). */
  onDoubleClick?: (() => void) | undefined;
  /** The area scrolls its own content (the panel): the handle holds still over the visible height instead of scrolling away with the content. */
  inScroller?: boolean | undefined;
}) {
  const { t } = useLedgerLocale();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; width: number; started: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [width, setMeasuredWidth] = useState(min);
  const [maxWidth, setMaxWidth] = useState(min);
  const [areaHeight, setAreaHeight] = useState<number | null>(null);
  const [controls, setControls] = useState<string | undefined>(undefined);
  // The area is the nearest shell area, so a wrapper around the splitter does not become what it measures.
  const area = () => ref.current?.closest<HTMLElement>("[data-shell-area]") ?? null;
  useEffect(() => {
    const el = area();
    if (!el) return;
    // The area's id is its skip link's target, so the separator can name what it resizes.
    setControls(el.id || undefined);
    const update = () => {
      setMeasuredWidth(Math.round(el.getBoundingClientRect().width));
      setMaxWidth(maxAreaWidth(el, min));
      setAreaHeight(el.clientHeight);
    };
    update();
    // Main as well as the area: opening the panel or the aside changes how far this area may grow.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    const main = el.closest('[data-slot="shell"]')?.querySelector(MAIN);
    if (main) observer.observe(main);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [min]);
  // A key's step lands at once: the grid's columns ease only when the panel opens or closes, so
  // the shell root holds its transition for the frames that draw the new width (shell.css), and
  // `aria-valuenow` says the new width as the key is pressed instead of trailing the animation.
  const hold = useRef<{ root: HTMLElement; frame: number } | null>(null);
  const holdStill = () => {
    const root = ref.current?.closest<HTMLElement>('[data-slot="shell"]');
    if (!root) return;
    if (hold.current) cancelAnimationFrame(hold.current.frame);
    root.setAttribute("data-shell-resizing", "");
    const release = () => {
      hold.current = null;
      root.removeAttribute("data-shell-resizing");
    };
    hold.current = {
      root,
      frame: requestAnimationFrame(() => {
        if (hold.current) hold.current.frame = requestAnimationFrame(release);
      }),
    };
  };
  useEffect(
    () => () => {
      if (!hold.current) return;
      cancelAnimationFrame(hold.current.frame);
      hold.current.root.removeAttribute("data-shell-resizing");
    },
    [],
  );
  const measure = () => area()?.getBoundingClientRect().width ?? min;
  const clamp = (w: number) => {
    const el = area();
    return clampWidth(w, min, el ? maxAreaWidth(el, min) : undefined);
  };
  // The area lives on a logical edge; pointer coordinates and arrow keys are physical.
  const physicalDirection = () =>
    direction * (ref.current && getComputedStyle(ref.current).direction === "rtl" ? -1 : 1);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic pointer has no capture.
    }
    drag.current = { x: e.clientX, y: e.clientY, width: measure(), started: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.started) {
      // A resize begins when the pointer moves sideways, so a click, a double-click or a tap is not
      // one. A finger must move more sideways than up or down: a swipe that starts vertically is
      // the browser's scroll (pan-y) and never flashes the handle or reports a resize.
      if (dx === 0) return;
      if (e.pointerType !== "mouse" && Math.abs(dx) <= Math.abs(e.clientY - d.y)) return;
      d.started = true;
      setDragging(true);
      onResizeStart?.({ initialWidth: d.width });
    }
    setWidth(clamp(d.width + physicalDirection() * dx));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.started) return;
    setDragging(false);
    onResizeEnd?.({ initialWidth: d.width, finalWidth: measure() });
  };
  // A cancelled resize puts the width back: on a touch screen the browser may take a gesture for a
  // scroll after it began sideways, and the pixels it moved first do not stick.
  const onPointerCancel = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.started) return;
    setDragging(false);
    setWidth(d.width);
    onResizeEnd?.({ initialWidth: d.width, finalWidth: d.width });
  };
  // The window-splitter pattern: the arrows step (Shift for a larger step), Page Up and Page Down
  // grow and shrink by the larger step, Home goes to the minimum, End to the maximum, and Enter
  // collapses the area where it can collapse.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Enter" && onDoubleClick) {
      e.preventDefault();
      onDoubleClick();
      return;
    }
    const initialWidth = Math.round(measure());
    const step = e.shiftKey ? LARGE_STEP : STEP;
    const target =
      e.key === "ArrowRight"
        ? initialWidth + physicalDirection() * step
        : e.key === "ArrowLeft"
          ? initialWidth - physicalDirection() * step
          : e.key === "PageUp"
            ? initialWidth + LARGE_STEP
            : e.key === "PageDown"
              ? initialWidth - LARGE_STEP
              : e.key === "Home"
                ? min
                : e.key === "End"
                  ? Number.POSITIVE_INFINITY
                  : null;
    if (target === null) return;
    e.preventDefault();
    const finalWidth = clamp(target);
    // The key sets the width it lands on, which keeps a width the layout had narrowed (End beside
    // a wide side nav) as the reader's own; only a change is reported as a resize.
    const changed = finalWidth !== initialWidth;
    if (changed) onResizeStart?.({ initialWidth });
    holdStill();
    setWidth(finalWidth);
    setMeasuredWidth(finalWidth);
    if (changed) onResizeEnd?.({ initialWidth, finalWidth });
  };

  const handle = (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={Math.min(min, width)}
      aria-valuemax={Math.max(maxWidth, width)}
      aria-valuenow={width}
      aria-valuetext={t("pixelsWide", { width })}
      aria-controls={controls}
      tabIndex={0}
      data-slot="shell-splitter"
      data-dragging={dragging ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      style={inScroller && areaHeight !== null ? { height: areaHeight } : undefined}
      className={cn(
        // pan-y: a sideways drag resizes; a swipe that starts vertically scrolls what is under it.
        "absolute z-10 hidden w-050 cursor-col-resize select-none touch-pan-y outline-none transition-colors duration-fast ease-standard hover:bg-brand-bold focus-visible:bg-brand-bold lg:block",
        inScroller ? "top-0" : "inset-y-0",
        // Where a pointer is coarse, ::before widens the 4px handle into a band a finger can find,
        // grown away from the area's content: the side nav's reaches 20px into the page's 24px
        // gutter, so the nav's items and scrollbar keep their edge. The panel clips anything
        // outside it, so its band grows inward and stops at the panel's 16px padding, which the
        // handle sits in: the panel's first line of content keeps its edge, and Main, outside the
        // panel, is never under it.
        "any-pointer-coarse:before:absolute any-pointer-coarse:before:inset-y-0 any-pointer-coarse:before:start-0",
        edge === "end"
          ? "end-0 any-pointer-coarse:before:w-300"
          : "start-0 any-pointer-coarse:before:w-200",
        dragging && "bg-brand-bold",
      )}
    />
  );
  // In an area that scrolls, an absolute handle would scroll away with the content. A sticky anchor
  // of no height holds it at the top of the area's visible box instead, and the handle takes the
  // area's visible height, so it stays put and reaches the bottom at every scroll position. It
  // paints over the area's sticky header, which starts at the same edge. The anchor must be the
  // area's own child, as the panel's first child is.
  return inScroller ? (
    <div data-slot="shell-splitter-anchor" className="sticky top-0 z-20 h-0 shrink-0">
      {handle}
    </div>
  ) : (
    handle
  );
}
