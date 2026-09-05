import { useMemo, useState } from "react";
import { Check, FileSignature, Lock, Plus, ShieldCheck, UserPlus } from "lucide-react";

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
  Eyebrow,
} from "@ledger/design-system";
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
      <Stack space="space.300">
        {/* ------------------------------------------------ authorization package */}
        <Section
          title="Authorization package"
          description={`SSP, SAR and POA&M assembled for ${programName} and served read-only to the government assessor.`}
          action={
            <>
              <Button variant="secondary" iconBefore={<Lock />}>
                Lock version
              </Button>
              <Button variant="primary" iconBefore={<FileSignature />}>
                Submit to SCA
              </Button>
            </>
          }
        >
          <Box paddingBlockStart="space.150">
            <Inline
              className="rounded-medium border border-default bg-surface-sunken px-150 py-100"
              space="space.150"
              alignBlock="center"
              spread="space-between"
              shouldWrap
            >
              <div className="min-w-0">
                <p className="font-body font-semibold">
                  {authorization.decision} · {authorization.type}
                </p>
                <p className="pt-025 font-body-small text-subtle">
                  Package submitted {authorization.packageSubmitted} · AO briefing{" "}
                  {authorization.briefing} · signature target {authorization.targetSignature} ·
                  Milestone C {authorization.milestoneC}
                </p>
              </div>
              <Inline
                className="shrink-0"
                space="space.100"
                alignBlock="center"
                style={{ width: 180 }}
              >
                <Progress
                  value={readiness}
                  tone={readiness >= 80 ? "success" : "information"}
                  showValue
                />
              </Inline>
            </Inline>
          </Box>

          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={68}>ID</Table.Header>
                <Table.Header width={72}>Kind</Table.Header>
                <Table.Header>Artifact</Table.Header>
                <Table.Header width={56}>Version</Table.Header>
                <Table.Header width={124}>Status</Table.Header>
                <Table.Header width={52} className="text-right">
                  Pages
                </Table.Header>
                <Table.Header width={108}>Updated</Table.Header>
                <Table.Header width={92}>Owner</Table.Header>
              </tr>
            </thead>
            <tbody>
              {packageArtifacts.map((a) => (
                <Table.Row key={a.id}>
                  <Table.Cell>
                    <Id>{a.id}</Id>
                  </Table.Cell>
                  <Table.Cell>{a.kind}</Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-subtle"> — {a.note}</span>
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">{a.version}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={packageStatusTone[a.status]}>{a.status}</Badge>
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right">{a.pages}</Table.Cell>
                  <Table.Cell className="tabular-nums">{a.updated}</Table.Cell>
                  <Table.Cell>{a.owner}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* ------------------------------------------------------ read-only enclave */}
        <Section
          title="Assessor enclave access"
          description={`Read-only viewing enclave — ${authorization.enclave}. No documents leave the platform.`}
          action={
            <Button variant="secondary" onClick={() => setInviting(true)} iconBefore={<UserPlus />}>
              Grant access
            </Button>
          }
        >
          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={72}>Grant</Table.Header>
                <Table.Header width={132}>Person</Table.Header>
                <Table.Header>Organization</Table.Header>
                <Table.Header width={92}>Role</Table.Header>
                <Table.Header width={128}>Access</Table.Header>
                <Table.Header width={132}>Last viewed</Table.Header>
                <Table.Header width={88}>Status</Table.Header>
              </tr>
            </thead>
            <tbody>
              {enclaveGrants.map((g) => (
                <Table.Row key={g.id}>
                  <Table.Cell>
                    <Id>{g.id}</Id>
                  </Table.Cell>
                  <Table.Cell>{g.person}</Table.Cell>
                  <Table.Cell>{g.org}</Table.Cell>
                  <Table.Cell>{g.role}</Table.Cell>
                  <Table.Cell>{g.access}</Table.Cell>
                  <Table.Cell className="tabular-nums">{g.lastViewed}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={grantTone[g.status]}>{g.status}</Badge>
                  </Table.Cell>
                </Table.Row>
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
              <span className="font-body-small text-subtle">
                {open} open · {catI} CAT I
              </span>
              <Button variant="secondary" onClick={() => setLogging(true)} iconBefore={<Plus />}>
                Log observation
              </Button>
            </>
          }
        >
          <Inline className="pb-100 pt-150" space="space.100" alignBlock="center" shouldWrap>
            {filters.map((f) => (
              <FilterChip key={f} label={f} isActive={filter === f} onClick={() => setFilter(f)} />
            ))}
          </Inline>

          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={82}>ID</Table.Header>
                <Table.Header>Observation</Table.Header>
                <Table.Header width={88}>Severity</Table.Header>
                <Table.Header width={72}>Control</Table.Header>
                <Table.Header width={142}>Status</Table.Header>
                <Table.Header width={116}>Jira</Table.Header>
                <Table.Header width={92}>Assignee</Table.Header>
                <Table.Header width={116} className="text-right">
                  Due
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <Table.Row key={o.id} className="cursor-pointer" onClick={() => setJiraFor(o)}>
                  <Table.Cell>
                    <Id>{o.id}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">{o.title}</span>
                    <span className="text-subtle"> — {o.loggedBy}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Indicator tone={severityTone[o.severity]}>{o.severity}</Indicator>
                  </Table.Cell>
                  <Table.Cell>
                    <Id>{o.control}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={observationTone[o.status]}>{o.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>{o.jira ? <Id>{o.jira}</Id> : "Not assigned"}</Table.Cell>
                  <Table.Cell>{o.assignee}</Table.Cell>
                  <Table.Cell className="tabular-nums text-right">{o.due}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </Stack>

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
  const req = useRequired({ title, control });

  if (!open) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title="Log assessor observation"
      description="Logged directly by the SCA in the enclave — no spreadsheets, no email."
      aside={
        <Stack space="space.100">
          <Eyebrow as="p">Downstream effect</Eyebrow>
          <pre className="whitespace-pre-wrap break-words font-code font-body-xsmall text-subtle">
            {`program: ${programId}
severity: ${severity}
control: ${control || "<unmapped>"}
creates:
  - sar_observation
  - poam_item (draft)
  - notify: product security
next: triage -> jira issue`}
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
              });
            }}
            iconBefore={<Check />}
          >
            Log observation
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field isRequired error={req.errorFor("title")} label="Observation">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Session termination not enforced on maintenance console"
          />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
          <Field label="Severity">
            <NativeSelect
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ScaObservation["severity"])}
            >
              <option>CAT I</option>
              <option>CAT II</option>
              <option>CAT III</option>
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("control")} label="Control">
            <Input
              value={control}
              onChange={(e) => setControl(e.target.value)}
              placeholder="AC-12"
            />
          </Field>
          <Field label="Response due">
            <Input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </Grid>
        <Field label="Assessor detail">
          <Textarea
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="What was observed, where, and under what test conditions…"
          />
        </Field>
      </Stack>
    </Dialog>
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
  const req = useRequired({ assignee, due, response });

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
    observation.jira ??
    `${project}-${4400 + (observation.id.charCodeAt(observation.id.length - 1) % 90)}`;

  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={observation.title}
      description={`${observation.id} · ${observation.control} · logged ${observation.logged} by ${observation.loggedBy}`}
      aside={
        <Stack space="space.150">
          <Eyebrow as="p">Jira issue</Eyebrow>
          <pre className="whitespace-pre-wrap break-words font-code font-body-xsmall text-subtle">
            {`key: ${jira}
type: Security remediation
assignee: ${assignee}
due: ${due}
labels: [rmf, ${observation.control.toLowerCase()}, ${observation.severity.replace(" ", "").toLowerCase()}]
links:
  - observation: ${observation.id}
  - poam: live sync`}
          </pre>
          <Stack className="border-t border-default pt-150" space="space.075">
            <KeyValue label="Severity">
              <Indicator tone={severityTone[observation.severity]}>
                {observation.severity}
              </Indicator>
            </KeyValue>
            <KeyValue label="Current">
              <Badge tone={observationTone[observation.status]}>{observation.status}</Badge>
            </KeyValue>
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
              onSave({
                ...observation,
                status,
                jira: status === "Triaged" ? observation.jira : jira,
                assignee,
                due,
                response,
              });
            }}
            iconBefore={<Check />}
          >
            Save & sync
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <p className="font-body text-subtle">{observation.detail}</p>
        <Grid gap="space.150" templateColumns="repeat(4, minmax(0, 1fr))">
          <Field label="Status">
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as ScaObservationStatus)}
            >
              {observationStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Jira project">
            <NativeSelect value={project} onChange={(e) => setProject(e.target.value)}>
              {jiraProjects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("assignee")} label="Assignee">
            <NativeSelect value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {jiraAssignees.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("due")} label="Due">
            <Input value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </Grid>
        <Field isRequired error={req.errorFor("response")} label="Program response to the assessor">
          <Textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} />
        </Field>
      </Stack>
    </Dialog>
  );
}

/* ------------------------------------------------------------ grant modal */

function GrantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SCA team");
  const [access, setAccess] = useState("Read only");
  const req = useRequired({ email });

  if (!open) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      title="Grant enclave access"
      description="Scoped, expiring, read-only access to this authorization package."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!req.check()) return;
              onClose();
            }}
            iconBefore={<Check />}
          >
            Send invite
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field
          isRequired
          error={req.errorFor("email")}
          label="Government email"
          hint=".mil or .gov only"
        >
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="first.last@us.navy.mil"
          />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Role">
            <NativeSelect value={role} onChange={(e) => setRole(e.target.value)}>
              <option>SCA</option>
              <option>SCA team</option>
              <option>AO</option>
              <option>AODR</option>
            </NativeSelect>
          </Field>
          <Field label="Access">
            <NativeSelect value={access} onChange={(e) => setAccess(e.target.value)}>
              <option>Read only</option>
              <option>Read + comment</option>
              <option>Sign authority</option>
            </NativeSelect>
          </Field>
        </Grid>
      </Stack>
    </Dialog>
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
      <Stack space="space.300">
        <Section
          title="Risk posture"
          description="Everything the Authorizing Official needs to make the authorization decision, on one page."
          action={
            <Button
              variant="primary"
              disabled={pending.length > 0}
              onClick={() => setMemo(true)}
              iconBefore={<FileSignature />}
            >
              Issue authorization memo
            </Button>
          }
        >
          <Box paddingBlockStart="space.150">
            <Inline
              className={
                pending.length > 0
                  ? "rounded-medium border border-warning-subtle bg-warning px-150 py-100"
                  : "rounded-medium border border-default bg-surface-sunken px-150 py-100"
              }
              space="space.150"
              alignBlock="center"
              spread="space-between"
              shouldWrap
            >
              <div className="min-w-0">
                <p className="font-body font-semibold">
                  {pending.length > 0
                    ? `${pending.length} residual risks await an AO decision`
                    : "All residual risks adjudicated — memo ready for signature"}
                </p>
                <p className="pt-025 font-body-small text-subtle">
                  {high.length} high residual · {openObservations.length} open SCA observations ·
                  briefing {authorization.briefing} · signature target{" "}
                  {authorization.targetSignature}
                </p>
              </div>
              <Inline
                className="shrink-0"
                space="space.100"
                alignBlock="center"
                style={{ width: 180 }}
              >
                <Progress
                  value={progress}
                  tone={pending.length > 0 ? "warning" : "success"}
                  showValue
                />
              </Inline>
            </Inline>
          </Box>

          <dl className="pt-150 grid gap-x-400 gap-y-150 border-b border-default pb-150 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Decision",
                value: (
                  <Inline as="span" display="inline-flex" space="space.075" alignBlock="center">
                    <Dot tone="warning" /> {authorization.decision}
                  </Inline>
                ),
              },
              { label: "Authorization type", value: authorization.type },
              { label: "Authorizing official", value: authorization.ao },
              { label: "AODR", value: authorization.aodr },
              { label: "Security control assessor", value: authorization.sca },
              { label: "Milestone C", value: authorization.milestoneC },
            ].map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="truncate font-body-small text-subtle">{f.label}</dt>
                <dd className="pt-025 truncate font-body-small font-medium tabular-nums">
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
          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={76}>Risk</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header width={92}>Control</Table.Header>
                <Table.Header width={84}>Likelihood</Table.Header>
                <Table.Header width={98}>Residual</Table.Header>
                <Table.Header width={96}>POA&M</Table.Header>
                <Table.Header width={108}>Decision</Table.Header>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <Table.Row key={r.id} className="cursor-pointer" onClick={() => setDeciding(r)}>
                  <Table.Cell>
                    <Id>{r.id}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">{r.title}</span>
                    <span className="text-subtle"> — {r.mitigation}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Id>{r.control}</Id>
                  </Table.Cell>
                  <Table.Cell>{r.likelihood}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={residualTone[r.residual]}>{r.residual}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Id>{r.poam}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={decisionTone[r.decision]}>{r.decision}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Open assessor observations"
          description="Live from the SCA enclave — the same records the assessment team is working."
        >
          <Table className="pt-150 table-fixed">
            <thead>
              <tr>
                <Table.Header width={82}>ID</Table.Header>
                <Table.Header>Observation</Table.Header>
                <Table.Header width={88}>Severity</Table.Header>
                <Table.Header width={142}>Status</Table.Header>
                <Table.Header width={116}>Jira</Table.Header>
                <Table.Header width={116} className="text-right">
                  Due
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {openObservations.map((o) => (
                <Table.Row key={o.id}>
                  <Table.Cell>
                    <Id>{o.id}</Id>
                  </Table.Cell>
                  <Table.Cell>{o.title}</Table.Cell>
                  <Table.Cell>
                    <Indicator tone={severityTone[o.severity]}>{o.severity}</Indicator>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={observationTone[o.status]}>{o.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>{o.jira ? <Id>{o.jira}</Id> : "Not assigned"}</Table.Cell>
                  <Table.Cell className="tabular-nums text-right">{o.due}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </Stack>

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
  const req = useRequired({ rationale });

  if (risk && key !== risk.id) {
    setKey(risk.id);
    setDecision(risk.decision === "Pending AO" ? "Accepted" : risk.decision);
    setRationale(risk.rationale);
  }
  if (!risk) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={risk.title}
      description={`${risk.id} · ${risk.control} · ${risk.poam}`}
      aside={
        <Stack space="space.150">
          <Eyebrow as="p">Risk profile</Eyebrow>
          <Stack space="space.075">
            <KeyValue label="Likelihood">{risk.likelihood}</KeyValue>
            <KeyValue label="Impact">{risk.impact}</KeyValue>
            <KeyValue label="Residual">
              <Badge tone={residualTone[risk.residual]}>{risk.residual}</Badge>
            </KeyValue>
            <KeyValue label="POA&M">
              <Id>{risk.poam}</Id>
            </KeyValue>
          </Stack>
          <p className="border-t border-default pt-150 font-body-small text-subtle">
            Signed as {authorization.ao}. The decision and rationale are written to the
            authorization record and the OSCAL POA&M.
          </p>
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
              onSave({ ...risk, decision, rationale });
            }}
            iconBefore={<ShieldCheck />}
          >
            Record decision
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <p className="font-body text-subtle">Mitigation in place: {risk.mitigation}</p>
        <Field label="AO decision">
          <NativeSelect
            value={decision}
            onChange={(e) => setDecision(e.target.value as ResidualRisk["decision"])}
          >
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Deferred</option>
            <option>Pending AO</option>
          </NativeSelect>
        </Field>
        <Field isRequired error={req.errorFor("rationale")} label="Rationale for the record">
          <Textarea
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Basis for acceptance, conditions, and review point…"
          />
        </Field>
      </Stack>
    </Dialog>
  );
}

function MemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState(authorization.type);
  const [expires, setExpires] = useState("Oct 02, 2029");
  const [conditions, setConditions] = useState(
    "Close POAM-0031 and POAM-0044 within 90 days. Submit continuous monitoring report quarterly.",
  );
  const req = useRequired({ expires });

  if (!open) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title="Issue authorization memo"
      description="Signed by the Authorizing Official and distributed to the program and the SCA."
      aside={
        <Stack space="space.100">
          <Eyebrow as="p">Memo preview</Eyebrow>
          <pre className="whitespace-pre-wrap break-words font-code font-body-xsmall text-subtle">
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
              onClose();
            }}
            iconBefore={<FileSignature />}
          >
            Sign & issue
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Authorization type">
            <NativeSelect value={type} onChange={(e) => setType(e.target.value)}>
              <option>ATO with conditions (36 months)</option>
              <option>ATO (36 months)</option>
              <option>Continuous ATO (cATO)</option>
              <option>IATT (90 days)</option>
              <option>Denial of authorization</option>
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("expires")} label="Expires">
            <Input value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
        </Grid>
        <Field label="Conditions of authorization">
          <Textarea rows={4} value={conditions} onChange={(e) => setConditions(e.target.value)} />
        </Field>
      </Stack>
    </Dialog>
  );
}
