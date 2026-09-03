import type { ReactNode } from "react";

import { Count } from "../components/badge";

/** A block of work, always open. The counterpart to Collapsible: a heading plus a count is the whole label. */
export function Block({ title, count, action, children }: { title: string; count?: number | string | null | undefined; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-default pt-100">
      <div className="flex h-control-small items-center gap-100">
        <h2 className="font-body font-medium text-default">{title}</h2>
        {count ? <Count value={count} /> : null}
        {action ? <span className="ms-auto flex items-center gap-100">{action}</span> : null}
      </div>
      <div className="pb-200 pt-050">{children}</div>
    </section>
  );
}
