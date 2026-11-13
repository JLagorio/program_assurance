import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/compliance")({
  // The requirements document the matrix reads lives in the address, so a reload, Back and a shared
  // link keep it; the matrix's own question rides beside it under the collection's name.
  validateSearch: (search: Record<string, unknown>): { document?: string | undefined } => ({
    ...(typeof search["document"] === "string" ? { document: search["document"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return <ProgramWorkspace programId={programId} tab="Requirements" view="Compliance matrix" />;
}
