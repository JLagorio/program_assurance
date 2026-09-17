import { useId, type ReactNode } from "react";
import {
  Button,
  Field,
  FieldLabel,
  Inline,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@ledger/design-system";
import { ProductRecordDialog } from "./product-record-dialog";
import type { DataRecord, RecordValue } from "@/lib/records";
import { QueryState, type QueryStatus } from "./work-common";

export function LibrarySelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select<string>
        value={value}
        items={options}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger id={id} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function LibraryLoading({
  queries,
  children,
}: {
  queries: QueryStatus[];
  children: ReactNode;
}) {
  return <QueryState queries={queries}>{children}</QueryState>;
}

export function LibraryEditor({
  table,
  description,
  initialValues,
  existing,
  onClose,
  onSaved,
}: {
  table: string;
  description?: string | undefined;
  initialValues?: Record<string, RecordValue>;
  existing?: DataRecord;
  onClose: () => void;
  onSaved?: (record: DataRecord) => void | Promise<void>;
}) {
  return (
    <ProductRecordDialog
      table={table}
      description={description}
      existing={existing}
      initialValues={initialValues}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}
