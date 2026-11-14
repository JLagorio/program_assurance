-- The fifth step of the products seed, loaded by scripts/seed-demo-products.mjs after
-- seed-products.sql and seed-products-work.sql, whose helpers it uses (sid, bucket, determination,
-- reference_baseline, work_controls_of, read_work_delta, wday, wtime). The script calls
-- pg_temp.seed_product_detail(payload) in the same transaction.
--
-- It fills the records one click down: every task's comment and activity, every risk's task and
-- activity, every issue's task and remediation, every customer requirement's verification,
-- citation, discussion and owner, every control's narrative, statements and contributions, each
-- system's inventory, each campaign's procedures and runs, and a variant of the two products no
-- program had taken. Every record it writes is listed in demo_import_records under the dataset
-- `products-detail-v1`; what it changes in a record another step wrote is counted in the batch's
-- summary. It runs once a workspace.

create temp table product_detail_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;
create temp table product_detail_people (name text primary key, id uuid) on commit drop;
create temp table product_detail_updated (table_name text not null, n bigint not null) on commit drop;
create temp table product_detail_dets (
  element_id uuid, control_id uuid not null, determination text not null, rationale text
) on commit drop;

-- A stable identity for a record of this step.
create function pg_temp.did(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/products-detail-v1/' || p_key)::uuid
$$;
-- The id the fourth step gave a record it wrote itself, by its key.
create function pg_temp.w4(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/products-work-v1/' || p_key)::uuid
$$;
-- A record a command wrote in the fourth step, by the key its provenance lists it under.
create function pg_temp.w4prov(p_tenant uuid, p_table text, p_key text) returns uuid language sql stable as $$
  select destination_id from public.demo_import_records
  where tenant_id = p_tenant and dataset_id = 'products-work-v1' and destination_table = p_table and source_key = p_key
$$;
create function pg_temp.dtrack(p_table text, p_id uuid, p_key text, p_section text) returns uuid language sql as $$
  insert into pg_temp.product_detail_tracked values (p_table, p_id, p_key, p_section) returning destination_id
$$;
create function pg_temp.dupdated(p_table text, p_n bigint) returns void language sql as $$
  insert into pg_temp.product_detail_updated select p_table, p_n where p_n > 0
$$;
create function pg_temp.dwho(p_name text) returns uuid language plpgsql stable as $$
declare v uuid;
begin
  if p_name is null then return null; end if;
  select id into v from pg_temp.product_detail_people where name = p_name;
  if not found then raise exception 'The step names "%", who is not in its cast.', p_name; end if;
  return v;
end $$;
create function pg_temp.as_account(p jsonb) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
end $$;
create function pg_temp.as_seed() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;
-- An evidence version of the fourth step, or of this one: `key` its latest, `key@1` its first.
create function pg_temp.devidence(p_tenant uuid, p_code text, p_key text) returns uuid language plpgsql stable as $$
declare v_key text := split_part(p_key, '@', 1); v_number text := nullif(split_part(p_key, '@', 2), ''); v uuid;
begin
  if v_number is not null then
    v := pg_temp.w4prov(p_tenant, 'evidence_versions', 'work/' || p_code || '/evidence/' || v_key || '/' || v_number);
  else
    v := coalesce(pg_temp.w4prov(p_tenant, 'evidence_versions', 'work/' || p_code || '/evidence/' || v_key || '/2'),
      pg_temp.w4prov(p_tenant, 'evidence_versions', 'work/' || p_code || '/evidence/' || v_key || '/1'));
  end if;
  if v is null then
    select k.destination_id into v from pg_temp.product_detail_tracked k
      where k.destination_table = 'evidence_versions' and k.source_key = 'detail/' || p_code || '/evidence/' || v_key || '/1';
  end if;
  if v is null then raise exception '% has no evidence %.', p_code, p_key; end if;
  return v;
end $$;
-- The latest published assessment of a risk.
create function pg_temp.drisk_revision(p_risk uuid) returns uuid language sql stable as $$
  select id from public.risk_revisions where risk_id = p_risk and state = 'published' order by version_number desc limit 1
$$;
-- A risk of the program by its key: the fourth step's, or this step's.
create function pg_temp.drisk(p_tenant uuid, p_code text, p_key text) returns uuid language plpgsql stable as $$
declare v uuid := pg_temp.w4(p_tenant, 'work/' || p_code || '/risks/' || p_key);
begin
  if not exists (select 1 from public.risks where id = v) then v := pg_temp.did(p_tenant, 'detail/' || p_code || '/risks/' || p_key); end if;
  if not exists (select 1 from public.risks where id = v) then raise exception '% has no risk %.', p_code, p_key; end if;
  return v;
end $$;
-- An observation of the program by its key, from either step.
create function pg_temp.dobservation(p_tenant uuid, p_code text, p_key text) returns uuid language plpgsql stable as $$
declare v uuid := pg_temp.w4(p_tenant, 'work/' || p_code || '/observations/' || p_key);
begin
  if not exists (select 1 from public.observations where id = v) then v := pg_temp.did(p_tenant, 'detail/' || p_code || '/observations/' || p_key); end if;
  if not exists (select 1 from public.observations where id = v) then raise exception '% has no observation %.', p_code, p_key; end if;
  return v;
end $$;

-- What a product version claims and how each claim was judged, recorded through the command
-- as the account, a call for each element, determination and rationale.
create function pg_temp.detail_record_determinations(p jsonb, p_assessment uuid) returns void language plpgsql as $$
declare v record;
begin
  perform pg_temp.as_account(p);
  for v in select element_id, determination, rationale, array_agg(control_id order by control_id) as controls
    from pg_temp.product_detail_dets group by element_id, determination, rationale loop
    perform public.record_product_determinations((p->>'tenantId')::uuid, p_assessment, v.element_id, v.controls, v.determination, v.rationale);
  end loop;
  perform pg_temp.as_seed();
  truncate pg_temp.product_detail_dets;
end $$;

-- A narrative for every control of an SSP that has none, in the fourth step's words: what the
-- product gives for it in the variant, or the program's procedure for its family.
create function pg_temp.detail_narrate(p jsonb, p_code text, p_boundary uuid, p_target uuid) returns bigint language plpgsql as $$
declare t uuid := (p->>'tenantId')::uuid; w jsonb := p->'work'->p_code; v_delta jsonb; v_count bigint;
begin
  v_delta := pg_temp.read_work_delta(p, p_boundary);
  update public.implemented_requirements i set implementation_status = n.status, description = n.narrative,
      responsible_party_id = coalesce(i.responsible_party_id, n.owner)
  from (
    select i.id,
      case d.delta
        when 'inherited' then 'implemented'
        when 'shared' then case when b.b < (p->'sspNarratives'->'shared'->>0)::integer then 'implemented' else 'partial' end
        when 'changed_here' then case when b.b < (p->'sspNarratives'->'changedHere'->>0)::integer then 'implemented'
          when b.b < (p->'sspNarratives'->'changedHere'->>1)::integer then 'partial' else 'planned' end
        else case when b.b < (p->'sspNarratives'->'programOnly'->>0)::integer then 'implemented'
          when b.b < (p->'sspNarratives'->'programOnly'->>1)::integer then 'partial' else 'planned' end
      end as status,
      d.delta, x.claims, x.responsibility, d.changed, d.family,
      pg_temp.dwho(coalesce(w->'ssp'->'owners'->>d.family, w->'ssp'->'owners'->>'default')) as owner
    from public.implemented_requirements i
    join public.selected_controls sc on sc.id = i.selected_control_id
    join pg_temp.product_work_delta d on d.control_id = sc.control_id
    cross join lateral (select pg_temp.bucket('ssp/' || p_code || '/' || d.code) as b) b
    left join lateral (
      select string_agg(y.description, ' ') as claims,
        (array_agg(y.responsibility) filter (where y.responsibility is not null))[1] as responsibility
      from (
        select cc.description, li.consumer_responsibility as responsibility
        from public.component_contributions cc
        join public.system_components c on c.id = cc.system_component_id
        left join public.defined_component_implementations li on li.id = cc.library_implementation_id
        where cc.tenant_id = t and cc.implemented_requirement_id = i.id order by c.code limit 2
      ) y
    ) x on true
    where i.tenant_id = t and i.ssp_revision_id = p_target and i.description is null
  ) n0
  cross join lateral (select n0.id, n0.status, n0.owner,
    case n0.delta
      when 'inherited' then concat_ws(' ',
        format('Inherited from %s version %s, %s.', v_delta->'product'->>'name', v_delta->'product'->>'version', v_delta->'product'->>'configuration'),
        n0.claims, 'The product''s assessment stands for this control in this variant.')
      when 'shared' then concat_ws(' ',
        format('Shared with %s version %s.', v_delta->'product'->>'name', v_delta->'product'->>'version'),
        n0.claims, coalesce(n0.responsibility, 'The program answers the part the product leaves to it.'))
      when 'changed_here' then concat_ws(' ',
        format('Changed in this variant: %s.', coalesce(n0.changed, 'an element behind this control')),
        n0.claims, 'The program re-verifies this control under its delta assessment.')
      else case when n0.status = 'planned' then 'Planned. ' else '' end || (p->'familyProcedures'->>n0.family)
    end as narrative) n
  where i.id = n.id and n.narrative is not null;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Components the variant's controls are answered by where the product gives none: the elements
-- the program added, and the program's procedure documents, each a component of its boundary.
-- Then a contribution for every control with none, and a statement for every part of it.
create function pg_temp.detail_contribute(p jsonb, p_code text, p_boundary public.systems, p_target uuid, p_prefix text, p_section text)
returns void language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid; e jsonb := p->'detail'->p_code; v_key text; v_item record; v_id uuid; v_element public.systems;
begin
  -- The elements the program added, where the step names what they answer.
  for v_item in select key, value from jsonb_each(e->'elementComponents') loop
    select * into v_element from public.systems where tenant_id = t and boundary_system_id = p_boundary.id
      and code = (p->'work'->p_code->>'prefix') || '-' || v_item.key;
    continue when v_element.id is null;
    v_id := pg_temp.did(t, p_section || '/system_components/' || v_element.code);
    if not exists (select 1 from public.system_components where id = v_id) then
      insert into public.system_components (id, tenant_id, system_id, code, name, component_type, status, description, system_element_id)
        values (v_id, t, p_boundary.id, v_element.code, v_element.name, v_item.value->>'type', 'under_development',
          coalesce(v_element.description, v_element.name), v_element.id);
      perform pg_temp.dtrack('system_components', v_id, p_section || '/system_components/' || v_element.code, p_section);
    end if;
    insert into public.component_contributions (id, tenant_id, ssp_revision_id, implemented_requirement_id, system_component_id, description, implementation_status, responsible_party_id)
    select pg_temp.did(t, p_section || '/contributions/' || i.id || '/' || v_id), t, p_target, i.id, v_id,
      format('%s %s (%s %s).', v_element.name, coalesce(p->'familyPhrases'->>upper(g.source_id), 'supports the control'), k.code, k.title),
      p->>'ownElementStatus', i.responsible_party_id
    from public.implemented_requirements i
    join public.selected_controls sc on sc.id = i.selected_control_id
    join public.controls k on k.id = sc.control_id
    left join public.catalog_groups g on g.id = k.group_id
    where i.tenant_id = t and i.ssp_revision_id = p_target and k.code in (select jsonb_array_elements_text(v_item.value->'controls'))
      and not exists (select 1 from public.component_contributions c where c.implemented_requirement_id = i.id and c.system_component_id = v_id);
  end loop;
  -- The program's procedure documents, for the families of the controls nothing else answers.
  for v_item in
    select distinct upper(g.source_id) as family
    from public.implemented_requirements i
    join public.selected_controls sc on sc.id = i.selected_control_id
    join public.controls k on k.id = sc.control_id
    join public.catalog_groups g on g.id = k.group_id
    where i.tenant_id = t and i.ssp_revision_id = p_target
      and not exists (select 1 from public.component_contributions c where c.implemented_requirement_id = i.id)
  loop
    continue when not (p->'familyDocuments' ? v_item.family);
    v_key := p_section || '/procedure-documents/' || v_item.family;
    v_id := pg_temp.did(t, v_key);
    if not exists (select 1 from public.system_components where id = v_id) then
      insert into public.system_components (id, tenant_id, system_id, code, name, component_type, status, description)
        values (v_id, t, p_boundary.id, p_prefix || '-DOC-' || v_item.family,
          upper(left(p->'familyDocuments'->>v_item.family, 1)) || substr(p->'familyDocuments'->>v_item.family, 2),
          case when v_item.family in ('CA', 'PL', 'RA', 'SA', 'SR') then 'process' else 'policy' end, 'operational',
          format('The program''s %s, which the narratives of the %s controls name.', p->'familyDocuments'->>v_item.family, v_item.family));
      perform pg_temp.dtrack('system_components', v_id, v_key, p_section);
    end if;
    insert into public.component_contributions (id, tenant_id, ssp_revision_id, implemented_requirement_id, system_component_id, description, implementation_status, responsible_party_id)
    select pg_temp.did(t, p_section || '/contributions/' || i.id || '/' || v_id), t, p_target, i.id, v_id,
      p->'familyProcedures'->>v_item.family, i.implementation_status, i.responsible_party_id
    from public.implemented_requirements i
    join public.selected_controls sc on sc.id = i.selected_control_id
    join public.controls k on k.id = sc.control_id
    join public.catalog_groups g on g.id = k.group_id
    where i.tenant_id = t and i.ssp_revision_id = p_target and upper(g.source_id) = v_item.family
      and not exists (select 1 from public.component_contributions c where c.implemented_requirement_id = i.id);
  end loop;
  -- A statement for each lettered part of a control that has none, or for its statement whole.
  insert into public.implementation_statements (id, tenant_id, ssp_revision_id, implemented_requirement_id, control_part_id, description)
  select pg_temp.did(t, p_section || '/statements/' || i.id || '/' || cp.id), t, p_target, i.id, cp.id,
    case when x.components is null then format('Answered under the program''s %s.', coalesce(p->'familyDocuments'->>upper(g.source_id), 'procedures'))
      else format('Answered by %s.', x.components) end
  from public.implemented_requirements i
  join public.selected_controls sc on sc.id = i.selected_control_id
  join public.controls k on k.id = sc.control_id
  left join public.catalog_groups g on g.id = k.group_id
  join public.control_parts root on root.control_id = sc.control_id and root.parent_part_id is null and root.name = 'statement'
  cross join lateral (
    select cp.id from public.control_parts cp
    where cp.parent_part_id = root.id and cp.name = 'item' and coalesce(cp.prose, '') ~ '[^[:space:]]'
    union all
    select root.id where not exists (select 1 from public.control_parts cp
      where cp.parent_part_id = root.id and cp.name = 'item' and coalesce(cp.prose, '') ~ '[^[:space:]]')
  ) cp
  left join lateral (
    select string_agg(distinct c.name, ', ') as components
    from public.component_contributions cc join public.system_components c on c.id = cc.system_component_id
    where cc.tenant_id = t and cc.implemented_requirement_id = i.id
  ) x on true
  where i.tenant_id = t and i.ssp_revision_id = p_target
    and not exists (select 1 from public.implementation_statements s where s.implemented_requirement_id = i.id);
  insert into pg_temp.product_detail_tracked
    select 'component_contributions', c.id, 'component_contributions/' || c.id, p_section from public.component_contributions c
      where c.tenant_id = t and c.ssp_revision_id = p_target and c.id = pg_temp.did(t, p_section || '/contributions/' || c.implemented_requirement_id || '/' || c.system_component_id)
    union all
    select 'implementation_statements', s.id, 'implementation_statements/' || s.id, p_section from public.implementation_statements s
      where s.tenant_id = t and s.ssp_revision_id = p_target and s.id = pg_temp.did(t, p_section || '/statements/' || s.implemented_requirement_id || '/' || s.control_part_id);
end $$;

-- A test run of a procedure revision: its step results recorded while it runs, then completed.
create function pg_temp.detail_run(p jsonb, p_code text, p_run jsonb, p_n integer, p_revision uuid, p_baseline uuid, p_plan uuid, p_event uuid, p_task uuid)
returns uuid language plpgsql as $$
declare t uuid := (p->>'tenantId')::uuid; v_key text := 'detail/' || p_code || '/test_runs/' || p_n; v_id uuid := pg_temp.did(t, v_key);
  v_result record; v_shorts text;
begin
  insert into public.test_runs (id, tenant_id, title, procedure_revision_id, configuration_baseline_id, assessment_event_id, assessment_task_id,
      assessor_party_id, status, started_at, plan_revision_id)
    values (v_id, t, p_run->>'title', p_revision, p_baseline, p_event, p_task, pg_temp.dwho(p_run->>'assessor'), 'in_progress',
      pg_temp.wtime(p, (p_run->>'started')::integer, 10), p_plan);
  perform pg_temp.dtrack('test_runs', v_id, v_key, 'detail/' || p_code);
  for v_result in
    select r.value as determination, r.n, s.id as step_id, s.expected_result, p_run->'findings'->>((r.n - 1)::integer) as finding
    from jsonb_array_elements_text(p_run->'results') with ordinality r(value, n)
    join public.procedure_steps s on s.procedure_revision_id = p_revision and s.sequence_number = r.n
  loop
    insert into public.step_results (id, tenant_id, test_run_id, procedure_revision_id, procedure_step_id, determination, observed_behavior, recorded_at, assessor_party_id)
      values (pg_temp.did(t, v_key || '/steps/' || v_result.n), t, v_id, p_revision, v_result.step_id, v_result.determination,
        coalesce(v_result.finding, 'As expected: ' || lower(left(v_result.expected_result, 1)) || substr(v_result.expected_result, 2)),
        pg_temp.wtime(p, (p_run->>'started')::integer, 10 + v_result.n::integer), pg_temp.dwho(p_run->>'assessor'));
    perform pg_temp.dtrack('step_results', pg_temp.did(t, v_key || '/steps/' || v_result.n), v_key || '/steps/' || v_result.n, 'detail/' || p_code);
  end loop;
  if p_run->>'completed' is not null then
    select string_agg('step ' || r.n, ', ' order by r.n) into v_shorts
      from jsonb_array_elements_text(p_run->'results') with ordinality r(value, n) where r.value <> 'met';
    update public.test_runs set status = 'completed', completed_at = pg_temp.wtime(p, (p_run->>'completed')::integer, 16),
      conclusion = case when v_shorts is null then 'Every step met.' else 'Short of met at ' || v_shorts || '.' end
      where id = v_id;
  end if;
  return v_id;
end $$;

-- A risk with one published assessment, its response, what it rests on and the techniques it names.
create function pg_temp.detail_risk(p jsonb, p_code text, p_program uuid, r jsonb) returns uuid language plpgsql as $$
declare t uuid := (p->>'tenantId')::uuid; s text := 'detail/' || p_code; v_key text := s || '/risks/' || (r->>'key');
  v_id uuid := pg_temp.did(t, v_key); v_rev uuid := pg_temp.did(t, v_key || '/1'); v_entry jsonb := r->'response'; v_text text; v_item uuid;
begin
  insert into public.risks (id, tenant_id, program_id, title, owner_party_id, status)
    values (v_id, t, p_program, r->>'title', pg_temp.dwho(r->>'owner'), r->>'status');
  insert into public.risk_revisions (id, tenant_id, risk_id, version_number, state, description, threat, vulnerability,
      likelihood, impact, severity, assessment_rationale, assessed_at, assessor_party_id)
    values (v_rev, t, v_id, 1, 'draft', r->>'description', r->>'threat', r->>'vulnerability', r->>'likelihood', r->>'impact',
      r->>'severity', r->>'rationale', pg_temp.wtime(p, (r->>'assessed')::integer, 15), pg_temp.dwho(r->>'assessor'));
  perform pg_temp.dtrack('risks', v_id, v_key, s);
  perform pg_temp.dtrack('risk_revisions', v_rev, v_key || '/1', s);
  insert into public.risk_responses (id, tenant_id, risk_revision_id, response_type, description, owner_party_id, due_at)
    values (pg_temp.did(t, v_key || '/response'), t, v_rev, v_entry->>0, v_entry->>1, pg_temp.dwho(v_entry->>2), pg_temp.wtime(p, (v_entry->>3)::integer, 17));
  perform pg_temp.dtrack('risk_responses', pg_temp.did(t, v_key || '/response'), v_key || '/response', s);
  for v_text in select jsonb_array_elements_text(r->'observations') loop
    insert into public.risk_observations (id, tenant_id, risk_revision_id, observation_id)
      values (pg_temp.did(t, v_key || '/observations/' || v_text), t, v_rev, pg_temp.dobservation(t, p_code, v_text));
    perform pg_temp.dtrack('risk_observations', pg_temp.did(t, v_key || '/observations/' || v_text), v_key || '/observations/' || v_text, s);
  end loop;
  update public.risk_revisions set state = 'published', published_at = pg_temp.wtime(p, (r->>'assessed')::integer, 17),
    published_by_party_id = pg_temp.dwho(r->>'assessor') where id = v_rev;
  return v_id;
end $$;

-- ATT&CK techniques a risk names, linked as the account, as a reader links them.
create function pg_temp.detail_techniques(p jsonb, p_code text, p_risk uuid, p_techniques jsonb, p_key text) returns void language plpgsql as $$
declare t uuid := (p->>'tenantId')::uuid; v_text text; v_item uuid;
begin
  for v_text in select jsonb_array_elements_text(p_techniques) loop
    v_item := pg_temp.work_framework_item('nist-sp800-160v2r1-attack', v_text);
    continue when v_item is null;
    continue when exists (select 1 from public.risk_attack_techniques where risk_id = p_risk and framework_item_id = v_item);
    perform pg_temp.as_account(p);
    insert into public.risk_attack_techniques (id, tenant_id, risk_id, framework_item_id)
      values (pg_temp.did(t, p_key || '/techniques/' || v_text), t, p_risk, v_item);
    perform pg_temp.as_seed();
    perform pg_temp.dtrack('risk_attack_techniques', pg_temp.did(t, p_key || '/techniques/' || v_text), p_key || '/techniques/' || v_text, 'detail/' || p_code);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The step itself.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.seed_product_detail(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  pd jsonb := p->'productDetail';
  v_item jsonb; v_entry jsonb; v_run jsonb; v_name text; v_code text; v_key text; v_text text; v_section text;
  v_id uuid; v_other uuid; v_rev uuid; v_version uuid; v_program public.programs; v_boundary public.systems; v_element public.systems;
  v_product public.products; v_revision public.product_revisions; v_configuration public.product_configurations;
  v_resolution uuid; v_catalog uuid; v_assessment uuid; v_elements jsonb; v_result jsonb; v_plan jsonb; v_task uuid;
  v_source uuid; v_requirement uuid; v_ssp public.ssp_revisions; v_target uuid; v_count bigint; v_n integer; v_m integer;
  v_campaign uuid; v_plan_rev uuid; v_event uuid; v_baseline uuid; v_thread jsonb; v_status text; v_doc uuid; v_doc_version uuid;
  v_procedures jsonb; v_boundaries jsonb := '{}'; v_variants jsonb := '{}'; v_prefixes jsonb := '{}';
  v_job uuid; v_batch uuid; v_tables jsonb; v_updated jsonb; v_read jsonb := '{}'; v_skipped jsonb := '[]'; v_review jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-product-detail', 0));
  select id into v_batch from public.demo_import_batches where tenant_id = t and dataset_id = p->>'detailDatasetId';
  if v_batch is not null then
    -- A workspace that holds the records one click down is given only what waits on a reviewer, if
    -- it lacks it, under the same batch.
    v_review := pg_temp.seed_product_review(p, v_batch);
    if not (v_review->>'changed')::boolean then
      return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the records one click down.');
    end if;
    return jsonb_build_object('changed', true, 'records', (v_review->>'records')::integer, 'review', v_review);
  end if;
  if not exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'workDatasetId') then
    raise exception 'This workspace does not hold the programs'' work, which this step fills in.';
  end if;
  perform pg_temp.as_seed();

  -- The cast, as the fourth step added it, and the account's own person.
  for v_name in select jsonb_array_elements_text(p->'cast') loop
    select id into v_id from public.parties where tenant_id = t and name = v_name order by id limit 1;
    if v_id is null then raise exception 'Person "%" is not in this workspace; the fourth step adds the cast.', v_name; end if;
    insert into pg_temp.product_detail_people values (v_name, v_id);
  end loop;
  insert into pg_temp.product_detail_people
    select p->>'account', (select id from public.parties where tenant_id = t and auth_user_id = (p->>'accountUserId')::uuid);

  -- ---- Products ---------------------------------------------------------------------------
  -- A draft version published.
  for v_item in select value from jsonb_array_elements(pd->'publish') loop
    update public.product_revisions r set effective_from = (v_item->>'effectiveFrom')::date, remarks = v_item->>'remarks'
      from public.products x where x.id = r.product_id and x.tenant_id = t and x.code = v_item->>'product'
        and r.version_number = (v_item->>'version')::integer and r.state = 'draft';
    update public.product_revisions r set state = 'published'
      from public.products x where x.id = r.product_id and x.tenant_id = t and x.code = v_item->>'product'
        and r.version_number = (v_item->>'version')::integer and r.state = 'draft';
    get diagnostics v_count = row_count;
    if v_count = 0 then
      v_skipped := v_skipped || jsonb_build_object('publish', v_item->>'product', 'reason', 'the version is not a draft');
    end if;
    perform pg_temp.dupdated('product_revisions', v_count);
  end loop;
  -- Product assessments, their determinations recorded through the command.
  for v_item in select value from jsonb_array_elements(pd->'assessments') loop
    select r.* into v_revision from public.product_revisions r join public.products x on x.id = r.product_id
      where x.tenant_id = t and x.code = v_item->>'product' and r.version_number = (v_item->>'version')::integer;
    if v_revision.id is null or v_revision.state <> 'published' then
      raise exception '% version % is not published in this workspace.', v_item->>'product', v_item->>'version';
    end if;
    select b.resolution_id into v_resolution from pg_temp.reference_baseline(v_item->>'baseline') b;
    perform pg_temp.work_controls_of(v_resolution);
    v_key := 'productDetail/product_assessments/' || (v_item->>'product') || '/' || (v_item->>'version');
    v_assessment := pg_temp.did(t, v_key);
    perform pg_temp.as_account(p);
    insert into public.product_assessments (id, tenant_id, product_revision_id, profile_resolution_id, title, description, assessor_party_id, started_on, completed_on)
      values (v_assessment, t, v_revision.id, v_resolution, v_item->>'title', v_item->>'description', pg_temp.dwho(v_item->>'assessor'),
        (v_item->>'startedOn')::date, (v_item->>'completedOn')::date);
    perform pg_temp.as_seed();
    insert into pg_temp.product_detail_dets (element_id, control_id, determination, rationale)
    select distinct e.id, k.id, d.determination, v_item->>'elementRationale'
    from public.product_elements e
    join public.defined_component_implementations i on i.tenant_id = t and i.defined_component_id = e.defined_component_id and i.control_id is not null
    join pg_temp.product_work_controls k on k.resolution_id = v_resolution and k.id = i.control_id
    cross join lateral (select pg_temp.determination(pg_temp.bucket('determination/' || (v_item->>'product') || '/' || e.code || '/' || k.code),
      case when v_item->'weakElements' ? e.code then v_item->'weakSpread' else v_item->'spread' end) as determination) d
    where e.tenant_id = t and e.product_revision_id = v_revision.id and v_item ? 'spread' and d.determination is not null;
    insert into pg_temp.product_detail_dets (element_id, control_id, determination, rationale)
    select null, k.id, pg_temp.determination(pg_temp.bucket('whole-determination/' || (v_item->>'product') || '/' || k.code), v_item->'wholeSpread'),
      v_item->>'wholeRationale'
    from pg_temp.product_work_controls k
    where k.resolution_id = v_resolution and v_item->'wholeFamilies' ? k.family
      and pg_temp.bucket('whole/' || (v_item->>'product') || '/' || k.code) < (v_item->>'wholeShare')::integer;
    perform pg_temp.detail_record_determinations(p, v_assessment);
    update public.product_assessments set state = 'published', published_at = (v_item->>'publishedAt')::timestamptz where id = v_assessment;
    perform pg_temp.dtrack('product_assessments', v_assessment, v_key, 'productDetail');
    insert into pg_temp.product_detail_tracked
      select 'product_determinations', d.id, 'product_determinations/' || d.id, 'productDetail'
      from public.product_determinations d where d.tenant_id = t and d.product_assessment_id = v_assessment;
    perform pg_temp.as_account(p);
    v_read := v_read || jsonb_build_object((v_item->>'product') || ' v' || (v_item->>'version'),
      (public.product_control_status(t, v_revision.id)->'totals') - 'scopes');
    perform pg_temp.as_seed();
  end loop;

  -- A variant of each product nobody had taken, through add_program_system as the account.
  for v_item in select value from jsonb_array_elements(pd->'variants') loop
    select * into v_program from public.programs where tenant_id = t and code = v_item->>'program';
    if exists (select 1 from public.systems where tenant_id = t and code = v_item->>'code') then
      raise exception 'The workspace already has a system coded %; the step does not overwrite it.', v_item->>'code';
    end if;
    select * into v_product from public.products where tenant_id = t and code = v_item->>'product';
    select * into v_revision from public.product_revisions where tenant_id = t and product_id = v_product.id
      and version_number = (v_item->>'version')::integer and state = 'published';
    select * into v_configuration from public.product_configurations where tenant_id = t and product_id = v_product.id and code = v_item->>'configuration';
    if v_program.id is null or v_revision.id is null or v_configuration.id is null then
      raise exception '% cannot take % version % in configuration %.', v_item->>'program', v_item->>'product', v_item->>'version', v_item->>'configuration';
    end if;
    select c.profile_resolution_id into v_resolution from public.program_reference_choices c where c.tenant_id = t and c.program_id = v_program.id order by c.id limit 1;
    select coalesce(jsonb_agg(jsonb_build_object(
        'key', pg_temp.did(t, 'variant/' || (v_item->>'code') || '/' || e.code),
        'parentKey', case when pe.id is null then null else pg_temp.did(t, 'variant/' || (v_item->>'code') || '/' || pe.code) end,
        'code', (v_item->>'prefix') || '-' || e.code, 'name', e.name, 'description', coalesce(e.description, ''),
        'type', case when e.defined_component_id is null then e.element_type end,
        'library', case when e.defined_component_id is null then null else jsonb_build_object(
          'revisionId', dc.component_definition_revision_id, 'definedComponentId', e.defined_component_id,
          'rationale', format('Inherited from %s v%s · %s.', v_product.name, v_revision.version_number, v_configuration.name)) end,
        'productElementId', e.id) order by e.position), '[]'::jsonb) into v_elements
    from public.product_elements e
    join public.product_configuration_elements m on m.tenant_id = t and m.product_element_id = e.id and m.product_configuration_id = v_configuration.id
    left join public.product_elements pe on pe.id = e.parent_element_id
    left join public.defined_components dc on dc.id = e.defined_component_id
    where e.tenant_id = t and e.product_revision_id = v_revision.id;
    perform pg_temp.as_account(p);
    v_result := public.add_program_system(t, v_program.id, pg_temp.did(t, 'program_system_requests/' || (v_item->>'code')), jsonb_build_object(
      'key', pg_temp.did(t, 'variant/' || (v_item->>'code')), 'code', v_item->>'code', 'name', v_item->>'name',
      'description', v_item->>'description', 'type', v_item->>'type', 'ownerPartyId', pg_temp.dwho(v_item->>'owner'),
      'confidentiality', v_item->'impact'->>0, 'integrity', v_item->'impact'->>1, 'availability', v_item->'impact'->>2,
      'categorizationRationale', v_item->>'rationale', 'profileResolutionId', v_resolution,
      'product', jsonb_build_object('revisionId', v_revision.id, 'configurationId', v_configuration.id),
      'elements', v_elements));
    for v_entry in select value from jsonb_array_elements(v_item->'changes') loop
      select * into v_element from public.systems where tenant_id = t and program_id = v_program.id
        and code = (v_item->>'prefix') || '-' || (v_entry->>0);
      perform public.declare_product_element_change(t, v_element.id, v_element.revision,
        array(select jsonb_array_elements_text(v_entry->1)), v_entry->>2);
    end loop;
    perform pg_temp.as_seed();
    v_id := (v_result->>'systemId')::uuid;
    update public.systems set system_owner_party_id = coalesce(system_owner_party_id, pg_temp.dwho(v_item->>'owner')),
        lifecycle_status = 'development', authorization_status = case when is_authorization_boundary then 'in_progress' else authorization_status end
      where tenant_id = t and boundary_system_id = v_id;
    insert into pg_temp.product_detail_tracked
      select 'systems', s.id, 'systems/' || s.code, 'productDetail' from public.systems s where s.tenant_id = t and s.boundary_system_id = v_id;
    v_variants := v_variants || jsonb_build_object(v_item->>'code', v_id);
    v_prefixes := v_prefixes || jsonb_build_object(v_item->>'code', v_item->>'prefix');
    -- Its configuration baseline, pinning every component it holds.
    v_entry := p->'variantBaselines'->(v_item->>'code');
    v_key := 'productDetail/configuration_baselines/' || (v_item->>'code');
    v_baseline := pg_temp.did(t, v_key);
    insert into public.configuration_baselines (id, tenant_id, system_id, version_number, state, name, description)
      values (v_baseline, t, v_id, 1, 'draft', v_entry->>'name', v_entry->>'description');
    insert into public.component_pins (id, tenant_id, system_id, configuration_baseline_id, system_component_id, defined_component_id, version, configuration_description, content_sha256)
    select pg_temp.did(t, v_key || '/pins/' || c.code), t, v_id, v_baseline, c.id, c.defined_component_id, x.version, v_entry->>'note',
      encode(extensions.digest((v_item->>'code') || '/' || c.code || '/' || x.version, 'sha256'), 'hex')
    from public.system_components c
    cross join lateral (select coalesce(v_entry->'versions'->>regexp_replace(c.code, '^' || (v_item->>'prefix') || '-', ''), '1.0') as version) x
    where c.tenant_id = t and c.system_id = v_id;
    update public.configuration_baselines set state = 'published', published_at = pg_temp.wtime(p, (v_entry->>'published')::integer, 16) where id = v_baseline;
    perform pg_temp.dtrack('configuration_baselines', v_baseline, v_key, 'productDetail');
    insert into pg_temp.product_detail_tracked
      select 'component_pins', c.id, 'component_pins/' || c.id, 'productDetail' from public.component_pins c where c.configuration_baseline_id = v_baseline;
  end loop;

  -- ---- Each program's requirements, evidence and procedures --------------------------------
  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    v_section := 'detail/' || v_code;
    v_entry := p->'detail'->v_code;
    select * into v_program from public.programs where tenant_id = t and code = v_code;
    select r.id into v_source from public.requirement_sources r where r.tenant_id = t and r.program_id = v_program.id order by r.received_on, r.id limit 1;
    -- Requirements the customer added to its document, imported through the command as the account.
    if jsonb_array_length(coalesce(v_entry->'requirements', '[]')) > 0 then
      perform pg_temp.as_account(p);
      perform public.import_customer_requirements(t, v_program.id, pg_temp.did(t, v_section || '/requirement_import'),
        (select jsonb_build_object('code', s.code, 'title', s.title) from public.requirement_sources s where s.id = v_source),
        (select jsonb_agg(jsonb_build_object('reference', i.value->>0, 'title', i.value->>1, 'statement', i.value->>2) order by i.position)
          from jsonb_array_elements(v_entry->'requirements') with ordinality i(value, position)));
      perform pg_temp.as_seed();
      for v_item in select value from jsonb_array_elements(v_entry->'requirements') loop
        v_key := v_section || '/requirements/' || (v_item->>0);
        select q.id, v.id into v_requirement, v_rev from public.engineering_requirements q
          join public.requirement_revisions v on v.engineering_requirement_id = q.id
          where q.tenant_id = t and q.source_id = v_source and q.source_reference = v_item->>0;
        perform pg_temp.dtrack('engineering_requirements', v_requirement, v_key, v_section);
        perform pg_temp.dtrack('requirement_revisions', v_rev, v_key || '/1', v_section);
        for v_text in select jsonb_array_elements_text(v_item->3) loop
          select s.id into v_id from public.systems s where s.tenant_id = t and s.program_id = v_program.id
            and s.code = (p->'work'->v_code->>'prefix') || '-' || v_text;
          if v_id is null then raise exception '% holds no element % for requirement %.', v_code, v_text, v_item->>0; end if;
          insert into public.requirement_allocations (id, tenant_id, requirement_revision_id, system_id, rationale)
            values (pg_temp.did(t, v_key || '/allocations/' || v_text), t, v_rev, v_id, 'Allocated where the customer''s requirement is met.');
          perform pg_temp.dtrack('requirement_allocations', pg_temp.did(t, v_key || '/allocations/' || v_text), v_key || '/allocations/' || v_text, v_section);
        end loop;
        for v_text in select jsonb_array_elements_text(v_item->4) loop
          insert into public.requirement_control_links (id, tenant_id, requirement_revision_id, control_id, relationship_type, rationale)
            select pg_temp.did(t, v_key || '/controls/' || v_text), t, v_rev, k.id, 'maps_to', 'The customer''s requirement is met through this control.'
            from public.controls k join public.program_reference_choices c on c.catalog_revision_id = k.catalog_revision_id
            where c.program_id = v_program.id and k.code = v_text limit 1;
          perform pg_temp.dtrack('requirement_control_links', pg_temp.did(t, v_key || '/controls/' || v_text), v_key || '/controls/' || v_text, v_section);
        end loop;
        if v_item->>5 is not null then
          insert into public.requirement_compliance (id, tenant_id, engineering_requirement_id, status, verification_method, statement)
            values (pg_temp.did(t, v_key || '/compliance'), t, v_requirement, v_item->>5, v_item->>6, v_item->>7);
          perform pg_temp.dtrack('requirement_compliance', pg_temp.did(t, v_key || '/compliance'), v_key || '/compliance', v_section);
        end if;
      end loop;
    end if;

    -- Requirements allocated to each boundary itself.
    for v_text, v_item in
      select b.key, b.value from jsonb_each(v_entry->'boundaryAllocations') b
      union all
      select x.value->>'code', x.value->'allocate' from jsonb_array_elements(pd->'variants') x where x.value->>'program' = v_code
    loop
      select * into v_boundary from public.systems where tenant_id = t and program_id = v_program.id and code = v_text and is_authorization_boundary;
      for v_name in select jsonb_array_elements_text(v_item) loop
        select v.id into v_rev from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
          where q.tenant_id = t and q.program_id = v_program.id and q.source_reference = v_name order by v.version_number desc limit 1;
        v_key := v_section || '/boundary_allocations/' || v_text || '/' || v_name;
        insert into public.requirement_allocations (id, tenant_id, requirement_revision_id, system_id, rationale)
          values (pg_temp.did(t, v_key), t, v_rev, v_boundary.id, 'Allocated to the variant as a whole.');
        perform pg_temp.dtrack('requirement_allocations', pg_temp.did(t, v_key), v_key, v_section);
      end loop;
    end loop;

    -- Evidence the step adds: the customer's document, which its requirements cite, and evidence
    -- for the requirements added above.
    for v_item in
      select jsonb_build_object('key', 'customer-document', 'title', v_entry->'document'->>'title', 'kind', 'document',
        'owner', v_entry->'document'->>'owner', 'uri', v_entry->'document'->>'uri', 'received', v_entry->'document'->>'received',
        'description', 'The customer''s document as received, which each of its requirements cites by paragraph.',
        'review', jsonb_build_array('accepted', p->'work'->v_code->'roles'->0->>1, 'Received from the customer under the contract''s data requirements.', -1))
      union all
      select value from jsonb_array_elements(coalesce(v_entry->'evidence', '[]'))
    loop
      v_key := v_section || '/evidence/' || (v_item->>'key');
      v_text := coalesce(v_item->>'uri', 'urn:demo:evidence:' || lower(v_code) || ':' || (v_item->>'key'));
      perform pg_temp.as_account(p);
      v_result := public.create_evidence_with_version(t, pg_temp.did(t, v_key || '/request'), jsonb_strip_nulls(jsonb_build_object(
        'title', v_item->>'title', 'artifactKind', v_item->>'kind', 'programId', v_program.id, 'ownerPartyId', pg_temp.dwho(v_item->>'owner'),
        'description', v_item->>'description', 'externalUri', v_text,
        'collectedAt', coalesce((v_item->>'received')::date, pg_temp.wday(p, (v_item->>'collected')::integer))::text || 'T14:00:00Z',
        'provenance', p->>'evidenceProvenance')));
      perform pg_temp.as_seed();
      v_version := (v_result->>'versionId')::uuid;
      perform pg_temp.dtrack('evidence_artifacts', (v_result->>'artifactId')::uuid, v_key, v_section);
      perform pg_temp.dtrack('evidence_versions', v_version, v_key || '/1', v_section);
      update public.evidence_versions set description = v_item->>'description', sha256 = encode(extensions.digest(v_text || '#1', 'sha256'), 'hex'),
          state = 'published', published_at = coalesce(((v_item->>'received')::date + 1)::timestamp at time zone 'UTC', pg_temp.wtime(p, (v_item->>'collected')::integer, 17)),
          published_by_party_id = pg_temp.dwho(v_item->>'owner')
        where id = v_version;
      if v_item->'review' is not null then
        insert into public.evidence_reviews (id, tenant_id, evidence_version_id, reviewer_party_id, decision, rationale, reviewed_at)
          values (pg_temp.did(t, v_key || '/review'), t, v_version, pg_temp.dwho(v_item->'review'->>1), v_item->'review'->>0, v_item->'review'->>2,
            case when v_item->'review'->>0 = 'pending' then null else pg_temp.wtime(p, (v_item->'review'->>3)::integer, 11) end);
        perform pg_temp.dtrack('evidence_reviews', pg_temp.did(t, v_key || '/review'), v_key || '/review', v_section);
      end if;
      if v_item->>'key' = 'customer-document' then v_doc_version := v_version; end if;
      for v_name in select jsonb_array_elements_text(coalesce(v_item->'requirements', '[]')) loop
        select v.id into v_rev from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
          where q.tenant_id = t and q.program_id = v_program.id and q.source_reference = v_name order by v.version_number desc limit 1;
        perform pg_temp.as_account(p);
        perform public.link_requirement_evidence(t, v_program.id, v_rev, array[v_version]);
        perform pg_temp.as_seed();
        update public.requirement_evidence set claim = v_item->>'claim' where requirement_revision_id = v_rev and evidence_version_id = v_version;
        insert into pg_temp.product_detail_tracked
          select 'requirement_evidence', re.id, 'requirement_evidence/' || re.id, v_section from public.requirement_evidence re
          where re.requirement_revision_id = v_rev and re.evidence_version_id = v_version;
      end loop;
    end loop;
    -- The document is filed against the task that answers the open requirements.
    v_task := pg_temp.w4prov(t, 'tasks', 'work/' || v_code || '/tasks/' || (v_entry->'document'->>'task'));
    insert into public.task_evidence (id, tenant_id, task_id, evidence_version_id, claim)
      values (pg_temp.did(t, v_section || '/document_task'), t, v_task, v_doc_version, 'The document the open requirements are answered against.');
    perform pg_temp.dtrack('task_evidence', pg_temp.did(t, v_section || '/document_task'), v_section || '/document_task', v_section);

    -- An owner for every customer requirement, by the family of the first control it maps. A
    -- direct write with no session, so it records no edit.
    perform pg_temp.as_seed();
    update public.requirement_revisions v set owner_party_id = pg_temp.dwho(coalesce(p->'work'->v_code->'ssp'->'owners'->>x.family, p->'work'->v_code->'ssp'->'owners'->>'default'))
    from public.engineering_requirements q
    cross join lateral (
      select upper(g.source_id) as family from public.requirement_revisions vv
      join public.requirement_control_links l on l.requirement_revision_id = vv.id
      join public.controls k on k.id = l.control_id join public.catalog_groups g on g.id = k.group_id
      where vv.engineering_requirement_id = q.id order by k.code limit 1
    ) x
    where q.tenant_id = t and q.program_id = v_program.id and q.source_id is not null and v.engineering_requirement_id = q.id
      and v.owner_party_id is null
      and v.id not in (select destination_id from pg_temp.product_detail_tracked where destination_table = 'requirement_revisions');
    get diagnostics v_count = row_count;
    perform pg_temp.dupdated('requirement_revisions', v_count);
    update public.requirement_revisions v set owner_party_id = pg_temp.dwho(coalesce(p->'work'->v_code->'ssp'->'owners'->>'IA', p->'work'->v_code->'ssp'->'owners'->>'default'))
      where v.id in (select destination_id from pg_temp.product_detail_tracked where destination_table = 'requirement_revisions') and v.owner_party_id is null;

    -- Procedures, each with one published revision and its steps, and the requirements it verifies.
    v_procedures := '{}';
    for v_item in select value from jsonb_array_elements(v_entry->'procedures') loop
      v_key := v_section || '/procedures/' || (v_item->>'key');
      v_id := pg_temp.did(t, v_key);
      v_rev := pg_temp.did(t, v_key || '/1');
      insert into public.procedures (id, tenant_id, title, description, program_id, owner_party_id)
        values (v_id, t, v_item->>'title', v_item->>'description', v_program.id, pg_temp.dwho(v_item->>'owner'));
      insert into public.procedure_revisions (id, tenant_id, version_number, state, procedure_id, title, description, method, preconditions, acceptance_criterion)
        values (v_rev, t, 1, 'draft', v_id, v_item->>'title', v_item->>'description', v_item->>'method', v_item->>'preconditions',
          (select string_agg(s.value->>1, ' ' order by s.n) from jsonb_array_elements(v_item->'steps') with ordinality s(value, n)));
      insert into public.procedure_steps (id, tenant_id, procedure_revision_id, sequence_number, instruction, expected_result)
        select pg_temp.did(t, v_key || '/1/steps/' || s.n), t, v_rev, s.n, s.value->>0, s.value->>1
        from jsonb_array_elements(v_item->'steps') with ordinality s(value, n);
      update public.procedure_revisions set state = 'published', published_at = pg_temp.wtime(p, -45, 12), published_by_party_id = pg_temp.dwho(v_item->>'owner')
        where id = v_rev;
      perform pg_temp.dtrack('procedures', v_id, v_key, v_section);
      perform pg_temp.dtrack('procedure_revisions', v_rev, v_key || '/1', v_section);
      insert into pg_temp.product_detail_tracked
        select 'procedure_steps', s.id, 'procedure_steps/' || s.id, v_section from public.procedure_steps s where s.procedure_revision_id = v_rev;
      v_procedures := v_procedures || jsonb_build_object(v_item->>'key', v_rev);
      for v_name in select jsonb_array_elements_text(v_item->'requirements') loop
        select v.id into v_other from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
          where q.tenant_id = t and q.program_id = v_program.id and q.source_reference = v_name order by v.version_number desc limit 1;
        insert into public.requirement_verifications (id, tenant_id, requirement_revision_id, procedure_revision_id, rationale)
          values (pg_temp.did(t, v_key || '/verifies/' || v_name), t, v_other, v_rev, format('Verified by the %s.', lower(left(v_item->>'title', 1)) || substr(v_item->>'title', 2)));
        perform pg_temp.dtrack('requirement_verifications', pg_temp.did(t, v_key || '/verifies/' || v_name), v_key || '/verifies/' || v_name, v_section);
      end loop;
    end loop;
    v_entry := v_entry || jsonb_build_object('procedureRevisions', v_procedures);

    -- Each customer requirement cites its paragraph of the document and opens a discussion, both
    -- through the review command as the account.
    v_n := 0;
    for v_requirement, v_name, v_text, v_status in
      select q.id, q.source_reference, v.statement, coalesce(c.status, 'unanswered')
      from public.engineering_requirements q
      join lateral (select vv.statement from public.requirement_revisions vv where vv.engineering_requirement_id = q.id order by vv.version_number desc limit 1) v on true
      left join public.requirement_compliance c on c.engineering_requirement_id = q.id
      where q.tenant_id = t and q.program_id = v_program.id and q.source_id = v_source
      order by public.natural_sort_key(q.source_reference) collate "C"
    loop
      v_n := v_n + 1;
      v_key := v_section || '/requirements/' || v_name;
      perform pg_temp.as_account(p);
      v_result := public.command_assurance_review(t, pg_temp.did(t, v_key || '/citation'), jsonb_build_object(
        'operation', 'create-citation', 'target', jsonb_build_object('kind', 'requirement', 'recordId', v_requirement),
        'evidenceVersionId', v_doc_version,
        'expectedEvidenceRevision', (select revision from public.evidence_versions where id = v_doc_version),
        'passage', v_text, 'page', (v_entry->'document'->>'firstPage')::integer + (v_n - 1) / 3, 'anchor', '§' || v_name));
      perform pg_temp.dtrack('assurance_citations', (v_result->>'citationId')::uuid, v_key || '/citation', v_section);
      -- The cited passage's own discussion.
      v_other := (v_result->>'citationId')::uuid;
      v_result := public.command_assurance_review(t, pg_temp.did(t, v_key || '/passage-thread'), jsonb_build_object(
        'operation', 'create-thread', 'target', jsonb_build_object('kind', 'citation', 'recordId', v_other),
        'subject', p->'passageDiscussion'->>'subject',
        'body', replace(replace(p->'passageDiscussion'->>'body', '{reference}', v_name), '{document}', v_entry->'document'->>'title')));
      v_id := (v_result->>'threadId')::uuid;
      if p->'passageDiscussion'->'resolveFor' ? v_status then
        perform public.command_assurance_review(t, pg_temp.did(t, v_key || '/passage-reply'), jsonb_build_object(
          'operation', 'reply', 'threadId', v_id, 'body', p->'passageDiscussion'->>'reply'));
        perform public.command_assurance_review(t, pg_temp.did(t, v_key || '/passage-resolve'), jsonb_build_object(
          'operation', 'set-status', 'threadId', v_id, 'status', 'resolved',
          'expectedRevision', (select revision from public.assurance_review_threads where id = v_id)));
      end if;
      perform pg_temp.dtrack('assurance_review_threads', v_id, v_key || '/passage-thread', v_section);
      insert into pg_temp.product_detail_tracked
        select 'assurance_review_messages', m.id, 'assurance_review_messages/' || m.id, v_section from public.assurance_review_messages m where m.thread_id = v_id;
      v_thread := p->'discussions'->v_status;
      v_result := public.command_assurance_review(t, pg_temp.did(t, v_key || '/thread'), jsonb_build_object(
        'operation', 'create-thread', 'target', jsonb_build_object('kind', 'requirement', 'recordId', v_requirement),
        'subject', v_thread->>'subject',
        'body', replace(replace(v_thread->>'body', '{statement}', coalesce((select statement from public.requirement_compliance where engineering_requirement_id = v_requirement), '')), '{reference}', v_name)));
      v_id := (v_result->>'threadId')::uuid;
      if v_thread->>'reply' is not null then
        perform public.command_assurance_review(t, pg_temp.did(t, v_key || '/reply'), jsonb_build_object(
          'operation', 'reply', 'threadId', v_id, 'body', v_thread->>'reply'));
      end if;
      if (v_thread->>'resolve')::boolean then
        perform public.command_assurance_review(t, pg_temp.did(t, v_key || '/resolve'), jsonb_build_object(
          'operation', 'set-status', 'threadId', v_id, 'status', 'resolved',
          'expectedRevision', (select revision from public.assurance_review_threads where id = v_id)));
      end if;
      perform pg_temp.as_seed();
      perform pg_temp.dtrack('assurance_review_threads', v_id, v_key || '/thread', v_section);
      insert into pg_temp.product_detail_tracked
        select 'assurance_review_messages', m.id, 'assurance_review_messages/' || m.id, v_section from public.assurance_review_messages m where m.thread_id = v_id;
    end loop;
    p := jsonb_set(p, array['detail', v_code], v_entry);
  end loop;

  -- ---- Findings, risks and remediation ----------------------------------------------------
  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    v_section := 'detail/' || v_code;
    v_entry := p->'detail'->v_code;
    select * into v_program from public.programs where tenant_id = t and code = v_code;
    -- Observations of the issues that had none.
    for v_item in select value from jsonb_array_elements(v_entry->'observations') loop
      v_key := v_section || '/observations/' || (v_item->>0);
      v_id := pg_temp.did(t, v_key);
      insert into public.observations (id, tenant_id, program_id, title, description, method, observed_at, observer_party_id)
        values (v_id, t, v_program.id, v_item->>2, v_item->>3, v_item->>4, pg_temp.wtime(p, (v_item->>5)::integer, 13), pg_temp.dwho(v_item->>6));
      perform pg_temp.dtrack('observations', v_id, v_key, v_section);
      insert into public.issue_observations (id, tenant_id, issue_id, observation_id)
        values (pg_temp.did(t, v_key || '/issue'), t, pg_temp.w4(t, 'work/' || v_code || '/issues/' || (v_item->>1)), v_id);
      perform pg_temp.dtrack('issue_observations', pg_temp.did(t, v_key || '/issue'), v_key || '/issue', v_section);
      for v_text in select jsonb_array_elements_text(v_item->7) loop
        insert into public.observation_evidence (id, tenant_id, observation_id, evidence_version_id)
          values (pg_temp.did(t, v_key || '/evidence/' || v_text), t, v_id, pg_temp.devidence(t, v_code, v_text));
        perform pg_temp.dtrack('observation_evidence', pg_temp.did(t, v_key || '/evidence/' || v_text), v_key || '/evidence/' || v_text, v_section);
      end loop;
    end loop;
    -- New risks, and a risk reassessed with what it rests on.
    for v_item in select value from jsonb_array_elements(v_entry->'risks') loop
      v_id := pg_temp.detail_risk(p, v_code, v_program.id, v_item);
      perform pg_temp.detail_techniques(p, v_code, v_id, v_item->'techniques', v_section || '/risks/' || (v_item->>'key'));
    end loop;
    for v_name, v_item in select key, value from jsonb_each(coalesce(v_entry->'reassessed', '{}')) loop
      v_id := pg_temp.drisk(t, v_code, v_name);
      v_other := pg_temp.drisk_revision(v_id);
      v_key := v_section || '/risks/' || v_name || '/2';
      v_rev := pg_temp.did(t, v_key);
      insert into public.risk_revisions (id, tenant_id, risk_id, version_number, state, description, threat, vulnerability,
          likelihood, impact, severity, assessment_rationale, assessed_at, assessor_party_id)
        select v_rev, t, v_id, r.version_number + 1, 'draft', r.description, r.threat, r.vulnerability, r.likelihood, r.impact, r.severity,
          v_item->>'rationale', pg_temp.wtime(p, (v_item->>'assessed')::integer, 15), r.assessor_party_id
        from public.risk_revisions r where r.id = v_other;
      insert into public.risk_responses (id, tenant_id, risk_revision_id, response_type, description, owner_party_id, approved_by_party_id, approved_at, due_at)
        select pg_temp.did(t, v_key || '/responses/' || x.id), t, v_rev, x.response_type, x.description, x.owner_party_id, x.approved_by_party_id, x.approved_at, x.due_at
        from public.risk_responses x where x.risk_revision_id = v_other;
      for v_text in select jsonb_array_elements_text(v_item->'observations') loop
        insert into public.risk_observations (id, tenant_id, risk_revision_id, observation_id)
          values (pg_temp.did(t, v_key || '/observations/' || v_text), t, v_rev, pg_temp.dobservation(t, v_code, v_text));
        perform pg_temp.dtrack('risk_observations', pg_temp.did(t, v_key || '/observations/' || v_text), v_key || '/observations/' || v_text, v_section);
      end loop;
      update public.risk_revisions set state = 'published', published_at = pg_temp.wtime(p, (v_item->>'assessed')::integer, 17),
        published_by_party_id = assessor_party_id where id = v_rev;
      perform pg_temp.dtrack('risk_revisions', v_rev, v_key, v_section);
      insert into pg_temp.product_detail_tracked
        select 'risk_responses', x.id, 'risk_responses/' || x.id, v_section from public.risk_responses x where x.risk_revision_id = v_rev;
    end loop;
    for v_name, v_item in select key, value from jsonb_each(coalesce(v_entry->'techniques', '{}')) loop
      perform pg_temp.detail_techniques(p, v_code, pg_temp.drisk(t, v_code, v_name), v_item, v_section || '/risks/' || v_name);
    end loop;
    -- Remediation for the issues that had none, in the program's POA&M.
    v_other := pg_temp.w4(t, 'work/' || v_code || '/poam_documents');
    for v_item in select value from jsonb_array_elements(v_entry->'remediation') loop
      v_key := v_section || '/poam_items/' || (v_item->>'key');
      v_id := pg_temp.did(t, v_key);
      v_rev := pg_temp.did(t, v_key || '/1');
      insert into public.poam_items (id, tenant_id, poam_document_id, title, owner_party_id, status)
        values (v_id, t, v_other, v_item->>'title', pg_temp.dwho(v_item->>'owner'), v_item->>'status');
      insert into public.poam_item_revisions (id, tenant_id, version_number, state, poam_document_id, poam_item_id, description,
          remediation_plan, resources, planned_completion_date, actual_completion_date, completion_rationale)
        values (v_rev, t, 1, 'draft', v_other, v_id, v_item->>'description', v_item->>'plan', v_item->>'resources',
          pg_temp.wday(p, (v_item->>'planned')::integer), pg_temp.wday(p, (v_item->>'completed')::integer), v_item->>'rationale');
      perform pg_temp.dtrack('poam_items', v_id, v_key, v_section);
      perform pg_temp.dtrack('poam_item_revisions', v_rev, v_key || '/1', v_section);
      for v_run, v_n in select value, n from jsonb_array_elements(v_item->'milestones') with ordinality x(value, n) loop
        insert into public.poam_milestones (id, tenant_id, poam_item_revision_id, title, sequence_number, owner_party_id, planned_date, completed_date, status)
          values (pg_temp.did(t, v_key || '/milestones/' || v_n), t, v_rev, v_run->>0, v_n, pg_temp.dwho(v_item->>'owner'),
            pg_temp.wday(p, (v_run->>1)::integer), pg_temp.wday(p, (v_run->>2)::integer), v_run->>3);
        perform pg_temp.dtrack('poam_milestones', pg_temp.did(t, v_key || '/milestones/' || v_n), v_key || '/milestones/' || v_n, v_section);
      end loop;
      for v_text in select jsonb_array_elements_text(v_item->'issues') loop
        insert into public.issue_poams (id, tenant_id, issue_id, poam_item_id)
          values (pg_temp.did(t, v_key || '/issues/' || v_text), t, pg_temp.w4(t, 'work/' || v_code || '/issues/' || v_text), v_id);
        perform pg_temp.dtrack('issue_poams', pg_temp.did(t, v_key || '/issues/' || v_text), v_key || '/issues/' || v_text, v_section);
      end loop;
      insert into public.poam_item_observations (id, tenant_id, poam_item_revision_id, observation_id)
        select pg_temp.did(t, v_key || '/observations/' || io.observation_id), t, v_rev, io.observation_id
        from public.issue_observations io
        where io.issue_id in (select pg_temp.w4(t, 'work/' || v_code || '/issues/' || x) from jsonb_array_elements_text(v_item->'issues') x);
      insert into pg_temp.product_detail_tracked
        select 'poam_item_observations', o.id, 'poam_item_observations/' || o.id, v_section from public.poam_item_observations o where o.poam_item_revision_id = v_rev;
      for v_text in select jsonb_array_elements_text(v_item->'risks') loop
        insert into public.poam_item_risks (id, tenant_id, poam_item_revision_id, risk_revision_id)
          values (pg_temp.did(t, v_key || '/risks/' || v_text), t, v_rev, pg_temp.drisk_revision(pg_temp.drisk(t, v_code, v_text)));
        perform pg_temp.dtrack('poam_item_risks', pg_temp.did(t, v_key || '/risks/' || v_text), v_key || '/risks/' || v_text, v_section);
      end loop;
      if coalesce((v_item->>'published')::boolean, true) then
        update public.poam_item_revisions set state = 'published',
          published_at = pg_temp.wtime(p, least(0, coalesce((v_item->>'completed')::integer, -1)), 14),
          published_by_party_id = pg_temp.dwho(v_item->>'owner') where id = v_rev;
      end if;
    end loop;
    -- Draft commitments of the fourth step that name the risk they answer.
    for v_name, v_item in select key, value from jsonb_each(v_entry->'commitmentRisks') loop
      v_rev := pg_temp.w4(t, 'work/' || v_code || '/poam_items/' || v_name || '/1');
      for v_text in select jsonb_array_elements_text(v_item) loop
        v_key := v_section || '/commitment_risks/' || v_name || '/' || v_text;
        insert into public.poam_item_risks (id, tenant_id, poam_item_revision_id, risk_revision_id)
          values (pg_temp.did(t, v_key), t, v_rev, pg_temp.drisk_revision(pg_temp.drisk(t, v_code, v_text)));
        perform pg_temp.dtrack('poam_item_risks', pg_temp.did(t, v_key), v_key, v_section);
      end loop;
    end loop;

    -- A task for each risk the fourth step linked none to, through the command as the account,
    -- linked to the risk and to the issues it rests on.
    for v_name, v_item in select key, value from jsonb_each(v_entry->'riskTasks') loop
      v_id := pg_temp.drisk(t, v_code, v_name);
      continue when exists (select 1 from public.task_risks where risk_id = v_id);
      v_key := v_section || '/risk_tasks/' || v_name;
      select x.description, x.owner_party_id into v_text, v_other from public.risk_responses x
        where x.risk_revision_id = pg_temp.drisk_revision(v_id) order by x.created_at, x.id limit 1;
      perform pg_temp.as_account(p);
      v_result := public.create_task_with_assignment(t, pg_temp.did(t, v_key || '/request'), jsonb_strip_nulls(jsonb_build_object(
        'programId', v_program.id, 'title', v_item->>0,
        'description', 'The response to the risk "' || (select title from public.risks where id = v_id) || '". ' || coalesce(v_text, ''),
        'assigneePartyId', coalesce(v_other, (select owner_party_id from public.risks where id = v_id)),
        'dueOn', pg_temp.wday(p, (v_item->>2)::integer)::text, 'priority', v_item->>3)));
      perform pg_temp.as_seed();
      v_task := (v_result->>'taskId')::uuid;
      if v_item->>1 <> 'open' then
        update public.tasks set status = v_item->>1,
          completed_at = case when v_item->>1 = 'done' then pg_temp.wtime(p, (v_item->>4)::integer, 16) end where id = v_task;
      end if;
      perform pg_temp.dtrack('tasks', v_task, v_key, v_section);
      if v_result->>'assignmentId' is not null then
        perform pg_temp.dtrack('task_assignments', (v_result->>'assignmentId')::uuid, v_key || '/assignee', v_section);
      end if;
      insert into public.task_risks (id, tenant_id, task_id, risk_id) values (pg_temp.did(t, v_key || '/risk'), t, v_task, v_id);
      perform pg_temp.dtrack('task_risks', pg_temp.did(t, v_key || '/risk'), v_key || '/risk', v_section);
      insert into public.task_issues (id, tenant_id, task_id, issue_id)
        select pg_temp.did(t, v_key || '/issues/' || io.issue_id), t, v_task, io.issue_id
        from public.risk_observations ro join public.issue_observations io on io.observation_id = ro.observation_id
        where ro.risk_revision_id = pg_temp.drisk_revision(v_id)
        group by io.issue_id;
      insert into pg_temp.product_detail_tracked
        select 'task_issues', x.id, 'task_issues/' || x.id, v_section from public.task_issues x where x.task_id = v_task;
    end loop;
  end loop;

  -- Every task of the programs: a comment where it has none, and its activity.
  insert into public.comments (id, tenant_id, task_id, author_party_id, body)
  select pg_temp.did(t, 'tasks/' || k.id || '/comment'), t, k.id,
    coalesce((select a.party_id from public.task_assignments a where a.task_id = k.id order by a.created_at, a.id limit 1),
      (select r.party_id from public.program_role_assignments r where r.program_id = k.program_id and r.role = 'program_manager' limit 1)),
    btrim(replace(p->'taskComments'->>k.status, '{note}', coalesce(k.description, '')))
  from public.tasks k join public.programs g on g.id = k.program_id
  where k.tenant_id = t and g.code in (select jsonb_array_elements_text(p->'workOrder'))
    and not exists (select 1 from public.comments c where c.task_id = k.id);
  insert into public.activity_events (id, tenant_id, task_id, actor_party_id, event_type, description, occurred_at)
  select pg_temp.did(t, 'tasks/' || k.id || '/activity/' || x.n), t, k.id, a.party_id, x.event_type, x.description, x.occurred_at
  from public.tasks k join public.programs g on g.id = k.program_id
  left join lateral (select ta.party_id from public.task_assignments ta where ta.task_id = k.id order by ta.created_at, ta.id limit 1) a on true
  cross join lateral (
    select 1 as n, 'created' as event_type, 'created the task' as description,
      (least(coalesce(k.due_on, (p->>'asOf')::date) - 14, (p->>'asOf')::date - 3, coalesce(k.completed_at::date, (p->>'asOf')::date) - 2)::timestamp
        + interval '9 hours') at time zone 'UTC' as occurred_at
    union all
    select 2, p->'taskActivity'->k.status->>0, p->'taskActivity'->k.status->>1,
      coalesce(k.completed_at, (((p->>'asOf')::date - 1 - (pg_temp.bucket('task-activity/' || k.id) % 3))::timestamp + interval '15 hours') at time zone 'UTC')
    where p->'taskActivity' ? k.status
  ) x
  where k.tenant_id = t and g.code in (select jsonb_array_elements_text(p->'workOrder'))
    and not exists (select 1 from public.activity_events e where e.task_id = k.id);
  -- Every risk of the programs: its activity.
  insert into public.activity_events (id, tenant_id, risk_id, actor_party_id, event_type, description, occurred_at)
  select pg_temp.did(t, 'risks/' || k.id || '/activity/' || x.n), t, k.id, x.actor, x.event_type, x.description, x.occurred_at
  from public.risks k join public.programs g on g.id = k.program_id
  join lateral (select r.* from public.risk_revisions r where r.risk_id = k.id and r.state = 'published' order by r.version_number desc limit 1) r on true
  left join lateral (select x.* from public.risk_responses x where x.risk_revision_id = r.id order by x.created_at, x.id limit 1) s on true
  cross join lateral (
    select 1 as n, k.owner_party_id as actor, 'created' as event_type, 'recorded the risk' as description,
      (select min(rr.assessed_at) from public.risk_revisions rr where rr.risk_id = k.id) - interval '2 days' as occurred_at
    union all
    select 2, r.assessor_party_id, 'published',
      format('published assessment version %s: %s likelihood, %s impact', r.version_number, replace(r.likelihood, '_', ' '), replace(r.impact, '_', ' ')),
      r.published_at
    union all
    select 3, coalesce(case when k.status = 'accepted' then s.approved_by_party_id end, k.owner_party_id),
      p->'riskActivity'->k.status->>0, p->'riskActivity'->k.status->>1, coalesce(s.approved_at, r.published_at + interval '1 day')
    where p->'riskActivity' ? k.status
  ) x
  where k.tenant_id = t and g.code in (select jsonb_array_elements_text(p->'workOrder'))
    and not exists (select 1 from public.activity_events e where e.risk_id = k.id);
  insert into pg_temp.product_detail_tracked
    select 'comments', c.id, 'comments/' || c.id, 'tasks' from public.comments c where c.tenant_id = t and c.id = pg_temp.did(t, 'tasks/' || c.task_id || '/comment')
    union all
    select 'activity_events', e.id, 'activity_events/' || e.id, 'tasks' from public.activity_events e
      where e.tenant_id = t and e.task_id is not null and e.id in (pg_temp.did(t, 'tasks/' || e.task_id || '/activity/1'), pg_temp.did(t, 'tasks/' || e.task_id || '/activity/2'))
    union all
    select 'activity_events', e.id, 'activity_events/' || e.id, 'risks' from public.activity_events e
      where e.tenant_id = t and e.risk_id is not null and e.id in (pg_temp.did(t, 'risks/' || e.risk_id || '/activity/1'),
        pg_temp.did(t, 'risks/' || e.risk_id || '/activity/2'), pg_temp.did(t, 'risks/' || e.risk_id || '/activity/3'));

  -- ---- SSPs: a narrative, statements and contributions for every control ------------------
  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    select * into v_program from public.programs where tenant_id = t and code = v_code;
    for v_boundary in select * from public.systems where tenant_id = t and program_id = v_program.id and is_authorization_boundary order by code loop
      v_section := 'detail/' || v_code || '/ssp/' || v_boundary.code;
      select * into v_ssp from public.ssp_revisions where tenant_id = t and system_id = v_boundary.id order by version_number desc limit 1;
      if v_ssp.state = 'published' then
        -- A published SSP cannot change: its narratives go in the next revision, a working draft that
        -- carries forward what the published one holds.
        v_target := pg_temp.did(t, v_section || '/' || (v_ssp.version_number + 1));
        insert into public.ssp_revisions (id, tenant_id, system_id, profile_resolution_id, version_number, state, description, configuration_baseline_id)
          values (v_target, t, v_boundary.id, v_ssp.profile_resolution_id, v_ssp.version_number + 1, 'draft',
            format('Working draft. SSP %s is published; this revision records how the variant implements every control of its baseline.', v_ssp.version_number),
            (select b.id from public.configuration_baselines b where b.system_id = v_boundary.id and b.state = 'published' order by b.version_number desc limit 1));
        insert into public.implemented_requirements (id, tenant_id, ssp_revision_id, selected_control_id, implementation_status, description, responsible_party_id, not_applicable_rationale)
          select pg_temp.did(t, v_section || '/ir/' || i.selected_control_id), t, v_target, i.selected_control_id, i.implementation_status,
            i.description, i.responsible_party_id, i.not_applicable_rationale
          from public.implemented_requirements i where i.tenant_id = t and i.ssp_revision_id = v_ssp.id;
        insert into public.implementation_statements (id, tenant_id, ssp_revision_id, implemented_requirement_id, control_part_id, description)
          select pg_temp.did(t, v_section || '/copied-statement/' || s.id), t, v_target, pg_temp.did(t, v_section || '/ir/' || i.selected_control_id), s.control_part_id, s.description
          from public.implementation_statements s join public.implemented_requirements i on i.id = s.implemented_requirement_id
          where s.tenant_id = t and s.ssp_revision_id = v_ssp.id;
        insert into public.component_contributions (id, tenant_id, ssp_revision_id, implemented_requirement_id, implementation_statement_id, system_component_id,
            description, implementation_status, responsible_party_id, library_implementation_id)
          select pg_temp.did(t, v_section || '/copied-contribution/' || c.id), t, v_target, pg_temp.did(t, v_section || '/ir/' || i.selected_control_id),
            case when c.implementation_statement_id is null then null else pg_temp.did(t, v_section || '/copied-statement/' || c.implementation_statement_id) end,
            c.system_component_id, c.description, c.implementation_status, c.responsible_party_id, c.library_implementation_id
          from public.component_contributions c join public.implemented_requirements i on i.id = c.implemented_requirement_id
          where c.tenant_id = t and c.ssp_revision_id = v_ssp.id;
        perform pg_temp.dtrack('ssp_revisions', v_target, v_section || '/' || (v_ssp.version_number + 1), 'detail/' || v_code);
        insert into pg_temp.product_detail_tracked
          select 'implemented_requirements', i.id, 'implemented_requirements/' || i.id, 'detail/' || v_code from public.implemented_requirements i where i.ssp_revision_id = v_target
          union all
          select 'implementation_statements', s.id, 'implementation_statements/' || s.id, 'detail/' || v_code from public.implementation_statements s where s.ssp_revision_id = v_target
          union all
          select 'component_contributions', c.id, 'component_contributions/' || c.id, 'detail/' || v_code from public.component_contributions c where c.ssp_revision_id = v_target;
        v_count := pg_temp.detail_narrate(p, v_code, v_boundary.id, v_target);
      else
        v_target := v_ssp.id;
        v_count := pg_temp.detail_narrate(p, v_code, v_boundary.id, v_target);
        -- A contribution of an element the program changed says so.
        update public.component_contributions cc set implementation_status = 'partial',
            description = cc.description || ' ' || (p->'sspNarratives'->>'changedContribution') || ' ('
              || array_to_string(e.product_change_kinds, ', ') || '): ' || e.product_change_rationale
          from public.system_components c join public.systems e on e.id = c.system_element_id
          where cc.tenant_id = t and cc.ssp_revision_id = v_target and c.id = cc.system_component_id and e.product_change_kinds is not null
            and cc.description not like '%' || (p->'sspNarratives'->>'changedContribution') || '%';
        -- The fourth step's draft is counted; an SSP this step's own variant came with is not listed.
        if not (v_variants ? v_boundary.code) then perform pg_temp.dupdated('implemented_requirements', v_count); end if;
      end if;
      perform pg_temp.detail_contribute(p, v_code, v_boundary, v_target,
        coalesce(v_prefixes->>v_boundary.code, p->'work'->v_code->>'prefix'), 'detail/' || v_code || '/ssp/' || v_boundary.code);
      -- A new variant's SSP is published, so its delta assessment can be planned.
      if v_variants ? v_boundary.code then
        update public.ssp_revisions set state = 'published', published_at = pg_temp.wtime(p, (p->'variantAssessments'->v_boundary.code->>'starts')::integer - 1, 15),
          configuration_baseline_id = (select b.id from public.configuration_baselines b where b.system_id = v_boundary.id and b.state = 'published' order by b.version_number desc limit 1)
          where id = v_target;
        perform pg_temp.dtrack('ssp_revisions', v_target, v_section || '/1', 'detail/' || v_code);
      end if;
      v_boundaries := v_boundaries || jsonb_build_object(v_boundary.code, v_target);
    end loop;
  end loop;

  -- ---- Campaigns ----------------------------------------------------------------------------
  -- The new variants' delta assessments, planned through the command as the account.
  for v_name, v_item in select key, value from jsonb_each(p->'variantAssessments') loop
    select * into v_boundary from public.systems where tenant_id = t and code = v_name and is_authorization_boundary;
    select code into v_code from public.programs where id = v_boundary.program_id;
    v_section := 'detail/' || v_code;
    perform pg_temp.as_account(p);
    v_plan := public.plan_delta_assessment(t, v_boundary.id, pg_temp.did(t, 'assessment_campaigns/delta/' || v_name), v_item->>'title');
    perform pg_temp.as_seed();
    v_campaign := (v_plan->>'campaignId')::uuid;
    v_plan_rev := (v_plan->>'planRevisionId')::uuid;
    perform pg_temp.dtrack('assessment_campaigns', v_campaign, v_section || '/assessment_campaigns/' || v_name, v_section);
    perform pg_temp.dtrack('assessment_plan_revisions', v_plan_rev, v_section || '/assessment_plan_revisions/' || v_name, v_section);
    insert into pg_temp.product_detail_tracked
      select 'assessment_objectives', o.id, 'assessment_objectives/' || o.id, v_section from public.assessment_objectives o where o.plan_revision_id = v_plan_rev;
    update public.assessment_campaigns set owner_party_id = pg_temp.dwho(v_item->>'owner'), status = v_item->>'status',
      starts_at = pg_temp.wtime(p, (v_item->>'starts')::integer, 9), ends_at = pg_temp.wtime(p, (v_item->>'ends')::integer, 17) where id = v_campaign;
    insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
      values (pg_temp.did(t, v_section || '/subjects/' || v_name), t, v_plan_rev, v_item->>'subject', v_boundary.id);
    perform pg_temp.dtrack('assessment_subjects', pg_temp.did(t, v_section || '/subjects/' || v_name), v_section || '/subjects/' || v_name, v_section);
    for v_entry, v_n in select value, n from jsonb_array_elements(v_item->'activities') with ordinality x(value, n) loop
      v_key := v_section || '/activities/' || v_name || '/' || v_n;
      insert into public.assessment_activities (id, tenant_id, plan_revision_id, title, description, method)
        values (pg_temp.did(t, v_key), t, v_plan_rev, v_entry->>0, v_entry->>2, v_entry->>1);
      perform pg_temp.dtrack('assessment_activities', pg_temp.did(t, v_key), v_key, v_section);
      insert into public.activity_steps (id, tenant_id, plan_revision_id, activity_id, sequence_number, instruction, expected_result)
        select pg_temp.did(t, v_key || '/steps/' || s.sequence_number), t, v_plan_rev, pg_temp.did(t, v_key), s.sequence_number, s.instruction, s.expected_result
        from public.procedure_steps s where s.procedure_revision_id = (p->'detail'->v_code->'procedureRevisions'->>(v_entry->>3))::uuid;
      insert into pg_temp.product_detail_tracked
        select 'activity_steps', s.id, 'activity_steps/' || s.id, v_section from public.activity_steps s where s.activity_id = pg_temp.did(t, v_key);
    end loop;
    for v_entry, v_n in select value, n from jsonb_array_elements(v_item->'events') with ordinality x(value, n) loop
      v_key := v_section || '/events/' || v_name || '/' || v_n;
      insert into public.assessment_events (id, tenant_id, campaign_id, plan_revision_id, title, description, status, starts_at, ends_at, location)
        values (pg_temp.did(t, v_key), t, v_campaign, v_plan_rev, v_entry->>0, v_entry->>5, v_entry->>1,
          pg_temp.wtime(p, (v_entry->>2)::integer, 9), pg_temp.wtime(p, (v_entry->>3)::integer, 17), v_entry->>4);
      perform pg_temp.dtrack('assessment_events', pg_temp.did(t, v_key), v_key, v_section);
    end loop;
    for v_entry, v_n in select value, n from jsonb_array_elements(v_item->'schedule') with ordinality x(value, n) loop
      v_key := v_section || '/scheduled/' || v_name || '/' || v_n;
      insert into public.scheduled_assessment_tasks (id, tenant_id, plan_revision_id, title, description, owner_party_id, status, starts_at, due_on)
        values (pg_temp.did(t, v_key), t, v_plan_rev, v_entry->>0, v_entry->>5, pg_temp.dwho(v_entry->>4), v_entry->>1,
          pg_temp.wtime(p, (v_entry->>2)::integer, 13), pg_temp.wday(p, (v_entry->>3)::integer));
      perform pg_temp.dtrack('scheduled_assessment_tasks', pg_temp.did(t, v_key), v_key, v_section);
    end loop;
    perform pg_temp.as_account(p);
    v_read := v_read || jsonb_build_object(v_name, (public.variant_control_delta(t, v_boundary.id)->'totals')
      || jsonb_build_object('objectives', (v_plan->>'objectives')::integer));
    perform pg_temp.as_seed();
  end loop;

  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    v_section := 'detail/' || v_code;
    v_entry := p->'detail'->v_code;
    select * into v_program from public.programs where tenant_id = t and code = v_code;
    v_campaign := pg_temp.sid(t, 'assessment_campaigns/delta/' || v_code);
    select id into v_other from public.assessment_plan_revisions where campaign_id = v_campaign and version_number = 1;
    -- A draft revision 2 of the delta assessment's plan, which schedules the retests.
    v_plan_rev := pg_temp.did(t, v_section || '/retest_plan');
    insert into public.assessment_plan_revisions (id, tenant_id, version_number, state, campaign_id, ssp_revision_id, title, description)
      select v_plan_rev, t, 2, 'draft', v_campaign, r.ssp_revision_id, v_entry->'retests'->>'title', v_entry->'retests'->>'description'
      from public.assessment_plan_revisions r where r.id = v_other;
    perform pg_temp.dtrack('assessment_plan_revisions', v_plan_rev, v_section || '/retest_plan', v_section);
    insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
      select pg_temp.did(t, v_section || '/retest_plan/subject'), t, v_plan_rev, s.description, s.system_id
      from public.assessment_subjects s where s.plan_revision_id = v_other order by s.id limit 1;
    perform pg_temp.dtrack('assessment_subjects', pg_temp.did(t, v_section || '/retest_plan/subject'), v_section || '/retest_plan/subject', v_section);
    -- One retest an objective the delta assessment found short, by the finding the work step wrote on
    -- it (its control's code and the objective, 20261114144406_plan_delta_by_objective).
    insert into public.assessment_objectives (id, tenant_id, plan_revision_id, title, description, target_control_part_id, acceptance_criterion)
      select pg_temp.did(t, v_section || '/retest_plan/objectives/' || o.id), t, v_plan_rev, 'Retest ' || o.title,
        'Found ' || replace(f.determination, '_', ' ') || ' in revision 1''s results.', o.target_control_part_id,
        'The objective is met when retested on the changed element.'
      from public.assessment_findings f
      join public.assessment_results_revisions rr on rr.id = f.assessment_results_revision_id
      join public.assessment_objectives o on o.plan_revision_id = v_other and o.target_control_part_id = f.target_control_part_id
      join public.control_parts cp on cp.id = o.target_control_part_id
      join public.controls k on k.id = cp.control_id
      where rr.assessment_plan_revision_id = v_other and f.determination in ('other_than_satisfied', 'partially_satisfied')
        and f.id = pg_temp.w4(t, 'work/' || v_code || '/assessment_findings/delta/' || k.code || '/' || o.target_control_part_id);
    insert into pg_temp.product_detail_tracked
      select 'assessment_objectives', o.id, 'assessment_objectives/' || o.id, v_section from public.assessment_objectives o where o.plan_revision_id = v_plan_rev;
    for v_item, v_n in select value, n from jsonb_array_elements(v_entry->'retests'->'schedule') with ordinality x(value, n) loop
      v_key := v_section || '/retest_plan/scheduled/' || v_n;
      insert into public.scheduled_assessment_tasks (id, tenant_id, plan_revision_id, title, description, owner_party_id, status, starts_at, due_on)
        values (pg_temp.did(t, v_key), t, v_plan_rev, v_item->>0, v_item->>5, pg_temp.dwho(v_item->>4), v_item->>1,
          pg_temp.wtime(p, (v_item->>2)::integer, 13), pg_temp.wday(p, (v_item->>3)::integer));
      perform pg_temp.dtrack('scheduled_assessment_tasks', pg_temp.did(t, v_key), v_key, v_section);
    end loop;
    -- The witnessing campaign's events, objectives and activities.
    v_campaign := pg_temp.w4(t, 'work/' || v_code || '/assessment_campaigns/witness');
    v_plan_rev := pg_temp.w4(t, 'work/' || v_code || '/assessment_plan_revisions/witness');
    for v_item, v_n in select value, n from jsonb_array_elements(v_entry->'witness'->'events') with ordinality x(value, n) loop
      v_key := v_section || '/witness/events/' || v_n;
      insert into public.assessment_events (id, tenant_id, campaign_id, plan_revision_id, title, description, status, starts_at, ends_at, location)
        values (pg_temp.did(t, v_key), t, v_campaign, v_plan_rev, v_item->>0, v_item->>5, v_item->>1,
          pg_temp.wtime(p, (v_item->>2)::integer, 9), pg_temp.wtime(p, (v_item->>3)::integer, 17), v_item->>4);
      perform pg_temp.dtrack('assessment_events', pg_temp.did(t, v_key), v_key, v_section);
    end loop;
    insert into public.assessment_objectives (id, tenant_id, plan_revision_id, title, description, acceptance_criterion)
      select pg_temp.did(t, v_section || '/witness/objectives/' || s.n), t, v_plan_rev,
        upper(left(regexp_replace(s.value->>0, '^Witness (the )?', ''), 1)) || substr(regexp_replace(s.value->>0, '^Witness (the )?', ''), 2),
        'Witnessed by the assessor for the customer.', 'The assessor signs the record of the witnessed test.'
      from jsonb_array_elements(p->'work'->v_code->'witness'->'schedule') with ordinality s(value, n)
      where s.value->>1 <> 'cancelled';
    insert into pg_temp.product_detail_tracked
      select 'assessment_objectives', o.id, 'assessment_objectives/' || o.id, v_section from public.assessment_objectives o
      where o.plan_revision_id = v_plan_rev and o.id in (select pg_temp.did(t, v_section || '/witness/objectives/' || n) from generate_series(1, 50) n);
    for v_text, v_n in select value, n from jsonb_array_elements_text(v_entry->'witness'->'activities') with ordinality x(value, n) loop
      v_key := v_section || '/witness/activities/' || v_n;
      select r.title, r.method into v_name, v_status from public.procedure_revisions r where r.id = (v_entry->'procedureRevisions'->>v_text)::uuid;
      insert into public.assessment_activities (id, tenant_id, plan_revision_id, title, description, method)
        values (pg_temp.did(t, v_key), t, v_plan_rev, 'Witness the ' || lower(left(v_name, 1)) || substr(v_name, 2),
          'The assessor witnesses the program run the procedure.', case when v_status in ('examine', 'interview', 'test') then v_status else 'examine' end);
      perform pg_temp.dtrack('assessment_activities', pg_temp.did(t, v_key), v_key, v_section);
      insert into public.activity_steps (id, tenant_id, plan_revision_id, activity_id, sequence_number, instruction, expected_result)
        select pg_temp.did(t, v_key || '/steps/' || s.sequence_number), t, v_plan_rev, pg_temp.did(t, v_key), s.sequence_number, s.instruction, s.expected_result
        from public.procedure_steps s where s.procedure_revision_id = (v_entry->'procedureRevisions'->>v_text)::uuid;
      insert into pg_temp.product_detail_tracked
        select 'activity_steps', s.id, 'activity_steps/' || s.id, v_section from public.activity_steps s where s.activity_id = pg_temp.did(t, v_key);
    end loop;
    -- Test runs, each recorded step by step.
    for v_run, v_n in select value, n from jsonb_array_elements(v_entry->'runs') with ordinality x(value, n) loop
      if v_run->>'campaign' = 'delta' then
        v_plan_rev := (select id from public.assessment_plan_revisions where campaign_id = pg_temp.sid(t, 'assessment_campaigns/delta/' || v_code) and version_number = 1);
        v_event := pg_temp.w4(t, 'work/' || v_code || '/assessment_events/' || (v_run->>'event'));
        v_task := null;
        v_baseline := pg_temp.w4(t, 'work/' || v_code || '/configuration_baselines/1');
      elsif v_run->>'campaign' = 'witness' then
        v_plan_rev := pg_temp.w4(t, 'work/' || v_code || '/assessment_plan_revisions/witness');
        v_event := null;
        v_task := case when v_run ? 'task' then pg_temp.w4(t, 'work/' || v_code || '/scheduled_assessment_tasks/' || (v_run->>'task')) end;
        v_baseline := pg_temp.w4(t, 'work/' || v_code || '/configuration_baselines/1');
      else
        v_plan_rev := (select id from public.assessment_plan_revisions where campaign_id = pg_temp.did(t, 'assessment_campaigns/delta/' || (v_run->>'campaign')) and version_number = 1);
        v_event := pg_temp.did(t, v_section || '/events/' || (v_run->>'campaign') || '/' || (v_run->>'event'));
        v_task := null;
        v_baseline := pg_temp.did(t, 'productDetail/configuration_baselines/' || (v_run->>'campaign'));
      end if;
      perform pg_temp.detail_run(p, v_code, v_run, v_n, (v_entry->'procedureRevisions'->>(v_run->>'procedure'))::uuid, v_baseline, v_plan_rev, v_event, v_task);
    end loop;
  end loop;

  -- ---- Inventory: one item an element of every variant, the variant itself among them -------
  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    select * into v_program from public.programs where tenant_id = t and code = v_code;
    for v_boundary in select * from public.systems where tenant_id = t and program_id = v_program.id and is_authorization_boundary order by code loop
      v_section := 'detail/' || v_code || '/inventory/' || v_boundary.code;
      insert into public.inventory_items (id, tenant_id, system_id, composition_node_id, asset_id, name, description, serial_number, manufacturer, model, asset_owner_party_id, installed_on)
      select pg_temp.did(t, v_section || '/' || e.code), t, v_boundary.id, e.id,
        v_boundary.code || '-' || lpad(row_number() over (order by e.id <> v_boundary.id, e.code)::text, 3, '0'),
        e.name || case when e.id = v_boundary.id then ', first article' else '' end,
        coalesce(e.description, e.name),
        case when e.system_type = 'software' then null
          else upper(coalesce(nullif(regexp_replace(coalesce(pe.code,
              case when e.id = v_boundary.id then x.product else regexp_replace(e.code, '^.*-', '') end), '[^A-Za-z0-9]', '', 'g'), ''), 'UNIT')) || '-'
            || lpad((1000 + pg_temp.bucket('serial/' || e.code) * 89 % 9000)::text, 4, '0') end,
        case when pe.id is null and e.id <> v_boundary.id then p->'manufacturers'->>'own' else p->'manufacturers'->>x.product end,
        case when e.id = v_boundary.id then x.product || '-' || coalesce(c.code, '')
          when pe.id is null then e.code
          when e.system_type = 'software' then x.product || '-' || pe.code || ' build'
          else x.product || '-' || pe.code end,
        coalesce(e.system_owner_party_id, v_boundary.system_owner_party_id),
        greatest(coalesce(v_program.starts_on, (p->>'asOf')::date - 60) + 45, (p->>'asOf')::date - 40)
      from public.systems e
      left join public.product_elements pe on pe.id = e.product_element_id
      left join public.product_configurations c on c.id = v_boundary.product_configuration_id
      cross join lateral (select coalesce((select px.code from public.product_revisions pr join public.products px on px.id = pr.product_id
        where pr.id = v_boundary.product_revision_id), 'own') as product) x
      where e.tenant_id = t and e.boundary_system_id = v_boundary.id
        and not exists (select 1 from public.inventory_items ii where ii.composition_node_id = e.id);
      insert into public.inventory_components (id, tenant_id, system_id, inventory_item_id, system_component_id)
        select pg_temp.did(t, v_section || '/components/' || c.id), t, v_boundary.id, ii.id, c.id
        from public.inventory_items ii
        join public.system_components c on c.system_id = v_boundary.id and c.system_element_id = ii.composition_node_id
        where ii.system_id = v_boundary.id and ii.id = pg_temp.did(t, v_section || '/' || (select code from public.systems where id = ii.composition_node_id));
      insert into pg_temp.product_detail_tracked
        select 'inventory_items', ii.id, 'inventory_items/' || ii.id, 'detail/' || v_code from public.inventory_items ii
          where ii.system_id = v_boundary.id and ii.id = pg_temp.did(t, v_section || '/' || (select code from public.systems where id = ii.composition_node_id))
        union all
        select 'inventory_components', ic.id, 'inventory_components/' || ic.id, 'detail/' || v_code from public.inventory_components ic
          where ic.system_id = v_boundary.id and ic.id = pg_temp.did(t, v_section || '/components/' || ic.system_component_id);
    end loop;
  end loop;

  -- What the programs' Overviews will count, read as the account.
  perform pg_temp.as_account(p);
  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    select * into v_program from public.programs where tenant_id = t and code = v_code;
    v_read := v_read || jsonb_build_object(v_code, public.program_control_status(v_program.id)->'totals');
  end loop;
  perform pg_temp.as_seed();

  -- Provenance: one batch, one source a section of the scenario, one record a row written.
  v_job := pg_temp.did(t, 'ingestion_jobs/products-detail');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Products detail demo seed', 'urn:program-assurance:demo:' || (p->>'detailDatasetId'), 'completed', now(), now(),
      'Authored records one click down for the programs of the products scenario (scripts/demo/products-detail-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(distinct destination_id) as n from pg_temp.product_detail_tracked group by destination_table) c;
  select coalesce(jsonb_object_agg(table_name, n), '{}'::jsonb) into v_updated
    from (select table_name, sum(n) as n from pg_temp.product_detail_updated group by table_name) c;
  v_batch := pg_temp.did(t, 'demo_import_batches');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'detailDatasetId', p->>'detailScenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-detail-scenario.mjs', 'asOf', p->>'asOf'),
      jsonb_build_object('tables', v_tables, 'updated', v_updated, 'read', v_read, 'skipped', v_skipped));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
  select pg_temp.did(t, 'demo_import_sources/' || x.section), t, v_batch, '/' || x.section,
    encode(extensions.digest(coalesce(p #> string_to_array(x.section, '/'), 'null'::jsonb)::text, 'sha256'), 'hex'),
    p #> string_to_array(x.section, '/')
  from (select distinct split_part(section, '/ssp/', 1) as section from pg_temp.product_detail_tracked) x;
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select distinct on (k.destination_table, k.destination_id)
    pg_temp.did(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'detailDatasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || x.source_pointer, x.source_sha256, x.id,
    jsonb_build_object('section', k.section)
  from pg_temp.product_detail_tracked k
  join public.demo_import_sources x on x.tenant_id = t and x.import_batch_id = v_batch and x.source_pointer = '/' || split_part(k.section, '/ssp/', 1)
  order by k.destination_table, k.destination_id, k.source_key;
  v_review := pg_temp.seed_product_review(p, v_batch);

  return jsonb_build_object(
    'changed', true,
    'tables', (select summary->'tables' from public.demo_import_batches where id = v_batch),
    'updated', v_updated,
    'records', (select count(*) from public.demo_import_records where tenant_id = t and import_batch_id = v_batch),
    'read', v_read,
    'skipped', v_skipped,
    'review', v_review
  );
end;
$seed$;

-- What waits on a reviewer (products-detail-scenario.mjs, reviewQueue), written after the records
-- one click down under the same batch. The G40 judged against a second baseline is left a draft
-- holding the determinations its assessor has recorded through the command as the account. Customer
-- B's package is with the customer for a decision: it holds the published SSP and delta assessment
-- plan the program's draft package holds, is published and submitted by its owner and reviewed by
-- the program's assessor, as the showcase's submitted packages are, and carries no authorization
-- decision. Each is written once: a workspace that holds it is left as it is, and one whose fifth
-- step ran before it is given it, its days counted from the as-of day the batch recorded.
create function pg_temp.seed_product_review(p jsonb, p_batch uuid) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  rq jsonb := p->'reviewQueue';
  v_source uuid := pg_temp.did(t, 'demo_import_sources/reviewQueue');
  v_hash text := encode(extensions.digest(rq::text, 'sha256'), 'hex');
  v_days jsonb; v_item jsonb; v_entry jsonb; v_key text; v_n integer;
  v_revision public.product_revisions; v_resolution uuid; v_catalog uuid; v_assessment uuid; v_element uuid; v_controls uuid[];
  v_assessor uuid; v_program uuid; v_held public.authorization_packages; v_ssp uuid; v_plan uuid;
  v_package uuid; v_package_rev uuid; v_owner uuid; v_reviewer uuid; v_id uuid;
  v_written jsonb := '{}'; v_tracked jsonb := '[]';
begin
  select jsonb_build_object('asOf', coalesce(source_manifest->>'asOf', p->>'asOf')) into v_days
    from public.demo_import_batches where id = p_batch;

  -- The G40 against a second baseline, a draft holding what its assessor has judged so far.
  v_item := rq->'productAssessment';
  v_key := 'reviewQueue/product_assessments/' || (v_item->>'product') || '/' || (v_item->>'version') || '/' || (v_item->>'baseline');
  v_assessment := pg_temp.did(t, v_key);
  if not exists (select 1 from public.product_assessments where id = v_assessment) then
    select r.* into v_revision from public.product_revisions r join public.products x on x.id = r.product_id
      where x.tenant_id = t and x.code = v_item->>'product' and r.version_number = (v_item->>'version')::integer;
    if v_revision.id is null or v_revision.state <> 'published' then
      raise exception '% version % is not published in this workspace.', v_item->>'product', v_item->>'version';
    end if;
    select b.resolution_id, b.catalog_revision_id into v_resolution, v_catalog from pg_temp.reference_baseline(v_item->>'baseline') b;
    select id into v_assessor from public.parties where tenant_id = t and name = v_item->>'assessor' order by id limit 1;
    if v_assessor is null then raise exception 'Person "%" is not in this workspace.', v_item->>'assessor'; end if;
    perform pg_temp.as_account(p);
    insert into public.product_assessments (id, tenant_id, product_revision_id, profile_resolution_id, title, description, assessor_party_id, started_on)
      values (v_assessment, t, v_revision.id, v_resolution, v_item->>'title', v_item->>'description', v_assessor,
        pg_temp.wday(v_days, (v_item->>'startedOn')::integer));
    for v_entry in select value from jsonb_array_elements(v_item->'determinations') loop
      v_element := null;
      if v_entry->>0 is not null then
        select e.id into v_element from public.product_elements e
          where e.tenant_id = t and e.product_revision_id = v_revision.id and e.code = v_entry->>0;
        if v_element is null then
          raise exception '% version % holds no element %.', v_item->>'product', v_item->>'version', v_entry->>0;
        end if;
      end if;
      select array_agg(k.id) into v_controls from public.controls k
        where k.catalog_revision_id = v_catalog and k.code in (select jsonb_array_elements_text(v_entry->1));
      if coalesce(cardinality(v_controls), 0) <> jsonb_array_length(v_entry->1) then
        raise exception 'A control of % is not in the catalog of the %.', v_entry->1, v_item->>'baseline';
      end if;
      perform public.record_product_determinations(t, v_assessment, v_element, v_controls, v_entry->>2, v_entry->>3);
    end loop;
    perform pg_temp.as_seed();
    select count(*) into v_n from public.product_determinations where tenant_id = t and product_assessment_id = v_assessment;
    v_tracked := v_tracked || jsonb_build_array(jsonb_build_array('product_assessments', v_assessment, v_key))
      || coalesce((select jsonb_agg(jsonb_build_array('product_determinations', d.id, 'product_determinations/' || d.id))
        from public.product_determinations d where d.tenant_id = t and d.product_assessment_id = v_assessment), '[]'::jsonb);
    v_written := v_written || jsonb_build_object('productAssessment',
      jsonb_build_object('title', v_item->>'title', 'determinations', v_n));
  end if;

  -- Customer B's package, with the customer for a decision.
  v_item := rq->'package';
  v_key := 'reviewQueue/authorization_packages/' || (v_item->>'program') || '/' || (v_item->>'key');
  v_package := pg_temp.did(t, v_key);
  if not exists (select 1 from public.authorization_packages where id = v_package) then
    select id into v_program from public.programs where tenant_id = t and code = v_item->>'program';
    -- The program's draft package: the boundary it is for and the published documents it holds.
    select ap.* into v_held from public.authorization_packages ap
      where ap.tenant_id = t and ap.program_id = v_program and ap.id <> v_package order by ap.created_at, ap.id limit 1;
    select d.ssp_revision_id into v_ssp from public.package_documents d join public.package_revisions r on r.id = d.package_revision_id
      where r.tenant_id = t and r.package_id = v_held.id and d.ssp_revision_id is not null order by r.version_number desc limit 1;
    select d.assessment_plan_revision_id into v_plan from public.package_documents d join public.package_revisions r on r.id = d.package_revision_id
      where r.tenant_id = t and r.package_id = v_held.id and d.assessment_plan_revision_id is not null order by r.version_number desc limit 1;
    if v_held.id is null or (v_item->'documents' ? 'ssp' and v_ssp is null) or (v_item->'documents' ? 'plan' and v_plan is null) then
      raise exception '% holds no package with its published SSP and delta assessment plan. The fourth step writes it.', v_item->>'program';
    end if;
    select id into v_owner from public.parties where tenant_id = t and name = v_item->>'owner' order by id limit 1;
    select id into v_reviewer from public.parties where tenant_id = t and name = v_item->'review'->>0 order by id limit 1;
    if v_owner is null or v_reviewer is null then
      raise exception '"%" or "%" is not in this workspace.', v_item->>'owner', v_item->'review'->>0;
    end if;
    insert into public.authorization_packages (id, tenant_id, program_id, system_id, title, owner_party_id)
      values (v_package, t, v_program, v_held.system_id, v_item->>'title', v_owner);
    v_package_rev := pg_temp.did(t, v_key || '/package_revisions/1');
    insert into public.package_revisions (id, tenant_id, version_number, state, package_id, description, submitted_at)
      values (v_package_rev, t, 1, 'draft', v_package, v_item->>'description', pg_temp.wtime(v_days, (v_item->>'submitted')::integer, 15));
    v_tracked := v_tracked || jsonb_build_array(jsonb_build_array('authorization_packages', v_package, v_key),
      jsonb_build_array('package_revisions', v_package_rev, v_key || '/package_revisions/1'));
    if v_item->'documents' ? 'ssp' then
      v_id := pg_temp.did(t, v_key || '/package_documents/ssp');
      insert into public.package_documents (id, tenant_id, package_revision_id, title, ssp_revision_id)
        values (v_id, t, v_package_rev, 'System security plan', v_ssp);
      v_tracked := v_tracked || jsonb_build_array(jsonb_build_array('package_documents', v_id, v_key || '/package_documents/ssp'));
    end if;
    if v_item->'documents' ? 'plan' then
      v_id := pg_temp.did(t, v_key || '/package_documents/plan');
      insert into public.package_documents (id, tenant_id, package_revision_id, title, assessment_plan_revision_id)
        values (v_id, t, v_package_rev, 'Delta assessment plan', v_plan);
      v_tracked := v_tracked || jsonb_build_array(jsonb_build_array('package_documents', v_id, v_key || '/package_documents/plan'));
    end if;
    update public.package_revisions set state = 'published', published_by_party_id = v_owner,
        published_at = pg_temp.wtime(v_days, (v_item->>'submitted')::integer, 16)
      where id = v_package_rev;
    v_id := pg_temp.did(t, v_key || '/review_decisions/1');
    insert into public.review_decisions (id, tenant_id, package_revision_id, reviewer_party_id, decision, rationale, decided_at)
      values (v_id, t, v_package_rev, v_reviewer, v_item->'review'->>1, v_item->'review'->>2,
        pg_temp.wtime(v_days, (v_item->'review'->>3)::integer, 15));
    v_tracked := v_tracked || jsonb_build_array(jsonb_build_array('review_decisions', v_id, v_key || '/review_decisions/1'));
    v_written := v_written || jsonb_build_object('package', jsonb_build_object('title', v_item->>'title',
      'submittedAt', pg_temp.wtime(v_days, (v_item->>'submitted')::integer, 15)));
  end if;

  if jsonb_array_length(v_tracked) > 0 then
    insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
      values (v_source, t, p_batch, '/reviewQueue', v_hash, rq)
      on conflict (id) do nothing;
    insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
    select pg_temp.did(t, 'demo_import_records/' || (x->>0) || '/' || (x->>1)), t, p_batch, p->>'detailDatasetId',
      x->>0, (x->>1)::uuid, x->>2, '/reviewQueue', v_hash, v_source, jsonb_build_object('section', 'reviewQueue')
    from jsonb_array_elements(v_tracked) x;
    update public.demo_import_batches set summary = summary || jsonb_build_object(
        'reviewQueue', coalesce(summary->'reviewQueue', '{}'::jsonb) || v_written,
        'tables', (select jsonb_object_agg(destination_table, n) from (select destination_table, count(*) as n
          from public.demo_import_records where tenant_id = t and import_batch_id = p_batch group by destination_table) c))
      where id = p_batch;
  end if;
  return jsonb_build_object('changed', jsonb_array_length(v_tracked) > 0, 'written', v_written,
    'records', jsonb_array_length(v_tracked));
end;
$seed$;

-- The seventh step: the customers' requirements flowed down into the variants' elements
-- (products-detail-scenario.mjs, flowDown), under the dataset `products-flowdown-v1`. Each named
-- element is allocated its requirement with the rationale written for it; an element that holds
-- others is then allocated what they carry; and the evidence an element holds where its
-- requirement's own does not show it is created through the product's command as the account,
-- published, reviewed and cited by the requirement. It runs once a workspace.
create temp table product_flowdown_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;
-- A stable identity for a record of this step.
create function pg_temp.fid(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/products-flowdown-v1/' || p_key)::uuid
$$;
-- Names as a reader says them: "A", "A and B", "A, B and C".
create function pg_temp.and_list(p_names text[]) returns text language sql immutable as $$
  select case when cardinality(p_names) < 2 then coalesce(p_names[1], '')
    else array_to_string(p_names[1:cardinality(p_names) - 1], ', ') || ' and ' || p_names[cardinality(p_names)] end
$$;
-- A person of the workspace by name; the step names only people the fourth step holds.
create function pg_temp.fperson(p_tenant uuid, p_name text) returns uuid language plpgsql stable as $$
declare v uuid;
begin
  select id into v from public.parties where tenant_id = p_tenant and name = p_name order by id limit 1;
  if v is null then raise exception 'The flow-down names "%", who is not in this workspace.', p_name; end if;
  return v;
end $$;

create function pg_temp.seed_product_flowdown(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  f jsonb := p->'flowDown';
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_programs text[];
  v_code text; v_list jsonb; v_item jsonb; v_program uuid; v_rev uuid; v_system public.systems; v_key text;
  v_result jsonb; v_version uuid; v_text text; v_owner uuid; v_day date; v_added integer; v_parents integer := 0;
  v_job uuid; v_batch uuid; v_hash text; v_tables jsonb; v_empty jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-product-flowdown', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'flowDownDatasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the flow-down.');
  end if;
  select array_agg(key) into v_programs from jsonb_object_keys(f->'allocations') key;

  -- The named elements, each with the requirement it carries, at the requirement's latest revision.
  for v_code, v_list in select key, value from jsonb_each(f->'allocations') loop
    select id into v_program from public.programs where tenant_id = t and code = v_code;
    if v_program is null then
      raise exception 'Program % is not in this workspace. The products scenario writes it first.', v_code;
    end if;
    for v_item in select value from jsonb_array_elements(v_list) loop
      select v.id into v_rev from public.engineering_requirements q
        join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
        where q.tenant_id = t and q.program_id = v_program and q.source_reference = v_item->>0
        order by v.version_number desc limit 1;
      if v_rev is null then raise exception '% has no customer requirement %.', v_code, v_item->>0; end if;
      select * into v_system from public.systems
        where tenant_id = t and program_id = v_program and code = v_item->>1 and not is_authorization_boundary;
      if v_system.id is null then raise exception '% holds no element %.', v_code, v_item->>1; end if;
      continue when exists (select 1 from public.requirement_allocations
        where tenant_id = t and requirement_revision_id = v_rev and system_id = v_system.id);
      v_key := 'allocations/' || v_code || '/' || (v_item->>0) || '/' || (v_item->>1);
      insert into public.requirement_allocations (id, tenant_id, requirement_revision_id, system_id, rationale)
        values (pg_temp.fid(t, v_key), t, v_rev, v_system.id, v_item->>2);
      insert into pg_temp.product_flowdown_tracked values ('requirement_allocations', pg_temp.fid(t, v_key), v_key, 'allocations');
    end loop;
  end loop;

  -- An element that holds others carries what they carry, at the latest revision, until nothing
  -- more is carried up: the boundary itself keeps only what is allocated to the variant as a whole.
  loop
    with carried as (
      select pe.id as parent_id, pe.code as parent_code, a.requirement_revision_id,
        pg_temp.and_list(array_agg(distinct c.name order by c.name)) as elements
      from public.systems pe
      join public.programs g on g.id = pe.program_id
      join public.systems c on c.tenant_id = pe.tenant_id and c.parent_system_id = pe.id and c.boundary_system_id = pe.boundary_system_id
      join public.requirement_allocations a on a.tenant_id = c.tenant_id and a.system_id = c.id
      join public.requirement_revisions v on v.tenant_id = a.tenant_id and v.id = a.requirement_revision_id
      where pe.tenant_id = t and g.code = any(v_programs) and not pe.is_authorization_boundary
        and v.version_number = (select max(x.version_number) from public.requirement_revisions x
          where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
        and not exists (select 1 from public.requirement_allocations y
          where y.tenant_id = t and y.system_id = pe.id and y.requirement_revision_id = a.requirement_revision_id)
      group by pe.id, pe.code, a.requirement_revision_id
    ), written as (
      insert into public.requirement_allocations (id, tenant_id, requirement_revision_id, system_id, rationale)
      select pg_temp.fid(t, 'allocations/parent/' || k.parent_code || '/' || k.requirement_revision_id), t,
        k.requirement_revision_id, k.parent_id, replace(f->>'parent', '{elements}', k.elements)
      from carried k
      returning id, system_id, requirement_revision_id
    )
    insert into pg_temp.product_flowdown_tracked
      select 'requirement_allocations', w.id, 'allocations/parent/' || w.system_id || '/' || w.requirement_revision_id, 'allocations'
      from written w;
    get diagnostics v_added = row_count;
    v_parents := v_parents + v_added;
    exit when v_added = 0;
  end loop;

  -- What an element holds where its requirement's own evidence does not show it.
  for v_item in select value from jsonb_array_elements(f->'evidence') loop
    select id into v_program from public.programs where tenant_id = t and code = v_item->>'program';
    select v.id into v_rev from public.engineering_requirements q
      join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
      where q.tenant_id = t and q.program_id = v_program and q.source_reference = v_item->>'requirement'
      order by v.version_number desc limit 1;
    if v_rev is null then raise exception '% has no customer requirement % for its evidence.', v_item->>'program', v_item->>'requirement'; end if;
    v_key := 'evidence/' || (v_item->>'program') || '/' || (v_item->>'key');
    v_text := 'urn:demo:evidence:' || lower(v_item->>'program') || ':' || (v_item->>'key');
    v_owner := pg_temp.fperson(t, v_item->>'owner');
    v_day := (p->>'asOf')::date + (v_item->>'collected')::integer;
    perform set_config('request.jwt.claims', v_claims, true);
    v_result := public.create_evidence_with_version(t, pg_temp.fid(t, v_key || '/request'), jsonb_build_object(
      'title', v_item->>'title', 'artifactKind', v_item->>'kind', 'programId', v_program, 'ownerPartyId', v_owner,
      'description', v_item->>'description', 'externalUri', v_text, 'collectedAt', v_day::text || 'T14:00:00Z',
      'provenance', p->>'evidenceProvenance'));
    perform set_config('request.jwt.claims', '', true);
    v_version := (v_result->>'versionId')::uuid;
    insert into pg_temp.product_flowdown_tracked values
      ('evidence_artifacts', (v_result->>'artifactId')::uuid, v_key, 'evidence'),
      ('evidence_versions', v_version, v_key || '/1', 'evidence');
    -- The hash of the version's name, standing in for the file the scenario has no bytes for.
    update public.evidence_versions set description = v_item->>'description', sha256 = encode(extensions.digest(v_text || '#1', 'sha256'), 'hex'),
        state = 'published', published_at = (v_day::timestamp + interval '17 hours') at time zone 'UTC', published_by_party_id = v_owner
      where id = v_version;
    insert into public.evidence_reviews (id, tenant_id, evidence_version_id, reviewer_party_id, decision, rationale, reviewed_at)
      values (pg_temp.fid(t, v_key || '/review'), t, v_version, pg_temp.fperson(t, v_item->>'reviewer'), 'accepted', f->>'review',
        ((v_day + 1)::timestamp + interval '11 hours') at time zone 'UTC');
    insert into pg_temp.product_flowdown_tracked values ('evidence_reviews', pg_temp.fid(t, v_key || '/review'), v_key || '/review', 'evidence');
    perform set_config('request.jwt.claims', v_claims, true);
    perform public.link_requirement_evidence(t, v_program, v_rev, array[v_version]);
    perform set_config('request.jwt.claims', '', true);
    update public.requirement_evidence set claim = v_item->>'claim' where requirement_revision_id = v_rev and evidence_version_id = v_version;
    insert into pg_temp.product_flowdown_tracked
      select 'requirement_evidence', re.id, 'requirement_evidence/' || re.id, 'evidence' from public.requirement_evidence re
      where re.requirement_revision_id = v_rev and re.evidence_version_id = v_version;
  end loop;

  -- What still reads empty: an element with nothing allocated to it and no evidence of its own.
  select coalesce(jsonb_agg(s.code order by s.code), '[]'::jsonb) into v_empty
  from public.systems s join public.programs g on g.id = s.program_id
  where s.tenant_id = t and g.code = any(v_programs) and not s.is_authorization_boundary
    and not exists (select 1 from public.requirement_allocations a where a.tenant_id = t and a.system_id = s.id)
    and not exists (select 1 from public.evidence_uses u where u.tenant_id = t and u.system_id = s.id)
    and not exists (select 1 from public.implementation_evidence ie
      join public.component_contributions cc on cc.id = ie.component_contribution_id
      join public.system_components sc on sc.id = cc.system_component_id
      where ie.tenant_id = t and coalesce(sc.system_element_id, sc.system_id) = s.id);

  v_job := pg_temp.fid(t, 'ingestion_jobs/flowdown');
  v_batch := pg_temp.fid(t, 'demo_import_batches/flowdown');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Requirement flow-down demo seed', 'urn:program-assurance:demo:' || (p->>'flowDownDatasetId'), 'completed', now(), now(),
      'The customers'' requirements flowed down into the variants'' elements (scripts/demo/products-detail-scenario.mjs).');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'flowDownDatasetId', p->>'detailScenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-detail-scenario.mjs'), '{}'::jsonb);
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
  select pg_temp.fid(t, 'demo_import_sources/' || s.section), t, v_batch, '/flowDown/' || s.section,
    encode(extensions.digest(coalesce(f->s.section, 'null'::jsonb)::text, 'sha256'), 'hex'), f->s.section
  from (select distinct section from pg_temp.product_flowdown_tracked) s;
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.fid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'flowDownDatasetId',
    k.destination_table, k.destination_id, k.source_key, '/flowDown/' || k.section, x.source_sha256, x.id, jsonb_build_object('section', k.section)
  from pg_temp.product_flowdown_tracked k
  join public.demo_import_sources x on x.tenant_id = t and x.import_batch_id = v_batch and x.source_pointer = '/flowDown/' || k.section;
  select coalesce(jsonb_object_agg(destination_table, n), '{}'::jsonb) into v_tables
    from (select destination_table, count(*) as n from pg_temp.product_flowdown_tracked group by destination_table) c;
  update public.demo_import_batches set summary = jsonb_build_object('tables', v_tables, 'carriedUp', v_parents, 'stillEmpty', v_empty)
    where id = v_batch;
  return jsonb_build_object('changed', true, 'tables', v_tables, 'records', (select count(*) from pg_temp.product_flowdown_tracked),
    'carriedUp', v_parents, 'stillEmpty', v_empty);
end;
$seed$;
