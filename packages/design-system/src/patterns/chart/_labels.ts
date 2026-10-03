/*
 * Reference and band labels in one row above a plot, spread so they do not overlap and stay over
 * their marks, shortened only as far as the row needs. The width of a text is the caller's
 * `measure` (the canvas in a browser); pure otherwise, so `node --test` covers it.
 */

/** A text's width in pixels. */
export type Measure = (text: string) => number;

/** The width of a text where nothing can measure it: 6.5px a character, the average of `font.body.xsmall`. */
export const estimateWidth: Measure = (text) => text.length * 6.5;

export type TopLabel = {
  key: string;
  text: string;
  /** Where it belongs: a line's x, or a band's middle. */
  at: number;
  /** The mark's extent: a line's x at both ends, a band's two ends. */
  from: number;
  to: number;
  width: number;
  weight: number;
  /** The whole text, when `text` is shortened. */
  full?: string | undefined;
};

export type Placed = { key: string; text: string; full: string | undefined; x: number };

/** The fewest characters a shortened label keeps; a label with room for fewer drops out. */
export const MIN_CHARACTERS = 3;

/** The longest cut of a label, with an ellipsis and the whole kept in `full`, that `fits`; null when none that keeps `MIN_CHARACTERS` does. */
function longestCut(
  label: TopLabel,
  fits: (cut: TopLabel) => boolean,
  measure: Measure,
): TopLabel | null {
  const full = label.full ?? label.text;
  let best: TopLabel | null = null;
  let lo = MIN_CHARACTERS;
  let hi = full.length - 1;
  while (lo <= hi) {
    const n = Math.floor((lo + hi) / 2);
    const text = `${full.slice(0, n).trimEnd()}…`;
    const cut = { ...label, text, width: measure(text), full };
    if (fits(cut)) {
      best = cut;
      lo = n + 1;
    } else hi = n - 1;
  }
  return best;
}

/** A label cut with an ellipsis to at most `max` pixels, the whole kept in `full`; null when it cannot keep `MIN_CHARACTERS`. */
export const shorten = (label: TopLabel, max: number, measure: Measure): TopLabel | null =>
  label.width <= max ? label : longestCut(label, (cut) => cut.width <= max, measure);

/**
 * Where a label's middle may sit and still read as its mark's: over its band, however wide the
 * label; or, for a line, with the line under the text or within a gap of its end (so the labels
 * of two lines close together can sit either side of them).
 */
const reach = (l: TopLabel, gap: number) =>
  l.from < l.to
    ? ([l.from, l.to] as const)
    : ([l.at - l.width / 2 - gap, l.at + l.width / 2 + gap] as const);

/**
 * Where a group of labels, set left to right `gap` apart, may start and still keep every member
 * within its `reach` and the group within `[lo, hi]`: it cannot when `min` passes `max`.
 */
function groupStart(members: TopLabel[], lo: number, hi: number, gap: number) {
  let min = lo;
  let max = hi;
  let o = 0;
  for (const m of members) {
    const [a, b] = reach(m, gap);
    const inset = o + m.width / 2;
    min = Math.max(min, a - inset);
    max = Math.min(max, b - inset);
    o += m.width + gap;
  }
  return { min, max: Math.min(max, hi - Math.max(o - gap, 0)) };
}

/**
 * One pass of the row: each label keeps to where it belongs unless it would touch its neighbour;
 * then the two move apart as one group, the lighter further, as far as every member's `reach` and
 * `[lo, hi]` allow. The first group that cannot satisfy them is the conflict, with how far it
 * misses: one found later may only be in its way because it sits where it cannot.
 */
function placeRow(
  row: TopLabel[],
  lo: number,
  hi: number,
  gap: number,
): { placed: Placed[] } | { conflict: TopLabel[]; by: number } {
  type Group = { members: TopLabel[]; start: number; width: number };
  let conflict: { conflict: TopLabel[]; by: number } | null = null;
  const offsets = (g: Group) => {
    let o = 0;
    return g.members.map((m) => {
      const at = o;
      o += m.width + gap;
      return at;
    });
  };
  const place = (g: Group) => {
    const offs = offsets(g);
    const { min, max } = groupStart(g.members, lo, hi, gap);
    if (min > max + 0.5) conflict ??= { conflict: g.members, by: min - max };
    const total = g.members.reduce((n, m) => n + m.weight, 0);
    const start =
      g.members.reduce((n, m, i) => n + m.weight * (m.at - m.width / 2 - (offs[i] ?? 0)), 0) /
      total;
    g.start = Math.max(min, Math.min(start, max));
  };
  const groups: Group[] = [...row]
    .sort((a, b) => a.at - b.at)
    .map((m) => ({ members: [m], start: m.at - m.width / 2, width: m.width }));
  groups.forEach(place);
  for (let i = 1; i < groups.length;) {
    const a = groups[i - 1]!;
    const b = groups[i]!;
    if (a.start + a.width + gap <= b.start) {
      i++;
      continue;
    }
    const merged: Group = {
      members: [...a.members, ...b.members],
      start: a.start,
      width: a.width + gap + b.width,
    };
    place(merged);
    groups.splice(i - 1, 2, merged);
    i = Math.max(1, i - 1);
  }
  if (conflict) return conflict;
  return {
    placed: groups.flatMap((g) => {
      const offs = offsets(g);
      return g.members.map((m, i) => ({
        key: m.key,
        text: m.text,
        full: m.full,
        x: g.start + (offs[i] ?? 0) + m.width / 2,
      }));
    }),
  };
}

/**
 * Labels in one row that do not overlap, stay within `[lo, hi]` and stay over their marks. A
 * line's label weighs more than a band's, so it keeps closer to its line. Where the row cannot
 * hold them all, the lightest label in the way whose shortening narrows the miss (the widest of
 * equals) shortens with an ellipsis, its whole text kept for a title, until they fit; one that
 * cannot keep `MIN_CHARACTERS` drops out. Then every label shortened or dropped is offered back,
 * the heaviest first, whole or as long as the row holds it, so none gives up more than it must.
 */
export function spreadLabels(
  labels: TopLabel[],
  lo: number,
  hi: number,
  gap = 8,
  measure: Measure = estimateWidth,
): Placed[] {
  let row = labels;
  const miss = (members: TopLabel[]) => {
    if (!members.length) return -Infinity;
    const { min, max } = groupStart(members, lo, hi, gap);
    return min - max;
  };
  // Each round takes a character from a label at least, or drops one, so the row places within
  // as many rounds as it has characters.
  const rounds = labels.reduce((n, l) => n + (l.full ?? l.text).length + 1, 1);
  for (let round = 0; round <= rounds; round++) {
    const result = placeRow(row, lo, hi, gap);
    if ("placed" in result) {
      for (const label of [...labels].sort((a, b) => b.weight - a.weight)) {
        const now = row.find((l) => l.key === label.key);
        if (now && !now.full) continue;
        // The row with this label as `l`, in the order the labels came.
        const withIt = (l: TopLabel) =>
          labels.flatMap((m) => (m.key === label.key ? [l] : row.filter((r) => r.key === m.key)));
        const holds = (l: TopLabel) => "placed" in placeRow(withIt(l), lo, hi, gap);
        const text = label.full ?? label.text;
        const whole = { ...label, text, width: measure(text), full: undefined };
        const back = holds(whole) ? whole : longestCut(whole, holds, measure);
        if (back && (!now || back.width > now.width)) row = withIt(back);
      }
      const final = placeRow(row, lo, hi, gap);
      return "placed" in final ? final.placed : result.placed;
    }
    // Only a label whose shortening, or dropping out, narrows the miss gives way: in a group held
    // between the plot's start and a line, cutting that line's label or a window's after it
    // gains nothing, and the window would give up its words for nothing.
    const { conflict, by } = result;
    const inWay = [...conflict].sort((a, b) => a.weight - b.weight || b.width - a.width);
    const narrows = inWay.filter((l) => {
      const cut = shorten(l, l.width - 0.5, measure);
      return miss(conflict.flatMap((m) => (m === l ? (cut ? [cut] : []) : [m]))) < by - 0.01;
    });
    const [loser, rival] = narrows.length ? narrows : inWay;
    if (!loser) break;
    // By what the row misses, and no further than the next widest of its weight, so equals give
    // up alike; `shorten` takes a character at least.
    const toRival = rival?.weight === loser.weight ? loser.width - rival.width : Infinity;
    const next = shorten(loser, loser.width - Math.max(Math.min(by, toRival), 0.5), measure);
    row = row.flatMap((l) => (l === loser ? (next ? [next] : []) : [l]));
  }
  return [];
}

/**
 * How many slots apart a point axis prints its labels, when its categories are points `slot`
 * pixels apart (a line's or an area's): 1, every category, while each label keeps its whole or
 * `MIN_CHARACTERS` and an ellipsis in a slot less `gap`; past that, the fewest slots that give every
 * label that room, so the labels step evenly from the first rather than each shrink to a letter.
 */
export function pointStep(labels: string[], slot: number, measure: Measure, gap = 8): number {
  if (!labels.length || !(slot > 0)) return 1;
  const need = Math.max(
    ...labels.map((l) => Math.min(measure(l), measure(`${l.slice(0, MIN_CHARACTERS).trimEnd()}…`))),
  );
  return Math.min(labels.length, Math.max(1, Math.ceil((need + gap) / slot)));
}

/**
 * A category label fitted to its band: whole on one line when it fits, else on two lines broken
 * at a space, each cut with an ellipsis to the band, else one line cut to the band. Every category
 * keeps a label; the whole name is the tick's title. `lines` allows the second line.
 */
export function fitLabel(text: string, room: number, measure: Measure, lines: 1 | 2 = 2): string[] {
  const cut = (t: string) => {
    if (measure(t) <= room) return t;
    let lo = 1;
    let hi = t.length - 1;
    let best = `${t.slice(0, 1)}…`;
    while (lo <= hi) {
      const n = Math.floor((lo + hi) / 2);
      const candidate = `${t.slice(0, n).trimEnd()}…`;
      if (measure(candidate) <= room) {
        best = candidate;
        lo = n + 1;
      } else hi = n - 1;
    }
    return best;
  };
  if (measure(text) <= room) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  if (lines === 2 && words.length > 1) {
    // The longest first line that fits, the rest on the second.
    let split = 1;
    for (let i = 1; i < words.length; i++) {
      if (measure(words.slice(0, i).join(" ")) <= room) split = i;
      else break;
    }
    return [cut(words.slice(0, split).join(" ")), cut(words.slice(split).join(" "))];
  }
  return [cut(text)];
}
