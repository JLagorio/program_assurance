import { Button } from "../components/button";
import { Count } from "../components/badge";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../components/popover";
import { Scroller, ScrollerArrow, ScrollerViewport } from "../components/scroller";
import { SearchField } from "../components/search-field";
import { Separator } from "../components/separator";
import { token } from "../generated/tokens";
import { useLedgerLocale } from "../lib/locale";
import { MoreHorizontal } from "lucide-react";
import {
  type ComponentProps,
  type FocusEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";

export type ToolbarProps = Omit<ComponentProps<"div">, "children" | "placeholder" | "onSearch"> & {
  /** The query, when the caller owns it. Pair it with `onSearch`. */
  search?: string | undefined;
  /** The first query, when the toolbar owns it: pass `onSearch` without `search`. */
  defaultSearch?: string | undefined;
  /** Called with the query as the reader types, clears or presses Escape. Without it there is no search field. */
  onSearch?: ((value: string) => void) | undefined;
  /** What is searched: the field's placeholder and its accessible name. "Search" when unsaid. */
  placeholder?: string | undefined;
  /** Saved-view controls immediately after search. They stay visible and scroll inside their space. */
  views?: ReactNode;
  /** Display controls, such as grouping, columns and settings, at the end. They fold into More, after the filters, when the row cannot hold them. */
  children?: ReactNode;
  /** Filters, after saved views. They are the first to move into More when the row cannot hold everything. */
  filters?: ReactNode;
  /**
   * How many filters apply, such as a DataTable's `table.state.columnFilters.length`. While the
   * filters are folded, More shows the number and says it in its name ("More filters, 2 applied"),
   * so a folded filter still shows the list is narrowed. Nothing shows at 0.
   */
  activeFilters?: number | undefined;
  /** The row's actions, last. They always stay visible with their full labels. */
  actions?: ReactNode;
  className?: string | undefined;
};

/**
 * What has moved into More and whether the row has become two. On two rows, `reserve` is the
 * room the search leaves the saved views beside it, and `squeeze` is the views' width when they
 * cannot show whole there (0 when they can).
 */
type Fold = {
  filters: boolean;
  display: boolean;
  rows: 1 | 2;
  reserve: number;
  squeeze: number;
};
const unfolded: Fold = { filters: false, display: false, rows: 1, reserve: 0, squeeze: 0 };
const sameFold = (a: Fold, b: Fold) =>
  a.filters === b.filters &&
  a.display === b.display &&
  a.rows === b.rows &&
  a.reserve === b.reserve &&
  a.squeeze === b.squeeze;

/** The narrowest the search gets while it shares one row with everything else. */
const searchMinimum = 160;
/**
 * The narrowest the search gets beside the saved views on the first of two rows. Below it, the
 * saved views scroll inside what is left.
 */
const searchBesideViews = 128;
/** More's width before it has rendered once. */
const moreEstimate = 72;
const moreSelector = "[data-toolbar-more]";
const focusable =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
/** Runs after two frames: after a popover's own attempt to return focus, which waits for one. */
const afterTwoFrames = (run: () => void) => {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(run);
  });
  return () => cancelAnimationFrame(frame);
};

/** The width a group asks for: what it holds side by side, not what it is squeezed to. */
function intrinsicWidth(row: HTMLElement | null) {
  if (!row) return 0;
  const items = Array.from(row.children).filter((child) => child.getClientRects().length);
  const gap = parseFloat(getComputedStyle(row).columnGap) || 8;
  return (
    items.reduce((width, child) => width + child.getBoundingClientRect().width, 0) +
    gap * Math.max(0, items.length - 1)
  );
}

/**
 * What the row's layout depends on that a render can change without a resize: the words it shows
 * and how many elements hold them. Neither reads layout, so a render that leaves both alone, such
 * as a keystroke in the search, costs no measurement. The search's value is not text content.
 */
function contentKey(row: HTMLElement) {
  return `${row.getElementsByTagName("*").length}:${row.textContent ?? ""}`;
}

/** The observer that keeps the fold current, and what it is watching. */
type Watch = { observer: ResizeObserver; targets: Set<Element> };

/**
 * Watch what the fold depends on: the row, each group in it and each saved view, so a group that
 * mounts, folds away or changes its content is measured again. Only the difference is observed or
 * released, because observing a target again reports it again.
 */
function follow(
  watch: Watch,
  row: HTMLElement,
  views: HTMLElement | null,
  groups: RefObject<HTMLElement | null>[],
) {
  const targets = new Set<Element>([row]);
  if (views) targets.add(views);
  for (const group of groups) if (group.current) targets.add(group.current);
  const viewport = views?.querySelector('[data-slot="scroller-viewport"]');
  if (viewport) for (const view of Array.from(viewport.children)) targets.add(view);
  for (const target of watch.targets) if (!targets.has(target)) watch.observer.unobserve(target);
  for (const target of targets) if (!watch.targets.has(target)) watch.observer.observe(target);
  watch.targets = targets;
}

/**
 * The saved views' width at full size, even while their strip scrolls or a control in it
 * truncates: the strip is laid out at max-content for one measurement and put back before paint.
 */
function naturalWidth(strip: HTMLElement | null) {
  const viewport = strip?.querySelector<HTMLElement>('[data-slot="scroller-viewport"]');
  const scroller = viewport?.parentElement;
  if (!viewport || !scroller) return intrinsicWidth(strip);
  // What the scroller adds around its viewport; the strip itself may be stretched past both.
  const around = scroller.getBoundingClientRect().width - viewport.getBoundingClientRect().width;
  const { flex, width } = viewport.style;
  viewport.style.flex = "none";
  viewport.style.width = "max-content";
  const natural = viewport.getBoundingClientRect().width;
  viewport.style.flex = flex;
  viewport.style.width = width;
  return Math.max(0, around) + natural;
}

/**
 * A folded group's width as one row, read inside More as it closes: the group is laid out as a
 * row at max-content for one measurement and put back before paint. It reads the layout width,
 * which the popover's animation does not scale, so a filter whose label grew or shrank in More is
 * measured as the row would hold it.
 */
function rowWidth(group: HTMLElement) {
  const { flexDirection, flexWrap, width } = group.style;
  group.style.flexDirection = "row";
  group.style.flexWrap = "nowrap";
  group.style.width = "max-content";
  const natural = group.offsetWidth;
  group.style.flexDirection = flexDirection;
  group.style.flexWrap = flexWrap;
  group.style.width = width;
  return natural;
}

/**
 * One row above a collection. It measures its container, including when a shell panel opens
 * beside it, and folds instead of stacking: filters move into More first, then the display
 * controls. When search, views, More and the actions still cannot share one row, the row wraps
 * into two in the same order: the search with the saved views, then More with the actions at the
 * end. When More and the actions cannot share the second row either, the actions take a line of
 * their own under More.
 */
export function Toolbar(toolbarProps: ToolbarProps) {
  const {
    search,
    defaultSearch,
    onSearch,
    placeholder,
    views,
    children,
    filters,
    activeFilters,
    actions,
    className,
    ref,
    ...props
  } = toolbarProps;
  // A caller that passes `search`, even while it is still undefined (a table's first global
  // filter), owns the query; only a toolbar given no `search` at all keeps its own.
  const keepsOwnQuery = !Object.hasOwn(toolbarProps, "search");
  const { t, formatNumber } = useLedgerLocale();
  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const viewRow = useRef<HTMLDivElement>(null);
  const filterRow = useRef<HTMLDivElement>(null);
  const displayRow = useRef<HTMLDivElement>(null);
  const actionRow = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  // The folded groups inside More while it is open. A filter the reader changes there can change
  // its width, so they are measured as More closes, while they are still on the page.
  const foldedFilters = useRef<HTMLDivElement>(null);
  const foldedDisplay = useRef<HTMLDivElement>(null);
  // The last width each foldable group asked for while it was in the row or, folded, in More, and
  // the saved views' natural width, which does not depend on the container and is read again only
  // when the views' content or fonts change (null until then).
  const widths = useRef({ filters: 0, display: 0, more: 0, views: null as number | null });
  // Whether focus was last in More: its trigger, its popover or a menu opened from inside it.
  // Kept from focus events, because a closing popover can drop focus to the page before the
  // fold is measured.
  const focusInMore = useRef(false);
  // Where focus goes once a fold has rendered: to More when the focused control folded away, or to
  // the first control that came back when More went away. It names the fold it waits for, because
  // another fold (a resize while More was open) can commit first.
  const refocus = useRef<{ to: "more" | "returned"; fold: Fold } | null>(null);
  const [fold, setFold] = useState<Fold>(unfolded);
  const [open, setOpen] = useState(false);
  const hasMore = fold.filters || fold.display;
  const twoRows = fold.rows === 2;

  // The fold is measured before paint when the fold, More or the row's content changes, and on the
  // frame after a resize. A render that changes none of them, such as a keystroke in the search or
  // a parent's new callbacks, reads no layout. One observer lives as long as the row, follows the
  // groups as they mount and fold, and measures through a ref that holds the current render.
  const measured = useRef<{ fold: Fold; open: boolean; content: string } | null>(null);
  const measureRef = useRef<() => void>(() => undefined);
  const watch = useRef<Watch | null>(null);
  const measure = () => {
    const element = root.current;
    if (!element) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 8;
    const cache = widths.current;
    if (filterRow.current) cache.filters = intrinsicWidth(filterRow.current);
    if (displayRow.current) cache.display = intrinsicWidth(displayRow.current);
    const trigger = element.querySelector<HTMLElement>(moreSelector);
    if (trigger) cache.more = trigger.getBoundingClientRect().width;
    const available = element.clientWidth;
    const searchWidth = onSearch ? searchMinimum : 0;
    cache.views ??= naturalWidth(viewRow.current);
    const viewsWidth = cache.views;
    const actionsWidth = intrinsicWidth(actionRow.current);
    const filtersWidth = filters ? cache.filters : 0;
    const displayWidth = children ? cache.display : 0;
    const more = cache.more || moreEstimate;
    const fits = (...parts: number[]) => {
      const present = parts.filter((width) => width > 0);
      const total = present.reduce((sum, width) => sum + width, 0);
      return total + gap * Math.max(0, present.length - 1) <= available;
    };
    // While More is open, what it holds stays in it; the row takes it back when More closes.
    const holdFilters = open && fold.filters;
    const holdDisplay = open && fold.display;
    const fitsAll = fits(searchWidth, viewsWidth, filtersWidth, displayWidth, actionsWidth);
    const foldFilters = !!filters && (!fitsAll || holdFilters);
    const foldDisplay =
      !!children &&
      (holdDisplay ||
        (!fitsAll &&
          !fits(searchWidth, viewsWidth, foldFilters ? more : 0, displayWidth, actionsWidth)));
    const folded = foldFilters || foldDisplay;
    const oneRow = fits(
      searchWidth,
      viewsWidth,
      foldFilters ? 0 : filtersWidth,
      folded ? more : 0,
      foldDisplay ? 0 : displayWidth,
      actionsWidth,
    );
    const rows = onSearch && !oneRow ? 2 : 1;
    // Two rows keep the one-row order: the search fills the first row up to the saved views, and
    // More and the actions start the second. The search keeps at least searchBesideViews; views
    // wider than the rest scroll inside their share. One spare pixel keeps both on the first row.
    let reserve = 0;
    let squeeze = 0;
    if (rows === 2 && viewsWidth > 0) {
      const share = Math.max(0, Math.min(viewsWidth, available - searchBesideViews - gap));
      if (share < viewsWidth) squeeze = Math.floor(share);
      reserve = Math.ceil((squeeze || viewsWidth) + gap) + 1;
    }
    const next: Fold = { filters: foldFilters, display: foldDisplay, rows, reserve, squeeze };
    if (sameFold(next, fold)) return;
    const doc = element.ownerDocument;
    const active = doc.activeElement;
    const lost = !active || active === doc.body;
    if (
      (foldFilters && !fold.filters && filterRow.current?.contains(active)) ||
      (foldDisplay && !fold.display && displayRow.current?.contains(active))
    )
      refocus.current = { to: "more", fold: next };
    else if (
      !folded &&
      (fold.filters || fold.display) &&
      (trigger?.contains(active) ||
        popup.current?.contains(active) ||
        (lost && focusInMore.current))
    )
      refocus.current = { to: "returned", fold: next };
    if (!folded) setOpen(false);
    setFold(next);
  };

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    // A resize folds on the next frame, so the fold's own layout never re-enters this observer.
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => measureRef.current());
    };
    const observer = new ResizeObserver((entries) => {
      // A saved view that changes size, or their strip while it is not squeezed, has new content.
      const strip = viewRow.current;
      const squeezed = !!measured.current?.fold.squeeze;
      if (
        strip &&
        entries.some(({ target }) => strip.contains(target) && (target !== strip || !squeezed))
      )
        widths.current.views = null;
      later();
    });
    watch.current = { observer, targets: new Set() };
    follow(watch.current, element, viewRow.current, [filterRow, displayRow, actionRow]);
    // A web font that arrives after the first measure changes every width without a render.
    const fonts = element.ownerDocument.fonts as FontFaceSet | undefined;
    const refont = () => {
      widths.current.views = null;
      later();
    };
    fonts?.addEventListener("loadingdone", refont);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      watch.current = null;
      fonts?.removeEventListener("loadingdone", refont);
    };
  }, []);

  useLayoutEffect(() => {
    measureRef.current = measure;
    const element = root.current;
    if (!element) return;
    const content = contentKey(element);
    const last = measured.current;
    measured.current = { fold, open, content };
    if (last && last.fold === fold && last.open === open && last.content === content) return;
    if (last?.content !== content) widths.current.views = null;
    if (watch.current)
      follow(watch.current, element, viewRow.current, [filterRow, displayRow, actionRow]);
    measure();
  });

  useLayoutEffect(() => {
    const pending = refocus.current;
    if (pending?.fold !== fold) return;
    refocus.current = null;
    const next =
      pending.to === "more"
        ? root.current?.querySelector<HTMLElement>(moreSelector)
        : (filterRow.current ?? displayRow.current)?.querySelector<HTMLElement>(focusable);
    if (!next) return;
    const doc = next.ownerDocument;
    const place = () => {
      if (next.isConnected && next !== doc.activeElement) next.focus({ preventScroll: true });
    };
    place();
    // The popover that went away may still try to return focus to its trigger, which is gone. If
    // that leaves focus on the page, it goes back to the control that came back.
    return afterTwoFrames(() => {
      if (!doc.activeElement || doc.activeElement === doc.body) place();
    });
  }, [fold]);

  // Focus that moves to another element leaves More; a control inside More takes it back at once
  // through its own focus event, which reaches here through the popover's portal. Focus that falls
  // to the page stays counted, because More closing or folding away drops it there, unless the
  // reader put it there by clicking away from the closed trigger.
  const trackFocus = {
    onFocus: () => {
      focusInMore.current = true;
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      const fromClosedTrigger = !open && event.currentTarget.matches(moreSelector);
      if (event.relatedTarget || fromClosedTrigger) focusInMore.current = false;
    },
  };
  // When More closes, focus goes back to it if it was in More or fell to the page. When More has
  // folded away, or the reader moved focus elsewhere, the popover leaves focus alone.
  const finalFocus = () => {
    const trigger = root.current?.querySelector<HTMLElement>(moreSelector);
    return trigger?.isConnected && focusInMore.current ? trigger : false;
  };

  // More closes: what it held is measured as the row would hold it, before the row decides
  // whether to take it back.
  const closeMore = () => {
    const cache = widths.current;
    if (foldedFilters.current?.isConnected) cache.filters = rowWidth(foldedFilters.current);
    if (foldedDisplay.current?.isConnected) cache.display = rowWidth(foldedDisplay.current);
    setOpen(false);
  };

  const displayInRow = !!children && !fold.display;

  // The search narrows as the reader types, so Enter does nothing: inside a dialog's form it never
  // submits the form. Escape and the clear button empty it through `onSearch("")`. With `search`
  // the caller owns the query; without it the field keeps what the reader types.
  const searchField = onSearch ? (
    <SearchField
      // A caller that starts or stops passing `search` gets a new field rather than an input
      // that switches between keeping its own value and showing the caller's.
      key={keepsOwnQuery ? "own" : "caller"}
      size="small"
      className="min-w-0 flex-1"
      style={
        twoRows
          ? { flexBasis: fold.reserve ? `calc(100% - ${fold.reserve}px)` : "100%" }
          : { maxWidth: token("dimension.part.search") }
      }
      {...(keepsOwnQuery ? { defaultValue: defaultSearch ?? "" } : { value: search ?? "" })}
      onValueChange={(value) => onSearch(value)}
      placeholder={placeholder ?? t("search")}
      aria-label={placeholder ?? t("search")}
    />
  ) : null;

  const viewStrip = views ? (
    <div
      ref={viewRow}
      data-slot="toolbar-views"
      className="flex min-w-0 items-center"
      style={fold.squeeze ? { flex: `0 0 ${fold.squeeze}px` } : undefined}
    >
      <Scroller orientation="horizontal" className="min-w-0">
        <ScrollerViewport className="flex items-center gap-100">{views}</ScrollerViewport>
        <ScrollerArrow edge="start" />
        <ScrollerArrow edge="end" />
      </Scroller>
    </div>
  ) : null;

  const filterStrip =
    filters && !fold.filters ? (
      <div
        ref={filterRow}
        data-slot="toolbar-filters"
        className="flex items-center gap-100"
        style={{ minWidth: "max-content" }}
      >
        {filters}
      </div>
    ) : null;

  // A folded filter that applies still shows: More counts the applied filters and says so.
  const applied = fold.filters && activeFilters && activeFilters > 0 ? activeFilters : 0;
  const appliedCount = { count: formatNumber(applied) };
  const moreLabel = fold.display
    ? fold.filters
      ? applied
        ? t("moreFiltersAndDisplayApplied", appliedCount)
        : t("moreFiltersAndDisplay")
      : t("moreDisplay")
    : applied
      ? t("moreFiltersApplied", appliedCount)
      : t("moreFilters");
  const moreTitle = fold.filters
    ? fold.display
      ? t("filtersAndDisplay")
      : t("filters")
    : t("display");
  const moreControl = hasMore ? (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : closeMore())}>
      <PopoverTrigger
        {...trackFocus}
        render={
          <Button
            size="small"
            iconBefore={<MoreHorizontal />}
            aria-label={moreLabel}
            data-toolbar-more=""
            className="shrink-0"
          />
        }
      >
        {t("more")}
        {applied ? <Count value={applied} /> : null}
      </PopoverTrigger>
      <PopoverContent
        {...trackFocus}
        ref={popup}
        align="end"
        finalFocus={finalFocus}
        // PopoverContent keeps a tall More inside the window and scrolls it (maxHeight
        // var(--available-height), overflow-y-auto), so the toolbar adds neither.
        // A choice that closes a menu opened from inside More is done, and More closes with it, as a
        // parent menu would. A choice that keeps its menu open (a toggle, a submenu, an item that
        // does not close on click) keeps More open too.
        onClick={(event) => {
          const item = (event.target as Element).closest?.('[role^="menuitem"]');
          const menu = item?.closest('[role="menu"]');
          if (!item || !menu || item.getAttribute("aria-disabled") === "true") return;
          // The menu acts on the choice first; a frame later it is open or it is not.
          requestAnimationFrame(() => {
            if (!menu.isConnected || !menu.hasAttribute("data-open")) closeMore();
          });
        }}
      >
        <PopoverTitle>{moreTitle}</PopoverTitle>
        {fold.filters ? (
          <div
            ref={foldedFilters}
            data-slot="toolbar-filters"
            className="flex flex-col items-stretch gap-100"
          >
            {filters}
          </div>
        ) : null}
        {fold.display ? (
          <>
            {fold.filters ? <Separator isDecorative /> : null}
            <div
              {...(fold.filters ? { role: "group", "aria-label": t("display") } : undefined)}
              ref={foldedDisplay}
              data-slot="toolbar-display"
              className="flex flex-wrap items-center gap-100"
            >
              {children}
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  ) : null;

  const end =
    displayInRow || actions ? (
      <div
        data-slot="toolbar-end"
        // On two rows the end takes the rest of the second row after More, so the primary stays at
        // its end. It starts from its whole width, not from nothing: when More and the actions
        // cannot share that row, the actions take a line of their own under More instead of
        // overflowing onto it.
        className={cn(
          "flex min-w-0 max-w-full items-center justify-end gap-100",
          twoRows ? "flex-auto" : "ms-auto",
        )}
      >
        {displayInRow ? (
          <div
            ref={displayRow}
            data-slot="toolbar-display"
            className="flex shrink-0 items-center gap-100"
          >
            {children}
          </div>
        ) : null}
        {actions ? (
          // More actions than the whole row holds wrap here, their labels whole; the primary stays last.
          <div
            ref={actionRow}
            data-slot="toolbar-actions"
            className="flex min-w-0 flex-wrap items-center justify-end gap-100"
          >
            {actions}
          </div>
        ) : null}
      </div>
    ) : null;

  // One order at every width, so Tab and a screen reader read the same sequence on one row or two.
  // The caller's attributes first, then the row's own identity and layout, which they cannot undo.
  return (
    <div
      {...props}
      ref={setRoot}
      data-slot="toolbar"
      data-rows={fold.rows}
      className={cn("flex min-w-0 items-center gap-100", twoRows && "flex-wrap", className)}
    >
      {searchField}
      {viewStrip}
      {filterStrip}
      {moreControl}
      {end}
    </div>
  );
}
