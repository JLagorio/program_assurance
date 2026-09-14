import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

export type Impact = "low" | "moderate" | "high";
export type SystemType =
  "information_system" | "industrial_control_system" | "platform" | "service";
export type CompositionNodeType =
  "subsystem" | "hardware" | "software" | "network" | "service" | "facility" | "data" | "other";
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
export type SubsystemWizardDraft = {
  key: string;
  parentKey: string | null;
  code: string;
  name: string;
  description: string;
  type: CompositionNodeType | null;
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
  profileResolutionId: string;
  subsystems: SubsystemWizardDraft[];
  tailoring: TailoringDecision[];
  parameters: ParameterOverride[];
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
  availableProfileResolutionIds: string[];
  systems: SystemWizardDraft[];
};
export type ProgramWizardResult = { programId: string; systemIds: string[] };

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
    availableProfileResolutionIds: z
      .array(uuid)
      .min(1, "Choose at least one published base profile.")
      .max(30),
    systems: z
      .array(
        z
          .object({
            key: uuid,
            code,
            name: text,
            description: z.string().max(10000),
            type: z.enum(
              ["information_system", "industrial_control_system", "platform", "service"],
              { message: "Choose a system type." },
            ),
            ownerPartyId: uuid.nullable(),
            confidentiality: impact,
            integrity: impact,
            availability: impact,
            categorizationRationale: text,
            profileResolutionId: uuid,
            subsystems: z
              .array(
                z
                  .object({
                    key: uuid,
                    parentKey: uuid.nullable(),
                    code,
                    name: text,
                    description: z.string().max(10000),
                    type: z.enum([
                      "subsystem",
                      "hardware",
                      "software",
                      "network",
                      "service",
                      "facility",
                      "data",
                      "other",
                    ]),
                  })
                  .strict(),
              )
              .max(300),
            tailoring: z
              .array(
                z
                  .object({
                    controlId: uuid,
                    action: z.enum(["include", "exclude"]),
                    rationale: text,
                  })
                  .strict(),
              )
              .max(10000),
            parameters: z
              .array(
                z
                  .object({
                    parameterId: uuid,
                    values: z.array(text).min(1).max(100),
                    rationale: text,
                  })
                  .strict(),
              )
              .max(10000),
          })
          .strict(),
      )
      .min(1, "Add at least one system.")
      .max(50),
  })
  .strict()
  .superRefine((draft, context) => {
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn)
      context.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "End date must be on or after the start date.",
      });
    const systemCodes = new Set<string>();
    const systemKeys = new Set<string>();
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
      if (!draft.availableProfileResolutionIds.includes(system.profileResolutionId))
        context.addIssue({
          code: "custom",
          path: ["systems", index, "profileResolutionId"],
          message: "Choose a base profile selected for this program.",
        });
      const keys = new Set<string>();
      const codes = new Set<string>();
      system.subsystems.forEach((node, nodeIndex) => {
        if (keys.has(node.key) || codes.has(node.code.toLowerCase()))
          context.addIssue({
            code: "custom",
            path: ["systems", index, "subsystems", nodeIndex],
            message: "Subsystem identifiers and codes must be distinct.",
          });
        keys.add(node.key);
        codes.add(node.code.toLowerCase());
      });
      system.subsystems.forEach((node, nodeIndex) => {
        const path = new Set<string>([node.key]);
        let parent = node.parentKey;
        while (parent) {
          if (path.has(parent) || !keys.has(parent)) {
            context.addIssue({
              code: "custom",
              path: ["systems", index, "subsystems", nodeIndex, "parentKey"],
              message: "Choose a parent in this system without creating a cycle.",
            });
            break;
          }
          path.add(parent);
          parent =
            system.subsystems.find((candidate) => candidate.key === parent)?.parentKey ?? null;
        }
      });
      for (const field of ["tailoring", "parameters"] as const) {
        const ids = new Set<string>();
        system[field].forEach((item, itemIndex) => {
          const id = "controlId" in item ? item.controlId : item.parameterId;
          if (ids.has(id))
            context.addIssue({
              code: "custom",
              path: ["systems", index, field, itemIndex],
              message: "Record one decision per control or parameter.",
            });
          ids.add(id);
        });
      }
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
            ? "A program, system, or authored profile already uses one of these codes. Choose a different code; your draft has been retained."
            : error.message,
        );
      await requireIdentity(workspace);
      return z.object({ programId: uuid, systemIds: z.array(uuid) }).parse(data);
    },
    onSuccess: async () => {
      await Promise.all(
        ["models", "model", "records", "record", "reference-options"].map((key) =>
          cache.invalidateQueries({ queryKey: [key, workspace.tenantId] }),
        ),
      );
    },
  });
}
