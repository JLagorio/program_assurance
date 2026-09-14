/**
 * The one place that knows what a control id looks like.
 *
 * Three conventions collide in this codebase and they must never be confused:
 *
 *   human / DISA   "AC-2", "AC-2(1)", "SC-7(21)"      <- what the app stores and displays
 *   OSCAL id       "ac-2", "ac-2.1", "sc-7.21"        <- lowercase, dotted
 *   OSCAL label    "AC-02", "AC-02(01)", "SC-07(21)"  <- zero padded, `class: "zero-padded"`
 *
 * The app's key is the human form, with NO zero padding. Everything that reads a
 * reference corpus — the 800-53 catalog generator, the DISA CCI generator, the
 * CNSSI 1253 generator and the WS-X90 seed generator — funnels through this
 * module so all four agree by construction rather than by four copies of one
 * regex. The generators import it directly (Node strips the types), so there is
 * a single implementation, not a build-time mirror.
 */

export type ControlIdParts = {
  /** Two-letter family, upper case: "AC", "SC". */
  family: string;
  /** Base control number. */
  number: number;
  /** Enhancement number, or null for a base control. */
  enhancement: number | null;
};

const HUMAN = /^([A-Za-z]{2})-0*(\d+)(?:\s*\(0*(\d+)\))?$/;
const OSCAL = /^([A-Za-z]{2})-0*(\d+)(?:\.0*(\d+))?$/;

function join(family: string, number: number, enhancement: number | null): string {
  return `${family.toUpperCase()}-${number}${enhancement === null ? "" : `(${enhancement})`}`;
}

/**
 * Parse any of the three conventions into its parts, or null when the value is
 * not a control id at all. Tolerates zero padding and a space before "(".
 */
export function parseControlId(value: string): ControlIdParts | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const m = HUMAN.exec(raw) ?? OSCAL.exec(raw);
  if (!m) return null;
  const [, family = "", number = "", enhancement] = m;
  return {
    family: family.toUpperCase(),
    number: Number(number),
    enhancement: enhancement === undefined ? null : Number(enhancement),
  };
}

/**
 * Any convention -> the app's key. "AC-02(01)", "ac-2.1" and "AC-2 (1)" all
 * become "AC-2(1)". Returns null rather than guessing when it does not parse.
 */
export function normalizeControlId(value: string): string | null {
  const p = parseControlId(value);
  return p ? join(p.family, p.number, p.enhancement) : null;
}

/** OSCAL id -> the app's key: "ac-2.1" -> "AC-2(1)". */
export function controlIdFromOscalId(oscalId: string): string | null {
  const m = OSCAL.exec(typeof oscalId === "string" ? oscalId.trim() : "");
  if (!m) return null;
  const [, family = "", number = "", enhancement] = m;
  return join(family, Number(number), enhancement === undefined ? null : Number(enhancement));
}

/** The app's key -> OSCAL id: "AC-2(1)" -> "ac-2.1". */
export function oscalIdFromControlId(id: string): string | null {
  const p = parseControlId(id);
  if (!p) return null;
  return `${p.family.toLowerCase()}-${p.number}${p.enhancement === null ? "" : `.${p.enhancement}`}`;
}

/** The app's key -> the zero-padded OSCAL label: "AC-2(1)" -> "AC-02(01)". */
export function paddedControlId(id: string): string | null {
  const p = parseControlId(id);
  if (!p) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.family}-${pad(p.number)}${p.enhancement === null ? "" : `(${pad(p.enhancement)})`}`;
}

/** "AC-2(1)" -> "AC". Null when the value is not a control id. */
export function controlFamily(id: string): string | null {
  return parseControlId(id)?.family ?? null;
}

/** "AC-2(1)" -> "AC-2". A base control is returned unchanged. */
export function baseControlId(id: string): string | null {
  const p = parseControlId(id);
  return p ? join(p.family, p.number, null) : null;
}

/** True for "AC-2(1)", false for "AC-2" and for anything unparseable. */
export function isControlEnhancement(id: string): boolean {
  const p = parseControlId(id);
  return p !== null && p.enhancement !== null;
}

/**
 * Catalog order: family, then base number, then enhancement, with base controls
 * ahead of their own enhancements. Unparseable values sort last, lexically.
 */
export function compareControlIds(a: string, b: string): number {
  const pa = parseControlId(a);
  const pb = parseControlId(b);
  if (!pa || !pb) {
    if (pa) return -1;
    if (pb) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (pa.family !== pb.family) return pa.family < pb.family ? -1 : 1;
  if (pa.number !== pb.number) return pa.number - pb.number;
  const ea = pa.enhancement ?? -1;
  const eb = pb.enhancement ?? -1;
  return ea - eb;
}
