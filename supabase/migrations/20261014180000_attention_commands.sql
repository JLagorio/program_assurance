-- Personal attention commands retain receipts and tombstones so lost responses,
-- multiple tabs, and state cycles cannot silently overwrite newer reader intent.
alter table public.assurance_attention_acknowledgments
  alter column state drop not null,
  add column version bigint not null default 1 check (version between 1 and 9007199254740991);
revoke insert, update, delete on public.assurance_attention_acknowledgments from public, anon, authenticated;

create table public.assurance_attention_requests (
  tenant_id uuid not null references public.tenants(id),
  id uuid not null,
  created_by uuid not null references auth.users(id),
  payload_sha256 text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, id)
);
alter table public.assurance_attention_requests enable row level security;
revoke all on public.assurance_attention_requests from public, anon, authenticated;

create function public.command_assurance_attention(p_tenant_id uuid, p_request_id uuid, p_command jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  receipt public.assurance_attention_requests%rowtype;
  acknowledgment public.assurance_attention_acknowledgments%rowtype;
  payload_hash text;
  item text := p_command->>'itemKey';
  source text := p_command->>'sourceRevision';
  operation text := p_command->>'operation';
  requested_state text := p_command->>'state';
  expected_version bigint;
  current_version bigint;
  previous_state text;
  changed boolean := false;
  result jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode='42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_command) is distinct from 'object'
    or octet_length(p_command::text)>4000
    or (p_command - array['itemKey','sourceRevision','operation','expectedVersion','state']) <> '{}'::jsonb
    or jsonb_typeof(p_command->'itemKey') is distinct from 'string' or length(item) not between 1 and 200
    or jsonb_typeof(p_command->'sourceRevision') is distinct from 'string' or length(source) not between 1 and 300
    or operation is null or operation not in ('observe','set-state')
    or not (p_command ? 'state') or (p_command->'state' <> 'null'::jsonb and requested_state not in ('seen','done'))
    or (operation='observe' and requested_state is distinct from 'seen')
    or jsonb_typeof(p_command->'expectedVersion') is distinct from 'number'
    or (p_command->>'expectedVersion') !~ '^(0|[1-9][0-9]{0,15})$' then
    raise exception 'Enter a valid attention command' using errcode='23514';
  end if;
  expected_version := (p_command->>'expectedVersion')::bigint;
  if expected_version>9007199254740991 then
    raise exception 'Enter a valid attention version' using errcode='23514';
  end if;
  payload_hash := encode(extensions.digest(p_command::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/assurance-attention-request/'||p_request_id::text,0));
  select * into receipt from public.assurance_attention_requests where tenant_id=p_tenant_id and id=p_request_id;
  if found then
    if receipt.created_by<>auth.uid() or receipt.payload_sha256<>payload_hash then
      raise exception 'This request already saved different attention changes' using errcode='PT409';
    end if;
    return receipt.result;
  end if;
  -- Include the actor and exact source revision, and lock even an absent row.
  perform pg_advisory_xact_lock(hashtextextended(jsonb_build_array(p_tenant_id,auth.uid(),item,source)::text,0));
  select * into acknowledgment from public.assurance_attention_acknowledgments
    where tenant_id=p_tenant_id and user_id=auth.uid() and item_key=item and source_revision=source;
  current_version := coalesce(acknowledgment.version,0);
  previous_state := acknowledgment.state;
  -- Opening an already completed item is observational, even from a stale tab.
  if not (operation='observe' and previous_state is not distinct from 'done') then
    if current_version<>expected_version then
      raise exception 'Attention changed in another tab. Reload before changing it.' using errcode='PT409';
    end if;
    if previous_state is distinct from requested_state then
      current_version := current_version+1;
      insert into public.assurance_attention_acknowledgments(tenant_id,user_id,item_key,source_revision,state,version)
      values(p_tenant_id,auth.uid(),item,source,requested_state,current_version)
      on conflict(tenant_id,user_id,item_key,source_revision) do update
        set state=excluded.state,version=excluded.version,updated_at=now();
      acknowledgment.state := requested_state;
      changed := true;
    end if;
  end if;
  result := jsonb_build_object('state',acknowledgment.state,'version',current_version,'previousState',previous_state,'changed',changed);
  insert into public.assurance_attention_requests(tenant_id,id,created_by,payload_sha256,result)
    values(p_tenant_id,p_request_id,auth.uid(),payload_hash,result);
  return result;
end; $$;
revoke all on function public.command_assurance_attention(uuid,uuid,jsonb) from public, anon;
grant execute on function public.command_assurance_attention(uuid,uuid,jsonb) to authenticated;

create or replace function public.read_assurance_attention(p_tenant_id uuid,p_state text default 'open',p_offset integer default 0,p_limit integer default 25)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare answer jsonb;
begin
 if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
 if p_state not in ('open','unread','done','all') or p_state is null or p_offset is null or p_offset not between 0 and 100000 or p_limit is null or p_limit not between 1 and 100 then raise exception 'Invalid attention query' using errcode='23514'; end if;
 with items as (select s.*,a.state,coalesce(a.version,0) ack_version from public.assurance_attention_sources s left join public.assurance_attention_acknowledgments a
   on a.tenant_id=s.tenant_id and a.user_id=auth.uid() and a.item_key=s.item_key and a.source_revision=s.source_revision
   where s.tenant_id=p_tenant_id), filtered as (select * from items where p_state='all'
   or (p_state='open' and state is distinct from 'done') or (p_state='unread' and state is null) or (p_state='done' and state='done'))
 select jsonb_build_object('count',(select count(*) from filtered),'rows',coalesce((select jsonb_agg(to_jsonb(x)) from (
   select * from filtered order by updated_at desc,item_key offset p_offset limit p_limit)x),'[]'::jsonb)) into answer;
 return answer;
end; $$;
