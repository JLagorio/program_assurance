import { RequirementRecord } from "./requirement-record";
import type { RequirementTab } from "./tabs";

export function RequirementPreview({
  programId,
  requirementId,
  elementId,
  tab,
  onTabChange,
}: {
  programId: string;
  requirementId: string;
  elementId?: string | undefined;
  tab: RequirementTab;
  onTabChange: (tab: RequirementTab) => void | Promise<unknown>;
}) {
  return (
    <RequirementRecord
      key={requirementId}
      programId={programId}
      requirementId={requirementId}
      elementId={elementId}
      tab={tab}
      preview
      onTabChange={onTabChange}
      header={({ title, actions }) => (
        <div className="page-header grid min-w-0 items-start gap-150">
          <h3 className="min-w-0 break-words font-heading-small font-semibold">{title}</h3>
          <div className="shrink-0">{actions}</div>
        </div>
      )}
      properties={(content) =>
        content ? <div className="border-t border-default pt-150">{content}</div> : null
      }
    />
  );
}
