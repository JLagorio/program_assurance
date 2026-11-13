import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  DataTable,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FilterChip,
  Grid,
  Inline,
  PickerSheet,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Section,
  Stack,
  Text,
  defineColumns,
  toast,
  useLedgerLocale,
  type DataTableInstance,
} from "@ledger/design-system";
import { useConfirmation } from "@/components/app/confirmation";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  resiliencyDecisions,
  useSetOverlayDecisions,
  type ControlOverlay,
  type OverlayDecision,
} from "@/lib/control-overlays";
import {
  CYBER_RESILIENCY_FRAMEWORK,
  resiliencyByControl,
  resiliencyByTechnique,
  useFrameworkItems,
  useResiliencyControlLinks,
} from "@/lib/frameworks";
import { idSet, useRows, type Row } from "@/lib/models";
import { serverRead, useServerCounts, useServerResult, type ServerRow } from "@/lib/server-table";
import { controlPublicationStatuses, overlayDecisionActions } from "@/lib/status";
import { useCollectionTable, useServerCollection } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useRemovalFocus } from "./record-preview";
import { QueryState, ReportFailures } from "./work-common";

type Action = OverlayDecision["action"];

/** The decisions an overlay holds, as its record page and the picker read them. */
export function useOverlayDecisions(overlayId: string) {
  return useRows(
    "control_overlay_decisions",
    { overlay_id: overlayId },
    { columns: ["id", "control_id", "action", "rationale"] },
  );
}

type DecisionRow = {
  id: string;
  controlId: string;
  code: string;
  /** The control's code and title together: titles repeat across families. */
  name: string;
  /** The control's place in code order: AC-2 before AC-10. */
  order: number;
  action: string;
  rationale: string;
};

const plural = (count: number, format: (value: number) => string) =>
  `${format(count)} ${count === 1 ? "decision" : "decisions"}`;

/**
 * An overlay's Control decisions: each control the overlay adds to or removes from a baseline,
 * with the rationale. While the overlay is a draft, a reader who may write adds decisions through
 * the picker and removes one behind a confirmation; a published overlay's decisions are read only.
 */
export function OverlayDecisions({
  overlay,
  revision,
  canAuthor,
  onSaved,
}: {
  overlay: Pick<ControlOverlay, "id" | "code" | "title" | "catalog_revision_id">;
  /** The overlay's revision as the page knows it now: a write is made at it. */
  revision: () => number;
  /** A draft, and a reader who may write: the authoring actions show. */
  canAuthor: boolean;
  onSaved: (saved: ControlOverlay) => void;
}) {
  const [adding, setAdding] = useState(false);
  const decisions = useOverlayDecisions(overlay.id);
  // Only the controls the decisions name, and only what a row shows of each.
  const controls = useRows(
    "controls",
    { id: idSet(decisions.data?.map((decision) => decision.control_id)) },
    { columns: ["id", "code", "title"], enabled: decisions.isSuccess },
  );
  const data = useMemo<DecisionRow[]>(() => {
    const byId = new Map((controls.data ?? []).map((control) => [control.id, control]));
    return (decisions.data ?? [])
      .flatMap((decision) => {
        const control = byId.get(decision.control_id);
        if (!control) return [];
        return [
          {
            id: decision.id,
            controlId: control.id,
            code: control.code,
            name: `${control.code} · ${control.title}`,
            order: 0,
            action: decision.action,
            rationale: decision.rationale,
          },
        ];
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      .map((row, order) => ({ ...row, order }));
  }, [decisions.data, controls.data]);
  const save = useSetOverlayDecisions();
  const { confirm, confirmation } = useConfirmation();
  const focus = useRemovalFocus(data);
  // The row menu calls the current render's removal, so the columns need not change with it.
  const removeRow = useRef<(row: DecisionRow) => void>(() => {});
  const columns = useMemo(
    () =>
      defineColumns<DecisionRow>((c) => [
        c.text("name", {
          header: "Control",
          priority: 0,
          hideable: false,
          width: 280,
          minWidth: 200,
          sortBy: (row) => row.order,
          // A catalog control has no page of its own: its name opens its schema record.
          cell: (row) => (
            <RecordLink table="controls" record={{ id: row.controlId }}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.status("action", {
          header: "Decision",
          width: 120,
          priority: 1,
          statuses: overlayDecisionActions,
        }),
        c.text("rationale", { header: "Rationale", minWidth: 240, priority: 2, wrap: true }),
        ...(canAuthor
          ? [
              c.actions((row: DecisionRow) => [
                {
                  label: "Remove decision",
                  tone: "danger" as const,
                  onSelect: () => removeRow.current(row),
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
    label: "Control decisions",
    view: "live-overlay-decisions",
    resizable: true,
  });
  async function removeDecision(row: DecisionRow) {
    const removed = await confirm({
      title: "Remove decision?",
      description: `${overlay.title} will no longer decide on ${row.name}. The decision's rationale is removed with it.`,
      confirmLabel: "Remove decision",
      variant: "danger",
      failureTitle: "The decision was not removed",
      action: async () => {
        focus.removed(row.id);
        onSaved(
          await save.mutateAsync({
            overlayId: overlay.id,
            expectedRevision: revision(),
            decisions: [],
            removedControlIds: [row.controlId],
          }),
        );
      },
    });
    if (!removed) return;
    toast.add({
      type: "success",
      title: "Decision removed",
      description: `${overlay.code} no longer decides on ${row.code}.`,
    });
  }
  removeRow.current = (row) => void removeDecision(row);
  // The first decisions replace the empty state, and the button in it that opened the picker, with
  // the toolbar's: once the closing sheet has let go of focus and it has nowhere to be, it goes to
  // the toolbar's Add decisions.
  function focusActionWhenLost() {
    let tries = 0;
    const settle = () => {
      const active = document.activeElement;
      const target = focus.target.current;
      if ((!active || active === document.body) && target?.isConnected) {
        target.focus();
        if (document.activeElement === target) return;
      }
      if (tries++ < 120) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }
  const action = canAuthor ? (
    <Button
      // A removal takes its row and the menu that asked; focus comes back here.
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
      }}
      size="small"
      variant="secondary"
      iconBefore={<Plus />}
      onClick={() => setAdding(true)}
    >
      Add decisions
    </Button>
  ) : undefined;
  // The decisions already recorded, which the picker marks and does not offer again.
  const decided = useMemo(
    () => new Map((decisions.data ?? []).map((decision) => [decision.control_id, decision.action])),
    [decisions.data],
  );
  return (
    <Section
      title="Control decisions"
      {...(decisions.data ? { count: decisions.data.length, countMax: 9999 } : {})}
    >
      {adding && (
        <AddOverlayDecisions
          overlay={overlay}
          revision={revision}
          decided={decided}
          onSaved={(row) => {
            onSaved(row);
            if (data.length === 0) focusActionWhenLost();
          }}
          onClose={() => setAdding(false)}
        />
      )}
      <ProductCollection
        table={table}
        queries={[decisions, controls]}
        compact
        noun={{ one: "control decision", other: "control decisions" }}
        action={action}
        empty={{
          title: "No control decisions yet",
          description: canAuthor
            ? "Add the controls this overlay adds to or removes from a baseline, each with its rationale."
            : "This overlay adds and removes no controls.",
          action,
        }}
      />
      {confirmation}
    </Section>
  );
}

/** A catalog control as the picker offers it. */
type Candidate = ServerRow<
  "catalog_control_rows",
  "id" | "code" | "title" | "family" | "status" | "catalog_revision_id",
  "code" | "title" | "status" | "catalog_revision_id"
>;

/**
 * The edition's controls, a page at a time from the server, in code order: all of them, or the
 * controls `controlIds` names (those behind a resiliency technique), which the server takes as a
 * list, so the page, the search and the count keep to them.
 */
const candidateRead = (edition: string, controlIds?: readonly string[] | undefined) =>
  serverRead({
    source: "catalog_control_rows",
    model: "controls",
    columns: ["id", "code", "title", "family", "status", "catalog_revision_id"],
    scope: { catalog_revision_id: edition, ...(controlIds ? { id: controlIds } : {}) },
    search: ["code", "title", "family"],
    fields: {
      code: { sort: "code_order" },
      status: { labels: controlPublicationStatuses },
    },
    order: [{ column: "code_order" }],
  });

const decisionChoices = [
  { value: "include", label: `${overlayDecisionActions.include.label} to the baseline` },
  { value: "exclude", label: `${overlayDecisionActions.exclude.label} from the baseline` },
] satisfies { value: Action; label: string }[];

/** Where an added control's rationale comes from: the reader writes one for all, or Table E-1 gives each its own. */
type RationaleSource = "written" | "table";

type DecisionField = "action" | "source" | "rationale";

/** The column the Resiliency technique filter is kept on. It is never drawn. */
const TECHNIQUE = "technique";
const TECHNIQUE_KINDS = ["technique"] as const;
const NO_CONTROLS: readonly string[] = [];
/** The decision beside the rationale's source, from the window width the sheet stops filling. */
const CHOICES_SIDE_BY_SIDE = { base: "minmax(0,1fr)", md: "minmax(0,1fr) minmax(0,2fr)" };

/** A cyber resiliency technique as the filter offers it, with the controls Table E-1 names for it. */
type TechniqueOption = { code: string; title: string; controlIds: readonly string[] };

/** How many of the controls an issue names by code before it counts the rest. */
const NAMED_AT_MOST = 3;

/**
 * What stops a rationale taken from Table E-1: how many of the chosen controls the table does not
 * name, the first of them by code, and the two ways on. `codes` are those controls' codes.
 */
function unnamedIssue(
  codes: readonly string[],
  unnamed: number,
  chosen: number,
  format: (value: number) => string,
): string {
  const ways = `Clear ${unnamed === 1 ? "it" : "them"} from the choice, or write the rationale once for every decision.`;
  const named = [...codes]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, NAMED_AT_MOST);
  if (chosen === 1) return `${named[0] ?? "The chosen control"} is not in Table E-1. ${ways}`;
  const names =
    unnamed > named.length ? [...named, `${format(unnamed - named.length)} more`] : named;
  const last = names.at(-1);
  const which =
    last === undefined || !named.length
      ? ""
      : names.length === 1
        ? `: ${last}`
        : `: ${names.slice(0, -1).join(", ")} and ${last}`;
  return `${format(unnamed)} of the ${format(chosen)} chosen controls ${unnamed === 1 ? "is" : "are"} not in Table E-1${which}. ${ways}`;
}

/**
 * The Resiliency technique filter: one technique at a time, each with how many of the edition's
 * controls Table E-1 names for it. One, because the server is asked for the technique's controls
 * by id, and a request holds only so many. The table keeps the choice as a column filter, so it
 * counts among the applied filters and Clear filters clears it.
 */
function TechniqueFilter({
  table,
  options,
}: {
  table: DataTableInstance<Candidate>;
  options: readonly TechniqueOption[];
}) {
  const { t, formatNumber } = useLedgerLocale();
  const column = table.getColumn(TECHNIQUE);
  const value = column?.getFilterValue();
  const chosen = options.find((option) => option.code === value);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <FilterChip
            label="Resiliency technique"
            value={chosen?.title}
            isActive={value !== undefined}
          />
        }
      />
      <PopoverContent aria-label="Resiliency technique" align="start">
        <Stack space="space.100">
          <RadioGroup<string>
            aria-label="Resiliency technique"
            value={chosen?.code ?? ""}
            onValueChange={(code) => column?.setFilterValue(code || undefined)}
          >
            {options.map((option) => (
              <Field key={option.code} orientation="horizontal">
                <RadioGroupItem value={option.code} />
                <FieldLabel>
                  {option.title}
                  <Text size="small" color="color.text.subtlest" numeric>
                    {formatNumber(option.controlIds.length)}
                  </Text>
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          {value !== undefined ? (
            <Inline alignInline="end">
              <Button variant="link" size="small" onClick={() => column?.setFilterValue(undefined)}>
                {t("clear")}
              </Button>
            </Inline>
          ) : null}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Add decisions: choose the edition's controls, one decision for all of them and the rationale
 * each one records. Every chosen control is decided in one request, so all are recorded or none,
 * and adding again after a failure records only what is missing. A control the overlay already
 * decides on is marked with its decision and cannot be chosen again.
 *
 * Where the edition has NIST SP 800-160 Vol. 2's Table E-1 (the controls that support each cyber
 * resiliency technique), the candidates filter by technique, and a decision that adds controls can
 * take each control's rationale from the table in place of one written for all.
 */
function AddOverlayDecisions({
  overlay,
  revision,
  decided,
  onSaved,
  onClose,
}: {
  overlay: Pick<ControlOverlay, "id" | "code" | "title" | "catalog_revision_id">;
  revision: () => number;
  decided: ReadonlyMap<string, string>;
  onSaved: (saved: ControlOverlay) => void;
  onClose: () => void;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const save = useSetOverlayDecisions();
  const [action, setAction] = useState<Action | null>(null);
  const [source, setSource] = useState<RationaleSource>("written");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string>();
  const feedback = useFormFeedback<DecisionField>();
  // Table E-1 for the edition, read once: what each control supports, and the controls behind
  // each technique. Where it is not loaded, the picker offers no technique and no rationale from it.
  const links = useResiliencyControlLinks(overlay.catalog_revision_id);
  const techniques = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, { kinds: TECHNIQUE_KINDS });
  const supported = useMemo(() => resiliencyByControl(links.data ?? []), [links.data]);
  const techniqueOptions = useMemo<TechniqueOption[]>(() => {
    const byTechnique = resiliencyByTechnique(links.data ?? []);
    if (byTechnique.size === 0) return [];
    // The framework's techniques in its own order, each with its controls in this edition.
    return (techniques.data ?? []).map((item) => ({
      code: item.code,
      title: item.title,
      controlIds: idSet(byTechnique.get(item.code)?.controls.map((control) => control.id)),
    }));
  }, [links.data, techniques.data]);
  // The technique the reader filters by, which the table keeps with its filters (below). The read
  // is scoped to the technique's controls, so the server pages, searches and counts within them.
  const [technique, setTechnique] = useState<string | null>(null);
  const editionRead = useMemo(
    () => candidateRead(overlay.catalog_revision_id),
    [overlay.catalog_revision_id],
  );
  const read = useMemo(() => {
    if (technique === null) return editionRead;
    const controlIds = techniqueOptions.find((option) => option.code === technique)?.controlIds;
    return candidateRead(overlay.catalog_revision_id, controlIds ?? NO_CONTROLS);
  }, [editionRead, overlay.catalog_revision_id, technique, techniqueOptions]);
  // An added control can take the rationale Table E-1 gives it; a removal's is always written.
  const fromTable = supported.size > 0 && action === "include" && source === "table";
  // The edition's families, for the Family filter: the server's rows are one page of them.
  const groups = useRows(
    "catalog_groups",
    { catalog_revision_id: overlay.catalog_revision_id },
    { columns: ["id", "source_id", "ordinal"] },
  );
  const familyOptions = useMemo(
    () =>
      [...(groups.data ?? [])]
        .sort((a, b) => a.ordinal - b.ordinal)
        .flatMap((group: Pick<Row<"catalog_groups">, "source_id">) =>
          group.source_id ? [{ value: group.source_id.toUpperCase() }] : [],
        ),
    [groups.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<Candidate>((c) => [
        c.id("code", { header: "Control", width: 112, priority: 1, hideable: false }),
        c.text("title", {
          header: "Title",
          priority: 0,
          minWidth: 200,
          hideable: false,
          // What the overlay already decides for the control, which is why it cannot be chosen.
          badge: (row) =>
            decided.has(row.id) ? (
              <StatusBadge
                statuses={overlayDecisionActions}
                value={decided.get(row.id)}
                size="xsmall"
              />
            ) : null,
        }),
        c.text("family", { header: "Family", width: 100, priority: 2 }),
        c.status("status", {
          header: "Status",
          width: 130,
          priority: 3,
          statuses: controlPublicationStatuses,
        }),
        // Never drawn: it holds the Resiliency technique filter, so the table counts it among its
        // filters and clears it with them. The server's rows have no technique to sort or search by.
        c.custom(TECHNIQUE, { header: "Resiliency technique", hideable: false, cell: () => null }),
      ]),
    [decided],
  );
  // The picker's question ends with the task: it stays out of the address.
  const collection = useServerCollection<Candidate>(read, {
    keepQuestion: false,
    columns,
    selectable: (row) => !decided.has(row.id),
    rowLabel: (row) => `${row.code} · ${row.title}`,
    label: "Controls to decide on",
    pageSize: 50,
    initialState: { columnVisibility: { [TECHNIQUE]: false } },
  });
  const { table } = collection;
  // The technique the table's filters hold is the one the read is scoped to.
  const filtered = table.state.columnFilters.find((filter) => filter.id === TECHNIQUE)?.value;
  const asked = typeof filtered === "string" ? filtered : null;
  if (asked !== technique) setTechnique(asked);
  // Every control of the edition the overlay has not decided on, the search and filters aside.
  const [inEdition] = useServerCounts(editionRead, [{}]);
  const total = inEdition === undefined ? undefined : Math.max(0, inEdition - decided.size);
  const chosen = Object.keys(table.state.rowSelection).filter((id) => table.state.rowSelection[id]);
  // The code of every control the picker has shown or read, by id: a chosen control on another
  // page is still named when the reader is told the table gives it no rationale.
  const codes = useRef(new Map<string, string>());
  for (const row of table.getRowModel().rows) codes.current.set(row.id, row.original.code);
  // With the table as the source, each chosen control takes its own rationale from it.
  const tabled = fromTable ? resiliencyDecisions(chosen, supported) : undefined;
  // The header's checkbox chooses the page. Once it has, and the search and filters find more than
  // the page holds, the footer offers the rest: the whole result is read for its ids when asked.
  const readResult = useServerResult(read);
  const question = JSON.stringify([table.state.globalFilter ?? "", table.state.columnFilters]);
  const [wholeResult, setWholeResult] = useState<{ question: string; ids: readonly string[] }>();
  const [choosingAll, setChoosingAll] = useState(false);
  async function chooseAll() {
    if (choosingAll) return;
    setChoosingAll(true);
    setError(undefined);
    try {
      const rows = (await readResult({
        search: String(table.state.globalFilter ?? ""),
        filters: table.state.columnFilters,
      })) as Candidate[];
      for (const row of rows) codes.current.set(row.id, row.code);
      const ids = rows.filter((row) => !decided.has(row.id)).map((row) => row.id);
      table.setRowSelection((current) => ({
        ...current,
        ...Object.fromEntries(ids.map((id) => [id, true])),
      }));
      setWholeResult({ question, ids });
    } catch (cause) {
      setError(
        `${causeText(cause, "The controls could not be read.")} The controls on this page stay chosen; select all again.`,
      );
    } finally {
      setChoosingAll(false);
    }
  }
  const guard = useDraftGuard({
    dirty: chosen.length > 0 || !!rationale.trim() || action !== null || source === "table",
    onClose,
    description: "The controls you chose, the decision and the rationale will be lost.",
  });
  const found: FormIssue<DecisionField>[] = [];
  if (!action)
    found.push({
      field: "action",
      message: "Choose whether the overlay adds or removes these controls.",
    });
  if (tabled) {
    // A chosen control the table does not name has no rationale to take from it.
    const { unnamed } = tabled;
    if (unnamed.length > 0)
      found.push({
        field: "source",
        message: unnamedIssue(
          unnamed.flatMap((id) => codes.current.get(id) ?? []),
          unnamed.length,
          chosen.length,
          formatNumber,
        ),
      });
  } else if (!rationale.trim())
    found.push({ field: "rationale", message: "Enter the rationale for these decisions." });
  // Validate when the reader applies, then as the answers change.
  const errors = new Map(
    feedback.submitted ? found.map((issue) => [issue.field, issue.message] as const) : [],
  );
  async function addChosen() {
    if (guard.busy) return;
    setError(undefined);
    if (!feedback.report(found) || !action) {
      // Two answers missing: the first takes focus, and each says what fixes it.
      if (found.length > 1) feedback.node(found[0]!.field)?.focus();
      return;
    }
    if (!guard.start()) return;
    try {
      // One request for every chosen control: all of them are decided, or none.
      onSaved(
        await save.mutateAsync({
          overlayId: overlay.id,
          expectedRevision: revision(),
          decisions:
            tabled?.decisions ?? chosen.map((controlId) => ({ controlId, action, rationale })),
        }),
      );
      toast.add({
        type: "success",
        title: `${plural(chosen.length, formatNumber)} added to ${overlay.code}`,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setError(
        `${causeText(cause, "The decisions could not be saved.")} Your choice and rationale are kept; adding them again will not duplicate them.`,
      );
      guard.finish();
    }
  }
  const [query] = collection.queries;
  const state =
    query?.isError && query.data === undefined
      ? "error"
      : query?.isPending && query.data === undefined
        ? "loading"
        : query?.isPlaceholderData
          ? "refreshing"
          : "ready";
  const inResult = table.getRowCount();
  const offerRest =
    state === "ready" &&
    !guard.busy &&
    table.getIsAllPageRowsSelected() &&
    inResult > table.getRowModel().rows.length;
  // Once taken, the offer stays where the reader pressed it and says why it has nothing left to do.
  const restChosen =
    wholeResult?.question === question &&
    wholeResult.ids.every((id) => table.state.rowSelection[id]);
  return (
    <PickerSheet
      open
      onClose={() => void guard.close()}
      title="Add decisions"
      subtitle={`${overlay.code} · ${overlay.title}`}
      table={table}
      state={state}
      total={total}
      search={{ placeholder: "Find controls" }}
      filters={
        <>
          <DataTable.Filter table={table} column="family" options={familyOptions} />
          {techniqueOptions.length > 0 && (
            <TechniqueFilter table={table} options={techniqueOptions} />
          )}
        </>
      }
      initialFocus={() => feedback.node("action") ?? true}
      toolbar={
        <Stack space="space.150">
          {/* The decision and, where Table E-1 is loaded, where its rationale comes from: side by
              side while the sheet has the width for both. */}
          <Grid
            gap="space.150"
            templateColumns={supported.size > 0 ? CHOICES_SIDE_BY_SIDE : "minmax(0,1fr)"}
          >
            <ChoiceField
              label="Decision"
              value={action}
              options={decisionChoices}
              onChange={(value) => setAction(value as Action | null)}
              required
              placeholder="Choose a decision"
              description="It applies to every control you choose."
              error={errors.get("action")}
              controlRef={feedback.ref("action")}
            />
            {supported.size > 0 && (
              <Field invalid={errors.has("source") ? true : undefined}>
                <FieldSet>
                  <FieldLegend variant="label">Rationale</FieldLegend>
                  {/* The choice waits on a decision that adds: it keeps its Tab stop and says why. */}
                  {action !== "include" && (
                    <FieldDescription>
                      {action
                        ? "Only a control the overlay adds takes its rationale from Table E-1."
                        : "Choose a decision first."}
                    </FieldDescription>
                  )}
                  <RadioGroup<RationaleSource>
                    value={fromTable ? "table" : "written"}
                    onValueChange={setSource}
                    readOnly={action !== "include"}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value="written" />
                      <FieldLabel>Written once for every decision</FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem ref={feedback.ref("source")} value="table" />
                      <FieldLabel>
                        From Table E-1 of NIST SP 800-160 Vol. 2, each control its own
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                  {errors.has("source") && <FieldError>{errors.get("source")}</FieldError>}
                </FieldSet>
              </Field>
            )}
          </Grid>
          {!fromTable && (
            <TextField
              label="Rationale for every decision"
              description="Why the overlay adds or removes these controls. It is recorded on each one."
              multiline
              rows={2}
              required
              value={rationale}
              onChange={setRationale}
              error={errors.get("rationale")}
              controlRef={feedback.ref("rationale")}
            />
          )}
        </Stack>
      }
      pending={guard.busy}
      error={error}
      secondary={
        offerRest ? (
          <Button
            variant="secondary"
            isLoading={choosingAll}
            disabledReason={restChosen ? "Every control found is already chosen." : undefined}
            onClick={() => void chooseAll()}
          >
            {t("selectAllCount", { count: formatNumber(inResult) })}
          </Button>
        ) : undefined
      }
      action={{
        label: chosen.length > 0 ? `Add ${plural(chosen.length, formatNumber)}` : "Add decisions",
        onClick: () => void addChosen(),
        disabled: chosen.length === 0,
      }}
    >
      {/* One alert for the sheet: a failed read of Table E-1 is said with the candidates', and its
          Retry reloads both. The picker works without the table meanwhile. */}
      <QueryState queries={collection.queries} region>
        <ReportFailures queries={[links, techniques]} />
        <DataTable
          responsive
          table={table}
          state={state === "error" ? "ready" : state}
          empty={{
            illustration: "shield",
            title: "No controls in this catalog edition",
            description: "Reference catalogs are loaded by a workspace administrator.",
          }}
        />
      </QueryState>
      {guard.confirmation}
    </PickerSheet>
  );
}
