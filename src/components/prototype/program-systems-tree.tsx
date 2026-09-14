import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  Id,
  Inline,
  KeyValue,
  Shell,
  Stack,
  TextLink,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { Plus, Pencil } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { systemTree, type SystemElement, type SystemTreeNode } from "@/lib/system-tree";
import { RelationName } from "./record-tools";
import { SystemElementDialog } from "./system-element-dialog";

type TreeRow = SystemTreeNode<SystemElement & { typeLabel: string; boundaryLabel: string }>;
type Editor = { existing?: SystemElement; parent?: SystemElement };

/** One program system tree is shared by the System tab, composition URL and element records. */
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
  const systems = useRows("systems", { program_id: programId });
  const [editing, setEditing] = useState<Editor | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const collection = workspace.collections.find((item) => item.name === "systems");
  const canCreate = !readOnly && workspace.role !== "viewer" && !!collection?.can_insert;
  const canEdit = !readOnly && workspace.role !== "viewer" && !!collection?.can_update;
  const elements = useMemo(() => (systems.data ?? []) as SystemElement[], [systems.data]);
  const root = elements.find((element) => element.id === rootElementId);
  const preview = elements.find((element) => element.id === previewId);
  const rows = useMemo(
    () =>
      systemTree(
        [...elements]
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map((element) => ({
            ...element,
            typeLabel: labelFor(element.system_type),
            boundaryLabel: element.is_authorization_boundary
              ? "Authorization boundary"
              : "Within parent boundary",
          })),
        rootElementId,
      ),
    [elements, rootElementId],
  );
  const columns = useMemo(
    () =>
      defineColumns<TreeRow>((c) => [
        c.id("code", {
          header: "System",
          width: 170,
          hideable: false,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
          cell: (row) => (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/systems/$scopeId"
                  params={{ programId, scopeId: row.id }}
                />
              }
            >
              <Id>{row.code}</Id>
            </TextLink>
          ),
        }),
        c.text("name", { header: "Name", minWidth: 260, hideable: false }),
        c.text("typeLabel", { header: "Type", width: 165 }),
        c.text("boundaryLabel", { header: "Authorization boundary", width: 220 }),
        ...(canCreate || canEdit
          ? [
              c.actions((row) => [
                ...(canCreate
                  ? [{ label: "Add child system", onSelect: () => setEditing({ parent: row }) }]
                  : []),
                ...(canEdit
                  ? [{ label: "Edit system", onSelect: () => setEditing({ existing: row }) }]
                  : []),
              ]),
            ]
          : []),
      ]),
    [programId, previewId, canCreate, canEdit],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program systems",
    view: rootElementId ? "live-system-subtree" : "live-program-systems",
    resizable: true,
    reorderable: true,
    pageSize: 25,
    tree: { children: (row) => row.children, label: (row) => row.code, initialExpanded: true },
  });
  const createAction =
    canCreate && (!rootElementId || root) ? (
      <Button
        size="small"
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setEditing(root ? { parent: root } : {})}
      >
        {root ? "Add child system" : "Add system"}
      </Button>
    ) : null;
  return (
    <>
      <Stack space="space.150">
        <div>
          <h2 className="font-heading-small font-semibold">
            {root ? "System structure" : "Program systems"}
          </h2>
          <p className="font-body-small text-subtle">
            Systems, subsystems, and components share one hierarchy. Authorization boundaries are
            identified separately.
          </p>
        </div>
        <DataTable
          table={table}
          fill={fill}
          state={systems.error ? "error" : systems.isPending ? "loading" : "ready"}
          error={systems.error?.message}
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
              placeholder="Find a system"
              actions={createAction}
            >
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Toolbar>
          }
        />
      </Stack>
      {preview && (
        <Shell.Panel
          title={preview.code}
          label="System preview"
          defaultWidth={520}
          onClose={() => setPreviewId(null)}
          actions={
            <Inline space="space.050">
              {canCreate && (
                <Button
                  size="small"
                  variant="subtle"
                  iconBefore={<Plus />}
                  onClick={() => setEditing({ parent: preview })}
                >
                  Add child system
                </Button>
              )}
              {canEdit && (
                <Button
                  size="small"
                  variant="subtle"
                  iconBefore={<Pencil />}
                  onClick={() => setEditing({ existing: preview })}
                >
                  Edit system
                </Button>
              )}
            </Inline>
          }
        >
          <Stack space="space.200">
            <h2 className="font-heading-small">{preview.name}</h2>
            <KeyValue label="Type">{labelFor(preview.system_type)}</KeyValue>
            <KeyValue label="Owner">
              {preview.system_owner_party_id ? (
                <RelationName table="parties" id={preview.system_owner_party_id} />
              ) : (
                "Unassigned"
              )}
            </KeyValue>
            <KeyValue label="Boundary">
              {preview.is_authorization_boundary
                ? "Authorization boundary"
                : (elements.find((element) => element.id === preview.boundary_system_id)?.name ??
                  "Boundary unavailable")}
            </KeyValue>
            {preview.parent_system_id && (
              <KeyValue label="Parent">
                {elements.find((element) => element.id === preview.parent_system_id)?.name ??
                  "Parent unavailable"}
              </KeyValue>
            )}
            <p className="whitespace-pre-wrap font-body-small">
              {preview.description ?? "Description not recorded."}
            </p>
            <TextLink
              render={
                <Link
                  to="/programs/$programId/systems/$scopeId"
                  params={{ programId, scopeId: preview.id }}
                />
              }
            >
              Open system
            </TextLink>
          </Stack>
        </Shell.Panel>
      )}
      {editing && (
        <SystemElementDialog
          key={editing.existing?.id ?? editing.parent?.id ?? "new-root"}
          programId={programId}
          {...editing}
          onClose={() => setEditing(null)}
          onSaved={setPreviewId}
        />
      )}
    </>
  );
}
