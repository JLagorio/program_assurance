import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import type { ParameterOverride, TailoringDecision } from "@/lib/program-wizard";
import {
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardParameterPreview,
} from "@/lib/program-wizard-reference";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  CheckboxGroup,
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
  Stack,
  Text,
  VisuallyHidden,
  WorkPane,
  type WorkPaneView,
} from "@ledger/design-system";
import { AlertCircle } from "lucide-react";
import { type ComponentProps, useEffect, useId, useRef, useState, type RefObject } from "react";
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
              disabledReason={parameter ? undefined : "Choose a parameter first."}
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
/** How the values are entered: a Select for one literal choice, boxes for several, else lines of text. */
type EntryMode = "one" | "many" | "text";

function entryMode(item: WizardParameterPreview): EntryMode {
  const { choices, parameter, values } = item;
  // A choice with an embedded parameter or markup is not a literal the reader can pick as it stands.
  const literal = choices.length > 0 && !choices.some((choice) => /\{\{|<[^>]+>/.test(choice));
  if (!literal || !parameter.has_selection || values.some((value) => !choices.includes(value)))
    return "text";
  return (parameter.selection_count ?? "one") === "one" ? "one" : "many";
}

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
}) {
  const existing = parameters.find((override) => override.parameterId === item.parameter.id);
  const mode = entryMode(item);
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
  const entered =
    mode === "text"
      ? text
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
      : values;
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
  function record() {
    if (readOnly) return;
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
    setConflicts([]);
    setRecorded("recorded");
    onDirty(false);
  }
  const choiceHeading = `Source choices${parameter.selection_count ? ` · ${parameter.selection_count.replaceAll("-", " ")}` : ""}`;
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
                  <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
                  {mode === "one" ? (
                    <ChoiceField
                      label="Parameter value"
                      value={values[0] ?? null}
                      onChange={(value) => {
                        setValues(value ? [value] : []);
                        changed();
                      }}
                      options={item.choices.map((choice) => ({ value: choice, label: choice }))}
                      required
                      error={errorFor("values")}
                      controlRef={feedback.ref("values")}
                      description="One of the source's choices."
                    />
                  ) : mode === "many" ? (
                    <Field invalid={errorFor("values") ? true : undefined} required>
                      <CheckboxGroup
                        value={values}
                        onValueChange={(next) => {
                          // Keep the source's order, whatever order the boxes were ticked in.
                          setValues(item.choices.filter((choice) => next.includes(choice)));
                          changed();
                        }}
                      >
                        <FieldLegend variant="label">Parameter values</FieldLegend>
                        <FieldDescription>{choiceHeading}.</FieldDescription>
                        {item.choices.map((choice, index) => (
                          <Field key={choice} orientation="horizontal">
                            {/* The first box is where an error sends focus. */}
                            <Checkbox
                              value={choice}
                              {...(index === 0 ? { ref: feedback.ref("values") } : {})}
                            />
                            <FieldLabel>{choice}</FieldLabel>
                          </Field>
                        ))}
                        {errorFor("values") ? <FieldError>{errorFor("values")}</FieldError> : null}
                      </CheckboxGroup>
                    </Field>
                  ) : (
                    <TextField
                      label="Parameter values"
                      value={text}
                      onChange={(value) => {
                        setText(value);
                        changed();
                      }}
                      required
                      multiline
                      error={errorFor("values")}
                      controlRef={feedback.ref("values")}
                      description={
                        item.choices.length
                          ? "One value per line, each matching one of the source's choices."
                          : "One value per line."
                      }
                    />
                  )}
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
