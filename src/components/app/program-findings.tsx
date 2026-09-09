import {
  FieldLabel,
  FieldDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Block,
  Box,
  Button,
  DataTable,
  defineColumns,
  Fact,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Text,
  Textarea,
  TextLink,
  toast,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { EvidencePreview } from "@/components/app/program-evidence";
import { NewPoamSheet, PoamRecordSheet } from "@/components/app/program-poams";
import {
  createFinding,
  linkFindingEvidence,
  recordFindingRetest,
  updateFinding,
  useAssuranceVersion,
  type NewFinding,
} from "@/lib/assurance-record-store";
import { campaignById, eventsByCampaign, objectivesForEvent } from "@/lib/campaigns";
import { currentSession } from "@/lib/control-work";
import { evidenceById, evidenceForProgram, useEvidenceVersion } from "@/lib/evidence-catalog";
import { assetById, assets, programFindings, type Finding } from "@/lib/findings";
import { poamById } from "@/lib/register";
import { objectiveEvidence, requirementsForObjective } from "@/lib/requirement-verification";
import {
  controlDerivationsForRequirement,
  getRequirement,
  requirementsForProgram,
  useRequirementsVersion,
} from "@/lib/requirements";
import { scopeById, scopesForProgram } from "@/lib/scopes";
import { severityTone, statusTone, type FindingSeverity } from "@/lib/spine";
import { resolvedObjectiveResult, runById } from "@/lib/test-execution";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";

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
  const fieldId = useId();

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
  const severityItems = ["CAT I", "CAT II", "CAT III"].map((value) => ({
    value: value,
    label: value,
  }));
  const scopeItems = [
    { value: "", label: "Program-wide" },
    ...scopesForProgram(programId).map((scope) => ({
      value: scope.id,
      label: scope.name,
    })),
  ];
  const assetItems = [
    { value: "", label: "No individual asset" },
    ...programAssets.map((asset) => ({ value: asset.id, label: asset.name })),
  ];
  const requirementItems = [
    { value: "", label: "No engineering requirement linked" },
    ...requirementsForProgram(programId).map((requirement) => ({
      value: requirement.id,
      label: (
        <>
          {requirement.id} · {requirement.text}
        </>
      ),
    })),
  ];
  const sourceItems = [
    "Manual procedure",
    "Test event",
    "STIG checklist",
    "ACAS scan",
    "Code scan",
  ].map((value) => ({ value: value, label: value }));
  const methodItems = [
    { value: "Examine", label: "Examine" },
    { value: "Interview", label: "Interview" },
    { value: "Test", label: "Test" },
  ];
  const evidenceItems = [
    { value: "", label: "Evidence not yet attached" },
    ...evidence.map((artifact) => ({
      value: artifact.id,
      label: (
        <>
          {artifact.id} · {artifact.label}
        </>
      ),
    })),
  ];
  return (
    <Sheet
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 640 }}>
        <SheetHeader>
          <Box className="flex items-start gap-100">
            <Box className="flex min-w-0 flex-1 flex-col gap-025">
              <SheetTitle>New finding</SheetTitle>
              <SheetDescription>
                Record the condition, affected system and evidence.
              </SheetDescription>
            </Box>
          </Box>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
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
              <Field>
                <FieldLabel
                  id={`${fieldId}-finding-title-1-label`}
                  htmlFor={`${fieldId}-finding-title-1`}
                >
                  {"Finding title"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-finding-title-1`}
                  aria-labelledby={`${fieldId}-finding-title-1-label`}
                  aria-required={true}
                  value={draft.title}
                  onChange={(event) => set("title", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-observed-condition-2-label`}
                  htmlFor={`${fieldId}-observed-condition-2`}
                >
                  {"Observed condition"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-observed-condition-2`}
                  aria-labelledby={`${fieldId}-observed-condition-2-label`}
                  aria-required={true}
                  aria-describedby={`${fieldId}-observed-condition-2-message`}
                  rows={4}
                  value={draft.detail}
                  onChange={(event) => set("detail", event.target.value)}
                />
                <FieldDescription id={`${fieldId}-observed-condition-2-message`}>
                  {"Describe what failed and the requirement it fails to meet."}
                </FieldDescription>
              </Field>
              <Grid templateColumns="1fr 1fr" gap="space.150">
                <Field>
                  <FieldLabel id={`${fieldId}-control-3-label`} htmlFor={`${fieldId}-control-3`}>
                    {"Control"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-control-3`}
                    aria-labelledby={`${fieldId}-control-3-label`}
                    aria-required={true}
                    placeholder="AC-2"
                    value={draft.control}
                    onChange={(event) => set("control", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-cci-optional-4-label`}
                    htmlFor={`${fieldId}-cci-optional-4`}
                  >
                    {"CCI (optional)"}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-cci-optional-4`}
                    aria-labelledby={`${fieldId}-cci-optional-4-label`}
                    placeholder="CCI-000016"
                    value={draft.cci}
                    onChange={(event) => set("cci", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-severity-5-label`} htmlFor={`${fieldId}-severity-5`}>
                    {"Severity"}
                  </FieldLabel>
                  <Select<string>
                    items={severityItems}
                    value={draft.severity}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("severity", value as FindingSeverity);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-severity-5`}
                      aria-labelledby={`${fieldId}-severity-5-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-severity-5-label`}>
                      {severityItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-owner-6-label`} htmlFor={`${fieldId}-owner-6`}>
                    {"Owner"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-owner-6`}
                    aria-labelledby={`${fieldId}-owner-6-label`}
                    aria-required={true}
                    value={draft.owner}
                    onChange={(event) => set("owner", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-assessment-scope-7-label`}
                    htmlFor={`${fieldId}-assessment-scope-7`}
                  >
                    {"Assessment scope"}
                  </FieldLabel>
                  <Select<string>
                    items={scopeItems}
                    value={draft.scope}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("scope", value);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-assessment-scope-7`}
                      aria-labelledby={`${fieldId}-assessment-scope-7-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-assessment-scope-7-label`}>
                      {scopeItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-affected-asset-8-label`}
                    htmlFor={`${fieldId}-affected-asset-8`}
                  >
                    {"Affected asset"}
                  </FieldLabel>
                  <Select<string>
                    items={assetItems}
                    value={draft.asset}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("asset", value);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-affected-asset-8`}
                      aria-labelledby={`${fieldId}-affected-asset-8-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-affected-asset-8-label`}>
                      {assetItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Grid>
              <Field>
                <FieldLabel
                  id={`${fieldId}-related-requirement-9-label`}
                  htmlFor={`${fieldId}-related-requirement-9`}
                >
                  {"Related requirement"}
                </FieldLabel>
                <Select<string>
                  items={requirementItems}
                  value={draft.requirement}
                  onValueChange={(value) => {
                    if (value === null) return;
                    const requirementId = value;
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
                  <SelectTrigger
                    id={`${fieldId}-related-requirement-9`}
                    aria-labelledby={`${fieldId}-related-requirement-9-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-related-requirement-9-label`}>
                    {requirementItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-source-10-label`} htmlFor={`${fieldId}-source-10`}>
                  {"Source"}
                </FieldLabel>
                <Select<string>
                  items={sourceItems}
                  value={draft.source}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return set("source", value as Finding["source"]);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-source-10`}
                    aria-labelledby={`${fieldId}-source-10-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-source-10-label`}>
                    {sourceItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-assessment-method-11-label`}
                  htmlFor={`${fieldId}-assessment-method-11`}
                >
                  {"Assessment method"}
                </FieldLabel>
                <Select<string>
                  items={methodItems}
                  value={draft.method}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return set("method", value as Finding["assessment"]["method"]);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-assessment-method-11`}
                    aria-labelledby={`${fieldId}-assessment-method-11-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-assessment-method-11-label`}>
                    {methodItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-supporting-evidence-12-label`}
                  htmlFor={`${fieldId}-supporting-evidence-12`}
                >
                  {"Supporting evidence"}
                </FieldLabel>
                <Select<string>
                  items={evidenceItems}
                  value={draft.evidence}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return set("evidence", value);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-supporting-evidence-12`}
                    aria-labelledby={`${fieldId}-supporting-evidence-12-label`}
                    aria-describedby={`${fieldId}-supporting-evidence-12-message`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-supporting-evidence-12-label`}>
                    {evidenceItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription id={`${fieldId}-supporting-evidence-12-message`}>
                  {"Add artifacts in the Evidence tab, then link them here."}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-recommended-remediation-13-label`}
                  htmlFor={`${fieldId}-recommended-remediation-13`}
                >
                  {"Recommended remediation"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-recommended-remediation-13`}
                  aria-labelledby={`${fieldId}-recommended-remediation-13-label`}
                  rows={3}
                  value={draft.recommendation}
                  onChange={(event) => set("recommendation", event.target.value)}
                />
              </Field>
            </Stack>
          </form>
        </Box>
        <SheetFooter>
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" form={formId} type="submit">
              Create finding
            </Button>
          </>
        </SheetFooter>
      </SheetContent>
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
    <Sheet
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 420 }}>
        <SheetHeader>
          <Box className="flex items-start gap-100">
            <Box className="flex min-w-0 flex-1 flex-col gap-025">
              <SheetTitle>Finding unavailable</SheetTitle>
            </Box>
          </Box>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          <Text>This finding is not in this program.</Text>
        </Box>
      </SheetContent>
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
  const fieldId = useId();

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
  const lifecycleItems = [
    "Open",
    "Triaged",
    "Remediating",
    "Retest pending",
    "Risk accepted",
    "False positive",
    ...(finding.lifecycle === "Closed" ? ["Closed"] : []),
  ].map((value) => ({ value: value, label: value }));
  const attachEvidenceItems = [
    { value: "", label: "Select an artifact" },
    ...artifacts
      .filter((artifact) => !evidenceIds.includes(artifact.id))
      .map((artifact) => ({
        value: artifact.id,
        label: (
          <>
            {artifact.id} · {artifact.label}
          </>
        ),
      })),
  ];
  const resultItems = [
    { value: "Passed", label: "Passed" },
    { value: "Failed", label: "Failed" },
  ];
  const retestEvidenceItems = [
    { value: "", label: "Select a supporting artifact" },
    ...artifacts.map((artifact) => ({
      value: artifact.id,
      label: (
        <>
          {artifact.id} · {artifact.label}
        </>
      ),
    })),
  ];
  return (
    <>
      <Sheet
        open={true}
        onOpenChange={(next) => {
          if (!next) {
            onClose();
          }
        }}
      >
        <SheetContent side="end" style={{ maxWidth: 720 }}>
          <SheetHeader>
            <Box className="flex items-start gap-100">
              <Box className="flex min-w-0 flex-1 flex-col gap-025">
                <Box className="flex items-center gap-100 pb-025">
                  <>
                    <Badge variant="secondary" tone={severityTone(finding.mitigatedSeverity)}>
                      {finding.mitigatedSeverity}
                    </Badge>
                    <Badge variant="secondary" tone={statusTone(finding.lifecycle)}>
                      {finding.lifecycle}
                    </Badge>
                  </>
                </Box>
                <SheetTitle>{finding.title}</SheetTitle>
                <SheetDescription>{finding.id}</SheetDescription>
                <Fact.Group className="pt-075">
                  <>
                    <Fact label="Controls">
                      {(finding.controls ?? [finding.control]).join(", ")}
                    </Fact>
                    <Fact label="Affected">
                      {finding.assets?.map((id) => assetById.get(id)?.name ?? id).join(", ") ||
                        (assetById.get(finding.asset)?.name ??
                          scopeById.get(finding.scope ?? "")?.name ??
                          "Program")}
                    </Fact>
                    <Fact label="Source">{finding.source}</Fact>
                  </>
                </Fact.Group>
              </Box>
            </Box>
          </SheetHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
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
                <Field>
                  <FieldLabel
                    id={`${fieldId}-finding-title-14-label`}
                    htmlFor={`${fieldId}-finding-title-14`}
                  >
                    {"Finding title"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-finding-title-14`}
                    aria-labelledby={`${fieldId}-finding-title-14-label`}
                    aria-required={true}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </Field>
                <Block title="Observed condition">
                  <Field>
                    <FieldLabel
                      id={`${fieldId}-observed-condition-15-label`}
                      htmlFor={`${fieldId}-observed-condition-15`}
                    >
                      {"Observed condition"}
                      <span aria-hidden="true" className="text-danger">
                        {" "}
                        *
                      </span>
                    </FieldLabel>
                    <Textarea
                      id={`${fieldId}-observed-condition-15`}
                      aria-labelledby={`${fieldId}-observed-condition-15-label`}
                      aria-required={true}
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
                  <Field>
                    <FieldLabel id={`${fieldId}-owner-16-label`} htmlFor={`${fieldId}-owner-16`}>
                      {"Owner"}
                      <span aria-hidden="true" className="text-danger">
                        {" "}
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id={`${fieldId}-owner-16`}
                      aria-labelledby={`${fieldId}-owner-16-label`}
                      aria-required={true}
                      value={owner}
                      onChange={(event) => setOwner(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel id={`${fieldId}-status-17-label`} htmlFor={`${fieldId}-status-17`}>
                      {"Status"}
                    </FieldLabel>
                    <Select<string>
                      items={lifecycleItems}
                      value={lifecycleEdited ? lifecycle : finding.lifecycle}
                      onValueChange={(value) => {
                        if (value === null) return;
                        setLifecycle(value as Finding["lifecycle"]);
                        setLifecycleEdited(true);
                      }}
                    >
                      <SelectTrigger
                        id={`${fieldId}-status-17`}
                        aria-labelledby={`${fieldId}-status-17-label`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent aria-labelledby={`${fieldId}-status-17-label`}>
                        {lifecycleItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </Grid>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-remediation-recommendation-18-label`}
                    htmlFor={`${fieldId}-remediation-recommendation-18`}
                  >
                    {"Remediation recommendation"}
                  </FieldLabel>
                  <Textarea
                    id={`${fieldId}-remediation-recommendation-18`}
                    aria-labelledby={`${fieldId}-remediation-recommendation-18-label`}
                    rows={3}
                    value={recommendation}
                    onChange={(event) => setRecommendation(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-mitigation-disposition-rationale-19-label`}
                    htmlFor={`${fieldId}-mitigation-disposition-rationale-19`}
                  >
                    {"Mitigation / disposition rationale"}
                  </FieldLabel>
                  <Textarea
                    id={`${fieldId}-mitigation-disposition-rationale-19`}
                    aria-labelledby={`${fieldId}-mitigation-disposition-rationale-19-label`}
                    rows={3}
                    value={mitigation}
                    onChange={(event) => setMitigation(event.target.value)}
                  />
                </Field>
                <Block title="Supporting evidence" count={evidenceIds.length}>
                  {evidenceIds.length ? (
                    <Stack space="space.100">
                      {evidenceIds.map((id) => (
                        <Button
                          key={id}
                          type="button"
                          variant="link"
                          onClick={() => setEvidenceId(id)}
                        >
                          <Id>{id}</Id> ·{" "}
                          {evidenceById(id)?.label ?? "Artifact metadata unavailable"}
                        </Button>
                      ))}
                    </Stack>
                  ) : (
                    <Text size="small" color="color.text.subtle">
                      No evidence attached.
                    </Text>
                  )}
                  <Inline space="space.100" alignBlock="end" className="pt-150">
                    <Field className="min-w-0 flex-1">
                      <FieldLabel
                        id={`${fieldId}-attach-supporting-evidence-20-label`}
                        htmlFor={`${fieldId}-attach-supporting-evidence-20`}
                      >
                        {"Attach supporting evidence"}
                      </FieldLabel>
                      <Select<string>
                        items={attachEvidenceItems}
                        value={attachEvidence}
                        onValueChange={(value) => {
                          if (value === null) return;
                          return setAttachEvidence(value);
                        }}
                      >
                        <SelectTrigger
                          id={`${fieldId}-attach-supporting-evidence-20`}
                          aria-labelledby={`${fieldId}-attach-supporting-evidence-20-label`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          aria-labelledby={`${fieldId}-attach-supporting-evidence-20-label`}
                        >
                          {attachEvidenceItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Box
                      key={retest.id}
                      className="border-b border-default"
                      paddingBlock="space.100"
                    >
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
                        <Field>
                          <FieldLabel
                            id={`${fieldId}-retest-result-21-label`}
                            htmlFor={`${fieldId}-retest-result-21`}
                          >
                            {"Retest result"}
                          </FieldLabel>
                          <Select<string>
                            items={resultItems}
                            value={result}
                            onValueChange={(value) => {
                              if (value === null) return;
                              return setResult(value as "Passed" | "Failed");
                            }}
                          >
                            <SelectTrigger
                              id={`${fieldId}-retest-result-21`}
                              aria-labelledby={`${fieldId}-retest-result-21-label`}
                              className="w-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent aria-labelledby={`${fieldId}-retest-result-21-label`}>
                              {resultItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel
                            id={`${fieldId}-assessor-22-label`}
                            htmlFor={`${fieldId}-assessor-22`}
                          >
                            {"Assessor"}
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-assessor-22`}
                            aria-labelledby={`${fieldId}-assessor-22-label`}
                            aria-required={true}
                            value={assessor}
                            onChange={(event) => setAssessor(event.target.value)}
                          />
                        </Field>
                      </Grid>
                      <Field>
                        <FieldLabel
                          id={`${fieldId}-retest-evidence-23-label`}
                          htmlFor={`${fieldId}-retest-evidence-23`}
                        >
                          {"Retest evidence"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Select<string>
                          items={retestEvidenceItems}
                          value={retestEvidence}
                          onValueChange={(value) => {
                            if (value === null) return;
                            return setRetestEvidence(value);
                          }}
                        >
                          <SelectTrigger
                            id={`${fieldId}-retest-evidence-23`}
                            aria-labelledby={`${fieldId}-retest-evidence-23-label`}
                            aria-required={true}
                            className="w-full"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent aria-labelledby={`${fieldId}-retest-evidence-23-label`}>
                            {retestEvidenceItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel
                          id={`${fieldId}-retest-determination-24-label`}
                          htmlFor={`${fieldId}-retest-determination-24`}
                        >
                          {"Retest determination"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Textarea
                          id={`${fieldId}-retest-determination-24`}
                          aria-labelledby={`${fieldId}-retest-determination-24-label`}
                          aria-required={true}
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
          </Box>
          <SheetFooter>
            <>
              <Button onClick={onClose}>Done</Button>
              <Button variant="primary" type="submit" form={formId}>
                Save changes
              </Button>
            </>
          </SheetFooter>
        </SheetContent>
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
