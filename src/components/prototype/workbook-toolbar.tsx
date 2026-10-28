import {
  Button,
  Count,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@ledger/design-system";
import { ArrowDownWideNarrow, ArrowUpDown, Filter } from "lucide-react";
import { labelFor } from "@/lib/records";

export type WorkbookQuestion = {
  search: string;
  filterColumn: string;
  sort: string;
  descending: boolean;
};

/** Presentation controls share one toolbar with the grid's editing commands. */
export function WorkbookViewControls({
  name,
  columns,
  question,
  onQuestion,
  view,
  onView,
  disabled,
  filterOpen,
  onFilterOpenChange,
}: {
  name: string;
  columns: readonly { id: string; name: string }[];
  question: WorkbookQuestion;
  onQuestion: (patch: Partial<WorkbookQuestion>) => void;
  view: string;
  onView: (view: string) => void;
  disabled: boolean;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      {view !== "matrix" && (
        <>
          <Popover open={filterOpen} onOpenChange={onFilterOpenChange}>
            <PopoverTrigger
              render={
                <Button size="small" variant="subtle" iconBefore={<Filter />} disabled={disabled}>
                  Filter{question.search && <Count value={1} />}
                </Button>
              }
            />
            <PopoverContent align="start">
              <PopoverTitle>Filter rows</PopoverTitle>
              <Stack space="space.150">
                <Field>
                  <FieldLabel>Filter column</FieldLabel>
                  <Select
                    value={question.filterColumn || "all-columns"}
                    onValueChange={(value) =>
                      onQuestion({ filterColumn: value === "all-columns" ? "" : (value ?? "") })
                    }
                  >
                    <SelectTrigger size="small">
                      <SelectValue>
                        {columns.find((column) => column.id === question.filterColumn)?.name ??
                          "All columns"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-columns">All columns</SelectItem>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Find in {name}</FieldLabel>
                  <Input
                    size="small"
                    value={question.search}
                    onValueChange={(search) => onQuestion({ search })}
                    placeholder={question.filterColumn ? "Contains…" : "Filter all rows"}
                  />
                </Field>
                <Button
                  size="small"
                  variant="subtle"
                  disabled={!question.search && !question.filterColumn}
                  onClick={() => onQuestion({ search: "", filterColumn: "" })}
                >
                  Clear filter
                </Button>
              </Stack>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  size="small"
                  variant="subtle"
                  iconBefore={<ArrowUpDown />}
                  disabled={disabled}
                >
                  Sort{question.sort && <Count value={1} />}
                </Button>
              }
            />
            <PopoverContent align="start">
              <PopoverTitle>Sort view</PopoverTitle>
              <Stack space="space.150">
                <Field>
                  <FieldLabel>Sort view by</FieldLabel>
                  <Select
                    value={question.sort || "source-order"}
                    onValueChange={(value) =>
                      onQuestion({ sort: value === "source-order" ? "" : (value ?? "") })
                    }
                  >
                    <SelectTrigger size="small">
                      <SelectValue>
                        {columns.find((column) => column.id === question.sort)?.name ??
                          "Sheet order"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source-order">Sheet order</SelectItem>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  size="small"
                  iconBefore={<ArrowDownWideNarrow />}
                  disabled={!question.sort}
                  onClick={() => onQuestion({ descending: !question.descending })}
                >
                  {question.descending ? "Descending" : "Ascending"}
                </Button>
                <Button
                  size="small"
                  variant="subtle"
                  disabled={!question.sort}
                  onClick={() => onQuestion({ sort: "", descending: false })}
                >
                  Clear sort
                </Button>
              </Stack>
            </PopoverContent>
          </Popover>
        </>
      )}
      <Select value={view} onValueChange={(value) => value && onView(value)} disabled={disabled}>
        <SelectTrigger size="small" aria-label="View">
          <SelectValue>
            {view === "grid"
              ? "Spreadsheet"
              : view === "matrix"
                ? "Traceability matrix"
                : "Pivot & chart"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="grid">Spreadsheet</SelectItem>
          <SelectItem value="matrix">Traceability matrix</SelectItem>
          <SelectItem value="analysis">Pivot & chart</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
