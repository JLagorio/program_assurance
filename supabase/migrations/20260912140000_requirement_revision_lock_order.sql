-- Use one lock order for revision creation and outgoing hierarchy/evidence edits:
-- program, stable requirement identity, then the exact source revision.
create function public.lock_requirement_decomposition_context() returns trigger
language plpgsql security definer set search_path = '' as $$
declare parents uuid[] := '{}'::uuid[];
begin
  if tg_op <> 'INSERT' then parents := array_append(parents, old.parent_requirement_revision_id); end if;
  if tg_op <> 'DELETE' then parents := array_append(parents, new.parent_requirement_revision_id); end if;
  perform p.id from public.programs p where p.id in (
    select er.program_id from public.requirement_revisions rr
    join public.engineering_requirements er on er.tenant_id = rr.tenant_id and er.id = rr.engineering_requirement_id
    where rr.id = any(parents)
  ) order by p.id for update;
  perform er.id from public.engineering_requirements er where er.id in (
    select engineering_requirement_id from public.requirement_revisions where id = any(parents)
  ) order by er.id for share;
  perform id from public.requirement_revisions where id = any(parents) order by id for share;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.lock_requirement_decomposition_context() from public, anon, authenticated;
-- Must sort before the existing immutable_parent_requirement_revision_id guard.
create trigger a_requirement_context_lock before insert or update or delete on public.requirement_decompositions
  for each row execute function public.lock_requirement_decomposition_context();

create or replace function public.guard_requirement_revision_history() returns trigger
language plpgsql security definer set search_path = '' as $$
declare program_uuid uuid;
begin
  if tg_op = 'INSERT' then
    select program_id into program_uuid from public.engineering_requirements
      where tenant_id = new.tenant_id and id = new.engineering_requirement_id;
    perform 1 from public.programs where tenant_id = new.tenant_id and id = program_uuid for update;
    perform 1 from public.engineering_requirements where tenant_id = new.tenant_id and id = new.engineering_requirement_id for update;
    perform id from public.requirement_revisions
      where tenant_id = new.tenant_id and engineering_requirement_id = new.engineering_requirement_id
      order by version_number desc limit 1 for update;
    return new;
  end if;
  if exists (select 1 from public.requirement_revisions where tenant_id = old.tenant_id
    and engineering_requirement_id = old.engineering_requirement_id and version_number > old.version_number) then
    raise exception 'Historical requirement revisions are immutable. Open the latest revision to make a new edit.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.version_number is distinct from old.version_number then
    raise exception 'A requirement revision number cannot change after creation' using errcode = '23514';
  end if;
  if row(new.title, new.statement, new.acceptance_criteria, new.rationale, new.requirement_type, new.owner_party_id)
    is distinct from row(old.title, old.statement, old.acceptance_criteria, old.rationale, old.requirement_type, old.owner_party_id)
    and exists (select 1 from public.activity_events where tenant_id = old.tenant_id
      and (requirement_revision_id = old.id or source_requirement_revision_id = old.id)) then
    raise exception 'Audited requirement content is immutable. Save an edit as a new requirement revision.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.link_requirement_evidence(
  p_tenant_id uuid,
  p_program_id uuid,
  p_requirement_revision_id uuid,
  p_evidence_version_ids uuid[]
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  requirement_state text;
  requirement_identity uuid;
  actual_program uuid;
  requested_ids uuid[];
  checked_count integer;
  result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot link evidence' using errcode = '42501';
  end if;
  if p_requirement_revision_id is null or p_program_id is null
    or p_evidence_version_ids is null
    or cardinality(p_evidence_version_ids) not between 1 and 500
    or array_position(p_evidence_version_ids, null) is not null then
    raise exception 'Select between 1 and 500 published evidence versions' using errcode = '23514';
  end if;
  select array_agg(distinct version_id order by version_id) into requested_ids
    from unnest(p_evidence_version_ids) as selected(version_id);
  perform 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id for update;
  select er.id, er.program_id into requirement_identity, actual_program
    from public.engineering_requirements er
    where er.tenant_id = p_tenant_id and er.id = (
      select engineering_requirement_id from public.requirement_revisions
      where tenant_id = p_tenant_id and id = p_requirement_revision_id
    ) for share;
  if not found or actual_program is distinct from p_program_id then
    raise exception 'Choose a requirement revision in this program' using errcode = '23514';
  end if;
  select state into requirement_state from public.requirement_revisions
    where tenant_id = p_tenant_id and id = p_requirement_revision_id for update;
  if requirement_state <> 'draft' then
    raise exception 'Published requirements are immutable. Create a draft revision before linking evidence.' using errcode = '23514';
  end if;
  if p_requirement_revision_id is distinct from (
    select id from public.requirement_revisions where tenant_id = p_tenant_id
      and engineering_requirement_id = requirement_identity order by version_number desc limit 1
  ) then
    raise exception 'Historical requirements are immutable. Open the latest revision to link evidence.' using errcode = '23514';
  end if;
  perform ev.id
    from public.evidence_versions ev
    join public.evidence_artifacts ea on ea.tenant_id = ev.tenant_id and ea.id = ev.artifact_id
    where ev.tenant_id = p_tenant_id and ev.id = any(requested_ids)
      and ev.state = 'published' and (ea.program_id is null or ea.program_id = p_program_id)
    order by ev.id for share of ev, ea;
  get diagnostics checked_count = row_count;
  if checked_count <> cardinality(requested_ids) then
    raise exception 'Every selection must be a published evidence version in this program or an unscoped workspace artifact. Reload the browser and review your selection.' using errcode = '23514';
  end if;
  insert into public.requirement_evidence (tenant_id, requirement_revision_id, evidence_version_id)
    select p_tenant_id, p_requirement_revision_id, version_id from unnest(requested_ids) as selected(version_id)
    on conflict (tenant_id, requirement_revision_id, evidence_version_id) do nothing;
  select jsonb_build_object('linkIds', jsonb_agg(re.id order by re.evidence_version_id)) into result
    from public.requirement_evidence re
    where re.tenant_id = p_tenant_id and re.requirement_revision_id = p_requirement_revision_id
      and re.evidence_version_id = any(requested_ids);
  return result;
end;
$$;
