import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** Header, one filter row, one dense table. The inline detail surface is the preview rail (beside the table) or the preview sheet (over a full-width one); the record is never inline. */
export function IndexPage({
  header,
  filters,
  children,
}: {
  header: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-200 animate-rise">
      {header}
      {filters ? <div className="flex flex-wrap items-center gap-100">{filters}</div> : null}
      {children}
    </div>
  );
}

/** RecordHeader, one tab strip running the full width, then the tab body. `rail` renders beside the body, under the tab strip: the record's details and related information, every Inspector group, on the overview tab; every other tab runs full width. The rail column is `dimension.layout.rail` plus its rule. */
export function ShowPage({
  header,
  tabs,
  rail,
  children,
}: {
  header: ReactNode;
  tabs?: ReactNode;
  /** The record's rail, beside the body of the tab that shows it. Pass it on the overview tab and nothing on the others. */
  rail?: ReactNode;
  children: ReactNode;
}) {
  const withRail = rail !== undefined && rail !== null && rail !== false;
  return (
    <div className="flex flex-col gap-200 animate-rise">
      {header}
      {tabs}
      <div className={cn("grid pt-300", withRail && "gap-400 lg:grid-cols-main-rail lg:gap-0")}>
        <div className={cn("flex min-w-0 flex-col gap-400", withRail && "lg:pe-300")}>
          {children}
        </div>
        {withRail ? (
          <aside
            aria-label="Details"
            className="border-t border-default pt-300 lg:border-s lg:border-t-0 lg:ps-300 lg:pt-0"
          >
            {rail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
