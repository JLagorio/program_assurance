-- PostgREST retries SQLSTATE 40001 as a serialization failure. A stale workspace
-- is a user-resolvable conflict, so return HTTP 409 immediately with PT409.
create or replace function public.save_workspace_snapshot(expected_revision bigint, snapshot jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  saved_revision bigint;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if expected_revision is null or expected_revision < 0 then
    raise exception 'Expected revision must be a nonnegative integer' using errcode = '22023';
  end if;

  if snapshot is null or jsonb_typeof(snapshot) <> 'object' then
    raise exception 'Workspace snapshot must be a JSON object' using errcode = '22023';
  end if;

  if expected_revision = 0 then
    insert into public.workspace_snapshots (owner_id, revision, "values")
    values (caller_id, 1, snapshot)
    on conflict (owner_id) do nothing
    returning revision into saved_revision;
  else
    update public.workspace_snapshots
    set "values" = snapshot,
        revision = revision + 1,
        updated_at = now()
    where owner_id = caller_id
      and revision = expected_revision
    returning revision into saved_revision;
  end if;

  if saved_revision is null then
    raise exception 'Workspace changed in another session. Reload before saving.'
      using errcode = 'PT409';
  end if;

  return saved_revision;
end;
$$;
