import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Button,
  DataTable,
  Grid,
  PickerSheet,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { idSet, useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import {
  requirementMappingStanding,
  type MappingCarrier,
  type RequirementMappingStanding,
} from "@/lib/requirement-control-mappings";
import {
  mappingRelationships,
  useMapRequirementsToControl,
  type MappingRelationship,
} from "@/lib/requirement-links";
import { programRequirementScope } from "@/lib/requirement-reads";
import {
  serverRead,
  useServerCounts,
  useServerResult,
  type ServerResultQuestion,
  type ServerRow,
} from "@/lib/server-table";
import { useServerCollection } from "./collection-question";
import { ProductRecordDialog } from "./product-record-dialog";
import { focusWhereStepWas } from "./step-focus";
import { QueryState } from "./work-common";

/** The control a step done on its own record works on: the page's control. */
export type StepControl = { id: string; code: string; title: string };

type CandidateRow = ServerRow<
  "program_requirement_rows",
  "id" | "code" | "revision_id" | "title" | "statement" | "allocation" | "allocations",
  "code" | "allocation" | "allocations"
>;

/** A requirement as the picker offers it: its latest revision and what it is allocated to. */
type Candidate = {
  id: string;
  code: string;
  /** Its latest revision, which a mapping is recorded on; none while no details are recorded. */
  revisionId: string | null;
  name: string;
  statement: string | null;
  allocation: string;
  /** Everything it is allocated to, by name, as the register lists it. */
  allocations: { id: string; name: string }[];
  /** The systems among them, which a mapping can name. */
  systemIds: string[];
};

/** A JSON list's objects, whatever else it holds. */
const objects = (value: unknown) =>
  (Array.isArray(value) ? value : []).filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object" && !Array.isArray(item),
  );

function candidateOf(row: CandidateRow): Candidate {
  const allocations = objects(row.allocations);
  return {
    id: row.id,
    code: row.code,
    revisionId: row.revision_id,
    name: row.title ?? row.code,
    statement: row.statement,
    allocation: row.allocation,
    allocations: allocations.map((item) => ({
      id: String(item["id"]),
      name: typeof item["name"] === "string" ? item["name"] : "Target unavailable",
    })),
    systemIds: allocations.flatMap((item) =>
      typeof item["system_id"] === "string" ? [item["system_id"]] : [],
    ),
  };
}
const candidates = (page: CandidateRow[]) => page.map(candidateOf);

/**
 * The program's requirements, a page at a time from the server, in code order: the register the
 * program's Requirements tab reads, flat. Each row says what it is allocated to, which decides the
 * system a mapping can name.
 */
const candidateRead = (programId: string) =>
  serverRead({
    source: "program_requirement_rows",
    model: "engineering_requirements",
    models: ["requirement_revisions", "requirement_allocations", "requirement_control_links"],
    columns: ["id", "code", "revision_id", "title", "statement", "allocation", "allocations"],
    scope: { program_id: programId },
    search: ["code", "title", "statement", "allocated_to"],
    fields: {
      code: { sort: "code_order", filter: false },
      name: { column: "title", filter: false },
      statement: { filter: false },
      allocatedTo: { column: "allocated_to", filter: false },
      allocation: { column: "allocation" },
    },
    order: [{ column: "code_order" }],
  });

/** The states the Allocation filter offers: the server's rows are one page, so theirs are not all. */
const allocationOptions = ["Allocated", "Unallocated", "Details not recorded"].map((value) => ({
  value,
}));
/** Every allocated requirement of the program: how many there are to choose from. */
const ALLOCATED: readonly ServerResultQuestion[] = [
  { filters: [{ id: "allocation", value: ["Allocated"] }] },
];

const REQUIREMENTS = { one: "{count} requirement", other: "{count} requirements" };
/** The most a mapping's rationale may hold, as the requirement's own Map control takes it. */
const RATIONALE_LIMIT = 10000;
/** The relationship beside the rationale, from the window width the sheet stops filling. */
const CHOICES_SIDE_BY_SIDE = { base: "minmax(0,1fr)", md: "minmax(0,1fr) minmax(0,2fr)" };
const relationshipOptions = mappingRelationships.map((value) => ({
  value,
  label: labelFor(value),
}));

type MappingField = "relationship" | "rationale";
const NO_CARRIERS: ReadonlyMap<string, string> = new Map();
const NO_SYSTEMS: ReadonlySet<string> = new Set();

/**
 * What a requirement's row says of its standing: why it cannot be chosen, or, where some of its
 * systems carry a mapping of the control already, how many, since choosing it maps the rest.
 */
function standingNote(standing: RequirementMappingStanding, code: string) {
  switch (standing.kind) {
    case "targets":
      return standing.mapped > 0
        ? `Mapped on ${standing.mapped} of ${standing.eligible} systems`
        : undefined;
    case "mapped":
      return `Maps ${code}`;
    case "no_details":
      return "Details not recorded";
    case "unallocated":
      return "Not allocated";
    case "not_selected":
      return "Not selected on its systems";
  }
}

/**
 * Map a requirement: choose the program's requirements that meet the control, one relationship
 * and one rationale for all of them, and map them in one request, so all are mapped or none and
 * mapping again after a failure adds only what is missing. Each mapping is the one the
 * requirement's own Map control records: the whole control, on each system the requirement
 * is allocated to whose control baseline selects the control, so each of their SSPs lists it under
 * the control. A requirement mapped on some of those systems already is mapped on the rest, and its
 * row says on how many it is (Mapped on 1 of 2 systems). One that cannot take a mapping (it maps
 * the control on all of them, has no details, is allocated to no system, or to none that selects
 * the control) is marked with why and cannot be chosen.
 */
function MapRequirementPicker({
  programId,
  control,
  onClose,
  onDone,
  onCreate,
  finalFocus,
}: {
  programId: string;
  control: StepControl;
  onClose: () => void;
  /** The requirements were mapped: focus follows the step to what replaced it. */
  onDone: () => void;
  /** The program holds no requirement and the reader creates the first one instead. */
  onCreate: () => void;
  finalFocus: () => HTMLElement | boolean;
}) {
  const { t, formatNumber, formatPlural } = useLedgerLocale();
  const map = useMapRequirementsToControl();
  const feedback = useFormFeedback<MappingField>();
  const [relationship, setRelationship] = useState<MappingRelationship>("maps_to");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string>();
  // The systems a mapping can name: each of the program's systems whose control baseline selects
  // the control, by the selection it records.
  const systems = useRows("systems", { program_id: programId }, { columns: ["id"] });
  const systemIds = useMemo(() => idSet(systems.data?.map((system) => system.id)), [systems.data]);
  const baselines = useRows(
    "system_effective_baselines",
    { system_id: systemIds },
    { columns: ["system_id", "profile_resolution_id"], enabled: systems.isSuccess },
  );
  const resolutionIds = useMemo(
    () => idSet(baselines.data?.map((baseline) => baseline.profile_resolution_id)),
    [baselines.data],
  );
  const selections = useRows(
    "selected_controls",
    { control_id: control.id, profile_resolution_id: resolutionIds },
    { columns: ["id", "profile_resolution_id"], enabled: baselines.isSuccess },
  );
  const carriers = useMemo(() => {
    if (!baselines.data || !selections.data) return undefined;
    const byResolution = new Map(selections.data.map((row) => [row.profile_resolution_id, row.id]));
    return new Map(
      baselines.data.flatMap((baseline) => {
        const selected = baseline.profile_resolution_id
          ? byResolution.get(baseline.profile_resolution_id)
          : undefined;
        return baseline.system_id && selected ? [[baseline.system_id, selected] as const] : [];
      }),
    );
  }, [baselines.data, selections.data]);
  // Where the program's requirements map the control already, by revision and system: the few
  // mappings of one control in one program, read scoped on the server.
  const existing = useRows(
    "requirement_control_links",
    { control_id: control.id, ...programRequirementScope(programId, "requirement_control_links") },
    { columns: ["id", "requirement_revision_id", "system_id"] },
  );
  const mapped = useMemo(() => {
    if (!existing.data) return undefined;
    const bySystem = new Map<string, Set<string>>();
    for (const link of existing.data) {
      if (!link.system_id) continue;
      const systems = bySystem.get(link.requirement_revision_id) ?? new Set<string>();
      systems.add(link.system_id);
      bySystem.set(link.requirement_revision_id, systems);
    }
    return bySystem;
  }, [existing.data]);
  // Whether a row's standing can be read yet: until both reads answer, no row can be chosen.
  const standingKnown = !!carriers && !!mapped;
  const standing = useMemo(
    () =>
      (candidate: Candidate): RequirementMappingStanding =>
        requirementMappingStanding(
          candidate,
          carriers ?? NO_CARRIERS,
          mapped?.get(candidate.revisionId ?? "") ?? NO_SYSTEMS,
        ),
    [carriers, mapped],
  );
  const columns = useMemo(
    () =>
      defineColumns<Candidate>((c) => [
        c.id("code", { header: "Requirement", width: 130, priority: 1, hideable: false }),
        c.text("name", {
          header: "Requirement name",
          priority: 0,
          minWidth: 200,
          hideable: false,
          // Why the row cannot be chosen, or on how many of its systems it is mapped already,
          // once the systems that can take a mapping and the mappings there are known.
          badge: (row) => {
            const note = standingKnown ? standingNote(standing(row), control.code) : undefined;
            return note ? (
              <Badge size="xsmall" variant="secondary" tone="neutral">
                {note}
              </Badge>
            ) : null;
          },
        }),
        c.text("statement", {
          header: "Statement",
          minWidth: 220,
          priority: 2,
          cell: (row) => row.statement ?? <Absent label="Details not recorded" />,
        }),
        c.list("allocatedTo", {
          header: "Allocated to",
          width: 220,
          priority: 3,
          items: (row) => row.allocations.map((item) => ({ key: item.id, label: item.name })),
        }),
        // Never drawn: it holds the Allocation filter.
        c.text("allocation", { header: "Allocation", width: 140 }),
      ]),
    [standing, standingKnown, control.code],
  );
  const read = useMemo(() => candidateRead(programId), [programId]);
  // The picker's question ends with the task: it stays out of the address.
  const collection = useServerCollection<Candidate, CandidateRow>(read, {
    keepQuestion: false,
    columns,
    rows: candidates,
    getRowId: (row) => row.id,
    selectable: (row) => standingKnown && standing(row).kind === "targets",
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Requirements to map",
    pageSize: 50,
    initialState: { columnVisibility: { allocation: false } },
  });
  const { table } = collection;
  // Every requirement the picker has shown or read, by id: a chosen one on another page is still
  // mapped by its revision and its systems.
  const known = useRef(new Map<string, Candidate>());
  for (const row of table.getRowModel().rows) known.current.set(row.id, row.original);
  const chosen = Object.keys(table.state.rowSelection).filter((id) => table.state.rowSelection[id]);
  // What there is to choose from: the program's allocated requirements. One its systems all map the
  // control on already is among them, marked; the step offers the picker while none maps it.
  const [total] = useServerCounts(read, ALLOCATED);
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
      const rows = (
        (await readResult({
          search: String(table.state.globalFilter ?? ""),
          filters: table.state.columnFilters,
        })) as CandidateRow[]
      ).map(candidateOf);
      for (const row of rows) known.current.set(row.id, row);
      const ids = rows.filter((row) => standing(row).kind === "targets").map((row) => row.id);
      table.setRowSelection((current) => ({
        ...current,
        ...Object.fromEntries(ids.map((id) => [id, true])),
      }));
      setWholeResult({ question, ids });
    } catch (cause) {
      setError(
        `${causeText(cause, "The requirements could not be read.")} The requirements on this page stay chosen; select all again.`,
      );
    } finally {
      setChoosingAll(false);
    }
  }
  const guard = useDraftGuard({
    dirty: chosen.length > 0 || !!rationale.trim() || relationship !== "maps_to",
    onClose,
    description: "The requirements you chose, the relationship and the rationale will be lost.",
  });
  const issues: FormIssue<MappingField>[] =
    rationale.length > RATIONALE_LIMIT
      ? [{ field: "rationale", message: "Shorten the rationale to 10,000 characters or fewer." }]
      : [];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  // Each mapping's id is chosen once per requirement and system, so a retry after a lost answer
  // adds only the rest. What an attempt sent for a requirement is sent again with it: a write that
  // landed before its answer was lost has made those systems mapped since, and the retry finds them.
  const mappingIds = useRef(new Map<string, string>());
  const sent = useRef(new Map<string, readonly MappingCarrier[]>());
  const attempted = useRef(false);
  async function mapChosen() {
    if (guard.busy) return;
    setError(undefined);
    if (!feedback.report(issues)) return;
    const requirementIds = new Set<string>();
    const targets = chosen.flatMap((id) => {
      const candidate = known.current.get(id);
      if (!candidate?.revisionId) return [];
      const revisionId = candidate.revisionId;
      const now = standing(candidate);
      const carried = [
        ...(sent.current.get(id) ?? []),
        ...(now.kind === "targets" ? now.targets : []),
      ];
      const bySystem = new Map(carried.map((carrier) => [carrier.systemId, carrier]));
      if (bySystem.size === 0) return [];
      sent.current.set(id, [...bySystem.values()]);
      requirementIds.add(id);
      return [...bySystem.values()].map((carrier) => {
        const key = `${id}/${carrier.systemId}`;
        const mappingId = mappingIds.current.get(key) ?? crypto.randomUUID();
        mappingIds.current.set(key, mappingId);
        return { id: mappingId, requirementRevisionId: revisionId, ...carrier };
      });
    });
    if (targets.length === 0 || !guard.start()) return;
    const retry = attempted.current;
    attempted.current = true;
    try {
      // One request for every chosen requirement on each of its systems: all are mapped, or none.
      await map.mutateAsync({
        controlId: control.id,
        relationship,
        rationale: rationale.trim() || null,
        targets,
        retry,
      });
      toast.add({
        type: "success",
        title: `${formatPlural(requirementIds.size, REQUIREMENTS)} mapped to ${control.code}`,
      });
      guard.finish();
      guard.complete();
      onDone();
    } catch (cause) {
      // One write: a refusal mapped none of them, and a retry after a lost answer adds only the rest.
      setError(
        `${causeText(cause, "The requirements could not be mapped.")} Your choice, relationship and rationale are kept; mapping again will not duplicate them.`,
      );
      guard.finish();
    }
  }
  const [query] = collection.queries;
  // What decides which rows can be chosen: the systems a mapping can name, and the mappings there.
  const eligibility = [systems, baselines, selections, existing];
  const state =
    (query?.isError && query.data === undefined) ||
    eligibility.some((each) => each.isError && each.data === undefined)
      ? "error"
      : (query?.isPending && query.data === undefined) || eligibility.some((each) => !each.data)
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
      title="Map a requirement"
      subtitle={`${control.code} · ${control.title}`}
      width="xlarge"
      table={table}
      state={state}
      total={total}
      search={{ placeholder: "Find requirements" }}
      filters={<DataTable.Filter table={table} column="allocation" options={allocationOptions} />}
      toolbar={
        <Grid gap="space.150" templateColumns={CHOICES_SIDE_BY_SIDE}>
          <ChoiceField
            label="Relationship"
            value={relationship}
            options={relationshipOptions}
            onChange={(value) => {
              const offered = mappingRelationships.find((item) => item === value);
              if (offered) setRelationship(offered);
            }}
            required
            description="It applies to every requirement you choose."
            error={errors.get("relationship")}
            controlRef={feedback.ref("relationship")}
          />
          <TextField
            label="Rationale for every mapping"
            description={`Why these requirements meet ${control.code}. It is recorded on each mapping.`}
            multiline
            rows={2}
            value={rationale}
            onChange={setRationale}
            characterLimit={RATIONALE_LIMIT}
            error={errors.get("rationale")}
            controlRef={feedback.ref("rationale")}
          />
        </Grid>
      }
      finalFocus={finalFocus}
      pending={guard.busy}
      error={error}
      secondary={
        offerRest ? (
          <Button
            variant="secondary"
            isLoading={choosingAll}
            disabledReason={restChosen ? "Every requirement found is already chosen." : undefined}
            onClick={() => void chooseAll()}
          >
            {t("selectAllCount", { count: formatNumber(inResult) })}
          </Button>
        ) : undefined
      }
      action={{
        label:
          chosen.length > 0
            ? `Map ${formatPlural(chosen.length, REQUIREMENTS)} to ${control.code}`
            : "Map a requirement",
        onClick: () => void mapChosen(),
        disabled: chosen.length === 0,
      }}
    >
      {/* One alert for the sheet: a failed page and a failed read of the systems say it together. */}
      <QueryState queries={[...collection.queries, ...eligibility]} region>
        <DataTable
          responsive
          table={table}
          state={state === "error" ? "ready" : state}
          empty={{
            illustration: "shield",
            title: "No requirements yet",
            description: `${control.code} is met by the program's engineering requirements. Create the first one, then map it here.`,
            action: (
              <Button size="small" variant="primary" onClick={onCreate}>
                Create engineering requirement
              </Button>
            ),
          }}
        />
      </QueryState>
      {guard.confirmation}
    </PickerSheet>
  );
}

/**
 * What a step done on the control opens, and where focus goes back to: the step that opened it,
 * and the row it sits in, where focus follows the change once the step has left.
 */
export type StepSurfaceProps = {
  programId: string;
  control: StepControl;
  opener: HTMLElement | null;
  slot: HTMLElement | null;
  onClose: () => void;
};

/**
 * Map a requirement, opened from the control's step: the picker of the program's requirements over
 * the page. Where the program holds none, the picker's empty state creates the first one in its
 * place, and the new requirement's page opens once it is saved, where its details and allocation
 * are recorded. It is held by the Details or the trace, not the step, so it stays open while the
 * step changes under it: a write whose answer was lost still moves the control on.
 */
export function MapRequirementSurface({
  programId,
  control,
  opener,
  slot,
  onClose,
}: StepSurfaceProps) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const backToStep = () => (opener?.isConnected ? opener : true);
  return creating ? (
    <ProductRecordDialog
      table="engineering_requirements"
      initialValues={{ program_id: programId }}
      finalFocus={backToStep}
      onClose={onClose}
      onSaved={(row) =>
        void navigate({
          to: "/programs/$programId/requirements/$requirementId",
          params: { programId, requirementId: row.id },
        })
      }
    />
  ) : (
    <MapRequirementPicker
      programId={programId}
      control={control}
      finalFocus={backToStep}
      onClose={onClose}
      onDone={() => focusWhereStepWas(opener, slot)}
      onCreate={() => setCreating(true)}
    />
  );
}
