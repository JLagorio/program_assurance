import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Id } from "./id";

/* One row of a list that is not a table: a milestone, a decision note, an
   event, a linked record. Leading mark, an id column, the title with a line
   of meta under it, right-aligned values, and actions. `to` makes the row a
   link, `onSelect` a button; otherwise it is static. Rows stack in Item.Group. */
function ItemRoot({
  leading,
  id,
  idWidth = 72,
  title,
  description,
  meta,
  trailing,
  actions,
  to,
  params,
  onSelect,
  active,
  className,
}: {
  leading?: ReactNode;
  id?: ReactNode;
  idWidth?: number;
  title: ReactNode;
  description?: ReactNode;
  /** Inline after the title, muted. */
  meta?: ReactNode;
  /** Right-aligned value or date, tabular. */
  trailing?: ReactNode;
  actions?: ReactNode;
  to?: string;
  params?: Record<string, string>;
  onSelect?: () => void;
  active?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      {leading ? <span className="flex h-5 shrink-0 items-center">{leading}</span> : null}
      {id ? (
        <span className="shrink-0 truncate text-muted-foreground" style={{ width: idWidth }}>
          <Id>{id}</Id>
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 truncate text-[13px] text-foreground">{title}</span>
          {meta ? (
            <span className="shrink-0 truncate text-[12px] text-muted-foreground">{meta}</span>
          ) : null}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className="tnum shrink-0 text-right text-[12px] text-muted-foreground">
          {trailing}
        </span>
      ) : null}
      {actions ? (
        <span className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {actions}
        </span>
      ) : null}
    </>
  );
  const rowClass = cn(
    "flex w-full items-start gap-3 px-1 py-2 text-left",
    (to || onSelect) && "rounded-md transition-colors duration-100 hover:bg-surface-hover",
    active && "bg-primary-soft hover:bg-primary-soft",
    className,
  );
  return (
    <li className="list-none">
      {to ? (
        <Link to={to} params={params as never} className={rowClass}>
          {inner}
        </Link>
      ) : onSelect ? (
        <button type="button" onClick={onSelect} className={rowClass}>
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  );
}

/** The list the rows stack in. Hairlines between rows; `empty` when there are none. */
function ItemGroup({
  children,
  empty,
  className,
}: {
  children?: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  const has = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  if (!has && empty) return <p className="py-2.5 text-[13px] text-muted-foreground">{empty}</p>;
  return <ol className={cn("-mx-1 divide-y divide-border-subtle", className)}>{children}</ol>;
}

export const Item = Object.assign(ItemRoot, { Group: ItemGroup });
