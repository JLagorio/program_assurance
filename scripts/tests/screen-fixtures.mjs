/**
 * The records the route sweeps open: two of each record the screen inventory names, in a
 * disposable workspace, plus one recorded control implementation and the next selected control,
 * which has none. The screen-family sweep and the page budgets sweep open the same routes over the
 * same records, so a route's budget is measured on what its family checks.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

/** The id a route's address takes when the inventory names no record for it. */
export const missing = randomUUID();

/** A record's name as its h1 and its browser title say it. */
export function name(row) {
  return row?.name ?? row?.title ?? row?.code;
}

/** The route's address, its parameters filled from the fixtures (else the missing id). */
export function routePath(fixtures, screen, path = screen.path) {
  return path.replace(/\$(\w+)/g, (_, parameter) => {
    if (parameter === "collection") return "parties";
    if (parameter === "programId") return fixtures.programs[0].id;
    return fixtures[screen.model]?.[0]?.id ?? missing;
  });
}

/** Signs the page in as the workspace's account, from My work. */
export async function signIn(page, origin, workspace, expect) {
  await page.goto(`${origin}/work`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
}

/**
 * Seeds the workspace and answers the fixtures by model, the implemented control's record, and
 * the control with no implementation.
 */
export async function seedScreenFixtures(workspace) {
  const fixtures = {};
  async function insert(model, values) {
    const result = await workspace.client
      .from(model)
      .insert({ ...values, tenant_id: workspace.tenantId })
      .select()
      .single();
    assert.ifError(result.error);
    (fixtures[model] ??= []).push(result.data);
    return result.data;
  }
  /** A dependency row that is not the inventory fixture of any route. */
  async function dependency(query) {
    const result = await query;
    assert.ifError(result.error);
    return result.data;
  }
  // An overlay is decided against one published catalog edition of the reference data.
  const edition = await dependency(
    workspace.client
      .from("catalog_revisions")
      .select("id")
      .is("tenant_id", null)
      .eq("state", "published")
      .limit(1)
      .single(),
  );
  for (const label of ["Alpha", "Beta"]) {
    const program = await insert("programs", {
      code: `SCREEN-${label}`,
      name: `${label} assurance program`,
    });
    const system = await insert("systems", {
      program_id: program.id,
      code: `SYS-${label}`,
      name: `${label} system`,
      system_type: "information_system",
    });
    const person = (
      await workspace.client
        .from("parties")
        .select("*")
        .eq("auth_user_id", workspace.userId)
        .single()
    ).data;
    const task = await insert("tasks", {
      program_id: program.id,
      title: `${label} assurance task`,
    });
    await insert("task_assignments", {
      task_id: task.id,
      party_id: person.id,
      assignment_role: "responsible",
    });
    await insert("risks", { program_id: program.id, title: `${label} risk` });
    await insert("assessment_campaigns", { program_id: program.id, title: `${label} campaign` });
    await insert("operational_issues", {
      program_id: program.id,
      title: `${label} operational issue`,
    });
    await insert("workstreams", { program_id: program.id, title: `${label} workstream` });
    const document = await insert("poam_documents", {
      program_id: program.id,
      title: `${label} remediation plan`,
    });
    await insert("poam_items", {
      poam_document_id: document.id,
      title: `${label} remediation item`,
    });
    await insert("authorization_packages", {
      program_id: program.id,
      system_id: system.id,
      title: `${label} authorization package`,
    });
    await insert("parties", { party_type: "organization", name: `${label} supplier` });
    const evidence = await insert("evidence_artifacts", {
      program_id: program.id,
      title: `${label} evidence`,
      artifact_kind: "document",
    });
    // A published version waiting on its reviewer, so the Review queue holds a record to open.
    const evidenceVersion = await insert("evidence_versions", {
      artifact_id: evidence.id,
      version_number: 1,
      state: "published",
      external_uri: `https://example.test/evidence/${label.toLowerCase()}`,
    });
    await insert("evidence_reviews", {
      evidence_version_id: evidenceVersion.id,
      reviewer_party_id: person.id,
      decision: "pending",
    });
    const component = await insert("component_definitions", {
      code: `COMP-${label}`,
      name: `${label} component`,
    });
    const componentVersion = await insert("component_definition_revisions", {
      component_definition_id: component.id,
      version_number: 1,
    });
    // A component of the set's version, which the Components register lists and its record shows.
    await insert("defined_components", {
      component_definition_revision_id: componentVersion.id,
      name: `${label} flight computer`,
      component_type: "hardware",
    });
    const line = await insert("business_lines", { code: `BL-${label}`, name: `${label} line` });
    const product = await insert("products", {
      code: `PROD-${label}`,
      name: `${label} product`,
      business_line_id: line.id,
    });
    await insert("product_revisions", { product_id: product.id, version_number: 1 });
    await insert("requirement_definitions", {
      code: `REQ-${label}`,
      title: `${label} requirement`,
    });
    // An overlay is created through its command: the table takes no direct insert.
    const overlay = await dependency(
      workspace.client.rpc("save_control_overlay", {
        p_tenant_id: workspace.tenantId,
        p_id: randomUUID(),
        p_expected_revision: null,
        p_overlay: {
          code: `OVL-${label}`,
          title: `${label} overlay`,
          description: "",
          catalogRevisionId: edition.id,
        },
      }),
    );
    (fixtures.control_overlays ??= []).push(overlay);
  }
  // A recorded control implementation in the first program, so the program's Controls tab has a
  // name link to follow to its control record.
  const resolution = await dependency(
    workspace.client
      .from("profile_resolutions")
      .select()
      .is("tenant_id", null)
      .eq("state", "published")
      .limit(1)
      .single(),
  );
  const selection = await dependency(
    workspace.client
      .from("selected_controls")
      .select()
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .limit(1)
      .single(),
  );
  const implementedControl = await dependency(
    workspace.client.from("controls").select("code, title").eq("id", selection.control_id).single(),
  );
  const ssp = await dependency(
    workspace.client
      .from("ssp_revisions")
      .insert({
        tenant_id: workspace.tenantId,
        system_id: fixtures.systems[0].id,
        profile_resolution_id: resolution.id,
        version_number: 1,
      })
      .select()
      .single(),
  );
  const implementation = await dependency(
    workspace.client
      .from("implemented_requirements")
      .insert({
        tenant_id: workspace.tenantId,
        ssp_revision_id: ssp.id,
        selected_control_id: selection.id,
        description: "Screen family control narrative.",
      })
      .select()
      .single(),
  );
  // The next selected control has no implementation: it has no page, so its name opens its preview.
  const unimplementedSelection = await dependency(
    workspace.client
      .from("selected_controls")
      .select()
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .range(1, 1)
      .single(),
  );
  const unimplementedControl = await dependency(
    workspace.client
      .from("controls")
      .select("code, title")
      .eq("id", unimplementedSelection.control_id)
      .single(),
  );
  for (const model of ["profiles", "controls"]) {
    const result = await workspace.client.from(model).select("*").limit(2);
    assert.ifError(result.error);
    fixtures[model] = result.data;
  }
  // A control's record is titled by its code and its title together: AC-2 Account Management.
  fixtures.controls = fixtures.controls.map((control) => ({
    ...control,
    name: `${control.code} ${control.title}`,
  }));
  return { fixtures, implementation, implementedControl, unimplementedControl };
}
