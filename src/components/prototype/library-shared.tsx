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
  queries: { isPending: boolean; error: Error | null }[];
  children: ReactNode;
}) {
  const error = queries.find((query) => query.error)?.error;
  if (error)
    return (
      <p role="alert" className="text-danger">
        {error.message}
      </p>
    );
  if (queries.some((query) => query.isPending))
    return (
      <p role="status" className="text-subtle">
        Loading library records…
      </p>
    );
  return <>{children}</>;
}

export function LibraryEditor({
  table,
  title,
  initialValues,
  existing,
  onClose,
  onSaved,
}: {
  table: string;
  title: string;
  initialValues?: Record<string, RecordValue>;
  existing?: DataRecord;
  onClose: () => void;
  onSaved?: (record: DataRecord) => void | Promise<void>;
}) {
  return (
    <ProductRecordDialog
      table={table}
      title={title}
      existing={existing}
      initialValues={initialValues}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}
