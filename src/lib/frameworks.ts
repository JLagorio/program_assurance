import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { Database, Json } from "./database.types";
import { idSet, type Filters, type FilterValue, type ReadContext } from "./models";
import { readServerResult, serverRead, type ServerRead, type ServerRow } from "./server-table";

/*
 * The reference frameworks read beside the control catalog. NIST SP 800-160 is the first: the
 * cyber resiliency constructs and the controls that support them (Vol. 2, Table E-1), the ATT&CK
 * techniques with the approaches and controls that counter them (Vol. 2, Appendix F), and the
 * system life cycle processes with their security outcomes (Vol. 1). NIST publishes them in print
 * only, so each is this project's transcription, pinned and imported as reference data
 * (docs/reference-seeding.md).
 *
 * Every read goes through a view that answers for the revision the product reads, so a screen
 * names a framework by its code and never a revision. An item keeps its code from one revision to
 * the next: match items across reads by code, not by id.
 */

/** The cyber resiliency goals, objectives, techniques, approaches and design principles, and the controls that support them (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1). */
export const CYBER_RESILIENCY_FRAMEWORK = "nist-sp800-160v2r1-cref";
/** The ATT&CK tactics, techniques and mitigations, with the approaches and controls that counter each technique (NIST SP 800-160 Vol. 2 Rev. 1, Appendix F). */
export const ATTACK_FRAMEWORK = "nist-sp800-160v2r1-attack";
/** The system life cycle processes and their security outcomes (NIST SP 800-160 Vol. 1 Rev. 1). */
export const LIFE_CYCLE_FRAMEWORK = "nist-sp800-160v1r1-processes";

type Client = Pick<SupabaseClient, "from">;
type Views = Database["public"]["Views"];
/** Filters on a view's own columns, so a filter on a column the view lacks does not compile. */
type ViewFilters<V extends keyof Views> = { [Column in keyof Views[V]["Row"]]?: FilterValue };

/** What the publication prints with an item or a link beside its columns: a tactic, a list of effects. */
export type FrameworkProps = { readonly [key: string]: Json | undefined };

/** A text property, or `undefined` when the publication prints none there. */
export function propText(props: FrameworkProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** A property that lists texts, such as the effects on an adversary; empty when there is none. */
export function propList(props: FrameworkProps, key: string): string[] {
  const value = props[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

/**
 * The item a reference names. A property that points at an item holds its code, or
 * `<framework code>:<item code>` for an item of another framework: an Appendix F link names the
 * approach that counters a technique as `nist-sp800-160v2r1-cref:approach.obfuscation`.
 * `framework` is the framework the reference was read in.
 */
export function itemReference(
  reference: string,
  framework: string,
): { framework: string; code: string } {
  const separator = reference.indexOf(":");
  return separator === -1
    ? { framework, code: reference }
    : { framework: reference.slice(0, separator), code: reference.slice(separator + 1) };
}

/* ——— Reading in parts and in order —————————————————————————————————————————————————————————— */

/** How many values one `in` filter sends, so a request's address stays short, as `readRows` splits a list. */
const IN_CHUNK = 100;
/** How many parts of a split read load at once. */
const PARALLEL_PARTS = 4;
/** The most rows one part returns: more than a pinned framework holds, so a read is whole or refused. */
const PART_LIMIT = 50_000;

const signalOption = (signal: AbortSignal | undefined) => (signal ? { signal } : {});

/** Codes and sort keys compare by code point, as the views' "C" collation orders them. */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/** A place in a publication (`E-1:AC-2(8):1:10`) compares number by number: 2 before 10. */
const comparePlace = new Intl.Collator("en", { numeric: true }).compare;

/**
 * Every row a scoped read matches. An empty list matches nothing and sends no request; a list
 * longer than a request carries is read in parts side by side, every such list split in turn.
 * The caller puts the parts back in order.
 */
async function readParts<T>(
  client: Client,
  context: ReadContext,
  read: (scope: Filters) => ServerRead,
  scope: Filters,
  signal: AbortSignal | undefined,
): Promise<T[]> {
  const lists = Object.entries(scope).filter((entry): entry is [string, readonly string[]] =>
    Array.isArray(entry[1]),
  );
  if (lists.some(([, values]) => values.length === 0)) return [];
  const longest = lists.sort((a, b) => b[1].length - a[1].length)[0];
  if (!longest || longest[1].length <= IN_CHUNK)
    return (await readServerResult(
      client,
      context,
      read(scope),
      {},
      { limit: PART_LIMIT, ...signalOption(signal) },
    )) as T[];
  const [column, values] = longest;
  const parts: (readonly string[])[] = [];
  for (let offset = 0; offset < values.length; offset += IN_CHUNK)
    parts.push(values.slice(offset, offset + IN_CHUNK));
  const rows: T[][] = [];
  for (let index = 0; index < parts.length; index += PARALLEL_PARTS)
    rows.push(
      ...(await Promise.all(
        parts
          .slice(index, index + PARALLEL_PARTS)
          .map((part) => readParts<T>(client, context, read, { ...scope, [column]: part }, signal)),
      )),
    );
  return rows.flat();
}

/* ——— The frameworks ————————————————————————————————————————————————————————————————————————— */

const text = z.string().optional();
/** The publication a revision was transcribed from, as the transcription records it. */
const sourceDocumentSchema = z
  .object({
    title: text,
    authority: text,
    url: text,
    doi: text,
    sha256: text,
    bytes: z.number().optional(),
    pages: z.number().optional(),
    published: text,
    rights_statement: z.string().nullish(),
  })
  .passthrough();
const methodSchema = z.object({ tool: text, tool_version: text, script: text }).passthrough();
/** One place a transcription departs from the printed text. */
const correctionSchema = z.object({
  printed_in: z.string(),
  printed: z.string(),
  transcribed: z.string(),
  reason: z.string(),
});
const frameworkSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  framework_revision_id: z.string(),
  version: z.string(),
  format: z.string(),
  content_sha256: z.string(),
  catalog_revision_id: z.string().nullable(),
  source_document: sourceDocumentSchema,
  method: methodSchema,
  corrections: z.array(correctionSchema),
  recorded_at: z.string(),
  authority: z.string(),
  authoritative: z.boolean(),
  rights: z.string().nullable(),
  notes: z.string().nullable(),
});

/**
 * A framework as the product reads it: its current revision, the document that revision was
 * transcribed from (`source_document`: title, URL, DOI, SHA-256, pages, publication date and the
 * document's own rights statement), how (`method`), every departure from the printed text
 * (`corrections`), the catalog revision its control labels name, and what the reference source
 * records of the copy (`authority`, `authoritative`, `rights`, `notes`).
 */
export type Framework = z.infer<typeof frameworkSchema>;
export type FrameworkCorrection = z.infer<typeof correctionSchema>;

const frameworkRead = serverRead({
  source: "framework_rows",
  model: "frameworks",
  columns: [
    "id",
    "code",
    "title",
    "framework_revision_id",
    "version",
    "format",
    "content_sha256",
    "catalog_revision_id",
    "source_document",
    "method",
    "corrections",
    "recorded_at",
    "authority",
    "authoritative",
    "rights",
    "notes",
  ],
  order: [{ column: "code" }],
});

/** Every framework the reader can read, each at its current revision. A handful of rows. */
export async function readFrameworks(
  client: Client,
  context: ReadContext,
  signal?: AbortSignal | undefined,
): Promise<Framework[]> {
  const rows = await readServerResult(client, context, frameworkRead, {}, signalOption(signal));
  return z.array(frameworkSchema).parse(rows);
}

/* ——— Items —————————————————————————————————————————————————————————————————————————————————— */

const ITEM_COLUMNS = [
  "id",
  "framework_code",
  "framework_revision_id",
  "kind",
  "code",
  "code_order",
  "title",
  "prose",
  "ordinal",
  "props",
  "printed_in",
  "parent_item_id",
  "parent_code",
  "parent_kind",
  "parent_title",
] as const;
type ItemColumn = (typeof ITEM_COLUMNS)[number];

/**
 * One thing a framework names: a goal, an objective, a technique, an approach, an ATT&CK
 * technique, a mitigation, a process, an outcome. `kind` says which; `parent_code` names the item
 * that holds it (an approach's technique, an outcome's process) and `ordinal` its place among the
 * items that parent holds; `printed_in` is where the publication prints it.
 */
export type FrameworkItem = Omit<
  ServerRow<
    "framework_item_rows",
    ItemColumn,
    Exclude<ItemColumn, "prose" | "parent_item_id" | "parent_code" | "parent_kind" | "parent_title">
  >,
  "props"
> & { props: FrameworkProps };

const itemRead = (scope: Filters) =>
  serverRead({
    source: "framework_item_rows",
    model: "framework_items",
    columns: ITEM_COLUMNS,
    scope,
    order: [{ column: "code_order" }],
  });

/**
 * The items of a framework's current revision, in the order of their codes: every kind, or the
 * kinds named. A framework holds a few hundred items, so a screen reads a kind whole.
 */
export async function readFrameworkItems(
  client: Client,
  context: ReadContext,
  framework: string,
  kinds?: readonly string[] | undefined,
  signal?: AbortSignal | undefined,
): Promise<FrameworkItem[]> {
  const filters: ViewFilters<"framework_item_rows"> = { framework_code: framework };
  if (kinds) filters.kind = idSet(kinds);
  const items = await readParts<FrameworkItem>(client, context, itemRead, filters, signal);
  return items.sort((a, b) => compareText(a.code_order, b.code_order));
}

/**
 * Items by the code of the item that holds them, each list in the publication's order (`ordinal`):
 * a technique's approaches, a process's outcomes. Items with no parent are under `null`.
 */
export function itemsByParent(
  items: readonly FrameworkItem[],
): Map<string | null, FrameworkItem[]> {
  const held = new Map<string | null, FrameworkItem[]>();
  for (const item of items) {
    const siblings = held.get(item.parent_code) ?? [];
    siblings.push(item);
    held.set(item.parent_code, siblings);
  }
  for (const siblings of held.values())
    siblings.sort((a, b) => a.ordinal - b.ordinal || compareText(a.code_order, b.code_order));
  return held;
}

/* ——— Guidance: what the publication prints beside an item ——————————————————————————————————— */

/**
 * What the publication says of an item beyond its name. Table D-4 of NIST SP 800-160 Vol. 2 Rev. 1
 * prints it for the cyber resiliency techniques and approaches: a definition and a discussion for
 * each, and for an approach an informal description and a list of examples. The examples are the
 * implementation guidance a control reaches through Table E-1, by the approaches it supports. A
 * part the reference data does not hold for an item is absent: the Discussion Tables 2 and 3 print
 * for a goal and an objective is not transcribed.
 */
export type ItemGuidance = {
  /** The item's definition: its `prose`. */
  definition: string | undefined;
  /** The one line that describes an approach informally (`props.informal_description`). */
  informalDescription: string | undefined;
  /** The discussion printed beside a technique or an approach (`props.discussion`). */
  discussion: string | undefined;
  /** The examples listed for an approach, one a bullet in printed order (`props.examples`); empty when it lists none. */
  examples: string[];
};

/** A stored `props` value as properties: the object it is, and none for any other value. */
export function frameworkProps(value: unknown): FrameworkProps {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as FrameworkProps)
    : {};
}

/**
 * The guidance an item carries, read from its `prose` and its `props`: an item as a read of this
 * module returns it, or those two columns of a `framework_items` row (`frameworkProps` for a
 * stored value). An item the reference data holds no guidance for answers with its definition
 * alone, where it has prose.
 */
export function itemGuidance(item: {
  readonly prose: string | null;
  readonly props: FrameworkProps;
}): ItemGuidance {
  return {
    definition: item.prose !== null && item.prose !== "" ? item.prose : undefined,
    informalDescription: propText(item.props, "informal_description"),
    discussion: propText(item.props, "discussion"),
    examples: propList(item.props, "examples").filter((example) => example !== ""),
  };
}

/* ——— Item links ————————————————————————————————————————————————————————————————————————————— */

const ITEM_LINK_COLUMNS = [
  "id",
  "framework_code",
  "framework_revision_id",
  "relation",
  "ordinal",
  "props",
  "source_identifier",
  "printed_in",
  "source_item_id",
  "source_code",
  "source_kind",
  "source_title",
  "source_framework_code",
  "target_item_id",
  "target_code",
  "target_kind",
  "target_title",
  "target_framework_code",
] as const;
type ItemLinkColumn = (typeof ITEM_LINK_COLUMNS)[number];

/**
 * A relation the publication prints between two items: a technique supports an objective, an
 * ATT&CK technique belongs to a tactic or is affected by an approach. The target may be an item of
 * another framework (`target_framework_code`).
 */
export type FrameworkItemLink = Omit<
  ServerRow<"framework_item_link_rows", ItemLinkColumn, Exclude<ItemLinkColumn, "ordinal">>,
  "props"
> & { props: FrameworkProps };

/** What narrows a read of item links. A list left out does not narrow; an empty list reads nothing. */
export type ItemLinkScope = {
  /** One relation, such as `supports`. */
  relation?: string | undefined;
  /** The items the links start from, by code. */
  sourceCodes?: readonly string[] | undefined;
  /** The items the links lead to, by code. */
  targetCodes?: readonly string[] | undefined;
};

const itemLinkRead = (scope: Filters) =>
  serverRead({
    source: "framework_item_link_rows",
    model: "framework_item_links",
    columns: ITEM_LINK_COLUMNS,
    scope,
    order: [{ column: "source_identifier" }],
  });

/** The item links of a framework's current revision, in the order of their place in the publication. */
export async function readFrameworkItemLinks(
  client: Client,
  context: ReadContext,
  framework: string,
  scope: ItemLinkScope = {},
  signal?: AbortSignal | undefined,
): Promise<FrameworkItemLink[]> {
  const filters: ViewFilters<"framework_item_link_rows"> = { framework_code: framework };
  if (scope.relation) filters.relation = scope.relation;
  if (scope.sourceCodes) filters.source_code = idSet(scope.sourceCodes);
  if (scope.targetCodes) filters.target_code = idSet(scope.targetCodes);
  const links = await readParts<FrameworkItemLink>(client, context, itemLinkRead, filters, signal);
  return links.sort((a, b) => comparePlace(a.source_identifier, b.source_identifier));
}

/* ——— Control links —————————————————————————————————————————————————————————————————————————— */

const CONTROL_LINK_COLUMNS = [
  "id",
  "framework_code",
  "framework_revision_id",
  "relation",
  "ordinal",
  "props",
  "source_identifier",
  "printed_in",
  "item_id",
  "item_code",
  "item_kind",
  "item_title",
  "parent_item_id",
  "parent_item_code",
  "parent_item_kind",
  "parent_item_title",
  "control_label",
  "control_order",
  "resolution_status",
  "control_id",
  "control_code",
  "control_title",
  "catalog_revision_id",
  "technique_item_id",
  "technique_code",
  "technique_title",
] as const;
type ControlLinkColumn = (typeof CONTROL_LINK_COLUMNS)[number];

/**
 * A relation the publication prints between a control and an item: a control supports an approach
 * (Table E-1), a control mitigates an ATT&CK technique (Appendix F). `control_label` is the control
 * as printed and `control_id` its row in `catalog_revision_id`. `ordinal` is the link's place where
 * the publication orders it: in Table E-1 the place of its technique group in the control's row (1
 * is the technique the control supports most strongly), in Appendix F the place of its row under
 * its technique and mitigation.
 *
 * `technique_code` and `technique_title` are the technique a Table E-1 link is printed under. Read
 * a link's technique from them, never from the item's parent (`parent_item_code`): the table lists
 * Self-Challenge, a Coordinated Protection approach, in a Deception group for SR-7. They are empty
 * for a link that names no technique, as in Appendix F.
 *
 * An Appendix F link keeps its row in `props`: `tactic` and `mitigation` are item codes of the same
 * framework, `approaches` the row's approaches in printed order as references to the cyber
 * resiliency framework (`itemReference`), `approach` the one reference when there is exactly one,
 * and `effects` the titles of effect items. A row that prints words where an approach belongs
 * keeps them as `approach_as_printed`; a printed label the catalog does not hold is kept as
 * `controls_not_in_catalog` and makes no link.
 */
export type FrameworkControlLink = Omit<
  ServerRow<
    "framework_control_link_rows",
    ControlLinkColumn,
    Exclude<
      ControlLinkColumn,
      | "ordinal"
      | "parent_item_id"
      | "parent_item_code"
      | "parent_item_kind"
      | "parent_item_title"
      | "control_id"
      | "control_code"
      | "control_title"
      | "catalog_revision_id"
      | "technique_item_id"
      | "technique_code"
      | "technique_title"
    >
  >,
  "props"
> & { props: FrameworkProps };

/**
 * What narrows a read of control links. A list left out does not narrow; an empty list reads
 * nothing. Name controls, items or a catalog revision for a framework with thousands of links.
 */
export type ControlLinkScope = {
  /** The catalog revision whose controls the links name: a program's, or the catalog's edition. */
  catalogRevisionId?: string | undefined;
  /** The controls, by id: what each supports or mitigates. */
  controlIds?: readonly (string | null | undefined)[] | undefined;
  /** The linked items, by code: the controls that mitigate an ATT&CK technique. */
  itemCodes?: readonly string[] | undefined;
  /** The techniques the links are printed under, by code: the controls behind a technique in Table E-1. */
  techniqueCodes?: readonly string[] | undefined;
  /** The linked items, by id, as a read of this module returned them. */
  itemIds?: readonly (string | null | undefined)[] | undefined;
  /** One relation, such as `supports` or `mitigates`. */
  relation?: string | undefined;
};

/** A read of control links that asks for the columns named: every one, or those a regrouping reads. */
const controlLinkRead = (columns: readonly ControlLinkColumn[]) => (scope: Filters) =>
  serverRead({
    source: "framework_control_link_rows",
    model: "framework_control_links",
    columns,
    scope,
    order: [{ column: "control_order" }, { column: "ordinal" }, { column: "source_identifier" }],
  });
const wholeLinkRead = controlLinkRead(CONTROL_LINK_COLUMNS);

/** The scope as filters on the view, each list in one spelling so equal reads share a key. */
function controlLinkFilters(framework: string, scope: ControlLinkScope): Filters {
  const filters: ViewFilters<"framework_control_link_rows"> = { framework_code: framework };
  if (scope.catalogRevisionId) filters.catalog_revision_id = scope.catalogRevisionId;
  if (scope.controlIds) filters.control_id = idSet(scope.controlIds);
  if (scope.itemCodes) filters.item_code = idSet(scope.itemCodes);
  if (scope.techniqueCodes) filters.technique_code = idSet(scope.techniqueCodes);
  if (scope.itemIds) filters.item_id = idSet(scope.itemIds);
  if (scope.relation) filters.relation = scope.relation;
  return filters;
}

/** What tells a control link's place: every read of control links asks for these. */
type LinkPlace = Pick<FrameworkControlLink, "control_order" | "ordinal" | "source_identifier">;

/** In the catalog's order of controls, then each control's links in the publication's order. */
function compareControlLinks(a: LinkPlace, b: LinkPlace): number {
  return (
    compareText(a.control_order, b.control_order) ||
    (a.ordinal ?? Infinity) - (b.ordinal ?? Infinity) ||
    comparePlace(a.source_identifier, b.source_identifier)
  );
}

async function readControlLinks<Link extends LinkPlace = FrameworkControlLink>(
  client: Client,
  context: ReadContext,
  filters: Filters,
  signal: AbortSignal | undefined,
  read: (scope: Filters) => ServerRead = wholeLinkRead,
): Promise<Link[]> {
  const links = await readParts<Link>(client, context, read, filters, signal);
  return links.sort(compareControlLinks);
}

/**
 * The control links of a framework, for the catalog revision, controls or items the scope names,
 * in the catalog's order of controls and then the publication's. The view answers with the
 * framework revision that was read against each catalog revision, so a control of an earlier
 * edition keeps its links. A long list of ids is read in parts.
 */
export async function readFrameworkControlLinks(
  client: Client,
  context: ReadContext,
  framework: string,
  scope: ControlLinkScope = {},
  signal?: AbortSignal | undefined,
): Promise<FrameworkControlLink[]> {
  return readControlLinks(client, context, controlLinkFilters(framework, scope), signal);
}

/* ——— Cyber resiliency: what a control supports (Table E-1) —————————————————————————————————— */

/** A technique or an approach as a control link names it. */
export type ResiliencyConstruct = { code: string; title: string };
/** One technique a control supports, with the approaches Table E-1 prints with it. */
export type SupportedTechnique = {
  technique: ResiliencyConstruct;
  approaches: ResiliencyConstruct[];
  /** The technique's place among those the control supports: 1 is the strongest. Empty when the table gives none. */
  ordinal: number | null;
};
/**
 * A control that supports a technique, through the approaches named. It is the control's id: a
 * screen names the control from the catalog rows it already holds.
 */
export type SupportingControl = {
  id: string;
  approaches: ResiliencyConstruct[];
  /** The technique's place among those this control supports: 1 is the strongest. */
  ordinal: number | null;
};
/** A technique with every control that supports it. */
export type TechniqueSupport = { technique: ResiliencyConstruct; controls: SupportingControl[] };

/**
 * The columns the regrouping below reads of a control link: its place, its control, the technique
 * it is printed under and its item. Table E-1 read whole asks for these alone, so the rest of a
 * link's 26 columns stay on the server.
 */
const SUPPORT_LINK_COLUMNS = [
  "control_order",
  "ordinal",
  "source_identifier",
  "control_id",
  "technique_code",
  "technique_title",
  "item_kind",
  "item_code",
  "item_title",
] as const satisfies readonly ControlLinkColumn[];
/** A control link as `resiliencyByControl` and `resiliencyByTechnique` read it: a whole link is one. */
export type ResiliencyControlLink = Pick<
  FrameworkControlLink,
  (typeof SUPPORT_LINK_COLUMNS)[number]
>;
const supportLinkRead = controlLinkRead(SUPPORT_LINK_COLUMNS);

/**
 * Table E-1 for one catalog revision, whole and in one request: every link from a control to what
 * it supports, in the catalog's order of controls and then the table's, with the columns the
 * regrouping reads and no other.
 */
export async function readResiliencyControlLinks(
  client: Client,
  context: ReadContext,
  catalogRevisionId: string,
  signal?: AbortSignal | undefined,
): Promise<ResiliencyControlLink[]> {
  return readControlLinks<ResiliencyControlLink>(
    client,
    context,
    controlLinkFilters(CYBER_RESILIENCY_FRAMEWORK, { catalogRevisionId }),
    signal,
    supportLinkRead,
  );
}

/**
 * Each resolved link with the technique it is printed under, in the catalog's order of controls and
 * the table's order. The technique is the group the table prints the link in (`technique_code`),
 * never the linked approach's parent. A link printed under no technique is its own group when its
 * item is a technique, and is otherwise left out: it supports no technique the table names.
 */
function supportLinks(links: readonly ResiliencyControlLink[]) {
  return [...links].sort(compareControlLinks).flatMap((link) => {
    // A label the catalog revision does not hold names no control.
    if (!link.control_id) return [];
    const technique =
      link.technique_code && link.technique_title
        ? { code: link.technique_code, title: link.technique_title }
        : link.item_kind === "technique"
          ? { code: link.item_code, title: link.item_title }
          : undefined;
    if (!technique) return [];
    const control = { id: link.control_id };
    // A link to the technique itself names no approach.
    const approach =
      link.item_code === technique.code
        ? undefined
        : { code: link.item_code, title: link.item_title };
    return [{ control, technique, approach, ordinal: link.ordinal }];
  });
}

/**
 * The techniques each control supports, by control id, strongest first, each with the approaches
 * the table prints with it in the table's order. Give it the cyber resiliency framework's links
 * for one catalog revision, or for some of its controls.
 */
export function resiliencyByControl(
  links: readonly ResiliencyControlLink[],
): Map<string, SupportedTechnique[]> {
  const byControl = new Map<string, SupportedTechnique[]>();
  for (const { control, technique, approach, ordinal } of supportLinks(links)) {
    const supported = byControl.get(control.id) ?? [];
    byControl.set(control.id, supported);
    let group = supported.find(
      (entry) => entry.technique.code === technique.code && entry.ordinal === ordinal,
    );
    if (!group) {
      group = { technique, approaches: [], ordinal };
      supported.push(group);
    }
    if (approach && !group.approaches.some((entry) => entry.code === approach.code))
      group.approaches.push(approach);
  }
  return byControl;
}

/**
 * The controls behind each technique, by technique code, in the catalog's order: each control
 * once, with the approaches it supports and the technique's place among the control's own.
 */
export function resiliencyByTechnique(
  links: readonly ResiliencyControlLink[],
): Map<string, TechniqueSupport> {
  const byTechnique = new Map<string, TechniqueSupport>();
  for (const { control, technique, approach, ordinal } of supportLinks(links)) {
    const support = byTechnique.get(technique.code) ?? { technique, controls: [] };
    byTechnique.set(technique.code, support);
    let entry = support.controls.find((candidate) => candidate.id === control.id);
    if (!entry) {
      entry = { ...control, approaches: [], ordinal };
      support.controls.push(entry);
    }
    if (approach && !entry.approaches.some((candidate) => candidate.code === approach.code))
      entry.approaches.push(approach);
  }
  return byTechnique;
}

/* ——— Hooks —————————————————————————————————————————————————————————————————————————————————— */

export type FrameworkReadOptions = {
  /** Wait for what the read is scoped to. */
  enabled?: boolean | undefined;
};

/** One read of this module as a query: kept under its model, so a write to the model reads it again. */
function useFrameworkRead<T, Selected = T>(
  model: string,
  key: readonly unknown[],
  enabled: boolean,
  read: (client: Client, context: ReadContext, signal: AbortSignal) => Promise<T>,
  select?: ((rows: T) => Selected) | undefined,
): UseQueryResult<Selected, Error> {
  const workspace = useWorkspace();
  return useQuery<T, Error, Selected>({
    queryKey: ["models", workspace.tenantId, model, "framework", ...key],
    enabled,
    retry: false,
    queryFn: async ({ signal }) =>
      read(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        signal,
      ),
    ...(select ? { select } : {}),
  });
}

/** Every framework, each at its current revision with its source and corrections. */
export function useFrameworks(
  options: FrameworkReadOptions = {},
): UseQueryResult<Framework[], Error> {
  return useFrameworkRead("frameworks", [], options.enabled ?? true, readFrameworks);
}

/**
 * One framework by its code, from the same read as `useFrameworks`: `null` when the read has
 * answered without it, because its reference data is not loaded.
 */
export function useFramework(
  framework: string,
  options: FrameworkReadOptions = {},
): UseQueryResult<Framework | null, Error> {
  const select = useMemo(
    () => (rows: Framework[]) => rows.find((row) => row.code === framework) ?? null,
    [framework],
  );
  return useFrameworkRead("frameworks", [], options.enabled ?? true, readFrameworks, select);
}

/**
 * The items of a framework's current revision: every kind, or the kinds named
 * (`useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, { kinds: ["technique", "approach"] })`).
 */
export function useFrameworkItems(
  framework: string,
  options: FrameworkReadOptions & { kinds?: readonly string[] | undefined } = {},
): UseQueryResult<FrameworkItem[], Error> {
  const kinds = useMemo(() => (options.kinds ? idSet(options.kinds) : undefined), [options.kinds]);
  return useFrameworkRead(
    "framework_items",
    [framework, kinds ?? null],
    options.enabled ?? true,
    (client, context, signal) => readFrameworkItems(client, context, framework, kinds, signal),
  );
}

/** The item links of a framework's current revision, narrowed by relation or by the items' codes. */
export function useFrameworkItemLinks(
  framework: string,
  scope: ItemLinkScope = {},
  options: FrameworkReadOptions = {},
): UseQueryResult<FrameworkItemLink[], Error> {
  const { relation, sourceCodes, targetCodes } = scope;
  const narrowed = useMemo(
    (): ItemLinkScope => ({
      ...(relation ? { relation } : {}),
      ...(sourceCodes ? { sourceCodes: idSet(sourceCodes) } : {}),
      ...(targetCodes ? { targetCodes: idSet(targetCodes) } : {}),
    }),
    [relation, sourceCodes, targetCodes],
  );
  return useFrameworkRead(
    "framework_item_links",
    [framework, narrowed],
    options.enabled ?? true,
    (client, context, signal) =>
      readFrameworkItemLinks(client, context, framework, narrowed, signal),
  );
}

/**
 * The control links of a framework for the scope named: a catalog revision, controls or items.
 * An `undefined` scope keeps the read waiting (the controls are still being worked out); an empty
 * list reads nothing. Never the whole of a framework with thousands of links.
 */
export function useFrameworkControlLinks(
  framework: string,
  scope: ControlLinkScope | undefined,
  options: FrameworkReadOptions = {},
): UseQueryResult<FrameworkControlLink[], Error> {
  const waiting = scope === undefined;
  const { catalogRevisionId, controlIds, itemCodes, techniqueCodes, itemIds, relation } =
    scope ?? {};
  const filters = useMemo(
    () =>
      waiting
        ? undefined
        : controlLinkFilters(framework, {
            catalogRevisionId,
            controlIds,
            itemCodes,
            techniqueCodes,
            itemIds,
            relation,
          }),
    [
      waiting,
      framework,
      catalogRevisionId,
      controlIds,
      itemCodes,
      techniqueCodes,
      itemIds,
      relation,
    ],
  );
  return useFrameworkRead(
    "framework_control_links",
    [filters ?? null],
    filters !== undefined && (options.enabled ?? true),
    (client, context, signal) => readControlLinks(client, context, filters ?? {}, signal),
  );
}

/**
 * Table E-1 for one catalog revision: every control that supports a cyber resiliency technique,
 * with the approaches (about 420 links, read once). Group them with `resiliencyByControl` and
 * `resiliencyByTechnique`, whose columns are the ones it asks for. An empty revision keeps the
 * read waiting.
 */
export function useResiliencyControlLinks(
  catalogRevisionId: string | null | undefined,
  options: FrameworkReadOptions = {},
): UseQueryResult<ResiliencyControlLink[], Error> {
  return useFrameworkRead(
    "framework_control_links",
    // Its own entry: these rows hold fewer columns than whole links read for the same scope.
    ["supports", catalogRevisionId ?? null],
    !!catalogRevisionId && (options.enabled ?? true),
    (client, context, signal) =>
      readResiliencyControlLinks(client, context, catalogRevisionId ?? "", signal),
  );
}
