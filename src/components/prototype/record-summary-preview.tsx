import { useState, type ReactNode } from "react";
import {
  Absent,
  Button,
  KeyValue,
  Skeleton,
  Stack,
  Text,
  VisuallyHidden,
} from "@ledger/design-system";
import { VocabularyValue } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useCollection } from "@/lib/collections";
import type { TableName } from "@/lib/models";
import { labelFor, type DataRecord, type RecordValue } from "@/lib/records";
import type { StatusVocabulary } from "@/lib/status";
import { productColumnLabel, productRecordNoun } from "@/lib/product-records";
import { ProductRecordDialog } from "./product-record-dialog";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { FactValue, RelationName } from "./record-tools";
import { ReportFailures } from "./work-common";

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

/** Past this many characters a label no longer fits KeyValue's `default` label column. */
const LONG_LABEL = 14;
/** A field that may name another record by its id ("owner_party_id"), until the schema says. */
const REFERENCE_KEY = /_id$/;

/** A record summary for collections that do not need a domain-specific preview body. */
export function RecordSummaryPreview<T extends { id: string }>({
  model,
  record,
  rows = [],
  onSelect,
  navigation,
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
  /** The collection's displayed rows, which previous and next step through. */
  rows?: T[] | undefined;
  /** Shows another row of the collection, or the record as an edit saved it. */
  onSelect?: ((row: T) => void) | undefined;
  /**
   * The header's navigation, in place of the collection's previous and next: `null` for a record
   * previewed on its own, which has no neighbours.
   */
  navigation?: ReactNode | undefined;
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
  // The schema names the facts' kinds and the records their fields point at; it loads as the
  // preview opens.
  const schema = useCollection(model);
  const collection = schema.data ?? undefined;
  // Every member but a viewer edits the workspace's own records, and row-level security decides
  // each write: the role says it, so the edit never waits on the schema. Its form does, as it opens.
  const canEdit =
    !readOnly &&
    workspace.role !== "viewer" &&
    (onEdit ||
      (data["tenant_id"] === workspace.tenantId &&
        typeof data["revision"] === "number" &&
        data["state"] !== "published"));
  // A field drawn from the stored value (not by its own render or vocabulary) reads the schema.
  const readsSchema = fields.some((field) => !field.render && !field.statuses);
  /**
   * The foreign key a field belongs to, so the fact shows the related record by name. The field
   * is the key's column for the target's id, alone or beside the columns a composite key carries
   * with it: a workspace's records name each other with their tenant, and a framework item names
   * the item that holds it with their revision.
   */
  const relation = (key: string) =>
    key === "tenant_id"
      ? undefined
      : collection?.relations.find(
          (item) => item.target_columns[item.columns.indexOf(key)] === "id",
        );
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
    if (field.value)
      return <FactValue table={model} field={field.key} value={raw} collection={collection} />;
    const target = relation(field.key);
    if (target && (typeof raw === "string" || raw === null || raw === undefined)) {
      // A record of another schema (an account, a stored file) is one no reader can read by name.
      if (target.target_schema !== "public")
        return raw ? <Absent label="Not available" /> : <Absent />;
      return <RelationName table={target.target_table as TableName} id={raw} />;
    }
    // Until the schema says which fields name another record, such a field waits, and when it
    // cannot be read the field says so: never its id.
    if (!collection && REFERENCE_KEY.test(field.key) && typeof raw === "string") {
      if (schema.isPending)
        return (
          <>
            <Skeleton shape="line" width={96} />
            <VisuallyHidden>Loading</VisuallyHidden>
          </>
        );
      if (schema.isError) return <Text color="color.text.subtle">Could not load</Text>;
    }
    return <FactValue table={model} field={field.key} value={raw} collection={collection} />;
  };
  // A fact reads in the product's words where it has them for the column, as a form's field and a
  // program collection's preview do ("Security outcome", not "Outcome item"); else in the column's.
  const labels = fields.map(
    (field) =>
      field.label ??
      productColumnLabel(model, field.key, data) ??
      labelFor(field.key.replace(/_id$/, "")),
  );
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  return (
    <>
      {editing && (
        <ProductRecordDialog
          table={model}
          existing={data}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            onSelect?.({ ...record, ...saved });
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
          navigation !== undefined ? (
            navigation
          ) : (
            <RecordPreviewActions
              table={model}
              record={record}
              rows={rows}
              onSelect={onSelect ?? (() => {})}
            />
          )
        }
      >
        <Stack space="space.200">
          {/* The panel is drawn outside the page's region, so it says its own failure, with Retry. */}
          {readsSchema && <ReportFailures queries={[schema]} />}
          {fields.length ? (
            <KeyValue.Group
              {...(labels.some((label) => label.length > LONG_LABEL)
                ? { labelWidth: "wide" as const }
                : {})}
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
