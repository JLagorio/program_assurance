import {
  Absent,
  HeadingLevelProvider,
  Prose,
  Skeleton,
  Stack,
  Text,
  VisuallyHidden,
} from "@ledger/design-system";
import { frameworkProps, itemGuidance } from "@/lib/frameworks";
import { useRow, type TableName } from "@/lib/models";
import { frameworkItemWords, productRecordNoun } from "@/lib/product-records";
import { labelFor, type DataRecord } from "@/lib/records";
import { ApproachLayers } from "./control-resiliency";
import { ObservationDetails } from "./observations-register";
import type { RecordIdentity } from "./record-comparison";
import { RecordPreviewPanel } from "./record-preview";
import { RecordSummaryPreview, type RecordSummaryField } from "./record-summary-preview";
import { RelationName } from "./record-tools";
import { QueryState } from "./work-common";

/** The schema's own columns: identity, tenancy, concurrency and audit stamps are never a fact. */
const SCHEMA = new Set([
  "id",
  "tenant_id",
  "revision",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "props",
  "links",
  "source_pointer",
  "ordinal",
  "storage_object_id",
  "storage_object_name",
]);
/** What names the record: the preview's title says it. */
const NAME = new Set(["name", "title"]);
/** Authored text, read as paragraphs under the facts. */
const TEXT = new Set([
  "description",
  "statement",
  "prose",
  "rationale",
  "acceptance_criteria",
  "assessment_rationale",
  "remediation_plan",
  "resources",
  "provenance",
  "closure_rationale",
  "completion_rationale",
  "applicability_rationale",
  "not_applicable_rationale",
  "claim",
  "threat",
  "vulnerability",
]);
/** A record's standing reads first. */
const STANDING = ["status", "state", "severity", "determination", "decision", "priority"];

/** The facts a record with no curated preview shows: its own stored fields, standing first. */
function factsOf(record: DataRecord): RecordSummaryField<DataRecord>[] {
  const keys = Object.keys(record).filter((key) => {
    if (SCHEMA.has(key) || NAME.has(key) || TEXT.has(key)) return false;
    const value = record[key];
    return value === null || typeof value !== "object";
  });
  const first = STANDING.filter((key) => keys.includes(key));
  return [...first, ...keys.filter((key) => !first.includes(key))].map((key) => ({ key }));
}

/** The words a record holds under a key, else nothing. */
function wordsAt(record: DataRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * A record named through another: the record `id` names is read for the key that points on, and
 * the record there is named as RelationName names it. A security outcome's group is named through
 * its process, and an item's framework through its revision; `hops` steps along the same key
 * before the name. It loads, fails and goes missing as RelationName does.
 */
function NameThrough({
  table,
  id,
  by,
  target = table,
  hops = 1,
}: {
  table: TableName;
  id: string | null;
  /** The key of `table` that points at the next record. */
  by: string;
  /** The table the last step points at; `table` itself unsaid. */
  target?: TableName | undefined;
  hops?: number | undefined;
}) {
  const query = useRow(table, id);
  if (!id) return <Absent />;
  const row = query.data as unknown as DataRecord | null | undefined;
  if (row === undefined && query.isError)
    return <Text color="color.text.subtle">Could not load</Text>;
  if (row === undefined)
    return (
      <>
        <Skeleton shape="line" width={96} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  if (row === null) return <Absent label="Not available" />;
  const next = wordsAt(row, by);
  return hops > 1 ? (
    <NameThrough table={table} id={next} by={by} target={target} hops={hops - 1} />
  ) : (
    <RelationName table={target} id={next} />
  );
}

/**
 * A framework item's facts, in the product's words: the items that hold it by name, nearest first
 * and each under what it is to the item (a security outcome's Process and Group, an approach's
 * Technique), the architectural layers an approach can be used at (Table D-5), where the
 * publication prints it, and its framework by title. What kind of item it is names the preview,
 * and its code is the transcription's own unless it leads the title, so neither is a fact.
 */
function frameworkItemFacts(record: DataRecord): RecordSummaryField<DataRecord>[] {
  const parentId = wordsAt(record, "parent_item_id");
  const holders = frameworkItemWords(record["kind"])?.holders ?? [];
  const code = wordsAt(record, "code");
  return [
    // The summary names the item that holds this one, under the label its kind gives the column.
    ...(parentId ? [{ key: "parent_item_id" }] : []),
    // The holders above it are named through it.
    ...(parentId
      ? holders.slice(1).map((label, index) => ({
          key: `holder_${index + 2}`,
          label,
          render: () => (
            <NameThrough
              table="framework_items"
              id={parentId}
              by="parent_item_id"
              hops={index + 1}
            />
          ),
        }))
      : []),
    // An approach's layers are Table D-5's, read by the approach's code in the current reading.
    ...(record["kind"] === "approach" && code
      ? [
          {
            key: "architectural_layers",
            label: "Architectural layers",
            render: () => <ApproachLayers code={code} />,
          },
        ]
      : []),
    { key: "printed_in" },
    {
      key: "framework_revision_id",
      label: "Framework",
      render: (row) => (
        <NameThrough
          table="framework_revisions"
          id={wordsAt(row, "framework_revision_id")}
          by="framework_id"
          target="frameworks"
        />
      ),
    },
  ];
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Printed texts as one Markdown list for Prose, a line a text. A character Markdown reads as
 * markup is written as itself, so a text reads as the publication prints it ("[VPN]").
 */
const proseList = (texts: readonly string[]) =>
  texts.map((text) => `- ${text.replace(/[\\`*_[\]<>]/g, "\\$&")}`).join("\n");

function titleOf(record: DataRecord, fallback: string) {
  for (const key of ["name", "title", "code"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  const version = record["version_number"];
  return typeof version === "number" ? `Version ${version}` : fallback;
}

/**
 * The preview of a record that has no page of its own, opened by its name wherever the name is
 * drawn: an observation in an issue's facts, an organization as an owner, a procedure in a step.
 * A record with a curated body (an observation) shows it; a framework item shows the facts the
 * product has words for (`frameworkItemFacts`), under the name its kind gives it ("Security
 * outcome preview"), then its own text and what the publication prints beside it: the Discussion
 * of a goal, an objective, a technique or an approach, and an approach's Examples as a list; any
 * other shows its stored
 * facts, each related record by name, and its authored text. It is one record, not a place in a
 * collection, so its header holds no previous or next.
 */
export function LinkedRecordPreview({
  identity,
  onClose,
}: {
  identity: RecordIdentity;
  onClose: () => void;
}) {
  const query = useRow(identity.table, identity.id);
  const noun = productRecordNoun(identity.table);
  const label = `${capitalize(noun)} preview`;
  const record = query.data as unknown as DataRecord | null | undefined;
  if (!record)
    return (
      <RecordPreviewPanel
        title={identity.label ?? capitalize(noun)}
        label={label}
        navigation={null}
        onClose={onClose}
      >
        {/* The panel is drawn outside the page's region, so it says its own failure, with Retry. */}
        <QueryState query={query}>
          {record === null && (
            <Text color="color.text.subtle">
              This record is no longer available in this workspace.
            </Text>
          )}
        </QueryState>
        {record === undefined && !query.isError && <Skeleton lines={3} />}
      </RecordPreviewPanel>
    );
  const title = titleOf(record, identity.label ?? capitalize(noun));
  if (identity.table === "observations")
    return (
      <RecordPreviewPanel
        title={title}
        label={label}
        defaultWidth={640}
        navigation={null}
        onClose={onClose}
      >
        <ObservationDetails observation={record} />
      </RecordPreviewPanel>
    );
  const text = [...TEXT].filter(
    (key) => typeof record[key] === "string" && String(record[key]).trim(),
  );
  // A framework item reads in the product's words for its kind: the summary names the preview
  // after it, and these are its title, its facts and the label of its printed text.
  const item =
    identity.table === "framework_items" ? frameworkItemWords(record["kind"]) : undefined;
  const facts = identity.table === "framework_items" ? frameworkItemFacts(record) : factsOf(record);
  // What the publication prints beside the item, after its own text: the Discussion of a goal, an
  // objective, a technique or an approach, and the Examples it lists for an approach.
  const guidance =
    identity.table === "framework_items"
      ? itemGuidance({ prose: wordsAt(record, "prose"), props: frameworkProps(record["props"]) })
      : undefined;
  const examples = guidance?.examples ?? [];
  const said = text.length > 0 || !!guidance?.discussion || examples.length > 0;
  const code = wordsAt(record, "code");
  return (
    <RecordSummaryPreview
      model={identity.table as TableName}
      record={record}
      // An item the publication identifies reads by its identifier and its name together.
      title={item?.coded && code && wordsAt(record, "title") ? `${code} ${title}` : title}
      navigation={null}
      onClose={onClose}
      fields={facts}
    >
      {said && (
        <HeadingLevelProvider level={3}>
          <Stack space="space.200">
            {text.map((key) => (
              <Prose key={key} label={item && key === "prose" ? item.text : labelFor(key)}>
                {String(record[key])}
              </Prose>
            ))}
            {guidance?.discussion && <Prose label="Discussion">{guidance.discussion}</Prose>}
            {examples.length > 0 && <Prose label="Examples" markdown={proseList(examples)} />}
          </Stack>
        </HeadingLevelProvider>
      )}
      {facts.length === 0 && !said && <Absent label="Nothing recorded" />}
    </RecordSummaryPreview>
  );
}
