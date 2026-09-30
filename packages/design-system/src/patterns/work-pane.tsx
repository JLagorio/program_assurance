import { ChevronLeft } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Dot, type Tone } from "../components/badge";
import { Button } from "../components/button";
import { Id } from "../components/id";
import { Item } from "../components/item";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { VisuallyHidden } from "../primitives/visually-hidden";

/* Master-detail as mail clients draw it: the list on the start side holds still and is the
   navigation, the detail on the end side changes, and choosing never leaves the page. A list
   column at `dimension.layout.list`, its rows Items that select in place, the chosen one marked,
   and the detail beside it. Narrower than 768px of pane it is a drill-in: the list, then the
   chosen row's detail in its place with a Back that returns to the row. */

/** Which pane a stacked WorkPane shows: the list, or the chosen row's detail in its place. */
export type WorkPaneView = "list" | "detail";

type PaneContext = {
  /** A row was chosen: show its detail (stacked) and remember the row for Back. */
  open: (row: HTMLElement | null) => void;
};
const WorkPaneContext = createContext<PaneContext | null>(null);

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

/* The container query decides the layout; the pane reads the grid it drew, so the drill-in and the
   columns never disagree about the width. */
function useStacked(
  pane: RefObject<HTMLDivElement | null>,
  grid: RefObject<HTMLDivElement | null>,
) {
  const [stacked, setStacked] = useState(false);
  useLayoutEffect(() => {
    const node = pane.current;
    const layout = grid.current;
    if (!node || !layout) return;
    const update = () =>
      setStacked(getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/).length < 2);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [pane, grid]);
  return stacked;
}

/* The list's rows as one Tab stop: each row's link or button is the element Item gives an id, the
   title's control (a collapsible row's chevron has none, its actions come after it). */
function rowControls(list: HTMLElement | null): HTMLElement[] {
  const group = list?.querySelector('[data-slot="item-group-list"]');
  if (!group) return [];
  return [...group.children].flatMap((row) => {
    const control = row.querySelector<HTMLElement>(":scope > div :is(a, button)[id]");
    return control ? [control] : [];
  });
}

/** A row's name as the reader sees it: without the id the name carries for a screen reader. */
function visibleName(control: HTMLElement) {
  const copy = control.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll("[data-work-pane-hidden]")) hidden.remove();
  return (copy.textContent ?? "").trim().toLowerCase();
}

export type WorkPaneProps = {
  /** What the list is: "Catalog controls". It names the list's landmark and the list itself, and stays put above the rows while they scroll. Text, or a VisuallyHidden when the dialog's title already says it. */
  listLabel?: ReactNode;
  /** Above the rows, under the label, staying put with it: the list's search, its filter, its count. Never its name, which is `listLabel`. */
  listToolbar?: ReactNode;
  /** The rows: WorkPane.Row, or Items that select in place. They stack in one list. */
  list: ReactNode;
  /** What the list shows when it has no rows: a compact Empty with the way out ("Clear the search"). */
  listEmpty?: ReactNode;
  /** The detail of the chosen row, beside the list or, stacked, in its place. Leave it undefined while nothing is chosen, and `empty` shows beside the list. */
  detail?: ReactNode;
  /** What the detail shows when nothing is chosen, beside the list: an Empty. Stacked, the list shows alone until a row is chosen. */
  empty?: ReactNode;
  /** The list column in pixels, `dimension.layout.list` (340) by default: narrower for a list of short names. */
  listWidth?: number | undefined;
  /** Stacked, the pane that shows. Controlled; a WorkPane.Row that is chosen asks for `detail` and Back for `list` through `onViewChange`. */
  view?: WorkPaneView | undefined;
  /** Stacked, the pane that shows first: `detail` when the pane opens on a chosen row. `list` by default. */
  defaultView?: WorkPaneView | undefined;
  /** Stacked, a row was chosen (`detail`) or Back pressed (`list`). */
  onViewChange?: ((view: WorkPaneView) => void) | undefined;
  /** Stacked, the Back button's words: "Back to controls". "Back to list" by default, from the locale. */
  backLabel?: string | undefined;
};

/** Master-detail. The list is the navigation and holds still; choosing never leaves the page.
    The pane measures its own width, not the window's: from 768px of pane the list and the detail
    sit side by side (a list column and a readable detail), in a dialog, a panel or a page alike.
    Narrower, the pane is a drill-in: the list alone, then the chosen row's detail in its place,
    with focus on the detail's first heading and a Back that returns focus to the row; a submit of
    the detail's form from outside the pane (a dialog's primary) brings the detail back. The list is
    one Tab stop: Up and Down, Home and End, and the first letters of a name move between rows,
    and the open row says so (`aria-current`). Side by side, the list holds still where the reader
    scrolls: under the shell's header on a page, and at the top of a scroller of its own (a
    dialog's body, a panel), never taller than that scroller, so its last rows stay reachable. The
    label and toolbar stay put above the rows, and a focused row always lands below them. */
function WorkPaneRoot({
  list,
  listEmpty,
  detail,
  listLabel,
  listToolbar,
  empty,
  listWidth,
  view: viewProp,
  defaultView = "list",
  onViewChange,
  backLabel,
}: WorkPaneProps) {
  const { t } = useLedgerLocale();
  const labelId = useId();
  const pane = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const detailPane = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  useRailScroller(pane);
  const stacked = useStacked(pane, grid);

  const [innerView, setInnerView] = useState<WorkPaneView>(defaultView);
  const view = viewProp ?? innerView;
  const hasDetail = detail !== undefined && detail !== null && detail !== false;
  const showList = !stacked || view === "list" || !hasDetail;
  const showDetail = !stacked || (view === "detail" && hasDetail);

  // Where focus goes after the next commit, and the row Back returns to. `quiet` shows the detail
  // without moving focus, for a submit that brought it back.
  const focusTo = useRef<WorkPaneView | null>(null);
  const quiet = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const stackedNow = useRef(stacked);
  stackedNow.current = stacked;

  const setView = useCallback(
    (next: WorkPaneView) => {
      if (viewProp === undefined) setInnerView(next);
      onViewChange?.(next);
    },
    [viewProp, onViewChange],
  );
  const context = useMemo<PaneContext>(
    () => ({
      open: (row) => {
        opener.current = row;
        if (stackedNow.current) focusTo.current = "detail";
        setView("detail");
      },
    }),
    [setView],
  );
  const goBack = () => {
    focusTo.current = "list";
    setView("list");
  };
  // The detail's form submitted while the list shows, from a primary outside the pane (a dialog's
  // footer): the detail comes back, and focus stays for the form, which takes it to a field that
  // needs fixing, or leaves it on the primary.
  const onDetailSubmit = () => {
    if (!stacked || showDetail || !hasDetail) return;
    quiet.current = true;
    setView("detail");
  };
  const rove = (controls: HTMLElement[], stop: HTMLElement) => {
    for (const control of controls) control.tabIndex = control === stop ? 0 : -1;
    lastFocused.current = stop;
  };

  // Focus onto the side that shows: the detail's first heading, or the row Back returns to (the
  // row that opened the detail, else the open row, else the first).
  const focusSide = (target: WorkPaneView) => {
    if (target === "detail") {
      const region = detailPane.current;
      if (!region) return;
      const heading = region.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6, [role='heading']");
      back.current?.scrollIntoView({ block: "nearest" });
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      } else {
        region.focus({ preventScroll: true });
      }
      return;
    }
    const controls = rowControls(aside.current);
    const chosen = opener.current;
    const row =
      (chosen?.isConnected ? controls.find((control) => chosen.contains(control)) : undefined) ??
      controls.find((control) => control.getAttribute("aria-current") === "true") ??
      controls[0];
    if (!row) {
      aside.current?.querySelector<HTMLElement>("input, button, a[href]")?.focus();
      return;
    }
    rove(controls, row);
    row.scrollIntoView({ block: "center" });
    row.focus({ preventScroll: true });
  };

  // A choice and Back move focus to the side they show, and so does a controlled view that changes
  // by other means. Before paint, so the side that hides never drops the reader's focus: when the
  // pane narrows under them (a resize, a zoom) it keeps the side they are on, and when the detail
  // goes while they are in it, focus returns to the list.
  const shownView = useRef(view);
  const wasStacked = useRef(stacked);
  useLayoutEffect(() => {
    let target = focusTo.current;
    if (!target && shownView.current !== view && !quiet.current) target = view;
    const narrowed = stacked && !wasStacked.current;
    shownView.current = view;
    wasStacked.current = stacked;
    focusTo.current = null;
    quiet.current = false;
    if (!stacked) return;
    if (!target) {
      const active = pane.current?.ownerDocument.activeElement ?? null;
      const holding: WorkPaneView | null =
        !showList && aside.current?.contains(active)
          ? "list"
          : !showDetail && detailPane.current?.contains(active)
            ? "detail"
            : null;
      if (!holding) return;
      if (narrowed && (holding === "list" || hasDetail)) {
        // A change the reader did not ask for: the view follows them, and focus stays put.
        shownView.current = holding;
        setView(holding);
        return;
      }
      target = holding === "list" ? "detail" : "list";
    }
    if (target === "detail" ? showDetail : showList) focusSide(target);
  });

  // The label and toolbar stay put over the rows: a focused row scrolls in below them. Stuck, the
  // header sits at its scroller's content edge, and a row scrolled into view lands at the
  // scroller's scroll-padding, so the margin is the header's height plus the difference.
  useLayoutEffect(() => {
    const node = pane.current;
    const bar = header.current;
    if (!node) return;
    if (!bar) {
      node.style.removeProperty("--work-pane-label");
      return;
    }
    const scroller = scrollerOf(bar);
    const update = () => {
      const style = scroller ? getComputedStyle(scroller) : null;
      const inset = style
        ? Math.max(0, parseFloat(style.paddingTop) - (parseFloat(style.scrollPaddingTop) || 0))
        : 0;
      const height = bar.getBoundingClientRect().height;
      node.style.setProperty("--work-pane-label", `${Math.ceil(height + inset)}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    if (scroller) observer.observe(scroller);
    return () => observer.disconnect();
  }, [listLabel, listToolbar, stacked]);

  // After every render the rows may have changed (a search, a filter): one of them keeps the Tab
  // stop, the one last focused, else the open row, else the first.
  useLayoutEffect(() => {
    const controls = rowControls(aside.current);
    if (!controls.length) return;
    const last = lastFocused.current;
    const stop =
      (last && controls.includes(last) ? last : undefined) ??
      controls.find((control) => control.getAttribute("aria-current") === "true") ??
      controls[0]!;
    const margin = "calc(var(--work-pane-label, 0px) + var(--ds-space-100))";
    for (const control of controls) {
      const tabIndex = control === stop ? 0 : -1;
      if (control.tabIndex !== tabIndex) control.tabIndex = tabIndex;
      if (control.style.scrollMarginTop !== margin) control.style.scrollMarginTop = margin;
    }
  });

  const typed = useRef({ text: "", at: 0 });
  const onListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const controls = rowControls(aside.current);
    const index = controls.indexOf(event.target as HTMLElement);
    if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    let next: HTMLElement | undefined;
    if (event.key === "ArrowDown") next = controls[Math.min(index + 1, controls.length - 1)];
    else if (event.key === "ArrowUp") next = controls[Math.max(index - 1, 0)];
    else if (event.key === "Home") next = controls[0];
    else if (event.key === "End") next = controls[controls.length - 1];
    else if (event.key.length === 1 && event.key !== " ") {
      const now = event.timeStamp;
      const text =
        (now - typed.current.at < 700 ? typed.current.text : "") + event.key.toLowerCase();
      typed.current = { text, at: now };
      const order = [...controls.slice(index + (text.length > 1 ? 0 : 1)), ...controls];
      next = order.find((control) => visibleName(control).startsWith(text));
      if (!next) return;
    } else return;
    event.preventDefault();
    if (!next) return;
    rove(controls, next);
    next.focus();
  };
  const onListFocus = (event: FocusEvent<HTMLElement>) => {
    const controls = rowControls(aside.current);
    const control = event.target as HTMLElement;
    if (controls.includes(control)) rove(controls, control);
  };

  const style = listWidth
    ? ({ "--ds-dimension-layout-list": `${listWidth}px` } as CSSProperties)
    : undefined;
  const listName = listLabel ? undefined : t("workPaneList");
  return (
    // The container is the outer block. It takes its parent's full width and may shrink beside
    // siblings, so it stays measurable in a flex row or an items-start column, not only a block;
    // the grid inside reads it.
    <WorkPaneContext.Provider value={context}>
      <div
        ref={pane}
        data-slot="work-pane"
        data-layout={stacked ? "stacked" : "split"}
        data-view={stacked ? (showDetail ? "detail" : "list") : undefined}
        className="@container/work-pane w-full min-w-0"
      >
        <div
          ref={grid}
          className="grid grid-cols-1 gap-y-300 @3xl/work-pane:min-h-work @3xl/work-pane:grid-cols-list-detail"
          style={style}
        >
          <aside
            ref={aside}
            aria-labelledby={listLabel ? labelId : undefined}
            aria-label={listName}
            className={cn(
              "min-w-0 @3xl/work-pane:sticky-rail @3xl/work-pane:overflow-y-auto @3xl/work-pane:border-e @3xl/work-pane:border-default @3xl/work-pane:pe-200",
              !showList && "hidden",
            )}
            onKeyDown={onListKeyDown}
            onFocus={onListFocus}
          >
            {listLabel || listToolbar ? (
              <div
                ref={header}
                className="sticky top-0 z-10 flex flex-col gap-100 bg-surface-current pb-100 pt-025"
              >
                {listLabel ? <div id={labelId}>{listLabel}</div> : null}
                {listToolbar}
              </div>
            ) : null}
            <Item.Group
              size="compact"
              empty={listEmpty}
              {...(listLabel ? { "aria-labelledby": labelId } : { "aria-label": listName })}
            >
              {list}
            </Item.Group>
          </aside>
          <div
            ref={detailPane}
            tabIndex={stacked ? -1 : undefined}
            data-slot="work-pane-detail"
            className={cn("min-w-0 outline-none @3xl/work-pane:ps-300", !showDetail && "hidden")}
            onSubmit={onDetailSubmit}
          >
            {stacked && showDetail ? (
              <div ref={back} className="pb-200">
                <Button
                  size="small"
                  variant="subtle"
                  iconBefore={<ChevronLeft className="rtl:rotate-180" />}
                  onClick={goBack}
                >
                  {backLabel ?? t("workPaneBack")}
                </Button>
              </div>
            ) : null}
            {hasDetail ? detail : empty}
          </div>
        </div>
      </div>
    </WorkPaneContext.Provider>
  );
}

type WorkPaneRowState =
  | {
      /** The Dot before the title: the row's state as a colour. A colour is never the state alone, so a tone other than `neutral` needs the `meta` that says it in words. */
      tone?: "neutral" | undefined;
      /** After the id, subtle: the state as a word, the method, how long ago. */
      meta?: ReactNode;
    }
  | { tone: Exclude<Tone, "neutral">; meta: ReactNode };

export type WorkPaneRowProps = WorkPaneRowState & {
  /** The record's id, under the title with the meta. It is also part of the row's name ("AC-2, Account management"), since rows can share a title. */
  id: ReactNode;
  /** The row's name, one line. */
  title: ReactNode;
  /** The row whose detail is open: a selected fill, and `aria-current` on its button. */
  isActive?: boolean | undefined;
  /** Chooses the row. Return a promise to open the detail once it settles (a guard that asks first), and resolve `false` to stay on the list. */
  onSelect: () => void | boolean | Promise<unknown>;
};

/** One row in a WorkPane list: an Item that selects in place, with a Dot for the state and the id under the title. Choosing it opens its detail; stacked, the detail takes the list's place. */
export function WorkPaneRow({
  id,
  title,
  meta,
  tone = "neutral",
  isActive,
  onSelect,
}: WorkPaneRowProps) {
  const { t } = useLedgerLocale();
  const pane = useContext(WorkPaneContext);
  const row = useRef<HTMLLIElement>(null);
  const choose = () => {
    const result = onSelect();
    if (result instanceof Promise)
      void result.then(
        (value) => {
          if (value !== false) pane?.open(row.current);
        },
        () => undefined,
      );
    else if (result !== false) pane?.open(row.current);
  };
  // The id and its separator are spoken with the title, in the locale's order, and not drawn: the
  // id shows under the title.
  const [before = "", after = ""] = t("workPaneRowName").split("{title}");
  const spoken = (text: string) => {
    if (!text) return null;
    const [head = "", tail = ""] = text.split("{id}");
    return (
      <VisuallyHidden data-work-pane-hidden="">
        {head}
        {text.includes("{id}") ? id : null}
        {tail}
      </VisuallyHidden>
    );
  };
  return (
    <Item
      ref={row}
      leading={<Dot tone={tone} />}
      title={
        <>
          {spoken(before)}
          {title}
          {spoken(after)}
        </>
      }
      description={
        <span className="flex min-w-0 items-baseline gap-100">
          <Id aria-hidden>{id}</Id>
          {meta ? <span className="truncate">{meta}</span> : null}
        </span>
      }
      onSelect={choose}
      isActive={isActive}
    />
  );
}

export const WorkPane = Object.assign(WorkPaneRoot, { Row: WorkPaneRow });
