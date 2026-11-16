import { Table2 } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Table } from "./table";
import { Toggle } from "./toggle";

/* ObjectiveCells: the items a whole is judged on, rung by rung, one cell an item, with the same
   cells as a table one toggle away. A cell is a Tally segment in a Meter's or a Climb's paint
   (src/styles/tally.css): hollow is the gap, grey is waiting, a hue is a judgement, and the ink of
   a rung reached and the faint slot of one not reached yet are the cells' own. */

/** A judgement's tone: hue is spent only on a judgement. */
export type ObjectiveCellsTone = "neutral" | "success" | "warning" | "danger";

/** A judgement of an item, in words and a tone: "Other than satisfied", `danger`. */
export type ObjectiveCellsJudgement = {
  /** The judgement in words: the cell's state, said with its label and written in the table. */
  label: string;
  tone: ObjectiveCellsTone;
};

/** One rung of the climb, from the first. */
export type ObjectiveCellsRung = {
  /** Unique among the rungs. */
  key: string;
  /** What reaching the rung means, at the row's start: "Mapped", "Evidence". */
  label: string;
};

/** One item the whole is judged on: an assessment objective of a control. */
export type ObjectiveCellsObjective = {
  /** Unique among the objectives. */
  id: string;
  /** Its label, read with its state: "SI-02a.[01]". */
  label: string;
  /**
   * The run it belongs to: a statement part ("a"). Objectives of one group stand together, a wider
   * gap between groups; give them in order, since a group is a run of neighbours.
   */
  group?: string | undefined;
  /** How many rungs it has reached, from the first: 0 for none, the number of rungs for all. */
  reached: number;
  /**
   * The rung it stopped under waits on someone (an assessor, a reviewer) rather than being owed:
   * grey, where an owed rung is hollow.
   */
  waiting?: boolean | undefined;
  /**
   * A judgement of it: its hue on the rung it lands on, the rung it stopped under or, where it
   * reached every rung, the last.
   */
  judgement?: ObjectiveCellsJudgement | undefined;
};

/** The cells' size: `small` 8px, `medium` 12px, `large` 20px. */
export type ObjectiveCellsSize = "small" | "medium" | "large";

export type ObjectiveCellsProps = Omit<ComponentProps<"figure">, "children"> & {
  /** The figure's name: whose objectives and what the cells say ("SI-2 objectives by rung"). It names the table twin too. */
  label: string;
  /** The rungs in order, from the first: a row each. */
  rungs: readonly ObjectiveCellsRung[];
  /** The objectives in order, grouped by `group`: a cell each in every row, so a column is one objective. */
  objectives: readonly ObjectiveCellsObjective[];
  /** `small` 8px cells beside body text, `medium` 12px, `large` 20px on a control's own page. @default "medium" */
  size?: ObjectiveCellsSize | undefined;
};

/** How a cell stands: the rung reached, the gap under it, waiting on someone, not reached yet, or judged. */
type CellState = "reached" | "gap" | "waiting" | "not-yet" | "judged";

const whole = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

/** The state of one objective's cell on one rung. */
function stateAt(objective: ObjectiveCellsObjective, rung: number, rungs: number): CellState {
  const reached = Math.min(whole(objective.reached), rungs);
  if (objective.judgement && rung === Math.min(reached, rungs - 1)) return "judged";
  if (rung < reached) return "reached";
  if (rung === reached) return objective.waiting ? "waiting" : "gap";
  return "not-yet";
}

/** A cell's paint as a Tally segment's: a tone and a fill. */
function paintOf(objective: ObjectiveCellsObjective, state: CellState) {
  switch (state) {
    case "judged":
      return { tone: objective.judgement?.tone ?? "neutral", fill: "solid" };
    case "gap":
      return { tone: "neutral", fill: "outline" };
    case "waiting":
      return { tone: "neutral", fill: "solid" };
    case "not-yet":
      return { tone: "neutral", fill: "empty" };
    default:
      // The ink of a rung reached is the cells' own (tally.css), over a neutral solid.
      return { tone: "neutral", fill: "solid" };
  }
}

/** The objectives as runs of neighbours that share a group. */
function runsOf(objectives: readonly ObjectiveCellsObjective[]) {
  const runs: ObjectiveCellsObjective[][] = [];
  let last: string | undefined;
  for (const [index, objective] of objectives.entries()) {
    if (index === 0 || objective.group !== last) runs.push([]);
    runs.at(-1)!.push(objective);
    last = objective.group;
  }
  return runs;
}

/**
 * A control's assessment objectives, rung by rung: a row a rung (mapped, evidence, assessed,
 * satisfied) and a cell an objective in every row, so a column is one objective and the row where
 * its cells turn hollow is where it stopped. Solid ink is a rung reached, hollow the gap, grey a
 * rung waiting on someone, a hue a judgement and a faint slot a rung not reached yet. Each row ends
 * in how many reached it of those that reached the rung before, and the same cells are a table one
 * toggle away. The cells are not links: at this size a cell is a picture of the whole, and each is
 * named by its objective's label and state. The figure's native props and ref reach its box.
 */
export function ObjectiveCells({
  label,
  rungs,
  objectives,
  size = "medium",
  className,
  ...props
}: ObjectiveCellsProps) {
  const { t, formatNumber } = useLedgerLocale();
  const prefix = useId();
  const [table, setTable] = useState(false);
  const runs = runsOf(objectives);
  const count = rungs.length;

  const words = (objective: ObjectiveCellsObjective, state: CellState) =>
    state === "judged"
      ? (objective.judgement?.label ?? "")
      : t(
          state === "reached"
            ? "objectiveCellsReached"
            : state === "gap"
              ? "objectiveCellsMissing"
              : state === "waiting"
                ? "objectiveCellsWaiting"
                : "objectiveCellsNotYet",
        );
  // A rung's count: how many reached it, of those that reached the rung before (of all, for the first).
  const counted = rungs.map((_, index) => ({
    value: objectives.filter((objective) => whole(objective.reached) > index).length,
    total: objectives.filter((objective) => whole(objective.reached) >= index).length,
  }));

  return (
    <figure
      {...props}
      aria-label={label}
      data-slot="objective-cells"
      data-size={size}
      className={cn("flex min-w-0 flex-col gap-150", className)}
    >
      <span className="flex justify-end">
        {/* Its name stays "Table"; `aria-pressed` says whether the table shows, as a chart's does. */}
        <Toggle size="small" pressed={table} onPressedChange={setTable}>
          <Table2 className="size-icon-small" aria-hidden />
          {t("chartTable")}
        </Toggle>
      </span>
      {table ? (
        <Table label={t("tableLabel", { label })}>
          <thead>
            <tr>
              <Table.Header>{t("objectiveCellsObjective")}</Table.Header>
              {rungs.map((rung) => (
                <Table.Header key={rung.key}>{rung.label}</Table.Header>
              ))}
            </tr>
          </thead>
          <tbody>
            {objectives.map((objective) => (
              <Table.Row key={objective.id} isStatic>
                <Table.Cell rowHeader>{objective.label}</Table.Cell>
                {rungs.map((rung, index) => (
                  <Table.Cell key={rung.key} wrap>
                    {words(objective, stateAt(objective, index, count))}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </tbody>
        </Table>
      ) : (
        <div data-slot="objective-cells-rungs">
          {rungs.map((rung, index) => {
            const { value, total } = counted[index]!;
            // The count drawn in two weights: the value in the text colour, the rest subtle.
            const [before = "", after = ""] = t("objectiveCellsOf", {
              total: formatNumber(total),
            }).split("{value}");
            const name = `${prefix}-${index}`;
            return (
              <div
                key={rung.key}
                role="group"
                aria-labelledby={total ? `${name}-label ${name}-value` : `${name}-label`}
                data-slot="objective-cells-rung"
              >
                <span id={`${name}-label`} data-slot="objective-cells-rung-label">
                  {rung.label}
                </span>
                <span data-slot="objective-cells-cells">
                  {runs.map((run) => (
                    <span key={run[0]!.id} data-slot="objective-cells-run">
                      {run.map((objective) => {
                        const state = stateAt(objective, index, count);
                        const paint = paintOf(objective, state);
                        return (
                          <span
                            key={objective.id}
                            role="img"
                            aria-label={t("objectiveCellsName", {
                              label: objective.label,
                              state: words(objective, state),
                            })}
                            data-slot="objective-cell"
                            data-state={state}
                            data-tone={paint.tone}
                            data-fill={paint.fill}
                          />
                        );
                      })}
                    </span>
                  ))}
                </span>
                <span
                  id={`${name}-value`}
                  data-slot="objective-cells-value"
                  className="whitespace-nowrap font-body-small tabular-nums text-subtle"
                >
                  {total ? (
                    <>
                      {before}
                      <span className="font-medium text-default">{formatNumber(value)}</span>
                      {after}
                    </>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </figure>
  );
}
