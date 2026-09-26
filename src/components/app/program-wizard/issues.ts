import type { LibraryComponentItem } from "@/lib/library-items";
import { productItemFor, type ProductConfigurationItem } from "@/lib/product-items";
import {
  programWizardSchema,
  type ProgramProfileDraft,
  type ProgramRole,
  type ProgramWizardDraft,
} from "@/lib/program-wizard";
import type {
  ProgramTailoringPreview,
  WizardCatalogOption,
  WizardProfileOption,
} from "@/lib/program-wizard-reference";

/** The steps that hold fields; the review step holds none. */
export type WizardStep = 0 | 1 | 2;

/** Where an issue's field is: the element Sheet, opened on one system or one of its elements. */
export type SheetTarget = { systemKey: string; elementKey: string | null };

/** One problem with the draft, tied to the field that fixes it. */
export type WizardIssue = {
  step: WizardStep;
  /** The field's key: its FieldError reads the message and focus moves to its control. */
  field: string;
  /** What fixes the field, naming it, as its FieldError says. */
  message: string;
  /** The same words after the record they belong to, for the ErrorSummary and the tree row. */
  summary: string;
  /** Set when the field is in the element Sheet. */
  sheet?: SheetTarget | undefined;
  /** Set when the issue has no field of its own (a lineage problem): the tree row to lead to. */
  row?: string | undefined;
};

type SystemField =
  | "name"
  | "code"
  | "description"
  | "type"
  | "ownerPartyId"
  | "confidentiality"
  | "integrity"
  | "availability"
  | "categorizationRationale"
  | "profileKey"
  | "product";
type ElementField = "name" | "code" | "description" | "type" | "rationale" | "lineage";

const systemFields: readonly SystemField[] = [
  "name",
  "code",
  "description",
  "type",
  "ownerPartyId",
  "confidentiality",
  "integrity",
  "availability",
  "categorizationRationale",
  "profileKey",
  "product",
];
const elementFields: readonly ElementField[] = [
  "name",
  "code",
  "description",
  "type",
  "rationale",
  "lineage",
];
const programFields = [
  "name",
  "code",
  "description",
  "sponsor",
  "role:program_manager",
  "role:authorizing_official",
  "role:assessor",
  "startsOn",
  "endsOn",
] as const;

/** A system's or an element's row in the Systems & components tree, where a row issue leads. */
export const wizardRow = (key: string) =>
  document.querySelector<HTMLElement>(`[data-wizard-row="${key}"]`);

/** The field keys, one spelling for the fields, the issues and the controls they focus. */
export const wizardField = {
  role: (role: ProgramRole) => `role:${role}`,
  profile: (baseResolutionId: string) => `profile:${baseResolutionId}`,
  system: (systemKey: string, field: SystemField) => `system:${systemKey}:${field}`,
  element: (systemKey: string, elementKey: string, field: ElementField) =>
    `element:${systemKey}:${elementKey}:${field}`,
};

const systemMessages: Record<SystemField, string> = {
  name: "Enter a system name.",
  code: "Enter a system code.",
  description: "Shorten the function to 10,000 characters.",
  type: "Choose a system type.",
  ownerPartyId: "Choose a system owner from this workspace.",
  confidentiality: "Choose the confidentiality impact.",
  integrity: "Choose the integrity impact.",
  availability: "Choose the availability impact.",
  categorizationRationale: "Explain the categorization.",
  profileKey: "Choose a program profile for this system.",
  product: "Choose the product again: remove this system and create it from the product.",
};
const elementMessages: Record<ElementField, string> = {
  name: "Enter a name for this element.",
  code: "Enter a code for this element.",
  description: "Shorten the function to 10,000 characters.",
  type: "Choose an element type.",
  rationale: "Explain why this library component applies here.",
  lineage: "Remove this element and add it again.",
};

const roleMessages: Record<"program_manager" | "authorizing_official" | "assessor", string> = {
  program_manager: "Choose a program manager from this workspace.",
  authorizing_official: "Choose an authorizing official from this workspace.",
  assessor: "Choose an assessor from this workspace.",
};

type Found = { issue: WizardIssue; rank: number };

/**
 * Every problem with the draft, one per field, in the order the fields appear: the schema's
 * checks with a message that names the field, and the checks against the published records the
 * wizard offers (a catalog, a profile, a library or product version that is no longer published).
 */
export function wizardIssues({
  draft,
  ready,
  catalogs,
  profiles,
  previews,
  libraryItems,
  productItems,
}: {
  draft: ProgramWizardDraft;
  /** The published records have loaded, so they can be checked against. */
  ready: boolean;
  catalogs: readonly WizardCatalogOption[];
  profiles: readonly WizardProfileOption[];
  previews: ReadonlyMap<string, ProgramTailoringPreview>;
  libraryItems: readonly LibraryComponentItem[];
  productItems: readonly ProductConfigurationItem[];
}): WizardIssue[] {
  const found: Found[] = [];
  const profileTitle = (profile: ProgramProfileDraft | undefined) =>
    profiles.find((option) => option.id === profile?.baseResolutionId)?.title ?? "Program profile";
  const profileRank = (baseResolutionId: string | undefined) => {
    const at = profiles.findIndex((option) => option.id === baseResolutionId);
    return 2 + (at < 0 ? profiles.length : at);
  };
  const systemName = (index: number) => draft.systems[index]?.name.trim() || "Unnamed system";
  const elementName = (index: number, elementIndex: number) =>
    draft.systems[index]?.elements[elementIndex]?.name.trim() || "Unnamed element";

  function program(field: (typeof programFields)[number], message: string) {
    found.push({
      issue: { step: 0, field, message, summary: message },
      rank: programFields.indexOf(field),
    });
  }
  function catalogStep(field: string, message: string, rank: number, prefix = "") {
    found.push({ issue: { step: 1, field, message, summary: `${prefix}${message}` }, rank });
  }
  function system(index: number, field: SystemField, message: string) {
    const item = draft.systems[index];
    if (!item) return;
    found.push({
      issue: {
        step: 2,
        field: wizardField.system(item.key, field),
        message,
        summary: `${systemName(index)}: ${message}`,
        sheet: { systemKey: item.key, elementKey: null },
        ...(field === "product" ? { row: item.key } : {}),
      },
      rank: index * 10_000 + systemFields.indexOf(field),
    });
  }
  function element(index: number, elementIndex: number, field: ElementField, message: string) {
    const parent = draft.systems[index];
    const item = parent?.elements[elementIndex];
    if (!parent || !item) return;
    found.push({
      issue: {
        step: 2,
        field: wizardField.element(parent.key, item.key, field),
        message,
        summary: `${systemName(index)} · ${elementName(index, elementIndex)}: ${message}`,
        sheet: { systemKey: parent.key, elementKey: item.key },
        ...(field === "lineage" ? { row: item.key } : {}),
      },
      rank: index * 10_000 + 100 + elementIndex * 10 + elementFields.indexOf(field),
    });
  }

  const parsed = programWizardSchema.safeParse(draft);
  for (const issue of parsed.success ? [] : parsed.error.issues) {
    const [root, a, b, c, d] = issue.path;
    const custom = issue.code === "custom";
    const tooLong = issue.code === "too_big";
    switch (root) {
      case "name":
        program("name", tooLong ? "Shorten the program name." : "Enter a program name.");
        break;
      case "code":
        program("code", tooLong ? "Shorten the program code." : "Enter a program code.");
        break;
      case "description":
        program("description", "Shorten the mission to 10,000 characters.");
        break;
      case "sponsorPartyId":
        program("sponsor", "Choose a sponsor from this workspace.");
        break;
      case "startsOn":
        program("startsOn", "Choose a valid start date.");
        break;
      case "endsOn":
        program(
          "endsOn",
          custom ? "Choose an end date on or after the start date." : "Choose a valid end date.",
        );
        break;
      case "roles": {
        const role = typeof a === "number" ? draft.roles[a]?.role : undefined;
        if (role === "program_manager" || role === "authorizing_official" || role === "assessor")
          program(`role:${role}`, custom ? issue.message : roleMessages[role]);
        break;
      }
      case "catalogRevisionId":
        catalogStep("catalog", "Choose a catalog edition.", 0);
        break;
      case "profiles": {
        if (typeof a !== "number") {
          // The profiles appear once an edition is chosen; until then the edition is the issue.
          if (draft.catalogRevisionId)
            catalogStep("profiles", "Choose at least one base profile.", 1);
          break;
        }
        const profile = draft.profiles[a];
        const message =
          b === "tailoring" && d === "rationale"
            ? "Give a reason for every control decision."
            : b === "parameters" && d === "rationale"
              ? "Give a reason for every parameter override."
              : b === "parameters" && d === "values"
                ? "Enter a value for every parameter override."
                : issue.message;
        catalogStep(
          wizardField.profile(profile?.baseResolutionId ?? String(a)),
          message,
          profileRank(profile?.baseResolutionId),
          `${profileTitle(profile)}: `,
        );
        break;
      }
      case "systems": {
        if (typeof a !== "number") {
          found.push({
            issue: {
              step: 2,
              field: "systems",
              message: "Create at least one system.",
              summary: "Create at least one system.",
            },
            rank: -1,
          });
          break;
        }
        if (b === "elements" && typeof c === "number") {
          const field: ElementField =
            d === "name" || d === "code" || d === "description" || d === "type"
              ? d
              : d === "library"
                ? "rationale"
                : d === undefined
                  ? "code"
                  : "lineage";
          const message =
            d === undefined
              ? "Choose a code no other element in this system uses."
              : custom || (tooLong && field !== "description")
                ? issue.message
                : elementMessages[field];
          element(a, c, field, message);
          break;
        }
        if (typeof b === "string" && (systemFields as readonly string[]).includes(b)) {
          const field = b as SystemField;
          const message =
            custom && field === "code"
              ? "Choose a code no other system uses."
              : custom && field === "profileKey"
                ? "Choose one of the program profiles from the Catalog & profiles step."
                : tooLong && field !== "description"
                  ? issue.message
                  : systemMessages[field];
          system(a, field, message);
        }
        break;
      }
      default:
        break;
    }
  }
  // The schema checks the period only once every other value parses; the step checks it at once.
  if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn)
    program("endsOn", "Choose an end date on or after the start date.");

  if (ready) {
    if (draft.catalogRevisionId && !catalogs.some((item) => item.id === draft.catalogRevisionId))
      catalogStep("catalog", "Choose a catalog edition that is still published.", 0);
    for (const profile of draft.profiles) {
      const option = profiles.find((item) => item.id === profile.baseResolutionId);
      const field = wizardField.profile(profile.baseResolutionId);
      const rank = profileRank(profile.baseResolutionId);
      const prefix = `${profileTitle(profile)}: `;
      if (!option || !option.supported || option.catalogRevisionId !== draft.catalogRevisionId)
        catalogStep(
          field,
          "Clear this profile: it is unavailable or does not fit the chosen catalog.",
          rank,
          prefix,
        );
      for (const message of previews.get(profile.key)?.errors ?? [])
        catalogStep(field, message, rank, prefix);
    }
    draft.systems.forEach((item, index) => {
      const product = productItemFor(item, productItems);
      if (item.product && !product)
        system(
          index,
          "product",
          "Its product version is no longer published: remove the system and create it again.",
        );
      item.elements.forEach((part, elementIndex) => {
        const pinned =
          !!part.library &&
          (libraryItems.some(
            (entry) =>
              entry.id === part.library!.definedComponentId &&
              entry.revisionId === part.library!.revisionId,
          ) ||
            (!!part.productElementId &&
              !!product?.elements.some(
                (row) =>
                  row.id === part.productElementId &&
                  row.library?.revisionId === part.library!.revisionId,
              )));
        if (part.library && !pinned)
          element(
            index,
            elementIndex,
            "lineage",
            "Its library version is no longer published: remove it and add it again.",
          );
        else if (
          part.productElementId &&
          product &&
          !product.elements.some((row) => row.id === part.productElementId)
        )
          element(
            index,
            elementIndex,
            "lineage",
            `It is not an element of ${product.productName} · ${product.configurationName}: remove the system and create it again.`,
          );
      });
    });
  }

  // One issue per field, the first found, in the order the fields appear.
  const seen = new Set<string>();
  return found
    .sort((left, right) => left.issue.step - right.issue.step || left.rank - right.rank)
    .map(({ issue }) => issue)
    .filter((issue) => {
      if (seen.has(issue.field)) return false;
      seen.add(issue.field);
      return true;
    });
}
