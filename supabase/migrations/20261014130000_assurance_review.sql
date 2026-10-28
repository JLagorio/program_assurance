-- Contextual review is separate from canonical requirement, mapping and evidence decisions.
create table public.assurance_review_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  program_id uuid,
  target jsonb not null check (jsonb_typeof(target) = 'object'),
  subject text not null check (length(btrim(subject)) between 1 and 240),
  status text not null default 'open' check (status in ('open', 'resolved')),
  revision integer not null default 1 check (revision > 0),
  created_by uuid not null references auth.users(id),
  author_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id)
);
create index assurance_review_threads_target on public.assurance_review_threads using gin(target);
create index assurance_review_threads_inbox on public.assurance_review_threads(tenant_id, program_id, status, updated_at desc);
create table public.assurance_review_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  thread_id uuid not null,
  parent_id uuid,
  kind text not null default 'comment' check (kind in ('comment','resolved','reopened')),
  body text not null check (length(btrim(body)) between 1 and 10000),
  created_by uuid not null references auth.users(id),
  author_name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, thread_id, id),
  foreign key (tenant_id, thread_id) references public.assurance_review_threads(tenant_id, id) on delete cascade,
  foreign key (tenant_id, thread_id, parent_id) references public.assurance_review_messages(tenant_id, thread_id, id)
);
create index assurance_review_messages_thread on public.assurance_review_messages(tenant_id, thread_id, created_at);
create table public.assurance_citations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  program_id uuid,
  target jsonb not null check (jsonb_typeof(target) = 'object'),
  evidence_version_id uuid not null,
  evidence_sha256 text not null check (evidence_sha256 ~ '^[a-f0-9]{64}$'),
  evidence_revision integer not null,
  evidence_title text not null,
  version_number integer not null,
  source_uri text not null,
  passage text not null check (length(btrim(passage)) between 1 and 10000),
  page integer check (page between 1 and 100000),
  anchor text check (length(anchor) between 1 and 500),
  rectangle jsonb,
  created_by uuid not null references auth.users(id),
  author_name text not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id)
);
create index assurance_citations_target on public.assurance_citations using gin(target);
create index assurance_citations_version on public.assurance_citations(tenant_id, evidence_version_id, created_at desc);
create table public.assurance_review_requests (
  tenant_id uuid not null references public.tenants(id),
  id uuid not null,
  created_by uuid not null references auth.users(id),
  payload_sha256 text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, id)
);
alter table public.assurance_review_requests enable row level security;
revoke all on public.assurance_review_requests from public, anon, authenticated;
select public.apply_tenant_security('assurance_review_threads');
select public.apply_tenant_security('assurance_review_messages');
select public.apply_tenant_security('assurance_citations');
revoke insert, update, delete on public.assurance_review_threads, public.assurance_review_messages, public.assurance_citations from authenticated;

-- Resolve a target from authoritative rows. Caller-supplied tenant/program/author claims never
-- establish access. Saved analysis cells use their persisted stable row/column identities.
create function public.assurance_review_target_program(p_tenant_id uuid, p_target jsonb)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  program uuid;
  found_target boolean := false;
  saved public.assurance_workbooks%rowtype;
  sheet jsonb;
  row_id uuid;
begin
  if jsonb_typeof(p_target) is distinct from 'object' then raise exception 'Choose a review target' using errcode='23514'; end if;
  if p_target->>'kind' in ('requirement','mapping','evidence') then
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
revoke all on function public.assurance_review_target_program(uuid,jsonb) from public, anon, authenticated;

create function public.command_assurance_review(p_tenant_id uuid, p_request_id uuid, p_command jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  receipt public.assurance_review_requests%rowtype;
  thread public.assurance_review_threads%rowtype;
  evidence public.evidence_versions%rowtype;
  artifact public.evidence_artifacts%rowtype;
  payload_hash text;
  author text;
  operation text := p_command->>'operation';
  program uuid;
  record_id uuid;
  message_id uuid;
  body text;
  result jsonb;
  rectangle jsonb;
  target jsonb;
  source_uri text;
  anchor text;
  page_number integer;
  new_status text;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot write review discussions or citations' using errcode='42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_command) is distinct from 'object' or octet_length(p_command::text)>30000 then
    raise exception 'Enter a valid review command' using errcode='23514';
  end if;
  payload_hash := encode(extensions.digest(p_command::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/assurance-review/'||p_request_id::text,0));
  select * into receipt from public.assurance_review_requests where tenant_id=p_tenant_id and id=p_request_id;
  if found then
    if receipt.created_by<>auth.uid() or receipt.payload_sha256<>payload_hash then
      raise exception 'This request already saved different review changes' using errcode='PT409';
    end if;
    return receipt.result;
  end if;
  select p.name into author from public.parties p where p.tenant_id=p_tenant_id and p.auth_user_id=auth.uid() limit 1;
  author := coalesce(nullif(btrim(author),''),'Workspace member');
  if operation='create-thread' then
    if p_command - 'operation' - 'target' - 'subject' - 'body' <> '{}'::jsonb then raise exception 'Unknown thread fields' using errcode='23514'; end if;
    target := p_command->'target';
    program := public.assurance_review_target_program(p_tenant_id,target);
    body := btrim(p_command->>'body');
    if body is null or length(body) not between 1 and 10000 then raise exception 'Write a comment of at most 10,000 characters' using errcode='23514'; end if;
    insert into public.assurance_review_threads(tenant_id,program_id,target,subject,created_by,author_name)
      values(p_tenant_id,program,target,btrim(p_command->>'subject'),auth.uid(),author) returning * into thread;
    insert into public.assurance_review_messages(tenant_id,thread_id,body,created_by,author_name)
      values(p_tenant_id,thread.id,body,auth.uid(),author) returning id into message_id;
    result := jsonb_build_object('threadId',thread.id,'revision',thread.revision,'messageId',message_id);
  elsif operation in ('reply','set-status') then
    select * into thread from public.assurance_review_threads where tenant_id=p_tenant_id and id=(p_command->>'threadId')::uuid for update;
    if not found then raise exception 'This discussion is unavailable' using errcode='23514'; end if;
    if operation='reply' then
      if p_command - 'operation' - 'threadId' - 'parentId' - 'body' <> '{}'::jsonb then raise exception 'Unknown reply fields' using errcode='23514'; end if;
      body := btrim(p_command->>'body');
      if body is null or length(body) not between 1 and 10000 then raise exception 'Write a reply of at most 10,000 characters' using errcode='23514'; end if;
      if p_command->>'parentId' is not null and not exists(select 1 from public.assurance_review_messages where tenant_id=p_tenant_id and thread_id=thread.id and id=(p_command->>'parentId')::uuid and kind='comment') then
        raise exception 'Reply to a comment in this discussion' using errcode='23514';
      end if;
      insert into public.assurance_review_messages(tenant_id,thread_id,parent_id,body,created_by,author_name)
        values(p_tenant_id,thread.id,(p_command->>'parentId')::uuid,body,auth.uid(),author) returning id into message_id;
    else
      if p_command - 'operation' - 'threadId' - 'expectedRevision' - 'status' <> '{}'::jsonb then raise exception 'Unknown status fields' using errcode='23514'; end if;
      if (p_command->>'expectedRevision')::integer is distinct from thread.revision then
        raise exception 'This discussion changed. Reload it before resolving or reopening.' using errcode='PT409';
      end if;
      new_status := p_command->>'status';
      if new_status not in ('open','resolved') or new_status is null then raise exception 'Choose open or resolved' using errcode='23514'; end if;
      if new_status=thread.status then raise exception 'The discussion already has this status' using errcode='23514'; end if;
      insert into public.assurance_review_messages(tenant_id,thread_id,kind,body,created_by,author_name)
        values(p_tenant_id,thread.id,case when new_status='open' then 'reopened' else 'resolved' end,
          case when new_status='open' then 'Reopened this discussion.' else 'Resolved this discussion.' end,auth.uid(),author) returning id into message_id;
      update public.assurance_review_threads set status=new_status,
        resolved_at=case when new_status='resolved' then now() else null end,
        resolved_by=case when new_status='resolved' then auth.uid() else null end
        where id=thread.id;
    end if;
    update public.assurance_review_threads set revision=revision+1,updated_at=now() where id=thread.id returning * into thread;
    result := jsonb_build_object('threadId',thread.id,'revision',thread.revision,'messageId',message_id);
  elsif operation='create-citation' then
    if p_command - 'operation' - 'target' - 'evidenceVersionId' - 'expectedEvidenceRevision' - 'passage' - 'page' - 'anchor' - 'rectangle' <> '{}'::jsonb then raise exception 'Unknown citation fields' using errcode='23514'; end if;
    target := p_command->'target';
    program := public.assurance_review_target_program(p_tenant_id,target);
    select * into evidence from public.evidence_versions where tenant_id=p_tenant_id and id=(p_command->>'evidenceVersionId')::uuid for share;
    if not found then raise exception 'Choose an evidence version in this workspace' using errcode='23514'; end if;
    if (p_command->>'expectedEvidenceRevision')::integer is distinct from evidence.revision then raise exception 'The evidence version changed. Reload it before citing.' using errcode='PT409'; end if;
    select * into artifact from public.evidence_artifacts where tenant_id=p_tenant_id and id=evidence.artifact_id;
    if program is not null and artifact.program_id is not null and program<>artifact.program_id then raise exception 'Evidence belongs to another program' using errcode='23514'; end if;
    source_uri := coalesce(nullif(evidence.external_uri,''),nullif(artifact.source_uri,''));
    if evidence.sha256 is null or lower(evidence.sha256) !~ '^[a-f0-9]{64}$' then raise exception 'Record the evidence file SHA-256 before creating an exact citation' using errcode='23514'; end if;
    if source_uri is null or source_uri !~* '^https?://' then raise exception 'Record an HTTP(S) source or external URI before creating a citation' using errcode='23514'; end if;
    body := btrim(p_command->>'passage');
    if body is null or length(body) not between 1 and 10000 then raise exception 'Enter an exact passage of at most 10,000 characters' using errcode='23514'; end if;
    page_number := (p_command->>'page')::integer;
    anchor := nullif(btrim(p_command->>'anchor'),'');
    if page_number is null and anchor is null then raise exception 'Enter a page number or source anchor' using errcode='23514'; end if;
    rectangle := nullif(p_command->'rectangle','null'::jsonb);
    if rectangle is not null then
      if page_number is null or jsonb_typeof(rectangle)<>'object' or rectangle - 'x' - 'y' - 'width' - 'height'<>'{}'::jsonb
        or not (rectangle ?& array['x','y','width','height'])
        or exists(select 1 from jsonb_each(rectangle) x where jsonb_typeof(x.value)<>'number') then
        raise exception 'A rectangle needs a page and numeric x, y, width and height' using errcode='23514';
      end if;
      if (rectangle->>'x')::numeric<0 or (rectangle->>'y')::numeric<0
        or (rectangle->>'width')::numeric<=0 or (rectangle->>'height')::numeric<=0
        or (rectangle->>'x')::numeric+(rectangle->>'width')::numeric>1
        or (rectangle->>'y')::numeric+(rectangle->>'height')::numeric>1 then
        raise exception 'Rectangle coordinates must fit within the normalized page (0–1)' using errcode='23514';
      end if;
    end if;
    insert into public.assurance_citations(tenant_id,program_id,target,evidence_version_id,evidence_sha256,evidence_revision,evidence_title,version_number,source_uri,passage,page,anchor,rectangle,created_by,author_name)
      values(p_tenant_id,program,target,evidence.id,lower(evidence.sha256),evidence.revision,artifact.title,evidence.version_number,source_uri,body,page_number,anchor,rectangle,auth.uid(),author) returning id into record_id;
    result := jsonb_build_object('citationId',record_id);
  else raise exception 'Unsupported review operation' using errcode='23514';
  end if;
  insert into public.assurance_review_requests(tenant_id,id,created_by,payload_sha256,result)
    values(p_tenant_id,p_request_id,auth.uid(),payload_hash,result);
  return result;
end;
$$;
revoke all on function public.command_assurance_review(uuid,uuid,jsonb) from public, anon;
grant execute on function public.command_assurance_review(uuid,uuid,jsonb) to authenticated;
comment on table public.assurance_citations is 'Immutable quoted evidence-version references. Hash/URI/revision captured from the source; passage and location are user assertions, not a claim that a PDF parser verified them.';
comment on table public.assurance_review_threads is 'Workspace review discussion; resolving a thread does not change evidence approval or canonical assurance decisions.';
