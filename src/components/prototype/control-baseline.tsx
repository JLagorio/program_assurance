import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
  Absent,
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  announce,
  Button,
  DataTable,
  defineColumns,
  Heading,
  Inline,
  Item,
  Progress,
  ProgressLabel,
  ProgressValue,
  Section,
  Stack,
  Switch,
  TextLink,
  ToggleGroup,
  ToggleGroupItem,
  useLedgerLocale,
  WorkPane,
  type WorkPaneView,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import {
  useControlRequirementCounts,
  usePublishedOverlays,
  useProgramBaselines,
  type ProgramBaseline,
} from "@/lib/baseline-reads";
import {
  controlStanding,
  layerChange,
  layerParamKey,
  stackAt,
  stackWithout,
  whatIfChange,
  type StackStep,
} from "@/lib/baseline-stack";
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
import { stackShape } from "@/lib/program-overlays";
import { useProgramResiliencyChoice } from "@/lib/resiliency-choice";
import { baselineControlStatuses } from "@/lib/status";
import { BaselineMap, type BaselineFamily } from "./baseline-map";
import { BaselineStackTable, type StackRow } from "./baseline-stack";
import { useCollectionTable } from "./collection-question";
import { ResiliencyTechniqueSelect, type TechniqueOption } from "./control-resiliency";
import { ProductCollection } from "./product-collection";
import { ProgramOverlaysDialog } from "./program-overlays-dialog";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState, ReportFailures, type QueryStatus } from "./work-common";

/** The view's route: its address keeps the technique the baseline is read by, the step and the take. */
const baselineRoute = getRouteApi("/programs/$programId_/control-baseline");
type ControlBaselineSearch = ReturnType<typeof baselineRoute.useSearch>;

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
  canEdit,
  search,
  go,
}: {
  programId: string;
  baseline: ProgramBaseline;
  counts: ReadonlyMap<string, number>;
  /** Named when the program adopted more than one baseline. */
  heading: string | null;
  /** The reader may change the stack's overlays: every member but a viewer. */
  canEdit: boolean;
  /** What the address names: the resiliency technique, the step and how it is shown. */
  search: ControlBaselineSearch;
  /** Asks the address for more: a step Back returns from, or with `replace` one it does not. */
  go: (patch: Partial<ControlBaselineSearch>, replace?: boolean) => void;
}) {
  const { technique, layer: askedLayer, show, off } = search;
  const { formatNumber } = useLedgerLocale();
  const groups = useRows(
    "catalog_groups",
    { catalog_revision_id: baseline.catalog?.id ?? "" },
    { columns: ["id", "source_id", "title", "ordinal"], enabled: !!baseline.catalog },
  );
  const groupRows = groups.data ?? noGroups;
  const reference = baseline.reference?.title ?? "Reference baseline";

  // What-if: the layers the reader switched off, which the address names by the start of their
  // keys. Each keeps its place and changes nothing, the layers after it apply again to what is
  // beneath them, and every count, the map, its key and the List read that stack. Nothing is saved.
  const switchedOff = useMemo(() => (off ? off.split(",") : []), [off]);
  const offKeys = useMemo(
    () =>
      new Set(
        baseline.derivation.layers
          .filter((item) => switchedOff.includes(layerParamKey(item.key)))
          .map((item) => item.key),
      ),
    [baseline.derivation, switchedOff],
  );
  const derivation = useMemo(
    () => (offKeys.size ? stackWithout(baseline.derivation, offKeys) : baseline.derivation),
    [baseline.derivation, offKeys],
  );
  const whatIf = offKeys.size
    ? whatIfChange(baseline.derivation.selected, derivation.selected)
    : null;
  const layers = derivation.layers;
  // A switch writes the address, a step Back returns from; the keys of the layers of another
  // baseline the view draws stay as they are.
  const switchLayers = (keys: readonly string[], applied: boolean) => {
    const next = new Set(switchedOff);
    for (const key of keys)
      if (applied) next.delete(layerParamKey(key));
      else next.add(layerParamKey(key));
    go({ off: next.size ? [...next].join(",") : undefined });
  };

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
  // The address keeps the step and the take, so Back, a reload and a shared link keep them: a
  // choice is a step Back returns from, and an address that names neither shows the last layer
  // as a Grid. Replay walks the steps without writing each, and writes only the one it ends on.
  const [replay, setReplay] = useState<number | null>(null);
  const upto = Math.min(replay ?? askedLayer ?? layers.length, layers.length);
  const view: View = show ?? "grid";
  const setView = (next: View) => go({ show: next === "grid" ? undefined : next });
  const settle = useCallback(
    (index: number, replace = false) =>
      go({ layer: index >= layers.length ? undefined : index }, replace),
    [go, layers.length],
  );
  useEffect(() => {
    if (replay === null) return;
    if (replay >= layers.length) {
      settle(layers.length, true);
      setReplay(null);
      return;
    }
    const timer = setTimeout(() => setReplay(replay + 1), REPLAY_MS);
    return () => clearTimeout(timer);
  }, [replay, layers.length, settle]);
  // Where the pane shows one side at a time, the side follows the address: one that names a step,
  // a take or a technique opens on the detail, and Back to an address that names none returns to
  // the layers. The pane's own Back to layers shows them without a step of history.
  const named = technique !== undefined || askedLayer !== undefined || show !== undefined;
  const signature = `${technique ?? ""}|${askedLayer ?? ""}|${show ?? ""}`;
  const [pane, setPane] = useState<WorkPaneView>(named ? "detail" : "list");
  const [paneFor, setPaneFor] = useState(signature);
  if (paneFor !== signature) {
    setPaneFor(signature);
    setPane(named ? "detail" : "list");
  }
  // Edit overlays: the view's one primary, or a secondary for each of several baselines. Its
  // dialog reads the published overlays, which load with the view so it opens on them.
  const [editing, setEditing] = useState(false);
  const shape = useMemo(() => stackShape(baseline.derivation), [baseline.derivation]);
  usePublishedOverlays({ enabled: canEdit });

  const step = useMemo(() => stackAt(derivation, upto), [derivation, upto]);
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
  // A row chosen names its step, the last one too, so the pane that shows one side at a time
  // keeps the detail it asked for, also when the step was the one shown already.
  const choose = (index: number) => {
    setReplay(null);
    setPane("detail");
    go({ layer: index });
  };
  // Back to saved ends the what-if, and its status line with it: focus moves first to the step
  // the reader is reading, its row where the list shows, else the detail's heading.
  const paneRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const backToSaved = () => {
    const row = paneRef.current?.querySelector<HTMLElement>('button[aria-current="true"]');
    (row && row.getClientRects().length ? row : headingRef.current)?.focus({
      preventScroll: true,
    });
    switchLayers([...offKeys], true);
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
      <Stack space="space.200" className="min-w-0">
        {whatIf && (
          <Alert tone="information">
            <AlertTitle>
              {whatIf.more || whatIf.fewer
                ? `What-if: ${formatNumber(whatIf.more)} more and ${formatNumber(whatIf.fewer)} fewer controls than the saved baseline`
                : "What-if: the same controls as the saved baseline"}
            </AlertTitle>
            <AlertDescription>
              Not applied:{" "}
              {layers
                .filter((item) => offKeys.has(item.key))
                .map((item) => item.title)
                .join(", ")}
            </AlertDescription>
            <AlertAction>
              <Button size="small" variant="secondary" onClick={backToSaved}>
                Back to saved
              </Button>
            </AlertAction>
          </Alert>
        )}
        <WorkPane
          ref={paneRef}
          listLabel="Layers"
          backLabel="Back to layers"
          // Where the pane shows one side at a time, an address that names a step, a take or a
          // technique opens on what it asks for, with the layers one step back.
          view={pane}
          onViewChange={setPane}
          listToolbar={
            <Inline space="space.100">
              {canEdit && (
                <Button
                  size="small"
                  variant={heading ? "secondary" : "primary"}
                  {...(shape.supported
                    ? {}
                    : {
                        disabledReason:
                          "This control baseline has a tailoring layer beneath an overlay, so its overlays cannot be changed here.",
                      })}
                  onClick={() => {
                    // The trigger stays enabled while its dialog is open; a second press opens nothing new.
                    if (!editing) setEditing(true);
                  }}
                >
                  Edit overlays
                </Button>
              )}
              <Button
                size="small"
                variant="secondary"
                disabled={!layers.length}
                onClick={() => {
                  // Stopped, the view stays on the step it reached, and the address says so.
                  if (replay !== null) {
                    settle(replay, true);
                    return setReplay(null);
                  }
                  setReplay(0);
                }}
              >
                {replay !== null ? "Stop" : "Replay"}
              </Button>
            </Inline>
          }
          // Items that choose a step in place, each layer's with the switch that applies it: off,
          // the layer keeps its place and changes nothing (a what-if). The reference baseline the
          // stack starts from is always applied.
          list={[
            <Item
              key="reference"
              title={reference}
              description={`Baseline · ${formatNumber(derivation.baselineCount)}`}
              isActive={upto === 0}
              onSelect={() => choose(0)}
            />,
            ...layers.map((item, index) => {
              const applied = !offKeys.has(item.key);
              return (
                <Item
                  key={item.key}
                  title={item.title}
                  description={`${item.kind === "overlay" ? "Overlay" : "Tailoring"} · ${
                    applied ? layerChange(item) : "Not applied"
                  } · ${formatNumber(item.total)}`}
                  isActive={upto === index + 1}
                  onSelect={() => choose(index + 1)}
                  actions={
                    <Switch
                      size="small"
                      aria-label={`Apply ${item.title}`}
                      checked={applied}
                      onCheckedChange={(checked) => switchLayers([item.key], checked)}
                    />
                  }
                />
              );
            }),
          ]}
          detail={
            <Stack space="space.200" className="min-w-0">
              <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
                <Heading
                  ref={headingRef}
                  tabIndex={-1}
                  as={heading ? "h3" : "h2"}
                  size="section"
                  aria-live="polite"
                >
                  {counted}{" "}
                  {!layer
                    ? `controls in ${reference}`
                    : offKeys.has(layer.key)
                      ? `controls without ${layer.title}`
                      : `controls after ${layer.title}`}
                </Heading>
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  {options.length > 0 && (
                    <ResiliencyTechniqueSelect
                      options={options}
                      chosen={choice.data?.techniques ?? noChoice}
                      value={shown?.slug ?? null}
                      onValueChange={(slug) => go({ technique: slug ?? undefined })}
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
      </Stack>
    </QueryState>
  );
  const dialog = editing ? (
    <ProgramOverlaysDialog
      programId={programId}
      baseline={baseline}
      // A changed stack is shown at its last layer, the program's baseline, as a first visit is,
      // and with every layer applied: the layers a what-if switched off may be gone.
      onChanged={() => go({ layer: undefined, off: undefined }, true)}
      onClose={() => setEditing(false)}
    />
  ) : null;
  return heading ? (
    <Section title={heading}>
      {body}
      {dialog}
    </Section>
  ) : (
    <>
      {body}
      {dialog}
    </>
  );
}

/**
 * The program's focused Control baseline view: for each baseline the program adopted, how it is
 * formed (reference baseline, overlays in order, the program's tailoring), every control that
 * results with the layer it came from and the requirements that map it, and what was removed.
 * Read by a cyber resiliency technique, it shows the controls behind that technique alone.
 */
export function ProgramControlBaseline({ programId }: { programId: string }) {
  const workspace = useWorkspace();
  const { baselines, queries, ready } = useProgramBaselines(programId);
  const coverage = useControlRequirementCounts(programId);
  // The baselines last read whole. While a changed stack's new layers load, the view keeps the
  // stack it had, with Edit overlays and its dialog in place: only a read that failed holds it.
  const [settled, setSettled] = useState<ProgramBaseline[] | null>(null);
  if (ready && settled !== baselines) setSettled(baselines);
  const shown = ready ? baselines : settled;
  const held = !ready && shown ? queries.filter((query) => query.isError) : queries;
  // The technique, the step and the take live in the address, so a reload, Back and a shared link
  // keep them; a choice is a step Back returns from.
  const search = baselineRoute.useSearch();
  const navigate = baselineRoute.useNavigate();
  const go = useCallback(
    (patch: Partial<ControlBaselineSearch>, replace = false) =>
      void navigate({
        search: (current) => ({ ...current, ...patch }),
        replace,
        resetScroll: false,
      }),
    [navigate],
  );
  return (
    <QueryState queries={[...held, coverage.query]}>
      {!shown ? null : shown.length ? (
        <Stack space="space.400" className="min-w-0">
          {shown.map((baseline) => (
            <BaselineDetail
              key={baseline.choiceId}
              programId={programId}
              baseline={baseline}
              counts={coverage.counts}
              heading={shown.length > 1 ? (baseline.adopted?.title ?? "Baseline") : null}
              canEdit={workspace.role !== "viewer"}
              search={search}
              go={go}
            />
          ))}
        </Stack>
      ) : (
        <EmptyMessage illustration="document" {...noBaseline} />
      )}
    </QueryState>
  );
}
