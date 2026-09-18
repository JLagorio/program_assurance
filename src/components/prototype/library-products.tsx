import { discardChanges, useConfirmation } from "@/components/app/confirmation";
import { TextField } from "@/components/app/fields";
import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { elementIdsInOrder, productElementSpecs } from "@/lib/product-items";
import {
  useCopyProductRevision,
  useIncludeAllElements,
  useProductComponentDefinition,
} from "@/lib/product-revisions";
import { labelFor } from "@/lib/records";
import {
  Absent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Id,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
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
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { useId, useMemo, useRef, useState } from "react";
import { LibraryEditor, LibraryLoading, LibrarySelect } from "./library-shared";
import { canAuthorLibrary, downloadLibraryRecords } from "./library-utils";
import { ProductCollection } from "./product-collection";
import { ProductStructure } from "./product-structure";
import { recordDestination, RecordLink, useDisplayedRecords } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { EmptyMessage, MissingRecord } from "./work-common";
import { displayDate } from "./work-format";

export function ProductLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const products = useRows("products");
  const revisions = useRows("product_revisions");
  const configurations = useRows("product_configurations");
  const elements = useRows("product_elements");
  const systems = useRows("systems");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Row<"products"> | null>(null);
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
        c.id("code", {
          header: "ID",
          width: 150,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
        }),
        c.text("name", {
          header: "Product",
          hideable: false,
          priority: 0,
          width: 220,
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
    [selected?.id],
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
  const displayed = useDisplayedRecords(table);
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
        <ProductCollection
          commands={[
            {
              label: "Export recorded JSON",
              disabled: !products.data || !revisions.data || !configurations.data || !elements.data,
              onSelect: () =>
                downloadLibraryRecords("product-library.json", {
                  products: products.data,
                  revisions: revisions.data,
                  configurations: configurations.data,
                  elements: elements.data,
                }),
            },
          ]}
          table={table}
          fill
          onRowClick={(row) => {
            void navigate({ to: "/library/products/$productKey", params: { productKey: row.id } });
          }}
          empty={{
            action: canAuthorLibrary(workspace.role) ? (
              <Button size="small" variant="primary" onClick={() => setCreating(true)}>
                Create product
              </Button>
            ) : undefined,
            illustration: "tree",
            title: "No products",
            description:
              "Create a product, then define its elements and configurations in a version.",
          }}
          searchLabel="Find products"
          filters={
            <>
              <DataTable.Filter table={table} column="status" />
              <DataTable.Filter table={table} column="stateLabel" />
            </>
          }
          action={
            <>
              <>
                {canAuthorLibrary(workspace.role) && (
                  <Button size="small" variant="primary" onClick={() => setCreating(true)}>
                    Create product
                  </Button>
                )}
              </>
            </>
          }
        />
      </LibraryLoading>
      {selected && (
        <RecordSummaryPreview
          model="products"
          fields={[
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
            { key: "stateLabel", label: "Product state" },
            { key: "version", label: "Latest version" },
            { key: "status", label: "Version state" },
            { key: "configurations", label: "Configurations" },
            { key: "elements", label: "Elements" },
            { key: "variants", label: "Variants" },
          ]}
          record={selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
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
  const exportDocument = useProductComponentDefinition();
  const publish = useModelSave("product_revisions");
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
  const publishContent = useRows(
    "product_elements",
    current ? { product_revision_id: current.id } : {},
    { enabled: !!current },
  );
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
  async function exportOscal() {
    setError("");
    try {
      const document = await exportDocument.mutateAsync({ revisionId: current!.id });
      downloadLibraryRecords(
        `${product.data!.code}-v${current!.version_number}-component-definition.json`,
        document,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export this version.");
    }
  }
  async function publishVersion() {
    if (!current || publish.isPending) return;
    setError("");
    try {
      await publish.mutateAsync({
        id: current.id,
        revision: current.revision,
        values: { state: "published" },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish this version.");
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
                  {current?.state === "draft" && (
                    <DropdownMenuItem
                      disabled={
                        publish.isPending ||
                        !publishContent.data?.length ||
                        !configurations.data?.some(
                          (configuration) => configuration.state === "active",
                        )
                      }
                      onClick={() => void publishVersion()}
                    >
                      Publish version
                    </DropdownMenuItem>
                  )}
                  {current?.state === "published" && (
                    <DropdownMenuItem
                      disabled={exportDocument.isPending}
                      onClick={() => void exportOscal()}
                    >
                      Export OSCAL
                    </DropdownMenuItem>
                  )}
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
  const [variantPreview, setVariantPreview] = useState<Row<"systems"> | null>(null);
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
        c.id("code", {
          header: "ID",
          width: 150,
          preview: setVariantPreview,
          active: (row) => row.id === variantPreview?.id,
        }),
        c.text("name", {
          header: "Variant",
          hideable: false,
          priority: 0,
          minWidth: 220,
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
    [variantPreview?.id],
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

  const displayedVariants = useDisplayedRecords(variantsTable);
  return (
    <Stack space="space.200">
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
          {variantPreview && (
            <RecordSummaryPreview
              model="systems"
              fields={[
                { key: "code", label: "Code" },
                { key: "description", label: "Description" },
                { key: "programName", label: "Program" },
                { key: "configurationName", label: "Configuration" },
                { key: "productVersion", label: "Product version" },
                { key: "inherited", label: "Inherited elements" },
                { key: "added", label: "Added elements" },
              ]}
              record={variantPreview}
              rows={displayedVariants}
              onSelect={setVariantPreview}
              onClose={() => setVariantPreview(null)}
            />
          )}
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
              <ProductCollection
                table={variantsTable}
                fill
                onRowClick={(row) => void navigate(recordDestination("systems", row))}
                empty={{
                  illustration: "tree",
                  title: "No variants yet",
                  description: "A program creates a variant from a configuration of this product.",
                }}
                searchLabel="Find variants"
                filters={
                  <>
                    <DataTable.Filter table={variantsTable} column="programName" />
                    <DataTable.Filter table={variantsTable} column="configurationName" />
                  </>
                }
              />
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
            <LibrarySelect
              label="Version"
              value={revision.id}
              options={versions.map((version) => ({
                value: version.id,
                label: `${version.version_number} · ${version.state}`,
              }))}
              onChange={onVersion}
            />
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
  const [configurationPreview, setConfigurationPreview] =
    useState<Row<"product_configurations"> | null>(null);
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
        c.id("code", {
          header: "Code",
          width: 110,
          preview: setConfigurationPreview,
          active: (row) => row.id === configurationPreview?.id,
        }),
        c.text("name", {
          header: "Configuration",
          hideable: false,
          priority: 0,
          minWidth: 220,
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
    [editable, canEditVersion, elementIds, includeAll, revision.id, save, configurationPreview?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Product configurations",
    view: "live-product-configurations-v1",
    resizable: true,
  });
  const displayedConfigurations = useDisplayedRecords(table);
  return (
    <Stack space="space.200">
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <ProductCollection
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
        fill
        searchLabel="Find configurations"
        filters={<DataTable.Filter table={table} column="stateLabel" />}
        action={
          editable && (
            <Button variant="primary" size="small" onClick={() => setCreating(true)}>
              Create configuration
            </Button>
          )
        }
      />
      {configurationPreview && (
        <RecordSummaryPreview
          model="product_configurations"
          readOnly={!editable}
          onEdit={() => setEditing(configurationPreview)}
          fields={[
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
            { key: "stateLabel", label: "State" },
            { key: "elements", label: "Elements" },
            { key: "variants", label: "Variants" },
          ]}
          record={configurationPreview}
          rows={displayedConfigurations}
          onSelect={setConfigurationPreview}
          onClose={() => setConfigurationPreview(null)}
        />
      )}
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
  const formId = useId();
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
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          void close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 560 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Create configuration</DialogTitle>
          <DialogDescription>
            One way {product.name} is built. Which elements are in it is recorded per version.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          noValidate
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset
            disabled={busy || !!createdId}
            aria-busy={busy}
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-none px-200 py-150"
          >
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
        </form>
        <DialogFooter>
          <Button variant="subtle" disabled={busy} onClick={() => void close()}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={busy} disabled={busy} type="submit" form={formId}>
            Create configuration
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}
