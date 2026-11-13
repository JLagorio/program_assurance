import type { ReactNode } from "react";
import { Table, Text } from "@ledger/design-system";
import type { BaselineLayer } from "@/lib/baseline-stack";

/** What the stack table needs of a layer: a saved or draft one, or the program's unsaved tailoring. */
export type StackRow = Pick<
  BaselineLayer,
  "key" | "kind" | "title" | "added" | "removed" | "total"
> & {
  /** How many parameters the layer sets values for. */
  parameters?: number | undefined;
};

/**
 * How a control baseline is formed, read top to bottom: the reference baseline, each overlay and
 * the tailoring in the order they apply, with what each added and removed, how many parameters it
 * sets values for and the running count, then the result. One line a row, numbers only. Its
 * order is its meaning, so it is the kit `Table`, with no search or sort. With `actions` (program
 * setup, Edit overlays) the layer's name and its controls are pinned at the two ends, so in a
 * narrow frame the numbers scroll between them and every layer's controls stay in reach.
 */
export function BaselineStackTable({
  label,
  reference,
  layers,
  name = (layer) => layer.title,
  actions,
  resultLabel = "Resulting baseline",
}: {
  /** The table's name: the baseline it derives. */
  label: string;
  /** The starting baseline and how many controls it selects. */
  reference: { name: ReactNode; count: number };
  layers: readonly StackRow[];
  /** A layer's name, as a link to its record where it has one. */
  name?: ((layer: StackRow) => ReactNode) | undefined;
  /** A layer's own controls (move, remove), which adds the last column. */
  actions?: ((layer: StackRow, index: number) => ReactNode) | undefined;
  resultLabel?: string | undefined;
}) {
  const result = layers.at(-1)?.total ?? reference.count;
  // The two ends a narrow frame keeps in view while the numbers scroll between them; the name
  // wraps, and its floor leaves both ends room in a 340px phone's dialog.
  const start = actions ? ({ pinned: "start", edge: "scrolled" } as const) : {};
  const end = actions ? ({ pinned: "end", edge: "scrolled" } as const) : {};
  const change = (layer: StackRow, kind: "added" | "removed") => {
    const count = layer[kind];
    if (!count) return <Text color="color.text.subtle">0</Text>;
    return `${kind === "added" ? "+" : "−"}${count}`;
  };
  const values = (layer: StackRow) =>
    layer.parameters ? layer.parameters : <Text color="color.text.subtle">0</Text>;
  return (
    <Table aria-label={label}>
      <thead>
        <tr>
          <Table.Header minWidth={actions ? 136 : 220} {...start}>
            Layer
          </Table.Header>
          <Table.Header width={120}>Type</Table.Header>
          <Table.Header align="end" width={96}>
            Added
          </Table.Header>
          <Table.Header align="end" width={96}>
            Removed
          </Table.Header>
          <Table.Header align="end" width={112}>
            Parameters
          </Table.Header>
          <Table.Header align="end" width={96}>
            Controls
          </Table.Header>
          {actions ? (
            <Table.Header align="end" width={132} {...end}>
              Actions
            </Table.Header>
          ) : null}
        </tr>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Cell wrap {...start}>
            {reference.name}
          </Table.Cell>
          <Table.Cell>Baseline</Table.Cell>
          <Table.Cell />
          <Table.Cell />
          <Table.Cell />
          <Table.Cell align="end">{reference.count}</Table.Cell>
          {actions ? <Table.Cell {...end} /> : null}
        </Table.Row>
        {layers.map((layer, index) => (
          <Table.Row key={layer.key}>
            <Table.Cell wrap {...start}>
              {name(layer)}
            </Table.Cell>
            <Table.Cell>{layer.kind === "overlay" ? "Overlay" : "Tailoring"}</Table.Cell>
            <Table.Cell align="end">{change(layer, "added")}</Table.Cell>
            <Table.Cell align="end">{change(layer, "removed")}</Table.Cell>
            <Table.Cell align="end">{values(layer)}</Table.Cell>
            <Table.Cell align="end">{layer.total}</Table.Cell>
            {actions ? (
              <Table.Cell align="end" {...end}>
                {actions(layer, index)}
              </Table.Cell>
            ) : null}
          </Table.Row>
        ))}
        <Table.Row>
          <Table.Cell wrap {...start}>
            <Text weight="semibold">{resultLabel}</Text>
          </Table.Cell>
          <Table.Cell />
          <Table.Cell />
          <Table.Cell />
          <Table.Cell />
          <Table.Cell align="end">
            <Text weight="semibold">{result}</Text>
          </Table.Cell>
          {actions ? <Table.Cell {...end} /> : null}
        </Table.Row>
      </tbody>
    </Table>
  );
}
