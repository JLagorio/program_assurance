/** Minimal real assessment ancestry for citation/review integration tests. */
export async function evidenceAssessmentFixture(client, tenantId, programId) {
  const data = async (query) => {
    const result = await query;
    if (result.error) throw result.error;
    return result.data;
  };
  const insert = (table, value) =>
    data(
      client
        .from(table)
        .insert({ tenant_id: tenantId, ...value })
        .select()
        .single(),
    );
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select("id")
      .is("tenant_id", null)
      .eq("state", "published")
      .limit(1)
      .single(),
  );
  const control = await data(
    client
      .from("selected_controls")
      .select("id,control_id")
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .limit(1)
      .single(),
  );
  const part = await data(
    client
      .from("control_parts")
      .select("id")
      .eq("control_id", control.control_id)
      .limit(1)
      .single(),
  );
  const publish = (table, row) =>
    data(
      client
        .from(table)
        .update({
          state: "published",
          published_at: new Date().toISOString(),
          revision: row.revision + 1,
        })
        .eq("id", row.id),
    );
  const system = await insert("systems", {
    program_id: programId,
    code: "READER-SYS",
    name: "Reader test system",
    system_type: "information_system",
  });
  const ssp = await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: ssp.id,
    selected_control_id: control.id,
    description: "Recovery controls are implemented.",
  });
  await publish("ssp_revisions", ssp);
  const campaign = await insert("assessment_campaigns", {
    program_id: programId,
    title: "Reader assessment",
  });
  const plan = await insert("assessment_plan_revisions", {
    campaign_id: campaign.id,
    ssp_revision_id: ssp.id,
    version_number: 1,
    title: "Reader plan",
  });
  await publish("assessment_plan_revisions", plan);
  const results = await insert("assessment_results_revisions", {
    assessment_plan_revision_id: plan.id,
    version_number: 1,
    title: "Reader results",
  });
  const set = await insert("result_sets", {
    assessment_results_revision_id: results.id,
    title: "Recovery result set",
  });
  return insert("assessment_findings", {
    assessment_results_revision_id: results.id,
    result_set_id: set.id,
    target_control_part_id: part.id,
    title: "Recovery restoration finding",
    determination: "satisfied",
  });
}
