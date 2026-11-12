import { useCallback, useEffect, useMemo, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
  Absent,
  announce,
  Button,
  DataTable,
  defineColumns,
  Heading,
  Inline,
  Progress,
  ProgressLabel,
  ProgressValue,
  Section,
  Stack,
  TextLink,
  ToggleGroup,
  ToggleGroupItem,
  useLedgerLocale,
  WorkPane,
} from "@ledger/design-system";
import {
  useControlRequirementCounts,
  useProgramBaselines,
  type ProgramBaseline,
} from "@/lib/baseline-reads";
import { controlStanding, layerChange, stackAt, type StackStep } from "@/lib/baseline-stack";
import {
  selectedOf,
  supportedOnce,
  techniqueControls,
  type TechniqueControls,
} from "@/lib/control-resiliency";
import {
  CYBER_RESILIENCY_FRAMEWORK,
  resiliencyByControl,
  resiliencyByTechnique,
  useFrameworkItems,
  useResiliencyControlLinks,
} from "@/lib/frameworks";
import { useRows } from "@/lib/models";
import { useProgramResiliencyChoice } from "@/lib/resiliency-choice";
import { baselineControlStatuses } from "@/lib/status";
import { BaselineMap, type BaselineFamily } from "./baseline-map";
import { BaselineStackTable, type StackRow } from "./baseline-stack";
import { useCollectionTable } from "./collection-question";
import { ResiliencyTechniqueSelect, type TechniqueOption } from "./control-resiliency";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState, ReportFailures, type QueryStatus } from "./work-common";

type BaselineStatus = keyof typeof baselineControlStatuses;
/** One value of a list cell: a technique a control supports, or an approach it supports one through. */
type Named = { key: string; label: string; meta?: string | undefined };
type ControlRow = {
  id: string;
  name: string;
  /** The family's code and name, as the list shows and filters it. */
  family: string;
  status: BaselineStatus;
  /** The layer that added or removed it; none for a control no layer changed. */
  layer: string | null;
  requirements: number;
  /**
   * What it supports in cyber resiliency: its techniques, strongest first, each with its
   * approaches as its meta; read by a technique, the approaches it supports that one through.
   */
  resiliency: readonly Named[];
};
/** How the catalog at the chosen step is shown: the map in one of its layouts, or its table. */
type View = "grid" | "skyline" | "list";
const views: { value: View; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "skyline", label: "Skyline" },
  { value: "list", label: "List" },
];
/** How long Replay holds each step. */
const REPLAY_MS = 1100;

/**
 * What the List's last column says of cyber resiliency: every control's techniques while it shows
 * all controls, the approaches of the one technique it is read by, and nothing (no column) where
 * no technique is on offer.
 */
type ResiliencyColumn = "none" | "techniques" | "approaches";

/** The List's columns. A control's name opens the control inside this program, with its trace. */
const controlColumns = (programId: string, resiliency: ResiliencyColumn) =>
  defineColumns<ControlRow>((c) => [
    c.text("name", {
      header: "Control",
      priority: 0,
      minWidth: 220,
      cell: (row) => (
        <RecordLink table="controls" record={{ id: row.id, program_id: programId }}>
          {row.name}
        </RecordLink>
      ),
    }),
    c.text("family", { header: "Family", width: 240, priority: 4 }),
    c.status("status", {
      header: "Status",
      width: 140,
      priority: 1,
      statuses: baselineControlStatuses,
    }),
    c.text("layer", {
      header: "Changed by",
      width: 260,
      priority: 3,
      cell: (row) => row.layer ?? <Absent label="No layer changed it" />,
    }),
    c.number("requirements", { header: "Requirements", width: 130, priority: 5 }),
    // One column under one id, last in the row, so the reader's layout and sort hold from one
    // reading to the other. Over every control it is the first column a narrow table folds; read
    // by a technique, how each control supports it stays in the row beside its standing.
    ...(resiliency === "none"
      ? []
      : [
          c.list("resiliency", {
            header: resiliency === "approaches" ? "Approaches" : "Techniques",
            width: 240,
            priority: resiliency === "approaches" ? 2 : 6,
            items: (row) => row.resiliency,
            empty: () => (
              <Absent label={resiliency === "approaches" ? "No approach named" : "No technique"} />
            ),
          }),
        ]),
  ]);

const familyName = (group: BaselineFamily) =>
  `${(group.source_id ?? "").toUpperCase()} ${group.title ?? "Unnamed family"}`;

const noNames: readonly Named[] = [];

/**
 * The catalog's active controls with where each stands at a step: the List's rows. Read by a
 * technique (`approaches`, by control), the rows are the controls that support it.
 */
function useControlRows(
  baseline: ProgramBaseline,
  step: StackStep,
  counts: ReadonlyMap<string, number>,
  groups: readonly BaselineFamily[],
  techniques: ReadonlyMap<string, readonly Named[]>,
  approaches: ReadonlyMap<string, readonly Named[]> | null,
) {
  return useMemo(() => {
    const layerTitle = new Map(baseline.derivation.layers.map((layer) => [layer.key, layer.title]));
    const families = new Map(groups.map((group) => [group.id, familyName(group)]));
    // Withdrawn controls are left off, as on the map: nothing can select them.
    return [...baseline.controls.values()]
      .filter(
        (control) => control.status !== "withdrawn" && (!approaches || approaches.has(control.id)),
      )
      .sort((a, b) => a.source_id.localeCompare(b.source_id, "en", { numeric: true }))
      .map((control): ControlRow => {
        const { status, layerKey } = controlStanding(step, control.id);
        return {
          id: control.id,
          name: `${control.code} ${control.title}`,
          family: families.get(control.group_id ?? "") ?? "",
          status,
          layer: layerKey ? (layerTitle.get(layerKey) ?? "A layer") : null,
          requirements: counts.get(control.id) ?? 0,
          resiliency: (approaches ?? techniques).get(control.id) ?? noNames,
        };
      });
  }, [baseline, step, counts, groups, techniques, approaches]);
}

/** A layer's name: its overlay's record, or the layered profile the tailoring was saved as. */
function layerName(baseline: ProgramBaseline, row: StackRow) {
  const layer = baseline.derivation.layers.find((item) => item.key === row.key);
  if (layer?.overlayId)
    return (
      <TextLink render={<Link to="/overlays/$overlayId" params={{ overlayId: layer.overlayId }} />}>
        {row.title}
      </TextLink>
    );
  if (layer?.profileId)
    return (
      <TextLink render={<Link to="/profiles/$profileId" params={{ profileId: layer.profileId }} />}>
        {row.title}
      </TextLink>
    );
  return row.title;
}

function referenceName(baseline: ProgramBaseline) {
  const reference = baseline.reference;
  if (!reference) return "Unavailable baseline";
  return (
    <TextLink
      render={<Link to="/profiles/$profileId" params={{ profileId: reference.profileId }} />}
    >
      {reference.title} · {reference.version}
    </TextLink>
  );
}

/** The stack of one adopted baseline, as the Overview draws it. */
function BaselineStack({ baseline }: { baseline: ProgramBaseline }) {
  return (
    <BaselineStackTable
      label={`How ${baseline.reference?.title ?? "this baseline"} becomes the program's control baseline`}
      reference={{ name: referenceName(baseline), count: baseline.derivation.baselineCount }}
      layers={baseline.derivation.layers}
      name={(row) => layerName(baseline, row)}
      resultLabel="Program control baseline"
    />
  );
}

const noGroups: readonly BaselineFamily[] = [];

const noBaseline = {
  title: "No control baseline recorded",
  description:
    "A program made outside the setup flow records no catalog or baseline choice, so there is no derivation to show.",
};

/**
 * The Overview's short form: each adopted baseline's stack, and the way to the focused view.
 * A program with no recorded choice says so.
 */
export function ControlBaselineSummary({ programId }: { programId: string }) {
  const { baselines, queries, ready } = useProgramBaselines(programId);
  return (
    <Section
      title="Control baseline"
      {...(baselines.length
        ? {
            action: (
              <TextLink
                size="small"
                render={<Link to="/programs/$programId/control-baseline" params={{ programId }} />}
              >
                Open control baseline
              </TextLink>
            ),
          }
        : {})}
    >
      <QueryState queries={queries}>
        {!ready ? null : baselines.length ? (
          <Stack space="space.200">
            {baselines.map((baseline) => (
              <BaselineStack key={baseline.choiceId} baseline={baseline} />
            ))}
          </Stack>
        ) : (
          <EmptyMessage compact {...noBaseline} />
        )}
      </QueryState>
    </Section>
  );
}

/** The framework's techniques: the kinds asked for, kept at module level so the read keeps its key. */
const techniqueItems = { kinds: ["technique"] } as const;
const noChoice: readonly string[] = [];
const noTechniques: TechniqueControls[] = [];

function BaselineDetail({
  programId,
  baseline,
  counts,
  heading,
  technique,
  onTechniqueChange,
}: {
  programId: string;
  baseline: ProgramBaseline;
  counts: ReadonlyMap<string, number>;
  /** Named when the program adopted more than one baseline. */
  heading: string | null;
  /** The resiliency technique the address names, by its slug; none is all controls. */
  technique: string | undefined;
  onTechniqueChange: (slug: string | null) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const groups = useRows(
    "catalog_groups",
    { catalog_revision_id: baseline.catalog?.id ?? "" },
    { columns: ["id", "source_id", "title", "ordinal"], enabled: !!baseline.catalog },
  );
  const groupRows = groups.data ?? noGroups;
  const layers = baseline.derivation.layers;
  const reference = baseline.reference?.title ?? "Reference baseline";

  // Cyber resiliency: the techniques of SP 800-160 Vol. 2 and the controls of this catalog behind
  // each (Table E-1). Reference data that is not loaded reads empty, and no technique is offered.
  const links = useResiliencyControlLinks(baseline.catalog?.id);
  const items = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, techniqueItems);
  // What the program chose for SA-24 only orders the choice: without it the list is one.
  const choice = useProgramResiliencyChoice(programId);
  const techniques = useMemo(() => {
    if (!links.data?.length || !items.data?.length) return noTechniques;
    // The controls the map marks: a withdrawn control supports nothing here.
    return techniqueControls(items.data, resiliencyByTechnique(links.data), (id) => {
      const control = baseline.controls.get(id);
      return !!control && control.status !== "withdrawn";
    });
  }, [links.data, items.data, baseline.controls]);
  const shown = techniques.find((item) => item.slug === technique) ?? null;
  // One list a control for the program: stepping through the layers rebuilds none.
  const supported = useMemo(() => {
    const byControl = new Map<string, readonly Named[]>();
    if (!techniques.length) return byControl;
    for (const [controlId, entries] of resiliencyByControl(links.data ?? []))
      byControl.set(
        controlId,
        supportedOnce(entries).map((entry) => ({
          key: entry.technique.code,
          label: entry.technique.title,
          ...(entry.approaches.length
            ? { meta: entry.approaches.map((approach) => approach.title).join(", ") }
            : {}),
        })),
      );
    return byControl;
  }, [links.data, techniques]);
  const shownApproaches = useMemo(
    () =>
      shown
        ? new Map(
            [...shown.controls].map(([controlId, approaches]): [string, readonly Named[]] => [
              controlId,
              approaches.map((approach) => ({ key: approach.code, label: approach.title })),
            ]),
          )
        : null,
    [shown],
  );
  const mapTechnique = useMemo(
    () => (shown ? { title: shown.title, controlIds: shown.controls } : null),
    [shown],
  );

  // The layers are the steps: 0 is the reference baseline alone, the last the program's baseline.
  const [chosen, setChosen] = useState(layers.length);
  const [replaying, setReplaying] = useState(false);
  const [view, setView] = useState<View>("grid");
  const upto = Math.min(chosen, layers.length);
  useEffect(() => {
    if (!replaying) return;
    if (upto >= layers.length) {
      setReplaying(false);
      return;
    }
    const timer = setTimeout(() => setChosen(upto + 1), REPLAY_MS);
    return () => clearTimeout(timer);
  }, [replaying, upto, layers.length]);

  const step = useMemo(() => stackAt(baseline.derivation, upto), [baseline.derivation, upto]);
  // Each technique's count at the step shown: its controls in the baseline, of those behind it.
  const options = useMemo(
    (): TechniqueOption[] =>
      techniques.map((item) => ({
        code: item.code,
        slug: item.slug,
        title: item.title,
        selected: selectedOf(item, step.selected),
        total: item.controls.size,
      })),
    [techniques, step],
  );
  const shownCount = shown ? options.find((option) => option.slug === shown.slug) : undefined;
  // What the heading counts: the baseline's controls, or those of them behind the technique.
  const counted = shownCount
    ? `${formatNumber(shownCount.selected)} of ${formatNumber(shownCount.total)} ${shownCount.title}`
    : formatNumber(step.selected.size);
  const controls = useControlRows(baseline, step, counts, groupRows, supported, shownApproaches);
  const inBaseline = controls.filter(
    (row) => row.status === "in_baseline" || row.status === "added",
  );
  const covered = inBaseline.filter((row) => row.requirements > 0).length;
  const openRecord = useOpenRecord();
  // One list for the program and the reading: stepping through the layers rebuilds none. The
  // resiliency column is there from the first render, while its reads are on their way, so the
  // reader's stored layout finds it; it goes once they answer that no technique is on offer.
  const resiliency: ResiliencyColumn = shown
    ? "approaches"
    : techniques.length || links.isLoading || items.isLoading
      ? "techniques"
      : "none";
  const columns = useMemo(() => controlColumns(programId, resiliency), [programId, resiliency]);
  const table = useCollectionTable({
    columns,
    data: controls,
    getRowId: (row) => row.id,
    label: "Catalog controls",
    view: "program-control-baseline",
  });
  // A family chosen on the map, asked of the List once it is on the page: the List restores its
  // own last question as it mounts, and this one comes after.
  const [opening, setOpening] = useState<string | null>(null);
  useEffect(() => {
    if (view !== "list" || opening === null) return;
    table.setGlobalFilter("");
    table.setColumnFilters([{ id: "family", value: [opening] }]);
    setOpening(null);
  }, [view, opening, table]);
  const layer = upto > 0 ? layers[upto - 1] : undefined;
  const choose = (index: number) => {
    setReplaying(false);
    setChosen(index);
  };
  // The baseline reads whole without the cyber resiliency reads: when one fails with nothing to
  // show, every control is still drawn, no technique is offered and the page's alert says what
  // failed. A technique the address asks for cannot be drawn without them, so it waits on both.
  const resiliencyReads: QueryStatus[] = [links, items];
  const unread = resiliencyReads.filter((read) => read.isError && read.data === undefined);
  const asked = technique !== undefined;

  const body = (
    <QueryState
      queries={[groups, ...resiliencyReads.filter((read) => asked || !unread.includes(read))]}
    >
      {!asked && <ReportFailures queries={unread} />}
      <WorkPane
        listLabel="Layers"
        backLabel="Back to layers"
        // Where the pane shows one side at a time, an address that names a technique opens on
        // what it asks for: the baseline read by it, with the layers one step back.
        defaultView={shown ? "detail" : "list"}
        listToolbar={
          <Inline>
            <Button
              size="small"
              variant="secondary"
              disabled={!layers.length}
              onClick={() => {
                if (replaying) return setReplaying(false);
                setChosen(0);
                setReplaying(true);
              }}
            >
              {replaying ? "Stop" : "Replay"}
            </Button>
          </Inline>
        }
        list={[
          <WorkPane.Row
            key="reference"
            id="Baseline"
            title={reference}
            meta={formatNumber(baseline.derivation.baselineCount)}
            isActive={upto === 0}
            onSelect={() => choose(0)}
          />,
          ...layers.map((item, index) => (
            <WorkPane.Row
              key={item.key}
              id={item.kind === "overlay" ? "Overlay" : "Tailoring"}
              title={item.title}
              meta={`${layerChange(item)} · ${formatNumber(item.total)}`}
              isActive={upto === index + 1}
              onSelect={() => choose(index + 1)}
            />
          )),
        ]}
        detail={
          <Stack space="space.200" className="min-w-0">
            <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
              <Heading as={heading ? "h3" : "h2"} size="section" aria-live="polite">
                {counted} {layer ? `controls after ${layer.title}` : `controls in ${reference}`}
              </Heading>
              <Inline space="space.100" alignBlock="center" shouldWrap>
                {options.length > 0 && (
                  <ResiliencyTechniqueSelect
                    options={options}
                    chosen={choice.data?.techniques ?? noChoice}
                    value={shown?.slug ?? null}
                    onValueChange={onTechniqueChange}
                  />
                )}
                <ToggleGroup
                  size="small"
                  spacing={0}
                  variant="outline"
                  aria-label="Show as"
                  value={[view]}
                  onValueChange={(value) => {
                    const next = value[0] as View | undefined;
                    if (next) setView(next);
                  }}
                >
                  {views.map((item) => (
                    <ToggleGroupItem key={item.value} value={item.value}>
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Inline>
            </Inline>
            {view === "list" ? (
              <Stack space="space.200" className="min-w-0">
                <Progress
                  size="small"
                  value={covered}
                  max={Math.max(inBaseline.length, 1)}
                  // A technique none of whose controls is in the baseline yet has nothing covered.
                  tone={
                    inBaseline.length > 0 && covered === inBaseline.length
                      ? "success"
                      : "information"
                  }
                  getAriaValueText={() =>
                    `${formatNumber(covered)} of ${formatNumber(inBaseline.length)}`
                  }
                >
                  <ProgressLabel>Baseline controls with a requirement</ProgressLabel>
                  <ProgressValue>
                    {() => `${formatNumber(covered)} of ${formatNumber(inBaseline.length)}`}
                  </ProgressValue>
                </Progress>
                <ProductCollection
                  table={table}
                  compact
                  onRowClick={(row) =>
                    openRecord("controls", { id: row.id, program_id: programId })
                  }
                  searchLabel="Find controls"
                  filters={
                    <>
                      <DataTable.Filter table={table} column="family" />
                      <DataTable.Filter table={table} column="status" />
                      <DataTable.Filter table={table} column="layer" />
                    </>
                  }
                  empty={{
                    title: "No controls to show",
                    description: shown
                      ? `No active control of the catalog supports ${shown.title}.`
                      : "The catalog holds no active control.",
                  }}
                />
              </Stack>
            ) : (
              <BaselineMap
                baseline={baseline}
                groups={groupRows}
                step={step}
                layout={view}
                technique={mapTechnique}
                onSelectFamily={(familyId) => {
                  // The List is the map's table: open the family there.
                  const group = groupRows.find((item) => item.id === familyId);
                  if (!group) return;
                  setOpening(familyName(group));
                  setView("list");
                  announce(`${familyName(group)} controls shown as a list.`);
                }}
              />
            )}
          </Stack>
        }
      />
    </QueryState>
  );
  return heading ? <Section title={heading}>{body}</Section> : body;
}

/** The view's route: its address keeps the resiliency technique the baseline is read by. */
const baselineRoute = getRouteApi("/programs/$programId_/control-baseline");

/**
 * The program's focused Control baseline view: for each baseline the program adopted, how it is
 * formed (reference baseline, overlays in order, the program's tailoring), every control that
 * results with the layer it came from and the requirements that map it, and what was removed.
 * Read by a cyber resiliency technique, it shows the controls behind that technique alone.
 */
export function ProgramControlBaseline({ programId }: { programId: string }) {
  const { baselines, queries, ready } = useProgramBaselines(programId);
  const coverage = useControlRequirementCounts(programId);
  // The technique lives in the address, so a reload, Back and a shared link keep it; choosing
  // another is a step Back returns from.
  const { technique } = baselineRoute.useSearch();
  const navigate = baselineRoute.useNavigate();
  const chooseTechnique = useCallback(
    (slug: string | null) =>
      void navigate({
        search: (current) => ({ ...current, technique: slug ?? undefined }),
        resetScroll: false,
      }),
    [navigate],
  );
  return (
    <QueryState queries={[...queries, coverage.query]}>
      {!ready ? null : baselines.length ? (
        <Stack space="space.400" className="min-w-0">
          {baselines.map((baseline) => (
            <BaselineDetail
              key={baseline.choiceId}
              programId={programId}
              baseline={baseline}
              counts={coverage.counts}
              heading={baselines.length > 1 ? (baseline.adopted?.title ?? "Baseline") : null}
              technique={technique}
              onTechniqueChange={chooseTechnique}
            />
          ))}
        </Stack>
      ) : (
        <EmptyMessage illustration="document" {...noBaseline} />
      )}
    </QueryState>
  );
}
