import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Button } from "../components/button";
import { cn } from "../lib/cn";
import { mergeRefs } from "../layout/shell/context";
import { useFillWindow } from "../lib/use-fill-window";

export type ComparisonProps = Omit<ComponentProps<"div">, "children"> & {
  /** The working pane. Keep its element identity stable to retain drafts and position. */
  primary: ReactNode;
  /** An explicitly opened reference. Omit to show only the working pane. */
  secondary?: ReactNode;
  /** Accessible pane names and the narrow layout's switch labels. */
  primaryLabel: string;
  secondaryLabel: string;
  /** Selected pane on narrow layouts. Both remain mounted; only one is exposed. */
  activePane?: "primary" | "secondary" | undefined;
  onActivePaneChange?: ((pane: "primary" | "secondary") => void) | undefined;
  /** Initial primary share, clamped to 25–75 percent. Defaults to 50. */
  defaultRatio?: number | undefined;
  /** Reports pointer and keyboard resizing in percent. */
  onRatioChange?: ((ratio: number) => void) | undefined;
  /** Accessible name of the resize separator. */
  resizeLabel: string;
  /** Split at this container width in pixels; 640 by default. */
  splitAt?: number | undefined;
  /** Fill the remaining window and scroll each pane independently. */
  fill?: boolean | undefined;
};
const clamp = (value: number) => Math.max(25, Math.min(75, Number.isFinite(value) ? value : 50));

/** Two retained, independently scrolling panes; a pane switch when their own container narrows. */
export function Comparison({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  activePane,
  onActivePaneChange,
  defaultRatio = 50,
  onRatioChange,
  resizeLabel,
  splitAt = 640,
  fill = false,
  className,
  style,
  ref,
  ...props
}: ComparisonProps) {
  const own = useRef<HTMLDivElement>(null);
  const primaryPane = useRef<HTMLDivElement>(null);
  const secondaryPane = useRef<HTMLDivElement>(null);
  const positions = useRef({ primary: { top: 0, left: 0 }, secondary: { top: 0, left: 0 } });
  const resizing = useRef(false);
  const primaryId = useId();
  const secondaryId = useId();
  const rootRef = useMemo(() => mergeRefs(ref, own), [ref]);
  const [compact, setCompact] = useState(true);
  const [selected, setSelected] = useState<"primary" | "secondary">("primary");
  const [ratio, setRatio] = useState(() => clamp(defaultRatio));
  const hasPrimary = primary !== null && primary !== undefined && primary !== false;
  const hasSecondary = secondary !== null && secondary !== undefined && secondary !== false;
  const both = hasPrimary && hasSecondary;
  const active = hasPrimary ? (hasSecondary ? (activePane ?? selected) : "primary") : "secondary";
  const top = useFillWindow(own, fill);
  useLayoutEffect(() => {
    const element = own.current;
    if (!element) return;
    let settle = 0;
    let previousSize = `${element.clientWidth}:${element.clientHeight}`;
    setCompact(element.clientWidth < splitAt);
    const measure = () => {
      const size = `${element.clientWidth}:${element.clientHeight}`;
      if (size === previousSize) return;
      previousSize = size;
      resizing.current = true;
      setCompact(element.clientWidth < splitAt);
      cancelAnimationFrame(settle);
      settle = requestAnimationFrame(() => {
        for (const [name, pane] of [
          ["primary", primaryPane.current],
          ["secondary", secondaryPane.current],
        ] as const) {
          if (pane && !pane.hidden) {
            pane.scrollTop = positions.current[name].top;
            pane.scrollLeft = positions.current[name].left;
          }
        }
        resizing.current = false;
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(settle);
    };
  }, [splitAt]);
  useLayoutEffect(() => {
    for (const [name, pane] of [
      ["primary", primaryPane.current],
      ["secondary", secondaryPane.current],
    ] as const) {
      if (pane && !pane.hidden) {
        pane.scrollTop = positions.current[name].top;
        pane.scrollLeft = positions.current[name].left;
      }
    }
  }, [compact, active, both]);
  const remember = (name: "primary" | "secondary", pane: HTMLDivElement) => {
    if (!resizing.current && !pane.hidden)
      positions.current[name] = { top: pane.scrollTop, left: pane.scrollLeft };
  };
  const choose = (pane: "primary" | "secondary") => {
    for (const [name, element] of [
      ["primary", primaryPane.current],
      ["secondary", secondaryPane.current],
    ] as const) {
      if (element && !element.hidden) remember(name, element);
    }
    setSelected(pane);
    onActivePaneChange?.(pane);
  };
  const resize = (value: number) => {
    const next = clamp(value);
    setRatio(next);
    onRatioChange?.(next);
  };
  const start = useRef<number | null>(null);
  const pointerRatio = (clientX: number) => {
    const element = own.current;
    if (!element) return ratio;
    const bounds = element.getBoundingClientRect();
    const fraction = (clientX - bounds.left) / bounds.width;
    return 100 * (getComputedStyle(element).direction === "rtl" ? 1 - fraction : fraction);
  };
  return (
    <div
      {...props}
      ref={rootRef}
      className={cn("flex min-w-0 flex-col gap-100", fill && "fill-window", className)}
      style={{ ...(fill ? ({ "--fill-top": `${top}px` } as CSSProperties) : {}), ...style }}
      data-slot="comparison"
      data-layout={both && !compact ? "split" : "single"}
    >
      {both && compact && (
        <div
          role="group"
          aria-label={`${primaryLabel} / ${secondaryLabel}`}
          className="flex shrink-0 flex-wrap gap-050"
        >
          <Button
            size="small"
            variant="subtle"
            aria-controls={primaryId}
            aria-pressed={active === "primary"}
            onClick={() => choose("primary")}
          >
            {primaryLabel}
          </Button>
          <Button
            size="small"
            variant="subtle"
            aria-controls={secondaryId}
            aria-pressed={active === "secondary"}
            onClick={() => choose("secondary")}
          >
            {secondaryLabel}
          </Button>
        </div>
      )}
      <div
        className="grid min-h-0 min-w-0 flex-1 gap-x-050"
        style={{
          gridTemplateColumns:
            both && !compact
              ? `minmax(0, ${ratio}fr) auto minmax(0, ${100 - ratio}fr)`
              : "minmax(0, 1fr)",
        }}
      >
        <div
          id={primaryId}
          ref={primaryPane}
          onScroll={(event) => remember("primary", event.currentTarget)}
          style={{ overflowAnchor: "none" }}
          role="region"
          aria-label={primaryLabel}
          hidden={!hasPrimary || (compact && both && active !== "primary")}
          tabIndex={0}
          className="min-h-0 min-w-0 overflow-auto p-050 outline-none focus-visible:outline-field-focused"
          data-slot="comparison-primary"
        >
          {primary}
        </div>
        {both && !compact && (
          <div
            role="separator"
            tabIndex={0}
            aria-label={resizeLabel}
            aria-orientation="vertical"
            aria-controls={primaryId}
            aria-valuemin={25}
            aria-valuemax={75}
            aria-valuenow={Math.round(ratio)}
            className="w-100 touch-none cursor-col-resize border-s border-default focus-visible:outline-focused"
            data-slot="comparison-resize"
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              start.current = ratio;
              event.currentTarget.setPointerCapture(event.pointerId);
              event.preventDefault();
              event.currentTarget.focus();
            }}
            onPointerMove={(event) => {
              if (start.current !== null) resize(pointerRatio(event.clientX));
            }}
            onPointerUp={(event) => {
              if (start.current === null) return;
              start.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              if (start.current !== null) resize(start.current);
              start.current = null;
            }}
            onKeyDown={(event) => {
              const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
              const step = event.shiftKey ? 10 : 2;
              let next: number | undefined;
              if (event.key === "ArrowLeft") next = ratio + (rtl ? step : -step);
              if (event.key === "ArrowRight") next = ratio + (rtl ? -step : step);
              if (event.key === "Home") next = 25;
              if (event.key === "End") next = 75;
              if (event.key === "Enter") next = 50;
              if (event.key === "Escape" && start.current !== null) {
                next = start.current;
                start.current = null;
              }
              if (next !== undefined) {
                event.preventDefault();
                resize(next);
              }
            }}
          />
        )}
        <div
          id={secondaryId}
          ref={secondaryPane}
          onScroll={(event) => remember("secondary", event.currentTarget)}
          style={{ overflowAnchor: "none" }}
          role="region"
          aria-label={secondaryLabel}
          hidden={!hasSecondary || (compact && both && active !== "secondary")}
          tabIndex={0}
          className="min-h-0 min-w-0 overflow-auto p-050 outline-none focus-visible:outline-field-focused"
          data-slot="comparison-secondary"
        >
          {secondary}
        </div>
      </div>
    </div>
  );
}
