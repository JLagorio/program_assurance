import { Children } from "react";
import type { ReactNode } from "react";

import { Count } from "../components/badge";
import { raisedSurface } from "./card";

/** A small card of linked records: a titled list with a count, rows that may be buttons. People are named in one neutral style; colour is reserved for state. */
function RelatedRoot({ title, count, action, children, empty = "Nothing linked yet" }: { title: ReactNode; count?: number | undefined; action?: ReactNode; children?: ReactNode; empty?: string | undefined }) {
  const has = Children.count(children) > 0;
  return (
    <div className="flex flex-col overflow-hidden rounded-large border border-default bg-surface-raised" style={raisedSurface}>
      <div className="flex h-row-compact items-center gap-100 border-b border-default px-150">
        <span className="truncate font-body font-medium text-default">{title}</span>
        {typeof count === "number" ? <Count value={count} /> : null}
        {action ? <span className="ms-auto flex items-center">{action}</span> : null}
      </div>
      {has ? <div className="[&>*+*]:border-t [&>*+*]:border-default">{children}</div> : <div className="px-150 py-150 font-body text-subtle">{empty}</div>}
    </div>
  );
}

/** One line inside a Related card: label, optional meta, optional trailing value. */
function RelatedRow({ lead, label, meta, trailing, onClick }: { lead?: ReactNode; label: ReactNode; meta?: ReactNode; trailing?: ReactNode; onClick?: (() => void) | undefined }) {
  const inner = (
    <>
      {lead ? <span className="flex shrink-0 items-center">{lead}</span> : null}
      <span className="min-w-0 flex-1 truncate font-body text-default">{label}</span>
      {meta ? <span className="shrink-0 truncate font-body-small text-subtle">{meta}</span> : null}
      {trailing ? <span className="shrink-0 font-body-small text-subtle tabular-nums">{trailing}</span> : null}
    </>
  );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className="flex h-control-medium w-full items-center gap-100 px-150 text-left outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused">
        {inner}
      </button>
    );
  return <div className="flex h-control-medium items-center gap-100 px-150">{inner}</div>;
}

export const Related = Object.assign(RelatedRoot, { Row: RelatedRow });
