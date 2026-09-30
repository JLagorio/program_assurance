import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDown, LayoutGrid, MoreHorizontal, Search } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { IconButton, type IconButtonProps } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import {
  KbdShortcut,
  shortcutKeys,
  useFormatShortcut,
  useModifierKey,
  type ModifierKey,
} from "../../components/kbd";
import { LinkIconButton } from "../../components/link-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/tooltip";
import { useIsTruncated } from "../../components/truncate";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { mergeRefs, slot, useShell, useSideNavRail, useSkipLink } from "./context";

/* ---------- top nav ---------- */

/* The top nav is a size container named `topnav`, so what folds inside it (the search, the end
   items) follows the row's own width: the window's, less a panel open beside it. The fold point is
   the container's `3xl` size, 48rem, the `md` breakpoint's width when the row spans the window. */

export type ShellTopNavProps = ComponentProps<"header"> & {
  /** The landmark's name, "Top navigation" by default. */
  label?: string | undefined;
};

export type ShellTopNavStartProps = ComponentProps<"div"> & {
  /** The SideNav.ToggleButton. A ToggleButton child places itself the same way; this is the older spelling. */
  toggle?: ReactNode | undefined;
};

export type ShellTopNavMiddleProps = ComponentProps<"div">;

export type ShellTopNavEndProps = ComponentProps<"div"> & {
  /** The group's name, "Actions" by default. */
  label?: string | undefined;
  /** What stands in for the children below the `md` breakpoint: one menu holding the same commands, so the row never grows past the window. Unsaid, the children stay at every width. Prefer TopNav.Item children, which fold themselves and keep the rest in view. */
  overflow?: ReactNode | undefined;
  /** The name of the More menu that TopNav.Item children fold into when the top nav is narrow, "More" by default. */
  moreLabel?: string | undefined;
};

export function TopNavRoot({ id, label, className, children, ...props }: ShellTopNavProps) {
  const { t } = useLedgerLocale();
  const { sideNav } = useShell();
  const name = label ?? t("topNavigation");
  const skipId = useSkipLink(id, name);
  return (
    <header
      {...props}
      id={skipId}
      tabIndex={-1}
      aria-label={name}
      // Under the phone side-nav overlay, which holds focus and has its own close.
      inert={sideNav.modal || props.inert}
      data-slot="shell-topnav"
      className={cn(
        "shell-topnav @container/topnav flex items-stretch border-b border-default bg-surface outline-none",
        className,
      )}
    >
      {children}
    </header>
  );
}

/** The start slot: the toggle, the app switcher and the logo. While the side nav is expanded it takes the side nav's width and surface, so the logo heads that column, and the toggle moves to its end. */
export function TopNavStart({ toggle, className, children, ...props }: ShellTopNavStartProps) {
  const { isDesktop, sideNav } = useShell();
  const inline = isDesktop && sideNav.expanded;
  const rail = useSideNavRail();
  return (
    <div
      {...props}
      data-shell-slot="start"
      data-slot="shell-topnav-start"
      data-collapsed={rail ? "icons" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-100 px-150",
        inline && "lg:shell-topnav-start lg:border-e lg:border-default lg:bg-surface-sunken",
        className,
      )}
    >
      {toggle}
      {children}
    </div>
  );
}

/** The middle slot: the search first, then the create action. Centred while the side nav is collapsed. */
export function TopNavMiddle({ className, children, ...props }: ShellTopNavMiddleProps) {
  const { isDesktop, sideNav } = useShell();
  return (
    <div
      {...props}
      data-slot="shell-topnav-middle"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-100 px-200",
        isDesktop && sideNav.expanded ? "justify-start" : "justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- the fold ---------- */

/** Whether an element is drawn: a container query can hide a control that still has focus. */
const isShown = (el: HTMLElement) =>
  typeof el.checkVisibility === "function" ? el.checkVisibility() : el.getClientRects().length > 0;

const FOCUSABLE = "button:not([disabled]), a[href], [role='link'], [tabindex]:not([tabindex='-1'])";

/**
 * When the top nav's width hides the control that has focus (the search field gives way to its
 * icon, an item folds into More), focus moves to the control that now does the same job, the first
 * visible match for what `prefer` returns for the hidden control, else the first visible control
 * in `root`, instead of dropping to the page. `prefer` must be a stable function.
 */
function useFocusFollowsFold(
  root: RefObject<HTMLElement | null>,
  prefer?: (lost: HTMLElement) => string | undefined,
) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const doc = el.ownerDocument;
    // The browser may already have moved focus to the body when the control was hidden, so the
    // last control focused in `root` is kept until focus goes somewhere else on purpose.
    let last: HTMLElement | null = null;
    const onFocusIn = (event: FocusEvent) => {
      last = event.target instanceof HTMLElement ? event.target : null;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget) last = null;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node && el.contains(event.target))) last = null;
    };
    const observer = new ResizeObserver(() => {
      const active = doc.activeElement;
      const lost =
        active instanceof HTMLElement && el.contains(active)
          ? active
          : active === null || active === doc.body
            ? last
            : null;
      if (!lost || isShown(lost)) return;
      const visible = (selector: string) =>
        [...el.querySelectorAll<HTMLElement>(selector)].find((n) => n !== lost && isShown(n));
      const preferred = prefer?.(lost);
      const next = (preferred ? visible(preferred) : undefined) ?? visible(FOCUSABLE);
      next?.focus({ preventScroll: true });
    });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    doc.addEventListener("pointerdown", onPointerDown, true);
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      doc.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [root, prefer]);
}

/** One TopNav.Item as the End group's More menu shows it when the item folds. */
type FoldItem = {
  id: string;
  label: string;
  icon: ReactElement;
  href: string | undefined;
  render: ReactElement | undefined;
  disabledReason: string | undefined;
  node: RefObject<HTMLElement | null>;
  click: RefObject<((event: MouseEvent<HTMLElement>) => void) | undefined>;
};

/** Registers a foldable item with the End group; returns the unregister. Null outside a folding End. */
const EndFoldContext = createContext<((item: FoldItem) => () => void) | null>(null);

/** Items in the order they appear in the row, so the menu reads as the row did. */
function inDocumentOrder(items: FoldItem[]) {
  return [...items].sort((a, b) => {
    const [x, y] = [a.node.current, b.node.current];
    if (!x || !y) return 0;
    return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
}

const MORE = "[data-shell-slot='topnav-more']";
const ITEM = "[data-shell-slot='topnav-item']";

/** Where focus goes when the fold hides it: from a folded item to More, which now holds it, and
    from More back to the first item that left it, never to a persistent item beside them. */
const foldTarget = (lost: HTMLElement) =>
  lost.matches(MORE) ? `${ITEM}:not([data-persistent])` : MORE;

/**
 * The end slot: a group of actions, right-aligned. The children render as given, with no list
 * wrapped around them, so a component that returns several buttons is several buttons. TopNav.Item
 * children fold into one More menu when the top nav is narrow; every other child, such as the
 * colour-mode switch, stays in view. `overflow` is the older, all-or-nothing spelling: below the
 * `md` breakpoint it replaces every child with one menu.
 */
export function TopNavEnd({
  label,
  moreLabel,
  className,
  children,
  overflow,
  ref,
  ...props
}: ShellTopNavEndProps) {
  const { t } = useLedgerLocale();
  const root = useRef<HTMLDivElement>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, root), [ref]);
  const [folded, setFolded] = useState<FoldItem[]>([]);
  const register = useCallback((item: FoldItem) => {
    setFolded((list) => inDocumentOrder([...list.filter((i) => i.id !== item.id), item]));
    return () => setFolded((list) => list.filter((i) => i.id !== item.id));
  }, []);
  useFocusFollowsFold(root, foldTarget);
  const group = (
    <div
      {...props}
      ref={setRef}
      role="group"
      aria-label={label ?? t("actions")}
      data-slot="shell-topnav-end"
      className={cn("flex shrink-0 items-center gap-050 px-150", className)}
    >
      {overflow === undefined ? (
        <>
          {children}
          {folded.length ? <MoreMenu label={moreLabel ?? t("more")} items={folded} /> : null}
        </>
      ) : (
        <>
          <span className="hidden md:contents">{children}</span>
          <span className="contents md:hidden">{overflow}</span>
        </>
      )}
    </div>
  );
  return overflow === undefined ? (
    <EndFoldContext.Provider value={register}>{group}</EndFoldContext.Provider>
  ) : (
    group
  );
}

/** The folded items, one menu row each: a destination as a link row, an action as an action row. */
function MoreMenu({ label, items }: { label: string; items: FoldItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            label={label}
            variant="subtle"
            icon={<MoreHorizontal />}
            data-shell-slot="topnav-more"
            className="hidden @max-3xl/topnav:inline-flex"
          />
        }
      />
      <DropdownMenuContent align="end">
        {items.map((item) =>
          (item.href !== undefined || item.render !== undefined) && !item.disabledReason ? (
            <DropdownMenuLinkItem
              key={item.id}
              closeOnClick
              {...(item.href !== undefined ? { href: item.href } : {})}
              {...(item.render !== undefined ? { render: item.render } : {})}
              onClick={(event) => item.click.current?.(event)}
            >
              {item.icon}
              {item.label}
            </DropdownMenuLinkItem>
          ) : (
            <DropdownMenuItem
              key={item.id}
              disabledReason={item.disabledReason}
              onClick={(event) => item.click.current?.(event)}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The native props (`aria-*`, `data-*`, handlers, `id`, `className`) go to the button or link in the row; the More menu's row takes only the item's own props. */
export type ShellTopNavItemProps = Omit<HTMLAttributes<HTMLElement>, "children" | "onClick"> & {
  /** The icon, as an element (`<Bell />`). The button sizes it and hides it from assistive technology. */
  icon: ReactElement;
  /** What the item does or where it goes: the button's name and tooltip in the row, the row's text in the More menu. */
  label: string;
  /** The action, in the row and from the More menu. */
  onClick?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
  /** A destination: the item is a link in the row and a link row in the More menu. */
  href?: string | undefined;
  /** A router link for a destination (`<Link to="/settings" />`), rendered in the row and in the More menu. */
  render?: ReactElement | undefined;
  /** Why the item cannot be used now. It stays reachable and says why, in the row and in the menu. */
  disabledReason?: string | undefined;
  /** Stay in the row at every width instead of folding into More. Off by default. An item that is a menu's or a popover's trigger (through the trigger's `render`) is `persistent`, since its popup anchors to the button in the row. */
  persistent?: boolean | undefined;
  ref?: Ref<HTMLElement> | undefined;
};

/**
 * One action or destination in TopNav.End: a subtle icon button with its name in a tooltip. When
 * the top nav is narrow it folds into End's More menu as a row with the same icon and name, unless
 * it is `persistent`. Outside TopNav.End it is an icon button that never folds.
 */
export function TopNavItem({
  icon,
  label,
  onClick,
  href,
  render,
  disabledReason,
  persistent = false,
  className,
  ref,
  ...props
}: ShellTopNavItemProps) {
  const register = useContext(EndFoldContext);
  const foldable = register !== null && !persistent;
  const key = useId();
  const node = useRef<HTMLElement | null>(null);
  const click = useRef(onClick);
  useLayoutEffect(() => {
    click.current = onClick;
  });
  useLayoutEffect(() => {
    if (!foldable || !register) return;
    return register({ id: key, label, icon, href, render, disabledReason, node, click });
  }, [foldable, register, key, label, icon, href, render, disabledReason]);
  const setRef = useMemo(() => mergeRefs<HTMLElement>(ref, node), [ref]);
  const shared = {
    ...props,
    label,
    icon,
    variant: "subtle" as const,
    disabledReason,
    onClick,
    "data-shell-slot": "topnav-item",
    "data-persistent": foldable ? undefined : "",
    className: cn(foldable && "@max-3xl/topnav:hidden", className),
    ref: setRef,
  };
  return href !== undefined || render !== undefined ? (
    <LinkIconButton
      {...shared}
      {...(href !== undefined ? { href } : {})}
      {...(render !== undefined ? { render } : {})}
    />
  ) : (
    <IconButton {...shared} />
  );
}

/* ---------- the search ---------- */

/** The modifiers and the key of a shortcut such as "Mod+K", as a test for a keydown. */
function shortcutMatcher(shortcut: string, modifier: ModifierKey) {
  const mods = { Control: false, Alt: false, Shift: false, Meta: false };
  let key = "";
  for (const { aria } of shortcutKeys(shortcut, { modifier })) {
    if (Object.hasOwn(mods, aria)) mods[aria as keyof typeof mods] = true;
    else key = aria;
  }
  const lower = key.toLowerCase();
  // With Option held a Mac types another character, so a letter or a digit also matches its code.
  const code = /^[a-z]$/.test(lower)
    ? `Key${lower.toUpperCase()}`
    : /^[0-9]$/.test(lower)
      ? `Digit${lower}`
      : undefined;
  return (event: KeyboardEvent) =>
    event.ctrlKey === mods.Control &&
    event.altKey === mods.Alt &&
    event.shiftKey === mods.Shift &&
    event.metaKey === mods.Meta &&
    (event.key.toLowerCase() === lower || (code !== undefined && event.code === code));
}

/** A dialog the reader is already in: the shortcut never opens a second one over it. */
const OPEN_DIALOG = '[role="dialog"][data-open], [role="alertdialog"][data-open]';

export type ShellTopNavSearchProps = Omit<ComponentProps<"div">, "children" | "onClick"> & {
  /** What the field says and the button's name, "Search" by default. Name what it finds: "Search records". */
  label?: string | undefined;
  /** The shortcut that opens the search from anywhere on the page, written once for every platform: "Mod+K" by default, ⌘K on Apple platforms and Ctrl+K elsewhere. `null` for none. */
  shortcut?: string | null | undefined;
  /** Opens the search, usually a SearchDialog: from a press on the field or the icon, and from the shortcut. */
  onOpen?: (() => void) | undefined;
};

/**
 * The top nav's search entry, in TopNav.Middle. Where the top nav is at least 48rem wide it is a
 * field-shaped button with the shortcut's keys at its end; narrower, a Search icon button, so the
 * row never squeezes the field under the create action. Both open the search through `onOpen`, and
 * so does the shortcut, which is ignored on key repeat, while composing text and while a dialog is
 * open. It opens a dialog and is not itself a text field, so there is one search surface.
 */
export function TopNavSearch({
  label,
  shortcut = "Mod+K",
  onOpen,
  className,
  ref,
  ...props
}: ShellTopNavSearchProps) {
  const { t } = useLedgerLocale();
  const name = label ?? t("search");
  const format = useFormatShortcut();
  const modifier = useModifierKey();
  const keys = shortcut ? format(shortcut, "aria") : undefined;
  const open = useRef(onOpen);
  useLayoutEffect(() => {
    open.current = onOpen;
  });
  useEffect(() => {
    if (!shortcut) return;
    const matches = shortcutMatcher(shortcut, modifier);
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (!matches(event) || !open.current) return;
      if (document.querySelector(OPEN_DIALOG)) return;
      event.preventDefault();
      open.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, modifier]);
  const root = useRef<HTMLDivElement>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, root), [ref]);
  useFocusFollowsFold(root);
  return (
    <div
      {...props}
      ref={setRef}
      data-slot="shell-topnav-search"
      className={cn("flex min-w-0 items-center @3xl/topnav:w-layout-list", className)}
    >
      <button
        type="button"
        aria-label={name}
        aria-haspopup="dialog"
        aria-keyshortcuts={keys}
        data-shell-slot="topnav-search-field"
        onClick={() => onOpen?.()}
        className="hidden h-control-medium w-full min-w-0 cursor-text items-center gap-100 rounded-medium border border-input bg-input px-100 text-start font-body text-subtle outline-none transition-colors duration-fast ease-standard hover:bg-input-hovered focus-visible:outline-focused @3xl/topnav:flex"
      >
        <Search aria-hidden className="size-icon-small shrink-0 icon-subtle" />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        {shortcut ? (
          <span aria-hidden className="shrink-0">
            <KbdShortcut keys={shortcut} />
          </span>
        ) : null}
      </button>
      <IconButton
        label={name}
        variant="subtle"
        icon={<Search />}
        aria-haspopup="dialog"
        aria-keyshortcuts={keys}
        data-shell-slot="topnav-search-button"
        className="@3xl/topnav:hidden"
        onClick={() => onOpen?.()}
      />
    </div>
  );
}

export const TopNav = Object.assign(TopNavRoot, {
  Start: TopNavStart,
  Middle: TopNavMiddle,
  End: TopNavEnd,
  Item: TopNavItem,
  Search: TopNavSearch,
});

/* ---------- top nav items ---------- */

export type ShellMarkProps = ComponentProps<"span">;

/** The default mark: a brand square. */
export function Mark({ className, ...props }: ShellMarkProps) {
  return (
    <span
      {...props}
      data-slot="shell-mark"
      className={cn(
        "flex size-300 shrink-0 items-center justify-center rounded-small bg-brand-bold",
        className,
      )}
    >
      <span className="block size-100 rounded-xsmall bg-surface" />
    </span>
  );
}

export type AppLogoProps = useRender.ComponentProps<"span"> & {
  /** The product's mark; the brand square by default. */
  mark?: ReactNode | undefined;
  name: string;
  /** The tenant, workspace or environment. Hidden with the name below the large breakpoint. */
  secondaryName?: string | undefined;
};

/** The product identity. Use render={<Link />} for home or render={<button />} for a switcher. */
export function AppLogo({
  mark = <Mark />,
  name,
  secondaryName,
  render,
  ref,
  className,
  children,
  ...props
}: AppLogoProps) {
  return useRender({
    defaultTagName: "span",
    render,
    ref,
    state: { slot: "app-logo" },
    props: mergeProps<"span">(props, {
      ...slot("shell-app-logo"),
      "aria-label": name,
      className: cn(
        "flex min-w-0 items-center gap-100 rounded-medium text-start outline-none focus-visible:outline-focused",
        className,
      ),
      children: (
        <>
          {mark}
          <span className="hidden min-w-0 flex-col lg:flex">
            <span className="truncate font-body font-medium text-default">{name}</span>
            {secondaryName ? (
              <span className="truncate font-body-small text-subtle">{secondaryName}</span>
            ) : null}
          </span>
          {children}
        </>
      ),
    }),
  });
}

export type AppSwitcherProps = Omit<IconButtonProps, "icon" | "label"> & {
  /** The button's name, "Switch product" by default. */
  label?: string | undefined;
};

/** Opens the switcher between products. An IconButton: give it `onClick`, or make it a menu's trigger. */
export function AppSwitcher({ label, variant = "subtle", ...props }: AppSwitcherProps) {
  const { t } = useLedgerLocale();
  return (
    <IconButton
      {...props}
      data-slot="shell-app-switcher"
      label={label ?? t("switchProduct")}
      variant={variant}
      icon={<LayoutGrid />}
    />
  );
}

/* `name` is the person's, not the button's form name: declared here alone, so the props table shows it. */
export type ProfileProps = Omit<useRender.ComponentProps<"button">, "name"> & {
  /** An Avatar, small. It is decoration beside the name: Profile hides it from assistive technology, so the button's name is the person's name and description, not their initials as well. */
  avatar: ReactNode;
  /** The person's name, shown beside the avatar and first in the button's accessible name. Required. */
  name: string;
  /** Under the name, subtle: the job title, the team. */
  description?: string | undefined;
  /** @deprecated The person's job title, not the ARIA role: use `description`. */
  role?: string | undefined;
  /** The trailing chevron that says the button opens a menu. By default it shows while the button opens a popup it announces (`aria-haspopup`, which a DropdownMenuTrigger sets through `render`), so a Profile that runs an action or opens a dialog has none; `true` or `false` decides. */
  indicator?: boolean | undefined;
};

/** Whether `aria-haspopup` says the button opens a menu or a list, which the chevron promises. */
const opensMenu = (value: unknown) =>
  value === true || value === "true" || value === "menu" || value === "listbox";

/** The person: avatar, name, description. In the side nav's footer. A menu's trigger through `render` (the account menu), a button with `onClick`, or a label without either. A Profile that opens a dialog says so with `aria-haspopup="dialog"`. */
export function Profile({
  avatar,
  name,
  description,
  role,
  indicator,
  render,
  ref,
  className,
  onClick,
  ...props
}: ProfileProps) {
  const interactive = Boolean(onClick || render);
  const detail = description ?? role;
  const rail = useSideNavRail();
  const nameRef = useRef<HTMLSpanElement>(null);
  // The name shows whole in a tooltip in the icon rail, and wherever the side nav's width cuts it.
  const cut = useIsTruncated(nameRef, { enabled: interactive && !rail });
  const chevron = interactive && (indicator ?? opensMenu(props["aria-haspopup"]));
  const element = useRender({
    defaultTagName: interactive ? "button" : "div",
    render,
    ref,
    state: { slot: "profile" },
    props: mergeProps<"button">(props, {
      ...slot("shell-profile"),
      type: interactive ? "button" : undefined,
      onClick,
      className: cn(
        "flex w-full items-center gap-100 rounded-medium px-100 py-075 text-start",
        interactive &&
          "outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused",
        className,
      ),
      children: (
        <>
          <span aria-hidden="true" data-slot="shell-profile-avatar" className="flex shrink-0">
            {avatar}
          </span>
          <span data-slot="shell-profile-label" className="flex min-w-0 flex-col">
            <span ref={nameRef} className="block truncate font-body font-medium text-default">
              {name}
            </span>
            {detail ? (
              <span className="block truncate font-body-small text-subtle">{detail}</span>
            ) : null}
          </span>
          {chevron ? (
            <ChevronDown
              aria-hidden
              data-slot="shell-sidenav-chevron"
              className="ms-auto size-icon-small shrink-0 icon-subtle"
            />
          ) : null}
        </>
      ),
    }),
  });
  return (
    <Tooltip disabled={!interactive || (!rail && !cut)}>
      <TooltipTrigger render={element} />
      <TooltipContent side="inline-end">{name}</TooltipContent>
    </Tooltip>
  );
}
