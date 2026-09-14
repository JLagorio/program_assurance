import { useId, useState } from "react";
import {
  Badge,
  Checkbox,
  Inline,
  RadioGroup,
  RadioGroupItem,
  Section,
  Stack,
} from "@ledger/design-system";
import type { ProgramWizardDraft } from "@/lib/program-wizard";
import type { WizardCatalogOption, WizardProfileOption } from "@/lib/program-wizard-reference";
import type { WizardResources } from "./resources";

export function CatalogStep({
  draft,
  onChange,
  catalogs,
  profiles,
  data,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  catalogs: WizardCatalogOption[];
  profiles: WizardProfileOption[];
  data: WizardResources;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const matching = profiles.filter(
    (profile) => profile.catalogRevisionId === draft.catalogRevisionId,
  );
  function changeCatalog(catalogRevisionId: string) {
    if (draft.catalogRevisionId === catalogRevisionId) return;
    const configured = draft.systems.filter(
      (system) => system.profileResolutionId || system.tailoring.length || system.parameters.length,
    );
    if (
      configured.length &&
      !window.confirm(
        `Change the catalog? This clears the selected profiles, ${draft.systems.reduce((count, system) => count + system.tailoring.length, 0)} control decisions, and ${draft.systems.reduce((count, system) => count + system.parameters.length, 0)} parameter overrides. Program details, systems, and categorization will be kept.`,
      )
    )
      return;
    onChange({
      ...draft,
      catalogRevisionId,
      availableProfileResolutionIds: [],
      systems: draft.systems.map((system) => ({
        ...system,
        profileResolutionId: "",
        tailoring: [],
        parameters: [],
      })),
    });
    setError("");
  }
  function toggleProfile(profile: WizardProfileOption, checked: boolean) {
    const used = draft.systems.filter((system) => system.profileResolutionId === profile.id);
    if (!checked && used.length) {
      setError(
        `This profile is used by ${used.map((system) => system.name || "an unnamed system").join(", ")}. Choose another base profile for those systems before removing it here.`,
      );
      return;
    }
    onChange({
      ...draft,
      availableProfileResolutionIds: checked
        ? [...draft.availableProfileResolutionIds, profile.id]
        : draft.availableProfileResolutionIds.filter((id) => id !== profile.id),
    });
    setError("");
  }
  return (
    <Stack space="space.200">
      <Section title="Catalog edition">
        <RadioGroup<string>
          aria-label="Catalog edition"
          value={draft.catalogRevisionId || undefined}
          onValueChange={changeCatalog}
          className="gap-0 divide-y"
        >
          {catalogs.map((catalog) => (
            <Inline
              key={catalog.id}
              className="py-100"
              space="space.200"
              alignBlock="start"
              spread="space-between"
            >
              <label className="inline-flex items-start gap-100 font-body">
                <RadioGroupItem value={catalog.id} aria-labelledby={`${id}-${catalog.id}`} />
                <Stack as="span" space="space.050">
                  <span id={`${id}-${catalog.id}`}>{catalog.title}</span>
                  <span className="font-body-small text-subtle">
                    Version {catalog.version} · Published OSCAL catalog
                  </span>
                </Stack>
              </label>
              <span className="shrink-0 font-body-small tabular-nums text-subtle">
                {
                  data.controls.filter((control) => control.catalog_revision_id === catalog.id)
                    .length
                }{" "}
                controls
              </span>
            </Inline>
          ))}
        </RadioGroup>
        {!catalogs.length ? (
          <p className="font-body-small text-subtle">
            No published catalog editions are available for this workspace.
          </p>
        ) : null}
      </Section>
      <Section title="Base profiles" count={draft.availableProfileResolutionIds.length || null}>
        <p className="pb-150 font-body-small text-subtle">
          Select the published profiles available to this program. You will choose one explicitly
          for each system when tailoring its controls.
        </p>
        {!draft.catalogRevisionId ? (
          <p className="text-subtle">Choose a catalog edition first.</p>
        ) : matching.length ? (
          <Stack space="space.150">
            {matching.map((profile) => (
              <label key={profile.id} className="inline-flex items-start gap-100 font-body">
                <Checkbox
                  checked={draft.availableProfileResolutionIds.includes(profile.id)}
                  disabled={!profile.supported}
                  onCheckedChange={(checked) => toggleProfile(profile, checked === true)}
                  aria-labelledby={`${id}-${profile.id}`}
                />
                <Stack as="span" space="space.050">
                  <span id={`${id}-${profile.id}`}>{profile.title}</span>
                  <span className="font-body-small text-subtle">
                    Version {profile.version} · {profile.controlCount} controls
                  </span>
                  {!profile.supported ? (
                    <span className="font-body-small text-danger">{profile.errors.join(" ")}</span>
                  ) : (
                    <Badge variant="secondary" tone="neutral" size="xsmall">
                      Published resolution
                    </Badge>
                  )}
                </Stack>
              </label>
            ))}
          </Stack>
        ) : (
          <p className="font-body-small text-subtle">
            This catalog has no compatible published profile resolutions available for program
            setup.
          </p>
        )}
        {error ? (
          <p role="alert" className="pt-150 font-body-small text-danger">
            {error}
          </p>
        ) : null}
      </Section>
      <Section title="Selection and tailoring">
        <p className="font-body-small text-subtle">
          The selected profile provides the starting control set. Explicit include/exclude decisions
          and parameter values become an authored OSCAL profile. Categorization is recorded for the
          system and does not automatically choose or change its profile.
        </p>
      </Section>
    </Stack>
  );
}
