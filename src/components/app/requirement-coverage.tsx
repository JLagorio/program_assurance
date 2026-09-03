/**
 * The Requirements tab as a coverage view: every requirement in the program,
 * which elements carry it (the union across allocations), which controls it
 * traces to, and the two lists that matter for the model — requirements no
 * control produced (engineering intent, tracked on purpose) and requirements
 * nothing is yet responsible for.
 */

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AllocateModal } from "@/components/app/requirement-forms";
import { TargetLink } from "@/components/app/requirements";
import {
  Badge,
  Button,
  Id,
  Indicator,
  Inline,
  Stack,
  Table,
  Text,
  TextLink,
  ToggleGroup,
} from "@ledger/design-system";
import {
  allocationsFor,
  requirementSummary,
  requirementStateTone,
  requirementsForProgram,
  unallocatedRequirements,
  unmappedRequirements,
  useRequirementsVersion,
  type Requirement,
} from "@/lib/requirements";

type Filter = "all" | "unallocated" | "no-control" | "from-control" | "verified";

const filterLabels: Record<Filter, string> = {
  all: "All",
  unallocated: "Unallocated",
  "no-control": "No control",
  "from-control": "From a control",
  verified: "Verified",
};

function fromControl(r: Requirement): boolean {
  return r.derivations.some(
    (d) => d.sourceType === "Control statement" || d.sourceType === "Overlay",
  );
}

export function RequirementCoverage({ programId }: { programId: string }) {
  const version = useRequirementsVersion();
  const [filter, setFilter] = useState<Filter>("all");
  const [allocating, setAllocating] = useState<Requirement | null>(null);

  const all = useMemo(() => requirementsForProgram(programId), [programId, version]);
  const sets = useMemo(
    () => ({
      unallocated: new Set(unallocatedRequirements(programId).map((r) => r.id)),
      noControl: new Set(unmappedRequirements(programId).map((r) => r.id)),
    }),
    [programId, version],
  );
  const summary = useMemo(() => requirementSummary(programId), [programId, version]);

  const rows = all.filter((r) => {
    switch (filter) {
      case "unallocated":
        return sets.unallocated.has(r.id);
      case "no-control":
        return sets.noControl.has(r.id);
      case "from-control":
        return fromControl(r);
      case "verified":
        return r.state === "Verified";
      default:
        return true;
    }
  });

  const counts: Record<Filter, number> = {
    all: all.length,
    unallocated: sets.unallocated.size,
    "no-control": sets.noControl.size,
    "from-control": all.filter(fromControl).length,
    verified: summary.verified,
  };

  return (
    <Stack space="space.150">
      <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
        <ToggleGroup<Filter>
          aria-label="Requirement filter"
          value={filter}
          onChange={setFilter}
          items={(Object.keys(filterLabels) as Filter[]).map((k) => ({
            value: k,
            label: filterLabels[k],
            count: counts[k],
          }))}
        />
        <Text size="small" color="color.text.subtle">
          {summary.allocations} allocations across {summary.elements} elements
        </Text>
      </Inline>

      <Table>
        <thead>
          <Table.Row>
            <Table.Header width={104}>Requirement</Table.Header>
            <Table.Header>Shall statement</Table.Header>
            <Table.Header width={240}>Carried by</Table.Header>
            <Table.Header width={200}>Controls</Table.Header>
            <Table.Header width={96}>Method</Table.Header>
            <Table.Header width={120}>Owner</Table.Header>
            <Table.Header width={104}>State</Table.Header>
            <Table.Header width={84} className="text-right">
              {" "}
            </Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {rows.map((r) => {
            const allocs = allocationsFor(r.id);
            const controls = r.derivations.filter((d) => d.sourceType === "Control statement");
            const overlays = r.derivations.filter((d) => d.sourceType === "Overlay");
            return (
              <Table.Row key={r.id} title={r.text}>
                <Table.Cell className="max-w-none">
                  <TextLink>
                    <Link
                      to="/programs/$programId/requirements/$requirementId"
                      params={{ programId, requirementId: r.id }}
                    >
                      <Id>{r.id}</Id>
                    </Link>
                  </TextLink>
                </Table.Cell>
                <Table.Cell className="truncate">{r.text}</Table.Cell>
                <Table.Cell className="max-w-none">
                  {allocs.length ? (
                    <Inline
                      className="font-body-small"
                      as="span"
                      space="space.100"
                      rowSpace="space.025"
                      shouldWrap
                    >
                      {allocs.slice(0, 3).map((a) => (
                        <TargetLink key={a.id} allocation={a} programId={programId} />
                      ))}
                      {allocs.length > 3 ? (
                        <Text color="color.text.subtle">+{allocs.length - 3}</Text>
                      ) : null}
                    </Inline>
                  ) : (
                    <Indicator tone={sets.unallocated.has(r.id) ? "warning" : "neutral"}>
                      {sets.unallocated.has(r.id) ? "Nobody responsible" : "Not yet allocatable"}
                    </Indicator>
                  )}
                </Table.Cell>
                <Table.Cell className="max-w-none">
                  {controls.length || overlays.length ? (
                    <Inline as="span" space="space.100" rowSpace="space.025" shouldWrap>
                      {controls.map((d) => (
                        <TextLink key={d.sourceId}>
                          <Link
                            to="/programs/$programId/controls/$controlId"
                            params={{ programId, controlId: d.sourceId }}
                            search={{ tab: undefined }}
                            title={d.rationale}
                          >
                            <Id>{d.sourceId}</Id>
                          </Link>
                        </TextLink>
                      ))}
                      {overlays.map((d) => (
                        <Text key={d.sourceId} size="small" color="color.text.subtle">
                          {d.sourceLabel || d.sourceId}
                        </Text>
                      ))}
                    </Inline>
                  ) : (
                    <Indicator tone="information">
                      {r.derivations[0]?.sourceType ?? "No source"}
                    </Indicator>
                  )}
                </Table.Cell>
                <Table.Cell className="truncate">{r.method}</Table.Cell>
                <Table.Cell className="truncate">{r.owner}</Table.Cell>
                <Table.Cell>
                  <Badge size="xsmall" tone={requirementStateTone[r.state]}>
                    {r.state}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="max-w-none text-right">
                  <Button size="small" variant="subtle" onClick={() => setAllocating(r)}>
                    Allocate
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>
      {rows.length === 0 ? (
        <Text as="p" size="small" color="color.text.subtle">
          Nothing matches this filter.
        </Text>
      ) : null}

      {allocating ? (
        <AllocateModal
          open
          onClose={() => setAllocating(null)}
          programId={programId}
          requirement={allocating}
        />
      ) : null}
    </Stack>
  );
}
