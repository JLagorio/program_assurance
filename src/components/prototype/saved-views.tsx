import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { usePersonalNavigation } from "@/components/app/personal-navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  Button,
  SavedViewPicker,
  SavedViewManager,
  SavedViewEditor,
  announce,
  tableQueryFromSearch,
  tableQueryToString,
  type DataTableInstance,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { discardChanges, useConfirmation } from "@/components/app/confirmation";
import { database, requireIdentity } from "@/lib/database";
import {
  readSavedViews,
  saveNamedView,
  deleteNamedView,
  savedViewDefinitionSchema,
  savedViewSchema,
  type SavedView,
  type SavedViewDefinition,
} from "@/lib/saved-views";

/** Named definitions are shared data; applying them only changes this reader's view. */
export function SavedViews({
  scope,
  definition,
  onApply,
  disabled = false,
}: {
  scope: string;
  definition: SavedViewDefinition;
  onApply: (definition: SavedViewDefinition) => void;
  disabled?: boolean | undefined;
}) {
  const workspace = useWorkspace();
  const personal = usePersonalNavigation();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const requested =
    typeof location.search["savedView"] === "string" ? location.search["savedView"] : undefined;
  const attempted = useRef<string | undefined>(undefined);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const applyRef = useRef(onApply);
  applyRef.current = onApply;
  const visitRef = useRef(personal?.visit);
  visitRef.current = personal?.visit;
  const cache = useQueryClient();
  const managerRoot = useRef<HTMLDivElement | null>(null);
  const initialDraft = useRef("");
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState<{
    id: string;
    name: string;
    visibility: "private" | "workspace";
    existing?: SavedView;
    copy?: SavedView;
  } | null>(null);
  const [updateDefinition, setUpdateDefinition] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const { confirm, confirmation } = useConfirmation();
  const { confirm: confirmDiscard, confirmation: discardConfirmation } = useConfirmation();
  const key = ["saved-views", workspace.tenantId, workspace.userId, scope];
  const context = async () => ({ ...workspace, token: await requireIdentity(workspace) });
  const query = useQuery({
    queryKey: key,
    enabled: open || managing || !!draft,
    queryFn: async () => readSavedViews(database(), await context(), scope),
  });
  const linked = useQuery({
    queryKey: ["saved-view-link", workspace.tenantId, workspace.userId, requested],
    enabled: !!requested,
    queryFn: async () => {
      const { data, error } = await database()
        .from("assurance_saved_views")
        .select("*")
        .eq("tenant_id", workspace.tenantId)
        .eq("id", requested!)
        .maybeSingle()
        .setHeader("Authorization", `Bearer ${await requireIdentity(workspace)}`);
      if (error) throw new Error(error.message);
      return data ? savedViewSchema.parse(data) : null;
    },
  });
  useEffect(() => {
    if (!requested) {
      attempted.current = undefined;
      return;
    }
    if (disabled || trigger.current?.closest("[hidden]")) return;
    const identity = `${workspace.tenantId}:${workspace.userId}:${requested}:${scope}`;
    if (attempted.current === identity || linked.isPending || linked.isFetching) return;
    if (linked.data && linked.data.scope_key !== scope) return;
    attempted.current = identity;
    try {
      if (linked.error) throw linked.error;
      if (!linked.data)
        throw new Error("This saved view is unavailable or is no longer shared with you.");
      applyRef.current(linked.data.definition);
      announce(`Applied ${linked.data.name}`);
      void visitRef
        .current?.({ kind: "saved-view", recordId: linked.data.id })
        .catch(() => undefined);
      void navigate({
        to: ".",
        replace: true,
        resetScroll: false,
        search: (previous: Record<string, unknown>) => ({ ...previous, savedView: undefined }),
      });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "This saved view could not be applied.",
      );
      setManaging(true);
    }
  }, [
    requested,
    disabled,
    workspace.tenantId,
    workspace.userId,
    scope,
    linked.data,
    linked.error,
    linked.isPending,
    linked.isFetching,
    navigate,
  ]);
  function beginDraft(value: NonNullable<typeof draft>) {
    initialDraft.current = JSON.stringify([value.name, value.visibility, false]);
    setError(undefined);
    setUpdateDefinition(false);
    setDraft(value);
  }
  async function closeDraft() {
    if (!draft || pending) return;
    const changed =
      JSON.stringify([draft.name, draft.visibility, updateDefinition]) !== initialDraft.current;
    if (
      changed &&
      !(await confirmDiscard(
        discardChanges("The saved view name, visibility and settings changes will be lost."),
      ))
    )
      return;
    setDraft(null);
  }
  function create() {
    beginDraft({ id: crypto.randomUUID(), name: "", visibility: "private" });
  }
  function apply(view: SavedView) {
    try {
      onApply(savedViewDefinitionSchema.parse(view.definition));
      announce(`Applied ${view.name}`);
      void personal?.visit({ kind: "saved-view", recordId: view.id }).catch(() => undefined);
      setManaging(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This view could not be applied.");
      setManaging(true);
    }
  }
  async function save() {
    if (!draft || pending) return;
    setPending(true);
    setError(undefined);
    try {
      const destination = new URL(window.location.href);
      destination.searchParams.delete("savedView");
      const currentDefinition = {
        ...definition,
        destination: { href: `${destination.pathname}${destination.search}` },
      };
      await saveNamedView(database(), await context(), {
        ...draft,
        scope,
        definition:
          draft.existing && !updateDefinition
            ? draft.existing.definition
            : (draft.copy?.definition ?? currentDefinition),
        revision: draft.existing?.revision,
      });
      await cache.invalidateQueries({ queryKey: key });
      personal?.reload();
      announce(`Saved ${draft.name.trim()}`);
      setDraft(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The view was not saved.");
    } finally {
      setPending(false);
    }
  }
  const views = query.data?.views ?? [];
  const presentation = views.map((view) => ({
    id: view.id,
    name: view.name,
    visibilityLabel: view.visibility === "workspace" ? "Shared" : "Private",
    favorite: personal?.items.some((item) => item.key === `saved-view:${view.id}` && item.favorite),
    canEdit: view.owner_id === workspace.userId,
    canDelete: view.owner_id === workspace.userId,
    canDuplicate: true,
  }));
  const notice = query.data?.unsupportedCount
    ? `${query.data.unsupportedCount} saved views use unsupported settings and could not be opened.`
    : undefined;
  function withView(id: string, action: (view: SavedView) => void) {
    const view = views.find((candidate) => candidate.id === id);
    if (view) action(view);
  }
  return (
    <>
      <SavedViewPicker
        triggerRef={trigger}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        views={presentation}
        loading={query.isPending}
        error={query.isError ? "Views could not be loaded." : undefined}
        onRetry={() => void query.refetch()}
        notice={notice}
        onApply={(id) => withView(id, apply)}
        onCreate={create}
        onManage={() => {
          setError(undefined);
          setManaging(true);
        }}
      />
      <SavedViewManager
        ref={managerRoot}
        open={managing && !draft}
        onOpenChange={setManaging}
        finalFocus={draft ? false : trigger}
        description="Apply a private or shared view. Only its author can change or delete it."
        views={presentation}
        loading={query.isPending}
        error={query.isError ? "Views could not be loaded." : undefined}
        onRetry={() => void query.refetch()}
        notice={notice}
        favoritePending={personal?.pending}
        onApply={(id) => withView(id, apply)}
        onCreate={create}
        onEdit={(id) =>
          withView(id, (view) =>
            beginDraft({
              id: view.id,
              name: view.name,
              visibility: view.visibility,
              existing: view,
            }),
          )
        }
        onDuplicate={(id) =>
          withView(id, (view) =>
            beginDraft({
              id: crypto.randomUUID(),
              name: `${view.name.slice(0, 95)} copy`,
              visibility: "private",
              copy: view,
            }),
          )
        }
        onDelete={(id) =>
          withView(
            id,
            (view) =>
              void confirm({
                title: `Delete ${view.name}?`,
                description: "This removes the saved view. Source records are unaffected.",
                confirmLabel: "Delete view",
                variant: "danger",
                action: async () => {
                  await deleteNamedView(database(), await context(), view);
                  await cache.invalidateQueries({ queryKey: key });
                  personal?.reload();
                },
              }),
          )
        }
        onFavoriteChange={
          personal
            ? (id, favorite) => {
                void personal
                  .change(favorite ? "favorite" : "unfavorite", {
                    kind: "saved-view",
                    recordId: id,
                  })
                  .catch((cause: unknown) =>
                    setError(
                      cause instanceof Error ? cause.message : "Favorite could not be saved.",
                    ),
                  );
              }
            : undefined
        }
        feedback={
          error ? (
            <Alert tone="danger">
              <AlertDescription>{error}</AlertDescription>
              {requested && (
                <Button
                  onClick={() => {
                    attempted.current = undefined;
                    setError(undefined);
                    void linked.refetch();
                  }}
                >
                  Retry view
                </Button>
              )}
            </Alert>
          ) : undefined
        }
      >
        {confirmation}
      </SavedViewManager>
      <SavedViewEditor
        open={!!draft}
        pending={pending}
        onOpenChange={(value) => {
          if (!value) void closeDraft();
        }}
        finalFocus={() =>
          managerRoot.current?.querySelector<HTMLInputElement>("input") ?? trigger.current ?? false
        }
        title={
          draft?.existing
            ? "Edit saved view"
            : draft?.copy
              ? "Duplicate saved view"
              : "Save current view"
        }
        description={
          draft?.copy
            ? "Create a private copy with the original view's filters, sorting and layout."
            : "Keep the filters, sorting and layout together under a name."
        }
        value={{
          name: draft?.name ?? "",
          visibility: draft?.visibility ?? "private",
          replaceSettings: updateDefinition,
        }}
        onValueChange={(value) => {
          setDraft((current) =>
            current
              ? {
                  ...current,
                  name: value.name,
                  visibility: value.visibility === "workspace" ? "workspace" : "private",
                }
              : null,
          );
          setUpdateDefinition(value.replaceSettings);
        }}
        onSubmit={() => void save()}
        submitLabel={
          draft?.existing ? "Save view" : draft?.copy ? "Create copy" : "Save current view"
        }
        visibilityOptions={[
          { value: "private", label: "Only me" },
          {
            value: "workspace",
            label: "Workspace",
            disabledReason:
              workspace.role === "viewer"
                ? "An editor role is required to share a view with the workspace."
                : undefined,
          },
        ]}
        showReplaceSettings={!!draft?.existing}
        error={error}
      >
        {discardConfirmation}
      </SavedViewEditor>
    </>
  );
}

export function CollectionSavedViews<T extends { id: string }>({
  table,
  scope,
}: {
  table: DataTableInstance<T>;
  scope: string;
}) {
  const state = table.state;
  const definition: SavedViewDefinition = {
    version: 1,
    kind: "table",
    question: {
      serialized: tableQueryToString({
        search: String(state.globalFilter ?? ""),
        sorting: state.sorting,
        filters: state.columnFilters,
      }),
    },
    layout: {
      order: state.columnOrder,
      visibility: state.columnVisibility,
      sizing: state.columnSizing,
      pinning: state.columnPinning,
      density: table.options.meta?.density ?? "default",
      wrap: [...(table.options.meta?.wrapped ?? [])],
      pageSize: state.pagination.pageSize,
    },
  };
  return (
    <SavedViews
      scope={scope}
      definition={definition}
      onApply={(saved) => {
        if (saved.kind !== "table")
          throw new Error("This view belongs to a different kind of collection.");
        const question = tableQueryFromSearch(
          typeof saved.question["serialized"] === "string" ? saved.question["serialized"] : "",
        );
        const ids = new Set(table.getAllLeafColumns().map((column) => column.id));
        table.setGlobalFilter(question.search ?? "");
        table.setSorting((question.sorting ?? []).filter((sort) => ids.has(sort.id)));
        table.setColumnFilters((question.filters ?? []).filter((filter) => ids.has(filter.id)));
        const layout = saved.layout;
        if (layout) {
          if (layout.order) table.setColumnOrder(layout.order.filter((id) => ids.has(id)));
          if (layout.sizing)
            table.setColumnSizing(
              Object.fromEntries(Object.entries(layout.sizing).filter(([id]) => ids.has(id))),
            );
          if (layout.visibility)
            table.setColumnVisibility(
              Object.fromEntries(
                Object.entries(layout.visibility).filter(([id]) =>
                  table.getColumn(id)?.getCanHide(),
                ),
              ),
            );
          if (layout.pinning)
            table.setColumnPinning({
              start: layout.pinning.start.filter((id) => ids.has(id)),
              end: layout.pinning.end.filter((id) => ids.has(id)),
            });
          if (layout.density) table.options.meta?.setDensity?.(layout.density);
          if (layout.wrap)
            table.options.meta?.setWrapped?.(layout.wrap.filter((id) => ids.has(id)));
          if (layout.pageSize && table.options.meta?.pageSizes?.includes(layout.pageSize))
            table.setPageSize(layout.pageSize);
        }
        table.setPageIndex(0);
      }}
    />
  );
}
