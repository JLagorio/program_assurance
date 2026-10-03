-- The catalog's Controls and CCIs registers read one page at a time: the server pages, sorts,
-- filters and searches, and counts the whole result. Each register reads a view that carries the
-- columns it shows, the derived ones included, so a sort or a filter on a derived column runs on
-- the server too. The views run as the reader (security_invoker), so row-level security on every
-- table they read still decides what the reader sees.

-- A sort key that orders codes as people read them: AC-2 before AC-10, AC-2(2) before AC-2(13).
-- Each run of digits is padded to one width and the rest is lower-cased; compare it in "C".
create function public.natural_sort_key(value text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select coalesce(string_agg(
    case when part[1] ~ '^[0-9]' then pg_catalog.lpad(part[1], 12, '0') else pg_catalog.lower(part[1]) end,
    '' order by position), '')
  from pg_catalog.regexp_matches(value, '([0-9]+|[^0-9]+)', 'g') with ordinality as matches(part, position)
$$;
revoke all on function public.natural_sort_key(text) from public, anon;
grant execute on function public.natural_sort_key(text) to authenticated;
comment on function public.natural_sort_key(text) is 'A key that sorts codes by their numbers as numbers (AC-2 before AC-10); compare it with the "C" collation.';

-- One row per catalog control: its code in reading order, its family's code, and the published
-- profile revisions whose published resolution selects it.
create view public.catalog_control_rows with (security_invoker = true) as
select c.id, c.tenant_id, c.catalog_revision_id, c.group_id, c.code, c.title, c.source_id, c.status,
  public.natural_sort_key(c.code) collate "C" as code_order,
  pg_catalog.upper(g.source_id) as family,
  coalesce(selected.revisions, '{}'::uuid[]) as selected_by
from public.controls c
left join public.catalog_groups g on g.id = c.group_id
-- Aggregated once and joined, not per control: a page sorted or filtered by any column reads it.
left join (
  select s.control_id,
    array_agg(distinct r.profile_revision_id order by r.profile_revision_id) as revisions
  from public.selected_controls s
  join public.profile_resolutions r on r.id = s.profile_resolution_id and r.state = 'published'
  join public.profile_revisions p on p.id = r.profile_revision_id and p.state = 'published'
  group by s.control_id
) selected on selected.control_id = c.id;
grant select on public.catalog_control_rows to authenticated;
revoke all on public.catalog_control_rows from public, anon;
comment on view public.catalog_control_rows is 'The catalog Controls register, one row per control: its code in reading order (code_order), its family code and the published profile revisions that select it.';

-- One row per CCI: its types and the codes of the controls its publication references map to.
create view public.cci_item_rows with (security_invoker = true) as
select i.id, i.tenant_id, i.cci_revision_id, i.code, i.definition, i.status, i.published_on,
  i.contributor,
  coalesce(types.list, '{}'::text[]) as types,
  mapped.codes as controls
from public.cci_items i
left join lateral (
  select array_agg(t.type::text order by t.type) as list
  from public.cci_item_types t where t.cci_item_id = i.id
) types on true
left join lateral (
  select string_agg(codes.code, ', ' order by public.natural_sort_key(codes.code) collate "C") as codes
  from (
    select distinct c.code
    from public.cci_references r
    join public.cci_control_links l on l.cci_reference_id = r.id
    join public.controls c on c.id = l.control_id
    where r.cci_item_id = i.id
  ) codes
) mapped on true;
grant select on public.cci_item_rows to authenticated;
revoke all on public.cci_item_rows from public, anon;
comment on view public.cci_item_rows is 'The catalog CCIs register, one row per CCI: its types and the codes of the controls it maps to, in reading order.';
