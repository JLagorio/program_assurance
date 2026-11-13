import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  AsideLayout,
  Box,
  Button,
  Id,
  Inspector,
  PageHeader,
  Prose,
  Section,
  Shell,
  Stack,
  defineColumns,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRecordTitle } from "@/components/app/browser-title";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import {
  controlsOwed,
  useProductsControlStatus,
  useVariantsControlDelta,
} from "@/lib/product-assurance";
import { productCreateLabel } from "@/lib/product-records";
import type { DataRecord } from "@/lib/records";
import { programStatuses, recordLifecycleStates, revisionStates } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { canAuthorLibrary } from "./library-utils";
import { ProductCollection } from "./product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useOpenRecord,
} from "./record-preview";
import {
  EntityEditor,
  ModelFacts,
  ModelTable,
  RelationName,
  type DisplayColumn,
} from "./record-tools";
import { RecordTrail, TrailLink } from "./record-trail";
import { DetailFacts, MissingRecord, QueryState, RecordActions } from "./work-common";

/*
 * Business lines: the level above products (Air Defense holds the X800 Missile), which a program
 * belongs to as well. The register lists them with how many products and programs each holds; a
 * business line's record reads down the hierarchy: its products with what each gives, and its
 * programs with what each still owes on the product it took.
 */

/** The Business lines register. */
export function BusinessLinesIndex() {
  const workspace = useWorkspace();
  const lines = useRows("business_lines");
  const products = useRows("products", undefined, { columns: ["id", "business_line_id"] });
  const programs = useRows("programs", undefined, { columns: ["id", "business_line_id"] });
  const [editing, setEditing] = useState<DataRecord | "new" | null>(null);
  const [preview, setPreview] = useState<DataRecord | null>(null);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  const canEdit = canAuthorLibrary(workspace.role);
  const createLabel = productCreateLabel("business_lines");
  // A trigger stays enabled while its dialog is open; a second press opens nothing new.
  const edit = (target: DataRecord | "new") => setEditing((current) => current ?? target);
  const columns: DisplayColumn[] = [
    { key: "name", label: "Business line" },
    { key: "code", label: "Code", width: 120 },
    { key: "owner_party_id", label: "Owner", kind: "person" },
    {
      key: "products",
      label: "Products",
      kind: "number",
      width: 120,
      // The counts join the row, so they sort, search and export with the rest.
      value: (row) =>
        products.data?.filter((product) => product.business_line_id === row.id).length ?? 0,
    },
    {
      key: "programs",
      label: "Programs",
      kind: "number",
      width: 120,
      value: (row) =>
        programs.data?.filter((program) => program.business_line_id === row.id).length ?? 0,
    },
    { key: "state", label: "Status", statuses: recordLifecycleStates, width: 120 },
  ];
  const create = (size: "small" | "medium") =>
    canEdit ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => edit("new")}>
        {createLabel}
      </Button>
    ) : undefined;
  // The preview draws the record as the register holds it now, so an edit shows at once.
  const shown = preview
    ? (((lines.data ?? []).find((line) => line.id === preview.id) as DataRecord | undefined) ??
      preview)
    : null;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Business lines</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {editing && (
        <EntityEditor
          table="business_lines"
          existing={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
        />
      )}
      <ModelTable
        model="business_lines"
        queries={[lines, products, programs]}
        selectedId={preview?.id}
        onDisplayedRowsChange={setDisplayed}
        fill
        rows={(lines.data ?? []) as DataRecord[]}
        columns={columns}
        onPreview={setPreview}
        searchLabel="Find business lines"
        noun={{ one: "business line", other: "business lines" }}
        view="business-lines"
        filters={["state"]}
        empty={{
          illustration: "tree",
          title: "No business lines yet",
          description: "Create a business line, then place its products and programs in it.",
          action: create("medium"),
        }}
        actions={create("small")}
      />
      {shown && (
        <RecordPreviewPanel
          title={String(shown["name"])}
          label="Business line preview"
          defaultWidth={560}
          onClose={() => setPreview(null)}
          recordActions={
            canEdit ? (
              <Button size="small" variant="primary" onClick={() => edit(shown)}>
                Edit business line
              </Button>
            ) : undefined
          }
          navigation={
            <RecordPreviewActions
              table="business_lines"
              record={shown}
              rows={displayed}
              onSelect={setPreview}
            />
          }
        >
          <ModelFacts
            table="business_lines"
            record={shown}
            fields={[...columns.slice(1), { key: "description", label: "Description" }]}
          />
        </RecordPreviewPanel>
      )}
    </Page>
  );
}

type ProductLine = {
  id: string;
  name: string;
  code: string;
  configurations: number;
  variants: number;
  version: number | null;
  versionState: string | null;
  /** Of the latest published version: the controls read, and those satisfied in every configuration. */
  controls: number | null;
  satisfied: number | null;
};

type ProgramLine = {
  id: string;
  name: string;
  code: string;
  status: string;
  product: string | null;
  configuration: string | null;
  /** Of the program's variant: the controls of its baseline, and those it owes an assessment on. */
  controls: number | null;
  owed: number | null;
};

const productColumns = defineColumns<ProductLine>((c) => [
  c.text("name", {
    header: "Product",
    priority: 0,
    minWidth: 200,
    hideable: false,
    cell: (row) => (
      <RecordLink table="products" record={row}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.number("configurations", { header: "Configurations", width: 140, priority: 3 }),
  c.number("variants", { header: "Variants", width: 110, priority: 2 }),
  c.number("version", { header: "Latest version", width: 130, priority: 4 }),
  c.status("versionState", {
    header: "Version state",
    width: 140,
    priority: 4,
    statuses: revisionStates,
  }),
  c.number("controls", { header: "Controls assessed", width: 160, priority: 3 }),
  c.number("satisfied", { header: "Satisfied in every configuration", width: 250, priority: 1 }),
]);

const programColumns = defineColumns<ProgramLine>((c) => [
  c.text("name", {
    header: "Program",
    priority: 0,
    minWidth: 220,
    hideable: false,
    cell: (row) => (
      <RecordLink table="programs" record={row}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.status("status", { header: "Status", width: 120, priority: 3, statuses: programStatuses }),
  c.text("product", { header: "Product", width: 180, priority: 2 }),
  c.text("configuration", { header: "Configuration", width: 200, priority: 3 }),
  c.number("controls", { header: "Controls", width: 110, priority: 4 }),
  c.number("owed", { header: "To assess", width: 120, priority: 1 }),
]);

/** A business line's products, each with what its latest published version gives. */
function LineProducts({ lineId }: { lineId: string }) {
  const products = useRows("products", { business_line_id: lineId });
  const productIds = useMemo(() => idSet(products.data?.map((row) => row.id)), [products.data]);
  const revisions = useRows(
    "product_revisions",
    { product_id: productIds },
    { columns: ["id", "product_id", "version_number", "state"], enabled: products.isSuccess },
  );
  const configurations = useRows(
    "product_configurations",
    { product_id: productIds },
    { columns: ["id", "product_id", "state"], enabled: products.isSuccess },
  );
  const revisionIds = useMemo(() => idSet(revisions.data?.map((row) => row.id)), [revisions.data]);
  const variants = useRows(
    "systems",
    { product_revision_id: revisionIds, is_authorization_boundary: true },
    { columns: ["id", "product_revision_id"], enabled: revisions.isSuccess },
  );
  // What a product gives is read from its latest published version: a draft is not assessed.
  const published = useMemo(() => {
    const latest = new Map<string, Row<"product_revisions">>();
    for (const revision of (revisions.data ?? []) as Row<"product_revisions">[])
      if (
        revision.state === "published" &&
        revision.version_number > (latest.get(revision.product_id)?.version_number ?? 0)
      )
        latest.set(revision.product_id, revision);
    return latest;
  }, [revisions.data]);
  const standings = useProductsControlStatus(
    useMemo(() => [...published.values()].map((revision) => revision.id), [published]),
  );
  const rows = useMemo(
    () =>
      (products.data ?? []).map((product): ProductLine => {
        const versions = (revisions.data ?? []).filter((row) => row.product_id === product.id);
        const latest = [...versions].sort((a, b) => b.version_number - a.version_number)[0];
        const versionIds = new Set(versions.map((row) => row.id));
        const standing = standings.get(published.get(product.id)?.id ?? "")?.data;
        return {
          id: product.id,
          name: product.name,
          code: product.code,
          configurations: (configurations.data ?? []).filter(
            (row) => row.product_id === product.id && row.state === "active",
          ).length,
          variants: (variants.data ?? []).filter(
            (row) => row.product_revision_id && versionIds.has(row.product_revision_id),
          ).length,
          version: latest?.version_number ?? null,
          versionState: latest?.state ?? null,
          controls: standing ? standing.total : null,
          satisfied: standing ? standing.satisfiedEverywhere : null,
        };
      }),
    [products.data, revisions.data, configurations.data, variants.data, standings, published],
  );
  const table = useCollectionTable({
    columns: productColumns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Products of the business line",
    view: "business-line-products",
  });
  const openRecord = useOpenRecord();
  return (
    <Section title="Products" count={products.data?.length} countMax={9999}>
      <ProductCollection
        table={table}
        compact
        queries={[products, revisions, configurations, variants, ...standings.values()]}
        onRowClick={(row) => openRecord("products", row)}
        searchLabel="Find products"
        empty={{
          title: "No products in this business line",
          description: "Edit a product to place it in this business line.",
        }}
      />
    </Section>
  );
}

/** A business line's programs, each with the product it took and what it still owes on it. */
function LinePrograms({ lineId }: { lineId: string }) {
  const programs = useRows("programs", { business_line_id: lineId });
  const programIds = useMemo(() => idSet(programs.data?.map((row) => row.id)), [programs.data]);
  const systems = useRows(
    "systems",
    { program_id: programIds, is_authorization_boundary: true },
    {
      columns: ["id", "program_id", "code", "product_revision_id", "product_configuration_id"],
      enabled: programs.isSuccess,
    },
  );
  // A program's variant: its first boundary created from a product configuration, by code.
  const variants = useMemo(() => {
    const first = new Map<string, { id: string; program_id: string }>();
    for (const system of [...(systems.data ?? [])].sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    ))
      if (system.product_configuration_id && !first.has(system.program_id))
        first.set(system.program_id, system);
    return first;
  }, [systems.data]);
  const deltas = useVariantsControlDelta(
    useMemo(() => [...variants.values()].map((system) => system.id), [variants]),
  );
  const rows = useMemo(
    () =>
      (programs.data ?? []).map((program): ProgramLine => {
        const delta = deltas.get(variants.get(program.id)?.id ?? "")?.data;
        return {
          id: program.id,
          name: program.name,
          code: program.code,
          status: program.status,
          product: delta ? delta.product.name : null,
          configuration: delta
            ? `${delta.product.configurationCode} ${delta.product.configuration}`
            : null,
          controls: delta ? delta.total : null,
          owed: delta ? controlsOwed(delta) : null,
        };
      }),
    [programs.data, variants, deltas],
  );
  const table = useCollectionTable({
    columns: programColumns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Programs of the business line",
    view: "business-line-programs",
  });
  const openRecord = useOpenRecord();
  return (
    <Section title="Programs" count={programs.data?.length} countMax={9999}>
      <ProductCollection
        table={table}
        compact
        queries={[programs, systems, ...deltas.values()]}
        onRowClick={(row) => openRecord("programs", row)}
        searchLabel="Find programs"
        empty={{
          title: "No programs in this business line",
          description: "Edit a program to place it in this business line.",
        }}
      />
    </Section>
  );
}

/**
 * The business line's record: its Details beside what it holds, read down the hierarchy. Products
 * says what each product's latest published version gives; Programs says which product and
 * configuration each program took and how many controls it still owes an assessment on.
 */
export function BusinessLineRecord({ lineId }: { lineId: string }) {
  const query = useRow("business_lines", lineId);
  const line = query.data;
  useRecordTitle("Business line", line?.name);
  const [editing, setEditing] = useState(false);
  return (
    <Page>
      {editing && line && (
        <EntityEditor
          table="business_lines"
          existing={line as DataRecord}
          onCancel={() => setEditing(false)}
        />
      )}
      <QueryState queries={[query]} region>
        {line ? (
          <>
            <PageHeader>
              <RecordTrail current={line.name}>
                <TrailLink to="/library/business-lines">Business lines</TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{line.name}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="business_lines"
                  id={line.id}
                  editLabel="Edit business line"
                  onEdit={() => {
                    if (!editing) setEditing(true);
                  }}
                />
              </PageHeader.Actions>
            </PageHeader>
            <AsideLayout
              aside={
                <Shell.Aside
                  label="Business line details"
                  summary={<StatusBadge statuses={recordLifecycleStates} value={line.state} />}
                >
                  <Inspector.Group title="Details">
                    <DetailFacts
                      facts={[
                        [
                          "Status",
                          <StatusBadge statuses={recordLifecycleStates} value={line.state} />,
                        ],
                        ["Code", <Id>{line.code}</Id>],
                        ["Owner", <RelationName table="parties" id={line.owner_party_id} />],
                      ]}
                    />
                  </Inspector.Group>
                </Shell.Aside>
              }
            >
              <Stack space="space.300" className="min-w-0">
                <LineProducts lineId={line.id} />
                <LinePrograms lineId={line.id} />
                <Section title="Description">
                  <Box className="max-w-layout-measure">
                    <Prose>{line.description || <Absent label="No description" />}</Prose>
                  </Box>
                </Section>
              </Stack>
            </AsideLayout>
          </>
        ) : (
          <MissingRecord
            kind="Business line"
            back={{
              label: "Open business lines",
              link: <Link to="/library/business-lines" />,
            }}
          />
        )}
      </QueryState>
    </Page>
  );
}
