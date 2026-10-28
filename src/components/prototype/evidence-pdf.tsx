import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
  TextLayer as TextLayerType,
} from "pdfjs-dist";
import {
  Alert,
  AlertDescription,
  Button,
  DocumentPage,
  DocumentReader,
  DocumentSelectionToolbar,
  Field,
  FieldLabel,
  FindBar,
  Input,
  Inline,
  Spinner,
  Stack,
  Text,
  type DocumentAnchor,
  type DocumentRectangle,
  type DocumentSelection,
} from "@ledger/design-system";
import "./evidence-pdf.css";
import type { ReactNode } from "react";

type PdfSearchMatch = { text: string; rectangles: DocumentRectangle[] };
type PdfSearchResults = {
  page: number;
  query: string;
  ready: boolean;
  matches: PdfSearchMatch[];
  truncated: boolean;
};

export type EvidencePdfProps = {
  bytes: Uint8Array;
  initialPage?: number | undefined;
  anchors: readonly (DocumentAnchor & { page: number })[];
  onAnchorActivate: (id: string) => void;
  selection: DocumentSelection | null;
  onSelectionChange: (selection: DocumentSelection | null) => void;
  onCite: () => void;
  onDiscuss: () => void;
  onCopyLink: () => void;
  canWrite: boolean;
  aside?: ReactNode | undefined;
};
/** Lazy PDF.js adapter. No document scripts, embedded navigation, or eager worker are enabled. */
export default function EvidencePdf({
  bytes,
  initialPage = 1,
  anchors,
  onAnchorActivate,
  selection,
  onSelectionChange,
  onCite,
  onDiscuss,
  onCopyLink,
  canWrite,
  aside,
}: EvidencePdfProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [failure, setFailure] = useState("");
  const [password, setPassword] = useState("");
  const [passwordNeeded, setPasswordNeeded] = useState(false);
  const passwordCallback = useRef<((password: string) => void) | null>(null);
  const readerFrame = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"text" | "region">("text");
  const [canCopy, setCanCopy] = useState(true);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findIndex, setFindIndex] = useState(0);
  const [findResults, setFindResults] = useState<PdfSearchResults | null>(null);
  const findInput = useRef<HTMLInputElement>(null);
  const findTrigger = useRef<HTMLButtonElement>(null);
  const reportFindResults = useCallback((results: PdfSearchResults) => setFindResults(results), []);
  const currentFind =
    findResults?.page === page && findResults.query === findQuery && findResults.ready
      ? findResults
      : null;
  const currentFindIndex = currentFind?.matches.length
    ? Math.min(findIndex, currentFind.matches.length - 1)
    : null;
  useEffect(() => {
    if (findOpen) findInput.current?.focus();
  }, [findOpen]);
  useEffect(() => {
    setPage(initialPage);
    setFindIndex(0);
  }, [initialPage]);
  useEffect(() => {
    let active = true;
    let task: ReturnType<(typeof import("pdfjs-dist"))["getDocument"]> | undefined;
    void (async () => {
      try {
        const [pdfjs, worker] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        task = pdfjs.getDocument({
          data: bytes.slice(),
          isEvalSupported: false,
          useSystemFonts: true,
          disableAutoFetch: true,
        });
        task.onPassword = (update: (password: string) => void) => {
          if (active) {
            passwordCallback.current = update;
            setPasswordNeeded(true);
            setFailure("This PDF needs a password. Enter it to continue.");
          }
        };
        const result = await task.promise;
        if (!active) {
          await result.destroy();
          return;
        }
        if (result.numPages > 10000)
          throw new Error("This PDF has too many pages for the reader (10,000 maximum).");
        const permissions = await result.getPermissions();
        setCanCopy(!permissions || permissions.includes(pdfjs.PermissionFlag.COPY));
        setDocument(result);
        setPasswordNeeded(false);
        setFailure("");
        setPage((current) => Math.min(Math.max(1, current), result.numPages));
      } catch (error) {
        if (active)
          setFailure(error instanceof Error ? error.message : "The PDF could not be opened.");
      }
    })();
    return () => {
      active = false;
      passwordCallback.current = null;
      void task?.destroy();
    };
  }, [bytes]);
  if (!document)
    return (
      <Stack space="space.150">
        {failure ? (
          <Alert tone="danger">
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        ) : (
          <Inline space="space.100">
            <Spinner />
            <Text>Opening PDF…</Text>
          </Inline>
        )}
        {passwordNeeded && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              passwordCallback.current?.(password);
              setPassword("");
            }}
          >
            <Stack space="space.100">
              <Field>
                <FieldLabel>PDF password</FieldLabel>
                <Input type="password" value={password} onValueChange={setPassword} />
              </Field>
              <Button type="submit">Open PDF</Button>
            </Stack>
          </form>
        )}
      </Stack>
    );
  return (
    <Stack
      ref={readerFrame}
      space="space.100"
      onKeyDown={(event) => {
        if (
          canCopy &&
          (event.ctrlKey || event.metaKey) &&
          !event.altKey &&
          event.key.toLowerCase() === "f"
        ) {
          event.preventDefault();
          setFindOpen(true);
          findInput.current?.focus();
        }
      }}
    >
      {!canCopy && (
        <Text size="small">
          This PDF restricts copying. Selection, citations and passage comments are unavailable.
        </Text>
      )}
      {selection && canCopy && (
        <DocumentSelectionToolbar
          selection={selection}
          anchor={{
            getBoundingClientRect: () => {
              const surface = readerFrame.current?.querySelector(
                '[data-slot="document-page-content"]',
              );
              const bounds = surface?.getBoundingClientRect();
              if (!bounds) return new DOMRect();
              const { x, y, width, height } = selection.rectangle;
              return new DOMRect(
                bounds.x + x * bounds.width,
                bounds.y + y * bounds.height,
                width * bounds.width,
                height * bounds.height,
              );
            },
            contextElement: readerFrame.current ?? undefined,
          }}
          onCite={canWrite ? onCite : undefined}
          onDiscuss={canWrite ? onDiscuss : undefined}
          onCopyLink={onCopyLink}
          onClear={() => onSelectionChange(null)}
        />
      )}
      {findOpen && canCopy && (
        <FindBar
          label="Find on current page"
          inputRef={findInput}
          query={findQuery}
          onQueryChange={(value) => {
            setFindQuery(value);
            setFindIndex(0);
          }}
          count={currentFind?.matches.length ?? 0}
          index={currentFindIndex}
          loading={Boolean(findQuery && !currentFind)}
          truncated={currentFind?.truncated ?? false}
          onNavigate={setFindIndex}
          onClose={() => {
            setFindOpen(false);
            setFindQuery("");
            setFindIndex(0);
            findTrigger.current?.focus();
          }}
        >
          <Text size="small" color="color.text.subtle">
            Page {page} only
          </Text>
        </FindBar>
      )}
      <DocumentReader
        label="Evidence document reader"
        page={page}
        pageCount={document.numPages}
        onPageChange={(value) => {
          setPage(value);
          setFindIndex(0);
          onSelectionChange(null);
        }}
        zoom={zoom}
        onZoomChange={setZoom}
        aside={aside}
        actions={
          canCopy ? (
            <>
              <Button
                ref={findTrigger}
                size="small"
                variant="subtle"
                aria-expanded={findOpen}
                onClick={() => {
                  setFindOpen(true);
                  findInput.current?.focus();
                }}
              >
                Find in page
              </Button>
              <Button
                size="small"
                variant="subtle"
                aria-pressed={mode === "region"}
                onClick={() => setMode((value) => (value === "text" ? "region" : "text"))}
              >
                {mode === "region" ? "Select text" : "Select region"}
              </Button>
            </>
          ) : undefined
        }
      >
        <PdfPage
          key={page}
          document={document}
          page={page}
          zoom={zoom}
          mode={mode}
          canCopy={canCopy}
          findQuery={findOpen && canCopy ? findQuery : ""}
          findIndex={currentFindIndex}
          onFindNavigate={setFindIndex}
          onFindResults={reportFindResults}
          onSelectionChange={onSelectionChange}
          anchors={anchors.filter((a) => a.page === page)}
          onAnchorActivate={onAnchorActivate}
        />
      </DocumentReader>
    </Stack>
  );
}
function PdfPage({
  document,
  page,
  zoom,
  mode,
  canCopy,
  findQuery,
  findIndex,
  onFindNavigate,
  onFindResults,
  onSelectionChange,
  anchors,
  onAnchorActivate,
}: {
  document: PDFDocumentProxy;
  page: number;
  zoom: number;
  mode: "text" | "region";
  canCopy: boolean;
  findQuery: string;
  findIndex: number | null;
  onFindNavigate: (index: number) => void;
  onFindResults: (results: PdfSearchResults) => void;
  onSelectionChange: (selection: DocumentSelection) => void;
  anchors: readonly DocumentAnchor[];
  onAnchorActivate: (id: string) => void;
}) {
  const [pdfPage, setPdfPage] = useState<PDFPageProxy | null>(null);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [renderedWidth, setRenderedWidth] = useState<number | null>(null);
  const [matches, setMatches] = useState<{
    query: string;
    width: number;
    items: PdfSearchMatch[];
  } | null>(null);
  useEffect(() => {
    let active = true;
    void document
      .getPage(page)
      .then((value) => {
        if (active) setPdfPage(value);
      })
      .catch((cause) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
    };
  }, [document, page]);
  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [pdfPage]);
  useEffect(() => {
    if (!pdfPage || !width || !canvas.current || !text.current) return;
    let active = true;
    let render: RenderTask | undefined;
    let layer: TextLayerType | undefined;
    const destination = canvas.current,
      container = text.current;
    setRenderedWidth(null);
    container.replaceChildren();
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (!active) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: width / base.width });
        const ratio = Math.min(
          window.devicePixelRatio || 1,
          2,
          Math.sqrt(16000000 / (viewport.width * viewport.height)),
        );
        destination.width = Math.floor(viewport.width * ratio);
        destination.height = Math.floor(viewport.height * ratio);
        render = pdfPage.render({
          canvas: destination,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        container.style.setProperty("--total-scale-factor", String(viewport.scale));
        layer = new pdfjs.TextLayer({
          textContentSource: await pdfPage.getTextContent(),
          container,
          viewport,
        });
        if (!active) return;
        await Promise.all([render.promise, layer.render()]);
        if (active) setRenderedWidth(width);
      } catch (cause) {
        if (active && !(cause instanceof Error && cause.name === "RenderingCancelledException"))
          setError(cause instanceof Error ? cause.message : "This page could not be rendered.");
      }
    })();
    return () => {
      active = false;
      render?.cancel();
      layer?.cancel();
    };
  }, [pdfPage, width]);
  useEffect(() => {
    const ready = Boolean(
      error || (text.current && frame.current && renderedWidth !== null && renderedWidth === width),
    );
    const result =
      ready && !error && canCopy && findQuery
        ? pageMatches(text.current!, frame.current!, findQuery)
        : { matches: [], truncated: false };
    setMatches({ query: findQuery, width, items: result.matches });
    onFindResults({ page, query: findQuery, ready, ...result });
  }, [renderedWidth, width, page, findQuery, canCopy, error, onFindResults]);
  const visibleMatches =
    matches?.query === findQuery && matches.width === width && renderedWidth === width
      ? matches.items
      : [];
  const findAnchors = visibleMatches.flatMap((match, index) =>
    match.rectangles.map((rectangle, segment) => ({
      id: `find:${page}:${index}:${segment}`,
      label: `Find result ${index + 1} of ${visibleMatches.length}: ${match.text}`,
      rectangle,
      active: index === findIndex,
    })),
  );
  if (error)
    return (
      <Alert tone="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!pdfPage) return <Spinner label="Loading page" />;
  const size = pdfPage.getViewport({ scale: 1 });
  return (
    <DocumentPage
      page={page}
      width={size.width}
      height={size.height}
      zoom={zoom}
      mode={mode}
      onSelectionChange={canCopy ? onSelectionChange : undefined}
      anchors={[...anchors, ...findAnchors]}
      onAnchorActivate={(id) => {
        if (id.startsWith("find:")) {
          const index = Number(id.split(":")[2]);
          if (Number.isInteger(index) && index >= 0 && index < visibleMatches.length)
            onFindNavigate(index);
          return;
        }
        onAnchorActivate(id);
      }}
    >
      <div ref={frame} data-evidence-pdf-page="" data-copy={canCopy}>
        <canvas ref={canvas} aria-hidden="true" />
        <div ref={text} data-pdf-text-layer="" role="document" aria-label={`Page ${page} text`} />
      </div>
    </DocumentPage>
  );
}

/** Match rendered text without replacing PDF.js spans or disturbing native text selection. */
function pageMatches(container: HTMLElement, frame: HTMLElement, query: string) {
  const doc = container.ownerDocument;
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const nodes: { node: globalThis.Text; start: number; end: number }[] = [];
  let source = "";
  let next: Node | null;
  while ((next = walker.nextNode())) {
    if (next.nodeType !== Node.TEXT_NODE) {
      if (next.nodeName === "BR") source += "\n";
      continue;
    }
    const value = next.textContent ?? "";
    if (!value) continue;
    nodes.push({
      node: next as globalThis.Text,
      start: source.length,
      end: source.length + value.length,
    });
    source += value;
  }
  const bounds = frame.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return { matches: [], truncated: false };
  const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
  const matches: PdfSearchMatch[] = [];
  let truncated = false;
  for (const match of source.matchAll(expression)) {
    if (matches.length >= 500) {
      truncated = true;
      break;
    }
    const start = match.index;
    const end = start + match[0].length;
    const first = nodes.find((entry) => entry.start <= start && entry.end > start);
    const last = nodes.find((entry) => entry.start < end && entry.end >= end);
    if (!first || !last) continue;
    const range = doc.createRange();
    range.setStart(first.node, start - first.start);
    range.setEnd(last.node, end - last.start);
    const rectangles = Array.from(range.getClientRects()).flatMap((rect) => {
      const left = Math.max(bounds.left, rect.left),
        top = Math.max(bounds.top, rect.top);
      const right = Math.min(bounds.right, rect.right),
        bottom = Math.min(bounds.bottom, rect.bottom);
      return right > left && bottom > top
        ? [
            {
              x: (left - bounds.left) / bounds.width,
              y: (top - bounds.top) / bounds.height,
              width: (right - left) / bounds.width,
              height: (bottom - top) / bounds.height,
            },
          ]
        : [];
    });
    if (rectangles.length) matches.push({ text: match[0].slice(0, 120), rectangles });
  }
  return { matches, truncated };
}
