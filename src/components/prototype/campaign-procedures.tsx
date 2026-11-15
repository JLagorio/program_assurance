import { useMemo, useRef, type ReactNode } from "react";
import { Absent, defineColumns, type EmptyIllustrationKind } from "@ledger/design-system";
import {
  campaignProcedureRead,
  campaignProcedureRevisionRead,
  type CampaignProcedureRevision,
  type CampaignProcedureRow,
} from "@/lib/campaign-procedures";
import { productCollectionNoun, productRecordNoun } from "@/lib/product-records";
import { labelFor } from "@/lib/records";
import type { TableName } from "@/lib/models";
import type { ServerRead } from "@/lib/server-table";
import { revisionStates } from "@/lib/status";
import { useServerCollection } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useOpenRecord } from "./record-preview";
import type { QueryStatus } from "./work-common";

/*
 * A campaign record's Procedures tab: its Procedures and its Procedure revisions, each a page at a
 * time from the server, since a program can hold hundreds of procedures. Each lists
 * the program's, those no program owns and those the campaign's runs follow, in the order the
 * tab listed them, and the server pages, sorts and searches them. A procedure and a revision have
 * no page of their own: the name and the row open the record's preview, which steps across pages.
 */

/** The cell of a text a record may leave empty. */
const text = (value: string | null | undefined) => (value ? value : <Absent />);

const procedureColumns = (open: (row: CampaignProcedureRow) => void) =>
  defineColumns<CampaignProcedureRow>((c) => [
    c.id("title", {
      header: "Procedure",
      minWidth: 180,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="procedures" record={row} onPreview={() => open(row)}>
          {text(row.title)}
        </RecordLink>
      ),
    }),
    c.text("description", { header: "Description", cell: (row) => text(row.description) }),
    c.number("versions", { header: "Versions", width: 112 }),
  ]);

const revisionColumns = (open: (row: CampaignProcedureRevision) => void) =>
  defineColumns<CampaignProcedureRevision>((c) => [
    c.id("title", {
      header: "Revision",
      minWidth: 180,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="procedure_revisions" record={row} onPreview={() => open(row)}>
          {text(row.title)}
        </RecordLink>
      ),
    }),
    c.number("version_number", { header: "Version", width: 100 }),
    // The method in words; the server sorts by the stored value, which orders the words alike.
    c.text("method", {
      header: "Method",
      width: 140,
      cell: (row) => (row.method ? labelFor(row.method) : <Absent />),
    }),
    c.status("state", { header: "State", statuses: revisionStates, width: 130, priority: 1 }),
  ]);

type SectionProps<T> = {
  /** The tree of procedures the tab lists; `undefined` while the runs it names are read. */
  tree: string | undefined;
  campaignId: string;
  /** The record the record's preview shows, whose eye the table marks. */
  selectedId?: string | undefined;
  /** Opens the record's preview. */
  onPreview: (row: T) => void;
  /** The page's rows, in the server's order, which the preview steps through and across pages. */
  onDisplayedRowsChange: (rows: T[]) => void;
  /** The other reads the collection waits on: the runs the tree names, the plans and events. */
  queries: QueryStatus[];
  /** The create action, a small secondary among the tab's collections. */
  action: ReactNode;
  empty: { icon: ReactNode; description: string };
};

/** One section's collection: a page of its records, its preview and its create action. */
function ServerSection<T extends { id: string }>({
  read,
  model,
  label,
  makeColumns,
  tree,
  campaignId,
  selectedId,
  onPreview,
  onDisplayedRowsChange,
  queries,
  action,
  empty,
}: SectionProps<T> & {
  read: ServerRead;
  model: TableName;
  label: string;
  makeColumns: (open: (row: T) => void) => ReturnType<typeof defineColumns<T>>;
}) {
  const openRecord = useOpenRecord();
  // The columns are built once: the name reaches the latest opener.
  const open = useRef(onPreview);
  open.current = onPreview;
  const columns = useMemo(() => makeColumns((row) => open.current(row)), [makeColumns]);
  const noun = { one: productRecordNoun(model), other: productCollectionNoun(model) };
  const collection = useServerCollection<T>(read, {
    columns,
    enabled: tree !== undefined,
    preview: useMemo(
      () => ({ onPreview: (row: T) => open.current(row), activeId: selectedId ?? null }),
      [selectedId],
    ),
    label,
    view: `campaign-${model.replace(/_/g, "-")}`,
    // One campaign's question, so a page asked of one campaign's records is never asked of the next.
    keepQuestion: `campaign-${model.replace(/_/g, "-")}-${campaignId}`,
    resizable: true,
    reorderable: true,
  });
  useDisplayedRecords(collection.table, onDisplayedRowsChange);
  const illustration: EmptyIllustrationKind = "records";
  return (
    <ProductCollection
      {...collection}
      queries={[...collection.queries, ...queries]}
      compact
      noun={noun}
      // A procedure and a revision have no page of their own: the row opens the preview.
      onRowClick={(row) => openRecord(model, row, () => open.current(row))}
      searchLabel={`Find ${label.toLowerCase()}`}
      empty={{ illustration, title: `No ${label.toLowerCase()} yet`, ...empty, action }}
      action={action}
    />
  );
}

/** The campaign's procedures, a page at a time, each with how many revisions it has. */
export function CampaignProcedureList(props: SectionProps<CampaignProcedureRow>) {
  const read = useMemo(() => campaignProcedureRead(props.tree), [props.tree]);
  return (
    <ServerSection
      {...props}
      read={read}
      model="procedures"
      label="Procedures"
      makeColumns={procedureColumns}
    />
  );
}

/** The revisions of the campaign's procedures, a page at a time. */
export function CampaignProcedureRevisionList(props: SectionProps<CampaignProcedureRevision>) {
  const read = useMemo(() => campaignProcedureRevisionRead(props.tree), [props.tree]);
  return (
    <ServerSection
      {...props}
      read={read}
      model="procedure_revisions"
      label="Procedure revisions"
      makeColumns={revisionColumns}
    />
  );
}
