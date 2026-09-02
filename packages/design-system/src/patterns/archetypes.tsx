import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** Header, one filter row, one dense table. The only inline detail surface is the preview rail. */
export function IndexPage({ header, filters, children }: { header: ReactNode; filters?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-200 animate-rise">
      {header}
      {filters ? <div className="flex flex-wrap items-center gap-100">{filters}</div> : null}
      {children}
    </div>
  );
}

/** RecordHeader, one tab strip, then the tab body. The rail renders only beside the overview tab; every other tab is full width. */
export function ShowPage({ header, tabs, showRail, rail, children }: { header: ReactNode; tabs?: ReactNode; showRail?: boolean | undefined; rail?: ReactNode; children: ReactNode }) {
  const withRail = Boolean(showRail && rail);
  return (
    <div className="flex flex-col gap-200 animate-rise">
      {header}
      {tabs}
      <div className={cn("grid", withRail && "lg:grid-cols-main-rail")}>
        <div className={cn("flex min-w-0 flex-col gap-400 pt-300", withRail && "lg:pe-300")}>{children}</div>
        {withRail ? <aside className="pt-300 lg:border-s lg:border-default lg:ps-300">{rail}</aside> : null}
      </div>
    </div>
  );
}
