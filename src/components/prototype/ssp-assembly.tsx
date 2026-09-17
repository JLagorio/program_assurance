import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { useQuery } from "@tanstack/react-query";
import { EmptyMessage, QueryState } from "./work-common";
import {
  Badge,
  Box,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DataTable,
  Inline,
  KeyValue,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  TextLink,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
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
  description: string;
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
          <SelectTrigger aria-label="Authorization boundary" className="w-layout-list max-w-full">
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
        <h2 className="font-heading-small">SSP assembly</h2>
        {plan && (
          <Select
            value={plan.id}
            onValueChange={(value) => {
              if (value) setChosenId(value);
            }}
          >
            <SelectTrigger aria-label="SSP selection" className="w-layout-rail max-w-full">
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
              <Button onClick={() => setCreating(true)}>Create SSP revision</Button>
            )}
          </Stack>
        </Section>
      )}
      {creating && (
        <ProductRecordDialog
          table="ssp_revisions"
          description="Create a system security plan with an explicit resolved baseline."
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
  const navigate = useNavigate();
  const selected = rows.find((row) => row.id === selectedId);
  const editable = plan.state === "draft" && workspace.role !== "viewer";
  const columns = useMemo(
    () =>
      defineColumns<SspControlAssembly>((c) => [
        c.id("code", {
          header: "Control",
          width: 130,
          priority: 1,
          hideable: false,
          preview: (row) => {
            setSelectedId(row.id);
            setEvidenceId(undefined);
          },
          active: (row) => row.id === selectedId,
        }),
        c.text("title", {
          header: "Title",
          minWidth: 180,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="selected_controls" record={row.selection}>
              {row.title}
            </RecordLink>
          ),
        }),
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
    [selectedId],
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
  const displayedRows = useDisplayedRecords(table);
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
      description: `${row.code} · ${row.title}`,
      ...(row.implementation ? { existing: row.implementation as DataRecord } : {}),
      initialValues: { ssp_revision_id: plan.id, selected_control_id: row.id },
    });
  return (
    <Stack space="space.200">
      {!loading && !error && boundaryBaselineDiffers && (
        <Section title="System baseline differs from this SSP">
          <p className="text-subtle">
            This SSP retains its stored selection. Review the boundary’s changed baseline before
            creating an updated SSP.
          </p>
        </Section>
      )}
      {!loading && !error && !!selectionGaps.length && (
        <Section title="System controls outside this SSP selection">
          <Stack space="space.150">
            <p className="text-subtle">These controls are outside this SSP’s stored selection.</p>
            {selectionGaps.map((gap) => (
              <p key={gap.system.id}>
                <strong>{gap.system.name}:</strong>{" "}
                {gap.controls.map((control) => control.code).join(", ")}
              </p>
            ))}
          </Stack>
        </Section>
      )}
      <QueryState queries={queries}>
        <DataTable
          responsive
          table={table}
          onRowClick={(row) => void navigate(recordDestination("selected_controls", row.selection))}
          empty={{
            title: "No controls in this SSP selection",
            description: "The stored baseline contains no selected controls.",
          }}
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={table.setGlobalFilter}
              placeholder="Find selected controls"
              filters={<DataTable.Filter table={table} column="narrative" />}
            >
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Toolbar>
          }
        />
      </QueryState>
      {!loading && !error && (
        <Collapsible>
          <CollapsibleTrigger
            render={<Button variant="subtle" size="small" iconAfter={<ChevronDown />} />}
          >
            SSP details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Stack space="space.100" className="pt-150">
              <KeyValue label="Stored baseline" wrap>
                {profileRecord.data?.title}
              </KeyValue>
              <KeyValue label="Selected controls">{rows.length}</KeyValue>
              <KeyValue label="Control narratives">{authored}</KeyValue>
              <KeyValue label="Related requirements">{linkedRequirements}</KeyValue>
              <KeyValue label="Linked evidence versions">{linkedEvidence}</KeyValue>
              {resolution.data?.resolver_name === "archived-demo-explicit-selection" && (
                <KeyValue label="Source">Imported demo selection</KeyValue>
              )}
            </Stack>
          </CollapsibleContent>
        </Collapsible>
      )}
      {selected && !editor && (
        <RecordPreviewPanel
          title={selected.title}
          label="SSP control preview"
          defaultWidth={640}
          onClose={() => {
            setSelectedId(undefined);
            setEvidenceId(undefined);
          }}
          navigation={
            <RecordPreviewActions
              table="selected_controls"
              record={selected.selection}
              rows={displayedRows}
              onSelect={(row) => {
                setSelectedId(row.id);
                setEvidenceId(undefined);
              }}
            />
          }
        >
          <Stack space="space.200">
            <KeyValue label="Control">{selected.code}</KeyValue>
            <KeyValue label="SSP">
              {systems.data?.find((row) => row.id === plan.system_id)?.name ?? "Boundary"} · SSP{" "}
              {plan.version_number}
            </KeyValue>
            {version && artifact && (
              <RecordPreviewPanel
                title={artifact.title}
                label="Supporting evidence preview"
                defaultWidth={640}
                onClose={() => setEvidenceId(undefined)}
                navigation={
                  <RecordPreviewActions
                    table="evidence_versions"
                    record={version}
                    rows={selected.evidence.flatMap((support) =>
                      support.version ? [support.version] : [],
                    )}
                    onSelect={(next) =>
                      setEvidenceId(
                        selected.evidence.find((support) => support.version?.id === next.id)?.id,
                      )
                    }
                  />
                }
              >
                <Stack space="space.200">
                  <p>Exact evidence version {version.version_number}</p>
                  <EvidenceVersionDetails artifact={artifact} version={version} />
                </Stack>
              </RecordPreviewPanel>
            )}
            <Stack space="space.300">
              <Section
                title="Control implementation"
                action={
                  editable ? (
                    <Button onClick={() => openNarrative(selected)}>
                      {selected.implementation
                        ? "Edit control implementation"
                        : "Create control implementation"}
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
                      Not applicable rationale: {selected.implementation.not_applicable_rationale}
                    </p>
                  )}
                </Stack>
              </Section>
              {!!selected.gaps.length && (
                <Section title="Recorded gaps">
                  <Box as="ul" paddingInlineStart="space.250" className="list-disc text-subtle">
                    {selected.gaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </Box>
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
                                description: "Update this statement’s implementation narrative.",
                              })
                            }
                          >
                            Edit implementation statement
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
                    <EmptyMessage
                      compact
                      title="No component contributions"
                      description="A nested system or inherited control selection does not create an implementation narrative."
                    />
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
                                description: "Update this component’s contribution narrative.",
                              })
                            }
                          >
                            Edit component contribution
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
                  <EmptyMessage
                    compact
                    title="No requirement support"
                    description="No requirement support or allocated control mapping is recorded."
                  />
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
                            <Button variant="link" onClick={() => setEvidenceId(support.id)}>
                              {support.artifact.title}
                            </Button>
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
                  <EmptyMessage
                    compact
                    title="No supporting evidence"
                    description="No evidence is linked through this implementation or its related requirements."
                  />
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
          </Stack>
        </RecordPreviewPanel>
      )}
      {editor && <ProductRecordDialog {...editor} onClose={() => setEditor(undefined)} />}
    </Stack>
  );
}
