import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useId, useMemo, useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { Library, Plus } from "lucide-react";
import {
  Absent,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  DataTable,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Section,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Stack,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { useRows, type Row } from "@/lib/models";
import {
  elementTypeForComponent,
  useLibraryComponentItems,
  type LibraryComponentItem,
} from "@/lib/library-items";
import {
  descendantsOf,
  productElementSpecs,
  productTree,
  type ProductElementSpec,
  type ProductTreeRow,
} from "@/lib/product-items";
import { useRemoveProductElement, useSaveProductElement } from "@/lib/product-revisions";
import { labelFor } from "@/lib/records";
import type { ElementType } from "@/lib/program-wizard";
import { ElementIdentityFields } from "@/components/app/element-fields";
import { LibraryComponentPicker } from "@/components/app/library-component-picker";
import { systemIcon } from "./program-systems-tree";

type ListItem = { key: string; label: string; meta?: string | null };
type StructureRow = ProductElementSpec & {
  typeLabel: string;
  libraryLabel: string;
  configurations: ListItem[];
  children: StructureRow[];
};
type Membership = Row<"product_configuration_elements">;
type ElementDialogTarget = {
  existing?: ProductElementSpec;
  parentId: string | null;
  seed?: Partial<Pick<ProductElementSpec, "code" | "name" | "elementType" | "definedComponentId">>;
  seedLibrary?: LibraryComponentItem;
};

/**
 * The element tree of one product version with the configurations each element is in. In a draft
 * version the row menu edits the tree; a published version reads the same way without the menu.
 */
export function ProductStructure({
  product,
  revision,
  configurations,
  editable,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  configurations: Row<"product_configurations">[];
  editable: boolean;
}) {
  const elements = useRows("product_elements", { product_revision_id: revision.id });
  const memberships = useRows("product_configuration_elements", {
    product_revision_id: revision.id,
  });
  const definedComponents = useRows("defined_components");
  const componentRevisions = useRows("component_definition_revisions");
  const definitions = useRows("component_definitions");
  const library = useLibraryComponentItems();
  const remove = useRemoveProductElement();
  const [sheet, setSheet] = useState<ElementDialogTarget | null>(null);
  const [picking, setPicking] = useState<{ parentId: string | null } | null>(null);
  const [removing, setRemoving] = useState<ProductElementSpec | null>(null);
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
  const membershipsOf = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of memberships.data ?? []) {
      if (!map.has(row.product_element_id)) map.set(row.product_element_id, new Set());
      map.get(row.product_element_id)!.add(row.product_configuration_id);
    }
    return map;
  }, [memberships.data]);
  const rows = useMemo(() => {
    const decorate = (row: ProductTreeRow): StructureRow => {
      const inSet = membershipsOf.get(row.id) ?? new Set<string>();
      const everyActive = active.length > 0 && active.every((item) => inSet.has(item.id));
      const items: ListItem[] = everyActive
        ? [
            {
              key: "all",
              label: "All configurations",
              meta: `${active.length} configuration${active.length === 1 ? "" : "s"}`,
            },
          ]
        : configurations
            .filter((item) => inSet.has(item.id))
            .map((item) => ({
              key: item.id,
              label: item.name,
              meta: item.state === "retired" ? `${item.code} · retired` : item.code,
            }));
      return {
        ...row,
        typeLabel: labelFor(row.elementType),
        libraryLabel: row.library ? `${row.library.definitionName} · v${row.library.version}` : "",
        configurations: items,
        children: row.children.map(decorate),
      };
    };
    return productTree(specs).map(decorate);
  }, [specs, membershipsOf, active, configurations]);
  const columns = useMemo(
    () =>
      defineColumns<StructureRow>((c) => [
        c.text("name", {
          header: "Element",
          minWidth: 260,
          hideable: false,
          cell: (row) => {
            const Icon = systemIcon(row.elementType);
            return (
              <span
                className="flex min-w-0 items-center gap-075"
                title={`${row.code} · ${row.name}`}
              >
                <Icon aria-hidden className="size-200 shrink-0 icon-subtle" />
                <span className="min-w-0 truncate">{row.name}</span>
                {row.library && (
                  <Badge size="xsmall" variant="secondary" tone="information">
                    Library
                  </Badge>
                )}
              </span>
            );
          },
        }),
        c.id("code", { header: "Code", width: 125, cell: (row) => <Id>{row.code}</Id> }),
        c.text("typeLabel", { header: "Type", width: 130 }),
        c.text("libraryLabel", {
          header: "Library",
          width: 220,
          cell: (row) => (row.libraryLabel ? row.libraryLabel : <Absent />),
        }),
        c.list("configurations", {
          header: "Configurations",
          minWidth: 200,
          items: (row) => row.configurations,
          empty: () => <Absent />,
        }),
        ...(canEdit
          ? [
              c.actions((row) => [
                {
                  label: "Edit",
                  onSelect: () => setSheet({ existing: row, parentId: row.parentId }),
                },
                {
                  label: "Add subsystem",
                  onSelect: () =>
                    setSheet({ parentId: row.id, seed: { elementType: "subsystem" } }),
                },
                {
                  label: "Add component",
                  onSelect: () => setSheet({ parentId: row.id, seed: { elementType: "hardware" } }),
                },
                { label: "Add from library…", onSelect: () => setPicking({ parentId: row.id }) },
                { label: "Remove", onSelect: () => setRemoving(row) },
              ]),
            ]
          : []),
      ]),
    [canEdit],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Product structure",
    view: "live-product-structure-v1",
    resizable: true,
    reorderable: true,
    tree: {
      children: (row) => row.children,
      label: (row) => row.code,
      initialExpanded: true,
      guides: true,
    },
  });
  const pending =
    elements.isPending ||
    memberships.isPending ||
    definedComponents.isPending ||
    componentRevisions.isPending ||
    definitions.isPending;
  const loadError =
    elements.error ??
    memberships.error ??
    definedComponents.error ??
    componentRevisions.error ??
    definitions.error;
  const actions = canEdit ? (
    <Inline space="space.100">
      <Button
        size="small"
        variant="secondary"
        iconBefore={<Library />}
        onClick={() => setPicking({ parentId: null })}
      >
        Add from library
      </Button>
      <Button
        size="small"
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setSheet({ parentId: null, seed: { elementType: "subsystem" } })}
      >
        Create element
      </Button>
    </Inline>
  ) : null;
  const removingCount = removing ? descendantsOf(specs, removing.id).length : 0;
  async function confirmRemove() {
    if (!removing) return;
    setError("");
    try {
      await remove.mutateAsync({ elementIds: [removing.id, ...descendantsOf(specs, removing.id)] });
      setRemoving(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove the element.");
    }
  }
  return (
    <Stack space="space.200">
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <DataTable
        responsive
        table={table}
        state={loadError ? "error" : pending ? "loading" : "ready"}
        error={loadError?.message}
        onRowClick={(row) => setSheet({ existing: row, parentId: row.parentId })}
        empty={{
          illustration: "tree",
          title: "No elements in this version",
          description: canEdit
            ? "Add a subsystem or a component, or add one from the library."
            : "This version has no elements.",
          action: actions,
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Find an element"
            actions={actions}
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
      {sheet && (
        <ProductElementDialog
          key={sheet.existing?.id ?? "new"}
          product={product}
          revision={revision}
          specs={specs}
          memberships={memberships.data ?? []}
          configurations={configurations}
          target={sheet}
          readOnly={!canEdit}
          onClose={() => setSheet(null)}
        />
      )}
      {picking && (
        <LibraryComponentPicker
          open
          parentLabel={specs.find((row) => row.id === picking.parentId)?.name ?? product.name}
          items={library.items}
          pending={library.pending}
          onClose={() => setPicking(null)}
          onPick={(item) => {
            setPicking(null);
            setSheet({
              parentId: picking.parentId,
              seed: {
                code: item.definitionCode.toUpperCase(),
                name: item.componentName,
                elementType: elementTypeForComponent(item.componentType),
                definedComponentId: item.id,
              },
              seedLibrary: item,
            });
          }}
        />
      )}
      <AlertDialog
        open={!!removing}
        onOpenChange={(open, details) => {
          if (!open && remove.isPending) {
            details.cancel();
            return;
          }
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingCount
                ? `The ${removingCount} element${removingCount === 1 ? "" : "s"} inside it and every configuration membership are removed with it.`
                : "Its configuration memberships are removed with it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="subtle" disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              isLoading={remove.isPending}
              disabled={remove.isPending}
              onClick={() => void confirmRemove()}
            >
              Remove element
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}

/** One element: identity, which configurations it is in, and the library component it pins. */
function ProductElementDialog({
  product,
  revision,
  specs,
  memberships,
  configurations,
  target,
  readOnly,
  onClose,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  specs: ProductElementSpec[];
  memberships: Membership[];
  configurations: Row<"product_configurations">[];
  target: ElementDialogTarget;
  readOnly: boolean;
  onClose: () => void;
}) {
  const save = useSaveProductElement();
  const id = useId();
  const { confirm, confirmation } = useConfirmation();
  const existing = target.existing;
  const parent = specs.find((row) => row.id === target.parentId) ?? null;
  const active = configurations.filter((row) => row.state === "active");
  const parentIn = new Set(
    parent
      ? memberships
          .filter((row) => row.product_element_id === parent.id)
          .map((row) => row.product_configuration_id)
      : active.map((row) => row.id),
  );
  const [initialIdentity] = useState<{
    name: string;
    code: string;
    description: string;
    type: ElementType | null;
  }>({
    name: existing?.name ?? target.seed?.name ?? "",
    code: existing?.code ?? target.seed?.code ?? "",
    description: existing?.description ?? "",
    type: existing?.elementType ?? target.seed?.elementType ?? "subsystem",
  });
  const [identity, setIdentity] = useState(initialIdentity);
  const definedComponentId =
    existing?.definedComponentId ?? target.seed?.definedComponentId ?? null;
  const [initialChosen] = useState<Set<string>>(
    () =>
      new Set(
        existing
          ? memberships
              .filter((row) => row.product_element_id === existing.id)
              .map((row) => row.product_configuration_id)
          : active.filter((row) => parentIn.has(row.id)).map((row) => row.id),
      ),
  );
  const [chosen, setChosen] = useState(initialChosen);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
  const dirty =
    !readOnly &&
    (identity.name !== initialIdentity.name ||
      identity.code !== initialIdentity.code ||
      identity.description !== initialIdentity.description ||
      identity.type !== initialIdentity.type ||
      chosen.size !== initialChosen.size ||
      [...chosen].some((id) => !initialChosen.has(id)));
  const discardPrompt = discardChanges(
    "Your changes to this element and its configuration memberships have not been saved.",
  );
  const close = async () => {
    if (inFlight.current) return;
    if (!dirty || (await confirm(discardPrompt))) {
      bypassClose.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: async () => {
      if (inFlight.current) return true;
      if (bypassClose.current || !dirty) return false;
      return !(await confirm(discardPrompt));
    },
    enableBeforeUnload: () => !bypassClose.current && (dirty || inFlight.current),
  });
  const descendantIds = existing ? descendantsOf(specs, existing.id) : [];
  const libraryFacts = existing?.library
    ? {
        definition: existing.library.definitionName,
        component: existing.library.componentName,
        version: existing.library.version,
      }
    : target.seedLibrary
      ? {
          definition: target.seedLibrary.definitionName,
          component: target.seedLibrary.componentName,
          version: target.seedLibrary.version,
        }
      : null;
  const leaving = (configurationId: string) =>
    descendantIds.filter((id) =>
      memberships.some(
        (row) => row.product_element_id === id && row.product_configuration_id === configurationId,
      ),
    ).length;
  async function submit() {
    if (readOnly || inFlight.current) return;
    if (!identity.name.trim() || !identity.code.trim() || !identity.type) {
      setError("Enter a name and a code, and choose a type.");
      return;
    }
    inFlight.current = true;
    setError("");
    try {
      const siblings = specs.filter(
        (row) => row.parentId === target.parentId && row.id !== existing?.id,
      );
      await save.mutateAsync({
        revisionId: revision.id,
        element: {
          id: existing?.id,
          revision: existing ? elementRevisions.get(existing.id) : undefined,
          parentId: target.parentId,
          code: identity.code,
          name: identity.name,
          description: identity.description,
          elementType: identity.type,
          definedComponentId,
          position: existing?.position ?? Math.max(-1, ...siblings.map((row) => row.position)) + 1,
        },
        configurationIds: [...chosen],
        existing: memberships.map((row) => ({
          id: row.id,
          product_configuration_id: row.product_configuration_id,
          product_element_id: row.product_element_id,
        })),
        descendantIds,
      });
      bypassClose.current = true;
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the element.");
    } finally {
      inFlight.current = false;
    }
  }
  const elementRevisions = useElementRevisions(revision.id);
  const noun = existing?.library || target.seedLibrary ? "component" : "element";
  const title = readOnly
    ? (existing?.name ?? "Element")
    : `${existing ? "Edit" : "Create"} ${noun}`;
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 620 }} showCloseButton={!save.isPending}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Under {parent ? parent.name : product.name}
            {readOnly ? ". This version is published; open a draft version to change it." : "."}
          </DialogDescription>
        </DialogHeader>
        <form
          id={`${id}-form`}
          noValidate
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset
            disabled={save.isPending}
            aria-busy={save.isPending}
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-none px-200 py-150"
          >
            <Stack space="space.200">
              <Section title="Identity">
                {readOnly ? (
                  <Stack space="space.050">
                    <KeyValue label="Name" wrap>
                      {identity.name}
                    </KeyValue>
                    <KeyValue label="Code">
                      <Id>{identity.code}</Id>
                    </KeyValue>
                    <KeyValue label="Description" wrap>
                      {identity.description || "Not recorded"}
                    </KeyValue>
                    <KeyValue label="Type">{labelFor(identity.type ?? "other")}</KeyValue>
                  </Stack>
                ) : (
                  <Stack space="space.150">
                    <ElementIdentityFields
                      value={identity}
                      onChange={(patch) => {
                        if (!inFlight.current)
                          setIdentity((previous) => ({ ...previous, ...patch }));
                      }}
                      typeLocked={definedComponentId ? "from the component" : undefined}
                      codeHint="Unique within this product version."
                      autoFocus
                    />
                  </Stack>
                )}
              </Section>
              <Section title="Configurations">
                {active.length ? (
                  <Stack space="space.100">
                    {active.map((configuration) => {
                      const blocked = !parentIn.has(configuration.id);
                      const inside = chosen.has(configuration.id) ? leaving(configuration.id) : 0;
                      return (
                        <Stack key={configuration.id} space="space.025">
                          <label className="flex items-center gap-075 font-body-small">
                            <Checkbox
                              checked={chosen.has(configuration.id)}
                              disabled={readOnly || blocked || save.isPending}
                              onCheckedChange={(checked) => {
                                if (inFlight.current) return;
                                setChosen((previous) => {
                                  const next = new Set(previous);
                                  if (checked) next.add(configuration.id);
                                  else next.delete(configuration.id);
                                  return next;
                                });
                              }}
                            />
                            {configuration.name}
                          </label>
                          {blocked && parent ? (
                            <span className="ps-300 font-body-xsmall text-subtle">
                              Not in {configuration.name}: {parent.name} is not a member.
                            </span>
                          ) : null}
                          {!readOnly && inside ? (
                            <span className="ps-300 font-body-xsmall text-subtle">
                              Unticking removes the {inside} element{inside === 1 ? "" : "s"} inside
                              from {configuration.name} too.
                            </span>
                          ) : null}
                        </Stack>
                      );
                    })}
                  </Stack>
                ) : (
                  <Empty size="compact">
                    <EmptyHeader>
                      <EmptyTitle>No configurations yet</EmptyTitle>
                      <EmptyDescription>
                        Add configurations on the Configurations tab; an element joins them here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Section>
              {libraryFacts ? (
                <Inspector.Group title="From the library">
                  <KeyValue label="Definition" wrap>
                    {libraryFacts.definition}
                  </KeyValue>
                  <KeyValue label="Component" wrap>
                    {libraryFacts.component}
                  </KeyValue>
                  <KeyValue label="Version">{libraryFacts.version}</KeyValue>
                  <p className="font-body-xsmall text-subtle">
                    A program that creates a variant from this product inherits this component's
                    claimed controls for the element.
                  </p>
                </Inspector.Group>
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
          {readOnly ? (
            <Button variant="primary" onClick={close}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="subtle" disabled={save.isPending} onClick={close}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={save.isPending}
                disabled={save.isPending}
                type="submit"
                form={`${id}-form`}
              >
                {existing ? `Save ${noun}` : `Create ${noun}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}

/** The CAS revision of every element in a version, for the sheet's update. */
function useElementRevisions(revisionId: string) {
  const elements = useRows("product_elements", { product_revision_id: revisionId });
  return useMemo(
    () => new Map((elements.data ?? []).map((row) => [row.id, row.revision])),
    [elements.data],
  );
}
