import { useMemo } from "react";
import {
  Stack,
  TileMap,
  useLedgerLocale,
  type TileMapGroup,
  type TileMapLayout,
  type TileMapMark,
} from "@ledger/design-system";
import type { ProgramBaseline } from "@/lib/baseline-reads";
import { controlStanding, type ControlStanding, type StackStep } from "@/lib/baseline-stack";
import type { Row } from "@/lib/models";
import { baselineControlStatuses } from "@/lib/status";

type Status = ControlStanding["status"];
export type BaselineFamily = Pick<Row<"catalog_groups">, "id" | "source_id" | "title" | "ordinal">;

/**
 * How each standing is drawn, once: the map's marks and its key read the same entry, and so do the
 * tallies and the ladder of the Cyber resiliency view.
 */
export const marks = {
  in_baseline: { tone: "neutral", fill: "solid" },
  added: { tone: "brand", fill: "solid" },
  removed: { tone: "warning", fill: "outline" },
  not_selected: { tone: "neutral", fill: "empty" },
} as const satisfies Record<Status, Pick<TileMapMark, "tone" | "fill">>;
const statuses = Object.keys(marks) as Status[];
/**
 * Read by a technique, a control behind it that the baseline leaves out is the gap the reader
 * looks for, so it is hollow: the faint mark is then a control outside the technique.
 */
const techniqueMarks = {
  ...marks,
  not_selected: { tone: "neutral", fill: "outline" },
} as const satisfies Record<Status, Pick<TileMapMark, "tone" | "fill">>;
/**
 * A control outside the technique the map is read by: it keeps its place and says nothing, the
 * kit's mark for an item with nothing to say. It is not `dimmed` as well: that fades an empty mark
 * out of sight, and the catalog would lose its shape.
 */
const setBack = {
  tone: "neutral",
  fill: "empty",
} as const satisfies Pick<TileMapMark, "tone" | "fill">;

/** A resiliency technique the map is read by: its name, and the controls that support it. */
export type BaselineMapTechnique = {
  title: string;
  controlIds: Pick<ReadonlySet<string>, "has">;
};

/**
 * Every control of the catalog as one mark, by family, coloured by where it stands in the
 * baseline at the step the reader chose, under a key that counts each standing. A mark opens its
 * family in the List, the map's table. Read by a technique, only the controls that support it are
 * coloured and counted: the others are set back, so the catalog keeps its shape.
 */
export function BaselineMap({
  baseline,
  groups,
  step,
  layout,
  technique,
  onSelectFamily,
}: {
  baseline: ProgramBaseline;
  /** The catalog's families. */
  groups: readonly BaselineFamily[];
  /** The stack after the layers the reader chose. */
  step: StackStep;
  layout: TileMapLayout;
  /** The technique the map is read by; none marks every control. */
  technique?: BaselineMapTechnique | null | undefined;
  /** Opens a family's controls in the List. */
  onSelectFamily: (familyId: string) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const layers = baseline.derivation.layers;

  // The catalog's shape: each family's controls in order, an enhancement under its control.
  // Withdrawn controls are left off: nothing can select them.
  const shape = useMemo(() => {
    const active = [...baseline.controls.values()]
      .filter((control) => control.status !== "withdrawn")
      .sort((a, b) => a.source_id.localeCompare(b.source_id, "en", { numeric: true }));
    const ids = new Set(active.map((control) => control.id));
    const parts = new Map<string, typeof active>();
    for (const control of active)
      if (control.parent_control_id && ids.has(control.parent_control_id))
        parts.set(control.parent_control_id, [
          ...(parts.get(control.parent_control_id) ?? []),
          control,
        ]);
    return groups
      .slice()
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((group) => ({
        group,
        roots: active
          .filter(
            (control) =>
              control.group_id === group.id &&
              !(control.parent_control_id && ids.has(control.parent_control_id)),
          )
          .map((control) => ({ control, parts: parts.get(control.id) ?? [] })),
      }))
      .filter((family) => family.roots.length);
  }, [baseline.controls, groups]);

  const drawn = technique ? techniqueMarks : marks;
  const { families, counts } = useMemo(() => {
    const layerTitle = new Map(layers.map((layer) => [layer.key, layer.title]));
    const counts: Record<Status, number> = {
      in_baseline: 0,
      added: 0,
      removed: 0,
      not_selected: 0,
    };
    type Control = (typeof shape)[number]["roots"][number]["control"];
    type Tally = { marked: number; selected: number };
    const mark = (control: Control, inGroup: Tally): TileMapMark => {
      const label = `${control.code} ${control.title}`;
      // Colour never says it alone: a control set back says why in words.
      if (technique && !technique.controlIds.has(control.id))
        return {
          id: control.id,
          label,
          description: `Does not support ${technique.title}`,
          ...setBack,
        };
      const { status, layerKey } = controlStanding(step, control.id);
      counts[status] += 1;
      inGroup.marked += 1;
      if (status === "in_baseline" || status === "added") inGroup.selected += 1;
      const by = layerKey ? (layerTitle.get(layerKey) ?? "a layer") : null;
      return {
        id: control.id,
        label,
        description:
          status === "added"
            ? `Added by ${by}`
            : status === "removed"
              ? `Removed by ${by}`
              : baselineControlStatuses[status].label,
        ...drawn[status],
      };
    };
    const families = shape.map(({ group, roots }): TileMapGroup => {
      const inGroup: Tally = { marked: 0, selected: 0 };
      const groupMarks = roots.map(({ control, parts }) => ({
        ...mark(control, inGroup),
        parts: parts.map((part) => mark(part, inGroup)),
      }));
      return {
        id: group.id,
        label: (group.source_id ?? "").toUpperCase(),
        title: group.title ?? "Unnamed family",
        // A family none of whose controls is marked has nothing to count.
        ...(inGroup.marked ? { value: formatNumber(inGroup.selected) } : {}),
        marks: groupMarks,
      };
    });
    return { families, counts };
  }, [layers, shape, step, technique, drawn, formatNumber]);

  return (
    <Stack space="space.200" className="min-w-0">
      <TileMap.Key
        aria-label="Key"
        items={statuses.map((status) => ({
          label: baselineControlStatuses[status].label,
          value: formatNumber(counts[status]),
          ...drawn[status],
        }))}
      />
      <TileMap
        label={
          technique
            ? `Catalog controls by family: those that support ${technique.title}, coloured by where each stands in the baseline`
            : "Catalog controls by family, coloured by where each stands in the baseline"
        }
        layout={layout}
        groups={families}
        onSelect={(_, family) => onSelectFamily(family.id)}
      />
    </Stack>
  );
}
