import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Badge, NativeSelect, Toolbar, Tabs } from "@/ds/primitives";
import { Empty, Section, ShowPage, RecordHeader } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
import {
  DedupRail,
  DedupTable,
  FormatChip,
  IngestSummary,
  NormalizationView,
  ScanDiffTable,
  ScanRail,
  ScanTable,
  type NormalizationRow,
} from "@/components/app/ingestion";
import { useCompositionGraph } from "@/lib/composition";
import { programs } from "@/lib/grc-data";
import {
  currentScansForProgram,
  ingestBatch,
  nativeResults,
  normalizedForScan,
  scanRuns,
  scansForProgram,
  sourceAuthority,
} from "@/lib/ingestion";

const ingestionTabs = ["Scans", "Normalization", "Duplicates", "Scan over scan"] as const;
type IngestionTab = (typeof ingestionTabs)[number];

export const Route = createFileRoute("/programs/$programId_/ingestion")({
  // The router MERGES the validated object over the raw parsed search rather
  // than replacing it, so omitting `tab` on a miss left `?tab=Bogus` intact and
  // the `?? "Scans"` fallback below never fired — the page rendered with no
  // active tab and an empty body. Emitting the key explicitly, as `undefined`,
  // is what deletes it, and `encode()` drops undefined values so nothing leaks
  // back into the URL. The `| undefined` in the return type is load-bearing:
  // `exactOptionalPropertyTypes` is on, so a bare `tab?: IngestionTab` rejects
  // the explicit undefined (TS2375). It stays OPTIONAL rather than widening to
  // a required `tab:` so that linking to this route does not demand a `search`.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: IngestionTab | undefined; scan?: string } => {
    const raw = String(search["tab"] ?? "");
    const match = ingestionTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    const scan = search["scan"];
    const selected = typeof scan === "string" && /^SCN-\d+$/.test(scan) ? scan : null;
    return { tab: match, ...(selected ? { scan: selected } : {}) };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} ingestion — Equinox` },
      {
        name: "description",
        content: `Automated ingestion for ${loaderData?.id ?? "the program"}: delivered scanner output normalized into one record shape, deduplicated by source authority, correlated to the finding register and diffed scan over scan.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} ingestion — Equinox` },
      {
        property: "og:description",
        content:
          "Native scanner records beside the normalized record, with the severity, node and dedup basis stated in full.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramIngestion,
});

function ProgramIngestion() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Scans";
  const navigate = useNavigate({ from: Route.fullPath });

  const nodes = useCompositionGraph(program.id);
  const nodeName = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [nodes]);

  const scans = scansForProgram(program.id);
  const current = currentScansForProgram(program.id);

  /** The inverse of `supersedes`: which later run replaced this one. */
  const supersededBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of scanRuns) if (s.supersedes) map.set(s.supersedes, s.id);
    return map;
  }, []);

  const fallbackScan = scans[0]?.id ?? null;
  const requested = search.scan ?? null;
  const scanId = requested && scans.some((s) => s.id === requested) ? requested : fallbackScan;
  const scan = scanId ? (scans.find((s) => s.id === scanId) ?? null) : null;

  // `ingestBatch` and `normalizedForScan` are keyed on the graph version and
  // return stable references, so calling them in render is the cheap path — a
  // `useMemo` here would have to key on the same version and would go stale the
  // moment a node is reclassified.
  const batch = scanId ? ingestBatch(scanId) : null;

  const rows: NormalizationRow[] = [];
  if (scanId) {
    const natives = nativeResults.filter((n) => n.scan === scanId);
    const normalized = normalizedForScan(scanId);
    for (let i = 0; i < normalized.length; i += 1) {
      const native = natives[i];
      const record = normalized[i];
      if (native && record) rows.push({ native, normalized: record });
    }
  }

  const [resultId, setResultId] = useState<string | null>(null);
  const [groupKey, setGroupKey] = useState<string | null>(null);

  const groups = batch?.groups ?? [];
  // Default to the group that has something to reconcile: a sole-source group
  // is the uninteresting case, and it should not be what the tab opens on.
  const activeGroup =
    groups.find((g) => g.key === groupKey) ??
    groups.find((g) => g.duplicates.length > 0) ??
    groups[0] ??
    null;
  // Two different predicates, deliberately not one. `withDuplicates` is what
  // the tab is named after — groups that had anything folded in at all — and it
  // drives the badge. `crossSource` is the narrower claim the prose makes: a
  // group two DIFFERENT formats reported. `DedupGroup.sources` is a list of
  // distinct formats, so a group whose only duplicate is an earlier run of the
  // same tool has one source, not two, and counting it as cross-source
  // overstated the reconciliation story by 4x on the superseded runs.
  const withDuplicates = groups.filter((g) => g.duplicates.length > 0).length;
  const crossSource = groups.filter((g) => g.sources.length > 1).length;
  const sameToolFolds = withDuplicates - crossSource;
  const otherCurrent = current.filter((s) => s.id !== scanId).length;
  /** A superseded run is not a member of the current set, so "other N" is false for it. */
  const selectedIsCurrent = current.some((s) => s.id === scanId);
  const presentFormats = new Set(groups.flatMap((g) => g.sources));

  const go = (next: IngestionTab) => navigate({ search: { ...search, tab: next }, replace: true });
  const selectScan = (next: string) =>
    navigate({ search: { ...search, scan: next }, replace: true });

  const counts: Record<IngestionTab, number | null> = {
    // `|| null` would be dead here — the badge guard below is already truthy,
    // so every tab in this strip hides its zero the same way.
    Scans: scans.length,
    Normalization: batch?.counts.normalized ?? null,
    Duplicates: withDuplicates,
    "Scan over scan": batch?.diff.length ?? null,
  };

  const held = rows.filter((r) => r.normalized.unresolved.length > 0).length;

  /** Program-wide, across the current picture — the header is not scan-scoped. */
  const heldAcrossProgram = current.reduce(
    (n, s) => n + normalizedForScan(s.id).filter((r) => r.unresolved.length > 0).length,
    0,
  );

  const picker =
    scan && tab !== "Scans" ? (
      <Toolbar
        actions={
          <>
            <Badge size="xs">{scan.format}</Badge>
            <span className="tnum text-[12px] text-muted-foreground">
              completed {scan.completed}
            </span>
          </>
        }
      >
        <span className="text-[12px] text-muted-foreground">Run</span>
        <NativeSelect
          value={scan.id}
          onChange={(e) => selectScan(e.target.value)}
          aria-label="Scan run"
          className="h-7 w-[360px] text-13"
        >
          {scans.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} — {s.format} — {s.file}
            </option>
          ))}
        </NativeSelect>
      </Toolbar>
    ) : null;

  const railBody =
    tab === "Duplicates" && activeGroup ? (
      <DedupRail group={activeGroup} nodeName={nodeName} />
    ) : scan ? (
      <ScanRail
        scan={scan}
        batch={batch}
        supersededBy={supersededBy.get(scan.id) ?? null}
        nodeName={nodeName}
      />
    ) : null;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId: program.id }}
            id={program.id}
            title={`${program.name} — automated ingestion`}
            meta={`${scans.length} delivered runs · ${current.length} current · ${new Set(scans.map((s) => s.format)).size} formats`}
            actions={
              <>
                <Badge tone={heldAcrossProgram > 0 ? "warning" : "success"}>
                  {heldAcrossProgram} held for analyst
                </Badge>
                <Link
                  to="/programs/$programId/composition"
                  params={{ programId: program.id }}
                  className="text-[12.5px] text-primary hover:underline"
                >
                  Composition
                </Link>
              </>
            }
          />
        }
        tabs={
          <Tabs
            items={ingestionTabs.map((key) => ({
              key,
              label: key,
              active: tab === key,
              onSelect: () => go(key),
              trailing: counts[key] ? (
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {counts[key]}
                </span>
              ) : null,
            }))}
          />
        }
        showRail={tab !== "Normalization" && railBody !== null}
        rail={railBody}
      >
        {!scan ? (
          <Section
            title="Automated ingestion"
            description="No scanner output has been delivered against this program."
          >
            <div className="pt-4">
              <Empty
                title="Nothing ingested"
                description={`${program.id} has no delivered checklists, SCAP results, ACAS exports, SAST reports, SBOMs or firmware reports. Ingestion begins when a run is filed against a component in the composition.`}
              />
            </div>
          </Section>
        ) : null}

        {scan && tab === "Scans" ? (
          <Section
            title="Delivered runs"
            description={`${scans.length} runs across ${new Set(scans.map((s) => s.format)).size} formats. ${current.length} are the current picture; the other ${scans.length - current.length} have been superseded by a later run against the same target and format. Select a run to load it into the rail.`}
          >
            <ScanTable
              scans={scans}
              selected={scan.id}
              onSelect={selectScan}
              supersededBy={supersededBy}
              nodeName={nodeName}
            />
          </Section>
        ) : null}

        {scan && batch && tab === "Normalization" ? (
          <>
            {picker}
            <Section
              title="Batch"
              description={`What ${scan.tool} delivered, and what the pipeline made of it. A clean row still normalizes — it is evidence of coverage — but it never becomes a proposed finding.`}
            >
              <IngestSummary batch={batch} scan={scan} />
            </Section>

            <Section
              title="Native record against normalized record"
              description="Select a result to audit it end to end. The left panel is the tool's own record, untouched; the right panel is what the normalizer produced; the block underneath is why."
            >
              <div className="pt-4">
                <NormalizationView
                  rows={rows}
                  selected={resultId}
                  onSelect={setResultId}
                  scan={scan}
                  nodeName={nodeName}
                />
              </div>
            </Section>
          </>
        ) : null}

        {scan && batch && tab === "Duplicates" ? (
          <>
            {picker}
            <Section
              title="Deduplication"
              description={`${scan.id} is reconciled against the program's ${selectedIsCurrent ? `other ${otherCurrent}` : otherCurrent} current runs, not against itself alone — a condition reported by a checklist and by a network scanner arrives as two runs, not as two weaknesses.${selectedIsCurrent ? "" : ` ${scan.id} is not one of them: it has been superseded by ${supersededBy.get(scan.id) ?? "a later run"}.`} ${crossSource} of ${groups.length} ${groups.length === 1 ? "group" : "groups"} ${crossSource === 1 ? "has" : "have"} more than one source${sameToolFolds > 0 ? `; ${sameToolFolds} more fold${sameToolFolds === 1 ? "s" : ""} in an earlier run of the same tool` : ""}.`}
            >
              <DedupTable
                groups={groups}
                selected={activeGroup?.key ?? null}
                onSelect={setGroupKey}
                nodeName={nodeName}
              />
            </Section>

            <Section
              title="Source authority"
              description="Which source wins when two of them describe the same condition. A benchmark checklist is the authoritative statement about a configuration setting; a network scanner inferring the same thing from the outside is corroboration, not a second weakness."
            >
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-4">
                {sourceAuthority.map((format, i) => (
                  <li key={format} className="flex items-center gap-2">
                    {i > 0 ? <span className="text-[12px] text-muted-foreground">&gt;</span> : null}
                    <span
                      className={presentFormats.has(format) ? "opacity-100" : "opacity-45"}
                      title={
                        presentFormats.has(format)
                          ? `Rank ${i + 1} of ${sourceAuthority.length} — present in this batch`
                          : `Rank ${i + 1} of ${sourceAuthority.length} — no result in this batch`
                      }
                    >
                      <FormatChip format={format} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                Highest authority first; the formats greyed out contributed no result to this batch.
                Ties inside one format break on the later run&rsquo;s completion time. The rail
                states, for the selected group, exactly which rule fired and what it beat.
              </p>
            </Section>
          </>
        ) : null}

        {scan && batch && tab === "Scan over scan" ? (
          <>
            {picker}
            <Section
              title={
                scan.supersedes
                  ? `${scan.id} against ${scan.supersedes}`
                  : `${scan.id} — first run of record`
              }
              description={
                scan.supersedes
                  ? "Non-clean groups compared key for key. A condition present in the run before last and absent from the one in between has reappeared, which is a different fact from a condition that is merely persistent."
                  : "This run supersedes nothing, so every condition it reports is new by definition."
              }
            >
              <ScanDiffTable
                rows={batch.diff}
                current={scan.id}
                previous={scan.supersedes}
                nodeName={nodeName}
              />
            </Section>
          </>
        ) : null}
      </ShowPage>
    </Shell>
  );
}
