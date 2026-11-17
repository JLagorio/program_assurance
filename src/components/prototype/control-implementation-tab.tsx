// A control's Implementation tab, on the program's record of the control (boards impl-control and
// control-inherited of the November 2026 UX proposal): how the program's SSP says the control is
// met, part by part. The Summary first, the control implementation's own narrative, then every item
// of the control's statement in the catalog's reading order (a., b., then b.1. under b.), each with
// its text as the program reads it (a parameter the program sets prints its value, one it does not
// keeps its placeholder) beside what the SSP records for it: the part's narrative (its
// implementation statement), the system components that contribute there with their implementation
// status and who is responsible where a contribution records it, and each parameter the part
// inserts that the program sets no value for, Not set. A part with no narrative says so, with Write
// narrative for a reader who may write a draft SSP (the generic form of an implementation
// statement); a written one keeps Edit narrative. The SSP is the latest revision of the
// authorization boundary whose baseline selects the control, chosen by a Select where more than one
// boundary does. Its order is its meaning, so the parts are a list, not a collection: no search,
// sort or eye. Each part is two blocks that stand side by side where the frame leaves them room and
// one under the other on a phone. Read from `ssp_control_detail` (ssp-assembly), the control's
// parts and parameters, and `program_control_parameters` (control-parameters); the parts are put
// together by `implementationParts` in control-work.
//
// Not built, since nothing writes it today: Set value. A program's parameter values are set in
// program setup's tailoring, and a saved program's tailoring is read-only (`profiles.$profileId`);
// only an overlay's Set parameter values writes values after setup. The boards' Responsibility
// ("System") is the control's origination, which the schema does not record; a contribution's
// responsible party is drawn where it is recorded.

import { useMemo, useState, type ReactNode } from "react";
import {
  Absent,
  Box,
  Button,
  Grid,
  Inline,
  Meter,
  Prose,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from "@ledger/design-system";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { parameterReadings, useProgramControlParameters } from "@/lib/control-parameters";
import { implementationParts, type ImplementationPart } from "@/lib/control-work";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import { useParameterChoices } from "@/lib/parameter-reads";
import type { DataRecord } from "@/lib/records";
import {
  assembleSspControl,
  useSspControlDetail,
  type SspControlAssembly,
} from "@/lib/ssp-assembly";
import { implementationStatuses, revisionStates, statusLabel } from "@/lib/status";
import {
  ControlProse,
  insertedParameters,
  programPlaceholders,
  type ParameterPlaceholders,
} from "./library-controls";
import { ProductRecordDialog } from "./product-record-dialog";
import { RecordLink } from "./record-preview";
import { RelationName } from "./record-tools";
import { EmptyMessage, QueryState, ReportFailures, type QueryStatus } from "./work-common";

/** What the tab reads of the program's systems: the boundaries, and a contribution's element. */
const SYSTEM_COLUMNS = [
  "id",
  "code",
  "name",
  "program_id",
  "boundary_system_id",
  "parent_system_id",
  "is_authorization_boundary",
] as const;
type ProgramSystem = Pick<Row<"systems">, (typeof SYSTEM_COLUMNS)[number]>;
const PLAN_COLUMNS = [
  "id",
  "system_id",
  "profile_resolution_id",
  "version_number",
  "state",
] as const;
type Plan = Pick<Row<"ssp_revisions">, (typeof PLAN_COLUMNS)[number]>;

/** What a narrative form opens on: the record, what the form fixes, and the words it says. */
type Editor = {
  table: "implemented_requirements" | "implementation_statements";
  existing?: DataRecord | undefined;
  initialValues: Record<string, unknown>;
  operationLabel?: string | undefined;
  description: string;
};

/**
 * The SSP that says how the program meets the control: the latest revision of each authorization
 * boundary of the program, those whose stored baseline selects the control, by the boundary's code.
 */
function useControlSsps(programId: string, controlId: string) {
  const systems = useRows("systems", { program_id: programId }, { columns: SYSTEM_COLUMNS });
  const boundaries = useMemo(
    () =>
      (systems.data ?? [])
        .filter((system) => system.is_authorization_boundary)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [systems.data],
  );
  const plans = useRows(
    "ssp_revisions",
    { system_id: idSet(boundaries.map((system) => system.id)) },
    { columns: PLAN_COLUMNS, enabled: systems.isSuccess },
  );
  const latest = useMemo(() => {
    const byBoundary = new Map<string, Plan>();
    for (const plan of plans.data ?? []) {
      const held = byBoundary.get(plan.system_id);
      if (!held || plan.version_number > held.version_number) byBoundary.set(plan.system_id, plan);
    }
    return boundaries.flatMap((boundary) => {
      const plan = byBoundary.get(boundary.id);
      return plan ? [{ boundary, plan }] : [];
    });
  }, [boundaries, plans.data]);
  const selections = useRows(
    "selected_controls",
    {
      profile_resolution_id: idSet(latest.map(({ plan }) => plan.profile_resolution_id)),
      control_id: controlId,
    },
    { columns: ["id", "profile_resolution_id"], enabled: plans.isSuccess },
  );
  const ssps = useMemo(
    () =>
      latest.flatMap(({ boundary, plan }) => {
        const selection = selections.data?.find(
          (row) => row.profile_resolution_id === plan.profile_resolution_id,
        );
        return selection ? [{ boundary, plan, selectionId: selection.id }] : [];
      }),
    [latest, selections.data],
  );
  const queries = [systems, plans, selections];
  return {
    systems: systems.data,
    ssps,
    queries,
    loaded: queries.every((query) => query.data !== undefined),
    hasPlans: latest.length > 0,
  };
}

export function ControlImplementationPanel({
  programId,
  controlId,
}: {
  programId: string;
  controlId: string;
}) {
  const control = useRow("controls", controlId);
  const { systems, ssps, queries, loaded, hasPlans } = useControlSsps(programId, controlId);
  const [chosen, setChosen] = useState<string>();
  const ssp = ssps.find((item) => item.plan.id === chosen) ?? ssps[0];
  const code = control.data?.code ?? "This control";
  if (!loaded) return <QueryState queries={[control, ...queries]} />;
  if (!ssp)
    return (
      <QueryState queries={[control, ...queries]}>
        <EmptyMessage
          illustration="document"
          title={hasPlans ? `No SSP selects ${code}` : "No SSP recorded"}
          description={
            hasPlans
              ? "The latest SSP of each authorization boundary leaves this control out."
              : "The program's SSP records how each control is met."
          }
        />
      </QueryState>
    );
  return (
    <SspImplementation
      key={ssp.plan.id}
      programId={programId}
      controlId={controlId}
      plan={ssp.plan}
      selectionId={ssp.selectionId}
      systems={systems ?? []}
      context={[control, ...queries]}
      chooser={
        ssps.length > 1 ? (
          <Select value={ssp.plan.id} onValueChange={(value) => value && setChosen(value)}>
            <SelectTrigger size="small" aria-label="Authorization boundary">
              <SelectValue>
                {ssp.boundary.code} · {ssp.boundary.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ssps.map((item) => (
                <SelectItem key={item.plan.id} value={item.plan.id}>
                  {item.boundary.code} · {item.boundary.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : undefined
      }
    />
  );
}

function SspImplementation({
  programId,
  controlId,
  plan,
  selectionId,
  systems,
  context,
  chooser,
}: {
  programId: string;
  controlId: string;
  plan: Plan;
  selectionId: string;
  systems: readonly ProgramSystem[];
  context: QueryStatus[];
  chooser: ReactNode;
}) {
  const workspace = useWorkspace();
  const detail = useSspControlDetail(plan.id, selectionId);
  const assembly = useMemo(
    () =>
      detail.data && detail.data.selection.id === selectionId
        ? assembleSspControl(detail.data, { plan, systems })
        : undefined,
    [detail.data, plan, systems, selectionId],
  );
  // The control's statement, read as its record's text reads it, and its parameters with the
  // program's values for them.
  const parts = useRows("control_parts", { control_id: controlId });
  const parameters = useRows("parameters", { control_id: controlId });
  const choices = useParameterChoices(parameters.data);
  const programValues = useProgramControlParameters(programId, controlId);
  const placeholders = useMemo(
    () =>
      programPlaceholders(
        parameters.data ?? [],
        choices.data ?? [],
        programValues.data ? parameterReadings(programValues.data) : null,
      ),
    [parameters.data, choices.data, programValues.data],
  );
  const [editor, setEditor] = useState<Editor>();
  const editable = plan.state === "draft" && workspace.role !== "viewer";
  const implementation = assembly?.implementation;
  const rows = useMemo(
    () =>
      implementationParts({
        parts: parts.data ?? [],
        statements: assembly?.statements ?? [],
        contributions: (assembly?.contributions ?? []).map(({ record }) => record),
      }),
    [parts.data, assembly],
  );
  const items = rows.filter((row) => row.partId);
  const written = items.filter((row) => row.statementId).length;
  const read = [detail, parts, parameters, choices];
  return (
    <Stack space="space.200">
      {/* The program's values: where they cannot be read the placeholders stand under the alert. */}
      <ReportFailures queries={[programValues]} />
      <Inline space="space.200" alignBlock="center" shouldWrap>
        {chooser}
        <Text>
          SSP {plan.version_number} · {statusLabel(revisionStates, plan.state)}
        </Text>
        {assembly && items.length > 0 && (
          <Inline space="space.100" alignBlock="center">
            <Text>Narrative</Text>
            <Meter value={written} max={items.length} />
            <Text color="color.text.subtle">parts</Text>
          </Inline>
        )}
      </Inline>
      <QueryState queries={[...context, ...read]}>
        {assembly && parts.data ? (
          <Stack as="ol" space="space.0" aria-label="Control implementation by part">
            {rows.map((row) => (
              <PartRow
                key={row.partId ?? "summary"}
                row={row}
                programId={programId}
                controlId={controlId}
                assembly={assembly}
                systems={systems}
                placeholders={placeholders}
                parameters={parameters.data ?? []}
                valuesKnown={programValues.isSuccess}
                editable={editable}
                onEdit={(next) =>
                  setEditor({
                    ...next,
                    description: `${assembly.code} · ${row.label ?? "Summary"}`,
                  })
                }
                planId={plan.id}
                selectionId={selectionId}
              />
            ))}
          </Stack>
        ) : null}
      </QueryState>
      {editor && (
        <ProductRecordDialog
          table={editor.table}
          existing={editor.existing}
          initialValues={editor.initialValues}
          operationLabel={editor.operationLabel}
          description={editor.description}
          onClose={() => setEditor(undefined)}
        />
      )}
    </Stack>
  );
}

type ParameterRow = Pick<Row<"parameters">, "id" | "source_id" | "label">;

function PartRow({
  row,
  programId,
  controlId,
  assembly,
  systems,
  placeholders,
  parameters,
  valuesKnown,
  editable,
  onEdit,
  planId,
  selectionId,
}: {
  row: ImplementationPart;
  programId: string;
  controlId: string;
  assembly: SspControlAssembly;
  systems: readonly ProgramSystem[];
  placeholders: ParameterPlaceholders;
  parameters: readonly ParameterRow[];
  /** The program's values are read: a parameter with none is Not set, never while they load. */
  valuesKnown: boolean;
  editable: boolean;
  onEdit: (editor: Omit<Editor, "description">) => void;
  planId: string;
  selectionId: string;
}) {
  const implementation = assembly.implementation;
  const statement = row.statementId
    ? assembly.statements.find((item) => item.id === row.statementId)
    : undefined;
  const narrative = row.partId ? statement?.description : implementation?.description;
  const contributions = assembly.contributions.filter(({ record }) =>
    row.contributionIds.includes(record.id),
  );
  const prose = useMemo(() => new Map([[controlId, placeholders]]), [controlId, placeholders]);
  // The parameters the part's text inserts that the program sets no value for.
  const unset = valuesKnown
    ? insertedParameters(row.prose).flatMap((id) => {
        const entry = placeholders.get(id);
        if (!entry || entry.readings?.some((reading) => reading.values.length)) return [];
        return parameters.filter((parameter) => parameter.id === entry.parameter.id);
      })
    : [];
  const action = (() => {
    if (!editable) return null;
    if (!row.partId)
      return implementation ? (
        <Button
          variant="link"
          size="small"
          onClick={() =>
            onEdit({
              table: "implemented_requirements",
              existing: implementation as DataRecord,
              initialValues: { ssp_revision_id: planId, selected_control_id: selectionId },
              operationLabel: narrative ? "Edit narrative" : "Write narrative",
            })
          }
        >
          {narrative ? "Edit narrative" : "Write narrative"}
        </Button>
      ) : (
        <Button
          variant="link"
          size="small"
          onClick={() =>
            onEdit({
              table: "implemented_requirements",
              initialValues: { ssp_revision_id: planId, selected_control_id: selectionId },
            })
          }
        >
          Create control implementation
        </Button>
      );
    // A part's narrative hangs off the control implementation, written first.
    if (!implementation) return null;
    return (
      <Button
        variant="link"
        size="small"
        onClick={() =>
          onEdit({
            table: "implementation_statements",
            ...(statement ? { existing: statement as DataRecord } : {}),
            initialValues: {
              ssp_revision_id: planId,
              implemented_requirement_id: implementation.id,
              control_part_id: row.partId,
            },
            operationLabel: statement ? "Edit narrative" : "Write narrative",
          })
        }
      >
        {statement ? "Edit narrative" : "Write narrative"}
      </Button>
    );
  })();
  return (
    <Box as="li" paddingBlock="space.150" className="border-b">
      <Grid
        templateColumns="repeat(auto-fit, minmax(min(100%, 240px), 1fr))"
        columnGap="space.300"
        rowGap="space.100"
      >
        <Inline space="space.100" alignBlock="baseline">
          <Text color="color.text.subtle" numeric className="shrink-0">
            {row.label ?? "Summary"}
          </Text>
          {row.prose && (
            <ControlProse text={row.prose} controlId={controlId} placeholders={prose} />
          )}
        </Inline>
        <Stack space="space.100" className="min-w-0">
          {narrative ? (
            <Prose>{narrative}</Prose>
          ) : (
            <Text color="color.text.warning">
              {row.partId || implementation ? "No narrative" : "No control implementation"}
            </Text>
          )}
          {contributions.map(({ record, component, element }) => {
            const elementCode = element && systems.find((system) => system.id === element.id)?.code;
            return (
              <Inline key={record.id} space="space.100" alignBlock="center" shouldWrap>
                {component ? (
                  <RecordLink
                    table="system_components"
                    record={{ id: component.id, program_id: programId }}
                  >
                    {elementCode ? `${elementCode} ${component.name}` : component.name}
                  </RecordLink>
                ) : (
                  <Absent label="Component unavailable" />
                )}
                <StatusBadge
                  statuses={implementationStatuses}
                  value={record.implementation_status}
                />
                {record.responsible_party_id && (
                  <Text color="color.text.subtle">
                    <RelationName table="parties" id={record.responsible_party_id} />
                  </Text>
                )}
              </Inline>
            );
          })}
          {unset.map((parameter) => (
            <Inline key={parameter.id} space="space.100" alignBlock="baseline" shouldWrap>
              <Text color="color.text.subtle">
                Parameter {parameter.source_id}
                {parameter.label ? `, ${parameter.label}` : ""}
              </Text>
              <Text color="color.text.warning">Not set</Text>
            </Inline>
          ))}
          {action && <Box>{action}</Box>}
        </Stack>
      </Grid>
    </Box>
  );
}
