import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "./controls";
import { InputGroup } from "./input-group";

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
        <InputGroup leading={<Search />} className="w-[200px]">
          <Input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-7 text-13"
          />
        </InputGroup>
      ) : null}
      {children}
      {actions ? <span className="ml-auto flex items-center gap-2">{actions}</span> : null}
    </div>
  );
}
