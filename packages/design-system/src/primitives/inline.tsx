import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { elementClasses, growClasses, shrinkClasses, type Grow, type Shrink } from "./_elements";
import { spaceClasses, type LayoutElement, type SpaceToken } from "./tokens";

/* Inline: `space`, `rowSpace` when wrapping, `alignBlock` with baseline, `alignInline`, `spread`,
   `grow`, `shrink`, `shouldWrap`, and `separator`, a string rendered between children, never on a
   list element. Plus `display` for a row that sits inside a run of text, and no `style`: a
   computed dimension is a Box's. */

const alignBlock = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
} as const;
const alignInline = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

export type InlineProps = {
  /** The element: a container, a list (`ul`, `ol`) or a list part (`li`). Never a link or a button. */
  as?: LayoutElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** Space between children on the inline axis. */
  space?: SpaceToken | undefined;
  /** Space between rows when wrapping. */
  rowSpace?: SpaceToken | undefined;
  /** Position along the block (vertical) axis. */
  alignBlock?: keyof typeof alignBlock | undefined;
  /** Position along the inline (horizontal) axis. */
  alignInline?: keyof typeof alignInline | undefined;
  /** Distribute children with the free inline space between them. */
  spread?: "space-between" | undefined;
  /** Wrap onto more rows when the children do not fit. Off, they overflow. */
  shouldWrap?: boolean | undefined;
  /** Rendered between children, "·" or "/". Decorative and hidden from assistive tech. With `shouldWrap`, each child keeps the separator after it on its line, and a separator that ends a line is hidden. Not on a list element (`ul`, `ol`, `dl`): a span between list items is not a list, so it is dropped, with a warning in the console. */
  separator?: ReactNode | undefined;
  /** As a flex item: `fill` takes the free space along its parent's main axis (the width in a row, the height in a column) and may shrink below its content, so a truncating child inside it cuts instead of overflowing; `hug`, the default, is as big as its children. */
  grow?: Grow | undefined;
  /** As a flex item: `none` keeps its size when the row runs out of room, for a fixed label such as an id; the default lets it shrink. */
  shrink?: Shrink | undefined;
  /** `inline-flex` keeps the row inline-level, so it can sit in a run of text: a chip, a count beside a label. */
  display?: "flex" | "inline-flex" | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

const lists = new Set<LayoutElement>(["ul", "ol", "dl"]);

const warned = new Set<string>();
/** A composition mistake said once in the console, never thrown: the row still renders. */
function useWarnOnce(when: boolean, message: string) {
  useEffect(() => {
    if (!when || warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [when, message]);
}

/* A wrapping row with a separator keeps each child and the separator after it together, so no
   line starts with a separator, and hides the separator that ends a line: after every render,
   whenever the row resizes and whenever a pair does (a child that loads its name, a relative date
   that updates itself, the face swapping in), a pair whose next pair starts on a lower line marks
   its separator. Marking changes only visibility, so it never resizes what it observes. */
function useLineEndSeparators(row: RefObject<HTMLElement | null>, enabled: boolean) {
  const observer = useRef<ResizeObserver | null>(null);
  const mark = useCallback(() => {
    const el = row.current;
    if (!enabled || !el) return;
    const pairs = Array.from(el.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.dataset["slot"] === "inline-item",
    );
    pairs.forEach((pair, i) => {
      observer.current?.observe(pair); // idempotent for a pair already observed
      const separator = pair.querySelector<HTMLElement>(':scope > [data-slot="inline-separator"]');
      if (!separator) return;
      const next = pairs[i + 1];
      const ends = next
        ? next.getBoundingClientRect().top >= pair.getBoundingClientRect().bottom - 0.5
        : false;
      separator.toggleAttribute("data-line-end", ends);
    });
  }, [enabled, row]);
  useLayoutEffect(mark);
  useLayoutEffect(() => {
    const el = row.current;
    if (!enabled || !el) return;
    const resize = new ResizeObserver(mark);
    observer.current = resize;
    resize.observe(el);
    mark(); // observes the pairs already rendered
    return () => {
      resize.disconnect();
      observer.current = null;
    };
  }, [enabled, mark, row]);
}

/** Horizontal layout. Children sit left to right with one token of space between them. */
export function Inline({
  as = "div",
  space,
  rowSpace,
  alignBlock: ab,
  alignInline: ai,
  spread,
  shouldWrap,
  separator,
  grow,
  shrink,
  display = "flex",
  className,
  children,
  ref,
  ...rest
}: InlineProps) {
  const Tag = as as ElementType;
  const items = Children.toArray(children); // toArray already drops null, undefined and booleans
  const isList = lists.has(as);
  const separated = Boolean(separator) && !isList;
  const paired = separated && Boolean(shouldWrap);
  useWarnOnce(
    Boolean(separator) && isList,
    `Ledger: an Inline rendered as a ${as} draws no separator, since a span between its items would break the list. Separate the words inside each item, or render the row as a div.`,
  );
  const rowRef = useRef<HTMLElement | null>(null);
  useLineEndSeparators(rowRef, paired);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      rowRef.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
      return undefined;
    },
    [ref],
  );
  const gapX = space && spaceClasses.gapX[space];
  return (
    <Tag
      ref={setRef}
      className={cn(
        display === "inline-flex" ? "inline-flex flex-row" : "flex flex-row",
        gapX,
        rowSpace ? spaceClasses.gapY[rowSpace] : space && spaceClasses.gapY[space],
        ab && alignBlock[ab],
        ai && alignInline[ai],
        spread === "space-between" && "justify-between",
        shouldWrap && "flex-wrap",
        grow && growClasses[grow],
        shrink && shrinkClasses[shrink],
        elementClasses(as),
        className,
      )}
      {...rest}
    >
      {paired
        ? items.map((child, i) => (
            <span
              key={isValidElement(child) ? child.key : i}
              data-slot="inline-item"
              className={cn("flex flex-row", gapX, ab && alignBlock[ab])}
            >
              {child}
              {i < items.length - 1 ? (
                <span
                  aria-hidden="true"
                  data-slot="inline-separator"
                  className="data-line-end:invisible"
                >
                  {separator}
                </span>
              ) : null}
            </span>
          ))
        : separated
          ? items.map((child, i) => (
              <Fragment key={isValidElement(child) ? child.key : i}>
                {child}
                {i < items.length - 1 ? <span aria-hidden="true">{separator}</span> : null}
              </Fragment>
            ))
          : children}
    </Tag>
  );
}
