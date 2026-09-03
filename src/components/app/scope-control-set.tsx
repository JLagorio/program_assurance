/**
 * The control set of a categorized element, folded into that element's
 * record. Until 2026-09-02 a scope (`SYS-`) had a record of its own, so one
 * subsystem had two records and a footer link between them. Now one element
 * has one record, and when the element is categorized the record carries a
 * Control set tab: the revision in force and the one proposed, the controls
 * in force, why the categorization and overlays select what they do, and the
 * history. Nothing here is a pattern of its own: Section, Table, FilterChip,
 * Fact and Inspector.Group as the kit documents them.
 */

import { Link } from "@tanstack/react-router";
import { useState } from "react";

import {
  Absent,
  Badge,
  Fact,
  FilterChip,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Section,
  Table,
  Text,
  TextLink,
} from "@ledger/design-system";

import { ControlSetRevisions, RevisionHistory } from "./control-set-revisions";
import { ControlHover } from "./glances";
import {
  controlSetFor,
  objectives,
  rollupControlSet,
  triadOf,
  type AssessmentScope,
  type Objective,
} from "@/lib/scopes";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

type ScopeSet = NonNullable<ReturnType<typeof controlSetFor>>;
type ScopeControls = ScopeSet["controls"];

/** Controls no other scope in the program requires: what a program-wide union would hide. */
function uniqueToScope(scope: AssessmentScope, set: ScopeSet): ScopeControls {
  const rollup = rollupControlSet(scope.program);
  return set.controls.filter(
    (c) => rollup.controls.find((r) => r.control.id === c.control.id)?.scopes.length === 1,
  );
}

/** Facts for the record header strip when the element is categorized. */
export function ScopeFacts({ scope, set }: { scope: AssessmentScope; set: ScopeSet }) {
  const triad = triadOf(scope);
  return (
    <>
      {objectives.map((o) => (
        <Fact key={o} label={o.slice(0, 1)}>
          <Badge size="xsmall" tone={impactTone[triad[o]]}>
            {triad[o]}
          </Badge>
        </Fact>
      ))}
      <Fact label="Controls">{set.total}</Fact>
      <Fact label="Overlays">{set.overlays.length}</Fact>
      <Fact label="Only here">{uniqueToScope(scope, set).length}</Fact>
    </>
  );
}

/** Rail groups beside the overview of a categorized element. */
export function ScopeRailGroups({ scope }: { scope: AssessmentScope }) {
  const triad = triadOf(scope);
  return (
    <>
      <Inspector.Group title="Categorization">
        {objectives.map((o) => (
          <KeyValue key={o} label={o}>
            <Badge size="xsmall" tone={impactTone[triad[o]]}>
              {triad[o]}
            </Badge>
          </KeyValue>
        ))}
        <KeyValue label="Model">CNSSI 1253</KeyValue>
        <KeyValue label="Authorized">
          {scope.independentlyAuthorized ? "Separately" : "Inside the program ATO"}
        </KeyValue>
      </Inspector.Group>
      <Inspector.Group title="Environment">
        <KeyValue label="Class">{scope.parameters.systemClass}</KeyValue>
        <KeyValue label="Hosting">{scope.parameters.hosting}</KeyValue>
        <KeyValue label="Classification">{scope.parameters.classification}</KeyValue>
        <KeyValue label="Connectivity">{scope.parameters.connectivity}</KeyValue>
        <KeyValue label="Owner">{scope.owner}</KeyValue>
      </Inspector.Group>
    </>
  );
}

/** The Control set tab of a categorized element's record. */
export function ScopeControlSetTab({
  programId,
  scope,
}: {
  programId: string;
  scope: AssessmentScope;
}) {
  const [family, setFamily] = useState("All");
  const set = controlSetFor(scope.id);
  if (!set) return null;

  const unique = uniqueToScope(scope, set);
  const families = ["All", ...[...new Set(set.controls.map((c) => c.control.family))].sort()];
  const rows =
    family === "All" ? set.controls : set.controls.filter((c) => c.control.family === family);

  return (
    <>
      <ControlSetRevisions programId={programId} scopeId={scope.id} />

      <Section
        title="Controls in force"
        description="The set this element answers to today. A change is proposed above and approved before it lands here."
        action={
          <Inline space="space.075" shouldWrap>
            {families.slice(0, 12).map((f) => (
              <FilterChip key={f} label={f} isActive={family === f} onClick={() => setFamily(f)} />
            ))}
          </Inline>
        }
      >
        <ControlTable rows={rows} programId={programId} />
      </Section>

      <Section
        title="What each objective selects"
        description="CNSSI 1253 selects per objective and takes the union — the triad is never collapsed to its highest value."
      >
        <Table className="pt-050">
          <thead>
            <Table.Row>
              <Table.Header width={180}>Objective</Table.Header>
              <Table.Header width={110}>Impact</Table.Header>
              <Table.Header width={120} className="text-right">
                Controls
              </Table.Header>
              <Table.Header>Families it drives</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {objectives.map((o) => {
              const triad = triadOf(scope);
              return (
                <Table.Row key={o}>
                  <Table.Cell>{o}</Table.Cell>
                  <Table.Cell>
                    <Badge size="xsmall" tone={impactTone[triad[o]]}>
                      {triad[o]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right">{set.byObjective[o]}</Table.Cell>
                  <Table.Cell className="truncate">{familiesFor(set, o).join(", ")}</Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Section>

      <Section title="Overlays applied">
        {set.overlays.length ? (
          <Table className="pt-050">
            <thead>
              <Table.Row>
                <Table.Header width={240}>Overlay</Table.Header>
                <Table.Header width={220}>Authority</Table.Header>
                <Table.Header>Why it fired</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {set.overlays.map((o) => (
                <Table.Row key={o.id}>
                  <Table.Cell className="truncate">{o.name}</Table.Cell>
                  <Table.Cell className="truncate">{o.authority}</Table.Cell>
                  <Table.Cell className="truncate">{o.trigger}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        ) : (
          <Text as="p" color="color.text.subtle" className="pt-150">
            No overlay applies to this element&apos;s parameters.
          </Text>
        )}
      </Section>

      <Section
        title="Separation basis"
        description="Why this element may categorize below its siblings."
      >
        <Text as="p" className="max-w-layout-measure pt-150">
          {scope.separationBasis}
        </Text>
      </Section>

      {unique.length > 0 ? (
        <Section
          title="Required only here"
          description="A single program-wide control set would fold these into the union and lose the reason they are there."
        >
          <ControlTable rows={unique} programId={programId} />
        </Section>
      ) : null}

      {set.removed.length > 0 ? (
        <Section
          title="Tailored out by overlay"
          description="Selected by categorization, then removed. Recorded rather than absent."
        >
          <ControlTable rows={set.removed} programId={programId} showRemoval />
        </Section>
      ) : null}

      <RevisionHistory scopeId={scope.id} />
    </>
  );
}

function familiesFor(set: ScopeSet, objective: Objective): string[] {
  const fams = new Set<string>();
  for (const c of set.controls) if (c.selectedBy.includes(objective)) fams.add(c.control.family);
  return [...fams].sort();
}

function ControlTable({
  rows,
  programId,
  showRemoval = false,
}: {
  rows: ScopeControls;
  programId: string;
  showRemoval?: boolean;
}) {
  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={104}>Control</Table.Header>
          <Table.Header width={64}>Family</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={180}>Selected by</Table.Header>
          <Table.Header width={showRemoval ? 300 : 150}>
            {showRemoval ? "Why it was removed" : "Source"}
          </Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Table.Row key={row.control.id}>
            <Table.Cell className="max-w-none">
              <ControlHover controlId={row.control.id} programId={programId}>
                <TextLink>
                  <Link
                    to="/programs/$programId/controls/$controlId"
                    params={{ programId, controlId: row.control.id }}
                    search={{ tab: undefined }}
                  >
                    <Id>{row.control.id}</Id>
                  </Link>
                </TextLink>
              </ControlHover>
            </Table.Cell>
            <Table.Cell>{row.control.family}</Table.Cell>
            <Table.Cell className="truncate">{row.control.title}</Table.Cell>
            <Table.Cell className="truncate">
              {row.selectedBy.length ? (
                row.selectedBy.map((o) => o.slice(0, 1)).join(" · ")
              ) : (
                <Absent />
              )}
            </Table.Cell>
            <Table.Cell className={showRemoval ? "whitespace-normal py-100 align-top" : "truncate"}>
              {showRemoval ? (row.tailoredOut?.rationale ?? <Absent />) : row.source}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}
