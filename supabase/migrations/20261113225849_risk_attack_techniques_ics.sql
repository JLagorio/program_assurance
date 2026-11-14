-- A risk may name an ATT&CK for ICS technique, and its record reads the controls that counter it.
--
-- Appendix G of NIST SP 800-160 Vol. 2 Rev. 1 analyses ATT&CK for Industrial Control Systems as
-- Appendix F analyses ATT&CK for Enterprise: for each technique, the mitigations and the cyber
-- resiliency approaches, effects and SP 800-53 controls that counter it. ATT&CK for ICS numbers
-- its own tactics, techniques and mitigations, so the appendix is read as a framework of its own,
-- nist-sp800-160v2r1-attack-ics, beside Appendix F's nist-sp800-160v2r1-attack
-- (docs/reference-seeding.md). Its rows name Table F-1's effects by title, as Appendix F's do.
--
-- Both statements replace a function of migration 20261111142000_risk_attack_techniques, keeping
-- its arguments and its answer's shape; each technique of the answer also names its framework.
-- Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- The link: an ATT&CK technique of either appendix, in a published revision of its framework. A
-- risk names a technique once, by its code in its framework.
-- ---------------------------------------------------------------------------------------------
create or replace function public.risk_attack_technique_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_item record;
begin
  if tg_op = 'UPDATE' and (new.risk_id is distinct from old.risk_id
    or new.framework_item_id is distinct from old.framework_item_id) then
    raise exception 'A technique link is removed and made again, never moved' using errcode = '23514';
  end if;
  select i.kind, i.code, i.tenant_id, r.state, r.framework_id, f.code as framework_code
    into v_item
  from public.framework_items i
  join public.framework_revisions r on r.id = i.framework_revision_id
  join public.frameworks f on f.id = r.framework_id
  where i.id = new.framework_item_id;
  if not found then
    raise exception 'Referenced record does not exist' using errcode = '23503';
  end if;
  if v_item.kind <> 'attack-technique'
    or v_item.framework_code not in ('nist-sp800-160v2r1-attack', 'nist-sp800-160v2r1-attack-ics')
    or v_item.tenant_id is not null or v_item.state <> 'published' then
    raise exception 'A risk names an ATT&CK technique of the published reference frameworks' using errcode = '23514';
  end if;
  -- The same item twice is the unique constraint's to refuse, or to pass over (on conflict).
  if exists (
    select 1 from public.risk_attack_techniques l
    join public.framework_items x on x.id = l.framework_item_id
    join public.framework_revisions xr on xr.id = x.framework_revision_id
    where l.tenant_id = new.tenant_id and l.risk_id = new.risk_id and l.id <> new.id
      and l.framework_item_id <> new.framework_item_id
      and xr.framework_id = v_item.framework_id and x.code = v_item.code
  ) then
    raise exception 'This risk already names %', v_item.code using errcode = '23505';
  end if;
  return new;
end;
$$;
revoke all on function public.risk_attack_technique_guard() from public, anon, authenticated;

comment on table public.risk_attack_techniques is 'An ATT&CK technique a risk concerns: one row a risk and a technique of the reference framework nist-sp800-160v2r1-attack (NIST SP 800-160 Vol. 2 Rev. 1, Appendix F, ATT&CK for Enterprise) or nist-sp800-160v2r1-attack-ics (Appendix G, ATT&CK for ICS). The link is the risk''s own, not an assessment''s: it is made and removed at any time.';
comment on column public.risk_attack_techniques.framework_item_id is 'The technique''s item in the framework revision the link was made from. A published revision is immutable, so the item stays; risk_threats names the technique by its code in the current revision of its framework.';

-- ---------------------------------------------------------------------------------------------
-- The read for the risk's record, over both appendices. A technique is named by its code in the
-- current revision of its own framework, with its tactics from that framework in the order of its
-- appendix's tables; its framework's code says which ATT&CK it belongs to, and Enterprise's
-- techniques are listed before ICS's, each in the order of their identifiers. A control is listed
-- once, with the techniques of the risk it counters, from either appendix, and, over every row
-- printed for them, the approaches in the order they are first printed and the effects in the
-- order of Table F-1, which defines the effects both appendices name.
--
-- The controls are those of the reading made against the program's catalog edition, else of the
-- reading the product reads; both appendices are read against the same catalog revision. The
-- standing is counted as before: in the baseline when a control baseline the program adopted
-- selects it, its requirements those of the program whose latest revision maps it, and a
-- requirement with evidence one whose latest revision cites an evidence version.
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
  return answer;
end; $$;
revoke all on function public.risk_threats(uuid, uuid) from public, anon;
grant execute on function public.risk_threats(uuid, uuid) to authenticated;
comment on function public.risk_threats(uuid, uuid) is 'What a risk concerns and what counters it: the ATT&CK techniques the risk names (code, title, framework and tactics, from the reference frameworks nist-sp800-160v2r1-attack, ATT&CK for Enterprise, and nist-sp800-160v2r1-attack-ics, ATT&CK for ICS), and the controls NIST SP 800-160 Vol. 2 Rev. 1 Appendices F and G print against them, each once in the catalog''s order with the techniques it counters, its approaches and its effects. For each control, where the risk''s program stands: in_baseline (a control baseline the program adopted selects it), requirements (the program''s requirements whose latest revision maps it) and evidenced (those whose latest revision cites an evidence version); empty where no standing can be said. loaded says whether the reference data is there; totals count the techniques, the controls and the controls in the baseline, with a requirement and with evidence.';
