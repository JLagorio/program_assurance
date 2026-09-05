/**
 * The SCTM surface: one wide requirement table, one detail rail, one summary.
 *
 * An assessor reads this artifact left to right — control, requirement, who is
 * responsible, how it is verified, what evidence exists, what the determination
 * is — and the last column answers the only question the package review cares
 * about: can this row ship. The gap column is therefore weighted, not muted;
 * a row that cannot ship reads as a block of red in a column of blanks.
 *
 * Currency rides inside the Determination cell rather than taking a column of
 * its own. It is a second axis, not a second determination, and the matrix has
 * room for exactly one weighted column: so a withdrawn claim is struck through
 * beside the value that replaced it — an assessor must be able to see what was
 * claimed and when it stopped counting, which is the whole reason `buildSctm`
 * retains it — an invalidated row carries a chip, a suspect row carries a quiet
 * dot, and a current row carries nothing at all.
 *
 * Presentation only. Every value arrives as a prop from `@/lib/sctm`; nothing
 * here derives, sorts or filters the matrix.
 */

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import {
  Badge,
  Box,
  Dot,
  Empty,
  Grid,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  Progress,
  Section,
  Stack,
  Stat,
  Table,
  TextLink,
  Eyebrow,
} from "@ledger/design-system";
import type { Tone } from "@ledger/design-system";
import { inheritanceStateTone } from "@/lib/inheritance";
import { cn } from "@ledger/design-system/cn";
import {
  determinationTone,
  rowCurrencyTone,
  verificationMethodTone,
  type Determination,
  type RowCurrency,
  type Sctm,
  type SctmFamilyGroup,
  type SctmRow,
  type VerificationMethod,
} from "@/lib/sctm";

/* ── Chips ───────────────────────────────────────────────────────────────── */

export function MethodChip({ method }: { method: VerificationMethod }) {
  return <Badge tone={verificationMethodTone[method]}>{method}</Badge>;
}

export function DeterminationChip({ determination }: { determination: Determination }) {
  return <Badge tone={determinationTone[determination]}>{determination}</Badge>;
}

export function CurrencyChip({ currency }: { currency: RowCurrency }) {
  return (
    <Badge size="xsmall" tone={rowCurrencyTone[currency]}>
      {currency}
    </Badge>
  );
}

/**
 * Currency inside the Determination cell, never a column of its own.
 *
 * It is a second axis, not a second determination: an Invalidated row is one
 * whose determination was taken against a configuration that is no longer in
 * force, and a Suspect row is one the assessor is asked to look at again. So
 * Invalidated carries a chip, Suspect carries a quiet dot, and Current carries
 * nothing — which keeps the Gap column the only weighted one and keeps the
 * marked rows reading as signal rather than as a second wall of colour. The
 * reason is on the title, in full, and again in the rail Note.
 */
function CurrencyMark({ row }: { row: SctmRow }) {
  if (row.currency === "Current") return null;
  return (
    <Inline className="shrink-0" title={row.currencyReason} as="span" alignBlock="center">
      {row.currency === "Invalidated" ? (
        <CurrencyChip currency={row.currency} />
      ) : (
        <Dot tone="warning" label={row.currency} />
      )}
    </Inline>
  );
}

function severityToneOf(severity: string): Tone {
  if (severity === "CAT I") return "danger";
  if (severity === "CAT II") return "warning";
  return "neutral";
}

/* ── Matrix table ────────────────────────────────────────────────────────── */

/** The eight columns, declared once so every SCTM surface aligns. */
export function SctmHead() {
  return (
    <thead>
      <tr>
        <Table.Header width={104}>Control</Table.Header>
        <Table.Header>Requirement</Table.Header>
        <Table.Header width={116}>Origination</Table.Header>
        <Table.Header width={152}>Responsible</Table.Header>
        <Table.Header width={120}>Method</Table.Header>
        <Table.Header className="text-right" width={84}>
          Evidence
        </Table.Header>
        {/* Determination carries the retracted value struck through beside the
            one that replaced it, so it is sized for `Satisfied -> Not assessed
            · Invalidated`, not for a chip alone. */}
        <Table.Header width={264}>Determination</Table.Header>
        <Table.Header width={268}>Gap</Table.Header>
      </tr>
    </thead>
  );
}

/**
 * One requirement row's cells.
 *
 * Extracted so the standalone matrix and the family-grouped matrix on the
 * program record render the identical row rather than drifting into two
 * spellings of the same eight columns. `programId` is the only difference
 * between them: given one, the control id becomes a link to the control
 * record, because a grouped matrix is navigated rather than swept with a rail.
 */
export function SctmRowCells({ row, programId }: { row: SctmRow; programId?: string }) {
  return (
    <>
      <Table.Cell>
        {programId ? (
          <TextLink>
            <Link
              to="/programs/$programId/controls/$controlId"
              params={{ programId, controlId: row.control }}
              search={{ tab: undefined }}
              onClick={(e) => e.stopPropagation()}
            >
              <Id>{row.control}</Id>
            </Link>
          </TextLink>
        ) : (
          <Id>{row.control}</Id>
        )}
      </Table.Cell>
      <Table.Cell className="truncate">
        <Inline className="min-w-0" as="span" space="space.075" alignBlock="center">
          <Badge size="xsmall">{row.unit}</Badge>
          <Id className="shrink-0">{row.requirement}</Id>
          <span className="min-w-0 truncate font-body-small text-subtle">{row.statement}</span>
        </Inline>
      </Table.Cell>
      <Table.Cell className="truncate">{row.origination}</Table.Cell>
      <Table.Cell className="truncate" title={row.responsibleParty}>
        {row.responsibleParty}
      </Table.Cell>
      <Table.Cell className="truncate" title={row.methodBasis}>
        <MethodChip method={row.method} />
      </Table.Cell>
      <Table.Cell className="tabular-nums text-right" title={row.evidence.join(", ")}>
        {row.evidence.length === 0 ? <span className="text-subtle">0</span> : row.evidence.length}
      </Table.Cell>
      <Table.Cell className="truncate">
        <Inline className="min-w-0" as="span" space="space.075" alignBlock="center">
          {/* What was claimed, and that it stopped counting. The value is
                    retained rather than overwritten precisely so it can be
                    shown; a determination that silently changed cannot be
                    audited. Same treatment as the change-impact table. */}
          {row.priorDetermination !== null ? (
            <>
              <span
                className="shrink-0 font-body-xsmall text-subtle line-through"
                title={`${row.priorDetermination} as of ${row.assessed} — retained for the audit trail`}
              >
                {row.priorDetermination}
              </span>
              <ArrowRight className="shrink-0 text-subtle size-150" />
            </>
          ) : null}
          <DeterminationChip determination={row.determination} />
          <CurrencyMark row={row} />
          {row.openFindings > 0 ? (
            <span
              className={cn(
                "tabular-nums shrink-0 font-body-xsmall",
                row.worstSeverity === "CAT I" ? "text-danger" : "text-subtle",
              )}
              title={`${row.openFindings} open — worst ${row.worstSeverity}`}
            >
              {row.openFindings} open
            </span>
          ) : null}
        </Inline>
      </Table.Cell>
      <Table.Cell className={cn("truncate", row.gap && "bg-danger")}>
        {row.gap ? (
          <Inline
            className="min-w-0 text-danger"
            title={row.gap}
            as="span"
            space="space.075"
            alignBlock="center"
          >
            <Dot tone="danger" />
            <span className="min-w-0 truncate font-medium">{row.gap}</span>
          </Inline>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </Table.Cell>
    </>
  );
}

export function SctmTable({
  rows,
  onSelect,
  selected,
}: {
  rows: SctmRow[];
  onSelect: (row: SctmRow) => void;
  /** Row key of the open detail rail, so the table shows what the rail holds. */
  selected?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <Empty
        title="No requirement rows"
        description="No control in this scope decomposes into a CCI, an assessment objective or a control-level requirement."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <SctmHead />
      <tbody>
        {rows.map((row) => (
          <Table.Row
            key={row.key}
            className={cn("cursor-pointer", selected === row.key && "bg-selected")}
            onClick={() => onSelect(row)}
            title={row.statement}
          >
            <SctmRowCells row={row} />
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ── Family-grouped matrix ───────────────────────────────────────────────── */

/**
 * The matrix grouped by control family.
 *
 * The group header IS the family coverage rollup that used to sit in its own
 * table above the matrix. Reading a family's numbers and then acting on them
 * were two separate surfaces and two separate scroll positions; here the
 * numbers are the thing you open. A collapsed matrix therefore reads exactly
 * as the old coverage table did, and expanding a family drops you into its
 * requirement rows without changing page, filter or scroll.
 */
export function SctmFamilyTable({
  groups,
  programId,
  expanded,
  onToggle,
}: {
  groups: SctmFamilyGroup[];
  programId: string;
  expanded: ReadonlySet<string>;
  onToggle: (familyId: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <Empty
        title="No requirement rows"
        description="No control in this set decomposes into a CCI, an assessment objective or a control-level requirement."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <SctmHead />
      {groups.map((group) => {
        const open = expanded.has(group.id);
        return (
          <Table.Group
            key={group.id}
            colSpan={8}
            open={open}
            onToggle={() => onToggle(group.id)}
            title={
              <>
                <Id className="shrink-0 text-default w-400">{group.id}</Id>
                <span className="min-w-0 flex-1 truncate">{group.name}</span>
              </>
            }
            trailing={
              <>
                <span className="tabular-nums shrink-0 font-body-small text-subtle">
                  {group.controls} controls
                </span>
                <span className="tabular-nums shrink-0 font-body-small text-subtle">
                  {group.rows.length} rows
                </span>

                {/* No gap count here on purpose. In a package this early
                    almost every row is gapped — 1,340 of 1,391 on the seeded
                    program — so a per-family count restates the row count in
                    red and reads as a wall rather than as a finding. The Gap
                    column carries the specific reason per row, which is the
                    grain at which it can actually be acted on. Invalidation
                    is rare, so it stays. */}
                {group.invalidated > 0 ? (
                  <Badge size="xsmall" tone="warning">
                    {group.invalidated} invalidated
                  </Badge>
                ) : null}

                <span className="shrink-0" style={{ width: 112 }}>
                  <Progress.Stacked
                    size="small"
                    segments={[
                      { key: "s", value: group.satisfied, tone: "success" },
                      { key: "o", value: group.other, tone: "danger" },
                      { key: "n", value: group.notAssessed, tone: "neutral" },
                    ]}
                  />
                </span>
                <span className="tabular-nums shrink-0 text-right font-body-small text-subtle w-1000">
                  {group.satisfied}/{group.rows.length - group.notApplicable} · {group.pct}%
                </span>
              </>
            }
          >
            {group.rows.map((row) => (
              <Table.Row key={row.key} title={row.statement}>
                <SctmRowCells row={row} programId={programId} />
              </Table.Row>
            ))}
          </Table.Group>
        );
      })}
    </Table>
  );
}

/* ── Detail rail ─────────────────────────────────────────────────────────── */

function ProseBlock({ label, children }: { label: string; children: string }) {
  return (
    <Box paddingBlockStart="space.075">
      <Eyebrow>{label}</Eyebrow>
      <p className="pt-050 font-body-small text-default">{children}</p>
    </Box>
  );
}

/**
 * `KeyValue` truncates its value to one line, which is right for an id and
 * wrong for a control title or a component list. This is the same grid with a
 * wrapping value cell, used only where the value genuinely runs long.
 */
function WrapValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Grid className="py-050" gap="space.150" templateColumns="104px 1fr" alignItems="baseline">
      <dt className="truncate font-body-small text-subtle">{label}</dt>
      <dd className="min-w-0 font-body-small text-default">{children}</dd>
    </Grid>
  );
}

export function SctmRail({ row }: { row: SctmRow }) {
  return (
    <div>
      {row.gap ? (
        <Box paddingBlockEnd="space.150">
          <Inline
            className="rounded-medium bg-danger px-100 py-100 font-body-small text-danger"
            space="space.100"
            alignBlock="start"
          >
            <Box as="span" paddingBlockStart="space.075">
              <Dot tone="danger" />
            </Box>
            <span className="min-w-0 font-medium">{row.gap}</span>
          </Inline>
        </Box>
      ) : null}

      <Inspector.Group title="Requirement">
        <KeyValue label="Control">
          <Id>{row.control}</Id>
        </KeyValue>
        <WrapValue label="Title">{row.controlTitle}</WrapValue>
        <KeyValue label="Family">
          {row.family} — {row.familyName}
        </KeyValue>
        <KeyValue label="Unit">
          <Badge size="xsmall">{row.unit}</Badge>
        </KeyValue>
        <KeyValue label="Requirement">
          <Id>{row.requirement}</Id>
        </KeyValue>
        <ProseBlock label="Statement">{row.statement}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Implementation">
        <KeyValue label="Origination">
          <Badge size="xsmall">{row.origination}</Badge>
        </KeyValue>
        <KeyValue label="Responsible">{row.responsibleParty}</KeyValue>
        <WrapValue label="Consumer owes">{row.consumerResponsibility}</WrapValue>
        {/* The resolution's state belongs to the implementation, not to
            currency: it says which provider stands behind the row and whether
            that reference still holds. Its prose is only repeated here when the
            determination note does not already carry it — the overlay folds it
            in whenever the reference is what raised the row's currency, and the
            rail must not print the same sentences twice. */}
        {row.inheritanceState !== null ? (
          <KeyValue label="Inheritance">
            <Badge size="xsmall" tone={inheritanceStateTone[row.inheritanceState]}>
              {row.inheritanceState}
            </Badge>
          </KeyValue>
        ) : null}
        {row.inheritanceState !== null &&
        row.inheritanceReason !== "—" &&
        !row.determinationNote.includes(row.inheritanceReason) ? (
          <ProseBlock label="Why this provider">{row.inheritanceReason}</ProseBlock>
        ) : null}
        <ProseBlock label="Assertion">{row.assertion}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Allocation">
        <WrapValue label="Components">
          <Id.List ids={row.responsibleNodes} empty="Not allocated" />
        </WrapValue>
        <ProseBlock label="Basis">{row.allocationBasis}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Verification">
        <KeyValue label="Method">
          <MethodChip method={row.method} />
        </KeyValue>
        <WrapValue label="Evidence">
          <Id.List ids={row.evidence} empty="None recorded" />
        </WrapValue>
        <ProseBlock label="Method basis">{row.methodBasis}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Determination">
        <KeyValue label="Result">
          <DeterminationChip determination={row.determination} />
        </KeyValue>
        {/* Currency is orthogonal to the result above it, so it is a row of its
            own rather than a qualifier on the chip. `currencyReason` is not
            repeated: `buildSctm` has already folded it into the Note below. */}
        <KeyValue label="Currency">
          <CurrencyChip currency={row.currency} />
        </KeyValue>
        {row.priorDetermination !== null ? (
          <KeyValue label="Withdrawn">
            <Inline as="span" space="space.075" alignBlock="center">
              <span className="shrink-0 font-body-small text-subtle line-through">
                {row.priorDetermination}
              </span>
              <span className="font-body-small text-subtle">claimed as of {row.assessed}</span>
            </Inline>
          </KeyValue>
        ) : null}
        <KeyValue label="Assessed">
          <span className="tabular-nums">{row.assessed}</span>
        </KeyValue>
        <WrapValue label="Findings">
          <Id.List ids={row.findings} />
        </WrapValue>
        <KeyValue label="Open">
          <Inline as="span" space="space.075" alignBlock="center">
            <span className="tabular-nums">{row.openFindings}</span>
            {row.openFindings > 0 ? (
              <Indicator tone={severityToneOf(row.worstSeverity)}>{row.worstSeverity}</Indicator>
            ) : null}
          </Inline>
        </KeyValue>
        <ProseBlock label="Note">{row.determinationNote}</ProseBlock>
      </Inspector.Group>
    </div>
  );
}

/* ── Summary ─────────────────────────────────────────────────────────────── */

function BreakdownRow({
  label,
  count,
  total,
  tone,
}: {
  label: ReactNode;
  count: number;
  total: number;
  tone: Tone;
}) {
  const pct = Math.round((count / (total || 1)) * 100);
  return (
    <Inline
      className="border-b border-default py-100 last:border-0"
      space="space.150"
      alignBlock="center"
    >
      <span className="shrink-0 truncate font-body-small" style={{ width: 128 }}>
        {label}
      </span>
      <span className="min-w-0 flex-1">
        <Progress value={pct} tone={tone} />
      </span>
      <span className="tabular-nums shrink-0 text-right font-body-small text-subtle w-800">
        {count} · {pct}%
      </span>
    </Inline>
  );
}

export function SctmSummary({ sctm }: { sctm: Sctm }) {
  const { counts } = sctm;
  const coverageTone: Tone =
    sctm.gaps === 0 ? "success" : sctm.coverage >= 75 ? "warning" : "danger";
  const current = counts.total - counts.invalidated - counts.suspect;
  /** Rows whose positive claim the overlay actually retracted. */
  const withdrawn = sctm.rows.filter((r) => r.priorDetermination !== null).length;

  return (
    <Stack space="space.300">
      <Section
        title="Determination coverage"
        description={`Generated ${sctm.generated} from the live control matrix — ${counts.total} requirement rows.`}
        action={
          <span className="tabular-nums font-body-small text-subtle">
            {counts.satisfied}/{counts.total} satisfied ·{" "}
            {Math.round((counts.satisfied / (counts.total || 1)) * 100)}%
          </span>
        }
      >
        <Box paddingBlockStart="space.150">
          <Inline className="pb-100" space="space.100" alignBlock="baseline">
            <span className="tabular-nums font-heading-small font-semibold">{sctm.coverage}%</span>
            <span className="tabular-nums font-body-small text-subtle">
              of rows carry a determination and no gap
            </span>
          </Inline>
          <Progress value={sctm.coverage} tone={coverageTone} />

          <Box paddingBlockStart="space.150">
            <Progress.Stacked
              segments={[
                {
                  key: "satisfied",
                  value: counts.satisfied,
                  tone: "success",
                  title: `Satisfied — ${counts.satisfied}`,
                },
                {
                  key: "other",
                  value: counts.other,
                  tone: "danger",
                  title: `Other than satisfied — ${counts.other}`,
                },
                {
                  key: "notAssessed",
                  value: counts.notAssessed,
                  tone: "warning",
                  title: `Not assessed — ${counts.notAssessed}`,
                },
                {
                  key: "notApplicable",
                  value: counts.notApplicable,
                  tone: "neutral",
                  title: `Not applicable — ${counts.notApplicable}`,
                },
              ]}
            />
            <Inline
              className="pt-100"
              space="space.200"
              rowSpace="space.050"
              alignBlock="center"
              shouldWrap
            >
              {(
                [
                  {
                    key: "satisfied",
                    label: "Satisfied",
                    value: counts.satisfied,
                    tone: "success",
                  },
                  {
                    key: "other",
                    label: "Other than satisfied",
                    value: counts.other,
                    tone: "danger",
                  },
                  {
                    key: "notAssessed",
                    label: "Not assessed",
                    value: counts.notAssessed,
                    tone: "warning",
                  },
                  {
                    key: "notApplicable",
                    label: "Not applicable",
                    value: counts.notApplicable,
                    tone: "neutral",
                  },
                ] as { key: string; label: string; value: number; tone: Tone }[]
              ).map((s) => (
                <Inline
                  key={s.key}
                  className="font-body-small"
                  as="span"
                  space="space.075"
                  alignBlock="center"
                >
                  <Dot tone={s.tone} />
                  <span className="text-subtle">{s.label}</span>
                  <span className="tabular-nums font-medium">{s.value}</span>
                </Inline>
              ))}
            </Inline>
          </Box>

          <Grid
            className="pt-200"
            columnGap="space.400"
            templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }}
          >
            <Stat label="Requirement rows" value={counts.total} />
            <Stat
              label="Rows that cannot ship"
              value={sctm.gaps}
              tone={sctm.gaps > 0 ? "danger" : "success"}
            />
            <Stat
              label="Rows with no evidence"
              value={sctm.unevidenced}
              tone={sctm.unevidenced > 0 ? "warning" : "success"}
            />
          </Grid>
        </Box>
      </Section>

      {/* Currency is reported separately from determination rather than as a
          fifth segment of the bar above: the two axes are independent, so a row
          would be counted twice. */}
      <Section
        title="Determination currency"
        description="Whether what is on file still describes the configuration in force. A configuration change does not re-assess anything, so an invalidated row's positive claim is withdrawn and stops counting toward coverage while a deficiency is retained and owed a re-test; a suspect row keeps its determination and is flagged for the assessor."
        action={
          <TextLink size="small">
            <Link to="/programs/$programId/baseline" params={{ programId: sctm.program }}>
              Change impact →
            </Link>
          </TextLink>
        }
      >
        <Grid
          className="pt-150"
          columnGap="space.400"
          templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }}
        >
          <Stat
            label="Current — taken against the build in force"
            value={current}
            tone={current === counts.total ? "success" : "neutral"}
          />
          <Stat
            label="Invalidated — no longer describes the build in force"
            value={counts.invalidated}
            tone={counts.invalidated > 0 ? "danger" : "success"}
          />
          <Stat
            label="Suspect — determination stands, flagged for re-verification"
            value={counts.suspect}
            tone={counts.suspect > 0 ? "warning" : "success"}
          />
        </Grid>
        {withdrawn > 0 ? (
          <p className="pt-100 font-body-small text-subtle">
            <span className="tabular-nums font-medium text-default">{withdrawn}</span> of the{" "}
            {counts.invalidated} invalidated rows carried a Satisfied determination that is now
            withdrawn; the matrix shows the retracted value struck through beside the one that
            replaced it. The rest keep their determination — a change neither closes a finding nor
            discharges a POA&M obligation.
          </p>
        ) : null}
      </Section>

      <Grid gap="space.300" templateColumns={{ md: "repeat(2, minmax(0, 1fr))" }}>
        <Section
          title="Verification method"
          description="How each requirement is evidenced — Test, Demonstration, Analysis or Inspection."
        >
          <Box paddingBlockStart="space.075">
            {sctm.byMethod.map((m) => (
              <BreakdownRow
                key={m.method}
                label={m.method}
                count={m.count}
                total={counts.total}
                tone={verificationMethodTone[m.method]}
              />
            ))}
          </Box>
        </Section>

        <Section
          title="Control origination"
          description="What the system implements itself against what it inherits."
        >
          <Box paddingBlockStart="space.075">
            {sctm.byOrigination.map((o) => (
              <BreakdownRow
                key={o.origination}
                label={o.origination}
                count={o.count}
                total={counts.total}
                tone="information"
              />
            ))}
          </Box>
        </Section>
      </Grid>
    </Stack>
  );
}
