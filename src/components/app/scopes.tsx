/**
 * The systems view: every assessment scope inside one authorization boundary,
 * and what each one's categorization actually costs it in controls.
 */

import { Link } from "@tanstack/react-router";

import { Badge, Mono, Table, Td, Th, Tr } from "@/components/app/ui";
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
          <Tr>
            <Th>Scope</Th>
            <Th>Name</Th>
            {objectives.map((o) => (
              <Th key={o} title={o}>
                {o.slice(0, 1)}
              </Th>
            ))}
            <Th className="text-right">Controls</Th>
            <Th className="text-right">Only here</Th>
            <Th>Overlays</Th>
            <Th>Authorization</Th>
          </Tr>
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
              <Tr key={scope.id} title={scope.mission}>
                <Td className="max-w-none">
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId, scopeId: scope.id }}
                    search={{ tab: undefined }}
                    className="hover:underline"
                  >
                    <Mono className="text-primary">{scope.id}</Mono>
                  </Link>
                </Td>
                <Td className="truncate">{scope.name}</Td>
                {objectives.map((o) => (
                  <Td key={o}>
                    <Badge size="xs" tone={impactTone[triad[o]]}>
                      {triad[o].slice(0, 1)}
                    </Badge>
                  </Td>
                ))}
                <Td className="tnum text-right">{set?.total ?? 0}</Td>
                <Td className="tnum text-right">
                  {unique || <span className="text-muted-foreground">—</span>}
                </Td>
                <Td className="truncate">{set?.overlays.map((o) => o.name).join(", ") || "—"}</Td>
                <Td className="truncate">
                  {scope.independentlyAuthorized ? "Separate ATO" : "Program ATO"}
                </Td>
              </Tr>
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
