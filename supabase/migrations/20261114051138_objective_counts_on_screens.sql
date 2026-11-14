-- How many of a control's assessment objectives a program's requirements cover, on the screens
-- that count requirements beside it.
--
-- A control's standing counts its objectives (20261114030116_objective_level_derivation, and
-- 20261114051136_objective_headings_count for the headings that print a sentence of their own):
-- program_control_status answers them for each control of a program's control baseline, which the
-- control's Details, the Control status view and the trace band read. Two screens count a control's
-- requirements where that read cannot answer without a read a row, and each gains the count from
-- the read it already makes or one beside it:
--
--   risk_threats              each control Appendix F or G prints against a risk's techniques, in
--                             the program's baseline or not, answers objectives (how many the
--                             control counts) and objectives_mapped (how many the program's
--                             requirements cover), counted by program_control_objective_cover as
--                             the control status counts them; empty where no standing can be said,
--                             as its requirements are. Its body is 20261113225849's, the counts
--                             merged into each control after it.
--   control_objective_counts  the catalog control's program table: for each program named, how many
--                             of the control's objectives it counts, and how many the program's
--                             requirements cover and cover with evidence, in one request for every
--                             row. A program the reader cannot read is refused.

-- ---------------------------------------------------------------------------------------------
-- What a risk concerns and what counters it, each countering control with its objectives counted.
-- ---------------------------------------------------------------------------------------------
create or replace function public.risk_threats(p_tenant_id uuid, p_risk_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  -- Appendix F and Appendix G, as the reference manifest names their frameworks; the first
  -- holds Table F-1's effects.
  v_frameworks constant text[] := array['nist-sp800-160v2r1-attack', 'nist-sp800-160v2r1-attack-ics'];
  v_effects constant text := 'nist-sp800-160v2r1-attack';
  v_program uuid;
  v_editions uuid[];
  v_catalog uuid;
  v_current uuid;
  v_loaded boolean;
  v_counted boolean;
  v_baseline boolean;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_risk_id is null then
    raise exception 'Name the risk' using errcode = '22023';
  end if;
  select k.program_id into v_program
  from public.risks k
  where k.tenant_id = p_tenant_id and k.id = p_risk_id;
  -- The catalog editions the program's control baselines were chosen on.
  select coalesce(array_agg(distinct c.catalog_revision_id), '{}') into v_editions
  from public.program_reference_choices c
  where c.tenant_id = p_tenant_id and c.program_id = v_program;
  -- The reading made against one of them, Appendix F's current one first.
  select r.catalog_revision_id into v_catalog
  from public.framework_revisions r
  join public.frameworks f on f.id = r.framework_id
  where f.code = any(v_frameworks) and f.tenant_id is null and r.state = 'published'
    and r.catalog_revision_id = any(v_editions)
  order by (r.id = f.current_revision_id) desc nulls last, (f.code = v_frameworks[1]) desc,
    r.created_at desc, r.id desc
  limit 1;
  select true, fr.catalog_revision_id into v_loaded, v_current
  from public.framework_rows fr
  where fr.code = any(v_frameworks) and fr.tenant_id is null
  order by (fr.code = v_frameworks[1]) desc
  limit 1;
  v_loaded := coalesce(v_loaded, false);
  v_catalog := coalesce(v_catalog, v_current);
  -- The program's records can be counted on these controls when they are of its own edition, or
  -- when it records none; it stands in a baseline only when it records one.
  v_counted := v_program is not null and v_catalog is not null
    and (cardinality(v_editions) = 0 or v_catalog = any(v_editions));
  v_baseline := v_counted and cardinality(v_editions) > 0;

  with
  tech as (
    select l.id as link_id, i.id as item_id, i.code, f.code as framework_code,
      coalesce(cur.title, i.title) as title,
      public.natural_sort_key(i.code) collate "C" as code_order
    from public.risk_attack_techniques l
    join public.framework_items i on i.id = l.framework_item_id
    join public.framework_revisions r on r.id = i.framework_revision_id
    join public.frameworks f on f.id = r.framework_id
    left join public.framework_item_rows cur
      on cur.framework_code = f.code and cur.tenant_id is null
     and cur.kind = 'attack-technique' and cur.code = i.code
    where l.tenant_id = p_tenant_id and l.risk_id = p_risk_id
  ),
  tactic as (
    select t.framework_code, t.code as technique_code, tl.target_code as code,
      tl.target_title as title, held.ordinal
    from tech t
    join public.framework_item_link_rows tl
      on tl.framework_code = t.framework_code and tl.tenant_id is null
     and tl.relation = 'tactic' and tl.source_code = t.code
    join public.framework_items held on held.id = tl.target_item_id
  ),
  -- Every row either appendix prints against one of the techniques, for a control of the reading.
  printed as (
    select s.control_id, s.control_code, s.control_title, s.item_code as technique_code,
      s.framework_code, s.props,
      public.natural_sort_key(s.source_identifier) collate "C" as place
    from public.framework_control_link_rows s
    join tech t on t.framework_code = s.framework_code and t.code = s.item_code
    where s.tenant_id is null and s.relation = 'mitigates'
      and s.catalog_revision_id = v_catalog and s.control_id is not null
  ),
  control as (
    select p.control_id as id, min(p.control_code) as code, min(p.control_title) as title
    from printed p
    group by p.control_id
  ),
  counters as (
    select distinct p.control_id, p.technique_code, p.framework_code from printed p
  ),
  -- A row names its approaches by reference: an item's code, or <framework code>:<item code> for
  -- an item of another framework, as the cyber resiliency approaches are.
  approach as (
    select p.control_id, a.code, a.title, min(p.place) as place, min(named.nth) as nth
    from printed p
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(p.props->'approaches') = 'array' then p.props->'approaches' else '[]'::jsonb end
    ) with ordinality as named(reference, nth)
    join public.framework_item_rows a
      on a.tenant_id is null
     and a.framework_code = case when position(':' in named.reference) > 0
       then split_part(named.reference, ':', 1) else p.framework_code end
     and a.code = case when position(':' in named.reference) > 0
       then substr(named.reference, position(':' in named.reference) + 1) else named.reference end
    group by p.control_id, a.code, a.title
  ),
  -- A row names its effects by title; Table F-1 orders them.
  effect as (
    select p.control_id, named.title, min(e.ordinal) as ordinal, min(p.place) as place, min(named.nth) as nth
    from printed p
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(p.props->'effects') = 'array' then p.props->'effects' else '[]'::jsonb end
    ) with ordinality as named(title, nth)
    left join public.framework_item_rows e
      on e.framework_code = v_effects and e.tenant_id is null and e.kind = 'effect' and e.title = named.title
    group by p.control_id, named.title
  ),
  -- The program's requirements whose latest revision maps each control.
  met as (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    where v_counted and l.tenant_id = p_tenant_id and q.program_id = v_program
      and l.control_id in (select id from control)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.tenant_id = p_tenant_id and re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- The controls a control baseline of the program selects: any of the baselines it adopted.
  selected as (
    select distinct sc.control_id
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    where v_baseline and c.tenant_id = p_tenant_id and c.program_id = v_program
      and sc.control_id in (select id from control)
  ),
  line as (
    select c.id, c.code, c.title, public.natural_sort_key(c.code) collate "C" as code_order,
      case when v_baseline then exists (select 1 from selected s where s.control_id = c.id) end as in_baseline,
      case when v_counted then (select count(distinct m.requirement_id) from met m
        where m.control_id = c.id) end as requirements,
      case when v_counted then (select count(distinct m.requirement_id) from met m
        where m.control_id = c.id and m.requirement_id in (select requirement_id from evidenced)) end as evidenced
    from control c
  )
  select jsonb_build_object(
    'risk_id', p_risk_id,
    'program_id', v_program,
    'loaded', v_loaded,
    'catalog_revision_id', v_catalog,
    'baseline', v_baseline,
    'techniques', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'link_id', t.link_id, 'item_id', t.item_id, 'code', t.code, 'title', t.title,
        'framework', t.framework_code,
        'tactics', (
          select coalesce(jsonb_agg(jsonb_build_object('code', x.code, 'title', x.title)
            order by x.ordinal, x.code), '[]'::jsonb)
          from tactic x where x.framework_code = t.framework_code and x.technique_code = t.code)
      ) order by array_position(v_frameworks, t.framework_code), t.code_order, t.link_id), '[]'::jsonb)
      from tech t),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title,
        'techniques', (
          select coalesce(jsonb_agg(k.technique_code
            order by array_position(v_frameworks, k.framework_code),
              public.natural_sort_key(k.technique_code) collate "C"), '[]'::jsonb)
          from counters k where k.control_id = l.id),
        'approaches', (
          select coalesce(jsonb_agg(jsonb_build_object('code', a.code, 'title', a.title)
            order by a.place, a.nth, a.code), '[]'::jsonb)
          from approach a where a.control_id = l.id),
        'effects', (
          select coalesce(jsonb_agg(e.title order by e.ordinal nulls last, e.place, e.nth, e.title), '[]'::jsonb)
          from effect e where e.control_id = l.id),
        'in_baseline', l.in_baseline, 'requirements', l.requirements, 'evidenced', l.evidenced
      ) order by l.code_order, l.id), '[]'::jsonb)
      from line l),
    'totals', jsonb_build_object(
      'techniques', (select count(*) from tech),
      'controls', (select count(*) from line),
      'in_baseline', case when v_baseline then (select count(*) from line where line.in_baseline) end,
      'with_requirement', case when v_counted then (select count(*) from line where line.requirements > 0) end,
      'with_evidence', case when v_counted then (select count(*) from line where line.evidenced > 0) end
    )
  ) into answer;
  -- How many of each control's assessment objectives the program's requirements cover, counted as
  -- its control status counts them (program_control_objective_cover), in one read for every
  -- control; empty where no standing can be said, as its requirements are.
  if v_counted and jsonb_array_length(answer->'controls') > 0 then
    with cover as (
      select o.control_id,
        count(distinct o.objective_id) as objectives,
        count(distinct o.objective_id) filter (where o.requirement_id is not null) as mapped
      from public.program_control_objective_cover(v_program,
        array(select (c->>'id')::uuid from jsonb_array_elements(answer->'controls') c)) o
      group by o.control_id
    )
    select jsonb_set(answer, '{controls}', jsonb_agg(c.line || jsonb_build_object(
        'objectives', coalesce(v.objectives, 0), 'objectives_mapped', coalesce(v.mapped, 0))
        order by c.n))
      into answer
    from jsonb_array_elements(answer->'controls') with ordinality c(line, n)
    left join cover v on v.control_id = (c.line->>'id')::uuid;
  else
    select jsonb_set(answer, '{controls}', coalesce(jsonb_agg(c.line || jsonb_build_object(
        'objectives', null, 'objectives_mapped', null) order by c.n), '[]'::jsonb))
      into answer
    from jsonb_array_elements(answer->'controls') with ordinality c(line, n);
  end if;
  return answer;
end; $$;

revoke all on function public.risk_threats(uuid, uuid) from public, anon;
grant execute on function public.risk_threats(uuid, uuid) to authenticated;
comment on function public.risk_threats(uuid, uuid) is 'What a risk concerns and what counters it: the ATT&CK techniques the risk names (code, title, framework and tactics, from the reference frameworks nist-sp800-160v2r1-attack, ATT&CK for Enterprise, and nist-sp800-160v2r1-attack-ics, ATT&CK for ICS), and the controls NIST SP 800-160 Vol. 2 Rev. 1 Appendices F and G print against them, each once in the catalog''s order with the techniques it counters, its approaches and its effects. For each control, where the risk''s program stands: in_baseline (a control baseline the program adopted selects it), requirements (the program''s requirements whose latest revision maps it), evidenced (those whose latest revision cites an evidence version), objectives (the assessment objectives the control counts) and objectives_mapped (those the program''s requirements cover, as program_control_status counts them); empty where no standing can be said. loaded says whether the reference data is there; totals count the techniques, the controls and the controls in the baseline, with a requirement and with evidence.';

-- ---------------------------------------------------------------------------------------------
-- One control's objectives, counted in each of the programs named: the catalog control's table.
-- ---------------------------------------------------------------------------------------------
create or replace function public.control_objective_counts(p_control_id uuid, p_program_ids uuid[])
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  if p_control_id is null then
    raise exception 'Name the control' using errcode = '22023';
  end if;
  -- A program the reader cannot read is refused, never answered as covering nothing.
  if exists (select 1 from unnest(coalesce(p_program_ids, '{}')) w(id)
      where not exists (select 1 from public.programs p where p.id = w.id)) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with
  program as (
    select distinct w.id from unnest(coalesce(p_program_ids, '{}')) w(id)
  ),
  -- Each program's coverage of the control, counted as its control status counts it.
  counted as (
    select p.id as program_id,
      count(distinct o.objective_id) as objectives,
      count(distinct o.objective_id) filter (where o.requirement_id is not null) as mapped,
      count(distinct o.objective_id) filter (where o.evidenced) as evidenced
    from program p
    cross join lateral public.program_control_objective_cover(p.id, array[p_control_id]) o
    group by p.id
  )
  select jsonb_build_object(
    'control_id', p_control_id,
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'program_id', p.id,
        'objectives', coalesce(k.objectives, 0),
        'objectives_mapped', coalesce(k.mapped, 0),
        'objectives_evidenced', coalesce(k.evidenced, 0)
      ) order by p.id)
      from program p
      left join counted k on k.program_id = p.id), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.control_objective_counts(uuid, uuid[]) from public, anon;
grant execute on function public.control_objective_counts(uuid, uuid[]) to authenticated;
comment on function public.control_objective_counts(uuid, uuid[]) is 'One control''s assessment objectives counted in each program named, for the catalog control''s table of the workspace''s programs: objectives (how many the control counts: its leaves and each heading that prints a sentence of its own), objectives_mapped (how many the program''s requirements, at their latest revision, cover) and objectives_evidenced (how many are covered by one that cites evidence), counted as program_control_status counts them (program_control_objective_cover). A control with no objective counts none. Security invoker: a program the reader cannot read is refused.';

notify pgrst, 'reload schema';
