import { Table2 } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Table } from "./table";
import type { TallySegment } from "./tally";
import { Toggle } from "./toggle";
import { Absent } from "./typography";

/* Climb: a whole, rung by rung, as one bar with the gaps to scale, the rungs' counts under it and
   the same numbers as a table one toggle away. Its segments and swatches are a Tally's, painted by
   src/styles/tally.css, which also holds the bar's three-pixel floor. */

/** One rung of the climb, from the first. */
export type ClimbRung = {
  /** Unique among the rungs. */
  key: string;
  /** What reaching the rung means, named under its count: "Requirement", "Evidence". */
  label: string;
  /**
   * What stopped under the rung: one segment, or its parts where a judgement splits it (13 other
   * than satisfied, 34 partially satisfied). Each is a Tally segment, drawn to scale in its tone and
   * fill, and its `label` ("14 to map") is said under the rung and in the table. Keys are unique in
   * the climb.
   */
  stopped: TallySegment | readonly TallySegment[];
};

export type ClimbProps = Omit<ComponentProps<"figure">, "children"> & {
  /** The climb's name: what climbs and what it counts ("Controls of the baseline"). It names the figure, and its table as the table of it. */
  label: string;
  /** What the climb starts from, named under the whole's count: "Selected". */
  start: string;
  /** The rungs in order, from the first. Each rung's count is the whole less what stopped under it and every rung before. */
  rungs: readonly ClimbRung[];
  /** What reached the last rung: the bar's last segment, in its tone ("174 satisfied", `tone: "success"`). Its value is the last rung's count. */
  reached: TallySegment;
};

/** A segment's count: never below nothing. */
const amount = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);
const partsOf = (stopped: TallySegment | readonly TallySegment[]): readonly TallySegment[] =>
  "value" in stopped ? [stopped] : stopped;

function Swatch({ segment }: { segment: TallySegment }) {
  return (
    <span
      aria-hidden
      data-slot="climb-swatch"
      data-tone={segment.tone ?? "neutral"}
      data-fill={segment.fill ?? "solid"}
    />
  );
}

/**
 * A whole as it climbs a ladder of rungs, drawn as one bar: each segment is what stopped under a
 * rung, to scale against the whole, and the last is what reached the top, so the widest gap is the
 * widest segment. A segment is never thinner than three pixels, so one of hundreds still shows.
 * Under the bar each rung says how many reached it and what stopped under it, the widest gap in
 * the warning colour once; the same numbers are a table one toggle away. It describes a standing:
 * for a whole in states with no order use a Tally, and for a structure of nodes a Ladder. The
 * figure's native props and ref reach its box.
 */
export function Climb({ label, start, rungs, reached, className, ...props }: ClimbProps) {
  const { t, formatNumber } = useLedgerLocale();
  const [table, setTable] = useState(false);

  const steps = rungs.map((rung) => {
    const parts = partsOf(rung.stopped);
    return { rung, parts, gap: parts.reduce((sum, part) => sum + amount(part.value), 0) };
  });
  const total = steps.reduce((sum, step) => sum + step.gap, 0) + amount(reached.value);
  let left = total;
  const climbed = steps.map((step) => {
    left -= step.gap;
    return { ...step, reached: left };
  });
  // The widest gap, once: the first where two are as wide.
  const widest = climbed.reduce(
    (best, step, index) => (step.gap > (climbed[best]?.gap ?? 0) ? index : best),
    -1,
  );
  const last = climbed.length - 1;
  // A segment of nothing is no part of the bar: a zero is quiet.
  const segments = [...climbed.flatMap((step) => step.parts), reached].filter(
    (segment) => amount(segment.value) > 0,
  );
  const said = (parts: readonly TallySegment[]) =>
    parts
      .filter((part) => amount(part.value) > 0)
      .map((part) => part.label ?? formatNumber(amount(part.value)))
      .join(", ");

  return (
    <figure
      {...props}
      aria-label={label}
      data-slot="climb"
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
              <Table.Header>{t("climbRung")}</Table.Header>
              <Table.Header align="end">{t("climbReached")}</Table.Header>
              <Table.Header>{t("climbStopped")}</Table.Header>
            </tr>
          </thead>
          <tbody>
            <Table.Row isStatic>
              <Table.Cell rowHeader>{start}</Table.Cell>
              <Table.Cell align="end">{formatNumber(total)}</Table.Cell>
              <Table.Cell>
                <Absent label={t("climbStart")} />
              </Table.Cell>
            </Table.Row>
            {climbed.map((step) => (
              <Table.Row key={step.rung.key} isStatic>
                <Table.Cell rowHeader>{step.rung.label}</Table.Cell>
                <Table.Cell align="end">{formatNumber(step.reached)}</Table.Cell>
                <Table.Cell wrap>{said(step.parts) || formatNumber(0)}</Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      ) : (
        <>
          <span aria-hidden data-slot="climb-bar">
            {segments.map((segment) => (
              <span
                key={segment.key}
                data-slot="climb-segment"
                data-tone={segment.tone ?? "neutral"}
                data-fill={segment.fill ?? "solid"}
                title={segment.label}
                style={{ flexGrow: amount(segment.value) }}
              />
            ))}
          </span>
          <ol data-slot="climb-rungs" className="flex flex-wrap gap-x-300 gap-y-150">
            <li data-slot="climb-rung" className="flex min-w-0 max-w-full flex-col">
              <span className="font-body-large font-semibold tabular-nums">
                {formatNumber(total)}
              </span>
              <span className="font-body-small text-subtle">{start}</span>
            </li>
            {climbed.map((step, index) => (
              <li
                key={step.rung.key}
                data-slot="climb-rung"
                data-widest={index === widest ? "" : undefined}
                className="flex min-w-0 max-w-full flex-col"
              >
                <span className="font-body-large font-semibold tabular-nums">
                  {formatNumber(step.reached)}
                </span>
                <span className="flex items-center gap-075 font-body-small text-subtle">
                  {index === last && amount(reached.value) > 0 ? (
                    <Swatch segment={reached} />
                  ) : null}
                  {step.rung.label}
                </span>
                {step.parts
                  .filter((part) => amount(part.value) > 0)
                  .map((part) => (
                    <span
                      key={part.key}
                      data-slot="climb-gap"
                      className={cn(
                        "flex items-center gap-075 font-body-small",
                        index === widest ? "font-medium text-warning" : "text-subtle",
                      )}
                    >
                      <Swatch segment={part} />
                      {part.label ?? formatNumber(amount(part.value))}
                    </span>
                  ))}
              </li>
            ))}
          </ol>
        </>
      )}
    </figure>
  );
}
