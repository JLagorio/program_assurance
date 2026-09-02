import { Children, type ReactNode } from "react";

import { Resizable } from "@/ds/primitives";

/**
 * A list with a preview rail the reader sizes for themselves. The first child
 * is the list; whatever follows (the open PreviewRail, or nothing) is the rail.
 * Closed, it is just the list at full width.
 */
export function PreviewSplit({ open, children }: { open: boolean; children: ReactNode }) {
  const [list, ...rail] = Children.toArray(children);
  if (!open) return <div className="grid">{list}</div>;
  return (
    <Resizable className="items-start">
      <Resizable.Panel minSize={55}>
        <div className="min-w-0 flex-1">{list}</div>
      </Resizable.Panel>
      <Resizable.Handle className="-mr-px" />
      <Resizable.Panel defaultSize={26} minSize={18} maxSize={45}>
        <div className="min-w-0 flex-1">{rail}</div>
      </Resizable.Panel>
    </Resizable>
  );
}
