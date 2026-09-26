/*
 * Hand the reader a file the page made: an export, a CSV, a report. One anchor with `download`,
 * clicked in the document and removed, and the object URL revoked well after the click. Revoking
 * it in the same task, as a hand-built download often does, can cancel the save in Safari and
 * Firefox, which read the URL after the click returns; FileSaver.js waits 40 seconds, and so does
 * this. The page keeps the Blob that long, which is the price of a download that always lands.
 */

/** How long the object URL outlives the click, so a slow disk or a save dialog still reads it. */
export const DOWNLOAD_REVOKE_DELAY = 40_000;

/** The byte order mark Excel needs to read a UTF-8 CSV as UTF-8 rather than the system code page. */
const BOM = "﻿";

/**
 * Save `blob` as `filename` through the browser's download. Returns false, and does nothing, where
 * there is no document (on the server). The object URL is revoked after
 * `DOWNLOAD_REVOKE_DELAY`, never in the same task as the click.
 */
export function downloadBlob(blob: Blob, filename: string): boolean {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return false;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.trim() || "download";
  anchor.rel = "noopener";
  anchor.hidden = true;
  // Firefox and older Safari follow only an anchor that is in the document.
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_REVOKE_DELAY);
  }
  return true;
}

export type DownloadTextOptions = {
  /** The file's media type. Plain UTF-8 text by default; `text/csv;charset=utf-8` for a CSV. */
  type?: string | undefined;
  /**
   * Starts the file with a UTF-8 byte order mark, so Excel reads accented and non-Latin text
   * correctly. Off by default; turn it on for a CSV a reader will open in a spreadsheet.
   */
  bom?: boolean | undefined;
};

/**
 * Save `text` as `filename`: a CSV, JSON or plain-text export built in the page. Returns false
 * where there is no document. For CSV, pass `type: "text/csv;charset=utf-8"` and `bom: true`.
 */
export function downloadText(
  text: string,
  filename: string,
  { type = "text/plain;charset=utf-8", bom = false }: DownloadTextOptions = {},
): boolean {
  if (typeof document === "undefined") return false;
  return downloadBlob(new Blob(bom ? [BOM, text] : [text], { type }), filename);
}
