/**
 * The assurance chain reads: `assurance_trace` from every kind of record, the walk that never
 * goes back, a program's posture with an element's totals, one cell's records, and the tenant
 * boundary. Runs against the local stack in a disposable workspace.
 */
import assert from "node:assert/strict";
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
  // Two controls from the reference catalog, which every workspace reads: one the requirements
  // meet, one nothing meets.
  const [control, unmet] = await data(
    client
      .from("controls")
      .select("id, code, group_id")
      .is("parent_control_id", null)
      .not("group_id", "is", null)
      .order("code")
      .limit(2),
  );
  assert.ok(control && unmet, "The reference catalog holds controls");

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

  // The posture: both requirements stand at the element under the control's family, and the
  // element that holds it totals them. One open issue and one open risk stand there too.
  const posture = await data(
    client.rpc("program_posture", { p_tenant_id: tenantId, p_program_id: program.id }),
  );
  assert.deepEqual(
    posture.families.map((family) => family.id),
    [control.group_id],
  );
  const cell = (elementId) =>
    posture.cells.find((row) => row.element_id === elementId && row.family_id === control.group_id);
  for (const holder of [element.id, root.id]) {
    assert.equal(cell(holder).requirements, 2);
    assert.equal(cell(holder).evidenced, 1);
    assert.equal(cell(holder).issues, 1, "a closed issue is not counted");
    assert.equal(cell(holder).issue_severity, 4);
    assert.equal(cell(holder).risks, 1);
  }
  const line = (elementId) => posture.elements.find((row) => row.id === elementId);
  assert.equal(line(element.id).own_requirements, 2);
  assert.equal(line(root.id).own_requirements, 0);
  assert.equal(line(root.id).requirements, 2, "an element counts the elements inside it");
  assert.deepEqual(
    {
      requirements: posture.totals.requirements,
      allocated: posture.totals.allocated,
      evidenced: posture.totals.evidenced,
      issues: posture.totals.issues,
      issues_severe: posture.totals.issues_severe,
      issues_placed: posture.totals.issues_placed,
      risks: posture.totals.risks,
      risks_placed: posture.totals.risks_placed,
    },
    {
      requirements: 2,
      allocated: 2,
      evidenced: 1,
      issues: 1,
      issues_severe: 1,
      issues_placed: 1,
      risks: 1,
      risks_placed: 1,
    },
  );
  const inCell = await data(
    client.rpc("program_posture_cell", {
      p_tenant_id: tenantId,
      p_program_id: program.id,
      p_element_id: root.id,
      p_family_id: control.group_id,
    }),
  );
  assert.equal(inCell.requirements, 2);
  assert.deepEqual(ids(inCell.issues), [cited.id]);
  assert.deepEqual(ids(inCell.risks), [risk.id]);
  assert.deepEqual(ids(inCell.unevidenced), [bare.record.id]);
  assert.deepEqual(ids(inCell.controls), [control.id]);
  console.log("PASS the posture counts each record once, and an element totals what it holds");

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
    p_kind: "finding",
    p_id: risk.id,
  });
  assert.equal(unknown.error?.code, "22023", JSON.stringify(unknown));
  console.log("PASS another workspace reads nothing, and an unknown focus is refused");
} finally {
  if (outsider) await outsider.cleanup();
  await workspace.cleanup();
}
