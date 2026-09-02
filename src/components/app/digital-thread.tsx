import { useMemo, useState } from "react";
import { Check, Download, Plus, RefreshCw, X } from "lucide-react";

import {
  Badge,
  Button,
  Dot,
  Field,
  Input,
  KeyValue,
  Meter,
  Select,
  Table,
  Textarea,
  Id,
} from "@/ds/primitives";
import { Modal, Section } from "@/ds/patterns";
import {
  artifactShort,
  artifactTone,
  connectorSignals,
  connectors as seedConnectors,
  evidenceStatusTone,
  healthTone,
  mappingRules as seedRules,
  sspSections,
  threadEvidence as seedEvidence,
  type ConnectorKind,
  type EvidenceStatus,
  type MappingRule,
  type MappingRuleSignal,
  type ThreadEvidence,
} from "@/lib/digital-thread";

const statusFilters: ("All" | EvidenceStatus)[] = [
  "All",
  "Auto-mapped",
  "Needs review",
  "Accepted",
  "Rejected",
];

function ruleAsCode(r: {
  id: string;
  name: string;
  source: ConnectorKind;
  signal: MappingRuleSignal;
  match: string;
  controls: string[];
  confidence: string;
}) {
  return [
    `# ${r.id} — control mapping as code`,
    `rule: ${r.name || "untitled"}`,
    `source: ${r.source}`,
    `when:`,
    `  signal: ${r.signal}`,
    `  match: "${r.match}"`,
    `map_to:`,
    ...(r.controls.length ? r.controls.map((c) => `  - nist-800-53:${c}`) : ["  - <no controls>"]),
    `confidence: ${r.confidence.toLowerCase()}`,
    `evidence_type: living-technical`,
  ].join("\n");
}

export function DigitalThreadSection({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const [rules, setRules] = useState<MappingRule[]>(seedRules);
  const [evidence, setEvidence] = useState<ThreadEvidence[]>(seedEvidence);
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [editingRule, setEditingRule] = useState<MappingRule | null>(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [openEvidence, setOpenEvidence] = useState<ThreadEvidence | null>(null);

  const rows = useMemo(
    () => (status === "All" ? evidence : evidence.filter((e) => e.status === status)),
    [evidence, status],
  );

  const pending = evidence.filter(
    (e) => e.status === "Auto-mapped" || e.status === "Needs review",
  ).length;
  const mappedControls = new Set(
    evidence.filter((e) => e.status !== "Rejected").flatMap((e) => e.controls),
  ).size;

  function setEvidenceStatus(id: string, next: EvidenceStatus) {
    setEvidence((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: next, reviewer: next === "Accepted" ? "Sarah Chen" : e.reviewer }
          : e,
      ),
    );
    setOpenEvidence(null);
  }

  function saveRule(next: MappingRule) {
    setRules((prev) =>
      prev.some((r) => r.id === next.id)
        ? prev.map((r) => (r.id === next.id ? next : r))
        : [next, ...prev],
    );
    setEditingRule(null);
    setCreatingRule(false);
  }

  return (
    <>
      <div className="space-y-7">
        {/* ------------------------------------------------------- connectors */}
        <Section
          title="Engineering connectors"
          description={`Live links from ${programName} engineering tooling into the RMF record.`}
          action={
            <>
              <Button variant="secondary">
                <RefreshCw className="size-3.5" /> Sync now
              </Button>
              <Button variant="secondary">
                <Plus className="size-3.5" /> Add connector
              </Button>
            </>
          }
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header className="w-[60px]">ID</Table.Header>
                <Table.Header className="w-[124px]">Tool</Table.Header>
                <Table.Header className="w-[196px]">Project</Table.Header>
                <Table.Header>Ingest scope</Table.Header>
                <Table.Header className="w-[112px]">Health</Table.Header>
                <Table.Header className="w-[84px] text-right">Ingested</Table.Header>
                <Table.Header className="w-[76px] text-right">Mapped</Table.Header>
                <Table.Header className="w-[96px] text-right">Last sync</Table.Header>
              </tr>
            </thead>
            <tbody>
              {seedConnectors.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell className="w-[60px]">
                    <Id>{c.id}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[124px]">{c.kind}</Table.Cell>
                  <Table.Cell className="w-[196px]">
                    <Id>{c.project}</Id>
                  </Table.Cell>
                  <Table.Cell>{c.scope}</Table.Cell>
                  <Table.Cell className="w-[112px]">
                    <span className="flex items-center gap-1.5">
                      <Dot tone={healthTone[c.health]} />
                      {c.health}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="tnum w-[84px] text-right">{c.ingested}</Table.Cell>
                  <Table.Cell className="tnum w-[76px] text-right">{c.mapped}</Table.Cell>
                  <Table.Cell className="w-[96px] text-right">{c.lastSync}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* ------------------------------------------------- mapping as code */}
        <Section
          title="Control mapping as code"
          description="Rules that convert closed tickets, merged code and model elements into living technical evidence."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setCreatingRule(true);
                setEditingRule({
                  id: `MR-${String(rules.length + 1).padStart(2, "0")}`,
                  name: "",
                  source: "Jira",
                  signal: "Label",
                  match: "",
                  controls: [],
                  confidence: "Medium",
                  enabled: true,
                  hits: 0,
                  owner: "Sarah Chen (SSE)",
                });
              }}
            >
              <Plus className="size-3.5" /> New rule
            </Button>
          }
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header className="w-[60px]">Rule</Table.Header>
                <Table.Header className="w-[200px]">Name</Table.Header>
                <Table.Header className="w-[108px]">Source</Table.Header>
                <Table.Header className="w-[128px]">Signal</Table.Header>
                <Table.Header>Match expression</Table.Header>
                <Table.Header className="w-[172px]">Controls</Table.Header>
                <Table.Header className="w-[92px]">Confidence</Table.Header>
                <Table.Header className="w-[64px] text-right">Hits</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <Table.Row key={r.id} onClick={() => setEditingRule(r)} className="cursor-pointer">
                  <Table.Cell className="w-[60px]">
                    <Id>{r.id}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[200px]">
                    <span className="flex items-center gap-1.5">
                      <Dot tone={r.enabled ? "success" : "neutral"} />
                      <span className="truncate">{r.name}</span>
                    </span>
                  </Table.Cell>
                  <Table.Cell className="w-[108px]">{r.source}</Table.Cell>
                  <Table.Cell className="w-[128px]">{r.signal}</Table.Cell>
                  <Table.Cell>
                    <Id>{r.match}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[172px]">
                    <Id>{r.controls.join(", ")}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[92px]">
                    <Badge
                      tone={
                        r.confidence === "High"
                          ? "success"
                          : r.confidence === "Medium"
                            ? "info"
                            : "warning"
                      }
                    >
                      {r.confidence}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="tnum w-[64px] text-right">{r.hits}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* --------------------------------------------------- evidence flow */}
        <Section
          title="Living technical evidence"
          description={`${mappedControls} controls carry engineering evidence · ${pending} artifacts awaiting security-engineer acceptance.`}
          action={
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusFilters)[number])}
              className="h-7 w-[152px]"
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </Select>
          }
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header className="w-[76px]">Evidence</Table.Header>
                <Table.Header className="w-[152px]">Artifact</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header className="w-[80px]">Type</Table.Header>
                <Table.Header className="w-[132px]">Controls</Table.Header>
                <Table.Header className="w-[64px]">Rule</Table.Header>
                <Table.Header className="w-[124px]">Status</Table.Header>
                <Table.Header className="w-[104px]">Engineer</Table.Header>
                <Table.Header className="w-[92px] text-right">Closed</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Table.Row key={e.id} onClick={() => setOpenEvidence(e)} className="cursor-pointer">
                  <Table.Cell className="w-[76px]">
                    <Id>{e.id}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[152px]">
                    <Id>{e.ref}</Id>
                  </Table.Cell>
                  <Table.Cell>{e.title}</Table.Cell>
                  <Table.Cell className="w-[80px]">
                    <Badge tone={artifactTone[e.kind]}>{artifactShort[e.kind]}</Badge>
                  </Table.Cell>
                  <Table.Cell className="w-[132px]">
                    <Id>{e.controls.join(", ")}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[64px]">
                    <Id>{e.rule}</Id>
                  </Table.Cell>
                  <Table.Cell className="w-[124px]">
                    <Badge tone={evidenceStatusTone[e.status]}>{e.status}</Badge>
                  </Table.Cell>
                  <Table.Cell className="w-[104px]">{e.engineer}</Table.Cell>
                  <Table.Cell className="tnum w-[92px] text-right">{e.closed}</Table.Cell>
                </Table.Row>
              ))}
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={9}>No evidence matches this filter.</Table.Cell>
                </Table.Row>
              ) : null}
            </tbody>
          </Table>
        </Section>
      </div>

      <RuleModal
        rule={editingRule}
        creating={creatingRule}
        onClose={() => {
          setEditingRule(null);
          setCreatingRule(false);
        }}
        onSave={saveRule}
      />

      <EvidenceModal
        evidence={openEvidence}
        programId={programId}
        onClose={() => setOpenEvidence(null)}
        onStatus={setEvidenceStatus}
      />
    </>
  );
}

/* ------------------------------------------------------------- rule editor */

function RuleModal({
  rule,
  creating,
  onClose,
  onSave,
}: {
  rule: MappingRule | null;
  creating: boolean;
  onClose: () => void;
  onSave: (r: MappingRule) => void;
}) {
  const [draft, setDraft] = useState<MappingRule | null>(rule);
  const [controls, setControls] = useState(rule?.controls.join(", ") ?? "");

  if (rule && draft?.id !== rule.id) {
    setDraft(rule);
    setControls(rule.controls.join(", "));
  }
  if (!rule || !draft) return null;

  const parsed = controls
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={creating ? "New mapping rule" : `${rule.id} — ${rule.name}`}
      description="Signals from engineering tools become NIST SP 800-53 evidence automatically."
      aside={
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Rule as code
          </p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11.5px] leading-[1.6] text-muted-foreground">
            {ruleAsCode({ ...draft, controls: parsed })}
          </pre>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave({ ...draft, controls: parsed })}>
            {creating ? "Create rule" : "Save rule"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Rule name">
          <Input
            value={draft.name}
            placeholder="Multifactor authentication"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source tool">
            <Select
              value={draft.source}
              onChange={(e) => {
                const source = e.target.value as ConnectorKind;
                setDraft({ ...draft, source, signal: connectorSignals[source][0] ?? "Label" });
              }}
            >
              {(Object.keys(connectorSignals) as ConnectorKind[]).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Signal">
            <Select
              value={draft.signal}
              onChange={(e) => setDraft({ ...draft, signal: e.target.value as MappingRuleSignal })}
            >
              {connectorSignals[draft.source].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Match expression"
          hint="JQL fragment, path glob, commit trailer or stereotype."
        >
          <Input
            value={draft.match}
            placeholder="sec:mfa OR component = Identity"
            onChange={(e) => setDraft({ ...draft, match: e.target.value })}
          />
        </Field>
        <Field label="Mapped controls" hint="Comma separated NIST SP 800-53 Rev. 5 control IDs.">
          <Input
            value={controls}
            placeholder="IA-2, IA-2(1)"
            onChange={(e) => setControls(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Confidence">
            <Select
              value={draft.confidence}
              onChange={(e) =>
                setDraft({ ...draft, confidence: e.target.value as MappingRule["confidence"] })
              }
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Select>
          </Field>
          <Field label="State">
            <Select
              value={draft.enabled ? "Enabled" : "Disabled"}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.value === "Enabled" })}
            >
              <option>Enabled</option>
              <option>Disabled</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------- evidence review */

function EvidenceModal({
  evidence,
  programId,
  onClose,
  onStatus,
}: {
  evidence: ThreadEvidence | null;
  programId: string;
  onClose: () => void;
  onStatus: (id: string, next: EvidenceStatus) => void;
}) {
  const [statement, setStatement] = useState(evidence?.statement ?? "");
  if (evidence && statement !== undefined && evidence.statement && statement === "") {
    setStatement(evidence.statement);
  }
  if (!evidence) return null;

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={evidence.title}
      description={`${evidence.ref} · ${programId} · rule ${evidence.rule}`}
      aside={
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Thread detail
          </p>
          <div className="mt-2">
            <KeyValue label="Evidence">
              <Id>{evidence.id}</Id>
            </KeyValue>
            <KeyValue label="Artifact">{evidence.kind}</KeyValue>
            <KeyValue label="Controls">
              <Id>{evidence.controls.join(", ")}</Id>
            </KeyValue>
            <KeyValue label="Engineer">{evidence.engineer}</KeyValue>
            <KeyValue label="Reviewer">{evidence.reviewer ?? "—"}</KeyValue>
            <KeyValue label="Closed">{evidence.closed}</KeyValue>
          </div>
          <p className="mt-3 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {evidence.narrative}
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => onStatus(evidence.id, "Rejected")}>
            <X className="size-3.5" /> Reject
          </Button>
          <Button variant="primary" onClick={() => onStatus(evidence.id, "Accepted")}>
            <Check className="size-3.5" /> Accept into SSP
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field
          label="Generated implementation statement"
          hint="Drafted from the artifact and edited by the product security engineer before it enters the SSP."
        >
          <Textarea
            rows={5}
            value={statement || evidence.statement}
            onChange={(e) => setStatement(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select
              value={evidence.status}
              onChange={(e) => onStatus(evidence.id, e.target.value as EvidenceStatus)}
            >
              <option>Auto-mapped</option>
              <option>Needs review</option>
              <option>Accepted</option>
              <option>Rejected</option>
            </Select>
          </Field>
          <Field label="Reviewer">
            <Input defaultValue={evidence.reviewer ?? "Sarah Chen"} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------- CDR package generator */

export function CdrPackageModal({
  open,
  onClose,
  programId,
  programName,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
}) {
  const [included, setIncluded] = useState<string[]>(sspSections.map((s) => s.id));
  const [format, setFormat] = useState("OSCAL SSP (JSON) + PDF");
  const [generated, setGenerated] = useState(false);

  const selected = sspSections.filter((s) => included.includes(s.id));
  const controls = selected.reduce((n, s) => n + s.controls, 0);
  const artifacts = selected.reduce((n, s) => n + s.evidence, 0);
  const blockers = selected.filter((s) => !s.ready);
  const readiness = Math.round(
    (selected.filter((s) => s.ready).length / Math.max(selected.length, 1)) * 100,
  );

  function toggle(id: string) {
    setGenerated(false);
    setIncluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title="Generate CDR package"
      description={`${programName} · ${programId} · Critical Design Review submission`}
      aside={
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Package summary
          </p>
          <div className="mt-2">
            <KeyValue label="Sections">
              {selected.length} of {sspSections.length}
            </KeyValue>
            <KeyValue label="Controls">{controls}</KeyValue>
            <KeyValue label="Artifacts">{artifacts}</KeyValue>
            <KeyValue label="Format">{format}</KeyValue>
            <KeyValue label="Readiness">
              <span className="flex items-center gap-2">
                <span className="w-14">
                  <Meter value={readiness} tone={readiness === 100 ? "success" : "warning"} />
                </span>
                <span className="tnum">{readiness}%</span>
              </span>
            </KeyValue>
          </div>
          {blockers.length ? (
            <p className="mt-3 border-t border-border pt-3 text-[12.5px] leading-relaxed text-warning">
              {blockers.map((b) => b.blocker).join(" · ")}
            </p>
          ) : (
            <p className="mt-3 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              All selected sections are review-ready. The package compiles architecture drawings,
              SysML exports and accepted implementation statements into a government-ready SSP.
            </p>
          )}
          {generated ? (
            <p className="mt-3 text-[12.5px] text-success">
              Package built — <Id>{programId}-CDR-SSP.zip</Id>
            </p>
          ) : null}
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setGenerated(true)}>
            <Download className="size-3.5" /> {generated ? "Download package" : "Generate package"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header className="w-[34px] pr-0" aria-label="Include" />
              <Table.Header>Section</Table.Header>
              <Table.Header className="w-[76px] text-right">Controls</Table.Header>
              <Table.Header className="w-[76px] text-right">Evidence</Table.Header>
              <Table.Header className="w-[104px]">State</Table.Header>
            </tr>
          </thead>
          <tbody>
            {sspSections.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell className="w-[34px] overflow-visible pr-0 text-clip">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-[oklch(0.55_0.19_258)]"
                    checked={included.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    aria-label={`Include ${s.name}`}
                  />
                </Table.Cell>
                <Table.Cell title={s.description}>{s.name}</Table.Cell>
                <Table.Cell className="tnum w-[76px] text-right">{s.controls || "—"}</Table.Cell>
                <Table.Cell className="tnum w-[76px] text-right">{s.evidence}</Table.Cell>
                <Table.Cell className="w-[104px]">
                  <Badge tone={s.ready ? "success" : "warning"}>{s.ready ? "Ready" : "Gaps"}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Output format">
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>OSCAL SSP (JSON) + PDF</option>
              <option>OSCAL SSP (XML)</option>
              <option>eMASS import bundle</option>
              <option>PDF only</option>
            </Select>
          </Field>
          <Field label="Review gate">
            <Select defaultValue="CDR — Critical Design Review">
              <option>PDR — Preliminary Design Review</option>
              <option>CDR — Critical Design Review</option>
              <option>TRR — Test Readiness Review</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
