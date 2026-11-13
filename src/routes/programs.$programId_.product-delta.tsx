import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/product-delta")({
  // The variant and how its controls are shown live in the address, so a reload, Back and a shared
  // link keep them: the List, or the families when it names none. The List's own question rides
  // beside them under the collection's name, which ProductCollection reads.
  validateSearch: (
    search: Record<string, unknown>,
  ): { system?: string | undefined; show?: "list" | undefined } => ({
    ...(typeof search["system"] === "string" ? { system: search["system"] } : {}),
    show: search["show"] === "list" ? "list" : undefined,
  }),
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return <ProgramWorkspace programId={programId} tab="Controls" view="Product delta" />;
}
