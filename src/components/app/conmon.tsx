/**
 * Continuous monitoring presentation — the morning queue and the drift trail.
 *
 * Two things have to survive contact with this file:
 *
 *  - **The alert list is the product.** A ConMon lead opens one page a day and
 *    the only question that page has to answer is "what diverged overnight and
 *    what do I do about it". So every alert prints, in this order: how bad it
 *    is, what kind of divergence it is, which object it is about, when it
 *    started, the sentence carrying the actual numbers, the sentence saying
 *    what to do next, and the ids the claim rests on. No alert is ever reduced
 *    to a coloured dot and a count — a dashboard tile that says "3 issues" is
 *    a thing you learn to stop clicking.
 *  - **`DriftFactorTable` reads exactly like `FactorTable` in
 *    `risk-scoring.tsx`**, on purpose. Residual risk and authorization drift
 *    are the same shape of argument applied to two different questions — a
 *    weighted sum over factors each of which names the input it read — and a
 *    reader who has learned one table should not have to learn a second one.
 *    Same columns, same footer that adds the column up, same treatment of a
 *    factor that could not be computed: a ROW that prints the absence and the
 *    weight that was never applied, never a silent omission that quietly moves
 *    the denominator.
 *
 * A row whose finding sentence is worth reading gets a second row to hold it.
 * On the schedule and freshness tables that is deliberately restricted to rows
 * in a state somebody has to act on: printing the sentence under all 36 current
 * controls would bury the eight overdue ones, and the sentence for a healthy
 * row says nothing the columns have not already said. Nothing is hidden by that
 * choice — the healthy row's sentence is still on its `title`.
 *
 * Presentation only. Every value arrives as a prop from `@/lib/conmon`; nothing
 * here computes a date, a status, a band or an order, and routes own every
 * link. No clock is read anywhere in this file.
 */

import type { ReactNode } from "react";

import { Absent, Badge, Box, Empty, Grid, Id, Inline, Stack, Table } from "@ledger/design-system";
import {
  alertSeverityTone,
  assessmentStatusTone,
  driftBandTone,
  driftFactorOrder,
  driftFactorWeights,
  freshnessTone,
  slcmMethodTone,
  type CadenceRow,
  type ConMonAlert,
  type DriftBand,
  type DriftFactor,
  type DriftScore,
  type EvidenceSlaRow,
  type ScheduleRow,
  type SlippageRow,
} from "@/lib/conmon";
import { statusTone } from "@/lib/spine";
import { cn } from "@/lib/utils";

/* ── Shared bits ─────────────────────────────────────────────────────────── */

/** `-0` stringifies as "0", but rounding can still hand us one. Normalise it. */
function zeroSafe(n: number): number {
  return n === 0 ? 0 : n;
}

function fixed2(n: number): string {
  return zeroSafe(n).toFixed(2);
}

/** A day count that is genuinely absent renders as an em dash, never as 0. */
function Days({ value, suffix = "d" }: { value: number | null; suffix?: string }) {
  if (value === null) return <Absent />;
  return (
    <span className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

/** The ids a statement rests on. Never a link — routes own navigation. */
function EvidenceIds({ ids, empty }: { ids: string[]; empty: string }) {
  if (ids.length === 0) {
    return <span className="font-body-small text-subtle">{empty}</span>;
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

/* ── Chips ───────────────────────────────────────────────────────────────── */

/**
 * A drift band is only as good as the weight behind it. When most of the model
 * could not be computed the band is a floor, not a verdict — so a provisional
 * band never borrows the reassuring tone, whatever it says.
 */
export function DriftBandChip({
  band,
  size = "small",
  provisional = false,
}: {
  band: DriftBand;
  size?: "xsmall" | "small";
  provisional?: boolean;
}) {
  return (
    <Badge size={size} tone={provisional ? "neutral" : driftBandTone[band]}>
      {provisional ? `${band} — provisional` : band}
    </Badge>
  );
}

export function AssessmentStatusChip({ status }: { status: ScheduleRow["status"] }) {
  return (
    <Badge size="xsmall" tone={assessmentStatusTone[status]}>
      {status}
    </Badge>
  );
}

export function FreshnessChip({ freshness }: { freshness: EvidenceSlaRow["freshness"] }) {
  return (
    <Badge size="xsmall" tone={freshnessTone[freshness]}>
      {freshness}
    </Badge>
  );
}

/**
 * Three of the four SLCM methods are properties and stay neutral. "Undetermined"
 * is the exception and it is not decoration: a ConMon strategy that cannot state
 * how a control is monitored fails the eMASS Appendix J review.
 */
export function MethodChip({ method }: { method: ScheduleRow["method"] }) {
  return (
    <Badge size="xsmall" tone={slcmMethodTone[method]}>
      {method}
    </Badge>
  );
}

/* ── The drift headline ──────────────────────────────────────────────────── */

/**
 * Score, band, the weight that was actually applied, and the one sentence the
 * module wrote about this program — with the caveats underneath rather than
 * folded into the number. A drift score built on 35 of the model's 100 points
 * is a floor, and saying so is the difference between a measurement and a
 * claim.
 */
export function DriftCard({
  score,
  asOf,
  subject,
}: {
  score: DriftScore;
  /** The fixed as-of date the whole page was computed against. */
  asOf: string;
  /** Human name of the program, printed under the numbers. */
  subject?: string | undefined;
}) {
  const applied = Math.round(score.factors.reduce((a, f) => a + f.weight, 0) * 100);
  const largest = score.factors.reduce<DriftFactor | null>(
    (best, f) => (best === null || f.contribution > best.contribution ? f : best),
    null,
  );

  return (
    <div className="overflow-hidden rounded-large border border-default">
      <Grid templateColumns={{ sm: "minmax(0,260px) minmax(0,1fr)" }}>
        <Box paddingInline="space.200" paddingBlock="space.150">
          <div className="font-heading-xxsmall uppercase text-subtle">Authorization drift</div>
          <Inline className="pt-050" space="space.100" alignBlock="baseline">
            <span className="tabular-nums font-heading-large font-semibold">{score.score}</span>
            <span className="font-body-small text-subtle">/ 100</span>
            <DriftBandChip band={score.band} />
          </Inline>
          <Box className="tabular-nums font-body-small text-subtle" paddingBlockStart="space.100">
            {applied === 100
              ? `All ${score.factors.length} factors measured · full 100 points of weight applied`
              : `${score.factors.length} of ${driftFactorOrder.length} factors measured · ${applied} of 100 points of weight applied`}
          </Box>
          <Box className="font-body-small text-subtle" paddingBlockStart="space.025">
            {largest
              ? `Largest term: ${largest.label.toLowerCase()}, ${largest.contribution} point${largest.contribution === 1 ? "" : "s"} on "${largest.input}".`
              : "No factor could be computed for this program, so there is no term to name."}
          </Box>
          <Box className="font-body-small text-subtle" paddingBlockStart="space.075">
            As of {asOf}
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

        <Stack
          className="border-t border-default bg-surface-sunken px-200 py-150 sm:border-l sm:border-t-0"
          space="space.150"
        >
          <ProseBlock label="What this says">{score.headline}</ProseBlock>
          {score.caveats.length > 0 ? (
            <div>
              <div className="font-heading-xxsmall uppercase text-warning">
                {score.caveats.length} caveat{score.caveats.length === 1 ? "" : "s"} — the score is
                a floor, not a verdict
              </div>
              <Stack className="pt-050" as="ul" space="space.050">
                {score.caveats.map((c) => (
                  <li key={c} className="font-body-small text-default">
                    {c}
                  </li>
                ))}
              </Stack>
            </div>
          ) : (
            <ProseBlock label="Coverage">
              Every factor in the model resolved to a record for this program, so the score runs out
              of the full 100 points and the band below is a measurement rather than a floor.
            </ProseBlock>
          )}
        </Stack>
      </Grid>
    </div>
  );
}

/* ── The drift factor table ──────────────────────────────────────────────── */

const driftFactorLabels: Record<DriftFactor["key"], string> = {
  configuration: "Configuration",
  determination: "Determination currency",
  evidence: "Evidence freshness",
  assessment: "Assessment schedule",
  cadence: "Scan cadence",
  inheritance: "Inheritance",
};

/**
 * The module writes its own reason for every factor it could not compute, and
 * every one of those sentences ends "...the N weight is not applied". Matching
 * on that clause plus the factor's own word is what lets the missing row print
 * the authored explanation instead of a generic one — the authored sentence
 * says WHY, which is the only thing the row is for.
 */
const caveatWord: Record<DriftFactor["key"], RegExp> = {
  configuration: /configuration/i,
  determination: /determination/i,
  evidence: /evidence/i,
  assessment: /assessment/i,
  cadence: /cadence/i,
  inheritance: /inherit/i,
};

const orderIndex = new Map(driftFactorOrder.map((key, i) => [key, i]));

/**
 * The calculation, line by line. Every column is arithmetic the reader can redo
 * on paper — `contribution = value × weight × 100` — and the footer adds the
 * column up beside the published score.
 */
export function DriftFactorTable({ score }: { score: DriftScore }) {
  const factors = score.factors
    .slice()
    .sort((a, b) => (orderIndex.get(a.key) ?? 0) - (orderIndex.get(b.key) ?? 0));
  const sum = factors.reduce((a, f) => a + f.contribution, 0);
  const clamped = sum !== score.score;
  const applied = Math.round(factors.reduce((a, f) => a + f.weight, 0) * 100);
  const missing = driftFactorOrder.filter((key) => !factors.some((f) => f.key === key));

  return (
    <Stack className="pt-200" space="space.100">
      <p className="font-body-small text-subtle">
        Each factor reads a raw input from a record this platform already holds, normalises it to
        0–1, and buys <span className="text-default">value × weight × 100</span> points. Nothing
        else is added: the contributions below sum to the published drift score, so a reader who
        disagrees can name the line they disagree with rather than the model as a whole. A score of
        0 means the operating state matches the state that was authorized.
        {applied === 100
          ? ` All ${driftFactorOrder.length} factors were computable here, so the score runs out of 100.`
          : ` Only ${factors.length} of the ${driftFactorOrder.length} factors could be computed, so this score runs out of ${applied}, not 100.`}
      </p>

      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={168}>Factor</Table.Header>
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
          {factors.map((f) => (
            <DriftFactorRows key={f.key} factor={f} />
          ))}
          {missing.map((key) => (
            <MissingDriftFactorRows key={key} factorKey={key} caveats={score.caveats} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-default">
            <Table.Cell>Drift</Table.Cell>
            <Table.Cell className="max-w-none whitespace-normal py-100">
              {clamped
                ? `The column sums to ${sum}, outside the 0–100 range; the published score is clamped.`
                : `Sum of the ${factors.length} contribution${factors.length === 1 ? "" : "s"} above, against a ceiling of ${applied}.`}
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
function DriftFactorRows({ factor }: { factor: DriftFactor }) {
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
            factor.contribution === 0 ? "" : null,
          )}
        >
          {zeroSafe(factor.contribution)}
        </Table.Cell>
      </Table.Row>
      <Table.Row className="align-top" isStatic>
        <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={5}>
          <span className="block font-body-small text-subtle">{factor.rationale}</span>
          <Box className="block" as="span" paddingBlockStart="space.075">
            <EvidenceIds
              ids={factor.evidence}
              empty="No ids recorded — this factor rests on a count over the whole matrix rather than on named records."
            />
          </Box>
        </Table.Cell>
      </Table.Row>
    </>
  );
}

/**
 * A factor with no row would silently move the denominator: a reader would
 * assume the score was out of 100 when it was out of 35. This prints the
 * absence, the weight that was never applied, and the authored reason.
 */
function MissingDriftFactorRows({
  factorKey,
  caveats,
}: {
  factorKey: DriftFactor["key"];
  caveats: string[];
}) {
  const label = driftFactorLabels[factorKey];
  const weight = driftFactorWeights[factorKey];
  const authored = caveats.find(
    (c) => caveatWord[factorKey].test(c) && /weight is not applied/i.test(c),
  );
  const caveat =
    authored ??
    `The ${label.toLowerCase()} factor could not be computed for this program, so its ${fixed2(weight)} weight was not applied and the score runs out of ${100 - Math.round(weight * 100)} rather than 100. That is an absence of data, not an aligned configuration.`;
  return (
    <>
      <Table.Row className="border-0 align-top" isStatic>
        <Table.Cell className="py-100 align-top">{label}</Table.Cell>
        <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
          <Badge size="xsmall" tone="warning">
            Not measured
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

/* ── The alert queue ─────────────────────────────────────────────────────── */

const severityOrder: ConMonAlert["severity"][] = ["Critical", "High", "Moderate", "Low"];

/**
 * The shape of the queue at a glance — counts by severity and by kind, so the
 * reader knows what they are about to work through before they start reading
 * sentences. It is a legend for the list below it, never a substitute for it.
 */
export function AlertSummary({ alerts }: { alerts: ConMonAlert[] }) {
  const bySeverity = severityOrder.map((severity) => ({
    severity,
    count: alerts.filter((a) => a.severity === severity).length,
  }));
  const kinds = new Map<ConMonAlert["kind"], number>();
  for (const a of alerts) kinds.set(a.kind, (kinds.get(a.kind) ?? 0) + 1);
  const byKind = [...kinds.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <Inline
      className="pt-200"
      space="space.200"
      rowSpace="space.100"
      alignBlock="center"
      shouldWrap
    >
      <Inline as="span" space="space.100" alignBlock="center" shouldWrap>
        {bySeverity.map((s) => (
          <Inline key={s.severity} as="span" space="space.075" alignBlock="center">
            <Badge size="xsmall" tone={s.count > 0 ? alertSeverityTone[s.severity] : "neutral"}>
              {s.severity}
            </Badge>
            <span
              className={cn(
                "tabular-nums font-body-small font-medium",
                s.count === 0 ? "text-subtle" : "text-default",
              )}
            >
              {s.count}
            </span>
          </Inline>
        ))}
      </Inline>
      <span className="font-body-small text-subtle">
        {byKind.length === 0
          ? "No divergence of any kind is on record."
          : byKind.map(([kind, count]) => `${kind} ${count}`).join(" · ")}
      </span>
    </Inline>
  );
}

/**
 * The queue itself. One alert per row: severity, kind, subject, the date it
 * started, the sentence with the numbers in it, the sentence saying what to do,
 * and the records it rests on.
 */
export function AlertList({
  alerts,
  action,
  empty,
}: {
  alerts: ConMonAlert[];
  /** Trailing control for one alert — a link or a tab jump. Routes own both. */
  action?: (alert: ConMonAlert) => ReactNode;
  empty?: { title: string; description: string } | undefined;
}) {
  if (alerts.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title={empty?.title ?? "Nothing has diverged"}
          description={
            empty?.description ??
            "No pin has moved without a change record, no determination has been retracted, no evidence is past its SLA and no monitoring window has closed empty. An empty queue here is a result, not a failure to find something to say."
          }
        />
      </Box>
    );
  }
  return (
    <Box
      className="divide-y overflow-hidden rounded-large border border-default"
      as="ul"
      paddingBlockStart="space.0"
    >
      {alerts.map((alert) => (
        <Box key={alert.id} as="li" paddingInline="space.200" paddingBlock="space.150">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <Badge size="xsmall" tone={alertSeverityTone[alert.severity]}>
              {alert.severity}
            </Badge>
            <span className="font-body font-semibold">{alert.kind}</span>
            <Id>{alert.subject}</Id>
            <span className="font-body-small text-subtle">
              {alert.since === "—" ? "no start date on record" : `since ${alert.since}`}
            </span>
            <Inline className="ml-auto" as="span" space="space.100" alignBlock="center">
              {action ? action(alert) : null}
              <Id className="text-subtle">{alert.id}</Id>
            </Inline>
          </Inline>
          <p className="pt-075 font-body-small text-default">{alert.statement}</p>
          <Box
            className="border-s border-bold"
            paddingBlockStart="space.100"
            paddingInlineStart="space.100"
          >
            <div className="font-heading-xxsmall uppercase text-subtle">Do this</div>
            <p className="pt-025 font-body-small text-default">{alert.action}</p>
          </Box>
          <Box paddingBlockStart="space.100">
            <EvidenceIds
              ids={alert.evidence}
              empty="No ids recorded — this alert rests on the schedule itself."
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/* ── Assessment schedule ─────────────────────────────────────────────────── */

/**
 * The SLCM schedule. `daysOut` is signed against the next due date, so a
 * negative number is days LATE and reads that way in the column rather than
 * being flipped into a positive "overdue by" that loses the sign.
 */
export function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No continuous monitoring strategy on file"
          description="No control in this program carries an SLCM frequency, method or responsible entity, so there is no schedule to fall behind. An empty ConMon strategy is a finding in its own right — it is not the same as a program that is up to date."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={104}>Control</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={116}>Frequency</Table.Header>
          <Table.Header width={124}>Method</Table.Header>
          <Table.Header width={188}>Responsible</Table.Header>
          <Table.Header width={108}>Last assessed</Table.Header>
          <Table.Header width={108}>Next due</Table.Header>
          <Table.Header width={76} className="text-right">
            Days out
          </Table.Header>
          <Table.Header width={112}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <ScheduleRows key={row.control} row={row} explain={row.status !== "Current"} />
        ))}
      </tbody>
    </Table>
  );
}

function ScheduleRows({ row, explain }: { row: ScheduleRow; explain: boolean }) {
  return (
    <>
      <Table.Row
        className={cn("align-top", explain ? "border-0 hover:bg-transparent" : null)}
        title={explain ? undefined : row.finding}
      >
        <Table.Cell className="py-100 align-top">
          <Id>{row.control}</Id>
        </Table.Cell>
        <Table.Cell className="py-100 align-top" title={row.controlTitle}>
          {row.controlTitle === "—" ? <Absent /> : row.controlTitle}
        </Table.Cell>
        <Table.Cell className="py-100 align-top">{row.frequency}</Table.Cell>
        <Table.Cell className="py-100 align-top">
          <MethodChip method={row.method} />
        </Table.Cell>
        <Table.Cell className="py-100 align-top" title={row.responsible}>
          {row.responsible}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top">
          {row.lastAssessed === "—" ? <Absent /> : row.lastAssessed}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top">
          {row.nextDue === "—" ? <Absent /> : row.nextDue}
        </Table.Cell>
        <Table.Cell
          className={cn(
            "py-100 align-top text-right",
            row.daysOut !== null && row.daysOut < 0 ? "text-danger" : "",
          )}
        >
          <Days value={row.daysOut} />
        </Table.Cell>
        <Table.Cell className="py-100 align-top">
          <AssessmentStatusChip status={row.status} />
        </Table.Cell>
      </Table.Row>
      {explain ? (
        <Table.Row className="align-top" isStatic>
          <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={9}>
            {row.finding}
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );
}

/* ── Evidence freshness ──────────────────────────────────────────────────── */

/** `SctmRow.key` is `control|unit|requirement`; the tail is what a reader wants. */
function requirementParts(key: string): { unit: string; requirement: string } {
  const parts = key.split("|");
  return { unit: parts[1] ?? "Control", requirement: parts[2] ?? key };
}

export function FreshnessTable({ rows }: { rows: EvidenceSlaRow[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No monitored requirement to age"
          description="No requirement in this program's matrix maps to a control the ConMon strategy covers, so no evidence SLA applies and there is nothing to measure an artifact's age against."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={96}>Control</Table.Header>
          <Table.Header width={158}>Requirement</Table.Header>
          <Table.Header>Newest evidence</Table.Header>
          <Table.Header width={108}>Collected</Table.Header>
          <Table.Header width={68} className="text-right">
            Age
          </Table.Header>
          <Table.Header width={68} className="text-right">
            SLA
          </Table.Header>
          <Table.Header width={124}>Freshness</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <FreshnessRows key={row.requirement} row={row} explain={row.freshness !== "Fresh"} />
        ))}
      </tbody>
    </Table>
  );
}

function FreshnessRows({ row, explain }: { row: EvidenceSlaRow; explain: boolean }) {
  const { unit, requirement } = requirementParts(row.requirement);
  const overdue = row.ageDays !== null && row.ageDays > row.slaDays;
  return (
    <>
      <Table.Row
        className={cn("align-top", explain ? "border-0 hover:bg-transparent" : null)}
        title={explain ? undefined : row.finding}
      >
        <Table.Cell className="py-100 align-top">
          <Id>{row.control}</Id>
        </Table.Cell>
        <Table.Cell className="py-100 align-top" title={row.requirement}>
          <Inline as="span" space="space.075" alignBlock="center">
            <Badge size="xsmall" tone="neutral">
              {unit}
            </Badge>
            <span className="min-w-0 truncate">{requirement}</span>
          </Inline>
        </Table.Cell>
        <Table.Cell className="py-100 align-top" title={row.evidence.join(", ")}>
          {row.evidence.length === 0 ? (
            <Absent />
          ) : (
            `${row.evidence[0]}${row.evidence.length > 1 ? ` +${row.evidence.length - 1} more` : ""}`
          )}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top">
          {row.collected === "—" ? <Absent /> : row.collected}
        </Table.Cell>
        <Table.Cell className={cn("py-100 align-top text-right", overdue ? "text-danger" : "")}>
          <Days value={row.ageDays} />
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">{row.slaDays}d</Table.Cell>
        <Table.Cell className="py-100 align-top">
          <FreshnessChip freshness={row.freshness} />
        </Table.Cell>
      </Table.Row>
      {explain ? (
        <Table.Row className="align-top" isStatic>
          <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={7}>
            {row.finding}
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );
}

/* ── Scan cadence ────────────────────────────────────────────────────────── */

/**
 * A non-compliant row has three genuinely different causes and they must not
 * read alike. `lastScan` is the last RECONCILED result, so an em dash there
 * means either that nothing of this format ever reached the finding register —
 * a run can have completed and be sitting unprocessed — or, on the "—" format
 * row, that the asset has never been scanned by anything at all. The last is
 * the widest gap of the three and gets its own words rather than being folded
 * into "0 windows missed", which would read as a clean row.
 */
function cadenceLabel(row: CadenceRow): { text: string; tone: "success" | "danger" | "warning" } {
  if (row.compliant) return { text: "In cadence", tone: "success" };
  if (row.format === "—") return { text: "Never scanned", tone: "warning" };
  const windows = `${row.missed} window${row.missed === 1 ? "" : "s"}`;
  if (row.lastScan === "—") {
    return row.missed > 0
      ? { text: `No result, ${windows} late`, tone: "danger" }
      : { text: "No reconciled result", tone: "warning" };
  }
  return { text: `${windows} late`, tone: "danger" };
}

export function CadenceTable({ rows }: { rows: CadenceRow[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No scan target to measure"
          description="No tracked asset in this program anchors a composition node, so there is no target a scan window could be measured against. Nothing here is being monitored automatically."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={96}>Target</Table.Header>
          <Table.Header width={180}>Name</Table.Header>
          <Table.Header width={160}>Format</Table.Header>
          <Table.Header width={84} className="text-right">
            Window
          </Table.Header>
          <Table.Header width={150}>Last scan</Table.Header>
          <Table.Header width={84} className="text-right">
            Actual
          </Table.Header>
          <Table.Header width={168}>State</Table.Header>
          <Table.Header>What the window says</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const label = cadenceLabel(row);
          return (
            <Table.Row key={`${row.target}|${row.format}`} className="align-top">
              <Table.Cell className="py-100 align-top">
                <Id>{row.target}</Id>
              </Table.Cell>
              <Table.Cell className="py-100 align-top" title={row.targetName}>
                {row.targetName}
              </Table.Cell>
              <Table.Cell className="py-100 align-top">
                {row.format === "—" ? <Absent /> : row.format}
              </Table.Cell>
              <Table.Cell className="py-100 align-top text-right">
                {row.expectedDays > 0 ? (
                  <span className="tabular-nums">{row.expectedDays}d</span>
                ) : (
                  <Absent />
                )}
              </Table.Cell>
              <Table.Cell className="tabular-nums py-100 align-top">
                {row.lastScan === "—" ? <Absent /> : row.lastScan}
              </Table.Cell>
              <Table.Cell
                className={cn(
                  "py-100 align-top text-right",
                  row.actualDays !== null &&
                    row.expectedDays > 0 &&
                    row.actualDays > row.expectedDays
                    ? "text-danger"
                    : "",
                )}
              >
                <Days value={row.actualDays} />
              </Table.Cell>
              <Table.Cell className="py-100 align-top">
                <Badge size="xsmall" tone={label.tone}>
                  {label.text}
                </Badge>
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                {row.finding}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/* ── POA&M slippage ──────────────────────────────────────────────────────── */

/**
 * The commitment against the date it has moved to. A slip of 0 is printed as 0,
 * not as an em dash: a date that has not moved is a result, and an item can be
 * badly overdue against a date nobody ever revised — which is a worse story than
 * a revision, not a better one, and the sentence underneath says so.
 */
export function SlippageTable({ rows }: { rows: SlippageRow[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No POA&M item to track"
          description="This program carries no plan of action and milestones item with a scheduled completion date, so there is no commitment for a slip to be measured against."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={112}>POA&amp;M</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={112}>Original</Table.Header>
          <Table.Header width={112}>Scheduled</Table.Header>
          <Table.Header width={72} className="text-right">
            Slip
          </Table.Header>
          <Table.Header width={88} className="text-right">
            Revisions
          </Table.Header>
          <Table.Header width={116}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <SlippageRows key={row.poam} row={row} />
        ))}
      </tbody>
    </Table>
  );
}

function SlippageRows({ row }: { row: SlippageRow }) {
  return (
    <>
      <Table.Row className="border-0 align-top" isStatic>
        <Table.Cell className="py-100 align-top">
          <Id>{row.poam}</Id>
        </Table.Cell>
        <Table.Cell className="py-100 align-top" title={row.title}>
          {row.title}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top">
          {row.original === "—" ? <Absent /> : row.original}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top">
          {row.scheduled === "—" ? <Absent /> : row.scheduled}
        </Table.Cell>
        <Table.Cell
          className={cn(
            "tabular-nums py-100 align-top text-right",
            row.slipDays > 0 ? "text-warning" : "",
          )}
        >
          {row.slipDays > 0 ? `+${row.slipDays}d` : `${zeroSafe(row.slipDays)}d`}
        </Table.Cell>
        <Table.Cell className="tabular-nums py-100 align-top text-right">
          {row.revisions}
        </Table.Cell>
        <Table.Cell className="py-100 align-top">
          <Badge size="xsmall" tone={statusTone(row.status)}>
            {row.status}
          </Badge>
        </Table.Cell>
      </Table.Row>
      <Table.Row className="align-top" isStatic>
        <Table.Cell className="max-w-none whitespace-normal pb-150 pt-0 align-top" colSpan={7}>
          {row.finding}
        </Table.Cell>
      </Table.Row>
    </>
  );
}
