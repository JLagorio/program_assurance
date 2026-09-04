/**
 * Residual risk scoring presentation — the auditable calculation trail.
 *
 * The load-bearing component in this file is `FactorTable`, and what it has to
 * make legible is an argument, not a number:
 *
 *  - **A score with no trail launders judgement as arithmetic.** So the table
 *    prints, per factor, the raw input that was read, the normalised value, the
 *    weight, the points that value bought at that weight, the rationale
 *    sentence, and the ids the rationale rests on. An AO who disagrees can name
 *    the line they disagree with. There is no sparkline and no gauge here on
 *    purpose: a gauge is a claim you cannot argue with.
 *  - **The contributions sum to the score, visibly.** The footer adds the same
 *    column the reader just read and states the total beside the published
 *    score. If a clamp ever bit, it says so rather than absorbing the
 *    difference — an unexplained gap between the column and the headline would
 *    destroy the only thing this table is for.
 *  - **A factor that could not be computed gets a ROW, not a silent absence.**
 *    It prints "not computed", says its weight was never applied, and carries
 *    the caveat sentence explaining why. Scoring a missing input as zero would
 *    quietly assert "not exposed", which is a much stronger claim than "not
 *    known"; hiding the row entirely would let the reader assume the denominator
 *    was 100 when it was 85.
 *  - **The mitigation credit is a negative line, never a silent adjustment.**
 *    It reads as points taken off, next to the inherent number it was taken off
 *    of, so the compensating control can be argued about on its own terms.
 *  - **Authored and computed sit side by side and neither is overwritten.**
 *    `ScoreCard` shows the assessor's register numbers beside the derived ones
 *    and prints the disagreement as prose. Collapsing one into the other erases
 *    the question, and the question is the product.
 *
 * Presentation only. Every value arrives as a prop from `@/lib/risk-scoring`;
 * nothing here scores, weights, bands or sorts anything, and routes own links.
 */

import { useMemo, type ReactNode } from "react";

import {
  Absent,
  Badge,
  Box,
  DataTable,
  Empty,
  Grid,
  Id,
  Inline,
  Progress,
  Stack,
  Table,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import {
  bandTone,
  factorOrder,
  factorWeights,
  type AuthoredComparison,
  type FactorKey,
  type ResidualScore,
  type RiskBand,
  type RiskMover,
  type ScoreFactor,
} from "@/lib/risk-scoring";
import { cn } from "@/lib/utils";

/* ── Shared bits ─────────────────────────────────────────────────────────── */

/**
 * The labels `risk-scoring.ts` puts on its factors. They are duplicated here
 * rather than exported because this file also has to name a factor that is
 * ABSENT from a score — there is no `ScoreFactor` to read the label off when the
 * whole factor could not be computed, and that row is the one worth printing.
 */
const factorLabel: Record<FactorKey, string> = {
  severity: "Severity",
  mission: "Mission impact",
  exploitability: "Exploitability",
  exposure: "Exposure",
  currency: "Evidence currency",
  mitigation: "Mitigation credit",
};

/** `-0` stringifies as "0", but rounding can still hand us one. Normalise it. */
function zeroSafe(n: number): number {
  return n === 0 ? 0 : n;
}

function signed(n: number): string {
  const v = zeroSafe(n);
  return v > 0 ? `+${v}` : String(v);
}

function fixed2(n: number): string {
  return zeroSafe(n).toFixed(2);
}

export function BandChip({ band, size = "small" }: { band: RiskBand; size?: "xsmall" | "small" }) {
  return (
    <Badge size={size} tone={bandTone[band]}>
      {band}
    </Badge>
  );
}

/** The ids a rationale rests on. Never a link — routes own navigation. */
function EvidenceIds({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return (
      <span className="font-body-small text-subtle">
        No ids recorded — this factor rests on the finding itself.
      </span>
    );
  }
  return (
    <Inline as="span" space="space.050" alignBlock="center" shouldWrap>
      {ids.map((id) => (
        <Id
          key={id}
          className="rounded-small bg-neutral px-050 py-025 font-body-xsmall text-subtle"
        >
          {id}
        </Id>
      ))}
    </Inline>
  );
}

function ProseBlock({
  label,
  tone = "muted",
  children,
}: {
  label: string;
  tone?: "muted" | "warning";
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "font-heading-xxsmall uppercase",
          tone === "warning" ? "text-warning" : "text-subtle",
        )}
      >
        {label}
      </div>
      <p className="pt-050 font-body-small text-default">{children}</p>
    </div>
  );
}

/* ── The factor table ────────────────────────────────────────────────────── */

/** The strongest positive term, which is what `leverage` is usually arguing about. */
function topDriver(score: ResidualScore): ScoreFactor | null {
  const positive = score.factors
    .filter((f) => f.weight > 0)
    .slice()
    .sort((a, b) => b.contribution - a.contribution);
  return positive[0] ?? null;
}

/**
 * The calculation, line by line. Every column is arithmetic the reader can redo
 * on paper: `contribution = value × weight × 100`, and the footer adds the
 * column up.
 */
export function FactorTable({ score }: { score: ResidualScore }) {
  const sum = score.factors.reduce((a, f) => a + f.contribution, 0);
  const clamped = sum !== score.score;
  const positive = score.factors.filter((f) => f.weight > 0);
  const ceiling = Math.round(positive.reduce((a, f) => a + f.weight, 0) * 100);
  const positiveKeys = factorOrder.filter((key) => factorWeights[key] > 0);
  const missing = factorOrder.filter((key) => !score.factors.some((f) => f.key === key));

  return (
    <Stack className="pt-200" space="space.100">
      <p className="font-body-small text-subtle">
        Each factor reads a raw input from the record, normalises it to 0–1, and buys{" "}
        <span className="text-default">value × weight × 100</span> points. Nothing else is added:
        the contributions below sum to the published residual, so a reader who disagrees with the
        score can name the line they disagree with rather than the model as a whole.
        {ceiling === 100
          ? ` All ${positiveKeys.length} positive factors and the credit were computable here, so the score runs out of 100.`
          : ` Only ${positive.length} of the ${positiveKeys.length} positive factors could be computed, so this score runs out of ${ceiling}, not 100.`}
      </p>

      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={150}>Factor</Table.Header>
            <Table.Header>Input read</Table.Header>
            <Table.Header width={72} className="text-right">
              Value
            </Table.Header>
            <Table.Header width={76} className="text-right">
              Weight
            </Table.Header>
            <Table.Header width={104} className="text-right">
              Contribution
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          {score.factors.map((f) => (
            <FactorRows key={f.key} factor={f} />
          ))}
          {missing.map((key) => (
            <MissingFactorRows key={key} factorKey={key} caveats={score.caveats} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-default">
            <Table.Cell>Residual</Table.Cell>
            <Table.Cell className="max-w-none whitespace-normal py-100">
              {clamped
                ? `The column sums to ${sum}, outside the 0–100 range; the published score is clamped.`
                : `Sum of the ${score.factors.length} contributions above. The positive factors alone ceiling at ${ceiling}; the credit is what comes back off.`}
            </Table.Cell>
            <Table.Cell className="text-right">
              <Absent />
            </Table.Cell>
            <Table.Cell className="text-right">
              <Absent />
            </Table.Cell>
            <Table.Cell className="tabular-nums text-right">{score.score}</Table.Cell>
          </tr>
        </tfoot>
      </Table>
    </Stack>
  );
}

/** One factor: the arithmetic row, then the sentence it rests on. */
function FactorRows({ factor }: { factor: ScoreFactor }) {
  const credit = factor.weight < 0;
  return (
    <>
      <Table.Row className="border-0 align-top" isStatic>
        <Table.Cell className="py-100 align-top">{factor.label}</Table.Cell>
        <Table.Cell className="max-w-none whitespace-normal py-100 align-top" title={factor.input}>
          {factor.input}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">
          {fixed2(factor.value)}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">
          {fixed2(factor.weight)}
        </Table.Cell>
        <Table.Cell
          className={cn(
            "tabular-nums py-100 align-top text-right",
            credit ? "text-success" : factor.contribution === 0 ? "" : "",
          )}
        >
          {signed(factor.contribution)}
        </Table.Cell>
      </Table.Row>
      <Table.Row className="align-top" isStatic>
        <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={5}>
          <span className="block font-body-small text-subtle">{factor.rationale}</span>
          <Box className="block" as="span" paddingBlockStart="space.075">
            <EvidenceIds ids={factor.evidence} />
          </Box>
        </Table.Cell>
      </Table.Row>
    </>
  );
}

/**
 * A factor with no row would silently change the denominator. This prints the
 * absence, the weight that was never applied, and the caveat that explains it.
 */
function MissingFactorRows({ factorKey, caveats }: { factorKey: FactorKey; caveats: string[] }) {
  const label = factorLabel[factorKey];
  const weight = factorWeights[factorKey];
  const needle = label.toLowerCase();
  const share = Math.abs(Math.round(weight * 100));
  // The module writes the reason itself, in two shapes: a finding-level caveat
  // that opens with the factor's name, and a risk-level one that names the
  // factor mid-sentence. Prefer the authored text over the generic fallback
  // wherever either shape matches, because the authored one says WHY.
  const caveat =
    caveats.find((c) => c.toLowerCase().startsWith(needle)) ??
    caveats.find(
      (c) => c.toLowerCase().includes(needle) && /not applied|could not be computed/i.test(c),
    ) ??
    (weight > 0
      ? `The ${needle} factor could not be computed for this subject, so its ${fixed2(weight)} weight was not applied and the score is out of ${100 - share} rather than 100.`
      : `The ${needle} could not be computed for this subject, so the ${fixed2(weight)} credit was never applied and nothing came off the inherent score.`);
  return (
    <>
      <Table.Row className="border-0 align-top" isStatic>
        <Table.Cell className="py-100 align-top">{label}</Table.Cell>
        <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
          <Badge size="xsmall" tone="warning">
            Not computed
          </Badge>
        </Table.Cell>
        <Table.Cell className="py-100 align-top text-right">
          <Absent />
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right line-through">
          {fixed2(weight)}
        </Table.Cell>
        <Table.Cell className="py-100 align-top text-right">
          <Absent />
        </Table.Cell>
      </Table.Row>
      <Table.Row className="align-top" isStatic>
        <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={5}>
          <span className="block font-body-small text-subtle">{caveat}</span>
        </Table.Cell>
      </Table.Row>
    </>
  );
}

/* ── The headline ────────────────────────────────────────────────────────── */

/**
 * Score, band, and the inherent-to-residual arithmetic — beside the authored
 * register numbers wherever the subject has them. Both are labelled; neither is
 * presented as correcting the other.
 */
export function ScoreCard({
  score,
  comparison,
  subject,
}: {
  score: ResidualScore;
  /** The assessor's register numbers, when the subject is a RegisterRisk. */
  comparison?: AuthoredComparison | undefined;
  /** Human title of the subject, printed above the numbers. */
  subject?: string | undefined;
}) {
  const creditFactor = score.factors.find((f) => f.key === "mitigation");
  const credit = zeroSafe(creditFactor?.contribution ?? 0);
  const reconciles = score.inherent + credit === score.score;
  const driver = topDriver(score);

  return (
    <div className="overflow-hidden rounded-large border border-default">
      <Grid className={cn(comparison ? "sm:grid-cols-2" : "")}>
        <Box paddingInline="space.200" paddingBlock="space.150">
          <div className="font-heading-xxsmall uppercase text-subtle">Computed residual</div>
          <Inline className="pt-050" space="space.100" alignBlock="baseline">
            <span className="tabular-nums font-heading-large font-semibold">{score.score}</span>
            <BandChip band={score.band} />
          </Inline>
          <Box className="tabular-nums font-body-small text-subtle" paddingBlockStart="space.100">
            inherent {score.inherent}
            {credit === 0 ? " · no mitigation credit claimed" : ` − ${Math.abs(credit)} credit`}
            {reconciles && credit !== 0 ? ` = ${score.score}` : ""}
          </Box>
          <Box className="font-body-small text-subtle" paddingBlockStart="space.025">
            {driver
              ? `Largest term: ${driver.label.toLowerCase()}, ${signed(driver.contribution)} on "${driver.input}".`
              : "No positive factor could be computed for this subject."}
          </Box>
          {subject ? (
            <Box
              className="truncate font-body-small text-default"
              title={subject}
              paddingBlockStart="space.075"
            >
              {subject}
            </Box>
          ) : null}
        </Box>

        {comparison ? (
          <Box
            className="border-t border-default sm:border-l sm:border-t-0"
            paddingInline="space.200"
            paddingBlock="space.150"
          >
            <div className="font-heading-xxsmall uppercase text-subtle">
              Authored in the register
            </div>
            <Inline className="pt-050" space="space.100" alignBlock="baseline">
              <span className="tabular-nums font-heading-large font-semibold text-subtle">
                {comparison.authored.residual}
              </span>
              <span className="font-body-small text-subtle">residual</span>
            </Inline>
            <Box className="tabular-nums font-body-small text-subtle" paddingBlockStart="space.100">
              inherent {comparison.authored.inherent} · likelihood {comparison.authored.likelihood}{" "}
              × impact {comparison.authored.impact}
            </Box>
            <Box className="tabular-nums font-body-small text-subtle" paddingBlockStart="space.025">
              Computed sits {Math.abs(comparison.delta)} point
              {Math.abs(comparison.delta) === 1 ? "" : "s"}{" "}
              {comparison.delta === 0 ? "level with" : comparison.delta > 0 ? "above" : "below"} the
              authored residual.
            </Box>
          </Box>
        ) : null}
      </Grid>

      <Stack className="border-t border-default bg-surface-sunken px-200 py-150" space="space.150">
        {comparison ? (
          <ProseBlock label="Authored against computed">{comparison.note}</ProseBlock>
        ) : null}
        <ProseBlock label="Leverage">{score.leverage}</ProseBlock>
        {score.caveats.length > 0 ? (
          <div>
            <div className="font-heading-xxsmall uppercase text-warning">
              {score.caveats.length} caveat{score.caveats.length === 1 ? "" : "s"} — the score is
              provisional
            </div>
            <Stack className="pt-050" as="ul" space="space.050">
              {score.caveats.map((c) => (
                <li key={c} className="font-body-small text-default">
                  {c}
                </li>
              ))}
            </Stack>
          </div>
        ) : null}
      </Stack>
    </div>
  );
}

/* ── Distribution ────────────────────────────────────────────────────────── */

/** How the scored population falls across the five bands. */
export function BandDistribution({ byBand }: { byBand: { band: RiskBand; count: number }[] }) {
  const total = byBand.reduce((a, b) => a + b.count, 0);
  if (total === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing scored"
          description="No finding in this program resolved to a scorable record, so there is no distribution to show."
        />
      </Box>
    );
  }
  return (
    <Stack className="pt-200" space="space.150">
      <Progress.Stacked
        segments={byBand
          .filter((b) => b.count > 0)
          .map((b) => ({
            key: b.band,
            value: b.count,
            tone: bandTone[b.band],
            title: `${b.band}: ${b.count} of ${total}`,
          }))}
        height={10}
      />
      <Stack space="space.075">
        {byBand.map((b) => (
          <Grid
            key={b.band}
            gap="space.150"
            templateColumns="120px 44px 1fr 52px"
            alignItems="center"
          >
            <BandChip band={b.band} size="xsmall" />
            <span className="tabular-nums text-right font-body-small font-medium">{b.count}</span>
            <Progress value={(b.count / total) * 100} tone={bandTone[b.band]} />
            <span className="tabular-nums text-right font-body-small text-subtle">
              {Math.round((b.count / total) * 100)}%
            </span>
          </Grid>
        ))}
      </Stack>
    </Stack>
  );
}

/* ── The scored population ───────────────────────────────────────────────── */

export type ScoredSubject = {
  score: ResidualScore;
  title: string;
  /** Control, component and lifecycle in one line — what identifies the row. */
  context: string;
  /** True when the subject is not part of what the program is carrying today. */
  excluded?: boolean;
  /** Authored register residual, where the subject has one. */
  authored?: number | null;
};

/** A subject flattened onto the columns the table sorts by, with the flags the row shows. */
type ScoredRow = ScoredSubject & {
  subject: string;
  inherent: number;
  credit: number;
  residual: number;
  band: RiskBand;
  driver: ScoreFactor | null;
  isSelected: boolean;
};

/**
 * The scored population, worst first. Inherent, credit and residual are three
 * separate columns because the credit is the number an AO argues about, and a
 * table that prints only the residual hides it. A DataTable: the headers sort,
 * the row selects, and the id reads active for the subject whose trail is open.
 */
export function TopRisksTable({
  rows,
  selected,
  onSelect,
  showAuthored = false,
}: {
  rows: ScoredSubject[];
  selected?: string | null;
  onSelect?: (subject: string) => void;
  /** Adds the authored register residual beside the computed one. */
  showAuthored?: boolean;
}) {
  const data = useMemo<ScoredRow[]>(
    () =>
      rows.map((row) => ({
        ...row,
        subject: row.score.subject,
        inherent: row.score.inherent,
        credit: zeroSafe(row.score.factors.find((f) => f.key === "mitigation")?.contribution ?? 0),
        residual: row.score.score,
        band: row.score.band,
        driver: topDriver(row.score),
        isSelected: selected === row.score.subject,
      })),
    [rows, selected],
  );

  const columns = useMemo(
    () =>
      defineColumns<ScoredRow>((c) => [
        c.id("subject", {
          header: "Subject",
          width: 104,
          hideable: false,
          active: (r) => r.isSelected,
          cell: (r) => (
            <Inline as="span" space="space.075" alignBlock="center">
              <span>{r.subject}</span>
              {r.score.caveats.length > 0 ? (
                <Badge size="xsmall" tone="warning">
                  {r.score.caveats.length}
                </Badge>
              ) : null}
            </Inline>
          ),
        }),
        c.text("title", {
          header: "Title",
          minWidth: 200,
          hideable: false,
          cell: (r) => (
            <span title={r.excluded ? `${r.title} — not carried in the aggregate` : r.title}>
              {r.title}
            </span>
          ),
        }),
        c.text("context", { header: "Where", width: 212 }),
        c.custom("driver", {
          header: "Largest term",
          width: 196,
          cell: (r) =>
            r.driver ? (
              <span title={r.driver.rationale}>
                {r.driver.label} {signed(r.driver.contribution)}
              </span>
            ) : (
              <Absent />
            ),
          sort: (r) => r.driver?.contribution ?? -1,
          text: (r) => (r.driver ? `${r.driver.label} ${signed(r.driver.contribution)}` : ""),
        }),
        c.number("inherent", { header: "Inherent", width: 96 }),
        // A zero credit is a RESULT — nobody claimed a compensating control — so it prints as 0
        // rather than as an em dash, which would read as "not computed".
        c.number("credit", {
          header: "Credit",
          width: 96,
          cell: (r) => (
            <span className={cn(r.credit !== 0 ? "text-success" : "")}>{signed(r.credit)}</span>
          ),
        }),
        ...(showAuthored
          ? [
              c.number("authored", {
                header: "Authored",
                width: 96,
                cell: (r) => (typeof r.authored === "number" ? r.authored : <Absent />),
              }),
            ]
          : []),
        c.number("residual", { header: "Residual", width: 96 }),
        c.status("band", { header: "Band", width: 120, tone: (r) => bandTone[r.band] }),
      ]),
    [showAuthored],
  );

  const table = useDataTable({
    columns,
    data,
    getRowId: (r) => r.subject,
    label: "Scored findings",
    initialState: { sorting: [{ id: "residual", desc: true }] },
  });

  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing to score"
          description="No finding or register risk in this program resolves to a record the model can read, so there is no residual to publish."
        />
      </Box>
    );
  }
  return <DataTable table={table} onRowClick={onSelect ? (r) => onSelect(r.subject) : undefined} />;
}

/* ── Movers ──────────────────────────────────────────────────────────────── */

/**
 * The loop between configuration management and risk, printed as movement. A
 * score that rose because a change invalidated the evidence behind it is the
 * whole reason the currency factor exists; it is worth its own table.
 */
export function MoversTable({ movers }: { movers: RiskMover[] }) {
  if (movers.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing moved"
          description="No finding in this program carries a KEV listing or sits under an unacknowledged significant change, so no score differs from what it would have been on the evidence alone."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={112}>Subject</Table.Header>
          <Table.Header width={88} className="text-right">
            Without
          </Table.Header>
          <Table.Header width={76} className="text-right">
            Published
          </Table.Header>
          <Table.Header width={68} className="text-right">
            Move
          </Table.Header>
          <Table.Header>Why it moved</Table.Header>
        </tr>
      </thead>
      <tbody>
        {movers.map((m) => (
          <Table.Row key={m.subject} className="align-top">
            <Table.Cell className="py-100 align-top">
              <Id>{m.subject}</Id>
            </Table.Cell>
            <Table.Cell className="tabular-nums py-100 align-top text-right line-through">
              {m.from}
            </Table.Cell>
            <Table.Cell className="tabular-nums py-100 align-top text-right">{m.to}</Table.Cell>
            <Table.Cell
              className={cn(
                "tabular-nums py-100 align-top text-right",
                m.to > m.from ? "text-warning" : "text-success",
              )}
            >
              {signed(m.to - m.from)}
            </Table.Cell>
            <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
              {m.why}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ── Authored against computed ───────────────────────────────────────────── */

export type ComparisonRow = { comparison: AuthoredComparison; title: string; treatment: string };

/**
 * The register's numbers and the derived ones, in one table, with the
 * disagreement written out. Neither column is corrected by the other — the
 * authored numbers are what the assessor signed for and this view never
 * overwrites them.
 */
export function AuthoredComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No register risk to compare"
          description="This program carries no register risk with a finding joined to it, so there is no authored residual to set the computed one beside."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={104}>Risk</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={96}>Treatment</Table.Header>
          <Table.Header width={84} className="text-right">
            Authored inherent
          </Table.Header>
          <Table.Header width={84} className="text-right">
            Authored residual
          </Table.Header>
          <Table.Header width={88} className="text-right">
            Computed residual
          </Table.Header>
          <Table.Header width={72} className="text-right">
            Delta
          </Table.Header>
          <Table.Header width={98}>Computed band</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <ComparisonRows
            key={row.comparison.risk}
            comparison={row.comparison}
            title={row.title}
            treatment={row.treatment}
          />
        ))}
      </tbody>
    </Table>
  );
}

function ComparisonRows({
  comparison,
  title,
  treatment,
}: {
  comparison: AuthoredComparison;
  title: string;
  treatment: string;
}) {
  const agrees = Math.abs(comparison.delta) <= 5;
  return (
    <>
      <Table.Row className="border-0 align-top" isStatic>
        <Table.Cell className="py-100 align-top">
          <Id>{comparison.risk}</Id>
        </Table.Cell>
        <Table.Cell className="py-100 align-top" title={title}>
          {title}
        </Table.Cell>
        <Table.Cell className="py-100 align-top">{treatment}</Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">
          {comparison.authored.inherent}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">
          {comparison.authored.residual}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">
          {comparison.computed.residual}
        </Table.Cell>
        <Table.Cell
          className={cn("tabular-nums py-100 align-top text-right", agrees ? "" : "text-warning")}
        >
          {signed(comparison.delta)}
        </Table.Cell>
        <Table.Cell className="py-100 align-top">
          <BandChip band={comparison.computed.band} size="xsmall" />
        </Table.Cell>
      </Table.Row>
      <Table.Row className="align-top" isStatic>
        <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={8}>
          {comparison.note}
        </Table.Cell>
      </Table.Row>
    </>
  );
}

/* ── The model itself ────────────────────────────────────────────────────── */

type ModelRow = { key: FactorKey; reads: string; scale: string };

/**
 * The six factors as documented in `risk-scoring.ts`. This table is the answer
 * to "where did 85 come from" asked one level up from a single finding: a
 * program that cannot inspect the model will not trust a number the model
 * produced, however good the number is.
 */
const modelRows: ModelRow[] = [
  {
    key: "severity",
    reads:
      "The finding's RAW severity at discovery, not the adjudicated one. The credit for adjudication is taken once, on the mitigation line, so it can be argued with separately.",
    scale: "CAT I 1.00 · CAT II 0.60 · CAT III 0.30",
  },
  {
    key: "mission",
    reads:
      "The criticality of the composition node the finding sits on, and any confirmed mission effect on a threat-scenario path that runs through that node, its container or a part inside it. Where an effect exists, the harsher of the two governs and the rationale names which. Absent an effect it rests on criticality alone and says so.",
    scale:
      "Effect: Destroyed / Denied 1.00 · Exfiltrated 0.90 · Manipulated 0.85 · Degraded 0.70, less 0.10 when not reproduced. No effect earns a reduction. Criticality: Mission critical 0.90 · essential 0.65 · support 0.40 · non-critical 0.15",
  },
  {
    key: "exploitability",
    reads:
      "A first-match ladder over the VEX record, the mission-effect log and the finding's own verification path — worst rung first, so the winning clause is the strongest available evidence rather than an average of everything.",
    scale:
      "KEV-listed 1.00 · demonstrated on this system 0.90 · exploitable VEX 0.45 + CVSS×0.05 · machine-checkable STIG rule 0.70 · remote ACAS plugin 0.60 · code scan 0.40 · manual procedure 0.20. A KEV listing against the enclosing image rather than the part adds 0.15, capped at 0.90.",
  },
  {
    key: "exposure",
    reads:
      "`exposurePathsTo` over the composition graph: the least-trusted ground any inbound path reaches back to, widened — below the Public ceiling — by how many distinct entry points there are and whether the path runs entirely over connections with no redundant alternative. The rationale prints the actual path, hop by hop.",
    scale:
      "Entry zone Public 1.00 · DMZ 0.75 · Enclave 0.50 · Management 0.40 · Isolated 0.30, plus 0.05 per extra entry point to a cap of 0.10 and 0.05 for an all-critical path, the sum capped at 1.00 — a Public entry is already at the ceiling, so the widening only separates entries at DMZ or deeper. No inbound path but sitting inside a Public enclosure 0.55; a genuinely interior node 0.10.",
  },
  {
    key: "currency",
    reads:
      "`nodeImpact` from the change log. A determination is only ever true of a configuration; when an unacknowledged significant change moves the component, the evidence stops describing the thing that is running and the residual goes UP rather than staying where the last assessor left it. Where nothing moved, it grades the age of the assessment instead.",
    scale:
      "Invalidated 1.00 · Suspect 0.55 · otherwise evidence older than 180 days 0.40 · older than 90 days 0.25 · recent 0.15",
  },
  {
    key: "mitigation",
    reads:
      "The distance the adjudicated grade travelled below the raw grade, plus a smaller allowance for a written compensating control. It is the only factor that can take points off, and it shows as a negative contribution so the credit is visible rather than folded into the severity line.",
    scale: "0.40 per severity step, plus 0.20 for a recorded compensating control, capped at 1.00",
  },
];

export function FactorModel() {
  const positive = factorOrder.filter((k) => factorWeights[k] > 0);
  const positiveSum = positive.reduce((a, k) => a + factorWeights[k], 0);
  return (
    <Stack className="pt-200" space="space.150">
      <p className="font-body-small text-subtle">
        The {positive.length} positive weights sum to {fixed2(positiveSum)}, so a subject that
        maximises every one of them scores {Math.round(positiveSum * 100)}. The mitigation credit
        sits outside that sum at {fixed2(factorWeights.mitigation)} and can take up to{" "}
        {Math.abs(Math.round(factorWeights.mitigation * 100))} points back off, which is why an
        adjudicated CAT I can still land below an un-mitigated CAT II. The final score is clamped to
        0–100 and a clamp is stated as a caveat, never absorbed.
      </p>
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={150}>Factor</Table.Header>
            <Table.Header className="text-right" width={76}>
              Weight
            </Table.Header>
            <Table.Header>What it reads</Table.Header>
            <Table.Header style={{ width: "34%" }}>Normalisation</Table.Header>
          </tr>
        </thead>
        <tbody>
          {modelRows.map((row) => (
            <Table.Row key={row.key} className="align-top">
              <Table.Cell className="py-100 align-top">{factorLabel[row.key]}</Table.Cell>
              <Table.Cell
                className={cn(
                  "tabular-nums py-100 align-top text-right",
                  factorWeights[row.key] < 0 ? "text-success" : "",
                )}
              >
                {fixed2(factorWeights[row.key])}
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                {row.reads}
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                {row.scale}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}

/** Where the five bands cut. A band is a verdict, so it is the part with colour. */
export function BandLadder({
  byBand,
}: {
  byBand?: { band: RiskBand; count: number }[] | undefined;
}) {
  const counts = new Map((byBand ?? []).map((b) => [b.band, b.count]));
  const ladder: { band: RiskBand; range: string; means: string }[] = [
    {
      band: "Very high",
      range: "80 – 100",
      means:
        "Reachable, exploitable and mission-consequential at once. This is not a queue position; it is a conversation with the AO.",
    },
    {
      band: "High",
      range: "60 – 79",
      means:
        "Two of the three heavy terms are lit. Normally a POA&M with a date the AO has actually agreed to.",
    },
    {
      band: "Moderate",
      range: "40 – 59",
      means:
        "Real, bounded, and usually one factor away from moving in either direction. Left neutral on purpose — the amber has to mean something.",
    },
    { band: "Low", range: "20 – 39", means: "Carried, tracked, and not what is holding the ATO." },
    {
      band: "Very low",
      range: "0 – 19",
      means: "Recorded because it happened, not because it is driving anything.",
    },
  ];
  return (
    <Box paddingBlockStart="space.200">
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={120}>Band</Table.Header>
            <Table.Header width={96}>Score</Table.Header>
            {byBand ? (
              <Table.Header className="text-right" width={96}>
                In this program
              </Table.Header>
            ) : null}
            <Table.Header>What it means here</Table.Header>
          </tr>
        </thead>
        <tbody>
          {ladder.map((row) => (
            <Table.Row key={row.band} className="align-top">
              <Table.Cell className="py-100 align-top">
                <BandChip band={row.band} size="xsmall" />
              </Table.Cell>
              <Table.Cell className="tabular-nums py-100 align-top">{row.range}</Table.Cell>
              {byBand ? (
                <Table.Cell className="tabular-nums py-100 align-top text-right">
                  {counts.get(row.band) ?? 0}
                </Table.Cell>
              ) : null}
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                {row.means}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}
