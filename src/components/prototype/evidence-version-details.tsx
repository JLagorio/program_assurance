import { KeyValue, Section, Stack } from "@ledger/design-system";
import { EvidenceFile } from "@/components/app/evidence-file";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { DetailFacts, StatusBadge } from "./work-common";
import { displayDate } from "./work-format";

/** The same pinned evidence content in the picker, linked preview and upload flow. */
export function EvidenceVersionDetails({
  artifact,
  version,
  showFile = true,
  onFileBusyChange,
}: {
  artifact: Row<"evidence_artifacts">;
  version: Row<"evidence_versions">;
  showFile?: boolean;
  onFileBusyChange?: ((busy: boolean) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const parties = useRows("parties");
  const reviews = useRows("evidence_reviews", { evidence_version_id: version.id });
  const collection = workspace.collections.find((row) => row.name === "evidence_versions");
  const external = version.external_uri && /^https?:\/\//i.test(version.external_uri);
  return (
    <Stack space="space.250">
      <Section title="Artifact">
        <Stack space="space.150">
          <p className="whitespace-pre-wrap">
            {artifact.description || "No description recorded."}
          </p>
          <DetailFacts
            facts={[
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
        </Stack>
      </Section>
      <Section title={`Version ${version.version_number}`}>
        <DetailFacts
          facts={[
            ["State", <StatusBadge value={version.state} />],
            ["Collected", displayDate(version.collected_at)],
            ["Published", displayDate(version.published_at)],
            ["Provenance", version.provenance],
            ["Expires", displayDate(version.expires_at)],
            [
              "External reference",
              external ? (
                <a
                  href={version.external_uri!}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {version.external_uri}
                </a>
              ) : (
                version.external_uri
              ),
            ],
            ["Media type", version.media_type],
            ["Bytes", version.byte_size],
            ["SHA-256", version.sha256],
          ]}
        />
      </Section>
      <Section title="Reviews">
        {reviews.error ? (
          <p role="alert" className="text-danger">
            {reviews.error.message}
          </p>
        ) : !reviews.data ? (
          <p className="text-subtle">Loading reviews…</p>
        ) : reviews.data.length ? (
          <Stack space="space.150">
            {[...reviews.data]
              .sort((a, b) =>
                (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at),
              )
              .map((review) => (
                <KeyValue key={review.id} label={labelFor(review.decision)} wrap>
                  <Stack space="space.050">
                    <span>
                      {parties.data?.find((party) => party.id === review.reviewer_party_id)?.name ??
                        "Unavailable reviewer"}{" "}
                      · {displayDate(review.reviewed_at)}
                    </span>
                    {review.rationale ? (
                      <p className="whitespace-pre-wrap">{review.rationale}</p>
                    ) : null}
                  </Stack>
                </KeyValue>
              ))}
          </Stack>
        ) : (
          <p className="text-subtle">No review recorded for this version.</p>
        )}
      </Section>
      {showFile && collection ? (
        <EvidenceFile
          collection={collection}
          record={version as DataRecord}
          onBusyChange={onFileBusyChange}
        />
      ) : null}
    </Stack>
  );
}
