import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  BuildRail,
  BuildTable,
  ChangeRail,
  ChangeTable,
  ImpactView,
  ParameterTable,
  PinDiffTable,
  RetestQueueTable,
  RetestSummary,
  UnrecordedChangeNotice,
} from "@/components/app/baselines";
import {
  Badge,
  Box,
  Breadcrumb,
  Empty,
  Grid,
  Inline,
  NativeSelect,
  Panel,
  RecordHeader,
  Section,
  Shell as DsShell,
  ShowPage,
  Stack,
  Tabs,
  TextLink,
  Toolbar,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import {
  acknowledgeChange,
  authorizedBuild,
  buildDiff,
  candidateBuild,
  unacknowledgeChange,
  useBaselines,
  type ChangeImpact,
} from "@/lib/baselines";
import { impactOf, retestQueue, setControlTextIndex } from "@/lib/change-impact";
import { useCompositionGraph } from "@/lib/composition";
import { programs } from "@/lib/grc-data";
import { buildControlTextIndex } from "@/lib/sctm";

const baselineTabs = ["Builds", "Changes", "Impact", "Retest queue"] as const;
type BaselineTab = (typeof baselineTabs)[number];

export const Route = createFileRoute("/programs/$programId_/baseline")({
  // The router MERGES the validated object over the raw parsed search rather
  // than replacing it, so omitting `tab` on a miss would leave `?tab=Bogus`
  // intact and the `?? "Builds"` fallback below would never fire — the page
  // would render with no active tab and an empty body. Emitting the key
  // explicitly, as `undefined`, is what deletes it, and `encode()` drops
  // undefined values so nothing leaks back into the URL. The `| undefined` in
  // the return type is load-bearing: `exactOptionalPropertyTypes` is on, so a
  // bare `tab?: BaselineTab` rejects the explicit undefined (TS2375). It stays
  // OPTIONAL rather than widening to a required `tab:` so that linking to this
  // route does not demand a `search`.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: BaselineTab | undefined; change?: string; build?: string } => {
    const raw = String(search["tab"] ?? "");
    const match = baselineTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    const change = search["change"];
    const selectedChange = typeof change === "string" && /^CHG-\d+$/.test(change) ? change : null;
    const build = search["build"];
    const selectedBuild = typeof build === "string" && /^BLD-\d+$/.test(build) ? build : null;
    return {
      tab: match,
      ...(selectedChange ? { change: selectedChange } : {}),
      ...(selectedBuild ? { build: selectedBuild } : {}),
    };
  },
  // The impact analysis names the rows it invalidates by `SctmRow.key`, and a
  // key is only useful if it resolves against the matrix the assessor reads —
  // which rows per leaf 800-53A objective, not per control. That granularity
  // only exists once the 1.25 MB catalog has been dynamic-imported, so the
  // loader does the importing and hands `change-impact.ts` the narrowed index.
  // The index is NOT returned: loader data is serialised into the SSR document
  // on every request, and this page renders none of the text.
  // The index above lives in module state and is never serialised, so the page renders only on
  // the client, where the loader runs before the first render. Rendered on the server, the client
  // would hydrate without the index and count per control instead of per objective.
  ssr: false,
  loader: async ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    const { controlText } = await import("@/lib/nist-control-text");
    setControlTextIndex(buildControlTextIndex(controlText));
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} baseline — Equinox` },
      {
        name: "description",
        content: `Configuration baselines and change-triggered invalidation for ${loaderData?.id ?? "the program"}: what is pinned, what moved, what the CM-3(2) security impact analysis said about it, and which determinations stopped being true as a result.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} baseline — Equinox` },
      {
        property: "og:description",
        content:
          "A determination is only ever true of a configuration. This page holds the pin, the proposal to move it, and the analysis that decides whether the move costs anything.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramBaseline,
});

function ProgramBaseline() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Builds";
  const navigate = useNavigate({ from: Route.fullPath });

  const nodes = useCompositionGraph(program.id);
  const nodeName = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [nodes]);

  // `useBaselines` subscribes to both the acknowledgement store and the graph,
  // so acknowledging a change re-renders this page and every derived count
  // below moves with it.
  const { builds, changes } = useBaselines(program.id);

  const authorized = authorizedBuild(program.id);
  const candidate = candidateBuild(program.id);
  const diff = useMemo(
    () => (authorized && candidate ? buildDiff(authorized.id, candidate.id) : []),
    [authorized, candidate],
  );
  const unrecorded = useMemo(() => diff.filter((d) => d.recorded === null), [diff]);

  // Every change, acknowledged or not — the Changes tab has to be able to show
  // what an acknowledged change would have done. `impactOf` is memoized inside
  // the module against the graph and acknowledgement versions, so this is a map
  // lookup after the first render.
  const impacts = useMemo(() => {
    const map = new Map<string, ChangeImpact>();
    for (const change of changes) {
      const impact = impactOf(change.id);
      if (impact) map.set(change.id, impact);
    }
    return map;
  }, [changes]);

  // LIVE basis — what is currently suppressing determinations. Acknowledging a
  // significant change removes its rows from the overlay and the re-test queue,
  // so these are the counts that describe the matrix as it stands.
  const live = changes.filter((c) => !c.acknowledged);
  const cascaded = live.filter((c) => impacts.get(c.id)?.contained === false);
  const invalidatedRows = new Set(
    cascaded.flatMap((c) => impacts.get(c.id)?.invalidatedRows ?? []),
  );
  // A row invalidated by one cascaded change can be merely suspect under
  // another; `rowCurrency` resolves that to Invalidated. Subtracting here is
  // what stops the two figures double-counting the overlap and reporting more
  // affected rows than the matrix has.
  const suspectRows = new Set(
    cascaded
      .flatMap((c) => impacts.get(c.id)?.suspectRows ?? [])
      .filter((key) => !invalidatedRows.has(key)),
  );
  // Of the invalidated rows, the ones whose determination the matrix actually
  // withdrew. A deficiency is invalidated and re-tested but never re-scored to
  // "Not assessed" — that would sever the POA&M obligation — so "withdrawn" is
  // strictly smaller than "invalidated" and the two must not be printed as one.
  const withdrawnRows = new Set(
    cascaded.flatMap((c) =>
      (impacts.get(c.id)?.records ?? [])
        .filter(
          (r) => r.scope === "SCTM row" && r.to === "Invalidated" && r.toDetermination !== r.from,
        )
        .map((r) => r.ref),
    ),
  );
  const retainedRows = invalidatedRows.size - withdrawnRows.size;

  // VERDICT basis — how the CM-3(2) gate ruled on each change. Containedness is
  // a property of the analysis, not of whether the operator has since
  // acknowledged it (acknowledging a contained change suppresses nothing), so
  // these two partition `changes` and their sum is `changes.length`.
  const containedAll = changes.filter((c) => impacts.get(c.id)?.contained === true);
  const cascadedAll = changes.filter((c) => impacts.get(c.id)?.contained === false);

  const retests = retestQueue(program.id);

  const fallbackChange =
    changes.find((c) => c.impact === "Significant" && !c.acknowledged)?.id ??
    changes[0]?.id ??
    null;
  const requested = search.change ?? null;
  const changeId =
    requested && changes.some((c) => c.id === requested) ? requested : fallbackChange;
  const change = changeId ? (changes.find((c) => c.id === changeId) ?? null) : null;
  const impact = changeId ? (impacts.get(changeId) ?? null) : null;

  // The candidate is the build being argued about, so it is what the page
  // opens on; the authorized baseline is one click away and the parameter
  // table below is what makes the AC-11 ODP movement legible.
  const fallbackBuild = candidate ?? authorized ?? builds[0] ?? null;
  const requestedBuild = search.build ?? null;
  const selectedBuild =
    (requestedBuild ? (builds.find((b) => b.id === requestedBuild) ?? null) : null) ??
    fallbackBuild;

  const go = (next: BaselineTab) => navigate({ search: { ...search, tab: next }, replace: true });
  const selectChange = (next: string) =>
    navigate({ search: { ...search, change: next }, replace: true });
  const selectBuild = (next: string) =>
    navigate({ search: { ...search, build: next }, replace: true });
  const openImpact = (next: string) =>
    navigate({ search: { ...search, change: next, tab: "Impact" }, replace: true });

  const setAck = (id: string, next: boolean) => {
    if (next) acknowledgeChange(id);
    else unacknowledgeChange(id);
  };

  const counts: Record<BaselineTab, number | null> = {
    Builds: builds.length,
    Changes: changes.length,
    Impact: cascaded.length,
    "Retest queue": retests.length,
  };

  const railBody =
    tab === "Changes" && change ? (
      <ChangeRail
        change={change}
        impact={impact}
        onAcknowledge={setAck}
        onOpenImpact={openImpact}
      />
    ) : tab === "Builds" && selectedBuild ? (
      <BuildRail build={selectedBuild} deltas={diff.length} unrecorded={unrecorded.length} />
    ) : null;

  const picker =
    tab === "Impact" && change ? (
      <Toolbar
        actions={
          <span className="tabular-nums font-body-small text-subtle">
            {containedAll.length} contained · {cascadedAll.length} cascaded · {changes.length}{" "}
            recorded
          </span>
        }
      >
        <span className="font-body-small text-subtle">Change</span>
        <NativeSelect
          value={change.id}
          onChange={(e) => selectChange(e.target.value)}
          aria-label="Change record"
          className="h-control-small font-body"
          style={{ width: 520 }}
        >
          {changes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.kind} — {c.subject} — {c.impact}
              {impacts.get(c.id)?.contained ? " (contained)" : " (cascaded)"}
              {c.acknowledged ? " · acknowledged" : ""}
            </option>
          ))}
        </NativeSelect>
      </Toolbar>
    ) : null;

  return (
    <Shell>
      <>
        <ShowPage
          header={
            <RecordHeader
              back={<Link to="/programs/$programId" params={{ programId: program.id }} />}
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
                  <Breadcrumb.Item isCurrent>{"Configuration baseline"}</Breadcrumb.Item>
                </Breadcrumb>
              }
              id={program.id}
              title={`${program.name} — configuration baseline`}
              meta={`${builds.length} builds · ${changes.length} change records · ${diff.length} pins moved · ${retests.length} re-tests owed`}
              actions={
                <>
                  {unrecorded.length > 0 ? (
                    <Badge tone="danger">
                      {unrecorded.length} unrecorded change{unrecorded.length === 1 ? "" : "s"}
                    </Badge>
                  ) : (
                    <Badge tone="success">Every movement recorded</Badge>
                  )}
                  <Badge tone={invalidatedRows.size > 0 ? "warning" : "success"}>
                    {invalidatedRows.size} rows invalidated
                  </Badge>
                  <TextLink size="small">
                    <Link to="/programs/$programId/sctm" params={{ programId: program.id }}>
                      SCTM
                    </Link>
                  </TextLink>
                </>
              }
            />
          }
          tabs={
            <Tabs>
              {baselineTabs.map((key) => (
                <Tabs.Tab
                  key={key}
                  isSelected={tab === key}
                  onClick={() => go(key)}
                  count={counts[key] || null}
                >
                  {key}
                </Tabs.Tab>
              ))}
            </Tabs>
          }
        >
          {tab === "Builds" ? (
            <>
              <Section
                title="Configuration baselines"
                description={`A determination is only ever true of a configuration. ${
                  authorized
                    ? `${authorized.id} is what ${program.id} is authorized to operate; ${
                        candidate
                          ? `${candidate.id} is what it is working toward.`
                          : "no candidate is under test."
                      }`
                    : "No build is authorized, so nothing this program claims can be tied to a known configuration."
                } Every node in the composition is pinned in both, because a baseline that pins only the interesting parts cannot prove the rest did not move.`}
              >
                <BuildTable
                  builds={builds}
                  selected={selectedBuild?.id ?? null}
                  onSelect={selectBuild}
                />
              </Section>

              {authorized && candidate ? (
                <Section
                  title={`${authorized.id} against ${candidate.id}`}
                  description={`${diff.length} pins differ between the authorized baseline and the candidate. The diff is mechanical — it compares versions, digests and part numbers and makes no judgement about any of them. What the movement costs is decided one column to the right, by the change record.`}
                  action={
                    <span className="tabular-nums font-body-small text-subtle">
                      {diff.length - unrecorded.length} recorded · {unrecorded.length} not
                    </span>
                  }
                >
                  <Stack className="pt-200" space="space.200">
                    <UnrecordedChangeNotice
                      rows={unrecorded}
                      from={authorized.id}
                      to={candidate.id}
                      nodeName={nodeName}
                    />
                    <PinDiffTable rows={diff} nodeName={nodeName} />
                  </Stack>
                </Section>
              ) : (
                <Section
                  title="Baseline comparison"
                  description="A diff needs an authorized baseline and a candidate. This program has only one of them."
                >
                  <Box paddingBlockStart="space.200">
                    <Empty
                      title="Nothing to compare"
                      description={`${program.id} has no pair of an authorized baseline and a build under test, so there is no movement to analyse.`}
                    />
                  </Box>
                </Section>
              )}

              {selectedBuild ? (
                <Section
                  title={`Parameters in force — ${selectedBuild.id}`}
                  description="The organization-defined parameter values this build fixes. An ODP is a property of the requirement rather than of any one component, which is why moving one invalidates its whole row set wherever the graph allocated it."
                >
                  <ParameterTable parameters={selectedBuild.parameters} />
                </Section>
              ) : null}
            </>
          ) : null}

          {tab === "Changes" ? (
            <>
              <Section
                title="Change records"
                description={`${changes.length} changes proposed against this program's baselines, each carrying a written CM-3(2) security impact analysis. ${containedAll.length} were analysed and contained; ${cascadedAll.length} were found significant and cascaded. The contained ones are not the boring rows — they are the ones that prove the gate is doing work.`}
                action={
                  <span className="tabular-nums font-body-small text-subtle">
                    {changes.length - live.length} acknowledged
                  </span>
                }
              >
                <ChangeTable
                  changes={changes}
                  impacts={impacts}
                  selected={change?.id ?? null}
                  onSelect={selectChange}
                  nodeName={nodeName}
                />
              </Section>

              <Section
                title="What the gate decided"
                description="CM-3(2) requires a security impact analysis before a change is implemented. It is a gate, not a formality: an analysis that finds no impact is a result the ISSE signs for, and it is the reason a firmware dot-release does not turn a hundred requirement rows amber."
              >
                <Grid
                  className="pt-200"
                  gap="space.150"
                  templateColumns={{ sm: "repeat(2, minmax(0, 1fr))" }}
                >
                  <Box
                    className="rounded-large border border-default bg-surface-sunken"
                    paddingInline="space.200"
                    paddingBlock="space.150"
                  >
                    <Inline space="space.100" alignBlock="baseline">
                      <span className="tabular-nums font-heading-small font-semibold">
                        {containedAll.length}
                      </span>
                      <span className="font-body-small font-medium">contained</span>
                    </Inline>
                    <p className="pt-075 font-body-small text-subtle">
                      Analysed as no impact or administrative. Nothing was invalidated, no evidence
                      was superseded and no re-test is owed — and the written reason for each is on
                      the record, where a package reviewer can argue with it.
                    </p>
                  </Box>
                  <Box
                    className="rounded-large border border-warning-subtle bg-warning"
                    paddingInline="space.200"
                    paddingBlock="space.150"
                  >
                    <Inline space="space.100" alignBlock="baseline">
                      <span className="tabular-nums font-heading-small font-semibold text-warning">
                        {cascadedAll.length}
                      </span>
                      <span className="font-body-small font-medium">cascaded</span>
                    </Inline>
                    <p className="pt-075 font-body-small text-subtle">
                      Analysed as significant. The {cascaded.length} still live invalidate{" "}
                      {invalidatedRows.size} requirement rows — {withdrawnRows.size} determinations
                      withdrawn outright and {retainedRows} deficiencies and scoping decisions left
                      standing with a re-test owed — and flag {suspectRows.size} further rows for
                      the assessor, across {retests.length} re-tests. Significant is caution, not
                      failure: a program that never records one is not doing impact analysis.
                    </p>
                  </Box>
                </Grid>
              </Section>
            </>
          ) : null}

          {tab === "Impact" ? (
            <>
              {picker}
              {change ? (
                <ImpactView
                  change={change}
                  impact={impact}
                  nodeName={nodeName}
                  onAcknowledge={setAck}
                />
              ) : (
                <Section
                  title="Change impact"
                  description="Nothing has been proposed against this program's baseline."
                >
                  <Box paddingBlockStart="space.200">
                    <Empty
                      title="No change to analyse"
                      description={`${program.id} carries no change records, so there is no security impact analysis to read and nothing for the cascade to act on.`}
                    />
                  </Box>
                </Section>
              )}
            </>
          ) : null}

          {tab === "Retest queue" ? (
            <>
              <Section
                title="Re-test queue"
                description={`Everything the ${cascaded.length} live significant change${
                  cascaded.length === 1 ? "" : "s"
                } put back on the assessor, de-duplicated to distinct requirement, component and method. Acknowledging a change removes its rows from here; it is the operator saying the work was done, and it fabricates no evidence.`}
              >
                <Box paddingBlockStart="space.200">
                  <RetestSummary items={retests} />
                </Box>
              </Section>

              <Section
                title="Work outstanding"
                description="Each row names the requirement, the component it is allocated to, how it has to be verified, and the procedure that can execute it where the campaign model knows one. Rows with no procedure are done by hand."
              >
                <RetestQueueTable items={retests} nodeName={nodeName} />
              </Section>
            </>
          ) : null}
        </ShowPage>
        {railBody !== null ? (
          <DsShell.Panel label="Details">
            <DsShell.Panel.Splitter label="Resize details" />
            <Panel flush>{railBody}</Panel>
          </DsShell.Panel>
        ) : null}
      </>
    </Shell>
  );
}
