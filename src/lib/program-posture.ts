import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { TRACE_MODELS } from "./assurance-trace";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * A program's posture: its system elements by control family, counted in assessment objectives. A
 * requirement's mapping stands on the element it names, where that element's control baseline
 * selects the control, and covers the objective it names and every one under it (all of the
 * control's where it names none); a cell counts the family's objectives the mappings on the element
 * and the elements inside it cover, each once, and those no requirement that cites evidence covers
 * there. An open issue stands where the requirements it names and those its evidence supports stand
 * (a requirement where its mappings stand), and an open risk where its issues stand.
 * `program_posture` counts each cell on the server; its totals are the program's control baseline
 * as its control status counts it, so the band and the Control status view agree. This module names
 * the rows and says what a cell reads as.
 *
 * The same grid is read by cyber resiliency technique: `program_resiliency_posture` puts the 14
 * techniques of NIST SP 800-160 Vol. 2 where the families are. An objective stands under every
 * technique its control supports in Table E-1, so it may stand under several and counts once on a
 * line. A technique is named by its code, as the framework's items are (frameworks): an id changes
 * when the publication is read again.
 */

const id = z.string().uuid();
/** A severity's place in the product's order as the server counts it: 1 (low) to 4 (critical). */
const rank = z.number().int().min(1).max(4).nullable();
const counts = {
  /** The objectives the mappings there cover, each once. */
  objectives: z.number(),
  /** Of those, the ones a requirement that cites evidence covers there. */
  evidenced: z.number(),
  issues: z.number(),
  issue_severity: rank,
  risks: z.number(),
  risk_severity: rank,
};

const elementSchema = z.object({
  id,
  code: z.string(),
  name: z.string(),
  type: z.string(),
  parent_id: id.nullable(),
  boundary: z.boolean(),
  ...counts,
});
const familySchema = z.object({ id, code: z.string(), title: z.string().nullable(), ...counts });
const cellSchema = z.object({ element_id: id, family_id: id, ...counts });
/**
 * What both postures total alike: `objectives`, `mapped` and `evidenced` are the program's control
 * baseline as its control status counts it (an objective mapped once covered on every system that
 * selects it). `placed`, `issues_placed` and `risks_placed` are each grid's own.
 */
const totals = {
  requirements: z.number(),
  /** Requirements that map a control and stand on no element. */
  unplaced: z.number(),
  objectives: z.number(),
  mapped: z.number(),
  evidenced: z.number(),
  /** Objectives the grid places, each once. */
  placed: z.number(),
  issues: z.number(),
  issues_severe: z.number(),
  issues_placed: z.number(),
  risks: z.number(),
  risks_severe: z.number(),
  risks_placed: z.number(),
};
const postureSchema = z.object({
  elements: z.array(elementSchema),
  families: z.array(familySchema),
  cells: z.array(cellSchema),
  totals: z.object(totals),
});

const techniqueSchema = z.object({ code: z.string(), title: z.string(), ...counts });
const techniqueCellSchema = z.object({ element_id: id, technique_code: z.string(), ...counts });
const resiliencyPostureSchema = z.object({
  elements: z.array(elementSchema),
  /** Every technique of the framework, in the publication's order, also one nothing stands under. */
  techniques: z.array(techniqueSchema),
  cells: z.array(techniqueCellSchema),
  /** `unsupported` is how many requirements stand on an element under no technique. */
  totals: z.object({ ...totals, unsupported: z.number() }),
});

export type ProgramPosture = z.infer<typeof postureSchema>;
export type ProgramResiliencyPosture = z.infer<typeof resiliencyPostureSchema>;
export type PostureElement = z.infer<typeof elementSchema>;
export type PostureFamily = z.infer<typeof familySchema>;
export type PostureTechnique = z.infer<typeof techniqueSchema>;
/** What a posture totals, whatever its columns: `unsupported` is the posture by technique's alone. */
export type PostureTotals = ProgramPosture["totals"] & { unsupported?: number | undefined };
/** The numbers a cell, an element's line or a family's or a technique's line holds. */
export type PostureCounts = Pick<
  PostureElement,
  "objectives" | "evidenced" | "issues" | "issue_severity" | "risks" | "risk_severity"
>;

const listed = z.object({
  id,
  title: z.string(),
  severity: z.string().nullable(),
  status: z.string(),
});
const cellDetailSchema = z.object({
  objectives: z.number(),
  evidenced: z.number(),
  issues: z.array(listed),
  risks: z.array(listed),
  /**
   * Up to 50 requirements to evidence: each cites none and covers objectives there that no
   * requirement with evidence covers (`objectives` of them), most first.
   */
  unevidenced: z.array(
    z.object({ id, code: z.string(), title: z.string(), objectives: z.number() }),
  ),
  /** How many requirements there are to evidence. */
  unevidenced_count: z.number(),
  /** The controls whose objectives stand there: how many, how many with evidence, and of all it counts. */
  controls: z.array(
    z.object({
      id,
      code: z.string(),
      title: z.string(),
      objectives: z.number(),
      evidenced: z.number(),
      total: z.number(),
    }),
  ),
});
export type PostureCellDetail = z.infer<typeof cellDetailSchema>;

type Client = Pick<SupabaseClient, "rpc">;

export async function readProgramPosture(
  client: Client,
  context: ReadContext,
  programId: string,
  signal?: AbortSignal,
): Promise<ProgramPosture> {
  let request = client
    .rpc("program_posture", { p_tenant_id: context.tenantId, p_program_id: programId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return postureSchema.parse(data);
}

/** What stands in one cell; either end left out reads a whole line. */
export async function readProgramPostureCell(
  client: Client,
  context: ReadContext,
  cell: { programId: string; elementId?: string | null; familyId?: string | null },
  signal?: AbortSignal,
): Promise<PostureCellDetail> {
  let request = client
    .rpc("program_posture_cell", {
      p_tenant_id: context.tenantId,
      p_program_id: cell.programId,
      ...(cell.elementId ? { p_element_id: cell.elementId } : {}),
      ...(cell.familyId ? { p_family_id: cell.familyId } : {}),
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return cellDetailSchema.parse(data);
}

/**
 * A program's posture by cyber resiliency technique. The server names the program alone and reads
 * its workspace from it; a program the reader cannot read is refused.
 */
export async function readProgramResiliencyPosture(
  client: Client,
  context: ReadContext,
  programId: string,
  signal?: AbortSignal,
): Promise<ProgramResiliencyPosture> {
  let request = client
    .rpc("program_resiliency_posture", { p_program_id: programId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return resiliencyPostureSchema.parse(data);
}

/** What stands in one cell of the posture by technique; either end left out reads a whole line. */
export async function readProgramResiliencyPostureCell(
  client: Client,
  context: ReadContext,
  cell: { programId: string; elementId?: string | null; techniqueCode?: string | null },
  signal?: AbortSignal,
): Promise<PostureCellDetail> {
  let request = client
    .rpc("program_resiliency_posture_cell", {
      p_program_id: cell.programId,
      ...(cell.elementId ? { p_element_id: cell.elementId } : {}),
      ...(cell.techniqueCode ? { p_technique_code: cell.techniqueCode } : {}),
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return cellDetailSchema.parse(data);
}

/** Every model the posture is counted from: a write to one counts it again. */
const POSTURE_MODELS = [...TRACE_MODELS, "systems"] as const satisfies readonly TableName[];

export type PostureReadOptions = {
  /** Wait: the grid is drawn by its other columns, and this posture is not asked for. */
  enabled?: boolean | undefined;
};

export function useProgramPosture(
  programId: string,
  options: PostureReadOptions = {},
): UseQueryResult<ProgramPosture, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, POSTURE_MODELS, [
    "models",
    workspace.tenantId,
    "program_posture",
  ]);
  return useQuery<ProgramPosture, Error>({
    queryKey: ["models", workspace.tenantId, "program_posture", programId],
    enabled: options.enabled ?? true,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readProgramPosture(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId,
        signal,
      ),
  });
}

/**
 * A program's posture by cyber resiliency technique. It is counted from the models the posture by
 * family is, and from the pinned framework, which the application never writes.
 */
export function useProgramResiliencyPosture(
  programId: string,
  options: PostureReadOptions = {},
): UseQueryResult<ProgramResiliencyPosture, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, POSTURE_MODELS, [
    "models",
    workspace.tenantId,
    "program_resiliency_posture",
  ]);
  return useQuery<ProgramResiliencyPosture, Error>({
    queryKey: ["models", workspace.tenantId, "program_resiliency_posture", programId],
    enabled: options.enabled ?? true,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      readProgramResiliencyPosture(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId,
        signal,
      ),
  });
}

/** One cell's records, read when the cell is chosen. */
export function useProgramPostureCell(
  programId: string,
  cell: { elementId: string | null; familyId: string | null } | null,
): UseQueryResult<PostureCellDetail, Error> {
  const workspace = useWorkspace();
  return useQuery<PostureCellDetail, Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      "program_posture",
      programId,
      "cell",
      cell?.elementId ?? null,
      cell?.familyId ?? null,
    ],
    enabled: cell !== null,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramPostureCell(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        { programId, ...cell },
        signal,
      ),
  });
}

/** One cell's records of the posture by technique, read when the cell is chosen. */
export function useProgramResiliencyPostureCell(
  programId: string,
  cell: { elementId: string | null; techniqueCode: string | null } | null,
): UseQueryResult<PostureCellDetail, Error> {
  const workspace = useWorkspace();
  return useQuery<PostureCellDetail, Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      "program_resiliency_posture",
      programId,
      "cell",
      cell?.elementId ?? null,
      cell?.techniqueCode ?? null,
    ],
    enabled: cell !== null,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramResiliencyPostureCell(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        { programId, ...cell },
        signal,
      ),
  });
}

/** What the grid counts in each cell: objectives mapped, those without evidence, open issues, open risks. */
export const POSTURE_READINGS = ["objectives", "gaps", "issues", "risks"] as const;
export type PostureReading = (typeof POSTURE_READINGS)[number];

/** A severity by its rank, lowest first, as the server counts it from 1. */
const SEVERITIES = ["low", "moderate", "high", "critical"] as const;
export const severityOfRank = (value: number | null | undefined) =>
  value ? (SEVERITIES[value - 1] ?? null) : null;

/** What a cell or a line reads as under a reading: a count. */
export function postureValue(reading: PostureReading, counted: PostureCounts): number {
  switch (reading) {
    case "objectives":
      return counted.objectives;
    case "gaps":
      return counted.objectives - counted.evidenced;
    case "issues":
      return counted.issues;
    case "risks":
      return counted.risks;
  }
}

/** The worst severity among what a cell counts under a reading of issues or risks; none for objectives. */
export const postureSeverity = (reading: PostureReading, counted: PostureCounts) =>
  severityOfRank(
    reading === "issues"
      ? counted.issue_severity
      : reading === "risks"
        ? counted.risk_severity
        : null,
  );

/** A row of the grid: an element under the element that holds it. */
export type PostureRow = {
  /** The row's name in the grid, unique among the rows. */
  name: string;
  element: PostureElement;
  /** Its depth under the program's top element, 0 at the top. */
  level: number;
  /** It holds other elements: its numbers total theirs and its own. */
  summary: boolean;
};

/**
 * The grid's rows: every element in the order of the system's tree, each under the element that
 * holds it, in the order the server gives its elements (by code). An element whose holder is not
 * among them stands at the top. Two elements that share a name are told apart by their codes.
 */
export function postureRows(elements: readonly PostureElement[]): PostureRow[] {
  const known = new Set(elements.map((element) => element.id));
  const inside = new Map<string | null, PostureElement[]>();
  for (const element of elements) {
    const holder = element.parent_id && known.has(element.parent_id) ? element.parent_id : null;
    inside.set(holder, [...(inside.get(holder) ?? []), element]);
  }
  const shared = new Map<string, number>();
  for (const element of elements) shared.set(element.name, (shared.get(element.name) ?? 0) + 1);
  const rows: PostureRow[] = [];
  const seen = new Set<string>();
  const walk = (holder: string | null, level: number) => {
    for (const element of inside.get(holder) ?? []) {
      // A tree that loops back on itself is walked once.
      if (seen.has(element.id)) continue;
      seen.add(element.id);
      rows.push({
        name:
          (shared.get(element.name) ?? 0) > 1 ? `${element.name} (${element.code})` : element.name,
        element,
        level,
        summary: (inside.get(element.id)?.length ?? 0) > 0,
      });
      walk(element.id, level + 1);
    }
  };
  walk(null, 0);
  return rows;
}

/** What the grid's columns are: the control families, or the cyber resiliency techniques. */
export const POSTURE_COLUMNS = ["families", "techniques"] as const;
export type PostureColumns = (typeof POSTURE_COLUMNS)[number];

/** A column of the grid: a control family or a resiliency technique. */
export type PostureColumn = {
  /** What its cells are keyed by and its records read by: a family's id, a technique's code. */
  key: string;
  /** Its heading in the grid, unique among the columns: a family's code, a technique's title. */
  name: string;
  /** The column in full, as a cell's card says it. */
  title: string;
};

/** Names told apart: two columns that share a name each take their code. */
function columnNames<T>(items: readonly T[], name: (item: T) => string, code: (item: T) => string) {
  const shared = new Map<string, number>();
  for (const item of items) shared.set(name(item), (shared.get(name(item)) ?? 0) + 1);
  return (item: T) =>
    (shared.get(name(item)) ?? 0) > 1 ? `${name(item)} (${code(item)})` : name(item);
}

/** The family columns, in the server's order (the catalog's): each headed by its code. */
export function familyColumns(families: readonly PostureFamily[]): PostureColumn[] {
  const heading = columnNames(
    families,
    (family) => family.code,
    (family) => family.id,
  );
  return families.map((family) => ({
    key: family.id,
    name: heading(family),
    title: family.title ? `${family.code} ${family.title}` : family.code,
  }));
}

/**
 * The technique columns, in the framework's order: each headed by its title. With the codes a
 * program chose (`ResiliencyChoice.techniques`), only those the framework names among them; a
 * choice that names none of them leaves no column, and the caller shows every technique.
 */
export function techniqueColumns(
  techniques: readonly PostureTechnique[],
  chosen?: readonly string[] | undefined,
): PostureColumn[] {
  const heading = columnNames(
    techniques,
    (technique) => technique.title,
    (technique) => technique.code,
  );
  const kept = chosen ? new Set(chosen) : null;
  return techniques
    .filter((technique) => !kept || kept.has(technique.code))
    .map((technique) => ({
      key: technique.code,
      name: heading(technique),
      title: technique.title,
    }));
}

/** The cells by their element and their column's key, for the grid's lookup. */
export function postureCells(posture: ProgramPosture | ProgramResiliencyPosture) {
  const cells = new Map<string, PostureCounts>();
  for (const cell of posture.cells)
    cells.set(
      `${cell.element_id}:${"family_id" in cell ? cell.family_id : cell.technique_code}`,
      cell,
    );
  return cells;
}

/** What a reading counts that the grid does not place, by why. */
export type PostureLeftOut =
  /**
   * Open issues or open risks: none of the requirements the issues name or their evidence supports
   * stands in a cell.
   */
  | { records: "issues" | "risks"; unplaced: number }
  /**
   * Under objectives, the requirements whose coverage stands in no cell: those that map a control
   * and stand on no element (none of their mappings is on an element whose control baseline selects
   * the control), and (by technique) those that stand on an element under no technique. The two
   * never count the same requirement.
   */
  | { records: "requirements"; unplaced: number; unsupported: number };

/** How many of the records a reading counts, or whose coverage it counts, stand in no cell. */
export function postureLeftOut(reading: PostureReading, counted: PostureTotals): PostureLeftOut {
  if (reading === "issues")
    return { records: "issues", unplaced: counted.issues - counted.issues_placed };
  if (reading === "risks")
    return { records: "risks", unplaced: counted.risks - counted.risks_placed };
  return {
    records: "requirements",
    unplaced: counted.unplaced,
    unsupported: counted.unsupported ?? 0,
  };
}
