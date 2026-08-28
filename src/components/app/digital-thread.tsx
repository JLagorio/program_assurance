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
  Modal,
  Mono,
  Section,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
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
        e.id === id ? { ...e, status: next, reviewer: next === "Accepted" ? "Sarah Chen" : e.reviewer } : e,
      ),
    );
    setOpenEvidence(null);
  }

  function saveRule(next: MappingRule) {
    setRules((prev) =>
      prev.some((r) => r.id === next.id) ? prev.map((r) => (r.id === next.id ? next : r)) : [next, ...prev],
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
                <Th className="w-[60px]">ID</Th>
                <Th className="w-[124px]">Tool</Th>
                <Th className="w-[196px]">Project</Th>
                <Th>Ingest scope</Th>
                <Th className="w-[112px]">Health</Th>
                <Th className="w-[84px] text-right">Ingested</Th>
                <Th className="w-[76px] text-right">Mapped</Th>
                <Th className="w-[96px] text-right">Last sync</Th>
              </tr>
            </thead>
            <tbody>
              {seedConnectors.map((c) => (
                <Tr key={c.id}>
                  <Td className="w-[60px]">
                    <Mono>{c.id}</Mono>
                  </Td>
                  <Td className="w-[124px] font-medium">{c.kind}</Td>
                  <Td className="w-[196px] text-muted-foreground">
                    <Mono>{c.project}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{c.scope}</Td>
                  <Td className="w-[112px]">
                    <span className="flex items-center gap-1.5">
                      <Dot tone={healthTone[c.health]} />
                      {c.health}
                    </span>
                  </Td>
                  <Td className="tnum w-[84px] text-right text-muted-foreground">{c.ingested}</Td>
                  <Td className="tnum w-[76px] text-right text-muted-foreground">{c.mapped}</Td>
                  <Td className="w-[96px] text-right text-muted-foreground">{c.lastSync}</Td>
                </Tr>
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
                <Th className="w-[60px]">Rule</Th>
                <Th className="w-[200px]">Name</Th>
                <Th className="w-[108px]">Source</Th>
                <Th className="w-[128px]">Signal</Th>
                <Th>Match expression</Th>
                <Th className="w-[172px]">Controls</Th>
                <Th className="w-[92px]">Confidence</Th>
                <Th className="w-[64px] text-right">Hits</Th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <Tr key={r.id} onClick={() => setEditingRule(r)} className="cursor-pointer">
                  <Td className="w-[60px]">
                    <Mono>{r.id}</Mono>
                  </Td>
                  <Td className="w-[200px] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Dot tone={r.enabled ? "success" : "neutral"} />
                      <span className="truncate">{r.name}</span>
                    </span>
                  </Td>
                  <Td className="w-[108px] text-muted-foreground">{r.source}</Td>
                  <Td className="w-[128px] text-muted-foreground">{r.signal}</Td>
                  <Td className="text-muted-foreground">
                    <Mono>{r.match}</Mono>
                  </Td>
                  <Td className="w-[172px] text-muted-foreground">
                    <Mono>{r.controls.join(", ")}</Mono>
                  </Td>
                  <Td className="w-[92px]">
                    <Badge
                      tone={
                        r.confidence === "High" ? "success" : r.confidence === "Medium" ? "info" : "warning"
                      }
                    >
                      {r.confidence}
                    </Badge>
                  </Td>
                  <Td className="tnum w-[64px] text-right text-muted-foreground">{r.hits}</Td>
                </Tr>
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
                <Th className="w-[76px]">Evidence</Th>
                <Th className="w-[152px]">Artifact</Th>
                <Th>Title</Th>
                <Th className="w-[80px]">Type</Th>
                <Th className="w-[132px]">Controls</Th>
                <Th className="w-[64px]">Rule</Th>
                <Th className="w-[124px]">Status</Th>
                <Th className="w-[104px]">Engineer</Th>
                <Th className="w-[92px] text-right">Closed</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Tr key={e.id} onClick={() => setOpenEvidence(e)} className="cursor-pointer">
                  <Td className="w-[76px]">
                    <Mono>{e.id}</Mono>
                  </Td>
                  <Td className="w-[152px]">
                    <Mono>{e.ref}</Mono>
                  </Td>
                  <Td className="font-medium">{e.title}</Td>
                  <Td className="w-[80px]">
                    <Badge tone={artifactTone[e.kind]}>{artifactShort[e.kind]}</Badge>
                  </Td>
                  <Td className="w-[132px] text-muted-foreground">
                    <Mono>{e.controls.join(", ")}</Mono>
                  </Td>
                  <Td className="w-[64px] text-muted-foreground">
                    <Mono>{e.rule}</Mono>
                  </Td>
                  <Td className="w-[124px]">
                    <Badge tone={evidenceStatusTone[e.status]}>{e.status}</Badge>
                  </Td>
                  <Td className="w-[104px] text-muted-foreground">{e.engineer}</Td>
                  <Td className="tnum w-[92px] text-right text-muted-foreground">{e.closed}</Td>
                </Tr>
              ))}
              {rows.length === 0 ? (
                <Tr>
                  <Td colSpan={9} className="text-muted-foreground">
                    No evidence matches this filter.
                  </Td>
                </Tr>
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
        <Field label="Match expression" hint="JQL fragment, path glob, commit trailer or stereotype.">
          <Input
            value={draft.match}
            placeholder="sec:mfa OR component = Identity"
            onChange={(e) => setDraft({ ...draft, match: e.target.value })}
          />
        </Field>
        <Field label="Mapped controls" hint="Comma separated NIST SP 800-53 Rev. 5 control IDs.">
          <Input value={controls} placeholder="IA-2, IA-2(1)" onChange={(e) => setControls(e.target.value)} />
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
              <Mono>{evidence.id}</Mono>
            </KeyValue>
            <KeyValue label="Artifact">{evidence.kind}</KeyValue>
            <KeyValue label="Controls">
              <Mono>{evidence.controls.join(", ")}</Mono>
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
            <Select value={evidence.status} onChange={(e) => onStatus(evidence.id, e.target.value as EvidenceStatus)}>
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
            <KeyValue label="Sections">{selected.length} of {sspSections.length}</KeyValue>
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
              All selected sections are review-ready. The package compiles architecture drawings, SysML
              exports and accepted implementation statements into a government-ready SSP.
            </p>
          )}
          {generated ? (
            <p className="mt-3 text-[12.5px] text-success">
              Package built — <Mono>{programId}-CDR-SSP.zip</Mono>
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
              <Th className="w-[34px] pr-0" aria-label="Include" />
              <Th>Section</Th>
              <Th className="w-[76px] text-right">Controls</Th>
              <Th className="w-[76px] text-right">Evidence</Th>
              <Th className="w-[104px]">State</Th>
            </tr>
          </thead>
          <tbody>
            {sspSections.map((s) => (
              <Tr key={s.id}>
                <Td className="w-[34px] overflow-visible pr-0 text-clip">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-[oklch(0.55_0.19_258)]"
                    checked={included.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    aria-label={`Include ${s.name}`}
                  />
                </Td>
                <Td className="font-medium" title={s.description}>
                  {s.name}
                </Td>
                <Td className="tnum w-[76px] text-right text-muted-foreground">{s.controls || "—"}</Td>
                <Td className="tnum w-[76px] text-right text-muted-foreground">{s.evidence}</Td>
                <Td className="w-[104px]">
                  <Badge tone={s.ready ? "success" : "warning"}>{s.ready ? "Ready" : "Gaps"}</Badge>
                </Td>
              </Tr>
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
