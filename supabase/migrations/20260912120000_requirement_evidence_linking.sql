-- A browser selection is one atomic relationship change. Existing links and
-- their authored claim/rationale remain untouched on identical retries.
create function public.link_requirement_evidence(
  p_tenant_id uuid,
  p_program_id uuid,
  p_requirement_revision_id uuid,
  p_evidence_version_ids uuid[]
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  requirement_state text;
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

  -- Serialize additions against publication of the same requirement revision.
  select rr.state, er.program_id into requirement_state, actual_program
    from public.requirement_revisions rr
    join public.engineering_requirements er
      on er.tenant_id = rr.tenant_id and er.id = rr.engineering_requirement_id
    where rr.tenant_id = p_tenant_id and rr.id = p_requirement_revision_id
    for update of rr for share of er;
  if not found or actual_program is distinct from p_program_id then
    raise exception 'Choose a requirement revision in this program' using errcode = '23514';
  end if;
  if requirement_state <> 'draft' then
    raise exception 'Published requirements are immutable. Create a draft revision before linking evidence.' using errcode = '23514';
  end if;

  -- Pin the exact versions selected. Program-specific artifacts must belong to
  -- this program; workspace artifacts may be reused without inventing a scope.
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
revoke all on function public.link_requirement_evidence(uuid, uuid, uuid, uuid[]) from public, anon;
grant execute on function public.link_requirement_evidence(uuid, uuid, uuid, uuid[]) to authenticated;
comment on function public.link_requirement_evidence(uuid, uuid, uuid, uuid[]) is 'Atomically link selected published evidence versions to a draft requirement; preserve existing links on retry.';
