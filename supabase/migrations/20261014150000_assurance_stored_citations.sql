-- Extend exact citations to privately stored evidence without retaining signed URLs.
alter table public.assurance_citations
  add column source_storage_object_id uuid references storage.objects(id) on delete restrict,
  add column source_storage_object_name text,
  add constraint assurance_citation_storage_locator check (
    (source_storage_object_id is null and source_storage_object_name is null)
    or (source_storage_object_id is not null and source_storage_object_name is not null
      and source_storage_object_name like tenant_id::text||'/%'
      and source_uri='storage://evidence/'||source_storage_object_name)
  );

-- A cited object's bytes are immutable to workspace clients, including while its
-- evidence version is draft. A captured citation remains readable if the draft's
-- attachment changes; downloads also verify its captured SHA-256.
create or replace function public.can_access_evidence_object(object_name text, writing boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_tenant uuid; version_state text;
begin
  if writing then
    select tenant_id,state into owner_tenant,version_state from public.evidence_versions
      where storage_object_name=object_name for share;
    if owner_tenant is null then return false; end if;
    return version_state='draft' and public.can_write_tenant(owner_tenant)
      and not exists(select 1 from public.assurance_citations c where c.source_storage_object_name=object_name);
  end if;
  return exists(select 1 from public.evidence_versions v where v.storage_object_name=object_name and public.can_read_tenant(v.tenant_id))
    or exists(select 1 from public.assurance_citations c where c.source_storage_object_name=object_name and public.can_read_tenant(c.tenant_id));
end;
$$;

create or replace function public.command_assurance_review(p_tenant_id uuid, p_request_id uuid, p_command jsonb)
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
    if evidence.storage_object_id is not null and evidence.storage_object_name is not null then
      -- Capture the actual attached object, never a caller locator or a temporary signed URL.
      perform 1 from storage.objects o where o.id=evidence.storage_object_id
        and o.bucket_id='evidence' and o.name=evidence.storage_object_name for share;
      if not found then raise exception 'The attached evidence object is unavailable' using errcode='23514'; end if;
      source_uri := 'storage://evidence/'||evidence.storage_object_name;
    else
      source_uri := coalesce(nullif(evidence.external_uri,''),nullif(artifact.source_uri,''));
    end if;
    if evidence.sha256 is null or lower(evidence.sha256) !~ '^[a-f0-9]{64}$' then raise exception 'Record the evidence file SHA-256 before creating an exact citation' using errcode='23514'; end if;
    if source_uri is null or (evidence.storage_object_id is null and source_uri !~* '^https?://') then raise exception 'Attach an evidence file or record an HTTP(S) source before creating a citation' using errcode='23514'; end if;
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
    insert into public.assurance_citations(tenant_id,program_id,target,evidence_version_id,evidence_sha256,evidence_revision,evidence_title,version_number,source_uri,source_storage_object_id,source_storage_object_name,passage,page,anchor,rectangle,created_by,author_name)
      values(p_tenant_id,program,target,evidence.id,lower(evidence.sha256),evidence.revision,artifact.title,evidence.version_number,source_uri,evidence.storage_object_id,case when evidence.storage_object_id is not null then evidence.storage_object_name else null end,body,page_number,anchor,rectangle,auth.uid(),author) returning id into record_id;
    result := jsonb_build_object('citationId',record_id);
  else raise exception 'Unsupported review operation' using errcode='23514';
  end if;
  insert into public.assurance_review_requests(tenant_id,id,created_by,payload_sha256,result)
    values(p_tenant_id,p_request_id,auth.uid(),payload_hash,result);
  return result;
end;
$$;

comment on column public.assurance_citations.source_storage_object_name is 'Captured private evidence bucket object name. Not a signed URL; read access remains workspace scoped.';
