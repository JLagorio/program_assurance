import { useConfirmation } from "@/components/app/confirmation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  Button,
  CodeBlock,
  DateTime,
  defineColumns,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  Inline,
  Inspector,
  KeyValue,
  LinkButton,
  PageHeader,
  Prose,
  Section,
  Shell,
  Skeleton,
  Stat,
  TextLink,
  VisuallyHidden,
  useDataTable,
} from "@ledger/design-system";
import { deleteRecord, getRecord, listRecords } from "@/lib/database";
import {
  displayValue,
  labelFor,
  recordTitle,
  systemColumns,
  titleColumn,
  type Collection,
  type Column,
  type DataRecord,
} from "@/lib/records";
import { vocabularyFor } from "@/lib/status";
import { FieldStatus } from "./status";
import { Page } from "./shell";
import { useWorkspace } from "./workspace";
import { ProductCollection } from "@/components/prototype/product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  recordDestination,
} from "@/components/prototype/record-preview";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { QueryState } from "@/components/prototype/work-common";
import type { TableName } from "@/lib/models";
import { EvidenceFile } from "./evidence-file";
import {
  productCollectionNoun,
  productCreateLabel,
  productRecordNoun,
} from "@/lib/product-records";
import { RecordEditor, RecordName, type RecordEditorState } from "./record-editor";
import { relatedCollection, useRecord } from "./record-lookup";

// The generic form lives in record-editor.tsx; its callers import it from here too.
export { RecordEditor, type RecordEditorState };

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const fieldLabel = (name: string) => labelFor(name.replace(/_id$/, ""));
const PROSE = /description|narrative|rationale|prose|notes|criteria|statement|body|remarks/;

function CollectionNotFound() {
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Schema inspector</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Empty>
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="search" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Collection not found</EmptyTitle>
          <EmptyDescription>This collection is unavailable in your workspace.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton variant="primary" render={<Link to="/schema" />}>
            Open schema inspector
          </LinkButton>
        </EmptyContent>
      </Empty>
    </Page>
  );
}

/** A reference to another record, named once it loads, opening its schema record. */
function ReferenceLink({ collection, id }: { collection: Collection; id: string }) {
  const query = useRecord(collection, id);
  if (query.isError) return <Absent label="Not available" />;
  return (
    <TextLink
      render={
        <Link
          to="/records/$collection/$recordId"
          params={{ collection: collection.name, recordId: id }}
        />
      }
    >
      <RecordName collection={collection} id={id} />
    </TextLink>
  );
}

/** One stored value, in the words and parts the product uses for its kind. */
function Value({
  collection,
  column,
  value,
}: {
  collection: Collection;
  column: Column;
  value: DataRecord[string] | undefined;
}) {
  const workspace = useWorkspace();
  const target = relatedCollection(collection, column.name, workspace.collections);
  if (target && typeof value === "string" && value)
    return <ReferenceLink collection={target} id={value} />;
  if (value === null || value === undefined || value === "") return <Absent label="Not recorded" />;
  if (vocabularyFor(collection.name, column.name))
    return <FieldStatus table={collection.name} field={column.name} value={value} />;
  if (column.choices.length && typeof value === "string") return <>{labelFor(value)}</>;
  if ((column.type === "date" || column.type.startsWith("timestamp")) && typeof value === "string")
    return <DateTime value={value} />;
  if (typeof value === "object")
    return (
      <CodeBlock
        lines={displayValue(value).split("\n")}
        wrap
        maxHeight={320}
        label={fieldLabel(column.name)}
      />
    );
  if (typeof value === "string" && PROSE.test(column.name)) return <Prose>{value}</Prose>;
  return <>{displayValue(value)}</>;
}

export function RecordList({
  name,
  filter,
}: {
  name: string;
  filter?: [string, string] | undefined;
}) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === name);
  return collection ? (
    <SchemaCollection key={name} collection={collection} filter={filter} />
  ) : (
    <CollectionNotFound />
  );
}

function useDebounced<T>(value: T, delay = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

function SchemaCollection({
  collection,
  filter,
}: {
  collection: Collection;
  filter?: [string, string] | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const name = collection.name;
  const model = name as TableName;
  const [search, setSearch] = useState("");
  // A cleared search is sent at once: the first page is usually still cached, so the rows come
  // back with the toolbar and its focus in place instead of an empty collection in between.
  const debounced = useDebounced(search);
  const term = search === "" ? "" : debounced;
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [selected, setSelected] = useState<DataRecord | null>(null);
  const activeFilter =
    filter && collection.columns.some((column) => column.name === filter[0]) ? filter : undefined;
  // The search settles before it is sent, and the last page stays while the next loads, so the
  // toolbar, the reader's typing and the pager never unmount under them.
  const query = useQuery({
    queryKey: ["records", workspace.tenantId, name, pagination, term, activeFilter],
    queryFn: () =>
      listRecords(workspace, collection, {
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: term,
        filter: activeFilter,
      }),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const keyColumn = titleColumn(collection);
  const columns = useMemo(
    () =>
      defineColumns<DataRecord>((c) => {
        const preferred = [
          keyColumn,
          "code",
          "status",
          "state",
          "program_id",
          "system_id",
          "owner_party_id",
          "due_date",
          "updated_at",
        ];
        const fields = [...new Set(preferred)]
          .flatMap((field) => collection.columns.find((column) => column.name === field) ?? [])
          .slice(0, 5);
        return fields.map((column, index) => {
          const header = fieldLabel(column.name);
          const vocabulary = vocabularyFor(name, column.name);
          if (index === 0)
            // A minimum, not a width: the name takes the room the other columns leave.
            return c.id(column.name, {
              header,
              priority: 0,
              minWidth: 200,
              hideable: false,
              preview: setSelected,
              active: (record) => record.id === selected?.id,
              cell: (record) => (
                <RecordLink table={model} record={record}>
                  {recordTitle(record, collection)}
                </RecordLink>
              ),
            });
          if (vocabulary)
            return c.status(column.name, {
              header,
              width: 150,
              statuses: vocabulary.values,
              cell: (record) => (
                <FieldStatus table={name} field={column.name} value={record[column.name]} />
              ),
            });
          if (/^(date|timestamp)/.test(column.type))
            return c.date(column.name, { header, width: 150 });
          return c.text(column.name, {
            header,
            width: 180,
            cell: (record) => (
              <Value collection={collection} column={column} value={record[column.name]} />
            ),
          });
        });
      }),
    [collection, keyColumn, model, name, selected?.id],
  );
  const table = useDataTable({
    data: query.data?.records ?? [],
    columns,
    getRowId: (record) => record.id,
    label: labelFor(name),
    pageSize: 25,
    pageSizes: [25, 50, 100],
    view: `schema-${name}`,
    manual: { pagination: true, filtering: true },
    rowCount: query.data?.count ?? 0,
    enableSorting: false,
    state: { globalFilter: search, pagination },
    onPaginationChange: setPagination,
    onGlobalFilterChange: (next) => {
      setSearch(typeof next === "function" ? next(search) : next);
      setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    },
  });
  const displayed = useDisplayedRecords(table);
  const canCreate = collection.can_insert && workspace.role !== "viewer";
  const create = (size: "small" | "medium") =>
    canCreate ? (
      <LinkButton
        size={size}
        variant="primary"
        render={
          <Link
            to="/records/$collection/$recordId"
            params={{ collection: name, recordId: "new" }}
            search={activeFilter ? { field: activeFilter[0], value: activeFilter[1] } : {}}
          />
        }
      >
        {productCreateLabel(name)}
      </LinkButton>
    ) : undefined;
  const clearFilter = (
    <LinkButton
      size="small"
      variant="subtle"
      render={<Link to="/records/$collection" params={{ collection: name }} search={{}} />}
    >
      Clear related-record filter
    </LinkButton>
  );
  const preview = selected ? { record: selected } : null;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>{labelFor(name)}</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <ProductCollection
        table={table}
        queries={[query]}
        fill
        // The inspector pages on the server; its question is the route's, not the session's.
        keepQuestion={false}
        // The server orders each page by the title; a sort menu would sort one page only.
        sort={false}
        searchLabel={`Search ${labelFor(keyColumn).toLowerCase()}`}
        action={create("small")}
        filters={activeFilter ? clearFilter : undefined}
        narrowed={!!activeFilter}
        onRowClick={(record) => void navigate(recordDestination(model, record))}
        empty={{
          illustration: "records",
          title: `No ${productCollectionNoun(name)} yet`,
          description: collection.can_insert
            ? `Create the first ${productRecordNoun(name)} to begin this collection.`
            : "No reference records have been imported for this collection.",
          action: create("medium"),
          ...(activeFilter
            ? {
                filtered: {
                  title: `No related ${productCollectionNoun(name)}`,
                  description: "Nothing in this collection refers to that record.",
                  action: clearFilter,
                },
              }
            : {}),
        }}
      />
      {preview && (
        <RecordPreviewPanel
          title={recordTitle(preview.record, collection)}
          label={`${capitalize(productRecordNoun(name))} preview`}
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table={model}
              record={preview.record}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <PreviewProperties
            key={preview.record.id}
            collection={collection}
            id={preview.record.id}
            keyColumn={keyColumn}
          />
        </RecordPreviewPanel>
      )}
    </Page>
  );
}

/**
 * A preview's properties. The list reads a few columns per row, so the preview reads the whole
 * record (the same query its page uses): the name is the title, the properties are the rest.
 */
function PreviewProperties({
  collection,
  id,
  keyColumn,
}: {
  collection: Collection;
  id: string;
  keyColumn: string;
}) {
  const query = useRecord(collection, id);
  const record = query.data;
  return (
    <QueryState queries={[query]} retryLabel="Retry loading the properties">
      {record ? (
        <KeyValue.Group>
          {collection.columns
            .filter(
              (column) =>
                column.name in record &&
                column.name !== keyColumn &&
                !systemColumns.has(column.name),
            )
            .map((column) => (
              <KeyValue key={column.name} label={fieldLabel(column.name)} wrap>
                <Value collection={collection} column={column} value={record[column.name]} />
              </KeyValue>
            ))}
        </KeyValue.Group>
      ) : null}
    </QueryState>
  );
}

const DETAIL_FIELD = /^(id|state|status|code|.*_id|.*_at|.*_date)$/;

export function RecordDetail({
  name,
  id,
  initial,
}: {
  name: string;
  id: string;
  initial?: [string, string] | undefined;
}) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === name);
  // Preserve the exact revision the user started editing, even if queries refetch.
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const [editorNoun, setEditorNoun] = useState(() => productRecordNoun(name));
  const onEditorStateChange = useCallback(
    (state: RecordEditorState) => setEditorNoun(state.noun),
    [],
  );
  const { confirm, confirmation } = useConfirmation();
  const deleting = useRef(false);
  // The Actions menu stays while a dialog it opened is up, so focus can come back to it.
  const actionsRef = useRef<HTMLButtonElement>(null);
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["record", workspace.tenantId, name, id],
    queryFn: () => getRecord(workspace, collection!, id),
    enabled: !!collection && id !== "new",
    retry: false,
  });
  const navigate = useNavigate();
  useBlocker({
    shouldBlockFn: () => deleting.current,
    enableBeforeUnload: () => deleting.current,
  });
  async function remove() {
    if (!collection || !query.data || deleting.current) return;
    const record = query.data;
    const noun = productRecordNoun(name, record);
    const removed = await confirm({
      title: `Delete ${noun}?`,
      description:
        "The record is removed permanently. The database refuses the deletion while other records still refer to it.",
      confirmLabel: `Delete ${noun}`,
      variant: "danger",
      failureTitle: `The ${noun} was not deleted`,
      action: async () => {
        deleting.current = true;
        try {
          await deleteRecord(workspace, collection, record);
        } finally {
          deleting.current = false;
        }
      },
    });
    if (!removed) return;
    cache.removeQueries({ queryKey: ["record", workspace.tenantId, name, id] });
    void cache.invalidateQueries({ queryKey: ["records"] });
    void cache.invalidateQueries({ queryKey: ["reference-options"] });
    await navigate({ to: "/records/$collection", params: { collection: name }, search: {} });
  }
  if (!collection) return <CollectionNotFound />;
  const creating = id === "new";
  const noun = productRecordNoun(name, query.data);
  const canEdit =
    workspace.role !== "viewer" &&
    collection.can_update &&
    query.data?.["state"] !== "published" &&
    query.data?.["status"] !== "published" &&
    typeof query.data?.revision === "number" &&
    query.data?.["tenant_id"] !== null;
  const missing =
    !creating &&
    query.error instanceof Error &&
    query.error.message === "This record does not exist or is not accessible in your workspace.";
  const trail = (current: ReactNode) => (
    <RecordTrail current={current}>
      <TrailLink to="/schema">Schema inspector</TrailLink>
      <TrailLink to="/records/$collection" params={{ collection: name }}>
        {labelFor(name)}
      </TrailLink>
    </RecordTrail>
  );
  // The product's not-found shape: the record's kind as the page title, then the Empty.
  if (missing)
    return (
      <Page>
        <PageHeader>
          {trail("Not found")}
          <PageHeader.Heading>
            <PageHeader.Title>{capitalize(noun)}</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
        <Empty>
          <EmptyMedia aria-hidden>
            <EmptyIllustration kind="search" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{capitalize(noun)} not found</EmptyTitle>
            <EmptyDescription>
              This {noun} does not exist, or it is not shared with your workspace.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <LinkButton
              variant="primary"
              render={<Link to="/records/$collection" params={{ collection: name }} />}
            >
              Back to {labelFor(name).toLowerCase()}
            </LinkButton>
          </EmptyContent>
        </Empty>
      </Page>
    );
  const title = creating ? (
    `Create ${editorNoun}`
  ) : query.data ? (
    recordTitle(query.data, collection)
  ) : (
    <span aria-busy="true">
      <Skeleton shape="heading" width={240} />
      <VisuallyHidden>Loading the {noun}</VisuallyHidden>
    </span>
  );
  const incoming = workspace.collections.flatMap((other) =>
    other.relations
      .filter((relation) => relation.target_schema === "public" && relation.target_table === name)
      .flatMap((relation) =>
        relation.columns
          .filter(
            (column, index) => column !== "tenant_id" && relation.target_columns[index] === "id",
          )
          .map((column) => ({ collection: other, column })),
      ),
  );
  return (
    <Page>
      <PageHeader>
        {trail(title)}
        <PageHeader.Heading>
          <PageHeader.Title>{title}</PageHeader.Title>
        </PageHeader.Heading>
        {!creating && canEdit && (
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger
                ref={actionsRef}
                render={<Button iconAfter={<ChevronDown />}>Actions</Button>}
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(query.data!)}>
                  Edit {noun}
                </DropdownMenuItem>
                {collection.can_delete && (
                  <DropdownMenuItem variant="danger" onClick={() => void remove()}>
                    Delete {noun}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader.Actions>
        )}
      </PageHeader>
      {confirmation}
      {creating ? (
        collection.can_insert && workspace.role !== "viewer" ? (
          <RecordEditor
            key={`${name}-new`}
            collection={collection}
            initial={initial}
            onStateChange={onEditorStateChange}
            onCancel={() =>
              void navigate({
                to: "/records/$collection",
                params: { collection: name },
                search: {},
              })
            }
          />
        ) : (
          <Alert role="note">
            <AlertDescription>
              {collection.can_insert
                ? "An editor, admin, or owner can create records in this collection."
                : "This collection is maintained through its reference import workflow."}
            </AlertDescription>
          </Alert>
        )
      ) : (
        <>
          {editing && (
            <SchemaEditDialog
              finalFocus={actionsRef}
              onClose={() => setEditing(null)}
              collection={collection}
              existing={editing}
            />
          )}
          <QueryState queries={[query]}>
            {query.data && (
              <>
                <Shell.Aside label="Record properties">
                  <Inspector.Group title="Details">
                    <KeyValue.Group>
                      {collection.columns
                        .filter(
                          (column) => DETAIL_FIELD.test(column.name) && column.name !== "tenant_id",
                        )
                        .map((column) => (
                          <KeyValue key={column.name} label={fieldLabel(column.name)} wrap>
                            <Value
                              collection={collection}
                              column={column}
                              value={query.data[column.name]}
                            />
                          </KeyValue>
                        ))}
                    </KeyValue.Group>
                  </Inspector.Group>
                </Shell.Aside>
                {name === "evidence_versions" && (
                  <EvidenceFile collection={collection} record={query.data} />
                )}
                <KeyValue.Group layout="stacked" className="max-w-layout-measure">
                  {collection.columns
                    .filter(
                      (column) =>
                        !systemColumns.has(column.name) && !DETAIL_FIELD.test(column.name),
                    )
                    .map((column) => (
                      <KeyValue key={column.name} label={fieldLabel(column.name)} wrap>
                        <Value
                          collection={collection}
                          column={column}
                          value={query.data[column.name]}
                        />
                      </KeyValue>
                    ))}
                </KeyValue.Group>
                {incoming.length > 0 && (
                  <Section title="Related records">
                    <Inline space="space.150" shouldWrap>
                      {incoming.map((relation) => (
                        <LinkButton
                          key={`${relation.collection.name}-${relation.column}`}
                          size="small"
                          render={
                            <Link
                              to="/records/$collection"
                              params={{ collection: relation.collection.name }}
                              search={{ field: relation.column, value: id }}
                            />
                          }
                        >
                          {labelFor(relation.collection.name)}
                          {incoming.filter(
                            (other) => other.collection.name === relation.collection.name,
                          ).length > 1
                            ? ` (${fieldLabel(relation.column)})`
                            : ""}
                        </LinkButton>
                      ))}
                    </Inline>
                  </Section>
                )}
              </>
            )}
          </QueryState>
        </>
      )}
    </Page>
  );
}

/**
 * One collection's count as a headline number: the whole tile opens the collection, named by its
 * label, the number and the note.
 */
function RecordCount({ name }: { name: string }) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === name);
  const query = useQuery({
    queryKey: ["records", workspace.tenantId, name, "count"],
    queryFn: () => listRecords(workspace, collection!, { limit: 1 }),
    enabled: !!collection,
    retry: false,
  });
  if (!collection) return null;
  return (
    <Stat.Tile
      label={labelFor(name)}
      value={query.isError ? <Absent label="Not available" /> : (query.data?.count ?? 0)}
      isLoading={query.isPending && !query.isError}
      link={<Link to="/records/$collection" params={{ collection: name }} />}
      {...(query.isError ? { note: "Could not be counted" } : {})}
    />
  );
}

export function WorkspaceHome() {
  const workspace = useWorkspace();
  const programs = workspace.collections.find((item) => item.name === "programs");
  const count = useQuery({
    queryKey: ["records", workspace.tenantId, "programs", "count"],
    queryFn: () => listRecords(workspace, programs!, { limit: 1 }),
    enabled: !!programs,
    retry: false,
  });
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Schema inspector</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Stat.Grid cols={4} role="group" aria-label="Record counts">
        {["programs", "systems", "operational_issues", "tasks"].map((name) => (
          <RecordCount key={name} name={name} />
        ))}
      </Stat.Grid>
      {count.data?.count === 0 && (
        <Empty>
          <EmptyMedia aria-hidden>
            <EmptyIllustration kind="records" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Build your assurance record</EmptyTitle>
            <EmptyDescription>
              Create a program and system, define its boundary, and connect its requirements and
              implementation to the reference controls.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <LinkButton
              variant="primary"
              render={
                <Link
                  to="/records/$collection/$recordId"
                  params={{ collection: "programs", recordId: "new" }}
                />
              }
            >
              Create program
            </LinkButton>
            <LinkButton
              render={
                <Link to="/records/$collection" params={{ collection: "catalog_revisions" }} />
              }
            >
              Explore reference catalogs
            </LinkButton>
          </EmptyContent>
        </Empty>
      )}
    </Page>
  );
}

/** The inspector's edit form: the generic editor in a Dialog it owns, with the pending lock. */
function SchemaEditDialog({
  collection,
  existing,
  onClose,
  finalFocus,
}: {
  collection: Collection;
  existing: DataRecord;
  onClose: () => void;
  /** The control focus returns to: the menu item that opened the dialog has gone with its menu. */
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const state = useRef<RecordEditorState | null>(null);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const onStateChange = useCallback((next: RecordEditorState) => {
    state.current = next;
    setBusy(next.busy);
  }, []);
  return (
    <Dialog
      open={open}
      pending={busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        state.current?.requestClose();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent width="large" finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>Edit {productRecordNoun(collection.name, existing)}</DialogTitle>
        </DialogHeader>
        <RecordEditor
          collection={collection}
          existing={existing}
          onCancel={() => setOpen(false)}
          onSaved={() => setOpen(false)}
          formLayout="dialog"
          onStateChange={onStateChange}
        />
      </DialogContent>
    </Dialog>
  );
}
