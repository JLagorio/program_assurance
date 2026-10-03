import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
} from "./record-preview";
import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ExternalLink } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  DataTable,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FilterChip,
  Icon,
  KeyValue,
  RadioGroup,
  RadioGroupItem,
  Stack,
  TextLink,
  VisuallyHidden,
  defineColumns,
  toast,
  useLedgerLocale,
  type Preset,
} from "@ledger/design-system";
import { TextField } from "@/components/app/fields";
import { useFormFeedback } from "@/components/app/form-feedback";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { idSet, useRows, type Row } from "@/lib/models";
import { programRequirementScope } from "@/lib/requirement-reads";
import {
  evidenceReviewDecisions,
  evidenceUseDecisions,
  revisionStates,
  statusLabel,
  type StatusVocabulary,
} from "@/lib/status";
import { useDecideEvidenceUse } from "@/lib/library-apply";
import type { SystemAssuranceRow } from "@/lib/system-assurance";

type LineStatus = "pending" | "accepted" | "not_applicable" | "linked";

/**
 * Where a line stands: a proposed use carries the program's decision (the evidence-use
 * vocabulary), and support already recorded on a narrative or a requirement is linked.
 */
const lineStatuses: StatusVocabulary<LineStatus> = {
  ...evidenceUseDecisions,
  linked: { label: "Linked", tone: "success", rank: Object.keys(evidenceUseDecisions).length },
};

type Line = {
  id: string;
  title: string;
  versionId: string;
  version: string;
  /** The latest review's decision; null when the version has not been reviewed. */
  review: string | null;
  supports: string | null;
  kind: "Proposed use" | "Supports narrative" | "Supports requirement";
  status: LineStatus;
  elementId: string;
  elementCode: string;
  rationale: string | null;
  uri: string | null;
  use: Row<"evidence_uses"> | null;
};

const presets: Preset[] = [
  { id: "all", label: "All evidence" },
  { id: "pending", label: "Pending decisions", filters: [{ id: "status", value: ["pending"] }] },
  {
    id: "accepted",
    label: "Accepted",
    filters: [{ id: "status", value: ["accepted", "linked"] }],
  },
];

function subtree(element: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  const ids = new Set([element.id]);
  const queue = [element.id];
  while (queue.length) {
    const parentId = queue.shift();
    for (const child of rows) {
      if (
        child.parent_system_id !== parentId ||
        child.boundary_system_id !== element.boundary_system_id ||
        ids.has(child.id)
      )
        continue;
      ids.add(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

/**
 * The element's Evidence tab: library evidence proposed by applied contributions, waiting for the
 * program's decision, beside evidence already linked as support for this element's narratives
 * and allocated requirements.
 */
export function SystemEvidence({
  programId,
  element,
  rows,
}: {
  programId: string;
  element: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
}) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  // Every read is scoped on the server to this program or boundary, or to the ids the reads
  // before it name: the boundary's components, their contributions, and the evidence they cite.
  const uses = useRows("evidence_uses", { program_id: programId });
  const components = useRows("system_components", { system_id: element.boundary_system_id });
  const contributions = useRows(
    "component_contributions",
    { system_component_id: idSet(components.data?.map((row) => row.id)) },
    { enabled: components.isSuccess },
  );
  const implementationEvidence = useRows(
    "implementation_evidence",
    { component_contribution_id: idSet(contributions.data?.map((row) => row.id)) },
    { enabled: contributions.isSuccess },
  );
  const allocations = useRows(
    "requirement_allocations",
    programRequirementScope(programId, "requirement_allocations"),
  );
  const revisions = useRows(
    "requirement_revisions",
    programRequirementScope(programId, "requirement_revisions"),
  );
  const requirementEvidence = useRows(
    "requirement_evidence",
    programRequirementScope(programId, "requirement_evidence"),
  );
  const requirements = useRows("engineering_requirements", { program_id: programId });
  // The control each contribution implements: its narrative, the selection, the control's code.
  const implemented = useRows(
    "implemented_requirements",
    { id: idSet(contributions.data?.map((row) => row.implemented_requirement_id)) },
    { columns: ["id", "selected_control_id"], enabled: contributions.isSuccess },
  );
  const selections = useRows(
    "selected_controls",
    { id: idSet(implemented.data?.map((row) => row.selected_control_id)) },
    { columns: ["id", "control_id"], enabled: implemented.isSuccess },
  );
  const controls = useRows(
    "controls",
    { id: idSet(selections.data?.map((row) => row.control_id)) },
    { columns: ["id", "code"], enabled: selections.isSuccess },
  );
  // The evidence versions every line cites, their artifacts and their reviews.
  const versionIds = useMemo(
    () =>
      idSet([
        ...(uses.data ?? []).map((row) => row.evidence_version_id),
        ...(implementationEvidence.data ?? []).map((row) => row.evidence_version_id),
        ...(requirementEvidence.data ?? []).map((row) => row.evidence_version_id),
      ]),
    [uses.data, implementationEvidence.data, requirementEvidence.data],
  );
  const citationsRead =
    uses.isSuccess && implementationEvidence.isSuccess && requirementEvidence.isSuccess;
  const versions = useRows(
    "evidence_versions",
    { id: versionIds },
    {
      columns: ["id", "artifact_id", "version_number", "state", "external_uri"],
      enabled: citationsRead,
    },
  );
  const artifacts = useRows(
    "evidence_artifacts",
    { id: idSet(versions.data?.map((row) => row.artifact_id)) },
    { columns: ["id", "title", "source_uri"], enabled: versions.isSuccess },
  );
  const reviews = useRows(
    "evidence_reviews",
    { evidence_version_id: versionIds },
    { columns: ["id", "evidence_version_id", "reviewed_at", "decision"], enabled: citationsRead },
  );
  const [includeInside, setIncludeInside] = useState(false);
  const [deciding, setDeciding] = useState<Line | null>(null);
  const inside = useMemo(() => subtree(element, rows), [element, rows]);
  const hasInside = inside.size > 1;
  // The lines for a set of elements. Both scopes are built, so the table can tell "nothing at this
  // element" from "nothing here or inside".
  const linesFor = useMemo(() => {
    const elementById = new Map(rows.map((row) => [row.id, row]));
    const versionById = new Map((versions.data ?? []).map((row) => [row.id, row]));
    const artifactById = new Map((artifacts.data ?? []).map((row) => [row.id, row]));
    const reviewOf = (versionId: string) =>
      [...(reviews.data ?? [])]
        .filter((review) => review.evidence_version_id === versionId)
        .sort((a, b) => (b.reviewed_at ?? "").localeCompare(a.reviewed_at ?? ""))[0];
    const controlById = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const selectionControl = new Map(
      (selections.data ?? []).map((row) => [row.id, row.control_id]),
    );
    const implementedById = new Map((implemented.data ?? []).map((row) => [row.id, row]));
    const componentElement = new Map(
      (components.data ?? []).map((row) => [row.id, row.system_element_id ?? row.system_id]),
    );
    const contributionById = new Map((contributions.data ?? []).map((row) => [row.id, row]));
    const revisionById = new Map((revisions.data ?? []).map((row) => [row.id, row]));
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    const describe = (versionId: string) => {
      const version = versionById.get(versionId);
      const artifact = version ? artifactById.get(version.artifact_id) : undefined;
      const review = reviewOf(versionId);
      return {
        versionId,
        title: artifact?.title ?? "Evidence unavailable",
        version: version
          ? `v${version.version_number} · ${statusLabel(revisionStates, version.state)}`
          : "",
        review: review?.decision ?? null,
        uri: version?.external_uri ?? artifact?.source_uri ?? null,
      };
    };
    const controlOf = (contribution: Row<"component_contributions"> | undefined) => {
      const implementedRow = contribution
        ? implementedById.get(contribution.implemented_requirement_id)
        : undefined;
      const controlId = implementedRow
        ? selectionControl.get(implementedRow.selected_control_id)
        : undefined;
      return controlId ? (controlById.get(controlId)?.code ?? "Control") : "Narrative";
    };
    return (targets: Set<string>): Line[] => {
      const allocatedRevisions = new Map<string, string>();
      for (const allocation of allocations.data ?? [])
        if (allocation.system_id && targets.has(allocation.system_id))
          allocatedRevisions.set(allocation.requirement_revision_id, allocation.system_id);
      const out: Line[] = [];
      for (const use of uses.data ?? []) {
        if (!use.system_id || !targets.has(use.system_id)) continue;
        const contribution = use.component_contribution_id
          ? contributionById.get(use.component_contribution_id)
          : undefined;
        const revision = use.requirement_revision_id
          ? revisionById.get(use.requirement_revision_id)
          : undefined;
        out.push({
          id: `use:${use.id}`,
          ...describe(use.evidence_version_id),
          supports: contribution
            ? controlOf(contribution)
            : revision
              ? (requirementById.get(revision.engineering_requirement_id)?.code ?? "Requirement")
              : null,
          kind: "Proposed use",
          status:
            use.decision === "accepted"
              ? "accepted"
              : use.decision === "not_applicable"
                ? "not_applicable"
                : "pending",
          elementId: use.system_id,
          elementCode: elementById.get(use.system_id)?.code ?? "",
          rationale: use.rationale,
          use,
        });
      }
      const acceptedVersions = new Set(
        out
          .filter((line) => line.status === "accepted")
          .map((line) => line.use?.evidence_version_id),
      );
      for (const support of implementationEvidence.data ?? []) {
        const contribution = support.component_contribution_id
          ? contributionById.get(support.component_contribution_id)
          : undefined;
        if (!contribution) continue;
        const elementId = componentElement.get(contribution.system_component_id);
        if (!elementId || !targets.has(elementId)) continue;
        if (acceptedVersions.has(support.evidence_version_id)) continue;
        out.push({
          id: `support:${support.id}`,
          ...describe(support.evidence_version_id),
          supports: controlOf(contribution),
          kind: "Supports narrative",
          status: "linked",
          elementId,
          elementCode: elementById.get(elementId)?.code ?? "",
          rationale: support.applicability_rationale,
          use: null,
        });
      }
      for (const support of requirementEvidence.data ?? []) {
        const elementId = allocatedRevisions.get(support.requirement_revision_id);
        if (!elementId) continue;
        const revision = revisionById.get(support.requirement_revision_id);
        out.push({
          id: `requirement:${support.id}`,
          ...describe(support.evidence_version_id),
          supports: revision
            ? (requirementById.get(revision.engineering_requirement_id)?.code ?? "Requirement")
            : "Requirement",
          kind: "Supports requirement",
          status: "linked",
          elementId,
          elementCode: elementById.get(elementId)?.code ?? "",
          rationale: support.applicability_rationale,
          use: null,
        });
      }
      return out.sort(
        (a, b) =>
          Number(b.status === "pending") - Number(a.status === "pending") ||
          a.title.localeCompare(b.title),
      );
    };
  }, [
    rows,
    uses.data,
    versions.data,
    artifacts.data,
    reviews.data,
    implementationEvidence.data,
    requirementEvidence.data,
    components.data,
    contributions.data,
    implemented.data,
    selections.data,
    controls.data,
    allocations.data,
    revisions.data,
    requirements.data,
  ]);
  const own = useMemo(() => linesFor(new Set([element.id])), [linesFor, element.id]);
  const everything = useMemo(
    () => (hasInside ? linesFor(inside) : own),
    [hasInside, linesFor, inside, own],
  );
  const data = includeInside ? everything : own;
  const hiddenInside = everything.length - own.length;
  // The scope's own words only when the scope alone leaves nothing: with lines of its own, a search,
  // a filter or a saved view that matches none keeps the table's Nothing matches and Clear filters.
  const scopeEmpties = !includeInside && hiddenInside > 0 && own.length === 0;
  const [previewId, setPreviewId] = useState<string>();
  // The preview belongs to the tab: choosing another ends it, and coming back does not reopen it.
  useEndOnHide(() => setPreviewId(undefined));
  const canDecide = workspace.role !== "viewer";
  const columns = useMemo(
    () =>
      defineColumns<Line>((c) => [
        c.id("title", {
          header: "Evidence",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="evidence_versions" record={{ id: row.versionId }}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("version", { header: "Version", width: 140 }),
        c.status("review", {
          header: "Review",
          width: 130,
          statuses: evidenceReviewDecisions,
          cell: (row) => (
            <StatusBadge
              statuses={evidenceReviewDecisions}
              value={row.review}
              absentLabel="Not reviewed"
            />
          ),
        }),
        c.text("supports", {
          header: "Supports",
          width: 130,
          cell: (row) => row.supports ?? <Absent label="Nothing named" />,
        }),
        c.text("kind", { header: "Relationship", width: 170 }),
        c.status("status", { header: "Status", width: 130, statuses: lineStatuses }),
        // Which element a line belongs to says something only when the lines come from inside too.
        ...(includeInside ? [c.text("elementCode", { header: "Element", width: 120 })] : []),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canDecide
          ? [
              c.actions((row) =>
                row.use && row.status === "pending"
                  ? [{ label: "Decide evidence use", onSelect: () => setDeciding(row) }]
                  : [],
              ),
            ]
          : []),
      ]),
    [canDecide, includeInside],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({ onPreview: (row: Line) => setPreviewId(row.id), activeId: previewId ?? null }),
    [previewId],
  );
  const table = useCollectionTable({
    columns,
    data,
    getRowId: (row) => row.id,
    preview: tablePreview,
    rowLabel: (row) => row.title,
    label: "Evidence at this element",
    // v2: the Element column shows by default with everything inside, and statuses are stored
    // values, so earlier saved filters and layouts do not apply.
    view: "live-system-evidence-v2",
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { rationale: false } },
  });
  const displayed = useDisplayedRecords(table);
  const preview = data.find((row) => row.id === previewId);
  const queries = [
    uses,
    versions,
    artifacts,
    reviews,
    implementationEvidence,
    requirementEvidence,
    components,
    contributions,
    implemented,
    selections,
    controls,
    allocations,
    revisions,
    requirements,
  ];
  return (
    <>
      <ProductCollection
        table={table}
        empty={{
          illustration: "records",
          title: includeInside
            ? "No evidence at this element or inside it yet"
            : "No evidence at this element yet",
          description:
            "Evidence proposed by applied library items appears here for a decision, beside evidence linked to this element's narratives and requirements.",
          ...(scopeEmpties
            ? {
                filtered: {
                  title: "No evidence at this element itself",
                  description: `${formatNumber(hiddenInside)} evidence ${hiddenInside === 1 ? "line belongs" : "lines belong"} to elements inside it.`,
                  action: (
                    <Button size="small" onClick={() => setIncludeInside(true)}>
                      Include everything inside
                    </Button>
                  ),
                },
              }
            : {}),
        }}
        fill
        queries={queries}
        // Without the elements inside, the lines are a narrowing: nothing left keeps the toolbar.
        narrowed={!includeInside && hiddenInside > 0}
        searchLabel="Find evidence"
        views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
        filters={
          hasInside ? (
            <FilterChip
              label="Everything inside"
              isActive={includeInside}
              onClick={() => setIncludeInside(!includeInside)}
            />
          ) : undefined
        }
      />
      {preview && (
        <RecordPreviewPanel
          title={preview.title}
          label="Evidence preview"
          onClose={() => setPreviewId(undefined)}
          recordActions={
            canDecide && preview.use && preview.status === "pending" ? (
              <Button size="small" variant="primary" onClick={() => setDeciding(preview)}>
                Decide evidence use
              </Button>
            ) : undefined
          }
          navigation={
            <RecordPreviewActions
              table="evidence_versions"
              record={preview}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
              destination={recordDestination("evidence_versions", { id: preview.versionId })}
            />
          }
        >
          <KeyValue.Group>
            <KeyValue label="Version">{preview.version || <Absent label="Unavailable" />}</KeyValue>
            <KeyValue label="Review">
              <StatusBadge
                statuses={evidenceReviewDecisions}
                value={preview.review}
                absentLabel="Not reviewed"
              />
            </KeyValue>
            <KeyValue label="Supports">
              {preview.supports ?? <Absent label="Nothing named" />}
            </KeyValue>
            <KeyValue label="Relationship">{preview.kind}</KeyValue>
            <KeyValue label="Status">
              <StatusBadge statuses={lineStatuses} value={preview.status} />
            </KeyValue>
            <KeyValue label="Element">{preview.elementCode || <Absent />}</KeyValue>
            <KeyValue label="Rationale" wrap>
              {preview.rationale ?? <Absent label="No rationale recorded" />}
            </KeyValue>
            {preview.uri && (
              <KeyValue label="Source">
                <TextLink href={preview.uri} target="_blank" rel="noopener noreferrer">
                  Open evidence source
                  <VisuallyHidden> (opens in a new tab)</VisuallyHidden>{" "}
                  <Icon>
                    <ExternalLink />
                  </Icon>
                </TextLink>
              </KeyValue>
            )}
          </KeyValue.Group>
        </RecordPreviewPanel>
      )}
      {deciding?.use && (
        <DecideEvidenceUse key={deciding.id} line={deciding} onClose={() => setDeciding(null)} />
      )}
    </>
  );
}

type Decision = "accepted" | "not_applicable";

/** Accept a proposed evidence use, or record why it does not apply here. */
function DecideEvidenceUse({ line, onClose }: { line: Line; onClose: () => void }) {
  const decide = useDecideEvidenceUse();
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [decision, setDecision] = useState<Decision>("accepted");
  const [rationale, setRationale] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<"rationale">();
  const use = line.use!;
  const dirty = decision !== "accepted" || rationale !== "";
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "Your evidence decision has not been recorded.",
  });
  const issues =
    decision === "not_applicable" && !rationale.trim()
      ? [{ field: "rationale" as const, message: "Explain why this evidence does not apply here." }]
      : [];
  const error = feedback.submitted ? issues[0]?.message : undefined;
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      await decide.mutateAsync({
        useId: use.id,
        expectedRevision: Number(use.revision),
        decision,
        rationale: rationale.trim() || null,
      });
      toast.add({
        title:
          decision === "accepted" ? "Evidence accepted" : "Evidence recorded as not applicable",
        type: "success",
        description: `${line.title}${line.supports ? ` · ${line.supports}` : ""}`,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${(cause instanceof Error ? cause.message : "The request failed.").replace(/[.!?]?$/, ".")} Your decision and rationale are kept, so you can try again.`,
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent width="medium" initialFocus={() => acceptRef.current ?? true}>
        <DialogHeader>
          <DialogTitle>Decide evidence use</DialogTitle>
          <DialogDescription>
            {line.title} · {line.version}
            {line.supports ? ` · supports ${line.supports}` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertIcon />
                  <AlertTitle>The decision was not recorded</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <Field required>
                    <FieldSet>
                      <FieldLegend variant="label">Decision</FieldLegend>
                      <RadioGroup<Decision>
                        value={decision}
                        onValueChange={(value) => setDecision(value)}
                      >
                        <Field orientation="horizontal">
                          <RadioGroupItem ref={acceptRef} value="accepted" />
                          <FieldLabel>Accept: link this exact version as support here</FieldLabel>
                        </Field>
                        <Field orientation="horizontal">
                          <RadioGroupItem value="not_applicable" />
                          <FieldLabel>Not applicable here</FieldLabel>
                        </Field>
                      </RadioGroup>
                    </FieldSet>
                  </Field>
                  <TextField
                    label={decision === "accepted" ? "Applicability" : "Why it does not apply"}
                    required={decision === "not_applicable"}
                    multiline
                    value={rationale}
                    onChange={setRationale}
                    error={error}
                    controlRef={feedback.ref("rationale")}
                  />
                </Stack>
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
          >
            Decide evidence use
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
