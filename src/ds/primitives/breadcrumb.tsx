import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/* Where you are. Every item but the last is a link back up the record tree;
   the last is the page itself. A record page with no trail is a dead end. */
export function Breadcrumb({
  items,
  className,
}: {
  items: {
    label: ReactNode;
    to?: string;
    params?: Record<string, string>;
    search?: Record<string, unknown>;
    onSelect?: () => void;
  }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const text = <span className="max-w-[240px] truncate">{item.label}</span>;
          return (
            <li key={i} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight aria-hidden className="size-3 shrink-0 text-muted-foreground/70" />
              ) : null}
              {last ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link
                  to={item.to}
                  params={item.params as never}
                  search={item.search as never}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {text}
                </Link>
              ) : item.onSelect ? (
                <button
                  type="button"
                  onClick={item.onSelect}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {text}
                </button>
              ) : (
                text
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
