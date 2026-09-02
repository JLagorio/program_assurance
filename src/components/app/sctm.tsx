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
import { ArrowRight, ChevronDown } from "lucide-react";

import {
  Badge,
  Dot,
  EmptyState,
  KeyValue,
  Meter,
  Mono,
  RailGroup,
  Section,
  StackedBar,
  Table,
  Td,
  Th,
  Tr,
  type Tone,
  Severity,
} from "@/components/app/ui";
import { inheritanceStateTone } from "@/lib/inheritance";
import { cn } from "@/lib/utils";
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
    <Badge size="xs" tone={rowCurrencyTone[currency]}>
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
    <span className="flex shrink-0 items-center" title={row.currencyReason}>
      {row.currency === "Invalidated" ? (
        <CurrencyChip currency={row.currency} />
      ) : (
        <Dot tone="warning" />
      )}
    </span>
  );
}

function severityToneOf(severity: string): Tone {
  if (severity === "CAT I") return "danger";
  if (severity === "CAT II") return "warning";
  return "neutral";
}

/* ── Matrix table ────────────────────────────────────────────────────────── */

/** The eight columns, declared once so every SCTM surface aligns. */
export function SctmCols() {
  return (
    <colgroup>
      <col style={{ width: "104px" }} />
      <col />
      <col style={{ width: "116px" }} />
      <col style={{ width: "152px" }} />
      <col style={{ width: "120px" }} />
      <col style={{ width: "84px" }} />
      {/* Determination carries the retracted value struck through beside the
          one that replaced it, so it is sized for `Satisfied -> Not assessed
          · Invalidated`, not for a chip alone. */}
      <col style={{ width: "264px" }} />
      <col style={{ width: "268px" }} />
    </colgroup>
  );
}

export function SctmHead() {
  return (
    <thead>
      <tr>
        <Th>Control</Th>
        <Th>Requirement</Th>
        <Th>Origination</Th>
        <Th>Responsible</Th>
        <Th>Method</Th>
        <Th className="text-right">Evidence</Th>
        <Th>Determination</Th>
        <Th>Gap</Th>
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
      <Td>
        {programId ? (
          <Link
            to="/programs/$programId/controls/$controlId"
            params={{ programId, controlId: row.control }}
            search={{ tab: undefined }}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Mono className="text-primary">{row.control}</Mono>
          </Link>
        ) : (
          <Mono>{row.control}</Mono>
        )}
      </Td>
      <Td className="truncate">
        <span className="flex min-w-0 items-center gap-1.5">
          <Badge size="xs">{row.unit}</Badge>
          <Mono className="shrink-0">{row.requirement}</Mono>
          <span className="min-w-0 truncate text-12 text-muted-foreground">{row.statement}</span>
        </span>
      </Td>
      <Td className="truncate">{row.origination}</Td>
      <Td className="truncate" title={row.responsibleParty}>
        {row.responsibleParty}
      </Td>
      <Td className="truncate" title={row.methodBasis}>
        <MethodChip method={row.method} />
      </Td>
      <Td className="tnum text-right" title={row.evidence.join(", ")}>
        {row.evidence.length === 0 ? (
          <span className="text-muted-foreground">0</span>
        ) : (
          row.evidence.length
        )}
      </Td>
      <Td className="truncate">
        <span className="flex min-w-0 items-center gap-1.5">
          {/* What was claimed, and that it stopped counting. The value is
                    retained rather than overwritten precisely so it can be
                    shown; a determination that silently changed cannot be
                    audited. Same treatment as the change-impact table. */}
          {row.priorDetermination !== null ? (
            <>
              <span
                className="shrink-0 text-11 text-muted-foreground line-through decoration-danger/70 decoration-[1.5px]"
                title={`${row.priorDetermination} as of ${row.assessed} — retained for the audit trail`}
              >
                {row.priorDetermination}
              </span>
              <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
            </>
          ) : null}
          <DeterminationChip determination={row.determination} />
          <CurrencyMark row={row} />
          {row.openFindings > 0 ? (
            <span
              className={cn(
                "tnum shrink-0 text-11",
                row.worstSeverity === "CAT I" ? "text-danger" : "text-muted-foreground",
              )}
              title={`${row.openFindings} open — worst ${row.worstSeverity}`}
            >
              {row.openFindings} open
            </span>
          ) : null}
        </span>
      </Td>
      <Td className={cn("truncate", row.gap && "bg-danger-soft/40")}>
        {row.gap ? (
          <span className="flex min-w-0 items-center gap-1.5 text-danger" title={row.gap}>
            <Dot tone="danger" />
            <span className="min-w-0 truncate font-medium">{row.gap}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Td>
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
      <EmptyState
        title="No requirement rows"
        description="No control in this scope decomposes into a CCI, an assessment objective or a control-level requirement."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <SctmCols />
      <SctmHead />
      <tbody>
        {rows.map((row) => (
          <Tr
            key={row.key}
            className={cn("cursor-pointer", selected === row.key && "bg-primary-soft/40")}
            onClick={() => onSelect(row)}
            title={row.statement}
          >
            <SctmRowCells row={row} />
          </Tr>
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
      <EmptyState
        title="No requirement rows"
        description="No control in this set decomposes into a CCI, an assessment objective or a control-level requirement."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <SctmCols />
      <SctmHead />
      {groups.map((group) => {
        const open = expanded.has(group.id);
        return (
          <tbody key={group.id} className="border-t border-border">
            <tr
              className="cursor-pointer bg-subtle/60 hover:bg-surface-hover"
              onClick={() => onToggle(group.id)}
            >
              <td colSpan={8} className="px-2 py-1.5">
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-label={`${open ? "Collapse" : "Expand"} ${group.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(group.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-transform",
                        open ? "" : "-rotate-90",
                      )}
                    />
                    <Mono className="w-8 shrink-0 text-foreground">{group.id}</Mono>
                  </button>

                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                    {group.name}
                  </span>

                  <span className="tnum shrink-0 text-12 text-muted-foreground">
                    {group.controls} controls
                  </span>
                  <span className="tnum shrink-0 text-12 text-muted-foreground">
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
                    <Badge size="xs" tone="warning">
                      {group.invalidated} invalidated
                    </Badge>
                  ) : null}

                  <span className="w-28 shrink-0">
                    <StackedBar
                      height={4}
                      segments={[
                        { key: "s", value: group.satisfied, tone: "success" },
                        { key: "o", value: group.other, tone: "danger" },
                        { key: "n", value: group.notAssessed, tone: "neutral" },
                      ]}
                    />
                  </span>
                  <span className="tnum w-24 shrink-0 text-right text-12 text-muted-foreground">
                    {group.satisfied}/{group.rows.length - group.notApplicable} · {group.pct}%
                  </span>
                </span>
              </td>
            </tr>

            {open
              ? group.rows.map((row) => (
                  <Tr key={row.key} title={row.statement}>
                    <SctmRowCells row={row} programId={programId} />
                  </Tr>
                ))
              : null}
          </tbody>
        );
      })}
    </Table>
  );
}

/* ── Detail rail ─────────────────────────────────────────────────────────── */

function ProseBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="pt-1.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

/** Rail values are narrow; ids wrap as chips rather than truncating to nothing. */
function IdList({ ids, empty = "—" }: { ids: string[]; empty?: string }) {
  if (ids.length === 0) return <span className="text-[12.5px] text-muted-foreground">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1 pt-0.5">
      {ids.map((id) => (
        <Mono key={id} className="text-[11.5px] text-muted-foreground">
          {id}
        </Mono>
      ))}
    </div>
  );
}

/**
 * `KeyValue` truncates its value to one line, which is right for an id and
 * wrong for a control title or a component list. This is the same grid with a
 * wrapping value cell, used only where the value genuinely runs long.
 */
function WrapValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
      <dt className="truncate text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] leading-snug text-foreground">{children}</dd>
    </div>
  );
}

export function SctmRail({ row }: { row: SctmRow }) {
  return (
    <div>
      {row.gap ? (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-danger-soft px-2.5 py-2 text-[12.5px] leading-snug text-danger">
          <span className="pt-1.5">
            <Dot tone="danger" />
          </span>
          <span className="min-w-0 font-medium">{row.gap}</span>
        </div>
      ) : null}

      <RailGroup title="Requirement">
        <KeyValue label="Control">
          <Mono>{row.control}</Mono>
        </KeyValue>
        <WrapValue label="Title">{row.controlTitle}</WrapValue>
        <KeyValue label="Family">
          {row.family} — {row.familyName}
        </KeyValue>
        <KeyValue label="Unit">
          <Badge size="xs">{row.unit}</Badge>
        </KeyValue>
        <KeyValue label="Requirement">
          <Mono>{row.requirement}</Mono>
        </KeyValue>
        <ProseBlock label="Statement">{row.statement}</ProseBlock>
      </RailGroup>

      <RailGroup title="Implementation">
        <KeyValue label="Origination">
          <Badge size="xs">{row.origination}</Badge>
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
            <Badge size="xs" tone={inheritanceStateTone[row.inheritanceState]}>
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
      </RailGroup>

      <RailGroup title="Allocation">
        <WrapValue label="Components">
          <IdList ids={row.responsibleNodes} empty="Not allocated" />
        </WrapValue>
        <ProseBlock label="Basis">{row.allocationBasis}</ProseBlock>
      </RailGroup>

      <RailGroup title="Verification">
        <KeyValue label="Method">
          <MethodChip method={row.method} />
        </KeyValue>
        <WrapValue label="Evidence">
          <IdList ids={row.evidence} empty="None recorded" />
        </WrapValue>
        <ProseBlock label="Method basis">{row.methodBasis}</ProseBlock>
      </RailGroup>

      <RailGroup title="Determination">
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
            <span className="flex items-center gap-1.5">
              <span className="shrink-0 text-[12.5px] text-muted-foreground line-through decoration-danger/70 decoration-[1.5px]">
                {row.priorDetermination}
              </span>
              <span className="text-[12px] text-muted-foreground">
                claimed as of {row.assessed}
              </span>
            </span>
          </KeyValue>
        ) : null}
        <KeyValue label="Assessed">
          <span className="tnum">{row.assessed}</span>
        </KeyValue>
        <WrapValue label="Findings">
          <IdList ids={row.findings} />
        </WrapValue>
        <KeyValue label="Open">
          <span className="flex items-center gap-1.5">
            <span className="tnum">{row.openFindings}</span>
            {row.openFindings > 0 ? (
              <Severity tone={severityToneOf(row.worstSeverity)}>{row.worstSeverity}</Severity>
            ) : null}
          </span>
        </KeyValue>
        <ProseBlock label="Note">{row.determinationNote}</ProseBlock>
      </RailGroup>
    </div>
  );
}

/* ── Summary ─────────────────────────────────────────────────────────────── */

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: Tone }) {
  const text: Record<Tone, string> = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-primary",
  };
  return (
    <div className="border-b border-border-subtle py-2 last:border-0 md:border-0">
      <div className={cn("tnum text-20 font-semibold leading-none", text[tone])}>{value}</div>
      <div className="mt-1 text-12 text-muted-foreground">{label}</div>
    </div>
  );
}

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
    <div className="flex items-center gap-3 border-b border-border-subtle py-2 last:border-0">
      <span className="w-[128px] shrink-0 truncate text-12">{label}</span>
      <span className="min-w-0 flex-1">
        <Meter value={pct} tone={tone} />
      </span>
      <span className="tnum w-16 shrink-0 text-right text-12 text-muted-foreground">
        {count} · {pct}%
      </span>
    </div>
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
    <div className="space-y-7">
      <Section
        title="Determination coverage"
        description={`Generated ${sctm.generated} from the live control matrix — ${counts.total} requirement rows.`}
        action={
          <span className="tnum text-12 text-muted-foreground">
            {counts.satisfied}/{counts.total} satisfied ·{" "}
            {Math.round((counts.satisfied / (counts.total || 1)) * 100)}%
          </span>
        }
      >
        <div className="pt-3">
          <div className="flex items-baseline gap-2 pb-2">
            <span className="tnum text-20 font-semibold leading-none">{sctm.coverage}%</span>
            <span className="tnum text-12 text-muted-foreground">
              of rows carry a determination and no gap
            </span>
          </div>
          <Meter value={sctm.coverage} tone={coverageTone} />

          <div className="pt-3">
            <StackedBar
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
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
                <span key={s.key} className="flex items-center gap-1.5 text-12">
                  <Dot tone={s.tone} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="tnum font-medium">{s.value}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 pt-4 md:grid-cols-3">
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
          </div>
        </div>
      </Section>

      {/* Currency is reported separately from determination rather than as a
          fifth segment of the bar above: the two axes are independent, so a row
          would be counted twice. */}
      <Section
        title="Determination currency"
        description="Whether what is on file still describes the configuration in force. A configuration change does not re-assess anything, so an invalidated row's positive claim is withdrawn and stops counting toward coverage while a deficiency is retained and owed a re-test; a suspect row keeps its determination and is flagged for the assessor."
        action={
          <Link
            to="/programs/$programId/baseline"
            params={{ programId: sctm.program }}
            className="text-12 text-primary hover:underline"
          >
            Change impact →
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-x-8 pt-3 md:grid-cols-3">
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
        </div>
        {withdrawn > 0 ? (
          <p className="pt-2 text-12 text-muted-foreground">
            <span className="tnum font-medium text-foreground">{withdrawn}</span> of the{" "}
            {counts.invalidated} invalidated rows carried a Satisfied determination that is now
            withdrawn; the matrix shows the retracted value struck through beside the one that
            replaced it. The rest keep their determination — a change neither closes a finding nor
            discharges a POA&M obligation.
          </p>
        ) : null}
      </Section>

      <div className="grid gap-7 md:grid-cols-2">
        <Section
          title="Verification method"
          description="How each requirement is evidenced — Test, Demonstration, Analysis or Inspection."
        >
          <div className="pt-1.5">
            {sctm.byMethod.map((m) => (
              <BreakdownRow
                key={m.method}
                label={m.method}
                count={m.count}
                total={counts.total}
                tone={verificationMethodTone[m.method]}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Control origination"
          description="What the system implements itself against what it inherits."
        >
          <div className="pt-1.5">
            {sctm.byOrigination.map((o) => (
              <BreakdownRow
                key={o.origination}
                label={o.origination}
                count={o.count}
                total={counts.total}
                tone="info"
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
