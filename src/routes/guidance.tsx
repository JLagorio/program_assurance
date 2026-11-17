// The Library's Guidance: the supplemental guidance beside the control catalog, the reference
// frameworks NIST SP 800-160 prints (its cyber resiliency constructs, the ATT&CK techniques of
// Appendices F and G, and the system life cycle processes of Vol. 1), one line a framework: its
// name, the publication it is printed in and the day that was published. A framework has no page
// of its own, so its name opens its preview: the publication, its version, who it comes from,
// whether this copy is the publisher's own or a transcription, the document it was read from and
// what the workspace may do with it. It reads `framework_rows` once (`useFrameworks`), a few rows.
//
// The pass-six board (docs/ux-proposal-2026-11/mocks/lib-guidance.html) draws more than the reads
// answer yet: the frameworks grouped under their publication, what each holds by kind, how many
// controls it ties, where it is in use, and the controls it ties by family.

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DateTime, KeyValue, PageHeader, Prose, Stack, TextLink } from "@ledger/design-system";
import { useFrameworks, type Framework } from "@/lib/frameworks";
import type { DataRecord } from "@/lib/records";
import { Page } from "@/components/app/shell";
import { RecordPreviewActions, RecordPreviewPanel } from "@/components/prototype/record-preview";
import { ModelTable, type DisplayColumn } from "@/components/prototype/record-tools";

export const Route = createFileRoute("/guidance")({
  head: () => ({ meta: [{ title: "Guidance — Program Assurance" }] }),
  component: GuidancePage,
});

/** The publication a framework is printed in, as its source document names it. */
const publication = (row: DataRecord) =>
  (row as unknown as Framework).source_document.title ?? null;

/** The day the publication was published. */
const published = (row: DataRecord) =>
  (row as unknown as Framework).source_document.published ?? null;

/** The register's columns, one list for every render. */
const columns: DisplayColumn[] = [
  { key: "title", label: "Guidance", minWidth: 220 },
  { key: "publication", label: "Publication", kind: "text", width: 280, value: publication },
  { key: "published", label: "Published", kind: "date", width: 140, value: published },
];

/**
 * The frameworks as the publications print them: by the day each was published, a volume's
 * constructs before its appendices (Vol. 2's cyber resiliency constructs, then Appendices F and G,
 * then Vol. 1's processes).
 */
const inPrintedOrder = (frameworks: readonly Framework[]) =>
  [...frameworks].sort(
    (a, b) =>
      (a.source_document.published ?? "").localeCompare(b.source_document.published ?? "") ||
      Number(b.code.endsWith("-cref")) - Number(a.code.endsWith("-cref")) ||
      a.code.localeCompare(b.code),
  );

/** What a framework's copy is: the publisher's own, or a transcription of it. */
const kinds = { true: "Authoritative", false: "Mirror or derived" } as const;

function GuidancePage() {
  const frameworks = useFrameworks();
  const [preview, setPreview] = useState<DataRecord | null>(null);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  const rows = useMemo(
    () => inPrintedOrder(frameworks.data ?? []) as unknown as DataRecord[],
    [frameworks.data],
  );
  const shown = preview
    ? ((frameworks.data ?? []).find((row) => row.id === preview.id) ?? null)
    : null;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Guidance</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <ModelTable
        model="frameworks"
        queries={[frameworks]}
        rows={rows}
        columns={columns}
        selectedId={preview?.id}
        onPreview={setPreview}
        onDisplayedRowsChange={setDisplayed}
        fill
        searchLabel="Find guidance"
        noun={{ one: "framework", other: "frameworks" }}
        view="library-guidance"
        empty={{
          illustration: "document",
          title: "No guidance loaded",
          description: "Its reference data is not loaded in this workspace.",
        }}
      />
      {preview && shown && (
        <RecordPreviewPanel
          title={shown.title}
          label="Guidance preview"
          defaultWidth={560}
          onClose={() => setPreview(null)}
          navigation={
            <RecordPreviewActions
              table="frameworks"
              record={preview}
              rows={displayed}
              onSelect={setPreview}
            />
          }
        >
          <Stack space="space.200">
            <KeyValue.Group>
              {shown.source_document.title && (
                <KeyValue label="Publication" wrap>
                  {shown.source_document.title}
                </KeyValue>
              )}
              {shown.source_document.published && (
                <KeyValue label="Published">
                  <DateTime value={shown.source_document.published} format="date" />
                </KeyValue>
              )}
              <KeyValue label="Version">{shown.version}</KeyValue>
              <KeyValue label="Authority" wrap>
                {shown.authority}
              </KeyValue>
              <KeyValue label="Kind">{kinds[shown.authoritative ? "true" : "false"]}</KeyValue>
              {shown.source_document.url && (
                <KeyValue label="Document" wrap>
                  <TextLink href={shown.source_document.url} newTab>
                    {shown.source_document.url.split("/").at(-1) ?? shown.source_document.url}
                  </TextLink>
                </KeyValue>
              )}
            </KeyValue.Group>
            {shown.rights && <Prose label="Rights">{shown.rights}</Prose>}
            {shown.notes && <Prose label="Notes">{shown.notes}</Prose>}
          </Stack>
        </RecordPreviewPanel>
      )}
    </Page>
  );
}
