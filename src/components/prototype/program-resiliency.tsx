import { useCallback, useEffect, useMemo, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { CornerDownRight } from "lucide-react";
import {
  Badge,
  Button,
  Dot,
  Eyebrow,
  Field,
  FieldLabel,
  Grid,
  Icon,
  Inline,
  Item,
  KeyValue,
  Ladder,
  List,
  Prose,
  Section,
  Stack,
  Stat,
  Stepper,
  Switch,
  Table,
  Tally,
  Text,
  TextLink,
  TileMap,
  ToggleGroup,
  ToggleGroupItem,
  useLedgerLocale,
  type LadderLevel,
  type LadderMark,
  type LadderNode,
  type TallySegment,
} from "@ledger/design-system";
import {
  useControlRequirementCounts,
  useProgramBaselines,
  type ProgramBaseline,
} from "@/lib/baseline-reads";
import { layerChange, stackAt } from "@/lib/baseline-stack";
import { techniqueSlug } from "@/lib/control-resiliency";
import {
  CYBER_RESILIENCY_FRAMEWORK,
  itemGuidance,
  useFrameworkItemLinks,
  useFrameworkItems,
  useResiliencyControlLinks,
} from "@/lib/frameworks";
import { useProgramResiliencyChoice } from "@/lib/resiliency-choice";
import {
  LADDER_KINDS,
  ladderByLayer,
  ladderControls,
  resiliencyLadder,
  type LadderControl,
  type LadderItem,
  type LadderKind,
  type LadderLayer,
  type ResiliencyLadder,
} from "@/lib/resiliency-ladder";
import { baselineControlStatuses } from "@/lib/status";
import { marks as standingMarks } from "./baseline-map";
import { RecordLink, RecordPreviewActions, RecordPreviewPanel, recordLink } from "./record-preview";
import { EmptyMessage, QueryState, ReportFailures } from "./work-common";

/*
 * A program's cyber resiliency as one picture: the ladder of NIST SP 800-160 Vol. 2 Rev. 1 (goals,
 * objectives, techniques, approaches) with how much of each the program's control baseline holds,
 * read at any layer of the stack. Two takes of the same numbers: the ladder itself (Ledger's
 * `Ladder`), and technique by technique, layer by layer. An approach opens onto what NIST says of
 * it and the controls behind it. The numbers come from `src/lib/resiliency-ladder.ts`.
 */

/** How the ladder is shown. */
type Take = "ladder" | "layers";
const takes: { value: Take; label: string }[] = [
  { value: "ladder", label: "Ladder" },
  { value: "layers", label: "Layers" },
];
/** How long Replay holds each step, as on the Control baseline. */
const REPLAY_MS = 1100;

/** The framework's reads, kept at module level so each keeps its key. */
const ladderKinds = { kinds: LADDER_KINDS } as const;
const supportLinks = { relation: "supports" } as const;

const levelTitles: Record<LadderKind, string> = {
  goal: "Goals",
  objective: "Objectives",
  technique: "Techniques",
  approach: "Approaches",
};

type Standing = LadderControl["status"];
/** The order a row's marks read in: what the baseline holds first. */
const standings: readonly Standing[] = ["in_baseline", "added", "removed", "not_selected"];

/** Reference data is loaded by a workspace administrator: a reader is never asked to import it. */
const notLoaded = {
  title: "Cyber resiliency reference data is not loaded",
  description: "Reference data is loaded by a workspace administrator.",
};
const noBaseline = {
  title: "No control baseline recorded",
  description:
    "A program made outside the setup flow records no catalog or baseline choice, so there is nothing to read its cyber resiliency against.",
};

/** One step of the stack as the view names it: the reference baseline, then each layer. */
type Step = { key: string; title: string };

/** What the ladder's mark says of an item the program named in its choice for SA-24. */
const CHOSEN = "Chosen for SA-24";

/** The mark of an item the program named in its choice for SA-24. */
function Chosen() {
  return (
    <Badge size="xsmall" variant="secondary">
      SA-24
    </Badge>
  );
}

/* ——— An approach: what NIST says of it, and the controls behind it ————————————————————————— */

/**
 * The controls behind an approach on one side of the baseline, one line a control: its code, its
 * name as the link to the program's control record, and how many of the program's requirements
 * map it. It lists what stands behind the approach rather than being a collection to work
 * through, so it has no search or sort.
 */
function ControlList({
  title,
  empty,
  controls,
  programId,
  counted,
}: {
  title: string;
  empty: string;
  controls: readonly LadderControl[];
  programId: string;
  /** Every control says its requirement count; otherwise only one that has requirements does. */
  counted: boolean;
}) {
  const { formatNumber } = useLedgerLocale();
  const counts = (control: LadderControl) => counted || control.requirements > 0;
  return (
    <Item.Group
      title={title}
      count={controls.length}
      countMax={9999}
      size="compact"
      empty={empty}
      // What the number at the end of a line counts.
      {...(controls.some(counts) ? { trailing: "Requirements" } : {})}
    >
      {controls.map((control) => (
        <Item
          key={control.id}
          id={control.code}
          title={control.title}
          link={recordLink("controls", { id: control.id, program_id: programId })}
          // The standing of a control a layer changed; the heading says the others'.
          {...(control.status === "added" || control.status === "removed"
            ? { meta: baselineControlStatuses[control.status].label }
            : {})}
          {...(counts(control) ? { trailing: formatNumber(control.requirements) } : {})}
        />
      ))}
    </Item.Group>
  );
}

/**
 * The body of an approach's preview: what Table D-4 says of it (its definition, NIST's examples
 * and its discussion, as a control's Cyber resiliency section reads them), then the controls that
 * support it, those in the baseline at the layer shown first.
 */
function ApproachDetails({
  programId,
  ladder,
  approach,
  baseline,
  upto,
  requirements,
  baselineName,
}: {
  programId: string;
  ladder: ResiliencyLadder;
  approach: LadderItem;
  baseline: ProgramBaseline;
  upto: number;
  requirements: ReadonlyMap<string, number>;
  /** The baseline the standings are read at, in words. */
  baselineName: string;
}) {
  const { formatNumber } = useLedgerLocale();
  const { held, rest } = useMemo(
    () => ladderControls(ladder, approach.code, stackAt(baseline.derivation, upto), requirements),
    [ladder, approach.code, baseline.derivation, upto, requirements],
  );
  const guidance = itemGuidance(approach);
  const technique = approach.technique ? ladder.byCode.get(approach.technique) : undefined;
  return (
    <Stack space="space.250" className="min-w-0">
      {guidance.informalDescription && (
        <Text as="p" color="color.text.subtle">
          {guidance.informalDescription}
        </Text>
      )}
      <KeyValue.Group labelWidth="default">
        {technique && (
          <KeyValue label="Technique" wrap>
            <TextLink
              render={
                <Link
                  to="/programs/$programId/control-baseline"
                  params={{ programId }}
                  search={{ technique: techniqueSlug(technique.code) }}
                />
              }
            >
              {technique.title}
            </TextLink>
          </KeyValue>
        )}
        <KeyValue label="Controls held">
          {formatNumber(held.length)} of {formatNumber(held.length + rest.length)}
        </KeyValue>
        <KeyValue label="Baseline" wrap>
          {baselineName}
        </KeyValue>
        <KeyValue label="Printed in">{approach.printedIn}</KeyValue>
      </KeyValue.Group>
      {guidance.definition && <Prose label="Definition">{guidance.definition}</Prose>}
      {guidance.examples.length > 0 && (
        <Stack space="space.050">
          <Eyebrow>Examples</Eyebrow>
          <List spacing="loose">
            {guidance.examples.map((example, index) => (
              <List.Item key={index}>{example}</List.Item>
            ))}
          </List>
        </Stack>
      )}
      {guidance.discussion && <Prose label="Discussion">{guidance.discussion}</Prose>}
      <ControlList
        title="In the baseline"
        empty="No control that supports it is in the baseline"
        controls={held}
        programId={programId}
        counted
      />
      <ControlList
        title="Not in the baseline"
        empty="Every control that supports it is in the baseline"
        controls={rest}
        programId={programId}
        counted={false}
      />
    </Stack>
  );
}

/* ——— Layers: technique by technique, layer by layer ————————————————————————————————————————— */

/**
 * What the baseline holds of each technique's controls after each layer of the stack, one line a
 * technique: the number, and a tally of what the layer found, added and removed. The approaches
 * stand under each technique when asked. Its order is the framework's and the stack's, so it is
 * the kit `Table`, with no search or sort.
 */
function LayersTable({
  programId,
  ladder,
  layers,
  steps,
  upto,
  listing,
  narrowed,
  onPreview,
}: {
  programId: string;
  ladder: ResiliencyLadder;
  layers: readonly LadderLayer[];
  steps: readonly Step[];
  /** The layer the view stands on: the steps after it are set back. */
  upto: number;
  /** The approaches are listed under their techniques. */
  listing: boolean;
  /** Only what an approach with nothing behind it stands under is listed. */
  narrowed: boolean;
  onPreview: (approach: LadderItem) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const standing = layers[upto]?.standing;
  const rows = useMemo(() => {
    if (!standing) return [];
    return ladder.levels.technique
      .filter((technique) => !narrowed || (standing.gaps.get(technique.code) ?? 0) > 0)
      .flatMap((technique) => [
        technique,
        ...(listing
          ? technique.approaches.flatMap((code) => {
              const approach = ladder.byCode.get(code);
              return approach && (!narrowed || standing.empty.has(code)) ? [approach] : [];
            })
          : []),
      ]);
  }, [ladder, standing, listing, narrowed]);
  // A tally is as long as its controls are many, against the technique with the most.
  const largest = Math.max(1, ...ladder.levels.technique.map((item) => item.controls.length));
  if (!rows.length)
    return (
      <EmptyMessage
        compact
        title="No approach is left with nothing behind it"
        description="At this layer every approach has a control in the baseline."
      />
    );
  const cell = (item: LadderItem, index: number) => {
    const at = layers[index];
    const held = at?.standing.byItem.get(item.code)?.held ?? 0;
    const total = item.controls.length;
    // A layer not applied yet is its number alone, set back.
    if (index > upto || !at)
      return (
        <Grid templateColumns="3ch minmax(0, 1fr)" columnGap="space.100" alignItems="center">
          <Text align="end" color="color.text.subtlest">
            {formatNumber(held)}
          </Text>
        </Grid>
      );
    const change = at.changes.get(item.code) ?? { added: 0, removed: 0 };
    // What the layer found in the baseline and left there.
    const before = held - change.added;
    // A count of nothing is the gap the reader looks for.
    const nothing = held === 0 && total > 0;
    const segments: TallySegment[] = [
      {
        key: "before",
        value: before,
        ...standingMarks.in_baseline,
        label: `${formatNumber(before)} held already`,
      },
      {
        key: "added",
        value: change.added,
        ...standingMarks.added,
        label: `${formatNumber(change.added)} added`,
      },
      {
        key: "removed",
        value: change.removed,
        ...standingMarks.removed,
        label: `${formatNumber(change.removed)} removed`,
      },
    ];
    return (
      <Grid templateColumns="3ch minmax(0, 1fr)" columnGap="space.100" alignItems="center">
        {nothing ? (
          <Text align="end" color="color.text.danger" weight="semibold">
            {formatNumber(held)}
          </Text>
        ) : (
          <Text align="end">{formatNumber(held)}</Text>
        )}
        <Tally
          size={item.kind === "technique" ? "xlarge" : "medium"}
          total={total}
          scale={total / largest}
          tone={nothing ? "danger" : "neutral"}
          segments={segments}
        />
      </Grid>
    );
  };
  return (
    <Table label="Controls held behind each resiliency technique, after each layer">
      <thead>
        <tr>
          <Table.Header sticky edge="scrolled" minWidth={200}>
            Technique
          </Table.Header>
          {/* A layer's name is read whole: it wraps in its column rather than widening the table. */}
          {steps.map((step) => (
            <Table.Header key={step.key} width={160} wrap>
              {step.title}
            </Table.Header>
          ))}
          <Table.Header align="end" width={88}>
            Controls
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((item) => (
          <Table.Row key={item.code}>
            <Table.Cell rowHeader sticky edge="scrolled">
              {item.kind === "technique" ? (
                <Table.Name {...(item.chosen ? { badge: <Chosen /> } : {})}>
                  <TextLink
                    render={
                      <Link
                        to="/programs/$programId/control-baseline"
                        params={{ programId }}
                        search={{ technique: techniqueSlug(item.code) }}
                      />
                    }
                  >
                    {item.title}
                  </TextLink>
                </Table.Name>
              ) : (
                <Table.Name
                  // An approach sits under the technique above it.
                  icon={
                    <Icon size="small" color="color.icon.subtlest">
                      <CornerDownRight />
                    </Icon>
                  }
                  {...(item.chosen ? { badge: <Chosen /> } : {})}
                >
                  <RecordLink
                    table="framework_items"
                    record={{ id: item.id }}
                    onPreview={() => onPreview(item)}
                  >
                    {item.title}
                  </RecordLink>
                </Table.Name>
              )}
            </Table.Cell>
            {steps.map((step, index) => (
              <Table.Cell key={step.key}>{cell(item, index)}</Table.Cell>
            ))}
            <Table.Cell align="end">{formatNumber(item.controls.length)}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ——— The view —————————————————————————————————————————————————————————————————————————————— */

// The view's own route, whose address keeps the take, the layer and what the view is narrowed to.
const route = getRouteApi("/programs/$programId_/resiliency");
type Search = ReturnType<typeof route.useSearch>;

function ResiliencyView({
  programId,
  baseline,
  requirements,
  heading,
}: {
  programId: string;
  baseline: ProgramBaseline;
  /** How many of the program's requirements map each control. */
  requirements: ReadonlyMap<string, number>;
  /** Named when the program adopted more than one baseline. */
  heading: string | null;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const go = useCallback(
    (patch: Partial<Search>, replace = false) =>
      void navigate({
        search: (current) => ({ ...current, ...patch }),
        replace,
        resetScroll: false,
      }),
    [navigate],
  );

  // The ladder and Table E-1 are reference data: where they are not loaded they read empty.
  const links = useResiliencyControlLinks(baseline.catalog?.id);
  const items = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, ladderKinds);
  const itemLinks = useFrameworkItemLinks(CYBER_RESILIENCY_FRAMEWORK, supportLinks);
  // What the program chose for SA-24 only marks the ladder: without it nothing is marked.
  const choice = useProgramResiliencyChoice(programId);
  const ladder = useMemo(
    () =>
      resiliencyLadder({
        items: items.data ?? [],
        itemLinks: itemLinks.data ?? [],
        controlLinks: links.data ?? [],
        controls: baseline.controls,
        choice: choice.data,
      }),
    [items.data, itemLinks.data, links.data, baseline.controls, choice.data],
  );
  const layers = useMemo(
    () => ladderByLayer(ladder, baseline.derivation),
    [ladder, baseline.derivation],
  );

  // The layers are the steps: 0 is the reference baseline alone, the last the program's baseline.
  const stack = baseline.derivation.layers;
  const reference = baseline.reference?.title ?? "Reference baseline";
  const steps = useMemo(
    (): Step[] => [
      { key: "reference", title: reference },
      ...stack.map((layer) => ({ key: layer.key, title: layer.title })),
    ],
    [reference, stack],
  );
  // Replay walks the steps from the first without writing each to the address: the address keeps
  // the layer the reader settles on.
  const [replay, setReplay] = useState<number | null>(null);
  const upto = Math.min(replay ?? search.layer ?? stack.length, stack.length);
  const settle = useCallback(
    (index: number, replace = false) =>
      go({ layer: index >= stack.length ? undefined : index }, replace),
    [go, stack.length],
  );
  useEffect(() => {
    if (replay === null) return;
    if (replay >= stack.length) {
      settle(stack.length, true);
      setReplay(null);
      return;
    }
    const timer = setTimeout(() => setReplay(replay + 1), REPLAY_MS);
    return () => clearTimeout(timer);
  }, [replay, stack.length, settle]);
  const choose = (index: number) => {
    setReplay(null);
    settle(index);
  };

  const take: Take = search.show === "layers" ? "layers" : "ladder";
  const narrowed = search.only === "gaps";
  const listing = search.rows === "approaches";
  const layer = layers[upto];
  const standing = layer?.standing;

  // What the reader chose on the ladder: its path is kept, and an approach opens its preview too.
  const [pick, setPick] = useState<string | null>(null);
  const picked = pick ? ladder.byCode.get(pick) : undefined;
  const preview = picked?.kind === "approach" ? picked : null;
  // The approaches with nothing behind them, in the ladder's order: what the view narrows to.
  const gaps = useMemo(
    () =>
      standing
        ? ladder.levels.approach
            .filter((approach) => standing.empty.has(approach.code))
            .map((approach) => approach.code)
        : [],
    [ladder, standing],
  );
  // The approaches the preview steps through: the ones the view is narrowed to, else all of them.
  const stepped = useMemo(
    () =>
      ladder.levels.approach
        .filter((approach) => !narrowed || !standing || standing.empty.has(approach.code))
        .map((approach) => ({ id: approach.id, code: approach.code })),
    [ladder, narrowed, standing],
  );

  // The ladder as Ledger's part draws it: every item a node with what the baseline holds of the
  // controls behind it, and an approach's controls as its marks, what the baseline holds first.
  const levels = useMemo((): LadderLevel[] => {
    if (!standing) return [];
    const step = stackAt(baseline.derivation, upto);
    const layerTitles = new Map(stack.map((item) => [item.key, item.title]));
    const mark = (control: LadderControl): LadderMark => {
      const by = control.layerKey ? (layerTitles.get(control.layerKey) ?? "a layer") : null;
      const state =
        control.status === "added"
          ? `Added by ${by}`
          : control.status === "removed"
            ? `Removed by ${by}`
            : baselineControlStatuses[control.status].label;
      return {
        key: control.id,
        label: `${control.code} ${control.title}`,
        description: `${state} · ${formatPlural(control.requirements, {
          one: "{count} requirement",
          other: "{count} requirements",
        })}`,
        ...standingMarks[control.status],
      };
    };
    return LADDER_KINDS.map((kind) => ({
      id: kind,
      label: levelTitles[kind],
      ...(kind === "approach" ? { layout: "rows" as const } : {}),
      nodes: ladder.levels[kind].map((item): LadderNode => {
        const counts = standing.byItem.get(item.code);
        const held = counts?.held ?? 0;
        const total = counts?.total ?? 0;
        const definition = itemGuidance(item).definition;
        const node = {
          id: item.code,
          title: item.title,
          value: held,
          total,
          valueLabel: `${formatNumber(held)} of ${formatPlural(total, {
            one: "{count} control",
            other: "{count} controls",
          })} held`,
          ...(definition ? { description: definition } : {}),
          // The program's choice for SA-24 marks its items; where it chose nothing, nothing is marked.
          ...(item.chosen ? { marked: CHOSEN } : {}),
        };
        if (kind === "approach") {
          const { held: kept, rest } = ladderControls(ladder, item.code, step, requirements);
          return {
            ...node,
            flagged: standing.empty.has(item.code),
            marks: standings.flatMap((status) =>
              [...kept, ...rest].filter((control) => control.status === status).map(mark),
            ),
          };
        }
        const added = counts?.added ?? 0;
        const removed = counts?.removed ?? 0;
        return {
          ...node,
          segments: [
            {
              key: "in_baseline",
              value: held - added,
              ...standingMarks.in_baseline,
              label: `${formatNumber(held - added)} in baseline`,
            },
            {
              key: "added",
              value: added,
              ...standingMarks.added,
              label: `${formatNumber(added)} added`,
            },
            {
              key: "removed",
              value: removed,
              ...standingMarks.removed,
              label: `${formatNumber(removed)} removed`,
            },
          ],
        };
      }),
    }));
  }, [
    ladder,
    standing,
    baseline.derivation,
    upto,
    stack,
    requirements,
    formatNumber,
    formatPlural,
  ]);

  const baselineName =
    upto >= stack.length
      ? "Program control baseline"
      : upto === 0
        ? reference
        : `After ${stack[upto - 1]?.title ?? "a layer"}`;
  const empty = standing?.empty.size ?? 0;
  const loaded = ladder.levels.approach.length > 0 && ladder.controls.length > 0;

  const body = (
    <QueryState queries={[links, items, itemLinks]}>
      {!loaded || !layer || !standing ? (
        <EmptyMessage illustration="shield" {...notLoaded} />
      ) : (
        <Stack space="space.300" className="min-w-0">
          <ReportFailures queries={[choice]} />
          <Stat.Grid
            frame="band"
            cols={2}
            role="group"
            aria-label="Where the program stands on cyber resiliency"
          >
            <Stat.Tile
              label="Controls held"
              value={standing.all.held}
              note={`of ${formatNumber(standing.all.total)} in Table E-1`}
            />
            <Stat.Tile
              label="Approaches with nothing behind them"
              value={empty}
              note={
                narrowed
                  ? `of ${formatNumber(ladder.levels.approach.length)} · only these shown`
                  : `of ${formatNumber(ladder.levels.approach.length)}`
              }
              tone={empty ? "danger" : "neutral"}
              // The number narrows the view to the approaches it counts, and back.
              {...(narrowed || empty
                ? {
                    link: (
                      <route.Link
                        search={(current) => ({
                          ...current,
                          only: narrowed ? undefined : ("gaps" as const),
                          // The gaps are approaches: the Layers take lists them at once.
                          rows: narrowed ? current.rows : ("approaches" as const),
                        })}
                        resetScroll={false}
                      />
                    ),
                  }
                : {})}
            />
          </Stat.Grid>
          <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
            {stack.length > 0 ? (
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  // Stopped, the view stays on the step it reached.
                  if (replay !== null) {
                    settle(replay, true);
                    return setReplay(null);
                  }
                  setReplay(0);
                }}
              >
                {replay !== null ? "Stop" : "Replay"}
              </Button>
            ) : (
              <span />
            )}
            <Inline space="space.200" alignBlock="center" shouldWrap>
              {take === "layers" && (
                <Field orientation="horizontal">
                  <Switch
                    size="small"
                    checked={listing}
                    onCheckedChange={(checked) =>
                      go({ rows: checked ? "approaches" : undefined }, true)
                    }
                  />
                  <FieldLabel>Approaches</FieldLabel>
                </Field>
              )}
              <ToggleGroup
                size="small"
                spacing={0}
                variant="outline"
                aria-label="Show as"
                value={[take]}
                onValueChange={(value) => {
                  const next = value[0] as Take | undefined;
                  if (next) go({ show: next === "layers" ? "layers" : undefined });
                }}
              >
                {takes.map((item) => (
                  <ToggleGroupItem key={item.value} value={item.value}>
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Inline>
          </Inline>
          {stack.length > 0 && (
            <Stepper label="Baseline layers" orientation="responsive">
              {steps.map((step, index) => {
                const at = layers[index];
                const held = formatNumber(at?.standing.all.held ?? 0);
                return (
                  <Stepper.Item
                    key={step.key}
                    state={index < upto ? "done" : index === upto ? "current" : "upcoming"}
                    label={step.title}
                    meta={index === 0 || !at ? held : `${layerChange(at.change)} · ${held}`}
                    onSelect={() => choose(index)}
                  />
                );
              })}
            </Stepper>
          )}
          {take === "layers" ? (
            <>
              {/* A cell's tally: what the layer found in the baseline, added and removed. */}
              <TileMap.Key
                aria-label="Key"
                items={[
                  {
                    label: upto === 0 ? "In the reference baseline" : "Held already",
                    value: formatNumber(standing.all.held - layer.change.added),
                    ...standingMarks.in_baseline,
                  },
                  {
                    label: "Added by the layer",
                    value: formatNumber(layer.change.added),
                    ...standingMarks.added,
                  },
                  {
                    label: "Removed by the layer",
                    value: formatNumber(layer.change.removed),
                    ...standingMarks.removed,
                  },
                ]}
              />
              <LayersTable
                programId={programId}
                ladder={ladder}
                layers={layers}
                steps={steps}
                upto={upto}
                listing={listing}
                narrowed={narrowed}
                onPreview={(approach) => setPick(approach.code)}
              />
            </>
          ) : (
            <>
              <Inline space="space.200" alignBlock="center" shouldWrap>
                <TileMap.Key
                  aria-label="Key"
                  items={standings.map((status) => ({
                    label: baselineControlStatuses[status].label,
                    value: formatNumber(
                      status === "in_baseline"
                        ? standing.all.held - standing.all.added
                        : status === "added"
                          ? standing.all.added
                          : status === "removed"
                            ? standing.all.removed
                            : standing.all.total - standing.all.held - standing.all.removed,
                    ),
                    ...standingMarks[status],
                  }))}
                />
                {ladder.chose && (
                  <Inline space="space.075" alignBlock="center">
                    <Dot shape="round" />
                    <Text as="span" size="small" color="color.text.subtle">
                      {CHOSEN}
                    </Text>
                  </Inline>
                )}
              </Inline>
              <Ladder
                label="Cyber resiliency: what the baseline holds behind each goal, objective, technique and approach"
                size="small"
                levels={levels}
                links={ladder.links}
                selected={pick}
                onSelect={(node) => setPick(node?.id ?? null)}
                // Narrowed, the paths through the gaps are kept until the reader chooses a node.
                highlighted={narrowed && !pick ? gaps : undefined}
                flagLabel={(count) =>
                  formatPlural(count, {
                    one: "{count} approach with nothing behind it",
                    other: "{count} approaches with nothing behind them",
                  })
                }
              />
            </>
          )}
          {preview && (
            <RecordPreviewPanel
              title={preview.title}
              label="Approach preview"
              // Beside the ladder, narrow enough to leave it its wires in a 1280px window too.
              defaultWidth={take === "ladder" ? 360 : 480}
              onClose={() => setPick(null)}
              navigation={
                <RecordPreviewActions
                  table="framework_items"
                  record={{ id: preview.id }}
                  rows={stepped}
                  onSelect={(row) => setPick(row.code)}
                />
              }
            >
              <ApproachDetails
                key={preview.code}
                programId={programId}
                ladder={ladder}
                approach={preview}
                baseline={baseline}
                upto={upto}
                requirements={requirements}
                baselineName={baselineName}
              />
            </RecordPreviewPanel>
          )}
        </Stack>
      )}
    </QueryState>
  );
  return heading ? <Section title={heading}>{body}</Section> : body;
}

/**
 * The program's focused Cyber resiliency view: for each control baseline the program adopted, how
 * many of the controls Table E-1 names it holds and how many approaches it leaves with nothing
 * behind them, then the ladder those numbers are counted on, as the ladder or layer by layer. The
 * take, the layer and the narrowing are the address's, so a shared link opens the same reading.
 */
export function ProgramResiliency({ programId }: { programId: string }) {
  const { baselines, queries, ready } = useProgramBaselines(programId);
  const coverage = useControlRequirementCounts(programId);
  return (
    <QueryState queries={[...queries, coverage.query]}>
      {!ready ? null : baselines.length ? (
        <Stack space="space.400" className="min-w-0">
          {baselines.map((baseline) => (
            <ResiliencyView
              key={baseline.choiceId}
              programId={programId}
              baseline={baseline}
              requirements={coverage.counts}
              heading={baselines.length > 1 ? (baseline.adopted?.title ?? "Baseline") : null}
            />
          ))}
        </Stack>
      ) : (
        <EmptyMessage illustration="document" {...noBaseline} />
      )}
    </QueryState>
  );
}
