/**
 * Per-family lazy access to the SP 800-53 / 800-53A control text.
 *
 * This is the module to import when a screen needs one family or one control:
 * each family is its own chunk, so `loadControlText("AC-2")` fetches AC and
 * nothing else. Importing `../nist-control-text` instead materialises all
 * 20 families, which is what the SCTM, ConMon and baseline screens want.
 *
 * Generated from the NIST OSCAL release of SP 800-53 Rev. 5 (catalog version
 * 5.2.0, 2026-05-11, OSCAL 1.2.2) and the SP 800-53B Low /
 * Moderate / High / Privacy baseline profiles.
 * NIST publications are US Government works in the public domain.
 *
 * Do not hand-edit — regenerate with: node scripts/gen-nist-catalog.mjs
 */

import type { NistControlText } from "../nist-catalog";
import type { ReferenceFamilyLoader } from "../reference-provenance";

type Chunk = { controlText: Record<string, NistControlText> };

const chunks: Record<string, () => Promise<Chunk>> = {
  AC: () => import("./ac"),
  AT: () => import("./at"),
  AU: () => import("./au"),
  CA: () => import("./ca"),
  CM: () => import("./cm"),
  CP: () => import("./cp"),
  IA: () => import("./ia"),
  IR: () => import("./ir"),
  MA: () => import("./ma"),
  MP: () => import("./mp"),
  PE: () => import("./pe"),
  PL: () => import("./pl"),
  PM: () => import("./pm"),
  PS: () => import("./ps"),
  PT: () => import("./pt"),
  RA: () => import("./ra"),
  SA: () => import("./sa"),
  SC: () => import("./sc"),
  SI: () => import("./si"),
  SR: () => import("./sr"),
};

/** The 20 SP 800-53 Rev. 5 family ids, in catalog order. */
export const controlTextFamilies: string[] = Object.keys(chunks);

const cache = new Map<string, Promise<Record<string, NistControlText>>>();

/** "AC", "ac", or any control id in the family ("AC-2(3)") -> "AC". */
function familyKey(value: string): string {
  const head = value.split("-", 1)[0] ?? value;
  return head.trim().toUpperCase();
}

/** True when `family` names one of the 20 SP 800-53 families. */
export function isControlTextFamily(family: string): boolean {
  return familyKey(family) in chunks;
}

/**
 * The control text for one family, fetched once and cached.
 * Throws on a family the catalog does not have — that is a programming error,
 * not a miss; use `isControlTextFamily` first when the value is user input.
 */
export function loadControlFamily(family: string): Promise<Record<string, NistControlText>> {
  const key = familyKey(family);
  const load = chunks[key];
  if (!load) {
    return Promise.reject(
      new Error(`Unknown SP 800-53 family "${family}" — expected one of ${controlTextFamilies.join(", ")}`),
    );
  }
  let hit = cache.get(key);
  if (!hit) {
    hit = load().then((m) => m.controlText);
    cache.set(key, hit);
  }
  return hit;
}

/** One control's text, fetching only that control's family. Null when unknown. */
export async function loadControlText(id: string): Promise<NistControlText | null> {
  const key = familyKey(id);
  if (!(key in chunks)) return null;
  const family = await loadControlFamily(key);
  return family[id] ?? null;
}

/** Every family, in parallel, merged into one index. */
export async function loadAllControlText(): Promise<Record<string, NistControlText>> {
  const families = await Promise.all(controlTextFamilies.map((f) => loadControlFamily(f)));
  return Object.assign({}, ...families) as Record<string, NistControlText>;
}

/**
 * The same four calls under the reference layer's shared names, so a screen can
 * treat this and the DISA CCI definitions (`cciDefinitionLoader` in
 * ./cci-catalog) as one kind of thing.
 */
export const controlTextLoader: ReferenceFamilyLoader<NistControlText> = {
  families: controlTextFamilies,
  isFamily: isControlTextFamily,
  loadFamily: loadControlFamily,
  loadAll: loadAllControlText,
};
