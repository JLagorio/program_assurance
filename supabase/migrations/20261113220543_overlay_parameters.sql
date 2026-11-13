-- Parameter values in an overlay. An overlay decides on controls (adds, removes) and may also set
-- the values of parameters, each with its rationale: an organization-defined frequency, a role, a
-- technique for SA-24. Applying the overlay authors its layer with those values as the layer's own
-- profile_parameter_settings and profile_parameter_values, so a value is effective as
-- author_tailored_profile resolves it: the nearest layer of the stack that sets the parameter, else
-- the catalog's own (program_control_parameters and program_resiliency_choice read it there).
--
--   * A value is set only for a parameter of a control of the overlay's catalog edition. A choice
--     parameter takes a published choice, and one that takes one value takes exactly one, as the
--     tailoring does, so applying never fails on a value the overlay accepted.
--   * Applied, a value for a control the layer selects becomes a setting of the layer; a value for
--     a control the layer leaves out sets nothing, and is recorded beside the layer, as a removal
--     of a control the base does not select is (not_applicable_parameter_ids).
--   * An overlay that changes nothing where it is applied, no control added or removed and no value
--     set, is refused, as before.
--   * A published overlay's values are immutable like its decisions; publishing needs a decision or
--     a value; deleting a draft deletes its values.
-- See docs/control-baseline.md.

-- ---------------------------------------------------------------------------------------------
-- An overlay's parameter values. Written only through set_control_overlay_parameters.
-- ---------------------------------------------------------------------------------------------
create table public.control_overlay_parameters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  overlay_id uuid not null,
  parameter_id uuid not null references public.parameters(id),
  parameter_values text[] not null check (cardinality(parameter_values) between 1 and 100),
  rationale text not null check (length(btrim(rationale)) between 1 and 10000),
  unique (tenant_id,id),
  unique (overlay_id,parameter_id),
  foreign key (tenant_id,overlay_id) references public.control_overlays(tenant_id,id) on delete cascade
);
select public.apply_tenant_security('control_overlay_parameters');
select public.attach_record_lifecycle('control_overlay_parameters',false);
select public.attach_parent_immutability('control_overlay_parameters','control_overlays','overlay_id');
select public.attach_reference_tenant_guard('control_overlay_parameters','parameter_id','parameters');
revoke insert,update,delete on public.control_overlay_parameters from authenticated;
comment on table public.control_overlay_parameters is 'One parameter value set of an overlay: the values a layer the overlay makes gives the parameter, in order, and why. Immutable once the overlay is published.';
comment on column public.control_overlay_parameters.parameter_values is 'The values in order, as an OSCAL set-parameter assigns them: text, a published choice for a choice parameter.';

alter table public.profile_overlay_applications
  add column not_applicable_parameter_ids uuid[] not null default '{}';
comment on column public.profile_overlay_applications.not_applicable_parameter_ids is 'Parameters the overlay sets whose controls the layer does not select, so it set nothing for them.';

-- The register's derived columns, with how many parameters the overlay sets.
create or replace view public.control_overlay_rows with (security_invoker=true) as
select o.id,o.tenant_id,o.catalog_revision_id,o.code,o.title,o.description,o.state,o.revision,o.created_at,o.updated_at,
  (select count(*)::integer from public.control_overlay_decisions d where d.overlay_id=o.id and d.action='include') as include_count,
  (select count(*)::integer from public.control_overlay_decisions d where d.overlay_id=o.id and d.action='exclude') as exclude_count,
  (select count(*)::integer from public.profile_overlay_applications a where a.overlay_id=o.id) as application_count,
  (select count(*)::integer from public.control_overlay_parameters p where p.overlay_id=o.id) as parameter_count
from public.control_overlays o;
comment on view public.control_overlay_rows is 'Each overlay with the controls it adds and removes and the parameters it sets counted, and how many baselines apply it.';

-- ---------------------------------------------------------------------------------------------
-- The values one parameter takes, checked as author_tailored_profile checks a tailoring's: text,
-- trimmed, one to a hundred of them; a published choice where the parameter offers literal choices;
-- exactly one where it takes one. Returns them trimmed, in order.
-- ---------------------------------------------------------------------------------------------
create function public.overlay_parameter_values(p_parameter public.parameters,p_values jsonb)
returns text[] language plpgsql stable security definer set search_path='' as $$
declare v_values text[]; v_value text;
begin
  if jsonb_typeof(p_values) is distinct from 'array' or jsonb_array_length(p_values) not between 1 and 100 then
    raise exception 'Enter at least one value for %',p_parameter.source_id using errcode='23514';
  end if;
  if exists(select 1 from jsonb_array_elements(p_values) v where jsonb_typeof(v)<>'string') then
    raise exception 'Parameter values must be text' using errcode='23514';
  end if;
  select array_agg(btrim(v.value) order by v.ordinality) into v_values from jsonb_array_elements_text(p_values) with ordinality v(value,ordinality);
  foreach v_value in array v_values loop
    if length(v_value) not between 1 and 10000 then raise exception 'Parameter values cannot be empty' using errcode='23514'; end if;
    if p_parameter.has_selection and exists(select 1 from public.parameter_choices c where c.parameter_id=p_parameter.id)
      and not exists(select 1 from public.parameter_choices c where c.parameter_id=p_parameter.id and c.value ~ '(\{\{|<[^>]+>)')
      and not exists(select 1 from public.parameter_choices c where c.parameter_id=p_parameter.id and c.value=v_value) then
      raise exception 'Choose a published option for %',p_parameter.source_id using errcode='23514';
    end if;
  end loop;
  if p_parameter.has_selection and coalesce(p_parameter.selection_count::text,'one')='one' and cardinality(v_values)<>1 then
    raise exception '% takes exactly one value',p_parameter.source_id using errcode='23514';
  end if;
  return v_values;
end; $$;
revoke all on function public.overlay_parameter_values(public.parameters,jsonb) from public,anon,authenticated;
comment on function public.overlay_parameter_values(public.parameters,jsonb) is 'Internal: check and trim the values an overlay gives one parameter, as author_tailored_profile checks a tailoring''s.';

-- ---------------------------------------------------------------------------------------------
-- Record or replace a draft overlay's values for the named parameters and remove the values of
-- others, in one transaction at the revision the reader saw.
-- ---------------------------------------------------------------------------------------------
create function public.set_control_overlay_parameters(p_tenant_id uuid,p_overlay_id uuid,p_expected_revision bigint,p_parameters jsonb,p_removed jsonb)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_overlay public.control_overlays; v_item jsonb; v_parameter public.parameters; v_values text[]; v_seen uuid[]:='{}'; v_applied boolean;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if jsonb_typeof(p_parameters) is distinct from 'array' or jsonb_typeof(p_removed) is distinct from 'array'
    or jsonb_array_length(p_parameters)+jsonb_array_length(p_removed) not between 1 and 5000
    or exists(select 1 from jsonb_array_elements(p_parameters) i where jsonb_typeof(i.value)<>'object')
    or exists(select 1 from jsonb_array_elements(p_removed) r where jsonb_typeof(r.value)<>'string'
      or (r.value#>>'{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or exists(select 1 from jsonb_array_elements(p_parameters) i where coalesce(i.value->>'parameterId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
    raise exception 'Choose the parameters this overlay sets' using errcode='23514';
  end if;
  select * into v_overlay from public.control_overlays where tenant_id=p_tenant_id and id=p_overlay_id for update;
  if v_overlay.id is null then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
  -- A repeat of a save that landed: every value set already holds its values and rationale, and
  -- every removal is gone.
  select not exists(select 1 from jsonb_array_elements(p_parameters) item where not exists(
      select 1 from public.control_overlay_parameters p where p.overlay_id=p_overlay_id and p.parameter_id=(item.value->>'parameterId')::uuid
        and jsonb_typeof(item.value->'values')='array'
        and to_jsonb(p.parameter_values)=(select coalesce(jsonb_agg(btrim(v.value) order by v.ordinality),'[]'::jsonb)
          from jsonb_array_elements_text(item.value->'values') with ordinality v(value,ordinality))
        and p.rationale=btrim(item.value->>'rationale')))
    and not exists(select 1 from public.control_overlay_parameters p where p.overlay_id=p_overlay_id and p.parameter_id in (select value::uuid from jsonb_array_elements_text(p_removed)))
    into v_applied;
  if v_applied then return v_overlay; end if;
  if v_overlay.state='published' then raise exception 'A published overlay cannot change. Create its next version instead.' using errcode='23514'; end if;
  if v_overlay.revision is distinct from p_expected_revision then raise exception 'This overlay changed. Reload it before saving.' using errcode='PT409'; end if;
  for v_item in select value from jsonb_array_elements(p_parameters) loop
    select * into v_parameter from public.parameters where id=(v_item->>'parameterId')::uuid and catalog_revision_id=v_overlay.catalog_revision_id;
    if v_parameter.id is null or v_parameter.control_id is null then
      raise exception 'Choose parameters of controls in the overlay''s catalog edition' using errcode='23514';
    end if;
    if v_parameter.id=any(v_seen) then raise exception 'Record one value set per parameter' using errcode='23514'; end if;
    v_seen:=array_append(v_seen,v_parameter.id);
    v_values:=public.overlay_parameter_values(v_parameter,v_item->'values');
    perform public.wizard_required_text(v_item,'rationale');
    insert into public.control_overlay_parameters(tenant_id,overlay_id,parameter_id,parameter_values,rationale)
      values(p_tenant_id,p_overlay_id,v_parameter.id,v_values,btrim(v_item->>'rationale'))
      on conflict (overlay_id,parameter_id) do update set parameter_values=excluded.parameter_values,rationale=excluded.rationale,
        revision=public.control_overlay_parameters.revision+1;
  end loop;
  delete from public.control_overlay_parameters where overlay_id=p_overlay_id and parameter_id in (select value::uuid from jsonb_array_elements_text(p_removed));
  update public.control_overlays set revision=revision+1 where id=p_overlay_id returning * into v_overlay;
  return v_overlay;
end; $$;
revoke all on function public.set_control_overlay_parameters(uuid,uuid,bigint,jsonb,jsonb) from public,anon;
grant execute on function public.set_control_overlay_parameters(uuid,uuid,bigint,jsonb,jsonb) to authenticated;
comment on function public.set_control_overlay_parameters(uuid,uuid,bigint,jsonb,jsonb) is 'Record or replace a draft overlay''s values for the named parameters (parameterId, values in order, rationale) and remove the values of others (p_removed, parameter ids), in one transaction at the revision the reader saw. A parameter of a control of the overlay''s catalog edition; a choice parameter takes a published choice and one that takes one value exactly one. A repeat of a save that landed returns the overlay.';

-- ---------------------------------------------------------------------------------------------
-- Publishing needs a decision or a value; deleting a draft deletes its values too.
-- ---------------------------------------------------------------------------------------------
create or replace function public.publish_control_overlay(p_tenant_id uuid,p_overlay_id uuid,p_expected_revision bigint)
returns public.control_overlays language plpgsql security definer set search_path='' as $$
declare v_overlay public.control_overlays;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  select * into v_overlay from public.control_overlays where tenant_id=p_tenant_id and id=p_overlay_id for update;
  if v_overlay.id is null then raise exception 'Overlay was not found in this workspace' using errcode='23514'; end if;
  if v_overlay.state='published' then return v_overlay; end if;
  if v_overlay.revision is distinct from p_expected_revision then raise exception 'This overlay changed. Reload it before publishing.' using errcode='PT409'; end if;
  if not exists(select 1 from public.control_overlay_decisions where overlay_id=p_overlay_id)
    and not exists(select 1 from public.control_overlay_parameters where overlay_id=p_overlay_id) then
    raise exception 'Record a control decision or a parameter value before publishing' using errcode='23514';
  end if;
  update public.control_overlays set state='published',revision=revision+1 where id=p_overlay_id returning * into v_overlay;
  return v_overlay;
end; $$;
comment on function public.publish_control_overlay(uuid,uuid,bigint) is 'Freeze a draft overlay, its decisions and its parameter values, so programs can apply it. It needs a decision or a value. Publishing twice returns the published overlay.';

create or replace function public.delete_control_overlay(p_tenant_id uuid,p_overlay_id uuid,p_expected_revision bigint)
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
  delete from public.control_overlay_parameters where overlay_id=p_overlay_id;
  delete from public.control_overlays where id=p_overlay_id;
  return true;
end; $$;
comment on function public.delete_control_overlay(uuid,uuid,bigint) is 'Delete a draft overlay, its decisions and its parameter values at the revision the reader saw. A published overlay, or one a program''s stack applies, is refused. An overlay already gone answers false, so a request sent again changes nothing.';

-- ---------------------------------------------------------------------------------------------
-- Apply one overlay to a baseline: the decisions that change it and the values of the parameters
-- of the controls the layer selects become a layered profile. An add the baseline already selects
-- is a reaffirmation, a removal it does not select and a value for a control the layer leaves out
-- are not applicable, and an overlay that changes nothing is refused.
-- ---------------------------------------------------------------------------------------------
create or replace function public.apply_control_overlay(p_tenant_id uuid,p_catalog_id uuid,p_base_resolution_id uuid,p_overlay_id uuid,p_code text,p_title text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_overlay public.control_overlays; v_base_ids uuid[]; v_decisions jsonb; v_reaffirmed uuid[]; v_skipped uuid[];
  v_selected uuid[]; v_parameters jsonb; v_unset uuid[]; v_resolution uuid;
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
  -- The controls the layer selects: the base's, with what the decisions add and without what they remove.
  v_selected:=array(select x from unnest(v_base_ids) x where not exists(select 1 from jsonb_array_elements(v_decisions) d where d.value->>'action'='exclude' and (d.value->>'controlId')::uuid=x)
    union select (d.value->>'controlId')::uuid from jsonb_array_elements(v_decisions) d where d.value->>'action'='include');
  select coalesce(jsonb_agg(jsonb_build_object('parameterId',p.parameter_id,'values',to_jsonb(p.parameter_values),'rationale',p.rationale)
             order by public.wizard_control_order(k.source_id),k.id) filter (where k.control_id=any(v_selected)),'[]'::jsonb),
         coalesce(array_agg(p.parameter_id order by p.parameter_id) filter (where k.control_id is null or not k.control_id=any(v_selected)),'{}')
    into v_parameters,v_unset
    from public.control_overlay_parameters p join public.parameters k on k.id=p.parameter_id
    where p.overlay_id=p_overlay_id;
  if jsonb_array_length(v_decisions)=0 and jsonb_array_length(v_parameters)=0 then
    raise exception '% changes nothing on this baseline. Remove it from the stack.',v_overlay.title using errcode='23514';
  end if;
  v_resolution:=public.author_tailored_profile(p_tenant_id,p_catalog_id,p_base_resolution_id,v_decisions,v_parameters,p_code,p_title,'Overlay '||v_overlay.code||' ('||v_overlay.title||') applied to its base.');
  insert into public.profile_overlay_applications(tenant_id,profile_resolution_id,overlay_id,reaffirmed_control_ids,not_applicable_control_ids,not_applicable_parameter_ids)
    values(p_tenant_id,v_resolution,p_overlay_id,v_reaffirmed,v_skipped,v_unset);
  return v_resolution;
end; $$;
revoke all on function public.apply_control_overlay(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
comment on function public.apply_control_overlay(uuid,uuid,uuid,uuid,text,text) is 'Internal: author the layered profile one published overlay makes of a base resolution, with its decisions that change the base and the values of its parameters whose controls the layer selects as the layer''s own settings, and record which overlay it was, which of its decisions were already true and which of its values set nothing.';
