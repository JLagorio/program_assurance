import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Absent,
  Box,
  Button,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  KeyValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  VisuallyHidden,
} from "@ledger/design-system";
import type { Row } from "@/lib/models";
import { sentence } from "./sentence";

/**
 * The control's element, for DialogContent `initialFocus`, an ErrorSummary target, or moving focus
 * to the first invalid field: a ref object, or the callback `useFormFeedback().ref(field)` returns.
 */
export type ControlRef = RefObject<HTMLElement | null> | ((node: HTMLElement | null) => void);

function bind(controlRef: ControlRef | undefined) {
  if (!controlRef || typeof controlRef === "function") return controlRef;
  return (node: HTMLElement | null) => {
    controlRef.current = node;
  };
}

/**
 * What every field wrapper shares. The kit Field ties the label, hint and error to the control and
 * carries `required`, `invalid` and `disabled` to it: no ids or ARIA are written here.
 */
type FieldFrameProps = {
  label: string;
  /** Marks the label with the asterisk and announces the requirement. The form checks it on submit. */
  required?: boolean | undefined;
  /** A sentence under the control that helps the reader answer. */
  description?: ReactNode | undefined;
  /** What fixes the field, from the last validation. It marks the field invalid and describes the control. */
  error?: string | undefined;
  /** Disables the control and dims the label. A surrounding FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
  controlRef?: ControlRef | undefined;
};

export function TextField({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  description,
  error,
  disabled,
  controlRef,
  placeholder,
  maxLength,
  characterLimit,
  rows,
  autoResize = false,
  autoFocus = false,
}: FieldFrameProps & {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean | undefined;
  placeholder?: string | undefined;
  /**
   * A hard cap the browser enforces by cutting what is typed or pasted past it, with no message.
   * For several lines of text prefer `characterLimit`, and let the form's own check report an
   * over-long single line on submit.
   */
  maxLength?: number | undefined;
  /**
   * With `multiline`: the most characters the answer may have, as a soft limit. A count under the
   * box says how many are left or how many too many, and the text is never cut. The form's own
   * check still reports an over-long answer on submit.
   */
  characterLimit?: number | undefined;
  rows?: number | undefined;
  /** With `multiline`: the box grows with its text from `rows` lines, up to twelve, then scrolls. */
  autoResize?: boolean | undefined;
  /**
   * @deprecated Inside a Dialog or Sheet, pass `controlRef` and give the same ref to the content's
   * `initialFocus`: an `autoFocus` there becomes the place focus returns to when it closes.
   */
  autoFocus?: boolean | undefined;
}) {
  const ref = bind(controlRef);
  const shared = {
    value,
    ...(placeholder ? { placeholder } : {}),
    ...(maxLength !== undefined ? { maxLength } : {}),
    ...(autoFocus ? { autoFocus } : {}),
  };
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          ref={ref}
          {...shared}
          {...(rows !== undefined ? { rows } : {})}
          {...(characterLimit !== undefined ? { characterLimit } : {})}
          {...(autoResize ? { autoResize, maxRows: 12 } : {})}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input ref={ref} {...shared} onChange={(event) => onChange(event.target.value)} />
      )}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/** One of a fixed list of plain words (an enum), in a Select. A record set is a ComboboxField. */
export function ChoiceField({
  label,
  value,
  onChange,
  options,
  required = false,
  description,
  error,
  disabled,
  controlRef,
  placeholder = "Choose…",
  emptyOption,
}: FieldFrameProps & {
  value: string | null;
  onChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string | undefined;
  /** For an optional choice: the label of a first item that clears the value, such as "No priority". */
  emptyOption?: string | undefined;
}) {
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      {/* Inside a Field the trigger fills it and the list opens below it. */}
      <Select<string> items={options} value={value || null} onValueChange={onChange}>
        <SelectTrigger ref={bind(controlRef)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyOption ? <SelectItem value={null}>{emptyOption}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/** A yes or no that waits for the form's primary, with its hint and error beside the box. */
export function CheckboxField({
  label,
  checked,
  onChange,
  description,
  error,
  disabled,
  readOnly,
  controlRef,
}: Omit<FieldFrameProps, "required"> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Keeps the answer and its Tab stop but takes no change: pair it with a `description` that says
   * why, which a disabled box would take out of the tab order with it.
   */
  readOnly?: boolean | undefined;
}) {
  return (
    <Field orientation="horizontal" invalid={error ? true : undefined} disabled={disabled}>
      <Checkbox
        ref={bind(controlRef)}
        checked={checked}
        onCheckedChange={(next) => onChange(next)}
        {...(readOnly ? { readOnly } : {})}
      />
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}

/**
 * An option in a ComboboxField or RecordField. `detail` is a quieter second line under the label
 * (a party's email, a record's code), read as the option's description and searched with its
 * label. A detail that repeats the label (a party named by its email) is not shown twice.
 */
export type ComboboxOption = { value: string; label: string; detail?: string | null | undefined };

/** The words the list says about its options, from their plural noun: "programs", "parties". */
function listWords(noun: string | undefined) {
  return {
    loading: noun ? `Loading ${noun}…` : "Loading the choices…",
    failed: noun ? `The ${noun} could not be loaded.` : "The choices could not be loaded.",
    none: noun ? `No ${noun} found.` : "No matches found.",
  };
}

const matches = (option: ComboboxOption, query: string) =>
  `${option.label} ${option.detail ?? ""}`
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase());

/** The text the reader typed, as opposed to the chosen option's label that fills the input. */
const typed = (reason: string) => ["input-change", "input-clear", "clear-press"].includes(reason);

/**
 * The chosen option as one object for as long as it names the same record in the same words. The
 * Combobox writes the chosen label back into the input whenever its value becomes another object,
 * so a fresh copy on each render (options mapped inline, a list without the chosen record) would
 * wipe out what the reader is typing.
 */
function useChosen(option: ComboboxOption | null | undefined): ComboboxOption | null {
  const value = option?.value;
  const label = option?.label;
  const detail = option?.detail;
  return useMemo(
    () => (value === undefined || label === undefined ? null : { value, label, detail }),
    [value, label, detail],
  );
}

function OptionItem({ option }: { option: ComboboxOption }) {
  const detail = option.detail && option.detail !== option.label ? option.detail : undefined;
  return (
    <ComboboxItem value={option} {...(detail ? { description: detail } : {})}>
      {option.label}
    </ComboboxItem>
  );
}

/**
 * Enter in the input tries a failed load again while the list has nothing to choose. Inside a
 * Dialog, Tab leaves the input for the dialog's next field, so the popup's Try again serves the
 * pointer and the status tells the keyboard to press Enter.
 */
function retryOnEnter(enterRetries: boolean, onRetry: (() => void) | undefined) {
  return (event: {
    key: string;
    preventDefault: () => void;
    preventBaseUIHandler?: () => void;
  }) => {
    if (event.key !== "Enter" || !enterRetries || !onRetry) return;
    event.preventDefault();
    event.preventBaseUIHandler?.();
    onRetry();
  };
}

/**
 * Loading, a failed load with Try again, and "Showing 50 of 312" when the list is cut: said in the
 * popup, outside the options, so a request in progress or a failure never reads as no matches.
 */
function ListStatus({
  words,
  loading,
  failure,
  onRetry,
  enterRetries,
  total,
}: {
  words: ReturnType<typeof listWords>;
  loading: boolean;
  failure: string | null;
  onRetry?: (() => void) | undefined;
  /** Enter in the input retries: the list failed and has nothing to choose. */
  enterRetries: boolean;
  total?: number | undefined;
}) {
  return (
    <>
      <ComboboxStatus {...(total !== undefined ? { total } : {})}>
        {loading ? words.loading : enterRetries ? `${failure} Press Enter to try again.` : failure}
      </ComboboxStatus>
      {failure && !loading && onRetry ? (
        <Box paddingInline="space.150" paddingBlockEnd="space.150">
          <Button size="small" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </Box>
      ) : null}
    </>
  );
}

export type ComboboxFieldProps = FieldFrameProps & {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string | undefined;
  /**
   * What the options are, in the plural, for the list's own words: "Loading programs…",
   * "No programs found.", "The programs could not be loaded."
   */
  noun?: string | undefined;
  /** What the list says when nothing matches. "No {noun} found." unsaid. */
  emptyMessage?: string | undefined;
  /** The options are on their way: the list is busy and says so, and never says nothing matched. */
  loading?: boolean | undefined;
  /** The options could not be loaded: `true`, or the reason, said in the list with Try again. */
  loadError?: boolean | string | undefined;
  onRetry?: (() => void) | undefined;
  /** The most options the list mounts; past it, the list says how many of the matches it shows. */
  limit?: number | undefined;
};

/**
 * One of a loaded set of records, or a name the reader would type, in a searchable Combobox. The
 * first match is highlighted as the reader types, so Enter chooses it; an optional field can be
 * cleared. While the options load or fail, the list says so. For a set too large to load, the
 * server searches instead: a RecordField.
 */
export function ComboboxField({
  label,
  value,
  onChange,
  options,
  required = false,
  description,
  error,
  disabled,
  controlRef,
  placeholder = "Choose…",
  noun,
  emptyMessage,
  loading = false,
  loadError,
  onRetry,
  limit = 100,
}: ComboboxFieldProps) {
  const [query, setQuery] = useState("");
  const words = listWords(noun);
  const failure = loadError
    ? `${words.failed}${typeof loadError === "string" && loadError ? ` ${sentence(loadError)}` : ""}`
    : null;
  const total = useMemo(
    () => (query ? options.filter((option) => matches(option, query)).length : options.length),
    [options, query],
  );
  const enterRetries = !!failure && !loading && !!onRetry && options.length === 0;
  const chosen = useChosen(options.find((option) => option.value === value));
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      <Combobox<ComboboxOption>
        items={options}
        limit={limit}
        value={chosen}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={matches}
        onInputValueChange={(input, details) => setQuery(typed(details.reason) ? input : "")}
        onValueChange={(item) => onChange(item?.value ?? null)}
      >
        <ComboboxInput
          ref={bind(controlRef)}
          placeholder={placeholder}
          showClear={!required}
          onKeyDown={retryOnEnter(enterRetries, onRetry)}
        />
        <ComboboxContent>
          <ListStatus
            words={words}
            loading={loading}
            failure={failure}
            onRetry={onRetry}
            enterRetries={enterRetries}
            total={total}
          />
          <ComboboxEmpty>{loading || failure ? null : (emptyMessage ?? words.none)}</ComboboxEmpty>
          <ComboboxList aria-busy={loading || undefined}>
            {(option: ComboboxOption) => <OptionItem key={option.value} option={option} />}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/** One page of a server search: the options it returned and how many records matched in all. */
export type RecordSearchResult = { options: ComboboxOption[]; total: number };

function useDebounced<T>(value: T, delay = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

/**
 * One record of a collection the server searches as the reader types: the search settles for a
 * moment before it is sent, the last results stay while the next load, and the list says when it
 * is loading, when the search failed (with Try again) and how many of the matches it shows. The
 * chosen record stays named while it is not among the results.
 */
export function RecordField({
  label,
  value,
  onChange,
  search,
  queryKey,
  selected,
  noun,
  required = false,
  clearable = !required,
  description,
  error,
  disabled,
  controlRef,
  placeholder = "Choose…",
}: FieldFrameProps & {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  /** Fetches the options matching the reader's words ("" for the first page). */
  search: (term: string) => Promise<RecordSearchResult>;
  /** The query's identity without the term, which is appended: the collection and the workspace. */
  queryKey: readonly unknown[];
  /** The chosen record's option, named while it is not among the results. */
  selected?: ComboboxOption | null | undefined;
  /** What the records are, in the plural: "Loading parties…", "No parties found." */
  noun: string;
  /** Whether a chosen record can be cleared. Off for a required field unsaid. */
  clearable?: boolean | undefined;
  placeholder?: string | undefined;
}) {
  const [input, setInput] = useState("");
  const term = useDebounced(input);
  const query = useQuery({
    queryKey: [...queryKey, term],
    queryFn: () => search(term),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const words = listWords(noun);
  const options = query.data?.options ?? [];
  const chosen = useChosen(
    options.find((option) => option.value === value) ??
      (value && selected?.value === value ? selected : null),
  );
  // Before the reader searches, a chosen record the first page left out leads the list; a search
  // shows only what matched it.
  const items =
    chosen && !term && !options.some((option) => option.value === chosen.value)
      ? [chosen, ...options]
      : options;
  const loading = query.isFetching || input !== term;

  const failure = query.isError
    ? `The search could not load ${noun}.${
        query.error instanceof Error && query.error.message
          ? ` ${sentence(query.error.message)}`
          : ""
      }`
    : null;
  const retry = () => void query.refetch();
  const enterRetries = !!failure && !loading && items.length === 0;
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      <Combobox<ComboboxOption>
        items={items}
        value={chosen}
        isItemEqualToValue={(item, other) => item.value === other.value}
        // The server filters: the list shows what it returned.
        filter={null}
        // A search the reader leaves (Escape, a choice, focus moving on) ends with it: the input
        // shows the chosen record again, so the next open lists the first page, not stale matches.
        onInputValueChange={(text, details) => setInput(typed(details.reason) ? text : "")}
        onValueChange={(item) => onChange(item?.value ?? null)}
      >
        <ComboboxInput
          ref={bind(controlRef)}
          placeholder={placeholder}
          showClear={clearable}
          onKeyDown={retryOnEnter(enterRetries, retry)}
        />
        <ComboboxContent>
          <ListStatus
            words={words}
            loading={loading}
            failure={failure}
            onRetry={retry}
            enterRetries={enterRetries}
            {...(query.data ? { total: query.data.total } : {})}
          />
          <ComboboxEmpty>{loading || failure ? null : words.none}</ComboboxEmpty>
          <ComboboxList aria-busy={loading || undefined}>
            {(option: ComboboxOption) => <OptionItem key={option.value} option={option} />}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/**
 * A value the context fixes (the program a task is created in), shown as labelled text in place of
 * a field: its name, a skeleton while it loads, or Absent once it cannot be read.
 */
export function ContextValue({
  label,
  value,
  query,
  noun,
}: {
  label: string;
  value: ReactNode | null | undefined;
  /** The query the value comes from. */
  query: { isPending: boolean; isError: boolean };
  /** What the value is, in the loading and unavailable words: "program". */
  noun: string;
}) {
  return (
    <KeyValue label={label} wrap>
      {value ??
        (query.isPending && !query.isError ? (
          <span aria-busy="true">
            <Skeleton width={160} />
            <VisuallyHidden>Loading the {noun}</VisuallyHidden>
          </span>
        ) : (
          <Absent label={`Unavailable ${noun}`} />
        ))}
    </KeyValue>
  );
}

/** A person or organization in this workspace, searched by name and email. */
export function PartyField({
  parties,
  placeholder = "Choose a person or organization",
  ...props
}: Omit<ComboboxFieldProps, "options" | "noun"> & {
  parties: Row<"parties">[];
}) {
  return (
    <ComboboxField
      {...props}
      placeholder={placeholder}
      noun="people and organizations"
      options={parties.map((party) => ({
        value: party.id,
        label: party.name,
        detail: party.email,
      }))}
    />
  );
}
