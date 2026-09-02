import type { ReactNode } from "react";

/**
 * A block of work, always open. The counterpart to `Collapsible` — no
 * description prop, because a heading plus a count is the whole label.
 */
export function Block({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number | string | null;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-2.5">
      <div className="flex min-h-7 items-center gap-2">
        <h2 className="text-[13px] font-medium tracking-[-0.005em]">{title}</h2>
        {count !== undefined && count !== null && count !== 0 ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
        {action ? <span className="ml-auto flex items-center gap-2">{action}</span> : null}
      </div>
      <div className="pb-4">{children}</div>
    </section>
  );
}
