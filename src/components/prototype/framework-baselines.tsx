// The Frameworks page's Baselines tab: what an edition of the catalog holds by control family and
// what its reference baselines take of it, then which of the workspace's programs start from each.
//
// Controls by family is a `Chart.Heatmap` with its table twin: the edition's controls in force a
// family as its summary row, and under it each reference baseline (the largest first) with the
// controls it selects there. Every cell with a count opens the Controls tab asked for exactly
// those controls (`catalogControlsSearch`): a summary cell the family's controls in force, a
// baseline's cell the family's controls the baseline selects (its Selected by). The edition's
// Select sits in the frame's actions, as on the Controls tab's toolbar. The baselines' nesting is
// not recorded (the Privacy baseline sits in none of the others), so a baseline is a line of its
// own, never a segment of another's bar.
//
// Programs by baseline is a compact collection of the reference baselines, one line a baseline
// with the controls it selects, each opening onto the programs whose control baselines start from
// it (their stack's root, `program_reference_choices` over `profile_resolution_catalogs`), each
// with the controls its control baseline selects. A baseline's name opens its profile, a program's
// the program; a count opens the Controls tab at that baseline's or that program's control
// baseline. Its order is the reading's (the largest baseline first, programs by code), so it has
// no search or sort. A folded baseline says how many programs start from it.
//
// Reads (src/lib/library-guidance.ts): `useReferenceBaselines` (three small requests), then
// `useFamilyCounts` with a series a baseline (one request). The tab is a failure region of its
// own: a block that cannot load says Could not load in its place under the tab's one alert.

import { useCallback, useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Chart,
  Section,
  Stack,
  TextLink,
  defineColumns,
  useLedgerLocale,
  type HeatmapSelection,
} from "@ledger/design-system";
import {
  familyTotal,
  useFamilyCounts,
  useReferenceBaselines,
  type FamilySeries,
  type ReferenceBaseline,
} from "@/lib/library-guidance";
import { catalogControlsSearch } from "./catalog-link";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink } from "./record-preview";
import { QueryState, ReportFailures } from "./work-common";

/** The series key of the edition's controls in force. */
const CATALOG = "catalog";

/** A baseline as a line names it: "High baseline", without the catalog's name in front. */
function baselineName(baseline: ReferenceBaseline, catalog: string | undefined) {
  const rest =
    catalog && baseline.title.startsWith(`${catalog} `)
      ? baseline.title.slice(catalog.length + 1)
      : baseline.title;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** One line of Programs by baseline: a reference baseline, or a program that starts from it. */
type BaselineLine = {
  id: string;
  kind: "baseline" | "program";
  name: string;
  /** The profile or the program the name opens. */
  recordId: string;
  /** The published profile revision the count opens the Controls tab at (its Selected by). */
  revisionId: string;
  controls: number;
  children?: BaselineLine[] | undefined;
};

export function FrameworkBaselines({
  edition,
  editionSelect,
}: {
  edition: string | undefined;
  /** The edition the tab reads, as the Controls tab's toolbar chooses it. */
  editionSelect: ReactNode;
}) {
  const baselines = useReferenceBaselines(edition);
  const series = useMemo<FamilySeries[]>(
    () => [
      { key: CATALOG, kind: "catalog" },
      ...(baselines.data ?? []).map((baseline): FamilySeries => ({
        key: baseline.resolutionId,
        kind: "selected",
        profileResolutionId: baseline.resolutionId,
      })),
    ],
    [baselines.data],
  );
  const families = useFamilyCounts(edition, series, { enabled: baselines.data !== undefined });
  return (
    <QueryState region>
      <ReportFailures queries={[baselines, families]} />
      <Stack space="space.300">
        <ControlsByFamily
          edition={edition}
          editionSelect={editionSelect}
          baselines={baselines}
          families={families}
        />
        <ProgramsByBaseline
          edition={edition}
          baselines={baselines}
          catalog={families.data?.catalog?.title}
        />
      </Stack>
    </QueryState>
  );
}

function ControlsByFamily({
  edition,
  editionSelect,
  baselines,
  families,
}: {
  edition: string | undefined;
  editionSelect: ReactNode;
  baselines: ReturnType<typeof useReferenceBaselines>;
  families: ReturnType<typeof useFamilyCounts>;
}) {
  const { formatPlural } = useLedgerLocale();
  const data = families.data;
  const catalog = data?.catalog?.title ?? "Catalog";
  const rows = useMemo(
    () =>
      new Map(
        (baselines.data ?? []).map((baseline) => [
          baselineName(baseline, data?.catalog?.title),
          baseline,
        ]),
      ),
    [baselines.data, data],
  );
  const byCode = useMemo(
    () => new Map((data?.families ?? []).map((family) => [family.code, family])),
    [data],
  );
  const value = useCallback(
    (row: string, column: string) =>
      byCode
        .get(column)
        ?.counts.get(row === catalog ? CATALOG : (rows.get(row)?.resolutionId ?? "")) ?? null,
    [byCode, catalog, rows],
  );
  const most = Math.max(
    1,
    ...(data?.families ?? []).flatMap((family) =>
      (baselines.data ?? []).map((baseline) => family.counts.get(baseline.resolutionId) ?? 0),
    ),
  );
  const link = ({ row, column }: HeatmapSelection) =>
    edition ? (
      <Link
        to="/catalog"
        search={catalogControlsSearch({
          edition,
          family: column,
          selectedBy: row === catalog ? undefined : rows.get(row)?.revisionId,
        })}
      />
    ) : undefined;
  const failed = (baselines.isError && !baselines.data) || (families.isError && !data);
  const inForce = familyTotal(data, CATALOG);
  return (
    <Chart
      title="Controls by family"
      titleLevel={2}
      description={
        data?.catalog && inForce !== undefined
          ? `${formatPlural(inForce, { one: "{count} control", other: "{count} controls" })} of ${data.catalog.title} in force`
          : undefined
      }
      actions={editionSelect}
      state={failed ? "empty" : data ? "ready" : "loading"}
      statusTitle={failed ? "Could not load" : undefined}
      statusText={failed ? "The families appear here once they load." : undefined}
    >
      <Stack space="space.150">
        <Chart.Heatmap
          rows={[catalog, ...rows.keys()]}
          columns={(data?.families ?? []).map((family) => family.code)}
          value={value}
          scale="sequential"
          domain={[0, most]}
          zeroStep
          showValues
          size="small"
          rowLabel="Baseline"
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

function ProgramsByBaseline({
  edition,
  baselines,
  catalog,
}: {
  edition: string | undefined;
  baselines: ReturnType<typeof useReferenceBaselines>;
  catalog: string | undefined;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const lines = useMemo(
    () =>
      (baselines.data ?? []).map((baseline): BaselineLine => ({
        id: baseline.resolutionId,
        kind: "baseline",
        name: baselineName(baseline, catalog),
        recordId: baseline.profileId,
        revisionId: baseline.revisionId,
        controls: baseline.controls,
        children: baseline.programs.map((program) => ({
          id: `${baseline.resolutionId}:${program.id}`,
          kind: "program",
          name: program.name,
          recordId: program.id,
          revisionId: program.revisionId,
          controls: program.controls,
        })),
      })),
    [baselines.data, catalog],
  );
  const programs = (baselines.data ?? []).reduce(
    (sum, baseline) => sum + baseline.programs.length,
    0,
  );
  const columns = useMemo(
    () =>
      defineColumns<BaselineLine>((c) => [
        c.text("name", {
          header: "Baseline",
          priority: 0,
          minWidth: 220,
          sortable: false,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table={row.kind === "baseline" ? "profiles" : "programs"}
              record={{ id: row.recordId }}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        c.number("controls", {
          header: "Controls",
          width: 120,
          sortable: false,
          cell: (row) =>
            edition && row.controls ? (
              <TextLink
                render={
                  <Link
                    to="/catalog"
                    search={catalogControlsSearch({ edition, selectedBy: row.revisionId })}
                  />
                }
              >
                {formatNumber(row.controls)}
              </TextLink>
            ) : (
              formatNumber(row.controls)
            ),
        }),
      ]),
    [edition, formatNumber],
  );
  const table = useCollectionTable<BaselineLine>({
    columns,
    data: lines,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    label: "Programs by baseline",
    pageSize: undefined,
    pinnable: false,
    hideable: false,
    tree: {
      children: (row) => row.children,
      label: (row) => row.name,
      hint: (_row, count) =>
        count ? formatPlural(count, { one: "{count} program", other: "{count} programs" }) : null,
    },
  });
  return (
    <Section title="Programs by baseline" count={baselines.data ? programs : null} countMax={9999}>
      <ProductCollection
        table={table}
        queries={[baselines]}
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        noun={{ one: "baseline", other: "baselines" }}
        empty={{
          title: "No reference baselines",
          description: "Loaded with the catalog by an administrator.",
        }}
      />
    </Section>
  );
}
