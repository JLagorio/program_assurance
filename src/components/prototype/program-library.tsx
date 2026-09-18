import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { ProductCollection } from "./product-collection";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  DataTable,
  Inline,
  KeyValue,
  Stack,
  Toolbar,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { libraryRollup, type LibraryRollupRow } from "@/lib/library-use";
import { useSystemAssurance } from "./use-system-assurance";

type Line = {
  id: string;
  name: string;
  kind: "Component definition" | "Baseline";
  category: string;
  version: string;
  elements: { key: string; label: string; meta: string }[];
  changedHere: number;
  updateFlag: string;
  definitionId: string | null;
  updateAvailable: LibraryRollupRow["updateAvailable"];
};

const presets: Preset[] = [
  { id: "all", label: "Everything applied" },
  {
    id: "updates",
    label: "Update available",
    filters: [{ id: "updateFlag", value: ["Update available"] }],
  },
];

/** The program's Library tab: every library item applied anywhere in the program, once per version, with the elements it is applied to. */
export function ProgramLibrary({
  programId,
  fill,
}: {
  programId: string;
  fill?: boolean | undefined;
}) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>();
  const {
    rows,
    pending: assurancePending,
    error: assuranceError,
    queries: assuranceQueries,
  } = useSystemAssurance(programId);
  const components = useRows("system_components");
  const definedComponents = useRows("defined_components");
  const revisions = useRows("component_definition_revisions");
  const definitions = useRows("component_definitions");
  const contributions = useRows("component_contributions");
  const implementations = useRows("defined_component_implementations");
  const data = useMemo<Line[]>(() => {
    const boundaries = new Set(rows.map((row) => row.boundary_system_id));
    const rollup = libraryRollup({
      rows,
      components: (components.data ?? []).filter((row) => boundaries.has(row.system_id)),
      definedComponents: definedComponents.data ?? [],
      revisions: revisions.data ?? [],
      definitions: definitions.data ?? [],
      contributions: contributions.data ?? [],
      implementations: implementations.data ?? [],
    }).map<Line>((row) => ({
      id: row.id,
      name: row.name,
      kind: "Component definition",
      category: row.category ? labelFor(row.category) : "",
      version: String(row.version),
      elements: row.elements.map((element) => ({
        key: element.id,
        label: `${element.code} · ${element.name}`,
        meta: "Applied here",
      })),
      changedHere: row.changedHere,
      updateFlag: row.updateAvailable ? "Update available" : "Current",
      definitionId: row.definitionId,
      updateAvailable: row.updateAvailable,
    }));
    const baselines = new Map<string, Line>();
    for (const row of rows) {
      if (row.effectiveBaseline?.source_label !== "Explicit system adoption" || !row.baselineTitle)
        continue;
      const key = `baseline:${row.effectiveBaseline.profile_resolution_id}`;
      const current = baselines.get(key) ?? {
        id: key,
        name: row.baselineTitle,
        kind: "Baseline",
        category: "Profile",
        version: row.baselineDraft ? "Tailored draft" : "Published",
        elements: [],
        changedHere: 0,
        updateFlag: "Current",
        definitionId: null,
        updateAvailable: null,
      };
      current.elements.push({
        key: row.id,
        label: `${row.code} · ${row.name}`,
        meta: "Adopted here",
      });
      baselines.set(key, current);
    }
    return [...baselines.values(), ...rollup];
  }, [
    rows,
    components.data,
    definedComponents.data,
    revisions.data,
    definitions.data,
    contributions.data,
    implementations.data,
  ]);
  const columns = useMemo(
    () =>
      defineColumns<Line>((c) => [
        c.id("name", {
          header: "Item",
          minWidth: 200,
          priority: 0,
          hideable: false,
          preview: (row) => setSelectedId(row.id),
          active: (row) => row.id === selectedId,
          cell: (row) => (
            <RecordLink
              table={row.definitionId ? "component_definitions" : "profile_resolutions"}
              record={{ id: row.definitionId ?? row.id.replace("baseline:", "") }}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("kind", { header: "Kind", width: 170 }),
        c.text("category", { header: "Category", width: 170 }),
        c.text("version", {
          header: "Version",
          width: 160,
          cell: (row) => (
            <Inline space="space.075" alignBlock="center">
              <span>{row.version}</span>
              {row.updateAvailable && (
                <Badge variant="secondary" size="xsmall" tone="warning">
                  v{row.updateAvailable.version} available
                </Badge>
              )}
            </Inline>
          ),
        }),
        c.list("elements", {
          header: "Applied to",
          width: 260,
          items: (row) => row.elements,
          empty: () => <Absent />,
        }),
        c.number("changedHere", {
          header: "Changed here",
          width: 120,
          cell: (row) => (row.changedHere ? String(row.changedHere) : <Absent />),
        }),
        c.text("updateFlag", { header: "Update", width: 140 }),
      ]),
    [selectedId],
  );
  const table = useDataTable({
    columns,
    data,
    getRowId: (row) => row.id,
    label: "Library items in this program",
    view: "live-program-library-v1",
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { updateFlag: false } },
  });
  const displayed = useDisplayedRecords(table);
  const selected = data.find((row) => row.id === selectedId);
  const queries = [
    components,
    definedComponents,
    revisions,
    definitions,
    contributions,
    implementations,
  ];
  const error = assuranceError ?? queries.find((query) => query.error)?.error;
  const pending = assurancePending || queries.some((query) => query.isPending);
  return (
    <>
      <ProductCollection
        table={table}
        fill={fill}
        onRowClick={(row) =>
          void navigate(
            recordDestination(row.definitionId ? "component_definitions" : "profile_resolutions", {
              id: row.definitionId ?? row.id.replace("baseline:", ""),
            }),
          )
        }
        empty={{
          illustration: "records",
          title: "Nothing applied from the library yet",
          description:
            "Open an element in the System tab and use Add from library. What is applied anywhere in the program is listed here once per version.",
        }}
        queries={[...assuranceQueries, ...queries]}
        searchLabel="Find a library item"
        views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
      />
      {selected && (
        <RecordPreviewPanel
          title={selected.name}
          label="Library item preview"
          onClose={() => setSelectedId(undefined)}
          navigation={
            <RecordPreviewActions
              table={selected.definitionId ? "component_definitions" : "profile_resolutions"}
              record={selected}
              rows={displayed}
              onSelect={(row) => setSelectedId(row.id)}
              destination={recordDestination(
                selected.definitionId ? "component_definitions" : "profile_resolutions",
                { id: selected.definitionId ?? selected.id.replace("baseline:", "") },
              )}
            />
          }
        >
          <Stack space="space.150">
            <KeyValue label="Kind">{selected.kind}</KeyValue>
            <KeyValue label="Version">{selected.version}</KeyValue>
            <KeyValue label="Applied to">
              {selected.elements.map((element) => element.label).join(", ")}
            </KeyValue>
            <KeyValue label="Update">{selected.updateFlag}</KeyValue>
          </Stack>
        </RecordPreviewPanel>
      )}
    </>
  );
}
