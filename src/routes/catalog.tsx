import { ControlInspector } from "@/components/prototype/library-controls";
import { ProductCollection } from "@/components/prototype/product-collection";
import { useServerCollection, vocabularyOptions } from "@/components/prototype/collection-question";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "@/components/prototype/record-preview";
import { EmptyMessage, QueryState } from "@/components/prototype/work-common";
import { Constants } from "@/lib/database.types";
import { idSet, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { cciStatuses, controlPublicationStatuses, referenceResolutionStatuses } from "@/lib/status";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import {
  Absent,
  Badge,
  DataTable,
  DateTime,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Prose,
  Section,
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
} from "@ledger/design-system";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";

const catalogTabs = ["Controls", "CCIs", "Sources"] as const;
type CatalogTab = (typeof catalogTabs)[number];

export const Route = createFileRoute("/catalog")({
  // The tab and the edition live in the URL, so reload, Back and a shared link keep them.
  validateSearch: (
    search: Record<string, unknown>,
  ): { edition?: string | undefined; tab?: CatalogTab | undefined } => ({
    ...(typeof search["edition"] === "string" && /^[0-9a-f-]{36}$/i.test(search["edition"])
      ? { edition: search["edition"] }
      : {}),
    ...(() => {
      const tab = catalogTabs.find(
        (name) => name.toLowerCase() === String(search["tab"] ?? "").toLowerCase(),
      );
      return tab && tab !== "Controls" ? { tab } : {};
    })(),
  }),
  head: () => ({ meta: [{ title: "Catalog — Program Assurance" }] }),
  component: CatalogPage,
});

/** A catalog control as the Controls register and its preview read it: never its stored properties. */
type CatalogControl = ServerRow<
  "catalog_control_rows",
  | "id"
  | "code"
  | "title"
  | "source_id"
  | "status"
  | "group_id"
  | "catalog_revision_id"
  | "family"
  | "selected_by",
  "code" | "title" | "source_id" | "status" | "catalog_revision_id" | "selected_by"
>;

function CatalogPage() {
  const { edition, tab = "Controls" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [control, setControl] = useState<CatalogControl | null>(null);
  const [displayedControls, setDisplayedControls] = useState<CatalogControl[]>([]);
  const revisions = useRows("catalog_revisions", undefined, {
    columns: ["id", "catalog_id", "title", "version", "state"],
  });
  const catalogs = useRows("catalogs", undefined, { columns: ["id", "title"] });
  const catalogTitle = (row: Pick<Row<"catalog_revisions">, "catalog_id" | "title">) =>
    catalogs.data?.find((catalog) => catalog.id === row.catalog_id)?.title ?? row.title;
  const editions = useMemo(
    () =>
      [...(revisions.data ?? [])]
        .filter((row) => row.state === "published")
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true })),
    [revisions.data],
  );
  const current = editions.find((row) => row.id === edition) ?? editions[0];
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Catalog</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = catalogTabs.find((name) => name === value) ?? "Controls";
          setControl(null);
          void navigate({
            search: (previous) => ({ ...previous, tab: next === "Controls" ? undefined : next }),
          });
        }}
      >
        <TabsList variant="line" aria-label="Catalog views">
          {catalogTabs.map((name) => (
            // A register's tabs name its views; how many rows each holds is the table's to say.
            <TabsTrigger key={name} value={name}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          {tab === "Controls" && (
            <QueryState queries={[revisions, catalogs]}>
              <CatalogControls
                edition={current?.id}
                selectedId={control?.id}
                onSelect={setControl}
                onDisplayedRowsChange={setDisplayedControls}
                editionSelect={
                  <Select
                    value={current?.id ?? ""}
                    onValueChange={(value) => {
                      if (value)
                        void navigate({ search: (previous) => ({ ...previous, edition: value }) });
                    }}
                  >
                    <SelectTrigger aria-label="Catalog edition" size="small">
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
            </QueryState>
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
    </Page>
  );
}

/**
 * The edition's controls, a page at a time from the server: the code in reading order (AC-2 before
 * AC-10), the family, and the published profiles that select each control, which the search, the
 * sort and the filters all reach.
 */
const catalogControlRead = (edition: string | undefined) =>
  serverRead({
    source: "catalog_control_rows",
    model: "controls",
    columns: [
      "id",
      "code",
      "title",
      "source_id",
      "status",
      "group_id",
      "catalog_revision_id",
      "family",
      "selected_by",
    ],
    scope: { catalog_revision_id: edition ?? [] },
    search: ["code", "title", "family"],
    fields: {
      code: { sort: "code_order" },
      status: { labels: controlPublicationStatuses },
      selectedBy: {
        column: "selected_by",
        filter: "list",
        emptyLabel: NO_PROFILE,
        sort: false,
      },
    },
    order: [{ column: "code_order" }],
  });

/** What the Selected by column and its filter call a control no published profile selects. */
const NO_PROFILE = "No published profile";

/** A published profile revision that selects controls, for the Selected by column. */
type ControlSelector = { key: string; label: string; meta: ReactNode };

function CatalogControls({
  edition,
  editionSelect,
  selectedId,
  onSelect,
  onDisplayedRowsChange,
}: {
  edition: string | undefined;
  /** The edition the rows are drawn from, first among the toolbar's filters. */
  editionSelect: ReactNode;
  selectedId: string | undefined;
  onSelect: (control: CatalogControl) => void;
  onDisplayedRowsChange: (rows: CatalogControl[]) => void;
}) {
  const navigate = useNavigate();
  // The edition's families, for the Family filter: the server's rows are one page of them.
  const groups = useRows(
    "catalog_groups",
    { catalog_revision_id: edition ?? [] },
    { columns: ["id", "source_id", "ordinal"], keepPrevious: true },
  );
  // The published profiles that select controls: their names, for Selected by and its filter.
  const resolutions = useRows(
    "profile_resolutions",
    { state: "published" },
    { columns: ["id", "profile_revision_id"] },
  );
  const profileRevisions = useRows(
    "profile_revisions",
    { id: idSet(resolutions.data?.map((row) => row.profile_revision_id)), state: "published" },
    { columns: ["id", "profile_id", "title", "version"], enabled: resolutions.isSuccess },
  );
  const profiles = useRows(
    "profiles",
    { id: idSet(profileRevisions.data?.map((row) => row.profile_id)) },
    { columns: ["id", "code", "title"], enabled: profileRevisions.isSuccess },
  );
  const selectors = useMemo(() => {
    const byProfile = new Map((profiles.data ?? []).map((row) => [row.id, row]));
    return new Map<string, ControlSelector>(
      (profileRevisions.data ?? []).map((revision) => {
        const profile = byProfile.get(revision.profile_id);
        return [
          revision.id,
          {
            key: revision.id,
            label: `${profile?.title ?? revision.title} · ${revision.version}`,
            meta: profile?.code ?? null,
          },
        ];
      }),
    );
  }, [profileRevisions.data, profiles.data]);
  const columns = useMemo(
    () =>
      defineColumns<CatalogControl>((c) => [
        // Every family's first control is "Policy and Procedures": the code stays beside the title.
        c.id("code", {
          header: "Control",
          // Wide enough for "AC-2(13)" and its eye, so a narrowed table keeps it beside the title.
          width: 112,
          priority: 1,
          pin: "start",
          hideable: false,
        }),
        c.text("title", {
          header: "Title",
          hideable: false,
          priority: 0,
          minWidth: 200,
          cell: (row) => (
            <RecordLink table="controls" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("family", { header: "Family", width: 100, priority: 2 }),
        c.status("status", {
          header: "Status",
          width: 130,
          priority: 2,
          statuses: controlPublicationStatuses,
        }),
        c.list("selectedBy", {
          header: "Selected by",
          width: 240,
          priority: 3,
          sortable: false,
          items: (row) =>
            row.selected_by
              .map((id) => selectors.get(id))
              .filter((selector): selector is ControlSelector => selector !== undefined)
              .sort((a, b) => a.label.localeCompare(b.label)),
          // A control no published profile selects is found under that, as its cell says.
          empty: () => <Absent label={NO_PROFILE} />,
          emptyLabel: NO_PROFILE,
        }),
      ]),
    [selectors],
  );
  const familyOptions = useMemo(
    () =>
      [...(groups.data ?? [])]
        .sort((a, b) => a.ordinal - b.ordinal)
        .flatMap((group) => (group.source_id ? [{ value: group.source_id.toUpperCase() }] : [])),
    [groups.data],
  );
  const selectorOptions = useMemo(
    () => [
      ...[...selectors.values()]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((selector) => ({ value: selector.key, label: selector.label })),
      { value: NO_PROFILE },
    ],
    [selectors],
  );
  const collection = useServerCollection<CatalogControl>(catalogControlRead(edition), {
    preview: useMemo(
      () => ({ onPreview: onSelect, activeId: selectedId ?? null }),
      [selectedId, onSelect],
    ),
    columns,
    // Titles repeat across families (every family's first control is "Policy and Procedures"), so
    // the row's controls are named by code and title, also once a narrow frame folds the code.
    rowLabel: (row) => `${row.code} · ${row.title}`,
    label: "Catalog controls",
    view: "live-library-controls-v2",
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  useDisplayedRecords(table, onDisplayedRowsChange);
  return (
    <ProductCollection
      {...collection}
      queries={[...collection.queries, groups, resolutions, profileRevisions, profiles]}
      fill
      noun={{ one: "control", other: "controls" }}
      onRowClick={(row) => void navigate(recordDestination("controls", row))}
      empty={{
        illustration: "shield",
        title: "No controls yet",
        description: "Reference catalogs are loaded by a workspace administrator.",
      }}
      searchLabel="Find a control"
      filters={
        <>
          {editionSelect}
          <DataTable.Filter table={table} column="family" options={familyOptions} />
          <DataTable.Filter
            table={table}
            column="status"
            options={vocabularyOptions(controlPublicationStatuses)}
          />
          <DataTable.Filter table={table} column="selectedBy" options={selectorOptions} />
        </>
      }
    />
  );
}

/**
 * The CCIs, a page at a time from the server: each with its types and the codes of the controls
 * its publication references map to, which the search, the sort and the filters all reach.
 */
const cciRead = serverRead({
  source: "cci_item_rows",
  model: "cci_items",
  columns: [
    "id",
    "code",
    "definition",
    "status",
    "published_on",
    "contributor",
    "types",
    "controls",
  ],
  search: ["code", "definition", "controls"],
  fields: {
    types: { filter: "list", emptyLabel: "Not recorded" },
    status: { labels: cciStatuses },
    published_on: { filter: "range" },
  },
  order: [{ column: "code" }],
});
/** What the CCI register and its preview show of an item: never its notes or parameters. */
type CciItem = ServerRow<
  "cci_item_rows",
  "id" | "code" | "definition" | "status" | "published_on" | "contributor" | "types" | "controls",
  "code" | "definition" | "status" | "published_on" | "types"
>;

const cciColumns = defineColumns<CciItem>((c) => [
  c.id("code", {
    header: "CCI",
    width: 180,
    priority: 0,
    hideable: false,
    cell: (row) => (
      <RecordLink table="cci_items" record={row}>
        {row.code}
      </RecordLink>
    ),
  }),
  c.text("definition", { header: "Definition", hideable: false }),
  c.text("controls", { header: "Mapped controls", width: 180 }),
  // The Type filter offers each type on its own, and a CCI of both is found under either; one
  // with none is found under Not recorded, as its cell says.
  c.list("types", {
    header: "Type",
    width: 132,
    items: (row) => row.types.map((type) => ({ key: type, label: labelFor(type) })),
    emptyLabel: "Not recorded",
  }),
  c.status("status", { header: "Source status", width: 130, statuses: cciStatuses }),
  c.date("published_on", { header: "Published" }),
]);

const cciTypeOptions = [
  ...Constants.public.Enums.cci_type.map((type) => ({ value: type, label: labelFor(type) })),
  { value: "Not recorded" },
];

function CciTable() {
  const [selected, setSelected] = useState<CciItem | null>(null);
  const navigate = useNavigate();
  const collection = useServerCollection<CciItem>(cciRead, {
    preview: useMemo(
      () => ({ onPreview: setSelected, activeId: selected?.id ?? null }),
      [selected?.id],
    ),
    columns: cciColumns,
    label: "Control correlation identifiers",
    view: "live-catalog-ccis",
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  return (
    <>
      <ProductCollection
        {...collection}
        fill
        noun={{ one: "CCI", other: "CCIs" }}
        onRowClick={(row) => void navigate(recordDestination("cci_items", row))}
        empty={{
          illustration: "shield",
          title: "No CCIs yet",
          description:
            "CCI releases are loaded into the reference data by a workspace administrator.",
        }}
        searchLabel="Find a CCI"
        filters={
          <>
            <DataTable.Filter table={table} column="types" options={cciTypeOptions} />
            <DataTable.Filter
              table={table}
              column="status"
              options={vocabularyOptions(cciStatuses)}
            />
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
              <Prose>{selected.definition}</Prose>
            </Inspector.Group>
            <Inspector.Group title="Source record">
              <KeyValue.Group>
                <KeyValue label="Status">
                  <StatusBadge statuses={cciStatuses} value={selected.status} />
                </KeyValue>
                <KeyValue label="Contributor">{selected.contributor ?? <Absent />}</KeyValue>
                <KeyValue label="Published">
                  <DateTime value={selected.published_on} />
                </KeyValue>
              </KeyValue.Group>
            </Inspector.Group>
            <Inspector.Group title="Publication references">
              <CciReferences itemId={selected.id} />
            </Inspector.Group>
          </Stack>
        </RecordPreviewPanel>
      )}
    </>
  );
}

/** One CCI's publication references, read when its preview shows. */
function CciReferences({ itemId }: { itemId: string }) {
  const references = useRows(
    "cci_references",
    { cci_item_id: itemId },
    {
      columns: [
        "id",
        "publication_title",
        "publication_version",
        "source_index",
        "resolution_status",
      ],
      order: { column: "ordinal" },
    },
  );
  return (
    <QueryState queries={[references]}>
      {references.data?.length ? (
        <Stack space="space.200">
          {references.data.map((reference) => (
            <KeyValue.Group key={reference.id}>
              <KeyValue label="Publication" wrap>
                {reference.publication_title} · {reference.publication_version}
              </KeyValue>
              <KeyValue label="Index">
                <Id>{reference.source_index}</Id>
              </KeyValue>
              <KeyValue label="Resolution">
                <StatusBadge
                  statuses={referenceResolutionStatuses}
                  value={reference.resolution_status}
                />
              </KeyValue>
            </KeyValue.Group>
          ))}
        </Stack>
      ) : (
        <EmptyMessage
          compact
          title="No publication references"
          description="The CCI release records none for this item."
        />
      )}
    </QueryState>
  );
}

/**
 * A source's address in a few words: the file it names ("NIST_SP-800-53_rev5_catalog.json"),
 * else its host, so each source's link reads differently from the next.
 */
function sourceName(uri: string) {
  try {
    const url = new URL(uri);
    const file = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
    return file || url.host || uri;
  } catch {
    return uri;
  }
}

function SourcesList() {
  const sources = useRows("ref_sources", undefined, {
    columns: ["id", "title", "authority", "source_uri", "authoritative", "rights", "notes"],
  });
  return (
    <QueryState queries={[sources]}>
      <Stack space="space.300">
        {sources.data?.length ? (
          sources.data.map((source) => (
            <Section key={source.id}>
              <Section.Header divided>
                <Section.Heading>
                  <Inline space="space.100" alignBlock="baseline" shouldWrap>
                    <Section.Title>{source.title}</Section.Title>
                    <Badge
                      variant="secondary"
                      size="xsmall"
                      tone={source.authoritative ? "success" : "warning"}
                    >
                      {source.authoritative ? "Authoritative source" : "Mirror or derived source"}
                    </Badge>
                  </Inline>
                </Section.Heading>
              </Section.Header>
              <KeyValue.Group>
                <KeyValue label="Authority">{source.authority}</KeyValue>
                <KeyValue label="Source" wrap>
                  <TextLink href={source.source_uri} newTab>
                    {sourceName(source.source_uri)}
                  </TextLink>
                </KeyValue>
                {source.rights && (
                  <KeyValue label="Rights" wrap>
                    {source.rights}
                  </KeyValue>
                )}
                {source.notes && (
                  <KeyValue label="Notes" wrap>
                    {source.notes}
                  </KeyValue>
                )}
              </KeyValue.Group>
            </Section>
          ))
        ) : (
          <EmptyMessage
            illustration="document"
            title="No reference sources"
            description="Reference sources appear here once a pinned publication is imported."
          />
        )}
      </Stack>
    </QueryState>
  );
}
