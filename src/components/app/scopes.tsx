/**
 * The systems view: every assessment scope inside one authorization boundary,
 * and what each one's categorization actually costs it in controls.
 */

import { Link } from "@tanstack/react-router";

import { Badge, Table, Id } from "@/components/app/ui";
import { controlSetFor, objectives, triadOf } from "@/lib/scopes";
import type { AssessmentScope, ProgramRollup } from "@/lib/scopes";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

export function ScopeTable({
  scopes,
  rollup,
  programId,
}: {
  scopes: AssessmentScope[];
  rollup: ProgramRollup;
  programId: string;
}) {
  return (
    <div className="space-y-4">
      <Table>
        <colgroup>
          <col style={{ width: "104px" }} />
          <col />
          <col style={{ width: "62px" }} />
          <col style={{ width: "62px" }} />
          <col style={{ width: "62px" }} />
          <col style={{ width: "86px" }} />
          <col style={{ width: "76px" }} />
          <col style={{ width: "190px" }} />
          <col style={{ width: "120px" }} />
        </colgroup>
        <thead>
          <Table.Row>
            <Table.Header>Scope</Table.Header>
            <Table.Header>Name</Table.Header>
            {objectives.map((o) => (
              <Table.Header key={o} title={o}>
                {o.slice(0, 1)}
              </Table.Header>
            ))}
            <Table.Header className="text-right">Controls</Table.Header>
            <Table.Header className="text-right">Only here</Table.Header>
            <Table.Header>Overlays</Table.Header>
            <Table.Header>Authorization</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {scopes.map((scope) => {
            const set = controlSetFor(scope.id);
            const triad = triadOf(scope);
            const unique = set
              ? set.controls.filter(
                  (c) =>
                    rollup.controls.find((r) => r.control.id === c.control.id)?.scopes.length === 1,
                ).length
              : 0;
            return (
              <Table.Row key={scope.id} title={scope.mission}>
                <Table.Cell className="max-w-none">
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId, scopeId: scope.id }}
                    search={{ tab: undefined }}
                    className="hover:underline"
                  >
                    <Id className="text-primary">{scope.id}</Id>
                  </Link>
                </Table.Cell>
                <Table.Cell className="truncate">{scope.name}</Table.Cell>
                {objectives.map((o) => (
                  <Table.Cell key={o}>
                    <Badge size="xs" tone={impactTone[triad[o]]}>
                      {triad[o].slice(0, 1)}
                    </Badge>
                  </Table.Cell>
                ))}
                <Table.Cell className="tnum text-right">{set?.total ?? 0}</Table.Cell>
                <Table.Cell className="tnum text-right">
                  {unique || <span className="text-muted-foreground">—</span>}
                </Table.Cell>
                <Table.Cell className="truncate">
                  {set?.overlays.map((o) => o.name).join(", ") || "—"}
                </Table.Cell>
                <Table.Cell className="truncate">
                  {scope.independentlyAuthorized ? "Separate ATO" : "Program ATO"}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>

      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-[12.5px]">
          <span className="font-medium">
            {rollup.total} controls in the program set — the union of {rollup.scopes.length} scopes,
            not the highest of them.
          </span>{" "}
          <span className="text-muted-foreground">
            {rollup.singleScope} are required by exactly one scope. CNSSI 1253 selects per objective
            and never collapses the triad, so a scope at A=Low sheds contingency obligations while
            keeping every confidentiality control at High.
          </span>
        </p>
      </div>
    </div>
  );
}
