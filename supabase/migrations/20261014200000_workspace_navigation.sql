-- Reader-owned destinations. Names and URLs are always resolved from authorized records.
create table public.assurance_navigation_items (
  tenant_id uuid not null references public.tenants(id),
  user_id uuid not null references auth.users(id),
  target_key text not null,
  target jsonb not null,
  favorite boolean not null default false,
  position integer not null default 0,
  visited_at timestamptz,
  primary key(tenant_id,user_id,target_key)
);
alter table public.assurance_navigation_items enable row level security;
create policy own_navigation on public.assurance_navigation_items for select to authenticated
using(user_id=auth.uid() and public.can_read_tenant(tenant_id));
revoke all on public.assurance_navigation_items from public,anon,authenticated;
grant select on public.assurance_navigation_items to authenticated;

create function public.resolve_assurance_destination(p_tenant_id uuid,p_target jsonb)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare target_kind text:=p_target->>'kind'; record_id uuid; sheet text:=p_target->>'sheetId';
 title text; identifier text; href text; view_row public.assurance_saved_views; program_name text;
begin
 if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
 if jsonb_typeof(p_target)<>'object' or p_target->>'recordId' is null or
   (select count(*) from jsonb_object_keys(p_target)) > (case when target_kind='workbook-sheet' then 3 else 2 end)
   or target_kind not in ('program','requirement','control','evidence','citation','risk','finding','saved-view','workbook-sheet') then
   raise exception 'Unsupported navigation target' using errcode='23514'; end if;
 begin record_id:=(p_target->>'recordId')::uuid; exception when invalid_text_representation then raise exception 'Invalid record identity' using errcode='23514'; end;
 if target_kind='saved-view' then
   select * into view_row from public.assurance_saved_views v where v.tenant_id=p_tenant_id and v.id=record_id and (v.owner_id=auth.uid() or v.visibility='workspace');
   if not found then return null; end if;
   title:=view_row.name;
   if view_row.definition->'destination'->>'href' ~ '^/[a-zA-Z0-9/_-]+([?][^#]*)?$' and left(view_row.definition->'destination'->>'href',2)<>'//' and position(E'\\' in (view_row.definition->'destination'->>'href'))=0 and split_part(view_row.definition->'destination'->>'href','?',1)=(case when view_row.scope_key ~ '^program:[0-9a-f-]{36}:workbook$' then '/programs/'||split_part(view_row.scope_key,':',2)||'/workbook' else split_part(view_row.scope_key,':',1) end) then
     href:=view_row.definition->'destination'->>'href';
   elsif view_row.scope_key ~ '^program:[0-9a-f-]{36}:workbook$' then
     select p.name into program_name from public.programs p where p.tenant_id=p_tenant_id and p.id=split_part(view_row.scope_key,':',2)::uuid;
     if not found then return null; end if;
     href:='/programs/'||split_part(view_row.scope_key,':',2)||'/workbook';
   else return null; end if;
   href:=href||case when position('?' in href)>0 then '&' else '?' end||'savedView='||record_id;
 elsif target_kind='workbook-sheet' then
   if sheet is null or sheet !~ '^[a-zA-Z0-9_-]{1,160}$' then raise exception 'Invalid sheet identity' using errcode='23514'; end if;
   select p.name into program_name from public.programs p where p.tenant_id=p_tenant_id and p.id=record_id;
   if not found then return null; end if;
   title:=case sheet when 'requirements' then 'Requirements' when 'mappings' then 'SCTM' when 'allocations' then 'Allocations' when 'evidence' then 'Evidence' when 'systems' then 'Systems' when 'selectedControls' then 'Selected controls' end;
   if title is null then
     select s->>'name' into title from public.assurance_workbooks w cross join lateral jsonb_array_elements(coalesce(w.document->'analysis'->'sheets','[]'::jsonb)) s
      where w.tenant_id=p_tenant_id and w.program_id=record_id and s->>'id'=sheet;
   end if;
   if title is null then return null; end if;
   title:=program_name||' · '||title;
   href:='/programs/'||record_id||'/workbook?sheet='||sheet;
 else
   select d.title,d.identifier,d.href into title,identifier,href from public.assurance_search_documents d
     where d.id=record_id and d.kind=target_kind and (d.tenant_id=p_tenant_id or (target_kind='control' and d.tenant_id is null)) limit 1;
   if not found then return null; end if;
 end if;
 return jsonb_build_object('target',p_target,'key',target_kind||':'||record_id||case when sheet is null then '' else ':'||sheet end,'title',title,'identifier',identifier,'href',href);
end; $$;
revoke all on function public.resolve_assurance_destination(uuid,jsonb) from public,anon;
grant execute on function public.resolve_assurance_destination(uuid,jsonb) to authenticated;

create function public.read_assurance_navigation(p_tenant_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare answer jsonb;
begin
 if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('key',n.target_key,'target',n.target,'favorite',n.favorite,'position',n.position,'visitedAt',n.visited_at,'destination',public.resolve_assurance_destination(p_tenant_id,n.target)) order by n.position,n.visited_at desc),'[]'::jsonb)
 into answer from public.assurance_navigation_items n where n.tenant_id=p_tenant_id and n.user_id=auth.uid();
 return answer;
end; $$;
revoke all on function public.read_assurance_navigation(uuid) from public,anon;
grant execute on function public.read_assurance_navigation(uuid) to authenticated;

create function public.command_assurance_navigation(p_tenant_id uuid,p_operation text,p_target jsonb default null,p_keys text[] default null)
returns void language plpgsql security definer set search_path='' as $$
declare destination jsonb; nav_key text; next_position integer;
begin
 if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||':'||auth.uid()::text||':navigation',0));
 if p_operation='clear-recent' then
   update public.assurance_navigation_items set visited_at=null where tenant_id=p_tenant_id and user_id=auth.uid();
   delete from public.assurance_navigation_items where tenant_id=p_tenant_id and user_id=auth.uid() and not favorite;
   return;
 elsif p_operation='reorder' then
   if p_keys is null or cardinality(p_keys)>100 or cardinality(p_keys)<>(select count(distinct k) from unnest(p_keys) k)
    or cardinality(p_keys)<>(select count(*) from public.assurance_navigation_items where tenant_id=p_tenant_id and user_id=auth.uid() and favorite)
    or exists(select 1 from unnest(p_keys) k where not exists(select 1 from public.assurance_navigation_items n where n.tenant_id=p_tenant_id and n.user_id=auth.uid() and n.favorite and n.target_key=k)) then
      raise exception 'Favorites changed. Reload before reordering.' using errcode='PT409'; end if;
   update public.assurance_navigation_items n set position=k.ordinality from unnest(p_keys) with ordinality k(key,ordinality)
    where n.tenant_id=p_tenant_id and n.user_id=auth.uid() and n.target_key=k.key;
   return;
 end if;
 if p_operation not in ('visit','favorite','unfavorite','forget') then raise exception 'Unsupported navigation operation' using errcode='23514'; end if;
 -- Removal stays possible after a target has been deleted or access to it has changed.
 nav_key:=(p_target->>'kind')||':'||(p_target->>'recordId')||case when p_target->>'sheetId' is null then '' else ':'||(p_target->>'sheetId') end;
 if p_operation='forget' then
   update public.assurance_navigation_items set visited_at=null where tenant_id=p_tenant_id and user_id=auth.uid() and assurance_navigation_items.target_key=nav_key;
 elsif p_operation='unfavorite' then
   update public.assurance_navigation_items set favorite=false where tenant_id=p_tenant_id and user_id=auth.uid() and assurance_navigation_items.target_key=nav_key;
 else
   destination:=public.resolve_assurance_destination(p_tenant_id,p_target);
   if destination is null then raise exception 'This destination is no longer available.' using errcode='P0002'; end if;
   nav_key:=destination->>'key';
   if p_operation='favorite' and (select count(*) from public.assurance_navigation_items where tenant_id=p_tenant_id and user_id=auth.uid() and favorite)>=100
     and not exists(select 1 from public.assurance_navigation_items n where n.tenant_id=p_tenant_id and n.user_id=auth.uid() and n.target_key=nav_key and favorite) then raise exception 'Keep at most 100 favorites.' using errcode='23514'; end if;
   select coalesce(max(position),0)+1 into next_position from public.assurance_navigation_items where tenant_id=p_tenant_id and user_id=auth.uid();
   insert into public.assurance_navigation_items(tenant_id,user_id,target_key,target,favorite,position,visited_at)
    values(p_tenant_id,auth.uid(),nav_key,p_target,p_operation='favorite',next_position,case when p_operation='visit' then now() end)
   on conflict(tenant_id,user_id,target_key) do update set
    favorite=assurance_navigation_items.favorite or excluded.favorite,
    visited_at=coalesce(excluded.visited_at,assurance_navigation_items.visited_at);
 end if;
 update public.assurance_navigation_items set visited_at=null where tenant_id=p_tenant_id and user_id=auth.uid() and target_key in (
    select n.target_key from public.assurance_navigation_items n where n.tenant_id=p_tenant_id and n.user_id=auth.uid() and n.visited_at is not null order by n.visited_at desc,n.target_key offset 50);
 delete from public.assurance_navigation_items where tenant_id=p_tenant_id and user_id=auth.uid() and not favorite and visited_at is null;
end; $$;
revoke all on function public.command_assurance_navigation(uuid,text,jsonb,text[]) from public,anon;
grant execute on function public.command_assurance_navigation(uuid,text,jsonb,text[]) to authenticated;
