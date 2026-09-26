import type { DataRecord, RecordValue } from "@/lib/records";
import {
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Text,
  VisuallyHidden,
} from "@ledger/design-system";
import type { ComponentProps, ReactNode } from "react";
import { ProductRecordDialog } from "./product-record-dialog";
import { QueryState, type QueryStatus } from "./work-common";

/** One choice from a short fixed list, labelled through the Field binding. */
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
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select<string>
        value={value}
        items={options}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger className="w-full">
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

/**
 * A value in a rail that comes from its own queries: a skeleton while they load, "Could not
 * load" when one fails with nothing to show, and the value once they are in. Loading and failure
 * never read as a value.
 */
export function QueryValue({
  queries,
  children,
}: {
  queries: QueryStatus[];
  /** The value, drawn only once every query has its data. */
  children: () => ReactNode;
}) {
  if (queries.some((query) => query.isError && query.data === undefined))
    return <Text color="color.text.subtle">Could not load</Text>;
  if (queries.some((query) => query.data === undefined))
    return (
      <>
        <Skeleton shape="line" width={64} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  return <>{children()}</>;
}

/** @deprecated Use QueryState from `./work-common`, or pass `queries` to ProductCollection. */
export { QueryState as LibraryLoading };

/** @deprecated Use ProductRecordDialog from `./product-record-dialog`; this passes its props through. */
export function LibraryEditor({
  table,
  description,
  initialValues,
  existing,
  onClose,
  onSaved,
  finalFocus,
}: {
  table: string;
  description?: string | undefined;
  initialValues?: Record<string, RecordValue>;
  existing?: DataRecord;
  onClose: () => void;
  onSaved?: (record: DataRecord) => void | Promise<void>;
  /** Where focus goes when the dialog closes; the control that opened it unsaid. */
  finalFocus?: ComponentProps<typeof ProductRecordDialog>["finalFocus"];
}) {
  return (
    <ProductRecordDialog
      table={table}
      description={description}
      existing={existing}
      initialValues={initialValues}
      onSaved={onSaved}
      onClose={onClose}
      {...(finalFocus === undefined ? {} : { finalFocus })}
    />
  );
}
