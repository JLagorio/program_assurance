import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Underline tab strip; buttons for in-page tabs. Border meets the rail's rule. */
export function Tabs({
  items,
  className,
}: {
  items: {
    key: string;
    label: ReactNode;
    active?: boolean;
    onSelect?: () => void;
    to?: string;
    params?: Record<string, string>;
    disabled?: boolean;
    trailing?: ReactNode;
  }[];
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-4 overflow-x-auto border-b border-border", className)}
    >
      {items.map((item) => {
        const content = (
          <span
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 pb-2.5 pt-1 text-[13px] transition-colors",
              item.active
                ? "border-primary font-medium text-foreground"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              item.disabled ? "opacity-60" : null,
            )}
          >
            {item.label}
            {item.trailing}
          </span>
        );
        if (item.to) {
          return (
            <Link key={item.key} to={item.to} params={item.params as never}>
              {content}
            </Link>
          );
        }
        return (
          <button key={item.key} onClick={item.onSelect} disabled={!item.onSelect}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
