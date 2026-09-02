/**
 * Interop and transfer presentation — the artifacts, not a summary of them.
 *
 * Everything on this surface is something a receiving assessor is expected to
 * check, so the guiding rule here is that the reader sees the real thing:
 *
 *  - **`OscalViewer` prints the actual JSON.** Not a field count, not a
 *    rendered abstraction of the document — the bytes `oscalJson` would write
 *    to the media, with line numbers, a UTF-8 byte count and a line count, in a
 *    block that scrolls in both directions inside its own frame. An SSP for a
 *    High baseline runs to tens of thousands of lines, so the block is a window
 *    over the document rather than the whole of it; the window says which lines
 *    it is showing out of how many, the outline jumps to a top-level member,
 *    and the download carries every byte. A viewer that showed a summary would
 *    be asking the reader to trust the summary, which is the one thing an
 *    interop artifact may not do.
 *  - **`BundleManifest` shows every digest in full.** Sixty-four hex characters
 *    per artifact, wrapped rather than elided, because a truncated hash cannot
 *    be compared against anything and a hash you cannot compare is decoration.
 *    The manifest text itself is on the page too, since that — not the table —
 *    is the string that was hashed.
 *  - **The signature block says what it is.** This build holds no key material,
 *    so the block carries a detached SHA-256 digest of the manifest and the
 *    component prints that in plain words beside it. Integrity, not
 *    authenticity. Dressing a digest up as a signature would be the single
 *    fastest way to discredit the whole page.
 *  - **`ReconcileTable` leads with the verdict and then shows its work.** The
 *    sentence a receiving ISSM acts on comes first; the per-path rows and the
 *    line-level detail behind that sentence come underneath, so the verdict can
 *    be argued with rather than merely believed.
 *
 * Presentation only. Every value arrives as a prop; nothing here hashes,
 * generates, reconciles or sorts anything. The one exception is
 * `downloadText`, which is a browser action rather than a derivation and is
 * guarded for SSR.
 */

import { Fragment, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Button, Table, Id, Absent, CodeBlock } from "@/ds/primitives";
import { Empty } from "@/ds/patterns";
import {
  digestAlgorithm,
  reconcileStateTone,
  signatureAlgorithm,
  type BundleArtifact,
  type Reconciliation,
  type TransferBundle,
} from "@/lib/airgap";
import type { EmassExport } from "@/lib/emass";
import { oscalVersion, type JsonObject, type JsonValue, type OscalDocument } from "@/lib/oscal";
import { cn } from "@/lib/utils";

/* ── Shared bits ─────────────────────────────────────────────────────────── */

const encoder = new TextEncoder();

/** UTF-8 byte length — what the media holds, which is not the character count. */
function utf8Bytes(text: string): number {
  return encoder.encode(text).length;
}

function num(n: number): string {
  return n.toLocaleString("en-US");
}

/** A short, uniform facts strip: label above value, wrapping on narrow screens. */
function FactStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {item.label}
          </div>
          <div className="mt-0.5 text-[12.5px]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Download ────────────────────────────────────────────────────────────── */

/**
 * Client-side download of generated text. Guarded because every route in this
 * app also renders on the server, where there is no `document` and no Blob to
 * hand anyone. The object URL is revoked as soon as the click is dispatched.
 */
export function downloadText(filename: string, text: string, mime: string): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DownloadButton({
  filename,
  text,
  mime,
  label,
  bytes,
  variant = "secondary",
  size = "sm",
}: {
  filename: string;
  text: string;
  mime: string;
  label: ReactNode;
  /** UTF-8 size for the tooltip, where the caller already knows it. */
  bytes?: number;
  variant?: "primary" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md";
}) {
  return (
    <Button
      variant={variant}
      size={size}
      title={bytes === undefined ? filename : `${filename} · ${num(bytes)} bytes`}
      onClick={() => downloadText(filename, text, mime)}
    >
      <Download className="size-3.5" /> {label}
    </Button>
  );
}

/* ── OSCAL viewer ────────────────────────────────────────────────────────── */

type OutlineEntry = {
  key: string;
  /** What the member holds, counted from the document rather than described. */
  summary: string;
  /** 1-based line of the member in the serialised document, or null if unfound. */
  line: number | null;
};

/**
 * The document's top-level members, counted.
 *
 * An OSCAL document is one wrapper key over one object; this reads that object
 * and reports each member's real size, which is what tells a reader whether the
 * SSP they are about to import carries thirty-four components or none.
 */
function outlineOf(json: JsonValue, lines: string[]): { root: string; entries: OutlineEntry[] } {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return { root: "—", entries: [] };
  }
  const rootKey = Object.keys(json)[0];
  if (rootKey === undefined) return { root: "—", entries: [] };
  const body = (json as JsonObject)[rootKey];
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { root: rootKey, entries: [] };
  }

  const entries: OutlineEntry[] = Object.entries(body).map(([key, value]) => {
    const summary = Array.isArray(value)
      ? `${num(value.length)} ${value.length === 1 ? "entry" : "entries"}`
      : typeof value === "object" && value !== null
        ? `${num(Object.keys(value).length)} fields`
        : String(value);
    // `JSON.stringify(x, null, 2)` puts a top-level member at four spaces, so
    // the prefix is unambiguous and the first match is the member itself.
    const needle = `    "${key}":`;
    const index = lines.findIndex((l) => l.startsWith(needle));
    return { key, summary, line: index < 0 ? null : index + 1 };
  });

  return { root: rootKey, entries };
}

/** One serialised line, with its key tinted so the structure reads at a glance. */
function JsonLine({ line }: { line: string }) {
  const match = /^(\s*)"((?:[^"\\]|\\.)*)":( ?)(.*)$/.exec(line);
  if (!match) return <span className="whitespace-pre">{line}</span>;
  const [, indent = "", key = "", space = "", rest = ""] = match;
  return (
    <span className="whitespace-pre">
      {indent}
      <span className="text-primary">&quot;{key}&quot;</span>:{space}
      <span className={rest.startsWith('"') ? "text-foreground" : "text-muted-foreground"}>
        {rest}
      </span>
    </span>
  );
}

export function OscalViewer({
  doc,
  text,
  filename,
  label,
  windowSize = 300,
}: {
  doc: OscalDocument;
  /** The exact bytes `oscalJson(doc)` produced — this component never derives them. */
  text: string;
  filename: string;
  label: string;
  windowSize?: number;
}) {
  const lines = useMemo(() => text.split("\n"), [text]);
  const bytes = useMemo(() => utf8Bytes(text), [text]);
  const outline = useMemo(() => outlineOf(doc.json, lines), [doc.json, lines]);

  const [start, setStart] = useState(0);
  const [count, setCount] = useState(windowSize);

  const from = Math.min(start, Math.max(0, lines.length - 1));
  const to = Math.min(lines.length, from + count);
  const slice = lines.slice(from, to);
  const remaining = lines.length - to;

  return (
    <div className="space-y-3">
      <FactStrip
        items={[
          { label: "Model", value: <span className="font-medium">{label}</span> },
          { label: "OSCAL version", value: <Id>{oscalVersion}</Id> },
          { label: "Document uuid", value: <Id>{doc.uuid}</Id> },
          { label: "Last modified", value: <Id>{doc.generated}</Id> },
          { label: "Size", value: <span className="tnum">{num(bytes)} bytes (UTF-8)</span> },
          { label: "Lines", value: <span className="tnum">{num(lines.length)}</span> },
        ]}
      />

      {outline.entries.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[12.5px] text-muted-foreground">
            <Id>{outline.root}</Id> carries {outline.entries.length} top-level members. Each count
            below is read off the document, not asserted; select one to move the window there.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {outline.entries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                disabled={entry.line === null}
                title={
                  entry.line === null
                    ? `${entry.key} — not located in the serialised text`
                    : `${entry.key} begins at line ${num(entry.line)}`
                }
                onClick={() => {
                  if (entry.line === null) return;
                  setStart(entry.line - 1);
                  setCount(windowSize);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] transition-colors",
                  entry.line !== null && entry.line - 1 >= from && entry.line - 1 < to
                    ? "border-primary/40 bg-primary-soft text-primary"
                    : "text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                <span className="text-[11.5px]">{entry.key}</span>
                <span className="tnum text-[11px] text-muted-foreground">{entry.summary}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="tnum text-[12px] text-muted-foreground">
          Showing lines {num(from + 1)}–{num(to)} of {num(lines.length)}
        </span>
        {from > 0 ? (
          <Button
            size="xs"
            onClick={() => {
              setStart(0);
              setCount(windowSize);
            }}
          >
            Back to line 1
          </Button>
        ) : null}
        {remaining > 0 ? (
          <Button size="xs" onClick={() => setCount((c) => c + windowSize)}>
            Show {num(Math.min(windowSize, remaining))} more · {num(remaining)} below
          </Button>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          <DownloadButton
            filename={filename}
            text={text}
            bytes={bytes}
            mime="application/json;charset=utf-8"
            label="Download JSON"
          />
        </span>
      </div>

      <CodeBlock
        start={from + 1}
        lines={slice.map((line) => (
          <JsonLine line={line} />
        ))}
      />

      <p className="text-[12px] text-muted-foreground">
        The block above is the serialised document itself — two-space indent and a trailing newline,
        matching NIST&apos;s published OSCAL content. Every value in it is derived from the record,
        so re-exporting produces the same {num(bytes)} bytes and the same uuid. The download carries
        the whole document, not the window.
      </p>
    </div>
  );
}

/* ── eMASS sheet ─────────────────────────────────────────────────────────── */

/** Column width from the widest cell actually present, clamped to a readable band. */
function columnWidths(sheet: EmassExport): number[] {
  return sheet.columns.map((column, i) => {
    let longest = column.length;
    for (const row of sheet.rows) longest = Math.max(longest, (row[i] ?? "").length);
    return Math.min(320, Math.max(112, longest * 7 + 24));
  });
}

export function EmassTable({ sheet, pageSize = 40 }: { sheet: EmassExport; pageSize?: number }) {
  const widths = useMemo(() => columnWidths(sheet), [sheet]);
  const total = widths.reduce((a, w) => a + w, 0);
  const [limit, setLimit] = useState(pageSize);

  const shown = sheet.rows.slice(0, limit);
  const remaining = sheet.rows.length - shown.length;

  if (sheet.rows.length === 0) {
    return (
      <Empty
        title={`The ${sheet.kind} sheet has no rows for this program`}
        description={sheet.note}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{sheet.note}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="tnum text-[12px] text-muted-foreground">
          {sheet.columns.length} eMASS columns · {num(sheet.rows.length)} rows ·{" "}
          {shown.length === sheet.rows.length
            ? "all rows shown"
            : `${num(shown.length)} shown, ${num(remaining)} below`}
        </span>
        {remaining > 0 ? (
          <Button size="xs" onClick={() => setLimit((n) => n + pageSize)}>
            Show {num(Math.min(pageSize, remaining))} more
          </Button>
        ) : null}
      </div>

      {/* Twenty eMASS columns do not fit any viewport. The table keeps its own
          width and scrolls inside this frame so the page body never does. */}
      <Table className="table-fixed" style={{ width: `${total}px` }}>
        <colgroup>
          {widths.map((w, i) => (
            <col key={sheet.columns[i] ?? String(i)} style={{ width: `${w}px` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {sheet.columns.map((column) => (
              <Table.Header key={column} title={column}>
                {column}
              </Table.Header>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, rowIndex) => (
            <Table.Row key={`${row[0] ?? "row"}-${rowIndex}`}>
              {sheet.columns.map((column, i) => {
                const cell = (row[i] ?? "").trim();
                return (
                  <Table.Cell key={column} title={cell === "" ? "—" : cell}>
                    {cell === "" ? <Absent /> : cell}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/* ── Transfer bundle ─────────────────────────────────────────────────────── */

/** The full digest, wrapped rather than elided — a truncated hash checks nothing. */
function Hash({ value }: { value: string }) {
  if (value === "—") return <Absent />;
  return (
    <span className="block break-all text-[10.5px] leading-[1.45] text-muted-foreground">
      {value}
    </span>
  );
}

export function BundleManifest({
  bundle,
  manifest,
  onDownloadArtifact,
}: {
  bundle: TransferBundle;
  /** The signable manifest text — the exact string that was hashed. */
  manifest: string;
  onDownloadArtifact?: (artifact: BundleArtifact) => void;
}) {
  const totalBytes = bundle.artifacts.reduce((a, x) => a + x.bytes, 0);
  const consistent = bundle.signature.value === bundle.manifestHash;

  return (
    <div className="space-y-5">
      <FactStrip
        items={[
          { label: "Bundle", value: <Id>{bundle.id}</Id> },
          { label: "Program", value: <Id>{bundle.program}</Id> },
          { label: "Baseline", value: <Id>{bundle.build}</Id> },
          { label: "Created", value: bundle.created },
          { label: "Created by", value: bundle.createdBy },
          { label: "Classification", value: <Badge tone="warning">{bundle.classification}</Badge> },
          {
            label: "Media",
            value: (
              <span className="tnum">
                {bundle.artifacts.length} artifacts · {num(totalBytes)} bytes
              </span>
            ),
          },
        ]}
      />

      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{bundle.note}</p>

      <div className="space-y-2">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "232px" }} />
            <col />
            <col style={{ width: "96px" }} />
            <col style={{ width: "208px" }} />
            <col style={{ width: "88px" }} />
          </colgroup>
          <thead>
            <tr>
              <Table.Header>Path on media</Table.Header>
              <Table.Header>Produced by</Table.Header>
              <Table.Header className="text-right">Bytes</Table.Header>
              <Table.Header>{digestAlgorithm}</Table.Header>
              <Table.Header />
            </tr>
          </thead>
          <tbody>
            {bundle.artifacts.map((artifact) => (
              <Table.Row key={artifact.path} className="align-top hover:bg-transparent">
                <Table.Cell className="max-w-none whitespace-normal py-2 align-top leading-snug">
                  <Id>{artifact.path}</Id>
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                    {artifact.kind}
                  </span>
                </Table.Cell>
                <Table.Cell
                  className="max-w-none whitespace-normal py-2 align-top leading-snug"
                  title={artifact.producer}
                >
                  {artifact.producer}
                </Table.Cell>
                <Table.Cell className="tnum py-2 align-top text-right">
                  {num(artifact.bytes)}
                </Table.Cell>
                <Table.Cell className="max-w-none whitespace-normal py-2 align-top">
                  <Hash value={artifact.sha256} />
                </Table.Cell>
                <Table.Cell className="py-2 align-top text-right">
                  {onDownloadArtifact ? (
                    <Button size="xs" onClick={() => onDownloadArtifact(artifact)}>
                      <Download className="size-3" /> File
                    </Button>
                  ) : (
                    <Absent />
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        <p className="text-[12px] text-muted-foreground">
          Each digest is a {digestAlgorithm} of that artifact&apos;s exact UTF-8 bytes, computed
          when the bundle was generated. Nothing here is a recorded literal: regenerating the bundle
          from the same record reproduces every row above, which is what makes the manifest
          checkable at the far end.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-semibold">Manifest and integrity block</h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            The manifest below is the signable text: a fixed header, the artifact rows sorted by
            path, and no self-reference — a manifest that covered its own digest could not be
            verified.
          </p>
        </div>
        <div className="space-y-3 px-4 py-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Manifest digest
            </div>
            <Hash value={bundle.manifestHash} />
          </div>

          <div className="max-h-[280px] overflow-auto rounded-md border border-border bg-subtle">
            <pre className="w-max min-w-full px-3 py-2 font-mono text-[11px] leading-[1.55] text-foreground">
              {manifest}
            </pre>
          </div>

          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <div className="flex gap-2 text-[12.5px]">
              <dt className="w-[92px] shrink-0 text-muted-foreground">Algorithm</dt>
              <dd className="min-w-0">{bundle.signature.algorithm}</dd>
            </div>
            <div className="flex gap-2 text-[12.5px]">
              <dt className="w-[92px] shrink-0 text-muted-foreground">Key id</dt>
              <dd className="min-w-0">{bundle.signature.keyId}</dd>
            </div>
            <div className="flex gap-2 text-[12.5px]">
              <dt className="w-[92px] shrink-0 text-muted-foreground">Signer</dt>
              <dd className="min-w-0">{bundle.signature.signer}</dd>
            </div>
            <div className="flex gap-2 text-[12.5px]">
              <dt className="w-[92px] shrink-0 text-muted-foreground">Signed on</dt>
              <dd className="min-w-0">{bundle.signature.signedOn}</dd>
            </div>
            <div className="flex gap-2 text-[12.5px] sm:col-span-2">
              <dt className="w-[92px] shrink-0 text-muted-foreground">Value</dt>
              <dd className="min-w-0">
                <Hash value={bundle.signature.value} />
              </dd>
            </div>
          </dl>

          <p className="rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-[12.5px] leading-relaxed text-foreground">
            <span className="font-medium">What this block is, plainly.</span> {signatureAlgorithm}.
            This build holds no key material and no PKI, so the value above is the manifest digest
            itself
            {consistent
              ? " — it matches the digest in the row above because it is that digest"
              : " — and it does not match the manifest digest above, which means the two were not produced together"}
            . It proves the manifest was not altered between generation and reading. It proves
            nothing about who produced the media; authenticity rests on the chain of custody of the
            write-once media and the courier receipt, not on this value.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Reconciliation ──────────────────────────────────────────────────────── */

/** The sentence a receiving ISSM acts on, before any table. */
export function ReconcileVerdict({ reconciliation }: { reconciliation: Reconciliation }) {
  const tone = !reconciliation.signatureValid
    ? "danger"
    : reconciliation.changed + reconciliation.missing > 0
      ? "warning"
      : "success";
  const frame: Record<"danger" | "warning" | "success", string> = {
    danger: "border-danger/30 bg-danger-soft",
    warning: "border-warning/25 bg-warning-soft",
    success: "border-success/25 bg-success-soft",
  };

  return (
    <div className={cn("rounded-lg border px-4 py-3", frame[tone])}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>
          {reconciliation.signatureValid ? "Manifest verifies" : "Manifest does not verify"}
        </Badge>
        <span className="text-[12px] text-muted-foreground">
          <Id>{reconciliation.received}</Id> received, against <Id>{reconciliation.bundle}</Id>{" "}
          generated here
        </span>
      </div>
      <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-foreground">
        {reconciliation.verdict}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1 text-[12.5px]">
        <span className="tnum">
          <span className="text-muted-foreground">Identical</span> {reconciliation.identical}
        </span>
        <span className="tnum">
          <span className="text-muted-foreground">Changed</span> {reconciliation.changed}
        </span>
        <span className="tnum">
          <span className="text-muted-foreground">Only here</span> {reconciliation.added}
        </span>
        <span className="tnum">
          <span className="text-muted-foreground">Only on the media</span> {reconciliation.missing}
        </span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {reconciliation.signatureNote}
      </p>
    </div>
  );
}

export function ReconcileTable({ reconciliation }: { reconciliation: Reconciliation }) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "232px" }} />
        <col style={{ width: "152px" }} />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Path</Table.Header>
          <Table.Header>State</Table.Header>
          <Table.Header>Digest here</Table.Header>
          <Table.Header>Digest received</Table.Header>
        </tr>
      </thead>
      <tbody>
        {reconciliation.rows.map((row) => (
          <Fragment key={row.path}>
            <Table.Row className="border-0 align-top hover:bg-transparent">
              <Table.Cell className="max-w-none whitespace-normal py-2 align-top leading-snug">
                <Id>{row.path}</Id>
              </Table.Cell>
              <Table.Cell className="py-2 align-top">
                <Badge tone={reconcileStateTone[row.state]}>{row.state}</Badge>
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-2 align-top">
                <Hash value={row.localHash} />
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-2 align-top">
                <Hash value={row.remoteHash} />
              </Table.Cell>
            </Table.Row>
            <Table.Row className="align-top hover:bg-transparent">
              <Table.Cell
                className="max-w-none whitespace-normal pb-3 pt-0 align-top leading-relaxed"
                colSpan={4}
              >
                {row.detail}
              </Table.Cell>
            </Table.Row>
          </Fragment>
        ))}
      </tbody>
    </Table>
  );
}
