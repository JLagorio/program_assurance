import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";
import { programRoles } from "./status";

/*
 * Who holds a program's roles, and who may do the acts held to them. A program records a person or
 * an organization in a role for a period (`program_role_assignments`), in RMF's roles: authorizing
 * official, lead assessor, assessor, ISSM, ISSO and system owner, beside the program's other
 * recorded responsibilities. A program has one authorizing official and one lead assessor at a
 * time. Where it records anybody in either role, the act the role holds is held to it: only a holder
 * today records an authorization decision on the program's packages, and only a holder today
 * publishes its assessment results; where it records nobody, every member who may write still may,
 * as before. Someone who belongs to an organization that holds a role holds it with it.
 *
 * Two reads answer it, each in one request: `program_roles`, the program's roles in RMF's order with
 * today's holders of each by name, and `program_reader_roles`, the roles the signed-in reader holds
 * on it today. `actStanding` puts them together: whether an act is held to a role, whether the
 * reader may do it as far as roles go, and whom it waits on. The words and order are `programRoles`
 * in status.
 */

/** A program role: a key of `programRoles`, in RMF's order. */
export type ProgramRole = keyof typeof programRoles;

/** Every role in RMF's order, as the reads answer them. */
export const PROGRAM_ROLE_ORDER = Object.keys(programRoles) as ProgramRole[];

/** The roles RMF names, which a record's action slot reads; the rest are other responsibilities. */
export const RMF_ROLES = [
  "authorizing_official",
  "lead_assessor",
  "assessor",
  "security_manager",
  "security_officer",
  "system_owner",
] as const satisfies readonly ProgramRole[];

/** The acts held to a role, where the program records anybody in it, and the role each needs. */
export const roleActs = {
  /** Record an authorization decision on one of the program's packages: the authorizing official. */
  authorization_decision: "authorizing_official",
  /** Publish the program's assessment results: the lead assessor. */
  publish_assessment_results: "lead_assessor",
} as const satisfies Record<string, ProgramRole>;
export type RoleAct = keyof typeof roleActs;

const roleSchema = z.enum(PROGRAM_ROLE_ORDER as [ProgramRole, ...ProgramRole[]]);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const holderSchema = z.object({
  assignment_id: z.string(),
  party_id: z.string(),
  name: z.string(),
  party_type: z.enum(["person", "organization"]),
  starts_on: day.nullable(),
  ends_on: day.nullable(),
  revision: z.number(),
});
const lineSchema = z.object({
  role: roleSchema,
  role_rank: z.number(),
  one_holder: z.boolean(),
  recorded: z.boolean(),
  holders: z.array(holderSchema),
});
const readerSchema = z.object({
  role: roleSchema,
  role_rank: z.number(),
  party_id: z.string(),
  holder_party_id: z.string(),
  assignment_id: z.string(),
  starts_on: day.nullable(),
  ends_on: day.nullable(),
});

/** A person or organization who holds a role today. */
export type RoleHolder = {
  assignmentId: string;
  partyId: string;
  name: string;
  partyType: "person" | "organization";
  /** The first day they hold it; null from the start. */
  startsOn: string | null;
  /** The last day they hold it; null while they still do. */
  endsOn: string | null;
  /** The assignment's revision, for an edit at the revision the reader saw. */
  revision: number;
};

/** One role of a program, held or not. */
export type ProgramRoleLine = {
  role: ProgramRole;
  /** A program has one holder of it at a time: the authorizing official and the lead assessor. */
  oneHolder: boolean;
  /**
   * The program records somebody in it on some day. Where it does, the act the role holds is held
   * to it, so with no holder today nobody may do it.
   */
  recorded: boolean;
  /** Today's holders, by name. */
  holders: RoleHolder[];
};

/** A role the signed-in reader holds on a program today. */
export type ReaderRole = {
  role: ProgramRole;
  /** The reader's own party in the workspace. */
  partyId: string;
  /** The party the role is recorded for: the reader's own, or an organization they belong to. */
  holderPartyId: string;
  assignmentId: string;
  startsOn: string | null;
  endsOn: string | null;
};

type Client = Pick<SupabaseClient, "rpc">;

/**
 * A program's roles in RMF's order, every one whether held or not, with today's holders by name. A
 * session with no account and a program the reader cannot read are refused.
 */
export async function readProgramRoles(
  client: Client,
  { token }: Pick<ReadContext, "token">,
  programId: string,
  signal?: AbortSignal,
): Promise<ProgramRoleLine[]> {
  let request = client
    .rpc("program_roles", { p_program_id: programId })
    .setHeader("Authorization", `Bearer ${token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return z
    .array(lineSchema)
    .parse(data)
    .sort((a, b) => a.role_rank - b.role_rank)
    .map((line) => ({
      role: line.role,
      oneHolder: line.one_holder,
      recorded: line.recorded,
      holders: line.holders.map((holder) => ({
        assignmentId: holder.assignment_id,
        partyId: holder.party_id,
        name: holder.name,
        partyType: holder.party_type,
        startsOn: holder.starts_on,
        endsOn: holder.ends_on,
        revision: holder.revision,
      })),
    }));
}

/**
 * The roles the signed-in reader holds on a program today, in RMF's order: none for a reader with
 * no party in the workspace or no role. A session with no account and a program the reader cannot
 * read are refused.
 */
export async function readReaderRoles(
  client: Client,
  { token }: Pick<ReadContext, "token">,
  programId: string,
  signal?: AbortSignal,
): Promise<ReaderRole[]> {
  let request = client
    .rpc("program_reader_roles", { p_program_id: programId })
    .setHeader("Authorization", `Bearer ${token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return z
    .array(readerSchema)
    .parse(data)
    .sort((a, b) => a.role_rank - b.role_rank)
    .map((row) => ({
      role: row.role,
      partyId: row.party_id,
      holderPartyId: row.holder_party_id,
      assignmentId: row.assignment_id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
    }));
}

/** Where an act stands for the reader, as far as the program's roles go. */
export type ActStanding = {
  /** The role the act needs. */
  role: ProgramRole;
  /** The program records somebody in that role, so the act is held to it. */
  heldToRole: boolean;
  /** The reader may do it: the act is not held to a role, or the reader holds it today. */
  readerMay: boolean;
  /** Whom the act waits on: today's holders of the role, empty where nobody holds it today. */
  holders: RoleHolder[];
};

/**
 * Whether the reader may do an act, and whom it waits on otherwise. Roles only: a reader still
 * needs a workspace role that may write.
 */
export function actStanding(
  roles: readonly ProgramRoleLine[],
  reader: readonly ReaderRole[],
  act: RoleAct,
): ActStanding {
  const role = roleActs[act];
  const line = roles.find((item) => item.role === role);
  const heldToRole = line?.recorded ?? false;
  return {
    role,
    heldToRole,
    readerMay: !heldToRole || reader.some((item) => item.role === role),
    holders: line?.holders ?? [],
  };
}

/** A role inside a sentence: "authorizing official", "lead assessor"; an initialism as it is. */
export function roleWords(role: ProgramRole): string {
  const label = programRoles[role].label;
  return label === label.toUpperCase() ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

/** Each act in a sentence after "can", and the record it is done to: "record this decision". */
const ACT_WORDS: Record<RoleAct, string> = {
  authorization_decision: "record this decision",
  publish_assessment_results: "publish these results",
};

/**
 * Why the reader may not do an act, in the words a primary that keeps its place says: "Only R.
 * Calloway, the authorizing official, can record this decision." Null where the reader may, as far
 * as roles go: the act is not held to a role, or the reader holds it today.
 */
export function actRefusal(standing: ActStanding, act: RoleAct): string | null {
  if (standing.readerMay) return null;
  const role = roleWords(standing.role);
  if (!standing.holders.length)
    return `Nobody is the ${role} today, so nobody can ${ACT_WORDS[act]}.`;
  const names = standing.holders.map((holder) => holder.name).join(" and ");
  return `Only ${names}, the ${role}, can ${ACT_WORDS[act]}.`;
}

/**
 * Every model the roles are read from: an assignment, and the party it names (a name, or the
 * organization a person belongs to).
 */
const ROLE_MODELS = ["program_role_assignments", "parties"] as const satisfies readonly TableName[];

/** A program's roles with today's holders. Nothing is read until the program is named. */
export function useProgramRoles(
  programId: string | null | undefined,
): UseQueryResult<ProgramRoleLine[], Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, ROLE_MODELS, ["models", workspace.tenantId, "program_roles"]);
  return useQuery<ProgramRoleLine[], Error>({
    queryKey: ["models", workspace.tenantId, "program_roles", programId ?? null],
    enabled: !!programId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramRoles(database(), { token: await requireIdentity(workspace) }, programId!, signal),
  });
}

/** The roles the signed-in reader holds on a program today. Nothing is read until it is named. */
export function useReaderRoles(
  programId: string | null | undefined,
): UseQueryResult<ReaderRole[], Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, ROLE_MODELS, [
    "models",
    workspace.tenantId,
    "program_reader_roles",
  ]);
  return useQuery<ReaderRole[], Error>({
    queryKey: ["models", workspace.tenantId, "program_reader_roles", programId ?? null],
    enabled: !!programId,
    retry: false,
    queryFn: async ({ signal }) =>
      readReaderRoles(database(), { token: await requireIdentity(workspace) }, programId!, signal),
  });
}

/** Where an act stands for the reader on a program, as its primary reads it. */
export type ActStandingRead = {
  /** Undefined while either read loads, or after one failed. */
  standing: ActStanding | undefined;
  /** Why the reader may not do it ("Only R. Calloway, …"), or why it cannot be told yet. */
  refusal: string | null;
  /** The reader's own party, where they hold the act's role today: who signs it. */
  readerPartyId: string | null;
  /** The two reads, for the region that says their failure. */
  queries: [UseQueryResult<ProgramRoleLine[], Error>, UseQueryResult<ReaderRole[], Error>];
};

/** While the roles are read, a primary held to one keeps its place and says so. */
export const ROLES_LOADING = "Reading who holds the program's roles…";
/** When they cannot be read, it says that instead; the page's alert offers Retry. */
export const ROLES_UNREADABLE = "The program's roles could not be read.";

/**
 * Where an act stands for the reader on a program, from its two role reads: the standing, the words
 * a primary says while the reader may not do it (or while the roles load, or once they failed), and
 * the reader's own party where they hold the role. Nothing is read until the program is named; with
 * none, the act is not held to a role.
 */
export function useActStanding(
  programId: string | null | undefined,
  act: RoleAct,
): ActStandingRead {
  const roles = useProgramRoles(programId);
  const reader = useReaderRoles(programId);
  const queries: ActStandingRead["queries"] = [roles, reader];
  if (!programId) return { standing: undefined, refusal: null, readerPartyId: null, queries };
  if (!roles.data || !reader.data)
    return {
      standing: undefined,
      refusal: roles.isError || reader.isError ? ROLES_UNREADABLE : ROLES_LOADING,
      readerPartyId: null,
      queries,
    };
  const standing = actStanding(roles.data, reader.data, act);
  const mine = reader.data.find((item) => item.role === standing.role);
  return {
    standing,
    refusal: actRefusal(standing, act),
    readerPartyId: standing.heldToRole && mine ? mine.partyId : null,
    queries,
  };
}
