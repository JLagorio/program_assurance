-- Artifact identity and its initial draft metadata are one confirmed user action.
create table public.evidence_create_requests (
  id uuid not null,
  tenant_id uuid not null references public.tenants(id),
  artifact_id uuid,
  version_id uuid,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (tenant_id, artifact_id),
  foreign key (tenant_id, artifact_id) references public.evidence_artifacts(tenant_id, id) on delete set null (artifact_id),
  foreign key (tenant_id, version_id) references public.evidence_versions(tenant_id, id) on delete set null (version_id)
);
alter table public.evidence_create_requests enable row level security;
revoke all on public.evidence_create_requests from public, anon, authenticated;
comment on table public.evidence_create_requests is 'Private artifact-creation receipts. Identical retries return the original artifact and first draft version.';

create function public.create_evidence_with_version(p_tenant_id uuid, p_request_id uuid, p_evidence jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  receipt public.evidence_create_requests;
  input_hash text;
  chosen_program uuid;
  chosen_scope uuid;
  chosen_owner uuid;
  collected timestamptz;
  artifact_title text;
  artifact_kind text;
  source_link text;
  new_artifact_id uuid;
  new_version_id uuid;
  field_name text;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot add evidence' using errcode = '42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_evidence) is distinct from 'object' or octet_length(p_evidence::text) > 50000 then
    raise exception 'Invalid evidence creation request' using errcode = '23514';
  end if;
  if (p_evidence - 'title' - 'artifactKind' - 'programId' - 'scopeId' - 'ownerPartyId' - 'description' - 'externalUri' - 'collectedAt' - 'provenance') <> '{}'::jsonb then
    raise exception 'The evidence request contains unsupported fields' using errcode = '23514';
  end if;
  input_hash := encode(extensions.digest(p_evidence::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/evidence-create/' || p_request_id::text, 0));
  select * into receipt from public.evidence_create_requests where tenant_id = p_tenant_id and id = p_request_id;
  if found then
    if receipt.created_by <> auth.uid() or receipt.payload_sha256 <> input_hash then
      raise exception 'This request already created evidence with different details. Open the saved artifact before starting another creation request.' using errcode = 'PT409';
    end if;
    if receipt.artifact_id is null or receipt.version_id is null then
      raise exception 'The artifact or first version from this request was deleted. Start a new request to add evidence.' using errcode = 'PT409';
    end if;
    return jsonb_build_object('artifactId', receipt.artifact_id, 'versionId', receipt.version_id);
  end if;
  if jsonb_typeof(p_evidence->'title') is distinct from 'string' or length(btrim(p_evidence->>'title')) not between 1 and 1000 then
    raise exception 'Enter an artifact title of 1 to 1000 characters' using errcode = '23514';
  end if;
  if jsonb_typeof(p_evidence->'artifactKind') is distinct from 'string' or (p_evidence->>'artifactKind') not in ('document','image','dataset','log','scan','interview','test_record','other') then
    raise exception 'Choose an available evidence kind' using errcode = '23514';
  end if;
  foreach field_name in array array['programId','scopeId','ownerPartyId','description','externalUri','collectedAt','provenance'] loop
    if p_evidence ? field_name and jsonb_typeof(p_evidence->field_name) not in ('string','null') then
      raise exception 'Invalid value for %', field_name using errcode = '23514';
    end if;
  end loop;
  if length(coalesce(p_evidence->>'description','')) > 10000 or length(coalesce(p_evidence->>'provenance','')) > 10000 then
    raise exception 'Description and provenance must each be at most 10000 characters' using errcode = '23514';
  end if;
  begin
    chosen_program := nullif(p_evidence->>'programId','')::uuid;
    chosen_scope := nullif(p_evidence->>'scopeId','')::uuid;
    chosen_owner := nullif(p_evidence->>'ownerPartyId','')::uuid;
  exception when invalid_text_representation then
    raise exception 'Choose existing program, scope, and owner records' using errcode = '23514';
  end;
  artifact_title := btrim(p_evidence->>'title');
  artifact_kind := p_evidence->>'artifactKind';
  source_link := nullif(btrim(p_evidence->>'externalUri'),'');
  if source_link is not null and (length(source_link) > 4000 or source_link !~* '^(https?://[^/?#[:space:]]+[^[:space:]]*|urn:[^[:space:]]+)$') then
    raise exception 'Enter an absolute HTTP, HTTPS, or URN evidence reference' using errcode = '23514';
  end if;
  if nullif(p_evidence->>'collectedAt','') is not null then
    if (p_evidence->>'collectedAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then
      raise exception 'Enter a collection date and time with its timezone' using errcode = '23514';
    end if;
    begin collected := (p_evidence->>'collectedAt')::timestamptz;
    exception when invalid_datetime_format or datetime_field_overflow or sqlstate '22009' then
      raise exception 'Enter a valid collection date and time' using errcode = '23514';
    end;
    if not isfinite(collected) then raise exception 'Enter a finite collection date and time' using errcode = '23514'; end if;
  end if;
  if chosen_program is not null then
    perform 1 from public.programs where tenant_id = p_tenant_id and id = chosen_program for share;
    if not found then raise exception 'Choose a program in this workspace' using errcode = '23514'; end if;
  end if;
  if chosen_scope is not null then
    if chosen_program is null then raise exception 'Choose a program before selecting an evidence scope' using errcode = '23514'; end if;
    perform 1 from public.scopes sc join public.systems sy on sy.id = sc.system_id and sy.tenant_id = sc.tenant_id
      where sc.tenant_id = p_tenant_id and sc.id = chosen_scope and sy.program_id = chosen_program for share of sc, sy;
    if not found then raise exception 'Choose a scope belonging to the selected program' using errcode = '23514'; end if;
  end if;
  if chosen_owner is not null then
    perform 1 from public.parties where tenant_id = p_tenant_id and id = chosen_owner for share;
    if not found then raise exception 'Choose an owner in this workspace' using errcode = '23514'; end if;
  end if;
  insert into public.evidence_artifacts (tenant_id,title,artifact_kind,program_id,scope_id,owner_party_id,description,source_uri)
    values (p_tenant_id,artifact_title,artifact_kind,chosen_program,chosen_scope,chosen_owner,nullif(btrim(p_evidence->>'description'),''),source_link)
    returning id into new_artifact_id;
  insert into public.evidence_versions (tenant_id,artifact_id,version_number,state,external_uri,collected_at,provenance)
    values (p_tenant_id,new_artifact_id,1,'draft',source_link,collected,nullif(btrim(p_evidence->>'provenance'),'')) returning id into new_version_id;
  insert into public.evidence_create_requests (id,tenant_id,artifact_id,version_id,payload_sha256,created_by)
    values (p_request_id,p_tenant_id,new_artifact_id,new_version_id,input_hash,auth.uid());
  return jsonb_build_object('artifactId',new_artifact_id,'versionId',new_version_id);
end;
$$;
revoke all on function public.create_evidence_with_version(uuid,uuid,jsonb) from public, anon;
grant execute on function public.create_evidence_with_version(uuid,uuid,jsonb) to authenticated;
comment on function public.create_evidence_with_version(uuid,uuid,jsonb) is 'Atomically creates an artifact and first draft metadata version with tenant, program, scope, owner and safe-retry validation. No upload, publication, review or checksum is invented.';
