-- Open CVEs while in use: a CVE stays open, and counted, while any consumer still runs an affected
-- version, after the fix is published (Josef, proposal decision 16, 2026-11-16; approved for the
-- build 2026-11-17).
--
-- The components register counted the CVEs that affect the version it lists, its definition's
-- latest published version, through that version's standing SBOM. Once a version 2 whose SBOM marks
-- the CVE fixed was published, the register read no CVE open though every program built from
-- version 1 still ran it. It now counts each CVE once that affects a version still in use: the
-- listed version, and every version a consumer is built from, a product element of a product's
-- current version (as the register's Products count) or a system component (as its Programs count).
-- A CVE that affects only versions nobody runs any more is not counted.
--
-- component_consumers' own vulnerabilities_open, the component's count beside its findings_open and
-- offers_open, counted the version asked for alone; it now counts as the register does, whichever
-- version names the component. The counts that belong to one version stay as they were:
-- component_consumers' product and system lines and system_upstream's components count the version
-- each took, system_upstream's total each CVE once across what the system takes,
-- component_version_review the version taken and the latest, and component_vulnerabilities the
-- version asked for. vulnerability_rows, one row a CVE, counts the component versions it affects,
-- used or not.
--
-- The register keeps every column, by name, order and type; only vulnerabilities_open's value
-- changes. component_consumers keeps every key. Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The components register: the live body of 20261115172957_component_versions, with the CVEs open
-- on each version still in use.
-- ---------------------------------------------------------------------------------------------
create or replace view public.component_rows with (security_invoker = true) as
with
head as (
  select distinct on (r.tenant_id, r.component_definition_id)
    r.tenant_id, r.component_definition_id, r.id, r.version_number, r.state, r.published_at
  from public.component_definition_revisions r
  order by r.tenant_id, r.component_definition_id, (r.state = 'published') desc, r.version_number desc
),
versions as (
  select r.tenant_id, r.id, r.component_definition_id,
    (select count(*) from public.component_definition_revisions n
      where n.tenant_id = r.tenant_id and n.component_definition_id = r.component_definition_id
        and n.state = 'published' and n.version_number > r.version_number) as behind
  from public.component_definition_revisions r
),
-- Every version of each listed component: the components of its name in its definition.
member as (
  select c.id as head_id, o.id as defined_component_id, v.behind
  from head h
  join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
  join versions v on v.tenant_id = h.tenant_id and v.component_definition_id = h.component_definition_id
  join public.defined_components o
    on o.tenant_id = v.tenant_id and o.component_definition_revision_id = v.id and o.name = c.name
),
product_use as (
  select m.head_id, count(distinct pr.product_id) as products,
    count(*) filter (where m.behind > 0) as behind
  from member m
  join public.product_elements pe on pe.defined_component_id = m.defined_component_id
  join public.product_revisions pr on pr.tenant_id = pe.tenant_id and pr.id = pe.product_revision_id
  where pr.id = (select c.id from public.product_revisions c
    where c.tenant_id = pr.tenant_id and c.product_id = pr.product_id
    order by (c.state = 'published') desc, c.version_number desc limit 1)
  group by m.head_id
),
system_use as (
  select m.head_id, count(distinct b.program_id) as programs,
    count(*) filter (where m.behind > 0) as behind,
    count(*) filter (where e.product_change_kinds is not null) as modified
  from member m
  join public.system_components sc on sc.defined_component_id = m.defined_component_id
  join public.systems b on b.tenant_id = sc.tenant_id and b.id = sc.system_id
  left join public.system_component_element_links k on k.tenant_id = sc.tenant_id and k.id = sc.id
  join public.systems e on e.tenant_id = sc.tenant_id and e.id = coalesce(k.system_element_id, sc.system_id)
  group by m.head_id
),
-- Where each listed component stands (component_standing_lines): a determination carried forward
-- from an earlier version counts among those that stand, and a control a change left to review is
-- counted apart. The assessment named is the version's own newest, else the newest one a carried
-- determination came from.
lines as (
  select l.defined_component_id, l.status, l.component_assessment_id, l.to_review, l.carried_from_version
  from public.component_standing_lines(array(
    select c.id from head h
    join public.defined_components c
      on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id)) l
),
standing as (
  select l.defined_component_id,
    count(*) filter (where l.component_assessment_id is not null) as determined,
    count(*) filter (where l.status = 'satisfied') as satisfied,
    count(*) filter (where l.status = 'partially_satisfied') as partially_satisfied,
    count(*) filter (where l.status = 'other_than_satisfied') as other_than_satisfied,
    count(*) filter (where l.to_review) as to_review,
    (array_agg(l.component_assessment_id
        order by (l.carried_from_version is null) desc, a.published_at desc, l.component_assessment_id desc)
      filter (where l.component_assessment_id is not null))[1] as assessment_id
  from lines l
  left join public.component_assessments a on a.id = l.component_assessment_id
  group by l.defined_component_id
),
claimed as (
  select i.defined_component_id, count(distinct i.control_id) as controls
  from public.defined_component_implementations i
  where i.control_id is not null
  group by i.defined_component_id
),
waiting as (
  select m.head_id, count(*) as offers
  from member m
  join public.component_offers o on o.defined_component_id = m.defined_component_id and o.state = 'offered'
  group by m.head_id
),
-- The versions of each listed component still in use: the listed version itself, and every version
-- a consumer is built from, a product element of a product's current version or a system component.
-- A version nobody runs any more, past the listed one, is not.
in_use as (
  select m.head_id, m.defined_component_id
  from member m
  where m.defined_component_id = m.head_id
    or exists (select 1 from public.system_components sc where sc.defined_component_id = m.defined_component_id)
    or exists (select 1 from public.product_elements pe
      join public.product_revisions pr on pr.tenant_id = pe.tenant_id and pr.id = pe.product_revision_id
      where pe.defined_component_id = m.defined_component_id
        and pr.id = (select c.id from public.product_revisions c
          where c.tenant_id = pr.tenant_id and c.product_id = pr.product_id
          order by (c.state = 'published') desc, c.version_number desc limit 1))
),
-- A CVE stays open while any of them carries it, after a newer version holds the fix: each CVE once.
exposure as (
  select u.head_id, count(distinct x.vulnerability_id) as vulnerabilities
  from in_use u
  join public.component_open_vulnerabilities(null) x on x.defined_component_id = u.defined_component_id
  group by u.head_id
)
select c.id, c.tenant_id, c.name, c.component_type, c.description, c.supplier_party_id,
  d.id as component_definition_id, d.code as definition_code, d.name as definition_name, d.category,
  h.id as component_definition_revision_id, h.version_number as version, h.state, h.published_at,
  coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id, owner.name as owner_name,
  d.business_line_id, line.code as business_line_code, line.name as business_line_name,
  coalesce(pu.products, 0) as products,
  coalesce(su.programs, 0) as programs,
  coalesce(pu.behind, 0) + coalesce(su.behind, 0) as consumers_behind,
  coalesce(su.modified, 0) as consumers_modified,
  st.assessment_id, a.title as assessment_title, a.completed_on as assessed_on,
  a.published_at as assessment_published_at,
  coalesce(cl.controls, 0) as controls_claimed,
  coalesce(st.determined, 0) as controls_determined,
  coalesce(st.satisfied, 0) as controls_satisfied,
  coalesce(st.partially_satisfied, 0) as controls_partially_satisfied,
  coalesce(st.other_than_satisfied, 0) as controls_other_than_satisfied,
  c.revision, c.created_at, c.updated_at, c.created_by, c.updated_by,
  coalesce(wt.offers, 0) as offers_open,
  coalesce(ex.vulnerabilities, 0) as vulnerabilities_open,
  coalesce(st.to_review, 0) as controls_to_review
from head h
join public.component_definitions d on d.tenant_id = h.tenant_id and d.id = h.component_definition_id
join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
left join public.component_owners named
  on named.tenant_id = d.tenant_id and named.component_definition_id = d.id and named.component_name = c.name
left join public.parties owner on owner.id = coalesce(named.owner_party_id, d.owner_party_id)
left join public.business_lines line on line.id = d.business_line_id
left join product_use pu on pu.head_id = c.id
left join system_use su on su.head_id = c.id
left join standing st on st.defined_component_id = c.id
left join public.component_assessments a on a.id = st.assessment_id
left join claimed cl on cl.defined_component_id = c.id
left join waiting wt on wt.head_id = c.id
left join exposure ex on ex.head_id = c.id;
grant select on public.component_rows to authenticated;
revoke all on public.component_rows from public, anon;
comment on view public.component_rows is 'The components register, one row a component of each component definition''s latest published version (else its latest): its definition by code and name, its type, version and state, its effective owner (its own, else its set''s) and business line by name, how many products (by their current version) and programs use it in any version, how many of those consumers took an older version than the latest published one (consumers_behind) or sit on an inherited element the program declared modified (consumers_modified), and this version''s standing as component_standing_lines counts it: the controls it claims, how many hold a published determination, its own or one carried forward from an earlier version, and how many of those are satisfied, with the published assessment they were taken from (the version''s own newest, else the newest one a carried determination came from), how many offers wait on its owner for any of its versions (offers_open), and how many CVEs are open on it (vulnerabilities_open: each CVE once that a component of the standing SBOM carries in the state affected, of this version or of any version a consumer is built from, a product element of a product''s current version or a system component, so a CVE stays open while any consumer still runs an affected version, after a newer version holds the fix), and how many controls an earlier version was judged on that a change left to review in this one (controls_to_review).';

-- ---------------------------------------------------------------------------------------------
-- Where used: the live body of 20261115140023_component_inheritance, with the component's own count
-- of open CVEs taken as the register takes it.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_consumers(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_latest public.component_definition_revisions;
  v_tenant uuid;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  v_tenant := v_component.tenant_id;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_tenant and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_tenant and id = v_revision.component_definition_id;
  select * into v_latest from public.component_definition_revisions r
    where r.tenant_id = v_tenant and r.component_definition_id = v_definition.id and r.state = 'published'
    order by r.version_number desc limit 1;
  with
  lineage as materialized (
    select * from public.component_lineage(p_defined_component_id)
  ),
  product_rows as materialized (
    select pe.id as element_id, pe.code as element_code, pe.name as element_name,
      pr.id as product_revision_id, pr.version_number as product_version, pr.state as product_state,
      p.id as product_id, p.code as product_code, p.name as product_name, p.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      pr.id = (select c.id from public.product_revisions c
        where c.tenant_id = v_tenant and c.product_id = p.id
        order by (c.state = 'published') desc, c.version_number desc limit 1) as is_current,
      (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name) order by c.code, c.id), '[]'::jsonb)
        from public.product_configuration_elements m
        join public.product_configurations c on c.tenant_id = m.tenant_id and c.id = m.product_configuration_id
        where m.tenant_id = v_tenant and m.product_revision_id = pr.id and m.product_element_id = pe.id) as configurations
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_revisions pr on pr.tenant_id = v_tenant and pr.id = pe.product_revision_id
    join public.products p on p.tenant_id = v_tenant and p.id = pr.product_id
  ),
  system_rows as materialized (
    select sc.id as system_component_id, sc.code as component_code, sc.name as component_name,
      sc.version as component_version,
      b.id as system_id, b.code as system_code, b.name as system_name,
      e.id as element_id, e.code as element_code, e.name as element_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds, e.product_change_rationale as change_rationale,
      pin.pin
    from lineage l
    join public.system_components sc on sc.tenant_id = v_tenant and sc.defined_component_id = l.defined_component_id
    join public.systems b on b.tenant_id = v_tenant and b.id = sc.system_id
    -- The element a component sits on is the one it names or, where it names none, the one a
    -- single inventory relationship gives it (system_component_element_links); else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
  ),
  -- A variant whose configuration includes an element built from the component and that holds no
  -- element for it: the program left it out.
  removed_rows as materialized (
    select b.id as system_id, b.code as system_code, b.name as system_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      pe.id as product_element_id, pe.code as element_code, pe.name as element_name,
      l.defined_component_id, l.version_number as version, l.behind
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_configuration_elements m
      on m.tenant_id = v_tenant and m.product_revision_id = pe.product_revision_id and m.product_element_id = pe.id
    join public.systems b
      on b.tenant_id = v_tenant and b.product_revision_id = m.product_revision_id
      and b.product_configuration_id = m.product_configuration_id and b.is_authorization_boundary
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    where not exists (select 1 from public.systems s
      where s.tenant_id = v_tenant and s.boundary_system_id = b.id and s.product_element_id = pe.id)
  ),
  -- The findings that stand on a version of the component: each issue of an accepted offer.
  found as materialized (
    select o.id as offer_id, i.id as item_id, o.defined_component_id, l.version_number as version,
      o.reviewed_at as accepted_at, o.program_id as source_program_id, i.issue_id as source_issue_id,
      src.title, src.severity
    from lineage l
    join public.component_offers o
      on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id
      and o.kind = 'finding' and o.state = 'accepted'
    join public.component_offer_items i on i.tenant_id = v_tenant and i.component_offer_id = o.id
    join public.operational_issues src on src.tenant_id = v_tenant and src.id = i.issue_id
  ),
  -- Each program's own issue for a finding that stands, and whether it is still open.
  held as materialized (
    select f.offer_id, f.item_id, f.defined_component_id, k.program_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at, x.status not in ('resolved', 'closed') as open
    from found f
    join public.component_offer_issues k on k.tenant_id = v_tenant and k.component_offer_item_id = f.item_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
  ),
  -- The CVEs that affect each version of the component, through its standing SBOM.
  affected as materialized (
    select x.defined_component_id, x.vulnerability_id
    from public.component_open_vulnerabilities(array(select l.defined_component_id from lineage l)) x
  ),
  exposure as materialized (
    select a.defined_component_id, count(*) as vulnerabilities
    from affected a
    group by a.defined_component_id
  ),
  -- The versions still in use, as component_rows counts them: the newest version, and every version
  -- a consumer is built from, a product element of a product's current version or a system component.
  in_use as materialized (
    select n.defined_component_id
    from (select l.defined_component_id from lineage l
      order by (l.state = 'published') desc, l.version_number desc limit 1) n
    union
    select r.defined_component_id from product_rows r where r.is_current
    union
    select r.defined_component_id from system_rows r
  ),
  -- The controls each version of the component is judged on.
  judged as materialized (
    select l.defined_component_id, l.control_id
    from public.component_standing_lines(array(select l.defined_component_id from lineage l)) l
    where l.component_assessment_id is not null
  ),
  -- Of those, the ones each element that holds the component inherits (program_element_inheritance)
  -- and its control baseline selects.
  inherit as materialized (
    select distinct i.element_id, i.control_id
    from (select distinct r.program_id from system_rows r) g
    cross join lateral public.program_element_inheritance(
      g.program_id, array(select distinct j.control_id from judged j)) i
    where exists (select 1 from public.system_effective_baselines b
      join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
      where b.tenant_id = v_tenant and b.system_id = i.element_id and sc.control_id = i.control_id)
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id),
      'definition_owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- The definition's latest published version, and the component of this name in it.
    'latest', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number,
      'defined_component_id', (select l.defined_component_id from lineage l
        where l.component_definition_revision_id = v_latest.id order by l.defined_component_id limit 1)) end,
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_id', r.product_id, 'product_code', r.product_code, 'product_name', r.product_name,
        'business_line_id', r.business_line_id,
        'product_revision_id', r.product_revision_id, 'product_version', r.product_version,
        'product_state', r.product_state, 'current', r.is_current,
        'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
        'configurations', r.configurations,
        'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
        'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
          where e.defined_component_id = r.defined_component_id), 0)
      ) order by r.product_code, r.product_version desc, r.element_code, r.element_id), '[]'::jsonb)
      from product_rows r),
    'systems', (
      select coalesce(jsonb_agg(x.line order by x.program_code, x.system_code, x.element_code, x.id), '[]'::jsonb)
      from (
        select r.program_code, r.system_code, r.element_code, r.system_component_id as id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', r.system_component_id, 'component_code', r.component_code,
          'component_name', r.component_name, 'component_version', r.component_version,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', r.pin,
          'change', r.change, 'change_kinds', coalesce(to_jsonb(r.change_kinds), '[]'::jsonb),
          'change_rationale', r.change_rationale,
          -- The program's own open issues for the findings that stand on the version it took.
          'findings', (select coalesce(jsonb_agg(jsonb_build_object(
              'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
              'status', h.status, 'opened_at', h.opened_at, 'source', h.source
            ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
            from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          'findings_open', (select count(*) from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          -- The CVEs that affect the version it took.
          'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
            where e.defined_component_id = r.defined_component_id), 0),
          -- How many controls the version it took is judged on, and how many of them its element
          -- inherits: those its control baseline selects, on an element the program did not
          -- declare modified and that holds nothing but judged library components.
          'controls_judged', (select count(*) from judged j where j.defined_component_id = r.defined_component_id),
          'controls_inherited', (select count(*) from judged j
            join inherit i on i.element_id = r.element_id and i.control_id = j.control_id
            where j.defined_component_id = r.defined_component_id)) as line
        from system_rows r
        union all
        select r.program_code, r.system_code, r.element_code, r.product_element_id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', null, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', null, 'component_code', null,
          'component_name', null, 'component_version', null,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', null,
          'change', 'removed', 'change_kinds', '[]'::jsonb, 'change_rationale', null,
          'findings', '[]'::jsonb, 'findings_open', 0, 'vulnerabilities_open', 0,
          'controls_judged', (select count(*) from judged j where j.defined_component_id = r.defined_component_id),
          'controls_inherited', 0)
        from removed_rows r
      ) x),
    -- The findings that stand on a version of the component, the newest first.
    'findings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'offer_id', f.offer_id, 'item_id', f.item_id, 'title', f.title, 'severity', f.severity,
        'defined_component_id', f.defined_component_id, 'version', f.version, 'accepted_at', f.accepted_at,
        'source_program_id', f.source_program_id, 'source_issue_id', f.source_issue_id,
        'programs', (select count(*) from held h where h.item_id = f.item_id),
        'programs_open', (select count(*) from held h where h.item_id = f.item_id and h.open)
      ) order by f.accepted_at desc, f.item_id), '[]'::jsonb)
      from found f),
    'totals', jsonb_build_object(
      'products', (select count(distinct r.product_id) from product_rows r where r.is_current),
      'product_elements', (select count(*) from product_rows),
      'programs', (select count(distinct r.program_id) from system_rows r),
      'systems', (select count(distinct r.system_id) from system_rows r),
      'system_components', (select count(*) from system_rows),
      'behind', (select count(*) from product_rows r where r.is_current and r.behind > 0)
        + (select count(*) from system_rows r where r.behind > 0),
      'modified', (select count(*) from system_rows r where r.change = 'modified'),
      'removed', (select count(*) from removed_rows)),
    -- How many of those findings some program still holds open, and how many offers wait on the
    -- component's owner, for any of its versions.
    'findings_open', (select count(*) from found f
      where exists (select 1 from held h where h.item_id = f.item_id and h.open)),
    'offers_open', (select count(*) from lineage l
      join public.component_offers o
        on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id and o.state = 'offered'),
    -- How many CVEs are open on the component, whichever version names it: each CVE once that
    -- affects a version still in use, so one stays open while a consumer still runs an affected
    -- version, after a newer version holds the fix.
    'vulnerabilities_open', (select count(distinct a.vulnerability_id) from affected a
      where a.defined_component_id in (select u.defined_component_id from in_use u))
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_consumers(uuid) from public, anon;
grant execute on function public.component_consumers(uuid) to authenticated;
comment on function public.component_consumers(uuid) is 'Where a library component is used, followed by its name through every version of its definition: each product element pinned to it (its product and version, whether that is the product''s current version, the configurations that include it) and each system component built from it (its program, system and element, its pin in the system''s latest configuration baseline, whether the program declared the inherited element modified), each with the version taken and how many published versions of the definition are newer (behind); a variant that left the element out is listed as removed. Totals count a product by its current version. The component''s owner_party_id is its effective owner, its own (component_owners) else its set''s. The findings that stand on a version of the component (the issues of accepted offers) are listed with how many programs still hold their own issue open, each system line carries the program''s own open issues for the findings on the version it took, and findings_open and offers_open count the findings still open somewhere and the offers that wait on the owner. vulnerabilities_open says how many CVEs affect a component version, those a component of its standing SBOM carries in the state affected: on each product and system line, of the version it took; and for the component, whichever version names it, each CVE once that affects a version still in use (its newest version, or one a product element of a product''s current version or a system component is built from), as component_rows counts it, so a CVE stays open while any consumer still runs an affected version, after a newer version holds the fix. Each system line says how many controls the version it took is judged on (controls_judged) and how many of them its element inherits (controls_inherited: those the element''s control baseline selects, where the element inherits the control as program_element_inheritance says, so none on an element declared modified, one that holds a component nobody judged, or one the program left out). Security invoker: a component the reader cannot read is refused.';
