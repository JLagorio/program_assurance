import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  ErrorSummary,
  type ErrorSummaryIssue,
  FieldSet,
  Grid,
  Inline,
  PageHeader,
  Section,
  Stack,
  Stepper,
  StickyRail,
  toast,
  VisuallyHidden,
} from "@ledger/design-system";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { QueryState } from "@/components/prototype/work-common";
import { useFormFeedback } from "./form-feedback";
import { Page } from "./shell";
import { useDraftGuard } from "./use-draft-guard";
import { useWorkspace } from "./workspace";
import {
  useCreateProgramWizard,
  type ProgramProfileDraft,
  type ProgramWizardDraft,
  type SystemWizardDraft,
} from "@/lib/program-wizard";
import { catalogProfileOptions, previewProgramTailoring } from "@/lib/program-wizard-reference";
import { useWizardResources } from "./program-wizard/resources";
import { ProgramStep } from "./program-wizard/program";
import { CatalogStep } from "./program-wizard/catalog";
import { ElementsStep, type SheetEditing } from "./program-wizard/elements";
import { ReviewStep } from "./program-wizard/review";
import { wizardIssues, wizardRow, type WizardIssue } from "./program-wizard/issues";

const steps = ["Program", "Catalog & profiles", "Systems & components", "Review & create"] as const;
const last = steps.length - 1;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

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

/** Where focus goes once the next render has committed. */
type Arrival =
  { kind: "heading" } | { kind: "field"; field: string } | { kind: "row"; key: string };

const tabbable =
  'input:not([type="hidden"]):not([aria-hidden="true"]):not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex="0"]';
/** Focuses the control itself, or the first one inside a group (a RadioGroup, a CheckboxGroup). */
function focusControl(node: HTMLElement | null | undefined) {
  if (!node) return;
  (node.matches(tabbable) ? node : (node.querySelector<HTMLElement>(tabbable) ?? node)).focus();
}

/**
 * Program setup, the only way to create a program: four steps on one page, validated when the
 * reader continues. Each step's issues mark their fields; several are listed in an ErrorSummary
 * whose items lead to the field, on its step or in the element Sheet. Each step change moves focus
 * to the new step's heading, which names the step and its place.
 */
export function ProgramWizard() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const resources = useWizardResources();
  const create = useCreateProgramWizard();
  const formId = useId();
  const feedback = useFormFeedback<string>();
  const [draft, setDraft] = useState(emptyDraft);
  const [index, setIndex] = useState(0);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetEditing | null>(null);
  const [dirty, setDirty] = useState(false);
  // Steps whose issues show at their fields: each one the reader has tried to leave.
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  // The issues from the last attempt, for the ErrorSummary; recomputing them would re-announce it.
  const [summary, setSummary] = useState<WizardIssue[]>([]);
  const [attempts, setAttempts] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const arrival = useRef<Arrival | null>(null);
  const settled = useRef(false);
  const leave = useRef(() => void navigate({ to: "/programs" }));
  const guard = useDraftGuard({
    dirty,
    onClose: () => leave.current(),
    description: `Your program setup will be lost: its details, ${plural(draft.profiles.length, "base profile")} and ${plural(draft.systems.length, "system")}.`,
  });

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
  // The catalog step checks the draft against the reference records once they are in, while the
  // library and the products may still be loading.
  const referenceReady = resources.stepReady(1);
  const issues = useMemo(
    () =>
      wizardIssues({
        draft,
        ready: { reference: referenceReady, library: resources.ready },
        catalogs: options.catalogs,
        profiles: options.profiles,
        previews,
        libraryItems: resources.libraryItems,
        productItems: resources.productItems,
      }),
    [
      draft,
      referenceReady,
      resources.ready,
      options,
      previews,
      resources.libraryItems,
      resources.productItems,
    ],
  );
  const errorFor = (field: string) =>
    issues.find((issue) => issue.field === field && checked.has(issue.step))?.message;

  // Focus lands after the render that shows its target: the new step's heading, or a field.
  useEffect(() => {
    const next = arrival.current;
    arrival.current = null;
    if (!next) return;
    if (next.kind === "heading") heading.current?.focus();
    else if (next.kind === "field") focusControl(feedback.node(next.field));
    else focusControl(wizardRow(next.key));
  });
  // On arrival the first field takes focus, once the program step's records have loaded; the
  // catalog and the library go on loading behind it.
  const programReady = resources.stepReady(0);
  useEffect(() => {
    if (!programReady || settled.current) return;
    settled.current = true;
    feedback.node("name")?.focus();
  }, [programReady, feedback]);

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
  const unavailable = !writable ? "An editor, admin, or owner can create a program." : undefined;
  // A step is checked against what it shows, so it continues once that has loaded.
  const stepReady = resources.stepReady(index);
  const loading = (records: boolean) =>
    records
      ? undefined
      : resources.stepQueries(index).some((query) => query.error)
        ? "Load this step's published records first: use Retry loading above."
        : "This step's published records are still loading.";
  // While the tailoring editor is open, Continue is a plain button and Enter does not submit.
  const formActive = !(index === 1 && editingKey);

  function change(next: ProgramWizardDraft) {
    if (guard.busy) return;
    setDraft(next);
    setDirty(true);
  }
  /** Shows a step. Focus goes to its heading unless the caller sends it to a field. */
  function arrive(next: number, focus: Arrival | null = { kind: "heading" }) {
    arrival.current = focus;
    setEditingKey(null);
    setSheet(null);
    setSummary([]);
    setIndex(next);
  }
  /** Leads to an issue's field: its step, the element Sheet on its row, or the row itself. */
  function lead(issue: WizardIssue): Pick<ErrorSummaryIssue, "target" | "onSelect"> {
    const inSheet = !!issue.sheet && !issue.row;
    const target = issue.row
      ? () => wizardRow(issue.row!)
      : inSheet
        ? undefined
        : () => feedback.node(issue.field);
    const onSelect =
      issue.step !== index || inSheet
        ? () => {
            if (issue.step !== index) arrive(issue.step, null);
            if (inSheet) setSheet({ ...issue.sheet!, focus: issue.field });
          }
        : undefined;
    return { ...(target ? { target } : {}), ...(onSelect ? { onSelect } : {}) };
  }
  /** One issue takes the reader to its field; several are listed, and the list takes focus. */
  function report(found: WizardIssue[]) {
    setChecked((previous) => new Set([...previous, index, ...found.map((issue) => issue.step)]));
    setAttempts((count) => count + 1);
    if (found.length !== 1) {
      setSummary(found);
      return;
    }
    const issue = found[0]!;
    setSummary([]);
    const inSheet = !!issue.sheet && !issue.row;
    const focus: Arrival | null = issue.row
      ? { kind: "row", key: issue.row }
      : inSheet
        ? null
        : { kind: "field", field: issue.field };
    if (issue.step !== index) arrive(issue.step, focus);
    else arrival.current = focus;
    // The Sheet's initial focus is the field.
    if (inSheet) setSheet({ ...issue.sheet!, focus: issue.field });
  }
  function advance() {
    if (!writable || guard.busy || !stepReady) return;
    const blocking = issues.filter((issue) => issue.step <= index);
    if (blocking.length) report(blocking);
    else arrive(index + 1);
  }
  async function review() {
    if (!writable || guard.busy || !resources.ready) return;
    if (issues.length) {
      report(issues);
      return;
    }
    // The prompt holds while the program is created, and says a failure inside itself, with Create
    // program as the retry; the setup is kept either way.
    let programId: string | null = null;
    const created = await guard.confirm({
      title: `Create ${draft.name.trim()}?`,
      // A count of none says nothing, so only the sources the draft uses are named.
      description: `${plural(draft.systems.length, "system")}${productCount ? ` (${productCount} from products)` : ""}, ${plural(elementCount, "element")}${libraryCount ? ` (${libraryCount} from the library)` : ""}, ${plural(draft.profiles.length, "program profile")} and ${total} distinct selected controls will be saved with the program, as one transaction.`,
      confirmLabel: "Create program",
      variant: "primary",
      failureTitle: "The program was not created",
      action: async () => {
        if (!guard.start()) throw new Error("The program is already being created.");
        try {
          programId = (await create.mutateAsync(draft)).programId;
        } catch (cause) {
          const message = cause instanceof Error ? cause.message.trim() : "The request failed.";
          throw new Error(
            `${/[.!?]$/.test(message) ? message : `${message}.`} Nothing was saved and your setup is kept. Create the program again, or cancel to correct it.`,
          );
        } finally {
          guard.finish();
        }
      },
    });
    if (created && programId) finishCreate(programId);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    // A picker's own form, rendered in a portal, bubbles its submission through this one.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    // Enter in the tailoring editor's search is not a request to continue.
    if (!formActive) return;
    if (index === last) void review();
    else advance();
  }
  /** The program exists: say so, and open it on its System tab. */
  function finishCreate(programId: string) {
    setDirty(false);
    toast.add({
      title: `${draft.name.trim()} created`,
      type: "success",
      description: `${plural(draft.systems.length, "system")}, ${plural(elementCount, "element")} and ${plural(draft.profiles.length, "program profile")} saved.`,
    });
    leave.current = () =>
      void navigate({
        to: "/programs/$programId",
        params: { programId },
        search: { tab: "System" },
      });
    guard.complete();
  }

  // The last attempt's list, less what the reader has fixed since: a removal is not announced.
  const summaryItems: ErrorSummaryIssue[] = summary
    .filter((issue) => issues.some((current) => current.field === issue.field))
    .map((issue) => ({ id: issue.field, message: issue.summary, ...lead(issue) }));
  const content =
    index === 0 ? (
      <ProgramStep
        draft={draft}
        onChange={change}
        parties={resources.parties}
        errorFor={errorFor}
        controlRef={feedback.ref}
      />
    ) : index === 1 ? (
      <CatalogStep
        draft={draft}
        onChange={change}
        catalogs={options.catalogs}
        profiles={options.profiles}
        data={resources.data}
        previews={previews}
        editingKey={editingKey}
        onEditingKeyChange={setEditingKey}
        errorFor={errorFor}
        controlRef={feedback.ref}
      />
    ) : index === 2 ? (
      <ElementsStep
        draft={draft}
        onChange={change}
        parties={resources.parties}
        profiles={options.profiles}
        previews={previews}
        libraryItems={resources.libraryItems}
        libraryPending={resources.pending}
        libraryFailed={resources.libraryFailed}
        onRetryLibrary={resources.retryLibrary}
        productItems={resources.productItems}
        productPending={resources.pending}
        productFailed={resources.productFailed}
        onRetryProducts={resources.retryProducts}
        newSystem={newSystem}
        editing={sheet}
        onEditingChange={setSheet}
        issues={issues.filter((issue) => issue.step === 2)}
        checked={checked.has(2)}
        controlRef={feedback.ref}
        nodeFor={feedback.node}
      />
    ) : (
      <ReviewStep
        draft={draft}
        data={resources.data}
        parties={resources.parties}
        profiles={options.profiles}
        previews={previews}
        libraryItems={resources.libraryItems}
        productItems={resources.productItems}
        total={total}
        onEdit={(next) => arrive(next)}
      />
    );
  return (
    <Page>
      <PageHeader>
        <RecordTrail current="Create program">
          <TrailLink to="/programs">Programs</TrailLink>
        </RecordTrail>
        <PageHeader.Heading>
          <PageHeader.Title>Create program</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {!writable ? (
        <Alert role="note">
          <AlertDescription>
            Your workspace role can view programs. An editor, admin, or owner can create a program.
          </AlertDescription>
        </Alert>
      ) : null}
      {/* The steps show at once; each step's region waits for its own records. */}
      <Grid gap="space.300" templateColumns={{ lg: "200px minmax(0,1fr)" }}>
        {/* Down the page in the rail beside the form; above the form, across wherever its column
            fits four steps and down the page where it does not. */}
        <StickyRail from="lg">
          <Stepper orientation="responsive" label="Program setup">
            {steps.map((label, stepIndex) => (
              <Stepper.Item
                key={label}
                label={label}
                state={stepIndex < index ? "done" : stepIndex === index ? "current" : "upcoming"}
                meta={
                  stepIndex === 1
                    ? plural(draft.profiles.length, "profile")
                    : stepIndex === 2
                      ? `${plural(draft.systems.length, "system")} · ${plural(elementCount, "element")}`
                      : `Step ${stepIndex + 1} of ${steps.length}`
                }
                {...(!guard.busy && stepIndex < index
                  ? { onSelect: () => arrive(stepIndex) }
                  : !guard.busy && writable && stepIndex === index + 1
                    ? { onSelect: advance }
                    : {})}
              />
            ))}
          </Stepper>
        </StickyRail>
        <Stack className="min-w-0" space="space.250">
          <Section>
            <Section.Header>
              <Section.Heading>
                <Section.Title ref={heading} tabIndex={-1} className="outline-none">
                  <VisuallyHidden>
                    Step {index + 1} of {steps.length}:{" "}
                  </VisuallyHidden>
                  {step}
                </Section.Title>
              </Section.Heading>
            </Section.Header>
            <Stack space="space.200">
              <ErrorSummary issues={summaryItems} focusKey={attempts} />
              {/* One element whatever the step shows, so a change of view keeps what has focus. */}
              <form id={formId} noValidate onSubmit={submit}>
                {/* The step's Retry sits outside the FieldSet, so a viewer can still reload it. */}
                <QueryState
                  key={index}
                  queries={resources.stepQueries(index)}
                  retryLabel="Retry loading"
                >
                  <FieldSet disabled={guard.busy || !writable}>{content}</FieldSet>
                </QueryState>
              </form>
            </Stack>
          </Section>
          <Box className="border-t border-default" paddingBlockStart="space.200">
            <Inline
              space="space.200"
              alignBlock="center"
              alignInline={editingKey || index > 0 ? undefined : "end"}
              spread={editingKey || index > 0 ? "space-between" : undefined}
            >
              {editingKey || index > 0 ? (
                <Button
                  variant="subtle"
                  onClick={() => {
                    if (editingKey) setEditingKey(null);
                    else arrive(index - 1);
                  }}
                >
                  {editingKey ? "Back to profiles" : "Back"}
                </Button>
              ) : null}
              <Inline space="space.150" alignBlock="center">
                <Button variant="subtle" onClick={() => void guard.close()}>
                  Cancel
                </Button>
                {index < last ? (
                  <Button
                    variant="primary"
                    type={formActive ? "submit" : "button"}
                    form={formActive ? formId : undefined}
                    onClick={formActive ? undefined : advance}
                    disabledReason={unavailable ?? loading(stepReady)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="submit"
                    form={formId}
                    disabledReason={unavailable ?? loading(resources.ready)}
                  >
                    Create program
                  </Button>
                )}
              </Inline>
            </Inline>
          </Box>
        </Stack>
      </Grid>
      {guard.confirmation}
    </Page>
  );
}
