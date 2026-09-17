import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Inline,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useRow, useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { assembleSsp, sspSelectionGaps, type SspControlAssembly } from "@/lib/ssp-assembly";
import { EvidenceVersionDetails } from "./evidence-version-details";
import { ProductRecordDialog } from "./product-record-dialog";
import { ProgramQueryState, StatusValue, type ProgramTableName } from "./program-shared";

type Editor = {
  table: ProgramTableName;
  existing?: DataRecord;
  initialValues?: Record<string, unknown>;
  title: string;
};

export function ProgramSspAssembly({ programId }: { programId: string }) {
  const systems = useRows("systems", { program_id: programId });
  const [chosen, setChosen] = useState<string>();
  const boundaries = (systems.data ?? []).filter((system) => system.is_authorization_boundary);
  const boundary = boundaries.find((system) => system.id === chosen) ?? boundaries[0];
  if (systems.isPending || systems.error)
    return <ProgramQueryState loading={systems.isPending} error={systems.error} />;
  if (!boundary)
    return (
      <p className="text-subtle">
        Add an authorization boundary in the system tree to assemble its control implementations.
      </p>
    );
  return (
    <Stack space="space.250">
      {boundaries.length > 1 && (
        <Select
          value={boundary.id}
          onValueChange={(value) => {
            if (value) setChosen(value);
          }}
        >
          <SelectTrigger aria-label="Authorization boundary" className="w-96">
            <SelectValue>
              {boundary.code} · {boundary.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {boundaries.map((system) => (
              <SelectItem key={system.id} value={system.id}>
                {system.code} · {system.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <SspAssembly key={boundary.id} programId={programId} systemId={boundary.id} />
    </Stack>
  );
}

function useSspParts(ids: string[], enabled: boolean) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["ssp-assembly-parts", workspace.tenantId, ids],
    enabled,
    retry: false,
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const rows: Row<"control_parts">[] = [];
      const seen = new Set<string>();
      let pending = ids;
      while (pending.length) {
        const batch = [...new Set(pending)].filter((id) => !seen.has(id));
        pending = [];
        batch.forEach((id) => seen.add(id));
        for (let offset = 0; offset < batch.length; offset += 100) {
          const { data, error } = await database()
            .from("control_parts")
            .select()
            .in("id", batch.slice(offset, offset + 100))
            .setHeader("Authorization", `Bearer ${token}`)
            .abortSignal(signal);
          if (error) throw new Error(error.message);
          rows.push(...data);
          pending.push(...data.flatMap((row) => row.parent_part_id ?? []));
        }
      }
      return rows;
    },
  });
}

/** Boundary SSP assembly. Every selected control is visible, even before anyone
 * has authored its implementation. The selected plan retains its exact baseline. */
export function SspAssembly({ programId, systemId }: { programId: string; systemId: string }) {
  const workspace = useWorkspace();
  const system = useRow("systems", systemId);
  const plans = useRows("ssp_revisions", { system_id: systemId });
  const [chosenId, setChosenId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const ordered = [...(plans.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const plan = ordered.find((item) => item.id === chosenId) ?? ordered[0];
  if (system.isPending || plans.isPending || system.error || plans.error)
    return (
      <ProgramQueryState
        loading={system.isPending || plans.isPending}
        error={system.error ?? plans.error}
      />
    );
  if (
    !system.data ||
    system.data.program_id !== programId ||
    !system.data.is_authorization_boundary
  )
    return <p role="alert">Choose an authorization boundary in this program to read its SSP.</p>;
  return (
    <Stack space="space.250">
      <Inline space="space.200" alignBlock="center" spread="space-between" shouldWrap>
        <div>
          <h2 className="font-heading-small">SSP assembly</h2>
          <p className="text-subtle">
            {system.data.name} · Authored implementation content and its recorded support.
          </p>
        </div>
        {plan && (
          <Select
            value={plan.id}
            onValueChange={(value) => {
              if (value) setChosenId(value);
            }}
          >
            <SelectTrigger aria-label="SSP selection" className="w-72">
              <SelectValue>
                SSP {plan.version_number} · {labelFor(plan.state)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ordered.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  SSP {item.version_number} · {labelFor(item.state)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Inline>
      {plan ? (
        <SspAssemblyPlan key={plan.id} programId={programId} plan={plan} />
      ) : (
        <Section title="No SSP recorded">
          <Stack space="space.150">
            <p className="text-subtle">
              Create a system security plan with an explicit resolved baseline to begin assembling
              its control implementations.
            </p>
            {workspace.role !== "viewer" && (
              <Button onClick={() => setCreating(true)}>Create SSP</Button>
            )}
          </Stack>
        </Section>
      )}
      {creating && (
        <ProductRecordDialog
          table="ssp_revisions"
          title="Create system security plan"
          initialValues={{ system_id: systemId }}
          onClose={() => setCreating(false)}
          onSaved={(row) => setChosenId(row.id)}
        />
      )}
    </Stack>
  );
}

function SspAssemblyPlan({ programId, plan }: { programId: string; plan: Row<"ssp_revisions"> }) {
  const workspace = useWorkspace();
  const selections = useRows("selected_controls");
  const effectiveBaselines = useRows("system_effective_baselines");
  const controls = useRows("controls");
  const systems = useRows("systems", { program_id: programId });
  const implementations = useRows("implemented_requirements", { ssp_revision_id: plan.id });
  const statements = useRows("implementation_statements", { ssp_revision_id: plan.id });
  const contributions = useRows("component_contributions");
  const components = useRows("system_components");
  const componentElements = useRows("system_component_element_links");
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const contents = useRows("requirement_revisions");
  const requirementLinks = useRows("requirement_implementations");
  const controlMappings = useRows("requirement_control_links");
  const allocations = useRows("requirement_allocations");
  const requirementEvidence = useRows("requirement_evidence");
  const implementationEvidence = useRows("implementation_evidence");
  const artifacts = useRows("evidence_artifacts");
  const versions = useRows("evidence_versions");
  const acceptances = useRows("inheritance_acceptances", { ssp_revision_id: plan.id });
  const offerings = useRows("offered_implementations");
  const resolution = useRow("profile_resolutions", plan.profile_resolution_id);
  const profile = useRow("profile_revisions", resolution.data?.profile_revision_id);
  const profileRecord = useRow("profiles", profile.data?.profile_id);
  const partIds = useMemo(
    () =>
      [
        ...new Set([
          ...(statements.data ?? []).map((row) => row.control_part_id),
          ...(controlMappings.data ?? []).flatMap((row) => row.control_part_id ?? []),
        ]),
      ].sort(),
    [statements.data, controlMappings.data],
  );
  const parts = useSspParts(partIds, statements.isSuccess && controlMappings.isSuccess);
  const queries = [
    selections,
    controls,
    systems,
    implementations,
    statements,
    contributions,
    components,
    componentElements,
    requirements,
    contents,
    requirementLinks,
    controlMappings,
    allocations,
    requirementEvidence,
    implementationEvidence,
    artifacts,
    versions,
    acceptances,
    offerings,
    parts,
    effectiveBaselines,
    resolution,
    profile,
    profileRecord,
  ];
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;
  const rows = useMemo(
    () =>
      assembleSsp({
        plan,
        selections: selections.data ?? [],
        controls: controls.data ?? [],
        parts: parts.data ?? [],
        systems: systems.data ?? [],
        implementations: implementations.data ?? [],
        statements: statements.data ?? [],
        contributions: contributions.data ?? [],
        components: components.data ?? [],
        componentElements: componentElements.data ?? [],
        requirements: requirements.data ?? [],
        contents: contents.data ?? [],
        requirementLinks: requirementLinks.data ?? [],
        controlMappings: controlMappings.data ?? [],
        allocations: allocations.data ?? [],
        requirementEvidence: requirementEvidence.data ?? [],
        implementationEvidence: implementationEvidence.data ?? [],
        artifacts: artifacts.data ?? [],
        versions: versions.data ?? [],
        acceptances: acceptances.data ?? [],
        offerings: offerings.data ?? [],
        effectiveBaselines: effectiveBaselines.data ?? [],
      }),
    [
      plan,
      selections.data,
      controls.data,
      parts.data,
      systems.data,
      implementations.data,
      statements.data,
      contributions.data,
      components.data,
      componentElements.data,
      requirements.data,
      contents.data,
      requirementLinks.data,
      controlMappings.data,
      allocations.data,
      requirementEvidence.data,
      implementationEvidence.data,
      artifacts.data,
      versions.data,
      acceptances.data,
      offerings.data,
      effectiveBaselines.data,
    ],
  );
  const [selectedId, setSelectedId] = useState<string>();
  const selectionGaps = sspSelectionGaps({
    plan,
    selections: selections.data ?? [],
    controls: controls.data ?? [],
    systems: systems.data ?? [],
    effectiveBaselines: effectiveBaselines.data ?? [],
  });
  const [editor, setEditor] = useState<Editor>();
  const [evidenceId, setEvidenceId] = useState<string>();
  const selected = rows.find((row) => row.id === selectedId);
  const editable = plan.state === "draft" && workspace.role !== "viewer";
  const columns = useMemo(
    () =>
      defineColumns<SspControlAssembly>((c) => [
        c.text("code", {
          header: "Control",
          width: 130,
          hideable: false,
          cell: (row) => (
            <TextLink render={<button type="button" onClick={() => setSelectedId(row.id)} />}>
              {row.code}
            </TextLink>
          ),
        }),
        c.text("title", { header: "Title", minWidth: 230, hideable: false }),
        c.text("status", {
          header: "Recorded implementation",
          width: 180,
          cell: (row) => (row.implementation ? <StatusValue value={row.status} /> : "Not recorded"),
        }),
        c.text("narrative", { header: "Control narrative", width: 160 }),
        c.number("contributionCount", { header: "Contributions", width: 120 }),
        c.number("requirementCount", { header: "Requirements", width: 130 }),
        c.number("evidenceCount", { header: "Evidence", width: 105 }),
      ]),
    [],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "SSP control assembly",
    view: "ssp-control-assembly",
    pageSize: 20,
    resizable: true,
  });
  const version = versions.data?.find((row) => row.id === evidenceId);
  const artifact = artifacts.data?.find((row) => row.id === version?.artifact_id);
  const authored = rows.filter((row) => row.narrative === "Recorded").length;
  const linkedRequirements = new Set(
    rows.flatMap((row) => row.requirements.map((support) => support.requirement.id)),
  ).size;
  const linkedEvidence = new Set(rows.flatMap((row) => row.evidence.map((support) => support.id)))
    .size;
  const currentBoundaryBaseline = effectiveBaselines.data?.find(
    (baseline) => baseline.system_id === plan.system_id,
  );
  const boundaryBaselineDiffers =
    currentBoundaryBaseline?.profile_resolution_id != null &&
    currentBoundaryBaseline.profile_resolution_id !== plan.profile_resolution_id;
  const openNarrative = (row: SspControlAssembly) =>
    setEditor({
      table: "implemented_requirements",
      title: `${row.implementation ? "Edit" : "Write"} ${row.code} implementation`,
      ...(row.implementation ? { existing: row.implementation as DataRecord } : {}),
      initialValues: { ssp_revision_id: plan.id, selected_control_id: row.id },
    });
  return (
    <Stack space="space.200">
      <p className="text-subtle">
        Baseline: {profileRecord.data?.title ?? "Loading stored profile…"}. This preview uses the
        SSP’s exact stored selection. Implementation claims, supporting records and assessment
        conclusions remain separate.
      </p>
      {!loading && !error && (
        <Inline space="space.100" shouldWrap>
          {resolution.data?.resolver_name === "archived-demo-explicit-selection" && (
            <Badge variant="secondary">Imported demo selection</Badge>
          )}
          <Badge variant="secondary">{rows.length} selected controls</Badge>
          <Badge variant="secondary">{authored} control narratives</Badge>
          <Badge variant="secondary">{linkedRequirements} related requirements</Badge>
          <Badge variant="secondary">{linkedEvidence} linked evidence versions</Badge>
        </Inline>
      )}
      {!loading && !error && boundaryBaselineDiffers && (
        <Section title="System baseline differs from this SSP">
          <p className="text-subtle">
            The authorization boundary currently uses a different resolved baseline. This SSP
            retains its exact stored profile and control selection. Review the difference before
            creating an updated SSP.
          </p>
        </Section>
      )}
      {!loading && !error && !!selectionGaps.length && (
        <Section title="System controls outside this SSP selection">
          <Stack space="space.150">
            <p className="text-subtle">
              These recorded system baselines contain additional controls. They remain outside this
              SSP until its selection is deliberately updated.
            </p>
            {selectionGaps.map((gap) => (
              <p key={gap.system.id}>
                <strong>{gap.system.name}:</strong>{" "}
                {gap.controls.map((control) => control.code).join(", ")}
              </p>
            ))}
          </Stack>
        </Section>
      )}
      <DataTable
        table={table}
        state={error ? "error" : loading ? "loading" : "ready"}
        error={error instanceof Error ? error.message : "SSP support records could not be loaded."}
        onRowClick={(row) => setSelectedId(row.id)}
        empty={{
          title: "No controls in this SSP selection",
          description: "The stored baseline contains no selected controls.",
        }}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Search selected controls…" width={280} />
            <DataTable.Filter table={table} column="narrative" />
            <Inline className="ml-auto">
              <DataTable.Columns table={table} />
            </Inline>
          </Inline>
        }
      />
      {selected && !editor && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedId(undefined);
              setEvidenceId(undefined);
            }
          }}
        >
          <DialogContent style={{ width: "90vw", maxWidth: 1440, height: "90dvh" }}>
            <DialogHeader>
              <DialogTitle>
                {version && artifact ? artifact.title : `${selected.code} · ${selected.title}`}
              </DialogTitle>
              <DialogDescription>
                {version && artifact
                  ? `Exact evidence version ${version.version_number}`
                  : `${systems.data?.find((row) => row.id === plan.system_id)?.name ?? "Boundary"} · SSP ${plan.version_number}`}
              </DialogDescription>
            </DialogHeader>
            <Box padding="space.300" className="min-h-0 flex-1 overflow-y-auto">
              {version && artifact ? (
                <Stack space="space.200">
                  <Button variant="secondary" onClick={() => setEvidenceId(undefined)}>
                    Back to control
                  </Button>
                  <EvidenceVersionDetails artifact={artifact} version={version} />
                </Stack>
              ) : (
                <Stack space="space.300">
                  <Section
                    title="Control implementation"
                    action={
                      editable ? (
                        <Button onClick={() => openNarrative(selected)}>
                          {selected.implementation ? "Edit narrative" : "Write narrative"}
                        </Button>
                      ) : undefined
                    }
                  >
                    <Stack space="space.150">
                      <StatusValue value={selected.implementation?.implementation_status} />
                      <p className="whitespace-pre-wrap">
                        {selected.implementation?.description ||
                          "No control implementation narrative recorded."}
                      </p>
                      {selected.implementation?.not_applicable_rationale && (
                        <p className="whitespace-pre-wrap text-subtle">
                          Not applicable rationale:{" "}
                          {selected.implementation.not_applicable_rationale}
                        </p>
                      )}
                    </Stack>
                  </Section>
                  {!!selected.gaps.length && (
                    <Section title="Recorded gaps">
                      <ul className="list-disc pl-5 text-subtle">
                        {selected.gaps.map((gap) => (
                          <li key={gap}>{gap}</li>
                        ))}
                      </ul>
                    </Section>
                  )}
                  {!!selected.statements.length && (
                    <Section title="Statement narratives">
                      <Stack space="space.200">
                        {selected.statements.map((statement) => (
                          <div key={statement.id}>
                            <p className="font-medium">
                              {parts.data?.find((part) => part.id === statement.control_part_id)
                                ?.source_id ?? "Control statement"}
                            </p>
                            <p className="whitespace-pre-wrap">{statement.description}</p>
                            {editable && (
                              <Button
                                size="small"
                                variant="secondary"
                                onClick={() =>
                                  setEditor({
                                    table: "implementation_statements",
                                    existing: statement as DataRecord,
                                    initialValues: {
                                      ssp_revision_id: plan.id,
                                      implemented_requirement_id: selected.implementation!.id,
                                      control_part_id: statement.control_part_id,
                                    },
                                    title: "Edit statement narrative",
                                  })
                                }
                              >
                                Edit statement
                              </Button>
                            )}
                          </div>
                        ))}
                      </Stack>
                    </Section>
                  )}
                  <Section title="Contributing systems">
                    <Stack space="space.200">
                      {!selected.contributions.length && (
                        <p className="text-subtle">
                          No component contribution recorded. A nested system or inherited control
                          selection does not create an implementation narrative.
                        </p>
                      )}
                      {selected.contributions.map(({ record, component, path, binding }) => (
                        <Section
                          key={record.id}
                          title={component?.name ?? "Component unavailable"}
                          action={
                            editable ? (
                              <Button
                                size="small"
                                variant="secondary"
                                onClick={() =>
                                  setEditor({
                                    table: "component_contributions",
                                    existing: record as DataRecord,
                                    initialValues: {
                                      ssp_revision_id: plan.id,
                                      implemented_requirement_id: selected.implementation!.id,
                                      system_component_id: record.system_component_id,
                                    },
                                    title: "Edit contribution narrative",
                                  })
                                }
                              >
                                Edit contribution
                              </Button>
                            ) : undefined
                          }
                        >
                          <Stack space="space.100">
                            <p className="text-subtle">
                              {path}
                              {["unbound", "ambiguous"].includes(binding)
                                ? " · Identity needs review"
                                : ""}
                            </p>
                            <StatusValue value={record.implementation_status} />
                            <p className="whitespace-pre-wrap">{record.description}</p>
                          </Stack>
                        </Section>
                      ))}
                    </Stack>
                  </Section>
                  <Section title="Requirements">
                    <p className="text-subtle mb-150">
                      Explicit implementation links and control mappings retain their separate
                      meanings.
                    </p>
                    <Table aria-label="SSP supporting requirements">
                      <thead>
                        <Table.Row>
                          <Table.Header>Requirement</Table.Header>
                          <Table.Header>Statement</Table.Header>
                          <Table.Header>Relationship</Table.Header>
                        </Table.Row>
                      </thead>
                      <tbody>
                        {selected.requirements.map((support) => (
                          <Table.Row key={support.content.id}>
                            <Table.Cell>
                              <TextLink
                                render={
                                  <Link
                                    to="/programs/$programId/requirements/$requirementId"
                                    params={{ programId, requirementId: support.requirement.id }}
                                  />
                                }
                              >
                                {support.requirement.code}
                              </TextLink>
                            </Table.Cell>
                            <Table.Cell>{support.content.statement}</Table.Cell>
                            <Table.Cell>
                              {support.descriptions.join(" · ")}
                              {support.rationale.map((rationale) => (
                                <p className="text-subtle" key={rationale}>
                                  {rationale}
                                </p>
                              ))}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </tbody>
                    </Table>
                    {!selected.requirements.length && (
                      <p className="text-subtle mt-150">
                        No requirement support or allocated control mapping recorded.
                      </p>
                    )}
                  </Section>
                  <Section title="Evidence">
                    <Table aria-label="SSP supporting evidence">
                      <thead>
                        <Table.Row>
                          <Table.Header>Evidence</Table.Header>
                          <Table.Header>Exact version</Table.Header>
                          <Table.Header>Recorded support</Table.Header>
                        </Table.Row>
                      </thead>
                      <tbody>
                        {selected.evidence.map((support) => (
                          <Table.Row key={support.id}>
                            <Table.Cell>
                              {support.artifact && support.version ? (
                                <TextLink
                                  render={
                                    <button
                                      type="button"
                                      onClick={() => setEvidenceId(support.id)}
                                    />
                                  }
                                >
                                  {support.artifact.title}
                                </TextLink>
                              ) : (
                                "Evidence unavailable"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {support.version
                                ? `Version ${support.version.version_number} · ${labelFor(support.version.state)}`
                                : "Version unavailable"}
                            </Table.Cell>
                            <Table.Cell>
                              {support.origins.map((origin) => (
                                <div key={`${origin.id}/${origin.label}`}>
                                  <p>{origin.label}</p>
                                  {origin.claim && <p className="text-subtle">{origin.claim}</p>}
                                  {origin.rationale && (
                                    <p className="text-subtle">{origin.rationale}</p>
                                  )}
                                </div>
                              ))}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </tbody>
                    </Table>
                    {!selected.evidence.length && (
                      <p className="text-subtle mt-150">
                        No evidence is linked through this implementation or its related
                        requirements.
                      </p>
                    )}
                  </Section>
                  {!!selected.inherited.length && (
                    <Section title="Accepted provider contributions">
                      <Stack space="space.200">
                        {selected.inherited.map(({ acceptance, offering, contribution }) => (
                          <div key={acceptance.id}>
                            <p className="font-medium">
                              {offering?.name ?? "Provider offering unavailable"}
                            </p>
                            <p className="whitespace-pre-wrap">
                              {contribution?.description ?? "Pinned provider narrative unavailable"}
                            </p>
                            <p className="text-subtle">
                              Recorded acceptance: {acceptance.accepted_at}. {acceptance.rationale}
                            </p>
                            {acceptance.consumer_responsibility && (
                              <p>Consumer responsibility: {acceptance.consumer_responsibility}</p>
                            )}
                          </div>
                        ))}
                      </Stack>
                    </Section>
                  )}
                </Stack>
              )}
            </Box>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedId(undefined);
                  setEvidenceId(undefined);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {editor && <ProductRecordDialog {...editor} onClose={() => setEditor(undefined)} />}
    </Stack>
  );
}
