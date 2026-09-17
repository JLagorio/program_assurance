import { useMemo, useRef, useState } from "react";
import {
  Absent,
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Stack,
  TextLink,
  Textarea,
  Toolbar,
  defineColumns,
  toast,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { useDecideEvidenceUse } from "@/lib/library-apply";
import type { SystemAssuranceRow } from "@/lib/system-assurance";

type Line = {
  id: string;
  title: string;
  version: string;
  review: string;
  supports: string;
  kind: "Proposed use" | "Supports narrative" | "Supports requirement";
  status: "Pending" | "Accepted" | "Not applicable" | "Linked";
  elementCode: string;
  rationale: string | null;
  uri: string | null;
  use: Row<"evidence_uses"> | null;
};

const presets: Preset[] = [
  { id: "all", label: "All evidence" },
  { id: "pending", label: "Pending decisions", filters: [{ id: "status", value: ["Pending"] }] },
  { id: "accepted", label: "Accepted", filters: [{ id: "status", value: ["Accepted", "Linked"] }] },
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
  const uses = useRows("evidence_uses", { program_id: programId });
  const versions = useRows("evidence_versions");
  const artifacts = useRows("evidence_artifacts");
  const reviews = useRows("evidence_reviews");
  const implementationEvidence = useRows("implementation_evidence");
  const requirementEvidence = useRows("requirement_evidence");
  const components = useRows("system_components", { system_id: element.boundary_system_id });
  const contributions = useRows("component_contributions");
  const implemented = useRows("implemented_requirements");
  const selections = useRows("selected_controls");
  const controls = useRows("controls");
  const allocations = useRows("requirement_allocations");
  const revisions = useRows("requirement_revisions");
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const [includeInside, setIncludeInside] = useState(false);
  const [deciding, setDeciding] = useState<Line | null>(null);
  const targets = useMemo(
    () => (includeInside ? subtree(element, rows) : new Set([element.id])),
    [includeInside, element, rows],
  );
  const data = useMemo<Line[]>(() => {
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
    const allocatedRevisions = new Map<string, string>();
    for (const allocation of allocations.data ?? [])
      if (allocation.system_id && targets.has(allocation.system_id))
        allocatedRevisions.set(allocation.requirement_revision_id, allocation.system_id);
    const describe = (versionId: string) => {
      const version = versionById.get(versionId);
      const artifact = version ? artifactById.get(version.artifact_id) : undefined;
      const review = reviewOf(versionId);
      return {
        title: artifact?.title ?? "Evidence unavailable",
        version: version ? `v${version.version_number} · ${labelFor(version.state)}` : "",
        review: review ? labelFor(review.decision) : "Not reviewed",
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
            : "—",
        kind: "Proposed use",
        status:
          use.decision === "accepted"
            ? "Accepted"
            : use.decision === "not_applicable"
              ? "Not applicable"
              : "Pending",
        elementCode: elementById.get(use.system_id)?.code ?? "",
        rationale: use.rationale,
        use,
      });
    }
    const acceptedVersions = new Set(
      out.filter((line) => line.status === "Accepted").map((line) => line.use?.evidence_version_id),
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
        status: "Linked",
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
        status: "Linked",
        elementCode: elementById.get(elementId)?.code ?? "",
        rationale: support.applicability_rationale,
        use: null,
      });
    }
    return out.sort(
      (a, b) =>
        Number(b.status === "Pending") - Number(a.status === "Pending") ||
        a.title.localeCompare(b.title),
    );
  }, [
    rows,
    targets,
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
  const canDecide = workspace.role !== "viewer";
  const columns = useMemo(
    () =>
      defineColumns<Line>((c) => [
        c.text("title", {
          header: "Evidence",
          minWidth: 240,
          hideable: false,
          cell: (row) =>
            row.uri ? (
              <TextLink href={row.uri} target="_blank" rel="noreferrer">
                {row.title}
              </TextLink>
            ) : (
              row.title
            ),
        }),
        c.text("version", { header: "Version", width: 140 }),
        c.text("review", { header: "Review", width: 130 }),
        c.text("supports", { header: "Supports", width: 130 }),
        c.text("kind", { header: "Relationship", width: 170 }),
        c.status("status", {
          header: "Status",
          width: 130,
          tone: (row) =>
            row.status === "Pending"
              ? "warning"
              : row.status === "Not applicable"
                ? "neutral"
                : "success",
        }),
        c.text("elementCode", { header: "Element", width: 120 }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canDecide
          ? [
              c.actions((row) =>
                row.use && row.status === "Pending"
                  ? [{ label: "Decide…", onSelect: () => setDeciding(row) }]
                  : [],
              ),
            ]
          : []),
      ]),
    [canDecide],
  );
  const table = useDataTable({
    columns,
    data,
    getRowId: (row) => row.id,
    label: "Evidence at this element",
    view: "live-system-evidence-v1",
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { rationale: false, elementCode: false } },
  });
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
  const error = queries.find((query) => query.error)?.error;
  const pending = queries.some((query) => query.isPending);
  return (
    <>
      <DataTable
        table={table}
        state={error ? "error" : pending ? "loading" : "ready"}
        error={error?.message}
        empty={{
          illustration: "records",
          title: "No evidence at this element yet",
          description:
            "Evidence proposed by applied library items appears here for a decision, beside evidence linked to this element's narratives and requirements.",
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Find evidence"
          >
            <DataTable.Presets table={table} presets={presets} variant="menu" />
            <label className="flex items-center gap-100 font-body-small">
              <Checkbox
                checked={includeInside}
                onCheckedChange={(checked) => setIncludeInside(checked === true)}
              />
              Include everything inside
            </label>
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
      {deciding?.use && <DecideEvidenceUse line={deciding} onClose={() => setDeciding(null)} />}
    </>
  );
}

function DecideEvidenceUse({ line, onClose }: { line: Line; onClose: () => void }) {
  const decide = useDecideEvidenceUse();
  const [decision, setDecision] = useState<"accepted" | "not_applicable">("accepted");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const use = line.use!;
  const submitted = useRef(false);
  async function submit() {
    if (submitted.current) return;
    submitted.current = true;
    setError("");
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
        description: `${line.title} · ${line.supports}`,
      });
      onClose();
    } catch (cause) {
      submitted.current = false;
      setError(cause instanceof Error ? cause.message : "The decision could not be recorded.");
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent style={{ maxWidth: 560 }}>
        <DialogHeader>
          <DialogTitle>Decide on library evidence</DialogTitle>
          <DialogDescription>
            {line.title} · {line.version} · supports {line.supports}
          </DialogDescription>
        </DialogHeader>
        <Stack space="space.200" className="p-250">
          <Stack space="space.075">
            {(["accepted", "not_applicable"] as const).map((value) => (
              <label key={value} className="flex items-center gap-100 font-body-small">
                <Checkbox
                  checked={decision === value}
                  onCheckedChange={(checked) => checked && setDecision(value)}
                  aria-label={value === "accepted" ? "Accept" : "Not applicable"}
                />
                {value === "accepted"
                  ? "Accept: link this exact version as support here"
                  : "Not applicable here"}
              </label>
            ))}
          </Stack>
          <Field>
            <FieldLabel htmlFor="evidence-use-rationale">
              {decision === "accepted" ? "Applicability (optional)" : "Why it does not apply"}
            </FieldLabel>
            <Textarea
              id="evidence-use-rationale"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="font-body-small text-danger">
              {error}
            </p>
          )}
        </Stack>
        <DialogFooter>
          <Button variant="subtle" disabled={decide.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={decide.isPending || (decision === "not_applicable" && !rationale.trim())}
            onClick={() => void submit()}
          >
            {decide.isPending ? "Saving…" : decision === "accepted" ? "Accept" : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
