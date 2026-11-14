import { useMemo, type ReactNode } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  VisuallyHidden,
  useComboboxAnchor,
} from "@ledger/design-system";
import { ComboboxField, type ControlRef } from "@/components/app/fields";
import type { ControlObjective } from "@/lib/control-objectives";
import { objectiveWords } from "@/lib/product-records";
import { mappingCoverages } from "@/lib/status";
import { controlProseText, useControlPlaceholders } from "./library-controls";

/**
 * What a control mapping covers, as both Map dialogs ask it: the whole control, the default, or the
 * objectives the reader chooses, one mapping an objective. The control's Map a requirement and a
 * requirement's own Map control draw these fields, so the two ask it in the same words.
 */
export type MappingCoverage = keyof typeof mappingCoverages;

const COVERAGES = Object.keys(mappingCoverages) as MappingCoverage[];

/** An objective as a list offers it: its label, and what the assessor determines under it. */
type ObjectiveOption = { value: string; label: string; detail: string | null };

/** The objectives as options, in reading order, each with its text and the catalog's placeholders. */
function useObjectiveOptions(
  controlId: string,
  objectives: readonly ControlObjective[] | undefined,
): ObjectiveOption[] {
  const placeholders = useControlPlaceholders(
    useMemo(() => ({ controlIds: controlId ? [controlId] : [] }), [controlId]),
  );
  return useMemo(
    () =>
      (objectives ?? []).map((objective) => ({
        value: objective.id,
        label: objective.label ?? objectiveWords.unlabelled,
        detail: objective.prose ? controlProseText(objective.prose, controlId, placeholders) : null,
      })),
    [objectives, controlId, placeholders],
  );
}

/** A control ref as a callback, for a part that takes one. */
function bind(controlRef: ControlRef | undefined) {
  if (!controlRef || typeof controlRef === "function") return controlRef;
  return (node: HTMLElement | null) => {
    controlRef.current = node;
  };
}

const matches = (option: ObjectiveOption, query: string) =>
  `${option.label} ${option.detail ?? ""}`
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase());

/**
 * The question: Whole control, or Chosen objectives. Read-only with its reason while the answer
 * waits on another (no control chosen yet), so it keeps its Tab stop.
 */
export function ObjectiveCoverage({
  coverage,
  onCoverage,
  readOnly = false,
  description,
  controlRef,
}: {
  coverage: MappingCoverage;
  onCoverage: (next: MappingCoverage) => void;
  readOnly?: boolean | undefined;
  /** Why the answer cannot change, or what it means. */
  description?: ReactNode | undefined;
  /** The first radio, where an error sends focus. */
  controlRef?: ControlRef | undefined;
}) {
  return (
    <Field>
      <FieldSet>
        <FieldLegend variant="label">{objectiveWords.question}</FieldLegend>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        <RadioGroup<MappingCoverage>
          value={coverage}
          onValueChange={onCoverage}
          readOnly={readOnly}
        >
          {COVERAGES.map((value, index) => (
            <Field key={value} orientation="horizontal">
              <RadioGroupItem
                value={value}
                {...(index === 0 && controlRef ? { ref: bind(controlRef) } : {})}
              />
              <FieldLabel>{mappingCoverages[value].label}</FieldLabel>
            </Field>
          ))}
        </RadioGroup>
      </FieldSet>
    </Field>
  );
}

/**
 * The control's objectives to choose from, each listed by its label with its text, found by
 * either. `multiple` chooses several as chips (a new mapping, one an objective); otherwise one, for
 * a mapping being edited. While the objectives load, the field keeps its place.
 */
export function ObjectivesField({
  multiple,
  controlId,
  objectives,
  value,
  onChange,
  description,
  error,
  controlRef,
  loading = false,
  loadError,
  onRetry,
}: {
  multiple: boolean;
  controlId: string;
  /** The control's objectives, in reading order; none while they load. */
  objectives: readonly ControlObjective[] | undefined;
  /** The chosen objectives' ids: one at most where the field chooses one. */
  value: readonly string[];
  onChange: (next: string[]) => void;
  description?: ReactNode | undefined;
  error?: string | undefined;
  controlRef?: ControlRef | undefined;
  loading?: boolean | undefined;
  /** The objectives could not be read: the reason, said with Try again where the list is one. */
  loadError?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  const options = useObjectiveOptions(controlId, objectives);
  if (!multiple)
    return (
      <ComboboxField
        label={objectiveWords.chooseOne}
        value={value[0] ?? null}
        onChange={(next) => onChange(next ? [next] : [])}
        options={options}
        required
        placeholder={objectiveWords.add}
        noun="objectives"
        emptyMessage={objectiveWords.none}
        loading={loading}
        loadError={loadError}
        onRetry={onRetry}
        description={description}
        error={error}
        controlRef={controlRef}
      />
    );
  if (loading && !objectives)
    return (
      <div aria-busy="true">
        <Skeleton shape="block" />
        <VisuallyHidden role="status">Loading the control's objectives</VisuallyHidden>
      </div>
    );
  return (
    <ObjectiveChips
      options={options}
      value={value}
      onChange={onChange}
      description={description}
      error={error}
      controlRef={controlRef}
    />
  );
}

function ObjectiveChips({
  options,
  value,
  onChange,
  description,
  error,
  controlRef,
}: {
  options: ObjectiveOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  description?: ReactNode | undefined;
  error?: string | undefined;
  controlRef?: ControlRef | undefined;
}) {
  const anchor = useComboboxAnchor();
  // The chosen options as one array for as long as they are the same: a fresh array each render
  // would have the Combobox write its value back over what the reader is typing.
  const chosen = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );
  return (
    <Field invalid={error ? true : undefined} required>
      <FieldLabel>{objectiveWords.chooseMany}</FieldLabel>
      <Combobox<ObjectiveOption, true>
        items={options}
        multiple
        value={chosen}
        onValueChange={(next) => onChange(next.map((option) => option.value))}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={matches}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(items: ObjectiveOption[]) =>
              items.map((item) => <ComboboxChip key={item.value}>{item.label}</ComboboxChip>)
            }
          </ComboboxValue>
          <ComboboxChipsInput ref={bind(controlRef)} placeholder={objectiveWords.add} />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{objectiveWords.none}</ComboboxEmpty>
          <ComboboxList>
            {(item: ObjectiveOption) => (
              <ComboboxItem
                key={item.value}
                value={item}
                {...(item.detail ? { description: item.detail } : {})}
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
