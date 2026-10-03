import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/** Native navigation props and ref. Compose the ordered list explicitly. */
export type BreadcrumbProps = React.ComponentProps<"nav">;
/** Native list-item props and ref. Compose a link or current page inside the item. */
export type BreadcrumbItemProps = React.ComponentProps<"li">;
/** Native ordered-list props and ref, and how a trail wider than its container behaves. */
export type BreadcrumbListProps = React.ComponentProps<"ol"> & {
  /**
   * `collapse` keeps the trail on one line at the width of its container. When it does not fit,
   * the middle levels fold first, nearest the root first, behind an ellipsis whose menu lists them
   * as links. Then the parent's and the current page's names share what is left: the longer
   * shortens first, down to 80px, so the shorter keeps its whole name while it can. Then the root
   * folds, and last the parent, leaving the ellipsis and the page. A shortened name keeps its full
   * text as a title, a link never shrinks below 80px (or its whole name), and every level comes
   * back when the space does. Only `BreadcrumbPage` and a `BreadcrumbLink` whose children are text
   * shorten; a level composed from other content (an icon and a name, a plain span) keeps its
   * whole width or folds. The trail folds to the width its container gives it: a block, or a flex
   * item with `min-width: 0` (a wrapper in a flex row needs it too), including one that sizes to
   * its content beside an action.
   * `wrap` shows every level, wrapping onto further lines; each separator starts the line with the
   * level it leads to, never ending a line. Use it when the product composes its own disclosure.
   * @default "collapse"
   */
  overflow?: "collapse" | "wrap" | undefined;
};

type Overflow = NonNullable<BreadcrumbListProps["overflow"]>;
// Items, links, pages and separators lay themselves out for the list's mode. Outside a list they
// take the one-line layout, which is what they had before the list chose.
const OverflowContext = React.createContext<Overflow>("collapse");

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** The navigation landmark, named "Breadcrumb" (the `breadcrumb` message) unless `aria-label` names it; the caller owns the list, items, and separators. A base part: a PageHeader.Lead renders it as a record's trail, so its `data-slot` comes before the caller's props and the Lead keeps its name. */
function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  const { t } = useLedgerLocale();
  return (
    <nav
      aria-label={t("breadcrumb")}
      data-slot="breadcrumb"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

/* ---------- fitting the trail to its container ---------- */

type FoldedLevel = { label: string; href: string | null; control: HTMLElement | null };

/**
 * A folded level as the menu lists it: its name, and the control to activate in its place. The
 * name is the control's, so a badge or count beside the link does not run into it.
 */
function readLevel(item: HTMLElement): FoldedLevel {
  const control = item.querySelector<HTMLElement>(
    'a[href], button:not(:disabled), [role="link"]:not([aria-disabled="true"]), [role="button"]:not([aria-disabled="true"])',
  );
  const label = (control?.getAttribute("aria-label") ?? (control ?? item).textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    label,
    href: control instanceof HTMLAnchorElement ? control.getAttribute("href") : null,
    control,
  };
}

/** Removes the max-width a previous fit gave a shortened parent; other inline styles stay. */
function clearShortened(el: Element) {
  if (!(el instanceof HTMLElement) || !el.hasAttribute("data-shortened")) return;
  el.style.removeProperty("max-width");
  el.removeAttribute("data-shortened");
}

function unfold(list: HTMLElement) {
  for (const el of Array.from(list.children)) {
    clearShortened(el);
    if (el instanceof HTMLElement && el.hasAttribute("data-overflow"))
      el.style.removeProperty("min-height");
    for (const name of ["data-collapsed", "data-fill", "data-shown", "data-leading"])
      el.removeAttribute(name);
  }
  list.removeAttribute("data-fit");
  list.removeAttribute("data-measuring");
}

/**
 * Two names share `room`, each shortening no further than its floor. The longer gives way first,
 * so the shorter keeps its whole name whenever it can; only then does the shorter shorten. A whole
 * name reads better than two cut ones, and the longer name is the one a heading usually repeats.
 * A name that cannot shorten has its whole width as its floor. Returns the first name's width;
 * the second takes what is left.
 */
function share(
  first: number,
  second: number,
  room: number,
  firstFloor: number,
  secondFloor: number,
) {
  if (first + second <= room) return first;
  if (first >= second) return Math.max(firstFloor, room - second);
  return room - Math.max(secondFloor, room - first);
}

/**
 * Whether a level's name ends in an ellipsis when it has less room: only the current page and the
 * kit's link label, which a link given text alone wraps its name in, truncate. Other content, such
 * as a plain span, an icon beside a name or a composed control, would wrap instead, so its level
 * keeps its whole width or folds.
 */
function shortens(item: HTMLElement | undefined) {
  return !!item?.querySelector('[data-slot="breadcrumb-page"], [data-slot="breadcrumb-label"]');
}

type Fit = {
  /** The folded levels, in order. */
  folded: HTMLElement[];
  /**
   * When the list sizes to its content (a flex item beside an action, say) and ends narrower than
   * the room it was measured in, the nearest ancestor that keeps its width across the fit. Room
   * that comes back shows on that ancestor, not on the list.
   */
  bound: HTMLElement | null;
};

/**
 * Measures every level at its natural width in one synchronous pass, decides what folds and how
 * far the parent shortens, and marks the list items. The decision depends only on those widths
 * and the room the list has with every level shown, so it settles in one pass and cannot
 * oscillate.
 */
function fitTrail(list: HTMLOListElement): Fit {
  const children = Array.from(list.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
  const ellipsisItem = children.find((el) => el.hasAttribute("data-overflow"));
  // A level is an item with the separators after it.
  const levels: HTMLElement[][] = [];
  for (const el of children) {
    if (el === ellipsisItem) continue;
    clearShortened(el);
    const last = levels[levels.length - 1];
    if (el.getAttribute("data-slot") === "breadcrumb-separator" && last) last.push(el);
    else levels.push([el]);
  }
  const n = levels.length;
  if (n === 0) return { folded: [], bound: null };

  list.setAttribute("data-measuring", "");
  const width = (el: Element | undefined) => (el ? el.getBoundingClientRect().width : 0);
  const style = getComputedStyle(list);
  const inset = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"] as const;
  // With every level shown, a list that sizes to its content grows as far as its container lets
  // it, so its width is the room the trail has.
  const measured = width(list);
  const available =
    measured - inset.reduce((sum, key) => sum + (Number.parseFloat(style[key]) || 0), 0);
  const gap = Number.parseFloat(style.columnGap) || 0;
  const floor = Number.parseFloat(style.getPropertyValue("--ds-space-1000")) || 80;
  // A level's name, and what the whole level adds to the line: the name, its separators and the
  // gap after each.
  const names = levels.map((level) => width(level[0]));
  const spans = levels.map((level) => level.reduce((sum, el) => sum + width(el) + gap, 0));
  const ellipsis = width(ellipsisItem) + gap;
  // The tallest level, shown or folded. The ellipsis stands in for the folded levels at that
  // height, so a fold never changes the line's height: the page below stays put, and no observer
  // of an ancestor sees a resize from inside this one's callback.
  const tallest = Math.max(
    0,
    ...children.map((el) => (el === ellipsisItem ? 0 : el.getBoundingClientRect().height)),
  );
  const ancestors: [HTMLElement, number][] = [];
  for (let el = list.parentElement; el && ancestors.length < 16; el = el.parentElement)
    ancestors.push([el, width(el)]);
  list.removeAttribute("data-measuring");

  const pageAt = n - 1;
  const parentAt = n - 2;
  const page = names[pageAt] ?? 0;
  const parent = names[parentAt] ?? 0;
  const whole = page + parent;
  const pageFloor = shortens(levels[pageAt]?.[0]) ? Math.min(page, floor) : page;
  const parentFloor = shortens(levels[parentAt]?.[0]) ? Math.min(parent, floor) : parent;
  const floors = pageFloor + parentFloor;
  // The width left for the parent's and the page's names with levels from..to folded. The
  // separators after the last folded level stay, after the ellipsis.
  const room = (from: number, to: number) => {
    let line = -gap;
    for (let i = 0; i < n; i++) if (i < from || i > to) line += spans[i] ?? 0;
    if (to >= from) line += ellipsis + (spans[to] ?? 0) - (names[to] ?? 0) - gap;
    const parentShown = parentAt >= 0 && (parentAt < from || parentAt > to);
    return available + 0.01 - (line - page - (parentShown ? parent : 0));
  };

  // 1. Every level at its full name. 2. The middle levels fold, nearest the root first. 3. With
  // the middle folded, the parent and the page share the rest down to their floors. 4. The root
  // folds too. 5. The parent folds, and the page takes the rest.
  let from = 1;
  let to = 0;
  let shorten = false;
  if (room(1, 0) < whole) {
    let k = 1;
    while (k <= n - 3 && room(1, k) < whole) k++;
    if (k <= n - 3) to = k;
    else if (room(1, n - 3) >= floors) {
      to = n - 3;
      shorten = true;
    } else if (n >= 3 && room(0, n - 3) >= floors) {
      from = 0;
      to = n - 3;
      shorten = true;
    } else {
      from = 0;
      to = n - 2;
    }
  }

  const folded = levels.slice(from, to + 1);
  const hidden = new Set(
    folded.flatMap((level, i) => (i < folded.length - 1 ? level : level.slice(0, 1))),
  );
  // A level that folds while it holds focus hands focus to the ellipsis, which now lists it, so
  // the reader's place stays in the trail instead of falling to the page.
  const focused = list.ownerDocument.activeElement;
  const losesFocus =
    focused instanceof HTMLElement && [...hidden].some((el) => el.contains(focused));
  levels.forEach((level, i) => {
    for (const el of level) el.toggleAttribute("data-collapsed", hidden.has(el));
    // The page takes the width the others leave, which absorbs any sub-pixel rounding.
    level[0]?.toggleAttribute("data-fill", i === pageAt);
  });
  const parentItem = levels[parentAt]?.[0];
  if (shorten && parentItem && !hidden.has(parentItem)) {
    const fitted = share(parent, page, room(from, to), parentFloor, pageFloor);
    if (fitted < parent - 0.5) {
      parentItem.setAttribute("data-shortened", "");
      parentItem.style.maxWidth = `${Math.floor(fitted * 100) / 100}px`;
    }
  }
  ellipsisItem?.toggleAttribute("data-shown", hidden.size > 0);
  const lineHeight = `${tallest}px`;
  if (ellipsisItem && ellipsisItem.style.minHeight !== lineHeight)
    ellipsisItem.style.minHeight = lineHeight;
  // With the root folded, the ellipsis leads the line and the separator after it follows,
  // including in a two- or three-level trail where that separator is the root's own. Separators
  // are hidden from assistive technology, so the reading order is unchanged.
  ellipsisItem?.toggleAttribute("data-leading", hidden.size > 0 && from === 0);
  list.setAttribute("data-fit", "");
  if (losesFocus) ellipsisItem?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  // A list that ends narrower than its room sizes to its content; its container bounds it. A box
  // without width (display: contents) never reports a resize, so it is passed over.
  const bound =
    width(list) < measured - 0.5
      ? (ancestors.find(([el, before]) => before > 0 && Math.abs(width(el) - before) < 0.5)?.[0] ??
        null)
      : null;
  return { folded: folded.flatMap((level) => (level[0] ? [level[0]] : [])), bound };
}

const warned = new WeakSet<Element>();
/**
 * A trail has one current page, its last level. A router link that matches by path prefix marks
 * every ancestor current as well; said once per trail in the console, never thrown.
 */
function useOneCurrentPage(list: React.RefObject<HTMLOListElement | null>) {
  React.useEffect(() => {
    const el = list.current;
    if (!el || warned.has(el)) return;
    const current = Array.from(el.querySelectorAll('[aria-current="page"]'));
    const items = Array.from(el.children).filter(
      (child) => child.getAttribute("data-slot") === "breadcrumb-item",
    );
    const last = items[items.length - 1];
    const message =
      current.length > 1
        ? `Ledger: a breadcrumb trail marks ${current.length} levels as the current page. Only BreadcrumbPage, last, is the page; give a router link exact matching (activeOptions={{ exact: true }}) or render it through createLink(BreadcrumbLink).`
        : current.length === 1 && last && !last.contains(current[0] ?? null)
          ? "Ledger: a breadcrumb trail marks a level that is not its last as the current page. BreadcrumbPage is the last level."
          : null;
    if (!message) return;
    warned.add(el);
    console.warn(message);
  });
}

/** Children in order, with fragments opened so the ellipsis can sit after the first separator. */
function flatten(children: React.ReactNode, prefix = ""): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return [child];
    const key = `${prefix}${String(child.key)}`;
    if (child.type === React.Fragment) return flatten(child.props.children, `${key}/`);
    return [prefix ? React.cloneElement(child, { key }) : child];
  });
}

function isSeparator(node: React.ReactNode) {
  return React.isValidElement(node) && node.type === BreadcrumbSeparator;
}

/**
 * The ordered list. By default it keeps the trail on one line and folds levels behind an ellipsis
 * menu when its container is too narrow; `overflow="wrap"` wraps instead.
 */
function BreadcrumbList({
  className,
  overflow = "collapse",
  children,
  ref,
  ...props
}: BreadcrumbListProps) {
  const { t } = useLedgerLocale();
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const foldedRef = React.useRef<HTMLElement[]>([]);
  const [menu, setMenu] = React.useState<FoldedLevel[]>([]);
  const nodes = overflow === "collapse" ? flatten(children) : [];
  const firstSeparator = nodes.findIndex(isSeparator);
  const collapse = overflow === "collapse" && firstSeparator >= 0;

  const setListRef = React.useCallback(
    (node: HTMLOListElement | null) => {
      listRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  useOneCurrentPage(listRef);

  // The container's width and the levels' content (text, fonts as they load) decide the fold. Each
  // check runs before paint (layout effect, ResizeObserver, MutationObserver microtask), so a fold
  // never shows a frame of the wrong layout.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!collapse || !list) return;
    // The list is observed, and so is the ancestor that bounds it while it sizes to its content.
    let bound: HTMLElement | null = null;
    let watched: HTMLElement | null = null;
    let listObserved = true;
    let frame = 0;
    const fit = () => {
      const fitted = fitTrail(list);
      foldedRef.current = fitted.folded;
      bound = fitted.bound;
    };
    // Resizing an observed element inside its own resize callback, along either axis, or observing
    // a new one there, queues a notification the browser reports as a loop error. A fold changes
    // the height too when the level it hides or shows is taller than the line (a badge, an avatar).
    // Both wait for the next frame: observing again delivers the settled size, the same fold comes
    // out, and it stops there.
    const settle = () => {
      if (frame || (listObserved && bound === watched)) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!listObserved) resize.observe(list);
        listObserved = true;
        if (bound === watched) return;
        if (watched) resize.unobserve(watched);
        if (bound) resize.observe(bound);
        watched = bound;
      });
    };
    const resize = new ResizeObserver(() => {
      const targets = watched ? [list, watched] : [list];
      const size = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        return [rect.width, rect.height] as const;
      };
      const before = targets.map(size);
      fit();
      targets.forEach((el, i) => {
        const [width, height] = size(el);
        const [widthBefore = 0, heightBefore = 0] = before[i] ?? [];
        if (Math.abs(width - widthBefore) < 0.5 && Math.abs(height - heightBefore) < 0.5) return;
        resize.unobserve(el);
        if (el === list) listObserved = false;
        else watched = null;
      });
      settle();
    });
    const refit = () => {
      fit();
      settle();
    };
    fit();
    resize.observe(list);
    settle();
    const mutation = new MutationObserver(refit);
    mutation.observe(list, { childList: true, subtree: true, characterData: true });
    document.fonts.addEventListener("loadingdone", refit);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      document.fonts.removeEventListener("loadingdone", refit);
      unfold(list);
      foldedRef.current = [];
    };
  }, [collapse]);

  const ellipsisItem = collapse ? (
    <li
      key="breadcrumb-overflow"
      data-slot="breadcrumb-overflow"
      data-overflow=""
      className="hidden h-200 shrink-0 items-center data-leading:order-first data-shown:inline-flex [[data-measuring]>&]:inline-flex"
    >
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) setMenu(foldedRef.current.map(readLevel));
        }}
      >
        <DropdownMenuTrigger
          aria-label={t("showHiddenLevels")}
          className="relative flex h-200 touch-target items-center rounded-xsmall outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused data-popup-open:text-default"
        >
          <BreadcrumbEllipsis className="size-200" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {menu.map((level, index) => {
            const label = (
              <span className="min-w-0 truncate" title={level.label}>
                {level.label}
              </span>
            );
            if (level.href !== null)
              return (
                <DropdownMenuLinkItem
                  key={index}
                  href={level.href}
                  closeOnClick
                  onClick={(event) => {
                    // A plain click runs the folded link itself, so a router link keeps its
                    // client-side navigation; a modified click opens the href natively.
                    const target = level.control;
                    const modified =
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey;
                    if (modified || !target?.isConnected) return;
                    event.preventDefault();
                    target.click();
                  }}
                >
                  {label}
                </DropdownMenuLinkItem>
              );
            return (
              <DropdownMenuItem
                key={index}
                disabled={!level.control}
                onClick={() => level.control?.click()}
              >
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  ) : null;

  return (
    <OverflowContext.Provider value={overflow}>
      <ol
        ref={setListRef}
        className={cn(
          "font-body-small text-subtle",
          overflow === "wrap"
            ? "block break-words"
            : [
                "flex min-w-0 flex-nowrap items-center gap-075",
                // A folded level leaves the line; the measuring pass shows it to read its width.
                "[&:not([data-measuring])>[data-collapsed]]:hidden",
                "data-measuring:overflow-hidden [&[data-measuring]>*]:shrink-0",
                // Once fitted, levels keep their width: a shortened parent carries the width the
                // fit gave it, and only the current page (data-fill) takes what the others leave.
                "[&[data-fit]:not([data-measuring])>*]:shrink-0 [&[data-fit]:not([data-measuring])>[data-fill]]:shrink",
              ],
          className,
        )}
        {...props}
        data-slot="breadcrumb-list"
      >
        {collapse
          ? [
              ...nodes.slice(0, firstSeparator + 1),
              ellipsisItem,
              ...nodes.slice(firstSeparator + 1),
            ]
          : children}
      </ol>
    </OverflowContext.Provider>
  );
}

/** A list item containing a link, current page, or composed control. */
function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  const overflow = React.useContext(OverflowContext);
  return (
    <li
      className={cn(
        overflow === "wrap" ? "inline" : "inline-flex min-w-0 items-center gap-050",
        className,
      )}
      {...props}
      data-slot="breadcrumb-item"
    />
  );
}

/**
 * Keeps a shortened label's full text in `title` on its host while it is cut, unless the caller
 * set a title of its own.
 */
function useFullTextTitle(
  host: React.RefObject<HTMLElement | null>,
  text: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const owned = React.useRef<string | null>(null);
  const sync = React.useCallback(() => {
    const el = host.current;
    const label = text.current;
    if (!el) return;
    const current = el.getAttribute("title");
    if (current !== null && current !== owned.current) {
      owned.current = null;
      return;
    }
    const cut = enabled && label !== null && label.scrollWidth > label.clientWidth + 1;
    const full = cut ? (label.textContent ?? "").replace(/\s+/g, " ").trim() : "";
    if (full) {
      if (current !== full) el.setAttribute("title", full);
      owned.current = full;
    } else if (owned.current !== null) {
      el.removeAttribute("title");
      owned.current = null;
    }
  }, [enabled, host, text]);
  React.useLayoutEffect(() => {
    sync();
  });
  React.useLayoutEffect(() => {
    const label = text.current;
    if (!enabled || !label) return;
    const observer = new ResizeObserver(sync);
    observer.observe(label);
    return () => observer.disconnect();
  }, [enabled, sync, text]);
}

/** Whether children are text alone: strings and numbers, in arrays or fragments. */
function isText(children: React.ReactNode): boolean {
  const parts = React.Children.toArray(children);
  return (
    parts.length > 0 &&
    parts.every(
      (part) =>
        typeof part === "string" ||
        typeof part === "number" ||
        (React.isValidElement<{ children?: React.ReactNode }>(part) &&
          part.type === React.Fragment &&
          isText(part.props.children)),
    )
  );
}

/**
 * An anchor by default. Use Base UI render to compose a router link or custom element. On one
 * line a long name given as text ends in an ellipsis with its full text as the title; composed
 * children (an icon and a name, say) render as they are and keep their whole width. On a touch
 * screen the link takes a 24px hit area: a centred box on one line, a band the link's width when
 * the list wraps, so it never lands on the words of the next level.
 *
 * A BreadcrumbLink is always an ancestor; the current page is BreadcrumbPage. So it drops an
 * `aria-current` it is handed, as a router link that matches by path prefix hands it to every
 * ancestor when the router renders through this part (TanStack Router's `createLink`). A router
 * link given as a `render` element sets the attribute inside itself, where the kit cannot reach:
 * give that link exact matching. The Breadcrumb page shows both.
 */
function BreadcrumbLink({
  className,
  render,
  children,
  "aria-current": _handedCurrent,
  ...props
}: useRender.ComponentProps<"a">) {
  const overflow = React.useContext(OverflowContext);
  const hostRef = React.useRef<HTMLAnchorElement | null>(null);
  const labelRef = React.useRef<HTMLSpanElement | null>(null);
  const truncates = overflow === "collapse" && isText(children);
  useFullTextTitle(hostRef, labelRef, truncates);
  return useRender({
    defaultTagName: "a",
    ref: hostRef,
    props: mergeProps<"a">(
      {
        className: cn(
          "relative min-w-0 rounded-xsmall outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused",
          // A wrapped inline link's box runs from its first word to its last, so a centred square
          // would land on the level beside it; the band stays on the link.
          overflow === "wrap" ? "touch-target-block" : "touch-target",
          className,
        ),
        ...(children === undefined
          ? {}
          : {
              children: truncates ? (
                <span ref={labelRef} data-slot="breadcrumb-label" className="block truncate">
                  {children}
                </span>
              ) : (
                children
              ),
            }),
      },
      props,
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  });
}

/**
 * The current page, announced as a disabled link and omitted from the tab order. On one line a
 * long name ends in an ellipsis with its full text as the title.
 */
function BreadcrumbPage({ className, ref, ...props }: React.ComponentProps<"span">) {
  const overflow = React.useContext(OverflowContext);
  const pageRef = React.useRef<HTMLSpanElement | null>(null);
  const truncates = overflow === "collapse";
  useFullTextTitle(pageRef, pageRef, truncates);
  const setRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      pageRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  return (
    <span
      ref={setRef}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-regular text-default", truncates && "min-w-0 truncate", className)}
      {...props}
      data-slot="breadcrumb-page"
    />
  );
}

/**
 * A decorative chevron by default; children replace the separator. In a wrapping list it carries
 * the line break before it, so it starts a line with the level it leads to and never ends one.
 */
function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  const overflow = React.useContext(OverflowContext);
  const wrap = overflow === "wrap";
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn(
        "[&>svg]:size-icon-small",
        wrap ? "inline whitespace-nowrap px-075 [&>svg]:inline" : "shrink-0",
        className,
      )}
      {...props}
      data-slot="breadcrumb-separator"
    >
      {/* The only break opportunity between levels: before the separator, not after it. */}
      {wrap ? <wbr /> : null}
      {/* The default chevron points along the reading direction, so it turns in right-to-left. */}
      {children ?? <ChevronRightIcon className="rtl:rotate-180" />}
    </li>
  );
}

/** A decorative collapsed-path indicator. Name its surrounding control when interactive. */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn(
        "inline-flex size-250 items-center justify-center align-middle [&>svg]:size-icon-medium",
        className,
      )}
      {...props}
      data-slot="breadcrumb-ellipsis"
    >
      <MoreHorizontalIcon />
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
