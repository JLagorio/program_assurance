import { useState } from "react";
import { ArrowRight, Check, GitBranch, LockKeyhole } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Count,
  Grid,
  Inline,
  Section,
  Stack,
  Table,
  Text,
} from "@ledger/design-system";
import type { Source, Update } from "./vision-data";

type UpdateReviewViewProps = {
  sources: Source[];
  updates: Update[];
  adoptedUpdateIds: string[];
  keptUpdateIds: string[];
  onAdopt: (updateId: string) => void;
  onKeep: (updateId: string) => void;
  onOpenSource: (sourceId: string) => void;
};

export function UpdateReviewView({
  sources,
  updates,
  adoptedUpdateIds,
  keptUpdateIds: keptIds,
  onAdopt,
  onKeep,
  onOpenSource,
}: UpdateReviewViewProps) {
  const [selectedId, setSelectedId] = useState(updates[0]?.id ?? "");
  const selected = updates.find((update) => update.id === selectedId) ?? updates[0];
  const source = sources.find((item) => item.id === selected?.sourceId);
  const adopted = selected ? adoptedUpdateIds.includes(selected.id) : false;
  const kept = selected ? keptIds.includes(selected.id) : false;
  const pendingCount = updates.filter(
    (update) => !adoptedUpdateIds.includes(update.id) && !keptIds.includes(update.id),
  ).length;

  if (!selected) {
    return (
      <Section title="Source releases">
        <Text as="p" color="color.text.subtle" className="pt-150">
          Every source in this draft is pinned to its selected release. New releases will appear
          here for review.
        </Text>
      </Section>
    );
  }

  return (
    <Stack space="space.400" className="min-w-0">
      <Alert tone="information" role="note">
        <GitBranch aria-hidden />
        <AlertTitle>Reuse can evolve without changing an accepted program.</AlertTitle>
        <AlertDescription>
          Source releases arrive as reviewable changes. Each program retains its accepted version
          until it chooses to upgrade; a newer release alone does not invalidate the old one.
        </AlertDescription>
      </Alert>

      <Section
        title="Source releases"
        count={updates.length}
        description={`${pendingCount} awaiting a decision in this draft`}
        action={<Badge variant="secondary">Version pinned</Badge>}
      >
        <Table label="Available source releases" style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <Table.Header>Source / release</Table.Header>
              <Table.Header width={100}>Consumers</Table.Header>
              <Table.Header width={145}>Draft decision</Table.Header>
            </tr>
          </thead>
          <tbody>
            {updates.map((update) => {
              const item = sources.find((candidate) => candidate.id === update.sourceId);
              const isAdopted = adoptedUpdateIds.includes(update.id);
              const isKept = keptIds.includes(update.id);
              return (
                <Table.Row key={update.id} isSelected={selected.id === update.id}>
                  <Table.Cell>
                    <Stack space="space.050" className="py-100">
                      <Button
                        variant="link"
                        className="w-fit whitespace-normal text-left justify-start"
                        aria-pressed={selected.id === update.id}
                        aria-label={`Review ${item?.name ?? update.title} ${update.toVersion}`}
                        onClick={() => setSelectedId(update.id)}
                      >
                        {item?.name ?? update.title}
                      </Button>
                      <Inline space="space.075" alignBlock="center" shouldWrap>
                        <Text size="small" color="color.text.subtle">
                          {update.fromVersion}
                        </Text>
                        <ArrowRight aria-hidden className="size-icon-small icon-subtle" />
                        <Text size="small">{update.toVersion}</Text>
                      </Inline>
                      <Text size="small" color="color.text.subtle">
                        {update.title}
                      </Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>{update.affectedPrograms.length} programs</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="secondary"
                      tone={isAdopted ? "success" : isKept ? "neutral" : "information"}
                    >
                      {isAdopted
                        ? "Proposed for draft"
                        : isKept
                          ? "Current version kept"
                          : "Review available"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Section>

      <Section
        title={source?.name ?? selected.title}
        description={selected.title}
        action={
          <Button variant="link" size="small" onClick={() => onOpenSource(selected.sourceId)}>
            Open source
          </Button>
        }
      >
        <Stack space="space.250" className="pt-150">
          <Text as="p">{selected.summary}</Text>
          <Grid
            templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
            gap="space.250"
          >
            <Stack space="space.100" className="border-l border-default pl-150">
              <Inline space="space.075" alignBlock="center">
                <LockKeyhole aria-hidden className="size-icon-small icon-subtle" />
                <Text size="small" color="color.text.subtle">
                  Accepted source pin
                </Text>
              </Inline>
              <Text weight="medium">{selected.fromVersion}</Text>
              <Text size="small" color="color.text.subtle">
                Retained by existing consumers. Its scope, conditions and evidence validity still
                govern use.
              </Text>
            </Stack>
            <Stack space="space.100" className="border-l border-default pl-150">
              <Inline space="space.075" alignBlock="center" shouldWrap>
                <GitBranch aria-hidden className="size-icon-small icon-subtle" />
                <Text size="small" color="color.text.subtle">
                  {adopted ? "Proposed for draft review" : "Available source release"}
                </Text>
              </Inline>
              <Text weight="medium">{selected.toVersion}</Text>
              <Text size="small" color="color.text.subtle">
                {adopted
                  ? "Proposed for this draft. Source narratives and evidence still show the accepted version until the release is reviewed and accepted."
                  : "Review the changed master implementation before proposing it for this program."}
              </Text>
            </Stack>
          </Grid>

          <Table label={`${source?.name ?? "Source"} release comparison`} style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <Table.Header width={130}>Changed material</Table.Header>
                <Table.Header>Current · {selected.fromVersion}</Table.Header>
                <Table.Header>Proposed · {selected.toVersion}</Table.Header>
              </tr>
            </thead>
            <tbody>
              {selected.changes.map((change, index) => (
                <Table.Row key={`${selected.id}-${index}`}>
                  <Table.Cell className="align-top py-150 whitespace-normal">
                    <Text weight="medium">{change.label}</Text>
                  </Table.Cell>
                  <Table.Cell className="align-top py-150 whitespace-normal">
                    <Text as="p" color="color.text.subtle">
                      {change.before}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="align-top py-150 whitespace-normal">
                    <Text as="p">{change.after}</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Stack>
      </Section>

      <Grid
        templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
        gap="space.300"
        alignItems="start"
      >
        <Section title="Programs to review" count={selected.affectedPrograms.length}>
          <Stack space="space.150" className="pt-150">
            {selected.affectedPrograms.map((program) => (
              <Inline key={program} spread="space-between" alignBlock="start" space="space.100">
                <Text>{program}</Text>
                <Badge variant="secondary">{selected.fromVersion}</Badge>
              </Inline>
            ))}
            <Text size="small" color="color.text.subtle">
              These consumers can review this release independently. Choosing it here affects only
              the current draft.
            </Text>
          </Stack>
        </Section>

        <Section title="Program work stays with the program">
          <Stack space="space.150" className="pt-150">
            {[
              [
                "Local implementation",
                "Program narratives and configuration details remain editable.",
              ],
              [
                "Target assignments",
                "Your selected systems, components and exclusions are retained.",
              ],
              [
                "Local evidence",
                "Integration results and program attachments keep their provenance.",
              ],
              ["Assessment history", "Previous decisions remain tied to the version assessed."],
            ].map(([label, description]) => (
              <Inline key={label} space="space.100" alignBlock="start">
                <Check aria-hidden className="size-icon-small shrink-0 icon-success" />
                <Stack space="space.025">
                  <Text weight="medium">{label}</Text>
                  <Text size="small" color="color.text.subtle">
                    {description}
                  </Text>
                </Stack>
              </Inline>
            ))}
          </Stack>
        </Section>
      </Grid>

      <Stack space="space.150" className="border-t border-default pt-200">
        <Inline spread="space-between" alignBlock="center" shouldWrap space="space.150">
          <Stack space="space.050">
            <Inline space="space.075" alignBlock="center" shouldWrap>
              <Text weight="medium">
                {adopted
                  ? "New version proposed for review"
                  : kept
                    ? "Current source version retained"
                    : "Choose a version for this draft"}
              </Text>
              <Count value={selected.changes.length} />
              <Text size="small" color="color.text.subtle">
                changes reviewed together
              </Text>
            </Inline>
            <Text size="small" color="color.text.subtle" aria-live="polite">
              {adopted
                ? "Accepted source material remains in place. Review the proposed changes and conditions before replacing it."
                : kept
                  ? `This draft keeps ${selected.fromVersion}. You can reconsider the new release at any time.`
                  : "Acceptance and any required assessment follow the draft review."}
            </Text>
          </Stack>
          {!adopted && (
            <Inline space="space.200" alignBlock="center" shouldWrap>
              <Button variant="link" disabled={kept} onClick={() => onKeep(selected.id)}>
                {kept ? `Keeping ${selected.fromVersion}` : "Keep current version"}
              </Button>
              <Button
                variant="primary"
                iconAfter={<ArrowRight />}
                onClick={() => onAdopt(selected.id)}
              >
                Use {selected.toVersion} in this draft
              </Button>
            </Inline>
          )}
          {adopted && (
            <Badge tone="success" appearance="subtle" icon={<Check />}>
              Ready for draft review
            </Badge>
          )}
        </Inline>
      </Stack>
    </Stack>
  );
}
