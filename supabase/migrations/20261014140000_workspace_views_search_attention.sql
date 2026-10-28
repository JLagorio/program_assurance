-- Named reader-owned views and revision-specific attention acknowledgments.
create table public.assurance_saved_views (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  owner_id uuid not null references auth.users(id),
  scope_key text not null check(length(scope_key) between 1 and 300),
  name text not null check(length(btrim(name)) between 1 and 100),
  visibility text not null check(visibility in ('private','workspace')),
  definition jsonb not null check(jsonb_typeof(definition)='object' and octet_length(definition::text)<=50000),
  unique(tenant_id,id)
);
select public.attach_record_lifecycle('assurance_saved_views',false);
alter table public.assurance_saved_views enable row level security;
create policy saved_view_read on public.assurance_saved_views for select to authenticated
  using(public.can_read_tenant(tenant_id) and (owner_id=auth.uid() or visibility='workspace'));
revoke all on public.assurance_saved_views from public,anon,authenticated;
grant select on public.assurance_saved_views to authenticated;
create index assurance_saved_views_scope on public.assurance_saved_views(tenant_id,scope_key);

create function public.save_assurance_view(p_tenant_id uuid,p_id uuid,p_scope text,p_name text,p_visibility text,p_definition jsonb,p_revision bigint default null)
returns public.assurance_saved_views language plpgsql security definer set search_path='' as $$
declare current public.assurance_saved_views; answer public.assurance_saved_views;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
  if p_visibility='workspace' and not public.can_write_tenant(p_tenant_id) then raise exception 'Editor access is required to share a view' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into current from public.assurance_saved_views where id=p_id for update;
  if found then
    if current.tenant_id<>p_tenant_id or current.owner_id<>auth.uid() or current.scope_key<>p_scope then raise exception 'Only the author can change this view' using errcode='42501'; end if;
    if current.name=btrim(p_name) and current.visibility=p_visibility and current.definition=p_definition then return current; end if;
    if p_revision is null or current.revision<>p_revision then raise exception 'This view changed. Reload it before saving.' using errcode='PT409'; end if;
    update public.assurance_saved_views set name=btrim(p_name),visibility=p_visibility,definition=p_definition,revision=revision+1 where id=p_id returning * into answer;
  else
    if p_revision is not null then raise exception 'This view was removed. Save a new copy.' using errcode='PT409'; end if;
    insert into public.assurance_saved_views(id,tenant_id,owner_id,scope_key,name,visibility,definition)
      values(p_id,p_tenant_id,auth.uid(),p_scope,btrim(p_name),p_visibility,p_definition) returning * into answer;
  end if;
  return answer;
end; $$;
create function public.delete_assurance_view(p_tenant_id uuid,p_id uuid,p_revision bigint)
returns void language plpgsql security definer set search_path='' as $$
declare current public.assurance_saved_views;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
  select * into current from public.assurance_saved_views where id=p_id for update;
  if not found then return; end if;
  if current.tenant_id<>p_tenant_id or current.owner_id<>auth.uid() then raise exception 'Only the author can remove this view' using errcode='42501'; end if;
  if current.revision<>p_revision then raise exception 'This view changed. Reload it before removing it.' using errcode='PT409'; end if;
  delete from public.assurance_saved_views where id=p_id;
end; $$;
revoke all on function public.save_assurance_view(uuid,uuid,text,text,text,jsonb,bigint),public.delete_assurance_view(uuid,uuid,bigint) from public,anon;
grant execute on function public.save_assurance_view(uuid,uuid,text,text,text,jsonb,bigint),public.delete_assurance_view(uuid,uuid,bigint) to authenticated;

create table public.assurance_attention_acknowledgments (
  tenant_id uuid not null references public.tenants(id),
  user_id uuid not null references auth.users(id),
  item_key text not null check(length(item_key) between 1 and 200),
  source_revision text not null check(length(source_revision) between 1 and 300),
  state text not null check(state in ('seen','done')),
  updated_at timestamptz not null default now(),
  primary key(tenant_id,user_id,item_key,source_revision)
);
alter table public.assurance_attention_acknowledgments enable row level security;
create policy own_attention on public.assurance_attention_acknowledgments for all to authenticated
  using(user_id=auth.uid() and public.can_read_tenant(tenant_id))
  with check(user_id=auth.uid() and public.can_read_tenant(tenant_id));
revoke all on public.assurance_attention_acknowledgments from public,anon;
grant select,insert,update,delete on public.assurance_attention_acknowledgments to authenticated;

-- RLS applies independently to every branch, including public reference controls.
create view public.assurance_search_documents with(security_invoker=true) as
select p.tenant_id,'program'::text kind,p.id,p.code identifier,p.name title,p.description body,
 '/programs/'||p.id href,p.updated_at from public.programs p
union all select r.tenant_id,'requirement',r.id,r.code,c.title,concat_ws(E'\n',c.statement,c.acceptance_criteria,c.rationale),
 '/programs/'||r.program_id||'/requirements/'||r.id,c.updated_at
 from public.engineering_requirements r join lateral(select * from public.requirement_revisions c where c.tenant_id=r.tenant_id and c.engineering_requirement_id=r.id order by c.version_number desc limit 1)c on true
union all select c.tenant_id,'control',c.id,c.code,c.title,coalesce((select string_agg(p.prose,E'\n' order by p.id) from public.control_parts p where p.control_id=c.id),''),
 '/records/controls/'||c.id,c.updated_at from public.controls c
union all select a.tenant_id,'evidence',a.id,null,a.title,concat_ws(E'\n',a.description,(select string_agg(concat_ws(E'\n',v.description,v.provenance),E'\n') from public.evidence_versions v where v.tenant_id=a.tenant_id and v.artifact_id=a.id)),
 '/evidence?artifact='||a.id,a.updated_at from public.evidence_artifacts a
union all select c.tenant_id,'citation',c.id,null,c.evidence_title,c.passage,
 '/evidence?artifact='||v.artifact_id||'&version='||v.id||'&citation='||c.id,c.created_at
 from public.assurance_citations c join public.evidence_versions v on v.tenant_id=c.tenant_id and v.id=c.evidence_version_id
union all select r.tenant_id,'risk',r.id,null,r.title,r.status,'/risks/'||r.id,r.updated_at from public.risks r
union all select f.tenant_id,'finding',f.id,null,f.title,f.description,'/findings/'||f.id,f.updated_at from public.assessment_findings f;
revoke all on public.assurance_search_documents from public,anon;
grant select on public.assurance_search_documents to authenticated;
create function public.search_assurance_records(p_tenant_id uuid,p_query text,p_limit integer default 40)
returns table(kind text,id uuid,identifier text,title text,excerpt text,href text) language plpgsql stable security invoker set search_path='' as $$
declare q text:=btrim(p_query);
begin
 if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
 if q is null or length(q)<2 then return; end if;
 if length(q)>200 or p_limit is null or p_limit not between 1 and 100 then raise exception 'Search bounds exceeded' using errcode='23514'; end if;
 return query select d.kind,d.id,d.identifier,d.title,
   case when strpos(lower(coalesce(d.body,'')),lower(q))>0 then substring(d.body from greatest(1,strpos(lower(d.body),lower(q))-70) for 240) else left(coalesce(d.body,''),240) end,
   d.href
 from public.assurance_search_documents d
 where (d.tenant_id=p_tenant_id or d.tenant_id is null)
   and (strpos(lower(concat_ws(' ',d.identifier,d.title,d.body)),lower(q))>0)
 order by (strpos(lower(concat_ws(' ',d.identifier,d.title)),lower(q))>0) desc,d.updated_at desc,d.kind,d.id limit p_limit;
end; $$;
revoke all on function public.search_assurance_records(uuid,text,integer) from public,anon;
grant execute on function public.search_assurance_records(uuid,text,integer) to authenticated;


create view public.assurance_attention_sources with(security_invoker=true) as
select t.tenant_id,'review:'||t.id item_key,t.revision::text source_revision,'review'::text kind,
 t.subject title,'Open review discussion'::text reason,t.target,t.program_id,t.updated_at
 from public.assurance_review_threads t where t.status='open'
union all select t.tenant_id,'task:'||t.id,t.revision::text||':'||coalesce(t.due_on::text,''),'task',t.title,
 case when t.status='blocked' then 'Assigned task is blocked' else 'Assigned task is overdue' end,
 jsonb_build_object('kind','task','recordId',t.id),t.program_id,t.updated_at
 from public.task_rows t where t.assigned_to_me and t.status not in ('done','cancelled') and (t.status='blocked' or t.due_on<current_date)
union all select m.tenant_id,'mapping:'||m.id,
 md5(concat_ws(':',m.revision,m.profile_resolution_id,m.selected_control_id,m.baseline_source_system_id)),
 'mapping',m.requirement_code||' → '||coalesce(m.control_code,'Control'),'Mapping needs review',
 jsonb_build_object('kind','mapping','recordId',m.id),m.program_id,m.updated_at
 from public.program_sctm_rows m where m.needs_review
union all select c.tenant_id,'citation:'||c.id,
 md5(concat_ws(':',v.id,v.revision,v.sha256,latest.id,latest.revision)),'evidence',c.evidence_title,
 case when latest.id<>v.id then 'A newer evidence version is available' else 'Cited evidence content changed' end,
 jsonb_build_object('kind','evidence','recordId',v.id),c.program_id,greatest(v.updated_at,latest.updated_at)
 from public.assurance_citations c join public.evidence_versions v on v.tenant_id=c.tenant_id and v.id=c.evidence_version_id
 join lateral(select x.id,x.revision,x.updated_at from public.evidence_versions x where x.tenant_id=v.tenant_id and x.artifact_id=v.artifact_id order by x.version_number desc limit 1)latest on true
 where v.sha256 is distinct from c.evidence_sha256 or latest.id<>v.id;
revoke all on public.assurance_attention_sources from public,anon;
grant select on public.assurance_attention_sources to authenticated;
create function public.read_assurance_attention(p_tenant_id uuid,p_state text default 'open',p_offset integer default 0,p_limit integer default 25)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare answer jsonb;
begin
 if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
 if p_state not in ('open','unread','done','all') or p_state is null or p_offset is null or p_offset not between 0 and 100000 or p_limit is null or p_limit not between 1 and 100 then raise exception 'Invalid attention query' using errcode='23514'; end if;
 with items as (select s.*,a.state from public.assurance_attention_sources s left join public.assurance_attention_acknowledgments a
   on a.tenant_id=s.tenant_id and a.user_id=auth.uid() and a.item_key=s.item_key and a.source_revision=s.source_revision
   where s.tenant_id=p_tenant_id), filtered as (select * from items where p_state='all'
   or (p_state='open' and state is distinct from 'done') or (p_state='unread' and state is null) or (p_state='done' and state='done'))
 select jsonb_build_object('count',(select count(*) from filtered),'rows',coalesce((select jsonb_agg(to_jsonb(x)) from (
   select * from filtered order by updated_at desc,item_key offset p_offset limit p_limit)x),'[]'::jsonb)) into answer;
 return answer;
end; $$;
revoke all on function public.read_assurance_attention(uuid,text,integer,integer) from public,anon;
grant execute on function public.read_assurance_attention(uuid,text,integer,integer) to authenticated;
