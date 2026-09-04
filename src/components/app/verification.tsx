import { useMemo, useState } from "react";
import { AlertTriangle, Check, Plus, RefreshCw, Upload } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Dialog,
  Dot,
  Field,
  FilterChip,
  Grid,
  Id,
  Indicator,
  Inline,
  Input,
  KeyValue,
  NativeSelect,
  Progress,
  Section,
  Stack,
  Table,
  Textarea,
  useRequired,
} from "@ledger/design-system";
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
      <Stack space="space.300">
        {/* ------------------------------------------------- SCA simulation */}
        <Section
          title="SCA simulation"
          description={`How the government Security Control Assessor sees ${programName} today, ahead of the official audit.`}
          action={
            <Button variant="secondary">
              <RefreshCw className="size-icon-small" /> Re-run simulation
            </Button>
          }
        >
          <Box paddingBlockStart="space.150">
            <Inline
              className={
                blocking > 0
                  ? "rounded-medium border border-danger-subtle bg-danger px-150 py-100"
                  : "rounded-medium border border-default bg-surface-sunken px-150 py-100"
              }
              space="space.150"
              alignBlock="center"
              spread="space-between"
              shouldWrap
            >
              <Inline className="min-w-0" space="space.100" alignBlock="start">
                <AlertTriangle className="pt-025 size-icon-medium shrink-0 text-danger" />
                <div className="min-w-0">
                  <p className="font-body font-semibold">
                    {blocking > 0
                      ? `${openCatI.length} CAT I findings will block IATT at TRR`
                      : "No blocking findings — IATT package is clean"}
                  </p>
                  <p className="pt-025 font-body-small text-subtle">
                    {blocking} failing check{blocking === 1 ? "" : "s"} · {atRisk} at risk ·{" "}
                    {passing} of {scaChecks.length} passing. TRR is{" "}
                    {daysBetween("Aug 27, 2026", "Sep 18, 2026")} days out.
                  </p>
                </div>
              </Inline>
              <Inline
                className="shrink-0"
                space="space.100"
                alignBlock="center"
                style={{ width: 180 }}
              >
                <Progress value={readiness} tone={blocking > 0 ? "danger" : "success"} />
                <span className="tabular-nums font-body-small text-subtle">{readiness}%</span>
              </Inline>
            </Inline>
          </Box>

          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={76}>Check</Table.Header>
                <Table.Header>Requirement</Table.Header>
                <Table.Header width={104}>Verdict</Table.Header>
                <Table.Header width={72}>Gate</Table.Header>
                <Table.Header width={212}>Assessor note</Table.Header>
                <Table.Header width={148}>Evidence</Table.Header>
              </tr>
            </thead>
            <tbody>
              {scaChecks.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell>
                    <Id>{c.id}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-subtle"> — {c.requirement}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={verdictTone[c.verdict]}>{c.verdict}</Badge>
                  </Table.Cell>
                  <Table.Cell>{c.gate}</Table.Cell>
                  <Table.Cell>{c.finding}</Table.Cell>
                  <Table.Cell>{c.evidence}</Table.Cell>
                </Table.Row>
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
              <Plus className="size-icon-small" /> Add test event
            </Button>
          }
        >
          <dl className="pt-150 grid gap-x-400 gap-y-150 border-b border-default pb-150 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "IATT status",
                value: (
                  <Inline as="span" display="inline-flex" space="space.075" alignBlock="center">
                    <Dot tone="warning" /> {iatt.status}
                  </Inline>
                ),
              },
              { label: "Requested", value: iatt.requested },
              { label: "Decision target", value: iatt.decisionTarget },
              { label: "Effective", value: iatt.effective },
              { label: "Expires", value: <span className="text-danger">{iatt.expires}</span> },
              { label: "Authorizing official", value: iatt.authorizing },
            ].map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="truncate font-body-small text-subtle">{f.label}</dt>
                <dd className="pt-025 truncate font-body-small font-medium tabular-nums">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={72}>Event</Table.Header>
                <Table.Header>Test activity</Table.Header>
                <Table.Header width={168}>Range</Table.Header>
                <Table.Header width={104}>Start</Table.Header>
                <Table.Header width={104}>End</Table.Header>
                <Table.Header width={112}>Status</Table.Header>
                <Table.Header width={180}>Against IATT</Table.Header>
              </tr>
            </thead>
            <tbody>
              {testEvents.map((e) => {
                const slack = daysBetween(e.end, iatt.expires);
                return (
                  <Table.Row key={e.id}>
                    <Table.Cell>
                      <Id>{e.id}</Id>
                    </Table.Cell>
                    <Table.Cell>{e.name}</Table.Cell>
                    <Table.Cell>{e.range}</Table.Cell>
                    <Table.Cell className="tabular-nums">{shortDate(e.start)}</Table.Cell>
                    <Table.Cell className="tabular-nums">{shortDate(e.end)}</Table.Cell>
                    <Table.Cell>
                      <Badge tone={testStatusTone[e.status]}>{e.status}</Badge>
                    </Table.Cell>
                    <Table.Cell className={slack < 0 ? "text-danger" : undefined}>
                      {slack < 0
                        ? `${Math.abs(slack)}d past expiry`
                        : `${slack}d slack · ${e.requires}`}
                    </Table.Cell>
                  </Table.Row>
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
              <Upload className="size-icon-small" /> Ingest scan
            </Button>
          }
        >
          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={92}>ID</Table.Header>
                <Table.Header width={84}>Source</Table.Header>
                <Table.Header>Artifact</Table.Header>
                <Table.Header width={152}>Asset</Table.Header>
                <Table.Header width={132}>Ingested</Table.Header>
                <Table.Header width={88}>Status</Table.Header>
                <Table.Header width={148} className="text-right">
                  CAT I / II / III
                </Table.Header>
                <Table.Header width={96} className="text-right">
                  Coverage
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {ingests.map((i) => (
                <Table.Row key={i.id}>
                  <Table.Cell>
                    <Id>{i.id}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone="neutral">{sourceShort[i.source]}</Badge>
                  </Table.Cell>
                  <Table.Cell>{i.artifact}</Table.Cell>
                  <Table.Cell>{i.asset}</Table.Cell>
                  <Table.Cell className="tabular-nums">{shortStamp(i.ingested)}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={ingestTone[i.status]}>{i.status}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    <span className={i.catI > 0 ? "font-medium text-danger" : "text-subtle"}>
                      {i.catI}
                    </span>
                    <span className="text-subtlest"> / </span>
                    <span className="text-subtle">{i.catII}</span>
                    <span className="text-subtlest"> / </span>
                    <span className="text-subtle">{i.catIII}</span>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{i.coverage}%</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* -------------------------------------------------------- findings */}
        <Section
          title="Aggregated findings"
          description="Deduplicated across scan sources and mapped to NIST 800-53 controls."
          action={
            <Inline space="space.075" alignBlock="center">
              {severityFilters.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  value={String(
                    s === "All" ? items.length : items.filter((f) => f.severity === s).length,
                  )}
                  isActive={severity === s}
                  onClick={() => setSeverity(s)}
                />
              ))}
            </Inline>
          }
        >
          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={124}>Reference</Table.Header>
                <Table.Header width={76}>Source</Table.Header>
                <Table.Header>Finding</Table.Header>
                <Table.Header width={72}>Control</Table.Header>
                <Table.Header width={136}>Asset</Table.Header>
                <Table.Header width={124}>Status</Table.Header>
                <Table.Header width={56} className="text-right">
                  Age
                </Table.Header>
                <Table.Header width={92}>Due</Table.Header>
                <Table.Header width={104}>Owner</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <Table.Row key={f.id} className="cursor-pointer" onClick={() => setOpenFinding(f)}>
                  <Table.Cell>
                    <Inline as="span" space="space.075" alignBlock="center">
                      <Dot tone={severityTone[f.severity]} />
                      <Id>{f.ref}</Id>
                    </Inline>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone="neutral">{sourceShort[f.source]}</Badge>
                  </Table.Cell>
                  <Table.Cell>{f.title}</Table.Cell>
                  <Table.Cell>
                    <Id>{f.control}</Id>
                  </Table.Cell>
                  <Table.Cell>{f.asset}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={findingStatusTone[f.status]}>{f.status}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{f.age}d</Table.Cell>
                  <Table.Cell className="tabular-nums">{shortDate(f.due)}</Table.Cell>
                  <Table.Cell>{f.owner}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </Stack>

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
  const req = useRequired({ owner, due });

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
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={finding.title}
      description={`${finding.ref} · ${finding.source} · ${finding.asset}`}
      aside={
        <Stack space="space.150">
          <p className="font-heading-xxsmall uppercase text-subtle">Assessor view</p>
          <Box
            className={
              blocksIatt
                ? "rounded-medium border border-danger-subtle bg-danger"
                : "rounded-medium border border-default bg-surface"
            }
            paddingInline="space.150"
            paddingBlock="space.100"
          >
            <p className="font-body-small font-semibold">
              {blocksIatt ? "Blocks IATT at TRR" : "Not blocking"}
            </p>
            <p className="pt-025 font-body-small text-subtle">
              {blocksIatt
                ? "Open CAT I findings are an automatic IATT denial in the SCA checklist."
                : "This finding will be reviewed in the SAR but does not stop range operations."}
            </p>
          </Box>
          <Stack className="border-t border-default pt-150" space="space.075">
            <KeyValue label="Severity">
              <Indicator tone={severityTone[finding.severity]}>{finding.severity}</Indicator>
            </KeyValue>
            <KeyValue label="Control">
              <Id>{finding.control}</Id>
            </KeyValue>
            <KeyValue label="Age">{finding.age} days</KeyValue>
            <KeyValue label="Detected by">{finding.source}</KeyValue>
          </Stack>
        </Stack>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!req.check()) return;
              onSave({ ...finding, status, owner, due, mitigation });
            }}
          >
            <Check className="size-icon-small" /> Save finding
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <p className="font-body text-subtle">{finding.detail}</p>
        <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
          <Field label="Status">
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as FindingStatus)}
            >
              {findingStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("owner")} label="Owner">
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
          <Field isRequired error={req.errorFor("due")} label="Mitigation due">
            <Input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </Grid>
        <Field label="Mitigation / assessor response">
          <Textarea rows={4} value={mitigation} onChange={(e) => setMitigation(e.target.value)} />
        </Field>
      </Stack>
    </Dialog>
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
  const req = useRequired({ artifact });

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
    <Dialog
      open
      onClose={onClose}
      width="large"
      title="Ingest assessment data"
      description="Parsed, deduplicated against existing findings and mapped to NIST 800-53."
      aside={
        <Stack space="space.100">
          <p className="font-heading-xxsmall uppercase text-subtle">Ingest preview</p>
          <pre className="whitespace-pre-wrap break-words font-code font-body-xsmall text-subtle">
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
        </Stack>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!req.check()) return;
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
              });
            }}
          >
            <Upload className="size-icon-small" /> Ingest
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Source">
            <NativeSelect value={source} onChange={(e) => setSource(e.target.value as ScanSource)}>
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Asset / boundary component">
            <NativeSelect value={asset} onChange={(e) => setAsset(e.target.value)}>
              <option>Mission compute (x4)</option>
              <option>UUV payload segment</option>
              <option>Autonomy core (C++)</option>
              <option>Range network stack</option>
              <option>Ground station</option>
              <option>Integration lab (SCIF)</option>
            </NativeSelect>
          </Field>
        </Grid>
        <Field isRequired error={req.errorFor("artifact")} label="Artifact file" hint={parser}>
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
      </Stack>
    </Dialog>
  );
}
