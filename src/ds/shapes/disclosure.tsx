import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Reference material: present, addressable, closed.
 *
 * The catalog statement, the assessment objectives and the discussion are all
 * things a reader occasionally needs and never needs first. Rendering them
 * expanded is most of why a control page reads as a novel.
 */
export function Disclosure({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number | string | null;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2.5 text-left"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
        <span className="text-[13px] font-medium tracking-[-0.005em]">{title}</span>
        {count !== undefined && count !== null && count !== 0 ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
      </button>
      {open ? <div className="pb-4">{children}</div> : null}
    </section>
  );
}

/**
 * A block of work, always open. The counterpart to `Disclosure` — no
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
