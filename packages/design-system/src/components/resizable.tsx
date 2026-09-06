import { useLedgerLocale } from "../lib/locale";
import { createContext, useContext, type ReactNode } from "react";
import { Group, Panel, Separator, useDefaultLayout, type PanelSize } from "react-resizable-panels";

import { cn } from "../lib/cn";

/* Panes a reader sizes for themselves: a list beside its preview, a log under a form. The handle
   is a hairline that lights in the brand colour under the pointer and on focus, and takes the
   keyboard. Sizes are shares of the group in percent, or strings with a unit. */

type Orientation = "horizontal" | "vertical";
type Size = number | string;

const OrientationContext = createContext<Orientation>("horizontal");

/** A number is a share of the group in percent; a string carries its own unit: "240px", "30%". */
const size = (s: Size | undefined) => (typeof s === "number" ? `${s}%` : s);

export type ResizableProps = {
  /** `horizontal`, the default: panes side by side and the handle a vertical hairline. `vertical`: panes stacked. */
  orientation?: Orientation | undefined;
  /** A key under which the reader's sizes are kept in localStorage, one key per split, so the split opens as they left it. Give each Panel an `id`. Unsaid, the split opens at its defaults. */
  persist?: string | undefined;
  className?: string | undefined;
  /** Resizable.Panels with a Resizable.Handle between each pair. */
  children: ReactNode;
};

const memory: Pick<Storage, "getItem" | "setItem"> = {
  getItem: () => null,
  setItem: () => undefined,
};

function Persisted({
  id,
  orientation,
  className,
  children,
}: {
  id: string;
  orientation: Orientation;
  className: string;
  children: ReactNode;
}) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id,
    onlySaveAfterUserInteractions: true,
    storage: typeof localStorage === "undefined" ? memory : localStorage,
  });
  return (
    <Group
      id={id}
      orientation={orientation}
      className={className}
      {...(defaultLayout ? { defaultLayout } : {})}
      onLayoutChanged={onLayoutChanged}
    >
      {children}
    </Group>
  );
}

/** Panes a reader sizes for themselves. */
function ResizableRoot({
  orientation = "horizontal",
  persist,
  className,
  children,
}: ResizableProps) {
  const groupClass = cn("flex size-full", orientation === "vertical" && "flex-col", className);
  return (
    <OrientationContext.Provider value={orientation}>
      {persist ? (
        <Persisted id={persist} orientation={orientation} className={groupClass}>
          {children}
        </Persisted>
      ) : (
        <Group orientation={orientation} className={groupClass}>
          {children}
        </Group>
      )}
    </OrientationContext.Provider>
  );
}

export type ResizablePanelProps = {
  /** The pane's size at first: a share of the group in percent as a number, or a string with a unit. Unsaid, the panes share the group. */
  defaultSize?: Size | undefined;
  /** The smallest the reader can make it, in the same terms. */
  minSize?: Size | undefined;
  /** The largest, in the same terms. */
  maxSize?: Size | undefined;
  /** The pane folds to nothing when dragged under its minimum, and Enter on the handle after it folds and unfolds it: a tree the reader hides. */
  collapsible?: boolean | undefined;
  /** Names the pane, so a persisted split finds it again. Unsaid, one is generated. */
  id?: string | undefined;
  /** Called as the pane resizes, with its size as a share and in pixels. */
  onResize?: ((size: PanelSize) => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/** One pane. It clips its content: put a ScrollArea inside for a list. */
function ResizablePanel({
  defaultSize,
  minSize,
  maxSize,
  collapsible,
  id,
  onResize,
  className,
  children,
}: ResizablePanelProps) {
  return (
    <Panel
      {...(id !== undefined ? { id } : {})}
      {...(defaultSize !== undefined ? { defaultSize: size(defaultSize) } : {})}
      {...(minSize !== undefined ? { minSize: size(minSize) } : {})}
      {...(maxSize !== undefined ? { maxSize: size(maxSize) } : {})}
      {...(collapsible ? { collapsible: true } : {})}
      {...(onResize ? { onResize: (s: PanelSize) => onResize(s) } : {})}
      className={cn("min-h-0 min-w-0", className)}
    >
      {children}
    </Panel>
  );
}

export type ResizableHandleProps = {
  /** The handle's accessible name. "Resize" by default; say what it sizes when a page has two: "Resize the preview". */
  label?: string | undefined;
  className?: string | undefined;
};

/** The hairline between two panes: drag it, or focus it and use the arrows. */
function ResizableHandle({ label, className }: ResizableHandleProps) {
  const { t } = useLedgerLocale();
  const orientation = useContext(OrientationContext);
  return (
    <Separator
      aria-label={label ?? t("resize")}
      className={cn(
        "relative shrink-0 border-default outline-none transition-colors duration-fast ease-standard hover:border-brand focus-visible:border-brand",
        orientation === "horizontal"
          ? "w-0 cursor-col-resize border-s"
          : "h-0 cursor-row-resize border-t",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute",
          orientation === "horizontal" ? "inset-y-0 -start-050 w-100" : "inset-x-0 -top-050 h-100",
        )}
      />
    </Separator>
  );
}

export const Resizable = Object.assign(ResizableRoot, {
  Panel: ResizablePanel,
  Handle: ResizableHandle,
});
