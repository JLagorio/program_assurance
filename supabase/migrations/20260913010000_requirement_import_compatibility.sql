-- Preserve the original positive storage number when importing a requirement's
-- sole content record. Product authors still create initial details at 1; edits
-- continue to update that same row, without creating successor records.
create or replace function public.guard_requirement_revision_history() returns trigger
language plpgsql security definer set search_path = '' as $$
declare program_uuid uuid;
begin
  if tg_op = 'INSERT' then
    select program_id into program_uuid from public.engineering_requirements
      where tenant_id = new.tenant_id and id = new.engineering_requirement_id;
    perform 1 from public.programs where tenant_id = new.tenant_id and id = program_uuid for no key update;
    perform 1 from public.engineering_requirements where tenant_id = new.tenant_id and id = new.engineering_requirement_id for update;
    if exists (select 1 from public.requirement_revisions where tenant_id = new.tenant_id
      and engineering_requirement_id = new.engineering_requirement_id) then
      raise exception 'This requirement already has details. Edit the existing record.' using errcode = '23514';
    end if;
    -- SECURITY DEFINER makes current_user the function owner. Check both the
    -- original session and its active role so SET ROLE authenticated cannot use
    -- the maintenance exception, even without a JWT subject.
    if new.version_number <> 1 and not (
      auth.uid() is null
      and session_user in ('postgres', 'supabase_admin')
      and coalesce(current_setting('role', true), 'none') in ('none', 'postgres', 'supabase_admin')
    ) then
      raise exception 'Initial requirement content must use its initial storage identifier' using errcode = '23514';
    end if;
    return new;
  end if;
  if exists (select 1 from public.requirement_revisions where tenant_id = old.tenant_id
    and engineering_requirement_id = old.engineering_requirement_id and version_number > old.version_number) then
    raise exception 'This is an archived requirement record. Open the current requirement to edit it.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.version_number is distinct from old.version_number then
    raise exception 'The requirement storage identifier cannot change' using errcode = '23514';
  end if;
  return new;
end;
$$;
