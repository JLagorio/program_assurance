import { useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  AsideLayout,
  DropdownMenuLinkItem,
  Id,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { ShieldCheck } from "lucide-react";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { controlPrograms, useAssuranceTrace } from "@/lib/assurance-trace";
import { useProgramControlStatus } from "@/lib/control-status";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import { useParameterChoices } from "@/lib/parameter-reads";
import { controlPublicationStatuses, controlStatuses } from "@/lib/status";
import { TraceBand } from "./assurance-trace";
import { ControlResiliency } from "./control-resiliency";
import { ControlThreats } from "./control-threats";
import { ControlLinks, ControlStatement, ParameterGroup } from "./library-controls";
import { ControlStandingFacts } from "./control-status";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { RecordTrail, TrailLink } from "./record-trail";
import { EmptyMessage, MissingRecord, QueryState, RecordActions } from "./work-common";

type Control = Row<"controls">;

/** A control's family and edition, and the control it enhances: its Details, wherever it is read. */
function useControlContext(control: Control | null | undefined) {
  const family = useRow("catalog_groups", control?.group_id);
  const edition = useRow("catalog_revisions", control?.catalog_revision_id);
  // An edition reads as its catalog's short title and its version, as the Catalog's picker does.
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
 * the links, each closed until asked for.
 */
function ControlText({
  control,
  programId,
  children,
}: {
  control: Control;
  /** The program the control is read in: a technique then opens its Control baseline. */
  programId?: string | undefined;
  children?: ReactNode;
}) {
  const parts = useRows("control_parts", { control_id: control.id });
  const parameters = useRows("parameters", { control_id: control.id });
  const choices = useParameterChoices(parameters.data);
  const links = useRows("control_links", { control_id: control.id });
  const has = (roots: readonly string[]) =>
    (parts.data ?? []).some((part) => part.parent_part_id === null && roots.includes(part.name));
  const statement = ["overview", "statement", "guidance"] as const;
  const objectives = ["assessment-objective", "assessment-method"] as const;
  return (
    <>
      <QueryState queries={[parts, parameters, choices]}>
        {has(statement) ? (
          <ControlStatement
            parts={parts.data ?? []}
            parameters={parameters.data ?? []}
            choices={choices.data ?? []}
            roots={statement}
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
  requirements: number;
  evidenced: number;
  issues: number;
  risks: number;
};

/** Where the workspace's programs stand on a control: one row a program that has a requirement meeting it. */
function ControlPrograms({ control }: { control: Control }) {
  const open = useOpenRecord();
  const trace = useAssuranceTrace({ kind: "control", id: control.id });
  const lines = useMemo(() => (trace.data ? controlPrograms(trace.data) : []), [trace.data]);
  const programs = useRows(
    "programs",
    { id: idSet(lines.map((line) => line.programId)) },
    { columns: ["id", "code", "name"], enabled: trace.isSuccess },
  );
  const rows = useMemo<ProgramLine[]>(() => {
    const byId = new Map((programs.data ?? []).map((program) => [program.id, program]));
    return lines
      .flatMap((line) => {
        const program = byId.get(line.programId);
        return program ? [{ ...line, id: program.id, name: program.name, code: program.code }] : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lines, programs.data]);
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
        c.number("requirements", { header: "Requirements", width: 130, priority: 1 }),
        c.number("evidenced", { header: "With evidence", width: 130, priority: 2 }),
        c.number("issues", { header: "Open issues", width: 120, priority: 3 }),
        c.number("risks", { header: "Open risks", width: 120, priority: 4 }),
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
        queries={[trace, programs]}
        onRowClick={(row) => open("controls", { id: control.id, program_id: row.id })}
        empty={{
          title: "No program meets this control yet",
          description: "A program appears here once one of its requirements maps the control.",
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
              <RecordTrail current={control.title}>
                <TrailLink to="/catalog">Catalog</TrailLink>
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
              <PageHeader.Heading>
                <PageHeader.Title>{control.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                {/* A catalog control is shared reference data: nobody in the workspace edits it. */}
                <RecordActions table="controls" id={id} readOnly />
              </PageHeader.Actions>
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

/**
 * A control inside a program: the requirements that meet it there, their evidence, and what was
 * found and is being done, as its trace; then its text. For a control the program has not written
 * an implementation for; an implemented control opens its implementation record, which starts
 * with the same band.
 */
export function ProgramControl({ programId, controlId }: { programId: string; controlId: string }) {
  const query = useRow("controls", controlId);
  const program = useRow("programs", programId);
  const trace = useAssuranceTrace({ kind: "control", id: controlId, programId });
  // Where the program stands on the control: one read for the whole baseline, which the Overview
  // and the Control status view share, so the page opens on what the reader came from.
  const statuses = useProgramControlStatus(programId);
  const standing = statuses.data?.controls.find((item) => item.id === controlId);
  const control = query.data;
  return (
    <Page>
      <QueryState queries={[query, program]} shape="record" region>
        {control && program.data ? (
          <>
            <PageHeader>
              <RecordTrail current={control.title}>
                <TrailLink to="/programs">Programs</TrailLink>
                <TrailLink to="/programs/$programId" params={{ programId }}>
                  {`${program.data.code} · ${program.data.name}`}
                </TrailLink>
                <TrailLink
                  to="/programs/$programId"
                  params={{ programId }}
                  search={{ tab: "Controls" }}
                >
                  Controls
                </TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{control.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions table="controls" id={controlId} readOnly>
                  <DropdownMenuLinkItem
                    closeOnClick
                    render={<Link to="/catalog/controls/$controlId" params={{ controlId }} />}
                  >
                    Open catalog control
                  </DropdownMenuLinkItem>
                </RecordActions>
              </PageHeader.Actions>
            </PageHeader>
            <TraceBand
              trace={trace}
              kind="control"
              name={`the control ${control.code} ${control.title}`}
              programId={programId}
            />
            <AsideLayout
              aside={
                <ControlDetails
                  control={control}
                  programId={programId}
                  summary={
                    standing ? (
                      <StatusBadge statuses={controlStatuses} value={standing.status} />
                    ) : undefined
                  }
                  standing={
                    <ControlStandingFacts
                      programId={programId}
                      controlId={controlId}
                      requirements={trace.data?.requirements}
                    />
                  }
                >
                  <KeyValue label="Catalog record" wrap>
                    <TextLink
                      render={<Link to="/catalog/controls/$controlId" params={{ controlId }} />}
                    >
                      {control.code}
                    </TextLink>
                  </KeyValue>
                </ControlDetails>
              }
            >
              <Stack space="space.300" className="min-w-0">
                <ControlText control={control} programId={programId}>
                  <Enhancements control={control} programId={programId} />
                </ControlText>
              </Stack>
            </AsideLayout>
          </>
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
