import { UnavailableAction } from "@/components/app/unavailable-action";
import { useRecordForm } from "@/lib/record-form";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dot,
  Eyebrow,
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
  ProgressValue,
  Section,
  Stack,
  Table,
  Textarea,
} from "@ledger/design-system";
import { Check, FileSignature, Lock, Plus, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  residualTone,
  scaObservations as seedObservations,
  residualRisks as seedRisks,
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
              <UnavailableAction
                reason="Version locking is not available on this draft view."
                variant="secondary"
                iconBefore={<Lock />}
              >
                Lock version
              </UnavailableAction>
              <UnavailableAction
                reason="Submission is unavailable until a receiving service is connected."
                variant="primary"
                iconBefore={<FileSignature />}
              >
                Submit to SCA
              </UnavailableAction>
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
              <Box className="shrink-0" style={{ width: 180, maxWidth: "100%" }}>
                <Progress
                  value={readiness}
                  tone={readiness >= 80 ? "success" : "information"}
                  aria-hidden
                  className="flex-nowrap [&_[data-slot=progress-track]]:order-first [&_[data-slot=progress-track]]:min-w-0 [&_[data-slot=progress-track]]:flex-1"
                >
                  <ProgressValue />
                </Progress>
              </Box>
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
                    <Badge variant="secondary" tone={packageStatusTone[a.status]}>
                      {a.status}
                    </Badge>
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
                    <Badge variant="secondary" tone={grantTone[g.status]}>
                      {g.status}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        {/* ------------------------------------------------- live POA&M tracker */}
        <Section
          title="Live POA&M tracker"
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
                    <Badge variant="secondary" tone={observationTone[o.status]}>
                      {o.status}
                    </Badge>
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
  const { form, values, formId, formRef } = useRecordForm(
    {
      title: "",
      severity: "CAT II" as ScaObservation["severity"],
      control: "",
      due: "Sep 15, 2026",
      detail: "",
    },
    (value) => ({ title: value.title, control: value.control }),
  );
  const { title, severity, control, due, detail } = values;

  if (!open) return null;

  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>Log assessor observation</DialogTitle>
          <DialogDescription>
            Logged directly by the SCA in the enclave — no spreadsheets, no email.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId + "-1"}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit({
                    save: () => {
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
                    },
                  });
                }}
              >
                <Stack space="space.150">
                  <form.Field name="title">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Observation"
                      >
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Session termination not enforced on maintenance console"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
                  >
                    <form.Field name="severity">
                      {(field) => (
                        <Field
                          label="Severity"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <NativeSelect
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value as ScaObservation["severity"])
                            }
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            <option>CAT I</option>
                            <option>CAT II</option>
                            <option>CAT III</option>
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="control">
                      {(field) => (
                        <Field
                          isRequired
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                          label="Control"
                        >
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="AC-12"
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="due">
                      {(field) => (
                        <Field
                          label="Response due"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </Grid>
                  <form.Field name="detail">
                    {(field) => (
                      <Field
                        label="Assessor detail"
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                      >
                        <Textarea
                          rows={4}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="What was observed, where, and under what test conditions…"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
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
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-1"}
              iconBefore={<Check />}
              disabled={form.state.isSubmitting}
            >
              Log observation
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
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
  const { form, values, formId, formRef } = useRecordForm(
    {
      status: "Triaged" as ScaObservationStatus,
      project: "TRIDENT",
      assignee: jiraAssignees[0]!,
      due: "",
      response: "",
    },
    (value) => ({ assignee: value.assignee, due: value.due, response: value.response }),
  );
  const { status, project, assignee, due, response } = values;

  useEffect(() => {
    if (observation)
      form.reset({
        status: observation.status === "Logged" ? "Triaged" : observation.status,
        project: observation.jira?.split("-")[0] ?? "TRIDENT",
        assignee: observation.assignee !== "—" ? observation.assignee : jiraAssignees[0]!,
        due: observation.due,
        response: observation.response,
      });
  }, [observation, form]);
  if (!observation) return null;

  const jira =
    observation.jira ??
    `${project}-${4400 + (observation.id.charCodeAt(observation.id.length - 1) % 90)}`;

  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>{observation.title}</DialogTitle>
          <DialogDescription>{`${observation.id} · ${observation.control} · logged ${observation.logged} by ${observation.loggedBy}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId + "-2"}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit({
                    save: () => {
                      onSave({
                        ...observation,
                        status,
                        jira: status === "Triaged" ? observation.jira : jira,
                        assignee,
                        due,
                        response,
                      });
                    },
                  });
                }}
              >
                <Stack space="space.150">
                  <p className="font-body text-subtle">{observation.detail}</p>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(4, minmax(0, 1fr))" }}
                  >
                    <form.Field name="status">
                      {(field) => (
                        <Field
                          label="Status"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <NativeSelect
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value as ScaObservationStatus)
                            }
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            {observationStatuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="project">
                      {(field) => (
                        <Field
                          label="Jira project"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <NativeSelect
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            {jiraProjects.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="assignee">
                      {(field) => (
                        <Field
                          isRequired
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                          label="Assignee"
                        >
                          <NativeSelect
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            {jiraAssignees.map((a) => (
                              <option key={a}>{a}</option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="due">
                      {(field) => (
                        <Field
                          isRequired
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                          label="Due"
                        >
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </Grid>
                  <form.Field name="response">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Program response to the assessor"
                      >
                        <Textarea
                          rows={4}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
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
                    <Badge variant="secondary" tone={observationTone[observation.status]}>
                      {observation.status}
                    </Badge>
                  </KeyValue>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-2"}
              iconBefore={<Check />}
              disabled={form.state.isSubmitting}
            >
              Save & sync
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------ grant modal */

function GrantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { form, values } = useRecordForm(
    {
      email: "",
      role: "SCA team",
      access: "Read only",
    },
    (value) => ({ email: value.email }),
  );
  const { email, role, access } = values;

  if (!open) return null;
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <DialogTitle>Grant enclave access</DialogTitle>
          <DialogDescription>
            Scoped, expiring, read-only access to this authorization package.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <Stack space="space.150">
            <form.Field name="email">
              {(field) => (
                <Field
                  isRequired
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                  label="Government email"
                  hint=".mil or .gov only"
                >
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="first.last@us.navy.mil"
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
            <Grid
              gap="space.150"
              templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
            >
              <form.Field name="role">
                {(field) => (
                  <Field
                    label="Role"
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <NativeSelect
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      name={field.name}
                      onBlur={field.handleBlur}
                    >
                      <option>SCA</option>
                      <option>SCA team</option>
                      <option>AO</option>
                      <option>AODR</option>
                    </NativeSelect>
                  </Field>
                )}
              </form.Field>
              <form.Field name="access">
                {(field) => (
                  <Field
                    label="Access"
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <NativeSelect
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      name={field.name}
                      onBlur={field.handleBlur}
                    >
                      <option>Read only</option>
                      <option>Read + comment</option>
                      <option>Sign authority</option>
                    </NativeSelect>
                  </Field>
                )}
              </form.Field>
            </Grid>
          </Stack>
        </Box>
        <DialogFooter>
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <UnavailableAction
              reason="Signing and access administration require connected services. This workspace cannot issue approvals or grant access."
              variant="primary"
              iconBefore={<Check />}
            >
              Send invite
            </UnavailableAction>
          </>
        </DialogFooter>
      </DialogContent>
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
              <Box className="shrink-0" style={{ width: 180, maxWidth: "100%" }}>
                <Progress
                  value={progress}
                  tone={pending.length > 0 ? "warning" : "success"}
                  aria-hidden
                  className="flex-nowrap [&_[data-slot=progress-track]]:order-first [&_[data-slot=progress-track]]:min-w-0 [&_[data-slot=progress-track]]:flex-1"
                >
                  <ProgressValue />
                </Progress>
              </Box>
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

        <Section title="Residual risk acceptance">
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
                    <Badge variant="secondary" tone={residualTone[r.residual]}>
                      {r.residual}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Id>{r.poam}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="secondary" tone={decisionTone[r.decision]}>
                      {r.decision}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section title="Open assessor observations">
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
                    <Badge variant="secondary" tone={observationTone[o.status]}>
                      {o.status}
                    </Badge>
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
  const { form, values, formId, formRef } = useRecordForm(
    {
      decision: "Accepted" as ResidualRisk["decision"],
      rationale: "",
    },
    (value) => ({ rationale: value.rationale }),
  );
  const { decision, rationale } = values;

  useEffect(() => {
    if (risk)
      form.reset({
        decision: risk.decision === "Pending AO" ? "Accepted" : risk.decision,
        rationale: risk.rationale,
      });
  }, [risk, form]);
  if (!risk) return null;

  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>{risk.title}</DialogTitle>
          <DialogDescription>{`${risk.id} · ${risk.control} · ${risk.poam}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId + "-3"}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit({
                    save: () => {
                      onSave({ ...risk, decision, rationale });
                    },
                  });
                }}
              >
                <Stack space="space.150">
                  <p className="font-body text-subtle">Mitigation in place: {risk.mitigation}</p>
                  <form.Field name="decision">
                    {(field) => (
                      <Field
                        label="AO decision"
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                      >
                        <NativeSelect
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(e.target.value as ResidualRisk["decision"])
                          }
                          name={field.name}
                          onBlur={field.handleBlur}
                        >
                          <option>Accepted</option>
                          <option>Rejected</option>
                          <option>Deferred</option>
                          <option>Pending AO</option>
                        </NativeSelect>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="rationale">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Rationale for the record"
                      >
                        <Textarea
                          rows={4}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Basis for acceptance, conditions, and review point…"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <Stack space="space.150">
                <Eyebrow as="p">Risk profile</Eyebrow>
                <Stack space="space.075">
                  <KeyValue label="Likelihood">{risk.likelihood}</KeyValue>
                  <KeyValue label="Impact">{risk.impact}</KeyValue>
                  <KeyValue label="Residual">
                    <Badge variant="secondary" tone={residualTone[risk.residual]}>
                      {risk.residual}
                    </Badge>
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
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-3"}
              iconBefore={<ShieldCheck />}
              disabled={form.state.isSubmitting}
            >
              Record decision
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { form, values } = useRecordForm(
    {
      type: authorization.type,
      expires: "Oct 02, 2029",
      conditions:
        "Close POAM-0031 and POAM-0044 within 90 days. Submit continuous monitoring report quarterly.",
    },
    (value) => ({ expires: value.expires }),
  );
  const { type, expires, conditions } = values;

  if (!open) return null;
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>Issue authorization memo</DialogTitle>
          <DialogDescription>
            Signed by the Authorizing Official and distributed to the program and the SCA.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <Stack space="space.150">
                <Grid
                  gap="space.150"
                  templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                >
                  <form.Field name="type">
                    {(field) => (
                      <Field
                        label="Authorization type"
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                      >
                        <NativeSelect
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        >
                          <option>ATO with conditions (36 months)</option>
                          <option>ATO (36 months)</option>
                          <option>Continuous ATO (cATO)</option>
                          <option>IATT (90 days)</option>
                          <option>Denial of authorization</option>
                        </NativeSelect>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="expires">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Expires"
                      >
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                </Grid>
                <form.Field name="conditions">
                  {(field) => (
                    <Field
                      label="Conditions of authorization"
                      error={
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined
                      }
                    >
                      <Textarea
                        rows={4}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                    </Field>
                  )}
                </form.Field>
              </Stack>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
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
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <UnavailableAction
              reason="Signing and access administration require connected services. This workspace cannot issue approvals or grant access."
              variant="primary"
              iconBefore={<FileSignature />}
            >
              Sign & issue
            </UnavailableAction>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
