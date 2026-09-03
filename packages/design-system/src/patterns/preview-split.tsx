import { Children, type ReactNode } from "react";

import { Resizable } from "../components/resizable";
import { Grid } from "../primitives/grid";

/**
 * An index table with a preview rail the reader sizes for themselves. The first child is the
 * list; whatever follows (the open PreviewRail, or nothing) is the rail. Closed, it is just the
 * list at full width. This is the rail beside a table, not the record's rail, which is the
 * shell's panel.
 */
export function PreviewSplit({ open, children }: { open: boolean; children: ReactNode }) {
  const [list, ...rail] = Children.toArray(children);
  if (!open) return <Grid>{list}</Grid>;
  return (
    <Resizable className="items-start">
      <Resizable.Panel minSize={55}>
        <div className="min-w-0 flex-1">{list}</div>
      </Resizable.Panel>
      <Resizable.Handle />
      <Resizable.Panel defaultSize={26} minSize={18} maxSize={45}>
        <div className="min-w-0 flex-1">{rail}</div>
      </Resizable.Panel>
    </Resizable>
  );
}
