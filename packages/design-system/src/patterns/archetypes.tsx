import type { ReactNode } from "react";

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

/** RecordHeader, one tab strip, then the tab body, full width. The rail is the shell's panel: the route renders it beside the ShowPage in Shell.Panel, and it stays while the tabs change. */
export function ShowPage({
  header,
  tabs,
  children,
}: {
  header: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-200 animate-rise">
      {header}
      {tabs}
      <div className="flex min-w-0 flex-col gap-400 pt-300">{children}</div>
    </div>
  );
}
