import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

export type Impact = "low" | "moderate" | "high";
export type SystemType =
  "information_system" | "industrial_control_system" | "platform" | "service";
export type ElementType =
  "subsystem" | "hardware" | "software" | "network" | "service" | "facility" | "data" | "other";
/** @deprecated Use ElementType. */
export type CompositionNodeType = ElementType;
export type ProgramRole =
  | "program_manager"
  | "system_owner"
  | "security_officer"
  | "control_owner"
  | "assessor"
  | "reviewer"
  | "authorizing_official";
export type TailoringDecision = {
  controlId: string;
  action: "include" | "exclude";
  rationale: string;
};
export type ParameterOverride = { parameterId: string; values: string[]; rationale: string };
/** A base profile the program adopts as-is, or an overlay layered on it when tailored. */
export type ProgramProfileDraft = {
  key: string;
  baseResolutionId: string;
  tailoring: TailoringDecision[];
  parameters: ParameterOverride[];
};
export type LibraryPin = { definedComponentId: string; revisionId: string; rationale: string };
/** The published product version and the configuration a system is created from. */
export type ProductPin = { revisionId: string; configurationId: string };
export type ElementWizardDraft = {
  key: string;
  parentKey: string | null;
  code: string;
  name: string;
  description: string;
  type: ElementType | null;
  /** Set when the element is a component pulled from the library. */
  library: LibraryPin | null;
  /** Set when the element is inherited from the system's product configuration. */
  productElementId: string | null;
};
export type SystemWizardDraft = {
  key: string;
  code: string;
  name: string;
  description: string;
  type: SystemType | null;
  ownerPartyId: string | null;
  confidentiality: Impact | null;
  integrity: Impact | null;
  availability: Impact | null;
  categorizationRationale: string;
  /** Which program profile this system adopts. */
  profileKey: string;
  /** Set when the system is a variant of a product configuration. */
  product: ProductPin | null;
  elements: ElementWizardDraft[];
};
export type ProgramWizardDraft = {
  requestId: string;
  code: string;
  name: string;
  description: string;
  sponsorPartyId: string | null;
  startsOn: string | null;
  endsOn: string | null;
  roles: { partyId: string; role: ProgramRole }[];
  catalogRevisionId: string;
  profiles: ProgramProfileDraft[];
  systems: SystemWizardDraft[];
};
export type ProgramWizardResult = {
  programId: string;
  systemIds: string[];
  profiles: { key: string; profileResolutionId: string; tailored: boolean }[];
  elements: { key: string; systemId: string; systemComponentId: string | null }[];
};

export const elementTypes = [
  "subsystem",
  "hardware",
  "software",
  "network",
  "service",
  "facility",
  "data",
  "other",
] as const;
const uuid = z.string().uuid("Choose an existing record.");
const text = z.string().trim().min(1, "This field is required.").max(10000);
const code = z.string().trim().min(1, "Enter a code.").max(100);
const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Enter a valid date.")
  .nullable();
const impact = z.enum(["low", "moderate", "high"], { message: "Choose each impact explicitly." });
const tailoring = z
  .array(
    z
      .object({
        controlId: uuid,
        action: z.enum(["include", "exclude"]),
        rationale: text,
      })
      .strict(),
  )
  .max(10000);
const parameters = z
  .array(
    z
      .object({
        parameterId: uuid,
        values: z.array(text).min(1).max(100),
        rationale: text,
      })
      .strict(),
  )
  .max(10000);
const elementSchema = z
  .object({
    key: uuid,
    parentKey: uuid.nullable(),
    code,
    name: text,
    description: z.string().max(10000),
    type: z.enum(elementTypes, { message: "Choose an element type." }),
    library: z
      .object({ definedComponentId: uuid, revisionId: uuid, rationale: text })
      .strict()
      .nullable(),
    productElementId: uuid.nullable(),
  })
  .strict();
/** One system as the wizard and Add from products send it; exported for the post-create command. */
export const systemWizardSchema = z
  .object({
    key: uuid,
    code,
    name: text,
    description: z.string().max(10000),
    type: z.enum(["information_system", "industrial_control_system", "platform", "service"], {
      message: "Choose a system type.",
    }),
    ownerPartyId: uuid.nullable(),
    confidentiality: impact,
    integrity: impact,
    availability: impact,
    categorizationRationale: text,
    profileKey: uuid.min(1, "Choose a program profile for this system."),
    product: z.object({ revisionId: uuid, configurationId: uuid }).strict().nullable(),
    elements: z.array(elementSchema).max(300),
  })
  .strict();
export const programWizardSchema = z
  .object({
    requestId: uuid,
    code,
    name: text,
    description: z.string().max(10000),
    sponsorPartyId: uuid.nullable(),
    startsOn: nullableDate,
    endsOn: nullableDate,
    roles: z
      .array(
        z
          .object({
            partyId: uuid,
            role: z.enum([
              "program_manager",
              "system_owner",
              "security_officer",
              "control_owner",
              "assessor",
              "reviewer",
              "authorizing_official",
            ]),
          })
          .strict(),
      )
      .max(100),
    catalogRevisionId: uuid,
    profiles: z
      .array(
        z
          .object({
            key: uuid,
            baseResolutionId: uuid,
            tailoring,
            parameters,
          })
          .strict(),
      )
      .min(1, "Choose at least one published base profile.")
      .max(30),
    systems: z.array(systemWizardSchema).min(1, "Add at least one system.").max(50),
  })
  .strict()
  .superRefine((draft, context) => {
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn)
      context.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "End date must be on or after the start date.",
      });
    const roles = new Set<string>();
    draft.roles.forEach((role, index) => {
      const key = `${role.partyId}/${role.role}`;
      if (roles.has(key))
        context.addIssue({
          code: "custom",
          path: ["roles", index],
          message: "This role is already assigned to this person.",
        });
      roles.add(key);
    });
    const profileKeys = new Set<string>();
    const untailoredBases = new Set<string>();
    draft.profiles.forEach((profile, index) => {
      if (profileKeys.has(profile.key))
        context.addIssue({
          code: "custom",
          path: ["profiles", index, "key"],
          message: "Program profile identifiers must be distinct.",
        });
      profileKeys.add(profile.key);
      if (!profile.tailoring.length && !profile.parameters.length) {
        if (untailoredBases.has(profile.baseResolutionId))
          context.addIssue({
            code: "custom",
            path: ["profiles", index, "baseResolutionId"],
            message: "Choose each base profile once unless you tailor it.",
          });
        untailoredBases.add(profile.baseResolutionId);
      }
      for (const field of ["tailoring", "parameters"] as const) {
        const ids = new Set<string>();
        profile[field].forEach((item, itemIndex) => {
          const id = "controlId" in item ? item.controlId : item.parameterId;
          if (ids.has(id))
            context.addIssue({
              code: "custom",
              path: ["profiles", index, field, itemIndex],
              message: "Record one decision per control or parameter.",
            });
          ids.add(id);
        });
      }
    });
    const systemCodes = new Set<string>();
    const systemKeys = new Set<string>();
    draft.systems.forEach((system, index) => {
      if (systemCodes.has(system.code.toLowerCase()))
        context.addIssue({
          code: "custom",
          path: ["systems", index, "code"],
          message: "System codes must be distinct.",
        });
      systemCodes.add(system.code.toLowerCase());
      if (systemKeys.has(system.key))
        context.addIssue({
          code: "custom",
          path: ["systems", index, "key"],
          message: "System identifiers must be distinct.",
        });
      systemKeys.add(system.key);
      if (!profileKeys.has(system.profileKey))
        context.addIssue({
          code: "custom",
          path: ["systems", index, "profileKey"],
          message: "Choose a program profile defined in the Catalog & profiles step.",
        });
      const keys = new Set<string>();
      const codes = new Set<string>();
      system.elements.forEach((element, elementIndex) => {
        if (keys.has(element.key) || codes.has(element.code.toLowerCase()))
          context.addIssue({
            code: "custom",
            path: ["systems", index, "elements", elementIndex],
            message: "Element identifiers and codes must be distinct within a system.",
          });
        keys.add(element.key);
        codes.add(element.code.toLowerCase());
        if (element.library && element.type === "subsystem")
          context.addIssue({
            code: "custom",
            path: ["systems", index, "elements", elementIndex, "type"],
            message:
              "A library-backed element is a component: choose hardware, software, network, service, facility, data or other.",
          });
        if (element.productElementId && !system.product)
          context.addIssue({
            code: "custom",
            path: ["systems", index, "elements", elementIndex, "productElementId"],
            message: "This element comes from a product; choose the product on the system.",
          });
      });
      system.elements.forEach((element, elementIndex) => {
        const path = new Set<string>([element.key]);
        let parent = element.parentKey;
        while (parent) {
          if (path.has(parent) || !keys.has(parent)) {
            context.addIssue({
              code: "custom",
              path: ["systems", index, "elements", elementIndex, "parentKey"],
              message: "Choose a parent in this system without creating a cycle.",
            });
            break;
          }
          path.add(parent);
          parent = system.elements.find((candidate) => candidate.key === parent)?.parentKey ?? null;
        }
      });
    });
  });

/** One confirmed request creates the entire program or leaves every table unchanged. */
export function useCreateProgramWizard() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ProgramWizardResult, Error, ProgramWizardDraft>({
    mutationFn: async (draft) => {
      const parsed = programWizardSchema.safeParse(draft);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the program details.");
      const token = await requireIdentity(workspace);
      const { data, error } = await database()
        .rpc("create_program_wizard", { p_tenant_id: workspace.tenantId, p_draft: parsed.data })
        .setHeader("Authorization", `Bearer ${token}`);
      if (error)
        throw new Error(
          error.code === "23505"
            ? "A program, system, element or authored profile already uses one of these codes. Choose a different code; your draft has been retained."
            : error.message,
        );
      await requireIdentity(workspace);
      return z
        .object({
          programId: uuid,
          systemIds: z.array(uuid),
          profiles: z.array(
            z.object({ key: uuid, profileResolutionId: uuid, tailored: z.boolean() }),
          ),
          elements: z.array(
            z.object({ key: uuid, systemId: uuid, systemComponentId: uuid.nullable() }),
          ),
        })
        .parse(data);
    },
    onSuccess: async () => {
      // Every collection query is keyed [kind, tenant, table…]; this prefix covers the library
      // tables Add from library invalidates as well as the reference and program tables.
      await Promise.all(
        ["models", "model", "records", "record", "reference-options"].map((key) =>
          cache.invalidateQueries({ queryKey: [key, workspace.tenantId] }),
        ),
      );
    },
  });
}
