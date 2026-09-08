import { useCallback, useId, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Badge,
  Block,
  Box,
  Button,
  DataTable,
  Fact,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  NativeSelect,
  Sheet,
  Stack,
  Text,
  Textarea,
  TextLink,
  defineColumns,
  useDataTable,
  toast,
  type Preset,
} from "@ledger/design-system";
import { assetById, assets, programFindings, type Finding } from "@/lib/findings";
import {
  createFinding,
  linkFindingEvidence,
  recordFindingRetest,
  updateFinding,
  useAssuranceVersion,
  type NewFinding,
} from "@/lib/assurance-record-store";
import { evidenceById, evidenceForProgram, useEvidenceVersion } from "@/lib/evidence-catalog";
import { scopesForProgram, scopeById } from "@/lib/scopes";
import {
  controlDerivationsForRequirement,
  requirementsForProgram,
  useRequirementsVersion,
} from "@/lib/requirements";
import { currentSession } from "@/lib/control-work";
import { severityTone, statusTone, type FindingSeverity } from "@/lib/spine";
import { poamById } from "@/lib/register";
import { NewPoamSheet, PoamRecordSheet } from "@/components/app/program-poams";
import { campaignById, eventsByCampaign, objectivesForEvent } from "@/lib/campaigns";
import { objectiveEvidence, requirementsForObjective } from "@/lib/requirement-verification";
import { resolvedObjectiveResult, runById } from "@/lib/test-execution";
import { getRequirement } from "@/lib/requirements";
import { EvidencePreview } from "@/components/app/program-evidence";

function report(error: unknown, setError: (message: string) => void) {
  setError(error instanceof Error ? error.message : "The record could not be saved.");
}
function findingDate(value: string) {
  if (!value) return "—";
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
}

const findingPresets: Preset[] = [
  { id: "all", label: "All" },
  {
    id: "open",
    label: "Open",
    filters: [{ id: "lifecycle", value: ["Open", "Triaged", "Remediating", "Retest pending"] }],
  },
  { id: "unassigned", label: "No POA&M", filters: [{ id: "remediation", value: ["Unassigned"] }] },
  {
    id: "retest",
    label: "Retest pending",
    filters: [{ id: "lifecycle", value: ["Retest pending"] }],
  },
];

export function ProgramFindings({
  programId,
  initialFindingId,
  initialAssessmentId,
  onFindingChange,
}: {
  programId: string;
  initialFindingId?: string | undefined;
  initialAssessmentId?: string | undefined;
  onFindingChange?: ((id: string | null) => void) | undefined;
}) {
  const version = useAssuranceVersion();
  const [selected, setSelected] = useState<string | null>(initialFindingId ?? null);
  const [creating, setCreating] = useState(Boolean(initialAssessmentId));
  const select = useCallback(
    (id: string | null) => {
      setSelected(id);
      onFindingChange?.(id);
    },
    [onFindingChange],
  );
  const rows = useMemo(
    () =>
      programFindings(programId).map((finding) => ({
        ...finding,
        control: (finding.controls ?? [finding.control]).join(", "),
        affected:
          finding.assets?.map((id) => assetById.get(id)?.name ?? id).join(", ") ||
          (assetById.get(finding.asset)?.name ??
            scopeById.get(finding.scope ?? "")?.name ??
            "Program"),
        remediation: finding.poam ?? "Unassigned",
      })),
    // Records mutate in the shared store; its version invalidates this projection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, version],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("id", {
          header: "Finding",
          width: 140,
          hideable: false,
          pin: "start",
          preview: (row) => select(row.id),
          cell: (row) => (
            <Button size="small" variant="link" onClick={() => select(row.id)}>
              <Id>{row.id}</Id>
            </Button>
          ),
        }),
        c.text("title", { header: "Observed condition", minWidth: 270, hideable: false }),
        c.status("mitigatedSeverity", {
          header: "Severity",
          width: 110,
          tone: (row) => severityTone(row.mitigatedSeverity),
        }),
        c.status("lifecycle", {
          header: "Status",
          width: 140,
          tone: (row) => statusTone(row.lifecycle),
        }),
        c.text("control", { header: "Control", width: 110 }),
        c.text("affected", { header: "Affected system / asset", width: 220 }),
        c.text("owner", { header: "Owner", width: 160 }),
        c.text("remediation", { header: "POA&M", width: 130 }),
        c.text("source", { header: "Source", width: 160 }),
        c.text("lastSeen", {
          header: "Last assessed",
          width: 145,
          cell: (row) => findingDate(row.lastSeen),
        }),
        c.actions((row) => [{ label: "Review finding", onSelect: () => select(row.id) }]),
      ]),
    [select],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program findings",
    view: `program-findings-${programId}`,
    resizable: true,
    reorderable: true,
  });
  const create = (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
      New finding
    </Button>
  );
  return (
    <>
      <DataTable
        table={table}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Find a finding" />
            <DataTable.Presets
              table={table}
              presets={findingPresets}
              variant="menu"
              aria-label="Saved views"
            />
            <DataTable.Filter table={table} column="lifecycle" />
            <DataTable.Filter table={table} column="mitigatedSeverity" />
            <DataTable.Filter table={table} column="remediation" />
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
              {create}
            </Inline>
          </Inline>
        }
        empty={{
          title: rows.length ? "No findings match" : "No findings recorded",
          description: rows.length
            ? "Clear the filters or try another search."
            : "Record an observed deficiency against this program's controls and requirements.",
          action: rows.length ? undefined : create,
        }}
      />
      {creating ? (
        <NewFindingSheet
          programId={programId}
          assessmentId={initialAssessmentId}
          onClose={() => {
            setCreating(false);
            if (initialAssessmentId) onFindingChange?.(null);
          }}
          onCreated={(finding) => {
            setCreating(false);
            select(finding.id);
          }}
        />
      ) : null}
      {selected ? (
        <FindingRecordSheet
          key={selected}
          programId={programId}
          findingId={selected}
          onClose={() => select(null)}
        />
      ) : null}
    </>
  );
}

function NewFindingSheet({
  programId,
  assessmentId,
  onClose,
  onCreated,
}: {
  programId: string;
  assessmentId?: string | undefined;
  onClose: () => void;
  onCreated: (finding: Finding) => void;
}) {
  useEvidenceVersion();
  useRequirementsVersion();
  const formId = useId();
  const [error, setError] = useState("");
  const assessment = assessmentId ? campaignById.get(assessmentId) : undefined;
  const assessmentEvent =
    assessment?.program === programId ? eventsByCampaign(assessment.id)[0] : undefined;
  const assessmentObjectives =
    assessment?.program === programId
      ? eventsByCampaign(assessment.id).flatMap((event) => objectivesForEvent(event.id))
      : [];
  const objective =
    assessmentObjectives.find((candidate) =>
      ["Not met", "Partially met"].includes(resolvedObjectiveResult(candidate.id).result),
    ) ?? assessmentObjectives[0];
  const result = objective ? resolvedObjectiveResult(objective.id) : undefined;
  const contributingRun = result?.run ? runById(result.run) : undefined;
  const observedDeficiencies =
    contributingRun?.records
      .filter((record) => record.result === "Fail")
      .map((record) => record.observed)
      .filter(Boolean) ?? [];
  const requirement = objective
    ? getRequirement(requirementsForObjective(objective.id)[0] ?? "")
    : undefined;
  const [draft, setDraft] = useState({
    title: observedDeficiencies.length
      ? `Deficiency: ${objective?.statement ?? assessment?.name}`
      : "",
    detail: observedDeficiencies.join("\n\n"),
    owner: currentSession().name,
    control: requirement
      ? (controlDerivationsForRequirement(requirement.id)[0]?.sourceId ?? "")
      : "",
    cci: objective?.ccis[0] ?? "",
    scope: "",
    asset: assessmentEvent?.assets[0] ?? "",
    requirement: requirement?.id ?? "",
    severity: "CAT II" as FindingSeverity,
    source: (assessment ? "Test event" : "Manual procedure") as Finding["source"],
    method: (objective?.method === "Interview"
      ? "Interview"
      : objective?.method === "Examination" || !assessment
        ? "Examine"
        : "Test") as Finding["assessment"]["method"],
    evidence: objective ? (objectiveEvidence(objective.id)[0] ?? "") : "",
    recommendation: "",
  });
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const programAssets = assets.filter((asset) => asset.program === programId);
  const evidence = evidenceForProgram(programId);
  return (
    <Sheet
      open
      onClose={onClose}
      title="New finding"
      subtitle="Record the condition, affected system and evidence."
      width={640}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" form={formId} type="submit">
            Create finding
          </Button>
        </>
      }
    >
      <form
        noValidate
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          try {
            const input: NewFinding = {
              ...draft,
              program: programId,
              assessmentId,
              scope: draft.scope || undefined,
              asset: draft.asset || undefined,
              requirements: draft.requirement ? [draft.requirement] : [],
              evidence: draft.evidence ? [draft.evidence] : [],
              assessor: currentSession().name,
            };
            const finding = createFinding(input);
            toast.success("Finding created");
            onCreated(finding);
          } catch (failure) {
            report(failure, setError);
          }
        }}
      >
        <Stack space="space.150">
          {error ? (
            <p role="alert" className="font-body text-danger">
              {error}
            </p>
          ) : null}
          {assessment ? <Text size="small">Assessment: {assessment.name}</Text> : null}
          <Field label="Finding title" isRequired>
            <Input value={draft.title} onChange={(event) => set("title", event.target.value)} />
          </Field>
          <Field
            label="Observed condition"
            isRequired
            hint="Describe what failed and the requirement it fails to meet."
          >
            <Textarea
              rows={4}
              value={draft.detail}
              onChange={(event) => set("detail", event.target.value)}
            />
          </Field>
          <Grid templateColumns="1fr 1fr" gap="space.150">
            <Field label="Control" isRequired>
              <Input
                placeholder="AC-2"
                value={draft.control}
                onChange={(event) => set("control", event.target.value)}
              />
            </Field>
            <Field label="CCI (optional)">
              <Input
                placeholder="CCI-000016"
                value={draft.cci}
                onChange={(event) => set("cci", event.target.value)}
              />
            </Field>
            <Field label="Severity">
              <NativeSelect
                value={draft.severity}
                onChange={(event) => set("severity", event.target.value as FindingSeverity)}
              >
                {["CAT I", "CAT II", "CAT III"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Owner" isRequired>
              <Input value={draft.owner} onChange={(event) => set("owner", event.target.value)} />
            </Field>
            <Field label="Assessment scope">
              <NativeSelect
                value={draft.scope}
                onChange={(event) => set("scope", event.target.value)}
              >
                <option value="">Program-wide</option>
                {scopesForProgram(programId).map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Affected asset">
              <NativeSelect
                value={draft.asset}
                onChange={(event) => set("asset", event.target.value)}
              >
                <option value="">No individual asset</option>
                {programAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </Grid>
          <Field label="Related requirement">
            <NativeSelect
              value={draft.requirement}
              onChange={(event) => {
                const requirementId = event.target.value;
                setDraft((previous) => ({
                  ...previous,
                  requirement: requirementId,
                  control:
                    previous.control ||
                    controlDerivationsForRequirement(requirementId)[0]?.sourceId ||
                    "",
                }));
              }}
            >
              <option value="">No engineering requirement linked</option>
              {requirementsForProgram(programId).map((requirement) => (
                <option key={requirement.id} value={requirement.id}>
                  {requirement.id} · {requirement.text}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Source">
            <NativeSelect
              value={draft.source}
              onChange={(event) => set("source", event.target.value as Finding["source"])}
            >
              {["Manual procedure", "Test event", "STIG checklist", "ACAS scan", "Code scan"].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </NativeSelect>
          </Field>
          <Field label="Assessment method">
            <NativeSelect
              value={draft.method}
              onChange={(event) =>
                set("method", event.target.value as Finding["assessment"]["method"])
              }
            >
              <option>Examine</option>
              <option>Interview</option>
              <option>Test</option>
            </NativeSelect>
          </Field>
          <Field
            label="Supporting evidence"
            hint="Add artifacts in the Evidence tab, then link them here."
          >
            <NativeSelect
              value={draft.evidence}
              onChange={(event) => set("evidence", event.target.value)}
            >
              <option value="">Evidence not yet attached</option>
              {evidence.map((artifact) => (
                <option key={artifact.id} value={artifact.id}>
                  {artifact.id} · {artifact.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Recommended remediation">
            <Textarea
              rows={3}
              value={draft.recommendation}
              onChange={(event) => set("recommendation", event.target.value)}
            />
          </Field>
        </Stack>
      </form>
    </Sheet>
  );
}

export function FindingRecordSheet({
  programId,
  findingId,
  onClose,
}: {
  programId: string;
  findingId: string;
  onClose: () => void;
}) {
  useAssuranceVersion();
  useEvidenceVersion();
  const finding = programFindings(programId).find((item) => item.id === findingId);
  return finding ? (
    <FindingEditor key={finding.id} finding={finding} programId={programId} onClose={onClose} />
  ) : (
    <Sheet open onClose={onClose} title="Finding unavailable">
      <Text>This finding is not in this program.</Text>
    </Sheet>
  );
}

function FindingEditor({
  finding,
  programId,
  onClose,
}: {
  finding: Finding;
  programId: string;
  onClose: () => void;
}) {
  const formId = useId();
  const [error, setError] = useState("");
  const [owner, setOwner] = useState(finding.owner);
  const [title, setTitle] = useState(finding.title);
  const [detail, setDetail] = useState(finding.detail);
  const [lifecycle, setLifecycle] = useState(finding.lifecycle);
  const [lifecycleEdited, setLifecycleEdited] = useState(false);
  const [recommendation, setRecommendation] = useState(finding.recommendation);
  const [mitigation, setMitigation] = useState(finding.mitigation ?? "");
  const [retesting, setRetesting] = useState(false);
  const [creatingPoam, setCreatingPoam] = useState(false);
  const [poamId, setPoamId] = useState<string | null>(null);
  const [result, setResult] = useState<"Passed" | "Failed">("Passed");
  const [retestEvidence, setRetestEvidence] = useState("");
  const [retestNote, setRetestNote] = useState("");
  const [assessor, setAssessor] = useState(currentSession().name);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [attachEvidence, setAttachEvidence] = useState("");
  const artifacts = evidenceForProgram(programId);
  const evidenceIds = [
    ...new Set([finding.sourceArtifact, ...finding.assessment.evidence].filter(Boolean)),
  ];
  const save = () => {
    setError("");
    try {
      updateFinding(finding.id, {
        title,
        detail,
        owner,
        lifecycle: lifecycleEdited ? lifecycle : finding.lifecycle,
        recommendation,
        mitigation,
      });
      setLifecycleEdited(false);
      toast.success("Finding updated");
      return true;
    } catch (failure) {
      report(failure, setError);
      return false;
    }
  };
  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={finding.title}
        subtitle={finding.id}
        width={720}
        eyebrow={
          <>
            <Badge variant="secondary" tone={severityTone(finding.mitigatedSeverity)}>
              {finding.mitigatedSeverity}
            </Badge>
            <Badge variant="secondary" tone={statusTone(finding.lifecycle)}>
              {finding.lifecycle}
            </Badge>
          </>
        }
        facts={
          <>
            <Fact label="Controls">{(finding.controls ?? [finding.control]).join(", ")}</Fact>
            <Fact label="Affected">
              {finding.assets?.map((id) => assetById.get(id)?.name ?? id).join(", ") ||
                (assetById.get(finding.asset)?.name ??
                  scopeById.get(finding.scope ?? "")?.name ??
                  "Program")}
            </Fact>
            <Fact label="Source">{finding.source}</Fact>
          </>
        }
        footer={
          <>
            <Button onClick={onClose}>Done</Button>
            <Button variant="primary" type="submit" form={formId}>
              Save changes
            </Button>
          </>
        }
      >
        <form
          noValidate
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Stack space="space.200">
            {error ? (
              <p role="alert" className="font-body text-danger">
                {error}
              </p>
            ) : null}
            <Field label="Finding title" isRequired>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Block title="Observed condition">
              <Field label="Observed condition" isRequired>
                <Textarea
                  rows={4}
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                />
              </Field>
              <Inline space="space.150" shouldWrap className="pt-100">
                {(finding.controls ?? [finding.control]).filter(Boolean).map((control) => (
                  <TextLink key={control}>
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: control }}
                    >
                      Control {control}
                    </Link>
                  </TextLink>
                ))}
                {finding.requirements?.map((id) => (
                  <TextLink key={id}>
                    <Link
                      to="/programs/$programId/requirements/$requirementId"
                      params={{ programId, requirementId: id }}
                    >
                      {id}
                    </Link>
                  </TextLink>
                ))}
              </Inline>
            </Block>
            <Grid templateColumns="1fr 1fr" gap="space.150">
              <Field label="Owner" isRequired>
                <Input value={owner} onChange={(event) => setOwner(event.target.value)} />
              </Field>
              <Field label="Status">
                <NativeSelect
                  value={lifecycleEdited ? lifecycle : finding.lifecycle}
                  onChange={(event) => {
                    setLifecycle(event.target.value as Finding["lifecycle"]);
                    setLifecycleEdited(true);
                  }}
                >
                  {[
                    "Open",
                    "Triaged",
                    "Remediating",
                    "Retest pending",
                    "Risk accepted",
                    "False positive",
                    ...(finding.lifecycle === "Closed" ? ["Closed"] : []),
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </NativeSelect>
              </Field>
            </Grid>
            <Field label="Remediation recommendation">
              <Textarea
                rows={3}
                value={recommendation}
                onChange={(event) => setRecommendation(event.target.value)}
              />
            </Field>
            <Field label="Mitigation / disposition rationale">
              <Textarea
                rows={3}
                value={mitigation}
                onChange={(event) => setMitigation(event.target.value)}
              />
            </Field>
            <Block title="Supporting evidence" count={evidenceIds.length}>
              {evidenceIds.length ? (
                <Stack space="space.100">
                  {evidenceIds.map((id) => (
                    <Button key={id} type="button" variant="link" onClick={() => setEvidenceId(id)}>
                      <Id>{id}</Id> · {evidenceById(id)?.label ?? "Artifact metadata unavailable"}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <Text size="small" color="color.text.subtle">
                  No evidence attached.
                </Text>
              )}
              <Inline space="space.100" alignBlock="end" className="pt-150">
                <Field label="Attach supporting evidence" className="min-w-0 flex-1">
                  <NativeSelect
                    value={attachEvidence}
                    onChange={(event) => setAttachEvidence(event.target.value)}
                  >
                    <option value="">Select an artifact</option>
                    {artifacts
                      .filter((artifact) => !evidenceIds.includes(artifact.id))
                      .map((artifact) => (
                        <option key={artifact.id} value={artifact.id}>
                          {artifact.id} · {artifact.label}
                        </option>
                      ))}
                  </NativeSelect>
                </Field>
                <Button
                  type="button"
                  disabled={!attachEvidence}
                  onClick={() => {
                    setError("");
                    try {
                      linkFindingEvidence(finding.id, attachEvidence);
                      setAttachEvidence("");
                      toast.success("Evidence attached");
                    } catch (failure) {
                      report(failure, setError);
                    }
                  }}
                >
                  Attach
                </Button>
              </Inline>
              <p className="pt-100 font-body-small text-subtle">
                Assessed by {finding.assessment.assessedBy} ·{" "}
                {findingDate(finding.assessment.assessedOn)}
              </p>
            </Block>
            <Block title="Remediation commitment">
              {finding.poam ? (
                <Button
                  type="button"
                  size="small"
                  variant="link"
                  onClick={() => setPoamId(finding.poam!)}
                >
                  {finding.poam} · {poamById.get(finding.poam)?.title}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="small"
                  onClick={() => {
                    if (save()) setCreatingPoam(true);
                  }}
                >
                  Create POA&M from finding
                </Button>
              )}
            </Block>
            <Block title="Retest and closure" count={finding.retests?.length ?? 0}>
              {finding.sourceStatus === "closed" && !finding.retests?.length ? (
                <Badge tone="warning">Imported closure · passing retest not recorded</Badge>
              ) : null}
              {finding.retests?.map((retest) => (
                <Box key={retest.id} className="border-b border-default" paddingBlock="space.100">
                  <Inline space="space.100">
                    <Badge
                      variant="secondary"
                      tone={retest.result === "Passed" ? "success" : "danger"}
                    >
                      {retest.result}
                    </Badge>
                    <Text size="small">
                      {retest.assessor} · {findingDate(retest.assessedOn)}
                    </Text>
                  </Inline>
                  <p className="pt-100 font-body whitespace-pre-wrap">{retest.note}</p>
                  <Text size="small" color="color.text.subtle">
                    {retest.evidence.join(", ")}
                  </Text>
                </Box>
              ))}
              {finding.lifecycle !== "Closed" ? (
                <Button type="button" size="small" onClick={() => setRetesting(!retesting)}>
                  {retesting ? "Cancel retest entry" : "Record retest"}
                </Button>
              ) : null}
              {retesting ? (
                <Stack space="space.150" className="pt-150">
                  <Grid templateColumns="1fr 1fr" gap="space.150">
                    <Field label="Retest result">
                      <NativeSelect
                        value={result}
                        onChange={(event) => setResult(event.target.value as "Passed" | "Failed")}
                      >
                        <option>Passed</option>
                        <option>Failed</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Assessor" isRequired>
                      <Input
                        value={assessor}
                        onChange={(event) => setAssessor(event.target.value)}
                      />
                    </Field>
                  </Grid>
                  <Field label="Retest evidence" isRequired>
                    <NativeSelect
                      value={retestEvidence}
                      onChange={(event) => setRetestEvidence(event.target.value)}
                    >
                      <option value="">Select a supporting artifact</option>
                      {artifacts.map((artifact) => (
                        <option value={artifact.id} key={artifact.id}>
                          {artifact.id} · {artifact.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Retest determination" isRequired>
                    <Textarea
                      rows={3}
                      value={retestNote}
                      onChange={(event) => setRetestNote(event.target.value)}
                    />
                  </Field>
                  <Button
                    type="button"
                    size="small"
                    variant="primary"
                    onClick={() => {
                      setError("");
                      try {
                        recordFindingRetest(finding.id, {
                          result,
                          evidence: retestEvidence ? [retestEvidence] : [],
                          note: retestNote,
                          assessor,
                        });
                        setLifecycle(result === "Passed" ? "Closed" : "Remediating");
                        setLifecycleEdited(false);
                        setRetesting(false);
                        toast.success(
                          result === "Passed"
                            ? "Finding closed with retest evidence"
                            : "Retest recorded; remediation remains open",
                        );
                      } catch (failure) {
                        report(failure, setError);
                      }
                    }}
                  >
                    {result === "Passed"
                      ? "Record passing retest and close"
                      : "Record failed retest"}
                  </Button>
                </Stack>
              ) : null}
            </Block>
          </Stack>
        </form>
      </Sheet>
      {creatingPoam ? (
        <NewPoamSheet
          programId={programId}
          findingIds={[finding.id]}
          onClose={() => setCreatingPoam(false)}
          onCreated={(poam) => {
            setCreatingPoam(false);
            setPoamId(poam.id);
            setLifecycle("Remediating");
            setLifecycleEdited(false);
          }}
        />
      ) : null}
      {poamId ? (
        <PoamRecordSheet
          key={poamId}
          programId={programId}
          poamId={poamId}
          onClose={() => setPoamId(null)}
        />
      ) : null}
      {evidenceId && evidenceById(evidenceId) ? (
        <EvidencePreview artifact={evidenceById(evidenceId)!} onClose={() => setEvidenceId(null)} />
      ) : null}
    </>
  );
}
