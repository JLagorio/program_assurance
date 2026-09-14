-- Engineering requirements can reference a whole catalog control. Statement-level
-- precision is optional and never inferred from an assessment method or guidance.
alter table public.requirement_control_links
  add column control_id uuid references public.controls(id),
  add column system_id uuid,
  add column selected_control_id uuid references public.selected_controls(id),
  alter column control_part_id drop not null;

-- This is a lossless projection of an existing foreign key, not an authored edit.
alter table public.requirement_control_links disable trigger record_lifecycle;
alter table public.requirement_control_links disable trigger requirement_history;
update public.requirement_control_links l set control_id = p.control_id
  from public.control_parts p where p.id = l.control_part_id;
alter table public.requirement_control_links enable trigger requirement_history;
alter table public.requirement_control_links enable trigger record_lifecycle;

alter table public.requirement_control_links
  alter column control_id set not null,
  add foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  add constraint requirement_control_selection_context
    check ((system_id is null) = (selected_control_id is null));

do $$
declare old_unique text;
begin
  select conname into old_unique from pg_constraint
    where conrelid = 'public.requirement_control_links'::regclass and contype = 'u'
    and pg_get_constraintdef(oid) = 'UNIQUE (tenant_id, requirement_revision_id, control_part_id, relationship_type)';
  if old_unique is not null then
    execute format('alter table public.requirement_control_links drop constraint %I', old_unique);
  end if;
end;
$$;
alter table public.requirement_control_links add constraint requirement_control_target_unique
  unique nulls not distinct
    (tenant_id, requirement_revision_id, control_id, control_part_id, system_id, relationship_type);

create function public.is_requirement_control_statement(p_part_id uuid, p_control_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  with recursive ancestry as (
    select p.id, p.parent_part_id, p.control_id, p.name, p.prose, array[p.id] path, false cycle
      from public.control_parts p where p.id = p_part_id
    union all
    select p.id, p.parent_part_id, p.control_id, p.name, p.prose,
      a.path || p.id, p.id = any(a.path)
      from public.control_parts p join ancestry a on p.id = a.parent_part_id
      where not a.cycle
  )
  select exists (select 1 from ancestry where id = p_part_id and nullif(btrim(prose), '') is not null)
    and exists (select 1 from ancestry where name = 'statement' and parent_part_id is null)
    and not exists (select 1 from ancestry
      where cycle or control_id is distinct from p_control_id or name not in ('statement', 'item'));
$$;

create function public.guard_requirement_control_target() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  part_control uuid;
  program_uuid uuid;
  selected_control uuid;
  target_changed boolean;
begin
  -- Older clients and archived seed code supply only a part ID. Derive its
  -- owning control while preventing contradictory explicit target references.
  if new.control_part_id is not null then
    select control_id into part_control from public.control_parts where id = new.control_part_id;
    if part_control is null then
      raise exception 'Choose a control or one of its authored statements' using errcode = '23514';
    end if;
    if new.control_id is null or (tg_op = 'UPDATE'
      and new.control_part_id is distinct from old.control_part_id
      and new.control_id is not distinct from old.control_id) then
      new.control_id := part_control;
    elsif new.control_id <> part_control then
      raise exception 'The statement must belong to the selected control' using errcode = '23514';
    end if;
  end if;
  if new.control_id is null then
    raise exception 'Choose a control' using errcode = '23514';
  end if;
  target_changed := tg_op = 'INSERT';
  if tg_op = 'UPDATE' then
    target_changed := (new.control_id, new.control_part_id, new.system_id, new.selected_control_id)
      is distinct from (old.control_id, old.control_part_id, old.system_id, old.selected_control_id);
    if new.requirement_revision_id is distinct from old.requirement_revision_id then
      raise exception 'A control mapping cannot be moved to another requirement' using errcode = '23514';
    end if;
  end if;
  if target_changed and new.control_part_id is not null
    and not public.is_requirement_control_statement(new.control_part_id, new.control_id) then
    raise exception 'Map the whole control or an authored statement; assessment methods and guidance are not requirement statements'
      using errcode = '23514';
  end if;
  select r.program_id into program_uuid from public.requirement_revisions rr
    join public.engineering_requirements r on r.id = rr.engineering_requirement_id
    where rr.id = new.requirement_revision_id and rr.tenant_id = new.tenant_id;
  if program_uuid is null then
    raise exception 'Choose a requirement in this workspace' using errcode = '23514';
  end if;
  if new.system_id is not null then
    if not exists (select 1 from public.systems s where s.id = new.system_id
      and s.tenant_id = new.tenant_id and s.program_id = program_uuid) then
      raise exception 'The mapped system must belong to the requirement program' using errcode = '23514';
    end if;
    select control_id into selected_control from public.selected_controls
      where id = new.selected_control_id;
    if selected_control is distinct from new.control_id then
      raise exception 'The system selection must reference the mapped control' using errcode = '23514';
    end if;
    if target_changed then
      if not exists (select 1 from public.requirement_allocations a
        where a.tenant_id = new.tenant_id and a.requirement_revision_id = new.requirement_revision_id
          and a.system_id = new.system_id) then
        raise exception 'Allocate the requirement to this system before mapping its controls' using errcode = '23514';
      end if;
      if not exists (select 1 from public.system_effective_baselines b
        join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
        where b.tenant_id = new.tenant_id and b.system_id = new.system_id
          and sc.id = new.selected_control_id and sc.control_id = new.control_id) then
        raise exception 'Choose a control from the system current effective profile' using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger a_requirement_control_target before insert or update
  on public.requirement_control_links for each row
  execute function public.guard_requirement_control_target();
select public.attach_reference_tenant_guard('requirement_control_links', 'control_id', 'controls');
select public.attach_reference_tenant_guard('requirement_control_links', 'selected_control_id', 'selected_controls');
revoke all on function public.guard_requirement_control_target() from public, anon, authenticated;
revoke all on function public.is_requirement_control_statement(uuid, uuid) from public, anon;
grant execute on function public.is_requirement_control_statement(uuid, uuid) to authenticated;

comment on column public.requirement_control_links.control_id is 'Catalog control addressed by the engineering requirement; required even when a statement is identified.';
comment on column public.requirement_control_links.control_part_id is 'Optional authored statement or nested statement item. NULL represents the whole control.';
comment on column public.requirement_control_links.system_id is 'Optional explicit allocated system context; legacy catalog references retain NULL until a system is deliberately chosen.';
comment on column public.requirement_control_links.selected_control_id is 'Exact selected-control record for an explicitly chosen system context.';
