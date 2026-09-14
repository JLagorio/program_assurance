-- A membership-owned workspace replaces per-user application snapshots.
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  personal_owner_id uuid unique references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);
create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_memberships_user_idx on public.tenant_memberships(user_id);

create function public.can_read_tenant(target_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant and m.user_id = auth.uid());
$$;
create function public.can_write_tenant(target_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor'));
$$;
create function public.can_admin_tenant(target_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant and m.user_id = auth.uid()
      and m.role in ('owner', 'admin'));
$$;
create function public.can_own_tenant(target_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant and m.user_id = auth.uid() and m.role = 'owner');
$$;
revoke all on function public.can_read_tenant(uuid), public.can_write_tenant(uuid), public.can_admin_tenant(uuid), public.can_own_tenant(uuid) from public, anon;
grant execute on function public.can_read_tenant(uuid), public.can_write_tenant(uuid), public.can_admin_tenant(uuid), public.can_own_tenant(uuid) to authenticated;

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
revoke all on public.tenants, public.tenant_memberships from public, anon, authenticated;
grant select on public.tenants to authenticated;
grant update (name, revision) on public.tenants to authenticated;
grant select, insert, update, delete on public.tenant_memberships to authenticated;
create policy tenants_read on public.tenants for select to authenticated using (public.can_read_tenant(id));
create policy tenants_update on public.tenants for update to authenticated using (public.can_admin_tenant(id)) with check (public.can_admin_tenant(id));
create policy memberships_read on public.tenant_memberships for select to authenticated using (public.can_read_tenant(tenant_id));
create policy memberships_insert on public.tenant_memberships for insert to authenticated with check (
  public.can_own_tenant(tenant_id) or (public.can_admin_tenant(tenant_id) and role in ('editor', 'viewer'))
);
create policy memberships_update on public.tenant_memberships for update to authenticated using (
  public.can_own_tenant(tenant_id) or (public.can_admin_tenant(tenant_id) and role in ('editor', 'viewer'))
) with check (
  public.can_own_tenant(tenant_id) or (public.can_admin_tenant(tenant_id) and role in ('editor', 'viewer'))
);
create policy memberships_delete on public.tenant_memberships for delete to authenticated using (
  public.can_own_tenant(tenant_id) or (public.can_admin_tenant(tenant_id) and role in ('editor', 'viewer'))
);

create function public.guard_membership_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.tenant_id <> old.tenant_id or new.user_id <> old.user_id) then
    raise exception 'Membership identity cannot change' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' and not exists (select 1 from public.tenants where id = old.tenant_id) then
    return old; -- Tenant deletion cascade; there is no surviving workspace to orphan.
  end if;
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(old.tenant_id::text, 0));
    if not exists (select 1 from public.tenant_memberships where tenant_id = old.tenant_id and role = 'owner' and user_id <> old.user_id) then
      raise exception 'A tenant must retain an owner' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_membership_identity() from public, anon, authenticated;
create trigger guard_membership_identity before update or delete on public.tenant_memberships for each row execute function public.guard_membership_identity();

-- Migration-only helpers keep row permissions and audit behavior identical.
create function public.apply_tenant_security(table_name text) returns void
language plpgsql set search_path = '' as $$
begin
  execute format('alter table public.%I enable row level security', table_name);
  execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
  execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
  execute format('create policy tenant_read on public.%I for select to authenticated using (public.can_read_tenant(tenant_id))', table_name);
  execute format('create policy tenant_insert on public.%I for insert to authenticated with check (public.can_write_tenant(tenant_id))', table_name);
  execute format('create policy tenant_update on public.%I for update to authenticated using (public.can_write_tenant(tenant_id)) with check (public.can_write_tenant(tenant_id))', table_name);
  execute format('create policy tenant_delete on public.%I for delete to authenticated using (public.can_write_tenant(tenant_id))', table_name);
  execute format('create index %I on public.%I (tenant_id)', table_name || '_tenant_idx', table_name);
end;
$$;

create function public.stamp_record_lifecycle() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then
    if tg_argv[0] = 'true' and to_jsonb(old)->>'state' = 'published' then
      raise exception 'Published revisions are immutable; create a new draft revision' using errcode = '23514';
    end if;
    if tg_op = 'DELETE' then return old; end if;
    if new.id <> old.id or (to_jsonb(old) ? 'tenant_id' and (to_jsonb(new)->>'tenant_id') is distinct from (to_jsonb(old)->>'tenant_id')) then
      raise exception 'Record identity and tenant cannot change' using errcode = '23514';
    end if;
    if auth.uid() is not null and new.revision <> old.revision + 1 then
      raise exception 'Record revision conflict; reload before saving' using errcode = 'PT409';
    end if;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.revision := old.revision + 1;
  else
    new.revision := 1;
    new.created_at := now();
    new.created_by := auth.uid();
  end if;
  if to_jsonb(new) ? 'published_at' and to_jsonb(new)->>'state' = 'published' and to_jsonb(new)->>'published_at' is null then
    new.published_at := now();
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create function public.attach_record_lifecycle(table_name text, immutable_when_published boolean default false) returns void
language plpgsql set search_path = '' as $$
begin
  execute format('alter table public.%I add column if not exists revision bigint not null default 1 check (revision > 0), add column if not exists created_at timestamptz not null default now(), add column if not exists updated_at timestamptz not null default now(), add column if not exists created_by uuid references auth.users(id) on delete set null, add column if not exists updated_by uuid references auth.users(id) on delete set null', table_name);
  execute format('create trigger record_lifecycle before insert or update or delete on public.%I for each row execute function public.stamp_record_lifecycle(%L)', table_name, immutable_when_published::text);
end;
$$;
create function public.guard_published_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
declare parent_id uuid; parent_state text;
begin
  if tg_op <> 'INSERT' then
    parent_id := (to_jsonb(old)->>tg_argv[1])::uuid;
    execute format('select state from public.%I where id = $1 for share', tg_argv[0]) into parent_state using parent_id;
    if parent_state = 'published' then
      raise exception 'Content of a published revision cannot change' using errcode = '23514';
    end if;
  end if;
  if tg_op <> 'DELETE' then
    parent_id := (to_jsonb(new)->>tg_argv[1])::uuid;
    execute format('select state from public.%I where id = $1 for share', tg_argv[0]) into parent_state using parent_id;
    if parent_state = 'published' then
      raise exception 'Content cannot be attached to a published revision' using errcode = '23514';
    end if;
    return new;
  end if;
  return old;
end;
$$;
create function public.attach_parent_immutability(child_table text, parent_table text, parent_column text) returns void
language plpgsql set search_path = '' as $$
begin
  execute format('create trigger %I before insert or update or delete on public.%I for each row execute function public.guard_published_parent(%L,%L)', 'immutable_' || parent_column, child_table, parent_table, parent_column);
end;
$$;

-- A domain record may reference a global reference row or one in its own tenant.
create function public.guard_reference_tenant() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target_id uuid; target_tenant uuid; found_target boolean;
begin
  target_id := (to_jsonb(new)->>tg_argv[0])::uuid;
  if target_id is null then return new; end if;
  execute format('select tenant_id, true from public.%I where id = $1', tg_argv[1]) into target_tenant, found_target using target_id;
  if found_target is not true then
    raise exception 'Referenced record does not exist' using errcode = '23503';
  end if;
  if target_tenant is not null and target_tenant is distinct from new.tenant_id then
    raise exception 'Cross-tenant references are prohibited' using errcode = '23514';
  end if;
  return new;
end;
$$;
create function public.attach_reference_tenant_guard(child_table text, child_column text, reference_table text) returns void
language plpgsql set search_path = '' as $$
begin
  execute format('create trigger %I before insert or update on public.%I for each row execute function public.guard_reference_tenant(%L,%L)', 'reference_tenant_' || child_column, child_table, child_column, reference_table);
end;
$$;
revoke all on function public.apply_tenant_security(text), public.stamp_record_lifecycle(), public.attach_record_lifecycle(text,boolean), public.guard_published_parent(), public.attach_parent_immutability(text,text,text), public.guard_reference_tenant(), public.attach_reference_tenant_guard(text,text,text) from public, anon, authenticated;
select public.attach_record_lifecycle('tenants');

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  party_type text not null check (party_type in ('person', 'organization')),
  name text not null check (length(btrim(name)) > 0),
  email text check (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+$'),
  auth_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid,
  unique (tenant_id, id),
  unique (tenant_id, auth_user_id),
  foreign key (tenant_id, organization_id) references public.parties(tenant_id, id),
  check (organization_id is null or organization_id <> id),
  check (auth_user_id is null or party_type = 'person')
);
select public.apply_tenant_security('parties');
select public.attach_record_lifecycle('parties');

create function public.guard_party_organization() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.tenants where id = new.tenant_id for update;
  if new.organization_id is not null then
    if not exists (select 1 from public.parties where id = new.organization_id and tenant_id = new.tenant_id and party_type = 'organization') then
      raise exception 'Organization affiliation must reference an organization in the same tenant' using errcode = '23514';
    end if;
    if exists (
      with recursive ancestors as (
        select id, organization_id from public.parties where id = new.organization_id and tenant_id = new.tenant_id
        union
        select p.id, p.organization_id from public.parties p join ancestors a on p.id = a.organization_id where p.tenant_id = new.tenant_id
      ) select 1 from ancestors where id = new.id
    ) then raise exception 'Organization affiliations cannot contain cycles' using errcode = '23514'; end if;
  end if;
  if new.party_type = 'person' and exists (select 1 from public.parties where organization_id = new.id) then
    raise exception 'An organization with affiliated parties cannot become a person' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_party_organization() from public, anon, authenticated;
create trigger party_organization before insert or update on public.parties for each row execute function public.guard_party_organization();
comment on table public.tenants is 'A workspace owned and accessed through explicit tenant memberships.';
comment on table public.tenant_memberships is 'Authenticated account access roles; owner and admin membership powers are separately constrained.';
comment on table public.parties is 'Actual people and organizations participating in assurance, with an optional authenticated account association.';
comment on column public.parties.auth_user_id is 'Optional login identity; a party does not need an application account.';

create function public.ensure_personal_tenant() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  workspace_id uuid;
  identity_name text;
  identity_email text;
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select email, coalesce(nullif(btrim(raw_user_meta_data->>'full_name'), ''), nullif(btrim(raw_user_meta_data->>'name'), ''), email)
    into identity_email, identity_name from auth.users where id = caller;
  if identity_name is null then raise exception 'An account name or email is required' using errcode = '23514'; end if;
  insert into public.tenants(name, personal_owner_id)
    values (identity_name || '''s workspace', caller)
    on conflict (personal_owner_id) do nothing;
  select id into workspace_id from public.tenants where personal_owner_id = caller;
  insert into public.tenant_memberships(tenant_id, user_id, role) values (workspace_id, caller, 'owner')
    on conflict (tenant_id, user_id) do nothing;
  insert into public.parties(tenant_id, party_type, name, email, auth_user_id)
    values (workspace_id, 'person', identity_name, identity_email, caller)
    on conflict (tenant_id, auth_user_id) do nothing;
  return workspace_id;
end;
$$;
revoke all on function public.ensure_personal_tenant() from public, anon, authenticated;
grant execute on function public.ensure_personal_tenant() to authenticated;
