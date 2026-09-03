import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AlertList,
  AlertSummary,
  CadenceTable,
  DriftBandChip,
  DriftCard,
  DriftFactorTable,
  FreshnessTable,
  ScheduleTable,
  SlippageTable,
} from "@/components/app/conmon";
import {
  Badge,
  Box,
  Button,
  Grid,
  Inline,
  RecordHeader,
  Section,
  ShowPage,
  Tabs,
  TextLink,
  ToggleGroup,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import {
  assessmentSchedule,
  conmonAlerts,
  conmonAsOf,
  conmonAsOfLabel,
  driftScore,
  evidenceFreshness,
  poamSlippage,
  scanCadence,
  setControlTextIndex,
  type ConMonAlert,
} from "@/lib/conmon";
import { programs } from "@/lib/grc-data";
import { buildControlTextIndex } from "@/lib/sctm";
import { cn } from "@/lib/utils";

const conmonTabs = [
  "Drift",
  "Assessment schedule",
  "Evidence freshness",
  "Scan cadence",
  "POA&M slippage",
] as const;
type ConMonTab = (typeof conmonTabs)[number];

export const Route = createFileRoute("/programs/$programId_/conmon")({
  // The router MERGES the validated object over the raw parsed search rather
  // than replacing it, so omitting `tab` on a miss would leave `?tab=Bogus`
  // intact and the `?? "Drift"` fallback below would never fire — the page
  // would render with no active tab and an empty body. Emitting the key
  // explicitly, as `undefined`, is what deletes it, and `encode()` drops
  // undefined values so nothing leaks back into the URL. The `| undefined` in
  // the return type is load-bearing: `exactOptionalPropertyTypes` is on, so a
  // bare `tab?: ConMonTab` rejects the explicit undefined (TS2375). It stays
  // OPTIONAL rather than widening to a required `tab:` so that linking to this
  // route does not demand a `search`.
  validateSearch: (search: Record<string, unknown>): { tab?: ConMonTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    const match = conmonTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    return { tab: match };
  },
  // Every ratio this page publishes is quoted per SCTM row, and a row count is
  // only reconcilable if it is the SAME row set the SCTM tab and the retest
  // queue publish — one row per leaf 800-53A assessment objective. That
  // granularity only exists once the 1.25 MB catalog has been dynamic-imported,
  // so the loader does the importing and hands `conmon.ts` the narrowed index,
  // exactly as the baseline route does for `change-impact.ts`. The index is NOT
  // returned: loader data is serialised into the SSR document on every request,
  // and this page renders none of the control text.
  loader: async ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    const { controlText } = await import("@/lib/nist-control-text");
    setControlTextIndex(buildControlTextIndex(controlText));
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} continuous monitoring — Equinox` },
      {
        name: "description",
        content: `Post-authorization drift for ${loaderData?.id ?? "the program"}: what has moved away from the authorized state, the SLCM assessment schedule, evidence age against its SLA, scan cadence and POA&M slippage, each with the record it rests on.`,
      },
      {
        property: "og:title",
        content: `${loaderData?.name ?? "Program"} continuous monitoring — Equinox`,
      },
      {
        property: "og:description",
        content:
          "Before an ATO the question is whether the system was ever assessed. After one it is whether what was authorized is still what is running. Every number here is derived from a record, not authored as a status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramConMon,
});

function ProgramConMon() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Drift";
  const navigate = useNavigate({ from: Route.fullPath });

  // `conmonAsOf` is a module constant, never the wall clock. Every date, age,
  // slip and window on this page is measured against it, so the server-rendered
  // document and the hydrated one agree down to the day and the "As of" label
  // in the header is true of every number below it.
  const drift = useMemo(() => driftScore(program.id, conmonAsOf), [program.id]);
  const alerts = useMemo(() => conmonAlerts(program.id, conmonAsOf), [program.id]);
  const schedule = useMemo(() => assessmentSchedule(program.id, conmonAsOf), [program.id]);
  const freshness = useMemo(() => evidenceFreshness(program.id, conmonAsOf), [program.id]);
  const cadence = useMemo(() => scanCadence(program.id, conmonAsOf), [program.id]);
  const slippage = useMemo(() => poamSlippage(program.id, conmonAsOf), [program.id]);

  const [scheduleScope, setScheduleScope] = useState<"needs" | "all">("needs");
  const [freshnessScope, setFreshnessScope] = useState<"needs" | "all">("needs");

  const overdue = schedule.filter((r) => r.status === "Overdue");
  const neverAssessed = schedule.filter((r) => r.status === "Never assessed");
  const dueSoon = schedule.filter((r) => r.status === "Due");
  const undetermined = schedule.filter((r) => r.method === "Undetermined");
  const scheduleActionable = schedule.filter((r) => r.status !== "Current");
  const scheduleRows = scheduleScope === "all" ? schedule : scheduleActionable;

  const pastSla = freshness.filter(
    (r) =>
      r.freshness === "Stale" || r.freshness === "Expired" || r.freshness === "Never collected",
  );
  const freshnessRows = freshnessScope === "all" ? freshness : pastSla;
  const expired = freshness.filter((r) => r.freshness === "Expired").length;
  const stale = freshness.filter((r) => r.freshness === "Stale").length;
  const neverCollected = freshness.filter((r) => r.freshness === "Never collected").length;

  // How much of the model actually ran. A band published without this number
  // beside it is the one genuinely misleading thing this page could do: a
  // program with no baseline, no strategy and no scan target scores low because
  // four factors could not be measured, not because it has not drifted.
  const appliedWeight = Math.round(drift.factors.reduce((a, f) => a + f.weight, 0) * 100);

  const outOfCadence = cadence.filter((r) => !r.compliant);
  const slipped = slippage.filter((r) => r.slipDays > 0);
  const overdueSections = slippage.filter((r) => r.status === "Overdue");
  const urgent = alerts.filter((a) => a.severity === "Critical" || a.severity === "High").length;

  const go = (next: ConMonTab) => navigate({ search: { ...search, tab: next }, replace: true });

  const counts: Record<ConMonTab, number | null> = {
    Drift: alerts.length,
    "Assessment schedule": schedule.length,
    "Evidence freshness": freshness.length,
    "Scan cadence": cadence.length,
    "POA&M slippage": slippage.length,
  };

  /**
   * Every alert gets somewhere to go. An alert about the schedule, the evidence
   * SLA or a scan window opens the tab that holds its rows; an alert about a
   * change, an inheritance edge or a POA&M item opens the record that owns it,
   * because that is where the next action is actually taken. The queue is only
   * worth reading every morning if reading it is the first half of doing
   * something about it.
   */
  const alertAction = (alert: ConMonAlert): ReactNode => {
    const jump = (to: ConMonTab, label: string) => (
      <Button onClick={() => go(to)} variant="link" size="small">
        Open {label}
      </Button>
    );
    switch (alert.kind) {
      case "Assessment overdue":
        return jump("Assessment schedule", "schedule");
      case "Evidence expired":
        return jump("Evidence freshness", "evidence");
      case "Scan cadence missed":
        return jump("Scan cadence", "cadence");
      case "POA&M slipped":
        return /^POAM-\d+$/.test(alert.subject) ? (
          <TextLink size="small">
            <Link to="/register/poam/$poamId" params={{ poamId: alert.subject }}>
              Open {alert.subject}
            </Link>
          </TextLink>
        ) : (
          jump("POA&M slippage", "slippage")
        );
      case "Unrecorded change":
      case "Determination invalidated":
        return (
          <TextLink size="small">
            <Link to="/programs/$programId/baseline" params={{ programId: program.id }}>
              Open baseline
            </Link>
          </TextLink>
        );
      case "Inheritance drifted":
        return (
          <TextLink size="small">
            <Link
              to="/programs/$programId/inheritance"
              params={{ programId: program.id }}
              search={{ tab: undefined, control: undefined }}
            >
              Open inheritance
            </Link>
          </TextLink>
        );
      case "Authorization expiring":
        return (
          <TextLink size="small">
            <Link to="/programs/$programId" params={{ programId: program.id }}>
              Open program
            </Link>
          </TextLink>
        );
      default:
        return null;
    }
  };

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            back={<Link to="/programs/$programId" params={{ programId: program.id }} />}
            id={program.id}
            title={`${program.name} — continuous monitoring`}
            meta={`As of ${conmonAsOfLabel} · ${alerts.length} alert${alerts.length === 1 ? "" : "s"}${urgent > 0 ? ` (${urgent} critical or high)` : ""} · drift ${drift.score}/100${appliedWeight < 100 ? ` on ${appliedWeight} of 100 points of weight — read the band as a floor` : ""}`}
            actions={
              <>
                <Badge tone="neutral">Drift {drift.score}</Badge>
                <DriftBandChip band={drift.band} provisional={appliedWeight < 100} />
                <TextLink size="small">
                  <Link to="/programs/$programId/baseline" params={{ programId: program.id }}>
                    Baseline
                  </Link>
                </TextLink>
                <TextLink size="small">
                  <Link to="/programs/$programId/sctm" params={{ programId: program.id }}>
                    SCTM
                  </Link>
                </TextLink>
                <TextLink size="small">
                  <Link
                    to="/programs/$programId/risk"
                    params={{ programId: program.id }}
                    search={{ tab: undefined }}
                  >
                    Risk
                  </Link>
                </TextLink>
              </>
            }
          />
        }
        tabs={
          <Tabs>
            {conmonTabs.map((key) => (
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
        {tab === "Drift" ? (
          <>
            <Section
              title="How far the operating state has moved from the authorized one"
              description={`Before an authorization the question is whether the system was ever assessed. After one it is whether what was authorized is still what is running. Everything below is measured as of ${conmonAsOfLabel} against the state ${program.id} was authorized in — the pinned build, the determinations that were current when the package was signed, the evidence those determinations rest on, and the monitoring the ISSM committed to doing between assessments.`}
            >
              <Box paddingBlockStart="space.200">
                <DriftCard score={drift} asOf={conmonAsOfLabel} subject={program.name} />
              </Box>
            </Section>

            <Section
              title="How the score was built"
              description="Six factors, each read from a record somewhere else in this system and none of them a constant. The shape is deliberately the one the residual risk model uses — a weighted sum whose contributions add up in front of the reader — because drift and residual risk are the same kind of argument asked about two different questions."
            >
              <DriftFactorTable score={drift} />
            </Section>

            <Section
              title="The monitoring queue"
              description={
                alerts.length === 0
                  ? `Nothing in ${program.id} has diverged from a record this module can check. An empty queue is a result, not a gap in the checking.`
                  : `${alerts.length} thing${alerts.length === 1 ? " has" : "s have"} diverged from what was authorized, worst first. Each one says what moved, with the numbers, and what to do about it. Nothing is here that does not rest on a record — no alert is manufactured to fill the list.`
              }
              action={
                <span className="tabular-nums font-body-small text-subtle">
                  {urgent} critical or high · {alerts.length} total
                </span>
              }
            >
              <AlertSummary alerts={alerts} />
              <Box paddingBlockStart="space.150">
                <AlertList
                  alerts={alerts}
                  action={alertAction}
                  empty={{
                    title: "Nothing has diverged",
                    description: `No pin in ${program.id} has moved without a change record, no determination has been retracted, no evidence is past its SLA and no monitoring window has closed empty.`,
                  }}
                />
              </Box>
            </Section>

            <Section
              title="What feeds the score"
              description="The four monitoring surfaces the factors above are counted from. Each one is a full table of its own; the counts here are the same rows, summarised."
            >
              <Grid
                className="pt-200"
                gap="space.150"
                templateColumns={{
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                }}
              >
                <FeedTile
                  label="Assessment schedule"
                  value={overdue.length}
                  unit={`of ${schedule.length} overdue`}
                  alarming
                  note={
                    schedule.length === 0
                      ? "No SLCM strategy is on file for this program, so there is no schedule to fall behind. That is a gap, not a clean result."
                      : `${dueSoon.length} due inside their window, ${neverAssessed.length} never assessed, ${undetermined.length} filed with an Undetermined method.`
                  }
                  onOpen={() => go("Assessment schedule")}
                />
                <FeedTile
                  label="Evidence freshness"
                  value={expired + stale}
                  // "Past SLA" on the Evidence freshness tab counts the rows
                  // with no dated artifact at all as well, because a control
                  // that has never been collected against is past its SLA under
                  // any reading. This tile mirrors the drift factor instead —
                  // `share(stale + expired, rows)` — so it has to name the
                  // narrower set rather than reuse the phrase for a smaller
                  // number. The 14 never-collected rows are in the note below.
                  unit={`of ${freshness.length} expired or stale`}
                  alarming
                  note={
                    freshness.length === 0
                      ? "No requirement in this matrix maps to a monitored control, so no evidence SLA applies."
                      : `${expired} expired, ${stale} stale, ${neverCollected} with no dated artifact attached at all.`
                  }
                  onOpen={() => go("Evidence freshness")}
                />
                <FeedTile
                  label="Scan cadence"
                  value={outOfCadence.length}
                  unit={`of ${cadence.length} out of cadence`}
                  alarming
                  note={
                    cadence.length === 0
                      ? "No tracked asset here anchors a composition node, so no scan window can be measured."
                      : "One row per asset and scan format, comparing the last reconciled result against the window that format is expected to produce one inside."
                  }
                  onOpen={() => go("Scan cadence")}
                />
                <FeedTile
                  label="POA&M slippage"
                  value={slipped.length}
                  unit={`of ${slippage.length} slipped`}
                  alarming
                  note={
                    slippage.length === 0
                      ? "This program carries no POA&M item with a scheduled completion date."
                      : `${overdueSections.length} section${overdueSections.length === 1 ? " is" : "s are"} already past the date committed to the AO. The slip is measured against the original commitment, not the latest revision.`
                  }
                  onOpen={() => go("POA&M slippage")}
                />
              </Grid>
            </Section>
          </>
        ) : null}

        {tab === "Assessment schedule" ? (
          <Section
            title="The SLCM schedule"
            description={`The continuous monitoring strategy is the one authored table in this module — frequency, method, responsible entity and last assessed date per control, exactly as an ISSM files it in eMASS. Every other column is computed: the next due date is the last assessed date plus the frequency's period, the days-out figure is the distance from ${conmonAsOfLabel} to that date, and the status is read off that number against a window sized to the control's own cycle. A missed check is never rewritten as "Not assessed" — the schedule status and the 800-53A determination are separate axes and neither collapses into the other.`}
            action={
              schedule.length > 0 ? (
                <ToggleGroup
                  value={scheduleScope}
                  onChange={setScheduleScope}
                  items={[
                    { value: "needs", label: `Needs action ${scheduleActionable.length}` },
                    { value: "all", label: `All ${schedule.length}` },
                  ]}
                />
              ) : null
            }
          >
            {schedule.length > 0 ? (
              <CountStrip
                items={[
                  { label: "Overdue", count: overdue.length, tone: "danger" },
                  { label: "Never assessed", count: neverAssessed.length, tone: "warning" },
                  { label: "Due", count: dueSoon.length, tone: "neutral" },
                  {
                    label: "Current",
                    count: schedule.length - scheduleActionable.length,
                    tone: "success",
                  },
                  { label: "Undetermined method", count: undetermined.length, tone: "warning" },
                ]}
              />
            ) : null}
            <Box paddingBlockStart="space.150">
              <ScheduleTable rows={scheduleRows} />
            </Box>
            {schedule.length > 0 && scheduleRows.length === 0 ? (
              <p className="pt-150 font-body-small text-subtle">
                Every one of the {schedule.length} controls in the strategy is inside its window as
                of {conmonAsOfLabel}. Switch to "All {schedule.length}" to read the schedule itself.
              </p>
            ) : null}
          </Section>
        ) : null}

        {tab === "Evidence freshness" ? (
          <Section
            title="Evidence against its SLA"
            description={`Every monitored requirement, with the age of the newest artifact attached to it measured against the SLA its control's own monitoring frequency implies. A daily control with five-day-old evidence is expired on exactly the same rule that leaves an annual control's seven-month-old policy attestation merely aging — the SLA is the interval the program committed to, not a flat number applied to everything.`}
            action={
              freshness.length > 0 ? (
                <ToggleGroup
                  value={freshnessScope}
                  onChange={setFreshnessScope}
                  items={[
                    { value: "needs", label: `Past SLA ${pastSla.length}` },
                    { value: "all", label: `All ${freshness.length}` },
                  ]}
                />
              ) : null
            }
          >
            {freshness.length > 0 ? (
              <CountStrip
                items={[
                  { label: "Expired", count: expired, tone: "danger" },
                  { label: "Stale", count: stale, tone: "warning" },
                  { label: "Never collected", count: neverCollected, tone: "warning" },
                  {
                    label: "Aging",
                    count: freshness.filter((r) => r.freshness === "Aging").length,
                    tone: "neutral",
                  },
                  {
                    label: "Fresh",
                    count: freshness.filter((r) => r.freshness === "Fresh").length,
                    tone: "success",
                  },
                ]}
              />
            ) : null}
            <Box paddingBlockStart="space.150">
              <FreshnessTable rows={freshnessRows} />
            </Box>
            {freshness.length > 0 && freshnessRows.length === 0 ? (
              <p className="pt-150 font-body-small text-subtle">
                Every one of the {freshness.length} monitored requirements is inside its SLA as of{" "}
                {conmonAsOfLabel}. Switch to "All {freshness.length}" to read the collection dates.
              </p>
            ) : null}
          </Section>
        ) : null}

        {tab === "Scan cadence" ? (
          <Section
            title="Scan windows"
            description={`One row per tracked asset and scan format, comparing the newest reconciled scan result against the window that format is expected to produce one inside. A run that was ingested but never reconciled into the finding register does not close a window: a scan nobody processed is not a monitoring signal, and this table says so in the row rather than crediting the upload.`}
            action={
              cadence.length > 0 ? (
                <span className="tabular-nums font-body-small text-subtle">
                  {cadence.length - outOfCadence.length} in cadence · {outOfCadence.length} missed
                </span>
              ) : null
            }
          >
            <Box paddingBlockStart="space.200">
              <CadenceTable rows={cadence} />
            </Box>
          </Section>
        ) : null}

        {tab === "POA&M slippage" ? (
          <Section
            title="Commitments against the dates they have moved to"
            description={`The slip is the distance between the original completion date the program committed to and the date currently scheduled, with the number of recorded revisions beside it. Both numbers come from the register item; neither is authored as a "slipped" flag. An item sitting past a date nobody ever revised is the worse story, not the better one, and it sorts to the top for that reason.`}
            action={
              slippage.length > 0 ? (
                <span className="tabular-nums font-body-small text-subtle">
                  {slipped.length} slipped · {overdueSections.length} overdue
                </span>
              ) : null
            }
          >
            <Box paddingBlockStart="space.200">
              <SlippageTable rows={slippage} />
            </Box>
          </Section>
        ) : null}
      </ShowPage>
    </Shell>
  );
}

/**
 * A labelled count in the colour its class carries elsewhere on the page. A
 * zero drops to muted rather than keeping its tone: a page that shows five
 * coloured chips when four of them are empty teaches the reader to stop
 * looking at the colour.
 */
function CountStrip({
  items,
}: {
  items: { label: string; count: number; tone: "neutral" | "success" | "warning" | "danger" }[];
}) {
  return (
    <Inline
      className="pt-200"
      space="space.200"
      rowSpace="space.100"
      alignBlock="center"
      shouldWrap
    >
      {items.map((item) => (
        <Inline key={item.label} as="span" space="space.075" alignBlock="center">
          <Badge size="xsmall" tone={item.count > 0 ? item.tone : "neutral"}>
            {item.label}
          </Badge>
          <span
            className={cn(
              "tabular-nums font-body-small font-medium",
              item.count === 0 ? "text-subtle" : "text-default",
            )}
          >
            {item.count}
          </span>
        </Inline>
      ))}
    </Inline>
  );
}

/**
 * One headline count with the sentence that stops it being read wrong, and a
 * way into the table it was counted from. The `alarming` tiles go amber only
 * when the count is non-zero — nothing overdue is a good outcome, and colouring
 * a zero would make a quiet page look busy.
 */
function FeedTile({
  label,
  value,
  unit,
  note,
  alarming = false,
  onOpen,
}: {
  label: string;
  value: number;
  unit: string;
  note: string;
  alarming?: boolean;
  onOpen: () => void;
}) {
  return (
    <Box
      className="rounded-large border border-default bg-surface-sunken"
      paddingInline="space.200"
      paddingBlock="space.150"
    >
      <Inline space="space.100" alignBlock="center" spread="space-between">
        <span className="font-body-small text-subtle">{label}</span>
        <Button onClick={onOpen} variant="link" size="small" className="shrink-0">
          Open
        </Button>
      </Inline>
      <Inline className="pt-050" space="space.100" alignBlock="baseline">
        <span
          className={cn(
            "tabular-nums font-heading-medium font-semibold",
            alarming && value > 0 ? "text-warning" : null,
            alarming && value === 0 ? "text-subtle" : null,
          )}
        >
          {value}
        </span>
        <span className="font-body-small text-subtle">{unit}</span>
      </Inline>
      <Box className="font-body-small text-subtle" paddingBlockStart="space.075">
        {note}
      </Box>
    </Box>
  );
}
