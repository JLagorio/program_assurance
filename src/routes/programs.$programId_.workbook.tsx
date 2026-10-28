import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/workbook")({
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    sheet?: string | undefined;
    reviewRow?: string | undefined;
    reviewColumn?: string | undefined;
  } => ({
    sheet: typeof search["sheet"] === "string" ? search["sheet"] : undefined,
    reviewRow: typeof search["reviewRow"] === "string" ? search["reviewRow"] : undefined,
    reviewColumn: typeof search["reviewColumn"] === "string" ? search["reviewColumn"] : undefined,
  }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return <ProgramWorkspace programId={programId} tab="Requirements" view="Workbook" />;
}
