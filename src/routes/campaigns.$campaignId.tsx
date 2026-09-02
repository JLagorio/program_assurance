import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Shell } from "@/components/app/shell";
import {
  ExecutionSummary,
  ObjectiveExecutionTable,
  ObjectiveRail,
  PreconditionList,
  ProcedureList,
  ProcedureRail,
  RegressionTable,
  RunRail,
  RunRecordView,
  RunTable,
  StepTable,
  type ObjectiveExecutionRow,
  type ProcedureListRow,
  type RunListRow,
} from "@/components/app/test-execution";
import { Badge, EmptyState, RecordHeader, Section, ShowPage, Id, Tabs } from "@/components/app/ui";
import {
  campaignById,
  eventsByCampaign,
  objectiveById,
  type ObjectiveResult,
} from "@/lib/campaigns";
import { statusTone } from "@/lib/spine";
import {
  campaignExecution,
  completionBlockedBy,
  objectiveDisagrees,
  objectivesForCampaign,
  proceduresForCampaign,
  proceduresForObjective,
  regressionsForCampaign,
  resolvedObjectiveResult,
  runVerdict,
  runsForCampaign,
  runsForObjective,
  runsForProcedure,
  procedureById,
  setRunState,
  useTestRuns,
} from "@/lib/test-execution";

const campaignTabs = ["Execution", "Procedures", "Runs", "Regression"] as const;
type CampaignTab = (typeof campaignTabs)[number];

export const Route = createFileRoute("/campaigns/$campaignId")({
  // The key is always emitted, never omitted on a miss. The router merges the
  // validated object OVER the raw search, so returning `{}` for an unrecognized
  // tab leaves `tab=Bogus` standing and the component's `?? "Execution"` never
  // fires — an explicit `undefined` is what strips it.
  validateSearch: (search: Record<string, unknown>): { tab?: CampaignTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    const match = campaignTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    return { tab: match };
  },
  loader: ({ params }) => {
    const campaign = campaignById.get(params.campaignId.toUpperCase());
    if (!campaign) throw notFound();
    return { campaign };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.campaign.name ?? "Campaign";
    const id = loaderData?.campaign.id ?? "the campaign";
    const title = `${name} — Equinox`;
    const description = `Execution record for ${id}: the procedures written against each test objective, the runs executed against a named build, the step records the operator took, and where the run log disagrees with the declared objective result.`;
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
  component: CampaignRecord,
});

function CampaignRecord() {
  const { campaign } = Route.useLoaderData();
  const tab = Route.useSearch().tab ?? "Execution";
  const navigate = useNavigate({ from: Route.fullPath });

  // Subscribe to the run log so a recorded step or a state change re-renders the
  // whole page. Every selector below already reads the resolved snapshot; this
  // is what tells React the snapshot moved.
  const runLog = useTestRuns();

  const [objective, setObjective] = useState<string | null>(null);
  const [procedure, setProcedure] = useState<string | null>(null);
  const [run, setRun] = useState<string | null>(null);

  const execution = useMemo(
    () => campaignExecution(campaign.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id, runLog],
  );

  const objectiveRows = useMemo<ObjectiveExecutionRow[]>(
    () =>
      objectivesForCampaign(campaign.id).map((id) => {
        const declared = objectiveById.get(id);
        const resolved = resolvedObjectiveResult(id);
        const declaredResult: ObjectiveResult = declared?.result ?? "Not run";
        return {
          objective: id,
          statement: declared?.statement ?? "—",
          ccis: declared?.ccis ?? [],
          event: declared?.event ?? null,
          declared: declaredResult,
          executed: resolved.result,
          source: resolved.source,
          run: resolved.run,
          basis: resolved.basis,
          disagrees: objectiveDisagrees(id),
          procedures: proceduresForObjective(id).map((p) => p.id),
          runs: runsForObjective(id).length,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id, runLog],
  );

  const gaps = useMemo(
    () =>
      execution.unproceduredObjectives.map((id) => ({
        id,
        statement: objectiveById.get(id)?.statement ?? "—",
        declared: objectiveById.get(id)?.result ?? ("Not run" as ObjectiveResult),
      })),
    [execution.unproceduredObjectives],
  );

  const disagreements = useMemo(
    () =>
      objectiveRows
        .filter((r) => r.disagrees)
        .map((r) => ({ id: r.objective, declared: r.declared, executed: r.executed, run: r.run })),
    [objectiveRows],
  );

  const procedureRows = useMemo<ProcedureListRow[]>(
    () =>
      proceduresForCampaign(campaign.id).map((p) => {
        const runs = runsForProcedure(p.id);
        // The latest run that actually happened. A Planned run has no records,
        // so reading a verdict off it would report "Not run" over a real one.
        const executed = runs.filter((r) => r.state !== "Planned");
        const latest = executed[executed.length - 1];
        return {
          procedure: p,
          runs: runs.length,
          verdict: latest ? runVerdict(latest.id) : null,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id, runLog],
  );

  const runRows = useMemo<RunListRow[]>(
    () =>
      runsForCampaign(campaign.id).map((r) => ({
        run: r,
        procedure: procedureById.get(r.procedure) ?? null,
        verdict: runVerdict(r.id),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id, runLog],
  );

  const regressionRows = useMemo(
    () => regressionsForCampaign(campaign.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id, runLog],
  );

  const events = eventsByCampaign(campaign.id);

  const selectedObjective = objective
    ? (objectiveRows.find((r) => r.objective === objective) ?? null)
    : null;
  const selectedProcedure = procedure
    ? (procedureRows.find((r) => r.procedure.id === procedure) ?? null)
    : null;
  const selectedRun = run ? (runRows.find((r) => r.run.id === run) ?? null) : null;

  const go = (next: CampaignTab) => navigate({ search: { tab: next }, replace: true });

  const counts: Record<CampaignTab, number | null> = {
    Execution: objectiveRows.length,
    Procedures: procedureRows.length,
    Runs: runRows.length,
    // A number — including 0 — is a count the strip shows; `null` would mean
    // "no count concept here", which is not true of any of these four tabs.
    Regression: regressionRows.length,
  };

  const showRail =
    (tab === "Execution" && selectedObjective !== null) ||
    (tab === "Procedures" && selectedProcedure !== null) ||
    (tab === "Runs" && selectedRun !== null);

  const railTitle =
    tab === "Execution"
      ? "Objective"
      : tab === "Procedures"
        ? "Procedure"
        : tab === "Runs"
          ? "Run"
          : "";

  const railId =
    tab === "Execution"
      ? (selectedObjective?.objective ?? "")
      : tab === "Procedures"
        ? (selectedProcedure?.procedure.id ?? "")
        : (selectedRun?.run.id ?? "");

  const closeRail = () => {
    if (tab === "Execution") setObjective(null);
    else if (tab === "Procedures") setProcedure(null);
    else setRun(null);
  };

  const blocked = selectedRun ? completionBlockedBy(selectedRun.run.id) : null;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/campaigns"
            id={campaign.id}
            title={campaign.name}
            meta={`${campaign.program} · ${campaign.trigger} · ${campaign.gate} gate · lead ${campaign.lead} · ${campaign.opened} → ${campaign.target}`}
            actions={
              <>
                <Badge tone={statusTone(campaign.state)}>{campaign.state}</Badge>
                {disagreements.length > 0 ? (
                  <Badge tone="warning">
                    {disagreements.length} declared{" "}
                    {disagreements.length === 1 ? "result disagrees" : "results disagree"}
                  </Badge>
                ) : null}
                {execution.unproceduredObjectives.length > 0 ? (
                  <Badge tone="danger">
                    {execution.unproceduredObjectives.length} without a procedure
                  </Badge>
                ) : null}
              </>
            }
            below={
              <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                {campaign.scope}
              </p>
            }
          />
        }
        tabs={
          <Tabs
            items={campaignTabs.map((t) => ({
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
        showRail={showRail}
        rail={
          showRail ? (
            <div>
              <div className="flex items-center gap-2 pb-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  {railTitle}
                </span>
                <Id>{railId}</Id>
                <button
                  onClick={closeRail}
                  className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              {tab === "Execution" && selectedObjective ? (
                <ObjectiveRail row={selectedObjective} />
              ) : null}
              {tab === "Procedures" && selectedProcedure ? (
                <ProcedureRail row={selectedProcedure} />
              ) : null}
              {tab === "Runs" && selectedRun ? <RunRail row={selectedRun} /> : null}
            </div>
          ) : null
        }
      >
        {tab === "Execution" ? (
          <>
            {objectiveRows.length > 0 ? (
              <ExecutionSummary execution={execution} gaps={gaps} disagreements={disagreements} />
            ) : null}

            <Section
              title="Declared result versus executed result"
              description="The left result is what the campaign record asserts. The right result is what the step records add up to: each procedure's latest complete run, rolled up to the worst of them, because every procedure written for an objective has to hold for it to be met. Where they differ the run is the fact and the declaration is the claim."
              action={
                <span className="tnum text-12 text-muted-foreground">
                  {objectiveRows.length} objectives · {events.length} events
                </span>
              }
            >
              <ObjectiveExecutionTable
                rows={objectiveRows}
                selected={objective}
                onSelect={(row) =>
                  setObjective((current) => (current === row.objective ? null : row.objective))
                }
              />
            </Section>
          </>
        ) : null}

        {tab === "Procedures" ? (
          <>
            <Section
              title="Written procedures"
              description="One procedure proves one objective. A procedure that has never been run is a plan, not evidence."
              action={
                <span className="tnum text-12 text-muted-foreground">
                  {procedureRows.length} procedures · {execution.withProcedure} of{" "}
                  {objectiveRows.length} objectives covered
                </span>
              }
            >
              <ProcedureList
                rows={procedureRows}
                selected={procedure}
                onSelect={(row) =>
                  setProcedure((current) =>
                    current === row.procedure.id ? null : row.procedure.id,
                  )
                }
              />
            </Section>

            {selectedProcedure ? (
              <>
                <Section
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <Id>{selectedProcedure.procedure.id}</Id>
                      <span>Preconditions</span>
                    </span>
                  }
                  description="What has to be true before the first step is taken. A run started outside these conditions does not prove the objective."
                >
                  <div className="pt-2">
                    <PreconditionList items={selectedProcedure.procedure.preconditions} />
                  </div>
                </Section>

                <Section
                  title="Steps"
                  description={`${selectedProcedure.procedure.steps.length} steps · ${selectedProcedure.procedure.duration} minutes · ${selectedProcedure.procedure.method} · ${selectedProcedure.procedure.author} ${selectedProcedure.procedure.version}`}
                >
                  <StepTable steps={selectedProcedure.procedure.steps} />
                </Section>
              </>
            ) : procedureRows.length > 0 ? (
              <EmptyState
                title="Select a procedure"
                description="Open a row above to read its preconditions and the step-by-step action, pass criterion and artifact to collect."
              />
            ) : null}
          </>
        ) : null}

        {tab === "Runs" ? (
          <>
            <Section
              title="Runs"
              description="State and verdict are independent. The state says what happened to the run; the verdict is derived from the step records and says what they add up to."
              action={
                <span className="tnum text-12 text-muted-foreground">
                  {runRows.filter((r) => r.run.state === "Complete").length} complete of{" "}
                  {runRows.length}
                </span>
              }
            >
              <RunTable
                rows={runRows}
                selected={run}
                onSelect={(row) =>
                  setRun((current) => (current === row.run.id ? null : row.run.id))
                }
              />
            </Section>

            {selectedRun ? (
              <RunRecordView
                run={selectedRun.run}
                procedure={selectedRun.procedure}
                verdict={selectedRun.verdict}
                blockedReason={blocked}
                onComplete={() => setRunState(selectedRun.run.id, "Complete")}
              />
            ) : runRows.length > 0 ? (
              <EmptyState
                title="Select a run"
                description="Open a row above to read every step record: what was observed, what was collected, and why the verdict is what it is."
              />
            ) : null}
          </>
        ) : null}

        {tab === "Regression" ? (
          <Section
            title="Step movement across retests"
            description="Every step compared against the run it re-executes. Only steps with a decisive record on both sides appear — an inconclusive or un-run step is not evidence of a regression or of a fix."
            action={
              <span className="tnum text-12 text-muted-foreground">
                {regressionRows.filter((r) => r.state === "Regressed").length} regressed ·{" "}
                {regressionRows.filter((r) => r.state === "Fixed").length} fixed
              </span>
            }
          >
            <RegressionTable rows={regressionRows} />
          </Section>
        ) : null}

        <Section
          title="Events under this campaign"
          description="The scheduled windows the runs above were executed inside."
        >
          {events.length === 0 ? (
            <EmptyState
              title="This campaign has no events"
              description={`${campaign.id} was opened on the ${campaign.trigger.toLowerCase()} trigger but nothing was scheduled under it, so no objective is in scope and nothing can be executed.`}
            />
          ) : (
            <div className="space-y-2 pt-2">
              {events.map((e) => (
                <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    to="/campaigns"
                    className="shrink-0 hover:underline"
                    aria-label={`Back to campaigns for ${e.id}`}
                  >
                    <Id className="text-primary">{e.id}</Id>
                  </Link>
                  <span className="text-[13px] font-medium">{e.name}</span>
                  <Badge tone={statusTone(e.state)}>{e.state}</Badge>
                  <span className="text-[12.5px] text-muted-foreground">{e.kind}</span>
                  <span className="tnum text-[12.5px] text-muted-foreground">{e.window}</span>
                  <span className="text-[12.5px] text-muted-foreground">{e.team}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </ShowPage>
    </Shell>
  );
}
