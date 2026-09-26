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
  type ReactNode,
} from "react";

import { IconButton, type IconButtonProps } from "../../components/button";
import { cn } from "../../lib/cn";
import { useLandmarkTitle } from "../../lib/landmark-title";
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

export type ShellPanelProps = Omit<ComponentProps<"aside">, "title"> & {
  /** The built-in header's heading, also the landmark's name. Give it, or compose Panel.Header, Panel.Title, Panel.Close and Panel.Body yourself. */
  title?: ReactNode | undefined;
  /** The landmark's name while there is no title, "Details" by default. */
  label?: string | undefined;
  /** Route-owned controls immediately before Close in the built-in header. */
  actions?: ReactNode | undefined;
  onClose: () => void;
  /** The width on first render, while nothing has been dragged or remembered. */
  defaultWidth?: number | undefined;
};

export type ShellPanelHeaderProps = ComponentProps<"div">;
export type ShellPanelTitleProps = useRender.ComponentProps<"h2">;
export type ShellPanelActionsProps = ComponentProps<"div">;
export type ShellPanelCloseProps = Omit<IconButtonProps, "icon" | "label"> & {
  /** The button's name, "Close details" by default. */
  label?: string | undefined;
};
export type ShellPanelBodyProps = ComponentProps<"div">;

const PanelContext = createContext<{
  onClose: () => void;
  titleId: string;
  setHasTitle: (present: boolean) => void;
  /** Whether a title names the panel, so its body's headings sit one level below it. */
  titled: boolean;
} | null>(null);

/** Present while the Title is mounted, before paint, so the body's headings take their level in the same frame. */
function useRegisterTitle(setHasTitle: ((present: boolean) => void) | undefined) {
  useLayoutEffect(() => {
    setHasTitle?.(true);
    return () => setHasTitle?.(false);
  }, [setHasTitle]);
}

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
  // The built-in header when a title or actions are given; otherwise the children compose the parts.
  const configured = title !== undefined || actions !== undefined;
  const titled = configured || hasTitle;
  const context = useMemo(
    () => ({ onClose: () => closeRef.current(), titleId, setHasTitle, titled }),
    [titleId, setHasTitle, titled],
  );
  // Capture before the compact layout hides Main. Restore only while focus still belongs to this panel.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !slots) return;
    const doc = panel.ownerDocument;
    const opener =
      slots.opener.current ?? (doc.activeElement instanceof HTMLElement ? doc.activeElement : null);
    const compact = window.matchMedia(panelCompactQuery());
    const focusPanel = () => {
      if (
        compact.matches &&
        (doc.activeElement === doc.body ||
          doc.activeElement === opener ||
          doc.activeElement?.closest(MAIN))
      )
        panel.focus();
    };
    focusPanel();
    compact.addEventListener("change", focusPanel);
    return () => {
      compact.removeEventListener("change", focusPanel);
      const returnFocus = panel.contains(doc.activeElement) || doc.activeElement === doc.body;
      requestAnimationFrame(() => {
        if (
          returnFocus &&
          opener?.isConnected &&
          (doc.activeElement === doc.body || panel.contains(doc.activeElement))
        )
          opener.focus();
      });
    };
  }, [slots]);
  // The first width only, and only while nothing is set, so a drag or the browser's memory
  // outranks it; before paint, so the column does not open at one width and jump to another.
  useLayoutEffect(() => {
    if (defaultWidth && shell.panel.width == null) shell.setPanelWidth(defaultWidth);
  }, [defaultWidth, shell.panel.width, shell.setPanelWidth]);
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
        if (event.key === "Escape" && !event.defaultPrevented) {
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
export function PanelHeader({ className, ...props }: ShellPanelHeaderProps) {
  return (
    <div
      {...props}
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
      label={label ?? t("closeDetails")}
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
  const { t } = useLedgerLocale();
  return (
    <Splitter
      {...props}
      label={label ?? t("resizeDetails")}
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
