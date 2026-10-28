import { useState, type ReactElement } from "react";
import { Button, LinkButton, Peek, PopoverClose } from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import {
  RecordReferenceContent,
  useRecordComparison,
  type RecordIdentity,
} from "./record-comparison";
import { recordDestination, type PreviewRecord } from "./record-preview";

export function RecordPeek({
  identity,
  record,
  trigger,
}: {
  identity: RecordIdentity;
  record: PreviewRecord;
  trigger: ReactElement;
}) {
  const [wanted, setWanted] = useState(false);
  const comparison = useRecordComparison();
  return (
    <Peek
      trigger={trigger}
      label={`Preview ${identity.label ?? "linked record"}`}
      onOpenChange={(open) => {
        if (open) setWanted(true);
      }}
      actions={
        <>
          <LinkButton
            size="small"
            variant="subtle"
            render={<Link {...recordDestination(identity.table, record)} />}
          >
            Open record
          </LinkButton>
          {comparison && (
            <PopoverClose
              render={
                <Button size="small" variant="secondary" onClick={() => comparison.pin(identity)} />
              }
            >
              Compare
            </PopoverClose>
          )}
        </>
      }
    >
      {wanted && <RecordReferenceContent identity={identity} compact />}
    </Peek>
  );
}
