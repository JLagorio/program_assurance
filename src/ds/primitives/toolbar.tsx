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
