import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Input } from "./controls";

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search",
  children,
  actions,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5 pt-3">
      {onSearch ? (
        <span className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-7 w-[200px] pl-7 text-13"
          />
        </span>
      ) : null}
      {children}
      {actions ? <span className="ml-auto flex items-center gap-2">{actions}</span> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex h-7 items-center gap-0.5 rounded-md bg-muted p-0.5">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          onClick={() => onChange(i.value)}
          aria-pressed={value === i.value}
          className={cn(
            "inline-flex h-6 items-center rounded-[5px] px-2 text-12 font-medium transition-colors duration-100",
            value === i.value
              ? "bg-card text-foreground shadow-hairline"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
