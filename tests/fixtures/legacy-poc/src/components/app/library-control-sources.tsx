import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Id,
  KeyValue,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  toast,
} from "@ledger/design-system";

import { libraryDecision, saveLibraryDecision } from "@/lib/assurance-library";
import type { LibrarySource, LibraryUse } from "@/lib/assurance-library-model";

export type ScopedLibrarySource = LibrarySource & { use: LibraryUse };

const decisions = ["Pending", "Confirmed", "Excluded"] as const;
const decisionItems = decisions.map((value) => ({ value, label: value }));
const assessmentTone = {
  "Not assessed": "neutral",
  Satisfied: "success",
  "Other than satisfied": "danger",
} as const;

/** Source acceptance contributes to readiness; the program's determination remains its own record. */
export function LibraryControlSources({
  programId,
  controlId,
  sources,
}: {
  programId: string;
  controlId: string;
  sources: ScopedLibrarySource[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function setDecision(source: ScopedLibrarySource, decision: (typeof decisions)[number]) {
    const sourceDecisions = { ...libraryDecision(source.use.id, controlId).sourceDecisions };
    sourceDecisions[source.id] = decision;
    try {
      saveLibraryDecision(source.use.id, controlId, { sourceDecisions });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Unable to save source decision",
        type: "error",
      });
    }
  }

  return (
    <Section
      title="Library sources"
      count={sources.length || null}
      action={
        <Button
          size="small"
          render={
            <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Library" }} />
          }
        >
          Manage sources
        </Button>
      }
    >
      <Table className="table-fixed" style={{ minWidth: 720 }}>
        <thead>
          <tr>
            <Table.Header width={36} aria-label="Source details" />
            <Table.Header>Source</Table.Header>
            <Table.Header width={80}>Version</Table.Header>
            <Table.Header width={160}>Instance</Table.Header>
            <Table.Header width={140}>Decision</Table.Header>
            <Table.Header width={154}>Source assessment</Table.Header>
          </tr>
        </thead>
        <tbody>
          {sources.length ? (
            sources.map((source) => {
              const key = `${source.use.id}:${source.id}`;
              const isExpanded = expanded === key;
              const requirements = source.version.requirements.filter((requirement) =>
                source.control.requirementIds.includes(requirement.id),
              );
              const evidence = source.version.evidence.filter((artifact) =>
                source.control.evidenceIds.includes(artifact.id),
              );
              return (
                <Fragment key={key}>
                  <Table.Row isSelected={isExpanded}>
                    <Table.Disclosure
                      hasChildren
                      expanded={isExpanded}
                      label={`${source.entry.name} for ${source.use.name}`}
                      onToggle={() => setExpanded(isExpanded ? null : key)}
                    />
                    <Table.Cell title={source.entry.name}>
                      <Button
                        variant="link"
                        className="max-w-full justify-start truncate"
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded(isExpanded ? null : key)}
                      >
                        {source.entry.name}
                      </Button>
                    </Table.Cell>
                    <Table.Cell>
                      <Id>{source.version.version}</Id>
                    </Table.Cell>
                    <Table.Cell title={source.use.name}>{source.use.name}</Table.Cell>
                    <Table.Cell>
                      <Select<(typeof decisions)[number]>
                        items={decisionItems}
                        value={source.decision}
                        onValueChange={(value) => {
                          if (value) setDecision(source, value);
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Decision for ${source.entry.name} on ${source.use.name}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {decisionItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant="secondary"
                        size="xsmall"
                        tone={assessmentTone[source.control.assessment]}
                      >
                        {source.control.assessment}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                  {isExpanded ? (
                    <Table.Detail colSpan={6}>
                      <Stack space="space.150" className="font-body-small">
                        <KeyValue label="Type" labelWidth={152}>
                          {source.kind}
                        </KeyValue>
                        <KeyValue label="Implementation" labelWidth={152} wrap>
                          {source.control.implementation || "—"}
                        </KeyValue>
                        <KeyValue label="Program responsibility" labelWidth={152} wrap>
                          {source.control.consumerResponsibility || "—"}
                        </KeyValue>
                        {source.version.conditions.length ? (
                          <KeyValue label="Conditions" labelWidth={152} wrap>
                            {source.version.conditions.join(" · ")}
                          </KeyValue>
                        ) : null}
                        <KeyValue label="Requirements" labelWidth={152} wrap>
                          {requirements.length
                            ? requirements.map((requirement) => (
                                <div key={requirement.id}>
                                  <Id>{requirement.id}</Id> · {requirement.title} ·{" "}
                                  {requirement.status}
                                </div>
                              ))
                            : "None"}
                        </KeyValue>
                        <KeyValue label="Evidence" labelWidth={152} wrap>
                          {evidence.length
                            ? evidence.map((artifact) => (
                                <div key={artifact.id}>
                                  <Id>{artifact.id}</Id> · {artifact.title}
                                  {artifact.date ? ` · ${artifact.date}` : ""}
                                </div>
                              ))
                            : "None"}
                        </KeyValue>
                        <KeyValue label="Assessor" labelWidth={152}>
                          {source.control.assessor || "—"}
                        </KeyValue>
                        <KeyValue label="Assessed on" labelWidth={152}>
                          {source.control.assessedOn || "—"}
                        </KeyValue>
                      </Stack>
                    </Table.Detail>
                  ) : null}
                </Fragment>
              );
            })
          ) : (
            <Table.Row isStatic>
              <Table.Cell colSpan={6}>No sources</Table.Cell>
            </Table.Row>
          )}
        </tbody>
      </Table>
    </Section>
  );
}
