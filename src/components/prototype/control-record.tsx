// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A control has two records. The catalog's, `/catalog/controls/:id`, trailed Frameworks › Controls,
// is its text as the catalog prints it, then where each program of the workspace stands on it (one
// row a program: Objectives mapped, Objectives with evidence and Objectives assessed, each 12 of 26
// as the program's control status counts them, then requirements, with evidence, open issues, open
// risks; the objectives are one read for every row, `control_objective_counts` through
// `useControlObjectiveCounts` in control-objectives, and the table waits on it), its enhancements,
// and its assessment objectives, parameters and links in collapsed Sections. A control's name
// opens the program's record wherever it is read inside a program (`program_id` on what
// `RecordLink` is given) and the catalog's elsewhere.
//
// The program's, `/programs/:id/controls/:id?tab=…` (wave 10, the pass-six boards impl-control.html
// and control-inherited.html, with control.html for the climb), trailed the program's code ›
// Controls. Its address names the catalog control, or a control the program implemented by its
// implementation, which the route resolves to the control first. The header is the control's code
// and title, its implementation claim and its control status beside them; a facts line (Baseline,
// the layer that put the control in the baseline; a parameter the baseline sets no value for, Not
// set; Determined by, once decided) or, for a control whose objectives its elements' library
// components decide, Determined by the component, Inherited on the elements, and Objectives N of N
// inherited; "46 of 235" with previous and next beside the trail, through the Controls register as
// this tab's session last asked it (the Control status List, `program-control-status`: its search,
// filters and sort over the same read), drawn only where its result holds the control; and
// `PageHeader.Slot` holding the control's one next step in the slot's words (`controlSlot` in
// src/lib/control-record, over `controlNextStep`): Add evidence, which opens ControlAddEvidence;
// Map a requirement, Allocate to a system, Add to assessment campaign and Plan an assessment, done
// on the control over the page (`StepSurfaceHost`, `useOpenStep`); a link for a step done
// elsewhere; Open component assessment for a control its components decide. A viewer has no step
// done on the control: the slot holds Open catalog control alone. The boards' responsible role,
// Remind and a reviewer waited on are not drawn: the data records none of them.
//
// Under the header the strip (`Trace.Rail`, `controlStrip`): Controls › Requirements › Evidence ›
// Findings › POA&M › Risks, each counted from the control's trace (`assurance_trace`), Findings the
// assessor's findings and the open operational issues, the gap the next step fills carrying it. It
// replaces the band and the Trace Section. The tabs, Implementation, Requirements, Evidence,
// Assessment and Findings, live in the address (`tab`); the first three are another panel's
// (control-implementation-tab, control-requirements-tab, control-evidence-tab), which mount
// `ControlText` for the control's text, its Cyber resiliency, ATT&CK techniques, parameters and
// links. The rail beside every tab, Control details, holds Objectives (Mapped, With evidence and
// Assessed as Meters of the objectives the control counts, numbers past twenty), Component
// assessment where the control is inherited (Published, Controls satisfied, Owner, from
// `component_control_status`) and Properties (SSP, the one Requirement, Enhances, the baseline's
// Enhancements). `ControlText` read in a program prints the program's value for each parameter
// (`program_control_parameters`, the nearest layer that sets it) in place of the catalog's
// placeholder, a placeholder where nothing sets it, and says each in its Parameters Section.

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  AsideLayout,
  Button,
  Count,
  DateTime,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  Fact,
  Id,
  Inline,
  Inspector,
  KeyValue,
  LinkIconButton,
  Meter,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  Trace,
  defineColumns,
  displayedRows,
  tableQueryFromSearch,
  useDataTable,
  useLedgerLocale,
  type TraceRailStop,
} from "@ledger/design-system";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useProgramBaselines } from "@/lib/baseline-reads";
import { controlPrograms, useAssuranceTrace, type AssuranceTrace } from "@/lib/assurance-trace";
import { useComponentControlStatus } from "@/lib/component-reuse";
import { useControlObjectiveCounts } from "@/lib/control-objectives";
import { parameterReadings, useProgramControlParameters } from "@/lib/control-parameters";
import {
  controlSlot,
  controlStrip,
  controlTabs,
  sequencePlace,
  type BuiltFrom,
  type ControlSlot,
  type ControlTab,
  type StripKind,
} from "@/lib/control-record";
import {
  useControlNextStep,
  type ControlStanding,
  type ProgramControlStatus,
} from "@/lib/control-status";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import type { ControlNextStep } from "@/lib/next-steps";
import { useParameterChoices } from "@/lib/parameter-reads";
import { controlName, objectiveWords, objectivesOf } from "@/lib/product-records";
import type { DataRecord } from "@/lib/records";
import { registerViews } from "@/lib/register-views";
import {
  controlDeterminers,
  controlPublicationStatuses,
  controlStatuses,
  implementationStatuses,
  revisionStates,
  statusLabel,
} from "@/lib/status";
import { rememberedQuestion } from "./collection-question";
import { ControlAddEvidence } from "./control-add-evidence";
import { useAssessmentWait } from "@/lib/control-work";
import {
  ControlAssessmentPanel,
  builtFromName,
  useControlPlacement,
} from "./control-assessment-tab";
import { ControlEvidencePanel } from "./control-evidence-tab";
import { ControlFindingsPanel, findingsCount } from "./control-findings-tab";
import { ControlImplementationPanel } from "./control-implementation-tab";
import { ControlRequirementsPanel } from "./control-requirements-tab";
import { ControlResiliency } from "./control-resiliency";
import { ControlThreats } from "./control-threats";
import { ControlLinks, ControlStatement, ParameterGroup } from "./library-controls";
import { ObjectiveCount } from "./control-status";
import { NextStep, StepSurfaceHost, stepDestination, useOpenStep } from "./next-step";
import { ProductCollection } from "./product-collection";
import { ProductRecordDialog } from "./product-record-dialog";
import { RetainedTabPanels } from "./program-shared";
import { RecordLink, useOpenRecord } from "./record-preview";
import { ProgramTrail, RecordTrail, TrailLink } from "./record-trail";
import { RelationName } from "./record-tools";
import {
  EmptyMessage,
  MissingRecord,
  NoOwner,
  QueryState,
  RecordHeading,
  ReportFailures,
} from "./work-common";

type Control = Row<"controls">;

/** A control's family and edition, and the control it enhances: its Details, wherever it is read. */
function useControlContext(control: Control | null | undefined) {
  const family = useRow("catalog_groups", control?.group_id);
  const edition = useRow("catalog_revisions", control?.catalog_revision_id);
  // An edition reads as its catalog's short title and its version, as the Frameworks picker does.
  const catalog = useRow("catalogs", edition.data?.catalog_id);
  const parent = useRow("controls", control?.parent_control_id);
  return { family, edition, catalog, parent };
}

function ControlDetails({
  control,
  programId,
  summary,
  standing,
  children,
}: {
  control: Control;
  /** The program the control is read in: the control it enhances opens inside it too. */
  programId?: string | undefined;
  /** What the closed Details say: the catalog's status unless the page has one of its own. */
  summary?: ReactNode;
  /** Rows before the control's own: where the program stands on it, and its next step. */
  standing?: ReactNode;
  /** Rows after the control's own: what the page adds. */
  children?: ReactNode;
}) {
  const { family, edition, catalog, parent } = useControlContext(control);
  return (
    <Shell.Aside
      label="Control details"
      summary={
        summary ?? <StatusBadge statuses={controlPublicationStatuses} value={control.status} />
      }
    >
      <Inspector.Group title="Details">
        <KeyValue.Group>
          {standing}
          <KeyValue label="Control">
            <Id>{control.code}</Id>
          </KeyValue>
          <KeyValue label="Family" wrap>
            {family.data ? (
              `${family.data.source_id?.toUpperCase() ?? ""} ${family.data.title ?? ""}`.trim()
            ) : (
              <Absent label={family.isError ? "Not available" : "Not recorded"} />
            )}
          </KeyValue>
          {control.parent_control_id && (
            <KeyValue label="Enhances" wrap>
              {parent.data ? (
                <RecordLink
                  table="controls"
                  record={{ ...parent.data, ...(programId ? { program_id: programId } : {}) }}
                >
                  {parent.data.code} · {parent.data.title}
                </RecordLink>
              ) : (
                <Absent label="Not available" />
              )}
            </KeyValue>
          )}
          <KeyValue label={standing ? "Catalog status" : "Status"}>
            <StatusBadge statuses={controlPublicationStatuses} value={control.status} />
          </KeyValue>
          <KeyValue label="Catalog" wrap>
            {edition.data ? (
              `${catalog.data?.title ?? edition.data.title} · ${edition.data.version}`
            ) : (
              <Absent label={edition.isError ? "Not available" : "Not recorded"} />
            )}
          </KeyValue>
          {children}
        </KeyValue.Group>
      </Inspector.Group>
    </Shell.Aside>
  );
}

/**
 * A control's text as the catalog prints it, for its record page: the statement and its discussion
 * open, then what NIST SP 800-160 gives the control (the cyber resiliency techniques it supports
 * with their guidance, and the ATT&CK techniques it counters), then what the page adds (`children`:
 * where the programs stand, the enhancements), then the assessment objectives, the parameters and
 * the links, each closed until asked for. Read in a program, the text prints the program's values
 * for the parameters in place of the catalog's placeholders, and the Parameters say each value and
 * the layer it comes from.
 */
export function ControlText({
  control,
  programId,
  children,
  statement: printStatement = true,
}: {
  control: Control;
  /** The program the control is read in: a technique then opens its Control baseline. */
  programId?: string | undefined;
  children?: ReactNode;
  /** False where another part prints the statement (a program's Implementation, part by part). */
  statement?: boolean | undefined;
}) {
  const parts = useRows("control_parts", { control_id: control.id });
  const parameters = useRows("parameters", { control_id: control.id });
  const choices = useParameterChoices(parameters.data);
  const links = useRows("control_links", { control_id: control.id });
  // The program's values, which the text waits for; when they cannot be read the catalog's
  // placeholders stand and the page's alert says why.
  const programValues = useProgramControlParameters(programId, control.id);
  const values = useMemo(
    () => (programValues.data ? parameterReadings(programValues.data) : null),
    [programValues.data],
  );
  const textReads = [
    parts,
    parameters,
    choices,
    ...(programId && !programValues.isError ? [programValues] : []),
  ];
  const has = (roots: readonly string[]) =>
    (parts.data ?? []).some((part) => part.parent_part_id === null && roots.includes(part.name));
  const statement = ["overview", "statement", "guidance"] as const;
  const objectives = ["assessment-objective", "assessment-method"] as const;
  return (
    <>
      {programId && <ReportFailures queries={[programValues]} />}
      <QueryState queries={textReads}>
        {!printStatement ? null : has(statement) ? (
          <ControlStatement
            parts={parts.data ?? []}
            parameters={parameters.data ?? []}
            choices={choices.data ?? []}
            roots={statement}
            values={values}
          />
        ) : (
          <EmptyMessage
            compact
            title="No statement recorded"
            description="The catalog records none for this control."
          />
        )}
      </QueryState>
      <ControlResiliency controlId={control.id} programId={programId} />
      <ControlThreats
        controlId={control.id}
        catalogRevisionId={control.catalog_revision_id}
        programId={programId}
      />
      {children}
      {has(objectives) && (
        <Section title="Assessment objectives and methods" isCollapsible defaultOpen={false}>
          <ControlStatement
            parts={parts.data ?? []}
            parameters={parameters.data ?? []}
            choices={choices.data ?? []}
            roots={objectives}
            values={values}
          />
        </Section>
      )}
      {(parameters.data?.length ?? 0) > 0 && (
        <Section
          title="Parameters"
          count={parameters.data?.length}
          countMax={9999}
          isCollapsible
          defaultOpen={false}
        >
          <Stack space="space.150">
            {[...(parameters.data ?? [])]
              .sort((a, b) => a.ordinal - b.ordinal)
              .map((parameter) => (
                <ParameterGroup
                  key={parameter.id}
                  parameter={parameter}
                  parameters={parameters.data ?? []}
                  choices={choices.data ?? []}
                  readings={values?.get(parameter.id)}
                />
              ))}
          </Stack>
        </Section>
      )}
      {(links.data?.length ?? 0) > 0 && (
        <Section
          title="Links"
          count={links.data?.length}
          countMax={9999}
          isCollapsible
          defaultOpen={false}
        >
          <ControlLinks links={links.data ?? []} />
        </Section>
      )}
    </>
  );
}

type Enhancement = Pick<Control, "id" | "code" | "title" | "status">;

/** The enhancements of a control, each opening its own record. */
function Enhancements({ control, programId }: { control: Control; programId?: string }) {
  const open = useOpenRecord();
  const query = useRows(
    "controls",
    { parent_control_id: control.id },
    { columns: ["id", "code", "title", "status"] },
  );
  const scope = useMemo(() => (programId ? { program_id: programId } : {}), [programId]);
  const rows = useMemo(
    () =>
      [...(query.data ?? [])].sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true }),
      ),
    [query.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<Enhancement>((c) => [
        c.id("code", { header: "Control", width: 112, priority: 1, hideable: false }),
        c.text("title", {
          header: "Title",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="controls" record={{ ...row, ...scope }}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.status("status", { header: "Status", width: 130, statuses: controlPublicationStatuses }),
      ]),
    [scope],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.code} · ${row.title}`,
    label: "Enhancements",
    pageSize: 25,
  });
  if (query.data && !query.data.length) return null;
  return (
    <Section title="Enhancements" count={query.data?.length} countMax={9999}>
      <ProductCollection
        compact
        keepQuestion={false}
        table={table}
        queries={[query]}
        searchLabel="Find enhancements"
        onRowClick={(row) => open("controls", { ...row, ...scope })}
        empty={{ title: "No enhancements", icon: <ShieldCheck /> }}
      />
    </Section>
  );
}

type ProgramLine = {
  id: string;
  name: string;
  code: string;
  /**
   * The objectives the control counts, those the program's requirements cover, cover with evidence
   * and its assessors have judged, as its control status counts them.
   */
  objectives: number | null;
  objectivesMapped: number | null;
  objectivesEvidenced: number | null;
  objectivesAssessed: number | null;
  requirements: number;
  evidenced: number;
  issues: number;
  risks: number;
};

/** A count of the control's objectives in a program's row: "12 of 26", Absent until it is read. */
const objectiveCell = (count: number | null, objectives: number | null) =>
  objectives === null || count === null ? (
    <Absent label="Not available" />
  ) : (
    <ObjectiveCount count={count} objectives={objectives} />
  );

/**
 * Where the workspace's programs stand on a control: one row a program that has a requirement
 * meeting it, with how many of the control's objectives its requirements cover, cover with evidence
 * and its assessors have judged ("12 of 26"), read for every row in one request.
 */
function ControlPrograms({ control }: { control: Control }) {
  const open = useOpenRecord();
  const trace = useAssuranceTrace({ kind: "control", id: control.id });
  const lines = useMemo(() => (trace.data ? controlPrograms(trace.data) : []), [trace.data]);
  const programIds = useMemo(() => lines.map((line) => line.programId), [lines]);
  const programs = useRows(
    "programs",
    { id: idSet(programIds) },
    { columns: ["id", "code", "name"], enabled: trace.isSuccess },
  );
  const objectives = useControlObjectiveCounts(control.id, programIds, {
    enabled: trace.isSuccess,
  });
  const rows = useMemo<ProgramLine[]>(() => {
    const byId = new Map((programs.data ?? []).map((program) => [program.id, program]));
    return lines
      .flatMap((line) => {
        const program = byId.get(line.programId);
        const counted = objectives.data?.programs.get(line.programId);
        return program
          ? [
              {
                ...line,
                id: program.id,
                name: program.name,
                code: program.code,
                objectives: counted?.objectives ?? null,
                objectivesMapped: counted?.mapped ?? null,
                objectivesEvidenced: counted?.evidenced ?? null,
                objectivesAssessed: counted?.assessed ?? null,
              },
            ]
          : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lines, programs.data, objectives.data]);
  const columns = useMemo(
    () =>
      defineColumns<ProgramLine>((c) => [
        c.text("name", {
          header: "Program",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="controls" record={{ id: control.id, program_id: row.id }}>
              {row.name}
            </RecordLink>
          ),
        }),
        // How much of the control the program's requirements cover, cover with evidence and its
        // assessors have judged, objective by objective, as its control status counts them.
        c.number("objectivesMapped", {
          header: objectiveWords.mapped,
          width: 170,
          priority: 1,
          cell: (row) => objectiveCell(row.objectivesMapped, row.objectives),
        }),
        c.number("objectivesEvidenced", {
          header: objectiveWords.evidenced,
          width: 200,
          priority: 2,
          cell: (row) => objectiveCell(row.objectivesEvidenced, row.objectives),
        }),
        c.number("objectivesAssessed", {
          header: objectiveWords.assessed,
          width: 180,
          priority: 3,
          cell: (row) => objectiveCell(row.objectivesAssessed, row.objectives),
        }),
        c.number("requirements", { header: "Requirements", width: 130, priority: 4 }),
        c.number("evidenced", { header: "With evidence", width: 130, priority: 5 }),
        c.number("issues", { header: "Open issues", width: 120, priority: 6 }),
        c.number("risks", { header: "Open risks", width: 120, priority: 7 }),
      ]),
    [control.id],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Programs",
    pageSize: 25,
    pinnable: false,
    hideable: false,
  });
  return (
    <Section title="Programs" count={trace.isSuccess ? rows.length : undefined} countMax={9999}>
      <ProductCollection
        compact
        keepQuestion={false}
        search={false}
        table={table}
        queries={[trace, programs, objectives]}
        onRowClick={(row) => open("controls", { id: control.id, program_id: row.id })}
        empty={{
          title: "No program meets this control yet",
          description: "Listed once a program's requirement maps it.",
          icon: <ShieldCheck />,
        }}
      />
    </Section>
  );
}

/**
 * A catalog control's record: its text as the catalog prints it, its enhancements, and where each
 * program of the workspace stands on it. A program's row opens the control inside that program,
 * with its trace.
 */
export function CatalogControlRecord({ id }: { id: string }) {
  const query = useRow("controls", id);
  const control = query.data;
  const { parent } = useControlContext(control);
  return (
    <Page>
      <QueryState query={query} shape="record" region>
        {control ? (
          <>
            <PageHeader>
              <RecordTrail current={controlName(control)}>
                <TrailLink to="/catalog">Frameworks</TrailLink>
                <TrailLink to="/catalog" search={{ edition: control.catalog_revision_id }}>
                  Controls
                </TrailLink>
                {parent.data && (
                  <TrailLink
                    to="/catalog/controls/$controlId"
                    params={{ controlId: parent.data.id }}
                  >
                    {parent.data.code}
                  </TrailLink>
                )}
              </RecordTrail>
              {/* A catalog control is shared reference data: nobody in the workspace edits it, so
                  its header holds no action. */}
              <RecordHeading
                status={
                  <StatusBadge statuses={controlPublicationStatuses} value={control.status} />
                }
              >
                {controlName(control)}
              </RecordHeading>
            </PageHeader>
            <AsideLayout aside={<ControlDetails control={control} />}>
              <Stack space="space.300" className="min-w-0">
                <ControlText control={control}>
                  <ControlPrograms control={control} />
                  <Enhancements control={control} />
                </ControlText>
              </Stack>
            </AsideLayout>
          </>
        ) : (
          <MissingRecord
            kind="Control"
            back={{ label: "Open the catalog", link: <Link to="/catalog" /> }}
          />
        )}
      </QueryState>
    </Page>
  );
}

/* ——— The program's record of a control ——————————————————————————————————————————————————— */

/** A family as the Control status List names it: its code and its name, "AC Access Control". */
const familyName = (code: string | null, title: string | null) =>
  [code ?? "Other", title].filter(Boolean).join(" ");

type SequenceRow = ControlStanding & { name: string; family: string };

/**
 * The Controls register's columns, as far as its question reads them: the same ids and kinds as
 * the Control status List, so its search, filters and sort order the controls as it does.
 */
const sequenceColumns = defineColumns<SequenceRow>((c) => [
  c.text("name", { header: "Control", priority: 0 }),
  c.status("status", { header: "Control status", statuses: controlStatuses }),
  c.status("determinedBy", { header: "Determined by", statuses: controlDeterminers }),
  c.text("family", { header: "Control family" }),
  c.number("objectivesMapped", { header: objectiveWords.mapped }),
  c.number("objectivesEvidenced", { header: objectiveWords.evidenced }),
  c.number("objectivesAssessed", { header: objectiveWords.assessed }),
  c.number("requirements", { header: "Requirements" }),
  c.number("evidenced", { header: "With evidence" }),
]);

/**
 * Where the control stands in the program's Controls register as the reader last asked it: the
 * question this tab's session remembers for the Control status List (`program-control-status`),
 * over the same read, so the record steps through the controls the register showed, in its order.
 * None where the register's question leaves the control out.
 */
function useControlSequence(status: ProgramControlStatus | undefined, controlId: string) {
  const [question] = useState(() =>
    tableQueryFromSearch(rememberedQuestion(registerViews.controlStatus)),
  );
  const rows = useMemo<SequenceRow[]>(
    () =>
      (status?.controls ?? []).map((control) => ({
        ...control,
        name: `${control.code} ${control.title}`,
        family: familyName(control.family, control.familyTitle),
      })),
    [status?.controls],
  );
  const table = useDataTable({
    columns: sequenceColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Controls in the control baseline",
    initialState: {
      sorting: question.sorting ?? [],
      columnFilters: question.filters ?? [],
      globalFilter: question.search ?? "",
    },
  });
  const ids = displayedRows(table).map((row) => row.id);
  return status ? sequencePlace(ids, controlId) : null;
}

/** "46 of 235" with the controls before and after it in the register, on the same tab. */
function ControlSequence({
  programId,
  place,
  tab,
}: {
  programId: string;
  place: ReturnType<typeof sequencePlace>;
  tab: ControlTab;
}) {
  const { formatNumber } = useLedgerLocale();
  if (!place) return null;
  const to = (id: string | null) => (
    <Link
      to="/programs/$programId/controls/$controlId"
      params={{ programId, controlId: id ?? "" }}
      search={{ tab }}
    />
  );
  return (
    <Inline space="space.050" alignBlock="center">
      <LinkIconButton
        label="Previous control"
        icon={<ChevronUp />}
        variant="subtle"
        render={to(place.previous)}
        {...(place.previous ? {} : { disabledReason: "The first control in the list" })}
      />
      <Text size="small" color="color.text.subtle" numeric>
        {`${formatNumber(place.position)} of ${formatNumber(place.total)}`}
      </Text>
      <LinkIconButton
        label="Next control"
        icon={<ChevronDown />}
        variant="subtle"
        render={to(place.next)}
        {...(place.next ? {} : { disabledReason: "The last control in the list" })}
      />
    </Inline>
  );
}

/**
 * The control's implementation in the program's SSP: the one the address names, else the one in
 * the newest SSP revision of the program's systems. Read whole, since its Edit starts from it.
 */
function useControlImplementation(
  programId: string,
  controlId: string,
  implementationId: string | undefined,
) {
  const implementations = useRows("implemented_requirements", {
    "selected_controls.control_id": controlId,
    "ssp_revisions.systems.program_id": programId,
  });
  const planIds = idSet(implementations.data?.map((row) => row.ssp_revision_id));
  const plans = useRows(
    "ssp_revisions",
    { id: planIds },
    { columns: ["id", "version_number", "state", "system_id"], enabled: planIds.length > 0 },
  );
  const chosen = useMemo(() => {
    const rows = implementations.data ?? [];
    const named = implementationId ? rows.find((row) => row.id === implementationId) : undefined;
    if (named) return named;
    const version = new Map((plans.data ?? []).map((plan) => [plan.id, plan.version_number]));
    return (
      [...rows].sort(
        (a, b) =>
          (version.get(b.ssp_revision_id) ?? 0) - (version.get(a.ssp_revision_id) ?? 0) ||
          b.updated_at.localeCompare(a.updated_at),
      )[0] ?? null
    );
  }, [implementations.data, plans.data, implementationId]);
  const plan = plans.data?.find((row) => row.id === chosen?.ssp_revision_id) ?? null;
  return { implementation: chosen, plan, queries: [implementations, plans] };
}

const STRIP_LABELS: Record<StripKind, string> = {
  control: "Controls",
  requirement: "Requirements",
  evidence: "Evidence",
  finding: "Findings",
  remediation: "POA&M",
  risk: "Risks",
};
/** What a gap says where the control's next step is not done there. */
const GAP_WORDS: Partial<Record<StripKind, string>> = {
  requirement: "No requirement",
  evidence: "No evidence",
  finding: "Not assessed",
};

/** The steps done on the control itself, which the slot and the strip open over the page. */
type InPlaceStep = Extract<
  ControlNextStep,
  { kind: "map_requirement" | "allocate_requirement" | "assess" | "plan_assessment" }
>;
const isInPlace = (step: ControlNextStep | null | undefined): step is InPlaceStep =>
  step?.kind === "map_requirement" ||
  step?.kind === "allocate_requirement" ||
  step?.kind === "assess" ||
  step?.kind === "plan_assessment";

/**
 * The chain from the control outward, one station a stage, counted: Controls, Requirements,
 * Evidence, Findings, POA&M, Risks. The gap the control's next step fills carries the step, in
 * its words, for a reader who may take it; another gap says what is missing.
 */
function ControlStrip({
  trace,
  standing,
  step,
  judgedOn,
  name,
  programId,
  control,
  canWrite,
  onAddEvidence,
}: {
  trace: UseQueryResult<AssuranceTrace, Error>;
  standing: ControlStanding | null;
  step: ControlNextStep | null;
  judgedOn: string | undefined;
  name: string;
  programId: string;
  control: { id: string; code: string; title: string };
  canWrite: boolean;
  onAddEvidence: () => void;
}) {
  const stops = useMemo<TraceRailStop[] | null>(() => {
    if (!trace.data) return null;
    const stations = controlStrip(trace.data, standing, { step, judgedOn });
    return stations.map((station) => {
      const fix =
        station.step && step ? (
          step.kind === "link_evidence" ? (
            canWrite ? (
              <Button variant="link" size="small" onClick={onAddEvidence}>
                Add evidence
              </Button>
            ) : undefined
          ) : isInPlace(step) || step.kind === "open_campaign" ? (
            <NextStep
              step={step}
              programId={programId}
              control={control}
              canWrite={canWrite}
              size="small"
            />
          ) : undefined
        ) : undefined;
      return {
        id: station.kind,
        label: STRIP_LABELS[station.kind],
        state: station.state,
        count: station.count,
        tone: station.tone,
        value: station.state === "gap" ? (fix ?? GAP_WORDS[station.kind]) : station.words,
        ...(station.meta ? { meta: station.meta } : {}),
        ...(station.state === "gap" && fix ? { description: GAP_WORDS[station.kind] } : {}),
      };
    });
  }, [trace.data, standing, step, judgedOn, programId, control, canWrite, onAddEvidence]);
  return (
    <QueryState query={trace}>
      {stops && (
        <Trace.Rail
          label={`The chain around ${name}`}
          stops={stops}
          focus="control"
          aria-busy={trace.isPlaceholderData || undefined}
        />
      )}
    </QueryState>
  );
}

/** How many of a control's objectives reach a rung, as marks where they are few and words beyond. */
function ObjectiveMeter({ value, max }: { value: number; max: number }) {
  const { formatNumber } = useLedgerLocale();
  return max <= 20 ? (
    <Meter value={value} max={max} />
  ) : (
    <Text numeric>{objectivesOf(formatNumber(value), formatNumber(max))}</Text>
  );
}

/**
 * The record's slot: the control's next step in the slot's words (`controlSlot`), or nothing of
 * its own; its other commands behind `more`. A step done on the control opens over the page; Add
 * evidence opens its dialog; a step done elsewhere links there.
 */
function ControlSlotView({
  slot,
  step,
  programId,
  control,
  builtFromId,
  more,
  onAddEvidence,
}: {
  slot: ControlSlot | null;
  step: ControlNextStep | null;
  programId: string;
  control: { id: string; code: string; title: string };
  builtFromId: string | undefined;
  more: Parameters<typeof PageHeader.Slot>[0]["more"];
  onAddEvidence: () => void;
}) {
  const openStep = useOpenStep();
  // A control a campaign's plan holds waits on that campaign's assessors until it ends.
  const { wait } = useAssessmentWait(programId, control.id);
  if (!slot || slot.form === "none") return <PageHeader.Slot more={more} />;
  const waiting =
    slot.kind === "open_campaign" && wait ? (
      <>
        {wait.campaign.title}
        {wait.waitingOn.length > 0 &&
          ` · Waiting on ${wait.waitingOn.map((holder) => holder.name).join(", ")}`}
        {wait.campaign.endsAt && (
          <>
            {" · ends "}
            <DateTime value={wait.campaign.endsAt} format="date" />
          </>
        )}
      </>
    ) : null;
  const words = {
    label: slot.label,
    reason: slot.reason,
    ...(waiting ? { detail: waiting } : slot.detail ? { detail: slot.detail } : {}),
  };
  if (slot.kind === "add_evidence")
    return <PageHeader.Slot advance={{ ...words, onAction: onAddEvidence }} more={more} />;
  if (slot.kind === "open_component_assessment")
    return builtFromId ? (
      <PageHeader.Slot
        advance={{
          ...words,
          link: (
            <Link
              to="/library/components/$componentId"
              params={{ componentId: builtFromId }}
              search={{ tab: "Assessment" }}
            />
          ),
        }}
        more={more}
      />
    ) : (
      <PageHeader.Slot more={more} />
    );
  if (isInPlace(step))
    return (
      <PageHeader.Slot
        advance={{
          ...words,
          onAction: (event) => {
            const opener = event.currentTarget;
            openStep(
              step,
              programId,
              control,
              opener,
              opener.closest<HTMLElement>('[data-slot="page-header-slot"]'),
            );
          },
        }}
        more={more}
      />
    );
  if (step && step.kind !== "link_evidence")
    return (
      <PageHeader.Slot advance={{ ...words, link: stepDestination(step, programId) }} more={more} />
    );
  return <PageHeader.Slot more={more} />;
}

/** The control's parameters the program's baseline gives no value: none until both reads answer. */
function useUnsetParameters(programId: string, controlId: string) {
  const values = useProgramControlParameters(programId, controlId);
  const parameters = useRows(
    "parameters",
    { control_id: controlId },
    { columns: ["id", "source_id", "label", "ordinal"] },
  );
  const unset = useMemo(() => {
    if (!values.data || !parameters.data || !values.data.selected) return [];
    const readings = parameterReadings(values.data);
    return [...parameters.data]
      .sort((a, b) => a.ordinal - b.ordinal)
      .filter((parameter) =>
        (readings?.get(parameter.id) ?? []).some((reading) => reading.values.length === 0),
      );
  }, [values.data, parameters.data]);
  return { unset, queries: [values, parameters] };
}

/**
 * A control inside a program (the pass-six boards impl-control.html and control-inherited.html):
 * where the program stands on it, its next step, its chain and its tabs. The address names the
 * catalog control; an implementation's address opens it too, with that implementation.
 */
export function ProgramControl({
  programId,
  controlId,
  implementationId,
  tab,
  onTab,
}: {
  programId: string;
  /** The catalog control's id. */
  controlId: string;
  /** The implementation the address names, when it names one. */
  implementationId?: string | undefined;
  tab: ControlTab;
  onTab: (tab: ControlTab) => void;
}) {
  const workspace = useWorkspace();
  const canWrite = workspace.role !== "viewer";
  const { formatNumber } = useLedgerLocale();
  const query = useRow("controls", controlId);
  const program = useRow("programs", programId);
  const trace = useAssuranceTrace({ kind: "control", id: controlId, programId });
  // Where the program stands on the control and the step that moves it: the reads the Overview,
  // the Control status view and the trace share.
  const next = useControlNextStep(programId, controlId, trace.data?.requirements);
  const { statuses, step } = next;
  const standing = next.standing ?? null;
  const requirementIds = useMemo(
    () => trace.data?.requirements.map((requirement) => requirement.id),
    [trace.data?.requirements],
  );
  const placement = useControlPlacement(controlId, requirementIds);
  const {
    implementation,
    plan,
    queries: implementationQueries,
  } = useControlImplementation(programId, controlId, implementationId);
  const { unset, queries: parameterQueries } = useUnsetParameters(programId, controlId);
  const { baselines } = useProgramBaselines(programId, { only: "origins" });
  // Where the program's baseline gets the control: the reference baseline, or the layer that added it.
  const origin = useMemo(() => {
    for (const baseline of baselines) {
      const found = baseline.derivation.origins.get(controlId);
      if (!found) continue;
      if (!found.layerKey) return baseline.reference?.title ?? null;
      return (
        baseline.derivation.layers.find((layer) => layer.key === found.layerKey)?.title ?? null
      );
    }
    return null;
  }, [baselines, controlId]);
  const sequence = useControlSequence(statuses.data, controlId);
  // The library components the control's elements are built from: what its inherited objectives
  // were judged on, and the elements that inherit it.
  const inherited = (standing?.objectivesInherited ?? 0) > 0;
  const builtFrom = useMemo(() => {
    const all = new Map<string, BuiltFrom>();
    for (const components of placement.builtFrom.values())
      for (const component of components) all.set(component.id, component);
    return [...all.values()];
  }, [placement.builtFrom]);
  const components = builtFrom.length ? builtFrom.map(builtFromName).join(", ") : null;
  const inheritedOn = useMemo(
    () =>
      [...placement.builtFrom.keys()]
        .map((id) => placement.elements.get(id))
        .filter((element): element is { id: string; code: string; name: string } => !!element)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [placement.builtFrom, placement.elements],
  );
  const component = useComponentControlStatus(inherited ? builtFrom[0]?.id : null);
  const deciding = component.data
    ? (component.data.assessments.find((assessment) =>
        standing?.componentAssessments.some((source) => source.id === assessment.id),
      ) ?? component.data.assessments[0])
    : undefined;
  const slot = useMemo(
    () =>
      standing && next.known
        ? controlSlot({
            step,
            standing,
            canWrite,
            builtFrom: components,
            format: formatNumber,
          })
        : null,
    [standing, next.known, step, canWrite, components, formatNumber],
  );
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const openAdding = useCallback(() => setAdding(true), []);
  const control = query.data;
  const stepControl = useMemo(
    () => (control ? { id: control.id, code: control.code, title: control.title } : null),
    [control],
  );
  const enhancements = useMemo(
    () => (statuses.data?.controls ?? []).filter((item) => item.parentId === controlId),
    [statuses.data?.controls, controlId],
  );
  const parent = useRow("controls", control?.parent_control_id);
  const requirements = trace.data?.requirements;
  const counts: Partial<Record<ControlTab, number>> = trace.data
    ? {
        Requirements: trace.data.requirements.length,
        Evidence: trace.data.evidence.length,
        Findings: findingsCount(trace.data),
      }
    : {};
  const editable = canWrite && !!implementation && plan?.state === "draft";
  const more = {
    label: "More control actions",
    items: (
      <>
        {editable && (
          <DropdownMenuItem onClick={() => setEditing(true)}>
            Edit control implementation
          </DropdownMenuItem>
        )}
        <DropdownMenuLinkItem
          closeOnClick
          render={<Link to="/catalog/controls/$controlId" params={{ controlId }} />}
        >
          Open catalog control
        </DropdownMenuLinkItem>
      </>
    ),
  };
  const determinedBy =
    standing && inherited && standing.objectivesInherited >= standing.objectivesAssessed
      ? components
      : standing?.determinedBy === "product"
        ? standing.productAssessments.map((assessment) => assessment.title).join(", ")
        : standing?.determinedBy
          ? controlDeterminers[standing.determinedBy].label
          : null;
  return (
    <Page>
      <QueryState queries={[query, program]} shape="record" region>
        {control && program.data && stepControl ? (
          <StepSurfaceHost>
            <ReportFailures
              queries={[
                trace,
                statuses,
                ...next.queries,
                ...placement.queries,
                ...implementationQueries,
                ...parameterQueries,
                ...(inherited ? [component] : []),
              ]}
            />
            <PageHeader>
              <PageHeader.Lead>
                <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
                  <ProgramTrail programId={programId} part="Controls" />
                  <ControlSequence programId={programId} place={sequence} tab={tab} />
                </Inline>
              </PageHeader.Lead>
              <PageHeader.Heading>
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  <PageHeader.Title>{controlName(control)}</PageHeader.Title>
                  {implementation && (
                    <StatusBadge
                      statuses={implementationStatuses}
                      value={implementation.implementation_status}
                    />
                  )}
                  {standing && <StatusBadge statuses={controlStatuses} value={standing.status} />}
                </Inline>
                {standing && (
                  <PageHeader.Facts>
                    {inherited ? (
                      <>
                        {determinedBy && <Fact label="Determined by">{determinedBy}</Fact>}
                        {inheritedOn.length > 0 && (
                          <Fact label="Inherited on">
                            <Inline space="space.100" shouldWrap>
                              {inheritedOn.map((element) => (
                                <TextLink
                                  key={element.id}
                                  render={
                                    <Link
                                      to="/programs/$programId/systems/$scopeId"
                                      params={{ programId, scopeId: element.id }}
                                    />
                                  }
                                >
                                  {element.code}
                                </TextLink>
                              ))}
                            </Inline>
                          </Fact>
                        )}
                        {standing.objectives > 0 && (
                          <Fact label="Objectives">
                            {`${objectivesOf(
                              formatNumber(standing.objectivesInherited),
                              formatNumber(standing.objectives),
                            )} inherited`}
                          </Fact>
                        )}
                      </>
                    ) : (
                      <>
                        {origin && <Fact label="Baseline">{origin}</Fact>}
                        {unset.length === 1 && unset[0] ? (
                          <Fact label={`Parameter ${unset[0].source_id}`}>
                            <Text color="color.text.warning">Not set</Text>
                          </Fact>
                        ) : unset.length > 1 ? (
                          <Fact label="Parameters">
                            <Text color="color.text.warning">{`${formatNumber(unset.length)} not set`}</Text>
                          </Fact>
                        ) : null}
                        {determinedBy && <Fact label="Determined by">{determinedBy}</Fact>}
                      </>
                    )}
                  </PageHeader.Facts>
                )}
              </PageHeader.Heading>
              <ControlSlotView
                slot={slot}
                step={step}
                programId={programId}
                control={stepControl}
                builtFromId={builtFrom[0]?.id}
                more={more}
                onAddEvidence={openAdding}
              />
            </PageHeader>
            <ControlStrip
              trace={trace}
              standing={standing}
              step={step}
              judgedOn={components ?? undefined}
              name={`the control ${control.code} ${control.title}`}
              programId={programId}
              control={stepControl}
              canWrite={canWrite}
              onAddEvidence={openAdding}
            />
            <Tabs value={tab} onValueChange={(value) => onTab(value as ControlTab)}>
              <TabsList variant="line" aria-label="Control sections">
                {controlTabs.map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {name}
                    {counts[name] !== undefined && <Count value={counts[name]} max={9999} />}
                  </TabsTrigger>
                ))}
              </TabsList>
              <AsideLayout
                aside={
                  <Shell.Aside
                    label="Control details"
                    summary={
                      standing ? (
                        <StatusBadge statuses={controlStatuses} value={standing.status} />
                      ) : undefined
                    }
                  >
                    {standing && standing.objectives > 0 && (
                      <Inspector.Group title="Objectives">
                        <KeyValue.Group labelWidth="narrow">
                          <KeyValue label="Mapped">
                            <ObjectiveMeter
                              value={standing.objectivesMapped}
                              max={standing.objectives}
                            />
                          </KeyValue>
                          <KeyValue label="With evidence">
                            <ObjectiveMeter
                              value={standing.objectivesEvidenced}
                              max={standing.objectives}
                            />
                          </KeyValue>
                          <KeyValue label="Assessed">
                            <ObjectiveMeter
                              value={standing.objectivesAssessed}
                              max={standing.objectives}
                            />
                          </KeyValue>
                        </KeyValue.Group>
                      </Inspector.Group>
                    )}
                    {inherited && component.data && (
                      <Inspector.Group title="Component assessment">
                        <KeyValue.Group>
                          {deciding && (
                            <KeyValue label="Published">
                              <DateTime value={deciding.publishedAt} format="date" />
                            </KeyValue>
                          )}
                          <KeyValue label="Controls satisfied">
                            <Text numeric>
                              {objectivesOf(
                                formatNumber(component.data.counts.satisfied),
                                formatNumber(component.data.total),
                              )}
                            </Text>
                          </KeyValue>
                          <KeyValue label="Owner">
                            {component.data.component.ownerPartyId ? (
                              <RelationName
                                table="parties"
                                id={component.data.component.ownerPartyId}
                                peek={false}
                              />
                            ) : (
                              <NoOwner />
                            )}
                          </KeyValue>
                        </KeyValue.Group>
                      </Inspector.Group>
                    )}
                    <Inspector.Group title="Properties">
                      <KeyValue.Group>
                        {plan && (
                          <KeyValue label="SSP">
                            {`SSP ${formatNumber(plan.version_number)} · ${statusLabel(revisionStates, plan.state)}`}
                          </KeyValue>
                        )}
                        {!inherited && requirements?.length === 1 && requirements[0] && (
                          <KeyValue label="Requirement">
                            <RecordLink
                              table="engineering_requirements"
                              record={{
                                id: requirements[0].id,
                                program_id: requirements[0].program_id,
                              }}
                            >
                              {requirements[0].code}
                            </RecordLink>
                          </KeyValue>
                        )}
                        {parent.data && (
                          <KeyValue label="Enhances">
                            <RecordLink
                              table="controls"
                              record={{ id: parent.data.id, program_id: programId }}
                            >
                              {parent.data.code}
                            </RecordLink>
                          </KeyValue>
                        )}
                        {enhancements.length > 0 && (
                          <KeyValue label="Enhancements" wrap>
                            <Inline space="space.100" shouldWrap>
                              {enhancements.map((enhancement) => (
                                <RecordLink
                                  key={enhancement.id}
                                  table="controls"
                                  record={{ id: enhancement.id, program_id: programId }}
                                >
                                  {enhancement.code}
                                </RecordLink>
                              ))}
                            </Inline>
                          </KeyValue>
                        )}
                      </KeyValue.Group>
                    </Inspector.Group>
                  </Shell.Aside>
                }
              >
                <RetainedTabPanels tabs={controlTabs} value={tab} space="space.200">
                  {(name) => {
                    switch (name) {
                      case "Implementation":
                        return (
                          <Stack space="space.200">
                            <ControlImplementationPanel
                              programId={programId}
                              controlId={controlId}
                            />
                            {/* What SP 800-160 gives the control, its objectives, parameters and
                                links: the text's own Sections, the statement being printed above
                                part by part. */}
                            <ControlText
                              control={control}
                              programId={programId}
                              statement={false}
                            />
                          </Stack>
                        );
                      case "Requirements":
                        return (
                          <ControlRequirementsPanel programId={programId} controlId={controlId} />
                        );
                      case "Evidence":
                        return <ControlEvidencePanel programId={programId} controlId={controlId} />;
                      case "Assessment":
                        return (
                          <ControlAssessmentPanel
                            programId={programId}
                            programCode={program.data?.code ?? "the program"}
                            controlId={controlId}
                            trace={trace}
                            placement={placement}
                            components={components}
                          />
                        );
                      case "Findings":
                        return <ControlFindingsPanel trace={trace} />;
                    }
                  }}
                </RetainedTabPanels>
              </AsideLayout>
            </Tabs>
            <ControlAddEvidence
              programId={programId}
              controlId={controlId}
              open={adding}
              onOpenChange={setAdding}
            />
            {editing && implementation && (
              <ProductRecordDialog
                table="implemented_requirements"
                existing={implementation as unknown as DataRecord}
                onClose={() => setEditing(false)}
              />
            )}
          </StepSurfaceHost>
        ) : (
          <MissingRecord
            backTo="/programs"
            kind="Control"
            description="This record is unavailable in this program."
          />
        )}
      </QueryState>
    </Page>
  );
}
