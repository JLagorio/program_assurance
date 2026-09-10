import type { ReactNode } from "react";

import { Tabs, TabsContent } from "../components/tabs";
import { cn } from "../lib/cn";

export type IndexPageProps = {
  /** A PageHeader. */
  header: ReactNode;
  /** Search, filters or view controls between the header and the main work area. */
  filters?: ReactNode;
  /** The main work area: a table, board, list or empty state. */
  children: ReactNode;
};

/** Header, view controls and the main work area. Compose a detail surface when users need to inspect or act on a selected record. */
export function IndexPage({ header, filters, children }: IndexPageProps) {
  return (
    <div className="flex flex-col gap-200 animate-rise">
      {header}
      {filters ? <div className="flex flex-wrap items-center gap-100">{filters}</div> : null}
      {children}
    </div>
  );
}

/** RecordHeader, one tab strip running the full width, then the tab body. With `tab`, the page is the Tabs root and the body is the selected tab's panel, so the strip and the body are one ARIA pattern. `rail` renders beside the body, under the tab strip: the record's details and related information, every Inspector group, where that context supports the active task; tabs without a rail run full width. The rail column is `dimension.layout.rail` plus its rule. */
export type ShowPageProps = {
  /** A RecordHeader. */
  header: ReactNode;
  /** The TabsList, running the full width under the header. */
  tabs?: ReactNode;
  /** The selected tab's value, the router's search param on a record. With it the page is the Tabs root and the body its panel; pass it with `onTabChange` whenever `tabs` is passed. */
  tab?: string | undefined;
  /** Called with the tab's value when the reader selects one. */
  onTabChange?: ((value: string) => void) | undefined;
  /** The record's rail, beside the body of the tab that shows it. Pass it on the tabs where that context helps the user act. */
  rail?: ReactNode;
  /** The focused work area for the selected tab. */
  children: ReactNode;
};

export function ShowPage({ header, tabs, tab, onTabChange, rail, children }: ShowPageProps) {
  const withRail = rail !== undefined && rail !== null && rail !== false;
  const body = (
    <div className={cn("flex min-w-0 flex-col gap-400", withRail && "lg:pe-300")}>{children}</div>
  );
  const page = (
    <div className="flex flex-col gap-150 animate-rise">
      {header}
      {tabs}
      <div className={cn("grid pt-200", withRail && "gap-400 lg:grid-cols-main-rail lg:gap-0")}>
        {tab === undefined ? body : <TabsContent value={tab} render={body} />}
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
  if (tab === undefined) return page;
  return (
    <Tabs
      value={tab}
      {...(onTabChange ? { onValueChange: onTabChange } : {})}
      className="gap-150"
      render={page}
    />
  );
}
