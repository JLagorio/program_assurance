import {
  itemGuidance,
  type FrameworkItem,
  type ItemGuidance,
  type ResiliencyConstruct,
  type SupportedTechnique,
  type TechniqueSupport,
} from "./frameworks";

/*
 * A control baseline read by cyber resiliency technique: the controls behind one technique of
 * NIST SP 800-160 Vol. 2 (Table E-1), how many of them a baseline selects, and the name a
 * technique takes in an address; and what the publication says of the techniques and approaches a
 * control supports (Table D-4). The reads are in frameworks.ts; this module only regroups them.
 */

const PREFIX = "technique.";

/** A technique's name in an address: its code after `technique.`, as in `segmentation`. */
export function techniqueSlug(code: string): string {
  return code.startsWith(PREFIX) ? code.slice(PREFIX.length) : code;
}

/** The technique an address names, by its slug: nothing for a value that could not be one. */
export function techniqueParam(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : undefined;
}

/**
 * The techniques a control supports, one entry a technique, strongest first. Table E-1 may print
 * a technique twice in a control's row: the entries are joined at the first one's place, with the
 * approaches of both.
 */
export function supportedOnce(supported: readonly SupportedTechnique[]): SupportedTechnique[] {
  const once = new Map<string, SupportedTechnique>();
  for (const entry of supported) {
    const first = once.get(entry.technique.code);
    if (!first) {
      once.set(entry.technique.code, { ...entry, approaches: [...entry.approaches] });
      continue;
    }
    for (const approach of entry.approaches)
      if (!first.approaches.some((held) => held.code === approach.code))
        first.approaches.push(approach);
  }
  return [...once.values()];
}

/** A technique with the controls that support it, each with the approaches it supports it through. */
export type TechniqueControls = {
  /** The technique's code in the framework: `technique.segmentation`. */
  code: string;
  /** Its name in an address: `segmentation`. */
  slug: string;
  title: string;
  controls: ReadonlyMap<string, readonly ResiliencyConstruct[]>;
};

/**
 * Each technique, in the order given, with the controls behind it. `counted` says which controls
 * a screen counts, such as a catalog's active controls: a control it leaves out supports nothing.
 */
export function techniqueControls(
  techniques: readonly Pick<FrameworkItem, "code" | "title">[],
  support: ReadonlyMap<string, TechniqueSupport>,
  counted: (controlId: string) => boolean,
): TechniqueControls[] {
  return techniques.map((technique) => ({
    code: technique.code,
    slug: techniqueSlug(technique.code),
    title: technique.title,
    controls: new Map(
      (support.get(technique.code)?.controls ?? [])
        .filter((control) => counted(control.id))
        .map((control) => [control.id, control.approaches]),
    ),
  }));
}

/** How many of a technique's controls a baseline selects: the 16 of "16 of 41". */
export function selectedOf(
  technique: Pick<TechniqueControls, "controls">,
  selected: Pick<ReadonlySet<string>, "has">,
): number {
  let count = 0;
  for (const controlId of technique.controls.keys()) if (selected.has(controlId)) count += 1;
  return count;
}

/**
 * The techniques a program chose for SA-24 apart from the others, each list in the order given.
 * `chosen` holds technique codes; a code that names none of the techniques is passed over.
 */
export function splitByChoice<T extends { code: string }>(
  techniques: readonly T[],
  chosen: readonly string[],
): { chosen: T[]; others: T[] } {
  const named = new Set(chosen);
  return {
    chosen: techniques.filter((technique) => named.has(technique.code)),
    others: techniques.filter((technique) => !named.has(technique.code)),
  };
}

/* ——— Guidance: what Table D-4 says of a technique or an approach ———————————————————————————— */

/**
 * The kinds of item the guidance is read from, in one spelling: every screen that names an
 * approach or reads its guidance asks for these, so the framework's techniques and approaches are
 * read once.
 */
export const RESILIENCY_GUIDANCE_KINDS = ["approach", "technique"] as const;

/** An item the reference data does not hold: nothing is said of it. */
const NO_GUIDANCE: ItemGuidance = {
  definition: undefined,
  informalDescription: undefined,
  discussion: undefined,
  examples: [],
};

/** Whether there is anything to read of a technique or an approach. */
const hasGuidance = (guidance: ItemGuidance) =>
  !!(
    guidance.definition ||
    guidance.informalDescription ||
    guidance.discussion ||
    guidance.examples.length
  );

/** A technique or an approach with what the publication says of it. */
export type GuidedConstruct = ResiliencyConstruct & ItemGuidance;

/** One technique a control supports, with the guidance for it and for each of its approaches. */
export type TechniqueGuidance = {
  technique: GuidedConstruct;
  /** The approaches Table E-1 prints with it, in the table's order. */
  approaches: GuidedConstruct[];
  /** How many examples its approaches come with, together. */
  examples: number;
  /** There is something to read of the technique or of one of its approaches. */
  guided: boolean;
};

/**
 * The techniques a control supports, in the order given (strongest first), each with what Table
 * D-4 says of it and of its approaches. `items` are the framework's techniques and approaches,
 * matched by code: one the list lacks keeps its name and has no guidance.
 */
export function supportedGuidance(
  supported: readonly SupportedTechnique[],
  items: readonly Pick<FrameworkItem, "code" | "prose" | "props">[],
): TechniqueGuidance[] {
  const byCode = new Map(items.map((item) => [item.code, item]));
  const guide = (construct: ResiliencyConstruct): GuidedConstruct => {
    const item = byCode.get(construct.code);
    return { ...construct, ...(item ? itemGuidance(item) : NO_GUIDANCE) };
  };
  return supported.map((entry) => {
    const technique = guide(entry.technique);
    const approaches = entry.approaches.map(guide);
    return {
      technique,
      approaches,
      examples: approaches.reduce((count, approach) => count + approach.examples.length, 0),
      guided: hasGuidance(technique) || approaches.some(hasGuidance),
    };
  });
}
