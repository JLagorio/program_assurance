import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import {
  DataTable,
  Toolbar,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  type DataTableProps,
} from "@ledger/design-system";
import { QueryState, type QueryStatus } from "./work-common";

/** The product collection contract: domain adapters own columns and relationships;
 * this composition owns loading recovery, the toolbar and the table's empty region. */
export type ProductCollectionProps<T extends { id: string }> = Omit<
  DataTableProps<T>,
  "toolbar" | "state" | "error" | "responsive"
> & {
  queries?: QueryStatus[];
  searchLabel?: string | undefined;
  views?: ReactNode;
  filters?: ReactNode;
  action?: ReactNode;
  commands?: { label: string; onSelect: () => void; disabled?: boolean }[] | undefined;
};

export function ProductCollection<T extends { id: string }>({
  queries = [],
  searchLabel = "Search records",
  views,
  filters,
  action,
  commands,
  empty,
  ...props
}: ProductCollectionProps<T>) {
  const { table } = props;
  return (
    <QueryState queries={queries}>
      <DataTable
        {...props}
        responsive
        empty={{
          ...empty,
          illustration: empty?.illustration ?? "records",
          title: empty?.title ?? "No records yet",
          description:
            empty?.description ??
            (empty?.action || action
              ? "Create a record to start this collection."
              : "Records will appear here when available."),
          action: empty?.action ?? action,
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder={searchLabel}
            views={
              views ?? (
                <DataTable.Presets
                  table={table}
                  variant="menu"
                  presets={[{ id: "all", label: "All records" }]}
                />
              )
            }
            filters={filters}
            actions={action}
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
            {!!commands?.length && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <IconButton
                      label="Collection actions"
                      icon={<MoreHorizontal />}
                      size="small"
                      variant="secondary"
                    />
                  }
                />
                <DropdownMenuContent align="end">
                  {commands.map((command) => (
                    <DropdownMenuItem
                      key={command.label}
                      disabled={command.disabled}
                      onClick={command.onSelect}
                    >
                      {command.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </Toolbar>
        }
      />
    </QueryState>
  );
}
