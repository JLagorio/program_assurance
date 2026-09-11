import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Button, IconButton } from "../components/button";
import { Checkbox } from "../components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import { useLedgerLocale } from "../lib/locale";
import { DataTable, useDataTable, type DataTableColumn } from "./data-table";
import { Toolbar } from "./toolbar";

export type RecordBrowserProps<T extends { id: string }> = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  records: readonly T[];
  columns: readonly DataTableColumn<T>[];
  /** Filterable column IDs. The table owns sorting, search, filters and selection. */
  filters?: readonly string[];
  /** Human-readable name for the preview heading and its accessible controls. */
  recordTitle: (record: T) => ReactNode;
  /** Record content stays inside this dialog; do not render another modal here. */
  renderPreview: (record: T) => ReactNode;
  onConfirm: (records: T[]) => void | Promise<void>;
  confirmLabel: string;
  /** Optional context, such as the relationship target. */
  context?: ReactNode;
  /** Permanent actions, such as creating a new record. */
  actions?: ReactNode;
};

/** Search, compare, preview and select records before confirming a relationship. */
export function RecordBrowser<T extends { id: string }>({
  open,
  onClose,
  ...props
}: RecordBrowserProps<T>) {
  const dismissPreview = useRef<(() => void) | null>(null);
  // A fresh session on each open; changing search or closing a preview never clears selection.
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && details.reason === "escape-key" && dismissPreview.current) {
          details.cancel();
          dismissPreview.current();
          return;
        }
        if (!next) onClose();
      }}
    >
      {open ? (
        <RecordBrowserContent {...props} onClose={onClose} dismissPreview={dismissPreview} />
      ) : null}
    </Dialog>
  );
}

function RecordBrowserContent<T extends { id: string }>({
  dismissPreview,
  title,
  description,
  records,
  columns,
  filters = [],
  recordTitle,
  renderPreview,
  onConfirm,
  confirmLabel,
  context,
  actions,
  onClose,
}: Omit<RecordBrowserProps<T>, "open"> & { dismissPreview: RefObject<(() => void) | null> }) {
  const { t } = useLedgerLocale();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const previewBody = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerId = useRef<string | null>(null);
  const hadPreview = useRef(false);
  const headingId = useId();
  const openPreview = useCallback((record: T) => {
    openerId.current = record.id;
    setPreviewId(record.id);
  }, []);
  const previewColumns = useMemo(
    () =>
      columns.map((column) =>
        column.meta?.kind === "id"
          ? {
              ...column,
              meta: {
                ...column.meta,
                preview: openPreview,
                active: (record: T) => record.id === previewId,
              },
            }
          : column,
      ),
    [columns, openPreview, previewId],
  );
  const table = useDataTable({
    data: records,
    columns: previewColumns,
    getRowId: (record) => record.id,
    selectable: true,
    pageSize: 20,
    label: title,
    density: "compact",
  });
  const preview = records.find((record) => record.id === previewId);
  const rows = table.getRowModel().rows;
  const index = rows.findIndex((row) => row.id === previewId);
  const selected = table.getSelectedRowModel().flatRows.map((row) => row.original);
  const closePreview = () => {
    // Keep focus in the dialog before removing the focused preview subtree. Otherwise
    // Base UI restores focus from the document body and overrides the row restoration.
    dialogRef.current?.focus({ preventScroll: true });
    setPreviewId(null);
    requestAnimationFrame(() => {
      const opener = dialogRef.current?.querySelector<HTMLElement>(
        `[data-row-id="${CSS.escape(openerId.current ?? "")}"] button[aria-label="${CSS.escape(t("previewRow"))}"]`,
      );
      const fallback = dialogRef.current?.querySelector<HTMLElement>("input[type=search]");
      (opener ?? fallback)?.focus();
    });
  };
  useLayoutEffect(() => {
    dismissPreview.current = preview ? closePreview : null;
    return () => {
      dismissPreview.current = null;
    };
  });
  useEffect(() => {
    if (previewId && !hadPreview.current) previewHeading.current?.focus();
    hadPreview.current = !!previewId;
    if (previewBody.current) previewBody.current.scrollTop = 0;
  }, [previewId]);
  const confirm = async () => {
    if (!selected.length || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(selected);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The records could not be linked.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <DialogContent
      ref={dialogRef}
      data-record-browser=""
      style={{ width: "90vw", maxWidth: "none", height: "90dvh", maxHeight: "90dvh" }}
      onKeyDown={(event) => {
        // Keep Escape from reaching the underlying shell panel. Base UI handles dismissal above.
        if (event.key === "Escape") event.stopPropagation();
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {context ? (
        <div className="shrink-0 border-b border-default px-250 py-150">{context}</div>
      ) : null}
      <div
        data-record-browser-body=""
        className="flex min-h-0 flex-1"
        data-preview={preview ? "open" : undefined}
      >
        <div
          data-record-browser-results=""
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-200"
        >
          <DataTable
            table={table}
            onRowClick={openPreview}
            empty={{
              title: "No matching records",
              description: "Try another search or clear a filter.",
            }}
            toolbar={
              <Toolbar
                search={String(table.state.globalFilter ?? "")}
                onSearch={(value) => table.setGlobalFilter(value)}
                placeholder="Search records"
                filters={
                  filters.length ? (
                    <>
                      {filters.map((column) => (
                        <DataTable.Filter key={column} table={table} column={column} />
                      ))}
                    </>
                  ) : undefined
                }
                actions={actions}
              >
                <DataTable.Columns table={table} />
              </Toolbar>
            }
          />
        </div>
        {preview ? (
          <section
            aria-labelledby={headingId}
            data-record-browser-preview=""
            className="flex min-h-0 min-w-0 flex-col border-s border-default bg-surface"
          >
            <div className="flex shrink-0 items-center gap-050 border-b border-default px-200 py-150">
              <span className="min-w-0 flex-1 font-body font-semibold">{preview.id}</span>
              <IconButton
                label="Previous preview"
                icon={<ChevronLeft />}
                variant="subtle"
                disabled={index <= 0}
                onClick={() => setPreviewId(rows[index - 1]?.id ?? null)}
              />
              <IconButton
                label="Next preview"
                icon={<ChevronRight />}
                variant="subtle"
                disabled={index < 0 || index >= rows.length - 1}
                onClick={() => setPreviewId(rows[index + 1]?.id ?? null)}
              />
              <IconButton
                label="Back to results"
                icon={<X />}
                variant="subtle"
                onClick={closePreview}
              />
            </div>
            <div
              ref={previewBody}
              tabIndex={0}
              role="group"
              aria-label="Record details"
              className="min-h-0 overflow-y-auto overscroll-contain p-200 outline-none focus-visible:outline-focused"
            >
              <h3
                id={headingId}
                ref={previewHeading}
                tabIndex={-1}
                className="pb-200 break-words font-heading-small font-semibold outline-none"
              >
                {recordTitle(preview)}
              </h3>
              {renderPreview(preview)}
            </div>
            <label className="mt-auto flex shrink-0 cursor-pointer items-center gap-100 border-t border-default px-200 py-150 font-body">
              <Checkbox
                checked={!!table.state.rowSelection[preview.id]}
                onCheckedChange={(checked) =>
                  table.setRowSelection((selection) => {
                    const next = { ...selection };
                    if (checked) next[preview.id] = true;
                    else delete next[preview.id];
                    return next;
                  })
                }
              />
              Select {preview.id}
            </label>
          </section>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="shrink-0 px-250 py-100 font-body text-danger">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <div className="me-auto flex items-center gap-100 font-body-small text-subtle">
          <span role="status">{selected.length} selected</span>
          {selected.length ? (
            <Button variant="link" size="small" onClick={() => table.resetRowSelection()}>
              Clear selection
            </Button>
          ) : null}
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-100">
          <Button disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selected.length}
            isLoading={saving}
            onClick={() => void confirm()}
          >
            {confirmLabel}
            {selected.length ? ` (${selected.length})` : ""}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
