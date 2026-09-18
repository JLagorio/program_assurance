import type { DataRecord, RecordValue } from "@/lib/records";
import {
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ledger/design-system";
import { useId } from "react";
import { ProductRecordDialog } from "./product-record-dialog";

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

export { QueryState as LibraryLoading } from "./work-common";

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
