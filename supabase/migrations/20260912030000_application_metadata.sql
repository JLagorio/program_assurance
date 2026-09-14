-- Read-only form metadata, taken from the actual database constraints. No second
-- client vocabulary can silently diverge from the schema's decisive values.
create or replace function public.app_schema()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(item order by item->>'name'), '[]'::jsonb) into result
  from (
    select jsonb_build_object(
      'name', c.relname,
      'description', pg_catalog.obj_description(c.oid, 'pg_class'),
      'can_insert', pg_catalog.has_table_privilege('authenticated', c.oid, 'INSERT'),
      'can_update', pg_catalog.has_table_privilege('authenticated', c.oid, 'UPDATE'),
      'can_delete', pg_catalog.has_table_privilege('authenticated', c.oid, 'DELETE'),
      'columns', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'name', a.attname,
          'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
          'required', a.attnotnull,
          'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid),
          'description', pg_catalog.col_description(c.oid, a.attnum),
          'choices', coalesce(
            (select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_catalog.pg_enum e where e.enumtypid = a.atttypid),
            (select jsonb_agg(distinct m[1])
             from pg_catalog.pg_constraint ck
             cross join lateral pg_catalog.regexp_matches(pg_catalog.pg_get_constraintdef(ck.oid), '''([^'']+)''', 'g') m
             where ck.conrelid = c.oid and ck.contype = 'c' and ck.conkey = array[a.attnum]::smallint[]
               and pg_catalog.pg_get_constraintdef(ck.oid) like '%= ANY%'),
            '[]'::jsonb)
        ) order by a.attnum), '[]'::jsonb)
        from pg_catalog.pg_attribute a
        left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
        where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      ),
      'relations', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'columns', (select jsonb_agg(a.attname order by k.ordinality) from unnest(fk.conkey) with ordinality k(attnum, ordinality) join pg_catalog.pg_attribute a on a.attrelid=c.oid and a.attnum=k.attnum),
          'target_table', target.relname,
          'target_schema', target_ns.nspname,
          'target_columns', (select jsonb_agg(a.attname order by k.ordinality) from unnest(fk.confkey) with ordinality k(attnum, ordinality) join pg_catalog.pg_attribute a on a.attrelid=target.oid and a.attnum=k.attnum)
        )), '[]'::jsonb)
        from pg_catalog.pg_constraint fk
        join pg_catalog.pg_class target on target.oid=fk.confrelid
        join pg_catalog.pg_namespace target_ns on target_ns.oid=target.relnamespace
        where fk.conrelid=c.oid and fk.contype='f'
      )
    ) as item
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r'
      and c.relrowsecurity
      and c.relname not in ('workspace_snapshots', 'spatial_ref_sys', 'tenants', 'tenant_memberships')
      and pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT')
      and exists (select 1 from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attname='id' and not a.attisdropped)
  ) tables;
  return result;
end;
$$;
revoke all on function public.app_schema() from public, anon;
grant execute on function public.app_schema() to authenticated;

-- Preserve the early snapshot experiment for explicit migration/recovery, but
-- it is no longer readable or writable by the application.
revoke all on public.workspace_snapshots from anon, authenticated;
revoke all on function public.save_workspace_snapshot(bigint,jsonb) from public, anon, authenticated;
comment on table public.workspace_snapshots is 'Retired prototype snapshots. Recovery only; not an application data source.';
