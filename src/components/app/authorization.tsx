import { useMemo, useState } from "react";
import {
  Check,
  FileSignature,
  Lock,
  Plus,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

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
  authorization,
  decisionTone,
  enclaveGrants,
  grantTone,
  jiraAssignees,
  jiraProjects,
  observationTone,
  packageArtifacts,
  packageStatusTone,
  residualRisks as seedRisks,
  residualTone,
  scaObservations as seedObservations,
  type ResidualRisk,
  type ScaObservation,
  type ScaObservationStatus,
} from "@/lib/authorization";

const severityTone = {
  "CAT I": "danger",
  "CAT II": "warning",
  "CAT III": "neutral",
} as const;

const observationStatuses: ScaObservationStatus[] = [
  "Logged",
  "Triaged",
  "Jira assigned",
  "In remediation",
  "Remediated",
  "Risk accepted",
];

const filters = ["All", "Open", "CAT I", "Unassigned"] as const;

function isOpen(o: ScaObservation) {
  return o.status !== "Remediated" && o.status !== "Risk accepted";
}

/* ==================================================== program: SCA portal */

export function AuthorizationSection({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const [observations, setObservations] = useState<ScaObservation[]>(seedObservations);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [logging, setLogging] = useState(false);
  const [jiraFor, setJiraFor] = useState<ScaObservation | null>(null);
  const [inviting, setInviting] = useState(false);

  const rows = useMemo(() => {
    if (filter === "Open") return observations.filter(isOpen);
    if (filter === "CAT I") return observations.filter((o) => o.severity === "CAT I");
    if (filter === "Unassigned") return observations.filter((o) => !o.jira);
    return observations;
  }, [observations, filter]);

  const open = observations.filter(isOpen).length;
  const catI = observations.filter((o) => o.severity === "CAT I" && isOpen(o)).length;
  const accepted = packageArtifacts.filter((a) => a.status === "SCA accepted").length;
  const readiness = Math.round((accepted / packageArtifacts.length) * 100);

  return (
    <>
      <div className="space-y-7">
        {/* ------------------------------------------------ authorization package */}
        <Section
          title="Authorization package"
          description={`SSP, SAR and POA&M assembled for ${programName} and served read-only to the government assessor.`}
          action={
            <>
              <Button variant="secondary">
                <Lock className="size-3.5" /> Lock version
              </Button>
              <Button variant="primary">
                <FileSignature className="size-3.5" /> Submit to SCA
              </Button>
            </>
          }
        >
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-subtle px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">
                {authorization.decision} · {authorization.type}
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                Package submitted {authorization.packageSubmitted} · AO briefing{" "}
                {authorization.briefing} · signature target {authorization.targetSignature} ·
                Milestone C {authorization.milestoneC}
              </p>
            </div>
            <div className="flex w-[180px] shrink-0 items-center gap-2">
              <Meter value={readiness} tone={readiness >= 80 ? "success" : "info"} />
              <span className="tabular-nums text-[12.5px] text-muted-foreground">
                {readiness}%
              </span>
            </div>
          </div>

          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "68px" }} />
              <col style={{ width: "72px" }} />
              <col />
              <col style={{ width: "56px" }} />
              <col style={{ width: "124px" }} />
              <col style={{ width: "52px" }} />
              <col style={{ width: "108px" }} />
              <col style={{ width: "92px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Kind</Th>
                <Th>Artifact</Th>
                <Th>Version</Th>
                <Th>Status</Th>
                <Th className="text-right">Pages</Th>
                <Th>Updated</Th>
                <Th>Owner</Th>
              </tr>
            </thead>
            <tbody>
              {packageArtifacts.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <Mono>{a.id}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{a.kind}</Td>
                  <Td>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground"> — {a.note}</span>
                  </Td>
                  <Td className="tabular-nums text-muted-foreground">{a.version}</Td>
                  <Td>
                    <Badge tone={packageStatusTone[a.status]}>{a.status}</Badge>
                  </Td>
                  <Td className="tabular-nums text-right text-muted-foreground">{a.pages}</Td>
                  <Td className="tabular-nums text-muted-foreground">{a.updated}</Td>
                  <Td className="text-muted-foreground">{a.owner}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* ------------------------------------------------------ read-only enclave */}
        <Section
          title="Assessor enclave access"
          description={`Read-only viewing enclave — ${authorization.enclave}. No documents leave the platform.`}
          action={
            <Button variant="secondary" onClick={() => setInviting(true)}>
              <UserPlus className="size-3.5" /> Grant access
            </Button>
          }
        >
          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "72px" }} />
              <col style={{ width: "132px" }} />
              <col />
              <col style={{ width: "92px" }} />
              <col style={{ width: "128px" }} />
              <col style={{ width: "132px" }} />
              <col style={{ width: "88px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Grant</Th>
                <Th>Person</Th>
                <Th>Organization</Th>
                <Th>Role</Th>
                <Th>Access</Th>
                <Th>Last viewed</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {enclaveGrants.map((g) => (
                <Tr key={g.id}>
                  <Td>
                    <Mono>{g.id}</Mono>
                  </Td>
                  <Td className="font-medium">{g.person}</Td>
                  <Td className="text-muted-foreground">{g.org}</Td>
                  <Td className="text-muted-foreground">{g.role}</Td>
                  <Td className="text-muted-foreground">{g.access}</Td>
                  <Td className="tabular-nums text-muted-foreground">{g.lastViewed}</Td>
                  <Td>
                    <Badge tone={grantTone[g.status]}>{g.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* ------------------------------------------------- live POA&M tracker */}
        <Section
          title="Live POA&M tracker"
          description="Observations logged by the SCA in-platform, triaged and pushed to engineering as Jira issues."
          action={
            <>
              <span className="text-[12.5px] text-muted-foreground">
                {open} open · {catI} CAT I
              </span>
              <Button variant="secondary" onClick={() => setLogging(true)}>
                <Plus className="size-3.5" /> Log observation
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-2 pb-2 pt-3">
            {filters.map((f) => (
              <FilterChip
                key={f}
                label={f}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>

          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "82px" }} />
              <col />
              <col style={{ width: "88px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "142px" }} />
              <col style={{ width: "116px" }} />
              <col style={{ width: "92px" }} />
              <col style={{ width: "116px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Observation</Th>
                <Th>Severity</Th>
                <Th>Control</Th>
                <Th>Status</Th>
                <Th>Jira</Th>
                <Th>Assignee</Th>
                <Th className="text-right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <Tr key={o.id} className="cursor-pointer" onClick={() => setJiraFor(o)}>
                  <Td>
                    <Mono>{o.id}</Mono>
                  </Td>
                  <Td>
                    <span className="font-medium">{o.title}</span>
                    <span className="text-muted-foreground"> — {o.loggedBy}</span>
                  </Td>
                  <Td>
                    <Badge tone={severityTone[o.severity]}>{o.severity}</Badge>
                  </Td>
                  <Td>
                    <Mono>{o.control}</Mono>
                  </Td>
                  <Td>
                    <Badge tone={observationTone[o.status]}>{o.status}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {o.jira ? <Mono>{o.jira}</Mono> : "Not assigned"}
                  </Td>
                  <Td className="text-muted-foreground">{o.assignee}</Td>
                  <Td className="tabular-nums text-right text-muted-foreground">{o.due}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </div>

      <ObservationModal
        open={logging}
        onClose={() => setLogging(false)}
        programId={programId}
        onLog={(next) => {
          setObservations((prev) => [next, ...prev]);
          setLogging(false);
        }}
      />
      <RemediationModal
        observation={jiraFor}
        onClose={() => setJiraFor(null)}
        onSave={(next) => {
          setObservations((prev) => prev.map((o) => (o.id === next.id ? next : o)));
          setJiraFor(null);
        }}
      />
      <GrantModal open={inviting} onClose={() => setInviting(false)} />
    </>
  );
}

/* ------------------------------------------------------- log observation */

function ObservationModal({
  open,
  onClose,
  onLog,
  programId,
}: {
  open: boolean;
  onClose: () => void;
  onLog: (next: ScaObservation) => void;
  programId: string;
}) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<ScaObservation["severity"]>("CAT II");
  const [control, setControl] = useState("");
  const [due, setDue] = useState("Sep 15, 2026");
  const [detail, setDetail] = useState("");

  if (!open) return null;

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title="Log assessor observation"
      description="Logged directly by the SCA in the enclave — no spreadsheets, no email."
      aside={
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Downstream effect
          </p>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.6] text-muted-foreground">
{`program: ${programId}
severity: ${severity}
control: ${control || "<unmapped>"}
creates:
  - sar_observation
  - poam_item (draft)
  - notify: product security
next: triage -> jira issue`}
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
              onLog({
                id: `OBS-${119 + Math.floor(Date.now() % 40)}`,
                title: title || "Untitled observation",
                severity,
                control: control || "CA-2",
                loggedBy: "D. Okafor (SCA)",
                logged: "Just now",
                status: "Logged",
                jira: null,
                assignee: "—",
                due,
                detail,
                response: "",
              })
            }
          >
            <Check className="size-3.5" /> Log observation
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Observation">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Session termination not enforced on maintenance console"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Severity">
            <Select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ScaObservation["severity"])}
            >
              <option>CAT I</option>
              <option>CAT II</option>
              <option>CAT III</option>
            </Select>
          </Field>
          <Field label="Control">
            <Input
              value={control}
              onChange={(e) => setControl(e.target.value)}
              placeholder="AC-12"
            />
          </Field>
          <Field label="Response due">
            <Input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Assessor detail">
          <Textarea
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="What was observed, where, and under what test conditions…"
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------- assign remediation */

function RemediationModal({
  observation,
  onClose,
  onSave,
}: {
  observation: ScaObservation | null;
  onClose: () => void;
  onSave: (next: ScaObservation) => void;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [status, setStatus] = useState<ScaObservationStatus>("Triaged");
  const [project, setProject] = useState("TRIDENT");
  const [assignee, setAssignee] = useState(jiraAssignees[0]!);
  const [due, setDue] = useState("");
  const [response, setResponse] = useState("");

  if (observation && key !== observation.id) {
    setKey(observation.id);
    setStatus(observation.status === "Logged" ? "Triaged" : observation.status);
    setProject(observation.jira?.split("-")[0] ?? "TRIDENT");
    setAssignee(observation.assignee !== "—" ? observation.assignee : jiraAssignees[0]!);
    setDue(observation.due);
    setResponse(observation.response);
  }
  if (!observation) return null;

  const jira =
    observation.jira ?? `${project}-${4400 + (observation.id.charCodeAt(observation.id.length - 1) % 90)}`;

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={observation.title}
      description={`${observation.id} · ${observation.control} · logged ${observation.logged} by ${observation.loggedBy}`}
      aside={
        <div className="space-y-3">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Jira issue
          </p>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.6] text-muted-foreground">
{`key: ${jira}
type: Security remediation
assignee: ${assignee}
due: ${due}
labels: [rmf, ${observation.control.toLowerCase()}, ${observation.severity.replace(" ", "").toLowerCase()}]
links:
  - observation: ${observation.id}
  - poam: live sync`}
          </pre>
          <div className="space-y-1.5 border-t border-border pt-3">
            <KeyValue label="Severity">
              <Badge tone={severityTone[observation.severity]}>{observation.severity}</Badge>
            </KeyValue>
            <KeyValue label="Current">
              <Badge tone={observationTone[observation.status]}>{observation.status}</Badge>
            </KeyValue>
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
            onClick={() =>
              onSave({
                ...observation,
                status,
                jira: status === "Triaged" ? observation.jira : jira,
                assignee,
                due,
                response,
              })
            }
          >
            <Check className="size-3.5" /> Save & sync
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <p className="text-[13px] text-muted-foreground">{observation.detail}</p>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ScaObservationStatus)}
            >
              {observationStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Jira project">
            <Select value={project} onChange={(e) => setProject(e.target.value)}>
              {jiraProjects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {jiraAssignees.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Due">
            <Input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Program response to the assessor">
          <Textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ grant modal */

function GrantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SCA team");
  const [access, setAccess] = useState("Read only");

  if (!open) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Grant enclave access"
      description="Scoped, expiring, read-only access to this authorization package."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onClose}>
            <Check className="size-3.5" /> Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Government email" hint=".mil or .gov only">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="first.last@us.navy.mil"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>SCA</option>
              <option>SCA team</option>
              <option>AO</option>
              <option>AODR</option>
            </Select>
          </Field>
          <Field label="Access">
            <Select value={access} onChange={(e) => setAccess(e.target.value)}>
              <option>Read only</option>
              <option>Read + comment</option>
              <option>Sign authority</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================== AO: digital briefing */

export function BriefingRoom() {
  const [risks, setRisks] = useState<ResidualRisk[]>(seedRisks);
  const [deciding, setDeciding] = useState<ResidualRisk | null>(null);
  const [memo, setMemo] = useState(false);

  const pending = risks.filter((r) => r.decision === "Pending AO");
  const high = risks.filter((r) => r.residual === "High" || r.residual === "Very high");
  const decided = risks.length - pending.length;
  const progress = Math.round((decided / risks.length) * 100);
  const openObservations = seedObservations.filter(isOpen);

  return (
    <>
      <div className="space-y-7">
        <Section
          title="Risk posture"
          description="Everything the Authorizing Official needs to make the authorization decision, on one page."
          action={
            <Button variant="primary" disabled={pending.length > 0} onClick={() => setMemo(true)}>
              <FileSignature className="size-3.5" /> Issue authorization memo
            </Button>
          }
        >
          <div
            className={
              pending.length > 0
                ? "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning/[0.05] px-3.5 py-2.5"
                : "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-subtle px-3.5 py-2.5"
            }
          >
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">
                {pending.length > 0
                  ? `${pending.length} residual risks await an AO decision`
                  : "All residual risks adjudicated — memo ready for signature"}
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {high.length} high residual · {openObservations.length} open SCA observations ·
                briefing {authorization.briefing} · signature target{" "}
                {authorization.targetSignature}
              </p>
            </div>
            <div className="flex w-[180px] shrink-0 items-center gap-2">
              <Meter value={progress} tone={pending.length > 0 ? "warning" : "success"} />
              <span className="tabular-nums text-[12.5px] text-muted-foreground">
                {progress}%
              </span>
            </div>
          </div>

          <dl className="mt-3 grid gap-x-8 gap-y-3 border-b border-border pb-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Decision",
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <Dot tone="warning" /> {authorization.decision}
                  </span>
                ),
              },
              { label: "Authorization type", value: authorization.type },
              { label: "Authorizing official", value: authorization.ao },
              { label: "AODR", value: authorization.aodr },
              { label: "Security control assessor", value: authorization.sca },
              { label: "Milestone C", value: authorization.milestoneC },
            ].map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="truncate text-[12px] text-muted-foreground">{f.label}</dt>
                <dd className="mt-0.5 truncate text-[12.5px] font-medium tabular-nums">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          title="Residual risk acceptance"
          description="Each risk carries its mitigation and POA&M reference. Sign off or send back."
        >
          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "76px" }} />
              <col />
              <col style={{ width: "92px" }} />
              <col style={{ width: "84px" }} />
              <col style={{ width: "98px" }} />
              <col style={{ width: "96px" }} />
              <col style={{ width: "108px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Risk</Th>
                <Th>Title</Th>
                <Th>Control</Th>
                <Th>Likelihood</Th>
                <Th>Residual</Th>
                <Th>POA&M</Th>
                <Th>Decision</Th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <Tr key={r.id} className="cursor-pointer" onClick={() => setDeciding(r)}>
                  <Td>
                    <Mono>{r.id}</Mono>
                  </Td>
                  <Td>
                    <span className="font-medium">{r.title}</span>
                    <span className="text-muted-foreground"> — {r.mitigation}</span>
                  </Td>
                  <Td>
                    <Mono>{r.control}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{r.likelihood}</Td>
                  <Td>
                    <Badge tone={residualTone[r.residual]}>{r.residual}</Badge>
                  </Td>
                  <Td>
                    <Mono>{r.poam}</Mono>
                  </Td>
                  <Td>
                    <Badge tone={decisionTone[r.decision]}>{r.decision}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Open assessor observations"
          description="Live from the SCA enclave — the same records the assessment team is working."
        >
          <Table className="mt-3 table-fixed">
            <colgroup>
              <col style={{ width: "82px" }} />
              <col />
              <col style={{ width: "88px" }} />
              <col style={{ width: "142px" }} />
              <col style={{ width: "116px" }} />
              <col style={{ width: "116px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Observation</Th>
                <Th>Severity</Th>
                <Th>Status</Th>
                <Th>Jira</Th>
                <Th className="text-right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {openObservations.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <Mono>{o.id}</Mono>
                  </Td>
                  <Td className="font-medium">{o.title}</Td>
                  <Td>
                    <Badge tone={severityTone[o.severity]}>{o.severity}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={observationTone[o.status]}>{o.status}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {o.jira ? <Mono>{o.jira}</Mono> : "Not assigned"}
                  </Td>
                  <Td className="tabular-nums text-right text-muted-foreground">{o.due}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </div>

      <RiskDecisionModal
        risk={deciding}
        onClose={() => setDeciding(null)}
        onSave={(next) => {
          setRisks((prev) => prev.map((r) => (r.id === next.id ? next : r)));
          setDeciding(null);
        }}
      />
      <MemoModal open={memo} onClose={() => setMemo(false)} />
    </>
  );
}

function RiskDecisionModal({
  risk,
  onClose,
  onSave,
}: {
  risk: ResidualRisk | null;
  onClose: () => void;
  onSave: (next: ResidualRisk) => void;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [decision, setDecision] = useState<ResidualRisk["decision"]>("Accepted");
  const [rationale, setRationale] = useState("");

  if (risk && key !== risk.id) {
    setKey(risk.id);
    setDecision(risk.decision === "Pending AO" ? "Accepted" : risk.decision);
    setRationale(risk.rationale);
  }
  if (!risk) return null;

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={risk.title}
      description={`${risk.id} · ${risk.control} · ${risk.poam}`}
      aside={
        <div className="space-y-3">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Risk profile
          </p>
          <div className="space-y-1.5">
            <KeyValue label="Likelihood">{risk.likelihood}</KeyValue>
            <KeyValue label="Impact">{risk.impact}</KeyValue>
            <KeyValue label="Residual">
              <Badge tone={residualTone[risk.residual]}>{risk.residual}</Badge>
            </KeyValue>
            <KeyValue label="POA&M">
              <Mono>{risk.poam}</Mono>
            </KeyValue>
          </div>
          <p className="border-t border-border pt-3 text-[12px] text-muted-foreground">
            Signed as {authorization.ao}. The decision and rationale are written to the
            authorization record and the OSCAL POA&M.
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave({ ...risk, decision, rationale })}>
            <ShieldCheck className="size-3.5" /> Record decision
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <p className="text-[13px] text-muted-foreground">Mitigation in place: {risk.mitigation}</p>
        <Field label="AO decision">
          <Select
            value={decision}
            onChange={(e) => setDecision(e.target.value as ResidualRisk["decision"])}
          >
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Deferred</option>
            <option>Pending AO</option>
          </Select>
        </Field>
        <Field label="Rationale for the record">
          <Textarea
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Basis for acceptance, conditions, and review point…"
          />
        </Field>
      </div>
    </Modal>
  );
}

function MemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState(authorization.type);
  const [expires, setExpires] = useState("Oct 02, 2029");
  const [conditions, setConditions] = useState(
    "Close POAM-0031 and POAM-0044 within 90 days. Submit continuous monitoring report quarterly.",
  );

  if (!open) return null;
  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title="Issue authorization memo"
      description="Signed by the Authorizing Official and distributed to the program and the SCA."
      aside={
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Memo preview
          </p>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.6] text-muted-foreground">
{`AUTHORIZATION DECISION
system: Trident UUV C2
decision: ${type}
expires: ${expires}
ao: ${authorization.ao}
sca: ${authorization.sca}
basis:
  - SSP v4.2
  - SAR v2.0
  - POA&M v11 (OSCAL)
conditions: |
  ${conditions}`}
          </pre>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onClose}>
            <FileSignature className="size-3.5" /> Sign & issue
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Authorization type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option>ATO with conditions (36 months)</option>
              <option>ATO (36 months)</option>
              <option>Continuous ATO (cATO)</option>
              <option>IATT (90 days)</option>
              <option>Denial of authorization</option>
            </Select>
          </Field>
          <Field label="Expires">
            <Input value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
        </div>
        <Field label="Conditions of authorization">
          <Textarea
            rows={4}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
