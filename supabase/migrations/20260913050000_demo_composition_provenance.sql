-- Archived composition source keys still identify the same canonical system
-- UUIDs through the exact compatibility view. Other views are not import targets.
create or replace function public.validate_demo_import_destination() returns trigger
language plpgsql security definer set search_path = '' as $$
declare present boolean;
begin
  if not exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = new.destination_table
      and (c.relkind = 'r' or (c.relkind = 'v' and c.relname = 'composition_nodes'))
  ) then
    raise exception 'Unknown demo destination table' using errcode = '23514';
  end if;
  execute format('select exists(select 1 from public.%I where id=$1 and tenant_id=$2)', new.destination_table)
    into present using new.destination_id, new.tenant_id;
  if not present then
    raise exception 'Demo provenance must refer to an existing record in the same tenant' using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_demo_import_destination() from public, anon, authenticated;
