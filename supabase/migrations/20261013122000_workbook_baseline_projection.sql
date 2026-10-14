-- Keep the complete selected-control relation normalized. Every system already carries its
-- effective profile_resolution_id; duplicating each inherited baseline per system multiplies
-- a 546-control baseline into 15,288 rows across 28 systems without adding information.
-- Applicability is the exact Systems.profile_resolution_id -> SelectedControls.profile_resolution_id join.
create or replace function public.read_assurance_workbook(p_tenant_id uuid, p_program_id uuid, p_row_limit integer default 10000)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  result jsonb;
  sizes jsonb;
  sheets jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace read access is required' using errcode = '42501';
  end if;
  if p_row_limit is null or p_row_limit not between 1 and 10000 then
    raise exception 'Choose a workbook row limit between 1 and 10000' using errcode = '23514';
  end if;
  if not exists (select 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id) then
    raise exception 'The program is unavailable in this workspace' using errcode = '23514';
  end if;
  -- Each array is capped at limit + 1 solely to detect overflow without allocating an unbounded
  -- document. An overflow raises below before any partial snapshot leaves the database.
  select jsonb_build_object(
    'requirements', coalesce((select jsonb_agg(to_jsonb(x) order by x.tree_order, x.id) from (
      select * from public.requirement_workbook_rows where tenant_id = p_tenant_id and program_id = p_program_id
      order by tree_order, id limit p_row_limit + 1) x), '[]'::jsonb),
    'mappings', coalesce((select jsonb_agg(to_jsonb(x) order by x.requirement_code, x.control_code, x.id) from (
      select * from public.program_sctm_rows where tenant_id = p_tenant_id and program_id = p_program_id
      order by requirement_code, control_code, id limit p_row_limit + 1) x), '[]'::jsonb),
    'allocations', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from (
      select a.id, a.revision, r.id as requirement_id, r.code as requirement_code,
        r.content_id, a.system_id, s.code as system_code, s.name as system_name,
        a.provider_capability_id, a.security_process_id, a.rationale
      from public.requirement_allocations a
      join public.requirement_workbook_rows r on r.tenant_id = a.tenant_id and r.content_id = a.requirement_revision_id
      left join public.systems s on s.tenant_id = a.tenant_id and s.id = a.system_id
      where r.tenant_id = p_tenant_id and r.program_id = p_program_id
      order by a.id limit p_row_limit + 1) x), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from (
      select e.id, e.revision, r.id as requirement_id, r.code as requirement_code, r.content_id,
        e.evidence_version_id, e.claim, e.applicability_rationale, v.artifact_id,
        v.version_number, v.state, a.title as artifact_title
      from public.requirement_evidence e
      join public.requirement_workbook_rows r on r.tenant_id = e.tenant_id and r.content_id = e.requirement_revision_id
      join public.evidence_versions v on v.tenant_id = e.tenant_id and v.id = e.evidence_version_id
      join public.evidence_artifacts a on a.tenant_id = v.tenant_id and a.id = v.artifact_id
      where r.tenant_id = p_tenant_id and r.program_id = p_program_id
      order by e.id limit p_row_limit + 1) x), '[]'::jsonb),
    'systems', coalesce((select jsonb_agg(to_jsonb(x) order by x.code, x.id) from (
      select s.id, s.code, s.name, s.system_type, s.parent_system_id, b.profile_resolution_id,
        b.source_system_id, b.inherited, b.source_label
      from public.systems s
      left join public.system_effective_baselines b on b.tenant_id = s.tenant_id and b.system_id = s.id
      where s.tenant_id = p_tenant_id and s.program_id = p_program_id
      order by s.code, s.id limit p_row_limit + 1) x), '[]'::jsonb),
    'owners', coalesce((select jsonb_agg(to_jsonb(x) order by x.name, x.id) from (
      select id, name from public.parties where tenant_id = p_tenant_id order by name, id limit p_row_limit + 1) x), '[]'::jsonb),
    'selectedControls', coalesce((select jsonb_agg(to_jsonb(x) order by x.control_code, x.id) from (
      select sc.id, sc.control_id, sc.profile_resolution_id,
        c.code as control_code, c.title as control_title, c.catalog_revision_id
      from public.selected_controls sc
      join public.controls c on c.id = sc.control_id
      where exists (
        select 1 from public.systems s
        join public.system_effective_baselines b on b.tenant_id = s.tenant_id and b.system_id = s.id
        where s.tenant_id = p_tenant_id and s.program_id = p_program_id
          and b.profile_resolution_id = sc.profile_resolution_id
      )
      order by c.code, sc.id limit p_row_limit + 1) x), '[]'::jsonb)
  ) into sheets;
  if exists (select 1 from jsonb_each(sheets) where jsonb_array_length(value) > p_row_limit) then
    raise exception 'This program exceeds the complete workbook limit of % rows per sheet. Use the paged registers or narrow the program before loading a workbook.', p_row_limit
      using errcode = '54000';
  end if;
  select jsonb_object_agg(key, jsonb_array_length(value)) into sizes from jsonb_each(sheets);
  result := sheets || jsonb_build_object('complete', true, 'programId', p_program_id,
    'capturedAt', statement_timestamp(), 'counts', sizes,
    'workbook', (select to_jsonb(w) from public.assurance_workbooks w
      where tenant_id = p_tenant_id and program_id = p_program_id));
  return result;
end;
$$;
