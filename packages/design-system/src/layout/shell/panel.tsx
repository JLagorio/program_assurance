import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { X } from "lucide-react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { IconButton, type IconButtonProps } from "../../components/button";
import { cn } from "../../lib/cn";
import { useLandmarkTitle, useRegisterTitle } from "../../lib/landmark-title";
import { useLedgerLocale } from "../../lib/locale";
import {
  HeadingLevelProvider,
  HeadingLevelScope,
  headingTag,
  nextHeadingLevel,
  useHeadingLevel,
} from "../../primitives/heading-level";
import { AreaPortal, SlotsContext } from "../slots";
import {
  MAIN,
  mergeRefs,
  PANEL_MIN,
  panelCompactQuery,
  slot,
  useShell,
  useSkipLink,
} from "./context";
import { Splitter, type ShellSplitterProps } from "./splitter";

/* ---------- panel ---------- */

/** Where focus goes: `true` for the default, `false` for nowhere, or an element, by ref or from a function called at that moment (which may itself return `true` or `false`). */
export type ShellPanelFocusTarget =
  boolean | RefObject<HTMLElement | null> | (() => HTMLElement | boolean | null | undefined);

export type ShellPanelProps = Omit<ComponentProps<"aside">, "title"> & {
  /** The built-in header's heading, also the landmark's name. Give it, or compose Panel.Header, Panel.Title, Panel.Close and Panel.Body yourself. */
  title?: ReactNode | undefined;
  /** The landmark's name while there is no title, "Details" by default. Close and the splitter are named after it: "Close Requirement preview", "Resize Requirement preview"; without it, "Close details" and "Resize details". */
  label?: string | undefined;
  /** Route-owned controls immediately before Close in the built-in header. */
  actions?: ReactNode | undefined;
  onClose: () => void;
  /** The width while this panel is open and the reader has not resized a panel: a width they dragged or keyed, or the browser remembered, outranks it. It is never remembered, so the next panel opens at its own default. At least 240px. */
  defaultWidth?: number | undefined;
  /**
   * Where focus goes when the panel opens, at every width, while focus is on the page, on the
   * opener or nowhere: the panel itself by default, an element inside it, or `false` to leave it
   * where it is. Where the panel covers Main (below the `lg` breakpoint) it takes focus even with
   * `false`, since focus cannot stay on a page that is hidden.
   */
  initialFocus?: ShellPanelFocusTarget | undefined;
  /**
   * Where focus returns when the panel closes with focus inside it: by default the control the
   * reader last used in Main, the opener unless they have since used another (a second row's
   * eye); an element; or `false` to leave it to the caller.
   */
  finalFocus?: ShellPanelFocusTarget | undefined;
};

/** The target a focus prop names, the fallback for `true` or nothing, or `false`. */
function focusTarget(
  target: ShellPanelFocusTarget | undefined,
  fallback: HTMLElement | null,
): HTMLElement | null | false {
  if (target === false) return false;
  if (target === undefined || target === true) return fallback;
  const value = typeof target === "function" ? target() : target.current;
  if (value === false) return false;
  return value === true || value == null ? fallback : value;
}

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Escape in a field belongs to the field (clearing, closing its list, undoing), not to the panel. */
function isEditable(target: EventTarget) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  const role = target.getAttribute("role");
  return role === "textbox" || role === "searchbox";
}

export type ShellPanelHeaderProps = ComponentProps<"div">;
export type ShellPanelTitleProps = useRender.ComponentProps<"h2">;
export type ShellPanelActionsProps = ComponentProps<"div">;
export type ShellPanelCloseProps = Omit<IconButtonProps, "icon" | "label"> & {
  /** The button's name: "Close" and the panel's `label`, or "Close details" when it has none. */
  label?: string | undefined;
};
export type ShellPanelBodyProps = ComponentProps<"div">;

const PanelContext = createContext<{
  onClose: () => void;
  titleId: string;
  setHasTitle: (present: boolean) => void;
  /** Whether a title names the panel, so its body's headings sit one level below it. */
  titled: boolean;
  /** The panel's `label`, which Close and the splitter name themselves after. */
  label: string | undefined;
} | null>(null);

/** Escape from a popup portalled out of the panel (a menu, a list) or from text still being composed is not the panel's to take. */
const escapeIsElsewhere = (panel: HTMLElement, event: ReactKeyboardEvent) =>
  event.nativeEvent.isComposing ||
  !(event.target instanceof Node) ||
  !panel.contains(event.target) ||
  isEditable(event.target);

/** A route-owned contribution to the persistent shell. Mount to open; unmount to close. */
export function PanelRoot(props: ShellPanelProps) {
  return (
    <AreaPortal name="panel">
      <PanelSurface {...props} />
    </AreaPortal>
  );
}

export function PanelSurface({
  ref,
  id,
  title,
  label,
  onClose,
  actions,
  defaultWidth,
  initialFocus,
  finalFocus,
  className,
  children,
  onKeyDown,
  ...props
}: ShellPanelProps) {
  const shell = useShell();
  const { t } = useLedgerLocale();
  const name = label ?? t("details");
  const skipId = useSkipLink(id, name);
  const { titleId, hasTitle, setHasTitle } = useLandmarkTitle();
  const slots = useContext(SlotsContext);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const focusRef = useRef({ initialFocus, finalFocus });
  focusRef.current = { initialFocus, finalFocus };
  // What opened this panel, kept for its lifetime, so an effect that runs again (StrictMode's
  // second pass) does not take the panel itself, where focus now is, for the opener.
  const openedBy = useRef<{ opener: HTMLElement | null; tracked: HTMLElement | null } | null>(null);
  // The built-in header when a title or actions are given; otherwise the children compose the parts.
  const configured = title !== undefined || actions !== undefined;
  const titled = configured || hasTitle;
  const context = useMemo(
    () => ({ onClose: () => closeRef.current(), titleId, setHasTitle, titled, label }),
    [titleId, setHasTitle, titled, label],
  );
  // The focus contract, at every width. On open, focus moves into the panel while it is on the
  // page, on the opener or nowhere, so Escape and the next keys act in the preview; below the `lg`
  // breakpoint the panel covers Main and always takes it. On close with focus inside, focus goes
  // back to the control the reader last used in Main. The opener is captured before the compact
  // layout hides Main; the shell tracks focus and pointer presses in Main, so a button a browser
  // does not focus on click (Safari) still counts, and a later press on another row's eye moves it.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !slots) return;
    const doc = panel.ownerDocument;
    const focused = doc.activeElement;
    const active =
      focused instanceof HTMLElement && focused !== doc.body && !panel.contains(focused)
        ? focused
        : null;
    // A control outside Main (a top nav button) is not tracked by the shell: it is the opener itself.
    openedBy.current ??= {
      opener: active && !active.closest(MAIN) ? active : (slots.opener.current ?? active),
      tracked: slots.opener.current,
    };
    const { opener, tracked } = openedBy.current;
    const compact = window.matchMedia(panelCompactQuery());
    const focusPanel = (coversMain: boolean) => {
      const current = doc.activeElement;
      if (current !== doc.body && current !== opener && !current?.closest(MAIN)) return;
      const target = focusTarget(focusRef.current.initialFocus, panel);
      if (target === false && !coversMain) return;
      if (target && target !== panel) target.focus();
      else panel.focus({ preventScroll: true });
    };
    focusPanel(compact.matches);
    const onCompact = () => {
      if (compact.matches) focusPanel(true);
    };
    compact.addEventListener("change", onCompact);
    return () => {
      compact.removeEventListener("change", onCompact);
      const returnFocus = panel.contains(doc.activeElement) || doc.activeElement === doc.body;
      const latest = slots.opener.current;
      const fallback = latest && latest !== tracked && latest.isConnected ? latest : opener;
      const target = returnFocus ? focusTarget(focusRef.current.finalFocus, fallback) : false;
      if (!target) return;
      requestAnimationFrame(() => {
        // Still in the document: the effect re-ran (StrictMode's second pass, a new `slots`) and
        // the panel stays open, so focus stays in it.
        if (panel.isConnected) return;
        if (
          target.isConnected &&
          (doc.activeElement === doc.body || panel.contains(doc.activeElement))
        )
          target.focus();
      });
    };
  }, [slots]);
  // The width while this panel is open and the reader has not resized one: a fallback under a
  // dragged or remembered width, never remembered itself, and gone when the panel closes, so the
  // next panel opens at its own default. Before paint, so the column does not open at one width and
  // jump to another.
  const { setPanelDefaultWidth } = shell;
  useLayoutEffect(() => {
    if (!defaultWidth) return;
    setPanelDefaultWidth(Math.max(Math.round(defaultWidth), PANEL_MIN));
    return () => setPanelDefaultWidth(null);
  }, [defaultWidth, setPanelDefaultWidth]);
  const labelled = configured || hasTitle;
  return (
    <aside
      {...props}
      id={skipId}
      ref={mergeRefs(ref, panelRef)}
      tabIndex={-1}
      aria-labelledby={labelled ? titleId : undefined}
      aria-label={labelled ? undefined : name}
      data-shell-area="panel"
      data-slot="shell-panel"
      className={cn(
        "shell-panel flex min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-none border-default bg-surface outline-none",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.key === "Escape" &&
          !event.defaultPrevented &&
          !escapeIsElsewhere(event.currentTarget, event)
        ) {
          event.preventDefault();
          closeRef.current();
        }
      }}
    >
      {/* The panel is its own landmark beside Main, portalled from wherever the route renders it:
          its outline starts at 2, under the page's h1, whatever level surrounds it in React. */}
      <HeadingLevelProvider level={2}>
        <PanelContext.Provider value={context}>
          {configured ? (
            <>
              <PanelSplitter />
              <PanelHeader>
                <PanelTitle>{title ?? name}</PanelTitle>
                {actions != null && actions !== false && <PanelActions>{actions}</PanelActions>}
                <PanelClose />
              </PanelHeader>
              <PanelBody>{children}</PanelBody>
            </>
          ) : (
            children
          )}
        </PanelContext.Provider>
      </HeadingLevelProvider>
    </aside>
  );
}

/** The title, actions and close share the top-nav-height bar; a narrow panel gives the title its own row. */
export function PanelHeader({ className, ref, ...props }: ShellPanelHeaderProps) {
  const own = useRef<HTMLDivElement>(null);
  // The header stays over the panel's content as it scrolls. Its measured height is the panel's
  // scroll padding (shell.css), so a control that takes focus under it scrolls clear of it however
  // the header wraps: a title on its own row in a narrow panel is about twice the bar's height.
  useLayoutEffect(() => {
    const header = own.current;
    const panel = header?.closest<HTMLElement>('[data-slot="shell-panel"]');
    if (!header || !panel) return;
    const measure = () =>
      panel.style.setProperty(
        "--shell-panel-header",
        `${Math.round(header.getBoundingClientRect().height)}px`,
      );
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(header);
    return () => {
      observer?.disconnect();
      panel.style.removeProperty("--shell-panel-header");
    };
  }, []);
  return (
    <div
      {...props}
      ref={mergeRefs(ref, own)}
      data-slot="shell-panel-header"
      className={cn(
        "sticky top-0 z-10 grid min-h-layout-topnav items-center gap-100 border-b border-default bg-surface px-200 py-100",
        className,
      )}
    />
  );
}

/** The panel's heading and the landmark's name: an h2 (the panel starts its outline at 2), or `render` for another level. */
export function PanelTitle({ render, ref, className, ...props }: ShellPanelTitleProps) {
  const panel = useContext(PanelContext);
  const level = useHeadingLevel();
  useRegisterTitle(panel?.setHasTitle);
  return useRender({
    defaultTagName: headingTag(level ?? 2),
    render,
    ref,
    state: { slot: "panel-title" },
    props: mergeProps<"h2">(props, {
      ...slot("shell-panel-title"),
      id: panel?.titleId,
      className: cn("min-w-0 flex-1 break-words font-body font-semibold", className),
    }),
  });
}

/** Route-owned controls in the header, before Close: previous and next, open in a new tab. */
export function PanelActions({ className, ...props }: ShellPanelActionsProps) {
  return (
    <div
      {...props}
      data-slot="shell-panel-actions"
      className={cn("flex shrink-0 items-center gap-050", className)}
    />
  );
}

/** Closes the panel: the route's onClose, unless the click was prevented. */
export function PanelClose({
  label,
  variant = "subtle",
  size = "small",
  onClick,
  ...props
}: ShellPanelCloseProps) {
  const panel = useContext(PanelContext);
  const { t } = useLedgerLocale();
  return (
    <IconButton
      {...props}
      data-slot="shell-panel-close"
      label={
        label ??
        (panel?.label ? t("closePanelNamed", { label: panel.label }) : t("closeDetails"))
      }
      variant={variant}
      size={size}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) panel?.onClose();
      }}
      icon={<X />}
    />
  );
}

/** The panel's content, padded, containing its own inline size so a wide table scrolls inside it. Its headings start one level below the panel's title (an h3 under the h2), or at 2 when no title names the panel, as in a preview whose record title is the body's first heading. */
export function PanelBody({ className, style, children, ...props }: ShellPanelBodyProps) {
  const panel = useContext(PanelContext);
  const surrounding = useHeadingLevel();
  const level = panel?.titled ? nextHeadingLevel(surrounding ?? 2) : surrounding;
  return (
    <div
      {...props}
      data-slot="shell-panel-body"
      className={cn("min-w-0 flex-1 p-200", className)}
      style={{ contain: "inline-size", ...style }}
    >
      <HeadingLevelScope level={level}>{children}</HeadingLevelScope>
    </div>
  );
}

/** Makes the panel resizable from its start edge. The built-in header renders one; composing the parts, render it as the panel's first child. It holds still over the panel's visible height while the content scrolls. */
export function PanelSplitter({ label, ...props }: ShellSplitterProps) {
  const shell = useShell();
  const panel = useContext(PanelContext);
  const { t } = useLedgerLocale();
  return (
    <Splitter
      {...props}
      label={
        label ??
        (panel?.label ? t("resizePanelNamed", { label: panel.label }) : t("resizeDetails"))
      }
      min={PANEL_MIN}
      direction={-1}
      edge="start"
      setWidth={shell.setPanelWidth}
      inScroller
    />
  );
}

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Title: PanelTitle,
  Actions: PanelActions,
  Close: PanelClose,
  Body: PanelBody,
  Splitter: PanelSplitter,
});
