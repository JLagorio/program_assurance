import {
  FieldLabel,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Fact,
  Field,
  Inline,
  Input,
  PreviewSheet,
  Stack,
  Table,
  Text,
  Textarea,
  TextLink,
  toast,
  useDataTable,
} from "@ledger/design-system";
import {
  currentSession,
  linkEvidence,
  unlinkEvidence,
  useWorkVersion,
  workFor,
} from "@/lib/control-work";
import {
  createEvidence,
  evidenceAvailableInScope,
  evidenceForProgram,
  evidenceForTarget,
  linkArtifact,
  reviewEvidence,
  unlinkArtifact,
  useEvidenceVersion,
  type EvidenceArtifact,
  type EvidenceLink,
  type EvidenceReview,
  type NewEvidence,
} from "@/lib/evidence-catalog";
import {
  evidenceScopeNames,
  evidenceSupportRows,
  evidenceSupportSummary,
  type EvidenceSupportRow,
} from "@/lib/evidence-presentation";
import { closestProgramScope, resolveProgramElement } from "@/lib/program-scope";
import { requirementsForProgramElement } from "@/lib/requirement-context";
import { requirementsForProgram } from "@/lib/requirements";
import { controlSetFor, scopeById, scopesForProgram } from "@/lib/scopes";
import { Link } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";

const reviewTone = (review: EvidenceReview) =>
  review === "Accepted"
    ? ("success" as const)
    : review === "Needs revision"
      ? ("danger" as const)
      : ("warning" as const);
/** Add a repository reference with enough provenance to find and review the actual artifact. */
export function AddEvidenceDialog({
  programId,
  open,
  onClose,
  initialLink,
  onCreated,
}: {
  programId: string;
  open: boolean;
  onClose: () => void;
  initialLink?: EvidenceLink;
  onCreated?: (artifact: EvidenceArtifact) => void;
}) {
  const fieldId = useId();

  const [draft, setDraft] = useState<NewEvidence>({
    program: programId,
    label: "",
    collected: "",
    owner: currentSession().name,
    kind: "Document",
    version: "1",
    provenance: "",
    url: "",
    scopeIds: initialLink?.scopeId ? [initialLink.scopeId] : [],
    links: initialLink ? [initialLink] : [],
  });
  const [error, setError] = useState("");
  const set = <K extends keyof NewEvidence>(field: K, value: NewEvidence[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const save = () => {
    try {
      const artifact = createEvidence(draft);
      onCreated?.(artifact);
      onClose();
      toast.success("Evidence reference added");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Evidence could not be saved.");
    }
  };
  const kindItems = ["Document", "Configuration", "Test result", "Scan output"].map((kind) => ({
    value: kind,
    label: kind,
  }));
  const selectionItems = [
    { value: "", label: "Program-wide" },
    ...scopesForProgram(programId).map((scope) => ({
      value: scope.id,
      label: scope.name,
    })),
  ];
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
          <DialogTitle>Add evidence</DialogTitle>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <Stack space="space.150">
            <Field>
              <FieldLabel id={`${fieldId}-title-1-label`} htmlFor={`${fieldId}-title-1`}>
                {"Title"}
                <span aria-hidden="true" className="text-danger">
                  {" "}
                  *
                </span>
              </FieldLabel>
              <Input
                id={`${fieldId}-title-1`}
                aria-labelledby={`${fieldId}-title-1-label`}
                aria-required={true}
                value={draft.label}
                onChange={(event) => set("label", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel
                id={`${fieldId}-artifact-url-2-label`}
                htmlFor={`${fieldId}-artifact-url-2`}
              >
                {"Artifact URL"}
                <span aria-hidden="true" className="text-danger">
                  {" "}
                  *
                </span>
              </FieldLabel>
              <Input
                id={`${fieldId}-artifact-url-2`}
                aria-labelledby={`${fieldId}-artifact-url-2-label`}
                aria-required={true}
                type="url"
                placeholder="https://repository.example/artifacts/report.pdf"
                value={draft.url}
                onChange={(event) => set("url", event.target.value)}
              />
            </Field>
            <Text as="p" size="small" color="color.text.subtle">
              Link to the artifact in your document or evidence repository. Access remains
              controlled by that repository.
            </Text>
            <Inline space="space.150" shouldWrap>
              <Field>
                <FieldLabel id={`${fieldId}-kind-3-label`} htmlFor={`${fieldId}-kind-3`}>
                  {"Kind"}
                </FieldLabel>
                <Select<string>
                  items={kindItems}
                  value={draft.kind}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return set("kind", value as EvidenceArtifact["kind"]);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-kind-3`}
                    aria-labelledby={`${fieldId}-kind-3-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-kind-3-label`}>
                    {kindItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-version-4-label`} htmlFor={`${fieldId}-version-4`}>
                  {"Version"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-version-4`}
                  aria-labelledby={`${fieldId}-version-4-label`}
                  aria-required={true}
                  value={draft.version}
                  onChange={(event) => set("version", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-collected-on-5-label`}
                  htmlFor={`${fieldId}-collected-on-5`}
                >
                  {"Collected on"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-collected-on-5`}
                  aria-labelledby={`${fieldId}-collected-on-5-label`}
                  aria-required={true}
                  type="date"
                  value={draft.collected}
                  onChange={(event) => set("collected", event.target.value)}
                />
              </Field>
            </Inline>
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
              <FieldLabel id={`${fieldId}-system-7-label`} htmlFor={`${fieldId}-system-7`}>
                {"System"}
              </FieldLabel>
              <Select<string>
                items={selectionItems}
                value={draft.scopeIds?.[0] ?? ""}
                disabled={!!initialLink?.scopeId}
                onValueChange={(value) => {
                  if (value === null) return;
                  return set("scopeIds", value ? [value] : []);
                }}
              >
                <SelectTrigger
                  id={`${fieldId}-system-7`}
                  aria-labelledby={`${fieldId}-system-7-label`}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent aria-labelledby={`${fieldId}-system-7-label`}>
                  {selectionItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel id={`${fieldId}-provenance-8-label`} htmlFor={`${fieldId}-provenance-8`}>
                {"Provenance"}
                <span aria-hidden="true" className="text-danger">
                  {" "}
                  *
                </span>
              </FieldLabel>
              <Textarea
                id={`${fieldId}-provenance-8`}
                aria-labelledby={`${fieldId}-provenance-8-label`}
                aria-required={true}
                placeholder="Who produced this artifact, using which method and system/build?"
                value={draft.provenance}
                onChange={(event) => set("provenance", event.target.value)}
              />
            </Field>
            {error ? (
              <p role="alert" className="font-body-small text-danger">
                {error}
              </p>
            ) : null}
          </Stack>
        </Box>
        <DialogFooter>
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              Add reference
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProgramEvidence({
  programId,
  elementId,
}: {
  programId: string;
  elementId?: string | undefined;
}) {
  useEvidenceVersion();
  useWorkVersion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const rows = evidenceForProgram(programId);
  const selected = rows.find((artifact) => artifact.id === selectedId) ?? null;
  const columns = useMemo(
    () =>
      defineColumns<EvidenceArtifact>((c) => [
        c.id("id", { header: "Evidence", width: 116, hideable: false }),
        c.text("label", { header: "Artifact", width: 260, hideable: false }),
        c.text("kind", { header: "Kind", width: 120 }),
        c.custom("scopeIds", {
          header: "System",
          width: 150,
          cell: (artifact) => {
            const scopes = evidenceScopeNames(artifact);
            return (
              <span title={scopes.join("; ")}>
                {scopes.length > 1
                  ? `${scopes[0]} +${scopes.length - 1}`
                  : (scopes[0] ?? "Program")}
              </span>
            );
          },
          text: (artifact) => evidenceScopeNames(artifact).join("; ") || "Program",
        }),
        c.custom("links", {
          header: "Supports",
          width: 280,
          cell: evidenceSupportSummary,
          text: (artifact) =>
            evidenceSupportRows(artifact)
              .map((row) => `${row.link.id} ${row.title} ${row.context}`)
              .join("; "),
        }),
        c.text("owner", { header: "Owner", width: 145 }),
        c.text("version", { header: "Version", width: 90 }),
        c.text("collected", { header: "Collected", width: 135 }),
        c.status("review", {
          header: "Review",
          width: 140,
          tone: (artifact) => reviewTone(artifact.review),
        }),
      ]),
    [],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (artifact) => artifact.id,
    label: "Program evidence",
    view: `program-evidence-${programId}`,
    resizable: true,
    reorderable: true,
  });
  return (
    <Stack space="space.150">
      <DataTable
        table={table}
        onRowClick={(artifact) => setSelectedId(artifact.id)}
        empty={{
          title: "No evidence found",
          description:
            "Add an artifact reference and link it to the implementation or requirement it supports.",
        }}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Find evidence" />
            <DataTable.Presets
              table={table}
              variant="menu"
              presets={[
                { id: "all", label: "All evidence" },
                {
                  id: "pending",
                  label: "Pending review",
                  filters: [{ id: "review", value: "Pending review" }],
                },
                {
                  id: "revision",
                  label: "Needs revision",
                  filters: [{ id: "review", value: "Needs revision" }],
                },
              ]}
            />
            <DataTable.Filter table={table} column="review" />
            <DataTable.Filter table={table} column="kind" />
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
              <Button size="small" variant="primary" onClick={() => setAdding(true)}>
                Add evidence
              </Button>
            </Inline>
          </Inline>
        }
      />
      {adding ? (
        <AddEvidenceDialog
          programId={programId}
          open
          onClose={() => setAdding(false)}
          onCreated={(artifact) => setSelectedId(artifact.id)}
        />
      ) : null}
      {selected ? (
        <EvidencePreview
          key={selected.id}
          programId={programId}
          evidenceId={selected.id}
          elementId={elementId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </Stack>
  );
}

export type EvidencePreviewProps = {
  onClose: () => void;
  elementId?: string | undefined;
  version?: number;
} & (
  | { programId: string; evidenceId: string; artifact?: never }
  | { artifact: EvidenceArtifact; programId?: never; evidenceId?: never }
);

/** Shared by the evidence table, control implementations, requirements and findings. */
export function EvidencePreview(props: EvidencePreviewProps) {
  useEvidenceVersion();
  useWorkVersion();
  const programId = props.programId ?? props.artifact.program;
  const evidenceId = props.evidenceId ?? props.artifact.id;
  const artifact = evidenceForProgram(programId).find((item) => item.id === evidenceId);
  if (!artifact) return null;
  return (
    <EvidenceRecordPreview
      key={artifact.id}
      artifact={artifact}
      onClose={props.onClose}
      elementId={props.elementId}
    />
  );
}

function EvidenceRecordPreview({
  artifact,
  onClose,
  elementId,
}: {
  artifact: EvidenceArtifact;
  onClose: () => void;
  elementId?: string | undefined;
}) {
  const fieldId = useId();

  const [editing, setEditing] = useState<"link" | "review" | null>(null);
  const [kind, setKind] = useState<"control" | "requirement">("control");
  const scopes = scopesForProgram(artifact.program).filter((scope) =>
    evidenceAvailableInScope(artifact, artifact.program, scope.id),
  );
  const requestedScope = closestProgramScope(artifact.program, elementId);
  const [scopeId, setScopeId] = useState(
    scopes.find((scope) => scope.id === requestedScope?.id)?.id ?? scopes[0]?.id ?? "",
  );
  const [target, setTarget] = useState("");
  const [review, setReview] = useState<EvidenceReview>(artifact.review);
  const [note, setNote] = useState(artifact.reviewNote ?? "");
  const [reviewer, setReviewer] = useState(currentSession().name);
  const [error, setError] = useState("");
  const controls = scopeId ? (controlSetFor(scopeId)?.controls ?? []) : [];
  const requirements = scopeId
    ? requirementsForProgramElement(artifact.program, scopeById.get(scopeId)?.element)
    : requirementsForProgram(artifact.program);
  const supports = evidenceSupportRows(artifact);
  const origin = resolveProgramElement(artifact.program, elementId)?.id;
  const artifactUrl = artifact.url && /^https?:\/\//i.test(artifact.url) ? artifact.url : undefined;
  const run = (action: () => void) => {
    try {
      action();
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The record could not be saved.");
    }
  };
  const closeEditor = () => {
    setEditing(null);
    setError("");
    setTarget("");
  };
  const kindItems2 = [
    { value: "control", label: "Control implementation" },
    { value: "requirement", label: "Requirement" },
  ];
  const scopeIdItems = [
    ...(kind === "requirement" && !artifact.scopeIds.length
      ? [{ value: "", label: "Program requirement" }]
      : []),
    ...scopes.map((scope) => ({ value: scope.id, label: scope.name })),
  ];
  const targetItems = [
    { value: "", label: "Choose a record…" },
    ...(kind === "control"
      ? controls.map(({ control }) => ({
          value: control.id,
          label: (
            <>
              {control.id} · {control.title}
            </>
          ),
        }))
      : requirements.map((requirement) => ({
          value: requirement.id,
          label: (
            <>
              {requirement.id} · {requirement.text}
            </>
          ),
        }))),
  ];
  const reviewItems = ["Pending review", "Accepted", "Needs revision"].map((status) => ({
    value: status,
    label: status,
  }));
  return (
    <PreviewSheet
      open
      onClose={onClose}
      id={artifact.id}
      title={artifact.label}
      subtitle={`${artifact.kind} · ${artifact.version === "Unrecorded" ? "Version unrecorded" : `version ${artifact.version}`}`}
      openTo={
        <Link
          to="/programs/$programId"
          params={{ programId: artifact.program }}
          search={{ tab: "Evidence", element: origin }}
        >
          Open program evidence
        </Link>
      }
      status={<Badge tone={reviewTone(artifact.review)}>{artifact.review}</Badge>}
      facts={
        <>
          <Fact label="Owner">{artifact.owner}</Fact>
          <Fact label="Collected">{artifact.collected}</Fact>
          <Fact label="Valid through">{artifact.validThrough?.slice(0, 10) || "Unrecorded"}</Fact>
        </>
      }
      actions={
        artifactUrl ? (
          <Button render={<a href={artifactUrl} target="_blank" rel="noreferrer" />}>
            Open artifact
          </Button>
        ) : (
          <Badge>Reference only</Badge>
        )
      }
    >
      <Stack space="space.200">
        <Block
          title="Supporting records"
          count={supports.length}
          action={
            <Button
              size="small"
              onClick={() => {
                setEditing(editing === "link" ? null : "link");
                setError("");
              }}
            >
              Link record
            </Button>
          }
        >
          {supports.length ? (
            <Table>
              <thead>
                <Table.Row>
                  <Table.Header>Type</Table.Header>
                  <Table.Header>Record</Table.Header>
                  <Table.Header>Scope / assessment</Table.Header>
                  <Table.Header />
                </Table.Row>
              </thead>
              <tbody>
                {supports.map((row) => (
                  <Table.Row key={row.key}>
                    <Table.Cell>{row.kind}</Table.Cell>
                    <Table.Cell>
                      <EvidenceTargetLink
                        programId={artifact.program}
                        row={row}
                        elementId={origin}
                      />
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal" title={row.contextDetail}>
                      {row.context}
                    </Table.Cell>
                    <Table.Cell>
                      {row.link.kind === "control" || row.link.kind === "requirement" ? (
                        <Button
                          size="xsmall"
                          variant="subtle"
                          aria-label={`Unlink ${row.link.id} from ${row.context}`}
                          onClick={() =>
                            run(() => {
                              const scope = row.link.scopeId
                                ? scopeById.get(row.link.scopeId)
                                : undefined;
                              const applicable =
                                scope?.program === artifact.program &&
                                controlSetFor(scope.id)?.controls.some(
                                  (item) => item.control.id === row.link.id,
                                );
                              if (row.link.kind === "control" && scope && applicable)
                                unlinkEvidence(
                                  workFor(artifact.program, scope.id, row.link.id).id,
                                  artifact.id,
                                );
                              else unlinkArtifact(artifact.id, row.link);
                            })
                          }
                        >
                          Unlink
                        </Button>
                      ) : null}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          ) : (
            <Text as="p" size="small" color="color.text.subtle">
              No supporting records linked.
            </Text>
          )}
          {editing === "link" ? (
            <Stack space="space.150" className="pt-150">
              <Field>
                <FieldLabel id={`${fieldId}-link-to-9-label`} htmlFor={`${fieldId}-link-to-9`}>
                  {"Link to"}
                </FieldLabel>
                <Select<string>
                  items={kindItems2}
                  value={kind}
                  onValueChange={(value) => {
                    if (value === null) return;
                    setKind(value as typeof kind);
                    setTarget("");
                    if (value === "control" && !scopeId) setScopeId(scopes[0]?.id ?? "");
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-link-to-9`}
                    aria-labelledby={`${fieldId}-link-to-9-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-link-to-9-label`}>
                    {kindItems2.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-system-component-scope-10-label`}
                  htmlFor={`${fieldId}-system-component-scope-10`}
                >
                  {"System / component scope"}
                </FieldLabel>
                <Select<string>
                  items={scopeIdItems}
                  value={scopeId}
                  onValueChange={(value) => {
                    if (value === null) return;
                    setScopeId(value);
                    setTarget("");
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-system-component-scope-10`}
                    aria-labelledby={`${fieldId}-system-component-scope-10-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-system-component-scope-10-label`}>
                    {scopeIdItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-field-11-label`} htmlFor={`${fieldId}-field-11`}>
                  {kind === "control" ? "Control" : "Requirement"}
                </FieldLabel>
                <Select<string>
                  items={targetItems}
                  value={target}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return setTarget(value);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-field-11`}
                    aria-labelledby={`${fieldId}-field-11-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-field-11-label`}>
                    {targetItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Inline space="space.100">
                <Button
                  size="small"
                  variant="primary"
                  disabled={!target || (kind === "control" && !scopeId)}
                  onClick={() =>
                    run(() => {
                      if (scopeId && !scopes.some((scope) => scope.id === scopeId))
                        throw new Error("Choose a scope supported by this artifact.");
                      if (kind === "control")
                        linkEvidence(workFor(artifact.program, scopeId, target).id, artifact.id);
                      else {
                        if (!requirements.some((requirement) => requirement.id === target))
                          throw new Error("Choose a requirement allocated within this scope.");
                        linkArtifact(artifact.id, {
                          kind,
                          id: target,
                          ...(scopeId ? { scopeId } : {}),
                        });
                      }
                      closeEditor();
                      toast.success("Supporting record linked");
                    })
                  }
                >
                  Link evidence
                </Button>
                <Button size="small" onClick={closeEditor}>
                  Cancel
                </Button>
              </Inline>
            </Stack>
          ) : null}
        </Block>
        <Block title="Artifact">
          <Stack space="space.100">
            {artifact.provenance ? (
              <Text as="p" size="small">
                {artifact.provenance}
              </Text>
            ) : null}
            <Fact label={artifactUrl ? "Location" : "Reference"}>
              <span className="break-all">
                {artifact.referenceUri || artifactUrl || "No location supplied"}
              </span>
            </Fact>
            {artifact.sha256 ? (
              <Fact label="SHA-256">
                <span className="break-all">{artifact.sha256}</span>
              </Fact>
            ) : null}
          </Stack>
        </Block>
        <Block
          title="Evidence review"
          action={
            <Button
              size="small"
              onClick={() => {
                setEditing(editing === "review" ? null : "review");
                setError("");
              }}
            >
              Review evidence
            </Button>
          }
        >
          <Text as="p" size="small" color="color.text.subtle">
            {artifact.reviewedBy
              ? `${artifact.reviewedBy} · ${artifact.reviewedOn ?? "Undated"}`
              : "No review recorded"}
          </Text>
          {artifact.reviewNote ? (
            <Text as="p" size="small">
              {artifact.reviewNote}
            </Text>
          ) : null}
          {editing === "review" ? (
            <Stack space="space.150" className="pt-150">
              <Field>
                <FieldLabel
                  id={`${fieldId}-review-status-12-label`}
                  htmlFor={`${fieldId}-review-status-12`}
                >
                  {"Review status"}
                </FieldLabel>
                <Select<string>
                  items={reviewItems}
                  value={review}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return setReview(value as EvidenceReview);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-review-status-12`}
                    aria-labelledby={`${fieldId}-review-status-12-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-review-status-12-label`}>
                    {reviewItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-reviewer-13-label`} htmlFor={`${fieldId}-reviewer-13`}>
                  {"Reviewer"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-reviewer-13`}
                  aria-labelledby={`${fieldId}-reviewer-13-label`}
                  value={reviewer}
                  onChange={(event) => setReviewer(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-review-rationale-14-label`}
                  htmlFor={`${fieldId}-review-rationale-14`}
                >
                  {"Review rationale"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-review-rationale-14`}
                  aria-labelledby={`${fieldId}-review-rationale-14-label`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Scope, version and suitability for the linked claims."
                />
              </Field>
              <Inline space="space.100">
                <Button
                  size="small"
                  variant="primary"
                  onClick={() =>
                    run(() => {
                      reviewEvidence(artifact.id, review, reviewer, note);
                      closeEditor();
                      toast.success("Evidence review saved");
                    })
                  }
                >
                  Save review
                </Button>
                <Button size="small" onClick={closeEditor}>
                  Cancel
                </Button>
              </Inline>
            </Stack>
          ) : null}
        </Block>
        {error ? (
          <p role="alert" className="font-body-small text-danger">
            {error}
          </p>
        ) : null}
      </Stack>
    </PreviewSheet>
  );
}

function EvidenceTargetLink({
  programId,
  row,
  elementId,
}: {
  programId: string;
  row: EvidenceSupportRow;
  elementId?: string | undefined;
}) {
  const link = row.link;
  if (!row.available) return <Text size="small">{link.id} · unavailable</Text>;
  const label = <span title={row.title}>{link.id}</span>;
  if (link.kind === "control")
    return (
      <TextLink>
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: link.id }}
          search={{
            tab: "Implementation",
            scope: link.scopeId,
            element: elementId ?? row.elementId,
          }}
        >
          {label}
        </Link>
      </TextLink>
    );
  if (link.kind === "requirement")
    return (
      <TextLink>
        <Link
          to="/programs/$programId/requirements/$requirementId"
          params={{ programId, requirementId: link.id }}
          search={{ element: elementId ?? row.elementId }}
        >
          {label}
        </Link>
      </TextLink>
    );
  if (link.kind === "finding")
    return (
      <TextLink>
        <Link
          to="/programs/$programId"
          params={{ programId }}
          search={{ tab: "Findings", findingId: link.id, element: elementId }}
        >
          {label}
        </Link>
      </TextLink>
    );
  return (
    <TextLink>
      <Link
        to="/programs/$programId"
        params={{ programId }}
        search={{
          tab: "Assessments",
          assessmentId: row.campaignId,
          assessmentRunId: row.runId,
          element: elementId,
        }}
      >
        {label}
      </Link>
    </TextLink>
  );
}

/** Requirement record readers consume the same artifact relationships as the inventory. */
export function RequirementEvidence({
  programId,
  requirementId,
}: {
  programId: string;
  requirementId: string;
}) {
  useEvidenceVersion();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const linked = evidenceForTarget(programId, "requirement", requirementId);
  const selectedItems = [
    { value: "", label: "Choose program evidence…" },
    ...evidenceForProgram(programId)
      .filter((artifact) => !linked.some((row) => row.id === artifact.id))
      .map((artifact) => ({
        value: artifact.id,
        label: (
          <>
            {artifact.id} · {artifact.label}
          </>
        ),
      })),
  ];
  return (
    <Stack space="space.100">
      {linked.map((artifact) => (
        <Inline key={artifact.id} space="space.100">
          <TextLink>
            <button type="button" onClick={() => setPreviewId(artifact.id)}>
              {artifact.id} · {artifact.label}
            </button>
          </TextLink>
          {artifact.url ? (
            <TextLink>
              <a href={artifact.url} target="_blank" rel="noreferrer">
                Open artifact
              </a>
            </TextLink>
          ) : null}
          <Badge size="small" tone={reviewTone(artifact.review)}>
            {artifact.review}
          </Badge>
        </Inline>
      ))}
      {!linked.length ? (
        <Text as="p" size="small">
          No supporting evidence linked.
        </Text>
      ) : null}
      <Inline space="space.100">
        <Select<string>
          items={selectedItems}
          value={selected}
          onValueChange={(value) => {
            if (value === null) return;
            return setSelected(value);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Evidence to link">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectedItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="small"
          disabled={!selected}
          onClick={() => {
            try {
              linkArtifact(selected, { kind: "requirement", id: requirementId });
              setSelected("");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Evidence could not be linked");
            }
          }}
        >
          Link evidence
        </Button>
        <Button size="small" onClick={() => setAdding(true)}>
          Add evidence
        </Button>
      </Inline>
      {previewId ? (
        <EvidencePreview
          programId={programId}
          evidenceId={previewId}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
      {adding ? (
        <AddEvidenceDialog
          programId={programId}
          open
          onClose={() => setAdding(false)}
          initialLink={{ kind: "requirement", id: requirementId }}
        />
      ) : null}
    </Stack>
  );
}
