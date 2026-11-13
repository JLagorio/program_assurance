import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { CYBER_RESILIENCY_FRAMEWORK, useFramework, useFrameworkItems } from "@/lib/frameworks";
import type { ParameterOverride, TailoringDecision } from "@/lib/program-wizard";
import {
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardParameterPreview,
} from "@/lib/program-wizard-reference";
import {
  RESILIENCY_KINDS,
  RESILIENCY_PARAMETERS,
  resiliencyParameter,
  resiliencyVocabulary,
  vocabularyValues,
  type ResiliencyList,
  type ResiliencyVocabulary,
} from "@/lib/resiliency-choice";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  CheckboxGroup,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  ErrorSummary,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  Heading,
  HeadingLevelProvider,
  Id,
  KeyValue,
  List,
  Prose,
  SearchField,
  Section,
  Skeleton,
  Stack,
  Text,
  VisuallyHidden,
  WorkPane,
  useComboboxAnchor,
  type WorkPaneView,
} from "@ledger/design-system";
import { AlertCircle } from "lucide-react";
import {
  type ComponentProps,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ChoiceField, TextField } from "../fields";
import { parameterName } from "./names";
import { focusAfterConfirmation, showOpenRow } from "./reveal-detail";
import type { ReferenceData } from "./use-reference-data";

const unrecorded = "The parameter override you entered has not been recorded.";
const originLabel: Record<WizardParameterPreview["origin"], string> = {
  catalog: "Catalog default",
  profile: "Base profile",
  override: "Override in this draft",
  unset: "No recorded value",
};

/**
 * What a parameter's values are chosen from when a reference vocabulary names them: SA-24's five
 * parameters name items of the cyber resiliency framework. `undefined` for every other parameter,
 * and for these five while the framework's reference data is not loaded: the values are then typed.
 */
export type Offer =
  | { state: "loading" }
  | { state: "failed"; retrying: boolean; retry: () => void }
  | {
      state: "ready";
      vocabulary: ResiliencyVocabulary;
      /** The framework and where it prints the list, when the framework's own record could be read. */
      source: string | undefined;
    };

/**
 * The cyber resiliency vocabulary, read once as the dialog opens on a set that holds one of
 * SA-24's parameters, and what each parameter is offered from it. An overlay's Set parameter values
 * offers the same.
 */
export function useOffers(enabled: boolean) {
  const items = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, { kinds: RESILIENCY_KINDS, enabled });
  const framework = useFramework(CYBER_RESILIENCY_FRAMEWORK, { enabled });
  const title = framework.data?.title;
  // One object a parameter for as long as the read stands: a list drawn from it keeps its place
  // while the reader picks.
  const ready = useMemo(() => {
    const offers = new Map<string, Offer>();
    for (const parameter of RESILIENCY_PARAMETERS) {
      const vocabulary = resiliencyVocabulary(parameter.sourceId, items.data ?? []);
      if (vocabulary)
        offers.set(parameter.sourceId, {
          state: "ready",
          vocabulary,
          source: title ? `${title} · ${vocabulary.printedIn.join(", ")}` : undefined,
        });
    }
    return offers;
  }, [items.data, title]);
  return (parameterSourceId: string): Offer | undefined => {
    if (!enabled || !resiliencyParameter(parameterSourceId)) return undefined;
    // A refresh that fails keeps the vocabulary already read.
    if (!items.data && items.error)
      return { state: "failed", retrying: items.isFetching, retry: () => void items.refetch() };
    if (!items.data || framework.isPending) return { state: "loading" };
    return ready.get(parameterSourceId);
  };
}

/** Set values for a parameter used by the effective control set, with the source's choices and guidance beside it. */
export function ParameterPicker({
  open,
  onClose,
  initialParameterId = null,
  finalFocus,
  decisions,
  parameters,
  onChange,
  readOnly = false,
  catalogRevisionId,
  baseResolutionId,
  data,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  /** Where focus goes when the dialog closes, when the opener may have moved. */
  finalFocus?: ComponentProps<typeof DialogContent>["finalFocus"] | undefined;
  /** The parameter whose override to edit: the dialog opens on it, with focus on its heading. */
  initialParameterId?: string | null | undefined;
  decisions: TailoringDecision[];
  parameters: ParameterOverride[];
  onChange: (next: ParameterOverride[]) => void;
  readOnly?: boolean | undefined;
  catalogRevisionId: string;
  baseResolutionId: string;
  data: ReferenceData;
  preview: ProgramTailoringPreview;
}) {
  const formId = useId();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(initialParameterId);
  // Stacked, the pane shows the list or the chosen parameter; the count belongs to the list, so it
  // goes with it.
  const [paneView, setPaneView] = useState<WorkPaneView>(initialParameterId ? "detail" : "list");
  const [dirty, setDirty] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const guard = useDraftGuard({ dirty, onClose, description: unrecorded });
  const { confirm, confirmation } = useConfirmation();
  const query = search.trim().toLowerCase();
  // Search what the row shows: the source id and the name, which for an unlabelled selection is
  // its choices.
  const shown = query
    ? preview.parameters.filter((item) =>
        `${item.parameter.source_id} ${parameterName(item.parameter, item.choices)}`
          .toLowerCase()
          .includes(query),
      )
    : preview.parameters;
  const parameter = preview.parameters.find((item) => item.parameter.id === selected);
  const offerFor = useOffers(
    open &&
      !readOnly &&
      preview.parameters.some((item) => resiliencyParameter(item.parameter.source_id)),
  );
  const offer = parameter ? offerFor(parameter.parameter.source_id) : undefined;
  /** Chooses a parameter, once an unrecorded override is let go; false keeps the reader on it. */
  async function select(parameterId: string) {
    if (parameterId === selected) return true;
    if (dirty && !(await confirm(discardChanges(unrecorded)))) return false;
    setDirty(false);
    setSelected(parameterId);
    return true;
  }
  async function remove(item: WizardParameterPreview) {
    if (
      !(await confirm({
        title: "Remove this override?",
        description: `${item.parameter.source_id} returns to the value the base profile or the catalog sets, and the override's rationale is discarded from the draft.`,
        confirmLabel: "Remove override",
        variant: "danger",
      }))
    )
      return false;
    onChange(parameters.filter((override) => override.parameterId !== item.parameter.id));
    // The Remove button goes with the override; the parameter's heading stays.
    focusAfterConfirmation(() => headingRef.current);
    return true;
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          details.cancel();
          void guard.close();
        }
      }}
    >
      <DialogContent
        width="xlarge"
        {...(finalFocus ? { finalFocus } : {})}
        initialFocus={() => {
          if (!initialParameterId) return searchRef.current ?? true;
          showOpenRow(bodyRef.current);
          return headingRef.current ?? true;
        }}
      >
        <DialogHeader>
          <DialogTitle>{readOnly ? "Inspect parameters" : "Set parameter values"}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "Each parameter of the effective control set, its value and where it comes from."
              : "Choose a parameter, then record its values and why they override the base."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack ref={bodyRef} space="space.200" className="@container">
            {/* The pane stacks under 48rem, the same width this container query reads. */}
            <Text
              size="small"
              color="color.text.subtle"
              className={paneView === "detail" && parameter ? "hidden @3xl:block" : undefined}
            >
              {query
                ? `${shown.length} matching ${shown.length === 1 ? "parameter" : "parameters"} of ${preview.parameters.length} in the effective set`
                : `${shown.length} ${shown.length === 1 ? "parameter" : "parameters"} in the effective set`}
            </Text>
            {/* Below its stacking width the pane is a drill-in: the list, then the chosen parameter
                in its place with Back to parameters. Only the search stays put over the rows. */}
            <WorkPane
              listWidth={300}
              listLabel={<VisuallyHidden>Parameters</VisuallyHidden>}
              listToolbar={
                <SearchField
                  ref={searchRef}
                  size="small"
                  aria-label="Find a parameter"
                  placeholder="Find a parameter"
                  value={search}
                  onValueChange={setSearch}
                />
              }
              view={paneView}
              onViewChange={setPaneView}
              backLabel="Back to parameters"
              list={shown.map((item) => (
                <WorkPane.Row
                  key={item.parameter.id}
                  id={item.parameter.source_id}
                  title={parameterName(item.parameter, item.choices)}
                  meta={
                    item.origin === "unset"
                      ? "No recorded value"
                      : `${originLabel[item.origin]} · ${item.values.join("; ")}`
                  }
                  isActive={item.parameter.id === selected}
                  onSelect={() => select(item.parameter.id)}
                />
              ))}
              listEmpty={
                <Empty size="compact">
                  <EmptyHeader>
                    <EmptyTitle>No parameter matches</EmptyTitle>
                    <EmptyDescription>
                      {query
                        ? "No parameter of the effective set has that id or name."
                        : "The effective control set uses no parameters."}
                    </EmptyDescription>
                  </EmptyHeader>
                  {query ? (
                    <EmptyContent>
                      <Button
                        size="small"
                        onClick={() => {
                          setSearch("");
                          searchRef.current?.focus();
                        }}
                      >
                        Clear search
                      </Button>
                    </EmptyContent>
                  ) : null}
                </Empty>
              }
              detail={
                parameter ? (
                  <ParameterEditor
                    key={parameter.parameter.id}
                    formId={formId}
                    item={parameter}
                    decisions={decisions}
                    parameters={parameters}
                    onChange={onChange}
                    onRemove={remove}
                    readOnly={readOnly}
                    data={data}
                    catalogRevisionId={catalogRevisionId}
                    baseResolutionId={baseResolutionId}
                    onDirty={setDirty}
                    headingRef={headingRef}
                    offer={offer}
                  />
                ) : undefined
              }
              empty={
                shown.length ? (
                  <Empty size="compact">
                    <EmptyHeader>
                      <EmptyTitle>No parameter chosen</EmptyTitle>
                      <EmptyDescription>
                        Choose a parameter to read its source definition and set its values.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : undefined
              }
            />
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Close</DialogClose>
          {!readOnly && (
            <Button
              variant="primary"
              type="submit"
              form={formId}
              disabledReason={
                !parameter
                  ? "Choose a parameter first."
                  : offer?.state === "loading"
                    ? "The parameter's choices are loading."
                    : undefined
              }
            >
              Set parameter values
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
      {confirmation}
    </Dialog>
  );
}

type ParameterField = "values" | "rationale";
/**
 * How the values are entered: a Select for one literal choice, several from a list for more (boxes,
 * or a searched list under headings when the choices come in groups), else lines of text.
 */
export type EntryMode = "one" | "many" | "text";

export function entryMode(
  item: Pick<WizardParameterPreview, "choices" | "values"> & {
    parameter: Pick<WizardParameterPreview["parameter"], "has_selection" | "selection_count">;
  },
  vocabulary: ResiliencyVocabulary | undefined,
): EntryMode {
  // A vocabulary's titles are chosen as a source's choices are, several at once. A value that
  // names none of them was typed, and the values stay text.
  if (vocabulary) return vocabularyValues(vocabulary, item.values) ? "many" : "text";
  const { choices, parameter, values } = item;
  // A choice with an embedded parameter or markup is not a literal the reader can pick as it stands.
  const literal = choices.length > 0 && !choices.some((choice) => /\{\{|<[^>]+>/.test(choice));
  if (!literal || !parameter.has_selection || values.some((value) => !choices.includes(value)))
    return "text";
  return (parameter.selection_count ?? "one") === "one" ? "one" : "many";
}

/** The words a searched list says about each of SA-24's lists. */
const listWords: Record<ResiliencyList, { add: string; none: string }> = {
  goals: { add: "Add a goal", none: "No goals found." },
  objectives: { add: "Add an objective", none: "No objectives found." },
  techniques: { add: "Add a technique", none: "No techniques found." },
  approaches: { add: "Add an approach", none: "No approaches found." },
  designPrinciples: { add: "Add a design principle", none: "No design principles found." },
};

/**
 * Several choices that come under headings, in a searched list: one line a choice, chosen ones as
 * chips. Typing finds a choice by its own words or its heading's, so a technique's name lists its
 * approaches.
 */
function GroupedChoices({
  label,
  groups,
  value,
  onChange,
  words,
  description,
  error,
  controlRef,
}: {
  label: string;
  groups: ResiliencyVocabulary["groups"];
  value: string[];
  onChange: (next: string[]) => void;
  words: { add: string; none: string };
  description?: string | undefined;
  error?: string | undefined;
  /** The input, as `useFormFeedback().ref(field)` registers it: where an error sends focus. */
  controlRef?: ((node: HTMLElement | null) => void) | undefined;
}) {
  const anchor = useComboboxAnchor();
  const items = useMemo(
    () =>
      groups.map((group) => ({
        label: group.label,
        items: group.options.map((option) => option.title),
      })),
    [groups],
  );
  const headings = useMemo(
    () =>
      new Map(
        groups.flatMap((group) => group.options.map((option) => [option.title, group.label])),
      ),
    [groups],
  );
  return (
    <Field invalid={error ? true : undefined} required>
      <FieldLabel>{label}</FieldLabel>
      <Combobox<string, true>
        items={items}
        multiple
        value={value}
        onValueChange={onChange}
        filter={(choice, query) =>
          `${choice} ${headings.get(choice) ?? ""}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase())
        }
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(chosen: string[]) =>
              chosen.map((choice) => <ComboboxChip key={choice}>{choice}</ComboboxChip>)
            }
          </ComboboxValue>
          <ComboboxChipsInput ref={controlRef} placeholder={words.add} />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{words.none}</ComboboxEmpty>
          <ComboboxList>
            {(group: (typeof items)[number], index: number) => (
              <ComboboxGroup key={group.label} items={group.items}>
                {index > 0 && <ComboboxSeparator />}
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(choice: string) => (
                    <ComboboxItem key={choice} value={choice}>
                      {choice}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/**
 * A parameter's values, entered the way its kind asks (`entryMode`): a Select for one literal
 * choice, boxes for several, a searched list of chips for a vocabulary that prints its choices
 * under headings, lines of text otherwise; while a vocabulary loads, a skeleton keeps its place.
 * The tailoring's parameter editor and an overlay's Set parameter values both draw it.
 */
export function ParameterValueEntry({
  mode,
  waiting,
  sourceChoices,
  choices,
  vocabulary,
  source,
  choiceHeading,
  one,
  chosen,
  text,
  onOne,
  onPick,
  onText,
  error,
  controlRef,
}: {
  mode: EntryMode;
  /** The vocabulary is on its way: the field keeps its place. */
  waiting: boolean;
  /** The parameter's own choices, as the source prints them. */
  sourceChoices: readonly string[];
  /** What the values are picked from: the vocabulary's titles, else the source's choices. */
  choices: readonly string[];
  vocabulary: ResiliencyVocabulary | undefined;
  /** Where the vocabulary is printed, said under the field. */
  source: string | undefined;
  /** "Source choices", with how many may be chosen. */
  choiceHeading: string;
  one: string | null;
  chosen: string[];
  text: string;
  onOne: (value: string | null) => void;
  onPick: (next: string[]) => void;
  onText: (value: string) => void;
  error: string | undefined;
  /** Where an error sends focus. */
  controlRef: (node: HTMLElement | null) => void;
}) {
  if (waiting)
    return (
      <div aria-busy="true">
        <Skeleton shape="block" />
        <VisuallyHidden role="status">Loading the choices</VisuallyHidden>
      </div>
    );
  if (mode === "one")
    return (
      <ChoiceField
        label="Parameter value"
        value={one}
        onChange={onOne}
        options={sourceChoices.map((choice) => ({ value: choice, label: choice }))}
        required
        error={error}
        controlRef={controlRef}
        description="One of the source's choices."
      />
    );
  if (mode === "many" && vocabulary?.groups.length)
    return (
      <GroupedChoices
        label="Parameter values"
        groups={vocabulary.groups}
        value={chosen}
        onChange={onPick}
        words={listWords[vocabulary.list]}
        description={source}
        error={error}
        controlRef={controlRef}
      />
    );
  if (mode === "many")
    return (
      <Field invalid={error ? true : undefined} required>
        <CheckboxGroup value={chosen} onValueChange={onPick}>
          <FieldLegend variant="label">Parameter values</FieldLegend>
          {vocabulary ? (
            source ? (
              <FieldDescription>{source}</FieldDescription>
            ) : null
          ) : (
            <FieldDescription>{choiceHeading}.</FieldDescription>
          )}
          {choices.map((choice, index) => (
            <Field key={choice} orientation="horizontal">
              {/* The first box is where an error sends focus. */}
              <Checkbox value={choice} {...(index === 0 ? { ref: controlRef } : {})} />
              <FieldLabel>{choice}</FieldLabel>
            </Field>
          ))}
          {error ? <FieldError>{error}</FieldError> : null}
        </CheckboxGroup>
      </Field>
    );
  return (
    <TextField
      label="Parameter values"
      value={text}
      onChange={onText}
      required
      multiline
      error={error}
      controlRef={controlRef}
      description={
        sourceChoices.length
          ? "One value per line, each matching one of the source's choices."
          : "One value per line."
      }
    />
  );
}

/** "Source choices", with how many of them a parameter takes. */
export const choiceHeadingOf = (parameter: { selection_count: string | null }) =>
  `Source choices${parameter.selection_count ? ` · ${parameter.selection_count.replaceAll("-", " ")}` : ""}`;

function ParameterEditor({
  formId,
  item,
  decisions,
  parameters,
  onChange,
  onRemove,
  readOnly,
  data,
  catalogRevisionId,
  baseResolutionId,
  onDirty,
  headingRef,
  offer,
}: {
  formId: string;
  item: WizardParameterPreview;
  decisions: TailoringDecision[];
  parameters: ParameterOverride[];
  onChange: (next: ParameterOverride[]) => void;
  onRemove: (item: WizardParameterPreview) => Promise<boolean>;
  readOnly: boolean;
  data: ReferenceData;
  catalogRevisionId: string;
  baseResolutionId: string;
  onDirty: (dirty: boolean) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** The reference vocabulary the values are chosen from, for a parameter that has one. */
  offer: Offer | undefined;
}) {
  const existing = parameters.find((override) => override.parameterId === item.parameter.id);
  const vocabulary = offer?.state === "ready" ? offer.vocabulary : undefined;
  const source = offer?.state === "ready" ? offer.source : undefined;
  // While the vocabulary is on its way the values field keeps its place: what it is drawn as
  // depends on the answer.
  const waiting = offer?.state === "loading";
  const mode = entryMode(item, vocabulary);
  // What is picked from: the vocabulary's titles in the publication's order, else the source's choices.
  const choices = useMemo(
    () => vocabulary?.options.map((option) => option.title) ?? item.choices,
    [vocabulary, item.choices],
  );
  const [values, setValues] = useState<string[]>(item.values);
  const [text, setText] = useState(item.values.join("\n"));
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [recorded, setRecorded] = useState<"recorded" | "removed" | null>(null);
  const feedback = useFormFeedback<ParameterField>();
  // Once the override is removed the fields show the value now in effect, from the base profile or
  // the catalog, as a fresh opening of this parameter would.
  useEffect(() => {
    if (recorded !== "removed") return;
    setValues(item.values);
    setText(item.values.join("\n"));
  }, [recorded, item.values]);
  const parameter = item.parameter;
  const control = data.controls.find((control) => control.id === parameter.control_id);
  // A vocabulary's titles as it spells them, whatever case they were recorded in.
  const chosen = vocabulary ? (vocabularyValues(vocabulary, values) ?? []) : values;
  const entered =
    mode === "text"
      ? text
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
      : chosen;
  const valuesMessage =
    mode === "one"
      ? "Choose a value for this parameter."
      : mode === "many"
        ? "Choose at least one value for this parameter."
        : "Enter at least one value for this parameter.";
  const rationaleMessage = "Enter a rationale for this override.";
  const issues: FormIssue<ParameterField>[] = [
    ...(entered.length ? [] : [{ field: "values" as const, message: valuesMessage }]),
    ...(rationale.trim() ? [] : [{ field: "rationale" as const, message: rationaleMessage }]),
  ];
  // A removal empties the rationale on purpose: that is not an error until the next attempt.
  const errorFor = (field: ParameterField) =>
    feedback.submitted && recorded !== "removed"
      ? issues.find((issue) => issue.field === field)?.message
      : undefined;
  const changed = () => {
    setRecorded(null);
    setConflicts([]);
    onDirty(true);
  };
  /** Keeps the source's or the publication's order, whatever order the choices were picked in. */
  const pick = (next: string[]) => {
    setValues(choices.filter((choice) => next.includes(choice)));
    changed();
  };
  function record() {
    if (readOnly || waiting) return;
    setRecorded(null);
    if (!feedback.report(issues)) return;
    const next = [
      ...parameters.filter((override) => override.parameterId !== parameter.id),
      { parameterId: parameter.id, values: entered, rationale: rationale.trim() },
    ];
    const result = previewProgramTailoring(
      { catalogRevisionId, baseResolutionId, tailoring: decisions, parameters: next },
      data,
    );
    if (result.errors.length) {
      setConflicts(result.errors);
      return;
    }
    onChange(next);
    // Both controls hold what was recorded: values typed as a list's own titles are picked from
    // the list from here on.
    setValues(entered);
    setText(entered.join("\n"));
    setConflicts([]);
    setRecorded("recorded");
    onDirty(false);
  }
  const choiceHeading = choiceHeadingOf(parameter);
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        record();
      }}
    >
      <Stack space="space.200">
        <Heading size="overlay" ref={headingRef} tabIndex={-1}>
          {parameterName(item.parameter, item.choices)}
        </Heading>
        <HeadingLevelProvider>
          <Stack space="space.200">
            <KeyValue.Group>
              <KeyValue label="ID">
                <Id>{parameter.source_id}</Id>
              </KeyValue>
              {control ? (
                // The title runs long, and a cut value holds no control to reveal it on touch.
                <KeyValue label="Control" wrap>
                  <Id>{control.code}</Id> {control.title}
                </KeyValue>
              ) : null}
              <KeyValue label="Current source">{originLabel[item.origin]}</KeyValue>
              {readOnly ? (
                <KeyValue label="Values" wrap>
                  {item.values.length ? item.values.join("; ") : "No recorded value"}
                </KeyValue>
              ) : null}
              {readOnly && item.rationale ? (
                <KeyValue label="Rationale" wrap>
                  <Prose>{item.rationale}</Prose>
                </KeyValue>
              ) : null}
            </KeyValue.Group>
            {parameter.usage ? <Prose label="Usage">{parameter.usage}</Prose> : null}
            {item.choices.length && (readOnly || mode === "text") ? (
              <Section title={choiceHeading}>
                <List>
                  {item.choices.map((choice) => (
                    <List.Item key={choice}>{choice}</List.Item>
                  ))}
                </List>
              </Section>
            ) : null}
            {item.constraints.length ? (
              <Section title="Source constraints">
                <Stack space="space.100">
                  {item.constraints.map((constraint) => (
                    <Prose key={constraint}>{constraint}</Prose>
                  ))}
                </Stack>
              </Section>
            ) : null}
            {item.guidelines.length ? (
              <Section title="Guidance">
                <Stack space="space.100">
                  {item.guidelines.map((guideline) => (
                    <Prose key={guideline}>{guideline}</Prose>
                  ))}
                </Stack>
              </Section>
            ) : null}
            {readOnly ? null : (
              <Section title="Override">
                <Stack space="space.150">
                  {offer?.state === "failed" ? (
                    <Alert variant="destructive" role="alert">
                      <AlertCircle aria-hidden />
                      <AlertTitle>The choices could not be loaded</AlertTitle>
                      <AlertDescription>Type the values, or try again.</AlertDescription>
                      <AlertAction>
                        <Button
                          size="small"
                          isLoading={offer.retrying}
                          onClick={() => {
                            // What was typed meanwhile is picked once the choices arrive, where
                            // it names them.
                            setValues(entered);
                            offer.retry();
                          }}
                        >
                          Try again
                        </Button>
                      </AlertAction>
                    </Alert>
                  ) : null}
                  <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
                  <ParameterValueEntry
                    mode={mode}
                    waiting={waiting}
                    sourceChoices={item.choices}
                    choices={choices}
                    vocabulary={vocabulary}
                    source={source}
                    choiceHeading={choiceHeading}
                    one={values[0] ?? null}
                    chosen={chosen}
                    text={text}
                    onOne={(value) => {
                      setValues(value ? [value] : []);
                      changed();
                    }}
                    onPick={pick}
                    onText={(value) => {
                      setText(value);
                      changed();
                    }}
                    error={errorFor("values")}
                    controlRef={feedback.ref("values")}
                  />
                  <TextField
                    label="Parameter override rationale"
                    value={rationale}
                    onChange={(value) => {
                      setRationale(value);
                      changed();
                    }}
                    required
                    multiline
                    error={errorFor("rationale")}
                    controlRef={feedback.ref("rationale")}
                  />
                  {existing ? (
                    <div>
                      <Button
                        variant="subtle"
                        onClick={() =>
                          void onRemove(item).then((removed) => {
                            if (!removed) return;
                            setRationale("");
                            setRecorded("removed");
                            setConflicts([]);
                            onDirty(false);
                          })
                        }
                      >
                        Remove override
                      </Button>
                    </div>
                  ) : null}
                  {conflicts.length ? (
                    <Alert variant="destructive" role="alert">
                      <AlertCircle aria-hidden />
                      <AlertTitle>The override does not fit the source</AlertTitle>
                      <AlertDescription>
                        <List>
                          {conflicts.map((conflict) => (
                            <List.Item key={conflict}>{conflict}</List.Item>
                          ))}
                        </List>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {recorded === "recorded" ? (
                    <Alert role="status" tone="success">
                      <AlertTitle>Parameter override recorded in the draft.</AlertTitle>
                    </Alert>
                  ) : recorded === "removed" ? (
                    <Alert role="status">
                      <AlertTitle>Parameter override removed from the draft.</AlertTitle>
                    </Alert>
                  ) : null}
                </Stack>
              </Section>
            )}
          </Stack>
        </HeadingLevelProvider>
      </Stack>
    </form>
  );
}
