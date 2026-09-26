import { useEffect, useRef, type ComponentProps } from "react";

import { cn } from "./cn";

/*
 * One channel for status messages a screen reader should hear without focus moving: a result
 * count after a search, a save, a page change. Two persistent live regions, polite and assertive,
 * exist before any message does, so assistive technology has registered them by the time one
 * arrives. Each message is a new line in its region, so the same words said twice are heard
 * twice, and each line leaves after a few seconds, so the region never becomes a log a reader
 * browses into. Base UI's modal dialogs leave `aria-live` regions exposed, so a message sent while
 * one is open is still heard. The model is React Aria's live announcer.
 */

/** Which region a message goes to: `polite` waits for the reader, `assertive` interrupts. */
export type AnnouncePoliteness = "polite" | "assertive";

export type AnnounceOptions = {
  /** `polite` waits until the reader is idle; `assertive` interrupts what is being read, for an error that stops the task. Polite by default. */
  politeness?: AnnouncePoliteness | undefined;
};

type Regions = Record<AnnouncePoliteness, HTMLElement>;

/** How long a line stays in its region: long enough to be read, short enough not to pile up. */
const LINE_LIFETIME = 7000;
/** A region added to the document is not heard until assistive technology has seen it, so the first message into a new fallback region waits this long. */
const REGION_SETTLE = 100;

/** The mounted Announcers, oldest first. The newest receives the messages. */
const mounted: Regions[] = [];
let fallback: { regions: Regions; ready: boolean; queue: [string, AnnouncePoliteness][] } | null =
  null;

function post(regions: Regions, message: string, politeness: AnnouncePoliteness) {
  const region = regions[politeness];
  const line = region.ownerDocument.createElement("div");
  line.textContent = message;
  region.appendChild(line);
  setTimeout(() => line.remove(), LINE_LIFETIME);
}

const regionAttributes = (politeness: AnnouncePoliteness) =>
  ({
    role: "log",
    "aria-live": politeness,
    "aria-relevant": "additions",
    "data-slot": "announcer-region",
    "data-politeness": politeness,
  }) as const;

/** The regions `announce` creates in the body when no Announcer is mounted. */
function fallbackRegions(doc: Document) {
  if (fallback?.regions.polite.isConnected) return fallback;
  const root = doc.createElement("div");
  root.className = "sr-only";
  root.setAttribute("data-slot", "announcer");
  root.setAttribute("data-fallback", "");
  const make = (politeness: AnnouncePoliteness) => {
    const region = doc.createElement("div");
    for (const [name, value] of Object.entries(regionAttributes(politeness)))
      region.setAttribute(name, value);
    root.appendChild(region);
    return region;
  };
  const regions = { polite: make("polite"), assertive: make("assertive") };
  doc.body.appendChild(root);
  const created = { regions, ready: false, queue: [] as [string, AnnouncePoliteness][] };
  fallback = created;
  setTimeout(() => {
    created.ready = true;
    for (const [message, politeness] of created.queue.splice(0)) post(regions, message, politeness);
  }, REGION_SETTLE);
  return created;
}

/**
 * Say `message` through the live regions. Safe to call anywhere: on the server it does nothing,
 * and without a mounted Announcer it creates the regions in the body and speaks once they settle.
 */
export function announce(message: string, { politeness = "polite" }: AnnounceOptions = {}): void {
  if (typeof document === "undefined") return;
  const text = message.trim();
  if (!text) return;
  for (let i = mounted.length - 1; i >= 0; i--) {
    const regions = mounted[i];
    if (regions?.polite.isConnected) {
      post(regions, text, politeness);
      return;
    }
  }
  const lazy = fallbackRegions(document);
  if (lazy.ready) post(lazy.regions, text, politeness);
  else lazy.queue.push([text, politeness]);
}

export type AnnouncerProps = Omit<ComponentProps<"div">, "children">;

/**
 * The page's persistent live regions, visually hidden. Shell mounts one; a product without a Shell
 * mounts one near its root. `announce` speaks through the newest one mounted.
 */
export function Announcer({ className, ...props }: AnnouncerProps) {
  const polite = useRef<HTMLDivElement>(null);
  const assertive = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!polite.current || !assertive.current) return;
    const regions = { polite: polite.current, assertive: assertive.current };
    mounted.push(regions);
    return () => {
      const index = mounted.lastIndexOf(regions);
      if (index >= 0) mounted.splice(index, 1);
    };
  }, []);
  return (
    <div {...props} data-slot="announcer" className={cn("sr-only", className)}>
      <div ref={polite} {...regionAttributes("polite")} />
      <div ref={assertive} {...regionAttributes("assertive")} />
    </div>
  );
}
