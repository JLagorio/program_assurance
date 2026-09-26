import type { ReactNode, Ref } from "react";
import { ExternalLink } from "lucide-react";
import {
  Absent,
  DateTime,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  Icon,
  Id,
  Inline,
  KeyValue,
  Prose,
  Section,
  Stack,
  Text,
  TextLink,
  formatFileSize,
} from "@ledger/design-system";
import { EvidenceFile } from "@/components/app/evidence-file";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
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
    <KeyValue.Group labelWidth={168}>
      {facts.map(([name, value]) => (
        <KeyValue key={name} label={name} wrap>
          {value === null || value === undefined || value === "" ? (
            <Absent label="Not recorded" />
          ) : (
            value
          )}
        </KeyValue>
      ))}
    </KeyValue.Group>
  );
}

/**
 * An evidence version's external reference: a link that says it opens in a new tab when it is a
 * web address, and the reference as text when it is not.
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
  if (!/^https?:\/\//i.test(uri)) return <>{uri}</>;
  return (
    <TextLink href={uri} target="_blank" rel="noreferrer">
      {children ?? uri}{" "}
      <Icon label="opens in a new tab">
        <ExternalLink />
      </Icon>
    </TextLink>
  );
}

/** A version's review decisions, newest first, with who decided, when and why. */
export function EvidenceReviews({ versionId }: { versionId: string }) {
  const reviews = useRows("evidence_reviews", { evidence_version_id: versionId });
  const parties = useRows("parties");
  const sorted = [...(reviews.data ?? [])].sort((a, b) =>
    (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at),
  );
  return (
    <Section title="Reviews">
      <QueryState queries={[reviews, parties]}>
        {sorted.length ? (
          <Stack space="space.200">
            {sorted.map((review) => (
              <Stack key={review.id} space="space.050">
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  <StatusBadge statuses={evidenceReviewDecisions} value={review.decision} />
                  <Text>
                    {parties.data?.find((party) => party.id === review.reviewer_party_id)?.name ??
                      "Unavailable reviewer"}
                  </Text>
                  <Text size="small" color="color.text.subtle">
                    <DateTime value={review.reviewed_at} absentLabel="Review date not recorded" />
                  </Text>
                </Inline>
                {review.rationale ? <Prose>{review.rationale}</Prose> : null}
              </Stack>
            ))}
          </Stack>
        ) : (
          <Empty size="compact">
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="done" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Not reviewed yet</EmptyTitle>
              <EmptyDescription>
                Review decisions are recorded for this exact evidence version.
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
  const workspace = useWorkspace();
  const parties = useRows("parties");
  const collection = workspace.collections.find((row) => row.name === "evidence_versions");
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
            ["Expires", version.expires_at ? <DateTime value={version.expires_at} /> : null],
            [
              "External reference",
              version.external_uri ? <ExternalReference uri={version.external_uri} /> : null,
            ],
            ["Media type", version.media_type],
            [
              "Size",
              typeof version.byte_size === "number" ? formatFileSize(version.byte_size) : null,
            ],
            ["SHA-256", version.sha256 ? <Id className="break-all">{version.sha256}</Id> : null],
          ]}
        />
        {/* Authored text reads as a paragraph at every width, not squeezed beside a label. */}
        {version.provenance ? <Prose label="Provenance">{version.provenance}</Prose> : null}
      </Section>
      <EvidenceReviews versionId={version.id} />
      {showFile && collection ? (
        <EvidenceFile
          collection={collection}
          record={version as DataRecord}
          onBusyChange={onFileBusyChange}
          onDirtyChange={onFileDirtyChange}
          triggerRef={triggerRef}
        />
      ) : null}
    </Stack>
  );
}
