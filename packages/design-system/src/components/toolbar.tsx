import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Input } from "./controls";
import { InputGroup } from "./input-group";

export type ToolbarProps = {
  /** The search field's value. With `onSearch`, the field is drawn at the start. */
  search?: string | undefined;
  /** Called with the field's value on every keystroke. Without it there is no search field. */
  onSearch?: ((value: string) => void) | undefined;
  /** Names what is searched, in the field and as its accessible name: "Search controls". */
  placeholder?: string | undefined;
  /** The filters, after the search: FilterChips, a ToggleGroup, a small Select. */
  children?: ReactNode;
  /** What sits at the end: small Buttons, or a count as text. */
  actions?: ReactNode;
  className?: string | undefined;
};

/** The row above a table: a search field, the filters, and the actions at the end. */
export function Toolbar({
  search,
  onSearch,
  placeholder = "Search",
  children,
  actions,
  className,
}: ToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-100 pb-100 pt-150", className)}>
      {onSearch ? (
        <InputGroup leading={<Search />} width={200}>
          <Input
            type="search"
            size="small"
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </InputGroup>
      ) : null}
      {children}
      {actions ? <span className="ms-auto flex items-center gap-100">{actions}</span> : null}
    </div>
  );
}
