import { Children, type ReactNode } from "react";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/resizable";
import { Grid } from "../primitives/grid";

/**
 * An index table with a preview rail the reader sizes for themselves. The first child is the
 * list; whatever follows (the open PreviewRail, or nothing) is the rail. Closed, it is just the
 * list at full width. This is the rail beside a table, not the record's rail, which is the
 * shell's panel.
 */
export type PreviewSplitProps = {
  /** Whether a row is chosen: open, the rail shows beside the list; closed, the list has the width. */
  open: boolean;
  /** The list first; then the PreviewRail of the chosen row, or nothing. */
  children: ReactNode;
};

export function PreviewSplit({ open, children }: PreviewSplitProps) {
  const [list, ...rail] = Children.toArray(children);
  if (!open) return <Grid>{list}</Grid>;
  return (
    <ResizablePanelGroup className="items-start">
      <ResizablePanel minSize="55%">
        <div className="min-w-0 flex-1">{list}</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="26%" minSize="18%" maxSize="45%">
        <div className="min-w-0 flex-1">{rail}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
