import { useCallback, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Stack,
} from "@ledger/design-system";
import { RecordEditor, type RecordEditorState } from "@/components/app/record-browser";
import { useWorkspace } from "@/components/app/workspace";
import { productRecordNoun } from "@/lib/product-records";
import { recordTitle, type DataRecord } from "@/lib/records";

export type ProductEditorState = RecordEditorState;
export type ProductRecordFormProps = {
  table: string;
  existing?: DataRecord | undefined;
  initialValues?: Record<string, unknown> | undefined;
  onSaved?: ((record: DataRecord) => void | Promise<void>) | undefined;
  onClose: () => void;
  readOnly?: boolean | undefined;
  onStateChange?: ((state: ProductEditorState) => void) | undefined;
};

/** Form content only, for a dialog that already owns its focus and dismissal lifecycle. */
export function ProductRecordForm({
  table,
  existing,
  initialValues,
  onSaved,
  onClose,
  onStateChange,
  readOnly = false,
}: ProductRecordFormProps) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === table);
  if (!collection)
    return (
      <Stack space="space.150">
        <p role="alert">This record type is unavailable in your workspace.</p>
        <Button onClick={onClose}>Close</Button>
      </Stack>
    );
  const canWrite =
    !readOnly &&
    workspace.role !== "viewer" &&
    (existing
      ? collection.can_update &&
        existing["state"] !== "published" &&
        existing["tenant_id"] === workspace.tenantId
      : collection.can_insert);
  if (!canWrite)
    return (
      <Stack space="space.150">
        <p className="text-subtle">This record is read-only.</p>
        <Button onClick={onClose}>Close</Button>
      </Stack>
    );
  return (
    <RecordEditor
      key={`${workspace.userId}/${workspace.tenantId}/${table}/${existing?.id ?? "new"}`}
      collection={collection}
      presentation="product"
      formLayout="dialog"
      existing={existing}
      initialValues={initialValues}
      {...(onStateChange ? { onStateChange } : {})}
      onCancel={onClose}
      onSaved={async (record) => {
        await onSaved?.(record);
        onClose();
      }}
    />
  );
}

/** Every create/edit opens in one modal; the form owns confirmation and write-in-flight guards. */
export function ProductRecordDialog({
  description,
  ...props
}: ProductRecordFormProps & { description?: string | undefined }) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === props.table);
  const stateRef = useRef<ProductEditorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [noun, setNoun] = useState(() =>
    productRecordNoun(props.table, props.existing ?? props.initialValues),
  );
  const onStateChange = useCallback((state: ProductEditorState) => {
    stateRef.current = state;
    setBusy(state.busy);
    setNoun(state.noun);
  }, []);
  const heading = `${props.existing ? "Edit" : "Create"} ${noun}`;
  const context =
    description ??
    (props.existing && collection ? recordTitle(props.existing, collection) : undefined);
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (open) return;
        details.cancel();
        if (stateRef.current?.busy) return;
        if (stateRef.current) stateRef.current.requestClose();
        else props.onClose();
      }}
    >
      <DialogContent style={{ maxWidth: 760 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          {context ? <DialogDescription>{context}</DialogDescription> : null}
        </DialogHeader>
        <ProductRecordForm {...props} onStateChange={onStateChange} />
      </DialogContent>
    </Dialog>
  );
}
