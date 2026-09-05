import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";

import {
  Badge,
  Box,
  Breadcrumb,
  Button,
  Id,
  Inline,
  NativeSelect,
  Panel,
  Progress,
  RecordHeader,
  Section,
  Shell as DsShell,
  ShowPage,
  Table,
  Tabs,
  TextLink,
  Toolbar,
  Eyebrow,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { SctmRail, SctmSummary, SctmTable } from "@/components/app/sctm";
import { controlMatrix } from "@/lib/control-matrix";
import { programs } from "@/lib/grc-data";
import { catalogVersion } from "@/lib/nist-catalog";
import {
  buildControlTextIndex,
  sctmCsv,
  useSctm,
  type RowCurrency,
  type SctmRow,
} from "@/lib/sctm";
import { cn } from "@ledger/design-system/cn";

const sctmTabs = ["Matrix", "Coverage", "Gaps"] as const;
type SctmTab = (typeof sctmTabs)[number];

/** One page of requirement rows. A High baseline generates hundreds. */
const PAGE = 150;

export const Route = createFileRoute("/programs/$programId_/sctm")({
  // Always emit the `tab` key, even when nothing matched. TanStack merges the
  // validated object over the raw search, so returning `{}` on a miss leaves
  // `?tab=Bogus` in the URL and renders a header over an empty body; emitting
  // `tab: undefined` makes the encoder drop the key and fall back to the
  // default tab. The `| undefined` in the return type is required by
  // `exactOptionalPropertyTypes`.
  validateSearch: (search: Record<string, unknown>): { tab?: SctmTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    const match = sctmTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    return { tab: match };
  },
  // The 800-53A catalog text is 1.25 MB. It is imported dynamically — never
  // statically — so it stays out of the initial bundle. Loader data is also
  // serialised into the SSR document on every request, so what crosses the wire
  // is narrowed to the SHAPE the matrix reads and nothing more — the walk that
  // does the narrowing lives in `@/lib/sctm` because the impact analysis in
  // `@/lib/change-impact` has to build its rows from the identical shape, and a
  // matrix built from a different one names requirements that resolve against
  // no rendered row.
  loader: async ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();

    const { controlText } = await import("@/lib/nist-control-text");
    const text = buildControlTextIndex(
      controlText,
      controlMatrix(program.id).map((r) => r.id),
    );
    return { program, text };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.program.name ?? "Program";
    const title = `${name} SCTM — Equinox`;
    const description = `Security controls traceability matrix for ${
      loaderData?.program.id ?? "the program"
    }: every requirement traced from control to CCI or 800-53A objective, to the component it is allocated to, to the verification method, evidence and determination.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProgramSctm,
});

type FamilyStat = {
  id: string;
  name: string;
  rows: number;
  satisfied: number;
  other: number;
  notAssessed: number;
  gaps: number;
  /** Rows carrying a determination AND no gap — the same set `buildSctm` counts. */
  complete: number;
  coverage: number;
};

/** Client-side download. Guarded because the route also renders on the server. */
function downloadCsv(filename: string, csv: string) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ProgramSctm() {
  const { programId } = Route.useParams();
  const { program, text } = Route.useLoaderData();
  const tab = Route.useSearch().tab ?? "Matrix";
  const navigate = useNavigate({ from: Route.fullPath });

  const sctm = useSctm(program.id, text);

  const [family, setFamily] = useState<string | null>(null);
  const [allFamilies, setAllFamilies] = useState(false);
  const [query, setQuery] = useState("");
  const [gapReason, setGapReason] = useState<string | null>(null);
  /**
   * Currency is orthogonal to family, and the family the assessor lands on is
   * the most-gapped one, which on this dataset carries no non-current row at
   * all. So selecting a currency widens the scope to every family rather than
   * filtering an arbitrary slice of it down to nothing.
   */
  const [currency, setCurrency] = useState<RowCurrency | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(null);

  /** Per-family rollup — drives both the family picker and the coverage table. */
  const familyStats = useMemo(() => {
    const byId = new Map<string, FamilyStat>();
    for (const r of sctm.rows) {
      const stat = byId.get(r.family) ?? {
        id: r.family,
        name: r.familyName,
        rows: 0,
        satisfied: 0,
        other: 0,
        notAssessed: 0,
        gaps: 0,
        complete: 0,
        coverage: 0,
      };
      stat.rows += 1;
      if (r.determination === "Satisfied") stat.satisfied += 1;
      if (r.determination === "Other than satisfied") stat.other += 1;
      if (r.determination === "Not assessed") stat.notAssessed += 1;
      if (r.gap !== null) stat.gaps += 1;
      if (r.determination !== "Not assessed" && r.gap === null) stat.complete += 1;
      byId.set(r.family, stat);
    }
    const out = [...byId.values()];
    for (const s of out) {
      // Count the covered set directly. Subtracting gaps and not-assessed rows
      // separately double-counts every row that is both, which drives coverage
      // below zero — the two predicates are not disjoint.
      s.coverage = Math.round((s.complete / (s.rows || 1)) * 100);
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  }, [sctm.rows]);

  /**
   * The family the assessor most likely came here for: the one carrying the
   * most rows that cannot ship. Deterministic, so server and client agree.
   */
  const defaultFamily = useMemo(() => {
    let best = familyStats[0]?.id ?? "";
    let bestGaps = -1;
    for (const s of familyStats) {
      if (s.gaps > bestGaps) {
        best = s.id;
        bestGaps = s.gaps;
      }
    }
    return best;
  }, [familyStats]);

  const activeFamily = family ?? defaultFamily;
  const currentRows = sctm.counts.total - sctm.counts.invalidated - sctm.counts.suspect;

  const matrixRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sctm.rows.filter((r) => {
      if (!allFamilies && r.family !== activeFamily) return false;
      if (currency !== null && r.currency !== currency) return false;
      if (!q) return true;
      return (
        r.control.toLowerCase().includes(q) ||
        r.requirement.toLowerCase().includes(q) ||
        r.statement.toLowerCase().includes(q) ||
        r.responsibleParty.toLowerCase().includes(q)
      );
    });
  }, [sctm.rows, allFamilies, activeFamily, currency, query]);

  const gapReasons = useMemo(() => {
    const byReason = new Map<string, number>();
    for (const r of sctm.rows) {
      if (r.gap === null) continue;
      byReason.set(r.gap, (byReason.get(r.gap) ?? 0) + 1);
    }
    return [...byReason.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
  }, [sctm.rows]);

  const gapRows = useMemo(
    () => sctm.rows.filter((r) => r.gap !== null && (gapReason === null || r.gap === gapReason)),
    [sctm.rows, gapReason],
  );

  const visible = tab === "Gaps" ? gapRows : matrixRows;
  const shown = visible.slice(0, limit);
  const selectedRow: SctmRow | null = selected
    ? (sctm.rows.find((r) => r.key === selected) ?? null)
    : null;

  const refilter = (fn: () => void) => {
    fn();
    setLimit(PAGE);
    setSelected(null);
  };

  const go = (next: SctmTab) => {
    setLimit(PAGE);
    setSelected(null);
    navigate({ search: { tab: next }, replace: true });
  };

  const counts: Record<SctmTab, number | null> = {
    Matrix: sctm.counts.total,
    Coverage: null,
    Gaps: sctm.gaps,
  };

  return (
    <Shell>
      <>
        <ShowPage
          header={
            <RecordHeader
              back={<Link to="/programs/$programId" params={{ programId }} />}
              breadcrumb={
                <Breadcrumb>
                  <Breadcrumb.Item asChild>
                    <Link to={"/programs"}>{"Programs"}</Link>
                  </Breadcrumb.Item>
                  <Breadcrumb.Item asChild>
                    <Link to={"/programs/$programId"} params={{ programId: program.id }}>
                      {program.name}
                    </Link>
                  </Breadcrumb.Item>
                  <Breadcrumb.Item isCurrent>{"SCTM"}</Breadcrumb.Item>
                </Breadcrumb>
              }
              id={program.id}
              title="Security controls traceability matrix"
              meta={`${program.acronym} · ${program.impact} baseline · ${catalogVersion} · generated ${sctm.generated}`}
              actions={
                <>
                  <Badge tone={sctm.gaps > 0 ? "danger" : "success"}>
                    {sctm.gaps > 0 ? `${sctm.gaps} rows cannot ship` : "No gaps"}
                  </Badge>
                  <Button
                    variant="primary"
                    onClick={() => downloadCsv(`${program.id}-sctm.csv`, sctmCsv(sctm))}
                    iconBefore={<FileDown />}
                  >
                    Export CSV
                  </Button>
                </>
              }
            />
          }
          tabs={
            <Tabs>
              {sctmTabs.map((t) => (
                <Tabs.Tab key={t} isSelected={t === tab} onClick={() => go(t)} count={counts[t]}>
                  {t}
                </Tabs.Tab>
              ))}
            </Tabs>
          }
        >
          {tab === "Matrix" ? (
            <Section
              title="Requirement rows"
              description="One row per DISA CCI where the catalog publishes one, per SP 800-53A assessment objective where it does not, and per control otherwise. Where a recorded change reaches the components a row is allocated to, the Determination column carries it: a withdrawn claim struck through beside what replaced it and an Invalidated chip, or an amber dot for a determination that stands and is flagged."
              action={
                <span className="tabular-nums font-body-small text-subtle">
                  {shown.length === visible.length
                    ? `${visible.length} of ${sctm.counts.total} rows`
                    : `${shown.length} of ${visible.length} shown · ${sctm.counts.total} total`}
                </span>
              }
            >
              <Toolbar
                search={query}
                onSearch={(v) => refilter(() => setQuery(v))}
                placeholder="Control, CCI, statement"
                actions={
                  <span className="tabular-nums font-body-small text-subtle">
                    {allFamilies
                      ? `${familyStats.length} families`
                      : `1 of ${familyStats.length} families`}
                  </span>
                }
              >
                <NativeSelect
                  value={activeFamily}
                  disabled={allFamilies}
                  onChange={(e) => refilter(() => setFamily(e.target.value))}
                  className="h-control-small font-body"
                  style={{ width: 248 }}
                >
                  {familyStats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id} — {f.name} ({f.rows})
                    </option>
                  ))}
                </NativeSelect>
                <Button
                  size="small"
                  variant={allFamilies ? "primary" : "secondary"}
                  onClick={() => refilter(() => setAllFamilies((v) => !v))}
                >
                  {allFamilies ? "Show one family" : "Show all families"}
                </Button>
                <NativeSelect
                  value={currency ?? ""}
                  onChange={(e) =>
                    refilter(() => {
                      const next = (e.target.value || null) as RowCurrency | null;
                      setCurrency(next);
                      if (next !== null) setAllFamilies(true);
                    })
                  }
                  className="h-control-small font-body"
                  style={{ width: 208 }}
                >
                  <option value="">Any currency ({sctm.counts.total})</option>
                  <option value="Current">Current ({currentRows})</option>
                  <option value="Invalidated">Invalidated ({sctm.counts.invalidated})</option>
                  <option value="Suspect">Suspect ({sctm.counts.suspect})</option>
                </NativeSelect>
              </Toolbar>

              {currency !== null ? (
                <p className="pb-100 font-body-small text-subtle">
                  {currency === "Invalidated"
                    ? "Invalidated rows were determined against a configuration that is no longer in force. A retracted Satisfied claim is shown struck through beside the Not assessed it became; a deficiency keeps its determination and is owed a re-test."
                    : currency === "Suspect"
                      ? "Suspect rows keep their determination — the assessor is asked to look again, not told the row is wrong. Hover the marker for the change that raised it."
                      : "Current rows were determined against the build in force; no recorded change reaches the components they are allocated to."}
                </p>
              ) : null}

              {allFamilies && visible.length > PAGE ? (
                <p className="pb-100 font-body-small text-subtle">
                  All {familyStats.length} families are in scope — {visible.length} requirement
                  rows. The table pages {PAGE} at a time; the CSV export carries every row.
                </p>
              ) : null}

              <SctmTable rows={shown} onSelect={(r) => setSelected(r.key)} selected={selected} />

              {visible.length > shown.length ? (
                <Box paddingBlockStart="space.150">
                  <Button size="small" onClick={() => setLimit((n) => n + PAGE)}>
                    Show {Math.min(PAGE, visible.length - shown.length)} more ·{" "}
                    {visible.length - shown.length} remaining
                  </Button>
                </Box>
              ) : null}
            </Section>
          ) : null}

          {tab === "Coverage" ? (
            <>
              <SctmSummary sctm={sctm} />

              <Section
                title="Coverage by control family"
                description="A family is covered when every one of its requirement rows carries a determination and no gap."
              >
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={52}>Family</Table.Header>
                      <Table.Header>Name</Table.Header>
                      <Table.Header width={72} className="text-right">
                        Rows
                      </Table.Header>
                      <Table.Header width={80} className="text-right">
                        Satisfied
                      </Table.Header>
                      <Table.Header width={80} className="text-right">
                        Other
                      </Table.Header>
                      <Table.Header width={96} className="text-right">
                        Not assessed
                      </Table.Header>
                      <Table.Header width={72} className="text-right">
                        Gaps
                      </Table.Header>
                      <Table.Header width={148}>Coverage</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {familyStats.map((f) => (
                      <Table.Row
                        key={f.id}
                        className="cursor-pointer"
                        onClick={() => {
                          refilter(() => {
                            setFamily(f.id);
                            setAllFamilies(false);
                          });
                          navigate({ search: { tab: "Matrix" }, replace: true });
                        }}
                      >
                        <Table.Id id={f.id} />
                        <Table.Cell className="truncate">{f.name}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{f.rows}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{f.satisfied}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{f.other}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{f.notAssessed}</Table.Cell>
                        <Table.Cell
                          className={cn("tabular-nums text-right", f.gaps > 0 ? "text-danger" : "")}
                        >
                          {f.gaps}
                        </Table.Cell>
                        <Table.Cell>
                          <Progress
                            value={f.coverage}
                            tone={
                              f.coverage >= 90 ? "success" : f.coverage >= 60 ? "warning" : "danger"
                            }
                            showValue
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              </Section>
            </>
          ) : null}

          {tab === "Gaps" ? (
            <>
              <Section
                title="Why rows cannot ship"
                description="Each requirement row is tested against the package rules in order; the first rule that fires is the gap recorded."
                action={
                  <span className="tabular-nums font-body-small text-subtle">
                    {sctm.gaps} of {sctm.counts.total} rows
                  </span>
                }
              >
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header>Gap</Table.Header>
                      <Table.Header width={72} className="text-right">
                        Rows
                      </Table.Header>
                      <Table.Header width={168}>Share of all rows</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {gapReasons.map((g) => (
                      <Table.Row
                        key={g.reason}
                        className={cn("cursor-pointer", gapReason === g.reason && "bg-selected")}
                        onClick={() =>
                          refilter(() => setGapReason(gapReason === g.reason ? null : g.reason))
                        }
                      >
                        <Table.Cell className="truncate text-danger">{g.reason}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{g.count}</Table.Cell>
                        <Table.Cell>
                          <Progress
                            value={Math.round((g.count / (sctm.counts.total || 1)) * 100)}
                            tone="danger"
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                    {gapReasons.length === 0 ? (
                      <Table.Row>
                        <Table.Cell>
                          Every requirement row carries a determination, an assertion, an allocation
                          and evidence.
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">0</Table.Cell>
                        <Table.Cell>—</Table.Cell>
                      </Table.Row>
                    ) : null}
                  </tbody>
                </Table>
              </Section>

              <Section
                title={gapReason ?? "Rows that cannot ship"}
                description={
                  gapReason
                    ? "Filtered to one gap reason. Select it again to clear the filter."
                    : "Every row the package review would reject, across all control families."
                }
                action={
                  <span className="tabular-nums font-body-small text-subtle">
                    {shown.length === visible.length
                      ? `${visible.length} rows`
                      : `${shown.length} of ${visible.length} shown`}
                  </span>
                }
              >
                <Box paddingBlockStart="space.150">
                  <SctmTable
                    rows={shown}
                    onSelect={(r) => setSelected(r.key)}
                    selected={selected}
                  />
                </Box>

                {visible.length > shown.length ? (
                  <Box paddingBlockStart="space.150">
                    <Button size="small" onClick={() => setLimit((n) => n + PAGE)}>
                      Show {Math.min(PAGE, visible.length - shown.length)} more ·{" "}
                      {visible.length - shown.length} remaining
                    </Button>
                  </Box>
                ) : null}
              </Section>
            </>
          ) : null}
        </ShowPage>
        {tab !== "Coverage" && selectedRow !== null ? (
          <DsShell.Panel label="Details">
            <DsShell.Panel.Splitter label="Resize details" />
            <Panel flush>
              {selectedRow ? (
                <div>
                  <Inline className="pb-150" space="space.100" alignBlock="center">
                    <Eyebrow as="span">Requirement</Eyebrow>
                    <Id>{selectedRow.requirement}</Id>
                    <button
                      onClick={() => setSelected(null)}
                      className="ml-auto font-body-small text-subtle hover:text-default"
                    >
                      Close
                    </button>
                  </Inline>
                  <SctmRail row={selectedRow} />
                  <Box className="font-body-small" paddingBlockStart="space.150">
                    <TextLink>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId, controlId: selectedRow.control }}
                      >
                        Open {selectedRow.control} →
                      </Link>
                    </TextLink>
                  </Box>
                </div>
              ) : null}
            </Panel>
          </DsShell.Panel>
        ) : null}
      </>
    </Shell>
  );
}
