-- Exact source anchors and captured review context; preserves existing targets and receipts.
create or replace function public.assurance_review_target_program(p_tenant_id uuid, p_target jsonb)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  program uuid;
  found_target boolean := false;
  saved public.assurance_workbooks%rowtype;
  sheet jsonb;
  row_id uuid;
  value_text text;
  location jsonb;
begin
  if jsonb_typeof(p_target) is distinct from 'object' then raise exception 'Choose a review target' using errcode='23514'; end if;
  if p_target->>'kind' = 'citation' then
    if p_target - 'kind' - 'recordId' <> '{}'::jsonb then raise exception 'Invalid citation target' using errcode='23514'; end if;
    select c.program_id,true into program,found_target from public.assurance_citations c where c.tenant_id=p_tenant_id and c.id=(p_target->>'recordId')::uuid;
  elsif p_target->>'kind' = 'assessment-finding' then
    if p_target - 'kind' - 'recordId' <> '{}'::jsonb then raise exception 'Invalid finding target' using errcode='23514'; end if;
    select c.program_id,true into program,found_target from public.assessment_findings f
      join public.assessment_results_revisions r on r.tenant_id=f.tenant_id and r.id=f.assessment_results_revision_id
      join public.assessment_plan_revisions p on p.tenant_id=r.tenant_id and p.id=r.assessment_plan_revision_id
      join public.assessment_campaigns c on c.tenant_id=p.tenant_id and c.id=p.campaign_id
      where f.tenant_id=p_tenant_id and f.id=(p_target->>'recordId')::uuid;
  elsif p_target->>'kind' = 'requirement-change' then
    if p_target - 'kind' - 'recordId' - 'editId' - 'field' - 'side' - 'startLine' - 'endLine' <> '{}'::jsonb
      or coalesce(p_target->>'field','') not in ('title','statement','acceptanceCriteria','rationale','requirementType','ownerPartyId')
      or coalesce(p_target->>'side','') not in ('before','after') then raise exception 'Invalid edit anchor' using errcode='23514'; end if;
    select r.program_id,true,coalesce(e.changes->(p_target->>'field')->>(p_target->>'side'),'') into program,found_target,value_text
      from public.activity_events e join public.requirement_revisions v on v.tenant_id=e.tenant_id and v.id=e.requirement_revision_id
      join public.engineering_requirements r on r.tenant_id=v.tenant_id and r.id=v.engineering_requirement_id
      where e.tenant_id=p_tenant_id and e.id=(p_target->>'editId')::uuid and r.id=(p_target->>'recordId')::uuid and e.changes ? (p_target->>'field');
    if p_target ? 'startLine' or p_target ? 'endLine' then
      if jsonb_typeof(p_target->'startLine') is distinct from 'number' or jsonb_typeof(p_target->'endLine') is distinct from 'number'
        or (p_target->>'startLine')::numeric <> trunc((p_target->>'startLine')::numeric) or (p_target->>'endLine')::numeric <> trunc((p_target->>'endLine')::numeric)
        or (p_target->>'startLine')::int < 1 or (p_target->>'endLine')::int < (p_target->>'startLine')::int
        or (p_target->>'endLine')::int > cardinality(string_to_array(value_text,E'\n')) then raise exception 'Choose lines in this recorded edit' using errcode='23514'; end if;
    end if;
  elsif p_target->>'kind' = 'passage' then
    location := p_target->'rectangle';
    if p_target - 'kind' - 'recordId' - 'sha256' - 'page' - 'passage' - 'rectangle' <> '{}'::jsonb
      or coalesce(p_target->>'sha256','') !~ '^[a-f0-9]{64}$'
      or jsonb_typeof(p_target->'page') is distinct from 'number' or (p_target->>'page')::numeric <> trunc((p_target->>'page')::numeric)
      or (p_target->>'page')::int not between 1 and 100000
      or jsonb_typeof(p_target->'passage') is distinct from 'string' or length(p_target->>'passage') > 10000
      or jsonb_typeof(location) is distinct from 'object' or location - 'x' - 'y' - 'width' - 'height' <> '{}'::jsonb
      or not (location ?& array['x','y','width','height'])
      or exists(select 1 from jsonb_each(location) x where jsonb_typeof(x.value)<>'number') then raise exception 'Invalid passage anchor' using errcode='23514'; end if;
    if (location->>'x')::numeric<0 or (location->>'y')::numeric<0 or (location->>'width')::numeric<=0 or (location->>'height')::numeric<=0
      or (location->>'x')::numeric+(location->>'width')::numeric>1 or (location->>'y')::numeric+(location->>'height')::numeric>1 then raise exception 'The selected region is outside the page' using errcode='23514'; end if;
    select a.program_id,true into program,found_target from public.evidence_versions v join public.evidence_artifacts a on a.tenant_id=v.tenant_id and a.id=v.artifact_id
      where v.tenant_id=p_tenant_id and v.id=(p_target->>'recordId')::uuid and lower(v.sha256)=p_target->>'sha256';
  elsif p_target->>'kind' in ('requirement','mapping','evidence') then
    if p_target - 'kind' - 'recordId' <> '{}'::jsonb or p_target->>'recordId' is null then
      raise exception 'Invalid review target fields' using errcode='23514';
    end if;
    if p_target->>'kind' = 'requirement' then
      select r.program_id, true into program, found_target from public.engineering_requirements r
        where r.tenant_id=p_tenant_id and r.id=(p_target->>'recordId')::uuid;
    elsif p_target->>'kind' = 'mapping' then
      select r.program_id, true into program, found_target from public.requirement_control_links l
        join public.requirement_revisions v on v.tenant_id=l.tenant_id and v.id=l.requirement_revision_id
        join public.engineering_requirements r on r.tenant_id=v.tenant_id and r.id=v.engineering_requirement_id
        where l.tenant_id=p_tenant_id and l.id=(p_target->>'recordId')::uuid;
    else
      select a.program_id, true into program, found_target from public.evidence_versions v
        join public.evidence_artifacts a on a.tenant_id=v.tenant_id and a.id=v.artifact_id
        where v.tenant_id=p_tenant_id and v.id=(p_target->>'recordId')::uuid;
    end if;
  elsif p_target->>'kind' = 'cell' then
    if p_target - 'kind' - 'programId' - 'workbookId' - 'sheetId' - 'rowId' - 'columnId' <> '{}'::jsonb
      or coalesce(p_target->>'sheetId','') !~ '^[A-Za-z0-9_-]{1,160}$'
      or coalesce(p_target->>'rowId','') !~ '^[A-Za-z0-9_-]{1,160}$'
      or coalesce(p_target->>'columnId','') !~ '^[A-Za-z0-9_-]{1,160}$' then
      raise exception 'Invalid cell review target' using errcode='23514';
    end if;
    select * into saved from public.assurance_workbooks where tenant_id=p_tenant_id
      and id=(p_target->>'workbookId')::uuid and program_id=(p_target->>'programId')::uuid;
    if not found then raise exception 'Save this workbook before starting a cell review' using errcode='23514'; end if;
    program := saved.program_id;
    for sheet in select value from jsonb_array_elements(coalesce(saved.document->'analysis'->'sheets','[]'::jsonb)) loop
      if sheet->>'id'=p_target->>'sheetId' and sheet->>'mode'='freeform'
        and exists(select 1 from jsonb_array_elements(sheet->'rows') x where x->>'id'=p_target->>'rowId')
        and exists(select 1 from jsonb_array_elements(sheet->'columns') x where x->>'id'=p_target->>'columnId') then
        found_target := true;
      end if;
    end loop;
    if not found_target and p_target->>'rowId' ~ '^[0-9a-fA-F-]{36}$' then
      row_id := (p_target->>'rowId')::uuid;
      if p_target->>'sheetId'='requirements' then
        select exists(select 1 from public.requirement_workbook_rows r where r.tenant_id=p_tenant_id and r.program_id=program and r.id=row_id and to_jsonb(r) ? (p_target->>'columnId')) into found_target;
      elsif p_target->>'sheetId'='mappings' then
        select exists(select 1 from public.program_sctm_rows r where r.tenant_id=p_tenant_id and r.program_id=program and r.id=row_id and to_jsonb(r) ? (p_target->>'columnId')) into found_target;
      end if;
    end if;
  else raise exception 'Unsupported review target' using errcode='23514';
  end if;
  if not coalesce(found_target,false) then raise exception 'The review target is unavailable in this workspace or saved workbook' using errcode='23514'; end if;
  return program;
end;
$$;

alter table public.assurance_review_threads add column target_context jsonb not null default '{}'::jsonb;
-- Capture source facts at creation. These are context, never mutable live requirement text.
create function public.capture_assurance_review_context() returns trigger language plpgsql security definer set search_path='' as $$
declare v public.evidence_versions; c public.assurance_citations;
begin
  if new.target->>'kind'='requirement' then
    select jsonb_build_object('contentId',r.id,'revision',r.revision,'title',r.title,'statement',r.statement,'acceptanceCriteria',r.acceptance_criteria,'rationale',r.rationale)
      into new.target_context from public.requirement_revisions r where r.tenant_id=new.tenant_id and r.engineering_requirement_id=(new.target->>'recordId')::uuid order by r.version_number desc limit 1;
  elsif new.target->>'kind'='requirement-change' then
    select jsonb_build_object('editId',e.id,'occurredAt',e.occurred_at,'field',new.target->>'field','side',new.target->>'side','value',e.changes->(new.target->>'field')->(new.target->>'side')) into new.target_context
      from public.activity_events e where e.tenant_id=new.tenant_id and e.id=(new.target->>'editId')::uuid;
  elsif new.target->>'kind'='citation' then
    select * into c from public.assurance_citations where tenant_id=new.tenant_id and id=(new.target->>'recordId')::uuid;
    new.target_context := jsonb_build_object('evidenceVersionId',c.evidence_version_id,'sha256',c.evidence_sha256,'passage',c.passage,'page',c.page,'rectangle',c.rectangle,'sourceStorageObjectName',c.source_storage_object_name,'sourceStorageObjectId',c.source_storage_object_id);
  elsif new.target->>'kind'='passage' then
    select * into v from public.evidence_versions where tenant_id=new.tenant_id and id=(new.target->>'recordId')::uuid for share;
    if lower(v.sha256) is distinct from new.target->>'sha256' then raise exception 'The evidence changed. Reopen it before discussing this passage.' using errcode='PT409'; end if;
    new.target_context := new.target || jsonb_build_object('evidenceVersionId',v.id,'sourceStorageObjectName',v.storage_object_name,'sourceStorageObjectId',v.storage_object_id);
  end if;
  new.target_context := coalesce(new.target_context,'{}'::jsonb);
  return new;
end;
$$;
revoke all on function public.capture_assurance_review_context() from public,anon,authenticated;
create trigger capture_assurance_review_context before insert on public.assurance_review_threads for each row execute function public.capture_assurance_review_context();
-- Keep privately stored bytes pinned by passage discussions, just as citations pin them.
create or replace function public.can_access_evidence_object(object_name text, writing boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_tenant uuid; version_state text;
begin
  if writing then
    select tenant_id,state into owner_tenant,version_state from public.evidence_versions where storage_object_name=object_name for update;
    if owner_tenant is null then return false; end if;
    return version_state='draft' and public.can_write_tenant(owner_tenant)
      and not exists(select 1 from public.assurance_citations c where c.source_storage_object_name=object_name)
      and not exists(select 1 from public.assurance_review_threads t where t.target_context->>'sourceStorageObjectName'=object_name);
  end if;
  return exists(select 1 from public.evidence_versions v where v.storage_object_name=object_name and public.can_read_tenant(v.tenant_id))
    or exists(select 1 from public.assurance_citations c where c.source_storage_object_name=object_name and public.can_read_tenant(c.tenant_id))
    or exists(select 1 from public.assurance_review_threads t where t.target_context->>'sourceStorageObjectName'=object_name and public.can_read_tenant(t.tenant_id));
end;
$$;
