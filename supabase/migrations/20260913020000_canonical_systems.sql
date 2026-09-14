-- One authored system tree. Legacy composition IDs become canonical system IDs;
-- composition_nodes remains a view, never a second editable copy of the tree.
alter table public.systems
  add column parent_system_id uuid,
  add column boundary_system_id uuid,
  add column is_authorization_boundary boolean not null default true,
  alter column lifecycle_status drop not null,
  alter column lifecycle_status drop default,
  alter column authorization_status drop not null,
  alter column authorization_status drop default;
alter table public.systems drop constraint systems_system_type_check;
alter table public.systems add constraint systems_system_type_check check (system_type in (
  'information_system','industrial_control_system','platform','service',
  'subsystem','hardware','software','network','facility','data','other'
));
alter table public.systems drop constraint systems_tenant_id_code_key;

-- This is a structural promotion, not a user edit. Preserve every existing audit
-- field and compare-and-swap counter, including the original boundary rows.
alter table public.systems disable trigger record_lifecycle;
update public.systems set boundary_system_id=id;
insert into public.systems (id,tenant_id,program_id,code,name,description,system_type,
  parent_system_id,boundary_system_id,is_authorization_boundary,lifecycle_status,authorization_status,
  revision,created_at,updated_at,created_by,updated_by)
select n.id,n.tenant_id,s.program_id,n.code,n.name,n.description,n.node_type,
  coalesce(n.parent_id,n.system_id),n.system_id,false,null,null,
  n.revision,n.created_at,n.updated_at,n.created_by,n.updated_by
from public.composition_nodes n join public.systems s on s.tenant_id=n.tenant_id and s.id=n.system_id;
alter table public.systems enable trigger record_lifecycle;
alter table public.systems alter column boundary_system_id set not null;
alter table public.systems
  add constraint systems_parent_context foreign key (tenant_id,program_id,parent_system_id)
    references public.systems(tenant_id,program_id,id),
  add constraint systems_boundary_context foreign key (tenant_id,program_id,boundary_system_id)
    references public.systems(tenant_id,program_id,id),
  add constraint systems_boundary_identity unique (tenant_id,boundary_system_id,id),
  add constraint systems_parent_not_self check (parent_system_id is null or parent_system_id<>id),
  add constraint systems_boundary_identity_check check (
    (is_authorization_boundary and boundary_system_id=id)
    or (not is_authorization_boundary and parent_system_id is not null and boundary_system_id<>id)
  );
-- Preserve boundary-code uniqueness while allowing the previous per-boundary
-- namespace for nested elements. No codes are renamed by this migration.
create unique index systems_boundary_root_code_key on public.systems(tenant_id,code) where is_authorization_boundary;
create unique index systems_nested_code_key on public.systems(tenant_id,boundary_system_id,code) where not is_authorization_boundary;
create index systems_parent_idx on public.systems(tenant_id,parent_system_id);
create index systems_boundary_idx on public.systems(tenant_id,boundary_system_id);

create function public.guard_system_tree() returns trigger
language plpgsql security definer set search_path='' as $$
declare parent_row public.systems;
begin
  perform 1 from public.programs where tenant_id=new.tenant_id and id=new.program_id for no key update;
  if tg_op='UPDATE' and (new.program_id is distinct from old.program_id
    or new.boundary_system_id is distinct from old.boundary_system_id
    or new.is_authorization_boundary is distinct from old.is_authorization_boundary) then
    raise exception 'A system cannot change its program or authorization boundary' using errcode='23514';
  end if;
  if new.parent_system_id is not null then
    select * into parent_row from public.systems where tenant_id=new.tenant_id
      and program_id=new.program_id and id=new.parent_system_id;
    if not found then raise exception 'Choose a parent system in this program' using errcode='23514'; end if;
    if exists (
      with recursive ancestors as (
        select id,parent_system_id from public.systems where tenant_id=new.tenant_id and id=new.parent_system_id
        union
        select s.id,s.parent_system_id from public.systems s join ancestors a on s.id=a.parent_system_id
          where s.tenant_id=new.tenant_id and s.program_id=new.program_id
      ) select 1 from ancestors where id=new.id
    ) then raise exception 'System containment cannot contain a cycle' using errcode='23514'; end if;
  end if;
  if new.is_authorization_boundary then
    if new.boundary_system_id is not null and new.boundary_system_id<>new.id then
      raise exception 'An authorization boundary owns its own system context' using errcode='23514';
    end if;
    new.boundary_system_id:=new.id;
    if tg_op='INSERT' then
      new.lifecycle_status:=coalesce(new.lifecycle_status,'planned');
      new.authorization_status:=coalesce(new.authorization_status,'not_assessed');
    end if;
  else
    if parent_row.id is null then raise exception 'A nested system needs a parent' using errcode='23514'; end if;
    if new.boundary_system_id is not null and new.boundary_system_id<>parent_row.boundary_system_id then
      raise exception 'The parent must belong to the same authorization boundary' using errcode='23514';
    end if;
    new.boundary_system_id:=parent_row.boundary_system_id;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_system_tree() from public,anon,authenticated;
create trigger a_system_tree before insert or update of parent_system_id,boundary_system_id,is_authorization_boundary,program_id
  on public.systems for each row execute function public.guard_system_tree();
comment on table public.systems is 'Canonical program system tree. Authorization boundaries and nested hardware, software, subsystems and services share stable identities.';
comment on column public.systems.parent_system_id is 'Immediate containing system in the same program; containment is distinct from the authorization boundary.';
comment on column public.systems.boundary_system_id is 'Owning authorization boundary. Derived from the parent for nested systems and equal to id for an authorization boundary.';
comment on column public.systems.is_authorization_boundary is 'Whether this system owns an SSP and authorization context. Nested elements normally inherit their parent boundary.';

-- Retarget the six external composition-node foreign keys without changing their
-- stored IDs. The seventh incoming FK was the old table's own parent pointer.
alter table public.component_relationships drop constraint component_relationships_tenant_id_system_id_source_node_id_fkey;
alter table public.component_relationships drop constraint component_relationships_tenant_id_system_id_target_node_id_fkey;
alter table public.component_relationships
  add constraint component_relationships_source_system foreign key (tenant_id,system_id,source_node_id) references public.systems(tenant_id,boundary_system_id,id),
  add constraint component_relationships_target_system foreign key (tenant_id,system_id,target_node_id) references public.systems(tenant_id,boundary_system_id,id);
alter table public.scopes drop constraint scopes_tenant_id_system_id_composition_node_id_fkey;
alter table public.scopes add constraint scopes_system_element foreign key (tenant_id,system_id,composition_node_id)
  references public.systems(tenant_id,boundary_system_id,id);
alter table public.inventory_items drop constraint inventory_items_tenant_id_system_id_composition_node_id_fkey;
alter table public.inventory_items add constraint inventory_items_system_element foreign key (tenant_id,system_id,composition_node_id)
  references public.systems(tenant_id,boundary_system_id,id);
alter table public.assessment_subjects drop constraint assessment_subjects_tenant_id_composition_node_id_fkey;
alter table public.assessment_subjects add constraint assessment_subjects_system_element foreign key (tenant_id,composition_node_id)
  references public.systems(tenant_id,id) on delete restrict;
alter table public.requirement_allocations drop constraint requirement_allocations_tenant_id_composition_node_id_fkey;
alter table public.requirement_allocations add constraint requirement_allocations_legacy_system_element foreign key (tenant_id,composition_node_id)
  references public.systems(tenant_id,id);

-- Recovery copy retains original metadata, but is inaccessible to application
-- roles and has no FK or trigger that could constrain the canonical system tree.
alter table public.composition_nodes rename to composition_nodes_archive_20260913;
do $$ declare item record; begin
  for item in select conname from pg_constraint where conrelid='public.composition_nodes_archive_20260913'::regclass and contype='f' loop
    execute format('alter table public.composition_nodes_archive_20260913 drop constraint %I',item.conname);
  end loop;
  for item in select tgname from pg_trigger where tgrelid='public.composition_nodes_archive_20260913'::regclass and not tgisinternal loop
    execute format('drop trigger %I on public.composition_nodes_archive_20260913',item.tgname);
  end loop;
end $$;
revoke all on public.composition_nodes_archive_20260913 from public,anon,authenticated,service_role;
comment on table public.composition_nodes_archive_20260913 is 'Read-only recovery copy before canonical system promotion; not an application model.';
create function public.reject_composition_archive_write() returns trigger
language plpgsql set search_path='' as $$ begin
  raise exception 'The original composition archive is read only' using errcode='55000';
end; $$;
revoke all on function public.reject_composition_archive_write() from public,anon,authenticated;
create trigger immutable_archive before insert or update or delete on public.composition_nodes_archive_20260913
  for each row execute function public.reject_composition_archive_write();

create view public.composition_nodes with (security_invoker=true) as
select id,tenant_id,boundary_system_id as system_id,
  nullif(parent_system_id,boundary_system_id) as parent_id,code,name,system_type as node_type,description,
  revision,created_at,updated_at,created_by,updated_by
from public.systems where not is_authorization_boundary;
comment on view public.composition_nodes is 'Compatibility projection of nested canonical systems. Reads and writes use systems; no separate authored composition records exist.';
alter view public.composition_nodes alter column id set default gen_random_uuid();
alter view public.composition_nodes alter column revision set default 1;
grant select,insert,update,delete on public.composition_nodes to authenticated;
revoke all on public.composition_nodes from public,anon;

create function public.write_composition_system() returns trigger
language plpgsql security invoker set search_path='' as $$
declare boundary_row public.systems; saved public.systems;
begin
  if tg_op='DELETE' then
    delete from public.systems where tenant_id=old.tenant_id and id=old.id and revision=old.revision returning * into saved;
    if not found then raise exception 'Record revision conflict; reload before saving' using errcode='PT409'; end if;
    return old;
  end if;
  if new.node_type not in ('subsystem','hardware','software','network','service','facility','data','other') then
    raise exception 'Choose a supported system element type' using errcode='23514';
  end if;
  if tg_op='UPDATE' and (new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id or new.system_id is distinct from old.system_id) then
    raise exception 'Record identity, tenant and authorization boundary cannot change' using errcode='23514';
  end if;
  select * into boundary_row from public.systems where tenant_id=new.tenant_id and id=new.system_id and is_authorization_boundary;
  if not found then raise exception 'Choose an authorization boundary in this workspace' using errcode='23514'; end if;
  if new.parent_id is not null and not exists (select 1 from public.composition_nodes where tenant_id=new.tenant_id and system_id=new.system_id and id=new.parent_id) then
    raise exception 'Choose a parent element in this authorization boundary' using errcode='23514';
  end if;
  if tg_op='INSERT' then
    insert into public.systems(id,tenant_id,program_id,parent_system_id,boundary_system_id,is_authorization_boundary,
      code,name,system_type,description,lifecycle_status,authorization_status)
    values(coalesce(new.id,gen_random_uuid()),new.tenant_id,boundary_row.program_id,coalesce(new.parent_id,new.system_id),new.system_id,false,
      new.code,new.name,new.node_type,new.description,null,null) returning * into saved;
  else
    update public.systems set parent_system_id=coalesce(new.parent_id,new.system_id),code=new.code,name=new.name,
      system_type=new.node_type,description=new.description,revision=new.revision
      where tenant_id=old.tenant_id and id=old.id and revision=old.revision returning * into saved;
    if not found then raise exception 'Record revision conflict; reload before saving' using errcode='PT409'; end if;
  end if;
  select * into new from public.composition_nodes where id=saved.id;
  return new;
end;
$$;
revoke all on function public.write_composition_system() from public,anon,authenticated;
create trigger canonical_system_write instead of insert or update or delete on public.composition_nodes
  for each row execute function public.write_composition_system();

-- The old system context fields remain authorization-boundary pins. Adding a
-- nested canonical identity must not make an arbitrary component a valid SSP owner.
create function public.guard_boundary_context() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid := (to_jsonb(new)->>tg_argv[0])::uuid;
begin
  if target is not null and not exists (select 1 from public.systems where tenant_id=new.tenant_id and id=target and is_authorization_boundary) then
    raise exception 'This record must belong to an authorization boundary' using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function public.guard_boundary_context() from public,anon,authenticated;
do $$ declare table_name text; begin
  foreach table_name in array array['scopes','system_components','component_relationships','inventory_items','inventory_components','configuration_baselines','ssp_revisions','authorization_packages'] loop
    execute format('create trigger boundary_context before insert or update of system_id on public.%I for each row execute function public.guard_boundary_context(''system_id'')',table_name);
  end loop;
end $$;
create trigger boundary_context before insert or update of providing_system_id on public.provider_capabilities
  for each row execute function public.guard_boundary_context('providing_system_id');

-- Preserve distinct component records and their OSCAL/library metadata. Only an
-- explicit, unique inventory relationship can supply an automatic element bridge.
alter table public.system_components add column system_element_id uuid;
alter table public.system_components add constraint system_components_element_context
  foreign key (tenant_id,system_id,system_element_id) references public.systems(tenant_id,boundary_system_id,id);
alter table public.system_components disable trigger record_lifecycle;
with explicit_links as (
  select ic.tenant_id,ic.system_component_id,min(i.composition_node_id::text)::uuid as element_id
  from public.inventory_components ic join public.inventory_items i on i.tenant_id=ic.tenant_id and i.id=ic.inventory_item_id
  group by ic.tenant_id,ic.system_component_id having count(distinct i.composition_node_id)=1
)
update public.system_components c set system_element_id=links.element_id from explicit_links links
where c.tenant_id=links.tenant_id and c.id=links.system_component_id;
alter table public.system_components enable trigger record_lifecycle;
comment on column public.system_components.system_element_id is 'Canonical contributing system element, established from an unambiguous inventory relationship or explicit authoring. Unresolved or multi-element components remain unbound.';
create view public.system_component_element_links with (security_invoker=true) as
select c.id,c.tenant_id,c.system_id,
  coalesce(c.system_element_id,case when links.element_count=1 then links.element_id end) as system_element_id,
  coalesce(links.element_count,0) as inventory_element_count,
  case when c.system_element_id is not null then 'explicit'
    when links.element_count=1 then 'inventory' when links.element_count>1 then 'ambiguous' else 'unbound' end as link_source
from public.system_components c left join lateral (
  select count(distinct i.composition_node_id) as element_count,min(i.composition_node_id::text)::uuid as element_id
  from public.inventory_components ic join public.inventory_items i on i.tenant_id=ic.tenant_id and i.id=ic.inventory_item_id
  where ic.tenant_id=c.tenant_id and ic.system_component_id=c.id
) links on true;
grant select on public.system_component_element_links to authenticated;
revoke all on public.system_component_element_links from public,anon;
comment on view public.system_component_element_links is 'Read-only canonical component bridge, including unique inventory relationships from later legacy imports. Ambiguous relationships are exposed without selecting an arbitrary element.';

alter table public.requirement_allocations add column system_id uuid;
alter table public.requirement_allocations add constraint requirement_allocations_system foreign key (tenant_id,system_id) references public.systems(tenant_id,id);
alter table public.requirement_allocations disable trigger record_lifecycle;
alter table public.requirement_allocations disable trigger requirement_history;
update public.requirement_allocations set system_id=composition_node_id where composition_node_id is not null;
alter table public.requirement_allocations enable trigger requirement_history;
alter table public.requirement_allocations enable trigger record_lifecycle;
alter table public.requirement_allocations drop constraint requirement_allocations_check;
alter table public.requirement_allocations drop constraint requirement_allocation_target_unique;
alter table public.requirement_allocations
  add constraint requirement_allocations_target check (num_nonnulls(system_id,provider_capability_id,security_process_id)=1),
  add constraint requirement_allocation_target_unique unique nulls not distinct (tenant_id,requirement_revision_id,system_id,provider_capability_id,security_process_id);

create function public.normalize_requirement_system_allocation() returns trigger
language plpgsql security definer set search_path='' as $$
declare target public.systems; program_uuid uuid;
begin
  -- Accept one-sided edits from either API. Conflicting dual targets are rejected.
  if tg_op='UPDATE' then
    if new.system_id is distinct from old.system_id and new.composition_node_id is not distinct from old.composition_node_id then
      new.composition_node_id:=null;
    elsif new.composition_node_id is distinct from old.composition_node_id and new.system_id is not distinct from old.system_id then
      new.system_id:=new.composition_node_id;
    end if;
  end if;
  if new.system_id is null then new.system_id:=new.composition_node_id; end if;
  if new.system_id is not null then
    select * into target from public.systems where tenant_id=new.tenant_id and id=new.system_id;
    if not found then raise exception 'Choose a system in this workspace' using errcode='23514'; end if;
    if new.composition_node_id is not null and (new.composition_node_id<>new.system_id or target.is_authorization_boundary) then
      raise exception 'The legacy element and canonical system allocation must identify the same nested system' using errcode='23514';
    end if;
    select er.program_id into program_uuid from public.requirement_revisions rr join public.engineering_requirements er
      on er.tenant_id=rr.tenant_id and er.id=rr.engineering_requirement_id where rr.tenant_id=new.tenant_id and rr.id=new.requirement_revision_id;
    if program_uuid is distinct from target.program_id then
      raise exception 'The allocated system must belong to the requirement program' using errcode='23514';
    end if;
    new.composition_node_id:=case when target.is_authorization_boundary then null else target.id end;
  else
    new.composition_node_id:=null;
  end if;
  return new;
end; $$;
revoke all on function public.normalize_requirement_system_allocation() from public,anon,authenticated;
create trigger a_requirement_system_target before insert or update on public.requirement_allocations
  for each row execute function public.normalize_requirement_system_allocation();
comment on column public.requirement_allocations.system_id is 'Canonical allocated system, at any depth including the authorization boundary. Exactly one system, provider capability or process target is recorded.';
comment on column public.requirement_allocations.composition_node_id is 'Legacy alias of system_id for non-boundary elements. Automatically normalized; use system_id for new allocation flows.';

-- The inspector still recognizes the writable compatibility view. Required
-- fields, choices and relations are the view's actual forwarding contract;
-- other models continue to obtain their metadata from database constraints.
create or replace function public.app_schema()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select coalesce(jsonb_agg(item order by item->>'name'),'[]'::jsonb) into result from (
    select jsonb_build_object(
      'name',c.relname,'description',pg_catalog.obj_description(c.oid,'pg_class'),
      'can_insert',pg_catalog.has_table_privilege('authenticated',c.oid,'INSERT'),
      'can_update',pg_catalog.has_table_privilege('authenticated',c.oid,'UPDATE'),
      'can_delete',pg_catalog.has_table_privilege('authenticated',c.oid,'DELETE'),
      'columns',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
          'required',case when c.relname='composition_nodes' then a.attname in ('id','tenant_id','system_id','code','name','node_type','revision','created_at','updated_at') else a.attnotnull end,
          'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),
          'description',pg_catalog.col_description(c.oid,a.attnum),
          'choices',case when c.relname='composition_nodes' and a.attname='node_type'
            then '["subsystem","hardware","software","network","service","facility","data","other"]'::jsonb
            else coalesce(
              (select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_catalog.pg_enum e where e.enumtypid=a.atttypid),
              (select jsonb_agg(distinct m[1]) from pg_catalog.pg_constraint ck
                cross join lateral pg_catalog.regexp_matches(pg_catalog.pg_get_constraintdef(ck.oid),'''([^'']+)''','g') m
                where ck.conrelid=c.oid and ck.contype='c' and ck.conkey=array[a.attnum]::smallint[]
                  and pg_catalog.pg_get_constraintdef(ck.oid) like '%= ANY%'),'[]'::jsonb) end
        ) order by a.attnum),'[]'::jsonb)
        from pg_catalog.pg_attribute a left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
        where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
      ),
      'relations',case when c.relname='composition_nodes' then '[
        {"columns":["tenant_id","system_id"],"target_table":"systems","target_schema":"public","target_columns":["tenant_id","id"]},
        {"columns":["tenant_id","system_id","parent_id"],"target_table":"composition_nodes","target_schema":"public","target_columns":["tenant_id","system_id","id"]}
      ]'::jsonb else (
        select coalesce(jsonb_agg(jsonb_build_object(
          'columns',(select jsonb_agg(a.attname order by k.ordinality) from unnest(fk.conkey) with ordinality k(attnum,ordinality) join pg_catalog.pg_attribute a on a.attrelid=c.oid and a.attnum=k.attnum),
          'target_table',target.relname,'target_schema',target_ns.nspname,
          'target_columns',(select jsonb_agg(a.attname order by k.ordinality) from unnest(fk.confkey) with ordinality k(attnum,ordinality) join pg_catalog.pg_attribute a on a.attrelid=target.oid and a.attnum=k.attnum)
        )),'[]'::jsonb) from pg_catalog.pg_constraint fk
        join pg_catalog.pg_class target on target.oid=fk.confrelid join pg_catalog.pg_namespace target_ns on target_ns.oid=target.relnamespace
        where fk.conrelid=c.oid and fk.contype='f'
      ) end
    ) as item
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and ((c.relkind='r' and c.relrowsecurity)
      or (c.relkind='v' and c.relname in ('composition_nodes','system_component_element_links')))
      and c.relname not in ('workspace_snapshots','spatial_ref_sys','tenants','tenant_memberships')
      and pg_catalog.has_table_privilege('authenticated',c.oid,'SELECT')
      and exists(select 1 from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attname='id' and not a.attisdropped)
  ) tables;
  return result;
end; $$;
revoke all on function public.app_schema() from public,anon;
grant execute on function public.app_schema() to authenticated;
