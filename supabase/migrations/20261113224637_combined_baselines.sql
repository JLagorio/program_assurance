-- Two reference baselines in one stack. A program profile's control baseline may start from two
-- reference baselines combined (High and Privacy): their union, then the overlays, then the
-- program's tailoring. The first stays the root of the profile chain, the reference profile on the
-- catalog; the second is a layer right above it, authored by author_tailored_profile like every
-- other layer, that adds the controls the second selects and the first does not, each with the
-- second's name as its rationale. So the stack stays an import chain the existing resolver checks,
-- the layer's selection is the union, and every read of a program's baseline (program_control_status,
-- program_resiliency_choice, program_control_parameters, the profile_resolution_catalogs view)
-- reads the union without a change. profile_baseline_combinations names the second baseline behind
-- that layer, so the stack reads it as a baseline, not as a tailoring.
--
--   * Both are published reference baselines on the program's catalog edition, two different ones.
--   * The second must add a control the first does not select; a second that sets parameter values
--     is refused, since a combining layer carries selections only (no reference baseline the
--     workspace holds sets one).
--   * set_program_baseline_overlays keeps the combined root: the layer that combines the second
--     baseline is part of the root it re-applies overlays on.
-- See docs/control-baseline.md.

create table public.profile_baseline_combinations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  profile_resolution_id uuid not null unique references public.profile_resolutions(id),
  combined_resolution_id uuid not null references public.profile_resolutions(id),
  unique (tenant_id,id)
);
select public.apply_tenant_security('profile_baseline_combinations');
select public.attach_record_lifecycle('profile_baseline_combinations',false);
select public.attach_reference_tenant_guard('profile_baseline_combinations','combined_resolution_id','profile_resolutions');
revoke insert,update,delete on public.profile_baseline_combinations from authenticated;
comment on table public.profile_baseline_combinations is 'A layer that combines a second reference baseline (combined_resolution_id) with the reference baseline beneath it: it adds the controls the second selects and the first does not, so the stack starts from their union.';

-- ---------------------------------------------------------------------------------------------
-- Author the layer that combines a second reference baseline with a first: the union of the two.
-- ---------------------------------------------------------------------------------------------
create function public.combine_reference_baselines(p_tenant_id uuid,p_catalog_id uuid,p_first_resolution_id uuid,p_second_resolution_id uuid,p_code text,p_title text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_first public.profile_resolutions; v_second public.profile_resolutions; v_first_ids uuid[]; v_second_ids uuid[];
  v_first_title text; v_second_title text; v_decisions jsonb; v_resolution uuid;
begin
  select * into v_first from public.profile_resolutions where id=p_first_resolution_id;
  select * into v_second from public.profile_resolutions where id=p_second_resolution_id;
  if v_second.id is null or v_second.base_profile_resolution_id is not null or v_first.base_profile_resolution_id is not null then
    raise exception 'Combine two reference baselines: each imports the catalog directly' using errcode='23514';
  end if;
  if v_second.id=v_first.id then raise exception 'Combine two different reference baselines' using errcode='23514'; end if;
  -- Each resolves on the program's catalog edition, by the same check every base goes through.
  v_first_ids:=public.resolve_base_controls(p_tenant_id,p_catalog_id,p_first_resolution_id,0);
  v_second_ids:=public.resolve_base_controls(p_tenant_id,p_catalog_id,p_second_resolution_id,0);
  select coalesce(f.title,v.title) into v_first_title from public.profile_revisions v left join public.profiles f on f.id=v.profile_id where v.id=v_first.profile_revision_id;
  select coalesce(f.title,v.title) into v_second_title from public.profile_revisions v left join public.profiles f on f.id=v.profile_id where v.id=v_second.profile_revision_id;
  if exists(select 1 from public.profile_parameter_settings s where s.profile_revision_id=v_second.profile_revision_id) then
    raise exception '% sets parameter values, so it can only start a stack, not be combined with another baseline',v_second_title using errcode='23514';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('controlId',c.id,'action','include','rationale','Selected by '||v_second_title||'.')
           order by public.wizard_control_order(c.source_id),c.id),'[]'::jsonb)
    into v_decisions from public.controls c where c.id=any(v_second_ids) and not c.id=any(v_first_ids);
  if jsonb_array_length(v_decisions)=0 then
    raise exception '% selects nothing % does not. Start the stack from % alone.',v_second_title,v_first_title,v_first_title using errcode='23514';
  end if;
  v_resolution:=public.author_tailored_profile(p_tenant_id,p_catalog_id,p_first_resolution_id,v_decisions,'[]'::jsonb,p_code,p_title,
    'The union of '||v_first_title||' and '||v_second_title||': the controls '||v_second_title||' selects that '||v_first_title||' does not.');
  insert into public.profile_baseline_combinations(tenant_id,profile_resolution_id,combined_resolution_id) values(p_tenant_id,v_resolution,p_second_resolution_id);
  return v_resolution;
end; $$;
revoke all on function public.combine_reference_baselines(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
comment on function public.combine_reference_baselines(uuid,uuid,uuid,uuid,text,text) is 'Internal: author the layer that combines a second reference baseline with the first beneath it (the controls the second selects that the first does not, each with the second''s name as its rationale) and record it in profile_baseline_combinations. Both are published reference baselines on the catalog, two different ones; a second that adds nothing, or that sets parameter values, is refused.';

-- ---------------------------------------------------------------------------------------------
-- The wizard: each program profile is a base, combined with a second baseline where it names one,
-- then its overlays in order, then its own tailoring.
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
  v_combined uuid; v_combined_title text;
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
      group by p->>'baseResolutionId',coalesce(p->>'combinedResolutionId',''),coalesce(p->'overlayIds','[]'::jsonb)::text having count(*)>1) then
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
  -- Program profiles: the base, combined with a second baseline where one is named, each overlay
  -- as a layer on what is beneath it, then the program's tailoring.
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
    v_combined:=nullif(v_profile->>'combinedResolutionId','')::uuid;
    perform public.resolve_base_controls(p_tenant_id,v_catalog_id,v_base,0);
    select * into v_base_resolution from public.profile_resolutions where id=v_base;
    select * into v_base_profile from public.profile_revisions where id=v_base_resolution.profile_revision_id;
    select p.title into v_base_profile_title from public.profiles p where p.id=v_base_profile.profile_id;
    v_resolution:=v_base; v_layer:=0;
    if v_combined is not null then
      select coalesce(f.title,v.title) into v_combined_title from public.profile_resolutions r join public.profile_revisions v on v.id=r.profile_revision_id
        left join public.profiles f on f.id=v.profile_id where r.id=v_combined;
      v_resolution:=public.combine_reference_baselines(p_tenant_id,v_catalog_id,v_base,v_combined,
        v_code||'/profiles/'||v_index||'/baselines/2',coalesce(v_combined_title,'Baseline')||' — '||v_code);
    end if;
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
comment on function public.create_program_wizard(uuid,jsonb) is 'One transaction: the program, its roles, one program profile per chosen base (the base as-is, or the base combined with a second reference baseline where combinedResolutionId names one, with its overlays applied in order and the program''s own tailoring layered last), systems adopting one each with their elements written into the tree (from a product configuration or by hand), a draft SSP per system, and library components applied as elements. Idempotent per request id.';

-- ---------------------------------------------------------------------------------------------
-- Changing a program's overlays keeps a combined root: the layer that combines a second baseline
-- with the reference baseline is part of the root the overlays are applied on again. The function
-- is rewritten from its own stored definition, so nothing else in it moves.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_old text; v_new text;
begin
  v_old:=pg_get_functiondef('public.set_program_baseline_overlays(uuid,uuid,bigint,uuid,jsonb)'::regprocedure);
  v_new:=replace(v_old,
    'v_root:=v_hops[cardinality(v_hops)];',
    'v_root:=v_hops[cardinality(v_hops)];
  -- A combined root: the layer right above the reference baseline that combines a second baseline
  -- with it is part of the root, which the overlays are applied on again.
  if cardinality(v_hops)>1 and exists(select 1 from public.profile_baseline_combinations b where b.profile_resolution_id=v_hops[cardinality(v_hops)-1]) then
    v_root:=v_hops[cardinality(v_hops)-1];
  end if;');
  v_new:=replace(v_new,'for v_position in 1..cardinality(v_hops)-1 loop','for v_position in 1..array_position(v_hops,v_root)-1 loop');
  if v_new=v_old or position('profile_baseline_combinations' in v_new)=0 or position('array_position(v_hops,v_root)-1' in v_new)=0 then
    raise exception 'set_program_baseline_overlays no longer walks its stack as this migration expects';
  end if;
  execute v_new;
end $$;
comment on function public.set_program_baseline_overlays(uuid,uuid,bigint,uuid,jsonb) is 'Change the overlays of one program profile''s control baseline (program_reference_choices row p_choice_id, at the revision the reader saw), in the order they apply, bottom up, at most six. The root (the reference baseline, with the layer that combines a second baseline with it where there is one) and the layers the new order shares with the old one from the bottom are kept; each overlay after them is applied to what is beneath it; the program''s tailoring is authored again last, with the decisions and parameter values that still change something; the choice moves to the new top, and so do the program''s systems that adopted the old top. SSP revisions keep the resolution they were written against. The same overlays in the same order write nothing. Idempotent per request id.';
