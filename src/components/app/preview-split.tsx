import { Children, type ReactNode } from "react";

import { Grid, Resizable } from "@ledger/design-system";

/**
 * A list with a preview rail the reader sizes for themselves. The first child
 * is the list; whatever follows (the open PreviewRail, or nothing) is the rail.
 * Closed, it is just the list at full width.
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
