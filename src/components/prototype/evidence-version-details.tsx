import type { ReactNode, Ref } from "react";
import { Clock } from "lucide-react";
import {
  Absent,
  DateLabel,
  DateTime,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Id,
  KeyValue,
  Prose,
  Section,
  Stack,
  TextLink,
  Timeline,
  formatFileSize,
  useLedgerLocale,
} from "@ledger/design-system";
import { EvidenceFile } from "@/components/app/evidence-file";
import { StatusBadge } from "@/components/app/status";
import { useCollection } from "@/lib/collections";
import { useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { evidenceReviewDecisions, revisionStates } from "@/lib/status";
import { QueryState } from "./work-common";

/**
 * Evidence facts as one definition list, with a label column wide enough for "External reference"
 * and "Applicability rationale", and nothing as a labelled Absent.
 */
export function EvidenceFacts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <KeyValue.Group labelWidth="wide">
      {facts.map(([name, value]) => (
        <KeyValue key={name} label={name} wrap>
          {value === null || value === undefined || value === "" ? <Absent /> : value}
        </KeyValue>
      ))}
    </KeyValue.Group>
  );
}

/**
 * An evidence version's external reference: a link that opens in a new tab and says so when it is
 * a web address, and the reference as text when it is not. An address shown as the link's words
 * breaks anywhere, so a long one wraps inside its row.
 */
export function ExternalReference({
  uri,
  children,
}: {
  uri: string | null | undefined;
  /** The link's words; the address itself when unsaid. */
  children?: string | undefined;
}) {
  if (!uri) return null;
  if (!/^https?:\/\//i.test(uri)) return <Id className="break-all">{uri}</Id>;
  return (
    <TextLink href={uri} newTab {...(children ? {} : { className: "break-all" })}>
      {children ?? uri}
    </TextLink>
  );
}

/**
 * A stored file's size as a reader says it, with the exact byte count beside it for a size that
 * rounds: "2.5 MB (2,457,600 bytes)".
 */
export function FileSize({ bytes }: { bytes: number }) {
  const { locale, formatPlural } = useLedgerLocale();
  const size = formatFileSize(bytes, { locale });
  if (bytes < 1000) return <>{size}</>;
  return (
    <>
      {size} ({formatPlural(bytes, { one: "{count} byte", other: "{count} bytes" })})
    </>
  );
}

/** A decision's moment on the review feed: the day and minute in the reader's zone, in full on hover. */
function useReviewTime() {
  const { formatDate } = useLedgerLocale();
  return (value: string | null) => {
    if (!value) return { time: "Date not recorded" };
    const instant = new Date(value);
    return {
      time: formatDate(instant, { dateStyle: "medium", timeStyle: "short" }),
      timeTitle: formatDate(instant, { dateStyle: "full", timeStyle: "long" }),
      dateTime: value,
    };
  };
}

/**
 * A version's review decisions as a feed, newest first: each decision, who made it, when, and why.
 * With none, the version is waiting on a reviewer, which is not the same as finished work.
 */
export function EvidenceReviews({ versionId }: { versionId: string }) {
  const reviews = useRows("evidence_reviews", { evidence_version_id: versionId });
  const parties = useRows("parties");
  const reviewTime = useReviewTime();
  const sorted = [...(reviews.data ?? [])].sort((a, b) =>
    (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at),
  );
  return (
    <Section title="Reviews">
      <QueryState queries={[reviews, parties]}>
        {sorted.length ? (
          <Timeline label="Reviews" wrap>
            {sorted.map((review) => (
              <Timeline.Item
                key={review.id}
                title={<StatusBadge statuses={evidenceReviewDecisions} value={review.decision} />}
                meta={
                  parties.data?.find((party) => party.id === review.reviewer_party_id)?.name ??
                  "Unavailable reviewer"
                }
                {...reviewTime(review.reviewed_at)}
              >
                {review.rationale ? <Prose>{review.rationale}</Prose> : null}
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty size="compact">
            <EmptyMedia variant="icon" aria-hidden>
              <Clock />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Not reviewed yet</EmptyTitle>
              <EmptyDescription>
                A reviewer records a decision for this exact evidence version.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </QueryState>
    </Section>
  );
}

/** The same pinned evidence content in the picker, linked preview and upload flow. */
export function EvidenceVersionDetails({
  artifact,
  version,
  showFile = true,
  onFileBusyChange,
  onFileDirtyChange,
  triggerRef,
}: {
  artifact: Row<"evidence_artifacts">;
  version: Row<"evidence_versions">;
  showFile?: boolean;
  onFileBusyChange?: ((busy: boolean) => void) | undefined;
  onFileDirtyChange?: ((dirty: boolean) => void) | undefined;
  /** The file control, for the surrounding dialog's `initialFocus`. */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}) {
  const parties = useRows("parties");
  const schema = useCollection("evidence_versions");
  const collection = schema.data;
  return (
    <Stack space="space.250">
      <Section title="Artifact">
        <EvidenceFacts
          facts={[
            ["Description", artifact.description ? <Prose>{artifact.description}</Prose> : null],
            ["Kind", labelFor(artifact.artifact_kind)],
            [
              "Owner",
              artifact.owner_party_id
                ? (parties.data?.find((party) => party.id === artifact.owner_party_id)?.name ??
                  "Unavailable owner")
                : null,
            ],
          ]}
        />
      </Section>
      <Section title={`Version ${version.version_number}`}>
        <EvidenceFacts
          facts={[
            ["State", <StatusBadge statuses={revisionStates} value={version.state} />],
            ["Collected", version.collected_at ? <DateTime value={version.collected_at} /> : null],
            ["Published", version.published_at ? <DateTime value={version.published_at} /> : null],
            [
              "Expires",
              version.expires_at ? <DateLabel kind="expiry" value={version.expires_at} /> : null,
            ],
            [
              "External reference",
              version.external_uri ? <ExternalReference uri={version.external_uri} /> : null,
            ],
            ["Media type", version.media_type],
            [
              "Size",
              typeof version.byte_size === "number" ? <FileSize bytes={version.byte_size} /> : null,
            ],
            ["SHA-256", version.sha256 ? <Id className="break-all">{version.sha256}</Id> : null],
          ]}
        />
        {/* Authored text reads as a paragraph at every width, not squeezed beside a label. */}
        {version.provenance ? <Prose label="Provenance">{version.provenance}</Prose> : null}
      </Section>
      <EvidenceReviews versionId={version.id} />
      {showFile ? (
        // The file region keeps its place while the record schema loads, and says so if it fails.
        <QueryState queries={[schema]} retryLabel="Retry loading the evidence file">
          {collection ? (
            <EvidenceFile
              collection={collection}
              record={version as DataRecord}
              onBusyChange={onFileBusyChange}
              onDirtyChange={onFileDirtyChange}
              triggerRef={triggerRef}
            />
          ) : null}
        </QueryState>
      ) : null}
    </Stack>
  );
}
