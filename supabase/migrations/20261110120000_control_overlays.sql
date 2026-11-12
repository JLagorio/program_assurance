-- Control overlays: named, reusable sets of control decisions a program stacks on a baseline.
-- An overlay is authored once in the workspace (add these controls, remove those, each with a
-- reason) and is not tied to one baseline. Applying it to a baseline authors a real layered profile
-- through author_tailored_profile, so the stack stays an OSCAL import chain: reference baseline,
-- one layer per overlay in order, then the program's own tailoring. profile_overlay_applications
-- names the overlay each layer came from and what it found already decided.
-- See docs/control-baseline.md.

-- ---------------------------------------------------------------------------------------------
-- A stack of overlays is deeper than three layers: the limit becomes eight everywhere it is held.
-- The two functions are rewritten from their own stored definitions so nothing else in them moves.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_old text; v_new text;
begin
  v_old:=pg_get_functiondef('public.resolve_base_controls(uuid,uuid,uuid,integer)'::regprocedure);
  v_new:=replace(replace(v_old,'p_depth>3','p_depth>8'),'deeper than three levels','deeper than eight levels');
  if v_new=v_old or position('p_depth>8' in v_new)=0 then raise exception 'resolve_base_controls no longer holds the three-layer limit'; end if;
  execute v_new;
  v_old:=pg_get_functiondef('public.author_tailored_profile(uuid,uuid,uuid,jsonb,jsonb,text,text,text)'::regprocedure);
  v_new:=replace(replace(v_old,'cardinality(v_chain)>3','cardinality(v_chain)>8'),'deeper than three levels','deeper than eight levels');
  if v_new=v_old or position('cardinality(v_chain)>8' in v_new)=0 then raise exception 'author_tailored_profile no longer holds the three-layer limit'; end if;
  execute v_new;
end $$;

create or replace view public.profile_resolution_catalogs with (security_invoker=true) as
with recursive chain as (
  select r.id,r.tenant_id,r.profile_revision_id,r.id as cursor_id,r.base_profile_resolution_id as next_id,0 as depth,
    (select i.catalog_revision_id from public.profile_imports i where i.profile_revision_id=r.profile_revision_id and i.catalog_revision_id is not null
       and not exists(select 1 from public.profile_imports j where j.profile_revision_id=r.profile_revision_id and j.id<>i.id) limit 1) as catalog_revision_id
  from public.profile_resolutions r
  union all
  select c.id,c.tenant_id,c.profile_revision_id,b.id,b.base_profile_resolution_id,c.depth+1,
    (select i.catalog_revision_id from public.profile_imports i where i.profile_revision_id=b.profile_revision_id and i.catalog_revision_id is not null
       and not exists(select 1 from public.profile_imports j where j.profile_revision_id=b.profile_revision_id and j.id<>i.id) limit 1)
  from chain c join public.profile_resolutions b on b.id=c.next_id where c.catalog_revision_id is null and c.depth<8
)
select c.id,c.tenant_id,c.id as profile_resolution_id,c.profile_revision_id,c.catalog_revision_id,
  r.base_profile_resolution_id,c.cursor_id as root_profile_resolution_id,c.depth,c.depth>0 as layered
from chain c join public.profile_resolutions r on r.id=c.id where c.catalog_revision_id is not null;

-- ---------------------------------------------------------------------------------------------
-- The overlay and its decisions. Written only through the functions below.
-- ---------------------------------------------------------------------------------------------
create table public.control_overlays (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  catalog_revision_id uuid not null references public.catalog_revisions(id),
  code text not null check (length(btrim(code)) between 1 and 100),
  title text not null check (length(btrim(title)) between 1 and 300),
  description text check (description is null or length(description) between 1 and 10000),
  state text not null default 'draft' check (state in ('draft','published')),
  unique (tenant_id,id),
  unique (tenant_id,code)
);
select public.apply_tenant_security('control_overlays');
select public.attach_record_lifecycle('control_overlays',true);
select public.attach_reference_tenant_guard('control_overlays','catalog_revision_id','catalog_revisions');
revoke insert,update,delete on public.control_overlays from authenticated;
comment on table public.control_overlays is 'A named, reusable set of control decisions (add, remove) a program stacks on a baseline. Published overlays are immutable.';
comment on column public.control_overlays.catalog_revision_id is 'The catalog edition whose controls the overlay decides on.';
comment on column public.control_overlays.state is 'draft while its decisions are edited; published freezes them and lets programs apply it.';

create table public.control_overlay_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  overlay_id uuid not null,
  control_id uuid not null references public.controls(id),
  action text not null check (action in ('include','exclude')),
  rationale text not null check (length(btrim(rationale)) between 1 and 10000),
  unique (tenant_id,id),
  unique (overlay_id,control_id),
  foreign key (tenant_id,overlay_id) references public.control_overlays(tenant_id,id) on delete cascade
);
select public.apply_tenant_security('control_overlay_decisions');
select public.attach_record_lifecycle('control_overlay_decisions',false);
select public.attach_parent_immutability('control_overlay_decisions','control_overlays','overlay_id');
revoke insert,update,delete on public.control_overlay_decisions from authenticated;
comment on table public.control_overlay_decisions is 'One decision of an overlay: include adds the control to a baseline that lacks it, exclude removes it from one that selects it.';

create table public.profile_overlay_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  profile_resolution_id uuid not null unique references public.profile_resolutions(id),
  overlay_id uuid not null,
  reaffirmed_control_ids uuid[] not null default '{}',
  not_applicable_control_ids uuid[] not null default '{}',
  unique (tenant_id,id),
  foreign key (tenant_id,overlay_id) references public.control_overlays(tenant_id,id)
);
select public.apply_tenant_security('profile_overlay_applications');
select public.attach_record_lifecycle('profile_overlay_applications',false);
revoke insert,update,delete on public.profile_overlay_applications from authenticated;
comment on table public.profile_overlay_applications is 'The overlay a layered profile resolution came from, and the decisions that changed nothing where it was applied.';
comment on column public.profile_overlay_applications.reaffirmed_control_ids is 'Controls the overlay adds that the baseline beneath already selected.';
comment on column public.profile_overlay_applications.not_applicable_control_ids is 'Controls the overlay removes that the baseline beneath did not select.';

-- The register's derived columns.
create view public.control_overlay_rows with (security_invoker=true) as
select o.id,o.tenant_id,o.catalog_revision_id,o.code,o.title,o.description,o.state,o.revision,o.created_at,o.updated_at,
  (select count(*)::integer from public.control_overlay_decisions d where d.overlay_id=o.id and d.action='include') as include_count,
  (select count(*)::integer from public.control_overlay_decisions d where d.overlay_id=o.id and d.action='exclude') as exclude_count,
  (select count(*)::integer from public.profile_overlay_applications a where a.overlay_id=o.id) as application_count
from public.control_overlays o;
grant select on public.control_overlay_rows to authenticated;
revoke all on public.control_overlay_rows from public,anon;
comment on view public.control_overlay_rows is 'Each overlay with the controls it adds and removes counted, and how many baselines apply it.';

-- How many of a program''s requirements map each control, at each requirement''s latest revision.
create view public.program_control_requirement_counts with (security_invoker=true) as
select e.tenant_id,e.program_id,l.control_id,count(distinct e.id)::integer as requirement_count,
  md5(e.program_id::text||'/'||l.control_id::text)::uuid as id
from public.requirement_control_links l
join public.requirement_revisions r on r.tenant_id=l.tenant_id and r.id=l.requirement_revision_id
join public.engineering_requirements e on e.tenant_id=r.tenant_id and e.id=r.engineering_requirement_id
where r.version_number=(select max(x.version_number) from public.requirement_revisions x where x.tenant_id=r.tenant_id and x.engineering_requirement_id=r.engineering_requirement_id)
group by e.tenant_id,e.program_id,l.control_id;
grant select on public.program_control_requirement_counts to authenticated;
revoke all on public.program_control_requirement_counts from public,anon;
comment on view public.program_control_requirement_counts is 'Per program and catalog control: the requirements whose latest revision maps the control.';

-- ---------------------------------------------------------------------------------------------
-- Authoring. The id is chosen once by the caller, so a retry of a save that landed changes nothing.
-- ---------------------------------------------------------------------------------------------
create function public.save_control_overlay(p_tenant_id uuid,p_id uuid,p_expected_revision bigint,p_overlay jsonb)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_current public.control_overlays; v_answer public.control_overlays; v_code text; v_title text; v_description text; v_catalog uuid;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_id is null or jsonb_typeof(p_overlay) is distinct from 'object' then raise exception 'Enter the overlay details' using errcode='23514'; end if;
  v_code:=public.wizard_required_text(p_overlay,'code'); v_title:=public.wizard_required_text(p_overlay,'title');
  v_description:=nullif(btrim(p_overlay->>'description'),''); v_catalog:=nullif(p_overlay->>'catalogRevisionId','')::uuid;
  if length(v_code)>100 or length(v_title)>300 then raise exception 'The overlay code or name is too long' using errcode='23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into v_current from public.control_overlays where id=p_id for update;
  if found then
    if v_current.tenant_id<>p_tenant_id then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
    if v_current.code=v_code and v_current.title=v_title and v_current.description is not distinct from v_description and v_current.catalog_revision_id=v_catalog then return v_current; end if;
    if p_expected_revision is null then raise exception 'This overlay was already saved with different details. Reload it before saving.' using errcode='PT409'; end if;
    if v_current.state='published' then raise exception 'A published overlay cannot change. Create a new overlay instead.' using errcode='23514'; end if;
    if v_current.revision<>p_expected_revision then raise exception 'This overlay changed. Reload it before saving.' using errcode='PT409'; end if;
    if v_current.catalog_revision_id<>v_catalog then raise exception 'An overlay keeps the catalog edition it was created on' using errcode='23514'; end if;
    if exists(select 1 from public.control_overlays where tenant_id=p_tenant_id and code=v_code and id<>p_id) then raise exception 'Another overlay already uses this code' using errcode='23505'; end if;
    update public.control_overlays set code=v_code,title=v_title,description=v_description,revision=revision+1 where id=p_id returning * into v_answer;
  else
    if p_expected_revision is not null then raise exception 'This overlay was removed. Create it again.' using errcode='PT409'; end if;
    if not exists(select 1 from public.catalog_revisions where id=v_catalog and (tenant_id is null or tenant_id=p_tenant_id) and state='published') then raise exception 'Choose a published catalog edition' using errcode='23514'; end if;
    if exists(select 1 from public.control_overlays where tenant_id=p_tenant_id and code=v_code) then raise exception 'Another overlay already uses this code' using errcode='23505'; end if;
    insert into public.control_overlays(id,tenant_id,catalog_revision_id,code,title,description) values(p_id,p_tenant_id,v_catalog,v_code,v_title,v_description) returning * into v_answer;
  end if;
  return v_answer;
end; $$;
comment on function public.save_control_overlay(uuid,uuid,bigint,jsonb) is 'Create a draft overlay (expected revision NULL) or edit its code, name and description at the revision the reader saw. A repeat of a save that landed returns the saved overlay.';

create function public.set_control_overlay_decisions(p_tenant_id uuid,p_overlay_id uuid,p_expected_revision bigint,p_decisions jsonb,p_removed jsonb)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_overlay public.control_overlays; v_decision jsonb; v_control public.controls; v_seen uuid[]:='{}'; v_applied boolean;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if jsonb_typeof(p_decisions) is distinct from 'array' or jsonb_typeof(p_removed) is distinct from 'array'
    or jsonb_array_length(p_decisions)+jsonb_array_length(p_removed) not between 1 and 5000 then raise exception 'Choose the controls this overlay decides on' using errcode='23514'; end if;
  select * into v_overlay from public.control_overlays where tenant_id=p_tenant_id and id=p_overlay_id for update;
  if v_overlay.id is null then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
  -- A repeat of a save that landed: every decision already holds its values and every removal is gone.
  select not exists(select 1 from jsonb_array_elements(p_decisions) item where not exists(
      select 1 from public.control_overlay_decisions d where d.overlay_id=p_overlay_id and d.control_id=(item.value->>'controlId')::uuid
        and d.action=item.value->>'action' and d.rationale=btrim(item.value->>'rationale')))
    and not exists(select 1 from public.control_overlay_decisions d where d.overlay_id=p_overlay_id and d.control_id in (select value::uuid from jsonb_array_elements_text(p_removed)))
    into v_applied;
  if v_applied then return v_overlay; end if;
  if v_overlay.state='published' then raise exception 'A published overlay cannot change. Create a new overlay instead.' using errcode='23514'; end if;
  if v_overlay.revision is distinct from p_expected_revision then raise exception 'This overlay changed. Reload it before saving.' using errcode='PT409'; end if;
  for v_decision in select value from jsonb_array_elements(p_decisions) loop
    select * into v_control from public.controls where id=(v_decision->>'controlId')::uuid and catalog_revision_id=v_overlay.catalog_revision_id;
    if v_control.id is null then raise exception 'Choose controls from the overlay''s catalog edition' using errcode='23514'; end if;
    if v_control.id=any(v_seen) then raise exception 'Record one decision per control' using errcode='23514'; end if;
    v_seen:=array_append(v_seen,v_control.id);
    if v_decision->>'action' not in ('include','exclude') then raise exception 'Choose whether the overlay adds or removes %',v_control.code using errcode='23514'; end if;
    if v_decision->>'action'='include' and v_control.status<>'active' then raise exception '% is withdrawn and cannot be added',v_control.code using errcode='23514'; end if;
    perform public.wizard_required_text(v_decision,'rationale');
    insert into public.control_overlay_decisions(tenant_id,overlay_id,control_id,action,rationale)
      values(p_tenant_id,p_overlay_id,v_control.id,v_decision->>'action',btrim(v_decision->>'rationale'))
      on conflict (overlay_id,control_id) do update set action=excluded.action,rationale=excluded.rationale,revision=public.control_overlay_decisions.revision+1;
  end loop;
  delete from public.control_overlay_decisions where overlay_id=p_overlay_id and control_id in (select value::uuid from jsonb_array_elements_text(p_removed));
  update public.control_overlays set revision=revision+1 where id=p_overlay_id returning * into v_overlay;
  return v_overlay;
end; $$;
comment on function public.set_control_overlay_decisions(uuid,uuid,bigint,jsonb,jsonb) is 'Record or replace a draft overlay''s decisions for the named controls and remove the decisions for others, in one transaction at the revision the reader saw.';

create function public.publish_control_overlay(p_tenant_id uuid,p_overlay_id uuid,p_expected_revision bigint)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_overlay public.control_overlays;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  select * into v_overlay from public.control_overlays where tenant_id=p_tenant_id and id=p_overlay_id for update;
  if v_overlay.id is null then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
  if v_overlay.state='published' then return v_overlay; end if;
  if v_overlay.revision is distinct from p_expected_revision then raise exception 'This overlay changed. Reload it before publishing.' using errcode='PT409'; end if;
  if not exists(select 1 from public.control_overlay_decisions where overlay_id=p_overlay_id) then raise exception 'Record at least one control decision before publishing' using errcode='23514'; end if;
  update public.control_overlays set state='published',revision=revision+1 where id=p_overlay_id returning * into v_overlay;
  return v_overlay;
end; $$;
comment on function public.publish_control_overlay(uuid,uuid,bigint) is 'Freeze a draft overlay so programs can apply it. Publishing twice returns the published overlay.';

revoke all on function public.save_control_overlay(uuid,uuid,bigint,jsonb),public.set_control_overlay_decisions(uuid,uuid,bigint,jsonb,jsonb),public.publish_control_overlay(uuid,uuid,bigint) from public,anon;
grant execute on function public.save_control_overlay(uuid,uuid,bigint,jsonb),public.set_control_overlay_decisions(uuid,uuid,bigint,jsonb,jsonb),public.publish_control_overlay(uuid,uuid,bigint) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Apply one overlay to a baseline: the decisions that change it become a layered profile; an add
-- the baseline already selects is a reaffirmation and a removal it does not select is not applicable.
-- ---------------------------------------------------------------------------------------------
create function public.apply_control_overlay(p_tenant_id uuid,p_catalog_id uuid,p_base_resolution_id uuid,p_overlay_id uuid,p_code text,p_title text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_overlay public.control_overlays; v_base_ids uuid[]; v_decisions jsonb; v_reaffirmed uuid[]; v_skipped uuid[]; v_resolution uuid;
begin
  select * into v_overlay from public.control_overlays where tenant_id=p_tenant_id and id=p_overlay_id and state='published' for share;
  if v_overlay.id is null then raise exception 'Choose a published overlay in this workspace' using errcode='23514'; end if;
  if v_overlay.catalog_revision_id<>p_catalog_id then raise exception '% decides on a different catalog edition',v_overlay.title using errcode='23514'; end if;
  v_base_ids:=public.resolve_base_controls(p_tenant_id,p_catalog_id,p_base_resolution_id,0);
  select coalesce(jsonb_agg(jsonb_build_object('controlId',d.control_id,'action',d.action,'rationale',d.rationale) order by public.wizard_control_order(c.source_id),d.control_id),'[]'::jsonb)
    into v_decisions from public.control_overlay_decisions d join public.controls c on c.id=d.control_id
    where d.overlay_id=p_overlay_id and (d.action='include')<>(d.control_id=any(v_base_ids));
  select coalesce(array_agg(d.control_id order by d.control_id) filter (where d.action='include' and d.control_id=any(v_base_ids)),'{}'),
         coalesce(array_agg(d.control_id order by d.control_id) filter (where d.action='exclude' and not d.control_id=any(v_base_ids)),'{}')
    into v_reaffirmed,v_skipped from public.control_overlay_decisions d where d.overlay_id=p_overlay_id;
  if jsonb_array_length(v_decisions)=0 then raise exception '% changes nothing on this baseline. Remove it from the stack.',v_overlay.title using errcode='23514'; end if;
  v_resolution:=public.author_tailored_profile(p_tenant_id,p_catalog_id,p_base_resolution_id,v_decisions,'[]'::jsonb,p_code,p_title,'Overlay '||v_overlay.code||' ('||v_overlay.title||') applied to its base.');
  insert into public.profile_overlay_applications(tenant_id,profile_resolution_id,overlay_id,reaffirmed_control_ids,not_applicable_control_ids)
    values(p_tenant_id,v_resolution,p_overlay_id,v_reaffirmed,v_skipped);
  return v_resolution;
end; $$;
revoke all on function public.apply_control_overlay(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
comment on function public.apply_control_overlay(uuid,uuid,uuid,uuid,text,text) is 'Internal: author the layered profile one published overlay makes of a base resolution, and record which overlay it was and which of its decisions were already true.';

-- ---------------------------------------------------------------------------------------------
-- The wizard: each program profile is a base, then its overlays in order, then its own tailoring.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_program_wizard(p_tenant_id uuid,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_request uuid; v_hash text; v_receipt public.program_wizard_requests; v_program uuid:=gen_random_uuid(); v_actor uuid; v_code text;
  v_catalog_id uuid; v_catalog public.catalog_revisions; v_catalog_doc public.oscal_document_revisions;
  v_profile jsonb; v_system jsonb; v_role jsonb; v_created jsonb;
  v_profile_map jsonb:='{}'; v_profile_results jsonb:='[]'; v_base uuid; v_resolution uuid; v_index integer:=0;
  v_base_profile public.profile_revisions; v_base_profile_title text; v_base_resolution public.profile_resolutions;
  v_overlays jsonb; v_overlay_id uuid; v_overlay_title text; v_layer integer;
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
  if exists(select 1 from jsonb_array_elements(p_draft->'profiles') p where jsonb_array_length(coalesce(p->'tailoring','[]'::jsonb))=0 and jsonb_array_length(coalesce(p->'parameters','[]'::jsonb))=0
      group by p->>'baseResolutionId',coalesce(p->'overlayIds','[]'::jsonb)::text having count(*)>1) then
    raise exception 'Choose each base profile once unless you stack overlays on it or tailor it' using errcode='23514';
  end if;
  if exists(select 1 from jsonb_array_elements(p_draft->'systems') s group by lower(btrim(s->>'code')) having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_draft->'systems') s group by s->>'key' having count(*)>1) then raise exception 'System codes and identifiers must be distinct' using errcode='23514'; end if;
  if nullif(p_draft->>'sponsorPartyId','') is not null and not exists(select 1 from public.parties where id=(p_draft->>'sponsorPartyId')::uuid and tenant_id=p_tenant_id) then raise exception 'Choose a sponsor in this workspace' using errcode='23514'; end if;
  insert into public.programs(id,tenant_id,code,name,description,sponsor_party_id,starts_on,ends_on)
    values(v_program,p_tenant_id,v_code,public.wizard_required_text(p_draft,'name'),nullif(btrim(p_draft->>'description'),''),nullif(p_draft->>'sponsorPartyId','')::uuid,nullif(p_draft->>'startsOn','')::date,nullif(p_draft->>'endsOn','')::date);
  for v_role in select value from jsonb_array_elements(p_draft->'roles') loop
    insert into public.program_role_assignments(tenant_id,program_id,party_id,role) values(p_tenant_id,v_program,(v_role->>'partyId')::uuid,v_role->>'role');
  end loop;
  -- Program profiles: the base, each overlay as a layer on what is beneath it, then the program's tailoring.
  for v_profile in select value from jsonb_array_elements(p_draft->'profiles') loop
    v_index:=v_index+1;
    perform public.wizard_required_text(v_profile,'key')::uuid;
    v_base:=(v_profile->>'baseResolutionId')::uuid;
    if v_base is null then raise exception 'Choose a base profile for every program profile' using errcode='23514'; end if;
    if jsonb_typeof(v_profile->'tailoring') is distinct from 'array' or jsonb_array_length(v_profile->'tailoring')>10000
      or jsonb_typeof(v_profile->'parameters') is distinct from 'array' or jsonb_array_length(v_profile->'parameters')>10000 then raise exception 'Invalid profile tailoring details' using errcode='23514'; end if;
    v_overlays:=coalesce(v_profile->'overlayIds','[]'::jsonb);
    if jsonb_typeof(v_overlays)<>'array' or jsonb_array_length(v_overlays)>6
      or exists(select 1 from jsonb_array_elements(v_overlays) o where jsonb_typeof(o.value)<>'string')
      or exists(select 1 from jsonb_array_elements_text(v_overlays) o group by o.value having count(*)>1) then
      raise exception 'Stack at most six overlays on a base profile, each once' using errcode='23514';
    end if;
    perform public.resolve_base_controls(p_tenant_id,v_catalog_id,v_base,0);
    select * into v_base_resolution from public.profile_resolutions where id=v_base;
    select * into v_base_profile from public.profile_revisions where id=v_base_resolution.profile_revision_id;
    select p.title into v_base_profile_title from public.profiles p where p.id=v_base_profile.profile_id;
    v_resolution:=v_base; v_layer:=0;
    for v_overlay_id in select o.value::uuid from jsonb_array_elements_text(v_overlays) with ordinality o(value,position) order by o.position loop
      v_layer:=v_layer+1;
      select title into v_overlay_title from public.control_overlays where tenant_id=p_tenant_id and id=v_overlay_id;
      v_resolution:=public.apply_control_overlay(p_tenant_id,v_catalog_id,v_resolution,v_overlay_id,
        v_code||'/profiles/'||v_index||'/overlays/'||v_layer,coalesce(v_overlay_title,'Overlay')||' — '||v_code);
    end loop;
    if jsonb_array_length(v_profile->'tailoring')>0 or jsonb_array_length(v_profile->'parameters')>0 then
      v_resolution:=public.author_tailored_profile(p_tenant_id,v_catalog_id,v_resolution,v_profile->'tailoring',v_profile->'parameters',
        v_code||'/profiles/'||v_index,coalesce(v_base_profile_title,v_base_profile.title)||' — '||v_code||' tailoring','Program tailoring authored during program creation.');
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
comment on function public.create_program_wizard(uuid,jsonb) is 'One transaction: the program, its roles, one program profile per chosen base (the base as-is, or the base with its overlays applied in order and the program''s own tailoring layered last), systems adopting one each with their elements written into the tree (from a product configuration or by hand), a draft SSP per system, and library components applied as elements. Idempotent per request id.';
