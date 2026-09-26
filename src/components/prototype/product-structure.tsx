import { useConfirmation } from "@/components/app/confirmation";
import { ElementIdentityFields } from "@/components/app/element-fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { LibraryComponentPicker } from "@/components/app/library-component-picker";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  elementTypeForComponent,
  useLibraryComponentItems,
  type LibraryComponentItem,
} from "@/lib/library-items";
import { useRows, type Row } from "@/lib/models";
import {
  descendantsOf,
  productElementSpecs,
  productTree,
  type ProductElementSpec,
  type ProductTreeRow,
} from "@/lib/product-items";
import { useRemoveProductElement, useSaveProductElement } from "@/lib/product-revisions";
import type { ElementType } from "@/lib/program-wizard";
import { labelFor } from "@/lib/records";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  CheckboxGroupSelectAll,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Icon,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Stack,
  Text,
  defineColumns,
  toast,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Plus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ProductCollection } from "./product-collection";
import { systemIcon } from "./program-systems-tree";
import { RecordLink, recordDestination, useDisplayedRecords } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { EmptyMessage } from "./work-common";

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

const messageOf = (cause: unknown, fallback = "The request failed.") =>
  cause instanceof Error ? cause.message : fallback;

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
  const { formatPlural } = useLedgerLocale();
  const [sheet, setSheet] = useState<ElementDialogTarget | null>(null);
  const [picking, setPicking] = useState<{ parentId: string | null } | null>(null);
  const { confirm, confirmation } = useConfirmation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StructureRow | null>(null);
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
              meta: formatPlural(active.length, {
                one: "{count} configuration",
                other: "{count} configurations",
              }),
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
  }, [specs, membershipsOf, active, configurations, formatPlural]);
  const removeMutate = remove.mutateAsync;
  const confirmRemove = useCallback(
    async (removing: ProductElementSpec) => {
      const inside = descendantsOf(specs, removing.id);
      const removed = await confirm({
        title: `Remove ${removing.name}?`,
        description: inside.length
          ? `The ${formatPlural(inside.length, { one: "element", other: "{count} elements" })} inside it and every configuration membership are removed with it.`
          : "Its configuration memberships are removed with it.",
        confirmLabel: "Remove element",
        variant: "danger",
        failureTitle: `${removing.name} was not removed`,
        action: () => removeMutate({ elementIds: [removing.id, ...inside] }),
      });
      if (!removed) return;
      setSelected((current) =>
        current && (current.id === removing.id || inside.includes(current.id)) ? null : current,
      );
      toast.add({ type: "success", title: `${removing.name} removed` });
    },
    [confirm, removeMutate, specs, formatPlural],
  );
  const columns = useMemo(
    () =>
      defineColumns<StructureRow>((c) => [
        c.text("name", {
          header: "Element",
          minWidth: 220,
          priority: 0,
          hideable: false,
          cell: (row) => {
            const TypeIcon = systemIcon(row.elementType);
            return (
              <Inline space="space.075" alignBlock="center" className="min-w-0">
                <Icon label={row.typeLabel} size="medium" color="color.icon.subtle">
                  <TypeIcon />
                </Icon>
                <RecordLink table="product_elements" record={row}>
                  {row.name}
                </RecordLink>
                {row.library && (
                  <Badge size="xsmall" variant="secondary" tone="information">
                    Library
                  </Badge>
                )}
              </Inline>
            );
          },
        }),
        c.id("code", {
          header: "Code",
          width: 125,
          priority: 1,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.text("typeLabel", { header: "Type", width: 130 }),
        c.text("libraryLabel", { header: "Library", width: 220 }),
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
                  label: `Edit ${row.library ? "component" : "element"}`,
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
                {
                  label: "Remove element",
                  tone: "danger" as const,
                  onSelect: () => void confirmRemove(row),
                },
              ]),
            ]
          : []),
      ]),
    [canEdit, selected?.id, confirmRemove],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
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
  const displayed = useDisplayedRecords(table);
  const createButton = (size: "small" | "medium") =>
    canEdit ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setSheet({ parentId: null, seed: { elementType: "subsystem" } })}
      >
        Create element
      </Button>
    ) : null;
  return (
    <>
      <ProductCollection
        commands={
          canEdit
            ? [{ label: "Add from library", onSelect: () => setPicking({ parentId: null }) }]
            : []
        }
        table={table}
        queries={[elements, memberships, definedComponents, componentRevisions, definitions]}
        onRowClick={(row) => void navigate(recordDestination("product_elements", row))}
        empty={{
          illustration: "tree",
          title: "No elements in this version",
          description: canEdit
            ? "Add a subsystem or a component, or add one from the library."
            : "Nobody has added an element to this version.",
          action: createButton("medium"),
        }}
        fill
        searchLabel="Find an element"
        action={createButton("small")}
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
      {confirmation}
      {selected && (
        <RecordSummaryPreview
          model="product_elements"
          readOnly={!canEdit}
          onEdit={() => setSheet({ existing: selected, parentId: selected.parentId })}
          record={selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
          fields={[
            { key: "code" },
            { key: "description" },
            { key: "typeLabel", label: "Type" },
            {
              key: "libraryLabel",
              label: "Library",
              render: (row) => row.libraryLabel || <Absent label="Not from the library" />,
            },
          ]}
        />
      )}
    </>
  );
}

type IdentityField = "name" | "code" | "description" | "type";

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
  const formId = useId();
  const [open, setOpen] = useState(true);
  const feedback = useFormFeedback<IdentityField>();
  const { formatPlural } = useLedgerLocale();
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<string | null>(null);
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
  // The configurations this element can join: those its parent is in.
  const joinable = active.filter((row) => parentIn.has(row.id)).map((row) => row.id);
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
          : joinable,
      ),
  );
  const [chosen, setChosen] = useState(initialChosen);
  const dirty =
    !readOnly &&
    (identity.name !== initialIdentity.name ||
      identity.code !== initialIdentity.code ||
      identity.description !== initialIdentity.description ||
      identity.type !== initialIdentity.type ||
      chosen.size !== initialChosen.size ||
      [...chosen].some((id) => !initialChosen.has(id)));
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "Your changes to this element and its configuration memberships will be lost.",
  });
  const issues: FormIssue<IdentityField>[] = [
    ...(identity.name.trim() ? [] : [{ field: "name" as const, message: "Enter a name." }]),
    ...(identity.code.trim() ? [] : [{ field: "code" as const, message: "Enter a code." }]),
    ...(identity.type ? [] : [{ field: "type" as const, message: "Choose a type." }]),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
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
  const elementRevisions = useElementRevisions(revision.id);
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (readOnly || guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    const type = identity.type;
    if (!type) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
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
          code: identity.code.trim(),
          name: identity.name.trim(),
          description: identity.description,
          elementType: type,
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
      guard.finish();
      toast.add({
        type: "success",
        title: `${identity.name.trim()} ${existing ? "saved" : "created"}`,
      });
      guard.complete();
    } catch (cause) {
      setFailure(`${messageOf(cause)} Your changes are kept.`);
      guard.finish();
    }
  }
  const noun = existing?.library || target.seedLibrary ? "component" : "element";
  const title = readOnly
    ? (existing?.name ?? "Element")
    : `${existing ? "Edit" : "Create"} ${noun}`;
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
      <DialogContent
        width="large"
        initialFocus={readOnly ? true : () => feedback.node("name") ?? true}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Under {parent ? parent.name : product.name}
            {readOnly ? ". This version is published; open a draft version to change it." : "."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.250">
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The {noun} was not saved</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.250">
                  {readOnly ? (
                    <KeyValue.Group>
                      <KeyValue label="Name" wrap>
                        {identity.name}
                      </KeyValue>
                      <KeyValue label="Code">
                        <Id>{identity.code}</Id>
                      </KeyValue>
                      <KeyValue label="Description" wrap>
                        {identity.description || <Absent label="No description" />}
                      </KeyValue>
                      <KeyValue label="Type">{labelFor(identity.type ?? "other")}</KeyValue>
                    </KeyValue.Group>
                  ) : (
                    <Stack space="space.200">
                      <ElementIdentityFields
                        value={identity}
                        onChange={(patch) => {
                          if (!guard.busy) setIdentity((previous) => ({ ...previous, ...patch }));
                        }}
                        typeLocked={definedComponentId ? "from the component" : undefined}
                        codeHint="Unique within this product version."
                        errors={{
                          name: errors.get("name"),
                          code: errors.get("code"),
                          type: errors.get("type"),
                        }}
                        controlRef={feedback.ref}
                      />
                    </Stack>
                  )}
                  {active.length ? (
                    <CheckboxGroup
                      value={[...chosen]}
                      onValueChange={(value) => setChosen(new Set(value))}
                      allValues={joinable}
                      disabled={readOnly}
                    >
                      <FieldLegend>Configurations</FieldLegend>
                      {!readOnly && joinable.length > 1 ? (
                        <CheckboxGroupSelectAll>Every configuration</CheckboxGroupSelectAll>
                      ) : null}
                      <Stack
                        space="space.100"
                        className={!readOnly && joinable.length > 1 ? "ps-300" : undefined}
                      >
                        {active.map((configuration) => {
                          const blocked = !parentIn.has(configuration.id);
                          const inside = chosen.has(configuration.id)
                            ? leaving(configuration.id)
                            : 0;
                          return (
                            <Field
                              key={configuration.id}
                              orientation="horizontal"
                              disabled={blocked}
                            >
                              <Checkbox value={configuration.id} />
                              <FieldContent>
                                <FieldLabel>{configuration.name}</FieldLabel>
                                {blocked && parent ? (
                                  <FieldDescription>
                                    Not available: {parent.name} is not in {configuration.name}.
                                  </FieldDescription>
                                ) : null}
                                {!readOnly && inside ? (
                                  <FieldDescription>
                                    Unticking removes the{" "}
                                    {formatPlural(inside, {
                                      one: "element",
                                      other: "{count} elements",
                                    })}{" "}
                                    inside from {configuration.name} too.
                                  </FieldDescription>
                                ) : null}
                              </FieldContent>
                            </Field>
                          );
                        })}
                      </Stack>
                    </CheckboxGroup>
                  ) : (
                    <EmptyMessage
                      compact
                      title="No configurations yet"
                      description="Create configurations on the Configurations tab; an element joins them here."
                    />
                  )}
                  {libraryFacts ? (
                    <Inspector.Group title="From the library">
                      <KeyValue.Group>
                        <KeyValue label="Definition" wrap>
                          {libraryFacts.definition}
                        </KeyValue>
                        <KeyValue label="Component" wrap>
                          {libraryFacts.component}
                        </KeyValue>
                        <KeyValue label="Version">{libraryFacts.version}</KeyValue>
                      </KeyValue.Group>
                      <Text as="p" size="small" color="color.text.subtle">
                        A program that creates a variant from this product inherits this
                        component&apos;s claimed controls for the element.
                      </Text>
                    </Inspector.Group>
                  ) : null}
                </Stack>
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          {readOnly ? (
            <DialogClose render={<Button variant="primary" />}>Close</DialogClose>
          ) : (
            <>
              <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
              <Button
                ref={submitRef}
                variant="primary"
                isLoading={guard.busy}
                type="submit"
                form={formId}
              >
                {existing ? `Edit ${noun}` : `Create ${noun}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

/** The CAS revision of every element in a version, for the dialog's update. */
function useElementRevisions(revisionId: string) {
  const elements = useRows("product_elements", { product_revision_id: revisionId });
  return useMemo(
    () => new Map((elements.data ?? []).map((row) => [row.id, row.revision])),
    [elements.data],
  );
}
