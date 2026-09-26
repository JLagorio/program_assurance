import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertTitle,
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
  Text,
  toast,
  VisuallyHidden,
} from "@ledger/design-system";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { QueryState } from "@/components/prototype/work-common";
import { useFormFeedback } from "./form-feedback";
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
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
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
  const issues = useMemo(
    () =>
      wizardIssues({
        draft,
        ready: resources.ready,
        catalogs: options.catalogs,
        profiles: options.profiles,
        previews,
        libraryItems: resources.libraryItems,
        productItems: resources.productItems,
      }),
    [draft, resources.ready, options, previews, resources.libraryItems, resources.productItems],
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
  // On arrival the first field takes focus, once the published records have loaded.
  useEffect(() => {
    if (!resources.ready || settled.current) return;
    settled.current = true;
    feedback.node("name")?.focus();
  }, [resources.ready, feedback]);

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
  // While the tailoring editor is open, Continue is a plain button and Enter does not submit.
  const formActive = !(index === 1 && editingKey);

  function change(next: ProgramWizardDraft) {
    if (guard.busy) return;
    setDraft(next);
    setDirty(true);
    setFailure(null);
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
    if (!writable || guard.busy) return;
    const blocking = issues.filter((issue) => issue.step <= index);
    if (blocking.length) report(blocking);
    else arrive(index + 1);
  }
  function review() {
    if (!writable || guard.busy || resources.error) return;
    if (issues.length) {
      report(issues);
      return;
    }
    setFailure(null);
    setConfirming(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    // A picker's own form, rendered in a portal, bubbles its submission through this one.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    // Enter in the tailoring editor's search is not a request to continue.
    if (!formActive) return;
    if (index === last) review();
    else advance();
  }
  async function createProgram() {
    if (!guard.start()) return;
    setFailure(null);
    try {
      const result = await create.mutateAsync(draft);
      setDirty(false);
      toast.add({
        title: `${draft.name.trim()} created`,
        type: "success",
        description: `${plural(draft.systems.length, "system")}${productCount ? ` (${productCount} from products)` : ""}, ${plural(elementCount, "element")} and ${plural(draft.profiles.length, "program profile")} were saved.`,
      });
      leave.current = () =>
        void navigate({
          to: "/programs/$programId",
          params: { programId: result.programId },
          search: { tab: "System" },
        });
      guard.finish();
      setConfirming(false);
      guard.complete();
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "The request failed.");
      guard.finish();
      setConfirming(false);
    }
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
        productItems={resources.productItems}
        productPending={resources.pending}
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
    <Stack className="animate-rise" space="space.250">
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
      <QueryState queries={resources.queries}>
        <Grid gap="space.300" templateColumns={{ lg: "200px minmax(0,1fr)" }}>
          {/* Beside the form where it fits; below that the step's heading says where the reader is. */}
          <Box className="hidden lg:block lg:sticky-rail">
            <Stepper orientation="vertical" label="Program setup">
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
          </Box>
          <Stack className="min-w-0" space="space.250">
            <Section>
              <Section.Header>
                <Section.Heading>
                  <Text
                    as="p"
                    size="small"
                    color="color.text.subtle"
                    aria-hidden
                    className="lg:hidden"
                  >
                    Step {index + 1} of {steps.length}
                  </Text>
                  <Section.Title
                    ref={heading}
                    tabIndex={-1}
                    className="font-heading-xsmall outline-none"
                  >
                    <VisuallyHidden>
                      Step {index + 1} of {steps.length}:{" "}
                    </VisuallyHidden>
                    {step}
                  </Section.Title>
                </Section.Heading>
              </Section.Header>
              <Stack space="space.200">
                {index === last && failure ? (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle aria-hidden />
                    <AlertTitle>The program was not created</AlertTitle>
                    <AlertDescription>
                      <Text as="p">{failure}</Text>
                      <Text as="p">
                        Nothing was saved and your setup is kept. Correct the problem and create the
                        program again.
                      </Text>
                    </AlertDescription>
                  </Alert>
                ) : null}
                <ErrorSummary issues={summaryItems} focusKey={attempts} />
                {/* One element whatever the step shows, so a change of view keeps what has focus. */}
                <form id={formId} noValidate onSubmit={submit}>
                  <FieldSet disabled={guard.busy || !writable}>{content}</FieldSet>
                </form>
              </Stack>
            </Section>
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
                    disabledReason={unavailable}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="submit"
                    form={formId}
                    disabledReason={
                      unavailable ??
                      (resources.error
                        ? "Load the published records before creating the program."
                        : undefined)
                    }
                  >
                    Create program
                  </Button>
                )}
              </Inline>
            </Inline>
          </Stack>
        </Grid>
      </QueryState>
      <AlertDialog open={confirming} pending={guard.busy} onOpenChange={setConfirming}>
        <AlertDialogContent className="top-200 translate-y-0 sm:top-1000">
          <AlertDialogHeader>
            <AlertDialogTitle>Create {draft.name.trim()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {plural(draft.systems.length, "system")} ({productCount} from products),{" "}
              {plural(elementCount, "element")} ({libraryCount} from the library),{" "}
              {plural(draft.profiles.length, "program profile")} and {total} distinct selected
              controls will be saved with the program, as one transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="subtle">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              isLoading={guard.busy}
              onClick={() => void createProgram()}
            >
              Create program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {guard.confirmation}
    </Stack>
  );
}
