import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";

import {
  Badge,
  Button,
  Progress,
  NativeSelect,
  Table,
  Toolbar,
  Id,
  Tabs,
  Breadcrumb,
} from "@/ds/primitives";
import { RecordHeader, Section, ShowPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
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
import { cn } from "@/lib/utils";

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
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId }}
            breadcrumb={
              <Breadcrumb
                items={[
                  { label: "Programs", to: "/programs" },
                  {
                    label: program.name,
                    to: "/programs/$programId",
                    params: { programId: program.id },
                  },
                  { label: "SCTM" },
                ]}
              />
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
                >
                  <FileDown className="size-3.5" /> Export CSV
                </Button>
              </>
            }
          />
        }
        tabs={
          <Tabs
            items={sctmTabs.map((t) => ({
              key: t,
              label: t,
              active: t === tab,
              onSelect: () => go(t),
              trailing:
                counts[t] === null ? null : (
                  <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                    {counts[t]}
                  </span>
                ),
            }))}
          />
        }
        showRail={tab !== "Coverage" && selectedRow !== null}
        rail={
          selectedRow ? (
            <div>
              <div className="flex items-center gap-2 pb-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Requirement
                </span>
                <Id>{selectedRow.requirement}</Id>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <SctmRail row={selectedRow} />
              <div className="pt-3 text-[12.5px]">
                <Link
                  to="/programs/$programId/controls/$controlId"
                  params={{ programId, controlId: selectedRow.control }}
                  className="text-primary hover:underline"
                >
                  Open {selectedRow.control} →
                </Link>
              </div>
            </div>
          ) : null
        }
      >
        {tab === "Matrix" ? (
          <Section
            title="Requirement rows"
            description="One row per DISA CCI where the catalog publishes one, per SP 800-53A assessment objective where it does not, and per control otherwise. Where a recorded change reaches the components a row is allocated to, the Determination column carries it: a withdrawn claim struck through beside what replaced it and an Invalidated chip, or an amber dot for a determination that stands and is flagged."
            action={
              <span className="tnum text-12 text-muted-foreground">
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
                <span className="tnum text-12 text-muted-foreground">
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
                className="h-7 w-[248px] text-13"
              >
                {familyStats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id} — {f.name} ({f.rows})
                  </option>
                ))}
              </NativeSelect>
              <Button
                size="sm"
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
                className="h-7 w-[208px] text-13"
              >
                <option value="">Any currency ({sctm.counts.total})</option>
                <option value="Current">Current ({currentRows})</option>
                <option value="Invalidated">Invalidated ({sctm.counts.invalidated})</option>
                <option value="Suspect">Suspect ({sctm.counts.suspect})</option>
              </NativeSelect>
            </Toolbar>

            {currency !== null ? (
              <p className="pb-2 text-12 text-muted-foreground">
                {currency === "Invalidated"
                  ? "Invalidated rows were determined against a configuration that is no longer in force. A retracted Satisfied claim is shown struck through beside the Not assessed it became; a deficiency keeps its determination and is owed a re-test."
                  : currency === "Suspect"
                    ? "Suspect rows keep their determination — the assessor is asked to look again, not told the row is wrong. Hover the marker for the change that raised it."
                    : "Current rows were determined against the build in force; no recorded change reaches the components they are allocated to."}
              </p>
            ) : null}

            {allFamilies && visible.length > PAGE ? (
              <p className="pb-2 text-12 text-muted-foreground">
                All {familyStats.length} families are in scope — {visible.length} requirement rows.
                The table pages {PAGE} at a time; the CSV export carries every row.
              </p>
            ) : null}

            <SctmTable rows={shown} onSelect={(r) => setSelected(r.key)} selected={selected} />

            {visible.length > shown.length ? (
              <div className="pt-3">
                <Button size="sm" onClick={() => setLimit((n) => n + PAGE)}>
                  Show {Math.min(PAGE, visible.length - shown.length)} more ·{" "}
                  {visible.length - shown.length} remaining
                </Button>
              </div>
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
                <colgroup>
                  <col style={{ width: "52px" }} />
                  <col />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "96px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "148px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>Family</Table.Header>
                    <Table.Header>Name</Table.Header>
                    <Table.Header className="text-right">Rows</Table.Header>
                    <Table.Header className="text-right">Satisfied</Table.Header>
                    <Table.Header className="text-right">Other</Table.Header>
                    <Table.Header className="text-right">Not assessed</Table.Header>
                    <Table.Header className="text-right">Gaps</Table.Header>
                    <Table.Header>Coverage</Table.Header>
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
                      <Table.Cell className="tnum text-right">{f.rows}</Table.Cell>
                      <Table.Cell className="tnum text-right">{f.satisfied}</Table.Cell>
                      <Table.Cell className="tnum text-right">{f.other}</Table.Cell>
                      <Table.Cell className="tnum text-right">{f.notAssessed}</Table.Cell>
                      <Table.Cell
                        className={cn("tnum text-right", f.gaps > 0 ? "text-danger" : "")}
                      >
                        {f.gaps}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1">
                            <Progress
                              value={f.coverage}
                              tone={
                                f.coverage >= 90
                                  ? "success"
                                  : f.coverage >= 60
                                    ? "warning"
                                    : "danger"
                              }
                            />
                          </span>
                          <span className="tnum w-9 shrink-0 text-right text-12 text-muted-foreground">
                            {f.coverage}%
                          </span>
                        </span>
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
                <span className="tnum text-12 text-muted-foreground">
                  {sctm.gaps} of {sctm.counts.total} rows
                </span>
              }
            >
              <Table className="table-fixed">
                <colgroup>
                  <col />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "168px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>Gap</Table.Header>
                    <Table.Header className="text-right">Rows</Table.Header>
                    <Table.Header>Share of all rows</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {gapReasons.map((g) => (
                    <Table.Row
                      key={g.reason}
                      className={cn(
                        "cursor-pointer",
                        gapReason === g.reason && "bg-primary-soft/40",
                      )}
                      onClick={() =>
                        refilter(() => setGapReason(gapReason === g.reason ? null : g.reason))
                      }
                    >
                      <Table.Cell className="truncate text-danger">{g.reason}</Table.Cell>
                      <Table.Cell className="tnum text-right">{g.count}</Table.Cell>
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
                      <Table.Cell className="tnum text-right">0</Table.Cell>
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
                <span className="tnum text-12 text-muted-foreground">
                  {shown.length === visible.length
                    ? `${visible.length} rows`
                    : `${shown.length} of ${visible.length} shown`}
                </span>
              }
            >
              <div className="pt-3">
                <SctmTable rows={shown} onSelect={(r) => setSelected(r.key)} selected={selected} />
              </div>

              {visible.length > shown.length ? (
                <div className="pt-3">
                  <Button size="sm" onClick={() => setLimit((n) => n + PAGE)}>
                    Show {Math.min(PAGE, visible.length - shown.length)} more ·{" "}
                    {visible.length - shown.length} remaining
                  </Button>
                </div>
              ) : null}
            </Section>
          </>
        ) : null}
      </ShowPage>
    </Shell>
  );
}
