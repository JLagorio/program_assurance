import { useState, type ReactNode } from "react";
import { Button, KeyValue, Stack } from "@ledger/design-system";
import { VocabularyValue } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import type { TableName } from "@/lib/models";
import { labelFor, type DataRecord, type RecordValue } from "@/lib/records";
import type { StatusVocabulary } from "@/lib/status";
import { productRecordNoun } from "@/lib/product-records";
import { ProductRecordDialog } from "./product-record-dialog";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { FactValue, RelationName } from "./record-tools";

/**
 * One labelled property of the preview. Without `render` the value is drawn by its kind: a
 * status or level through its vocabulary, a date through the reader's locale and zone, a related
 * record by its name, and nothing as Absent. A table column passes as a field: its `value` and
 * `statuses` draw a derived fact (a count, a latest revision's severity) as the cell does.
 */
export type RecordSummaryField<T> = {
  key: string;
  label?: string | undefined;
  render?: ((row: T) => ReactNode) | undefined;
  value?: ((row: T) => RecordValue | undefined) | undefined;
  statuses?: StatusVocabulary | undefined;
};

/** Past this many characters a label no longer fits the default 104px column. */
const LONG_LABEL = 14;

/** A record summary for collections that do not need a domain-specific preview body. */
export function RecordSummaryPreview<T extends { id: string }>({
  model,
  record,
  rows,
  onSelect,
  onClose,
  fields,
  children,
  readOnly = false,
  onEdit,
  recordActions,
  title,
}: {
  model: TableName;
  record: T;
  rows: T[];
  onSelect: (row: T) => void;
  onClose: () => void;
  /**
   * The properties the reader needs, in the order they ask for them: status, owner, dates,
   * identifiers. Never every column: identifiers, revisions and timestamps are the schema's.
   */
  fields: readonly RecordSummaryField<T>[];
  children?: ReactNode | undefined;
  readOnly?: boolean | undefined;
  onEdit?: (() => void) | undefined;
  /** Record commands in place of the default Edit: one primary and an overflow menu. */
  recordActions?: ReactNode | undefined;
  /** The record's name, for a model with no name, title or code column ("Step 3"). */
  title?: ReactNode | undefined;
}) {
  const workspace = useWorkspace();
  const [editing, setEditing] = useState(false);
  const data = record as unknown as DataRecord;
  const noun = productRecordNoun(model, data);
  const collection = workspace.collections.find((item) => item.name === model);
  const canEdit =
    !readOnly &&
    workspace.role !== "viewer" &&
    collection?.can_update &&
    (onEdit ||
      (data["tenant_id"] === workspace.tenantId &&
        typeof data["revision"] === "number" &&
        data["state"] !== "published"));
  /** The table a foreign-key field points at, so the fact shows the related record by name. */
  const relation = (key: string) =>
    collection?.relations.find((item) => item.columns.length === 1 && item.columns[0] === key)
      ?.target_table as TableName | undefined;
  const value = (field: RecordSummaryField<T>) => {
    if (field.render) return field.render(record);
    const raw = field.value ? field.value(record) : (data[field.key] as RecordValue | undefined);
    if (field.statuses)
      return (
        <VocabularyValue
          values={field.statuses}
          value={raw === null || raw === undefined ? null : String(raw)}
        />
      );
    if (field.value) return <FactValue table={model} field={field.key} value={raw} />;
    const target = relation(field.key);
    if (target && (typeof raw === "string" || raw === null || raw === undefined))
      return <RelationName table={target} id={raw} />;
    return <FactValue table={model} field={field.key} value={raw} />;
  };
  const labels = fields.map((field) => field.label ?? labelFor(field.key.replace(/_id$/, "")));
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  return (
    <>
      {editing && (
        <ProductRecordDialog
          table={model}
          existing={data}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            onSelect({ ...record, ...saved });
            setEditing(false);
          }}
        />
      )}
      <RecordPreviewPanel
        title={title ?? String(data["name"] ?? data["title"] ?? data["code"] ?? Noun)}
        label={`${Noun} preview`}
        onClose={onClose}
        recordActions={
          recordActions ??
          (canEdit ? (
            <Button size="small" variant="primary" onClick={onEdit ?? (() => setEditing(true))}>
              Edit {noun}
            </Button>
          ) : undefined)
        }
        navigation={
          <RecordPreviewActions table={model} record={record} rows={rows} onSelect={onSelect} />
        }
      >
        <Stack space="space.200">
          {fields.length ? (
            <KeyValue.Group
              {...(labels.some((label) => label.length > LONG_LABEL) ? { labelWidth: 160 } : {})}
            >
              {fields.map((field, index) => (
                <KeyValue key={field.key} label={labels[index]!} wrap>
                  {value(field)}
                </KeyValue>
              ))}
            </KeyValue.Group>
          ) : null}
          {children}
        </Stack>
      </RecordPreviewPanel>
    </>
  );
}
