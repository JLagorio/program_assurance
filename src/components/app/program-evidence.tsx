import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Badge,
  Block,
  Button,
  DataTable,
  Dialog,
  Fact,
  Field,
  Input,
  Inline,
  NativeSelect,
  PreviewSheet,
  Stack,
  Text,
  Textarea,
  TextLink,
  defineColumns,
  useDataTable,
  toast,
} from "@ledger/design-system";
import {
  createEvidence,
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
import { currentSession, linkEvidence, useWorkVersion, workFor } from "@/lib/control-work";
import { requirementsForProgram } from "@/lib/requirements";
import { scopesForProgram, controlSetFor } from "@/lib/scopes";

const reviewTone = (review: EvidenceReview) =>
  review === "Accepted"
    ? ("success" as const)
    : review === "Needs revision"
      ? ("danger" as const)
      : ("warning" as const);
const describeLink = (link: EvidenceLink) =>
  `${link.kind === "control" ? "Implementation" : link.kind === "requirement" ? "Requirement" : link.kind === "finding" ? "Finding" : "Assessment"} · ${link.id}${link.scopeId ? ` · ${link.scopeId}` : ""}`;

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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add evidence"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Add reference
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field label="Title" isRequired>
          <Input value={draft.label} onChange={(event) => set("label", event.target.value)} />
        </Field>
        <Field label="Artifact URL" isRequired>
          <Input
            type="url"
            placeholder="https://repository.example/artifacts/report.pdf"
            value={draft.url}
            onChange={(event) => set("url", event.target.value)}
          />
        </Field>
        <Text as="p" size="small" color="color.text.subtle">
          Link to the artifact in your document or evidence repository. Access remains controlled by
          that repository.
        </Text>
        <Inline space="space.150" shouldWrap>
          <Field label="Kind">
            <NativeSelect
              value={draft.kind}
              onChange={(event) => set("kind", event.target.value as EvidenceArtifact["kind"])}
            >
              {["Document", "Configuration", "Test result", "Scan output"].map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Version" isRequired>
            <Input value={draft.version} onChange={(event) => set("version", event.target.value)} />
          </Field>
          <Field label="Collected on" isRequired>
            <Input
              type="date"
              value={draft.collected}
              onChange={(event) => set("collected", event.target.value)}
            />
          </Field>
        </Inline>
        <Field label="Owner" isRequired>
          <Input value={draft.owner} onChange={(event) => set("owner", event.target.value)} />
        </Field>
        <Field label="System">
          <NativeSelect
            value={draft.scopeIds?.[0] ?? ""}
            disabled={!!initialLink?.scopeId}
            onChange={(event) => set("scopeIds", event.target.value ? [event.target.value] : [])}
          >
            <option value="">Program-wide</option>
            {scopesForProgram(programId).map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Provenance" isRequired>
          <Textarea
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
    </Dialog>
  );
}

export function ProgramEvidence({ programId }: { programId: string }) {
  const version = useEvidenceVersion();
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
          cell: (artifact) =>
            artifact.scopeIds
              .map((id) => scopesForProgram(programId).find((scope) => scope.id === id)?.name ?? id)
              .join(", ") || "Program-wide",
          text: (artifact) =>
            artifact.scopeIds
              .map((id) => scopesForProgram(programId).find((scope) => scope.id === id)?.name ?? id)
              .join(", ") || "Program-wide",
        }),
        c.custom("links", {
          header: "Supports",
          width: 280,
          cell: (artifact) => artifact.links.map(describeLink).join("; ") || "Not linked",
          text: (artifact) => artifact.links.map(describeLink).join("; ") || "Not linked",
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
    [programId],
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
          artifact={selected}
          onClose={() => setSelectedId(null)}
          version={version}
        />
      ) : null}
    </Stack>
  );
}

export function EvidencePreview({
  artifact,
  onClose,
}: {
  artifact: EvidenceArtifact;
  onClose: () => void;
  version?: number;
}) {
  const [kind, setKind] = useState<"control" | "requirement">("control");
  const scopes = scopesForProgram(artifact.program).filter(
    (scope) => !artifact.scopeIds.length || artifact.scopeIds.includes(scope.id),
  );
  const [scopeId, setScopeId] = useState(scopes[0]?.id ?? "");
  const [target, setTarget] = useState("");
  const [review, setReview] = useState<EvidenceReview>(artifact.review);
  const [note, setNote] = useState(artifact.reviewNote ?? "");
  const [reviewer, setReviewer] = useState(currentSession().name);
  const [error, setError] = useState("");
  const controls = scopeId ? (controlSetFor(scopeId)?.controls ?? []) : [];
  const run = (action: () => void) => {
    try {
      action();
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The record could not be saved.");
    }
  };
  return (
    <PreviewSheet
      openTo={
        artifact.url ? (
          <a href={artifact.url} target="_blank" rel="noreferrer">
            Open artifact
          </a>
        ) : (
          <Link
            to="/programs/$programId"
            params={{ programId: artifact.program }}
            search={{ tab: "Evidence" }}
          >
            Open program evidence
          </Link>
        )
      }
      open
      onClose={onClose}
      id={artifact.id}
      title={artifact.label}
      subtitle={`${artifact.kind} · version ${artifact.version}`}
      status={<Badge tone={reviewTone(artifact.review)}>{artifact.review}</Badge>}
      facts={
        <>
          <Fact label="Owner">{artifact.owner}</Fact>
          <Fact label="Collected">{artifact.collected}</Fact>
          <Fact label="Reviewed">
            {artifact.reviewedBy
              ? `${artifact.reviewedBy} · ${artifact.reviewedOn ?? "Undated"}`
              : "Not reviewed"}
          </Fact>
        </>
      }
      actions={
        artifact.url ? (
          <Button render={<a href={artifact.url} target="_blank" rel="noreferrer" />}>
            Open artifact
          </Button>
        ) : undefined
      }
    >
      <Stack space="space.150">
        <Block title="Provenance">
          <Text as="p">{artifact.provenance}</Text>
          {artifact.referenceUri ? (
            <Fact label="Reference">
              <span className="break-all">{artifact.referenceUri}</span>
            </Fact>
          ) : null}
          {artifact.validThrough ? (
            <Fact label="Valid through">{artifact.validThrough.slice(0, 10)}</Fact>
          ) : null}
          {artifact.sha256 ? (
            <Fact label="SHA-256">
              <span className="break-all">{artifact.sha256}</span>
            </Fact>
          ) : null}
          {artifact.componentIds?.length ? (
            <Fact label="Components">{artifact.componentIds.join(", ")}</Fact>
          ) : null}
          {!artifact.url ? (
            <Text as="p" size="small" color="color.text.subtle">
              This seeded reference has no linked artifact location.
            </Text>
          ) : null}
        </Block>
        <Block title="Supports" count={artifact.links.length}>
          <Stack space="space.100">
            {artifact.links.length ? (
              artifact.links.map((link) => (
                <Inline key={describeLink(link)} space="space.100" shouldWrap>
                  <EvidenceTargetLink programId={artifact.program} link={link} />
                  {["control", "requirement"].includes(link.kind) ? (
                    <Button
                      size="xsmall"
                      variant="subtle"
                      onClick={() =>
                        run(() => {
                          unlinkArtifact(artifact.id, link);
                        })
                      }
                    >
                      Unlink
                    </Button>
                  ) : null}
                </Inline>
              ))
            ) : (
              <Text as="p" size="small">
                Link this artifact to the claim it supports.
              </Text>
            )}
          </Stack>
        </Block>
        <Block title="Link supporting record">
          <Stack space="space.100">
            <Field label="Record type">
              <NativeSelect
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as typeof kind);
                  setTarget("");
                }}
              >
                <option value="control">Control implementation</option>
                <option value="requirement">Requirement</option>
              </NativeSelect>
            </Field>
            {kind === "control" ? (
              <Field label="System">
                <NativeSelect
                  value={scopeId}
                  onChange={(event) => {
                    setScopeId(event.target.value);
                    setTarget("");
                  }}
                >
                  {scopes.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            <Field label={kind === "control" ? "Control" : "Requirement"}>
              <NativeSelect value={target} onChange={(event) => setTarget(event.target.value)}>
                <option value="">Choose a record…</option>
                {kind === "control"
                  ? controls.map(({ control }) => (
                      <option key={control.id} value={control.id}>
                        {control.id} · {control.title}
                      </option>
                    ))
                  : requirementsForProgram(artifact.program).map((requirement) => (
                      <option key={requirement.id} value={requirement.id}>
                        {requirement.id} · {requirement.text}
                      </option>
                    ))}
              </NativeSelect>
            </Field>
            <Button
              size="small"
              disabled={!target}
              onClick={() =>
                run(() => {
                  if (kind === "control")
                    linkEvidence(workFor(artifact.program, scopeId, target).id, artifact.id);
                  else linkArtifact(artifact.id, { kind, id: target });
                  setTarget("");
                })
              }
            >
              Link evidence
            </Button>
          </Stack>
        </Block>
        <Block title="Review">
          <Stack space="space.100">
            <Field label="Review status">
              <NativeSelect
                value={review}
                onChange={(event) => setReview(event.target.value as EvidenceReview)}
              >
                {["Pending review", "Accepted", "Needs revision"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Reviewer">
              <Input value={reviewer} onChange={(event) => setReviewer(event.target.value)} />
            </Field>
            <Field label="Review rationale">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What does this artifact substantiate, and is its scope and version appropriate?"
              />
            </Field>
            <Button
              size="small"
              onClick={() =>
                run(() => {
                  reviewEvidence(artifact.id, review, reviewer, note);
                  toast.success("Evidence review saved");
                })
              }
            >
              Save review
            </Button>
            <Text as="p" size="small" color="color.text.subtle">
              Artifact review records suitability. Assessment results determine whether controls and
              requirements are met.
            </Text>
          </Stack>
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

function EvidenceTargetLink({ programId, link }: { programId: string; link: EvidenceLink }) {
  if (link.kind === "control")
    return (
      <TextLink>
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: link.id }}
          search={{ tab: "Implementation", scope: link.scopeId }}
        >
          {describeLink(link)}
        </Link>
      </TextLink>
    );
  if (link.kind === "requirement")
    return (
      <TextLink>
        <Link
          to="/programs/$programId/requirements/$requirementId"
          params={{ programId, requirementId: link.id }}
        >
          {describeLink(link)}
        </Link>
      </TextLink>
    );
  return <Text size="small">{describeLink(link)}</Text>;
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
  const linked = evidenceForTarget(programId, "requirement", requirementId);
  return (
    <Stack space="space.100">
      {linked.map((artifact) => (
        <Inline key={artifact.id} space="space.100">
          <Text size="small">
            {artifact.id} · {artifact.label}
          </Text>
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
        <NativeSelect
          aria-label="Evidence to link"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Choose program evidence…</option>
          {evidenceForProgram(programId)
            .filter((artifact) => !linked.some((row) => row.id === artifact.id))
            .map((artifact) => (
              <option key={artifact.id} value={artifact.id}>
                {artifact.id} · {artifact.label}
              </option>
            ))}
        </NativeSelect>
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
