-- The shared components seed's transaction body, loaded by scripts/seed-demo-shared.mjs. It defines
-- temporary objects only; the script calls pg_temp.seed_shared(payload), or
-- pg_temp.revert_shared(payload), inside its own transaction and commits (--apply) or rolls back.
--
-- The seed writes two kinds of thing. What it adds (a component assessment and its determinations;
-- an operational issue with its observation and assessment subject, the offer of it to the
-- component's owner with its item, and the activity event an offer records; an SBOM and its
-- components, a CVE record with the SBOM component it affects, the controls it bears on and the
-- issue that is a program's row for it, and a planned cyber test campaign; the next version of a
-- component set, a draft with every component and claim of the version before, what it changes
-- and the controls that affects, and its SBOM with the CVE's state on it; and a remediation item
-- with its commitment, its milestones and the issue and observation it answers) is listed in
-- demo_import_records under the dataset `shared-components-v1`. What it changes in a
-- record another step wrote (a component set's owner and business line, the library component a
-- system component is built from) is kept in its batch's summary with the values it found
-- (`updated`), so the revert puts them back. It runs once a workspace: a workspace that already
-- holds the dataset's batch changes nothing, and a record that already says something else stops
-- the run rather than being overwritten.

create temp table shared_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;

-- A stable identity for a scenario record: the same workspace and key give the same id.
create function pg_temp.shared_id(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/shared-components-v1/' || p_key)::uuid
$$;

-- One of a component set's components, in its latest published version: the set by code, the
-- component by name. Refuses a set that is not there, has no published version, or does not hold
-- exactly one component of that name.
create function pg_temp.shared_component(p_tenant uuid, p_definition text, p_name text,
  out definition_id uuid, out revision_id uuid, out version_number integer, out defined_component_id uuid)
language plpgsql as $$
declare v_count integer;
begin
  select d.id into definition_id from public.component_definitions d where d.tenant_id = p_tenant and d.code = p_definition;
  if definition_id is null then
    raise exception 'The component set % is not in this workspace. Run npm run seed:demo-products first.', p_definition;
  end if;
  select r.id, r.version_number into revision_id, version_number
    from public.component_definition_revisions r
    where r.tenant_id = p_tenant and r.component_definition_id = definition_id and r.state = 'published'
    order by r.version_number desc limit 1;
  if revision_id is null then
    raise exception 'The component set % has no published version to assess.', p_definition;
  end if;
  select count(*), min(c.id::text)::uuid into v_count, defined_component_id
    from public.defined_components c
    where c.tenant_id = p_tenant and c.component_definition_revision_id = revision_id and c.name = p_name;
  if v_count <> 1 then
    raise exception 'Expected one component named % in % version %, found %.', p_name, p_definition, version_number, v_count;
  end if;
end $$;

-- A control by its code, in the one published catalog that holds it.
create function pg_temp.shared_control(p_tenant uuid, p_code text) returns uuid language plpgsql as $$
declare v_count integer; v_control uuid;
begin
  select count(*), min(k.id::text)::uuid into v_count, v_control from public.controls k
    join public.catalog_revisions r on r.id = k.catalog_revision_id and r.state = 'published'
    where k.code = p_code and (k.tenant_id is null or k.tenant_id = p_tenant);
  if v_count <> 1 then
    raise exception 'Expected one control coded % in a published catalog, found %.', p_code, v_count;
  end if;
  return v_control;
end $$;

-- What the existing reads answer for the programs the scenario watches, as the account: each
-- program's control status, each SSP revision's register and each variant's delta, by its totals
-- and a hash of its whole answer, so a change the totals do not show is still seen. A program's
-- control status also says how much of it is inherited from the components its elements are built
-- from: the controls that hold an inherited objective, and those objectives.
create function pg_temp.shared_existing_reads(p jsonb) returns jsonb language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_out jsonb := '{}'; v_code text; v_program uuid; v_system record; v_ssp record; v_answer jsonb;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
  for v_code in select value from jsonb_array_elements_text(p->'watchedPrograms') loop
    select g.id into v_program from public.programs g where g.tenant_id = t and g.code = v_code;
    if v_program is null then continue; end if;
    v_answer := public.program_control_status(v_program);
    v_out := v_out || jsonb_build_object(v_code || ' program_control_status',
      jsonb_build_object('totals', v_answer->'totals', 'md5', md5(v_answer::text),
        'inherited', (select jsonb_build_object('controls', count(*), 'objectives', coalesce(sum((c->>'objectives_inherited')::integer), 0))
          from jsonb_array_elements(v_answer->'controls') c where (c->>'objectives_inherited')::integer > 0)));
    for v_system in select s.id, s.code, s.product_configuration_id from public.systems s
      where s.tenant_id = t and s.program_id = v_program and s.is_authorization_boundary order by s.code loop
      for v_ssp in select r.id, r.version_number, r.state from public.ssp_revisions r
        where r.tenant_id = t and r.system_id = v_system.id order by r.version_number loop
        v_answer := public.ssp_control_rows(v_ssp.id);
        v_out := v_out || jsonb_build_object(
          format('%s %s SSP %s (%s) ssp_control_rows', v_code, v_system.code, v_ssp.version_number, v_ssp.state),
          jsonb_build_object('totals', jsonb_build_object(
            'controls', jsonb_array_length(v_answer->'rows'),
            'implemented', (select count(*) from jsonb_array_elements(v_answer->'rows') r where r->>'implementation_id' is not null),
            'narratives', (select count(*) from jsonb_array_elements(v_answer->'rows') r where (r->>'narrative')::boolean),
            'contributions', (select coalesce(sum((r->>'contributions')::integer), 0) from jsonb_array_elements(v_answer->'rows') r),
            'requirements', v_answer->'requirements',
            'evidence', v_answer->'evidence'), 'md5', md5(v_answer::text)));
      end loop;
      if v_system.product_configuration_id is not null then
        v_answer := public.variant_control_delta(t, v_system.id);
        v_out := v_out || jsonb_build_object(format('%s %s variant_control_delta', v_code, v_system.code),
          jsonb_build_object('totals', v_answer->'totals', 'elements', v_answer->'elements', 'md5', md5(v_answer::text)));
      end if;
    end loop;
  end loop;
  perform set_config('request.jwt.claims', '', true);
  return v_out;
end $$;

-- What the seed is meant to change, counted the same way before and after: each watched program's
-- open operational issues (all, by severity, and those nobody owns) and its assessment campaigns
-- by kind and its remediation items with their milestones, the Review queue's rows by kind, the
-- standing SBOMs with the components they list, the CVE records with what they affect and who
-- holds an open issue for them, and the versions of the scenario's component sets with the changes
-- recorded on them, as the account reads them.
create function pg_temp.shared_effects(p jsonb) returns jsonb language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_out jsonb := '{}'; v_code text;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
  for v_code in select value from jsonb_array_elements_text(p->'watchedPrograms') loop
    v_out := v_out || jsonb_build_object(v_code || ' open operational issues', (
      select jsonb_build_object('open', count(*),
        'critical', count(*) filter (where i.severity = 'critical'), 'high', count(*) filter (where i.severity = 'high'),
        'moderate', count(*) filter (where i.severity = 'moderate'), 'low', count(*) filter (where i.severity = 'low'),
        'no_owner', count(*) filter (where i.owner_party_id is null))
      from public.operational_issues i join public.programs g on g.tenant_id = i.tenant_id and g.id = i.program_id
      where i.tenant_id = t and g.code = v_code and i.status not in ('resolved', 'closed')));
    v_out := v_out || jsonb_build_object(v_code || ' assessment campaigns', (
      select jsonb_build_object('campaigns', coalesce(sum(k.n), 0), 'kinds', coalesce(jsonb_object_agg(k.kind, k.n), '{}'::jsonb))
      from (select c.kind, count(*) as n from public.assessment_campaigns c
        join public.programs g on g.tenant_id = c.tenant_id and g.id = c.program_id
        where c.tenant_id = t and g.code = v_code group by c.kind) k));
    v_out := v_out || jsonb_build_object(v_code || ' remediation items', (
      select jsonb_build_object('items', count(*),
        'open', count(*) filter (where i.status not in ('completed', 'risk_accepted', 'cancelled')),
        'milestones', coalesce(sum((select count(*) from public.poam_milestones m
          join public.poam_item_revisions r on r.tenant_id = m.tenant_id and r.id = m.poam_item_revision_id
          where r.tenant_id = t and r.poam_item_id = i.id)), 0))
      from public.poam_items i
      join public.poam_documents d on d.tenant_id = i.tenant_id and d.id = i.poam_document_id
      join public.programs g on g.tenant_id = d.tenant_id and g.id = d.program_id
      where i.tenant_id = t and g.code = v_code));
  end loop;
  v_out := v_out || jsonb_build_object('component set versions', (
    select jsonb_build_object('versions', count(*),
      'published', count(*) filter (where r.state = 'published'), 'drafts', count(*) filter (where r.state = 'draft'),
      'changes', (select count(*) from public.component_version_changes ch where ch.tenant_id = t),
      'affected_controls', (select count(*) from public.component_version_change_controls x where x.tenant_id = t))
    from public.component_definition_revisions r
    join public.component_definitions d on d.tenant_id = r.tenant_id and d.id = r.component_definition_id
    where r.tenant_id = t and d.code in (select s.value->>'definition' from jsonb_array_elements(p->'sharedComponents') s)));
  v_out := v_out || jsonb_build_object('standing SBOMs', (
    select jsonb_build_object('sboms', count(distinct r.sbom_id), 'components', count(*))
    from public.sbom_component_rows r where r.tenant_id = t));
  v_out := v_out || jsonb_build_object('CVE records', (
    select jsonb_build_object('records', count(*),
      'sbom_components', coalesce(sum(r.sbom_components_affected), 0),
      'components', coalesce(sum(r.components_affected), 0),
      'programs_open', coalesce(sum(r.programs_open), 0), 'issues_open', coalesce(sum(r.issues_open), 0))
    from public.vulnerability_rows r where r.tenant_id = t));
  v_out := v_out || jsonb_build_object('review queue', (
    select jsonb_build_object('rows', coalesce(sum(k.n), 0), 'kinds', coalesce(jsonb_object_agg(k.kind, k.n), '{}'::jsonb))
    from (select q.kind, count(*) as n from public.review_queue_rows q where q.tenant_id = t group by q.kind) k));
  perform set_config('request.jwt.claims', '', true);
  return v_out;
end $$;

-- What the reads of this slice answer for each shared component once the seed has written, as the
-- account: where the component version stands, who uses it, its row of the register, and what each
-- system it is used in takes from above.
create function pg_temp.shared_new_reads(p jsonb) returns jsonb language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_out jsonb := '{}'; v_set jsonb; v_item jsonb; v_use jsonb; v_c record; v_answer jsonb; v_system uuid; v_entry jsonb;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
  for v_set in select value from jsonb_array_elements(p->'sharedComponents') loop
    for v_item in select value from jsonb_array_elements(v_set->'components') loop
      select * into v_c from pg_temp.shared_component(t, v_set->>'definition', v_item->>'name');
      v_answer := public.component_control_status(v_c.defined_component_id);
      v_entry := jsonb_build_object('component_control_status', jsonb_build_object(
        'component', v_answer->'component', 'totals', v_answer->'totals', 'assessments', v_answer->'assessments'));
      v_answer := public.component_consumers(v_c.defined_component_id);
      v_entry := v_entry || jsonb_build_object('component_consumers', jsonb_build_object(
        'totals', v_answer->'totals', 'latest', v_answer->'latest',
        'products', (select coalesce(jsonb_agg(jsonb_build_object(
            'product', x->>'product_code', 'version', x->'product_version', 'current', x->'current',
            'element', x->>'element_code', 'configurations', (select jsonb_agg(c->>'code') from jsonb_array_elements(x->'configurations') c),
            'took', x->'version', 'behind', x->'behind')), '[]'::jsonb) from jsonb_array_elements(v_answer->'products') x),
        'systems', (select coalesce(jsonb_agg(jsonb_build_object(
            'program', x->>'program_code', 'system', x->>'system_code', 'element', x->>'element_code',
            'component', x->>'component_code', 'took', x->'version', 'behind', x->'behind',
            'change', x->'change', 'change_kinds', x->'change_kinds', 'pin', x->'pin'->'version')), '[]'::jsonb)
          from jsonb_array_elements(v_answer->'systems') x)));
      v_entry := v_entry || jsonb_build_object('component_rows', (
        select to_jsonb(r) - 'id' - 'tenant_id' - 'created_at' - 'updated_at' - 'created_by' - 'updated_by'
        from public.component_rows r where r.id = v_c.defined_component_id));
      for v_use in select value from jsonb_array_elements(v_item->'uses') loop
        select s.id into v_system from public.systems s join public.programs g on g.id = s.program_id
          where s.tenant_id = t and g.code = v_use->>'program' and s.code = v_use->>'system' and s.is_authorization_boundary;
        v_answer := public.system_upstream(v_system);
        v_entry := v_entry || jsonb_build_object('system_upstream ' || (v_use->>'system'), jsonb_build_object(
          'product', v_answer->'product', 'totals', v_answer->'totals',
          'components', (select coalesce(jsonb_agg(jsonb_build_object(
              'component', x->>'code', 'element', x->>'element_code', 'from', x->>'definition_code',
              'name', x->>'component_name', 'took', x->'version', 'latest', x->'latest_version',
              'behind', x->'behind', 'change', x->'change', 'pin', x->'pin'->'version', 'standing', x->'standing')), '[]'::jsonb)
            from jsonb_array_elements(v_answer->'components') x)));
      end loop;
      v_entry := v_entry || jsonb_build_object('offers', jsonb_build_object(
        'component_offer_rows', (select coalesce(jsonb_agg(jsonb_build_object(
            'title', r.title, 'kind', r.kind, 'state', r.state, 'items', r.items,
            'component', r.component_name, 'version', r.version, 'set', r.definition_code,
            'program', r.program_code, 'system', r.system_code, 'system_component', r.system_component_code,
            'offered_by', r.offered_by_name, 'offered_at', r.offered_at,
            'waiting_on', r.waiting_on_name, 'reviewed_by', r.reviewed_by_name) order by r.offered_at, r.id), '[]'::jsonb)
          from public.component_offer_rows r where r.tenant_id = t and r.defined_component_id = v_c.defined_component_id),
        'review_queue_rows', (select coalesce(jsonb_agg(jsonb_build_object(
            'kind', q.kind, 'name', q.name, 'component', q.parent_name, 'version', q.version_number,
            'program', q.program_name, 'waiting_on', q.waiting_on_name, 'requested_by', q.requested_by_name,
            'waiting_since', q.waiting_since) order by q.waiting_since, q.id), '[]'::jsonb)
          from public.review_queue_rows q
          where q.tenant_id = t and q.kind = 'component_offer' and q.parent_id = v_c.defined_component_id),
        'component_consumers', (select jsonb_build_object('offers_open', x->'offers_open', 'findings_open', x->'findings_open',
            'findings', jsonb_array_length(x->'findings'))
          from public.component_consumers(v_c.defined_component_id) x)));
      -- The CVEs on the component version and who has answered them, and the count each read
      -- that names the component gained.
      v_answer := public.component_vulnerabilities(v_c.defined_component_id);
      v_entry := v_entry || jsonb_build_object('vulnerabilities', jsonb_build_object(
        'component_vulnerabilities', jsonb_build_object(
          'sbom', case when v_answer->'sbom' = 'null'::jsonb then null else jsonb_build_object(
            'title', v_answer->'sbom'->>'title', 'format', v_answer->'sbom'->>'format',
            'spec_version', v_answer->'sbom'->>'spec_version', 'generated_on', v_answer->'sbom'->>'generated_on',
            'components', v_answer->'sbom'->'components') end,
          'totals', v_answer->'totals',
          'vulnerabilities', (select coalesce(jsonb_agg(jsonb_build_object(
              'cve', x->>'cve_id', 'severity', x->>'severity', 'cvss', x->'cvss_score', 'fixed_in', x->>'fixed_in',
              'known_exploited', x->'known_exploited',
              'components', (select jsonb_agg(concat_ws(' ', c->>'name', c->>'version')) from jsonb_array_elements(x->'components') c),
              'controls', (select coalesce(jsonb_agg(k->>'code'), '[]'::jsonb) from jsonb_array_elements(x->'controls') k),
              'consumers', (select jsonb_object_agg(c->>'program_code', case when (c->>'answered')::boolean
                  then format('%s (%s)', c->'issue'->>'title', c->'issue'->>'status') else 'no issue' end)
                from jsonb_array_elements(x->'consumers') c))), '[]'::jsonb)
            from jsonb_array_elements(v_answer->'vulnerabilities') x)),
        'vulnerabilities_open', jsonb_build_object(
          'component_rows', (select r.vulnerabilities_open from public.component_rows r where r.id = v_c.defined_component_id),
          'component_consumers', (select jsonb_build_object('component', x->'vulnerabilities_open',
              'products', (select coalesce(jsonb_object_agg(format('%s v%s %s', y->>'product_code', y->>'product_version', y->>'element_code'), y->'vulnerabilities_open'), '{}'::jsonb)
                from jsonb_array_elements(x->'products') y),
              'systems', (select coalesce(jsonb_object_agg(format('%s %s', y->>'program_code', coalesce(y->>'component_code', y->>'element_code')), y->'vulnerabilities_open'), '{}'::jsonb)
                from jsonb_array_elements(x->'systems') y))
            from public.component_consumers(v_c.defined_component_id) x),
          'system_upstream', (select coalesce(jsonb_object_agg(u->>'system', (
              select x->'vulnerabilities_open' from public.system_upstream((
                select s.id from public.systems s join public.programs g on g.id = s.program_id
                where s.tenant_id = t and g.code = u->>'program' and s.code = u->>'system' and s.is_authorization_boundary)) x)), '{}'::jsonb)
            from jsonb_array_elements(v_item->'uses') u))));
      v_out := v_out || jsonb_build_object((v_set->>'definition') || ' ' || (v_item->>'name'), v_entry);
    end loop;
  end loop;
  -- The next version: where each component it changes stands (what it carries, what is to review),
  -- what its SBOM says, and what Take version would show each system built from the version before.
  for v_set in select value from jsonb_array_elements(coalesce(p->'sharedVersions', '[]'::jsonb)) loop
    v_entry := '{}';
    for v_item in select value from jsonb_array_elements(v_set->'changes') loop
      select c.id as defined_component_id into v_c from public.defined_components c
        join public.component_definition_revisions r on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
        join public.component_definitions d on d.tenant_id = r.tenant_id and d.id = r.component_definition_id
        where c.tenant_id = t and d.code = v_set->>'definition' and r.version_number = (v_set->>'version')::integer
          and c.name = v_item->>'component';
      v_answer := public.component_control_status(v_c.defined_component_id);
      v_entry := v_entry || jsonb_build_object(v_item->>'component', jsonb_build_object(
        'component_control_status', jsonb_build_object(
          'version', v_answer->'component'->'version', 'state', v_answer->'component'->>'state', 'totals', v_answer->'totals',
          'change', jsonb_build_object('kinds', v_answer->'change'->'kinds',
            'controls', (select coalesce(jsonb_agg(k->>'code'), '[]'::jsonb) from jsonb_array_elements(v_answer->'change'->'controls') k)),
          'assessments', (select coalesce(jsonb_agg(jsonb_build_object(
              'title', a->>'title', 'version', a->'version', 'determinations', a->'determinations')), '[]'::jsonb)
            from jsonb_array_elements(v_answer->'assessments') a)),
        'component_vulnerabilities', (select jsonb_build_object('sbom', x->'sbom'->>'title', 'totals', x->'totals')
          from public.component_vulnerabilities(v_c.defined_component_id) x),
        'component_version_review', (select coalesce(jsonb_object_agg(
            format('%s %s', y->>'program_code', y->>'component_code'), (
              select jsonb_build_object('taken', w->'taken'->'version', 'latest', w->'latest'->'version',
                'behind', w->'behind', 'newer_drafts', w->'newer_drafts', 'blocked', w->'blocked'->>'code',
                'affected_controls', jsonb_array_length(w->'affected_controls'),
                'determinations', w->'determinations',
                'vulnerabilities_fixed', (select coalesce(jsonb_agg(f->>'cve_id'), '[]'::jsonb) from jsonb_array_elements(w->'vulnerabilities_fixed') f))
              from public.component_version_review((y->>'system_component_id')::uuid) w)), '{}'::jsonb)
          from jsonb_array_elements(public.component_consumers(v_c.defined_component_id)->'systems') y
          where y->>'system_component_id' is not null)));
    end loop;
    v_out := v_out || jsonb_build_object(format('%s version %s', v_set->>'definition', v_set->>'version'), v_entry);
  end loop;
  perform set_config('request.jwt.claims', '', true);
  return v_out;
end $$;

create function pg_temp.seed_shared(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_account uuid := (p->>'accountUserId')::uuid;
  v_set jsonb; v_item jsonb; v_use jsonb; v_c record;
  v_definition public.component_definitions; v_owner uuid; v_line uuid; v_assessor uuid; v_count integer;
  v_assessment uuid; v_source public.product_assessments; v_element public.product_elements;
  v_component public.system_components; v_counts jsonb; v_carried jsonb := '{}';
  v_updated jsonb := '[]'; v_before jsonb; v_after jsonb; v_changed text[];
  v_job uuid; v_batch uuid; v_tables jsonb;
  v_finding jsonb; v_program uuid; v_plan uuid; v_person uuid; v_owner_name text; v_definition_name text;
  v_subject uuid; v_observation uuid; v_issue uuid; v_offer uuid; v_offered jsonb := '{}';
  v_effects_before jsonb; v_effects_after jsonb;
  v_sbom jsonb; v_sbom_id uuid; v_part jsonb; v_cve jsonb; v_cve_id uuid; v_link jsonb; v_target uuid;
  v_code text; v_control uuid; v_link_id uuid; v_test jsonb; v_campaign uuid; v_recorded jsonb := '{}';
  v_version jsonb; v_number integer; v_previous public.component_definition_revisions; v_revision uuid; v_change jsonb;
  v_base text; v_remedy jsonb; v_document uuid; v_poam uuid; v_commitment uuid; v_milestone jsonb; v_n bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-shared', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the shared components scenario.');
  end if;
  v_before := pg_temp.shared_existing_reads(p);
  v_effects_before := pg_temp.shared_effects(p);

  for v_set in select value from jsonb_array_elements(p->'sharedComponents') loop
    -- The component set: who answers for it, and the business line it belongs to. A set that
    -- already names another owner or line is left alone, and stops the run.
    select * into v_definition from public.component_definitions d where d.tenant_id = t and d.code = v_set->>'definition';
    if v_definition.id is null then
      raise exception 'The component set % is not in this workspace. Run npm run seed:demo-products first.', v_set->>'definition';
    end if;
    select count(*), min(a.id::text)::uuid into v_count, v_owner from public.parties a where a.tenant_id = t and a.name = v_set->>'owner';
    if v_count <> 1 then
      raise exception 'Expected one person named % to own %, found %.', v_set->>'owner', v_set->>'definition', v_count;
    end if;
    select b.id into v_line from public.business_lines b where b.tenant_id = t and b.code = v_set->>'businessLine';
    if v_line is null then
      raise exception 'The business line % is not in this workspace.', v_set->>'businessLine';
    end if;
    if v_definition.owner_party_id is distinct from v_owner or v_definition.business_line_id is distinct from v_line then
      if (v_definition.owner_party_id is not null and v_definition.owner_party_id <> v_owner)
        or (v_definition.business_line_id is not null and v_definition.business_line_id <> v_line) then
        raise exception 'The component set % already names another owner or business line; the scenario does not overwrite it.', v_set->>'definition';
      end if;
      update public.component_definitions set owner_party_id = v_owner, business_line_id = v_line where id = v_definition.id;
      v_updated := v_updated || jsonb_build_object('table', 'component_definitions', 'id', v_definition.id,
        'key', v_set->>'definition',
        'before', jsonb_build_object('owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
        'after', jsonb_build_object('owner_party_id', v_owner, 'business_line_id', v_line));
    end if;

    -- One component assessment of the set's latest published version, a draft until every
    -- determination is in.
    v_assessment := null;
    select count(*), min(a.id::text)::uuid into v_count, v_assessor from public.parties a where a.tenant_id = t and a.name = v_set->'assessment'->>'assessor';
    if v_count <> 1 then
      raise exception 'Expected one person named % to have assessed %, found %.', v_set->'assessment'->>'assessor', v_set->>'definition', v_count;
    end if;

    for v_item in select value from jsonb_array_elements(v_set->'components') loop
      select * into v_c from pg_temp.shared_component(t, v_set->>'definition', v_item->>'name');
      -- The product assessment the determinations are carried from: the latest published one of
      -- the product version named, on the element named, which is pinned to this component.
      select a.* into v_source from public.product_assessments a
        join public.product_revisions r on r.tenant_id = a.tenant_id and r.id = a.product_revision_id
        join public.products x on x.tenant_id = r.tenant_id and x.id = r.product_id
        where a.tenant_id = t and x.code = v_item->'from'->>'product'
          and r.version_number = (v_item->'from'->>'version')::integer and a.state = 'published'
        order by a.published_at desc, a.id desc limit 1;
      if v_source.id is null then
        raise exception '% version % has no published product assessment to carry determinations from.', v_item->'from'->>'product', v_item->'from'->>'version';
      end if;
      select * into v_element from public.product_elements e
        where e.tenant_id = t and e.product_revision_id = v_source.product_revision_id and e.code = v_item->'from'->>'element';
      if v_element.id is null or v_element.defined_component_id is distinct from v_c.defined_component_id then
        raise exception '%''s element % is not pinned to % of %.', v_item->'from'->>'product', v_item->'from'->>'element', v_item->>'name', v_set->>'definition';
      end if;
      select jsonb_build_object(
          'satisfied', count(*) filter (where d.determination = 'satisfied'),
          'partially_satisfied', count(*) filter (where d.determination = 'partially_satisfied'),
          'other_than_satisfied', count(*) filter (where d.determination = 'other_than_satisfied'))
        into v_counts
        from public.product_determinations d
        where d.tenant_id = t and d.product_assessment_id = v_source.id and d.product_element_id = v_element.id;
      if v_counts <> v_item->'determinations' then
        raise exception 'The product assessment recorded % on %''s %, not the % the scenario carries.', v_counts, v_item->'from'->>'product', v_item->'from'->>'element', v_item->'determinations';
      end if;
      if v_assessment is null then
        v_assessment := pg_temp.shared_id(t, 'component_assessments/' || (v_set->>'definition'));
        insert into public.component_assessments (id, tenant_id, component_definition_revision_id, profile_resolution_id, title, description, assessor_party_id, started_on, completed_on)
          values (v_assessment, t, v_c.revision_id, v_source.profile_resolution_id, v_set->'assessment'->>'title', v_set->'assessment'->>'description',
            v_assessor, (v_set->'assessment'->>'startedOn')::date, (v_set->'assessment'->>'completedOn')::date);
        insert into pg_temp.shared_tracked values ('component_assessments', v_assessment, 'component_assessments/' || (v_set->>'definition'), 'sharedComponents');
      elsif (select a.profile_resolution_id from public.component_assessments a where a.id = v_assessment) <> v_source.profile_resolution_id then
        raise exception 'The components of % were assessed against different control baselines; one component assessment cannot carry both.', v_set->>'definition';
      end if;
      insert into public.component_determinations (id, tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination, rationale, assessment_finding_id)
        select pg_temp.shared_id(t, 'component_determinations/' || (v_set->>'definition') || '/' || (v_item->>'name') || '/' || d.control_id),
          t, v_assessment, v_c.revision_id, v_c.defined_component_id, d.control_id, d.determination, d.rationale, d.assessment_finding_id
        from public.product_determinations d
        where d.tenant_id = t and d.product_assessment_id = v_source.id and d.product_element_id = v_element.id;
      insert into pg_temp.shared_tracked
        select 'component_determinations', d.id, 'component_determinations/' || d.id, 'sharedComponents'
        from public.component_determinations d
        where d.tenant_id = t and d.component_assessment_id = v_assessment and d.defined_component_id = v_c.defined_component_id;
      v_carried := v_carried || jsonb_build_object((v_set->>'definition') || ' ' || (v_item->>'name'), jsonb_build_object(
        'from', v_source.title, 'element', v_element.code, 'determinations', v_counts));

      -- Each use: the system component, by its code on the element named (the element it names
      -- or, on a fresh import, the one its inventory item gives it), is built from the component.
      -- One already built from another component is left alone, and stops the run.
      for v_use in select value from jsonb_array_elements(v_item->'uses') loop
        select c.* into v_component from public.system_components c
          join public.systems s on s.tenant_id = c.tenant_id and s.id = c.system_id
          join public.programs g on g.tenant_id = s.tenant_id and g.id = s.program_id
          left join public.system_component_element_links k on k.tenant_id = c.tenant_id and k.id = c.id
          join public.systems e on e.tenant_id = c.tenant_id and e.id = coalesce(k.system_element_id, c.system_id)
          where c.tenant_id = t and g.code = v_use->>'program' and s.code = v_use->>'system'
            and c.code = v_use->>'component' and e.code = v_use->>'element';
        if v_component.id is null then
          raise exception '%''s % holds no component % on element %. Run npm run seed:demo first.', v_use->>'program', v_use->>'system', v_use->>'component', v_use->>'element';
        end if;
        if v_component.defined_component_id is not null and v_component.defined_component_id <> v_c.defined_component_id then
          raise exception '%''s component % is already built from another library component; the scenario does not overwrite it.', v_use->>'program', v_use->>'component';
        end if;
        if v_component.defined_component_id is null then
          update public.system_components set defined_component_id = v_c.defined_component_id,
              applied_rationale = v_use->>'rationale', applied_at = now(), applied_by = v_account
            where id = v_component.id;
          v_updated := v_updated || jsonb_build_object('table', 'system_components', 'id', v_component.id,
            'key', format('%s/%s/%s', v_use->>'program', v_use->>'system', v_use->>'component'),
            'before', jsonb_build_object('defined_component_id', v_component.defined_component_id,
              'applied_rationale', v_component.applied_rationale, 'applied_at', v_component.applied_at, 'applied_by', v_component.applied_by),
            'after', jsonb_build_object('defined_component_id', v_c.defined_component_id));
        end if;
      end loop;
    end loop;
    -- Published on the day the scenario gives: the assessment and its determinations no longer change.
    update public.component_assessments set state = 'published', published_at = (v_set->'assessment'->>'publishedAt')::timestamptz
      where id = v_assessment;
  end loop;

  -- What flows up: a finding a consumer made on a shared component, and the offer of it to the
  -- component's owner, left waiting. Written as offer_to_component writes an offer (the offer, its
  -- item and the program's activity event), by the person and at the moments the scenario gives.
  for v_finding in select value from jsonb_array_elements(coalesce(p->'sharedFindings', '[]'::jsonb)) loop
    select * into v_c from pg_temp.shared_component(t, v_finding->>'definition', v_finding->>'component');
    select c.* into v_component from public.system_components c
      join public.systems s on s.tenant_id = c.tenant_id and s.id = c.system_id
      join public.programs g on g.tenant_id = s.tenant_id and g.id = s.program_id
      where c.tenant_id = t and g.code = v_finding->'use'->>'program' and s.code = v_finding->'use'->>'system'
        and c.code = v_finding->'use'->>'component';
    if v_component.id is null or v_component.defined_component_id is distinct from v_c.defined_component_id then
      raise exception '%''s component % is not built from % of %.', v_finding->'use'->>'program', v_finding->'use'->>'component', v_finding->>'component', v_finding->>'definition';
    end if;
    select s.program_id into v_program from public.systems s where s.tenant_id = t and s.id = v_component.system_id;
    -- Only a draft plan takes an assessment subject.
    select pl.id into v_plan from public.assessment_campaigns c
      join public.assessment_plan_revisions pl on pl.tenant_id = c.tenant_id and pl.campaign_id = c.id
      where c.tenant_id = t and c.program_id = v_program and c.title = v_finding->>'campaign' and pl.state = 'draft'
      order by pl.version_number desc limit 1;
    if v_plan is null then
      raise exception '%''s campaign % has no draft plan to take an assessment subject.', v_finding->'use'->>'program', v_finding->>'campaign';
    end if;
    select count(*), min(a.id::text)::uuid into v_count, v_person from public.parties a where a.tenant_id = t and a.name = v_finding->'offer'->>'offeredBy';
    if v_count <> 1 then
      raise exception 'Expected one person named % to offer %, found %.', v_finding->'offer'->>'offeredBy', v_finding->>'key', v_count;
    end if;
    if v_finding->'issue'->>'owner' is distinct from v_finding->'offer'->>'offeredBy' then
      raise exception 'The scenario names another owner for % than the person who offers it.', v_finding->>'key';
    end if;
    if exists (select 1 from public.operational_issues o where o.tenant_id = t and o.program_id = v_program and o.title = v_finding->'issue'->>'title') then
      raise exception '% already holds an operational issue titled %; the scenario does not write it twice.', v_finding->'use'->>'program', v_finding->'issue'->>'title';
    end if;
    v_subject := pg_temp.shared_id(t, 'assessment_subjects/' || (v_finding->>'key'));
    insert into public.assessment_subjects (id, tenant_id, plan_revision_id, description, component_id)
      values (v_subject, t, v_plan, v_finding->>'subject', v_component.id);
    v_observation := pg_temp.shared_id(t, 'observations/' || (v_finding->>'key'));
    insert into public.observations (id, tenant_id, program_id, subject_id, title, description, method, observed_at)
      values (v_observation, t, v_program, v_subject, v_finding->'observation'->>'title', v_finding->'observation'->>'description',
        v_finding->'observation'->>'method', (v_finding->'observation'->>'observedAt')::timestamptz);
    v_issue := pg_temp.shared_id(t, 'operational_issues/' || (v_finding->>'key'));
    insert into public.operational_issues (id, tenant_id, program_id, title, description, severity, status, opened_at, owner_party_id)
      values (v_issue, t, v_program, v_finding->'issue'->>'title', v_finding->'issue'->>'description', v_finding->'issue'->>'severity',
        'open', (v_finding->'issue'->>'openedAt')::timestamptz, v_person);
    insert into public.issue_observations (id, tenant_id, issue_id, observation_id)
      values (pg_temp.shared_id(t, 'issue_observations/' || (v_finding->>'key')), t, v_issue, v_observation);
    -- The guards refuse a component built from no library component or on a modified element.
    v_offer := pg_temp.shared_id(t, 'component_offers/' || (v_finding->>'key'));
    insert into public.component_offers (id, tenant_id, defined_component_id, program_id, system_id, system_component_id,
        kind, title, note, offered_by_party_id, offered_at)
      values (v_offer, t, v_c.defined_component_id, v_program, v_component.system_id, v_component.id,
        'finding', v_finding->'offer'->>'title', v_finding->'offer'->>'note', v_person, (v_finding->'offer'->>'offeredAt')::timestamptz);
    insert into public.component_offer_items (id, tenant_id, component_offer_id, program_id, issue_id)
      values (pg_temp.shared_id(t, 'component_offer_items/' || (v_finding->>'key')), t, v_offer, v_program, v_issue);
    select a.name into v_owner_name from public.parties a where a.id = public.component_owner_party(v_c.defined_component_id);
    select d.name into v_definition_name from public.component_definitions d where d.id = v_c.definition_id;
    insert into public.activity_events (id, tenant_id, program_id, issue_id, actor_party_id, event_type, description, occurred_at)
      values (pg_temp.shared_id(t, 'activity_events/' || (v_finding->>'key')), t, v_program, v_issue, v_person, 'created',
        format(E'offered %s on %s to %s\n%s: found on version %s of %s.', public.component_offer_words('finding', 1),
          v_finding->>'component', coalesce(v_owner_name, 'its owner'), v_finding->'offer'->>'title', v_c.version_number, v_definition_name),
        (v_finding->'offer'->>'offeredAt')::timestamptz);
    insert into pg_temp.shared_tracked values
      ('assessment_subjects', v_subject, 'assessment_subjects/' || (v_finding->>'key'), 'sharedFindings'),
      ('observations', v_observation, 'observations/' || (v_finding->>'key'), 'sharedFindings'),
      ('operational_issues', v_issue, 'operational_issues/' || (v_finding->>'key'), 'sharedFindings'),
      ('issue_observations', pg_temp.shared_id(t, 'issue_observations/' || (v_finding->>'key')), 'issue_observations/' || (v_finding->>'key'), 'sharedFindings'),
      ('component_offers', v_offer, 'component_offers/' || (v_finding->>'key'), 'sharedFindings'),
      ('component_offer_items', pg_temp.shared_id(t, 'component_offer_items/' || (v_finding->>'key')), 'component_offer_items/' || (v_finding->>'key'), 'sharedFindings'),
      ('activity_events', pg_temp.shared_id(t, 'activity_events/' || (v_finding->>'key')), 'activity_events/' || (v_finding->>'key'), 'sharedFindings');
    v_offered := v_offered || jsonb_build_object(v_finding->>'key', jsonb_build_object(
      'issue', v_finding->'issue'->>'title', 'on', format('%s %s', v_finding->'use'->>'program', v_finding->'use'->>'component'),
      'offeredTo', v_owner_name, 'offeredBy', v_finding->'offer'->>'offeredBy', 'state', 'offered'));
  end loop;

  -- What a shared component is made of: an SBOM of a component version and the components it
  -- lists, written as import_sbom writes them, each under its own stable id.
  for v_sbom in select value from jsonb_array_elements(coalesce(p->'sharedSboms', '[]'::jsonb)) loop
    select * into v_c from pg_temp.shared_component(t, v_sbom->>'definition', v_sbom->>'component');
    v_sbom_id := pg_temp.shared_id(t, 'sboms/' || (v_sbom->>'key'));
    insert into public.sboms (id, tenant_id, defined_component_id, title, format, spec_version, serial, generated_on)
      values (v_sbom_id, t, v_c.defined_component_id, v_sbom->>'title', v_sbom->>'format', v_sbom->>'specVersion',
        v_sbom->>'serial', (v_sbom->>'generatedOn')::date);
    insert into pg_temp.shared_tracked values ('sboms', v_sbom_id, 'sboms/' || (v_sbom->>'key'), 'sharedSboms');
    -- A component is known by its name and version, which an SBOM lists once.
    insert into public.sbom_components (id, tenant_id, sbom_id, parent_component_id, name, version, kind, supplier, purl, cpe, license, hash)
      select pg_temp.shared_id(t, format('sbom_components/%s/%s/%s', v_sbom->>'key', c.item->>'name', coalesce(c.item->>'version', ''))),
        t, v_sbom_id,
        (select pg_temp.shared_id(t, format('sbom_components/%s/%s/%s', v_sbom->>'key', x->>'name', coalesce(x->>'version', '')))
          from jsonb_array_elements(v_sbom->'components') x where x->>'ref' = c.item->>'parent'),
        c.item->>'name', c.item->>'version', c.item->>'kind', c.item->>'supplier', c.item->>'purl', c.item->>'cpe',
        c.item->>'license', c.item->>'hash'
      from jsonb_array_elements(v_sbom->'components') with ordinality c(item, position)
      order by c.position;
    insert into pg_temp.shared_tracked
      select 'sbom_components', c.id, format('sbom_components/%s/%s', v_sbom->>'key', concat_ws(' ', c.name, c.version)), 'sharedSboms'
      from public.sbom_components c where c.tenant_id = t and c.sbom_id = v_sbom_id;
    if (select count(*) from public.sbom_components c where c.tenant_id = t and c.sbom_id = v_sbom_id)
      <> jsonb_array_length(v_sbom->'components') then
      raise exception 'The SBOM % did not take every component the scenario lists.', v_sbom->>'key';
    end if;
    v_recorded := v_recorded || jsonb_build_object('sbom ' || (v_sbom->>'key'), jsonb_build_object(
      'title', v_sbom->>'title', 'of', format('%s version %s of %s', v_sbom->>'component', v_c.version_number, v_sbom->>'definition'),
      'components', jsonb_array_length(v_sbom->'components')));
  end loop;

  -- What is known to be wrong with it: a CVE's record, once in the workspace, the SBOM components
  -- it is found in, the controls it bears on, and the issue that is a program's row for it.
  for v_cve in select value from jsonb_array_elements(coalesce(p->'sharedVulnerabilities', '[]'::jsonb)) loop
    if exists (select 1 from public.vulnerabilities v where v.tenant_id = t and v.cve_id = v_cve->>'cveId') then
      raise exception 'This workspace already holds a record of %; the scenario does not write it twice.', v_cve->>'cveId';
    end if;
    v_cve_id := pg_temp.shared_id(t, 'vulnerabilities/' || (v_cve->>'cveId'));
    insert into public.vulnerabilities (id, tenant_id, cve_id, title, description, severity, cvss_score, cvss_vector,
        published_on, fixed_in, source_uri, known_exploited)
      values (v_cve_id, t, v_cve->>'cveId', v_cve->>'title', v_cve->>'description', v_cve->>'severity',
        (v_cve->>'cvssScore')::numeric, v_cve->>'cvssVector', (v_cve->>'publishedOn')::date, v_cve->>'fixedIn',
        v_cve->>'sourceUri', (v_cve->>'knownExploited')::boolean);
    insert into pg_temp.shared_tracked values ('vulnerabilities', v_cve_id, 'vulnerabilities/' || (v_cve->>'cveId'), 'sharedVulnerabilities');
    for v_link in select value from jsonb_array_elements(v_cve->'affects') loop
      select c.id into v_target from public.sbom_components c
        where c.tenant_id = t and c.sbom_id = pg_temp.shared_id(t, 'sboms/' || (v_link->>'sbom'))
          and c.name = v_link->>'component' and c.version is not distinct from v_link->>'version';
      if v_target is null then
        raise exception '% affects % %, which the SBOM % does not list.', v_cve->>'cveId', v_link->>'component', v_link->>'version', v_link->>'sbom';
      end if;
      v_link_id := pg_temp.shared_id(t, format('sbom_component_vulnerabilities/%s/%s/%s', v_cve->>'cveId', v_link->>'sbom', v_link->>'component'));
      insert into public.sbom_component_vulnerabilities (id, tenant_id, sbom_component_id, vulnerability_id, state, note)
        values (v_link_id, t, v_target, v_cve_id, v_link->>'state', v_link->>'note');
      insert into pg_temp.shared_tracked values ('sbom_component_vulnerabilities', v_link_id,
        format('sbom_component_vulnerabilities/%s/%s/%s', v_cve->>'cveId', v_link->>'sbom', v_link->>'component'), 'sharedVulnerabilities');
    end loop;
    -- A control by its code, in the one published catalog that holds it.
    for v_code in select value from jsonb_array_elements_text(v_cve->'controls') loop
      select count(*), min(k.id::text)::uuid into v_count, v_control from public.controls k
        join public.catalog_revisions r on r.id = k.catalog_revision_id and r.state = 'published'
        where k.code = v_code and (k.tenant_id is null or k.tenant_id = t);
      if v_count <> 1 then
        raise exception 'Expected one control coded % in a published catalog, found %.', v_code, v_count;
      end if;
      insert into public.vulnerability_controls (id, tenant_id, vulnerability_id, control_id)
        values (pg_temp.shared_id(t, format('vulnerability_controls/%s/%s', v_cve->>'cveId', v_code)), t, v_cve_id, v_control);
      insert into pg_temp.shared_tracked values ('vulnerability_controls',
        pg_temp.shared_id(t, format('vulnerability_controls/%s/%s', v_cve->>'cveId', v_code)),
        format('vulnerability_controls/%s/%s', v_cve->>'cveId', v_code), 'sharedVulnerabilities');
    end loop;
    -- The finding's operational issue, written above, is its program's row for the CVE.
    for v_code in select value from jsonb_array_elements_text(v_cve->'issues') loop
      v_issue := pg_temp.shared_id(t, 'operational_issues/' || v_code);
      if not exists (select 1 from public.operational_issues o where o.tenant_id = t and o.id = v_issue) then
        raise exception '% names the finding %, whose operational issue the scenario did not write.', v_cve->>'cveId', v_code;
      end if;
      insert into public.issue_vulnerabilities (id, tenant_id, issue_id, vulnerability_id)
        values (pg_temp.shared_id(t, format('issue_vulnerabilities/%s/%s', v_cve->>'cveId', v_code)), t, v_issue, v_cve_id);
      insert into pg_temp.shared_tracked values ('issue_vulnerabilities',
        pg_temp.shared_id(t, format('issue_vulnerabilities/%s/%s', v_cve->>'cveId', v_code)),
        format('issue_vulnerabilities/%s/%s', v_cve->>'cveId', v_code), 'sharedVulnerabilities');
    end loop;
    v_recorded := v_recorded || jsonb_build_object(v_cve->>'cveId', jsonb_build_object(
      'severity', v_cve->>'severity', 'cvss', v_cve->'cvssScore',
      'affects', (select jsonb_agg(format('%s %s (%s)', a->>'component', a->>'version', a->>'state')) from jsonb_array_elements(v_cve->'affects') a),
      'bearsOn', v_cve->'controls', 'rows', jsonb_array_length(v_cve->'issues')));
  end loop;

  -- Cyber T&E is a kind of assessment: a planned cyber test campaign of the program, with no plan.
  for v_test in select value from jsonb_array_elements(coalesce(p->'sharedCyberTests', '[]'::jsonb)) loop
    select g.id into v_program from public.programs g where g.tenant_id = t and g.code = v_test->>'program';
    if v_program is null then
      raise exception 'The program % is not in this workspace. Run npm run seed:demo first.', v_test->>'program';
    end if;
    if exists (select 1 from public.assessment_campaigns c where c.tenant_id = t and c.program_id = v_program and c.title = v_test->>'title') then
      raise exception '% already holds an assessment campaign titled %; the scenario does not write it twice.', v_test->>'program', v_test->>'title';
    end if;
    select count(*), min(a.id::text)::uuid into v_count, v_person from public.parties a where a.tenant_id = t and a.name = v_test->>'owner';
    if v_count <> 1 then
      raise exception 'Expected one person named % to own %, found %.', v_test->>'owner', v_test->>'key', v_count;
    end if;
    v_campaign := pg_temp.shared_id(t, 'assessment_campaigns/' || (v_test->>'key'));
    insert into public.assessment_campaigns (id, tenant_id, title, description, program_id, owner_party_id, status, starts_at, ends_at, kind, cyber_test_phase)
      values (v_campaign, t, v_test->>'title', v_test->>'description', v_program, v_person, v_test->>'status',
        (v_test->>'startsAt')::timestamptz, (v_test->>'endsAt')::timestamptz, 'cyber_test', v_test->>'phase');
    insert into pg_temp.shared_tracked values ('assessment_campaigns', v_campaign, 'assessment_campaigns/' || (v_test->>'key'), 'sharedCyberTests');
    v_recorded := v_recorded || jsonb_build_object('cyber test ' || (v_test->>'key'), jsonb_build_object(
      'campaign', v_test->>'title', 'program', v_test->>'program', 'phase', v_test->>'phase', 'status', v_test->>'status'));
  end loop;

  -- The component's next version: a draft revision of its set with every component of the version
  -- before and what each claims, written as a new version of a set is written (the revision, then
  -- its components and their claims, each under its own id), what it changes and the controls that
  -- affects, and its own SBOM. It is left a draft: nobody is behind, and no status read moves.
  for v_version in select value from jsonb_array_elements(coalesce(p->'sharedVersions', '[]'::jsonb)) loop
    v_number := (v_version->>'version')::integer;
    v_base := format('%s/%s', v_version->>'definition', v_number);
    if v_version->>'state' is distinct from 'draft' then
      raise exception 'The scenario leaves version % of % a draft.', v_number, v_version->>'definition';
    end if;
    select * into v_definition from public.component_definitions d where d.tenant_id = t and d.code = v_version->>'definition';
    if v_definition.id is null then
      raise exception 'The component set % is not in this workspace. Run npm run seed:demo-products first.', v_version->>'definition';
    end if;
    if exists (select 1 from public.component_definition_revisions r
      where r.tenant_id = t and r.component_definition_id = v_definition.id and r.version_number = v_number) then
      raise exception 'The component set % already holds a version %; the scenario does not write it twice.', v_version->>'definition', v_number;
    end if;
    select * into v_previous from public.component_definition_revisions r
      where r.tenant_id = t and r.component_definition_id = v_definition.id and r.state = 'published'
      order by r.version_number desc limit 1;
    if v_previous.id is null or v_previous.version_number <> v_number - 1 then
      raise exception 'The latest published version of % is %, not the % that version % follows.',
        v_version->>'definition', coalesce(v_previous.version_number::text, 'none'), v_number - 1, v_number;
    end if;
    v_revision := pg_temp.shared_id(t, 'component_definition_revisions/' || v_base);
    insert into public.component_definition_revisions (id, tenant_id, component_definition_id, version_number, remarks, conditions, consumer_responsibilities)
      values (v_revision, t, v_definition.id, v_number, v_version->>'remarks', v_previous.conditions, v_previous.consumer_responsibilities);
    insert into pg_temp.shared_tracked values ('component_definition_revisions', v_revision, 'component_definition_revisions/' || v_base, 'sharedVersions');
    -- A component of the new version is known by the one it was copied from.
    insert into public.defined_components (id, tenant_id, component_definition_revision_id, name, component_type, description, supplier_party_id)
      select pg_temp.shared_id(t, format('defined_components/%s/%s', v_base, c.id)), t, v_revision,
        c.name, c.component_type, c.description, c.supplier_party_id
      from public.defined_components c
      where c.tenant_id = t and c.component_definition_revision_id = v_previous.id;
    insert into public.defined_component_implementations (id, tenant_id, component_definition_revision_id, defined_component_id,
        control_id, control_part_id, description, implementation_status, requirement_definition_revision_id,
        coverage, coverage_rationale, consumer_responsibility)
      select pg_temp.shared_id(t, format('defined_component_implementations/%s/%s', v_base, i.id)), t, v_revision,
        pg_temp.shared_id(t, format('defined_components/%s/%s', v_base, i.defined_component_id)),
        i.control_id, i.control_part_id, i.description, i.implementation_status, i.requirement_definition_revision_id,
        i.coverage, i.coverage_rationale, i.consumer_responsibility
      from public.defined_component_implementations i
      where i.tenant_id = t and i.component_definition_revision_id = v_previous.id;
    insert into public.defined_component_evidence (id, tenant_id, component_definition_revision_id, implementation_id, evidence_version_id, claim)
      select pg_temp.shared_id(t, format('defined_component_evidence/%s/%s', v_base, e.id)), t, v_revision,
        pg_temp.shared_id(t, format('defined_component_implementations/%s/%s', v_base, e.implementation_id)),
        e.evidence_version_id, e.claim
      from public.defined_component_evidence e
      where e.tenant_id = t and e.component_definition_revision_id = v_previous.id;
    insert into pg_temp.shared_tracked
      select 'defined_components', c.id, format('defined_components/%s/%s', v_base, c.name), 'sharedVersions'
      from public.defined_components c where c.tenant_id = t and c.component_definition_revision_id = v_revision
      union all
      select 'defined_component_implementations', i.id, format('defined_component_implementations/%s/%s', v_base, i.id), 'sharedVersions'
      from public.defined_component_implementations i where i.tenant_id = t and i.component_definition_revision_id = v_revision
      union all
      select 'defined_component_evidence', e.id, format('defined_component_evidence/%s/%s', v_base, e.id), 'sharedVersions'
      from public.defined_component_evidence e where e.tenant_id = t and e.component_definition_revision_id = v_revision;
    if (select count(*) from public.defined_components c where c.tenant_id = t and c.component_definition_revision_id = v_revision)
        <> (select count(*) from public.defined_components c where c.tenant_id = t and c.component_definition_revision_id = v_previous.id)
      or (select count(*) from public.defined_component_implementations i where i.tenant_id = t and i.component_definition_revision_id = v_revision)
        <> (select count(*) from public.defined_component_implementations i where i.tenant_id = t and i.component_definition_revision_id = v_previous.id) then
      raise exception 'Version % of % did not take every component and claim of version %.', v_number, v_version->>'definition', v_previous.version_number;
    end if;
    -- What the version changes in a component, against the version before, and the controls that
    -- affects: what an earlier version was judged on them is not carried forward.
    for v_change in select value from jsonb_array_elements(v_version->'changes') loop
      select count(*), min(c.id::text)::uuid into v_count, v_target from public.defined_components c
        where c.tenant_id = t and c.component_definition_revision_id = v_revision and c.name = v_change->>'component';
      if v_count <> 1 then
        raise exception 'Expected one component named % in % version %, found %.', v_change->>'component', v_version->>'definition', v_number, v_count;
      end if;
      v_link_id := pg_temp.shared_id(t, format('component_version_changes/%s/%s', v_base, v_change->>'component'));
      insert into public.component_version_changes (id, tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary)
        values (v_link_id, t, v_revision, v_target, array(select jsonb_array_elements_text(v_change->'kinds')), v_change->>'summary');
      insert into pg_temp.shared_tracked values ('component_version_changes', v_link_id,
        format('component_version_changes/%s/%s', v_base, v_change->>'component'), 'sharedVersions');
      for v_code in select value from jsonb_array_elements_text(v_change->'controls') loop
        insert into public.component_version_change_controls (id, tenant_id, component_definition_revision_id, component_version_change_id, control_id)
          values (pg_temp.shared_id(t, format('component_version_change_controls/%s/%s/%s', v_base, v_change->>'component', v_code)),
            t, v_revision, v_link_id, pg_temp.shared_control(t, v_code));
        insert into pg_temp.shared_tracked values ('component_version_change_controls',
          pg_temp.shared_id(t, format('component_version_change_controls/%s/%s/%s', v_base, v_change->>'component', v_code)),
          format('component_version_change_controls/%s/%s/%s', v_base, v_change->>'component', v_code), 'sharedVersions');
      end loop;
    end loop;
    -- The version's own SBOM, written as the first one is, and the state it records for a CVE.
    for v_sbom in select value from jsonb_array_elements(v_version->'sboms') loop
      select count(*), min(c.id::text)::uuid into v_count, v_target from public.defined_components c
        where c.tenant_id = t and c.component_definition_revision_id = v_revision and c.name = v_sbom->>'component';
      if v_count <> 1 then
        raise exception 'Expected one component named % in % version %, found %.', v_sbom->>'component', v_version->>'definition', v_number, v_count;
      end if;
      v_sbom_id := pg_temp.shared_id(t, 'sboms/' || (v_sbom->>'key'));
      insert into public.sboms (id, tenant_id, defined_component_id, title, format, spec_version, serial, generated_on)
        values (v_sbom_id, t, v_target, v_sbom->>'title', v_sbom->>'format', v_sbom->>'specVersion',
          v_sbom->>'serial', (v_sbom->>'generatedOn')::date);
      insert into pg_temp.shared_tracked values ('sboms', v_sbom_id, 'sboms/' || (v_sbom->>'key'), 'sharedVersions');
      insert into public.sbom_components (id, tenant_id, sbom_id, parent_component_id, name, version, kind, supplier, purl, cpe, license, hash)
        select pg_temp.shared_id(t, format('sbom_components/%s/%s/%s', v_sbom->>'key', c.item->>'name', coalesce(c.item->>'version', ''))),
          t, v_sbom_id,
          (select pg_temp.shared_id(t, format('sbom_components/%s/%s/%s', v_sbom->>'key', x->>'name', coalesce(x->>'version', '')))
            from jsonb_array_elements(v_sbom->'components') x where x->>'ref' = c.item->>'parent'),
          c.item->>'name', c.item->>'version', c.item->>'kind', c.item->>'supplier', c.item->>'purl', c.item->>'cpe',
          c.item->>'license', c.item->>'hash'
        from jsonb_array_elements(v_sbom->'components') with ordinality c(item, position)
        order by c.position;
      insert into pg_temp.shared_tracked
        select 'sbom_components', c.id, format('sbom_components/%s/%s', v_sbom->>'key', concat_ws(' ', c.name, c.version)), 'sharedVersions'
        from public.sbom_components c where c.tenant_id = t and c.sbom_id = v_sbom_id;
      if (select count(*) from public.sbom_components c where c.tenant_id = t and c.sbom_id = v_sbom_id)
        <> jsonb_array_length(v_sbom->'components') then
        raise exception 'The SBOM % did not take every component the scenario lists.', v_sbom->>'key';
      end if;
      for v_link in select value from jsonb_array_elements(v_sbom->'vulnerabilities') loop
        select v.id into v_cve_id from public.vulnerabilities v where v.tenant_id = t and v.cve_id = v_link->>'cveId';
        select c.id into v_target from public.sbom_components c
          where c.tenant_id = t and c.sbom_id = v_sbom_id and c.name = v_link->>'component';
        if v_cve_id is null or v_target is null then
          raise exception 'The SBOM % records % on %, and the scenario wrote no such CVE record or component.', v_sbom->>'key', v_link->>'cveId', v_link->>'component';
        end if;
        v_link_id := pg_temp.shared_id(t, format('sbom_component_vulnerabilities/%s/%s/%s', v_link->>'cveId', v_sbom->>'key', v_link->>'component'));
        insert into public.sbom_component_vulnerabilities (id, tenant_id, sbom_component_id, vulnerability_id, state, note)
          values (v_link_id, t, v_target, v_cve_id, v_link->>'state', v_link->>'note');
        insert into pg_temp.shared_tracked values ('sbom_component_vulnerabilities', v_link_id,
          format('sbom_component_vulnerabilities/%s/%s/%s', v_link->>'cveId', v_sbom->>'key', v_link->>'component'), 'sharedVersions');
      end loop;
    end loop;
    v_recorded := v_recorded || jsonb_build_object('version ' || (v_version->>'key'), jsonb_build_object(
      'of', format('%s version %s', v_version->>'definition', v_number), 'state', v_version->>'state',
      'components', (select count(*) from public.defined_components c where c.tenant_id = t and c.component_definition_revision_id = v_revision),
      'claims', (select count(*) from public.defined_component_implementations i where i.tenant_id = t and i.component_definition_revision_id = v_revision),
      'changes', (select jsonb_agg(format('%s: %s; affects %s', c->>'component',
          (select string_agg(k, ', ') from jsonb_array_elements_text(c->'kinds') k),
          (select string_agg(k, ', ') from jsonb_array_elements_text(c->'controls') k)))
        from jsonb_array_elements(v_version->'changes') c),
      'sboms', (select jsonb_agg(format('%s: %s components; %s', b->>'title', jsonb_array_length(b->'components'),
          (select string_agg(format('%s %s', x->>'cveId', x->>'state'), ', ') from jsonb_array_elements(b->'vulnerabilities') x)))
        from jsonb_array_elements(v_version->'sboms') b)));
  end loop;

  -- What answers the finding in the program that holds it: a remediation item of the program's
  -- POA&M, its first commitment (a draft, as the program's other items keep theirs) with its
  -- milestones, the issue it answers and the observation that issue rests on, linked as the demo
  -- import links them.
  for v_remedy in select value from jsonb_array_elements(coalesce(p->'sharedRemediation', '[]'::jsonb)) loop
    select g.id into v_program from public.programs g where g.tenant_id = t and g.code = v_remedy->>'program';
    if v_program is null then
      raise exception 'The program % is not in this workspace. Run npm run seed:demo first.', v_remedy->>'program';
    end if;
    select count(*), min(d.id::text)::uuid into v_count, v_document from public.poam_documents d
      where d.tenant_id = t and d.program_id = v_program and d.title = v_remedy->>'document';
    if v_count <> 1 then
      raise exception 'Expected one POA&M document titled % in %, found %.', v_remedy->>'document', v_remedy->>'program', v_count;
    end if;
    if exists (select 1 from public.poam_items i
      join public.poam_documents d on d.tenant_id = i.tenant_id and d.id = i.poam_document_id
      where i.tenant_id = t and d.program_id = v_program and i.title = v_remedy->>'title') then
      raise exception '% already holds a remediation item titled %; the scenario does not write it twice.', v_remedy->>'program', v_remedy->>'title';
    end if;
    select count(*), min(a.id::text)::uuid into v_count, v_person from public.parties a where a.tenant_id = t and a.name = v_remedy->>'owner';
    if v_count <> 1 then
      raise exception 'Expected one person named % to own %, found %.', v_remedy->>'owner', v_remedy->>'title', v_count;
    end if;
    v_issue := pg_temp.shared_id(t, 'operational_issues/' || (v_remedy->>'finding'));
    v_observation := pg_temp.shared_id(t, 'observations/' || (v_remedy->>'finding'));
    if not exists (select 1 from public.operational_issues o where o.tenant_id = t and o.id = v_issue and o.program_id = v_program) then
      raise exception '% answers the finding %, whose operational issue the scenario did not write in %.', v_remedy->>'title', v_remedy->>'finding', v_remedy->>'program';
    end if;
    v_poam := pg_temp.shared_id(t, 'poam_items/' || (v_remedy->>'key'));
    v_commitment := pg_temp.shared_id(t, 'poam_item_revisions/' || (v_remedy->>'key') || '/1');
    insert into public.poam_items (id, tenant_id, poam_document_id, title, owner_party_id, status)
      values (v_poam, t, v_document, v_remedy->>'title', v_person, v_remedy->>'status');
    insert into public.poam_item_revisions (id, tenant_id, version_number, state, poam_document_id, poam_item_id,
        description, remediation_plan, planned_completion_date)
      values (v_commitment, t, 1, 'draft', v_document, v_poam, v_remedy->>'description', v_remedy->>'plan',
        (v_remedy->>'plannedCompletion')::date);
    insert into pg_temp.shared_tracked values
      ('poam_items', v_poam, 'poam_items/' || (v_remedy->>'key'), 'sharedRemediation'),
      ('poam_item_revisions', v_commitment, 'poam_item_revisions/' || (v_remedy->>'key') || '/1', 'sharedRemediation');
    for v_milestone, v_n in select m.value, m.n from jsonb_array_elements(v_remedy->'milestones') with ordinality m(value, n) loop
      insert into public.poam_milestones (id, tenant_id, poam_item_revision_id, title, sequence_number, owner_party_id, planned_date, status)
        values (pg_temp.shared_id(t, format('poam_milestones/%s/%s', v_remedy->>'key', v_n)), t, v_commitment,
          v_milestone->>'title', v_n, v_person, (v_milestone->>'plannedOn')::date, 'planned');
      insert into pg_temp.shared_tracked values ('poam_milestones',
        pg_temp.shared_id(t, format('poam_milestones/%s/%s', v_remedy->>'key', v_n)),
        format('poam_milestones/%s/%s', v_remedy->>'key', v_n), 'sharedRemediation');
    end loop;
    insert into public.issue_poams (id, tenant_id, issue_id, poam_item_id)
      values (pg_temp.shared_id(t, 'issue_poams/' || (v_remedy->>'key')), t, v_issue, v_poam);
    insert into public.poam_item_observations (id, tenant_id, poam_item_revision_id, observation_id)
      values (pg_temp.shared_id(t, 'poam_item_observations/' || (v_remedy->>'key')), t, v_commitment, v_observation);
    insert into pg_temp.shared_tracked values
      ('issue_poams', pg_temp.shared_id(t, 'issue_poams/' || (v_remedy->>'key')), 'issue_poams/' || (v_remedy->>'key'), 'sharedRemediation'),
      ('poam_item_observations', pg_temp.shared_id(t, 'poam_item_observations/' || (v_remedy->>'key')), 'poam_item_observations/' || (v_remedy->>'key'), 'sharedRemediation');
    v_recorded := v_recorded || jsonb_build_object('remediation ' || (v_remedy->>'key'), jsonb_build_object(
      'item', v_remedy->>'title', 'program', v_remedy->>'program', 'document', v_remedy->>'document',
      'status', v_remedy->>'status', 'planned', v_remedy->>'plannedCompletion',
      'milestones', (select jsonb_agg(format('%s, %s', m->>'title', m->>'plannedOn')) from jsonb_array_elements(v_remedy->'milestones') m)));
  end loop;

  v_after := pg_temp.shared_existing_reads(p);
  v_effects_after := pg_temp.shared_effects(p);
  select coalesce(array_agg(k.key order by k.key), '{}') into v_changed
    from jsonb_each(v_before) k where v_after->k.key is distinct from k.value;

  v_job := pg_temp.shared_id(t, 'ingestion_jobs');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Shared components demo seed', 'urn:program-assurance:demo:' || (p->>'datasetId'), 'completed', now(), now(),
      'Authored shared components scenario: a component set owned by name, a system component built from one of its components, the component assessed once, a finding a consumer offered to its owner, the component''s SBOM with the CVE record the finding names, a planned cyber test, the set''s next version as a draft with what it changes, and the remediation item that answers the finding (scripts/demo/shared-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(*) as n from pg_temp.shared_tracked group by destination_table) c;
  v_batch := pg_temp.shared_id(t, 'demo_import_batches');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'datasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/shared-scenario.mjs'),
      jsonb_build_object('tables', v_tables, 'updated', v_updated, 'carried', v_carried, 'offered', v_offered,
        'recorded', v_recorded, 'existingReadsChanged', to_jsonb(v_changed)));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
    values (pg_temp.shared_id(t, 'demo_import_sources/sharedComponents'), t, v_batch, '/sharedComponents',
      encode(extensions.digest((p->'sharedComponents')::text, 'sha256'), 'hex'), p->'sharedComponents'),
    (pg_temp.shared_id(t, 'demo_import_sources/sharedFindings'), t, v_batch, '/sharedFindings',
      encode(extensions.digest(coalesce(p->'sharedFindings', '[]'::jsonb)::text, 'sha256'), 'hex'), coalesce(p->'sharedFindings', '[]'::jsonb)),
    (pg_temp.shared_id(t, 'demo_import_sources/sharedSboms'), t, v_batch, '/sharedSboms',
      encode(extensions.digest(coalesce(p->'sharedSboms', '[]'::jsonb)::text, 'sha256'), 'hex'), coalesce(p->'sharedSboms', '[]'::jsonb)),
    (pg_temp.shared_id(t, 'demo_import_sources/sharedVulnerabilities'), t, v_batch, '/sharedVulnerabilities',
      encode(extensions.digest(coalesce(p->'sharedVulnerabilities', '[]'::jsonb)::text, 'sha256'), 'hex'), coalesce(p->'sharedVulnerabilities', '[]'::jsonb)),
    (pg_temp.shared_id(t, 'demo_import_sources/sharedCyberTests'), t, v_batch, '/sharedCyberTests',
      encode(extensions.digest(coalesce(p->'sharedCyberTests', '[]'::jsonb)::text, 'sha256'), 'hex'), coalesce(p->'sharedCyberTests', '[]'::jsonb)),
    (pg_temp.shared_id(t, 'demo_import_sources/sharedVersions'), t, v_batch, '/sharedVersions',
      encode(extensions.digest(coalesce(p->'sharedVersions', '[]'::jsonb)::text, 'sha256'), 'hex'), coalesce(p->'sharedVersions', '[]'::jsonb)),
    (pg_temp.shared_id(t, 'demo_import_sources/sharedRemediation'), t, v_batch, '/sharedRemediation',
      encode(extensions.digest(coalesce(p->'sharedRemediation', '[]'::jsonb)::text, 'sha256'), 'hex'), coalesce(p->'sharedRemediation', '[]'::jsonb));
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.shared_id(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'datasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || k.section, s.source_sha256, s.id, jsonb_build_object('section', k.section)
  from pg_temp.shared_tracked k
  join public.demo_import_sources s on s.tenant_id = t and s.import_batch_id = v_batch and s.source_pointer = '/' || k.section;

  return jsonb_build_object(
    'changed', true,
    'tables', v_tables,
    'records', (select count(*) from pg_temp.shared_tracked),
    'updated', v_updated,
    'carried', v_carried,
    'offered', v_offered,
    'recorded', v_recorded,
    'existingReads', jsonb_build_object('changed', to_jsonb(v_changed), 'before', v_before, 'after', v_after),
    'effects', jsonb_build_object('before', v_effects_before, 'after', v_effects_after),
    'reads', pg_temp.shared_new_reads(p));
end;
$seed$;

-- Undo the seed: put back what it changed in records it did not write, then remove what it added
-- and its provenance. A record it changed that says something else by now stops the revert, so
-- nobody's later edit is overwritten, and so does an offer the seed left waiting that was reviewed
-- or withdrawn since, a CVE record of the seed's that something else names by now, a cyber test
-- that took a plan, a version of a set that something the seed did not write is built from, judges
-- or was added to, and a remediation item whose commitment was published or that something else
-- names. A published component assessment and the content of a published version are immutable
-- and an activity event is append-only, so the guards that keep them so are set aside for the
-- removal and restored before the transaction ends.
create function pg_temp.revert_shared(p jsonb) returns jsonb language plpgsql as $revert$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_batch public.demo_import_batches; v_item jsonb; v_before jsonb; v_after jsonb;
  v_restored integer := 0; v_removed jsonb; v_reads_before jsonb; v_reads_after jsonb; v_changed text[];
  v_effects_before jsonb; v_effects_after jsonb; v_title text;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-shared', 0));
  select * into v_batch from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId';
  if v_batch.id is null then
    return jsonb_build_object('changed', false, 'reason', 'This workspace does not hold the shared components scenario.');
  end if;
  v_reads_before := pg_temp.shared_existing_reads(p);
  v_effects_before := pg_temp.shared_effects(p);
  -- An offer somebody reviewed or withdrawn is no longer the seed's to remove: accepted, it opened
  -- issues in other programs.
  select o.title into v_title from public.component_offers o
    where o.tenant_id = t and o.state <> 'offered' and o.id in (
      select r.destination_id from public.demo_import_records r
      where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_offers')
    limit 1;
  if v_title is not null then
    raise exception 'The offer % was reviewed or withdrawn since the seed wrote it; nothing was reverted.', v_title;
  end if;
  -- A CVE record something else names by now (another issue, another SBOM component, another
  -- control) is no longer the seed's alone to remove, and neither is a cyber test with a plan.
  select v.cve_id into v_title from public.vulnerabilities v
    where v.tenant_id = t and v.id in (
      select r.destination_id from public.demo_import_records r
      where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'vulnerabilities')
      and (exists (select 1 from public.issue_vulnerabilities l where l.tenant_id = t and l.vulnerability_id = v.id
          and l.id not in (select r.destination_id from public.demo_import_records r
            where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'issue_vulnerabilities'))
        or exists (select 1 from public.sbom_component_vulnerabilities l where l.tenant_id = t and l.vulnerability_id = v.id
          and l.id not in (select r.destination_id from public.demo_import_records r
            where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'sbom_component_vulnerabilities'))
        or exists (select 1 from public.vulnerability_controls l where l.tenant_id = t and l.vulnerability_id = v.id
          and l.id not in (select r.destination_id from public.demo_import_records r
            where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'vulnerability_controls')))
    limit 1;
  if v_title is not null then
    raise exception 'The record of % is named by something the seed did not write; nothing was reverted.', v_title;
  end if;
  select c.title into v_title from public.assessment_campaigns c
    where c.tenant_id = t and c.id in (
      select r.destination_id from public.demo_import_records r
      where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'assessment_campaigns')
      and exists (select 1 from public.assessment_plan_revisions pl where pl.tenant_id = t and pl.campaign_id = c.id)
    limit 1;
  if v_title is not null then
    raise exception 'The campaign % took a plan since the seed wrote it; nothing was reverted.', v_title;
  end if;
  -- A version of a set is the seed's to remove while only what the seed wrote stands on it: no
  -- system or product built from one of its components, no assessment or offer on it, no component,
  -- claim, change or SBOM added to it since.
  select format('Version %s of %s', r.version_number, d.code) into v_title
    from public.component_definition_revisions r
    join public.component_definitions d on d.tenant_id = r.tenant_id and d.id = r.component_definition_id
    where r.tenant_id = t and r.id in (
      select x.destination_id from public.demo_import_records x
      where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'component_definition_revisions')
      and (exists (select 1 from public.component_assessments a where a.tenant_id = t and a.component_definition_revision_id = r.id)
        or exists (select 1 from public.library_assignments a where a.tenant_id = t and a.source_revision_id = r.id)
        or exists (select 1 from public.defined_component_implementations i
          where i.tenant_id = t and i.component_definition_revision_id = r.id and i.id not in (
            select x.destination_id from public.demo_import_records x
            where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'defined_component_implementations'))
        or exists (select 1 from public.component_version_changes ch
          where ch.tenant_id = t and ch.component_definition_revision_id = r.id and ch.id not in (
            select x.destination_id from public.demo_import_records x
            where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'component_version_changes'))
        or exists (select 1 from public.component_version_change_controls k
          where k.tenant_id = t and k.component_definition_revision_id = r.id and k.id not in (
            select x.destination_id from public.demo_import_records x
            where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'component_version_change_controls'))
        or exists (select 1 from public.defined_components c
          where c.tenant_id = t and c.component_definition_revision_id = r.id
            and (c.id not in (select x.destination_id from public.demo_import_records x
                where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'defined_components')
              or exists (select 1 from public.system_components x where x.tenant_id = t and x.defined_component_id = c.id)
              or exists (select 1 from public.product_elements x where x.tenant_id = t and x.defined_component_id = c.id)
              or exists (select 1 from public.component_offers x where x.tenant_id = t and x.defined_component_id = c.id)
              or exists (select 1 from public.component_pins x where x.tenant_id = t and x.defined_component_id = c.id)
              or exists (select 1 from public.sboms x where x.tenant_id = t and x.defined_component_id = c.id and x.id not in (
                select y.destination_id from public.demo_import_records y
                where y.tenant_id = t and y.import_batch_id = v_batch.id and y.destination_table = 'sboms')))))
    limit 1;
  if v_title is not null then
    raise exception '% is used by, or holds, something the seed did not write; nothing was reverted.', v_title;
  end if;
  -- A remediation item whose commitment was published or followed by another, or that a task, a
  -- comment, an activity event, another issue, a milestone or a link the seed did not write names.
  select i.title into v_title from public.poam_items i
    where i.tenant_id = t and i.id in (
      select x.destination_id from public.demo_import_records x
      where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'poam_items')
      and (exists (select 1 from public.poam_item_revisions r where r.tenant_id = t and r.poam_item_id = i.id
          and (r.state <> 'draft'
            or r.id not in (select x.destination_id from public.demo_import_records x
              where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'poam_item_revisions')
            or exists (select 1 from public.poam_milestones m where m.tenant_id = t and m.poam_item_revision_id = r.id
              and m.id not in (select x.destination_id from public.demo_import_records x
                where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'poam_milestones'))
            or exists (select 1 from public.poam_item_observations o where o.tenant_id = t and o.poam_item_revision_id = r.id
              and o.id not in (select x.destination_id from public.demo_import_records x
                where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'poam_item_observations'))
            or exists (select 1 from public.poam_item_risks x where x.tenant_id = t and x.poam_item_revision_id = r.id)
            or exists (select 1 from public.change_requests x where x.tenant_id = t and x.poam_item_revision_id = r.id)
            or exists (select 1 from public.poam_revision_items x where x.tenant_id = t and x.poam_item_revision_id = r.id)))
        or exists (select 1 from public.issue_poams l where l.tenant_id = t and l.poam_item_id = i.id
          and l.id not in (select x.destination_id from public.demo_import_records x
            where x.tenant_id = t and x.import_batch_id = v_batch.id and x.destination_table = 'issue_poams'))
        or exists (select 1 from public.task_poams x where x.tenant_id = t and x.poam_item_id = i.id)
        or exists (select 1 from public.comments x where x.tenant_id = t and x.poam_item_id = i.id)
        or exists (select 1 from public.activity_events x where x.tenant_id = t and x.poam_item_id = i.id))
    limit 1;
  if v_title is not null then
    raise exception 'The remediation item % changed since the seed wrote it; nothing was reverted.', v_title;
  end if;
  for v_item in select value from jsonb_array_elements(coalesce(v_batch.summary->'updated', '[]'::jsonb)) loop
    v_before := v_item->'before'; v_after := v_item->'after';
    if v_item->>'table' = 'component_definitions' then
      update public.component_definitions d
        set owner_party_id = (v_before->>'owner_party_id')::uuid, business_line_id = (v_before->>'business_line_id')::uuid
        where d.tenant_id = t and d.id = (v_item->>'id')::uuid
          and d.owner_party_id is not distinct from (v_after->>'owner_party_id')::uuid
          and d.business_line_id is not distinct from (v_after->>'business_line_id')::uuid;
    elsif v_item->>'table' = 'system_components' then
      update public.system_components c
        set defined_component_id = (v_before->>'defined_component_id')::uuid,
          applied_rationale = v_before->>'applied_rationale',
          applied_at = (v_before->>'applied_at')::timestamptz, applied_by = (v_before->>'applied_by')::uuid
        where c.tenant_id = t and c.id = (v_item->>'id')::uuid
          and c.defined_component_id is not distinct from (v_after->>'defined_component_id')::uuid;
    else
      raise exception 'The batch lists a change to %, which the revert does not know how to undo.', v_item->>'table';
    end if;
    if not found then
      raise exception '% % changed since the seed wrote it; nothing was reverted.', v_item->>'table', v_item->>'key';
    end if;
    v_restored := v_restored + 1;
  end loop;
  select coalesce(jsonb_object_agg(c.destination_table, c.n), '{}'::jsonb) into v_removed
    from (select r.destination_table, count(*) as n from public.demo_import_records r
      where r.tenant_id = t and r.import_batch_id = v_batch.id group by r.destination_table) c;
  alter table public.component_determinations disable trigger immutable_component_assessment_id;
  alter table public.component_assessments disable trigger record_lifecycle;
  delete from public.component_determinations d where d.tenant_id = t and d.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_determinations');
  delete from public.component_assessments a where a.tenant_id = t and a.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_assessments');
  alter table public.component_assessments enable trigger record_lifecycle;
  alter table public.component_determinations enable trigger immutable_component_assessment_id;
  -- The finding that was offered, from the offer down to the subject its observation was made on.
  alter table public.activity_events disable trigger append_only;
  delete from public.activity_events e where e.tenant_id = t and e.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'activity_events');
  alter table public.activity_events enable trigger append_only;
  -- An offer takes its items with it.
  delete from public.component_offers o where o.tenant_id = t and o.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_offers');
  -- The CVE record, from what names it down to the record, the SBOM (which takes its components
  -- with it) and the cyber test.
  delete from public.issue_vulnerabilities l where l.tenant_id = t and l.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'issue_vulnerabilities');
  delete from public.vulnerability_controls l where l.tenant_id = t and l.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'vulnerability_controls');
  delete from public.sbom_component_vulnerabilities l where l.tenant_id = t and l.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'sbom_component_vulnerabilities');
  delete from public.vulnerabilities v where v.tenant_id = t and v.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'vulnerabilities');
  delete from public.sboms s where s.tenant_id = t and s.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'sboms');
  -- The next version of a set, from what it changes down to its components and the revision. The
  -- content of a published version does not change, so the guards are set aside as above.
  alter table public.component_version_change_controls disable trigger immutable_component_definition_revision_id;
  alter table public.component_version_changes disable trigger immutable_component_definition_revision_id;
  alter table public.defined_component_evidence disable trigger immutable_component_definition_revision_id;
  alter table public.defined_component_implementations disable trigger immutable_component_definition_revision_id;
  alter table public.defined_components disable trigger immutable_component_definition_revision_id;
  alter table public.component_definition_revisions disable trigger record_lifecycle;
  delete from public.component_version_change_controls k where k.tenant_id = t and k.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_version_change_controls');
  delete from public.component_version_changes ch where ch.tenant_id = t and ch.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_version_changes');
  delete from public.defined_component_evidence e where e.tenant_id = t and e.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'defined_component_evidence');
  delete from public.defined_component_implementations i where i.tenant_id = t and i.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'defined_component_implementations');
  delete from public.defined_components c where c.tenant_id = t and c.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'defined_components');
  delete from public.component_definition_revisions v where v.tenant_id = t and v.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'component_definition_revisions');
  alter table public.component_definition_revisions enable trigger record_lifecycle;
  alter table public.defined_components enable trigger immutable_component_definition_revision_id;
  alter table public.defined_component_implementations enable trigger immutable_component_definition_revision_id;
  alter table public.defined_component_evidence enable trigger immutable_component_definition_revision_id;
  alter table public.component_version_changes enable trigger immutable_component_definition_revision_id;
  alter table public.component_version_change_controls enable trigger immutable_component_definition_revision_id;
  delete from public.assessment_campaigns c where c.tenant_id = t and c.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'assessment_campaigns');
  -- The remediation item that answers the finding, from its links down to the item.
  delete from public.poam_item_observations l where l.tenant_id = t and l.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'poam_item_observations');
  delete from public.issue_poams l where l.tenant_id = t and l.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'issue_poams');
  delete from public.poam_milestones m where m.tenant_id = t and m.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'poam_milestones');
  delete from public.poam_item_revisions v where v.tenant_id = t and v.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'poam_item_revisions');
  delete from public.poam_items i where i.tenant_id = t and i.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'poam_items');
  delete from public.issue_observations l where l.tenant_id = t and l.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'issue_observations');
  delete from public.operational_issues i where i.tenant_id = t and i.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'operational_issues');
  delete from public.observations o where o.tenant_id = t and o.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'observations');
  delete from public.assessment_subjects x where x.tenant_id = t and x.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'assessment_subjects');
  delete from public.demo_import_records r where r.tenant_id = t and r.import_batch_id = v_batch.id;
  delete from public.demo_import_sources s where s.tenant_id = t and s.import_batch_id = v_batch.id;
  delete from public.demo_import_batches b where b.id = v_batch.id;
  delete from public.ingestion_jobs j where j.tenant_id = t and j.id = v_batch.ingestion_job_id;
  v_reads_after := pg_temp.shared_existing_reads(p);
  v_effects_after := pg_temp.shared_effects(p);
  select coalesce(array_agg(k.key order by k.key), '{}') into v_changed
    from jsonb_each(v_reads_before) k where v_reads_after->k.key is distinct from k.value;
  return jsonb_build_object('changed', true, 'restored', v_restored, 'removed', v_removed,
    'existingReads', jsonb_build_object('changed', to_jsonb(v_changed), 'before', v_reads_before, 'after', v_reads_after),
    'effects', jsonb_build_object('before', v_effects_before, 'after', v_effects_after));
end;
$revert$;
