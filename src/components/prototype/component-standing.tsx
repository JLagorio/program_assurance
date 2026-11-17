// What holds for a library component's standing wherever it is drawn: the Components register's
// Controls satisfied cell, the component record's one-line standing under its header, and its
// Overview's Controls satisfied tray. Satisfied counts out of every control the version claims or
// is judged on (42 of 61), and the tally shows what nobody judged (Josef's decision of
// 2026-11-15, "Counting"). One map of the standings, a tone and a fill each, feeds every tally and
// key, so a status keeps one colour: a determination in its tone, To review hollow in warning, Not
// assessed in the neutral tone.

import {
  Grid,
  Inline,
  Tally,
  Text,
  TileMapKey,
  useLedgerLocale,
  type TallySegment,
  type TileMapKeyItem,
} from "@ledger/design-system";
import type { ReactElement, ReactNode } from "react";
import type { ComponentStanding, StandingLine } from "@/lib/component-record";
import { componentStandings } from "@/lib/status";

/** How each standing is drawn, once: the tallies and the keys read the same entry. */
export const standingMarks = {
  satisfied: { tone: "success", fill: "solid" },
  partially_satisfied: { tone: "warning", fill: "solid" },
  other_than_satisfied: { tone: "danger", fill: "solid" },
  to_review: { tone: "warning", fill: "outline" },
  not_assessed: { tone: "neutral", fill: "solid" },
} as const satisfies Record<ComponentStanding, Pick<TallySegment, "tone" | "fill">>;

/** The bar's order: what an assessor found, the best first, then what waits. */
export const TALLY_ORDER: readonly ComponentStanding[] = [
  "satisfied",
  "partially_satisfied",
  "other_than_satisfied",
  "to_review",
  "not_assessed",
];

/** The short words a line of counts uses after each number: "6 partially", "4 other than". */
const SHORT: Record<ComponentStanding, string> = {
  satisfied: "satisfied",
  partially_satisfied: "partially",
  other_than_satisfied: "other than",
  to_review: "to review",
  not_assessed: "not assessed",
};

/**
 * A component version's controls as one bar, each standing its share, named with each standing
 * and its count. `large` beside the number in a register's cell; `xlarge` where the bar is the
 * reading, as in a tray.
 */
export function StandingTally({
  line,
  label,
  size = "large",
}: {
  line: Pick<StandingLine, "total" | "counts">;
  label: string;
  size?: "medium" | "large" | "xlarge" | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const segments = TALLY_ORDER.map((key): TallySegment => ({
    key,
    value: line.counts[key],
    label: `${formatNumber(line.counts[key])} ${componentStandings[key].label.toLowerCase()}`,
    ...standingMarks[key],
  }));
  return <Tally segments={segments} total={line.total} size={size} label={label} />;
}

type LinkElement = ReactElement<{ className?: string | undefined; children?: ReactNode }>;

/**
 * The record's one-line standing, under its header: how many controls, the bar, each standing
 * that holds a control with its count (Satisfied always, so the reader sees what done looks like),
 * and how many determinations were carried from an earlier version. With `link`, a standing opens
 * the Assessment tab at it.
 */
export function StandingLineKey({
  line,
  name,
  link,
}: {
  line: StandingLine;
  /** Whose controls: the component and its version, which names the bar. */
  name: string;
  link?: ((standing: ComponentStanding) => LinkElement) | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const items = TALLY_ORDER.filter((key) => key === "satisfied" || line.counts[key] > 0).map(
    (key): TileMapKeyItem => ({
      label: SHORT[key],
      value: formatNumber(line.counts[key]),
      ...standingMarks[key],
      ...(link && line.counts[key] > 0 ? { link: link(key) } : {}),
    }),
  );
  return (
    <Inline space="space.200" alignBlock="center" shouldWrap>
      {/* The count and its bar stay together, the bar as long as the line's figures need. */}
      <Grid templateColumns="auto 160px" gap="space.150" alignItems="center">
        <Text weight="medium" numeric>
          {formatNumber(line.total)} {line.total === 1 ? "control" : "controls"}
        </Text>
        <StandingTally line={line} size="medium" label={`Controls of ${name}, by standing`} />
      </Grid>
      <TileMapKey aria-label={`Controls of ${name}`} items={items} />
      {line.carried > 0 && (
        <Text color="color.text.subtle" numeric>
          {formatNumber(line.carried)} carried
          {line.carriedFrom === null ? " forward" : ` from version ${line.carriedFrom}`}
        </Text>
      )}
    </Inline>
  );
}
