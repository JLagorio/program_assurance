import { downloadBlob } from "../../lib/download";
import type { SwatchShape } from "./_types";

/* Handing the reader a file: the plot as an image with its title and its key, and the download
   itself, through the kit's `downloadBlob`. */

/** Hands the reader a file, the object URL kept long enough for the save to land. */
export function download(name: string, blob: Blob) {
  downloadBlob(blob, name);
}

const inlined = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "opacity",
  "fill-opacity",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
] as const;

const urlRef = /url\(\s*["']?#([^"')\s]+)["']?\s*\)/;

/** Copies every computed paint and font of `source`'s elements onto `copy`'s, and collects the ids their paints point at. */
function inline(source: Element, copy: Element, referenced: Set<string>) {
  const from = [source, ...source.querySelectorAll<SVGElement>("*")];
  const to = [copy, ...copy.querySelectorAll<SVGElement>("*")];
  from.forEach((el, i) => {
    const target = to[i];
    if (!target || i === 0) return;
    const cs = getComputedStyle(el);
    for (const p of inlined) {
      const v = cs.getPropertyValue(p);
      if (v) target.setAttribute(p, v);
      const id = urlRef.exec(v)?.[1];
      if (id) referenced.add(id);
    }
    target.removeAttribute("class");
  });
}

/**
 * The svg copied with every computed colour and font inlined (the tokens are CSS variables, which
 * an image cannot resolve), and with the patterns its fills point at copied in, wherever in the
 * document they are drawn.
 */
function standalone(svg: SVGSVGElement): SVGSVGElement {
  const doc = svg.ownerDocument;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const referenced = new Set<string>();
  inline(svg, clone, referenced);
  const defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
  for (const id of referenced) {
    if (clone.querySelector(`[id="${CSS.escape(id)}"]`)) continue;
    const found = doc.getElementById(id);
    if (!found) continue;
    // A pattern drawn beside the plot paints in the tokens too: its colours are inlined as well.
    const copy = found.cloneNode(true) as Element;
    inline(found, copy, new Set());
    defs.appendChild(copy);
  }
  if (defs.childNodes.length) clone.insertBefore(defs, clone.firstChild);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return clone;
}

/** A colour the canvas can paint: `value` (a `var()` or any CSS colour) as `element` resolves it. */
function resolveColor(value: string, element: Element): string {
  const probe = element.ownerDocument.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  element.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color || value;
}

/** An element's font as a canvas `font` string. */
const fontOf = (el: Element) => {
  const cs = getComputedStyle(el);
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
};

/** A text broken into lines no wider than `max` on `ctx`'s font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** One key of the image's legend: a name and its colour, keyed by the mark's shape. */
export type ImageKey = { label: string; color: string; shape: SwatchShape };

/** What goes on the image above the plot: the Frame's title and its line, and the legend. */
export type ImageHead = {
  title?: { text: string; element: Element } | undefined;
  description?: { text: string; element: Element } | undefined;
  legend?: { keys: ImageKey[]; element: Element } | undefined;
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The chart could not be drawn as an image."));
    img.src = url;
  });

/**
 * The plot as a PNG at twice the pixel density on the surface under it, with the Frame's title,
 * its line and the legend drawn above in the page's fonts, so the image keeps its name and its key.
 * The plot's own text is in the image's fonts: a browser does not lend web fonts to an svg drawn
 * as an image. Rejects when the browser cannot draw it.
 */
export async function svgToPng(svg: SVGSVGElement, scale = 2, head: ImageHead = {}): Promise<Blob> {
  const rect = svg.getBoundingClientRect();
  const clone = standalone(svg);
  clone.setAttribute("width", String(rect.width));
  clone.setAttribute("height", String(rect.height));
  const source = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas.");
    const pad = head.title || head.legend ? 16 : 0;
    const width = Math.ceil(rect.width + pad * 2);
    const room = Math.max(1, width - pad * 2);
    type Row = { draw: (y: number) => void; height: number };
    const rows: Row[] = [];
    const textRows = (part: { text: string; element: Element } | undefined) => {
      if (!part?.text) return;
      const font = fontOf(part.element);
      const color = getComputedStyle(part.element).color;
      ctx.font = font;
      const lh = parseFloat(getComputedStyle(part.element).lineHeight) || 20;
      for (const line of wrap(ctx, part.text, room))
        rows.push({
          height: lh,
          draw: (y) => {
            ctx.font = font;
            ctx.fillStyle = color;
            ctx.textBaseline = "middle";
            ctx.fillText(line, pad, y + lh / 2);
          },
        });
    };
    textRows(head.title);
    textRows(head.description);
    if (head.legend?.keys.length) {
      const el = head.legend.element;
      const font = fontOf(el);
      const color = getComputedStyle(el).color;
      ctx.font = font;
      const lh = 20;
      let x = 0;
      let line: { x: number; key: ImageKey; paint: string }[] = [];
      const flush = () => {
        const items = line;
        if (items.length)
          rows.push({
            height: lh,
            draw: (y) => {
              for (const it of items) {
                ctx.fillStyle = it.paint;
                if (it.key.shape === "line") ctx.fillRect(pad + it.x, y + lh / 2 - 1, 12, 2);
                else if (it.key.shape === "dot") {
                  ctx.beginPath();
                  ctx.arc(pad + it.x + 5, y + lh / 2, 4, 0, Math.PI * 2);
                  ctx.fill();
                } else ctx.fillRect(pad + it.x, y + lh / 2 - 4, 8, 8);
                ctx.font = font;
                ctx.fillStyle = color;
                ctx.textBaseline = "middle";
                ctx.fillText(it.key.label, pad + it.x + 16, y + lh / 2);
              }
            },
          });
        line = [];
        x = 0;
      };
      for (const key of head.legend.keys) {
        const w = 16 + ctx.measureText(key.label).width + 16;
        if (x > 0 && x + w > room) flush();
        line.push({ x, key, paint: resolveColor(key.color, el) });
        x += w;
      }
      flush();
    }
    const headHeight = rows.reduce((n, r) => n + r.height, 0) + (rows.length ? 12 : 0);
    const height = Math.ceil(headHeight + rect.height + pad * 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.scale(scale, scale);
    ctx.fillStyle = resolveColor(
      "var(--ds-utility-elevation-surface-current, #fff)",
      svg.parentElement ?? svg,
    );
    ctx.fillRect(0, 0, width, height);
    let y = pad;
    for (const r of rows) {
      r.draw(y);
      y += r.height;
    }
    ctx.drawImage(img, pad, y + (rows.length ? 12 : 0), rect.width, rect.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image."))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
