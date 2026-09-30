import { ProductCollection } from "./product-collection";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Absent,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HeadingLevelProvider,
  Icon,
  IconButton,
  Id,
  Inline,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  Truncate,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import {
  Box,
  Building2,
  ChevronDown,
  Code2,
  Cpu,
  Database,
  Layers,
  Library,
  Network,
  MoreHorizontal,
  Plus,
  Server,
  Shield,
  Workflow,
} from "lucide-react";
import {
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  RecordLink,
  useEndOnHide,
} from "./record-preview";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";
import { impactLevels, statusEntry } from "@/lib/status";
import { baselineSource, type SystemAssuranceRow } from "@/lib/system-assurance";
import { systemTree, type SystemElement, type SystemTreeNode } from "@/lib/system-tree";
import { SystemElementDialog } from "./system-element-dialog";
import { AddFromLibrary } from "./add-from-library";
import { AddProductSystem } from "./add-product-system";
import {
  ImpactLevel,
  containedElements,
  impactDescription,
  impactDimensions,
  SystemAssuranceDetails,
} from "./system-assurance-details";
import { useSystemAssurance } from "./use-system-assurance";
import { SystemControls } from "./system-baseline";
import { SystemRequirements } from "./system-requirements";
import { SystemEvidence } from "./system-evidence";
import { RetainedTabPanels } from "./program-shared";

const PREVIEW_TABS = ["Overview", "Controls", "Requirements", "Evidence"] as const;
type PreviewTab = (typeof PREVIEW_TABS)[number];
type LibraryOptions = { controlId?: string; source?: "requirement" };

/** The preview body: the same sections as the element's record page, at the panel's width. */
function ElementPreview({
  programId,
  row,
  rows,
  onDrill,
  onAddFromLibrary,
}: {
  programId: string;
  row: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  onDrill: (id: string) => void;
  onAddFromLibrary: (options: LibraryOptions) => void;
}) {
  const [tab, setTab] = useState<PreviewTab>("Overview");
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(PREVIEW_TABS.find((name) => name === value) ?? "Overview")}
    >
      <TabsList variant="line" aria-label="Element preview sections">
        {PREVIEW_TABS.map((name) => (
          <TabsTrigger key={name} value={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      <RetainedTabPanels tabs={PREVIEW_TABS} value={tab} space="space.250">
        {(name) => (
          <>
            {name === "Overview" && (
              <SystemAssuranceDetails row={row} rows={rows} onDrill={onDrill} />
            )}
            {name === "Controls" && (
              <SystemControls
                systemId={row.id}
                onAddFromLibrary={(controlId) => onAddFromLibrary({ controlId })}
              />
            )}
            {name === "Requirements" && (
              <SystemRequirements
                programId={programId}
                systemId={row.id}
                rows={rows}
                onAddFromLibrary={() => onAddFromLibrary({ source: "requirement" })}
              />
            )}
            {name === "Evidence" && (
              <SystemEvidence programId={programId} element={row} rows={rows} />
            )}
          </>
        )}
      </RetainedTabPanels>
    </Tabs>
  );
}

/**
 * One element's preview frame. Opening an element it contains stacks that element's frame on top,
 * with Back to this one, and previous and next among the elements this one contains.
 */
function ElementFrame({
  programId,
  row,
  rows,
  actions,
  onAddFromLibrary,
}: {
  programId: string;
  row: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  actions: (row: SystemAssuranceRow) => ReactNode;
  onAddFromLibrary: (row: SystemAssuranceRow, options: LibraryOptions) => void;
}) {
  const [drilledId, setDrilledId] = useState<string | null>(null);
  const contained = containedElements(row, rows);
  const drilled = contained.find((element) => element.id === drilledId);
  return (
    <>
      {/* The element's name is the preview's h2; the sections sit under it. */}
      <HeadingLevelProvider level={3}>
        <ElementPreview
          key={row.id}
          programId={programId}
          row={row}
          rows={rows}
          onDrill={setDrilledId}
          onAddFromLibrary={(options) => onAddFromLibrary(row, options)}
        />
      </HeadingLevelProvider>
      {drilled && (
        <RecordPreviewPanel
          title={drilled.name}
          label="Element preview"
          defaultWidth={640}
          onClose={() => setDrilledId(null)}
          recordActions={actions(drilled)}
          navigation={
            <RecordPreviewActions
              table="systems"
              record={{ ...drilled, program_id: programId }}
              rows={contained}
              onSelect={(next) => setDrilledId(next.id)}
            />
          }
        >
          <ElementFrame
            key={drilled.id}
            programId={programId}
            row={drilled}
            rows={rows}
            actions={actions}
            onAddFromLibrary={onAddFromLibrary}
          />
        </RecordPreviewPanel>
      )}
    </>
  );
}

type TreeRow = SystemTreeNode<SystemAssuranceRow & { typeLabel: string }>;
type Editor = { existing?: SystemElement; parent?: SystemElement };

export function systemIcon(type: string) {
  if (["information_system", "platform"].includes(type)) return Server;
  if (["industrial_control_system", "hardware"].includes(type)) return Cpu;
  if (type === "subsystem") return Layers;
  if (type === "software") return Code2;
  if (type === "network") return Network;
  if (type === "service") return Workflow;
  if (type === "data") return Database;
  if (type === "facility") return Building2;
  return Box;
}

/** An impact level's place in the order, for sorting: unrecorded first. */
const impactRank = (value: string | null | undefined) =>
  statusEntry(impactLevels, value)?.rank ?? -1;

/**
 * One program system tree is shared by the System tab and the element record's Overview.
 * The eye opens the preview; the name and row open the full record.
 */
export function ProgramSystemsTree({
  programId,
  rootElementId,
  fill,
  readOnly = false,
}: {
  programId: string;
  rootElementId?: string | undefined;
  fill?: boolean | undefined;
  readOnly?: boolean;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const {
    rows: assuranceRows,
    elements,
    queries: assuranceQueries,
  } = useSystemAssurance(programId);
  const components = useRows("system_components");
  const libraryElementIds = useMemo(
    () =>
      new Set(
        (components.data ?? [])
          .filter((component) => component.defined_component_id && component.system_element_id)
          .map((component) => component.system_element_id!),
      ),
    [components.data],
  );
  const [editing, setEditing] = useState<Editor | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  useEndOnHide(() => setPreviewId(null));
  const [libraryTargetId, setLibraryTargetId] = useState<string | null>(null);
  const [libraryOptions, setLibraryOptions] = useState<LibraryOptions>({});
  const [addingProduct, setAddingProduct] = useState(false);
  const collection = workspace.collections.find((item) => item.name === "systems");
  const canCreate = !readOnly && workspace.role !== "viewer" && !!collection?.can_insert;
  const canEdit = !readOnly && workspace.role !== "viewer" && !!collection?.can_update;
  const root = elements.find((element) => element.id === rootElementId);
  // A failed refresh keeps the rows the reader has, so the preview stays with them.
  const preview = assuranceRows.find((element) => element.id === previewId);
  const libraryTarget = assuranceRows.find((element) => element.id === libraryTargetId);
  const rows = useMemo(
    () =>
      systemTree(
        [...assuranceRows]
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map((element) => ({ ...element, typeLabel: labelFor(element.system_type) })),
        rootElementId,
      ),
    [assuranceRows, rootElementId],
  );
  const columns = useMemo(
    () =>
      defineColumns<TreeRow>((c) => [
        // The name takes the width the others leave, at least 220: a nested element keeps its words.
        c.id("name", {
          header: "Element",
          minWidth: 220,
          hideable: false,
          priority: 0,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
          cell: (row) => {
            const TypeIcon = systemIcon(row.system_type);
            return (
              <Inline as="span" space="space.075" alignBlock="center" className="min-w-0">
                <Icon color="color.icon.subtle" className="shrink-0">
                  <TypeIcon />
                </Icon>
                {row.is_authorization_boundary && (
                  <Icon
                    color="color.icon.subtle"
                    label="Authorization boundary"
                    className="shrink-0"
                  >
                    <Shield />
                  </Icon>
                )}
                <Truncate className="min-w-0">
                  <RecordLink table="systems" record={row}>
                    {row.name}
                  </RecordLink>
                </Truncate>
              </Inline>
            );
          },
        }),
        c.text("code", {
          header: "Code",
          width: 115,
          priority: 1,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.text("typeLabel", { header: "Type", width: 115, priority: 3 }),
        ...impactDimensions.map((dimension) =>
          c.custom(dimension, {
            header: labelFor(dimension),
            // Wide enough for "Moderate" beside its dot.
            width: 96,
            priority: 4,
            sort: (row) => impactRank(row.impacts[dimension].value),
            text: (row) => impactDescription(row, dimension),
            cell: (row) => (
              <ImpactLevel
                value={row.impacts[dimension].value}
                mixed={row.impacts[dimension].source === "mixed"}
              />
            ),
          }),
        ),
        c.custom("baseline", {
          header: "Baseline",
          width: 220,
          priority: 2,
          sort: (row) => row.baselineTitle ?? "",
          text: (row) => `${row.baselineTitle ?? "Not set"} · ${baselineSource(row)}`,
          cell: (row) => (
            <Stack as="span" space="space.0" className="min-w-0 font-body-small">
              {row.baselineTitle ? (
                <>
                  <Truncate>{row.baselineTitle}</Truncate>
                  <span className="font-body-xsmall text-subtle">{baselineSource(row)}</span>
                </>
              ) : (
                <span className="text-subtle">{baselineSource(row)}</span>
              )}
            </Stack>
          ),
        }),
        c.number("controlCount", { header: "Controls", width: 100, priority: 5 }),
        c.number("requirementCount", {
          header: "Requirements",
          width: 124,
          priority: 5,
          cell: (row) =>
            row.requirementCount ? String(row.requirementCount) : <Absent label="None allocated" />,
        }),
        c.custom("source", {
          header: "Source",
          width: 150,
          priority: 6,
          text: (row) =>
            [
              row.is_authorization_boundary && row.product_revision_id ? "Variant" : "",
              row.product_element_id ? "Product" : "",
              libraryElementIds.has(row.id) ? "Library" : "",
            ]
              .filter(Boolean)
              .join(", "),
          cell: (row) => (
            <Inline space="space.050" shouldWrap>
              {row.is_authorization_boundary && row.product_revision_id && (
                <Badge size="xsmall" variant="secondary" tone="information">
                  Variant
                </Badge>
              )}
              {row.product_element_id && (
                <Badge size="xsmall" variant="secondary" tone="information">
                  Product
                </Badge>
              )}
              {libraryElementIds.has(row.id) && (
                <Badge size="xsmall" variant="secondary" tone="information">
                  Library
                </Badge>
              )}
              {!(row.is_authorization_boundary && row.product_revision_id) &&
                !row.product_element_id &&
                !libraryElementIds.has(row.id) && <Absent label="No source" />}
            </Inline>
          ),
        }),
        ...(canCreate || canEdit
          ? [
              c.actions((row) => [
                ...(canCreate
                  ? [{ label: "Create system", onSelect: () => setEditing({ parent: row }) }]
                  : []),
                ...(canEdit
                  ? [{ label: "Edit system", onSelect: () => setEditing({ existing: row }) }]
                  : []),
              ]),
            ]
          : []),
      ]),
    [previewId, canCreate, canEdit, libraryElementIds],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program systems",
    view: {
      id: rootElementId ? "live-system-assurance-subtree" : "live-program-system-assurance",
      version: 3,
    },
    resizable: true,
    reorderable: true,
    tree: {
      children: (row) => row.children,
      label: (row) => row.code,
      initialExpanded: true,
      guides: true,
    },
  });
  const createSystem = (
    <Button
      size="small"
      variant="primary"
      iconBefore={<Plus />}
      onClick={() => setEditing(root ? { parent: root } : {})}
    >
      Create system
    </Button>
  );
  // At the program root a system can also come from a product: a second path beside the primary.
  const createAction =
    canCreate && (!rootElementId || root) ? (
      root ? (
        createSystem
      ) : (
        <ButtonGroup aria-label="Create system">
          {createSystem}
          <ButtonGroupSeparator isDecorative />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton
                  label="More ways to create a system"
                  icon={<ChevronDown />}
                  size="small"
                  variant="primary"
                />
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddingProduct(true)}>
                Add system from product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      )
    ) : null;
  const displayed = useDisplayedRecords(table);
  const openLibrary = (target: SystemAssuranceRow, options: LibraryOptions) => {
    setLibraryOptions(options);
    setLibraryTargetId(target.id);
  };
  /** An element's record actions in its preview header: one primary and the rest in a menu. */
  const elementActions = (target: SystemAssuranceRow) => (
    <>
      {(canCreate || canEdit) && (
        <Button
          size="small"
          variant="primary"
          onClick={() => setEditing(canEdit ? { existing: target } : { parent: target })}
        >
          {canEdit ? "Edit system" : "Create system"}
        </Button>
      )}
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                icon={<MoreHorizontal />}
                label="More system actions"
                size="small"
                variant="subtle"
              />
            }
          />
          <DropdownMenuContent align="end">
            {canCreate && (
              <DropdownMenuItem onClick={() => setEditing({ parent: target })}>
                <Plus />
                Create system
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => openLibrary(target, {})}>
              <Library />
              Add from library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
  return (
    <>
      <ProductCollection
        table={table}
        fill={fill}
        onRowClick={(row) =>
          void navigate({
            to: "/programs/$programId/systems/$scopeId",
            params: { programId, scopeId: row.id },
          })
        }
        empty={{
          illustration: "tree",
          title: "No systems yet",
          description: "Create the first system, then define its nested elements.",
          action: createAction,
        }}
        queries={[...assuranceQueries, components]}
        searchLabel="Find an element"
        action={createAction}
      />
      {preview && (
        <RecordPreviewPanel
          title={preview.name}
          label="Element preview"
          defaultWidth={640}
          onClose={() => setPreviewId(null)}
          recordActions={elementActions(preview)}
          navigation={
            <RecordPreviewActions
              table="systems"
              record={{ ...preview, program_id: programId }}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
            />
          }
        >
          <ElementFrame
            key={preview.id}
            programId={programId}
            row={preview}
            rows={assuranceRows}
            actions={elementActions}
            onAddFromLibrary={openLibrary}
          />
        </RecordPreviewPanel>
      )}
      {addingProduct && (
        <AddProductSystem
          programId={programId}
          onClose={() => setAddingProduct(false)}
          onSaved={(id) => setPreviewId(id)}
        />
      )}
      {libraryTarget && (
        <AddFromLibrary
          programId={programId}
          element={libraryTarget}
          rows={assuranceRows}
          controlId={libraryOptions.controlId}
          initialSource={libraryOptions.source === "requirement" ? "requirement" : undefined}
          onClose={() => {
            setLibraryTargetId(null);
            setLibraryOptions({});
          }}
        />
      )}
      {editing && (
        <SystemElementDialog
          key={editing.existing?.id ?? editing.parent?.id ?? "new-root"}
          programId={programId}
          {...editing}
          onClose={() => setEditing(null)}
          onSaved={(id) => setPreviewId(id)}
        />
      )}
    </>
  );
}
