import { useId, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Grid,
  Stack,
  toast,
} from "@ledger/design-system";
import { useRows } from "@/lib/models";
import { useAddProgramSystem } from "@/lib/library-apply";
import {
  expandProductConfiguration,
  useProductConfigurationItems,
  type ProductConfigurationItem,
} from "@/lib/product-items";
import type { Impact, SystemType } from "@/lib/program-wizard";
import { ChoiceField, PartyField, TextField } from "@/components/app/fields";
import { ProductConfigurationPicker } from "@/components/app/product-configuration-picker";

import { useDraftGuard } from "@/components/app/use-draft-guard";

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

/**
 * Add from products on an existing program: pick a published version and configuration, then
 * name, categorize and baseline the variant. Its elements arrive as published; prune or extend
 * them in the tree afterwards.
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
  if (!item)
    return (
      <ProductConfigurationPicker
        open
        items={products.items}
        pending={products.pending}
        onClose={onClose}
        onPick={setItem}
      />
    );
  return <VariantDialog programId={programId} item={item} onClose={onClose} onSaved={onSaved} />;
}

function VariantDialog({
  programId,
  item,
  onClose,
  onSaved,
}: {
  programId: string;
  item: ProductConfigurationItem;
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
  const [draft] = useState(() => expandProductConfiguration(item, { profileKey: "" }));
  const [name, setName] = useState(draft.name);
  const [code, setCode] = useState(draft.code);
  const [type, setType] = useState<SystemType | null>(draft.type);
  const [ownerPartyId, setOwnerPartyId] = useState<string | null>(null);
  const [categorization, setCategorization] = useState<
    Record<"confidentiality" | "integrity" | "availability", Impact | null>
  >({
    confidentiality: null,
    integrity: null,
    availability: null,
  });
  const [rationale, setRationale] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const profileOptions = useMemo(
    () =>
      (choices.data ?? []).flatMap((choice) => {
        const resolution = resolutions.data?.find((row) => row.id === choice.profile_resolution_id);
        const revision = revisions.data?.find((row) => row.id === resolution?.profile_revision_id);
        const record = profileRecords.data?.find((row) => row.id === revision?.profile_id);
        // Wait for the stable record so the option never shows the document's own title.
        return revision && (record || !profileRecords.isPending)
          ? [
              {
                value: choice.profile_resolution_id,
                label: `${record?.title ?? revision.title} · ${revision.version}`,
              },
            ]
          : [];
      }),
    [choices.data, resolutions.data, revisions.data, profileRecords.data, profileRecords.isPending],
  );
  const [profileResolutionId, setProfileResolutionId] = useState<string | null>(null);
  const chosenProfile =
    profileResolutionId ?? (profileOptions.length === 1 ? profileOptions[0]!.value : null);
  const [error, setError] = useState("");
  const guard = useDraftGuard({
    dirty:
      name !== draft.name ||
      code !== draft.code ||
      type !== draft.type ||
      !!ownerPartyId ||
      Object.values(categorization).some(Boolean) ||
      !!rationale ||
      !!profileResolutionId,
    onClose,
  });
  async function submit() {
    if (guard.busy) return;
    if (!name.trim() || !code.trim() || !type) {
      setError("Enter a name and a code, and choose a type.");
      return;
    }
    if (
      !categorization.confidentiality ||
      !categorization.integrity ||
      !categorization.availability ||
      !rationale.trim()
    ) {
      setError("Choose confidentiality, integrity and availability, and explain them.");
      return;
    }
    if (!chosenProfile) {
      setError("Choose one of the program's profiles.");
      return;
    }
    if (!guard.start()) return;
    setError("");
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
          name: name.trim(),
          code: code.trim(),
          type,
          ownerPartyId,
          confidentiality: categorization.confidentiality,
          integrity: categorization.integrity,
          availability: categorization.availability,
          categorizationRationale: rationale.trim(),
          profileResolutionId: chosenProfile,
        },
      });
      toast.add({
        title: `${name.trim()} added`,
        type: "success",
        description: `${result.elements.length} element${result.elements.length === 1 ? "" : "s"} inherited from ${item.productName} v${item.version} · ${item.configurationName}.`,
      });
      onSaved?.(result.systemId);
      guard.complete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add the system.");
    } finally {
      guard.finish();
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          void guard.close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 720 }} showCloseButton={!guard.busy}>
        <DialogHeader>
          <DialogTitle>Add system from product</DialogTitle>
          <DialogDescription>
            {item.productName} · {item.configurationName} · v{item.version} · {item.elements.length}{" "}
            element{item.elements.length === 1 ? "" : "s"}
            {item.libraryCount ? `, ${item.libraryCount} from the library` : ""}. Elements are
            inherited as published; edit them in the tree afterwards.
          </DialogDescription>
        </DialogHeader>
        <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
          <form
            id={formId}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset disabled={guard.busy} className="min-w-0 border-0 p-0">
              <Stack space="space.150">
                <TextField label="Name" value={name} onChange={setName} required autoFocus />
                <TextField
                  label="Code"
                  value={code}
                  onChange={setCode}
                  required
                  description="Your stable identifier for this variant."
                />
                <ChoiceField
                  label="Type"
                  value={type}
                  onChange={(value) => setType(value as SystemType | null)}
                  options={systemTypes}
                  required
                />
                <PartyField
                  label="System owner"
                  value={ownerPartyId}
                  onChange={setOwnerPartyId}
                  parties={parties.data ?? []}
                />
                <Grid
                  gap="space.150"
                  templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(3,minmax(0,1fr))" }}
                >
                  {(["confidentiality", "integrity", "availability"] as const).map((objective) => (
                    <ChoiceField
                      key={objective}
                      label={objective[0]!.toUpperCase() + objective.slice(1)}
                      value={categorization[objective]}
                      options={impacts}
                      required
                      onChange={(value) =>
                        setCategorization((previous) => ({
                          ...previous,
                          [objective]: value as Impact | null,
                        }))
                      }
                    />
                  ))}
                </Grid>
                <TextField
                  label="Categorization rationale"
                  value={rationale}
                  onChange={setRationale}
                  required
                  multiline
                  description="Explain the impact of a loss of confidentiality, integrity, or availability."
                />
                <ChoiceField
                  label="Program profile"
                  value={chosenProfile}
                  onChange={setProfileResolutionId}
                  options={profileOptions}
                  required
                  description="The program profile this variant adopts."
                />
                {error && (
                  <p role="alert" className="font-body-small text-danger">
                    {error}
                  </p>
                )}
              </Stack>
            </fieldset>
          </form>
        </Box>
        <DialogFooter>
          <Button variant="subtle" disabled={guard.busy} onClick={() => void guard.close()}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={guard.busy}
            disabled={guard.busy}
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
