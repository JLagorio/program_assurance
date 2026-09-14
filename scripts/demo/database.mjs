import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { datasetId, deterministicId, sha256 } from "./context.mjs";
export function dockerEnvironment() {
  const env = {
    ...process.env,
    DOCKER_HOST: `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`,
  };
  for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete env[key];
  return env;
}
export function sql(query) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_program-assurance",
      "psql",
      "-X",
      "-q",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    {
      env: dockerEnvironment(),
      input: query,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    },
  ).trim();
}
export const quote = (value) =>
  value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
export const json = (value) => `${quote(JSON.stringify(value))}::jsonb`;
export function queryJson(query) {
  const output = sql(query);
  if (output === "t") return true;
  if (output === "f") return false;
  return JSON.parse(output || "null");
}
export function loadReferences() {
  const names = [
    "catalog_revisions",
    "oscal_document_revisions",
    "controls",
    "control_parts",
    "parameters",
    "parameter_values",
    "profiles",
    "profile_revisions",
    "profile_resolutions",
    "profile_resolution_inputs",
    "selected_controls",
  ];
  return Object.fromEntries(
    names.map((table) => [
      table,
      queryJson(
        `select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.${table} r where tenant_id is null;`,
      ),
    ]),
  );
}
export function targetTenant(tenantId, email) {
  if (!/^[a-f0-9-]{36}$/i.test(tenantId)) throw new Error("--tenant must be an explicit UUID");
  const tenant = queryJson(
    `select to_jsonb(t) from public.tenants t join auth.users u on u.id=t.personal_owner_id where t.id=${quote(tenantId)}::uuid and u.email=${quote(email)};`,
  );
  if (!tenant)
    throw new Error(
      "Target tenant is not the personal workspace owned by the explicitly supplied account email",
    );
  return tenant;
}
export function applyPlan(ctx, manifest, { commit = false, migration = null } = {}) {
  const batchId = ctx.id("demo_import_batches", ctx.fixtureSha256),
    jobId = ctx.id("ingestion_jobs", ctx.fixtureSha256);
  const summary = {
    tables: Object.fromEntries(
      [...new Set(ctx.entries.map((e) => e.table))].map((table) => [
        table,
        ctx.entries.filter((e) => e.table === table).length,
      ]),
    ),
    issues: ctx.issues.length,
  };
  const body = [
    "begin;",
    migration ?? "",
    `select pg_advisory_xact_lock(hashtextextended(${quote(`${ctx.tenantId}/${datasetId}`)},0));`,
    `create temporary table demo_inserted(table_name text,id uuid,primary key(table_name,id)) on commit drop;`,
    `create temporary table demo_new_job(id uuid) on commit drop;`,
    `with new_job as (insert into public.ingestion_jobs(id,tenant_id,title,source_uri,source_media_type,source_sha256,status,started_at,completed_at,summary) values(${quote(jobId)},${quote(ctx.tenantId)},'Original prototype demo import','supabase/demo/original-poc.json.gz','application/json',${quote(ctx.fixtureSha256)},'importing',${quote(ctx.importedAt)},null,${quote("Explicit demo import; original source assertions are synthetic. Missing material facts are reported, never fabricated.")}) on conflict(id) do nothing returning id) insert into demo_new_job select id from new_job;`,
    `insert into public.demo_import_batches(id,tenant_id,ingestion_job_id,dataset_id,fixture_sha256,imported_at,source_manifest,summary) values(${quote(batchId)},${quote(ctx.tenantId)},${quote(jobId)},${quote(datasetId)},${quote(ctx.fixtureSha256)},${quote(ctx.importedAt)},${json(manifest)},${json(summary)}) on conflict(id) do nothing;`,
    `create function pg_temp.demo_insert(target_table text,source_key text,source_pointer text,source_record_id uuid,mapped jsonb,record_id uuid,record_sha text) returns void language plpgsql as $function$
    declare existing public.demo_import_records; present boolean; columns_sql text;
    begin
      select * into existing from public.demo_import_records r where r.tenant_id=${quote(ctx.tenantId)}::uuid and r.dataset_id=${quote(datasetId)} and r.destination_table=target_table and r.source_key=demo_insert.source_key;
      if found then
        if existing.source_sha256<>record_sha or existing.destination_id<>(mapped->>'id')::uuid then raise exception 'Existing demo source changed for %/%; no records were overwritten',target_table,source_key; end if;
        execute format('select exists(select 1 from public.%I where id=$1 and tenant_id=$2)',target_table) into present using existing.destination_id,${quote(ctx.tenantId)}::uuid;
        if not present then raise exception 'Previously imported %/% was removed; explicit recovery is required',target_table,source_key; end if;
        return;
      end if;
      select string_agg(format('%I',key),',' order by key) into columns_sql from jsonb_object_keys(mapped) key;
      execute format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1)',target_table,columns_sql,columns_sql,target_table) using mapped;
      insert into demo_inserted values(target_table,(mapped->>'id')::uuid);
      insert into public.demo_import_records(id,tenant_id,import_batch_id,dataset_id,destination_table,destination_id,source_key,source_pointer,source_sha256,source_record_id,mapped_values)
      values(record_id,${quote(ctx.tenantId)},${quote(batchId)},${quote(datasetId)},target_table,(mapped->>'id')::uuid,source_key,source_pointer,record_sha,source_record_id,mapped);
    end;$function$;`,
  ];
  const sourceIds = new Map();
  for (const entry of [
    ...ctx.entries,
    ...Object.entries(ctx.source).map(([key, source]) => ({
      pointer: `/${key}`,
      source,
      table: "archive",
      key,
    })),
    ...ctx.issues.map((issue) => ({
      pointer: issue.pointer,
      source: ctx.sourceAt(issue.pointer),
      table: "report",
      key: issue.code,
    })),
  ]) {
    const pointer = entry.pointer ?? `/derived/${entry.table}/${entry.key}`;
    if (sourceIds.has(pointer)) continue;
    const id = ctx.id("demo_import_sources", `${ctx.fixtureSha256}/${pointer}`);
    sourceIds.set(pointer, id);
    body.push(
      `insert into public.demo_import_sources(id,tenant_id,import_batch_id,source_pointer,source_sha256,source_record) values(${quote(id)},${quote(ctx.tenantId)},${quote(batchId)},${quote(pointer)},${quote(sha256({ pointer, source: entry.source, fixture: ctx.fixtureSha256 }))},${json(entry.source)}) on conflict(id) do nothing;`,
    );
  }
  for (const operation of ctx.operations) {
    const entry = operation.entry;
    if (operation.kind === "insert")
      body.push(
        `select pg_temp.demo_insert(${quote(entry.table)},${quote(entry.key)},${quote(entry.pointer)},${quote(sourceIds.get(entry.pointer ?? `/derived/${entry.table}/${entry.key}`))},${json(entry.values)},${quote(deterministicId(ctx.tenantId, "demo_import_records", `${entry.table}/${entry.key}`))},${quote(sha256({ pointer: entry.pointer, source: entry.source, fixture: ctx.fixtureSha256 }))});`,
      );
    else {
      const columns = Object.keys(operation.patch);
      if (columns.some((key) => !/^[a-z_]+$/.test(key)))
        throw new Error("Invalid finalized column");
      body.push(
        `update public.${entry.table} target set ${columns.map((key) => `${key}=source.${key}`).join(",")} from jsonb_populate_record(null::public.${entry.table},${json(operation.patch)}) source where target.id=${quote(entry.values.id)} and exists(select 1 from demo_inserted where table_name=${quote(entry.table)} and id=target.id);`,
      );
    }
  }
  for (const [index, issue] of ctx.issues.entries())
    body.push(
      `insert into public.import_issues(id,tenant_id,ingestion_job_id,severity,code,source_pointer,message) values(${quote(ctx.id("import_issues", `${ctx.fixtureSha256}/${index}/${issue.code}`))},${quote(ctx.tenantId)},${quote(jobId)},'warning',${quote(issue.code)},${quote(issue.pointer)},${quote(issue.message)}) on conflict(id) do nothing;`,
    );
  body.push(
    `update public.ingestion_jobs set status='completed',completed_at=clock_timestamp() where id in(select id from demo_new_job);`,
    `select jsonb_build_object('inserted',(select count(*) from demo_inserted),'preserved',${ctx.entries.length}-(select count(*) from demo_inserted),'issues',${ctx.issues.length},'committed',${commit});`,
    commit ? "commit;" : "rollback;",
  );
  const result = sql(body.join("\n"));
  return JSON.parse(
    result
      .split("\n")
      .filter((line) => line.startsWith("{"))
      .at(-1),
  );
}
