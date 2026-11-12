-- A risk names the ATT&CK techniques it concerns, and its record reads which of the controls that
-- counter those techniques its program holds.
--
-- Appendix F of NIST SP 800-160 Vol. 2 Rev. 1 lists, for each ATT&CK technique, the mitigations and
-- the cyber resiliency approaches, effects and SP 800-53 controls that counter it. It is read as
-- the reference framework nist-sp800-160v2r1-attack (migration 20261111130000_reference_frameworks).
-- Until now a risk's threat was one line of text on its assessment (risk_revisions.threat), which
-- stays where it is.
--
-- The link belongs to the risk, as a task's link to a risk does (task_risks). It is not content of
-- one assessment revision: publishing an assessment does not freeze it, and a member who may write
-- makes and removes it at any time.
--
-- Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- The link: one row a risk and a technique.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.risk_attack_techniques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  risk_id uuid not null,
  framework_item_id uuid not null references public.framework_items(id),
  unique (tenant_id, id),
  foreign key (tenant_id, risk_id) references public.risks(tenant_id, id) on delete restrict,
  unique (tenant_id, risk_id, framework_item_id)
);

-- The tenancy, the audit columns and the reference guard a risk's other link tables have, through
-- the helpers that give them: each is called once, since the helpers create and do not replace.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'risk_attack_techniques' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('risk_attack_techniques');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.risk_attack_techniques'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('risk_attack_techniques', false);
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.risk_attack_techniques'::regclass and tgname = 'reference_tenant_framework_item_id' and not tgisinternal) then
    perform public.attach_reference_tenant_guard('risk_attack_techniques', 'framework_item_id', 'framework_items');
  end if;
end $$;
create index if not exists risk_attack_techniques_item_idx on public.risk_attack_techniques(framework_item_id);

-- What the foreign keys cannot say. The item is an ATT&CK technique of the shared framework, in a
-- published revision, which is immutable: the link keeps the item it was made from. An item keeps
-- its code from one reading of the publication to the next, so the same technique read again is
-- the same technique, and a risk names it once.
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
  if v_item.kind <> 'attack-technique' or v_item.framework_code <> 'nist-sp800-160v2r1-attack'
    or v_item.tenant_id is not null or v_item.state <> 'published' then
    raise exception 'A risk names an ATT&CK technique of the published reference framework' using errcode = '23514';
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
create or replace trigger risk_attack_technique_guard before insert or update on public.risk_attack_techniques
  for each row execute function public.risk_attack_technique_guard();

comment on table public.risk_attack_techniques is 'An ATT&CK technique a risk concerns: one row a risk and a technique of the reference framework nist-sp800-160v2r1-attack (NIST SP 800-160 Vol. 2 Rev. 1, Appendix F). The link is the risk''s own, not an assessment''s: it is made and removed at any time.';
comment on column public.risk_attack_techniques.framework_item_id is 'The technique''s item in the framework revision the link was made from. A published revision is immutable, so the item stays; risk_threats names the technique by its code in the revision the product reads.';

-- ---------------------------------------------------------------------------------------------
-- The read for the risk's record: its techniques, the controls Appendix F prints against them and
-- where the risk's program stands on each. It runs as the caller, so row-level security decides
-- every row: nothing here widens what a member may see. Only the shared framework is read, the one
-- the importer writes.
--
-- A technique is named by its code in the framework's current revision, with its tactics in the
-- order of the appendix's tables. A control is listed once, with the techniques of the risk it
-- counters and, over every row printed for them under any tactic, the approaches in the order they
-- are first printed and the effects in the order of Table F-1.
--
-- The controls are those of the reading made against the program's catalog edition, else of the
-- reading the product reads. The standing is counted as the product already counts it for a
-- control: in the baseline when a control baseline the program adopted selects it
-- (program_reference_choices, selected_controls), its requirements those of the program whose
-- latest revision maps it (program_control_requirement_counts), and a requirement with evidence
-- one whose latest revision cites an evidence version (assurance_trace). A risk with no program,
-- or a program on an edition the appendix was not read against, answers the controls without a
-- standing; a program that records no baseline answers no in_baseline.
-- ---------------------------------------------------------------------------------------------
create or replace function public.risk_threats(p_tenant_id uuid, p_risk_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  -- Appendix F, as the reference manifest names its framework.
  v_framework constant text := 'nist-sp800-160v2r1-attack';
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
  -- The reading made against one of them, the framework's current one first.
  select r.catalog_revision_id into v_catalog
  from public.framework_revisions r
  join public.frameworks f on f.id = r.framework_id
  where f.code = v_framework and f.tenant_id is null and r.state = 'published'
    and r.catalog_revision_id = any(v_editions)
  order by (r.id = f.current_revision_id) desc nulls last, r.created_at desc, r.id desc
  limit 1;
  select true, fr.catalog_revision_id into v_loaded, v_current
  from public.framework_rows fr
  where fr.code = v_framework and fr.tenant_id is null;
  v_loaded := coalesce(v_loaded, false);
  v_catalog := coalesce(v_catalog, v_current);
  -- The program's records can be counted on these controls when they are of its own edition, or
  -- when it records none; it stands in a baseline only when it records one.
  v_counted := v_program is not null and v_catalog is not null
    and (cardinality(v_editions) = 0 or v_catalog = any(v_editions));
  v_baseline := v_counted and cardinality(v_editions) > 0;

  with
  tech as (
    select l.id as link_id, i.id as item_id, i.code,
      coalesce(cur.title, i.title) as title,
      public.natural_sort_key(i.code) collate "C" as code_order
    from public.risk_attack_techniques l
    join public.framework_items i on i.id = l.framework_item_id
    left join public.framework_item_rows cur
      on cur.framework_code = v_framework and cur.tenant_id is null
     and cur.kind = 'attack-technique' and cur.code = i.code
    where l.tenant_id = p_tenant_id and l.risk_id = p_risk_id
  ),
  tactic as (
    select t.code as technique_code, tl.target_code as code, tl.target_title as title, held.ordinal
    from tech t
    join public.framework_item_link_rows tl
      on tl.framework_code = v_framework and tl.tenant_id is null
     and tl.relation = 'tactic' and tl.source_code = t.code
    join public.framework_items held on held.id = tl.target_item_id
  ),
  -- Every row the appendix prints against one of the techniques, for a control of the reading.
  printed as (
    select s.control_id, s.control_code, s.control_title, s.item_code as technique_code, s.props,
      public.natural_sort_key(s.source_identifier) collate "C" as place
    from public.framework_control_link_rows s
    where s.framework_code = v_framework and s.tenant_id is null and s.relation = 'mitigates'
      and s.catalog_revision_id = v_catalog and s.control_id is not null
      and s.item_code in (select code from tech)
  ),
  control as (
    select p.control_id as id, min(p.control_code) as code, min(p.control_title) as title
    from printed p
    group by p.control_id
  ),
  counters as (
    select distinct p.control_id, p.technique_code from printed p
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
       then split_part(named.reference, ':', 1) else v_framework end
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
      on e.framework_code = v_framework and e.tenant_id is null and e.kind = 'effect' and e.title = named.title
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
        'tactics', (
          select coalesce(jsonb_agg(jsonb_build_object('code', x.code, 'title', x.title)
            order by x.ordinal, x.code), '[]'::jsonb)
          from tactic x where x.technique_code = t.code)
      ) order by t.code_order, t.link_id), '[]'::jsonb)
      from tech t),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title,
        'techniques', (
          select coalesce(jsonb_agg(k.technique_code
            order by public.natural_sort_key(k.technique_code) collate "C"), '[]'::jsonb)
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
comment on function public.risk_threats(uuid, uuid) is 'What a risk concerns and what counters it: the ATT&CK techniques the risk names (code, title and tactics, from the reference framework nist-sp800-160v2r1-attack), and the controls NIST SP 800-160 Vol. 2 Rev. 1 Appendix F prints against them, each once in the catalog''s order with the techniques it counters, its approaches and its effects. For each control, where the risk''s program stands: in_baseline (a control baseline the program adopted selects it), requirements (the program''s requirements whose latest revision maps it) and evidenced (those whose latest revision cites an evidence version); empty where no standing can be said. loaded says whether the reference data is there; totals count the techniques, the controls and the controls in the baseline, with a requirement and with evidence.';
