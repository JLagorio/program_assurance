import { useMemo } from "react";
import { Absent, DataTable, Section, Stack, defineColumns } from "@ledger/design-system";
import { useRows } from "@/lib/models";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { ProgramCollection } from "./program-shared";
import { RecordLink, useOpenRecord } from "./record-preview";

/**
 * The program's Inheritance resolution: what it inherits from other systems and organizations,
 * read from the inheritance its latest SSP of each boundary accepts, and then the capabilities it
 * provides for others to inherit.
 */
export function ProgramInheritance({
  programId,
  systemIds,
}: {
  programId: string;
  systemIds: Set<string>;
}) {
  return (
    <Stack space="space.300" className="min-w-0">
      <InheritedControls programId={programId} systemIds={systemIds} />
      <ProgramCollection
        name="provider_capabilities"
        section
        empty={{
          title: "No provider capabilities yet",
          description: "Name a capability this program provides for other systems to inherit.",
        }}
        title="Provider capabilities"
        owner="program"
        where={(row) => systemIds.has(String(row["providing_system_id"]))}
        initialValues={
          systemIds.size === 1 ? { providing_system_id: [...systemIds][0]! } : undefined
        }
        columns={[
          { key: "code", title: "Capability" },
          { key: "name", title: "Name" },
          { key: "description", title: "Description" },
        ]}
      />
    </Stack>
  );
}

type InheritedRow = {
  id: string;
  controlId: string | null;
  name: string;
  provider: string | null;
  providerSystemId: string | null;
  providerProgramId: string | null;
  capability: string | null;
  implementation: string | null;
  responsibility: string | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
  ssp: string;
};

const inheritedColumns = (programId: string) =>
  defineColumns<InheritedRow>((c) => [
    c.text("name", {
      header: "Control",
      priority: 0,
      minWidth: 240,
      hideable: false,
      cell: (row) =>
        row.controlId ? (
          <RecordLink table="controls" record={{ id: row.controlId, program_id: programId }}>
            {row.name}
          </RecordLink>
        ) : (
          row.name
        ),
    }),
    c.text("provider", {
      header: "Inherited from",
      width: 220,
      priority: 1,
      cell: (row) =>
        !row.provider ? (
          <Absent label="Not available" />
        ) : row.providerSystemId && row.providerProgramId ? (
          <RecordLink
            table="systems"
            record={{ id: row.providerSystemId, program_id: row.providerProgramId }}
          >
            {row.provider}
          </RecordLink>
        ) : (
          row.provider
        ),
    }),
    c.text("capability", { header: "Capability", width: 240, priority: 2 }),
    c.text("implementation", { header: "Offered implementation", width: 240, priority: 3 }),
    c.person("acceptedBy", { header: "Accepted by", priority: 4 }),
    c.text("responsibility", { header: "Consumer responsibility", width: 280, priority: 5 }),
    c.date("acceptedAt", { header: "Accepted", priority: 6 }),
    c.text("ssp", { header: "SSP", width: 150, priority: 7 }),
  ]);

/**
 * Every implementation the program's SSPs accept from a provider, one control a row. Only the
 * latest SSP revision of each boundary counts: an earlier revision's acceptances are its history.
 */
function InheritedControls({
  programId,
  systemIds,
}: {
  programId: string;
  systemIds: Set<string>;
}) {
  const systemList = useMemo(() => [...systemIds].sort(), [systemIds]);
  const revisions = useRows(
    "ssp_revisions",
    { system_id: systemList },
    { columns: ["id", "system_id", "version_number"] },
  );
  const latest = useMemo(() => {
    const bySystem = new Map<string, { id: string; system_id: string; version_number: number }>();
    for (const revision of revisions.data ?? []) {
      const shown = bySystem.get(revision.system_id);
      if (!shown || revision.version_number > shown.version_number)
        bySystem.set(revision.system_id, revision);
    }
    return [...bySystem.values()];
  }, [revisions.data]);
  const latestIds = useMemo(() => latest.map((revision) => revision.id).sort(), [latest]);
  const acceptances = useRows(
    "inheritance_acceptances",
    { ssp_revision_id: latestIds },
    {
      enabled: revisions.data !== undefined,
      columns: [
        "id",
        "ssp_revision_id",
        "implemented_requirement_id",
        "offered_implementation_id",
        "accepted_by_party_id",
        "accepted_at",
        "consumer_responsibility",
      ],
    },
  );
  const accepted = acceptances.data;
  const requirementIds = useIds(accepted?.map((row) => row.implemented_requirement_id));
  const offeredIds = useIds(accepted?.map((row) => row.offered_implementation_id));
  const requirements = useRows(
    "implemented_requirements",
    { id: requirementIds },
    { enabled: accepted !== undefined, columns: ["id", "selected_control_id"] },
  );
  const selectionIds = useIds(requirements.data?.map((row) => row.selected_control_id));
  const selections = useRows(
    "selected_controls",
    { id: selectionIds },
    { enabled: requirements.data !== undefined, columns: ["id", "control_id"] },
  );
  const controlIds = useIds(selections.data?.map((row) => row.control_id));
  const controls = useRows(
    "controls",
    { id: controlIds },
    { enabled: selections.data !== undefined, columns: ["id", "code", "title", "ordinal"] },
  );
  const offered = useRows(
    "offered_implementations",
    { id: offeredIds },
    {
      enabled: accepted !== undefined,
      columns: ["id", "name", "provider_capability_id", "consumer_responsibility"],
    },
  );
  const capabilityIds = useIds(offered.data?.map((row) => row.provider_capability_id));
  const capabilities = useRows(
    "provider_capabilities",
    { id: capabilityIds },
    {
      enabled: offered.data !== undefined,
      columns: ["id", "code", "name", "providing_system_id", "provider_party_id"],
    },
  );
  const systemsNamed = useIds([
    ...systemList,
    ...(capabilities.data?.map((row) => row.providing_system_id) ?? []),
  ]);
  const systems = useRows(
    "systems",
    { id: systemsNamed },
    { enabled: capabilities.data !== undefined, columns: ["id", "code", "name", "program_id"] },
  );
  const partyIds = useIds([
    ...(accepted?.map((row) => row.accepted_by_party_id) ?? []),
    ...(capabilities.data?.map((row) => row.provider_party_id) ?? []),
  ]);
  const parties = useRows(
    "parties",
    { id: partyIds },
    { enabled: capabilities.data !== undefined, columns: ["id", "name"] },
  );
  const queries = [
    revisions,
    acceptances,
    requirements,
    selections,
    controls,
    offered,
    capabilities,
    systems,
    parties,
  ];
  const ready = queries.every((query) => query.data !== undefined);
  const rows = useMemo<InheritedRow[]>(() => {
    if (!ready) return [];
    const byId = <T extends { id: string }>(list: readonly T[] | undefined) =>
      new Map((list ?? []).map((row) => [row.id, row]));
    const requirementById = byId(requirements.data);
    const selectionById = byId(selections.data);
    const controlById = byId(controls.data);
    const offeredById = byId(offered.data);
    const capabilityById = byId(capabilities.data);
    const systemById = byId(systems.data);
    const partyById = byId(parties.data);
    const revisionById = byId(latest);
    // The catalog's order, so AC-2 reads before AC-10.
    const order = new Map<string, number>();
    const inherited = (accepted ?? []).map((acceptance) => {
      const requirement = requirementById.get(acceptance.implemented_requirement_id);
      const selection = requirement && selectionById.get(requirement.selected_control_id);
      const control = selection && controlById.get(selection.control_id);
      const implementation = offeredById.get(acceptance.offered_implementation_id);
      const capability =
        implementation && capabilityById.get(implementation.provider_capability_id);
      const providerSystem = capability?.providing_system_id
        ? systemById.get(capability.providing_system_id)
        : undefined;
      const providerParty = capability?.provider_party_id
        ? partyById.get(capability.provider_party_id)
        : undefined;
      const revision = revisionById.get(acceptance.ssp_revision_id);
      const boundary = revision && systemById.get(revision.system_id);
      order.set(acceptance.id, control?.ordinal ?? Number.MAX_SAFE_INTEGER);
      return {
        id: acceptance.id,
        controlId: control?.id ?? null,
        name: control ? `${control.code} ${control.title}` : "Unnamed control",
        provider: providerSystem?.name ?? providerParty?.name ?? null,
        providerSystemId: providerSystem?.id ?? null,
        providerProgramId: providerSystem?.program_id ?? null,
        capability: capability ? `${capability.code} ${capability.name}` : null,
        implementation: implementation?.name ?? null,
        responsibility:
          acceptance.consumer_responsibility ?? implementation?.consumer_responsibility ?? null,
        acceptedBy: partyById.get(acceptance.accepted_by_party_id)?.name ?? null,
        acceptedAt: acceptance.accepted_at,
        ssp: revision
          ? `${boundary?.code ?? "System"} SSP ${revision.version_number}`
          : "Not available",
      } satisfies InheritedRow;
    });
    return inherited.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0) || a.name.localeCompare(b.name),
    );
  }, [
    ready,
    accepted,
    requirements.data,
    selections.data,
    controls.data,
    offered.data,
    capabilities.data,
    systems.data,
    parties.data,
    latest,
  ]);
  const columns = useMemo(() => inheritedColumns(programId), [programId]);
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Inherited controls",
    view: "program-inherited-controls",
  });
  const openRecord = useOpenRecord();
  return (
    <Section title="Inherited controls" count={ready ? rows.length : undefined} countMax={9999}>
      <ProductCollection
        table={table}
        compact
        queries={queries}
        onRowClick={(row) =>
          row.controlId
            ? openRecord("controls", { id: row.controlId, program_id: programId })
            : undefined
        }
        searchLabel="Find inherited controls"
        filters={
          <>
            <DataTable.Filter table={table} column="provider" />
            <DataTable.Filter table={table} column="capability" />
          </>
        }
        empty={{
          illustration: "shield",
          title: "No inherited controls",
          description:
            "The program's SSPs accept no implementation offered by another system or organization.",
        }}
      />
    </Section>
  );
}

/** The distinct ids a read names, sorted so the next read's key holds while they stay the same. */
function useIds(ids: readonly (string | null | undefined)[] | undefined): string[] {
  const key = ids ? [...new Set(ids.filter((id): id is string => !!id))].sort().join(",") : "";
  return useMemo(() => (key ? key.split(",") : []), [key]);
}
