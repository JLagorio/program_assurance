import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  FieldSet,
  Grid,
  Stack,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { useRows } from "@/lib/models";
import { useAddProgramSystem } from "@/lib/library-apply";
import {
  expandProductConfiguration,
  useProductConfigurationItems,
  type ProductConfigurationItem,
} from "@/lib/product-items";
import type { Impact, SystemType } from "@/lib/program-wizard";
import { impactLevels } from "@/lib/status";
import { ChoiceField, PartyField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { ProductConfigurationPicker } from "@/components/app/product-configuration-picker";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { QueryState } from "./work-common";

const systemTypes = [
  { value: "information_system", label: "Information system" },
  { value: "industrial_control_system", label: "Industrial control system" },
  { value: "platform", label: "Platform" },
  { value: "service", label: "Service" },
];
// The impact levels in the status map's order, low to high.
const impacts = Object.entries(impactLevels)
  .sort(([, a], [, b]) => a.rank - b.rank)
  .map(([value, { label }]) => ({ value, label }));
const objectives = ["confidentiality", "integrity", "availability"] as const;
type Objective = (typeof objectives)[number];
const objectiveLabels: Record<Objective, string> = {
  confidentiality: "Confidentiality",
  integrity: "Integrity",
  availability: "Availability",
};

type VariantValues = {
  name: string;
  code: string;
  type: SystemType | null;
  ownerPartyId: string | null;
  categorization: Record<Objective, Impact | null>;
  rationale: string;
  profileResolutionId: string | null;
};
/** What the reader entered for a configuration, kept while they go back to choose again. */
type Kept = { itemId: string; values: VariantValues };

const variantFields = [
  "name",
  "code",
  "type",
  "owner",
  "confidentiality",
  "integrity",
  "availability",
  "rationale",
  "profile",
] as const;
type VariantField = (typeof variantFields)[number];

/** The control that opened the flow, read as it first renders, so focus can go back there. */
function currentOpener(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  if (active.closest('[role="menu"]'))
    return document.querySelector<HTMLElement>('[aria-haspopup="menu"][aria-expanded="true"]');
  return active;
}

/**
 * Add from products on an existing program: pick a published version and configuration, then
 * name, categorize and baseline the variant. Back returns to the choice with what was entered
 * kept; cancelling that second choice returns to the details. Its elements arrive as published;
 * prune or extend them in the tree afterwards.
 */
export function AddProductSystem({
  programId,
  onClose,
  onSaved,
}: {
  programId: string;
  onClose: () => void;
  onSaved?: ((systemId: string) => void) | undefined;
}) {
  const products = useProductConfigurationItems();
  const [item, setItem] = useState<ProductConfigurationItem | null>(null);
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [kept, setKept] = useState<Kept | null>(null);
  const [opener] = useState(currentOpener);
  if (frame === "choose" || !item)
    return (
      <ProductConfigurationPicker
        open
        items={products.items}
        pending={products.pending}
        onClose={() => (item ? setFrame("details") : onClose())}
        onPick={(picked) => {
          setItem(picked);
          setFrame("details");
        }}
      />
    );
  return (
    <VariantDialog
      key={item.id}
      programId={programId}
      item={item}
      kept={kept}
      opener={opener}
      onBack={(values) => {
        setKept(values);
        setFrame("choose");
      }}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function VariantDialog({
  programId,
  item,
  kept,
  opener,
  onBack,
  onClose,
  onSaved,
}: {
  programId: string;
  item: ProductConfigurationItem;
  kept: Kept | null;
  opener: HTMLElement | null;
  onBack: (kept: Kept) => void;
  onClose: () => void;
  onSaved?: ((systemId: string) => void) | undefined;
}) {
  const formId = useId();
  const parties = useRows("parties");
  const choices = useRows("program_reference_choices", { program_id: programId });
  const resolutions = useRows("profile_resolutions");
  const revisions = useRows("profile_revisions");
  const profileRecords = useRows("profiles");
  const add = useAddProgramSystem();
  const { formatPlural } = useLedgerLocale();
  const feedback = useFormFeedback<VariantField>();
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const goingBack = useRef(false);
  const [draft] = useState(() => expandProductConfiguration(item, { profileKey: "" }));
  const [values, setValues] = useState<VariantValues>(() => {
    const defaults: VariantValues = {
      name: draft.name,
      code: draft.code,
      type: draft.type,
      ownerPartyId: null,
      categorization: { confidentiality: null, integrity: null, availability: null },
      rationale: "",
      profileResolutionId: null,
    };
    if (!kept) return defaults;
    // Another configuration names the variant anew; the rest of what was entered stays.
    return kept.itemId === item.id
      ? kept.values
      : { ...kept.values, name: draft.name, code: draft.code, type: draft.type };
  });
  const update = (patch: Partial<VariantValues>) =>
    setValues((previous) => ({ ...previous, ...patch }));
  const [requestId] = useState(() => crypto.randomUUID());
  const [failure, setFailure] = useState<string | null>(null);
  const queries = [parties, choices, resolutions, revisions, profileRecords];
  const ready = queries.every((query) => query.data !== undefined);
  const profileOptions = useMemo(
    () =>
      (choices.data ?? []).flatMap((choice) => {
        const resolution = resolutions.data?.find((row) => row.id === choice.profile_resolution_id);
        const revision = revisions.data?.find((row) => row.id === resolution?.profile_revision_id);
        const record = profileRecords.data?.find((row) => row.id === revision?.profile_id);
        return revision
          ? [
              {
                value: choice.profile_resolution_id,
                label: `${record?.title ?? revision.title} · ${revision.version}`,
              },
            ]
          : [];
      }),
    [choices.data, resolutions.data, revisions.data, profileRecords.data],
  );
  const chosenProfile =
    values.profileResolutionId ?? (profileOptions.length === 1 ? profileOptions[0]!.value : null);
  const dirty =
    values.name !== draft.name ||
    values.code !== draft.code ||
    values.type !== draft.type ||
    !!values.ownerPartyId ||
    Object.values(values.categorization).some(Boolean) ||
    !!values.rationale ||
    !!values.profileResolutionId;
  const guard = useDraftGuard({
    dirty,
    onClose,
    description: "The name, categorization and profile you entered will be lost.",
  });
  const issues: FormIssue<VariantField>[] = [
    ...(values.name.trim() ? [] : [{ field: "name" as const, message: "Enter a name." }]),
    ...(values.code.trim() ? [] : [{ field: "code" as const, message: "Enter a code." }]),
    ...(values.type ? [] : [{ field: "type" as const, message: "Choose a type." }]),
    ...objectives.flatMap((objective) =>
      values.categorization[objective]
        ? []
        : [
            {
              field: objective,
              message: `Choose the ${objective} impact.`,
            },
          ],
    ),
    ...(values.rationale.trim()
      ? []
      : [{ field: "rationale" as const, message: "Explain the categorization." }]),
    ...(chosenProfile
      ? []
      : [{ field: "profile" as const, message: "Choose one of the program's profiles." }]),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !ready) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    const { type } = values;
    const { confidentiality, integrity, availability } = values.categorization;
    if (!type || !confidentiality || !integrity || !availability || !chosenProfile) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const { profileKey: _profileKey, ...rest } = draft;
      const result = await add.mutateAsync({
        programId,
        requestId,
        system: {
          ...rest,
          elements: rest.elements.map((element) => ({
            ...element,
            type: element.type ?? "other",
          })),
          name: values.name.trim(),
          code: values.code.trim(),
          type,
          ownerPartyId: values.ownerPartyId,
          confidentiality,
          integrity,
          availability,
          categorizationRationale: values.rationale.trim(),
          profileResolutionId: chosenProfile,
        },
      });
      guard.finish();
      toast.add({
        title: `${values.name.trim()} added`,
        type: "success",
        description: `${formatPlural(result.elements.length, { one: "{count} element", other: "{count} elements" })} inherited from ${item.productName} v${item.version} · ${item.configurationName}.`,
      });
      onSaved?.(result.systemId);
      guard.complete();
    } catch (cause) {
      setFailure(
        `${cause instanceof Error ? cause.message : "The request failed."} Your details are kept, and adding it again will not create a second system.`,
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
    >
      <DialogContent
        width="large"
        initialFocus={() => feedback.node("name") ?? true}
        finalFocus={() => (goingBack.current ? false : opener?.isConnected ? opener : true)}
      >
        <DialogHeader>
          <DialogTitle>Add system from product</DialogTitle>
          <DialogDescription>
            {item.productName} · {item.configurationName} · v{item.version} ·{" "}
            {formatPlural(item.elements.length, {
              one: "{count} element",
              other: "{count} elements",
            })}
            {item.libraryCount ? `, ${item.libraryCount} from the library` : ""}. Elements are
            inherited as published; edit them in the tree afterwards.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <QueryState queries={queries}>
            <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
              <Stack space="space.200">
                {failure ? (
                  <Alert ref={failureRef} variant="destructive" role="alert">
                    <AlertCircle aria-hidden />
                    <AlertTitle>The system was not added</AlertTitle>
                    <AlertDescription>{failure}</AlertDescription>
                  </Alert>
                ) : null}
                <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
                <FieldSet disabled={guard.busy}>
                  <Stack space="space.200">
                    <TextField
                      label="Name"
                      value={values.name}
                      onChange={(name) => update({ name })}
                      required
                      error={errors.get("name")}
                      controlRef={feedback.ref("name")}
                    />
                    <TextField
                      label="Code"
                      value={values.code}
                      onChange={(code) => update({ code })}
                      required
                      description="Your stable identifier for this variant."
                      error={errors.get("code")}
                      controlRef={feedback.ref("code")}
                    />
                    <ChoiceField
                      label="Type"
                      value={values.type}
                      onChange={(type) => update({ type: type as SystemType | null })}
                      options={systemTypes}
                      required
                      error={errors.get("type")}
                      controlRef={feedback.ref("type")}
                    />
                    <PartyField
                      label="System owner"
                      value={values.ownerPartyId}
                      onChange={(ownerPartyId) => update({ ownerPartyId })}
                      parties={parties.data ?? []}
                      controlRef={feedback.ref("owner")}
                    />
                    <Grid
                      gap="space.150"
                      templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(3,minmax(0,1fr))" }}
                    >
                      {objectives.map((objective) => (
                        <ChoiceField
                          key={objective}
                          label={objectiveLabels[objective]}
                          value={values.categorization[objective]}
                          options={impacts}
                          required
                          onChange={(value) =>
                            update({
                              categorization: {
                                ...values.categorization,
                                [objective]: value as Impact | null,
                              },
                            })
                          }
                          error={errors.get(objective)}
                          controlRef={feedback.ref(objective)}
                        />
                      ))}
                    </Grid>
                    <TextField
                      label="Categorization rationale"
                      value={values.rationale}
                      onChange={(rationale) => update({ rationale })}
                      required
                      multiline
                      description="Explain the impact of a loss of confidentiality, integrity, or availability."
                      error={errors.get("rationale")}
                      controlRef={feedback.ref("rationale")}
                    />
                    <ChoiceField
                      label="Program profile"
                      value={chosenProfile}
                      onChange={(profileResolutionId) => update({ profileResolutionId })}
                      options={profileOptions}
                      required
                      description="The program profile this variant adopts."
                      error={errors.get("profile")}
                      controlRef={feedback.ref("profile")}
                    />
                  </Stack>
                </FieldSet>
              </Stack>
            </form>
          </QueryState>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="subtle"
            onClick={() => {
              if (guard.busy) return;
              goingBack.current = true;
              onBack({ itemId: item.id, values });
            }}
          >
            Back
          </Button>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            variant="primary"
            isLoading={guard.busy}
            disabledReason={ready ? undefined : "Wait for the program's profiles to load."}
            type="submit"
            form={formId}
          >
            Add system from product
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
