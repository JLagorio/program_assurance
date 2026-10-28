create or replace function public.save_assurance_view(p_tenant_id uuid,p_id uuid,p_scope text,p_name text,p_visibility text,p_definition jsonb,p_revision bigint default null)
returns public.assurance_saved_views language plpgsql security definer set search_path='' as $$
declare current public.assurance_saved_views; answer public.assurance_saved_views;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
  if p_visibility='workspace' and not public.can_write_tenant(p_tenant_id) then raise exception 'Editor access is required to share a view' using errcode='42501'; end if;
  if jsonb_typeof(p_definition) is distinct from 'object'
    or p_definition->'version' is distinct from '1'::jsonb
    or ((p_definition->>'kind') in ('table','workbook')) is distinct from true
    or jsonb_typeof(p_definition->'question') is distinct from 'object'
    or (p_definition ? 'layout' and jsonb_typeof(p_definition->'layout') is distinct from 'object') then
    raise exception 'Use a supported view definition with version, kind and question' using errcode='23514';
  end if;
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

-- A missing CAS token must never authorize deletion of a saved view.
create or replace function public.delete_assurance_view(p_tenant_id uuid,p_id uuid,p_revision bigint)
returns void language plpgsql security definer set search_path='' as $$
declare current public.assurance_saved_views;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace access is required' using errcode='42501'; end if;
  select * into current from public.assurance_saved_views where id=p_id for update;
  if not found then return; end if;
  if current.tenant_id<>p_tenant_id or current.owner_id<>auth.uid() then raise exception 'Only the author can remove this view' using errcode='42501'; end if;
  if current.revision is distinct from p_revision then raise exception 'This view changed. Reload it before removing it.' using errcode='PT409'; end if;
  delete from public.assurance_saved_views where id=p_id;
end; $$;

-- Keep a generation after allocation deletion; current-row hashes alone cannot
-- distinguish an issue that was fixed and later recurred. Internal state is not
-- a user-editable product record and is unavailable through direct client CRUD.
create table public.assurance_allocation_attention_generations (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  requirement_revision_id uuid not null,
  system_id uuid not null,
  generation bigint not null check(generation>0),
  changed_at timestamptz not null,
  primary key(tenant_id,requirement_revision_id,system_id),
  foreign key(tenant_id,requirement_revision_id) references public.requirement_revisions(tenant_id,id) on delete cascade,
  foreign key(tenant_id,system_id) references public.systems(tenant_id,id) on delete cascade
);
alter table public.assurance_allocation_attention_generations enable row level security;
revoke all on public.assurance_allocation_attention_generations from public,anon,authenticated;

create function public.advance_allocation_attention_generation() returns trigger
language plpgsql security definer set search_path='' as $$
declare before_value jsonb; after_value jsonb; context record;
begin
  before_value:=case when tg_op<>'INSERT' then to_jsonb(old) else '{}'::jsonb end;
  after_value:=case when tg_op<>'DELETE' then to_jsonb(new) else '{}'::jsonb end;
  -- The earlier normalization trigger has already resolved legacy aliases.
  -- Rationale/metadata-only edits cannot change system applicability.
  if tg_op='UPDATE' and
    (old.tenant_id,old.requirement_revision_id,old.system_id) is not distinct from
    (new.tenant_id,new.requirement_revision_id,new.system_id) then return new; end if;
  for context in
    select distinct (v->>'tenant_id')::uuid tenant_id,
      (v->>'requirement_revision_id')::uuid requirement_revision_id,(v->>'system_id')::uuid system_id
    from (values(before_value),(after_value)) rows(v) where v->>'system_id' is not null
    order by 1,2,3
  loop
    insert into public.assurance_allocation_attention_generations as g
      (tenant_id,requirement_revision_id,system_id,generation,changed_at)
      values(context.tenant_id,context.requirement_revision_id,context.system_id,1,clock_timestamp())
      on conflict(tenant_id,requirement_revision_id,system_id) do update
        set generation=g.generation+1,changed_at=clock_timestamp();
  end loop;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;
revoke all on function public.advance_allocation_attention_generation() from public,anon,authenticated;
create trigger allocation_attention_generation after insert or update or delete
  on public.requirement_allocations for each row execute function public.advance_allocation_attention_generation();

create function public.assurance_allocation_attention_context(p_tenant_id uuid,p_requirement_revision_id uuid,p_system_id uuid)
returns table(generation bigint,changed_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode='42501';
  end if;
  return query select coalesce(g.generation,0),g.changed_at
    from (values(1)) anchor(n) left join public.assurance_allocation_attention_generations g
      on g.tenant_id=p_tenant_id and g.requirement_revision_id=p_requirement_revision_id and g.system_id=p_system_id;
end; $$;
revoke all on function public.assurance_allocation_attention_context(uuid,uuid,uuid) from public,anon;
grant execute on function public.assurance_allocation_attention_context(uuid,uuid,uuid) to authenticated;

create or replace view public.assurance_attention_sources with(security_invoker=true) as
select t.tenant_id,'review:'||t.id item_key,t.revision::text source_revision,'review'::text kind,
 t.subject title,'Open review discussion'::text reason,t.target,t.program_id,t.updated_at
 from public.assurance_review_threads t where t.status='open'
union all select t.tenant_id,'task:'||t.id,t.revision::text||':'||coalesce(t.due_on::text,''),'task',t.title,
 case when t.status='blocked' then 'Assigned task is blocked' else 'Assigned task is overdue' end,
 jsonb_build_object('kind','task','recordId',t.id),t.program_id,t.updated_at
 from public.task_rows t where t.assigned_to_me and t.status not in ('done','cancelled') and (t.status='blocked' or t.due_on<current_date)
union all select m.tenant_id,'mapping:'||m.id,
 md5(concat_ws(':',m.revision,m.profile_resolution_id,m.selected_control_id,m.baseline_source_system_id,nullif(a.generation,0))),
 'mapping',m.requirement_code||' → '||coalesce(m.control_code,'Control'),'Mapping needs review',
 jsonb_build_object('kind','mapping','recordId',m.id),m.program_id,greatest(m.updated_at,a.changed_at)
 from public.program_sctm_rows m
 cross join lateral public.assurance_allocation_attention_context(m.tenant_id,m.content_id,m.system_id) a
 where m.needs_review
union all select c.tenant_id,'citation:'||c.id,
 md5(concat_ws(':',v.id,v.revision,v.sha256,latest.id,latest.revision)),'evidence',c.evidence_title,
 case when latest.id<>v.id then 'A newer evidence version is available' else 'Cited evidence content changed' end,
 jsonb_build_object('kind','evidence','recordId',v.id),c.program_id,greatest(v.updated_at,latest.updated_at)
 from public.assurance_citations c join public.evidence_versions v on v.tenant_id=c.tenant_id and v.id=c.evidence_version_id
 join lateral(select x.id,x.revision,x.updated_at from public.evidence_versions x where x.tenant_id=v.tenant_id and x.artifact_id=v.artifact_id order by x.version_number desc limit 1)latest on true
 where v.sha256 is distinct from c.evidence_sha256 or latest.id<>v.id;
