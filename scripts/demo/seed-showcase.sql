-- The showcase seed's transaction body, loaded by scripts/seed-demo-showcase.mjs. It defines
-- temporary functions only; the script calls pg_temp.seed_showcase(payload) inside its own
-- transaction and commits (--apply) or rolls back (--check).
--
-- Every record it writes is listed in demo_import_records under the dataset `showcase-v1`, beside
-- the legacy import's, so the showcase can be told apart from what the archived prototype held.
-- It runs once a workspace: a workspace that already holds the dataset's batch changes nothing.

create temp table showcase_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;
create temp table showcase_ir_map (source_ir uuid, new_ir uuid not null, control_id uuid not null) on commit drop;
-- The controls of the program whose requirements cite evidence, read as program_control_status
-- reads them: only these take a determination.
create temp table showcase_evidenced (control_id uuid primary key) on commit drop;

-- A stable identity for a showcase record: the same workspace and key give the same id.
create function pg_temp.sid(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/showcase-v1/' || p_key)::uuid
$$;
create function pg_temp.track(p_table text, p_id uuid, p_key text, p_section text) returns uuid
language sql as $$
  insert into pg_temp.showcase_tracked values (p_table, p_id, p_key, p_section) returning destination_id
$$;
create function pg_temp.party(p_tenant uuid, p_name text) returns uuid language plpgsql as $$
declare v uuid;
begin
  select id into v from public.parties where tenant_id = p_tenant and name = p_name order by id limit 1;
  if v is null then
    raise exception 'Person "%" is not in this workspace. Run the demo import (npm run seed:demo) first.', p_name;
  end if;
  return v;
end $$;
create function pg_temp.person(p jsonb, p_role text) returns uuid language sql as $$
  select pg_temp.party((p->>'tenantId')::uuid, p->'people'->>p_role)
$$;
-- The published reference resolution of a baseline, by its profile's title, with its catalog.
create function pg_temp.reference_baseline(p_title text, out resolution_id uuid, out catalog_revision_id uuid)
language plpgsql as $$
declare v_count integer;
begin
  select count(*) into v_count
  from public.profile_resolutions r
  join public.profile_revisions v on v.id = r.profile_revision_id
  join public.profiles pr on pr.id = v.profile_id
  where r.tenant_id is null and r.state = 'published' and pr.title = p_title;
  if v_count <> 1 then
    raise exception 'Expected one published reference resolution of "%", found %. Run npm run seed:reference first.', p_title, v_count;
  end if;
  select r.id, c.catalog_revision_id into resolution_id, catalog_revision_id
  from public.profile_resolutions r
  join public.profile_revisions v on v.id = r.profile_revision_id
  join public.profiles pr on pr.id = v.profile_id
  left join public.profile_resolution_catalogs c on c.profile_resolution_id = r.id
  where r.tenant_id is null and r.state = 'published' and pr.title = p_title;
end $$;
-- An item of a reference framework's current revision, by the framework's code and the item's.
create function pg_temp.framework_item(p_framework text, p_code text) returns uuid language sql stable as $$
  select i.id from public.framework_items i
  join public.frameworks f on f.current_revision_id = i.framework_revision_id
  where f.code = p_framework and i.code = p_code and i.tenant_id is null
$$;

-- A new SSP revision of a system, its implemented requirements one for each control its resolution
-- selects: a control the source revision implements keeps its narrative, status and components; a
-- control it does not is planned, with the narrative given for it (or none).
create function pg_temp.copy_ssp(
  p_tenant uuid, p_source uuid, p_new uuid, p_system uuid, p_resolution uuid, p_version integer,
  p_description text, p_baseline uuid, p_planned jsonb, p_key text
) returns void language plpgsql as $$
begin
  insert into public.ssp_revisions (id, tenant_id, system_id, profile_resolution_id, version_number, state, description, configuration_baseline_id)
  values (p_new, p_tenant, p_system, p_resolution, p_version, 'draft', p_description, p_baseline);
  perform pg_temp.track('ssp_revisions', p_new, p_key, 'ssp');
  truncate pg_temp.showcase_ir_map;
  insert into pg_temp.showcase_ir_map (source_ir, new_ir, control_id)
  select (select i.id from public.implemented_requirements i
            join public.selected_controls s on s.id = i.selected_control_id
            where i.ssp_revision_id = p_source and s.control_id = sc.control_id
            order by i.id limit 1),
         pg_temp.sid(p_tenant, p_key || '/ir/' || sc.control_id), sc.control_id
  from public.selected_controls sc where sc.profile_resolution_id = p_resolution;
  insert into public.implemented_requirements (id, tenant_id, ssp_revision_id, selected_control_id, implementation_status, description, responsible_party_id, not_applicable_rationale)
  select m.new_ir, p_tenant, p_new, sc.id,
    coalesce(src.implementation_status, 'planned'),
    coalesce(src.description, p_planned->>k.code),
    src.responsible_party_id, src.not_applicable_rationale
  from pg_temp.showcase_ir_map m
  join public.selected_controls sc on sc.profile_resolution_id = p_resolution and sc.control_id = m.control_id
  join public.controls k on k.id = m.control_id
  left join public.implemented_requirements src on src.id = m.source_ir;
  insert into public.implementation_statements (id, tenant_id, ssp_revision_id, implemented_requirement_id, control_part_id, description)
  select pg_temp.sid(p_tenant, p_key || '/statement/' || s.id), p_tenant, p_new, m.new_ir, s.control_part_id, s.description
  from public.implementation_statements s join pg_temp.showcase_ir_map m on m.source_ir = s.implemented_requirement_id;
  insert into public.component_contributions (id, tenant_id, ssp_revision_id, implemented_requirement_id, implementation_statement_id, system_component_id, description, implementation_status, responsible_party_id)
  select pg_temp.sid(p_tenant, p_key || '/contribution/' || c.id), p_tenant, p_new, m.new_ir,
    case when c.implementation_statement_id is null then null
      else pg_temp.sid(p_tenant, p_key || '/statement/' || c.implementation_statement_id) end,
    c.system_component_id, c.description, c.implementation_status, c.responsible_party_id
  from public.component_contributions c join pg_temp.showcase_ir_map m on m.source_ir = c.implemented_requirement_id;
  insert into pg_temp.showcase_tracked
  select 'implemented_requirements', i.id, p_key || '/ir/' || i.id, 'ssp' from public.implemented_requirements i where i.ssp_revision_id = p_new
  union all
  select 'implementation_statements', s.id, p_key || '/statement/' || s.id, 'ssp' from public.implementation_statements s where s.ssp_revision_id = p_new
  union all
  select 'component_contributions', c.id, p_key || '/contribution/' || c.id, 'ssp' from public.component_contributions c where c.ssp_revision_id = p_new;
end $$;

-- One results revision's determinations, as scripts/seed-demo-showcase.mjs reads them from the
-- archived assessment results: each on its control's statement, citing the evidence the archived
-- result examined and, for a failure, the observation the import recorded for the finding it
-- raised. A determination on a control whose requirements cite no evidence is left out, so the
-- control still reads No evidence; not assessed decides nothing and is kept with its reason.
create function pg_temp.write_determinations(p jsonb, p_results uuid, p_set uuid, p_list jsonb, p_key text, p_resolution uuid)
returns integer language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_item jsonb; v_control public.controls; v_part uuid; v_finding uuid; v_key text; v_code text;
  v_version uuid; v_observation uuid; v_written integer := 0;
begin
  for v_item in select value from jsonb_array_elements(p_list) loop
    select k.* into v_control from public.selected_controls sc join public.controls k on k.id = sc.control_id
      where sc.profile_resolution_id = p_resolution and k.code = v_item->>'control';
    if v_control.id is null then
      raise exception 'The archived results judge %, which the program''s control baseline does not select.', v_item->>'control';
    end if;
    continue when v_item->>'determination' <> 'not_assessed'
      and not exists (select 1 from pg_temp.showcase_evidenced e where e.control_id = v_control.id);
    select cp.id into v_part from public.control_parts cp
      where cp.control_id = v_control.id and cp.name = 'statement' and cp.parent_part_id is null order by cp.id limit 1;
    if v_part is null then raise exception '% has no statement to judge.', v_control.code; end if;
    v_key := 'assessment_findings/' || p_key || '/' || v_control.code;
    v_finding := pg_temp.sid(t, v_key);
    insert into public.assessment_findings (id, tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, description, determination, assessor_party_id, determined_at)
      values (v_finding, t, p_results, p_set, v_part, v_control.code || ' ' || v_control.title, v_item->>'description',
        v_item->>'determination', pg_temp.person(p, 'assessor'), (v_item->>'determinedAt')::timestamptz);
    perform pg_temp.track('assessment_findings', v_finding, v_key, 'assessments');
    for v_code in select jsonb_array_elements_text(v_item->'evidence') loop
      select r.destination_id into v_version from public.demo_import_records r
        where r.tenant_id = t and r.dataset_id = p->>'legacyDatasetId' and r.destination_table = 'evidence_versions'
          and r.source_key = v_code || ':1';
      if v_version is null then
        raise exception 'Evidence % that the archived results examine is not in this workspace. Run the demo import first.', v_code;
      end if;
      insert into public.finding_evidence (id, tenant_id, finding_id, evidence_version_id, claim)
        values (pg_temp.sid(t, v_key || '/evidence/' || v_code), t, v_finding, v_version, p->'assessments'->>'claim');
      perform pg_temp.track('finding_evidence', pg_temp.sid(t, v_key || '/evidence/' || v_code), v_key || '/evidence/' || v_code, 'assessments');
    end loop;
    if v_item->>'finding' is not null then
      select r.destination_id into v_observation from public.demo_import_records r
        where r.tenant_id = t and r.dataset_id = p->>'legacyDatasetId' and r.destination_table = 'observations'
          and r.source_key = (v_item->>'finding') || '/assessment';
      if v_observation is null then
        raise exception 'The observation of finding % is not in this workspace. Run the demo import first.', v_item->>'finding';
      end if;
      insert into public.finding_observations (id, tenant_id, finding_id, observation_id, assessment_results_revision_id)
        values (pg_temp.sid(t, v_key || '/observation'), t, v_finding, v_observation, p_results);
      perform pg_temp.track('finding_observations', pg_temp.sid(t, v_key || '/observation'), v_key || '/observation', 'assessments');
    end if;
    v_written := v_written + 1;
  end loop;
  return v_written;
end $$;

create function pg_temp.seed_showcase(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_program uuid; v_boundary uuid; v_catalog uuid; v_choice public.program_reference_choices;
  v_base_code text; v_tailored uuid; v_decisions jsonb; v_params jsonb; v_planned jsonb;
  v_item jsonb; v_entry jsonb; v_name text; v_code text; v_id uuid; v_other uuid; v_ver integer;
  v_resolution uuid; v_cat uuid; v_count integer; v_ordinal bigint; v_ids uuid[];
  v_cb1 uuid; v_cb2 uuid; v_idp_program uuid; v_idp uuid; v_idp_resolution uuid; v_idp_ssp uuid;
  v_ssp1 uuid; v_ssp2 uuid; v_ssp3 uuid; v_cap uuid; v_offered uuid[] := '{}';
  v_campaign uuid; v_plan uuid; v_results uuid; v_set uuid; v_initial_plan uuid; v_initial_results uuid;
  v_monitoring uuid; v_gate uuid; v_package uuid; v_revision uuid; v_owner uuid; v_job uuid; v_batch uuid;
  v_skipped jsonb := '[]'; v_moved jsonb; v_tables jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-showcase', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the showcase.');
  end if;

  -- The program the showcase centres on, its authorization boundary and its control baseline.
  select id into v_program from public.programs where tenant_id = t and code = p->>'programCode';
  if v_program is null then
    raise exception 'Program % is not in this workspace. Run the demo import (npm run seed:demo) first.', p->>'programCode';
  end if;
  select id into v_boundary from public.systems
    where tenant_id = t and program_id = v_program and code = p->>'boundaryCode' and is_authorization_boundary;
  if v_boundary is null then
    raise exception 'System % is not the authorization boundary of %.', p->>'boundaryCode', p->>'programCode';
  end if;
  select count(*) into v_count from public.program_reference_choices where tenant_id = t and program_id = v_program;
  if v_count <> 1 then
    raise exception '% has % control baselines; run npm run seed:demo-baseline first, on a workspace where it has none other.', p->>'programCode', v_count;
  end if;
  select * into v_choice from public.program_reference_choices where tenant_id = t and program_id = v_program;
  select pr.code into v_base_code from public.profile_resolutions r
    join public.profile_revisions v on v.id = r.profile_revision_id
    join public.profiles pr on pr.id = v.profile_id where r.id = v_choice.profile_resolution_id;
  if v_base_code is distinct from p->'tailoring'->>'base' then
    raise exception '%''s control baseline is %, not the last overlay layer % that npm run seed:demo-baseline applies.',
      p->>'programCode', coalesce(v_base_code, 'unnamed'), p->'tailoring'->>'base';
  end if;
  v_catalog := v_choice.catalog_revision_id;
  select id into v_ssp1 from public.ssp_revisions where tenant_id = t and system_id = v_boundary order by version_number limit 1;
  if v_ssp1 is null then
    raise exception '% has no SSP to carry forward. Run the demo import (npm run seed:demo) first.', p->>'boundaryCode';
  end if;

  -- People: the two the scenario adds, then every role must name someone.
  for v_name in select jsonb_array_elements_text(p->'addedPeople') loop
    if not exists (select 1 from public.parties where tenant_id = t and name = v_name) then
      v_id := pg_temp.sid(t, 'parties/' || v_name);
      insert into public.parties (id, tenant_id, party_type, name) values (v_id, t, 'person', v_name);
      perform pg_temp.track('parties', v_id, 'parties/' || v_name, 'people');
    end if;
  end loop;
  for v_name in select jsonb_object_keys(p->'people') loop perform pg_temp.person(p, v_name); end loop;

  -- A reference baseline for each program that has none.
  for v_item in select value from jsonb_array_elements(p->'programBaselines') loop
    select id into v_id from public.programs where tenant_id = t and code = v_item->>'program';
    if v_id is null then raise exception 'Program % is not in this workspace.', v_item->>'program'; end if;
    if exists (select 1 from public.program_reference_choices where tenant_id = t and program_id = v_id) then
      v_skipped := v_skipped || jsonb_build_object('program', v_item->>'program', 'reason', 'already has a control baseline');
      continue;
    end if;
    select * into v_resolution, v_cat from pg_temp.reference_baseline(v_item->>'baseline');
    v_other := pg_temp.sid(t, 'program_reference_choices/' || (v_item->>'program'));
    insert into public.program_reference_choices (id, tenant_id, program_id, catalog_revision_id, profile_resolution_id)
      values (v_other, t, v_id, v_cat, v_resolution);
    perform pg_temp.track('program_reference_choices', v_other, 'program_reference_choices/' || (v_item->>'program'), 'programBaselines');
  end loop;

  -- WS-X90's own tailoring: SA-24 with its five parameters, and the controls behind its techniques.
  if exists (select 1 from jsonb_array_elements(p->'tailoring'->'include') d
      where not exists (select 1 from public.controls c where c.catalog_revision_id = v_catalog and c.code = d.value->>0)) then
    raise exception 'The tailoring names a control the catalog does not hold.';
  end if;
  select jsonb_agg(jsonb_build_object('controlId', c.id, 'action', 'include', 'rationale', d.value->>1) order by d.n)
    into v_decisions
    from jsonb_array_elements(p->'tailoring'->'include') with ordinality d(value, n)
    join public.controls c on c.catalog_revision_id = v_catalog and c.code = d.value->>0;
  select jsonb_agg(jsonb_build_object('parameterId', pm.id, 'values', p->'tailoring'->'sa24'->x.slot,
      'rationale', p->'tailoring'->'sa24'->>'rationale') order by x.source_id)
    into v_params
    from public.parameters pm
    join public.controls c on c.id = pm.control_id and c.catalog_revision_id = v_catalog and c.source_id = 'sa-24'
    join (values ('sa-24_odp.01', 'goals'), ('sa-24_odp.02', 'objectives'), ('sa-24_odp.03', 'techniques'),
      ('sa-24_odp.04', 'approaches'), ('sa-24_odp.05', 'designPrinciples')) x(source_id, slot) on x.source_id = pm.source_id
    where pm.catalog_revision_id = v_catalog;
  if jsonb_array_length(coalesce(v_params, '[]')) <> 5 then
    raise exception 'SA-24 should have five parameters in this catalog edition; found %.', jsonb_array_length(coalesce(v_params, '[]'));
  end if;
  v_tailored := public.author_tailored_profile(t, v_catalog, v_choice.profile_resolution_id, v_decisions, v_params,
    p->'tailoring'->>'code', p->'tailoring'->>'title', p->'tailoring'->>'remarks');
  update public.program_reference_choices set profile_resolution_id = v_tailored, revision = revision + 1 where id = v_choice.id;
  v_moved := jsonb_build_object('program', p->>'programCode', 'from', v_base_code, 'to', p->'tailoring'->>'code',
    'controls', (select count(*) from public.selected_controls where profile_resolution_id = v_tailored));
  select v.profile_id into v_id from public.profile_resolutions r join public.profile_revisions v on v.id = r.profile_revision_id where r.id = v_tailored;
  perform pg_temp.track('profiles', v_id, 'profiles/' || (p->'tailoring'->>'code'), 'tailoring');
  perform pg_temp.track('profile_resolutions', v_tailored, 'profile_resolutions/' || (p->'tailoring'->>'code'), 'tailoring');

  -- The boundary's configuration baselines: Block 1 published, then Block 1.1 proposed.
  select coalesce(max(version_number), 0) into v_ver from public.configuration_baselines where tenant_id = t and system_id = v_boundary;
  v_cb1 := pg_temp.sid(t, 'configuration_baselines/block-1');
  v_cb2 := pg_temp.sid(t, 'configuration_baselines/block-1.1');
  insert into public.configuration_baselines (id, tenant_id, system_id, version_number, state, name, description)
  values (v_cb1, t, v_boundary, v_ver + 1, 'draft', p->'configurationBaselines'->'published'->>'name', p->'configurationBaselines'->'published'->>'description'),
         (v_cb2, t, v_boundary, v_ver + 2, 'draft', p->'configurationBaselines'->'proposed'->>'name', p->'configurationBaselines'->'proposed'->>'description');
  insert into public.component_pins (id, tenant_id, system_id, configuration_baseline_id, system_component_id, defined_component_id, version, configuration_description, content_sha256)
  select pg_temp.sid(t, 'component_pins/' || b.key || '/' || c.code), t, v_boundary, b.id, c.id, c.defined_component_id,
    coalesce(m.value->>b.slot, c.version),
    case when b.slot = 0 then 'As assessed for the initial authorization.' else coalesce(m.value->>2, 'Unchanged from Block 1.') end,
    encode(extensions.digest(b.key || '/' || c.code || '/' || coalesce(m.value->>b.slot, c.version, ''), 'sha256'), 'hex')
  from public.system_components c
  cross join (values (v_cb1, 'block-1', 0), (v_cb2, 'block-1.1', 1)) b(id, key, slot)
  left join jsonb_each(p->'configurationBaselines'->'versions') m on m.key = c.code
  where c.tenant_id = t and c.system_id = v_boundary;
  update public.configuration_baselines set state = 'published', revision = revision + 1,
    published_at = (p->'configurationBaselines'->'published'->>'publishedAt')::timestamptz where id = v_cb1;
  perform pg_temp.track('configuration_baselines', v_cb1, 'configuration_baselines/block-1', 'configurationBaselines');
  perform pg_temp.track('configuration_baselines', v_cb2, 'configuration_baselines/block-1.1', 'configurationBaselines');
  insert into pg_temp.showcase_tracked
    select 'component_pins', id, 'component_pins/' || id, 'configurationBaselines' from public.component_pins
    where configuration_baseline_id in (v_cb1, v_cb2);

  -- The corporate identity provider: its SSP, published, and the capabilities it offers.
  select id into v_idp_program from public.programs where tenant_id = t and code = p->'provider'->>'program';
  select id into v_idp from public.systems where tenant_id = t and program_id = v_idp_program
    and code = p->'provider'->>'system' and is_authorization_boundary;
  if v_idp is null then
    raise exception 'System % of % is not in this workspace as an authorization boundary.', p->'provider'->>'system', p->'provider'->>'program';
  end if;
  select profile_resolution_id into v_idp_resolution from public.program_reference_choices
    where tenant_id = t and program_id = v_idp_program order by created_at limit 1;
  if v_idp_resolution is null then
    raise exception '% has no control baseline for its SSP.', p->'provider'->>'program';
  end if;
  for v_item in select value from jsonb_array_elements(p->'provider'->'components') loop
    v_id := pg_temp.sid(t, 'system_components/' || (v_item->>0));
    insert into public.system_components (id, tenant_id, system_id, code, name, component_type, status, description)
      values (v_id, t, v_idp, v_item->>0, v_item->>1, v_item->>2, 'operational', v_item->>3);
    perform pg_temp.track('system_components', v_id, 'system_components/' || (v_item->>0), 'provider');
  end loop;
  select coalesce(max(version_number), 0) + 1 into v_ver from public.ssp_revisions where tenant_id = t and system_id = v_idp;
  v_idp_ssp := pg_temp.sid(t, 'ssp_revisions/provider');
  insert into public.ssp_revisions (id, tenant_id, system_id, profile_resolution_id, version_number, state, description)
    values (v_idp_ssp, t, v_idp, v_idp_resolution, v_ver, 'draft', p->'provider'->>'sspDescription');
  perform pg_temp.track('ssp_revisions', v_idp_ssp, 'ssp_revisions/provider', 'provider');
  for v_code, v_entry in select key, value from jsonb_each(p->'provider'->'controls') loop
    select sc.id into v_other from public.selected_controls sc join public.controls k on k.id = sc.control_id
      where sc.profile_resolution_id = v_idp_resolution and k.code = v_code;
    if v_other is null then
      v_skipped := v_skipped || jsonb_build_object('control', v_code, 'reason', 'not in the provider''s control baseline');
      continue;
    end if;
    v_id := pg_temp.sid(t, 'provider/ir/' || v_code);
    insert into public.implemented_requirements (id, tenant_id, ssp_revision_id, selected_control_id, implementation_status, description)
      values (v_id, t, v_idp_ssp, v_other, 'implemented', v_entry->>1);
    insert into public.component_contributions (id, tenant_id, ssp_revision_id, implemented_requirement_id, system_component_id, description, implementation_status)
      values (pg_temp.sid(t, 'provider/contribution/' || v_code), t, v_idp_ssp, v_id,
        pg_temp.sid(t, 'system_components/' || (v_entry->>0)), v_entry->>1, 'implemented');
    perform pg_temp.track('implemented_requirements', v_id, 'provider/ir/' || v_code, 'provider');
    perform pg_temp.track('component_contributions', pg_temp.sid(t, 'provider/contribution/' || v_code), 'provider/contribution/' || v_code, 'provider');
  end loop;
  update public.ssp_revisions set state = 'published', revision = revision + 1,
    published_at = (p->'provider'->>'publishedAt')::timestamptz where id = v_idp_ssp;
  for v_item in select value from jsonb_array_elements(p->'provider'->'capabilities') loop
    if exists (select 1 from public.provider_capabilities where tenant_id = t and code = v_item->>'code') then
      raise exception 'Provider capability % already exists in this workspace.', v_item->>'code';
    end if;
    v_cap := pg_temp.sid(t, 'provider_capabilities/' || (v_item->>'code'));
    insert into public.provider_capabilities (id, tenant_id, code, name, description, providing_system_id)
      values (v_cap, t, v_item->>'code', v_item->>'name', v_item->>'description', v_idp);
    perform pg_temp.track('provider_capabilities', v_cap, 'provider_capabilities/' || (v_item->>'code'), 'provider');
    for v_code in select jsonb_array_elements_text(v_item->'controls') loop
      continue when not exists (select 1 from public.component_contributions where id = pg_temp.sid(t, 'provider/contribution/' || v_code));
      v_id := pg_temp.sid(t, 'offered_implementations/' || (v_item->>'code') || '/' || v_code);
      insert into public.offered_implementations (id, tenant_id, provider_capability_id, ssp_revision_id, component_contribution_id, name, description, consumer_responsibility, state, published_at)
        values (v_id, t, v_cap, v_idp_ssp, pg_temp.sid(t, 'provider/contribution/' || v_code), (v_item->>'name') || ' — ' || v_code,
          p->'provider'->'controls'->v_code->>1, v_item->>'responsibility', 'published', (p->'provider'->>'offeredAt')::timestamptz);
      v_offered := v_offered || v_id;
      perform pg_temp.track('offered_implementations', v_id, 'offered_implementations/' || (v_item->>'code') || '/' || v_code, 'provider');
    end loop;
  end loop;

  -- WS-X90's SSP 2, on the tailored baseline and Block 1, inheriting the identity provider's
  -- offerings; published before the assessment plans pin it.
  select jsonb_object_agg(d.value->>0, 'Planned: ' || (d.value->>1)) into v_planned from jsonb_array_elements(p->'tailoring'->'include') d;
  select coalesce(max(version_number), 0) into v_ver from public.ssp_revisions where tenant_id = t and system_id = v_boundary;
  v_ssp2 := pg_temp.sid(t, 'ssp_revisions/authorized');
  perform pg_temp.copy_ssp(t, v_ssp1, v_ssp2, v_boundary, v_tailored, v_ver + 1, p->'ssp'->'authorized'->>'description', v_cb1, v_planned, 'ssp_revisions/authorized');
  insert into public.inheritance_acceptances (id, tenant_id, ssp_revision_id, implemented_requirement_id, offered_implementation_id, accepted_by_party_id, accepted_at, rationale, consumer_responsibility)
  select pg_temp.sid(t, 'ssp_revisions/authorized/acceptance/' || o.id), t, v_ssp2, m.new_ir, o.id, pg_temp.person(p, 'isso'),
    (p->'provider'->>'acceptedAt')::timestamptz,
    'Inherited from the corporate identity provider''s ' || pc.name || ' (' || pc.code || '); WS-X90 keeps the consumer responsibility.',
    o.consumer_responsibility
  from public.offered_implementations o
  join public.provider_capabilities pc on pc.id = o.provider_capability_id
  join public.component_contributions cc on cc.id = o.component_contribution_id
  join public.implemented_requirements pir on pir.id = cc.implemented_requirement_id
  join public.selected_controls psc on psc.id = pir.selected_control_id
  join pg_temp.showcase_ir_map m on m.control_id = psc.control_id
  where o.id = any(v_offered);
  insert into pg_temp.showcase_tracked
    select 'inheritance_acceptances', id, 'ssp_revisions/authorized/acceptance/' || id, 'ssp' from public.inheritance_acceptances where ssp_revision_id = v_ssp2;
  update public.ssp_revisions set state = 'published', revision = revision + 1,
    published_at = (p->'ssp'->'authorized'->>'publishedAt')::timestamptz where id = v_ssp2;

  -- SSP 3, the working draft: Block 1.1, the same inheritance, the tailored-in controls' progress.
  v_ssp3 := pg_temp.sid(t, 'ssp_revisions/working');
  perform pg_temp.copy_ssp(t, v_ssp2, v_ssp3, v_boundary, v_tailored, v_ver + 2, p->'ssp'->'working'->>'description', v_cb2, v_planned, 'ssp_revisions/working');
  insert into public.inheritance_acceptances (id, tenant_id, ssp_revision_id, implemented_requirement_id, offered_implementation_id, accepted_by_party_id, accepted_at, rationale, consumer_responsibility)
  select pg_temp.sid(t, 'ssp_revisions/working/acceptance/' || a.id), t, v_ssp3, m.new_ir, a.offered_implementation_id,
    a.accepted_by_party_id, a.accepted_at, a.rationale, a.consumer_responsibility
  from public.inheritance_acceptances a
  join pg_temp.showcase_ir_map m on m.source_ir = a.implemented_requirement_id
  where a.ssp_revision_id = v_ssp2;
  insert into pg_temp.showcase_tracked
    select 'inheritance_acceptances', id, 'ssp_revisions/working/acceptance/' || id, 'ssp' from public.inheritance_acceptances where ssp_revision_id = v_ssp3;
  update public.implemented_requirements i set implementation_status = g.value->>0, description = g.value->>1, revision = i.revision + 1
  from jsonb_each(p->'tailoredProgress') g, public.selected_controls sc, public.controls k
  where i.ssp_revision_id = v_ssp3 and sc.id = i.selected_control_id and k.id = sc.control_id and k.code = g.key;

  -- WS-X90's two assessments, as the archived prototype recorded them: each archived result is a
  -- determination on its control (pg_temp.write_determinations), and only a control whose
  -- requirements cite evidence takes one.
  insert into pg_temp.showcase_evidenced
  select distinct l.control_id
  from public.requirement_control_links l
  join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
  join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
  join public.requirement_evidence re on re.requirement_revision_id = v.id
  join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  where q.tenant_id = t and q.program_id = v_program
    and v.version_number = (select max(x.version_number) from public.requirement_revisions x
      where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id);

  -- The initial authorization assessment: its plan pins SSP 2, its published results judge the
  -- original 74-control scope.
  select id into v_campaign from public.assessment_campaigns
    where tenant_id = t and program_id = v_program and title = p->'assessments'->'initial'->>'campaign';
  if v_campaign is null then
    raise exception 'Campaign "%" is not in this workspace. Run the demo import first.', p->'assessments'->'initial'->>'campaign';
  end if;
  select coalesce(max(version_number), 0) + 1 into v_ver from public.assessment_plan_revisions where tenant_id = t and campaign_id = v_campaign;
  v_initial_plan := pg_temp.sid(t, 'assessment_plan_revisions/initial');
  insert into public.assessment_plan_revisions (id, tenant_id, version_number, state, campaign_id, ssp_revision_id, title, description)
    values (v_initial_plan, t, v_ver, 'draft', v_campaign, v_ssp2, p->'assessments'->'initial'->>'plan', p->'assessments'->'initial'->>'planDescription');
  v_id := pg_temp.sid(t, 'assessment_subjects/initial');
  insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
    values (v_id, t, v_initial_plan, 'The WS-X90 authorization boundary', v_boundary);
  perform pg_temp.track('assessment_subjects', v_id, 'assessment_subjects/initial', 'assessments');
  update public.assessment_plan_revisions set state = 'published', revision = revision + 1, published_by_party_id = pg_temp.person(p, 'controlAssessor'),
    published_at = (p->'assessments'->'initial'->>'planPublishedAt')::timestamptz where id = v_initial_plan;
  perform pg_temp.track('assessment_plan_revisions', v_initial_plan, 'assessment_plan_revisions/initial', 'assessments');
  v_initial_results := pg_temp.sid(t, 'assessment_results_revisions/initial');
  insert into public.assessment_results_revisions (id, tenant_id, version_number, state, assessment_plan_revision_id, title, description)
    values (v_initial_results, t, 1, 'draft', v_initial_plan, p->'assessments'->'initial'->>'results', p->'assessments'->'initial'->>'resultsDescription');
  v_set := pg_temp.sid(t, 'result_sets/initial');
  insert into public.result_sets (id, tenant_id, assessment_results_revision_id, title, starts_at, ends_at)
    values (v_set, t, v_initial_results, p->'assessments'->'initial'->>'resultSet',
      (p->'assessments'->'initial'->>'startsAt')::timestamptz, (p->'assessments'->'initial'->>'endsAt')::timestamptz);
  perform pg_temp.write_determinations(p, v_initial_results, v_set, p->'assessments'->'initial'->'determinations', 'initial', v_tailored);
  update public.assessment_results_revisions set state = 'published', revision = revision + 1, published_by_party_id = pg_temp.person(p, 'controlAssessor'),
    published_at = (p->'assessments'->'initial'->>'resultsPublishedAt')::timestamptz where id = v_initial_results;
  perform pg_temp.track('assessment_results_revisions', v_initial_results, 'assessment_results_revisions/initial', 'assessments');
  perform pg_temp.track('result_sets', v_set, 'result_sets/initial', 'assessments');

  -- The expanded control set assessment, under way: a published plan, its first increment's
  -- results published and the second's a draft, which decides nothing until it is published.
  select id into v_campaign from public.assessment_campaigns
    where tenant_id = t and program_id = v_program and title = p->'assessments'->'expanded'->>'campaign';
  if v_campaign is not null then
    select coalesce(max(version_number), 0) + 1 into v_ver from public.assessment_plan_revisions where tenant_id = t and campaign_id = v_campaign;
    v_plan := pg_temp.sid(t, 'assessment_plan_revisions/expanded');
    insert into public.assessment_plan_revisions (id, tenant_id, version_number, state, campaign_id, ssp_revision_id, title, description)
      values (v_plan, t, v_ver, 'draft', v_campaign, v_ssp2, p->'assessments'->'expanded'->>'plan', p->'assessments'->'expanded'->>'planDescription');
    v_id := pg_temp.sid(t, 'assessment_subjects/expanded');
    insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
      values (v_id, t, v_plan, 'The WS-X90 authorization boundary', v_boundary);
    perform pg_temp.track('assessment_subjects', v_id, 'assessment_subjects/expanded', 'assessments');
    update public.assessment_plan_revisions set state = 'published', revision = revision + 1, published_by_party_id = pg_temp.person(p, 'controlAssessor'),
      published_at = (p->'assessments'->'expanded'->>'planPublishedAt')::timestamptz where id = v_plan;
    perform pg_temp.track('assessment_plan_revisions', v_plan, 'assessment_plan_revisions/expanded', 'assessments');
    for v_entry, v_ordinal in select value, n from jsonb_array_elements(p->'assessments'->'expanded'->'increments') with ordinality x(value, n) loop
      v_results := pg_temp.sid(t, 'assessment_results_revisions/expanded/' || v_ordinal);
      insert into public.assessment_results_revisions (id, tenant_id, version_number, state, assessment_plan_revision_id, title, description)
        values (v_results, t, v_ordinal, 'draft', v_plan, v_entry->>'results', v_entry->>'resultsDescription');
      v_set := pg_temp.sid(t, 'result_sets/expanded/' || v_ordinal);
      insert into public.result_sets (id, tenant_id, assessment_results_revision_id, title, starts_at, ends_at)
        values (v_set, t, v_results, v_entry->>'resultSet', (v_entry->>'startsAt')::timestamptz, (v_entry->>'endsAt')::timestamptz);
      perform pg_temp.write_determinations(p, v_results, v_set, v_entry->'determinations', 'expanded/' || v_ordinal, v_tailored);
      if v_entry ? 'publishedAt' then
        update public.assessment_results_revisions set state = 'published', revision = revision + 1, published_by_party_id = pg_temp.person(p, 'controlAssessor'),
          published_at = (v_entry->>'publishedAt')::timestamptz where id = v_results;
      end if;
      perform pg_temp.track('assessment_results_revisions', v_results, 'assessment_results_revisions/expanded/' || v_ordinal, 'assessments');
      perform pg_temp.track('result_sets', v_set, 'result_sets/expanded/' || v_ordinal, 'assessments');
    end loop;
  else
    v_skipped := v_skipped || jsonb_build_object('campaign', p->'assessments'->'expanded'->>'campaign', 'reason', 'not in this workspace');
  end if;

  -- Continuous monitoring: a campaign for the fiscal year, its draft plan on SSP 2, and the
  -- schedule, which stays a draft so its tasks can move.
  v_monitoring := pg_temp.sid(t, 'assessment_campaigns/monitoring/' || (p->'monitoring'->>'fiscalYear'));
  insert into public.assessment_campaigns (id, tenant_id, title, description, program_id, owner_party_id, status, starts_at, ends_at)
    values (v_monitoring, t, (p->'monitoring'->>'campaign') || ' — ' || (p->'monitoring'->>'fiscalYear'), p->'monitoring'->>'planDescription',
      v_program, pg_temp.person(p, 'isso'), 'active', (p->'monitoring'->>'startsAt')::timestamptz, (p->'monitoring'->>'endsAt')::timestamptz);
  perform pg_temp.track('assessment_campaigns', v_monitoring, 'assessment_campaigns/monitoring', 'monitoring');
  v_plan := pg_temp.sid(t, 'assessment_plan_revisions/monitoring');
  insert into public.assessment_plan_revisions (id, tenant_id, version_number, state, campaign_id, ssp_revision_id, title, description)
    values (v_plan, t, 1, 'draft', v_monitoring, v_ssp2, (p->'monitoring'->>'plan') || ' — ' || (p->'monitoring'->>'fiscalYear'), p->'monitoring'->>'planDescription');
  perform pg_temp.track('assessment_plan_revisions', v_plan, 'assessment_plan_revisions/monitoring', 'monitoring');
  v_id := pg_temp.sid(t, 'assessment_subjects/monitoring');
  insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
    values (v_id, t, v_plan, 'The WS-X90 authorization boundary', v_boundary);
  perform pg_temp.track('assessment_subjects', v_id, 'assessment_subjects/monitoring', 'monitoring');
  for v_item, v_ordinal in select value, n from jsonb_array_elements(p->'monitoring'->'schedule') with ordinality s(value, n) loop
    v_id := pg_temp.sid(t, 'scheduled_assessment_tasks/' || v_ordinal);
    insert into public.scheduled_assessment_tasks (id, tenant_id, plan_revision_id, title, description, owner_party_id, status, starts_at, due_on)
      values (v_id, t, v_plan, v_item->>'title', v_item->>'description', pg_temp.person(p, v_item->>'owner'), v_item->>'status',
        (v_item->>'startsAt')::timestamptz, (v_item->>'dueOn')::date);
    perform pg_temp.track('scheduled_assessment_tasks', v_id, 'scheduled_assessment_tasks/' || v_ordinal, 'monitoring');
  end loop;

  -- WS-X90's gates, and the security outcomes drawn into four of them through the product's own
  -- command, as the account the seed names.
  if exists (select 1 from public.lifecycle_gates where tenant_id = t and program_id = v_program) then
    v_skipped := v_skipped || jsonb_build_object('gates', p->>'programCode', 'reason', 'the program already has lifecycle gates');
  else
    for v_item, v_ordinal in select value, n from jsonb_array_elements(p->'gates') with ordinality g(value, n) loop
      v_gate := pg_temp.sid(t, 'lifecycle_gates/' || (v_item->>0));
      insert into public.lifecycle_gates (id, tenant_id, program_id, title, sequence_number, status, due_on, decided_at)
        values (v_gate, t, v_program, v_item->>0, v_ordinal, v_item->>1, (v_item->>2)::date,
          case when v_item->>1 in ('completed', 'passed') then ((v_item->>2) || 'T17:00:00Z')::timestamptz end);
      perform pg_temp.track('lifecycle_gates', v_gate, 'lifecycle_gates/' || (v_item->>0), 'gates');
      if jsonb_array_length(coalesce(v_item->3, '[]')) > 0 then
        select array_agg(pg_temp.framework_item('nist-sp800-160v1r1-processes', c)) into v_ids from jsonb_array_elements_text(v_item->3) c;
        if array_position(v_ids, null) is not null then
          raise exception 'Gate "%" names a security outcome the life cycle processes do not hold.', v_item->>0;
        end if;
        perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
        perform public.add_gate_security_outcomes(t, v_gate, pg_temp.sid(t, 'gate_outcome_requests/' || (v_item->>0)), v_ids);
        perform set_config('request.jwt.claims', '', true);
      end if;
    end loop;
    for v_item in select value from jsonb_array_elements(p->'writtenCriteria') loop
      v_gate := pg_temp.sid(t, 'lifecycle_gates/' || (v_item->>0));
      v_id := pg_temp.sid(t, 'gate_criteria/' || (v_item->>0) || '/' || (v_item->>1));
      insert into public.gate_criteria (id, tenant_id, gate_id, title, required, sequence_number)
        values (v_id, t, v_gate, v_item->>1, true,
          (select coalesce(max(sequence_number), 0) + 1 from public.gate_criteria where tenant_id = t and gate_id = v_gate));
    end loop;
    insert into pg_temp.showcase_tracked
      select 'gate_criteria', c.id, 'gate_criteria/' || c.id, 'gates' from public.gate_criteria c
      join public.lifecycle_gates g on g.id = c.gate_id where g.tenant_id = t and g.program_id = v_program;
  end if;

  -- Authorization packages, their versions, documents, reviews and decisions.
  for v_item in select value from jsonb_array_elements(p->'packages') loop
    select s.id into v_other from public.systems s join public.programs pr on pr.id = s.program_id
      where s.tenant_id = t and pr.code = v_item->>'program' and s.code = v_item->>'system' and s.is_authorization_boundary;
    if v_other is null then raise exception 'System % of % is not in this workspace as an authorization boundary.', v_item->>'system', v_item->>'program'; end if;
    v_owner := pg_temp.person(p, v_item->>'owner');
    v_package := pg_temp.sid(t, 'authorization_packages/' || (v_item->>'key'));
    insert into public.authorization_packages (id, tenant_id, program_id, system_id, title, owner_party_id)
      values (v_package, t, (select program_id from public.systems where id = v_other), v_other, v_item->>'title', v_owner);
    perform pg_temp.track('authorization_packages', v_package, 'authorization_packages/' || (v_item->>'key'), 'packages');
    for v_entry, v_ordinal in select value, n from jsonb_array_elements(v_item->'versions') with ordinality x(value, n) loop
      v_revision := pg_temp.sid(t, 'package_revisions/' || (v_item->>'key') || '/' || v_ordinal);
      insert into public.package_revisions (id, tenant_id, version_number, state, package_id, description, submitted_at)
        values (v_revision, t, v_ordinal, 'draft', v_package, v_entry->>'description', (v_entry->>'submittedAt')::timestamptz);
      perform pg_temp.track('package_revisions', v_revision, 'package_revisions/' || (v_item->>'key') || '/' || v_ordinal, 'packages');
      if v_entry->'documents' ? 'ssp' then
        insert into public.package_documents (id, tenant_id, package_revision_id, title, ssp_revision_id)
          values (pg_temp.sid(t, 'package_documents/' || v_revision || '/ssp'), t, v_revision, 'System security plan', v_ssp2);
      end if;
      if v_entry->'documents' ? 'plan' then
        insert into public.package_documents (id, tenant_id, package_revision_id, title, assessment_plan_revision_id)
          values (pg_temp.sid(t, 'package_documents/' || v_revision || '/plan'), t, v_revision, 'Security assessment plan', v_initial_plan);
      end if;
      if v_entry->'documents' ? 'results' then
        insert into public.package_documents (id, tenant_id, package_revision_id, title, assessment_results_revision_id)
          values (pg_temp.sid(t, 'package_documents/' || v_revision || '/results'), t, v_revision, 'Security assessment report', v_initial_results);
      end if;
      if v_entry->'documents' ? 'evidence' then
        insert into public.package_documents (id, tenant_id, package_revision_id, title, evidence_version_id)
        select pg_temp.sid(t, 'package_documents/' || v_revision || '/evidence/' || ev.id), t, v_revision, a.title, ev.id
        from public.evidence_versions ev join public.evidence_artifacts a on a.id = ev.artifact_id
        where a.tenant_id = t and a.program_id = (select program_id from public.systems where id = v_other) and ev.state = 'published'
          and a.title ~* '(penetration|incident response capability|contingency|vulnerability)'
        order by a.title limit 4;
      end if;
      insert into pg_temp.showcase_tracked
        select 'package_documents', id, 'package_documents/' || id, 'packages' from public.package_documents where package_revision_id = v_revision;
      if v_entry ? 'publishedAt' then
        update public.package_revisions set state = 'published', revision = revision + 1, published_by_party_id = v_owner,
          published_at = (v_entry->>'publishedAt')::timestamptz where id = v_revision;
      end if;
      if v_entry ? 'review' then
        v_id := pg_temp.sid(t, 'review_decisions/' || v_revision);
        insert into public.review_decisions (id, tenant_id, package_revision_id, reviewer_party_id, decision, rationale, decided_at)
          values (v_id, t, v_revision, pg_temp.person(p, v_entry->'review'->>0), v_entry->'review'->>1, v_entry->'review'->>2, (v_entry->'review'->>3)::timestamptz);
        perform pg_temp.track('review_decisions', v_id, 'review_decisions/' || v_revision, 'packages');
      end if;
      if v_entry ? 'decision' then
        v_id := pg_temp.sid(t, 'authorization_decisions/' || v_revision);
        insert into public.authorization_decisions (id, tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at, effective_on, expires_on, conditions)
          values (v_id, t, v_revision, pg_temp.person(p, v_entry->'decision'->>'by'), v_entry->'decision'->>'decision', v_entry->'decision'->>'rationale',
            (v_entry->'decision'->>'decidedAt')::timestamptz, (v_entry->'decision'->>'effectiveOn')::date, (v_entry->'decision'->>'expiresOn')::date,
            v_entry->'decision'->>'conditions');
        perform pg_temp.track('authorization_decisions', v_id, 'authorization_decisions/' || v_revision, 'packages');
      end if;
    end loop;
  end loop;

  -- Scanner imports.
  for v_item in select value from jsonb_array_elements(p->'scans') loop
    select id into v_other from public.programs where tenant_id = t and code = v_item->>'program';
    continue when v_other is null;
    for v_entry in select value from jsonb_array_elements(v_item->'jobs') loop
      v_id := pg_temp.sid(t, 'ingestion_jobs/' || (v_entry->>'sourceUri'));
      insert into public.ingestion_jobs (id, tenant_id, title, program_id, source_uri, source_media_type, source_sha256, status, requested_by_party_id, started_at, completed_at, summary)
        values (v_id, t, v_entry->>'title', v_other, v_entry->>'sourceUri', v_entry->>'mediaType', v_entry->>'sha256', v_entry->>'status',
          pg_temp.person(p, 'platform'), (v_entry->>'startedAt')::timestamptz, (v_entry->>'completedAt')::timestamptz, v_entry->>'summary');
      perform pg_temp.track('ingestion_jobs', v_id, 'ingestion_jobs/' || (v_entry->>'sourceUri'), 'scans');
    end loop;
  end loop;

  -- The ATT&CK techniques each named WS-X90 risk concerns.
  for v_name, v_entry in select key, value from jsonb_each(p->'riskTechniques') loop
    select id into v_other from public.risks where tenant_id = t and program_id = v_program and title = v_name order by id limit 1;
    if v_other is null then
      v_skipped := v_skipped || jsonb_build_object('risk', v_name, 'reason', 'not in this workspace');
      continue;
    end if;
    for v_code in select jsonb_array_elements_text(v_entry) loop
      v_cap := pg_temp.framework_item('nist-sp800-160v2r1-attack', v_code);
      if v_cap is null then raise exception 'Appendix F has no ATT&CK technique %.', v_code; end if;
      continue when exists (select 1 from public.risk_attack_techniques where risk_id = v_other and framework_item_id = v_cap);
      v_id := pg_temp.sid(t, 'risk_attack_techniques/' || v_other || '/' || v_code);
      insert into public.risk_attack_techniques (id, tenant_id, risk_id, framework_item_id) values (v_id, t, v_other, v_cap);
      perform pg_temp.track('risk_attack_techniques', v_id, 'risk_attack_techniques/' || v_other || '/' || v_code, 'riskTechniques');
    end loop;
  end loop;

  -- ——— Issue requirements: begin (issue_requirements, migration operational_issue_requirements) ———
  -- The requirement each named WS-X90 operational issue is about: six "Unmet requirement" issues
  -- that cite no evidence, and so stand nowhere on the program's Posture until they name it.
  for v_name, v_code in select key, value from jsonb_each_text(p->'issueRequirements') loop
    select id into v_other from public.operational_issues
      where tenant_id = t and program_id = v_program and title = v_name order by id limit 1;
    if v_other is null then
      v_skipped := v_skipped || jsonb_build_object('issue', v_name, 'reason', 'not in this workspace');
      continue;
    end if;
    select id into v_cap from public.engineering_requirements
      where tenant_id = t and program_id = v_program and code = v_code;
    if v_cap is null then
      raise exception 'Requirement % is not in %. Run the demo import (npm run seed:demo) first.', v_code, p->>'programCode';
    end if;
    continue when exists (select 1 from public.issue_requirements
      where tenant_id = t and issue_id = v_other and engineering_requirement_id = v_cap);
    v_id := pg_temp.sid(t, 'issue_requirements/' || v_other || '/' || v_code);
    insert into public.issue_requirements (id, tenant_id, program_id, issue_id, engineering_requirement_id)
      values (v_id, t, v_program, v_other, v_cap);
    perform pg_temp.track('issue_requirements', v_id, 'issue_requirements/' || v_other || '/' || v_code, 'issueRequirements');
  end loop;
  -- ——— Issue requirements: end ———

  -- An assessor's review of each published WS-X90 evidence version that has none, as the archived
  -- results examined it: accepted, needs revision, or pending where no result has examined it yet.
  insert into public.evidence_reviews (id, tenant_id, evidence_version_id, reviewer_party_id, decision, rationale, reviewed_at)
  select pg_temp.sid(t, 'evidence_reviews/' || ev.id), t, ev.id, pg_temp.person(p, 'assessor'),
    coalesce(x.value->>'decision', 'pending'), x.value->>'rationale', (x.value->>'reviewedAt')::timestamptz
  from public.evidence_versions ev
  join public.evidence_artifacts a on a.id = ev.artifact_id
  left join public.demo_import_records r on r.tenant_id = t and r.dataset_id = p->>'legacyDatasetId'
    and r.destination_table = 'evidence_versions' and r.destination_id = ev.id
  left join jsonb_each(p->'evidenceReviews') x on x.key = split_part(r.source_key, ':', 1)
  where ev.tenant_id = t and a.program_id = v_program and ev.state = 'published'
    and not exists (select 1 from public.evidence_reviews rv where rv.evidence_version_id = ev.id);
  insert into pg_temp.showcase_tracked
    select 'evidence_reviews', r.id, 'evidence_reviews/' || r.id, 'evidenceReviews' from public.evidence_reviews r
    where r.tenant_id = t and r.id = pg_temp.sid(t, 'evidence_reviews/' || r.evidence_version_id);

  -- What the program's Overview will count, read as the account the seed names.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
  v_moved := v_moved || jsonb_build_object('controlStatus', public.program_control_status(v_program)->'totals',
    'resiliencyChoice', public.program_resiliency_choice(v_program) - 'unmatched');
  perform set_config('request.jwt.claims', '', true);

  -- Provenance: one batch, one source a section of the scenario, one record a row written.
  v_job := pg_temp.sid(t, 'ingestion_jobs/showcase');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Showcase demo seed', 'urn:program-assurance:demo:' || (p->>'datasetId'), 'completed', now(), now(),
      'Authored showcase records layered on the legacy demo import (scripts/demo/showcase-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(*) as n from pg_temp.showcase_tracked group by destination_table) c;
  v_batch := pg_temp.sid(t, 'demo_import_batches');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'datasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/showcase-scenario.mjs', 'asOf', p->>'asOf'),
      jsonb_build_object('tables', v_tables, 'baselineMoved', v_moved, 'skipped', v_skipped));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
  select pg_temp.sid(t, 'demo_import_sources/' || s.section), t, v_batch, '/' || s.section,
    encode(extensions.digest(coalesce(p->s.section, 'null'::jsonb)::text, 'sha256'), 'hex'), p->s.section
  from (select distinct section from pg_temp.showcase_tracked) s;
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.sid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'datasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || k.section, s.source_sha256, s.id, jsonb_build_object('section', k.section)
  from pg_temp.showcase_tracked k
  join public.demo_import_sources s on s.tenant_id = t and s.import_batch_id = v_batch and s.source_pointer = '/' || k.section;

  return jsonb_build_object(
    'changed', true,
    'baselineMoved', v_moved,
    'tables', v_tables,
    'records', (select count(*) from pg_temp.showcase_tracked),
    'skipped', v_skipped
  );
end;
$seed$;

-- What WS-X90's risks say of the threat and the weakness behind each, why each carries its
-- likelihood and impact, and when each response is due (showcase-scenario.mjs, riskAssessments).
-- Written into each risk's latest revision while it is a draft, and only where a field is empty,
-- so a second run changes nothing. It runs after pg_temp.seed_showcase, on the showcase's first run
-- and on a workspace that already holds the showcase, and records what it changed under the
-- showcase's batch: the section it read, and how many revisions and responses it filled.
create function pg_temp.showcase_list(p_items text[]) returns text language sql immutable as $$
  select case when cardinality(p_items) < 2 then coalesce(p_items[1], '')
    else array_to_string(p_items[1:cardinality(p_items) - 1], ', ') || ' and ' || p_items[cardinality(p_items)] end
$$;
create function pg_temp.seed_showcase_risk_details(p jsonb) returns jsonb language plpgsql as $details$
declare
  t uuid := (p->>'tenantId')::uuid;
  a jsonb := p->'riskAssessments';
  v_program uuid; v_batch uuid; v_revisions integer := 0; v_responses integer := 0; v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-showcase', 0));
  select id into v_batch from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId';
  if v_batch is null then
    return jsonb_build_object('changed', false, 'reason', 'This workspace does not hold the showcase.');
  end if;
  select id into v_program from public.programs where tenant_id = t and code = p->>'programCode';

  -- A risk the archive tells a story for, by its title.
  update public.risk_revisions v set
      threat = coalesce(v.threat, x.value->>0),
      vulnerability = coalesce(v.vulnerability, x.value->>1),
      assessment_rationale = coalesce(v.assessment_rationale, x.value->>2)
    from public.risks r, jsonb_each(a->'risks') x
    where r.tenant_id = t and r.program_id = v_program and r.title = x.key
      and v.tenant_id = t and v.risk_id = r.id and v.state = 'draft'
      and v.version_number = (select max(y.version_number) from public.risk_revisions y where y.risk_id = r.id)
      and (v.threat is null or v.vulnerability is null or v.assessment_rationale is null);
  get diagnostics v_count = row_count;
  v_revisions := v_revisions + v_count;

  -- A risk the import made from a failed requirement, written from the requirement: its kind (the
  -- second word of its title), its code, the controls it maps and the elements it is allocated to.
  update public.risk_revisions v set
      threat = coalesce(v.threat, replace(replace(w.words->>0, '{controls}', q.controls), '{elements}', q.elements)),
      vulnerability = coalesce(v.vulnerability,
        replace(replace(replace(w.words->>1, '{requirement}', q.code), '{controls}', q.controls), '{elements}', q.elements)),
      assessment_rationale = coalesce(v.assessment_rationale,
        replace(replace(replace(replace(replace(a->'fromRequirement'->>'rationale',
          '{likelihood}', a->'levels'->>v.likelihood), '{impact}', a->'levels'->>v.impact),
          '{requirement}', q.code), '{controls}', q.controls), '{elements}', q.elements))
    from public.risks r
    cross join lateral (
      select q.code, split_part(qv.title, ' ', 2) as kind,
        pg_temp.showcase_list(array(select distinct k.code from public.requirement_control_links l
          join public.controls k on k.id = l.control_id where l.requirement_revision_id = qv.id order by k.code)) as controls,
        pg_temp.showcase_list(array(select distinct s.name from public.requirement_allocations al
          join public.systems s on s.id = al.system_id where al.requirement_revision_id = qv.id order by s.name)) as elements
      from public.engineering_requirements q
      join public.requirement_revisions qv on qv.engineering_requirement_id = q.id
        and qv.version_number = (select max(z.version_number) from public.requirement_revisions z where z.engineering_requirement_id = q.id)
      where q.tenant_id = t and q.program_id = v_program and q.code = substring(r.title from 'REQ-[0-9]+')
    ) q
    cross join lateral (select a->'fromRequirement'->q.kind as words) w
    where r.tenant_id = t and r.program_id = v_program and r.title ~ '^Risk arising from REQ-[0-9]+$' and w.words is not null
      and v.tenant_id = t and v.risk_id = r.id and v.state = 'draft'
      and v.version_number = (select max(y.version_number) from public.risk_revisions y where y.risk_id = r.id)
      and (v.threat is null or v.vulnerability is null or v.assessment_rationale is null);
  get diagnostics v_count = row_count;
  v_revisions := v_revisions + v_count;

  -- Each response is due a span after the risk's trouble was first found, by the response and the
  -- risk's severity: the earliest day an issue it rests on was opened.
  update public.risk_responses x set
      due_at = (((f.first_found at time zone 'UTC')::date + (a->'due'->x.response_type->>v.severity)::integer)::text || 'T' || (a->>'dueAt'))::timestamptz
    from public.risk_revisions v
    join public.risks r on r.id = v.risk_id
    cross join lateral (
      select min(i.opened_at) as first_found
      from public.risk_observations ro
      join public.issue_observations io on io.tenant_id = ro.tenant_id and io.observation_id = ro.observation_id
      join public.operational_issues i on i.tenant_id = io.tenant_id and i.id = io.issue_id
      where ro.tenant_id = t and ro.risk_revision_id = v.id
    ) f
    where x.tenant_id = t and x.risk_revision_id = v.id and x.due_at is null
      and r.tenant_id = t and r.program_id = v_program and v.state = 'draft'
      and v.version_number = (select max(y.version_number) from public.risk_revisions y where y.risk_id = r.id)
      and f.first_found is not null and a->'due'->x.response_type ? v.severity;
  get diagnostics v_count = row_count;
  v_responses := v_count;

  -- What the step read and what it changed in the import's records, under the showcase's batch.
  if v_revisions + v_responses > 0 then
    insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
      values (pg_temp.sid(t, 'demo_import_sources/riskAssessments'), t, v_batch, '/riskAssessments',
        encode(extensions.digest(a::text, 'sha256'), 'hex'), a)
      on conflict (id) do nothing;
    update public.demo_import_batches set summary = summary || jsonb_build_object('updated',
        coalesce(summary->'updated', '{}'::jsonb) || jsonb_build_object(
          'risk_revisions', coalesce((summary->'updated'->>'risk_revisions')::integer, 0) + v_revisions,
          'risk_responses', coalesce((summary->'updated'->>'risk_responses')::integer, 0) + v_responses))
      where id = v_batch;
  end if;
  return jsonb_build_object('changed', v_revisions + v_responses > 0, 'riskRevisions', v_revisions, 'riskResponses', v_responses);
end;
$details$;
