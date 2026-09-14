-- First persistence boundary: one versioned workspace per authenticated user.
-- Domain collections can move into relational tables behind the same adapter later.
create table public.workspace_snapshots (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  revision bigint not null check (revision > 0),
  "values" jsonb not null check (jsonb_typeof("values") = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.workspace_snapshots enable row level security;

create policy "Read own workspace"
  on public.workspace_snapshots for select
  to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on table public.workspace_snapshots from public, anon, authenticated;
grant select on table public.workspace_snapshots to authenticated;

-- Direct writes are unavailable to API clients so every write must check revision.
-- SECURITY DEFINER is needed because authenticated has SELECT privilege only.
-- Empty search_path and explicit owner filtering keep the privilege boundary narrow.
create function public.save_workspace_snapshot(expected_revision bigint, snapshot jsonb)
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
      using errcode = '40001';
  end if;

  return saved_revision;
end;
$$;

revoke all on function public.save_workspace_snapshot(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.save_workspace_snapshot(bigint, jsonb) to authenticated;

comment on table public.workspace_snapshots is
  'Initial POC persistence: versioned application state, isolated by Supabase Auth user.';
