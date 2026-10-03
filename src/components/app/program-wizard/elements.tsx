import { useConfirmation } from "@/components/app/confirmation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Boxes, MoreHorizontal, Plus } from "lucide-react";
import {
  Absent,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ErrorSummary,
  Grid,
  IconButton,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Section,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Text,
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
import { wizardField, wizardRow, type SheetTarget, type WizardIssue } from "./issues";

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
const objectives = ["confidentiality", "integrity", "availability"] as const;
type Adding = { systemKey: string; parentKey: string | null } | null;

/** The element Sheet's target, and the field that takes focus when it opens. */
export type SheetEditing = SheetTarget & { focus?: string | undefined };

const sameTarget = (issue: WizardIssue, target: SheetTarget) =>
  issue.sheet?.systemKey === target.systemKey && issue.sheet.elementKey === target.elementKey;

/**
 * Step 3: the systems, what is inside them, and what each adopts. A system carries its
 * categorization and the program profile it adopts; subsystems and components are elements of the
 * tree; a component pulled from the library is an element with the library instance pinned; a
 * system created from a product configuration is a variant whose inherited elements keep their
 * lineage. Each row opens the element Sheet, which checks the row on Done.
 */
export function ElementsStep({
  draft,
  onChange,
  parties,
  profiles,
  previews,
  libraryItems,
  libraryPending,
  libraryFailed = false,
  onRetryLibrary,
  productItems,
  productPending,
  productFailed = false,
  onRetryProducts,
  newSystem,
  editing,
  onEditingChange,
  issues,
  checked,
  controlRef,
  nodeFor,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  parties: Row<"parties">[];
  profiles: WizardProfileOption[];
  previews: Map<string, ProgramTailoringPreview>;
  libraryItems: LibraryComponentItem[];
  libraryPending: boolean;
  /** A read behind `libraryItems` failed: the library picker says so instead of offering nothing. */
  libraryFailed?: boolean | undefined;
  /** Try again in that failure: refetch what failed. */
  onRetryLibrary?: (() => void) | undefined;
  productItems: ProductConfigurationItem[];
  productPending: boolean;
  /** A read behind `productItems` failed: the product picker says so instead of offering nothing. */
  productFailed?: boolean | undefined;
  /** Try again in that failure: refetch what failed. */
  onRetryProducts?: (() => void) | undefined;
  newSystem: () => SystemWizardDraft;
  /** The row the element Sheet is open on. */
  editing: SheetEditing | null;
  onEditingChange: (next: SheetEditing | null) => void;
  /** This step's issues, all of them; each shows once its row or the step has been checked. */
  issues: WizardIssue[];
  /** Continue has been pressed on this step, so every row shows its issues. */
  checked: boolean;
  /** Registers a field's control, for focus from the error summary and on Done. */
  controlRef: (field: string) => (node: HTMLElement | null) => void;
  nodeFor: (field: string) => HTMLElement | null;
}) {
  const { confirm, confirmation } = useConfirmation();
  // The pickers stay mounted through their exit, so it animates and focus returns; each opening is
  // a new session (the key), so a choice never carries over.
  const [adding, setAdding] = useState<Adding>(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [addingSession, setAddingSession] = useState(0);
  const [pickingProduct, setPickingProduct] = useState(false);
  const [productSession, setProductSession] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(draft.systems.map((system) => system.key)),
  );
  // Rows the reader pressed Done on: they show their issues before the step is checked.
  const [validated, setValidated] = useState<ReadonlySet<string>>(new Set());
  // Rows created blank from this step, with their blank values: closed untouched, they go away.
  const fresh = useRef(new Map<string, string>());
  const createButton = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const closedRow = useRef<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const focusNext = useRef<string | null>(null);
  // The row's issues from its last Done, when there were several: listed above the Sheet's fields.
  const [sheetSummary, setSheetSummary] = useState<{
    key: string;
    issues: WizardIssue[];
    attempt: number;
  } | null>(null);
  useEffect(() => {
    const field = focusNext.current;
    focusNext.current = null;
    if (field) nodeFor(field)?.focus();
  });

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

  const shows = (key: string) => checked || validated.has(key);
  const rowIssues = (target: SheetTarget) =>
    shows(target.elementKey ?? target.systemKey)
      ? issues.filter((issue) => sameTarget(issue, target))
      : [];
  /** A field's message in the Sheet, once its row or the step has been checked. */
  const errorFor = (field: string) => {
    const issue = issues.find((item) => item.field === field);
    if (!issue?.sheet) return undefined;
    return shows(issue.sheet.elementKey ?? issue.sheet.systemKey) ? issue.message : undefined;
  };

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
  function addSystem(added: SystemWizardDraft, blank: boolean) {
    if (blank) fresh.current.set(added.key, JSON.stringify(added));
    onChange({ ...draft, systems: [...draft.systems, added] });
    setExpanded((previous) => new Set(previous).add(added.key));
    onEditingChange({ systemKey: added.key, elementKey: null });
  }
  function addElement(
    parentSystem: SystemWizardDraft,
    parentKey: string | null,
    values: Partial<ElementWizardDraft>,
    blank: boolean,
  ) {
    const added: ElementWizardDraft = {
      key: crypto.randomUUID(),
      parentKey,
      code: "",
      name: "",
      description: "",
      type: "subsystem",
      library: null,
      productElementId: null,
      ...values,
    };
    if (blank) fresh.current.set(added.key, JSON.stringify(added));
    patchSystem(parentSystem.key, { elements: [...parentSystem.elements, added] });
    setExpanded((previous) => new Set(previous).add(parentKey ?? parentSystem.key));
    onEditingChange({ systemKey: parentSystem.key, elementKey: added.key });
  }
  /** Every element under `key`, with `key` itself. */
  function subtree(parentSystem: SystemWizardDraft, key: string) {
    const removed = new Set([key]);
    let previousSize = 0;
    while (previousSize !== removed.size) {
      previousSize = removed.size;
      parentSystem.elements.forEach((item) => {
        if (item.parentKey && removed.has(item.parentKey)) removed.add(item.key);
      });
    }
    return removed;
  }
  async function removeElement(parentSystem: SystemWizardDraft, key: string) {
    const removed = subtree(parentSystem, key);
    if (
      !(await confirm({
        title: removed.size > 1 ? "Remove elements?" : "Remove element?",
        confirmLabel: removed.size > 1 ? "Remove elements" : "Remove element",
        variant: "danger",
        description:
          removed.size > 1
            ? `This element and the ${removed.size - 1} inside it leave the draft, with what you entered for them.`
            : "The element leaves the draft, with what you entered for it.",
      }))
    )
      return;
    patchSystem(parentSystem.key, {
      elements: parentSystem.elements.filter((item) => !removed.has(item.key)),
    });
    if (editing?.elementKey && removed.has(editing.elementKey)) onEditingChange(null);
  }
  async function removeSystem(item: SystemWizardDraft) {
    if (
      !(await confirm({
        title: "Remove system?",
        confirmLabel: "Remove system",
        variant: "danger",
        description: `${item.name || "This system"} leaves the draft, with its categorization, its elements and what you entered for them.`,
      }))
    )
      return;
    onChange({ ...draft, systems: draft.systems.filter((other) => other.key !== item.key) });
    if (editing?.systemKey === item.key) onEditingChange(null);
  }
  /** Closes the Sheet, keeping the row as it is, unless it was created blank and left untouched. */
  function closeSheet() {
    if (!editing) return;
    const key = editing.elementKey ?? editing.systemKey;
    const blank = fresh.current.get(key);
    fresh.current.delete(key);
    returnTo.current = null;
    closedRow.current = key;
    // A reopened row starts on the field the reader chose; the list from the last Done has gone.
    setSheetSummary(null);
    if (blank !== undefined && blank === JSON.stringify(target)) {
      if (editing.elementKey && system) {
        patchSystem(system.key, {
          elements: system.elements.filter((item) => item.key !== editing.elementKey),
        });
        // The row that opened it has gone: focus returns to the row it was created under.
        returnTo.current = wizardRow(element?.parentKey ?? system.key);
      } else {
        onChange({ ...draft, systems: draft.systems.filter((item) => item.key !== key) });
        returnTo.current = createButton.current;
      }
    }
    onEditingChange(null);
  }
  /** Done checks the row's own fields: the Sheet stays open on the first one to fix. */
  function done() {
    if (!editing) return;
    const key = editing.elementKey ?? editing.systemKey;
    setValidated((previous) => new Set(previous).add(key));
    const found = issues.filter((issue) => sameTarget(issue, editing) && !issue.row);
    if (found.length > 1) {
      // Several: the list above the fields takes focus and leads to each one.
      setSheetSummary((previous) => ({
        key,
        issues: found,
        attempt: (previous?.attempt ?? 0) + 1,
      }));
      return;
    }
    setSheetSummary(null);
    if (found.length === 1) {
      // Focus once the field shows its error, so the error describes it when focus arrives.
      focusNext.current = found[0]!.field;
      return;
    }
    fresh.current.delete(key);
    returnTo.current = null;
    closedRow.current = key;
    onEditingChange(null);
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
  /**
   * The muted text after a row's name: its code, then what it needs once checked, otherwise what it
   * adopts or brings. It yields its width to the name and is read as the row's description.
   */
  function hint(target: SheetTarget, code: string, otherwise: string) {
    const found = rowIssues(target);
    const text = found.length ? (
      <Text as="span" color="color.text.danger">
        {found.length === 1 ? found[0]!.message : `${found.length} details to complete`}
      </Text>
    ) : (
      otherwise
    );
    if (!code) return found.length || otherwise ? text : undefined;
    return (
      <>
        <Id>{code}</Id>
        {found.length || otherwise ? <> · {text}</> : null}
      </>
    );
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
              onEditingChange({ systemKey: parentSystem.key, elementKey: item?.key ?? null })
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addElement(parentSystem, item?.key ?? null, { type: "subsystem" }, true)}
          >
            Add subsystem
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addElement(parentSystem, item?.key ?? null, { type: null }, true)}
          >
            Add component
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setAdding({ systemKey: parentSystem.key, parentKey: item?.key ?? null });
              setAddingSession((session) => session + 1);
              setAddingOpen(true);
            }}
          >
            Add from library…
          </DropdownMenuItem>
          {item || draft.systems.length > 1 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="danger"
                onClick={() =>
                  item ? removeElement(parentSystem, item.key) : removeSystem(parentSystem)
                }
              >
                Remove
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  function elementRows(
    parentSystem: SystemWizardDraft,
    parentKey: string | null,
    depth: number,
  ): ReactNode[] {
    return parentSystem.elements
      .filter((item) => item.parentKey === parentKey)
      .flatMap((item) => {
        const hasChildren = parentSystem.elements.some((child) => child.parentKey === item.key);
        const meta = libraryMeta(parentSystem, item);
        const brings = meta
          ? meta.definition
            ? `${meta.definition.definitionName} · v${meta.definition.version} · ${meta.claims} claims · ${meta.seed} seed · ${meta.claims - meta.seed} not in baseline`
            : "Library version no longer published"
          : item.type
            ? labelFor(item.type)
            : "";
        return [
          <Tree.Item
            key={item.key}
            data-wizard-row={item.key}
            depth={depth}
            hasChildren={hasChildren}
            isExpanded={expanded.has(item.key)}
            onExpandedChange={() => toggle(item.key)}
            isSelected={editing?.elementKey === item.key}
            onSelect={() => onEditingChange({ systemKey: parentSystem.key, elementKey: item.key })}
            hint={hint({ systemKey: parentSystem.key, elementKey: item.key }, item.code, brings)}
            trailing={
              item.productElementId || meta ? (
                <>
                  {item.productElementId ? (
                    <Badge size="xsmall" variant="secondary" tone="information">
                      Product
                    </Badge>
                  ) : null}
                  {meta ? (
                    <Badge size="xsmall" variant="secondary" tone="information">
                      Library
                    </Badge>
                  ) : null}
                </>
              ) : undefined
            }
            actions={rowMenu(parentSystem, item)}
          >
            {item.name || "Unnamed element"}
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
  const firstField =
    system && element
      ? wizardField.element(system.key, element.key, "name")
      : system
        ? wizardField.system(system.key, "name")
        : "";
  return (
    <Stack space="space.200">
      <Inline space="space.200" alignBlock="end" spread="space-between" shouldWrap>
        <Text as="p" size="small" color="color.text.subtle" className="max-w-layout-measure">
          Define each system, categorize it and choose the program profile it adopts. Subsystems and
          components are the elements inside it; a component from the library brings its claimed
          controls. A system from a product is a variant of one of its configurations.
        </Text>
        <Inline space="space.100" shouldWrap>
          <Button
            size="small"
            variant="secondary"
            iconBefore={<Boxes />}
            onClick={() => {
              setProductSession((session) => session + 1);
              setPickingProduct(true);
            }}
          >
            Create system from product
          </Button>
          <Button
            ref={createButton}
            size="small"
            iconBefore={<Plus />}
            onClick={() => addSystem(newSystem(), true)}
          >
            Create system
          </Button>
        </Inline>
      </Inline>
      <Tree label="Systems and components">
        {draft.systems.flatMap((item) => {
          const lineage = productItemFor(item, productItems);
          const profile = item.profileKey
            ? (programProfiles.find((option) => option.value === item.profileKey)?.label ??
              "Profile unavailable")
            : "Choose a program profile";
          const adopts = item.product
            ? `${lineage ? `${lineage.productName} · ${lineage.configurationName} · v${lineage.version}` : "Product version no longer published"} · ${profile}`
            : profile;
          return [
            <Tree.Item
              key={item.key}
              data-wizard-row={item.key}
              depth={0}
              hasChildren={item.elements.length > 0}
              isExpanded={expanded.has(item.key)}
              onExpandedChange={() => toggle(item.key)}
              isSelected={editing?.systemKey === item.key && !editing.elementKey}
              onSelect={() => onEditingChange({ systemKey: item.key, elementKey: null })}
              hint={hint({ systemKey: item.key, elementKey: null }, item.code, adopts)}
              trailing={
                <Badge size="xsmall" variant="secondary" tone="information">
                  {item.product ? "Variant" : "System"}
                </Badge>
              }
              actions={rowMenu(item, null)}
            >
              {item.name || "Unnamed system"}
            </Tree.Item>,
            ...(expanded.has(item.key) ? elementRows(item, null, 1) : []),
          ];
        })}
      </Tree>
      <Sheet
        open={!!target}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent
          side="end"
          width="medium"
          initialFocus={() => {
            // Called before focus moves, so this is what opened the Sheet.
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            return nodeFor(editing?.focus ?? firstField) ?? true;
          }}
          finalFocus={() => {
            if (returnTo.current) return returnTo.current;
            // An error summary item the fix removed has gone: focus goes to the row instead. A
            // menu item that has gone resolves to its menu's trigger, which the Sheet does itself.
            const gone =
              opener.current &&
              !opener.current.isConnected &&
              opener.current.getAttribute("role") !== "menuitem";
            return (gone && closedRow.current ? wizardRow(closedRow.current) : null) ?? true;
          }}
        >
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
          <SheetBody>
            <Stack space="space.200">
              {sheetSummary && sheetSummary.key === (editing?.elementKey ?? editing?.systemKey) ? (
                <ErrorSummary
                  focusKey={sheetSummary.attempt}
                  // Less what the reader has fixed since: a removal is not announced.
                  issues={sheetSummary.issues
                    .filter((issue) => issues.some((current) => current.field === issue.field))
                    .map((issue) => ({
                      id: issue.field,
                      message: issue.message,
                      target: () => nodeFor(issue.field),
                    }))}
                />
              ) : null}
              {system && !element ? (
                <Stack space="space.200">
                  <Section title="Identity">
                    <Stack space="space.150">
                      <TextField
                        label="Name"
                        value={system.name}
                        onChange={(name) => patchSystem(system.key, { name })}
                        required
                        error={errorFor(wizardField.system(system.key, "name"))}
                        controlRef={controlRef(wizardField.system(system.key, "name"))}
                      />
                      <TextField
                        label="Code"
                        value={system.code}
                        onChange={(code) => patchSystem(system.key, { code })}
                        required
                        description="Your stable identifier for this record."
                        error={errorFor(wizardField.system(system.key, "code"))}
                        controlRef={controlRef(wizardField.system(system.key, "code"))}
                      />
                      <TextField
                        label="Function"
                        value={system.description}
                        onChange={(description) => patchSystem(system.key, { description })}
                        multiline
                        description="What it does for the mission."
                        error={errorFor(wizardField.system(system.key, "description"))}
                        controlRef={controlRef(wizardField.system(system.key, "description"))}
                      />
                      <ChoiceField
                        label="Type"
                        value={system.type}
                        onChange={(type) =>
                          patchSystem(system.key, { type: type as SystemWizardDraft["type"] })
                        }
                        options={systemTypes}
                        placeholder="Choose a system type"
                        required
                        error={errorFor(wizardField.system(system.key, "type"))}
                        controlRef={controlRef(wizardField.system(system.key, "type"))}
                      />
                      <PartyField
                        label="System owner"
                        value={system.ownerPartyId}
                        onChange={(ownerPartyId) => patchSystem(system.key, { ownerPartyId })}
                        parties={parties}
                        error={errorFor(wizardField.system(system.key, "ownerPartyId"))}
                        controlRef={controlRef(wizardField.system(system.key, "ownerPartyId"))}
                      />
                    </Stack>
                  </Section>
                  <Section title="Categorization">
                    <Stack space="space.150">
                      <Grid
                        gap="space.150"
                        templateColumns={{
                          base: "minmax(0,1fr)",
                          sm: "repeat(3,minmax(0,1fr))",
                        }}
                      >
                        {objectives.map((objective) => (
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
                            error={errorFor(wizardField.system(system.key, objective))}
                            controlRef={controlRef(wizardField.system(system.key, objective))}
                          />
                        ))}
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
                        error={errorFor(wizardField.system(system.key, "categorizationRationale"))}
                        controlRef={controlRef(
                          wizardField.system(system.key, "categorizationRationale"),
                        )}
                      />
                    </Stack>
                  </Section>
                  <Section title="Baseline">
                    <Stack space="space.100">
                      <ChoiceField
                        label="Program profile"
                        value={system.profileKey}
                        options={programProfiles}
                        placeholder="Choose a program profile"
                        onChange={(profileKey) =>
                          patchSystem(system.key, { profileKey: profileKey ?? "" })
                        }
                        required
                        description={
                          programProfiles.length
                            ? "The program profile this system adopts. Categorization suggests one; the choice is always explicit."
                            : "Choose at least one base profile in the Catalog & profiles step first."
                        }
                        error={errorFor(wizardField.system(system.key, "profileKey"))}
                        controlRef={controlRef(wizardField.system(system.key, "profileKey"))}
                      />
                      {suggestion && suggestedLabel && system.profileKey !== suggestion.key ? (
                        <Stack space="space.050">
                          <Text as="p" size="small" color="color.text.subtle">
                            Suggested from categorization ({suggestion.level}): {suggestedLabel}
                          </Text>
                          <Button
                            size="small"
                            variant="subtle"
                            onClick={() => patchSystem(system.key, { profileKey: suggestion.key })}
                          >
                            Use suggestion
                          </Button>
                        </Stack>
                      ) : null}
                    </Stack>
                  </Section>
                  {system.product && editingProduct ? (
                    <Inspector.Group title="From a product">
                      <KeyValue.Group labelWidth="wide">
                        <KeyValue label="Product" wrap>
                          {editingProduct.item ? (
                            // A new tab, so reading the product never leaves the draft.
                            <TextLink
                              newTab
                              render={
                                <Link
                                  to="/library/products/$productKey"
                                  params={{ productKey: editingProduct.item.productId }}
                                  search={{ version: editingProduct.item.revisionId }}
                                />
                              }
                            >
                              {editingProduct.item.productName}
                            </TextLink>
                          ) : (
                            "No longer published"
                          )}
                        </KeyValue>
                        <KeyValue label="Configuration" wrap>
                          {/* A product no longer published has no configuration to read. */}
                          {editingProduct.item?.configurationName ?? (
                            <Absent label="Not available" />
                          )}
                        </KeyValue>
                        <KeyValue label="Version">
                          {editingProduct.item ? (
                            `v${editingProduct.item.version}`
                          ) : (
                            <Absent label="Not available" />
                          )}
                        </KeyValue>
                        <KeyValue label="Elements inherited">{editingProduct.inherited}</KeyValue>
                        <KeyValue label="Removed">{editingProduct.removed}</KeyValue>
                        <KeyValue label="Added">{editingProduct.added}</KeyValue>
                      </KeyValue.Group>
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
                        errors={{
                          name: errorFor(wizardField.element(system.key, element.key, "name")),
                          code: errorFor(wizardField.element(system.key, element.key, "code")),
                          description: errorFor(
                            wizardField.element(system.key, element.key, "description"),
                          ),
                          type: errorFor(wizardField.element(system.key, element.key, "type")),
                        }}
                        controlRef={(field) =>
                          controlRef(wizardField.element(system.key, element.key, field))
                        }
                      />
                    </Stack>
                  </Section>
                  {element.productElementId ? (
                    <Inspector.Group title="From a product">
                      <KeyValue.Group labelWidth="wide">
                        <KeyValue label="Product element" wrap>
                          {editingProductElement
                            ? `${editingProductElement.code} · ${editingProductElement.name}`
                            : "No longer published"}
                        </KeyValue>
                        <KeyValue label="Product" wrap>
                          {editingProduct?.item ? (
                            `${editingProduct.item.productName} v${editingProduct.item.version} · ${editingProduct.item.configurationName}`
                          ) : (
                            <Absent label="Not available" />
                          )}
                        </KeyValue>
                      </KeyValue.Group>
                    </Inspector.Group>
                  ) : null}
                  {element.library ? (
                    <Stack space="space.150">
                      <Inspector.Group title="From the library">
                        <KeyValue.Group labelWidth="wide">
                          <KeyValue label="Definition" wrap>
                            {editingMeta?.definition?.definitionName ?? "No longer published"}
                          </KeyValue>
                          <KeyValue label="Version">
                            {editingMeta?.definition?.version ?? <Absent label="Not available" />}
                          </KeyValue>
                          <KeyValue label="Claimed controls">{editingMeta?.claims ?? 0}</KeyValue>
                          <KeyValue label="Will seed">{editingMeta?.seed ?? 0}</KeyValue>
                          <KeyValue label="Not in baseline">
                            {(editingMeta?.claims ?? 0) - (editingMeta?.seed ?? 0)}
                          </KeyValue>
                        </KeyValue.Group>
                      </Inspector.Group>
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
                        error={errorFor(wizardField.element(system.key, element.key, "rationale"))}
                        controlRef={controlRef(
                          wizardField.element(system.key, element.key, "rationale"),
                        )}
                      />
                    </Stack>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </SheetBody>
          <SheetFooter>
            <Button variant="subtle" onClick={closeSheet}>
              Keep as draft
            </Button>
            <Button variant="primary" onClick={done}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
        {confirmation}
      </Sheet>
      {adding && addingSystem ? (
        <LibraryComponentPicker
          key={`library-${addingSession}`}
          open={addingOpen}
          parentLabel={addingParent?.name || addingSystem.name || "the system"}
          items={libraryItems}
          pending={libraryPending}
          failed={libraryFailed}
          onRetry={onRetryLibrary}
          onClose={() => setAddingOpen(false)}
          onPick={(item) => {
            addElement(
              addingSystem,
              adding.parentKey,
              {
                code: item.definitionCode.toUpperCase(),
                name: item.componentName,
                description: "",
                type: elementTypeForComponent(item.componentType),
                library: {
                  definedComponentId: item.id,
                  revisionId: item.revisionId,
                  rationale: "",
                },
              },
              false,
            );
            setAddingOpen(false);
          }}
        />
      ) : null}
      {productSession ? (
        <ProductConfigurationPicker
          key={`product-${productSession}`}
          open={pickingProduct}
          title="Create system from product"
          actionLabel="Create system from product"
          items={productItems}
          pending={productPending}
          failed={productFailed}
          onRetry={onRetryProducts}
          onClose={() => setPickingProduct(false)}
          onPick={(item) => {
            setPickingProduct(false);
            addSystem(
              expandProductConfiguration(item, {
                profileKey: draft.profiles.length === 1 ? draft.profiles[0]!.key : "",
              }),
              false,
            );
          }}
        />
      ) : null}
    </Stack>
  );
}
