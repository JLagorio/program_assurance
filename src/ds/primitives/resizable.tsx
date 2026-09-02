import { createContext, useContext, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

type Orientation = "horizontal" | "vertical";
type Size = number | string;

const OrientationContext = createContext<Orientation>("horizontal");

/* Panes a person sizes for themselves: a list beside its detail, an inspector
   under a work pane. A number is a percentage of the group; a string carries
   its own unit ("240px", "20rem"). The handle is a hairline that lights up on
   hover and focus and takes the arrow keys. Nest a vertical group inside a
   horizontal panel for a 2×2. */

const size = (s: Size | undefined) => (typeof s === "number" ? `${s}%` : s);
function ResizableRoot({
  orientation = "horizontal",
  className,
  children,
}: {
  orientation?: Orientation;
  className?: string;
  children: ReactNode;
}) {
  return (
    <OrientationContext.Provider value={orientation}>
      <Group
        orientation={orientation}
        className={cn("flex size-full", orientation === "vertical" && "flex-col", className)}
      >
        {children}
      </Group>
    </OrientationContext.Provider>
  );
}

function ResizablePanel({
  defaultSize,
  minSize,
  maxSize,
  className,
  children,
}: {
  defaultSize?: Size;
  minSize?: Size;
  maxSize?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel
      {...(defaultSize !== undefined ? { defaultSize: size(defaultSize) } : {})}
      {...(minSize !== undefined ? { minSize: size(minSize) } : {})}
      {...(maxSize !== undefined ? { maxSize: size(maxSize) } : {})}
      className={cn("min-h-0 min-w-0", className)}
    >
      {children}
    </Panel>
  );
}

function ResizableHandle({ className }: { className?: string }) {
  const orientation = useContext(OrientationContext);
  return (
    <Separator
      className={cn(
        "relative shrink-0 bg-border outline-none transition-colors duration-100",
        "hover:bg-primary focus-visible:bg-primary",
        orientation === "horizontal" ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute",
          orientation === "horizontal" ? "inset-y-0 -left-1 w-[9px]" : "inset-x-0 -top-1 h-[9px]",
        )}
      />
    </Separator>
  );
}

export const Resizable = Object.assign(ResizableRoot, {
  Panel: ResizablePanel,
  Handle: ResizableHandle,
});
