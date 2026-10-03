import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * Package-internal: the cell a Truncate sits in shows a cut value whole itself. A Table's body cell
 * that truncates sets it, since the table's one reveal (on hover, on keyboard focus and after a
 * long press) shows a cut part of the cell whole; a Truncate there mounts no tooltip of its own, so
 * a register of status badges and names mounts one tooltip, not one per cell.
 */
export const CellRevealsCut = createContext(false);

/* Overflow-aware truncation. The text is cut with CSS; the whole of it stays in the DOM, so a
   screen reader reads it all. The eye gets the rest from a tooltip that opens only while the text
   is actually cut: on hover, on keyboard focus inside it (a TextLink in a KeyValue value), and on
   keyboard focus of the link or button it sits in (a name inside a TextLink). The tooltip is a
   visual copy of text that is already there, so it is hidden from assistive technology. */

export type TruncateLines = 1 | 2 | 3;

/* One line clips across only (`overflow-x: clip`), so a control inside keeps its focus ring and
   its touch area above and below the line; two and three lines clamp, which has to clip both. */
const lineClasses: Record<TruncateLines, string> = {
  1: "min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap",
  2: "min-w-0 line-clamp-2 break-words",
  3: "min-w-0 line-clamp-3 break-words",
};

/** What can take focus around a Truncate and so reveal it: a link, a button or a widget row. */
const FOCUSABLE_HOST =
  'a[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="treeitem"]';

/** Whether a child cuts its own text with an ellipsis: a link cut to a KeyValue's value. */
const childIsCut = (el: HTMLElement) =>
  Array.from(el.children).some(
    (child) =>
      child instanceof HTMLElement &&
      child.scrollWidth > child.clientWidth + 1 &&
      getComputedStyle(child).textOverflow === "ellipsis",
  );

/**
 * Whether the element's content is cut: wider than its box on one line, taller than its clamp on
 * several, or held by a child that truncates itself.
 */
function isCut(el: HTMLElement, maxLines: TruncateLines) {
  if (el.scrollWidth > el.clientWidth + 1) return true;
  // One line lets the block axis overflow on purpose (a focus ring, a touch area), so only the
  // inline axis says whether it is cut.
  if (maxLines > 1) return el.scrollHeight > el.clientHeight + 1;
  return childIsCut(el);
}

const fullTextOf = (el: HTMLElement) => (el.textContent ?? "").replace(/\s+/g, " ").trim();

export type UseIsTruncatedOptions = {
  /** The clamp the element carries, as Text's `maxLines`: 1 compares widths, 2 and 3 heights as well. 1 by default. */
  maxLines?: TruncateLines | undefined;
  /** Stops measuring; the hook then reports `false`. */
  enabled?: boolean | undefined;
};

/**
 * Whether an element's text is cut by its truncation or clamp right now, or by a child that
 * truncates itself with an ellipsis (a link cut to a KeyValue's value). It measures after every
 * render and again whenever the element resizes or its text changes, so it follows a panel
 * opening, a column resizing and a value arriving. For an element you truncate yourself; a
 * Truncate reveals its own text.
 */
export function useIsTruncated(
  ref: RefObject<HTMLElement | null>,
  { maxLines = 1, enabled = true }: UseIsTruncatedOptions = {},
): boolean {
  const [truncated, setTruncated] = useState(false);
  const measure = useCallback(() => {
    const el = ref.current;
    setTruncated(Boolean(enabled && el && isCut(el, maxLines)));
  }, [enabled, maxLines, ref]);
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const mutation = new MutationObserver(measure);
    mutation.observe(el, { characterData: true, childList: true, subtree: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, [enabled, measure, ref]);
  return truncated;
}

export type TruncateProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** The text, or a composed value (a name and a code, a TextLink); the reveal shows its text. */
  children?: ReactNode | undefined;
  /** How many lines it keeps before the ellipsis, as Text's `maxLines`. 1 by default. */
  maxLines?: TruncateLines | undefined;
  /** What the reveal shows when the text is cut. Defaults to the element's own text, whitespace collapsed. */
  fullText?: string | undefined;
  /**
   * The element, with its own props: `<dd />`, `<p />`, a `Text`. A `span` set as a block by
   * default. A given element keeps its own display.
   */
  render?: ReactElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
};

/**
 * Text cut to one, two or three lines with an ellipsis, and the whole of it in a tooltip while it
 * is cut: on hover, and on keyboard focus of the link or button it sits in or of a control inside
 * it. Nothing is shown while the text fits. A `title` of your own replaces the tooltip. In a
 * Table's cell the table's own reveal shows a cut line whole, so a one-line Truncate there mounts
 * no tooltip of its own.
 */
export function Truncate(props: TruncateProps) {
  const cellReveals = useContext(CellRevealsCut);
  // The cell's reveal reads one line by its width and shows the element's own text: a clamp or
  // words of the caller's own keep the Truncate's tooltip.
  return cellReveals && (props.maxLines ?? 1) === 1 && props.fullText === undefined ? (
    <RevealedByCell {...props} />
  ) : (
    <OwnReveal {...props} />
  );
}

/**
 * A one-line Truncate in a cell that reveals it. Context crosses a portal, so a dialog, a card or a
 * menu opened from the cell carries the cell's context but not its reveal: a Truncate drawn outside
 * the cell finds no cell around it and shows itself whole instead.
 */
function RevealedByCell(props: TruncateProps) {
  const [inCell, setInCell] = useState(true);
  const probe = useCallback((node: HTMLElement | null) => {
    if (node && !node.closest("td, th")) setInCell(false);
  }, []);
  return inCell ? <CutInCell {...props} probe={probe} /> : <OwnReveal {...props} />;
}

/** The cut element alone, marked for the cell's reveal. */
function CutInCell({
  maxLines = 1,
  fullText: _fullText,
  render,
  className,
  children,
  ref,
  probe,
  ...props
}: TruncateProps & { probe: (node: HTMLElement | null) => void }) {
  return useRender({
    render: render ?? <span />,
    ref: ref ? [ref, probe] : probe,
    props: mergeProps<"span">(props, {
      className: cn(!render && "block", lineClasses[maxLines], className),
      children,
      "data-slot": "truncate",
      "data-max-lines": maxLines,
      // The table's reveal shows a Truncate so marked; any other reveals itself.
      "data-reveal": "cell",
    } as ComponentPropsWithoutRef<"span">),
  });
}

function OwnReveal({
  maxLines = 1,
  fullText,
  render,
  className,
  children,
  id,
  title,
  ref,
  ...props
}: TruncateProps) {
  const generatedId = useId();
  const triggerId = id ?? `truncate-${generatedId}`;
  const elementRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState("");
  // A caller's own title is the reveal; a second, drawn one would stack on it.
  const reveals = title === undefined;

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const reveal = useCallback(() => {
    const el = elementRef.current;
    if (!reveals || !el || !isCut(el, maxLines)) return;
    const text = fullText ?? fullTextOf(el);
    if (!text) return;
    setShown(text);
    setOpen(true);
  }, [fullText, maxLines, reveals]);

  // Keyboard focus on the link or button around the text reveals it too. Focus inside the text
  // (a TextLink in the value) reaches the trigger's own focus handling.
  useEffect(() => {
    const host = elementRef.current?.parentElement?.closest<HTMLElement>(FOCUSABLE_HOST);
    if (!reveals || !host) return;
    const onFocus = () => {
      if (host.matches(":focus-visible")) reveal();
    };
    const onBlur = () => setOpen(false);
    host.addEventListener("focus", onFocus);
    host.addEventListener("blur", onBlur);
    return () => {
      host.removeEventListener("focus", onFocus);
      host.removeEventListener("blur", onBlur);
    };
  }, [reveal, reveals]);

  return (
    <Tooltip
      open={open}
      triggerId={triggerId}
      onOpenChange={(next) => {
        if (next) reveal();
        else setOpen(false);
      }}
    >
      <TooltipTrigger
        {...(props as ComponentPropsWithoutRef<typeof TooltipTrigger>)}
        id={triggerId}
        title={title}
        ref={setRef}
        render={render ?? <span />}
        disabled={!reveals}
        className={cn(!render && "block", lineClasses[maxLines], className)}
        data-slot="truncate"
        data-max-lines={maxLines}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent aria-hidden data-slot="truncate-full-text" className="break-words">
        {shown}
      </TooltipContent>
    </Tooltip>
  );
}
