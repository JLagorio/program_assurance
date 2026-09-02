import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { Shell } from "@/components/app/shell";
import {
  AttackChain,
  AttackSurfaceSummary,
  CriteriaTable,
  MissionEffectTable,
  PhaseReadinessSummary,
  PhaseStateChip,
  PhaseTrack,
  ScenarioTable,
  TierChip,
  type ChainHop,
  type ChainNode,
} from "@/components/app/te-phases";
import {
  Badge,
  EmptyState,
  KeyValue,
  RecordHeader,
  Section,
  Select,
  ShowPage,
  Table,
  Toolbar,
  Id,
  Tabs,
} from "@/components/app/ui";
import { useBaselines } from "@/lib/baselines";
import { campaignById } from "@/lib/campaigns";
import {
  childrenOf,
  crossesBoundary,
  edgesFrom,
  nodeById,
  trustRank,
  useCompositionGraph,
} from "@/lib/composition";
import { programs } from "@/lib/grc-data";
import { statusTone } from "@/lib/spine";
import { Inspector } from "@/components/app/shapes";
import {
  attackSurfaceCoverage,
  criteria as allCriteria,
  effectsForScenario,
  missionEffects,
  phaseById,
  phaseReadiness,
  phasesForProgram,
  scenarioById,
  scenariosForProgram,
  tePhaseIds,
  unwalkableSteps,
  type CriterionResult,
  type PhaseReadiness,
  type TePhase,
  type TePhaseId,
} from "@/lib/te-phases";

const teTabs = ["Phases", "Gate readiness", "Threat scenarios", "Mission effects"] as const;
type TeTab = (typeof teTabs)[number];

/** The dataset clock. A render path never calls `new Date()`. */
const asOf = "Aug 30, 2026";

function isPhaseId(value: string): value is TePhaseId {
  return (tePhaseIds as readonly string[]).includes(value);
}

/**
 * Resolves a scenario's ordered `CN-` path against the live graph. A node the
 * graph does not carry is returned as `missing` rather than dropped — a path
 * with a hole in it is a defect the reader has to see, not one to tidy away.
 */
function chainNodes(path: string[]): ChainNode[] {
  return path.map((id) => {
    const node = nodeById.get(id);
    if (!node) {
      return { id, name: "—", kind: "—", zone: "—", criticality: "—", missing: true };
    }
    return {
      id,
      name: node.name,
      kind: node.kind,
      zone: node.zone,
      criticality: node.criticality,
      missing: false,
    };
  });
}

/**
 * How the adversary actually gets from each node to the next: over a
 * reachability edge in the direction of travel, or down a containment link into
 * what a component is made of. Anything else is an unwalkable step, and it is
 * labelled as one rather than drawn as a line.
 */
function chainHops(path: string[]): ChainHop[] {
  const out: ChainHop[] = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    if (!from || !to) continue;

    const edge = edgesFrom(from).find((e) => e.to === to);
    if (edge) {
      out.push({
        from,
        to,
        via: "Edge",
        kind: edge.kind,
        label: edge.via,
        critical: edge.critical,
        crossesBoundary: crossesBoundary(edge),
      });
      continue;
    }

    const contained = childrenOf(from).some((c) => c.id === to);
    if (contained) {
      const parent = nodeById.get(from);
      const child = nodeById.get(to);
      out.push({
        from,
        to,
        via: "Containment",
        kind: "Contains",
        label: child && parent ? `${child.name} is a part of ${parent.name}` : "—",
        critical: false,
        crossesBoundary: parent && child ? trustRank(parent.zone) !== trustRank(child.zone) : false,
      });
      continue;
    }

    out.push({
      from,
      to,
      via: "Unwalkable",
      kind: "—",
      label: "—",
      critical: false,
      crossesBoundary: false,
    });
  }
  return out;
}

export const Route = createFileRoute("/programs/$programId_/te-phases")({
  // The router MERGES the validated object over the raw parsed search rather
  // than replacing it, so omitting `tab` on a miss would leave `?tab=Bogus`
  // intact and the `?? "Phases"` fallback below would never fire — the page
  // would render with no active tab and an empty body. Emitting the key
  // explicitly, as `undefined`, is what deletes it, and `encode()` drops
  // undefined values so nothing leaks back into the URL. The `| undefined` in
  // the return type is load-bearing: `exactOptionalPropertyTypes` is on, so a
  // bare `tab?: TeTab` rejects the explicit undefined (TS2375). It stays
  // OPTIONAL rather than widening to a required `tab:` so that linking to this
  // route does not demand a `search`.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: TeTab | undefined; phase?: TePhaseId; scenario?: string } => {
    const raw = String(search["tab"] ?? "");
    const match = teTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    const phase = search["phase"];
    const selectedPhase = typeof phase === "string" && isPhaseId(phase) ? phase : null;
    const scenario = search["scenario"];
    const selectedScenario =
      typeof scenario === "string" && /^THR-\d+$/.test(scenario) ? scenario : null;
    return {
      tab: match,
      ...(selectedPhase ? { phase: selectedPhase } : {}),
      ...(selectedScenario ? { scenario: selectedScenario } : {}),
    };
  },
  // Synchronous by design. Every derived criterion on this page is computed
  // from the SCTM skeleton — `buildSctm(program, matrix, null)` — so the 1.25 MB
  // 800-53A catalog is never needed here and is deliberately not imported.
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} cyber T&E — Equinox` },
      {
        name: "description",
        content: `The six-phase cyber test and evaluation model for ${loaderData?.id ?? "the program"}: the developmental and operational phases, entry and exit criteria computed live from the record, the threat scenarios walked through the composition graph, and the mission effects an adversarial assessment actually produced.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} cyber T&E — Equinox` },
      {
        property: "og:description",
        content:
          "A phase gate that is a checkbox is worthless. Every criterion here shows its arithmetic or its signature, and an adversarial assessment is scored in mission effect, not in findings count.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramTePhases,
});

function ProgramTePhases() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Phases";
  const navigate = useNavigate({ from: Route.fullPath });

  // Two subscriptions, both load-bearing. PH-6's entry criterion reads the
  // unacknowledged Significant changes and its second exit criterion reads
  // `nodeImpact` over the executed scenario paths, so acknowledging a change on
  // the baseline page has to move this gate too. The graph subscription does
  // the same for a node reclassification.
  const { changes } = useBaselines(program.id);
  const nodes = useCompositionGraph(program.id);

  const phases = useMemo(() => phasesForProgram(program.id), [program.id]);
  const scenarios = useMemo(() => scenariosForProgram(program.id), [program.id]);

  const readiness = useMemo(() => {
    const map = new Map<TePhaseId, PhaseReadiness>();
    for (const phase of phases) map.set(phase.id, phaseReadiness(phase.id, program.id, asOf));
    return map;
    // `changes` and `nodes` are here because the derivations read them, not
    // because this loop does.
  }, [phases, program.id, changes, nodes]);

  const effects = useMemo(
    () => missionEffects.filter((e) => scenarios.some((s) => s.id === e.scenario)),
    [scenarios],
  );

  const coverage = useMemo(() => attackSurfaceCoverage(program.id), [program.id, nodes]);

  // The live gate: the phase actually in flight is what a reader opens this
  // page for. Falling back to the first phase would open on a 2025 record.
  const liveGate =
    phases.find((p) => p.state === "Executing") ??
    phases.find((p) => p.state === "Planning") ??
    phases.find((p) => p.state === "Reporting") ??
    phases[phases.length - 1] ??
    null;

  const requestedPhase = search.phase ?? null;
  const selectedPhase: TePhase | null =
    (requestedPhase ? (phases.find((p) => p.id === requestedPhase) ?? null) : null) ?? liveGate;
  const selectedReadiness = selectedPhase ? (readiness.get(selectedPhase.id) ?? null) : null;
  const phaseCriteria = useMemo(
    () => (selectedPhase ? allCriteria.filter((c) => c.phase === selectedPhase.id) : []),
    [selectedPhase],
  );
  const criterionResults = useMemo(() => {
    const map = new Map<string, CriterionResult>();
    if (!selectedPhase) return map;
    for (const result of [
      ...(selectedReadiness?.entry ?? []),
      ...(selectedReadiness?.exit ?? []),
    ]) {
      map.set(result.criterion, result);
    }
    return map;
  }, [selectedPhase, selectedReadiness]);

  const requestedScenario = search.scenario ?? null;
  const selectedScenario =
    (requestedScenario ? (scenarios.find((s) => s.id === requestedScenario) ?? null) : null) ??
    scenarios.find((s) => s.status === "Executed") ??
    scenarios[0] ??
    null;

  const scenarioPath = useMemo(
    () => (selectedScenario ? chainNodes(selectedScenario.path) : []),
    [selectedScenario, nodes],
  );
  const scenarioHops = useMemo(
    () => (selectedScenario ? chainHops(selectedScenario.path) : []),
    [selectedScenario, nodes],
  );
  const scenarioEffects = useMemo(
    () => (selectedScenario ? effectsForScenario(selectedScenario.id) : []),
    [selectedScenario],
  );

  const campaignName = (id: string) => campaignById.get(id)?.name ?? id;
  const phaseShort = (id: TePhaseId) => phaseById.get(id)?.short ?? id;
  const scenarioName = (id: string) => scenarioById.get(id)?.name ?? id;

  const go = (next: TeTab) => navigate({ search: { ...search, tab: next }, replace: true });
  const selectPhase = (next: TePhaseId) =>
    navigate({ search: { ...search, phase: next }, replace: true });
  const openGate = (next: TePhaseId) =>
    navigate({ search: { ...search, phase: next, tab: "Gate readiness" }, replace: true });
  const selectScenario = (next: string) =>
    navigate({ search: { ...search, scenario: next }, replace: true });

  // Program-wide gate arithmetic, stated once so the header and the doctrine
  // block below cannot drift from each other.
  const programCriteria = useMemo(
    () => allCriteria.filter((c) => phases.some((p) => p.id === c.phase)),
    [phases],
  );
  const derivedCount = programCriteria.filter((c) => c.basis === "Derived").length;
  const attestedCount = programCriteria.length - derivedCount;
  const unsignedCount = programCriteria.filter(
    (c) => c.basis === "Attested" && (c.attestedBy === "—" || c.attestedOn === "—"),
  ).length;
  const blockedPhases = phases.filter((p) => readiness.get(p.id)?.blocker !== "—").length;
  const brokenPaths = useMemo(
    () => scenarios.filter((s) => unwalkableSteps(s.id).length > 0).length,
    [scenarios, nodes],
  );

  // Each tab's count is the number of rows that tab can show, so the badges
  // stay comparable. How many phases are blocked is a verdict, not a row count,
  // and it belongs in the header badge rather than on a tab.
  const counts: Record<TeTab, number | null> = {
    Phases: phases.length,
    "Gate readiness": programCriteria.length,
    "Threat scenarios": scenarios.length,
    "Mission effects": effects.length,
  };

  const railBody =
    tab === "Phases" && selectedPhase ? (
      <PhaseRail
        phase={selectedPhase}
        readiness={readiness.get(selectedPhase.id) ?? null}
        campaignName={campaignName}
        scenarioCount={scenarios.filter((s) => s.phase === selectedPhase.id).length}
        onOpenGate={() => openGate(selectedPhase.id)}
      />
    ) : tab === "Threat scenarios" && selectedScenario ? (
      <Inspector.Group title="Scenario">
        <KeyValue label="Scenario">
          <Id>{selectedScenario.id}</Id>
        </KeyValue>
        <KeyValue label="Phase">
          {phaseShort(selectedScenario.phase)} · {selectedScenario.phase}
        </KeyValue>
        <KeyValue label="Regime">{phaseById.get(selectedScenario.phase)?.kind ?? "—"}</KeyValue>
        <KeyValue label="Tier">
          <TierChip tier={selectedScenario.tier} />
        </KeyValue>
        <KeyValue label="Entry point">
          <Id>{selectedScenario.entryPoint}</Id>
        </KeyValue>
        <KeyValue label="Mission">{selectedScenario.missionFunction}</KeyValue>
        <KeyValue label="Event">
          {selectedScenario.event ? (
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: selectedScenario.event }}
              className="text-primary hover:underline"
            >
              <Id className="text-primary">{selectedScenario.event}</Id>
            </Link>
          ) : (
            "—"
          )}
        </KeyValue>
        <KeyValue label="Techniques">
          <span className="tnum">{selectedScenario.chain.length}</span>
        </KeyValue>
        <KeyValue label="Path">
          <span className="tnum">{selectedScenario.path.length} nodes</span>
        </KeyValue>
        <KeyValue label="Effects">
          <span className="tnum">{scenarioEffects.length}</span>
        </KeyValue>
      </Inspector.Group>
    ) : null;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId: program.id }}
            id={program.id}
            title={`${program.name} — cyber test & evaluation`}
            meta={`${phases.length} phases · ${programCriteria.length} gate criteria · ${scenarios.length} threat scenarios · ${effects.length} mission effects`}
            actions={
              <>
                {/* A program with no phase record has neither a clean gate nor a
                    dirty one, and claiming "no phase blocked" over an empty
                    record would be the laundering this page exists to avoid. */}
                {phases.length === 0 ? (
                  <Badge>No cyber T&amp;E record</Badge>
                ) : (
                  <>
                    <Badge tone={blockedPhases > 0 ? "warning" : "success"}>
                      {blockedPhases === 0
                        ? "No phase blocked"
                        : `${blockedPhases} phase${blockedPhases === 1 ? "" : "s"} blocked`}
                    </Badge>
                    <Badge tone={unsignedCount > 0 ? "danger" : "success"}>
                      {unsignedCount === 0
                        ? "Every attestation signed"
                        : `${unsignedCount} unsigned attestation${unsignedCount === 1 ? "" : "s"}`}
                    </Badge>
                  </>
                )}
                <Link
                  to="/programs/$programId/composition"
                  params={{ programId: program.id }}
                  className="text-[12.5px] text-primary hover:underline"
                >
                  Composition
                </Link>
                <Link
                  to="/programs/$programId/baseline"
                  params={{ programId: program.id }}
                  className="text-[12.5px] text-primary hover:underline"
                >
                  Baseline
                </Link>
              </>
            }
          />
        }
        tabs={
          <Tabs
            items={teTabs.map((key) => ({
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
        showRail={railBody !== null}
        rail={railBody}
      >
        {tab === "Phases" ? (
          <>
            <Section
              title="The six-phase model"
              description="The DoD Cybersecurity Test and Evaluation Guidebook defines six phases, not three. All six are carried here so the model is not wrong about its own shape, and each one names the lifecycle gate it informs. Selecting a phase opens its record in the rail; its gate is one click away."
              action={
                <span className="tnum text-[12px] text-muted-foreground">
                  {phases.filter((p) => p.state === "Complete").length} complete ·{" "}
                  {phases.filter((p) => p.kind === "Developmental").length} developmental ·{" "}
                  {phases.filter((p) => p.kind === "Operational").length} operational
                </span>
              }
            >
              {phases.length === 0 ? (
                <div className="pt-4">
                  <EmptyState
                    title="No cyber T&E phases recorded"
                    description={`${program.id} carries no phase record, so there is no gate to judge and no threat portrayal to execute against.`}
                  />
                </div>
              ) : (
                <PhaseTrack
                  phases={phases}
                  readiness={readiness}
                  selected={selectedPhase?.id ?? null}
                  onSelect={selectPhase}
                  campaignName={campaignName}
                />
              )}
            </Section>

            {phases.length === 0 ? null : (
              <Section
                title="What each phase is executing"
                description="A phase is a doctrine; a campaign is the work. Two phases carry no campaign at all — they produce the requirement matrix and the attack-surface picture every later phase is judged against, and recording an empty execution against them would be a fiction."
              >
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "72px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "124px" }} />
                    <col />
                    <col style={{ width: "168px" }} />
                    <col style={{ width: "116px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Table.Header>Phase</Table.Header>
                      <Table.Header>Regime</Table.Header>
                      <Table.Header>Campaign</Table.Header>
                      <Table.Header>Scope</Table.Header>
                      <Table.Header>Campaign lead</Table.Header>
                      <Table.Header>Campaign state</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {phases.flatMap((phase) =>
                      phase.campaigns.length === 0
                        ? [
                            <Table.Row key={phase.id}>
                              <Table.Cell>
                                <Id>{phase.id}</Id>
                              </Table.Cell>
                              <Table.Cell>{phase.kind}</Table.Cell>
                              <Table.Cell>—</Table.Cell>
                              <Table.Cell className="truncate">
                                No campaign — {phase.short} produces the record later phases are
                                judged against
                              </Table.Cell>
                              <Table.Cell>—</Table.Cell>
                              <Table.Cell>—</Table.Cell>
                            </Table.Row>,
                          ]
                        : phase.campaigns.map((id) => {
                            const campaign = campaignById.get(id) ?? null;
                            return (
                              <Table.Row key={`${phase.id}-${id}`}>
                                <Table.Cell>
                                  <Id>{phase.id}</Id>
                                </Table.Cell>
                                <Table.Cell>{phase.kind}</Table.Cell>
                                <Table.Cell>
                                  <Link
                                    to="/campaigns/$campaignId"
                                    params={{ campaignId: id }}
                                    className="text-primary hover:underline"
                                  >
                                    <Id className="text-primary">{id}</Id>
                                  </Link>
                                </Table.Cell>
                                <Table.Cell className="truncate" title={campaign?.scope ?? ""}>
                                  {campaign ? `${campaign.name} — ${campaign.scope}` : "—"}
                                </Table.Cell>
                                <Table.Cell className="truncate">
                                  {campaign?.lead ?? "—"}
                                </Table.Cell>
                                <Table.Cell>
                                  {campaign ? (
                                    <Badge tone={statusTone(campaign.state)}>
                                      {campaign.state}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </Table.Cell>
                              </Table.Row>
                            );
                          }),
                    )}
                  </tbody>
                </Table>
              </Section>
            )}
          </>
        ) : null}

        {tab === "Gate readiness" ? (
          <>
            {selectedPhase && selectedReadiness ? (
              <>
                <Toolbar
                  actions={
                    <span className="tnum text-[12px] text-muted-foreground">
                      {derivedCount} derived · {attestedCount} attested · {unsignedCount} unsigned
                    </span>
                  }
                >
                  <span className="text-[12px] text-muted-foreground">Phase</span>
                  <Select
                    value={selectedPhase.id}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (isPhaseId(next)) selectPhase(next);
                    }}
                    aria-label="Phase"
                    className="h-7 w-[560px] text-13"
                  >
                    {phases.map((p) => {
                      const r = readiness.get(p.id);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.id} — {p.short} — {p.kind} — {p.state}
                          {r
                            ? ` — entry ${r.entryMet}/${r.entryTotal}, exit ${r.exitMet}/${r.exitTotal}`
                            : ""}
                        </option>
                      );
                    })}
                  </Select>
                </Toolbar>

                <Section
                  title={`${selectedPhase.id} — ${selectedPhase.name}`}
                  description={selectedPhase.purpose}
                  action={
                    <span className="text-[12px] text-muted-foreground">
                      Informs {selectedPhase.gate}
                    </span>
                  }
                >
                  <PhaseReadinessSummary
                    phase={selectedPhase}
                    readiness={selectedReadiness}
                    criteria={phaseCriteria}
                  />
                </Section>

                <Section
                  title="Entry criteria"
                  description="What has to be true before the phase may open. A derived criterion is recomputed on every render from the SCTM, the finding register, the scan record, the run log, the change log and the composition graph; an attested one reports a signature, because no platform can judge whether an agreement was negotiated in good faith."
                >
                  <CriteriaTable criteria={phaseCriteria} results={criterionResults} kind="Entry" />
                </Section>

                <Section
                  title="Exit criteria"
                  description="What has to be true before the phase may close. These are re-read against today's register rather than against the record as it stood on the day the phase was signed off — which is why a phase can be Complete and still fail its own exit criteria here. That divergence is the point of a derived gate, and it is reported rather than reconciled away."
                >
                  <CriteriaTable criteria={phaseCriteria} results={criterionResults} kind="Exit" />
                </Section>

                <Section
                  title="Why two kinds of criterion"
                  description="A phase gate that is a row of checkboxes proves nothing: it records that somebody ticked, not that anything is true."
                >
                  <div className="grid gap-3 pt-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-primary/25 bg-primary-soft/30 px-4 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="tnum text-[20px] font-semibold leading-none text-primary">
                          {derivedCount}
                        </span>
                        <span className="text-[12.5px] font-medium">derived</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        Computed from records the platform already holds, and re-computed every time
                        anything underneath them moves. Each one prints the sentence it produced,
                        with the real numbers in it and the ids it read, so a reader can go and
                        disagree with the arithmetic rather than with the verdict.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-subtle px-4 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="tnum text-[20px] font-semibold leading-none">
                          {attestedCount}
                        </span>
                        <span className="text-[12.5px] font-medium">attested</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        A signed test plan, an approved threat portrayal, an ROE agreement, an
                        operational test agency concurrence. No selector can judge these, so the
                        platform does not pretend to — it records who signed and when, and{" "}
                        {unsignedCount === 0
                          ? "every one of them is on file."
                          : `${unsignedCount} of them ${unsignedCount === 1 ? "has" : "have"} no signature at all, which is rendered as the gap it is rather than as a pending computation.`}
                      </p>
                    </div>
                  </div>
                </Section>
              </>
            ) : (
              <div className="pt-4">
                <EmptyState
                  title="No phase to judge"
                  description={`${program.id} carries no cyber T&E phase record, so there is no entry or exit criterion to evaluate.`}
                />
              </div>
            )}
          </>
        ) : null}

        {tab === "Threat scenarios" ? (
          scenarios.length === 0 ? (
            <div className="pt-4">
              <EmptyState
                title="No threat scenario written"
                description={`${program.id} carries no threat portrayal, so there is no attack surface characterised and nothing for a red team to execute against.`}
              />
            </div>
          ) : (
            <>
              <Section
                title="Attack surface exercised"
                description="Every technique below is a real ATT&CK id with its published name and tactic, and every scenario path is walked against the actual composition graph. A scenario whose path is not traversable is the same class of defect as a fabricated technique id, so the walk is printed rather than asserted."
                action={
                  <span className="tnum text-[12px] text-muted-foreground">
                    {brokenPaths === 0
                      ? "Every path traversable"
                      : `${brokenPaths} unwalkable path${brokenPaths === 1 ? "" : "s"}`}
                  </span>
                }
              >
                <AttackSurfaceSummary coverage={coverage} scenarios={scenarios} />
              </Section>

              <Section
                title="Threat scenarios"
                description="Tier is a property of the portrayal, not a verdict: a DoD Cyber Table Top tier VI adversary is a different assumption about who is attacking, not worse news than a tier II one. Cooperative CVPA scenarios and adversarial AA scenarios sit in the same table because they cover the same surface — the phase column says which regime authored each."
                action={
                  <span className="tnum text-[12px] text-muted-foreground">
                    {coverage.exercised} executed of {scenarios.length}
                  </span>
                }
              >
                <div className="pt-2">
                  <ScenarioTable
                    scenarios={scenarios}
                    selected={selectedScenario?.id ?? null}
                    onSelect={selectScenario}
                    phaseShort={phaseShort}
                    showPhase
                  />
                </div>
              </Section>

              {selectedScenario ? (
                <Section
                  title="Chain and path"
                  description="The ordered technique chain, and beneath it the walk through the system it claims. Each hop names the reachability edge or the containment link that carries it, so the claim can be checked on the composition page rather than believed."
                  action={
                    <Link
                      to="/programs/$programId/composition"
                      params={{ programId: program.id }}
                      // The entry point is where the reader wants to land: the
                      // composition tree opens on the assumed foothold rather
                      // than on the system root.
                      search={selectedScenario.path[0] ? { node: selectedScenario.path[0] } : {}}
                      className="text-[12.5px] text-primary hover:underline"
                    >
                      Open in composition
                    </Link>
                  }
                >
                  <div className="pt-4">
                    <AttackChain
                      scenario={selectedScenario}
                      path={scenarioPath}
                      hops={scenarioHops}
                      effects={scenarioEffects}
                    />
                  </div>
                </Section>
              ) : null}
            </>
          )
        ) : null}

        {tab === "Mission effects" ? (
          effects.length === 0 ? (
            <div className="pt-4">
              <EmptyState
                title="No mission effect recorded"
                description={`${program.id} has executed no scenario against a mission function, so there is nothing to score. An adversarial assessment with no recorded effect has not been run — it is not a clean result.`}
              />
            </div>
          ) : (
            <>
              <Section
                title="What the adversary did to the mission"
                description="An adversarial assessment is scored in mission effect, not in findings count — an AA that reports twelve CAT II findings and no mission effect has missed its own point. Each row records what an operator would have seen, how long it lasted and what they could do about it."
                action={
                  <span className="tnum text-[12px] text-muted-foreground">
                    {effects.filter((e) => e.effect === "No effect").length} of {effects.length}{" "}
                    with no effect
                  </span>
                }
              >
                <div className="grid gap-3 pt-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-danger/30 bg-danger-soft/40 px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <span className="tnum text-[20px] font-semibold leading-none text-danger">
                        {
                          effects.filter(
                            (e) =>
                              e.effect === "Denied" ||
                              e.effect === "Destroyed" ||
                              e.effect === "Exfiltrated",
                          ).length
                        }
                      </span>
                      <span className="text-[12.5px] font-medium">mission denied or taken</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      The adversary stopped the mission, destroyed what it runs on, or took the data
                      it runs on. These are the results a findings count cannot express.
                    </p>
                  </div>
                  <div className="rounded-lg border border-warning/30 bg-warning-soft/40 px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <span className="tnum text-[20px] font-semibold leading-none text-warning">
                        {
                          effects.filter(
                            (e) => e.effect === "Degraded" || e.effect === "Manipulated",
                          ).length
                        }
                      </span>
                      <span className="text-[12.5px] font-medium">degraded or manipulated</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      The mission continued, worse or wrong. A degraded effect with a workaround is
                      still an effect: the workaround is manual, and the page names it so the cost
                      is visible.
                    </p>
                  </div>
                  <div className="rounded-lg border border-success/30 bg-success-soft/40 px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <span className="tnum text-[20px] font-semibold leading-none text-success">
                        {effects.filter((e) => e.effect === "No effect").length}
                      </span>
                      <span className="text-[12.5px] font-medium">no effect</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      Executed, and the objective was not achieved — the control held and refused
                      the adversary. That is a result, and a product that records only the successes
                      is lying about what the assessment found.
                    </p>
                  </div>
                </div>
              </Section>

              <Section
                title="Confirmed effects"
                description="Each effect names the run or event that confirmed it, whether it was reproduced on a second attempt, and the finding it raised. An effect with no finding and no workaround is what blocks the adversarial assessment's exit criterion."
              >
                <div className="pt-2">
                  <MissionEffectTable effects={effects} scenarioName={scenarioName} />
                </div>
              </Section>

              <Section
                title="Mission functions touched"
                description="The same read-out from the mission's side rather than the adversary's: which functions have been exercised at all, and what the worst recorded outcome against each of them was."
              >
                <MissionFunctionTable effects={effects} />
              </Section>
            </>
          )
        ) : null}
      </ShowPage>
    </Shell>
  );
}

/* ── Rails and small tables ──────────────────────────────────────────────── */

function PhaseRail({
  phase,
  readiness,
  campaignName,
  scenarioCount,
  onOpenGate,
}: {
  phase: TePhase;
  readiness: PhaseReadiness | null;
  campaignName: (id: string) => string;
  scenarioCount: number;
  onOpenGate: () => void;
}) {
  return (
    <>
      <Inspector.Group title="Phase">
        <KeyValue label="Phase">
          <Id>{phase.id}</Id>
        </KeyValue>
        <KeyValue label="Short">{phase.short}</KeyValue>
        <KeyValue label="Regime">{phase.kind}</KeyValue>
        <KeyValue label="State">
          <PhaseStateChip phase={phase} />
        </KeyValue>
        <KeyValue label="Window">{phase.window}</KeyValue>
        <KeyValue label="Lead">{phase.lead}</KeyValue>
        <KeyValue label="Informs">{phase.gate}</KeyValue>
        <KeyValue label="Scenarios">
          <span className="tnum">{scenarioCount}</span>
        </KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Gate">
        <KeyValue label="Entry">
          <span className="tnum">
            {readiness ? `${readiness.entryMet}/${readiness.entryTotal}` : "—"}
          </span>
        </KeyValue>
        <KeyValue label="Exit">
          <span className="tnum">
            {readiness ? `${readiness.exitMet}/${readiness.exitTotal}` : "—"}
          </span>
        </KeyValue>
        <KeyValue label="Can enter">
          <Badge size="xs" tone={readiness?.canEnter ? "success" : "danger"}>
            {readiness?.canEnter ? "Yes" : "No"}
          </Badge>
        </KeyValue>
        <KeyValue label="Can exit">
          <Badge size="xs" tone={readiness?.canExit ? "success" : "warning"}>
            {readiness?.canExit ? "Yes" : "No"}
          </Badge>
        </KeyValue>
        <div className="pt-1.5">
          <button
            type="button"
            onClick={onOpenGate}
            className="text-[12.5px] text-primary hover:underline"
          >
            Read the criteria
          </button>
        </div>
      </Inspector.Group>

      <Inspector.Group title="Campaigns">
        {phase.campaigns.length === 0 ? (
          <div className="pt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            None. This phase produces the record later phases are judged against, not an execution.
          </div>
        ) : (
          phase.campaigns.map((id) => (
            <KeyValue key={id} label={id}>
              <Link
                to="/campaigns/$campaignId"
                params={{ campaignId: id }}
                className="text-primary hover:underline"
              >
                {campaignName(id)}
              </Link>
            </KeyValue>
          ))
        )}
      </Inspector.Group>

      <Inspector.Group title="Purpose">
        <div className="pt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {phase.purpose}
        </div>
      </Inspector.Group>
    </>
  );
}

/** Worst-first, because the point of the view is which mission function is worst off. */
const effectRank: Record<string, number> = {
  Destroyed: 5,
  Denied: 4,
  Exfiltrated: 3,
  Manipulated: 2,
  Degraded: 1,
  "No effect": 0,
};

function MissionFunctionTable({
  effects,
}: {
  effects: { missionFunction: string; effect: string; scenario: string; workaround: string }[];
}) {
  const rows = useMemo(() => {
    const map = new Map<
      string,
      { fn: string; count: number; worst: string; scenarios: Set<string>; noWorkaround: number }
    >();
    for (const e of effects) {
      let row = map.get(e.missionFunction);
      if (!row) {
        row = {
          fn: e.missionFunction,
          count: 0,
          worst: "No effect",
          scenarios: new Set<string>(),
          noWorkaround: 0,
        };
        map.set(e.missionFunction, row);
      }
      row.count += 1;
      row.scenarios.add(e.scenario);
      if (e.workaround === "None identified") row.noWorkaround += 1;
      if ((effectRank[e.effect] ?? 0) > (effectRank[row.worst] ?? 0)) row.worst = e.effect;
    }
    return [...map.values()].sort(
      (a, b) => (effectRank[b.worst] ?? 0) - (effectRank[a.worst] ?? 0) || b.count - a.count,
    );
  }, [effects]);

  if (rows.length === 0) {
    return (
      <p className="pt-4 text-[12.5px] text-muted-foreground">
        No mission function has been exercised yet.
      </p>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col />
        <col style={{ width: "132px" }} />
        <col style={{ width: "96px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "180px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Mission function</Table.Header>
          <Table.Header>Worst outcome</Table.Header>
          <Table.Header className="text-right">Effects</Table.Header>
          <Table.Header className="text-right">Scenarios</Table.Header>
          <Table.Header>Operator recourse</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Table.Row key={r.fn}>
            <Table.Cell className="truncate" title={r.fn}>
              {r.fn}
            </Table.Cell>
            <Table.Cell>
              <Badge
                tone={
                  r.worst === "No effect"
                    ? "success"
                    : (effectRank[r.worst] ?? 0) >= 3
                      ? "danger"
                      : "warning"
                }
              >
                {r.worst}
              </Badge>
            </Table.Cell>
            <Table.Cell className="tnum text-right">{r.count}</Table.Cell>
            <Table.Cell className="tnum text-right">{r.scenarios.size}</Table.Cell>
            <Table.Cell className={r.noWorkaround > 0 ? "text-danger" : undefined}>
              {r.noWorkaround > 0
                ? `${r.noWorkaround} with none identified`
                : r.worst === "No effect"
                  ? "Not required — the mission held"
                  : "A workaround exists for every effect"}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}
