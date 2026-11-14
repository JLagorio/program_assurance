-- The products seed's transaction body, loaded by scripts/seed-demo-products.mjs. It defines
-- temporary objects only; the script calls pg_temp.seed_products(payload) inside its own
-- transaction and commits (--apply) or rolls back (--check).
--
-- Every record it writes directly is listed in demo_import_records under the dataset
-- `products-v1`, with the programs and the systems the program wizard creates for it. It runs once
-- a workspace: a workspace that already holds the dataset's batch changes nothing.

create temp table products_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;
create temp table products_controls (
  id uuid primary key, code text not null, title text not null, family text
) on commit drop;

-- A stable identity for a scenario record: the same workspace and key give the same id.
create function pg_temp.sid(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/products-v1/' || p_key)::uuid
$$;
-- A stable spread over 0..99, so a claim or a determination lands in the same bucket every time.
create function pg_temp.bucket(p_key text) returns integer language sql immutable as $$
  select ('x' || substr(md5(p_key), 1, 7))::bit(28)::integer % 100
$$;
-- A person of the workspace by name, or nobody: the scenario runs with or without the demo import.
create function pg_temp.person(p jsonb, p_role text) returns uuid language sql stable as $$
  select id from public.parties
  where tenant_id = (p->>'tenantId')::uuid and name = p->'people'->>p_role order by id limit 1
$$;
-- A determination from a bucket and a spread [satisfied below, partially below, other than below].
create function pg_temp.determination(p_bucket integer, p_spread jsonb) returns text language sql immutable as $$
  select case
    when p_bucket < (p_spread->>0)::integer then 'satisfied'
    when p_bucket < (p_spread->>1)::integer then 'partially_satisfied'
    when p_bucket < (p_spread->>2)::integer then 'other_than_satisfied'
  end
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

-- A product with one version: its configurations, its element tree and which configuration each
-- element is in. `p_components` maps a component key to its defined component, for a pinned element.
create function pg_temp.write_product(p_tenant uuid, p_product jsonb, p_line uuid, p_components jsonb, out product_id uuid, out revision_id uuid)
language plpgsql as $$
declare v_item jsonb; v_code text := p_product->>'code'; v_element uuid; v_config uuid;
begin
  product_id := pg_temp.sid(p_tenant, 'products/' || v_code);
  revision_id := pg_temp.sid(p_tenant, 'product_revisions/' || v_code || '/1');
  insert into public.products (id, tenant_id, code, name, description, business_line_id)
    values (product_id, p_tenant, v_code, p_product->>'name', p_product->>'description', p_line);
  insert into public.product_revisions (id, tenant_id, product_id, version_number, effective_from, remarks)
    values (revision_id, p_tenant, product_id, 1, nullif(p_product->>'effectiveFrom', '')::date, p_product->>'remarks');
  for v_item in select value from jsonb_array_elements(p_product->'configurations') loop
    insert into public.product_configurations (id, tenant_id, product_id, code, name, description)
      values (pg_temp.sid(p_tenant, 'product_configurations/' || v_code || '/' || (v_item->>'code')), p_tenant, product_id,
        v_item->>'code', v_item->>'name', v_item->>'description');
  end loop;
  -- An element is [code, name, type, parent code, configurations, component key]; a parent comes first.
  for v_item in select e.value || jsonb_build_array(e.position) from jsonb_array_elements(p_product->'elements') with ordinality e(value, position) order by e.position loop
    v_element := pg_temp.sid(p_tenant, 'product_elements/' || v_code || '/1/' || (v_item->>0));
    insert into public.product_elements (id, tenant_id, product_revision_id, parent_element_id, code, name, element_type, defined_component_id, position)
      values (v_element, p_tenant, revision_id,
        case when v_item->>3 is null then null else pg_temp.sid(p_tenant, 'product_elements/' || v_code || '/1/' || (v_item->>3)) end,
        v_item->>0, v_item->>1, v_item->>2,
        case when jsonb_array_length(v_item) > 6 and v_item->>5 is not null then (p_components->>(v_item->>5))::uuid end,
        (v_item->>-1)::integer);
    for v_config in select c.id from public.product_configurations c
      where c.tenant_id = p_tenant and c.product_id = write_product.product_id
        and (jsonb_array_length(v_item) < 6 or v_item->>4 = '*' or v_item->>4 = c.code) loop
      insert into public.product_configuration_elements (id, tenant_id, product_revision_id, product_configuration_id, product_element_id)
        values (pg_temp.sid(p_tenant, 'product_configuration_elements/' || v_config || '/' || v_element), p_tenant, revision_id, v_config, v_element);
    end loop;
  end loop;
end $$;

create function pg_temp.seed_products(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_product_json jsonb := p->'product';
  v_library_json jsonb := p->'library';
  v_assess jsonb := p->'product'->'assessment';
  v_resolution uuid; v_catalog uuid; v_lines jsonb := '{}'; v_components jsonb := '{}';
  v_item jsonb; v_variant jsonb; v_entry jsonb; v_id uuid; v_code text; v_text text;
  v_definition uuid; v_library uuid; v_product uuid; v_revision uuid; v_assessment uuid; v_next uuid;
  v_configuration public.product_configurations; v_elements jsonb; v_draft jsonb; v_created jsonb;
  v_program uuid; v_system public.systems; v_profile uuid; v_other record;
  v_job uuid; v_batch uuid; v_tables jsonb; v_read jsonb := '{}';
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-products', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the products scenario.');
  end if;
  select * into v_resolution, v_catalog from pg_temp.reference_baseline(v_product_json->>'baseline');
  if v_catalog is null then
    raise exception 'The reference baseline "%" names no catalog edition.', v_product_json->>'baseline';
  end if;
  insert into pg_temp.products_controls (id, code, title, family)
    select k.id, k.code, k.title, upper(g.source_id)
    from public.selected_controls sc
    join public.controls k on k.id = sc.control_id
    left join public.catalog_groups g on g.id = k.group_id
    where sc.profile_resolution_id = v_resolution;

  -- Business lines.
  for v_item in select value from jsonb_array_elements(p->'businessLines') loop
    v_id := pg_temp.sid(t, 'business_lines/' || (v_item->>'code'));
    insert into public.business_lines (id, tenant_id, code, name, description, owner_party_id)
      values (v_id, t, v_item->>'code', v_item->>'name', v_item->>'description', pg_temp.person(p, v_item->>'owner'));
    v_lines := v_lines || jsonb_build_object(v_item->>'code', v_id);
  end loop;

  -- The library behind the product: one component set, its components and what each claims.
  v_definition := pg_temp.sid(t, 'component_definitions/' || (v_library_json->>'code'));
  v_library := pg_temp.sid(t, 'component_definition_revisions/' || (v_library_json->>'code') || '/1');
  insert into public.component_definitions (id, tenant_id, code, name, description, category)
    values (v_definition, t, v_library_json->>'code', v_library_json->>'name', v_library_json->>'description', 'catalog_product');
  insert into public.component_definition_revisions (id, tenant_id, component_definition_id, version_number, remarks, effective_from, conditions, consumer_responsibilities)
    values (v_library, t, v_definition, 1, v_library_json->>'remarks', (v_library_json->>'effectiveFrom')::date,
      v_library_json->>'conditions', v_library_json->>'consumerResponsibilities');
  for v_item in select value from jsonb_array_elements(v_library_json->'components') loop
    v_id := pg_temp.sid(t, 'defined_components/' || (v_item->>'key'));
    insert into public.defined_components (id, tenant_id, component_definition_revision_id, name, component_type, description)
      values (v_id, t, v_library, v_item->>'name', v_item->>'type', v_item->>'description');
    v_components := v_components || jsonb_build_object(v_item->>'key', v_id);
    insert into public.defined_component_implementations (id, tenant_id, component_definition_revision_id, defined_component_id,
        control_id, description, implementation_status, coverage, consumer_responsibility)
    select pg_temp.sid(t, 'claims/' || (v_item->>'key') || '/' || k.code), t, v_library, v_id, k.id,
      format('%s %s (%s %s).', v_item->>'name', coalesce(p->'familyPhrases'->>k.family, 'supports the control'), k.code, k.title),
      'implemented',
      case when c.b < 12 then 'partial' when c.b < 17 then 'conditional' else 'full' end,
      case when c.b < 17 then p->'consumerResponsibilities'->>k.family end
    from pg_temp.products_controls k
    cross join lateral (select pg_temp.bucket('coverage/' || (v_item->>'key') || '/' || k.code) as b) c
    where k.code in (select jsonb_array_elements_text(v_item->'anchors'))
      or pg_temp.bucket('claim/' || (v_item->>'key') || '/' || k.code) < coalesce((v_item->'families'->>k.family)::integer, 0);
  end loop;
  update public.component_definition_revisions set state = 'published' where id = v_library;

  -- The product, published, then the smaller ones.
  select * into v_product, v_revision from pg_temp.write_product(t, v_product_json, (v_lines->>(v_product_json->>'businessLine'))::uuid, v_components);
  update public.product_revisions set state = 'published' where id = v_revision;
  for v_item in select value from jsonb_array_elements(p->'otherProducts') loop
    select * into v_other from pg_temp.write_product(t, v_item, (v_lines->>(v_item->>'businessLine'))::uuid, '{}'::jsonb);
    if v_item->>'state' = 'published' then
      update public.product_revisions set state = 'published' where id = v_other.revision_id;
    end if;
  end loop;

  -- The product assessed once: a determination an element and control it claims, and one for the
  -- product as a whole on a share of the families its process answers.
  v_assessment := pg_temp.sid(t, 'product_assessments/' || (v_product_json->>'code') || '/1');
  insert into public.product_assessments (id, tenant_id, product_revision_id, profile_resolution_id, title, description, assessor_party_id, started_on, completed_on)
    values (v_assessment, t, v_revision, v_resolution, v_assess->>'title', v_assess->>'description', pg_temp.person(p, v_assess->>'assessor'),
      (v_assess->>'startedOn')::date, (v_assess->>'completedOn')::date);
  insert into public.product_determinations (id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination)
  select pg_temp.sid(t, 'product_determinations/' || e.code || '/' || k.code), t, v_assessment, v_revision, e.id, k.id, d.determination
  from public.product_elements e
  join public.defined_component_implementations i on i.tenant_id = t and i.defined_component_id = e.defined_component_id and i.control_id is not null
  join pg_temp.products_controls k on k.id = i.control_id
  cross join lateral (select pg_temp.determination(pg_temp.bucket('determination/' || e.code || '/' || k.code),
    case when v_assess->'weakElements' ? e.code then v_assess->'weakSpread' else v_assess->'spread' end) as determination) d
  where e.tenant_id = t and e.product_revision_id = v_revision and d.determination is not null;
  insert into public.product_determinations (id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination, rationale)
  select pg_temp.sid(t, 'product_determinations/product/' || k.code), t, v_assessment, v_revision, null, k.id,
    pg_temp.determination(pg_temp.bucket('whole-determination/' || k.code), v_assess->'wholeSpread'), v_assess->>'wholeRationale'
  from pg_temp.products_controls k
  where v_assess->'wholeFamilies' ? k.family
    and pg_temp.bucket('whole/' || k.code) < (v_assess->>'wholeShare')::integer;
  update public.product_assessments set state = 'published', published_at = (v_assess->>'publishedAt')::timestamptz where id = v_assessment;

  -- The programs, each created through the program wizard as the account: one variant of a
  -- configuration, without the elements it leaves out and with its own.
  for v_item in select value from jsonb_array_elements(p->'programs') loop
    v_variant := v_item->'variant';
    select * into v_configuration from public.product_configurations
      where tenant_id = t and product_id = v_product and code = v_variant->>'configuration';
    select coalesce(jsonb_agg(jsonb_build_object(
        'key', pg_temp.sid(t, 'variant/' || (v_variant->>'code') || '/' || e.code),
        'parentKey', case when pe.id is null then null else pg_temp.sid(t, 'variant/' || (v_variant->>'code') || '/' || pe.code) end,
        'code', (v_variant->>'prefix') || '-' || e.code, 'name', e.name, 'description', coalesce(e.description, ''),
        'type', case when e.defined_component_id is null then e.element_type end,
        'library', case when e.defined_component_id is null then null else jsonb_build_object(
          'revisionId', v_library, 'definedComponentId', e.defined_component_id,
          'rationale', format('Inherited from %s v1 · %s.', v_product_json->>'name', v_configuration.name)) end,
        'productElementId', e.id) order by e.position), '[]'::jsonb) into v_elements
    from public.product_elements e
    join public.product_configuration_elements m on m.tenant_id = t and m.product_element_id = e.id and m.product_configuration_id = v_configuration.id
    left join public.product_elements pe on pe.id = e.parent_element_id
    where e.tenant_id = t and e.product_revision_id = v_revision and not v_variant->'removed' ? e.code;
    select v_elements || coalesce(jsonb_agg(jsonb_build_object(
        'key', pg_temp.sid(t, 'variant/' || (v_variant->>'code') || '/' || (a.value->>0)),
        'parentKey', case when a.value->>3 is null then null else pg_temp.sid(t, 'variant/' || (v_variant->>'code') || '/' || (a.value->>3)) end,
        'code', (v_variant->>'prefix') || '-' || (a.value->>0), 'name', a.value->>1, 'description', coalesce(a.value->>4, ''),
        'type', a.value->>2, 'library', null, 'productElementId', null) order by a.position), '[]'::jsonb) into v_elements
    from jsonb_array_elements(v_variant->'added') with ordinality a(value, position);
    v_profile := pg_temp.sid(t, 'profile/' || (v_item->>'code'));
    v_draft := jsonb_build_object(
      'requestId', pg_temp.sid(t, 'program_wizard_requests/' || (v_item->>'code')),
      'code', v_item->>'code', 'name', v_item->>'name', 'description', v_item->>'description',
      'sponsorPartyId', null, 'startsOn', v_item->>'startsOn', 'endsOn', null, 'roles', '[]'::jsonb,
      'catalogRevisionId', v_catalog,
      'profiles', jsonb_build_array(jsonb_build_object(
        'key', v_profile, 'baseResolutionId', v_resolution, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
      'systems', jsonb_build_array(jsonb_build_object(
        'key', pg_temp.sid(t, 'variant/' || (v_variant->>'code')), 'code', v_variant->>'code', 'name', v_variant->>'name',
        'description', v_variant->>'description', 'type', 'platform', 'ownerPartyId', null,
        'confidentiality', v_variant->'impact'->>0, 'integrity', v_variant->'impact'->>1, 'availability', v_variant->'impact'->>2,
        'categorizationRationale', v_variant->>'rationale', 'profileKey', v_profile,
        'product', jsonb_build_object('revisionId', v_revision, 'configurationId', v_configuration.id),
        'elements', v_elements)));
    perform set_config('request.jwt.claims', v_claims, true);
    v_created := public.create_program_wizard(t, v_draft);
    v_program := (v_created->>'programId')::uuid;
    -- What the program changed in the elements it kept, through the command.
    for v_entry in select value from jsonb_array_elements(v_variant->'changes') loop
      select * into v_system from public.systems where tenant_id = t and program_id = v_program
        and code = (v_variant->>'prefix') || '-' || (v_entry->>0);
      if v_system.id is null then
        raise exception '% does not keep the element % it is said to change.', v_item->>'code', v_entry->>0;
      end if;
      perform public.declare_product_element_change(t, v_system.id, v_system.revision,
        array(select jsonb_array_elements_text(v_entry->1)), v_entry->>2);
    end loop;
    perform set_config('request.jwt.claims', '', true);
    update public.programs set status = 'active', business_line_id = (v_lines->>(v_item->>'businessLine'))::uuid where id = v_program;
    insert into pg_temp.products_tracked values ('programs', v_program, 'programs/' || (v_item->>'code'), 'programs');
    insert into pg_temp.products_tracked
      select 'systems', s.id, 'systems/' || s.code, 'programs' from public.systems s where s.tenant_id = t and s.program_id = v_program;
    select * into v_system from public.systems where tenant_id = t and program_id = v_program and code = v_variant->>'code';
    perform set_config('request.jwt.claims', v_claims, true);
    v_read := v_read || jsonb_build_object(v_variant->>'code', public.variant_control_delta(t, v_system.id) - 'controls');
    perform set_config('request.jwt.claims', '', true);
  end loop;

  -- A second version of the product, published after the programs took the first.
  perform set_config('request.jwt.claims', v_claims, true);
  v_next := public.copy_product_revision(t, v_revision);
  v_read := v_read || jsonb_build_object('product', public.product_control_status(t, v_revision)->'totals');
  perform set_config('request.jwt.claims', '', true);
  v_item := v_product_json->'nextVersion';
  v_id := pg_temp.sid(t, 'product_elements/' || (v_product_json->>'code') || '/2/' || (v_item->'element'->>0));
  insert into public.product_elements (id, tenant_id, product_revision_id, parent_element_id, code, name, element_type, position)
    select v_id, t, v_next, parent.id, v_item->'element'->>0, v_item->'element'->>1, v_item->'element'->>2,
      (select coalesce(max(position), 0) + 1 from public.product_elements where product_revision_id = v_next)
    from public.product_elements parent
    where parent.tenant_id = t and parent.product_revision_id = v_next and parent.code = v_item->'element'->>3;
  insert into public.product_configuration_elements (tenant_id, product_revision_id, product_configuration_id, product_element_id)
    select t, v_next, c.id, v_id from public.product_configurations c where c.tenant_id = t and c.product_id = v_product;
  update public.product_revisions set remarks = v_item->>'remarks', effective_from = (v_item->>'effectiveFrom')::date where id = v_next;
  update public.product_revisions set state = 'published' where id = v_next;

  -- Provenance: one batch, one source a section of the scenario, one record a row written.
  insert into pg_temp.products_tracked
    select 'business_lines', b.id, 'business_lines/' || b.code, 'businessLines' from public.business_lines b
      where b.tenant_id = t and b.id in (select value::uuid from jsonb_each_text(v_lines))
    union all select 'component_definitions', v_definition, 'component_definitions/' || (v_library_json->>'code'), 'library'
    union all select 'component_definition_revisions', v_library, 'component_definition_revisions/' || (v_library_json->>'code') || '/1', 'library'
    union all select 'defined_components', c.id, 'defined_components/' || c.id, 'library' from public.defined_components c
      where c.tenant_id = t and c.component_definition_revision_id = v_library
    union all select 'defined_component_implementations', i.id, 'defined_component_implementations/' || i.id, 'library'
      from public.defined_component_implementations i where i.tenant_id = t and i.component_definition_revision_id = v_library
    union all select 'products', x.id, 'products/' || x.code, 'product' from public.products x
      where x.tenant_id = t and x.business_line_id in (select value::uuid from jsonb_each_text(v_lines))
    union all select 'product_revisions', r.id, 'product_revisions/' || r.id, 'product' from public.product_revisions r
      join public.products x on x.id = r.product_id where r.tenant_id = t and x.business_line_id in (select value::uuid from jsonb_each_text(v_lines))
    union all select 'product_configurations', c.id, 'product_configurations/' || c.id, 'product' from public.product_configurations c
      join public.products x on x.id = c.product_id where c.tenant_id = t and x.business_line_id in (select value::uuid from jsonb_each_text(v_lines))
    union all select 'product_elements', e.id, 'product_elements/' || e.id, 'product' from public.product_elements e
      join public.product_revisions r on r.id = e.product_revision_id join public.products x on x.id = r.product_id
      where e.tenant_id = t and x.business_line_id in (select value::uuid from jsonb_each_text(v_lines))
    union all select 'product_configuration_elements', m.id, 'product_configuration_elements/' || m.id, 'product'
      from public.product_configuration_elements m
      join public.product_revisions r on r.id = m.product_revision_id join public.products x on x.id = r.product_id
      where m.tenant_id = t and x.business_line_id in (select value::uuid from jsonb_each_text(v_lines))
    union all select 'product_assessments', v_assessment, 'product_assessments/' || (v_product_json->>'code') || '/1', 'product'
    union all select 'product_determinations', d.id, 'product_determinations/' || d.id, 'product'
      from public.product_determinations d where d.tenant_id = t and d.product_assessment_id = v_assessment;

  v_job := pg_temp.sid(t, 'ingestion_jobs/products');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Products demo seed', 'urn:program-assurance:demo:' || (p->>'datasetId'), 'completed', now(), now(),
      'Authored products scenario: a business line, a product assessed once and the programs that take it (scripts/demo/products-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(*) as n from pg_temp.products_tracked group by destination_table) c;
  v_batch := pg_temp.sid(t, 'demo_import_batches');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'datasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-scenario.mjs'),
      jsonb_build_object('tables', v_tables, 'read', v_read));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
  select pg_temp.sid(t, 'demo_import_sources/' || s.section), t, v_batch, '/' || s.section,
    encode(extensions.digest(coalesce(p->s.section, 'null'::jsonb)::text, 'sha256'), 'hex'), p->s.section
  from (select distinct section from pg_temp.products_tracked) s;
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.sid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'datasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || k.section, s.source_sha256, s.id, jsonb_build_object('section', k.section)
  from pg_temp.products_tracked k
  join public.demo_import_sources s on s.tenant_id = t and s.import_batch_id = v_batch and s.source_pointer = '/' || k.section;

  return jsonb_build_object(
    'changed', true,
    'tables', v_tables,
    'records', (select count(*) from pg_temp.products_tracked),
    'read', v_read
  );
end;
$seed$;

-- ---------------------------------------------------------------------------------------------
-- The customers' requirements, under their own dataset `products-requirements-v1`: each program's
-- document imported through the command as the account, then where each requirement is allocated,
-- the controls it maps and the program's answer to it. It runs after the products scenario and
-- once a workspace.
-- ---------------------------------------------------------------------------------------------
create temp table product_requirements_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;

create function pg_temp.seed_product_requirements(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_entry jsonb; v_item jsonb; v_code text; v_key text;
  v_program public.programs; v_catalog uuid; v_result jsonb; v_source uuid; v_sources uuid[] := '{}';
  v_requirement uuid; v_revision uuid; v_system uuid; v_control uuid;
  v_job uuid; v_batch uuid; v_tables jsonb; v_read jsonb := '{}';
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-product-requirements', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'requirementsDatasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the customers'' requirements.');
  end if;
  for v_entry in select value from jsonb_array_elements(p->'customerRequirements') loop
    select * into v_program from public.programs where tenant_id = t and code = v_entry->>'program';
    if v_program.id is null then
      raise exception 'Program % is not in this workspace. The products scenario writes it first.', v_entry->>'program';
    end if;
    select c.catalog_revision_id into v_catalog from public.program_reference_choices c
      where c.tenant_id = t and c.program_id = v_program.id order by c.id limit 1;
    perform set_config('request.jwt.claims', v_claims, true);
    v_result := public.import_customer_requirements(t, v_program.id,
      pg_temp.sid(t, 'requirement_import_requests/' || (v_entry->>'program')), v_entry->'source',
      (select jsonb_agg(jsonb_build_object('reference', i.value->>0, 'title', i.value->>1, 'statement', i.value->>2) order by i.position)
        from jsonb_array_elements(v_entry->'items') with ordinality i(value, position)));
    perform set_config('request.jwt.claims', '', true);
    v_source := (v_result->>'sourceId')::uuid;
    v_sources := v_sources || v_source;
    for v_item in select value from jsonb_array_elements(v_entry->'items') loop
      v_key := (v_entry->>'program') || '/' || (v_item->>0);
      select q.id, v.id into v_requirement, v_revision
      from public.engineering_requirements q
      join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
      where q.tenant_id = t and q.source_id = v_source and q.source_reference = v_item->>0;
      if v_revision is null then
        raise exception 'Requirement % of % was not imported.', v_item->>0, v_entry->>'program';
      end if;
      for v_code in select jsonb_array_elements_text(v_item->3) loop
        select s.id into v_system from public.systems s
          where s.tenant_id = t and s.program_id = v_program.id and s.code = (v_entry->>'prefix') || '-' || v_code;
        if v_system is null then
          raise exception '% holds no element % for requirement %.', v_entry->>'program', v_code, v_item->>0;
        end if;
        insert into public.requirement_allocations (id, tenant_id, requirement_revision_id, system_id, rationale)
          values (pg_temp.sid(t, 'requirement_allocations/' || v_key || '/' || v_code), t, v_revision, v_system,
            'Allocated where the customer''s requirement is met.');
      end loop;
      for v_code in select jsonb_array_elements_text(v_item->4) loop
        select k.id into v_control from public.controls k where k.catalog_revision_id = v_catalog and k.code = v_code;
        if v_control is null then
          raise exception 'Control % is not in the catalog edition of %.', v_code, v_entry->>'program';
        end if;
        insert into public.requirement_control_links (id, tenant_id, requirement_revision_id, control_id, relationship_type, rationale)
          values (pg_temp.sid(t, 'requirement_control_links/' || v_key || '/' || v_code), t, v_revision, v_control, 'maps_to',
            'The customer''s requirement is met through this control.');
      end loop;
      if v_item->>5 is not null then
        insert into public.requirement_compliance (id, tenant_id, engineering_requirement_id, status, verification_method, statement)
          values (pg_temp.sid(t, 'requirement_compliance/' || v_key), t, v_requirement, v_item->>5, v_item->>6, v_item->>7);
      end if;
    end loop;
    perform set_config('request.jwt.claims', v_claims, true);
    v_read := v_read || jsonb_build_object(v_entry->>'program', public.requirement_source_compliance(t, v_source)->'totals');
    perform set_config('request.jwt.claims', '', true);
  end loop;

  insert into pg_temp.product_requirements_tracked
    select 'requirement_sources', s.id, 'requirement_sources/' || s.id, 'customerRequirements'
      from public.requirement_sources s where s.tenant_id = t and s.id = any(v_sources)
    union all select 'engineering_requirements', q.id, 'engineering_requirements/' || q.id, 'customerRequirements'
      from public.engineering_requirements q where q.tenant_id = t and q.source_id = any(v_sources)
    union all select 'requirement_revisions', v.id, 'requirement_revisions/' || v.id, 'customerRequirements'
      from public.requirement_revisions v join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where v.tenant_id = t and q.source_id = any(v_sources)
    union all select 'requirement_allocations', a.id, 'requirement_allocations/' || a.id, 'customerRequirements'
      from public.requirement_allocations a join public.requirement_revisions v on v.id = a.requirement_revision_id
      join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where a.tenant_id = t and q.source_id = any(v_sources)
    union all select 'requirement_control_links', l.id, 'requirement_control_links/' || l.id, 'customerRequirements'
      from public.requirement_control_links l join public.requirement_revisions v on v.id = l.requirement_revision_id
      join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where l.tenant_id = t and q.source_id = any(v_sources)
    union all select 'requirement_compliance', c.id, 'requirement_compliance/' || c.id, 'customerRequirements'
      from public.requirement_compliance c join public.engineering_requirements q on q.id = c.engineering_requirement_id
      where c.tenant_id = t and q.source_id = any(v_sources);

  v_job := pg_temp.sid(t, 'ingestion_jobs/product-requirements');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Customer requirements demo seed', 'urn:program-assurance:demo:' || (p->>'requirementsDatasetId'), 'completed', now(), now(),
      'Authored customer requirements for the programs of the products scenario (scripts/demo/products-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(*) as n from pg_temp.product_requirements_tracked group by destination_table) c;
  v_batch := pg_temp.sid(t, 'demo_import_batches/requirements');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'requirementsDatasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-scenario.mjs'),
      jsonb_build_object('tables', v_tables, 'read', v_read));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
    values (pg_temp.sid(t, 'demo_import_sources/customerRequirements'), t, v_batch, '/customerRequirements',
      encode(extensions.digest((p->'customerRequirements')::text, 'sha256'), 'hex'), p->'customerRequirements');
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.sid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'requirementsDatasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || k.section, s.source_sha256, s.id, jsonb_build_object('section', k.section)
  from pg_temp.product_requirements_tracked k
  join public.demo_import_sources s on s.tenant_id = t and s.import_batch_id = v_batch and s.source_pointer = '/' || k.section;

  return jsonb_build_object(
    'changed', true,
    'tables', v_tables,
    'records', (select count(*) from pg_temp.product_requirements_tracked),
    'read', v_read
  );
end;
$seed$;

-- ---------------------------------------------------------------------------------------------
-- The delta assessments, under their own dataset `products-assessment-v1`: for each program named,
-- the variant's SSP published as the product seeded it, then the delta assessment planned through
-- the command as the account. It runs after the products scenario and once a workspace.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.seed_product_delta_assessments(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_entry jsonb; v_program public.programs; v_system public.systems; v_plan jsonb;
  v_job uuid; v_batch uuid; v_source uuid; v_hash text; v_tables jsonb := '{}'; v_read jsonb := '{}'; v_records integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-product-assessments', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'assessmentDatasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the delta assessments.');
  end if;
  v_job := pg_temp.sid(t, 'ingestion_jobs/product-assessments');
  v_batch := pg_temp.sid(t, 'demo_import_batches/assessments');
  v_source := pg_temp.sid(t, 'demo_import_sources/deltaAssessments');
  v_hash := encode(extensions.digest((p->'deltaAssessments')::text, 'sha256'), 'hex');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Delta assessments demo seed', 'urn:program-assurance:demo:' || (p->>'assessmentDatasetId'), 'completed', now(), now(),
      'Planned delta assessments for the programs of the products scenario (scripts/demo/products-scenario.mjs).');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'assessmentDatasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-scenario.mjs'), '{}'::jsonb);
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
    values (v_source, t, v_batch, '/deltaAssessments', v_hash, p->'deltaAssessments');
  for v_entry in select value from jsonb_array_elements(p->'deltaAssessments') loop
    select * into v_program from public.programs where tenant_id = t and code = v_entry->>'program';
    select * into v_system from public.systems
      where tenant_id = t and program_id = v_program.id and product_configuration_id is not null order by code limit 1;
    if v_system.id is null then
      raise exception 'Program % has no variant in this workspace. The products scenario writes it first.', v_entry->>'program';
    end if;
    update public.ssp_revisions set state = 'published'
      where tenant_id = t and system_id = v_system.id and state = 'draft' and version_number = 1;
    perform set_config('request.jwt.claims', v_claims, true);
    v_plan := public.plan_delta_assessment(t, v_system.id,
      pg_temp.sid(t, 'assessment_campaigns/delta/' || (v_entry->>'program')), v_entry->>'title');
    perform set_config('request.jwt.claims', '', true);
    v_read := v_read || jsonb_build_object(v_entry->>'program', v_plan - 'campaignId' - 'planRevisionId' - 'sspRevisionId');
    insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
    select pg_temp.sid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'assessmentDatasetId',
      k.destination_table, k.destination_id, k.destination_table || '/' || k.destination_id, '/deltaAssessments', v_hash, v_source,
      jsonb_build_object('section', 'deltaAssessments')
    from (
      select 'ssp_revisions' as destination_table, r.id as destination_id from public.ssp_revisions r
        where r.tenant_id = t and r.id = (v_plan->>'sspRevisionId')::uuid
      union all select 'assessment_campaigns', (v_plan->>'campaignId')::uuid
      union all select 'assessment_plan_revisions', (v_plan->>'planRevisionId')::uuid
      union all select 'assessment_objectives', o.id from public.assessment_objectives o
        where o.tenant_id = t and o.plan_revision_id = (v_plan->>'planRevisionId')::uuid
    ) k;
  end loop;
  select coalesce(jsonb_object_agg(destination_table, n), '{}'::jsonb), coalesce(sum(n), 0) into v_tables, v_records
    from (select destination_table, count(*) as n from public.demo_import_records
      where tenant_id = t and import_batch_id = v_batch group by destination_table) c;
  update public.demo_import_batches set summary = jsonb_build_object('tables', v_tables, 'read', v_read) where id = v_batch;
  return jsonb_build_object('changed', true, 'tables', v_tables, 'records', v_records, 'read', v_read);
end;
$seed$;

-- The sixth step: Customer A's overlay (products-scenario.mjs, customerOverlay), saved, given its
-- decisions and published through the overlay commands as the account, under its own dataset, then
-- put on top of the program's stack (pg_temp.stack_product_overlay), and each control it adds
-- mapped to the requirement that calls for it (pg_temp.map_product_overlay). Every decision must
-- change the baseline it lands on. A workspace that already holds the overlay is given only what it
-- lacks of its place on the stack and its mappings, recorded under the step's batch.
create function pg_temp.seed_product_overlay(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_entry jsonb := p->'customerOverlay';
  v_program uuid; v_choice public.program_reference_choices; v_count integer; v_selected uuid[];
  v_decisions jsonb; v_id uuid; v_overlay public.control_overlays;
  v_job uuid; v_batch uuid; v_source uuid; v_hash text; v_tables jsonb := '{}'; v_read jsonb; v_records integer := 0;
  v_stack jsonb; v_maps jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-product-overlay', 0));
  v_batch := pg_temp.sid(t, 'demo_import_batches/overlay');
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'overlayDatasetId') then
    -- A workspace that holds the overlay is given only its place on the program's stack and the
    -- mappings it lacks.
    select id into v_batch from public.demo_import_batches where tenant_id = t and dataset_id = p->>'overlayDatasetId';
    v_stack := pg_temp.stack_product_overlay(p, v_batch, false);
    v_maps := pg_temp.map_product_overlay(p, v_batch);
    return v_stack || jsonb_build_object(
      'changed', (v_stack->>'changed')::boolean or (v_maps->>'changed')::boolean,
      'maps', v_maps, 'records', (v_maps->>'records')::integer);
  end if;
  select id into v_program from public.programs where tenant_id = t and code = v_entry->>'program';
  if v_program is null then
    raise exception 'Program % is not in this workspace. The products scenario writes it first.', v_entry->>'program';
  end if;
  select count(*) into v_count from public.program_reference_choices where tenant_id = t and program_id = v_program;
  if v_count <> 1 then
    raise exception '% has % control baselines; the customer overlay is written against one.', v_entry->>'program', v_count;
  end if;
  select * into v_choice from public.program_reference_choices where tenant_id = t and program_id = v_program;
  if exists (select 1 from public.control_overlays where tenant_id = t and code = v_entry->>'code') then
    raise exception 'The workspace already has an overlay coded %; the scenario does not overwrite it.', v_entry->>'code';
  end if;
  select jsonb_agg(jsonb_build_object('controlId', k.id, 'action', d.value->>1, 'rationale', d.value->>2) order by d.n)
    into v_decisions
    from jsonb_array_elements(v_entry->'decisions') with ordinality d(value, n)
    join public.controls k on k.catalog_revision_id = v_choice.catalog_revision_id and k.code = d.value->>0;
  if jsonb_array_length(coalesce(v_decisions, '[]'::jsonb)) <> jsonb_array_length(v_entry->'decisions') then
    raise exception 'The customer overlay names a control the program''s catalog edition does not hold.';
  end if;
  select coalesce(array_agg(control_id), '{}') into v_selected from public.selected_controls
    where profile_resolution_id = v_choice.profile_resolution_id;
  if exists (select 1 from jsonb_array_elements(v_decisions) d
      where (d.value->>'action' = 'include') = ((d.value->>'controlId')::uuid = any(v_selected))) then
    raise exception 'A decision of the customer overlay changes nothing on %''s control baseline.', v_entry->>'program';
  end if;

  v_id := pg_temp.sid(t, 'control_overlays/' || (v_entry->>'code'));
  perform set_config('request.jwt.claims', v_claims, true);
  v_overlay := public.save_control_overlay(t, v_id, null, jsonb_build_object('code', v_entry->>'code',
    'title', v_entry->>'title', 'description', v_entry->>'description', 'catalogRevisionId', v_choice.catalog_revision_id));
  v_overlay := public.set_control_overlay_decisions(t, v_id, v_overlay.revision, v_decisions, '[]'::jsonb);
  v_overlay := public.publish_control_overlay(t, v_id, v_overlay.revision);
  perform set_config('request.jwt.claims', '', true);
  v_read := jsonb_build_object(
    'program', v_entry->>'program',
    'baseline', cardinality(v_selected),
    'adds', (select count(*) from jsonb_array_elements(v_decisions) d where d.value->>'action' = 'include'),
    'removes', (select count(*) from jsonb_array_elements(v_decisions) d where d.value->>'action' = 'exclude'),
    'applied', false);
  v_read := v_read || jsonb_build_object('wouldBe', (v_read->>'baseline')::integer + (v_read->>'adds')::integer - (v_read->>'removes')::integer);

  v_job := pg_temp.sid(t, 'ingestion_jobs/product-overlay');
  v_batch := pg_temp.sid(t, 'demo_import_batches/overlay');
  v_source := pg_temp.sid(t, 'demo_import_sources/customerOverlay');
  v_hash := encode(extensions.digest(v_entry::text, 'sha256'), 'hex');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Customer overlay demo seed', 'urn:program-assurance:demo:' || (p->>'overlayDatasetId'), 'completed', now(), now(),
      'Customer A''s overlay, in the library and on its program''s stack (scripts/demo/products-scenario.mjs).');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'overlayDatasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/products-scenario.mjs'), '{}'::jsonb);
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
    values (v_source, t, v_batch, '/customerOverlay', v_hash, v_entry);
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.sid(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'overlayDatasetId',
    k.destination_table, k.destination_id, k.source_key, '/customerOverlay', v_hash, v_source, jsonb_build_object('section', 'customerOverlay')
  from (
    select 'control_overlays' as destination_table, v_overlay.id as destination_id, 'control_overlays/' || v_overlay.code as source_key
    union all select 'control_overlay_decisions', d.id, 'control_overlay_decisions/' || v_overlay.code || '/' || k.code
      from public.control_overlay_decisions d join public.controls k on k.id = d.control_id where d.overlay_id = v_overlay.id
  ) k;
  select coalesce(jsonb_object_agg(destination_table, n), '{}'::jsonb), coalesce(sum(n), 0) into v_tables, v_records
    from (select destination_table, count(*) as n from public.demo_import_records
      where tenant_id = t and import_batch_id = v_batch group by destination_table) c;
  update public.demo_import_batches set summary = jsonb_build_object('tables', v_tables, 'read', v_read) where id = v_batch;
  v_stack := pg_temp.stack_product_overlay(p, v_batch, true);
  v_maps := pg_temp.map_product_overlay(p, v_batch);
  return jsonb_build_object('changed', true, 'tables', (select summary->'tables' from public.demo_import_batches where id = v_batch),
    'records', v_records + (v_maps->>'records')::integer, 'read', v_stack->'read', 'stacked', v_stack->'stacked', 'stack', v_stack->'stack', 'maps', v_maps);
end;
$seed$;

-- Each control the overlay adds, mapped to the requirement of Customer A's document its decision
-- cites (products-scenario.mjs, overlayRequirementMaps), as the requirements step writes its
-- mappings: a maps_to link on the requirement's latest revision, written by the seed itself. A
-- mapping the requirement already holds is left as it is. Each mapping is listed under the step's
-- batch, from its own source, and the batch's summary counts them.
create function pg_temp.map_product_overlay(p jsonb, p_batch uuid) returns jsonb language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_entry jsonb := p->'customerOverlay';
  v_source uuid := pg_temp.sid(t, 'demo_import_sources/customerOverlay/maps');
  v_hash text := encode(extensions.digest((p->'overlayMaps')::text, 'sha256'), 'hex');
  v_program uuid; v_catalog uuid; v_map jsonb; v_control uuid; v_revision uuid; v_id uuid;
  v_mapped jsonb := '[]'; v_held jsonb := '[]';
begin
  -- Written by the seed itself, with no session, as the requirements step writes its mappings.
  perform set_config('request.jwt.claims', '', true);
  select id into v_program from public.programs where tenant_id = t and code = v_entry->>'program';
  select c.catalog_revision_id into v_catalog from public.program_reference_choices c
    where c.tenant_id = t and c.program_id = v_program order by c.id limit 1;
  for v_map in select value from jsonb_array_elements(p->'overlayMaps') loop
    select k.id into v_control from public.controls k where k.catalog_revision_id = v_catalog and k.code = v_map->>0;
    select v.id into v_revision from public.engineering_requirements q
      join public.requirement_sources s on s.tenant_id = q.tenant_id and s.id = q.source_id
      join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
      where q.tenant_id = t and q.program_id = v_program and s.code = p->>'overlayDocument' and q.source_reference = v_map->>1
      order by v.version_number desc limit 1;
    if v_control is null or v_revision is null then
      raise exception '% holds no requirement % of % to map %.', v_entry->>'program', v_map->>1, p->>'overlayDocument', v_map->>0;
    end if;
    if exists (select 1 from public.requirement_control_links l
        where l.tenant_id = t and l.requirement_revision_id = v_revision and l.control_id = v_control) then
      v_held := v_held || jsonb_build_array(v_map->>0);
      continue;
    end if;
    v_id := pg_temp.sid(t, 'requirement_control_links/overlay/' || (v_map->>1) || '/' || (v_map->>0));
    insert into public.requirement_control_links (id, tenant_id, requirement_revision_id, control_id, relationship_type, rationale)
      values (v_id, t, v_revision, v_control, 'maps_to', p->>'overlayMapRationale');
    insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
      values (v_source, t, p_batch, '/customerOverlay/maps', v_hash, p->'overlayMaps')
      on conflict (id) do nothing;
    insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
      values (pg_temp.sid(t, 'demo_import_records/requirement_control_links/' || v_id), t, p_batch, p->>'overlayDatasetId',
        'requirement_control_links', v_id, 'requirement_control_links/overlay/' || (v_map->>1) || '/' || (v_map->>0),
        '/customerOverlay/maps', v_hash, v_source,
        jsonb_build_object('section', 'customerOverlay/maps', 'requirement', v_map->>1, 'control', v_map->>0));
    v_mapped := v_mapped || jsonb_build_array((v_map->>0) || ' to ' || (v_map->>1));
  end loop;
  if jsonb_array_length(v_mapped) > 0 then
    update public.demo_import_batches set summary = summary || jsonb_build_object(
        'maps', coalesce(summary->'maps', '[]'::jsonb) || v_mapped,
        'tables', coalesce(summary->'tables', '{}'::jsonb) || jsonb_build_object('requirement_control_links',
          coalesce((summary->'tables'->>'requirement_control_links')::integer, 0) + jsonb_array_length(v_mapped)))
      where id = p_batch;
  end if;
  return jsonb_build_object('changed', jsonb_array_length(v_mapped) > 0, 'mapped', v_mapped, 'held', v_held,
    'records', jsonb_array_length(v_mapped));
end $$;

-- Customer A's overlay on top of the program's stack, through set_program_baseline_overlays as the
-- account: the overlays the stack holds, bottom up, then this one, with a request id of its own on
-- each run. A stack that already holds the overlay is left as it is. The command authors the
-- program's tailoring again on top and moves the systems that adopt the old top; every SSP revision
-- keeps the baseline it was pinned to. Its answer is kept in the step's batch summary (`stack`), and
-- `read.applied` says the overlay is on the stack.
create function pg_temp.stack_product_overlay(p jsonb, p_batch uuid, p_created boolean) returns jsonb language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_entry jsonb := p->'customerOverlay';
  v_claims text := jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text;
  v_program uuid; v_choice public.program_reference_choices; v_overlay uuid; v_overlays jsonb := '[]';
  v_cursor uuid; v_layer uuid; v_stack jsonb; v_summary jsonb;
begin
  select id into v_program from public.programs where tenant_id = t and code = v_entry->>'program';
  select id into v_overlay from public.control_overlays where tenant_id = t and code = v_entry->>'code' and state = 'published';
  if v_program is null or v_overlay is null then
    raise exception 'Program % or the published overlay % is not in this workspace.', v_entry->>'program', v_entry->>'code';
  end if;
  select * into v_choice from public.program_reference_choices where tenant_id = t and program_id = v_program;
  -- The overlays the stack holds, bottom up: the chain walked down from its top.
  v_cursor := v_choice.profile_resolution_id;
  while v_cursor is not null loop
    select a.overlay_id into v_layer from public.profile_overlay_applications a where a.profile_resolution_id = v_cursor;
    if found then v_overlays := jsonb_build_array(v_layer) || v_overlays; end if;
    select r.base_profile_resolution_id into v_cursor from public.profile_resolutions r where r.id = v_cursor;
  end loop;
  if v_overlays ? v_overlay::text then
    select summary into v_summary from public.demo_import_batches where id = p_batch;
    return jsonb_build_object('changed', p_created, 'stacked', false, 'reason', 'Customer A''s stack already holds the overlay.',
      'read', v_summary->'read', 'stack', v_summary->'stack');
  end if;
  perform set_config('request.jwt.claims', v_claims, true);
  v_stack := public.set_program_baseline_overlays(t, v_choice.id, v_choice.revision, gen_random_uuid(),
    v_overlays || jsonb_build_array(v_overlay));
  perform set_config('request.jwt.claims', '', true);
  v_stack := v_stack - 'choiceId' - 'programId' - 'profileResolutionId' - 'previousProfileResolutionId' - 'overlayIds';
  update public.demo_import_batches set summary = summary
      || jsonb_build_object('read', coalesce(summary->'read', '{}'::jsonb) || jsonb_build_object('applied', true))
      || jsonb_build_object('stack', v_stack)
    where id = p_batch returning summary into v_summary;
  return jsonb_build_object('changed', true, 'stacked', true, 'read', v_summary->'read', 'stack', v_stack);
end $$;
