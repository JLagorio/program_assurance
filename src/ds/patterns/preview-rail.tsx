import type { ReactNode } from "react";

import { Id } from "../primitives/id";

/** The right rail is a preview surface only — never the record itself. */
export function PreviewRail({
  id,
  title,
  onClose,
  openTo,
  children,
}: {
  id: ReactNode;
  title?: ReactNode;
  onClose: () => void;
  openTo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Preview
        </span>
        <Id>{id}</Id>
        <button
          onClick={onClose}
          className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
      {title ? <h2 className="mt-1.5 text-[13.5px] font-medium leading-snug">{title}</h2> : null}
      {openTo ? <div className="mt-1.5 text-[12.5px]">{openTo}</div> : null}
      <div className="mt-3">{children}</div>
    </aside>
  );
}
