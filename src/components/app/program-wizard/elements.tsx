import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Boxes, MoreHorizontal, Plus } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Grid,
  IconButton,
  Inline,
  Inspector,
  KeyValue,
  Section,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  TextLink,
  Tree,
} from "@ledger/design-system";
import type { Row } from "@/lib/models";
import { elementTypeForComponent, type LibraryComponentItem } from "@/lib/library-items";
import {
  expandProductConfiguration,
  productItemFor,
  type ProductConfigurationItem,
} from "@/lib/product-items";
import { labelFor } from "@/lib/records";
import type {
  ElementWizardDraft,
  ProgramWizardDraft,
  SystemWizardDraft,
} from "@/lib/program-wizard";
import { suggestProfileKey } from "@/lib/profile-suggestion";
import type { ProgramTailoringPreview, WizardProfileOption } from "@/lib/program-wizard-reference";
import { ElementIdentityFields } from "../element-fields";
import { ChoiceField, PartyField, TextField } from "../fields";
import { LibraryComponentPicker } from "../library-component-picker";
import { ProductConfigurationPicker } from "../product-configuration-picker";

const systemTypes = [
  { value: "information_system", label: "Information system" },
  { value: "industrial_control_system", label: "Industrial control system" },
  { value: "platform", label: "Platform" },
  { value: "service", label: "Service" },
];
const impacts = ["low", "moderate", "high"].map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
}));
type Editing = { systemKey: string; elementKey: string | null } | null;
type Adding = { systemKey: string; parentKey: string | null } | null;

/**
 * Step 3: the systems, what is inside them, and what each adopts. A system carries its
 * categorization and the program profile it adopts; subsystems and components are elements of the
 * tree; a component pulled from the library is an element with the library instance pinned; a
 * system created from a product configuration is a variant whose inherited elements keep their
 * lineage.
 */
export function ElementsStep({
  draft,
  onChange,
  parties,
  profiles,
  previews,
  libraryItems,
  libraryPending,
  productItems,
  productPending,
  newSystem,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  parties: Row<"parties">[];
  profiles: WizardProfileOption[];
  previews: Map<string, ProgramTailoringPreview>;
  libraryItems: LibraryComponentItem[];
  libraryPending: boolean;
  productItems: ProductConfigurationItem[];
  productPending: boolean;
  newSystem: () => SystemWizardDraft;
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const [adding, setAdding] = useState<Adding>(null);
  const [pickingProduct, setPickingProduct] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(draft.systems.map((system) => system.key)),
  );
  const system = draft.systems.find((item) => item.key === editing?.systemKey);
  const element = system?.elements.find((item) => item.key === editing?.elementKey);
  const target = editing?.elementKey ? element : system;
  const addingSystem = draft.systems.find((item) => item.key === adding?.systemKey);
  const addingParent = addingSystem?.elements.find((item) => item.key === adding?.parentKey);
  const programProfiles = draft.profiles.map((profile) => {
    const option = profiles.find((item) => item.id === profile.baseResolutionId);
    const preview = previews.get(profile.key);
    const changed = profile.tailoring.length || profile.parameters.length;
    return {
      value: profile.key,
      label: `${option?.title ?? "Unavailable profile"} · ${option?.version ?? ""}${
        changed ? ` · Out ${preview?.counts.excluded ?? 0} · In ${preview?.counts.added ?? 0}` : ""
      } · ${preview?.counts.selected ?? 0} controls`,
    };
  });
  function patchSystem(key: string, patch: Partial<SystemWizardDraft>) {
    onChange({
      ...draft,
      systems: draft.systems.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    });
  }
  function patchElement(systemKey: string, elementKey: string, patch: Partial<ElementWizardDraft>) {
    const parent = draft.systems.find((item) => item.key === systemKey);
    if (!parent) return;
    patchSystem(systemKey, {
      elements: parent.elements.map((item) =>
        item.key === elementKey ? { ...item, ...patch } : item,
      ),
    });
  }
  function toggle(key: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function addSystem(added: SystemWizardDraft) {
    onChange({ ...draft, systems: [...draft.systems, added] });
    setExpanded((previous) => new Set(previous).add(added.key));
    setEditing({ systemKey: added.key, elementKey: null });
  }
  function addElement(
    parentSystem: SystemWizardDraft,
    parentKey: string | null,
    values: Partial<ElementWizardDraft>,
  ) {
    const key = crypto.randomUUID();
    patchSystem(parentSystem.key, {
      elements: [
        ...parentSystem.elements,
        {
          key,
          parentKey,
          code: "",
          name: "",
          description: "",
          type: "subsystem",
          library: null,
          productElementId: null,
          ...values,
        },
      ],
    });
    setExpanded((previous) => new Set(previous).add(parentKey ?? parentSystem.key));
    setEditing({ systemKey: parentSystem.key, elementKey: key });
  }
  function removeElement(parentSystem: SystemWizardDraft, key: string) {
    const removed = new Set([key]);
    let previousSize = 0;
    while (previousSize !== removed.size) {
      previousSize = removed.size;
      parentSystem.elements.forEach((item) => {
        if (item.parentKey && removed.has(item.parentKey)) removed.add(item.key);
      });
    }
    if (
      removed.size > 1 &&
      !window.confirm(`Remove this element and the ${removed.size - 1} inside it from the draft?`)
    )
      return;
    patchSystem(parentSystem.key, {
      elements: parentSystem.elements.filter((item) => !removed.has(item.key)),
    });
    if (editing?.elementKey && removed.has(editing.elementKey)) setEditing(null);
  }
  function removeSystem(item: SystemWizardDraft) {
    if (!window.confirm(`Remove ${item.name || "this system"} and its setup from the draft?`))
      return;
    onChange({ ...draft, systems: draft.systems.filter((other) => other.key !== item.key) });
    if (editing?.systemKey === item.key) setEditing(null);
  }
  function libraryMeta(parentSystem: SystemWizardDraft, item: ElementWizardDraft) {
    if (!item.library) return null;
    const definition = libraryItems.find((entry) => entry.id === item.library!.definedComponentId);
    if (!definition) return { definition: null, claims: 0, seed: 0 };
    const selected = new Set(
      previews.get(parentSystem.profileKey)?.selectedControls.map((control) => control.id) ?? [],
    );
    const seed = definition.claimControlIds.filter((id) => selected.has(id)).length;
    return { definition, claims: definition.claimControlIds.length, seed };
  }
  function productMeta(parentSystem: SystemWizardDraft) {
    const item = productItemFor(parentSystem, productItems);
    const inherited = parentSystem.elements.filter((row) => row.productElementId).length;
    return {
      item,
      inherited,
      removed: item ? item.elements.length - inherited : 0,
      added: parentSystem.elements.length - inherited,
    };
  }
  function rowMenu(parentSystem: SystemWizardDraft, item: ElementWizardDraft | null) {
    const name = item ? item.name || "unnamed element" : parentSystem.name || "unnamed system";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              variant="subtle"
              size="small"
              icon={<MoreHorizontal />}
              label={`Row actions for ${name}`}
            />
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              setEditing({ systemKey: parentSystem.key, elementKey: item?.key ?? null })
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addElement(parentSystem, item?.key ?? null, { type: "subsystem" })}
          >
            Add subsystem
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addElement(parentSystem, item?.key ?? null, { type: null })}
          >
            Add component
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setAdding({ systemKey: parentSystem.key, parentKey: item?.key ?? null })}
          >
            Add from library…
          </DropdownMenuItem>
          {item || draft.systems.length > 1 ? (
            <DropdownMenuItem
              onClick={() =>
                item ? removeElement(parentSystem, item.key) : removeSystem(parentSystem)
              }
            >
              Remove
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  function elementRows(
    parentSystem: SystemWizardDraft,
    parentKey: string | null,
    depth: number,
  ): React.ReactNode[] {
    return parentSystem.elements
      .filter((item) => item.parentKey === parentKey)
      .flatMap((item) => {
        const hasChildren = parentSystem.elements.some((child) => child.parentKey === item.key);
        const meta = libraryMeta(parentSystem, item);
        return [
          <Tree.Item
            key={item.key}
            depth={depth}
            hasChildren={hasChildren}
            expanded={expanded.has(item.key)}
            onToggle={() => toggle(item.key)}
            isSelected={editing?.elementKey === item.key}
            onSelect={() => setEditing({ systemKey: parentSystem.key, elementKey: item.key })}
            trailing={
              <>
                {item.productElementId ? (
                  <Badge size="xsmall" variant="secondary" tone="information">
                    Product
                  </Badge>
                ) : null}
                {meta ? (
                  <>
                    <Badge size="xsmall" variant="secondary" tone="information">
                      Library
                    </Badge>
                    <span
                      className="truncate font-body-xsmall text-subtle"
                      style={{ maxWidth: 360 }}
                      title={
                        meta.definition
                          ? `${meta.definition.definitionName} · v${meta.definition.version}`
                          : undefined
                      }
                    >
                      {meta.definition
                        ? `${meta.definition.definitionName} · v${meta.definition.version} · ${meta.claims} claims · ${meta.seed} seed · ${meta.claims - meta.seed} not in baseline`
                        : "Library version no longer published"}
                    </span>
                  </>
                ) : (
                  <span className="font-body-xsmall text-subtle">
                    {item.type ? labelFor(item.type) : "Type required"}
                  </span>
                )}
                {rowMenu(parentSystem, item)}
              </>
            }
          >
            <span className="truncate font-body">{item.name || "Unnamed element"}</span>
            <span className="truncate font-body-xsmall text-subtle">
              {item.code || "Code required"}
            </span>
          </Tree.Item>,
          ...(expanded.has(item.key) ? elementRows(parentSystem, item.key, depth + 1) : []),
        ];
      });
  }
  const suggestion = system && !element ? suggestProfileKey(system, draft, profiles) : null;
  const suggestedLabel = suggestion
    ? programProfiles.find((option) => option.value === suggestion.key)?.label
    : null;
  const editingMeta = system && element ? libraryMeta(system, element) : null;
  const editingProduct = system ? productMeta(system) : null;
  const editingProductElement =
    element?.productElementId && editingProduct?.item
      ? (editingProduct.item.elements.find((row) => row.id === element.productElementId) ?? null)
      : null;
  return (
    <Section
      title="Systems and components"
      count={`${draft.systems.length} system${draft.systems.length === 1 ? "" : "s"}`}
      action={
        <Inline space="space.100">
          <Button
            size="small"
            variant="secondary"
            iconBefore={<Boxes />}
            onClick={() => setPickingProduct(true)}
          >
            From a product…
          </Button>
          <Button size="small" iconBefore={<Plus />} onClick={() => addSystem(newSystem())}>
            Add system
          </Button>
        </Inline>
      }
    >
      <p className="pb-100 font-body-small text-subtle">
        Define each system, categorize it and choose the program profile it adopts. Subsystems and
        components are the elements inside it; a component from the library brings its claimed
        controls. A system from a product is a variant of one of its configurations.
      </p>
      <Tree label="Systems and components">
        {draft.systems.flatMap((item) => {
          const lineage = productItemFor(item, productItems);
          return [
            <Tree.Item
              key={item.key}
              depth={0}
              hasChildren={item.elements.length > 0}
              expanded={expanded.has(item.key)}
              onToggle={() => toggle(item.key)}
              isSelected={editing?.systemKey === item.key && !editing.elementKey}
              onSelect={() => setEditing({ systemKey: item.key, elementKey: null })}
              trailing={
                <>
                  <Badge size="xsmall" variant="secondary" tone="information">
                    {item.product ? "Variant" : "System"}
                  </Badge>
                  {item.product ? (
                    <span
                      className="truncate font-body-xsmall text-subtle"
                      style={{ maxWidth: 240 }}
                      title={
                        lineage
                          ? `${lineage.productName} · ${lineage.configurationName} · v${lineage.version}`
                          : undefined
                      }
                    >
                      {lineage
                        ? `${lineage.productName} · ${lineage.configurationName} · v${lineage.version}`
                        : "Product version no longer published"}
                    </span>
                  ) : null}
                  <span
                    className="truncate font-body-xsmall text-subtle"
                    style={{ maxWidth: 360 }}
                    title={
                      programProfiles.find((option) => option.value === item.profileKey)?.label
                    }
                  >
                    {item.profileKey
                      ? (programProfiles.find((option) => option.value === item.profileKey)
                          ?.label ?? "Profile unavailable")
                      : "Choose a program profile"}
                  </span>
                  {rowMenu(item, null)}
                </>
              }
            >
              <span className="truncate font-body">{item.name || "Unnamed system"}</span>
              <span className="truncate font-body-xsmall text-subtle">
                {item.code || "Code required"}
              </span>
            </Tree.Item>,
            ...(expanded.has(item.key) ? elementRows(item, null, 1) : []),
          ];
        })}
      </Tree>
      <Sheet
        open={!!target}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <SheetContent side="end" style={{ maxWidth: 480 }}>
          <SheetHeader>
            <SheetTitle>
              {element
                ? element.library
                  ? "Component"
                  : "Element"
                : system?.product
                  ? "Variant"
                  : "System"}{" "}
              · {target?.name || "Unnamed"}
            </SheetTitle>
            <SheetDescription>
              {element
                ? `Inside ${system?.name || "the system"}. Categorization and the baseline are set on the system.`
                : system?.product
                  ? "A variant of a product configuration: its owner, categorization and the program profile it adopts. Inherited elements keep their lineage; add what is specific to this program."
                  : "The system boundary: its owner, categorization, and the program profile it adopts."}
            </SheetDescription>
          </SheetHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            {system && !element ? (
              <Stack space="space.200">
                <Section title="Identity">
                  <Stack space="space.150">
                    <TextField
                      label="Name"
                      value={system.name}
                      onChange={(name) => patchSystem(system.key, { name })}
                      required
                      autoFocus
                    />
                    <TextField
                      label="Code"
                      value={system.code}
                      onChange={(code) => patchSystem(system.key, { code })}
                      required
                      description="Your stable identifier for this record."
                    />
                    <TextField
                      label="Function"
                      value={system.description}
                      onChange={(description) => patchSystem(system.key, { description })}
                      multiline
                      description="What it does for the mission."
                    />
                    <ChoiceField
                      label="Type"
                      value={system.type}
                      onChange={(type) =>
                        patchSystem(system.key, { type: type as SystemWizardDraft["type"] })
                      }
                      options={systemTypes}
                      required
                    />
                    <PartyField
                      label="System owner"
                      value={system.ownerPartyId}
                      onChange={(ownerPartyId) => patchSystem(system.key, { ownerPartyId })}
                      parties={parties}
                    />
                  </Stack>
                </Section>
                <Section title="Categorization">
                  <Stack space="space.150">
                    <Grid gap="space.150" templateColumns="repeat(3,minmax(0,1fr))">
                      {(["confidentiality", "integrity", "availability"] as const).map(
                        (objective) => (
                          <ChoiceField
                            key={objective}
                            label={objective[0]!.toUpperCase() + objective.slice(1)}
                            value={system[objective]}
                            options={impacts}
                            required
                            onChange={(value) =>
                              patchSystem(system.key, {
                                [objective]: value as SystemWizardDraft[typeof objective],
                              })
                            }
                          />
                        ),
                      )}
                    </Grid>
                    <TextField
                      label="Categorization rationale"
                      value={system.categorizationRationale}
                      onChange={(categorizationRationale) =>
                        patchSystem(system.key, { categorizationRationale })
                      }
                      required
                      multiline
                      description="Explain the impact of a loss of confidentiality, integrity, or availability."
                    />
                  </Stack>
                </Section>
                <Section title="Baseline">
                  <Stack space="space.100">
                    <ChoiceField
                      label="Program profile"
                      value={system.profileKey}
                      options={programProfiles}
                      onChange={(profileKey) =>
                        patchSystem(system.key, { profileKey: profileKey ?? "" })
                      }
                      required
                      description="The program profile this system adopts. Categorization suggests one; the choice is always explicit."
                    />
                    {suggestion && suggestedLabel && system.profileKey !== suggestion.key ? (
                      <Stack space="space.050">
                        <span className="font-body-small text-subtle">
                          Suggested from categorization ({suggestion.level}): {suggestedLabel}
                        </span>
                        <Button
                          size="small"
                          variant="subtle"
                          onClick={() => patchSystem(system.key, { profileKey: suggestion.key })}
                        >
                          Use suggestion
                        </Button>
                      </Stack>
                    ) : null}
                    {!programProfiles.length ? (
                      <span className="font-body-small text-danger">
                        Choose at least one base profile in the Catalog & profiles step.
                      </span>
                    ) : null}
                  </Stack>
                </Section>
                {system.product && editingProduct ? (
                  <Inspector.Group title="From a product">
                    <KeyValue label="Product" wrap>
                      {editingProduct.item ? (
                        <TextLink
                          render={
                            <Link
                              to="/library/products/$productKey"
                              params={{ productKey: editingProduct.item.productId }}
                              search={{ version: editingProduct.item.revisionId }}
                            />
                          }
                          target="_blank"
                        >
                          {editingProduct.item.productName}
                        </TextLink>
                      ) : (
                        "No longer published"
                      )}
                    </KeyValue>
                    <KeyValue label="Configuration" wrap>
                      {editingProduct.item?.configurationName ?? "—"}
                    </KeyValue>
                    <KeyValue label="Version">
                      {editingProduct.item ? `v${editingProduct.item.version}` : "—"}
                    </KeyValue>
                    <KeyValue label="Elements inherited">{editingProduct.inherited}</KeyValue>
                    <KeyValue label="Removed">{editingProduct.removed}</KeyValue>
                    <KeyValue label="Added">{editingProduct.added}</KeyValue>
                  </Inspector.Group>
                ) : null}
              </Stack>
            ) : null}
            {system && element ? (
              <Stack space="space.200">
                <Section title="Identity">
                  <Stack space="space.150">
                    <ElementIdentityFields
                      value={element}
                      onChange={(patch) => patchElement(system.key, element.key, patch)}
                      typeLocked={
                        element.library
                          ? "from the component"
                          : element.productElementId
                            ? "from the product"
                            : undefined
                      }
                      descriptionLabel="Function"
                      autoFocus
                    />
                  </Stack>
                </Section>
                {element.productElementId ? (
                  <Inspector.Group title="From a product">
                    <KeyValue label="Product element" wrap>
                      {editingProductElement
                        ? `${editingProductElement.code} · ${editingProductElement.name}`
                        : "No longer published"}
                    </KeyValue>
                    <KeyValue label="Product" wrap>
                      {editingProduct?.item
                        ? `${editingProduct.item.productName} v${editingProduct.item.version} · ${editingProduct.item.configurationName}`
                        : "—"}
                    </KeyValue>
                  </Inspector.Group>
                ) : null}
                {element.library ? (
                  <Inspector.Group title="From the library">
                    <KeyValue label="Definition" wrap>
                      {editingMeta?.definition?.definitionName ?? "No longer published"}
                    </KeyValue>
                    <KeyValue label="Version">{editingMeta?.definition?.version ?? "—"}</KeyValue>
                    <KeyValue label="Claimed controls">{editingMeta?.claims ?? 0}</KeyValue>
                    <KeyValue label="Will seed">{editingMeta?.seed ?? 0}</KeyValue>
                    <KeyValue label="Not in baseline">
                      {(editingMeta?.claims ?? 0) - (editingMeta?.seed ?? 0)}
                    </KeyValue>
                    <TextField
                      label="Rationale"
                      value={element.library.rationale}
                      onChange={(rationale) =>
                        patchElement(system.key, element.key, {
                          library: { ...element.library!, rationale },
                        })
                      }
                      required
                      multiline
                      description="Why this library component applies here."
                    />
                  </Inspector.Group>
                ) : null}
              </Stack>
            ) : null}
          </Box>
          <SheetFooter>
            <Button variant="primary" onClick={() => setEditing(null)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {adding && addingSystem ? (
        <LibraryComponentPicker
          open
          parentLabel={addingParent?.name || addingSystem.name || "the system"}
          items={libraryItems}
          pending={libraryPending}
          onClose={() => setAdding(null)}
          onPick={(item) => {
            addElement(addingSystem, adding.parentKey, {
              code: item.definitionCode.toUpperCase(),
              name: item.componentName,
              description: "",
              type: elementTypeForComponent(item.componentType),
              library: {
                definedComponentId: item.id,
                revisionId: item.revisionId,
                rationale: "",
              },
            });
            setAdding(null);
          }}
        />
      ) : null}
      {pickingProduct ? (
        <ProductConfigurationPicker
          open
          items={productItems}
          pending={productPending}
          onClose={() => setPickingProduct(false)}
          onPick={(item) => {
            setPickingProduct(false);
            addSystem(
              expandProductConfiguration(item, {
                profileKey: draft.profiles.length === 1 ? draft.profiles[0]!.key : "",
              }),
            );
          }}
        />
      ) : null}
    </Section>
  );
}
