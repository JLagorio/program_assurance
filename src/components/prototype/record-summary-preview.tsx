import { useState, type ReactNode } from "react";
import { Button, KeyValue, Stack } from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import type { TableName } from "@/lib/models";
import { displayValue, labelFor, type DataRecord } from "@/lib/records";
import { productRecordNoun } from "@/lib/product-records";
import { ProductRecordDialog } from "./product-record-dialog";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";

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
}: {
  model: TableName;
  record: T;
  rows: T[];
  onSelect: (row: T) => void;
  onClose: () => void;
  fields?: { key: string; label?: string; render?: (row: T) => ReactNode }[];
  children?: ReactNode;
  readOnly?: boolean;
  onEdit?: (() => void) | undefined;
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
        title={String(data["name"] ?? data["title"] ?? data["code"] ?? noun)}
        label={`${noun} preview`}
        onClose={onClose}
        recordActions={
          canEdit ? (
            <Button size="small" variant="primary" onClick={onEdit ?? (() => setEditing(true))}>
              Edit {noun}
            </Button>
          ) : undefined
        }
        navigation={
          <RecordPreviewActions table={model} record={record} rows={rows} onSelect={onSelect} />
        }
      >
        <Stack space="space.150">
          {(
            fields ??
            Object.keys(data)
              .filter(
                (key) =>
                  !["name", "title", "tenant_id", "metadata", "revision"].includes(key) &&
                  typeof data[key] !== "object",
              )
              .map((key): { key: string; label?: string; render?: (row: T) => ReactNode } => ({
                key,
              }))
          ).map((field) => (
            <KeyValue key={field.key} label={field.label ?? labelFor(field.key)} wrap>
              {field.render ? field.render(record) : displayValue(data[field.key])}
            </KeyValue>
          ))}
          {children}
        </Stack>
      </RecordPreviewPanel>
    </>
  );
}
