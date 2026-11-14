-- Two reads Josef asked for on 2026-11-14.
--
-- "SSP assembly reads": the program's Controls tab (the SSP assembly, src/lib/ssp-assembly.ts) read
-- every column of the program's requirement records and of the SSP's, and joined them on screen
-- (6.4 MB in 68 requests on WS-X90). It now reads one SSP revision's controls in one request,
-- ssp_control_rows: each control
-- the SSP's stored baseline selects, in the baseline's order, with its recorded implementation (its
-- status, and whether its narrative is written), how many component contributions, requirements and
-- evidence versions stand behind it, the SSP's totals, the controls its elements' own baselines add
-- outside its selection, and what it was stored against. A control's preview reads what stands
-- behind that one control as it opens, ssp_control_detail: the records the screen assembles its
-- narrative, statements, contributions, requirements, evidence and accepted provider offerings
-- from, so the preview's words stay the screen's (assembleSsp) and the counts here follow the same
-- rules (supabase/tests/ssp_assembly_reads.sql checks what both answer; every control of every SSP
-- revision on the developer workspace read the same through them as through the screen's old reads).
--
-- "Page the objectives": the Assessment campaigns page's Objectives register reads one page at a
-- time from assessment_objective_rows. The view gains what the register shows and sorts by: the
-- campaign's and the plan's titles, the plan's version, and sort keys for the campaign's title, the
-- plan's title and the objective's title in a reader's order (natural_order: numbers by their
-- value, Step 2 before Step 10, as the screen's Intl.Collator ordered them), so the server orders
-- the register as the screen did (campaign, newest plan first, the catalog's reading order).
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The SSP assembly: one SSP revision's controls.
-- ---------------------------------------------------------------------------------------------
-- A requirement stands behind a control when it is linked to the control's narrative or to one of
-- its component contributions, or when it maps the control (or one of its parts: a statement, an
-- objective) on a system of the program inside the SSP's authorization boundary, or, mapping it on
-- no system, is allocated to one. Only the program's requirement revisions count. Evidence stands
-- behind it when it is linked to the control's narrative, to one of its statements or
-- contributions, or to a requirement that stands behind it; a version is counted once whether or
-- not the reader can read it.
create or replace function public.ssp_control_rows(p_ssp_revision_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_plan public.ssp_revisions;
  v_program uuid;
  -- The program's systems inside the SSP's authorization boundary.
  v_inside uuid[];
  answer jsonb;
begin
  select r.* into v_plan from public.ssp_revisions r where r.id = p_ssp_revision_id;
  if auth.uid() is null or v_plan.id is null then
    raise exception 'SSP access is required' using errcode = '42501';
  end if;
  select s.program_id into v_program from public.systems s where s.id = v_plan.system_id;
  v_inside := array(
    select s.id from public.systems s
    where s.program_id = v_program and s.boundary_system_id = v_plan.system_id
  );
  -- Each table is read once (row-level security checks every row a scan reads), and the small sets
  -- are matched by hash.
  with
  sel as materialized (
    select sc.id, sc.control_id, sc.ordinal
    from public.selected_controls sc
    where sc.profile_resolution_id = v_plan.profile_resolution_id
  ),
  impl as materialized (
    select i.id, i.selected_control_id, i.implementation_status,
      coalesce(i.description ~ '[^[:space:]]', false) as narrative
    from public.implemented_requirements i
    where i.ssp_revision_id = v_plan.id
  ),
  stmt as materialized (
    select st.id, st.implemented_requirement_id
    from public.implementation_statements st
    where st.ssp_revision_id = v_plan.id
  ),
  contrib as materialized (
    select c.id, c.implemented_requirement_id
    from public.component_contributions c
    where c.ssp_revision_id = v_plan.id
  ),
  -- The program's requirement revisions, each with its requirement.
  rev as materialized (
    select rr.id, rr.engineering_requirement_id
    from public.requirement_revisions rr
    join public.engineering_requirements e on e.id = rr.engineering_requirement_id
    where e.program_id = v_program
  ),
  -- The revisions allocated inside the boundary, for a mapping that names no system.
  allocated as materialized (
    select distinct a.requirement_revision_id
    from public.requirement_allocations a
    where coalesce(a.system_id, a.composition_node_id) = any(v_inside)
  ),
  -- A link has one target: the narrative or a contribution.
  linked as materialized (
    select coalesce(i1.selected_control_id, i2.selected_control_id) as selection_id,
      l.requirement_revision_id
    from public.requirement_implementations l
    left join impl i1 on i1.id = l.implemented_requirement_id
    left join contrib c on c.id = l.component_contribution_id
    left join impl i2 on i2.id = c.implemented_requirement_id
    where coalesce(i1.selected_control_id, i2.selected_control_id) is not null
  ),
  mapped as materialized (
    select sel.id as selection_id, m.requirement_revision_id
    from public.requirement_control_links m
    left join public.control_parts cp on cp.id = m.control_part_id
    join sel on sel.control_id = coalesce(m.control_id, cp.control_id)
    where case
      when m.system_id is not null then m.system_id = any(v_inside)
      else m.requirement_revision_id in (select allocated.requirement_revision_id from allocated)
    end
  ),
  supported as materialized (
    select s.selection_id, s.requirement_revision_id, rev.engineering_requirement_id
    from (select * from linked union select * from mapped) s
    join rev on rev.id = s.requirement_revision_id
  ),
  -- An evidence link has one target too: the narrative, a statement or a contribution.
  evidence as materialized (
    select coalesce(i1.selected_control_id, i2.selected_control_id, i3.selected_control_id)
        as selection_id,
      e.evidence_version_id
    from public.implementation_evidence e
    left join impl i1 on i1.id = e.implemented_requirement_id
    left join stmt st on st.id = e.implementation_statement_id
    left join impl i2 on i2.id = st.implemented_requirement_id
    left join contrib c on c.id = e.component_contribution_id
    left join impl i3 on i3.id = c.implemented_requirement_id
    where coalesce(i1.selected_control_id, i2.selected_control_id, i3.selected_control_id) is not null
    union
    select s.selection_id, re.evidence_version_id
    from public.requirement_evidence re
    join supported s on s.requirement_revision_id = re.requirement_revision_id
  ),
  -- The baseline each system inside the boundary resolves to now.
  eff as materialized (
    select b.id, b.system_id, b.profile_resolution_id
    from public.system_effective_baselines b
    where b.system_id = any(v_inside)
  ),
  -- What each of those baselines selects that this SSP does not, by code: each baseline once,
  -- however many systems resolve to it.
  beyond as materialized (
    select sc.profile_resolution_id, jsonb_agg(k.code order by sc.id) as codes
    from public.selected_controls sc
    join public.controls k on k.id = sc.control_id
    where sc.profile_resolution_id in (
        select eff.profile_resolution_id from eff
        where eff.profile_resolution_id <> v_plan.profile_resolution_id
      )
      and sc.control_id not in (select sel.control_id from sel)
    group by sc.profile_resolution_id
  ),
  contribution_count as (
    select c.implemented_requirement_id, count(*) as n from contrib c group by 1
  ),
  requirement_count as (
    select s.selection_id, count(distinct s.engineering_requirement_id) as n from supported s group by 1
  ),
  evidence_count as (
    select e.selection_id, count(distinct e.evidence_version_id) as n from evidence e group by 1
  )
  select jsonb_build_object(
    'ssp_revision_id', v_plan.id,
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sel.id,
        'control_id', sel.control_id,
        'code', k.code,
        'title', k.title,
        'implementation_id', i.id,
        'implementation_status', i.implementation_status,
        'narrative', coalesce(i.narrative, false),
        'contributions', coalesce(cc.n, 0),
        'requirements', coalesce(rc.n, 0),
        'evidence', coalesce(ec.n, 0)
      ) order by sel.ordinal, sel.id)
      from sel
      left join public.controls k on k.id = sel.control_id
      left join impl i on i.selected_control_id = sel.id
      left join contribution_count cc on cc.implemented_requirement_id = i.id
      left join requirement_count rc on rc.selection_id = sel.id
      left join evidence_count ec on ec.selection_id = sel.id
    ), '[]'::jsonb),
    -- Across every control: the requirements behind any of them, and the evidence versions.
    'requirements', (select count(distinct s.engineering_requirement_id) from supported s),
    'evidence', (select count(distinct e.evidence_version_id) from evidence e),
    -- The baseline the boundary resolves to now, when it is not the one this SSP stored.
    'boundary_differs', coalesce((
      select eff.profile_resolution_id is not null
        and eff.profile_resolution_id <> v_plan.profile_resolution_id
      from eff where eff.system_id = v_plan.system_id
    ), false),
    -- Each system inside the boundary whose own baseline selects controls this SSP does not.
    'gaps', coalesce((
      select jsonb_agg(jsonb_build_object('system_id', eff.system_id, 'name', s.name,
        'codes', beyond.codes) order by eff.id)
      from eff
      join public.systems s on s.id = eff.system_id
      join beyond on beyond.profile_resolution_id = eff.profile_resolution_id
    ), '[]'::jsonb),
    -- What the SSP was stored against: its profile's title, and whether it is an imported demo
    -- selection.
    'baseline_title', (
      select p.title
      from public.profile_resolutions pr
      join public.profile_revisions rv on rv.id = pr.profile_revision_id
      join public.profiles p on p.id = rv.profile_id
      where pr.id = v_plan.profile_resolution_id
    ),
    'imported_demo', coalesce((
      select pr.resolver_name = 'archived-demo-explicit-selection'
      from public.profile_resolutions pr where pr.id = v_plan.profile_resolution_id
    ), false)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.ssp_control_rows(uuid) from public, anon;
grant execute on function public.ssp_control_rows(uuid) to authenticated;
comment on function public.ssp_control_rows(uuid) is 'The program''s Controls tab (the SSP assembly) in one request: rows, each control the SSP revision''s stored baseline selects in the baseline''s order (id: the selection, control_id, code, title, implementation_id, implementation_status, narrative: whether its narrative is written, and how many contributions, requirements and evidence versions stand behind it); requirements and evidence, the distinct count across every control; boundary_differs, whether the boundary resolves to another baseline now; gaps, each system inside the boundary whose own baseline selects controls the SSP does not (system_id, name, codes); baseline_title and imported_demo. A requirement stands behind a control when it is linked to its narrative or a contribution, or maps the control or one of its parts on a system inside the boundary, or on none and allocated inside it; the program''s revisions only. Evidence: linked to the narrative, a statement, a contribution or such a requirement. Security invoker; an SSP the reader cannot read is refused.';

-- One control of an SSP revision, as its preview reads it: the records the screen assembles the
-- control from (assembleSsp in src/lib/ssp-assembly.ts), each scoped to that control. A record the
-- preview edits (the implementation, a statement, a contribution) comes with every column but the
-- lifecycle stamps, since the edit form starts from it, saves a column it was not given as empty,
-- and edits only a record of the reader's workspace; every other record with the columns the
-- preview draws.
create or replace function public.ssp_control_detail(p_ssp_revision_id uuid, p_selected_control_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_plan public.ssp_revisions;
  v_selection public.selected_controls;
  v_program uuid;
  v_implementation uuid;
  v_stamps constant text[] := array['created_at', 'updated_at', 'created_by', 'updated_by'];
  answer jsonb;
begin
  select r.* into v_plan from public.ssp_revisions r where r.id = p_ssp_revision_id;
  if auth.uid() is null or v_plan.id is null then
    raise exception 'SSP access is required' using errcode = '42501';
  end if;
  select sc.* into v_selection from public.selected_controls sc
  where sc.id = p_selected_control_id and sc.profile_resolution_id = v_plan.profile_resolution_id;
  if v_selection.id is null then
    raise exception 'This control is no longer in the SSP''s selection; reload and try again'
      using errcode = 'PT404';
  end if;
  select s.program_id into v_program from public.systems s where s.id = v_plan.system_id;
  select i.id into v_implementation from public.implemented_requirements i
  where i.ssp_revision_id = v_plan.id and i.selected_control_id = v_selection.id;
  with recursive
  stmt as materialized (
    select st.* from public.implementation_statements st
    where st.ssp_revision_id = v_plan.id and st.implemented_requirement_id = v_implementation
  ),
  contrib as materialized (
    select c.* from public.component_contributions c
    where c.ssp_revision_id = v_plan.id and c.implemented_requirement_id = v_implementation
  ),
  rev as materialized (
    select rr.id from public.requirement_revisions rr
    join public.engineering_requirements e on e.id = rr.engineering_requirement_id
    where e.program_id = v_program
  ),
  links as materialized (
    select l.id, l.requirement_revision_id, l.implemented_requirement_id,
      l.component_contribution_id, l.rationale
    from rev join public.requirement_implementations l on l.requirement_revision_id = rev.id
    where l.implemented_requirement_id = v_implementation
       or l.component_contribution_id in (select contrib.id from contrib)
  ),
  mappings as materialized (
    select m.id, m.requirement_revision_id, m.control_id, m.control_part_id, m.system_id,
      m.selected_control_id, m.rationale
    from rev
    join public.requirement_control_links m on m.requirement_revision_id = rev.id
    left join public.control_parts cp on cp.id = m.control_part_id
    where coalesce(m.control_id, cp.control_id) = v_selection.control_id
  ),
  candidate as materialized (
    select links.requirement_revision_id from links
    union
    select mappings.requirement_revision_id from mappings
  ),
  -- The statements' and the mappings' parts, with every part above them (eight levels at most, as
  -- the screen climbs), so a statement is numbered and a mapped part checked as a statement.
  climb (id, depth) as (
    select x.id, 0 from (
      select stmt.control_part_id as id from stmt
      union
      select mappings.control_part_id from mappings where mappings.control_part_id is not null
    ) x
    union
    select p.parent_part_id, climb.depth + 1
    from climb join public.control_parts p on p.id = climb.id
    where p.parent_part_id is not null and climb.depth < 8
  ),
  ievidence as materialized (
    select e.id, e.implemented_requirement_id, e.implementation_statement_id,
      e.component_contribution_id, e.evidence_version_id, e.claim, e.applicability_rationale
    from public.implementation_evidence e
    where e.implemented_requirement_id = v_implementation
       or e.implementation_statement_id in (select stmt.id from stmt)
       or e.component_contribution_id in (select contrib.id from contrib)
  ),
  revidence as materialized (
    select e.id, e.requirement_revision_id, e.evidence_version_id, e.claim, e.applicability_rationale
    from public.requirement_evidence e
    where e.requirement_revision_id in (select candidate.requirement_revision_id from candidate)
  ),
  version as materialized (
    select v.id, v.artifact_id, v.version_number, v.state, v.collected_at, v.published_at,
      v.expires_at, v.external_uri, v.media_type, v.byte_size, v.sha256, v.provenance,
      v.storage_object_name, v.storage_object_id
    from public.evidence_versions v
    where v.id in (
      select ievidence.evidence_version_id from ievidence
      union
      select revidence.evidence_version_id from revidence
    )
  ),
  acceptance as materialized (
    select a.id, a.implemented_requirement_id, a.offered_implementation_id, a.accepted_at,
      a.rationale, a.consumer_responsibility
    from public.inheritance_acceptances a
    where a.ssp_revision_id = v_plan.id and a.implemented_requirement_id = v_implementation
  ),
  offering as materialized (
    select o.id, o.name, o.component_contribution_id
    from public.offered_implementations o
    where o.id in (select acceptance.offered_implementation_id from acceptance)
  )
  select jsonb_build_object(
    'ssp_revision_id', v_plan.id,
    'selection', jsonb_build_object('id', v_selection.id, 'control_id', v_selection.control_id,
      'profile_resolution_id', v_selection.profile_resolution_id, 'ordinal', v_selection.ordinal),
    'control', (
      select jsonb_build_object('id', k.id, 'code', k.code, 'title', k.title)
      from public.controls k where k.id = v_selection.control_id
    ),
    'implementation', (
      select to_jsonb(i) - v_stamps from public.implemented_requirements i where i.id = v_implementation
    ),
    'statements', coalesce((
      select jsonb_agg(to_jsonb(stmt) - v_stamps order by stmt.id) from stmt
    ), '[]'::jsonb),
    'contributions', coalesce((
      select jsonb_agg(to_jsonb(contrib) - v_stamps order by contrib.id) from contrib
    ), '[]'::jsonb),
    -- The provider's contribution behind each offering the SSP accepted for the control.
    'offered_contributions', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id,
        'implemented_requirement_id', c.implemented_requirement_id,
        'system_component_id', c.system_component_id, 'description', c.description) order by c.id)
      from public.component_contributions c
      where c.id in (select offering.component_contribution_id from offering)
    ), '[]'::jsonb),
    'components', coalesce((
      select jsonb_agg(jsonb_build_object('id', sc.id, 'name', sc.name) order by sc.id)
      from public.system_components sc
      where sc.id in (select contrib.system_component_id from contrib)
    ), '[]'::jsonb),
    'component_elements', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'system_element_id', l.system_element_id,
        'link_source', l.link_source) order by l.id)
      from public.system_component_element_links l
      where l.id in (select contrib.system_component_id from contrib)
    ), '[]'::jsonb),
    'parts', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'control_id', p.control_id,
        'parent_part_id', p.parent_part_id, 'name', p.name, 'prose', p.prose, 'props', p.props,
        'source_id', p.source_id, 'title', p.title) order by p.id)
      from public.control_parts p
      where p.id in (select climb.id from climb)
    ), '[]'::jsonb),
    'requirement_links', coalesce((
      select jsonb_agg(to_jsonb(links) order by links.id) from links
    ), '[]'::jsonb),
    'control_mappings', coalesce((
      select jsonb_agg(to_jsonb(mappings) order by mappings.id) from mappings
    ), '[]'::jsonb),
    -- Where each mapped revision is allocated, for a mapping that names no system.
    'allocations', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id,
        'requirement_revision_id', a.requirement_revision_id, 'system_id', a.system_id,
        'composition_node_id', a.composition_node_id) order by a.id)
      from public.requirement_allocations a
      where a.requirement_revision_id in (select mappings.requirement_revision_id from mappings)
    ), '[]'::jsonb),
    'revisions', coalesce((
      select jsonb_agg(jsonb_build_object('id', rr.id,
        'engineering_requirement_id', rr.engineering_requirement_id, 'title', rr.title,
        'statement', rr.statement, 'acceptance_criteria', rr.acceptance_criteria,
        'state', rr.state) order by rr.id)
      from public.requirement_revisions rr
      where rr.id in (select candidate.requirement_revision_id from candidate)
    ), '[]'::jsonb),
    'requirements', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'code', e.code, 'program_id', e.program_id)
        order by e.id)
      from public.engineering_requirements e
      where e.id in (
        select rr.engineering_requirement_id from public.requirement_revisions rr
        where rr.id in (select candidate.requirement_revision_id from candidate)
      )
    ), '[]'::jsonb),
    'implementation_evidence', coalesce((
      select jsonb_agg(to_jsonb(ievidence) order by
        case when ievidence.implemented_requirement_id is not null then 0
             when ievidence.implementation_statement_id is not null then 1 else 2 end,
        ievidence.id)
      from ievidence
    ), '[]'::jsonb),
    'requirement_evidence', coalesce((
      select jsonb_agg(to_jsonb(revidence) order by revidence.id) from revidence
    ), '[]'::jsonb),
    'versions', coalesce((
      select jsonb_agg(to_jsonb(version) order by version.id) from version
    ), '[]'::jsonb),
    'artifacts', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title,
        'description', a.description, 'artifact_kind', a.artifact_kind,
        'owner_party_id', a.owner_party_id) order by a.id)
      from public.evidence_artifacts a
      where a.id in (select version.artifact_id from version)
    ), '[]'::jsonb),
    'acceptances', coalesce((
      select jsonb_agg(to_jsonb(acceptance) order by acceptance.id) from acceptance
    ), '[]'::jsonb),
    'offerings', coalesce((
      select jsonb_agg(to_jsonb(offering) order by offering.id) from offering
    ), '[]'::jsonb),
    -- The selection each mapping recorded, to tell a mapping made on another baseline.
    'source_selections', coalesce((
      select jsonb_agg(jsonb_build_object('id', sc.id, 'control_id', sc.control_id,
        'profile_resolution_id', sc.profile_resolution_id, 'ordinal', sc.ordinal) order by sc.id)
      from public.selected_controls sc
      where sc.id in (select mappings.selected_control_id from mappings)
    ), '[]'::jsonb),
    -- The baseline each mapping's system resolves to now.
    'effective_baselines', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'system_id', b.system_id,
        'profile_resolution_id', b.profile_resolution_id) order by b.id)
      from public.system_effective_baselines b
      where b.system_id in (select mappings.system_id from mappings)
    ), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.ssp_control_detail(uuid, uuid) from public, anon;
grant execute on function public.ssp_control_detail(uuid, uuid) to authenticated;
comment on function public.ssp_control_detail(uuid, uuid) is 'One control of an SSP revision as its preview reads it, scoped to that control: the selection and its control (code, title); its implementation, statements and contributions with every column but the lifecycle stamps, since the preview edits them; the provider contributions behind its accepted offerings; the components and their system elements; the statements'' and mappings'' control parts with every part above them; the requirement links on the implementation and its contributions and the program''s mappings of the control or its parts, with the mapped revisions'' allocations; those revisions and their requirements; the evidence links on the implementation, its statements and contributions and on those revisions, their versions and artifacts; the accepted offerings; the selections the mappings recorded and the baselines their systems resolve to now. The screen applies the boundary and baseline rules (assembleSsp). Security invoker; an SSP the reader cannot read is refused, and a control the SSP does not select is not found (PT404, which PostgREST answers 404).';

-- ---------------------------------------------------------------------------------------------
-- The objectives register: what it shows and sorts by.
-- ---------------------------------------------------------------------------------------------
-- Titles in a reader's order: ICU's, with numbers by their value (Step 2 before Step 10), as the
-- screens order them on the client (Intl.Collator with numeric).
create collation if not exists public.natural_order (provider = icu, locale = 'en-u-kn');
comment on collation public.natural_order is 'Text in a reader''s order: ICU''s English collation with numbers by their value (Step 2 before Step 10), as the screens order titles on the client (Intl.Collator, numeric). A register''s sort key for a title.';

-- Redefined from its definition in 20261114144406_plan_delta_by_objective with the same columns
-- first; the new ones follow: the campaign's title and its sort key, the plan's title, its version
-- and its sort key, and the objective's title's sort key. Nothing depends on the view, and it is
-- dropped first since its sort keys' collation is its own.
drop view if exists public.assessment_objective_rows;
create view public.assessment_objective_rows with (security_invoker = true) as
select o.*,
  pr.campaign_id,
  c.program_id,
  cp.name as target_kind,
  case when cp.name = 'assessment-objective' then coalesce(
    (select x->>'value' from jsonb_array_elements(cp.props) x where x->>'name' = 'label' limit 1), k.code)
  end as target_label,
  case when k.id is not null then (public.natural_sort_key(k.code) || ' ' || concat_ws('.',
    lpad(p6.ordinal::text, 6, '0'), lpad(p5.ordinal::text, 6, '0'), lpad(p4.ordinal::text, 6, '0'),
    lpad(p3.ordinal::text, 6, '0'), lpad(p2.ordinal::text, 6, '0'), lpad(p1.ordinal::text, 6, '0'),
    lpad(cp.ordinal::text, 6, '0'))) collate "C"
  end as reading_order,
  c.title as campaign_title,
  c.title collate public.natural_order as campaign_order,
  pr.title as plan_title,
  pr.version_number as plan_version,
  pr.title collate public.natural_order as plan_order,
  o.title collate public.natural_order as title_order
from public.assessment_objectives o
join public.assessment_plan_revisions pr on pr.tenant_id = o.tenant_id and pr.id = o.plan_revision_id
join public.assessment_campaigns c on c.tenant_id = pr.tenant_id and c.id = pr.campaign_id
left join public.control_parts cp on cp.id = o.target_control_part_id
left join public.controls k on k.id = cp.control_id
left join public.control_parts p1 on p1.id = cp.parent_part_id
left join public.control_parts p2 on p2.id = p1.parent_part_id
left join public.control_parts p3 on p3.id = p2.parent_part_id
left join public.control_parts p4 on p4.id = p3.parent_part_id
left join public.control_parts p5 on p5.id = p4.parent_part_id
left join public.control_parts p6 on p6.id = p5.parent_part_id;
revoke all on public.assessment_objective_rows from public, anon;
grant select on public.assessment_objective_rows to authenticated;
comment on view public.assessment_objective_rows is 'A campaign''s objectives as its Objectives collections read them: the Assessment campaigns page''s register a page at a time, a program''s tab and the campaign record whole. Every column of the objective, its plan''s campaign_id and that campaign''s program_id, target_kind (the kind of control part it is aimed at: assessment-objective, statement), target_label (an assessment objective''s label as SP 800-53A prints it, AC-08a.01), reading_order (the target''s place in the catalog''s reading order, compared character by character: the control''s code in natural order, then the part''s ordinal under each part above it; none without a control part), campaign_title, plan_title and plan_version, and sort keys in a reader''s order (campaign_order, plan_order, title_order: the titles in the natural_order collation, numbers by their value). The register''s own order: campaign_order, plan_version descending, plan_revision_id, reading_order, title_order. Security invoker.';

notify pgrst, 'reload schema';
