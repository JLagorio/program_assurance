import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Count,
  DataTable,
  defineColumns,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { useRows, type Row } from "@/lib/models";
import { ControlInspector, LibraryControlTable } from "@/components/prototype/library-controls";
import { LibraryLoading } from "@/components/prototype/library-shared";

export const Route = createFileRoute("/catalog")({
  head: () => ({ meta: [{ title: "Catalog — Program Assurance" }] }),
  component: CatalogPage,
});

function CatalogPage() {
  const [tab, setTab] = useState("Controls");
  const [control, setControl] = useState<Row<"controls"> | null>(null);
  const controls = useRows("controls");
  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>Catalog</PageHeader.Title>
          <p className="pt-050 font-body-small text-subtle">
            Published control text, assessment objectives, correlation identifiers, and their
            sources.
          </p>
        </div>
      </PageHeader>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(String(value));
          setControl(null);
        }}
        className="contents"
      >
        <TabsList className="w-full justify-start" variant="line" activateOnFocus>
          {["Controls", "CCIs", "Sources"].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Controls" && controls.data && (
                <Count value={controls.data.length} max={99999} />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Controls" && (
            <LibraryLoading queries={[controls]}>
              <LibraryControlTable controls={controls.data ?? []} onSelect={setControl} />
            </LibraryLoading>
          )}
          {tab === "CCIs" && <CciTable />}
          {tab === "Sources" && <SourcesList />}
        </TabsContent>
      </Tabs>
      {control && (
        <ControlInspector key={control.id} control={control} onClose={() => setControl(null)} />
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
        c.id("code", { header: "CCI", width: 132, hideable: false }),
        c.text("definition", { header: "Definition", hideable: false }),
        c.text("controls", { header: "Mapped controls", width: 180 }),
        c.text("types", { header: "Type", width: 132 }),
        c.status("status", {
          header: "Source status",
          width: 130,
          tone: (row) => (row.status === "deprecated" ? "warning" : "neutral"),
        }),
        c.text("published_on", { header: "Published", width: 125 }),
      ]),
    [],
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
  return (
    <LibraryLoading queries={[items, references, links, controls, types]}>
      <DataTable
        table={table}
        fill
        onRowClick={setSelected}
        empty={{
          illustration: "shield",
          title: "No CCIs yet",
          description: "Import a CCI release to fill the catalog.",
        }}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Find a CCI" />
            <DataTable.Filter table={table} column="types" />
            <DataTable.Filter table={table} column="status" />
            <span className="font-body-small text-subtle">{rows.length} records</span>
            <Inline className="ml-auto" space="space.100">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Inline>
          </Inline>
        }
      />
      {selected && (
        <Shell.Panel title={selected.code} onClose={() => setSelected(null)}>
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
        </Shell.Panel>
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
          <p className="text-subtle">No reference sources have been imported.</p>
        )}
      </Stack>
    </LibraryLoading>
  );
}
