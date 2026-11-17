// The program's Authorization view, as Josef decided it on 2026-11-16 (docs/decisions.md: Path,
// Standing, Timeline, Words): the dated path to the program's next decision is this view, not the
// page a system opens on. What holds for this screen alone:
//
// Its h1 is Authorization, with no trail, since the side nav names it (Assess and authorize ›
// Authorization), and its header says the program's categorization and its standing as one fact (`ProgramStandingFacts`).
// The header ends with the program's action slot (`ProgramHeaderSlot` in program-slot), as the
// Overview's does. Its three parts are line tabs the address keeps
// (`tab`, Schedule when it names none): Schedule, Decisions and Package.
//
// Schedule is two lanes over one time axis (`AuthorizationLanes`, over `authorizationSchedule` in
// authorization-schedule): the authorization events the program's packages record in one lane
// (each version submitted or published, a draft with no date, each package review, each decision
// in RMF's words and the day the standing authorization ends), with the draft assessment results
// that hold findings on their campaign's last day, and its lifecycle gates in the other, as
// diamonds with their status and a due flag. A stop that waits on a role ends its line with who
// holds it today, from the program's roles (program-roles): the latest submitted version with no
// decision Waiting on the authorizing official, draft results Waiting on the lead assessor; a
// decision and a review name who made them, as before; where the program records nobody in the
// role, nobody is named. Every stop is on one row in date order, a
// rule says today, and a stop with no date comes last; a lane's rail is solid up to today and
// dotted after it. Every authorization stop names its package and opens its page; a gate
// opens its preview. Under the lanes, Control status is the baseline's climb from the program's
// control status counts (`BaselineClimb`): one bar to scale, then each rung's count and what
// stopped under it, every number a link to Controls › Status asked for exactly those
// controls, a zero no link. A program with neither a decision nor a gate says so in the lanes'
// place; one with no control baseline draws no climb.
//
// Decisions is the program's authorization decisions as a register (a decision has no page of its
// own, so its name opens its preview), Package the program's authorization packages register.
//
// What the boards draw that the schema does not hold is left out: a decision's conditions as dated
// items with owners and progress (`authorization_decisions.conditions` is one text, shown in the
// decision's preview), the annual authorization review and its checks, a gate's decider (the gate
// chair), and the criteria a gate has met. The kit's Stepper draws one lane;
// the two lanes are composed here from Grid and Box until it draws more than one.

import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Count,
  DateLabel,
  DateTime,
  Grid,
  Inline,
  PageHeader,
  Person,
  Section,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  VisuallyHidden,
  useLedgerLocale,
  type DateTimeFormat,
} from "@ledger/design-system";
import { Check, Diamond, X } from "lucide-react";
import { useRow, useRows, type Row } from "@/lib/models";
import { type DataRecord } from "@/lib/records";
import { daysBetween, useProgramAuthorization } from "@/lib/program-standing";
import {
  authorizationSchedule,
  EXPIRY_NOTICE_DAYS,
  useAuthorizationRecords,
  type ScheduleLane,
  type ScheduleResults,
  type ScheduleStop,
} from "@/lib/authorization-schedule";
import { roleActs, useProgramRoles, type RoleAct } from "@/lib/program-roles";
import { useProgramWaits } from "@/lib/program-slot";
import {
  CONTROL_STATUS_ORDER,
  useProgramsControlStatusCounts,
  type ControlStatus,
} from "@/lib/control-status";
import {
  authorizationDecisions,
  authorizationTypes,
  authorizationStandings,
  lifecycleGateStatuses,
  reviewDecisions,
  statusLabel,
} from "@/lib/status";
import { Page } from "@/components/app/shell";
import { ControlStatusTally } from "./control-status";
import { controlStatusListSearch } from "./control-status-link";
import { controlsViewSearch } from "@/lib/program-parts";
import { AuthorizationDecisionFacts } from "./package-views";
import { ProgramStandingFacts } from "./program-standing";
import { ProgramHeaderSlot } from "./program-slot";
import {
  ProgramCollection,
  ProgramEditor,
  ProgramRecordDialog,
  RetainedTabPanels,
} from "./program-shared";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { ModelTable, type DisplayColumn } from "./record-tools";
import {
  EmptyMessage,
  MissingRecord,
  QueryState,
  RecordActions,
  ReportFailures,
} from "./work-common";

export const AUTHORIZATION_TABS = ["schedule", "decisions", "package"] as const;
/** Who holds the role each act waits on today, by name; null where the program records none. */
type WaitingOn = Record<RoleAct, string | null>;
export type AuthorizationTab = (typeof AUTHORIZATION_TABS)[number];

/** What the view reads of the program's systems: its boundaries' categorization and codes. */
const SYSTEM_COLUMNS = [
  "id",
  "code",
  "name",
  "is_authorization_boundary",
  "authorization_status",
  "confidentiality_impact",
  "integrity_impact",
  "availability_impact",
  "product_revision_id",
  "product_configuration_id",
] as const;
type ProgramSystem = Pick<Row<"systems">, (typeof SYSTEM_COLUMNS)[number]>;

export function ProgramAuthorization({
  programId,
  tab,
  onTabChange,
}: {
  programId: string;
  /** The part the address names: Schedule when it names none. */
  tab: AuthorizationTab;
  onTabChange: (tab: AuthorizationTab) => void;
}) {
  const query = useRow("programs", programId);
  const systems = useRows("systems", { program_id: programId }, { columns: SYSTEM_COLUMNS });
  const gates = useRows("lifecycle_gates", { program_id: programId });
  const authorization = useProgramAuthorization(programId);
  const records = useAuthorizationRecords(programId);
  const [editing, setEditing] = useState(false);
  const boundaries = useMemo(
    () => (systems.data ?? []).filter((system) => system.is_authorization_boundary),
    [systems.data],
  );
  if (!query.data && (query.isPending || query.error)) return <QueryState queries={[query]} />;
  if (!query.data) return <MissingRecord backTo="/programs" kind="Program" />;
  const program = query.data;
  const tabCount = (rows: readonly unknown[] | undefined) =>
    rows ? <Count value={rows.length} max={9999} /> : null;
  return (
    <>
      <Page>
        {/* The page is one failure region, and each part another. */}
        <QueryState queries={[query]} region>
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Authorization</PageHeader.Title>
              <ProgramStandingFacts programId={programId} boundaries={boundaries} gates={gates} />
            </PageHeader.Heading>
            {/* This reader's next step, or who the program waits on, Edit program behind it. */}
            <ProgramHeaderSlot programId={programId} onEdit={() => setEditing(true)} />
          </PageHeader>
          <Tabs value={tab} onValueChange={(value) => onTabChange(value as AuthorizationTab)}>
            <TabsList variant="line" aria-label="Authorization sections">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="decisions">
                Decisions
                {tabCount(authorization.decisions.data)}
              </TabsTrigger>
              <TabsTrigger value="package">
                Package
                {tabCount(records.packages.data)}
              </TabsTrigger>
            </TabsList>
            <RetainedTabPanels tabs={AUTHORIZATION_TABS} value={tab}>
              {(name) =>
                name === "schedule" ? (
                  <AuthorizationSchedulePanel
                    programId={programId}
                    systems={systems.data}
                    gates={gates}
                  />
                ) : name === "decisions" ? (
                  <AuthorizationDecisions programId={programId} systems={systems.data} />
                ) : (
                  <AuthorizationPackages programId={programId} systems={systems} />
                )
              }
            </RetainedTabPanels>
          </Tabs>
        </QueryState>
      </Page>
      {editing && (
        <ProgramEditor
          table="programs"
          existing={program as DataRecord}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

/* ---------- Schedule: two lanes over one time axis, then the baseline's climb ---------- */

const LANES: Record<ScheduleLane, { words: string; none: string }> = {
  authorization: { words: "Authorization", none: "No authorization events" },
  acquisition: { words: "Acquisition", none: "No lifecycle gates" },
};
/** The reader's calendar day of an instant, `YYYY-MM-DD`. */
const isoDay = ({ year, month, day }: { year: number; month: number; day: number }) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function AuthorizationSchedulePanel({
  programId,
  systems,
  gates,
}: {
  programId: string;
  systems: readonly ProgramSystem[] | undefined;
  gates: UseQueryResult<Row<"lifecycle_gates">[], Error>;
}) {
  const { zonedParts } = useLedgerLocale();
  const authorization = useProgramAuthorization(programId);
  const { packages, reviews } = useAuthorizationRecords(programId);
  const queries = [authorization.versions, authorization.decisions, packages, reviews, gates];
  // What waits on a role: draft results holding findings, each on its campaign's last day, and
  // who holds the roles they and a submitted version wait on. A failure of these leaves the path
  // drawn without them, said by the panel's alert.
  const roles = useProgramRoles(programId);
  const waits = useProgramWaits(programId);
  const campaignIds = useMemo(
    () =>
      [
        ...new Set(
          (waits.waits ?? []).flatMap((wait) =>
            wait.kind === "assessment_results" && wait.campaignId ? [wait.campaignId] : [],
          ),
        ),
      ].sort(),
    [waits.waits],
  );
  const campaigns = useRows(
    "assessment_campaigns",
    { id: campaignIds },
    { columns: ["id", "ends_at"], enabled: campaignIds.length > 0 },
  );
  const drafts = useMemo((): ScheduleResults[] | undefined => {
    if (waits.query.isError) return [];
    if (!waits.waits) return undefined;
    if (campaignIds.length && !campaigns.data && !campaigns.isError) return undefined;
    const endsAt = new Map((campaigns.data ?? []).map((row) => [row.id, row.ends_at]));
    return waits.waits.flatMap((wait) =>
      wait.kind === "assessment_results"
        ? [
            {
              id: wait.resultsId,
              title: wait.resultsTitle,
              campaignId: wait.campaignId,
              campaignTitle: wait.campaignTitle,
              findings: wait.findings,
              endsAt: (wait.campaignId && endsAt.get(wait.campaignId)) || null,
            },
          ]
        : [],
    );
  }, [waits.query.isError, waits.waits, campaignIds.length, campaigns.data, campaigns.isError]);
  /** Who holds the role an act waits on today, by name, where the program records one. */
  const waitingOn = useMemo(() => {
    const holderOf = (act: RoleAct) => {
      const line = roles.data?.find((item) => item.role === roleActs[act]);
      return line?.recorded ? (line.holders[0]?.name ?? null) : null;
    };
    return {
      authorization_decision: holderOf("authorization_decision"),
      publish_assessment_results: holderOf("publish_assessment_results"),
    };
  }, [roles.data]);
  const [gateId, setGateId] = useState<string | null>(null);
  const today = isoDay(zonedParts(Date.now()));
  const ready =
    authorization.versions.data &&
    authorization.decisions.data &&
    packages.data &&
    reviews.data &&
    gates.data &&
    drafts;
  const schedule = useMemo(
    () =>
      ready
        ? authorizationSchedule({
            packages: packages.data!,
            versions: authorization.versions.data!,
            decisions: authorization.decisions.data!,
            reviews: reviews.data!,
            gates: gates.data!,
            results: drafts,
            today,
            dayOf: (moment) => isoDay(zonedParts(Date.parse(moment))),
          })
        : null,
    [
      ready,
      packages.data,
      authorization.versions.data,
      authorization.decisions.data,
      reviews.data,
      gates.data,
      drafts,
      today,
      zonedParts,
    ],
  );
  // The people the path names, read once by id: who decided and who reviewed.
  const partyIds = useMemo(
    () =>
      [
        ...new Set(
          (schedule?.stops ?? []).flatMap((stop) =>
            stop.kind === "decision" || stop.kind === "review" ? [stop.partyId] : [],
          ),
        ),
      ].sort(),
    [schedule],
  );
  const parties = useRows(
    "parties",
    { id: partyIds },
    { columns: ["id", "name"], enabled: partyIds.length > 0 },
  );
  const names = useMemo(
    () => new Map((parties.data ?? []).map((party) => [party.id, party.name])),
    [parties.data],
  );
  const codes = useMemo(
    () => new Map((systems ?? []).map((system) => [system.id, system.code])),
    [systems],
  );
  const selected = gates.data?.find((gate) => gate.id === gateId);
  return (
    <>
      {/* A name that could not be read leaves its stop's line, said by the panel's alert, and so
          does what waits on a role. */}
      <ReportFailures queries={[parties, roles, waits.query, campaigns]} />
      <QueryState queries={queries}>
        {schedule &&
          (schedule.stops.length ? (
            <AuthorizationLanes
              schedule={schedule}
              today={today}
              names={names}
              codes={codes}
              waitingOn={waitingOn}
              onGate={setGateId}
            />
          ) : (
            <EmptyMessage
              illustration="calendar"
              title="No authorization events or gates"
              description="Package decisions and lifecycle gates appear here."
            />
          ))}
      </QueryState>
      <BaselineClimb programId={programId} />
      {selected && (
        <ProgramRecordDialog
          table="lifecycle_gates"
          row={selected as DataRecord}
          initialValues={{ program_id: programId }}
          // Previous and next step through the gates in the lane's order.
          records={(schedule?.stops ?? []).flatMap((stop) => {
            const gate =
              stop.kind === "gate" ? gates.data?.find((row) => row.id === stop.gate.id) : undefined;
            return gate ? [gate as DataRecord] : [];
          })}
          onSelect={(row) => setGateId(row.id)}
          onClose={() => setGateId(null)}
        />
      )}
    </>
  );
}

/** A rail's piece between two rows: walked (solid) up to today, ahead (dotted) after it. */
type Piece = "walked" | "ahead" | undefined;
/** Each lane's rail column, on the row's one line. */
const RAIL_COLUMN: Record<ScheduleLane, string> = {
  authorization: "col-start-2 row-start-1 relative w-300",
  acquisition: "col-start-5 row-start-1 relative w-300",
};
/** The piece above a stop's mark, from the row's top to the mark's middle. */
const ABOVE: Record<"walked" | "ahead", string> = {
  walked: "absolute start-1/2 top-0 h-150 border-s border-current-default",
  ahead: "absolute start-1/2 top-0 h-150 border-s border-dotted border-bold",
};
/** The piece below it, from the mark's middle to the row's bottom. */
const BELOW: Record<"walked" | "ahead", string> = {
  walked: "absolute start-1/2 top-150 bottom-0 border-s border-current-default",
  ahead: "absolute start-1/2 top-150 bottom-0 border-s border-dotted border-bold",
};

/** One lane's column on one row: the rail's pieces above and below, and the stop's mark. */
function Rail({
  lane,
  above,
  below,
  children,
}: {
  lane: ScheduleLane;
  above: Piece;
  below: Piece;
  children?: ReactNode;
}) {
  return (
    <Box aria-hidden className={RAIL_COLUMN[lane]}>
      {above && <span className={ABOVE[above]} />}
      {below && <span className={BELOW[below]} />}
      {children && (
        <Inline alignBlock="center" alignInline="center" className="relative size-300">
          {children}
        </Inline>
      )}
    </Box>
  );
}

/**
 * A stop's mark: a decision, a version and a review a disc, a gate a diamond, the end of an
 * authorization a ring round a dot, a draft a ring. Done is a check in ink, an authorizing decision
 * on the success fill; a refusal, a returned review, a lapsed authorization and a blocked gate a
 * cross on the danger fill; a gate under way is filled with a diamond cut in it. A stop ahead is
 * drawn in the bold border, or in the warning or danger tone where it is at risk or late.
 */
const DISC = {
  ink: "size-250 rounded-full bg-neutral-bold text-inverse",
  signed: "size-250 rounded-full bg-success-bold text-inverse",
  refused: "size-250 rounded-full bg-danger-bold text-inverse",
};
/** A gate ahead: a diamond in the bold border, or in the tone of a gate at risk or late. */
const GATE = {
  plain: "size-150 rotate-45 rounded-xsmall border border-bold bg-surface-current",
  warning: "size-150 rotate-45 rounded-xsmall border border-warning bg-surface-current",
  danger: "size-150 rotate-45 rounded-xsmall border border-danger bg-surface-current",
};
/** Any other stop ahead: a ring, round a dot where an authorization ends. */
const RING = {
  plain: "size-200 rounded-full border border-bold bg-surface-current",
  warning: "size-200 rounded-full border border-warning bg-surface-current",
  danger: "size-200 rounded-full border border-danger bg-surface-current",
};
const DOT = {
  plain: "size-050 rounded-full bg-neutral-bold",
  warning: "size-050 rounded-full bg-warning-bold",
  danger: "size-050 rounded-full bg-danger-bold",
};

function Mark({ stop }: { stop: ScheduleStop }) {
  const filled = stop.state === "blocked" ? "refused" : stop.kind === "decision" ? "signed" : "ink";
  if (stop.state !== "upcoming")
    return (
      <Inline alignBlock="center" alignInline="center" className={DISC[filled]}>
        {stop.state === "blocked" ? (
          <X className="size-150" />
        ) : stop.state === "done" ? (
          <Check className="size-150" />
        ) : (
          <Diamond className="size-100 fill-current" />
        )}
      </Inline>
    );
  const tone = stop.tone ?? "plain";
  if (stop.kind === "gate") return <span className={GATE[tone]} />;
  return (
    <Inline alignBlock="center" alignInline="center" className={RING[tone]}>
      {stop.kind === "expiry" && <span className={DOT[tone]} />}
    </Inline>
  );
}

/** A day as the path says it: "Sep 18", with its year where it is not the reader's. */
function useDayFormat(today: string) {
  return (day: string): DateTimeFormat =>
    day.slice(0, 4) === today.slice(0, 4)
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
}

/** The stop's day before the rails: a gate still open and an authorization still standing say
 * where their day stands (Overdue, Expires soon), as a DateLabel does. */
function When({ stop, today }: { stop: ScheduleStop; today: string }) {
  const format = useDayFormat(today);
  if (!stop.day) return <Text color="color.text.subtle">No date</Text>;
  // Only a day with something to say about it takes the label's words (a gate late or due within
  // two days, an authorization ending within ninety); any other reads plainly.
  const days = daysBetween(today, stop.day);
  const said =
    ((stop.kind === "gate" || stop.kind === "results") &&
      stop.state !== "done" &&
      !stop.at &&
      days <= 2) ||
    (stop.kind === "expiry" && !stop.passed && days <= EXPIRY_NOTICE_DAYS);
  if (said)
    return (
      <DateLabel
        value={stop.day}
        format={format(stop.day)}
        {...(stop.kind === "expiry" ? { kind: "expiry", soonWithin: EXPIRY_NOTICE_DAYS } : {})}
      />
    );
  return <DateTime value={stop.at ?? stop.day} format={format(stop.day)} focusable={false} />;
}

/** What a stop says on its line: its name and what it is, then who holds it (`end`). */
function stopWords({
  stop,
  names,
  codes,
  waitingOn,
  onGate,
  formatPlural,
}: {
  stop: ScheduleStop;
  names: ReadonlyMap<string, string>;
  codes: ReadonlyMap<string, string>;
  waitingOn: WaitingOn;
  onGate: (id: string) => void;
  formatPlural: ReturnType<typeof useLedgerLocale>["formatPlural"];
}): { line: ReactNode; end: ReactNode } {
  const toPackage = (packageId: string) => (
    <Link to="/packages/$pkgId" params={{ pkgId: packageId }} />
  );
  const named = (packageId: string, words: string) => (
    <TextLink weight="medium" render={toPackage(packageId)}>
      {words}
    </TextLink>
  );
  const person = (partyId: string) => {
    const name = names.get(partyId);
    return name ? <Person name={name} /> : null;
  };
  /** Who a stop waits on, from the program's roles: nobody named where it records none. */
  const waiting = (act: RoleAct) => {
    const name = waitingOn[act];
    return name ? (
      <Inline space="space.075" alignBlock="center">
        <span>Waiting on</span>
        <Person name={name} />
      </Inline>
    ) : null;
  };
  let label: ReactNode;
  let meta: ReactNode = null;
  let end: ReactNode = null;
  switch (stop.kind) {
    case "decision":
      label = named(stop.packageId, statusLabel(authorizationDecisions, stop.decision));
      meta = codes.get(stop.systemId) ?? null;
      end = person(stop.partyId);
      break;
    case "review":
      label = named(stop.packageId, "Package review");
      meta = statusLabel(reviewDecisions, stop.decision);
      end = person(stop.partyId);
      break;
    case "submitted":
    case "published":
      label = named(stop.packageId, `Version ${stop.version} ${stop.kind}`);
      meta = codes.get(stop.systemId) ?? null;
      // The latest submitted version with no decision waits on the authorizing official.
      if (stop.awaits) end = waiting("authorization_decision");
      break;
    case "results":
      label = stop.campaignId ? (
        <TextLink
          weight="medium"
          render={<Link to="/campaigns/$campaignId" params={{ campaignId: stop.campaignId }} />}
        >
          {stop.name}
        </TextLink>
      ) : (
        stop.name
      );
      meta = formatPlural(stop.findings, {
        one: "Draft results · {count} finding",
        other: "Draft results · {count} findings",
      });
      end = waiting("publish_assessment_results");
      break;
    case "draft":
      label = named(stop.packageId, `Version ${stop.version}`);
      meta = `Draft · ${codes.get(stop.systemId) ?? ""}`.replace(/ · $/, "");
      break;
    case "expiry":
      label = named(
        stop.packageId,
        stop.passed
          ? statusLabel(authorizationStandings, "ato_expired")
          : authorizationTypes.atd.label,
      );
      meta = codes.get(stop.systemId) ?? null;
      break;
    case "gate":
      label = (
        <Button variant="link" onClick={() => onGate(stop.gate.id)}>
          {stop.gate.title}
        </Button>
      );
      meta = statusLabel(lifecycleGateStatuses, stop.gate.status);
      break;
  }
  return {
    line: (
      <Inline shouldWrap space="space.100" rowSpace="space.025" alignBlock="baseline">
        <VisuallyHidden>{`${LANES[stop.lane].words}: `}</VisuallyHidden>
        <Text weight="medium">{label}</Text>
        {meta && (
          <Text size="small" color="color.text.subtle">
            {meta}
          </Text>
        )}
      </Inline>
    ),
    end: end && (
      <Text size="small" color="color.text.subtle">
        {end}
      </Text>
    ),
  };
}

/**
 * The two lanes on one grid the rows share (when · authorization rail · authorization · who ·
 * acquisition rail · acquisition), so every stop stands on the row of its day whichever lane it is
 * in, and a lane's rail runs from its first stop to its last through the rows of the other lane.
 * Who decided or reviewed stands in the authorization lane's own last column, start-aligned and
 * clear of the acquisition rail, as the board draws it, so a person never reads as the gate lane's.
 * Under a narrow container the day moves above each name, who holds a stop to a line under it and
 * today's word to the rule's end, as the kit's dated path does.
 */
function AuthorizationLanes({
  schedule,
  today,
  names,
  codes,
  waitingOn,
  onGate,
}: {
  schedule: ReturnType<typeof authorizationSchedule>;
  today: string;
  names: ReadonlyMap<string, string>;
  codes: ReadonlyMap<string, string>;
  waitingOn: WaitingOn;
  onGate: (id: string) => void;
}) {
  const { formatPlural } = useLedgerLocale();
  const rows: (ScheduleStop | "today")[] = [
    ...schedule.stops.slice(0, schedule.today),
    "today",
    ...schedule.stops.slice(schedule.today),
  ];
  const todayRow = schedule.today;
  /** Each lane's rail runs from the row of its first stop to the row of its last. */
  const span = (lane: ScheduleLane) => {
    const at = rows.flatMap((row, i) => (row !== "today" && row.lane === lane ? [i] : []));
    return at.length ? { first: at[0]!, last: at.at(-1)! } : null;
  };
  const spans = { authorization: span("authorization"), acquisition: span("acquisition") };
  /** The rail's piece between row `i` and the row after it, in a lane. */
  const piece = (lane: ScheduleLane, i: number): Piece => {
    const lanespan = spans[lane];
    if (!lanespan || i < lanespan.first || i >= lanespan.last) return undefined;
    return i < todayRow ? "walked" : "ahead";
  };
  const rails = (i: number, stop: ScheduleStop | null) =>
    (["authorization", "acquisition"] as const).map((lane) => (
      <Rail key={lane} lane={lane} above={piece(lane, i - 1)} below={piece(lane, i)}>
        {stop?.lane === lane ? <Mark stop={stop} /> : null}
      </Rail>
    ));
  return (
    <Box className="@container/lanes min-w-0">
      <Grid
        // The authorization lane takes three fifths where there is room; on a phone the lanes share
        // it, so a gate's late day keeps its words.
        templateColumns={{
          base: "auto auto minmax(0, 1fr) auto auto minmax(0, 1fr)",
          md: "auto auto minmax(0, 3fr) auto auto minmax(0, 2fr)",
        }}
      >
        {/* The lanes' names, over their columns; a lane with nothing in it says so. */}
        {(["authorization", "acquisition"] as const).map((lane) => (
          <Box
            key={lane}
            paddingBlockEnd="space.150"
            className={
              lane === "authorization" ? "col-start-2 col-span-3" : "col-start-5 col-span-2"
            }
          >
            <Text size="small" weight="medium" color="color.text.subtle">
              {LANES[lane].words}
            </Text>
            {!schedule.lanes[lane] && (
              <Text as="p" size="small" color="color.text.subtlest">
                {LANES[lane].none}
              </Text>
            )}
          </Box>
        ))}
        <Grid
          as="ol"
          role="list"
          aria-label="Authorization schedule"
          templateColumns="subgrid"
          className="col-span-full"
        >
          {rows.map((row, i) =>
            row === "today" ? (
              <Grid key="today" as="li" templateColumns="subgrid" className="col-span-full">
                <Box
                  paddingBlockEnd="space.200"
                  paddingInlineEnd="space.150"
                  className="col-start-1 row-start-1 min-h-300 text-end @max-md/lanes:hidden"
                >
                  <Text size="small" weight="medium">
                    Today
                  </Text>
                </Box>
                {rails(i, null)}
                <Inline
                  space="space.100"
                  alignBlock="center"
                  className="col-start-2 col-end-7 row-start-1 h-300"
                >
                  <span aria-hidden className="flex-1 border-t border-current-default" />
                  <Text size="small" weight="medium" className="hidden @max-md/lanes:inline">
                    Today
                  </Text>
                </Inline>
              </Grid>
            ) : (
              <StopRow key={row.key} stop={row} today={today} rails={rails(i, row)}>
                {stopWords({ stop: row, names, codes, waitingOn, onGate, formatPlural })}
              </StopRow>
            ),
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

/** One stop's row: its day, the rails, its line in its lane and, in the authorization lane, who. */
function StopRow({
  stop,
  today,
  rails,
  children: { line, end },
}: {
  stop: ScheduleStop;
  today: string;
  rails: ReactNode;
  children: { line: ReactNode; end: ReactNode };
}) {
  // Who stands in its own column in the authorization lane while the lanes are side by side; in
  // the acquisition lane, the last, it ends the stop's line.
  const ownColumn = stop.lane === "authorization";
  return (
    <Grid as="li" templateColumns="subgrid" className="col-span-full">
      <Box
        paddingInlineEnd="space.150"
        className="col-start-1 row-start-1 min-h-300 text-end @max-md/lanes:hidden"
      >
        <Text size="small" color={whenColor(stop)}>
          <When stop={stop} today={today} />
        </Text>
      </Box>
      {rails}
      <Box
        paddingBlockEnd="space.200"
        paddingInlineStart="space.100"
        paddingInlineEnd="space.200"
        className={BODY_COLUMN[stop.lane]}
      >
        <Box className="hidden @max-md/lanes:block">
          <Text size="small" color={whenColor(stop)}>
            <When stop={stop} today={today} />
          </Text>
        </Box>
        <Inline
          space="space.150"
          rowSpace="space.025"
          shouldWrap
          spread="space-between"
          alignBlock="start"
          className="min-h-300 min-w-0"
        >
          {line}
          {end && <Box className={ownColumn ? "hidden @max-md/lanes:block" : undefined}>{end}</Box>}
        </Inline>
      </Box>
      {ownColumn && end && (
        <Box
          paddingInlineEnd="space.600"
          className="col-start-4 row-start-1 min-h-300 @max-md/lanes:hidden"
        >
          {end}
        </Box>
      )}
    </Grid>
  );
}

/** Each lane's column for a stop's line. */
const BODY_COLUMN: Record<ScheduleLane, string> = {
  authorization: "col-start-3 row-start-1 min-w-0",
  acquisition: "col-start-6 row-start-1 min-w-0",
};

/** A late stop's day in the danger tone, one at risk in the warning tone. */
const whenColor = (stop: ScheduleStop) =>
  stop.state === "done"
    ? "color.text.subtle"
    : stop.tone === "danger"
      ? "color.text.danger"
      : stop.tone === "warning"
        ? "color.text.warning"
        : "color.text.subtle";

/** The rungs of the baseline's climb, from the first, with the statuses that stopped under each. */
const RUNGS: readonly {
  label: string;
  gap: (count: string) => string;
  stopped: ControlStatus[];
}[] = [
  { label: "Requirement", gap: (count) => `${count} to map`, stopped: ["no_requirement"] },
  { label: "Evidence", gap: (count) => `${count} need evidence`, stopped: ["no_evidence"] },
  { label: "Assessed", gap: (count) => `${count} to assess`, stopped: ["not_assessed"] },
  {
    label: "Satisfied",
    gap: (count) => `${count} judged short`,
    stopped: ["other_than_satisfied", "partially_satisfied"],
  },
];

/**
 * The control baseline as it climbs the four rungs of the control status ladder: one bar with each
 * status to scale in the map's marks, then the whole and each rung's count with what stopped under
 * it. Every number is a link to the Controls part's Status view asked for exactly the controls it
 * counts (the whole opens the view itself), and a zero is no link. The kit's Climb draws the same form;
 * its numbers are text, so the climb is composed from Tally and links until Climb takes them.
 */
function BaselineClimb({ programId }: { programId: string }) {
  const { formatNumber } = useLedgerLocale();
  const counts = useProgramsControlStatusCounts([programId]);
  const totals = counts.data?.get(programId);
  const listLink = (statuses: readonly ControlStatus[]) => (
    <Link
      to="/programs/$programId"
      params={{ programId }}
      search={controlStatusListSearch({ statuses }) as never}
    />
  );
  const number = (value: number, link: ReactElement) =>
    value > 0 ? (
      <TextLink tone="neutral" render={link}>
        {formatNumber(value)}
      </TextLink>
    ) : (
      formatNumber(value)
    );
  // Each rung's count is the whole less what stopped under it and under every rung before.
  let reached = totals?.total ?? 0;
  const rungs = RUNGS.map((rung, index) => {
    const gap = rung.stopped.reduce((sum, status) => sum + (totals?.counts[status] ?? 0), 0);
    reached -= gap;
    // What reached the rung: every status past those that stopped under it or before it.
    const past = CONTROL_STATUS_ORDER.filter(
      (status) => !RUNGS.slice(0, index + 1).some((before) => before.stopped.includes(status)),
    );
    return { ...rung, gapCount: gap, reached, past };
  });
  return (
    <QueryState queries={[counts]}>
      {totals?.baseline && (
        <Section title="Control status">
          <Stack space="space.150" className="min-w-0">
            <ControlStatusTally
              status={totals}
              order="climb"
              label="Control baseline by control status"
            />
            <Inline as="ol" shouldWrap space="space.400" rowSpace="space.200">
              <Stack as="li" space="space.025">
                <Text size="large" weight="semibold" numeric>
                  {number(
                    totals.total,
                    <Link
                      to="/programs/$programId"
                      params={{ programId }}
                      search={controlsViewSearch("Status")}
                    />,
                  )}
                </Text>
                <Text size="small" color="color.text.subtle">
                  Control baseline
                </Text>
              </Stack>
              {rungs.map((rung) => (
                <Stack as="li" key={rung.label} space="space.025">
                  <Text size="large" weight="semibold" numeric>
                    {number(rung.reached, listLink(rung.past))}
                  </Text>
                  <Text size="small" color="color.text.subtle">
                    {rung.label}
                  </Text>
                  {rung.gapCount > 0 && (
                    <Text size="small">
                      <TextLink render={listLink(rung.stopped)}>
                        {rung.gap(formatNumber(rung.gapCount))}
                      </TextLink>
                    </Text>
                  )}
                </Stack>
              ))}
            </Inline>
          </Stack>
        </Section>
      )}
    </QueryState>
  );
}

/* ---------- Decisions: the program's authorization decisions, in RMF's words ---------- */

function AuthorizationDecisions({
  programId,
  systems,
}: {
  programId: string;
  systems: readonly ProgramSystem[] | undefined;
}) {
  // Every column: the preview holds the rationale and the conditions as written.
  const decisions = useRows("authorization_decisions", {
    "package_revisions.authorization_packages.program_id": programId,
  });
  const authorization = useProgramAuthorization(programId);
  const { packages } = useAuthorizationRecords(programId);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  const [selection, setSelection] = useState<DataRecord | null>(null);
  const current =
    selection &&
    ((decisions.data as DataRecord[] | undefined)?.find((row) => row.id === selection.id) ??
      selection);
  const versions = authorization.versions.data;
  const decidedOn = useMemo(() => {
    const versionOf = new Map((versions ?? []).map((version) => [version.id, version]));
    const packageOf = new Map((packages.data ?? []).map((row) => [row.id, row]));
    return (revisionId: unknown) => {
      const version = versionOf.get(String(revisionId));
      const pkg = version && packageOf.get(version.package_id);
      return version && pkg
        ? { name: `${pkg.title} · version ${version.version_number}`, systemId: pkg.system_id }
        : undefined;
    };
  }, [versions, packages.data]);
  const codes = useMemo(
    () => new Map((systems ?? []).map((system) => [system.id, system.code])),
    [systems],
  );
  const columns = useMemo<DisplayColumn[]>(
    () => [
      {
        key: "package",
        label: "Package version",
        value: (row) => decidedOn(row["package_revision_id"])?.name ?? "Package version",
      },
      { key: "decision", label: "Decision", width: 220 },
      {
        key: "system",
        label: "System",
        value: (row) => {
          const systemId = decidedOn(row["package_revision_id"])?.systemId;
          return systemId ? (codes.get(systemId) ?? null) : null;
        },
      },
      { key: "decision_maker_party_id", label: "Decision maker", kind: "person" },
      { key: "decided_at", label: "Decided" },
      { key: "expires_on", label: "Expires" },
    ],
    [decidedOn, codes],
  );
  return (
    <>
      <ModelTable
        model="authorization_decisions"
        rows={(decisions.data ?? []) as DataRecord[]}
        queries={[decisions, authorization.versions, packages]}
        view="program-authorization-decisions"
        searchLabel="Find authorization decisions"
        columns={columns}
        onPreview={setSelection}
        selectedId={selection?.id}
        onDisplayedRowsChange={setDisplayed}
        fill
        empty={{
          illustration: "document",
          title: "No authorization decisions yet",
          description: "A decision is recorded on a published package version.",
        }}
      />
      {current && (
        <RecordPreviewPanel
          title={decidedOn(current["package_revision_id"])?.name ?? "Authorization decision"}
          label="Authorization decision preview"
          defaultWidth={480}
          onClose={() => setSelection(null)}
          navigation={
            <RecordPreviewActions
              table="authorization_decisions"
              record={current}
              rows={displayed}
              onSelect={setSelection}
            />
          }
        >
          <AuthorizationDecisionFacts record={current} />
        </RecordPreviewPanel>
      )}
    </>
  );
}

/* ---------- Package: the program's authorization packages ---------- */

function AuthorizationPackages({
  programId,
  systems,
}: {
  programId: string;
  systems: UseQueryResult<ProgramSystem[], Error>;
}) {
  const ids = useMemo(() => (systems.data ?? []).map((system) => system.id), [systems.data]);
  return (
    <QueryState queries={[systems]}>
      {systems.data && (
        <ProgramCollection
          name="authorization_packages"
          fill
          empty={{ title: "No authorization packages yet" }}
          title="Authorization packages"
          filters={{ program_id: programId }}
          initialValues={ids.length === 1 ? { system_id: ids[0]! } : undefined}
          columns={[
            { key: "title", title: "Package" },
            { key: "updated_at", title: "Updated" },
          ]}
          canCreate={ids.length > 0}
          prerequisite="An authorization package covers a system. Create a system first."
        />
      )}
    </QueryState>
  );
}
