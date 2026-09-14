import { text, lower } from "./context.mjs";
const enumValue = (value, map) => map[lower(value)] ?? null;
const methods = new Set([
  "examine",
  "interview",
  "test",
  "inspection",
  "analysis",
  "demonstration",
]);
const uri = (value) =>
  typeof value === "string" && /^(?:https?:|urn:|s3:|file:)/i.test(value) ? value : null;
const severity = (value) =>
  ["low", "moderate", "high", "critical"].includes(lower(value)) ? lower(value) : null;
export function mapWorkflow(ctx) {
  const s = ctx.source,
    m = ctx.maps;
  const nodeSource = new Map(s.compositionNodes.map((node) => [node.id, node]));
  const events = new Map(s.events.map((event) => [event.id, event]));
  const campaigns = new Map(s.campaigns.map((campaign) => [campaign.id, campaign]));
  const objectives = new Map(s.objectives.map((objective) => [objective.id, objective]));
  const procedures = new Map(s.procedures.map((procedure) => [procedure.id, procedure]));
  const originalEvidence = new Map(s.platform.evidence.map((evidence) => [evidence.id, evidence]));
  const evidencePublished = new Set();
  const programForNodes = (nodes) => {
    const programs = [
      ...new Set((nodes ?? []).map((id) => nodeSource.get(id)?.program).filter(Boolean)),
    ];
    return programs.length === 1 ? programs[0] : null;
  };
  const procedureProgram = (procedure) =>
    campaigns.get(events.get(objectives.get(procedure.objective)?.event)?.campaign)?.program ??
    programForNodes(procedure.nodes);
  const report = (pointer, code, message) => ctx.report(pointer, code, message);
  for (const [list, field, known] of [
    ["workstreams", "status", ["Planned", "Active", "Blocked", "Done"]],
    [
      "poamItems",
      "status",
      ["Open", "Ongoing", "Overdue", "Completed", "Risk accepted", "Deferred", "Cancelled"],
    ],
    ["programPoams", "status", ["Open", "Ongoing", "Deferred", "Completed"]],
    ["programMilestones", "status", ["Complete", "Planned", "In progress", "At risk", "Blocked"]],
    ["tasks", "state", ["Open", "Waiting", "Blocked", "Done"]],
  ])
    for (const [i, row] of (s[list] ?? []).entries())
      if (!known.includes(row[field]))
        throw new Error(
          `Unsupported explicit source state ${list}[${i}].${field}: ${row[field]}; define a truthful mapping before importing.`,
        );

  const sourceProgram = (record) => record.program ?? nodeSource.get(record.node)?.program ?? null;

  for (const [i, e] of s.evidence.entries()) {
    const p = `/evidence/${i}`,
      raw = originalEvidence.get(e.id);
    const external = uri(e.referenceUri ?? raw?.uri);
    const artifact = ctx.add("evidence_artifacts", e.id, p, {
      title: e.label,
      description: text(e.provenance ?? raw?.description),
      artifact_kind:
        enumValue(e.kind, {
          document: "document",
          "test result": "test_record",
          configuration: "dataset",
          "scan output": "scan",
        }) ?? "other",
      program_id: m.program.get(e.program) ?? null,
      scope_id: e.scopeIds?.length === 1 ? (m.scope.get(e.scopeIds[0]) ?? null) : null,
      owner_party_id: ctx.party(e.owner, `${p}/owner`),
      source_uri: external,
    });
    const version = ctx.add("evidence_versions", `${e.id}:1`, p, {
      artifact_id: artifact,
      version_number: 1,
      state: external ? "published" : "draft",
      published_at: external ? ctx.importedAt : null,
      published_by_party_id: null,
      description: text(e.provenance ?? raw?.description),
      external_uri: external,
      sha256: /^[a-f0-9]{64}$/i.test(e.sha256 ?? raw?.sha256 ?? "")
        ? (e.sha256 ?? raw.sha256)
        : null,
      collected_at: ctx.timestamp(raw?.collected_at ?? e.collected, `${p}/collected`),
      expires_at: ctx.timestamp(e.validThrough ?? raw?.valid_through, `${p}/validThrough`),
      provenance: `Original prototype demo metadata. ${external ? "This immutable local metadata snapshot was published at import time; publication is not a reviewer approval." : "The source provides no artifact URI or file; this local version remains draft."} Source hashes are retained claims; no bytes were imported or verified. ${text(e.provenance) ?? ""}`,
    });
    m.evidence.set(e.id, { artifact, version });
    if (external) evidencePublished.add(e.id);
    report(
      p,
      "evidence_bytes_unavailable",
      `${e.id}: metadata restored; archived fixture supplies no verified file bytes${external ? `; external source ${external} retained` : " or artifact URI"}.`,
    );
    for (const link of e.links ?? [])
      if (link.kind === "requirement" && m.requirement.has(link.id)) {
        if (evidencePublished.has(e.id))
          ctx.add("requirement_evidence", `${link.id}/${e.id}`, p, {
            requirement_revision_id: m.requirement.get(link.id),
            evidence_version_id: version,
          });
        else
          report(
            p,
            "citation_requires_source",
            `${e.id} → ${link.id}: citation withheld because the evidence has no publishable source URI.`,
          );
      }
  }
  const evidenceLink = (table, key, pointer, target, ids) => {
    for (const evidenceId of new Set((ids ?? []).filter(Boolean))) {
      const ev = m.evidence.get(evidenceId);
      if (ev && evidencePublished.has(evidenceId))
        ctx.add(table, `${key}/${evidenceId}`, pointer, {
          ...target,
          evidence_version_id: ev.version,
        });
      else
        report(
          pointer,
          "unavailable_evidence_citation",
          `${evidenceId}: no published metadata version with an actual source URI; citation preserved only in source provenance.`,
        );
    }
  };

  for (const [i, c] of s.campaigns.entries()) {
    const p = `/campaigns/${i}`,
      raw = c.sourceRecord?.data;
    const status = enumValue(raw?.status ?? c.state, {
      planned: "planned",
      planning: "planned",
      executing: "active",
      reporting: "active",
      "in-progress": "active",
      completed: "completed",
      closed: "completed",
      cancelled: "cancelled",
    });
    m.campaign.set(
      c.id,
      ctx.add("assessment_campaigns", c.id, p, {
        title: c.name,
        description: text(raw?.description ?? c.scope),
        program_id: m.program.get(c.program),
        scope_id: m.scope.get(c.scope) ?? null,
        owner_party_id: ctx.party(c.lead, `${p}/lead`),
        status: status ?? "planned",
        starts_at: ctx.timestamp(raw?.planned_start ?? c.opened, `${p}/opened`),
        ends_at: ctx.timestamp(raw?.planned_end ?? c.target, `${p}/target`),
      }),
    );
    report(
      p,
      "missing_assessment_snapshot",
      `${c.id}: campaign restored; no exact published source SSP/plan revision is supplied, so a formal assessment plan/results chain was not fabricated.`,
    );
  }
  for (const [i, e] of s.events.entries())
    report(
      `/events/${i}`,
      "missing_plan_pin",
      `${e.id}: event source is retained, but its required exact published assessment plan/SSP pin is absent.`,
    );
  for (const [i, o] of s.objectives.entries())
    report(
      `/objectives/${i}`,
      "missing_plan_pin",
      `${o.id}: objective retained in source; no exact source plan pin exists. Its procedure and actual observed determinations are restored separately when provided.`,
    );

  for (const [i, p] of s.procedures.entries()) {
    const path = `/procedures/${i}`,
      method = lower(p.assessmentMethod ?? p.method),
      program = procedureProgram(p);
    if (!methods.has(method)) {
      report(path, "unsupported_method", `${p.id}: no supported explicit assessment method.`);
      continue;
    }
    const id = ctx.add("procedures", p.id, path, {
      title: p.title,
      description: text(objectives.get(p.objective)?.statement),
      program_id: m.program.get(program) ?? null,
      owner_party_id: ctx.party(p.author, `${path}/author`),
    });
    const revision = ctx.add("procedure_revisions", `${p.id}:1`, path, {
      procedure_id: id,
      version_number: 1,
      title: p.title,
      method,
      description: text(objectives.get(p.objective)?.statement),
      preconditions: text(p.preconditions?.join("\n")),
      acceptance_criterion: text(
        p.steps
          ?.map((step) => step.expected)
          .filter(Boolean)
          .join("\n"),
      ),
    });
    m.procedure.set(p.id, revision);
    for (const [j, step] of (p.steps ?? []).entries())
      if (text(step.action))
        ctx.add("procedure_steps", step.id ?? `${p.id}/${j}`, `${path}/steps/${j}`, {
          procedure_revision_id: revision,
          sequence_number: step.n ?? j + 1,
          instruction: step.action,
          expected_result: text(step.expected),
        });
    const objective = objectives.get(p.objective),
      requirement = objective?.requirementId ?? objective?.requirement;
    if (m.requirement.has(requirement))
      ctx.add("requirement_verifications", `${requirement}/${p.id}`, path, {
        requirement_revision_id: m.requirement.get(requirement),
        procedure_revision_id: revision,
      });
  }

  for (const [i, run] of s.runs.entries()) {
    const path = `/runs/${i}`,
      procedure = procedures.get(run.procedure),
      method = lower(
        procedure?.assessmentMethod ?? procedure?.method ?? run.sourceRecord?.data?.method,
      );
    const program =
      campaigns.get(events.get(run.event)?.campaign)?.program ?? procedureProgram(procedure ?? {});
    report(
      path,
      "missing_execution_pin",
      `${run.id}: source execution is not imported as test_runs because a known published configuration baseline and exact published procedure revision are absent. Recorded observations are retained without claiming these missing pins.`,
    );
    for (const [j, record] of (run.records ?? []).entries()) {
      if (!text(record.observed) || !methods.has(method)) continue;
      const key = `${run.id}/${record.step ?? j}`,
        pointer = `${path}/records/${j}`;
      const observed = ctx.add("observations", key, pointer, {
        program_id: m.program.get(program) ?? null,
        title: `${run.id} — ${record.step ?? `observation ${j + 1}`} (${record.result})`,
        description: record.observed,
        method,
        observed_at: ctx.timestamp(record.at, `${pointer}/at`),
        observer_party_id: ctx.party(run.operator, `${path}/operator`),
      });
      m.observation.set(key, observed);
      evidenceLink(
        "observation_evidence",
        key,
        pointer,
        { observation_id: observed },
        record.evidence,
      );
    }
  }

  for (const [i, f] of s.findings.entries()) {
    const path = `/findings/${i}`,
      program = sourceProgram(f);
    if (!m.program.has(program)) {
      report(path, "missing_program", `${f.id}: finding has no resolvable program.`);
      continue;
    }
    const status =
      enumValue(f.lifecycle, {
        open: "open",
        triaged: "triaged",
        remediating: "in_progress",
        "retest pending": "in_progress",
        closed: "closed",
        "false positive": "closed",
        "risk accepted": "triaged",
      }) ?? "open";
    const issue = ctx.add("operational_issues", f.id, path, {
      program_id: m.program.get(program),
      scope_id: m.scope.get(f.scope) ?? null,
      title: f.title,
      description: text(f.detail),
      owner_party_id: ctx.party(f.owner, `${path}/owner`),
      status,
      severity: severity(f.mitigatedSeverity ?? f.sourceSeverity ?? f.rawSeverity),
      opened_at: ctx.timestamp(f.firstSeen, `${path}/firstSeen`),
    });
    m.issue.set(f.id, issue);
    report(
      path,
      "finding_imported_as_issue",
      `${f.id}: restored as an operational issue; the source does not pin one formal assessment-results revision and one exact control-part target.`,
    );
    const assessment = f.assessment,
      method = lower(assessment?.method);
    if (text(assessment?.determination) && methods.has(method)) {
      const observed = ctx.add("observations", `${f.id}/assessment`, `${path}/assessment`, {
        program_id: m.program.get(program),
        title: f.title,
        description: assessment.determination,
        method,
        observed_at: ctx.timestamp(assessment.assessedOn, `${path}/assessment/assessedOn`),
        observer_party_id: ctx.party(assessment.assessedBy, `${path}/assessment/assessedBy`),
      });
      m.observation.set(f.id, observed);
      ctx.add("issue_observations", `${f.id}/assessment`, path, {
        issue_id: issue,
        observation_id: observed,
      });
      evidenceLink(
        "observation_evidence",
        `${f.id}/assessment`,
        path,
        { observation_id: observed },
        assessment.evidence,
      );
    }
    evidenceLink("issue_evidence", f.id, path, { issue_id: issue }, [f.sourceArtifact]);
  }

  const linkedPortfolioRisks = s.risks.flatMap((risk, i) => {
    const programs = [
      ...new Set(
        s.poamItems
          .filter((item) => item.risk === risk.id || item.riskIds?.includes(risk.id))
          .map((item) => item.program),
      ),
    ];
    return programs.length === 1
      ? [
          {
            record: {
              ...risk,
              program: programs[0],
              statement: risk.summary,
              disposition: risk.status,
            },
            path: `/risks/${i}`,
          },
        ]
      : [];
  });
  for (const { record: r, path: p } of [
    ...s.registerRisks.map((record, i) => ({ record, path: `/registerRisks/${i}` })),
    ...linkedPortfolioRisks,
  ]) {
    if (!m.program.has(r.program)) {
      report(p, "missing_program", `${r.id}: no resolvable program.`);
      continue;
    }
    const owner = ctx.party(r.owner, `${p}/owner`),
      risk = ctx.add("risks", r.id, p, {
        program_id: m.program.get(r.program),
        title: r.title,
        owner_party_id: owner,
        status:
          enumValue(r.sourceStatus ?? r.disposition, {
            open: "open",
            closed: "closed",
            accepted: "accepted",
            "pending ao": "open",
          }) ?? "open",
      });
    const rating = r.sourceRating ?? {},
      allowed = (value) =>
        ["very_low", "low", "moderate", "high", "very_high"].includes(value) ? value : null;
    const revision = ctx.add("risk_revisions", `${r.id}:1`, p, {
      risk_id: risk,
      version_number: 1,
      description: text(r.statement),
      likelihood: allowed(rating.likelihood),
      impact: allowed(rating.impact),
      severity: severity(rating.overall),
      assessment_rationale: text(r.aoNote),
      assessed_at: ctx.timestamp(r.reviewed, `${p}/reviewed`),
    });
    m.risk.set(r.id, { risk, revision });
    if (!r.sourceRating && (r.likelihood != null || r.impact != null))
      report(
        p,
        "rating_scale_not_mapped",
        `${r.id}: numeric prototype scores retained in provenance; no categorical scale was invented.`,
      );
    const response = enumValue(r.treatment, {
      mitigate: "mitigate",
      accept: "accept",
      transfer: "transfer",
      avoid: "avoid",
    });
    if (response)
      ctx.add("risk_responses", `${r.id}/response`, p, {
        risk_revision_id: revision,
        response_type: response,
        owner_party_id: owner,
        description: text(r.aoNote),
      });
    for (const f of s.findings.filter((f) => f.risk === r.id || r.findingIds?.includes(f.id)))
      if (m.observation.has(f.id))
        ctx.add("risk_observations", `${r.id}/${f.id}`, p, {
          risk_revision_id: revision,
          observation_id: m.observation.get(f.id),
        });
  }
  for (const [i, r] of s.risks.entries())
    if (!m.risk.has(r.id))
      report(
        `/risks/${i}`,
        "missing_program",
        `${r.id}: portfolio sample risk has no program identity and cannot be assigned to a guessed program.`,
      );

  const documents = new Map();
  const poamDocument = (program, pointer) => {
    if (!documents.has(program)) {
      const title = `${s.programs.find((p) => p.id === program)?.name ?? program} — POA&M`;
      const document = ctx.add("poam_documents", program, pointer, {
        program_id: m.program.get(program),
        title,
      });
      ctx.add("poam_revisions", `${program}:1`, pointer, {
        poam_document_id: document,
        version_number: 1,
        description:
          "Local draft grouping of the original program's POA&M items. Source publication/approval history is retained in provenance and not inferred.",
      });
      documents.set(program, document);
    }
    return documents.get(program);
  };
  const allPoams = [
    ...s.poamItems.map((p, i) => {
      const original = s.programPoams.find(
        (item) => item.programId === p.program && item.poamId === p.id,
      );
      if (original && original.status !== p.status)
        report(
          `/poamItems/${i}`,
          "projection_status_coarsened",
          `${p.program}/${p.id}: retained original POA&M status '${original.status}' instead of the register projection's coarser '${p.status}'. Both source records are archived.`,
        );
      return {
        record: { ...original, ...p, status: original?.status ?? p.status },
        path: `/poamItems/${i}`,
        key: `${p.program}/${p.id}`,
      };
    }),
    ...s.programPoams.flatMap((p, i) => {
      if (s.poamItems.some((item) => item.program === p.programId && item.id === p.poamId)) {
        report(
          `/programPoams/${i}`,
          "duplicate_source_projection",
          `${p.programId}/${p.poamId}: combined with the same POA&M item from the program register; original source retained here.`,
        );
        return [];
      }
      return [
        {
          record: {
            ...p,
            program: p.programId,
            owner: p.pointOfContact,
            remediation: p.description,
            scheduledCompletion: p.scheduledCompletion,
          },
          path: `/programPoams/${i}`,
          key: `${p.programId}/${p.poamId}`,
        },
      ];
    }),
  ];
  for (const { record: p, path, key } of allPoams) {
    if (!m.program.has(p.program)) {
      report(path, "missing_program", `${key}: no resolvable program.`);
      continue;
    }
    const document = poamDocument(p.program, path),
      owner = ctx.party(p.owner, `${path}/owner`);
    const status =
      enumValue(p.status, {
        ongoing: "in_progress",
        overdue: "overdue",
        deferred: "deferred",
        open: "open",
        completed: "completed",
        "risk accepted": "risk_accepted",
        cancelled: "cancelled",
      }) ?? "open";
    const item = ctx.add("poam_items", key, path, {
      poam_document_id: document,
      title: p.title,
      owner_party_id: owner,
      status,
    });
    const revision = ctx.add("poam_item_revisions", `${key}:1`, path, {
      poam_document_id: document,
      poam_item_id: item,
      version_number: 1,
      description: text(p.description ?? p.remarks),
      remediation_plan: text(p.remediation),
      resources: text(p.resources),
      planned_completion_date: ctx.date(p.scheduledCompletion, `${path}/scheduledCompletion`),
    });
    m.poam.set(p.id ?? key, { item, revision });
    for (const [j, milestone] of (p.milestones ?? []).entries()) {
      const completed = ctx.date(milestone.completedDate, `${path}/milestones/${j}/completedDate`),
        milestoneStatus =
          enumValue(milestone.status, {
            planned: "planned",
            "in-progress": "in_progress",
            "in progress": "in_progress",
            ongoing: "in_progress",
            completed: "completed",
            cancelled: "cancelled",
          }) ?? "planned";
      if (milestoneStatus === "completed" && !completed) {
        report(
          `${path}/milestones/${j}`,
          "missing_completion_date",
          `${milestone.id}: completed milestone lacks its required completion date; source retained.`,
        );
        continue;
      }
      ctx.add("poam_milestones", `${key}/${milestone.id ?? j}`, `${path}/milestones/${j}`, {
        poam_item_revision_id: revision,
        title: milestone.title,
        description: text(milestone.description),
        sequence_number: j + 1,
        planned_date: ctx.date(milestone.targetDate, `${path}/milestones/${j}/targetDate`),
        completed_date: completed,
        status: milestoneStatus,
      });
    }
    const sourcePoamId = text(p.id ?? p.poamId);
    const related = s.findings.filter(
      (f) =>
        sourceProgram(f) === p.program &&
        ((sourcePoamId !== null && f.poam === sourcePoamId) || p.findingIds?.includes(f.id)),
    );
    for (const f of related) {
      if (m.issue.has(f.id))
        ctx.add("issue_poams", `${f.id}/${key}`, path, {
          issue_id: m.issue.get(f.id),
          poam_item_id: item,
        });
      if (m.observation.has(f.id))
        ctx.add("poam_item_observations", `${key}/${f.id}`, path, {
          poam_item_revision_id: revision,
          observation_id: m.observation.get(f.id),
        });
    }
    for (const riskId of new Set([p.risk, ...(p.riskIds ?? [])].filter(Boolean)))
      if (m.risk.has(riskId))
        report(
          path,
          "risk_pin_not_published",
          `${key} → ${riskId}: exact source risk publication not supplied. Both draft records and their shared observed issue chain are retained; no published risk revision was invented.`,
        );
    for (const [j, observation] of (p.relatedObservations ?? []).entries()) {
      const method = lower(observation.method);
      if (!methods.has(method)) continue;
      const observationId = ctx.add(
        "observations",
        `${key}/${observation.observationUuid ?? j}`,
        `${path}/relatedObservations/${j}`,
        {
          program_id: m.program.get(p.program),
          title: observation.title,
          method,
          observed_at: ctx.timestamp(
            observation.collected,
            `${path}/relatedObservations/${j}/collected`,
          ),
        },
      );
      ctx.add("poam_item_observations", `${key}/source-observation/${j}`, path, {
        poam_item_revision_id: revision,
        observation_id: observationId,
      });
    }
  }

  for (const [i, w] of s.workstreams.entries()) {
    const p = `/workstreams/${i}`;
    m.workstream.set(
      w.id,
      ctx.add("workstreams", w.id, p, {
        program_id: m.program.get(w.program),
        title: w.title,
        description: [text(w.objective), text(w.note)].filter(Boolean).join("\n\n") || null,
        owner_party_id: ctx.party(w.lead, `${p}/lead`),
        status:
          enumValue(w.status, {
            planned: "planned",
            active: "active",
            blocked: "blocked",
            done: "completed",
            cancelled: "cancelled",
          }) ?? "planned",
        ends_on: ctx.date(w.due, `${p}/due`),
      }),
    );
    report(
      p,
      "workstream_detail_unmodeled",
      `${w.id}: prototype discipline staffing percentages, dependency edges, stage, and blocked detail are retained in provenance; the current workstream schema has no fields or typed relations for them.`,
    );
  }
  for (const [i, t] of s.tasks.entries()) {
    const p = `/tasks/${i}`,
      status =
        enumValue(t.state, {
          open: "open",
          waiting: "waiting",
          blocked: "blocked",
          done: "done",
          cancelled: "cancelled",
          "in progress": "in_progress",
        }) ?? "open",
      completed = ctx.timestamp(t.doneAt, `${p}/doneAt`);
    if (status === "done" && !completed) {
      report(p, "missing_completion_time", `${t.id}: completed task has no completion timestamp.`);
      continue;
    }
    const task = ctx.add("tasks", t.id, p, {
      program_id: m.program.get(t.program),
      title: t.title,
      description: text(t.note),
      status,
      completed_at: completed,
      due_at: ctx.timestamp(t.due, `${p}/due`),
      created_at: ctx.timestamp(t.createdAt, `${p}/createdAt`) ?? ctx.importedAt,
    });
    m.task.set(t.id, task);
    const assigned = ctx.party(t.assignee, `${p}/assignee`);
    if (assigned)
      ctx.add("task_assignments", `${t.id}/assignee`, p, {
        task_id: task,
        party_id: assigned,
        assignment_role: "responsible",
      });
    const subject = t.subject;
    if (subject?.kind === "requirement" && m.requirement.has(subject.id))
      ctx.add("task_requirements", `${t.id}/${subject.id}`, p, {
        task_id: task,
        requirement_revision_id: m.requirement.get(subject.id),
      });
    else if (subject?.kind === "control" && m.implemented?.has(`${t.program}:${subject.id}`))
      ctx.add("task_implementations", `${t.id}/${subject.id}`, p, {
        task_id: task,
        implemented_requirement_id: m.implemented.get(`${t.program}:${subject.id}`),
      });
    else if (subject?.kind === "finding" && m.issue.has(subject.id))
      ctx.add("task_issues", `${t.id}/${subject.id}`, p, {
        task_id: task,
        issue_id: m.issue.get(subject.id),
      });
    else if (subject?.kind === "risk" && m.risk.has(subject.id))
      ctx.add("task_risks", `${t.id}/${subject.id}`, p, {
        task_id: task,
        risk_id: m.risk.get(subject.id).risk,
      });
    else if (subject?.kind === "poam" && m.poam.has(subject.id))
      ctx.add("task_poams", `${t.id}/${subject.id}`, p, {
        task_id: task,
        poam_item_id: m.poam.get(subject.id).item,
      });
    else if (subject)
      report(
        p,
        "task_subject_unmodeled",
        `${t.id}: original ${subject.kind} subject ${subject.id} retained in provenance; no incorrect typed join substituted.`,
      );
  }
  for (const [i, g] of (s.programMilestones ?? []).entries()) {
    const path = `/programMilestones/${i}`,
      status = enumValue(g.status, {
        complete: "completed",
        completed: "completed",
        "in progress": "in_review",
        active: "in_review",
        planned: "not_started",
        "not started": "not_started",
        upcoming: "not_started",
        "at risk": "at_risk",
        blocked: "blocked",
        missed: "failed",
        overdue: "not_started",
        waived: "waived",
      });
    const gate = ctx.add("lifecycle_gates", `${g.programId}/${g.id}`, path, {
      program_id: m.program.get(g.programId),
      title: g.name,
      description: text(g.description),
      status: status ?? "not_started",
      due_on: ctx.date(g.planned, `${path}/planned`),
    });
    if (text(g.cyberGate))
      ctx.add("gate_criteria", `${g.programId}/${g.id}/cyber`, path, {
        gate_id: gate,
        title: g.cyberGate,
        description: null,
      });
  }
  for (const [i, p] of s.packages.entries()) {
    const path = `/packages/${i}`,
      system = m.system.get(p.system);
    if (!system) {
      report(
        path,
        "missing_package_system",
        `${p.id}: source system ${p.system} is not a modeled system; an authorization package was not assigned to a guessed system.`,
      );
      continue;
    }
    const pkg = ctx.add("authorization_packages", p.id, path, {
      program_id: m.program.get(p.program),
      system_id: system,
      title: p.name,
      owner_party_id: ctx.party(p.owner, `${path}/owner`),
    });
    m.package.set(p.id, pkg);
    ctx.add("package_revisions", `${p.id}:1`, path, {
      package_id: pkg,
      version_number: 1,
      description: text(p.boundary),
    });
    report(
      path,
      "package_source_pins_missing",
      `${p.id}: draft package restored. Source document snapshots, complete submission timestamps, and decision maker identities were not supplied; no formal documents/authorization decision were fabricated.`,
    );
  }
  for (const [i, a] of s.activity.entries()) {
    const path = `/activity/${i}`,
      subject = a.subject,
      targets = {};
    if (subject?.kind === "task" && m.task.has(subject.id))
      targets.task_id = m.task.get(subject.id);
    else if (subject?.kind === "finding" && m.issue.has(subject.id))
      targets.issue_id = m.issue.get(subject.id);
    else if (subject?.kind === "risk" && m.risk.has(subject.id))
      targets.risk_id = m.risk.get(subject.id).risk;
    else if (subject?.kind === "poam" && m.poam.has(subject.id))
      targets.poam_item_id = m.poam.get(subject.id).item;
    else if (m.program.has(a.program)) targets.program_id = m.program.get(a.program);
    if (!Object.keys(targets).length) {
      report(
        path,
        "activity_target_missing",
        `${a.id}: source event target could not be resolved.`,
      );
      continue;
    }
    const actor = ctx.party(a.actor, `${path}/actor`),
      time = ctx.timestamp(a.at, `${path}/at`);
    if (a.kind === "comment" && actor && text(a.body))
      ctx.add("comments", a.id, path, {
        ...targets,
        author_party_id: actor,
        body: a.body,
        created_at: time ?? ctx.importedAt,
      });
    else if (time)
      ctx.add("activity_events", a.id, path, {
        ...targets,
        actor_party_id: actor,
        event_type:
          enumValue(a.kind, {
            created: "created",
            updated: "updated",
            completed: "completed",
            reopened: "reopened",
            linked: "linked",
            unlinked: "unlinked",
            reviewed: "reviewed",
            published: "published",
          }) ?? "updated",
        description: [text(a.summary), text(a.body)].filter(Boolean).join("\n") || null,
        occurred_at: time,
      });
  }
}
