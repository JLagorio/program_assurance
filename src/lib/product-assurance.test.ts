import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  COMPLIANCE_STATUS_ORDER,
  ELEMENT_CHANGE_NEEDS_REASON,
  IMPORT_NOTHING_TO_ADD,
  PRODUCT_CONTROL_STATUS_ORDER,
  REQUIREMENT_MET_BY_ORDER,
  VARIANT_DELTA_ORDER,
  declareElementChange,
  importCustomerRequirements,
  planDeltaAssessment,
  readProductControlStatus,
  readRequirementSourceCompliance,
  readVariantControlDelta,
  readVariantVersionChanges,
  requirementImportIssues,
  takeProductVersion,
} = await import("./product-assurance");
const { complianceStatuses, productControlStatuses, requirementMetBy, variantDeltas } =
  await import("./status");

type Answer = { data: unknown; error: { message: string } | null };

/** A client whose `rpc` calls are recorded and answer with `answer`. */
function client(answer: Answer) {
  const calls: { name: string; args: Record<string, unknown>; headers: Record<string, string> }[] =
    [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        const call = { name, args, headers: {} as Record<string, string> };
        calls.push(call);
        const builder = {
          setHeader(key: string, value: string) {
            call.headers[key] = value;
            return builder;
          },
          abortSignal: () => builder,
          then: (resolve: (value: Answer) => unknown) => Promise.resolve(answer).then(resolve),
        };
        return builder;
      },
    } as never,
  };
}

const context = { tenantId: "tenant", token: "token" };
const control = {
  id: "c1",
  code: "AC-3",
  title: "Access Enforcement",
  parent_id: null,
  family: "AC",
  family_title: "Access Control",
};
const zeroProduct = {
  not_covered: 0,
  not_assessed: 0,
  other_than_satisfied: 0,
  partially_satisfied: 0,
  satisfied: 0,
};

describe("the words", () => {
  it("are the status map's, in its order", () => {
    expect(PRODUCT_CONTROL_STATUS_ORDER).toEqual(Object.keys(productControlStatuses));
    expect(VARIANT_DELTA_ORDER).toEqual(Object.keys(variantDeltas));
    expect(COMPLIANCE_STATUS_ORDER).toEqual(Object.keys(complianceStatuses));
    expect(REQUIREMENT_MET_BY_ORDER).toEqual(Object.keys(requirementMetBy));
    // The delta runs from what the program owes most to what it owes nothing.
    expect(VARIANT_DELTA_ORDER).toEqual(["program_only", "changed_here", "shared", "inherited"]);
  });
});

describe("what a product gives", () => {
  const data = {
    product_revision_id: "rev",
    assessment: {
      id: "a",
      title: "Product assessment",
      published_at: "2026-09-30T16:00:00+00:00",
      completed_on: "2026-09-30",
      assessor_party_id: null,
      profile_resolution_id: "res",
    },
    configurations: [{ id: "cfg-a", code: "A", name: "Lug & Rail Launch", elements: 19 }],
    core_elements: 17,
    totals: {
      controls: 1,
      satisfied_everywhere: 1,
      differs: 0,
      scopes: { core: { ...zeroProduct, satisfied: 1 }, "cfg-a": { ...zeroProduct, satisfied: 1 } },
    },
    controls: [
      { ...control, core: "satisfied", configurations: { "cfg-a": "satisfied" }, differs: false },
    ],
  };

  it("asks once as the reader and gives each scope its counts", async () => {
    const fake = client({ data, error: null });
    const answer = await readProductControlStatus(fake.client, context, "rev");
    expect(fake.calls).toEqual([
      {
        name: "product_control_status",
        args: { p_tenant_id: "tenant", p_product_revision_id: "rev" },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(answer.total).toBe(1);
    expect(answer.satisfiedEverywhere).toBe(1);
    expect(answer.core).toEqual({ elements: 17, counts: { ...zeroProduct, satisfied: 1 } });
    expect(answer.configurations[0]).toMatchObject({ code: "A", elements: 19 });
    expect(answer.configurations[0]?.counts.satisfied).toBe(1);
    expect(answer.controls[0]).toMatchObject({ code: "AC-3", core: "satisfied", differs: false });
    expect(answer.assessment?.completedOn).toBe("2026-09-30");
  });

  it("reads a version nobody assessed as unassessed, and a scope with no counts as zeros", async () => {
    const fake = client({
      data: { ...data, assessment: null, totals: { ...data.totals, scopes: {} } },
      error: null,
    });
    const answer = await readProductControlStatus(fake.client, context, "rev");
    expect(answer.assessment).toBeNull();
    expect(answer.core.counts).toEqual(zeroProduct);
  });

  it("passes a refusal on and refuses an answer it cannot read", async () => {
    await expect(
      readProductControlStatus(
        client({ data: null, error: { message: "Workspace access is required" } }).client,
        context,
        "rev",
      ),
    ).rejects.toThrow("Workspace access is required");
    await expect(
      readProductControlStatus(
        client({ data: { ...data, controls: [{ ...control, core: "fine" }] }, error: null }).client,
        context,
        "rev",
      ),
    ).rejects.toThrow();
  });
});

describe("what a variant changes", () => {
  const data = {
    system_id: "sys",
    program_id: "prg",
    product: {
      id: "p",
      code: "X800",
      name: "X800 Missile",
      revision_id: "rev",
      version: 1,
      configuration_id: "cfg-a",
      configuration_code: "A",
      configuration: "Lug & Rail Launch",
    },
    assessment: { id: "a", title: "Product assessment", published_at: "2026-09-30T16:00:00+00:00" },
    update_available: { revision_id: "rev2", version: 2 },
    elements: { inherited: 16, modified: 2, removed: 1, added: 1 },
    totals: { controls: 2, inherited: 0, shared: 0, changed_here: 1, program_only: 1 },
    controls: [
      {
        ...control,
        delta: "changed_here",
        product_status: "satisfied",
        changed_elements: [
          {
            product_element_id: "pe",
            system_id: "el",
            code: "GS-OFP",
            name: "Operational Flight Program",
            change: "modified",
            kinds: ["data", "software"],
          },
        ],
      },
      {
        ...control,
        id: "c2",
        code: "PE-3",
        delta: "program_only",
        product_status: null,
        changed_elements: [],
      },
    ],
  };

  it("gives each control its delta, the product's standing and the elements behind a change", async () => {
    const fake = client({ data, error: null });
    const answer = await readVariantControlDelta(fake.client, context, "sys");
    expect(fake.calls[0]).toMatchObject({
      name: "variant_control_delta",
      args: { p_tenant_id: "tenant", p_system_id: "sys" },
    });
    expect(answer?.total).toBe(2);
    expect(answer?.counts).toEqual({ inherited: 0, shared: 0, changed_here: 1, program_only: 1 });
    expect(answer?.elements).toEqual({ inherited: 16, modified: 2, removed: 1, added: 1 });
    expect(answer?.updateAvailable).toEqual({ revisionId: "rev2", version: 2 });
    expect(answer?.controls[0]?.changedElements[0]).toMatchObject({
      systemId: "el",
      change: "modified",
      kinds: ["data", "software"],
    });
    expect(answer?.controls[1]).toMatchObject({ delta: "program_only", productStatus: null });
  });

  it("reads a system that was not created from a product as no delta, not an empty one", async () => {
    const fake = client({ data: { system_id: "sys", product: null }, error: null });
    expect(await readVariantControlDelta(fake.client, context, "sys")).toBeNull();
  });
});

describe("declaring a change", () => {
  const declared = { systemId: "el", revision: 4, kinds: ["software"], changed: true };

  it("sends each kind once with its reason, at the revision the reader saw", async () => {
    const fake = client({ data: declared, error: null });
    const answer = await declareElementChange(fake.client, context, {
      systemId: "el",
      expectedRevision: 3,
      kinds: ["software", "software"],
      rationale: "  Customer data is built in.  ",
    });
    expect(answer).toEqual(declared);
    expect(fake.calls[0]?.args).toEqual({
      p_tenant_id: "tenant",
      p_system_id: "el",
      p_expected_revision: 3,
      p_kinds: ["software"],
      p_rationale: "Customer data is built in.",
    });
  });

  it("asks for a reason before it sends, and withdraws with none", async () => {
    const fake = client({ data: { ...declared, kinds: [] }, error: null });
    await expect(
      declareElementChange(fake.client, context, {
        systemId: "el",
        expectedRevision: 3,
        kinds: ["firmware"],
        rationale: " ",
      }),
    ).rejects.toThrow(ELEMENT_CHANGE_NEEDS_REASON);
    expect(fake.calls).toHaveLength(0);
    await declareElementChange(fake.client, context, {
      systemId: "el",
      expectedRevision: 3,
      kinds: [],
      rationale: null,
    });
    expect(fake.calls[0]?.args).toMatchObject({ p_kinds: [], p_rationale: null });
  });

  it("passes the command's refusal on", async () => {
    const fake = client({
      data: null,
      error: { message: "Record revision conflict; reload before saving" },
    });
    await expect(
      declareElementChange(fake.client, context, {
        systemId: "el",
        expectedRevision: 1,
        kinds: ["hardware"],
        rationale: "Replaced.",
      }),
    ).rejects.toThrow("Record revision conflict; reload before saving");
  });
});

describe("planning a delta assessment", () => {
  it("sends the request's id, which becomes the campaign's, and passes a refusal on", async () => {
    const planned = {
      campaignId: "req",
      created: true,
      planRevisionId: "plan",
      objectives: 230,
      changedHere: 83,
      programOnly: 147,
    };
    const fake = client({ data: planned, error: null });
    expect(
      await planDeltaAssessment(fake.client, context, {
        systemId: "sys",
        requestId: "req",
        title: " ",
      }),
    ).toEqual(planned);
    expect(fake.calls[0]).toMatchObject({
      name: "plan_delta_assessment",
      args: { p_tenant_id: "tenant", p_system_id: "sys", p_request_id: "req", p_title: null },
    });
    const refused = client({
      data: null,
      error: { message: "Publish this system's SSP before planning its delta assessment" },
    });
    await expect(
      planDeltaAssessment(refused.client, context, { systemId: "sys", requestId: "req" }),
    ).rejects.toThrow("Publish this system's SSP before planning its delta assessment");
  });
});

describe("taking a newer product version", () => {
  const answer = {
    system_id: "sys",
    current: false,
    product: { id: "prd", code: "X800", name: "X800 Missile" },
    configuration: { id: "cfg", code: "A", name: "Lug & Rail Launch" },
    from: { revision_id: "v1", version: 1 },
    to: { revision_id: "v2", version: 2 },
    assessment: null,
    elements: [
      {
        code: "PS-HMU",
        name: "Health Monitoring Unit",
        element_type: "hardware",
        change: "added",
        system_id: null,
        system_code: "CA-PS-HMU",
        from_element_id: null,
        to_element_id: "e-hmu",
        parent_code: "PS",
        modified: false,
        pin_changed: false,
        depth: 1,
      },
      {
        code: "GS-OFP",
        name: "Operational Flight Program",
        element_type: "software",
        change: "kept",
        system_id: "s-ofp",
        system_code: "CA-GS-OFP",
        from_element_id: "e1",
        to_element_id: "e2",
        parent_code: "GS",
        modified: true,
        pin_changed: false,
        depth: 0,
      },
    ],
    totals: { kept: 18, added: 1, released: 0, stays_removed: 1, skipped: 0, pin_changed: 0 },
  };

  it("reads what the version would change, element by element", async () => {
    const fake = client({ data: answer, error: null });
    const changes = await readVariantVersionChanges(fake.client, context, "sys", "v2");
    expect(fake.calls[0]).toMatchObject({
      name: "variant_version_changes",
      args: { p_tenant_id: "tenant", p_system_id: "sys", p_product_revision_id: "v2" },
    });
    expect(changes.from).toEqual({ revisionId: "v1", version: 1 });
    expect(changes.to).toEqual({ revisionId: "v2", version: 2 });
    expect(changes.assessment).toBeNull();
    expect(changes.counts).toEqual({
      added: 1,
      released: 0,
      skipped: 0,
      stays_removed: 1,
      kept: 18,
    });
    expect(changes.elements[0]).toEqual({
      code: "PS-HMU",
      name: "Health Monitoring Unit",
      elementType: "hardware",
      change: "added",
      systemId: null,
      systemCode: "CA-PS-HMU",
      parentCode: "PS",
      modified: false,
      pinChanged: false,
    });
    expect(changes.elements[1]).toMatchObject({ change: "kept", modified: true });
  });

  it("names the newer version's product assessment when it has one", async () => {
    const fake = client({
      data: {
        ...answer,
        assessment: { id: "pa", title: "X800 v2 assessment", published_at: "2026-10-01T00:00:00Z" },
      },
      error: null,
    });
    expect((await readVariantVersionChanges(fake.client, context, "sys", "v2")).assessment).toEqual(
      { id: "pa", title: "X800 v2 assessment", publishedAt: "2026-10-01T00:00:00Z" },
    );
  });

  it("takes the version at the revision the reader saw and passes a refusal on", async () => {
    const taken = {
      systemId: "sys",
      revision: 2,
      changed: true,
      version: 2,
      kept: 18,
      added: 1,
      released: 0,
      staysRemoved: 1,
      skipped: 0,
      elements: [{ systemId: "new", code: "CA-PS-HMU", name: "Health Monitoring Unit" }],
    };
    const fake = client({ data: taken, error: null });
    expect(
      await takeProductVersion(fake.client, context, {
        systemId: "sys",
        expectedRevision: 1,
        revisionId: "v2",
        requestId: "req",
      }),
    ).toEqual(taken);
    expect(fake.calls[0]).toMatchObject({
      name: "take_product_version",
      args: {
        p_tenant_id: "tenant",
        p_system_id: "sys",
        p_expected_revision: 1,
        p_product_revision_id: "v2",
        p_request_id: "req",
      },
    });
    const refused = client({
      data: null,
      error: { message: "Record revision conflict; reload before saving" },
    });
    await expect(
      takeProductVersion(refused.client, context, {
        systemId: "sys",
        expectedRevision: 1,
        revisionId: "v2",
        requestId: "req",
      }),
    ).rejects.toThrow("Record revision conflict; reload before saving");
  });
});

describe("a customer's requirements", () => {
  const data = {
    source: {
      id: "src",
      program_id: "prg",
      code: "CUSA-SSRD",
      title: "Customer A System Security Requirements Document",
      issuer_party_id: null,
      document_reference: "CUSA-SSRD-0042",
      version_label: "Rev C",
      received_on: "2026-07-15",
    },
    totals: {
      requirements: 2,
      compliant: 1,
      partially_compliant: 0,
      non_compliant: 0,
      not_applicable: 0,
      unanswered: 1,
      met_by: { product: 1, variant_change: 1, program: 0, unallocated: 0 },
    },
    requirements: [
      {
        id: "r1",
        code: "CUSA-SSRD-3.1.1",
        reference: "3.1.1",
        revision_id: "v1",
        title: "Maintenance access",
        statement: "The missile shall restrict maintenance functions.",
        type: "security",
        status: "compliant",
        verification_method: "similarity",
        compliance_statement: "Met by the product.",
        met_by: "product",
        elements: [
          { system_id: "el", code: "CA-PS-MX", name: "Maintenance Port", standing: "inherited" },
        ],
        controls: 2,
        evidence: 0,
      },
      {
        id: "r2",
        code: "CUSA-SSRD-3.3.3",
        reference: "3.3.3",
        revision_id: "v2",
        title: "Least functionality",
        statement: "The flight program shall include only what the mission needs.",
        type: "security",
        status: null,
        verification_method: null,
        compliance_statement: null,
        met_by: "variant_change",
        elements: [
          {
            system_id: "el2",
            code: "CA-GS-OFP",
            name: "Operational Flight Program",
            standing: "modified",
          },
        ],
        controls: 1,
        evidence: 0,
      },
    ],
  };

  it("reads the document as a matrix and keeps the unanswered apart from the non-compliant", async () => {
    const fake = client({ data, error: null });
    const answer = await readRequirementSourceCompliance(fake.client, context, "src");
    expect(fake.calls[0]).toMatchObject({
      name: "requirement_source_compliance",
      args: { p_tenant_id: "tenant", p_source_id: "src" },
    });
    expect(answer.total).toBe(2);
    expect(answer.unanswered).toBe(1);
    expect(answer.counts.non_compliant).toBe(0);
    expect(answer.metBy).toEqual({ product: 1, variant_change: 1, program: 0, unallocated: 0 });
    expect(answer.source.versionLabel).toBe("Rev C");
    expect(answer.requirements[1]).toMatchObject({ status: null, metBy: "variant_change" });
    expect(answer.requirements[0]?.elements[0]?.standing).toBe("inherited");
  });

  it("says what stops an import before it is sent", () => {
    const source = { code: "CUS", title: "Customer requirements" };
    expect(requirementImportIssues({ source, requirements: [] })).toEqual([IMPORT_NOTHING_TO_ADD]);
    expect(
      requirementImportIssues({
        source: { code: " ", title: "" },
        requirements: [
          { reference: "3.1", statement: "It shall." },
          { reference: "3.1 ", statement: "It shall again." },
          { reference: "", statement: "No paragraph." },
        ],
      }),
    ).toEqual([
      "Give the document a code.",
      "Give the document a title.",
      "One requirement has no reference or no statement.",
      "A reference appears twice: 3.1.",
    ]);
    expect(
      requirementImportIssues({
        source,
        requirements: [{ reference: "3.1", statement: "It shall." }],
      }),
    ).toEqual([]);
  });

  it("imports in one request under the id chosen for it, and sends nothing it would refuse", async () => {
    const imported = {
      sourceId: "src",
      sourceCreated: true,
      created: 1,
      skipped: 0,
      requirementIds: ["r1"],
    };
    const fake = client({ data: imported, error: null });
    const request = {
      programId: "prg",
      requestId: "req",
      source: { code: "CUS", title: "Customer requirements", versionLabel: "Rev C" },
      requirements: [{ reference: "3.1", statement: "It shall." }],
    };
    expect(await importCustomerRequirements(fake.client, context, request)).toEqual(imported);
    expect(fake.calls[0]).toMatchObject({
      name: "import_customer_requirements",
      args: { p_tenant_id: "tenant", p_program_id: "prg", p_request_id: "req" },
    });
    await expect(
      importCustomerRequirements(fake.client, context, { ...request, requirements: [] }),
    ).rejects.toThrow(IMPORT_NOTHING_TO_ADD);
    expect(fake.calls).toHaveLength(1);
  });
});
