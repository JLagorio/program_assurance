import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
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
  Skeleton,
  Stack,
  VisuallyHidden,
} from "@ledger/design-system";
import { RecordEditor, type RecordEditorState } from "@/components/app/record-browser";
import { useWorkspace } from "@/components/app/workspace";
import { useCollection } from "@/lib/collections";
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
 * editor's body and footer; while the record's schema loads, skeleton fields over the operation's
 * primary, loading; when the schema cannot be read, an alert with Retry; and when the record
 * cannot be written here, a body that says why and a footer that closes.
 */
export function ProductRecordForm(props: ProductRecordFormProps) {
  const schema = useCollection(props.table);
  // The form replaces its loading frame once the schema lands, and the footer the reader may have
  // been on goes with it: focus then moves to the first field, as it does when the dialog opens.
  const marker = useRef<HTMLSpanElement>(null);
  const waited = useRef(schema.isPending);
  const loaded = !schema.isPending;
  useEffect(() => {
    if (!loaded || !waited.current) return;
    waited.current = false;
    const frame = requestAnimationFrame(() => {
      const dialog = marker.current?.closest<HTMLElement>('[role="dialog"]');
      const active = document.activeElement;
      if (!dialog) return;
      const kept =
        active instanceof HTMLElement &&
        active !== document.body &&
        dialog.contains(active) &&
        !active.closest('[data-slot="dialog-footer"]');
      if (kept) return;
      dialog
        .querySelector<HTMLElement>(
          '[data-slot="dialog-body"] :is(input, textarea, select, button, [tabindex="0"]):not([disabled])',
        )
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [loaded]);
  return (
    <>
      <span hidden ref={marker} />
      <FormContent {...props} schema={schema} />
    </>
  );
}

function FormContent({
  table,
  operationLabel,
  existing,
  initialValues,
  onSaved,
  onClose,
  onStateChange,
  readOnly = false,
  schema,
}: ProductRecordFormProps & { schema: ReturnType<typeof useCollection> }) {
  const workspace = useWorkspace();
  const collection = schema.data ?? undefined;
  if (schema.isPending)
    return (
      <>
        <DialogBody>
          <Stack space="space.250" aria-busy="true">
            <Skeleton lines={2} />
            <Skeleton lines={2} />
            <Skeleton lines={2} />
            <VisuallyHidden role="status">Loading the form…</VisuallyHidden>
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          {/* The operation keeps its place while the form loads. */}
          <Button variant="primary" isLoading>
            {operationLabel ??
              `${existing ? "Edit" : "Create"} ${productRecordNoun(table, existing ?? initialValues)}`}
          </Button>
        </DialogFooter>
      </>
    );
  if (schema.isError)
    return (
      <>
        <DialogBody>
          <Alert variant="destructive" role="alert">
            <AlertCircle aria-hidden />
            <AlertTitle>The form could not be loaded</AlertTitle>
            <AlertDescription>{schema.error.message}</AlertDescription>
            <AlertAction>
              <Button
                size="small"
                isLoading={schema.isFetching}
                onClick={() => void schema.refetch()}
              >
                Retry loading
              </Button>
            </AlertAction>
          </Alert>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="primary" />}>Close</DialogClose>
        </DialogFooter>
      </>
    );
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
  const collection = useCollection(props.table).data ?? undefined;
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
