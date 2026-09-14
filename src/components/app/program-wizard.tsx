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
  Badge,
  Box,
  Button,
  Grid,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Stack,
  Stepper,
  Table,
  toast,
} from "@ledger/design-system";
import { useWorkspace } from "./workspace";
import {
  programWizardSchema,
  useCreateProgramWizard,
  type ProgramWizardDraft,
  type SystemWizardDraft,
} from "@/lib/program-wizard";
import {
  catalogProfileOptions,
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardProfileOption,
} from "@/lib/program-wizard-reference";
import type { Row } from "@/lib/models";
import { useWizardResources, type WizardResources } from "./program-wizard/resources";
import { ProgramStep } from "./program-wizard/program";
import { CatalogStep } from "./program-wizard/catalog";
import { SystemsStep } from "./program-wizard/systems";
import { TailoringStep } from "./program-wizard/tailoring";

const steps = [
  "Program",
  "Catalog & profiles",
  "Systems",
  "Categorize & tailor",
  "Review & create",
] as const;
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
    profileResolutionId: "",
    subsystems: [],
    tailoring: [],
    parameters: [],
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
    availableProfileResolutionIds: [],
    systems: [newSystem()],
  };
}

export function ProgramWizard() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const resources = useWizardResources();
  const create = useCreateProgramWizard();
  const [draft, setDraft] = useState(emptyDraft);
  const [index, setIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const bypassBlock = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useBlocker({
    shouldBlockFn: () => {
      if (bypassBlock.current) return false;
      if (inFlight.current) return true;
      return dirty && !window.confirm("Discard this unsaved program setup?");
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
        draft.systems.map((system) => [
          system.key,
          previewProgramTailoring(
            {
              catalogRevisionId: draft.catalogRevisionId,
              profileResolutionId: system.profileResolutionId,
              tailoring: system.tailoring,
              parameters: system.parameters,
            },
            resources.data,
          ),
        ]),
      ),
    [draft, resources.data],
  );
  const issues = useMemo(() => {
    const result: string[][] = [[], [], [], [], []];
    const parsed = programWizardSchema.safeParse(draft);
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const [root, systemIndex, field] = issue.path;
        const step =
          root === "catalogRevisionId" || root === "availableProfileResolutionIds"
            ? 1
            : root === "systems"
              ? field &&
                [
                  "confidentiality",
                  "integrity",
                  "availability",
                  "categorizationRationale",
                  "profileResolutionId",
                  "tailoring",
                  "parameters",
                ].includes(String(field))
                ? 3
                : 2
              : 0;
        const system =
          root === "systems" && typeof systemIndex === "number" ? draft.systems[systemIndex] : null;
        result[step]!.push(
          `${system ? `${system.name || `System ${Number(systemIndex) + 1}`}: ` : ""}${issue.message}`,
        );
      }
    if (resources.ready) {
      if (
        draft.catalogRevisionId &&
        !options.catalogs.some((catalog) => catalog.id === draft.catalogRevisionId)
      )
        result[1]!.push("Choose an available published catalog.");
      if (
        draft.availableProfileResolutionIds.some(
          (id) =>
            !options.profiles.some(
              (profile) =>
                profile.id === id &&
                profile.catalogRevisionId === draft.catalogRevisionId &&
                profile.supported,
            ),
        )
      )
        result[1]!.push(
          "One of the chosen profiles is unavailable or incompatible with this catalog.",
        );
      draft.systems.forEach((system) => {
        if (system.profileResolutionId)
          for (const message of previews.get(system.key)!.errors)
            result[3]!.push(`${system.name || "System"}: ${message}`);
      });
    }
    return result.map((messages) => [...new Set(messages)]);
  }, [draft, options, previews, resources.ready]);
  const blocked = issues[index]?.[0];
  const earlierBlocked = issues.slice(0, index).flat()[0];
  const allErrors = issues.flat();
  const total = new Set(
    [...previews.values()].flatMap((preview) =>
      preview.selectedControls.map((control) => control.id),
    ),
  ).size;
  const step = steps[index]!;
  const wide = index >= 3;
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
        description: `${draft.systems.length} systems and their authored control profiles were saved.`,
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
        <div className="min-w-0">
          <PageHeader.Title>
            {draft.name.trim() ? `New program · ${draft.name.trim()}` : "New program"}
          </PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <Button
            variant="subtle"
            disabled={busy}
            onClick={() => void navigate({ to: "/programs" })}
          >
            Cancel
          </Button>
        </PageHeader.Actions>
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
          Loading published catalogs, profiles, and workspace parties…
        </p>
      ) : (
        <Grid
          gap="space.300"
          templateColumns={
            wide ? { lg: "200px minmax(0,1fr)" } : { lg: "200px minmax(0,1fr) 272px" }
          }
        >
          <aside className="lg:sticky-rail">
            <Stepper orientation="vertical">
              {steps.map((label, stepIndex) => (
                <Stepper.Item
                  key={label}
                  label={label}
                  state={stepIndex < index ? "done" : stepIndex === index ? "current" : "upcoming"}
                  meta={
                    stepIndex === 2
                      ? `${draft.systems.length} system${draft.systems.length === 1 ? "" : "s"}`
                      : `Step ${stepIndex + 1} of ${steps.length}`
                  }
                  {...(!busy && (stepIndex < index || (stepIndex === index + 1 && !blocked))
                    ? { onSelect: () => setIndex(stepIndex) }
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
                  />
                ) : null}
                {index === 2 ? (
                  <SystemsStep
                    draft={draft}
                    onChange={change}
                    parties={resources.parties}
                    newSystem={newSystem}
                  />
                ) : null}
                {index === 3 ? (
                  <TailoringStep
                    draft={draft}
                    onChange={change}
                    data={resources.data}
                    profiles={options.profiles}
                    previews={previews}
                  />
                ) : null}
                {index === 4 ? (
                  <ReviewStep
                    draft={draft}
                    data={resources.data}
                    parties={resources.parties}
                    profiles={options.profiles}
                    previews={previews}
                    total={total}
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
            {index === 4 && allErrors.length ? (
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
              spread="space-between"
            >
              <Button
                variant="subtle"
                disabled={busy}
                onClick={() =>
                  index === 0 ? void navigate({ to: "/programs" }) : setIndex(index - 1)
                }
              >
                {index === 0 ? "Cancel" : "Back"}
              </Button>
              <Inline space="space.150" alignBlock="center">
                {blocked || earlierBlocked ? (
                  <span className="font-body-small text-subtle">{blocked ?? earlierBlocked}</span>
                ) : null}
                {index < steps.length - 1 ? (
                  <Button
                    variant="primary"
                    disabled={!!blocked || !!earlierBlocked || busy || !writable}
                    title={blocked ?? earlierBlocked}
                    onClick={() => setIndex(index + 1)}
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
          {wide ? null : (
            <aside className="lg:sticky-rail">
              <Inspector.Group title="Program">
                <KeyValue label="Name" wrap>
                  {draft.name || "Not entered"}
                </KeyValue>
                <KeyValue label="Code">{draft.code || "Not entered"}</KeyValue>
                <KeyValue label="Catalog" wrap>
                  {options.catalogs.find((catalog) => catalog.id === draft.catalogRevisionId)
                    ?.title ?? "Not selected"}
                </KeyValue>
                <KeyValue label="Base profiles">
                  {draft.availableProfileResolutionIds.length}
                </KeyValue>
                <KeyValue label="Systems">{draft.systems.length}</KeyValue>
                <KeyValue label="Subsystems">
                  {draft.systems.reduce((count, system) => count + system.subsystems.length, 0)}
                </KeyValue>
              </Inspector.Group>
              <Inspector.Group title="On create">
                <p className="font-body-small text-subtle">
                  The program, systems, composition, categorization, and tailored profiles are saved
                  together. Review the exact selection before confirming.
                </p>
              </Inspector.Group>
            </aside>
          )}
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
              {draft.systems.length} systems,{" "}
              {draft.systems.reduce((count, system) => count + system.subsystems.length, 0)}{" "}
              subsystems, and {total} distinct selected controls will be saved with the program. The
              full setup is saved as one transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelRef} disabled={busy}>
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
    </Stack>
  );
}

function ReviewStep({
  draft,
  data,
  parties,
  profiles,
  previews,
  total,
}: {
  draft: ProgramWizardDraft;
  data: WizardResources;
  parties: Row<"parties">[];
  profiles: WizardProfileOption[];
  previews: Map<string, ProgramTailoringPreview>;
  total: number;
}) {
  const partyName = (id: string | null) =>
    parties.find((party) => party.id === id)?.name ?? "Not assigned";
  const catalog = data.catalogRevisions.find((item) => item.id === draft.catalogRevisionId);
  const decisions = draft.systems.flatMap((system) =>
    system.tailoring.map((decision) => ({ system, decision })),
  );
  const overrides = draft.systems.flatMap((system) =>
    system.parameters.map((override) => ({ system, override })),
  );
  return (
    <Stack space="space.200">
      <Section title="Program">
        <Grid
          templateColumns={{ base: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }}
          columnGap="space.300"
          rowGap="space.050"
        >
          <KeyValue label="Name" wrap>
            {draft.name}
          </KeyValue>
          <KeyValue label="Code">{draft.code}</KeyValue>
          <KeyValue label="Sponsor" wrap>
            {partyName(draft.sponsorPartyId)}
          </KeyValue>
          <KeyValue label="Catalog" wrap>
            {catalog?.title} · {catalog?.version}
          </KeyValue>
          <KeyValue label="Starts on">{draft.startsOn ?? "Not set"}</KeyValue>
          <KeyValue label="Ends on">{draft.endsOn ?? "Not set"}</KeyValue>
          {draft.roles.map((assignment) => (
            <KeyValue
              key={`${assignment.role}-${assignment.partyId}`}
              label={assignment.role.replaceAll("_", " ")}
              wrap
            >
              {partyName(assignment.partyId)}
            </KeyValue>
          ))}
        </Grid>
        {draft.description ? (
          <p className="pt-150 font-body-small whitespace-pre-wrap">{draft.description}</p>
        ) : null}
      </Section>
      <Section title="Systems" count={`${draft.systems.length} · ${total} distinct controls`}>
        <Table>
          <thead>
            <Table.Row>
              <Table.Header>System</Table.Header>
              <Table.Header>C · I · A</Table.Header>
              <Table.Header>Base profile</Table.Header>
              <Table.Header className="text-right">Controls</Table.Header>
              <Table.Header className="text-right">Subsystems</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {draft.systems.map((system) => {
              const profile = profiles.find((item) => item.id === system.profileResolutionId);
              return (
                <Table.Row key={system.key}>
                  <Table.Cell>
                    <span className="font-body font-semibold">{system.name}</span>
                    <p className="font-body-small text-subtle">{system.code}</p>
                  </Table.Cell>
                  <Table.Cell>
                    <Inline space="space.050">
                      {[system.confidentiality, system.integrity, system.availability].map(
                        (impact, index) => (
                          <Badge
                            key={index}
                            size="xsmall"
                            variant="secondary"
                            tone={
                              impact === "high"
                                ? "danger"
                                : impact === "moderate"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {impact ?? "Unset"}
                          </Badge>
                        ),
                      )}
                    </Inline>
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal">
                    {profile?.title} · {profile?.version}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {previews.get(system.key)?.counts.selected}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {system.subsystems.length}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Section>
      {draft.systems.map((system) => (
        <Section key={system.key} title={`${system.code} · Categorization and composition`}>
          <Stack space="space.100">
            <KeyValue label="System owner">{partyName(system.ownerPartyId)}</KeyValue>
            <KeyValue label="System type">{system.type?.replaceAll("_", " ")}</KeyValue>
            {system.description ? (
              <p className="font-body-small whitespace-pre-wrap">{system.description}</p>
            ) : null}
            <p className="font-body-small whitespace-pre-wrap">{system.categorizationRationale}</p>
            {system.subsystems.length ? (
              <Table>
                <thead>
                  <Table.Row>
                    <Table.Header>Subsystem</Table.Header>
                    <Table.Header>Parent</Table.Header>
                    <Table.Header>Type</Table.Header>
                    <Table.Header>Function</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {system.subsystems.map((node) => (
                    <Table.Row key={node.key}>
                      <Table.Cell>
                        {node.code} · {node.name}
                      </Table.Cell>
                      <Table.Cell>
                        {system.subsystems.find((parent) => parent.key === node.parentKey)?.name ??
                          system.name}
                      </Table.Cell>
                      <Table.Cell>{node.type}</Table.Cell>
                      <Table.Cell className="whitespace-normal">
                        {node.description || "Not entered"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="font-body-small text-subtle">No subsystems.</p>
            )}
          </Stack>
        </Section>
      ))}
      <Section title="Control decisions" count={decisions.length || null}>
        {decisions.length ? (
          <Table>
            <thead>
              <Table.Row>
                <Table.Header>System</Table.Header>
                <Table.Header>Control</Table.Header>
                <Table.Header>Decision</Table.Header>
                <Table.Header>Rationale</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {decisions.map(({ system, decision }) => (
                <Table.Row key={`${system.key}-${decision.controlId}`}>
                  <Table.Cell>{system.code}</Table.Cell>
                  <Table.Cell>
                    {data.controls.find((control) => control.id === decision.controlId)?.code}
                  </Table.Cell>
                  <Table.Cell>{decision.action}</Table.Cell>
                  <Table.Cell className="whitespace-normal">{decision.rationale}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="font-body-small text-subtle">
            No manual changes to the selected base profiles.
          </p>
        )}
      </Section>
      <Section title="Parameter overrides" count={overrides.length || null}>
        {overrides.length ? (
          <Table>
            <thead>
              <Table.Row>
                <Table.Header>System</Table.Header>
                <Table.Header>Parameter</Table.Header>
                <Table.Header>Values</Table.Header>
                <Table.Header>Rationale</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {overrides.map(({ system, override }) => (
                <Table.Row key={`${system.key}-${override.parameterId}`}>
                  <Table.Cell>{system.code}</Table.Cell>
                  <Table.Cell>
                    {
                      data.parameters.find((parameter) => parameter.id === override.parameterId)
                        ?.source_id
                    }
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal">
                    {override.values.join("; ")}
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal">{override.rationale}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="font-body-small text-subtle">
            No overrides. Existing catalog and profile values are inherited.
          </p>
        )}
      </Section>
      <Section title="On create">
        <p className="font-body-small text-subtle">
          Each system receives its composition tree, categorized scope, authored OSCAL profile and
          resolved control selection, plus a draft system security plan. Unset parameter values
          remain unset. This setup does not record an approval or authorization decision.
        </p>
      </Section>
    </Stack>
  );
}
