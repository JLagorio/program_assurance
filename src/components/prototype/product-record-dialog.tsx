import { useCallback, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ledger/design-system";
import { RecordEditor, type RecordEditorState } from "@/components/app/record-browser";
import { useWorkspace } from "@/components/app/workspace";
import { productRecordNoun } from "@/lib/product-records";
import { recordTitle, type DataRecord } from "@/lib/records";

export type ProductEditorState = RecordEditorState;
export type ProductRecordFormProps = {
  table: string;
  /** Preserve the operation label for linking existing records. */
  operationLabel?: string | undefined;
  existing?: DataRecord | undefined;
  initialValues?: Record<string, unknown> | undefined;
  onSaved?: ((record: DataRecord) => void | Promise<void>) | undefined;
  onClose: () => void;
  readOnly?: boolean | undefined;
  onStateChange?: ((state: ProductEditorState) => void) | undefined;
};

/**
 * Form content only, for a Dialog that already owns its focus and dismissal lifecycle: the
 * editor's body and footer, or, when the record cannot be written here, a body that says why and
 * a footer that closes.
 */
export function ProductRecordForm({
  table,
  operationLabel,
  existing,
  initialValues,
  onSaved,
  onClose,
  onStateChange,
  readOnly = false,
}: ProductRecordFormProps) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === table);
  const canWrite =
    !!collection &&
    !readOnly &&
    workspace.role !== "viewer" &&
    (existing
      ? collection.can_update &&
        existing["state"] !== "published" &&
        existing["tenant_id"] === workspace.tenantId
      : collection.can_insert);
  if (!collection || !canWrite)
    return (
      <>
        <DialogBody>
          {collection ? (
            <Alert role="note">
              <AlertDescription>
                This record is read-only for you here: it is published, belongs to another
                workspace, or your role cannot change it.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden />
              <AlertDescription>
                This record type is unavailable in your workspace.
              </AlertDescription>
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="primary" />}>Close</DialogClose>
        </DialogFooter>
      </>
    );
  return (
    <RecordEditor
      key={`${workspace.userId}/${workspace.tenantId}/${table}/${existing?.id ?? "new"}`}
      collection={collection}
      presentation="product"
      formLayout="dialog"
      operationLabel={operationLabel}
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

/** The element that opened a dialog, read as the dialog first renders, before any field takes focus. */
function currentOpener(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  // A menu item goes with its menu: the menu's trigger is the control that stays.
  if (active.closest('[role="menu"]'))
    return document.querySelector<HTMLElement>('[aria-haspopup="menu"][aria-expanded="true"]');
  return active;
}

/**
 * Every create/edit opens in one modal; the form owns confirmation and write-in-flight guards.
 * The Dialog closes through its own `open`, so its exit and focus return run before `onClose`:
 * focus goes back to the control that opened it (a menu's trigger for a menu item), or to
 * `finalFocus` when the caller names a better place.
 */
export function ProductRecordDialog({
  description,
  finalFocus,
  ...props
}: ProductRecordFormProps & {
  description?: string | undefined;
  /** Where focus goes when the dialog closes; the control that opened it unsaid. */
  finalFocus?: DialogContentProps["finalFocus"];
}) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === props.table);
  const stateRef = useRef<ProductEditorState | null>(null);
  const [open, setOpen] = useState(true);
  const [opener] = useState(currentOpener);
  const [busy, setBusy] = useState(false);
  const [noun, setNoun] = useState(() =>
    productRecordNoun(props.table, props.existing ?? props.initialValues),
  );
  const onStateChange = useCallback((state: ProductEditorState) => {
    stateRef.current = state;
    setBusy(state.busy);
    setNoun(state.noun);
  }, []);
  const heading = props.operationLabel ?? `${props.existing ? "Edit" : "Create"} ${noun}`;
  const context =
    description ??
    (props.existing && collection ? recordTitle(props.existing, collection) : undefined);
  const { onClose } = props;
  return (
    <Dialog
      open={open}
      pending={busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        if (stateRef.current?.busy) return;
        if (stateRef.current) stateRef.current.requestClose();
        else setOpen(false);
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        width="large"
        finalFocus={finalFocus ?? (() => (opener?.isConnected ? opener : true))}
      >
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          {context ? <DialogDescription>{context}</DialogDescription> : null}
        </DialogHeader>
        <ProductRecordForm
          {...props}
          onClose={() => setOpen(false)}
          onStateChange={onStateChange}
        />
      </DialogContent>
    </Dialog>
  );
}
