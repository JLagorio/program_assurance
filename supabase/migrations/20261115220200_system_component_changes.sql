-- The program Library tab counts, for each system component applied from the library, the
-- contributions whose description says something else than the library implementation it started
-- from (Changed here). It once read every such contribution's description and its implementation's
-- to compare them on screen (423 KB on PRG-2101). One row a system component with a contribution
-- that started from a library implementation, counted as the reader may read both.
create view public.system_component_changes with (security_invoker = true) as
select c.system_component_id as id, c.tenant_id,
  count(*) filter (where i.description is distinct from c.description)::integer
    as description_changed
from public.component_contributions c
join public.defined_component_implementations i on i.id = c.library_implementation_id
where c.system_component_id is not null
group by c.system_component_id, c.tenant_id;

grant select on public.system_component_changes to authenticated;
revoke all on public.system_component_changes from public, anon;
comment on view public.system_component_changes is 'One row a system component (id) with a contribution that started from a library implementation: how many of those contributions describe it otherwise than the implementation does (description_changed), the program Library tab''s Changed here.';
