import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  Id,
  Inline,
  Shell,
  TextLink,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import {
  Box,
  Building2,
  Code2,
  Cpu,
  Database,
  Layers,
  Network,
  Pencil,
  Plus,
  Server,
  Shield,
  Workflow,
} from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { buildSystemAssuranceRows, type SystemAssuranceRow } from "@/lib/system-assurance";
import { systemTree, type SystemElement, type SystemTreeNode } from "@/lib/system-tree";
import { ProgramRecordDialog } from "./program-shared";
import { SystemElementDialog } from "./system-element-dialog";
import {
  ImpactBadge,
  impactDescription,
  impactDimensions,
  SystemAssuranceDetails,
  type SystemAssuranceTab,
} from "./system-assurance-details";

type TreeRow = SystemTreeNode<SystemAssuranceRow & { typeLabel: string }>;
type Editor = { existing?: SystemElement; parent?: SystemElement };

function systemIcon(type: string) {
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
  const scopes = useRows("scopes");
  const baselines = useRows("system_effective_baselines");
  const selections = useRows("selected_controls");
  const scopeBaselines = useRows("scope_baselines");
  const [editing, setEditing] = useState<Editor | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<SystemAssuranceTab>("Overview");
  const [scopeEditor, setScopeEditor] = useState<{
    element: SystemElement;
    scope: Row<"scopes"> | null;
  } | null>(null);
  const collection = workspace.collections.find((item) => item.name === "systems");
  const canCreate = !readOnly && workspace.role !== "viewer" && !!collection?.can_insert;
  const canEdit = !readOnly && workspace.role !== "viewer" && !!collection?.can_update;
  const canCreateScope =
    !readOnly &&
    workspace.role !== "viewer" &&
    !!workspace.collections.find((item) => item.name === "scopes")?.can_insert;
  const queries = [systems, scopes, baselines, selections, scopeBaselines];
  const error = queries.find((query) => query.error)?.error;
  const pending = queries.some((query) => query.isPending);
  const elements = useMemo(() => (systems.data ?? []) as SystemElement[], [systems.data]);
  const root = elements.find((element) => element.id === rootElementId);
  const assuranceRows = useMemo(
    () =>
      buildSystemAssuranceRows({
        systems: elements,
        scopes: scopes.data ?? [],
        baselines: baselines.data ?? [],
        selections: selections.data ?? [],
        scopeBaselines: scopeBaselines.data ?? [],
      }),
    [elements, scopes.data, baselines.data, selections.data, scopeBaselines.data],
  );
  const preview = assuranceRows.find((element) => element.id === previewId);
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
  const columns = useMemo(() => {
    const open = (row: TreeRow, tab: SystemAssuranceTab) => {
      setPreviewId(row.id);
      setPreviewTab(tab);
    };
    return defineColumns<TreeRow>((c) => [
      c.text("name", {
        header: "System",
        minWidth: 290,
        hideable: false,
        cell: (row) => {
          const Icon = systemIcon(row.system_type);
          return (
            <span className="flex min-w-0 items-center gap-075" title={`${row.code} · ${row.name}`}>
              <Icon aria-hidden className="size-200 shrink-0 text-icon-subtle" />
              <TextLink
                render={
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId, scopeId: row.id }}
                  />
                }
                className="min-w-0 truncate"
              >
                {row.name}
              </TextLink>
              {row.is_authorization_boundary && (
                <span title="Authorization boundary" aria-label="Authorization boundary">
                  <Shield aria-hidden className="size-150 shrink-0 text-icon-subtle" />
                </span>
              )}
            </span>
          );
        },
      }),
      c.id("code", {
        header: "Code",
        width: 125,
        preview: (row) => open(row, "Overview"),
        active: (row) => row.id === previewId,
        cell: (row) => <Id>{row.code}</Id>,
      }),
      ...impactDimensions.map((dimension) =>
        c.custom(dimension, {
          header: (
            <abbr title={labelFor(dimension)} className="no-underline">
              {dimension === "confidentiality"
                ? "Conf."
                : dimension === "integrity"
                  ? "Integ."
                  : "Avail."}
            </abbr>
          ),
          width: 90,
          sort: (row) => ["low", "moderate", "high"].indexOf(row.impacts[dimension].value ?? ""),
          text: (row) => impactDescription(row, dimension),
          cell: (row) => (
            <button
              type="button"
              aria-label={`View ${dimension} impact for ${row.code}`}
              title={impactDescription(row, dimension)}
              onClick={() => open(row, "Overview")}
              className="flex flex-col items-start gap-025 rounded-small py-025 focus-visible:outline-focused"
            >
              <ImpactBadge
                value={row.impacts[dimension].value}
                mixed={row.impacts[dimension].source === "mixed"}
              />
              {row.impacts[dimension].source === "scope" && (
                <span className="font-body-xsmall text-subtle">Scope</span>
              )}
              {row.impacts[dimension].conflict && row.impacts[dimension].source === "system" && (
                <span className="font-body-xsmall text-subtle">Scope differs</span>
              )}
            </button>
          ),
        }),
      ),
      c.custom("scopes", {
        header: "Scopes",
        width: 150,
        sort: (row) => row.subtreeScopeCount,
        text: (row) => row.directScopes.map((scope) => `${scope.code} ${scope.name}`).join(", "),
        cell: (row) => (
          <button
            type="button"
            aria-label={`View scopes for ${row.code}`}
            onClick={() => open(row, "Scopes")}
            className="flex flex-col items-start gap-025 text-left font-body-small hover:underline focus-visible:outline-focused"
          >
            <span>
              {row.directScopes.length === 1
                ? row.directScopes[0]!.code
                : row.directScopes.length
                  ? `${row.directScopes.length} scopes`
                  : "—"}
            </span>
            {row.subtreeScopeCount > row.directScopes.length && (
              <span className="font-body-xsmall text-subtle">
                {row.subtreeScopeCount - row.directScopes.length} below
              </span>
            )}
            {row.scopeSelections.some(
              (selection) => selection.differs || selection.conflicting,
            ) && <span className="font-body-xsmall text-subtle">Separate baseline</span>}
          </button>
        ),
      }),
      c.custom("controls", {
        header: "Controls",
        width: 100,
        sort: (row) => row.controlCount ?? -1,
        text: (row) =>
          row.controlCount === null ? "No baseline recorded" : String(row.controlCount),
        cell: (row) => (
          <button
            type="button"
            aria-label={`View controls for ${row.code}`}
            onClick={() => open(row, "Controls")}
            className="flex flex-col items-start gap-025 font-body-small tabular-nums hover:underline focus-visible:outline-focused"
          >
            <span>{row.controlCount ?? "—"}</span>
            {row.additionalChildControlCount > 0 && (
              <span className="font-body-xsmall text-subtle">
                +{row.additionalChildControlCount} below
              </span>
            )}
          </button>
        ),
      }),
      c.custom("baseline", {
        header: "Baseline source",
        width: 185,
        text: (row) =>
          row.inheritedFrom
            ? `Inherited from ${row.inheritedFrom.code}`
            : (row.effectiveBaseline?.source_label ?? "No baseline recorded"),
        cell: (row) => (
          <button
            type="button"
            onClick={() => open(row, "Controls")}
            className="flex flex-col items-start text-left font-body-small hover:underline focus-visible:outline-focused"
          >
            {row.inheritedFrom ? (
              <>
                <span>Inherited</span>
                <span className="font-body-xsmall text-subtle">{row.inheritedFrom.code}</span>
              </>
            ) : (
              (row.effectiveBaseline?.source_label ?? (
                <span className="text-subtle">Not recorded</span>
              ))
            )}
          </button>
        ),
      }),
      c.text("typeLabel", { header: "Type", width: 140 }),
      ...(canCreate || canEdit || canCreateScope
        ? [
            c.actions((row) => [
              ...(canCreate
                ? [{ label: "Add child system", onSelect: () => setEditing({ parent: row }) }]
                : []),
              ...(canEdit
                ? [{ label: "Edit system", onSelect: () => setEditing({ existing: row }) }]
                : []),
              ...(canCreateScope
                ? [
                    {
                      label: "Add scope",
                      onSelect: () => setScopeEditor({ element: row, scope: null }),
                    },
                  ]
                : []),
            ]),
          ]
        : []),
    ]);
  }, [programId, previewId, canCreate, canEdit, canCreateScope]);
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program systems",
    view: rootElementId ? "live-system-assurance-subtree-v2" : "live-program-system-assurance-v2",
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
      <DataTable
        table={table}
        fill={fill}
        state={error ? "error" : pending ? "loading" : "ready"}
        error={error?.message}
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
      {preview && !pending && !error && (
        <Shell.Panel
          title={preview.code}
          label="System preview"
          defaultWidth={620}
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
          <SystemAssuranceDetails
            key={preview.id}
            row={preview}
            rows={assuranceRows}
            tab={previewTab}
            onTabChange={setPreviewTab}
            readOnly={readOnly}
            canCreateScope={canCreateScope}
            onAddScope={() => setScopeEditor({ element: preview, scope: null })}
            onOpenScope={(scope) => setScopeEditor({ element: preview, scope })}
          />
        </Shell.Panel>
      )}
      {editing && (
        <SystemElementDialog
          key={editing.existing?.id ?? editing.parent?.id ?? "new-root"}
          programId={programId}
          {...editing}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setPreviewId(id);
            setPreviewTab("Overview");
          }}
        />
      )}
      {scopeEditor && (
        <ProgramRecordDialog
          table="scopes"
          row={scopeEditor.scope}
          readOnly={readOnly}
          initialValues={{
            system_id: scopeEditor.scope?.system_id ?? scopeEditor.element.boundary_system_id,
            composition_node_id: scopeEditor.scope
              ? scopeEditor.scope.composition_node_id
              : scopeEditor.element.is_authorization_boundary
                ? null
                : scopeEditor.element.id,
          }}
          onClose={() => setScopeEditor(null)}
        />
      )}
    </>
  );
}
