import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  authorProgramProfile,
  catalogProfileOptions,
  previewProgramTailoring,
  type ProgramTailoringInput,
  type WizardReferenceData,
  type WizardProfileAuthoring,
} from "./program-wizard-reference";

let data: WizardReferenceData;
let input: ProgramTailoringInput;
let authoring: WizardProfileAuthoring;
beforeAll(async () => {
  // The same hash-verified NIST publications used by the local reference loader.
  const loaderUrl = pathToFileURL(resolve("scripts/seed-reference.mjs")).href;
  const { buildReferenceRows } = await import(/* @vite-ignore */ loaderUrl);
  const result = await buildReferenceRows();
  const tables = result.tables as Map<string, Record<string, unknown>[]>;
  const rows = (table: string) => tables.get(table) ?? [];
  const published = (table: string) => rows(table).map((row) => ({ ...row, state: "published" }));
  data = {
    catalogRevisions: published("catalog_revisions"),
    profileRevisions: published("profile_revisions"),
    resolutions: published("profile_resolutions"),
    resolutionInputs: rows("profile_resolution_inputs"),
    selectedControls: rows("selected_controls"),
    profileImports: rows("profile_imports"),
    profileRules: rows("profile_rules"),
    controls: rows("controls"),
    parameters: rows("parameters"),
    parameterValues: rows("parameter_values"),
    parameterChoices: rows("parameter_choices"),
    parameterConstraints: rows("parameter_constraints"),
    parameterGuidelines: rows("parameter_guidelines"),
    profileParameterSettings: [],
    profileParameterValues: [],
  } as unknown as WizardReferenceData;
  const profile = data.profileRevisions.find((row) => row.title.includes("LOW IMPACT"))!;
  const resolution = data.resolutions.find((row) => row.profile_revision_id === profile.id)!;
  input = {
    catalogRevisionId: data.catalogRevisions[0]!.id,
    profileResolutionId: resolution.id,
    tailoring: [],
    parameters: [],
  };
  const catalogDocument = rows("oscal_document_revisions").find(
    (row) => row["id"] === data.catalogRevisions[0]!.document_revision_id,
  )!;
  const baseDocument = rows("oscal_document_revisions").find(
    (row) => row["id"] === profile.document_revision_id,
  )!;
  authoring = {
    uuid: "9f3fcd75-e2f5-4a43-b272-3e93ca0f4f1f",
    title: "Profile authoring verification",
    version: "1",
    lastModified: "2026-09-12T12:00:00Z",
    oscalVersion: "1.2.2",
    catalog: {
      documentRevisionId: String(catalogDocument["id"]),
      sha256: String(catalogDocument["content_sha256"]),
      href: `urn:uuid:${catalogDocument["id"]}`,
      resourceUuid: "b0f08f62-bcad-4215-bfbb-449f27200115",
    },
    baseProfile: {
      documentRevisionId: String(baseDocument["id"]),
      sha256: String(baseDocument["content_sha256"]),
      href: `urn:uuid:${baseDocument["id"]}`,
      resourceUuid: "39953a65-26d8-4df4-94dd-95f559dc5bfa",
    },
  };
});
const control = (source: string) => data.controls.find((row) => row.source_id === source)!;
const parameter = (source: string) => data.parameters.find((row) => row.source_id === source)!;
const tailored = (): ProgramTailoringInput => ({
  ...input,
  tailoring: [
    {
      controlId: control("ac-2").id,
      action: "exclude",
      rationale: "System account management is outside this system boundary.",
    },
    {
      controlId: control("ac-4").id,
      action: "include",
      rationale: "The system has an explicit information-flow requirement.",
    },
  ],
  parameters: [
    {
      parameterId: parameter("ac-1_prm_1").id,
      values: ["Program security officer"],
      rationale: "The security officer owns this policy.",
    },
  ],
});

describe("bounded OSCAL profile authoring", () => {
  it("offers actual pinned NIST profiles and reproduces their recorded control counts", () => {
    const options = catalogProfileOptions(data);
    expect(options.profiles).toHaveLength(4);
    expect(options.profiles.every((row) => row.supported)).toBe(true);
    expect(options.profiles.map((row) => row.controlCount).sort((a, b) => a - b)).toEqual([
      96, 149, 287, 370,
    ]);
    const preview = previewProgramTailoring(input, data);
    expect(preview.errors).toEqual([]);
    expect(preview.counts.selected).toBe(149);
  });

  it("applies explicit changes without mutating references and records exact inclusion pointers", () => {
    const before = JSON.stringify(data);
    const preview = previewProgramTailoring(tailored(), data);
    expect(preview.errors).toEqual([]);
    expect(preview.counts).toMatchObject({ base: 149, added: 1, excluded: 1, selected: 149 });
    expect(preview.selectedControls.some((row) => row.source_id === "ac-2")).toBe(false);
    expect(preview.selectedControls.some((row) => row.source_id === "ac-4")).toBe(true);
    expect(
      preview.parameters.find((row) => row.parameter.source_id === "ac-1_prm_1"),
    ).toMatchObject({ values: ["Program security officer"], origin: "override" });
    expect(preview.provenance.find((row) => row.sourceId === "ac-4")).toMatchObject({
      origin: "include",
      baseSelectedControlId: null,
    });
    expect(JSON.stringify(data)).toBe(before);
  });

  it("produces a document valid against the official NIST OSCAL 1.2.2 schema", async () => {
    const authored = authorProgramProfile(tailored(), data, authoring);
    const bytes = await readFile("scripts/tests/fixtures/oscal-profile-1.2.2.schema.json");
    const source = JSON.parse(
      await readFile("scripts/tests/fixtures/oscal-profile-1.2.2.source.json", "utf8"),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
    const schema = JSON.parse(bytes.toString("utf8"));
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    expect(validate(authored.document), JSON.stringify(validate.errors)).toBe(true);
    const doc = authored.document as {
      profile: {
        imports: {
          "include-controls": { "with-ids": string[] }[];
          "exclude-controls": { "with-ids": string[] }[];
        }[];
      };
    };
    const includeIds = doc.profile.imports[0]!["include-controls"][0]!["with-ids"];
    expect(includeIds).toContain("ac-2");
    expect(doc.profile.imports[0]!["exclude-controls"][0]!["with-ids"]).toEqual(["ac-2"]);
    for (const provenance of authored.provenance) {
      const index = Number(provenance.sourcePointer.split("/").at(-1));
      expect(includeIds[index]).toBe(provenance.sourceId);
    }
    expect(authored.rules.find((row) => row.kind === "exclude")?.rationale).toBe(
      tailored().tailoring[0]!.rationale,
    );
    expect(authored.inputDocumentRevisionIds).toContain(authoring.catalog.documentRevisionId);
    expect(authored.inputDocumentRevisionIds).toContain(authoring.baseProfile.documentRevisionId);
  });

  it("never silently changes catalog, expands child selections, or accepts conflicting decisions", () => {
    expect(
      previewProgramTailoring({ ...input, catalogRevisionId: "another-catalog" }, data).valid,
    ).toBe(false);
    const moderate = data.profileRevisions.find((row) => row.title.includes("MODERATE IMPACT"))!;
    const resolution = data.resolutions.find((row) => row.profile_revision_id === moderate.id)!;
    const result = previewProgramTailoring(
      {
        ...input,
        profileResolutionId: resolution.id,
        tailoring: [
          { controlId: control("ac-2").id, action: "exclude", rationale: "Excluded parent only." },
        ],
      },
      data,
    );
    expect(result.valid).toBe(true);
    expect(
      result.selectedControls.some((row) => row.parent_control_id === control("ac-2").id),
    ).toBe(true);
    expect(result.warnings.some((message) => message.includes("explicitly selected child"))).toBe(
      true,
    );
    expect(
      previewProgramTailoring(
        { ...input, tailoring: [tailored().tailoring[0]!, tailored().tailoring[0]!] },
        data,
      ).errors.some((message) => message.includes("only one")),
    ).toBe(true);
    expect(
      previewProgramTailoring(
        {
          ...input,
          tailoring: [
            { controlId: control("ac-1").id, action: "include", rationale: "Already present" },
          ],
        },
        data,
      ).valid,
    ).toBe(false);
  });

  it("rejects unsupported profile rules and recorded selections that disagree with their source", () => {
    const base = data.resolutions.find((row) => row.id === input.profileResolutionId)!;
    const includeRule = data.profileRules.find(
      (row) => row.profile_revision_id === base.profile_revision_id && row.kind === "include",
    )!;
    const modified = {
      ...data,
      profileRules: data.profileRules.map((row) =>
        row.id === includeRule.id
          ? { ...row, definition: { "with-ids": ["ac-1"], "with-child-controls": "yes" } }
          : row,
      ),
    };
    expect(previewProgramTailoring(input, modified).valid).toBe(false);
    const missing = {
      ...data,
      selectedControls: data.selectedControls.filter(
        (row) =>
          !(
            row.profile_resolution_id === input.profileResolutionId &&
            row.control_id === control("ac-1").id
          ),
      ),
    };
    expect(
      previewProgramTailoring(input, missing).errors.some((message) =>
        message.includes("does not match"),
      ),
    ).toBe(true);
    expect(() => authorProgramProfile(input, missing, authoring)).toThrow();
  });

  it("validates selected parameter scope, cardinality, and literal choices", () => {
    const choice = data.parameters.find(
      (row) =>
        row.has_selection &&
        (row.selection_count ?? "one") === "one" &&
        previewProgramTailoring(input, data).selectedControls.some(
          (selected) => selected.id === row.control_id,
        ) &&
        data.parameterChoices.some(
          (option) => option.parameter_id === row.id && !/\{\{|<[^>]+>/.test(option.value),
        ),
    )!;
    expect(choice).toBeDefined();
    const invalid = previewProgramTailoring(
      {
        ...input,
        parameters: [
          {
            parameterId: choice.id,
            values: ["first invalid value", "second invalid value"],
            rationale: "Test invalid choices",
          },
        ],
      },
      data,
    );
    expect(invalid.errors.some((message) => message.includes("exactly one"))).toBe(true);
    const removed = previewProgramTailoring(
      {
        ...tailored(),
        parameters: [
          {
            parameterId: data.parameters.find((row) => row.control_id === control("ac-2").id)!.id,
            values: ["A value"],
            rationale: "Excluded control parameter",
          },
        ],
      },
      data,
    );
    expect(
      removed.errors.some((message) => message.includes("not owned by a selected control")),
    ).toBe(true);
  });

  it("rejects inherited group or unselected-control settings instead of dropping them", () => {
    const base = data.resolutions.find((row) => row.id === input.profileResolutionId)!;
    const unused = data.parameters.find((row) => row.control_id === control("ac-4").id)!;
    const setting = {
      id: "setting",
      profile_revision_id: base.profile_revision_id,
      parameter_id: unused.id,
      parameter_source_id: unused.source_id,
      label: null,
      usage: null,
      rationale: null,
    };
    const revised: WizardReferenceData = {
      ...data,
      profileParameterSettings: [setting],
      profileParameterValues: [{ setting_id: setting.id, ordinal: 0, value: "Source value" }],
      profileRules: [
        ...data.profileRules,
        {
          id: "parameter-rule",
          profile_revision_id: base.profile_revision_id,
          profile_import_id: null,
          kind: "set-parameter",
          ordinal: 0,
          source_pointer: "/profile/modify/set-parameters/0",
          definition: { "param-id": unused.source_id, values: ["Source value"] },
          rationale: null,
        },
      ],
    };
    expect(
      previewProgramTailoring(input, revised).errors.some((message) =>
        message.includes("scoped outside"),
      ),
    ).toBe(true);
    expect(() => authorProgramProfile(input, revised, authoring)).toThrow();
  });

  it("preserves supported base values until the user explicitly overrides them", () => {
    const base = data.resolutions.find((row) => row.id === input.profileResolutionId)!;
    const selected = parameter("ac-1_prm_1");
    const setting = {
      id: "setting",
      profile_revision_id: base.profile_revision_id,
      parameter_id: selected.id,
      parameter_source_id: selected.source_id,
      label: null,
      usage: null,
      rationale: "Existing policy owner decision.",
    };
    const revised: WizardReferenceData = {
      ...data,
      profileParameterSettings: [setting],
      profileParameterValues: [
        { setting_id: setting.id, ordinal: 0, value: "Existing policy owner" },
      ],
      profileRules: [
        ...data.profileRules,
        {
          id: "parameter-rule",
          profile_revision_id: base.profile_revision_id,
          profile_import_id: null,
          kind: "set-parameter",
          ordinal: 0,
          source_pointer: "/profile/modify/set-parameters/0",
          definition: { "param-id": selected.source_id, values: ["Existing policy owner"] },
          rationale: setting.rationale,
        },
      ],
    };
    const inherited = authorProgramProfile(input, revised, authoring);
    expect(inherited.parameterSettings[0]).toMatchObject({
      sourceId: selected.source_id,
      values: ["Existing policy owner"],
      rationale: setting.rationale,
    });
    const overridden = authorProgramProfile(tailored(), revised, authoring);
    expect(overridden.parameterSettings[0]?.values).toEqual(["Program security officer"]);
  });
});
