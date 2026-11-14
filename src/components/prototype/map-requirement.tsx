import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Button,
  DataTable,
  Grid,
  PickerSheet,
  Stack,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { unmappedObjectives, useProgramControlObjectives } from "@/lib/control-objectives";
import { idSet, useRows } from "@/lib/models";
import { mapsChosenObjectives, mapsObjectives } from "@/lib/product-records";
import { labelFor } from "@/lib/records";
import {
  WHOLE_CONTROL_CHOICE,
  coverageOf,
  coveredObjectives,
  requirementMappingStanding,
  type MappingTarget,
  type ObjectiveNode,
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
import { ObjectiveCoverage, ObjectivesField, type MappingCoverage } from "./objective-choice";
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

type MappingField = "relationship" | "objectives" | "rationale";
const NO_CARRIERS: ReadonlyMap<string, string> = new Map();
const NO_OBJECTIVES: readonly ObjectiveNode[] = [];
const NONE_CHOSEN: readonly string[] = [];

/** What a requirement's latest revision maps of the control: every mapping, and those on each system. */
type HeldMappings = { parts: (string | null)[]; bySystem: Map<string, (string | null)[]> };

/**
 * What a requirement's row says of its standing: why it cannot be chosen; where its mappings cover
 * some of the control's objectives already, how many, since choosing it maps the rest; or where
 * some of its systems carry all of what is chosen already, how many, since choosing it maps the
 * others.
 */
function standingNote(
  standing: RequirementMappingStanding,
  code: string,
  objectives: { mapped: number; total: number },
  chosenObjectives: boolean,
  format: (value: number) => string,
) {
  switch (standing.kind) {
    case "targets":
      if (objectives.mapped > 0 && objectives.mapped < objectives.total)
        return mapsObjectives(format(objectives.mapped), format(objectives.total));
      return standing.mapped > 0
        ? `Mapped on ${standing.mapped} of ${standing.eligible} systems`
        : undefined;
    case "mapped":
      return chosenObjectives ? mapsChosenObjectives : `Maps ${code}`;
    case "no_details":
      return "Details not recorded";
    case "unallocated":
      return "Not allocated";
    case "not_selected":
      return "Not selected on its systems";
  }
}

/**
 * Map a requirement: choose the program's requirements that meet the control, what they meet of it
 * (the whole control, or chosen assessment objectives), one relationship and one rationale for all
 * of them, and map them in one request, so all are mapped or none and mapping again after a failure
 * adds only what is missing. Each mapping is one the requirement's own Map control records: the
 * whole control or one chosen objective, on each system the requirement is allocated to whose
 * control baseline selects the control, so each of their SSPs lists it under the control. A
 * requirement whose mappings cover some of the control's objectives already says how many (Maps 12
 * of 26 objectives), and one mapped on some of those systems already says on how many (Mapped on 1
 * of 2 systems); choosing it maps only what is missing. One that cannot take a mapping (its
 * mappings cover what is chosen on all of them, it has no details, is allocated to no system, or to
 * none that selects the control) is marked with why and cannot be chosen. Opened for the rest of a
 * control mapped in part (`rest`), it starts on the objectives no requirement maps yet.
 */
function MapRequirementPicker({
  programId,
  control,
  rest = false,
  onClose,
  onDone,
  onCreate,
  finalFocus,
}: {
  programId: string;
  control: StepControl;
  /** Start on the control's objectives no requirement of the program maps yet. */
  rest?: boolean | undefined;
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
  // What the requirements meet of the control: the whole control, or chosen objectives, which a
  // step for the rest starts on the objectives no requirement maps yet until the reader chooses.
  const objectives = useProgramControlObjectives(programId, control.id);
  const nodes = objectives.data?.objectives;
  const initialCoverage: MappingCoverage = rest ? "objectives" : "whole";
  const [coverage, setCoverage] = useState<MappingCoverage>(initialCoverage);
  const [picked, setPicked] = useState<string[] | null>(null);
  const unmapped = useMemo(
    () => (objectives.data ? unmappedObjectives(objectives.data.objectives) : []).map((o) => o.id),
    [objectives.data],
  );
  const chosenObjectives = picked ?? (rest ? unmapped : NONE_CHOSEN);
  const choice = useMemo(
    () => (coverage === "whole" ? WHOLE_CONTROL_CHOICE : chosenObjectives),
    [coverage, chosenObjectives],
  );
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
    { columns: ["id", "requirement_revision_id", "system_id", "control_part_id"] },
  );
  // What each revision maps of the control: what it names, and on which system.
  const mapped = useMemo(() => {
    if (!existing.data) return undefined;
    const byRevision = new Map<string, HeldMappings>();
    for (const link of existing.data) {
      const held = byRevision.get(link.requirement_revision_id) ?? {
        parts: [],
        bySystem: new Map<string, (string | null)[]>(),
      };
      held.parts.push(link.control_part_id);
      if (link.system_id)
        held.bySystem.set(link.system_id, [
          ...(held.bySystem.get(link.system_id) ?? []),
          link.control_part_id,
        ]);
      byRevision.set(link.requirement_revision_id, held);
    }
    return byRevision;
  }, [existing.data]);
  // Whether a row's standing can be read yet: until the reads answer, no row can be chosen.
  const standingKnown = !!carriers && !!mapped && !!nodes;
  const standing = useMemo(
    () =>
      (candidate: Candidate): RequirementMappingStanding => {
        const held = mapped?.get(candidate.revisionId ?? "");
        const objectiveNodes = nodes ?? NO_OBJECTIVES;
        const mappedOn = new Map(
          [...(held?.bySystem ?? [])].map(([systemId, parts]) => [
            systemId,
            coverageOf(objectiveNodes, parts),
          ]),
        );
        return requirementMappingStanding(
          candidate,
          carriers ?? NO_CARRIERS,
          mappedOn,
          choice,
          objectiveNodes,
        );
      },
    [carriers, mapped, nodes, choice],
  );
  // How many of the control's objectives a requirement's mappings cover, on any system.
  const objectivesOf = useMemo(
    () => (candidate: Candidate) => {
      const objectiveNodes = nodes ?? NO_OBJECTIVES;
      const parts = mapped?.get(candidate.revisionId ?? "")?.parts ?? [];
      return {
        mapped: parts.length
          ? coveredObjectives(coverageOf(objectiveNodes, parts), objectiveNodes)
          : 0,
        total: objectiveNodes.length,
      };
    },
    [mapped, nodes],
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
          // Why the row cannot be chosen, or how much of the control it maps already, once the
          // systems that can take a mapping, the mappings there and the objectives are known.
          badge: (row) => {
            const note = standingKnown
              ? standingNote(
                  standing(row),
                  control.code,
                  objectivesOf(row),
                  coverage === "objectives" && chosenObjectives.length > 0,
                  formatNumber,
                )
              : undefined;
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
    [standing, standingKnown, control.code, objectivesOf, coverage, chosenObjectives, formatNumber],
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
    dirty:
      chosen.length > 0 ||
      !!rationale.trim() ||
      relationship !== "maps_to" ||
      coverage !== initialCoverage ||
      picked !== null,
    onClose,
    description:
      "The requirements and objectives you chose, the relationship and the rationale will be lost.",
  });
  const issues: FormIssue<MappingField>[] = [
    ...(coverage === "objectives" && chosenObjectives.length === 0
      ? [
          {
            field: "objectives" as const,
            message: `Choose the objectives of ${control.code} the requirements meet, or map the whole control.`,
          },
        ]
      : []),
    ...(rationale.length > RATIONALE_LIMIT
      ? [
          {
            field: "rationale" as const,
            message: "Shorten the rationale to 10,000 characters or fewer.",
          },
        ]
      : []),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  // Each mapping's id is chosen once per requirement, system and objective, so a retry after a lost
  // answer adds only the rest. What an attempt sent for a requirement is sent again with it while
  // the choice holds: a write that landed before its answer was lost has made those mappings
  // recorded since, and the retry finds them. Another choice is another request.
  const mappingIds = useRef(new Map<string, string>());
  const sent = useRef(new Map<string, readonly MappingTarget[]>());
  const sentChoice = useRef<string | null>(null);
  const attempted = useRef(false);
  async function mapChosen() {
    if (guard.busy) return;
    setError(undefined);
    if (!feedback.report(issues)) return;
    const choiceKey = JSON.stringify(choice);
    if (sentChoice.current !== choiceKey) {
      sent.current.clear();
      sentChoice.current = choiceKey;
    }
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
      const byKey = new Map(
        carried.map((target) => [`${target.systemId}/${target.objectiveId ?? "whole"}`, target]),
      );
      if (byKey.size === 0) return [];
      sent.current.set(id, [...byKey.values()]);
      requirementIds.add(id);
      return [...byKey].map(([where, target]) => {
        const key = `${id}/${where}`;
        const mappingId = mappingIds.current.get(key) ?? crypto.randomUUID();
        mappingIds.current.set(key, mappingId);
        return {
          id: mappingId,
          requirementRevisionId: revisionId,
          systemId: target.systemId,
          selectedControlId: target.selectedControlId,
          controlPartId: target.objectiveId,
        };
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
        `${causeText(cause, "The requirements could not be mapped.")} The requirements and objectives you chose, the relationship and the rationale are kept; mapping again will not duplicate them.`,
      );
      guard.finish();
    }
  }
  const [query] = collection.queries;
  // What decides which rows can be chosen: the systems a mapping can name, the mappings there and
  // the control's objectives they cover.
  const eligibility = [systems, baselines, selections, existing, objectives];
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
        <Stack space="space.150">
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
            {/* What every chosen requirement meets: a control with no objective has none to choose. */}
            <ObjectiveCoverage
              coverage={coverage}
              onCoverage={setCoverage}
              readOnly={nodes?.length === 0}
              description={
                nodes?.length === 0
                  ? `${control.code} has no assessment objectives: a mapping covers the whole control.`
                  : undefined
              }
            />
          </Grid>
          {coverage === "objectives" && (
            <ObjectivesField
              multiple
              controlId={control.id}
              objectives={nodes}
              loading={objectives.isPending}
              value={chosenObjectives}
              onChange={setPicked}
              description="Each requirement records one mapping an objective, beside what it maps already."
              error={errors.get("objectives")}
              controlRef={feedback.ref("objectives")}
            />
          )}
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
        </Stack>
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
  rest = false,
}: StepSurfaceProps & {
  /** Opened for the rest of a control mapped in part: the picker starts on what is left. */
  rest?: boolean | undefined;
}) {
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
      rest={rest}
      finalFocus={backToStep}
      onClose={onClose}
      onDone={() => focusWhereStepWas(opener, slot)}
      onCreate={() => setCreating(true)}
    />
  );
}
