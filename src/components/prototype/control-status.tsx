import { useMemo } from "react";
import {
  Tally,
  TileMap,
  TileMapKey,
  useLedgerLocale,
  type TallySegment,
  type TileMapGroup,
  type TileMapKeyItem,
  type TileMapLayout,
  type TileMapMark,
} from "@ledger/design-system";
import {
  CONTROL_STATUS_ORDER,
  controlStatusFamilies,
  type ControlStanding,
  type ControlStatus,
  type ControlStatusCounts,
  type ProgramControlStatus,
} from "@/lib/control-status";
import { controlStatuses } from "@/lib/status";

/**
 * How each status is drawn, once: the map's marks and its key read the same entry. An assessor's
 * determinations are the three filled tones; evidence waiting on one is the information fill; a
 * control with no evidence is hollow, not there yet; one no requirement maps says nothing.
 */
const marks = {
  satisfied: { tone: "success", fill: "solid" },
  partially_satisfied: { tone: "warning", fill: "solid" },
  other_than_satisfied: { tone: "danger", fill: "solid" },
  not_assessed: { tone: "information", fill: "solid" },
  no_evidence: { tone: "neutral", fill: "outline" },
  no_requirement: { tone: "neutral", fill: "empty" },
} as const satisfies Record<ControlStatus, Pick<TileMapMark, "tone" | "fill">>;

/** The key's order: what an assessor decided first, then what waits. */
const KEY_ORDER = [...CONTROL_STATUS_ORDER].reverse();

/**
 * What each mark of a control status map means, with how many controls stand there. Satisfied is
 * always said, so the reader sees what done looks like; another status is said once a control
 * stands at it.
 */
export function ControlStatusKey({ counts }: { counts: ControlStatusCounts }) {
  const { formatNumber } = useLedgerLocale();
  const items = KEY_ORDER.filter((status) => status === "satisfied" || counts[status] > 0).map(
    (status): TileMapKeyItem => ({
      label: controlStatuses[status].label,
      value: formatNumber(counts[status]),
      ...marks[status],
    }),
  );
  return <TileMapKey items={items} />;
}

/**
 * A program's control baseline as one bar: each status its share of the baseline, in the key's
 * order and the map's marks, so the key that explains the map explains the bar. For a table cell
 * beside the number it stands for; the bar is named, and says each status with its count.
 */
export function ControlStatusTally({
  status,
  label,
}: {
  status: Pick<ProgramControlStatus, "total" | "counts">;
  /** The bar's name: whose baseline it is. */
  label: string;
}) {
  const { formatNumber } = useLedgerLocale();
  const segments = KEY_ORDER.map((key): TallySegment => ({
    key,
    value: status.counts[key],
    label: `${formatNumber(status.counts[key])} ${controlStatuses[key].label.toLowerCase()}`,
    ...marks[key],
  }));
  return <Tally segments={segments} total={status.total} size="large" label={label} />;
}

/**
 * Every control of a program's control baseline as one mark, coloured by where the program stands
 * on it: `grid` is a row a family, `strip` the whole baseline in one run for a card. A mark says
 * its control, its status and what the program holds for it, in words. Give the same controls as a
 * table one step away: the program's Control baseline view.
 */
export function ControlStatusMap({
  status,
  layout = "grid",
  label,
}: {
  status: Pick<ProgramControlStatus, "controls">;
  layout?: TileMapLayout | undefined;
  /** The map's name: whose baseline it is. */
  label: string;
}) {
  const { formatNumber } = useLedgerLocale();
  const groups = useMemo(() => {
    const mark = (control: ControlStanding): TileMapMark => ({
      id: control.id,
      label: `${control.code} ${control.title}`,
      description: `${controlStatuses[control.status].label} · ${formatNumber(control.requirements)} ${
        control.requirements === 1 ? "requirement" : "requirements"
      }, ${formatNumber(control.evidenced)} with evidence`,
      ...marks[control.status],
    });
    return controlStatusFamilies(status.controls).map((family): TileMapGroup => ({
      id: family.code,
      label: family.code,
      title: family.title ?? "Unnamed family",
      value: formatNumber(family.total),
      marks: family.controls.map((control) => ({
        ...mark(control),
        parts: control.enhancements.map(mark),
      })),
    }));
  }, [status.controls, formatNumber]);
  return <TileMap label={label} layout={layout} groups={groups} />;
}
