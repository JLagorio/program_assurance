import { lazy, Suspense, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Alert,
  AlertDescription,
  Button,
  Inline,
  Item,
  Prose,
  Related,
  Section,
  Spinner,
  Stack,
  Text,
  TextLink,
  type DocumentSelection,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useEvidenceReaderBytes, readerPassageHref } from "@/lib/evidence-reader";
import {
  useAssuranceCitation,
  useAssuranceCitations,
  useAssuranceReviewThreads,
  reviewTargetHref,
  type AssuranceCitation,
  type ReviewTarget,
} from "@/lib/assurance-review";
import { QueryState } from "./work-common";
import { AssuranceCitationDialog } from "./assurance-review-citations";
import {
  AssuranceReviewCreateDialog,
  AssuranceReviewPanel,
  AssuranceReviewThreadDialog,
  AssuranceReviewPaging,
} from "./assurance-review";
const EvidencePdf = lazy(() => import("./evidence-pdf"));
export type EvidenceReaderWorkspaceProps = {
  versionId?: string | undefined;
  citationId?: string | undefined;
  sourceSha?: string | undefined;
  initialLocation?:
    | { page: number; rectangle: { x: number; y: number; width: number; height: number } }
    | undefined;
  target?: ReviewTarget | undefined;
};
export function EvidenceReaderWorkspace({
  versionId,
  citationId,
  sourceSha,
  initialLocation,
  target,
}: EvidenceReaderWorkspaceProps) {
  const citation = useAssuranceCitation(citationId);
  const resolved = citationId ? citation.data?.evidence_version_id : versionId;
  return (
    <Stack space="space.200">
      <TextLink href="/evidence">Back to evidence</TextLink>
      {citationId ? (
        <QueryState queries={[citation]}>
          {citation.data && resolved && (
            <Reader
              key={`${resolved}:${citationId ?? sourceSha ?? ""}`}
              versionId={resolved}
              sourceSha={sourceSha}
              focusedCitation={citation.data}
              initialLocation={initialLocation}
              target={target}
            />
          )}
        </QueryState>
      ) : resolved ? (
        <Reader
          key={`${resolved}:${citationId ?? sourceSha ?? ""}`}
          versionId={resolved}
          sourceSha={sourceSha}
          initialLocation={initialLocation}
          target={target}
        />
      ) : (
        <Alert tone="danger">
          <AlertDescription>Choose an evidence version to read.</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}
function Reader({
  versionId,
  focusedCitation,
  sourceSha,
  initialLocation,
  target,
}: {
  versionId: string;
  focusedCitation?: AssuranceCitation | undefined;
  sourceSha?: string | undefined;
  initialLocation?: EvidenceReaderWorkspaceProps["initialLocation"];
  target?: ReviewTarget | undefined;
}) {
  const workspace = useWorkspace();
  const source = useEvidenceReaderBytes(versionId, focusedCitation, sourceSha);
  const navigate = useNavigate();
  const currentSource =
    source.data &&
    source.data.sha256 === source.data.version.sha256 &&
    source.data.path === source.data.version.storage_object_name;
  const [citationPage, setCitationPage] = useState(0),
    [threadPage, setThreadPage] = useState(0);
  const citations = useAssuranceCitations({ evidenceVersionId: versionId, page: citationPage });
  const threads = useAssuranceReviewThreads({ evidenceVersionId: versionId, page: threadPage });
  const [selection, setSelection] = useState<DocumentSelection | null>(
    initialLocation ? { ...initialLocation, text: "" } : null,
  );
  const [page, setPage] = useState(focusedCitation?.page ?? initialLocation?.page ?? 1);
  const [activeCitation, setActiveCitation] = useState<AssuranceCitation | null>(
      focusedCitation ?? null,
    ),
    [activeThread, setActiveThread] = useState<string | null>(null);
  const [creatingCitation, setCreatingCitation] = useState(false),
    [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null),
    [copyMessage, setCopyMessage] = useState("");
  const rows = [...(citations.data?.rows ?? [])];
  if (focusedCitation && !rows.some((c) => c.id === focusedCitation.id))
    rows.unshift(focusedCitation);
  const anchors = [
    ...rows
      .filter((c) => c.rectangle && c.page && c.evidence_sha256 === source.data?.sha256)
      .map((c) => ({
        id: `citation:${c.id}`,
        label: `Cited passage, page ${c.page}: ${c.passage.slice(0, 100)}`,
        rectangle: c.rectangle!,
        page: c.page!,
        active: activeCitation?.id === c.id,
      })),
    ...(threads.data?.rows ?? []).flatMap((t) =>
      t.target.kind === "passage" && t.target.sha256 === source.data?.sha256
        ? [
            {
              id: `thread:${t.id}`,
              label: `${t.status === "resolved" ? "Resolved" : "Open"} discussion: ${t.subject}`,
              page: t.target.page,
              rectangle: t.target.rectangle,
              active: activeThread === t.id,
            },
          ]
        : [],
    ),
    ...(selection
      ? [
          {
            id: "selection",
            label: "Selected passage",
            rectangle: selection.rectangle,
            page: selection.page,
            active: true,
          },
        ]
      : []),
  ];
  const selectCitation = (citation: AssuranceCitation) => {
    if (
      citation.evidence_sha256 !== source.data?.sha256 ||
      citation.source_storage_object_name !== source.data?.path
    ) {
      void navigate({ to: "/evidence", search: { citation: citation.id, reader: true } });
      return;
    }
    setActiveCitation(citation);
    setActiveThread(null);
    if (citation.page) setPage(citation.page);
  };
  const selectThread = (id: string) => {
    const thread = threads.data?.rows.find((t) => t.id === id);
    if (thread?.target.kind === "passage" && thread.target.sha256 !== source.data?.sha256) {
      void navigate({
        to: "/evidence",
        search: {
          version: versionId,
          reader: true,
          sha256: thread.target.sha256,
          page: thread.target.page,
          rectangle: JSON.stringify(thread.target.rectangle),
        },
      });
      return;
    }
    setActiveCitation(null);
    setActiveThread(id);
    if (thread?.target.kind === "passage") setPage(thread.target.page);
  };
  const aside = (
    <Stack space="space.200">
      {activeCitation ? (
        <>
          <Inline shouldWrap spread="space-between">
            <Text weight="medium">Cited passage</Text>
            <Button size="small" variant="subtle" onClick={() => setActiveCitation(null)}>
              Close passage
            </Button>
          </Inline>
          <Prose label="Quoted passage">{activeCitation.passage}</Prose>
          <TextLink href={reviewTargetHref(activeCitation.target, activeCitation.program_id)}>
            Open supporting record
          </TextLink>
          <AssuranceReviewPanel
            key={activeCitation.id}
            target={{ kind: "citation", recordId: activeCitation.id }}
            title="Passage discussion"
          />
        </>
      ) : activeThread ? (
        <AssuranceReviewThreadDialog
          key={activeThread}
          threadId={activeThread}
          onClose={() => setActiveThread(null)}
          presentation="responsive"
          navigation={{
            position:
              Math.max(
                0,
                (threads.data?.rows ?? []).findIndex((t) => t.id === activeThread),
              ) + 1,
            total: threads.data?.rows.length ?? 0,
            previous:
              (threads.data?.rows ?? []).findIndex((t) => t.id === activeThread) > 0
                ? () =>
                    selectThread(
                      threads.data!.rows[
                        (threads.data?.rows ?? []).findIndex((t) => t.id === activeThread) - 1
                      ]!.id,
                    )
                : undefined,
            next:
              (threads.data?.rows ?? []).findIndex((t) => t.id === activeThread) <
              (threads.data?.rows.length ?? 0) - 1
                ? () =>
                    selectThread(
                      threads.data!.rows[
                        (threads.data?.rows ?? []).findIndex((t) => t.id === activeThread) + 1
                      ]!.id,
                    )
                : undefined,
          }}
        />
      ) : (
        <>
          <QueryState queries={[citations, threads]}>
            <Related
              title="Cited passages"
              layout="list"
              count={citations.data?.count ?? 0}
              empty="No passages cited from this version"
            >
              {rows.map((c) => (
                <Item
                  key={c.id}
                  title={c.passage}
                  meta={c.page ? `Page ${c.page}` : (c.anchor ?? undefined)}
                  onSelect={() => selectCitation(c)}
                />
              ))}
            </Related>
            <AssuranceReviewPaging
              page={citationPage}
              count={citations.data?.count ?? 0}
              onPage={setCitationPage}
            />
            <Related
              title="Passage discussions"
              layout="list"
              count={threads.data?.count ?? 0}
              empty="Select text or a region to discuss it"
            >
              {threads.data?.rows.map((t) => (
                <Item
                  key={t.id}
                  title={t.subject}
                  meta={t.status === "open" ? "Open" : "Resolved"}
                  onSelect={() => selectThread(t.id)}
                />
              ))}
            </Related>
            <AssuranceReviewPaging
              page={threadPage}
              count={threads.data?.count ?? 0}
              onPage={setThreadPage}
            />
          </QueryState>
        </>
      )}
    </Stack>
  );
  return (
    <QueryState queries={[source]}>
      {source.data && (
        <Section
          title={`${source.data.version.artifact.title} · Version ${source.data.version.version_number}`}
        >
          <Stack space="space.150">
            {!currentSource && (
              <Text size="small">
                You are reading a captured source file. To create a new citation or passage
                discussion, open the current evidence version.
              </Text>
            )}
            {copyMessage && (
              <Text role="status" size="small">
                {copyMessage}
              </Text>
            )}
            <Suspense fallback={<Spinner label="Loading document reader" />}>
              <EvidencePdf
                bytes={source.data.bytes}
                initialPage={page}
                anchors={anchors}
                onAnchorActivate={(id) => {
                  if (id.startsWith("citation:")) {
                    const citation = rows.find((c) => c.id === id.slice(9));
                    if (citation) selectCitation(citation);
                  } else if (id.startsWith("thread:")) selectThread(id.slice(7));
                }}
                selection={selection}
                onSelectionChange={setSelection}
                canWrite={workspace.role !== "viewer" && Boolean(currentSource)}
                onCite={() => setCreatingCitation(true)}
                onDiscuss={() => {
                  if (selection)
                    setReviewTarget({
                      kind: "passage",
                      recordId: versionId,
                      sha256: source.data!.sha256.toLowerCase(),
                      page: selection.page,
                      rectangle: selection.rectangle,
                      passage: selection.text,
                    });
                }}
                onCopyLink={() => {
                  if (!selection) return;
                  void navigator.clipboard
                    .writeText(
                      new URL(
                        readerPassageHref(versionId, selection, source.data!.sha256),
                        window.location.origin,
                      ).href,
                    )
                    .then(() => setCopyMessage("Passage link copied."))
                    .catch(() =>
                      setCopyMessage(
                        "The browser could not copy this link. Try again from a secure connection.",
                      ),
                    );
                }}
                aside={aside}
              />
            </Suspense>
            <Text size="small" color="color.text.subtle">
              Select document text, or choose Select region for scanned pages. Region citations ask
              for the quoted passage; scanned text is not automatically transcribed.
            </Text>
          </Stack>
          {creatingCitation && selection && (
            <AssuranceCitationDialog
              target={target}
              initial={{
                evidence: {
                  id: versionId,
                  revision: source.data.version.revision,
                  sha256: source.data.sha256,
                  external_uri: source.data.version.external_uri,
                  storage_object_id: source.data.version.storage_object_id,
                  storage_object_name: source.data.version.storage_object_name,
                  version_number: source.data.version.version_number,
                  artifact: source.data.version.artifact,
                },
                passage: selection.text,
                page: selection.page,
                rectangle: selection.rectangle,
              }}
              onClose={() => setCreatingCitation(false)}
              onCreated={() => {
                setSelection(null);
                setCitationPage(0);
              }}
            />
          )}
          {reviewTarget && (
            <AssuranceReviewCreateDialog
              target={reviewTarget}
              onClose={() => setReviewTarget(null)}
              onCreated={(id) => {
                setActiveThread(id);
                setActiveCitation(null);
                setSelection(null);
              }}
            />
          )}
        </Section>
      )}
    </QueryState>
  );
}
