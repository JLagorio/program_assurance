import { useMemo, useState } from "react";
import { Check, Download, Plus, RefreshCw, X } from "lucide-react";

import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Dialog,
  Dot,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  KeyValue,
  NativeSelect,
  Progress,
  Section,
  Select,
  Stack,
  Table,
  Textarea,
  toast,
  useRequired,
} from "@ledger/design-system";
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
      <Stack space="space.300">
        {/* ------------------------------------------------------- connectors */}
        <Section
          title="Engineering connectors"
          description={`Live links from ${programName} engineering tooling into the RMF record.`}
          action={
            <>
              <Button variant="secondary">
                <RefreshCw className="size-icon-small" /> Sync now
              </Button>
              <Button variant="secondary">
                <Plus className="size-icon-small" /> Add connector
              </Button>
            </>
          }
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={60}>ID</Table.Header>
                <Table.Header width={124}>Tool</Table.Header>
                <Table.Header width={196}>Project</Table.Header>
                <Table.Header>Ingest scope</Table.Header>
                <Table.Header width={112}>Health</Table.Header>
                <Table.Header className="text-right" width={84}>
                  Ingested
                </Table.Header>
                <Table.Header className="text-right" width={76}>
                  Mapped
                </Table.Header>
                <Table.Header className="text-right" width={96}>
                  Last sync
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {seedConnectors.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell width={60}>
                    <Id>{c.id}</Id>
                  </Table.Cell>
                  <Table.Cell width={124}>{c.kind}</Table.Cell>
                  <Table.Cell width={196}>
                    <Id>{c.project}</Id>
                  </Table.Cell>
                  <Table.Cell>{c.scope}</Table.Cell>
                  <Table.Cell width={112}>
                    <Inline as="span" space="space.075" alignBlock="center">
                      <Dot tone={healthTone[c.health]} />
                      {c.health}
                    </Inline>
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right" width={84}>
                    {c.ingested}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right" width={76}>
                    {c.mapped}
                  </Table.Cell>
                  <Table.Cell className="text-right" width={96}>
                    {c.lastSync}
                  </Table.Cell>
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
              <Plus className="size-icon-small" /> New rule
            </Button>
          }
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={60}>Rule</Table.Header>
                <Table.Header width={200}>Name</Table.Header>
                <Table.Header width={108}>Source</Table.Header>
                <Table.Header width={128}>Signal</Table.Header>
                <Table.Header>Match expression</Table.Header>
                <Table.Header width={172}>Controls</Table.Header>
                <Table.Header width={92}>Confidence</Table.Header>
                <Table.Header className="text-right" width={64}>
                  Hits
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <Table.Row key={r.id} onClick={() => setEditingRule(r)} className="cursor-pointer">
                  <Table.Cell width={60}>
                    <Id>{r.id}</Id>
                  </Table.Cell>
                  <Table.Cell width={200}>
                    <Inline as="span" space="space.075" alignBlock="center">
                      <Dot tone={r.enabled ? "success" : "neutral"} />
                      <span className="truncate">{r.name}</span>
                    </Inline>
                  </Table.Cell>
                  <Table.Cell width={108}>{r.source}</Table.Cell>
                  <Table.Cell width={128}>{r.signal}</Table.Cell>
                  <Table.Cell>
                    <Id>{r.match}</Id>
                  </Table.Cell>
                  <Table.Cell width={172}>
                    <Id>{r.controls.join(", ")}</Id>
                  </Table.Cell>
                  <Table.Cell width={92}>
                    <Badge
                      tone={
                        r.confidence === "High"
                          ? "success"
                          : r.confidence === "Medium"
                            ? "information"
                            : "warning"
                      }
                    >
                      {r.confidence}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right" width={64}>
                    {r.hits}
                  </Table.Cell>
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
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusFilters)[number])}
              className="h-control-small"
              style={{ width: 152 }}
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </NativeSelect>
          }
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={76}>Evidence</Table.Header>
                <Table.Header width={152}>Artifact</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header width={80}>Type</Table.Header>
                <Table.Header width={132}>Controls</Table.Header>
                <Table.Header width={64}>Rule</Table.Header>
                <Table.Header width={124}>Status</Table.Header>
                <Table.Header width={104}>Engineer</Table.Header>
                <Table.Header className="text-right" width={92}>
                  Closed
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <Table.Row key={e.id} onClick={() => setOpenEvidence(e)} className="cursor-pointer">
                  <Table.Cell width={76}>
                    <Id>{e.id}</Id>
                  </Table.Cell>
                  <Table.Cell width={152}>
                    <Id>{e.ref}</Id>
                  </Table.Cell>
                  <Table.Cell>{e.title}</Table.Cell>
                  <Table.Cell width={80}>
                    <Badge tone={artifactTone[e.kind]}>{artifactShort[e.kind]}</Badge>
                  </Table.Cell>
                  <Table.Cell width={132}>
                    <Id>{e.controls.join(", ")}</Id>
                  </Table.Cell>
                  <Table.Cell width={64}>
                    <Id>{e.rule}</Id>
                  </Table.Cell>
                  <Table.Cell width={124}>
                    <Badge tone={evidenceStatusTone[e.status]}>{e.status}</Badge>
                  </Table.Cell>
                  <Table.Cell width={104}>{e.engineer}</Table.Cell>
                  <Table.Cell className="tabular-nums text-right" width={92}>
                    {e.closed}
                  </Table.Cell>
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
      </Stack>

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
  const req = useRequired({ name: draft?.name, signal: draft?.signal, controls });

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
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={creating ? "New mapping rule" : `${rule.id} — ${rule.name}`}
      description="Signals from engineering tools become NIST SP 800-53 evidence automatically."
      aside={
        <div>
          <p className="font-heading-xxsmall uppercase text-subtle">Rule as code</p>
          <pre className="pt-100 whitespace-pre-wrap font-code font-body-xsmall text-subtle">
            {ruleAsCode({ ...draft, controls: parsed })}
          </pre>
        </div>
      }
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!req.check()) return;
              onSave({ ...draft, controls: parsed });
            }}
          >
            {creating ? "Create rule" : "Save rule"}
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field isRequired error={req.errorFor("name")} label="Rule name">
          <Input
            value={draft.name}
            placeholder="Multifactor authentication"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Source tool">
            <NativeSelect
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
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("signal")} label="Signal">
            <NativeSelect
              value={draft.signal}
              onChange={(e) => setDraft({ ...draft, signal: e.target.value as MappingRuleSignal })}
            >
              {connectorSignals[draft.source].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </Grid>
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
        <Field
          isRequired
          error={req.errorFor("controls")}
          label="Mapped controls"
          hint="Comma separated NIST SP 800-53 Rev. 5 control IDs."
        >
          <Input
            value={controls}
            placeholder="IA-2, IA-2(1)"
            onChange={(e) => setControls(e.target.value)}
          />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Confidence">
            <NativeSelect
              value={draft.confidence}
              onChange={(e) =>
                setDraft({ ...draft, confidence: e.target.value as MappingRule["confidence"] })
              }
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </NativeSelect>
          </Field>
          <Field label="State">
            <NativeSelect
              value={draft.enabled ? "Enabled" : "Disabled"}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.value === "Enabled" })}
            >
              <option>Enabled</option>
              <option>Disabled</option>
            </NativeSelect>
          </Field>
        </Grid>
      </Stack>
    </Dialog>
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
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={evidence.title}
      description={`${evidence.ref} · ${programId} · rule ${evidence.rule}`}
      aside={
        <div>
          <p className="font-heading-xxsmall uppercase text-subtle">Thread detail</p>
          <Box paddingBlockStart="space.100">
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
          </Box>
          <p className="pt-150 border-t border-default font-body-small text-subtle">
            {evidence.narrative}
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => onStatus(evidence.id, "Rejected")}>
            <X className="size-icon-small" /> Reject
          </Button>
          <Button variant="primary" onClick={() => onStatus(evidence.id, "Accepted")}>
            <Check className="size-icon-small" /> Accept into SSP
          </Button>
        </>
      }
    >
      <Stack space="space.150">
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
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Status">
            <NativeSelect
              value={evidence.status}
              onChange={(e) => onStatus(evidence.id, e.target.value as EvidenceStatus)}
            >
              <option>Auto-mapped</option>
              <option>Needs review</option>
              <option>Accepted</option>
              <option>Rejected</option>
            </NativeSelect>
          </Field>
          <Field label="Reviewer">
            <Input defaultValue={evidence.reviewer ?? "Sarah Chen"} />
          </Field>
        </Grid>
      </Stack>
    </Dialog>
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
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

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
    <>
      <Dialog
        open={open}
        onClose={onClose}
        width="large"
        title="Generate CDR package"
        description={`${programName} · ${programId} · Critical Design Review submission`}
        aside={
          <div>
            <p className="font-heading-xxsmall uppercase text-subtle">Package summary</p>
            <Box paddingBlockStart="space.100">
              <KeyValue label="Sections">
                {selected.length} of {sspSections.length}
              </KeyValue>
              <KeyValue label="Controls">{controls}</KeyValue>
              <KeyValue label="Artifacts">{artifacts}</KeyValue>
              <KeyValue label="Format">{format}</KeyValue>
              <KeyValue label="Readiness">
                <Inline as="span" space="space.100" alignBlock="center">
                  <span className="w-600">
                    <Progress value={readiness} tone={readiness === 100 ? "success" : "warning"} />
                  </span>
                  <span className="tabular-nums">{readiness}%</span>
                </Inline>
              </KeyValue>
            </Box>
            {blockers.length ? (
              <p className="pt-150 border-t border-default font-body-small text-warning">
                {blockers.map((b) => b.blocker).join(" · ")}
              </p>
            ) : (
              <p className="pt-150 border-t border-default font-body-small text-subtle">
                All selected sections are review-ready. The package compiles architecture drawings,
                SysML exports and accepted implementation statements into a government-ready SSP.
              </p>
            )}
            {generated ? (
              <p className="pt-150 font-body-small text-success">
                Package built — <Id>{programId}-CDR-SSP.zip</Id>
              </p>
            ) : null}
          </div>
        }
        footer={
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (generated)
                  toast.info("Download started", { description: `${programId}-CDR-SSP.zip` });
                else setConfirming(true);
              }}
            >
              <Download className="size-icon-small" />{" "}
              {generated ? "Download package" : "Generate package"}
            </Button>
          </>
        }
      >
        <Stack space="space.150">
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Selection
                  header
                  checked={
                    included.length > 0 && included.length === sspSections.length
                      ? true
                      : included.length > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(next) => setIncluded(next ? sspSections.map((s) => s.id) : [])}
                  label="Include all sections"
                />
                <Table.Header>Section</Table.Header>
                <Table.Header className="text-right" width={76}>
                  Controls
                </Table.Header>
                <Table.Header className="text-right" width={76}>
                  Evidence
                </Table.Header>
                <Table.Header width={104}>State</Table.Header>
              </tr>
            </thead>
            <tbody>
              {sspSections.map((s) => (
                <Table.Row key={s.id}>
                  <Table.Selection
                    checked={included.includes(s.id)}
                    onCheckedChange={() => toggle(s.id)}
                    label={`Include ${s.name}`}
                  />
                  <Table.Cell title={s.description}>{s.name}</Table.Cell>
                  <Table.Cell className="tabular-nums text-right" width={76}>
                    {s.controls || "—"}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right" width={76}>
                    {s.evidence}
                  </Table.Cell>
                  <Table.Cell width={104}>
                    <Badge tone={s.ready ? "success" : "warning"}>
                      {s.ready ? "Ready" : "Gaps"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
          <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
            <Field label="Output format">
              <Select value={format} onValueChange={setFormat} aria-label="Output format">
                {[
                  "OSCAL SSP (JSON) + PDF",
                  "OSCAL SSP (XML)",
                  "eMASS import bundle",
                  "PDF only",
                ].map((f) => (
                  <Select.Item key={f} value={f}>
                    {f}
                  </Select.Item>
                ))}
              </Select>
            </Field>
            <Field label="Review gate">
              <Select defaultValue="CDR — Critical Design Review" aria-label="Review gate">
                {[
                  "PDR — Preliminary Design Review",
                  "CDR — Critical Design Review",
                  "TRR — Test Readiness Review",
                ].map((g) => (
                  <Select.Item key={g} value={g}>
                    {g}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </Grid>
        </Stack>
      </Dialog>
      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setPending(true);
          window.setTimeout(() => {
            setPending(false);
            setConfirming(false);
            setGenerated(true);
            toast.success("CDR package built", {
              description: `${programId}-CDR-SSP.zip · ${controls} controls · ${artifacts} artifacts`,
            });
          }, 900);
        }}
        pending={pending}
        title="Generate and sign the CDR package?"
        description={`${selected.length} of ${sspSections.length} sections as ${format}. The package is hashed and logged against ${programId}; a section left out needs a waiver at the gate.`}
        confirmLabel="Generate package"
      />
    </>
  );
}
