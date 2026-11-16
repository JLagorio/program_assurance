import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import {
  idSet,
  invalidateModel,
  readRows,
  type Filters,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";
import { ownerField } from "./owner-assign";
import { readServerPage, serverRead, useStaleOnWrite, type ServerRow } from "./server-table";
import { componentOfferStates } from "./status";

/*
 * Offers: what a program holds on a shared component flows up to the component's owner, is
 * reviewed once, and then stands for everything built from that component version.
 *
 * A program offers operational issues (kind `finding`) or assessment findings of its published
 * results, each offering its determination on the control it judges (kind `determinations`), from
 * a system component built from a library component, on an element it did not declare modified.
 * The offer waits (`offered`) on the component's effective owner until that side accepts or
 * returns it, or the offering side withdraws it. Accepted, a finding stands on the component
 * version: every other program built from it gets an operational issue of its own, linked beside
 * the offering program's as the source (`component_offer_issues`); accepted determinations are
 * published as one component assessment of the version. Clients read the offers and write none of
 * them: `offer_to_component`, `withdraw_component_offer` and `review_component_offer` do, each one
 * answer a request. `component_offer_rows` is the offers' register, one row an offer.
 */

type Client = Pick<SupabaseClient, "rpc">;
type TableClient = Pick<SupabaseClient, "from">;
type Functions = Database["public"]["Functions"];

/** What an offer holds: operational issues, or the determinations of assessment findings. */
export const COMPONENT_OFFER_KINDS = ["finding", "determinations"] as const;
export type ComponentOfferKind = (typeof COMPONENT_OFFER_KINDS)[number];

/** Where an offer stands: a key of `componentOfferStates`. */
export type ComponentOfferState = keyof typeof componentOfferStates;

/** What the owner's side decides of an offer that waits. */
export const COMPONENT_OFFER_DECISIONS = ["accepted", "returned"] as const;
export type ComponentOfferDecision = (typeof COMPONENT_OFFER_DECISIONS)[number];

/** How many items one offer holds at most. */
export const OFFER_ITEM_LIMIT = 200;

const kindSchema = z.enum(COMPONENT_OFFER_KINDS);
const stateSchema = z.enum(
  Object.keys(componentOfferStates) as [ComponentOfferState, ...ComponentOfferState[]],
);

/* ——— The offers register ————————————————————————————————————————————————————————————————————— */

/**
 * What the register and an offer's preview read of an offer: what it holds and where it stands,
 * the component version it was found on, the program, system and system component that offered
 * it, who offered it, who it waits on, who reviewed it and what came of it, and the revision a
 * withdrawal or a review is sent at.
 */
export const COMPONENT_OFFER_COLUMNS = [
  "id",
  "tenant_id",
  "kind",
  "title",
  "note",
  "state",
  "items",
  "defined_component_id",
  "component_name",
  "component_type",
  "component_definition_id",
  "definition_code",
  "definition_name",
  "component_definition_revision_id",
  "version",
  "program_id",
  "program_code",
  "program_name",
  "system_id",
  "system_code",
  "system_name",
  "system_component_id",
  "system_component_code",
  "system_component_name",
  "offered_by_party_id",
  "offered_by_name",
  "offered_at",
  "owner_party_id",
  "owner_name",
  "waiting_on_party_id",
  "waiting_on_name",
  "reviewed_by_party_id",
  "reviewed_by_name",
  "reviewed_at",
  "review_note",
  "withdrawn_by_party_id",
  "withdrawn_at",
  "component_assessment_id",
  "issues_opened",
  "revision",
] as const;

/** An offer as the register reads it, a page at a time. */
export type ComponentOfferRow = Omit<
  ServerRow<
    "component_offer_rows",
    (typeof COMPONENT_OFFER_COLUMNS)[number],
    | "tenant_id"
    | "kind"
    | "title"
    | "state"
    | "items"
    | "defined_component_id"
    | "component_name"
    | "component_type"
    | "component_definition_id"
    | "definition_code"
    | "definition_name"
    | "component_definition_revision_id"
    | "version"
    | "program_id"
    | "program_code"
    | "program_name"
    | "system_id"
    | "system_code"
    | "system_name"
    | "system_component_id"
    | "system_component_code"
    | "system_component_name"
    | "offered_at"
    | "issues_opened"
    | "revision"
  >,
  "kind" | "state"
> & { kind: ComponentOfferKind; state: ComponentOfferState };

/** What a read of the offers is kept to; every offer of the workspace unsaid. */
export type ComponentOfferScope = {
  /**
   * One component across the versions of its set: the set and the name the component has in it,
   * since a component is followed by its name.
   */
  component?: { componentDefinitionId: string; componentName: string } | undefined;
  /** One component version alone. */
  definedComponentId?: string | undefined;
  /** The offers one program made. */
  programId?: string | undefined;
  /** The offers made from one system component. */
  systemComponentId?: string | undefined;
};

function offerScope(scope: ComponentOfferScope): Filters {
  return {
    ...(scope.component
      ? {
          component_definition_id: scope.component.componentDefinitionId,
          component_name: scope.component.componentName,
        }
      : {}),
    ...(scope.definedComponentId ? { defined_component_id: scope.definedComponentId } : {}),
    ...(scope.programId ? { program_id: scope.programId } : {}),
    ...(scope.systemComponentId ? { system_component_id: scope.systemComponentId } : {}),
  };
}

function offerRead(scope: Filters) {
  return serverRead({
    source: "component_offer_rows",
    model: "component_offers",
    // The view counts each offer's items and the issues it opened, and names its component, its
    // program, its system and its people: a write to one reads the pages again.
    models: [
      "component_offer_items",
      "component_offer_issues",
      "component_owners",
      "component_definitions",
      "component_definition_revisions",
      "defined_components",
      "system_components",
      "systems",
      "programs",
      "parties",
    ],
    columns: COMPONENT_OFFER_COLUMNS,
    scope: Object.keys(scope).length ? scope : undefined,
    search: [
      "title",
      "component_name",
      "definition_name",
      "program_code",
      "program_name",
      "system_component_code",
      "offered_by_name",
      "owner_name",
    ],
    fields: {
      // Kind and State sort in the product's order, and the search finds a state by its word.
      kind: { sort: "kind_rank" },
      state: { labels: componentOfferStates, sort: "state_rank" },
      // The component, the program and the people sort, are filtered and are found by name. The
      // owner is the component's effective one, and who an offer waits on while it is offered.
      component: { column: "component_name" },
      program: { column: "program_name" },
      owner_party_id: ownerField,
      offered_by: { column: "offered_by_name" },
      waiting_on: { column: "waiting_on_name" },
      reviewed_by: { column: "reviewed_by_name" },
      items: { filter: "range" },
      offered_at: { filter: "range" },
      reviewed_at: { filter: "range" },
    },
    // What waits first, then the newest.
    order: [{ column: "state_rank" }, { column: "offered_at", ascending: false }],
  });
}

/**
 * The offers' read, `component_offer_rows`, a page at a time: every offer of the workspace, or
 * those of one component across its versions, of one component version, of one program or of one
 * system component. The offers that wait come first, then the newest. The search reads an offer's
 * title, its component and set, its program, its system component and its people, and finds a
 * state by the word its badge shows.
 */
export function componentOfferRead(scope: ComponentOfferScope = {}) {
  return offerRead(offerScope(scope));
}

/* ——— One offer, with what it holds ——————————————————————————————————————————————————————————— */

const ITEM_COLUMNS = [
  "id",
  "issue_id",
  "assessment_finding_id",
  "control_id",
] as const satisfies readonly (keyof Row<"component_offer_items">)[];
const LINK_COLUMNS = [
  "id",
  "component_offer_item_id",
  "program_id",
  "issue_id",
  "system_component_id",
  "source",
] as const satisfies readonly (keyof Row<"component_offer_issues">)[];
const ISSUE_COLUMNS = [
  "id",
  "program_id",
  "title",
  "severity",
  "status",
  "opened_at",
  "owner_party_id",
] as const satisfies readonly (keyof Row<"operational_issues">)[];
const FINDING_COLUMNS = [
  "id",
  "title",
  "determination",
  "determined_at",
] as const satisfies readonly (keyof Row<"assessment_findings">)[];
const CONTROL_COLUMNS = [
  "id",
  "code",
  "title",
] as const satisfies readonly (keyof Row<"controls">)[];
const PROGRAM_COLUMNS = [
  "id",
  "code",
  "name",
] as const satisfies readonly (keyof Row<"programs">)[];

type ItemRow = Pick<Row<"component_offer_items">, (typeof ITEM_COLUMNS)[number]>;
type LinkRow = Pick<Row<"component_offer_issues">, (typeof LINK_COLUMNS)[number]>;
type IssueRow = Pick<Row<"operational_issues">, (typeof ISSUE_COLUMNS)[number]>;
type FindingRow = Pick<Row<"assessment_findings">, (typeof FINDING_COLUMNS)[number]>;
type ControlRow = Pick<Row<"controls">, (typeof CONTROL_COLUMNS)[number]>;
type ProgramRow = Pick<Row<"programs">, (typeof PROGRAM_COLUMNS)[number]>;

/** An operational issue as an offer names it. */
export type OfferedIssue = {
  id: string;
  programId: string;
  title: string;
  /** A key of `severityLevels`; none while nobody has rated it. */
  severity: string | null;
  /** A key of `operationalIssueStatuses`. */
  status: string;
  openedAt: string | null;
  ownerPartyId: string | null;
};

/** An assessment finding an offer of determinations holds, with the control it judges. */
export type OfferedFinding = {
  id: string;
  title: string;
  /** A key of `determinations`: what the finding determined, which the offer puts to the owner. */
  determination: string;
  determinedAt: string | null;
  /** The control the finding judges; none while the catalog's row could not be read. */
  control: { id: string; code: string; title: string } | null;
};

/**
 * One thing an offer holds: an operational issue of the offering program (kind finding) or an
 * assessment finding of its published results (kind determinations). The record itself is none
 * where the reader can no longer read it.
 */
export type ComponentOfferItem = {
  id: string;
  issueId: string | null;
  issue: OfferedIssue | null;
  assessmentFindingId: string | null;
  finding: OfferedFinding | null;
};

/**
 * A program's own operational issue for an accepted finding: the offering program's as the source,
 * and in every other program built from the component version the one the review opened, or the
 * one the program already held for a CVE of the finding.
 */
export type ComponentOfferIssue = {
  id: string;
  /** The offer's item the issue answers. */
  itemId: string;
  programId: string;
  programCode: string | null;
  programName: string | null;
  issueId: string;
  issue: OfferedIssue | null;
  /** The program's system component built from the component version. */
  systemComponentId: string | null;
  /** Whether it is the issue that was offered. */
  source: boolean;
};

export type ComponentOfferDetail = {
  offer: ComponentOfferRow;
  /** What the offer holds: issues the oldest first, findings by their control's code. */
  items: ComponentOfferItem[];
  /** Each program's own issue for an accepted finding, the source first, then by program code. */
  issues: ComponentOfferIssue[];
};

const offeredIssue = (row: IssueRow): OfferedIssue => ({
  id: row.id,
  programId: row.program_id,
  title: row.title,
  severity: row.severity,
  status: row.status,
  openedAt: row.opened_at,
  ownerPartyId: row.owner_party_id,
});

const byId = <T extends { id: string }>(rows: readonly T[]) =>
  new Map(rows.map((row) => [row.id, row]));
/** Codes as a reader orders them: AC-2 before AC-10. */
const natural = new Intl.Collator("en", { numeric: true });
/** A moment's place in time; one with none comes last. */
const moment = (value: string | null | undefined) =>
  value ? Date.parse(value) : Number.POSITIVE_INFINITY;

/** One offer's items and linked issues, put together from the rows read. */
export function offerDetail(
  offer: ComponentOfferRow,
  rows: {
    items: readonly ItemRow[];
    links: readonly LinkRow[];
    issues: readonly IssueRow[];
    findings: readonly FindingRow[];
    controls: readonly ControlRow[];
    programs: readonly ProgramRow[];
  },
): ComponentOfferDetail {
  const issues = byId(rows.issues);
  const findings = byId(rows.findings);
  const controls = byId(rows.controls);
  const programs = byId(rows.programs);
  const issueOf = (id: string | null) => {
    const row = id ? issues.get(id) : undefined;
    return row ? offeredIssue(row) : null;
  };
  const items = rows.items.map((item): ComponentOfferItem => {
    const finding = item.assessment_finding_id ? findings.get(item.assessment_finding_id) : null;
    const control = item.control_id ? controls.get(item.control_id) : undefined;
    return {
      id: item.id,
      issueId: item.issue_id,
      issue: issueOf(item.issue_id),
      assessmentFindingId: item.assessment_finding_id,
      finding: finding
        ? {
            id: finding.id,
            title: finding.title,
            determination: finding.determination,
            determinedAt: finding.determined_at,
            control: control ? { id: control.id, code: control.code, title: control.title } : null,
          }
        : null,
    };
  });
  items.sort(
    (a, b) =>
      moment(a.issue?.openedAt) - moment(b.issue?.openedAt) ||
      natural.compare(
        a.finding?.control?.code ?? a.issue?.title ?? a.finding?.title ?? "",
        b.finding?.control?.code ?? b.issue?.title ?? b.finding?.title ?? "",
      ) ||
      a.id.localeCompare(b.id),
  );
  const linked = rows.links.map((link): ComponentOfferIssue => {
    const program = programs.get(link.program_id);
    return {
      id: link.id,
      itemId: link.component_offer_item_id,
      programId: link.program_id,
      programCode: program?.code ?? null,
      programName: program?.name ?? null,
      issueId: link.issue_id,
      issue: issueOf(link.issue_id),
      systemComponentId: link.system_component_id,
      source: link.source,
    };
  });
  linked.sort(
    (a, b) =>
      Number(b.source) - Number(a.source) ||
      natural.compare(a.programCode ?? "", b.programCode ?? "") ||
      a.id.localeCompare(b.id),
  );
  return { offer, items, issues: linked };
}

/**
 * One offer with what it holds, as the reader: its register row, its items with the operational
 * issue or the assessment finding each names, and, once a finding is accepted, each program's own
 * issue for it. Null for an offer that is gone or not visible. The offer, its items and its links
 * are read together, then the records they name.
 */
export async function readComponentOffer(
  client: TableClient,
  context: ReadContext,
  offerId: string,
  signal?: AbortSignal,
): Promise<ComponentOfferDetail | null> {
  const scope = { component_offer_id: offerId };
  const [page, items, links] = await Promise.all([
    readServerPage(
      client,
      context,
      offerRead({ id: offerId }),
      { pageIndex: 0, pageSize: 1 },
      signal,
    ),
    readRows(client, context, "component_offer_items", scope, { columns: ITEM_COLUMNS }, signal),
    readRows(client, context, "component_offer_issues", scope, { columns: LINK_COLUMNS }, signal),
  ]);
  const offer = page.rows[0] as ComponentOfferRow | undefined;
  if (!offer) return null;
  const held = items as ItemRow[];
  const linked = links as LinkRow[];
  const named = (
    table: TableName,
    ids: readonly (string | null)[],
    columns: readonly string[],
  ): Promise<unknown[]> =>
    readRows(client, context, table, { id: idSet(ids) }, { columns }, signal);
  const [issues, findings, controls, programs] = await Promise.all([
    named(
      "operational_issues",
      [...held.map((item) => item.issue_id), ...linked.map((link) => link.issue_id)],
      ISSUE_COLUMNS,
    ),
    named(
      "assessment_findings",
      held.map((item) => item.assessment_finding_id),
      FINDING_COLUMNS,
    ),
    named(
      "controls",
      held.map((item) => item.control_id),
      CONTROL_COLUMNS,
    ),
    named(
      "programs",
      linked.map((link) => link.program_id),
      PROGRAM_COLUMNS,
    ),
  ]);
  return offerDetail(offer, {
    items: held,
    links: linked,
    issues: issues as IssueRow[],
    findings: findings as FindingRow[],
    controls: controls as ControlRow[],
    programs: programs as ProgramRow[],
  });
}

/** What one offer's read derives from beside the offer: a write to one reads it again. */
const OFFER_MODELS = [
  "component_offer_items",
  "component_offer_issues",
  "operational_issues",
  "assessment_findings",
  "component_owners",
  "component_definitions",
  "defined_components",
  "system_components",
  "systems",
  "programs",
  "parties",
] as const satisfies readonly TableName[];

/** One offer with its items and linked issues. One offer's answer never stands in for another's. */
export function useComponentOffer(
  offerId: string | null | undefined,
): UseQueryResult<ComponentOfferDetail | null, Error> {
  const workspace = useWorkspace();
  // Under the offers' own model, so a command that writes an offer reads it again.
  const key = ["models", workspace.tenantId, "component_offers", "offer"];
  useStaleOnWrite(workspace.tenantId, OFFER_MODELS, key);
  return useQuery<ComponentOfferDetail | null, Error>({
    queryKey: [...key, offerId ?? null],
    enabled: !!offerId,
    retry: false,
    queryFn: async ({ signal }) =>
      readComponentOffer(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        offerId!,
        signal,
      ),
  });
}

/* ——— The three commands —————————————————————————————————————————————————————————————————————— */

type Failure = { code?: string | undefined; message: string };

/** A refusal in the reader's words: the command's own, which say what stopped it. */
function refusal(error: Failure): Error {
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/** The words for what an offer of each kind holds. */
const itemWords = (kind: ComponentOfferKind) =>
  kind === "finding" ? "operational issue" : "assessment finding";

export const OFFER_NEEDS_COMPONENT = "Choose the component to offer a result on.";
export const offerNeedsItems = (kind: ComponentOfferKind) =>
  `Choose at least one ${itemWords(kind)} to offer.`;
export const offerTooMany = (kind: ComponentOfferKind) =>
  `Offer at most ${OFFER_ITEM_LIMIT} ${itemWords(kind)}s at a time.`;
export const OFFER_REVISION_MISSING = "Reload the offer first; its revision is missing.";
export const REVIEW_NEEDS_NOTE = "Say why the offer is returned.";
export const OFFER_ANSWER_UNREADABLE =
  "The offer was made, but the answer could not be read. Reload to see it.";
export const WITHDRAWAL_ANSWER_UNREADABLE =
  "The offer was withdrawn, but the answer could not be read. Reload to see it.";
export const REVIEW_ANSWER_UNREADABLE =
  "The offer was reviewed, but the answer could not be read. Reload to see it.";

/** What a program offers a component's owner, from one of its system components. */
export type OfferToComponent = {
  /** The offering program's system component, built from the library component. */
  systemComponentId: string;
  kind: ComponentOfferKind;
  /**
   * Operational issues of the program (finding), or assessment findings of its published results
   * (determinations).
   */
  itemIds: readonly string[];
  /** The offer's title; unsaid, the title of the first item offered. */
  title?: string | null | undefined;
  note?: string | null | undefined;
  /** Chosen once for one offer: the same request sent again answers as it first did. */
  requestId: string;
};

const offeredSchema = z.object({
  offerId: z.string(),
  kind: kindSchema,
  state: stateSchema,
  revision: z.number().int().positive(),
  items: z.number().int().positive(),
  definedComponentId: z.string(),
  programId: z.string(),
  systemComponentId: z.string(),
  waitingOnPartyId: z.string().nullable(),
  offeredAt: z.string(),
  activityEventId: z.string(),
});
/** What an offer wrote: the offer, the component version it names and who it waits on. */
export type OfferedToComponent = z.infer<typeof offeredSchema>;

/**
 * Offer something a program holds on a system component to the owner of the library component it
 * is built from, in one request: every item is offered or none is. Refused, in words the reader
 * acts on: a component built from no library component or on an element the program declared
 * modified, an item that is not the program's, a finding of draft results or with no
 * determination, two findings on one control, and an item that already waits in an offer for that
 * component version or was accepted for it. Sent again under the same id, the request answers as
 * it first did.
 */
export async function offerToComponent(
  client: Client,
  { tenantId, token }: ReadContext,
  offer: OfferToComponent,
): Promise<OfferedToComponent> {
  if (!offer.systemComponentId) throw new Error(OFFER_NEEDS_COMPONENT);
  const itemIds = [...new Set(offer.itemIds)].filter(Boolean);
  if (!itemIds.length) throw new Error(offerNeedsItems(offer.kind));
  if (itemIds.length > OFFER_ITEM_LIMIT) throw new Error(offerTooMany(offer.kind));
  const args = {
    p_tenant_id: tenantId,
    p_system_component_id: offer.systemComponentId,
    p_kind: offer.kind,
    p_item_ids: itemIds,
    p_title: offer.title?.trim() || null,
    p_note: offer.note?.trim() || null,
    p_request_id: offer.requestId,
  } satisfies Record<keyof Functions["offer_to_component"]["Args"], unknown>;
  const { data, error } = await client
    .rpc("offer_to_component", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = offeredSchema.safeParse(data);
  if (!parsed.success) throw new Error(OFFER_ANSWER_UNREADABLE);
  return parsed.data;
}

/** An offer as the reader saw it, which a withdrawal or a review is sent for. */
export type OfferAsRead = {
  offerId: string;
  /** The revision the reader saw: an offer changed since is refused. */
  expectedRevision: number;
  /** Chosen once for one request: the same request sent again answers as it first did. */
  requestId: string;
};

const withdrawnSchema = z.object({
  offerId: z.string(),
  state: stateSchema,
  revision: z.number().int().positive(),
  withdrawnAt: z.string(),
  activityEventId: z.string(),
});
export type WithdrawnComponentOffer = z.infer<typeof withdrawnSchema>;

/**
 * Withdraw an offer that still waits on the component's owner, at the revision the reader saw: it
 * leaves the Review queue and its items can be offered again. An offer already reviewed or
 * withdrawn, changed since it was read or gone is refused in words that say which.
 */
export async function withdrawComponentOffer(
  client: Client,
  { tenantId, token }: ReadContext,
  request: OfferAsRead,
): Promise<WithdrawnComponentOffer> {
  if (!Number.isSafeInteger(request.expectedRevision)) throw new Error(OFFER_REVISION_MISSING);
  const args: Functions["withdraw_component_offer"]["Args"] = {
    p_tenant_id: tenantId,
    p_offer_id: request.offerId,
    p_expected_revision: request.expectedRevision,
    p_request_id: request.requestId,
  };
  const { data, error } = await client
    .rpc("withdraw_component_offer", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = withdrawnSchema.safeParse(data);
  if (!parsed.success) throw new Error(WITHDRAWAL_ANSWER_UNREADABLE);
  return parsed.data;
}

/** A review of an offer that waits: accepted, or returned with a note that says why. */
export type ComponentOfferReview = OfferAsRead & {
  decision: ComponentOfferDecision;
  /** What the reviewer says; required to return the offer. */
  note?: string | null | undefined;
};

const reviewedSchema = z.object({
  offerId: z.string(),
  kind: kindSchema,
  state: stateSchema,
  revision: z.number().int().positive(),
  reviewedAt: z.string(),
  /** How many other programs an accepted finding opened an operational issue in. */
  programs: z.number().int().nonnegative(),
  /** The issues it opened, each in its program. */
  issues: z.array(z.object({ programId: z.string(), issueId: z.string() })),
  /** The items passed over in a program that already held an issue for them, or for their CVE. */
  skipped: z.number().int().nonnegative(),
  /** The component assessment accepted determinations were published as. */
  componentAssessmentId: z.string().nullable(),
  determinations: z.number().int().nonnegative(),
  activityEventId: z.string(),
});
/** What a review did: where the offer stands now, and what accepting it wrote. */
export type ReviewedComponentOffer = z.infer<typeof reviewedSchema>;

/**
 * Review an offer that waits on a component's owner, at the revision the reader saw, in one
 * request. Accepted, a finding stands on the component version: every other program built from it
 * gets an operational issue of its own, or keeps the one it already holds for the finding's CVE;
 * accepted determinations are published as one component assessment of the version, against the
 * offering system's control baseline. Returned, the offer says why and its items can be offered
 * again. Refused in words the reader acts on: an offer already reviewed or withdrawn, changed
 * since it was read or gone, determinations on a control outside the offering system's control
 * baseline, and a return with no note, which is not sent.
 */
export async function reviewComponentOffer(
  client: Client,
  { tenantId, token }: ReadContext,
  review: ComponentOfferReview,
): Promise<ReviewedComponentOffer> {
  if (!Number.isSafeInteger(review.expectedRevision)) throw new Error(OFFER_REVISION_MISSING);
  const note = review.note?.trim() || null;
  if (review.decision === "returned" && !note) throw new Error(REVIEW_NEEDS_NOTE);
  const args = {
    p_tenant_id: tenantId,
    p_offer_id: review.offerId,
    p_expected_revision: review.expectedRevision,
    p_decision: review.decision,
    p_note: note,
    p_request_id: review.requestId,
  } satisfies Record<keyof Functions["review_component_offer"]["Args"], unknown>;
  const { data, error } = await client
    .rpc("review_component_offer", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = reviewedSchema.safeParse(data);
  if (!parsed.success) throw new Error(REVIEW_ANSWER_UNREADABLE);
  return parsed.data;
}

/**
 * Every read a command on an offer can change, marked stale: the models it wrote, and the Review
 * queue's pages, which list an offer while it waits and name no model of the offers.
 */
function invalidateOffers(cache: QueryClient, tenantId: string, models: readonly TableName[]) {
  return Promise.all([
    ...models.map((model) => invalidateModel(cache, tenantId, model)),
    cache.invalidateQueries({ queryKey: ["models", tenantId, "review_queue_rows"] }),
  ]);
}

/**
 * Offer to a component's owner as a mutation. However the request settles, the offers read again,
 * and with them every read that counts them: a request whose answer was lost may still have made
 * the offer.
 */
export function useOfferToComponent() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<OfferedToComponent, Error, OfferToComponent>({
    mutationFn: async (offer) =>
      offerToComponent(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        offer,
      ),
    onSettled: () =>
      void invalidateOffers(cache, workspace.tenantId, [
        "component_offers",
        "component_offer_items",
        "activity_events",
      ]),
  });
}

/** Withdraw an offer as a mutation; a refusal for an offer someone else reviewed shows it as it is. */
export function useWithdrawComponentOffer() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<WithdrawnComponentOffer, Error, OfferAsRead>({
    mutationFn: async (request) =>
      withdrawComponentOffer(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () =>
      void invalidateOffers(cache, workspace.tenantId, ["component_offers", "activity_events"]),
  });
}

/**
 * Review an offer as a mutation. However it settles, the offers read again with what accepting one
 * writes: the issues it opened in other programs and their CVE links, or the component assessment
 * it published and that assessment's determinations, which every read of the component's standing
 * and of what its consumers inherit watches.
 */
export function useReviewComponentOffer() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ReviewedComponentOffer, Error, ComponentOfferReview>({
    mutationFn: async (review) =>
      reviewComponentOffer(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        review,
      ),
    onSettled: () =>
      void invalidateOffers(cache, workspace.tenantId, [
        "component_offers",
        "component_offer_issues",
        "operational_issues",
        "issue_vulnerabilities",
        "component_assessments",
        "component_determinations",
        "activity_events",
      ]),
  });
}
