import { Children } from "react";
import type { ReactNode } from "react";

function RelatedRoot({
  title,
  count,
  action,
  children,
  empty = "Nothing linked yet",
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  children?: ReactNode;
  empty?: string;
}) {
  const has = Children.count(children) > 0;
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex h-9 items-center gap-2 border-b border-border px-3">
        <span className="truncate text-[12.5px] font-medium">{title}</span>
        {typeof count === "number" ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
        {action ? <span className="ml-auto flex items-center">{action}</span> : null}
      </div>
      {has ? (
        <div className="divide-y divide-border/70">{children}</div>
      ) : (
        <div className="px-3 py-3 text-[12.5px] text-muted-foreground">{empty}</div>
      )}
    </div>
  );
}

/** One line inside a RelatedCard: label, optional meta, optional trailing value. */
function RelatedRow({
  lead,
  label,
  meta,
  trailing,
  onClick,
}: {
  lead?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {lead ? <span className="flex shrink-0 items-center">{lead}</span> : null}
      <span className="min-w-0 flex-1 truncate text-[12.5px]">{label}</span>
      {meta ? (
        <span className="shrink-0 truncate text-[12px] text-muted-foreground">{meta}</span>
      ) : null}
      {trailing ? (
        <span className="tnum shrink-0 text-[12px] text-muted-foreground">{trailing}</span>
      ) : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex h-8 w-full items-center gap-2 px-3 text-left transition-colors hover:bg-muted/60"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex h-8 items-center gap-2 px-3">{inner}</div>;
}

/* People are named everywhere; text-only names read as a spreadsheet. One
   neutral style: colour is reserved for state, and a red avatar beside a red
   badge made the two indistinguishable. */

export const Related = Object.assign(RelatedRoot, { Row: RelatedRow });
