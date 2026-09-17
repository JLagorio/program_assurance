import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Absent,
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Id,
  Inline,
  TextLink,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import {
  Box,
  Boxes,
  Building2,
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
import { RecordPreviewActions, RecordPreviewPanel, useDisplayedRecords } from "./record-preview";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";
import { baselineSource, type SystemAssuranceRow } from "@/lib/system-assurance";
import { systemTree, type SystemElement, type SystemTreeNode } from "@/lib/system-tree";
import { SystemElementDialog } from "./system-element-dialog";
import { AddFromLibrary } from "./add-from-library";
import { AddProductSystem } from "./add-product-system";
import {
  ImpactBadge,
  impactDescription,
  impactDimensions,
  SystemAssuranceDetails,
} from "./system-assurance-details";
import { useSystemAssurance } from "./use-system-assurance";

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

/**
 * One program system tree is shared by the System tab and the element record's Overview. Two
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
  const { rows: assuranceRows, elements, error, pending } = useSystemAssurance(programId);
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
  const [libraryTargetId, setLibraryTargetId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const collection = workspace.collections.find((item) => item.name === "systems");
  const canCreate = !readOnly && workspace.role !== "viewer" && !!collection?.can_insert;
  const canEdit = !readOnly && workspace.role !== "viewer" && !!collection?.can_update;
  const root = elements.find((element) => element.id === rootElementId);
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
        c.id("name", {
          header: "Element",
          width: 220,
          hideable: false,
          priority: 0,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
          cell: (row) => {
            const Icon = systemIcon(row.system_type);
            return (
              <span
                className="flex min-w-0 items-center gap-075"
                title={`${row.code} · ${row.name}`}
              >
                <Icon aria-hidden className="size-200 shrink-0 icon-subtle" />
                <TextLink
                  render={
                    <Link
                      to="/programs/$programId/systems/$scopeId"
                      params={{ programId, scopeId: row.id }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  }
                  className="min-w-0 truncate"
                >
                  {row.name}
                </TextLink>
                {row.is_authorization_boundary && (
                  <span title="Authorization boundary" aria-label="Authorization boundary">
                    <Shield aria-hidden className="size-150 shrink-0 icon-subtle" />
                  </span>
                )}
              </span>
            );
          },
        }),
        c.text("code", {
          header: "Code",
          width: 125,
          priority: 1,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.text("typeLabel", { header: "Type", width: 130, priority: 3 }),
        ...impactDimensions.map((dimension) =>
          c.custom(dimension, {
            header: labelFor(dimension),
            width: 90,
            priority: 4,
            sort: (row) => ["low", "moderate", "high"].indexOf(row.impacts[dimension].value ?? ""),
            text: (row) => impactDescription(row, dimension),
            cell: (row) => (
              <span title={impactDescription(row, dimension)}>
                <ImpactBadge
                  value={row.impacts[dimension].value}
                  mixed={row.impacts[dimension].source === "mixed"}
                />
              </span>
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
            <span className="flex min-w-0 flex-col font-body-small">
              {row.baselineTitle ? (
                <>
                  <span className="truncate" title={row.baselineTitle}>
                    {row.baselineTitle}
                  </span>
                  <span className="font-body-xsmall text-subtle">{baselineSource(row)}</span>
                </>
              ) : (
                <span className="text-subtle">{baselineSource(row)}</span>
              )}
            </span>
          ),
        }),
        c.number("controlCount", { header: "Controls", width: 100, priority: 5 }),
        c.number("requirementCount", {
          header: "Requirements",
          width: 124,
          priority: 5,
          cell: (row) => (row.requirementCount ? String(row.requirementCount) : <Absent />),
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
                !libraryElementIds.has(row.id) && <Absent />}
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
    [programId, previewId, canCreate, canEdit, libraryElementIds],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program systems",
    view: rootElementId ? "live-system-assurance-subtree-v3" : "live-program-system-assurance-v3",
    resizable: true,
    reorderable: true,
    tree: {
      children: (row) => row.children,
      label: (row) => row.code,
      initialExpanded: true,
      guides: true,
    },
  });
  const createAction =
    canCreate && (!rootElementId || root) ? (
      <Inline space="space.100">
        {!root && (
          <Button
            size="small"
            variant="secondary"
            iconBefore={<Boxes />}
            onClick={() => setAddingProduct(true)}
          >
            From a product…
          </Button>
        )}
        <Button
          size="small"
          variant="primary"
          iconBefore={<Plus />}
          onClick={() => setEditing(root ? { parent: root } : {})}
        >
          Create system
        </Button>
      </Inline>
    ) : null;
  const displayed = useDisplayedRecords(table);
  return (
    <>
      <DataTable
        responsive
        table={table}
        fill={fill}
        state={error ? "error" : pending ? "loading" : "ready"}
        error={error?.message}
        onRowClick={(row) =>
          void navigate({
            to: "/programs/$programId/systems/$scopeId",
            params: { programId, scopeId: row.id },
          })
        }
        empty={{
          illustration: "tree",
          title: "No systems yet",
          description: "Add the first system, then define its nested elements.",
          action: createAction,
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Find an element"
            actions={createAction}
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
      {preview && !pending && !error && (
        <RecordPreviewPanel
          title={preview.name}
          label="Element preview"
          defaultWidth={620}
          onClose={() => setPreviewId(null)}
          recordActions={
            <>
              {(canCreate || canEdit) && (
                <Button
                  size="small"
                  variant="primary"
                  onClick={() => setEditing(canEdit ? { existing: preview } : { parent: preview })}
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
                      <DropdownMenuItem onClick={() => setEditing({ parent: preview })}>
                        <Plus />
                        Create system
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setLibraryTargetId(preview.id)}>
                      <Library />
                      Add from library
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
          navigation={
            <RecordPreviewActions
              table="systems"
              record={{ ...preview, program_id: programId }}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
            />
          }
        >
          <SystemAssuranceDetails
            key={preview.id}
            row={preview}
            rows={assuranceRows}
            onDrill={setPreviewId}
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
          onClose={() => setLibraryTargetId(null)}
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
