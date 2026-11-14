import { useConfirmation } from "@/components/app/confirmation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Library, Plus, X } from "lucide-react";
import {
  announce,
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  IconButton,
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
  DraftStack,
  ProgramTailoringPreview,
  WizardCatalogOption,
  WizardProfileOption,
} from "@/lib/program-wizard-reference";
import type { PublishedOverlay } from "@/lib/baseline-reads";
import { newestVersions } from "@/lib/program-overlays";
import { BaselineStackTable, type StackRow } from "@/components/prototype/baseline-stack";
import { DraftBaselineMap } from "@/components/prototype/draft-baseline-map";
import { QueryState, type QueryStatus } from "@/components/prototype/work-common";
import { ChoiceField } from "../fields";
import { ProfileTailoringEditor } from "../profile-tailoring/editor";
import { wizardField } from "./issues";
import type { WizardResources } from "./resources";

/**
 * Step 2: the catalog edition and the base profiles, the same records as the Catalog, Profiles and
 * Overlays pages. A chosen base takes published overlays, stacked in the order they apply, and
 * then the program's own tailoring: what goes out, what comes in from the catalog, each with a
 * reason. The stack under each chosen base shows what every layer changes and the baseline that
 * results: one program profile per chosen base.
 */
export function CatalogStep({
  draft,
  onChange,
  catalogs,
  profiles,
  data,
  previews,
  stacks,
  overlays,
  overlayQueries,
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
  /** Each program profile's base with its overlays applied, by the profile's key. */
  stacks: Map<string, DraftStack<WizardResources>>;
  /** The published overlays a base can take. */
  overlays: readonly PublishedOverlay[];
  overlayQueries: QueryStatus[];
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
  // The catalog edition's controls and families, which each draft baseline's map draws.
  const catalogControls = useMemo(
    () =>
      new Map(
        data.controls
          .filter((control) => control.catalog_revision_id === draft.catalogRevisionId)
          .map((control) => [control.id, control]),
      ),
    [data.controls, draft.catalogRevisionId],
  );
  const catalogGroups = useMemo(
    () =>
      data.catalogGroups.filter((group) => group.catalog_revision_id === draft.catalogRevisionId),
    [data.catalogGroups, draft.catalogRevisionId],
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
          {
            key: crypto.randomUUID(),
            baseResolutionId: option.id,
            overlayIds: [],
            tailoring: [],
            parameters: [],
          },
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
  const codes = useMemo(
    () => new Map(data.controls.map((control) => [control.id, control.code])),
    [data.controls],
  );
  // Each overlay at its newest published version: an older one is not offered again.
  const offered = newestVersions(
    overlays.filter((overlay) => overlay.catalogRevisionId === draft.catalogRevisionId),
  );
  /**
   * Combine a chosen reference baseline with a second one, or none: the stack starts from their
   * union, and the overlays and the tailoring above it are checked again.
   */
  function setCombined(key: string, combinedResolutionId: string | null, said: string) {
    onChange({
      ...draft,
      profiles: draft.profiles.map((profile) =>
        profile.key === key ? { ...profile, combinedResolutionId } : profile,
      ),
    });
    announce(said);
  }
  /** Change one program profile's overlay stack; the tailoring above it is checked again. */
  function setOverlays(key: string, overlayIds: string[], said: string) {
    onChange({
      ...draft,
      profiles: draft.profiles.map((profile) =>
        profile.key === key ? { ...profile, overlayIds } : profile,
      ),
    });
    announce(said);
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
              Version {editingOption.version} ·{" "}
              {previews.get(editing.key)?.counts.base ?? editingOption.controlCount} controls
              {editing.overlayIds.length
                ? ` after ${editing.overlayIds.length === 1 ? "its overlay" : `its ${editing.overlayIds.length} overlays`}`
                : " in the base"}
              . What you tailor out and in becomes the last layer of this program profile.
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
          baseResolutionId={stacks.get(editing.key)?.resolutionId ?? editing.baseResolutionId}
          decisions={editing.tailoring}
          parameters={editing.parameters}
          data={stacks.get(editing.key)?.data ?? data}
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
              className="divide-y"
            >
              {catalogs.map((catalog) => (
                // divide-y draws each rule at a row's bottom: the row's end padding sits above it
                // and the group's own gap below it, space.100 on either side.
                <Box key={catalog.id} paddingBlockEnd="space.100">
                  <Inline space="space.200" alignBlock="start" spread="space-between" shouldWrap>
                    <Field orientation="horizontal" className="min-w-0">
                      <RadioGroupItem value={catalog.id} />
                      <FieldContent>
                        <FieldLabel>{catalog.title}</FieldLabel>
                        <FieldDescription>
                          Version {catalog.version}
                          {" · Published OSCAL catalog · "}
                          {catalog.controlCount} {"controls"}
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
                </Box>
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
                Reference catalogs are loaded by a workspace administrator. A program can be set up
                once one is published.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </Section>
      <Section
        title="Base profiles"
        count={draft.profiles.length || null}
        countMax={9999}
        description="Choose the published baselines this program starts from. Stack overlays on a baseline in the order they apply, then tailor it for this program. Each becomes a program profile, and every system adopts one of them."
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
                  const stack = existing ? stacks.get(existing.key) : undefined;
                  const rows: StackRow[] = [
                    ...(stack?.derivation.layers ?? []),
                    ...(tailored && preview
                      ? [
                          {
                            key: "tailoring",
                            kind: "tailoring" as const,
                            title: "Program tailoring",
                            added: preview.counts.added,
                            removed: preview.counts.excluded,
                            total: preview.counts.selected,
                            parameters: existing.parameters.length,
                          },
                        ]
                      : []),
                  ];
                  const available = existing
                    ? offered.filter((overlay) => !existing.overlayIds.includes(overlay.id))
                    : [];
                  return (
                    <Stack key={option.id} space="space.150">
                      <Inline
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
                      {existing && stack ? (
                        <Box paddingInlineStart="space.300">
                          <Stack space="space.100">
                            {/* A reference baseline may start the stack with a second one: their
                                union, the second's controls added as the first layer. */}
                            {option.kind === "reference" ? (
                              <Box className="max-w-layout-measure">
                                <ChoiceField
                                  label="Combine with"
                                  value={existing.combinedResolutionId ?? null}
                                  emptyOption="No second baseline"
                                  placeholder="No second baseline"
                                  options={matching
                                    .filter(
                                      (other) =>
                                        other.kind === "reference" &&
                                        other.supported &&
                                        other.id !== option.id,
                                    )
                                    .map((other) => ({ value: other.id, label: other.title }))}
                                  onChange={(value) => {
                                    const other = matching.find((item) => item.id === value);
                                    setCombined(
                                      existing.key,
                                      value,
                                      other
                                        ? `${option.title} combined with ${other.title}.`
                                        : `${option.title} starts the stack alone.`,
                                    );
                                  }}
                                  description="Start from the union of both baselines: every control either selects."
                                  error={errorFor(wizardField.combined(option.id))}
                                  controlRef={controlRef(wizardField.combined(option.id))}
                                />
                              </Box>
                            ) : null}
                            <BaselineStackTable
                              label={`How the ${option.title} program profile is formed`}
                              reference={{
                                name: option.title,
                                count: stack.derivation.baselineCount,
                              }}
                              layers={rows}
                              actions={(layer) => {
                                // The overlay's place among the overlays: a second baseline may come before them.
                                const index = existing.overlayIds.indexOf(layer.key);
                                return layer.kind === "overlay" ? (
                                  <Inline space="space.050" alignInline="end">
                                    <IconButton
                                      size="small"
                                      variant="subtle"
                                      icon={<ArrowUp />}
                                      label={`Move ${layer.title} earlier`}
                                      {...(index === 0
                                        ? { disabledReason: "It is the first overlay." }
                                        : {})}
                                      onClick={() => {
                                        const ids = [...existing.overlayIds];
                                        ids.splice(index - 1, 2, ids[index]!, ids[index - 1]!);
                                        setOverlays(
                                          existing.key,
                                          ids,
                                          `${layer.title} now applies as layer ${index}.`,
                                        );
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      variant="subtle"
                                      icon={<ArrowDown />}
                                      label={`Move ${layer.title} later`}
                                      {...(index === existing.overlayIds.length - 1
                                        ? { disabledReason: "It is the last overlay." }
                                        : {})}
                                      onClick={() => {
                                        const ids = [...existing.overlayIds];
                                        ids.splice(index, 2, ids[index + 1]!, ids[index]!);
                                        setOverlays(
                                          existing.key,
                                          ids,
                                          `${layer.title} now applies as layer ${index + 2}.`,
                                        );
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      variant="subtle"
                                      icon={<X />}
                                      label={`Remove ${layer.title} from the stack`}
                                      onClick={() =>
                                        setOverlays(
                                          existing.key,
                                          existing.overlayIds.filter((id) => id !== layer.key),
                                          `${layer.title} removed from the stack.`,
                                        )
                                      }
                                    />
                                  </Inline>
                                ) : null;
                              }}
                            />
                            <QueryState queries={overlayQueries}>
                              {available.length ? (
                                <Inline>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          size="small"
                                          variant="secondary"
                                          iconBefore={<Plus />}
                                        >
                                          Add overlay
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="start">
                                      {available.map((overlay) => (
                                        <DropdownMenuItem
                                          key={overlay.id}
                                          onClick={() =>
                                            setOverlays(
                                              existing.key,
                                              [...existing.overlayIds, overlay.id],
                                              `${overlay.title} added as layer ${existing.overlayIds.length + 1}.`,
                                            )
                                          }
                                        >
                                          {overlay.code} · {overlay.title}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </Inline>
                              ) : (
                                <Text as="p" size="small" color="color.text.subtle">
                                  {offered.length
                                    ? "Every published overlay for this edition is in the stack."
                                    : "No published overlays for this catalog edition. Overlays are created and published under Libraries, Overlays."}
                                </Text>
                              )}
                            </QueryState>
                            {/* Where each control ends up, beside what each layer did: the map
                                of the result, its List one toggle away. */}
                            <DraftBaselineMap
                              label={option.title}
                              controls={catalogControls}
                              groups={catalogGroups}
                              stack={stack.derivation}
                              added={tailored && preview ? preview.addedControlIds : NO_IDS}
                              excluded={tailored && preview ? preview.excludedControlIds : NO_IDS}
                            />
                          </Stack>
                        </Box>
                      ) : null}
                    </Stack>
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

const NO_IDS: readonly string[] = [];
