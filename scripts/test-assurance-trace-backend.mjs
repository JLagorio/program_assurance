/**
 * The assurance chain reads: `assurance_trace` from every kind of record, an assessor's finding
 * among them, the walk that never goes back, a program's posture in assessment objectives with an
 * element's totals, one cell's records, and the tenant boundary. Runs against the local stack in a
 * disposable workspace.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";

const workspace = await localWorkspace("assurance-trace");
const { client, tenantId } = workspace;
let outsider;
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
const trace = (kind, id, programId) =>
  data(
    client.rpc("assurance_trace", {
      p_tenant_id: tenantId,
      p_kind: kind,
      p_id: id,
      ...(programId ? { p_program_id: programId } : {}),
    }),
  );
const ids = (rows) => rows.map((row) => row.id).sort();

try {
  const program = await insert("programs", { code: "TRACE", name: "Trace validation" });
  const other = await insert("programs", { code: "TRACE-OTHER", name: "Another program" });
  const root = await insert("systems", {
    program_id: program.id,
    code: "SYS-ROOT",
    name: "Mission system",
    system_type: "information_system",
  });
  const element = await insert("systems", {
    program_id: program.id,
    code: "SYS-ELEMENT",
    name: "Flight computer",
    system_type: "software",
    parent_system_id: root.id,
    is_authorization_boundary: false,
  });
  // The system works from the smallest published reference baseline, adopted as the system
  // baseline dialog adopts one, so the element inside it holds its controls' objectives.
  const references = await data(
    client
      .from("profile_resolutions")
      .select("id, profile_revision_id")
      .is("tenant_id", null)
      .eq("state", "published")
      .is("base_profile_resolution_id", null),
  );
  const sized = await Promise.all(
    references.map(async (reference) => {
      const { count, error } = await client
        .from("selected_controls")
        .select("control_id", { count: "exact", head: true })
        .eq("profile_resolution_id", reference.id);
      assert.ifError(error);
      return { ...reference, count: count ?? 0 };
    }),
  );
  const baseline = sized
    .filter((reference) => reference.count > 0)
    .sort((a, b) => a.count - b.count || a.id.localeCompare(b.id))[0];
  assert.ok(baseline, "The reference data holds a published baseline (npm run seed:reference)");
  const [imported] = await data(
    client
      .from("profile_imports")
      .select("catalog_revision_id")
      .eq("profile_revision_id", baseline.profile_revision_id)
      .not("catalog_revision_id", "is", null)
      .limit(1),
  );
  const baselineControls = (
    await data(
      client
        .from("selected_controls")
        .select("control_id")
        .eq("profile_resolution_id", baseline.id),
    )
  ).map((row) => row.control_id);
  await data(
    client.rpc("adopt_system_baseline", {
      p_tenant_id: tenantId,
      p_system_id: root.id,
      p_expected_revision: root.revision,
      p_request_id: randomUUID(),
      p_selection: {
        mode: "adopt",
        catalogRevisionId: imported.catalog_revision_id,
        profileResolutionId: baseline.id,
        controlIds: baselineControls,
        rationale: "The chain suite works from a published baseline",
      },
    }),
  );
  // Two controls of that baseline: one the requirements meet, one nothing meets.
  const [control, unmet] = await data(
    client
      .from("controls")
      .select("id, code, group_id")
      .in("id", baselineControls)
      .is("parent_control_id", null)
      .not("group_id", "is", null)
      .order("code")
      .limit(2),
  );
  assert.ok(control && unmet, "The reference baseline holds controls");

  async function requirement(code, programId, controlId, systemId) {
    const record = await insert("engineering_requirements", { program_id: programId, code });
    const revision = await insert("requirement_revisions", {
      engineering_requirement_id: record.id,
      version_number: 1,
      title: `${code} requirement`,
      statement: "The element signs every record.",
      acceptance_criteria: "Every record verifies.",
      requirement_type: "security",
    });
    await insert("requirement_control_links", {
      requirement_revision_id: revision.id,
      control_id: controlId,
      relationship_type: "satisfies",
    });
    if (systemId)
      await insert("requirement_allocations", {
        requirement_revision_id: revision.id,
        system_id: systemId,
      });
    return { record, revision };
  }
  async function evidence(title, programId) {
    const artifact = await insert("evidence_artifacts", {
      title,
      artifact_kind: "document",
      program_id: programId,
    });
    const version = await insert("evidence_versions", {
      artifact_id: artifact.id,
      version_number: 1,
      state: "published",
      external_uri: `https://example.test/evidence/${artifact.id}`,
    });
    return { artifact, version };
  }

  const supported = await requirement("REQ-SIGNED", program.id, control.id, element.id);
  const bare = await requirement("REQ-BARE", program.id, control.id, element.id);
  const elsewhere = await requirement("REQ-ELSEWHERE", other.id, control.id, null);
  const report = await evidence("Signature test report", program.id);
  const log = await evidence("Key rotation log", program.id);
  for (const [revision, version] of [
    [supported.revision, report.version],
    [supported.revision, log.version],
    [elsewhere.revision, log.version],
  ])
    await insert("requirement_evidence", {
      requirement_revision_id: revision.id,
      evidence_version_id: version.id,
    });

  // One issue cites the report directly; a second cites the log through an observation.
  const cited = await insert("operational_issues", {
    program_id: program.id,
    title: "Signatures fail under a rotated key",
    severity: "critical",
    status: "open",
  });
  await insert("issue_evidence", { issue_id: cited.id, evidence_version_id: report.version.id });
  const observed = await insert("operational_issues", {
    program_id: program.id,
    title: "Rotation is not recorded",
    severity: "moderate",
    status: "closed",
  });
  const observation = await insert("observations", {
    program_id: program.id,
    title: "Rotation log has gaps",
    method: "examine",
  });
  await insert("issue_observations", { issue_id: observed.id, observation_id: observation.id });
  await insert("observation_evidence", {
    observation_id: observation.id,
    evidence_version_id: log.version.id,
  });
  const citedObservation = await insert("observations", {
    program_id: program.id,
    title: "Signature check fails",
    method: "test",
  });
  await insert("issue_observations", { issue_id: cited.id, observation_id: citedObservation.id });

  // The risk rests on the cited issue at its latest assessment, and on nothing at its first.
  const risk = await insert("risks", {
    program_id: program.id,
    title: "Records become unverifiable",
  });
  const firstAssessment = await insert("risk_revisions", {
    risk_id: risk.id,
    version_number: 1,
    severity: "low",
  });
  await insert("risk_observations", {
    risk_revision_id: firstAssessment.id,
    observation_id: observation.id,
  });
  const assessment = await insert("risk_revisions", {
    risk_id: risk.id,
    version_number: 2,
    severity: "critical",
    likelihood: "high",
    impact: "very_high",
  });
  await insert("risk_observations", {
    risk_revision_id: assessment.id,
    observation_id: citedObservation.id,
  });

  const plan = await insert("poam_documents", {
    program_id: program.id,
    title: "Remediation plan",
  });
  const item = await insert("poam_items", {
    poam_document_id: plan.id,
    title: "Publish the key history",
  });
  const commitment = await insert("poam_item_revisions", {
    poam_document_id: plan.id,
    poam_item_id: item.id,
    version_number: 1,
    planned_completion_date: "2026-12-29",
  });
  await insert("poam_milestones", {
    poam_item_revision_id: commitment.id,
    title: "Draft the history",
    status: "completed",
    completed_date: "2026-11-01",
    planned_date: "2026-11-01",
    sequence_number: 1,
  });
  await insert("poam_milestones", {
    poam_item_revision_id: commitment.id,
    title: "Publish it",
    status: "planned",
    planned_date: "2026-12-20",
    sequence_number: 2,
  });
  await insert("issue_poams", { issue_id: cited.id, poam_item_id: item.id });

  // From the risk: its issue, that issue's evidence, the requirement it supports, its control,
  // and the remediation. Not the other issue, which cites other evidence.
  const fromRisk = await trace("risk", risk.id);
  assert.deepEqual(ids(fromRisk.risks), [risk.id]);
  assert.deepEqual(ids(fromRisk.issues), [cited.id]);
  assert.deepEqual(ids(fromRisk.evidence), [report.artifact.id]);
  assert.deepEqual(ids(fromRisk.requirements), [supported.record.id]);
  assert.deepEqual(ids(fromRisk.controls), [control.id]);
  assert.deepEqual(ids(fromRisk.remediation), [item.id]);
  assert.deepEqual(ids(fromRisk.elements), [element.id]);
  assert.deepEqual(fromRisk.links.issue_risk, [[cited.id, risk.id]]);
  assert.deepEqual(fromRisk.links.issue_remediation, [[cited.id, item.id]]);
  assert.equal(fromRisk.risks[0].severity, "critical", "a risk is read at its latest assessment");
  assert.equal(fromRisk.requirements[0].title, "REQ-SIGNED requirement");
  assert.equal(fromRisk.requirements[0].evidence_count, 2);
  assert.deepEqual(
    fromRisk.remediation[0].milestones.map((milestone) => milestone.title),
    ["Draft the history", "Publish it"],
  );
  assert.equal(fromRisk.remediation[0].planned_on, "2026-12-29");
  assert.equal(fromRisk.clipped, false);
  console.log(
    "PASS a risk's trace walks to its issue, evidence, requirement, control and remediation",
  );

  // From the control, kept to the program: both requirements, and both issues through their
  // evidence. Without a program, the other program's requirement joins them.
  const fromControl = await trace("control", control.id, program.id);
  assert.deepEqual(ids(fromControl.requirements), ids([supported.record, bare.record]));
  assert.deepEqual(ids(fromControl.evidence), ids([report.artifact, log.artifact]));
  assert.deepEqual(ids(fromControl.issues), ids([cited, observed]));
  assert.deepEqual(ids(fromControl.risks), [risk.id]);
  assert.equal(
    fromControl.requirements.find((row) => row.id === bare.record.id).evidence_count,
    0,
    "a requirement with no evidence says so",
  );
  const everywhere = await trace("control", control.id);
  assert.deepEqual(
    ids(everywhere.requirements),
    ids([supported.record, bare.record, elsewhere.record]),
  );
  // A control nothing meets has an empty trace beyond itself.
  const alone = await trace("control", unmet.id);
  assert.deepEqual(ids(alone.controls), [unmet.id]);
  assert.deepEqual(alone.requirements, []);
  assert.deepEqual(alone.issues, []);
  console.log("PASS a control's trace reads its requirements, in one program or all");

  // From the evidence, the issue, the requirement and the remediation item.
  const fromEvidence = await trace("evidence", log.artifact.id);
  assert.deepEqual(ids(fromEvidence.issues), [observed.id], "cited through an observation");
  assert.deepEqual(ids(fromEvidence.requirements), ids([supported.record, elsewhere.record]));
  assert.deepEqual(fromEvidence.risks, [], "the risk no longer rests on that issue");
  const fromIssue = await trace("issue", cited.id);
  assert.deepEqual(ids(fromIssue.evidence), [report.artifact.id]);
  assert.deepEqual(ids(fromIssue.risks), [risk.id]);
  assert.deepEqual(ids(fromIssue.remediation), [item.id]);
  const fromRequirement = await trace("requirement", supported.record.id);
  assert.deepEqual(ids(fromRequirement.controls), [control.id]);
  assert.deepEqual(ids(fromRequirement.issues), ids([cited, observed]));
  const fromItem = await trace("remediation", item.id);
  assert.deepEqual(ids(fromItem.issues), [cited.id]);
  assert.deepEqual(ids(fromItem.risks), [risk.id]);
  assert.deepEqual(ids(fromItem.controls), [control.id]);
  console.log("PASS evidence, issue, requirement and remediation traces walk outward only");

  // The posture, in assessment objectives: both requirements' mappings name no system, so they
  // stand on the element they are allocated to, under the control's family, and cover every
  // objective the control counts; the element that holds it pools them. REQ-SIGNED cites evidence,
  // so every objective has evidence there. One open issue and one open risk stand there too.
  const posture = await data(
    client.rpc("program_posture", { p_tenant_id: tenantId, p_program_id: program.id }),
  );
  const objectives = (
    await data(
      client.rpc("program_control_objectives", {
        p_program_id: program.id,
        p_control_id: control.id,
      }),
    )
  ).objectives.length;
  assert.ok(objectives > 0, "The control counts assessment objectives");
  assert.ok(
    posture.families.some((family) => family.id === control.group_id),
    "every family of the baseline is a column",
  );
  assert.ok(
    posture.families.every((family) => family.id === control.group_id || family.objectives === 0),
    "a family nothing is mapped in holds no objective",
  );
  const cell = (elementId) =>
    posture.cells.find((row) => row.element_id === elementId && row.family_id === control.group_id);
  for (const holder of [element.id, root.id]) {
    assert.equal(cell(holder).objectives, objectives);
    assert.equal(cell(holder).evidenced, objectives);
    assert.equal(cell(holder).issues, 1, "a closed issue is not counted");
    assert.equal(cell(holder).issue_severity, 4);
    assert.equal(cell(holder).risks, 1);
  }
  const line = (elementId) => posture.elements.find((row) => row.id === elementId);
  assert.equal(line(element.id).objectives, objectives);
  assert.equal(line(root.id).objectives, objectives, "an element counts the elements inside it");
  // The program has no control baseline of its own (only its system adopted one), so the band,
  // which reads the program's control baseline as its control status does, holds no objective.
  assert.deepEqual(posture.totals, {
    requirements: 2,
    unplaced: 0,
    objectives: 0,
    mapped: 0,
    evidenced: 0,
    placed: objectives,
    issues: 1,
    issues_severe: 1,
    issues_placed: 1,
    risks: 1,
    risks_severe: 1,
    risks_placed: 1,
  });
  const inCell = await data(
    client.rpc("program_posture_cell", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_element_id: root.id,
      p_family_id: control.group_id,
    }),
  );
  assert.equal(inCell.objectives, objectives);
  assert.deepEqual(ids(inCell.issues), [cited.id]);
  assert.deepEqual(ids(inCell.risks), [risk.id]);
  // REQ-BARE cites no evidence, but REQ-SIGNED's covers every objective it covers.
  assert.deepEqual(inCell.unevidenced, [], "nothing is left to evidence there");
  assert.deepEqual(ids(inCell.controls), [control.id]);
  assert.equal(inCell.controls[0].objectives, objectives);
  console.log(
    "PASS the posture counts each objective and record once, and an element pools what it holds",
  );

  // An issue names the requirement it is about: the bare requirement, which no evidence supports.
  // The trace reaches the requirement from the issue and the issue from the requirement, and the
  // posture places the issue on it, once, beside the issue its evidence already placed.
  const unmetIssue = await insert("operational_issues", {
    program_id: program.id,
    title: "Unmet requirement REQ-BARE",
    severity: "high",
    status: "open",
  });
  const nameBare = () =>
    data(
      client
        .from("issue_requirements")
        .upsert(
          {
            tenant_id: tenantId,
            program_id: program.id,
            issue_id: unmetIssue.id,
            engineering_requirement_id: bare.record.id,
          },
          { onConflict: "tenant_id,issue_id,engineering_requirement_id", ignoreDuplicates: true },
        )
        .select("id"),
    );
  assert.equal((await nameBare()).length, 1);
  assert.equal((await nameBare()).length, 0, "the same link sent again is passed over");
  const fromUnmet = await trace("issue", unmetIssue.id);
  assert.deepEqual(ids(fromUnmet.requirements), [bare.record.id]);
  assert.deepEqual(ids(fromUnmet.controls), [control.id]);
  assert.deepEqual(ids(fromUnmet.elements), [element.id]);
  assert.deepEqual(fromUnmet.evidence, [], "the requirement's evidence is not walked back to");
  assert.deepEqual(fromUnmet.links.requirement_issue, [[bare.record.id, unmetIssue.id]]);
  const fromBare = await trace("requirement", bare.record.id);
  assert.deepEqual(ids(fromBare.issues), [unmetIssue.id]);
  const withUnmet = await trace("control", control.id, program.id);
  assert.deepEqual(ids(withUnmet.issues), ids([cited, observed, unmetIssue]));
  const named = await data(
    client.rpc("program_posture", { p_tenant_id: tenantId, p_program_id: program.id }),
  );
  assert.equal(named.totals.issues, 2);
  assert.equal(named.totals.issues_placed, 2, "the issue that names a requirement is placed");
  for (const holder of [element.id, root.id]) {
    const at = named.cells.find(
      (row) => row.element_id === holder && row.family_id === control.group_id,
    );
    assert.equal(at.issues, 2, "each issue counts once in a cell");
    assert.equal(at.issue_severity, 4);
  }
  const namedCell = await data(
    client.rpc("program_posture_cell", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_element_id: element.id,
      p_family_id: control.group_id,
    }),
  );
  assert.deepEqual(ids(namedCell.issues), ids([cited, unmetIssue]));
  // An issue of another program cannot name this program's requirement.
  const otherIssue = await insert("operational_issues", {
    program_id: other.id,
    title: "Another program's issue",
    status: "open",
  });
  const crossed = await client.from("issue_requirements").insert({
    tenant_id: tenantId,
    program_id: program.id,
    issue_id: otherIssue.id,
    engineering_requirement_id: bare.record.id,
  });
  assert.equal(crossed.error?.code, "23503", JSON.stringify(crossed));
  console.log(
    "PASS an issue that names a requirement reaches it in the trace both ways and stands on it once in the posture",
  );

  // An assessor's finding on the control: it cites the signature report, rests on an observation
  // an issue rests on too (the issue it became), and raised a risk whose remediation item's
  // commitment cites it. A second finding, satisfied, judges the control's next part; a third, in
  // results still in draft, and a fourth, of another program's campaign, judge the first part.
  const publish = (table, row) =>
    data(
      client
        .from(table)
        .update({
          state: "published",
          published_at: new Date().toISOString(),
          revision: row.revision + 1,
        })
        .eq("id", row.id)
        .select()
        .single(),
    );
  const [resolution] = await data(
    client
      .from("profile_resolutions")
      .select("id")
      .is("tenant_id", null)
      .eq("state", "published")
      .limit(1),
  );
  const parts = await data(
    client
      .from("control_parts")
      .select("id")
      .eq("control_id", control.id)
      .order("ordinal")
      .order("id")
      .limit(2),
  );
  assert.ok(resolution && parts.length === 2, "The reference catalog holds a baseline and parts");
  // The assessment plan stands on a published security plan, which implements a control.
  const draftPlan = await insert("ssp_revisions", {
    system_id: root.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  const [selected] = await data(
    client
      .from("selected_controls")
      .select("id")
      .eq("profile_resolution_id", resolution.id)
      .limit(1),
  );
  await insert("implemented_requirements", {
    ssp_revision_id: draftPlan.id,
    selected_control_id: selected.id,
  });
  const ssp = await publish("ssp_revisions", draftPlan);
  async function results(programId, title, published) {
    const campaign = await insert("assessment_campaigns", { program_id: programId, title });
    const plannedRevision = await publish(
      "assessment_plan_revisions",
      await insert("assessment_plan_revisions", {
        campaign_id: campaign.id,
        ssp_revision_id: ssp.id,
        version_number: 1,
        title: `${title} plan`,
      }),
    );
    const revision = await insert("assessment_results_revisions", {
      assessment_plan_revision_id: plannedRevision.id,
      version_number: 1,
      title: `${title} results`,
    });
    const set = await insert("result_sets", {
      assessment_results_revision_id: revision.id,
      title: `${title} set`,
    });
    return { revision, set, published };
  }
  const judge = (on, part, title, determination) =>
    insert("assessment_findings", {
      assessment_results_revision_id: on.revision.id,
      result_set_id: on.set.id,
      target_control_part_id: part.id,
      title,
      determination,
      determined_at: new Date().toISOString(),
    });
  const assessed = await results(program.id, "Trace assessment", true);
  const finding = await judge(
    assessed,
    parts[0],
    "Rotation is not evidenced",
    "other_than_satisfied",
  );
  const satisfied = await judge(assessed, parts[1], "Records are signed", "satisfied");
  await insert("finding_evidence", {
    finding_id: finding.id,
    evidence_version_id: report.version.id,
    claim: "Examined for this determination.",
  });
  const sharedObservation = await insert("observations", {
    program_id: program.id,
    title: "No rotation record for the signing key",
    method: "examine",
  });
  await insert("finding_observations", {
    finding_id: finding.id,
    observation_id: sharedObservation.id,
    assessment_results_revision_id: assessed.revision.id,
  });
  const became = await insert("operational_issues", {
    program_id: program.id,
    title: "Signing key rotation is unrecorded",
    severity: "high",
    status: "open",
  });
  await insert("issue_observations", {
    issue_id: became.id,
    observation_id: sharedObservation.id,
  });
  const raised = await insert("risks", {
    program_id: program.id,
    title: "Rotations cannot be proven",
  });
  const raisedAssessment = await publish(
    "risk_revisions",
    await insert("risk_revisions", { risk_id: raised.id, version_number: 1, severity: "high" }),
  );
  await insert("finding_risks", {
    finding_id: finding.id,
    risk_revision_id: raisedAssessment.id,
    assessment_results_revision_id: assessed.revision.id,
  });
  await publish("assessment_results_revisions", assessed.revision);
  const answer = await insert("poam_items", {
    poam_document_id: plan.id,
    title: "Record every key rotation",
  });
  const answerCommitment = await insert("poam_item_revisions", {
    poam_document_id: plan.id,
    poam_item_id: answer.id,
    version_number: 1,
    planned_completion_date: "2027-01-15",
  });
  await insert("poam_item_risks", {
    poam_item_revision_id: answerCommitment.id,
    risk_revision_id: raisedAssessment.id,
  });
  const drafted = await results(program.id, "Trace reassessment", false);
  const draftFinding = await judge(
    drafted,
    parts[0],
    "Rotation, judged again",
    "partially_satisfied",
  );
  const elsewhereResults = await results(other.id, "Another program's assessment", true);
  const elsewhereFinding = await judge(
    elsewhereResults,
    parts[0],
    "Another program's verdict",
    "partially_satisfied",
  );
  await publish("assessment_results_revisions", elsewhereResults.revision);

  // From the finding: the control it judges, the evidence it cites, the requirement that evidence
  // supports, the issue it became, the risk it raised and the item whose commitment cites it.
  const fromFinding = await trace("finding", finding.id);
  assert.deepEqual(ids(fromFinding.findings), [finding.id]);
  assert.deepEqual(ids(fromFinding.controls), [control.id]);
  assert.deepEqual(ids(fromFinding.evidence), [report.artifact.id]);
  assert.deepEqual(ids(fromFinding.requirements), [supported.record.id]);
  assert.deepEqual(ids(fromFinding.issues), [became.id]);
  assert.deepEqual(ids(fromFinding.risks), [raised.id]);
  assert.deepEqual(ids(fromFinding.remediation), [answer.id]);
  assert.deepEqual(fromFinding.links.control_finding, [[control.id, finding.id]]);
  assert.deepEqual(fromFinding.links.evidence_finding, [[report.artifact.id, finding.id]]);
  assert.deepEqual(fromFinding.links.finding_issue, [[finding.id, became.id]]);
  assert.deepEqual(fromFinding.links.finding_risk, [[finding.id, raised.id]]);
  assert.deepEqual(fromFinding.links.risk_remediation, [[raised.id, answer.id]]);
  assert.deepEqual(
    {
      determination: fromFinding.findings[0].determination,
      results_state: fromFinding.findings[0].results_state,
      program_id: fromFinding.findings[0].program_id,
    },
    { determination: "other_than_satisfied", results_state: "published", program_id: program.id },
  );
  console.log(
    "PASS a finding's trace walks to its control, evidence, issue, risk and the remediation answering the risk",
  );

  // From the control, kept to the program: the findings on it, short of satisfied first. Not the
  // one in draft results, nor another program's, which a trace without a program reaches.
  const judged = await trace("control", control.id, program.id);
  assert.deepEqual(
    judged.findings.map((row) => row.id),
    [finding.id, satisfied.id],
  );
  for (const [stage, record] of [
    ["issues", became],
    ["risks", raised],
    ["remediation", answer],
  ])
    assert.ok(ids(judged[stage]).includes(record.id), `the control reaches ${record.title}`);
  const judgedEverywhere = await trace("control", control.id);
  assert.deepEqual(ids(judgedEverywhere.findings), ids([finding, satisfied, elsewhereFinding]));
  assert.ok(!ids(judgedEverywhere.findings).includes(draftFinding.id), "a draft decides nothing");
  console.log("PASS a control reaches the published findings on it, in one program or all");

  // From the risk it raised: the finding, its control and evidence, and the item answering the
  // risk; not the issue the finding became, which lies the other way from the finding.
  const fromRaised = await trace("risk", raised.id);
  assert.deepEqual(ids(fromRaised.findings), [finding.id]);
  assert.deepEqual(ids(fromRaised.controls), [control.id]);
  assert.deepEqual(ids(fromRaised.evidence), [report.artifact.id]);
  assert.deepEqual(ids(fromRaised.remediation), [answer.id]);
  assert.deepEqual(fromRaised.issues, [], "the finding's issue is not walked back to");
  // From the item: the risk its commitment cites, and the finding that raised it.
  const fromAnswer = await trace("remediation", answer.id);
  assert.deepEqual(ids(fromAnswer.risks), [raised.id]);
  assert.deepEqual(ids(fromAnswer.findings), [finding.id]);
  assert.deepEqual(ids(fromAnswer.controls), [control.id]);
  // From the issue it became: the finding, and the control and evidence behind it.
  const fromBecame = await trace("issue", became.id);
  assert.deepEqual(ids(fromBecame.findings), [finding.id]);
  assert.deepEqual(ids(fromBecame.controls), [control.id]);
  assert.deepEqual(ids(fromBecame.evidence), [report.artifact.id]);
  assert.deepEqual(fromBecame.risks, [], "the risk the finding raised lies the other way");
  // From the evidence it cites, and from the requirement that evidence supports: the finding.
  const fromReport = await trace("evidence", report.artifact.id);
  assert.deepEqual(ids(fromReport.findings), [finding.id]);
  const fromSupported = await trace("requirement", supported.record.id);
  assert.deepEqual(ids(fromSupported.findings), [finding.id]);
  // A finding of draft results is in its own trace, and says so.
  const fromDraft = await trace("finding", draftFinding.id);
  assert.deepEqual(ids(fromDraft.findings), [draftFinding.id]);
  assert.equal(fromDraft.findings[0].results_state, "draft");
  assert.deepEqual(ids(fromDraft.controls), [control.id]);
  console.log(
    "PASS risks, remediation, issues, evidence and requirements reach a finding outward only",
  );

  // Another workspace reads none of it, and may not ask in this one's name.
  outsider = await localWorkspace("assurance-trace-outsider");
  const refused = await outsider.client.rpc("assurance_trace", {
    p_tenant_id: tenantId,
    p_kind: "risk",
    p_id: risk.id,
  });
  assert.equal(refused.error?.code, "42501", JSON.stringify(refused));
  const blind = await data(
    outsider.client.rpc("assurance_trace", {
      p_tenant_id: outsider.tenantId,
      p_kind: "risk",
      p_id: risk.id,
    }),
  );
  assert.deepEqual(blind.risks, []);
  assert.deepEqual(blind.issues, []);
  const refusedPosture = await outsider.client.rpc("program_posture", {
    p_tenant_id: tenantId,
    p_program_id: program.id,
  });
  assert.equal(refusedPosture.error?.code, "42501", JSON.stringify(refusedPosture));
  const unknown = await client.rpc("assurance_trace", {
    p_tenant_id: tenantId,
    p_kind: "observation",
    p_id: risk.id,
  });
  assert.equal(unknown.error?.code, "22023", JSON.stringify(unknown));
  console.log("PASS another workspace reads nothing, and an unknown focus is refused");
} finally {
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
}
