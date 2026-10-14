-- Ephemeral workbook location hints use only authenticated private Presence channels.
-- No document, source record, cursor or change is persisted in an application table.
create function public.can_join_assurance_workbook(p_topic text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.programs p
    where p_topic = 'assurance-workbook:' || p.tenant_id::text || ':' || p.id::text
      and public.can_read_tenant(p.tenant_id)
  );
$$;
revoke all on function public.can_join_assurance_workbook(text) from public, anon;
grant execute on function public.can_join_assurance_workbook(text) to authenticated;
comment on function public.can_join_assurance_workbook(text) is
  'Private Presence topic authorization. Workspace readers may share ephemeral locations; this does not grant editing or verify participant labels.';

-- The local prototype can disable Realtime entirely, in which case its managed table does not
-- exist yet. After enabling Realtime, an administrator runs this same installer in SQL. Until
-- that point the client uses private channels and fails closed; it never falls back to public.
create function public.install_assurance_workbook_presence_policies() returns boolean
language plpgsql set search_path = '' as $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'Realtime is disabled. After enabling it, run select public.install_assurance_workbook_presence_policies();';
    return false;
  end if;
  if not exists (select 1 from pg_catalog.pg_policy
    where polrelid = 'realtime.messages'::regclass and polname = 'assurance_workbook_presence_read') then
    execute $policy$create policy assurance_workbook_presence_read on realtime.messages
      for select to authenticated using (
        extension = 'presence'
        and public.can_join_assurance_workbook((select realtime.topic()))
      )$policy$;
  end if;
  if not exists (select 1 from pg_catalog.pg_policy
    where polrelid = 'realtime.messages'::regclass and polname = 'assurance_workbook_presence_track') then
    execute $policy$create policy assurance_workbook_presence_track on realtime.messages
      for insert to authenticated with check (
        extension = 'presence'
        and public.can_join_assurance_workbook((select realtime.topic()))
      )$policy$;
  end if;
  return true;
end;
$$;
revoke all on function public.install_assurance_workbook_presence_policies() from public, anon, authenticated;
select public.install_assurance_workbook_presence_policies();
