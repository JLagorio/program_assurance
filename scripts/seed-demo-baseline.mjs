#!/usr/bin/env node
/**
 * Explicit demo step: give the demo program PRG-1090 (WS-X90) its layered control baseline.
 * The NIST SP 800-53 Rev 5 High reference baseline, then the four overlays the archived WS-X90
 * fixture names, applied in order. Defaults to a read-only plan; never runs at app boot.
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { deterministicId } from "./demo/context.mjs";
import { sql, quote, json, queryJson, targetTenant } from "./demo/database.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const programCode = "PRG-1090";
export const baselineTitle = "NIST SP 800-53 Rev 5 High baseline";
export const fixturePath = "tests/fixtures/legacy-poc/src/data/wsx90-platform-seed.json";
export const fixturePointer = "/profiles/0";
const profileIndex = 1;

/** The fixture's stack, checked for the shape this step relies on. */
export async function readStack() {
  const source = JSON.parse(await readFile(resolve(root, fixturePath), "utf8"));
  const profile = source.profiles?.[0];
  if (!profile) throw new Error(`${fixturePath} has no ${fixturePointer}`);
  const { starting_selection: starting, overlays, effective_control_ids: effective } = profile;
  if (!Array.isArray(starting) || !Array.isArray(overlays) || !Array.isArray(effective))
    throw new Error(
      `${fixturePath}${fixturePointer} lacks starting_selection, overlays or effective_control_ids`,
    );
  for (const overlay of overlays) {
    for (const key of ["overlay_id", "name", "reason"])
      if (typeof overlay[key] !== "string" || !overlay[key].trim())
        throw new Error(`An overlay in ${fixturePath}${fixturePointer} has no ${key}`);
    const adds = overlay.adds ?? [],
      removes = overlay.removes ?? [];
    const decided = [...adds, ...removes];
    if (new Set(decided).size !== decided.length)
      throw new Error(`${overlay.overlay_id} decides on a control more than once`);
    if (!decided.length) throw new Error(`${overlay.overlay_id} decides on no control`);
  }
  return {
    name: profile.name,
    starting,
    effective,
    overlays: overlays.map((overlay) => ({
      code: overlay.overlay_id,
      title: overlay.name,
      reason: overlay.reason,
      adds: overlay.adds ?? [],
      removes: overlay.removes ?? [],
    })),
  };
}

/** Each layer's effect on the set beneath it, as apply_control_overlay will find it. */
export function layerStack(startingCodes, overlays) {
  const selected = new Set(startingCodes);
  return overlays.map((overlay) => {
    const added = overlay.adds.filter((code) => !selected.has(code));
    const reaffirmed = overlay.adds.filter((code) => selected.has(code));
    const removed = overlay.removes.filter((code) => selected.has(code));
    const notApplicable = overlay.removes.filter((code) => !selected.has(code));
    for (const code of added) selected.add(code);
    for (const code of removed) selected.delete(code);
    return { ...overlay, added, reaffirmed, removed, notApplicable, total: selected.size };
  });
}

function readTarget(tenantId) {
  const program = queryJson(
    `select to_jsonb(p) from public.programs p where p.tenant_id=${quote(tenantId)}::uuid and p.code=${quote(programCode)};`,
  );
  if (!program)
    throw new Error(
      `Program ${programCode} is not in this workspace. Run the demo import (npm run seed:demo) first.`,
    );
  const baselines = queryJson(
    `select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'catalogRevisionId',c.catalog_revision_id)),'[]'::jsonb)
     from public.profile_resolutions r
     join public.profile_revisions v on v.id=r.profile_revision_id
     join public.profiles p on p.id=v.profile_id
     left join public.profile_resolution_catalogs c on c.profile_resolution_id=r.id
     where r.tenant_id is null and r.state='published' and p.title=${quote(baselineTitle)};`,
  );
  if (baselines.length !== 1 || !baselines[0].catalogRevisionId)
    throw new Error(
      baselines.length
        ? `Expected one published reference resolution of "${baselineTitle}" on one catalog, found ${baselines.length}.`
        : `The published reference baseline "${baselineTitle}" is missing. Run npm run seed:reference first.`,
    );
  const [baseline] = baselines;
  const controls = queryJson(
    `select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'code',c.code,'status',c.status)),'[]'::jsonb)
     from public.controls c where c.catalog_revision_id=${quote(baseline.catalogRevisionId)}::uuid;`,
  );
  const baselineCodes = queryJson(
    `select coalesce(jsonb_agg(c.code order by s.ordinal),'[]'::jsonb) from public.selected_controls s
     join public.controls c on c.id=s.control_id where s.profile_resolution_id=${quote(baseline.id)}::uuid;`,
  );
  return { program, baseline, controls, baselineCodes };
}

/** Read-only: resolve the fixture against the catalog and say what already exists. */
export function buildPlan({ tenantId, stack, target }) {
  const byCode = new Map();
  for (const control of target.controls) {
    if (byCode.has(control.code))
      throw new Error(`The catalog holds control code ${control.code} more than once`);
    byCode.set(control.code, control);
  }
  const named = new Set([
    ...stack.starting,
    ...stack.effective,
    ...stack.overlays.flatMap((overlay) => [...overlay.adds, ...overlay.removes]),
  ]);
  const missing = [...named].filter((code) => !byCode.has(code));
  if (missing.length)
    throw new Error(
      `The fixture names ${missing.length} control code(s) the catalog does not hold: ${missing.join(", ")}`,
    );
  const difference = (left, right) => {
    const other = new Set(right);
    return left.filter((code) => !other.has(code));
  };
  const baseGap = [
    ...difference(stack.starting, target.baselineCodes),
    ...difference(target.baselineCodes, stack.starting),
  ];
  if (baseGap.length)
    throw new Error(
      `The fixture's starting selection is not the "${baselineTitle}" resolution; they differ on: ${baseGap.join(", ")}`,
    );
  const layers = layerStack(target.baselineCodes, stack.overlays);
  const selected = new Set(target.baselineCodes);
  for (const layer of layers) {
    for (const code of layer.added) selected.add(code);
    for (const code of layer.removed) selected.delete(code);
  }
  const finalGap = [
    ...difference([...selected], stack.effective),
    ...difference(stack.effective, [...selected]),
  ];
  if (finalGap.length)
    throw new Error(
      `Applying the fixture's overlays in order does not give its effective_control_ids; they differ on: ${finalGap.join(", ")}`,
    );
  // author_tailored_profile refuses to newly include a control that is not active.
  const issues = [];
  for (const layer of layers) {
    for (const code of layer.adds)
      if (byCode.get(code).status !== "active")
        issues.push({
          overlay: layer.code,
          control: code,
          status: byCode.get(code).status,
          blocks: layer.added.includes(code),
          message: layer.added.includes(code)
            ? `${layer.code} adds ${code}, which is ${byCode.get(code).status}; a layered profile cannot newly include it.`
            : `${layer.code} reaffirms ${code}, which is ${byCode.get(code).status}; the baseline beneath already selects it.`,
        });
    if (!layer.added.length && !layer.removed.length)
      issues.push({
        overlay: layer.code,
        blocks: true,
        message: `${layer.code} changes nothing on the baseline beneath it; apply_control_overlay refuses it.`,
      });
  }
  const layerCode = (index) => `${programCode}/profiles/${profileIndex}/overlays/${index + 1}`;
  const overlayCodes = stack.overlays.map((overlay) => overlay.code);
  const existing = queryJson(
    `select jsonb_build_object(
       'overlays',(select coalesce(jsonb_object_agg(o.code,o.state),'{}'::jsonb) from public.control_overlays o
         where o.tenant_id=${quote(tenantId)}::uuid and o.code in (${overlayCodes.map(quote).join(",")})),
       'layers',(select coalesce(jsonb_agg(p.code),'[]'::jsonb) from public.profiles p
         where p.tenant_id=${quote(tenantId)}::uuid and p.code in (${overlayCodes.map((_, index) => quote(layerCode(index))).join(",")})),
       'choices',(select coalesce(jsonb_agg(c.profile_resolution_id),'[]'::jsonb) from public.program_reference_choices c
         where c.tenant_id=${quote(tenantId)}::uuid and c.program_id=${quote(target.program.id)}::uuid));`,
  );
  return {
    issues,
    existing,
    payload: {
      tenantId,
      programId: target.program.id,
      programCode,
      catalogRevisionId: target.baseline.catalogRevisionId,
      baseResolutionId: target.baseline.id,
      effectiveControlIds: stack.effective.map((code) => byCode.get(code).id),
      overlays: layers.map((layer, index) => ({
        id: deterministicId(tenantId, "control_overlays", layer.code),
        code: layer.code,
        title: layer.title,
        description: layer.reason,
        rationale: layer.reason,
        layerCode: layerCode(index),
        layerTitle: `${layer.title} — ${programCode}`,
        expectedTotal: layer.total,
        decisions: [
          ...layer.adds.map((code) => ({ controlId: byCode.get(code).id, action: "include" })),
          ...layer.removes.map((code) => ({ controlId: byCode.get(code).id, action: "exclude" })),
        ],
      })),
    },
    summary: {
      program: { id: target.program.id, code: programCode, name: target.program.name },
      source: `${fixturePath}#${fixturePointer}`,
      catalogRevisionId: target.baseline.catalogRevisionId,
      base: {
        title: baselineTitle,
        profileResolutionId: target.baseline.id,
        controls: target.baselineCodes.length,
      },
      layers: layers.map((layer, index) => ({
        layer: index + 1,
        overlay: layer.code,
        title: layer.title,
        profileCode: layerCode(index),
        decisions: { include: layer.adds.length, exclude: layer.removes.length },
        added: layer.added.length,
        reaffirmed: layer.reaffirmed.length,
        removed: layer.removed.length,
        notApplicable: layer.notApplicable.length,
        controls: layer.total,
        overlayRecord: existing.overlays[layer.code]
          ? `exists (${existing.overlays[layer.code]})`
          : "to create",
        layerRecord: existing.layers.includes(layerCode(index)) ? "exists" : "to apply",
      })),
      effectiveControls: stack.effective.length,
      programReferenceChoice: existing.choices.length ? "exists" : "to create",
    },
  };
}

/** One transaction: overlays, layers, the check against the fixture, the program's choice. */
export function applyBaseline(payload, { commit = false } = {}) {
  const body = [
    "begin;",
    `create function pg_temp.seed_demo_baseline(p jsonb) returns jsonb language plpgsql as $seed$
    declare
      v_tenant uuid:=(p->>'tenantId')::uuid; v_program uuid:=(p->>'programId')::uuid; v_catalog uuid:=(p->>'catalogRevisionId')::uuid;
      v_resolution uuid:=(p->>'baseResolutionId')::uuid; v_item jsonb; v_overlay public.control_overlays; v_layer uuid; v_profile uuid;
      v_application public.profile_overlay_applications; v_count integer; v_extra text; v_lacking text;
      v_overlays_created integer:=0; v_layers_applied integer:=0; v_choice_created boolean:=false; v_layers jsonb:='[]';
    begin
      perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||'/demo-baseline/'||v_program::text,0));
      if not exists(select 1 from public.programs where tenant_id=v_tenant and id=v_program) then raise exception 'Program % is not in this workspace',p->>'programCode'; end if;
      for v_item in select o.value from jsonb_array_elements(p->'overlays') with ordinality o(value,position) order by o.position loop
        select * into v_overlay from public.control_overlays where tenant_id=v_tenant and code=v_item->>'code';
        if found then
          if v_overlay.state<>'published' then raise exception 'Overlay % exists as a draft in this workspace; publish or remove it before seeding',v_overlay.code; end if;
          if v_overlay.catalog_revision_id<>v_catalog then raise exception 'Overlay % exists on a different catalog edition',v_overlay.code; end if;
          if exists(select 1 from jsonb_array_elements(v_item->'decisions') d where not exists(select 1 from public.control_overlay_decisions x
                where x.overlay_id=v_overlay.id and x.control_id=(d.value->>'controlId')::uuid and x.action=d.value->>'action'))
            or (select count(*) from public.control_overlay_decisions x where x.overlay_id=v_overlay.id)<>jsonb_array_length(v_item->'decisions') then
            raise exception 'Overlay % exists with different decisions than the fixture; nothing was overwritten',v_overlay.code;
          end if;
        else
          insert into public.control_overlays(id,tenant_id,catalog_revision_id,code,title,description,state)
            values((v_item->>'id')::uuid,v_tenant,v_catalog,v_item->>'code',v_item->>'title',v_item->>'description','draft') returning * into v_overlay;
          insert into public.control_overlay_decisions(tenant_id,overlay_id,control_id,action,rationale)
            select v_tenant,v_overlay.id,(d.value->>'controlId')::uuid,d.value->>'action',v_item->>'rationale' from jsonb_array_elements(v_item->'decisions') d;
          update public.control_overlays set state='published',revision=revision+1 where id=v_overlay.id returning * into v_overlay;
          v_overlays_created:=v_overlays_created+1;
        end if;
        select id into v_profile from public.profiles where tenant_id=v_tenant and code=v_item->>'layerCode';
        if found then
          select a.* into v_application from public.profile_overlay_applications a
            join public.profile_resolutions r on r.id=a.profile_resolution_id
            join public.profile_revisions v on v.id=r.profile_revision_id
            where a.tenant_id=v_tenant and v.profile_id=v_profile and r.state='published'
              and a.overlay_id=v_overlay.id and r.base_profile_resolution_id=v_resolution;
          if not found then raise exception 'Profile % exists but is not overlay % applied to the layer beneath it; nothing was overwritten',v_item->>'layerCode',v_overlay.code; end if;
          v_layer:=v_application.profile_resolution_id;
        else
          v_layer:=public.apply_control_overlay(v_tenant,v_catalog,v_resolution,v_overlay.id,v_item->>'layerCode',v_item->>'layerTitle');
          select * into v_application from public.profile_overlay_applications where profile_resolution_id=v_layer;
          v_layers_applied:=v_layers_applied+1;
        end if;
        select count(*) into v_count from public.selected_controls where profile_resolution_id=v_layer;
        if v_count<>(v_item->>'expectedTotal')::integer then raise exception 'Layer % selects % controls; the fixture expects %',v_item->>'layerCode',v_count,v_item->>'expectedTotal'; end if;
        v_layers:=v_layers||jsonb_build_object('overlay',v_overlay.code,'overlayId',v_overlay.id,'profileCode',v_item->>'layerCode','profileResolutionId',v_layer,
          'added',(select count(*) from public.selected_controls s where s.profile_resolution_id=v_layer and not exists(select 1 from public.selected_controls b where b.profile_resolution_id=v_resolution and b.control_id=s.control_id)),
          'removed',(select count(*) from public.selected_controls b where b.profile_resolution_id=v_resolution and not exists(select 1 from public.selected_controls s where s.profile_resolution_id=v_layer and s.control_id=b.control_id)),
          'reaffirmed',cardinality(v_application.reaffirmed_control_ids),'notApplicable',cardinality(v_application.not_applicable_control_ids),'controls',v_count);
        v_resolution:=v_layer;
      end loop;
      select string_agg(c.code,', ' order by c.code) into v_extra from public.selected_controls s join public.controls c on c.id=s.control_id
        where s.profile_resolution_id=v_resolution and not exists(select 1 from jsonb_array_elements_text(p->'effectiveControlIds') e where e.value::uuid=s.control_id);
      select string_agg(c.code,', ' order by c.code) into v_lacking from jsonb_array_elements_text(p->'effectiveControlIds') e join public.controls c on c.id=e.value::uuid
        where not exists(select 1 from public.selected_controls s where s.profile_resolution_id=v_resolution and s.control_id=c.id);
      if v_extra is not null or v_lacking is not null then
        raise exception 'The final layer is not the fixture''s effective_control_ids (selected but not expected: %; expected but not selected: %). Nothing was written.',coalesce(v_extra,'none'),coalesce(v_lacking,'none');
      end if;
      -- The program's choice is this stack when it names the final layer, or a layer authored on
      -- top of it (the showcase's program tailoring, npm run seed:demo-showcase).
      if not exists(
        with recursive stack(id,depth) as (
          select c.profile_resolution_id,0 from public.program_reference_choices c where c.tenant_id=v_tenant and c.program_id=v_program
          union all
          select r.base_profile_resolution_id,s.depth+1 from stack s join public.profile_resolutions r on r.id=s.id
          where r.base_profile_resolution_id is not null and s.depth<16)
        select 1 from stack where id=v_resolution) then
        if exists(select 1 from public.program_reference_choices where tenant_id=v_tenant and program_id=v_program) then
          raise exception 'Program % already has a different control baseline; nothing was overwritten',p->>'programCode';
        end if;
        insert into public.program_reference_choices(tenant_id,program_id,catalog_revision_id,profile_resolution_id) values(v_tenant,v_program,v_catalog,v_resolution);
        v_choice_created:=true;
      end if;
      return jsonb_build_object('overlaysCreated',v_overlays_created,'layersApplied',v_layers_applied,'programReferenceChoiceCreated',v_choice_created,
        'changed',v_overlays_created>0 or v_layers_applied>0 or v_choice_created,'finalProfileResolutionId',v_resolution,
        'finalControls',(select count(*) from public.selected_controls where profile_resolution_id=v_resolution),'layers',v_layers);
    end;$seed$;`,
    `select pg_temp.seed_demo_baseline(${json(payload)});`,
    commit ? "commit;" : "rollback;",
  ];
  const result = sql(body.join("\n"));
  return {
    ...JSON.parse(
      result
        .split("\n")
        .filter((line) => line.startsWith("{"))
        .at(-1),
    ),
    committed: commit,
  };
}

async function main() {
  const args = process.argv.slice(2),
    options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--tenant", "--account"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = args[++index];
    } else if (["--apply", "--check", "--help"].includes(arg)) options[arg.slice(2)] = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.help) {
    console.log(
      `node scripts/seed-demo-baseline.mjs --tenant UUID --account EMAIL [--check | --apply]\nDefault: read-only plan of ${programCode}'s control baseline (the High baseline and the fixture's overlays in order). --check runs the complete transaction then rolls back. --apply explicitly commits. Existing overlays, layers and the program's baseline are never overwritten; a repeat changes nothing.`,
    );
    return;
  }
  if (!options.tenant || !options.account)
    throw new Error(
      "Supply --tenant UUID and --account EMAIL explicitly; no workspace is selected implicitly.",
    );
  if (options.check && options.apply) throw new Error("Choose --check or --apply, not both.");
  targetTenant(options.tenant, options.account);
  const stack = await readStack();
  const plan = buildPlan({ tenantId: options.tenant, stack, target: readTarget(options.tenant) });
  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : options.check ? "rollback check" : "read-only plan",
        tenantId: options.tenant,
        ...plan.summary,
        issues: plan.issues,
      },
      null,
      2,
    ),
  );
  if (!options.apply && !options.check) return;
  const blocking = plan.issues.filter((issue) => issue.blocks);
  if (blocking.length)
    throw new Error(`Nothing was written. ${blocking.map((issue) => issue.message).join(" ")}`);
  const result = applyBaseline(plan.payload, { commit: Boolean(options.apply) });
  console.log(JSON.stringify(result, null, 2));
  console.log(
    result.changed
      ? options.apply
        ? `Committed: ${result.overlaysCreated} overlay(s) created, ${result.layersApplied} layer(s) applied, program baseline ${result.programReferenceChoiceCreated ? "recorded" : "already recorded"}.`
        : "Check passed; the transaction was rolled back and nothing was written."
      : `Nothing changed: ${programCode} already has this baseline (the overlays, their layers and the program's reference choice exist).`,
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error) => {
    console.error(error.stderr?.toString() || error.message);
    process.exitCode = 1;
  });
