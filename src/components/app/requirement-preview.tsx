import { Section } from "@ledger/design-system";
import { Link } from "@tanstack/react-router";

import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Fact,
  Inline,
  PreviewSheet,
  Stack,
  Text,
  TextLink,
} from "@ledger/design-system";

import { CoverageBar } from "@/components/app/coverage-bar";
import { AllocationTable, ProvenanceTable } from "@/components/app/requirements";
import { useLinkCurrencyVersion } from "@/lib/link-currency";
import { coverageOf, coverageWord, useVerificationVersion } from "@/lib/requirement-verification";
import {
  allocationsFor,
  childrenOfRequirement,
  getRequirement,
  requirementMethodLabel,
  requirementStateTone,
  useRequirementsVersion,
  type Requirement,
} from "@/lib/requirements";

export function RequirementPreviewSheet({
  programId,
  requirementId,
  onClose,
  onAllocate,
  onLinkControls,
  elementId,
}: {
  programId: string;
  elementId?: string | undefined;
  /** The requirement open in the sheet; null closes it. */
  requirementId: string | null;
  onClose: () => void;
  /** Allocation and control relationships are separate actions. */
  onAllocate?: ((requirement: Requirement) => void) | undefined;
  onLinkControls?: ((requirement: Requirement) => void) | undefined;
}) {
  useRequirementsVersion();
  useVerificationVersion();
  useLinkCurrencyVersion();
  const record = requirementId ? getRequirement(requirementId) : undefined;
  const requirement = record?.program === programId ? record : null;
  const allocations = requirement ? allocationsFor(requirement.id) : [];
  const coverage = requirement ? coverageOf(requirement) : null;
  const controls =
    requirement?.derivations.filter(
      (source) => source.sourceType === "Control statement" || source.sourceType === "Overlay",
    ) ?? [];
  const otherSources =
    requirement?.derivations.filter(
      (source) => source.sourceType !== "Control statement" && source.sourceType !== "Overlay",
    ) ?? [];
  const allocate =
    requirement && onAllocate ? (
      <Button size="small" variant="primary" onClick={() => onAllocate(requirement)}>
        Allocate
      </Button>
    ) : undefined;

  return (
    <PreviewSheet
      open={requirement !== null}
      onClose={onClose}
      id={requirement?.id ?? ""}
      title={requirement?.text ?? ""}
      subtitle={
        requirement
          ? `${requirement.type} · revision ${requirement.revision} · ${requirement.owner}`
          : undefined
      }
      status={
        requirement ? (
          <Badge variant="secondary" tone={requirementStateTone[requirement.state]}>
            {requirement.state}
          </Badge>
        ) : undefined
      }
      facts={
        requirement ? (
          <>
            <Fact label="Method">{requirementMethodLabel(requirement)}</Fact>
            <Fact label="Owner">{requirement.owner}</Fact>
            <Fact label="Allocated to">
              {allocations.length} element{allocations.length === 1 ? "" : "s"}
            </Fact>
          </>
        ) : undefined
      }
      openTo={
        <Link
          to="/programs/$programId/requirements/$requirementId"
          params={{ programId, requirementId: requirement?.id ?? "" }}
          search={{ element: elementId }}
        >
          Open the requirement
        </Link>
      }
      links={
        requirement ? (
          <TextLink
            render={
              <Link
                to="/programs/$programId/requirements/$requirementId"
                params={{ programId, requirementId: requirement.id }}
                search={{ tab: "Provenance", element: elementId }}
              />
            }
          >
            Provenance
          </TextLink>
        ) : undefined
      }
      actions={
        <Inline space="space.100">
          {allocate}
          {requirement && onLinkControls ? (
            <Button size="small" onClick={() => onLinkControls(requirement)}>
              Link controls
            </Button>
          ) : null}
        </Inline>
      }
    >
      {requirement && coverage ? (
        <Stack space="space.050">
          <Section
            title={
              childrenOfRequirement(requirement.id).length
                ? "Child assessment results"
                : "Assessment result"
            }
            count={coverageWord(coverage)}
          >
            <CoverageBar coverage={coverage} />
            {requirement.successCriteria ? (
              <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                {requirement.successCriteria}
              </Text>
            ) : null}
          </Section>
          <Section title="Allocated to" count={allocations.length}>
            {allocations.length ? (
              <AllocationTable allocations={allocations} programId={programId} />
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No allocations</EmptyTitle>
                  <EmptyDescription>
                    Allocate this requirement to a system element.
                  </EmptyDescription>
                </EmptyHeader>
                {allocate ? <EmptyContent>{allocate}</EmptyContent> : null}
              </Empty>
            )}
          </Section>
          <Section title="Linked controls" count={controls.length}>
            {controls.length ? (
              <ProvenanceTable
                derivations={controls}
                programId={programId}
                requirementId={requirement.id}
              />
            ) : (
              <Text as="p" size="small" color="color.text.subtle">
                Independent — no linked controls.
              </Text>
            )}
          </Section>
          {otherSources.length ? (
            <Section title="Other sources" count={otherSources.length}>
              <ProvenanceTable
                derivations={otherSources}
                programId={programId}
                requirementId={requirement.id}
                elementId={elementId}
              />
            </Section>
          ) : null}
        </Stack>
      ) : null}
    </PreviewSheet>
  );
}
