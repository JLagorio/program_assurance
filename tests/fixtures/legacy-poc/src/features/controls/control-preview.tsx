import { ChevronDown } from "lucide-react";
import { NewRequirementModal } from "@/components/app/requirement-forms";
import { ControlRequirementTable } from "@/components/app/requirements";
import { loadControlText } from "@/lib/nist-control-text/registry";
import {
  controlAllocationCount,
  controlRequirementsInElement,
  programControlRows,
} from "@/lib/program-controls";
import { programElementIds } from "@/lib/program-scope";
import { useRequirementsVersion } from "@/lib/requirements";
import { scopeById, useScopesVersion } from "@/lib/scopes";
import {
  Button,
  buttonVariants,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  Section,
  Stack,
} from "@ledger/design-system";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ControlRecord } from "./control-record";
import type { ControlTab } from "./tabs";

export function ControlPreview({
  programId,
  controlId,
  scopeId: requestedScope,
  elementId,
  tab,
  onTabChange,
  onScopeChange,
}: {
  programId: string;
  controlId: string;
  scopeId?: string | undefined;
  elementId?: string | undefined;
  tab: ControlTab;
  onTabChange: (tab: ControlTab) => void | Promise<unknown>;
  onScopeChange: (scope: string) => void;
}) {
  useScopesVersion();
  useRequirementsVersion();
  const navigate = useNavigate();
  const [deriving, setDeriving] = useState(false);
  const text = useQuery({
    queryKey: ["control-text", controlId],
    queryFn: () => loadControlText(controlId),
    staleTime: Infinity,
  });
  const row = programControlRows(programId, elementId).find((item) => item.id === controlId);
  const scopeId = requestedScope ?? row?.scopeId;
  const scope = scopeId ? scopeById.get(scopeId) : undefined;
  const inherited =
    !!elementId && !!scope && !programElementIds(programId, elementId).has(scope.element);
  if (!row || (scopeId && !row.scopeIds.includes(scopeId))) {
    return (
      <p className="font-body text-subtle">This control does not apply to the selected scope.</p>
    );
  }
  if (inherited) {
    const requirements = controlRequirementsInElement(programId, controlId, elementId);
    return (
      <Stack space="space.200">
        <div className="page-header grid min-w-0 items-start gap-150">
          <h3 className="min-w-0 break-words font-heading-small font-semibold">{row.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="small" iconAfter={<ChevronDown />}>
                  Actions
                </Button>
              }
            />
            <DropdownMenuContent align="end" style={{ width: 260 }}>
              <DropdownMenuLinkItem
                closeOnClick
                render={
                  <Link
                    to="/programs/$programId/controls/$controlId"
                    params={{ programId, controlId }}
                    search={{ scope: scopeId, element: elementId, tab }}
                  />
                }
              >
                Open inherited implementation
              </DropdownMenuLinkItem>
              <DropdownMenuItem onClick={() => setDeriving(true)}>
                Derive requirement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="font-body text-subtle">
          No component implementation recorded. This control is inherited from {scope.name}. Open
          its implementation to work in that scope.
        </p>
        <Section title="Requirements" count={requirements.length}>
          <ControlRequirementTable
            requirements={requirements}
            programId={programId}
            controlId={controlId}
            elementId={elementId}
            allocationCount={(id) => controlAllocationCount(programId, id, elementId)}
          />
        </Section>
        <NewRequirementModal
          open={deriving}
          onClose={() => setDeriving(false)}
          programId={programId}
          initialControlId={controlId}
          onCreated={(requirement) => {
            void navigate({
              to: "/programs/$programId/requirements/$requirementId",
              params: { programId, requirementId: requirement.id },
              search: { element: elementId },
            });
          }}
        />
      </Stack>
    );
  }
  if (text.isPending)
    return (
      <p role="status" className="font-body text-subtle">
        Loading control…
      </p>
    );
  if (text.isError)
    return (
      <Stack space="space.100">
        <p role="alert">Could not load the control reference.</p>
        <Button onClick={() => void text.refetch()}>Try again</Button>
      </Stack>
    );
  return (
    <ControlRecord
      key={`${controlId}/${scopeId ?? "preferred"}`}
      programId={programId}
      controlId={controlId}
      text={text.data}
      scopeId={scopeId}
      scopeIds={row.scopeIds}
      elementId={elementId}
      tab={tab}
      preview
      onTabChange={onTabChange}
      onScopeChange={onScopeChange}
      header={({ title, actions }) => (
        <div className="page-header grid min-w-0 items-start gap-150">
          <h3 className="min-w-0 break-words font-heading-small font-semibold">{title}</h3>
          <div className="shrink-0">{actions}</div>
        </div>
      )}
      properties={(content) => (
        <Collapsible className="border-t border-default pt-150">
          <CollapsibleTrigger className={buttonVariants({ size: "small", variant: "subtle" })}>
            Record properties
          </CollapsibleTrigger>
          <CollapsibleContent>{content}</CollapsibleContent>
        </Collapsible>
      )}
    />
  );
}
