import type { EvidenceArtifact } from "@/lib/evidence-catalog";
import { defineColumns, RecordBrowser } from "@ledger/design-system";
import type { ReactNode } from "react";
import { EvidenceRecordDetails } from "./evidence-record-details";

const columns = defineColumns<EvidenceArtifact>((c) => [
  c.id("id", { header: "Evidence", width: 112, hideable: false }),
  c.text("label", { header: "Artifact", minWidth: 240, hideable: false }),
  c.text("kind", { header: "Type", width: 132 }),
  c.status("review", {
    header: "Review",
    width: 152,
    tone: (row) =>
      row.review === "Accepted"
        ? "success"
        : row.review === "Needs revision"
          ? "danger"
          : "warning",
  }),
  c.person("owner", { header: "Owner", width: 160 }),
  c.text("collected", { header: "Collected", width: 120 }),
]);

export function EvidenceBrowser({
  records,
  description,
  onClose,
  onLink,
  context,
  actions,
}: {
  records: EvidenceArtifact[];
  description: string;
  onClose: () => void;
  onLink: (records: EvidenceArtifact[]) => void | Promise<void>;
  context?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <RecordBrowser
      open
      onClose={onClose}
      title="Add evidence"
      description={description}
      records={records}
      columns={columns}
      filters={["kind", "review", "owner"]}
      recordTitle={(record) => record.label}
      renderPreview={(record) => <EvidenceRecordDetails artifact={record} />}
      onConfirm={onLink}
      confirmLabel="Link evidence"
      context={context}
      actions={actions}
    />
  );
}
