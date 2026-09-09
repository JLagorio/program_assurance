import { UnavailableAction } from "@/components/app/unavailable-action";
import { useRecordForm } from "@/lib/record-form";
import {
  Badge,
  Box,
  Button,
  buttonVariants,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Eyebrow,
  Field,
  Grid,
  Id,
  Indicator,
  Input,
  KeyValue,
  NativeSelect,
  Section,
  Stack,
  Table,
  Textarea,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { Check, Plus, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import {
  artifactShort,
  artifactTone,
  connectorSignals,
  evidenceStatusTone,
  healthTone,
  connectors as seedConnectors,
  threadEvidence as seedEvidence,
  mappingRules as seedRules,
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
              <UnavailableAction
                reason="No connector is connected to synchronize this evidence."
                variant="secondary"
                iconBefore={<RefreshCw />}
              >
                Sync now
              </UnavailableAction>
              <UnavailableAction
                reason="Connector setup is not available in this workspace."
                variant="secondary"
                iconBefore={<Plus />}
              >
                Add connector
              </UnavailableAction>
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
                    <Indicator tone={healthTone[c.health]}>{c.health}</Indicator>
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
              iconBefore={<Plus />}
            >
              New rule
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
                    <Indicator tone={r.enabled ? "success" : "neutral"}>{r.name}</Indicator>
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
                      variant="secondary"
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
              aria-label="Evidence status"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusFilters)[number])}
              size="small"
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
                    <Badge variant="secondary" tone={artifactTone[e.kind]}>
                      {artifactShort[e.kind]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell width={132}>
                    <Id>{e.controls.join(", ")}</Id>
                  </Table.Cell>
                  <Table.Cell width={64}>
                    <Id>{e.rule}</Id>
                  </Table.Cell>
                  <Table.Cell width={124}>
                    <Badge variant="secondary" tone={evidenceStatusTone[e.status]}>
                      {e.status}
                    </Badge>
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
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      draft: rule as MappingRule | null,
      controls: rule?.controls.join(", ") ?? "",
    },
    (value) => ({
      "draft.name": value.draft?.name,
      "draft.signal": value.draft?.signal,
      controls: value.controls,
    }),
  );
  const { draft, controls } = values;
  const setDraft = useCallback(
    (value: SetStateAction<typeof draft>) => setValue("draft", value),
    [setValue],
  );

  useEffect(() => {
    form.reset({ draft: rule, controls: rule?.controls.join(", ") ?? "" });
  }, [rule, form]);
  if (!rule || !draft) return null;

  const parsed = controls
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

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
          <DialogTitle>{creating ? "New mapping rule" : `${rule.id} — ${rule.name}`}</DialogTitle>
          <DialogDescription>
            Signals from engineering tools become NIST SP 800-53 evidence automatically.
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
                      onSave({ ...draft, controls: parsed });
                    },
                  });
                }}
              >
                <Stack space="space.150">
                  <form.Field name="draft.name">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Rule name"
                      >
                        <Input
                          value={field.state.value ?? ""}
                          placeholder="Multifactor authentication"
                          onChange={(e) => field.handleChange(e.target.value)}
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
                    <form.Field name="draft.source">
                      {(field) => (
                        <Field
                          label="Source tool"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <NativeSelect
                            value={draft.source}
                            onChange={(e) => {
                              const source = e.target.value as ConnectorKind;
                              setDraft({
                                ...draft,
                                source,
                                signal: connectorSignals[source][0] ?? "Label",
                              });
                            }}
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            {(Object.keys(connectorSignals) as ConnectorKind[]).map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="draft.signal">
                      {(field) => (
                        <Field
                          isRequired
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                          label="Signal"
                        >
                          <NativeSelect
                            value={field.state.value ?? ""}
                            onChange={(e) =>
                              field.handleChange(e.target.value as MappingRuleSignal)
                            }
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            {connectorSignals[draft.source].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                  </Grid>
                  <form.Field name="draft.match">
                    {(field) => (
                      <Field
                        label="Match expression"
                        hint="JQL fragment, path glob, commit trailer or stereotype."
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                      >
                        <Input
                          value={field.state.value ?? ""}
                          placeholder="sec:mfa OR component = Identity"
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="controls">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Mapped controls"
                        hint="Comma separated NIST SP 800-53 Rev. 5 control IDs."
                      >
                        <Input
                          value={field.state.value ?? ""}
                          placeholder="IA-2, IA-2(1)"
                          onChange={(e) => field.handleChange(e.target.value)}
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
                    <form.Field name="draft.confidence">
                      {(field) => (
                        <Field
                          label="Confidence"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <NativeSelect
                            value={field.state.value ?? ""}
                            onChange={(e) =>
                              field.handleChange(e.target.value as MappingRule["confidence"])
                            }
                            name={field.name}
                            onBlur={field.handleBlur}
                          >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <Field label="State">
                      <NativeSelect
                        value={draft.enabled ? "Enabled" : "Disabled"}
                        onChange={(e) =>
                          setDraft({ ...draft, enabled: e.target.value === "Enabled" })
                        }
                      >
                        <option>Enabled</option>
                        <option>Disabled</option>
                      </NativeSelect>
                    </Field>
                  </Grid>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow as="p">Rule as code</Eyebrow>
                <pre className="pt-100 whitespace-pre-wrap font-code font-body-xsmall text-subtle">
                  {ruleAsCode({ ...draft, controls: parsed })}
                </pre>
              </div>
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-1"}
              disabled={form.state.isSubmitting}
            >
              {creating ? "Create rule" : "Save rule"}
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
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
  const { form, values, formId, formRef } = useRecordForm(
    {
      statement: evidence?.statement ?? "",
    },
    (value) => ({ statement: value.statement }),
  );
  const { statement } = values;

  useEffect(() => {
    form.reset({ statement: evidence?.statement ?? "" });
  }, [evidence, form]);
  if (!evidence) return null;

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
          <DialogTitle>{evidence.title}</DialogTitle>
          <DialogDescription>{`${evidence.ref} · ${programId} · rule ${evidence.rule}`}</DialogDescription>
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
                      onStatus(evidence.id, "Accepted");
                    },
                  });
                }}
              >
                <Stack space="space.150">
                  <form.Field name="statement">
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Generated implementation statement"
                        hint="Drafted from the artifact and edited by the product security engineer before it enters the SSP."
                      >
                        <Textarea
                          rows={5}
                          name={field.name}
                          onBlur={field.handleBlur}
                          value={field.state.value ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
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
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow as="p">Thread detail</Eyebrow>
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
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => onStatus(evidence.id, "Rejected")}
              iconBefore={<X />}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-2"}
              iconBefore={<Check />}
              disabled={form.state.isSubmitting}
            >
              Accept into SSP
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
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
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <DialogTitle>Prepare a CDR package</DialogTitle>
          <DialogDescription>{`${programName} · ${programId}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <p>
            Review the generated artifacts, inspect their integrity digests, and download the actual
            bundle files in the export workspace. This prototype does not hold a signing key or
            issue government approvals.
          </p>
        </Box>
        <DialogFooter>
          <Link
            to="/programs/$programId/export"
            params={{ programId }}
            search={{ tab: "Air-gap bundle" }}
            className={buttonVariants({ variant: "primary" })}
          >
            Open package workspace
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
