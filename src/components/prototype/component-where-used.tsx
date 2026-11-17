// A component record's Where used tab (the pass-six board component.html; Josef's decisions of
// 2026-11-14, "Down · Pinned, flagged, findings at once", and 2026-11-15, "Inherit · Per
// element"). What holds for this tab alone:
//
// Everything built from the component, in any version of its set, from one read,
// `component_consumers`, as a tree (`consumerLines` in src/lib/component-record): each product
// whose current version pins an element to it, with the systems created from that product under
// it, then each program's system that applied it itself. A line names its consumer (the product,
// or the program, a link to the program's system) and says its System, the Element it sits on,
// the version it Took with how many published versions it is Behind, its Change (a variant's
// element Inherited, Modified or Removed), the Controls inherited of those the version it took is
// judged on, its Open findings (marked Offered where the program offered one that now stands on
// the component) and its Open CVEs. Its saved views are Behind and Modified here. The eye
// previews a line beside the page; a system component's preview leads to the program's record of
// it. The tab fills the work area without the Details.

import {
  Absent,
  Badge,
  DataTable,
  Inline,
  Text,
  defineColumns,
  useLedgerLocale,
  type Preset,
} from "@ledger/design-system";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/app/status";
import { consumerLines, type ConsumerLine } from "@/lib/component-record";
import type { ComponentConsumers } from "@/lib/component-reuse";
import type { TableName } from "@/lib/models";
import { componentOfferStates, elementStandings } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useEndOnHide, useOpenRecord } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";

/** The record a line's name opens: the product, or the program's system. */
const destination = (line: ConsumerLine) =>
  line.kind === "product"
    ? { table: "products" as const, record: { id: line.productId!, name: line.name } }
    : { table: "systems" as const, record: { id: line.systemId!, program_id: line.programId } };

/** The record a line's preview is of: a system component has a page in its program. */
const previewModel = (line: ConsumerLine): TableName =>
  line.systemComponentId ? "system_components" : "product_elements";

function Took({ line }: { line: ConsumerLine }) {
  const { formatNumber } = useLedgerLocale();
  return (
    <Inline space="space.100" alignBlock="baseline">
      <Text numeric>{formatNumber(line.version)}</Text>
      {line.behind > 0 && (
        <Text color="color.text.warning" numeric>
          Behind {formatNumber(line.behind)}
        </Text>
      )}
    </Inline>
  );
}

function Inherited({ line }: { line: ConsumerLine }) {
  const { formatNumber } = useLedgerLocale();
  return line.controlsInherited === null || line.controlsJudged === null ? (
    <Absent />
  ) : (
    <Text numeric>
      {formatNumber(line.controlsInherited)} of {formatNumber(line.controlsJudged)}
    </Text>
  );
}

function Findings({ line }: { line: ConsumerLine }) {
  const { formatNumber } = useLedgerLocale();
  return (
    <Inline space="space.100" alignBlock="center">
      {line.findingsOpen > 0 && (
        <Text color="color.text.danger" numeric>
          {formatNumber(line.findingsOpen)}
        </Text>
      )}
      {line.offered && <StatusBadge statuses={componentOfferStates} value="offered" />}
    </Inline>
  );
}

const columns = defineColumns<ConsumerLine>((c) => [
  c.text("name", {
    header: "Consumer",
    priority: 0,
    minWidth: 200,
    hideable: false,
    cell: (line) => {
      const { table, record } = destination(line);
      return (
        <RecordLink table={table} record={record}>
          {line.name}
        </RecordLink>
      );
    },
    badge: (line) =>
      line.kind === "product" ? (
        <Badge size="xsmall" variant="secondary" tone="neutral">
          Product
        </Badge>
      ) : null,
  }),
  c.text("detail", {
    header: "System",
    minWidth: 180,
    priority: 3,
  }),
  c.text("elementCode", { header: "Element", width: 130, priority: 2 }),
  c.number("version", {
    header: "Took",
    width: 130,
    priority: 1,
    cell: (line) => <Took line={line} />,
  }),
  c.status("change", { header: "Change", width: 130, priority: 4, statuses: elementStandings }),
  c.number("controlsInherited", {
    header: "Controls inherited",
    width: 160,
    priority: 5,
    cell: (line) => <Inherited line={line} />,
  }),
  c.number("findingsOpen", {
    header: "Open findings",
    width: 150,
    priority: 6,
    cell: (line) => <Findings line={line} />,
  }),
  c.number("vulnerabilitiesOpen", {
    header: "Open CVEs",
    width: 110,
    priority: 7,
    format: (value) => (value ? String(value) : ""),
  }),
  // What a saved view asks: a line behind the latest published version.
  c.number("behind", { header: "Behind", width: 100, priority: 8 }),
]);

const presets: Preset[] = [
  { id: "all", label: "Everything using it" },
  // A range with both ends: the table counts a saved view's rows with the filter as it is given.
  {
    id: "behind",
    label: "Behind",
    filters: [{ id: "behind", value: [1, Number.MAX_SAFE_INTEGER] }],
  },
  { id: "modified", label: "Modified here", filters: [{ id: "change", value: ["modified"] }] },
];

export function ComponentWhereUsed({
  componentId,
  consumers,
}: {
  componentId: string;
  consumers: UseQueryResult<ComponentConsumers, Error>;
}) {
  const { formatNumber } = useLedgerLocale();
  const openRecord = useOpenRecord();
  const [preview, setPreview] = useState<ConsumerLine | null>(null);
  useEndOnHide(() => setPreview(null));
  const lines = useMemo(
    () => (consumers.data ? consumerLines(consumers.data) : []),
    [consumers.data],
  );
  const table = useCollectionTable<ConsumerLine>({
    columns,
    data: lines,
    getRowId: (line) => line.id,
    rowLabel: (line) => line.name,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    tree: {
      children: (line) => line.children,
      label: (line) => line.name,
      initialExpanded: true,
    },
    label: "Where the component is used",
    view: "component-where-used",
    resizable: true,
    initialState: { columnVisibility: { behind: false } },
  });
  const displayed = useDisplayedRecords(table);
  return (
    <>
      <ProductCollection
        table={table}
        queries={[consumers]}
        keepQuestion={`component-where-used-${componentId}`}
        noun={{ one: "consumer", other: "consumers" }}
        searchLabel="Find consumers"
        views={<DataTable.Presets table={table} presets={presets} aria-label="Consumers" />}
        filters={<DataTable.Filter table={table} column="change" />}
        onRowClick={(line) => {
          const { table: model, record } = destination(line);
          openRecord(model, record);
        }}
        empty={{
          illustration: "tree",
          title: "Not used yet",
          description: "Products and programs built from it are listed here.",
        }}
      />
      {preview && (
        <RecordSummaryPreview
          model={previewModel(preview)}
          noun={preview.kind === "product" ? "Product element" : "System component"}
          title={preview.name}
          readOnly
          record={displayed.find((line) => line.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            {
              key: "detail",
              label: "System",
              render: (line) => line.detail ?? <Absent label="A product" />,
            },
            {
              key: "elementCode",
              label: "Element",
              render: (line) => line.elementCode ?? <Absent label="Left out" />,
            },
            { key: "version", label: "Took", render: (line) => <Took line={line} /> },
            {
              key: "change",
              label: "Change",
              render: (line) =>
                line.change ? (
                  <StatusBadge statuses={elementStandings} value={line.change} />
                ) : (
                  <Absent label="Applied by the program" />
                ),
            },
            {
              key: "controlsInherited",
              label: "Controls inherited",
              render: (line) => <Inherited line={line} />,
            },
            {
              key: "findingsOpen",
              label: "Open findings",
              render: (line) =>
                line.findingsOpen || line.offered ? (
                  <Findings line={line} />
                ) : (
                  <Absent label="None open" />
                ),
            },
            {
              key: "vulnerabilitiesOpen",
              label: "Open CVEs",
              render: (line) =>
                line.vulnerabilitiesOpen ? (
                  formatNumber(line.vulnerabilitiesOpen)
                ) : (
                  <Absent label="None open" />
                ),
            },
          ]}
        />
      )}
    </>
  );
}
