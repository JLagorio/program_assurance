import { beforeAll, describe, expect, it } from "vitest";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  catalogProfileOptions,
  overlayDecisions,
  previewProgramTailoring,
  type ProgramTailoringInput,
  type WizardReferenceData,
} from "./program-wizard-reference";

let data: WizardReferenceData;
let input: ProgramTailoringInput;
beforeAll(async () => {
  // The same hash-verified NIST publications used by the local reference loader.
  const loaderUrl = pathToFileURL(resolve("scripts/seed-reference.mjs")).href;
  const { buildReferenceRows } = await import(/* @vite-ignore */ loaderUrl);
  const result = await buildReferenceRows();
  const tables = result.tables as Map<string, Record<string, unknown>[]>;
  const rows = (table: string) => tables.get(table) ?? [];
  const published = (table: string) => rows(table).map((row) => ({ ...row, state: "published" }));
  data = {
    catalogs: rows("catalogs"),
    catalogRevisions: published("catalog_revisions"),
    profiles: rows("profiles"),
    catalogGroups: rows("catalog_groups"),
    profileRevisions: published("profile_revisions"),
    resolutions: published("profile_resolutions").map((row) => ({
      ...row,
      base_profile_resolution_id: null,
    })),
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
    baseResolutionId: resolution.id,
    tailoring: [],
    parameters: [],
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

/** A LOW-based overlay as the database authors it: base imported with include-all, ac-2 out, ac-4 in. */
function withOverlay(source: WizardReferenceData): {
  data: WizardReferenceData;
  resolutionId: string;
  revisionId: string;
} {
  const low = source.profileRevisions.find((row) => row.title.includes("LOW IMPACT"))!;
  const lowResolution = source.resolutions.find((row) => row.profile_revision_id === low.id)!;
  const catalog = source.catalogRevisions[0]!;
  const revisionId = "overlay-revision";
  const resolutionId = "overlay-resolution";
  const documentId = "overlay-document";
  const baseSelected = source.selectedControls.filter(
    (row) => row.profile_resolution_id === lowResolution.id,
  );
  const selected = [
    ...baseSelected
      .filter((row) => row.control_id !== control("ac-2").id)
      .map((row, ordinal) => ({
        id: `overlay-selected-${ordinal}`,
        profile_resolution_id: resolutionId,
        control_id: row.control_id,
        ordinal,
      })),
    {
      id: "overlay-selected-added",
      profile_resolution_id: resolutionId,
      control_id: control("ac-4").id,
      ordinal: baseSelected.length,
    },
  ];
  return {
    resolutionId,
    revisionId,
    data: {
      ...source,
      profileRevisions: [
        ...source.profileRevisions,
        {
          id: revisionId,
          profile_id: "overlay-profile",
          document_revision_id: documentId,
          title: "LOW — TEST overlay",
          version: "1",
          state: "published",
        },
      ],
      resolutions: [
        ...source.resolutions,
        {
          id: resolutionId,
          profile_revision_id: revisionId,
          state: "published",
          input_sha256: "a".repeat(64),
          output_sha256: "b".repeat(64),
          resolver_name: "program-assurance-layered-profile",
          resolver_version: "1",
          base_profile_resolution_id: lowResolution.id,
        },
      ],
      resolutionInputs: [
        ...source.resolutionInputs,
        { profile_resolution_id: resolutionId, document_revision_id: documentId, ordinal: 0 },
        {
          profile_resolution_id: resolutionId,
          document_revision_id: low.document_revision_id,
          ordinal: 1,
        },
        {
          profile_resolution_id: resolutionId,
          document_revision_id: catalog.document_revision_id,
          ordinal: 2,
        },
      ],
      profileImports: [
        ...source.profileImports,
        {
          id: "overlay-import-0",
          profile_revision_id: revisionId,
          catalog_revision_id: null,
          imported_profile_revision_id: low.id,
          ordinal: 0,
          include_all: true,
          href: "#base",
        },
        {
          id: "overlay-import-1",
          profile_revision_id: revisionId,
          catalog_revision_id: catalog.id,
          imported_profile_revision_id: null,
          ordinal: 1,
          include_all: false,
          href: "#catalog",
        },
      ],
      profileRules: [
        ...source.profileRules,
        {
          id: "overlay-exclude",
          profile_revision_id: revisionId,
          profile_import_id: "overlay-import-0",
          kind: "exclude",
          ordinal: 0,
          source_pointer: "/profile/imports/0/exclude-controls/0",
          definition: { "with-child-controls": "no", "with-ids": ["ac-2"] },
          rationale: "Account management is outside the boundary.",
        },
        {
          id: "overlay-include",
          profile_revision_id: revisionId,
          profile_import_id: "overlay-import-1",
          kind: "include",
          ordinal: 0,
          source_pointer: "/profile/imports/1/include-controls/0",
          definition: { "with-child-controls": "no", "with-ids": ["ac-4"] },
          rationale: null,
        },
        {
          id: "overlay-merge",
          profile_revision_id: revisionId,
          profile_import_id: null,
          kind: "merge",
          ordinal: 0,
          source_pointer: "/profile/merge",
          definition: { "as-is": true },
          rationale: null,
        },
      ],
      selectedControls: [...source.selectedControls, ...selected],
    },
  };
}

describe("bounded OSCAL profile inspection and tailoring preview", () => {
  it("offers actual pinned NIST profiles and reproduces their recorded control counts", () => {
    const options = catalogProfileOptions(data);
    expect(options.profiles).toHaveLength(4);
    expect(options.profiles.every((row) => row.supported)).toBe(true);
    expect(options.profiles.every((row) => row.kind === "reference")).toBe(true);
    expect(options.profiles.map((row) => row.controlCount).sort((a, b) => a - b)).toEqual([
      96, 149, 287, 370,
    ]);
    expect(options.catalogs[0]!.controlCount).toBeGreaterThan(1000);
    expect(options.profiles[0]!.catalogControlCount).toBe(options.catalogs[0]!.controlCount);
    const preview = previewProgramTailoring(input, data);
    expect(preview.errors).toEqual([]);
    expect(preview.counts.selected).toBe(149);
    expect(preview.families.reduce((sum, row) => sum + row.effective, 0)).toBe(149);
    expect(preview.families.some((row) => row.sourceId === "ac")).toBe(true);
  });

  it("applies explicit changes without mutating references and records layered pointers", () => {
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
      sourcePointer: "/profile/imports/1/include-controls/0/with-ids/0",
    });
    expect(preview.provenance.find((row) => row.sourceId === "ac-1")).toMatchObject({
      origin: "base",
      sourcePointer: "/profile/imports/0/include-all",
    });
    const ac = preview.families.find((row) => row.sourceId === "ac")!;
    expect(ac.out).toBe(1);
    expect(ac.in).toBe(1);
    expect(JSON.stringify(data)).toBe(before);
  });

  it("accepts an overlay layered on a reference profile as a base and reads its decisions back", () => {
    const overlay = withOverlay(data);
    const options = catalogProfileOptions(overlay.data);
    const option = options.profiles.find((row) => row.id === overlay.resolutionId)!;
    expect(option.supported, option.errors.join(" ")).toBe(true);
    expect(option).toMatchObject({
      kind: "overlay",
      controlCount: 149,
      outCount: 1,
      inCount: 1,
      baseTitle: "NIST SP 800-53 Rev 5 Low baseline",
      catalogRevisionId: data.catalogRevisions[0]!.id,
    });
    expect(option.chain.map((hop) => hop.title)).toEqual([
      "LOW — TEST overlay",
      "NIST SP 800-53 Rev 5 Low baseline",
    ]);
    const decisions = overlayDecisions(overlay.resolutionId, overlay.data)!;
    expect(decisions.baseResolutionId).toBe(input.baseResolutionId);
    expect(decisions.tailoring).toEqual([
      {
        controlId: control("ac-2").id,
        action: "exclude",
        rationale: "Account management is outside the boundary.",
      },
      { controlId: control("ac-4").id, action: "include", rationale: "" },
    ]);
    const layered = previewProgramTailoring(
      {
        ...input,
        baseResolutionId: overlay.resolutionId,
        tailoring: [
          { controlId: control("ac-1").id, action: "exclude", rationale: "Out at the system." },
        ],
      },
      overlay.data,
    );
    expect(layered.errors).toEqual([]);
    expect(layered.counts).toMatchObject({ base: 149, excluded: 1, selected: 148 });
    const drifted = withOverlay(data);
    drifted.data = {
      ...drifted.data,
      selectedControls: drifted.data.selectedControls.filter(
        (row) => row.id !== "overlay-selected-added",
      ),
    };
    const broken = catalogProfileOptions(drifted.data).profiles.find(
      (row) => row.id === drifted.resolutionId,
    )!;
    expect(broken.supported).toBe(false);
    expect(broken.errors.some((message) => message.includes("does not match"))).toBe(true);
    expect(overlayDecisions(input.baseResolutionId, data)).toBeNull();
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
        baseResolutionId: resolution.id,
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
    const base = data.resolutions.find((row) => row.id === input.baseResolutionId)!;
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
            row.profile_resolution_id === input.baseResolutionId &&
            row.control_id === control("ac-1").id
          ),
      ),
    };
    expect(
      previewProgramTailoring(input, missing).errors.some((message) =>
        message.includes("does not match"),
      ),
    ).toBe(true);
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
    const base = data.resolutions.find((row) => row.id === input.baseResolutionId)!;
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
  });

  it("preserves supported base values until the user explicitly overrides them", () => {
    const base = data.resolutions.find((row) => row.id === input.baseResolutionId)!;
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
    const inherited = previewProgramTailoring(input, revised).parameters.find(
      (row) => row.parameter.id === selected.id,
    )!;
    expect(inherited).toMatchObject({
      values: ["Existing policy owner"],
      origin: "profile",
      rationale: setting.rationale,
    });
    const overridden = previewProgramTailoring(tailored(), revised).parameters.find(
      (row) => row.parameter.id === selected.id,
    )!;
    expect(overridden.values).toEqual(["Program security officer"]);
    expect(overridden.origin).toBe("override");
    // Through an overlay, the base's settings are inherited too.
    const overlay = withOverlay(revised);
    const layered = previewProgramTailoring(
      { ...input, baseResolutionId: overlay.resolutionId },
      overlay.data,
    ).parameters.find((row) => row.parameter.id === selected.id)!;
    expect(layered).toMatchObject({ values: ["Existing policy owner"], origin: "profile" });
  });
});
