import { useId, useMemo, useRef, useState, type RefObject } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
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
  FieldSet,
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
  defineColumns,
  toast,
  useLedgerLocale,
  type WorkPaneView,
} from "@ledger/design-system";
import { discardChanges, useConfirmation } from "@/components/app/confirmation";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { parameterName } from "@/components/app/profile-tailoring/names";
import {
  choiceHeadingOf,
  entryMode,
  useOffers,
  type Offer,
} from "@/components/app/profile-tailoring/parameter-offers";
import { ParameterValueEntry } from "@/components/app/profile-tailoring/parameter-picker";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  useOverlayParameters,
  useSetOverlayParameters,
  type ControlOverlay,
  type OverlayParameterValue,
} from "@/lib/control-overlays";
import { idSet, useRows, type Row } from "@/lib/models";
import { resiliencyParameter, vocabularyValues } from "@/lib/resiliency-choice";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useRemovalFocus } from "./record-preview";

type OverlayLike = Pick<ControlOverlay, "id" | "code" | "title" | "catalog_revision_id">;
type SetValue = Pick<
  Row<"control_overlay_parameters">,
  "id" | "parameter_id" | "parameter_values" | "rationale"
>;
type Parameter = Pick<
  Row<"parameters">,
  | "id"
  | "source_id"
  | "control_id"
  | "label"
  | "usage"
  | "has_selection"
  | "selection_count"
  | "ordinal"
>;
const parameterColumns = [
  "id",
  "source_id",
  "control_id",
  "label",
  "usage",
  "has_selection",
  "selection_count",
  "ordinal",
] as const;

type ValueRow = {
  id: string;
  parameterId: string;
  sourceId: string;
  name: string;
  /** The parameter's place in the catalog's order, by its source id. */
  order: number;
  controlId: string | null;
  control: string;
  values: readonly { key: string; label: string }[];
  rationale: string;
};

const NO_VALUES: SetValue[] = [];
const byOrder = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });
const choicesOf = (
  rows: readonly Pick<Row<"parameter_choices">, "parameter_id" | "ordinal" | "value">[],
) => {
  const map = new Map<string, string[]>();
  for (const row of [...rows].sort((a, b) => a.ordinal - b.ordinal))
    map.set(row.parameter_id, [...(map.get(row.parameter_id) ?? []), row.value]);
  return map;
};

/**
 * An overlay's Parameter values: each parameter the overlay sets, with its values in order and
 * why. Applied, they become the layer's own settings, so a program whose stack holds the overlay
 * reads them as the nearest layer that sets the parameter. While the overlay is a draft, a reader
 * who may write sets values in the Set parameter values Dialog and removes a value set behind a
 * confirmation; a published overlay's values are read only.
 */
export function OverlayParameters({
  overlay,
  revision,
  canAuthor,
  onSaved,
}: {
  overlay: OverlayLike;
  /** The overlay's revision as the page knows it now: a write is made at it. */
  revision: () => number;
  /** A draft, and a reader who may write: the authoring actions show. */
  canAuthor: boolean;
  onSaved: (saved: ControlOverlay) => void;
}) {
  const values = useOverlayParameters(overlay.id);
  const ids = useMemo(() => idSet(values.data?.map((row) => row.parameter_id)), [values.data]);
  // Only the parameters the overlay sets, their choices and their controls, and only what a row shows.
  const parameters = useRows(
    "parameters",
    { id: ids },
    { columns: parameterColumns, enabled: values.isSuccess && ids.length > 0 },
  );
  const choices = useRows(
    "parameter_choices",
    { parameter_id: ids },
    { columns: ["parameter_id", "ordinal", "value"], enabled: values.isSuccess && ids.length > 0 },
  );
  const controlIds = useMemo(
    () => idSet(parameters.data?.map((row) => row.control_id)),
    [parameters.data],
  );
  const controls = useRows(
    "controls",
    { id: controlIds },
    { columns: ["id", "code", "title"], enabled: controlIds.length > 0 },
  );
  const data = useMemo<ValueRow[]>(() => {
    const byId = new Map((parameters.data ?? []).map((row) => [row.id, row]));
    const control = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const offered = choicesOf(choices.data ?? []);
    return (values.data ?? [])
      .flatMap((row) => {
        const parameter = byId.get(row.parameter_id);
        if (!parameter) return [];
        const owner = parameter.control_id ? control.get(parameter.control_id) : undefined;
        return [
          {
            id: row.id,
            parameterId: parameter.id,
            sourceId: parameter.source_id,
            name: parameterName(parameter, offered.get(parameter.id) ?? []),
            order: 0,
            controlId: parameter.control_id,
            control: owner ? `${owner.code} ${owner.title}` : "",
            values: row.parameter_values.map((value, index) => ({ key: `${index}`, label: value })),
            rationale: row.rationale,
          },
        ];
      })
      .sort((a, b) => byOrder(a.sourceId, b.sourceId))
      .map((row, order) => ({ ...row, order }));
  }, [values.data, parameters.data, choices.data, controls.data]);
  const save = useSetOverlayParameters();
  const { confirm, confirmation } = useConfirmation();
  const focus = useRemovalFocus(data);
  const [editing, setEditing] = useState<{ parameterId: string | null } | null>(null);
  // The row menu calls the current render's handlers, so the columns need not change with them.
  const act = useRef<{ edit: (row: ValueRow) => void; remove: (row: ValueRow) => void }>({
    edit: () => {},
    remove: () => {},
  });
  const columns = useMemo(
    () =>
      defineColumns<ValueRow>((c) => [
        c.text("name", {
          header: "Parameter",
          priority: 0,
          hideable: false,
          width: 260,
          minWidth: 200,
          sortBy: (row) => row.order,
          // A parameter has no page of its own: its name opens its preview.
          cell: (row) => (
            <RecordLink table="parameters" record={{ id: row.parameterId }}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.id("sourceId", { header: "ID", width: 150, priority: 3 }),
        c.text("control", {
          header: "Control",
          width: 240,
          priority: 1,
          cell: (row) =>
            row.controlId ? (
              <RecordLink table="controls" record={{ id: row.controlId }}>
                {row.control}
              </RecordLink>
            ) : null,
        }),
        c.list("values", { header: "Values", width: 220, priority: 2, items: (row) => row.values }),
        c.text("rationale", { header: "Rationale", minWidth: 220, priority: 4, wrap: true }),
        ...(canAuthor
          ? [
              c.actions((row: ValueRow) => [
                { label: "Edit values", onSelect: () => act.current.edit(row) },
                {
                  label: "Remove values",
                  tone: "danger" as const,
                  onSelect: () => act.current.remove(row),
                },
              ]),
            ]
          : []),
      ]),
    [canAuthor],
  );
  const table = useCollectionTable({
    columns,
    data,
    getRowId: (row) => row.id,
    label: "Parameter values",
    view: "live-overlay-parameters",
    resizable: true,
  });
  async function removeValues(row: ValueRow) {
    const removed = await confirm({
      title: "Remove values?",
      description: `${overlay.title} will no longer set ${row.sourceId}. A program that applies it reads the value the layers beneath it set, else the catalog's.`,
      confirmLabel: "Remove values",
      variant: "danger",
      failureTitle: "The values were not removed",
      action: async () => {
        focus.removed(row.id);
        onSaved(
          await save.mutateAsync({
            overlayId: overlay.id,
            expectedRevision: revision(),
            parameters: [],
            removedParameterIds: [row.parameterId],
          }),
        );
      },
    });
    if (!removed) return;
    toast.add({
      type: "success",
      title: "Values removed",
      description: `${overlay.code} no longer sets ${row.sourceId}.`,
    });
  }
  act.current = {
    edit: (row) => setEditing({ parameterId: row.parameterId }),
    remove: (row) => void removeValues(row),
  };
  // The button that opens the Dialog: the empty state's until a value is set, then the toolbar's.
  // Focus returns to whichever is on the page when the Dialog closes.
  const opener = useRef<HTMLButtonElement | null>(null);
  const action = canAuthor ? (
    <Button
      // A removal takes its row and the menu that asked; focus comes back here.
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
        if (node) opener.current = node;
      }}
      size="small"
      variant="secondary"
      onClick={() => {
        // The trigger stays enabled while its dialog is open; a second press opens nothing new.
        if (!editing) setEditing({ parameterId: null });
      }}
    >
      Set parameter values
    </Button>
  ) : undefined;
  return (
    <Section
      title="Parameter values"
      {...(values.data ? { count: values.data.length, countMax: 9999 } : {})}
    >
      {editing && (
        <OverlayParameterDialog
          overlay={overlay}
          revision={revision}
          set={values.data ?? NO_VALUES}
          initialParameterId={editing.parameterId}
          finalFocus={() => (opener.current?.isConnected ? opener.current : true)}
          onSaved={onSaved}
          onClose={() => setEditing(null)}
        />
      )}
      <ProductCollection
        table={table}
        queries={[values, parameters, choices, controls]}
        compact
        noun={{ one: "parameter value", other: "parameter values" }}
        action={action}
        empty={{
          title: "No parameter values",
          description: canAuthor
            ? "Set the values a program applying this overlay gives a control's parameters, each with its rationale."
            : "This overlay sets no parameter values.",
          action,
        }}
      />
      {confirmation}
    </Section>
  );
}

/** How many parameters the list draws at once; the search finds the rest. */
const LISTED_AT_MOST = 100;

type Field = "values" | "rationale";

/**
 * Set parameter values: the edition's parameters in a list beside the chosen one's source text and
 * its values, entered the way the tailoring enters them (a Select for one choice, boxes or a
 * searched list for several, lines of text otherwise, SA-24's five from the cyber resiliency
 * framework). Each parameter's values are saved on their own, with their rationale, at the
 * overlay's revision; the Dialog stays open for the next. Unsearched, the list holds the
 * parameters the overlay sets and those of the controls it adds; a search finds any parameter of
 * the edition by its control, its id or its name.
 */
function OverlayParameterDialog({
  overlay,
  revision,
  set,
  initialParameterId,
  finalFocus,
  onSaved,
  onClose,
}: {
  overlay: OverlayLike;
  revision: () => number;
  /** The values the overlay sets now. */
  set: readonly SetValue[];
  /** The parameter the Dialog opens on, with focus on its heading. */
  initialParameterId: string | null;
  /** Where focus goes as the Dialog closes: the opener on the page then. */
  finalFocus: () => HTMLElement | boolean;
  onSaved: (saved: ControlOverlay) => void;
  onClose: () => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const formId = useId();
  const edition = overlay.catalog_revision_id;
  const ofEdition = { "parameters.catalog_revision_id": edition };
  const parameters = useRows(
    "parameters",
    { catalog_revision_id: edition },
    { columns: parameterColumns },
  );
  const choices = useRows("parameter_choices", ofEdition, {
    columns: ["parameter_id", "ordinal", "value"],
  });
  const defaults = useRows("parameter_values", ofEdition, {
    columns: ["parameter_id", "ordinal", "value"],
  });
  const constraints = useRows("parameter_constraints", ofEdition, {
    columns: ["parameter_id", "description", "ordinal"],
  });
  const guidelines = useRows("parameter_guidelines", ofEdition, {
    columns: ["parameter_id", "prose", "ordinal"],
  });
  const controls = useRows(
    "controls",
    { catalog_revision_id: edition },
    { columns: ["id", "code", "title"] },
  );
  const decisions = useRows(
    "control_overlay_decisions",
    { overlay_id: overlay.id },
    { columns: ["control_id", "action"] },
  );
  const reads = [parameters, choices, defaults, constraints, guidelines, controls, decisions];
  const ready = reads.every((read) => read.data !== undefined);
  const failed = reads.find((read) => read.isError && read.data === undefined);
  const offered = useMemo(() => choicesOf(choices.data ?? []), [choices.data]);
  const control = useMemo(
    () => new Map((controls.data ?? []).map((row) => [row.id, row])),
    [controls.data],
  );
  const setBy = useMemo(() => new Map(set.map((row) => [row.parameter_id, row])), [set]);
  const sorted = useMemo(
    () => [...(parameters.data ?? [])].sort((a, b) => byOrder(a.source_id, b.source_id)),
    [parameters.data],
  );
  const added = useMemo(
    () =>
      new Set(
        (decisions.data ?? [])
          .filter((row) => row.action === "include")
          .map((row) => row.control_id),
      ),
    [decisions.data],
  );
  const searchText = useMemo(
    () =>
      new Map(
        sorted.map((parameter) => {
          const owner = parameter.control_id ? control.get(parameter.control_id) : undefined;
          return [
            parameter.id,
            `${owner?.code ?? ""} ${owner?.title ?? ""} ${parameter.source_id} ${parameterName(parameter, offered.get(parameter.id) ?? [])}`.toLowerCase(),
          ];
        }),
      ),
    [sorted, control, offered],
  );
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const found = query
    ? sorted.filter((parameter) => searchText.get(parameter.id)?.includes(query))
    : sorted.filter(
        (parameter) =>
          setBy.has(parameter.id) ||
          parameter.id === initialParameterId ||
          (parameter.control_id !== null && added.has(parameter.control_id)),
      );
  const shown = found.slice(0, LISTED_AT_MOST);
  const [selected, setSelected] = useState<string | null>(initialParameterId);
  const [paneView, setPaneView] = useState<WorkPaneView>(initialParameterId ? "detail" : "list");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The Dialog closes through its open state, so its exit and the return of focus to the button
  // that opened it run before the section unmounts it.
  const [open, setOpen] = useState(true);
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The values you entered have not been saved.",
  });
  const { confirm, confirmation } = useConfirmation();
  const parameter = sorted.find((row) => row.id === selected);
  // SA-24's vocabulary is read once one of its five parameters is chosen.
  const offerFor = useOffers(!!parameter && !!resiliencyParameter(parameter.source_id));
  const offer = parameter ? offerFor(parameter.source_id) : undefined;
  /** Chooses a parameter, once unsaved values are let go; false keeps the reader on it. */
  async function choose(parameterId: string) {
    if (parameterId === selected) return true;
    if (dirty && !(await confirm(discardChanges("The values you entered have not been saved."))))
      return false;
    setDirty(false);
    setSelected(parameterId);
    return true;
  }
  const count = query
    ? found.length > shown.length
      ? `${formatNumber(found.length)} parameters match; the first ${formatNumber(shown.length)} are listed`
      : `${formatNumber(found.length)} matching ${found.length === 1 ? "parameter" : "parameters"}`
    : `${formatNumber(found.length)} listed: the parameters this overlay sets and those of the controls it adds`;
  return (
    <Dialog
      open={open}
      pending={busy || guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        width="xlarge"
        finalFocus={finalFocus}
        initialFocus={() =>
          initialParameterId ? (headingRef.current ?? true) : (searchRef.current ?? true)
        }
      >
        <DialogHeader>
          <DialogTitle>Set parameter values</DialogTitle>
          <DialogDescription>
            {`${overlay.code} · Choose a parameter, then record its values and why a program applying the overlay takes them.`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.200" className="@container">
            {failed ? (
              <Alert variant="destructive" role="alert">
                <AlertCircle aria-hidden />
                <AlertTitle>The parameters could not be loaded</AlertTitle>
                <AlertDescription>{causeText(failed.error)}</AlertDescription>
              </Alert>
            ) : null}
            <Text
              size="small"
              color="color.text.subtle"
              className={paneView === "detail" && parameter ? "hidden @3xl:block" : undefined}
            >
              {ready ? count : "Loading the edition's parameters"}
            </Text>
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
              list={shown.map((row) => {
                const owner = row.control_id ? control.get(row.control_id) : undefined;
                const value = setBy.get(row.id);
                return (
                  <WorkPane.Row
                    key={row.id}
                    id={row.source_id}
                    title={parameterName(row, offered.get(row.id) ?? [])}
                    meta={`${owner?.code ?? "No control"} · ${value ? value.parameter_values.join("; ") : "Not set here"}`}
                    isActive={row.id === selected}
                    onSelect={() => choose(row.id)}
                  />
                );
              })}
              listEmpty={
                ready ? (
                  <Empty size="compact">
                    <EmptyHeader>
                      <EmptyTitle>{query ? "No parameter matches" : "Find a parameter"}</EmptyTitle>
                      <EmptyDescription>
                        {query
                          ? "No parameter of the edition has that control, id or name."
                          : "Search by a control's code or title, a parameter's id or its name."}
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
                ) : undefined
              }
              detail={
                parameter ? (
                  <ValuesEditor
                    key={parameter.id}
                    formId={formId}
                    overlay={overlay}
                    revision={revision}
                    parameter={parameter}
                    control={parameter.control_id ? control.get(parameter.control_id) : undefined}
                    choices={offered.get(parameter.id) ?? []}
                    defaults={(defaults.data ?? [])
                      .filter((row) => row.parameter_id === parameter.id)
                      .sort((a, b) => a.ordinal - b.ordinal)
                      .map((row) => row.value)}
                    constraints={(constraints.data ?? [])
                      .filter((row) => row.parameter_id === parameter.id)
                      .sort((a, b) => a.ordinal - b.ordinal)
                      .flatMap((row) => (row.description ? [row.description] : []))}
                    guidelines={(guidelines.data ?? [])
                      .filter((row) => row.parameter_id === parameter.id)
                      .sort((a, b) => a.ordinal - b.ordinal)
                      .map((row) => row.prose)}
                    current={setBy.get(parameter.id)}
                    offer={offer}
                    headingRef={headingRef}
                    onDirty={setDirty}
                    onBusy={setBusy}
                    onSaved={onSaved}
                    confirm={confirm}
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
          <Button
            variant="primary"
            type="submit"
            form={formId}
            isLoading={busy}
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
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
      {confirmation}
    </Dialog>
  );
}

/** The chosen parameter: its source text, then its values and their rationale, saved together. */
function ValuesEditor({
  formId,
  overlay,
  revision,
  parameter,
  control,
  choices,
  defaults,
  constraints,
  guidelines,
  current,
  offer,
  headingRef,
  onDirty,
  onBusy,
  onSaved,
  confirm,
}: {
  formId: string;
  overlay: OverlayLike;
  revision: () => number;
  parameter: Parameter;
  control: { code: string; title: string } | undefined;
  choices: readonly string[];
  /** The catalog's own values for it, when it prints any. */
  defaults: readonly string[];
  constraints: readonly string[];
  guidelines: readonly string[];
  /** What the overlay sets for it now. */
  current: SetValue | undefined;
  offer: Offer | undefined;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  onSaved: (saved: ControlOverlay) => void;
  confirm: ReturnType<typeof useConfirmation>["confirm"];
}) {
  const save = useSetOverlayParameters();
  const recorded = current?.parameter_values ?? [];
  const vocabulary = offer?.state === "ready" ? offer.vocabulary : undefined;
  const source = offer?.state === "ready" ? offer.source : undefined;
  const waiting = offer?.state === "loading";
  const mode = entryMode({ choices: [...choices], values: [...recorded], parameter }, vocabulary);
  const pickFrom = useMemo(
    () => vocabulary?.options.map((option) => option.title) ?? [...choices],
    [vocabulary, choices],
  );
  const [values, setValues] = useState<string[]>([...recorded]);
  const [text, setText] = useState(recorded.join("\n"));
  const [rationale, setRationale] = useState(current?.rationale ?? "");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [said, setSaid] = useState<"saved" | "removed" | null>(null);
  const feedback = useFormFeedback<Field>();
  const chosen = vocabulary ? (vocabularyValues(vocabulary, values) ?? []) : values;
  const entered =
    mode === "text"
      ? text
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
      : chosen;
  const issues: FormIssue<Field>[] = [
    ...(entered.length
      ? []
      : [
          {
            field: "values" as const,
            message:
              mode === "one"
                ? "Choose a value for this parameter."
                : mode === "many"
                  ? "Choose at least one value for this parameter."
                  : "Enter at least one value for this parameter.",
          },
        ]),
    ...(rationale.trim()
      ? []
      : [{ field: "rationale" as const, message: "Enter the rationale for these values." }]),
  ];
  const errorFor = (field: Field) =>
    feedback.submitted ? issues.find((issue) => issue.field === field)?.message : undefined;
  const changed = () => {
    setSaid(null);
    setFailure(null);
    onDirty(true);
  };
  const pick = (next: string[]) => {
    setValues(pickFrom.filter((choice) => next.includes(choice)));
    changed();
  };
  const busy = (value: boolean) => {
    setPending(value);
    onBusy(value);
  };
  async function submit() {
    if (pending || waiting) return;
    setSaid(null);
    setFailure(null);
    if (!feedback.report(issues)) return;
    const value: OverlayParameterValue = {
      parameterId: parameter.id,
      values: entered,
      rationale: rationale.trim(),
    };
    busy(true);
    try {
      onSaved(
        await save.mutateAsync({
          overlayId: overlay.id,
          expectedRevision: revision(),
          parameters: [value],
        }),
      );
      setValues(entered);
      setText(entered.join("\n"));
      setSaid("saved");
      onDirty(false);
    } catch (cause) {
      setFailure(
        `${causeText(cause, "The values could not be saved.")} Your values are kept; saving them again will not duplicate them.`,
      );
    } finally {
      busy(false);
    }
  }
  async function remove() {
    const removed = await confirm({
      title: "Remove values?",
      description: `${overlay.title} will no longer set ${parameter.source_id}. A program that applies it reads the value the layers beneath it set, else the catalog's.`,
      confirmLabel: "Remove values",
      variant: "danger",
      failureTitle: "The values were not removed",
      action: async () =>
        onSaved(
          await save.mutateAsync({
            overlayId: overlay.id,
            expectedRevision: revision(),
            parameters: [],
            removedParameterIds: [parameter.id],
          }),
        ),
    });
    if (!removed) return;
    setRationale("");
    setValues([...defaults]);
    setText(defaults.join("\n"));
    setSaid("removed");
    onDirty(false);
    headingRef.current?.focus();
  }
  const choiceHeading = choiceHeadingOf(parameter);
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Stack space="space.200">
        <Heading size="overlay" ref={headingRef} tabIndex={-1}>
          {parameterName(parameter, choices)}
        </Heading>
        <HeadingLevelProvider>
          <Stack space="space.200">
            <KeyValue.Group>
              <KeyValue label="ID">
                <Id>{parameter.source_id}</Id>
              </KeyValue>
              {control ? (
                <KeyValue label="Control" wrap>
                  <Id>{control.code}</Id> {control.title}
                </KeyValue>
              ) : null}
              <KeyValue label="Set by this overlay" wrap>
                {current ? current.parameter_values.join("; ") : "Not set"}
              </KeyValue>
              {defaults.length ? (
                <KeyValue label="Catalog default" wrap>
                  {defaults.join("; ")}
                </KeyValue>
              ) : null}
            </KeyValue.Group>
            {parameter.usage ? <Prose label="Usage">{parameter.usage}</Prose> : null}
            {choices.length && mode === "text" ? (
              <Section title={choiceHeading}>
                <List>
                  {choices.map((choice) => (
                    <List.Item key={choice}>{choice}</List.Item>
                  ))}
                </List>
              </Section>
            ) : null}
            {constraints.length ? (
              <Section title="Source constraints">
                <Stack space="space.100">
                  {constraints.map((constraint) => (
                    <Prose key={constraint}>{constraint}</Prose>
                  ))}
                </Stack>
              </Section>
            ) : null}
            {guidelines.length ? (
              <Section title="Guidance">
                <Stack space="space.100">
                  {guidelines.map((guideline) => (
                    <Prose key={guideline}>{guideline}</Prose>
                  ))}
                </Stack>
              </Section>
            ) : null}
            <Section title="Values">
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
                          setValues(entered);
                          offer.retry();
                        }}
                      >
                        Try again
                      </Button>
                    </AlertAction>
                  </Alert>
                ) : null}
                {failure ? (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle aria-hidden />
                    <AlertTitle>The values were not saved</AlertTitle>
                    <AlertDescription>{failure}</AlertDescription>
                  </Alert>
                ) : null}
                <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
                <FieldSet disabled={pending}>
                  <Stack space="space.150">
                    <ParameterValueEntry
                      mode={mode}
                      waiting={waiting}
                      sourceChoices={choices}
                      choices={pickFrom}
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
                      label="Rationale"
                      description="Why a program applying the overlay takes these values. It is recorded on the layer."
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
                    {current ? (
                      <div>
                        <Button variant="subtle" onClick={() => void remove()}>
                          Remove values
                        </Button>
                      </div>
                    ) : null}
                  </Stack>
                </FieldSet>
                {said === "saved" ? (
                  <Alert role="status" tone="success">
                    <AlertTitle>Values set for {parameter.source_id}.</AlertTitle>
                  </Alert>
                ) : said === "removed" ? (
                  <Alert role="status">
                    <AlertTitle>Values removed from {parameter.source_id}.</AlertTitle>
                  </Alert>
                ) : null}
              </Stack>
            </Section>
          </Stack>
        </HeadingLevelProvider>
      </Stack>
    </form>
  );
}
