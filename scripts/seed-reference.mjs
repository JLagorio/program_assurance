#!/usr/bin/env node
/** Import exact, hash-verified public reference publications into local Supabase. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const referenceRoot = join(projectRoot, "supabase/reference");
/** The short names the product shows. Each revision keeps the OSCAL document's own title. */
const displayTitles = new Map([
  ["nist-sp800-53r5-oscal-catalog", "NIST SP 800-53 Rev 5"],
  ["nist-sp800-53b-low-profile", "NIST SP 800-53 Rev 5 Low baseline"],
  ["nist-sp800-53b-moderate-profile", "NIST SP 800-53 Rev 5 Moderate baseline"],
  ["nist-sp800-53b-high-profile", "NIST SP 800-53 Rev 5 High baseline"],
  ["nist-sp800-53b-privacy-profile", "NIST SP 800-53 Rev 5 Privacy baseline"],
]);
function displayTitle(sourceCode) {
  const title = displayTitles.get(sourceCode);
  requireValue(title, `No display title is defined for reference source ${sourceCode}`);
  return title;
}
const profile = "program-assurance";
const sha256 = (input) => createHash("sha256").update(input).digest("hex");
const stableId = (key) => {
  const bytes = createHash("sha256").update(`program-assurance/reference/v1/${key}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeXml(value) {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (/^#x/i.test(entity)) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number(entity.slice(1)));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity];
  });
}
function attributes(value) {
  return Object.fromEntries(
    [...value.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1], decodeXml(m[2])]),
  );
}
function childTexts(block, name) {
  return [
    ...block.matchAll(new RegExp(`<${name}\\b[^>]*?(?:/\\s*>|>([\\s\\S]*?)</${name}>)`, "g")),
  ].map((m) => decodeXml(m[1] ?? "").trim());
}
function childText(block, name) {
  const values = childTexts(block, name);
  requireValue(values.length === 1, `Expected one CCI ${name}, received ${values.length}`);
  return values[0];
}

/** Build normalized records without accessing the database. Throws on missing/changed sources. */
export async function buildReferenceRows() {
  const manifest = JSON.parse(await readFile(join(referenceRoot, "manifest.json"), "utf8"));
  requireValue(manifest.format_version === 1, "Unsupported reference manifest format");
  const sources = new Map();
  for (const entry of manifest.sources) {
    requireValue(/^[\w.-]+\.gz$/.test(entry.file), "Invalid source filename");
    const bytes = gunzipSync(await readFile(join(referenceRoot, entry.file)));
    requireValue(
      bytes.length === entry.uncompressed_bytes && sha256(bytes) === entry.sha256,
      `Reference integrity check failed: ${entry.file}. Restore the pinned source; no partial import was run.`,
    );
    sources.set(entry.id, { ...entry, text: bytes.toString("utf8") });
  }
  const tables = new Map();
  const ids = new Set();
  const add = (table, key, record) => {
    const id = stableId(`${table}/${key}`);
    requireValue(!ids.has(id), `Duplicate ${table} source identity: ${key}`);
    ids.add(id);
    if (!tables.has(table)) tables.set(table, []);
    tables.get(table).push({ id, ...record });
    return id;
  };
  const sourceIds = new Map();
  for (const source of sources.values()) {
    sourceIds.set(
      source.id,
      add("ref_sources", source.id, {
        code: source.id,
        title: source.title,
        authority: source.authority,
        source_uri: source.source_url,
        authoritative: source.authoritative,
        rights: source.rights,
        notes: source.notes ?? null,
      }),
    );
  }
  const documents = new Map();
  const resourceIds = new Map();
  const readOscal = (sourceCode, model) => {
    const source = sources.get(sourceCode);
    requireValue(source, `Missing pinned source ${sourceCode}`);
    const content = JSON.parse(source.text);
    const body = content[model];
    requireValue(
      body?.uuid && body.metadata?.version && body.metadata?.["oscal-version"],
      `Invalid OSCAL ${sourceCode}`,
    );
    const documentId = add("oscal_documents", sourceCode, {
      source_id: sourceIds.get(sourceCode),
      model,
      code: sourceCode,
      title: body.metadata.title,
    });
    const revisionId = add("oscal_document_revisions", `${sourceCode}/${source.sha256}`, {
      document_id: documentId,
      source_uuid: body.uuid,
      document_version: body.metadata.version,
      oscal_version: body.metadata["oscal-version"],
      title: body.metadata.title,
      last_modified: body.metadata["last-modified"],
      original_uri: source.source_url,
      content_sha256: source.sha256,
      original_content: content,
      metadata: body.metadata,
    });
    for (const resource of body["back-matter"]?.resources ?? []) {
      resourceIds.set(
        `${revisionId}/${resource.uuid}`,
        add("oscal_document_resources", `${revisionId}/${resource.uuid}`, {
          document_revision_id: revisionId,
          source_uuid: resource.uuid,
          title: resource.title ?? null,
          description: resource.description ?? null,
          citation: resource.citation?.text ?? null,
          source_content: resource,
        }),
      );
    }
    const document = { body, source, revisionId };
    documents.set(sourceCode, document);
    return document;
  };

  const catalog = readOscal("nist-sp800-53r5-oscal-catalog", "catalog");
  const catalogId = add("catalogs", "nist-sp800-53-rev5", {
    source_id: sourceIds.get(catalog.source.id),
    code: "NIST-SP-800-53-REV5",
    title: displayTitle(catalog.source.id),
  });
  const catalogRevisionId = add("catalog_revisions", catalog.revisionId, {
    catalog_id: catalogId,
    document_revision_id: catalog.revisionId,
    version: catalog.body.metadata.version,
    title: catalog.body.metadata.title,
  });
  const controlIds = new Map();
  const controlsByCode = new Map();
  const partIds = new Map();
  const groupIds = new Map();
  const deferredLinks = [];
  const controlSourceOrder = [];

  function walkParts(parts, pointer, controlId = null, groupId = null, parentId = null) {
    for (const [ordinal, part] of (parts ?? []).entries()) {
      const path = `${pointer}/parts/${ordinal}`;
      const id = add("control_parts", `${catalogRevisionId}${path}`, {
        catalog_revision_id: catalogRevisionId,
        control_id: controlId,
        group_id: groupId,
        parent_part_id: parentId,
        source_id: part.id ?? null,
        source_pointer: path,
        name: part.name,
        namespace: part.ns ?? null,
        class: part.class ?? null,
        title: part.title ?? null,
        prose: part.prose ?? null,
        ordinal,
        props: part.props ?? [],
        links: part.links ?? [],
      });
      if (part.id) {
        requireValue(!partIds.has(part.id), `Duplicate catalog part ID ${part.id}`);
        partIds.set(part.id, id);
      }
      walkParts(part.parts, path, controlId, groupId, id);
    }
  }
  function walkParams(params, pointer, controlId = null, groupId = null) {
    for (const [ordinal, param] of (params ?? []).entries()) {
      const path = `${pointer}/params/${ordinal}`;
      const id = add("parameters", `${catalogRevisionId}/${param.id}`, {
        catalog_revision_id: catalogRevisionId,
        control_id: controlId,
        group_id: groupId,
        source_id: param.id,
        class: param.class ?? null,
        label: param.label ?? null,
        usage: param.usage ?? null,
        depends_on: param["depends-on"] ?? null,
        selection_count: param.select?.["how-many"] ?? null,
        has_selection: param.select !== undefined,
        ordinal,
        props: param.props ?? [],
        links: param.links ?? [],
        remarks: param.remarks ?? null,
      });
      for (const [index, value] of (param.values ?? []).entries())
        add("parameter_values", `${id}/${index}`, { parameter_id: id, ordinal: index, value });
      for (const [index, value] of (param.select?.choice ?? []).entries())
        add("parameter_choices", `${id}/${index}`, { parameter_id: id, ordinal: index, value });
      for (const [index, constraint] of (param.constraints ?? []).entries())
        add("parameter_constraints", `${id}/${index}`, {
          parameter_id: id,
          ordinal: index,
          description: constraint.description ?? null,
          tests: constraint.tests ?? [],
        });
      for (const [index, guideline] of (param.guidelines ?? []).entries())
        add("parameter_guidelines", `${id}/${index}`, {
          parameter_id: id,
          ordinal: index,
          prose: guideline.prose,
        });
      requireValue(param.id, `Missing parameter ID at ${path}`);
    }
  }
  function walkControls(controls, pointer, groupId = null, parentId = null) {
    for (const [ordinal, control] of (controls ?? []).entries()) {
      const path = `${pointer}/controls/${ordinal}`;
      const label = control.props?.find((p) => p.name === "label" && p.class === undefined)?.value;
      const code = label ?? control.id;
      const id = add("controls", `${catalogRevisionId}/${control.id}`, {
        catalog_revision_id: catalogRevisionId,
        group_id: groupId,
        parent_control_id: parentId,
        source_id: control.id,
        code,
        title: control.title,
        class: control.class ?? null,
        status: control.props?.some((p) => p.name === "status" && p.value === "withdrawn")
          ? "withdrawn"
          : "active",
        ordinal,
        props: control.props ?? [],
      });
      controlIds.set(control.id, id);
      controlsByCode.set(code, id);
      controlSourceOrder.push(control.id);
      walkParts(control.parts, path, id);
      walkParams(control.params, path, id);
      deferredLinks.push({ controlId: id, links: control.links ?? [] });
      walkControls(control.controls, path, groupId, id);
    }
  }
  function walkGroups(groups, pointer, parentId = null) {
    for (const [ordinal, group] of (groups ?? []).entries()) {
      const path = `${pointer}/groups/${ordinal}`;
      const id = add("catalog_groups", `${catalogRevisionId}${path}`, {
        catalog_revision_id: catalogRevisionId,
        parent_group_id: parentId,
        source_id: group.id ?? null,
        source_pointer: path,
        class: group.class ?? null,
        title: group.title ?? null,
        ordinal,
        props: group.props ?? [],
        links: group.links ?? [],
      });
      if (group.id) groupIds.set(group.id, id);
      walkParts(group.parts, path, null, id);
      walkParams(group.params, path, null, id);
      walkControls(group.controls, path, id);
      walkGroups(group.groups, path, id);
    }
  }
  walkGroups(catalog.body.groups, "/catalog");
  walkControls(catalog.body.controls, "/catalog");
  walkParts(catalog.body.parts, "/catalog");
  walkParams(catalog.body.params, "/catalog");
  requireValue(controlIds.size > 0, "The source catalog has no controls");
  for (const { controlId, links } of deferredLinks) {
    for (const [ordinal, link] of links.entries()) {
      const target = link.href.startsWith("#") ? link.href.slice(1) : null;
      add("control_links", `${controlId}/${ordinal}`, {
        control_id: controlId,
        ordinal,
        href: link.href,
        relation: link.rel ?? null,
        text: link.text ?? null,
        media_type: link["media-type"] ?? null,
        target_control_id: controlIds.get(target) ?? null,
        target_part_id: partIds.get(target) ?? null,
        target_group_id: groupIds.get(target) ?? null,
        resource_id: resourceIds.get(`${catalog.revisionId}/${target}`) ?? null,
      });
    }
  }

  const baselineCounts = {};
  for (const baseline of ["low", "moderate", "high", "privacy"]) {
    const sourceCode = `nist-sp800-53b-${baseline}-profile`;
    const document = readOscal(sourceCode, "profile");
    const { body } = document;
    // This bundled resolver deliberately supports the exact published NIST
    // shape. It fails instead of claiming unsupported tailoring was resolved.
    requireValue(
      body.merge?.["as-is"] === true && Object.keys(body.merge).length === 1 && !body.modify,
      `Profile ${baseline} requires a full OSCAL resolver; this importer supports unmodified as-is NIST profiles only`,
    );
    const profileId = add("profiles", sourceCode, {
      source_id: sourceIds.get(sourceCode),
      code: `NIST-SP-800-53B-${baseline.toUpperCase()}`,
      title: displayTitle(sourceCode),
    });
    const profileRevisionId = add("profile_revisions", document.revisionId, {
      profile_id: profileId,
      document_revision_id: document.revisionId,
      version: body.metadata.version,
      title: body.metadata.title,
    });
    const selections = new Map();
    for (const [ordinal, imported] of body.imports.entries()) {
      const resource = body["back-matter"]?.resources?.find((r) => `#${r.uuid}` === imported.href);
      const location =
        resource?.rlinks?.find((r) => r["media-type"] === "application/oscal.catalog+json")?.href ??
        imported.href;
      requireValue(
        location.endsWith("/NIST_SP-800-53_rev5_catalog.json"),
        `Unpinned profile import ${location}`,
      );
      requireValue(
        !imported["exclude-controls"] && !imported["include-all"],
        `Unsupported profile selection in ${baseline}`,
      );
      const documentImportId = add("oscal_document_imports", `${document.revisionId}/${ordinal}`, {
        document_revision_id: document.revisionId,
        referenced_revision_id: catalog.revisionId,
        href: imported.href,
        resolved_uri: catalog.source.source_url,
        resolution_status: "resolved",
        ordinal,
      });
      const importId = add("profile_imports", `${profileRevisionId}/${ordinal}`, {
        profile_revision_id: profileRevisionId,
        catalog_revision_id: catalogRevisionId,
        imported_profile_revision_id: null,
        document_import_id: documentImportId,
        href: imported.href,
        ordinal,
        include_all: false,
      });
      for (const [ruleOrdinal, include] of (imported["include-controls"] ?? []).entries()) {
        requireValue(
          Array.isArray(include["with-ids"]) &&
            !include.matching &&
            (!include["with-child-controls"] || include["with-child-controls"] === "no"),
          `Unsupported profile inclusion in ${baseline}`,
        );
        const pointer = `/profile/imports/${ordinal}/include-controls/${ruleOrdinal}`;
        const ruleId = add("profile_rules", `${profileRevisionId}${pointer}`, {
          profile_revision_id: profileRevisionId,
          profile_import_id: importId,
          kind: "include",
          ordinal: ruleOrdinal,
          source_pointer: pointer,
          definition: include,
          rationale: null,
        });
        for (const [selectionOrdinal, sourceId] of include["with-ids"].entries()) {
          requireValue(
            controlIds.has(sourceId),
            `Unresolved selected control ${sourceId} in ${baseline}`,
          );
          if (!selections.has(sourceId)) selections.set(sourceId, []);
          selections
            .get(sourceId)
            .push({ importId, ruleId, pointer: `${pointer}/with-ids/${selectionOrdinal}` });
        }
      }
    }
    add("profile_rules", `${profileRevisionId}/profile/merge`, {
      profile_revision_id: profileRevisionId,
      profile_import_id: null,
      kind: "merge",
      ordinal: 0,
      source_pointer: "/profile/merge",
      definition: body.merge,
      rationale: null,
    });
    const selectedSourceIds = controlSourceOrder.filter((id) => selections.has(id));
    requireValue(selectedSourceIds.length > 0, `No selected controls for ${baseline}`);
    const resolutionId = add(
      "profile_resolutions",
      `${profileRevisionId}/${catalogRevisionId}/nist-as-is-1`,
      {
        profile_revision_id: profileRevisionId,
        resolver_name: "program-assurance-nist-as-is",
        resolver_version: "1",
        input_sha256: sha256(`${document.source.sha256}\n${catalog.source.sha256}\n`),
        output_sha256: sha256(JSON.stringify(selectedSourceIds)),
      },
    );
    for (const [ordinal, revisionId] of [document.revisionId, catalog.revisionId].entries())
      add("profile_resolution_inputs", `${resolutionId}/${revisionId}`, {
        profile_resolution_id: resolutionId,
        document_revision_id: revisionId,
        ordinal,
      });
    for (const [ordinal, sourceId] of selectedSourceIds.entries()) {
      const selectedId = add("selected_controls", `${resolutionId}/${sourceId}`, {
        profile_resolution_id: resolutionId,
        control_id: controlIds.get(sourceId),
        ordinal,
      });
      for (const provenance of selections.get(sourceId))
        add("selection_provenance", `${selectedId}${provenance.pointer}`, {
          selected_control_id: selectedId,
          profile_import_id: provenance.importId,
          profile_rule_id: provenance.ruleId,
          source_pointer: provenance.pointer,
          rationale: null,
        });
    }
    baselineCounts[baseline] = selectedSourceIds.length;
  }

  const cciSource = sources.get("disa-cci-list-2024-mirror");
  requireValue(cciSource, "Missing pinned DISA CCI source");
  const xml = cciSource.text;
  requireValue(/xmlns="http:\/\/iase\.disa\.mil\/cci"/.test(xml), "CCI namespace mismatch");
  requireValue(
    !/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/i.test(xml),
    "Unsupported XML feature in CCI source",
  );
  const metadata = xml.match(/<metadata>([\s\S]*?)<\/metadata>/)?.[1];
  requireValue(metadata, "Missing CCI metadata");
  const cciRevisionId = add("cci_revisions", cciSource.sha256, {
    source_id: sourceIds.get(cciSource.id),
    version: childText(metadata, "version"),
    published_on: childText(metadata, "publishdate"),
    content_sha256: cciSource.sha256,
    original_content: xml,
  });
  let unresolvedRev5References = 0;
  for (const item of xml.matchAll(/<cci_item\b([^>]*)>([\s\S]*?)<\/cci_item>/g)) {
    const code = attributes(item[1]).id;
    const block = item[2];
    const itemId = add("cci_items", `${cciRevisionId}/${code}`, {
      cci_revision_id: cciRevisionId,
      code,
      status: childText(block, "status"),
      published_on: childText(block, "publishdate"),
      contributor: childText(block, "contributor") || null,
      definition: childText(block, "definition"),
      parameters: childTexts(block, "parameter"),
      notes: childTexts(block, "note"),
    });
    for (const type of childTexts(block, "type"))
      add("cci_item_types", `${itemId}/${type}`, { cci_item_id: itemId, type });
    for (const [ordinal, match] of [...block.matchAll(/<reference\b([^>]*?)\/>/g)].entries()) {
      const reference = attributes(match[1]);
      const isRev5 = reference.title === "NIST SP 800-53 Revision 5" && reference.version === "5";
      const linked = new Set();
      let fullyResolved = true;
      if (isRev5) {
        for (const index of reference.index.matchAll(/([A-Za-z]{2})-0*(\d+)\s*(?:\(0*(\d+)\))?/g)) {
          const controlCode = `${index[1].toUpperCase()}-${Number(index[2])}${index[3] === undefined ? "" : `(${Number(index[3])})`}`;
          const controlId = controlsByCode.get(controlCode);
          if (controlId) linked.add(controlId);
          else fullyResolved = false;
        }
      }
      const status = !isRev5
        ? "unsupported-publication"
        : linked.size && fullyResolved
          ? "resolved"
          : "unresolved";
      if (isRev5 && status !== "resolved") unresolvedRev5References += 1;
      const referenceId = add("cci_references", `${itemId}/${ordinal}`, {
        cci_item_id: itemId,
        creator: reference.creator,
        publication_title: reference.title,
        publication_version: reference.version,
        location: reference.location,
        source_index: reference.index,
        ordinal,
        resolution_status: status,
      });
      for (const controlId of linked)
        add("cci_control_links", `${referenceId}/${controlId}`, {
          cci_reference_id: referenceId,
          control_id: controlId,
          control_part_id: null,
          mapping_basis: "source-control-index",
        });
    }
  }
  requireValue((tables.get("cci_items")?.length ?? 0) > 0, "No CCI items parsed");
  return {
    tables,
    sources: [...sources.values()].map(({ text, ...source }) => source),
    baselineCounts,
    unresolvedRev5References,
  };
}

const tableOrder = [
  "ref_sources",
  "oscal_documents",
  "oscal_document_revisions",
  "oscal_document_resources",
  "catalogs",
  "catalog_revisions",
  "catalog_groups",
  "controls",
  "control_parts",
  "parameters",
  "parameter_values",
  "parameter_choices",
  "parameter_constraints",
  "parameter_guidelines",
  "control_links",
  "profiles",
  "profile_revisions",
  "oscal_document_imports",
  "profile_imports",
  "profile_rules",
  "profile_resolutions",
  "profile_resolution_inputs",
  "selected_controls",
  "selection_provenance",
  "cci_revisions",
  "cci_items",
  "cci_item_types",
  "cci_references",
  "cci_control_links",
];
const sqlIdentifier = (name) => {
  requireValue(/^[a-z_][a-z_0-9]*$/.test(name), "Unsafe SQL identifier");
  return `"${name}"`;
};
const sqlJson = (value) => {
  const text = JSON.stringify(value);
  const delimiter = `$reference_${sha256(text).slice(0, 16)}$`;
  requireValue(!text.includes(delimiter), "SQL quoting collision");
  return `${delimiter}${text}${delimiter}::jsonb`;
};

export function referenceSql(result) {
  const statements = [
    "begin;",
    "set local statement_timeout = '240s';",
    "select pg_advisory_xact_lock(hashtext('program-assurance/reference-import'));",
    "set constraints all deferred;",
  ];
  for (const table of tableOrder) {
    const records = result.tables.get(table) ?? [];
    if (!records.length) continue;
    const fields = [...new Set(records.flatMap((row) => Object.keys(row)))];
    requireValue(
      records.every((row) => fields.every((field) => field in row)),
      `Inconsistent import shape for ${table}`,
    );
    const columns = fields.map(sqlIdentifier).join(", ");
    for (let offset = 0; offset < records.length; offset += 200) {
      const batch = records.slice(offset, offset + 200);
      statements.push(`insert into public.${sqlIdentifier(table)} (${columns})
select ${fields.map((name) => `incoming.${sqlIdentifier(name)}`).join(", ")}
from jsonb_populate_recordset(null::public.${sqlIdentifier(table)}, ${sqlJson(batch)}) incoming
where not exists (select 1 from public.${sqlIdentifier(table)} existing where existing.id = incoming.id);`);
    }
  }
  for (const table of [
    "catalog_revisions",
    "profile_revisions",
    "profile_resolutions",
    "cci_revisions",
    "oscal_document_revisions",
  ]) {
    const ids = result.tables.get(table)?.map((r) => r.id) ?? [];
    if (ids.length)
      statements.push(
        `update public.${sqlIdentifier(table)} set state = 'published'${table === "oscal_document_revisions" ? ", published_at = now()" : ""} where state = 'draft' and id in (${ids.map((id) => `'${id}'::uuid`).join(", ")});`,
      );
  }
  statements.push("commit;");
  return statements.join("\n");
}

async function importLocal(sql) {
  const dockerEnv = {
    ...process.env,
    DOCKER_HOST: `unix://${join(homedir(), ".colima", profile, "docker.sock")}`,
  };
  delete dockerEnv.DOCKER_CONTEXT;
  delete dockerEnv.DOCKER_TLS_VERIFY;
  delete dockerEnv.DOCKER_CERT_PATH;
  // Fixed Colima socket + fixed local database container; no remote URL/key input.
  await new Promise((resolveImport, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-i",
        `supabase_db_${profile}`,
        "psql",
        "-X",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-q",
      ],
      {
        cwd: projectRoot,
        env: dockerEnv,
        stdio: ["pipe", "ignore", "pipe"],
      },
    );
    let errorText = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      errorText += chunk;
    });
    child.on("error", reject);
    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE") reject(error);
    });
    child.on("close", (code) =>
      code === 0
        ? resolveImport()
        : reject(new Error(`Local reference import failed (${code}): ${errorText.slice(-4000)}`)),
    );
    child.stdin.end(sql);
  });
}

async function main() {
  const args = process.argv.slice(2);
  requireValue(
    args.every((arg, i) => ["--check", "--sql"].includes(arg) || args[i - 1] === "--sql"),
    "Usage: node scripts/seed-reference.mjs [--check] [--sql output.sql]",
  );
  const result = await buildReferenceRows();
  const counts = Object.fromEntries(
    [...result.tables].map(([table, rows]) => [table, rows.length]),
  );
  console.log(
    JSON.stringify(
      {
        sources: result.sources.length,
        records: counts,
        baselineControls: result.baselineCounts,
        unresolvedRev5CciReferences: result.unresolvedRev5References,
      },
      null,
      2,
    ),
  );
  if (args.includes("--check")) {
    console.log("Pinned reference sources and normalized records verified; no database changes.");
    return;
  }
  const sql = referenceSql(result);
  if (args.includes("--sql")) {
    const path = args[args.indexOf("--sql") + 1];
    requireValue(path, "--sql requires an output filename");
    await writeFile(resolve(path), sql);
    console.log(`Wrote transactional reference import to ${resolve(path)}.`);
    return;
  }
  await importLocal(sql);
  console.log(
    "Published reference records imported into local Supabase. Existing releases were retained; no program data was created.",
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`seed-reference: ${error.message}`);
    process.exitCode = 1;
  });
}
