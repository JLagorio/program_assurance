import { ControlStatement } from "@/components/prototype/library-controls";
import { QueryState } from "@/components/prototype/work-common";
import { useRows, type Row } from "@/lib/models";
import { useParameterChoices } from "@/lib/parameter-reads";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ledger/design-system";

/** The parts a tailoring decision is read against: what the control requires, then why. */
const roots: readonly string[] = ["statement", "guidance"];

/**
 * The control's statement and discussion as the catalog prints them, through the one control
 * statement view: catalog labels ("a.", "1."), and each parameter insertion as its labelled
 * placeholder ("[Assignment: organization-defined frequency]") rather than the raw OSCAL marker.
 * Each root part is a heading at the caller's level, with loading and failure recovery.
 */
export function ControlDetail({ control }: { control: Pick<Row<"controls">, "id"> }) {
  const parts = useRows("control_parts", { control_id: control.id });
  const parameters = useRows("parameters", { control_id: control.id });
  const choices = useParameterChoices(parameters.data);
  const shown = parts.data?.some(
    (part) => part.parent_part_id === null && roots.includes(part.name),
  );
  return (
    <QueryState queries={[parts, parameters, choices]}>
      {shown ? (
        <ControlStatement
          parts={parts.data ?? []}
          parameters={parameters.data ?? []}
          choices={choices.data ?? []}
          roots={roots}
        />
      ) : (
        <Empty size="compact">
          <EmptyHeader>
            <EmptyTitle>No statement text</EmptyTitle>
            <EmptyDescription>The catalog records no statement for this control.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </QueryState>
  );
}
