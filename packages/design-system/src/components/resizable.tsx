import * as Primitive from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/* Persisting a split and driving it imperatively go through the package root: the upstream hook
   and handle types under Ledger's names. */
export {
  /** Saves and restores a group's layout: pass its `defaultLayout` and `onLayoutChanged` to ResizablePanelGroup, with the group's `id`; supply server-safe `storage` when it renders on the server. The upstream `useDefaultLayout`. */
  useDefaultLayout as useResizableLayout,
  type GroupImperativeHandle as ResizablePanelGroupHandle,
  type PanelImperativeHandle as ResizablePanelHandle,
  type Layout as ResizableLayout,
  type LayoutStorage as ResizableLayoutStorage,
} from "react-resizable-panels";

export type ResizablePanelGroupProps = Primitive.GroupProps;
export function ResizablePanelGroup({ className, ...props }: ResizablePanelGroupProps) {
  return (
    <Primitive.Group
      className={cn("flex size-full", className)}
      {...props}
      data-slot="resizable-panel-group"
    />
  );
}
export type ResizablePanelProps = Primitive.PanelProps;
export function ResizablePanel({ className, ...props }: ResizablePanelProps) {
  return (
    <Primitive.Panel
      className={cn("min-h-0 min-w-0", className)}
      {...props}
      data-slot="resizable-panel"
    />
  );
}

export type ResizableHandleProps = Primitive.SeparatorProps & { withHandle?: boolean | undefined };
/** The separator between two panels, named "Resize" unless `aria-label` names it. The arrow keys move it the way they point, in a right-to-left group too (the library orders the panels as they are drawn); Home and End reach the bounds, Enter folds a collapsible panel. On a touch screen it takes a 24px hit area. */
export function ResizableHandle({
  className,
  withHandle,
  children,
  ...props
}: ResizableHandleProps) {
  const { t } = useLedgerLocale();
  return (
    <Primitive.Separator
      aria-label={t("resize")}
      className={cn(
        "relative flex w-0 shrink-0 touch-target items-center justify-center border-s border-default outline-none transition-colors duration-fast ease-standard hover:border-brand focus-visible:outline-focused aria-[orientation=horizontal]:h-0 aria-[orientation=horizontal]:border-s-0 aria-[orientation=horizontal]:border-t aria-[orientation=horizontal]:w-full after:absolute after:inset-y-0 after:-start-050 after:w-100 aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:-top-050 aria-[orientation=horizontal]:after:h-100 aria-[orientation=horizontal]:after:w-full [&[aria-orientation=horizontal]>span]:rotate-90",
        className,
      )}
      {...props}
      data-slot="resizable-handle"
    >
      {withHandle && (
        <span
          aria-hidden
          className="relative z-10 rounded-small border border-default bg-surface-raised p-025"
        >
          <GripVertical className="size-icon-small" />
        </span>
      )}
      {children}
    </Primitive.Separator>
  );
}
