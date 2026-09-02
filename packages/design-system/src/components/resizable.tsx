import { createContext, useContext, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "../lib/cn";

type Orientation = "horizontal" | "vertical";
type Size = number | string;

const OrientationContext = createContext<Orientation>("horizontal");
const size = (s: Size | undefined) => (typeof s === "number" ? `${s}%` : s);

/** Panes a person sizes for themselves. A number is a percentage of the group; a string carries its own unit. The handle is a hairline that takes the arrow keys. */
function ResizableRoot({ orientation = "horizontal", className, children }: { orientation?: Orientation | undefined; className?: string | undefined; children: ReactNode }) {
  return (
    <OrientationContext.Provider value={orientation}>
      <Group orientation={orientation} className={cn("flex size-full", orientation === "vertical" && "flex-col", className)}>
        {children}
      </Group>
    </OrientationContext.Provider>
  );
}

function ResizablePanel({ defaultSize, minSize, maxSize, className, children }: { defaultSize?: Size | undefined; minSize?: Size | undefined; maxSize?: Size | undefined; className?: string | undefined; children: ReactNode }) {
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

function ResizableHandle({ className }: { className?: string | undefined }) {
  const orientation = useContext(OrientationContext);
  return (
    <Separator
      className={cn(
        "relative shrink-0 border-default outline-none transition-colors duration-fast ease-standard hover:border-brand focus-visible:border-brand",
        orientation === "horizontal" ? "w-0 cursor-col-resize border-s" : "h-0 cursor-row-resize border-t",
        className,
      )}
    >
      <span aria-hidden className={cn("absolute", orientation === "horizontal" ? "inset-y-0 -start-050 w-100" : "inset-x-0 -top-050 h-100")} />
    </Separator>
  );
}

export const Resizable = Object.assign(ResizableRoot, { Panel: ResizablePanel, Handle: ResizableHandle });
