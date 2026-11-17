// The Library's Guidance: the supplemental guidance beside the control catalog, the reference
// frameworks NIST SP 800-160 prints (its cyber resiliency constructs, the ATT&CK techniques of
// Appendices F and G, and the system life cycle processes of Vol. 1).
//
// It opens with a band of four numbers, none linked, since no register lists what they count: the
// publications, the frameworks' items, their links to controls, and the controls they tie of the
// catalog edition their control labels name ("277", of 1,014 controls in force).
//
// Then the frameworks, one line a framework, under a band a publication ("NIST SP 800-160 Vol. 2
// Rev. 1", the table's `groupBy`), in the order the publications print them: the framework by
// its short name (ATT&CK by its matrix), what it holds by kind in the order its levels read ("4
// goals › 8 objectives › 14 techniques › 50 approaches", `frameworkHoldings`), the controls it
// ties, and what Named by counts: the workspace's records that name one of its items and the
// programs that hold them, a risk naming an ATT&CK technique and a gate criterion drawn from a
// security outcome ("44 risks in 4 programs"). A program's SA-24 choice names the cyber resiliency
// constructs by their titles, resolved one program at a time, so their Named by is Not counted. A
// framework has no page of its own, so its name opens its preview: the publication, its version,
// who it comes from, whether this copy is the publisher's own or a transcription, the document it
// was read from and what the workspace may do with it.
//
// Under them, Controls tied, by family: a `Chart.Heatmap` with its table twin, the catalog's
// controls in force by family as its summary row and each framework's tied controls under it. A
// summary cell opens the Frameworks page's Controls at that family; a framework's cell opens
// nothing, since no register lists a framework's controls.
//
// Every number is counted on the server, in one request each (src/lib/library-guidance.ts):
// `framework_rows` once (`useFrameworks`), the frameworks' items and links
// (`useFrameworkCounts`), the families (`useFamilyCounts`) and the programs' records
// (`useFrameworkUse`). The page is one failure region: a count that cannot load says Could not load
// in its place under the page's one alert.

import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Absent,
  Chart,
  DateTime,
  KeyValue,
  PageHeader,
  Prose,
  Skeleton,
  Stack,
  Stat,
  Text,
  TextLink,
  VisuallyHidden,
  defineColumns,
  useLedgerLocale,
  type HeatmapSelection,
} from "@ledger/design-system";
import { useFrameworks, type Framework } from "@/lib/frameworks";
import {
  familyTotal,
  frameworkUseWords,
  guidanceName,
  holdingsText as holdsText,
  publicationName,
  useFamilyCounts,
  useFrameworkCounts,
  useFrameworkUse,
  type FamilySeries,
} from "@/lib/library-guidance";
import { Page } from "@/components/app/shell";
import { catalogControlsSearch } from "@/components/prototype/catalog-link";
import { useCollectionTable } from "@/components/prototype/collection-question";
import { ProductCollection } from "@/components/prototype/product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
} from "@/components/prototype/record-preview";
import { QueryState, ReportFailures } from "@/components/prototype/work-common";

export const Route = createFileRoute("/guidance")({
  head: () => ({ meta: [{ title: "Guidance — Program Assurance" }] }),
  component: GuidancePage,
});

/**
 * The frameworks as the publications print them: by the day each was published, a volume's
 * constructs before its appendices (Vol. 2's cyber resiliency constructs, then Appendices F and G,
 * then Vol. 1's processes).
 */
const inPrintedOrder = (frameworks: readonly Framework[]) =>
  [...frameworks].sort(
    (a, b) =>
      (a.source_document.published ?? "").localeCompare(b.source_document.published ?? "") ||
      Number(b.code.endsWith("-cref")) - Number(a.code.endsWith("-cref")) ||
      a.code.localeCompare(b.code),
  );

/** What a framework's copy is: the publisher's own, or a transcription of it. */
const kinds = { true: "Authoritative", false: "Mirror or derived" } as const;

/** The series key of the edition's controls in force, and of every framework's tied controls. */
const CATALOG = "catalog";
const TIED = "tied";

/** A count that has not come: its read is on its way, or failed. */
type Waiting = "loading" | "failed" | null;
const waiting = (query: { isError: boolean; data?: unknown }): Waiting =>
  query.isError && query.data === undefined
    ? "failed"
    : query.data === undefined
      ? "loading"
      : null;

/** One framework as its line reads it, with what each count still waits on. */
type GuidanceRow = {
  id: string;
  name: string;
  /** The band it stands under. */
  publication: string;
  holds: string | null;
  holdsWaiting: Waiting;
  controls: number | null;
  controlsWaiting: Waiting;
  /** Named by: the records that name its items, and their programs. */
  use: string | null;
  useWaiting: Waiting;
};

/** A cell whose count is on its way, failed, or has nothing to count. */
function Pending({ waiting, label }: { waiting: Waiting; label: string }) {
  if (waiting === "loading")
    return (
      <>
        <Skeleton shape="line" width={64} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  if (waiting === "failed") return <Text color="color.text.subtle">Could not load</Text>;
  return <Absent label={label} />;
}

function GuidancePage() {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const frameworks = useFrameworks();
  const ordered = useMemo(() => inPrintedOrder(frameworks.data ?? []), [frameworks.data]);
  const counts = useFrameworkCounts(frameworks.data);
  const use = useFrameworkUse(frameworks.data);
  // The catalog edition the frameworks' control labels name, and the frameworks that tie its controls.
  const edition = ordered.find((framework) => framework.catalog_revision_id)?.catalog_revision_id;
  const tying = useMemo(
    () => ordered.filter((framework) => edition && framework.catalog_revision_id === edition),
    [ordered, edition],
  );
  const series = useMemo<FamilySeries[]>(
    () => [
      { key: CATALOG, kind: "catalog" },
      {
        key: TIED,
        kind: "tied",
        frameworkRevisionIds: tying.map((framework) => framework.framework_revision_id),
      },
      ...tying.map((framework): FamilySeries => ({
        key: framework.code,
        kind: "tied",
        frameworkRevisionIds: [framework.framework_revision_id],
      })),
    ],
    [tying],
  );
  const families = useFamilyCounts(edition, series, { enabled: tying.length > 0 });
  const holdsWaiting = waiting(counts);
  const useWaiting = waiting(use);
  const familiesWaiting = waiting(families);
  const rows = useMemo<GuidanceRow[]>(
    () =>
      ordered.map((framework) => {
        const counted = counts.data?.get(framework.code);
        const used = use.data?.get(framework.code);
        const words = frameworkUseWords[framework.code];
        const ties = !!framework.catalog_revision_id && framework.catalog_revision_id === edition;
        const programs = used
          ? formatPlural(used.programs, { one: "{count} program", other: "{count} programs" })
          : "";
        return {
          id: framework.id,
          name: guidanceName(framework),
          publication: publicationName(framework.source_document) ?? framework.title,
          holds: counted
            ? (holdsText(framework.code, counted, formatNumber) ??
              formatPlural(counted.items, { one: "{count} item", other: "{count} items" }))
            : null,
          holdsWaiting,
          controls: ties ? (familyTotal(families.data, framework.code) ?? null) : null,
          controlsWaiting: ties ? familiesWaiting : null,
          use:
            used && words
              ? used.records
                ? `${formatPlural(used.records, { one: `{count} ${words.one}`, other: `{count} ${words.other}` })} in ${programs}`
                : `No ${words.other}`
              : null,
          useWaiting: words ? useWaiting : null,
        };
      }),
    [
      ordered,
      counts.data,
      use.data,
      families.data,
      edition,
      holdsWaiting,
      useWaiting,
      familiesWaiting,
      formatNumber,
      formatPlural,
    ],
  );
  const [preview, setPreview] = useState<GuidanceRow | null>(null);
  const [displayed, setDisplayed] = useState<GuidanceRow[]>([]);
  const shown = preview
    ? ((frameworks.data ?? []).find((row) => row.id === preview.id) ?? null)
    : null;
  const columns = useMemo(
    () =>
      defineColumns<GuidanceRow>((c) => [
        c.text("name", {
          header: "Guidance",
          priority: 0,
          minWidth: 220,
          hideable: false,
          cell: (row) => (
            <RecordLink table="frameworks" record={row} onPreview={() => setPreview(row)}>
              {row.name}
            </RecordLink>
          ),
        }),
        // The band each line stands under: grouping takes it out of the line.
        c.text("publication", { header: "Publication" }),
        c.text("holds", {
          header: "Holds",
          width: 400,
          priority: 2,
          cell: (row) => row.holds ?? <Pending waiting={row.holdsWaiting} label="Not counted" />,
        }),
        c.number("controls", {
          header: "Controls",
          width: 120,
          priority: 1,
          cell: (row) =>
            row.controls === null ? (
              <Pending waiting={row.controlsWaiting} label="Ties no controls" />
            ) : (
              formatNumber(row.controls)
            ),
        }),
        // What it counts is the column's word: the records that name the framework's items.
        c.text("use", {
          header: "Named by",
          width: 240,
          priority: 3,
          cell: (row) => row.use ?? <Pending waiting={row.useWaiting} label="Not counted" />,
        }),
      ]),
    [formatNumber],
  );
  const table = useCollectionTable<GuidanceRow>({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Guidance",
    view: "library-guidance",
    groupBy: "publication",
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
  });
  useDisplayedRecords(table, setDisplayed);

  const publications = new Set(rows.map((row) => row.publication)).size;
  const sum = (pick: (value: { items: number; controlLinks: number }) => number) =>
    counts.data ? [...counts.data.values()].reduce((total, value) => total + pick(value), 0) : null;
  const tied = familyTotal(families.data, TIED) ?? null;
  const inForce = familyTotal(families.data, CATALOG);
  const tile = (query: { isError: boolean; data?: unknown }, value: number | null) => ({
    value: query.isError ? <Absent label="Not available" /> : value,
    isLoading: !query.isError && query.data === undefined,
    note: query.isError ? "Could not load" : undefined,
  });

  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Guidance</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <QueryState region>
        <ReportFailures queries={[counts, families, use]} />
        <Stack space="space.300">
          <Stat.Grid cols={4} frame="band" role="group" aria-label="Guidance totals">
            <Stat.Tile
              label="Publications"
              {...tile(frameworks, frameworks.data ? publications : null)}
            />
            <Stat.Tile
              label="Items"
              {...tile(
                counts,
                sum((value) => value.items),
              )}
            />
            <Stat.Tile
              label="Control links"
              {...tile(
                counts,
                sum((value) => value.controlLinks),
              )}
            />
            <Stat.Tile
              label="Controls tied"
              {...tile(families, tied)}
              {...(inForce !== undefined && !families.isError
                ? {
                    note: formatPlural(inForce, {
                      one: "of {count} control",
                      other: "of {count} controls",
                    }),
                  }
                : {})}
            />
          </Stat.Grid>
          <ProductCollection
            table={table}
            queries={[frameworks]}
            noun={{ one: "framework", other: "frameworks" }}
            searchLabel="Find guidance"
            // The publications' order is the frameworks'.
            sort={false}
            empty={{
              illustration: "document",
              title: "No guidance loaded",
              description: "Its reference data is not loaded in this workspace.",
            }}
          />
          {tying.length > 0 && edition && (
            <TiedByFamily edition={edition} frameworks={tying} families={families} />
          )}
        </Stack>
      </QueryState>
      {preview && shown && (
        <RecordPreviewPanel
          title={shown.title}
          label="Guidance preview"
          defaultWidth={560}
          onClose={() => setPreview(null)}
          navigation={
            <RecordPreviewActions
              table="frameworks"
              record={preview}
              rows={displayed}
              onSelect={setPreview}
            />
          }
        >
          <Stack space="space.200">
            <KeyValue.Group>
              {shown.source_document.title && (
                <KeyValue label="Publication" wrap>
                  {shown.source_document.title}
                </KeyValue>
              )}
              {shown.source_document.published && (
                <KeyValue label="Published">
                  <DateTime value={shown.source_document.published} format="date" />
                </KeyValue>
              )}
              <KeyValue label="Version">{shown.version}</KeyValue>
              <KeyValue label="Authority" wrap>
                {shown.authority}
              </KeyValue>
              <KeyValue label="Kind">{kinds[shown.authoritative ? "true" : "false"]}</KeyValue>
              {shown.source_document.url && (
                <KeyValue label="Document" wrap>
                  <TextLink href={shown.source_document.url} newTab>
                    {shown.source_document.url.split("/").at(-1) ?? shown.source_document.url}
                  </TextLink>
                </KeyValue>
              )}
            </KeyValue.Group>
            {shown.rights && <Prose label="Rights">{shown.rights}</Prose>}
            {shown.notes && <Prose label="Notes">{shown.notes}</Prose>}
          </Stack>
        </RecordPreviewPanel>
      )}
    </Page>
  );
}

/**
 * Controls tied, by family: the edition's controls in force a family (the summary row, whose cells
 * open the Frameworks page's Controls at that family) over each framework's tied controls there.
 * It loads as the grid's skeleton; a failed load says Could not load in its place under the page's
 * alert.
 */
function TiedByFamily({
  edition,
  frameworks,
  families,
}: {
  edition: string;
  frameworks: readonly Framework[];
  families: ReturnType<typeof useFamilyCounts>;
}) {
  const { formatPlural } = useLedgerLocale();
  const data = families.data;
  const catalog = data?.catalog?.title ?? "Catalog";
  const names = useMemo(
    () => new Map(frameworks.map((framework) => [guidanceName(framework), framework.code])),
    [frameworks],
  );
  const byCode = useMemo(
    () => new Map((data?.families ?? []).map((family) => [family.code, family])),
    [data],
  );
  const value = useCallback(
    (row: string, column: string) => {
      const family = byCode.get(column);
      if (!family) return null;
      return family.counts.get(row === catalog ? CATALOG : (names.get(row) ?? "")) ?? null;
    },
    [byCode, catalog, names],
  );
  const most = Math.max(
    1,
    ...(data?.families ?? []).flatMap((family) =>
      frameworks.map((framework) => family.counts.get(framework.code) ?? 0),
    ),
  );
  const link = ({ row, column }: HeatmapSelection) =>
    row === catalog ? (
      <Link to="/catalog" search={catalogControlsSearch({ edition, family: column })} />
    ) : undefined;
  const failed = families.isError && !data;
  return (
    <Chart
      title="Controls tied, by family"
      titleLevel={2}
      description={data?.catalog ? `Controls of ${data.catalog.title} in force` : undefined}
      state={failed ? "empty" : data ? "ready" : "loading"}
      statusTitle={failed ? "Could not load" : undefined}
      statusText={failed ? "The families appear here once they load." : undefined}
    >
      <Stack space="space.150">
        <Chart.Heatmap
          rows={[catalog, ...frameworks.map((framework) => guidanceName(framework))]}
          columns={(data?.families ?? []).map((family) => family.code)}
          value={value}
          scale="sequential"
          domain={[0, most]}
          zeroStep
          showValues
          size="small"
          rowLabel="Guidance"
          columnLabel="Control family"
          summary={(row) => row === catalog}
          rowLevel={(row) => (row === catalog ? 0 : 1)}
          link={link}
        />
        <Chart.Scale
          scale="sequential"
          zeroStep
          min="0"
          max={formatPlural(most, { one: "{count} control", other: "{count} controls" })}
        />
      </Stack>
    </Chart>
  );
}
