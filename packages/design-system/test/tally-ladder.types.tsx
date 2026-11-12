import { createRef } from "react";
import {
  Ladder,
  Tally,
  type LadderLevel,
  type LadderMark,
  type LadderNode,
  type TallyFill,
  type TallySegment,
  type TallyTone,
  type TileMapFill,
  type TileMapTone,
} from "../src/index";

// A tally's segment and a ladder's mark wear a TileMap mark's tones and fills, so one map of a
// screen's states feeds a TileMap.Key, a Tally and a Ladder. The unions are declared twice (a
// component never imports a pattern); these lines fail when one gains a name the other lacks.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const tones: Same<TallyTone, TileMapTone> = true;
const fills: Same<TallyFill, TileMapFill> = true;
void tones;
void fills;

const drawn = {
  in_baseline: { tone: "neutral", fill: "solid" },
  added: { tone: "brand", fill: "solid" },
  removed: { tone: "warning", fill: "outline" },
  not_selected: { tone: "neutral", fill: "empty" },
} as const satisfies Record<string, { tone: TileMapTone; fill: TileMapFill }>;

const segments: TallySegment[] = [
  { key: "in", value: 61, ...drawn.in_baseline, label: "61 in baseline" },
  { key: "removed", value: 3, ...drawn.removed },
];
const marks: LadderMark[] = [{ key: "ac-2", label: "AC-2 Account Management", ...drawn.added }];

// Tally: the span's native props and ref reach its box; it draws no children.
const span = createRef<HTMLSpanElement>();
<Tally segments={segments} />;
<Tally
  ref={span}
  id="held"
  segments={segments}
  total={265}
  size="xlarge"
  scale={0.5}
  label="Held"
/>;
<Tally segments={segments} tone="danger" />;
// @ts-expect-error A tally's own tone is neutral or danger: a segment carries the chart tones.
<Tally segments={segments} tone="brand" />;
// @ts-expect-error The status tones are ProgressStacked's: a segment has no "accent".
<Tally segments={[{ key: "a", value: 1, tone: "accent" }]} />;
// @ts-expect-error A tally is drawn from its segments.
<Tally segments={segments}>61</Tally>;

// Ladder: a node may be flagged, and marked with the words that say why.
const node: LadderNode = {
  id: "redundancy",
  title: "Redundancy",
  value: 8,
  total: 16,
  valueLabel: "8 of 16 controls held",
  segments,
  flagged: false,
  marked: "Chosen by the program",
};
const levels: LadderLevel[] = [
  { id: "techniques", label: "Techniques", nodes: [node] },
  {
    id: "approaches",
    label: "Approaches",
    layout: "rows",
    nodes: [{ id: "surplus", title: "Surplus Capacity", marks }],
    empty: "No approach",
  },
];
const box = createRef<HTMLDivElement>();
<Ladder label="What stands behind each technique" levels={levels} links={[]} />;
<Ladder
  ref={box}
  id="ladder"
  label="What stands behind each technique"
  levels={levels}
  links={[{ from: "surplus", to: "redundancy" }]}
  selected={null}
  onSelect={(chosen) => void chosen?.id}
  highlighted={["surplus"]}
  details={(row) => row.title}
  flagLabel={(count) => `${count} flagged`}
  size="small"
/>;
// @ts-expect-error A ladder is named: its label says what the levels are and what the figures count.
<Ladder levels={levels} links={[]} />;
// @ts-expect-error A mark never stands without its words.
const bare: LadderNode = { id: "a", title: "A", marked: true };
void bare;
