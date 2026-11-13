-- Changing a program's control baseline after creation, and deleting a draft overlay.
-- A program profile's control baseline is a stack: the reference baseline at the root of its
-- profile chain, one layer per overlay in the order they apply, and the program's own tailoring
-- last (docs/control-baseline.md). set_program_baseline_overlays changes the overlays of one
-- program profile: it keeps the layers the new order shares with the old one from the bottom,
-- applies each overlay after them through apply_control_overlay, authors the program's tailoring
-- again on top, and moves the program's choice and the systems that adopt it to the new top.
--
-- What depends on the old top:
--   * A system of the program whose explicit adoption is the old top adopts the new one (one
--     revision step each). A system that adopts anything else (its own tailored baseline layered
--     on the old top, another program profile, a reference baseline) keeps it; an element that
--     inherits follows the system that contains it.
--   * SSP revisions never change. The schema pins each one to the resolution it implements
--     (stable_context on ssp_revisions.profile_resolution_id and on
--     implemented_requirements.selected_control_id), so a published SSP keeps its exact baseline
--     and so does a draft; a system's next SSP revision takes the new one. The answer names the
--     SSP revisions left on the old top, and the SSP assembly says when a system's baseline
--     differs from its SSP's.
--   * The old layers stay as the published profiles they are, so every SSP pinned to one still
--     reads it.
--
-- The tailoring is the program's own: its decisions and parameter values are carried onto the
-- new stack. A decision the new stack already makes true (an add of a control it selects, a
-- removal of one it leaves out) and a parameter value of a control it no longer selects are left
-- out of the layer, and the answer names them; a tailoring left with nothing to change is not
-- authored, and the program adopts the top overlay layer.
--
-- delete_control_overlay removes a draft overlay that no program's stack applies.

-- ---------------------------------------------------------------------------------------------
-- Command receipts: the same request sent again answers what it answered the first time.
-- ---------------------------------------------------------------------------------------------
create table public.program_baseline_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  choice_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null check (jsonb_typeof(result)='object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id,id),
  foreign key (tenant_id,choice_id) references public.program_reference_choices(tenant_id,id)
);
alter table public.program_baseline_requests enable row level security;
revoke all on public.program_baseline_requests from public,anon,authenticated;
grant select on public.program_baseline_requests to authenticated;
create policy program_baseline_request_read on public.program_baseline_requests for select to authenticated using (public.can_read_tenant(tenant_id));
create index program_baseline_requests_tenant_idx on public.program_baseline_requests(tenant_id);
comment on table public.program_baseline_requests is 'Private command receipts for set_program_baseline_overlays: an identical retry returns the original answer; a changed request with the same id conflicts.';

-- ---------------------------------------------------------------------------------------------
-- Change the overlays of one program profile's stack.
-- ---------------------------------------------------------------------------------------------
create function public.set_program_baseline_overlays(p_tenant_id uuid,p_choice_id uuid,p_expected_revision bigint,p_request_id uuid,p_overlay_ids jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_requested uuid[]; v_hash text; v_receipt public.program_baseline_requests; v_choice public.program_reference_choices;
  v_program_id uuid; v_program_code text; v_overlay public.control_overlays; v_overlay_title text; v_id uuid;
  v_hops uuid[]:='{}'; v_cursor uuid; v_root uuid; v_tailoring uuid; v_layer_overlay uuid;
  v_current uuid[]:='{}'; v_current_layers uuid[]:='{}'; v_shared integer:=0; v_position integer;
  v_resolution uuid; v_top uuid; v_previous uuid;
  v_tailoring_revision uuid; v_tailoring_title text; v_base_ids uuid[]; v_selected uuid[];
  v_decisions jsonb:='[]'; v_parameters jsonb:='[]'; v_already jsonb:='[]'; v_not_in jsonb:='[]'; v_dropped jsonb:='[]';
  v_tailored boolean; v_before integer; v_after integer; v_added integer; v_removed integer;
  v_moved jsonb; v_ssps jsonb; v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_choice_id is null or p_request_id is null then raise exception 'Choose the control baseline whose overlays change' using errcode='23514'; end if;
  if jsonb_typeof(p_overlay_ids) is distinct from 'array' or jsonb_array_length(p_overlay_ids)>6
    or exists(select 1 from jsonb_array_elements(p_overlay_ids) o where jsonb_typeof(o.value)<>'string'
      or (o.value#>>'{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or exists(select 1 from jsonb_array_elements_text(p_overlay_ids) o group by lower(o.value) having count(*)>1) then
    raise exception 'Stack at most six overlays on a baseline, each once' using errcode='23514';
  end if;
  select coalesce(array_agg(o.value::uuid order by o.position),'{}') into v_requested
    from jsonb_array_elements_text(p_overlay_ids) with ordinality o(value,position);
  v_hash:=encode(extensions.digest(jsonb_build_object('choiceId',p_choice_id,'expectedRevision',p_expected_revision,'overlayIds',to_jsonb(v_requested))::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||'/program-baseline/'||p_request_id::text,0));
  select * into v_receipt from public.program_baseline_requests where id=p_request_id;
  if found then
    if v_receipt.tenant_id<>p_tenant_id or v_receipt.choice_id<>p_choice_id or v_receipt.payload_sha256<>v_hash or v_receipt.created_by<>auth.uid() then
      raise exception 'This request was already used for a different change. Reload the control baseline before changing it again.' using errcode='PT409';
    end if;
    return v_receipt.result;
  end if;

  -- The program first, then its choice, as the system baseline command locks them.
  select c.program_id into v_program_id from public.program_reference_choices c where c.tenant_id=p_tenant_id and c.id=p_choice_id;
  if v_program_id is null then raise exception 'This control baseline was not found in this workspace' using errcode='23514'; end if;
  select p.code into v_program_code from public.programs p where p.tenant_id=p_tenant_id and p.id=v_program_id for no key update;
  select * into v_choice from public.program_reference_choices where tenant_id=p_tenant_id and id=p_choice_id for update;

  -- The stack as it stands: walk the chain from the top to its root, the reference baseline.
  v_cursor:=v_choice.profile_resolution_id;
  while v_cursor is not null loop
    v_hops:=array_append(v_hops,v_cursor);
    if cardinality(v_hops)>9 then raise exception 'This control baseline is layered deeper than a stack can be' using errcode='23514'; end if;
    select r.base_profile_resolution_id into v_cursor from public.profile_resolutions r where r.id=v_cursor;
  end loop;
  v_root:=v_hops[cardinality(v_hops)];
  -- Above the root: overlay layers, and at most one layer no overlay accounts for, the program's
  -- tailoring, which is last. Any other shape is not a stack this command can keep in order.
  for v_position in 1..cardinality(v_hops)-1 loop
    select a.overlay_id into v_layer_overlay from public.profile_overlay_applications a where a.profile_resolution_id=v_hops[v_position];
    if not found then
      if v_position<>1 then
        raise exception 'This control baseline has a tailoring layer beneath an overlay, so its overlays cannot be changed here' using errcode='23514';
      end if;
      v_tailoring:=v_hops[v_position];
    else
      v_current:=array_prepend(v_layer_overlay,v_current);
      v_current_layers:=array_prepend(v_hops[v_position],v_current_layers);
    end if;
  end loop;

  select count(*)::integer into v_before from public.selected_controls where profile_resolution_id=v_choice.profile_resolution_id;
  -- The stack already holds these overlays in this order: nothing is written.
  if v_requested=v_current then
    v_result:=jsonb_build_object('choiceId',v_choice.id,'programId',v_program_id,'changed',false,
      'profileResolutionId',v_choice.profile_resolution_id,'previousProfileResolutionId',v_choice.profile_resolution_id,
      'revision',v_choice.revision,'overlayIds',to_jsonb(v_current),
      'controls',jsonb_build_object('before',v_before,'after',v_before,'added',0,'removed',0),
      'tailoring',null,'systems','[]'::jsonb,'ssps','[]'::jsonb);
    insert into public.program_baseline_requests(id,tenant_id,choice_id,payload_sha256,result,created_by)
      values(p_request_id,p_tenant_id,p_choice_id,v_hash,v_result,auth.uid());
    return v_result;
  end if;
  if v_choice.revision is distinct from p_expected_revision then
    raise exception 'This control baseline changed in another session. Reload it, then change its overlays again.' using errcode='PT409';
  end if;

  -- Each overlay asked for: published, in this workspace, on the program profile's catalog edition.
  foreach v_id in array v_requested loop
    select * into v_overlay from public.control_overlays where tenant_id=p_tenant_id and id=v_id for share;
    if v_overlay.id is null then raise exception 'Choose published overlays from this workspace' using errcode='23514'; end if;
    if v_overlay.state<>'published' then raise exception '% is a draft. Publish it before a program stacks it.',v_overlay.title using errcode='23514'; end if;
    if v_overlay.catalog_revision_id<>v_choice.catalog_revision_id then raise exception '% decides on a different catalog edition',v_overlay.title using errcode='23514'; end if;
  end loop;

  -- The layers the new order shares with the old one, from the bottom, stay; each overlay after
  -- them is applied to what is beneath it.
  while v_shared<cardinality(v_requested) and v_shared<cardinality(v_current) and v_requested[v_shared+1]=v_current[v_shared+1] loop
    v_shared:=v_shared+1;
  end loop;
  v_resolution:=case when v_shared=0 then v_root else v_current_layers[v_shared] end;
  if v_shared<cardinality(v_requested) then
    for v_position in v_shared+1..cardinality(v_requested) loop
      select o.title into v_overlay_title from public.control_overlays o where o.id=v_requested[v_position];
      v_resolution:=public.apply_control_overlay(p_tenant_id,v_choice.catalog_revision_id,v_resolution,v_requested[v_position],
        v_program_code||'/baselines/'||p_request_id::text||'/overlays/'||v_position,v_overlay_title||' — '||v_program_code);
    end loop;
  end if;
  v_top:=v_resolution;

  -- The program's tailoring, carried onto the new stack: the decisions that still change it, and
  -- the parameter values of the controls it still selects.
  if v_tailoring is not null then
    select r.profile_revision_id into v_tailoring_revision from public.profile_resolutions r where r.id=v_tailoring;
    select p.title into v_tailoring_title from public.profile_revisions v join public.profiles p on p.id=v.profile_id where v.id=v_tailoring_revision;
    v_base_ids:=public.resolve_base_controls(p_tenant_id,v_choice.catalog_revision_id,v_top,0);
    with rules as (
      select r.kind,r.rationale,c.id as control_id,c.code,c.source_id
      from public.profile_rules r
      cross join lateral jsonb_array_elements_text(case when jsonb_typeof(r.definition->'with-ids')='array' then r.definition->'with-ids' else '[]'::jsonb end) s(source_id)
      join public.controls c on c.catalog_revision_id=v_choice.catalog_revision_id and c.source_id=s.source_id
      where r.profile_revision_id=v_tailoring_revision and r.kind in ('include','exclude')
    )
    select coalesce(jsonb_agg(jsonb_build_object('controlId',control_id,'action',kind,
               'rationale',coalesce(nullif(btrim(rationale),''),'Carried from the program tailoring.'))
             order by public.wizard_control_order(source_id),control_id) filter (where (kind='include')<>(control_id=any(v_base_ids))),'[]'::jsonb),
           coalesce(jsonb_agg(code order by public.wizard_control_order(source_id)) filter (where kind='include' and control_id=any(v_base_ids)),'[]'::jsonb),
           coalesce(jsonb_agg(code order by public.wizard_control_order(source_id)) filter (where kind='exclude' and not control_id=any(v_base_ids)),'[]'::jsonb)
      into v_decisions,v_already,v_not_in
      from rules;
    select coalesce(array_agg(c.id),'{}') into v_selected from public.controls c
      where c.catalog_revision_id=v_choice.catalog_revision_id
        and (c.id=any(v_base_ids) or exists(select 1 from jsonb_array_elements(v_decisions) d where d.value->>'action'='include' and (d.value->>'controlId')::uuid=c.id))
        and not exists(select 1 from jsonb_array_elements(v_decisions) d where d.value->>'action'='exclude' and (d.value->>'controlId')::uuid=c.id);
    select coalesce(jsonb_agg(jsonb_build_object('parameterId',p.id,
               'values',(select jsonb_agg(v.value order by v.ordinal) from public.profile_parameter_values v where v.setting_id=s.id),
               'rationale',coalesce(nullif(btrim(s.rationale),''),'Carried from the program tailoring.'))
             order by public.wizard_control_order(p.source_id)) filter (where p.control_id=any(v_selected)),'[]'::jsonb),
           coalesce(jsonb_agg(p.source_id order by public.wizard_control_order(p.source_id)) filter (where p.control_id is null or not p.control_id=any(v_selected)),'[]'::jsonb)
      into v_parameters,v_dropped
      from public.profile_parameter_settings s
      join public.parameters p on p.catalog_revision_id=v_choice.catalog_revision_id and p.source_id=s.parameter_source_id
      where s.profile_revision_id=v_tailoring_revision
        and exists(select 1 from public.profile_parameter_values v where v.setting_id=s.id);
    v_tailored:=jsonb_array_length(v_decisions)>0 or jsonb_array_length(v_parameters)>0;
    if v_tailored then
      v_top:=public.author_tailored_profile(p_tenant_id,v_choice.catalog_revision_id,v_top,v_decisions,v_parameters,
        v_program_code||'/baselines/'||p_request_id::text||'/tailoring',coalesce(v_tailoring_title,'Program tailoring — '||v_program_code),
        'Program tailoring carried onto a changed overlay stack.');
    end if;
  end if;

  if exists(select 1 from public.program_reference_choices c where c.tenant_id=p_tenant_id and c.program_id=v_program_id and c.profile_resolution_id=v_top and c.id<>v_choice.id) then
    raise exception 'Another program profile of this program already adopts this control baseline' using errcode='23514';
  end if;
  v_previous:=v_choice.profile_resolution_id;
  update public.program_reference_choices set profile_resolution_id=v_top,revision=revision+1 where id=v_choice.id returning * into v_choice;

  -- The program's systems that adopt the old top adopt the new one.
  with moved as (
    update public.systems s set adopted_profile_resolution_id=v_top,revision=s.revision+1
    where s.tenant_id=p_tenant_id and s.program_id=v_program_id and s.adopted_profile_resolution_id=v_previous
    returning s.id,s.code
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'code',m.code) order by m.code),'[]'::jsonb) into v_moved from moved m;
  -- The SSP revisions written against the old top keep it.
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'systemId',r.system_id,'systemCode',s.code,'version',r.version_number,'state',r.state)
           order by s.code,r.version_number),'[]'::jsonb) into v_ssps
    from public.ssp_revisions r join public.systems s on s.tenant_id=r.tenant_id and s.id=r.system_id
    where r.tenant_id=p_tenant_id and s.program_id=v_program_id and r.profile_resolution_id=v_previous;

  select count(*)::integer into v_after from public.selected_controls where profile_resolution_id=v_top;
  select count(*)::integer into v_added from public.selected_controls n where n.profile_resolution_id=v_top
    and not exists(select 1 from public.selected_controls o where o.profile_resolution_id=v_previous and o.control_id=n.control_id);
  select count(*)::integer into v_removed from public.selected_controls o where o.profile_resolution_id=v_previous
    and not exists(select 1 from public.selected_controls n where n.profile_resolution_id=v_top and n.control_id=o.control_id);
  v_result:=jsonb_build_object('choiceId',v_choice.id,'programId',v_program_id,'changed',true,
    'profileResolutionId',v_top,'previousProfileResolutionId',v_previous,'revision',v_choice.revision,'overlayIds',to_jsonb(v_requested),
    'controls',jsonb_build_object('before',v_before,'after',v_after,'added',v_added,'removed',v_removed),
    'tailoring',case when v_tailoring is null then null else jsonb_build_object('authored',v_tailored,
      'decisions',jsonb_array_length(v_decisions),'parameters',jsonb_array_length(v_parameters),
      'alreadySelected',v_already,'notInBaseline',v_not_in,'parametersDropped',v_dropped) end,
    'systems',v_moved,'ssps',v_ssps);
  insert into public.program_baseline_requests(id,tenant_id,choice_id,payload_sha256,result,created_by)
    values(p_request_id,p_tenant_id,p_choice_id,v_hash,v_result,auth.uid());
  return v_result;
end; $$;
revoke all on function public.set_program_baseline_overlays(uuid,uuid,bigint,uuid,jsonb) from public,anon;
grant execute on function public.set_program_baseline_overlays(uuid,uuid,bigint,uuid,jsonb) to authenticated;
comment on function public.set_program_baseline_overlays(uuid,uuid,bigint,uuid,jsonb) is 'Change the overlays of one program profile''s control baseline (program_reference_choices row p_choice_id, at the revision the reader saw), in the order they apply, bottom up, at most six. The layers the new order shares with the old one from the bottom are kept; each overlay after them is applied to what is beneath it; the program''s tailoring is authored again last, with the decisions and parameter values that still change something; the choice moves to the new top, and so do the program''s systems that adopted the old top. SSP revisions keep the resolution they were written against. The same overlays in the same order write nothing. Idempotent per request id.';

-- ---------------------------------------------------------------------------------------------
-- Delete a draft overlay that no program's stack applies.
-- ---------------------------------------------------------------------------------------------
create function public.delete_control_overlay(p_tenant_id uuid,p_overlay_id uuid,p_expected_revision bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_overlay public.control_overlays;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  select * into v_overlay from public.control_overlays where id=p_overlay_id for update;
  -- Already gone: a request sent again changes nothing.
  if v_overlay.id is null then return false; end if;
  if v_overlay.tenant_id<>p_tenant_id then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
  if exists(select 1 from public.profile_overlay_applications a where a.overlay_id=p_overlay_id) then
    raise exception 'A program''s control baseline applies %, so it cannot be deleted',v_overlay.title using errcode='23514';
  end if;
  if v_overlay.state='published' then raise exception 'A published overlay cannot be deleted' using errcode='23514'; end if;
  if v_overlay.revision is distinct from p_expected_revision then raise exception 'This overlay changed. Reload it before deleting it.' using errcode='PT409'; end if;
  delete from public.control_overlay_decisions where overlay_id=p_overlay_id;
  delete from public.control_overlays where id=p_overlay_id;
  return true;
end; $$;
revoke all on function public.delete_control_overlay(uuid,uuid,bigint) from public,anon;
grant execute on function public.delete_control_overlay(uuid,uuid,bigint) to authenticated;
comment on function public.delete_control_overlay(uuid,uuid,bigint) is 'Delete a draft overlay and its decisions at the revision the reader saw. A published overlay, or one a program''s stack applies, is refused. An overlay already gone answers false, so a request sent again changes nothing.';
