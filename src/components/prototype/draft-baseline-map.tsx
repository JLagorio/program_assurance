import { useEffect, useMemo, useState } from "react";
import {
  Absent,
  announce,
  DataTable,
  defineColumns,
  Inline,
  Stack,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from "@ledger/design-system";
import {
  controlStanding,
  deriveStack,
  layerInput,
  stackAt,
  type BaselineDerivation,
} from "@/lib/baseline-stack";
import { baselineControlStatuses } from "@/lib/status";
import { BaselineMap, type BaselineFamily, type MapBaseline } from "./baseline-map";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink } from "./record-preview";

type BaselineStatus = keyof typeof baselineControlStatuses;
type ControlRow = {
  id: string;
  name: string;
  family: string;
  status: BaselineStatus;
  /** The layer that added or removed it; none for a control no layer changed. */
  layer: string | null;
};
type View = "grid" | "list";
const views: { value: View; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
];

const familyName = (group: BaselineFamily) =>
  `${(group.source_id ?? "").toUpperCase()} ${group.title ?? "Unnamed family"}`;

/** The List's columns: a control's name opens the catalog's record of it, in a new tab's reach. */
const columns = defineColumns<ControlRow>((c) => [
  c.text("name", {
    header: "Control",
    priority: 0,
    minWidth: 200,
    cell: (row) => (
      <RecordLink table="controls" record={{ id: row.id }}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.text("family", { header: "Family", width: 240, priority: 3 }),
  c.status("status", {
    header: "Status",
    width: 140,
    priority: 1,
    statuses: baselineControlStatuses,
  }),
  c.text("layer", {
    header: "Changed by",
    width: 240,
    priority: 2,
    cell: (row) => row.layer ?? <Absent label="No layer changed it" />,
  }),
]);

/**
 * The control baseline a draft program profile results in, under its stack table in program
 * setup: the catalog as the Control baseline view draws it, a Grid of one mark a control by family
 * in the baseline statuses under the key that counts each, or the same controls as a List, one
 * toggle apart. The stack table says what each layer did; the map and its List say where each
 * control ends up. A mark opens its family in the List.
 */
export function DraftBaselineMap({
  label,
  controls,
  groups,
  stack,
  added,
  excluded,
}: {
  /** The program profile the baseline is of, which names the toggle and the List. */
  label: string;
  /** The catalog's controls by id. */
  controls: MapBaseline["controls"];
  groups: readonly BaselineFamily[];
  /** The draft's stack: its baseline or baselines and its overlays, as setup reads them. */
  stack: BaselineDerivation;
  /** What the program's tailoring adds and takes out, by control id, applied last. */
  added: readonly string[];
  excluded: readonly string[];
}) {
  const [view, setView] = useState<View>("grid");
  // The draft's result: its stack, then the program's tailoring as its last layer.
  const derivation = useMemo(
    () =>
      added.length || excluded.length
        ? deriveStack(stackAt(stack, 0).selected, [
            ...stack.layers.map(layerInput),
            {
              key: "tailoring",
              kind: "tailoring",
              title: "Program tailoring",
              decisions: [
                ...added.map((controlId) => ({
                  controlId,
                  action: "include" as const,
                  rationale: null,
                })),
                ...excluded.map((controlId) => ({
                  controlId,
                  action: "exclude" as const,
                  rationale: null,
                })),
              ],
            },
          ])
        : stack,
    [stack, added, excluded],
  );
  const baseline = useMemo(() => ({ controls, derivation }), [controls, derivation]);
  const step = useMemo(
    () => stackAt(baseline.derivation, baseline.derivation.layers.length),
    [baseline.derivation],
  );
  const rows = useMemo((): ControlRow[] => {
    const layerTitle = new Map(baseline.derivation.layers.map((layer) => [layer.key, layer.title]));
    const families = new Map(groups.map((group) => [group.id, familyName(group)]));
    return [...baseline.controls.values()]
      .filter((control) => control.status !== "withdrawn")
      .sort((a, b) => a.source_id.localeCompare(b.source_id, "en", { numeric: true }))
      .map((control) => {
        const { status, layerKey } = controlStanding(step, control.id);
        return {
          id: control.id,
          name: `${control.code} ${control.title}`,
          family: families.get(control.group_id ?? "") ?? "",
          status,
          layer: layerKey ? (layerTitle.get(layerKey) ?? "A layer") : null,
        };
      });
  }, [baseline, groups, step]);
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: `Controls of ${label}`,
  });
  // A family chosen on the map, asked of the List once it is on the page.
  const [opening, setOpening] = useState<string | null>(null);
  useEffect(() => {
    if (view !== "list" || opening === null) return;
    table.setGlobalFilter("");
    table.setColumnFilters([{ id: "family", value: [opening] }]);
    setOpening(null);
  }, [view, opening, table]);
  return (
    <Stack space="space.150" className="min-w-0">
      <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
        <Text weight="semibold">Resulting baseline</Text>
        <ToggleGroup
          size="small"
          spacing={0}
          variant="outline"
          aria-label={`Show the resulting baseline of ${label} as`}
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
      {view === "grid" ? (
        <BaselineMap
          baseline={baseline}
          groups={groups}
          step={step}
          layout="grid"
          onSelectFamily={(familyId) => {
            const group = groups.find((item) => item.id === familyId);
            if (!group) return;
            setOpening(familyName(group));
            setView("list");
            announce(`${familyName(group)} controls shown as a list.`);
          }}
        />
      ) : (
        <ProductCollection
          table={table}
          compact
          keepQuestion={false}
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
            description: "The catalog holds no active control.",
          }}
        />
      )}
    </Stack>
  );
}
