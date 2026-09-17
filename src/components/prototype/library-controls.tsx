import { useMemo, useState, type ReactNode } from "react";
import {
  Absent,
  Badge,
  DataTable,
  Toolbar,
  defineColumns,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useDataTable,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { useRows, type Row } from "@/lib/models";
import { LibraryLoading } from "./library-shared";

/** A profile that selects a control, for the Selected by column. */
export type ControlSelector = { key: string; label: string; meta?: ReactNode | undefined };

export function LibraryControlTable({
  controls,
  onSelect,
  label = "Catalog controls",
  filters,
  showRelease = true,
  selectedBy,
  selectedId,
  onDisplayedRowsChange,
}: {
  controls: Row<"controls">[];
  selectedId?: string | undefined;
  onDisplayedRowsChange?: ((rows: Row<"controls">[]) => void) | undefined;
  onSelect: (control: Row<"controls">) => void;
  label?: string;
  /** Extra toolbar controls after the search: an edition picker, say. */
  filters?: ReactNode;
  /** Hide the Release column when every row is from one edition. */
  showRelease?: boolean;
  /** The published profiles selecting each control, by control id; adds a Selected by column. */
  selectedBy?: Map<string, ControlSelector[]> | undefined;
}) {
  const navigate = useNavigate();
  const groups = useRows("catalog_groups");
  const revisions = useRows("catalog_revisions");
  const data = useMemo(
    () =>
      controls
        .map((control) => ({
          ...control,
          family:
            groups.data?.find((group) => group.id === control.group_id)?.source_id ??
            "Not recorded",
          release:
            revisions.data?.find((revision) => revision.id === control.catalog_revision_id)
              ?.version ?? "Not recorded",
          selectedBy: selectedBy?.get(control.id) ?? [],
        }))
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [controls, groups.data, revisions.data, selectedBy],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof data)[number]>((c) => [
        c.id("code", {
          header: "Control",
          width: 130,
          hideable: false,
          preview: onSelect,
          active: (row) => row.id === selectedId,
        }),
        c.text("title", {
          header: "Title",
          hideable: false,
          cell: (row) => (
            <RecordLink table="controls" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("family", { header: "Family", width: 100 }),
        ...(showRelease ? [c.text("release", { header: "Release", width: 100 })] : []),
        c.status("status", {
          header: "Status",
          width: 130,
          tone: (row) => (row.status === "withdrawn" ? "warning" : "neutral"),
        }),
        ...(selectedBy
          ? [
              c.list("selectedBy", {
                header: "Selected by",
                width: 240,
                items: (row) => row.selectedBy,
                empty: () => <Absent />,
              }),
            ]
          : []),
      ]),
    [showRelease, selectedBy, onSelect, selectedId],
  );
  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    label,
    view: "live-library-controls-v2",
    resizable: true,
    reorderable: true,
    virtualize: true,
  });
  useDisplayedRecords(table, onDisplayedRowsChange);
  return (
    <LibraryLoading queries={[groups, revisions]}>
      <DataTable
        responsive
        table={table}
        fill
        onRowClick={(row) => void navigate(recordDestination("controls", row))}
        empty={{
          illustration: "shield",
          title: "No controls yet",
          description: "Import a catalog release to fill the library.",
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Find a control"
            filters={
              <>
                {filters}
                <DataTable.Filter table={table} column="family" />
                {showRelease && <DataTable.Filter table={table} column="release" />}
                <DataTable.Filter table={table} column="status" />
                {selectedBy && <DataTable.Filter table={table} column="selectedBy" />}
              </>
            }
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
    </LibraryLoading>
  );
}

function PartTree({
  parts,
  parentId = null,
}: {
  parts: Row<"control_parts">[];
  parentId?: string | null;
}) {
  return (
    <Stack space="space.150">
      {parts
        .filter((part) => part.parent_part_id === parentId)
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((part) => (
          <Stack key={part.id} space="space.075" className={parentId ? "border-s ps-150" : ""}>
            <Inline space="space.100" shouldWrap>
              <Badge variant="secondary" tone="neutral">
                {part.name.replaceAll("-", " ")}
              </Badge>
              {part.source_id && <Id>{part.source_id}</Id>}
            </Inline>
            {part.title && <h3 className="font-body-small font-semibold">{part.title}</h3>}
            {part.prose && <p className="font-body-small whitespace-pre-wrap">{part.prose}</p>}
            {parts.some((child) => child.parent_part_id === part.id) && (
              <PartTree parts={parts} parentId={part.id} />
            )}
          </Stack>
        ))}
    </Stack>
  );
}

export function ControlInspector({
  control,
  onClose,
  selectionId,
  records,
  onSelect,
}: {
  control: Row<"controls">;
  records?: Row<"controls">[] | undefined;
  onSelect?: ((row: Row<"controls">) => void) | undefined;
  onClose: () => void;
  selectionId?: string;
}) {
  const [tab, setTab] = useState("Statements");
  const parts = useRows("control_parts", { control_id: control.id });
  const parameters = useRows("parameters", { control_id: control.id });
  const links = useRows("control_links", { control_id: control.id });
  const selected = useRows("selected_controls", { control_id: control.id });
  const resolutions = useRows("profile_resolutions");
  const profileRevisions = useRows("profile_revisions");
  const profiles = useRows("profiles");
  const provenance = useRows(
    "selection_provenance",
    selectionId ? { selected_control_id: selectionId } : {},
    { enabled: !!selectionId },
  );
  const roots = parts.data?.filter((part) => part.parent_part_id === null) ?? [];
  const rootNames =
    tab === "Objectives"
      ? ["assessment-objective", "assessment-method"]
      : ["statement", "guidance"];
  const shownIds = new Set(
    roots.filter((part) => rootNames.includes(part.name)).map((part) => part.id),
  );
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const part of parts.data ?? [])
      if (part.parent_part_id && shownIds.has(part.parent_part_id) && !shownIds.has(part.id)) {
        shownIds.add(part.id);
        expanded = true;
      }
  }
  const selectedProfiles = (selected.data ?? [])
    .map((selection) => {
      const resolution = resolutions.data?.find(
        (candidate) => candidate.id === selection.profile_resolution_id,
      );
      return profileRevisions.data?.find(
        (candidate) => candidate.id === resolution?.profile_revision_id,
      );
    })
    .filter((profile): profile is Row<"profile_revisions"> => !!profile);
  return (
    <RecordPreviewPanel
      title={control.title}
      label="Control preview"
      defaultWidth={640}
      onClose={onClose}
      navigation={
        <RecordPreviewActions
          table="controls"
          record={control}
          rows={records ?? [control]}
          onSelect={onSelect ?? (() => {})}
        />
      }
    >
      <Stack space="space.200">
        <Inspector.Group title="Details">
          <KeyValue label="Control">
            <Id>{control.code}</Id>
          </KeyValue>
          <KeyValue label="Source identifier">
            <Id>{control.source_id}</Id>
          </KeyValue>
          <KeyValue label="Status">{control.status}</KeyValue>
          <KeyValue label="Selected profiles" wrap>
            {selected.isPending ||
            resolutions.isPending ||
            profileRevisions.isPending ||
            profiles.isPending
              ? "Loading…"
              : [
                  ...new Set(
                    selectedProfiles.map(
                      (profile) =>
                        `${profiles.data?.find((item) => item.id === profile.profile_id)?.title ?? profile.title} (${profile.version})`,
                    ),
                  ),
                ].join("; ") || "No recorded selections"}
          </KeyValue>
        </Inspector.Group>
        {selectionId && (
          <Inspector.Group title="Selection trail">
            <LibraryLoading queries={[provenance]}>
              <Stack space="space.100">
                {provenance.data?.length ? (
                  provenance.data.map((entry) => (
                    <Stack key={entry.id} space="space.050">
                      <Id>{entry.source_pointer}</Id>
                      {entry.rationale && <p className="font-body-small">{entry.rationale}</p>}
                      <span className="font-body-small text-subtle">
                        Import: {entry.profile_import_id}
                      </span>
                    </Stack>
                  ))
                ) : (
                  <p className="text-subtle">No selection trail recorded.</p>
                )}
              </Stack>
            </LibraryLoading>
          </Inspector.Group>
        )}
        <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
          <TabsList variant="line" aria-label="Control sections">
            {["Statements", "Objectives", "Parameters", "Links"].map((name) => (
              <TabsTrigger key={name} value={name}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab}>
            <LibraryLoading
              queries={[
                parts,
                parameters,
                links,
                selected,
                resolutions,
                profileRevisions,
                profiles,
              ]}
            >
              {(tab === "Statements" || tab === "Objectives") &&
                (shownIds.size ? (
                  <PartTree parts={(parts.data ?? []).filter((part) => shownIds.has(part.id))} />
                ) : (
                  <p className="text-subtle">No {tab.toLowerCase()} recorded for this control.</p>
                ))}
              {tab === "Parameters" && (
                <Stack space="space.150">
                  {parameters.data?.length ? (
                    parameters.data.map((parameter) => (
                      <Inspector.Group key={parameter.id} title={parameter.source_id}>
                        <KeyValue label="Label" wrap>
                          {parameter.label ?? "Not recorded"}
                        </KeyValue>
                        <KeyValue label="Usage" wrap>
                          {parameter.usage ?? "Not recorded"}
                        </KeyValue>
                        <KeyValue label="Selection">
                          {parameter.has_selection
                            ? (parameter.selection_count ?? "Selection")
                            : "No selection declared"}
                        </KeyValue>
                        <ParameterDetails id={parameter.id} />
                      </Inspector.Group>
                    ))
                  ) : (
                    <p className="text-subtle">No parameters declared.</p>
                  )}
                </Stack>
              )}
              {tab === "Links" && (
                <Stack space="space.100">
                  {links.data?.length ? (
                    links.data.map((link) => (
                      <KeyValue key={link.id} label={link.relation ?? "Link"} wrap>
                        <span className="break-all">{link.text ?? link.href}</span>
                      </KeyValue>
                    ))
                  ) : (
                    <p className="text-subtle">No links recorded.</p>
                  )}
                </Stack>
              )}
            </LibraryLoading>
          </TabsContent>
        </Tabs>
      </Stack>
    </RecordPreviewPanel>
  );
}

function ParameterDetails({ id }: { id: string }) {
  const choices = useRows("parameter_choices", { parameter_id: id });
  const values = useRows("parameter_values", { parameter_id: id });
  const guidelines = useRows("parameter_guidelines", { parameter_id: id });
  return (
    <LibraryLoading queries={[choices, values, guidelines]}>
      {choices.data?.length ? (
        <KeyValue label="Choices" wrap>
          {[...choices.data]
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((choice) => choice.value)
            .join("; ")}
        </KeyValue>
      ) : null}
      <KeyValue label="Source values" wrap>
        {values.data?.map((value) => value.value).join("; ") || "Not assigned in the catalog"}
      </KeyValue>
      {guidelines.data?.map((guideline) => (
        <p key={guideline.id} className="font-body-small text-subtle">
          {guideline.prose}
        </p>
      ))}
    </LibraryLoading>
  );
}
