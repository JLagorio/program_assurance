import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Box,
  Button,
  Grid,
  Inline,
  PageHeader,
  Stack,
  Stepper,
  toast,
} from "@ledger/design-system";
import { useWorkspace } from "./workspace";
import {
  programWizardSchema,
  useCreateProgramWizard,
  type ProgramProfileDraft,
  type ProgramWizardDraft,
  type SystemWizardDraft,
} from "@/lib/program-wizard";
import { catalogProfileOptions, previewProgramTailoring } from "@/lib/program-wizard-reference";
import { useWizardResources } from "./program-wizard/resources";
import { ProgramStep } from "./program-wizard/program";
import { CatalogStep } from "./program-wizard/catalog";
import { ElementsStep } from "./program-wizard/elements";
import { ReviewStep } from "./program-wizard/review";
import { productItemFor } from "@/lib/product-items";

const steps = ["Program", "Catalog & profiles", "Systems & components", "Review & create"] as const;
function newSystem(): SystemWizardDraft {
  return {
    key: crypto.randomUUID(),
    code: "",
    name: "",
    description: "",
    type: null,
    ownerPartyId: null,
    confidentiality: null,
    integrity: null,
    availability: null,
    categorizationRationale: "",
    profileKey: "",
    product: null,
    elements: [],
  };
}
function emptyDraft(): ProgramWizardDraft {
  return {
    requestId: crypto.randomUUID(),
    code: "",
    name: "",
    description: "",
    sponsorPartyId: null,
    startsOn: null,
    endsOn: null,
    roles: [],
    catalogRevisionId: "",
    profiles: [],
    systems: [newSystem()],
  };
}

export function ProgramWizard() {
  const { confirm, confirmation } = useConfirmation();
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const resources = useWizardResources();
  const create = useCreateProgramWizard();
  const [draft, setDraft] = useState(emptyDraft);
  const [index, setIndex] = useState(0);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const bypassBlock = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useBlocker({
    shouldBlockFn: async () => {
      if (bypassBlock.current) return false;
      if (inFlight.current || confirming) return true;
      return dirty && !(await confirm(discardChanges("Discard this unsaved program setup?")));
    },
    enableBeforeUnload: () => !bypassBlock.current && (dirty || inFlight.current),
  });
  function change(next: ProgramWizardDraft) {
    if (inFlight.current) return;
    setDraft(next);
    setDirty(true);
    setError("");
  }
  const options = useMemo(() => catalogProfileOptions(resources.data), [resources.data]);
  const previews = useMemo(
    () =>
      new Map(
        draft.profiles.map((profile: ProgramProfileDraft) => [
          profile.key,
          previewProgramTailoring(
            {
              catalogRevisionId: draft.catalogRevisionId,
              baseResolutionId: profile.baseResolutionId,
              tailoring: profile.tailoring,
              parameters: profile.parameters,
            },
            resources.data,
          ),
        ]),
      ),
    [draft.profiles, draft.catalogRevisionId, resources.data],
  );
  const issues = useMemo(() => {
    const result: string[][] = [[], [], [], []];
    const profileTitle = (profile: ProgramProfileDraft | undefined) =>
      options.profiles.find((option) => option.id === profile?.baseResolutionId)?.title ??
      "Program profile";
    const parsed = programWizardSchema.safeParse(draft);
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const [root, itemIndex, field, elementIndex] = issue.path;
        const step =
          root === "catalogRevisionId" || root === "profiles" ? 1 : root === "systems" ? 2 : 0;
        let prefix = "";
        if (root === "profiles" && typeof itemIndex === "number")
          prefix = `${profileTitle(draft.profiles[itemIndex])}: `;
        if (root === "systems" && typeof itemIndex === "number") {
          const system = draft.systems[itemIndex];
          prefix = `${system?.name || `System ${itemIndex + 1}`}: `;
          if (field === "elements" && typeof elementIndex === "number") {
            const element = system?.elements[elementIndex];
            prefix += `${element?.name || `Element ${elementIndex + 1}`}: `;
          }
        }
        result[step]!.push(`${prefix}${issue.message}`);
      }
    if (resources.ready) {
      if (
        draft.catalogRevisionId &&
        !options.catalogs.some((catalog) => catalog.id === draft.catalogRevisionId)
      )
        result[1]!.push("Choose an available published catalog.");
      for (const profile of draft.profiles) {
        const option = options.profiles.find((item) => item.id === profile.baseResolutionId);
        if (!option || !option.supported || option.catalogRevisionId !== draft.catalogRevisionId)
          result[1]!.push(
            `${profileTitle(profile)}: this profile is unavailable or incompatible with the chosen catalog.`,
          );
        for (const message of previews.get(profile.key)?.errors ?? [])
          result[1]!.push(`${profileTitle(profile)}: ${message}`);
      }
      for (const system of draft.systems) {
        const product = productItemFor(system, resources.productItems);
        if (system.product && !product)
          result[2]!.push(
            `${system.name || "System"}: comes from a product version that is no longer published; remove and re-add it.`,
          );
        for (const element of system.elements) {
          if (
            element.library &&
            !resources.libraryItems.some(
              (item) =>
                item.id === element.library!.definedComponentId &&
                item.revisionId === element.library!.revisionId,
            ) &&
            !(
              element.productElementId &&
              product?.elements.some(
                (row) =>
                  row.id === element.productElementId &&
                  row.library?.revisionId === element.library!.revisionId,
              )
            )
          )
            result[2]!.push(
              `${system.name || "System"}: ${element.name || "an element"} pins a library version that is no longer the published one; remove and re-add it.`,
            );
          if (
            element.productElementId &&
            product &&
            !product.elements.some((row) => row.id === element.productElementId)
          )
            result[2]!.push(
              `${system.name || "System"}: ${element.name || "an element"} is not an element of ${product.productName} · ${product.configurationName}; remove and re-add the system.`,
            );
        }
      }
    }
    return result.map((messages) => [...new Set(messages)]);
  }, [draft, options, previews, resources.ready, resources.libraryItems, resources.productItems]);
  const blocked = issues[index]?.[0];
  const earlierBlocked = issues.slice(0, index).flat()[0];
  const allErrors = issues.flat();
  const total = new Set(
    draft.systems.flatMap(
      (system) =>
        previews.get(system.profileKey)?.selectedControls.map((control) => control.id) ?? [],
    ),
  ).size;
  const elementCount = draft.systems.reduce((count, system) => count + system.elements.length, 0);
  const libraryCount = draft.systems.reduce(
    (count, system) => count + system.elements.filter((element) => element.library).length,
    0,
  );
  const productCount = draft.systems.filter((system) => system.product).length;
  const step = steps[index]!;
  const writable = workspace.role !== "viewer";
  async function submit() {
    if (inFlight.current || allErrors.length || !resources.ready || resources.error || !writable)
      return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await create.mutateAsync(draft);
      bypassBlock.current = true;
      setDirty(false);
      setConfirming(false);
      toast.add({
        title: `${draft.name.trim()} created`,
        type: "success",
        description: `${draft.systems.length} systems${productCount ? ` (${productCount} from products)` : ""}, ${elementCount} elements and ${draft.profiles.length} program profiles were saved.`,
      });
      await navigate({
        to: "/programs/$programId",
        params: { programId: result.programId },
        search: { tab: "System" },
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The program could not be created. Your setup has been retained.",
      );
      setConfirming(false);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Stack className="animate-rise" space="space.250">
      <PageHeader>
        <PageHeader.Lead className="font-body text-subtle">Programs</PageHeader.Lead>
        <PageHeader.Heading>
          <PageHeader.Title>
            {draft.name.trim() ? `New program · ${draft.name.trim()}` : "New program"}
          </PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {!writable ? (
        <p role="alert" className="text-subtle">
          Your workspace role can view programs. An editor, admin, or owner can create a program.
        </p>
      ) : null}
      {resources.error ? (
        <Box className="rounded-medium border border-danger p-150">
          <Inline space="space.150" alignBlock="center" spread="space-between">
            <p role="alert" className="font-body-small text-danger">
              Could not load the reference records: {resources.error.message}. Your form entries are
              retained.
            </p>
            <Button size="small" onClick={() => void resources.retry()}>
              Retry references
            </Button>
          </Inline>
        </Box>
      ) : null}
      {!resources.ready ? (
        <p role="status" className="text-subtle">
          Loading published catalogs, profiles, the component library, products, and workspace
          parties…
        </p>
      ) : (
        <Grid gap="space.300" templateColumns={{ lg: "200px minmax(0,1fr)" }}>
          <aside className="lg:sticky-rail">
            <Stepper orientation="vertical">
              {steps.map((label, stepIndex) => (
                <Stepper.Item
                  key={label}
                  label={label}
                  state={stepIndex < index ? "done" : stepIndex === index ? "current" : "upcoming"}
                  meta={
                    stepIndex === 1
                      ? `${draft.profiles.length} profile${draft.profiles.length === 1 ? "" : "s"}`
                      : stepIndex === 2
                        ? `${draft.systems.length} system${draft.systems.length === 1 ? "" : "s"} · ${elementCount} element${elementCount === 1 ? "" : "s"}`
                        : `Step ${stepIndex + 1} of ${steps.length}`
                  }
                  {...(!busy && (stepIndex < index || (stepIndex === index + 1 && !blocked))
                    ? {
                        onSelect: () => {
                          setEditingKey(null);
                          setIndex(stepIndex);
                        },
                      }
                    : {})}
                />
              ))}
            </Stepper>
          </aside>
          <Stack className="min-w-0" space="space.250">
            {/* Native fieldset disables every form control during the atomic write. */}
            {/* eslint-disable-next-line ledger/use-primitives */}
            <fieldset disabled={busy || !writable} className="min-w-0 border-0 p-0">
              <Stack space="space.200">
                {index === 0 ? (
                  <ProgramStep draft={draft} onChange={change} parties={resources.parties} />
                ) : null}
                {index === 1 ? (
                  <CatalogStep
                    draft={draft}
                    onChange={change}
                    catalogs={options.catalogs}
                    profiles={options.profiles}
                    data={resources.data}
                    previews={previews}
                    editingKey={editingKey}
                    onEditingKeyChange={setEditingKey}
                  />
                ) : null}
                {index === 2 ? (
                  <ElementsStep
                    draft={draft}
                    onChange={change}
                    parties={resources.parties}
                    profiles={options.profiles}
                    previews={previews}
                    libraryItems={resources.libraryItems}
                    libraryPending={resources.pending}
                    productItems={resources.productItems}
                    productPending={resources.pending}
                    newSystem={newSystem}
                  />
                ) : null}
                {index === 3 ? (
                  <ReviewStep
                    draft={draft}
                    data={resources.data}
                    parties={resources.parties}
                    profiles={options.profiles}
                    previews={previews}
                    libraryItems={resources.libraryItems}
                    productItems={resources.productItems}
                    total={total}
                    onEdit={(step) => {
                      setEditingKey(null);
                      setIndex(step);
                    }}
                  />
                ) : null}
              </Stack>
            </fieldset>
            {error ? (
              <Box className="rounded-medium border border-danger p-150" role="alert">
                <p className="font-body font-semibold text-danger">Program could not be created</p>
                <p className="font-body-small text-danger">{error}</p>
                <p className="pt-100 font-body-small text-subtle">
                  Your entire setup is retained. Correct the problem and retry.
                </p>
              </Box>
            ) : null}
            {index === 3 && allErrors.length ? (
              <Box role="alert" className="font-body-small text-danger">
                <p>Complete these items before creating the program:</p>
                <Box as="ul" className="list-disc ps-200">
                  {allErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </Box>
              </Box>
            ) : null}
            <Inline
              className="border-t border-default pt-200"
              space="space.200"
              alignBlock="center"
              alignInline={editingKey || index > 0 ? undefined : "end"}
              spread={editingKey || index > 0 ? "space-between" : undefined}
            >
              {editingKey || index > 0 ? (
                <Button
                  variant="subtle"
                  disabled={busy}
                  onClick={() => {
                    if (editingKey) setEditingKey(null);
                    else setIndex(index - 1);
                  }}
                >
                  {editingKey ? "Back to profiles" : "Back"}
                </Button>
              ) : null}
              <Inline space="space.150" alignBlock="center">
                {blocked || earlierBlocked ? (
                  <span className="font-body-small text-subtle">{blocked ?? earlierBlocked}</span>
                ) : null}
                <Button
                  variant="subtle"
                  disabled={busy}
                  onClick={() => void navigate({ to: "/programs" })}
                >
                  Cancel
                </Button>
                {index < steps.length - 1 ? (
                  <Button
                    variant="primary"
                    disabled={!!blocked || !!earlierBlocked || busy || !writable}
                    title={blocked ?? earlierBlocked}
                    onClick={() => {
                      setEditingKey(null);
                      setIndex(index + 1);
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    disabled={!!allErrors.length || busy || !writable || !!resources.error}
                    onClick={() => setConfirming(true)}
                  >
                    Create program
                  </Button>
                )}
              </Inline>
            </Inline>
          </Stack>
        </Grid>
      )}
      <AlertDialog
        open={confirming}
        onOpenChange={(open, details) => {
          if (!open && inFlight.current) {
            details.cancel();
            return;
          }
          setConfirming(open);
        }}
      >
        <AlertDialogContent initialFocus={cancelRef} className="top-200 translate-y-0 sm:top-1000">
          <AlertDialogHeader>
            <AlertDialogTitle>Create {draft.name.trim()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {draft.systems.length} systems ({productCount} from products), {elementCount} elements
              ({libraryCount} from the library), {draft.profiles.length} program profiles and{" "}
              {total} distinct selected controls will be saved with the program, as one transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelRef} variant="subtle" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              isLoading={busy}
              disabled={busy}
              onClick={() => void submit()}
            >
              Create program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {confirmation}
    </Stack>
  );
}
