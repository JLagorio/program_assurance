import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Fragment, useMemo, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

/* Diff: what changed between two texts. Lines are compared first (a paragraph of a narrative is
   a line), then the words of a line that was edited rather than rewritten. The algorithm is
   Myers' shortest edit script, in this file, with no dependency. Every change is marked three
   ways, so no reader depends on colour: a + or − in the gutter, underlined or struck-through
   words, and a visually hidden "Added:" or "Removed:" before the line. */

/* ---------- the algorithm ---------- */

type Edit =
  | { type: "equal"; a: number; b: number }
  | { type: "delete"; a: number }
  | { type: "insert"; b: number };

/** Edit distance past which a comparison stops looking for the shortest script and anchors on what each side has once. */
const LINE_LIMIT = 1000;
const WORD_LIMIT = 500;
/** Two lines are one line edited, and get word marks, when this share of their characters is unchanged. */
const SIMILAR = 0.5;
/** Blocks of removed × added lines up to this size are aligned by similarity; larger ones pair by position. */
const ALIGN_LIMIT = 100;
/** How many times a comparison past its limit anchors and compares the gaps again before it replaces a gap whole. */
const ANCHOR_DEPTH = 16;

/** Myers' O(ND) shortest edit script between a[a0, a1) and b[b0, b1); undefined past `limit` edits. */
function shortest(
  a: readonly string[],
  b: readonly string[],
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  limit: number,
): Edit[] | undefined {
  const n = a1 - a0;
  const m = b1 - b0;
  const out: Edit[] = [];
  if (n === 0 || m === 0) {
    for (let i = a0; i < a1; i++) out.push({ type: "delete", a: i });
    for (let j = b0; j < b1; j++) out.push({ type: "insert", b: j });
    return out;
  }
  const max = n + m;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  // The furthest-reaching x on each diagonal after each round, kept for the walk back.
  const history: Int32Array[] = [];
  let found = -1;
  for (let d = 0; d <= Math.min(max, limit) && found < 0; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (d === 0) x = 0;
      else if (k === -d || (k !== d && v[off + k - 1]! < v[off + k + 1]!)) x = v[off + k + 1]!;
      else x = v[off + k - 1]! + 1;
      let y = x - k;
      while (x < n && y < m && a[a0 + x] === b[b0 + y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
    history.push(v.slice(off - d, off + d + 1));
  }
  if (found < 0) return undefined;
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const prev = history[d - 1]!;
    const at = (k: number) => prev[k + d - 1]!;
    const k = x - y;
    const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
    const pk = down ? k + 1 : k - 1;
    const px = at(pk);
    const py = px - pk;
    const mx = down ? px : px + 1;
    const my = down ? py + 1 : py;
    while (x > mx && y > my) {
      x--;
      y--;
      out.push({ type: "equal", a: a0 + x, b: b0 + y });
    }
    out.push(down ? { type: "insert", b: b0 + py } : { type: "delete", a: a0 + px });
    x = px;
    y = py;
  }
  while (x > 0 && y > 0) {
    x--;
    y--;
    out.push({ type: "equal", a: a0 + x, b: b0 + y });
  }
  return out.reverse();
}

/**
 * The edit script of a[a0, a1) and b[b0, b1), with the common start and end trimmed first. Past
 * `limit` edits, the middle is anchored on the items that occur once on each side, in order (as
 * patience diff does), and each gap between anchors is compared on its own; a gap with no anchor
 * is replaced whole. So a long text with many scattered edits still keeps its unchanged lines.
 */
function compareRange(
  a: readonly string[],
  b: readonly string[],
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  limit: number,
  edits: Edit[],
  depth = 0,
) {
  let start = 0;
  while (a0 + start < a1 && b0 + start < b1 && a[a0 + start] === b[b0 + start]) start++;
  let end = 0;
  while (a1 - end > a0 + start && b1 - end > b0 + start && a[a1 - end - 1] === b[b1 - end - 1])
    end++;
  for (let k = 0; k < start; k++) edits.push({ type: "equal", a: a0 + k, b: b0 + k });
  const [s0, s1, t0, t1] = [a0 + start, a1 - end, b0 + start, b1 - end];
  const middle = shortest(a, b, s0, s1, t0, t1, limit);
  if (middle) edits.push(...middle);
  else {
    const anchors = depth < ANCHOR_DEPTH ? uniqueAnchors(a, b, s0, s1, t0, t1) : [];
    if (anchors.length === 0) {
      for (let i = s0; i < s1; i++) edits.push({ type: "delete", a: i });
      for (let j = t0; j < t1; j++) edits.push({ type: "insert", b: j });
    } else {
      let i = s0;
      let j = t0;
      for (const [ai, bj] of anchors) {
        compareRange(a, b, i, ai, j, bj, limit, edits, depth + 1);
        edits.push({ type: "equal", a: ai, b: bj });
        i = ai + 1;
        j = bj + 1;
      }
      compareRange(a, b, i, s1, j, t1, limit, edits, depth + 1);
    }
  }
  for (let k = 0; k < end; k++) edits.push({ type: "equal", a: a1 - end + k, b: b1 - end + k });
}

/** The items that occur exactly once in a[a0, a1) and once in b[b0, b1), as the longest run of pairs in the same order on both sides. */
function uniqueAnchors(
  a: readonly string[],
  b: readonly string[],
  a0: number,
  a1: number,
  b0: number,
  b1: number,
): [number, number][] {
  const seen = new Map<string, { a: number; b: number; inA: number; inB: number }>();
  for (let i = a0; i < a1; i++) {
    const entry = seen.get(a[i]!);
    if (entry) entry.inA++;
    else seen.set(a[i]!, { a: i, b: -1, inA: 1, inB: 0 });
  }
  for (let j = b0; j < b1; j++) {
    const entry = seen.get(b[j]!);
    if (entry) {
      entry.inB++;
      entry.b = j;
    }
  }
  const pairs = [...seen.values()]
    .filter((entry) => entry.inA === 1 && entry.inB === 1)
    .sort((x, y) => x.a - y.a);
  // Longest increasing run of b positions, by patience sorting: tails[k] ends the best run of k + 1.
  const tails: number[] = [];
  const previous = new Int32Array(pairs.length).fill(-1);
  pairs.forEach((pair, index) => {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pairs[tails[mid]!]!.b < pair.b) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) previous[index] = tails[lo - 1]!;
    tails[lo] = index;
  });
  const run: [number, number][] = [];
  for (let k = tails[tails.length - 1] ?? -1; k >= 0; k = previous[k]!)
    run.push([pairs[k]!.a, pairs[k]!.b]);
  return run.reverse();
}

function editScript(a: readonly string[], b: readonly string[], limit: number): Edit[] {
  const edits: Edit[] = [];
  compareRange(a, b, 0, a.length, 0, b.length, limit, edits);
  return edits;
}

/* Words: a whitespace run, one CJK character, a run of letters, marks and digits, or one other
   character. A regular expression rather than Intl.Segmenter, so the server and the browser cut
   the same words and hydration matches. */
const CJK = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}";
const WORDS = new RegExp(`\\s+|[${CJK}]|(?:(?![${CJK}])[\\p{L}\\p{M}\\p{N}_])+|[^\\s]`, "gu");
const tokens = (text: string) => text.match(WORDS) ?? [];

/** A run of a line's text: `changed` is a word the other version does not have. */
export type DiffSegment = { text: string; changed: boolean };

/** One line of either text. `before` and `after` are its 1-based line numbers; an unchanged line has both. */
export type DiffLine = {
  kind: "equal" | "insert" | "delete";
  text: string;
  /** The line in runs. Word marks appear only on a line that was edited rather than rewritten. */
  segments: DiffSegment[];
  before?: number | undefined;
  after?: number | undefined;
};

/** One row of the side-by-side view: an unchanged line on both sides, an edit (removed beside added), or one side alone. */
export type DiffRow = { before?: DiffLine | undefined; after?: DiffLine | undefined };

export type DiffResult = {
  rows: DiffRow[];
  /** Rows whose earlier line was replaced by a later one: an edit or a rewrite. */
  changed: number;
  /** Lines only in the later text, with nothing beside them. */
  added: number;
  /** Lines only in the earlier text, with nothing beside them. */
  removed: number;
  /** Lines in both texts. */
  unchanged: number;
};

const isEqual = (row: DiffRow) => row.before?.kind === "equal";

type Part = { type: Edit["type"]; text: string };

function segmentsOf(parts: readonly Part[], changed: "delete" | "insert"): DiffSegment[] {
  const out: DiffSegment[] = [];
  for (const part of parts) {
    if (part.type !== "equal" && part.type !== changed) continue;
    const isChanged = part.type === changed;
    const last = out[out.length - 1];
    if (last && last.changed === isChanged) last.text += part.text;
    else out.push({ text: part.text, changed: isChanged });
  }
  return out;
}

/** The words of one edited line, and how much of it stayed. */
function compareWords(a: string, b: string) {
  const ta = tokens(a);
  const tb = tokens(b);
  const parts: Part[] = [];
  for (const edit of editScript(ta, tb, WORD_LIMIT)) {
    const text = edit.type === "insert" ? tb[edit.b]! : ta[edit.a]!;
    const last = parts[parts.length - 1];
    if (last && last.type === edit.type) last.text += text;
    else parts.push({ type: edit.type, text });
  }
  // A space between two changes joins them, so "shall enforce" → "must require" reads as one change.
  for (let i = 1; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (
      part.type === "equal" &&
      /^\s+$/.test(part.text) &&
      parts[i - 1]!.type !== "equal" &&
      parts[i + 1]!.type !== "equal"
    ) {
      parts.splice(i, 1, { type: "delete", text: part.text }, { type: "insert", text: part.text });
      i++;
    }
  }
  const same = parts.reduce((n, part) => (part.type === "equal" ? n + part.text.length : n), 0);
  const total = a.length + b.length;
  return {
    before: segmentsOf(parts, "delete"),
    after: segmentsOf(parts, "insert"),
    similarity: total === 0 ? 1 : (2 * same) / total,
  };
}

const plain = (text: string): DiffSegment[] => [{ text, changed: false }];

/** Pairs a block of removed lines with the added lines that replaced them. */
function alignBlock(dels: DiffLine[], inss: DiffLine[]): DiffRow[] {
  const p = dels.length;
  const q = inss.length;
  const rows: DiffRow[] = [];
  const cache = new Map<number, ReturnType<typeof compareWords>>();
  const words = (i: number, j: number) => {
    const key = i * (q + 1) + j;
    let hit = cache.get(key);
    if (!hit) {
      hit = compareWords(dels[i]!.text, inss[j]!.text);
      cache.set(key, hit);
    }
    return hit;
  };
  const pair = (i: number, j: number, marked: boolean) => {
    const before = dels[i]!;
    const after = inss[j]!;
    if (marked) {
      const w = words(i, j);
      before.segments = w.before;
      after.segments = w.after;
    }
    rows.push({ before, after });
  };
  // Removed and added lines that match nothing sit side by side, by position, without word marks.
  let loose: [number[], number[]] = [[], []];
  const flush = () => {
    const [ds, is] = loose;
    for (let k = 0; k < Math.max(ds.length, is.length); k++)
      rows.push({
        before: ds[k] !== undefined ? dels[ds[k]!] : undefined,
        after: is[k] !== undefined ? inss[is[k]!] : undefined,
      });
    loose = [[], []];
  };
  if (p * q === 0 || p * q > ALIGN_LIMIT) {
    for (let k = 0; k < Math.max(p, q); k++) {
      if (k < p && k < q) pair(k, k, words(k, k).similarity >= SIMILAR);
      else rows.push({ before: dels[k], after: inss[k] });
    }
    return rows;
  }
  // The pairing that keeps the most text, in order: best[i][j] over the lines from i and j on.
  const best = Array.from({ length: p + 1 }, () => new Float64Array(q + 1));
  for (let i = p - 1; i >= 0; i--)
    for (let j = q - 1; j >= 0; j--) {
      const s = words(i, j).similarity;
      best[i]![j] = Math.max(
        best[i + 1]![j]!,
        best[i]![j + 1]!,
        s >= SIMILAR ? s + best[i + 1]![j + 1]! : 0,
      );
    }
  let i = 0;
  let j = 0;
  while (i < p || j < q) {
    if (i < p && j < q) {
      const s = words(i, j).similarity;
      if (s >= SIMILAR && s + best[i + 1]![j + 1]! >= best[i]![j]! - 1e-9) {
        flush();
        pair(i, j, true);
        i++;
        j++;
        continue;
      }
    }
    if (i < p && (j >= q || best[i + 1]![j]! >= best[i]![j + 1]!)) loose[0].push(i++);
    else loose[1].push(j++);
  }
  flush();
  return rows;
}

const splitLines = (text: string) => {
  if (text === "") return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines;
};

/**
 * Compares two texts: lines first, then the words of each line that was edited rather than
 * rewritten. Pure and deterministic, so a server render and the browser agree. The rows are the
 * side-by-side view; the counts are for a summary or a section's count.
 */
export function diffText(before: string, after: string): DiffResult {
  const a = splitLines(before);
  const b = splitLines(after);
  const rows: DiffRow[] = [];
  let dels: DiffLine[] = [];
  let inss: DiffLine[] = [];
  const flush = () => {
    if (dels.length || inss.length) rows.push(...alignBlock(dels, inss));
    dels = [];
    inss = [];
  };
  for (const edit of editScript(a, b, LINE_LIMIT)) {
    if (edit.type === "equal") {
      flush();
      const text = a[edit.a]!;
      const line: DiffLine = {
        kind: "equal",
        text,
        segments: plain(text),
        before: edit.a + 1,
        after: edit.b + 1,
      };
      rows.push({ before: line, after: line });
    } else if (edit.type === "delete") {
      const text = a[edit.a]!;
      dels.push({ kind: "delete", text, segments: plain(text), before: edit.a + 1 });
    } else {
      const text = b[edit.b]!;
      inss.push({ kind: "insert", text, segments: plain(text), after: edit.b + 1 });
    }
  }
  flush();
  const count = { changed: 0, added: 0, removed: 0, unchanged: 0 };
  for (const row of rows) {
    if (isEqual(row)) count.unchanged++;
    else if (row.before && row.after) count.changed++;
    else if (row.after) count.added++;
    else count.removed++;
  }
  return { rows, ...count };
}

/* ---------- folding ---------- */

type Item = { type: "rows"; rows: DiffRow[] } | { type: "fold"; rows: DiffRow[]; id: string };

/** Unchanged runs longer than the context around them fold, unless the fold would hide one line. */
function fold(rows: readonly DiffRow[], context: number): Item[] {
  const items: Item[] = [];
  const push = (list: DiffRow[]) => {
    if (!list.length) return;
    const last = items[items.length - 1];
    if (last?.type === "rows") last.rows.push(...list);
    else items.push({ type: "rows", rows: list });
  };
  let i = 0;
  while (i < rows.length) {
    if (!isEqual(rows[i]!)) {
      push([rows[i]!]);
      i++;
      continue;
    }
    let j = i;
    while (j < rows.length && isEqual(rows[j]!)) j++;
    const keepStart = i > 0 ? context : 0;
    const keepEnd = j < rows.length ? context : 0;
    const hidden = j - i - keepStart - keepEnd;
    if (hidden > 1) {
      push(rows.slice(i, i + keepStart));
      const run = rows.slice(i + keepStart, j - keepEnd);
      items.push({ type: "fold", rows: run, id: `${run[0]!.before!.before}-${run.length}` });
      push(rows.slice(j - keepEnd, j));
    } else push(rows.slice(i, j));
    i = j;
  }
  return items;
}

/* ---------- rendering ---------- */

export type DiffLayout = "inline" | "side-by-side";

export type DiffProps = Omit<useRender.ComponentProps<"div">, "children"> & {
  /** The earlier text. Lines split on line breaks; in a narrative, a paragraph is a line. */
  before: string;
  /** The later text. */
  after: string;
  /**
   * `"inline"` (the default) shows one column: each edited line's earlier version above its later
   * one. `"side-by-side"` puts the earlier text beside the later, row for row, and falls back to
   * inline wherever its own container is narrower than 36rem.
   */
  layout?: DiffLayout | undefined;
  /** What the earlier text is: "Version 3", "Library". Heads its column and the legend. "Before" by default. */
  beforeLabel?: string | undefined;
  /** What the later text is: "Now", "This program". "After" by default. */
  afterLabel?: string | undefined;
  /**
   * Unchanged lines kept on each side of a change. A longer unchanged run folds behind a button
   * that shows it (and the browser's find-in-page opens it). 3 by default; `Infinity` shows every line.
   */
  context?: number | undefined;
  /** Line numbers in a gutter: both versions' inline, each side's side by side. Off by default, since a narrative's lines are paragraphs. */
  lineNumbers?: boolean | undefined;
  /** Sets the lines in the code face, for source and configuration. Off by default. */
  code?: boolean | undefined;
  /** The comparison's accessible name. "Changes from {beforeLabel} to {afterLabel}" by default. */
  label?: string | undefined;
};

const lineTone = {
  equal: "",
  insert: "bg-success-subtler",
  delete: "bg-danger-subtler",
} as const;

function Marker({ kind }: { kind: DiffLine["kind"] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "w-300 shrink-0 select-none py-025 text-center",
        kind === "insert" && "text-success",
        kind === "delete" && "text-danger",
      )}
    >
      {kind === "insert" ? "+" : kind === "delete" ? "−" : " "}
    </span>
  );
}

function LineNumber({ value, width }: { value: number | undefined; width: number }) {
  const { formatNumber } = useLedgerLocale();
  return (
    <span
      aria-hidden="true"
      className="shrink-0 select-none py-025 ps-100 text-end text-subtle tabular-nums"
      style={{ inlineSize: `${width + 1.5}ch` }}
    >
      {value === undefined ? "" : formatNumber(value, { useGrouping: false })}
    </span>
  );
}

/* Direction: code always reads left to right, so a brace never mirrors and indentation stays at
   the left. Prose takes each line's direction from its own text (dir="auto" on the text alone, not
   the hidden prefix), so a Latin statement on a right-to-left page keeps its full stop at its end. */
function LineText({ line, code }: { line: DiffLine; code: boolean }) {
  const { t } = useLedgerLocale();
  return (
    <span
      data-slot="diff-text"
      className="min-w-0 flex-1 whitespace-pre-wrap py-025 pe-150"
      style={{ overflowWrap: "anywhere" }}
    >
      {line.kind !== "equal" ? (
        <span className="sr-only select-none">
          {t(line.kind === "insert" ? "diffAdded" : "diffRemoved")}{" "}
        </span>
      ) : null}
      {code ? (
        <span dir="ltr" className="block">
          <Segments line={line} />
        </span>
      ) : (
        <span dir="auto">
          <Segments line={line} />
        </span>
      )}
    </span>
  );
}

function Segments({ line }: { line: DiffLine }) {
  return line.segments.map((segment, index) => {
    if (!segment.changed) return <Fragment key={index}>{segment.text}</Fragment>;
    // The space around a changed run stays plain, so no mark hangs at a line's edge.
    const [, lead = "", core = "", trail = ""] = /^(\s*)([\s\S]*?)(\s*)$/.exec(segment.text) ?? [];
    if (!core) return <Fragment key={index}>{segment.text}</Fragment>;
    const mark =
      line.kind === "insert" ? (
        <ins
          data-slot="diff-insertion"
          className="rounded-xsmall bg-success-subtle underline underline-offset-2"
        >
          {core}
        </ins>
      ) : (
        <del data-slot="diff-deletion" className="rounded-xsmall bg-danger-subtle line-through">
          {core}
        </del>
      );
    return (
      <Fragment key={index}>
        {lead}
        {mark}
        {trail}
      </Fragment>
    );
  });
}

type RowView = { width: number; code: boolean };

function InlineLine({ line, width, code }: { line: DiffLine } & RowView) {
  return (
    <div data-slot="diff-line" data-kind={line.kind} className={cn("flex", lineTone[line.kind])}>
      {width ? (
        <>
          <LineNumber value={line.before} width={width} />
          <LineNumber value={line.after} width={width} />
        </>
      ) : null}
      <Marker kind={line.kind} />
      <LineText line={line} code={code} />
    </div>
  );
}

/* Side by side, each row is two halves; below 36rem of the Diff's own width the halves stack, the
   unchanged line's second copy and the empty halves go, and the rows read as the inline view. */
const narrowHidden = "@max-xl/diff:hidden";

function SplitRow({ row, width, code }: { row: DiffRow } & RowView) {
  const equal = isEqual(row);
  const half = (line: DiffLine | undefined, side: "before" | "after") => {
    const after = side === "after";
    if (!line)
      return (
        <div
          aria-hidden="true"
          data-slot="diff-empty"
          className={cn(
            "min-w-0 flex-1 bg-surface-sunken",
            after && "border-s border-default",
            narrowHidden,
          )}
        />
      );
    return (
      <div
        data-slot="diff-line"
        data-kind={line.kind}
        aria-hidden={after && equal ? true : undefined}
        className={cn(
          "flex min-w-0 flex-1 @max-xl/diff:flex-none",
          lineTone[line.kind],
          after && "border-s border-default @max-xl/diff:border-s-0",
          after && equal && narrowHidden,
        )}
      >
        {width ? <LineNumber value={after ? line.after : line.before} width={width} /> : null}
        <Marker kind={line.kind} />
        <LineText line={line} code={code} />
      </div>
    );
  };
  return (
    <div data-slot="diff-row" className="flex @max-xl/diff:flex-col">
      {half(row.before, "before")}
      {half(row.after, "after")}
    </div>
  );
}

function Rows({ rows, split, ...view }: { rows: readonly DiffRow[]; split: boolean } & RowView) {
  return rows.map((row) => {
    const key = `${row.before?.before ?? "-"}:${row.after?.after ?? "-"}`;
    if (split) return <SplitRow key={key} row={row} {...view} />;
    if (isEqual(row)) return <InlineLine key={key} line={row.before!} {...view} />;
    return (
      <Fragment key={key}>
        {row.before ? <InlineLine line={row.before} {...view} /> : null}
        {row.after ? <InlineLine line={row.after} {...view} /> : null}
      </Fragment>
    );
  });
}

function Fold({
  children,
  count,
  first,
  last,
}: {
  children: ReactNode;
  count: number;
  first: boolean;
  last: boolean;
}) {
  const { messages, formatPlural } = useLedgerLocale();
  const [open, setOpen] = useState(false);
  const text = formatPlural(
    count,
    open
      ? { one: messages.diffHideLinesOne, other: messages.diffHideLinesOther }
      : { one: messages.diffShowLinesOne, other: messages.diffShowLinesOther },
  );
  return (
    <Collapsible open={open} onOpenChange={setOpen} data-slot="diff-fold">
      <div
        className={cn(
          "bg-surface-sunken px-150 py-075",
          !first && "border-t border-default",
          (open || !last) && "border-b border-default",
        )}
      >
        <CollapsibleTrigger
          render={
            <Button
              data-slot="diff-fold-trigger"
              variant="subtle"
              size="xsmall"
              iconBefore={open ? <ChevronsDownUp /> : <ChevronsUpDown />}
            >
              {text}
            </Button>
          }
        />
      </div>
      <CollapsibleContent hiddenUntilFound>{children}</CollapsibleContent>
    </Collapsible>
  );
}

/**
 * What changed between two texts: removed lines marked − and added lines marked +, the edited
 * words underlined or struck through, unchanged runs folded behind a button. Inline or side by
 * side; side by side falls back to inline in a narrow container.
 */
export function Diff({
  before,
  after,
  layout = "inline",
  beforeLabel,
  afterLabel,
  context = 3,
  lineNumbers = false,
  code = false,
  label,
  className,
  render,
  ref,
  ...props
}: DiffProps) {
  const { t, formatNumber, locale } = useLedgerLocale();
  const result = useMemo(() => diffText(before, after), [before, after]);
  const items = useMemo(
    () => fold(result.rows, Math.max(0, Math.floor(context))),
    [result.rows, context],
  );
  const from = beforeLabel ?? t("diffBefore");
  const to = afterLabel ?? t("diffAfter");
  const split = layout === "side-by-side";
  const width = lineNumbers
    ? String(
        Math.max(
          result.unchanged + result.changed + result.removed,
          result.unchanged + result.changed + result.added,
          1,
        ),
      ).length
    : 0;
  const summary = useMemo(() => {
    const parts = (
      [
        ["diffChangedCount", result.changed],
        ["diffAddedCount", result.added],
        ["diffRemovedCount", result.removed],
      ] as const
    )
      .filter(([, count]) => count > 0)
      .map(([key, count]) => t(key, { count: formatNumber(count) }));
    if (parts.length === 0) return t("diffNoChanges");
    return new Intl.ListFormat(locale, { style: "short", type: "unit" }).format(parts);
  }, [result, t, formatNumber, locale]);
  const caption = (kind: "delete" | "insert") => (
    <span aria-hidden="true" className="inline-flex min-w-0 items-baseline gap-050">
      <span className={kind === "insert" ? "text-success" : "text-danger"}>
        {kind === "insert" ? "+" : "−"}
      </span>
      <span className="min-w-0 font-medium text-default" style={{ overflowWrap: "anywhere" }}>
        {kind === "insert" ? to : from}
      </span>
    </span>
  );
  const header = (
    <div
      data-slot="diff-header"
      className={cn(
        "flex border-b border-default bg-surface-sunken font-body-small text-subtle",
        split
          ? "@max-xl/diff:flex-col"
          : "flex-wrap items-baseline gap-x-300 gap-y-050 px-150 py-075",
      )}
    >
      <span className="sr-only">{t("diffLegend", { before: from, after: to })}</span>
      {split ? (
        <>
          <span className="flex min-w-0 flex-1 px-150 py-075 @max-xl/diff:flex-none @max-xl/diff:pb-0">
            {caption("delete")}
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-300 gap-y-050 border-s border-default px-150 py-075 @max-xl/diff:flex-none @max-xl/diff:border-s-0">
            {caption("insert")}
            <span data-slot="diff-summary" className="ms-auto">
              {summary}
            </span>
          </span>
        </>
      ) : (
        <>
          {caption("delete")}
          {caption("insert")}
          <span data-slot="diff-summary" className="ms-auto">
            {summary}
          </span>
        </>
      )}
    </div>
  );
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    state: { slot: "diff" },
    props: mergeProps<"div">(
      { role: "group", "aria-label": t("diffLabel", { before: from, after: to }) },
      props,
      {
        ...(label !== undefined ? { "aria-label": label } : {}),
        ...{ "data-slot": "diff", "data-layout": layout },
        className: cn(
          "@container/diff w-full min-w-0 overflow-hidden rounded-medium border border-default bg-surface text-default",
          code ? "font-code" : "font-body",
          className,
        ),
        children: (
          <>
            {header}
            <div data-slot="diff-body">
              {items.map((item, index) =>
                item.type === "rows" ? (
                  <Rows
                    key={`rows-${index}`}
                    rows={item.rows}
                    split={split}
                    width={width}
                    code={code}
                  />
                ) : (
                  <Fold
                    key={`fold-${item.id}`}
                    count={item.rows.length}
                    first={index === 0}
                    last={index === items.length - 1}
                  >
                    <Rows rows={item.rows} split={split} width={width} code={code} />
                  </Fold>
                ),
              )}
            </div>
          </>
        ),
      },
    ),
  });
}
