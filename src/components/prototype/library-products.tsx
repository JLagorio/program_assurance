import { useConfirmation } from "@/components/app/confirmation";
import { Page } from "@/components/app/shell";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { idSet, useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { elementIdsInOrder, productElementSpecs, useElementLibrary } from "@/lib/product-items";
import {
  useCopyProductRevision,
  useIncludeAllElements,
  useProductComponentDefinition,
} from "@/lib/product-revisions";
import { recordLifecycleStates, revisionStates, statusLabel } from "@/lib/status";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Count,
  DataTable,
  DateTime,
  defineColumns,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  downloadText,
  DropdownMenuItem,
  ErrorSummary,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  Id,
  Inspector,
  KeyValue,
  PageHeader,
  Prose,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  toast,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Plus } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { LibrarySelect, QueryValue, VersionHistory } from "./library-shared";
import { canAuthorLibrary, useVersionFocus, type VersionChoice } from "./library-utils";
import { ProductCollection } from "./product-collection";
import { ProductRecordDialog } from "./product-record-dialog";
import { ProductStructure } from "./product-structure";
import { RetainedTabPanels } from "./program-shared";
import { recordDestination, RecordLink, useDisplayedRecords, useEndOnHide } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RecordTrail, TrailLink } from "./record-trail";
import { EmptyMessage, MissingRecord, QueryState, RecordActions } from "./work-common";

const messageOf = (cause: unknown, fallback = "The request failed.") =>
  cause instanceof Error ? cause.message : fallback;

/** Writes a JSON document as a download, through the kit's download helper. */
function downloadJson(filename: string, value: unknown) {
  downloadText(JSON.stringify(value, null, 2), filename, { type: "application/json" });
}

type ProductLine = Row<"products"> & {
  configurations: number;
  elements: number;
  /** The latest version's number, none before the first version. */
  version: number | null;
  /** The latest version's state. */
  versionState: string | null;
  variants: number;
};

export function ProductLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const products = useRows("products");
  const revisions = useRows("product_revisions");
  const configurations = useRows("product_configurations");
  // The elements whole, since Export writes them; of the systems, only the variants' versions.
  const elements = useRows("product_elements");
  const systems = useRows(
    "systems",
    { is_authorization_boundary: true },
    { columns: ["id", "product_revision_id", "is_authorization_boundary"] },
  );
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ProductLine | null>(null);
  const rows = useMemo(
    () =>
      (products.data ?? []).map((product): ProductLine => {
        const versions = (revisions.data ?? []).filter((row) => row.product_id === product.id);
        const latest = [...versions].sort((a, b) => b.version_number - a.version_number)[0];
        const revisionIds = new Set(versions.map((row) => row.id));
        return {
          ...product,
          configurations: (configurations.data ?? []).filter(
            (row) => row.product_id === product.id && row.state === "active",
          ).length,
          elements: (elements.data ?? []).filter((row) => row.product_revision_id === latest?.id)
            .length,
          version: latest?.version_number ?? null,
          versionState: latest?.state ?? null,
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
      defineColumns<ProductLine>((c) => [
        c.id("code", {
          header: "ID",
          width: 110,
          priority: 1,
          pin: "start",
        }),
        c.text("name", {
          header: "Product",
          hideable: false,
          priority: 0,
          minWidth: 180,
          cell: (row) => (
            <RecordLink table="products" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.number("configurations", { header: "Configurations", width: 150 }),
        c.number("elements", { header: "Elements", width: 110 }),
        c.number("version", { header: "Latest version", width: 140 }),
        c.status("versionState", {
          header: "Version state",
          width: 140,
          statuses: revisionStates,
        }),
        c.number("variants", { header: "Variants", width: 110 }),
        c.status("state", { header: "Status", width: 110, statuses: recordLifecycleStates }),
      ]),
    [],
  );
  const table = useDataTable({
    preview: useMemo(
      () => ({ onPreview: setSelected, activeId: selected?.id ?? null }),
      [selected?.id],
    ),
    data: rows,
    columns,
    getRowId: (row) => row.id,
    // Two products may share a name, and a narrow frame folds the ID: name the row by both.
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Product library",
    view: "live-product-library",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const canCreate = canAuthorLibrary(workspace.role);
  const createButton = (size: "small" | "medium") =>
    canCreate ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
        Create product
      </Button>
    ) : undefined;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Products</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <ProductRecordDialog
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
      <ProductCollection
        commands={[
          {
            label: "Export recorded JSON",
            disabled: !products.data || !revisions.data || !configurations.data || !elements.data,
            onSelect: () =>
              downloadJson("product-library.json", {
                products: products.data,
                revisions: revisions.data,
                configurations: configurations.data,
                elements: elements.data,
              }),
          },
        ]}
        table={table}
        queries={[products, revisions, configurations, elements, systems]}
        fill
        onRowClick={(row) => {
          void navigate({ to: "/library/products/$productKey", params: { productKey: row.id } });
        }}
        empty={{
          action: createButton("medium"),
          illustration: "tree",
          title: "No products",
          description:
            "Create a product, then define its elements and configurations in a version.",
        }}
        searchLabel="Find products"
        filters={
          <>
            <DataTable.Filter table={table} column="versionState" />
            <DataTable.Filter table={table} column="state" />
          </>
        }
        action={createButton("small")}
      />
      {selected && (
        <RecordSummaryPreview
          model="products"
          fields={[
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
            {
              key: "state",
              label: "Status",
              render: (row) => <StatusBadge statuses={recordLifecycleStates} value={row.state} />,
            },
            {
              key: "version",
              label: "Latest version",
              render: (row) => row.version ?? <Absent label="No versions" />,
            },
            {
              key: "versionState",
              label: "Version state",
              render: (row) => (
                <StatusBadge
                  statuses={revisionStates}
                  value={row.versionState}
                  absentLabel="No versions"
                />
              ),
            },
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
    </Page>
  );
}

export function ProductLibraryRecord({
  id,
  initialVersion,
  tab: routeTab,
  onTabChange,
}: {
  id: string;
  initialVersion?: string;
  /** The open tab, when the route keeps it in the address; otherwise the record keeps its own. */
  tab?: ProductTab | undefined;
  onTabChange?: ((tab: ProductTab) => void) | undefined;
}) {
  const navigate = useNavigate();
  // Above the version, so choosing another version keeps the reader on the tab they are reading.
  // Where the route keeps the tab, the address owns it, so Back to an address with no tab shows
  // Overview; otherwise the record keeps its own.
  const [ownTab, setOwnTab] = useState<ProductTab>("Overview");
  const tab = onTabChange ? (routeTab ?? "Overview") : ownTab;
  function changeTab(next: ProductTab) {
    if (onTabChange) onTabChange(next);
    else setOwnTab(next);
  }
  const product = useRow("products", id);
  const revisions = useRows("product_revisions", { product_id: id });
  const configurations = useRows("product_configurations", { product_id: id });
  const exportDocument = useProductComponentDefinition();
  const publish = useModelSave("product_revisions");
  const createRevision = useModelSave("product_revisions");
  const copyRevision = useCopyProductRevision();
  const workspace = useWorkspace();
  const { confirm, confirmation } = useConfirmation();
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  // Which control chose the version, so the new version's page gives focus to its twin.
  const versionChoice = useRef<VersionChoice | null>(null);
  const [editProduct, setEditProduct] = useState(false);
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
  function selectVersion(versionId: string) {
    setSelectedVersion(versionId);
    // The version is part of the address, so a reload, Back or a shared link keeps it.
    void navigate({
      to: "/library/products/$productKey",
      params: { productKey: id },
      search: (previous) => ({ ...previous, version: versionId }),
      replace: true,
    });
  }
  async function newVersion() {
    if (busy) return;
    try {
      if (current) {
        const created = await copyRevision.mutateAsync({ sourceRevisionId: current.id });
        selectVersion(created);
        toast.add({
          type: "success",
          title: "Draft version created",
          description: `A copy of version ${current.version_number}, ready to change.`,
        });
      } else {
        const row = await createRevision.mutateAsync({
          values: { product_id: id, version_number: 1 },
        });
        selectVersion(row.id);
        toast.add({
          type: "success",
          title: "Version 1 created",
          description: "Add its elements and configurations, then publish it.",
        });
      }
    } catch (cause) {
      toast.add({
        type: "error",
        title: "The version was not created",
        description: messageOf(cause),
      });
    }
  }
  async function exportOscal() {
    if (!current || !product.data) return;
    try {
      const document = await exportDocument.mutateAsync({ revisionId: current.id });
      downloadJson(
        `${product.data.code}-v${current.version_number}-component-definition.json`,
        document,
      );
    } catch (cause) {
      toast.add({
        type: "error",
        title: "The version was not exported",
        description: messageOf(cause),
      });
    }
  }
  async function publishVersion() {
    if (!current || !product.data) return;
    const version = current;
    const published = await confirm({
      title: `Publish version ${version.version_number}?`,
      description:
        "A published version cannot be changed or deleted. Programs can then create variants from its configurations.",
      confirmLabel: "Publish version",
      variant: "primary",
      failureTitle: "The version was not published",
      action: () =>
        publish.mutateAsync({
          id: version.id,
          revision: version.revision,
          values: { state: "published" },
        }),
    });
    if (published)
      toast.add({
        type: "success",
        title: `Version ${version.version_number} published`,
        description: `Programs can now create ${product.data.name} variants from it.`,
      });
  }
  // Why Publish cannot run yet, said on the menu item.
  const publishReason = !publishContent.data
    ? publishContent.isError
      ? "This version's elements could not be loaded."
      : "Loading this version's elements."
    : !publishContent.data.length
      ? "Add an element to this version before publishing it."
      : !configurations.data
        ? "Loading the configurations."
        : !configurations.data.some((configuration) => configuration.state === "active")
          ? "Create an active configuration before publishing this version."
          : undefined;
  if (!product.data)
    return (
      <QueryState queries={[product]}>
        <MissingRecord backTo="/library/products" kind="Product" />
      </QueryState>
    );
  return (
    <Page>
      <PageHeader>
        <RecordTrail current={product.data.name}>
          <TrailLink to="/library/products">Products</TrailLink>
        </RecordTrail>
        <PageHeader.Heading>
          <PageHeader.Title>{product.data.name}</PageHeader.Title>
        </PageHeader.Heading>
        <PageHeader.Actions>
          {/* Every library record's one menu: a viewer keeps Inspect record alone. */}
          <RecordActions
            table="products"
            id={product.data.id}
            editLabel="Edit product"
            {...(editable ? { onEdit: () => setEditProduct(true) } : {})}
          >
            {editable && (
              <>
                <DropdownMenuItem
                  disabledReason={
                    !revisions.data
                      ? "Loading the versions."
                      : busy
                        ? "A version is being created."
                        : undefined
                  }
                  onClick={() => void newVersion()}
                >
                  Create product version
                </DropdownMenuItem>
                {current?.state === "draft" && (
                  <DropdownMenuItem
                    disabledReason={publishReason}
                    onClick={() => void publishVersion()}
                  >
                    Publish version
                  </DropdownMenuItem>
                )}
                {current?.state === "published" && (
                  <DropdownMenuItem
                    disabledReason={
                      exportDocument.isPending ? "The export is being prepared." : undefined
                    }
                    onClick={() => void exportOscal()}
                  >
                    Export OSCAL
                  </DropdownMenuItem>
                )}
              </>
            )}
          </RecordActions>
        </PageHeader.Actions>
      </PageHeader>
      {editProduct && (
        <ProductRecordDialog
          table="products"
          existing={product.data}
          onClose={() => setEditProduct(false)}
        />
      )}
      <QueryState queries={[revisions, configurations]} retryLabel="Retry loading versions">
        {current ? (
          <ProductRevision
            key={current.id}
            product={product.data}
            revision={current}
            versions={versions}
            configurations={configurations.data ?? []}
            onVersion={selectVersion}
            versionChoice={versionChoice}
            editable={editable}
            tab={tab}
            onTab={changeTab}
          />
        ) : (
          <EmptyMessage
            illustration="tree"
            title="No versions yet"
            description={
              editable
                ? "Create the first version, then add its elements and configurations."
                : "Nobody has created a version of this product yet."
            }
            action={
              editable ? (
                <Button
                  variant="primary"
                  iconBefore={<Plus />}
                  isLoading={busy}
                  onClick={() => void newVersion()}
                >
                  Create product version
                </Button>
              ) : undefined
            }
          />
        )}
      </QueryState>
      {confirmation}
    </Page>
  );
}

const productTabs = ["Overview", "Structure", "Configurations", "Variants", "Versions"] as const;
export type ProductTab = (typeof productTabs)[number];

function ProductRevision({
  product,
  revision,
  versions,
  configurations,
  onVersion,
  versionChoice,
  editable,
  tab,
  onTab,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  versions: Row<"product_revisions">[];
  configurations: Row<"product_configurations">[];
  onVersion: (id: string) => void;
  /** Where the last version choice came from, which this page's focus reads once it is drawn. */
  versionChoice: RefObject<VersionChoice | null>;
  editable: boolean;
  tab: ProductTab;
  onTab: (tab: ProductTab) => void;
}) {
  const navigate = useNavigate();
  // Choosing a version keeps the tab, so focus goes to the twin of the control that chose it: the
  // rail's select on Overview, the history's mark on Versions.
  const versionFocus = useVersionFocus(versionChoice);
  const { formatNumber } = useLedgerLocale();
  const elements = useRows("product_elements", { product_revision_id: revision.id });
  const memberships = useRows("product_configuration_elements", {
    product_revision_id: revision.id,
  });
  // Only the library records these elements pin.
  const { definedComponents, componentRevisions, definitions } = useElementLibrary(elements.data);
  // The variants: the systems made from this product's versions, what sits inside them and their
  // programs' names, never every system and program in the workspace.
  const versionIds = useMemo(() => idSet(versions.map((row) => row.id)), [versions]);
  const systems = useRows("systems", { product_revision_id: versionIds });
  const variantIds = useMemo(
    () => idSet(systems.data?.filter((row) => row.is_authorization_boundary).map((row) => row.id)),
    [systems.data],
  );
  const insideVariants = useRows(
    "systems",
    { boundary_system_id: variantIds },
    {
      columns: ["id", "boundary_system_id", "is_authorization_boundary", "product_element_id"],
      enabled: systems.isSuccess,
    },
  );
  const programs = useRows(
    "programs",
    { id: idSet(systems.data?.map((row) => row.program_id)) },
    { columns: ["id", "name"], enabled: systems.isSuccess },
  );
  const [variantPreview, setVariantPreview] = useState<VariantLine | null>(null);
  // A preview belongs to the tab it was opened from: choosing another tab ends it.
  const [previewTab, setPreviewTab] = useState(tab);
  if (previewTab !== tab) {
    setPreviewTab(tab);
    setVariantPreview(null);
  }
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
  const variantRows = useMemo((): VariantLine[] => {
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
        const inside = (insideVariants.data ?? []).filter(
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
  }, [systems.data, insideVariants.data, programs.data, configurations, versions]);
  const variantColumns = useMemo(
    () =>
      defineColumns<VariantLine>((c) => [
        c.id("code", {
          header: "ID",
          width: 150,
          priority: 1,
          pin: "start",
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
          cell: (row) =>
            row.programName ? (
              <TextLink
                render={<Link to="/programs/$programId" params={{ programId: row.program_id }} />}
              >
                {row.programName}
              </TextLink>
            ) : (
              <Absent label="Not available" />
            ),
        }),
        c.text("configurationName", { header: "Configuration" }),
        c.number("productVersion", { header: "Version", width: 110 }),
        c.number("inherited", { header: "Inherited elements", width: 160 }),
        c.number("added", { header: "Added elements", width: 150 }),
      ]),
    [],
  );
  const variantsTable = useDataTable({
    preview: useMemo(
      () => ({ onPreview: setVariantPreview, activeId: variantPreview?.id ?? null }),
      [variantPreview?.id],
    ),
    data: variantRows,
    columns: variantColumns,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: "Product variants",
    view: "product-variants",
    resizable: true,
    reorderable: true,
  });
  const displayedVariants = useDisplayedRecords(variantsTable);
  const counts: Partial<Record<(typeof productTabs)[number], number>> = {
    ...(elements.data ? { Structure: elements.data.length } : {}),
    Configurations: active.length,
    ...(systems.data ? { Variants: variants.length } : {}),
  };
  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = productTabs.find((name) => name === value);
          if (next) onTab(next);
        }}
      >
        <TabsList variant="line" aria-label="Product sections">
          {productTabs.map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {counts[name] !== undefined && <Count value={counts[name]} max={9999} />}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Each tab keeps its panel once drawn, so a register keeps its rows, question and place. */}
        <RetainedTabPanels tabs={productTabs} value={tab} space="space.200">
          {(name) => {
            switch (name) {
              case "Overview":
                return (
                  <>
                    {/* The version's Details, first on Overview: the rail beside it, or on a
                        phone a closed disclosure above it whose row says the state. Kept to
                        Overview, since the panel stays mounted while another tab shows. */}
                    {tab === "Overview" && (
                      <Shell.Aside
                        label="Product details"
                        summary={<StatusBadge statuses={revisionStates} value={revision.state} />}
                      >
                        <Inspector.Group title="Details">
                          <Stack space="space.100">
                            <KeyValue.Group>
                              <KeyValue label="Code">
                                <Id>{product.code}</Id>
                              </KeyValue>
                              <KeyValue label="Version">
                                <LibrarySelect
                                  inline
                                  label="Version"
                                  value={revision.id}
                                  options={versions.map((version) => ({
                                    value: version.id,
                                    label: `${version.version_number} · ${statusLabel(revisionStates, version.state)}`,
                                  }))}
                                  triggerRef={versionFocus.select}
                                  onChange={(id) => {
                                    versionChoice.current = "select";
                                    onVersion(id);
                                  }}
                                />
                              </KeyValue>
                              <KeyValue label="State">
                                <StatusBadge statuses={revisionStates} value={revision.state} />
                              </KeyValue>
                              <KeyValue label="Published">
                                <DateTime
                                  value={revision.published_at}
                                  format="date"
                                  absentLabel="Not published"
                                />
                              </KeyValue>
                              {revision.effective_from && (
                                <KeyValue label="Effective from">
                                  <DateTime value={revision.effective_from} format="date" />
                                </KeyValue>
                              )}
                              {revision.remarks && (
                                <KeyValue label="Remarks" wrap>
                                  {revision.remarks}
                                </KeyValue>
                              )}
                            </KeyValue.Group>
                          </Stack>
                        </Inspector.Group>
                        <Inspector.Group title="Contents">
                          <KeyValue.Group>
                            <KeyValue label="Elements">
                              <QueryValue queries={[elements]}>
                                {() => formatNumber(elements.data?.length ?? 0)}
                              </QueryValue>
                            </KeyValue>
                            <KeyValue label="From the library">
                              <QueryValue
                                queries={[
                                  elements,
                                  definedComponents,
                                  componentRevisions,
                                  definitions,
                                ]}
                              >
                                {() => formatNumber(specs.filter((row) => row.library).length)}
                              </QueryValue>
                            </KeyValue>
                            <KeyValue label="Configurations">
                              {formatNumber(active.length)}
                            </KeyValue>
                            <KeyValue label="Variants">
                              <QueryValue queries={[systems]}>
                                {() => formatNumber(variants.length)}
                              </QueryValue>
                            </KeyValue>
                          </KeyValue.Group>
                        </Inspector.Group>
                        {revision.state === "published" && (
                          <Inspector.Group title="OSCAL">
                            <Text as="p" size="small" color="color.text.subtle">
                              Export writes a component-definition: one component per element and
                              one capability per configuration.
                            </Text>
                          </Inspector.Group>
                        )}
                      </Shell.Aside>
                    )}
                    <Prose label="Description" className="max-w-layout-measure">
                      {product.description || <Absent label="No description" />}
                    </Prose>
                  </>
                );
              case "Structure":
                return (
                  <ProductStructure
                    product={product}
                    revision={revision}
                    configurations={configurations}
                    editable={editable}
                  />
                );
              case "Configurations":
                return (
                  <ConfigurationsTab
                    product={product}
                    revision={revision}
                    configurations={configurations}
                    memberships={memberships.data ?? []}
                    elementIds={elementIdsInOrder(specs)}
                    variants={variants}
                    editable={editable}
                  />
                );
              case "Variants":
                return (
                  <ProductCollection
                    table={variantsTable}
                    queries={[systems, insideVariants, programs]}
                    fill
                    onRowClick={(row) => void navigate(recordDestination("systems", row))}
                    empty={{
                      illustration: "tree",
                      title: "No variants yet",
                      description:
                        "A program creates a variant from a configuration of this product.",
                    }}
                    searchLabel="Find variants"
                    filters={
                      <>
                        <DataTable.Filter table={variantsTable} column="programName" />
                        <DataTable.Filter table={variantsTable} column="configurationName" />
                      </>
                    }
                  />
                );
              case "Versions":
                return (
                  <VersionHistory
                    label="Versions of this product"
                    versions={versions}
                    shownId={revision.id}
                    shownRef={versionFocus.shown}
                    onVersion={(id) => {
                      versionChoice.current = "history";
                      onVersion(id);
                    }}
                  />
                );
            }
          }}
        </RetainedTabPanels>
      </Tabs>
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
    </>
  );
}

type VariantLine = Row<"systems"> & {
  programName: string | null;
  configurationName: string | null;
  productVersion: number | null;
  inherited: number;
  added: number;
};

type ConfigurationLine = Row<"product_configurations"> & {
  elements: number;
  missing: string[];
  variants: number;
};

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
  const { formatPlural } = useLedgerLocale();
  const [configurationPreview, setConfigurationPreview] = useState<ConfigurationLine | null>(null);
  // A preview belongs to its tab: it ends when the tab hides this collection.
  useEndOnHide(() => setConfigurationPreview(null));
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row<"product_configurations"> | null>(null);
  const canEditVersion = editable && revision.state === "draft";
  const rows = useMemo(
    () =>
      configurations.map((configuration): ConfigurationLine => {
        const members = new Set(
          memberships
            .filter((row) => row.product_configuration_id === configuration.id)
            .map((row) => row.product_element_id),
        );
        return {
          ...configuration,
          elements: members.size,
          missing: elementIds.filter((id) => !members.has(id)),
          variants: variants.filter((row) => row.product_configuration_id === configuration.id)
            .length,
        };
      }),
    [configurations, memberships, elementIds, variants],
  );
  const includeMutate = includeAll.mutateAsync;
  const saveMutate = save.mutateAsync;
  const columns = useMemo(
    () =>
      defineColumns<ConfigurationLine>((c) => [
        c.id("code", {
          header: "Code",
          width: 110,
          priority: 1,
          pin: "start",
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
        c.number("elements", { header: "Elements", width: 120 }),
        c.number("variants", { header: "Variants", width: 120 }),
        c.status("state", { header: "Status", width: 120, statuses: recordLifecycleStates }),
        ...(editable
          ? [
              c.actions((row) => [
                { label: "Edit configuration", onSelect: () => setEditing(row) },
                ...(canEditVersion && row.missing.length
                  ? [
                      {
                        label: `Include every element (${row.missing.length} missing)`,
                        onSelect: () =>
                          void includeMutate({
                            revisionId: revision.id,
                            configurationId: row.id,
                            elementIds: elementIds.filter((id) => row.missing.includes(id)),
                          }).then(
                            () =>
                              toast.add({
                                type: "success",
                                title: `Every element is in ${row.name}`,
                                description: `${formatPlural(row.missing.length, { one: "{count} element was", other: "{count} elements were" })} added.`,
                              }),
                            (cause: unknown) =>
                              toast.add({
                                type: "error",
                                title: `The elements were not added to ${row.name}`,
                                description: messageOf(cause),
                              }),
                          ),
                      },
                    ]
                  : []),
                {
                  label:
                    row.state === "active" ? "Retire configuration" : "Reactivate configuration",
                  onSelect: () =>
                    void saveMutate({
                      id: row.id,
                      revision: row.revision,
                      values: { state: row.state === "active" ? "retired" : "active" },
                    }).then(
                      () =>
                        toast.add({
                          type: "success",
                          title: `${row.name} ${row.state === "active" ? "retired" : "reactivated"}`,
                        }),
                      (cause: unknown) =>
                        toast.add({
                          type: "error",
                          title: `${row.name} was not ${row.state === "active" ? "retired" : "reactivated"}`,
                          description: messageOf(cause),
                        }),
                    ),
                },
              ]),
            ]
          : []),
      ]),
    [editable, canEditVersion, elementIds, includeMutate, saveMutate, revision.id, formatPlural],
  );
  const table = useDataTable({
    preview: useMemo(
      () => ({ onPreview: setConfigurationPreview, activeId: configurationPreview?.id ?? null }),
      [configurationPreview?.id],
    ),
    data: rows,
    columns,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: "Product configurations",
    view: "live-product-configurations-v1",
    resizable: true,
  });
  const displayedConfigurations = useDisplayedRecords(table);
  const createButton = (size: "small" | "medium") =>
    editable ? (
      <Button variant="primary" size={size} iconBefore={<Plus />} onClick={() => setCreating(true)}>
        Create configuration
      </Button>
    ) : undefined;
  return (
    <>
      <ProductCollection
        onRowClick={(row) => void navigate(recordDestination("product_configurations", row))}
        table={table}
        empty={{
          illustration: "records",
          title: "No configurations",
          description:
            "A configuration is one way this product is built; a program starts from one.",
          action: createButton("medium"),
        }}
        fill
        searchLabel="Find configurations"
        filters={<DataTable.Filter table={table} column="state" />}
        action={createButton("small")}
      />
      {configurationPreview && (
        <RecordSummaryPreview
          model="product_configurations"
          readOnly={!editable}
          onEdit={() => setEditing(configurationPreview)}
          fields={[
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
            {
              key: "state",
              label: "Status",
              render: (row) => <StatusBadge statuses={recordLifecycleStates} value={row.state} />,
            },
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
        <ProductRecordDialog
          table="product_configurations"
          existing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

const configurationFields = ["code", "name", "description"] as const;
type ConfigurationField = (typeof configurationFields)[number];

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
  const formId = useId();
  const [open, setOpen] = useState(true);
  const save = useModelSave("product_configurations");
  const includeAll = useIncludeAllElements();
  const { formatPlural } = useLedgerLocale();
  const feedback = useFormFeedback<ConfigurationField>();
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [includeEverything, setIncludeEverything] = useState(true);
  // Set once the configuration is saved, so a retry only finishes including its elements.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  const guard = useDraftGuard({
    dirty: !createdId && !!(code || name || description || !includeEverything),
    onClose: () => setOpen(false),
    description: "The configuration details you entered will be lost.",
  });
  const issues: FormIssue<ConfigurationField>[] = [
    ...(code.trim() ? [] : [{ field: "code" as const, message: "Enter a code." }]),
    ...(name.trim() ? [] : [{ field: "name" as const, message: "Enter a name." }]),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const elementCount = formatPlural(elementIds.length, {
    one: "{count} element",
    other: "{count} elements",
  });
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!createdId && !feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    let configurationId = createdId;
    try {
      if (!configurationId) {
        const created = await save.mutateAsync({
          values: {
            product_id: product.id,
            code: code.trim(),
            name: name.trim(),
            description: description.trim() || null,
          },
        });
        configurationId = created.id;
        setCreatedId(created.id);
      }
      const including = includeEverything && elementIds.length > 0;
      if (including)
        await includeAll.mutateAsync({
          revisionId: revision.id,
          configurationId,
          elementIds,
        });
      guard.finish();
      toast.add({
        type: "success",
        title: `${name.trim()} created`,
        ...(including ? { description: `${elementCount} included.` } : {}),
      });
      guard.complete();
    } catch (cause) {
      setFailure(
        configurationId
          ? {
              title: "The elements were not included",
              message: `${messageOf(cause)} The configuration is saved. Create configuration again to finish including its elements.`,
            }
          : {
              title: "The configuration was not created",
              message: `${messageOf(cause)} Your details are kept.`,
            },
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent width="medium" initialFocus={() => feedback.node("code") ?? true}>
        <DialogHeader>
          <DialogTitle>Create configuration</DialogTitle>
          <DialogDescription>
            One way {product.name} is built. Which elements are in it is recorded per version.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>{failure.title}</AlertTitle>
                  <AlertDescription>{failure.message}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !!createdId}>
                <Stack space="space.200">
                  <TextField
                    label="Code"
                    value={code}
                    onChange={setCode}
                    required
                    error={errors.get("code")}
                    controlRef={feedback.ref("code")}
                  />
                  <TextField
                    label="Name"
                    value={name}
                    onChange={setName}
                    required
                    error={errors.get("name")}
                    controlRef={feedback.ref("name")}
                  />
                  <TextField
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    multiline
                    controlRef={feedback.ref("description")}
                  />
                </Stack>
              </FieldSet>
              {elementIds.length ? (
                <Field orientation="horizontal" disabled={guard.busy}>
                  <Checkbox
                    checked={includeEverything}
                    onCheckedChange={(checked) => setIncludeEverything(checked === true)}
                  />
                  <FieldContent>
                    <FieldLabel>Include every element in this version</FieldLabel>
                    <FieldDescription>
                      {elementCount} in version {revision.version_number}.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              ) : null}
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
          >
            Create configuration
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
