import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "program-assurance";
import { ChevronDown } from "lucide-react";

export function RowActions() {
  return (
    <div className="p-4" style={{ minHeight: 380 }}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">
            Actions <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Finding F-2031</DropdownMenuLabel>
          <DropdownMenuItem>
            Open detail <DropdownMenuShortcut>⏎</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Assign to…</DropdownMenuItem>
          <DropdownMenuItem>Link evidence</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Include in POA&M</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-danger">Accept risk</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
