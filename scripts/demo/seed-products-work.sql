-- The fourth step of the products seed, loaded by scripts/seed-demo-products.mjs after
-- seed-products.sql, whose helpers it uses (sid, bucket, determination, reference_baseline,
-- write_product). The script calls pg_temp.seed_product_work(payload) in the same transaction.
--
-- It writes the work of the programs that take a product, the assessments the newer product
-- versions were owed, and a product and a program for the business line that had neither. Every
-- record it writes is listed in demo_import_records under the dataset `products-work-v1`; what it
-- changes in a record another step wrote is counted in the batch's summary, since a record is
-- listed once. It runs once a workspace: a workspace that holds the dataset's batch changes nothing.

create temp table product_work_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;
create temp table product_work_people (name text primary key, id uuid) on commit drop;
create temp table product_work_controls (
  resolution_id uuid not null, id uuid not null, code text not null, title text not null, family text,
  primary key (resolution_id, id)
) on commit drop;
create temp table product_work_delta (
  control_id uuid primary key, code text not null, family text, delta text not null, changed text,
  changed_codes text[] not null default '{}'
) on commit drop;
create temp table product_work_updated (table_name text not null, n bigint not null) on commit drop;

-- A stable identity for a record of this step: the same workspace and key give the same id.
create function pg_temp.wid(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/products-work-v1/' || p_key)::uuid
$$;
create function pg_temp.wtrack(p_table text, p_id uuid, p_key text, p_section text) returns uuid
language sql as $$
  insert into pg_temp.product_work_tracked values (p_table, p_id, p_key, p_section) returning destination_id
$$;
-- How many rows of another step's table this one changed.
create function pg_temp.wupdated(p_table text, p_n bigint) returns void language sql as $$
  insert into pg_temp.product_work_updated select p_table, p_n where p_n > 0
$$;
-- A person of the step's cast, by name. Nobody named is nobody; a name outside the cast is refused.
create function pg_temp.who(p_name text) returns uuid language plpgsql stable as $$
declare v uuid;
begin
  if p_name is null then return null; end if;
  select id into v from pg_temp.product_work_people where name = p_name;
  if not found then raise exception 'The step names "%", who is not in its cast.', p_name; end if;
  return v;
end $$;
-- A day and a moment counted from the day the step is seeded for.
create function pg_temp.wday(p jsonb, p_offset integer) returns date language sql immutable as $$
  select (p->>'asOf')::date + p_offset
$$;
create function pg_temp.wtime(p jsonb, p_offset integer, p_hour integer) returns timestamptz language sql immutable as $$
  select (((p->>'asOf')::date + p_offset)::timestamp + make_interval(hours => p_hour)) at time zone 'UTC'
$$;
-- The area of a program's trouble a control of its delta stands in, if any: a modified element's
-- controls in the area's families, or the program's own controls in them (products-work-scenario.mjs,
-- results.areas). The first area that holds the control answers.
create function pg_temp.work_trouble_area(p_areas jsonb, p_delta text, p_family text, p_changed text[]) returns jsonb
language sql immutable as $$
  select a.value from jsonb_array_elements(coalesce(p_areas, '[]'::jsonb)) with ordinality a(value, n)
  where a.value->'families' ? p_family
    and ((a.value->>'element' is null and p_delta = 'program_only')
      or (a.value->>'element' is not null and p_delta = 'changed_here' and a.value->>'element' = any(p_changed)))
  order by a.n limit 1
$$;
-- An item of a reference framework's current revision, by the framework's code and the item's.
create function pg_temp.work_framework_item(p_framework text, p_code text) returns uuid language sql stable as $$
  select i.id from public.framework_items i
  join public.frameworks f on f.current_revision_id = i.framework_revision_id
  where f.code = p_framework and i.code = p_code and i.tenant_id is null
$$;
-- The controls a baseline selects, read once.
create function pg_temp.work_controls_of(p_resolution uuid) returns void language plpgsql as $$
begin
  if exists (select 1 from pg_temp.product_work_controls c where c.resolution_id = p_resolution) then return; end if;
  insert into pg_temp.product_work_controls (resolution_id, id, code, title, family)
    select p_resolution, k.id, k.code, k.title, upper(g.source_id)
    from public.selected_controls sc
    join public.controls k on k.id = sc.control_id
    left join public.catalog_groups g on g.id = k.group_id
    where sc.profile_resolution_id = p_resolution;
end $$;
create function pg_temp.work_baseline(p_title text, out resolution_id uuid, out catalog_revision_id uuid)
language plpgsql as $$
begin
  select b.resolution_id, b.catalog_revision_id into resolution_id, catalog_revision_id from pg_temp.reference_baseline(p_title) b;
  if catalog_revision_id is null then
    raise exception 'The reference baseline "%" names no catalog edition.', p_title;
  end if;
  perform pg_temp.work_controls_of(resolution_id);
end $$;

-- A published component set: its components and what each claims of a baseline's controls.
-- Answers {revision, components: {key: defined component}}.
create function pg_temp.write_work_library(t uuid, p jsonb, lib jsonb) returns jsonb language plpgsql as $$
declare
  v_definition uuid := pg_temp.wid(t, 'component_definitions/' || (lib->>'code'));
  v_revision uuid := pg_temp.wid(t, 'component_definition_revisions/' || (lib->>'code') || '/1');
  v_resolution uuid; v_catalog uuid; v_item jsonb; v_id uuid; v_components jsonb := '{}';
begin
  if exists (select 1 from public.component_definitions where tenant_id = t and code = lib->>'code') then
    raise exception 'The workspace already has a library component coded %; the step does not overwrite it.', lib->>'code';
  end if;
  select * into v_resolution, v_catalog from pg_temp.work_baseline(lib->>'baseline');
  insert into public.component_definitions (id, tenant_id, code, name, description, category)
    values (v_definition, t, lib->>'code', lib->>'name', lib->>'description', 'catalog_product');
  insert into public.component_definition_revisions (id, tenant_id, component_definition_id, version_number, remarks, effective_from, conditions, consumer_responsibilities)
    values (v_revision, t, v_definition, 1, lib->>'remarks', (lib->>'effectiveFrom')::date, lib->>'conditions', lib->>'consumerResponsibilities');
  for v_item in select value from jsonb_array_elements(lib->'components') loop
    v_id := pg_temp.wid(t, 'defined_components/' || (v_item->>'key'));
    insert into public.defined_components (id, tenant_id, component_definition_revision_id, name, component_type, description)
      values (v_id, t, v_revision, v_item->>'name', v_item->>'type', v_item->>'description');
    v_components := v_components || jsonb_build_object(v_item->>'key', v_id);
    insert into public.defined_component_implementations (id, tenant_id, component_definition_revision_id, defined_component_id,
        control_id, description, implementation_status, coverage, consumer_responsibility)
    select pg_temp.wid(t, 'claims/' || (v_item->>'key') || '/' || k.code), t, v_revision, v_id, k.id,
      format('%s %s (%s %s).', v_item->>'name', coalesce(p->'familyPhrases'->>k.family, 'supports the control'), k.code, k.title),
      'implemented',
      case when c.b < 12 then 'partial' when c.b < 17 then 'conditional' else 'full' end,
      case when c.b < 17 then p->'consumerResponsibilities'->>k.family end
    from pg_temp.product_work_controls k
    cross join lateral (select pg_temp.bucket('coverage/' || (v_item->>'key') || '/' || k.code) as b) c
    where k.resolution_id = v_resolution
      and (k.code in (select jsonb_array_elements_text(v_item->'anchors'))
        or pg_temp.bucket('claim/' || (v_item->>'key') || '/' || k.code) < coalesce((v_item->'families'->>k.family)::integer, 0));
  end loop;
  update public.component_definition_revisions set state = 'published' where id = v_revision;
  insert into pg_temp.product_work_tracked
    select 'component_definitions', v_definition, 'component_definitions/' || (lib->>'code'), 'productWork'
    union all select 'component_definition_revisions', v_revision, 'component_definition_revisions/' || (lib->>'code') || '/1', 'productWork'
    union all select 'defined_components', c.id, 'defined_components/' || c.id, 'productWork' from public.defined_components c
      where c.tenant_id = t and c.component_definition_revision_id = v_revision
    union all select 'defined_component_implementations', i.id, 'defined_component_implementations/' || i.id, 'productWork'
      from public.defined_component_implementations i where i.tenant_id = t and i.component_definition_revision_id = v_revision;
  return jsonb_build_object('revision', v_revision, 'components', v_components);
end $$;

-- A product's published revisions and what hangs from them, listed for provenance.
create function pg_temp.track_work_revision(t uuid, p_revision uuid) returns void language sql as $$
  insert into pg_temp.product_work_tracked
    select 'product_revisions', r.id, 'product_revisions/' || r.id, 'productWork' from public.product_revisions r where r.tenant_id = t and r.id = p_revision
    union all select 'product_elements', e.id, 'product_elements/' || e.id, 'productWork' from public.product_elements e
      where e.tenant_id = t and e.product_revision_id = p_revision
    union all select 'product_configuration_elements', m.id, 'product_configuration_elements/' || m.id, 'productWork'
      from public.product_configuration_elements m where m.tenant_id = t and m.product_revision_id = p_revision
$$;

-- A published assessment of a product version: a determination an element and control it claims,
-- and one for the product as a whole on a share of the families its process answers.
create function pg_temp.write_work_assessment(t uuid, p jsonb, a jsonb, p_revision uuid, p_version integer) returns uuid
language plpgsql as $$
declare
  v_code text := a->>'product';
  v_assessment uuid := pg_temp.wid(t, 'product_assessments/' || v_code || '/' || p_version);
  v_resolution uuid; v_catalog uuid;
begin
  select * into v_resolution, v_catalog from pg_temp.work_baseline(a->>'baseline');
  insert into public.product_assessments (id, tenant_id, product_revision_id, profile_resolution_id, title, description, assessor_party_id, started_on, completed_on)
    values (v_assessment, t, p_revision, v_resolution, a->>'title', a->>'description', pg_temp.who(a->>'assessor'),
      (a->>'startedOn')::date, (a->>'completedOn')::date);
  insert into public.product_determinations (id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination)
  select pg_temp.wid(t, 'product_determinations/' || v_code || '/' || p_version || '/' || e.code || '/' || k.code), t, v_assessment, p_revision, e.id, k.id, d.determination
  from public.product_elements e
  join (select distinct i.defined_component_id, i.control_id from public.defined_component_implementations i
    where i.tenant_id = t and i.control_id is not null) i on i.defined_component_id = e.defined_component_id
  join pg_temp.product_work_controls k on k.resolution_id = v_resolution and k.id = i.control_id
  cross join lateral (select pg_temp.determination(pg_temp.bucket('determination/' || v_code || '/' || e.code || '/' || k.code),
    case when a->'weakElements' ? e.code then a->'weakSpread' else a->'spread' end) as determination) d
  where e.tenant_id = t and e.product_revision_id = p_revision and d.determination is not null;
  insert into public.product_determinations (id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination, rationale)
  select pg_temp.wid(t, 'product_determinations/' || v_code || '/' || p_version || '/product/' || k.code), t, v_assessment, p_revision, null, k.id,
    pg_temp.determination(pg_temp.bucket('whole-determination/' || v_code || '/' || k.code), a->'wholeSpread'), a->>'wholeRationale'
  from pg_temp.product_work_controls k
  where k.resolution_id = v_resolution and a->'wholeFamilies' ? k.family
    and pg_temp.bucket('whole/' || v_code || '/' || k.code) < (a->>'wholeShare')::integer;
  update public.product_assessments set state = 'published', published_at = (a->>'publishedAt')::timestamptz where id = v_assessment;
  insert into pg_temp.product_work_tracked
    select 'product_assessments', v_assessment, 'product_assessments/' || v_code || '/' || p_version, 'productWork'
    union all select 'product_determinations', d.id, 'product_determinations/' || d.id, 'productWork'
      from public.product_determinations d where d.tenant_id = t and d.product_assessment_id = v_assessment;
  return v_assessment;
end $$;

-- A program that takes a product, created through the program wizard as the account: one variant
-- of a configuration, without the elements it leaves out and with its own, then what it changed.
create function pg_temp.write_work_program(t uuid, p jsonb, item jsonb) returns uuid language plpgsql as $$
declare
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_variant jsonb := item->'variant'; w jsonb := p->'work'->(item->>'code');
  v_product public.products; v_revision public.product_revisions; v_configuration public.product_configurations;
  v_resolution uuid; v_catalog uuid; v_line uuid; v_elements jsonb; v_draft jsonb; v_created jsonb;
  v_program uuid; v_profile uuid; v_entry jsonb; v_system public.systems;
begin
  if exists (select 1 from public.programs where tenant_id = t and code = item->>'code') then
    raise exception 'The workspace already has a program coded %; the step does not overwrite it.', item->>'code';
  end if;
  if exists (select 1 from public.systems where tenant_id = t and code = v_variant->>'code') then
    raise exception 'The workspace already has a system coded %; the step does not overwrite it.', v_variant->>'code';
  end if;
  select * into v_product from public.products where tenant_id = t and code = item->>'product';
  select * into v_revision from public.product_revisions
    where tenant_id = t and product_id = v_product.id and state = 'published' order by version_number desc limit 1;
  select * into v_configuration from public.product_configurations
    where tenant_id = t and product_id = v_product.id and code = v_variant->>'configuration';
  if v_revision.id is null or v_configuration.id is null then
    raise exception '% has no published version of % in configuration %.', item->>'code', item->>'product', v_variant->>'configuration';
  end if;
  select * into v_resolution, v_catalog from pg_temp.work_baseline(item->>'baseline');
  select id into v_line from public.business_lines where tenant_id = t and code = item->>'businessLine';
  select coalesce(jsonb_agg(jsonb_build_object(
      'key', pg_temp.wid(t, 'variant/' || (v_variant->>'code') || '/' || e.code),
      'parentKey', case when pe.id is null then null else pg_temp.wid(t, 'variant/' || (v_variant->>'code') || '/' || pe.code) end,
      'code', (v_variant->>'prefix') || '-' || e.code, 'name', e.name, 'description', coalesce(e.description, ''),
      'type', case when e.defined_component_id is null then e.element_type end,
      'library', case when e.defined_component_id is null then null else jsonb_build_object(
        'revisionId', dc.component_definition_revision_id, 'definedComponentId', e.defined_component_id,
        'rationale', format('Inherited from %s v%s · %s.', v_product.name, v_revision.version_number, v_configuration.name)) end,
      'productElementId', e.id) order by e.position), '[]'::jsonb) into v_elements
  from public.product_elements e
  join public.product_configuration_elements m on m.tenant_id = t and m.product_element_id = e.id and m.product_configuration_id = v_configuration.id
  left join public.product_elements pe on pe.id = e.parent_element_id
  left join public.defined_components dc on dc.id = e.defined_component_id
  where e.tenant_id = t and e.product_revision_id = v_revision.id and not v_variant->'removed' ? e.code;
  select v_elements || coalesce(jsonb_agg(jsonb_build_object(
      'key', pg_temp.wid(t, 'variant/' || (v_variant->>'code') || '/' || (a.value->>0)),
      'parentKey', case when a.value->>3 is null then null else pg_temp.wid(t, 'variant/' || (v_variant->>'code') || '/' || (a.value->>3)) end,
      'code', (v_variant->>'prefix') || '-' || (a.value->>0), 'name', a.value->>1, 'description', coalesce(a.value->>4, ''),
      'type', a.value->>2, 'library', null, 'productElementId', null) order by a.position), '[]'::jsonb) into v_elements
  from jsonb_array_elements(v_variant->'added') with ordinality a(value, position);
  v_profile := pg_temp.wid(t, 'profile/' || (item->>'code'));
  v_draft := jsonb_build_object(
    'requestId', pg_temp.wid(t, 'program_wizard_requests/' || (item->>'code')),
    'code', item->>'code', 'name', item->>'name', 'description', item->>'description',
    'sponsorPartyId', pg_temp.who(w->>'sponsor'), 'startsOn', item->>'startsOn', 'endsOn', w->>'endsOn',
    'roles', (select coalesce(jsonb_agg(jsonb_build_object('partyId', pg_temp.who(r.value->>1), 'role', r.value->>0) order by r.n), '[]'::jsonb)
      from jsonb_array_elements(w->'roles') with ordinality r(value, n)),
    'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', v_profile, 'baseResolutionId', v_resolution, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', pg_temp.wid(t, 'variant/' || (v_variant->>'code')), 'code', v_variant->>'code', 'name', v_variant->>'name',
      'description', v_variant->>'description', 'type', 'platform', 'ownerPartyId', null,
      'confidentiality', v_variant->'impact'->>0, 'integrity', v_variant->'impact'->>1, 'availability', v_variant->'impact'->>2,
      'categorizationRationale', v_variant->>'rationale', 'profileKey', v_profile,
      'product', jsonb_build_object('revisionId', v_revision.id, 'configurationId', v_configuration.id),
      'elements', v_elements)));
  perform set_config('request.jwt.claims', v_claims, true);
  v_created := public.create_program_wizard(t, v_draft);
  v_program := (v_created->>'programId')::uuid;
  for v_entry in select value from jsonb_array_elements(v_variant->'changes') loop
    select * into v_system from public.systems where tenant_id = t and program_id = v_program
      and code = (v_variant->>'prefix') || '-' || (v_entry->>0);
    if v_system.id is null then
      raise exception '% does not keep the element % it is said to change.', item->>'code', v_entry->>0;
    end if;
    perform public.declare_product_element_change(t, v_system.id, v_system.revision,
      array(select jsonb_array_elements_text(v_entry->1)), v_entry->>2);
  end loop;
  perform set_config('request.jwt.claims', '', true);
  update public.programs set status = 'active', business_line_id = v_line where id = v_program;
  perform pg_temp.wtrack('programs', v_program, 'programs/' || (item->>'code'), 'productWork');
  insert into pg_temp.product_work_tracked
    select 'systems', s.id, 'systems/' || s.code, 'productWork' from public.systems s where s.tenant_id = t and s.program_id = v_program;
  return v_program;
end $$;

-- A customer's requirements document for a program this step adds: imported through the command
-- as the account, then where each requirement is allocated, the controls it maps and its answer.
create function pg_temp.write_work_requirements(t uuid, p jsonb, p_program uuid, item jsonb) returns void language plpgsql as $$
declare
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_entry jsonb := item->'requirements'; v_item jsonb; v_code text; v_key text; v_result jsonb;
  v_catalog uuid; v_source uuid; v_requirement uuid; v_revision uuid; v_system uuid; v_control uuid;
begin
  select c.catalog_revision_id into v_catalog from public.program_reference_choices c
    where c.tenant_id = t and c.program_id = p_program order by c.id limit 1;
  perform set_config('request.jwt.claims', v_claims, true);
  v_result := public.import_customer_requirements(t, p_program,
    pg_temp.wid(t, 'requirement_import_requests/' || (item->>'code')), v_entry->'source',
    (select jsonb_agg(jsonb_build_object('reference', i.value->>0, 'title', i.value->>1, 'statement', i.value->>2) order by i.position)
      from jsonb_array_elements(v_entry->'items') with ordinality i(value, position)));
  perform set_config('request.jwt.claims', '', true);
  v_source := (v_result->>'sourceId')::uuid;
  for v_item in select value from jsonb_array_elements(v_entry->'items') loop
    v_key := (item->>'code') || '/' || (v_item->>0);
    select q.id, v.id into v_requirement, v_revision
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = t and q.source_id = v_source and q.source_reference = v_item->>0;
    if v_revision is null then
      raise exception 'Requirement % of % was not imported.', v_item->>0, item->>'code';
    end if;
    for v_code in select jsonb_array_elements_text(v_item->3) loop
      select s.id into v_system from public.systems s
        where s.tenant_id = t and s.program_id = p_program and s.code = (item->'variant'->>'prefix') || '-' || v_code;
      if v_system is null then
        raise exception '% holds no element % for requirement %.', item->>'code', v_code, v_item->>0;
      end if;
      insert into public.requirement_allocations (id, tenant_id, requirement_revision_id, system_id, rationale)
        values (pg_temp.wid(t, 'requirement_allocations/' || v_key || '/' || v_code), t, v_revision, v_system,
          'Allocated where the customer''s requirement is met.');
    end loop;
    for v_code in select jsonb_array_elements_text(v_item->4) loop
      select k.id into v_control from public.controls k where k.catalog_revision_id = v_catalog and k.code = v_code;
      if v_control is null then
        raise exception 'Control % is not in the catalog edition of %.', v_code, item->>'code';
      end if;
      insert into public.requirement_control_links (id, tenant_id, requirement_revision_id, control_id, relationship_type, rationale)
        values (pg_temp.wid(t, 'requirement_control_links/' || v_key || '/' || v_code), t, v_revision, v_control, 'maps_to',
          'The customer''s requirement is met through this control.');
    end loop;
    if v_item->>5 is not null then
      insert into public.requirement_compliance (id, tenant_id, engineering_requirement_id, status, verification_method, statement)
        values (pg_temp.wid(t, 'requirement_compliance/' || v_key), t, v_requirement, v_item->>5, v_item->>6, v_item->>7);
    end if;
  end loop;
  insert into pg_temp.product_work_tracked
    select 'requirement_sources', s.id, 'requirement_sources/' || s.id, 'productWork'
      from public.requirement_sources s where s.tenant_id = t and s.id = v_source
    union all select 'engineering_requirements', q.id, 'engineering_requirements/' || q.id, 'productWork'
      from public.engineering_requirements q where q.tenant_id = t and q.source_id = v_source
    union all select 'requirement_revisions', v.id, 'requirement_revisions/' || v.id, 'productWork'
      from public.requirement_revisions v join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where v.tenant_id = t and q.source_id = v_source
    union all select 'requirement_allocations', a.id, 'requirement_allocations/' || a.id, 'productWork'
      from public.requirement_allocations a join public.requirement_revisions v on v.id = a.requirement_revision_id
      join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where a.tenant_id = t and q.source_id = v_source
    union all select 'requirement_control_links', l.id, 'requirement_control_links/' || l.id, 'productWork'
      from public.requirement_control_links l join public.requirement_revisions v on v.id = l.requirement_revision_id
      join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where l.tenant_id = t and q.source_id = v_source
    union all select 'requirement_compliance', c.id, 'requirement_compliance/' || c.id, 'productWork'
      from public.requirement_compliance c join public.engineering_requirements q on q.id = c.engineering_requirement_id
      where c.tenant_id = t and q.source_id = v_source;
end $$;

-- How each control stands in a variant, read as the account reads the Product delta and kept
-- where the SSP and the assessment results look it up.
create function pg_temp.read_work_delta(p jsonb, p_system uuid) returns jsonb language plpgsql as $$
declare v_delta jsonb;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
  v_delta := public.variant_control_delta((p->>'tenantId')::uuid, p_system);
  perform set_config('request.jwt.claims', '', true);
  truncate pg_temp.product_work_delta;
  insert into pg_temp.product_work_delta (control_id, code, family, delta, changed, changed_codes)
    select (c->>'id')::uuid, c->>'code', c->>'family', c->>'delta',
      (select string_agg((e->>'name') || case when e->>'change' = 'removed' then ' (removed)'
          else ' (' || coalesce((select string_agg(k.value, ', ' order by k.value) from jsonb_array_elements_text(e->'kinds') k), 'modified') || ')' end,
        ', ' order by e->>'code') from jsonb_array_elements(c->'changed_elements') e),
      coalesce((select array_agg(e->>'code' order by e->>'code') from jsonb_array_elements(c->'changed_elements') e), '{}')
    from jsonb_array_elements(v_delta->'controls') c;
  return v_delta;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The work of one program: who answers for it, its schedule, what was found and what is risked,
-- its remediation, its evidence, its SSP and its assessments. Answers what the program now reads.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.seed_program_work(p jsonb, p_code text) returns jsonb language plpgsql as $work$
declare
  t uuid := (p->>'tenantId')::uuid;
  w jsonb := p->'work'->p_code;
  s text := 'work/' || p_code;
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_program public.programs; v_boundary public.systems; v_ssp public.ssp_revisions; v_plan_row public.assessment_plan_revisions;
  v_item jsonb; v_entry jsonb; v_first jsonb; v_result jsonb; v_delta jsonb; v_plan jsonb;
  v_n bigint; v_m bigint; v_count bigint; v_ver integer; v_collected integer;
  v_id uuid; v_other uuid; v_rev uuid; v_version uuid; v_artifact uuid; v_target uuid; v_published_ssp uuid;
  v_doc uuid; v_poam_rev uuid; v_campaign uuid; v_plan_rev uuid; v_results uuid; v_set uuid; v_witness uuid; v_witness_plan uuid;
  v_package uuid; v_package_rev uuid; v_manager uuid; v_officer uuid;
  v_key text; v_text text; v_uri text; v_draft boolean; v_attack boolean; v_processes boolean; v_earlier boolean;
  v_ids uuid[]; v_workstreams uuid[] := '{}'; v_tasks uuid[] := '{}'; v_commitments uuid[] := '{}';
  v_evidence jsonb := '{}'; v_observations jsonb := '{}'; v_issues jsonb := '{}'; v_risks jsonb := '{}';
  v_risk_revisions jsonb := '{}'; v_items jsonb := '{}'; v_skipped jsonb := '[]';
begin
  select * into v_program from public.programs where tenant_id = t and code = p_code;
  if v_program.id is null then
    raise exception 'Program % is not in this workspace. The products scenario writes it first.', p_code;
  end if;
  select * into v_boundary from public.systems
    where tenant_id = t and program_id = v_program.id and product_configuration_id is not null order by code limit 1;
  if v_boundary.id is null then
    raise exception 'Program % has no variant in this workspace. The products scenario writes it first.', p_code;
  end if;
  -- A program an earlier step wrote: what this one changes in it is counted, since its records are
  -- listed under that step's dataset or, inside the program, not at all.
  v_earlier := not exists (select 1 from pg_temp.product_work_tracked k where k.destination_table = 'programs' and k.destination_id = v_program.id);
  select pg_temp.who(r.value->>1) into v_manager from jsonb_array_elements(w->'roles') with ordinality r(value, n)
    where r.value->>0 = 'program_manager' order by r.n limit 1;
  select pg_temp.who(r.value->>1) into v_officer from jsonb_array_elements(w->'roles') with ordinality r(value, n)
    where r.value->>0 = 'security_officer' order by r.n limit 1;
  v_attack := exists (select 1 from public.frameworks f join public.framework_revisions r on r.id = f.current_revision_id
    where f.code = 'nist-sp800-160v2r1-attack' and r.state = 'published');
  v_processes := exists (select 1 from public.frameworks f join public.framework_revisions r on r.id = f.current_revision_id
    where f.code = 'nist-sp800-160v1r1-processes' and r.state = 'published');

  -- Program facts the earlier steps left empty, and who answers for the systems.
  update public.programs set sponsor_party_id = coalesce(sponsor_party_id, pg_temp.who(w->>'sponsor')),
      ends_on = coalesce(ends_on, (w->>'endsOn')::date)
    where id = v_program.id and (sponsor_party_id is null or ends_on is null);
  get diagnostics v_count = row_count;
  if v_earlier then perform pg_temp.wupdated('programs', v_count); end if;
  update public.systems set system_owner_party_id = pg_temp.who(w->>'systemOwner'), lifecycle_status = w->>'lifecycle',
      authorization_status = case when is_authorization_boundary then 'in_progress' else authorization_status end
    where tenant_id = t and program_id = v_program.id and system_owner_party_id is null;
  get diagnostics v_count = row_count;
  if v_earlier then perform pg_temp.wupdated('systems', v_count); end if;
  for v_item in select value from jsonb_array_elements(w->'roles') loop
    continue when exists (select 1 from public.program_role_assignments a where a.tenant_id = t and a.program_id = v_program.id
      and a.party_id = pg_temp.who(v_item->>1) and a.role = v_item->>0);
    v_key := s || '/roles/' || (v_item->>0) || '/' || (v_item->>1);
    insert into public.program_role_assignments (id, tenant_id, program_id, party_id, role, starts_on)
      values (pg_temp.wid(t, v_key), t, v_program.id, pg_temp.who(v_item->>1), v_item->>0, v_program.starts_on);
    perform pg_temp.wtrack('program_role_assignments', pg_temp.wid(t, v_key), v_key, s);
  end loop;
  for v_item in select value from jsonb_array_elements(w->'scopes') loop
    v_key := s || '/scopes/' || (v_item->>0);
    insert into public.scopes (id, tenant_id, system_id, code, name, description, confidentiality_impact, integrity_impact, availability_impact, categorization_rationale)
      values (pg_temp.wid(t, v_key), t, v_boundary.id, v_item->>0, v_item->>1, v_item->>2,
        v_boundary.confidentiality_impact, v_boundary.integrity_impact, v_boundary.availability_impact, 'Categorized as the system is.');
    perform pg_temp.wtrack('scopes', pg_temp.wid(t, v_key), v_key, s);
  end loop;

  -- Workstreams, then the tasks: each created through the command as the account, then moved on.
  for v_item, v_n in select value, n from jsonb_array_elements(w->'workstreams') with ordinality x(value, n) loop
    v_key := s || '/workstreams/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    insert into public.workstreams (id, tenant_id, program_id, title, description, owner_party_id, status, starts_on, ends_on)
      values (v_id, t, v_program.id, v_item->>0, v_item->>1, pg_temp.who(v_item->>2), v_item->>3,
        pg_temp.wday(p, (v_item->>4)::integer), pg_temp.wday(p, (v_item->>5)::integer));
    v_workstreams := v_workstreams || v_id;
    perform pg_temp.wtrack('workstreams', v_id, v_key, s);
  end loop;
  for v_item, v_n in select value, n from jsonb_array_elements(w->'tasks') with ordinality x(value, n) loop
    perform set_config('request.jwt.claims', v_claims, true);
    v_result := public.create_task_with_assignment(t, pg_temp.wid(t, s || '/task_requests/' || v_n), jsonb_strip_nulls(jsonb_build_object(
      'programId', v_program.id, 'workstreamId', v_workstreams[(v_item->>2)::integer], 'title', v_item->>0, 'description', v_item->>6,
      'assigneePartyId', pg_temp.who(v_item->>3), 'dueOn', pg_temp.wday(p, (v_item->>4)::integer)::text, 'priority', v_item->>5)));
    perform set_config('request.jwt.claims', '', true);
    v_id := (v_result->>'taskId')::uuid;
    if v_item->>1 <> 'open' then
      update public.tasks set status = v_item->>1,
        completed_at = case when v_item->>1 = 'done' then pg_temp.wtime(p, (v_item->>7)::integer, 16) end where id = v_id;
    end if;
    v_tasks := v_tasks || v_id;
    perform pg_temp.wtrack('tasks', v_id, s || '/tasks/' || v_n, s);
    if v_result->>'assignmentId' is not null then
      perform pg_temp.wtrack('task_assignments', (v_result->>'assignmentId')::uuid, s || '/tasks/' || v_n || '/assignee', s);
    end if;
  end loop;

  -- Evidence: each artifact created through the command as the account, its version given the
  -- name of a file the scenario has no bytes for, then published, superseded and reviewed.
  for v_item in select value from jsonb_array_elements(w->'evidence') loop
    v_key := v_item->>'key';
    v_uri := 'urn:demo:evidence:' || lower(p_code) || ':' || v_key;
    v_first := v_item->'first';
    v_draft := coalesce((v_item->>'draft')::boolean, false);
    v_collected := coalesce((v_first->>'collected')::integer, (v_item->>'collected')::integer);
    perform set_config('request.jwt.claims', v_claims, true);
    v_result := public.create_evidence_with_version(t, pg_temp.wid(t, s || '/evidence_requests/' || v_key), jsonb_strip_nulls(jsonb_build_object(
      'title', v_item->>'title', 'artifactKind', v_item->>'kind', 'programId', v_program.id, 'ownerPartyId', pg_temp.who(v_item->>'owner'),
      'description', v_item->>'description', 'externalUri', v_uri,
      'collectedAt', pg_temp.wday(p, v_collected)::text || 'T14:00:00Z', 'provenance', p->>'evidenceProvenance')));
    perform set_config('request.jwt.claims', '', true);
    v_artifact := (v_result->>'artifactId')::uuid;
    v_version := (v_result->>'versionId')::uuid;
    perform pg_temp.wtrack('evidence_artifacts', v_artifact, s || '/evidence/' || v_key, s);
    perform pg_temp.wtrack('evidence_versions', v_version, s || '/evidence/' || v_key || '/1', s);
    update public.evidence_versions set
        description = coalesce(v_first->>'description', v_item->>'description'),
        sha256 = encode(extensions.digest(v_uri || '#1', 'sha256'), 'hex'),
        expires_at = case when v_first is null then pg_temp.wtime(p, (v_item->>'expires')::integer, 23) end,
        state = case when v_draft then 'draft' else 'published' end,
        published_at = case when not v_draft then pg_temp.wtime(p, v_collected, 17) end,
        published_by_party_id = case when not v_draft then pg_temp.who(v_item->>'owner') end
      where id = v_version;
    if v_first is not null then
      if v_first->'review' is not null then
        v_id := pg_temp.wid(t, s || '/evidence_reviews/' || v_key || '/1');
        insert into public.evidence_reviews (id, tenant_id, evidence_version_id, reviewer_party_id, decision, rationale, reviewed_at)
          values (v_id, t, v_version, pg_temp.who(v_first->'review'->>1), v_first->'review'->>0, v_first->'review'->>2,
            pg_temp.wtime(p, (v_first->'review'->>3)::integer, 11));
        perform pg_temp.wtrack('evidence_reviews', v_id, s || '/evidence_reviews/' || v_key || '/1', s);
      end if;
      v_version := pg_temp.wid(t, s || '/evidence_versions/' || v_key || '/2');
      insert into public.evidence_versions (id, tenant_id, artifact_id, version_number, state, published_at, published_by_party_id,
          description, external_uri, sha256, collected_at, expires_at, provenance)
        values (v_version, t, v_artifact, 2, 'published', pg_temp.wtime(p, (v_item->>'collected')::integer, 17), pg_temp.who(v_item->>'owner'),
          v_item->>'description', v_uri || ':v2', encode(extensions.digest(v_uri || '#2', 'sha256'), 'hex'),
          pg_temp.wtime(p, (v_item->>'collected')::integer, 14), pg_temp.wtime(p, (v_item->>'expires')::integer, 23), p->>'evidenceProvenance');
      perform pg_temp.wtrack('evidence_versions', v_version, s || '/evidence/' || v_key || '/2', s);
    end if;
    if v_item->'review' is not null then
      v_id := pg_temp.wid(t, s || '/evidence_reviews/' || v_key);
      insert into public.evidence_reviews (id, tenant_id, evidence_version_id, reviewer_party_id, decision, rationale, reviewed_at)
        values (v_id, t, v_version, pg_temp.who(v_item->'review'->>1), v_item->'review'->>0, v_item->'review'->>2,
          pg_temp.wtime(p, (v_item->'review'->>3)::integer, 11));
      perform pg_temp.wtrack('evidence_reviews', v_id, s || '/evidence_reviews/' || v_key, s);
    end if;
    if not v_draft then v_evidence := v_evidence || jsonb_build_object(v_key, v_version); end if;
  end loop;
  -- The customer's requirements cite it, through the command as the account.
  for v_key, v_ids in
    select r.reference, array_agg((v_evidence->>(e.value->>'key'))::uuid)
    from jsonb_array_elements(w->'evidence') e
    cross join lateral jsonb_array_elements_text(coalesce(e.value->'requirements', '[]'::jsonb)) r(reference)
    group by r.reference
  loop
    select v.id into v_other from public.engineering_requirements q
      join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
      where q.tenant_id = t and q.program_id = v_program.id and q.source_reference = v_key
      order by v.version_number desc limit 1;
    if v_other is null then
      raise exception '% has no customer requirement % for its evidence to support.', p_code, v_key;
    end if;
    perform set_config('request.jwt.claims', v_claims, true);
    perform public.link_requirement_evidence(t, v_program.id, v_other, v_ids);
    perform set_config('request.jwt.claims', '', true);
  end loop;
  update public.requirement_evidence re set claim = e.value->>'claim'
    from jsonb_array_elements(w->'evidence') e
    where re.tenant_id = t and re.evidence_version_id = (v_evidence->>(e.value->>'key'))::uuid;
  insert into pg_temp.product_work_tracked
    select 'requirement_evidence', re.id, 'requirement_evidence/' || re.id, s from public.requirement_evidence re
    where re.tenant_id = t and re.evidence_version_id in (select value::uuid from jsonb_each_text(v_evidence));

  -- What was observed, and the evidence it was observed in.
  for v_item in select value from jsonb_array_elements(w->'observations') loop
    v_key := s || '/observations/' || (v_item->>0);
    v_id := pg_temp.wid(t, v_key);
    insert into public.observations (id, tenant_id, program_id, title, description, method, observed_at, observer_party_id)
      values (v_id, t, v_program.id, v_item->>1, v_item->>2, v_item->>3, pg_temp.wtime(p, (v_item->>4)::integer, 13), pg_temp.who(v_item->>5));
    v_observations := v_observations || jsonb_build_object(v_item->>0, v_id);
    perform pg_temp.wtrack('observations', v_id, v_key, s);
    for v_text in select jsonb_array_elements_text(v_item->6) loop
      v_other := pg_temp.wid(t, v_key || '/evidence/' || v_text);
      insert into public.observation_evidence (id, tenant_id, observation_id, evidence_version_id)
        values (v_other, t, v_id, (v_evidence->>v_text)::uuid);
      perform pg_temp.wtrack('observation_evidence', v_other, v_key || '/evidence/' || v_text, s);
    end loop;
  end loop;

  -- Operational issues, each with the observations folded into it and the evidence it cites.
  for v_item in select value from jsonb_array_elements(w->'issues') loop
    v_key := s || '/issues/' || (v_item->>'key');
    v_id := pg_temp.wid(t, v_key);
    insert into public.operational_issues (id, tenant_id, program_id, title, description, owner_party_id, status, severity, opened_at, closed_at, closure_rationale)
      values (v_id, t, v_program.id, v_item->>'title', v_item->>'description', pg_temp.who(v_item->>'owner'), v_item->>'status', v_item->>'severity',
        pg_temp.wtime(p, (v_item->>'opened')::integer, 9), pg_temp.wtime(p, (v_item->>'closed')::integer, 16), v_item->>'closure');
    v_issues := v_issues || jsonb_build_object(v_item->>'key', v_id);
    perform pg_temp.wtrack('operational_issues', v_id, v_key, s);
    for v_text in select jsonb_array_elements_text(v_item->'observations') loop
      v_other := pg_temp.wid(t, v_key || '/observations/' || v_text);
      insert into public.issue_observations (id, tenant_id, issue_id, observation_id)
        values (v_other, t, v_id, (v_observations->>v_text)::uuid);
      perform pg_temp.wtrack('issue_observations', v_other, v_key || '/observations/' || v_text, s);
    end loop;
    for v_text in select jsonb_array_elements_text(v_item->'evidence') loop
      v_other := pg_temp.wid(t, v_key || '/evidence/' || v_text);
      insert into public.issue_evidence (id, tenant_id, issue_id, evidence_version_id, claim)
        values (v_other, t, v_id, (v_evidence->>v_text)::uuid, 'Cited when the issue was recorded.');
      perform pg_temp.wtrack('issue_evidence', v_other, v_key || '/evidence/' || v_text, s);
    end loop;
  end loop;

  -- Risks: each with one published assessment, the response to it, the observations it rests on
  -- and the ATT&CK techniques it names.
  for v_item in select value from jsonb_array_elements(w->'risks') loop
    v_key := s || '/risks/' || (v_item->>'key');
    v_id := pg_temp.wid(t, v_key);
    v_rev := pg_temp.wid(t, v_key || '/1');
    v_entry := v_item->'response';
    insert into public.risks (id, tenant_id, program_id, title, owner_party_id, status)
      values (v_id, t, v_program.id, v_item->>'title', pg_temp.who(v_item->>'owner'), v_item->>'status');
    insert into public.risk_revisions (id, tenant_id, risk_id, version_number, state, description, threat, vulnerability,
        likelihood, impact, severity, assessment_rationale, assessed_at, assessor_party_id)
      values (v_rev, t, v_id, 1, 'draft', v_item->>'description', v_item->>'threat', v_item->>'vulnerability',
        v_item->>'likelihood', v_item->>'impact', v_item->>'severity', v_item->>'rationale',
        pg_temp.wtime(p, (v_item->>'assessed')::integer, 15), pg_temp.who(v_item->>'assessor'));
    v_risks := v_risks || jsonb_build_object(v_item->>'key', v_id);
    v_risk_revisions := v_risk_revisions || jsonb_build_object(v_item->>'key', v_rev);
    perform pg_temp.wtrack('risks', v_id, v_key, s);
    perform pg_temp.wtrack('risk_revisions', v_rev, v_key || '/1', s);
    v_other := pg_temp.wid(t, v_key || '/response');
    insert into public.risk_responses (id, tenant_id, risk_revision_id, response_type, description, owner_party_id, approved_by_party_id, approved_at, due_at)
      values (v_other, t, v_rev, v_entry->>0, v_entry->>1, pg_temp.who(v_entry->>2), pg_temp.who(v_entry->>4),
        pg_temp.wtime(p, (v_entry->>5)::integer, 15), pg_temp.wtime(p, (v_entry->>3)::integer, 17));
    perform pg_temp.wtrack('risk_responses', v_other, v_key || '/response', s);
    for v_text in select jsonb_array_elements_text(v_item->'observations') loop
      v_other := pg_temp.wid(t, v_key || '/observations/' || v_text);
      insert into public.risk_observations (id, tenant_id, risk_revision_id, observation_id)
        values (v_other, t, v_rev, (v_observations->>v_text)::uuid);
      perform pg_temp.wtrack('risk_observations', v_other, v_key || '/observations/' || v_text, s);
    end loop;
    update public.risk_revisions set state = 'published', published_at = pg_temp.wtime(p, (v_item->>'assessed')::integer, 17),
      published_by_party_id = pg_temp.who(v_item->>'assessor') where id = v_rev;
    for v_text in select jsonb_array_elements_text(v_item->'techniques') loop
      v_other := pg_temp.work_framework_item('nist-sp800-160v2r1-attack', v_text);
      if v_other is null then
        if v_attack then raise exception 'Appendix F has no ATT&CK technique %.', v_text; end if;
        continue;
      end if;
      -- The risk's own link, made as the account a reader would make it.
      perform set_config('request.jwt.claims', v_claims, true);
      insert into public.risk_attack_techniques (id, tenant_id, risk_id, framework_item_id)
        values (pg_temp.wid(t, v_key || '/techniques/' || v_text), t, v_id, v_other);
      perform set_config('request.jwt.claims', '', true);
      perform pg_temp.wtrack('risk_attack_techniques', pg_temp.wid(t, v_key || '/techniques/' || v_text), v_key || '/techniques/' || v_text, s);
    end loop;
  end loop;
  if not v_attack then
    v_skipped := v_skipped || jsonb_build_object('techniques', p_code, 'reason', 'the ATT&CK reference data is not loaded');
  end if;

  -- The POA&M: its remediation items, each one's commitment with its milestones, what it answers,
  -- and the plan's first version holding the commitments that are published.
  v_doc := pg_temp.wid(t, s || '/poam_documents');
  insert into public.poam_documents (id, tenant_id, program_id, title) values (v_doc, t, v_program.id, w->'poam'->>'title');
  perform pg_temp.wtrack('poam_documents', v_doc, s || '/poam_documents', s);
  for v_item in select value from jsonb_array_elements(w->'poam'->'items') loop
    v_key := s || '/poam_items/' || (v_item->>'key');
    v_id := pg_temp.wid(t, v_key);
    v_rev := pg_temp.wid(t, v_key || '/1');
    insert into public.poam_items (id, tenant_id, poam_document_id, title, owner_party_id, status)
      values (v_id, t, v_doc, v_item->>'title', pg_temp.who(v_item->>'owner'), v_item->>'status');
    insert into public.poam_item_revisions (id, tenant_id, version_number, state, poam_document_id, poam_item_id, description,
        remediation_plan, resources, planned_completion_date, actual_completion_date, completion_rationale)
      values (v_rev, t, 1, 'draft', v_doc, v_id, v_item->>'description', v_item->>'plan', v_item->>'resources',
        pg_temp.wday(p, (v_item->>'planned')::integer), pg_temp.wday(p, (v_item->>'completed')::integer), v_item->>'rationale');
    v_items := v_items || jsonb_build_object(v_item->>'key', v_id);
    perform pg_temp.wtrack('poam_items', v_id, v_key, s);
    perform pg_temp.wtrack('poam_item_revisions', v_rev, v_key || '/1', s);
    for v_entry, v_n in select value, n from jsonb_array_elements(v_item->'milestones') with ordinality x(value, n) loop
      v_other := pg_temp.wid(t, v_key || '/milestones/' || v_n);
      insert into public.poam_milestones (id, tenant_id, poam_item_revision_id, title, sequence_number, owner_party_id, planned_date, completed_date, status)
        values (v_other, t, v_rev, v_entry->>0, v_n, pg_temp.who(v_item->>'owner'),
          pg_temp.wday(p, (v_entry->>1)::integer), pg_temp.wday(p, (v_entry->>2)::integer), v_entry->>3);
      perform pg_temp.wtrack('poam_milestones', v_other, v_key || '/milestones/' || v_n, s);
    end loop;
    for v_text in select jsonb_array_elements_text(v_item->'issues') loop
      v_other := pg_temp.wid(t, v_key || '/issues/' || v_text);
      insert into public.issue_poams (id, tenant_id, issue_id, poam_item_id) values (v_other, t, (v_issues->>v_text)::uuid, v_id);
      perform pg_temp.wtrack('issue_poams', v_other, v_key || '/issues/' || v_text, s);
    end loop;
    -- The commitment rests on what the issues it answers observed.
    for v_text in
      select distinct o.value from jsonb_array_elements(w->'issues') i
      cross join lateral jsonb_array_elements_text(i.value->'observations') o(value)
      where v_item->'issues' ? (i.value->>'key') order by o.value
    loop
      v_other := pg_temp.wid(t, v_key || '/observations/' || v_text);
      insert into public.poam_item_observations (id, tenant_id, poam_item_revision_id, observation_id)
        values (v_other, t, v_rev, (v_observations->>v_text)::uuid);
      perform pg_temp.wtrack('poam_item_observations', v_other, v_key || '/observations/' || v_text, s);
    end loop;
    for v_text in select jsonb_array_elements_text(v_item->'risks') loop
      v_other := pg_temp.wid(t, v_key || '/risks/' || v_text);
      insert into public.poam_item_risks (id, tenant_id, poam_item_revision_id, risk_revision_id)
        values (v_other, t, v_rev, (v_risk_revisions->>v_text)::uuid);
      perform pg_temp.wtrack('poam_item_risks', v_other, v_key || '/risks/' || v_text, s);
    end loop;
    if coalesce((v_item->>'published')::boolean, true) then
      update public.poam_item_revisions set state = 'published', published_at = pg_temp.wtime(p, (w->'poam'->>'published')::integer, 14),
        published_by_party_id = pg_temp.who(v_item->>'owner') where id = v_rev;
      v_commitments := v_commitments || v_rev;
    end if;
  end loop;
  v_poam_rev := pg_temp.wid(t, s || '/poam_revisions/1');
  insert into public.poam_revisions (id, tenant_id, version_number, state, poam_document_id, description)
    values (v_poam_rev, t, 1, 'draft', v_doc, w->'poam'->>'description');
  perform pg_temp.wtrack('poam_revisions', v_poam_rev, s || '/poam_revisions/1', s);
  for v_rev in select unnest(v_commitments) loop
    v_other := pg_temp.wid(t, s || '/poam_revision_items/' || v_rev);
    insert into public.poam_revision_items (id, tenant_id, poam_document_id, poam_revision_id, poam_item_revision_id)
      values (v_other, t, v_doc, v_poam_rev, v_rev);
    perform pg_temp.wtrack('poam_revision_items', v_other, s || '/poam_revision_items/' || v_rev, s);
  end loop;
  update public.poam_revisions set state = 'published', published_at = pg_temp.wtime(p, (w->'poam'->>'published')::integer, 15),
    published_by_party_id = v_manager where id = v_poam_rev;

  -- Lifecycle gates: the security outcomes drawn into each through the command as the account,
  -- the criteria the program wrote, and the evidence presented.
  for v_item, v_n in select value, n from jsonb_array_elements(w->'gates') with ordinality x(value, n) loop
    v_key := s || '/lifecycle_gates/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    insert into public.lifecycle_gates (id, tenant_id, program_id, title, description, sequence_number, status, due_on, decided_at)
      values (v_id, t, v_program.id, v_item->>'title', v_item->>'description', v_n, v_item->>'status', pg_temp.wday(p, (v_item->>'due')::integer),
        case when v_item->>'status' in ('completed', 'passed', 'failed', 'waived') then pg_temp.wtime(p, (v_item->>'due')::integer, 17) end);
    perform pg_temp.wtrack('lifecycle_gates', v_id, v_key, s);
    if jsonb_array_length(v_item->'outcomes') > 0 and v_processes then
      select array_agg(pg_temp.work_framework_item('nist-sp800-160v1r1-processes', c)) into v_ids from jsonb_array_elements_text(v_item->'outcomes') c;
      if array_position(v_ids, null) is not null then
        raise exception 'Gate "%" names a security outcome the life cycle processes do not hold.', v_item->>'title';
      end if;
      perform set_config('request.jwt.claims', v_claims, true);
      perform public.add_gate_security_outcomes(t, v_id, pg_temp.wid(t, s || '/gate_outcome_requests/' || v_n), v_ids);
      perform set_config('request.jwt.claims', '', true);
    end if;
    v_other := null;
    for v_text, v_m in select value, n from jsonb_array_elements_text(v_item->'criteria') with ordinality x(value, n) loop
      insert into public.gate_criteria (id, tenant_id, gate_id, title, required, sequence_number)
        values (pg_temp.wid(t, v_key || '/criteria/' || v_m), t, v_id, v_text, true,
          (select coalesce(max(sequence_number), 0) + 1 from public.gate_criteria where tenant_id = t and gate_id = v_id));
      v_other := coalesce(v_other, pg_temp.wid(t, v_key || '/criteria/' || v_m));
    end loop;
    insert into pg_temp.product_work_tracked
      select 'gate_criteria', c.id, 'gate_criteria/' || c.id, s from public.gate_criteria c where c.tenant_id = t and c.gate_id = v_id;
    -- Evidence stands behind the first criterion the program wrote, else the gate's first.
    if v_other is null then
      select c.id into v_other from public.gate_criteria c where c.tenant_id = t and c.gate_id = v_id order by c.sequence_number, c.id limit 1;
    end if;
    for v_text in select jsonb_array_elements_text(v_item->'evidence') loop
      continue when v_other is null;
      v_rev := pg_temp.wid(t, v_key || '/evidence/' || v_text);
      insert into public.gate_evidence (id, tenant_id, gate_criterion_id, evidence_version_id, claim)
        values (v_rev, t, v_other, (v_evidence->>v_text)::uuid, 'Presented at the gate.');
      perform pg_temp.wtrack('gate_evidence', v_rev, v_key || '/evidence/' || v_text, s);
    end loop;
  end loop;
  if not v_processes then
    v_skipped := v_skipped || jsonb_build_object('gateOutcomes', p_code, 'reason', 'the life cycle processes are not loaded');
  end if;

  -- What each task is about.
  for v_item, v_n in select value, n from jsonb_array_elements(w->'taskLinks') with ordinality x(value, n) loop
    v_key := s || '/task_links/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    v_other := v_tasks[(v_item->>0)::integer];
    v_text := v_item->>2;
    case v_item->>1
      when 'issue' then
        insert into public.task_issues (id, tenant_id, task_id, issue_id) values (v_id, t, v_other, (v_issues->>v_text)::uuid);
        perform pg_temp.wtrack('task_issues', v_id, v_key, s);
      when 'risk' then
        insert into public.task_risks (id, tenant_id, task_id, risk_id) values (v_id, t, v_other, (v_risks->>v_text)::uuid);
        perform pg_temp.wtrack('task_risks', v_id, v_key, s);
      when 'poam' then
        insert into public.task_poams (id, tenant_id, task_id, poam_item_id) values (v_id, t, v_other, (v_items->>v_text)::uuid);
        perform pg_temp.wtrack('task_poams', v_id, v_key, s);
      when 'evidence' then
        insert into public.task_evidence (id, tenant_id, task_id, evidence_version_id) values (v_id, t, v_other, (v_evidence->>v_text)::uuid);
        perform pg_temp.wtrack('task_evidence', v_id, v_key, s);
      when 'requirement' then
        insert into public.task_requirements (id, tenant_id, task_id, requirement_revision_id)
          select v_id, t, v_other, v.id from public.engineering_requirements q
          join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
          where q.tenant_id = t and q.program_id = v_program.id and q.source_reference = v_text
          order by v.version_number desc limit 1;
        perform pg_temp.wtrack('task_requirements', v_id, v_key, s);
    end case;
  end loop;

  -- The SSP. How each control stands in the variant decides what its narrative says.
  v_delta := pg_temp.read_work_delta(p, v_boundary.id);
  select * into v_ssp from public.ssp_revisions where tenant_id = t and system_id = v_boundary.id order by version_number desc limit 1;
  if v_ssp.id is null then
    raise exception '% has no SSP. The program wizard writes one with the system.', v_boundary.code;
  end if;
  if v_ssp.state = 'published' then
    -- A published SSP cannot change, so its narratives go in the next revision: a working draft
    -- that carries forward what the published one holds, the library origin of each contribution too.
    v_published_ssp := v_ssp.id;
    v_target := pg_temp.wid(t, s || '/ssp_revisions/' || (v_ssp.version_number + 1));
    insert into public.ssp_revisions (id, tenant_id, system_id, profile_resolution_id, version_number, state, description)
      values (v_target, t, v_boundary.id, v_ssp.profile_resolution_id, v_ssp.version_number + 1, 'draft',
        coalesce(w->'ssp'->>'working', 'Working draft of the variant''s SSP.'));
    insert into public.implemented_requirements (id, tenant_id, ssp_revision_id, selected_control_id, implementation_status, description, responsible_party_id, not_applicable_rationale)
      select pg_temp.wid(t, s || '/ssp/ir/' || i.selected_control_id), t, v_target, i.selected_control_id, i.implementation_status,
        i.description, i.responsible_party_id, i.not_applicable_rationale
      from public.implemented_requirements i where i.tenant_id = t and i.ssp_revision_id = v_ssp.id;
    insert into public.component_contributions (id, tenant_id, ssp_revision_id, implemented_requirement_id, system_component_id,
        description, implementation_status, responsible_party_id, library_implementation_id)
      select pg_temp.wid(t, s || '/ssp/contribution/' || c.id), t, v_target, pg_temp.wid(t, s || '/ssp/ir/' || i.selected_control_id),
        c.system_component_id, c.description, c.implementation_status, c.responsible_party_id, c.library_implementation_id
      from public.component_contributions c
      join public.implemented_requirements i on i.id = c.implemented_requirement_id
      where c.tenant_id = t and c.ssp_revision_id = v_ssp.id and c.implementation_statement_id is null;
    perform pg_temp.wtrack('ssp_revisions', v_target, s || '/ssp_revisions/' || (v_ssp.version_number + 1), s);
    insert into pg_temp.product_work_tracked
      select 'implemented_requirements', i.id, 'implemented_requirements/' || i.id, s from public.implemented_requirements i
        where i.tenant_id = t and i.ssp_revision_id = v_target
      union all select 'component_contributions', c.id, 'component_contributions/' || c.id, s from public.component_contributions c
        where c.tenant_id = t and c.ssp_revision_id = v_target;
  else
    v_target := v_ssp.id;
  end if;
  update public.implemented_requirements i set implementation_status = n.status, description = n.narrative, responsible_party_id = n.owner
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
      case d.delta
        when 'inherited' then concat_ws(' ',
          format('Inherited from %s version %s, %s.', v_delta->'product'->>'name', v_delta->'product'->>'version', v_delta->'product'->>'configuration'),
          x.claims, 'The product''s assessment stands for this control in this variant.')
        when 'shared' then concat_ws(' ',
          format('Shared with %s version %s.', v_delta->'product'->>'name', v_delta->'product'->>'version'),
          x.claims, coalesce(x.responsibility, 'The program answers the part the product leaves to it.'))
        when 'changed_here' then concat_ws(' ',
          format('Changed in this variant: %s.', coalesce(d.changed, 'an element behind this control')),
          x.claims, 'The program re-verifies this control under its delta assessment.')
        else p->'familyProcedures'->>d.family
      end as narrative,
      pg_temp.who(coalesce(w->'ssp'->'owners'->>d.family, w->'ssp'->'owners'->>'default')) as owner
    from public.implemented_requirements i
    join public.selected_controls sc on sc.id = i.selected_control_id
    join pg_temp.product_work_delta d on d.control_id = sc.control_id
    cross join lateral (select pg_temp.bucket('ssp/' || p_code || '/' || d.code) as b,
      pg_temp.bucket('ssp-share/' || p_code || '/' || d.code) as share) b
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
    where i.tenant_id = t and i.ssp_revision_id = v_target
      and (d.delta <> 'program_only'
        or (b.share < (p->'sspNarratives'->>'programOnlyShare')::integer and p->'familyProcedures' ? d.family))
  ) n
  where i.id = n.id;
  get diagnostics v_count = row_count;
  if v_published_ssp is null and v_earlier then perform pg_temp.wupdated('implemented_requirements', v_count); end if;
  -- A control the assessor is named as finding short is not claimed as implemented, and neither is
  -- one that stands in an area of the program's trouble.
  update public.implemented_requirements i
    set implementation_status = case nm.value->>'determination' when 'partially_satisfied' then 'partial' else 'planned' end
    from jsonb_array_elements(w->'assessment'->'results'->'named') nm, public.selected_controls sc, pg_temp.product_work_delta d
    where i.tenant_id = t and i.ssp_revision_id = v_target and sc.id = i.selected_control_id and d.control_id = sc.control_id
      and d.code = nm.value->>'control' and nm.value->>'determination' <> 'satisfied' and i.implementation_status = 'implemented';
  update public.implemented_requirements i set implementation_status = 'partial'
    from public.selected_controls sc, pg_temp.product_work_delta d
    where i.tenant_id = t and i.ssp_revision_id = v_target and sc.id = i.selected_control_id and d.control_id = sc.control_id
      and i.implementation_status = 'implemented'
      and pg_temp.work_trouble_area(w->'assessment'->'results'->'areas', d.delta, d.family, d.changed_codes) is not null
      and not exists (select 1 from jsonb_array_elements(w->'assessment'->'results'->'named') nm where nm.value->>'control' = d.code);
  -- A contribution from an element the program changed says so, and is no longer as the library has it.
  update public.component_contributions cc set implementation_status = 'partial',
      description = cc.description || ' ' || (p->'sspNarratives'->>'changedContribution') || ' ('
        || array_to_string(e.product_change_kinds, ', ') || '): ' || e.product_change_rationale
    from public.system_components c join public.systems e on e.id = c.system_element_id
    where cc.tenant_id = t and cc.ssp_revision_id = v_target and c.id = cc.system_component_id and e.product_change_kinds is not null;
  get diagnostics v_count = row_count;
  if v_published_ssp is null and v_earlier then perform pg_temp.wupdated('component_contributions', v_count); end if;
  -- Each lettered part of a narrated control says what answers it.
  insert into public.implementation_statements (id, tenant_id, ssp_revision_id, implemented_requirement_id, control_part_id, description)
  select pg_temp.wid(t, s || '/ssp/statement/' || cp.id), t, v_target, i.id, cp.id,
    case when x.components is null then format('Answered under the program''s %s.', p->'familyDocuments'->>d.family)
      when d.delta = 'changed_here' then format('Answered by %s, re-verified for this variant.', x.components)
      else format('Answered by %s as delivered with the product.', x.components) end
  from public.implemented_requirements i
  join public.selected_controls sc on sc.id = i.selected_control_id
  join pg_temp.product_work_delta d on d.control_id = sc.control_id
  join public.control_parts root on root.control_id = sc.control_id and root.parent_part_id is null and root.name = 'statement'
  join public.control_parts cp on cp.parent_part_id = root.id and cp.name = 'item' and coalesce(cp.prose, '') ~ '[^[:space:]]'
  left join lateral (
    select string_agg(distinct c.name, ', ') as components
    from public.component_contributions cc join public.system_components c on c.id = cc.system_component_id
    where cc.tenant_id = t and cc.implemented_requirement_id = i.id
  ) x on true
  where i.tenant_id = t and i.ssp_revision_id = v_target and i.description is not null
    and (x.components is not null or p->'familyDocuments' ? d.family);
  insert into pg_temp.product_work_tracked
    select 'implementation_statements', st.id, 'implementation_statements/' || st.id, s from public.implementation_statements st
    where st.tenant_id = t and st.ssp_revision_id = v_target;
  if v_published_ssp is null then
    if not w->'ssp' ? 'publish' then
      raise exception '%''s SSP is a draft and the step is not told when it was published.', p_code;
    end if;
    update public.ssp_revisions set state = 'published', published_at = pg_temp.wtime(p, (w->'ssp'->>'publish')::integer, 15) where id = v_ssp.id;
    if v_earlier then perform pg_temp.wupdated('ssp_revisions', 1); end if;
    v_published_ssp := v_ssp.id;
  end if;

  -- Configuration baselines of the variant, each pinning every component it holds.
  select coalesce(max(version_number), 0) into v_ver from public.configuration_baselines where tenant_id = t and system_id = v_boundary.id;
  for v_item, v_n in select value, n from jsonb_array_elements(w->'configurationBaselines') with ordinality x(value, n) loop
    v_key := s || '/configuration_baselines/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    insert into public.configuration_baselines (id, tenant_id, system_id, version_number, state, name, description)
      values (v_id, t, v_boundary.id, v_ver + v_n, 'draft', v_item->>'name', v_item->>'description');
    insert into public.component_pins (id, tenant_id, system_id, configuration_baseline_id, system_component_id, defined_component_id, version, configuration_description, content_sha256)
    select pg_temp.wid(t, v_key || '/pins/' || c.code), t, v_boundary.id, v_id, c.id, c.defined_component_id, x.version, v_item->>'note',
      encode(extensions.digest(p_code || '/' || c.code || '/' || x.version, 'sha256'), 'hex')
    from public.system_components c
    cross join lateral (select coalesce(v_item->'versions'->>regexp_replace(c.code, '^' || (w->>'prefix') || '-', ''), '1.0') as version) x
    where c.tenant_id = t and c.system_id = v_boundary.id;
    if v_item->>'published' is not null then
      update public.configuration_baselines set state = 'published', published_at = pg_temp.wtime(p, (v_item->>'published')::integer, 16) where id = v_id;
    end if;
    perform pg_temp.wtrack('configuration_baselines', v_id, v_key, s);
    insert into pg_temp.product_work_tracked
      select 'component_pins', c.id, 'component_pins/' || c.id, s from public.component_pins c where c.tenant_id = t and c.configuration_baseline_id = v_id;
  end loop;

  -- A variant that takes a newer version of its product does it through the command as the
  -- account, once its SSP is published and before its delta assessment is planned, so the plan's
  -- objectives are read against the version it now stands on.
  if w ? 'takesVersion' then
    select r.id into v_other from public.product_revisions r
      join public.product_revisions held on held.tenant_id = r.tenant_id and held.product_id = r.product_id
      where r.tenant_id = t and held.id = v_boundary.product_revision_id
        and r.version_number = (w->>'takesVersion')::integer and r.state = 'published';
    if v_other is null then
      raise exception '% takes version % of its product, which is not published in this workspace.', p_code, w->>'takesVersion';
    end if;
    select * into v_boundary from public.systems where id = v_boundary.id;
    perform set_config('request.jwt.claims', v_claims, true);
    v_result := public.take_product_version(t, v_boundary.id, v_boundary.revision, v_other, pg_temp.wid(t, s || '/take_product_version'));
    perform set_config('request.jwt.claims', '', true);
    if (v_result->>'changed')::boolean then
      -- The elements the newer version adds are this step's; the ones it re-points are counted.
      insert into pg_temp.product_work_tracked
        select 'systems', (e.value->>'systemId')::uuid, s || '/take_product_version/' || (e.value->>'code'), s
        from jsonb_array_elements(v_result->'elements') e;
      update public.systems set system_owner_party_id = pg_temp.who(w->>'systemOwner'), lifecycle_status = w->>'lifecycle'
        where tenant_id = t and id in (select (e.value->>'systemId')::uuid from jsonb_array_elements(v_result->'elements') e);
      perform pg_temp.wupdated('systems', (v_result->>'kept')::bigint + (v_result->>'released')::bigint + 1);
      -- The command's own line in the program's activity.
      select a.id into v_id from public.activity_events a
        where a.tenant_id = t and a.program_id = v_program.id and a.description like v_boundary.code || ': took version %'
        order by a.occurred_at desc, a.id limit 1;
      if v_id is not null then
        perform pg_temp.wtrack('activity_events', v_id, s || '/take_product_version/activity', s);
      end if;
      -- What the version brought with a library component behind it is the command's to write.
      insert into pg_temp.product_work_tracked
        select 'library_assignments', la.id, 'library_assignments/' || la.id, s from public.library_assignments la
        where la.tenant_id = t and la.request_id = pg_temp.wid(t, s || '/take_product_version');
    end if;
    select * into v_boundary from public.systems where id = v_boundary.id;
    v_delta := pg_temp.read_work_delta(p, v_boundary.id);
  end if;

  -- The delta assessment: planned through the command as the account (the plan an earlier step
  -- made answers with the same request), given its subject and activities, then published, so an
  -- assessor's results can be.
  perform set_config('request.jwt.claims', v_claims, true);
  v_plan := public.plan_delta_assessment(t, v_boundary.id, pg_temp.sid(t, 'assessment_campaigns/delta/' || p_code), w->'assessment'->>'title');
  perform set_config('request.jwt.claims', '', true);
  v_campaign := (v_plan->>'campaignId')::uuid;
  v_plan_rev := (v_plan->>'planRevisionId')::uuid;
  if (v_plan->>'created')::boolean then
    perform pg_temp.wtrack('assessment_campaigns', v_campaign, s || '/assessment_campaigns/delta', s);
    perform pg_temp.wtrack('assessment_plan_revisions', v_plan_rev, s || '/assessment_plan_revisions/delta', s);
    insert into pg_temp.product_work_tracked
      select 'assessment_objectives', o.id, 'assessment_objectives/' || o.id, s from public.assessment_objectives o
      where o.tenant_id = t and o.plan_revision_id = v_plan_rev;
  else
    perform pg_temp.wupdated('assessment_campaigns', 1);
  end if;
  v_entry := w->'assessment';
  update public.assessment_campaigns set owner_party_id = coalesce(owner_party_id, pg_temp.who(v_entry->>'owner')), status = v_entry->>'status',
    starts_at = coalesce(starts_at, pg_temp.wtime(p, (v_entry->>'starts')::integer, 9)),
    ends_at = coalesce(ends_at, pg_temp.wtime(p, (v_entry->>'ends')::integer, 17)) where id = v_campaign;
  select * into v_plan_row from public.assessment_plan_revisions where id = v_plan_rev;
  if v_plan_row.state = 'draft' then
    v_id := pg_temp.wid(t, s || '/assessment_subjects/delta');
    insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
      values (v_id, t, v_plan_rev, v_entry->>'subject', v_boundary.id);
    perform pg_temp.wtrack('assessment_subjects', v_id, s || '/assessment_subjects/delta', s);
    for v_item, v_n in select value, n from jsonb_array_elements(v_entry->'activities') with ordinality x(value, n) loop
      v_key := s || '/assessment_activities/' || v_n;
      v_id := pg_temp.wid(t, v_key);
      insert into public.assessment_activities (id, tenant_id, plan_revision_id, title, description, method)
        values (v_id, t, v_plan_rev, v_item->>0, v_item->>2, v_item->>1);
      perform pg_temp.wtrack('assessment_activities', v_id, v_key, s);
      for v_first, v_m in select value, n from jsonb_array_elements(v_item->3) with ordinality y(value, n) loop
        v_other := pg_temp.wid(t, v_key || '/steps/' || v_m);
        insert into public.activity_steps (id, tenant_id, plan_revision_id, activity_id, sequence_number, instruction, expected_result)
          values (v_other, t, v_plan_rev, v_id, v_m, v_first->>0, v_first->>1);
        perform pg_temp.wtrack('activity_steps', v_other, v_key || '/steps/' || v_m, s);
      end loop;
    end loop;
    update public.assessment_plan_revisions set state = 'published', published_at = pg_temp.wtime(p, (v_entry->>'planPublished')::integer, 16),
      published_by_party_id = pg_temp.who(v_entry->>'owner') where id = v_plan_rev;
    if not (v_plan->>'created')::boolean then perform pg_temp.wupdated('assessment_plan_revisions', 1); end if;
  else
    v_skipped := v_skipped || jsonb_build_object('plan', p_code, 'reason', 'the delta assessment plan was already published; its subject and activities are left as they are');
  end if;
  for v_item, v_n in select value, n from jsonb_array_elements(v_entry->'events') with ordinality x(value, n) loop
    v_key := s || '/assessment_events/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    insert into public.assessment_events (id, tenant_id, campaign_id, plan_revision_id, title, description, status, starts_at, ends_at, location)
      values (v_id, t, v_campaign, v_plan_rev, v_item->>0, v_item->>5, v_item->>1,
        pg_temp.wtime(p, (v_item->>2)::integer, 9), pg_temp.wtime(p, (v_item->>3)::integer, 17), v_item->>4);
    perform pg_temp.wtrack('assessment_events', v_id, v_key, s);
  end loop;
  -- The assessor's results, as the program's story has them: the controls the scenario names, with
  -- what it says of each; then, of the plan's other objectives, the share judged so far (a stable
  -- hash of each control's code) among those the variant's SSP narrates, since an assessor examines
  -- what the SSP says. A control in an area of the program's trouble falls short in that area's
  -- words, and every other is met.
  v_entry := w->'assessment'->'results';
  if exists (select 1 from jsonb_array_elements(v_entry->'named') nm where not exists (
      select 1 from public.assessment_objectives o
      join public.control_parts cp on cp.id = o.target_control_part_id
      join pg_temp.product_work_delta d on d.control_id = cp.control_id
      where o.tenant_id = t and o.plan_revision_id = v_plan_rev and d.code = nm.value->>'control')) then
    raise exception '%''s results name a control its delta assessment does not judge.', p_code;
  end if;
  v_results := pg_temp.wid(t, s || '/assessment_results_revisions/delta/1');
  v_set := pg_temp.wid(t, s || '/result_sets/delta/1');
  insert into public.assessment_results_revisions (id, tenant_id, version_number, state, assessment_plan_revision_id, title, description)
    values (v_results, t, 1, 'draft', v_plan_rev, v_entry->>'title', v_entry->>'description');
  insert into public.result_sets (id, tenant_id, assessment_results_revision_id, title, starts_at, ends_at)
    values (v_set, t, v_results, v_entry->>'resultSet', pg_temp.wtime(p, (v_entry->>'starts')::integer, 9), pg_temp.wtime(p, (v_entry->>'ends')::integer, 17));
  perform pg_temp.wtrack('assessment_results_revisions', v_results, s || '/assessment_results_revisions/delta/1', s);
  perform pg_temp.wtrack('result_sets', v_set, s || '/result_sets/delta/1', s);
  insert into public.assessment_findings (id, tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, description, determination, assessor_party_id, determined_at)
  select pg_temp.wid(t, s || '/assessment_findings/delta/' || d.code), t, v_results, v_set, o.target_control_part_id, o.title,
    coalesce(nm.value->>'narrative', ar.area->>'narrative', p->'findingNarratives'->'satisfied'->>d.delta),
    coalesce(nm.value->>'determination', ar.area->>'determination', 'satisfied'), pg_temp.who(v_entry->>'assessor'),
    pg_temp.wtime(p, (v_entry->>'starts')::integer + b.b % ((v_entry->>'ends')::integer - (v_entry->>'starts')::integer + 1), 10 + b.b % 7)
  from public.assessment_objectives o
  join public.control_parts cp on cp.id = o.target_control_part_id
  join pg_temp.product_work_delta d on d.control_id = cp.control_id
  left join jsonb_array_elements(v_entry->'named') nm on nm.value->>'control' = d.code
  cross join lateral (select pg_temp.bucket('delta-judged/' || p_code || '/' || d.code) as judged,
    pg_temp.bucket('delta-finding/' || p_code || '/' || d.code) as b) b
  cross join lateral (select case when nm.value is null
    then pg_temp.work_trouble_area(v_entry->'areas', d.delta, d.family, d.changed_codes) end as area) ar
  where o.tenant_id = t and o.plan_revision_id = v_plan_rev
    and (nm.value is not null or (b.judged < (v_entry->>'judged')::integer and exists (
      select 1 from public.implemented_requirements i join public.selected_controls sc on sc.id = i.selected_control_id
      where i.tenant_id = t and i.ssp_revision_id = v_target and sc.control_id = d.control_id and i.description is not null)));
  insert into pg_temp.product_work_tracked
    select 'assessment_findings', f.id, 'assessment_findings/' || f.id, s from public.assessment_findings f
    where f.tenant_id = t and f.assessment_results_revision_id = v_results;
  -- A named result, and one in an area of the program's trouble, cites what it rests on.
  for v_item, v_key in
    select nm.value, s || '/assessment_findings/delta/' || (nm.value->>'control')
    from jsonb_array_elements(v_entry->'named') nm
    union all
    select ar.area, s || '/assessment_findings/delta/' || d.code
    from public.assessment_findings f
    join public.control_parts cp on cp.id = f.target_control_part_id
    join pg_temp.product_work_delta d on d.control_id = cp.control_id
    cross join lateral (select pg_temp.work_trouble_area(v_entry->'areas', d.delta, d.family, d.changed_codes) as area) ar
    where f.tenant_id = t and f.assessment_results_revision_id = v_results and ar.area is not null
      and not exists (select 1 from jsonb_array_elements(v_entry->'named') nm where nm.value->>'control' = d.code)
  loop
    v_id := pg_temp.wid(t, v_key);
    if v_item->>'risk' is not null then
      insert into public.finding_risks (id, tenant_id, finding_id, risk_revision_id, assessment_results_revision_id)
        values (pg_temp.wid(t, v_key || '/risk'), t, v_id, (v_risk_revisions->>(v_item->>'risk'))::uuid, v_results);
      perform pg_temp.wtrack('finding_risks', pg_temp.wid(t, v_key || '/risk'), v_key || '/risk', s);
    end if;
    if v_item->>'observation' is not null then
      insert into public.finding_observations (id, tenant_id, finding_id, observation_id, assessment_results_revision_id)
        values (pg_temp.wid(t, v_key || '/observation'), t, v_id, (v_observations->>(v_item->>'observation'))::uuid, v_results);
      perform pg_temp.wtrack('finding_observations', pg_temp.wid(t, v_key || '/observation'), v_key || '/observation', s);
    end if;
    if v_item->>'evidence' is not null then
      insert into public.finding_evidence (id, tenant_id, finding_id, evidence_version_id, claim)
        values (pg_temp.wid(t, v_key || '/evidence'), t, v_id, (v_evidence->>(v_item->>'evidence'))::uuid, 'Examined for this determination.');
      perform pg_temp.wtrack('finding_evidence', pg_temp.wid(t, v_key || '/evidence'), v_key || '/evidence', s);
    end if;
  end loop;
  update public.assessment_results_revisions set state = 'published', published_at = pg_temp.wtime(p, (v_entry->>'published')::integer, 16),
    published_by_party_id = pg_temp.who(v_entry->>'assessor') where id = v_results;

  -- What the assessor witnesses next: a second campaign whose plan stays a draft, so its
  -- scheduled assessments can move.
  v_entry := w->'witness';
  v_witness := pg_temp.wid(t, s || '/assessment_campaigns/witness');
  v_witness_plan := pg_temp.wid(t, s || '/assessment_plan_revisions/witness');
  insert into public.assessment_campaigns (id, tenant_id, title, description, program_id, owner_party_id, status, starts_at, ends_at)
    values (v_witness, t, v_entry->>'title', v_entry->>'description', v_program.id, pg_temp.who(v_entry->>'owner'), v_entry->>'status',
      pg_temp.wtime(p, (v_entry->>'starts')::integer, 9), pg_temp.wtime(p, (v_entry->>'ends')::integer, 17));
  insert into public.assessment_plan_revisions (id, tenant_id, version_number, state, campaign_id, ssp_revision_id, title, description)
    values (v_witness_plan, t, 1, 'draft', v_witness, v_published_ssp, v_entry->>'plan', v_entry->>'description');
  v_id := pg_temp.wid(t, s || '/assessment_subjects/witness');
  insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, system_id)
    values (v_id, t, v_witness_plan, w->'assessment'->>'subject', v_boundary.id);
  perform pg_temp.wtrack('assessment_campaigns', v_witness, s || '/assessment_campaigns/witness', s);
  perform pg_temp.wtrack('assessment_plan_revisions', v_witness_plan, s || '/assessment_plan_revisions/witness', s);
  perform pg_temp.wtrack('assessment_subjects', v_id, s || '/assessment_subjects/witness', s);
  for v_item, v_n in select value, n from jsonb_array_elements(v_entry->'schedule') with ordinality x(value, n) loop
    v_key := s || '/scheduled_assessment_tasks/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    insert into public.scheduled_assessment_tasks (id, tenant_id, plan_revision_id, title, description, owner_party_id, status, starts_at, due_on)
      values (v_id, t, v_witness_plan, v_item->>0, v_item->>5, pg_temp.who(v_item->>4), v_item->>1,
        pg_temp.wtime(p, (v_item->>2)::integer, 13), pg_temp.wday(p, (v_item->>3)::integer));
    perform pg_temp.wtrack('scheduled_assessment_tasks', v_id, v_key, s);
  end loop;

  -- Scanner imports: each names a file whose hash stands in for bytes the scenario does not hold.
  for v_item, v_n in select value, n from jsonb_array_elements(w->'scans') with ordinality x(value, n) loop
    v_key := s || '/ingestion_jobs/' || v_n;
    v_id := pg_temp.wid(t, v_key);
    v_uri := 'urn:demo:scan:' || lower(p_code) || '/' || trim(both '-' from regexp_replace(lower(v_item->>0), '[^a-z0-9]+', '-', 'g'))
      || '.' || (p->'scanKinds'->(v_item->>4)->>1);
    insert into public.ingestion_jobs (id, tenant_id, title, program_id, source_uri, source_media_type, source_sha256, status,
        requested_by_party_id, started_at, completed_at, summary)
      values (v_id, t, v_item->>0, v_program.id, v_uri, p->'scanKinds'->(v_item->>4)->>0, encode(extensions.digest(v_uri, 'sha256'), 'hex'),
        v_item->>1, v_officer, pg_temp.wtime(p, (v_item->>2)::integer, 2), pg_temp.wtime(p, (v_item->>3)::integer, 3), v_item->>5);
    perform pg_temp.wtrack('ingestion_jobs', v_id, v_key, s);
  end loop;

  -- A draft authorization package holding what is published so far.
  v_entry := w->'package';
  v_package := pg_temp.wid(t, s || '/authorization_packages');
  v_package_rev := pg_temp.wid(t, s || '/package_revisions/1');
  insert into public.authorization_packages (id, tenant_id, program_id, system_id, title, owner_party_id)
    values (v_package, t, v_program.id, v_boundary.id, v_entry->>'title', pg_temp.who(v_entry->>'owner'));
  insert into public.package_revisions (id, tenant_id, version_number, state, package_id, description)
    values (v_package_rev, t, 1, 'draft', v_package, v_entry->>'description');
  perform pg_temp.wtrack('authorization_packages', v_package, s || '/authorization_packages', s);
  perform pg_temp.wtrack('package_revisions', v_package_rev, s || '/package_revisions/1', s);
  if v_entry->'documents' ? 'ssp' then
    insert into public.package_documents (id, tenant_id, package_revision_id, title, ssp_revision_id)
      values (pg_temp.wid(t, s || '/package_documents/ssp'), t, v_package_rev, 'System security plan', v_published_ssp);
  end if;
  if v_entry->'documents' ? 'plan' then
    insert into public.package_documents (id, tenant_id, package_revision_id, title, assessment_plan_revision_id)
      values (pg_temp.wid(t, s || '/package_documents/plan'), t, v_package_rev, 'Delta assessment plan', v_plan_rev);
  end if;
  if v_entry->'documents' ? 'results' then
    insert into public.package_documents (id, tenant_id, package_revision_id, title, assessment_results_revision_id)
      values (pg_temp.wid(t, s || '/package_documents/results'), t, v_package_rev, 'Delta assessment results', v_results);
  end if;
  if v_entry->'documents' ? 'poam' then
    insert into public.package_documents (id, tenant_id, package_revision_id, title, poam_revision_id)
      values (pg_temp.wid(t, s || '/package_documents/poam'), t, v_package_rev, 'Plan of action and milestones', v_poam_rev);
  end if;
  insert into pg_temp.product_work_tracked
    select 'package_documents', d.id, 'package_documents/' || d.id, s from public.package_documents d
    where d.tenant_id = t and d.package_revision_id = v_package_rev;

  -- What the variant offers the system it is fitted to.
  for v_item in select value from jsonb_array_elements(w->'capabilities') loop
    if exists (select 1 from public.provider_capabilities where tenant_id = t and code = v_item->>0) then
      raise exception 'Provider capability % already exists in this workspace.', v_item->>0;
    end if;
    v_key := s || '/provider_capabilities/' || (v_item->>0);
    insert into public.provider_capabilities (id, tenant_id, code, name, description, providing_system_id)
      values (pg_temp.wid(t, v_key), t, v_item->>0, v_item->>1, v_item->>2, v_boundary.id);
    perform pg_temp.wtrack('provider_capabilities', pg_temp.wid(t, v_key), v_key, s);
  end loop;

  -- The program's history as its Overview reads it, and what people said on its records.
  for v_item, v_n in select value, n from jsonb_array_elements(w->'activity') with ordinality x(value, n) loop
    v_key := s || '/activity_events/' || v_n;
    insert into public.activity_events (id, tenant_id, program_id, actor_party_id, event_type, description, occurred_at)
      values (pg_temp.wid(t, v_key), t, v_program.id, pg_temp.who(v_item->>1), v_item->>2, v_item->>3,
        pg_temp.wtime(p, (v_item->>0)::integer, 9 + (v_n % 8)::integer));
    perform pg_temp.wtrack('activity_events', pg_temp.wid(t, v_key), v_key, s);
  end loop;
  for v_item, v_n in select value, n from jsonb_array_elements(w->'comments') with ordinality x(value, n) loop
    v_key := s || '/comments/' || v_n;
    v_text := v_item->>1;
    -- A task is named by its place in the list, every other record by its key.
    v_other := null;
    if v_item->>0 = 'task' then v_other := v_tasks[(v_item->1)::integer]; end if;
    insert into public.comments (id, tenant_id, task_id, issue_id, risk_id, poam_item_id, author_party_id, body)
      values (pg_temp.wid(t, v_key), t, v_other,
        case when v_item->>0 = 'issue' then (v_issues->>v_text)::uuid end,
        case when v_item->>0 = 'risk' then (v_risks->>v_text)::uuid end,
        case when v_item->>0 = 'poam' then (v_items->>v_text)::uuid end,
        pg_temp.who(v_item->>2), v_item->>3);
    perform pg_temp.wtrack('comments', pg_temp.wid(t, v_key), v_key, s);
  end loop;

  -- What the program's Overview will count, read as the account.
  perform set_config('request.jwt.claims', v_claims, true);
  v_result := jsonb_build_object(
    'controlStatus', public.program_control_status(v_program.id)->'totals',
    'variantDelta', public.variant_control_delta(t, v_boundary.id)->'totals',
    'deltaAssessment', v_plan - 'campaignId' - 'planRevisionId' - 'sspRevisionId',
    'product', (v_delta->'product') - 'id' - 'revision_id' - 'configuration_id',
    'updateAvailable', v_delta->'update_available'->'version',
    'skipped', v_skipped);
  perform set_config('request.jwt.claims', '', true);
  return v_result;
end;
$work$;

-- ---------------------------------------------------------------------------------------------
-- The step itself, under its own dataset `products-work-v1`. It runs after the products scenario
-- and once a workspace.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.seed_product_work(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  pw jsonb := p->'productWork';
  v_item jsonb; v_entry jsonb; v_name text; v_code text; v_id uuid; v_next uuid; v_count bigint;
  v_libraries jsonb := '{}'; v_revision public.product_revisions; v_product public.products; v_other record;
  v_source uuid; v_source_resolution uuid; v_assessment uuid; v_from uuid; v_program uuid;
  v_job uuid; v_batch uuid; v_tables jsonb; v_updated jsonb; v_read jsonb := '{}'; v_skipped jsonb := '[]';
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-product-work', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'workDatasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the programs'' work.');
  end if;
  if not exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId') then
    raise exception 'This workspace does not hold the products scenario, which this step works in.';
  end if;

  -- The cast: a person the workspace does not hold is added, with no account.
  for v_name in select jsonb_array_elements_text(p->'cast') loop
    select id into v_id from public.parties where tenant_id = t and name = v_name order by id limit 1;
    if v_id is null then
      v_id := pg_temp.wid(t, 'parties/' || v_name);
      insert into public.parties (id, tenant_id, party_type, name) values (v_id, t, 'person', v_name);
      perform pg_temp.wtrack('parties', v_id, 'parties/' || v_name, 'cast');
    end if;
    insert into pg_temp.product_work_people values (v_name, v_id);
  end loop;
  -- The account's own person, where the workspace has one: its tasks are the ones in My work.
  insert into pg_temp.product_work_people
    select p->>'account', (select id from public.parties where tenant_id = t and auth_user_id = (p->>'accountUserId')::uuid);

  -- A business line nobody owns takes its owner.
  for v_code, v_name in select key, value from jsonb_each_text(p->'businessLineOwners') loop
    update public.business_lines set owner_party_id = pg_temp.who(v_name) where tenant_id = t and code = v_code and owner_party_id is null;
    get diagnostics v_count = row_count;
    perform pg_temp.wupdated('business_lines', v_count);
  end loop;

  -- The component sets behind the smaller products.
  for v_item in select value from jsonb_array_elements(pw->'libraries') loop
    v_libraries := v_libraries || jsonb_build_object(v_item->>'code', pg_temp.write_work_library(t, p, v_item));
  end loop;

  -- A draft version's elements pinned in place.
  for v_item in select value from jsonb_array_elements(pw->'pins') loop
    select r.* into v_revision from public.product_revisions r join public.products x on x.id = r.product_id
      where x.tenant_id = t and x.code = v_item->>'product' order by r.version_number desc limit 1;
    if v_revision.id is null then
      raise exception 'Product % is not in this workspace. The products scenario writes it first.', v_item->>'product';
    end if;
    if v_revision.state <> 'draft' then
      v_skipped := v_skipped || jsonb_build_object('pins', v_item->>'product', 'reason', 'its latest version is published and cannot be pinned in place');
      continue;
    end if;
    update public.product_elements e set defined_component_id = (v_libraries->(v_item->>'library')->'components'->>(v_item->'elements'->>e.code))::uuid
      where e.tenant_id = t and e.product_revision_id = v_revision.id and v_item->'elements' ? e.code and e.defined_component_id is null;
    get diagnostics v_count = row_count;
    perform pg_temp.wupdated('product_elements', v_count);
  end loop;

  -- A published product's next version, copied through the command as the account, its elements
  -- pinned while it is a draft, then published.
  for v_item in select value from jsonb_array_elements(pw->'revisions') loop
    select r.* into v_revision from public.product_revisions r join public.products x on x.id = r.product_id
      where x.tenant_id = t and x.code = v_item->>'product' and r.state = 'published' order by r.version_number desc limit 1;
    if v_revision.id is null then
      raise exception 'Product % has no published version in this workspace. The products scenario writes it first.', v_item->>'product';
    end if;
    perform set_config('request.jwt.claims', v_claims, true);
    v_next := public.copy_product_revision(t, v_revision.id);
    perform set_config('request.jwt.claims', '', true);
    update public.product_elements e set defined_component_id = (v_libraries->(v_item->>'library')->'components'->>(v_item->'elements'->>e.code))::uuid
      where e.tenant_id = t and e.product_revision_id = v_next and v_item->'elements' ? e.code;
    update public.product_revisions set remarks = v_item->>'remarks', effective_from = (v_item->>'effectiveFrom')::date where id = v_next;
    update public.product_revisions set state = 'published' where id = v_next;
    perform pg_temp.track_work_revision(t, v_next);
  end loop;

  -- The products this step adds.
  for v_item in select value from jsonb_array_elements(pw->'products') loop
    if exists (select 1 from public.products where tenant_id = t and code = v_item->>'code') then
      raise exception 'The workspace already has a product coded %; the step does not overwrite it.', v_item->>'code';
    end if;
    select id into v_id from public.business_lines where tenant_id = t and code = v_item->>'businessLine';
    if v_id is null then
      raise exception 'Business line % is not in this workspace. The products scenario writes it first.', v_item->>'businessLine';
    end if;
    select * into v_other from pg_temp.write_product(t, v_item, v_id, v_libraries->(v_item->>'library')->'components');
    update public.product_revisions set state = 'published' where id = v_other.revision_id;
    perform pg_temp.wtrack('products', v_other.product_id, 'products/' || (v_item->>'code'), 'productWork');
    insert into pg_temp.product_work_tracked
      select 'product_configurations', c.id, 'product_configurations/' || c.id, 'productWork'
      from public.product_configurations c where c.tenant_id = t and c.product_id = v_other.product_id;
    perform pg_temp.track_work_revision(t, v_other.revision_id);
  end loop;

  -- The X800's second version: the first's determinations on the elements it keeps, by their
  -- codes, and the element it adds judged for the first time.
  v_item := pw->'carried';
  select r.id into v_next from public.product_revisions r join public.products x on x.id = r.product_id
    where x.tenant_id = t and x.code = v_item->>'product' and r.version_number = (v_item->>'version')::integer and r.state = 'published';
  select r.id into v_from from public.product_revisions r join public.products x on x.id = r.product_id
    where x.tenant_id = t and x.code = v_item->>'product' and r.version_number = (v_item->>'from')::integer;
  select a.id, a.profile_resolution_id into v_source, v_source_resolution from public.product_assessments a
    where a.tenant_id = t and a.product_revision_id = v_from and a.state = 'published' order by a.published_at desc, a.id desc limit 1;
  if v_next is null or v_source is null then
    raise exception '% version % or the assessment of version % is not in this workspace. The products scenario writes them first.',
      v_item->>'product', v_item->>'version', v_item->>'from';
  end if;
  if exists (select 1 from public.product_assessments a where a.tenant_id = t and a.product_revision_id = v_next) then
    v_skipped := v_skipped || jsonb_build_object('assessment', v_item->>'title', 'reason', 'the version already has an assessment');
  else
    perform pg_temp.work_controls_of(v_source_resolution);
    v_assessment := pg_temp.wid(t, 'product_assessments/' || (v_item->>'product') || '/' || (v_item->>'version'));
    insert into public.product_assessments (id, tenant_id, product_revision_id, profile_resolution_id, title, description, assessor_party_id, started_on, completed_on)
      values (v_assessment, t, v_next, v_source_resolution, v_item->>'title', v_item->>'description', pg_temp.who(v_item->>'assessor'),
        (v_item->>'startedOn')::date, (v_item->>'completedOn')::date);
    insert into public.product_determinations (id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination, rationale)
    select pg_temp.wid(t, 'product_determinations/carried/' || coalesce(e2.code, 'product') || '/' || d.control_id), t, v_assessment, v_next, e2.id,
      d.control_id, d.determination, case when d.product_element_id is null then d.rationale else v_item->>'carriedRationale' end
    from public.product_determinations d
    left join public.product_elements e1 on e1.id = d.product_element_id
    left join public.product_elements e2 on e2.tenant_id = t and e2.product_revision_id = v_next and e2.code = e1.code
    where d.tenant_id = t and d.product_assessment_id = v_source and (d.product_element_id is null or e2.id is not null);
    v_entry := v_item->'newElement';
    insert into public.product_determinations (id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination, rationale)
    select pg_temp.wid(t, 'product_determinations/carried/' || e.code || '/' || k.id), t, v_assessment, v_next, e.id, k.id, d.determination, v_entry->>'rationale'
    from public.product_elements e
    join pg_temp.product_work_controls k on k.resolution_id = v_source_resolution
    cross join lateral (select pg_temp.determination(pg_temp.bucket('new-element-determination/' || e.code || '/' || k.code), v_entry->'spread') as determination) d
    where e.tenant_id = t and e.product_revision_id = v_next and e.code = v_entry->>'code' and d.determination is not null
      and pg_temp.bucket('new-element/' || e.code || '/' || k.code) < coalesce((v_entry->'families'->>k.family)::integer, 0);
    update public.product_assessments set state = 'published', published_at = (v_item->>'publishedAt')::timestamptz where id = v_assessment;
    insert into pg_temp.product_work_tracked
      select 'product_assessments', v_assessment, 'product_assessments/' || (v_item->>'product') || '/' || (v_item->>'version'), 'productWork'
      union all select 'product_determinations', d.id, 'product_determinations/' || d.id, 'productWork'
        from public.product_determinations d where d.tenant_id = t and d.product_assessment_id = v_assessment;
    perform set_config('request.jwt.claims', v_claims, true);
    v_read := v_read || jsonb_build_object((v_item->>'product') || ' v' || (v_item->>'version'), (public.product_control_status(t, v_next)->'totals') - 'scopes');
    perform set_config('request.jwt.claims', '', true);
  end if;

  -- The other products' latest published versions, assessed.
  for v_item in select value from jsonb_array_elements(pw->'assessments') loop
    select r.* into v_revision from public.product_revisions r join public.products x on x.id = r.product_id
      where x.tenant_id = t and x.code = v_item->>'product' and r.state = 'published' order by r.version_number desc limit 1;
    perform pg_temp.write_work_assessment(t, p, v_item, v_revision.id, v_revision.version_number);
    perform set_config('request.jwt.claims', v_claims, true);
    v_read := v_read || jsonb_build_object((v_item->>'product') || ' v' || v_revision.version_number,
      (public.product_control_status(t, v_revision.id)->'totals') - 'scopes');
    perform set_config('request.jwt.claims', '', true);
  end loop;

  -- The programs this step adds, each with its customer's requirements.
  for v_item in select value from jsonb_array_elements(pw->'programs') loop
    v_program := pg_temp.write_work_program(t, p, v_item);
    perform pg_temp.write_work_requirements(t, p, v_program, v_item);
  end loop;

  -- The work of every program of the scenario.
  for v_code in select jsonb_array_elements_text(p->'workOrder') loop
    v_entry := pg_temp.seed_program_work(p, v_code);
    v_skipped := v_skipped || (v_entry->'skipped');
    v_read := v_read || jsonb_build_object(v_code, v_entry - 'skipped');
  end loop;

  -- Provenance: one batch, one source a section of the scenario, one record a row written.
  v_job := pg_temp.wid(t, 'ingestion_jobs/products-work');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Products work demo seed', 'urn:program-assurance:demo:' || (p->>'workDatasetId'), 'completed', now(), now(),
      'Authored work for the programs of the products scenario (scripts/demo/products-work-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(*) as n from pg_temp.product_work_tracked group by destination_table) c;
  select coalesce(jsonb_object_agg(table_name, n), '{}'::jsonb) into v_updated
    from (select table_name, sum(n) as n from pg_temp.product_work_updated group by table_name) c;
  v_batch := pg_temp.wid(t, 'demo_import_batches');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'workDatasetId', p->>'workScenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-work-scenario.mjs', 'asOf', p->>'asOf'),
      jsonb_build_object('tables', v_tables, 'updated', v_updated, 'read', v_read, 'skipped', v_skipped));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
  select pg_temp.wid(t, 'demo_import_sources/' || x.section), t, v_batch, '/' || x.section,
    encode(extensions.digest(coalesce(p #> string_to_array(x.section, '/'), 'null'::jsonb)::text, 'sha256'), 'hex'),
    p #> string_to_array(x.section, '/')
  from (select distinct section from pg_temp.product_work_tracked) x;
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.wid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'workDatasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || k.section, x.source_sha256, x.id, jsonb_build_object('section', k.section)
  from pg_temp.product_work_tracked k
  join public.demo_import_sources x on x.tenant_id = t and x.import_batch_id = v_batch and x.source_pointer = '/' || k.section;

  return jsonb_build_object(
    'changed', true,
    'tables', v_tables,
    'updated', v_updated,
    'records', (select count(*) from pg_temp.product_work_tracked),
    'read', v_read,
    'skipped', v_skipped
  );
end;
$seed$;
