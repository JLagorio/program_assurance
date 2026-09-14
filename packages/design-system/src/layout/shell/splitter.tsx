import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";

/** A width within an area's bounds: never under its minimum, never over half the viewport. */
export const clampWidth = (width: number, min: number) =>
  Math.round(Math.min(Math.max(width, min), window.innerWidth / 2));

/* ---------- splitter ---------- */

export type ShellSplitterProps = {
  /** The accessible name; the handle is visually blank. Each splitter has a default. */
  label?: string | undefined;
  onResizeStart?: ((args: { initialWidth: number }) => void) | undefined;
  onResizeEnd?: ((args: { initialWidth: number; finalWidth: number }) => void) | undefined;
};

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
}: ShellSplitterProps & {
  label: string;
  min: number;
  direction: 1 | -1;
  edge: "start" | "end";
  setWidth: (w: number) => void;
  onDoubleClick?: (() => void) | undefined;
}) {
  const { t } = useLedgerLocale();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [width, setMeasuredWidth] = useState(min);
  const [maxWidth, setMaxWidth] = useState(min);
  // The area is the nearest shell area, so a wrapper around the splitter does not become what it measures.
  const area = () => ref.current?.closest<HTMLElement>("[data-shell-area]") ?? null;
  useEffect(() => {
    const el = area();
    if (!el) return;
    const update = () => {
      setMeasuredWidth(Math.round(el.getBoundingClientRect().width));
      setMaxWidth(Math.max(min, Math.round(window.innerWidth / 2)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [min]);
  const measure = () => area()?.getBoundingClientRect().width ?? min;
  const clamp = (w: number) => clampWidth(w, min);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic pointer has no capture.
    }
    drag.current = { x: e.clientX, width: measure() };
    setDragging(true);
    onResizeStart?.({ initialWidth: drag.current.width });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setWidth(clamp(drag.current.width + direction * (e.clientX - drag.current.x)));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const initialWidth = drag.current.width;
    drag.current = null;
    setDragging(false);
    onResizeEnd?.({ initialWidth, finalWidth: measure() });
  };
  // The window-splitter pattern: the arrows step, Home goes to the minimum, End to the maximum.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const initialWidth = measure();
    const target =
      e.key === "ArrowRight"
        ? initialWidth + direction * 16
        : e.key === "ArrowLeft"
          ? initialWidth - direction * 16
          : e.key === "Home"
            ? min
            : e.key === "End"
              ? Number.POSITIVE_INFINITY
              : null;
    if (target === null) return;
    e.preventDefault();
    const finalWidth = clamp(target);
    setWidth(finalWidth);
    onResizeEnd?.({ initialWidth, finalWidth });
  };

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={Math.min(min, width)}
      aria-valuemax={Math.max(maxWidth, width)}
      aria-valuenow={width}
      aria-valuetext={t("pixelsWide", { width })}
      tabIndex={0}
      data-slot="shell-splitter"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute inset-y-0 z-10 hidden w-050 cursor-col-resize select-none touch-none outline-none transition-colors duration-fast ease-standard hover:bg-brand-bold focus-visible:bg-brand-bold lg:block",
        edge === "end" ? "end-0" : "start-0",
        dragging && "bg-brand-bold",
      )}
    />
  );
}
