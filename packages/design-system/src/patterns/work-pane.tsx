import {
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import { Dot, type Tone } from "../components/badge";
import { Id } from "../components/id";
import { Item } from "../components/item";

/* Master-detail as mail clients draw it: the list on the start side holds still and is the
   navigation, the detail on the end side changes, and choosing never leaves the page. A list
   column at
   `dimension.layout.list`, its rows Items that select in place, the chosen one marked, and the
   detail beside it. */

/** The nearest ancestor a sticky element sticks to (one that scrolls or clips its overflow), or null when that is the page. */
function scrollerOf(node: HTMLElement): HTMLElement | null {
  const doc = node.ownerDocument;
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (el === doc.body || el === doc.documentElement) return null;
    const { overflowX, overflowY } = getComputedStyle(el);
    if ([overflowX, overflowY].some((value) => value !== "visible" && value !== "clip")) return el;
  }
  return null;
}

/* sticky-rail stops under the shell's header, which is right when the page scrolls. In a scroller of
   the pane's own the rail sticks to that scroller's top, below whatever its scroll-padding keeps
   clear for a sticky header (the panel's), and is at most the height left, so the list scrolls
   inside itself and its last rows stay reachable: the pane sets --rail-top and --rail-max-height,
   and keeps them as the scroller resizes. */
function useRailScroller(pane: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const node = pane.current;
    if (!node) return;
    const scroller = scrollerOf(node);
    if (!scroller) {
      node.style.removeProperty("--rail-top");
      node.style.removeProperty("--rail-max-height");
      return;
    }
    const update = () => {
      const { paddingTop, paddingBottom, scrollPaddingTop } = getComputedStyle(scroller);
      const top = parseFloat(scrollPaddingTop) || 0;
      const height =
        scroller.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom) - top;
      node.style.setProperty("--rail-top", `${top}px`);
      node.style.setProperty("--rail-max-height", `${Math.max(0, Math.floor(height))}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [pane]);
}

export type WorkPaneProps = {
  /** Above the list, staying put while the list scrolls: what the list is, and how many. It names the list's landmark. */
  listLabel?: ReactNode;
  /** The rows: WorkPane.Row, or Items that select in place. They stack in one list. */
  list: ReactNode;
  /** The detail of the chosen row, beside the list. */
  detail: ReactNode;
  /** What the detail shows when nothing is chosen: an Empty. */
  empty?: ReactNode;
  /** The list column in pixels, `dimension.layout.list` (340) by default: narrower for a list of short names. */
  listWidth?: number | undefined;
};

/** Master-detail. The list is the navigation and holds still; selecting never leaves the page.
    The pane measures its own width, not the window's: the list and the detail sit side by side
    from 768px of pane (a list column and a readable detail), and the list stacks above the detail
    below it, in a dialog, a panel or a page alike. Stacked, the pane is as tall as its content and
    the detail follows the list one space.300 below, not a window's height away. The pane fills
    its parent's width; a shrink-to-fit parent (inline-block, `w-fit`) gives it none to measure.
    Side by side, the list holds still where the reader scrolls: under the shell's header on a
    page, and at the top of a scroller of its own (a dialog's body, a panel, below the panel's
    header), never taller than that scroller, so its last rows stay reachable. */
function WorkPaneRoot({ list, detail, listLabel, empty, listWidth }: WorkPaneProps) {
  const labelId = useId();
  const pane = useRef<HTMLDivElement>(null);
  useRailScroller(pane);
  const style = listWidth
    ? ({ "--ds-dimension-layout-list": `${listWidth}px` } as CSSProperties)
    : undefined;
  return (
    // The container is the outer block. It takes its parent's full width and may shrink beside
    // siblings, so it stays measurable in a flex row or an items-start column, not only a block;
    // the grid inside reads it.
    <div ref={pane} data-slot="work-pane" className="@container/work-pane w-full min-w-0">
      <div
        className="grid grid-cols-1 gap-y-300 @3xl/work-pane:min-h-work @3xl/work-pane:grid-cols-list-detail"
        style={style}
      >
        <aside
          aria-labelledby={listLabel ? labelId : undefined}
          aria-label={listLabel ? undefined : "List"}
          className="@3xl/work-pane:sticky-rail @3xl/work-pane:overflow-y-auto @3xl/work-pane:border-e @3xl/work-pane:border-default @3xl/work-pane:pe-200"
        >
          {listLabel ? (
            <div id={labelId} className="sticky top-0 z-10 bg-surface-current pb-100 pt-025">
              {listLabel}
            </div>
          ) : null}
          <Item.Group size="compact">{list}</Item.Group>
        </aside>
        <div className="min-w-0 @3xl/work-pane:ps-300">{detail ?? empty}</div>
      </div>
    </div>
  );
}

export type WorkPaneRowProps = {
  /** The record's id, under the title with the meta. */
  id: ReactNode;
  /** The row's name, one line. */
  title: ReactNode;
  /** After the id, subtle: the state as a word, the method, how long ago. */
  meta?: ReactNode;
  /** The Dot before the title: the row's state as a colour. The meta carries the word. */
  tone?: Tone | undefined;
  /** The row whose detail is open. */
  isActive?: boolean | undefined;
  onSelect: () => void;
};

/** One row in a WorkPane list: an Item that selects in place, with a Dot for the state and the id under the title. */
function WorkPaneRow({ id, title, meta, tone = "neutral", isActive, onSelect }: WorkPaneRowProps) {
  return (
    <Item
      leading={<Dot tone={tone} />}
      title={title}
      description={
        <span className="flex min-w-0 items-baseline gap-100">
          <Id>{id}</Id>
          {meta ? <span className="truncate">{meta}</span> : null}
        </span>
      }
      onSelect={onSelect}
      isActive={isActive}
    />
  );
}

export const WorkPane = Object.assign(WorkPaneRoot, { Row: WorkPaneRow });
