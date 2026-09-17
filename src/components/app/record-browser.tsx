import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Box,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  DialogFooter,
  Field,
  FieldDescription,
  FieldLabel,
  Grid,
  Inline,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Textarea,
  TextLink,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
} from "@ledger/design-system";
import { deleteRecord, getRecord, listRecords, saveRecord } from "@/lib/database";
import {
  defaultValue,
  displayValue,
  labelFor,
  recordPayload,
  recordTitle,
  systemColumns,
  isDerivedRecordField,
  titleColumn,
  type Collection,
  type Column,
  timestampInput,
  type DataRecord,
} from "@/lib/records";
import { useWorkspace } from "./workspace";
import { EvidenceFile } from "./evidence-file";
import {
  isAdditionalProductField,
  productFieldOrder,
  productRecordNoun,
} from "@/lib/product-records";

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <p role="alert" className="text-danger">
      {error instanceof Error ? error.message : "The request could not be completed."}
    </p>
  );
}
function CollectionNotFound() {
  return (
    <Box padding="space.400">
      <Stack space="space.300">
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Schema inspector</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <EmptyIllustration kind="search" />
            </EmptyMedia>
            <EmptyTitle>Collection not found</EmptyTitle>
            <EmptyDescription>This collection is unavailable in your workspace.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <TextLink render={<Link to="/schema" />}>Open schema inspector</TextLink>
          </EmptyContent>
        </Empty>
      </Stack>
    </Box>
  );
}
function relatedCollection(collection: Collection, column: string, collections: Collection[]) {
  const relation = collection.relations.find(
    (item) =>
      item.target_schema === "public" &&
      item.columns.includes(column) &&
      item.target_columns[item.columns.indexOf(column)] === "id" &&
      column !== "tenant_id",
  );
  return relation ? collections.find((item) => item.name === relation.target_table) : undefined;
}

function ReferenceLink({ collection, id }: { collection: Collection; id: string }) {
  const workspace = useWorkspace();
  const query = useQuery({
    queryKey: ["record", workspace.tenantId, collection.name, id],
    queryFn: () => getRecord(workspace, collection, id),
    retry: false,
  });
  return (
    <TextLink
      render={
        <Link
          to="/records/$collection/$recordId"
          params={{ collection: collection.name, recordId: id }}
        />
      }
    >
      {query.data
        ? recordTitle(query.data, collection)
        : query.isError
          ? "Unavailable record"
          : "Loading record…"}
    </TextLink>
  );
}
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
  if (value === null || value === undefined || value === "")
    return <span className="text-subtlest">Not recorded</span>;
  if (column.choices.length && typeof value === "string") return <span>{labelFor(value)}</span>;
  if (typeof value === "object")
    return (
      <pre className="whitespace-pre-wrap break-words font-body-small">{displayValue(value)}</pre>
    );
  return <span className="whitespace-pre-wrap break-words">{displayValue(value)}</span>;
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const activeFilter =
    filter && collection?.columns.some((column) => column.name === filter[0]) ? filter : undefined;
  const query = useQuery({
    queryKey: ["records", workspace.tenantId, name, page, search, activeFilter],
    queryFn: () => listRecords(workspace, collection!, { page, search, filter: activeFilter }),
    enabled: !!collection,
    retry: false,
  });
  if (!collection) return <CollectionNotFound />;
  const keyColumn = titleColumn(collection);
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
  const columns = [...new Set(preferred)]
    .flatMap((name) => collection.columns.find((column) => column.name === name) ?? [])
    .slice(0, 5);
  const canCreate = collection.can_insert && workspace.role !== "viewer";
  return (
    <Box padding="space.400">
      <Stack space="space.300">
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>{labelFor(name)}</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            {canCreate && (
              <Button
                variant="primary"
                render={
                  <Link
                    to="/records/$collection/$recordId"
                    params={{ collection: name, recordId: "new" }}
                    search={activeFilter ? { field: activeFilter[0], value: activeFilter[1] } : {}}
                  />
                }
              >
                Create {productRecordNoun(name)}
              </Button>
            )}
          </PageHeader.Actions>
        </PageHeader>
        <Inline space="space.200" alignBlock="center" shouldWrap>
          <Input
            aria-label={`Search ${labelFor(name).toLowerCase()}`}
            placeholder={`Search ${labelFor(keyColumn).toLowerCase()}…`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
          {query.data && (
            <span className="text-subtle">{query.data.count.toLocaleString()} records</span>
          )}
          {activeFilter && (
            <Button
              variant="subtle"
              render={<Link to="/records/$collection" params={{ collection: name }} search={{}} />}
            >
              Clear related-record filter
            </Button>
          )}
          <Button variant="subtle" onClick={() => void query.refetch()}>
            Refresh
          </Button>
        </Inline>
        {query.isPending ? (
          <p role="status">Loading records…</p>
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : query.data.records.length === 0 ? (
          <Empty>
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind={search || activeFilter ? "search" : "records"} />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {search || activeFilter
                  ? "No matching records"
                  : `No ${labelFor(name).toLowerCase()} yet`}
              </EmptyTitle>
              <EmptyDescription>
                {search || activeFilter
                  ? "Change the search or filter to see other records."
                  : canCreate
                    ? "Create a record to begin. Only saved workspace data appears here."
                    : "No reference records have been imported for this collection."}
              </EmptyDescription>
            </EmptyHeader>
            {search ? (
              <EmptyContent>
                <Button
                  onClick={() => {
                    setSearch("");
                    setPage(0);
                  }}
                >
                  Clear search
                </Button>
              </EmptyContent>
            ) : !activeFilter && canCreate ? (
              <EmptyContent>
                <Button
                  variant="primary"
                  render={
                    <Link
                      to="/records/$collection/$recordId"
                      params={{ collection: name, recordId: "new" }}
                      search={{}}
                    />
                  }
                >
                  Create {productRecordNoun(name)}
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : (
          <Table label={labelFor(name)}>
            <thead>
              <Table.Row>
                {columns.map((column) => (
                  <Table.Header key={column.name}>
                    {labelFor(column.name.replace(/_id$/, ""))}
                  </Table.Header>
                ))}
              </Table.Row>
            </thead>
            <tbody>
              {query.data.records.map((record) => (
                <Table.Row key={record.id}>
                  {columns.map((column, index) => (
                    <Table.Cell key={column.name}>
                      {index === 0 ? (
                        <TextLink
                          render={
                            <Link
                              to="/records/$collection/$recordId"
                              params={{ collection: name, recordId: record.id }}
                            />
                          }
                        >
                          {recordTitle(record, collection)}
                        </TextLink>
                      ) : (
                        <Value
                          collection={collection}
                          column={column}
                          value={record[column.name]}
                        />
                      )}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </tbody>
          </Table>
        )}
        {query.data && query.data.count > 25 && (
          <Inline space="space.150">
            <Button
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page + 1} of {Math.ceil(query.data.count / 25)}
            </span>
            <Button
              variant="secondary"
              disabled={(page + 1) * 25 >= query.data.count}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </Inline>
        )}
      </Stack>
    </Box>
  );
}

function Choice({
  id,
  value,
  onChange,
  choices,
  disabled = false,
  required = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  choices: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
}) {
  const options = [{ value: "", label: required ? "Choose a value" : "Not recorded" }, ...choices];
  return (
    <Select<string>
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={(value) => onChange(value ?? "")}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((choice) => (
          <SelectItem
            key={choice.value}
            value={choice.value}
            disabled={required && choice.value === ""}
          >
            {choice.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function ReferencePicker({
  column,
  collection,
  value,
  onChange,
  presentation = "schema",
}: {
  column: Column;
  collection: Collection;
  value: string;
  onChange: (value: string) => void;
  presentation?: "schema" | "product";
}) {
  const workspace = useWorkspace();
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["reference-options", workspace.tenantId, collection.name, search],
    queryFn: () => listRecords(workspace, collection, { search, limit: 50 }),
    retry: false,
  });
  const selected = useQuery({
    queryKey: ["record", workspace.tenantId, collection.name, value],
    queryFn: () => getRecord(workspace, collection, value),
    enabled: !!value,
    retry: false,
  });
  const choices = (query.data?.records ?? []).map((record) => ({
    value: record.id,
    label: recordTitle(record, collection),
  }));
  if (value && !choices.some((choice) => choice.value === value))
    choices.unshift({
      value,
      label: selected.data
        ? recordTitle(selected.data, collection)
        : presentation === "product"
          ? "Loading selected record…"
          : value,
    });
  if (presentation === "product")
    return (
      <Stack space="space.100">
        <Combobox<{ value: string; label: string }>
          items={choices}
          value={choices.find((item) => item.value === value) ?? null}
          isItemEqualToValue={(item, selectedItem) => item.value === selectedItem.value}
          filter={null}
          onInputValueChange={(input, details) => {
            if (["input-change", "input-clear", "clear-press"].includes(details.reason))
              setSearch(input);
          }}
          onValueChange={(item) => onChange(item?.value ?? "")}
        >
          <ComboboxInput
            id={`field-${column.name}`}
            aria-required={column.required && !column.default}
            placeholder={`Choose ${productRecordNoun(collection.name)}…`}
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {query.isPending ? "Loading records…" : "No matching records."}
            </ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {query.isError && <ErrorMessage error={query.error} />}
        {selected.isError && <ErrorMessage error={selected.error} />}
        {query.data && query.data.count > 50 && (
          <p className="font-body-small text-subtle">Type to narrow the matching records.</p>
        )}
      </Stack>
    );
  return (
    <Stack space="space.100">
      <Input
        aria-label={`Find ${labelFor(column.name.replace(/_id$/, ""))}`}
        placeholder={`Find ${labelFor(collection.name).toLowerCase()}…`}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Choice id={`field-${column.name}`} value={value} onChange={onChange} choices={choices} />
      {query.isError && <ErrorMessage error={query.error} />}
      {query.isPending && (
        <p role="status" className="font-body-small">
          Loading related records…
        </p>
      )}
      {query.data?.count === 0 && (
        <p className="font-body-small text-subtle">
          No matching {labelFor(collection.name).toLowerCase()}.{" "}
          <Link to="/records/$collection" params={{ collection: collection.name }}>
            Open collection
          </Link>
        </p>
      )}
      {query.data && query.data.count > 50 && (
        <p className="font-body-small text-subtle">
          Showing the first 50 matches. Search to narrow the results.
        </p>
      )}
    </Stack>
  );
}

export type RecordEditorState = {
  dirty: boolean;
  busy: boolean;
  noun: string;
  requestClose: () => void;
};

export function RecordEditor({
  collection,
  existing,
  initial,
  initialValues,
  onSaved,
  onCancel,
  presentation = "schema",
  onStateChange,
  formLayout = "page",
}: {
  collection: Collection;
  existing?: DataRecord | undefined;
  initial?: [string, string] | undefined;
  initialValues?: Record<string, unknown> | undefined;
  onSaved?: ((record: DataRecord) => void | Promise<void>) | undefined;
  onCancel: () => void;
  presentation?: "schema" | "product";
  formLayout?: "page" | "dialog";
  onStateChange?: ((state: RecordEditorState) => void) | undefined;
}) {
  const { confirm, confirmation } = useConfirmation();
  const workspace = useWorkspace();
  const [baseline] = useState(existing);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const columns = useMemo(
    () =>
      collection.columns.filter(
        (column) =>
          !systemColumns.has(column.name) &&
          !isDerivedRecordField(collection.name, column.name) &&
          column.name !== "published_at" &&
          !(
            collection.name === "evidence_versions" &&
            [
              "storage_object_name",
              "storage_object_id",
              "media_type",
              "byte_size",
              "sha256",
            ].includes(column.name)
          ),
      ),
    [collection],
  );
  const [fields, setFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      columns.map((column) => {
        const value = baseline ? baseline[column.name] : initialValues?.[column.name];
        return [
          column.name,
          initial?.[0] === column.name
            ? initial[1]
            : value === null || value === undefined
              ? baseline
                ? ""
                : defaultValue(column)
              : column.type.startsWith("timestamp")
                ? timestampInput(String(value))
                : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value),
        ];
      }),
    ),
  );
  const noun = productRecordNoun(collection.name, fields);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const bypassBlock = useRef(false);
  const inFlight = useRef(false);
  const stateRef = useRef({ dirty, onCancel, onStateChange });
  stateRef.current = { dirty, onCancel, onStateChange };
  const cancel = useCallback(async () => {
    if (inFlight.current) return;
    if (
      !stateRef.current.dirty ||
      (await confirm(discardChanges("Discard your unsaved changes?")))
    ) {
      bypassBlock.current = true;
      stateRef.current.onCancel();
    }
  }, [confirm]);
  useEffect(() => {
    stateRef.current.onStateChange?.({ dirty, busy, noun, requestClose: cancel });
  }, [dirty, busy, noun, cancel]);
  useBlocker({
    shouldBlockFn: async () =>
      inFlight.current ||
      (dirty &&
        !bypassBlock.current &&
        !(await confirm(discardChanges("Discard your unsaved changes?")))),
    enableBeforeUnload: () => (dirty || inFlight.current) && !bypassBlock.current,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const record = await saveRecord(
        workspace,
        collection,
        recordPayload(collection, fields, baseline),
        baseline,
      );
      bypassBlock.current = true;
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      await queryClient.invalidateQueries({
        queryKey: ["record", workspace.tenantId, collection.name, record.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["models", workspace.tenantId, collection.name],
      });
      await queryClient.invalidateQueries({
        queryKey: ["model", workspace.tenantId, collection.name],
      });
      await queryClient.invalidateQueries({
        queryKey: ["reference-options", workspace.tenantId, collection.name],
      });
      inFlight.current = false;
      if (onSaved) {
        await onSaved(record);
        return;
      }
      if (existing) onCancel();
      await navigate({
        to: "/records/$collection/$recordId",
        params: { collection: collection.name, recordId: record.id },
        search: {},
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The record could not be saved.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const contextual = (column: Column) =>
    presentation === "product" &&
    Boolean(
      initialValues?.[column.name] ?? (initial?.[0] === column.name ? initial[1] : undefined),
    ) &&
    Boolean(fields[column.name]) &&
    Boolean(relatedCollection(collection, column.name, workspace.collections));
  const visibleColumns =
    presentation === "product"
      ? [...columns]
          .sort(productFieldOrder)
          .filter(
            (column) =>
              !contextual(column) &&
              !(
                column.name === "state" &&
                fields[column.name] === "draft" &&
                column.choices.includes("published")
              ),
          )
      : columns;
  const mainColumns = visibleColumns.filter(
    (column) => presentation === "schema" || !isAdditionalProductField(column),
  );
  const additionalColumns =
    presentation === "product" ? visibleColumns.filter(isAdditionalProductField) : [];
  const renderField = (column: Column) => {
    const target = relatedCollection(collection, column.name, workspace.collections);
    const value = fields[column.name] ?? "";
    const change = (next: string) => {
      setFields((previous) => ({ ...previous, [column.name]: next }));
      setDirty(true);
    };
    const multiline =
      /description|narrative|rationale|prose|notes|criteria|content|payload/.test(column.name) ||
      column.type.startsWith("json") ||
      column.type.endsWith("[]");
    const numeric = /^(smallint|integer|bigint|numeric|decimal|real|double precision)/.test(
      column.type,
    );
    return (
      <Field key={column.name}>
        <FieldLabel htmlFor={`field-${column.name}`}>
          {labelFor(column.name.replace(/_id$/, ""))}
          {column.required && !column.default ? " *" : ""}
        </FieldLabel>
        {target ? (
          <ReferencePicker
            column={column}
            collection={target}
            value={value}
            onChange={change}
            presentation={presentation}
          />
        ) : column.choices.length ? (
          <Choice
            id={`field-${column.name}`}
            value={value}
            onChange={change}
            choices={column.choices.map((value) => ({ value, label: labelFor(value) }))}
            disabled={
              presentation === "product" &&
              !existing &&
              collection.name === "parties" &&
              column.name === "party_type" &&
              typeof initialValues?.["party_type"] === "string"
            }
            required={presentation === "product" && column.required && !column.default}
          />
        ) : column.type === "boolean" ? (
          <Choice
            id={`field-${column.name}`}
            value={value}
            onChange={change}
            choices={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
        ) : multiline ? (
          <Textarea
            autoFocus={formLayout === "dialog" && mainColumns[0]?.name === column.name}
            id={`field-${column.name}`}
            value={value}
            onChange={(event) => change(event.target.value)}
            required={column.required && !column.default}
            rows={4}
          />
        ) : (
          <Input
            autoFocus={formLayout === "dialog" && mainColumns[0]?.name === column.name}
            id={`field-${column.name}`}
            type={
              column.type === "date"
                ? "date"
                : numeric
                  ? "number"
                  : column.type.startsWith("timestamp")
                    ? "datetime-local"
                    : /email/.test(column.name)
                      ? "email"
                      : /url$/.test(column.name)
                        ? "url"
                        : "text"
            }
            step={numeric ? "any" : undefined}
            value={value}
            onChange={(event) => change(event.target.value)}
            required={column.required && !column.default}
          />
        )}
        {column.description && <FieldDescription>{column.description}</FieldDescription>}
      </Field>
    );
  };
  const actions = (
    <>
      <Button type="button" variant="subtle" disabled={busy} onClick={cancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" isLoading={busy} disabled={busy}>
        {existing ? `Save ${noun}` : `Create ${noun}`}
      </Button>
    </>
  );
  return (
    <>
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        aria-busy={busy}
        className={formLayout === "dialog" ? "flex min-h-0 flex-1 flex-col" : undefined}
      >
        <fieldset
          disabled={busy}
          className={
            formLayout === "dialog" ? "min-h-0 min-w-0 flex-1 overflow-y-auto p-250" : "min-w-0"
          }
        >
          <Stack space="space.250" className="max-w-layout-measure">
            {columns.filter(contextual).map((column) => (
              <Box key={column.name} padding="space.150" backgroundColor="elevation.surface.sunken">
                <p className="font-body-small text-subtle">
                  {labelFor(column.name.replace(/_id$/, ""))}
                </p>
                <ReferenceLink
                  collection={relatedCollection(collection, column.name, workspace.collections)!}
                  id={fields[column.name]!}
                />
              </Box>
            ))}
            {mainColumns.map(renderField)}
            {additionalColumns.length > 0 && (
              <details>
                <summary className="cursor-pointer font-body-small font-medium">
                  Additional details
                </summary>
                <Stack space="space.200" className="pt-200">
                  {additionalColumns.map(renderField)}
                </Stack>
              </details>
            )}
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </Stack>
        </fieldset>
        {formLayout === "dialog" ? (
          <DialogFooter>{actions}</DialogFooter>
        ) : (
          <Inline space="space.150" alignInline="end" className="pt-250">
            {actions}
          </Inline>
        )}
      </form>
      {confirmation}
    </>
  );
}

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteInFlight = useRef(false);
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["record", workspace.tenantId, name, id],
    queryFn: () => getRecord(workspace, collection!, id),
    enabled: !!collection && id !== "new",
    retry: false,
  });
  const navigate = useNavigate();
  useBlocker({
    shouldBlockFn: () => deleteInFlight.current,
    enableBeforeUnload: () => deleteInFlight.current,
  });
  async function remove() {
    if (!collection || !query.data || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteRecord(workspace, collection, query.data);
      await cache.invalidateQueries({ queryKey: ["records"] });
      await cache.invalidateQueries({ queryKey: ["reference-options"] });
      cache.removeQueries({ queryKey: ["record", workspace.tenantId, name, id] });
      deleteInFlight.current = false;
      setConfirmDelete(false);
      await navigate({ to: "/records/$collection", params: { collection: name }, search: {} });
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "The record could not be deleted.");
    } finally {
      deleteInFlight.current = false;
      setDeleting(false);
    }
  }
  if (!collection) return <CollectionNotFound />;
  const creating = id === "new";
  const canEdit =
    workspace.role !== "viewer" &&
    collection.can_update &&
    query.data?.["state"] !== "published" &&
    query.data?.["status"] !== "published" &&
    typeof query.data?.revision === "number" &&
    query.data?.["tenant_id"] !== null;
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
    <Box padding="space.400">
      <Stack space="space.300">
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/schema" />}>Schema inspector</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to="/records/$collection" params={{ collection: name }} />}
                >
                  {labelFor(name)}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {creating
                    ? `Create ${editorNoun}`
                    : query.data
                      ? recordTitle(query.data, collection)
                      : "Record"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>
              {creating
                ? `Create ${editorNoun}`
                : query.data
                  ? recordTitle(query.data, collection)
                  : "Record"}
            </PageHeader.Title>
          </PageHeader.Heading>
          {!creating && !editing && canEdit && (
            <PageHeader.Actions>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(query.data!)}>
                    Edit {productRecordNoun(name, query.data)}
                  </DropdownMenuItem>
                  {collection.can_delete && (
                    <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                      Delete {productRecordNoun(name, query.data)}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </PageHeader.Actions>
          )}
        </PageHeader>
        <AlertDialog
          open={confirmDelete}
          onOpenChange={(open, details) => {
            if (deleteInFlight.current) {
              details.cancel();
              return;
            }
            setConfirmDelete(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {productRecordNoun(name, query.data)}?</AlertDialogTitle>
              <AlertDialogDescription>
                Delete this record permanently? The database blocks deletion if retained records
                still reference it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <Box padding="space.250">
                <p role="alert" className="text-danger">
                  {deleteError}
                </p>
              </Box>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel variant="subtle" disabled={deleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="danger"
                isLoading={deleting}
                disabled={deleting}
                onClick={() => void remove()}
              >
                Delete {productRecordNoun(name, query.data)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            <p>This collection is maintained through its reference import workflow.</p>
          )
        ) : editing ? (
          <RecordEditor
            key={editing.id}
            collection={collection}
            existing={editing}
            onCancel={() => setEditing(null)}
          />
        ) : query.isPending ? (
          <p role="status">Loading record…</p>
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : (
          <>
            {name === "evidence_versions" && (
              <EvidenceFile collection={collection} record={query.data} />
            )}
            <Stack space="space.200">
              {collection.columns
                .filter((column) => !systemColumns.has(column.name))
                .map((column) => (
                  <Box key={column.name} className="max-w-layout-measure">
                    <p className="font-body-small font-medium text-subtle pb-050">
                      {labelFor(column.name.replace(/_id$/, ""))}
                    </p>
                    <Value
                      collection={collection}
                      column={column}
                      value={query.data[column.name]}
                    />
                  </Box>
                ))}
            </Stack>
            {incoming.length > 0 && (
              <Stack space="space.150">
                <h2 className="font-heading-small">Related records</h2>
                <Inline space="space.150" shouldWrap>
                  {incoming.map((relation) => (
                    <Button
                      key={`${relation.collection.name}-${relation.column}`}
                      variant="secondary"
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
                        ? ` (${labelFor(relation.column.replace(/_id$/, ""))})`
                        : ""}
                    </Button>
                  ))}
                </Inline>
              </Stack>
            )}
            <p className="font-body-small text-subtlest">
              Record ID: {query.data.id}
              {query.data["updated_at"]
                ? ` · Last updated ${String(query.data["updated_at"])}`
                : ""}
            </p>
          </>
        )}
      </Stack>
    </Box>
  );
}

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
    <Box
      padding="space.250"
      backgroundColor="elevation.surface.raised"
      className="border border-default rounded-large"
    >
      <Stack space="space.150">
        <TextLink render={<Link to="/records/$collection" params={{ collection: name }} />}>
          {labelFor(name)}
        </TextLink>
        {query.isError ? (
          <ErrorMessage error={query.error} />
        ) : (
          <p className="font-heading-large" role="status">
            {query.data ? query.data.count.toLocaleString() : "Loading…"}
          </p>
        )}
      </Stack>
    </Box>
  );
}
export function WorkspaceHome() {
  return (
    <Box padding="space.400">
      <Stack space="space.300">
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Schema inspector</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
        <Grid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4" gap="space.200">
          {["programs", "systems", "operational_issues", "tasks"].map((name) => (
            <RecordCount key={name} name={name} />
          ))}
        </Grid>
        <Box padding="space.300" backgroundColor="elevation.surface.sunken">
          <Stack space="space.150">
            <h2 className="font-heading-small">Build your assurance record</h2>
            <p>
              Create a program and system, define its boundary, and connect its requirements and
              implementation to the reference controls.
            </p>
            <Inline space="space.150" shouldWrap>
              <Button
                variant="primary"
                render={
                  <Link
                    to="/records/$collection/$recordId"
                    params={{ collection: "programs", recordId: "new" }}
                  />
                }
              >
                Create program
              </Button>
              <Button
                variant="secondary"
                render={
                  <Link to="/records/$collection" params={{ collection: "catalog_revisions" }} />
                }
              >
                Explore reference catalogs
              </Button>
            </Inline>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
