import {
  ControlInspector,
  LibraryControlTable,
  type ControlSelector,
} from "@/components/prototype/library-controls";
import { LibraryLoading } from "@/components/prototype/library-shared";
import { ProductCollection } from "@/components/prototype/product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "@/components/prototype/record-preview";
import { EmptyMessage } from "@/components/prototype/work-common";
import { useRows, type Row } from "@/lib/models";
import {
  Badge,
  Count,
  DataTable,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): { edition?: string } =>
    typeof search["edition"] === "string" && /^[0-9a-f-]{36}$/i.test(search["edition"])
      ? { edition: search["edition"] }
      : {},
  head: () => ({ meta: [{ title: "Catalog — Program Assurance" }] }),
  component: CatalogPage,
});

function CatalogPage() {
  const { edition } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [tab, setTab] = useState("Controls");
  const [control, setControl] = useState<Row<"controls"> | null>(null);
  const [displayedControls, setDisplayedControls] = useState<Row<"controls">[]>([]);
  const revisions = useRows("catalog_revisions");
  const allControls = useRows("controls");
  const selections = useRows("selected_controls");
  const resolutions = useRows("profile_resolutions");
  const profileRevisions = useRows("profile_revisions");
  const profiles = useRows("profiles");
  const catalogs = useRows("catalogs");
  const catalogTitle = (row: Row<"catalog_revisions">) =>
    catalogs.data?.find((catalog) => catalog.id === row.catalog_id)?.title ?? row.title;
  const editions = useMemo(
    () =>
      [...(revisions.data ?? [])]
        .filter((row) => row.state === "published")
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true })),
    [revisions.data],
  );
  const current = editions.find((row) => row.id === edition) ?? editions[0];
  const shown = useMemo(
    () => (allControls.data ?? []).filter((row) => row.catalog_revision_id === current?.id),
    [allControls.data, current?.id],
  );
  const selectedBy = useMemo(() => {
    const byRevision = new Map((profileRevisions.data ?? []).map((row) => [row.id, row]));
    const byProfile = new Map((profiles.data ?? []).map((row) => [row.id, row]));
    const revisionOf = new Map(
      (resolutions.data ?? [])
        .filter((row) => row.state === "published")
        .map((row) => [row.id, byRevision.get(row.profile_revision_id)]),
    );
    const result = new Map<string, ControlSelector[]>();
    for (const selection of selections.data ?? []) {
      const revision = revisionOf.get(selection.profile_resolution_id);
      if (!revision || revision.state !== "published") continue;
      const items = result.get(selection.control_id) ?? [];
      if (items.some((item) => item.key === revision.id)) continue;
      items.push({
        key: revision.id,
        label: `${byProfile.get(revision.profile_id)?.title ?? revision.title} · ${revision.version}`,
        meta: byProfile.get(revision.profile_id)?.code ?? null,
      });
      result.set(selection.control_id, items);
    }
    for (const items of result.values()) items.sort((a, b) => a.label.localeCompare(b.label));
    return result;
  }, [selections.data, resolutions.data, profileRevisions.data, profiles.data]);
  const controls = allControls;
  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Catalog</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(String(value));
          setControl(null);
        }}
        className="contents"
      >
        <TabsList variant="line" activateOnFocus aria-label="Catalog views">
          {["Controls", "CCIs", "Sources"].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Controls" && controls.data && <Count value={shown.length} max={99999} />}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Controls" && (
            <LibraryLoading
              queries={[
                controls,
                revisions,
                catalogs,
                selections,
                resolutions,
                profileRevisions,
                profiles,
              ]}
            >
              <LibraryControlTable
                controls={shown}
                selectedId={control?.id}
                onDisplayedRowsChange={setDisplayedControls}
                onSelect={setControl}
                showRelease={false}
                selectedBy={selectedBy}
                filters={
                  <Select
                    value={current?.id ?? ""}
                    onValueChange={(value) => {
                      if (value) void navigate({ search: { edition: value } });
                    }}
                  >
                    <SelectTrigger aria-label="Catalog edition" size="sm">
                      <SelectValue placeholder="Catalog edition">
                        {current
                          ? `${catalogTitle(current)} · ${current.version}`
                          : "Catalog edition"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {editions.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {catalogTitle(row)} · {row.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </LibraryLoading>
          )}
          {tab === "CCIs" && <CciTable />}
          {tab === "Sources" && <SourcesList />}
        </TabsContent>
      </Tabs>
      {control && (
        <ControlInspector
          control={control}
          onClose={() => setControl(null)}
          records={displayedControls}
          onSelect={setControl}
        />
      )}
    </Stack>
  );
}

function CciTable() {
  const items = useRows("cci_items");
  const references = useRows("cci_references");
  const links = useRows("cci_control_links");
  const controls = useRows("controls");
  const types = useRows("cci_item_types");
  const [selected, setSelected] = useState<Row<"cci_items"> | null>(null);
  const navigate = useNavigate();
  const rows = useMemo(() => {
    const controlsById = new Map(controls.data?.map((row) => [row.id, row]));
    const itemByReference = new Map(references.data?.map((row) => [row.id, row.cci_item_id]));
    const controlsByItem = new Map<string, Set<string>>();
    for (const link of links.data ?? []) {
      const itemId = itemByReference.get(link.cci_reference_id);
      const control = controlsById.get(link.control_id);
      if (!itemId || !control) continue;
      if (!controlsByItem.has(itemId)) controlsByItem.set(itemId, new Set());
      controlsByItem.get(itemId)!.add(control.code);
    }
    const typesByItem = new Map<string, string[]>();
    for (const type of types.data ?? [])
      typesByItem.set(type.cci_item_id, [...(typesByItem.get(type.cci_item_id) ?? []), type.type]);
    return (items.data ?? []).map((item) => ({
      ...item,
      controls: [...(controlsByItem.get(item.id) ?? [])].join(", "),
      types: typesByItem.get(item.id)?.join(", ") ?? "Not recorded",
    }));
  }, [items.data, references.data, links.data, controls.data, types.data]);
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("code", {
          header: "CCI",
          width: 180,
          priority: 0,
          hideable: false,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
          cell: (row) => (
            <RecordLink table="cci_items" record={row}>
              {row.code}
            </RecordLink>
          ),
        }),
        c.text("definition", { header: "Definition", hideable: false }),
        c.text("controls", { header: "Mapped controls", width: 180 }),
        c.text("types", { header: "Type", width: 132 }),
        c.status("status", {
          header: "Source status",
          width: 130,
          tone: (row) => (row.status === "deprecated" ? "warning" : "neutral"),
        }),
        c.date("published_on", { header: "Published", width: 125 }),
      ]),
    [selected?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Control correlation identifiers",
    view: "live-catalog-ccis",
    resizable: true,
    reorderable: true,
    virtualize: true,
  });
  const displayed = useDisplayedRecords(table);
  return (
    <LibraryLoading queries={[items, references, links, controls, types]}>
      <ProductCollection
        table={table}
        fill
        onRowClick={(row) => void navigate(recordDestination("cci_items", row))}
        empty={{
          illustration: "shield",
          title: "No CCIs yet",
          description: "Import a CCI release to fill the catalog.",
        }}
        searchLabel="Find a CCI"
        filters={
          <>
            <DataTable.Filter table={table} column="types" />
            <DataTable.Filter table={table} column="status" />
          </>
        }
      />
      {selected && (
        <RecordPreviewPanel
          title={selected.code}
          label="CCI preview"
          defaultWidth={640}
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table="cci_items"
              record={selected}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <Stack space="space.200">
            <Inspector.Group title="Definition">
              <p className="font-body-small">{selected.definition}</p>
            </Inspector.Group>
            <Inspector.Group title="Source record">
              <KeyValue label="Status">{selected.status}</KeyValue>
              <KeyValue label="Contributor">{selected.contributor ?? "Not recorded"}</KeyValue>
              <KeyValue label="Published">{selected.published_on}</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Publication references">
              <Stack space="space.150">
                {references.data
                  ?.filter((reference) => reference.cci_item_id === selected.id)
                  .map((reference) => (
                    <Stack key={reference.id} space="space.050">
                      <p className="font-body-small font-semibold">
                        {reference.publication_title} · {reference.publication_version}
                      </p>
                      <Id>{reference.source_index}</Id>
                      <span className="font-body-small text-subtle">
                        {reference.resolution_status.replaceAll("-", " ")}
                      </span>
                    </Stack>
                  ))}
              </Stack>
            </Inspector.Group>
          </Stack>
        </RecordPreviewPanel>
      )}
    </LibraryLoading>
  );
}

function SourcesList() {
  const sources = useRows("ref_sources");
  return (
    <LibraryLoading queries={[sources]}>
      <Stack space="space.250">
        {sources.data?.length ? (
          sources.data.map((source) => (
            <Stack key={source.id} space="space.100" className="border-b pb-250">
              <Inline space="space.100" alignBlock="center" shouldWrap>
                <h2 className="font-heading-small">{source.title}</h2>
                <Badge variant="secondary" tone={source.authoritative ? "success" : "warning"}>
                  {source.authoritative ? "Authoritative source" : "Mirror or derived source"}
                </Badge>
              </Inline>
              <KeyValue label="Authority">{source.authority}</KeyValue>
              <KeyValue label="Source" wrap>
                <TextLink href={source.source_uri} target="_blank" rel="noreferrer">
                  {source.source_uri}
                </TextLink>
              </KeyValue>
              {source.rights && <p className="font-body-small text-subtle">{source.rights}</p>}
              {source.notes && <p className="font-body-small text-subtle">{source.notes}</p>}
            </Stack>
          ))
        ) : (
          <EmptyMessage
            title="No reference sources"
            description="Import a reference source to fill the catalog."
          />
        )}
      </Stack>
    </LibraryLoading>
  );
}
