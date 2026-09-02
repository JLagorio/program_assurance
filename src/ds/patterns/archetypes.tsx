import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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
    <div className="animate-slide-up space-y-4">
      {header}
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      {children}
    </div>
  );
}

export function ShowPage({
  header,
  tabs,
  showRail,
  rail,
  children,
}: {
  header: ReactNode;
  tabs?: ReactNode;
  /** True only on the overview tab — the rail never renders elsewhere. */
  showRail?: boolean;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-slide-up space-y-4">
      {header}
      {tabs}
      <div className={cn("grid", showRail && rail ? "lg:grid-cols-[minmax(0,1fr)_272px]" : "")}>
        <div className={cn("min-w-0 space-y-7 pt-6", showRail && rail ? "lg:pr-6" : "")}>
          {children}
        </div>
        {showRail && rail ? (
          <aside className="pt-6 lg:border-l lg:border-border lg:pl-6">{rail}</aside>
        ) : null}
      </div>
    </div>
  );
}
