import { useConfirmation } from "@/components/app/confirmation";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Library } from "lucide-react";
import {
  announce,
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  Inline,
  RadioGroup,
  RadioGroupItem,
  Section,
  Stack,
  Text,
  TextLink,
} from "@ledger/design-system";
import type { ProgramWizardDraft } from "@/lib/program-wizard";
import type {
  ProgramTailoringPreview,
  WizardCatalogOption,
  WizardProfileOption,
} from "@/lib/program-wizard-reference";
import { ProfileTailoringEditor } from "../profile-tailoring/editor";
import { wizardField } from "./issues";
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
  errorFor,
  controlRef,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  catalogs: WizardCatalogOption[];
  profiles: WizardProfileOption[];
  data: WizardResources;
  previews: Map<string, ProgramTailoringPreview>;
  editingKey: string | null;
  onEditingKeyChange: (key: string | null) => void;
  /** The field's message from the last Continue, once the step has been checked. */
  errorFor: (field: string) => string | undefined;
  /** Registers a field's control, for focus from the error summary. */
  controlRef: (field: string) => (node: HTMLElement | null) => void;
}) {
  const { confirm, confirmation } = useConfirmation();
  const [refused, setRefused] = useState<{ id: string; message: string } | null>(null);
  const tailoringTitle = useRef<HTMLHeadingElement>(null);
  const tailorButtons = useRef(new Map<string, HTMLElement | null>());
  const shown = useRef(editingKey);
  // The tailoring editor replaces the list: its title takes focus, and on the way back the
  // profile's tailoring button does, so the reader stays where they were.
  useEffect(() => {
    const previous = shown.current;
    shown.current = editingKey;
    if (editingKey === previous) return;
    if (editingKey) tailoringTitle.current?.focus();
    else if (previous) tailorButtons.current.get(previous)?.focus();
  }, [editingKey]);

  const matching = profiles.filter(
    (profile) => profile.catalogRevisionId === draft.catalogRevisionId,
  );
  const chosen = (option: WizardProfileOption) =>
    draft.profiles.find((profile) => profile.baseResolutionId === option.id);
  async function changeCatalog(catalogRevisionId: string) {
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
      !(await confirm({
        title: "Change catalog?",
        confirmLabel: "Change catalog",
        variant: "danger",
        description: `This clears the ${draft.profiles.length} chosen profile${draft.profiles.length === 1 ? "" : "s"}, ${decisions} control decision${decisions === 1 ? "" : "s"} and ${overrides} parameter override${overrides === 1 ? "" : "s"}. Program details, systems and categorization are kept.`,
      }))
    )
      return;
    onChange({
      ...draft,
      catalogRevisionId,
      profiles: [],
      systems: draft.systems.map((system) => ({ ...system, profileKey: "" })),
    });
    onEditingKeyChange(null);
    setRefused(null);
  }
  async function toggleProfile(option: WizardProfileOption, checked: boolean) {
    const existing = chosen(option);
    if (checked && !existing) {
      onChange({
        ...draft,
        profiles: [
          ...draft.profiles,
          { key: crypto.randomUUID(), baseResolutionId: option.id, tailoring: [], parameters: [] },
        ],
      });
      setRefused(null);
      return;
    }
    if (!checked && existing) {
      const used = draft.systems.filter((system) => system.profileKey === existing.key);
      if (used.length) {
        const message = `${used.map((system) => system.name || "An unnamed system").join(", ")} ${used.length === 1 ? "adopts" : "adopt"} this profile. Choose another program profile for ${used.length === 1 ? "it" : "them"} before you clear it.`;
        setRefused({ id: option.id, message });
        // The message is beside the box the reader just pressed, which keeps focus.
        announce(message);
        return;
      }
      if (
        (existing.tailoring.length || existing.parameters.length) &&
        !(await confirm({
          title: "Remove profile?",
          confirmLabel: "Remove profile",
          variant: "danger",
          description: `Its ${existing.tailoring.length} control decision${existing.tailoring.length === 1 ? "" : "s"} and ${existing.parameters.length} parameter override${existing.parameters.length === 1 ? "" : "s"} for ${option.title} will be discarded.`,
        }))
      )
        return;
      onChange({
        ...draft,
        profiles: draft.profiles.filter((profile) => profile.key !== existing.key),
      });
      if (editingKey === existing.key) onEditingKeyChange(null);
      setRefused(null);
    }
  }
  const editing = draft.profiles.find((profile) => profile.key === editingKey);
  const editingOption = profiles.find((option) => option.id === editing?.baseResolutionId);
  if (editing && editingOption) {
    return (
      <Section>
        <Section.Header>
          <Section.Heading>
            <Section.Title ref={tailoringTitle} tabIndex={-1} className="outline-none">
              Tailor for this program · {editingOption.title}
            </Section.Title>
            <Section.Description>
              Version {editingOption.version} · {editingOption.controlCount} controls in the base.
              What you tailor out and in becomes a program profile layered on this base.
            </Section.Description>
          </Section.Heading>
          <Section.Actions>
            {/* The step's own primary is Continue; returning to the profiles is secondary. */}
            <Button size="small" onClick={() => onEditingKeyChange(null)}>
              Done
            </Button>
          </Section.Actions>
        </Section.Header>
        <ProfileTailoringEditor
          catalogRevisionId={draft.catalogRevisionId}
          baseResolutionId={editing.baseResolutionId}
          decisions={editing.tailoring}
          parameters={editing.parameters}
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
  const catalogError = errorFor("catalog");
  const profilesError = errorFor("profiles");
  return (
    <Stack space="space.300">
      {/* A record's link opens a new tab, so reading it never leaves the draft. It sits beside the
          option, not in it, so the option's description is the edition's facts alone. */}
      <Section title="Catalog edition">
        {catalogs.length ? (
          <Field invalid={catalogError ? true : undefined} required>
            {/* Controlled from the first render: no edition yet is a value no item has. */}
            <RadioGroup<string>
              ref={controlRef("catalog")}
              aria-label="Catalog edition"
              value={draft.catalogRevisionId}
              onValueChange={(value) => {
                if (value) void changeCatalog(value);
              }}
              className="gap-0 divide-y"
            >
              {catalogs.map((catalog) => (
                <Inline
                  key={catalog.id}
                  className="py-100"
                  space="space.200"
                  alignBlock="start"
                  spread="space-between"
                  shouldWrap
                >
                  <Field orientation="horizontal" className="min-w-0">
                    <RadioGroupItem value={catalog.id} />
                    <FieldContent>
                      <FieldLabel>{catalog.title}</FieldLabel>
                      <FieldDescription>
                        Version {catalog.version} · Published OSCAL catalog · {catalog.controlCount}{" "}
                        controls
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                  <TextLink
                    size="small"
                    newTab
                    render={<Link to="/catalog" search={{ edition: catalog.id }} />}
                  >
                    Open catalog
                  </TextLink>
                </Inline>
              ))}
            </RadioGroup>
            {catalogError ? <FieldError>{catalogError}</FieldError> : null}
          </Field>
        ) : (
          <Empty size="compact">
            <EmptyMedia variant="icon" aria-hidden>
              <Library />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No published catalog editions</EmptyTitle>
              <EmptyDescription>
                Import a catalog into this workspace's reference data to set up a program.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </Section>
      <Section
        title="Base profiles"
        count={draft.profiles.length || null}
        description="The published profiles this program starts from. Each becomes a program profile, the base as it is or tailored for this program, and every system adopts one of them."
      >
        {!draft.catalogRevisionId ? (
          <Text as="p" color="color.text.subtle">
            Choose a catalog edition first.
          </Text>
        ) : matching.length ? (
          <Field invalid={profilesError ? true : undefined} required>
            <CheckboxGroup
              ref={controlRef("profiles")}
              value={draft.profiles.map((profile) => profile.baseResolutionId)}
              onValueChange={(next) => {
                const option = matching.find((item) => next.includes(item.id) !== !!chosen(item));
                if (option) void toggleProfile(option, next.includes(option.id));
              }}
            >
              {/* The Section's heading shows the name; the legend names the group and says it is required. */}
              <FieldLegend className="sr-only">Base profiles</FieldLegend>
              <Stack space="space.150">
                {matching.map((option) => {
                  const existing = chosen(option);
                  const preview = existing ? previews.get(existing.key) : undefined;
                  const tailored =
                    !!existing && (existing.tailoring.length || existing.parameters.length);
                  const rowError =
                    errorFor(wizardField.profile(option.id)) ??
                    (refused?.id === option.id ? refused.message : undefined);
                  return (
                    <Inline
                      key={option.id}
                      space="space.200"
                      alignBlock="start"
                      spread="space-between"
                      shouldWrap
                    >
                      <Field
                        orientation="horizontal"
                        className="min-w-0"
                        invalid={rowError ? true : undefined}
                      >
                        {/* An unavailable profile stays in the tab order, read-only, so its
                            reason (the description) is heard where the reader meets it. */}
                        <Checkbox
                          value={option.id}
                          readOnly={!option.supported && !existing}
                          ref={controlRef(wizardField.profile(option.id))}
                        />
                        <FieldContent>
                          <FieldLabel>{option.title}</FieldLabel>
                          <FieldDescription>
                            <Badge
                              variant="secondary"
                              tone={option.kind === "overlay" ? "information" : "neutral"}
                              size="xsmall"
                            >
                              {option.kind === "overlay"
                                ? `Tailored from ${option.baseTitle ?? "a base profile"}`
                                : "Reference profile"}
                            </Badge>{" "}
                            Version {option.version} · {option.controlCount} of{" "}
                            {option.catalogControlCount} catalog controls
                          </FieldDescription>
                          {!option.supported ? (
                            <FieldDescription>
                              Not available: {option.errors.join(" ")}
                            </FieldDescription>
                          ) : null}
                          {rowError ? <FieldError>{rowError}</FieldError> : null}
                        </FieldContent>
                      </Field>
                      <Inline space="space.150" alignBlock="center" shouldWrap>
                        {option.profileId ? (
                          <TextLink
                            size="small"
                            newTab
                            render={
                              <Link
                                to="/profiles/$profileId"
                                params={{ profileId: option.profileId }}
                              />
                            }
                          >
                            Open profile
                          </TextLink>
                        ) : null}
                        {existing ? (
                          <Button
                            ref={(node: HTMLElement | null) => {
                              tailorButtons.current.set(existing.key, node);
                            }}
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
                    </Inline>
                  );
                })}
              </Stack>
              {profilesError ? <FieldError>{profilesError}</FieldError> : null}
            </CheckboxGroup>
          </Field>
        ) : (
          <Empty size="compact">
            <EmptyMedia variant="icon" aria-hidden>
              <Library />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No profiles for this edition</EmptyTitle>
              <EmptyDescription>
                This catalog edition has no published profile resolution that program setup can use.
                Choose another edition.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </Section>
      {confirmation}
    </Stack>
  );
}
