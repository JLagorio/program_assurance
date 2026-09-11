import { evidenceScopeNames, evidenceSupportRows } from "@/lib/evidence-presentation";
import type { EvidenceArtifact } from "@/lib/evidence-catalog";
import { Badge, KeyValue, Section, Stack, TextLink } from "@ledger/design-system";

/** The actual evidence metadata, reusable inside a chooser or a record preview. */
export function EvidenceRecordDetails({ artifact }: { artifact: EvidenceArtifact }) {
  const supports = evidenceSupportRows(artifact);
  const url = artifact.url && /^https?:\/\//i.test(artifact.url) ? artifact.url : undefined;
  return (
    <Stack space="space.250">
      <div>
        <KeyValue wrap label="Type">
          {artifact.kind}
        </KeyValue>
        <KeyValue wrap label="Review">
          <Badge
            tone={
              artifact.review === "Accepted"
                ? "success"
                : artifact.review === "Needs revision"
                  ? "danger"
                  : "warning"
            }
          >
            {artifact.review}
          </Badge>
        </KeyValue>
        <KeyValue wrap label="Owner">
          {artifact.owner}
        </KeyValue>
        <KeyValue wrap label="Collected">
          {artifact.collected}
        </KeyValue>
        <KeyValue wrap label="Version">
          {artifact.version}
        </KeyValue>
        <KeyValue wrap label="Valid through">
          {artifact.validThrough || "Not recorded"}
        </KeyValue>
        <KeyValue wrap label="Scope">
          {evidenceScopeNames(artifact).join(", ") || "Program"}
        </KeyValue>
      </div>
      <Section title="Artifact">
        <p className="whitespace-pre-wrap break-words font-body">
          {artifact.provenance || "No description recorded."}
        </p>
        <p className="mt-100 break-all font-body-small text-subtle">
          {artifact.referenceUri || url || "No artifact location recorded."}
        </p>
        {url ? (
          <TextLink
            className="mt-100"
            render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          >
            Open artifact in new tab
          </TextLink>
        ) : null}
        {artifact.sha256 ? (
          <p className="mt-100 break-all font-body-small text-subtle">SHA-256: {artifact.sha256}</p>
        ) : null}
      </Section>
      <Section title="Review">
        <p className="font-body-small text-subtle">
          {artifact.reviewedBy
            ? `${artifact.reviewedBy} — ${artifact.reviewedOn ?? "Date not recorded"}`
            : "No reviewer recorded"}
        </p>
        <p className="mt-100 whitespace-pre-wrap break-words font-body">
          {artifact.reviewNote || "No review notes."}
        </p>
      </Section>
      <Section title="Supporting records" count={supports.length}>
        <div className="divide-y divide-default">
          {supports.map((row) => (
            <div key={row.key} className="py-100">
              <p className="font-body-small text-subtle">
                {row.kind} — {row.link.id}
              </p>
              <p className="break-words font-body">{row.title}</p>
              <p className="break-words font-body-small text-subtle">{row.context}</p>
            </div>
          ))}
        </div>
        {!supports.length ? (
          <p className="font-body text-subtle">No supporting relationships yet.</p>
        ) : null}
      </Section>
    </Stack>
  );
}
