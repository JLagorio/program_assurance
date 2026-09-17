import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { RecordLink, recordDestination } from "./record-preview";
import { EmptyMessage, MissingRecord } from "./work-common";
import { displayDate } from "./work-format";
import { canAuthorLibrary, downloadLibraryRecords } from "./library-utils";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useBlocker } from "@tanstack/react-router";
import {
  Id,
  Absent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Section,
  Toolbar,
  Badge,
  Button,
  Checkbox,
  Count,
  DataTable,
  defineColumns,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { useRow, useRows, useModelSave, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { TextField } from "@/components/app/fields";
import { elementIdsInOrder, productElementSpecs } from "@/lib/product-items";
import {
  useCopyProductRevision,
  useIncludeAllElements,
  useProductComponentDefinition,
} from "@/lib/product-revisions";
import { labelFor } from "@/lib/records";
import { LibraryEditor, LibraryLoading, LibrarySelect } from "./library-shared";
import { ProductStructure } from "./product-structure";

export function ProductLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const products = useRows("products");
  const revisions = useRows("product_revisions");
  const configurations = useRows("product_configurations");
  const elements = useRows("product_elements");
  const systems = useRows("systems");
  const [creating, setCreating] = useState(false);
  const rows = useMemo(
    () =>
      (products.data ?? []).map((product) => {
        const versions = (revisions.data ?? []).filter((row) => row.product_id === product.id);
        const latest = [...versions].sort((a, b) => b.version_number - a.version_number)[0];
        const revisionIds = new Set(versions.map((row) => row.id));
        return {
          ...product,
          stateLabel: labelFor(product.state),
          configurations: (configurations.data ?? []).filter(
            (row) => row.product_id === product.id && row.state === "active",
          ).length,
          elements: (elements.data ?? []).filter((row) => row.product_revision_id === latest?.id)
            .length,
          version: latest ? String(latest.version_number) : "No versions",
          status: latest?.state ?? "No versions",
          variants: (systems.data ?? []).filter(
            (row) =>
              row.is_authorization_boundary &&
              row.product_revision_id &&
              revisionIds.has(row.product_revision_id),
          ).length,
        };
      }),
    [products.data, revisions.data, configurations.data, elements.data, systems.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("code", { header: "ID", width: 150 }),
        c.text("name", {
          header: "Product",
          hideable: false,
          cell: (row) => (
            <RecordLink table="products" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.number("configurations", { header: "Configurations", width: 130 }),
        c.number("elements", { header: "Elements", width: 100 }),
        c.text("version", { header: "Version", width: 110 }),
        c.number("variants", { header: "Variants", width: 100 }),
        c.status("status", { header: "State", width: 130, tone: () => "neutral" }),
        c.text("stateLabel", { header: "Product state", width: 130 }),
      ]),
    [],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Product library",
    view: "live-product-library",
    resizable: true,
    reorderable: true,
  });
  return (
    <Stack space="space.200" className="animate-rise">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Products</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <LibraryEditor
          table="products"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({
              to: "/library/products/$productKey",
              params: { productKey: record.id },
            });
          }}
        />
      )}
      <LibraryLoading queries={[products, revisions, configurations, elements, systems]}>
        <DataTable
          responsive
          table={table}
          fill
          onRowClick={(row) => {
            void navigate({ to: "/library/products/$productKey", params: { productKey: row.id } });
          }}
          empty={{
            action: canAuthorLibrary(workspace.role) ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                Create product
              </Button>
            ) : undefined,
            illustration: "tree",
            title: "No products",
            description:
              "Create a product, then define its elements and configurations in a version.",
          }}
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find products"
              filters={
                <>
                  <DataTable.Filter table={table} column="status" />
                  <DataTable.Filter table={table} column="stateLabel" />
                </>
              }
              actions={
                <>
                  <Inline space="space.100">
                    <Button
                      variant="secondary"
                      disabled={
                        !products.data || !revisions.data || !configurations.data || !elements.data
                      }
                      onClick={() =>
                        downloadLibraryRecords("product-library.json", {
                          products: products.data,
                          revisions: revisions.data,
                          configurations: configurations.data,
                          elements: elements.data,
                        })
                      }
                    >
                      Export
                    </Button>
                    {canAuthorLibrary(workspace.role) && (
                      <Button variant="primary" onClick={() => setCreating(true)}>
                        Create product
                      </Button>
                    )}
                  </Inline>
                </>
              }
            >
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Toolbar>
          }
        />
      </LibraryLoading>
    </Stack>
  );
}

export function ProductLibraryRecord({
  id,
  initialVersion,
}: {
  id: string;
  initialVersion?: string;
}) {
  const product = useRow("products", id);
  const revisions = useRows("product_revisions", { product_id: id });
  const configurations = useRows("product_configurations", { product_id: id });
  const createRevision = useModelSave("product_revisions");
  const copyRevision = useCopyProductRevision();
  const workspace = useWorkspace();
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  const [editProduct, setEditProduct] = useState(false);
  const [error, setError] = useState("");
  const versions = [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const current =
    versions.find(
      (revision) =>
        revision.id === selectedVersion || String(revision.version_number) === selectedVersion,
    ) ?? versions[0];
  const editable = canAuthorLibrary(workspace.role);
  const busy = createRevision.isPending || copyRevision.isPending;
  async function newVersion() {
    setError("");
    try {
      if (current) {
        const created = await copyRevision.mutateAsync({ sourceRevisionId: current.id });
        setSelectedVersion(created);
      } else {
        const row = await createRevision.mutateAsync({
          values: { product_id: id, version_number: 1 },
        });
        setSelectedVersion(row.id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a version.");
    }
  }
  if (!product.data)
    return (
      <LibraryLoading queries={[product, revisions, configurations]}>
        <MissingRecord backTo="/library/products" kind="Product" />
      </LibraryLoading>
    );
  return (
    <LibraryLoading queries={[product, revisions, configurations]}>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/library/products" />}>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.data?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>{product.data?.name}</PageHeader.Title>
          </PageHeader.Heading>
          {editable && product.data && (
            <PageHeader.Actions>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button>Actions</Button>} />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditProduct(true)}>
                    Edit product
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={busy} onClick={() => void newVersion()}>
                    Create product version
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PageHeader.Actions>
          )}
        </PageHeader>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {editProduct && product.data && (
          <LibraryEditor
            table="products"
            existing={product.data}
            onClose={() => setEditProduct(false)}
          />
        )}
        {current && (
          <div className="w-layout-rail max-w-full">
            <LibrarySelect
              label="Version"
              value={current.id}
              options={versions.map((revision) => ({
                value: revision.id,
                label: `${revision.version_number} · ${revision.state}`,
              }))}
              onChange={setSelectedVersion}
            />
          </div>
        )}
        {current && product.data ? (
          <ProductRevision
            key={current.id}
            product={product.data}
            revision={current}
            versions={versions}
            configurations={configurations.data ?? []}
            onVersion={setSelectedVersion}
            editable={editable}
          />
        ) : (
          <EmptyMessage
            title="No versions yet"
            description="Create the first version, then add its elements and configurations."
          />
        )}
      </Stack>
    </LibraryLoading>
  );
}

function ProductRevision({
  product,
  revision,
  versions,
  configurations,
  onVersion,
  editable,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  versions: Row<"product_revisions">[];
  configurations: Row<"product_configurations">[];
  onVersion: (id: string) => void;
  editable: boolean;
}) {
  const navigate = useNavigate();
  const elements = useRows("product_elements", { product_revision_id: revision.id });
  const memberships = useRows("product_configuration_elements", {
    product_revision_id: revision.id,
  });
  const definedComponents = useRows("defined_components");
  const componentRevisions = useRows("component_definition_revisions");
  const definitions = useRows("component_definitions");
  const systems = useRows("systems");
  const programs = useRows("programs");
  const publish = useModelSave("product_revisions");
  const exportDocument = useProductComponentDefinition();
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");
  const canEdit = editable && revision.state === "draft";
  const active = configurations.filter((row) => row.state === "active");
  const specs = useMemo(
    () =>
      productElementSpecs(
        {
          elements: elements.data ?? [],
          definedComponents: definedComponents.data ?? [],
          componentRevisions: componentRevisions.data ?? [],
          definitions: definitions.data ?? [],
        },
        revision.id,
      ),
    [elements.data, definedComponents.data, componentRevisions.data, definitions.data, revision.id],
  );
  const revisionIds = new Set(versions.map((row) => row.id));
  const variants = (systems.data ?? []).filter(
    (row) =>
      row.is_authorization_boundary &&
      row.product_revision_id &&
      revisionIds.has(row.product_revision_id),
  );
  const variantRows = useMemo(() => {
    const ids = new Set(versions.map((item) => item.id));
    return (systems.data ?? [])
      .filter(
        (item) =>
          item.is_authorization_boundary &&
          item.product_revision_id &&
          ids.has(item.product_revision_id),
      )
      .map((variant) => {
        const program = programs.data?.find((item) => item.id === variant.program_id);
        const configuration = configurations.find(
          (item) => item.id === variant.product_configuration_id,
        );
        const version = versions.find((item) => item.id === variant.product_revision_id);
        const inside = (systems.data ?? []).filter(
          (item) => item.boundary_system_id === variant.id && !item.is_authorization_boundary,
        );
        const inherited = inside.filter((item) => item.product_element_id).length;
        return {
          ...variant,
          programName: program?.name ?? null,
          configurationName: configuration?.name ?? null,
          productVersion: version?.version_number ?? null,
          inherited,
          added: inside.length - inherited,
        };
      });
  }, [systems.data, programs.data, configurations, versions]);
  const variantColumns = useMemo(
    () =>
      defineColumns<(typeof variantRows)[number]>((c) => [
        c.id("code", { header: "ID", width: 150 }),
        c.text("name", {
          header: "Variant",
          hideable: false,
          cell: (row) => (
            <RecordLink table="systems" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("programName", {
          header: "Program",
          cell: (row) => (
            <TextLink
              render={<Link to="/programs/$programId" params={{ programId: row.program_id }} />}
            >
              {row.programName || <Absent />}
            </TextLink>
          ),
        }),
        c.text("configurationName", { header: "Configuration" }),
        c.number("productVersion", { header: "Version", width: 110 }),
        c.number("inherited", { header: "Inherited elements", width: 150 }),
        c.number("added", { header: "Added elements", width: 150 }),
      ]),
    [],
  );
  const variantsTable = useDataTable({
    data: variantRows,
    columns: variantColumns,
    getRowId: (row) => row.id,
    label: "Product variants",
    view: "product-variants",
    resizable: true,
    reorderable: true,
  });
  async function publishRevision() {
    setError("");
    try {
      await publish.mutateAsync({
        id: revision.id,
        revision: revision.revision,
        values: { state: "published" },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish this version.");
    }
  }
  async function exportOscal() {
    setError("");
    try {
      const document = await exportDocument.mutateAsync({ revisionId: revision.id });
      downloadLibraryRecords(
        `${product.code}-v${revision.version_number}-component-definition.json`,
        document,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export this version.");
    }
  }
  return (
    <Stack space="space.200">
      <Inline space="space.150" alignBlock="center">
        <Badge variant="secondary" tone="neutral">
          {revision.state}
        </Badge>
        {canEdit && (
          <Button
            variant="secondary"
            disabled={publish.isPending || !elements.data?.length || !active.length}
            title={
              !elements.data?.length
                ? "Add at least one element first"
                : !active.length
                  ? "Add at least one configuration first"
                  : undefined
            }
            onClick={() => void publishRevision()}
          >
            Publish version
          </Button>
        )}
        {revision.state === "published" && (
          <Button
            variant="secondary"
            disabled={exportDocument.isPending}
            onClick={() => void exportOscal()}
          >
            Export OSCAL
          </Button>
        )}
      </Inline>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="contents">
        <TabsList variant="line" aria-label="Product sections">
          {["Overview", "Structure", "Configurations", "Variants", "Versions"].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Structure" && elements.data && (
                <Count value={elements.data.length} max={99999} />
              )}
              {name === "Configurations" && <Count value={active.length} max={999} />}
              {name === "Variants" && systems.data && <Count value={variants.length} max={999} />}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Overview" && (
            <Section title="Description">
              <p>{product.description || <Absent />}</p>
            </Section>
          )}
          {tab === "Structure" && (
            <ProductStructure
              product={product}
              revision={revision}
              configurations={configurations}
              editable={editable}
            />
          )}
          {tab === "Configurations" && (
            <ConfigurationsTab
              product={product}
              revision={revision}
              configurations={configurations}
              memberships={memberships.data ?? []}
              elementIds={elementIdsInOrder(specs)}
              variants={variants}
              editable={editable}
            />
          )}
          {tab === "Variants" && (
            <LibraryLoading queries={[systems, programs]}>
              <Section title="Variants">
                <DataTable
                  responsive
                  table={variantsTable}
                  fill
                  onRowClick={(row) => void navigate(recordDestination("systems", row))}
                  empty={{
                    illustration: "tree",
                    title: "No variants yet",
                    description:
                      "A program creates a variant from a configuration of this product.",
                  }}
                  toolbar={
                    <Toolbar
                      search={String(variantsTable.state.globalFilter ?? "")}
                      onSearch={(value) => variantsTable.setGlobalFilter(value)}
                      placeholder="Find variants"
                      filters={
                        <>
                          <DataTable.Filter table={variantsTable} column="programName" />
                          <DataTable.Filter table={variantsTable} column="configurationName" />
                        </>
                      }
                    >
                      <DataTable.Columns table={variantsTable} />
                      <DataTable.Settings table={variantsTable} />
                    </Toolbar>
                  }
                />
              </Section>
            </LibraryLoading>
          )}
          {tab === "Versions" && (
            <Table>
              <thead>
                <tr>
                  <Table.Header>Version</Table.Header>
                  <Table.Header>State</Table.Header>
                  <Table.Header>Published</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <Table.Row key={version.id}>
                    <Table.Cell>{version.version_number}</Table.Cell>
                    <Table.Cell>{version.state}</Table.Cell>
                    <Table.Cell>
                      {version.published_at ? displayDate(version.published_at) : "Not published"}
                    </Table.Cell>
                    <Table.Cell>
                      <Button variant="subtle" size="small" onClick={() => onVersion(version.id)}>
                        Open version
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
      {tab === "Overview" && (
        <Shell.Aside label="Product details">
          <Inspector.Group title="Details">
            <KeyValue label="Code">
              <Id>{product.code}</Id>
            </KeyValue>
            <KeyValue label="Version">{revision.version_number}</KeyValue>
            <KeyValue label="State">{revision.state}</KeyValue>
            <KeyValue label="Published">
              {revision.published_at ? displayDate(revision.published_at) : "Not published"}
            </KeyValue>
            {revision.effective_from && (
              <KeyValue label="Effective from">{displayDate(revision.effective_from)}</KeyValue>
            )}
            {revision.remarks && (
              <KeyValue label="Remarks" wrap>
                {revision.remarks}
              </KeyValue>
            )}
          </Inspector.Group>
          <Inspector.Group title="Contents">
            <KeyValue label="Elements">{elements.data?.length ?? "Loading…"}</KeyValue>
            <KeyValue label="From the library">
              {specs.filter((row) => row.library).length}
            </KeyValue>
            <KeyValue label="Configurations">{active.length}</KeyValue>
            <KeyValue label="Variants">{systems.data ? variants.length : "Loading…"}</KeyValue>
          </Inspector.Group>
          {revision.state === "published" && (
            <Inspector.Group title="OSCAL">
              <p className="font-body-small text-subtle">
                Export writes a component-definition: one component per element and one capability
                per configuration.
              </p>
            </Inspector.Group>
          )}
        </Shell.Aside>
      )}
    </Stack>
  );
}

function ConfigurationsTab({
  product,
  revision,
  configurations,
  memberships,
  elementIds,
  variants,
  editable,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  configurations: Row<"product_configurations">[];
  memberships: Row<"product_configuration_elements">[];
  elementIds: string[];
  variants: Row<"systems">[];
  editable: boolean;
}) {
  const navigate = useNavigate();
  const save = useModelSave("product_configurations");
  const includeAll = useIncludeAllElements();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row<"product_configurations"> | null>(null);
  const [error, setError] = useState("");
  const canEditVersion = editable && revision.state === "draft";
  const rows = useMemo(
    () =>
      configurations.map((configuration) => {
        const members = new Set(
          memberships
            .filter((row) => row.product_configuration_id === configuration.id)
            .map((row) => row.product_element_id),
        );
        return {
          ...configuration,
          stateLabel: labelFor(configuration.state),
          elements: members.size,
          missing: elementIds.filter((id) => !members.has(id)),
          variants: variants.filter((row) => row.product_configuration_id === configuration.id)
            .length,
        };
      }),
    [configurations, memberships, elementIds, variants],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("code", { header: "Code", width: 110 }),
        c.text("name", {
          header: "Configuration",
          hideable: false,
          cell: (row) => (
            <RecordLink table="product_configurations" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("description", { header: "Description", wrap: true }),
        c.number("elements", { header: "Elements", width: 100 }),
        c.number("variants", { header: "Variants", width: 100 }),
        c.status("stateLabel", { header: "State", width: 120, tone: () => "neutral" }),
        ...(editable
          ? [
              c.actions((row) => [
                { label: "Edit configuration", onSelect: () => setEditing(row) },
                ...(canEditVersion && row.missing.length
                  ? [
                      {
                        label: `Include every element (${row.missing.length} missing)`,
                        onSelect: () =>
                          void includeAll
                            .mutateAsync({
                              revisionId: revision.id,
                              configurationId: row.id,
                              elementIds: elementIds.filter((id) => row.missing.includes(id)),
                            })
                            .catch((cause: unknown) =>
                              setError(
                                cause instanceof Error ? cause.message : "Could not update.",
                              ),
                            ),
                      },
                    ]
                  : []),
                {
                  label: row.state === "active" ? "Retire" : "Reactivate",
                  onSelect: () =>
                    void save
                      .mutateAsync({
                        id: row.id,
                        revision: row.revision,
                        values: { state: row.state === "active" ? "retired" : "active" },
                      })
                      .catch((cause: unknown) =>
                        setError(cause instanceof Error ? cause.message : "Could not update."),
                      ),
                },
              ]),
            ]
          : []),
      ]),
    [editable, canEditVersion, elementIds, includeAll, revision.id, save],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Product configurations",
    view: "live-product-configurations-v1",
    resizable: true,
  });
  return (
    <Stack space="space.200">
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <DataTable
        responsive
        onRowClick={(row) => void navigate(recordDestination("product_configurations", row))}
        table={table}
        empty={{
          illustration: "records",
          title: "No configurations",
          description:
            "A configuration is one way this product is built; a program starts from one.",
          action: editable ? (
            <Button variant="primary" size="small" onClick={() => setCreating(true)}>
              Create configuration
            </Button>
          ) : null,
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Find configurations"
            filters={<DataTable.Filter table={table} column="stateLabel" />}
            actions={
              editable && (
                <Button variant="primary" size="small" onClick={() => setCreating(true)}>
                  Create configuration
                </Button>
              )
            }
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
      {creating && (
        <NewConfigurationDialog
          product={product}
          revision={revision}
          elementIds={canEditVersion ? elementIds : []}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <LibraryEditor
          table="product_configurations"
          existing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Stack>
  );
}

/** A configuration with, in a draft version, every current element included by default. */
function NewConfigurationDialog({
  product,
  revision,
  elementIds,
  onClose,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  elementIds: string[];
  onClose: () => void;
}) {
  const { confirm, confirmation } = useConfirmation();
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
  const completedId = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const save = useModelSave("product_configurations");
  const includeAll = useIncludeAllElements();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [includeEverything, setIncludeEverything] = useState(true);
  const [error, setError] = useState("");
  const busy = saving || save.isPending || includeAll.isPending;
  const dirty = !!(code || name || description || !includeEverything);
  useBlocker({
    shouldBlockFn: async () =>
      !bypassClose.current &&
      (inFlight.current ||
        (dirty &&
          !(await confirm(discardChanges("Your configuration changes have not been saved."))))),
    enableBeforeUnload: () => !bypassClose.current && (dirty || inFlight.current),
  });
  async function close() {
    if (busy || inFlight.current) return;
    if (
      (code || name || description || !includeEverything) &&
      !(await confirm(discardChanges("Your unsaved configuration details will be discarded.")))
    )
      return;
    bypassClose.current = true;
    onClose();
  }
  async function submit() {
    if (busy || inFlight.current) return;
    if (!code.trim() || !name.trim()) {
      setError("Enter a code and a name.");
      return;
    }
    setError("");
    inFlight.current = true;
    setSaving(true);
    try {
      const created = createdId
        ? { id: createdId }
        : await save.mutateAsync({
            values: {
              product_id: product.id,
              code: code.trim(),
              name: name.trim(),
              description: description.trim() || null,
            },
          });
      completedId.current = created.id;
      setCreatedId(created.id);
      if (includeEverything && elementIds.length)
        await includeAll.mutateAsync({
          revisionId: revision.id,
          configurationId: created.id,
          elementIds,
        });
      bypassClose.current = true;
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the configuration.";
      setError(
        completedId.current
          ? `${message} The configuration is saved. Retry to finish linking its elements.`
          : message,
      );
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void close();
      }}
    >
      <DialogContent style={{ maxWidth: 560 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Create configuration</DialogTitle>
          <DialogDescription>
            One way {product.name} is built. Which elements are in it is recorded per version.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={busy || !!createdId}>
          <Stack space="space.150">
            <TextField label="Code" value={code} onChange={setCode} required autoFocus />
            <TextField label="Name" value={name} onChange={setName} required />
            <TextField
              label="Description"
              value={description}
              onChange={setDescription}
              multiline
            />
            {elementIds.length ? (
              <label className="flex items-center gap-075 font-body-small">
                <Checkbox
                  checked={includeEverything}
                  onCheckedChange={(checked) => setIncludeEverything(checked === true)}
                />
                Include every element in this version ({elementIds.length})
              </label>
            ) : null}
            {error && (
              <p role="alert" className="font-body-small text-danger">
                {error}
              </p>
            )}
          </Stack>
        </fieldset>
        <DialogFooter>
          <Button variant="subtle" disabled={busy} onClick={() => void close()}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={busy} disabled={busy} onClick={() => void submit()}>
            Create configuration
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}
