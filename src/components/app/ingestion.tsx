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
  Badge,
  Dot,
  EmptyState,
  KeyValue,
  RailGroup,
  Table,
  type Tone,
  Id,
  Indicator,
} from "@/components/app/ui";
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

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

export function FormatChip({ format }: { format: ScanFormat }) {
  return (
    <Badge size="xs" tone={formatTone[format]}>
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
  if (!id) return <span className="text-muted-foreground">Unallocated</span>;
  const name = nodeName?.(id);
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={name ? `${id} — ${name}` : id}>
      <Id className="shrink-0 text-muted-foreground">{id}</Id>
      {name && name !== id ? <span className="min-w-0 truncate">{name}</span> : null}
    </span>
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
    <div className="pt-1.5">
      <div
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.06em]",
          tone === "warning" ? "text-warning" : "text-muted-foreground",
        )}
      >
        {label}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

/* ── IngestSummary ───────────────────────────────────────────────────────── */

function Tile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: number;
  note: string;
  tone?: Tone;
}) {
  return (
    <div className="bg-background px-4 py-3">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tnum mt-0.5 text-[20px] font-semibold tracking-[-0.02em]",
          tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{note}</div>
    </div>
  );
}

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
    <div className="space-y-3 pt-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        <Tile
          label="Native records"
          value={counts.raw}
          note={scan ? `read from ${scan.file}` : "read from the delivered file"}
        />
        <Tile label="Normalized" value={counts.normalized} note="mapped to the common record" />
        <Tile label="Clean" value={counts.clean} note="passing checks kept as coverage evidence" />
        <Tile
          label="Folded in"
          value={counts.deduped}
          note="results another source already reported"
        />
        <Tile
          label="Held for analyst"
          value={counts.unresolved}
          note={`${heldPlural} the normalizer would not guess at`}
          tone={counts.unresolved > 0 ? "warning" : "neutral"}
        />
        <Tile
          label="Proposed"
          value={batch.proposed.length}
          note="conditions with no finding in the register"
          tone={batch.proposed.length > 0 ? "warning" : "neutral"}
        />
      </div>

      {batch.closable.length > 0 ? (
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {batch.closable.length}{" "}
          {batch.closable.length === 1 ? "open finding is" : "open findings are"} no longer reported
          by this scan, and no other run the program currently relies on reports{" "}
          {batch.closable.length === 1 ? "it" : "them"} either, so{" "}
          {batch.closable.length === 1 ? "it can" : "they can"} be closed out on the evidence of
          this run:{" "}
          {batch.closable.map((id, i) => (
            <span key={id}>
              {i > 0 ? ", " : null}
              <Id className="text-foreground">{id}</Id>
            </span>
          ))}
          .
        </p>
      ) : contested.length === 0 || unfiled > 0 ? (
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
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
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-warning">
            Held open rather than closed — {contested.length}{" "}
            {contested.length === 1 ? "finding" : "findings"}
          </div>
          <ul className="mt-1 space-y-1.5">
            {contested.map((c) => (
              <li key={c.finding} className="flex items-start gap-2">
                <span className="pt-[7px]">
                  <Dot tone="warning" />
                </span>
                <span className="min-w-0 text-[12.5px] leading-relaxed text-foreground">
                  <Id className="text-foreground">{c.finding}</Id> — {c.basis}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
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
      <div className="pt-4">
        <EmptyState
          title="No scans delivered"
          description="A checklist, SCAP result, ACAS export, SAST report, SBOM or firmware report delivered against this program appears here."
        />
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "96px" }} />
        <col style={{ width: "132px" }} />
        <col style={{ width: "176px" }} />
        <col />
        <col style={{ width: "72px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "150px" }} />
        <col style={{ width: "150px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Scan</Table.Header>
          <Table.Header>Format</Table.Header>
          <Table.Header>Tool</Table.Header>
          <Table.Header>Targets</Table.Header>
          <Table.Header className="text-right">Raw</Table.Header>
          <Table.Header>State</Table.Header>
          <Table.Header>Chain</Table.Header>
          <Table.Header className="text-right">Completed</Table.Header>
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
                selected === s.id ? "bg-primary-soft/40" : undefined,
              )}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
            >
              <Table.Cell>
                <Id className={onSelect ? "text-primary" : "text-muted-foreground"}>{s.id}</Id>
              </Table.Cell>
              <Table.Cell>
                <FormatChip format={s.format} />
              </Table.Cell>
              <Table.Cell className="truncate" title={`${s.tool} · ${s.benchmark}`}>
                {s.tool}
              </Table.Cell>
              <Table.Cell className="truncate" title={`${targets} — ${s.file}`}>
                {targets}
              </Table.Cell>
              <Table.Cell className="tnum text-right">{s.rawItems}</Table.Cell>
              <Table.Cell>
                <Badge size="xs" tone={scanStateTone[s.state]}>
                  {s.state}
                </Badge>
              </Table.Cell>
              <Table.Cell
                className="truncate text-muted-foreground"
                title={
                  replacedBy
                    ? `Superseded by ${replacedBy}`
                    : s.supersedes
                      ? `Supersedes ${s.supersedes} — current run of record`
                      : "First run of this target and format"
                }
              >
                {replacedBy ? (
                  <span className="flex items-center gap-1.5">
                    <Dot tone="neutral" />
                    <span>Superseded by</span>
                    <Id className="text-muted-foreground">{replacedBy}</Id>
                  </span>
                ) : s.supersedes ? (
                  <span className="flex items-center gap-1.5">
                    <Dot tone="success" />
                    <span>Replaces</span>
                    <Id className="text-muted-foreground">{s.supersedes}</Id>
                  </span>
                ) : (
                  <span>First run</span>
                )}
              </Table.Cell>
              <Table.Cell className="tnum truncate text-right">{s.completed}</Table.Cell>
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
      <RailGroup title="Run">
        <KeyValue label="Scan">
          <Id>{scan.id}</Id>
        </KeyValue>
        <KeyValue label="Format">
          <FormatChip format={scan.format} />
        </KeyValue>
        <KeyValue label="State">
          <Badge size="xs" tone={scanStateTone[scan.state]}>
            {scan.state}
          </Badge>
        </KeyValue>
        <KeyValue label="Tool">
          <span title={scan.tool}>{scan.tool}</span>
        </KeyValue>
        <KeyValue label="Benchmark">
          {scan.benchmark === "—" ? <Dash /> : <span title={scan.benchmark}>{scan.benchmark}</span>}
        </KeyValue>
        <KeyValue label="Operator">{scan.operator}</KeyValue>
      </RailGroup>

      <RailGroup title="Artifact">
        <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
          <dt className="truncate text-[12.5px] text-muted-foreground">File</dt>
          <dd className="min-w-0 text-[12.5px] leading-snug">
            <Id className="break-all">{scan.file}</Id>
          </dd>
        </div>
        <KeyValue label="sha256">
          <span title={scan.sha256}>
            <Id className="text-muted-foreground">{shortHash(scan.sha256)}</Id>
          </span>
        </KeyValue>
        <KeyValue label="Native rows">
          <span className="tnum">{scan.rawItems}</span>
        </KeyValue>
        <KeyValue label="Started">
          <span className="tnum">{scan.started}</span>
        </KeyValue>
        <KeyValue label="Completed">
          <span className="tnum">{scan.completed}</span>
        </KeyValue>
      </RailGroup>

      <RailGroup title="Scope">
        <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
          <dt className="truncate text-[12.5px] text-muted-foreground">Targets</dt>
          <dd className="min-w-0 space-y-0.5 text-[12.5px] leading-snug">
            {scan.targets.map((t) => (
              <div key={t} className="flex min-w-0 items-baseline gap-1.5">
                <Id className="shrink-0 text-muted-foreground">{t}</Id>
                <span className="min-w-0 break-words">{nodeName?.(t) ?? ""}</span>
              </div>
            ))}
          </dd>
        </div>
        <KeyValue label="Supersedes">
          {scan.supersedes ? <Id>{scan.supersedes}</Id> : <Dash />}
        </KeyValue>
        <KeyValue label="Superseded by">
          {supersededBy ? <Id>{supersededBy}</Id> : <Dash />}
        </KeyValue>
      </RailGroup>

      {batch ? (
        <RailGroup title="Batch">
          <KeyValue label="Normalized">
            <span className="tnum">
              {batch.counts.normalized} of {batch.counts.raw}
            </span>
          </KeyValue>
          <KeyValue label="Clean">
            <span className="tnum">{batch.counts.clean}</span>
          </KeyValue>
          <KeyValue label="Folded in">
            <span className="tnum">{batch.counts.deduped}</span>
          </KeyValue>
          <KeyValue label="Held">
            <span className={cn("tnum", batch.counts.unresolved > 0 ? "text-warning" : "")}>
              {batch.counts.unresolved}
            </span>
          </KeyValue>
          <KeyValue label="Proposed">
            <span className="tnum">{batch.proposed.length}</span>
          </KeyValue>
          <KeyValue label="Closable">
            {batch.closable.length > 0 ? (
              <span title={batch.closable.join(", ")}>{batch.closable.join(", ")}</span>
            ) : (
              <Dash />
            )}
          </KeyValue>
          <KeyValue label="Contested">
            {batch.contested.length > 0 ? (
              <span className="text-warning" title={batch.contested.map((c) => c.basis).join(" ")}>
                {batch.contested.map((c) => c.finding).join(", ")}
              </span>
            ) : (
              <Dash />
            )}
          </KeyValue>
          {batch.contested.map((c) => (
            <ProseBlock key={c.finding} label={`${c.finding} held open`} tone="warning">
              {c.basis}
            </ProseBlock>
          ))}
        </RailGroup>
      ) : null}

      <RailGroup title="Operator note">
        <ProseBlock label="Note">{scan.note}</ProseBlock>
      </RailGroup>
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
    <div className="grid grid-cols-[124px_1fr] items-baseline gap-3 border-b border-border-subtle py-[5px] last:border-0">
      <dt className="truncate text-[11.5px] uppercase tracking-[0.04em] text-muted-foreground">
        {field.label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-[12.5px] text-foreground",
          field.prose ? "leading-relaxed" : "leading-snug",
        )}
      >
        {field.mono ? (
          <Id className="break-all text-[12px]">{field.value}</Id>
        ) : (
          <span className="break-words">{field.value}</span>
        )}
      </dd>
    </div>
  );
}

function NormalizedRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[124px_1fr] items-baseline gap-3 border-b border-border-subtle py-[5px] last:border-0">
      <dt className="truncate text-[11.5px] uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-[12.5px] leading-snug text-foreground">{children}</dd>
    </div>
  );
}

function PanelHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="border-b border-border pb-2">
      <h3 className="text-[12.5px] font-semibold tracking-[-0.005em]">{title}</h3>
      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{note}</p>
    </div>
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)]">
        <div className="space-y-2 bg-card px-4 py-3">
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
        </div>

        <div className="flex items-center justify-center bg-card py-1 lg:py-0">
          <ArrowRight className="size-4 rotate-90 text-muted-foreground lg:rotate-0" />
        </div>

        <div className="space-y-2 bg-card px-4 py-3">
          <PanelHeading
            title="Normalized record"
            note="The common shape every format lands in. Nothing below was carried across without a rule."
          />
          <dl>
            <NormalizedRow label="id">
              <Id className="break-all text-[12px]">{normalized.id}</Id>
            </NormalizedRow>
            <NormalizedRow label="format">
              <FormatChip format={normalized.format} />
            </NormalizedRow>
            <NormalizedRow label="native id">
              <Id className="break-all text-[12px]">{normalized.nativeId}</Id>
            </NormalizedRow>
            <NormalizedRow label="cci">
              {normalized.cci ? (
                <Id className="text-[12px]">{normalized.cci}</Id>
              ) : (
                <span className="text-warning">null — not asserted by this format</span>
              )}
            </NormalizedRow>
            <NormalizedRow label="control">
              {normalized.control ? (
                <Id className="text-[12px]">{normalized.control}</Id>
              ) : (
                <span className="text-muted-foreground">null</span>
              )}
            </NormalizedRow>
            <NormalizedRow label="rule">
              {normalized.rule ? (
                <Id className="text-[12px]">{normalized.rule}</Id>
              ) : (
                <span className="text-muted-foreground">null</span>
              )}
            </NormalizedRow>
            <NormalizedRow label="node">{labelNode(normalized.node, nodeName)}</NormalizedRow>
            <NormalizedRow label="severity">
              <span className="flex items-center gap-1.5">
                <Indicator tone={severityToneOf(normalized.severity)}>
                  {normalized.severity}
                </Indicator>
                <Badge size="xs" tone={normalized.clean ? "success" : "neutral"}>
                  {normalized.clean ? "Clean" : "Reportable"}
                </Badge>
              </span>
            </NormalizedRow>
            <NormalizedRow label="title">
              <span className="break-words leading-relaxed">{normalized.title}</span>
            </NormalizedRow>
            <NormalizedRow label="detail">
              <span className="break-words leading-relaxed">{normalized.detail}</span>
            </NormalizedRow>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-subtle px-4 py-3">
        <h3 className="text-[12.5px] font-semibold tracking-[-0.005em]">
          How this row was derived
        </h3>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          Every mapping decision states its own basis. These sentences are the normalizer&rsquo;s,
          not the reviewer&rsquo;s.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-x-8 lg:grid-cols-2">
          <ProseBlock label="Severity basis">{normalized.severityBasis}</ProseBlock>
          <ProseBlock label="Node basis">{normalized.nodeBasis}</ProseBlock>
          {/* The requirement is the third mapping decision, and until now the
              only one that appeared with no stated origin. */}
          <ProseBlock label="CCI basis">{normalized.cciBasis}</ProseBlock>
        </div>
        <div className="mt-1">
          {normalized.unresolved.length > 0 ? (
            <>
              <div className="pt-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-warning">
                Held for an analyst — {normalized.unresolved.length}{" "}
                {normalized.unresolved.length === 1 ? "item" : "items"}
              </div>
              <ul className="mt-1 space-y-1.5">
                {normalized.unresolved.map((u) => (
                  <li key={u} className="flex items-start gap-2">
                    <span className="pt-[7px]">
                      <Dot tone="warning" />
                    </span>
                    <span className="min-w-0 text-[12.5px] leading-relaxed text-foreground">
                      {u}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ProseBlock label="Held for an analyst">
              Nothing. The requirement and the component both resolved, so this row can become a
              finding without a human filling a blank in first.
            </ProseBlock>
          )}
        </div>
      </div>
    </div>
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
      <div className="pt-4">
        <EmptyState
          title="No native records on this run"
          description="The delivered file carried no result rows, so there is nothing to normalize."
        />
      </div>
    );
  }

  const active = rows.find((r) => r.normalized.id === selected) ?? rows[0] ?? null;

  return (
    <div className="space-y-4">
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "168px" }} />
          <col />
          <col style={{ width: "92px" }} />
          <col style={{ width: "104px" }} />
          <col style={{ width: "116px" }} />
          <col style={{ width: "196px" }} />
          <col style={{ width: "112px" }} />
        </colgroup>
        <thead>
          <tr>
            <Table.Header>Native id</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header>Severity</Table.Header>
            <Table.Header>Result</Table.Header>
            <Table.Header>CCI</Table.Header>
            <Table.Header>Component</Table.Header>
            <Table.Header className="text-right">Held</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ normalized }) => (
            <Table.Row
              key={normalized.id}
              className={cn(
                onSelect ? "cursor-pointer" : undefined,
                active && active.normalized.id === normalized.id ? "bg-primary-soft/40" : undefined,
              )}
              onClick={onSelect ? () => onSelect(normalized.id) : undefined}
            >
              <Table.Cell>
                <Id className={cn("truncate", onSelect ? "text-primary" : "text-muted-foreground")}>
                  {normalized.nativeId}
                </Id>
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
                <Badge size="xs" tone={normalized.clean ? "success" : "neutral"}>
                  {normalized.clean ? "Clean" : "Reportable"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {normalized.cci ? (
                  <Id>{normalized.cci}</Id>
                ) : (
                  <span className="text-muted-foreground">Not asserted</span>
                )}
              </Table.Cell>
              <Table.Cell className="truncate">{labelNode(normalized.node, nodeName)}</Table.Cell>
              <Table.Cell className="text-right">
                {normalized.unresolved.length > 0 ? (
                  <Badge size="xs" tone="warning">
                    {normalized.unresolved.length}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>

      {active ? <NormalizationAudit row={active} scan={scan} nodeName={nodeName} /> : null}
    </div>
  );
}

/* ── DedupTable ──────────────────────────────────────────────────────────── */

function FindingChips({ group }: { group: DedupGroup }) {
  if (group.existingAll.length === 0) {
    return (
      <span className="text-muted-foreground">
        {group.primary.clean ? "Coverage only" : "No finding filed"}
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-1">
      {group.existingAll.map((id) => (
        <Badge key={id} size="xs" tone={id === group.existing ? "info" : "neutral"}>
          {id}
        </Badge>
      ))}
    </span>
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
      <div className="pt-4">
        <EmptyState
          title="Nothing to reconcile"
          description="No two results in the program's current scans share a requirement, a component and a rule."
        />
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "204px" }} />
        <col style={{ width: "204px" }} />
        <col />
        <col style={{ width: "84px" }} />
        <col style={{ width: "100px" }} />
        <col style={{ width: "152px" }} />
        <col style={{ width: "168px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Dedup key</Table.Header>
          <Table.Header>Kept from</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header className="text-right">Severity</Table.Header>
          <Table.Header>Result</Table.Header>
          <Table.Header>Folded in</Table.Header>
          <Table.Header>Register</Table.Header>
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => (
          <Table.Row
            key={g.key}
            className={cn(
              onSelect ? "cursor-pointer" : undefined,
              selected === g.key ? "bg-primary-soft/40" : undefined,
            )}
            onClick={onSelect ? () => onSelect(g.key) : undefined}
          >
            <Table.Cell
              className="truncate"
              title={`${g.key} — ${nodeName?.(g.primary.node ?? "") ?? ""}`}
            >
              <Id className={onSelect ? "text-primary" : "text-muted-foreground"}>{g.key}</Id>
            </Table.Cell>
            <Table.Cell className="truncate" title={`${g.primary.format} · ${g.primary.scan}`}>
              <span className="flex min-w-0 items-center gap-1.5">
                <FormatChip format={g.primary.format} />
                <Id>{g.primary.scan}</Id>
              </span>
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
              <Badge size="xs" tone={g.primary.clean ? "success" : "neutral"}>
                {g.primary.clean ? "Clean" : "Reportable"}
              </Badge>
            </Table.Cell>
            <Table.Cell
              className="truncate text-muted-foreground"
              title={g.duplicates.map((d) => `${d.format} — ${d.id}`).join(", ")}
            >
              {g.duplicates.length === 0 ? (
                <span>Sole source</span>
              ) : (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Dot tone="warning" />
                  <span className="min-w-0 truncate">{foldedInLabel(g.duplicates)}</span>
                </span>
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
    <div className="flex min-w-0 items-baseline gap-1.5 py-0.5">
      <Badge size="xs" tone={role === "Primary" ? "info" : "neutral"}>
        {result.format}
      </Badge>
      <Id className="shrink-0 text-muted-foreground">{result.scan}</Id>
      <span className="min-w-0 break-all text-[12px] text-muted-foreground">{result.nativeId}</span>
    </div>
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
      <RailGroup title="Group">
        <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
          <dt className="truncate text-[12.5px] text-muted-foreground">Key</dt>
          <dd className="min-w-0 text-[12.5px] leading-snug">
            <Id className="break-all">{group.key}</Id>
          </dd>
        </div>
        <KeyValue label="Component">{labelNode(group.primary.node, nodeName)}</KeyValue>
        <KeyValue label="Severity">
          <span className="flex items-center gap-1.5">
            <Indicator tone={severityToneOf(group.primary.severity)}>
              {group.primary.severity}
            </Indicator>
            <Badge size="xs" tone={group.primary.clean ? "success" : "neutral"}>
              {group.primary.clean ? "Clean" : "Reportable"}
            </Badge>
          </span>
        </KeyValue>
        <KeyValue label="Sources">
          <span className="tnum">{group.sources.length}</span>
        </KeyValue>
        <ProseBlock label="Condition">{group.primary.title}</ProseBlock>
      </RailGroup>

      <RailGroup title="Reconciliation">
        <div className="pt-0.5">
          <MemberLine result={group.primary} role="Primary" />
          {group.duplicates.map((d) => (
            <MemberLine key={d.id} result={d} role="Duplicate" />
          ))}
        </div>
        <ProseBlock label="Basis">{group.basis}</ProseBlock>
      </RailGroup>

      <RailGroup title="Register">
        <KeyValue label="Filed as">
          {group.existing ? <Id>{group.existing}</Id> : <Dash />}
        </KeyValue>
        <KeyValue label="Also filed">
          {folded.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {folded.map((id) => (
                <Id key={id} className="text-muted-foreground">
                  {id}
                </Id>
              ))}
            </span>
          ) : (
            <Dash />
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
      </RailGroup>
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
    <div className="space-y-3 pt-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {tally.map((t) => (
          <span key={t.state} className="flex items-baseline gap-1.5" title={meaning[t.state]}>
            <Badge size="xs" tone={diffStateTone[t.state]}>
              {t.state}
            </Badge>
            <span className="tnum text-[13px] font-medium">{t.count}</span>
            <span className="text-[12px] text-muted-foreground">{meaning[t.state]}</span>
          </span>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing to compare"
          description={
            previous
              ? `Neither ${previous} nor ${current ?? "this run"} reported a condition that survived normalization.`
              : "This is the first run against this target and format, so there is no prior picture to diff against."
          }
        />
      ) : (
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "116px" }} />
            <col />
            <col style={{ width: "84px" }} />
            <col style={{ width: "196px" }} />
            <col style={{ width: "108px" }} />
            <col style={{ width: "108px" }} />
            <col style={{ width: "88px" }} />
          </colgroup>
          <thead>
            <tr>
              <Table.Header>State</Table.Header>
              <Table.Header>Condition</Table.Header>
              <Table.Header className="text-right">Severity</Table.Header>
              <Table.Header>Component</Table.Header>
              <Table.Header>First seen</Table.Header>
              <Table.Header>Last seen</Table.Header>
              <Table.Header className="text-right">Runs</Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Table.Row key={r.key}>
                <Table.Cell>
                  <Badge size="xs" tone={diffStateTone[r.state]}>
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
                <Table.Cell className="tnum text-right">{r.occurrences}</Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
