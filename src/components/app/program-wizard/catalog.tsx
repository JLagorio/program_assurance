import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Checkbox,
  Inline,
  RadioGroup,
  RadioGroupItem,
  Section,
  Stack,
  TextLink,
} from "@ledger/design-system";
import type { ProgramWizardDraft } from "@/lib/program-wizard";
import type {
  ProgramTailoringPreview,
  WizardCatalogOption,
  WizardProfileOption,
} from "@/lib/program-wizard-reference";
import { ProfileTailoringEditor } from "../profile-tailoring/editor";
import type { WizardResources } from "./resources";

/**
 * Step 2: the catalog edition and the base profiles, the same records as the Catalog and Profiles
 * pages. A chosen base can be tailored for this program: what goes out of the base, what comes in
 * from the catalog, each with a reason. The result is one program profile per chosen base.
 */
export function CatalogStep({
  draft,
  onChange,
  catalogs,
  profiles,
  data,
  previews,
  editingKey,
  onEditingKeyChange,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  catalogs: WizardCatalogOption[];
  profiles: WizardProfileOption[];
  data: WizardResources;
  previews: Map<string, ProgramTailoringPreview>;
  editingKey: string | null;
  onEditingKeyChange: (key: string | null) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const matching = profiles.filter(
    (profile) => profile.catalogRevisionId === draft.catalogRevisionId,
  );
  const chosen = (option: WizardProfileOption) =>
    draft.profiles.find((profile) => profile.baseResolutionId === option.id);
  function changeCatalog(catalogRevisionId: string) {
    if (draft.catalogRevisionId === catalogRevisionId) return;
    const decisions = draft.profiles.reduce(
      (count, profile) => count + profile.tailoring.length,
      0,
    );
    const overrides = draft.profiles.reduce(
      (count, profile) => count + profile.parameters.length,
      0,
    );
    if (
      draft.profiles.length &&
      !window.confirm(
        `Change the catalog? This clears the ${draft.profiles.length} chosen profile(s), ${decisions} control decisions, and ${overrides} parameter overrides. Program details, systems, and categorization will be kept.`,
      )
    )
      return;
    onChange({
      ...draft,
      catalogRevisionId,
      profiles: [],
      systems: draft.systems.map((system) => ({ ...system, profileKey: "" })),
    });
    onEditingKeyChange(null);
    setError("");
  }
  function toggleProfile(option: WizardProfileOption, checked: boolean) {
    const existing = chosen(option);
    if (checked && !existing) {
      onChange({
        ...draft,
        profiles: [
          ...draft.profiles,
          { key: crypto.randomUUID(), baseResolutionId: option.id, tailoring: [], parameters: [] },
        ],
      });
      setError("");
      return;
    }
    if (!checked && existing) {
      const used = draft.systems.filter((system) => system.profileKey === existing.key);
      if (used.length) {
        setError(
          `This profile is used by ${used.map((system) => system.name || "an unnamed system").join(", ")}. Choose another program profile for those systems before removing it here.`,
        );
        return;
      }
      if (
        (existing.tailoring.length || existing.parameters.length) &&
        !window.confirm(
          `Remove ${option.title}? Its ${existing.tailoring.length} control decisions and ${existing.parameters.length} parameter overrides will be discarded.`,
        )
      )
        return;
      onChange({
        ...draft,
        profiles: draft.profiles.filter((profile) => profile.key !== existing.key),
      });
      if (editingKey === existing.key) onEditingKeyChange(null);
      setError("");
    }
  }
  const editing = draft.profiles.find((profile) => profile.key === editingKey);
  const editingOption = profiles.find((option) => option.id === editing?.baseResolutionId);
  if (editing && editingOption) {
    return (
      <Section
        title={`Tailor for this program · ${editingOption.title}`}
        description={`Version ${editingOption.version} · ${editingOption.controlCount} controls in the base. What you tailor out and in becomes a program profile layered on this base.`}
        action={
          <Button variant="primary" size="small" onClick={() => onEditingKeyChange(null)}>
            Done
          </Button>
        }
      >
        <ProfileTailoringEditor
          catalogRevisionId={draft.catalogRevisionId}
          baseResolutionId={editing.baseResolutionId}
          decisions={editing.tailoring}
          parameters={editing.parameters}
          title={editingOption.title}
          data={data}
          preview={previews.get(editing.key)}
          onChange={(next) =>
            onChange({
              ...draft,
              profiles: draft.profiles.map((profile) =>
                profile.key === editing.key ? { ...profile, ...next } : profile,
              ),
            })
          }
        />
      </Section>
    );
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
                    Version {catalog.version} · Published OSCAL catalog ·{" "}
                    <TextLink
                      render={<Link to="/catalog" search={{ edition: catalog.id }} />}
                      target="_blank"
                    >
                      Open catalog
                    </TextLink>
                  </span>
                </Stack>
              </label>
              <span className="shrink-0 font-body-small tabular-nums text-subtle">
                {catalog.controlCount} controls
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
      <Section title="Base profiles" count={draft.profiles.length || null}>
        <p className="pb-150 font-body-small text-subtle">
          Choose the published profiles this program starts from. Each becomes a program profile:
          the base as-is, or tailored for this program. Every system adopts one of them.
        </p>
        {!draft.catalogRevisionId ? (
          <p className="text-subtle">Choose a catalog edition first.</p>
        ) : matching.length ? (
          <Stack space="space.150">
            {matching.map((option) => {
              const existing = chosen(option);
              const preview = existing ? previews.get(existing.key) : undefined;
              const tailored =
                !!existing && (existing.tailoring.length || existing.parameters.length);
              return (
                <Inline
                  key={option.id}
                  space="space.200"
                  alignBlock="start"
                  spread="space-between"
                  className="py-050"
                >
                  <label className="inline-flex min-w-0 items-start gap-100 font-body">
                    <Checkbox
                      checked={!!existing}
                      disabled={!option.supported}
                      onCheckedChange={(checked) => toggleProfile(option, checked === true)}
                      aria-labelledby={`${id}-${option.id}`}
                    />
                    <Stack as="span" space="space.050" className="min-w-0">
                      <Inline as="span" space="space.100" alignBlock="center" shouldWrap>
                        <span id={`${id}-${option.id}`}>{option.title}</span>
                        <Badge
                          variant="secondary"
                          tone={option.kind === "overlay" ? "information" : "neutral"}
                          size="xsmall"
                        >
                          {option.kind === "overlay"
                            ? `Tailored from ${option.baseTitle ?? "a base profile"}`
                            : "Reference profile"}
                        </Badge>
                      </Inline>
                      <span className="font-body-small text-subtle">
                        Version {option.version} · {option.controlCount} of{" "}
                        {option.catalogControlCount} catalog controls ·{" "}
                        {option.profileId ? (
                          <TextLink
                            render={
                              <Link
                                to="/profiles/$profileId"
                                params={{ profileId: option.profileId }}
                              />
                            }
                            target="_blank"
                          >
                            Open profile
                          </TextLink>
                        ) : null}
                      </span>
                      {!option.supported ? (
                        <span className="font-body-small text-danger">
                          {option.errors.join(" ")}
                        </span>
                      ) : null}
                    </Stack>
                  </label>
                  {existing ? (
                    <Button
                      size="small"
                      variant={tailored ? "secondary" : "subtle"}
                      onClick={() => onEditingKeyChange(existing.key)}
                    >
                      {tailored
                        ? `Edit tailoring · Out ${preview?.counts.excluded ?? 0} · In ${preview?.counts.added ?? 0}`
                        : "Tailor for this program…"}
                    </Button>
                  ) : null}
                </Inline>
              );
            })}
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
    </Stack>
  );
}
