import { MissingRecord } from "@/components/prototype/work-common";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  KeyValue,
  PageHeader,
  Stack,
  TextLink,
} from "@ledger/design-system";
import { Download } from "lucide-react";
import { useRow, useRows } from "@/lib/models";
import { ProgramQueryState } from "@/components/prototype/program-shared";
export const Route = createFileRoute("/programs/$programId_/export")({
  head: () => ({ meta: [{ title: "Program export — Program Assurance" }] }),
  component: ProgramExport,
});
function ProgramExport() {
  const { programId } = Route.useParams();
  const program = useRow("programs", programId);
  const systems = useRows("systems", { program_id: programId });
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const plans = useRows("ssp_revisions");
  const evidence = useRows("evidence_artifacts", { program_id: programId });
  const assessments = useRows("assessment_campaigns", { program_id: programId });
  const risks = useRows("risks", { program_id: programId });
  const tasks = useRows("tasks", { program_id: programId });
  const queries = [program, systems, requirements, plans, evidence, assessments, risks, tasks];
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;
  const systemIds = new Set(systems.data?.map((system) => system.id));
  const programPlans = plans.data?.filter((plan) => systemIds.has(plan.system_id));
  function download() {
    if (loading || error || !program.data) return;
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
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${program.data.code}-register.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  if (program.isSuccess && !program.data)
    return <MissingRecord backTo="/programs" kind="Program" />;
  return (
    <Stack space="space.250">
      <PageHeader>
        <PageHeader.Lead render={<Breadcrumb />}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/programs/$programId" params={{ programId }} />}>
                {program.data?.name ?? "Program"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Program transfer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeader.Lead>
        <PageHeader.Heading>
          <PageHeader.Title>Program transfer</PageHeader.Title>
        </PageHeader.Heading>
        <PageHeader.Actions>
          <Button
            iconBefore={<Download />}
            variant="primary"
            onClick={download}
            disabled={loading || !!error || !program.data}
          >
            Export record register
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <ProgramQueryState queries={queries}>
        <>
          <p className="text-subtle">
            Download this program’s recorded register as JSON. The register includes program and
            system records, requirement identities, SSP revision metadata, evidence metadata,
            assessments, risks, and tasks. Evidence files and full OSCAL documents are managed in
            their respective libraries.
          </p>
          <KeyValue label="Systems">{systems.data?.length}</KeyValue>
          <KeyValue label="Requirement identities">{requirements.data?.length}</KeyValue>
          <KeyValue label="Security plan revisions">{programPlans?.length}</KeyValue>
          <KeyValue label="Evidence artifacts">{evidence.data?.length}</KeyValue>
        </>
      </ProgramQueryState>
    </Stack>
  );
}
