// The Portfolio, after board portfolio.html of the UX proposal (wave 9, 2026-11-17): the
// organization's hierarchy, business line › product › configuration › program, as one register.
//
// One `PageHeader` with the name and a facts line (`PageHeader.Facts`): how many business lines,
// how many programs take a product of all the workspace's programs, how many library components
// are assessed once (a link to the Components register asked for them) and, while any wait, the
// offers to review (a link to the Review queue asked for them). Each count is read on the server
// (a HEAD request) or from the hierarchy's own rows, never every record behind it; a count that is
// loading holds its place, and one that cannot be read says Could not load under one alert.
//
// Then the "Needs a look" strip, the table's saved questions drawn as a strip (`DataTable.Presets
// variant="strip"`), each with its count: the variants behind their product's latest published
// version, and those whose program changed an element it inherited. Then the register: a frameless
// tree `DataTable` through ProductCollection, its rows from `portfolioHierarchy` in
// src/lib/portfolio, every row's name a link to its record (a configuration, which has no page,
// is its name alone). Its columns: Version (a product's latest published version; the version a
// variant took, with Behind and how far, a link to the program's Product delta where Take version
// is), Controls satisfied (a product's core and a configuration's scope from `product_control_status`
// of the latest published version, a program's from `program_control_status_counts`, one request
// for every program the tree names, each a number of its whole beside a Tally), Used by (the
// programs under a business line or a product, each once), Modified here (the elements the
// programs changed) and Open issues (the open operational issues of the programs under the row, by
// severity, read once from `operational_issue_rows` with those columns alone, each program once).
// A zero draws nothing. A program that takes two products stands under both.
//
// The old dashboard's widgets are gone: no board of the proposal keeps the risk matrix, Highest
// open risks, Recently updated programs or the activity feed (Home is the reader's desk, the risk
// register carries each risk's likelihood and impact, the Programs register lists the programs).

import { questionSearch } from "@/components/prototype/collection-question";
import { ControlStatusTally } from "@/components/prototype/control-status";
import { QueryValue } from "@/components/prototype/library-shared";
import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { ProductCollection } from "@/components/prototype/product-collection";
import { ProductRecordDialog } from "@/components/prototype/product-record-dialog";
import { ProductStatusTally } from "@/components/prototype/product-standing";
import { RecordLink, useOpenRecord } from "@/components/prototype/record-preview";
import { ReportFailures } from "@/components/prototype/work-common";
import { Page } from "@/components/app/shell";
import { useWorkspace } from "@/components/app/workspace";
import {
  Button,
  DataTable,
  Fact,
  Indicator,
  Inline,
  PageHeader,
  Text,
  TextLink,
  VisuallyHidden,
  defineColumns,
  useDataTable,
  useLedgerLocale,
  type TableQuery,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { atLeastOne, componentRegisterRead } from "@/lib/component-reuse";
import { useProgramsControlStatusCounts, type ControlStatusTotals } from "@/lib/control-status";
import { useRows } from "@/lib/models";
import {
  issuesByProgram,
  portfolioHierarchy,
  programsOnAProduct,
  rowIssues,
  type PortfolioAttention,
  type PortfolioRow,
  type SeverityCounts,
} from "@/lib/portfolio";
import {
  ELEMENT_CHANGE_KINDS,
  useProductsControlStatus,
  type ProductControlStatusAnswer,
} from "@/lib/product-assurance";
import { registerViews } from "@/lib/register-views";
import { serverRead, useServerCountQueries, useServerResultRows } from "@/lib/server-table";
import { operationalIssueStatuses, severityLevels, statusEntry } from "@/lib/status";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Portfolio — Program Assurance" }] }),
  component: Portfolio,
});

/** What each attention reads as: the strip's preset and the hidden column it filters. */
const ATTENTION: Record<PortfolioAttention, string> = {
  behind: "Consumers behind",
  modified: "Modified here",
};
const presets = [
  { id: "all", label: "All products" },
  ...(Object.keys(ATTENTION) as PortfolioAttention[]).map((key) => ({
    id: key,
    label: ATTENTION[key],
    filters: [{ id: "attention", value: [ATTENTION[key]] }],
  })),
];

const openIssue = (status: string) => !["closed", "resolved", "cancelled"].includes(status);
const openIssueStatuses = Object.keys(operationalIssueStatuses).filter(openIssue);
/** The severities a cell counts, the worst first. */
const SEVERITIES = ["critical", "high", "moderate", "low"] as const;

/** The workspace's programs, counted on the server: "3 of 13". */
const programCount = serverRead({ source: "programs", columns: ["id"] });
/** The offers that wait on a component's owner, counted on the Review queue's view. */
const offerCount = serverRead({ source: "review_queue_rows", columns: ["id", "kind"] });
const offersQuestion: TableQuery = { filters: [{ id: "kind", value: ["component_offer"] }] };
const assessedQuestion: TableQuery = { filters: atLeastOne("controls_determined") };
/**
 * The open issues of the programs the hierarchy names, their program and severity alone: what the
 * Open issues column counts, never every issue of the workspace.
 */
const openIssuesRead = serverRead({
  source: "operational_issue_rows",
  model: "operational_issues",
  columns: ["id", "program_id", "severity"],
  scope: { status: openIssueStatuses },
});

type HierarchyRow = PortfolioRow & {
  /** How many programs stand under the row: a business line's and a product's Used by. */
  programs: number;
  /** The row's open issues, each program once, and by severity. */
  issues: number;
  severities: Record<string, number>;
  attentionItems: { key: string; label: string }[];
  children: HierarchyRow[];
};

/** What the cells draw from: read once for every row, so the columns never rebuild. */
type Standings = {
  products: ReadonlyMap<string, UseQueryResult<ProductControlStatusAnswer, Error>>;
  programs: UseQueryResult<ReadonlyMap<string, ControlStatusTotals>, Error>;
  issues: UseQueryResult<unknown[], Error>;
};
const StandingsContext = createContext<Standings | null>(null);

/** Where a row stands: its whole's satisfied controls, a number beside one bar of its statuses. */
function StandingCell({ row }: { row: HierarchyRow }) {
  const standings = useContext(StandingsContext);
  const { formatNumber } = useLedgerLocale();
  if (!standings) return null;
  if (row.kind === "variant") {
    const programId = row.programIds[0]!;
    return (
      <QueryValue queries={[standings.programs]}>
        {() => {
          const status = standings.programs.data?.get(programId);
          if (!status?.baseline) return null;
          return (
            <Inline space="space.100" alignBlock="center" className="min-w-0">
              <ControlStatusTally status={status} label={`Control status of ${row.name}`} />
              <Text numeric>
                {formatNumber(status.counts.satisfied)} of {formatNumber(status.total)}
              </Text>
            </Inline>
          );
        }}
      </QueryValue>
    );
  }
  if (!row.revisionId || (row.kind !== "product" && row.kind !== "configuration")) return null;
  const answer = standings.products.get(row.revisionId);
  if (!answer) return null;
  return (
    <QueryValue queries={[answer]}>
      {() => {
        const data = answer.data!;
        const counts =
          row.kind === "product"
            ? data.core.counts
            : data.configurations.find((item) => item.id === row.configurationId)?.counts;
        if (!counts || !data.total) return null;
        return (
          <Inline space="space.100" alignBlock="center" className="min-w-0">
            <ProductStatusTally
              counts={counts}
              total={data.total}
              label={`Controls of ${row.name} by status`}
            />
            <Text numeric>
              {formatNumber(counts.satisfied)} of {formatNumber(data.total)}
            </Text>
          </Inline>
        );
      }}
    </QueryValue>
  );
}

/** A row's open issues: a count a severity, the worst first, in its tone; none draws nothing. */
function IssuesCell({ row }: { row: HierarchyRow }) {
  const standings = useContext(StandingsContext);
  const { formatNumber } = useLedgerLocale();
  if (!standings || !row.programIds.length) return null;
  return (
    <QueryValue queries={[standings.issues]}>
      {() => (
        <Inline space="space.150" alignBlock="center">
          {SEVERITIES.filter((severity) => row.severities[severity]).map((severity) => {
            const entry = statusEntry(severityLevels, severity);
            return (
              <Indicator
                key={severity}
                tone={entry?.tone ?? "neutral"}
                {...(entry?.emphasis ? { emphasis: entry.emphasis } : {})}
              >
                {formatNumber(row.severities[severity]!)}
                <VisuallyHidden>{` ${entry?.label.toLowerCase() ?? severity}`}</VisuallyHidden>
              </Indicator>
            );
          })}
        </Inline>
      )}
    </QueryValue>
  );
}

const columns = defineColumns<HierarchyRow>((c) => [
  c.text("name", {
    header: "Business line › product › configuration › program",
    minWidth: 260,
    priority: 0,
    hideable: false,
    cell: (row) =>
      row.kind === "line" ? (
        <RecordLink table="business_lines" record={{ id: row.recordId }}>
          {row.name}
        </RecordLink>
      ) : row.kind === "product" ? (
        <RecordLink table="products" record={{ id: row.recordId }}>
          {row.name}
        </RecordLink>
      ) : row.kind === "variant" ? (
        <RecordLink table="programs" record={{ id: row.recordId }}>
          {row.name}
        </RecordLink>
      ) : (
        row.name
      ),
  }),
  c.number("version", {
    header: "Version",
    width: 150,
    priority: 2,
    cell: (row) =>
      row.version === null ? null : (
        <Inline space="space.150" alignBlock="baseline">
          <Text numeric>{row.version}</Text>
          {row.behind > 0 && (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/product-delta"
                  params={{ programId: row.recordId }}
                  search={{ system: row.id.slice("variant:".length) }}
                />
              }
            >
              Behind {row.behind}
            </TextLink>
          )}
        </Inline>
      ),
  }),
  c.custom("standing", {
    header: "Controls satisfied",
    width: 220,
    priority: 1,
    cell: (row) => <StandingCell row={row} />,
  }),
  c.number("programs", {
    header: "Used by",
    width: 130,
    priority: 3,
    cell: (row) =>
      (row.kind === "line" || row.kind === "product") && row.programs > 0 ? (
        <UsedBy count={row.programs} />
      ) : null,
  }),
  c.number("modified", {
    header: "Modified here",
    width: 140,
    priority: 4,
    cell: (row) => (row.modified > 0 ? <Text numeric>{row.modified}</Text> : null),
  }),
  c.number("issues", {
    header: "Open issues",
    width: 190,
    priority: 5,
    cell: (row) => <IssuesCell row={row} />,
  }),
  // The strip's presets ask for these; the column is never drawn.
  c.list("attention", {
    header: "Needs a look",
    hideable: false,
    items: (row) => row.attentionItems,
  }),
]);

function UsedBy({ count }: { count: number }) {
  const { formatPlural } = useLedgerLocale();
  return <>{formatPlural(count, { one: "{count} program", other: "{count} programs" })}</>;
}

function Portfolio() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const openRecord = useOpenRecord();
  const { formatNumber } = useLedgerLocale();
  const [creating, setCreating] = useState(false);
  // The hierarchy's records: small reference collections, the columns the tree draws.
  const lines = useRows("business_lines", undefined, { columns: ["id", "code", "name"] as const });
  const products = useRows("products", undefined, {
    columns: ["id", "code", "name", "business_line_id"] as const,
  });
  const versions = useRows("product_revisions", undefined, {
    columns: ["id", "product_id", "version_number", "state", "published_at"] as const,
  });
  const configurations = useRows("product_configurations", undefined, {
    columns: ["id", "product_id", "code", "name", "state"] as const,
  });
  const versionIds = useMemo(() => (versions.data ?? []).map((row) => row.id), [versions.data]);
  // The variants: the programs' systems made from a product's versions, never every system.
  const variants = useRows(
    "systems",
    { product_revision_id: versionIds, is_authorization_boundary: true },
    {
      columns: [
        "id",
        "code",
        "program_id",
        "product_revision_id",
        "product_configuration_id",
      ] as const,
      enabled: versions.isSuccess,
    },
  );
  const variantIds = useMemo(() => (variants.data ?? []).map((row) => row.id), [variants.data]);
  // Inside them, only the elements their program declared it changed.
  const changed = useRows(
    "systems",
    {
      boundary_system_id: variantIds,
      or: `product_change_kinds.ov.{${ELEMENT_CHANGE_KINDS.join(",")}}`,
    },
    {
      columns: ["id", "boundary_system_id", "product_change_kinds"] as const,
      enabled: variants.isSuccess,
    },
  );
  const programIds = useMemo(
    () => [...new Set((variants.data ?? []).map((row) => row.program_id))],
    [variants.data],
  );
  const programs = useRows(
    "programs",
    { id: programIds },
    { columns: ["id", "code", "name"] as const, enabled: variants.isSuccess },
  );
  const hierarchy = useMemo(
    () =>
      portfolioHierarchy({
        lines: lines.data ?? [],
        products: products.data ?? [],
        versions: versions.data ?? [],
        configurations: configurations.data ?? [],
        variants: variants.data ?? [],
        programs: programs.data ?? [],
        elements: changed.data ?? [],
      }),
    [
      lines.data,
      products.data,
      versions.data,
      configurations.data,
      variants.data,
      programs.data,
      changed.data,
    ],
  );
  const queries = [lines, products, versions, configurations, variants, changed, programs];

  // What stands on the rows, read once each for every row the tree names.
  const revisionIds = useMemo(
    () => [
      ...new Set(
        hierarchy.flatMap((row) =>
          row.kind === "line"
            ? row.children.flatMap((child) => (child.revisionId ? [child.revisionId] : []))
            : row.revisionId
              ? [row.revisionId]
              : [],
        ),
      ),
    ],
    [hierarchy],
  );
  const productStandings = useProductsControlStatus(revisionIds);
  const programStandings = useProgramsControlStatusCounts(programIds);
  const openIssues = useServerResultRows<{ program_id: string | null; severity: string | null }>(
    openIssuesRead,
    { filters: [{ id: "program_id", value: programIds }] },
    { enabled: programIds.length > 0 },
  );
  const issues = useMemo(() => issuesByProgram(openIssues.data ?? []), [openIssues.data]);
  const standings = useMemo<Standings>(
    () => ({ products: productStandings, programs: programStandings, issues: openIssues }),
    [productStandings, programStandings, openIssues],
  );
  const rows = useMemo(() => decorate(hierarchy, issues), [hierarchy, issues]);

  // The facts: counted on the server, or from the hierarchy's own rows.
  const [allPrograms] = useServerCountQueries(programCount, [{}]);
  const [assessed] = useServerCountQueries(componentRegisterRead, [assessedQuestion]);
  const [offers] = useServerCountQueries(offerCount, [offersQuestion]);
  const factQueries = [allPrograms!, assessed!, offers!];

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Portfolio",
    view: "portfolio-hierarchy-v1",
    tree: {
      children: (row) => row.children,
      label: (row) => row.name,
      initialExpanded: true,
      guides: true,
    },
    initialState: { columnVisibility: { attention: false } },
  });
  const counts = useMemo(() => {
    const flat = flatten(rows);
    return {
      all: flat.filter((row) => row.kind === "product").length,
      behind: flat.filter((row) => row.attention.includes("behind")).length,
      modified: flat.filter((row) => row.attention.includes("modified")).length,
    };
  }, [rows]);
  const canCreate = canAuthorLibrary(workspace.role);
  const createButton = (size: "small" | "medium") =>
    canCreate ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
        Create product
      </Button>
    ) : undefined;
  const ready = queries.every((query) => query.data !== undefined);
  const onProduct = programsOnAProduct(hierarchy).length;

  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Portfolio</PageHeader.Title>
          <ReportFailures queries={factQueries} />
          {/* A count of none is drawn as nothing. */}
          <PageHeader.Facts>
            {lines.data?.length !== 0 && (
              <Fact label="Business lines">
                <QueryValue queries={[lines]}>
                  {() => formatNumber(lines.data?.length ?? 0)}
                </QueryValue>
              </Fact>
            )}
            {!(ready && onProduct === 0) && (
              <Fact label="Programs on a product">
                <QueryValue queries={[...queries, allPrograms!]}>
                  {() => `${formatNumber(onProduct)} of ${formatNumber(allPrograms!.data ?? 0)}`}
                </QueryValue>
              </Fact>
            )}
            {assessed!.data !== 0 && (
              <Fact label="Components assessed once">
                <QueryValue queries={[assessed!]}>
                  {() => (
                    <TextLink
                      render={
                        <Link
                          to="/library/components"
                          search={questionSearch(registerViews.components, assessedQuestion)}
                        />
                      }
                    >
                      {formatNumber(assessed!.data ?? 0)}
                    </TextLink>
                  )}
                </QueryValue>
              </Fact>
            )}
            {offers!.data ? (
              <Fact label="Offers to review">
                <TextLink
                  render={
                    <Link
                      to="/review-queue"
                      search={questionSearch(registerViews.reviewQueue, offersQuestion)}
                    />
                  }
                >
                  {formatNumber(offers!.data)}
                </TextLink>
              </Fact>
            ) : null}
          </PageHeader.Facts>
        </PageHeader.Heading>
      </PageHeader>
      <DataTable.Presets
        table={table}
        presets={presets}
        counts={counts}
        aria-label="Needs a look"
      />
      <StandingsContext.Provider value={standings}>
        <ProductCollection
          table={table}
          queries={queries}
          fill
          searchLabel="Find products and programs"
          onRowClick={(row) => {
            if (row.kind === "line") openRecord("business_lines", { id: row.recordId });
            else if (row.kind === "product") openRecord("products", { id: row.recordId });
            else if (row.kind === "variant") openRecord("programs", { id: row.recordId });
          }}
          empty={{
            illustration: "tree",
            title: "No products yet",
            description: "Business lines, products and their programs appear here.",
            action: createButton("medium"),
          }}
          action={createButton("small")}
        />
      </StandingsContext.Provider>
      {creating && (
        <ProductRecordDialog
          table="products"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({
              to: "/library/products/$productKey",
              params: { productKey: record.id },
            });
          }}
        />
      )}
    </Page>
  );
}

const flatten = (rows: readonly HierarchyRow[]): HierarchyRow[] =>
  rows.flatMap((row) => [row, ...flatten(row.children)]);

/** The tree's rows with what their cells count: programs once, open issues by severity. */
function decorate(
  rows: readonly PortfolioRow[],
  issues: ReadonlyMap<string, SeverityCounts>,
): HierarchyRow[] {
  return rows.map((row) => {
    const severities = rowIssues(row, issues);
    return {
      ...row,
      programs: row.programIds.length,
      issues: SEVERITIES.reduce((sum, severity) => sum + (severities[severity] ?? 0), 0),
      severities,
      attentionItems: row.attention.map((key) => ({ key, label: ATTENTION[key] })),
      children: decorate(row.children, issues),
    };
  });
}
