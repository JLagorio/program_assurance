import { ProductCollection } from "./product-collection";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Button,
  DataTable,
  DateTime,
  FilterChip,
  Inline,
  Inspector,
  KeyValue,
  Prose,
  Stack,
  Text,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { implementationStatuses } from "@/lib/status";
import { libraryUses, type LibraryUseRow } from "@/lib/library-use";
import type { SystemAssuranceRow } from "@/lib/system-assurance";
import { LibraryUpdateReview } from "./library-update-review";
import { EmptyMessage } from "./work-common";

type Line = LibraryUseRow & {
  updateFlag: string;
  changeFlag: string;
  appliedByName: string | null;
};

const libraryDestination = (row: LibraryUseRow) =>
  row.definitionId
    ? recordDestination("component_definitions", { id: row.definitionId })
    : row.revisionId
      ? recordDestination("profile_resolutions", { id: row.revisionId })
      : recordDestination("systems", { id: row.elementId });

const presets: Preset[] = [
  { id: "all", label: "Everything applied" },
  {
    id: "updates",
    label: "Update available",
    filters: [{ id: "updateFlag", value: ["Update available"] }],
  },
  {
    id: "changed",
    label: "Changed here",
    filters: [{ id: "changeFlag", value: ["Changed here"] }],
  },
];

/**
 * The element's Library tab: what was applied here from the library and what it inherits, each
 * with its version, when and why it was applied, and whether a newer version exists or the
 * program changed it here.
 */
export function SystemLibrary({
  programId,
  element,
  rows,
  onAddFromLibrary,
}: {
  programId: string;
  element: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  onAddFromLibrary?: (() => void) | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const components = useRows("system_components", { system_id: element.boundary_system_id });
  const definedComponents = useRows("defined_components");
  const revisions = useRows("component_definition_revisions");
  const definitions = useRows("component_definitions");
  const contributions = useRows("component_contributions");
  const implementations = useRows("defined_component_implementations");
  const parties = useRows("parties");
  const controls = useRows("controls");
  const [includeInside, setIncludeInside] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<LibraryUseRow | null>(null);
  const data = useMemo<Line[]>(
    () =>
      libraryUses({
        element,
        rows,
        components: components.data ?? [],
        definedComponents: definedComponents.data ?? [],
        revisions: revisions.data ?? [],
        definitions: definitions.data ?? [],
        contributions: contributions.data ?? [],
        implementations: implementations.data ?? [],
        includeInside,
      }).map((use) => ({
        ...use,
        updateFlag: use.updateAvailable ? "Update available" : "Current",
        changeFlag: use.changedHere ? "Changed here" : "As published",
        appliedByName: use.appliedBy
          ? (parties.data?.find((party) => party.auth_user_id === use.appliedBy)?.name ?? null)
          : null,
      })),
    [
      element,
      rows,
      components.data,
      definedComponents.data,
      revisions.data,
      definitions.data,
      contributions.data,
      implementations.data,
      parties.data,
      includeInside,
    ],
  );
  const columns = useMemo(
    () =>
      defineColumns<Line>((c) => [
        c.id("name", {
          header: "Item",
          minWidth: 200,
          priority: 0,
          preview: (row) => setSelectedId(row.id),
          active: (row) => row.id === selectedId,
          hideable: false,
          cell: (row) => (
            <Stack space="space.0" className="min-w-0">
              <RecordLink
                table={
                  row.definitionId
                    ? "component_definitions"
                    : row.revisionId
                      ? "profile_resolutions"
                      : "systems"
                }
                record={{
                  id: row.definitionId ?? row.revisionId ?? row.elementId,
                  program_id: programId,
                }}
              >
                {row.name}
              </RecordLink>
              {row.detail && (
                <Text size="xsmall" color="color.text.subtle">
                  {row.detail}
                </Text>
              )}
            </Stack>
          ),
        }),
        c.text("kind", { header: "Kind", width: 170 }),
        c.text("version", {
          header: "Version",
          width: 150,
          cell: (row) => (
            <Inline space="space.075" alignBlock="center">
              <span>{row.version ?? <Absent />}</span>
              {row.updateAvailable && (
                <Badge variant="secondary" size="xsmall" tone="warning">
                  v{row.updateAvailable.version} available
                </Badge>
              )}
            </Inline>
          ),
        }),
        c.date("appliedAt", { header: "Applied", width: 130 }),
        c.text("source", {
          header: "Source",
          width: 200,
          cell: (row) =>
            includeInside && row.elementId !== element.id ? (
              <Stack space="space.0" className="min-w-0">
                <span>{row.source}</span>
                <Text size="xsmall" color="color.text.subtle">
                  on {row.elementCode}
                </Text>
              </Stack>
            ) : (
              row.source
            ),
        }),
        c.number("changedHere", {
          header: "Changed here",
          width: 120,
          cell: (row) => (row.changedHere ? String(row.changedHere) : <Absent />),
        }),
        c.text("rationale", { header: "Rationale", minWidth: 220, wrap: true }),
        c.text("updateFlag", { header: "Update", width: 140 }),
        c.text("changeFlag", { header: "Change", width: 140 }),
      ]),
    [includeInside, element.id, selectedId, programId],
  );
  const table = useDataTable({
    columns,
    data,
    getRowId: (row) => row.id,
    label: "Applied from the library",
    rowLabel: (row) => row.name,
    view: "live-system-library-v1",
    resizable: true,
    reorderable: true,
    initialState: {
      columnVisibility: { rationale: false, updateFlag: false, changeFlag: false },
    },
  });
  const displayed = useDisplayedRecords(table);
  const selected = data.find((row) => row.id === selectedId) ?? null;
  const selectedContributions = selected?.systemComponentId
    ? (contributions.data ?? []).filter(
        (row) => row.system_component_id === selected.systemComponentId,
      )
    : [];
  const queries = [
    components,
    definedComponents,
    revisions,
    definitions,
    contributions,
    implementations,
  ];
  // The toggle matters only where the element has something inside it.
  const hasInside = rows.some((row) => row.parent_system_id === element.id);
  const canApply = workspace.role !== "viewer" && !!onAddFromLibrary;
  const addAction = canApply ? (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={onAddFromLibrary}>
      Add from library
    </Button>
  ) : null;
  return (
    <>
      <ProductCollection
        table={table}
        onRowClick={(row) => void navigate(libraryDestination(row))}
        empty={{
          illustration: "records",
          title: "Nothing from the library yet",
          description:
            "Apply a profile, a component definition or a requirement definition to this element.",
          action: addAction,
          // The way back from the scope, only while the scope leaves nothing; a search of the
          // table's own that hides the element's rows keeps the kit's Nothing matches and Clear filters.
          ...(hasInside && !includeInside && data.length === 0
            ? {
                filtered: {
                  title: "Nothing applied to this element itself",
                  description: "Include everything inside to see what is applied to its elements.",
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
        // Without the elements inside, the rows are a narrowing: nothing left keeps the toolbar.
        narrowed={hasInside && !includeInside}
        searchLabel="Find a library item"
        views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
        action={addAction}
        filters={
          hasInside ? (
            <FilterChip
              label="Include everything inside"
              isActive={includeInside}
              onClick={() => setIncludeInside(!includeInside)}
            />
          ) : undefined
        }
      />
      {selected && (
        <RecordPreviewPanel
          title={selected.name}
          label="Library use"
          defaultWidth={560}
          onClose={() => setSelectedId(null)}
          recordActions={
            selected.updateAvailable &&
            selected.assignmentId && (
              <Button size="small" variant="primary" onClick={() => setReviewing(selected)}>
                Review version {selected.updateAvailable.version}
              </Button>
            )
          }
          navigation={
            <RecordPreviewActions
              table="component_definitions"
              record={selected}
              destination={libraryDestination(selected)}
              rows={displayed}
              onSelect={(row) => setSelectedId(row.id)}
            />
          }
        >
          <Stack space="space.200">
            <Inspector.Group title="Details">
              <KeyValue.Group>
                <KeyValue label="Kind">{selected.kind}</KeyValue>
                {selected.detail && (
                  // A baseline's detail is its control count, a component definition's its component.
                  <KeyValue label={selected.kind === "Baseline" ? "Selection" : "Component"}>
                    {selected.detail}
                  </KeyValue>
                )}
                {selected.category && (
                  <KeyValue label="Category">{labelFor(selected.category)}</KeyValue>
                )}
                <KeyValue label="Version">{selected.version ?? <Absent />}</KeyValue>
                <KeyValue label="Source">{selected.source}</KeyValue>
                <KeyValue label="Element">{selected.elementCode}</KeyValue>
                <KeyValue label="Applied">
                  <DateTime value={selected.appliedAt} format="date" absentLabel="Not recorded" />
                </KeyValue>
                {selected.appliedByName && (
                  <KeyValue label="Applied by">{selected.appliedByName}</KeyValue>
                )}
              </KeyValue.Group>
              <Prose label="Rationale">
                {selected.rationale || <Absent label="No rationale recorded" />}
              </Prose>
            </Inspector.Group>
            {selected.kind === "Component definition" && (
              <Inspector.Group title={`Narratives · ${selectedContributions.length}`}>
                <Stack space="space.075">
                  {selectedContributions.map((contribution) => {
                    const origin = implementations.data?.find(
                      (row) => row.id === contribution.library_implementation_id,
                    );
                    const control = controls.data?.find((row) => row.id === origin?.control_id);
                    const changed = !!origin && origin.description !== contribution.description;
                    return (
                      <Inline
                        key={contribution.id}
                        space="space.100"
                        alignBlock="center"
                        shouldWrap
                      >
                        <span className="font-body-small font-medium">
                          {control?.code ?? "Control"}
                        </span>
                        <StatusBadge
                          statuses={implementationStatuses}
                          value={contribution.implementation_status}
                          size="xsmall"
                        />
                        {changed && (
                          <Badge variant="secondary" size="xsmall" tone="warning">
                            Changed here
                          </Badge>
                        )}
                      </Inline>
                    );
                  })}
                  {!selectedContributions.length && (
                    <EmptyMessage
                      compact
                      title="No narratives seeded"
                      description="When it was applied, its controls were excluded, outside the SSP selection, or the boundary had no draft SSP."
                    />
                  )}
                </Stack>
              </Inspector.Group>
            )}
          </Stack>
        </RecordPreviewPanel>
      )}
      {reviewing &&
        reviewing.assignmentId &&
        reviewing.systemComponentId &&
        reviewing.revisionId &&
        reviewing.updateAvailable && (
          <LibraryUpdateReview
            name={reviewing.name}
            assignmentId={reviewing.assignmentId}
            systemComponentId={reviewing.systemComponentId}
            currentRevisionId={reviewing.revisionId}
            newRevision={reviewing.updateAvailable}
            onClose={() => setReviewing(null)}
          />
        )}
    </>
  );
}
