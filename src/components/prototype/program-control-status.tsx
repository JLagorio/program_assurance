// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words. Redrawn in wave 10 as the
// Controls part's Status view (the board controls.html; once the Control status focused view,
// whose address now opens it).
//
// Controls › Status says where the program stands on each control of its control baseline, which
// the Control baseline view does not. It opens with the standing: how many controls are satisfied
// of the baseline ("176 of 560", a `Stat`), the whole as one bar (`ControlStatusTally`), then the
// ladder's counts in its rungs, each status's count a key line and each rung's tick the controls
// that reached it: 13 Other than satisfied, 34 Partially satisfied, 223 assessed; 89 Not assessed,
// 312 with evidence; 234 No evidence, 546 mapped; 14 No requirement. Every count is a link that
// opens the register asked for exactly the controls it counts (`controlStatusListSearch` in
// control-status-link), and a zero is no link. Under it, side by side where the work area has room
// (an `@container` grid) and one under the other where it has not: the control families, a row a
// family with its code, how many of its controls stand at the statuses the register asks for (every
// control while it asks none) and its controls as one bar on a scale the families share, the most
// first, each code a link that asks the register for that family (the family asked already marked
// current, its link asking for every family again); and the register, the baseline's controls: the
// control by its code and title, its Control status, its Objectives (how many it counts, over one bar
// of how many are mapped, with evidence and assessed), the Requirements whose latest revision maps
// it by code (`useProgramControlRequirements` in control-requirements), Determined by (Program
// assessment or Product assessment, Absent while nobody has determined it) and its Control family,
// with Control status, Determined by and Control family as its filters. Its question lives in the
// address under its view (`program-control-status`, in register-views), so every count that links
// to it opens what it counts. A responsible role is not drawn: the schema records a responsible
// party on a control's implementation in an SSP, not a role, and the demo programs record none. One
// read answers the band, the families and the register, `program_control_status`.
// Reference: program-control-status.

import { useId, useMemo, type ReactElement, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Box,
  DataTable,
  Grid,
  Inline,
  Stack,
  Stat,
  Tally,
  Text,
  TextLink,
  TileMapKey,
  VisuallyHidden,
  defineColumns,
  useLedgerLocale,
  type TallySegment,
} from "@ledger/design-system";
import { StatusBadge } from "@/components/app/status";
import { useProgramControlRequirements } from "@/lib/control-requirements";
import {
  CONTROL_STATUS_ORDER,
  controlStatusFamilies,
  useProgramControlStatus,
  type ControlStanding,
  type ControlStatus,
  type ControlStatusCounts,
  type ControlStatusFamily,
  type ProgramControlStatus,
} from "@/lib/control-status";
import { registerViews } from "@/lib/register-views";
import { controlDeterminers, controlStatuses } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { controlStatusListSearch } from "./control-status-link";
import { ControlStatusTally } from "./control-status";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/** A family as the register's column and filter name it: its code and its name, "AC Access Control". */
const familyName = (code: string | null, title: string | null) =>
  [code ?? "Other", title].filter(Boolean).join(" ");

/** How each status is drawn in a key line: the marks of the map, the tally and the Overview's key. */
const keyMarks = {
  satisfied: { tone: "success", fill: "solid" },
  partially_satisfied: { tone: "warning", fill: "solid" },
  other_than_satisfied: { tone: "danger", fill: "solid" },
  not_assessed: { tone: "sequential.2", fill: "solid" },
  no_evidence: { tone: "neutral", fill: "outline" },
  no_requirement: { tone: "neutral", fill: "empty" },
} as const satisfies Record<ControlStatus, Pick<TallySegment, "tone" | "fill">>;

/**
 * The ladder's rungs as the band reads them, from the top: the statuses that stopped under each,
 * and the words of the controls that reached it. The last rung has no tick: nothing is under it.
 */
const RUNGS: readonly { stopped: readonly ControlStatus[]; reached?: string }[] = [
  { stopped: ["other_than_satisfied", "partially_satisfied"], reached: "assessed" },
  { stopped: ["not_assessed"], reached: "with evidence" },
  { stopped: ["no_evidence"], reached: "mapped" },
  { stopped: ["no_requirement"] },
];

/** The statuses at or above a rung: what reached it, from the ladder's top down to its gap. */
const reachedAt = (index: number): ControlStatus[] => [
  "satisfied",
  ...RUNGS.slice(0, index + 1).flatMap((rung) => rung.stopped),
];

/** A link into the register, asked for the controls at some statuses. */
type ListLink = (
  statuses: readonly ControlStatus[],
) => ReactElement<{ className?: string | undefined; children?: ReactNode }>;

/**
 * Where the program stands on its baseline: how many controls are satisfied of how many, the whole
 * as one bar, then each rung's statuses as key lines with their counts and the controls that
 * reached it. Every count opens the register asked for the controls it counts; a zero is no link.
 */
function ControlStanding({ status, link }: { status: ProgramControlStatus; link: ListLink }) {
  const { formatNumber } = useLedgerLocale();
  const count = (statuses: readonly ControlStatus[]) =>
    statuses.reduce((sum, key) => sum + status.counts[key], 0);
  const number = (statuses: readonly ControlStatus[]) => {
    const value = count(statuses);
    return value > 0 ? (
      <TextLink tone="neutral" render={link(statuses)}>
        {formatNumber(value)}
      </TextLink>
    ) : (
      formatNumber(value)
    );
  };
  return (
    <Stack space="space.150" className="min-w-0">
      <Stat
        label="Controls satisfied"
        value={
          <>
            {number(["satisfied"])} of {formatNumber(status.total)}
          </>
        }
      />
      <ControlStatusTally
        status={status}
        size="xlarge"
        label="Control baseline by control status"
      />
      <Inline as="ol" shouldWrap space="space.400" rowSpace="space.150">
        {RUNGS.map((rung, index) => (
          <Stack as="li" key={rung.stopped.join()} space="space.050">
            <TileMapKey
              aria-label={rung.stopped.map((key) => controlStatuses[key].label).join(", ")}
              items={rung.stopped.map((key) => ({
                label: controlStatuses[key].label,
                value: formatNumber(status.counts[key]),
                ...keyMarks[key],
                ...(status.counts[key] > 0 ? { link: link([key]) } : {}),
              }))}
            />
            {rung.reached && (
              <Text size="small" color="color.text.subtle">
                {number(reachedAt(index))} {rung.reached}
              </Text>
            )}
          </Stack>
        ))}
      </Inline>
    </Stack>
  );
}

/** A family as its row reads it: its controls and enhancements together, and their counts. */
type FamilyLine = {
  code: string;
  name: string;
  total: number;
  counts: ControlStatusCounts;
  /** Its controls at the statuses the register asks for; all of them while it asks none. */
  asked: number;
};

const byCode = new Intl.Collator("en", { numeric: true }).compare;

/** A family's controls and enhancements, counted by status. */
function familyLine(family: ControlStatusFamily, statuses: readonly ControlStatus[]): FamilyLine {
  const counts = Object.fromEntries(CONTROL_STATUS_ORDER.map((key) => [key, 0])) as Record<
    ControlStatus,
    number
  >;
  for (const control of family.controls)
    for (const each of [control, ...control.enhancements]) counts[each.status] += 1;
  return {
    code: family.code,
    name: familyName(family.code, family.title),
    total: family.total,
    counts,
    asked: statuses.length ? statuses.reduce((sum, key) => sum + counts[key], 0) : family.total,
  };
}

/**
 * The control families, a row a family: its code, how many of its controls stand at the statuses
 * the register asks for, and its controls as one bar on a scale the families share, the most
 * first. A family with none there is left out. A code asks the register for its family; the family
 * asked is current, and its code asks for every family again.
 */
function FamilyRows({
  programId,
  families,
  statuses,
  family,
}: {
  programId: string;
  families: readonly ControlStatusFamily[];
  statuses: readonly ControlStatus[];
  family: string | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const heading = useId();
  const lines = useMemo(
    () =>
      families
        .map((each) => familyLine(each, statuses))
        .filter((line) => line.asked > 0)
        .sort((a, b) => b.asked - a.asked || byCode(a.code, b.code)),
    [families, statuses],
  );
  const largest = Math.max(1, ...families.map((each) => each.total));
  const asked = statuses.length
    ? statuses.map((key) => controlStatuses[key].label).join(", ")
    : "Controls";
  return (
    <Stack space="space.100" className="min-w-0">
      <Text id={heading} size="small" weight="medium" color="color.text.subtle">
        {asked} by family
      </Text>
      <Stack as="ul" space="space.025" aria-labelledby={heading}>
        {lines.map((line) => {
          const current = line.name === family;
          return (
            <Box
              as="li"
              key={line.code}
              paddingInline="space.075"
              {...(current
                ? { backgroundColor: "color.background.current", className: "rounded-small" }
                : {})}
            >
              <Grid
                templateColumns="3.5rem 2.5rem minmax(0, 1fr)"
                columnGap="space.100"
                alignItems="center"
              >
                <TextLink
                  tone="neutral"
                  render={
                    <Link
                      to="/programs/$programId"
                      params={{ programId }}
                      search={
                        controlStatusListSearch({
                          statuses,
                          family: current ? undefined : line.name,
                        }) as never
                      }
                      aria-current={current ? "true" : undefined}
                      resetScroll={false}
                    />
                  }
                >
                  {line.code}
                  <VisuallyHidden> {line.name.slice(line.code.length)}</VisuallyHidden>
                </TextLink>
                <Text size="small" numeric align="end">
                  {formatNumber(line.asked)}
                </Text>
                <ControlStatusTally
                  status={line}
                  size="large"
                  scale={line.total / largest}
                  label={`${line.name}: ${formatNumber(line.total)} controls by control status`}
                />
              </Grid>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

/** A row of the register: a control with its name, its family and its requirements' codes. */
type ControlRow = ControlStanding & { name: string; family: string; requirementCodes: string[] };

/**
 * How far a control's assessment objectives have climbed, as one bar: assessed, with evidence and
 * waiting on an assessor, mapped with no evidence, and not mapped, each in the mark of the control
 * status it would give a control.
 */
function ObjectiveClimb({ control }: { control: ControlStanding }) {
  const { formatNumber } = useLedgerLocale();
  const { objectives, objectivesMapped, objectivesEvidenced, objectivesAssessed } = control;
  if (objectives === 0) return <Absent label="No assessment objectives" />;
  const evidenced = Math.max(0, objectivesEvidenced - objectivesAssessed);
  const mapped = Math.max(0, objectivesMapped - objectivesEvidenced);
  const segments: TallySegment[] = [
    { key: "assessed", value: objectivesAssessed, tone: "sequential.4", fill: "solid" },
    { key: "evidenced", value: evidenced, ...keyMarks.not_assessed },
    { key: "mapped", value: mapped, ...keyMarks.no_evidence },
  ];
  return (
    <Inline space="space.100" alignBlock="center" className="min-w-0">
      <Text numeric>{formatNumber(objectives)}</Text>
      <Box className="min-w-0 flex-1">
        <Tally
          segments={segments}
          total={objectives}
          size="large"
          label={`${formatNumber(objectives)} objectives: ${formatNumber(objectivesMapped)} mapped, ${formatNumber(objectivesEvidenced)} with evidence, ${formatNumber(objectivesAssessed)} assessed`}
        />
      </Box>
    </Inline>
  );
}

const registerColumns = (programId: string) =>
  defineColumns<ControlRow>((c) => [
    c.text("name", {
      header: "Control",
      priority: 0,
      minWidth: 240,
      hideable: false,
      cell: (row) => (
        <RecordLink table="controls" record={{ id: row.id, program_id: programId }}>
          {row.name}
        </RecordLink>
      ),
    }),
    c.status("status", {
      header: "Control status",
      width: 170,
      priority: 1,
      statuses: controlStatuses,
    }),
    // How many assessment objectives the control counts, over how far they have climbed.
    c.number("objectives", {
      header: "Objectives",
      width: 150,
      priority: 3,
      cell: (row) => <ObjectiveClimb control={row} />,
    }),
    // The requirements whose latest revision maps the control, by code.
    c.list("requirementCodes", {
      header: "Requirements",
      width: 150,
      priority: 2,
      searchable: true,
      items: (row) => row.requirementCodes.map((code) => ({ key: code, label: code })),
      empty: () => <Absent label="No requirement" />,
    }),
    // Whose determination the status is; a control nobody has determined is not determined yet.
    c.status("determinedBy", {
      header: "Determined by",
      width: 170,
      priority: 4,
      statuses: controlDeterminers,
      cell: (row) => (
        <StatusBadge
          statuses={controlDeterminers}
          value={row.determinedBy}
          size="xsmall"
          absentLabel="Not determined"
        />
      ),
    }),
    c.text("family", { header: "Control family", width: 260, priority: 5 }),
  ]);

/** A filter's values as the register's question holds them: a list, or nothing. */
const filterValues = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((each): each is string => typeof each === "string") : [];

/**
 * The control families beside the register of the baseline's controls. The families count what the
 * register asks for and ask it for a family; the register's question lives in the address.
 */
function ControlStatusRegister({
  programId,
  status,
}: {
  programId: string;
  status: ProgramControlStatus;
}) {
  const requirements = useProgramControlRequirements(programId);
  const rows = useMemo<ControlRow[]>(
    () =>
      status.controls.map((control) => ({
        ...control,
        name: `${control.code} ${control.title}`,
        family: familyName(control.family, control.familyTitle),
        requirementCodes: requirements.byControl?.get(control.id) ?? [],
      })),
    [status.controls, requirements.byControl],
  );
  const columns = useMemo(() => registerColumns(programId), [programId]);
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Controls in the control baseline",
    view: registerViews.controlStatus,
  });
  const openRecord = useOpenRecord();
  const families = useMemo(() => controlStatusFamilies(status.controls), [status.controls]);
  // What the register asks for, which the families count and keep when one is chosen.
  const filters = table.state.columnFilters;
  const statuses = filterValues(filters.find((filter) => filter.id === "status")?.value).filter(
    (key): key is ControlStatus => key in controlStatuses,
  );
  const family = filterValues(filters.find((filter) => filter.id === "family")?.value)[0];
  return (
    <Box className="@container min-w-0">
      <Grid gap="space.300" alignItems="start" className="grid-cols-1 @4xl:grid-cols-4">
        <FamilyRows programId={programId} families={families} statuses={statuses} family={family} />
        <Box className="min-w-0 @4xl:col-span-3">
          <ProductCollection
            table={table}
            queries={requirements.queries}
            onRowClick={(row) => openRecord("controls", { id: row.id, program_id: programId })}
            searchLabel="Find controls"
            filters={
              <>
                <DataTable.Filter table={table} column="status" />
                <DataTable.Filter table={table} column="determinedBy" />
                <DataTable.Filter table={table} column="family" />
              </>
            }
            empty={{
              title: "No controls to show",
              description: "The control baseline selects no control.",
            }}
          />
        </Box>
      </Grid>
    </Box>
  );
}

/**
 * The Controls part's Status view: where the program stands on every control of its control
 * baseline, as the standing, the families and the register. One read answers all three,
 * `program_control_status`.
 */
export function ProgramControlStatusView({ programId }: { programId: string }) {
  const status = useProgramControlStatus(programId);
  const link = useMemo<ListLink>(
    () => (statuses) => (
      <Link
        to="/programs/$programId"
        params={{ programId }}
        search={controlStatusListSearch({ statuses }) as never}
        resetScroll={false}
      />
    ),
    [programId],
  );
  const data = status.data;
  return (
    <QueryState queries={[status]}>
      {!data ? null : !data.baseline ? (
        <EmptyMessage
          illustration="document"
          title="No control baseline recorded"
          description="A program made outside setup records no baseline choice."
        />
      ) : (
        <Stack space="space.300" className="min-w-0">
          <ControlStanding status={data} link={link} />
          <ControlStatusRegister programId={programId} status={data} />
        </Stack>
      )}
    </QueryState>
  );
}
