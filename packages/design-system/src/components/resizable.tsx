import * as Primitive from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

export type ResizablePanelGroupProps = Primitive.GroupProps;
export function ResizablePanelGroup({ className, ...props }: ResizablePanelGroupProps) {
  return (
    <Primitive.Group
      data-slot="resizable-panel-group"
      className={cn("flex size-full", className)}
      {...props}
    />
  );
}
export type ResizablePanelProps = Primitive.PanelProps;
export function ResizablePanel({ className, ...props }: ResizablePanelProps) {
  return (
    <Primitive.Panel
      data-slot="resizable-panel"
      className={cn("min-h-0 min-w-0", className)}
      {...props}
    />
  );
}
export type ResizableHandleProps = Primitive.SeparatorProps & { withHandle?: boolean | undefined };
export function ResizableHandle({
  className,
  withHandle,
  children,
  ...props
}: ResizableHandleProps) {
  const { t } = useLedgerLocale();
  return (
    <Primitive.Separator
      data-slot="resizable-handle"
      aria-label={t("resize")}
      className={cn(
        "relative flex w-0 shrink-0 items-center justify-center border-s border-default outline-none transition-colors duration-fast ease-standard hover:border-brand focus-visible:outline-focused aria-[orientation=horizontal]:h-0 aria-[orientation=horizontal]:border-s-0 aria-[orientation=horizontal]:border-t aria-[orientation=horizontal]:w-full after:absolute after:inset-y-0 after:-start-050 after:w-100 aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:-top-050 aria-[orientation=horizontal]:after:h-100 aria-[orientation=horizontal]:after:w-full [&[aria-orientation=horizontal]>span]:rotate-90",
        className,
      )}
      {...props}
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
