/**
 * The peek for one requirement: what the eye on a coverage row opens. The compact
 * record header, then how far its verification has run, what carries it, and where
 * it came from. The full record is one link away; Allocate is the one action that
 * makes sense without leaving.
 */

import { Link } from "@tanstack/react-router";

import {
  Badge,
  Block,
  Button,
  Empty,
  Fact,
  PreviewSheet,
  Stack,
  Text,
  TextLink,
} from "@ledger/design-system";

import { CoverageBar } from "@/components/app/coverage-bar";
import { AllocationTable, ProvenanceTable } from "@/components/app/requirements";
import { useLinkCurrencyVersion } from "@/lib/link-currency";
import { allocationsForProgramElement } from "@/lib/requirement-context";
import { coverageOf, coverageWord, useVerificationVersion } from "@/lib/requirement-verification";
import {
  getRequirement,
  requirementStateTone,
  requirementMethodLabel,
  useRequirementsVersion,
  type Requirement,
} from "@/lib/requirements";

export function RequirementPreviewSheet({
  programId,
  requirementId,
  onClose,
  onAllocate,
  elementId,
}: {
  programId: string;
  elementId?: string | undefined;
  /** The requirement open in the sheet; null closes it. */
  requirementId: string | null;
  onClose: () => void;
  /** Allocate from the peek: the one action that makes sense without leaving. */
  onAllocate?: ((requirement: Requirement) => void) | undefined;
}) {
  useRequirementsVersion();
  useVerificationVersion();
  useLinkCurrencyVersion();
  const record = requirementId ? getRequirement(requirementId) : undefined;
  const requirement = record?.program === programId ? record : null;
  const allocations = requirement
    ? allocationsForProgramElement(requirement.id, programId, elementId)
    : [];
  const coverage = requirement ? coverageOf(requirement) : null;
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
          <TextLink>
            <Link
              to="/programs/$programId/requirements/$requirementId"
              params={{ programId, requirementId: requirement.id }}
              search={{ tab: "Provenance", element: elementId }}
            >
              Provenance
            </Link>
          </TextLink>
        ) : undefined
      }
      actions={allocate}
    >
      {requirement && coverage ? (
        <Stack space="space.050">
          <Block title="Assessment result" count={coverageWord(coverage)}>
            <CoverageBar coverage={coverage} />
            {requirement.successCriteria ? (
              <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                {requirement.successCriteria}
              </Text>
            ) : null}
          </Block>
          <Block title="Allocated to" count={allocations.length}>
            {allocations.length ? (
              <AllocationTable allocations={allocations} programId={programId} />
            ) : (
              <Empty
                title="No allocations"
                description="Allocate this requirement to a system element."
                action={allocate}
              />
            )}
          </Block>
          <Block title="Provenance" count={requirement.derivations.length}>
            <ProvenanceTable
              derivations={requirement.derivations}
              programId={programId}
              requirementId={requirement.id}
              elementId={elementId}
            />
          </Block>
        </Stack>
      ) : null}
    </PreviewSheet>
  );
}
