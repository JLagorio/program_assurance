// The Components register (the pass-six board lib-components.html; Josef's decision of
// 2026-11-15, "Components register · One row a component; the set it belongs to is a column").
// What holds for this screen alone:
//
// One row a library component, at its set's latest published version (else its latest), read a
// page at a time from `component_rows` (`componentRegisterRead` in src/lib/component-reuse): the
// Component, a link to its record (`/library/components/<id>`); its Component set; its Type; the
// Version it is at, marked Draft where nothing is published; its Owner (its own, else its set's)
// and Business line; how many Products and Programs use it and how many of them are Behind or
// Modified here; Controls satisfied out of every control claimed, beside one bar of its standings
// and how many are to review (Josef's "Counting"); the Offers waiting on its owner and its Open
// CVEs. A count of none is left blank. The h1 counts the components, and the facts line leads to
// the component sets, which have their own register at `/library/component-sets`. Its saved views
// count the whole register: Assessed, Offers to review, Behind and Open CVEs. The header ends
// with the offer slot (component-offer-slot). A component is created in a draft version of its
// set, on the set's Structure tab, so the register has no create action.

import { Link } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Count,
  DataTable,
  Fact,
  Grid,
  Inline,
  PageHeader,
  Person,
  Text,
  TextLink,
  defineColumns,
  useLedgerLocale,
  type FilterOption,
  type Preset,
} from "@ledger/design-system";
import { useMemo, useState } from "react";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import {
  NO_BUSINESS_LINE,
  atLeastOne,
  componentRegisterRead,
  type ComponentRegisterRow,
} from "@/lib/component-reuse";
import { useRows } from "@/lib/models";
import { NO_OWNER } from "@/lib/owner-assign";
import { labelFor } from "@/lib/records";
import { registerViews } from "@/lib/register-views";
import { revisionStates } from "@/lib/status";
import { useOwnerOptions } from "./assign-owner";
import { useServerCollection, useServerPresetCounts } from "./collection-question";
import { ComponentOfferSlot } from "./component-offer-slot";
import { StandingTally } from "./component-standing";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useEndOnHide, useOpenRecord } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";

type ComponentRow = ComponentRegisterRow;

/** A count the register draws: blank at none, so the rows that hold something stand out. */
const count = (value: number) => (value > 0 ? String(value) : "");

/** A component's standing as one line of counts, the shape `StandingTally` reads. */
const standing = (row: ComponentRow) => {
  const notAssessed = row.controls_claimed - row.controls_determined;
  return {
    total: row.controls_claimed,
    counts: {
      satisfied: row.controls_satisfied,
      partially_satisfied: row.controls_partially_satisfied,
      other_than_satisfied: row.controls_other_than_satisfied,
      to_review: row.controls_to_review,
      not_assessed: Math.max(0, notAssessed - row.controls_to_review),
    },
  };
};

/** Controls satisfied out of every control claimed, beside one bar of its standings. */
function Satisfied({ row }: { row: ComponentRow }) {
  const { formatNumber } = useLedgerLocale();
  if (row.controls_claimed === 0) return <Absent label="No controls claimed" />;
  if (row.controls_determined === 0) return <Absent label="Not assessed" />;
  return (
    <Grid templateColumns="64px auto auto" gap="space.100" alignItems="center">
      <StandingTally
        line={standing(row)}
        size="large"
        label={`Controls of ${row.name}, by standing`}
      />
      <Text numeric>
        {formatNumber(row.controls_satisfied)} of {formatNumber(row.controls_claimed)}
      </Text>
      {row.controls_to_review > 0 ? (
        <Text color="color.text.warning" numeric>
          {formatNumber(row.controls_to_review)} to review
        </Text>
      ) : (
        <span />
      )}
    </Grid>
  );
}

/** A count that opens the record's tab where it is worked: offers on Findings, CVEs on SBOM. */
const tabCount = (tab: "Findings" | "SBOM", column: "offers_open" | "vulnerabilities_open") =>
  function TabCount(row: ComponentRow) {
    return row[column] > 0 ? (
      <TextLink
        render={
          <Link
            to="/library/components/$componentId"
            params={{ componentId: row.id }}
            search={{ tab }}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        {row[column]}
      </TextLink>
    ) : null;
  };

const columns = defineColumns<ComponentRow>((c) => [
  c.text("name", {
    header: "Component",
    priority: 0,
    minWidth: 200,
    hideable: false,
    cell: (row) => (
      <RecordLink table="defined_components" record={row}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.text("definition_name", { header: "Component set", width: 190, priority: 3 }),
  c.text("component_type", {
    header: "Type",
    width: 100,
    priority: 9,
    cell: (row) => labelFor(row.component_type),
  }),
  // What the State filter asks: the Version cell marks a draft.
  c.status("state", { header: "State", width: 120, statuses: revisionStates }),
  c.text("version", {
    header: "Version",
    width: 110,
    priority: 2,
    cell: (row) => (
      <Inline space="space.100" alignBlock="center">
        <Text numeric>{row.version}</Text>
        {row.state === "draft" && (
          <Badge size="xsmall" variant="secondary" tone="neutral">
            Draft
          </Badge>
        )}
      </Inline>
    ),
  }),
  c.person("owner_party_id", {
    header: "Owner",
    width: 150,
    priority: 5,
    cell: (row) =>
      row.owner_name ? <Person name={row.owner_name} /> : <Absent label={NO_OWNER} />,
  }),
  c.text("business_line_id", {
    header: "Business line",
    width: 140,
    priority: 10,
    cell: (row) => row.business_line_name ?? <Absent label={NO_BUSINESS_LINE} />,
  }),
  c.number("products", { header: "Products", width: 110, priority: 11, format: count }),
  c.number("programs", { header: "Programs", width: 110, priority: 4, format: count }),
  c.number("consumers_behind", {
    header: "Behind",
    width: 100,
    priority: 6,
    cell: (row) =>
      row.consumers_behind > 0 ? (
        <Text color="color.text.warning" numeric>
          {row.consumers_behind}
        </Text>
      ) : null,
  }),
  c.number("consumers_modified", {
    header: "Modified here",
    width: 140,
    priority: 12,
    format: count,
  }),
  c.number("controls_satisfied", {
    header: "Controls satisfied",
    width: 210,
    priority: 1,
    cell: (row) => <Satisfied row={row} />,
  }),
  c.number("offers_open", {
    header: "Offers",
    width: 100,
    priority: 7,
    cell: tabCount("Findings", "offers_open"),
  }),
  c.number("vulnerabilities_open", {
    header: "Open CVEs",
    width: 120,
    priority: 8,
    cell: tabCount("SBOM", "vulnerabilities_open"),
  }),
]);

/** The saved views, each counted over the whole register. */
const presets: Preset[] = [
  { id: "all", label: "All components" },
  { id: "assessed", label: "Assessed", filters: atLeastOne("controls_determined") },
  { id: "offers", label: "Offers to review", filters: atLeastOne("offers_open") },
  { id: "behind", label: "Behind", filters: atLeastOne("consumers_behind") },
  { id: "cves", label: "Open CVEs", filters: atLeastOne("vulnerabilities_open") },
];

const noun = { one: "component", other: "components" };

/** What a component can be, as `defined_components.component_type` allows. */
const COMPONENT_TYPES = [
  "hardware",
  "software",
  "service",
  "policy",
  "process",
  "validation",
  "interconnection",
] as const;

export function ComponentsRegister() {
  const { formatNumber } = useLedgerLocale();
  const openRecord = useOpenRecord();
  const [preview, setPreview] = useState<ComponentRow | null>(null);
  useEndOnHide(() => setPreview(null));
  const collection = useServerCollection<ComponentRow>(componentRegisterRead, {
    columns,
    getRowId: (row) => row.id,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    label: "Components",
    view: registerViews.components,
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { state: false } },
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  const counts = useServerPresetCounts(componentRegisterRead, presets);
  const ownerOptions = useOwnerOptions(componentRegisterRead);
  // The sets and the business lines by name, for the facts line and the filters: the server's
  // rows are one page, so their values are not every value there is.
  const sets = useRows("component_definitions", {}, { columns: ["id", "name"] });
  const lines = useRows("business_lines", {}, { columns: ["id", "name"] });
  const setOptions = useMemo(() => names(sets.data), [sets.data]);
  const lineOptions = useMemo(
    () => [...names(lines.data), { value: NO_BUSINESS_LINE }],
    [lines.data],
  );
  const typeOptions = useMemo<FilterOption[]>(
    () => COMPONENT_TYPES.map((value) => ({ value, label: labelFor(value) })),
    [],
  );
  const total = counts["all"];
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          {/* Named by its h1, beside how many components it holds. */}
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <PageHeader.Title>Components</PageHeader.Title>
            {total !== undefined && <Count value={total} max={9999} />}
          </Inline>
          {sets.data && sets.data.length > 0 && (
            <PageHeader.Facts>
              <Fact label="Component sets">
                <TextLink render={<Link to="/library/component-sets" />}>
                  {formatNumber(sets.data.length)}
                </TextLink>
              </Fact>
            </PageHeader.Facts>
          )}
        </PageHeader.Heading>
        <ComponentOfferSlot named />
      </PageHeader>
      <ProductCollection
        {...collection}
        queries={[...collection.queries, sets, lines]}
        fill
        noun={noun}
        onRowClick={(row) => openRecord("defined_components", row)}
        empty={{
          illustration: "tree",
          title: "No components yet",
          description: "Components of the library's sets are listed here.",
        }}
        searchLabel="Find components"
        views={<DataTable.Presets table={table} variant="menu" presets={presets} counts={counts} />}
        filters={
          <>
            <DataTable.Filter table={table} column="component_type" options={typeOptions} />
            <DataTable.Filter table={table} column="definition_name" options={setOptions} />
            <DataTable.Filter
              table={table}
              column="state"
              options={Object.keys(revisionStates).map((value) => ({ value }))}
            />
            <DataTable.Filter table={table} column="business_line_id" options={lineOptions} />
            <DataTable.Filter table={table} column="owner_party_id" options={ownerOptions} />
          </>
        }
      />
      {preview && (
        <RecordSummaryPreview
          model="defined_components"
          noun="Component"
          title={preview.name}
          readOnly
          record={displayed.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            {
              key: "definition_name",
              label: "Component set",
              render: (row) => row.definition_name,
            },
            { key: "component_type", label: "Type", render: (row) => labelFor(row.component_type) },
            {
              key: "version",
              label: "Version",
              render: (row) => (
                <Inline space="space.100" alignBlock="center">
                  <Text numeric>{row.version}</Text>
                  <StatusBadge statuses={revisionStates} value={row.state} />
                </Inline>
              ),
            },
            {
              key: "owner_party_id",
              label: "Owner",
              render: (row) =>
                row.owner_name ? <Person name={row.owner_name} /> : <Absent label={NO_OWNER} />,
            },
            {
              key: "business_line_id",
              label: "Business line",
              render: (row) => row.business_line_name ?? <Absent label={NO_BUSINESS_LINE} />,
            },
            {
              key: "controls_satisfied",
              label: "Controls satisfied",
              render: (row) => <Satisfied row={row} />,
            },
            {
              key: "programs",
              label: "Programs",
              render: (row) =>
                row.programs ? formatNumber(row.programs) : <Absent label="None" />,
            },
          ]}
        />
      )}
    </Page>
  );
}

/** Every distinct name, in the reader's alphabetical order, as filter values. */
function names(rows: readonly { name: string }[] | undefined): FilterOption[] {
  return [...new Set((rows ?? []).map((row) => row.name))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value }));
}
