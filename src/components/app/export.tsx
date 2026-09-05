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

import {
  Absent,
  Badge,
  Box,
  Button,
  CodeBlock,
  Empty,
  Id,
  Inline,
  Stack,
  Table,
  Eyebrow,
} from "@ledger/design-system";
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
import { cn } from "@ledger/design-system/cn";

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
    <Inline space="space.400" rowSpace="space.100" shouldWrap>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <Eyebrow>{item.label}</Eyebrow>
          <Box className="font-body-small" paddingBlockStart="space.025">
            {item.value}
          </Box>
        </div>
      ))}
    </Inline>
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
  size = "small",
}: {
  filename: string;
  text: string;
  mime: string;
  label: ReactNode;
  /** UTF-8 size for the tooltip, where the caller already knows it. */
  bytes?: number;
  variant?: "primary" | "secondary" | "subtle";
  size?: "xsmall" | "small" | "medium";
}) {
  return (
    <Button
      variant={variant}
      size={size}
      title={bytes === undefined ? filename : `${filename} · ${num(bytes)} bytes`}
      onClick={() => downloadText(filename, text, mime)}
      iconBefore={<Download />}
    >
      {label}
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
      <span className="text-brand">&quot;{key}&quot;</span>:{space}
      <span className={rest.startsWith('"') ? "text-default" : "text-subtle"}>{rest}</span>
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
    <Stack space="space.150">
      <FactStrip
        items={[
          { label: "Model", value: <span className="font-medium">{label}</span> },
          { label: "OSCAL version", value: <Id>{oscalVersion}</Id> },
          { label: "Document uuid", value: <Id>{doc.uuid}</Id> },
          { label: "Last modified", value: <Id>{doc.generated}</Id> },
          {
            label: "Size",
            value: <span className="tabular-nums">{num(bytes)} bytes (UTF-8)</span>,
          },
          { label: "Lines", value: <span className="tabular-nums">{num(lines.length)}</span> },
        ]}
      />

      {outline.entries.length > 0 ? (
        <Stack space="space.075">
          <p className="font-body-small text-subtle">
            <Id>{outline.root}</Id> carries {outline.entries.length} top-level members. Each count
            below is read off the document, not asserted; select one to move the window there.
          </p>
          <Inline space="space.075" shouldWrap>
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
                  "inline-flex items-center gap-075 rounded-medium border border-default px-100 py-050 font-body-small transition-colors",
                  entry.line !== null && entry.line - 1 >= from && entry.line - 1 < to
                    ? "border-brand bg-selected text-brand"
                    : "text-subtle hover:border-bold hover:text-default",
                )}
              >
                <span className="font-body-xsmall">{entry.key}</span>
                <span className="tabular-nums font-body-xsmall text-subtle">{entry.summary}</span>
              </button>
            ))}
          </Inline>
        </Stack>
      ) : null}

      <Inline space="space.100" alignBlock="center" shouldWrap>
        <span className="tabular-nums font-body-small text-subtle">
          Showing lines {num(from + 1)}–{num(to)} of {num(lines.length)}
        </span>
        {from > 0 ? (
          <Button
            size="xsmall"
            onClick={() => {
              setStart(0);
              setCount(windowSize);
            }}
          >
            Back to line 1
          </Button>
        ) : null}
        {remaining > 0 ? (
          <Button size="xsmall" onClick={() => setCount((c) => c + windowSize)}>
            Show {num(Math.min(windowSize, remaining))} more · {num(remaining)} below
          </Button>
        ) : null}
        <Inline className="ml-auto" as="span" space="space.100" alignBlock="center">
          <DownloadButton
            filename={filename}
            text={text}
            bytes={bytes}
            mime="application/json;charset=utf-8"
            label="Download JSON"
          />
        </Inline>
      </Inline>

      <CodeBlock
        start={from + 1}
        lines={slice.map((line) => (
          <JsonLine line={line} />
        ))}
      />

      <p className="font-body-small text-subtle">
        The block above is the serialised document itself — two-space indent and a trailing newline,
        matching NIST&apos;s published OSCAL content. Every value in it is derived from the record,
        so re-exporting produces the same {num(bytes)} bytes and the same uuid. The download carries
        the whole document, not the window.
      </p>
    </Stack>
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
    <Stack space="space.150">
      <p className="font-body-small text-subtle">{sheet.note}</p>
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <span className="tabular-nums font-body-small text-subtle">
          {sheet.columns.length} eMASS columns · {num(sheet.rows.length)} rows ·{" "}
          {shown.length === sheet.rows.length
            ? "all rows shown"
            : `${num(shown.length)} shown, ${num(remaining)} below`}
        </span>
        {remaining > 0 ? (
          <Button size="xsmall" onClick={() => setLimit((n) => n + pageSize)}>
            Show {num(Math.min(pageSize, remaining))} more
          </Button>
        ) : null}
      </Inline>

      {/* Twenty eMASS columns do not fit any viewport. The table keeps its own
          width and scrolls inside this frame so the page body never does. */}
      <Table className="table-fixed" style={{ width: `${total}px` }}>
        <thead>
          <tr>
            {sheet.columns.map((column, i) => (
              <Table.Header key={column} title={column} width={widths[i]}>
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
    </Stack>
  );
}

/* ── Transfer bundle ─────────────────────────────────────────────────────── */

/** The full digest, wrapped rather than elided — a truncated hash checks nothing. */
function Hash({ value }: { value: string }) {
  if (value === "—") return <Absent />;
  return <span className="block break-all font-body-xsmall text-subtle">{value}</span>;
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
    <Stack space="space.250">
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
              <span className="tabular-nums">
                {bundle.artifacts.length} artifacts · {num(totalBytes)} bytes
              </span>
            ),
          },
        ]}
      />

      <p className="font-body-small text-subtle">{bundle.note}</p>

      <Stack space="space.100">
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={232}>Path on media</Table.Header>
              <Table.Header>Produced by</Table.Header>
              <Table.Header width={96} className="text-right">
                Bytes
              </Table.Header>
              <Table.Header width={208}>{digestAlgorithm}</Table.Header>
              <Table.Header width={88} />
            </tr>
          </thead>
          <tbody>
            {bundle.artifacts.map((artifact) => (
              <Table.Row key={artifact.path} className="align-top" isStatic>
                <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                  <Id>{artifact.path}</Id>
                  <Box
                    className="block font-body-xsmall text-subtle"
                    as="span"
                    paddingBlockStart="space.025"
                  >
                    {artifact.kind}
                  </Box>
                </Table.Cell>
                <Table.Cell
                  className="max-w-none whitespace-normal py-100 align-top"
                  title={artifact.producer}
                >
                  {artifact.producer}
                </Table.Cell>
                <Table.Cell className="tabular-nums py-100 align-top text-right">
                  {num(artifact.bytes)}
                </Table.Cell>
                <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                  <Hash value={artifact.sha256} />
                </Table.Cell>
                <Table.Cell className="py-100 align-top text-right">
                  {onDownloadArtifact ? (
                    <Button size="xsmall" onClick={() => onDownloadArtifact(artifact)}>
                      <Download className="size-150" /> File
                    </Button>
                  ) : (
                    <Absent />
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        <p className="font-body-small text-subtle">
          Each digest is a {digestAlgorithm} of that artifact&apos;s exact UTF-8 bytes, computed
          when the bundle was generated. Nothing here is a recorded literal: regenerating the bundle
          from the same record reproduces every row above, which is what makes the manifest
          checkable at the far end.
        </p>
      </Stack>

      <div className="rounded-large border border-default bg-surface">
        <Box className="border-b border-default" paddingInline="space.200" paddingBlock="space.150">
          <h3 className="font-body font-semibold">Manifest and integrity block</h3>
          <p className="pt-025 font-body-small text-subtle">
            The manifest below is the signable text: a fixed header, the artifact rows sorted by
            path, and no self-reference — a manifest that covered its own digest could not be
            verified.
          </p>
        </Box>
        <Stack className="px-200 py-150" space="space.150">
          <div>
            <Eyebrow>Manifest digest</Eyebrow>
            <Hash value={bundle.manifestHash} />
          </div>

          <div
            className="overflow-auto rounded-medium border border-default bg-surface-sunken"
            style={{ maxHeight: 280 }}
          >
            <pre className="w-max min-w-full px-150 py-100 font-code font-body-xsmall text-default">
              {manifest}
            </pre>
          </div>

          <dl className="grid gap-x-300 gap-y-050 sm:grid-cols-2">
            <Inline className="font-body-small" space="space.100">
              <dt className="shrink-0 text-subtle" style={{ width: 92 }}>
                Algorithm
              </dt>
              <dd className="min-w-0">{bundle.signature.algorithm}</dd>
            </Inline>
            <Inline className="font-body-small" space="space.100">
              <dt className="shrink-0 text-subtle" style={{ width: 92 }}>
                Key id
              </dt>
              <dd className="min-w-0">{bundle.signature.keyId}</dd>
            </Inline>
            <Inline className="font-body-small" space="space.100">
              <dt className="shrink-0 text-subtle" style={{ width: 92 }}>
                Signer
              </dt>
              <dd className="min-w-0">{bundle.signature.signer}</dd>
            </Inline>
            <Inline className="font-body-small" space="space.100">
              <dt className="shrink-0 text-subtle" style={{ width: 92 }}>
                Signed on
              </dt>
              <dd className="min-w-0">{bundle.signature.signedOn}</dd>
            </Inline>
            <Inline className="font-body-small sm:col-span-2" space="space.100">
              <dt className="shrink-0 text-subtle" style={{ width: 92 }}>
                Value
              </dt>
              <dd className="min-w-0">
                <Hash value={bundle.signature.value} />
              </dd>
            </Inline>
          </dl>

          <p className="rounded-medium border border-warning-subtle bg-warning px-150 py-100 font-body-small text-default">
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
        </Stack>
      </div>
    </Stack>
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
    danger: "border-danger-subtle bg-danger",
    warning: "border-warning-subtle bg-warning",
    success: "border-success-subtle bg-success",
  };

  return (
    <Box
      className={cn("rounded-large border", frame[tone])}
      paddingInline="space.200"
      paddingBlock="space.150"
    >
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Badge tone={tone}>
          {reconciliation.signatureValid ? "Manifest verifies" : "Manifest does not verify"}
        </Badge>
        <span className="font-body-small text-subtle">
          <Id>{reconciliation.received}</Id> received, against <Id>{reconciliation.bundle}</Id>{" "}
          generated here
        </span>
      </Inline>
      <p className="pt-100 font-body font-medium text-default">{reconciliation.verdict}</p>
      <Inline className="pt-100 font-body-small" space="space.300" rowSpace="space.050" shouldWrap>
        <span className="tabular-nums">
          <span className="text-subtle">Identical</span> {reconciliation.identical}
        </span>
        <span className="tabular-nums">
          <span className="text-subtle">Changed</span> {reconciliation.changed}
        </span>
        <span className="tabular-nums">
          <span className="text-subtle">Only here</span> {reconciliation.added}
        </span>
        <span className="tabular-nums">
          <span className="text-subtle">Only on the media</span> {reconciliation.missing}
        </span>
      </Inline>
      <p className="pt-100 font-body-small text-subtle">{reconciliation.signatureNote}</p>
    </Box>
  );
}

export function ReconcileTable({ reconciliation }: { reconciliation: Reconciliation }) {
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={232}>Path</Table.Header>
          <Table.Header width={152}>State</Table.Header>
          <Table.Header>Digest here</Table.Header>
          <Table.Header>Digest received</Table.Header>
        </tr>
      </thead>
      <tbody>
        {reconciliation.rows.map((row) => (
          <Fragment key={row.path}>
            <Table.Row className="border-0 align-top" isStatic>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                <Id>{row.path}</Id>
              </Table.Cell>
              <Table.Cell className="py-100 align-top">
                <Badge tone={reconcileStateTone[row.state]}>{row.state}</Badge>
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                <Hash value={row.localHash} />
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                <Hash value={row.remoteHash} />
              </Table.Cell>
            </Table.Row>
            <Table.Row className="align-top" isStatic>
              <Table.Cell
                className="max-w-none whitespace-normal pb-150 pt-0 align-top"
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
