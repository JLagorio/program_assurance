import { useRecordTitle } from "@/components/app/browser-title";
import { Page, RecordPending } from "@/components/app/shell";
import { QueryValue } from "@/components/prototype/library-shared";
import { ProgramQueryState } from "@/components/prototype/program-shared";
import { ProgramDetailsAside } from "@/components/prototype/program-workspace";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { MissingRecord } from "@/components/prototype/work-common";
import { useRow, useRows } from "@/lib/models";
import {
  Button,
  PageHeader,
  Section,
  Stat,
  downloadText,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

export const Route = createFileRoute("/programs/$programId_/export")({
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramExport,
});

function ProgramExport() {
  const { programId } = Route.useParams();
  const locale = useLedgerLocale();
  const program = useRow("programs", programId);
  useRecordTitle("Program", program.data?.name);
  const systems = useRows("systems", { program_id: programId });
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const plans = useRows("ssp_revisions");
  const evidence = useRows("evidence_artifacts", { program_id: programId });
  const assessments = useRows("assessment_campaigns", { program_id: programId });
  const risks = useRows("risks", { program_id: programId });
  const tasks = useRows("tasks", { program_id: programId });
  const queries = [program, systems, requirements, plans, evidence, assessments, risks, tasks];
  const loading = queries.some((query) => query.data === undefined && !query.isError);
  const failed = queries.some((query) => query.isError);
  const systemIds = new Set(systems.data?.map((system) => system.id));
  const programPlans = plans.data?.filter((plan) => systemIds.has(plan.system_id));
  /** Every collection the file holds, in the order it holds them, with the rows it came from. */
  const collections = [
    { label: "Systems", queries: [systems], rows: systems.data },
    { label: "Requirement identities", queries: [requirements], rows: requirements.data },
    // A plan belongs to the program through its system, so its count waits for both.
    { label: "Security plan revisions", queries: [plans, systems], rows: programPlans },
    { label: "Evidence artifacts", queries: [evidence], rows: evidence.data },
    { label: "Assessment campaigns", queries: [assessments], rows: assessments.data },
    { label: "Risks", queries: [risks], rows: risks.data },
    { label: "Tasks", queries: [tasks], rows: tasks.data },
  ];
  const unavailable = loading
    ? "The register is still loading."
    : failed
      ? "Part of the register could not be loaded. Retry it first."
      : undefined;
  function download() {
    if (unavailable || !program.data) return;
    const filename = `${program.data.code}-register.json`;
    const records = {
      format: "program-assurance-record-register",
      exported_at: new Date().toISOString(),
      program: program.data,
      systems: systems.data,
      engineering_requirements: requirements.data,
      ssp_revisions: programPlans,
      evidence_artifacts: evidence.data,
      assessment_campaigns: assessments.data,
      risks: risks.data,
      tasks: tasks.data,
    };
    const saved = downloadText(JSON.stringify(records, null, 2), filename, {
      type: "application/json",
    });
    if (saved)
      toast.add({
        title: "Record register exported",
        type: "success",
        description: `${filename} holds the program and its ${locale.formatNumber(
          collections.reduce((sum, item) => sum + (item.rows?.length ?? 0), 0),
        )} recorded records.`,
      });
    else
      toast.add({
        title: "The register could not be exported",
        type: "error",
        timeout: 8000,
        description: "This browser did not start the download. Try again.",
      });
  }
  if (program.isSuccess && !program.data)
    return <MissingRecord backTo="/programs" kind="Program" />;
  if (!program.data) return <ProgramQueryState queries={[program]} />;
  const record = program.data;
  return (
    <Page>
      <PageHeader>
        <RecordTrail current="Program transfer">
          <TrailLink to="/programs">Programs</TrailLink>
          <TrailLink to="/programs/$programId" params={{ programId }}>
            {record.code} · {record.name}
          </TrailLink>
        </RecordTrail>
        <PageHeader.Heading>
          <PageHeader.Title>{record.name}</PageHeader.Title>
        </PageHeader.Heading>
        <PageHeader.Actions>
          <Button
            iconBefore={<Download />}
            variant="primary"
            onClick={download}
            {...(unavailable ? { disabledReason: unavailable } : {})}
          >
            Export record register
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <ProgramDetailsAside program={record} />
      {failed && (
        <ProgramQueryState
          queries={queries.filter((query) => query.isError)}
          retryLabel="Retry loading the register"
        />
      )}
      <Section
        title="Record register"
        description="A JSON file of the program and the records below. Evidence files and full OSCAL documents stay in their libraries."
      >
        <Stat.Grid cols={4} role="group" aria-label="Records in the export">
          {collections.map((item) => (
            <Stat.Tile
              key={item.label}
              label={item.label}
              value={
                <QueryValue queries={item.queries}>
                  {() => locale.formatNumber(item.rows?.length ?? 0)}
                </QueryValue>
              }
            />
          ))}
        </Stat.Grid>
      </Section>
    </Page>
  );
}
