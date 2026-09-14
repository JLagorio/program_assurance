import { createHash } from "node:crypto";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const text = (value) =>
  typeof value === "string" &&
  value.trim() &&
  !["—", "Unassigned", "Unrecorded", "Pending"].includes(value)
    ? value
    : null;
const impact = (value) =>
  ["low", "moderate", "high"].includes(value?.toLowerCase()) ? value.toLowerCase() : null;
const pointer = (name, index) => `/${name}/${index}`;
const namespace = "urn:program-assurance:demo-source";

/** Project the archived fixture into actual schema columns; never imports archived runtime code. */
export function mapAssurance(ctx) {
  const { source: s, maps: m } = ctx;
  for (const name of [
    "program",
    "system",
    "programSystem",
    "node",
    "scope",
    "requirement",
    "component",
    "ssp",
    "asset",
    "implemented",
    "scopeResolution",
    "scopeSelected",
    "process",
    "provider",
    "libraryRevision",
    "definedComponent",
  ])
    m[name] ??= new Map();
  const person = (name, path) => {
    if (!text(name)) return null;
    const id = m.party.get(name);
    if (!id)
      ctx.report(
        path,
        "unresolved_person",
        `The exact source person/organization ${JSON.stringify(name)} has no people record; no identity was invented.`,
      );
    return id ?? null;
  };
  const catalog = ctx.refs.catalog_revisions.find((row) => row.state === "published");
  if (!catalog) throw new Error("Import the pinned reference catalog before demo records.");
  const catalogDocument = ctx.refs.oscal_document_revisions.find(
    (row) => row.id === catalog.document_revision_id,
  );
  if (!catalogDocument) throw new Error("The reference catalog document is missing.");
  const controls = ctx.refs.controls.filter((row) => row.catalog_revision_id === catalog.id);
  const byCode = new Map(
    controls.flatMap((row) => [
      [row.code.toUpperCase(), row],
      [row.source_id.toUpperCase(), row],
    ]),
  );
  const refControl = (code, path) => {
    const found = byCode.get(code?.toUpperCase());
    if (!found)
      ctx.report(
        path,
        "unresolved_control",
        `No exact control code ${JSON.stringify(code)} exists in the pinned catalog.`,
      );
    return found;
  };
  const implementationStatus = (value, path) => {
    const mapped = {
      implemented: "implemented",
      "partially-implemented": "partial",
      "Partially implemented": "partial",
      Implemented: "implemented",
      Planned: "planned",
      planned: "planned",
      "not-implemented": "not_implemented",
      "Not implemented": "not_implemented",
    }[value];
    if (!mapped)
      ctx.report(
        path,
        "implementation_status_not_representable",
        `Source status ${JSON.stringify(value)} has no exact schema choice. The imported draft uses the schema's planned state; the exact source state remains in provenance.`,
      );
    return mapped ?? "planned";
  };

  for (const collection of ["riskDetailTimeline", "riskDetailEvidence"])
    (s[collection] ?? []).forEach((row, i) =>
      ctx.report(
        `/${collection}/${i}`,
        "unassigned_risk_detail_fixture",
        "The archived risk page displayed this same literal record for every risk without a risk ID. Preserve the original record without inventing a risk, evidence-file or event association.",
      ),
    );

  s.programs.forEach((row, i) => {
    const p = pointer("programs", i);
    const programId = ctx.add("programs", row.id, p, {
      code: row.id,
      name: row.name,
      description: text(row.summary),
      status: row.status === "Draft" ? "planned" : "active",
    });
    m.program.set(row.id, programId);
    const platform = s.platform.systems.find((item) => item.id === row.system);
    const systemId = ctx.add("systems", row.system, p, {
      program_id: programId,
      code: row.system,
      name: platform?.name ?? row.name,
      description: text(platform?.description ?? row.summary),
      system_type: row.type === "Weapon system" ? "platform" : "information_system",
      authorization_status:
        row.status === "Expired"
          ? "expired"
          : text(row.authorized)
            ? "authorized"
            : row.status === "Draft"
              ? "not_assessed"
              : "in_progress",
      system_owner_party_id: person(row.owner, `${p}/owner`),
      confidentiality_impact: impact(row.confidentiality),
      integrity_impact: impact(row.integrity),
      availability_impact: impact(row.availability),
    });
    m.system.set(row.system, systemId);
    m.programSystem.set(row.id, systemId);
    ctx.report(
      p,
      "program_summary_fields",
      "Source acronym, environment, reported assessment counts, original workflow status and authorization date labels remain in provenance. Counts are not inserted as independently asserted facts.",
    );
    for (const [field, role] of [
      ["owner", "system_owner"],
      ["assessor", "assessor"],
      ["authorizingOfficial", "authorizing_official"],
    ]) {
      const partyId = person(row[field], `${p}/${field}`);
      if (partyId)
        ctx.add("program_role_assignments", `${row.id}:${role}:${partyId}`, p, {
          program_id: programId,
          party_id: partyId,
          role,
        });
    }
  });

  const nodes = new Map(s.compositionNodes.map((row) => [row.id, row]));
  const pending = s.compositionNodes.map((row, i) => ({
    row,
    path: pointer("compositionNodes", i),
  }));
  while (pending.length) {
    let progressed = false;
    for (let i = pending.length - 1; i >= 0; i--) {
      const { row, path: p } = pending[i];
      if (row.parent && !m.node.has(row.parent)) continue;
      const systemId = m.programSystem.get(row.program);
      if (!systemId) {
        ctx.report(p, "missing_program", "Composition owner is absent.");
        pending.splice(i, 1);
        continue;
      }
      const nodeType =
        row.kind === "Subsystem"
          ? "subsystem"
          : row.kind === "Service"
            ? "service"
            : row.class === "Hardware"
              ? "hardware"
              : ["Software", "Firmware"].includes(row.class)
                ? "software"
                : "other";
      m.node.set(
        row.id,
        ctx.add("composition_nodes", row.id, p, {
          system_id: systemId,
          parent_id: row.parent ? m.node.get(row.parent) : null,
          code: row.id,
          name: row.name,
          node_type: nodeType,
          description: text(row.note),
        }),
      );
      ctx.report(
        p,
        "composition_source_metadata",
        "Original kind/class, supplier, origin, criticality, zone, BOM, partKey and attestation are retained in source provenance; schema has only the mapped node type and narrative.",
      );
      pending.splice(i, 1);
      progressed = true;
    }
    if (!progressed && pending.length) {
      for (const { path } of pending)
        ctx.report(
          path,
          "unresolved_composition_parent",
          "Missing or cyclic original composition parent; record cannot be mapped.",
        );
      break;
    }
  }
  for (const [sourceId, nativeId] of Object.entries(s.platformIds.nodes))
    if (m.node.has(nativeId)) m.node.set(sourceId, m.node.get(nativeId));
  s.compositionEdges.forEach((row, i) => {
    const p = pointer("compositionEdges", i);
    const from = nodes.get(row.from);
    const to = nodes.get(row.to);
    const type = {
      "Flows to": "sends_data_to",
      "Connects to": "connects_to",
      "Authenticates to": "trusts",
      Hosts: "hosts",
      "Depends on": "depends_on",
    }[row.kind];
    if (!from || !to || from.program !== to.program || !type)
      return ctx.report(
        p,
        "unresolved_composition_edge",
        "The source relation cannot be represented within one known system.",
      );
    ctx.add("component_relationships", `${row.from}:${row.to}:${type}`, p, {
      system_id: m.programSystem.get(from.program),
      source_node_id: m.node.get(row.from),
      target_node_id: m.node.get(row.to),
      relationship_type: type,
      description: text(row.via),
    });
  });
  s.assessmentScopes.forEach((row, i) => {
    const p = pointer("assessmentScopes", i);
    const systemId = m.programSystem.get(row.program);
    if (!systemId || !m.node.has(row.element))
      return ctx.report(
        p,
        "missing_scope_owner",
        "Original scope system or composition element is absent.",
      );
    m.scope.set(
      row.id,
      ctx.add("scopes", row.id, p, {
        system_id: systemId,
        composition_node_id: m.node.get(row.element),
        code: row.id,
        name: row.name,
        description: text(row.mission),
        categorization_rationale: text(row.separationBasis),
        confidentiality_impact: impact(row.parameters.confidentiality),
        integrity_impact: impact(row.parameters.integrity),
        availability_impact: impact(row.parameters.availability),
      }),
    );
    ctx.report(
      p,
      "scope_source_metadata",
      "Hosting, classification, connectivity, boolean categorization inputs, owner and independence claim have no direct scope columns and remain in source provenance. No adoption event/approver is invented.",
    );
  });
  for (const [sourceId, nativeId] of Object.entries(s.platformIds.scopes))
    if (m.scope.has(nativeId)) m.scope.set(sourceId, m.scope.get(nativeId));

  s.platform.components.forEach((row, i) => {
    const p = pointer("platform/components", i);
    const programId = s.programs.find((item) => item.system === s.platform.systems[0].id)?.id;
    const systemId = m.programSystem.get(programId);
    if (
      !systemId ||
      ![
        "hardware",
        "software",
        "service",
        "policy",
        "process",
        "validation",
        "interconnection",
      ].includes(row.type)
    )
      return ctx.report(
        p,
        "unsupported_component_type",
        "The original component system or component type is not representable.",
      );
    const componentStatus = [
      "planned",
      "under_development",
      "operational",
      "disposition",
      "other",
    ].includes(row.status)
      ? row.status
      : "other";
    if (componentStatus !== row.status)
      ctx.report(
        `${p}/status`,
        "component_status_coarsened",
        `Original component state ${row.status} is represented by schema choice other and retained exactly in provenance.`,
      );
    const id = ctx.add("system_components", row.id, p, {
      system_id: systemId,
      code: row.id,
      name: row.name,
      component_type: row.type,
      status: componentStatus,
      description: text(row.description),
    });
    m.component.set(row.id, id);
    m.component.set(s.platformIds.nodes[row.id], id);
  });
  s.assets.forEach((row, i) => {
    const p = pointer("assets", i);
    const systemId = m.programSystem.get(row.program);
    const nodeId = m.node.get(row.node);
    if (!systemId || !nodeId)
      return ctx.report(p, "missing_asset_owner", "Asset system/composition link is absent.");
    const id = ctx.add("inventory_items", row.id, p, {
      system_id: systemId,
      composition_node_id: nodeId,
      asset_id: row.id,
      name: row.name,
      description: text(row.technology),
      asset_owner_party_id: person(row.owner, `${p}/owner`),
    });
    m.asset.set(row.id, id);
    if (m.component.has(row.node))
      ctx.add("inventory_components", `${row.id}:${row.node}`, p, {
        system_id: systemId,
        inventory_item_id: id,
        system_component_id: m.component.get(row.node),
      });
    ctx.report(
      p,
      "asset_source_metadata",
      "Source asset kind, environment, scan date labels and aggregate counts remain in provenance; no scan or assessment fact is inferred from counts.",
    );
  });
  for (const [sourceId, nativeId] of Object.entries(s.platformIds.assets))
    if (m.asset.has(nativeId)) m.asset.set(sourceId, m.asset.get(nativeId));

  s.library.entries.forEach((entry, i) => {
    const p = `/library/entries/${i}`;
    const definitionId = ctx.add("component_definitions", entry.id, p, {
      code: entry.id,
      name: entry.name,
    });
    ctx.report(
      p,
      "library_metadata_not_representable",
      "Source category, owner, version labels, policy conditions, children, requirements and evidence associations remain in provenance; the current component schema has no equivalent columns/relationships for all these fields.",
    );
    entry.versions.forEach((version, v) => {
      const vp = `${p}/versions/${v}`;
      const key = version.id;
      const revisionId = ctx.add("component_definition_revisions", key, vp, {
        component_definition_id: definitionId,
        version_number: v + 1,
        state: "draft",
      });
      m.libraryRevision.set(key, revisionId);
      const componentType =
        entry.kind === "Policy"
          ? "policy"
          : entry.category === "Service"
            ? "service"
            : entry.category === "Manufacturing"
              ? "process"
              : ["Host platform", "Component"].includes(entry.category)
                ? "hardware"
                : "service";
      const componentId = ctx.add("defined_components", key, vp, {
        component_definition_revision_id: revisionId,
        name: entry.name,
        component_type: componentType,
      });
      m.definedComponent.set(key, componentId);
      version.controls.forEach((row, c) => {
        const cp = `${vp}/controls/${c}`;
        const control = refControl(row.id, `${cp}/id`);
        if (!control || !text(row.implementation))
          return ctx.report(
            cp,
            "missing_library_narrative",
            "No exact control or authored narrative to import as a defined implementation.",
          );
        ctx.add("defined_component_implementations", `${key}:${row.id}`, cp, {
          component_definition_revision_id: revisionId,
          defined_component_id: componentId,
          control_id: control.id,
          description: row.implementation,
          implementation_status: "planned",
        });
        ctx.report(
          cp,
          "library_assessment_metadata",
          "Authored narrative is imported as draft planned content. Applicability, consumer responsibility, assessment result and assessor/date remain in source provenance; no assessment or publication is invented.",
        );
      });
    });
  });

  (s.securityProcesses ?? []).forEach((row, i) => {
    const p = pointer("securityProcesses", i);
    const sourceProgram =
      row.program ?? s.workstreams.find((stream) => stream.id === row.workstream)?.program;
    const programId = m.program.get(sourceProgram);
    if (!programId)
      return ctx.report(p, "missing_process_program", "Security process has no known program.");
    m.process.set(
      row.id,
      ctx.add("security_processes", row.id, p, {
        program_id: programId,
        code: row.id,
        name: row.name,
        description: text(row.summary),
        owner_party_id: person(row.owner, `${p}/owner`),
      }),
    );
  });
  s.requirements.forEach((row, i) => {
    const p = pointer("requirements", i);
    const programId = m.program.get(row.program);
    const raw = row.sourceRecord?.data;
    if (!programId || !text(row.text) || !text(row.successCriteria))
      return ctx.report(
        p,
        "incomplete_requirement",
        "Requirement requires an actual program, statement and acceptance criteria.",
      );
    const id = ctx.add("engineering_requirements", row.id, p, {
      program_id: programId,
      code: row.id,
    });
    m.requirement.set(
      row.id,
      ctx.add("requirement_revisions", `${row.id}:${row.revision}`, p, {
        engineering_requirement_id: id,
        version_number: row.revision,
        state: "draft",
        title: text(raw?.title) ?? row.text,
        statement: row.text,
        rationale: text(row.note),
        acceptance_criteria: row.successCriteria,
        requirement_type: row.type === "Process" ? "operational" : "security",
        owner_party_id: person(row.owner, `${p}/owner`),
      }),
    );
    ctx.report(
      p,
      "requirement_workflow_metadata",
      "The original workflow state, verification method, priority, tags and workstream links remain in provenance. Source text revision is retained, but no publication approval is invented.",
    );
    for (let d = 0; d < row.derivations.length; d++) {
      const derivation = row.derivations[d];
      if (derivation.sourceType === "Control statement") {
        const control = refControl(derivation.sourceId, `${p}/derivations/${d}`);
        if (control) {
          ctx.add(
            "requirement_control_links",
            `${row.id}:${derivation.sourceId}:derived_from`,
            `${p}/derivations/${d}`,
            {
              requirement_revision_id: m.requirement.get(row.id),
              control_id: control.id,
              control_part_id: null,
              system_id: null,
              selected_control_id: null,
              relationship_type: "derived_from",
              rationale: text(derivation.rationale),
            },
          );
          continue;
        }
      }
      ctx.report(
        `${p}/derivations/${d}`,
        "requirement_derivation_scope",
        `The source names ${derivation.sourceType} ${derivation.sourceId}, not a uniquely identified OSCAL control part; exact derivation remains in provenance instead of inventing a statement/objective link.`,
      );
    }
  });
  s.requirements.forEach((row, i) => {
    if (row.parent && m.requirement.has(row.id) && m.requirement.has(row.parent))
      ctx.add("requirement_decompositions", `${row.parent}:${row.id}`, pointer("requirements", i), {
        parent_requirement_revision_id: m.requirement.get(row.parent),
        child_requirement_revision_id: m.requirement.get(row.id),
      });
  });
  s.allocations.forEach((row, i) => {
    const p = pointer("allocations", i);
    const revision = m.requirement.get(row.requirement);
    const target =
      row.targetKind === "node"
        ? m.node.get(row.target)
        : row.targetKind === "process"
          ? m.process.get(row.target)
          : m.provider.get(row.target);
    if (!revision || !target)
      return ctx.report(
        p,
        "unresolved_allocation_target",
        `The original ${row.targetKind} target ${row.target} has no mapped, sufficiently identified record.`,
      );
    ctx.add("requirement_allocations", row.id, p, {
      requirement_revision_id: revision,
      [row.targetKind === "node"
        ? "composition_node_id"
        : row.targetKind === "process"
          ? "security_process_id"
          : "provider_capability_id"]: target,
      rationale: text(row.rationale),
    });
    ctx.report(
      p,
      "allocation_source_metadata",
      "Original responsibility, coverage, implementation state, owner and scope text remain in provenance; the current allocation table represents only the target and rationale.",
    );
  });

  // A profile here is an explicit reproduction of a saved selection, not a CNSSI resolver.
  const createSelection = (key, title, codes, sourcePath, rationale, controlPointers) => {
    const selected = [...new Set(codes)]
      .map((code) => refControl(code, sourcePath))
      .filter(Boolean)
      .sort((a, b) => a.source_id.localeCompare(b.source_id, "en", { numeric: true }));
    if (selected.length !== new Set(codes).size || !selected.length) {
      ctx.report(
        sourcePath,
        "incomplete_profile_selection",
        "The exact source set cannot be reproduced against the pinned catalog; no partial baseline was imported.",
      );
      return null;
    }
    const sourceUuid = ctx.id("oscal_document_revisions", `${key}:source-uuid`);
    const rule = { "with-child-controls": "no", "with-ids": selected.map((row) => row.source_id) };
    const metadata = {
      title,
      version: "1",
      "oscal-version": catalogDocument.oscal_version,
      "last-modified": ctx.importedAt,
      props: [
        { name: "demo-source-sha256", ns: namespace, value: ctx.fixtureSha256 },
        { name: "demo-source-pointer", ns: namespace, value: sourcePath },
      ],
      remarks: rationale,
    };
    const doc = {
      profile: {
        uuid: sourceUuid,
        metadata,
        imports: [{ href: `urn:uuid:${catalogDocument.id}`, "include-controls": [rule] }],
        merge: { "as-is": true },
      },
    };
    const docId = ctx.add("oscal_documents", key, sourcePath, {
      model: "profile",
      title,
      code: key,
    });
    const revisionId = ctx.add("oscal_document_revisions", key, sourcePath, {
      document_id: docId,
      source_uuid: sourceUuid,
      document_version: "1",
      oscal_version: catalogDocument.oscal_version,
      title,
      last_modified: ctx.importedAt,
      content_sha256: hash(doc),
      original_content: doc,
      metadata,
    });
    const profileId = ctx.add("profiles", key, sourcePath, { code: key, title });
    const profileRevision = ctx.add("profile_revisions", key, sourcePath, {
      profile_id: profileId,
      document_revision_id: revisionId,
      version: "1",
      title,
    });
    const docImportId = ctx.add("oscal_document_imports", key, sourcePath, {
      document_revision_id: revisionId,
      referenced_revision_id: catalogDocument.id,
      href: `urn:uuid:${catalogDocument.id}`,
      resolved_uri: `urn:uuid:${catalogDocument.id}`,
      resolution_status: "resolved",
      ordinal: 0,
    });
    const importId = ctx.add("profile_imports", key, sourcePath, {
      profile_revision_id: profileRevision,
      catalog_revision_id: catalog.id,
      document_import_id: docImportId,
      href: `urn:uuid:${catalogDocument.id}`,
      ordinal: 0,
    });
    const ruleId = ctx.add("profile_rules", `${key}:include`, sourcePath, {
      profile_revision_id: profileRevision,
      profile_import_id: importId,
      kind: "include",
      ordinal: 0,
      source_pointer: "/profile/imports/0/include-controls/0",
      definition: rule,
      rationale,
    });
    ctx.add("profile_rules", `${key}:merge`, sourcePath, {
      profile_revision_id: profileRevision,
      kind: "merge",
      ordinal: 0,
      source_pointer: "/profile/merge",
      definition: { "as-is": true },
    });
    const resolutionId = ctx.add("profile_resolutions", key, sourcePath, {
      profile_revision_id: profileRevision,
      resolver_name: "archived-demo-explicit-selection",
      resolver_version: "1",
      input_sha256: hash({
        fixture: ctx.fixtureSha256,
        sourcePath,
        catalogHash: catalogDocument.content_sha256,
        codes,
      }),
      output_sha256: hash(selected.map((row) => row.source_id)),
      resolved_at: ctx.importedAt,
    });
    for (const [ordinal, documentId] of [revisionId, catalogDocument.id].entries())
      ctx.add("profile_resolution_inputs", `${key}:${ordinal}`, sourcePath, {
        profile_resolution_id: resolutionId,
        document_revision_id: documentId,
        ordinal,
      });
    const selectedMap = new Map();
    selected.forEach((row, ordinal) => {
      const controlPointer = controlPointers.get(row.code.toUpperCase());
      if (!controlPointer) throw new Error(`Missing exact source pointer for ${key}/${row.code}`);
      const id = ctx.add("selected_controls", `${key}:${row.code}`, controlPointer, {
        profile_resolution_id: resolutionId,
        control_id: row.id,
        ordinal,
      });
      selectedMap.set(row.code.toUpperCase(), id);
      ctx.add("selection_provenance", `${key}:${row.code}`, controlPointer, {
        selected_control_id: id,
        profile_import_id: importId,
        profile_rule_id: ruleId,
        source_pointer: `/profile/imports/0/include-controls/0/with-ids/${ordinal}`,
        rationale,
      });
    });
    return { resolutionId, selectedMap };
  };
  s.scopeSelections.forEach((row, i) => {
    const originalScope = s.assessmentScopes.find((scope) => scope.id === row.scopeId);
    const baseline = createSelection(
      `demo:${row.scopeId}`,
      originalScope.name,
      row.controls.map((control) => control.controlId),
      pointer("scopeSelections", i),
      "Explicit reproduction of the archived demo selection. Historical CNSSI extraction/overlay rationale is preserved in fixture provenance and is not asserted as an official resolver output.",
      new Map(
        row.controls.map((control, n) => [
          control.controlId.toUpperCase(),
          `/scopeSelections/${i}/controls/${n}`,
        ]),
      ),
    );
    if (baseline) {
      m.scopeResolution.set(row.scopeId, baseline.resolutionId);
      m.scopeSelected.set(row.scopeId, baseline.selectedMap);
    }
  });
  s.programs.forEach((program, i) => {
    const relevant = s.scopeSelections.filter((row) => row.programId === program.id);
    if (!relevant.length)
      return ctx.report(
        pointer("programs", i),
        "missing_authored_system_selection",
        "The program reports a baseline name/count but has no archived scoped selection or SSP narrative. No SSP has been invented.",
      );
    const rawPlatform = s.platform.systems.find((row) => row.id === program.system);
    const codes = rawPlatform
      ? s.platform.profiles.find((row) => row.id === rawPlatform.profile_id).effective_control_ids
      : relevant.flatMap((row) => row.controls.map((control) => control.controlId));
    const baseline = createSelection(
      `demo:${program.id}:ssp`,
      rawPlatform ? s.platform.profiles[0].name : program.baseline,
      codes,
      rawPlatform ? "/platform/profiles/0" : pointer("programs", i),
      "Imported draft SSP baseline reproducing the original saved demo control set. No assessment, publication or adoption event is implied.",
      rawPlatform
        ? new Map(
            codes.map((code, n) => [
              code.toUpperCase(),
              `/platform/profiles/0/effective_control_ids/${n}`,
            ]),
          )
        : new Map(
            s.scopeSelections.flatMap((selection, n) =>
              selection.programId === program.id
                ? selection.controls.map((control, c) => [
                    control.controlId.toUpperCase(),
                    `/scopeSelections/${n}/controls/${c}`,
                  ])
                : [],
            ),
          ),
    );
    if (!baseline) return;
    const sspId = ctx.add("ssp_revisions", program.id, pointer("programs", i), {
      system_id: m.programSystem.get(program.id),
      profile_resolution_id: baseline.resolutionId,
      version_number: 1,
      description: text(program.summary),
    });
    m.ssp.set(program.id, sspId);
    if (rawPlatform) {
      s.platform.control_implementations.forEach((row, n) => {
        const p = `/platform/control_implementations/${n}`;
        const selectedId = baseline.selectedMap.get(row.control_id.toUpperCase());
        if (!selectedId)
          return ctx.report(
            p,
            "implementation_not_selected",
            "The source implementation control is absent from the exact source profile.",
          );
        const status = implementationStatus(row.status, `${p}/status`);
        const implementedId = ctx.add("implemented_requirements", row.id, p, {
          ssp_revision_id: sspId,
          selected_control_id: selectedId,
          description: row.narrative,
          implementation_status: status,
        });
        m.implemented.set(row.id, implementedId);
        m.implemented.set(`${program.id}:${row.control_id}`, implementedId);
        row.by_component.forEach((contribution, c) => {
          const cp = `${p}/by_component/${c}`;
          const componentId = m.component.get(contribution.component_id);
          if (!componentId || !text(contribution.description))
            return ctx.report(
              cp,
              "missing_contribution_component",
              "The source component or contribution narrative is absent.",
            );
          const id = ctx.add(
            "component_contributions",
            `${row.id}:${contribution.component_id}`,
            cp,
            {
              ssp_revision_id: sspId,
              implemented_requirement_id: implementedId,
              system_component_id: componentId,
              description: contribution.description,
              implementation_status: "planned",
            },
          );
          ctx.report(
            cp,
            "component_implementation_unrecorded",
            "The original contribution has an authored narrative but implementationRecorded=false. It remains draft planned content; the parent control's implementation claim is not copied onto the component.",
          );
          for (const requirementId of row.requirement_ids) {
            const requirement = s.platform.requirements.find((item) => item.id === requirementId);
            if (
              requirement?.component_ids.includes(contribution.component_id) &&
              m.requirement.has(requirementId)
            )
              ctx.add(
                "requirement_implementations",
                `${requirementId}:${row.id}:${contribution.component_id}`,
                cp,
                {
                  requirement_revision_id: m.requirement.get(requirementId),
                  component_contribution_id: id,
                },
              );
          }
        });
      });
    } else {
      const sourceRows = s.controlWork
        .map((row, n) => ({ row, n }))
        .filter(({ row }) => row.program === program.id && text(row.narrative));
      s.controlWork.forEach((row, n) => {
        if (row.program === program.id && !text(row.narrative))
          ctx.report(
            `/controlWork/${n}`,
            "missing_authored_narrative",
            "The source work item has no authored implementation narrative; no SSP claim was invented.",
          );
      });
      const groups = Map.groupBy(sourceRows, ({ row }) => row.control);
      for (const [code, authored] of groups) {
        const selectedId = baseline.selectedMap.get(code.toUpperCase());
        if (!selectedId) {
          authored.forEach(({ n }) =>
            ctx.report(
              `/controlWork/${n}`,
              "implementation_not_selected",
              "Authored control is absent from the source scoped selections.",
            ),
          );
          continue;
        }
        if (authored.length !== 1) {
          authored.forEach(({ n }) =>
            ctx.report(
              `/controlWork/${n}`,
              "ambiguous_scoped_implementation",
              "Multiple scoped narratives cannot be collapsed into one system-level SSP claim without changing meaning.",
            ),
          );
          continue;
        }
        const { row, n } = authored[0];
        const id = ctx.add("implemented_requirements", row.id, `/controlWork/${n}`, {
          ssp_revision_id: sspId,
          selected_control_id: selectedId,
          description: row.narrative,
          implementation_status: implementationStatus(
            row.implementation,
            `/controlWork/${n}/implementation`,
          ),
          responsible_party_id: person(row.owner, `/controlWork/${n}/owner`),
        });
        m.implemented.set(row.id, id);
        m.implemented.set(`${program.id}:${code}`, id);
      }
    }
  });
  s.platform.profiles.forEach((profile, i) => {
    for (let p = 0; p < (profile.odp_starting_values ?? []).length; p++)
      ctx.report(
        `/platform/profiles/${i}/odp_starting_values/${p}`,
        "parameter_id_not_identified",
        "This original starting value identifies a control and prose PV references, not an exact OSCAL parameter ID. It is retained in provenance without inventing a parameter assignment.",
      );
  });
}
