import { useRef, useState, useEffect, type ComponentProps, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Scan } from "lucide-react";
import { Button, IconButton } from "../components/button";
import { Input } from "../components/input";
import { SelectionActions, type SelectionActionsProps } from "./selection-actions";
import { Text } from "../primitives/text";
import { cn } from "../lib/cn";

/** A rectangle measured from the displayed page's top-left, independent of zoom. */
export type DocumentRectangle = { x: number; y: number; width: number; height: number };
export type DocumentSelection = { page: number; text: string; rectangle: DocumentRectangle };
export type DocumentAnchor = {
  id: string;
  label: string;
  rectangle: DocumentRectangle;
  active?: boolean | undefined;
};
export type DocumentReaderProps = Omit<ComponentProps<"section">, "title"> & {
  label: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  actions?: ReactNode | undefined;
  /** Optional document-scoped review content; it stacks below the page when narrow. */
  aside?: ReactNode | undefined;
};
/** Renderer-neutral paged reading surface. The host owns parsing, loading and persistence. */
export function DocumentReader({
  label,
  page,
  pageCount,
  onPageChange,
  zoom,
  onZoomChange,
  actions,
  aside,
  children,
  className,
  ...props
}: DocumentReaderProps) {
  const [pageDraft, setPageDraft] = useState<string | null>(null);
  const turn = () => {
    const next = Number(pageDraft);
    if (pageDraft !== null && Number.isInteger(next) && next >= 1 && next <= pageCount)
      onPageChange(next);
    setPageDraft(null);
  };
  return (
    <section
      {...props}
      aria-label={label}
      className={cn("min-w-0 rounded-medium border border-default", className)}
      data-slot="document-reader"
    >
      <div
        className="flex flex-wrap items-center gap-100 border-b border-default p-100"
        role="group"
        aria-label="Document controls"
      >
        <IconButton
          label="Previous page"
          icon={<ChevronLeft />}
          variant="subtle"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <Input
          aria-label="Page number"
          type="number"
          min={1}
          max={pageCount}
          value={pageDraft ?? String(page)}
          onValueChange={setPageDraft}
          onBlur={turn}
          onKeyDown={(event) => {
            if (event.key === "Enter") turn();
            if (event.key === "Escape") setPageDraft(null);
          }}
          className="w-800"
        />
        <Text size="small">of {pageCount}</Text>
        <IconButton
          label="Next page"
          icon={<ChevronRight />}
          variant="subtle"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        />
        <IconButton
          label="Zoom out"
          icon={<Minus />}
          variant="subtle"
          disabled={zoom <= 0.5}
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
        />
        <Text size="small">{Math.round(zoom * 100)}%</Text>
        <IconButton
          label="Zoom in"
          icon={<Plus />}
          variant="subtle"
          disabled={zoom >= 3}
          onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}
        />
        <IconButton
          label="Fit page width"
          icon={<Scan />}
          variant="subtle"
          onClick={() => onZoomChange(1)}
        />
        {actions}
      </div>
      <div data-slot="document-reader-layout">
        <div data-slot="document-reader-viewport" tabIndex={0} aria-label="Document pages">
          {children}
        </div>
        {aside && (
          <aside aria-label="Document discussion" data-slot="document-reader-aside">
            {aside}
          </aside>
        )}
      </div>
    </section>
  );
}
export type DocumentPageProps = ComponentProps<"div"> & {
  page: number;
  /** PDF viewport dimensions, in CSS pixels before fit-to-width scaling. */
  width: number;
  height: number;
  zoom?: number | undefined;
  mode?: "text" | "region" | undefined;
  onSelectionChange?: ((selection: DocumentSelection) => void) | undefined;
  anchors?: readonly DocumentAnchor[] | undefined;
  onAnchorActivate?: ((id: string) => void) | undefined;
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** One rendered page with normalized selection and accessible annotation anchors. */
export function DocumentPage({
  page,
  width,
  height,
  zoom = 1,
  mode = "text",
  onSelectionChange,
  anchors = [],
  onAnchorActivate,
  children,
  className,
  style,
  onPointerDown,
  onPointerUp,
  onPointerMove,
  onPointerCancel,
  onKeyUp,
  ...props
}: DocumentPageProps) {
  const surface = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<DocumentRectangle | null>(null);
  const activeAnchor = anchors.filter((anchor) => anchor.active).at(-1)?.id;
  useEffect(() => {
    if (!activeAnchor || activeAnchor === "selection") return;
    const anchor = Array.from(
      surface.current?.parentElement?.querySelectorAll<HTMLElement>("[data-document-anchor-id]") ??
        [],
    ).find((node) => node.dataset["documentAnchorId"] === activeAnchor);
    anchor?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [activeAnchor, page]);
  const point = (x: number, y: number) => {
    const rect = surface.current!.getBoundingClientRect();
    return { x: clamp((x - rect.left) / rect.width), y: clamp((y - rect.top) / rect.height) };
  };
  const region = (end: { x: number; y: number }) => ({
    x: Math.min(start.current!.x, end.x),
    y: Math.min(start.current!.y, end.y),
    width: Math.abs(end.x - start.current!.x),
    height: Math.abs(end.y - start.current!.y),
  });
  const readText = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !surface.current) return;
    const range = selection.getRangeAt(0);
    if (
      !surface.current.contains(range.startContainer) ||
      !surface.current.contains(range.endContainer)
    )
      return;
    const rect = range.getBoundingClientRect();
    const a = point(rect.left, rect.top),
      b = point(rect.right, rect.bottom);
    const text = selection.toString().trim().slice(0, 10000);
    if (text && b.x > a.x && b.y > a.y)
      onSelectionChange?.({
        page,
        text,
        rectangle: { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y },
      });
  };
  return (
    <div
      {...props}
      className={cn("relative", className)}
      style={{ ...style, width: `${zoom * 100}%`, aspectRatio: `${width} / ${height}` }}
      data-slot="document-page"
      data-page={page}
      data-mode={mode}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (!event.defaultPrevented) readText();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (
          event.defaultPrevented ||
          mode !== "region" ||
          event.button !== 0 ||
          (event.target as HTMLElement).closest("button")
        )
          return;
        event.preventDefault();
        start.current = point(event.clientX, event.clientY);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented && start.current)
          setDraft(region(point(event.clientX, event.clientY)));
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        start.current = null;
        setDraft(null);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (start.current) {
          const rectangle = region(point(event.clientX, event.clientY));
          start.current = null;
          setDraft(null);
          if (rectangle.width > 0.002 && rectangle.height > 0.002)
            onSelectionChange?.({ page, text: "", rectangle });
        } else if (!event.defaultPrevented) readText();
      }}
    >
      <div ref={surface} data-slot="document-page-content">
        {children}
      </div>
      {anchors.map((anchor) => (
        <button
          key={anchor.id}
          type="button"
          data-slot="document-anchor"
          data-document-anchor-id={anchor.id}
          data-active={anchor.active || undefined}
          aria-label={anchor.label}
          aria-pressed={anchor.active ?? false}
          style={{
            left: `${anchor.rectangle.x * 100}%`,
            top: `${anchor.rectangle.y * 100}%`,
            width: `${anchor.rectangle.width * 100}%`,
            height: `${anchor.rectangle.height * 100}%`,
          }}
          onClick={() => onAnchorActivate?.(anchor.id)}
        />
      ))}
      {draft && (
        <div
          data-slot="document-region-selection"
          style={{
            left: `${draft.x * 100}%`,
            top: `${draft.y * 100}%`,
            width: `${draft.width * 100}%`,
            height: `${draft.height * 100}%`,
          }}
        />
      )}
    </div>
  );
}
export type DocumentSelectionToolbarProps = Omit<ComponentProps<"div">, "children"> & {
  selection: DocumentSelection;
  /** Live selection anchor; omit for the original fixed action row. */
  anchor?: SelectionActionsProps["anchor"];
  onCite?: (() => void) | undefined;
  onDiscuss?: (() => void) | undefined;
  onCopyLink?: (() => void) | undefined;
  onClear: () => void;
};
/** Explicit keyboard-reachable actions for the captured selection, retained while controls focus. */
export function DocumentSelectionToolbar({
  selection,
  anchor,
  onCite,
  onDiscuss,
  onCopyLink,
  onClear,
  ...props
}: DocumentSelectionToolbarProps) {
  return (
    <SelectionActions
      {...props}
      anchor={anchor}
      selectionKey={`${selection.page}:${selection.rectangle.x}:${selection.rectangle.y}:${selection.rectangle.width}:${selection.rectangle.height}:${selection.text}`}
      label="Selected passage actions"
      data-slot="document-selection-toolbar"
    >
      <Text size="small">Page {selection.page} selected</Text>
      {onCite && (
        <Button size="small" onClick={onCite}>
          Cite selection
        </Button>
      )}
      {onDiscuss && (
        <Button size="small" onClick={onDiscuss}>
          Discuss selection
        </Button>
      )}
      {onCopyLink && (
        <Button size="small" onClick={onCopyLink}>
          Copy passage link
        </Button>
      )}
      <Button size="small" variant="subtle" onClick={onClear}>
        Clear selection
      </Button>
    </SelectionActions>
  );
}
