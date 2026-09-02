import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "./controls";
import { InputGroup } from "./input-group";

/** The row above a table: a search field, the filters, and the actions on the right. */
export function Toolbar({ search, onSearch, placeholder = "Search", children, actions }: { search?: string | undefined; onSearch?: ((v: string) => void) | undefined; placeholder?: string | undefined; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-100 pb-100 pt-150">
      {onSearch ? (
        <InputGroup leading={<Search />} width={200}>
          <Input value={search ?? ""} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="h-control-small" />
        </InputGroup>
      ) : null}
      {children}
      {actions ? <span className="ms-auto flex items-center gap-100">{actions}</span> : null}
    </div>
  );
}
