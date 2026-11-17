// The program control record's Assessment tab (the pass-six board control-inherited.html; Josef's
// decisions of 2026-11-14 and 15, "Unit · The component version is assessed once"). What holds for
// this panel alone:
//
// Objectives lists every assessment objective the control counts, in the catalog's reading order,
// with its determination and whose it is: the program's assessors, or the library component the
// element it stands on is built from ("Audit Log Collector 1"), read from
// `program_control_objective_judgments` (`useControlJudgments` in src/lib/control-record). An
// objective nobody has judged reads Not assessed. Where it stands is one row a requirement that
// maps the control and an element its mappings name: how many of the control's objectives those
// mappings cover there, the element, and the library components the element is built from. Then
// the program's evidence behind the control, from its trace. Each is a compact collection in the
// order its rows mean, with no search or sort; a section with nothing in it is not drawn, and a
// control that counts no objective says so in its Objectives.

import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Section,
  Stack,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { ClipboardCheck, FileCheck, ListChecks } from "lucide-react";
import { StatusBadge } from "@/components/app/status";
import type { AssuranceTrace, TraceEvidence } from "@/lib/assurance-trace";
import { useProgramControlObjectives } from "@/lib/control-objectives";
import {
  objectiveLines,
  standingLines,
  useControlJudgments,
  type BuiltFrom,
  type ObjectiveLine,
  type StandingLine,
  type StandingMapping,
} from "@/lib/control-record";
import { idSet, useRows } from "@/lib/models";
import { controlDeterminers, determinations, evidenceReviewDecisions } from "@/lib/status";
import { ObjectiveCount } from "./control-status";
import { controlProseText, useControlPlaceholders } from "./library-controls";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { ReportFailures, type QueryStatus } from "./work-common";

/** A library component in the words a row says it: its name and the version taken. */
export const builtFromName = (component: BuiltFrom) =>
  component.version === null ? component.name : `${component.name} ${component.version}`;

/** An element of the program as a row names it. */
type Element = { id: string; code: string; name: string };

/**
 * Where a control's mappings stand in a program, at its requirements' latest revisions, and what
 * the elements they name are built from: the library components on each (a system component that
 * names the element, or one on the system itself that names none), with their version. Read for
 * the requirements the control's trace says map it.
 */
export function useControlPlacement(
  controlId: string,
  requirementIds: readonly string[] | undefined,
) {
  const requirements = idSet(requirementIds);
  const revisions = useRows(
    "requirement_revisions",
    { engineering_requirement_id: requirements },
    {
      columns: ["id", "engineering_requirement_id", "version_number"],
      enabled: requirements.length > 0,
    },
  );
  // Each requirement's latest revision: its mappings are the ones that count.
  const latest = useMemo(() => {
    const byRequirement = new Map<string, { id: string; version: number }>();
    for (const revision of revisions.data ?? []) {
      const held = byRequirement.get(revision.engineering_requirement_id);
      if (!held || revision.version_number > held.version)
        byRequirement.set(revision.engineering_requirement_id, {
          id: revision.id,
          version: revision.version_number,
        });
    }
    return byRequirement;
  }, [revisions.data]);
  const revisionIds = idSet([...latest.values()].map((revision) => revision.id));
  const links = useRows(
    "requirement_control_links",
    { control_id: controlId, requirement_revision_id: revisionIds },
    {
      columns: ["id", "requirement_revision_id", "system_id", "control_part_id"],
      enabled: revisionIds.length > 0,
    },
  );
  const mappings = useMemo<StandingMapping[]>(() => {
    const requirementOf = new Map(
      [...latest].map(([requirementId, revision]) => [revision.id, requirementId]),
    );
    return (links.data ?? []).flatMap((link) => {
      const requirementId = requirementOf.get(link.requirement_revision_id);
      return requirementId
        ? [{ requirementId, systemId: link.system_id, partId: link.control_part_id }]
        : [];
    });
  }, [links.data, latest]);
  const elementIds = idSet(mappings.map((mapping) => mapping.systemId));
  const systems = useRows(
    "systems",
    { id: elementIds },
    { columns: ["id", "code", "name"], enabled: elementIds.length > 0 },
  );
  const list = elementIds.join(",");
  const components = useRows(
    "system_components",
    { or: `system_element_id.in.(${list}),system_id.in.(${list})` },
    {
      columns: ["id", "system_id", "system_element_id", "defined_component_id"],
      enabled: elementIds.length > 0,
    },
  );
  const definedIds = idSet(components.data?.map((component) => component.defined_component_id));
  const defined = useRows(
    "defined_components",
    { id: definedIds },
    {
      columns: ["id", "name", "component_definition_revision_id"],
      enabled: definedIds.length > 0,
    },
  );
  const setIds = idSet(
    defined.data?.map((component) => component.component_definition_revision_id),
  );
  const sets = useRows(
    "component_definition_revisions",
    { id: setIds },
    { columns: ["id", "version_number"], enabled: setIds.length > 0 },
  );
  const elements = useMemo(
    () => new Map<string, Element>((systems.data ?? []).map((system) => [system.id, system])),
    [systems.data],
  );
  // The library components on each element: one that names the element sits on it; one that names
  // none sits on its system.
  const builtFrom = useMemo(() => {
    const version = new Map((sets.data ?? []).map((set) => [set.id, set.version_number]));
    const library = new Map(
      (defined.data ?? []).map((component) => [
        component.id,
        {
          id: component.id,
          name: component.name,
          version: version.get(component.component_definition_revision_id) ?? null,
        } satisfies BuiltFrom,
      ]),
    );
    const onElements = new Set(list.split(","));
    const byElement = new Map<string, BuiltFrom[]>();
    for (const component of components.data ?? []) {
      const on = component.system_element_id ?? component.system_id;
      const from = component.defined_component_id
        ? library.get(component.defined_component_id)
        : undefined;
      if (!from || !onElements.has(on)) continue;
      const held = byElement.get(on) ?? [];
      if (!held.some((known) => known.id === from.id)) held.push(from);
      byElement.set(on, held);
    }
    return byElement;
  }, [components.data, defined.data, sets.data, list]);
  const queries: QueryStatus[] = [revisions, links, systems, components, defined, sets];
  const ready =
    (requirements.length === 0 || revisions.isSuccess) &&
    (revisionIds.length === 0 || links.isSuccess) &&
    (elementIds.length === 0 || (systems.isSuccess && components.isSuccess)) &&
    (definedIds.length === 0 || defined.isSuccess) &&
    (setIds.length === 0 || sets.isSuccess);
  return { mappings, elements, builtFrom, queries, ready };
}

export type ControlPlacement = ReturnType<typeof useControlPlacement>;

/**
 * The objectives' columns: the objective, its text, and, once anything is judged, its
 * determination and whose it is. Before then the two would say nothing on every row.
 */
const objectiveColumns = (components: string | null, judged: boolean) =>
  defineColumns<ObjectiveLine>((c) => [
    c.text("label", {
      header: "Objective",
      width: 140,
      priority: 0,
      hideable: false,
      sortable: false,
      cell: (row) => row.label ?? <Absent label="No label" />,
    }),
    c.text("prose", { header: "Determine if", minWidth: 280, priority: 2, sortable: false }),
    ...(judged
      ? [
          c.status("determination", {
            header: "Determination",
            width: 180,
            priority: 1,
            sortable: false,
            statuses: determinations,
            cell: (row) => (
              <StatusBadge
                statuses={determinations}
                value={row.determination}
                size="xsmall"
                absentLabel="Not assessed"
              />
            ),
          }),
          c.text("by", {
            header: "Determined by",
            width: 200,
            priority: 3,
            sortable: false,
            cell: (row) =>
              row.by === "program" ? (
                controlDeterminers.program.label
              ) : row.by === "inherited" ? (
                (components ?? <Absent label="A library component" />)
              ) : (
                <Absent label="Not determined" />
              ),
          }),
        ]
      : []),
  ]);

/**
 * The control's objectives with what decided each, in the catalog's reading order. `components`
 * names the library components an inherited judgment comes from ("Audit Log Collector 1").
 */
function Objectives({
  programId,
  controlId,
  components,
}: {
  programId: string;
  controlId: string;
  components: string | null;
}) {
  const objectives = useProgramControlObjectives(programId, controlId);
  const judgments = useControlJudgments(programId, controlId);
  // Each objective's text with the catalog's placeholders where it inserts a parameter.
  const placeholders = useControlPlaceholders(
    useMemo(() => ({ controlIds: [controlId] }), [controlId]),
  );
  const rows = useMemo(
    () =>
      objectives.data && judgments.data
        ? objectiveLines(objectives.data.objectives, judgments.data).map((line) => ({
            ...line,
            prose: line.prose ? controlProseText(line.prose, controlId, placeholders) : null,
          }))
        : [],
    [objectives.data, judgments.data, controlId, placeholders],
  );
  const judged = rows.some((row) => row.determination !== null);
  const columns = useMemo(() => objectiveColumns(components, judged), [components, judged]);
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.label ?? "Objective",
    label: "Assessment objectives",
    pageSize: 25,
    pinnable: false,
    hideable: false,
  });
  const loaded = objectives.isSuccess && judgments.isSuccess;
  return (
    <Section title="Objectives" count={loaded ? rows.length : undefined} countMax={9999}>
      <ProductCollection
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        table={table}
        queries={[objectives, judgments]}
        empty={{
          title: "No assessment objectives",
          description: "The catalog gives this control none.",
          icon: <ListChecks />,
        }}
      />
    </Section>
  );
}

type PlacementRow = StandingLine & {
  id: string;
  requirement: { id: string; code: string; title: string; programId: string } | null;
  element: Element | null;
  builtFromWords: string;
};

const placementColumns = (programId: string) =>
  defineColumns<PlacementRow>((c) => [
    c.text("requirementId", {
      header: "Requirement",
      minWidth: 220,
      priority: 0,
      hideable: false,
      sortable: false,
      cell: (row) =>
        row.requirement ? (
          <RecordLink
            table="engineering_requirements"
            record={{ id: row.requirement.id, program_id: row.requirement.programId }}
          >
            {`${row.requirement.code} ${row.requirement.title}`}
          </RecordLink>
        ) : (
          <Absent label="Not available" />
        ),
    }),
    c.number("covered", {
      header: "Objectives",
      width: 120,
      priority: 1,
      sortable: false,
      cell: (row) => <ObjectiveCount count={row.covered} objectives={row.objectives} />,
    }),
    c.text("systemId", {
      header: "Element",
      width: 260,
      priority: 2,
      sortable: false,
      cell: (row) =>
        row.element ? (
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={{ programId, scopeId: row.element.id }}
              />
            }
          >
            {`${row.element.code} ${row.element.name}`}
          </TextLink>
        ) : (
          <Absent label="Every system" />
        ),
    }),
    c.text("builtFromWords", {
      header: "Built from",
      width: 220,
      priority: 3,
      sortable: false,
      cell: (row) =>
        row.builtFrom.length ? (
          <Stack space="space.025" alignInline="start">
            {row.builtFrom.map((component) => (
              <TextLink
                key={component.id}
                render={
                  <Link
                    to="/library/components/$componentId"
                    params={{ componentId: component.id }}
                    search={{ tab: "Assessment" }}
                  />
                }
              >
                {builtFromName(component)}
              </TextLink>
            ))}
          </Stack>
        ) : (
          <Absent label="No library component" />
        ),
    }),
  ]);

/** Where each requirement that maps the control stands: what it covers, on which element, built from what. */
function WhereItStands({
  programId,
  controlId,
  trace,
  placement,
}: {
  programId: string;
  controlId: string;
  trace: AssuranceTrace | undefined;
  placement: ControlPlacement;
}) {
  const objectives = useProgramControlObjectives(programId, controlId);
  const requirements = trace?.requirements;
  const rows = useMemo<PlacementRow[]>(() => {
    if (!requirements || !objectives.data || !placement.ready) return [];
    const byId = new Map(requirements.map((requirement) => [requirement.id, requirement]));
    return standingLines({
      requirementIds: requirements.map((requirement) => requirement.id),
      mappings: placement.mappings,
      objectives: objectives.data.objectives,
      builtFrom: placement.builtFrom,
      elementOrder: (id) => (id ? (placement.elements.get(id)?.code ?? id) : ""),
    }).map((line) => {
      const requirement = byId.get(line.requirementId);
      return {
        ...line,
        id: line.key,
        requirement: requirement
          ? {
              id: requirement.id,
              code: requirement.code,
              title: requirement.title,
              programId: requirement.program_id,
            }
          : null,
        element: line.systemId ? (placement.elements.get(line.systemId) ?? null) : null,
        builtFromWords: line.builtFrom.map(builtFromName).join(", "),
      };
    });
  }, [requirements, objectives.data, placement]);
  const columns = useMemo(() => placementColumns(programId), [programId]);
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.requirement?.code ?? "Requirement",
    label: "Where it stands",
    pageSize: 25,
    pinnable: false,
    hideable: false,
  });
  // A control no requirement maps has nothing standing anywhere: its Requirements tab says so.
  if (requirements && requirements.length === 0) return null;
  return (
    <Section title="Where it stands">
      <ProductCollection
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        table={table}
        queries={[objectives, ...placement.queries]}
        empty={{ title: "No mapping recorded", icon: <ClipboardCheck /> }}
      />
    </Section>
  );
}

const evidenceColumns = defineColumns<TraceEvidence>((c) => [
  c.text("title", {
    header: "Evidence",
    minWidth: 240,
    priority: 0,
    hideable: false,
    sortable: false,
    cell: (row) => (
      <RecordLink table="evidence_artifacts" record={{ id: row.id }}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("review", {
    header: "Review",
    width: 160,
    priority: 1,
    sortable: false,
    statuses: evidenceReviewDecisions,
  }),
  c.date("collected_at", { header: "Collected", priority: 2, sortable: false }),
]);

/** The program's evidence behind the control, as its trace reads it. */
function ProgramEvidence({
  trace,
  programCode,
}: {
  trace: UseQueryResult<AssuranceTrace, Error>;
  programCode: string;
}) {
  const open = useOpenRecord();
  const rows = trace.data?.evidence ?? [];
  const table = useDataTable({
    columns: evidenceColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: `Evidence in ${programCode}`,
    pageSize: 25,
    pinnable: false,
    hideable: false,
  });
  if (trace.data && rows.length === 0) return null;
  return (
    <Section
      title={`Evidence in ${programCode}`}
      count={trace.data ? rows.length : undefined}
      countMax={9999}
    >
      <ProductCollection
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        table={table}
        queries={[trace]}
        onRowClick={(row) => open("evidence_artifacts", { id: row.id })}
        empty={{ title: "No evidence cited", icon: <FileCheck /> }}
      />
    </Section>
  );
}

/**
 * The control's assessment in the program: each objective with what decided it, where the
 * requirements that map it stand, and the program's evidence behind it.
 */
export function ControlAssessmentPanel({
  programId,
  programCode,
  controlId,
  trace,
  placement,
  components,
}: {
  programId: string;
  programCode: string;
  controlId: string;
  trace: UseQueryResult<AssuranceTrace, Error>;
  placement: ControlPlacement;
  /** The library components an inherited judgment comes from, in words; none where none is. */
  components: string | null;
}) {
  return (
    <Stack space="space.300" className="min-w-0">
      <ReportFailures queries={placement.queries} />
      <Objectives programId={programId} controlId={controlId} components={components} />
      <WhereItStands
        programId={programId}
        controlId={controlId}
        trace={trace.data}
        placement={placement}
      />
      <ProgramEvidence trace={trace} programCode={programCode} />
    </Stack>
  );
}
