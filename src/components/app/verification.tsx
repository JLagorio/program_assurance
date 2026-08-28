import { useMemo, useState } from "react";
import { AlertTriangle, Check, Plus, RefreshCw, Upload } from "lucide-react";

import {
  Badge,
  Button,
  Dot,
  Field,
  FilterChip,
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
  findings as seedFindings,
  findingStatusTone,
  iatt,
  ingestTone,
  scaChecks,
  scanIngests as seedIngests,
  severityTone,
  sourceShort,
  testEvents,
  testStatusTone,
  verdictTone,
  type Finding,
  type FindingStatus,
  type ScanIngest,
  type ScanSource,
  type Severity,
} from "@/lib/verification";

const severityFilters: ("All" | Severity)[] = ["All", "CAT I", "CAT II", "CAT III"];
const findingStatuses: FindingStatus[] = [
  "Open",
  "Mitigating",
  "Risk accepted",
  "Closed",
  "False positive",
];
const sources: ScanSource[] = ["STIG Viewer", "ACAS / Nessus", "SonarQube", "Manual statement"];

const day = 86_400_000;
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / day);
}
function shortDate(value: string) {
  if (value === "—") return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleString("en-US", { month: "short", day: "2-digit" })} '${String(
    d.getFullYear(),
  ).slice(2)}`;
}

function shortStamp(value: string) {
  const m = value.match(/^(.+\d{4})\s+(\d{2}:\d{2})$/);
  if (!m) return value;
  return `${shortDate(m[1]!)} ${m[2]}`;
}

export function VerificationSection({ programName }: { programName: string }) {
  const [ingests, setIngests] = useState<ScanIngest[]>(seedIngests);
  const [items, setItems] = useState<Finding[]>(seedFindings);
  const [severity, setSeverity] = useState<(typeof severityFilters)[number]>("All");
  const [openFinding, setOpenFinding] = useState<Finding | null>(null);
  const [ingesting, setIngesting] = useState(false);

  const rows = useMemo(
    () => (severity === "All" ? items : items.filter((f) => f.severity === severity)),
    [items, severity],
  );

  const openCatI = items.filter(
    (f) => f.severity === "CAT I" && (f.status === "Open" || f.status === "Mitigating"),
  );
  const blocking = scaChecks.filter((c) => c.verdict === "Fail").length;
  const atRisk = scaChecks.filter((c) => c.verdict === "At risk").length;
  const passing = scaChecks.filter((c) => c.verdict === "Pass").length;
  const readiness = Math.round((passing / scaChecks.length) * 100);

  function saveFinding(next: Finding) {
    setItems((prev) => prev.map((f) => (f.id === next.id ? next : f)));
    setOpenFinding(null);
  }

  function addIngest(next: ScanIngest) {
    setIngests((prev) => [next, ...prev]);
    setIngesting(false);
  }

  return (
    <>
      <div className="space-y-7">
        {/* ------------------------------------------------- SCA simulation */}
        <Section
          title="SCA simulation"
          description={`How the government Security Control Assessor sees ${programName} today, ahead of the official audit.`}
          action={
            <Button variant="secondary">
              <RefreshCw className="size-3.5" /> Re-run simulation
            </Button>
          }
        >
          <div
            className={
              blocking > 0
                ? "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger/[0.04] px-3.5 py-2.5"
                : "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-subtle px-3.5 py-2.5"
            }
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <AlertTriangle className="mt-px size-4 shrink-0 text-danger" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">
                  {blocking > 0
                    ? `${openCatI.length} CAT I findings will block IATT at TRR`
                    : "No blocking findings — IATT package is clean"}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {blocking} failing check{blocking === 1 ? "" : "s"} · {atRisk} at risk ·{" "}
                  {passing} of {scaChecks.length} passing. TRR is{" "}
                  {daysBetween("Aug 27, 2026", "Sep 18, 2026")} days out.
                </p>
              </div>
            </div>
            <div className="flex w-[180px] shrink-0 items-center gap-2">
              <Meter value={readiness} tone={blocking > 0 ? "danger" : "success"} />
              <span className="tabular-nums text-[12.5px] text-muted-foreground">
                {readiness}%
              </span>
            </div>
          </div>

          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "76px" }} />
              <col />
              <col style={{ width: "104px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "212px" }} />
              <col style={{ width: "148px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Check</Th>
                <Th>Requirement</Th>
                <Th>Verdict</Th>
                <Th>Gate</Th>
                <Th>Assessor note</Th>
                <Th>Evidence</Th>
              </tr>
            </thead>
            <tbody>
              {scaChecks.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Mono>{c.id}</Mono>
                  </Td>
                  <Td>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground"> — {c.requirement}</span>
                  </Td>
                  <Td>
                    <Badge tone={verdictTone[c.verdict]}>{c.verdict}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">{c.gate}</Td>
                  <Td className="text-muted-foreground">{c.finding}</Td>
                  <Td className="text-muted-foreground">{c.evidence}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* ------------------------------------------------------ IATT clock */}
        <Section
          title="IATT window & test schedule"
          description="Test events matched against the interim authority to test validity period."
          action={
            <Button variant="secondary">
              <Plus className="size-3.5" /> Add test event
            </Button>
          }
        >
          <dl className="mt-3 grid gap-x-8 gap-y-3 border-b border-border pb-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "IATT status", value: (<span className="inline-flex items-center gap-1.5"><Dot tone="warning" /> {iatt.status}</span>) },
              { label: "Requested", value: iatt.requested },
              { label: "Decision target", value: iatt.decisionTarget },
              { label: "Effective", value: iatt.effective },
              { label: "Expires", value: <span className="text-danger">{iatt.expires}</span> },
              { label: "Authorizing official", value: iatt.authorizing },
            ].map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="truncate text-[12px] text-muted-foreground">{f.label}</dt>
                <dd className="mt-0.5 truncate text-[12.5px] font-medium tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>

          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "72px" }} />
              <col />
              <col style={{ width: "168px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "112px" }} />
              <col style={{ width: "180px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Test activity</Th>
                <Th>Range</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Status</Th>
                <Th>Against IATT</Th>
              </tr>
            </thead>
            <tbody>
              {testEvents.map((e) => {
                const slack = daysBetween(e.end, iatt.expires);
                return (
                  <Tr key={e.id}>
                    <Td>
                      <Mono>{e.id}</Mono>
                    </Td>
                    <Td className="font-medium">{e.name}</Td>
                    <Td className="text-muted-foreground">{e.range}</Td>
                    <Td className="tabular-nums text-muted-foreground">{shortDate(e.start)}</Td>
                    <Td className="tabular-nums text-muted-foreground">{shortDate(e.end)}</Td>
                    <Td>
                      <Badge tone={testStatusTone[e.status]}>{e.status}</Badge>
                    </Td>
                    <Td className={slack < 0 ? "text-danger" : "text-muted-foreground"}>
                      {slack < 0
                        ? `${Math.abs(slack)}d past expiry`
                        : `${slack}d slack · ${e.requires}`}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Section>

        {/* --------------------------------------------------------- ingests */}
        <Section
          title="Ingested assessment data"
          description="STIG CKL, ACAS / Nessus, SonarQube and manual implementation statements."
          action={
            <Button variant="secondary" onClick={() => setIngesting(true)}>
              <Upload className="size-3.5" /> Ingest scan
            </Button>
          }
        >
          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "92px" }} />
              <col style={{ width: "84px" }} />
              <col />
              <col style={{ width: "152px" }} />
              <col style={{ width: "132px" }} />
              <col style={{ width: "88px" }} />
              <col style={{ width: "148px" }} />
              <col style={{ width: "96px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Source</Th>
                <Th>Artifact</Th>
                <Th>Asset</Th>
                <Th>Ingested</Th>
                <Th>Status</Th>
                <Th className="text-right">CAT I / II / III</Th>
                <Th className="text-right">Coverage</Th>
              </tr>
            </thead>
            <tbody>
              {ingests.map((i) => (
                <Tr key={i.id}>
                  <Td>
                    <Mono>{i.id}</Mono>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{sourceShort[i.source]}</Badge>
                  </Td>
                  <Td className="font-medium">{i.artifact}</Td>
                  <Td className="text-muted-foreground">{i.asset}</Td>
                  <Td className="tabular-nums text-muted-foreground">{shortStamp(i.ingested)}</Td>
                  <Td>
                    <Badge tone={ingestTone[i.status]}>{i.status}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums">
                    <span className={i.catI > 0 ? "font-medium text-danger" : "text-muted-foreground"}>
                      {i.catI}
                    </span>
                    <span className="text-border"> / </span>
                    <span className="text-muted-foreground">{i.catII}</span>
                    <span className="text-border"> / </span>
                    <span className="text-muted-foreground">{i.catIII}</span>
                  </Td>
                  <Td className="text-right tabular-nums text-muted-foreground">{i.coverage}%</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* -------------------------------------------------------- findings */}
        <Section
          title="Aggregated findings"
          description="Deduplicated across scan sources and mapped to NIST 800-53 controls."
          action={
            <div className="flex items-center gap-1.5">
              {severityFilters.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  value={String(
                    s === "All" ? items.length : items.filter((f) => f.severity === s).length,
                  )}
                  active={severity === s}
                  onClick={() => setSeverity(s)}
                />
              ))}
            </div>
          }
        >
          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "124px" }} />
              <col style={{ width: "76px" }} />
              <col />
              <col style={{ width: "72px" }} />
              <col style={{ width: "136px" }} />
              <col style={{ width: "124px" }} />
              <col style={{ width: "56px" }} />
              <col style={{ width: "92px" }} />
              <col style={{ width: "104px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Source</Th>
                <Th>Finding</Th>
                <Th>Control</Th>
                <Th>Asset</Th>
                <Th>Status</Th>
                <Th className="text-right">Age</Th>
                <Th>Due</Th>
                <Th>Owner</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <Tr
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => setOpenFinding(f)}
                >
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <Dot tone={severityTone[f.severity]} />
                      <Mono>{f.ref}</Mono>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{sourceShort[f.source]}</Badge>
                  </Td>
                  <Td className="font-medium">{f.title}</Td>
                  <Td>
                    <Mono>{f.control}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{f.asset}</Td>
                  <Td>
                    <Badge tone={findingStatusTone[f.status]}>{f.status}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums text-muted-foreground">{f.age}d</Td>
                  <Td className="tabular-nums text-muted-foreground">{shortDate(f.due)}</Td>
                  <Td className="text-muted-foreground">{f.owner}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </div>

      <FindingModal
        finding={openFinding}
        onClose={() => setOpenFinding(null)}
        onSave={saveFinding}
      />
      <IngestModal open={ingesting} onClose={() => setIngesting(false)} onIngest={addIngest} />
    </>
  );
}

/* --------------------------------------------------------- finding modal */

function FindingModal({
  finding,
  onClose,
  onSave,
}: {
  finding: Finding | null;
  onClose: () => void;
  onSave: (next: Finding) => void;
}) {
  const [status, setStatus] = useState<FindingStatus>("Open");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [mitigation, setMitigation] = useState("");
  const [key, setKey] = useState<string | null>(null);

  if (finding && key !== finding.id) {
    setKey(finding.id);
    setStatus(finding.status);
    setOwner(finding.owner);
    setDue(finding.due);
    setMitigation(finding.mitigation);
  }
  if (!finding) return null;

  const blocksIatt = finding.severity === "CAT I" && (status === "Open" || status === "Mitigating");

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={finding.title}
      description={`${finding.ref} · ${finding.source} · ${finding.asset}`}
      aside={
        <div className="space-y-3">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Assessor view
          </p>
          <div
            className={
              blocksIatt
                ? "rounded-md border border-danger/30 bg-danger/[0.05] px-3 py-2"
                : "rounded-md border border-border bg-card px-3 py-2"
            }
          >
            <p className="text-[12.5px] font-semibold">
              {blocksIatt ? "Blocks IATT at TRR" : "Not blocking"}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {blocksIatt
                ? "Open CAT I findings are an automatic IATT denial in the SCA checklist."
                : "This finding will be reviewed in the SAR but does not stop range operations."}
            </p>
          </div>
          <div className="space-y-1.5 border-t border-border pt-3">
            <KeyValue label="Severity">
              <Badge tone={severityTone[finding.severity]}>{finding.severity}</Badge>
            </KeyValue>
            <KeyValue label="Control">
              <Mono>{finding.control}</Mono>
            </KeyValue>
            <KeyValue label="Age">{finding.age} days</KeyValue>
            <KeyValue label="Detected by">{finding.source}</KeyValue>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave({ ...finding, status, owner, due, mitigation })}
          >
            <Check className="size-3.5" /> Save finding
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <p className="text-[13px] text-muted-foreground">{finding.detail}</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as FindingStatus)}>
              {findingStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Owner">
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
          <Field label="Mitigation due">
            <Input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Mitigation / assessor response">
          <Textarea
            rows={4}
            value={mitigation}
            onChange={(e) => setMitigation(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- ingest modal */

function IngestModal({
  open,
  onClose,
  onIngest,
}: {
  open: boolean;
  onClose: () => void;
  onIngest: (next: ScanIngest) => void;
}) {
  const [source, setSource] = useState<ScanSource>("STIG Viewer");
  const [artifact, setArtifact] = useState("");
  const [asset, setAsset] = useState("Mission compute (x4)");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const parser =
    source === "STIG Viewer"
      ? "DISA STIG Viewer CKL / CKLB"
      : source === "ACAS / Nessus"
        ? "Nessus v2 XML (.nessus)"
        : source === "SonarQube"
          ? "SonarQube issues API export (JSON)"
          : "Markdown implementation statements";

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title="Ingest assessment data"
      description="Parsed, deduplicated against existing findings and mapped to NIST 800-53."
      aside={
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Ingest preview
          </p>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.6] text-muted-foreground">
{`parser: ${parser}
artifact: ${artifact || "<no file selected>"}
asset: ${asset}
pipeline:
  - normalize -> finding[]
  - severity map -> CAT I/II/III
  - control map -> nist-800-53
  - dedupe by (ref, asset)
  - sca_simulation: re-run`}
          </pre>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              onIngest({
                id: `ING-${2207 + Math.floor(Date.now() % 90)}`,
                source,
                artifact: artifact || "untitled-import",
                asset,
                ingested: "Just now",
                status: "Parsing",
                findings: 0,
                catI: 0,
                catII: 0,
                catIII: 0,
                coverage: 0,
              })
            }
          >
            <Upload className="size-3.5" /> Ingest
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source">
            <Select value={source} onChange={(e) => setSource(e.target.value as ScanSource)}>
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Asset / boundary component">
            <Select value={asset} onChange={(e) => setAsset(e.target.value)}>
              <option>Mission compute (x4)</option>
              <option>UUV payload segment</option>
              <option>Autonomy core (C++)</option>
              <option>Range network stack</option>
              <option>Ground station</option>
              <option>Integration lab (SCIF)</option>
            </Select>
          </Field>
        </div>
        <Field label="Artifact file" hint={parser}>
          <Input
            value={artifact}
            onChange={(e) => setArtifact(e.target.value)}
            placeholder="e.g. RHEL9_V2R1_mission-compute.ckl"
          />
        </Field>
        <Field label="Assessor notes">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Scan conditions, credentialed vs uncredentialed, exclusions…"
          />
        </Field>
      </div>
    </Modal>
  );
}
