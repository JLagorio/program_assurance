import { useCallback, useMemo, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  Absent,
  Chart,
  KeyValue,
  List,
  Scroller,
  ScrollerArrow,
  ScrollerViewport,
  Skeleton,
  Stack,
  Stat,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  useLedgerLocale,
  type HeatmapSelection,
  type HeatmapStatus,
} from "@ledger/design-system";
import {
  POSTURE_COLUMNS,
  POSTURE_READINGS,
  familyColumns,
  postureCells,
  postureLeftOut,
  postureRows,
  postureSeverity,
  postureValue,
  techniqueColumns,
  useProgramPosture,
  useProgramPostureCell,
  useProgramResiliencyPosture,
  useProgramResiliencyPostureCell,
  type PostureColumn,
  type PostureColumns,
  type PostureCounts,
  type PostureElement,
  type PostureLeftOut,
  type PostureReading,
  type PostureRow,
  type PostureTotals,
} from "@/lib/program-posture";
import { objectiveWords, objectivesOf } from "@/lib/product-records";
import { useProgramResiliencyChoice } from "@/lib/resiliency-choice";
import { severityLevels, statusLabel } from "@/lib/status";
import { RecordLink } from "./record-preview";
import { QueryState, ReportFailures } from "./work-common";

/*
 * A program's posture: its system elements down the side and, across the top, the control families
 * of their control baselines or the cyber resiliency techniques, read four ways: the assessment
 * objectives the requirements' mappings cover there, those no requirement with evidence covers,
 * open issues and open risks. The grid is a Chart.Heatmap: an element that holds others is a row of
 * totals, a cell opens what stands in it, and the same numbers are a table one toggle away.
 */

/** What a reading counts, as its toggle says it and as the frame's title does. */
const readings: Record<PostureReading, { label: string; counts: string }> = {
  objectives: { label: objectiveWords.mapped, counts: objectiveWords.mapped },
  gaps: { label: "Without evidence", counts: "Objectives without evidence" },
  issues: { label: "Open issues", counts: "Open operational issues" },
  risks: { label: "Open risks", counts: "Open risks" },
};

/** The columns' words: the toggle's, the one a column is, and a cell's card's. */
const columnWords: Record<PostureColumns, { label: string; noun: string; fact: string }> = {
  families: { label: "Control families", noun: "Control family", fact: "Family" },
  techniques: { label: "Resiliency techniques", noun: "Resiliency technique", fact: "Technique" },
};

const titleOf = (reading: PostureReading, columns: PostureColumns) =>
  `${readings[reading].counts} by system element and ${columnWords[columns].noun.toLowerCase()}`;

/** Which technique columns stand, where the program chose some: its own, or every one. */
const TECHNIQUE_SCOPES = ["chosen", "all"] as const;
type TechniqueScope = (typeof TECHNIQUE_SCOPES)[number];
const scopeLabels: Record<TechniqueScope, string> = { chosen: "Chosen", all: "All" };

/** A severity as a cell wears it. Critical is the bold danger, so it never reads as high. */
const severityFill: Record<string, HeatmapStatus> = {
  low: "neutral",
  moderate: "warning",
  high: "danger",
  critical: { tone: "danger", emphasis: "bold" },
};
const severityKey = [
  { tone: "neutral" as const, label: "Low" },
  { tone: "warning" as const, label: "Moderate" },
  { tone: "danger" as const, label: "High" },
  { tone: "danger" as const, emphasis: "bold" as const, label: "Critical" },
];

/** How many of a list a cell's card shows before it says how many more. */
const SHOWN = 6;

/**
 * One joined set of choices in the frame's header, one of them always pressed. A joined group
 * keeps one line, so in a frame narrower than its choices it scrolls in its own strip, the pressed
 * choice in view, and the page keeps its width.
 */
function Choices<Value extends string>({
  label,
  options,
  value,
  onChange,
  children,
}: {
  label: string;
  options: readonly Value[];
  value: Value;
  onChange: (value: Value) => void;
  /** What a choice reads as. */
  children: (option: Value) => ReactNode;
}) {
  return (
    <Scroller orientation="horizontal">
      <ScrollerViewport>
        <ToggleGroup
          size="small"
          spacing={0}
          variant="outline"
          aria-label={label}
          value={[value]}
          onValueChange={(next) => {
            const chosen = options.find((option) => option === next[0]);
            if (chosen) onChange(chosen);
          }}
        >
          {options.map((option) => (
            <ToggleGroupItem key={option} value={option}>
              {children(option)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ScrollerViewport>
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}

/**
 * What the frame's description says: the records the reading counts, or whose coverage it counts,
 * that stand in no cell, each kind with why. Nothing where every one is placed.
 */
function leftOutWords(
  left: PostureLeftOut,
  byTechnique: boolean,
  formatPlural: ReturnType<typeof useLedgerLocale>["formatPlural"],
): string | undefined {
  if (left.records === "requirements") {
    const sentences: string[] = [];
    if (left.unsupported > 0)
      sentences.push(
        formatPlural(left.unsupported, {
          one: "{count} requirement is not placed: its controls support no resiliency technique.",
          other:
            "{count} requirements are not placed: their controls support no resiliency technique.",
        }),
      );
    if (left.unplaced > 0)
      sentences.push(
        formatPlural(left.unplaced, {
          one: "{count} requirement is not placed: none of its mappings is on an element whose control baseline selects the control.",
          other:
            "{count} requirements are not placed: none of their mappings is on an element whose control baseline selects the control.",
        }),
      );
    return sentences.join(" ") || undefined;
  }
  if (left.unplaced <= 0) return undefined;
  // An issue stands where the requirements it names and those its evidence supports stand, and a
  // requirement where its mappings stand; by technique, under a technique its controls support.
  const where = byTechnique ? "under a resiliency technique" : "on a system element";
  return left.records === "issues"
    ? formatPlural(left.unplaced, {
        one: `{count} open issue is not placed: no requirement it names or its evidence supports stands ${where}.`,
        other: `{count} open issues are not placed: no requirement they name or their evidence supports stands ${where}.`,
      })
    : formatPlural(left.unplaced, {
        one: `{count} open risk is not placed: no requirement its issues name or their evidence supports stands ${where}.`,
        other: `{count} open risks are not placed: no requirement their issues name or their evidence supports stands ${where}.`,
      });
}

/** A posture as the grid draws it: the same elements and counts, by family or by technique. */
type Grid = {
  kind: PostureColumns;
  elements: readonly PostureElement[];
  columns: PostureColumn[];
  cells: Map<string, PostureCounts>;
  totals: PostureTotals;
};

/**
 * What stands in a chosen cell: under objectives, the controls whose objectives stand there, each
 * with how many of all it counts; without evidence, the requirements to evidence, each with how many
 * of those objectives it covers; under issues or risks, the records. Each is a link to its page:
 * an objective has none of its own, and its control's record lists it with its coverage.
 */
function CellRecords({
  programId,
  kind,
  row,
  column,
  reading,
}: {
  programId: string;
  kind: PostureColumns;
  row: PostureRow;
  column: PostureColumn;
  reading: PostureReading;
}) {
  const { formatNumber } = useLedgerLocale();
  // A cell's records are read by what its column is; the other read is not asked.
  const byFamily = useProgramPostureCell(
    programId,
    kind === "families" ? { elementId: row.element.id, familyId: column.key } : null,
  );
  const byTechnique = useProgramResiliencyPostureCell(
    programId,
    kind === "techniques" ? { elementId: row.element.id, techniqueCode: column.key } : null,
  );
  const detail = kind === "techniques" ? byTechnique : byFamily;
  const data = detail.data;
  const more = (total: number) =>
    total > SHOWN ? (
      <Text size="small" color="color.text.subtle">
        and {formatNumber(total - SHOWN)} more
      </Text>
    ) : null;
  return (
    <Stack space="space.150">
      <KeyValue.Group labelWidth="wide">
        <KeyValue label="Element" wrap>
          <RecordLink table="systems" record={{ id: row.element.id, program_id: programId }}>
            {row.element.name}
          </RecordLink>
        </KeyValue>
        <KeyValue label={columnWords[kind].fact} wrap>
          {column.title}
        </KeyValue>
        <KeyValue label={objectiveWords.mapped}>
          {data ? formatNumber(data.objectives) : <Skeleton shape="line" width={32} />}
        </KeyValue>
        <KeyValue label={objectiveWords.evidenced}>
          {data ? formatNumber(data.evidenced) : <Skeleton shape="line" width={32} />}
        </KeyValue>
      </KeyValue.Group>
      {/* The card is drawn outside the page's region, so it says its own failure, with Retry. */}
      <QueryState query={detail}>
        {data && reading === "issues" && (
          <List>
            {data.issues.slice(0, SHOWN).map((issue) => (
              <List.Item key={issue.id}>
                <RecordLink table="operational_issues" record={issue}>
                  {issue.title}
                </RecordLink>{" "}
                <Text size="small" color="color.text.subtle">
                  · {statusLabel(severityLevels, issue.severity)}
                </Text>
              </List.Item>
            ))}
          </List>
        )}
        {data && reading === "issues" && more(data.issues.length)}
        {data && reading === "risks" && (
          <List>
            {data.risks.slice(0, SHOWN).map((risk) => (
              <List.Item key={risk.id}>
                <RecordLink table="risks" record={risk}>
                  {risk.title}
                </RecordLink>{" "}
                <Text size="small" color="color.text.subtle">
                  · {statusLabel(severityLevels, risk.severity)}
                </Text>
              </List.Item>
            ))}
          </List>
        )}
        {data && reading === "risks" && more(data.risks.length)}
        {data && reading === "gaps" && (
          <List>
            {data.unevidenced.slice(0, SHOWN).map((requirement) => (
              <List.Item key={requirement.id}>
                <RecordLink
                  table="engineering_requirements"
                  record={{ id: requirement.id, program_id: programId }}
                >
                  {requirement.code} · {requirement.title}
                </RecordLink>{" "}
                <Text size="small" color="color.text.subtle">
                  · {formatNumber(requirement.objectives)} without evidence
                </Text>
              </List.Item>
            ))}
          </List>
        )}
        {data && reading === "gaps" && more(data.unevidenced_count)}
        {data && reading === "objectives" && (
          <List>
            {data.controls.slice(0, SHOWN).map((control) => (
              <List.Item key={control.id}>
                <RecordLink table="controls" record={{ id: control.id, program_id: programId }}>
                  {control.code} · {control.title}
                </RecordLink>{" "}
                <Text size="small" color="color.text.subtle">
                  · {objectivesOf(formatNumber(control.objectives), formatNumber(control.total))}
                </Text>
              </List.Item>
            ))}
          </List>
        )}
        {data && reading === "objectives" && more(data.controls.length)}
      </QueryState>
    </Stack>
  );
}

function PostureGrid({
  programId,
  grid,
  busy,
  reading,
  onReadingChange,
  columns,
  onColumnsChange,
  scope,
  onScopeChange,
}: {
  programId: string;
  grid: Grid;
  /** The columns the reader asked for are on their way: the grid drawn is the one they had. */
  busy: boolean;
  reading: PostureReading;
  onReadingChange: (reading: PostureReading) => void;
  /** The columns the reader asked for, which the grid drawn follows once they are read. */
  columns: PostureColumns;
  onColumnsChange: (columns: PostureColumns) => void;
  /** Which technique columns stand; absent where the program chose none, and by family. */
  scope?: TechniqueScope | undefined;
  onScopeChange: (scope: TechniqueScope) => void;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const rows = useMemo(() => postureRows(grid.elements), [grid.elements]);
  const byRow = useMemo(() => new Map(rows.map((row) => [row.name, row])), [rows]);
  const byColumn = useMemo(
    () => new Map(grid.columns.map((column) => [column.name, column])),
    [grid.columns],
  );
  const rowNames = useMemo(() => rows.map((row) => row.name), [rows]);
  const columnNames = useMemo(() => grid.columns.map((column) => column.name), [grid.columns]);
  const cellAt = useCallback(
    (row: string, column: string) => {
      const element = byRow.get(row)?.element;
      const key = byColumn.get(column)?.key;
      return element && key ? grid.cells.get(`${element.id}:${key}`) : undefined;
    },
    [byRow, byColumn, grid.cells],
  );
  const status = reading === "issues" || reading === "risks";
  const value = useCallback(
    (row: string, column: string) => {
      const cell = cellAt(row, column);
      // Nothing to evidence there is not "no gap": the cell has no value. Counted any other way,
      // an element with no requirement of the column holds none.
      if (!cell) return reading === "gaps" ? undefined : 0;
      return postureValue(reading, cell);
    },
    [cellAt, reading],
  );
  const tone = useCallback(
    (_: number, row: string, column: string): HeatmapStatus => {
      const cell = cellAt(row, column);
      const severity = cell ? postureSeverity(reading, cell) : null;
      return (severity && severityFill[severity]) || "neutral";
    },
    [cellAt, reading],
  );
  // The scale's top is the fullest cell of an element that holds no other: a total is a number,
  // not a step, and would flatten every cell under it.
  const top = useMemo(() => {
    let most = 0;
    for (const row of rows)
      if (!row.summary)
        for (const name of columnNames) most = Math.max(most, value(row.name, name) ?? 0);
    // A multiple of five, so the key's five steps start on whole numbers.
    return Math.max(5, Math.ceil(most / 5) * 5);
  }, [rows, columnNames, value]);
  // What the grid does not place. The technique columns shown are the reader's choice; a record
  // that is not placed stands under no technique at all.
  const description = leftOutWords(
    postureLeftOut(reading, grid.totals),
    grid.kind === "techniques",
    formatPlural,
  );
  const title = titleOf(reading, grid.kind);
  return (
    <Chart
      title={title}
      description={description}
      state={busy ? "refreshing" : "ready"}
      download={["csv"]}
      xLabel="System element"
      format={(count) => formatNumber(count)}
      actions={
        <>
          <Choices
            label="Count"
            options={POSTURE_READINGS}
            value={reading}
            onChange={onReadingChange}
          >
            {(name) => readings[name].label}
          </Choices>
          <Choices
            label="Columns"
            options={POSTURE_COLUMNS}
            value={columns}
            onChange={onColumnsChange}
          >
            {(name) => columnWords[name].label}
          </Choices>
          {scope && (
            <Choices
              label="Techniques"
              options={TECHNIQUE_SCOPES}
              value={scope}
              onChange={onScopeChange}
            >
              {(name) => scopeLabels[name]}
            </Choices>
          )}
        </>
      }
    >
      <Stack space="space.150">
        <Chart.Heatmap
          rows={rowNames}
          columns={columnNames}
          value={value}
          scale={status ? tone : "sequential"}
          {...(status ? {} : { domain: [0, top] as const })}
          zeroStep
          size="small"
          label={title}
          rowLabel="System element"
          columnLabel={columnWords[grid.kind].noun}
          // A technique has no short name, so its title reads up the page over a narrow column.
          columnHeadings={grid.kind === "techniques" ? "vertical" : "horizontal"}
          rowLevel={(row) => byRow.get(row)?.level ?? 0}
          summary={(row) => byRow.get(row)?.summary ?? false}
          details={(selection: HeatmapSelection) => {
            const row = byRow.get(selection.row);
            const column = byColumn.get(selection.column);
            return row && column ? (
              <CellRecords
                programId={programId}
                kind={grid.kind}
                row={row}
                column={column}
                reading={reading}
              />
            ) : null;
          }}
        />
        {status ? (
          <Chart.Scale scale="status" steps={severityKey} />
        ) : (
          <Chart.Scale scale="sequential" domain={[0, top]} zeroStep />
        )}
      </Stack>
    </Chart>
  );
}

// The Posture's own route, whose address keeps what the grid's columns are. The program workspace
// hands the reading down; the columns are read here.
const route = getRouteApi("/programs/$programId_/posture");

/**
 * The program's Posture view: four numbers that say where the program stands (its control
 * baseline's objectives as its control status counts them, then open issues and open risks), then
 * the grid, by control family or by resiliency technique, read as objectives mapped, objectives
 * without evidence, open issues or open risks. The reading and the columns are the address's, so a
 * shared link opens the same grid.
 */
export function ProgramPosture({
  programId,
  reading = "issues",
  onReadingChange,
}: {
  programId: string;
  reading?: PostureReading | undefined;
  onReadingChange: (reading: PostureReading) => void;
}) {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const byTechnique = search.columns === "techniques";
  const columns: PostureColumns = byTechnique ? "techniques" : "families";
  // One posture is asked for, the one the columns name; the other is kept once it has been read.
  const families = useProgramPosture(programId, { enabled: !byTechnique });
  const techniques = useProgramResiliencyPosture(programId, { enabled: byTechnique });
  // The techniques the program chose for SA-24 decide which technique columns stand.
  const choice = useProgramResiliencyChoice(byTechnique ? programId : null);
  const chosen = choice.isPlaceholderData ? undefined : choice.data?.techniques;
  const wanted = byTechnique ? techniques : families;

  const familyGrid = useMemo<Grid | null>(
    () =>
      families.data
        ? {
            kind: "families",
            elements: families.data.elements,
            columns: familyColumns(families.data.families),
            cells: postureCells(families.data),
            totals: families.data.totals,
          }
        : null,
    [families.data],
  );
  // The program's own techniques among the framework's; none where it chose none it names.
  const own = useMemo(
    () => (techniques.data ? techniqueColumns(techniques.data.techniques, chosen ?? []) : []),
    [techniques.data, chosen],
  );
  const scope: TechniqueScope | undefined =
    own.length === 0 ? undefined : search.techniques === "all" ? "all" : "chosen";
  const techniqueGrid = useMemo<Grid | null>(
    () =>
      techniques.data
        ? {
            kind: "techniques",
            elements: techniques.data.elements,
            columns: scope === "chosen" ? own : techniqueColumns(techniques.data.techniques),
            cells: postureCells(techniques.data),
            totals: techniques.data.totals,
          }
        : null,
    [techniques.data, own, scope],
  );
  // The technique columns wait for the program's choice: its answer, or its failure, which
  // leaves every technique standing and is the page's alert to say.
  const settled = byTechnique
    ? techniqueGrid !== null && (chosen !== undefined || choice.isError)
    : familyGrid !== null;
  // The grid the reader had stays while the other columns are read, and under the page's alert
  // when they cannot be.
  const grid = settled
    ? byTechnique
      ? techniqueGrid
      : familyGrid
    : byTechnique
      ? familyGrid
      : techniqueGrid;

  // The band's numbers are counted alike by both postures, so it reads whichever has answered.
  const totals = (wanted.data ?? (byTechnique ? families.data : techniques.data))?.totals;
  const loading = totals === undefined && !wanted.isError;
  // A count that could not load says so; it never reads as zero.
  const failed = totals === undefined && wanted.isError;
  const { formatNumber } = useLedgerLocale();
  const count = (value: number | undefined) =>
    failed ? <Absent label="Not available" /> : value === undefined ? 0 : value;
  const unread = failed ? "Could not load" : undefined;
  return (
    <Stack space="space.300" className="min-w-0">
      <Stat.Grid frame="band" cols={4} aria-label="Where the program stands">
        {/* The control baseline's objectives as the Control status view counts them: one is
            mapped once covered on every system that selects its control. */}
        <Stat.Tile
          label={objectiveWords.mapped}
          value={count(totals?.mapped)}
          note={
            totals
              ? totals.objectives > 0
                ? `of ${formatNumber(totals.objectives)} in the control baseline`
                : "No control baseline"
              : unread
          }
          isLoading={loading}
        />
        <Stat.Tile
          label="Without evidence"
          value={count(totals && totals.mapped - totals.evidenced)}
          note={
            totals
              ? `${formatNumber(totals.evidenced)} of ${formatNumber(totals.mapped)} have evidence`
              : unread
          }
          tone={totals && totals.mapped > totals.evidenced ? "warning" : "neutral"}
          isLoading={loading}
        />
        <Stat.Tile
          label="Open issues"
          value={count(totals?.issues)}
          note={totals ? `${formatNumber(totals.issues_severe)} high or critical` : unread}
          tone={totals?.issues_severe ? "danger" : "neutral"}
          isLoading={loading}
        />
        <Stat.Tile
          label="Open risks"
          value={count(totals?.risks)}
          note={totals ? `${formatNumber(totals.risks_severe)} high or critical` : unread}
          tone={totals?.risks_severe ? "danger" : "neutral"}
          isLoading={loading}
        />
      </Stat.Grid>
      {byTechnique && <ReportFailures queries={[choice]} />}
      {grid ? (
        <>
          <ReportFailures queries={[wanted]} />
          <PostureGrid
            programId={programId}
            grid={grid}
            busy={!settled && !wanted.isError}
            reading={reading}
            onReadingChange={onReadingChange}
            columns={columns}
            onColumnsChange={(next) =>
              void navigate({
                // Which techniques stand is asked of the technique columns alone.
                search: (current) => ({
                  ...current,
                  columns: next === "techniques" ? next : undefined,
                  techniques: undefined,
                }),
                resetScroll: false,
              })
            }
            // Asked of the technique columns once they are the ones drawn.
            scope={byTechnique && grid.kind === "techniques" ? scope : undefined}
            onScopeChange={(next) =>
              void navigate({
                search: (current) => ({
                  ...current,
                  techniques: next === "all" ? next : undefined,
                }),
                resetScroll: false,
              })
            }
          />
        </>
      ) : (
        <QueryState queries={byTechnique && !choice.isError ? [wanted, choice] : [wanted]} />
      )}
    </Stack>
  );
}
