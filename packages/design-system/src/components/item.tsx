import { cloneElement, type ReactElement, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Id } from "./id";

export type ItemProps = {
  leading?: ReactNode;
  id?: ReactNode;
  idWidth?: number | undefined;
  title: ReactNode;
  description?: ReactNode;
  /** Inline after the title, muted. */
  meta?: ReactNode;
  /** Right-aligned value or date, tabular. */
  trailing?: ReactNode;
  actions?: ReactNode;
  /** A link element (a router's Link) that becomes the row. It receives the row's classes and content. */
  link?: ReactElement<{ className?: string; children?: ReactNode }> | undefined;
  onSelect?: (() => void) | undefined;
  isActive?: boolean | undefined;
  className?: string | undefined;
  /** Expanded content under the row, outside its link or button. */
  children?: ReactNode;
};

/** One row of a list that is not a table: a milestone, a decision, an event, a linked record. Rows stack in Item.Group. */
function ItemRoot({ leading, id, idWidth = 72, title, description, meta, trailing, actions, link, onSelect, isActive, className, children }: ItemProps) {
  const inner = (
    <>
      {leading ? <span className="flex h-250 shrink-0 items-center">{leading}</span> : null}
      {id ? (
        <span className="shrink-0 truncate text-subtle" style={{ width: idWidth }}>
          <Id>{id}</Id>
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-025">
        <span className="flex items-baseline gap-100">
          <span className="min-w-0 truncate font-body text-default">{title}</span>
          {meta ? <span className="shrink-0 truncate font-body-small text-subtle">{meta}</span> : null}
        </span>
        {description ? <span className="block font-body-small text-subtle">{description}</span> : null}
      </span>
      {trailing ? <span className="shrink-0 text-right font-body-small text-subtle tabular-nums">{trailing}</span> : null}
      {actions ? (
        <span className="flex shrink-0 items-center gap-050" onClick={(e) => e.stopPropagation()}>
          {actions}
        </span>
      ) : null}
    </>
  );
  const rowClass = cn(
    "flex w-full items-start gap-150 px-050 py-100 text-left outline-none",
    (link || onSelect) && "rounded-medium transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused",
    isActive && "bg-selected hover:bg-selected-hovered",
    className,
  );
  return (
    <li className="list-none">
      {link ? (
        cloneElement(link, { className: cn(rowClass, link.props.className), children: inner })
      ) : onSelect ? (
        <button type="button" onClick={onSelect} className={rowClass}>
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
      {children ? <div className="px-050 pb-150 pt-025">{children}</div> : null}
    </li>
  );
}

/** The list the rows stack in. Hairlines between rows; `empty` when there are none. */
function ItemGroup({ children, empty, className }: { children?: ReactNode; empty?: ReactNode; className?: string | undefined }) {
  const has = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  if (!has && empty) return <p className="py-150 font-body text-subtle">{empty}</p>;
  return <ol className={cn("[&>li+li]:border-t [&>li+li]:border-default", className)}>{children}</ol>;
}

export const Item = Object.assign(ItemRoot, { Group: ItemGroup });
