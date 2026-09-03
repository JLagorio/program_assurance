/**
 * Ingestion presentation — what the scanner said, and what the pipeline made
 * of it.
 *
 * The load-bearing component is `NormalizationView`. A normalization pipeline
 * that only shows its output is indistinguishable from a lookup table, so this
 * one puts the native record the tool emitted beside the record the normalizer
 * produced and then prints, verbatim, the three sentences that explain the
 * difference: why that severity, why that component, and what could not be
 * resolved at all. An engineer signing the scan off can audit one row end to
 * end without leaving the page.
 *
 * Presentation only. Every value arrives as a prop from `@/lib/ingestion`;
 * nothing here normalizes, deduplicates, sorts or diffs.
 */

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import {
  Absent,
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
  Stack,
  Stat,
  Table,
} from "@ledger/design-system";
import type { Tone } from "@ledger/design-system";
import { cn } from "@/lib/utils";
import {
  diffStateTone,
  formatTone,
  scanStateTone,
  type DedupGroup,
  type IngestBatch,
  type IngestDiffRow,
  type IngestDiffState,
  type NativeResult,
  type NormalizedResult,
  type ScanFormat,
  type ScanRun,
} from "@/lib/ingestion";

/* ── Shared bits ─────────────────────────────────────────────────────────── */

/** CAT severity is a status, so it carries colour; a format never does. */
function severityToneOf(severity: string): Tone {
  if (severity === "CAT I") return "danger";
  if (severity === "CAT II") return "warning";
  return "neutral";
}

export function FormatChip({ format }: { format: ScanFormat }) {
  return (
    <Badge size="xsmall" tone={formatTone[format]}>
      {format}
    </Badge>
  );
}

/** A digest or a hash is an identity, not a value — 12 characters is enough. */
function shortHash(value: string): string {
  const cut = value.indexOf(":");
  const scheme = cut < 0 ? "" : value.slice(0, cut + 1);
  const body = cut < 0 ? value : value.slice(cut + 1);
  return scheme + (body.length > 12 ? `${body.slice(0, 12)}…` : body);
}

/** Node ids read as noise on their own; the part name is what the reader knows. */
function labelNode(id: string | null, nodeName?: (nodeId: string) => string): ReactNode {
  if (!id) return <span className="text-subtle">Unallocated</span>;
  const name = nodeName?.(id);
  return (
    <Inline
      className="min-w-0"
      title={name ? `${id} — ${name}` : id}
      as="span"
      space="space.075"
      alignBlock="center"
    >
      <Id className="shrink-0 text-subtle">{id}</Id>
      {name && name !== id ? <span className="min-w-0 truncate">{name}</span> : null}
    </Inline>
  );
}

/**
 * The basis strings are full sentences written to be read, some of them 230
 * characters long. They never go in a `Td`.
 */
function ProseBlock({
  label,
  tone = "neutral",
  children,
}: {
  label: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <Box paddingBlockStart="space.075">
      <div
        className={cn(
          "font-heading-xxsmall uppercase",
          tone === "warning" ? "text-warning" : "text-subtle",
        )}
      >
        {label}
      </div>
      <p className="pt-050 font-body-small text-default">{children}</p>
    </Box>
  );
}

/* ── IngestSummary ───────────────────────────────────────────────────────── */

/**
 * The batch read-out. `deduped` counts results folded in as duplicates, not
 * groups, and `unresolved` counts this scan's own rows that still need an
 * analyst — both are stated in the tile note so neither can be misread as the
 * other.
 *
 * The closure line underneath states only what the batch actually established.
 * An empty `closable` has four different causes and they are not
 * interchangeable: the run supersedes nothing, so there is no prior picture to
 * close against; conditions dropped off but were never filed in the register;
 * conditions dropped off and another current run still reports them
 * (`contested`); or nothing dropped off at all. Collapsing them into one
 * sentence asserted a register state the pipeline never checked.
 */
export function IngestSummary({ batch, scan }: { batch: IngestBatch; scan?: ScanRun | null }) {
  const { counts, contested } = batch;
  const heldPlural = counts.unresolved === 1 ? "row" : "rows";
  const previous = scan?.supersedes ?? null;
  /**
   * Conditions the superseded run reported and this one does not. `Fixed` rows
   * are built from the same set the closure loop walks, so this is always at
   * least `closable.length + contested.length`.
   */
  const dropped = batch.diff.filter((r) => r.state === "Fixed").length;
  /** Dropped conditions that neither cleared for closure nor are contested. */
  const unfiled = Math.max(0, dropped - batch.closable.length - contested.length);
  return (
    <Stack className="pt-200" space="space.150">
      <Grid
        className="overflow-hidden rounded-large border border-default bg-neutral"
        gap="space.025"
        templateColumns={{
          base: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(6, minmax(0, 1fr))",
        }}
      >
        <Stat.Tile
          label="Native records"
          value={counts.raw}
          note={scan ? `read from ${scan.file}` : "read from the delivered file"}
        />
        <Stat.Tile
          label="Normalized"
          value={counts.normalized}
          note="mapped to the common record"
        />
        <Stat.Tile
          label="Clean"
          value={counts.clean}
          note="passing checks kept as coverage evidence"
        />
        <Stat.Tile
          label="Folded in"
          value={counts.deduped}
          note="results another source already reported"
        />
        <Stat.Tile
          label="Held for analyst"
          value={counts.unresolved}
          note={`${heldPlural} the normalizer would not guess at`}
          tone={counts.unresolved > 0 ? "warning" : "neutral"}
        />
        <Stat.Tile
          label="Proposed"
          value={batch.proposed.length}
          note="conditions with no finding in the register"
          tone={batch.proposed.length > 0 ? "warning" : "neutral"}
        />
      </Grid>

      {batch.closable.length > 0 ? (
        <p className="font-body-small text-subtle">
          {batch.closable.length}{" "}
          {batch.closable.length === 1 ? "open finding is" : "open findings are"} no longer reported
          by this scan, and no other run the program currently relies on reports{" "}
          {batch.closable.length === 1 ? "it" : "them"} either, so{" "}
          {batch.closable.length === 1 ? "it can" : "they can"} be closed out on the evidence of
          this run:{" "}
          {batch.closable.map((id, i) => (
            <span key={id}>
              {i > 0 ? ", " : null}
              <Id className="text-default">{id}</Id>
            </span>
          ))}
          .
        </p>
      ) : contested.length === 0 || unfiled > 0 ? (
        <p className="font-body-small text-subtle">
          {!scan
            ? "Nothing is queued for closure."
            : !previous
              ? "This run supersedes no earlier run, so there is no prior picture to close against and nothing is queued for closure."
              : unfiled > 0
                ? `${unfiled} condition${unfiled === 1 ? "" : "s"} ${previous} reported ${unfiled === 1 ? "is" : "are"} absent from this run, but ${unfiled === 1 ? "it carries" : "they carry"} no open finding in the register, so ${unfiled === 1 ? "it is" : "they are"} not queued for closure.`
                : `Every condition ${previous} reported is still reported here, so nothing is queued for closure.`}
        </p>
      ) : null}

      {contested.length > 0 ? (
        <div>
          <div className="font-heading-xxsmall uppercase text-warning">
            Held open rather than closed — {contested.length}{" "}
            {contested.length === 1 ? "finding" : "findings"}
          </div>
          <Stack className="pt-050" as="ul" space="space.075">
            {contested.map((c) => (
              <Inline key={c.finding} as="li" space="space.100" alignBlock="start">
                <Box as="span" paddingBlockStart="space.075">
                  <Dot tone="warning" />
                </Box>
                <span className="min-w-0 font-body-small text-default">
                  <Id className="text-default">{c.finding}</Id> — {c.basis}
                </span>
              </Inline>
            ))}
          </Stack>
        </div>
      ) : null}
    </Stack>
  );
}

/* ── ScanTable ───────────────────────────────────────────────────────────── */

export function ScanTable({
  scans,
  selected,
  onSelect,
  supersededBy,
  nodeName,
}: {
  scans: ScanRun[];
  /** SCN- id of the row to highlight. */
  selected?: string | null;
  onSelect?: (scanId: string) => void;
  /** SCN- → the later run that replaced it, for the chain column. */
  supersededBy?: Map<string, string>;
  nodeName?: (nodeId: string) => string;
}) {
  if (scans.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No scans delivered"
          description="A checklist, SCAP result, ACAS export, SAST report, SBOM or firmware report delivered against this program appears here."
        />
      </Box>
    );
  }

  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={96}>Scan</Table.Header>
          <Table.Header width={132}>Format</Table.Header>
          <Table.Header width={176}>Tool</Table.Header>
          <Table.Header>Targets</Table.Header>
          <Table.Header width={72} className="text-right">
            Raw
          </Table.Header>
          <Table.Header width={116}>State</Table.Header>
          <Table.Header width={150}>Chain</Table.Header>
          <Table.Header width={150} className="text-right">
            Completed
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {scans.map((s) => {
          const replacedBy = supersededBy?.get(s.id) ?? null;
          const targets = s.targets.map((t) => nodeName?.(t) ?? t).join(", ");
          return (
            <Table.Row
              key={s.id}
              className={cn(
                onSelect ? "cursor-pointer" : undefined,
                selected === s.id ? "bg-selected" : undefined,
              )}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
            >
              <Table.Id id={s.id} tone={onSelect ? "brand" : "subtle"} />
              <Table.Cell>
                <FormatChip format={s.format} />
              </Table.Cell>
              <Table.Cell className="truncate" title={`${s.tool} · ${s.benchmark}`}>
                {s.tool}
              </Table.Cell>
              <Table.Cell className="truncate" title={`${targets} — ${s.file}`}>
                {targets}
              </Table.Cell>
              <Table.Cell className="tabular-nums text-right">{s.rawItems}</Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={scanStateTone[s.state]}>
                  {s.state}
                </Badge>
              </Table.Cell>
              <Table.Cell
                className="truncate"
                title={
                  replacedBy
                    ? `Superseded by ${replacedBy}`
                    : s.supersedes
                      ? `Supersedes ${s.supersedes} — current run of record`
                      : "First run of this target and format"
                }
              >
                {replacedBy ? (
                  <Inline as="span" space="space.075" alignBlock="center">
                    <Dot tone="neutral" />
                    <span>Superseded by</span>
                    <Id className="text-subtle">{replacedBy}</Id>
                  </Inline>
                ) : s.supersedes ? (
                  <Inline as="span" space="space.075" alignBlock="center">
                    <Dot tone="success" />
                    <span>Replaces</span>
                    <Id className="text-subtle">{s.supersedes}</Id>
                  </Inline>
                ) : (
                  <span>First run</span>
                )}
              </Table.Cell>
              <Table.Cell className="tabular-nums truncate text-right">{s.completed}</Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/* ── ScanRail ────────────────────────────────────────────────────────────── */

export function ScanRail({
  scan,
  batch,
  supersededBy,
  nodeName,
}: {
  scan: ScanRun;
  batch?: IngestBatch | null;
  supersededBy?: string | null;
  nodeName?: (nodeId: string) => string;
}) {
  return (
    <div>
      <Inspector.Group title="Run">
        <KeyValue label="Scan">
          <Id>{scan.id}</Id>
        </KeyValue>
        <KeyValue label="Format">
          <FormatChip format={scan.format} />
        </KeyValue>
        <KeyValue label="State">
          <Badge size="xsmall" tone={scanStateTone[scan.state]}>
            {scan.state}
          </Badge>
        </KeyValue>
        <KeyValue label="Tool">
          <span title={scan.tool}>{scan.tool}</span>
        </KeyValue>
        <KeyValue label="Benchmark">
          {scan.benchmark === "—" ? (
            <Absent />
          ) : (
            <span title={scan.benchmark}>{scan.benchmark}</span>
          )}
        </KeyValue>
        <KeyValue label="Operator">{scan.operator}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Artifact">
        <Grid className="py-050" gap="space.150" templateColumns="104px 1fr" alignItems="baseline">
          <dt className="truncate font-body-small text-subtle">File</dt>
          <dd className="min-w-0 font-body-small">
            <Id className="break-all">{scan.file}</Id>
          </dd>
        </Grid>
        <KeyValue label="sha256">
          <span title={scan.sha256}>
            <Id className="text-subtle">{shortHash(scan.sha256)}</Id>
          </span>
        </KeyValue>
        <KeyValue label="Native rows">
          <span className="tabular-nums">{scan.rawItems}</span>
        </KeyValue>
        <KeyValue label="Started">
          <span className="tabular-nums">{scan.started}</span>
        </KeyValue>
        <KeyValue label="Completed">
          <span className="tabular-nums">{scan.completed}</span>
        </KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Scope">
        <Grid className="py-050" gap="space.150" templateColumns="104px 1fr" alignItems="baseline">
          <dt className="truncate font-body-small text-subtle">Targets</dt>
          <dd className="min-w-0 space-y-025 font-body-small">
            {scan.targets.map((t) => (
              <Inline key={t} className="min-w-0" space="space.075" alignBlock="baseline">
                <Id className="shrink-0 text-subtle">{t}</Id>
                <span className="min-w-0 break-words">{nodeName?.(t) ?? ""}</span>
              </Inline>
            ))}
          </dd>
        </Grid>
        <KeyValue label="Supersedes">
          {scan.supersedes ? <Id>{scan.supersedes}</Id> : <Absent />}
        </KeyValue>
        <KeyValue label="Superseded by">
          {supersededBy ? <Id>{supersededBy}</Id> : <Absent />}
        </KeyValue>
      </Inspector.Group>

      {batch ? (
        <Inspector.Group title="Batch">
          <KeyValue label="Normalized">
            <span className="tabular-nums">
              {batch.counts.normalized} of {batch.counts.raw}
            </span>
          </KeyValue>
          <KeyValue label="Clean">
            <span className="tabular-nums">{batch.counts.clean}</span>
          </KeyValue>
          <KeyValue label="Folded in">
            <span className="tabular-nums">{batch.counts.deduped}</span>
          </KeyValue>
          <KeyValue label="Held">
            <span className={cn("tabular-nums", batch.counts.unresolved > 0 ? "text-warning" : "")}>
              {batch.counts.unresolved}
            </span>
          </KeyValue>
          <KeyValue label="Proposed">
            <span className="tabular-nums">{batch.proposed.length}</span>
          </KeyValue>
          <KeyValue label="Closable">
            {batch.closable.length > 0 ? (
              <span title={batch.closable.join(", ")}>{batch.closable.join(", ")}</span>
            ) : (
              <Absent />
            )}
          </KeyValue>
          <KeyValue label="Contested">
            {batch.contested.length > 0 ? (
              <span className="text-warning" title={batch.contested.map((c) => c.basis).join(" ")}>
                {batch.contested.map((c) => c.finding).join(", ")}
              </span>
            ) : (
              <Absent />
            )}
          </KeyValue>
          {batch.contested.map((c) => (
            <ProseBlock key={c.finding} label={`${c.finding} held open`} tone="warning">
              {c.basis}
            </ProseBlock>
          ))}
        </Inspector.Group>
      ) : null}

      <Inspector.Group title="Operator note">
        <ProseBlock label="Note">{scan.note}</ProseBlock>
      </Inspector.Group>
    </div>
  );
}

/* ── NormalizationView ───────────────────────────────────────────────────── */

export type NormalizationRow = { native: NativeResult; normalized: NormalizedResult };

type NativeField = { label: string; value: string; mono?: boolean; prose?: boolean };

/**
 * The native record, field by field, exactly as the format carries it. This is
 * the half of the audit the tool is responsible for — no mapping has happened
 * yet, so nothing here is renamed into pipeline vocabulary.
 */
function nativeFields(native: NativeResult): NativeField[] {
  switch (native.format) {
    case "STIG CKL":
    case "STIG CKLB":
      return [
        { label: "Vuln_Num", value: native.vulnNum, mono: true },
        { label: "Rule_ID", value: native.ruleId, mono: true },
        { label: "Rule_Title", value: native.ruleTitle, prose: true },
        { label: "Severity", value: native.severity, mono: true },
        { label: "Status", value: native.status },
        {
          label: "CCI_REF",
          value: native.cciRefs.length > 0 ? native.cciRefs.join(", ") : "—",
          mono: true,
        },
        { label: "Finding_Details", value: native.findingDetails, prose: true },
        { label: "Comments", value: native.comments, prose: true },
      ];
    case "SCAP XCCDF":
      return [
        { label: "rule id", value: native.ruleId, mono: true },
        { label: "title", value: native.title, prose: true },
        { label: "result", value: native.result, mono: true },
        { label: "severity", value: native.severity, mono: true },
        {
          label: "ident",
          value: native.idents.length > 0 ? native.idents.join(", ") : "—",
          mono: true,
        },
      ];
    case "ACAS Nessus":
      // The compliance triple is what actually identifies an audit-file check:
      // 21157/71049 are Tenable's generic "came from an audit file" plugins, so
      // without these three fields the native record states no requirement
      // beside a normalized record that asserts one. Absent on plain
      // vulnerability rows, which is itself the distinction worth showing.
      return [
        { label: "pluginID", value: native.pluginId, mono: true },
        { label: "pluginName", value: native.pluginName, prose: true },
        { label: "compliance_check_name", value: native.complianceCheckName ?? "—", mono: true },
        { label: "compliance_result", value: native.complianceResult ?? "—", mono: true },
        { label: "compliance_reference", value: native.complianceReference ?? "—", mono: true },
        { label: "risk_factor", value: native.riskFactor },
        { label: "cvss_base_score", value: native.cvss.toFixed(1), mono: true },
        { label: "cve", value: native.cve.length > 0 ? native.cve.join(", ") : "—", mono: true },
        { label: "host", value: native.host, mono: true },
        { label: "port", value: String(native.port), mono: true },
        { label: "plugin_output", value: native.output, prose: true },
      ];
    case "SAST SonarQube":
      return [
        { label: "key", value: native.key, mono: true },
        { label: "rule", value: native.rule, mono: true },
        { label: "type", value: native.type, mono: true },
        { label: "severity", value: native.sonarSeverity, mono: true },
        { label: "component", value: native.component, mono: true },
        { label: "line", value: String(native.line), mono: true },
        { label: "cwe", value: native.cwe.length > 0 ? native.cwe.join(", ") : "—", mono: true },
        { label: "message", value: native.message, prose: true },
      ];
    case "SCA CycloneDX-VEX":
      return [
        { label: "purl", value: native.purl, mono: true },
        { label: "vulnerability", value: native.vulnerability, mono: true },
        { label: "cvss score", value: native.cvss.toFixed(1), mono: true },
        { label: "kev", value: native.kev ? "true" : "false", mono: true },
        { label: "analysis.state", value: native.analysisState, mono: true },
        { label: "affects.fixedIn", value: native.fixedIn, mono: true },
        { label: "analysis.detail", value: native.justification, prose: true },
      ];
    case "Fuzzing":
      return [
        { label: "campaign", value: native.campaign, mono: true },
        { label: "crash id", value: native.crashId, mono: true },
        { label: "signal", value: native.signal, mono: true },
        { label: "stack hash", value: native.stackHash, mono: true },
        { label: "target", value: native.target, mono: true },
        { label: "reproducible", value: native.reproducible ? "true" : "false", mono: true },
        { label: "iterations", value: native.iterations.toLocaleString("en-US"), mono: true },
      ];
    case "Firmware analysis":
      return [
        { label: "image digest", value: native.imageDigest, mono: true },
        { label: "check id", value: native.checkId, mono: true },
        { label: "check", value: native.check, prose: true },
        { label: "verdict", value: native.verdict, mono: true },
        { label: "offset", value: native.offset, mono: true },
        { label: "detail", value: native.detail, prose: true },
      ];
    default:
      return [];
  }
}

function NativeRow({ field }: { field: NativeField }) {
  return (
    <Grid
      className="border-b border-default py-050 last:border-0"
      gap="space.150"
      templateColumns="124px 1fr"
      alignItems="baseline"
    >
      <dt className="truncate font-heading-xxsmall uppercase text-subtle">{field.label}</dt>
      <dd className={cn("min-w-0 font-body-small text-default", field.prose ? "" : "")}>
        {field.mono ? (
          <Id className="break-all font-body-small">{field.value}</Id>
        ) : (
          <span className="break-words">{field.value}</span>
        )}
      </dd>
    </Grid>
  );
}

function NormalizedRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Grid
      className="border-b border-default py-050 last:border-0"
      gap="space.150"
      templateColumns="124px 1fr"
      alignItems="baseline"
    >
      <dt className="truncate font-heading-xxsmall uppercase text-subtle">{label}</dt>
      <dd className="min-w-0 font-body-small text-default">{children}</dd>
    </Grid>
  );
}

function PanelHeading({ title, note }: { title: string; note: string }) {
  return (
    <Box className="border-b border-default" paddingBlockEnd="space.100">
      <h3 className="font-body-small font-semibold">{title}</h3>
      <p className="pt-025 font-body-small text-subtle">{note}</p>
    </Box>
  );
}

/**
 * The audit surface for one result: native on the left, normalized on the
 * right, and the derivation underneath in the normalizer's own words.
 */
export function NormalizationAudit({
  row,
  scan,
  nodeName,
}: {
  row: NormalizationRow;
  scan?: ScanRun | null | undefined;
  nodeName?: ((nodeId: string) => string) | undefined;
}) {
  const { native, normalized } = row;
  return (
    <Stack space="space.200">
      <Grid
        className="overflow-hidden rounded-large border border-default bg-neutral"
        gap="space.025"
        templateColumns={{
          base: "repeat(1, minmax(0, 1fr))",
          lg: "minmax(0,1fr) 28px minmax(0,1fr)",
        }}
      >
        <Stack className="bg-surface px-200 py-150" space="space.100">
          <PanelHeading
            title="Native record"
            note={
              scan
                ? `As ${scan.tool} wrote it into ${scan.file}.`
                : `As the ${native.format} tool emitted it.`
            }
          />
          <dl>
            {nativeFields(native).map((f) => (
              <NativeRow key={f.label} field={f} />
            ))}
          </dl>
        </Stack>

        <Inline className="bg-surface py-050 lg:py-0" alignBlock="center" alignInline="center">
          <ArrowRight className="size-icon-medium rotate-90 text-subtle lg:rotate-0" />
        </Inline>

        <Stack className="bg-surface px-200 py-150" space="space.100">
          <PanelHeading
            title="Normalized record"
            note="The common shape every format lands in. Nothing below was carried across without a rule."
          />
          <dl>
            <NormalizedRow label="id">
              <Id className="break-all font-body-small">{normalized.id}</Id>
            </NormalizedRow>
            <NormalizedRow label="format">
              <FormatChip format={normalized.format} />
            </NormalizedRow>
            <NormalizedRow label="native id">
              <Id className="break-all font-body-small">{normalized.nativeId}</Id>
            </NormalizedRow>
            <NormalizedRow label="cci">
              {normalized.cci ? (
                <Id className="font-body-small">{normalized.cci}</Id>
              ) : (
                <span className="text-warning">null — not asserted by this format</span>
              )}
            </NormalizedRow>
            <NormalizedRow label="control">
              {normalized.control ? (
                <Id className="font-body-small">{normalized.control}</Id>
              ) : (
                <span className="text-subtle">null</span>
              )}
            </NormalizedRow>
            <NormalizedRow label="rule">
              {normalized.rule ? (
                <Id className="font-body-small">{normalized.rule}</Id>
              ) : (
                <span className="text-subtle">null</span>
              )}
            </NormalizedRow>
            <NormalizedRow label="node">{labelNode(normalized.node, nodeName)}</NormalizedRow>
            <NormalizedRow label="severity">
              <Inline as="span" space="space.075" alignBlock="center">
                <Indicator tone={severityToneOf(normalized.severity)}>
                  {normalized.severity}
                </Indicator>
                <Badge size="xsmall" tone={normalized.clean ? "success" : "neutral"}>
                  {normalized.clean ? "Clean" : "Reportable"}
                </Badge>
              </Inline>
            </NormalizedRow>
            <NormalizedRow label="title">
              <span className="break-words">{normalized.title}</span>
            </NormalizedRow>
            <NormalizedRow label="detail">
              <span className="break-words">{normalized.detail}</span>
            </NormalizedRow>
          </dl>
        </Stack>
      </Grid>

      <Box
        className="rounded-large border border-default bg-surface-sunken"
        paddingInline="space.200"
        paddingBlock="space.150"
      >
        <h3 className="font-body-small font-semibold">How this row was derived</h3>
        <p className="pt-025 font-body-small text-subtle">
          Every mapping decision states its own basis. These sentences are the normalizer&rsquo;s,
          not the reviewer&rsquo;s.
        </p>
        <Grid
          className="pt-100"
          columnGap="space.400"
          templateColumns={{ base: "repeat(1, minmax(0, 1fr))", lg: "repeat(2, minmax(0, 1fr))" }}
        >
          <ProseBlock label="Severity basis">{normalized.severityBasis}</ProseBlock>
          <ProseBlock label="Node basis">{normalized.nodeBasis}</ProseBlock>
          {/* The requirement is the third mapping decision, and until now the
              only one that appeared with no stated origin. */}
          <ProseBlock label="CCI basis">{normalized.cciBasis}</ProseBlock>
        </Grid>
        <Box paddingBlockStart="space.050">
          {normalized.unresolved.length > 0 ? (
            <>
              <Box
                className="font-heading-xxsmall uppercase text-warning"
                paddingBlockStart="space.075"
              >
                Held for an analyst — {normalized.unresolved.length}{" "}
                {normalized.unresolved.length === 1 ? "item" : "items"}
              </Box>
              <Stack className="pt-050" as="ul" space="space.075">
                {normalized.unresolved.map((u) => (
                  <Inline key={u} as="li" space="space.100" alignBlock="start">
                    <Box as="span" paddingBlockStart="space.075">
                      <Dot tone="warning" />
                    </Box>
                    <span className="min-w-0 font-body-small text-default">{u}</span>
                  </Inline>
                ))}
              </Stack>
            </>
          ) : (
            <ProseBlock label="Held for an analyst">
              Nothing. The requirement and the component both resolved, so this row can become a
              finding without a human filling a blank in first.
            </ProseBlock>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

/**
 * The scan's results as a picker, with the audit panel for the selected row
 * underneath. Both halves stay on screen, which is the whole point: the reader
 * compares a row against its neighbours and against its own native record
 * without navigating.
 */
export function NormalizationView({
  rows,
  selected,
  onSelect,
  scan,
  nodeName,
}: {
  rows: NormalizationRow[];
  /** `NormalizedResult.id` of the row to audit. */
  selected?: string | null;
  onSelect?: (resultId: string) => void;
  scan?: ScanRun | null;
  nodeName?: (nodeId: string) => string;
}) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No native records on this run"
          description="The delivered file carried no result rows, so there is nothing to normalize."
        />
      </Box>
    );
  }

  const active = rows.find((r) => r.normalized.id === selected) ?? rows[0] ?? null;

  return (
    <Stack space="space.200">
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={168}>Native id</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header width={92}>Severity</Table.Header>
            <Table.Header width={104}>Result</Table.Header>
            <Table.Header width={116}>CCI</Table.Header>
            <Table.Header width={196}>Component</Table.Header>
            <Table.Header width={112} className="text-right">
              Held
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ normalized }) => (
            <Table.Row
              key={normalized.id}
              className={cn(
                onSelect ? "cursor-pointer" : undefined,
                active && active.normalized.id === normalized.id ? "bg-selected" : undefined,
              )}
              onClick={onSelect ? () => onSelect(normalized.id) : undefined}
            >
              <Table.Cell>
                <Id className="truncate">{normalized.nativeId}</Id>
              </Table.Cell>
              <Table.Cell className="truncate" title={normalized.title}>
                {normalized.title}
              </Table.Cell>
              <Table.Cell>
                <Indicator tone={severityToneOf(normalized.severity)}>
                  {normalized.severity}
                </Indicator>
              </Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={normalized.clean ? "success" : "neutral"}>
                  {normalized.clean ? "Clean" : "Reportable"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {normalized.cci ? (
                  <Id>{normalized.cci}</Id>
                ) : (
                  <span className="text-subtle">Not asserted</span>
                )}
              </Table.Cell>
              <Table.Cell className="truncate">{labelNode(normalized.node, nodeName)}</Table.Cell>
              <Table.Cell className="text-right">
                {normalized.unresolved.length > 0 ? (
                  <Badge size="xsmall" tone="warning">
                    {normalized.unresolved.length}
                  </Badge>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>

      {active ? <NormalizationAudit row={active} scan={scan} nodeName={nodeName} /> : null}
    </Stack>
  );
}

/* ── DedupTable ──────────────────────────────────────────────────────────── */

function FindingChips({ group }: { group: DedupGroup }) {
  if (group.existingAll.length === 0) {
    return (
      <span className="text-subtle">
        {group.primary.clean ? "Coverage only" : "No finding filed"}
      </span>
    );
  }
  return (
    <Inline className="min-w-0" as="span" space="space.050" alignBlock="center">
      {group.existingAll.map((id) => (
        <Badge key={id} size="xsmall" tone={id === group.existing ? "information" : "neutral"}>
          {id}
        </Badge>
      ))}
    </Inline>
  );
}

/**
 * What the primary beat, counted off `duplicates` rather than off `sources`.
 * `DedupGroup.sources` is a list of DISTINCT formats, so reading the label out
 * of it fails twice: a group whose duplicates all share the primary's format
 * filters down to nothing and rendered a dangling "1 from ", and a mixed group
 * attributed every duplicate to whichever other format happened to come first
 * ("2 from ACAS Nessus" when only one of the two did). Tallying the members by
 * their own format states both cases truthfully; the `+N` elision keeps the
 * cell inside its fixed column, and the Td's title spells the rest out.
 */
function foldedInLabel(duplicates: NormalizedResult[]): string {
  const byFormat = new Map<ScanFormat, number>();
  for (const d of duplicates) byFormat.set(d.format, (byFormat.get(d.format) ?? 0) + 1);
  const entries = [...byFormat];
  const first = entries[0];
  if (!first) return "";
  return `${first[1]} from ${first[0]}${entries.length > 1 ? ` +${entries.length - 1}` : ""}`;
}

export function DedupTable({
  groups,
  selected,
  onSelect,
  nodeName,
}: {
  groups: DedupGroup[];
  /** `DedupGroup.key` of the row to highlight. */
  selected?: string | null;
  onSelect?: (key: string) => void;
  nodeName?: (nodeId: string) => string;
}) {
  if (groups.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing to reconcile"
          description="No two results in the program's current scans share a requirement, a component and a rule."
        />
      </Box>
    );
  }

  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={204}>Dedup key</Table.Header>
          <Table.Header width={204}>Kept from</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={84} className="text-right">
            Severity
          </Table.Header>
          <Table.Header width={100}>Result</Table.Header>
          <Table.Header width={152}>Folded in</Table.Header>
          <Table.Header width={168}>Register</Table.Header>
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => (
          <Table.Row
            key={g.key}
            className={cn(
              onSelect ? "cursor-pointer" : undefined,
              selected === g.key ? "bg-selected" : undefined,
            )}
            onClick={onSelect ? () => onSelect(g.key) : undefined}
          >
            <Table.Cell
              className="truncate"
              title={`${g.key} — ${nodeName?.(g.primary.node ?? "") ?? ""}`}
            >
              <Id>{g.key}</Id>
            </Table.Cell>
            <Table.Cell className="truncate" title={`${g.primary.format} · ${g.primary.scan}`}>
              <Inline className="min-w-0" as="span" space="space.075" alignBlock="center">
                <FormatChip format={g.primary.format} />
                <Id>{g.primary.scan}</Id>
              </Inline>
            </Table.Cell>
            <Table.Cell className="truncate" title={g.primary.title}>
              {g.primary.title}
            </Table.Cell>
            <Table.Cell className="text-right">
              <Indicator tone={severityToneOf(g.primary.severity)}>{g.primary.severity}</Indicator>
            </Table.Cell>
            {/* Without this the CAT chip is the loudest thing on a passing row
                and says the opposite of what the row means — the only clean
                signal was a muted "Coverage only" in the last column. Mirrors
                the Normalization table rather than neutering the severity
                tone, which is CAT III's colour and would collide. */}
            <Table.Cell>
              <Badge size="xsmall" tone={g.primary.clean ? "success" : "neutral"}>
                {g.primary.clean ? "Clean" : "Reportable"}
              </Badge>
            </Table.Cell>
            <Table.Cell
              className="truncate"
              title={g.duplicates.map((d) => `${d.format} — ${d.id}`).join(", ")}
            >
              {g.duplicates.length === 0 ? (
                <span>Sole source</span>
              ) : (
                <Inline className="min-w-0" as="span" space="space.075" alignBlock="center">
                  <Dot tone="warning" />
                  <span className="min-w-0 truncate">{foldedInLabel(g.duplicates)}</span>
                </Inline>
              )}
            </Table.Cell>
            <Table.Cell className="truncate" title={g.existingAll.join(", ")}>
              <FindingChips group={g} />
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ── DedupRail ───────────────────────────────────────────────────────────── */

function MemberLine({ result, role }: { result: NormalizedResult; role: "Primary" | "Duplicate" }) {
  return (
    <Inline className="min-w-0 py-025" space="space.075" alignBlock="baseline">
      <Badge size="xsmall" tone={role === "Primary" ? "information" : "neutral"}>
        {result.format}
      </Badge>
      <Id className="shrink-0 text-subtle">{result.scan}</Id>
      <span className="min-w-0 break-all font-body-small text-subtle">{result.nativeId}</span>
    </Inline>
  );
}

export function DedupRail({
  group,
  nodeName,
}: {
  group: DedupGroup;
  nodeName?: (nodeId: string) => string;
}) {
  const folded = group.existingAll.filter((id) => id !== group.existing);
  return (
    <div>
      <Inspector.Group title="Group">
        <Grid className="py-050" gap="space.150" templateColumns="104px 1fr" alignItems="baseline">
          <dt className="truncate font-body-small text-subtle">Key</dt>
          <dd className="min-w-0 font-body-small">
            <Id className="break-all">{group.key}</Id>
          </dd>
        </Grid>
        <KeyValue label="Component">{labelNode(group.primary.node, nodeName)}</KeyValue>
        <KeyValue label="Severity">
          <Inline as="span" space="space.075" alignBlock="center">
            <Indicator tone={severityToneOf(group.primary.severity)}>
              {group.primary.severity}
            </Indicator>
            <Badge size="xsmall" tone={group.primary.clean ? "success" : "neutral"}>
              {group.primary.clean ? "Clean" : "Reportable"}
            </Badge>
          </Inline>
        </KeyValue>
        <KeyValue label="Sources">
          <span className="tabular-nums">{group.sources.length}</span>
        </KeyValue>
        <ProseBlock label="Condition">{group.primary.title}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Reconciliation">
        <Box paddingBlockStart="space.025">
          <MemberLine result={group.primary} role="Primary" />
          {group.duplicates.map((d) => (
            <MemberLine key={d.id} result={d} role="Duplicate" />
          ))}
        </Box>
        <ProseBlock label="Basis">{group.basis}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Register">
        <KeyValue label="Filed as">
          {group.existing ? <Id>{group.existing}</Id> : <Absent />}
        </KeyValue>
        <KeyValue label="Also filed">
          {folded.length > 0 ? (
            <Inline as="span" space="space.050" shouldWrap>
              {folded.map((id) => (
                <Id key={id} className="text-subtle">
                  {id}
                </Id>
              ))}
            </Inline>
          ) : (
            <Absent />
          )}
        </KeyValue>
        <ProseBlock label="Reading">
          {group.existingAll.length > 1
            ? `The register carries ${group.existingAll.length} rows for this one condition. They are the same weakness reported by ${group.sources.join(" and ")}; all but ${group.existing ?? group.existingAll[0]} are duplicates by derivation, not by assertion.`
            : group.existing
              ? `One row in the register covers this condition, and this scan corroborates it.`
              : group.primary.clean
                ? `Nothing is filed and nothing needs to be: the source reports this check as passing, so the row is coverage evidence rather than a weakness.`
                : `No finding covers this condition yet. It sits on the proposed queue until an analyst accepts it.`}
        </ProseBlock>
      </Inspector.Group>
    </div>
  );
}

/* ── ScanDiffTable ───────────────────────────────────────────────────────── */

const diffStates: IngestDiffState[] = ["Reappeared", "New", "Persistent", "Fixed"];

const diffMeaning: Record<IngestDiffState, string> = {
  New: "not reported by the run this one replaces",
  Persistent: "reported by both runs",
  Fixed: "reported by the previous run and not by this one",
  Reappeared: "answered clean last run, open again now",
};

/**
 * All four of the above describe a previous run, and on a first run there is
 * none — including `New`, whose "the run this one replaces" is as false as the
 * other three. The chips still render, so the row stays structurally stable
 * across the picker and the three comparison states read as zero by
 * construction rather than by accident.
 */
const firstRunMeaning: Record<IngestDiffState, string> = {
  New: "every condition this run reports",
  Persistent: "needs a prior run to compare",
  Fixed: "needs a prior run to compare",
  Reappeared: "needs a prior run to compare",
};

export function ScanDiffTable({
  rows,
  current,
  previous,
  nodeName,
}: {
  rows: IngestDiffRow[];
  /** SCN- of the run being read. */
  current?: string;
  /** SCN- it supersedes, or null for a first run. */
  previous?: string | null;
  nodeName?: (nodeId: string) => string;
}) {
  const tally = diffStates.map((state) => ({
    state,
    count: rows.filter((r) => r.state === state).length,
  }));
  const meaning = previous ? diffMeaning : firstRunMeaning;

  return (
    <Stack className="pt-200" space="space.150">
      <Inline space="space.250" rowSpace="space.100" alignBlock="center" shouldWrap>
        {tally.map((t) => (
          <Inline
            key={t.state}
            title={meaning[t.state]}
            as="span"
            space="space.075"
            alignBlock="baseline"
          >
            <Badge size="xsmall" tone={diffStateTone[t.state]}>
              {t.state}
            </Badge>
            <span className="tabular-nums font-body font-medium">{t.count}</span>
            <span className="font-body-small text-subtle">{meaning[t.state]}</span>
          </Inline>
        ))}
      </Inline>

      {rows.length === 0 ? (
        <Empty
          title="Nothing to compare"
          description={
            previous
              ? `Neither ${previous} nor ${current ?? "this run"} reported a condition that survived normalization.`
              : "This is the first run against this target and format, so there is no prior picture to diff against."
          }
        />
      ) : (
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={116}>State</Table.Header>
              <Table.Header>Condition</Table.Header>
              <Table.Header width={84} className="text-right">
                Severity
              </Table.Header>
              <Table.Header width={196}>Component</Table.Header>
              <Table.Header width={108}>First seen</Table.Header>
              <Table.Header width={108}>Last seen</Table.Header>
              <Table.Header width={88} className="text-right">
                Runs
              </Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Table.Row key={r.key}>
                <Table.Cell>
                  <Badge size="xsmall" tone={diffStateTone[r.state]}>
                    {r.state}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="truncate" title={`${r.title} — ${r.key}`}>
                  {r.title}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Indicator tone={severityToneOf(r.severity)}>{r.severity}</Indicator>
                </Table.Cell>
                <Table.Cell className="truncate">{labelNode(r.node, nodeName)}</Table.Cell>
                <Table.Cell>
                  <Id>{r.firstSeen}</Id>
                </Table.Cell>
                <Table.Cell>
                  <Id>{r.lastSeen}</Id>
                </Table.Cell>
                <Table.Cell className="tabular-nums text-right">{r.occurrences}</Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      )}
    </Stack>
  );
}
