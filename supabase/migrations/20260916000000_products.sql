-- Products: the systems that get assessed. A product's element tree is versioned in product_revisions,
-- its configurations pick which elements are in (ground launch, air launch), and a program creates a
-- variant from one configuration: the system in the program keeps its lineage to the product version,
-- the configuration and each product element, and inherits the assessed control sets of the library
-- components the product pins. Customer-specific elements sit beside them without lineage.
-- See docs/products.md and docs/guides/inheritance-model.md.

-- ---------------------------------------------------------------------------------------------
-- Products, their versions and their configurations.
-- ---------------------------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (length(btrim(code))>0),
  name text not null check (length(btrim(name))>0),
  description text,
  state text not null default 'active' check (state in ('active','retired')),
  unique (tenant_id,id),
  unique (tenant_id,code)
);
select public.apply_tenant_security('products');
select public.attach_record_lifecycle('products',false);
comment on table public.products is 'A system that gets assessed: the stable identity of a product whose element tree is versioned in product_revisions and configured through product_configurations. A program creates a variant from one configuration.';
comment on column public.products.code is 'Stable identifier, unique in the workspace.';
comment on column public.products.state is 'Retired products cannot be used to create new systems; existing programs keep their lineage.';

create table public.product_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_id uuid not null,
  version_number integer not null check (version_number>0),
  state text not null default 'draft' check (state in ('draft','published')),
  published_at timestamptz,
  effective_from date,
  remarks text,
  check ((state='published')=(published_at is not null)),
  unique (tenant_id,id),
  foreign key (tenant_id,product_id) references public.products(tenant_id,id),
  unique (tenant_id,product_id,version_number)
);
select public.apply_tenant_security('product_revisions');
select public.attach_record_lifecycle('product_revisions',true);
create trigger stable_context before update on public.product_revisions for each row execute function public.guard_stable_assurance_context('product_id');
comment on table public.product_revisions is 'One version of a product''s element tree and configuration membership. Published versions are immutable; programs pin the exact version they were created from.';
comment on column public.product_revisions.version_number is 'Sequential version of the product, unique per product.';
comment on column public.product_revisions.state is 'draft while the structure is edited; published freezes elements and memberships.';
comment on column public.product_revisions.effective_from is 'Optional date this version applies from (release date).';
comment on column public.product_revisions.remarks is 'Release notes for this version.';

create function public.guard_product_revision_publish() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if old.state='draft' and new.state='published'
    and not exists(select 1 from public.product_elements e where e.tenant_id=new.tenant_id and e.product_revision_id=new.id) then
    raise exception 'Add at least one element before publishing this product version' using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function public.guard_product_revision_publish() from public,anon,authenticated;
create trigger a_product_revision_publish before update of state on public.product_revisions for each row execute function public.guard_product_revision_publish();

create table public.product_configurations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_id uuid not null,
  code text not null check (length(btrim(code))>0),
  name text not null check (length(btrim(name))>0),
  description text,
  state text not null default 'active' check (state in ('active','retired')),
  unique (tenant_id,id),
  foreign key (tenant_id,product_id) references public.products(tenant_id,id),
  unique (tenant_id,product_id,code)
);
select public.apply_tenant_security('product_configurations');
select public.attach_record_lifecycle('product_configurations',false);
create trigger stable_context before update on public.product_configurations for each row execute function public.guard_stable_assurance_context('product_id');
comment on table public.product_configurations is 'A named configuration of a product (ground launch, air launch), stable across versions. Which elements it includes is recorded per version in product_configuration_elements.';
comment on column public.product_configurations.code is 'Short identifier, unique within the product.';
comment on column public.product_configurations.state is 'Retired configurations cannot be used to create new systems.';

-- ---------------------------------------------------------------------------------------------
-- The element tree of a version and which configurations each element is in.
-- ---------------------------------------------------------------------------------------------
create table public.product_elements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_revision_id uuid not null,
  parent_element_id uuid,
  code text not null check (length(btrim(code))>0),
  name text not null check (length(btrim(name))>0),
  description text,
  element_type text not null check (element_type in ('subsystem','hardware','software','network','service','facility','data','other')),
  defined_component_id uuid,
  position integer not null default 0 check (position>=0),
  unique (tenant_id,id),
  unique (tenant_id,product_revision_id,id),
  unique (tenant_id,product_revision_id,code),
  foreign key (tenant_id,product_revision_id) references public.product_revisions(tenant_id,id),
  foreign key (tenant_id,product_revision_id,parent_element_id) references public.product_elements(tenant_id,product_revision_id,id),
  foreign key (tenant_id,defined_component_id) references public.defined_components(tenant_id,id),
  check (parent_element_id is null or parent_element_id<>id)
);
select public.apply_tenant_security('product_elements');
select public.attach_record_lifecycle('product_elements',false);
select public.attach_parent_immutability('product_elements','product_revisions','product_revision_id');
create trigger stable_context before update on public.product_elements for each row execute function public.guard_stable_assurance_context('product_revision_id');
create index product_elements_revision_idx on public.product_elements(tenant_id,product_revision_id);
create index product_elements_parent_idx on public.product_elements(tenant_id,parent_element_id);
create index product_elements_component_idx on public.product_elements(tenant_id,defined_component_id);
comment on table public.product_elements is 'One node of a product''s element tree in one version: a subsystem or component, optionally pinned to a library component whose assessed control set programs inherit.';
comment on column public.product_elements.parent_element_id is 'Containing element in the same version; NULL for a direct child of the product.';
comment on column public.product_elements.element_type is 'Same vocabulary as nested systems; fixed by the component type when pinned to the library.';
comment on column public.product_elements.defined_component_id is 'Library component (of a published component definition version) this element instantiates; NULL for a purely structural element.';
comment on column public.product_elements.position is 'Sort order among siblings.';

create function public.guard_product_element() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_defined public.defined_components; v_state text; v_depth integer; v_cycle boolean;
begin
  perform 1 from public.product_revisions where tenant_id=new.tenant_id and id=new.product_revision_id for no key update;
  if not found then raise exception 'Product version was not found' using errcode='23503'; end if;
  if new.parent_element_id is not null then
    with recursive ancestors as (
      select e.id,e.parent_element_id,1 as depth from public.product_elements e
        where e.tenant_id=new.tenant_id and e.product_revision_id=new.product_revision_id and e.id=new.parent_element_id
      union all
      select e.id,e.parent_element_id,a.depth+1 from public.product_elements e join ancestors a on e.id=a.parent_element_id
        where e.tenant_id=new.tenant_id and e.product_revision_id=new.product_revision_id and a.depth<64
    ) select coalesce(max(depth),0),coalesce(bool_or(id=new.id),false) into v_depth,v_cycle from ancestors;
    if v_cycle then raise exception 'Product structure cannot contain a cycle' using errcode='23514'; end if;
    if v_depth>=10 then raise exception 'Product structure deeper than ten levels is not supported' using errcode='23514'; end if;
  end if;
  if new.defined_component_id is not null then
    select * into v_defined from public.defined_components where tenant_id=new.tenant_id and id=new.defined_component_id;
    select state into v_state from public.component_definition_revisions where id=v_defined.component_definition_revision_id;
    if v_defined.id is null or v_state is distinct from 'published' then
      raise exception 'Pin product elements to a component of a published library version' using errcode='23514';
    end if;
    if new.element_type<>public.element_type_for_component(v_defined.component_type) then
      raise exception 'Library-pinned product elements take their type from the component definition' using errcode='23514';
    end if;
  end if;
  if tg_op='UPDATE' and new.parent_element_id is distinct from old.parent_element_id and new.parent_element_id is not null
    and exists(select 1 from public.product_configuration_elements m
      where m.tenant_id=new.tenant_id and m.product_revision_id=new.product_revision_id and m.product_element_id=new.id
        and not exists(select 1 from public.product_configuration_elements p
          where p.tenant_id=m.tenant_id and p.product_revision_id=m.product_revision_id and p.product_configuration_id=m.product_configuration_id and p.product_element_id=new.parent_element_id)) then
    raise exception 'Move this element only under a parent that is in each of its configurations' using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function public.guard_product_element() from public,anon,authenticated;
create trigger a_product_element before insert or update on public.product_elements for each row execute function public.guard_product_element();

create table public.product_configuration_elements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_revision_id uuid not null,
  product_configuration_id uuid not null,
  product_element_id uuid not null,
  unique (tenant_id,id),
  unique (tenant_id,product_revision_id,product_configuration_id,product_element_id),
  foreign key (tenant_id,product_revision_id) references public.product_revisions(tenant_id,id),
  foreign key (tenant_id,product_configuration_id) references public.product_configurations(tenant_id,id),
  foreign key (tenant_id,product_revision_id,product_element_id) references public.product_elements(tenant_id,product_revision_id,id)
);
select public.apply_tenant_security('product_configuration_elements');
select public.attach_record_lifecycle('product_configuration_elements',false);
select public.attach_parent_immutability('product_configuration_elements','product_revisions','product_revision_id');
create trigger stable_context before update on public.product_configuration_elements for each row execute function public.guard_stable_assurance_context('product_revision_id','product_configuration_id','product_element_id');
create index product_configuration_elements_configuration_idx on public.product_configuration_elements(tenant_id,product_revision_id,product_configuration_id);
comment on table public.product_configuration_elements is 'Which elements of a version are in a configuration: explicit membership, the parent always included, frozen when the version is published. An element that is a member of only one configuration is that configuration''s own subsystem.';

create function public.guard_product_configuration_membership() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_product uuid; v_configuration_product uuid;
begin
  select product_id into v_product from public.product_revisions where tenant_id=new.tenant_id and id=new.product_revision_id;
  select product_id into v_configuration_product from public.product_configurations where tenant_id=new.tenant_id and id=new.product_configuration_id;
  if v_product is null or v_configuration_product is distinct from v_product then
    raise exception 'Choose a configuration of this product' using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function public.guard_product_configuration_membership() from public,anon,authenticated;
create trigger a_product_configuration_membership before insert on public.product_configuration_elements for each row execute function public.guard_product_configuration_membership();

-- Parent-before-child is checked when the transaction commits, so one statement can add or remove a subtree.
create function public.guard_product_configuration_membership_tree() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_parent uuid;
begin
  if tg_op='INSERT' then
    if not exists(select 1 from public.product_configuration_elements m where m.id=new.id) then return null; end if;
    select e.parent_element_id into v_parent from public.product_elements e where e.tenant_id=new.tenant_id and e.id=new.product_element_id;
    if v_parent is not null and not exists(select 1 from public.product_configuration_elements p
        where p.tenant_id=new.tenant_id and p.product_revision_id=new.product_revision_id and p.product_configuration_id=new.product_configuration_id and p.product_element_id=v_parent) then
      raise exception 'Add the parent element to this configuration first' using errcode='23514';
    end if;
    return null;
  end if;
  if exists(select 1 from public.product_configuration_elements c join public.product_elements e on e.id=c.product_element_id
      where c.tenant_id=old.tenant_id and c.product_revision_id=old.product_revision_id and c.product_configuration_id=old.product_configuration_id and e.parent_element_id=old.product_element_id)
    and not exists(select 1 from public.product_configuration_elements m
      where m.tenant_id=old.tenant_id and m.product_revision_id=old.product_revision_id and m.product_configuration_id=old.product_configuration_id and m.product_element_id=old.product_element_id) then
    raise exception 'Remove the children of this element from the configuration first' using errcode='23514';
  end if;
  return null;
end; $$;
revoke all on function public.guard_product_configuration_membership_tree() from public,anon,authenticated;
create constraint trigger z_product_configuration_membership_tree after insert or delete on public.product_configuration_elements
  deferrable initially deferred for each row execute function public.guard_product_configuration_membership_tree();

-- ---------------------------------------------------------------------------------------------
-- Lineage on the program's systems: a variant remembers its product version and configuration,
-- each inherited element its product element. Written only by Add from products.
-- ---------------------------------------------------------------------------------------------
alter table public.systems
  add column product_revision_id uuid,
  add column product_configuration_id uuid,
  add column product_element_id uuid,
  add constraint systems_product_revision foreign key (tenant_id,product_revision_id) references public.product_revisions(tenant_id,id),
  add constraint systems_product_configuration foreign key (tenant_id,product_configuration_id) references public.product_configurations(tenant_id,id),
  add constraint systems_product_element foreign key (tenant_id,product_revision_id,product_element_id) references public.product_elements(tenant_id,product_revision_id,id),
  add constraint systems_product_configuration_scope check (product_configuration_id is null or (product_revision_id is not null and is_authorization_boundary)),
  add constraint systems_product_element_scope check (product_element_id is null or (product_revision_id is not null and not is_authorization_boundary)),
  add constraint systems_product_revision_scope check (product_revision_id is null or product_configuration_id is not null or product_element_id is not null);
create index systems_product_revision_idx on public.systems(tenant_id,product_revision_id) where product_revision_id is not null;
create index systems_product_element_idx on public.systems(tenant_id,product_element_id) where product_element_id is not null;
comment on column public.systems.product_revision_id is 'The published product version this variant (boundary) or inherited element was created from; written only by Add from products.';
comment on column public.systems.product_configuration_id is 'The configuration a variant was created from; NULL on elements.';
comment on column public.systems.product_element_id is 'The product element this element instantiates; NULL on boundaries and on customer-specific additions.';

create function public.guard_product_instantiation() returns trigger
language plpgsql security invoker set search_path='' as $$
declare after jsonb:=to_jsonb(new); before jsonb:=case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
begin
  if current_user in ('authenticated','anon') and (
    tg_op='INSERT' and (new.product_revision_id is not null or new.product_configuration_id is not null or new.product_element_id is not null)
    or tg_op='UPDATE' and (after->>'product_revision_id' is distinct from before->>'product_revision_id'
      or after->>'product_configuration_id' is distinct from before->>'product_configuration_id'
      or after->>'product_element_id' is distinct from before->>'product_element_id')) then
    raise exception 'Use Add from products to create a system from a product' using errcode='23514';
  end if;
  if new.product_configuration_id is not null and not exists(select 1 from public.product_revisions r join public.product_configurations c on c.product_id=r.product_id
      where r.id=new.product_revision_id and c.id=new.product_configuration_id) then
    raise exception 'The configuration must belong to the pinned product version' using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function public.guard_product_instantiation() from public,anon,authenticated;
create trigger a_product_instantiation before insert or update of product_revision_id,product_configuration_id,product_element_id on public.systems
  for each row execute function public.guard_product_instantiation();

-- ---------------------------------------------------------------------------------------------
-- One system from one draft: the boundary, its elements (inherited from a product or not), a draft
-- SSP and the library components applied. Shared by the wizard and Add from products post-create.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_program_system(p_tenant_id uuid,p_program_id uuid,p_system jsonb,p_profile_resolution_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_system_id uuid; v_ssp uuid; v_node_map jsonb:='{}'; v_product_map jsonb:='{}'; v_left integer; v_progress boolean; v_parent uuid; v_element_id uuid; v_type text; v_rationale text;
  v_element jsonb; v_revision public.component_definition_revisions; v_defined public.defined_components; v_element_row public.systems; v_assignment uuid; v_applied jsonb;
  v_product jsonb; v_product_revision public.product_revisions; v_product_row public.products; v_configuration public.product_configurations; v_pe public.product_elements;
  v_pe_id uuid; v_parent_pe uuid; v_element_results jsonb:='[]';
begin
  perform public.wizard_required_text(p_system,'key')::uuid;
  if (p_system->>'confidentiality') is null or (p_system->>'integrity') is null or (p_system->>'availability') is null then raise exception 'Choose confidentiality, integrity, and availability for every system' using errcode='23514'; end if;
  if coalesce(p_system->>'type','') not in ('information_system','industrial_control_system','platform','service') then raise exception 'Choose a system type' using errcode='23514'; end if;
  if jsonb_typeof(p_system->'elements') is distinct from 'array' or jsonb_array_length(p_system->'elements')>300 then raise exception 'Invalid system composition' using errcode='23514'; end if;
  if p_profile_resolution_id is null then raise exception 'Choose a program profile for every system' using errcode='23514'; end if;
  v_rationale:=public.wizard_required_text(p_system,'categorizationRationale');
  -- Lineage: a published version of an active product and one of its active configurations.
  v_product:=p_system->'product';
  if v_product is not null and jsonb_typeof(v_product) not in ('object','null') then raise exception 'Invalid product selection' using errcode='23514'; end if;
  if jsonb_typeof(v_product)='object' then
    select * into v_product_revision from public.product_revisions where tenant_id=p_tenant_id and id=nullif(v_product->>'revisionId','')::uuid;
    if v_product_revision.id is null then raise exception 'Product version was not found' using errcode='23514'; end if;
    if v_product_revision.state<>'published' then raise exception 'Only a published product version can be used to create a system' using errcode='23514'; end if;
    select * into v_product_row from public.products where id=v_product_revision.product_id;
    if v_product_row.state<>'active' then raise exception 'This product is retired' using errcode='23514'; end if;
    select * into v_configuration from public.product_configurations where tenant_id=p_tenant_id and id=nullif(v_product->>'configurationId','')::uuid and product_id=v_product_revision.product_id;
    if v_configuration.id is null then raise exception 'Choose a configuration of the selected product' using errcode='23514'; end if;
    if v_configuration.state<>'active' then raise exception 'This product configuration is retired' using errcode='23514'; end if;
  end if;
  v_system_id:=gen_random_uuid();
  insert into public.systems(id,tenant_id,program_id,code,name,description,system_type,system_owner_party_id,confidentiality_impact,integrity_impact,availability_impact,categorization_rationale,adopted_profile_resolution_id,baseline_rationale,product_revision_id,product_configuration_id)
    values(v_system_id,p_tenant_id,p_program_id,public.wizard_required_text(p_system,'code'),public.wizard_required_text(p_system,'name'),nullif(btrim(p_system->>'description'),''),p_system->>'type',nullif(p_system->>'ownerPartyId','')::uuid,
      p_system->>'confidentiality',p_system->>'integrity',p_system->>'availability',v_rationale,p_profile_resolution_id,'Program profile adopted during program creation.',v_product_revision.id,v_configuration.id);
  if exists(select 1 from jsonb_array_elements(p_system->'elements') n group by n->>'key' having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_system->'elements') n group by lower(btrim(n->>'code')) having count(*)>1) then raise exception 'Element codes and identifiers must be distinct' using errcode='23514'; end if;
  -- Inherited elements: each belongs to the version and the configuration, once.
  for v_element in select value from jsonb_array_elements(p_system->'elements') loop
    v_pe_id:=nullif(v_element->>'productElementId','')::uuid;
    if v_pe_id is null then continue; end if;
    if v_product_revision.id is null then raise exception 'Product elements belong to a system created from a product' using errcode='23514'; end if;
    if not exists(select 1 from public.product_elements where tenant_id=p_tenant_id and product_revision_id=v_product_revision.id and id=v_pe_id) then raise exception 'Product element was not found in this product version' using errcode='23514'; end if;
    if not exists(select 1 from public.product_configuration_elements where tenant_id=p_tenant_id and product_revision_id=v_product_revision.id and product_configuration_id=v_configuration.id and product_element_id=v_pe_id) then
      raise exception 'This product element is not part of the selected configuration' using errcode='23514';
    end if;
    if exists(select 1 from jsonb_each_text(v_product_map) m where m.value=v_pe_id::text) then raise exception 'Each product element can be instantiated once per system' using errcode='23514'; end if;
    v_product_map:=v_product_map||jsonb_build_object(v_element->>'key',v_pe_id);
  end loop;
  v_left:=jsonb_array_length(p_system->'elements');
  while v_left>0 loop
    v_progress:=false;
    for v_element in select value from jsonb_array_elements(p_system->'elements') loop
      perform public.wizard_required_text(v_element,'key')::uuid;
      if v_node_map ? (v_element->>'key') then continue; end if;
      if nullif(v_element->>'parentKey','') is not null and not v_node_map ? (v_element->>'parentKey') then continue; end if;
      v_parent:=coalesce((v_node_map->>(v_element->>'parentKey'))::uuid,v_system_id);
      v_element_id:=gen_random_uuid();
      v_pe_id:=nullif(v_element->>'productElementId','')::uuid;
      if v_pe_id is not null then
        select * into v_pe from public.product_elements where id=v_pe_id;
        v_parent_pe:=nullif(v_product_map->>coalesce(v_element->>'parentKey',''),'')::uuid;
        if v_pe.parent_element_id is distinct from v_parent_pe then raise exception 'Product elements keep their place in the product structure' using errcode='23514'; end if;
        if nullif(v_element->>'type','') is not null and v_element->>'type'<>v_pe.element_type then raise exception 'Product elements take their type from the product' using errcode='23514'; end if;
        if (v_element->'library'->>'definedComponentId') is distinct from v_pe.defined_component_id::text then raise exception 'Elements from a product keep the product''s library pin' using errcode='23514'; end if;
      end if;
      if jsonb_typeof(v_element->'library')='object' then
        select * into v_revision from public.component_definition_revisions where tenant_id=p_tenant_id and id=(v_element->'library'->>'revisionId')::uuid;
        if v_revision.id is null then raise exception 'Library version was not found' using errcode='23514'; end if;
        if v_revision.state<>'published' then raise exception 'Only a published library version can be applied' using errcode='23514'; end if;
        select * into v_defined from public.defined_components where tenant_id=p_tenant_id and id=(v_element->'library'->>'definedComponentId')::uuid and component_definition_revision_id=v_revision.id;
        if v_defined.id is null then raise exception 'Choose a component of the selected library version' using errcode='23514'; end if;
        v_type:=public.element_type_for_component(v_defined.component_type);
        if nullif(v_element->>'type','') is not null and v_element->>'type'<>v_type then raise exception 'Library elements take their type from the component definition' using errcode='23514'; end if;
        perform public.wizard_required_text(v_element->'library','rationale');
      else
        v_type:=case when v_pe_id is not null then v_pe.element_type else v_element->>'type' end;
        if v_type is null or v_type not in ('subsystem','hardware','software','network','service','facility','data','other') then raise exception 'Choose an element type' using errcode='23514'; end if;
      end if;
      insert into public.systems(id,tenant_id,program_id,parent_system_id,is_authorization_boundary,code,name,description,system_type,product_revision_id,product_element_id)
        values(v_element_id,p_tenant_id,p_program_id,v_parent,false,public.wizard_required_text(v_element,'code'),public.wizard_required_text(v_element,'name'),nullif(btrim(v_element->>'description'),''),v_type,
          case when v_pe_id is null then null else v_product_revision.id end,v_pe_id);
      v_node_map:=v_node_map||jsonb_build_object(v_element->>'key',v_element_id); v_left:=v_left-1; v_progress:=true;
    end loop;
    if not v_progress then raise exception 'Choose element parents within the same system without cycles' using errcode='23514'; end if;
  end loop;
  insert into public.ssp_revisions(tenant_id,system_id,profile_resolution_id,version_number,description) values(p_tenant_id,v_system_id,p_profile_resolution_id,1,'Draft SSP initialized from the program profile adopted at creation.') returning id into v_ssp;
  insert into public.implemented_requirements(tenant_id,ssp_revision_id,selected_control_id) select p_tenant_id,v_ssp,id from public.selected_controls where profile_resolution_id=p_profile_resolution_id;
  for v_element in select value from jsonb_array_elements(p_system->'elements') loop
    select * into v_element_row from public.systems where id=(v_node_map->>(v_element->>'key'))::uuid;
    if jsonb_typeof(v_element->'library')='object' then
      select * into v_revision from public.component_definition_revisions where tenant_id=p_tenant_id and id=(v_element->'library'->>'revisionId')::uuid;
      select * into v_defined from public.defined_components where tenant_id=p_tenant_id and id=(v_element->'library'->>'definedComponentId')::uuid;
      insert into public.library_assignments(tenant_id,program_id,system_id,source_revision_id,include_descendants,control_ids,rationale,accepted_by,request_id)
        values(p_tenant_id,p_program_id,v_element_row.id,v_revision.id,false,null,btrim(v_element->'library'->>'rationale'),auth.uid(),p_request_id) returning id into v_assignment;
      v_applied:=public.apply_library_component(p_tenant_id,p_program_id,v_assignment,v_revision,v_defined,v_element_row,v_element_row.code,v_element_row.name,null,'[]'::jsonb,btrim(v_element->'library'->>'rationale'));
      v_element_results:=v_element_results||jsonb_build_object('key',v_element->>'key','systemId',v_element_row.id,'systemComponentId',v_applied->'systemComponentId');
    else
      v_element_results:=v_element_results||jsonb_build_object('key',v_element->>'key','systemId',v_element_row.id,'systemComponentId',null);
    end if;
  end loop;
  return jsonb_build_object('systemId',v_system_id,'elements',v_element_results);
end; $$;
revoke all on function public.create_program_system(uuid,uuid,jsonb,uuid,uuid) from public,anon,authenticated;
comment on function public.create_program_system(uuid,uuid,jsonb,uuid,uuid) is 'Internal: writes one system from a wizard-shaped draft, with or without product lineage. The wizard and add_program_system own locking, receipts and permissions.';

-- The wizard, now looping through the shared helper.
create or replace function public.create_program_wizard(p_tenant_id uuid,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_request uuid; v_hash text; v_receipt public.program_wizard_requests; v_program uuid:=gen_random_uuid(); v_actor uuid; v_code text;
  v_catalog_id uuid; v_catalog public.catalog_revisions; v_catalog_doc public.oscal_document_revisions;
  v_profile jsonb; v_system jsonb; v_role jsonb; v_created jsonb;
  v_profile_map jsonb:='{}'; v_profile_results jsonb:='[]'; v_base uuid; v_resolution uuid; v_index integer:=0;
  v_base_profile public.profile_revisions; v_base_profile_title text; v_base_resolution public.profile_resolutions;
  v_system_ids jsonb:='[]'; v_element_results jsonb:='[]'; v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'You cannot create a program in this workspace' using errcode='42501'; end if;
  if jsonb_typeof(p_draft) is distinct from 'object' or octet_length(p_draft::text)>2000000 then raise exception 'Invalid program wizard request' using errcode='23514'; end if;
  v_request:=(p_draft->>'requestId')::uuid;
  if v_request is null then raise exception 'The program request identifier is missing' using errcode='23514'; end if;
  v_hash:=encode(extensions.digest(p_draft::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/program-wizard/'||v_request::text,0));
  select * into v_receipt from public.program_wizard_requests where tenant_id=p_tenant_id and id=v_request;
  if found then
    if v_receipt.created_by<>auth.uid() or v_receipt.payload_sha256<>v_hash then raise exception 'This creation request was already used with different details. Reload the saved program before starting another request.' using errcode='PT409'; end if;
    return v_receipt.result;
  end if;
  select id into v_actor from public.parties where tenant_id=p_tenant_id and auth_user_id=auth.uid();
  if v_actor is null then raise exception 'Your workspace person record is missing' using errcode='23514'; end if;
  v_code:=public.wizard_required_text(p_draft,'code');
  v_catalog_id:=(p_draft->>'catalogRevisionId')::uuid;
  select * into v_catalog from public.catalog_revisions where id=v_catalog_id and (tenant_id is null or tenant_id=p_tenant_id) and state='published' for share;
  select * into v_catalog_doc from public.oscal_document_revisions where id=v_catalog.document_revision_id and state='published' for share;
  if v_catalog.id is null or v_catalog_doc.id is null then raise exception 'Choose a published catalog revision' using errcode='23514'; end if;
  if jsonb_typeof(p_draft->'profiles') is distinct from 'array' or jsonb_array_length(p_draft->'profiles') not between 1 and 30
    or jsonb_typeof(p_draft->'systems') is distinct from 'array' or jsonb_array_length(p_draft->'systems') not between 1 and 50
    or jsonb_typeof(p_draft->'roles') is distinct from 'array' or jsonb_array_length(p_draft->'roles')>100 then raise exception 'Choose at least one base profile and add at least one system' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_draft->'profiles') p group by p->>'key' having count(*)>1) then raise exception 'Program profile identifiers must be distinct' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_draft->'profiles') p where jsonb_array_length(coalesce(p->'tailoring','[]'::jsonb))=0 and jsonb_array_length(coalesce(p->'parameters','[]'::jsonb))=0 group by p->>'baseResolutionId' having count(*)>1) then
    raise exception 'Choose each base profile once unless you tailor it' using errcode='23514';
  end if;
  if exists(select 1 from jsonb_array_elements(p_draft->'systems') s group by lower(btrim(s->>'code')) having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_draft->'systems') s group by s->>'key' having count(*)>1) then raise exception 'System codes and identifiers must be distinct' using errcode='23514'; end if;
  if nullif(p_draft->>'sponsorPartyId','') is not null and not exists(select 1 from public.parties where id=(p_draft->>'sponsorPartyId')::uuid and tenant_id=p_tenant_id) then raise exception 'Choose a sponsor in this workspace' using errcode='23514'; end if;
  insert into public.programs(id,tenant_id,code,name,description,sponsor_party_id,starts_on,ends_on)
    values(v_program,p_tenant_id,v_code,public.wizard_required_text(p_draft,'name'),nullif(btrim(p_draft->>'description'),''),nullif(p_draft->>'sponsorPartyId','')::uuid,nullif(p_draft->>'startsOn','')::date,nullif(p_draft->>'endsOn','')::date);
  for v_role in select value from jsonb_array_elements(p_draft->'roles') loop
    insert into public.program_role_assignments(tenant_id,program_id,party_id,role) values(p_tenant_id,v_program,(v_role->>'partyId')::uuid,v_role->>'role');
  end loop;
  -- Program profiles: the base as-is, or an overlay layered on it.
  for v_profile in select value from jsonb_array_elements(p_draft->'profiles') loop
    v_index:=v_index+1;
    perform public.wizard_required_text(v_profile,'key')::uuid;
    v_base:=(v_profile->>'baseResolutionId')::uuid;
    if v_base is null then raise exception 'Choose a base profile for every program profile' using errcode='23514'; end if;
    if jsonb_typeof(v_profile->'tailoring') is distinct from 'array' or jsonb_array_length(v_profile->'tailoring')>10000
      or jsonb_typeof(v_profile->'parameters') is distinct from 'array' or jsonb_array_length(v_profile->'parameters')>10000 then raise exception 'Invalid profile tailoring details' using errcode='23514'; end if;
    perform public.resolve_base_controls(p_tenant_id,v_catalog_id,v_base,0);
    if jsonb_array_length(v_profile->'tailoring')=0 and jsonb_array_length(v_profile->'parameters')=0 then
      v_resolution:=v_base;
    else
      select * into v_base_resolution from public.profile_resolutions where id=v_base;
      select * into v_base_profile from public.profile_revisions where id=v_base_resolution.profile_revision_id;
      select p.title into v_base_profile_title from public.profiles p where p.id=v_base_profile.profile_id;
      v_resolution:=public.author_tailored_profile(p_tenant_id,v_catalog_id,v_base,v_profile->'tailoring',v_profile->'parameters',
        v_code||'/profiles/'||v_index,coalesce(v_base_profile_title,v_base_profile.title)||' — '||v_code||' overlay','Program overlay authored during program creation.');
    end if;
    insert into public.program_reference_choices(tenant_id,program_id,catalog_revision_id,profile_resolution_id) values(p_tenant_id,v_program,v_catalog_id,v_resolution);
    v_profile_map:=v_profile_map||jsonb_build_object(v_profile->>'key',v_resolution);
    v_profile_results:=v_profile_results||jsonb_build_object('key',v_profile->>'key','profileResolutionId',v_resolution,'tailored',v_resolution<>v_base);
  end loop;
  -- Systems, their elements, a draft SSP each, the library components, and product lineage.
  for v_system in select value from jsonb_array_elements(p_draft->'systems') loop
    v_resolution:=(v_profile_map->>(v_system->>'profileKey'))::uuid;
    if v_resolution is null then raise exception 'Choose a program profile for every system' using errcode='23514'; end if;
    v_created:=public.create_program_system(p_tenant_id,v_program,v_system,v_resolution,v_request);
    v_system_ids:=v_system_ids||jsonb_build_array(v_created->'systemId');
    v_element_results:=v_element_results||coalesce(v_created->'elements','[]'::jsonb);
  end loop;
  v_result:=jsonb_build_object('programId',v_program,'systemIds',v_system_ids,'profiles',v_profile_results,'elements',v_element_results);
  insert into public.program_wizard_requests(id,tenant_id,program_id,payload_sha256,result,created_by) values(v_request,p_tenant_id,v_program,v_hash,v_result,auth.uid());
  return v_result;
end; $$;
revoke all on function public.create_program_wizard(uuid,jsonb) from public,anon;
grant execute on function public.create_program_wizard(uuid,jsonb) to authenticated;
comment on function public.create_program_wizard(uuid,jsonb) is 'One transaction: the program, its roles, one program profile per chosen base (the base as-is or a published overlay layered on it), systems adopting one each with their elements written into the tree (from a product configuration or by hand), a draft SSP per system, and library components applied as elements. Idempotent per request id.';

-- Add from products on an existing program: one more system, same shape, same receipt family.
create or replace function public.add_program_system(p_tenant_id uuid,p_program_id uuid,p_request_id uuid,p_system jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_hash text; v_receipt public.program_wizard_requests; v_resolution uuid; v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_request_id is null or jsonb_typeof(p_system) is distinct from 'object' or octet_length(p_system::text)>2000000 then raise exception 'Enter the system details' using errcode='23514'; end if;
  perform 1 from public.programs where tenant_id=p_tenant_id and id=p_program_id for no key update;
  if not found then raise exception 'Program was not found in this workspace' using errcode='23514'; end if;
  v_hash:=encode(extensions.digest(jsonb_build_object('programId',p_program_id,'system',p_system)::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/program-system/'||p_request_id::text,0));
  select * into v_receipt from public.program_wizard_requests where tenant_id=p_tenant_id and id=p_request_id;
  if found then
    if v_receipt.created_by<>auth.uid() or v_receipt.program_id<>p_program_id or v_receipt.payload_sha256<>v_hash then raise exception 'This add-system request was already used with different details' using errcode='PT409'; end if;
    return v_receipt.result;
  end if;
  v_resolution:=nullif(p_system->>'profileResolutionId','')::uuid;
  if v_resolution is null or not exists(select 1 from public.program_reference_choices where tenant_id=p_tenant_id and program_id=p_program_id and profile_resolution_id=v_resolution) then
    raise exception 'Choose one of the program''s profiles' using errcode='23514';
  end if;
  v_result:=public.create_program_system(p_tenant_id,p_program_id,p_system,v_resolution,p_request_id);
  insert into public.program_wizard_requests(id,tenant_id,program_id,payload_sha256,result,created_by) values(p_request_id,p_tenant_id,p_program_id,v_hash,v_result,auth.uid());
  return v_result;
end; $$;
revoke all on function public.add_program_system(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.add_program_system(uuid,uuid,uuid,jsonb) to authenticated;
comment on function public.add_program_system(uuid,uuid,uuid,jsonb) is 'Adds one system to an existing program from a wizard-shaped draft (profileResolutionId in place of profileKey), with or without product lineage. Idempotent per request id.';

-- ---------------------------------------------------------------------------------------------
-- New version: copy a version's tree and memberships into the next draft, atomically.
-- ---------------------------------------------------------------------------------------------
create or replace function public.copy_product_revision(p_tenant_id uuid,p_source_revision_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_source public.product_revisions; v_new uuid:=gen_random_uuid(); v_map jsonb:='{}'; v_row record; v_new_id uuid;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  select * into v_source from public.product_revisions where tenant_id=p_tenant_id and id=p_source_revision_id for share;
  if v_source.id is null then raise exception 'Product version was not found' using errcode='23514'; end if;
  perform 1 from public.products where id=v_source.product_id for no key update;
  insert into public.product_revisions(id,tenant_id,product_id,version_number)
    select v_new,p_tenant_id,v_source.product_id,coalesce(max(version_number),0)+1 from public.product_revisions where tenant_id=p_tenant_id and product_id=v_source.product_id;
  for v_row in
    with recursive tree as (
      select e.id,e.parent_element_id,e.code,e.name,e.description,e.element_type,e.defined_component_id,e.position,0 as depth
        from public.product_elements e where e.tenant_id=p_tenant_id and e.product_revision_id=v_source.id and e.parent_element_id is null
      union all
      select e.id,e.parent_element_id,e.code,e.name,e.description,e.element_type,e.defined_component_id,e.position,t.depth+1
        from public.product_elements e join tree t on e.parent_element_id=t.id where e.product_revision_id=v_source.id and t.depth<64
    ) select * from tree order by depth,position,code
  loop
    v_new_id:=gen_random_uuid();
    insert into public.product_elements(id,tenant_id,product_revision_id,parent_element_id,code,name,description,element_type,defined_component_id,position)
      values(v_new_id,p_tenant_id,v_new,(v_map->>(v_row.parent_element_id::text))::uuid,v_row.code,v_row.name,v_row.description,v_row.element_type,v_row.defined_component_id,v_row.position);
    v_map:=v_map||jsonb_build_object(v_row.id::text,v_new_id);
  end loop;
  insert into public.product_configuration_elements(tenant_id,product_revision_id,product_configuration_id,product_element_id)
    select p_tenant_id,v_new,m.product_configuration_id,(v_map->>(m.product_element_id::text))::uuid
    from public.product_configuration_elements m join public.product_configurations c on c.id=m.product_configuration_id
    where m.tenant_id=p_tenant_id and m.product_revision_id=v_source.id and c.state='active';
  return v_new;
end; $$;
revoke all on function public.copy_product_revision(uuid,uuid) from public,anon;
grant execute on function public.copy_product_revision(uuid,uuid) to authenticated;
comment on function public.copy_product_revision(uuid,uuid) is 'Creates the next draft version of a product by copying a version''s elements (parents remapped) and the memberships of its active configurations.';

-- ---------------------------------------------------------------------------------------------
-- OSCAL: a published product version as a component-definition, one component per element and
-- one capability per configuration, built on demand.
-- ---------------------------------------------------------------------------------------------
create or replace function public.product_export_uuid(seed text) returns uuid
language sql immutable set search_path='' as $$
  select (substr(h,1,8)||'-'||substr(h,9,4)||'-5'||substr(h,14,3)||'-'||substr('89ab',(('x'||substr(h,17,1))::bit(4)::int % 4)+1,1)||substr(h,18,3)||'-'||substr(h,21,12))::uuid
  from (select encode(extensions.digest(seed,'sha256'),'hex') as h) s;
$$;
revoke all on function public.product_export_uuid(text) from public,anon,authenticated;

create or replace function public.product_export_prop(p_name text,p_value text) returns jsonb
language sql immutable set search_path='' as $$
  select jsonb_build_object('name',p_name,'ns','urn:program-assurance:product','value',p_value);
$$;
revoke all on function public.product_export_prop(text,text) from public,anon,authenticated;

create or replace function public.product_export_control_implementations(p_element_id uuid,p_element_name text,p_defined public.defined_components,p_definition_label text)
returns jsonb language plpgsql stable set search_path='' as $$
declare v_result jsonb:='[]'; v_catalog record; v_control record; v_requirements jsonb; v_requirement jsonb; v_props jsonb; v_statements jsonb; v_claim public.defined_component_implementations;
begin
  for v_catalog in
    select c.catalog_revision_id,d.source_uuid from public.defined_component_implementations i
      join public.controls c on c.id=i.control_id
      join public.catalog_revisions cr on cr.id=c.catalog_revision_id
      join public.oscal_document_revisions d on d.id=cr.document_revision_id
    where i.defined_component_id=p_defined.id group by c.catalog_revision_id,d.source_uuid order by c.catalog_revision_id
  loop
    v_requirements:='[]';
    for v_control in
      select c.id,c.source_id from public.defined_component_implementations i join public.controls c on c.id=i.control_id
      where i.defined_component_id=p_defined.id and c.catalog_revision_id=v_catalog.catalog_revision_id group by c.id,c.source_id order by c.source_id
    loop
      select * into v_claim from public.defined_component_implementations where defined_component_id=p_defined.id and control_id=v_control.id and control_part_id is null order by id limit 1;
      v_props:='[]';
      if v_claim.id is not null then
        v_props:=v_props||jsonb_build_object('name','implementation-status','value',replace(v_claim.implementation_status,'_','-'))
          ||public.product_export_prop('coverage',v_claim.coverage);
      end if;
      select coalesce(jsonb_agg(jsonb_build_object('statement-id',p.source_id,'uuid',public.product_export_uuid(p_element_id::text||'/'||i.id::text),'description',coalesce(nullif(btrim(i.description),''),p.source_id)) order by p.source_id),'[]'::jsonb)
        into v_statements
        from public.defined_component_implementations i join public.control_parts p on p.id=i.control_part_id
        where i.defined_component_id=p_defined.id and i.control_id=v_control.id and p.source_id is not null;
      v_requirement:=jsonb_build_object('uuid',public.product_export_uuid(p_element_id::text||'/'||v_control.id::text),'control-id',v_control.source_id,
        'description',coalesce(nullif(btrim(v_claim.description),''),'Statement-level claims; see statements'));
      if jsonb_array_length(v_props)>0 then v_requirement:=v_requirement||jsonb_build_object('props',v_props); end if;
      if jsonb_array_length(v_statements)>0 then v_requirement:=v_requirement||jsonb_build_object('statements',v_statements); end if;
      v_requirements:=v_requirements||jsonb_build_array(v_requirement);
    end loop;
    v_result:=v_result||jsonb_build_array(jsonb_build_object(
      'uuid',public.product_export_uuid(p_element_id::text||'/'||v_catalog.catalog_revision_id::text),
      'source','urn:uuid:'||v_catalog.source_uuid::text,
      'description','Controls claimed by '||p_definition_label||' for '||p_element_name,
      'implemented-requirements',v_requirements));
  end loop;
  return v_result;
end; $$;
revoke all on function public.product_export_control_implementations(uuid,text,public.defined_components,text) from public,anon,authenticated;

create or replace function public.product_component_definition(p_tenant_id uuid,p_revision_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_revision public.product_revisions; v_product public.products; v_stamp text; v_metadata jsonb; v_doc jsonb;
  v_components jsonb:='[]'; v_capabilities jsonb:='[]'; v_el record; v_defined public.defined_components; v_cr public.component_definition_revisions; v_cd public.component_definitions;
  v_props jsonb; v_component jsonb; v_impls jsonb; v_cfg public.product_configurations; v_members jsonb; v_capability jsonb; v_type text;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then raise exception 'Workspace read access is required' using errcode='42501'; end if;
  select * into v_revision from public.product_revisions where tenant_id=p_tenant_id and id=p_revision_id;
  if v_revision.id is null then raise exception 'Product version was not found' using errcode='23514'; end if;
  if v_revision.state<>'published' then raise exception 'Only a published product version can be exported' using errcode='23514'; end if;
  select * into v_product from public.products where id=v_revision.product_id;
  v_stamp:=to_char(v_revision.published_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  v_metadata:=jsonb_build_object('title',btrim(v_product.name)||' v'||v_revision.version_number,'published',v_stamp,'last-modified',v_stamp,
    'version',v_revision.version_number::text,'oscal-version','1.2.2',
    'props',jsonb_build_array(public.product_export_prop('product-code',btrim(v_product.code)),public.product_export_prop('product-id',v_product.id::text),public.product_export_prop('product-revision-id',v_revision.id::text)));
  if nullif(btrim(coalesce(v_revision.remarks,'')),'') is not null then v_metadata:=v_metadata||jsonb_build_object('remarks',btrim(v_revision.remarks)); end if;
  for v_el in
    with recursive tree as (
      select e.id,e.parent_element_id,e.code,e.name,e.description,e.element_type,e.defined_component_id,e.position,0 as depth
        from public.product_elements e where e.tenant_id=p_tenant_id and e.product_revision_id=v_revision.id and e.parent_element_id is null
      union all
      select e.id,e.parent_element_id,e.code,e.name,e.description,e.element_type,e.defined_component_id,e.position,t.depth+1
        from public.product_elements e join tree t on e.parent_element_id=t.id where e.product_revision_id=v_revision.id and t.depth<64
    ) select * from tree order by depth,position,code
  loop
    select * into v_defined from public.defined_components where id=v_el.defined_component_id;
    select * into v_cr from public.component_definition_revisions where id=v_defined.component_definition_revision_id;
    select * into v_cd from public.component_definitions where id=v_cr.component_definition_id;
    v_type:=case when v_defined.id is not null then case v_defined.component_type when 'process' then 'process-procedure' else v_defined.component_type end
      else case v_el.element_type when 'network' then 'interconnection' when 'facility' then 'physical' else v_el.element_type end end;
    v_props:=jsonb_build_array(public.product_export_prop('element-code',btrim(v_el.code)),public.product_export_prop('element-type',v_el.element_type),public.product_export_prop('position',v_el.position::text));
    if v_el.parent_element_id is not null then v_props:=v_props||public.product_export_prop('parent-element',v_el.parent_element_id::text); end if;
    if v_defined.id is not null then
      v_props:=v_props||public.product_export_prop('defined-component',v_defined.id::text);
      if v_defined.oscal_uuid is not null then v_props:=v_props||public.product_export_prop('defined-component-oscal-uuid',v_defined.oscal_uuid::text); end if;
      v_props:=v_props||public.product_export_prop('definition-code',btrim(v_cd.code))||public.product_export_prop('definition-version',v_cr.version_number::text);
    end if;
    v_component:=jsonb_build_object('uuid',v_el.id,'type',v_type,'title',btrim(v_el.name),'description',coalesce(nullif(btrim(v_el.description),''),btrim(v_el.name)),'props',v_props);
    if v_defined.id is not null then
      v_component:=v_component||jsonb_build_object('links',jsonb_build_array(jsonb_build_object('href','urn:uuid:'||v_cr.id::text,'rel','library-version')));
      v_impls:=public.product_export_control_implementations(v_el.id,btrim(v_el.name),v_defined,btrim(v_cd.name)||' v'||v_cr.version_number);
      if jsonb_array_length(v_impls)>0 then v_component:=v_component||jsonb_build_object('control-implementations',v_impls); end if;
    end if;
    v_components:=v_components||jsonb_build_array(v_component);
  end loop;
  for v_cfg in select * from public.product_configurations where tenant_id=p_tenant_id and product_id=v_product.id order by code loop
    select coalesce(jsonb_agg(jsonb_build_object('component-uuid',m.product_element_id,'description',btrim(e.name)) order by e.code),'[]'::jsonb) into v_members
      from public.product_configuration_elements m join public.product_elements e on e.id=m.product_element_id
      where m.tenant_id=p_tenant_id and m.product_revision_id=v_revision.id and m.product_configuration_id=v_cfg.id;
    v_capability:=jsonb_build_object('uuid',v_cfg.id,'name',btrim(v_cfg.name),'description',coalesce(nullif(btrim(v_cfg.description),''),btrim(v_cfg.name)),
      'props',jsonb_build_array(public.product_export_prop('configuration-code',btrim(v_cfg.code)),public.product_export_prop('configuration-state',v_cfg.state)));
    if jsonb_array_length(v_members)>0 then v_capability:=v_capability||jsonb_build_object('incorporates-components',v_members); end if;
    v_capabilities:=v_capabilities||jsonb_build_array(v_capability);
  end loop;
  v_doc:=jsonb_build_object('uuid',v_revision.id,'metadata',v_metadata);
  if jsonb_array_length(v_components)>0 then v_doc:=v_doc||jsonb_build_object('components',v_components); end if;
  if jsonb_array_length(v_capabilities)>0 then v_doc:=v_doc||jsonb_build_object('capabilities',v_capabilities); end if;
  return jsonb_build_object('component-definition',v_doc);
end; $$;
revoke all on function public.product_component_definition(uuid,uuid) from public,anon;
grant execute on function public.product_component_definition(uuid,uuid) to authenticated;
comment on function public.product_component_definition(uuid,uuid) is 'A published product version as an OSCAL 1.2.2 component-definition: one component per element (library-pinned elements carry their claimed controls), one capability per configuration incorporating its elements, the tree in props under urn:program-assurance:product.';
